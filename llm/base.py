from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol, Sequence


@dataclass(frozen=True)
class LLMRequest:
    prompt: str
    images: Sequence[dict] = field(default_factory=tuple)
    json_schema: dict | None = None
    model: str | None = None
    prompt_version: str = "eadaes-v1"


@dataclass(frozen=True)
class LLMResponse:
    text: str
    model_name: str
    prompt_version: str
    usage: dict = field(default_factory=dict)


class LLMProvider(Protocol):
    def complete(self, request: LLMRequest) -> LLMResponse:
        """Return one structured or plain response for a model request."""
