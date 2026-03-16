"""CrewAI tool wrappers for AgentGate."""

from __future__ import annotations

import json
from typing import Any, Type

try:
    from crewai.tools import BaseTool as CrewAIBaseTool
except ImportError:
    CrewAIBaseTool = None  # type: ignore[assignment, misc]

from pydantic import BaseModel, Field

from agentgate.client import AgentGateClient


# -- Input schemas ------------------------------------------------------------

class DiscoverInput(BaseModel):
    """Input for discover tool."""
    query: str = Field(description="Search query for finding API endpoints")


class CallInput(BaseModel):
    """Input for call tool."""
    path: str = Field(description="Endpoint path, e.g. /openai/chat")
    data: str = Field(description="JSON string of the request body")
    payment_header: str | None = Field(default=None, description="Optional X-402 payment header")


def _require_crewai() -> type:
    if CrewAIBaseTool is None:
        raise ImportError(
            "crewai is required for CrewAI tools. Install with: pip install agentgate[crewai]"
        )
    return CrewAIBaseTool


# -- Tools --------------------------------------------------------------------

def _make_discover_tool_cls() -> type | None:
    """Dynamically create the discover tool class (avoids import error when crewai missing)."""
    Base = _require_crewai()

    class AgentGateDiscoverCrewTool(Base):  # type: ignore[misc]
        """Search AgentGate marketplace for pay-per-call AI API endpoints."""

        name: str = "AgentGate Discover"
        description: str = (
            "Search AgentGate marketplace for pay-per-call AI API endpoints. "
            "Input is a search query string."
        )
        args_schema: Type[BaseModel] = DiscoverInput
        client: Any = None

        class Config:
            arbitrary_types_allowed = True

        def __init__(self, client: AgentGateClient, **kwargs: Any) -> None:
            super().__init__(client=client, **kwargs)

        def _run(self, query: str) -> str:
            endpoints = self.client.discover(query=query)
            if not endpoints:
                return "No endpoints found."
            lines = []
            for ep in endpoints:
                name = ep.get("name", "Unknown")
                path = ep.get("path", "")
                price = ep.get("price", "N/A")
                desc = ep.get("description", "")
                lines.append(f"• {name} ({path}) — {price}\n  {desc}")
            return "\n".join(lines)

    return AgentGateDiscoverCrewTool


def _make_call_tool_cls() -> type | None:
    """Dynamically create the call tool class."""
    Base = _require_crewai()

    class AgentGateCallCrewTool(Base):  # type: ignore[misc]
        """Call an AgentGate endpoint with optional x402 payment."""

        name: str = "AgentGate Call"
        description: str = (
            "Call an AgentGate endpoint with optional x402 payment. "
            "Provide the endpoint path and JSON request data."
        )
        args_schema: Type[BaseModel] = CallInput
        client: Any = None

        class Config:
            arbitrary_types_allowed = True

        def __init__(self, client: AgentGateClient, **kwargs: Any) -> None:
            super().__init__(client=client, **kwargs)

        def _run(self, path: str, data: str, payment_header: str | None = None) -> str:
            try:
                parsed = json.loads(data)
            except json.JSONDecodeError:
                return f"Error: invalid JSON data: {data}"

            result = self.client.call(path=path, data=parsed, payment_header=payment_header)

            if result.get("payment_required"):
                return (
                    f"Payment required!\n"
                    f"Price: {result.get('price', 'N/A')}\n"
                    f"Network: {result.get('network', 'N/A')}\n"
                    f"Address: {result.get('address', 'N/A')}"
                )

            return json.dumps(result, indent=2)

    return AgentGateCallCrewTool


# Public API — lazily constructed to avoid hard crewai dependency
def AgentGateDiscoverCrewTool(client: AgentGateClient, **kwargs: Any):  # noqa: N802
    """Create a CrewAI discover tool instance."""
    cls = _make_discover_tool_cls()
    return cls(client=client, **kwargs)


def AgentGateCallCrewTool(client: AgentGateClient, **kwargs: Any):  # noqa: N802
    """Create a CrewAI call tool instance."""
    cls = _make_call_tool_cls()
    return cls(client=client, **kwargs)
