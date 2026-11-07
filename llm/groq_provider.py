from __future__ import annotations

import os

from .base import LLMRequest, LLMResponse


class GroqProvider:
    """Compatibility adapter for the existing local Groq deployment."""

    def complete(self, request: LLMRequest) -> LLMResponse:
        from rag.groq_client import chat

        parts = [{"data_url": image["data"]} for image in request.images if image.get("data")]
        text = chat(request.prompt, file_parts=parts, json_mode=bool(request.json_schema))
        return LLMResponse(
            text=text,
            model_name=request.model or os.getenv("GROQ_MODEL", ""),
            prompt_version=request.prompt_version,
        )
