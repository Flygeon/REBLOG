<template>
  <div class="search page">
    <header class="page__header">
      <h1 class="page__title">搜索</h1>
    </header>

    <!-- 搜索输入（MD3 outlined 风格） -->
    <div class="search__box">
      <AppIcon class="search__icon" name="search" :size="20" />
      <input
        v-model="query"
        class="search__input"
        type="search"
        placeholder="搜索文章标题、标签、正文…"
        aria-label="搜索文章"
        autofocus
        @input="onInput"
      />
      <button
        v-if="query"
        class="search__clear"
        type="button"
        aria-label="清空搜索"
        @click="clear"
      >
        <AppIcon name="close" :size="16" />
      </button>
    </div>

    <!-- 结果统计 -->
    <p v-if="query" class="search__stats" aria-live="polite">
      找到 {{ results.length }} 篇文章
    </p>

    <!-- 结果列表 -->
    <PostList v-if="query" :posts="results" />

    <!-- 空状态：未输入 -->
    <div v-if="!query" class="search__hint">
      <p>输入关键词开始搜索。</p>
      <div class="search__hot">
        <span class="search__hot-label">热门标签：</span>
        <a
          v-for="tag in hotTags"
          :key="tag.name"
          class="search__hot-tag"
          :href="`/tags/${encodeURIComponent(tag.name)}/`"
          @click.prevent="query = tag.name"
        >
          #{{ tag.name }}
        </a>
      </div>
    </div>

    <!-- 空状态：无结果 -->
    <div v-if="query && results.length === 0" class="search__empty">
      <p>没有找到与「{{ query }}」相关的文章。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import AppIcon from "@components/AppIcon.vue";
import PostList from "@components/PostList.vue";
import { allPosts, getPostBody } from "@lib/posts";
import { getTagList } from "@utils/content-utils";
import { setHead } from "@lib/head";

const query = ref("");

setHead({
  title: "站内搜索 - 全站文章检索 | Flygeonの小站",
  description:
    "在 Flygeonの小站 内按关键词搜索文章，快速定位开发笔记、项目分享与生活记录等已有内容。",
});

/** 热门标签（取出现最多的 8 个） */
const hotTags = computed(() =>
  getTagList(allPosts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8),
);

/** 全文搜索：标题/描述/标签/分类/正文 */
const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return [];

  return allPosts.filter((post) => {
    const body = getPostBody(post.slug) ?? "";
    const haystack = [
      post.data.title,
      post.data.description,
      post.data.category ?? "",
      post.data.tags.join(" "),
      // 正文转纯文本后匹配（粗略）
      body.toLowerCase(),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
});

function onInput() {
  /* v-model 已处理 */
}

function clear() {
  query.value = "";
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

/* 搜索框（MD3 outlined 风格） */
.search__box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0 1rem;
  height: 3.25rem;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background: var(--md-sys-color-surface);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  margin-bottom: 1.25rem;
}
.search__box:focus-within {
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 1px var(--md-sys-color-primary);
}
.search__icon {
  flex-shrink: 0;
  color: var(--md-sys-color-on-surface-variant);
}
.search__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--md-font-plain);
  font-size: var(--md-sys-typescale-body-large-size);
  color: var(--md-sys-color-on-surface);
}
.search__input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.8;
}
.search__clear {
  flex-shrink: 0;
  width: 1.8rem;
  height: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  font-size: 0.75rem;
  transition: background 0.15s ease;
}
.search__clear:hover {
  background: var(--md-sys-color-surface-container-high);
}

.search__stats {
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-on-surface-variant);
  margin: 0 0 1rem;
}

/* 空状态 */
.search__hint,
.search__empty {
  text-align: center;
  padding: 2.5rem 0;
  color: var(--md-sys-color-on-surface-variant);
}
.search__hot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.75rem;
}
.search__hot-label {
  font-size: var(--md-sys-typescale-body-medium-size);
}
.search__hot-tag {
  font-size: var(--md-sys-typescale-label-medium-size);
  padding: 0.2rem 0.65rem;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-primary);
  text-decoration: none;
  transition: background 0.15s ease;
}
.search__hot-tag:hover {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}
</style>
