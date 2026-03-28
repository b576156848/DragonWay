from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.app.config import DATABASE_PATH


class LeadStore:
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
                CREATE TABLE IF NOT EXISTS newa_leads (
                    lead_id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    company TEXT,
                    source_mode TEXT,
                    form_data_json TEXT,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def create_lead(
        self,
        *,
        email: str,
        company: str | None,
        source_mode: str | None,
        form_data: dict[str, Any] | None,
    ) -> str:
        lead_id = f"lead_{uuid.uuid4().hex[:10]}"
        created_at = datetime.now(timezone.utc).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT INTO newa_leads (
                    lead_id, email, company, source_mode, form_data_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    lead_id,
                    email,
                    company,
                    source_mode,
                    json.dumps(form_data, ensure_ascii=False) if form_data else None,
                    created_at,
                ),
            )
            conn.commit()
        return lead_id
