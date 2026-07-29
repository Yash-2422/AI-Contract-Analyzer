"""
Compares two contracts and asks the LLM to enumerate what changed between
them - added/removed/modified clauses, changed payment terms, notice
periods, obligations.
"""

import uuid

from fastapi import HTTPException, status

from app.repositories.chunk_repository import ChunkRepository
from app.repositories.comparison_repository import ComparisonRepository
from app.services.llm_service import LLMService

COMPARISON_SYSTEM_PROMPT = """You are a contract comparison assistant. You will be \
given the text of two contracts, labeled Contract A and Contract B. Compare them \
and produce a clear, well-organized markdown report covering:

1. **Added clauses** - present in B but not A
2. **Removed clauses** - present in A but not B
3. **Modified clauses** - present in both but meaningfully different (quote the \
key difference for each)
4. **Changed payment terms** - if any
5. **Changed notice period** - if any
6. **Changed obligations** - if any

If a section has nothing to report, write "No changes detected" under it rather \
than omitting it. Base your comparison ONLY on the text provided.

Contract A:
{contract_a_text}

Contract B:
{contract_b_text}
"""

MAX_CONTEXT_CHARS_PER_CONTRACT = 8000


class ComparisonService:
    def __init__(
        self,
        chunk_repo: ChunkRepository,
        comparison_repo: ComparisonRepository,
        llm: LLMService,
    ):
        self.chunk_repo = chunk_repo
        self.comparison_repo = comparison_repo
        self.llm = llm

    def compare(
        self, user_id: uuid.UUID, contract_a_id: uuid.UUID, contract_b_id: uuid.UUID
    ):
        if contract_a_id == contract_b_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot compare a contract with itself.",
            )

        text_a = self._get_contract_text(contract_a_id)
        text_b = self._get_contract_text(contract_b_id)

        prompt = COMPARISON_SYSTEM_PROMPT.format(contract_a_text=text_a, contract_b_text=text_b)
        result = self.llm.generate(
            system_prompt=prompt, messages=[{"role": "user", "content": "Compare these contracts."}]
        )

        return self.comparison_repo.create(user_id, contract_a_id, contract_b_id, result)

    def _get_contract_text(self, contract_id: uuid.UUID) -> str:
        chunks = self.chunk_repo.list_for_contract(contract_id)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contract {contract_id} hasn't been processed yet. Call /process first.",
            )

        parts, total = [], 0
        for chunk in chunks:
            piece = f"[Page {chunk.page_number}]\n{chunk.content}\n"
            if total + len(piece) > MAX_CONTEXT_CHARS_PER_CONTRACT:
                break
            parts.append(piece)
            total += len(piece)
        return "\n".join(parts)

    def get_owned_or_404(self, comparison_id: uuid.UUID, user_id: uuid.UUID):
        comparison = self.comparison_repo.get_by_id_for_user(comparison_id, user_id)
        if comparison is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Comparison not found."
            )
        return comparison