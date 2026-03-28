from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException

from backend.app.schemas_newa import (
    AnalysisSubmitRequest,
    AnalysisSubmitResponse,
    LeadCaptureRequest,
    LeadCaptureResponse,
    QuickChatStartResponse,
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
from backend.app.services.newa_adapter import NewAAdapter


router_newa = APIRouter(prefix="/api/v1")
adapter = NewAAdapter()
SCHEMA_VERSION = "dragonway-newa.v1"


def _assert_schema(schema_header: str | None) -> None:
    if schema_header and schema_header != SCHEMA_VERSION:
        raise HTTPException(status_code=409, detail=f"Schema mismatch: expected {SCHEMA_VERSION}, got {schema_header}")


@router_newa.get("/schema-meta", response_model=SchemaMetaResponse)
def get_schema_meta(x_frontend_schema: str | None = Header(default=None)) -> SchemaMetaResponse:
    _assert_schema(x_frontend_schema)
    return adapter.schema_meta()


@router_newa.post("/quick/parse-url", response_model=QuickParseUrlResponse)
def quick_parse_url(
    payload: QuickParseUrlRequest,
    x_frontend_schema: str | None = Header(default=None),
) -> QuickParseUrlResponse:
    _assert_schema(x_frontend_schema)
    return adapter.quick_parse_url(payload)


@router_newa.post("/quick/session/start", response_model=QuickChatStartResponse)
def quick_chat_start(
    x_frontend_schema: str | None = Header(default=None),
) -> QuickChatStartResponse:
    _assert_schema(x_frontend_schema)
    return adapter.quick_chat_start()


@router_newa.post("/quick/session/turn", response_model=QuickChatTurnResponse)
def quick_chat_turn(
    payload: QuickChatTurnRequest,
    x_frontend_schema: str | None = Header(default=None),
) -> QuickChatTurnResponse:
    _assert_schema(x_frontend_schema)
    return adapter.quick_chat_turn(payload)


@router_newa.post("/quick/match-preview", response_model=QuickMatchResponse)
def quick_match_preview(
    payload: QuickMatchRequest,
    x_frontend_schema: str | None = Header(default=None),
) -> QuickMatchResponse:
    _assert_schema(x_frontend_schema)
    return adapter.quick_match_preview(payload)


@router_newa.post("/quick/refine", response_model=QuickRefineResponse)
def quick_refine(
    payload: QuickRefineRequest,
    x_frontend_schema: str | None = Header(default=None),
) -> QuickRefineResponse:
    _assert_schema(x_frontend_schema)
    return adapter.quick_refine(payload)


@router_newa.post("/analysis/submit", response_model=AnalysisSubmitResponse)
def analysis_submit(
    payload: AnalysisSubmitRequest,
    x_frontend_schema: str | None = Header(default=None),
) -> AnalysisSubmitResponse:
    _assert_schema(x_frontend_schema)
    return adapter.submit_analysis(payload)


@router_newa.post("/leads/capture", response_model=LeadCaptureResponse)
def leads_capture(
    payload: LeadCaptureRequest,
    x_frontend_schema: str | None = Header(default=None),
) -> LeadCaptureResponse:
    _assert_schema(x_frontend_schema)
    return adapter.capture_lead(payload)
