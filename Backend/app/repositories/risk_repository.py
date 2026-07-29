import uuid

from sqlalchemy.orm import Session

from app.models.risk import RiskFinding


class RiskRepository:
    def __init__(self, db: Session):
        self.db = db

    def replace_findings(self, contract_id: uuid.UUID, findings: list[dict]) -> list[RiskFinding]:
        """
        Regenerating risk analysis replaces the previous findings rather
        than accumulating duplicates - risk analysis reflects the current
        state of the document, not a history of every run.
        """
        self.db.query(RiskFinding).filter(RiskFinding.contract_id == contract_id).delete()

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