<template>
  <div class="tag page">
    <header class="page__header">
      <h1 class="page__title">标签</h1>
      <span class="page__meta">#{{ decodedTag }}</span>
    </header>
    <PostList :posts="taggedPosts" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import PostList from "@components/PostList.vue";
import { allPosts } from "@lib/posts";
import { setHead } from "@lib/head";

const route = useRoute();

// 注意：路由参数可能是 URL 编码的（中文/空格 tag），需解码
// try/catch：防止参数本身含非法编码时 decodeURIComponent 抛错
const decodedTag = computed(() => {
  const raw = String(route.params.tag ?? "");
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
});

const taggedPosts = computed(() =>
  allPosts.filter((post) => post.data.tags.includes(decodedTag.value)),
);

setHead({
  title: `#${decodedTag.value} · Flygeonの小站`,
  description: `标签 ${decodedTag.value} 下的文章`,
});
</script>

<style scoped>
.page__header {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.page__title {
  margin: 0;
  font-family: var(--md-font-brand);
  font-size: var(--md-sys-typescale-headline-large-size);
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}
.page__meta {
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-primary);
  font-weight: 600;
}
</style>
