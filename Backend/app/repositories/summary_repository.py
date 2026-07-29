import uuid

from sqlalchemy.orm import Session

from app.models.summary import ContractSummary


class SummaryRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, contract_id: uuid.UUID, content: str) -> ContractSummary:
        summary = ContractSummary(contract_id=contract_id, content=content)
        self.db.add(summary)
        self.db.commit()
        self.db.refresh(summary)
        return summary

    def get_latest_for_contract(self, contract_id: uuid.UUID) -> ContractSummary | None:
        return (
            self.db.query(ContractSummary)
            .filter(ContractSummary.contract_id == contract_id)
            .order_by(ContractSummary.created_at.desc())
            .first()
        )