<template>
  <div class="friends page">
    <header class="page__header">
      <h1 class="page__title">友链</h1>
    </header>

    <!-- 友链卡片网格 -->
    <section class="friends__grid" aria-label="友链列表">
      <a
        v-for="(item, i) in shuffled"
        :key="item.title"
        class="friend-card"
        :href="item.siteurl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="friend-card__avatar">
          <img :src="item.imgurl" :alt="`${item.title} 头像`" loading="lazy" />
        </div>
        <div class="friend-card__info">
          <div class="friend-card__title">{{ item.title }}</div>
          <div class="friend-card__desc">{{ item.desc }}</div>
        </div>
        <AppIcon class="friend-card__arrow" name="arrow_forward" :size="20" />
      </a>
    </section>

    <!-- friends.md 正文（申请格式说明） -->
    <article
      class="friends__content markdown-body"
      v-html="html"
    ></article>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AppIcon from "@components/AppIcon.vue";
import { getSpec } from "@lib/posts";
import { renderMarkdown } from "@lib/markdown";
import { setHead } from "@lib/head";

const html = ref("");

const spec = getSpec("friends");
setHead({
  title: "友链 · Flygeonの小站",
  description: spec?.description || "交换友链",
});

if (spec) {
  html.value = await renderMarkdown(spec.body);
}

// 友链数据（对齐原 friends.astro 的 items）
const items = [
  {
    title: "Flygeonの小站",
    imgurl: "https://flygeon.top/_astro/avatar.CCT2o-B8_13KVJb.webp",
    desc: "音无结弦之时，悦动天使之心； 立于浮华之世，奏响天籁之音。",
    siteurl: "https://flygeon.top",
  },
  {
    title: "二叉树树",
    imgurl: "https://q2.qlogo.cn/headimg_dl?dst_uin=2726730791&spec=0",
    desc: "Protect What You Love.",
    siteurl: "https://2x.nz",
  },
  {
    title: "二次元短文の小站",
    imgurl: "https://543902.xyz/_astro/avatar.Bm6ATQHp_Z1g7TFh.webp",
    desc: "世界は大きい、君は行かなければならない",
    siteurl: "https://543902.xyz",
  },
  {
    title: "年华",
    imgurl: "https://q1.qlogo.cn/g?b=qq&nk=1323860289&s=640",
    desc: "分享生活和技术。",
    siteurl: "https://blog.amamo.top",
  },
  {
    title: "Ankyu",
    imgurl: "https://blog.ankyu.top/assets/images/avatar.webp",
    desc: "欢迎来到安秋的博客Ankyu!",
    siteurl: "https://blog.ankyu.top",
  },
];

// 客户端随机洗牌（原站 DOMContentLoaded 时打乱顺序）
const shuffled = shuffle(items);

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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

.friends__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;
  margin-bottom: 2.5rem;
}
@media (min-width: 640px) {
  .friends__grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* 友链卡片（MD3：surface + hover 上浮） */
.friend-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
  padding: 1rem 1.1rem;
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  text-decoration: none !important;
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}
.friend-card:hover {
  border-color: var(--md-sys-color-outline);
  box-shadow: var(--md-sys-elevation-2);
  transform: translateY(-2px);
}
.friend-card__avatar {
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--md-sys-shape-corner-small);
  overflow: hidden;
  background: var(--md-sys-color-surface-container-high);
}
.friend-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.friend-card__info {
  flex: 1;
  min-width: 0;
}
.friend-card__title {
  font-weight: 600;
  font-size: 0.98rem;
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
  transition: color 0.2s ease;
}
.friend-card:hover .friend-card__title {
  color: var(--md-sys-color-primary);
}
.friend-card__desc {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--md-sys-color-on-surface-variant);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.friend-card__arrow {
  flex-shrink: 0;
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.6;
  transition: transform 0.2s ease, color 0.2s ease, opacity 0.2s ease;
}
.friend-card:hover .friend-card__arrow {
  transform: translateX(3px);
  color: var(--md-sys-color-primary);
  opacity: 1;
}

.friends__content {
  /* markdown 排版全局生效 */
}
</style>
