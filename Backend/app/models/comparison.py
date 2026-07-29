"""
Stores the result of comparing two of a user's contracts. Kept as one row
per comparison run (not versioned/overwritable like summaries) since a
user might reasonably want to re-compare after editing either contract and
keep both results.
"""

import uuid

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ContractComparison(BaseModel):
    __tablename__ = "contract_comparisons"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contract_a_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False
    )
    contract_b_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False
    )

    # Rendered as markdown by the LLM - added/removed/modified clauses,
    # changed payment/notice-period/obligations, each explained. Stored as
    # prose rather than structured JSON: comparison output is inherently
    # explanatory text meant to be read, not machine-processed further.
    result: Mapped[str] = mapped_column(Text, nullable=False)

    contract_a: Mapped["Contract"] = relationship(foreign_keys=[contract_a_id])
    contract_b: Mapped["Contract"] = relationship(foreign_keys=[contract_b_id])