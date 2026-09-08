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
VitePress v1 docs（第 1 代官方文档）
  ├── Guide（指南）
  │   ├── Getting Started（开始使用）
  │   ├── Routing（路径到页面的映射）
  │   ├── Deploy（部署）
  │   ├── Markdown Extensions（标记语法扩展）
  │   ├── Asset Handling（图片等静态资源处理）
  │   ├── Frontmatter（页面头部元数据）
  │   ├── Using Vue in Markdown（文章内使用 Vue 组件）
  │   └── i18n / sitemap / SSR compatibility（国际化／站点地图／服务端渲染兼容）
  ├── Reference（参考手册）
  │   ├── Site Config（全站配置）
  │   ├── Default Theme Config（默认主题配置）
  │   ├── Frontmatter Config（单页配置）
  │   ├── Runtime API（运行时编程接口）
  │   └── CLI（命令行接口）
  └── Advanced（进阶）
      ├── extending default theme（扩展默认主题）
      ├── build hooks（构建钩子）
      └── custom theme（自定义主题）
```

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

## VitePress 在 AIOps 知识库中的位置

```text
Markdown docs（文档源码）
  ├── Linux（操作系统基础）
  ├── Docker（容器技术）
  ├── Prometheus（指标采集与查询）
  ├── Grafana（可视化仪表盘）
  ├── Runbook（操作手册）
  └── Projects（项目作品）
        |
        v
VitePress（文档构建框架）
  ├── routes（路由）
  ├── nav（顶部导航）
  ├── sidebar（侧栏导航）
  ├── markdown rendering（文档渲染）
  ├── build checks（构建检查）
  └── static output（静态产物）
        |
        v
GitHub Pages（静态站托管）
        |
        v
public AIOps portfolio site（公开运维智能化作品站）
```

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

生成静态文件：

```text
docs/.vitepress/dist/
  index.html
  assets/
  tech-stack/
  projects/
```

这些静态文件可以部署到 GitHub Pages、Vercel、Netlify、Nginx 等静态托管环境。

VitePress 的核心公式：

```text
VitePress = Markdown + Vite + Vue + Default Theme + Static Build
```

## 静态站点生成流程

```text
source directory（源码目录）: docs/
  |
  +--> Markdown pages（文档页面）
  +--> .vitepress/config.mts（站点构建配置）
  +--> public assets（公开静态资源）
        |
        v
vitepress build（构建） docs
        |
        v
static output（静态产物）: docs/.vitepress/dist
        |
        v
deploy to GitHub Pages（部署到静态托管）
```

每一步的含义：

| 步骤 | 说明 |
|---|---|
| source directory | 文档源码根目录，本仓库是 `docs` |
| config file | 站点标题、base、导航、侧边栏等 |
| Markdown pages | 每个 `.md` 文件通常对应一个页面 |
| build | 把源码转换成静态站点 |
| dist | 构建产物 |
| deploy | 把 dist 发布到静态托管 |

## 历史架构示例：不要覆盖当前仓库配置

以下是本仓库早期 VitePress 架构的教学示例，不是当前 React 网站的配置。请在独立的 VitePress 练习项目使用；当前仓库运行 `npm run dev`、`npm run build` 和 `npm run preview`。文中后续“本仓库配置”均指这一历史示例，不是要求恢复旧架构。

VitePress 练习项目的 `package.json`：

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

如果已有 `package-lock.json`，CI 和复现环境更推荐：

```bash
npm ci
```

本地开发：

```bash
npm run docs:dev
```

默认会启动开发服务器，终端会显示本地访问地址，常见是：

```text
localhost:5173
```

构建：

```bash
npm run docs:build
```

预览构建产物：

```bash
npm run docs:preview
```

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
docs/index.md                         -> /index.html（通常可通过 / 访问）
docs/tech-stack/index.md              -> /tech-stack/index.html（索引文档到网页路径的映射）
docs/tech-stack/README.md             -> /tech-stack/README.html（项目说明文件按自身文件名生成网页）
docs/tech-stack/foundation/linux.md   -> /tech-stack/foundation/linux.html（保留目录层次生成网页）
```

理解规则：

| 文件 | 路由 |
|---|---|
| `index.md` | 当前目录根路由 |
| `README.md` | 默认生成 `README.html`，不会自动等同于 `index.md` |
| `foo.md` | `/foo.html`；省略扩展名需结合 `cleanUrls` 和托管支持 |
| `dir/foo.md` | `/dir/foo.html` |

本仓库配置里有些 link 写成：

```ts
{ text: '技术栈', link: '/tech-stack/README' }
```

