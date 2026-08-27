<template>
  <div class="bangumi page">
    <header class="page__header">
      <h1 class="page__title">番剧</h1>
    </header>

    <!-- 状态筛选（Varlet tabs） -->
    <div v-if="items.length" class="bangumi__tabs">
      <var-tabs
        v-model:active="activeFilter"
        elevation
        color="transparent"
        active-color="var(--md-sys-color-primary)"
        inactive-color="var(--md-sys-color-on-surface-variant)"
        indicator-color="var(--md-sys-color-primary)"
        item-direction="vertical"
        @change="onTabChange"
      >
        <var-tab
          v-for="f in filters"
          :key="f.value"
          :name="f.value"
          :class="{ 'bangumi__tab--active': activeFilter === f.value }"
        >
          {{ f.label }}
          <span class="bangumi__tab-count">{{ f.count }}</span>
        </var-tab>
      </var-tabs>
    </div>

    <!-- 加载骨架屏（复用卡片网格布局，避免加载完成前后跳动） -->
    <template v-if="loading">
      <div class="bangumi__sk-tabs" aria-hidden="true"></div>
      <section class="bangumi__grid" aria-busy="true" aria-label="番剧数据加载中">
        <div v-for="n in 12" :key="n" class="bangumi__card-skeleton">
          <div class="bangumi__sk-img"></div>
          <div class="bangumi__sk-info">
            <div class="bangumi__sk-line"></div>
            <div class="bangumi__sk-line bangumi__sk-line--meta"></div>
          </div>
        </div>
      </section>
    </template>

    <!-- 错误 -->
    <div v-else-if="error" class="bangumi__state">
      番剧数据加载失败：{{ error }}
    </div>

    <!-- 卡片网格 -->
    <section v-else class="bangumi__grid" aria-label="番剧收藏">
      <a
        v-for="item in filteredItems"
        :key="item.subject_id"
        class="bangumi__card"
        :href="`https://bgm.tv/subject/${item.subject_id}`"
        target="_blank"
        rel="noopener"
      >
        <div class="bangumi__card-img">
          <img
            :src="item.subject.images?.common || ''"
            :alt="item.subject.name_cn || item.subject.name"
            loading="lazy"
          />
          <span class="bangumi__card-score" v-if="item.subject.score > 0">
            {{ item.subject.score }}
          </span>
        </div>
        <div class="bangumi__card-info">
          <div class="bangumi__card-title" :title="item.subject.name_cn || item.subject.name">
            {{ item.subject.name_cn || item.subject.name }}
          </div>
          <div class="bangumi__card-meta">{{ statusLabel(item.type) }}</div>
        </div>
      </a>
    </section>

    <!-- 空 -->
    <div v-if="!loading && !error && items.length === 0" class="bangumi__state">
      暂无番剧数据
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { setHead } from "@lib/head";

setHead({ title: "番剧 · Flygeonの小站", description: "Bangumi 收藏" });

const BANGUMI_USERNAME = "1250652";
const API_BASE = "https://api.bgm.tv/v0";

interface BangumiItem {
  subject_id: number;
  type: number; // 1 wish 2 collect 3 doing 4 on_hold 5 dropped
  subject: {
    name: string;
    name_cn: string;
    score: number;
    images?: { common: string; large: string } | null;
  };
}

const STATUS_LABELS: Record<number, string> = {
  1: "想看",
  2: "看过",
  3: "在看",
  4: "搁置",
  5: "抛弃",
};

const statusMap: Record<string, number[]> = {
  all: [1, 2, 3, 4, 5],
  wish: [1],
  collect: [2],
  doing: [3],
  on_hold: [4],
  dropped: [5],
};

const items = ref<BangumiItem[]>([]);
const loading = ref(true);
const error = ref("");
const activeFilter = ref("all");

const filters = computed(() => {
  const labels: Record<string, string> = {
    all: "全部",
    wish: "想看",
    collect: "看过",
    doing: "在看",
    on_hold: "搁置",
    dropped: "抛弃",
  };
  return Object.keys(statusMap).map((value) => ({
    value,
    label: labels[value],
    count: items.value.filter((i) => statusMap[value].includes(i.type)).length,
  }));
});

