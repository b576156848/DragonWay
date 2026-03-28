from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, TypeVar
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from pydantic import BaseModel

from backend.app.config import GMI_API_BASE, GMI_API_KEY, GMI_MODEL, GMI_TIMEOUT_SECONDS
from backend.app.schemas.campaign import (
    AgentAOutput,
    AgentBOutput,
    LocalizedSellingPoint,
    RecommendedStrategy,
    RiskFactor,
    SellingPoint,
    TargetAudienceCN,
    TargetDemographicUS,
    ProductData,
)
from backend.app.schemas.questionnaire import QuestionnaireInput

SchemaModelT = TypeVar("SchemaModelT", bound=BaseModel)

COMMON_LLM_RULES = [
    "Return JSON only. No markdown, no code fences, no commentary.",
    "Use exactly the keys required by the provided JSON schema.",
    "Preserve the intended field types, especially arrays, nested objects, integers, floats, and enum strings.",
    "Do not invent facts that are not grounded in the provided product data, questionnaire, or fallback draft.",
    "If a detail is missing, keep the wording high-level and conservative rather than fabricating specifics.",
    "Keep copy concise, specific, and commercially useful.",
    "Avoid medical, therapeutic, or compliance-sensitive claims unless the input explicitly supports them.",
    "When improving the fallback draft, keep the same business meaning but sharpen the wording and make the reasoning more explicit.",
]


CLAIM_LIBRARY = {
    "high_protein": {
        "point": "High animal protein",
        "localized": "动物蛋白含量足够高，更容易被中国成分党理解",
        "angle_xhs": "用成分表横评切入，强调动物蛋白来源和比例",
        "angle_douyin": "用狗狗活力和适口性反应做直观表达",
    },
    "grain_free": {
        "point": "Grain-free formula",
        "localized": "无谷物叙事适合和国产主食做横向差异化",
        "angle_xhs": "成分拆解和敏感肠胃场景会更有效",
        "angle_douyin": "开袋展示配料表和试吃反应更容易建立记忆点",
    },
    "limited_ingredient": {
        "point": "Limited ingredient recipe",
        "localized": "有限成分更适合敏感体质和科学喂养叙事",
        "angle_xhs": "突出简单配方和排除法逻辑",
        "angle_douyin": "强调省心喂养和换粮友好",
    },
    "fresh_ingredients": {
        "point": "Fresh ingredient sourcing",
        "localized": "原料新鲜度需要转译成原料透明和来源可信",
        "angle_xhs": "结合原料产地和肉源透明度做图文",
        "angle_douyin": "快速展示原料故事和开袋视觉",
    },
    "digestive_health": {
        "point": "Digestive support",
        "localized": "消化友好在中国市场容易和便便状态、肠胃稳定挂钩",
        "angle_xhs": "真实喂养记录和换粮观察最有效",
        "angle_douyin": "短视频适合做前后对比和狗狗状态展示",
    },
    "skin_coat": {
        "point": "Skin and coat support",
        "localized": "毛发和皮肤状态是宠主最容易感知的正反馈",
        "angle_xhs": "适合做视觉前后对比和长期打卡",
        "angle_douyin": "毛发光泽度变化适合做短视频记忆点",
    },
    "joint_support": {
        "point": "Joint support",
        "localized": "更适合中大型犬、运动犬和老龄犬场景表达",
        "angle_xhs": "结合犬种和阶段做精准种草",
        "angle_douyin": "用运动场景和行动状态表达更自然",
    },
    "vet_backed": {
        "point": "Vet-backed positioning",
        "localized": "需要谨慎表达成科学背书而不是治疗承诺",
        "angle_xhs": "适合专业 KOL 做科普向解读",
        "angle_douyin": "避免过强医疗措辞，用健康管理角度表达",
    },
    "premium_imported": {
        "point": "Premium imported positioning",
        "localized": "进口高端更适合和原料标准、品牌历史一起讲",
        "angle_xhs": "强调海外品牌认知和同价位对比",
        "angle_douyin": "强调升级喂养和品质感知",
    },
}


