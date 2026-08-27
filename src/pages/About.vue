<template>
  <div class="about page">
    <header class="page__header">
      <h1 class="page__title">关于</h1>
    </header>
    <article class="page__content markdown-body" v-html="html"></article>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { getSpec } from "@lib/posts";
import { renderMarkdown } from "@lib/markdown";
import { setHead } from "@lib/head";

const html = ref("");

const spec = getSpec("about");

setHead({
  title: "关于 - Flygeon 与这个小站的故事 | Flygeonの小站",
  description:
    spec?.description ||
    "了解 Flygeon 和这个小站：站长的介绍、博客的技术构成（Vue 3 + Vite 自建 SSG）以及联系方式。",
});

if (spec) {
  html.value = await renderMarkdown(spec.body);
}
</script>

<style scoped>
.page__header {
  margin-bottom: 1.5rem;
}
.page__title {
  margin: 0;
  font-family: var(--md-font-brand);
  font-size: var(--md-sys-typescale-headline-large-size);
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}
.page__content {
  /* markdown 排版全局生效 */
}
</style>
