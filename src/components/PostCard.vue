<template>
  <article
    class="post-card"
    :class="{ 'post-card--pinned': pinned }"
    :style="{ '--card-delay': entranceDelay }"
  >
    <!-- 封面（如有） -->
    <RouterLink
      v-if="image"
      class="post-card__cover"
      :to="toLink(url)"
      :aria-label="title"
    >
      <img :src="resolveImage(image)" :alt="title" loading="lazy" />
      <span class="post-card__cover-overlay"></span>
      <AppIcon class="post-card__enter" name="arrow_forward" :size="26" />
    </RouterLink>

    <div class="post-card__body">
      <!-- 标题行 -->
      <div class="post-card__title-row">
        <AppIcon v-if="pinned" class="post-card__pin" name="push_pin" :size="16" title="置顶" />
        <RouterLink class="post-card__title" :to="toLink(url)">{{ title }}</RouterLink>
      </div>

      <!-- 元信息：日期 / 分类 -->
      <div class="post-card__meta">
        <span class="post-card__date">{{ formatDate(published) }}</span>
        <span v-if="category" class="post-card__sep">·</span>
        <RouterLink
          v-if="category"
          class="post-card__category"
          :to="toLink(categoryUrl)"
        >
          {{ category }}
        </RouterLink>
        <span
          v-if="updated && updated > published"
          class="post-card__updated"
        >
          更新于 {{ formatDate(updated) }}
        </span>
      </div>

      <!-- 描述 -->
      <p v-if="description" class="post-card__desc">{{ description }}</p>

      <!-- 标签 -->
      <div v-if="tags && tags.length" class="post-card__tags">
        <RouterLink
          v-for="tag in tags"
          :key="tag"
          class="post-card__tag"
          :to="toLink(tagUrl(tag))"
        >
          #{{ tag.trim() }}
        </RouterLink>
      </div>

      <!-- 底部统计 -->
      <div class="post-card__stats">
        <span>{{ wordCountLabel }}</span>
        <span class="post-card__sep">·</span>
        <span>{{ minuteLabel }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppIcon from "@components/AppIcon.vue";
import type { Post } from "@utils/content-utils";
import { getCategoryUrl, getTagUrl, toRouterLink } from "@utils/url-utils";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

const props = defineProps<{
  post: Post;
  url: string;
  /** 列表中的序号，用于入场 stagger 动画延迟 */
  index?: number;
}>();

const { post, url } = props;
// 站内跳转统一走 RouterLink（SPA 过渡），to 去尾斜杠
const toLink = toRouterLink;
const title = post.data.title;
// 入场延迟：每张顺延 40ms，封顶 360ms
const entranceDelay = `${Math.min((props.index ?? 0) * 40, 360)}ms`;
const published = post.data.published;
const updated = post.data.updated;
const tags = post.data.tags ?? [];
const category = post.data.category ?? null;
const image = post.data.image ?? "";
const description = post.data.description ?? "";
const pinned = post.data.pinned === true;

const words = post.stats?.words ?? 0;
const minutes = post.stats?.minutes ?? 0;

const wordCountLabel = computed(() =>
  `${words} ${i18n(words === 1 ? I18nKey.wordCount : I18nKey.wordsCount)}`,
);
const minuteLabel = computed(() =>
  `${minutes} ${i18n(minutes === 1 ? I18nKey.minuteCount : I18nKey.minutesCount)}`,
);
const categoryUrl = computed(() => getCategoryUrl(category));

function tagUrl(tag: string): string {
  return getTagUrl(tag);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 封面图解析：相对 /src/assets 或相对文章目录 → 生产 URL */
function resolveImage(src: string): string {
  if (!src) return "";
  if (src.startsWith("/")) return src;
  if (src.startsWith("assets/")) return `/${src}`;
  return src;
}
</script>

<style scoped>
.post-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 1.25rem 1.3rem;
  /* 入场 stagger：backwards 填充延迟期保持隐藏，结束后释放 transform 给 hover 用 */
  animation: post-card-in 0.45s ease backwards;
  animation-delay: var(--card-delay, 0ms);
  transition: box-shadow 0.25s ease, transform 0.25s ease,
    border-color 0.25s ease, background 0.25s ease;
}
@keyframes post-card-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .post-card {
    animation: none;
  }
}
.post-card:hover {
  background: var(--md-sys-color-surface-container);
  border-color: var(--md-sys-color-outline);
  box-shadow: var(--md-sys-elevation-2);
  transform: translateY(-1px);
}
.post-card--pinned {
  border-left: 3px solid var(--md-sys-color-primary);
}

/* 封面 */
.post-card__cover {
  position: relative;
  display: block;
  border-radius: var(--md-sys-shape-corner-small);
  overflow: hidden;
  aspect-ratio: 16 / 9;
  text-decoration: none !important;
}
.post-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.post-card__cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 45%,
    oklch(12% 0.02 var(--md-ref-hue) / 0.5)
  );
  opacity: 0.7;
  transition: opacity 0.25s ease;
}
.post-card:hover .post-card__cover-overlay {
  opacity: 1;
}
.post-card__enter {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%) translateX(-6px);
  color: #fff;
  opacity: 0;
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.post-card:hover .post-card__enter {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

/* 标题行 */
.post-card__title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.post-card__pin {
  flex-shrink: 0;
  color: var(--md-sys-color-primary);
}
.post-card__title {
  font-family: var(--md-font-brand);
  font-size: var(--md-sys-typescale-title-large-size);
  font-weight: 600;
  line-height: 1.4;
  color: var(--md-sys-color-on-surface);
  text-decoration: none !important;
  transition: color 0.2s ease;
}
.post-card__title:hover {
  color: var(--md-sys-color-primary);
}

/* 元信息 */
.post-card__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-on-surface-variant);
}
.post-card__category {
  color: var(--md-sys-color-primary);
  text-decoration: none !important;
  font-weight: 500;
}
.post-card__category:hover {
  text-decoration: underline !important;
}
.post-card__updated {
  font-size: 0.75rem;
  opacity: 0.75;
  background: var(--md-sys-color-surface-container);
  padding: 0.05rem 0.5rem;
  border-radius: var(--md-sys-shape-corner-full);
}
.post-card__sep {
  opacity: 0.6;
}

/* 描述 */
.post-card__desc {
  margin: 0;
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: 1.7;
  color: var(--md-sys-color-on-surface-variant);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 标签 */
.post-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.post-card__tag {
  font-size: var(--md-sys-typescale-label-medium-size);
  padding: 0.2rem 0.65rem;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-primary);
  text-decoration: none !important;
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: background 0.18s ease, border-color 0.18s ease;
}
.post-card__tag:hover {
  background: var(--md-sys-color-primary-container);
  border-color: transparent;
  color: var(--md-sys-color-on-primary-container);
}

/* 底部统计 */
.post-card__stats {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.85;
}
</style>
