"""
Semantic retrieval: embeds a query and finds the most relevant chunks for
one contract via pgvector cosine distance. This is what makes chat "only
answer from the uploaded contract" actually true - the LLM only ever sees
chunks this returns, never the whole document.
"""

import uuid
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.chunk import DocumentChunk
from app.models.contract import Contract
from app.services.embedding_service import EmbeddingService

DEFAULT_TOP_K = 5


@dataclass
class RetrievedChunk:
    chunk: DocumentChunk
    distance: float  # cosine distance: 0 = identical, 2 = opposite


class RetrievalService:
    def __init__(self, db: Session, embedding_service: EmbeddingService):
        self.db = db
        self.embedding_service = embedding_service

    def retrieve(
        self, contract_id: uuid.UUID, query: str, top_k: int = DEFAULT_TOP_K
    ) -> list[RetrievedChunk]:
        query_vector = self.embedding_service.embed_one(query)

        # `.cosine_distance()` compiles to pgvector's <=> operator. Ordering
        # by it directly lets Postgres use the ivfflat index from Phase 4's
        # migration instead of pulling every row into Python to compare.
        distance_expr = DocumentChunk.embedding.cosine_distance(query_vector)

        rows = (
            self.db.query(DocumentChunk, distance_expr.label("distance"))
            .filter(DocumentChunk.contract_id == contract_id)
            .order_by(distance_expr)
            .limit(top_k)
            .all()
        )

        return [RetrievedChunk(chunk=chunk, distance=distance) for chunk, distance in rows]

    def retrieve_across_user_contracts(
        self, user_id: uuid.UUID, query: str, top_k: int = DEFAULT_TOP_K
    ) -> list[RetrievedChunk]:
        """
        Same retrieval, scoped to every contract the user owns rather than
        one - this is what powers "search across all my contracts". The
        JOIN on Contract enforces ownership at the query level, exactly
        like ContractRepository.get_by_id_for_user does for single lookups.
        """
        query_vector = self.embedding_service.embed_one(query)
        distance_expr = DocumentChunk.embedding.cosine_distance(query_vector)

        rows = (
            self.db.query(DocumentChunk, distance_expr.label("distance"))
            .join(Contract, Contract.id == DocumentChunk.contract_id)
            .filter(Contract.user_id == user_id)
            .order_by(distance_expr)
            .limit(top_k)
            .all()
        )

        return [RetrievedChunk(chunk=chunk, distance=distance) for chunk, distance in rows]