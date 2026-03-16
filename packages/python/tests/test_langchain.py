"""Tests for LangChain tool wrappers."""

import httpx
import pytest
import respx

from agentgate.client import AgentGateClient
from agentgate.langchain_tool import AgentGateCallTool, AgentGateDiscoverTool

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
def test_discover_tool_returns_formatted_list():
    respx.get(f"{API_URL}/endpoints").mock(
        return_value=httpx.Response(200, json=SAMPLE_ENDPOINTS)
    )
    client = AgentGateClient()
    tool = AgentGateDiscoverTool(client=client)
    result = tool._run(query="chat")
    assert "OpenAI Chat" in result
    assert "/openai/chat" in result
    assert "$0.01/call" in result


@respx.mock
def test_discover_tool_no_results():
    respx.get(f"{API_URL}/endpoints").mock(
        return_value=httpx.Response(200, json=[])
    )
    client = AgentGateClient()
    tool = AgentGateDiscoverTool(client=client)
    result = tool._run(query="nonexistent")
    assert result == "No endpoints found."


@respx.mock
def test_call_tool_200():
    respx.post(f"{FULFILL_URL}/openai/chat").mock(
        return_value=httpx.Response(200, json={"result": "Hello!"})
    )
    client = AgentGateClient()
    tool = AgentGateCallTool(client=client)
    result = tool._run(path="/openai/chat", data='{"prompt": "Hi"}')
    assert '"result"' in result
    assert "Hello!" in result


@respx.mock
def test_call_tool_402():
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
    tool = AgentGateCallTool(client=client)
    result = tool._run(path="/openai/chat", data='{"prompt": "Hi"}')
    assert "Payment required" in result
    assert "0.01 USD" in result
    assert "lightning" in result


def test_call_tool_invalid_json():
    client = AgentGateClient()
    tool = AgentGateCallTool(client=client)
    result = tool._run(path="/test", data="not-json")
    assert "Error" in result
