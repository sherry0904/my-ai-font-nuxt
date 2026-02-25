import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import {
  streamText,
  tool,
  zodSchema,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { z } from "zod";

/**
 * 字體推薦工具的參數 schema
 * AI SDK 6 + Zod v4：使用 zodSchema() 包裝確保正確轉換為 JSON Schema
 * 參考文件：https://ai-sdk.dev/docs/reference/ai-sdk-core/zod-schema
 */
const fontCardSchema = zodSchema(
  z.object({
    name: z
      .string()
      .describe("華康字體的完整名稱，例如：華康威風體、華康金剛黑、華康儷宋體"),
    description: z
      .string()
      .describe("推薦理由，說明為什麼這款字體適合使用者的設計情境"),
  }),
);

/**
 * 根據環境變數選擇 AI 模型
 */
function getAIModel() {
  const provider = process.env.AI_PROVIDER || "gemini";

  if (provider === "groq") {
    // Groq: 速度超快，額度大 (14,400+ 次/天)
    // llama-3.3-70b-versatile: 支援 function calling, 70B 參數
    return groq("llama-3.3-70b-versatile");
  }

  // 預設使用 Gemini: 穩定有保障 (20 次/天)
  return google("gemini-2.5-flash-lite");
}

/**
 * POST /api/chat
 * 處理聊天訊息並使用 AI 生成回應
 *
 * 訊息流程：
 * 1. 前端 (Chat 類別) 傳送 UIMessage[] 格式
 * 2. 後端使用 convertToModelMessages 轉換為 ModelMessage[] 格式
 * 3. 呼叫 AI API (Gemini 或 Groq)
 * 4. 使用 toUIMessageStreamResponse 回傳串流回應給前端
 */
export default defineEventHandler(async (event) => {
  try {
    // 1. 接收前端傳來的 UIMessage[] 格式訊息
    const { messages } = await readBody<{ messages: UIMessage[] }>(event);

    // 2. 驗證訊息格式
    if (!messages || !Array.isArray(messages)) {
      throw createError({
        statusCode: 400,
        message: "Invalid messages format",
      });
    }

    const provider = process.env.AI_PROVIDER || "gemini";
    console.log(`[Chat API] 📨 收到訊息 | 模型: ${provider}`);

    // 3. 呼叫 AI 模型
    const result = await streamText({
      // 動態選擇模型 (Gemini 或 Groq)
      model: getAIModel(),

      // 將 UIMessage[] 轉換為 ModelMessage[] 給 AI 使用
      messages: await convertToModelMessages(messages),

      // 系統提示詞：定義 AI 的角色和行為
      system: `你是一位專業的華康字體顧問。

當使用者描述設計需求時，請：
1. 使用 show_font_card 工具推薦「一款」最適合的華康字體
2. 必須提供完整的 name（字體名稱）和 description（推薦理由）
3. 推薦理由要針對使用者的具體情境說明為什麼適合

範例：
- 使用者：「我要設計武俠小說封面」
- 你應該：呼叫 show_font_card({ name: "華康金剛黑", description: "筆畫粗獷有力，展現武俠世界的豪邁氣勢" })

華康字體參考：華康金剛黑、華康威風體、華康儷宋體、華康少女文字、華康手札體`,

      // 允許 AI 執行多步驟（呼叫工具後繼續生成文字說明）
      // AI SDK 6：使用 stopWhen 取代舊版 maxSteps
      stopWhen: stepCountIs(5),

      // 定義可用的工具
      tools: {
        show_font_card: tool({
          description:
            "推薦一款華康字體給使用者。必須提供字體名稱（name）和詳細的推薦理由（description）。",
          // AI SDK 6：使用 inputSchema（不是舊版的 parameters）
          inputSchema: fontCardSchema,
          // 執行工具並返回結果（必須提供，否則會出現 "Tool result is missing" 錯誤）
          execute: async ({ name, description }) => {
            // 驗證參數
            if (!name || !description) {
              console.warn("[Chat API] ⚠️ 工具參數不完整:", {
                name,
                description,
              });
              return {
                name: name || "未指定字體",
                description: description || "AI 未提供推薦理由",
              };
            }

            console.log(`[Chat API] 🎨 推薦字體: ${name}`);
            // 返回工具執行結果給前端顯示
            return { name, description };
          },
        }),
      },
    });

    // 4. 回傳串流回應給前端（UIMessage 格式）
    return result.toUIMessageStreamResponse();
  } catch (error) {
    // 錯誤處理：記錄錯誤並回傳適當的 HTTP 狀態碼
    console.error("[Chat API] ❌ 錯誤:", error);

    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : "處理聊天請求失敗",
    });
  }
});
