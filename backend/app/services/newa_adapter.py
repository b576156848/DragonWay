from __future__ import annotations

import urllib.parse
from typing import Any

from fastapi import HTTPException

from backend.app.schemas.campaign import KOLMatch, ProductData
from backend.app.schemas_newa import (
    AnalysisResult,
    AnalysisSubmitRequest,
    AnalysisSubmitResponse,
    ChatOption,
    FormData,
    LeadCaptureRequest,
    LeadCaptureResponse,
    QuickChatStartResponse,
    QuickChatStep,
    QuickChatTurnRequest,
    QuickChatTurnResponse,
    QuickMatchRequest,
    QuickMatchResponse,
    QuickParseUrlRequest,
    QuickParseUrlResponse,
    QuickRefineRequest,
    QuickRefineResponse,
    SchemaMetaResponse,
)
from backend.app.services.intake import intake_analyzer
from backend.app.services.lead_store import LeadStore
from backend.app.services.matcher import KOLMatcher
from backend.app.services.newa_chat_agent import NewAQuickChatAgent
from backend.app.services.newa_mapper import (
    aggregate_audience,
    build_campaign_content,
    build_opportunities,
    form_to_questionnaire,
    match_to_kol_profile,
)
from backend.app.services.newa_refinement import NewARefinementService
from backend.app.services.newa_session_store import NewASessionStore
from backend.app.services.scraper import ProductScraper


