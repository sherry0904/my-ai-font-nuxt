/**
 * GET /api/model-info
 * 回傳目前使用的 AI 模型名稱
 */
export default defineEventHandler(() => {
  const provider = process.env.AI_PROVIDER || "gemini";

  const models: Record<string, string> = {
    groq: "qwen/qwen3-32b (Groq)",
    gemini: "gemini-2.5-flash-lite (Google)",
  };

  return {
    provider,
    model: models[provider] || provider,
  };
});
