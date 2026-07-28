"""
Filesystem storage for uploaded contracts.

Every bit of "where do bytes live on disk" logic lives here and nowhere
else. If this becomes S3/GCS storage later, only this file changes -
DocumentService and the endpoints never construct a path themselves.
"""

import uuid
from pathlib import Path

from app.core.config import settings


class StorageService:
    def __init__(self) -> None:
        self.base_dir = Path(settings.UPLOAD_DIR)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def build_relative_path(self, user_id: uuid.UUID, original_filename: str) -> str:
        """
        Generates a collision-proof on-disk path. We never use the client's
        filename directly for the actual path - only its extension - so a
        filename like '../../etc/passwd' or 'a" OR "1"="1.pdf' can't do
        anything except fail extension validation upstream.
        """
        extension = Path(original_filename).suffix.lower()
        unique_name = f"{uuid.uuid4().hex}{extension}"
        return f"{user_id}/{unique_name}"

    def save(self, relative_path: str, content: bytes) -> None:
        full_path = self.base_dir / relative_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_bytes(content)

    def delete(self, relative_path: str) -> None:
        full_path = self.base_dir / relative_path
        full_path.unlink(missing_ok=True)

    def full_path(self, relative_path: str) -> Path:
        return self.base_dir / relative_path