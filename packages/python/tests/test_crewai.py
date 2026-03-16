"""Tests for CrewAI tool wrappers (skipped if crewai not installed)."""

import pytest

crewai = pytest.importorskip("crewai", reason="crewai not installed — skipping")

import httpx
import respx

from agentgate.client import AgentGateClient
from agentgate.crewai_tool import AgentGateCallCrewTool, AgentGateDiscoverCrewTool

API_URL = "https://api.agentgate.online"
FULFILL_URL = "https://fulfill.agentgate.online"

SAMPLE_ENDPOINTS = [
    {
        "path": "/openai/chat",
        "name": "OpenAI Chat",
        "description": "GPT-4 chat completions",
        "price": "$0.01/call",
        "category": "llm",
    },
]


@respx.mock
def test_discover_crew_tool():
    respx.get(f"{API_URL}/endpoints").mock(
        return_value=httpx.Response(200, json=SAMPLE_ENDPOINTS)
    )
    client = AgentGateClient()
    tool = AgentGateDiscoverCrewTool(client=client)
    result = tool._run(query="chat")
    assert "OpenAI Chat" in result


@respx.mock
def test_call_crew_tool_200():
    respx.post(f"{FULFILL_URL}/openai/chat").mock(
        return_value=httpx.Response(200, json={"result": "Hello!"})
    )
    client = AgentGateClient()
    tool = AgentGateCallCrewTool(client=client)
    result = tool._run(path="/openai/chat", data='{"prompt": "Hi"}')
    assert "Hello!" in result


@respx.mock
def test_call_crew_tool_402():
    payment_body = {
        "paymentUrl": "https://pay.example.com/abc",
        "price": "0.01 USD",
        "network": "lightning",
        "address": "lnbc1...",
    }
    respx.post(f"{FULFILL_URL}/openai/chat").mock(
        return_value=httpx.Response(402, json=payment_body)
    )
    client = AgentGateClient()
    tool = AgentGateCallCrewTool(client=client)
    result = tool._run(path="/openai/chat", data='{"prompt": "Hi"}')
    assert "Payment required" in result
    assert "0.01 USD" in result
