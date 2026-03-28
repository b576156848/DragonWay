from __future__ import annotations

import json
import sqlite3
import threading
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.app.config import DATABASE_PATH, KOL_ASSET_PREFIX, KOL_DATA_PATH


PORTRAIT_OVERRIDES = {
    "real_001": "sweety-horse.png",
    "real_002": "tingting-border-collie.png",
    "real_003": "uu-xiaokeai.png",
    "real_004": "santotia.png",
    "real_005": "zhouhe-pet-nutritionist.png",
    "real_006": "wolixiang-daycare.png",
    "real_007": "keming.png",
    "real_008": "hahapi-no-eyes.png",
    "real_009": "wo-shi-bao-zi-ya.png",
    "real_010": "xiaohuahua-day.png",
}


class KOLStore:
    def __init__(self, database_path: Path = DATABASE_PATH, source_path: Path = KOL_DATA_PATH) -> None:
        self.database_path = database_path
        self.source_path = source_path
        self._lock = threading.Lock()
        self._init_db()
        self._sync_from_source()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.database_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS kol_profiles (
                    kol_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    tier TEXT NOT NULL,
                    profile_url TEXT,
                    avatar_url TEXT,
                    followers INTEGER NOT NULL,
                    engagement_rate REAL NOT NULL,
                    price_from INTEGER NOT NULL,
                    price_to INTEGER NOT NULL,
                    has_expert_background INTEGER NOT NULL,
                    category TEXT NOT NULL,
                    content_style TEXT NOT NULL,
                    best_for TEXT NOT NULL,
                    match_reason_template TEXT NOT NULL,
                    email TEXT,
                    pet_type_json TEXT NOT NULL,
                    audience_json TEXT NOT NULL,
                    tags_json TEXT NOT NULL,
                    raw_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def _sync_from_source(self) -> None:
        if not self.source_path.exists():
            return

        payload = json.loads(self.source_path.read_text(encoding="utf-8"))
        if not isinstance(payload, list):
            raise ValueError("real_kol_data.json must contain a list of KOL profiles.")

        rows = [self._normalize(item) for item in payload]
        updated_at = datetime.now(timezone.utc).isoformat()

        with self._lock, self._connect() as conn:
            conn.execute("DELETE FROM kol_profiles")
            conn.executemany(
                """
                INSERT INTO kol_profiles (
                    kol_id, name, platform, tier, profile_url, avatar_url,
                    followers, engagement_rate, price_from, price_to,
                    has_expert_background, category, content_style, best_for,
                    match_reason_template, email, pet_type_json, audience_json,
                    tags_json, raw_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        row["kol_id"],
                        row["name"],
                        row["platform"],
                        row["tier"],
                        row["profile_url"],
                        row["avatar_url"],
                        row["followers"],
                        row["engagement_rate"],
                        row["price_from"],
                        row["price_to"],
                        1 if row["has_expert_background"] else 0,
                        row["category"],
                        row["content_style"],
                        row["best_for"],
                        row["match_reason_template"],
                        row["email"],
                        json.dumps(row["pet_type"], ensure_ascii=False),
                        json.dumps(row["audience"], ensure_ascii=False),
                        json.dumps(row["tags"], ensure_ascii=False),
                        json.dumps(row["raw"], ensure_ascii=False),
                        updated_at,
                    )
                    for row in rows
                ],
            )
            conn.commit()

    def _normalize(self, item: dict[str, Any]) -> dict[str, Any]:
        kol_id = str(item["id"])
        followers = int(item.get("followers", 0))
        price_from = int(item.get("price_from", 0))
        tier = str(item.get("tier", "micro")).lower()
        platform = self._normalize_platform(str(item.get("platform", "Xiaohongshu")))
        price_to = self._estimate_price_to(price_from, tier)
        avatar_url = self._avatar_url(kol_id, str(item.get("name", "")))

        return {
            "kol_id": kol_id,
            "name": str(item.get("name", "")).strip(),
            "platform": platform,
            "tier": tier,
            "profile_url": item.get("profile_url"),
            "avatar_url": avatar_url,
            "followers": followers,
            "engagement_rate": float(item.get("engagement_rate", 0)),
            "price_from": price_from,
            "price_to": price_to,
            "has_expert_background": bool(item.get("has_expert_background", False)),
            "category": str(item.get("category", "")),
            "content_style": str(item.get("content_style", "")),
            "best_for": str(item.get("best_for", "")),
            "match_reason_template": str(item.get("match_reason_template", "")),
            "email": item.get("email") or f"{kol_id}@dragonway-mock.local",
            "pet_type": item.get("pet_type", []),
            "audience": item.get("audience", {}),
            "tags": item.get("tags", []),
            "raw": item,
        }

    def _normalize_platform(self, value: str) -> str:
        lowered = value.strip().lower()
        if "douyin" in lowered:
            return "douyin"
        return "xiaohongshu"

    def _estimate_price_to(self, price_from: int, tier: str) -> int:
        multipliers = {
            "micro": 2.0,
            "mid": 1.8,
            "top": 1.6,
        }
        estimate = price_from * multipliers.get(tier, 1.8)
        return int(round(estimate / 100.0) * 100)

    def _avatar_url(self, kol_id: str, name: str) -> str | None:
        filename = PORTRAIT_OVERRIDES.get(kol_id)
        if not filename:
            filename = f"{name}.png"
        if not filename:
            return None
        return f"{KOL_ASSET_PREFIX}/{urllib.parse.quote(filename)}"

    def list_profiles(self) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT
                    kol_id, name, platform, tier, profile_url, avatar_url,
                    followers, engagement_rate, price_from, price_to,
                    has_expert_background, category, content_style, best_for,
                    match_reason_template, email, pet_type_json, audience_json,
                    tags_json
                FROM kol_profiles
                ORDER BY followers DESC
                """
            ).fetchall()

        profiles: list[dict[str, Any]] = []
        for row in rows:
            item = dict(row)
            item["has_expert_background"] = bool(item["has_expert_background"])
            item["pet_type"] = json.loads(item.pop("pet_type_json"))
            item["audience"] = json.loads(item.pop("audience_json"))
            item["tags"] = json.loads(item.pop("tags_json"))
            profiles.append(item)
        return profiles
