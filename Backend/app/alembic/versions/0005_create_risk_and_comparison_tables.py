"""create risk findings and contract comparisons tables

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-29

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

clause_category_enum = postgresql.ENUM(
    "payment_terms", "termination", "notice_period", "auto_renewal", "confidentiality",
    "non_compete", "indemnification", "liability", "arbitration", "warranty",
    "intellectual_property", "obligations", "other",
    name="clause_category",
)
risk_severity_enum = postgresql.ENUM("low", "medium", "high", "critical", name="risk_severity")


def upgrade() -> None:
    clause_category_enum.create(op.get_bind(), checkfirst=True)
    risk_severity_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "risk_findings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("document_chunks.id", ondelete="SET NULL"), nullable=True),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("category", postgresql.ENUM(
            "payment_terms", "termination", "notice_period", "auto_renewal", "confidentiality",
            "non_compete", "indemnification", "liability", "arbitration", "warranty",
            "intellectual_property", "obligations", "other",
            name="clause_category", create_type=False,
        ), nullable=False),
        sa.Column("severity", postgresql.ENUM("low", "medium", "high", "critical", name="risk_severity", create_type=False), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("suggestion", sa.Text(), nullable=False),
    )
    op.create_index("ix_risk_findings_contract_id", "risk_findings", ["contract_id"])

    op.create_table(
        "contract_comparisons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contract_a_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contract_b_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("result", sa.Text(), nullable=False),
    )
    op.create_index("ix_contract_comparisons_user_id", "contract_comparisons", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_contract_comparisons_user_id", table_name="contract_comparisons")
    op.drop_table("contract_comparisons")

    op.drop_index("ix_risk_findings_contract_id", table_name="risk_findings")
    op.drop_table("risk_findings")

    risk_severity_enum.drop(op.get_bind(), checkfirst=True)
    clause_category_enum.drop(op.get_bind(), checkfirst=True)