它指向 `README` 页面。要做目录入口，应使用 `index.md` 或明确配置路由重写，并同步旧链接；不能只把链接末尾删除就假定生成了目录首页。[VitePress v1 路由规则](https://vuejs.github.io/vitepress/v1/guide/routing)

## 链接规则

Markdown 中内部链接可以写相对路径：

```markdown
[Linux](./foundation/linux.md)
```

VitePress 配置中的链接通常写站点路径：

```ts
{ text: 'Linux', link: '/tech-stack/foundation/linux' }
```

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

那么 `base` 应该是：

```ts
base: '/zero-to-aiops/'
```

如果是自定义域名根路径，例如：

```text
https://aiops.example.com/
```

则可以是：

```ts
base: '/'
```

`base` 配错的常见现象：

- 首页能打开，但 CSS/JS 404。
- 页面样式全丢。
- 图片路径不对。
- 刷新子页面 404。

本仓库已经配置：

```ts
base: '/zero-to-aiops/'
```

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

常见类型：

```text
tip
warning
danger
details
```

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

适合和文档强相关的截图。

### public 目录

`docs/public/` 中的文件会被复制到站点根路径。

```text
docs/public/images/logo.png
```

引用：

```markdown
![Logo](/images/logo.png)
```

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

会被 Vue 处理。对于普通技术文档，这是双刃剑：

- 好处：可以做交互组件。
- 风险：写普通大括号示例时可能被误解析。

如果你只是写 AIOps 知识库，建议先少用 Vue 语法。需要展示模板语法时，用代码块包住。

## 构建产物

运行：

```bash
npm run docs:build
```

默认输出：

```text
docs/.vitepress/dist
```

dist 目录包含：

```text
index.html
assets/
tech-stack/
projects/
```

构建通过说明：

- Markdown 基本能解析。
- 配置文件能加载。
- 内部链接没有被 dead link 检查拦住。
- 静态站点可以生成。

构建通过不等于内容质量高。内容是否真的能教会小白，还要看文档深度、实验和排障。

## Dead Link 检查

VitePress build 会检查链接。

例如内部页面链接拼错时可出现类似失败：

```text
Found dead link ./missing-page
```

VitePress 的内部死链检查不是全网 URL 可达性监控，不应声称它必然请求每个外部地址。实验里的本地地址只对读者自己有意义，仍建议写成代码文本，避免误点击：

```text
localhost:8000/health
```

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
push to main（推送到主分支）
  -> GitHub Actions（自动化工作流）
  -> npm ci（按依赖锁文件安装）
  -> npm run docs:build（构建）
  -> upload docs/.vitepress/dist（上传该文档框架的构建目录）
  -> deploy to GitHub Pages（部署到静态托管）
```

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

内容：

````markdown
# VitePress Test

这是一个测试页面。

```bash
npm run docs:build
```

````

外层用四个反引号，里面的三个反引号才能完整作为示例显示。

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

### 第 3 步：本地运行

```bash
npm run docs:dev
```

打开终端显示的本地地址，确认页面出现在侧边栏。

### 第 4 步：构建

```bash
npm run docs:build
```

构建通过后，说明页面至少不会破坏文档站。

### 第 5 步：提交

```bash
git add docs/tutorials/vitepress-test.md docs/.vitepress/config.mts
git commit -m "docs: add vitepress test page"
```

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

对应 link：

```ts
link: '/tech-stack/foundation/vitepress'
```

### 样式丢失

常见原因：`base` 配错。

GitHub Pages 项目站点：

```ts
base: '/zero-to-aiops/'
```

自定义域名根路径：

```ts
base: '/'
```

### 新页面没出现在侧边栏

原因：

- VitePress 文件路由已经有页面，但 sidebar 不会自动收录。
- 你需要在 `themeConfig.sidebar` 加 item。

处理：

```ts
{ text: '新页面', link: '/path/to/page' }
```

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

## 老师带你追踪一页故障手册的完整生命期

设想值班人员从告警链接打开“支付超时排查”文章。阅读请求不需要在服务器上实时把 Markdown 转成 HTML：VitePress 已在构建时完成主要生成工作，托管服务把文件送给浏览器，浏览器再接管导航、搜索等交互。这就是 SSG（Static Site Generation，静态站点生成）与每次请求都计算页面的差别。静态不等于页面不能交互，而是主体内容预先生成。

图中的 `source directory` 是源码目录，`routes` 是页面路由，`nav` 是顶部导航，`sidebar` 是侧栏，`static output` 是生成文件，`artifact` 是本次构建保存的产物，`deploy` 是把产物发布出去。Vite 负责开发与构建，Vue 负责组件与交互，Default Theme（默认主题）提供阅读布局。先把每一项当成一个明确职责，不要把“Vite、Vue、VitePress”看作三个可以任意互换的名字。

### 三张地图：文件、浏览器地址、资源地址

文件路径 `docs/guide/check.md` 是作者的地址，页面 URL `/guide/check.html` 是读者的地址，资源 URL `/training/assets/xxx.js` 是浏览器取脚本的地址。`base: '/training/'` 表示站点挂在一个子路径；它不负责创建页面，也不代表磁盘必须有一个名叫 `training` 的源码目录。排障时把浏览器 Network（网络）中失败的完整 URL 抄出来，和部署前缀、生成目录逐一对齐，往往比重装依赖更直接。

`cleanUrls` 表示生成链接时省略 `.html`，但真正访问还需要托管服务能把无扩展名 URL 映射到对应文件。开发服务器帮你处理的路径，不代表任意静态服务器都能处理。验收要同时测试首页点击进去和直接在地址栏刷新子页面；前者可能走客户端导航，后者会直接访问服务器。

### 独立基础实验与死链故障注入

前提：已安装与所选 VitePress v1 兼容的 Node.js/npm，能访问依赖源，有一个空的个人实验目录。先用 `node --version`、`npm --version` 记录版本；本课固定 `vitepress@1.6.4` 复现历史机制，不宣称它是当前推荐最新生产版本。不要在本知识库根目录执行安装。

在新目录 `vitepress-classroom` 中执行：

```bash
npm init -y
npm install -D vitepress@1.6.4
```

用编辑器建立 `docs/index.md`，内容如下：

```markdown
# 值班手册

[进入支付排查](./payment)
```

再建 `docs/payment.md`：

```markdown
# 支付排查

先核对告警时间范围，再检查对应请求的日志。

## 成功标准

能从首页进入本页，并在直接刷新后仍读到本段。
```

执行 `npx vitepress build docs`，预期退出码为 0，生成 `docs/.vitepress/dist/index.html` 和 `payment.html`。再执行 `npx vitepress preview docs`，打开终端给出的地址，按“首页 → 支付排查 → 刷新”顺序验证。`npx` 在此应使用刚安装的本地工具；看到临时安装其他版本的提示先停止，检查当前目录。

现在注入唯一故障：把首页的 `./payment` 改成 `./payment-missing`，重新构建。预期构建指出内部链接目标不存在并失败。记录失败文件、链接和退出码，恢复 `./payment` 后再构建成功。不要用 `ignoreDeadLinks: true` 掩盖本来可以修复的链接。

清理：按 Ctrl+C 停止预览；若要保留练习，只保留源码、`package.json`、锁文件和记录，不提交 `node_modules` 或生成目录。若不再需要，先确认实验目录绝对路径及内容只属于本实验，再由文件管理器删除该独立目录。排障回路：命令不存在查安装与工作目录；链接没有报错查文件是否已保存、是否真的重新构建；修复后预览仍旧查是否重建以及访问端口是否属于这次实验。

### 生产设计题：十万篇文档不只是“多放几个文件”

先计算构建时间、产物大小、搜索索引大小、图片带宽，再决定是否分站、分版本或使用外部检索。把所有内容和搜索数据一次性发送给浏览器，会增加首次加载和移动端内存压力；用实际网络瀑布和性能测量做取舍，不凭“静态站点很快”下结论。可观测性至少覆盖构建失败率、部署耗时、页面可用性、关键链接 404 和搜索可用性。

发布应把 HTML、资源与搜索索引作为同一版本验证。若 HTML 已切换而它引用的脚本还不可用，页面就会短暂失败；部署策略应避免暴露半套产物，缓存策略也要考虑旧 HTML 是否仍引用旧资源。回滚时使用已验证的完整产物，不只把某一篇 Markdown 恢复。对内部 runbook，还应把访问控制放在托管层，静态文件本身不会因为文章写了“内部”就限制外部读取。

SSR（Server-Side Rendering，服务端渲染）兼容问题常在构建时出现。例如组件顶层直接读取 `window`，构建环境没有浏览器窗口就可能报错；依赖浏览器的操作应放到合适的客户端生命周期，必要时使用官方提供的客户端专用边界。这里是执行环境不一致，不是“文章中文太多”。[VitePress v1 SSR 兼容](https://vuejs.github.io/vitepress/v1/guide/ssr-compat)

### 面试递进：从“我会部署”到“我能解释故障”

30 秒：VitePress 用 Markdown、Vue 和 Vite 在构建时生成文档站，我能区分源码路径、页面路由与部署前缀，能验证构建、发布和实际页面。

3 分钟：先讲一篇文章从源码到静态产物的过程，再讲导航与路由不是一回事、构建与预览不是一回事，最后用死链实验解释如何收集证据和修复。追问“首页正常但子页刷新 404”，沿着 URL、文件是否存在、`cleanUrls` 与托管映射查；追问“本地正常 CI 失败”，检查 Node/锁文件、大小写、环境变量和浏览器专用代码；追问“如何迁移站点工具”，回答保持或重定向旧 URL、迁移导航和搜索、核对语法扩展、双环境验收和回滚，不要只更换 `package.json`。

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
