import { createApp as createVueApp, type App as VueApp } from "vue";
import App from "./App.vue";
import { createRouter, createWebHistory, createMemoryHistory } from "vue-router";
import { routes } from "./router";
import Varlet from "@varlet/ui";
import "@varlet/ui/es/varlet.css";
import "./styles/main.scss";

/**
 * 应用工厂（同时供客户端与 SSR 使用）。
 * 客户端用 createWebHistory；SSG 预渲染用 createMemoryHistory。
 */
export function createApp(ssr = false) {
	const app: VueApp = createVueApp(App);
	const router = createRouter({
		history: ssr ? createMemoryHistory("/") : createWebHistory("/"),
		routes,
		scrollBehavior(_to, _from, savedPosition) {
			if (savedPosition) return savedPosition;
			return { top: 0 };
		},
	});
	app.use(router);
	// Varlet UI 组件库（MD3 主题通过 StyleProvider + --color-* 变量定制）
	app.use(Varlet);
	return { app, router };
}
