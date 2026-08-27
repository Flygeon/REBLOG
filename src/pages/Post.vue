<template>
  <div class="post">
    <template v-if="post">
      <!-- 双栏布局：主内容 + 右侧 TOC 侧边栏 -->
      <div class="post__layout">
        <!-- 主内容列 -->
        <div class="post__main">
          <!-- 文章头 -->
          <header class="post__header">
            <h1 class="post__title">{{ post.data.title }}</h1>
            <div class="post__meta">
              <span class="post__date">{{ formatDate(post.data.published) }}</span>
              <template v-if="post.data.category">
                <span class="post__sep">·</span>
                <a class="post__category" :href="getCategoryUrl(post.data.category)">
                  {{ post.data.category }}
                </a>
              </template>
              <template v-if="post.data.tags && post.data.tags.length">
                <span class="post__sep">·</span>
                <span class="post__tags">
                  <a
                    v-for="tag in post.data.tags"
                    :key="tag"
                    class="post__tag"
                    :href="getTagUrl(tag)"
                  >#{{ tag.trim() }}</a>
                </span>
              </template>
            </div>
          </header>

          <!-- 正文 -->
          <article
            class="post__content markdown-body"
            v-html="html"
          ></article>

          <!-- 上下篇 -->
          <nav v-if="post.data.prevSlug || post.data.nextSlug" class="post__pager">
            <RouterLink
              v-if="post.data.nextSlug"
              class="post__pager-link"
              :to="toLink(`/posts/${post.data.nextSlug}/`)"
            >
              <span class="post__pager-label">下一篇</span>
              <span class="post__pager-title">{{ post.data.nextTitle }}</span>
            </RouterLink>
            <RouterLink
              v-if="post.data.prevSlug"
              class="post__pager-link post__pager-link--next"
              :to="toLink(`/posts/${post.data.prevSlug}/`)"
            >
              <span class="post__pager-label">上一篇</span>
              <span class="post__pager-title">{{ post.data.prevTitle }}</span>
            </RouterLink>
          </nav>

          <!-- 文章推荐（横排卡片流：相关文章 + 随机文章） -->
          <section
            v-if="recommended.length || randomPosts.length"
            class="post__related"
            aria-label="文章推荐"
          >
            <div class="post__related-head">
              <h2 class="post__related-title">继续阅读</h2>
              <AppIcon class="post__related-title-icon" name="auto_stories" :size="20" />
            </div>

            <div class="post__related-grid">
              <!-- 相关文章卡片 -->
              <RouterLink
                v-for="p in recommended"
                :key="`rel-${p.slug}`"
                class="rec-card"
                :to="toLink(`/posts/${p.slug}/`)"
                :aria-label="`阅读文章：${p.data.title}`"
              >
                <div class="rec-card__cover">
                  <img
                    v-if="p.data.image"
                    :src="resolveImage(p.data.image)"
                    :alt="p.data.title"
                    loading="lazy"
                  />
                  <div v-else class="rec-card__cover--fallback">
                    <AppIcon name="article" :size="30" />
                  </div>
                  <span class="rec-card__badge">相关</span>
                </div>
                <div class="rec-card__body">
                  <div class="rec-card__title">{{ p.data.title }}</div>
                  <p class="rec-card__desc">
                    {{ p.data.description || "继续阅读这篇文章" }}
                  </p>
                  <div class="rec-card__meta">
                    <span class="rec-card__cat">{{ p.data.category || "未分类" }}</span>
                    <span class="rec-card__date">{{ formatDate(p.data.published) }}</span>
                    <AppIcon class="rec-card__arrow" name="arrow_forward" :size="18" />
                  </div>
                </div>
              </RouterLink>

              <!-- 随机文章卡片 -->
              <RouterLink
                v-for="p in randomPosts"
                :key="`rand-${p.slug}`"
                class="rec-card"
                :to="toLink(`/posts/${p.slug}/`)"
                :aria-label="`阅读文章：${p.data.title}`"
              >
                <div class="rec-card__cover">
                  <img
                    v-if="p.data.image"
                    :src="resolveImage(p.data.image)"
                    :alt="p.data.title"
                    loading="lazy"
                  />
                  <div v-else class="rec-card__cover--fallback">
                    <AppIcon name="shuffle" :size="30" />
                  </div>
                  <span class="rec-card__badge rec-card__badge--rand">随机</span>
                </div>
                <div class="rec-card__body">
                  <div class="rec-card__title">{{ p.data.title }}</div>
                  <p class="rec-card__desc">
                    {{ p.data.description || "发现另一篇文章" }}
                  </p>
                  <div class="rec-card__meta">
                    <span class="rec-card__cat">{{ p.data.category || "未分类" }}</span>
                    <span class="rec-card__date">{{ formatDate(p.data.published) }}</span>
                    <AppIcon class="rec-card__arrow" name="arrow_forward" :size="18" />
                  </div>
                </div>
              </RouterLink>
            </div>
          </section>

          <!-- 评论（giscus / GitHub Discussions，主题跟随站点亮暗切换） -->
          <section class="post__comments">
            <Giscus />
          </section>
        </div>

        <!-- 右侧 TOC 侧边栏（sticky；移动端隐藏） -->
        <aside v-if="headings.length" class="post__aside">
          <div class="post__aside-inner">
            <Toc :headings="headings" />
          </div>
        </aside>
      </div>
    </template>

    <div v-else class="post__notfound">
      <h1>文章未找到</h1>
      <p>你访问的文章可能已被删除或不存在。</p>
      <RouterLink to="/">返回首页</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import AppIcon from "@components/AppIcon.vue";
