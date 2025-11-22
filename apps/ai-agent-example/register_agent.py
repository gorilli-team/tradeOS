#!/usr/bin/env python3
"""
Register an AI agent with the tradeOS backend
"""

import os
import sys
import requests
from typing import Optional

API_URL = os.getenv("API_URL", "http://localhost:3001")
AGENT_NAME = os.getenv("AGENT_NAME", "Example Trading Bot")
OWNER_ADDRESS = os.getenv("OWNER_ADDRESS", "")
AGENT_WALLET = os.getenv("AGENT_WALLET", "")
DESCRIPTION = os.getenv("DESCRIPTION", "An example AI trading agent")
STRATEGY = os.getenv("STRATEGY", "momentum")


def register_agent(
    name: str,
    owner_address: str,
    agent_wallet: str,
    description: Optional[str] = None,
    strategy: Optional[str] = None,
) -> dict:
    """Register an AI agent with the backend"""
    url = f"{API_URL}/ai-agent/register"

    payload = {
        "name": name,
        "ownerAddress": owner_address,
        "walletAddress": agent_wallet,
    }

    if description:
        payload["description"] = description
    if strategy:
        payload["strategy"] = strategy

    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ Error registering agent: {e}")
        if hasattr(e, "response") and e.response is not None:
            print(f"Response: {e.response.text}")
        sys.exit(1)


if __name__ == "__main__":
    print("=" * 50)
    print("tradeOS AI Agent Registration")
    print("=" * 50)

    if not OWNER_ADDRESS:
        print("❌ OWNER_ADDRESS environment variable is required")
        print("   export OWNER_ADDRESS=0xYourWalletAddress")
        sys.exit(1)

    if not AGENT_WALLET:
        print("❌ AGENT_WALLET environment variable is required")
        print("   export AGENT_WALLET=0xAgentWalletAddress")
        sys.exit(1)

    print(f"Agent Name: {AGENT_NAME}")
    print(f"Owner Address: {OWNER_ADDRESS}")
    print(f"Agent Wallet: {AGENT_WALLET}")
    print(f"Strategy: {STRATEGY}")
    print(f"API URL: {API_URL}")
    print("=" * 50)

    result = register_agent(
        name=AGENT_NAME,
        owner_address=OWNER_ADDRESS,
        agent_wallet=AGENT_WALLET,
        description=DESCRIPTION,
        strategy=STRATEGY,
    )

    if result.get("success"):
        agent = result.get("agent", {})
        print("✅ Agent registered successfully!")
        print(f"   Agent ID: {agent.get('agentId')}")
        print(f"   Name: {agent.get('name')}")
        print(f"   Wallet: {agent.get('walletAddress')}")
        print("\n💡 Next steps:")
        print("   1. Make sure the agent wallet has tokens (start a session)")
        print("   2. Run: python ai_agent.py")
    else:
        print("❌ Failed to register agent")
        print(result)
        sys.exit(1)

