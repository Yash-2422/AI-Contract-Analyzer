"""
Stored AI-generated summaries. Kept as an append-only history (not a single
column on Contract) so regenerating a summary after re-processing doesn't
destroy the previous version - GET returns the latest by created_at.
"""

import uuid

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ContractSummary(BaseModel):
    __tablename__ = "contract_summaries"

    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    contract: Mapped["Contract"] = relationship()