import Giscus from "@components/Giscus.vue";
import Toc, { type TocHeading } from "@components/Toc.vue";
import { allPosts, getPostBody } from "@lib/posts";
import { renderMarkdown } from "@lib/markdown";
import { getCategoryUrl, getTagUrl, toRouterLink } from "@utils/url-utils";
import { getRecommendedPosts, getRandomPosts } from "@utils/content-utils";
import { setHead } from "@lib/head";

const route = useRoute();
// 站内跳转统一走 RouterLink（SPA 过渡），to 去尾斜杠
const toLink = toRouterLink;
const html = ref("");
const headings = ref<TocHeading[]>([]);

/** 从渲染后的 HTML 提取标题（h2/h3/h4）生成目录 */
function extractHeadings(htmlStr: string): TocHeading[] {
  const out: TocHeading[] = [];
  const re = /<h([234])\s[^>]*id="([^"]*)"[^>]*>(.*?)<\/h\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(htmlStr))) {
    const level = Number(m[1]);
    const id = m[2];
    // 去掉标题内残留的 HTML 标签，取纯文本
    const text = m[3]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (id && text) out.push({ id, text, level });
  }
  return out;
}

/** 封面图解析（同 PostCard） */
function resolveImage(src: string): string {
  if (!src) return "";
  if (src.startsWith("/")) return src;
  if (src.startsWith("assets/")) return `/${src}`;
  return src;
}

// 当前文章。注意：路由 `/posts/:slug(.*)` 的 `(.*)` 贪婪匹配会吞掉尾部斜杠
// （访问 /posts/xxx/ 时 params.slug = "xxx/"），必须去掉尾斜杠才能与
// allPosts 中的 slug（无斜杠）匹配。
const slug = computed(() =>
  String(route.params.slug ?? "").replace(/\/+$/, ""),
);
const post = computed(() => allPosts.find((p) => p.slug === slug.value));

const recommended = computed(() =>
  post.value ? getRecommendedPosts(post.value, allPosts, 3) : [],
);

