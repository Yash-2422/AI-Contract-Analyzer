import uuid

from sqlalchemy.orm import Session

from app.models.comparison import ContractComparison


class ComparisonRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self, user_id: uuid.UUID, contract_a_id: uuid.UUID, contract_b_id: uuid.UUID, result: str
    ) -> ContractComparison:
        comparison = ContractComparison(
            user_id=user_id,
            contract_a_id=contract_a_id,
            contract_b_id=contract_b_id,
            result=result,
        )
        self.db.add(comparison)
        self.db.commit()
        self.db.refresh(comparison)
        return comparison

    def get_by_id_for_user(
        self, comparison_id: uuid.UUID, user_id: uuid.UUID
    ) -> ContractComparison | None:
        return (
            self.db.query(ContractComparison)
            .filter(ContractComparison.id == comparison_id, ContractComparison.user_id == user_id)
            .first()
        )