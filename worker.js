const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

function corsHeaders(request, env) {
  const requestOrigin = request.headers.get("Origin") || "";
  const configured = (env.ALLOWED_ORIGIN || "*").trim();
  const allowOrigin = configured === "*" ? "*" : (requestOrigin === configured ? configured : "null");
  return { ...CORS_HEADERS, "Access-Control-Allow-Origin": allowOrigin, "Content-Type": "application/json; charset=utf-8" };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders(request, env) });
}

function clampMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "free-ai-chat-worker" }, 200, request, env);
    }

    if (url.pathname !== "/chat" || request.method !== "POST") {
      return json({ error: "Not found" }, 404, request, env);
    }

    if (!env.OPENROUTER_API_KEY) {
      return json({ error: "OPENROUTER_API_KEY is not configured in this Worker." }, 500, request, env);
    }

    try {
      const body = await request.json();
      const messages = clampMessages(body?.messages);
      if (!messages.length) return json({ error: "No chat messages were supplied." }, 400, request, env);

      const model = (env.FREE_MODEL || "openrouter/free").trim();
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": env.SITE_URL || "https://github.com/",
          "X-Title": env.SITE_TITLE || "Free AI Chat"
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1200
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.error?.message || `OpenRouter error (${response.status})`;
        return json({ error: message }, response.status, request, env);
      }

      const reply = data?.choices?.[0]?.message?.content;
      if (!reply) return json({ error: "No assistant response was returned by the model." }, 502, request, env);
      return json({ reply, model }, 200, request, env);
    } catch (error) {
      return json({ error: error?.message || "Worker error" }, 500, request, env);
    }
  }
};
