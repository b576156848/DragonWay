from __future__ import annotations

import traceback
import uuid

from backend.app.schemas.campaign import CampaignResult
from backend.app.schemas.questionnaire import QuestionnaireInput
from backend.app.services.ai import ChinaStrategyAnalyzer, ProductAnalyzer
from backend.app.services.matcher import KOLMatcher
from backend.app.services.repository import CampaignRepository
from backend.app.services.scraper import ProductScraper


class CampaignPipeline:
    def __init__(self) -> None:
        self.repository = CampaignRepository()
        self.scraper = ProductScraper()
        self.product_analyzer = ProductAnalyzer()
        self.cn_analyzer = ChinaStrategyAnalyzer()
        self.matcher = KOLMatcher()

    def create_campaign(self, payload: QuestionnaireInput) -> str:
        campaign_id = f"cmp_{uuid.uuid4().hex[:12]}"
        self.repository.create_campaign(campaign_id, payload.model_dump())
        return campaign_id

    def run_campaign(self, campaign_id: str, payload: dict) -> None:
        try:
            questionnaire = QuestionnaireInput.model_validate(payload)

            self.repository.update_progress(campaign_id, status="analyzing", current_step="extract")
            product = self.scraper.scrape(questionnaire.product_url)

            self.repository.update_progress(campaign_id, current_step="audience")
            agent_a_output = self.product_analyzer.analyze(questionnaire, product)
            agent_b_output = self.cn_analyzer.analyze(questionnaire, product, agent_a_output)

            self.repository.update_progress(campaign_id, current_step="matching")
            matches = self.matcher.match(questionnaire, product)

            self.repository.update_progress(campaign_id, current_step="content")
            execution_plan = self.matcher.build_execution_plan(matches[:3], questionnaire)
            outreach_drafts = self.matcher.build_outreach_drafts(matches[:3], product)

            self.repository.update_progress(campaign_id, current_step="push")
            result = CampaignResult(
                campaign_id=campaign_id,
                status="ready",
                created_at=self.repository.get_campaign(campaign_id).created_at,  # type: ignore[union-attr]
                current_step="push",
                questionnaire=questionnaire,
                product_data=product,
                agent_a_output=agent_a_output,
                agent_b_output=agent_b_output,
                kol_matches=matches,
                execution_plan=execution_plan,
                outreach_drafts=outreach_drafts,
            )
            self.repository.set_result(campaign_id, result.model_dump())
        except Exception as exc:  # pragma: no cover - defensive path
            message = f"{exc}\n{traceback.format_exc(limit=3)}"
            self.repository.set_error(campaign_id, message)


pipeline = CampaignPipeline()
