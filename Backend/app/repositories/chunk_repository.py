import uuid

from sqlalchemy.orm import Session

from app.models.chunk import DocumentChunk


class ChunkRepository:
    def __init__(self, db: Session):
        self.db = db

    def bulk_create(
        self, contract_id: uuid.UUID, chunks: list[dict]
    ) -> list[DocumentChunk]:
        """
        chunks: list of {"chunk_index": int, "page_number": int,
                          "content": str, "embedding": list[float]}
        """
        records = [
            DocumentChunk(
                contract_id=contract_id,
                chunk_index=c["chunk_index"],
                page_number=c["page_number"],
                content=c["content"],
                embedding=c["embedding"],
            )
            for c in chunks
        ]
        self.db.add_all(records)
        self.db.commit()
        for record in records:
            self.db.refresh(record)
        return records

    def list_for_contract(self, contract_id: uuid.UUID) -> list[DocumentChunk]:
        return (
            self.db.query(DocumentChunk)
            .filter(DocumentChunk.contract_id == contract_id)
            .order_by(DocumentChunk.chunk_index)
            .all()
        )

    def delete_for_contract(self, contract_id: uuid.UUID) -> None:
        self.db.query(DocumentChunk).filter(
            DocumentChunk.contract_id == contract_id
        ).delete()
        self.db.commit()