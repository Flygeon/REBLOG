<template>
  <div class="layout">
    <!-- MD3 Top App Bar（surface-container 色，滚动后加阴影） -->
    <header class="appbar" :class="{ 'appbar--scrolled': scrolled }">
      <div class="appbar__inner">
        <a href="/" class="appbar__brand">
          <span class="appbar__brand-text">Flygeon</span>
        </a>

        <!-- 导航链接 -->
        <nav class="appbar__nav" aria-label="主导航">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="appbar__link"
            :class="{ 'appbar__link--active': isActive(link.to) }"
          >
            {{ link.label }}
          </RouterLink>
          <a
            v-for="ext in extLinks"
            :key="ext.url"
            :href="ext.url"
            target="_blank"
            rel="noopener"
            class="appbar__link appbar__link--ext"
          >
            {{ ext.label }}<AppIcon class="appbar__ext-icon" name="open_in_new" :size="14" />
          </a>
        </nav>

        <!-- 主题切换按钮 -->
        <button
          type="button"
          class="appbar__theme"
          :aria-label="isDark ? '切换到亮色模式' : '切换到暗色模式'"
          :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
          @click="toggleTheme()"
        >
          <AppIcon :name="isDark ? 'light_mode' : 'dark_mode'" :size="20" />
        </button>
      </div>
      <!-- 阅读进度条（仅文章页，贴 App Bar 下沿） -->
      <div v-if="isPost" class="read-progress" aria-hidden="true">
        <div
          class="read-progress__bar"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </header>

    <!-- 主内容 + 桌面端右侧信息栏 -->
    <div class="layout__body" :class="{ 'layout__body--grid': showSidebar }">
      <main class="main">
        <slot />
      </main>
      <aside v-if="showSidebar" class="layout__sidebar">
        <Sidebar />
      </aside>
    </div>

    <!-- Footer（内容对齐原项目） -->
    <footer class="footer">
      <div class="footer__inner">
        <p class="footer__line">
          © <span>{{ year }}</span> {{ profileName }}. All Rights Reserved. /
          <a href="/rss.xml" target="_blank" rel="noopener">RSS</a> /
          <a href="/sitemap.xml" target="_blank" rel="noopener">Sitemap</a>
          <br />
          <a
            href="https://icp.gov.moe/?keyword=20269187"
            target="_blank"
            rel="noopener"
            >萌ICP备20269187号</a
          >
          / Powered by
          <a href="https://vuejs.org" target="_blank" rel="noopener">Vue</a>
          &amp;
          <a href="https://vitejs.dev" target="_blank" rel="noopener">Vite</a>
        </p>
        <p class="footer__uptime">
          博客已运行 {{ uptimeText }}
        </p>
      </div>
    </footer>

    <!-- 回到顶部 FAB -->
    <Transition name="fab">
      <button
        v-if="showFab"
        type="button"
        class="fab"
        aria-label="回到顶部"
        title="回到顶部"
        @click="scrollTop"
      >
        <AppIcon name="arrow_upward" :size="24" />
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import AppIcon from "@components/AppIcon.vue";
import Sidebar from "@components/layout/Sidebar.vue";
import { navBarConfig, profileConfig } from "@/config";
import { LinkPreset } from "@/types/config";
import { LinkPresets } from "@constants/link-presets";
import { currentTheme, toggleTheme } from "@lib/theme";

const route = useRoute();
const scrolled = ref(false);
const isDark = computed(() => currentTheme.value === "dark");

// 文章详情页有自己的阅读版式（正文 + TOC），不显示侧栏
const showSidebar = computed(() => !route.path.startsWith("/posts"));
const isPost = computed(() => route.path.startsWith("/posts"));

/* ---- 阅读进度 + 回顶 FAB 状态（scroll 监听里统一更新） ---- */
const showFab = ref(false);
const progress = ref(0);

function scrollTop() {
  window.scrollTo({ top: 0 });
}

const year = new Date().getFullYear();
const profileName = profileConfig.name;

/* ---- 博客运行时间（对齐原项目：从 2026-05-20 开始计时） ---- */
const RUNTIME_START = new Date("2026-05-20T00:00:00").getTime();
const uptimeText = ref("");
let uptimeTimer: number | undefined;

