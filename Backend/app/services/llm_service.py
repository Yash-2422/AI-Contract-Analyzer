"""
Wraps ChatOllama (LangChain) for text generation.

Lazy-loaded singleton, same pattern as EmbeddingService/OCRService: importing
this module should never trigger a network call to Ollama just because the
app started - the connection is only attempted on first actual use.
"""

import logging
from collections.abc import Iterator

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    _llm = None  # lazy singleton, shared across requests in this process

    def _get_llm(self):
        if LLMService._llm is None:
            logger.info(
                "Connecting to Ollama at %s (model=%s)...",
                settings.OLLAMA_BASE_URL,
                settings.LLM_MODEL_NAME,
            )
            from langchain_ollama import ChatOllama

            LLMService._llm = ChatOllama(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.LLM_MODEL_NAME,
                temperature=0.1,  # low temperature: contract analysis wants consistency, not creativity
            )
        return LLMService._llm

    def generate(self, system_prompt: str, messages: list[dict]) -> str:
        """
        messages: [{"role": "user"|"assistant", "content": "..."}]
        Returns the full response as a single string (blocking).
        """
        from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

        llm = self._get_llm()
        lc_messages = [SystemMessage(content=system_prompt)]
        for m in messages:
            if m["role"] == "user":
                lc_messages.append(HumanMessage(content=m["content"]))
            else:
                lc_messages.append(AIMessage(content=m["content"]))

        response = llm.invoke(lc_messages)
        return response.content

    def stream(self, system_prompt: str, messages: list[dict]) -> Iterator[str]:
        """Yields response text incrementally, for SSE streaming endpoints."""
        from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

        llm = self._get_llm()
        lc_messages = [SystemMessage(content=system_prompt)]
        for m in messages:
            if m["role"] == "user":
                lc_messages.append(HumanMessage(content=m["content"]))
            else:
                lc_messages.append(AIMessage(content=m["content"]))

        for chunk in llm.stream(lc_messages):
            if chunk.content:
                yield chunk.content