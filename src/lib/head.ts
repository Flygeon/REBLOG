/**
 * head.ts —— 极简页面 head 管理（SSG 友好）。
 * 页面组件在 setup 中调用 setHead() 写入标题/描述/JSON-LD；
 * 客户端：直接反映到 document.title；
 * SSR：document 不存在，由 entry-server 在 renderToString 后读取并注入 HTML <head>。
 */
export interface HeadInfo {
	title?: string;
	description?: string;
	jsonLd?: object | object[];
}

let current: HeadInfo = {};

export function setHead(info: HeadInfo): void {
	current = { ...current, ...info };
	if (typeof document !== "undefined" && info.title) {
		document.title = info.title;
	}
}

export function getHead(): HeadInfo {
	return current;
}

export function resetHead(): void {
	current = {};
}
