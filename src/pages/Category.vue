<template>
  <div class="category page">
    <header class="page__header">
      <h1 class="page__title">分类</h1>
      <span class="page__meta">{{ decodedCategory }}</span>
    </header>
    <PostList :posts="categorizedPosts" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import PostList from "@components/PostList.vue";
import { allPosts } from "@lib/posts";
import { setHead } from "@lib/head";

const route = useRoute();

// 注意：路由参数可能是 URL 编码的（中文分类名），需解码
const decodedCategory = computed(() => {
  const raw = String(route.params.category ?? "");
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
});

// 分类过滤：空/undefined 分类在 getCategoryList 里被归为"未分类"
const categorizedPosts = computed(() =>
  allPosts.filter(
    (post) => (post.data.category ?? null) === decodedCategory.value,
  ),
);

setHead({
  title: `分类「${decodedCategory.value}」下的全部文章 | Flygeonの小站`,
  description: `浏览 Flygeonの小站 中分类为「${decodedCategory.value}」的文章，共 ${taggedPosts.value.length} 篇，按分类快速查找同主题内容。`,
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
