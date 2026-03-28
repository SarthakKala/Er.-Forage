import { Router } from "express";

export const testAiRouter = Router();

testAiRouter.get("/", async (_req, res) => {
  try {
    const rawKey = process.env.OPENROUTER_API_KEY ?? "";
    const normalizedKey = rawKey.replace(/^Bearer\s+/i, "").trim();

    if (!normalizedKey) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY is missing/empty after normalization",
        keyLoaded: Boolean(rawKey)
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${normalizedKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-OpenRouter-Title": "Er.Forge"
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-super-120b-a12b:free",
          messages: [
            {
              role: "user",
              content: 'Reply with exactly this JSON and nothing else: {"test": "working"}'
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      }
    );
    const data = await response.json();
    res.json({
      status: response.status,
      keyLoaded: true,
      keyPrefix: normalizedKey.slice(0, 6),
      data
    });
  } catch (err: any) {
    res.json({ error: err.message });
  }
});
