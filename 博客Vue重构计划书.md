# Flygeonの小站 —— Astro 迁移 Vue 3 重构计划书

> **目标**：将现有基于 **Astro 5 + Svelte 5 + Tailwind 3** 的 Fuwari 静态博客，重构为基于 **Vue 3** 的工程，所有文章与页面内容原样保留，所有既有功能 100% 复刻，**构建产物地址（路由/URL）完全不变**。
>
> **组件库**：**Varlet**（https://varletjs.org/#/zh-CN/home，Vue 3 移动优先组件库，Material Design 3 设计语言）。
> **设计风格**：**MD3（Material Design 3）**。
>
> **硬性约束（严格遵守，不可妥协）**：
> 1. `src/content/posts/` 下 26 篇文章 + `src/content/spec/` 下 about/friends 页面内容，**正文与 frontmatter 原样保留**（不改一字）。
> 2. 全部既有页面路由、URL、分页地址、RSS/sitemap/robots 地址**逐字节一致**。
> 3. 全部交互功能（搜索、主题切换、音乐播放、评论、动态、归档、目录、分页、bangumi、灯箱、自定义滚动条等）**逐一复刻，行为等价**。
> 4. 站点语言 `zh_CN`、主题默认 `hue=250` 可调、Banner/背景图、配置 `src/config.ts` 内容不变。
> 5. MD3 + Varlet 只作为**新设计的视觉/交互基础**，不牺牲任何原功能；若某功能 Varlet 无对应组件，用等效实现兜底并保留原行为。
> 6. 现有部署链路（GitHub Pages / Cloudflare / Vercel）与产物目录 `dist` 维持原约定。

---

> **⚠️ 2026-08-26 决策变更（已与站长确认）**
> - **SSG 方案**：由「VitePress 深度定制」改为 **「Vite + Vue 3 自建 SSG」**。理由：URL 结构与 trailingSlash 完全可控，更稳地满足「构建地址不变」硬约束。
> - **MD3 视觉边界**：确认为 **全部重写重新设计**（保留原功能，主题彻底迁移，不套用原 Fuwari 布局外壳）。
> - **部署**：不启用 GitHub Pages，仅推送构建产物到 **Cloudflare Workers**（已建 `wrangler.toml` + `worker/index.js` + `.github/workflows/deploy.yml`）。
> - **P1 工程骨架已完成**：依赖安装、`package.json`/`vite.config.ts`/`tsconfig.json`、入口与路由骨架、TS 模块迁移（含 `musicEngine` 改写为 Vue `reactive` 单例）、静态资源复制、部署配置齐备；`pnpm build` 与 dev server 验证通过。下一阶段进入 Phase 2（SSG 预渲染脚本 + Markdown 管线 + 各页面功能实现）。
> - **P2 SSG 内容管线已完成**：内容加载器（`src/lib/posts.ts`，`import.meta.glob` eager 读 `src/content/posts`+spec）、Markdown 管线（`src/lib/markdown.ts`，markdown-it + shiki 双主题 + admonition/github-card 复刻）、SSR 入口 + SSG 预渲染引擎（`scripts/ssg.mjs` + `sitemap-rss.mjs`）、首页分页列表 + 文章详情页（JSON-LD/推荐/评论预留）。**26 篇文章已从原项目原样复制**。`pnpm build:ssg` 全链路通过，产出 **108 个静态页面** + sitemap.xml + rss.xml。P1/P2 期间文章内容曾缺失（src/content 为空），已修复。
> - **MD3 重设计已完成（青蓝主色）**：`_tokens.scss` 全量 MD3 token（oklch 青蓝 hue≈195 + type scale + shape/elevation/状态层 + 亮暗双主题一等公民）；Noto Sans SC；主题切换（`src/lib/theme.ts`）；Layout 重构（Top App Bar + 亮暗切换 + Footer 对齐原项目含运行时间）；Home/Post/PostCard/Pagination MD3 化；文章字数/阅读时间中文感知统计。用户反馈迭代：卡片还原竖版、页脚原内容、导航字重统一、hero 副标题用原 banner 文案。
> - **P3 剩余页面已完成**：About / Friends / Archive（按年时间线 + 过滤）/ Tag / Category / Search（客户端全文搜索）/ Music（musicEngine 播放器）/ Memos（/api/memos 代理降级）/ Bangumi（bgm.tv fetch + 状态筛选）。路由全部替换，108 静态页（65 tags + 5 categories + 26 posts）。剩余：评论集成、worker memos 代理、dist 旧文件清理。

