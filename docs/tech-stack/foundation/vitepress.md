# VitePress

> 目标：能把 Markdown 学习笔记构建成文档站，并用 GitHub Actions 发布到 GitHub Pages。

## 官方资料

- [VitePress Getting Started](https://vitepress.dev/guide/getting-started)
- [VitePress Routing](https://vitepress.dev/guide/routing)
- [VitePress Markdown Extensions](https://vitepress.dev/guide/markdown)
- [VitePress Site Config](https://vitepress.dev/reference/site-config)
- [VitePress Deploy](https://vitepress.dev/guide/deploy)

说明：本文是基于 VitePress 官方文档整理的原创中文教程，不复制官方全文。

## 为什么要学

GitHub 仓库能保存学习记录，但文档站能让别人更舒服地阅读你的学习路线、技术栈和项目。VitePress 可以把 Markdown 变成网站，让你的 AIOps 学习过程像一本在线教程一样展示出来。

对转岗求职来说，VitePress 的价值是把零散笔记整理成可访问、可导航、可搜索的作品集入口。

## 是什么

VitePress 是静态文档站生成器。它读取 Markdown 文件，生成静态 HTML、CSS、JS，适合做技术知识库、项目文档和学习记录站。

## 它解决什么问题

- 把 Markdown 目录变成可浏览的网站。
- 提供导航栏、侧边栏、路由和主题。
- 支持 GitHub Pages 静态部署。
- 让学习笔记从“仓库文件”升级为“公开知识库”。
- 让面试官能快速按路线阅读你的内容。

## 核心原理

VitePress 使用文件路由。`docs/index.md` 会变成首页，`docs/tech-stack/linux.md` 会变成对应页面。

```text
docs/*.md
  -> VitePress
  -> docs/.vitepress/dist
  -> static site
  -> GitHub Pages
```

## 项目结构

```text
docs/
  index.md
  tech-stack/
  .vitepress/
    config.mts
package.json
```

## 安装

```bash
npm install -D vitepress
```

`package.json`：

```json
{
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

## 本地运行

```bash
npm install
npm run docs:dev
```

构建：

```bash
npm run docs:build
```

预览：

```bash
npm run docs:preview
```

## 配置文件

`docs/.vitepress/config.mts`：

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'To Be Better AIOps Engineer',
  description: 'AIOps 学习记录',
  themeConfig: {
    nav: [
      { text: '技术栈', link: '/tech-stack/README' }
    ],
    sidebar: [
      {
        text: '技术栈',
        items: [
          { text: '总清单', link: '/tech-stack/README' }
        ]
      }
    ]
  }
})
```

## 路由规则

```text
docs/index.md                  -> /
docs/tech-stack/README.md      -> /tech-stack/README
docs/tech-stack/linux.md       -> /tech-stack/linux
```

## 在 AIOps 中的作用

- 把学习过程变成可分享网站。
- 让技术栈教程有导航。
- 让项目、runbook、面试记录集中展示。
- 通过 GitHub Pages 形成公开作品集。

## GitHub Pages 发布

基本 workflow：

```yaml
name: Deploy VitePress site

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run docs:build
```

## 排障清单

### 构建失败提示 dead link

- 检查相对链接。
- VitePress 中目录链接尽量写具体文件。
- 本地先运行 `npm run docs:build`。

### 中文乱码

- 文件保存为 UTF-8。
- 不要混用奇怪编码。

### GitHub Pages 没更新

- 查看 Actions 是否成功。
- Settings -> Pages 是否选择 GitHub Actions。
- workflow artifact 路径是否是 `docs/.vitepress/dist`。

## 学习检查清单

- [ ] 我能解释 VitePress 如何把 Markdown 构建成静态站点。
- [ ] 我能配置 `package.json` 的 docs scripts。
- [ ] 我能修改 `docs/.vitepress/config.mts`。
- [ ] 我能理解文件路由和链接规则。
- [ ] 我能本地运行 `npm run docs:dev`。
- [ ] 我能运行 `npm run docs:build` 并理解构建产物路径。
- [ ] 我能用 GitHub Actions 发布到 GitHub Pages。
- [ ] 我能排查 dead link、Pages source、artifact path 问题。

## 面试题

1. VitePress 是什么？和普通 Markdown 仓库有什么区别？
2. 静态站点生成器的基本流程是什么？
3. `docs/index.md` 和 `docs/.vitepress/config.mts` 分别负责什么？
4. VitePress 文件路由如何工作？
5. 为什么 GitHub Pages 部署需要正确设置 `base`？
6. `npm run docs:build` 生成的产物在哪里？
7. GitHub Actions 发布 VitePress 需要哪些权限？
8. 构建失败提示 dead link 时怎么排查？
9. 为什么文档站适合作为 AIOps 作品集入口？
10. 如何设计一个适合长期维护的技术知识库导航？

## 学习证据

- 本地 `npm run docs:build` 成功。
- GitHub Pages 成功发布。
- README 链接到文档站。
