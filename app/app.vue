<script setup>
import { Chat } from "@ai-sdk/vue";
import { ref, computed, watch, onMounted } from "vue";

const input = ref("");

const modelInfo = ref("");
onMounted(async () => {
  try {
    const data = await $fetch("/api/model-info");
    modelInfo.value = data.model;
  } catch (e) {
    modelInfo.value = "unknown";
  }
});

const chat = new Chat({
  onError: (error) => {
    console.error("[前端] ❌ Chat 錯誤:", error);
  },
});

const isLoading = computed(() => chat.status === "streaming");
const hasError = computed(() => chat.error !== undefined);

const quickPrompts = [
  "甜點店招牌設計",
  "活動海報標題字",
  "品牌 LOGO 字體建議",
  "咖啡店菜單字體",
];

watch(
  () => chat.status,
  (newStatus) => {
    if (newStatus === "streaming") {
      console.log("[前端] 🚀 AI 開始回應...");
    } else if (newStatus === "ready" && chat.messages.length > 0) {
      console.log("[前端] ✅ AI 回應完成");
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

const handleSubmit = (e) => {
  e.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  console.log("[前端] 📤 發送:", message);
  chat.sendMessage({ text: message });
  input.value = "";
};

const sendQuickPrompt = (prompt) => {
  if (isLoading.value) return;
  chat.sendMessage({ text: prompt });
};
</script>

<template>
  <div class="relative min-h-screen text-slate-900">
    <div class="bg-layer"></div>
    <div class="orb orb-top"></div>
    <div class="orb orb-bottom"></div>

    <main class="relative mx-auto w-full max-w-3xl px-5 pt-5 md:px-8 md:pt-7">
      <header class="mb-5 md:mb-6">
        <p class="text-[11px] uppercase tracking-[0.26em] text-slate-500">DynaComware AI</p>
        <h1 class="mt-1.5 text-[1.65rem] font-semibold leading-tight text-slate-900 md:text-3xl">
          華康字體智慧顧問
        </h1>
        <p class="mt-1.5 text-sm text-slate-600">簡單、俐落、直接幫你找到適合的字體方向。</p>
        <p v-if="modelInfo" class="mt-2 inline-flex rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] text-slate-500 backdrop-blur">
          Model: {{ modelInfo }}
        </p>
      </header>

      <section class="pb-44 md:pb-48">
        <div
          v-if="hasError"
          class="mb-5 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 shadow-sm"
        >
          ⚠️ 發生錯誤：{{ chat.error?.message || "未知錯誤" }}
        </div>

        <TransitionGroup name="msg" tag="div" class="space-y-4">
          <article
            v-for="(m, index) in chat.messages"
            :key="m.id || index"
            class="w-full"
          >
            <div v-if="m.role === 'user'" class="flex justify-end">
              <div class="user-bubble">
                <span v-for="(part, pIndex) in m.parts" :key="pIndex">
                  <span v-if="part.type === 'text'">{{ part.text }}</span>
                </span>
              </div>
            </div>

            <div v-else class="space-y-2.5">
              <div v-for="(part, pIndex) in m.parts" :key="pIndex">
                <div v-if="part.type === 'text' && part.text" class="assistant-bubble">
                  {{ part.text }}
                </div>

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

                <div
                  v-if="
                    part.type === 'tool-show_font_card' &&
                    (part.state === 'input-available' ||
                      part.state === 'input-streaming')
                  "
                  class="tool-pending"
                >
                  正在為您挑選字體...
                </div>
              </div>

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
                class="tool-pending"
              >
                （AI 正在思考中...）
              </div>
            </div>
          </article>
        </TransitionGroup>

        <div v-if="isLoading" class="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs text-slate-600 backdrop-blur">
          <span class="loader-dot"></span>
          <span class="loader-dot" style="animation-delay: 0.12s"></span>
          <span class="loader-dot" style="animation-delay: 0.24s"></span>
          AI 正在思考...
        </div>
      </section>
    </main>

    <form
      class="composer-shell"
      @submit="handleSubmit"
    >
      <div class="mb-2 flex flex-wrap gap-1.5">
        <button
          v-for="prompt in quickPrompts"
          :key="prompt"
          type="button"
          :disabled="isLoading"
          class="quick-chip"
          @click="sendQuickPrompt(prompt)"
        >
          {{ prompt }}
        </button>
      </div>

      <div class="composer-panel">
        <input
          v-model="input"
          :disabled="isLoading"
          class="composer-input"
          placeholder="請輸入設計需求...（例如：甜點店招牌）"
        />
        <button
          type="submit"
          :disabled="isLoading || !input.trim()"
          class="composer-submit"
        >
          {{ isLoading ? "等待中" : "送出" }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
  background: #eef2f7;
}

.bg-layer {
  position: fixed;
  inset: 0;
  z-index: -3;
  background:
    radial-gradient(circle at 20% 10%, rgba(15, 118, 110, 0.1), transparent 36%),
    radial-gradient(circle at 78% 18%, rgba(56, 92, 255, 0.08), transparent 34%),
    linear-gradient(160deg, #f8fafc 0%, #eef2f7 55%, #e5ebf2 100%);
}

.orb {
  position: fixed;
  z-index: -2;
  border-radius: 999px;
  filter: blur(52px);
  opacity: 0.35;
}

.orb-top {
  top: -84px;
  right: -44px;
  height: 240px;
  width: 240px;
  background: rgba(15, 118, 110, 0.28);
}

.orb-bottom {
  bottom: 30px;
  left: -92px;
  height: 280px;
  width: 280px;
  background: rgba(59, 130, 246, 0.2);
}

.user-bubble {
  max-width: min(620px, 86vw);
  border-radius: 20px 20px 6px 20px;
  background: linear-gradient(140deg, #0f766e 0%, #115e59 100%);
  padding: 10px 14px;
  color: #f8fafc;
  line-height: 1.55;
  box-shadow: 0 18px 32px -22px rgba(15, 118, 110, 0.7);
}

.assistant-bubble {
  max-width: min(700px, 89vw);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 18px 18px 18px 6px;
  background: rgba(255, 255, 255, 0.84);
  padding: 12px 14px;
  color: #1f2937;
  line-height: 1.6;
  backdrop-filter: blur(8px);
  box-shadow: 0 20px 40px -35px rgba(15, 23, 42, 0.35);
}

.tool-pending {
  display: inline-block;
  border: 1px dashed rgba(100, 116, 139, 0.4);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.65);
  padding: 8px 12px;
  color: #64748b;
  font-size: 0.85rem;
  font-style: italic;
}

.loader-dot {
  height: 7px;
  width: 7px;
  border-radius: 999px;
  background: #0f766e;
  animation: pulse-rise 0.65s infinite ease-out;
}

.composer-shell {
  position: fixed;
  left: 50%;
  bottom: 12px;
  z-index: 20;
  width: calc(100% - 1.5rem);
  max-width: 48rem;
  transform: translateX(-50%);
}

.composer-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  padding: 8px;
  backdrop-filter: blur(14px);
  box-shadow: 0 24px 48px -34px rgba(15, 23, 42, 0.5);
}

.composer-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 6px 8px;
  color: #0f172a;
  font-size: 0.93rem;
}

.composer-input:focus {
  outline: none;
}

.composer-input::placeholder {
  color: #64748b;
}

.composer-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.composer-submit {
  flex-shrink: 0;
  border: none;
  border-radius: 12px;
  background: #0f172a;
  padding: 9px 12px;
  color: #f8fafc;
  font-size: 0.8rem;
  font-weight: 600;
  transition: background-color 0.16s ease-out;
}

.composer-submit:hover:not(:disabled) {
  background: #0f766e;
}

.composer-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.quick-chip {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  padding: 5px 9px;
  color: #334155;
  font-size: 0.69rem;
  transition: all 0.15s ease-out;
}

.quick-chip:hover:not(:disabled) {
  border-color: rgba(15, 118, 110, 0.5);
  color: #0f766e;
  transform: translateY(-1px);
}

.quick-chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.msg-enter-active,
.msg-leave-active {
  transition: all 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.msg-enter-from,
.msg-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes pulse-rise {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  50% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .composer-shell {
    bottom: 9px;
    width: calc(100% - 1rem);
  }

  .composer-panel {
    border-radius: 16px;
  }

  .composer-submit {
    padding: 8px 11px;
  }
}
</style>
