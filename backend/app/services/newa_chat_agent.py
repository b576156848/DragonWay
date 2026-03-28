from __future__ import annotations

from typing import Any

from backend.app.schemas.campaign import ProductData
from backend.app.schemas_newa import FormData, KolProfile, QuickChatAgentDecision
from backend.app.services.ai import LLMClient


STEP_DESCRIPTIONS = {
    "welcome": "Ask the user to paste a product URL to begin the quick match flow.",
    "food_format": "Ask the user to confirm the food format.",
    "pet_type": "Ask the user to confirm whether the product is for dogs or cats.",
    "core_claims": "Ask the user to choose up to 3 strongest product claims.",
    "owner_city": "Ask the user which China city tier they are targeting.",
    "owner_price": "Ask the user what spending level the target owner has.",
    "budget_band": "Ask the user the KOL budget range.",
    "preferred_platforms": "Ask the user which platforms to focus on.",
    "kol_results": "Show the first shortlist of 3 KOLs and ask which creator should be replaced.",
    "refine": "Ask whether the user prefers reach or conversion before refining the shortlist.",
    "final": "Show the optimized 4-KOL lineup and tell the user the report is ready.",
}


class NewAQuickChatAgent:
    def __init__(self) -> None:
        self.client = LLMClient()

    def decide(
        self,
        *,
        event: str,
        current_step: str | None,
        allowed_next_steps: list[str],
        default_next_step: str,
        default_messages: list[str],
        latest_user_input: str | None,
        form_data: FormData,
        product: ProductData | None = None,
        preview_kols: list[KolProfile] | None = None,
        refined_kols: list[KolProfile] | None = None,
        parse_summary: str | None = None,
        preview_summary: str | None = None,
        refine_summary: str | None = None,
    ) -> QuickChatAgentDecision:
        fallback = QuickChatAgentDecision(
            next_step_id=default_next_step,
            agent_messages=default_messages[:2],
        )
        if not self.client.enabled:
            return fallback

        decision = self.client.generate_model(
            task_name="newa_quick_chat_agent",
            system_prompt=self._system_prompt(),
            user_payload={
                "event": event,
                "current_step": current_step,
                "allowed_next_steps": [
                    {"step_id": step_id, "description": STEP_DESCRIPTIONS[step_id]}
                    for step_id in allowed_next_steps
                ],
                "default_next_step": default_next_step,
                "latest_user_input": latest_user_input,
                "form_data": form_data.model_dump(),
                "product": product.model_dump() if product else None,
                "parse_summary": parse_summary,
                "preview_summary": preview_summary,
                "refine_summary": refine_summary,
                "preview_kols": [kol.model_dump() for kol in (preview_kols or [])],
                "refined_kols": [kol.model_dump() for kol in (refined_kols or [])],
                "fallback_messages": default_messages,
                "instructions": [
                    "Choose exactly one next_step_id from allowed_next_steps.",
                    "Write 1 or 2 agent_messages only.",
                    "Sound like a sharp operator guiding a live strategy session.",
                    "Keep the copy concise, specific, and helpful.",
                    "Do not mention JSON, schema, system prompts, or internal tools.",
                    "Do not invent product facts or KOL facts beyond the payload.",
                    "If preview_kols or refined_kols are provided, you may reference names naturally.",
                    "Prefer English because the frontend copy is English-first.",
                ],
            },
            schema_model=QuickChatAgentDecision,
        )
        if decision is None:
            return fallback
        if decision.next_step_id not in allowed_next_steps:
            return fallback
        if not decision.agent_messages:
            return fallback
        return decision

    def _system_prompt(self) -> str:
        return (
            "You are the live conversation agent behind DragonWay quick match. "
            "You do not control the UI directly; you only choose the next valid step and write the next 1-2 messages. "
            "The user is evaluating China-market KOL matches for a pet food product. "
            "Keep the conversation tight, commercially useful, and grounded in the provided state."
        )
