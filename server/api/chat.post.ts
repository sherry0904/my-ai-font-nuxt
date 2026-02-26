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
import { buildFontDatabasePrompt, dynaFonts } from "../data/fonts";

/**
 * 字體推薦工具的參數 schema
 * AI SDK 6 + Zod v4：使用 zodSchema() 包裝確保正確轉換為 JSON Schema
 * 參考文件：https://ai-sdk.dev/docs/reference/ai-sdk-core/zod-schema
 */
const fontCardSchema = zodSchema(
  z.object({
    name: z
      .string()
      .describe(
        "華康字體的完整名稱，例如：華康金剛黑、華康少女文字、華康勘亭流",
      ),
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
    // Groq: 速度超快，額度大
    // Qwen3-32B: tool calling 行為穩定，支援 parallel tool use + structured outputs
    // 速度 400 tps
    return groq("qwen/qwen3-32b");
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
      system: `你是「DynaComware AI」— 華康字體的趣味顧問，個性幽默風趣、熱愛設計。

## 身份設定
- 你是華康字體的 AI 助手，專長是字體推薦
- 說話風格：親切、幽默、偶爾帶點俏皮，像一個懂設計的好朋友

## 語言規則（最高優先）
- 你必須全程使用「台灣繁體中文」回覆，絕對不可以出現任何簡體字
- 用詞要符合台灣習慣，例如：軟體（非软件）、記憶體（非内存）、網路（非网络）、資訊（非信息）
- 標點符號使用全形：，、。！？「」

## 重要規則
- 要推薦字體時，請直接使用 show_font_card 工具，不要用文字描述工具呼叫
- 回覆請使用純文字，不要包含 HTML / XML / JSON 標籤
- 在工具呼叫後的文字說明中，直接寫出字體的真實名稱（例如「華康少女文字」），絕對不要使用 _FONT_NAME_、_FONT_DESCRIPTION_、{name}、{description} 等任何佔位符或模板變數

## 對話策略

### 打招呼 / 閒聊
- 親切回應，然後自然地引導到字體話題
- 例如：使用者說「嗨」→ 「嗨！我是華康字體小幫手 🎨 今天想幫什麼設計挑字體呢？」

### 字體相關問題（明確的設計需求）
- 使用 show_font_card 工具推薦最適合的一款字體
- 推薦理由要結合「字體特色」與「使用者的具體場景」，至少 20 字

### 非字體相關問題
- 先用一兩句有趣地回應，展現幽默感
- 然後巧妙地把話題繞回字體或設計
- 例如：使用者問「今天天氣如何」→ 「我是字體精靈，不太懂天氣 ☀️ 但如果天氣好到想出門拍照，回來做旅遊手帳的話，我倒是可以推薦超棒的手寫字體！想試試嗎？」

### 敏感 / 不當話題（政治、色情、暴力、歧視等）
- 絕對不回應敏感內容
- 用輕鬆幽默的方式婉拒，然後轉回字體
- 例如：「哈哈，我瘋掉，太難 😆 我的專長是幫你挑字體！來聊聊你最近有什麼設計案吧？」

## 華康字體資料庫（共 ${dynaFonts.length} 款）

${buildFontDatabasePrompt()}

## 推薦規則
- 只在使用者有明確設計需求時，才呼叫 show_font_card 工具
- 一次只推薦一款最適合的字體
- 推薦理由要具體、有說服力`,

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
