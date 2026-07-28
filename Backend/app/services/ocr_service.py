"""
OCR for scanned (image-only) PDF pages.

PaddleOCR's model weights are large and slow to load, so the model is
lazy-loaded on first use (a class-level singleton) rather than at import
time - importing this module should never trigger a multi-second model
load or a network call just because the app started up.
"""

import logging
from pathlib import Path

import fitz  # PyMuPDF - used here only to rasterize a page to an image for OCR

logger = logging.getLogger(__name__)


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
        engine = self._get_engine()

        with fitz.open(file_path) as pdf:
            page = pdf[page_number - 1]
            # Render at 2x zoom for better OCR accuracy on small print.
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            image_bytes = pixmap.tobytes("png")

        result = engine.ocr(image_bytes, cls=True)
        if not result or not result[0]:
            return ""

        lines = [line[1][0] for line in result[0]]
        return "\n".join(lines)