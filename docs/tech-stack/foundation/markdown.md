# Markdown

> 目标：能用 Markdown 写清楚学习笔记、README、runbook、事故复盘、配置说明、面试故事和 VitePress 文档，理解 CommonMark、GitHub Flavored Markdown、块级语法、行内语法、链接、图片、表格、任务列表、代码块、转义和渲染排障。

## 官方资料

- [CommonMark](https://commonmark.org/)
- [CommonMark Spec](https://spec.commonmark.org/current/)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [GitHub Basic writing and formatting syntax](https://docs.github.com/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [GitHub Working with advanced formatting](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting)
- [Markdown Guide: Basic Syntax](https://www.markdownguide.org/basic-syntax/)
- [Markdown Guide: Extended Syntax](https://www.markdownguide.org/extended-syntax/)

说明：本文基于 CommonMark、GitHub Flavored Markdown、GitHub Docs 和 Markdown Guide 整理成原创中文教程，不复制官方全文。CommonMark 负责定义基础 Markdown 语法，GitHub Flavored Markdown 负责解释 GitHub 上常用扩展，本文负责把它们转成 AIOps 知识库写作方法。

## 场景开场

“这次故障我明明处理过，但让我复盘时，只剩下一堆聊天记录和几张截图。”

运维经验如果不写下来，很容易散掉。更麻烦的是：你以为自己写了笔记，别人打开却发现：

- 标题层级乱。
- 命令和输出混在一起。
- 表格渲染坏了。
- 相对链接点不开。
- 代码块把后面的正文吞掉。
- README 只有口号，没有运行方式。
- runbook 没写风险和回滚。

Markdown 的价值不是“排版好看”，而是用普通文本把工程知识写成结构化、可版本管理、可审查、可发布的网站内容。

对 AIOps 知识库来说，Markdown 是基础设施。Prometheus 配置怎么写、Docker Compose 实验怎么跑、事故怎么复盘、面试故事怎么讲，都要先能用 Markdown 说清楚。

## 一句话人话版

Markdown 是工程知识库的纯文本写作格式：用简单符号表达标题、段落、列表、链接、图片、代码块、表格和任务列表，既适合人读，也适合 Git 管理和网站渲染。

## 学习边界

这一篇重点讲：

- Markdown 和 HTML 的关系。
- CommonMark 的块级语法和行内语法。
- GitHub Flavored Markdown 的表格、任务列表、删除线、自动链接等扩展。
- README、runbook、事故复盘、技术教程的结构。
- VitePress 文档中的相对链接、代码块、Frontmatter 和排障。
- AIOps 知识库写作规范。

不在这一篇深入讲：

- HTML 和 CSS 全量知识。
- VitePress 配置系统细节。
- MDX、Mermaid、数学公式等扩展生态。

这些后面可以单独展开。这里先把 Markdown 本身学扎实。

## 官方知识地图

Markdown 没有一个单一“官方公司”。它有事实标准和平台扩展。学习时可以按这张图理解：

```text
Markdown
  ├── CommonMark
  │   ├── Preliminaries: characters, lines, tabs, spaces
  │   ├── Blocks
  │   │   ├── paragraphs
  │   │   ├── headings
  │   │   ├── thematic breaks
  │   │   ├── block quotes
  │   │   ├── lists
  │   │   ├── code blocks
  │   │   └── HTML blocks
  │   ├── Inlines
  │   │   ├── code spans
  │   │   ├── emphasis
  │   │   ├── links
  │   │   ├── images
  │   │   ├── autolinks
  │   │   ├── raw HTML
  │   │   └── hard / soft line breaks
  │   └── appendices
  ├── GitHub Flavored Markdown
  │   ├── tables
  │   ├── task list items
  │   ├── strikethrough
  │   ├── autolinks
  │   └── disallowed raw HTML handling
  ├── GitHub writing syntax
  │   ├── mentions
  │   ├── issue and PR references
  │   ├── alerts
  │   ├── relative links
  │   └── task lists
  └── Static site generators
      ├── VitePress
      ├── frontmatter
      ├── sidebar
      ├── markdown-it plugins
      └── build-time link checks
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Markdown</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ├── CommonMark</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>  │   ├── Preliminaries: characters, lines, tabs, spaces</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>  │   ├── Blocks</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 5 行 | <code>  │   │   ├── paragraphs</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>  │   │   ├── headings</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>  │   │   ├── thematic breaks</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 8 行 | <code>  │   │   ├── block quotes</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 9 行 | <code>  │   │   ├── lists</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 10 行 | <code>  │   │   ├── code blocks</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 11 行 | <code>  │   │   └── HTML blocks</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 12 行 | <code>  │   ├── Inlines</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 13 行 | <code>  │   │   ├── code spans</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 14 行 | <code>  │   │   ├── emphasis</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 15 行 | <code>  │   │   ├── links</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 16 行 | <code>  │   │   ├── images</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 17 行 | <code>  │   │   ├── autolinks</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 18 行 | <code>  │   │   ├── raw HTML</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 19 行 | <code>  │   │   └── hard / soft line breaks</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 20 行 | <code>  │   └── appendices</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 21 行 | <code>  ├── GitHub Flavored Markdown</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 22 行 | <code>  │   ├── tables</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 23 行 | <code>  │   ├── task list items</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 24 行 | <code>  │   ├── strikethrough</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 25 行 | <code>  │   ├── autolinks</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 26 行 | <code>  │   └── disallowed raw HTML handling</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 27 行 | <code>  ├── GitHub writing syntax</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 28 行 | <code>  │   ├── mentions</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 29 行 | <code>  │   ├── issue and PR references</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 30 行 | <code>  │   ├── alerts</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 31 行 | <code>  │   ├── relative links</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 32 行 | <code>  │   └── task lists</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 33 行 | <code>  └── Static site generators</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 34 行 | <code>      ├── VitePress</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 35 行 | <code>      ├── frontmatter</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 36 行 | <code>      ├── sidebar</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 37 行 | <code>      ├── markdown-it plugins</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 38 行 | <code>      └── build-time link checks</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |


本篇把这些资料拆成三层：

1. CommonMark：Markdown 的基础语法。
2. GFM：GitHub 上最常用的扩展。
3. AIOps 文档写作：把语法用于 README、runbook、复盘和知识库。

## Markdown 在 AIOps 知识库中的位置

```text
operations experience
  ├── commands
  ├── configs
  ├── screenshots
  ├── incidents
  ├── runbooks
  └── labs
        |
        v
Markdown files
        |
        +--> GitHub README
        +--> VitePress docs site
        +--> Pull Request review
        +--> interview portfolio
        +--> future runbook automation
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>operations experience</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  ├── commands</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 3 行 | <code>  ├── configs</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 4 行 | <code>  ├── screenshots</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 5 行 | <code>  ├── incidents</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 6 行 | <code>  ├── runbooks</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 7 行 | <code>  └── labs</code> | 树形结构行，表示文件、组件或知识点之间的层级关系。 |
| 第 8 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>        v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>Markdown files</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>        &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>        +--&gt; GitHub README</code> | 这一行要理解这些英文词：`GitHub README` 是github=代码托管平台。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>        +--&gt; VitePress docs site</code> | 这一行要理解这些英文词：`VitePress docs site` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>        +--&gt; Pull Request review</code> | 这一行要理解这些英文词：`Pull Request review` 是review=复盘或评审。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>        +--&gt; interview portfolio</code> | 这一行要理解这些英文词：`interview portfolio` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>        +--&gt; future runbook automation</code> | 这一行要理解这些英文词：`future runbook automation` 是runbook=故障处理手册，automation=自动化。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


Markdown 是 AIOps 知识库的承载格式：

| 内容 | Markdown 形式 |
|---|---|
| 技术栈教程 | `docs/tech-stack/.../*.md` |
| 项目说明 | `README.md` |
| 实验步骤 | `labs/.../README.md` |
| Runbook | `docs/runbooks/*.md` |
| 事故复盘 | `docs/incidents/*.md` |
| 面试故事 | `docs/interview/*.md` |
| 学习记录 | `docs/learning-records/*.md` |

## Markdown 是什么

Markdown 是轻量标记语言。它用纯文本符号表达文档结构，再由解析器转换成 HTML。

```text
Markdown text
  -> parser
  -> HTML
  -> GitHub / VitePress / browser
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Markdown text</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; parser</code> | 这一行要理解这些英文词：`parser` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; HTML</code> | 这一行要理解这些英文词：`HTML` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; GitHub / VitePress / browser</code> | 这一行要理解这些英文词：`GitHub` 是代码托管平台；`VitePress` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`browser` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


例子：

````markdown
# Prometheus

Prometheus 用于采集和查询指标。

- 指标采集
- PromQL
- 告警规则

```bash
prometheus --config.file=prometheus.yml
```
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># Prometheus</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>Prometheus 用于采集和查询指标。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>- 指标采集</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 6 行 | <code>- PromQL</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 7 行 | <code>- 告警规则</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 9 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 10 行 | <code>prometheus --config.file=prometheus.yml</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 11 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


渲染后会变成：

- 一级标题。
- 段落。
- 列表。
- 代码块。

它的关键优势不是功能多，而是：

- 纯文本，适合 Git diff。
- 语法少，学习成本低。
- 平台支持广，GitHub 和 VitePress 都能渲染。
- 可以和代码、配置、命令放在同一个仓库。

## Markdown 和 Word 的区别

| 对比 | Markdown | Word |
|---|---|---|
| 文件形式 | 纯文本 | 二进制或复杂文档格式 |
| Git diff | 清楚看到每行变化 | 不适合逐行 review |
| 代码块 | 天然支持 | 容易格式乱 |
| 自动构建网站 | 很适合 | 通常需要转换 |
| 协作 review | 适合 PR | 不适合代码仓库流程 |
| 排版能力 | 简洁有限 | 排版能力强 |

Markdown 适合工程知识库，不是因为它比 Word “高级”，而是因为它更适合版本控制、自动化构建和技术内容维护。

## 解析模型

Markdown 解析大致分两类：

```text
block parsing
  -> headings
  -> paragraphs
  -> lists
  -> block quotes
  -> code blocks
  -> tables

inline parsing
  -> emphasis
  -> links
  -> images
  -> code spans
  -> escapes
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>block parsing</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; headings</code> | 这一行要理解这些英文词：`headings` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; paragraphs</code> | 这一行要理解这些英文词：`paragraphs` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; lists</code> | 这一行要理解这些英文词：`lists` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; block quotes</code> | 这一行要理解这些英文词：`block quotes` 是block=配置块。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; code blocks</code> | 这一行要理解这些英文词：`code blocks` 是blocks=配置块。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; tables</code> | 这一行要理解这些英文词：`tables` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 9 行 | <code>inline parsing</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 10 行 | <code>  -&gt; emphasis</code> | 这一行要理解这些英文词：`emphasis` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; links</code> | 这一行要理解这些英文词：`links` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; images</code> | 这一行要理解这些英文词：`images` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  -&gt; code spans</code> | 这一行要理解这些英文词：`code spans` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>  -&gt; escapes</code> | 这一行要理解这些英文词：`escapes` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


也就是说，Markdown 先识别“这一块是什么”，再识别块里面的行内元素。

例子：

````markdown
## 排障步骤

执行 `docker compose ps` 查看服务状态。
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>## 排障步骤</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>执行 `docker compose ps` 查看服务状态。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


块级结构：

- `## 排障步骤` 是 heading。
- 空行后是 paragraph。

行内结构：

- `` `docker compose ps` `` 是 inline code。

理解这个模型后，很多渲染问题就好查了：表格坏了通常是块级结构没写对，链接坏了通常是行内语法或路径问题，代码块吞正文通常是 fenced code block 没闭合。

## 空行和段落

Markdown 中，段落通常由空行分隔。

正确：

````markdown
第一段：描述故障现象。

第二段：描述排查结论。
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>第一段：描述故障现象。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>第二段：描述排查结论。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


不清晰：

````markdown
第一段：描述故障现象。
第二段：描述排查结论。
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>第一段：描述故障现象。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>第二段：描述排查结论。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


在很多渲染器里，这会被当成同一个段落，中间只是软换行。

AIOps 文档建议：

- 每段只讲一个意思。
- 段落之间留空行。
- 命令、输出、结论分开写。

## 标题

标题用于组织层级。

语法：

````markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># 一级标题</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <code>## 二级标题</code> | Markdown 标题行，用来组织文档层级。 |
| 第 3 行 | <code>### 三级标题</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <code>#### 四级标题</code> | Markdown 标题行，用来组织文档层级。 |


规则：

| 规则 | 原因 |
|---|---|
| 一个文档通常只有一个 `#` | 表示文档主题 |
| 不要跳级 | 从 `##` 直接到 `####` 会破坏结构 |
| 标题后加空格 | `## 标题` 比 `##标题` 更兼容 |
| 标题要具体 | `## 排障` 比 `## 其他` 更可读 |

坏例子：

````markdown
# Docker
### 镜像
## 容器
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># Docker</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <code>### 镜像</code> | Markdown 标题行，用来组织文档层级。 |
| 第 3 行 | <code>## 容器</code> | Markdown 标题行，用来组织文档层级。 |


好例子：

````markdown
# Docker

## 核心概念

### 镜像

### 容器
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># Docker</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>## 核心概念</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>### 镜像</code> | Markdown 标题行，用来组织文档层级。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 7 行 | <code>### 容器</code> | Markdown 标题行，用来组织文档层级。 |


VitePress 会根据标题生成页面锚点和右侧目录。标题层级乱，目录也会乱。

## 段落和换行

Markdown 中普通换行不一定表示新段落。

````markdown
第一行
第二行
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>第一行</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>第二行</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


很多渲染器会显示成同一个段落中的软换行。

如果要新段落，用空行：

````markdown
第一段。

第二段。
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>第一段。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>第二段。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


如果确实要硬换行，可以使用两个空格加换行，或 HTML `<br>`。但工程文档里建议少用硬换行，优先用列表或新段落组织。

## 强调和加粗

语法：

````markdown
这是 *强调*。
这是 **加粗**。
这是 ***加粗并强调***。
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>这是 *强调*。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>这是 **加粗**。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>这是 ***加粗并强调***。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


AIOps 文档中，加粗适合用于：

- 关键结论。
- 风险提示。
- 字段名第一次解释。

不要整段加粗。整段都强调，等于没有重点。

## 行内代码

行内代码用于命令、路径、字段名、文件名、配置键。

````markdown
执行 `docker compose ps` 查看服务状态。
配置文件是 `prometheus.yml`。
字段 `scrape_interval` 表示抓取间隔。
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>执行 `docker compose ps` 查看服务状态。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>配置文件是 `prometheus.yml`。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>字段 `scrape_interval` 表示抓取间隔。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


适合加行内代码的内容：

| 类型 | 示例 |
|---|---|
| 命令 | `git status` |
| 文件 | `README.md` |
| 路径 | `docs/tech-stack/` |
| 配置字段 | `scrape_interval` |
| 环境变量 | `PATH` |
| 指标名 | `http_requests_total` |

如果行内代码本身包含反引号，可以用更多反引号包住。

````markdown
``Use `code` inside.``
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>``Use `code` inside.``</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


## 代码块

代码块用于命令、配置、代码、输出。

基础写法：

`````markdown
```bash
docker compose ps
```
`````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>docker compose ps</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


渲染出来是：

```bash
docker compose ps
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose ps</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |


代码块建议写语言：

| 内容 | 语言标记 |
|---|---|
| Shell 命令 | `bash` |
| PowerShell | `powershell` |
| YAML | `yaml` |
| JSON | `json` |
| Python | `python` |
| 普通文本输出 | `text` |
| Markdown 示例 | `markdown` |

为什么要标语言：

- 代码高亮更清晰。
- 读者知道这段是什么。
- 文档站构建器能选择合适高亮规则。

如果你在 Markdown 文档中讲“如何写代码块”，要用四个或更多反引号包住外层，避免内层三个反引号提前结束。

`````markdown
````markdown
```bash
git status
```
````
`````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>````markdown</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>git status</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 4 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 5 行 | <code>````</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


## 命令和输出要分开

坏例子：

````markdown
执行 docker ps 看到 CONTAINER ID IMAGE STATUS...
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>执行 docker ps 看到 CONTAINER ID IMAGE STATUS...</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


好例子：

`````markdown
运行命令：

```bash
docker ps
```

预期输出包含：

```text
CONTAINER ID   IMAGE     STATUS
```
`````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>运行命令：</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 4 行 | <code>docker ps</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 5 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 7 行 | <code>预期输出包含：</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 9 行 | <code>```text</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 10 行 | <code>CONTAINER ID   IMAGE     STATUS</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 11 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


为什么要分开：

- 读者知道哪些要复制执行。
- 输出不会被误当命令。
- 后续排障能对照预期。

## 列表

无序列表：

````markdown
- Prometheus
- Grafana
- Docker Compose
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- Prometheus</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 2 行 | <code>- Grafana</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 3 行 | <code>- Docker Compose</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |


有序列表：

````markdown
1. 启动 Prometheus。
2. 打开 `/targets`。
3. 确认 target 是 UP。
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>1. 启动 Prometheus。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>2. 打开 `/targets`。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>3. 确认 target 是 UP。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


建议：

- 步骤用有序列表。
- 并列概念用无序列表。
- 每一项尽量语法结构一致。

嵌套列表要缩进：

````markdown
1. 检查 Prometheus。
   - 打开 `/targets`。
   - 查看 Last Error。
2. 检查 Grafana。
   - 打开 data source。
   - 点击 Save & test。
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>1. 检查 Prometheus。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>   - 打开 `/targets`。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 3 行 | <code>   - 查看 Last Error。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 4 行 | <code>2. 检查 Grafana。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 5 行 | <code>   - 打开 data source。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 6 行 | <code>   - 点击 Save &amp; test。</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |


嵌套太深会影响可读性。超过两层时，考虑拆成小标题。

## 引用

引用使用 `>`。

````markdown
> 注意：`docker compose down -v` 会删除命名卷，Grafana 数据可能丢失。
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>&gt; 注意：`docker compose down -v` 会删除命名卷，Grafana 数据可能丢失。</code> | Markdown 引用行，用来突出说明、提示或学习目标。 |


适合：

- 注意事项。
- 外部原话的短引用。
- 风险提示。

不要把普通正文都写成引用。引用应该是特殊信息。

## 链接

行内链接：

````markdown
[Prometheus 官方文档](https://prometheus.io/docs/)
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Prometheus 官方文档](https://prometheus.io/docs/)</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


相对链接：

````markdown
[Docker 深讲](../cloud-native/docker.md)
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Docker 深讲](../cloud-native/docker.md)</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


链接由两部分组成：

```text
[显示文本](目标地址)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[显示文本](目标地址)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


建议：

| 做法 | 原因 |
|---|---|
| 链接文本写清楚 | 不要写一堆“点击这里” |
| 相对链接指向具体文件 | VitePress 构建更稳 |
| 文件名大小写一致 | Linux 和 GitHub Pages 区分大小写 |
| 定期构建检查 | 防止死链 |

坏例子：

````markdown
[点击这里](../docker.md)
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[点击这里](../docker.md)</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


好例子：

````markdown
[Docker 深讲](../cloud-native/docker.md)
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[Docker 深讲](../cloud-native/docker.md)</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


## 图片

图片语法：

````markdown
![Prometheus targets 页面](./images/prometheus-targets.png)
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>![Prometheus targets 页面](./images/prometheus-targets.png)</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


结构：

```text
![替代文本](图片路径)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>![替代文本](图片路径)</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


替代文本不是随便写，它应该描述图片内容。这样图片加载失败时，读者仍然知道它是什么。

建议：

- 图片放在当前专题附近的 `images/` 目录。
- 文件名用小写和连字符。
- 不提交敏感截图。
- 截图前遮掉 token、IP、客户信息。

## 表格

GFM 支持表格。

````markdown
| 技术 | 作用 | AIOps 场景 |
|---|---|---|
| Prometheus | 指标采集 | 异常检测输入 |
| Grafana | 可视化 | 值班 dashboard |
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>&#124; 技术 &#124; 作用 &#124; AIOps 场景 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 2 行 | <code>&#124;---&#124;---&#124;---&#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 3 行 | <code>&#124; Prometheus &#124; 指标采集 &#124; 异常检测输入 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 4 行 | <code>&#124; Grafana &#124; 可视化 &#124; 值班 dashboard &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |


表格至少有：

- 表头行。
- 分隔行。
- 数据行。

对齐写法：

````markdown
| 字段 | 含义 | 示例 |
|:---|:---:|---:|
| left | center | right |
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>&#124; 字段 &#124; 含义 &#124; 示例 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 2 行 | <code>&#124;:---&#124;:---:&#124;---:&#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 3 行 | <code>&#124; left &#124; center &#124; right &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |


排障：

| 现象 | 原因 |
|---|---|
| 表格不渲染 | 分隔行缺失 |
| 某列错位 | 某行少了 `|` |
| 竖线显示异常 | 单元格里有未转义的 `|` |

如果单元格里要写 `|`，可以用反斜杠转义：

````markdown
`a \| b`
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>`a \&#124; b`</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


## 任务列表

GFM 支持 task list。

````markdown
- [x] 创建 GitHub 仓库
- [x] 启动 VitePress
- [ ] 补齐 Prometheus 实验
- [ ] 发布 GitHub Pages
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- [x] 创建 GitHub 仓库</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 2 行 | <code>- [x] 启动 VitePress</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 3 行 | <code>- [ ] 补齐 Prometheus 实验</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 4 行 | <code>- [ ] 发布 GitHub Pages</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |


适合：

- Issue 验收标准。
- 学习计划。
- PR checklist。
- 事故行动项。

任务列表的价值不是“打勾好看”，而是让完成标准明确。

## 删除线

GFM 支持删除线：

````markdown
~~旧方案：手动登录服务器修改配置~~
新方案：通过 GitHub Actions 发布配置。
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>~~旧方案：手动登录服务器修改配置~~</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>新方案：通过 GitHub Actions 发布配置。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


适合在复盘或方案演进中保留上下文。不要滥用删除线制造阅读负担。

## 自动链接

GitHub 会自动识别部分 URL。

````markdown
https://github.com/quweisheng/zero-to-aiops
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>https://github.com/quweisheng/zero-to-aiops</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


但在正式文档中，更建议写成有意义的链接文本：

````markdown
[zero-to-aiops 仓库](https://github.com/quweisheng/zero-to-aiops)
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>[zero-to-aiops 仓库](https://github.com/quweisheng/zero-to-aiops)</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


因为裸链接不说明读者点进去会看到什么。

## 转义

如果你想显示 Markdown 符号本身，可以用反斜杠转义。

````markdown
\*这不是强调\*
\# 这不是标题
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>\*这不是强调\*</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>\# 这不是标题</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


渲染后会显示星号和井号。

常见需要转义的字符：

```text
\ ` * _ { } [ ] ( ) # + - . ! |
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>\ ` * _ { } [ ] ( ) # + - . ! &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


表格里尤其要注意 `|`。

## HTML

Markdown 允许嵌入部分 HTML。

````markdown
<br>
<details>
<summary>展开排障细节</summary>

这里是详细内容。

</details>
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>&lt;br&gt;</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>&lt;details&gt;</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>&lt;summary&gt;展开排障细节&lt;/summary&gt;</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>这里是详细内容。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 7 行 | <code>&lt;/details&gt;</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


但知识库里建议少用 HTML：

- 不同平台支持不一致。
- 可读性降低。
- VitePress 和 GitHub 渲染可能有差异。

只有在 Markdown 表达不了时，再少量使用。

## Frontmatter

很多静态站点生成器支持 Frontmatter。VitePress 使用 YAML Frontmatter 设置页面元数据。

例子：

````markdown
---
title: Prometheus 精讲
description: 从零学习 Prometheus 数据模型、PromQL 和告警规则
---

# Prometheus 精讲
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>---</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>title: Prometheus 精讲</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>description: 从零学习 Prometheus 数据模型、PromQL 和告警规则</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 4 行 | <code>---</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 6 行 | <code># Prometheus 精讲</code> | Markdown 标题行，用来组织文档层级。 |


Frontmatter 必须放在文件最开头。常见用途：

- 页面标题。
- 描述。
- layout。
- sidebar 控制。
- outline 控制。

普通 GitHub README 不需要 Frontmatter。VitePress 页面可以用。

## GitHub 写作特性

GitHub 还支持一些平台能力：

| 特性 | 示例 | 用途 |
|---|---|---|
| Issue 引用 | `#12` | 引用 issue 或 PR |
| 用户 mention | `@username` | 提醒用户 |
| commit SHA | `abc1234` | 引用提交 |
| task list | `- [ ] task` | 跟踪任务 |
| alerts | `> [!NOTE]` | 显示提示块 |

GitHub alerts 示例：

````markdown
> [!WARNING]
> 不要把 token 提交到仓库。
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>&gt; [!WARNING]</code> | Markdown 引用行，用来突出说明、提示或学习目标。 |
| 第 2 行 | <code>&gt; 不要把 token 提交到仓库。</code> | Markdown 引用行，用来突出说明、提示或学习目标。 |


注意：GitHub alerts 在 GitHub 上效果好，但不是所有 Markdown 渲染器都支持。VitePress 支持自己的容器语法，具体在 VitePress 篇讲。

## Markdown 语法字典

### 标题

| 项 | 内容 |
|---|---|
| 作用 | 表示文档层级 |
| 语法 | `#` 到 `######` |
| 示例 | `## 常见故障排查` |
| AIOps 场景 | 技术教程、runbook、复盘结构 |
| 常见坑 | 标题跳级、多个一级标题 |

### 段落

| 项 | 内容 |
|---|---|
| 作用 | 表达一个完整意思 |
| 语法 | 普通文本，段落之间空行 |
| 示例 | 两段之间留一个空行 |
| AIOps 场景 | 描述背景、原因、结论 |
| 常见坑 | 不留空行导致内容挤成一段 |

### 无序列表

| 项 | 内容 |
|---|---|
| 作用 | 表达并列项 |
| 语法 | `- item` |
| 示例 | `- Prometheus` |
| AIOps 场景 | 列故障原因、检查项 |
| 常见坑 | 缩进混乱导致嵌套错误 |

### 有序列表

| 项 | 内容 |
|---|---|
| 作用 | 表达步骤 |
| 语法 | `1. step` |
| 示例 | `1. 打开 /targets` |
| AIOps 场景 | runbook 操作步骤 |
| 常见坑 | 用无序列表写操作流程，读者不知道顺序 |

### 行内代码

| 项 | 内容 |
|---|---|
| 作用 | 标记命令、字段、路径、文件名 |
| 语法 | `` `code` `` |
| 示例 | `` `docker compose ps` `` |
| AIOps 场景 | 命令和配置字段说明 |
| 常见坑 | 不标代码导致命令和正文混在一起 |

### 代码块

| 项 | 内容 |
|---|---|
| 作用 | 展示多行命令、代码、配置、输出 |
| 语法 | 三个或更多反引号 |
| 示例 | ` ```bash ... ``` ` |
| AIOps 场景 | 展示 PromQL、YAML、Shell、日志输出 |
| 常见坑 | 反引号没闭合，后文全变代码块 |

### 链接

| 项 | 内容 |
|---|---|
| 作用 | 指向外部资料或仓库内部页面 |
| 语法 | `[文本](地址)` |
| 示例 | `[GitHub](https://docs.github.com/)` |
| AIOps 场景 | 官方资料、相关章节、runbook |
| 常见坑 | 相对路径错、大小写不一致、链接文本不清楚 |

### 图片

| 项 | 内容 |
|---|---|
| 作用 | 展示截图和图示 |
| 语法 | `![替代文本](路径)` |
| 示例 | `![targets 页面](./images/targets.png)` |
| AIOps 场景 | Dashboard 截图、故障截图 |
| 常见坑 | 提交了敏感信息、图片路径错 |

### 表格

| 项 | 内容 |
|---|---|
| 作用 | 对比字段、命令、现象和处理方式 |
| 语法 | 表头、分隔行、数据行 |
| 示例 | `| 字段 | 含义 |` |
| AIOps 场景 | 命令字典、配置字段解释、排障表 |
| 常见坑 | 分隔行缺失、单元格竖线未转义 |

### 任务列表

| 项 | 内容 |
|---|---|
| 作用 | 表达待办和验收标准 |
| 语法 | `- [ ] task`、`- [x] done` |
| 示例 | `- [ ] npm run docs:build` |
| AIOps 场景 | Issue、PR、学习计划 |
| 常见坑 | 任务太泛，没有验收标准 |

### 引用

| 项 | 内容 |
|---|---|
| 作用 | 表示提示、风险、短引用 |
| 语法 | `> text` |
| 示例 | `> 注意：先备份配置。` |
| AIOps 场景 | 风险提示、注意事项 |
| 常见坑 | 用引用代替正文，层级不清 |

## AIOps 文档模板

### 技术深讲模板

````markdown
# 技术名

> 目标：学完能做什么。

## 官方资料

## 场景开场

## 一句话人话版

## 官方知识地图

## 是什么

## 为什么需要

## 怎么工作

## 核心概念

## 命令 / 配置 / API 字典

## 入门实验

## 常见故障排查

## 面试怎么讲

## 学习检查清单

## 学习证据
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># 技术名</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>&gt; 目标：学完能做什么。</code> | Markdown 引用行，用来突出说明、提示或学习目标。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>## 官方资料</code> | Markdown 标题行，用来组织文档层级。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 7 行 | <code>## 场景开场</code> | Markdown 标题行，用来组织文档层级。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 9 行 | <code>## 一句话人话版</code> | Markdown 标题行，用来组织文档层级。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 11 行 | <code>## 官方知识地图</code> | Markdown 标题行，用来组织文档层级。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 13 行 | <code>## 是什么</code> | Markdown 标题行，用来组织文档层级。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 15 行 | <code>## 为什么需要</code> | Markdown 标题行，用来组织文档层级。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 17 行 | <code>## 怎么工作</code> | Markdown 标题行，用来组织文档层级。 |
| 第 18 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 19 行 | <code>## 核心概念</code> | Markdown 标题行，用来组织文档层级。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 21 行 | <code>## 命令 / 配置 / API 字典</code> | Markdown 标题行，用来组织文档层级。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 23 行 | <code>## 入门实验</code> | Markdown 标题行，用来组织文档层级。 |
| 第 24 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 25 行 | <code>## 常见故障排查</code> | Markdown 标题行，用来组织文档层级。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 27 行 | <code>## 面试怎么讲</code> | Markdown 标题行，用来组织文档层级。 |
| 第 28 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 29 行 | <code>## 学习检查清单</code> | Markdown 标题行，用来组织文档层级。 |
| 第 30 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 31 行 | <code>## 学习证据</code> | Markdown 标题行，用来组织文档层级。 |


### Runbook 模板

````markdown
# Runbook: 服务不可用

## 适用场景

## 影响判断

## 前置条件

## 检查步骤

## 处理步骤

## 验证方式

## 风险

## 回滚

## 相关链接
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># Runbook: 服务不可用</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>## 适用场景</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>## 影响判断</code> | Markdown 标题行，用来组织文档层级。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 7 行 | <code>## 前置条件</code> | Markdown 标题行，用来组织文档层级。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 9 行 | <code>## 检查步骤</code> | Markdown 标题行，用来组织文档层级。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 11 行 | <code>## 处理步骤</code> | Markdown 标题行，用来组织文档层级。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 13 行 | <code>## 验证方式</code> | Markdown 标题行，用来组织文档层级。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 15 行 | <code>## 风险</code> | Markdown 标题行，用来组织文档层级。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 17 行 | <code>## 回滚</code> | Markdown 标题行，用来组织文档层级。 |
| 第 18 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 19 行 | <code>## 相关链接</code> | Markdown 标题行，用来组织文档层级。 |


### 事故复盘模板

````markdown
# 事故复盘：标题

## 摘要

## 影响

## 时间线

## 根因

## 触发条件

## 处理过程

## 做得好的地方

## 待改进

## 行动项

## 证据链接
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># 事故复盘：标题</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>## 摘要</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>## 影响</code> | Markdown 标题行，用来组织文档层级。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 7 行 | <code>## 时间线</code> | Markdown 标题行，用来组织文档层级。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 9 行 | <code>## 根因</code> | Markdown 标题行，用来组织文档层级。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 11 行 | <code>## 触发条件</code> | Markdown 标题行，用来组织文档层级。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 13 行 | <code>## 处理过程</code> | Markdown 标题行，用来组织文档层级。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 15 行 | <code>## 做得好的地方</code> | Markdown 标题行，用来组织文档层级。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 17 行 | <code>## 待改进</code> | Markdown 标题行，用来组织文档层级。 |
| 第 18 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 19 行 | <code>## 行动项</code> | Markdown 标题行，用来组织文档层级。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 21 行 | <code>## 证据链接</code> | Markdown 标题行，用来组织文档层级。 |


### 实验记录模板

````markdown
# 实验：Prometheus + Grafana

## 目标

## 环境

## 文件结构

## 启动命令

## 验证方式

## 预期结果

## 遇到的问题

## 结论

## 下一步
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># 实验：Prometheus + Grafana</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>## 目标</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>## 环境</code> | Markdown 标题行，用来组织文档层级。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 7 行 | <code>## 文件结构</code> | Markdown 标题行，用来组织文档层级。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 9 行 | <code>## 启动命令</code> | Markdown 标题行，用来组织文档层级。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 11 行 | <code>## 验证方式</code> | Markdown 标题行，用来组织文档层级。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 13 行 | <code>## 预期结果</code> | Markdown 标题行，用来组织文档层级。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 15 行 | <code>## 遇到的问题</code> | Markdown 标题行，用来组织文档层级。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 17 行 | <code>## 结论</code> | Markdown 标题行，用来组织文档层级。 |
| 第 18 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 19 行 | <code>## 下一步</code> | Markdown 标题行，用来组织文档层级。 |


## 好 Markdown 的判断标准

一篇好的工程 Markdown 文档，至少满足：

- 标题层级清楚。
- 每段只讲一个意思。
- 命令和输出分开。
- 代码块标语言。
- 表格字段解释完整。
- 链接文本具体。
- 图片有替代文本。
- 实验能复现。
- 排障写现象、原因、检查、处理。
- 最后有学习证据。

不好的文档常见问题：

- 只有概念，没有命令。
- 只有命令，没有解释。
- 只有截图，没有步骤。
- 只有结论，没有证据。
- 只有链接，没有自己的理解。

## 入门实验：写一篇可提交的学习记录

### 第 1 步：创建文件

```text
docs/learning-records/markdown-first-note.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docs/learning-records/markdown-first-note.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 第 2 步：写入结构

````markdown
# 学习记录：Markdown 基础

## 今天学了什么

- 标题
- 列表
- 代码块
- 表格
- 链接

## 我运行的命令

```bash
git status
```

## 命令输出说明

```text
On branch main
```

这说明我当前在 `main` 分支。

## 遇到的问题

| 现象 | 原因 | 处理 |
|---|---|---|
| 表格没渲染 | 缺少分隔行 | 补上 `|---|---|` |

## 下一步

- [ ] 写一个 runbook 模板
- [ ] 写一篇事故复盘模板
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code># 学习记录：Markdown 基础</code> | Markdown 标题行，用来组织文档层级。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 3 行 | <code>## 今天学了什么</code> | Markdown 标题行，用来组织文档层级。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>- 标题</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 6 行 | <code>- 列表</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 7 行 | <code>- 代码块</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 8 行 | <code>- 表格</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 9 行 | <code>- 链接</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 11 行 | <code>## 我运行的命令</code> | Markdown 标题行，用来组织文档层级。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 13 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 14 行 | <code>git status</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 15 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 17 行 | <code>## 命令输出说明</code> | Markdown 标题行，用来组织文档层级。 |
| 第 18 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 19 行 | <code>```text</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 20 行 | <code>On branch main</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 21 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 23 行 | <code>这说明我当前在 `main` 分支。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 24 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 25 行 | <code>## 遇到的问题</code> | Markdown 标题行，用来组织文档层级。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 27 行 | <code>&#124; 现象 &#124; 原因 &#124; 处理 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 28 行 | <code>&#124;---&#124;---&#124;---&#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 29 行 | <code>&#124; 表格没渲染 &#124; 缺少分隔行 &#124; 补上 `&#124;---&#124;---&#124;` &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 30 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 31 行 | <code>## 下一步</code> | Markdown 标题行，用来组织文档层级。 |
| 第 32 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 33 行 | <code>- [ ] 写一个 runbook 模板</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |
| 第 34 行 | <code>- [ ] 写一篇事故复盘模板</code> | Markdown 列表项，用来列出步骤、要点或证据清单。 |


### 第 3 步：本地构建验证

```bash
npm run docs:build
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm run docs:build</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


### 第 4 步：提交 Git

```bash
git add docs/learning-records/markdown-first-note.md
git commit -m "docs: add first markdown learning note"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>git add docs/learning-records/markdown-first-note.md</code> | 执行 Git 版本控制命令，用来查看状态、提交、推送或排查仓库问题。 |
| 第 2 行 | <code>git commit -m "docs: add first markdown learning note"</code> | 执行 Git 版本控制命令，用来查看状态、提交、推送或排查仓库问题。 |


## 常见故障排查

### 标题没有出现在目录里

检查：

- 是否写成了代码块。
- 是否跳级太严重。
- VitePress 是否配置了 outline。
- 标题是否在 HTML 或特殊容器里。

### 表格没有渲染

检查：

````markdown
| 字段 | 含义 |
|---|---|
| job | 抓取任务 |
````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>&#124; 字段 &#124; 含义 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 2 行 | <code>&#124;---&#124;---&#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |
| 第 3 行 | <code>&#124; job &#124; 抓取任务 &#124;</code> | Markdown 表格行，用来对齐展示字段和说明。 |


必须有分隔行：

```text
|---|---|
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>&#124;---&#124;---&#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### 代码块吞掉后面正文

原因：代码块没有闭合。

坏例子：

`````markdown
```bash
docker ps

后面的正文也会被当成代码。
`````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>docker ps</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 4 行 | <code>后面的正文也会被当成代码。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


修复：

`````markdown
```bash
docker ps
```

后面的正文恢复正常。
`````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>docker ps</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔 Markdown 段落。 |
| 第 5 行 | <code>后面的正文恢复正常。</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


### 文档里讲代码块时渲染坏了

用四个反引号包住外层：

`````markdown
````markdown
```bash
git status
```
````
`````

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>````markdown</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 2 行 | <code>```bash</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 3 行 | <code>git status</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 4 行 | <code>```</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |
| 第 5 行 | <code>````</code> | Markdown 正文示例，展示文档里应该怎样写说明内容。 |


### 链接在 GitHub 能点，VitePress 构建失败

可能原因：

- VitePress 检查 dead links 更严格。
- 本地 `localhost` 裸链接被当成真实外链。
- 相对路径在站点路由中不成立。

处理：

- 示例本地地址写成代码：`localhost:9090`。
- 内部链接指向具体 `.md` 文件。
- 运行 `npm run docs:build` 验证。

### 图片不显示

检查：

- 文件是否提交。
- 路径是否正确。
- 大小写是否一致。
- 是否被 `.gitignore` 忽略。
- VitePress public 目录规则是否正确。

### README 在 GitHub 好看，文档站里不好看

原因：GitHub 和 VitePress 渲染器不同。

处理：

- 尽量使用 CommonMark 和 GFM 基础能力。
- 少用平台专属扩展。
- 对 VitePress 页面使用 VitePress 支持的语法。
- 构建后检查页面。

## 典型故障排查表

| 现象 | 常见原因 | 检查方式 | 处理 |
|---|---|---|---|
| 标题层级乱 | 跳级或多个一级标题 | 看页面目录 | 调整标题层级 |
| 表格不渲染 | 缺分隔行或列数乱 | 看源码 | 补齐 `|---|` |
| 代码块吞正文 | 反引号未闭合 | 搜索 ``` | 闭合代码块 |
| 链接失效 | 相对路径错 | `npm run docs:build` | 修路径 |
| 图片不显示 | 文件未提交或路径错 | `git status` | 提交图片并修路径 |
| 命令难复制 | 命令和输出混在一起 | 人工阅读 | 拆成命令块和输出块 |
| VitePress 构建失败 | dead link 或语法问题 | 构建日志 | 按日志定位文件 |
| README 不像作品集 | 缺目标和入口 | 打开仓库首页 | 重写导航结构 |

## Markdown 与 VitePress 的关系

VitePress 会读取 Markdown 文件，转换成网站页面。

```text
docs/**/*.md
  -> VitePress
  -> Vue + markdown-it
  -> static site
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docs/**/*.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; VitePress</code> | 这一行要理解这些英文词：`VitePress` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; Vue + markdown-it</code> | 这一行要理解这些英文词：`Vue` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`markdown-it` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; static site</code> | 这一行要理解这些英文词：`static site` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


所以写知识库时要同时考虑：

- GitHub 上能读。
- VitePress 构建能过。
- 页面目录清晰。
- 内部链接稳定。
- 代码块高亮语言被支持。

有些 GitHub 支持的语法，VitePress 不一定同样支持。反过来，VitePress 的容器、Frontmatter、Vue 组件，GitHub README 也不一定支持。

## 学习路线

### 第 1 阶段：基础语法

- 标题。
- 段落。
- 列表。
- 链接。
- 图片。
- 行内代码。
- 代码块。

学习证据：一篇学习记录。

### 第 2 阶段：工程文档

- 表格。
- 任务列表。
- 命令和输出分离。
- 相对链接。
- 截图说明。

学习证据：一个项目 README。

### 第 3 阶段：AIOps 模板

- 技术深讲模板。
- Runbook 模板。
- 事故复盘模板。
- 实验记录模板。

学习证据：一个 runbook 和一篇复盘模板。

### 第 4 阶段：文档站

- Frontmatter。
- VitePress 内部链接。
- 构建检查。
- 页面目录。

学习证据：`npm run docs:build` 通过。

### 第 5 阶段：作品集

- README 导航。
- 技术栈文档。
- 实验记录。
- 截图和证据。
- GitHub PR review。

学习证据：一个结构清楚的 GitHub 知识库。

## 小白可能会问

### 为什么不用 Word 记学习笔记？

Word 适合复杂排版和办公文档。Markdown 更适合工程知识库，因为它是纯文本，Git diff 清楚，能和代码、配置、CI、文档站放在同一个仓库里。

### README、runbook、故障复盘分别怎么写？

README 是导航，回答“这个项目是什么，怎么用”。Runbook 是操作手册，回答“出问题时怎么处理”。故障复盘是事后总结，回答“发生了什么，为什么发生，怎么避免再发生”。

### 代码块为什么要标语言？

标语言能让文档站高亮正确，也让读者知道这段是 bash、PowerShell、YAML、JSON 还是输出文本。命令用 `bash` 或 `powershell`，输出用 `text`。

### Markdown 写得好，对 AIOps 求职有什么帮助？

它能让你的经验变成作品集：文档结构清楚、实验可复现、排障有记录、配置有解释。面试官看到的是工程表达能力，不只是“我学过”。

### 为什么我的表格总坏？

通常是缺少分隔行、列数不一致、单元格里有未转义的 `|`。先写最小表格，再逐步加内容。

## 面试怎么讲

Markdown 是我沉淀工程知识的基础格式。它用纯文本表达标题、段落、列表、代码块、表格、链接和图片，适合 Git 版本控制和 Pull Request review，也能被 GitHub 和 VitePress 渲染成页面。在 AIOps 学习里，我会用 Markdown 写 README、技术深讲、runbook、事故复盘和实验记录，并且把命令、输出、配置字段、排障现象和学习证据写清楚。这样运维经验不会停留在聊天记录里，而是沉淀成可复用、可展示、可自动构建的知识库。

## 面试题

1. Markdown 解决什么问题？
2. CommonMark 和 GitHub Flavored Markdown 有什么关系？
3. Markdown 为什么适合 Git 版本控制？
4. 标题层级为什么重要？
5. 段落和换行有什么区别？
6. 行内代码和代码块分别适合什么？
7. 为什么命令和输出要分开写？
8. Markdown 表格由哪几部分组成？
9. 表格渲染失败常见原因有哪些？
10. 如何在 Markdown 文档里展示 Markdown 代码块？
11. 相对链接在知识库中有什么好处？
12. 图片替代文本为什么重要？
13. GitHub task list 适合哪些场景？
14. Frontmatter 在 VitePress 中有什么作用？
15. GitHub Markdown 和 VitePress Markdown 有哪些差异风险？
16. README、runbook、事故复盘的结构有什么不同？
17. 一篇好的技术学习笔记应该包含哪些部分？
18. 如何排查 VitePress 中 Markdown 链接失败？
19. 为什么 Markdown 能帮助 AIOps 求职展示？
20. 你会如何组织一个 Markdown 知识库？

## 学习检查清单

- [ ] 我能解释 Markdown、CommonMark、GFM 的关系。
- [ ] 我能写标题、段落、列表、链接、图片。
- [ ] 我能正确使用行内代码和代码块。
- [ ] 我能用四个反引号展示嵌套代码块。
- [ ] 我能写表格并排查表格渲染问题。
- [ ] 我能写 GitHub task list。
- [ ] 我能解释相对链接和图片路径。
- [ ] 我能写 README、runbook、事故复盘模板。
- [ ] 我能把命令、输出、解释和结论分开。
- [ ] 我能用 Markdown 写一篇可提交到 GitHub 的学习记录。
- [ ] 我能运行 `npm run docs:build` 检查文档站。
- [ ] 我能排查代码块、链接、图片和表格问题。

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- 一篇 `docs/learning-records/markdown-first-note.md`。
- 一个项目 `README.md`。
- 一个 `docs/runbooks/template.md`。
- 一个 `docs/incidents/template.md`。
- 一篇笔记：`CommonMark 和 GitHub Flavored Markdown 的区别.md`。
- 一篇排障记录：`Markdown 表格和代码块渲染错误怎么查.md`。
- 一次通过的 `npm run docs:build` 记录。

如果你的 Markdown 文档能让别人照着完成实验、理解命令含义、看到预期输出、知道失败怎么排查，它就不再是“笔记”，而是 AIOps 知识库的一块可复用工程资产。
