"""create generated reports table

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-30

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None

report_type_enum = postgresql.ENUM("summary", "risk", "clause", "comparison", name="report_type")


def upgrade() -> None:
    report_type_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "generated_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "report_type",
            postgresql.ENUM("summary", "risk", "clause", "comparison", name="report_type", create_type=False),
            nullable=False,
        ),
        # Not a foreign key: this row logs a contract_id for
        # summary/risk/clause reports but a contract_comparisons id for
        # comparison reports - a single FK can't reference either table
        # conditionally, and this log is a count/history, never joined
        # back to its source, so referential integrity isn't needed here.
        sa.Column("reference_id", postgresql.UUID(as_uuid=True), nullable=False),
    )
    op.create_index("ix_generated_reports_user_id", "generated_reports", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_generated_reports_user_id", table_name="generated_reports")
    op.drop_table("generated_reports")
    report_type_enum.drop(op.get_bind(), checkfirst=True)