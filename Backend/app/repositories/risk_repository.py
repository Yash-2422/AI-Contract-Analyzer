import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.contract import Contract
from app.models.risk import RiskFinding


class RiskRepository:
    def __init__(self, db: Session):
        self.db = db

    def replace_findings(
        self, contract_id: uuid.UUID, findings: list[dict]
    ) -> list[RiskFinding]:
        """
        Regenerating risk analysis replaces the previous findings rather
        than accumulating duplicates - risk analysis reflects the current
        state of the document, not a history of every run.
        """
        self.db.query(RiskFinding).filter(
            RiskFinding.contract_id == contract_id
        ).delete()

        records = [RiskFinding(contract_id=contract_id, **f) for f in findings]
        self.db.add_all(records)
        self.db.commit()

        for r in records:
            self.db.refresh(r)

        return records

    def list_for_contract(self, contract_id: uuid.UUID) -> list[RiskFinding]:
        return (
            self.db.query(RiskFinding)
            .filter(RiskFinding.contract_id == contract_id)
            .order_by(RiskFinding.created_at)
            .all()
        )

    def severity_distribution_for_user(self, user_id: uuid.UUID) -> dict:
        rows = (
            self.db.query(
                RiskFinding.severity,
                func.count(RiskFinding.id),
            )
            .join(
                Contract,
                RiskFinding.contract_id == Contract.id,
            )
            .filter(
                Contract.user_id == user_id,
            )
            .group_by(RiskFinding.severity)
            .all()
        )

        distribution = {
            "low": 0,
            "medium": 0,
            "high": 0,
            "critical": 0,
        }

        for severity, count in rows:
            distribution[severity.lower()] = count

        return distribution