---

## 一、现状盘点（原项目事实清单）

### 1.1 技术栈现状
| 维度 | 现状 |
|---|---|
| 框架 | Astro 5.13.10（SSG 静态站点生成） |
| 交互组件 | Svelte 5.39.8（7 个 `.svelte`） |
| 静态组件 | Astro 组件（41 个 `.astro`） |
| 样式 | Tailwind CSS 3.4.19 + `@tailwindcss/typography` + Stylus + CSS 变量（oklch + `--hue` 驱动主题） |
| 导航 | Swup（SPA 软导航 + 过渡动画 + 跨页背景播放） |
| 搜索 | Pagefind（构建期索引 + 客户端搜索） |
| 评论 | YuuComments 自托管（Cloudflare Workers + D1 + Turnstile），前端挂载 `#yuucomments` |
| 代码高亮 | Expressive Code（行号 / 折叠 / 语言徽章 / 复制按钮） |
| 数学公式 | KaTeX（remark-math + rehype-katex） |
| 提示块 | remark-directive + rehype-components（note/tip/important/caution/warning + github 卡片） |
| 图标 | astro-icon + Iconify（material-symbols / fa6-brands / fa6-regular / fa6-solid） |
| 图片灯箱 | PhotoSwipe 5 |
| 自定义滚动条 | OverlayScrollbars |
| 构建产物 | `dist/`（vercel.json 与 deploy.yml 均以 `dist` 为准） |

### 1.2 路由与页面清单（URL 必须逐字节保留）
| 路由 | 源文件 | 功能 | 交互组件 |
|---|---|---|---|
| `/`（含 `/2/…/N/` 分页） | `[...page].astro` | 首页文章列表，每页 8 篇（`PAGE_SIZE=8`），置顶优先 + 日期倒序 | `PostPage` + `Pagination` |
| `/posts/[slug]/` | `posts/[...slug].astro` | 文章详情：字数/阅读时长、标题、AIGC 徽标、元数据、封面、正文、许可协议、YuuComments 评论、上下篇、推荐/随机 | `PostMeta`、`RecommendedPosts`、`Comments` |
| `/about/` | `about.astro` | 关于页：`spec/about.md` 正文 + 网站统计 + 技术栈 | `AboutStatistics` |
| `/archive/` | `archive.astro` | 归档：按年份分组 + 按标签/分类/未分类 URL 参数过滤 | `ArchivePanel`(Svelte) |
| `/friends/` | `friends.astro` | 友链页：5 个站点卡片（随机打乱）+ `spec/friends.md` + 评论 | — |
| `/bangumi/` | `bangumi.astro` | Bangumi 收藏（构建期拉 `api.bgm.tv`，分页/状态筛选） | `BangumiSection` 系列 |
| `/memos/` | `memos.astro` | 动态页：`/api/memos` 拉取 + 60s 轮询 + 年份筛选 + 附件图 | `MemosList`(Svelte) |
| `/music/` | `music.astro` | 音乐播放器整页（Meting API 歌单 + 歌词滚动 + 流动背景） | `MusicPlayer`(Svelte) |
| `rss.xml` | `rss.xml.ts` | RSS 订阅（`@astrojs/rss`） | — |
| `sitemap.xml` | `sitemap.xml.ts` | 站点地图（`@astrojs/sitemap`） | — |
| `robots.txt` | `robots.txt.ts` | robots | — |
| `post.json` | `post.json.ts` | 文章 JSON（供外部消费） | — |

