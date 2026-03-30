/**
 * Placeholder for OpenAI verification of public figures.
 * Without OPENAI_API_KEY, uses light heuristics only.
 */

export type VerifyResult = { ok: true } | { ok: false; reason: string };

function heuristicOk(name: string): VerifyResult {
  const t = name.trim();
  if (t.length < 2) {
    return { ok: false, reason: "Name is too short." };
  }
  if (t.length > 120) {
    return { ok: false, reason: "Name is too long." };
  }
  if (/^\d+$/.test(t)) {
    return { ok: false, reason: "Enter a real person’s name." };
  }
  return { ok: true };
}

export async function verifyCelebrityPublicFigure(name: string): Promise<VerifyResult> {
  const h = heuristicOk(name);
  if (!h.ok) return h;

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              'You verify if a name refers to a real public figure (celebrity, athlete, musician, actor, etc.). Reply JSON only: {"isPublicFigure":true|false,"reason":"short"}',
          },
          {
            role: "user",
            content: `Name: "${name.trim()}"`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return { ok: true };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return { ok: true };

    const parsed = JSON.parse(raw) as {
      isPublicFigure?: boolean;
      reason?: string;
    };

    if (parsed.isPublicFigure === false) {
      return {
        ok: false,
        reason:
          parsed.reason?.trim() ||
          "We could not confirm this as a known public figure.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
