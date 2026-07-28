"""
Application-wide logging configuration.

Called once from main.py at startup. Every module then just does:
    import logging
    logger = logging.getLogger(__name__)
"""

import logging
import sys

from app.core.config import settings


def configure_logging() -> None:
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.handlers = [stream_handler]

    # Quiet down noisy third-party loggers unless we're debugging.
    for noisy_logger in ("sqlalchemy.engine", "httpx", "uvicorn.access"):
        logging.getLogger(noisy_logger).setLevel(
            logging.INFO if settings.DEBUG else logging.WARNING
        )
        