### 1.3 7 个 Svelte 交互组件（重构核心，必须逐行为转为 Vue）
1. **`Search.svelte`** — 全站搜索：Ctrl+K 唤起、Pagefind 搜索、键盘导航（↑↓/Enter/Esc）、loading/空态/结果态、`.custom-md` 高亮。
2. **`LightDarkSwitch.svelte`** — 明/暗/自动 三态切换（localStorage `theme` + `hue`），跟随系统。
3. **`DisplaySettings.svelte`** — 显示设置面板：色相滑块（0-360）、单/双栏切换、列表/卡片布局、隐藏背景图、主题切换。
4. **`ArchivePanel.svelte`** — 归档按年分组 + 时间轴样式 + URL 参数 tag/category/uncategorized 过滤。
5. **`MemosList.svelte`** — 动态列表：轮询、年份筛选、Markdown 渲染（markdown-it）、附件图、骨架屏。
6. **`MusicPlayer.svelte`** — 整页播放器：Meting 歌单、canvas 流动背景（四象限 Slice + screen 合成 + blur）、阶梯歌词滚动、播放控制。
7. **`MusicPreview.svelte`** — 导航栏 hover 迷你播放器：与整页共用引擎、紧凑控制。

**关键：音乐共享引擎 `src/lib/musicEngine.ts`** — Svelte store 单例，`<audio>` 挂 `document.body`，跨 Swup 页面后台播放。重构为 **Vue `reactive()` 模块级单例**，逻辑逐函数照搬（`loadPlaylist` / `loadLyrics` / `parseLrc` / `playNext` / `handleEnded` / `handleError` / Media Session / 偏好持久化）。

### 1.4 布局与主题系统
- **`Layout.astro`**：根 HTML + head（SEO/OG/Twitter/favicon/canonical）+ 主题防闪烁内联脚本（localStorage theme/hue/post-layout/post-list-layout/banner-hidden/background-hidden）+ OverlayScrollbars + PhotoSwipe + Umami 统计脚本 + YuuComments 全局配置注入。
- **`MainGridLayout.astro`**：固定 Navbar + Banner（标题/副标题打字效果）+ 主栅格（sidebar + main + footer）+ BackToTop。Banner 透出全站固定背景图。
- **`Navbar.astro`**：滚动阻尼折叠动画（1200→420px）、音乐 hover 迷你播放器、Search/DisplaySettings/移动端 Menu。
- **主题**：CSS 变量 `--hue`（0-360，默认 250）+ oklch 色板（`variables.styl`），明暗双态，`--primary` 等全套变量。

### 1.5 部署与外部集成
| 项 | 内容 |
|---|---|
| GitHub Pages | `.github/workflows/deploy.yml`（`withastro/action` 构建 + 部署 + notify Profile-page） |
| Vercel | `vercel.json`（`pnpm build` + `dist` + 安全响应头） |
| Cloudflare Pages | `.pages.yml`（CMS 图片上传到 `raw.flygeon.eu.org` + 文章 collection 管理） |
| 图片图床 | 文章图片多引用 `raw.flygeon.eu.org`（外部），另有本地 `assets/images/{banner,background,avatar}` |
| 评论 | YuuComments：`/comments/comments.css` + `/comments/comments.js` + `window.YuuCommentsConfig`（env: `PUBLIC_COMMENTS_API_BASE_URL`、`PUBLIC_TURNSTILE_SITE_KEY`） |
| Memos | `functions/api/memos.ts`（Pages Function 代理）+ `worker/memos-proxy.js`（Worker 备选，`MEMOS_TOKEN`） |
| 分析 | Umami 自托管（`umami.flygeon.eu.org`） |
| 内容管理 | `public/admin/`（Decap CMS 式后台） |
| i18n | 11 语言（zh_CN/zh_TW/en/ja/ko/es/th/vi/id/tr） |

