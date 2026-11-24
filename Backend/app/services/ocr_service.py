"""
OCR for scanned (image-only) PDF pages.

PaddleOCR's model weights are large and slow to load, so the model is
lazy-loaded on first use (a class-level singleton) rather than at import
time - importing this module should never trigger a multi-second model
load or a network call just because the app started up.
"""

import base64
import logging
from pathlib import Path

import fitz  # PyMuPDF - used here only to rasterize a page to an image for OCR
import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.services.gemini_retry import (
    MAX_RETRIES,
    RETRYABLE_EXCEPTIONS,
    request_with_retries,
)

logger = logging.getLogger(__name__)

GEMINI_OCR_TIMEOUT_SECONDS = 90


class OCRService:
    _ocr_engine = None  # lazy singleton, shared across requests in this process

    def _get_engine(self):
        if OCRService._ocr_engine is None:
            logger.info("Loading PaddleOCR model (first use in this process)...")
            from paddleocr import PaddleOCR

            OCRService._ocr_engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        return OCRService._ocr_engine

    def ocr_pdf_page(self, file_path: Path, page_number: int) -> str:
        """page_number is 1-indexed to match ExtractedPage."""
        with fitz.open(file_path) as pdf:
            page = pdf[page_number - 1]
            # Render at 2x zoom for better OCR accuracy on small print.
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            image_bytes = pixmap.tobytes("png")

        if settings.OCR_PROVIDER == "gemini":
            return self._gemini_ocr(image_bytes)

        engine = self._get_engine()
        result = engine.ocr(image_bytes, cls=True)
        if not result or not result[0]:
            return ""

        lines = [line[1][0] for line in result[0]]
        return "\n".join(lines)

    def _gemini_ocr(self, image_bytes: bytes) -> str:
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini OCR is enabled but GEMINI_API_KEY is not configured.",
            )

        endpoint = f"{settings.GEMINI_BASE_URL}/chat/completions"
        payload = {
            "model": settings.GEMINI_MODEL_NAME,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Transcribe the visible document text exactly. "
                                "Preserve paragraph and list breaks. Do not summarize, "
                                "explain, or add text that is not visible. Return an "
                                "empty response if no text is legible."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": "data:image/png;base64,"
                                + base64.b64encode(image_bytes).decode("ascii")
                            },
                        },
                    ],
                }
            ],
            "temperature": 0,
        }

        try:
            response = request_with_retries(
                "ocr",
                lambda: httpx.post(
                    endpoint,
                    headers={
                        "Authorization": f"Bearer {settings.GEMINI_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=GEMINI_OCR_TIMEOUT_SECONDS,
                ),
            )
        except RETRYABLE_EXCEPTIONS as exc:
            logger.error(
                "Gemini request exhausted retries provider=gemini operation=ocr attempts=%d status=none exception=%s",
                MAX_RETRIES + 1,
                type(exc).__name__,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gemini OCR service could not be reached.",
            ) from exc

        if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Gemini OCR quota or rate limit was reached.",
            )
        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gemini OCR request failed.",
            )

        try:
            content = response.json()["choices"][0]["message"]["content"]
            if not isinstance(content, str):
                raise TypeError("Expected a text response")
            return content.strip()
        except (IndexError, KeyError, TypeError) as exc:
            logger.warning("Gemini OCR response had an unexpected format")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gemini returned an invalid OCR response.",
            ) from exc
