from __future__ import annotations

import base64
import json
import secrets
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from backend.app.config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_FRONTEND_SUCCESS_URL,
    GOOGLE_REDIRECT_URI,
)
from backend.app.services.repository import CampaignRepository


GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
GMAIL_SCOPES = [
    "openid",
    "email",
    "https://www.googleapis.com/auth/gmail.send",
]


class GmailOAuthService:
    def __init__(self, repository: CampaignRepository) -> None:
        self.repository = repository

    @property
    def configured(self) -> bool:
        return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI)

    def build_authorization_url(self, redirect_to: str | None = None) -> str:
        if not self.configured:
            raise ValueError("Google OAuth is not configured.")
        state = secrets.token_urlsafe(24)
        final_redirect = redirect_to or GOOGLE_FRONTEND_SUCCESS_URL
        self.repository.create_oauth_state(state, "gmail", final_redirect)
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(GMAIL_SCOPES),
            "access_type": "offline",
            "include_granted_scopes": "true",
            "prompt": "consent",
            "state": state,
        }
        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    def handle_callback(self, code: str, state: str) -> str:
        redirect_to = self.repository.consume_oauth_state(state, "gmail")
        if not redirect_to:
            raise ValueError("Invalid or expired OAuth state.")
        token_payload = self._exchange_code(code)
        userinfo = self._get_userinfo(token_payload["access_token"])
        expires_at = self._compute_expiry(token_payload.get("expires_in"))
        self.repository.upsert_oauth_token(
            provider="gmail",
            email=userinfo.get("email"),
            access_token=token_payload["access_token"],
            refresh_token=token_payload.get("refresh_token"),
            token_type=token_payload.get("token_type"),
            scope=token_payload.get("scope"),
            expires_at=expires_at,
            raw_json=json.dumps(token_payload, ensure_ascii=False),
        )
        separator = "&" if "?" in redirect_to else "?"
        return f"{redirect_to}{separator}gmail=connected"

    def get_status(self) -> dict:
        token = self.repository.get_oauth_token("gmail")
        if not token:
            return {"connected": False, "email": None, "expires_at": None, "scopes": []}
        scopes = token["scope"].split() if token.get("scope") else []
        return {
            "connected": True,
            "email": token.get("email"),
            "expires_at": token.get("expires_at"),
            "scopes": scopes,
        }

    def disconnect(self) -> None:
        self.repository.delete_oauth_token("gmail")

    def send_message(self, *, to_email: str, subject: str, body: str) -> None:
        token = self.repository.get_oauth_token("gmail")
        if not token:
            raise ValueError("Gmail is not connected.")
        access_token = self._ensure_access_token(token)
        email = EmailMessage()
        from_email = token.get("email") or "me"
        email["To"] = to_email
        email["From"] = from_email
        email["Subject"] = subject
        email.set_content(body)
        raw = base64.urlsafe_b64encode(email.as_bytes()).decode("utf-8")
        self._post_json(GMAIL_SEND_URL, {"raw": raw}, access_token=access_token)

    def _ensure_access_token(self, token: dict) -> str:
        if token.get("expires_at"):
            expires_at = datetime.fromisoformat(token["expires_at"])
            if expires_at - datetime.now(timezone.utc) > timedelta(seconds=60):
                return token["access_token"]
        refresh_token = token.get("refresh_token")
        if not refresh_token:
            return token["access_token"]
        refreshed = self._refresh_access_token(refresh_token)
        expires_at = self._compute_expiry(refreshed.get("expires_in"))
        self.repository.upsert_oauth_token(
            provider="gmail",
            email=token.get("email"),
            access_token=refreshed["access_token"],
            refresh_token=refresh_token,
            token_type=refreshed.get("token_type"),
            scope=refreshed.get("scope", token.get("scope")),
            expires_at=expires_at,
            raw_json=json.dumps(refreshed, ensure_ascii=False),
        )
        return refreshed["access_token"]

    def _exchange_code(self, code: str) -> dict:
        data = urlencode(
            {
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
        ).encode("utf-8")
        request = Request(
            GOOGLE_TOKEN_URL,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        return self._read_json(request)

    def _refresh_access_token(self, refresh_token: str) -> dict:
        data = urlencode(
            {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            }
        ).encode("utf-8")
        request = Request(
            GOOGLE_TOKEN_URL,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        return self._read_json(request)

    def _get_userinfo(self, access_token: str) -> dict:
        request = Request(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
        return self._read_json(request)

    def _post_json(self, url: str, payload: dict, *, access_token: str) -> dict:
        request = Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
            },
            method="POST",
        )
        return self._read_json(request)

    def _read_json(self, request: Request) -> dict:
        try:
            with urlopen(request, timeout=40) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:  # pragma: no cover - external dependency
            detail = exc.read().decode("utf-8", errors="ignore")
            raise ValueError(detail or f"Google request failed with {exc.code}") from exc
        except URLError as exc:  # pragma: no cover - external dependency
            raise ValueError(str(exc)) from exc

    def _compute_expiry(self, expires_in: int | str | None) -> str | None:
        if expires_in is None:
            return None
        return (datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))).isoformat()
