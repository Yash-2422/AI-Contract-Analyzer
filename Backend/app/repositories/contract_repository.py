import uuid

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.contract import Contract, ContractStatus


class ContractRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        user_id: uuid.UUID,
        display_name: str,
        original_filename: str,
        stored_path: str,
        mime_type: str,
        size_bytes: int,
    ) -> Contract:
        contract = Contract(
            user_id=user_id,
            display_name=display_name,
            original_filename=original_filename,
            stored_path=stored_path,
            mime_type=mime_type,
            size_bytes=size_bytes,
            status=ContractStatus.UPLOADED,
        )
        self.db.add(contract)
        self.db.commit()
        self.db.refresh(contract)
        return contract

    def get_by_id_for_user(self, contract_id: uuid.UUID, user_id: uuid.UUID) -> Contract | None:
        """
        Ownership is enforced right here in the WHERE clause - a contract
        belonging to another user simply doesn't exist as far as this query
        is concerned, so there's no separate 'is this yours?' check to
        forget elsewhere.
        """
        return (
            self.db.query(Contract)
            .filter(Contract.id == contract_id, Contract.user_id == user_id)
            .first()
        )

    def list_for_user(
        self,
        user_id: uuid.UUID,
        search: str | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Contract], int]:
        query = self.db.query(Contract).filter(Contract.user_id == user_id)

        if search:
            like_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Contract.display_name.ilike(like_pattern),
                    Contract.original_filename.ilike(like_pattern),
                )
            )

        total = query.with_entities(func.count(Contract.id)).scalar()

        items = (
            query.order_by(Contract.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def rename(self, contract: Contract, display_name: str) -> Contract:
        contract.display_name = display_name
        self.db.commit()
        self.db.refresh(contract)
        return contract

    def delete(self, contract: Contract) -> None:
        self.db.delete(contract)
        self.db.commit()