import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.risk import ClauseCategory, RiskSeverity


class RiskFindingResponse(BaseModel):
    id: uuid.UUID
    category: ClauseCategory
    severity: RiskSeverity
    title: str
    explanation: str
    suggestion: str
    page_number: int | None
    created_at: datetime

    class Config:
        from_attributes = True


class RiskAnalysisResponse(BaseModel):
    contract_id: uuid.UUID
    overall_risk_score: int  # 0-100, higher = riskier
    findings: list[RiskFindingResponse]