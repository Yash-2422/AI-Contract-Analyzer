"""
Text generation for the app, with two interchangeable providers:

  - "ollama": ChatOllama (LangChain) against a local Ollama server
  - "groq":   Groq's OpenAI-compatible REST API, called directly with httpx

Selected by settings.LLM_PROVIDER. The public interface (generate / stream)
is identical for both, so no calling service needs to know which is active.

Lazy-loaded singleton for Ollama, same pattern as EmbeddingService/
OCRService: importing this module should never trigger a network call just
because the app started - a connection is only attempted on first real use.
"""

import json
import logging
from collections.abc import Iterator

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

GROQ_TIMEOUT_SECONDS = 120


class LLMService:
    _llm = None  # lazy Ollama singleton, shared across requests in this process

    # --- Ollama ---

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
                num_ctx=4096,  # Ollama defaults to 2048 tokens regardless of the model's real context
                # window, silently truncating longer prompts. Contract text + risk-analysis
                # instructions easily exceed that, so this must be set explicitly.
            )
        return LLMService._llm

    def _to_langchain_messages(self, system_prompt: str, messages: list[dict]) -> list:
        from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

        lc_messages = [SystemMessage(content=system_prompt)]
        for m in messages:
            if m["role"] == "user":
                lc_messages.append(HumanMessage(content=m["content"]))
            else:
                lc_messages.append(AIMessage(content=m["content"]))
        return lc_messages

    # --- Groq ---

    def _groq_payload(self, system_prompt: str, messages: list[dict], stream: bool) -> dict:
        return {
            "model": settings.GROQ_MODEL_NAME,
            "messages": [{"role": "system", "content": system_prompt}, *messages],
            "temperature": 0.1,
            "stream": stream,
        }

    def _groq_headers(self) -> dict:
        if not settings.GROQ_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The AI service is not configured on this server.",
            )
        return {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }

    def _raise_for_groq_error(self, response: httpx.Response) -> None:
        if response.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="The AI service is busy right now. Please try again in a minute.",
            )
        if response.status_code >= 400:
            logger.error("Groq API error %s: %s", response.status_code, response.text[:500])
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI service returned an error. Please try again.",
            )

    def _groq_generate(self, system_prompt: str, messages: list[dict]) -> str:
        try:
            response = httpx.post(
                f"{settings.GROQ_BASE_URL}/chat/completions",
                headers=self._groq_headers(),
                json=self._groq_payload(system_prompt, messages, stream=False),
                timeout=GROQ_TIMEOUT_SECONDS,
            )
        except httpx.HTTPError:
            logger.exception("Could not reach Groq API")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not reach the AI service. Please try again.",
            )
        self._raise_for_groq_error(response)
        return response.json()["choices"][0]["message"]["content"]

    def _groq_stream(self, system_prompt: str, messages: list[dict]) -> Iterator[str]:
        try:
            with httpx.stream(
                "POST",
                f"{settings.GROQ_BASE_URL}/chat/completions",
                headers=self._groq_headers(),
                json=self._groq_payload(system_prompt, messages, stream=True),
                timeout=GROQ_TIMEOUT_SECONDS,
            ) as response:
                if response.status_code >= 400:
                    response.read()
                    self._raise_for_groq_error(response)

                for line in response.iter_lines():
                    if not line or not line.startswith("data:"):
                        continue
                    data = line[len("data:"):].strip()
                    if data == "[DONE]":
                        break
                    try:
                        delta = json.loads(data)["choices"][0]["delta"].get("content")
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
                    if delta:
                        yield delta
        except httpx.HTTPError:
            logger.exception("Groq streaming connection failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not reach the AI service. Please try again.",
            )

    # --- Public interface ---

    def generate(self, system_prompt: str, messages: list[dict]) -> str:
        """
        messages: [{"role": "user"|"assistant", "content": "..."}]
        Returns the full response as a single string (blocking).
        """
        if settings.LLM_PROVIDER == "groq":
            return self._groq_generate(system_prompt, messages)

        llm = self._get_llm()
        response = llm.invoke(self._to_langchain_messages(system_prompt, messages))
        return response.content

    def stream(self, system_prompt: str, messages: list[dict]) -> Iterator[str]:
        """Yields response text incrementally, for SSE streaming endpoints."""
        if settings.LLM_PROVIDER == "groq":
            yield from self._groq_stream(system_prompt, messages)
            return

        llm = self._get_llm()
        for chunk in llm.stream(self._to_langchain_messages(system_prompt, messages)):
            if chunk.content:
                yield chunk.content