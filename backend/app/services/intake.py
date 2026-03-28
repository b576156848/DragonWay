from __future__ import annotations

import re

from backend.app.schemas.campaign import (
    IntakeAnalysisResponse,
    IntakeSignal,
    ProductData,
    QuestionnairePrefill,
)
from backend.app.schemas.questionnaire import (
    BrandPositioning,
    ContentPreference,
    CoreClaim,
    FoodFormat,
    LifeStage,
    PetType,
)
from backend.app.services.scraper import ProductScraper


CLAIM_LABELS: dict[CoreClaim, str] = {
    "high_protein": "High protein",
    "grain_free": "Grain-free",
    "limited_ingredient": "Limited ingredient",
    "fresh_ingredients": "Fresh ingredients",
    "digestive_health": "Digestive support",
    "skin_coat": "Skin & coat",
    "joint_support": "Joint support",
    "vet_backed": "Science-backed",
    "premium_imported": "Premium import",
}

CONTENT_LABELS: dict[ContentPreference, str] = {
    "ingredient_review": "Ingredient breakdown",
    "unboxing": "Unboxing",
    "dog_reaction": "Dog reaction",
    "educational": "Educational angle",
    "vet_endorsement": "Expert endorsement",
    "lifestyle": "Lifestyle use case",
}


