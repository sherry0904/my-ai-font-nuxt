<script setup>
import { Chat } from "@ai-sdk/vue";
import { ref, computed, watch, onMounted } from "vue";

// 輸入框內容
const input = ref("");

// 當前使用的模型資訊
const modelInfo = ref("");
onMounted(async () => {
  try {
    const data = await $fetch("/api/model-info");
    modelInfo.value = data.model;
  } catch (e) {
    modelInfo.value = "unknown";
  }
});

// 初始化 Chat 實例，添加錯誤處理
const chat = new Chat({
  onError: (error) => {
    console.error("[前端] ❌ Chat 錯誤:", error);
  },
});

// 計算屬性：判斷是否正在載入中
const isLoading = computed(() => chat.status === "streaming");

// 計算屬性：判斷是否有錯誤
const hasError = computed(() => chat.error !== undefined);

// 監聽狀態變化（只記錄開始和結束狀態，避免 Console 被洗版）
watch(
  () => chat.status,
  (newStatus) => {
    if (newStatus === "streaming") {
      console.log("[前端] 🚀 AI 開始回應...");
    } else if (newStatus === "ready" && chat.messages.length > 0) {
      console.log("[前端] ✅ AI 回應完成");
      // 印出最後一則 AI 訊息的 parts 結構，方便 debug
      const lastMsg = chat.messages[chat.messages.length - 1];
      if (lastMsg.role === "assistant") {
        console.log(
          "[前端] 📦 AI 訊息 parts:",
          JSON.stringify(
            lastMsg.parts.map((p) => ({
              type: p.type,
              hasResult: "result" in p ? !!p.result : undefined,
              hasText: "text" in p ? !!p.text : undefined,
            })),
          ),
        );
      }
    }
  },
);

/**
 * 處理表單提交
 * 發送訊息給 AI 並清空輸入框
 */
const handleSubmit = (e) => {
  e.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  console.log("[前端] 📤 發送:", message);

  // 發送訊息給後端 API
  chat.sendMessage({ text: message });

  // 清空輸入框
  input.value = "";
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-6">
    <div class="max-w-2xl mx-auto">
      <header class="text-center mb-10">
        <h1 class="text-3xl font-black text-slate-900">
          DynaComware <span class="text-blue-600">AI</span>
        </h1>
        <p class="text-slate-500">2026 字體設計智能助手</p>
        <p v-if="modelInfo" class="text-xs text-slate-400 mt-1 font-mono">
          Model: {{ modelInfo }}
        </p>
      </header>

      <!-- 對話記錄區域 -->
      <div class="space-y-6 mb-32">
        <!-- 錯誤提示 -->
        <div
          v-if="hasError"
          class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl"
        >
          ⚠️ 發生錯誤：{{ chat.error?.message || "未知錯誤" }}
        </div>

        <!-- 訊息列表 -->
        <div v-for="(m, index) in chat.messages" :key="m.id || index">
          <!-- 使用者訊息（靠右顯示） -->
          <div v-if="m.role === 'user'" class="flex justify-end">
            <div
              class="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-none shadow-md"
            >
              <span v-for="(part, pIndex) in m.parts" :key="pIndex">
                <span v-if="part.type === 'text'">{{ part.text }}</span>
              </span>
            </div>
          </div>

          <!-- AI 回應（靠左顯示，支援多種 part 類型） -->
          <div v-else class="space-y-4">
            <div v-for="(part, pIndex) in m.parts" :key="pIndex">
              <!-- 文字回應 -->
              <div
                v-if="part.type === 'text' && part.text"
                class="bg-white border p-4 rounded-2xl shadow-sm text-slate-700"
              >
                {{ part.text }}
              </div>

              <!-- 工具呼叫結果：字體推薦卡片 -->
              <!-- AI SDK 6：使用 part.state + part.output（非舊版 part.result） -->
              <div
                v-if="
                  part.type === 'tool-show_font_card' &&
                  part.state === 'output-available'
                "
              >
                <FontCard
                  :name="part.output.name"
                  :description="part.output.description"
                />
              </div>

              <!-- 工具正在載入中（input-available 表示已收到參數，等待執行結果） -->
              <div
                v-if="
                  part.type === 'tool-show_font_card' &&
                  (part.state === 'input-available' ||
                    part.state === 'input-streaming')
                "
                class="bg-gray-50 border p-4 rounded-2xl text-gray-400 italic"
              >
                正在為您挑選字體...
              </div>

              <!-- 忽略內部步驟標記：step-start, step-finish 等 -->
              <!-- 這些是 AI SDK 的內部狀態，不需要顯示給用戶 -->
            </div>

            <!-- 如果沒有可顯示的內容，顯示提示 -->
            <div
              v-if="
                !m.parts ||
                m.parts.length === 0 ||
                !m.parts.some(
                  (p) =>
                    (p.type === 'text' && p.text) ||
                    (p.type === 'tool-show_font_card' &&
                      (p.state === 'output-available' ||
                        p.state === 'input-available' ||
                        p.state === 'input-streaming')),
                )
              "
              class="bg-gray-50 border p-4 rounded-2xl text-gray-400 italic"
            >
              （AI 正在思考中...）
            </div>
          </div>
        </div>

        <!-- Loading 指示器 -->
        <div v-if="isLoading" class="flex items-center gap-2 text-slate-500">
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div
            class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style="animation-delay: 0.1s"
          ></div>
          <div
            class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style="animation-delay: 0.2s"
          ></div>
          <span class="ml-2">AI 正在思考...</span>
        </div>
      </div>

      <!-- 輸入框（固定在底部） -->
      <form
        @submit="handleSubmit"
        class="fixed bottom-8 inset-x-0 px-6 max-w-2xl mx-auto"
      >
        <div class="relative">
          <input
            v-model="input"
            :disabled="isLoading"
            class="w-full p-5 pr-16 rounded-3xl border-0 shadow-2xl focus:ring-2 focus:ring-blue-500 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="請輸入設計需求... (例如：甜點店招牌)"
          />
          <button
            type="submit"
            :disabled="isLoading || !input.trim()"
            class="absolute right-3 top-3 bg-slate-900 text-white p-3 rounded-2xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? "⏳" : "🚀" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
