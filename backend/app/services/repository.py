from __future__ import annotations

import json
import sqlite3
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from backend.app.config import DATABASE_PATH


@dataclass
class CampaignRow:
    campaign_id: str
    status: str
    current_step: str
    created_at: str
    questionnaire_json: str
    result_json: Optional[str]
    error_message: Optional[str]


class CampaignRepository:
    def __init__(self, database_path: Path = DATABASE_PATH) -> None:
        self.database_path = database_path
        self._lock = threading.Lock()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.database_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS campaigns (
                    campaign_id TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    current_step TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    questionnaire_json TEXT NOT NULL,
                    result_json TEXT,
                    error_message TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS oauth_states (
                    state TEXT PRIMARY KEY,
                    provider TEXT NOT NULL,
                    redirect_to TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS oauth_tokens (
                    provider TEXT PRIMARY KEY,
                    email TEXT,
                    access_token TEXT NOT NULL,
                    refresh_token TEXT,
                    token_type TEXT,
                    scope TEXT,
                    expires_at TEXT,
                    raw_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def create_campaign(self, campaign_id: str, questionnaire: dict[str, Any]) -> None:
        created_at = datetime.now(timezone.utc).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT INTO campaigns (
                    campaign_id, status, current_step, created_at, questionnaire_json, result_json, error_message
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    campaign_id,
                    "analyzing",
                    "extract",
                    created_at,
                    json.dumps(questionnaire, ensure_ascii=False),
                    None,
                    None,
                ),
            )
            conn.commit()

    def update_progress(self, campaign_id: str, *, status: Optional[str] = None, current_step: Optional[str] = None) -> None:
        updates: list[str] = []
        values: list[Any] = []
        if status is not None:
            updates.append("status = ?")
            values.append(status)
        if current_step is not None:
            updates.append("current_step = ?")
            values.append(current_step)
        if not updates:
            return

        values.append(campaign_id)
        with self._lock, self._connect() as conn:
            conn.execute(f"UPDATE campaigns SET {', '.join(updates)} WHERE campaign_id = ?", values)
            conn.commit()

    def set_result(self, campaign_id: str, result: dict[str, Any]) -> None:
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                UPDATE campaigns
                SET status = ?, current_step = ?, result_json = ?, error_message = NULL
                WHERE campaign_id = ?
                """,
                ("ready", "push", json.dumps(result, ensure_ascii=False), campaign_id),
            )
            conn.commit()

    def set_error(self, campaign_id: str, message: str) -> None:
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                UPDATE campaigns
                SET status = ?, error_message = ?
                WHERE campaign_id = ?
                """,
                ("error", message, campaign_id),
            )
            conn.commit()

    def get_campaign(self, campaign_id: str) -> Optional[CampaignRow]:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT campaign_id, status, current_step, created_at, questionnaire_json, result_json, error_message
                FROM campaigns
                WHERE campaign_id = ?
                """,
                (campaign_id,),
            ).fetchone()
        if row is None:
            return None
        return CampaignRow(**dict(row))

    def create_oauth_state(self, state: str, provider: str, redirect_to: str) -> None:
        created_at = datetime.now(timezone.utc).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO oauth_states (state, provider, redirect_to, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (state, provider, redirect_to, created_at),
            )
            conn.commit()

    def consume_oauth_state(self, state: str, provider: str) -> Optional[str]:
        with self._lock, self._connect() as conn:
            row = conn.execute(
                "SELECT redirect_to FROM oauth_states WHERE state = ? AND provider = ?",
                (state, provider),
            ).fetchone()
            conn.execute("DELETE FROM oauth_states WHERE state = ?", (state,))
            conn.commit()
        return row["redirect_to"] if row else None

    def upsert_oauth_token(
        self,
        *,
        provider: str,
        email: Optional[str],
        access_token: str,
        refresh_token: Optional[str],
        token_type: Optional[str],
        scope: Optional[str],
        expires_at: Optional[str],
        raw_json: str,
    ) -> None:
        updated_at = datetime.now(timezone.utc).isoformat()
        with self._lock, self._connect() as conn:
            existing = conn.execute(
                "SELECT refresh_token FROM oauth_tokens WHERE provider = ?",
                (provider,),
            ).fetchone()
            refresh_value = refresh_token or (existing["refresh_token"] if existing else None)
            conn.execute(
                """
                INSERT INTO oauth_tokens (
                    provider, email, access_token, refresh_token, token_type, scope, expires_at, raw_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(provider) DO UPDATE SET
                    email = excluded.email,
                    access_token = excluded.access_token,
                    refresh_token = excluded.refresh_token,
                    token_type = excluded.token_type,
                    scope = excluded.scope,
                    expires_at = excluded.expires_at,
                    raw_json = excluded.raw_json,
                    updated_at = excluded.updated_at
                """,
                (
                    provider,
                    email,
                    access_token,
                    refresh_value,
                    token_type,
                    scope,
                    expires_at,
                    raw_json,
                    updated_at,
                ),
            )
            conn.commit()

    def get_oauth_token(self, provider: str) -> Optional[dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT provider, email, access_token, refresh_token, token_type, scope, expires_at, raw_json, updated_at
                FROM oauth_tokens
                WHERE provider = ?
                """,
                (provider,),
            ).fetchone()
        return dict(row) if row else None

    def delete_oauth_token(self, provider: str) -> None:
        with self._lock, self._connect() as conn:
            conn.execute("DELETE FROM oauth_tokens WHERE provider = ?", (provider,))
            conn.commit()
