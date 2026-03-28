from __future__ import annotations

import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

from backend.app.config import (
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_USE_TLS,
)
from backend.app.schemas.campaign import (
    OutreachDraft,
    OutreachSendItemResult,
    OutreachSendRequest,
    OutreachSendResponse,
)
from backend.app.services.google_oauth import GmailOAuthService


@dataclass
class SMTPConfig:
    host: str
    port: int
    username: str
    password: str
    use_tls: bool
    from_email: str
    from_name: str


class EmailSender:
    def __init__(self, gmail_oauth: GmailOAuthService | None = None) -> None:
        self.gmail_oauth = gmail_oauth

    def send(self, campaign_id: str, drafts: list[OutreachDraft], request: OutreachSendRequest) -> OutreachSendResponse:
        selected = self._select_drafts(drafts, request.draft_indices)
        if request.mode == "mock":
            return OutreachSendResponse(
                campaign_id=campaign_id,
                mode="mock",
                results=[
                    OutreachSendItemResult(
                        kol_name=draft.kol_name,
                        email=draft.email,
                        status="mocked",
                        detail="Mock send completed. No email was actually sent.",
                    )
                    for draft in selected
                ],
            )

        if request.mode == "gmail_oauth":
            if self.gmail_oauth is None:
                raise ValueError("Gmail OAuth service is not configured.")
            results: list[OutreachSendItemResult] = []
            for draft in selected:
                try:
                    self.gmail_oauth.send_message(to_email=draft.email, subject=draft.subject, body=draft.body)
                    results.append(
                        OutreachSendItemResult(
                            kol_name=draft.kol_name,
                            email=draft.email,
                            status="sent",
                            detail="Sent using connected Gmail account.",
                        )
                    )
                except Exception as exc:  # pragma: no cover - external dependency
                    results.append(
                        OutreachSendItemResult(
                            kol_name=draft.kol_name,
                            email=draft.email,
                            status="failed",
                            detail=str(exc),
                        )
                    )
            return OutreachSendResponse(campaign_id=campaign_id, mode="gmail_oauth", results=results)

        config = self._resolve_config(request)
        results: list[OutreachSendItemResult] = []
        for draft in selected:
            try:
                self._send_smtp(config, draft)
                results.append(
                    OutreachSendItemResult(
                        kol_name=draft.kol_name,
                        email=draft.email,
                        status="sent",
                        detail=f"Sent via SMTP as {config.from_email}.",
                    )
                )
            except Exception as exc:  # pragma: no cover - network/SMTP dependent
                results.append(
                    OutreachSendItemResult(
                        kol_name=draft.kol_name,
                        email=draft.email,
                        status="failed",
                        detail=str(exc),
                    )
                )

        return OutreachSendResponse(campaign_id=campaign_id, mode=request.mode, results=results)

    def _select_drafts(self, drafts: list[OutreachDraft], indices: list[int]) -> list[OutreachDraft]:
        if not indices:
            return drafts
        selected: list[OutreachDraft] = []
        for index in indices:
            if 0 <= index < len(drafts):
                selected.append(drafts[index])
        return selected

    def _resolve_config(self, request: OutreachSendRequest) -> SMTPConfig:
        if request.mode == "env_smtp":
            if not all([SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL]):
                raise ValueError("SMTP environment variables are incomplete.")
            return SMTPConfig(
                host=SMTP_HOST,
                port=SMTP_PORT,
                username=SMTP_USERNAME,
                password=SMTP_PASSWORD,
                use_tls=SMTP_USE_TLS,
                from_email=SMTP_FROM_EMAIL,
                from_name=request.sender_name or SMTP_FROM_NAME,
            )

        if request.mode == "custom_smtp":
            if not all([request.smtp_host, request.smtp_username, request.smtp_password, request.sender_email]):
                raise ValueError("Custom SMTP mode requires host, username, password, and sender_email.")
            return SMTPConfig(
                host=request.smtp_host,
                port=request.smtp_port or 587,
                username=request.smtp_username,
                password=request.smtp_password,
                use_tls=True if request.smtp_use_tls is None else request.smtp_use_tls,
                from_email=request.sender_email,
                from_name=request.sender_name or request.sender_email,
            )

        raise ValueError(f"Unsupported email mode: {request.mode}")

    def _send_smtp(self, config: SMTPConfig, draft: OutreachDraft) -> None:
        message = EmailMessage()
        message["Subject"] = draft.subject
        message["From"] = f"{config.from_name} <{config.from_email}>"
        message["To"] = draft.email
        message.set_content(draft.body)

        with smtplib.SMTP(config.host, config.port, timeout=30) as smtp:
            smtp.ehlo()
            if config.use_tls:
                smtp.starttls()
                smtp.ehlo()
            smtp.login(config.username, config.password)
            smtp.send_message(message)
