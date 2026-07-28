"""
Splits extracted page text into overlapping chunks for embedding.

Pure function on purpose: chunk boundaries directly affect retrieval
quality later (Phase 5/6 chat and search), so this needs to be easy to
unit test and tune without spinning up a database or a model.
"""

from dataclasses import dataclass

DEFAULT_CHUNK_SIZE_CHARS = 1000
DEFAULT_CHUNK_OVERLAP_CHARS = 150


@dataclass
class TextChunk:
    page_number: int
    content: str


class ChunkingService:
    def __init__(
        self,
        chunk_size: int = DEFAULT_CHUNK_SIZE_CHARS,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP_CHARS,
    ):
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be smaller than chunk_size")
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_page(self, page_number: int, text: str) -> list[TextChunk]:
        """
        Splits on paragraph/sentence boundaries where possible so chunks
        don't cut a sentence in half, falling back to a hard character
        split only when a single paragraph exceeds chunk_size on its own.
        """
        text = text.strip()
        if not text:
            return []

        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
        chunks: list[str] = []
        current = ""

        for paragraph in paragraphs:
            candidate = f"{current}\n{paragraph}".strip() if current else paragraph

            if len(candidate) <= self.chunk_size:
                current = candidate
                continue

            if current:
                chunks.append(current)

            if len(paragraph) <= self.chunk_size:
                current = paragraph
            else:
                # Single paragraph longer than chunk_size - hard-split it
                # with overlap so no chunk exceeds the size limit.
                for piece in self._hard_split(paragraph):
                    chunks.append(piece)
                current = ""

        if current:
            chunks.append(current)

        return [TextChunk(page_number=page_number, content=c) for c in chunks]

    def _hard_split(self, text: str) -> list[str]:
        step = self.chunk_size - self.chunk_overlap
        pieces = []
        for start in range(0, len(text), step):
            piece = text[start : start + self.chunk_size]
            if piece:
                pieces.append(piece)
            if start + self.chunk_size >= len(text):
                break
        return pieces