const filteredItems = computed(() =>
  items.value.filter((i) =>
    statusMap[activeFilter.value]?.includes(i.type),
  ),
);

function statusLabel(type: number): string {
  return STATUS_LABELS[type] ?? "未知";
}

/** Varlet tabs change 事件（active 已是 v-model，无需额外处理） */
function onTabChange(_value: unknown) {
  /* v-model:active 已同步 */
}

async function fetchCollections(subjectType: number): Promise<BangumiItem[]> {
  const all: BangumiItem[] = [];
  let offset = 0;
  const pageSize = 100;
  while (true) {
    const url = `${API_BASE}/users/${BANGUMI_USERNAME}/collections?subject_type=${subjectType}&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Flygeon/blog (https://flygeon.top)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) break;
    const data = await res.json();
    all.push(...(data.data ?? []));
    if (all.length >= (data.total ?? 0)) break;
    offset += pageSize;
  }
  return all;
}

onMounted(async () => {
  try {
    // 番剧 2 + 动画 1（原站逻辑：subject_type 2 = 动画）
    const [anime, book] = await Promise.all([
      fetchCollections(2),
      fetchCollections(1).catch(() => []),
    ]);
    items.value = [...anime, ...book];
  } catch (e) {
    error.value = e instanceof Error ? e.message : "网络错误";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page__header {
  margin-bottom: 1.25rem;
}
.page__title {
  margin: 0;
  font-family: var(--md-font-brand);
  font-size: var(--md-sys-typescale-headline-large-size);
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}

/* 筛选 tabs（Varlet tabs 容器） */
.bangumi__tabs {
  margin-bottom: 1.25rem;
}
.bangumi__tab-count {
  font-size: 0.7rem;
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
  margin-left: 0.2rem;
}


.bangumi__state {
  text-align: center;
  padding: 3rem 0;
  color: var(--md-sys-color-on-surface-variant);
}

/* ---- 骨架屏 ---- */
.bangumi__sk-tabs,
.bangumi__sk-img,
.bangumi__sk-line {
  --sk-base: var(--md-sys-color-surface-container-high);
  background: linear-gradient(
    90deg,
    var(--sk-base) 25%,
    color-mix(in srgb, var(--md-sys-color-on-surface) 8%, var(--sk-base)) 50%,
    var(--sk-base) 75%
  );
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
}
@keyframes sk-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bangumi__sk-tabs,
  .bangumi__sk-img,
  .bangumi__sk-line {
    animation: none;
  }
}

.bangumi__sk-tabs {
  height: 3rem;
  margin-bottom: 1.25rem;
  border-radius: var(--md-sys-shape-corner-medium);
}
.bangumi__card-skeleton {
  border-radius: var(--md-sys-shape-corner-medium);
  overflow: hidden;
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
}
.bangumi__sk-img {
  aspect-ratio: 3 / 4;
}
.bangumi__sk-info {
  padding: 0.5rem 0.6rem 0.6rem;
}
.bangumi__sk-line {
  height: 0.75rem;
  border-radius: var(--md-sys-shape-corner-extra-small);
}
.bangumi__sk-line--meta {
  height: 0.6rem;
  width: 55%;
  margin-top: 0.45rem;
}

/* 卡片网格 */
.bangumi__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
  gap: 0.9rem;
}
.bangumi__card {
  display: block;
  min-width: 0;
  text-decoration: none !important;
  border-radius: var(--md-sys-shape-corner-medium);
  overflow: hidden;
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.bangumi__card:hover {
  transform: translateY(-2px);
  box-shadow: var(--md-sys-elevation-2);
}
.bangumi__card-img {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: var(--md-sys-color-surface-container-high);
}
.bangumi__card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.bangumi__card-score {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  padding: 0.1rem 0.45rem;
  border-radius: var(--md-sys-shape-corner-extra-small);
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  font-size: 0.72rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.bangumi__card-info {
  padding: 0.5rem 0.6rem 0.6rem;
}
.bangumi__card-title {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.18s ease;
}
.bangumi__card:hover .bangumi__card-title {
  color: var(--md-sys-color-primary);
}
.bangumi__card-meta {
  font-size: 0.68rem;
  color: var(--md-sys-color-on-surface-variant);
  margin-top: 0.2rem;
}
</style>
