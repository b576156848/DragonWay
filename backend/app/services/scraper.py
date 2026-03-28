from __future__ import annotations

import json
import re
import threading
import time
import urllib.parse
import urllib.request
from html import unescape
from typing import Any

from backend.app.config import SCRAPER_CACHE_TTL_SECONDS
from backend.app.schemas.campaign import ProductData


USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"


def _strip_html(value: str) -> str:
    return re.sub(r"<[^>]+>", " ", value or "").replace("\n", " ").strip()


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(_strip_html(value))).strip()


def _extract_json_ld(html: str) -> list[Any]:
    pattern = re.compile(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', re.I | re.S)
    items: list[Any] = []
    for match in pattern.findall(html):
        try:
            items.append(json.loads(match.strip()))
        except json.JSONDecodeError:
            continue
    return items


def _find_product_node(node: Any) -> dict[str, Any] | None:
    if isinstance(node, dict):
        if node.get("@type") == "Product":
            return node
        if "@graph" in node:
            for child in node["@graph"]:
                product = _find_product_node(child)
                if product:
                    return product
        for value in node.values():
            product = _find_product_node(value)
            if product:
                return product
    elif isinstance(node, list):
        for item in node:
            product = _find_product_node(item)
            if product:
                return product
    return None


def _extract_meta(html: str, name: str) -> str | None:
    patterns = [
        rf'<meta[^>]+property=["\']{re.escape(name)}["\'][^>]+content=["\'](.*?)["\']',
        rf'<meta[^>]+content=["\'](.*?)["\'][^>]+property=["\']{re.escape(name)}["\']',
        rf'<meta[^>]+name=["\']{re.escape(name)}["\'][^>]+content=["\'](.*?)["\']',
        rf'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']{re.escape(name)}["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, html, re.I | re.S)
        if match:
            return _clean_text(match.group(1))
    return None


def _extract_title(html: str) -> str | None:
    match = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    if match:
        return _clean_text(match.group(1))
    return None


def _extract_list_after_heading(html: str, headings: list[str]) -> list[str]:
    for heading in headings:
        pattern = re.compile(
            rf"{heading}.*?<ul[^>]*>(.*?)</ul>",
            re.I | re.S,
        )
        match = pattern.search(html)
        if not match:
            continue
        items = re.findall(r"<li[^>]*>(.*?)</li>", match.group(1), re.I | re.S)
        cleaned = [_clean_text(item) for item in items if _clean_text(item)]
        if cleaned:
            return cleaned
    return []


def _extract_section(raw_text: str, start_markers: list[str], end_markers: list[str]) -> str:
    if not raw_text:
        return ""

    start = "|".join(re.escape(marker) for marker in start_markers)
    if end_markers:
        end = "|".join(re.escape(marker) for marker in end_markers)
        pattern = re.compile(rf"(?:{start})\s*(.*?)(?:{end}|$)", re.I | re.S)
    else:
        pattern = re.compile(rf"(?:{start})\s*(.*)$", re.I | re.S)

    match = pattern.search(raw_text)
    if not match:
        return ""
    return match.group(1).strip()


def _extract_ingredients_from_text(raw_text: str) -> list[str]:
    section = _extract_section(raw_text, ["Ingredients"], ["GTD Analysis", "Guaranteed Analysis"])
    if not section:
        analysis_split = re.split(r"Crude Protein", raw_text, maxsplit=1, flags=re.I)
        candidate_source = analysis_split[0] if analysis_split else raw_text
        dense_sentences = [
            sentence
            for sentence in re.findall(r"([A-Z][^.]{80,}\.)", candidate_source, re.S)
            if sentence.count(",") >= 6
        ]
        if dense_sentences:
            section = dense_sentences[-1]
    if not section:
        return []
    return [_clean_text(item).strip(" .") for item in section.split(",") if _clean_text(item)]


def _extract_analysis_from_text(raw_text: str) -> list[str]:
    section = _extract_section(raw_text, ["GTD Analysis", "Guaranteed Analysis"], [])
    source = section or raw_text
    items: list[str] = []
    for name, value, bound in re.findall(
        r"(Crude Protein|Crude Fat|Crude Fiber|Moisture|Caloric Content)\s*([0-9]+(?:\.[0-9]+)?(?:\s*kcal per cup|%))\s*(min|max)?",
        source,
        re.I,
    ):
        formatted = _clean_text(f"{name} {value} {bound}".strip())
        if formatted:
            items.append(formatted)
    return items


def _extract_offer_price(offers: Any) -> tuple[str | None, str | None]:
    if isinstance(offers, dict):
        price = offers.get("price")
        currency = offers.get("priceCurrency")
        return (str(price), str(currency) if currency else None) if price is not None else (None, str(currency) if currency else None)

    if not isinstance(offers, list):
        return None, None

    prices: list[float] = []
    currency: str | None = None
    for item in offers:
        if not isinstance(item, dict):
            continue
        raw_price = item.get("price")
        if raw_price is None:
            continue
        try:
            prices.append(float(raw_price))
        except (TypeError, ValueError):
            continue
        if currency is None and item.get("priceCurrency"):
            currency = str(item.get("priceCurrency"))

    if not prices:
        return None, currency
    return f"{min(prices):.2f}", currency


class ProductScraper:
    _cache_lock = threading.Lock()
    _cache: dict[str, tuple[float, dict[str, Any]]] = {}

    def scrape(self, source: str) -> ProductData:
        if source.startswith("http://") or source.startswith("https://"):
            cached = self._read_cache(source)
            if cached is not None:
                return cached

            product = self._scrape_url(source)
            self._write_cache(source, product)
            return product
        return ProductData(
            source_type="text",
            provider="manual",
            scrape_status="partial",
            product_name=source[:80],
            brand_name="Unknown Brand",
            description=source,
            raw_excerpt=source,
            warnings=["Product input was treated as manual text because no URL was detected."],
        )

    def _scrape_url(self, url: str) -> ProductData:
        html = self._fetch_html(url)
        lowered = html.lower()
        blocked_markers = [
            "validatecaptcha",
            "opfcaptcha",
            "/errors/validatecaptcha",
            "enter the characters you see below",
            "type the characters you see in this image",
            "<title dir=\"ltr\">amazon.com</title>",
        ]
        if any(marker in lowered for marker in blocked_markers):
            return ProductData(
                source_type="url",
                source_url=url,
                provider="blocked",
                scrape_status="blocked",
                product_name=self._name_from_url(url),
                brand_name="Unknown Brand",
                description="Product page was blocked by anti-bot protection.",
                raw_excerpt=_clean_text(html[:400]),
                warnings=["Marketplace blocked direct scraping. Continue with reduced confidence or manual product text."],
            )

        host = urllib.parse.urlparse(url).netloc.lower()
        if "myshopify.com" in host or "shopify" in lowered:
            return self._parse_shopify(url, html)
        return self._parse_generic(url, html)

    def _fetch_html(self, url: str) -> str:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.read().decode("utf-8", errors="ignore")

    def _read_cache(self, url: str) -> ProductData | None:
        if SCRAPER_CACHE_TTL_SECONDS <= 0:
            return None

        now = time.monotonic()
        with self._cache_lock:
            cached = self._cache.get(url)
            if cached is None:
                return None
            expires_at, payload = cached
            if expires_at <= now:
                self._cache.pop(url, None)
                return None
        return ProductData.model_validate(payload)

    def _write_cache(self, url: str, product: ProductData) -> None:
        if SCRAPER_CACHE_TTL_SECONDS <= 0:
            return

        with self._cache_lock:
            self._cache[url] = (
                time.monotonic() + SCRAPER_CACHE_TTL_SECONDS,
                product.model_dump(),
            )

    def _parse_shopify(self, url: str, html: str) -> ProductData:
        json_ld_items = _extract_json_ld(html)
        product = None
        for item in json_ld_items:
            product = _find_product_node(item)
            if product:
                break

        offers = product.get("offers", {}) if isinstance(product, dict) else {}
        images = product.get("image", []) if isinstance(product, dict) else []
        if isinstance(images, str):
            images = [images]

        raw_description = str(product.get("description", "")) if product else ""
        description = _clean_text(raw_description) if product else ""
        text_ingredients = _extract_ingredients_from_text(raw_description)
        ingredients = _extract_list_after_heading(html, ["Ingredients", "Ingredient", "Feeding Guide"])
        guaranteed_analysis = _extract_list_after_heading(html, ["Guaranteed Analysis", "Nutrition", "Nutritional Information"])
        if text_ingredients:
            ingredients = text_ingredients
        if not guaranteed_analysis:
            guaranteed_analysis = _extract_analysis_from_text(raw_description)
        price, currency = _extract_offer_price(offers)

        return ProductData(
            source_type="url",
            source_url=url,
            provider="shopify",
            scrape_status="success",
            product_name=_clean_text(product.get("name", "")) if product else self._name_from_url(url),
            brand_name=self._extract_brand(product) if product else "Unknown Brand",
            price=price or _extract_meta(html, "product:price:amount"),
            currency=currency or _extract_meta(html, "product:price:currency"),
            description=description or (_extract_meta(html, "og:description") or ""),
            ingredients=ingredients,
            guaranteed_analysis=guaranteed_analysis,
            images=[str(image) for image in images][:5],
            raw_excerpt=_clean_text(html[:2000]),
            warnings=[],
        )

    def _parse_generic(self, url: str, html: str) -> ProductData:
        return ProductData(
            source_type="url",
            source_url=url,
            provider="generic",
            scrape_status="partial",
            product_name=_extract_meta(html, "og:title") or _extract_title(html) or self._name_from_url(url),
            brand_name="Unknown Brand",
            price=_extract_meta(html, "product:price:amount"),
            currency=_extract_meta(html, "product:price:currency"),
            description=_extract_meta(html, "og:description") or "",
            ingredients=_extract_list_after_heading(html, ["Ingredients", "Ingredient"]),
            guaranteed_analysis=_extract_list_after_heading(html, ["Guaranteed Analysis", "Nutrition"]),
            images=[],
            raw_excerpt=_clean_text(html[:2000]),
            warnings=["Generic parser used. Some product fields may be incomplete."],
        )

    def _name_from_url(self, url: str) -> str:
        path = urllib.parse.urlparse(url).path.rstrip("/")
        slug = path.split("/")[-1] if path else "product"
        return _clean_text(slug.replace("-", " ").replace("_", " ").title())

    def _extract_brand(self, product: dict[str, Any]) -> str:
        brand = product.get("brand")
        if isinstance(brand, str):
            return _clean_text(brand)
        if isinstance(brand, dict):
            return _clean_text(str(brand.get("name", "Unknown Brand")))
        return "Unknown Brand"
