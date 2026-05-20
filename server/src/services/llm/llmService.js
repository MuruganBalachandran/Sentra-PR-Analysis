import { env } from "../../config/index.js";

const callOpenAI = async (prompt) => {
  const key = env?.OPENAI_API_KEY || "";
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${t}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return content;
};

const callGemini = async (prompt) => {
  const key = env?.GEMINI_API_KEY || "";
  if (!key) throw new Error("GEMINI_API_KEY missing");

  // All Gemini models use v1beta — try in order of preference
  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-pro",
  ];

  let lastErr;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.warn(`[Gemini] Model ${model} failed (${res.status}), trying next...`);
        lastErr = new Error(`Gemini error ${res.status} (${model}): ${t}`);
        continue;
      }
      const data = await res.json();
      const candidates = data?.candidates || [];
      const parts = candidates?.[0]?.content?.parts || [];
      const text = parts.map((p) => p?.text || "").join("\n");
      console.log(`[Gemini] Success with model: ${model}`);
      return text || "";
    } catch (err) {
      console.warn(`[Gemini] Model ${model} threw error:`, err?.message);
      lastErr = err;
    }
  }
  throw lastErr || new Error("All Gemini models failed");
};

const generateText = async (prompt) => {
  const provider = env?.LLM_PROVIDER || "stub";
  if (provider === "openai") return await callOpenAI(prompt);
  if (provider === "gemini") return await callGemini(prompt);
  return "Risk Type: Example\nAffected Module: Example\nPossible System Impact: Example impact\nRecommended Action: Example mitigation\nSeverity Level (Low / Medium / High): Medium";
};

export { generateText };
