"""Shared types for AgentGate SDK."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Endpoint:
    """An API endpoint discovered on AgentGate."""

    path: str
    name: str
    description: str
    price: str
    category: str
    extra: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Endpoint:
        return cls(
            path=data.get("path", ""),
            name=data.get("name", ""),
            description=data.get("description", ""),
            price=data.get("price", ""),
            category=data.get("category", ""),
            extra={k: v for k, v in data.items() if k not in ("path", "name", "description", "price", "category")},
        )


@dataclass
class PaymentRequired:
    """402 Payment Required response."""

    status: int = 402
    payment_url: str = ""
    price: str = ""
    network: str = ""
    address: str = ""
    extra: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> PaymentRequired:
        return cls(
            payment_url=data.get("paymentUrl", ""),
            price=data.get("price", ""),
            network=data.get("network", ""),
            address=data.get("address", ""),
            extra={k: v for k, v in data.items() if k not in ("paymentUrl", "price", "network", "address")},
        )


@dataclass
class Category:
    """An endpoint category."""

    name: str
    slug: str
    count: int = 0

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Category:
        return cls(
            name=data.get("name", ""),
            slug=data.get("slug", ""),
            count=data.get("count", 0),
        )
