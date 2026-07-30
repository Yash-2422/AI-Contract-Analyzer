"""
Log of generated PDF reports. The PDF itself is streamed directly in the
response and never stored on disk - this table exists purely so the
dashboard can show a real "Reports Generated" count and history, without
needing to manage report file storage/cleanup.
"""

import enum
import uuid

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class ReportType(str, enum.Enum):
    SUMMARY = "summary"
    RISK = "risk"
    CLAUSE = "clause"
    COMPARISON = "comparison"


class GeneratedReport(BaseModel):
    __tablename__ = "generated_reports"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    report_type: Mapped[ReportType] = mapped_column(
        Enum(
            ReportType,
            name="report_type",
            values_callable=lambda enum_cls: [m.value for m in enum_cls],
        ),
        nullable=False,
    )
    # The contract or comparison this report was generated for. Not a
    # foreign key on purpose: a comparison report references a
    # contract_comparisons row while a summary/risk/clause report
    # references a contracts row - a single FK can't point at either, and
    # this log doesn't need referential integrity to be useful (it's a
    # history/count, not something joined back to its source).
    reference_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)