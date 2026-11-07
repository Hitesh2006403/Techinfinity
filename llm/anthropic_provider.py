from __future__ import annotations

import os

from .base import LLMRequest, LLMResponse


class AnthropicProvider:
    """Anthropic Claude adapter kept behind the common LLM interface."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY", "")
        self.model = model or os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5")

    def complete(self, request: LLMRequest) -> LLMResponse:
        if not self.api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not configured.")
        from anthropic import Anthropic

        content = [{"type": "text", "text": request.prompt}]
        for image in request.images:
            content.append({"type": "image", "source": image})
        client = Anthropic(api_key=self.api_key)
        response = client.messages.create(
            model=request.model or self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": content}],
        )
        text = "".join(getattr(block, "text", "") for block in response.content)
        return LLMResponse(
            text=text,
            model_name=request.model or self.model,
            prompt_version=request.prompt_version,
            usage={
                "input_tokens": getattr(response.usage, "input_tokens", 0),
                "output_tokens": getattr(response.usage, "output_tokens", 0),
            },
        )
