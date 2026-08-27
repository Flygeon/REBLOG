<template>
  <div class="sidebar">
    <!-- Profile 卡（数据来自 config.profileConfig） -->
    <section class="side-card side-card--profile">
      <img class="side-profile__avatar" :src="avatarUrl" :alt="profile.name" />
      <p class="side-profile__name">{{ profile.name }}</p>
      <p class="side-profile__bio">{{ profile.bio }}</p>
      <!-- 社交链接（MD3 assist-chip；Material Symbols 无品牌图标，用文字 chip） -->
      <div class="side-profile__links">
        <a
          v-for="link in profile.links"
          :key="link.url"
          class="side-chip"
          :href="link.url"
          target="_blank"
          rel="noopener"
        >
          {{ link.name }}
          <AppIcon name="open_in_new" :size="13" />
        </a>
      </div>
    </section>

    <!-- 分类 -->
    <section v-if="categories.length" class="side-card">
      <h2 class="side-card__title">
        <AppIcon name="category" :size="18" />
        分类
      </h2>
      <ul class="side-cats">
        <li v-for="cat in categories" :key="cat.name">
          <RouterLink :to="cat.url" class="side-cats__row">
            <span class="side-cats__name">{{ cat.name }}</span>
            <span class="side-cats__count">{{ cat.count }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <!-- 标签云 -->
    <section v-if="tags.length" class="side-card">
      <h2 class="side-card__title">
        <AppIcon name="sell" :size="18" />
        标签
      </h2>
      <div class="side-tags">
        <RouterLink
          v-for="tag in tags"
          :key="tag.name"
          :to="getTagUrl(tag.name)"
          class="side-chip"
        >
          #{{ tag.name }}
        </RouterLink>
      </div>
    </section>

    <!-- 正在追的番剧（Bangumi API，静默失败隐藏） -->
    <section v-if="bangumiVisible" class="side-card">
      <h2 class="side-card__title">
        <AppIcon name="smart_display" :size="18" />
        正在追
      </h2>
      <div v-if="bangumiLoading" class="side-bgm-row" aria-hidden="true">
        <div v-for="n in 3" :key="n" class="side-bgm-skeleton"></div>
      </div>
      <div v-else class="side-bgm-row">
        <a
          v-for="item in bangumiDoing"
          :key="item.subject_id"
          class="side-bgm-item"
          :href="`https://bgm.tv/subject/${item.subject_id}`"
          target="_blank"
          rel="noopener"
          :title="item.subject.name_cn || item.subject.name"
        >
          <img
            :src="item.subject.images?.common || ''"
            :alt="item.subject.name_cn || item.subject.name"
            loading="lazy"
          />
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AppIcon from "@components/AppIcon.vue";
import { profileConfig } from "@/config";
import { allPosts } from "@lib/posts";
import { getCategoryList, getTagList } from "@utils/content-utils";
import { getTagUrl } from "@utils/url-utils";
import avatarUrl from "@assets/images/avatar.png";

const profile = profileConfig;

const categories = computed(() => getCategoryList(allPosts));
const tags = computed(() => getTagList(allPosts));

/* ---- 正在追：subject_type=2(动画) 收藏里 type=3(doing) 的条目 ---- */
interface BgmItem {
  subject_id: number;
  type: number;
  subject: {
    name: string;
    name_cn: string;
    images?: { common: string } | null;
  };
}

const bangumiLoading = ref(true);
const bangumiDoing = ref<BgmItem[]>([]);
const bangumiVisible = ref(true);

onMounted(async () => {
  try {
    const res = await fetch(
      "https://api.bgm.tv/v0/users/1250652/collections?subject_type=2&limit=100",
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    bangumiDoing.value = ((data.data ?? []) as BgmItem[])
      .filter((i) => i.type === 3)
      .slice(0, 6);
    // 没有在看条目就不显示该卡
    if (bangumiDoing.value.length === 0) bangumiVisible.value = false;
  } catch {
    bangumiVisible.value = false;
  } finally {
    bangumiLoading.value = false;
  }
});
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ---- 卡片基类 ---- */
.side-card {
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-large);
  padding: 1.1rem 1.2rem;
}
.side-card__title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.75rem;
  font-size: var(--md-sys-typescale-label-medium-size);
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--md-sys-color-on-surface-variant);
}

/* ---- Profile 卡 ---- */
.side-card--profile {
  text-align: center;
}
.side-profile__avatar {
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--md-sys-color-primary-container);
  box-shadow: var(--md-sys-elevation-1);
}
.side-profile__name {
  margin: 0.65rem 0 0;
  font-family: var(--md-font-brand);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}
.side-profile__bio {
  margin: 0.45rem 0 0;
  white-space: pre-line;
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: 1.7;
  color: var(--md-sys-color-on-surface-variant);
}
.side-profile__links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.85rem;
}

/* ---- chips（社交链接 / 标签共用） ---- */
.side-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.28rem 0.7rem;
  border-radius: var(--md-sys-shape-corner-full);
  border: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-primary);
  font-size: var(--md-sys-typescale-label-medium-size);
  text-decoration: none !important;
  transition: background 0.18s ease, border-color 0.18s ease,
    color 0.18s ease;
}
.side-chip:hover {
  background: var(--md-sys-color-primary-container);
  border-color: transparent;
  color: var(--md-sys-color-on-primary-container);
}

/* ---- 分类列表 ---- */
.side-cats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.side-cats__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.42rem 0.5rem;
  border-radius: var(--md-sys-shape-corner-small);
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-medium-size);
  text-decoration: none !important;
  transition: background 0.18s ease, color 0.18s ease;
}
.side-cats__row:hover {
  background: var(--md-sys-state-hover);
  color: var(--md-sys-color-primary);
}
.side-cats__count {
  min-width: 1.5rem;
  text-align: center;
  padding: 0 0.35rem;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.72rem;
  line-height: 1.3rem;
  font-variant-numeric: tabular-nums;
}
.side-cats__row:hover .side-cats__count {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

/* ---- 标签云 ---- */
.side-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* ---- 正在追（横向海报缩略图） ---- */
.side-bgm-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
.side-bgm-item {
  display: block;
  aspect-ratio: 3 / 4;
  border-radius: var(--md-sys-shape-corner-small);
  overflow: hidden;
  background: var(--md-sys-color-surface-container-high);
}
.side-bgm-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.25s ease;
}
.side-bgm-item:hover img {
  transform: scale(1.05);
}
.side-bgm-skeleton {
  aspect-ratio: 3 / 4;
  border-radius: var(--md-sys-shape-corner-small);
  background: linear-gradient(
    90deg,
    var(--md-sys-color-surface-container-high) 25%,
    color-mix(
      in srgb,
      var(--md-sys-color-on-surface) 8%,
      var(--md-sys-color-surface-container-high)
    )
      50%,
    var(--md-sys-color-surface-container-high) 75%
  );
  background-size: 200% 100%;
  animation: side-sk-shimmer 1.4s ease-in-out infinite;
}
@keyframes side-sk-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .side-bgm-skeleton {
    animation: none;
  }
}
</style>
