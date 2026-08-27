<template>
  <section class="placeholder">
    <h1>{{ pageTitle }}</h1>
    <p>该页面为 P1 骨架占位，后续 Phase 实现真实功能。</p>
    <p class="meta">route name: {{ route.name }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const routeNameMap: Record<string, string> = {
  post: "文章详情",
  archive: "归档",
  friends: "友链",
  about: "关于",
  bangumi: "番剧",
  memos: "说说",
  music: "音乐",
  tag: "标签",
  category: "分类",
  search: "搜索",
  "not-found": "页面未找到",
};
const pageTitle = computed(
  () => routeNameMap[String(route.name)] ?? String(route.name ?? "未知页面"),
);
</script>

<style scoped>
.placeholder {
  padding: 2rem 0;
  line-height: 1.8;
}
.meta {
  color: var(--c-text-2, #6b7280);
  font-size: 0.85rem;
}
</style>
