# VitePress

> 目标：能把 Markdown 学习笔记构建成可访问的文档站，理解 source directory、file-based routing、config、themeConfig、nav、sidebar、frontmatter、Markdown extensions、asset handling、base、build、preview、GitHub Actions 和 GitHub Pages 部署，并能排查 dead link、路径、构建和发布问题。

## 官方资料

- [VitePress v1 Getting Started](https://vuejs.github.io/vitepress/v1/guide/getting-started)
- [VitePress v1 Routing](https://vuejs.github.io/vitepress/v1/guide/routing)
- [VitePress v1 Markdown Extensions](https://vuejs.github.io/vitepress/v1/guide/markdown)
- [VitePress v1 Asset Handling](https://vuejs.github.io/vitepress/v1/guide/asset-handling)
- [VitePress v1 Frontmatter](https://vuejs.github.io/vitepress/v1/guide/frontmatter)
- [VitePress v1 Using Vue in Markdown](https://vuejs.github.io/vitepress/v1/guide/using-vue)
- [VitePress v1 Default Theme Config](https://vuejs.github.io/vitepress/v1/reference/default-theme-config)
- [VitePress v1 Site Config](https://vuejs.github.io/vitepress/v1/reference/site-config)
- [VitePress v1 Deploy](https://vuejs.github.io/vitepress/v1/guide/deploy)
- [VitePress current docs](https://vitepress.dev/)

说明：本仓库早期版本使用过 `vitepress` `^1.6.4`，所以本文以 VitePress v1 官方文档为主要依据。当前网站外壳已经迁移到 React、TypeScript 和 Vite，但这篇文章仍然保留为静态文档站学习材料。VitePress 当前官网可能默认显示更新版本文档，学习时要注意版本匹配。

## 场景开场

“GitHub 仓库里文章不少，可别人点进来以后不知道从哪读起。”

Markdown 文件能保存内容，但知识库还需要：

- 首页。
- 导航栏。
- 侧边栏。
- 文档路由。
- 目录。
- 主题样式。
- 构建检查。
- 发布到 GitHub Pages。

VitePress 的作用，就是把一堆 Markdown 组织成一个可阅读、可导航、可分享的网站。对 AIOps 转岗来说，它把“我写了很多笔记”升级成“我有一个能打开的网站作品集”。

## 一句话人话版

VitePress 是基于 Vite 和 Vue 的静态文档站生成器：它读取 `docs` 目录里的 Markdown，按文件生成页面，再构建成可部署到 GitHub Pages 的静态网站。

## 学习边界

这一篇重点讲 VitePress v1：

- 项目目录和 `docs` source directory。
- `package.json` scripts。
- `docs/.vitepress/config.mts`。
- 文件路由。
- nav 和 sidebar。
- frontmatter。
- Markdown 扩展。
- 静态资源。
- base 配置。
- build、preview、dead link。
- GitHub Actions + GitHub Pages 部署。
- 本仓库配置如何理解。

不在这一篇深入讲：

- 自定义 Vue 主题开发。
- Vite 插件体系。
- 搜索服务 Algolia 全配置。
- VitePress 2.0 alpha 新能力。

对你的知识库而言，先把默认主题、导航、构建、部署和排障掌握好，比一开始做复杂主题更重要。

## 官方知识地图

VitePress v1 官方文档可以按这棵树理解：

```text
VitePress v1 docs
  ├── Guide
  │   ├── Getting Started
  │   ├── Routing
  │   ├── Deploy
  │   ├── Markdown Extensions
  │   ├── Asset Handling
  │   ├── Frontmatter
  │   ├── Using Vue in Markdown
  │   └── i18n, sitemap, SSR compatibility
  ├── Reference
  │   ├── Site Config
  │   ├── Default Theme Config
  │   ├── Frontmatter Config
  │   ├── Runtime API
  │   └── CLI
  └── Advanced
      ├── extending default theme
      ├── build hooks
      └── custom theme
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>VitePress v1 docs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ├── Guide</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>  │   ├── Getting Started</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>  │   ├── Routing</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 5 行 | <code>  │   ├── Deploy</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>  │   ├── Markdown Extensions</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>  │   ├── Asset Handling</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 8 行 | <code>  │   ├── Frontmatter</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 9 行 | <code>  │   ├── Using Vue in Markdown</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 10 行 | <code>  │   └── i18n, sitemap, SSR compatibility</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 11 行 | <code>  ├── Reference</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 12 行 | <code>  │   ├── Site Config</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 13 行 | <code>  │   ├── Default Theme Config</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 14 行 | <code>  │   ├── Frontmatter Config</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 15 行 | <code>  │   ├── Runtime API</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 16 行 | <code>  │   └── CLI</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 17 行 | <code>  └── Advanced</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 18 行 | <code>      ├── extending default theme</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 19 行 | <code>      ├── build hooks</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 20 行 | <code>      └── custom theme</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |


本篇按学习顺序重排：

```text
先理解 VitePress 做什么
  -> 再看目录和路由
  -> 再看 config.mts
  -> 再看 nav/sidebar
  -> 再看 Markdown 扩展
  -> 再看构建和部署
  -> 最后看排障
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>先理解 VitePress 做什么</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 再看目录和路由</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; 再看 config.mts</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; 再看 nav/sidebar</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; 再看 Markdown 扩展</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; 再看构建和部署</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; 最后看排障</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## VitePress 在 AIOps 知识库中的位置

```text
Markdown docs
  ├── Linux
  ├── Docker
  ├── Prometheus
  ├── Grafana
  ├── Runbook
  └── Projects
        |
        v
VitePress
  ├── routes
  ├── nav
  ├── sidebar
  ├── markdown rendering
  ├── build checks
  └── static output
        |
        v
GitHub Pages
        |
        v
public AIOps portfolio site
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Markdown docs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ├── Linux</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>  ├── Docker</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>  ├── Prometheus</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 5 行 | <code>  ├── Grafana</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>  ├── Runbook</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>  └── Projects</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 8 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>VitePress</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  ├── routes</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 12 行 | <code>  ├── nav</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 13 行 | <code>  ├── sidebar</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 14 行 | <code>  ├── markdown rendering</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 15 行 | <code>  ├── build checks</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 16 行 | <code>  └── static output</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 17 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 18 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 19 行 | <code>GitHub Pages</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 20 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 21 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 22 行 | <code>public AIOps portfolio site</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


它在你的学习路径里承担三个角色：

| 角色 | 说明 |
|---|---|
| 知识组织器 | 把零散 Markdown 变成有导航的网站 |
| 构建检查器 | 构建时暴露 dead link、Markdown 和配置问题 |
| 作品集入口 | 发布到 GitHub Pages 后可直接分享 |

## VitePress 是什么

VitePress 是静态站点生成器，主要面向文档站。

它读取 Markdown：

```text
docs/index.md
docs/tech-stack/foundation/linux.md
docs/projects/README.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docs/index.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>docs/tech-stack/foundation/linux.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>docs/projects/README.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


生成静态文件：

```text
docs/.vitepress/dist/
  index.html
  assets/
  tech-stack/
  projects/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docs/.vitepress/dist/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  index.html</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  assets/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  tech-stack/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  projects/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这些静态文件可以部署到 GitHub Pages、Vercel、Netlify、Nginx 等静态托管环境。

VitePress 的核心公式：

```text
VitePress = Markdown + Vite + Vue + Default Theme + Static Build
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>VitePress = Markdown + Vite + Vue + Default Theme + Static Build</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 静态站点生成流程

```text
source directory: docs/
  |
  +--> Markdown pages
  +--> .vitepress/config.mts
  +--> public assets
        |
        v
vitepress build docs
        |
        v
static output: docs/.vitepress/dist
        |
        v
deploy to GitHub Pages
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>source directory: docs/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  +--&gt; Markdown pages</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  +--&gt; .vitepress/config.mts</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  +--&gt; public assets</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>vitepress build docs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>static output: docs/.vitepress/dist</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 13 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>deploy to GitHub Pages</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


每一步的含义：

| 步骤 | 说明 |
|---|---|
| source directory | 文档源码根目录，本仓库是 `docs` |
| config file | 站点标题、base、导航、侧边栏等 |
| Markdown pages | 每个 `.md` 文件通常对应一个页面 |
| build | 把源码转换成静态站点 |
| dist | 构建产物 |
| deploy | 把 dist 发布到静态托管 |

## 当前仓库配置

本仓库 `package.json`：

```json
{
  "name": "zero-to-aiops",
  "private": true,
  "type": "module",
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  "devDependencies": {
    "vitepress": "^1.6.4"
  }
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "name": "zero-to-aiops",</code> | 设置 `name` 字段，值是 `"zero-to-aiops"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "private": true,</code> | 设置 `private` 字段，值是 `true`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "type": "module",</code> | 设置 `type` 字段，值是 `"module"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "scripts": {</code> | 设置 `scripts` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>    "docs:dev": "vitepress dev docs",</code> | 设置 `docs:dev` 字段，值是 `"vitepress dev docs"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>    "docs:build": "vitepress build docs",</code> | 设置 `docs:build` 字段，值是 `"vitepress build docs"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>    "docs:preview": "vitepress preview docs"</code> | 设置 `docs:preview` 字段，值是 `"vitepress preview docs"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>  },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 10 行 | <code>  "devDependencies": {</code> | 设置 `devDependencies` 字段，值是 `{`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 11 行 | <code>    "vitepress": "^1.6.4"</code> | 设置 `vitepress` 字段，值是 `"^1.6.4"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 12 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 13 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


字段解释：

| 字段 | 含义 |
|---|---|
| `type: module` | 使用 ESM 模块语法，配置文件可用 `import` |
| `docs:dev` | 本地开发服务器 |
| `docs:build` | 生产构建 |
| `docs:preview` | 本地预览构建产物 |
| `vitepress` | 文档站构建工具依赖 |

本仓库 `docs/.vitepress/config.mts` 的关键点：

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'To Be Better AIOps Engineer',
  description: 'AIOps 学习路线、实战项目、面试准备和天津求职记录',
  base: '/zero-to-aiops/',
  themeConfig: {
    nav: [
      { text: '学习路线', link: '/roadmap/README' },
      { text: '技术栈', link: '/tech-stack/README' }
    ],
    sidebar: [
      {
        text: '基础工具',
        items: [
          { text: 'Linux', link: '/tech-stack/foundation/linux' }
        ]
      }
    ]
  }
})
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import { defineConfig } from 'vitepress'</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 2 行 | <em>空行</em> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 3 行 | <code>export default defineConfig({</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 4 行 | <code>  title: 'To Be Better AIOps Engineer',</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 5 行 | <code>  description: 'AIOps 学习路线、实战项目、面试准备和天津求职记录',</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 6 行 | <code>  base: '/zero-to-aiops/',</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 7 行 | <code>  themeConfig: {</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 8 行 | <code>    nav: [</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 9 行 | <code>      { text: '学习路线', link: '/roadmap/README' },</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 10 行 | <code>      { text: '技术栈', link: '/tech-stack/README' }</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 11 行 | <code>    ],</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 12 行 | <code>    sidebar: [</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 13 行 | <code>      {</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 14 行 | <code>        text: '基础工具',</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 15 行 | <code>        items: [</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 16 行 | <code>          { text: 'Linux', link: '/tech-stack/foundation/linux' }</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 17 行 | <code>        ]</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 18 行 | <code>      }</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 19 行 | <code>    ]</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 20 行 | <code>  }</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 21 行 | <code>})</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


这里最重要的是：

- `base: '/zero-to-aiops/'`：适配 GitHub Pages 仓库路径。
- `themeConfig.nav`：顶部导航。
- `themeConfig.sidebar`：侧边栏。
- link 通常不写 `.md`，使用站点路由。

## 项目结构

一个 VitePress 文档站常见结构：

```text
zero-to-aiops/
  package.json
  package-lock.json
  docs/
    index.md
    tech-stack/
      README.md
      foundation/
        linux.md
        vitepress.md
    projects/
      README.md
    public/
      images/
    .vitepress/
      config.mts
      dist/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>zero-to-aiops/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  package.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  package-lock.json</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  docs/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>    index.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>    tech-stack/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>      README.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>      foundation/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>        linux.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>        vitepress.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>    projects/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>      README.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 13 行 | <code>    public/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>      images/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 15 行 | <code>    .vitepress/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 16 行 | <code>      config.mts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 17 行 | <code>      dist/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


路径说明：

| 路径 | 作用 |
|---|---|
| `docs/` | source directory |
| `docs/index.md` | 首页 |
| `docs/.vitepress/config.mts` | VitePress 配置 |
| `docs/public/` | 静态资源目录，会复制到站点根路径 |
| `docs/.vitepress/dist/` | build 产物，不应手写维护 |
| `package.json` | scripts 和依赖 |

注意：`dist/` 是构建产物，不是源码。一般不需要提交，除非你采用特殊部署方式。

## 安装和命令

安装依赖：

```bash
npm install
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm install</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


如果已有 `package-lock.json`，CI 和复现环境更推荐：

```bash
npm ci
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm ci</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


本地开发：

```bash
npm run docs:dev
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm run docs:dev</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


默认会启动开发服务器，终端会显示本地访问地址，常见是：

```text
localhost:5173
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:5173</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


构建：

```bash
npm run docs:build
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm run docs:build</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


预览构建产物：

```bash
npm run docs:preview
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm run docs:preview</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


三者区别：

| 命令 | 做什么 | 什么时候用 |
|---|---|---|
| `docs:dev` | 启动开发服务器 | 写文档时实时预览 |
| `docs:build` | 构建生产静态站点 | 提交前、CI 中 |
| `docs:preview` | 预览构建产物 | 验证生产构建效果 |

## CLI 字典

### `vitepress dev docs`

| 项 | 内容 |
|---|---|
| 作用 | 启动本地开发服务器 |
| 输入 | source directory `docs` |
| 输出 | 本地预览地址 |
| AIOps 场景 | 写文档时预览导航和页面 |
| 常见坑 | dev 能打开不代表 build 一定通过 |

### `vitepress build docs`

| 项 | 内容 |
|---|---|
| 作用 | 生产构建 |
| 输入 | Markdown、config、资源 |
| 输出 | `docs/.vitepress/dist` |
| AIOps 场景 | 提交前检查文档站能否发布 |
| 常见坑 | dead link、语法、资源路径问题会导致构建失败 |

### `vitepress preview docs`

| 项 | 内容 |
|---|---|
| 作用 | 本地预览生产构建结果 |
| 前提 | 已运行 build |
| AIOps 场景 | 发布前确认静态产物效果 |
| 常见坑 | preview 看的是构建产物，不是源码热更新 |

## 文件路由

VitePress 使用文件路由。

```text
docs/index.md                         -> /
docs/tech-stack/README.md             -> /tech-stack/
docs/tech-stack/foundation/linux.md   -> /tech-stack/foundation/linux
docs/projects/README.md               -> /projects/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docs/index.md                         -&gt; /</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 2 行 | <code>docs/tech-stack/README.md             -&gt; /tech-stack/</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>docs/tech-stack/foundation/linux.md   -&gt; /tech-stack/foundation/linux</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>docs/projects/README.md               -&gt; /projects/</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


理解规则：

| 文件 | 路由 |
|---|---|
| `index.md` | 当前目录根路由 |
| `README.md` | 当前目录根路由 |
| `foo.md` | `/foo` |
| `dir/foo.md` | `/dir/foo` |

本仓库配置里有些 link 写成：

```ts
{ text: '技术栈', link: '/tech-stack/README' }
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{ text: '技术栈', link: '/tech-stack/README' }</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


这能工作，但你也可以统一思考成“链接到技术栈入口页面”。后续如果想优化路由风格，可以逐步整理为目录入口。

## 链接规则

Markdown 中内部链接可以写相对路径：

```markdown
[Linux](./foundation/linux.md)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Linux](./foundation/linux.md)</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


VitePress 配置中的链接通常写站点路径：

```ts
{ text: 'Linux', link: '/tech-stack/foundation/linux' }
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{ text: 'Linux', link: '/tech-stack/foundation/linux' }</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


两者区别：

| 场景 | 写法 |
|---|---|
| Markdown 正文内部链接 | 相对 `.md` 路径更直观 |
| `config.mts` nav/sidebar | 站点路由 |
| 外部资料 | 完整 URL |

排障重点：

- 文件名大小写一致。
- 路径存在。
- 不要把本地示例地址写成裸链接让构建器检查。
- 构建前运行 `npm run docs:build`。

## Site Config

`docs/.vitepress/config.mts` 是站点配置。

最小例子：

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'zero-to-aiops',
  description: 'AIOps learning docs'
})
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import { defineConfig } from 'vitepress'</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 2 行 | <em>空行</em> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 3 行 | <code>export default defineConfig({</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 4 行 | <code>  title: 'zero-to-aiops',</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 5 行 | <code>  description: 'AIOps learning docs'</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 6 行 | <code>})</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


常用顶层字段：

| 字段 | 作用 |
|---|---|
| `title` | 站点标题 |
| `description` | 站点描述 |
| `base` | 部署基础路径 |
| `srcDir` | 源文件目录，少数项目会用 |
| `outDir` | 构建输出目录 |
| `cleanUrls` | 是否使用干净 URL |
| `ignoreDeadLinks` | 是否忽略 dead link 检查 |
| `themeConfig` | 默认主题配置 |
| `markdown` | Markdown 解析配置 |
| `vite` | 传给 Vite 的配置 |

不建议一开始为了“省事”设置 `ignoreDeadLinks: true`。dead link 检查正好能帮助知识库保持质量。

## `base`

`base` 是部署路径的基础前缀。

如果你的 GitHub Pages 地址类似：

```text
https://quweisheng.github.io/zero-to-aiops/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>https://quweisheng.github.io/zero-to-aiops/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


那么 `base` 应该是：

```ts
base: '/zero-to-aiops/'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>base: '/zero-to-aiops/'</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


如果是自定义域名根路径，例如：

```text
https://aiops.example.com/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>https://aiops.example.com/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


则可以是：

```ts
base: '/'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>base: '/'</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


`base` 配错的常见现象：

- 首页能打开，但 CSS/JS 404。
- 页面样式全丢。
- 图片路径不对。
- 刷新子页面 404。

本仓库已经配置：

```ts
base: '/zero-to-aiops/'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>base: '/zero-to-aiops/'</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


这符合项目仓库 Pages 的常见部署路径。

## `themeConfig`

默认主题的主要配置都在 `themeConfig`。

常用：

```ts
themeConfig: {
  nav: [],
  sidebar: [],
  socialLinks: [],
  outline: {},
  search: {},
  footer: {}
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>themeConfig: {</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 2 行 | <code>  nav: [],</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 3 行 | <code>  sidebar: [],</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 4 行 | <code>  socialLinks: [],</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 5 行 | <code>  outline: {},</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 6 行 | <code>  search: {},</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 7 行 | <code>  footer: {}</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 8 行 | <code>}</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


对知识库最重要的是：

- `nav`：顶部导航。
- `sidebar`：侧边栏。
- `outline`：页面右侧目录。
- `search`：搜索。
- `socialLinks`：GitHub 链接。

## Nav

nav 是顶部导航。

```ts
nav: [
  { text: '学习路线', link: '/roadmap/README' },
  { text: '技术栈', link: '/tech-stack/README' },
  { text: '实战项目', link: '/projects/README' }
]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>nav: [</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 2 行 | <code>  { text: '学习路线', link: '/roadmap/README' },</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 3 行 | <code>  { text: '技术栈', link: '/tech-stack/README' },</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 4 行 | <code>  { text: '实战项目', link: '/projects/README' }</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 5 行 | <code>]</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


nav 设计原则：

| 原则 | 说明 |
|---|---|
| 少而清楚 | 顶部只放一级入口 |
| 面向读者 | 让新读者知道先看哪里 |
| 长期稳定 | 不要频繁改入口 |
| 和 README 对齐 | 仓库首页和站点导航互相呼应 |

AIOps 知识库建议 nav：

- 学习路线。
- 技术栈。
- 实战项目。
- 面试。
- 求职记录。

## Sidebar

sidebar 是侧边栏，用于组织大量页面。

本仓库使用数组形式：

```ts
sidebar: [
  {
    text: '基础工具',
    items: [
      { text: 'Linux', link: '/tech-stack/foundation/linux' },
      { text: 'Git', link: '/tech-stack/foundation/git' }
    ]
  }
]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sidebar: [</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 2 行 | <code>  {</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 3 行 | <code>    text: '基础工具',</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 4 行 | <code>    items: [</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 5 行 | <code>      { text: 'Linux', link: '/tech-stack/foundation/linux' },</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 6 行 | <code>      { text: 'Git', link: '/tech-stack/foundation/git' }</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 7 行 | <code>    ]</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 8 行 | <code>  }</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |
| 第 9 行 | <code>]</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


字段解释：

| 字段 | 作用 |
|---|---|
| `text` | 显示文字 |
| `link` | 页面路由 |
| `items` | 子项 |
| `collapsed` | 是否默认折叠 |

侧边栏设计原则：

- 按学习路径排序，不按文件创建时间排序。
- 每组数量不要无限膨胀。
- 总览页放在每组开头或结尾。
- 深讲文档之间保持命名一致。

## Frontmatter

Frontmatter 是页面级配置，写在 Markdown 文件顶部。

```markdown
---
title: Docker 深讲
description: 从零理解 Docker Engine、镜像、容器和 Dockerfile
outline: deep
---

# Docker
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>---</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>title: Docker 深讲</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>description: 从零理解 Docker Engine、镜像、容器和 Dockerfile</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 4 行 | <code>outline: deep</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 5 行 | <code>---</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 7 行 | <code># Docker</code> | Markdown 标题行，用来组织文档层级。 |


常用字段：

| 字段 | 作用 |
|---|---|
| `title` | 页面标题 |
| `description` | 页面描述 |
| `layout` | 页面布局 |
| `outline` | 右侧目录深度 |
| `sidebar` | 是否显示侧边栏 |
| `prev` / `next` | 上一页下一页 |

不是每篇都必须写 Frontmatter。对 SEO、目录控制、特殊页面有需要时再写。

## Markdown Extensions

VitePress 基于 markdown-it，并支持一些扩展。

常见能力：

| 能力 | 作用 |
|---|---|
| Header anchors | 标题自动生成锚点 |
| Links | 内部链接处理 |
| Frontmatter | 页面元数据 |
| Tables | 表格 |
| Emoji | 表情符号 |
| Table of contents | 目录 |
| Custom containers | 提示块 |
| Syntax highlighting | 代码高亮 |
| Line highlighting | 高亮代码行 |
| Import code snippets | 导入代码片段 |

### Custom containers

VitePress 支持容器语法。

```markdown
::: tip
先确认 `/targets` 是 UP，再排查 PromQL。
:::
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>::: tip</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>先确认 `/targets` 是 UP，再排查 PromQL。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>:::</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


常见类型：

```text
tip
warning
danger
details
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>tip</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>warning</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>danger</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>details</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


使用原则：

- 提示块用于真正需要强调的信息。
- 不要把普通正文都塞进提示块。
- 对新手文档，warning/danger 用于风险和破坏性操作。

### Code line highlighting

示例：

````markdown
```yaml{2}
global:
  scrape_interval: 15s
```
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>```yaml{2}</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>global:</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>  scrape_interval: 15s</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 4 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


这里 `{2}` 表示高亮第 2 行。

适合讲配置字段时突出关键行。

### Import code snippets

VitePress 支持从文件导入代码片段。学习初期可以先不使用，等实验代码稳定后再考虑。

它的价值是避免文档中的代码和实际文件不一致。

## 静态资源

VitePress 处理资源有几种方式。

### 相对路径资源

Markdown 附近的图片：

```markdown
![Prometheus targets](./images/prometheus-targets.png)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>![Prometheus targets](./images/prometheus-targets.png)</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


适合和文档强相关的截图。

### public 目录

`docs/public/` 中的文件会被复制到站点根路径。

```text
docs/public/images/logo.png
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docs/public/images/logo.png</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


引用：

```markdown
![Logo](/images/logo.png)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>![Logo](/images/logo.png)</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


注意：如果部署有 `base`，VitePress 会处理站点路径，但你要理解 public 文件最终在站点根路径下。

### 图片排障

图片不显示时看：

- 文件是否存在。
- 大小写是否一致。
- 相对路径是否从当前 Markdown 文件出发。
- 是否被 `.gitignore` 忽略。
- 构建后路径是否带正确 `base`。

## Vue in Markdown

VitePress 允许在 Markdown 中使用 Vue 语法。

例子：

```markdown
{{ 1 + 1 }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{{ 1 + 1 }}</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


会被 Vue 处理。对于普通技术文档，这是双刃剑：

- 好处：可以做交互组件。
- 风险：写普通大括号示例时可能被误解析。

如果你只是写 AIOps 知识库，建议先少用 Vue 语法。需要展示模板语法时，用代码块包住。

## 构建产物

运行：

```bash
npm run docs:build
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm run docs:build</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


默认输出：

```text
docs/.vitepress/dist
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docs/.vitepress/dist</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


dist 目录包含：

```text
index.html
assets/
tech-stack/
projects/
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>index.html</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>assets/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>tech-stack/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>projects/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


构建通过说明：

- Markdown 基本能解析。
- 配置文件能加载。
- 内部链接没有被 dead link 检查拦住。
- 静态站点可以生成。

构建通过不等于内容质量高。内容是否真的能教会小白，还要看文档深度、实验和排障。

## Dead Link 检查

VitePress build 会检查链接。

常见失败：

```text
Found dead link http://localhost:8000/health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Found dead link http://localhost:8000/health</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这种本地实验地址如果只是示例，不要写成裸链接。写成代码：

```text
localhost:8000/health
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>localhost:8000/health</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


内部链接失败时：

- 检查文件是否存在。
- 检查大小写。
- 检查链接是否指向正确路由。
- 检查是否移动文件后没更新链接。

不建议轻易关闭 dead link 检查。它是知识库质量门禁。

## GitHub Pages 部署

VitePress 官方支持多种部署方式。这个仓库最自然的是 GitHub Actions + GitHub Pages。

流程：

```text
push to main
  -> GitHub Actions
  -> npm ci
  -> npm run docs:build
  -> upload docs/.vitepress/dist
  -> deploy to GitHub Pages
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>push to main</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; GitHub Actions</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; npm ci</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; npm run docs:build</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; upload docs/.vitepress/dist</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; deploy to GitHub Pages</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


关键点：

- `base` 要匹配仓库路径。
- Pages source 选择 GitHub Actions。
- workflow 权限要允许 Pages 发布。
- artifact path 要指向 `docs/.vitepress/dist`。

## GitHub Actions Workflow

示例：

```yaml
name: Deploy VitePress site

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run docs:build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Deploy VitePress site</code> | 设置 `name` 字段的值为 `Deploy VitePress site`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  push:</code> | 定义 `push` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    branches: [main]</code> | 设置 `branches` 字段的值为 `[main]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 7 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>  pages: write</code> | 设置 `pages` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>  id-token: write</code> | 设置 `id-token` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 12 行 | <code>concurrency:</code> | 定义 `concurrency` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>  group: pages</code> | 设置 `group` 字段的值为 `pages`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>  cancel-in-progress: false</code> | 设置 `cancel-in-progress` 字段的值为 `false`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 15 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 16 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 19 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 20 行 | <code>      - name: Checkout</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 21 行 | <code>        uses: actions/checkout@v4</code> | 设置 `uses` 字段的值为 `actions/checkout@v4`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 23 行 | <code>      - name: Setup Node</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 24 行 | <code>        uses: actions/setup-node@v4</code> | 设置 `uses` 字段的值为 `actions/setup-node@v4`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 25 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 26 行 | <code>          node-version: 20</code> | 设置 `node-version` 字段的值为 `20`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 27 行 | <code>          cache: npm</code> | 设置 `cache` 字段的值为 `npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 28 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 29 行 | <code>      - name: Install dependencies</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 30 行 | <code>        run: npm ci</code> | 设置 `run` 字段的值为 `npm ci`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 31 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 32 行 | <code>      - name: Build</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 33 行 | <code>        run: npm run docs:build</code> | 设置 `run` 字段的值为 `npm run docs:build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 34 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 35 行 | <code>      - name: Upload artifact</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 36 行 | <code>        uses: actions/upload-pages-artifact@v3</code> | 设置 `uses` 字段的值为 `actions/upload-pages-artifact@v3`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 37 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 38 行 | <code>          path: docs/.vitepress/dist</code> | 设置 `path` 字段的值为 `docs/.vitepress/dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 39 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 40 行 | <code>  deploy:</code> | 定义 `deploy` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 41 行 | <code>    environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 42 行 | <code>      name: github-pages</code> | 设置 `name` 字段的值为 `github-pages`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 43 行 | <code>      url: ${{ steps.deployment.outputs.page_url }}</code> | 设置 `url` 字段的值为 `${{ steps.deployment.outputs.page_url }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 44 行 | <code>    needs: build</code> | 设置 `needs` 字段的值为 `build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 45 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 46 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 47 行 | <code>      - name: Deploy to GitHub Pages</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 48 行 | <code>        id: deployment</code> | 设置 `id` 字段的值为 `deployment`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 49 行 | <code>        uses: actions/deploy-pages@v4</code> | 设置 `uses` 字段的值为 `actions/deploy-pages@v4`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


字段解释：

| 字段 | 含义 |
|---|---|
| `on.push.branches` | main 分支 push 时部署 |
| `permissions.pages` | 允许发布 Pages |
| `setup-node` | 安装 Node |
| `npm ci` | 按 lockfile 安装依赖 |
| `npm run docs:build` | 构建 VitePress |
| `upload-pages-artifact` | 上传静态产物 |
| `deploy-pages` | 发布到 Pages |

## 配置 / 命令字典

### `package.json` scripts

| 项 | 内容 |
|---|---|
| 作用 | 给常用 VitePress 命令起名字 |
| 示例 | `"docs:build": "vitepress build docs"` |
| AIOps 场景 | 本地和 CI 使用同一命令 |
| 常见坑 | 本地命令和 CI 命令不一致，导致结果不同 |

### `defineConfig`

| 项 | 内容 |
|---|---|
| 作用 | 定义 VitePress 配置并获得类型提示 |
| 示例 | `export default defineConfig({ title: '...' })` |
| AIOps 场景 | 管理知识库站点配置 |
| 常见坑 | 配置文件语法错误会导致 build 失败 |

### `title`

| 项 | 内容 |
|---|---|
| 作用 | 站点标题 |
| 示例 | `title: 'To Be Better AIOps Engineer'` |
| AIOps 场景 | 浏览器标题和站点品牌 |
| 常见坑 | 标题太泛，看不出仓库定位 |

### `description`

| 项 | 内容 |
|---|---|
| 作用 | 站点描述 |
| 示例 | `description: 'AIOps 学习路线...'` |
| AIOps 场景 | 说明站点内容 |
| 常见坑 | 只写口号，不写具体方向 |

### `base`

| 项 | 内容 |
|---|---|
| 作用 | 设置部署基础路径 |
| 示例 | `base: '/zero-to-aiops/'` |
| AIOps 场景 | GitHub Pages 项目站点 |
| 常见坑 | base 错导致资源 404、样式丢失 |

### `themeConfig.nav`

| 项 | 内容 |
|---|---|
| 作用 | 顶部导航 |
| 示例 | `{ text: '技术栈', link: '/tech-stack/README' }` |
| AIOps 场景 | 给读者主要入口 |
| 常见坑 | 入口太多，读者不知道先看哪 |

### `themeConfig.sidebar`

| 项 | 内容 |
|---|---|
| 作用 | 侧边栏目录 |
| 示例 | `{ text: 'Linux', link: '/tech-stack/foundation/linux' }` |
| AIOps 场景 | 组织大量技术栈文档 |
| 常见坑 | 新增文档后忘记加入 sidebar |

### Frontmatter `title`

| 项 | 内容 |
|---|---|
| 作用 | 页面级标题 |
| 示例 | `title: Prometheus 精讲` |
| AIOps 场景 | 特定页面 SEO 和展示 |
| 常见坑 | Frontmatter 不在文件顶部会失效 |

### `npm run docs:build`

| 项 | 内容 |
|---|---|
| 作用 | 构建文档站 |
| 输出 | `docs/.vitepress/dist` |
| AIOps 场景 | 提交前质量检查 |
| 常见坑 | dev 能跑但 build 因 dead link 失败 |

### `docs/.vitepress/dist`

| 项 | 内容 |
|---|---|
| 作用 | 静态站点构建产物 |
| 来源 | `vitepress build docs` |
| AIOps 场景 | GitHub Pages 发布内容 |
| 常见坑 | 手动修改 dist，下一次 build 会覆盖 |

## AIOps 知识库导航设计

对 zero-to-aiops 这种知识库，导航应该服务学习路径。

推荐结构：

```text
首页
  -> 学习路线
  -> 技术栈
      -> 基础工具
      -> 可观测性
      -> 云原生
      -> 自动化
      -> 数据与 AI
      -> SRE/AIOps 实践
  -> 实战项目
  -> 面试准备
  -> 求职记录
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>首页</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 学习路线</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; 技术栈</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>      -&gt; 基础工具</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>      -&gt; 可观测性</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>      -&gt; 云原生</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>      -&gt; 自动化</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>      -&gt; 数据与 AI</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>      -&gt; SRE/AIOps 实践</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  -&gt; 实战项目</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>  -&gt; 面试准备</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>  -&gt; 求职记录</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


首页要回答：

- 这个站点是给谁看的？
- 从 0 怎么开始？
- 技术栈在哪里？
- 项目在哪里？
- 学习证据在哪里？

侧边栏要回答：

- 当前属于哪个大类？
- 上一篇和下一篇是什么？
- 总览页在哪里？
- 深讲文档在哪里？

## 入门实验：给知识库新增一页并构建

### 第 1 步：创建页面

```text
docs/tutorials/vitepress-test.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docs/tutorials/vitepress-test.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


内容：

```markdown
# VitePress Test

这是一个测试页面。

```bash
npm run docs:build
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># VitePress Test</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>这是一个测试页面。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 6 行 | <code>npm run docs:build</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |

```

注意：上面示例如果真的写进文档，要用四个反引号包住外层，避免代码块嵌套问题。

### 第 2 步：加入 sidebar

在 `docs/.vitepress/config.mts` 中找到对应分组：

```ts
{
  text: '教程',
  items: [
    { text: '从 0 开始', link: '/tutorials/0001-start-from-zero' },
    { text: 'VitePress Test', link: '/tutorials/vitepress-test' }
  ]
}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 2 行 | <code>注意：上面示例如果真的写进文档，要用四个反引号包住外层，避免代码块嵌套问题。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>### 第 2 步：加入 sidebar</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 6 行 | <code>在 `docs/.vitepress/config.mts` 中找到对应分组：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 8 行 | <code>```ts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>{</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>  text: '教程',</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  items: [</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>    { text: '从 0 开始', link: '/tutorials/0001-start-from-zero' },</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 13 行 | <code>    { text: 'VitePress Test', link: '/tutorials/vitepress-test' }</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>  ]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 15 行 | <code>}</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 第 3 步：本地运行

```bash
npm run docs:dev
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm run docs:dev</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


打开终端显示的本地地址，确认页面出现在侧边栏。

### 第 4 步：构建

```bash
npm run docs:build
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm run docs:build</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


构建通过后，说明页面至少不会破坏文档站。

### 第 5 步：提交

```bash
git add docs/tutorials/vitepress-test.md docs/.vitepress/config.mts
git commit -m "docs: add vitepress test page"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>git add docs/tutorials/vitepress-test.md docs/.vitepress/config.mts</code> | 执行 Git 版本控制命令，用来查看状态、提交、推送或排查仓库问题。 |
| 第 2 行 | <code>git commit -m "docs: add vitepress test page"</code> | 执行 Git 版本控制命令，用来查看状态、提交、推送或排查仓库问题。 |


## 常见故障排查

### `npm run docs:dev` 启动失败

检查：

- 是否运行过 `npm install` 或 `npm ci`。
- Node 版本是否兼容。
- `package.json` scripts 是否存在。
- 当前目录是否是仓库根目录。

### `npm run docs:build` 提示 dead link

处理顺序：

1. 看构建日志指出的文件。
2. 找到具体链接。
3. 判断是内部链接、外部链接还是本地示例地址。
4. 内部链接修路径。
5. 本地示例地址改成代码文本。
6. 再运行 build。

### 页面 404

常见原因：

- 文件路径和路由不一致。
- sidebar link 写错。
- GitHub Pages base 配错。
- 文件名大小写不一致。

检查：

```text
docs/tech-stack/foundation/vitepress.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docs/tech-stack/foundation/vitepress.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


对应 link：

```ts
link: '/tech-stack/foundation/vitepress'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>link: '/tech-stack/foundation/vitepress'</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


### 样式丢失

常见原因：`base` 配错。

GitHub Pages 项目站点：

```ts
base: '/zero-to-aiops/'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>base: '/zero-to-aiops/'</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


自定义域名根路径：

```ts
base: '/'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>base: '/'</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


### 新页面没出现在侧边栏

原因：

- VitePress 文件路由已经有页面，但 sidebar 不会自动收录。
- 你需要在 `themeConfig.sidebar` 加 item。

处理：

```ts
{ text: '新页面', link: '/path/to/page' }
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{ text: '新页面', link: '/path/to/page' }</code> | 代码行，通常是在声明变量、调用函数、定义对象或控制程序流程。 |


### GitHub Pages 没更新

检查：

- Actions 是否成功。
- Pages source 是否选择 GitHub Actions。
- artifact path 是否是 `docs/.vitepress/dist`。
- workflow 是否只在 main 分支触发。
- 浏览器缓存。

### GitHub Pages 打开后资源 404

优先检查：

- `base`。
- workflow artifact path。
- Pages URL 是否是项目站点还是用户站点。

### Markdown 示例破坏页面

如果你在文档中展示三反引号代码块，外层要用四反引号：

`````markdown
````markdown
```bash
npm run docs:build
```
````
`````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>````markdown</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>npm run docs:build</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 4 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 5 行 | <code>````</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


## 典型故障排查表

| 现象 | 常见原因 | 检查方式 | 处理 |
|---|---|---|---|
| dev 启动失败 | 依赖没装、Node 版本不对 | 终端错误 | `npm ci`，检查 Node |
| build 失败 | dead link、配置错误、Markdown 错 | build 日志 | 按文件定位 |
| 页面 404 | 路由或 base 错 | 文件路径、config link | 修 link 或 base |
| 样式丢失 | base 错 | 浏览器 Network | 修 `base` |
| 新页不显示 | 未加入 sidebar | `config.mts` | 添加 sidebar item |
| GitHub Pages 不更新 | Actions 失败或 Pages source 错 | Actions、Settings Pages | 修 workflow |
| 图片不显示 | 路径错或资源没提交 | 文件路径、构建产物 | 修路径并提交 |
| 本地能看 CI 失败 | Node/依赖/大小写差异 | Actions logs | 本地用 `npm ci` 复现 |

## 学习路线

### 第 1 阶段：跑起来

- 理解 `docs` source directory。
- 理解 `package.json` scripts。
- 能运行 `npm run docs:dev`。

学习证据：本地开发服务器截图。

### 第 2 阶段：会配置导航

- 修改 `config.mts`。
- 理解 `title`、`description`、`base`。
- 添加 nav 和 sidebar。

学习证据：新增页面并出现在侧边栏。

### 第 3 阶段：会构建

- 运行 `npm run docs:build`。
- 理解 `dist`。
- 排查 dead link。

学习证据：构建通过记录。

### 第 4 阶段：会部署

- 配置 GitHub Actions。
- 发布 GitHub Pages。
- 理解 `base`。

学习证据：公开文档站 URL。

### 第 5 阶段：会维护知识库

- 按学习路径组织 sidebar。
- 新增文档时同步导航。
- PR 中跑构建。
- 定期检查死链。

学习证据：文档站持续可访问，Actions 持续通过。

## 小白可能会问

### 有 GitHub README 了，为什么还要文档站？

README 是入口，适合介绍仓库。文档站适合承载大量系统化内容，有导航、侧边栏、目录和页面路由。AIOps 技术栈多，靠 README 很快会拥挤。

### VitePress 的路由是怎么从文件变成页面的？

`docs/index.md` 变成首页，`docs/tech-stack/foundation/linux.md` 变成 `/tech-stack/foundation/linux`。文件路径就是页面路径的基础。

### 侧边栏会自动生成吗？

默认主题需要你在 `themeConfig.sidebar` 中配置。文件存在不代表会自动出现在侧边栏。

### 为什么 GitHub Pages 需要 `base`？

项目站点通常部署在 `用户名.github.io/仓库名/` 下面，不是域名根路径。`base` 告诉 VitePress 静态资源应该从哪个路径加载。

### dev 能跑，为什么 build 会失败？

dev 偏开发预览，build 会做生产构建和链接检查。dead link、大小写路径、某些渲染问题可能在 build 时才暴露。

## 面试怎么讲

VitePress 是静态文档站生成器，它把 `docs` 目录里的 Markdown 按文件路由构建成静态网站，并通过 `docs/.vitepress/config.mts` 配置站点标题、base、导航和侧边栏。我的 AIOps 知识库用 VitePress 把技术栈深讲、实验项目、runbook 和面试材料组织成可访问的网站。开发时我用 `npm run docs:dev` 预览，提交前用 `npm run docs:build` 检查，部署时通过 GitHub Actions 把 `docs/.vitepress/dist` 发布到 GitHub Pages。排障时我会重点看 dead link、base、sidebar link、资源路径和 Actions 日志。

## 面试题

1. VitePress 是什么？解决什么问题？
2. VitePress 和普通 Markdown 仓库有什么区别？
3. 静态站点生成的流程是什么？
4. `docs` 目录在本仓库中承担什么角色？
5. `docs/.vitepress/config.mts` 负责什么？
6. `vitepress dev`、`build`、`preview` 有什么区别？
7. VitePress 文件路由如何工作？
8. `README.md` 和 `index.md` 在路由上有什么特点？
9. `themeConfig.nav` 和 `themeConfig.sidebar` 分别是什么？
10. `base` 为什么对 GitHub Pages 很重要？
11. `docs/.vitepress/dist` 是什么？
12. Frontmatter 有什么作用？
13. VitePress Markdown 扩展有哪些常见能力？
14. Custom containers 适合写什么？
15. 为什么 dev 能跑但 build 可能失败？
16. dead link 怎么排查？
17. GitHub Actions 部署 VitePress 的关键步骤是什么？
18. Pages 发布后样式丢失通常是什么原因？
19. 如何设计一个适合 AIOps 知识库的 nav/sidebar？
20. 如何用 VitePress 证明你的学习成果？

## 学习检查清单

- [ ] 我能解释 VitePress 如何把 Markdown 构建成静态站点。
- [ ] 我能解释 source directory、config file、dist 的关系。
- [ ] 我能读懂本仓库的 `package.json` docs scripts。
- [ ] 我能读懂本仓库的 `docs/.vitepress/config.mts`。
- [ ] 我能解释 `base: '/zero-to-aiops/'` 的作用。
- [ ] 我能新增一个 Markdown 页面。
- [ ] 我能把新页面加入 sidebar。
- [ ] 我能运行 `npm run docs:dev`。
- [ ] 我能运行 `npm run docs:build`。
- [ ] 我能解释 VitePress 文件路由。
- [ ] 我能使用 Frontmatter。
- [ ] 我能解释 custom containers、代码高亮、资源路径。
- [ ] 我能写 GitHub Actions workflow 部署 Pages。
- [ ] 我能排查 dead link、404、样式丢失和 Pages 不更新。

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- 一次成功的 `npm run docs:build` 记录。
- 一个新增页面，例如 `docs/tutorials/vitepress-test.md`。
- 对 `docs/.vitepress/config.mts` 的一次导航或侧边栏改动。
- `.github/workflows/deploy-docs.yml`。
- GitHub Pages 成功发布截图。
- 一篇笔记：`VitePress 文件路由和 base 配置.md`。
- 一篇排障记录：`VitePress dead link 和 GitHub Pages 404 怎么查.md`。

如果别人能从 GitHub README 点进你的 VitePress 文档站，沿着导航读完整个 AIOps 学习路线，并且 Actions 每次都能构建通过，这个知识库就具备了真正的作品集形态。
