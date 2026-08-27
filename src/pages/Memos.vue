<template>
  <div class="memos page">
    <header class="page__header">
      <h1 class="page__title">动态</h1>
      <a
        class="page__ext"
        href="/moments/"
        target="_blank"
        rel="noopener"
        >管理动态 <AppIcon class="page__ext-icon" name="open_in_new" :size="14" /></a
      >
    </header>

    <!-- 加载中 -->
    <div v-if="loading" class="memos__state">动态加载中…</div>

    <!-- 加载失败 -->
    <div v-else-if="error" class="memos__state">
      动态加载失败：{{ error }}
      <p class="memos__hint">稍后再试，或前往管理页检查：flygeon.top/moments/</p>
    </div>

    <!-- 动态列表 -->
    <section v-else class="memos__list" aria-label="动态列表">
      <article
        v-for="memo in memos"
        :key="memo.id"
        class="memo-card"
      >
        <div class="memo-card__avatar">
          <img :src="avatarSrc" alt="头像" />
        </div>
        <div class="memo-card__body">
          <div class="memo-card__content" v-html="renderMemo(memo.content)"></div>
          <a
            v-if="memo.image"
            class="memo-card__image-link"
            :href="`/moments/media/${memo.image}`"
            target="_blank"
            rel="noopener"
          >
            <img
              class="memo-card__image"
              :src="`/moments/media/${memo.image}`"
              alt="动态图片"
              loading="lazy"
            />
          </a>
          <div class="memo-card__meta">{{ formatTime(memo.created_at) }}</div>
        </div>
      </article>
    </section>

    <!-- 空 -->
    <div v-if="!loading && !error && memos.length === 0" class="memos__state">
      暂无动态
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import AppIcon from "@components/AppIcon.vue";
import avatarSrc from "@assets/images/avatar.png";
import { setHead } from "@lib/head";

setHead({ title: "动态 · Flygeonの小站", description: "Flygeon 的动态" });

interface Moment {
  id: number;
  content: string;
  image?: string | null; // R2 key，展示地址 /moments/media/<key>
  created_at: number; // unix 秒
}

const memos = ref<Moment[]>([]);
const loading = ref(true);
const error = ref("");

/** 渲染动态内容：把换行转 <br>，简单转义 */
function renderMemo(content: string): string {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function formatTime(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onMounted(async () => {
  try {
    // 数据源：Moments Worker（同域 flygeon.top/moments/api/*）
    const res = await fetch("/moments/api/list?limit=50", {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    memos.value = Array.isArray(data.moments) ? data.moments : [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : "网络错误";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page__header {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  flex-wrap: wrap;
}
.page__title {
  margin: 0;
  font-family: var(--md-font-brand);
  font-size: var(--md-sys-typescale-headline-large-size);
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}
.page__ext {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-primary);
  text-decoration: none;
  font-weight: 500;
}
.page__ext:hover {
  text-decoration: underline;
}

.memos__state {
  text-align: center;
  padding: 3rem 0;
  color: var(--md-sys-color-on-surface-variant);
}
.memos__hint {
  font-size: var(--md-sys-typescale-body-medium-size);
  opacity: 0.8;
}

.memos__list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

/* 动态卡片 */
.memo-card {
  display: flex;
  gap: 0.9rem;
  padding: 1.1rem 1.2rem;
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
}
.memo-card__avatar {
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  overflow: hidden;
  background: var(--md-sys-color-surface-container-high);
}
.memo-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.memo-card__body {
  flex: 1;
  min-width: 0;
}
.memo-card__content {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: 1.8;
  color: var(--md-sys-color-on-surface);
  word-break: break-word;
}
.memo-card__meta {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
}
.memo-card__image-link {
  display: block;
  margin-top: 0.6rem;
  line-height: 0;
}
.memo-card__image {
  max-width: 100%;
  max-height: 360px;
  border-radius: var(--md-sys-shape-corner-small);
  border: 1px solid var(--md-sys-color-outline-variant);
}
</style>
