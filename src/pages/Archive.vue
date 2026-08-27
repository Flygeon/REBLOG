<template>
  <div class="archive page">
    <header class="page__header">
      <h1 class="page__title">归档</h1>
      <span v-if="filterInfo" class="page__filter">{{ filterInfo }}</span>
    </header>

    <!-- 过滤提示：有过滤时显示清空按钮 -->
    <div v-if="hasFilter" class="archive__filterbar">
      <span class="archive__filtertext">
        {{ filterLabel }}
      </span>
      <a class="archive__clear" href="/archive/">清除过滤</a>
    </div>

    <!-- 时间线分组 -->
    <section v-if="groups.length" class="archive__timeline" aria-label="文章归档">
      <div v-for="group in groups" :key="group.year" class="archive__group">
        <div class="archive__year">{{ group.year }}</div>
        <div class="archive__items">
          <a
            v-for="post in group.posts"
            :key="post.slug"
            class="archive__item"
            :href="`/posts/${post.slug}/`"
          >
            <span class="archive__item-date">{{ formatDate(post.data.published) }}</span>
            <span class="archive__item-title">{{ post.data.title }}</span>
          </a>
        </div>
      </div>
    </section>

    <div v-else class="archive__empty">
      <p>没有符合条件的文章。</p>
      <a href="/archive/">返回全部归档</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { allPosts } from "@lib/posts";
import { setHead } from "@lib/head";

const route = useRoute();

interface Group {
  year: number;
  posts: typeof allPosts;
}

function formatDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}-${day}`;
}

// 查询参数过滤（对齐原 ArchivePanel：tag / category / uncategorized）
const query = computed(() => route.query);
const hasFilter = computed(
  () =>
    (query.value.tag && query.value.tag.length) ||
    (query.value.category && query.value.category.length) ||
    query.value.uncategorized,
);

const filterLabel = computed(() => {
  const q = query.value;
  const parts: string[] = [];
  if (q.tag) parts.push(`标签 #${q.tag}`);
  if (q.category) parts.push(`分类 ${q.category}`);
  if (q.uncategorized) parts.push("未分类");
  return parts.join(" · ");
});

const filterInfo = computed(() =>
  hasFilter.value ? `（${filterLabel.value}）` : "",
);

const groups = computed<Group[]>(() => {
  let filtered = allPosts;
  const q = query.value;

  if (q.tag) {
    const tags = Array.isArray(q.tag) ? q.tag : [q.tag];
    filtered = filtered.filter((post) =>
      post.data.tags.some((t) => tags.includes(t)),
    );
  }
  if (q.category) {
    const cats = Array.isArray(q.category) ? q.category : [q.category];
    filtered = filtered.filter(
      (post) => post.data.category && cats.includes(post.data.category),
    );
  }
  if (q.uncategorized) {
    filtered = filtered.filter((post) => !post.data.category);
  }

  const byYear: Record<number, typeof allPosts> = {};
  for (const post of filtered) {
    const year = post.data.published.getFullYear();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(post);
  }
  return Object.keys(byYear)
    .map((y) => ({ year: Number(y), posts: byYear[Number(y)] }))
    .sort((a, b) => b.year - a.year);
});

setHead({ title: "归档 · Flygeonの小站", description: "全部文章归档" });
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
.page__filter {
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-primary);
}

.archive__filterbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding: 0.6rem 1rem;
  background: var(--md-sys-color-secondary-container);
  border-radius: var(--md-sys-shape-corner-small);
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-on-secondary-container);
}
.archive__clear {
  color: var(--md-sys-color-primary);
  font-weight: 600;
  text-decoration: none;
}
.archive__clear:hover {
  text-decoration: underline;
}

/* 时间线 */
.archive__timeline {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}
.archive__group {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 1rem;
}
.archive__year {
  font-family: var(--md-font-brand);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--md-sys-color-primary);
  line-height: 1.3;
  text-align: right;
  font-variant-numeric: tabular-nums;
  position: sticky;
  top: calc(var(--md-layout-header-h) + 1rem);
  align-self: start;
}
.archive__items {
  position: relative;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
}
/* 时间线竖线 */
.archive__items::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.4rem;
  bottom: 0.4rem;
  width: 2px;
  background: var(--md-sys-color-outline-variant);
  border-radius: 2px;
}
.archive__item {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.4rem 0;
  text-decoration: none !important;
  min-width: 0;
}
/* 时间线节点圆点 */
.archive__item::before {
  content: "";
  position: absolute;
  left: -1.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--md-sys-color-surface);
  border: 2px solid var(--md-sys-color-primary);
  transition: background 0.2s ease;
}
.archive__item:hover::before {
  background: var(--md-sys-color-primary);
}
.archive__item-date {
  flex-shrink: 0;
  font-size: var(--md-sys-typescale-label-medium-size);
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
  min-width: 2.6rem;
}
.archive__item-title {
  font-size: var(--md-sys-typescale-body-large-size);
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.18s ease;
}
.archive__item:hover .archive__item-title {
  color: var(--md-sys-color-primary);
}

.archive__empty {
  text-align: center;
  padding: 3rem 0;
  color: var(--md-sys-color-on-surface-variant);
}
.archive__empty a {
  color: var(--md-sys-color-primary);
}

@media (max-width: 560px) {
  .archive__group {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  .archive__year {
    text-align: left;
    position: static;
    font-size: 1.3rem;
  }
}
</style>