class ProductIntakeAnalyzer:
    def __init__(self, scraper: ProductScraper | None = None) -> None:
        self.scraper = scraper or ProductScraper()

    def analyze(self, source: str) -> IntakeAnalysisResponse:
        product = self.scraper.scrape(source)
        corpus = self._corpus(product)

        food_format = self._food_format(corpus)
        pet_type = self._pet_type(corpus)
        life_stage = self._life_stage(corpus)
        claims = self._claims(product, corpus)
        brand_positioning = self._brand_positioning(corpus, claims)
        content_preference = self._content_preferences(corpus, claims)
        content_angles = [CONTENT_LABELS[item] for item in content_preference]

        return IntakeAnalysisResponse(
            product_data=product,
            signals=self._signals(product, food_format, pet_type, life_stage, claims, content_angles),
            praise=self._praise(product, claims, content_angles),
            suggested_content_angles=content_angles,
            prefill=QuestionnairePrefill(
                food_format=food_format,
                pet_type=pet_type,
                life_stage=life_stage,
                core_claims=claims,
                brand_positioning=brand_positioning,
                content_preference=content_preference,
            ),
        )

    def _corpus(self, product: ProductData) -> str:
        parts = [
            product.product_name,
            product.brand_name,
            product.description,
            " ".join(product.ingredients),
            " ".join(product.guaranteed_analysis),
            product.raw_excerpt,
        ]
        return " ".join(part for part in parts if part).lower()

    def _food_format(self, corpus: str) -> FoodFormat:
        mappings: list[tuple[FoodFormat, list[str]]] = [
            ("freeze_dried", ["freeze-dried", "freeze dried"]),
            ("air_dried", ["air-dried", "air dried"]),
            ("fresh", ["fresh", "refrigerated"]),
            ("wet", ["wet", "canned"]),
            ("dry", ["dry dog food", "dry cat food", "dry food", "kibble"]),
        ]
        for value, keywords in mappings:
            if any(keyword in corpus for keyword in keywords):
                return value
        return "other"

    def _pet_type(self, corpus: str) -> PetType:
        if "cat" in corpus and "dog" not in corpus:
            return "cat"
        return "dog"

    def _life_stage(self, corpus: str) -> list[LifeStage]:
        detected: list[LifeStage] = []
        rules: list[tuple[LifeStage, list[str]]] = [
            ("all_life", ["all life stages", "all life stage"]),
            ("puppy", ["puppy", "kitten"]),
            ("adult", ["adult"]),
            ("senior", ["senior"]),
        ]
        for stage, keywords in rules:
            if any(keyword in corpus for keyword in keywords):
                detected.append(stage)
        return detected or ["adult"]

    def _claims(self, product: ProductData, corpus: str) -> list[CoreClaim]:
        claims: list[CoreClaim] = []
        protein = self._protein_percent(product)
        rules: list[tuple[CoreClaim, bool]] = [
            ("limited_ingredient", "limited ingredient" in corpus or "single animal protein" in corpus),
            ("grain_free", "grain-free" in corpus or "free of: grains" in corpus or "grain free" in corpus),
            ("digestive_health", "digestive" in corpus or "allergy-prone" in corpus or "ingredient sensitivity" in corpus),
            ("skin_coat", "essential fatty acids" in corpus or "skin" in corpus or "coat" in corpus),
            ("high_protein", protein >= 30 or "high protein" in corpus),
            ("fresh_ingredients", "real meat as the first ingredient" in corpus or "real meat" in corpus),
            ("vet_backed", "vet" in corpus or "science" in corpus),
            ("premium_imported", "imported" in corpus or "premium" in corpus),
        ]
        for claim, enabled in rules:
            if enabled and claim not in claims:
                claims.append(claim)
        return claims[:3] or ["limited_ingredient", "grain_free"]

    def _brand_positioning(self, corpus: str, claims: list[CoreClaim]) -> BrandPositioning | None:
        if "vet_backed" in claims:
            return "scientific"
        if "digestive_health" in claims or "skin_coat" in claims:
            return "functional"
        if "limited_ingredient" in claims or "grain_free" in claims:
            return "natural"
        if "premium_imported" in claims:
            return "premium_import"
        if "real meat" in corpus:
            return "palatability"
        return None

    def _content_preferences(self, corpus: str, claims: list[CoreClaim]) -> list[ContentPreference]:
        suggestions: list[ContentPreference] = []
        if any(claim in claims for claim in ["limited_ingredient", "grain_free", "high_protein"]):
            suggestions.append("ingredient_review")
        if any(claim in claims for claim in ["digestive_health", "skin_coat", "vet_backed"]):
            suggestions.append("educational")
        if "dog" in corpus:
            suggestions.append("dog_reaction")
        return suggestions[:3] or ["ingredient_review", "dog_reaction"]

    def _protein_percent(self, product: ProductData) -> float:
        for item in product.guaranteed_analysis:
            if "crude protein" not in item.lower():
                continue
            match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*%", item)
            if match:
                return float(match.group(1))
        return 0.0

    def _primary_protein(self, product: ProductData) -> str:
        if product.ingredients:
            first_items = ", ".join(product.ingredients[:2])
            return first_items
        lowered = product.product_name.lower()
        for keyword in ["catfish", "salmon", "lamb", "duck", "turkey", "chicken", "beef", "whitefish"]:
            if keyword in lowered:
                return keyword.title()
        return "Not confidently detected"

    def _signals(
        self,
        product: ProductData,
        food_format: FoodFormat,
        pet_type: PetType,
        life_stage: list[LifeStage],
        claims: list[CoreClaim],
        content_angles: list[str],
    ) -> list[IntakeSignal]:
        category = " / ".join(part for part in [food_format.replace("_", " ").title(), pet_type.title() + " food"] if part)
        analysis = " / ".join(product.guaranteed_analysis[:4]) or "Not found on page"
        stage = " / ".join(item.replace("_", " ").title() for item in life_stage)
        claims_text = " / ".join(CLAIM_LABELS[item] for item in claims)
        source_protein = self._primary_protein(product)
        price_line = f"{product.currency or 'USD'} {product.price}" if product.price else "Not found on page"

        return [
            IntakeSignal(
                key="PRODUCT_NAME",
                label="Product Name",
                value=product.product_name,
                confidence=0.99,
                evidence=product.product_name,
            ),
            IntakeSignal(
                key="BRAND",
                label="Brand",
                value=product.brand_name,
                confidence=0.98,
                evidence=product.brand_name,
            ),
            IntakeSignal(
                key="CATEGORY",
                label="Category",
                value=category,
                confidence=0.92,
                evidence=product.product_name,
            ),
            IntakeSignal(
                key="PROTEIN_SOURCE",
                label="Protein Source",
                value=source_protein,
                confidence=0.88 if product.ingredients else 0.72,
                evidence=", ".join(product.ingredients[:3]) or product.product_name,
            ),
            IntakeSignal(
                key="POSITIONING",
                label="Formula Signals",
                value=claims_text,
                confidence=0.86,
                evidence=product.description[:220] or product.raw_excerpt[:220],
            ),
            IntakeSignal(
                key="LIFE_STAGE",
                label="Life Stage",
                value=stage,
                confidence=0.84,
                evidence=product.description[:220] or product.product_name,
            ),
            IntakeSignal(
                key="GUARANTEED_ANALYSIS",
                label="Guaranteed Analysis",
                value=analysis,
                confidence=0.9 if product.guaranteed_analysis else 0.45,
                evidence=analysis,
            ),
            IntakeSignal(
                key="PRICE_ENTRY",
                label="Price Entry",
                value=price_line,
                confidence=0.78 if product.price else 0.4,
                evidence=price_line,
            ),
            IntakeSignal(
                key="CONTENT_ANGLE",
                label="Suggested Content Angle",
                value=" / ".join(content_angles),
                confidence=0.8,
                evidence=claims_text,
            ),
        ]

    def _praise(self, product: ProductData, claims: list[CoreClaim], content_angles: list[str]) -> str:
        claim_text = ", ".join(CLAIM_LABELS[item].lower() for item in claims[:3])
        angle_text = " + ".join(content_angles[:2]).lower()
        return (
            f"{product.product_name} has strong China-market storytelling potential: the page already presents a concentrated set of signals around "
            f"{claim_text}. That makes it naturally suitable for {angle_text} content, which is exactly the kind of structure that helps a new pet-food "
            "brand earn trust quickly before KOL matching."
        )


intake_analyzer = ProductIntakeAnalyzer()
