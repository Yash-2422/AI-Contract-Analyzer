"""
Generates vector embeddings for text chunks using BAAI/bge-small-en-v1.5.

Lazy-loaded singleton for the same reason as OCRService: importing this
module shouldn't trigger a model download or multi-second load just
because the app started.
"""

import logging

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.chunk import EMBEDDING_DIMENSIONS

logger = logging.getLogger(__name__)

GEMINI_EMBEDDING_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
GEMINI_EMBEDDING_BATCH_SIZE = 100
GEMINI_EMBEDDING_TIMEOUT_SECONDS = 60


class EmbeddingService:
    _model = None  # lazy singleton, shared across requests in this process

    def _get_model(self):
        if EmbeddingService._model is None:
            logger.info("Loading embedding model %s (first use in this process)...", settings.EMBEDDING_MODEL_NAME)
            from sentence_transformers import SentenceTransformer

            EmbeddingService._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        return EmbeddingService._model

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if settings.EMBEDDING_PROVIDER == "gemini":
            # Gemini Embedding 2 distinguishes document and query tasks in
            # the input text, so use matching prefixes in embed_one below.
            documents = [f"title: none | text: {text}" for text in texts]
            return self._gemini_embed(documents)

        model = self._get_model()
        # normalize_embeddings=True so cosine similarity == dot product,
        # which is what pgvector's <#> operator computes fastest.
        vectors = model.encode(texts, normalize_embeddings=True)
        return [vector.tolist() for vector in vectors]

    def embed_one(self, text: str) -> list[float]:
        if settings.EMBEDDING_PROVIDER == "gemini":
            query = f"task: search result | query: {text}"
            return self._gemini_embed([query])[0]
        return self.embed([text])[0]

    def _gemini_embed(self, texts: list[str]) -> list[list[float]]:
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini embeddings are enabled but GEMINI_API_KEY is not configured.",
            )

        model_name = settings.GEMINI_EMBEDDING_MODEL_NAME
        endpoint = f"{GEMINI_EMBEDDING_BASE_URL}/{model_name}:batchEmbedContents"
        headers = {
            "x-goog-api-key": settings.GEMINI_API_KEY,
            "Content-Type": "application/json",
        }
        vectors: list[list[float]] = []

        for start in range(0, len(texts), GEMINI_EMBEDDING_BATCH_SIZE):
            batch = texts[start : start + GEMINI_EMBEDDING_BATCH_SIZE]
            payload = {
                "requests": [
                    {
                        "model": f"models/{model_name}",
                        "content": {"parts": [{"text": text}]},
                        "embedContentConfig": {
                            "outputDimensionality": EMBEDDING_DIMENSIONS
                        },
                    }
                    for text in batch
                ]
            }

            try:
                response = httpx.post(
                    endpoint,
                    headers=headers,
                    json=payload,
                    timeout=GEMINI_EMBEDDING_TIMEOUT_SECONDS,
                )
            except httpx.HTTPError as exc:
                logger.warning("Gemini embedding request failed: %s", type(exc).__name__)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Gemini embedding service could not be reached.",
                ) from exc

            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Gemini embedding quota or rate limit was reached.",
                )
            if response.status_code >= 400:
                logger.warning("Gemini embedding service returned HTTP %s", response.status_code)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Gemini embedding request failed.",
                )

            try:
                batch_vectors = [
                    item["values"] for item in response.json()["embeddings"]
                ]
                if len(batch_vectors) != len(batch) or any(
                    len(vector) != EMBEDDING_DIMENSIONS for vector in batch_vectors
                ):
                    raise ValueError("Unexpected embedding count or dimensions")
            except (KeyError, TypeError, ValueError) as exc:
                logger.warning("Gemini embedding response had an unexpected format")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Gemini returned an invalid embedding response.",
                ) from exc

            vectors.extend(batch_vectors)

        return vectors