---

## 二、重构目标架构

### 2.1 技术选型
| 维度 | 方案 |
|---|---|
| 框架 | **Vue 3.5+**（Composition API + `<script setup>` + `reactive`/`ref`） |
| 构建 | **Vite 6**（原生，替换 Astro） |
| SSG | **Vite + Vue 3 自建 SSG**：`vite build` 产出 SPA + Node 脚本用 `@vue/server-renderer` 预渲染全路由为静态 HTML（trailingSlash 精确复刻） |
| 路由 | **vue-router 4**（HTML5 history，`trailingSlash: 'always'` 对应） |
| 组件库 | **Varlet**（`@varlet/ui`，MD3） |
| 样式 | **SCSS/CSS 变量**（替换 Tailwind），保留原 oklch+`--hue` 主题体系，叠加 MD3 token |
| 状态 | Pinia（主题/显示设置/音乐引擎全局状态） |
| Markdown | **markdown-it** + 自研插件（复刻 admonition / github 卡片 / KaTeX / 目录 / 代码块） |
| 代码高亮 | **Shiki**（Expressive Code 底层就是 Shiki，行为最接近）或 @shikijs |
| 搜索 | **Pagefind**（保留，Vite 构建后追加 `pagefind --site dist`） |
| 评论/动态/分析 | 原样复用外部服务，前端逻辑照搬 |

### 2.2 SSG 方案决策（已确认）
原项目是**纯静态生成**，且 `trailingSlash: 'always'`（URL 一律以 `/` 结尾）。

- ~~路线 A：VitePress 深度定制~~ —— **已弃用**。VitePress 的 URL 映射（`srcDir` + `rewrites`）、trailingSlash 与动态路由（分页 `/2/`、`/posts/[slug]/`）无法精确复刻原站全部路由，且默认文档主题需大量改造，不契合"全新 MD3 主题"。
- **路线 B（最终采用）：Vite + Vue 3 自建 SSG** ✅
  `vite build` 产出 SPA，再用 Node 脚本 `scripts/ssg.mjs` 借助 `@vue/server-renderer` 将**全部路由**预渲染为静态 HTML 写入 `dist/`（含 trailingSlash 目录结构）。完全自主，能精确控制每个 URL / SEO head / rss / sitemap。工作量大但可控，符合"功能全保留 + URL 不变 + 全新 MD3 主题"的硬约束。
- ~~路线 C：Nuxt 3~~ —— 引入较重框架，与轻量迁移目标不符。

**最终技术栈：Vite 6 + Vue 3.5 + vue-router 4 + Varlet(MD3) + markdown-it + Shiki + 自建 SSG 脚本。**

---

## 三、实施阶段（Checkpoint 计划）

沿用站长的"烤问 → 继续"多 checkpoint 节奏，每阶段结束构建验证。

### Phase 0：需求澄清与基线锁定（开工前，必须先确认）
- [ ] 确认 **SSG 路线**（A/B/C，见 2.2）。
- [ ] 确认 **部署目标**：原项目部署点（GitHub Pages `flygeon.eu.org`？Cloudflare `flygeon.top`？Vercel？）以及"构建后的地址不要变"的确切含义——是**产物 URL 结构**不变，还是**部署平台/域名**也不变。
- [ ] 确认 **MD3 视觉边界**：是在保留原 Fuwari 布局结构前提下套 MD3 token（推荐），还是允许整体重新设计为纯 MD3 移动优先布局？**默认前者**（功能与视觉基线尽可能贴近原站，仅组件外观/动效按 Varlet/MD3 规范）。
- [ ] 确认 **Tailwind 去留**：原站大量 Tailwind 工具类。默认**迁移为 CSS（SCSS）类**，彻底移除 Tailwind 依赖（符合"用 Varlet/MD3 重构"意图）。若想保留 Tailwind 减少迁移量需确认。
- [ ] 确认 **varlet 版本**与图标方案（Varlet 自带 icon 或沿用 Iconify material-symbols，默认沿用 Iconify 保证图标不变）。

