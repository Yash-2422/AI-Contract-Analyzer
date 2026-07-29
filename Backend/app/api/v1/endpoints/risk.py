import uuid

from fastapi import APIRouter, Depends, status

from app.api.v1.dependencies import (
    get_current_user,
    get_document_service,
    get_risk_analysis_service,
)
from app.models.user import User
from app.schemas.risk import RiskAnalysisResponse
from app.services.document_service import DocumentService
from app.services.risk_analysis_service import RiskAnalysisService

router = APIRouter()


@router.post("/contracts/{contract_id}/risk-analysis", response_model=RiskAnalysisResponse)
def analyze_risk(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    risk_service: RiskAnalysisService = Depends(get_risk_analysis_service),
):
    document_service.get_owned_or_404(contract_id, current_user.id)
    findings, overall_score = risk_service.analyze(contract_id)
    return RiskAnalysisResponse(
        contract_id=contract_id, overall_risk_score=overall_score, findings=findings
    )


@router.get("/contracts/{contract_id}/risk-analysis", response_model=RiskAnalysisResponse)
def get_risk_analysis(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    risk_service: RiskAnalysisService = Depends(get_risk_analysis_service),
):
    document_service.get_owned_or_404(contract_id, current_user.id)
    findings, overall_score = risk_service.get_latest(contract_id)
    return RiskAnalysisResponse(
        contract_id=contract_id, overall_risk_score=overall_score, findings=findings
    )