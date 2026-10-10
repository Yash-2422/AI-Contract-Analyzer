"""
Shared rate limiter instance. In-memory storage, keyed by the real
client IP behind nginx (see get_client_ip below) rather than
slowapi's built-in get_ipaddr, which has a bug in this version that
prevents it from ever reading X-Forwarded-For correctly.

Disabled during tests via RATE_LIMIT_ENABLED=False (see conftest.py) -
TestClient requests all share one address, so real limits would make
tests that log in/register repeatedly fail for reasons unrelated to
what they're testing.
"""

from slowapi import Limiter
from starlette.requests import Request

from app.core.config import settings


def get_client_ip(request: Request) -> str:
    """
    Real client IP behind nginx. nginx's $proxy_add_x_forwarded_for
    APPENDS the TCP peer IP to whatever the client sent, so the header
    can look like "<attacker-supplied>, <real-ip>" - taking the first
    entry would trust a value the client fully controls, so the last
    entry (nginx's own observation) is used instead.

    slowapi's built-in get_ipaddr is not used: it checks for a header
    literally named "X_FORWARDED_FOR" (underscores), which never
    matches the real "X-Forwarded-For" Starlette exposes, so it
    silently falls back to request.client.host - behind nginx that's
    always nginx's own container IP for every visitor
    (laurentS/slowapi#255, open).

    Falls back to request.client.host for direct connections with no
    proxy in front (local dev without Docker, tests).
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[-1].strip()
    if request.client:
        return request.client.host
    return "unknown"


limiter = Limiter(key_func=get_client_ip, enabled=settings.RATE_LIMIT_ENABLED)