// 随机文章（排除当前文章与相关文章，避免重复）
const randomPosts = computed(() =>
  post.value
    ? getRandomPosts(post.value, allPosts, recommended.value, 3)
    : [],
);

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** 同步设置页面 head（SSG 注入 <title>/meta/JSON-LD） */
function setPostHead(p: typeof post.value) {
  if (!p) return;
  setHead({
    title: p.data.title
      ? `${p.data.title} · ${import.meta.env.VITE_SITE_TITLE ?? "Flygeonの小站"}`
      : "Flygeonの小站",
    description: p.data.description || "",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: p.data.title,
      datePublished: p.data.published.toISOString(),
      dateModified: p.data.updated ? p.data.updated.toISOString() : undefined,
      ...(p.data.category ? { articleSection: p.data.category } : {}),
    },
  });
}

async function render() {
  html.value = "";
  headings.value = [];
  if (!post.value) return;
  const body = getPostBody(post.value.slug);
  if (body) {
    const rendered = await renderMarkdown(body);
    html.value = rendered;
    headings.value = extractHeadings(rendered);
  }
  setPostHead(post.value);
}

// 客户端路由切换：slug 变化时重新渲染正文
watch(slug, () => {
  setPostHead(post.value);
  void render();
});

// SSR/首屏：同步设置 head + 顶层 await 渲染正文（renderToString 会等待，
// 确保预渲染 HTML 里包含完整文章正文，而非空 article）
setPostHead(post.value);
if (post.value) {
  const body = getPostBody(post.value.slug);
  if (body) {
    const rendered = await renderMarkdown(body);
    html.value = rendered;
    headings.value = extractHeadings(rendered);
  }
}
</script>

<style scoped>
.post {
  line-height: 1.8;
}

/* ---- 双栏布局：正文严格居中 + TOC 挂右侧 ---- */
.post__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
}
.post__main {
  min-width: 0;
}
.post__aside {
  min-width: 0;
  display: none;
}
/* 宽屏：突破 .main 的内容宽度限制，扩展到页面级容器。
   三列网格：左留白 | 居中正文 | 右侧 TOC 区（贴右缘） */
@media (min-width: 1100px) {
  .post__layout {
    width: min(75rem, calc(100vw - 3rem));
    margin-inline: calc(50% - min(75rem, calc(100vw - 3rem)) / 2);
    grid-template-columns: minmax(0, 1fr) minmax(0, 42rem) minmax(0, 1fr);
    column-gap: 2rem;
  }
  .post__main {
    grid-column: 2;
  }
  .post__aside {
    display: block;
    grid-column: 3;
    justify-self: end;
    width: 15rem;
    /* 拉伸到与正文行同高，给内部 sticky 提供滚动余量 */
    align-self: stretch;
  }
}
.post__aside-inner {
  position: sticky;
  top: calc(var(--md-layout-header-h) + 1.25rem);
  max-height: calc(100vh - var(--md-layout-header-h) - 2.5rem);
  overflow-y: auto;
}

/* ---- 文章头 ---- */
.post__header {
  padding: 0.5rem 0 1.5rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  margin-bottom: 1.75rem;
}
.post__title {
  margin: 0 0 0.9rem;
  font-family: var(--md-font-brand);
  font-size: var(--md-sys-typescale-headline-large-size);
  font-weight: 700;
  letter-spacing: var(--md-sys-typescale-headline-large-tracking);
  line-height: 1.35;
  color: var(--md-sys-color-on-surface);
}
.post__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--md-sys-typescale-body-medium-size);
  color: var(--md-sys-color-on-surface-variant);
}
.post__category {
  color: var(--md-sys-color-primary);
  text-decoration: none;
  font-weight: 500;
}
.post__category:hover {
  text-decoration: underline;
}
.post__sep {
  opacity: 0.6;
}
.post__tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.post__tag {
  font-size: var(--md-sys-typescale-label-medium-size);
  padding: 0.15rem 0.6rem;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-primary);
  text-decoration: none;
  transition: background 0.18s ease;
}
.post__tag:hover {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.post__content {
  /* Markdown 排版样式在全局 main.scss 的 .markdown-body 下定义 */
}

/* ---- 上下篇 ---- */
.post__pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 2.75rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  padding-top: 1.5rem;
}
.post__pager-link {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  text-decoration: none !important;
  padding: 0.85rem 1.1rem;
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid transparent;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.post__pager-link:hover {
  background: var(--md-sys-color-surface-container);
  border-color: var(--md-sys-color-outline-variant);
}
.post__pager-link--next {
  text-align: right;
}
.post__pager-label {
  font-size: var(--md-sys-typescale-label-medium-size);
  color: var(--md-sys-color-on-surface-variant);
}
.post__pager-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--md-sys-color-on-surface);
  transition: color 0.2s ease;
}
.post__pager-link:hover .post__pager-title {
  color: var(--md-sys-color-primary);
}

