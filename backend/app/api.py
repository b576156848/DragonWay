from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import RedirectResponse

from backend.app.schemas.campaign import (
    CampaignCreateResponse,
    CampaignResult,
    CampaignStatusResponse,
    GmailConnectionStatusResponse,
    IntakeAnalysisResponse,
    OutreachPreviewResponse,
    OutreachSendRequest,
    OutreachSendResponse,
)
from backend.app.schemas.questionnaire import ProductUrlInput, QuestionnaireInput
from backend.app.services.emailer import EmailSender
from backend.app.services.google_oauth import GmailOAuthService
from backend.app.services.intake import intake_analyzer
from backend.app.services.pipeline import pipeline
from backend.app.services.repository import CampaignRepository


router = APIRouter(prefix="/api")
repository = CampaignRepository()
gmail_oauth = GmailOAuthService(repository)
email_sender = EmailSender(gmail_oauth)


@router.post("/intake/analyze-url", response_model=IntakeAnalysisResponse)
def analyze_product_url(payload: ProductUrlInput) -> IntakeAnalysisResponse:
    return intake_analyzer.analyze(payload.product_url)


@router.post("/campaigns", response_model=CampaignCreateResponse)
def create_campaign(payload: QuestionnaireInput, background_tasks: BackgroundTasks) -> CampaignCreateResponse:
    campaign_id = pipeline.create_campaign(payload)
    background_tasks.add_task(pipeline.run_campaign, campaign_id, payload.model_dump())
    return CampaignCreateResponse(campaign_id=campaign_id, status="analyzing")


@router.get("/campaigns/{campaign_id}", response_model=CampaignResult)
def get_campaign(campaign_id: str) -> CampaignResult:
    row = repository.get_campaign(campaign_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if row.result_json is None:
        raise HTTPException(status_code=409, detail="Campaign result is not ready")
    return CampaignResult.model_validate_json(row.result_json)


@router.get("/campaigns/{campaign_id}/status", response_model=CampaignStatusResponse)
def get_campaign_status(campaign_id: str) -> CampaignStatusResponse:
    row = repository.get_campaign(campaign_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return CampaignStatusResponse(
        campaign_id=row.campaign_id,
        status=row.status,
        current_step=row.current_step,
        error_message=row.error_message,
    )


@router.get("/campaigns/{campaign_id}/outreach/preview", response_model=OutreachPreviewResponse)
def get_outreach_preview(campaign_id: str) -> OutreachPreviewResponse:
    row = repository.get_campaign(campaign_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if row.result_json is None:
        raise HTTPException(status_code=409, detail="Campaign result is not ready")
    campaign = CampaignResult.model_validate_json(row.result_json)
    return OutreachPreviewResponse(campaign_id=campaign_id, drafts=campaign.outreach_drafts)


@router.post("/campaigns/{campaign_id}/outreach/send", response_model=OutreachSendResponse)
def send_outreach(campaign_id: str, payload: OutreachSendRequest) -> OutreachSendResponse:
    row = repository.get_campaign(campaign_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if row.result_json is None:
        raise HTTPException(status_code=409, detail="Campaign result is not ready")
    campaign = CampaignResult.model_validate_json(row.result_json)
    try:
        response = email_sender.send(campaign_id, campaign.outreach_drafts, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    result = campaign.model_dump()
    result["status"] = "pushed" if any(item.status in {"sent", "mocked"} for item in response.results) else campaign.status
    repository.set_result(campaign_id, result)
    repository.update_progress(campaign_id, status=result["status"], current_step="push")
    return response


@router.get("/auth/gmail/start")
def start_gmail_auth(redirect_to: str | None = None) -> RedirectResponse:
    try:
        url = gmail_oauth.build_authorization_url(redirect_to)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return RedirectResponse(url=url)


@router.get("/auth/gmail/callback")
def gmail_callback(code: str, state: str) -> RedirectResponse:
    try:
        redirect_to = gmail_oauth.handle_callback(code, state)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return RedirectResponse(url=redirect_to)


@router.get("/auth/gmail/status", response_model=GmailConnectionStatusResponse)
def gmail_status() -> GmailConnectionStatusResponse:
    return GmailConnectionStatusResponse(**gmail_oauth.get_status())


@router.delete("/auth/gmail/status")
def gmail_disconnect() -> dict[str, bool]:
    gmail_oauth.disconnect()
    return {"ok": True}
