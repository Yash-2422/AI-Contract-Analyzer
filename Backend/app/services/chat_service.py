"""
RAG chat with a contract.

Every assistant reply is grounded in chunks RetrievalService actually found
for that specific contract - the system prompt explicitly forbids answering
from outside that context, and the chunk IDs used are stored alongside the
message so the frontend can show "answered from page 3" style citations.
"""

import uuid

from fastapi import HTTPException, status

from app.models.chat import ChatMessage, MessageRole
from app.repositories.chat_repository import ChatRepository
from app.services.llm_service import LLMService
from app.services.retrieval_service import RetrievalService

CHAT_SYSTEM_PROMPT_TEMPLATE = """You are a contract analysis assistant answering \
questions about a specific uploaded contract. You must answer ONLY using the \
context excerpts below, which were retrieved from that contract. If the answer \
isn't in the provided context, say clearly that the contract doesn't appear to \
address that, rather than guessing. When you do answer, mention which page the \
relevant clause is on.

Context excerpts from the contract:
{context}
"""

# How many prior turns to include as conversation history in the prompt.
# Bounded so a long-running chat doesn't grow the prompt unboundedly.
MAX_HISTORY_MESSAGES = 10


class ChatService:
    def __init__(
        self,
        chat_repo: ChatRepository,
        retrieval: RetrievalService,
        llm: LLMService,
    ):
        self.chat_repo = chat_repo
        self.retrieval = retrieval
        self.llm = llm

    def create_session(self, contract_id: uuid.UUID, user_id: uuid.UUID, title: str | None):
        return self.chat_repo.create_session(contract_id, user_id, title or "New conversation")

    def list_sessions(self, contract_id: uuid.UUID, user_id: uuid.UUID):
        return self.chat_repo.list_sessions(contract_id, user_id)

    def get_session_owned_or_404(self, session_id: uuid.UUID, user_id: uuid.UUID):
        session = self.chat_repo.get_session_for_user(session_id, user_id)
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found."
            )
        return session

    def list_messages(self, session_id: uuid.UUID):
        return self.chat_repo.list_messages(session_id)

    def send_message(self, session, content: str) -> ChatMessage:
        # 1. Persist the user's message first, so it's not lost even if the
        #    LLM call below fails.
        self.chat_repo.create_message(session.id, MessageRole.USER, content, cited_chunk_ids=[])

        # 2. Retrieve the chunks most relevant to THIS question.
        retrieved = self.retrieval.retrieve(session.contract_id, content)

        if not retrieved:
            answer = (
                "This contract hasn't been processed yet, so I don't have any "
                "content to search. Try running /process on it first."
            )
            cited_ids: list[uuid.UUID] = []
        else:
            context = "\n\n".join(
                f"[Page {r.chunk.page_number}]\n{r.chunk.content}" for r in retrieved
            )
            system_prompt = CHAT_SYSTEM_PROMPT_TEMPLATE.format(context=context)

            history = self._build_history(session.id)
            answer = self.llm.generate(
                system_prompt=system_prompt,
                messages=[*history, {"role": "user", "content": content}],
            )
            cited_ids = [r.chunk.id for r in retrieved]

        # 3. Persist the assistant's reply with which chunks grounded it.
        return self.chat_repo.create_message(
            session.id, MessageRole.ASSISTANT, answer, cited_chunk_ids=cited_ids
        )

    def _build_history(self, session_id: uuid.UUID) -> list[dict]:
        messages = self.chat_repo.list_messages(session_id)[-MAX_HISTORY_MESSAGES:]
        return [{"role": m.role.value, "content": m.content} for m in messages]