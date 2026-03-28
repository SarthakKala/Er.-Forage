import { env } from "../config/env";

type OpenRouterTextResult =
  | { ok: true; text: string }
  | { ok: false; error: { message: string; details?: unknown } };

const OPENROUTER_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extractJsonFromReasoning(reasoning: string | null | undefined): string | null {
  if (!reasoning) return null;
  const firstBrace = reasoning.lastIndexOf('{\n  "concept_tags"');
  if (firstBrace === -1) return null;
  const snippet = reasoning.slice(firstBrace);
  const lastBrace = snippet.lastIndexOf("}");
  if (lastBrace === -1) return null;
  return snippet.slice(0, lastBrace + 1);
}

async function callOpenRouter(
  normalizedKey: string,
  prompt: string
): Promise<Response> {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${normalizedKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-OpenRouter-Title": "Er.Forge"
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2048
    })
  });
}

export async function generateOpenRouterText(prompt: string): Promise<OpenRouterTextResult> {
  try {
    const normalizedKey = env.OPENROUTER_API_KEY.replace(/^Bearer\s+/i, "").trim();
    if (!normalizedKey) {
      return {
        ok: false,
        error: { message: "OPENROUTER_API_KEY is missing/empty after normalization" }
      };
    }

    let response: Response | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await callOpenRouter(normalizedKey, prompt);

      if (response.status === 429 && attempt < MAX_RETRIES) {
        const waitMs = (attempt + 1) * 15000;
        console.log(`OpenRouter 429 — retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(waitMs);
        continue;
      }

      break;
    }

    if (!response) {
      return { ok: false, error: { message: "OpenRouter: no response after retries" } };
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          reasoning?: string | null;
        };
      }>;
      error?: unknown;
    };

    if (!response.ok) {
      return {
        ok: false,
        error: {
          message: `OpenRouter request failed (${response.status})`,
          details: data.error ?? data
        }
      };
    }

    const msg = data.choices?.[0]?.message;
    const text = msg?.content || extractJsonFromReasoning(msg?.reasoning);
    if (!text) {
      return {
        ok: false,
        error: { message: "OpenRouter response missing content", details: data }
      };
    }

    return { ok: true, text };
  } catch (error) {
    return {
      ok: false,
      error: { message: "OpenRouter request failed", details: error }
    };
  }
}
