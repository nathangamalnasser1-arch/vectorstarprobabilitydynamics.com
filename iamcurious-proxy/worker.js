const AGE_PROFILES = {
  young: {
    label: "5 - 7 years",
    desc: "Use very simple words a kindergartner knows. Maximum 3 options. Short sentences. Lots of warmth and excitement.",
  },
  middle: {
    label: "8 - 10 years",
    desc: "Clear words a 3rd-grader knows. 3-4 options. Slightly more detail is fine.",
  },
  older: {
    label: "11 - 13 years",
    desc: "More nuanced language. 4 options. Can mention concepts like documentary, podcast, or encyclopedia.",
  },
};

function buildSystemPrompt(ageKey) {
  const p = AGE_PROFILES[ageKey] || AGE_PROFILES.middle;
  const optionCount = ageKey === "young" ? "3" : "4";
  return `You are a warm, playful learning guide for children, like a loving aunt or older sibling who teaches kids HOW to find answers rather than giving them answers directly.

TARGET AGE: ${p.label}. ${p.desc}

When a child says they are curious about something, never explain it. Instead, ask WHERE they could look to find out more and give clickable options. Keep guiding them deeper with every choice they make.

SAFETY - NEVER BREAK:
- Never suggest the child go somewhere alone or approach any stranger or professional.
- All options must be safe things a child can do at home or school WITH a parent, guardian, or teacher.
- If suggesting asking someone, always say "Ask a parent or teacher" - never a stranger.

FORMAT:
- Respond in raw JSON ONLY. No markdown, no backticks, no preamble.
- Guide message: 1-2 short sentences, ends with a guiding question.
- Exactly ${optionCount} options.
- Safe sources only: YouTube with a parent, library books, National Geographic Kids, kids encyclopedias, asking a parent or teacher, educational documentaries with a parent.
- Options feel like little adventures.

{"message":"Ooh, cars! Where do you think we could learn more about them?","options":["Watch a YouTube video with a parent","Find a library book","Ask a parent or teacher","Check National Geographic Kids"]}

Always build on the path the child has taken so far.`;
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

function jsonResponse(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

async function callOpenRouter({ messages, ageKey }, env) {
  const model = env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": env.SITE_URL || "https://example.com",
      "X-Title": "iamcurious-proxy",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt(ageKey) },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 350,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const detail = data?.error?.message || "Provider request failed";
    throw new Error(detail);
  }
  const text = data?.choices?.[0]?.message?.content || "";
  return text;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowedOrigin = env.ALLOWED_ORIGIN || "";
    if (allowedOrigin && origin && origin !== allowedOrigin) {
      return jsonResponse(403, { error: "Origin not allowed" }, origin);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" }, origin);
    }

    if (!env.OPENROUTER_API_KEY) {
      return jsonResponse(500, { error: "Missing OPENROUTER_API_KEY secret" }, origin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse(400, { error: "Invalid JSON" }, origin);
    }

    const messages = Array.isArray(payload?.messages) ? payload.messages : null;
    const ageKey = payload?.ageKey || "middle";
    if (!messages || messages.length === 0) {
      return jsonResponse(400, { error: "messages[] is required" }, origin);
    }

    try {
      const text = await callOpenRouter({ messages, ageKey }, env);
      return jsonResponse(200, { content: text }, origin);
    } catch (err) {
      return jsonResponse(502, { error: err.message || "Proxy failed" }, origin);
    }
  },
};
