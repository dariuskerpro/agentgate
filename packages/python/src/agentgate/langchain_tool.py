"""LangChain tool wrappers for AgentGate."""

from __future__ import annotations

import json
from typing import Any, Type

from langchain_core.tools import BaseTool
from pydantic import BaseModel, ConfigDict, Field

from agentgate.client import AgentGateClient


# -- Input schemas ------------------------------------------------------------

class DiscoverInput(BaseModel):
    """Input for AgentGateDiscoverTool."""
    query: str = Field(description="Search query for finding API endpoints")


class CallInput(BaseModel):
    """Input for AgentGateCallTool."""
    path: str = Field(description="Endpoint path, e.g. /openai/chat")
    data: str = Field(description="JSON string of the request body")
    payment_header: str | None = Field(default=None, description="Optional X-402 payment header")


# -- Tools --------------------------------------------------------------------

class AgentGateDiscoverTool(BaseTool):
    """Search AgentGate marketplace for pay-per-call AI API endpoints."""

    name: str = "agentgate_discover"
    description: str = (
        "Search AgentGate marketplace for pay-per-call AI API endpoints. "
        "Input is a search query string. Returns a list of matching endpoints with names, "
        "descriptions, paths, and prices."
    )
    args_schema: Type[BaseModel] = DiscoverInput
    client: Any = None  # AgentGateClient instance

    model_config = ConfigDict(arbitrary_types_allowed=True)

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


class AgentGateCallTool(BaseTool):
    """Call an AgentGate endpoint with optional x402 payment."""

    name: str = "agentgate_call"
    description: str = (
        "Call an AgentGate endpoint with optional x402 payment. "
        "Provide the endpoint path, a JSON string of request data, and an optional payment header. "
        "Returns the API response or payment requirement details."
    )
    args_schema: Type[BaseModel] = CallInput
    client: Any = None  # AgentGateClient instance

    model_config = ConfigDict(arbitrary_types_allowed=True)

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
