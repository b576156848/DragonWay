from __future__ import annotations

import json
import sqlite3
import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.app.config import DATABASE_PATH


@dataclass
class NewASessionRow:
    session_id: str
    source_mode: str
    current_step: str
    form_data_json: str | None
    product_json: str | None
    parse_json: str | None
    preview_kols_json: str | None
    preview_audience_json: str | None
    refined_kols_json: str | None
    refined_audience_json: str | None
    created_at: str
    updated_at: str


class NewASessionStore:
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
                CREATE TABLE IF NOT EXISTS newa_sessions (
                    session_id TEXT PRIMARY KEY,
                    source_mode TEXT NOT NULL,
                    current_step TEXT NOT NULL,
                    form_data_json TEXT,
                    product_json TEXT,
                    parse_json TEXT,
                    preview_kols_json TEXT,
                    preview_audience_json TEXT,
                    refined_kols_json TEXT,
                    refined_audience_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def create_session(self, source_mode: str = "quick") -> str:
        session_id = f"newa_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        with self._lock, self._connect() as conn:
            conn.execute(
                """
                INSERT INTO newa_sessions (
                    session_id, source_mode, current_step, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (session_id, source_mode, "created", now, now),
            )
            conn.commit()
        return session_id

    def get_session(self, session_id: str) -> NewASessionRow | None:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT
                    session_id, source_mode, current_step, form_data_json, product_json,
                    parse_json, preview_kols_json, preview_audience_json,
                    refined_kols_json, refined_audience_json, created_at, updated_at
                FROM newa_sessions
                WHERE session_id = ?
                """,
                (session_id,),
            ).fetchone()
        return NewASessionRow(**dict(row)) if row else None

    def ensure_session(self, session_id: str | None, *, source_mode: str = "quick") -> str:
        if session_id:
            existing = self.get_session(session_id)
            if existing is not None:
                return session_id
        return self.create_session(source_mode=source_mode)

    def update_session(self, session_id: str, **fields: Any) -> None:
        if not fields:
            return

        serialized: dict[str, Any] = {}
        for key, value in fields.items():
            if value is None or isinstance(value, (str, int, float)):
                serialized[key] = value
            else:
                serialized[key] = json.dumps(value, ensure_ascii=False)

        serialized["updated_at"] = datetime.now(timezone.utc).isoformat()
        columns = ", ".join(f"{key} = ?" for key in serialized)
        values = list(serialized.values()) + [session_id]

        with self._lock, self._connect() as conn:
            conn.execute(f"UPDATE newa_sessions SET {columns} WHERE session_id = ?", values)
            conn.commit()
