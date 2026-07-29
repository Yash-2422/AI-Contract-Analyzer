"""
Risk findings - one row per risky/notable clause the LLM identified in a
contract. `chunk_id` links back to the exact source text when available,
but is nullable (SET NULL on delete) so a finding survives even if its
source chunk is later removed by reprocessing.
"""

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class RiskSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Weights used to compute Contract.risk_score - deliberately non-linear
# (critical weighs far more than low) so a single critical issue moves the
# score much more than several low ones, matching how a human reviewer
# would judge overall risk.
SEVERITY_WEIGHTS: dict[RiskSeverity, int] = {
    RiskSeverity.LOW: 1,
    RiskSeverity.MEDIUM: 3,
    RiskSeverity.HIGH: 7,
    RiskSeverity.CRITICAL: 15,
}


class ClauseCategory(str, enum.Enum):
    PAYMENT_TERMS = "payment_terms"
    TERMINATION = "termination"
    NOTICE_PERIOD = "notice_period"
    AUTO_RENEWAL = "auto_renewal"
    CONFIDENTIALITY = "confidentiality"
    NON_COMPETE = "non_compete"
    INDEMNIFICATION = "indemnification"
    LIABILITY = "liability"
    ARBITRATION = "arbitration"
    WARRANTY = "warranty"
    INTELLECTUAL_PROPERTY = "intellectual_property"
    OBLIGATIONS = "obligations"
    OTHER = "other"


class RiskFinding(BaseModel):
    __tablename__ = "risk_findings"

    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chunk_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("document_chunks.id", ondelete="SET NULL"), nullable=True
    )
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)

    category: Mapped[ClauseCategory] = mapped_column(
        Enum(
            ClauseCategory,
            name="clause_category",
            values_callable=lambda enum_cls: [m.value for m in enum_cls],
        ),
        nullable=False,
    )
    severity: Mapped[RiskSeverity] = mapped_column(
        Enum(
            RiskSeverity,
            name="risk_severity",
            values_callable=lambda enum_cls: [m.value for m in enum_cls],
        ),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    suggestion: Mapped[str] = mapped_column(Text, nullable=False)

    contract: Mapped["Contract"] = relationship()