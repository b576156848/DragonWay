from __future__ import annotations

from dataclasses import dataclass

from backend.app.schemas.campaign import KOLMatch


@dataclass
class RefinePreference:
    priority: str


class NewARefinementService:
    def refine(
        self,
        *,
        ranked_matches: list[KOLMatch],
        kept_kol_ids: list[str],
        dropped_kol_id: str | None,
        preference: str | None,
    ) -> list[KOLMatch]:
        indexed = {match.kol_id: match for match in ranked_matches}

        kept: list[KOLMatch] = []
        for kol_id in kept_kol_ids:
            match = indexed.get(kol_id)
            if match is not None and match not in kept:
                kept.append(match)

        candidates: list[tuple[float, KOLMatch]] = []
        for match in ranked_matches:
            if match.kol_id == dropped_kol_id or match.kol_id in kept_kol_ids:
                continue
            score = float(match.match_score)
            score += self._priority_boost(match, preference)
            candidates.append((score, match))

        candidates.sort(key=lambda item: item[0], reverse=True)
        refined = list(kept)
        for _, candidate in candidates:
            if len(refined) >= 4:
                break
            if candidate.kol_id not in {item.kol_id for item in refined}:
                refined.append(candidate)

        if len(refined) < 4:
            for match in ranked_matches:
                if len(refined) >= 4:
                    break
                if match.kol_id not in {item.kol_id for item in refined}:
                    refined.append(match)
        return refined[:4]

    def _priority_boost(self, match: KOLMatch, preference: str | None) -> float:
        if preference == "reach":
            return min(match.followers / 20_000, 18)
        if preference == "conversion":
            engagement_boost = match.avg_engagement * 100 * 2.5
            affordability = 10 if match.price_range.min <= 7_000 else 0
            authority = 6 if match.has_expert_background else 0
            return engagement_boost + affordability + authority
        return 0.0
