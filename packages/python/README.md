# AgentGate Python SDK

Discover and call pay-per-call AI APIs from the [AgentGate](https://agentgate.ai) marketplace.

## Install

```bash
pip install agentgate

# With LangChain support
pip install agentgate[langchain]

# With CrewAI support
pip install agentgate[crewai]
```

## Quick Start

### Direct Client

```python
from agentgate import AgentGateClient

client = AgentGateClient()

# Discover endpoints
endpoints = client.discover(query="image generation")
for ep in endpoints:
    print(f"{ep['name']} — {ep['price']}")

# Call an endpoint
result = client.call("/stability/image", {"prompt": "a sunset over mountains"})
print(result)
```

### LangChain

```python
from agentgate import AgentGateClient
from agentgate.langchain_tool import AgentGateDiscoverTool, AgentGateCallTool

client = AgentGateClient()

discover = AgentGateDiscoverTool(client=client)
call = AgentGateCallTool(client=client)

# Use with any LangChain agent
tools = [discover, call]
```

### CrewAI

```python
from agentgate import AgentGateClient
from agentgate.crewai_tool import AgentGateDiscoverCrewTool, AgentGateCallCrewTool

client = AgentGateClient()

discover = AgentGateDiscoverCrewTool(client=client)
call = AgentGateCallCrewTool(client=client)

# Use with CrewAI agents
tools = [discover, call]
```

## Docs

Full documentation at [agentgate.ai/docs](https://agentgate.ai/docs)
