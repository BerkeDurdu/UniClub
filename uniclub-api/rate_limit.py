"""Shared slowapi limiter so main.py and routers can decorate against the same instance."""
import os
import sys

from slowapi import Limiter
from slowapi.util import get_remote_address

# Disable rate limiting during tests — otherwise the suite trips its own limits.
# Pytest sets PYTEST_CURRENT_TEST per test; the `pytest` module is also imported
# at collection time. Either signal is enough to switch the limiter off.
_under_pytest = "pytest" in sys.modules or "PYTEST_CURRENT_TEST" in os.environ
_env_disabled = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ("0", "false", "no")

limiter = Limiter(
    key_func=get_remote_address,
    enabled=not (_under_pytest or _env_disabled),
)