### Phase 1：工程骨架搭建
- [ ] 新建 Vue3 + Vite + VitePress（或所选方案）工程，`package.json` scripts：`dev` / `build`（含 pagefind）/ `preview` / `type-check`。
- [ ] 安装 Varlet + 主题初始化（`@varlet/ui` 按需引入，MD3 主题 token 定义）。
- [ ] 目录结构设计（见 §四），迁移 `src/config.ts`、`src/constants/`、`src/i18n/`、`src/types/`、`src/utils/` 为 TS 模块。
- [ ] 迁移 CSS 变量主题体系（`variables` → SCSS + CSS 自定义属性，保留 `--hue` / oklch 双态）。
- [ ] **验证点**：`pnpm dev` 启动，空页面可访问，主题变量生效。

### Phase 2：核心数据层与内容管线
- [ ] 内容集合：读取 `src/content/posts/*.md` + `src/content/spec/*.md`，解析 frontmatter（schema 同 `config.ts`：title/published/updated/draft/description/image/tags/category/lang/aigc/pinned）。
- [ ] Markdown 渲染管线（markdown-it）：
  - admonition（note/tip/important/caution/warning）→ 复刻原样式
  - github 卡片 directive → 复刻
  - KaTeX 数学公式 → 复刻
  - 代码块 → Shiki + 行号/折叠/语言徽章/复制按钮（对齐 Expressive Code 行为）
  - 标题 slug + 目录、`remarkSectionize` 章节化行为
  - 阅读时长 / 字数统计（remarkReadingTime / remarkExcerpt 逻辑）
- [ ] 数据工具：`content-utils.ts` 全套（排序/置顶/推荐/随机/标签/分类/站点统计），`url-utils` / `date-utils` / `setting-utils` 迁移。
- [ ] **验证点**：文章数据可完整读取，Markdown 渲染与原文一致（对比截图）。

### Phase 3：全局布局与主题交互（对应 Layout/MainGrid/Navbar/SideBar）
- [ ] 根布局组件（等价 `Layout.astro`）：head/SEO/OG/favicon/canonical、主题防闪烁脚本、OverlayScrollbars、PhotoSwipe、Umami、YuuComments 配置注入。
- [ ] 主栅格布局（等价 `MainGridLayout.astro`）：Navbar + Banner（打字效果）+ sidebar + main + footer + BackToTop。
- [ ] **Navbar**：滚动阻尼折叠动画、音乐 hover 迷你播放器容器、Search/DisplaySettings/Menu。
- [ ] **SideBar 系列**：Profile / RouteSwitch（线路切换）/ Categories / Tags / UmamiStats / WidgetLayout（折叠展开）/ SideBarTOC。
- [ ] **主题状态（Pinia）**：明暗自动三态、`hue` 色相、单双栏、列表/卡片、隐藏背景，localStorage 持久化。
- [ ] **验证点**：首页整页结构与原站一致，主题切换/色相滑块生效，导航可跳转。

### Phase 4：7 个 Svelte → Vue 组件逐一重写（最高优先级）
逐个转写，每转一个即验证行为：
- [ ] `Search.vue`（Pagefind 搜索 + 键盘导航 + 状态机）
- [ ] `LightDarkSwitch.vue`
- [ ] `DisplaySettings.vue`
- [ ] `ArchivePanel.vue`
- [ ] `MemosList.vue`
- [ ] `musicEngine.ts` → Pinia store 单例（audio 挂 body，跨路由后台播放）
- [ ] `MusicPlayer.vue`（canvas 流动背景 + 歌词阶梯 + 控制）
- [ ] `MusicPreview.vue`（hover 迷你播放器）
- [ ] **验证点**：每个组件功能/动画与原站对比通过。

