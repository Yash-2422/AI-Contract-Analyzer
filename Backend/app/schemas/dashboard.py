from pydantic import BaseModel

from app.schemas.contract import ContractResponse


class RiskDistribution(BaseModel):
    low: int
    medium: int
    high: int
    critical: int


class DashboardResponse(BaseModel):
    total_contracts: int
    recent_contracts: list[ContractResponse]
    storage_used_bytes: int
    risk_distribution: RiskDistribution
    chat_sessions_count: int
    chat_messages_count: int
    summaries_generated_count: int
    comparisons_count: int
    reports_generated_count: int