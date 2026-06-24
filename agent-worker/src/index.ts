interface Env {
  AGENT_DATA: KVNamespace;
}

interface LogEntry {
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
  source?: string;
}

interface Metric {
  timestamp: string;
  name: string;
  value: number;
  unit?: string;
}

interface Feedback {
  timestamp: string;
  type: string;
  message: string;
  user?: string;
}

interface AgentData {
  logs: LogEntry[];
  metrics: Metric[];
  feedback: Feedback[];
  lastAnalysis?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Recibir logs
      if (path === "/api/logs" && request.method === "POST") {
        const log = (await request.json()) as LogEntry;
        log.timestamp = new Date().toISOString();
        await addLog(log, env);
        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders,
        });
      }

      // Recibir métricas
      if (path === "/api/metrics" && request.method === "POST") {
        const metric = (await request.json()) as Metric;
        metric.timestamp = new Date().toISOString();
        await addMetric(metric, env);
        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders,
        });
      }

      // Recibir feedback
      if (path === "/api/feedback" && request.method === "POST") {
        const feedback = (await request.json()) as Feedback;
        feedback.timestamp = new Date().toISOString();
        await addFeedback(feedback, env);
        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders,
        });
      }

      // Obtener datos del agente
      if (path === "/api/data" && request.method === "GET") {
        const data = await getAgentData(env);
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }

      // Obtener estado del agente
      if (path === "/api/status" && request.method === "GET") {
        const data = await getAgentData(env);
        return new Response(
          JSON.stringify({
            status: "active",
            logsCount: data.logs.length,
            metricsCount: data.metrics.length,
            feedbackCount: data.feedback.length,
            lastAnalysis: data.lastAnalysis,
            timestamp: new Date().toISOString(),
          }),
          { headers: corsHeaders }
        );
      }

      // Health check
      if (path === "/health" && request.method === "GET") {
        return new Response(
          JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
          { headers: corsHeaders }
        );
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error("Error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  },

} satisfies ExportedHandler<Env>;

async function addLog(log: LogEntry, env: Env): Promise<void> {
  const data = await getAgentData(env);
  data.logs.push(log);
  if (data.logs.length > 1000) {
    data.logs = data.logs.slice(-1000);
  }
  await saveAgentData(data, env);
  console.log(`[${log.level}] ${log.message}`);
}

async function addMetric(metric: Metric, env: Env): Promise<void> {
  const data = await getAgentData(env);
  data.metrics.push(metric);
  if (data.metrics.length > 10000) {
    data.metrics = data.metrics.slice(-10000);
  }
  await saveAgentData(data, env);
  console.log(`[METRIC] ${metric.name}: ${metric.value}`);
}

async function addFeedback(feedback: Feedback, env: Env): Promise<void> {
  const data = await getAgentData(env);
  data.feedback.push(feedback);
  await saveAgentData(data, env);
  console.log(`[FEEDBACK] ${feedback.type}: ${feedback.message}`);
}

async function analyzeData(env: Env): Promise<void> {
  const data = await getAgentData(env);

  const errorLogs = data.logs.filter((l) => l.level === "error");
  const avgMetrics =
    data.metrics.length > 0
      ? data.metrics.reduce((sum, m) => sum + m.value, 0) / data.metrics.length
      : 0;

  const analysis = {
    timestamp: new Date().toISOString(),
    errorCount: errorLogs.length,
    averageMetrics: avgMetrics.toFixed(2),
    feedbackCount: data.feedback.length,
    topErrors:
      errorLogs.length > 0
        ? errorLogs
            .slice(-5)
            .map((l) => l.message)
            .join("; ")
        : "No errors",
  };

  data.lastAnalysis = JSON.stringify(analysis);
  await saveAgentData(data, env);
  console.log("Analysis completed:", analysis);
}

async function getAgentData(env: Env): Promise<AgentData> {
  try {
    const data = await env.AGENT_DATA.get("agent_data");
    return data
      ? JSON.parse(data)
      : {
          logs: [],
          metrics: [],
          feedback: [],
        };
  } catch {
    return {
      logs: [],
      metrics: [],
      feedback: [],
    };
  }
}

async function saveAgentData(data: AgentData, env: Env): Promise<void> {
  await env.AGENT_DATA.put("agent_data", JSON.stringify(data));
}
