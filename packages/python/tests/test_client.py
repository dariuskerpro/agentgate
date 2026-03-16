"""Tests for AgentGateClient."""

import httpx
import pytest
import respx

from agentgate.client import AgentGateClient

API_URL = "https://api.text2ai.com"
FULFILL_URL = "https://fulfill.text2ai.com"

SAMPLE_ENDPOINTS = [
    {
        "path": "/openai/chat",
        "name": "OpenAI Chat",
        "description": "GPT-4 chat completions",
        "price": "$0.01/call",
        "category": "llm",
    },
    {
        "path": "/stability/image",
        "name": "Stability Image",
        "description": "Text-to-image generation",
        "price": "$0.05/call",
        "category": "image",
    },
]

SAMPLE_CATEGORIES = [
    {"name": "LLM", "slug": "llm", "count": 12},
    {"name": "Image", "slug": "image", "count": 5},
]


@respx.mock
def test_discover_returns_endpoints():
    respx.get(f"{API_URL}/endpoints").mock(
        return_value=httpx.Response(200, json=SAMPLE_ENDPOINTS)
    )
    client = AgentGateClient()
    result = client.discover()
    assert len(result) == 2
    assert result[0]["name"] == "OpenAI Chat"


@respx.mock
def test_discover_with_query():
    respx.get(f"{API_URL}/endpoints", params__contains={"q": "chat"}).mock(
        return_value=httpx.Response(200, json=[SAMPLE_ENDPOINTS[0]])
    )
    client = AgentGateClient()
    result = client.discover(query="chat")
    assert len(result) == 1
    assert result[0]["path"] == "/openai/chat"


@respx.mock
def test_categories():
    respx.get(f"{API_URL}/categories").mock(
        return_value=httpx.Response(200, json=SAMPLE_CATEGORIES)
    )
    client = AgentGateClient()
    result = client.categories()
    assert len(result) == 2
    assert result[0]["slug"] == "llm"


@respx.mock
def test_call_200():
    respx.post(f"{FULFILL_URL}/openai/chat").mock(
        return_value=httpx.Response(200, json={"result": "Hello!"})
    )
    client = AgentGateClient()
    result = client.call("/openai/chat", {"prompt": "Hi"})
    assert result == {"result": "Hello!"}


@respx.mock
def test_call_402_payment_required():
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
    result = client.call("/openai/chat", {"prompt": "Hi"})
    assert result["payment_required"] is True
    assert result["price"] == "0.01 USD"
    assert result["network"] == "lightning"