class NewAAdapter:
    def __init__(self) -> None:
        self.scraper = ProductScraper()
        self.matcher = KOLMatcher()
        self.refinement = NewARefinementService()
        self.chat_agent = NewAQuickChatAgent()
        self.sessions = NewASessionStore()
        self.leads = LeadStore()

    def schema_meta(self) -> SchemaMetaResponse:
        return SchemaMetaResponse(
            schema_version="dragonway-newa.v1",
            frontend_id="dragonway_NewA",
            flows=["quick_chat", "detailed_form", "results", "lead_capture"],
        )

    def quick_parse_url(self, payload: QuickParseUrlRequest) -> QuickParseUrlResponse:
        session_id = self.sessions.create_session(source_mode="quick")
        return self._run_quick_parse(payload.product_url, session_id)

    def quick_match_preview(self, payload: QuickMatchRequest) -> QuickMatchResponse:
        session_id = self.sessions.ensure_session(payload.session_id, source_mode="quick")
        questionnaire = form_to_questionnaire(payload.form_data)
        product = self._resolve_product(session_id, payload.form_data)
        matches = self.matcher.rank(questionnaire, product, limit=3, enrich=False)
        top_kols = [match_to_kol_profile(match) for match in matches]
        audience = aggregate_audience(top_kols, payload.form_data)
        summary = self._preview_summary(product, top_kols)

        response = QuickMatchResponse(
            session_id=session_id,
            top_kols=top_kols,
            audience=audience,
            summary=summary,
        )
        self.sessions.update_session(
            session_id,
            current_step="previewed",
            form_data_json=payload.form_data.model_dump(),
            product_json=product.model_dump(),
            preview_kols_json=[item.model_dump() for item in top_kols],
            preview_audience_json=audience.model_dump(),
        )
        return response

    def quick_refine(self, payload: QuickRefineRequest) -> QuickRefineResponse:
        session_id = self.sessions.ensure_session(payload.session_id, source_mode="quick")
        questionnaire = form_to_questionnaire(payload.form_data)
        product = self._resolve_product(session_id, payload.form_data)
        ranked_matches = self.matcher.rank(questionnaire, product, limit=None, enrich=False)

        preference = payload.preference or self._preference_from_answers(payload.answers or {})
        refined_matches = self.refinement.refine(
            ranked_matches=ranked_matches,
            kept_kol_ids=payload.kept_kol_ids,
            dropped_kol_id=payload.dropped_kol_id,
            preference=preference,
        )

        refined_kols = [match_to_kol_profile(match) for match in refined_matches]
        refined_audience = aggregate_audience(refined_kols, payload.form_data)
        summary = self._refine_summary(preference, refined_kols)

        response = QuickRefineResponse(
            session_id=session_id,
            refined_kols=refined_kols,
            refined_audience=refined_audience,
            summary=summary,
        )
        self.sessions.update_session(
            session_id,
            current_step="refined",
            form_data_json=payload.form_data.model_dump(),
            product_json=product.model_dump(),
            refined_kols_json=[item.model_dump() for item in refined_kols],
            refined_audience_json=refined_audience.model_dump(),
        )
        return response

    def submit_analysis(self, payload: AnalysisSubmitRequest) -> AnalysisSubmitResponse:
        session = self.sessions.get_session(payload.session_id) if payload.session_id else None
        product = self._resolve_product(payload.session_id, payload.form_data)

        if payload.source == "quick_chat" and session and session.refined_kols_json:
            kols = [match_to_front_kol(item) for item in _load_json(session.refined_kols_json)]
            audience = audience_from_json(session.refined_audience_json, payload.form_data, kols)
        elif payload.source == "quick_chat" and session and session.preview_kols_json:
            kols = [match_to_front_kol(item) for item in _load_json(session.preview_kols_json)]
            audience = audience_from_json(session.preview_audience_json, payload.form_data, kols)
        else:
            questionnaire = form_to_questionnaire(payload.form_data)
            matches = self.matcher.rank(questionnaire, product, limit=3, enrich=False)
            kols = [match_to_kol_profile(match) for match in matches]
            audience = aggregate_audience(kols, payload.form_data)

        result = AnalysisResult(
            opportunities=build_opportunities(payload.form_data, product),
            kols=kols,
            audience=audience,
            campaign=build_campaign_content(payload.form_data, product, kols),
        )
        return AnalysisSubmitResponse(result=result, source=payload.source)

    def quick_chat_start(self) -> QuickChatStartResponse:
        session_id = self.sessions.create_session(source_mode="quick")
        form_data = self._default_form_data()
        self.sessions.update_session(
            session_id,
            current_step="welcome",
            form_data_json=form_data.model_dump(),
        )
        decision = self.chat_agent.decide(
            event="chat_started",
            current_step=None,
            allowed_next_steps=["welcome"],
            default_next_step="welcome",
            default_messages=[
                "Hi, I'm your DragonWay AI strategist. I'll turn one product link into a China-ready KOL shortlist for you. Start by pasting the product URL below."
            ],
            latest_user_input=None,
            form_data=form_data,
        )
        return QuickChatStartResponse(
            session_id=session_id,
            agent_messages=decision.agent_messages,
            step=self._step(decision.next_step_id),
            form_data=form_data,
        )

    def quick_chat_turn(self, payload: QuickChatTurnRequest) -> QuickChatTurnResponse:
        session = self.sessions.get_session(payload.session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Quick chat session not found")

        form_data = self._session_form_data(session)
        current_step = session.current_step
        if payload.step_id != current_step:
            raise HTTPException(status_code=409, detail=f"Step mismatch: expected {current_step}, got {payload.step_id}")

        if current_step == "welcome":
            if not payload.value:
                raise HTTPException(status_code=422, detail="Product URL is required")
            normalized_url = self._normalize_product_url(payload.value)
            if not normalized_url:
                return QuickChatTurnResponse(
                    session_id=payload.session_id,
                    agent_messages=[
                        "That doesn't look like a valid product URL yet.",
                        "Please paste a full Shopify, Amazon, brand, or product-page link starting with http:// or https://.",
                    ],
                    step=self._step("welcome"),
                    form_data=form_data,
                )
            response = self._run_quick_parse(normalized_url, payload.session_id)
            product = self._resolve_product(payload.session_id, form_data)
            form_data = form_data.model_copy(
                update={
                    "product_url": normalized_url,
                    "food_format": str(response.inferred_fields["food_format"]),
                    "pet_type": str(response.inferred_fields["pet_type"]),
                    "core_claims": list(response.inferred_fields["core_claims"]),
                }
            )
            self.sessions.update_session(
                payload.session_id,
                current_step="food_format",
                form_data_json=form_data.model_dump(),
            )
            allowed = self._allowed_steps_after_parse(form_data)
            default_next = allowed[0]
            decision = self.chat_agent.decide(
                event="product_parsed",
                current_step=current_step,
                allowed_next_steps=allowed,
                default_next_step=default_next,
                default_messages=[
                    response.summary,
                    self._prompt_for(default_next),
                ],
                latest_user_input=normalized_url,
                form_data=form_data,
                product=product,
                parse_summary=response.summary,
            )
            self.sessions.update_session(
                payload.session_id,
                current_step=decision.next_step_id,
                form_data_json=form_data.model_dump(),
            )
            return QuickChatTurnResponse(
                session_id=payload.session_id,
                agent_messages=decision.agent_messages,
                step=self._step(decision.next_step_id),
                form_data=form_data,
            )

        if current_step in {"food_format", "pet_type", "owner_city", "owner_price", "budget_band"}:
            if not payload.value:
                raise HTTPException(status_code=422, detail="A single option value is required")
            form_data = self._apply_field_value(form_data, current_step, payload.value)
            allowed = self._allowed_steps_after_field(current_step, form_data)
            default_next = allowed[0]
            decision = self.chat_agent.decide(
                event="field_answered",
                current_step=current_step,
                allowed_next_steps=allowed,
                default_next_step=default_next,
                default_messages=[self._prompt_for(default_next)],
                latest_user_input=payload.value,
                form_data=form_data,
                product=self._resolve_product(payload.session_id, form_data),
            )
            self.sessions.update_session(payload.session_id, current_step=decision.next_step_id, form_data_json=form_data.model_dump())
            return QuickChatTurnResponse(
                session_id=payload.session_id,
                agent_messages=decision.agent_messages,
                step=self._step(decision.next_step_id),
                form_data=form_data,
            )

        if current_step in {"core_claims", "preferred_platforms"}:
            if not payload.values:
                raise HTTPException(status_code=422, detail="One or more option values are required")
            form_data = self._apply_field_values(form_data, current_step, payload.values)
            if current_step == "core_claims":
                allowed = ["owner_city", "owner_price", "budget_band"]
                decision = self.chat_agent.decide(
                    event="claims_selected",
                    current_step=current_step,
                    allowed_next_steps=allowed,
                    default_next_step="owner_city",
                    default_messages=[self._prompt_for("owner_city")],
                    latest_user_input=", ".join(payload.values),
                    form_data=form_data,
                    product=self._resolve_product(payload.session_id, form_data),
                )
                self.sessions.update_session(payload.session_id, current_step=decision.next_step_id, form_data_json=form_data.model_dump())
                return QuickChatTurnResponse(
                    session_id=payload.session_id,
                    agent_messages=decision.agent_messages,
                    step=self._step(decision.next_step_id),
                    form_data=form_data,
                )

            preview = self.quick_match_preview(
                QuickMatchRequest(session_id=payload.session_id, form_data=form_data, source="quick_chat")
            )
            decision = self.chat_agent.decide(
                event="preview_generated",
                current_step=current_step,
                allowed_next_steps=["kol_results"],
                default_next_step="kol_results",
                default_messages=[
                    preview.summary,
                    "Here are the top 3 creators from the current pass. Review them and tell me which one you want me to replace.",
                ],
                latest_user_input=", ".join(payload.values),
                form_data=form_data,
                product=self._resolve_product(payload.session_id, form_data),
                preview_kols=preview.top_kols,
                preview_summary=preview.summary,
            )
            self.sessions.update_session(payload.session_id, current_step=decision.next_step_id, form_data_json=form_data.model_dump())
            return QuickChatTurnResponse(
                session_id=payload.session_id,
                agent_messages=decision.agent_messages,
                step=self._step(decision.next_step_id, kols=preview.top_kols),
                form_data=form_data,
            )

        if current_step == "kol_results":
            if not payload.selected_kol_id:
                raise HTTPException(status_code=422, detail="A selected KOL id is required")
            session = self.sessions.get_session(payload.session_id)
            preview_kols = [match_to_front_kol(item) for item in _load_json(session.preview_kols_json)] if session and session.preview_kols_json else []
            selected_name = next((item.name for item in preview_kols if item.id == payload.selected_kol_id), payload.selected_kol_id)
            decision = self.chat_agent.decide(
                event="kol_selected_for_swap",
                current_step=current_step,
                allowed_next_steps=["refine"],
                default_next_step="refine",
                default_messages=["One final tradeoff before I optimize the list: do you want broader reach or tighter conversion?"],
                latest_user_input=selected_name,
                form_data=form_data,
                product=self._resolve_product(payload.session_id, form_data),
                preview_kols=preview_kols,
            )
            self.sessions.update_session(payload.session_id, current_step=decision.next_step_id)
            return QuickChatTurnResponse(
                session_id=payload.session_id,
                agent_messages=decision.agent_messages,
                step=self._step(decision.next_step_id),
                form_data=form_data,
            )

        if current_step == "refine":
            if not payload.preference or not payload.selected_kol_id:
                raise HTTPException(status_code=422, detail="Preference and selected KOL id are required")
            session = self.sessions.get_session(payload.session_id)
            preview_kols = [match_to_front_kol(item) for item in _load_json(session.preview_kols_json)] if session and session.preview_kols_json else []
            kept_ids = [kol.id for kol in preview_kols if kol.id != payload.selected_kol_id]
            refined = self.quick_refine(
                QuickRefineRequest(
                    session_id=payload.session_id,
                    form_data=form_data,
                    initial_kols=preview_kols,
                    kept_kol_ids=kept_ids,
                    dropped_kol_id=payload.selected_kol_id,
                    preference=payload.preference,
                )
            )
            decision = self.chat_agent.decide(
                event="refinement_completed",
                current_step=current_step,
                allowed_next_steps=["final"],
                default_next_step="final",
                default_messages=[
                    refined.summary,
                    "Your optimized KOL combination is ready. I've expanded your plan to 4 creators based on your preference.",
                ],
                latest_user_input=payload.preference,
                form_data=form_data,
                product=self._resolve_product(payload.session_id, form_data),
                preview_kols=preview_kols,
                refined_kols=refined.refined_kols,
                refine_summary=refined.summary,
            )
            self.sessions.update_session(payload.session_id, current_step=decision.next_step_id, form_data_json=form_data.model_dump())
            return QuickChatTurnResponse(
                session_id=payload.session_id,
                agent_messages=decision.agent_messages,
                step=self._step(decision.next_step_id, kols=refined.refined_kols),
                form_data=form_data,
            )

        raise HTTPException(status_code=400, detail=f"Unsupported quick chat step: {current_step}")

    def capture_lead(self, payload: LeadCaptureRequest) -> LeadCaptureResponse:
        self.leads.create_lead(
            email=payload.email,
            company=payload.company,
            source_mode=payload.context.source_mode if payload.context else None,
            form_data=payload.context.form_data if payload.context else None,
        )
        return LeadCaptureResponse(success=True, message="Plan sent! We'll follow up with next steps.")

    def _resolve_product(self, session_id: str | None, form: FormData) -> ProductData:
        if session_id:
            session = self.sessions.get_session(session_id)
            if session and session.product_json:
                return ProductData.model_validate(_load_json(session.product_json))
        return self.scraper.scrape(form.product_url)

    def _confidence(self, product: ProductData) -> float:
        if product.provider == "shopify" and product.scrape_status == "success":
            return 0.96
        if product.scrape_status == "partial":
            return 0.66
        if product.scrape_status == "blocked":
            return 0.25
        return 0.52

    def _parse_summary(self, product: ProductData, claims: list[str], food_format: str, pet_type: str) -> str:
        claim_text = ", ".join(item.replace("_", " ") for item in claims[:2]) if claims else "premium nutrition"
        return (
            f"I parsed {product.product_name} as a {food_format.replace('_', ' ')} {pet_type} formula. "
            f"The clearest product signals are {claim_text}, so I'll use that as the first matching angle."
        )

    def _preview_summary(self, product: ProductData, top_kols) -> str:
        names = ", ".join(kol.name for kol in top_kols[:2])
        return (
            f"I matched this product against our China creator pool and these three profiles surfaced first. "
            f"{names} stand out because they can explain the product logic clearly without making the content feel too ad-like."
        )

    def _refine_summary(self, preference: str | None, refined_kols) -> str:
        if preference == "reach":
            return "I shifted the shortlist toward broader reach while keeping enough product-fit to make the final mix usable for awareness building."
        if preference == "conversion":
            return "I optimized the shortlist toward trust and conversion, with more efficient creators and stronger purchase-explanation potential."
        return f"I expanded the lineup to {len(refined_kols)} creators and balanced reach with explainability for the final report."

    def _preference_from_answers(self, answers: dict[str, str]) -> str | None:
        priority = answers.get("priority")
        if priority == "viral":
            return "reach"
        if priority == "conversion":
            return "conversion"
        if priority == "endorsement":
            return "conversion"
        return None

    def _run_quick_parse(self, product_url: str, session_id: str) -> QuickParseUrlResponse:
        analysis = intake_analyzer.analyze(product_url)
        product = analysis.product_data
        claims = analysis.prefill.core_claims[:3]
        summary = self._parse_summary(product, claims, analysis.prefill.food_format, analysis.prefill.pet_type)
        response = QuickParseUrlResponse(
            session_id=session_id,
            product_url=product_url,
            summary=summary,
            inferred_fields={
                "food_format": analysis.prefill.food_format,
                "pet_type": analysis.prefill.pet_type,
                "core_claims": claims,
            },
            source_confidence=self._confidence(product),
        )
        self.sessions.update_session(
            session_id,
            current_step="parsed",
            product_json=product.model_dump(),
            parse_json=response.model_dump(),
        )
        return response

    def _default_form_data(self) -> FormData:
        return FormData(
            product_url="",
            food_format="",
            pet_type="",
            life_stage=["all_life"],
            core_claims=[],
            primary_goal="find_kol",
            owner_pet="dog_owner",
            owner_city="",
            owner_price="",
            brand_positioning="premium_import",
            preferred_platforms=[],
            content_preference=["ingredient_review", "dog_reaction"],
            preferred_kol_type="no_preference",
            budget_band="",
            timeline="1_month",
            special_constraints="",
        )

    def _session_form_data(self, session) -> FormData:
        if session.form_data_json:
            return FormData.model_validate(_load_json(session.form_data_json))
        return self._default_form_data()

    def _step(self, step_id: str, *, kols=None) -> QuickChatStep:
        kols = kols or []
        if step_id == "welcome":
            return QuickChatStep(step_id=step_id, input_type="url", field="product_url", placeholder="Paste your Shopify or brand link...")
        if step_id == "food_format":
            return QuickChatStep(step_id=step_id, input_type="select", field="food_format", options=self._options("food_format"))
        if step_id == "pet_type":
            return QuickChatStep(step_id=step_id, input_type="select", field="pet_type", options=self._options("pet_type"))
        if step_id == "core_claims":
            return QuickChatStep(step_id=step_id, input_type="multi-select", field="core_claims", options=self._options("core_claims"), maxSelections=3)
        if step_id == "owner_city":
            return QuickChatStep(step_id=step_id, input_type="select", field="owner_city", options=self._options("owner_city"))
        if step_id == "owner_price":
            return QuickChatStep(step_id=step_id, input_type="select", field="owner_price", options=self._options("owner_price"))
        if step_id == "budget_band":
            return QuickChatStep(step_id=step_id, input_type="select", field="budget_band", options=self._options("budget_band"))
        if step_id == "preferred_platforms":
            return QuickChatStep(step_id=step_id, input_type="multi-select", field="preferred_platforms", options=self._options("preferred_platforms"), maxSelections=2)
        if step_id == "kol_results":
            return QuickChatStep(step_id=step_id, input_type="kol-cards", kols=kols)
        if step_id == "refine":
            return QuickChatStep(step_id=step_id, input_type="refine")
        if step_id == "final":
            return QuickChatStep(step_id=step_id, input_type="final", kols=kols)
        raise HTTPException(status_code=400, detail=f"Unknown quick chat step: {step_id}")

    def _options(self, field: str) -> list[ChatOption]:
        mapping = {
            "food_format": [
                ("dry", "Dry Kibble"),
                ("wet", "Wet / Canned"),
                ("freeze_dried", "Freeze-Dried"),
                ("air_dried", "Air-Dried"),
                ("fresh", "Fresh / Refrigerated"),
                ("other", "Other"),
            ],
            "pet_type": [("dog", "Dog"), ("cat", "Cat")],
            "core_claims": [
                ("high_protein", "High Protein"),
                ("grain_free", "Grain Free"),
                ("limited_ingredient", "Limited Ingredient"),
                ("fresh_ingredients", "Fresh Ingredients"),
                ("digestive_health", "Digestive Health"),
                ("skin_coat", "Skin & Coat"),
                ("joint_support", "Joint Support"),
                ("vet_backed", "Vet-Backed"),
                ("premium_imported", "Premium Imported"),
            ],
            "owner_city": [
                ("tier1", "Tier 1 (Beijing, Shanghai, etc.)"),
                ("new_tier1", "New Tier 1 (Chengdu, Hangzhou, etc.)"),
                ("tier2", "Tier 2"),
                ("any", "Any / Not Sure"),
            ],
            "owner_price": [
                ("high", "High (¥500+/mo)"),
                ("mid_high", "Mid-High (¥300–500/mo)"),
                ("mid", "Mid (¥150–300/mo)"),
            ],
            "budget_band": [
                ("lt10k", "Under $10K"),
                ("10k_30k", "$10K – $30K"),
                ("30k_80k", "$30K – $80K"),
                ("gt80k", "$80K+"),
            ],
            "preferred_platforms": [
                ("xiaohongshu", "Xiaohongshu (小红书)"),
                ("douyin", "Douyin (抖音)"),
            ],
        }
        return [ChatOption(value=value, label=label) for value, label in mapping[field]]

    def _prompt_for(self, step_id: str) -> str:
        prompts = {
            "food_format": "I pulled a likely format from the page, but please confirm it so I score the KOLs correctly.",
            "pet_type": "Great. Next, confirm whether this formula is mainly for dogs or cats.",
            "core_claims": "Now pick the strongest selling points. Choose up to 3 so I can anchor the creator matching.",
            "owner_city": "Which China city tier matters most for this launch?",
            "owner_price": "What spending level does your target owner sit in right now?",
            "budget_band": "How much budget are you planning to allocate to this creator campaign?",
            "preferred_platforms": "Last input before matching: which platforms should I prioritize?",
        }
        return prompts[step_id]

    def _allowed_steps_after_parse(self, form_data: FormData) -> list[str]:
        steps = ["food_format", "pet_type", "core_claims", "owner_city", "owner_price", "budget_band", "preferred_platforms"]
        return self._filter_allowed_steps(steps, form_data)

    def _allowed_steps_after_field(self, current_step: str, form_data: FormData) -> list[str]:
        flow = {
            "food_format": ["pet_type", "core_claims", "owner_city"],
            "pet_type": ["core_claims", "owner_city", "owner_price"],
            "owner_city": ["owner_price", "budget_band", "preferred_platforms"],
            "owner_price": ["budget_band", "preferred_platforms"],
            "budget_band": ["preferred_platforms"],
        }
        candidates = flow[current_step]
        return self._filter_allowed_steps(candidates, form_data)

    def _filter_allowed_steps(self, candidates: list[str], form_data: FormData) -> list[str]:
        missing_map = {
            "food_format": not bool(form_data.food_format),
            "pet_type": not bool(form_data.pet_type),
            "core_claims": not bool(form_data.core_claims),
            "owner_city": not bool(form_data.owner_city),
            "owner_price": not bool(form_data.owner_price),
            "budget_band": not bool(form_data.budget_band),
            "preferred_platforms": not bool(form_data.preferred_platforms),
        }
        unresolved = [step for step in candidates if missing_map.get(step, False)]
        return unresolved or candidates[:1]

    def _apply_field_value(self, form_data: FormData, step_id: str, value: str) -> FormData:
        field_map = {
            "food_format": "food_format",
            "pet_type": "pet_type",
            "owner_city": "owner_city",
            "owner_price": "owner_price",
            "budget_band": "budget_band",
        }
        return form_data.model_copy(update={field_map[step_id]: value})

    def _apply_field_values(self, form_data: FormData, step_id: str, values: list[str]) -> FormData:
        field_map = {
            "core_claims": "core_claims",
            "preferred_platforms": "preferred_platforms",
        }
        return form_data.model_copy(update={field_map[step_id]: values})

    def _normalize_product_url(self, value: str) -> str | None:
        candidate = value.strip()
        if not candidate:
            return None
        parsed = urllib.parse.urlparse(candidate)
        if parsed.scheme not in {"http", "https"}:
            return None
        if not parsed.netloc or "." not in parsed.netloc:
            return None
        return candidate


def _load_json(raw: str | None) -> Any:
    if not raw:
        return None
    return __import__("json").loads(raw)


def match_to_front_kol(payload: dict[str, Any]):
    from backend.app.schemas_newa import KolProfile

    return KolProfile.model_validate(payload)


def audience_from_json(raw: str | None, form: FormData, kols):
    from backend.app.schemas_newa import AudienceData

    if raw:
        return AudienceData.model_validate(_load_json(raw))
    return aggregate_audience(kols, form)