### Phase 5：页面组装与路由
- [ ] 首页分页 `[...page]` → vue-router（URL `/`、`/2/`…`/N/` 逐字节一致，`PAGE_SIZE=8`，置顶+倒序）。
- [ ] 文章页 `/posts/[slug]/`（字数/时长/AIGC/封面/正文/许可/评论/上下篇/推荐随机/JSON-LD）。
- [ ] `/about/` `/archive/` `/friends/` `/bangumi/` `/memos/` `/music/` 全页面。
- [ ] `rss.xml` `sitemap.xml` `robots.txt` `post.json` 生成。
- [ ] **验证点**：全站路由清单与现站 URL 一一对应（脚本比对）。

### Phase 6：构建、部署与硬性约束验收
- [ ] `pnpm build` → `dist/`（对齐原产物目录 + `pagefind --site dist`）。
- [ ] 逐页对比产物 HTML 结构、URL、SEO meta。
- [ ] 部署链路（GitHub Pages / Cloudflare / Vercel）按确认后的目标配置。
- [ ] 26 篇文章 + about/friends 内容逐字对比无丢失。
- [ ] 全功能回归清单（§五）逐项打勾。

---

## 四、目标目录结构（建议）

```
REBLOG/                     # 重构工作目录（当前工作区）
├── src/
│   ├── config.ts           # 站点配置（原样迁移）
│   ├── main.ts             # Vue 入口（createSSRApp / createApp）
│   ├── App.vue             # 根组件（含全局布局）
│   ├── router.ts           # vue-router（对应原页面路由）
│   ├── assets/images/      # banner/background/avatar 原样复制
│   ├── components/         # 全部 .vue 组件（映射原 components/）
│   │   ├── layout/         # Navbar, SideBar, Footer, Banner, BackToTop…
│   │   ├── post/           # PostCard, PostMeta, RecommendedPosts…
│   │   ├── search/         # Search.vue
│   │   ├── music/          # MusicPlayer, MusicPreview, musicEngine
│   │   ├── memos/          # MemosList
│   │   ├── comments/       # Comments
│   │   ├── bangumi/        # BangumiSection, Card, FilterControls, Pagination
│   │   └── widget/         # DisplaySettings, ArchivePanel, Profile, …
│   ├── pages/              # Vue 页面组件（首页/文章/关于/归档/友链/番剧/动态/音乐）
│   ├── content/posts/      # 26 篇文章（原样拷贝，不改一字）
│   ├── content/spec/       # about.md, friends.md
│   ├── lib/                # markdown 管线, content-utils, url-utils…
│   ├── stores/             # theme, display, music 全局状态（reactive 单例）
│   ├── styles/             # SCSS 变量/主题/MD3 token/markdown/代码块
│   ├── plugins/            # markdown-it / Shiki 插件迁移
│   ├── i18n/               # 11 语言（原样迁移）
│   ├── types/              # 类型定义
│   └── constants/          # 常量
├── scripts/                # 构建脚本
│   ├── ssg.mjs             # 核心：用 @vue/server-renderer 预渲染全部路由 → dist
│   └── sitemap-rss.mjs     # 生成 rss.xml / sitemap.xml / robots.txt / post.json
│   ├── styles/             # SCSS 变量/主题/MD3 token/markdown/代码块
│   ├── plugins/            # markdown-it / rehype 插件迁移
│   ├── i18n/               # 11 语言（原样迁移）
│   ├── types/              # 类型定义
│   └── constants/          # 常量
├── public/                 # admin/, comments/, favicon/, music/, typing.js（原样）
├── functions/api/memos.ts  # Memos Pages Function（原样）
├── worker/                 # memos-proxy.js（原样）
├── dist/                   # 构建产物
├── pagefind.yml
├── vercel.json
├── .pages.yml
├── .github/workflows/      # deploy/build（改为 Vite 构建）
└── package.json
```

> **关键原则**：`src/content/posts` 与 `src/content/spec` 目录**整目录拷贝、不改任何字节**。所有图片资源 `assets/images/` 原样复制。

---