function updateUptime() {
  const elapsed = Date.now() - RUNTIME_START;
  if (elapsed <= 0) {
    uptimeText.value = "0 天";
    return;
  }
  const days = Math.floor(elapsed / 86400000);
  const hours = Math.floor((elapsed % 86400000) / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  if (days > 0) uptimeText.value = `${days} 天 ${hours} 小时`;
  else if (hours > 0) uptimeText.value = `${hours} 小时 ${minutes} 分钟`;
  else uptimeText.value = `${minutes} 分钟`;
}

// 导航链接（站内路由）。注意 navBarConfig.links 里 LinkPreset 是枚举数字，
// 需要经 LinkPresets 映射成 { name, url }。音乐功能已移除，过滤 /music
const navLinks = computed(() =>
  navBarConfig.links
    .map((l) =>
      typeof l === "number" ? LinkPresets[l as LinkPreset] : l,
    )
    .filter((l) => !l.external && l.url !== "/music/")
    .map((l) => ({
      label: l.name,
      // 统一去掉尾斜杠，匹配 vue-router 路径（/about/ → /about）
      to: l.url.replace(/\/+$/, "") || "/",
    })),
);

// 外部链接
const extLinks = computed(() =>
  navBarConfig.links
    .map((l) =>
      typeof l === "number" ? LinkPresets[l as LinkPreset] : l,
    )
    .filter((l) => l.external)
    .map((l) => ({ label: l.name, url: l.url })),
);

function isActive(to: string): boolean {
  if (to === "/") return route.path === "/";
  return route.path.startsWith(to);
}

function onScroll() {
  scrolled.value = window.scrollY > 8;
  showFab.value = window.scrollY > 400;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.value = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
}

onMounted(() => {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  // 运行时间：立即计算 + 每分钟刷新
  updateUptime();
  uptimeTimer = window.setInterval(updateUptime, 60000);
});
onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  if (uptimeTimer) window.clearInterval(uptimeTimer);
});
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* ---- Top App Bar ---- */
.appbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--md-sys-color-surface-container-low);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  transition: box-shadow 0.25s ease, border-color 0.25s ease;
}
.appbar--scrolled {
  box-shadow: var(--md-sys-elevation-2);
  border-bottom-color: var(--md-sys-color-outline-variant);
}
/* 阅读进度条 */
.read-progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  overflow: hidden;
}
.read-progress__bar {
  height: 100%;
  background: var(--md-sys-color-primary);
  border-radius: var(--md-sys-shape-corner-full);
}
.appbar__inner {
  max-width: var(--md-layout-shell-max);
  margin: 0 auto;
  height: var(--md-layout-header-h);
  padding: 0 var(--md-layout-gutter);
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.appbar__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none !important;
  flex-shrink: 0;
}
.appbar__brand-text {
  font-family: var(--md-font-brand);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
  letter-spacing: -0.01em;
}

.appbar__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}
.appbar__nav::-webkit-scrollbar {
  display: none;
}
.appbar__link {
  padding: 0.4rem 0.7rem;
  border-radius: var(--md-sys-shape-corner-full);
  font-size: var(--md-sys-typescale-label-large-size);
  /* 字重统一 600：避免 active 态字重变化导致文字宽度偏移
     （选中项与未选中项位置不对齐） */
  font-weight: 600;
  color: var(--md-sys-color-on-surface-variant);
  text-decoration: none !important;
  white-space: nowrap;
  transition: background 0.18s ease, color 0.18s ease;
}
.appbar__link:hover {
  background: var(--md-sys-state-hover);
  color: var(--md-sys-color-on-surface);
}
.appbar__link--active {
  color: var(--md-sys-color-primary);
  background: var(--md-sys-color-secondary-container);
}
.appbar__link--ext {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}
.appbar__ext-icon {
  margin-left: 0.1rem;
  opacity: 0.75;
}

/* 主题切换按钮（MD3 icon button） */
.appbar__theme {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}
.appbar__theme:hover {
  background: var(--md-sys-state-hover);
  color: var(--md-sys-color-on-surface);
}
.appbar__theme:active {
  background: var(--md-sys-state-pressed);
}

/* 回到顶部 FAB（MD3 large FAB：primary-container 面 + 圆角方） */
.fab {
  position: fixed;
  right: clamp(1rem, 3vw, 2.25rem);
  bottom: clamp(1rem, 3vw, 2.25rem);
  z-index: 60;
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 18px;
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  box-shadow: var(--md-sys-elevation-3);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.fab:hover {
  box-shadow: var(--md-sys-elevation-4);
  transform: translateY(-2px);
}
.fab:active {
  transform: none;
}
.fab-enter-active,
.fab-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.9);
}
@media (prefers-reduced-motion: reduce) {
  .fab-enter-active,
  .fab-leave-active {
    transition: none;
  }
}

/* ---- Main ---- */
.layout__body {
  flex: 1;
  width: 100%;
  max-width: var(--md-layout-shell-max);
  margin: 0 auto;
  padding: 2rem var(--md-layout-gutter) 0;
}
/* 双栏模式（≥1080px 且非文章页）：左正文 + 右 sticky 信息栏 */
.layout__body--grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--md-layout-sidebar-w);
  gap: 2.25rem;
  align-items: start;
}
.layout__sidebar {
  position: sticky;
  top: calc(var(--md-layout-header-h) + 1.5rem);
  min-width: 0;
}
@media (max-width: 1079px) {
  .layout__body--grid {
    display: block;
  }
  .layout__sidebar {
    display: none;
  }
}
.main {
  width: 100%;
  max-width: var(--md-layout-content-max);
  margin: 0 auto;
  padding-bottom: 3rem;
}
.layout__body--grid .main {
  max-width: none;
  margin: 0;
}

/* ---- Footer ---- */
.footer {
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-low);
  margin-top: 3rem;
}
.footer__inner {
  max-width: var(--md-layout-shell-max);
  margin: 0 auto;
  padding: 1.75rem var(--md-layout-gutter);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  text-align: center;
}
.footer__line {
  margin: 0;
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: 1.9;
  color: var(--md-sys-color-on-surface-variant);
}
.footer__line a {
  color: var(--md-sys-color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}
.footer__line a:hover {
  text-decoration: underline;
}
.footer__uptime {
  margin: 0;
  font-size: var(--md-sys-typescale-label-medium-size);
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.8;
}

/* ---- 移动端 ---- */
@media (max-width: 640px) {
  .appbar__inner {
    gap: 0.75rem;
  }
  .appbar__nav {
    order: 3;
    width: 100%;
    flex-basis: 100%;
    height: 2.4rem;
    align-items: center;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
  .appbar {
    /* 移动端导航换行，App Bar 高度自适应 */
    position: sticky;
  }
  .appbar__inner {
    flex-wrap: wrap;
    height: auto;
    padding-top: 0.5rem;
    padding-bottom: 0.25rem;
  }
  .appbar__brand {
    flex: 1;
  }
  .main {
    padding-top: 1.25rem;
  }
}
</style>
