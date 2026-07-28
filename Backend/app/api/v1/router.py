"""
Aggregates every endpoint router under a single /api/v1 prefix.

Phase 2+ will add:
    api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
    api_router.include_router(contracts_router, prefix="/contracts", tags=["Contracts"])
    ... etc.

Keeping this file as the single point of registration means main.py never
needs to change when new features are added.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, documents

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(documents.router, prefix="/contracts", tags=["Documents"])


@api_router.get("/health", tags=["System"])
def health_check() -> dict:
    """Basic liveness check used by Docker healthcheck and uptime monitors."""
    return {"status": "ok"}