<template>
  <nav v-if="headings.length" class="toc" aria-label="目录">
    <div class="toc__head">
      <AppIcon name="menu_book" :size="16" />
      <span class="toc__title">目录</span>
    </div>
    <ul class="toc__list">
      <li
        v-for="(h, i) in headings"
        :key="h.id"
        class="toc__item"
        :class="{
          'toc__item--h3': h.level === 3,
          'toc__item--h4': h.level >= 4,
        }"
      >
        <a
          class="toc__link"
          :class="{ 'toc__link--active': activeIndex === i }"
          :href="`#${h.id}`"
          @click.prevent="scrollTo(h.id)"
        >{{ h.text }}</a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import AppIcon from "@components/AppIcon.vue";

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

const props = defineProps<{
  headings: TocHeading[];
}>();

const activeIndex = ref(-1);
let observer: IntersectionObserver | null = null;

/** 平滑滚动到锚点（含 App Bar 高度偏移） */
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 88;
  window.scrollTo({ top, behavior: "smooth" });
  history.replaceState(null, "", `#${id}`);
}

onMounted(() => {
  // IntersectionObserver 监听各标题进入视口，高亮当前章节
  const els = props.headings
    .map((h) => document.getElementById(h.id))
    .filter((el): el is HTMLElement => el !== null);
  if (!els.length) return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = props.headings.findIndex(
            (h) => h.id === entry.target.id,
          );
          if (idx >= 0) activeIndex.value = idx;
        }
      }
    },
    { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
  );
  els.forEach((el) => observer!.observe(el));
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>

<style scoped>
.toc {
  padding: 0.9rem 1rem;
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium);
}
.toc__head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
  color: var(--md-sys-color-on-surface);
}
.toc__title {
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: 700;
  letter-spacing: 0.02em;
}
.toc__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  max-height: 22rem;
  overflow-y: auto;
}
.toc__item--h3 .toc__link {
  padding-left: 1.1rem;
}
.toc__item--h4 .toc__link {
  padding-left: 1.8rem;
  font-size: 0.78rem;
}
.toc__link {
  display: block;
  padding: 0.28rem 0.5rem;
  border-radius: var(--md-sys-shape-corner-extra-small);
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none !important;
  border-left: 2px solid transparent;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.toc__link:hover {
  background: var(--md-sys-state-hover);
  color: var(--md-sys-color-on-surface);
}
.toc__link--active {
  color: var(--md-sys-color-primary);
  font-weight: 600;
  border-left-color: var(--md-sys-color-primary);
  background: var(--md-sys-color-secondary-container);
}
</style>
