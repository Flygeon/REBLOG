<template>
  <!--
    Varlet StyleProvider：把 MD3 主题变量（亮/暗）注入组件树，
    使 Varlet 组件（按钮/分页/tabs 等）与站点主题（html[data-theme]）同步。
  -->
  <var-style-provider :style-vars="varletThemeVars">
    <Layout>
      <!--
        Suspense 边界：Post.vue 的 `<script setup>` 含顶层 await（正文需等 shiki
        高亮器就绪后异步渲染），setup 返回 Promise。Vue 要求 async setup 组件
        必须嵌套在 <Suspense> 内，否则客户端渲染时组件不挂载（页面空白）。
        SSR（renderToString）原生支持 Suspense，会等待 async 完成输出完整正文，
        因此预渲染 HTML 不受影响；fallback 仅在客户端异步挂载期间短暂显示。
      -->
      <router-view v-slot="{ Component }">
        <!-- Swup 式切换：Transition 包在外层，mode=out-in 先淡出旧页再淡入新页；
             Suspense timeout=400 让文章页（shiki 异步）在快速解析时直接跳过
             加载 fallback，避免「淡出→加载点闪现→瞬移出现」的割裂感 -->
        <Transition name="route" mode="out-in">
          <Suspense :timeout="400">
            <component :is="Component" :key="route.path" />
            <template #fallback>
              <div class="route-loading" aria-hidden="true">
                <span class="route-loading__dot"></span>
                <span class="route-loading__dot"></span>
                <span class="route-loading__dot"></span>
              </div>
            </template>
          </Suspense>
        </Transition>
      </router-view>
    </Layout>
  </var-style-provider>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Layout from "@/components/layout/Layout.vue";
import Themes from "@varlet/ui/es/themes";
import { currentTheme } from "@lib/theme";

const route = useRoute();

/**
 * Varlet MD3 主题变量：暗色用 md3Dark，亮色用 md3Light。
 * 注意：Varlet 预设自带 Material baseline 紫（--hsl-primary 256°），
 * 且 StyleProvider 注入的变量优先级高于 main.scss 的 :root 映射，
 * 因此必须在这里用站点 MD3 tokens 覆盖颜色项，Varlet 组件才能跟随全站配色。
 */
const varletThemeVars = computed(() => {
  const base = currentTheme.value === "dark" ? Themes.md3Dark : Themes.md3Light;
  return {
    ...base,
    "--color-primary": "var(--md-sys-color-primary)",
    "--color-on-primary": "var(--md-sys-color-on-primary)",
    "--color-primary-container": "var(--md-sys-color-primary-container)",
    "--color-on-primary-container": "var(--md-sys-color-on-primary-container)",
    "--color-secondary": "var(--md-sys-color-secondary)",
    "--color-on-secondary": "var(--md-sys-color-on-secondary)",
    "--color-secondary-container": "var(--md-sys-color-secondary-container)",
    "--color-on-secondary-container":
      "var(--md-sys-color-on-secondary-container)",
    "--color-surface": "var(--md-sys-color-surface)",
    "--color-surface-container": "var(--md-sys-color-surface-container)",
    "--color-surface-container-low": "var(--md-sys-color-surface-container-low)",
    "--color-surface-container-high":
      "var(--md-sys-color-surface-container-high)",
    "--color-surface-container-highest":
      "var(--md-sys-color-surface-container-highest)",
    "--color-on-surface": "var(--md-sys-color-on-surface)",
    "--color-on-surface-variant": "var(--md-sys-color-on-surface-variant)",
    "--color-outline": "var(--md-sys-color-outline)",
    "--color-outline-variant": "var(--md-sys-color-outline-variant)",
    "--color-error": "var(--md-sys-color-error)",
    "--color-on-error": "var(--md-sys-color-on-error)",
    "--color-error-container": "var(--md-sys-color-error-container)",
    "--color-on-error-container": "var(--md-sys-color-on-error-container)",
  };
});
</script>

<style scoped>
/* 路由切换动画（复刻原博客 swup 的纯淡入淡出） */
.route-enter-active {
  transition: opacity 0.3s ease;
}
.route-leave-active {
  transition: opacity 0.2s ease;
}
.route-enter-from {
  opacity: 0;
}
.route-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .route-enter-active,
  .route-leave-active {
    transition: none;
  }
}

.route-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 4rem 0;
  min-height: 30vh;
}
.route-loading__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--md-sys-color-primary);
  opacity: 0.35;
  animation: route-loading-pulse 1.2s ease-in-out infinite;
}
.route-loading__dot:nth-child(2) {
  animation-delay: 0.15s;
}
.route-loading__dot:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes route-loading-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}
</style>
