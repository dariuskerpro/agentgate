// @agent-gate/sdk — stub
// Will be implemented in Phase 2
export class AgentGate {
  constructor(_config: { wallet: string; budget?: { daily?: string; perTransaction?: string } }) {
    // stub
  }

  async call(_service: string, _params?: Record<string, unknown>): Promise<unknown> {
    throw new Error("Not implemented yet");
  }
}
