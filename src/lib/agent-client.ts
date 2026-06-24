const AGENT_URL =
  import.meta.env.VITE_AGENT_WORKER_URL ||
  "https://pack-2-cero-agent.diegorem006.workers.dev";

export async function logToAgent(
  level: "error" | "warn" | "info",
  message: string,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch(`${AGENT_URL}/api/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level,
        message,
        source: "pack-2-cero-sales",
        context,
      }),
    });
  } catch (err) {
    console.error("Failed to log to agent:", err);
  }
}

export async function sendMetricToAgent(
  name: string,
  value: number,
  unit?: string
): Promise<void> {
  try {
    await fetch(`${AGENT_URL}/api/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, value, unit }),
    });
  } catch (err) {
    console.error("Failed to send metric to agent:", err);
  }
}

export async function sendFeedbackToAgent(
  type: string,
  message: string,
  user?: string
): Promise<void> {
  try {
    await fetch(`${AGENT_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message, user }),
    });
  } catch (err) {
    console.error("Failed to send feedback to agent:", err);
  }
}

export async function getAgentData(): Promise<any> {
  try {
    const response = await fetch(`${AGENT_URL}/api/data`);
    return await response.json();
  } catch (err) {
    console.error("Failed to get agent data:", err);
    return null;
  }
}

export async function getAgentStatus(): Promise<any> {
  try {
    const response = await fetch(`${AGENT_URL}/api/status`);
    return await response.json();
  } catch (err) {
    console.error("Failed to get agent status:", err);
    return null;
  }
}
