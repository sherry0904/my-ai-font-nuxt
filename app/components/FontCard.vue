<template>
  <div
    class="border-2 border-slate-100 rounded-2xl p-6 bg-white shadow-xl hover:border-blue-400 transition-all"
  >
    <div class="flex justify-between items-start">
      <span
        class="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded"
      >
        華康專業推薦
      </span>
      <span class="text-slate-400 text-xs">ID: #DK-2026</span>
    </div>

    <h2 class="text-4xl my-6 text-slate-800 font-serif">{{ name }}</h2>

    <p class="text-slate-600 text-sm leading-relaxed mb-6">
      {{ description }}
    </p>

    <button
      class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
    >
      <DownloadIcon :size="18" /> 索取授權樣張
    </button>
  </div>
</template>

<script setup>
import { DownloadIcon } from "lucide-vue-next";
defineProps(["name", "description"]);
</script>
