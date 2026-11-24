"""Bounded, safe retries for transient Gemini HTTP failures."""

import logging
import random
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Callable

import httpx

logger = logging.getLogger(__name__)

MAX_RETRIES = 2
MAX_RETRY_DELAY_SECONDS = 8.0
RETRYABLE_STATUS_CODES = {502, 503, 504}
RETRYABLE_EXCEPTIONS = (
    httpx.TimeoutException,
    httpx.NetworkError,
    httpx.RemoteProtocolError,
)


def _retry_after_seconds(response: httpx.Response) -> float | None:
    value = response.headers.get("Retry-After")
    if not value:
        return None
    try:
        return max(0.0, float(value))
    except ValueError:
        try:
            retry_at = parsedate_to_datetime(value)
            if retry_at.tzinfo is None:
                retry_at = retry_at.replace(tzinfo=timezone.utc)
            return max(0.0, (retry_at - datetime.now(timezone.utc)).total_seconds())
        except (TypeError, ValueError, OverflowError):
            return None


def retry_delay(attempt: int, response: httpx.Response | None = None) -> float:
    """Return capped Retry-After or exponential backoff with full jitter."""
    if response is not None:
        retry_after = _retry_after_seconds(response)
        if retry_after is not None:
            return min(retry_after, MAX_RETRY_DELAY_SECONDS)
    ceiling = min(MAX_RETRY_DELAY_SECONDS, 0.5 * (2 ** (attempt - 1)))
    return random.uniform(0.0, ceiling)


def _log_failure(operation: str, attempt: int, *, status_code=None, exc=None):
    logger.warning(
        "Gemini request failure provider=gemini operation=%s attempt=%d status=%s exception=%s",
        operation,
        attempt,
        status_code if status_code is not None else "none",
        type(exc).__name__ if exc is not None else "none",
    )


def request_with_retries(operation: str, request: Callable[[], httpx.Response]):
    """Run one HTTP request, retrying only transient Gemini failures."""
    for attempt in range(1, MAX_RETRIES + 2):
        try:
            response = request()
        except RETRYABLE_EXCEPTIONS as exc:
            _log_failure(operation, attempt, exc=exc)
            if attempt > MAX_RETRIES:
                raise
            time.sleep(retry_delay(attempt))
            continue

        if response.status_code >= 400:
            _log_failure(operation, attempt, status_code=response.status_code)
        if response.status_code not in RETRYABLE_STATUS_CODES or attempt > MAX_RETRIES:
            return response

        time.sleep(retry_delay(attempt, response))

    raise RuntimeError("Gemini retry loop ended unexpectedly")