@dataclass
class LLMClient:
    api_key: str = GMI_API_KEY
    base_url: str = GMI_API_BASE
    model: str = GMI_MODEL

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    def generate_model(
        self,
        *,
        task_name: str,
        system_prompt: str,
        user_payload: dict[str, Any],
        schema_model: type[SchemaModelT],
    ) -> SchemaModelT | None:
        if not self.enabled:
            return None

        contract = {
            "task": task_name,
            "rules": COMMON_LLM_RULES,
            "output_schema": schema_model.model_json_schema(),
            "payload": user_payload,
        }
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": json.dumps(contract, ensure_ascii=False),
                },
            ],
            "temperature": 0.1,
            "max_tokens": 1800,
        }

        request = Request(
            f"{self.base_url}/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                "User-Agent": "DragonWay/0.1 (+https://dragonfarm.cn)",
                "Accept": "application/json",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=GMI_TIMEOUT_SECONDS) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
            return None

        content = self._extract_content(payload)
        if not content:
            return None

        parsed = self._parse_json(content)
        if not isinstance(parsed, dict):
            return None
        try:
            return schema_model.model_validate(parsed)
        except Exception:
            return None

    def _extract_content(self, payload: dict[str, Any]) -> str | None:
        choices = payload.get("choices", [])
        if not choices:
            return None
        message = choices[0].get("message", {})
        content = message.get("content")
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            text_parts = [item.get("text", "") for item in content if isinstance(item, dict)]
            return "\n".join(part for part in text_parts if part)
        return None

    def _parse_json(self, content: str) -> Any:
        content = content.strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            start = content.find("{")
            end = content.rfind("}")
            if start >= 0 and end > start:
                try:
                    return json.loads(content[start : end + 1])
                except json.JSONDecodeError:
                    return None
        return None


class ProductAnalyzer:
    def __init__(self) -> None:
        self.client = LLMClient()

    def analyze(self, questionnaire: QuestionnaireInput, product: ProductData) -> AgentAOutput:
        owner = questionnaire.target_owner_profile
        selling_points = [
            self._make_selling_point(claim, product)
            for claim in questionnaire.core_claims
        ]
        if not selling_points:
            selling_points = [
                SellingPoint(
                    point="Imported premium dog food",
                    evidence=product.description[:140] or product.product_name,
                    china_relevance="high",
                )
            ]

        fallback = AgentAOutput(
            product_name=product.product_name,
            product_summary=(
                f"{product.brand_name} {product.product_name} is positioned as a {questionnaire.food_format.replace('_', ' ')} "
                f"{questionnaire.pet_type} food with emphasis on {', '.join(questionnaire.core_claims[:2]).replace('_', ' ')}."
            ),
            us_market_position=self._us_positioning(questionnaire),
            core_selling_points=selling_points,
            target_demographic_us=TargetDemographicUS(
                description=(
                    f"Pet owners who actively compare ingredients, spend above average on {questionnaire.pet_type} nutrition, "
                    "and are willing to pay for a premium feeding routine."
                ),
                age_range="25-40",
                income_level="Middle to upper-middle income",
            ),
            competitive_landscape=self._competitive_landscape(owner.owner_price, questionnaire.pet_type),
        )
        improved = self.client.generate_model(
            task_name="agent_a_product_analysis",
            system_prompt=self._system_prompt(),
            user_payload={
                "task_goal": (
                    "Improve the structured product analysis so a pet brand immediately feels the system understood the product correctly "
                    "before entering China-market strategy and KOL matching."
                ),
                "source_facts": self._source_facts(questionnaire, product),
                "questionnaire": questionnaire.model_dump(),
                "product_data": product.model_dump(),
                "fallback_output": fallback.model_dump(),
                "writing_rules": [
                    "Keep every string direct and high-signal.",
                    "Do not repeat the same claim across multiple fields unless necessary.",
                    "Prefer evidence grounded in description, ingredient list, or guaranteed analysis.",
                    "For china_relevance, use only: high, medium, or low.",
                    "For competitive_landscape, compare by positioning and likely competitor set, not fake market-share statistics.",
                ],
            },
            schema_model=AgentAOutput,
        )
        return improved or fallback

    def _system_prompt(self) -> str:
        return (
            "You are Agent A in DragonWay, a pet-brand China market entry workflow. "
            "Your job is to produce a clean, factual product understanding layer. "
            "The output must read like a strong operator wrote it, not like generic marketing copy. "
            "Use only supported facts, tighten the fallback draft, and make the product logic obvious."
        )

    def _source_facts(self, questionnaire: QuestionnaireInput, product: ProductData) -> dict[str, Any]:
        return {
            "product_name": product.product_name,
            "brand_name": product.brand_name,
            "provider": product.provider,
            "scrape_status": product.scrape_status,
            "description_excerpt": product.description[:500],
            "ingredients_preview": product.ingredients[:8],
            "guaranteed_analysis_preview": product.guaranteed_analysis[:8],
            "questionnaire_claims": questionnaire.core_claims,
            "pet_type": questionnaire.pet_type,
            "food_format": questionnaire.food_format,
            "price": product.price,
            "warnings": product.warnings,
        }

    def _make_selling_point(self, claim: str, product: ProductData) -> SellingPoint:
        profile = CLAIM_LIBRARY.get(claim, None)
        evidence_parts = []
        if product.description:
            evidence_parts.append(product.description[:120])
        if product.ingredients:
            evidence_parts.append(f"Ingredients mention {product.ingredients[0]}")
        if product.guaranteed_analysis:
            evidence_parts.append(f"Nutrition panel includes {product.guaranteed_analysis[0]}")
        evidence = " | ".join(evidence_parts) or product.raw_excerpt[:120]
        relevance = "high" if claim in {"high_protein", "grain_free", "premium_imported", "vet_backed"} else "medium"
        return SellingPoint(
            point=profile["point"] if profile else claim.replace("_", " ").title(),
            evidence=evidence,
            china_relevance=relevance,
        )

    def _us_positioning(self, questionnaire: QuestionnaireInput) -> str:
        if questionnaire.brand_positioning == "premium_import":
            return "Premium import brand competing on quality tier and origin trust"
        if questionnaire.brand_positioning == "scientific":
            return "Science-led pet nutrition brand for owners who demand evidence-backed feeding choices"
        if questionnaire.brand_positioning == "functional":
            return "Function-led product positioned around specific health management outcomes"
        return "Premium specialty pet food positioned for quality-conscious pet owners"

    def _competitive_landscape(self, price_tier: str, pet_type: str) -> str:
        if pet_type == "dog":
            tier_map = {
                "high": "Orijen / Acana / Farmina sit in the premium comparison set.",
                "mid_high": "Pro Plan / Hill's / Farmina are the most relevant comparison points.",
                "mid": "Blue Buffalo / Taste of the Wild / mainstream premium SKUs are the practical comparison set.",
            }
        else:
            tier_map = {
                "high": "Orijen Cat / Farmina / Ziwi Peak are the relevant high-end peers.",
                "mid_high": "Pro Plan / Hill's / Royal Canin premium cat lines are the likely comparison set.",
                "mid": "Mainstream premium cat food brands become the default benchmark.",
            }
        return tier_map.get(price_tier, "Competitive set depends on pricing, claims, and retail channel.")


class ChinaStrategyAnalyzer:
    def __init__(self) -> None:
        self.client = LLMClient()

    def analyze(self, questionnaire: QuestionnaireInput, product: ProductData, agent_a_output: AgentAOutput) -> AgentBOutput:
        localized_points = [
            self._localized_point(claim, questionnaire.preferred_platforms)
            for claim in questionnaire.core_claims
        ]
        if not localized_points:
            localized_points = [
                LocalizedSellingPoint(
                    original="Premium imported pet food",
                    localized="进口高端主食更需要讲清楚成分、来源和长期喂养价值",
                    platform_angle="小红书走成分测评，抖音走真实喂养反馈",
                )
            ]

        owner = questionnaire.target_owner_profile
        platform_split = self._platform_split(questionnaire.preferred_platforms, questionnaire.primary_goal)
        fallback = AgentBOutput(
            china_market_summary=(
                f"中国{questionnaire.pet_type}粮市场对进口、高蛋白、成分透明的接受度持续走强，"
                f"尤其是一线和新一线、具备{owner.owner_price.replace('_', ' ')}消费力的宠主群体。"
            ),
            localized_selling_points=localized_points,
            target_audience_cn=TargetAudienceCN(
                primary=(
                    f"25-35岁，{self._city_label(owner.owner_city)}，{self._price_label(owner.owner_price)}消费力，"
                    f"{self._owner_pet_label(owner.owner_pet)}，愿意为更稳定的主食方案付溢价。"
                ),
                secondary=(
                    "22-30岁的新宠物家庭，正在从基础主粮升级到更高品质、更有说服力的进口或功能性主粮。"
                ),
            ),
            recommended_strategy=RecommendedStrategy(
                platform_split=platform_split,
                content_direction=self._content_direction(questionnaire),
                differentiation=(
                    f"把 {agent_a_output.product_name} 从海外产品介绍，重构成中国宠主更关心的“成分是否更强、喂养是否更稳、溢价是否值得”。"
                ),
            ),
            risk_factors=[
                RiskFactor(
                    risk="Marketplace pages may not scrape cleanly, especially on Amazon and Taobao.",
                    mitigation="Allow manual product description fallback and prioritize Shopify or brand-owned product pages.",
                ),
                RiskFactor(
                    risk="Health-related claims can trigger compliance issues if phrased as treatment outcomes.",
                    mitigation="Use nutrition management language instead of medical or therapeutic claims.",
                ),
            ],
        )
        improved = self.client.generate_model(
            task_name="agent_b_china_strategy",
            system_prompt=self._system_prompt(),
            user_payload={
                "task_goal": (
                    "Translate the product story into a China-market strategy layer with stronger local positioning, clearer platform usage, "
                    "and sharper compliance-aware language."
                ),
                "source_facts": self._source_facts(questionnaire, product, agent_a_output),
                "questionnaire": questionnaire.model_dump(),
                "product_data": product.model_dump(),
                "agent_a_output": agent_a_output.model_dump(),
                "fallback_output": fallback.model_dump(),
                "writing_rules": [
                    "Make the logic feel China-native rather than literal translation.",
                    "Do not introduce fake market sizes, growth rates, or external statistics.",
                    "Keep localized_selling_points punchy and platform-aware.",
                    "Risk factors should be practical and operational, not generic.",
                    "Do not imply treatment, prescription, cure, or regulated health claims.",
                ],
            },
            schema_model=AgentBOutput,
        )
        return improved or fallback

    def _system_prompt(self) -> str:
        return (
            "You are Agent B in DragonWay, responsible for converting a foreign pet product story into a China go-to-market narrative. "
            "You are strong at localization, platform strategy, and compliance-safe phrasing. "
            "Your output should make a brand feel that the system understands how Chinese pet owners evaluate trust, price premium, and content style."
        )

    def _source_facts(
        self,
        questionnaire: QuestionnaireInput,
        product: ProductData,
        agent_a_output: AgentAOutput,
    ) -> dict[str, Any]:
        return {
            "product_name": product.product_name,
            "brand_name": product.brand_name,
            "description_excerpt": product.description[:500],
            "questionnaire_claims": questionnaire.core_claims,
            "preferred_platforms": questionnaire.preferred_platforms,
            "content_preference": questionnaire.content_preference,
            "primary_goal": questionnaire.primary_goal,
            "target_owner_profile": questionnaire.target_owner_profile.model_dump(),
            "brand_positioning": questionnaire.brand_positioning,
            "agent_a_product_summary": agent_a_output.product_summary,
            "agent_a_selling_points": [item.model_dump() for item in agent_a_output.core_selling_points],
            "warnings": product.warnings,
        }

    def _localized_point(self, claim: str, platforms: list[str]) -> LocalizedSellingPoint:
        profile = CLAIM_LIBRARY.get(claim, None)
        if not profile:
            return LocalizedSellingPoint(
                original=claim.replace("_", " ").title(),
                localized=claim.replace("_", " "),
                platform_angle="小红书做深度解释，抖音做直观表达",
            )
        angles = []
        if "xiaohongshu" in platforms:
            angles.append(f"小红书：{profile['angle_xhs']}")
        if "douyin" in platforms:
            angles.append(f"抖音：{profile['angle_douyin']}")
        return LocalizedSellingPoint(
            original=profile["point"],
            localized=profile["localized"],
            platform_angle="；".join(angles) or "小红书做深度解释，抖音做直观表达",
        )

    def _platform_split(self, platforms: list[str], goal: str) -> str:
        if platforms == ["xiaohongshu"]:
            return "小红书 100%（以成分测评和种草转化为主）"
        if platforms == ["douyin"]:
            return "抖音 100%（以声量和直观内容表达为主）"
        if goal == "brand_awareness":
            return "抖音 55%（破圈声量） + 小红书 45%（信任建立）"
        return "小红书 60%（深度种草） + 抖音 40%（补充声量）"

    def _content_direction(self, questionnaire: QuestionnaireInput) -> str:
        prefs = ", ".join(pref.replace("_", " ") for pref in questionnaire.content_preference)
        if prefs:
            return f"优先围绕 {prefs} 组织内容，先建立信任，再导向样品试喂或购买转化。"
        return "优先做成分测评和真实喂养反馈，兼顾信任建立与转化效率。"

    def _city_label(self, owner_city: str) -> str:
        return {
            "tier1": "一线城市",
            "new_tier1": "新一线城市",
            "tier2": "二线城市",
            "any": "全国范围",
        }.get(owner_city, "核心城市")

    def _price_label(self, owner_price: str) -> str:
        return {
            "high": "高",
            "mid_high": "中高",
            "mid": "中等",
        }.get(owner_price, "中高")

    def _owner_pet_label(self, owner_pet: str) -> str:
        return {
            "dog_owner": "犬主",
            "cat_owner": "猫主",
            "multi_pet": "多宠家庭",
        }.get(owner_pet, "宠主")