/* ---- 相关文章 / 随机文章 ---- */
.post__related {
  margin-top: 2.75rem;
}
.post__related-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.post__related-title {
  margin: 0;
  font-family: var(--md-font-brand);
  font-size: var(--md-sys-typescale-headline-medium-size);
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}
.post__related-title-icon {
  color: var(--md-sys-color-primary);
}

/* 推荐卡片网格：相关 + 随机横排大卡片 */
.post__related-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 700px) {
  .post__related-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.rec-card {
  /* min-width: 0 关键：grid 子项默认 min-width:auto，防长内容撑破 */
  min-width: 0;
  display: flex;
  align-items: stretch;
  gap: 0.9rem;
  padding: 0.9rem;
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  text-decoration: none !important;
  transition: box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease,
    background 0.22s ease;
}
.rec-card:hover {
  background: var(--md-sys-color-surface-container);
  border-color: var(--md-sys-color-outline);
  box-shadow: var(--md-sys-elevation-2);
  transform: translateY(-2px);
}
.rec-card__cover {
  position: relative;
  flex-shrink: 0;
  width: 6.5rem;
  aspect-ratio: 3 / 2;
  border-radius: var(--md-sys-shape-corner-small);
  overflow: hidden;
  background: var(--md-sys-color-surface-container-high);
}
.rec-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.rec-card__cover--fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-sys-color-primary);
  background: var(--md-sys-color-secondary-container);
}
.rec-card__badge {
  position: absolute;
  top: 0.3rem;
  left: 0.3rem;
  padding: 0.05rem 0.45rem;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  font-size: 0.65rem;
  font-weight: 700;
}
.rec-card__badge--rand {
  background: var(--md-sys-color-tertiary, var(--md-sys-color-secondary));
  color: var(--md-sys-color-on-secondary);
}
.rec-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.2rem 0;
}
.rec-card__title {
  font-family: var(--md-font-brand);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--md-sys-color-on-surface);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}
.rec-card:hover .rec-card__title {
  color: var(--md-sys-color-primary);
}
.rec-card__desc {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.55;
  color: var(--md-sys-color-on-surface-variant);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rec-card__meta {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: var(--md-sys-color-on-surface-variant);
}
.rec-card__cat {
  padding: 0.05rem 0.5rem;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
  white-space: nowrap;
}
.rec-card__date {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.rec-card__arrow {
  margin-left: auto;
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.6;
  transition: transform 0.2s ease, color 0.2s ease, opacity 0.2s ease;
}
.rec-card:hover .rec-card__arrow {
  transform: translateX(3px);
  color: var(--md-sys-color-primary);
  opacity: 1;
}

@media (max-width: 560px) {
  .rec-card__cover {
    width: 5.2rem;
  }
}

.post__comments {
  margin-top: 2.75rem;
}

.post__notfound {
  text-align: center;
  padding: 4rem 0;
}
.post__notfound a {
  color: var(--md-sys-color-primary);
}
</style>
