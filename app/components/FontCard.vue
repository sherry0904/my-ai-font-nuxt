<template>
  <article class="font-card">
    <div class="font-card-head">
      <span class="badge">華康推薦</span>
      <span class="meta-id">Preview</span>
    </div>

    <h2 class="font-title">{{ name }}</h2>

    <p class="preview-text">風格示意：以此字體呈現主標題，能快速建立品牌辨識。</p>

    <p class="description">
      {{ description }}
    </p>

    <div class="actions">
      <button class="primary-action">
        <DownloadIcon :size="17" /> 查看字體樣張
      </button>
    </div>
  </article>
</template>

<script setup>
import { DownloadIcon } from "lucide-vue-next";
defineProps(["name", "description"]);
</script>

<style scoped>
.font-card {
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 16px;
  background:
    linear-gradient(162deg, rgba(255, 255, 255, 0.94) 0%, rgba(248, 250, 252, 0.9) 100%);
  padding: 14px;
  box-shadow: 0 24px 50px -40px rgba(15, 23, 42, 0.45);
  transition: transform 0.18s ease-out, border-color 0.18s ease-out, box-shadow 0.18s ease-out;
}

.font-card:hover {
  transform: translateY(-2px);
  border-color: rgba(15, 118, 110, 0.42);
  box-shadow: 0 26px 58px -42px rgba(15, 23, 42, 0.5);
}

.font-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
  padding: 4px 10px;
  color: #0f766e;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.meta-id {
  color: #64748b;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.font-title {
  margin-top: 10px;
  margin-bottom: 10px;
  color: #0f172a;
  font-size: clamp(1.5rem, 4.6vw, 2rem);
  line-height: 1.2;
  font-family: "Noto Serif TC", "Songti TC", serif;
}

.preview-text {
  border-left: 2px solid rgba(15, 118, 110, 0.4);
  margin-bottom: 10px;
  padding-left: 10px;
  color: #334155;
  font-size: 0.8rem;
  line-height: 1.6;
}

.description {
  margin-bottom: 12px;
  color: #475569;
  font-size: 0.88rem;
  line-height: 1.6;
}

.actions {
  display: flex;
}

.primary-action {
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  background: #0f172a;
  padding: 8px 10px;
  color: #f8fafc;
  font-size: 0.8rem;
  font-weight: 700;
  transition: background-color 0.15s ease-out;
}

.primary-action:hover {
  background: #0f766e;
}
</style>
