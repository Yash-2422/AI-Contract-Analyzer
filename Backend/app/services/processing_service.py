"""
Orchestrates the full document processing pipeline:

    uploaded -> processing -> [extract -> OCR if needed -> chunk -> embed] -> processed
                                                                    (on error) -> failed

Contract.status is updated at each transition so a stuck or failed contract
is immediately visible via GET /contracts/{id} - no separate job-status
table needed for this.
"""

import logging

from app.models.contract import Contract, ContractStatus
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.contract_repository import ContractRepository
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.extraction_service import ExtractionService
from app.services.ocr_service import OCRService
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)


class ProcessingService:
    def __init__(
        self,
        contract_repo: ContractRepository,
        chunk_repo: ChunkRepository,
        storage: StorageService,
        extraction: ExtractionService,
        ocr: OCRService,
        chunking: ChunkingService,
        embedding: EmbeddingService,
    ):
        self.contract_repo = contract_repo
        self.chunk_repo = chunk_repo
        self.storage = storage
        self.extraction = extraction
        self.ocr = ocr
        self.chunking = chunking
        self.embedding = embedding

    def process(self, contract: Contract) -> Contract:
        contract = self._set_status(contract, ContractStatus.PROCESSING)

        try:
            file_path = self.storage.full_path(contract.stored_path)
            pages = self.extraction.extract(file_path, contract.mime_type)

            # Fill in OCR text for any page flagged as scanned/image-only.
            for page in pages:
                if page.needs_ocr:
                    logger.info(
                        "Contract %s page %s needs OCR, running PaddleOCR",
                        contract.id,
                        page.page_number,
                    )
                    page.text = self.ocr.ocr_pdf_page(file_path, page.page_number)

            all_chunks = []
            chunk_index = 0
            for page in pages:
                for text_chunk in self.chunking.chunk_page(page.page_number, page.text):
                    all_chunks.append(
                        {
                            "chunk_index": chunk_index,
                            "page_number": text_chunk.page_number,
                            "content": text_chunk.content,
                        }
                    )
                    chunk_index += 1

            if not all_chunks:
                raise ValueError(
                    "No extractable text found in this document, even after OCR."
                )

            embeddings = self.embedding.embed([c["content"] for c in all_chunks])
            for chunk, vector in zip(all_chunks, embeddings):
                chunk["embedding"] = vector

            # Re-processing (e.g. retry after a fix) should replace, not
            # duplicate, the previous attempt's chunks.
            self.chunk_repo.delete_for_contract(contract.id)
            self.chunk_repo.bulk_create(contract.id, all_chunks)

            return self._set_status(contract, ContractStatus.PROCESSED)

        except Exception:
            logger.exception("Processing failed for contract %s", contract.id)
            return self._set_status(contract, ContractStatus.FAILED)

    def _set_status(self, contract: Contract, status: ContractStatus) -> Contract:
        return self.contract_repo.update(contract, status=status)