"""Shared slowapi limiter so main.py and routers can decorate against the same instance."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
