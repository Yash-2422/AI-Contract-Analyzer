"""
Import every model here so Base.metadata is fully populated when Alembic
(or Base.metadata.create_all, in tests) inspects it. Without this, a model
that's never imported elsewhere silently gets skipped from migrations.
"""

from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.contract import Contract
from app.models.chunk import DocumentChunk
from app.models.chat import ChatSession, ChatMessage
from app.models.summary import ContractSummary
from app.models.risk import RiskFinding
from app.models.comparison import ContractComparison
from app.models.report import GeneratedReport

__all__ = [
    "User",
    "RefreshToken",
    "Contract",
    "DocumentChunk",
    "ChatSession",
    "ChatMessage",
    "ContractSummary",
    "RiskFinding",
    "ContractComparison",
    "GeneratedReport",
]