## 五、功能回归清单（验收标准）

| # | 功能 | 原实现 | Vue 重构验收 |
|---|---|---|---|
| 1 | 全站搜索 (Ctrl+K, Pagefind) | Search.svelte | ✅ 行为一致 |
| 2 | 明/暗/自动主题 + 色相滑块 | LightDarkSwitch/DisplaySettings | ✅ |
| 3 | 单/双栏、列表/卡片、隐藏背景 | DisplaySettings | ✅ |
| 4 | 首页分页（8 篇/页，置顶+倒序） | [...page].astro | ✅ URL 逐字节 |
| 5 | 文章详情（字数/时长/AIGC/封面/许可/上下篇/推荐） | posts/[...slug].astro | ✅ |
| 6 | 目录 TOC + 章节锚点 | SideBarTOC + remarkSectionize | ✅ |
| 7 | 代码块（行号/折叠/徽章/复制） | Expressive Code | ✅ |
| 8 | 数学公式 KaTeX | rehype-katex | ✅ |
| 9 | 提示块 + github 卡片 | remark-directive + components | ✅ |
| 10 | 图片灯箱 | PhotoSwipe | ✅ |
| 11 | 自定义滚动条 | OverlayScrollbars | ✅ |
| 12 | YuuComments 评论 | Comments.astro + /comments/* | ✅ |
| 13 | Memos 动态（轮询/筛选/图） | MemosList + /api/memos | ✅ |
| 14 | 音乐播放器（整页+迷你+跨页后台） | MusicPlayer/Preview + engine | ✅ |
| 15 | 归档按年 + 参数过滤 | ArchivePanel | ✅ |
| 16 | Bangumi 收藏（分页/筛选） | bangumi/* | ✅ |
| 17 | RSS / sitemap / robots / post.json | 各 .ts | ✅ |
| 18 | 导航滚动折叠 + Banner 打字效果 | Navbar/MainGrid 脚本 | ✅ |
| 19 | Umami 统计 + 运行时长 | Layout/Footer | ✅ |
| 20 | 路由过渡动画（原 Swup） | Swup | ✅ 用 vue-router transition 等价 |

---

## 六、风险与注意事项

1. **SSG 方案不确定**是最大风险 —— 必须在 Phase 0 确认，否则可能返工。
2. **Tailwind 移除**需系统性替换大量工具类为 CSS，工作量大；若想缩短工期可临时保留。
3. **Expressive Code → Shiki** 的样式差异：需在 Phase 2 逐项对比，尽量复刻原代码块观感。
4. **音乐引擎跨路由后台播放**：vue-router 下 `<audio>` 需挂在 `App.vue` 根或 `document.body`，路由切换不得销毁——用 Pinia store + 全局单例保证。
5. **Swup 过渡动画**用 vue-router `<Transition>` 复刻，需处理 banner/首屏/滚动位置的等价行为。
6. **图标一致性**：优先沿用 Iconify `material-symbols` 等（与 Varlet icon 共存），保证视觉不变。
7. **评论/动态/分析依赖外部服务与 env**：`PUBLIC_COMMENTS_API_BASE_URL`、`PUBLIC_TURNSTILE_SITE_KEY`、`MEMOS_TOKEN` 需在构建环境正确注入。

---

## 七、交付物定义

- 每个 Phase 结束产出：可运行代码 + 构建验证 + 与原站行为对比结论。
- 最终交付：**Vue 3 + Varlet(MD3) 重构后的完整博客**，`dist/` 产物可部署，26 篇文章 + 全部功能逐项验收通过。

---

*计划书版本 v1.0 — 基于对原项目 `C:\blog\blog` 的全面勘察（路由、7 个 Svelte 组件、musicEngine、布局、主题、部署、内容 schema、特殊 Markdown 语法均已核实）。*

*待 Phase 0 与站长确认：① SSG 路线；② 部署目标与"地址不变"精确含义；③ MD3 视觉边界；④ Tailwind 去留。*
