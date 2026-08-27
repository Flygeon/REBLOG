<template>
  <div class="memos page">
    <header class="page__header">
      <h1 class="page__title">动态</h1>
      <a
        class="page__ext"
        href="https://memos.flygeon.top"
        target="_blank"
        rel="noopener"
        >前往 Memos <AppIcon class="page__ext-icon" name="open_in_new" :size="14" /></a
      >
    </header>

    <!-- 加载中 -->
    <div v-if="loading" class="memos__state">动态加载中…</div>

    <!-- 加载失败 -->
    <div v-else-if="error" class="memos__state">
      动态加载失败：{{ error }}
      <p class="memos__hint">可通过 Memos 公开站查看：memos.flygeon.top</p>
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
          <div class="memo-card__meta">
            <a
              :href="`https://memos.flygeon.top/m/${memo.id}`"
              target="_blank"
              rel="noopener"
            >
              {{ formatTime(memo.createdTs) }}
            </a>
          </div>
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
import { setHead } from "@lib/head";

setHead({ title: "动态 · Flygeonの小站", description: "Memos 动态" });

const avatarSrc = "/assets/images/avatar.png";

interface Memo {
  id: number;
  content: string;
  createdTs: number;
  state: string;
}

const memos = ref<Memo[]>([]);
const loading = ref(true);
const error = ref("");

/** 渲染 memos 内容：把换行转 <br>，简单转义 */
function renderMemo(content: string): string {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onMounted(async () => {
  try {
    const res = await fetch("/api/memos", {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    memos.value = Array.isArray(data.memos) ? data.memos : [];
    if (data.error) error.value = data.error;
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
}
.memo-card__meta a {
  color: inherit;
  text-decoration: none;
}
.memo-card__meta a:hover {
  color: var(--md-sys-color-primary);
}
</style>
