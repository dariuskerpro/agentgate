"""AgentGate HTTP client."""

from __future__ import annotations

from typing import Any

import httpx


class AgentGateClient:
    """Base client for the AgentGate API.

    Args:
        api_url: Base URL for the discovery/catalog API.
        fulfill_url: Base URL for calling endpoints (fulfillment).
        timeout: Request timeout in seconds.
    """

    def __init__(
        self,
        api_url: str = "https://api.text2ai.com",
        fulfill_url: str = "https://fulfill.text2ai.com",
        timeout: float = 30.0,
        http_client: httpx.Client | None = None,
    ) -> None:
        self.api_url = api_url.rstrip("/")
        self.fulfill_url = fulfill_url.rstrip("/")
        self._client = http_client or httpx.Client(timeout=timeout)

    # -- Discovery ------------------------------------------------------------

    def discover(
        self,
        query: str | None = None,
        category: str | None = None,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """Search for endpoints on the AgentGate marketplace.

        Args:
            query: Free-text search query.
            category: Filter by category slug.
            limit: Maximum number of results.

        Returns:
            List of endpoint dicts.
        """
        params: dict[str, Any] = {"limit": limit}
        if query is not None:
            params["q"] = query
        if category is not None:
            params["category"] = category

        resp = self._client.get(f"{self.api_url}/endpoints", params=params)
        resp.raise_for_status()
        return resp.json()

    def categories(self) -> list[dict[str, Any]]:
        """List all available endpoint categories.

        Returns:
            List of category dicts.
        """
        resp = self._client.get(f"{self.api_url}/categories")
        resp.raise_for_status()
        return resp.json()

    # -- Fulfillment ----------------------------------------------------------

    def call(
        self,
        path: str,
        data: dict[str, Any],
        payment_header: str | None = None,
    ) -> dict[str, Any]:
        """Call an AgentGate endpoint.

        Args:
            path: Endpoint path (e.g. ``/openai/chat``).
            data: JSON body to send.
            payment_header: Optional X-402 payment header value.

        Returns:
            On 200: the JSON response body.
            On 402: a dict with ``{"payment_required": True, ...}`` containing
            payment details from the response.
        """
        headers: dict[str, str] = {}
        if payment_header is not None:
            headers["X-Payment"] = payment_header

        url = f"{self.fulfill_url}{path}" if path.startswith("/") else f"{self.fulfill_url}/{path}"
        resp = self._client.post(url, json=data, headers=headers)

        if resp.status_code == 402:
            body = resp.json()
            body["payment_required"] = True
            return body

        resp.raise_for_status()
        return resp.json()

    # -- Lifecycle ------------------------------------------------------------

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._client.close()

    def __enter__(self) -> AgentGateClient:
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()
