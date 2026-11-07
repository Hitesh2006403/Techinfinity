from __future__ import annotations

import os
from functools import lru_cache


@lru_cache(maxsize=1)
def get_llm():
    provider = os.getenv("LLM_PROVIDER", "groq").lower()
    if provider == "groq":
        from .groq_provider import GroqProvider

        return GroqProvider()
    from .anthropic_provider import AnthropicProvider

    return AnthropicProvider()
