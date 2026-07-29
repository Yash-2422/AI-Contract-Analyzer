"""
Generates a plain-English summary of a contract from its stored chunks.
"""

import uuid

from fastapi import HTTPException, status

from app.repositories.chunk_repository import ChunkRepository
from app.repositories.summary_repository import SummaryRepository
from app.services.llm_service import LLMService

SUMMARY_SYSTEM_PROMPT = """You are a contract analysis assistant. Summarize the \
following contract in plain English for someone with no legal background. \
Cover: what the contract is for, who the parties are, key obligations, \
payment terms if any, and the term/duration. Keep it under 300 words. \
Base your summary ONLY on the text provided - do not invent details that \
aren't in the contract text."""

# Keeping this bounded protects both the LLM's context window and, more
# importantly, keeps the summary grounded in the actual document rather
# than an arbitrarily huge, unfocused prompt.
MAX_CONTEXT_CHARS = 12000


class SummaryService:
    def __init__(
        self,
        chunk_repo: ChunkRepository,
        summary_repo: SummaryRepository,
        llm: LLMService,
    ):
        self.chunk_repo = chunk_repo
        self.summary_repo = summary_repo
        self.llm = llm

    def generate(self, contract_id: uuid.UUID):
        chunks = self.chunk_repo.list_for_contract(contract_id)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This contract hasn't been processed yet. Call /process first.",
            )

        full_text = self._build_context(chunks)
        summary_text = self.llm.generate(
            system_prompt=SUMMARY_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": full_text}],
        )
        return self.summary_repo.create(contract_id, summary_text)

    def get_latest(self, contract_id: uuid.UUID):
        summary = self.summary_repo.get_latest_for_contract(contract_id)
        if summary is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No summary has been generated for this contract yet.",
            )
        return summary

    def _build_context(self, chunks) -> str:
        parts = []
        total = 0
        for chunk in chunks:
            piece = f"[Page {chunk.page_number}]\n{chunk.content}\n"
            if total + len(piece) > MAX_CONTEXT_CHARS:
                break
            parts.append(piece)
            total += len(piece)
        return "\n".join(parts)