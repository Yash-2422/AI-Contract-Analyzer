"""
Generates vector embeddings for text chunks using BAAI/bge-small-en-v1.5.

Lazy-loaded singleton for the same reason as OCRService: importing this
module shouldn't trigger a model download or multi-second load just
because the app started.
"""

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


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
        model = self._get_model()
        # normalize_embeddings=True so cosine similarity == dot product,
        # which is what pgvector's <#> operator computes fastest.
        vectors = model.encode(texts, normalize_embeddings=True)
        return [vector.tolist() for vector in vectors]

    def embed_one(self, text: str) -> list[float]:
        return self.embed([text])[0]