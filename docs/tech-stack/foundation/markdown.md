# Markdown

> 目标：能用 Markdown 写清楚学习笔记、runbook、项目 README、事故复盘和面试故事。

## 官方资料

- [CommonMark](https://commonmark.org/)
- [CommonMark help](https://commonmark.org/help/)
- [Markdown Guide: Basic Syntax](https://www.markdownguide.org/basic-syntax/)
- [GitHub writing syntax](https://docs.github.com/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)

说明：本文是基于 CommonMark、Markdown Guide 和 GitHub Docs 整理的原创中文教程，不复制官方全文。

## 为什么要学

AIOps 学习会产生大量知识资产：技术笔记、runbook、故障复盘、配置说明、实验步骤、面试故事。Markdown 是这些内容最适合的记录格式，因为它简单、可读、容易提交到 GitHub，也能被 VitePress 渲染成网站。

对你来说，Markdown 不是“排版工具”，而是把运维经验沉淀成工程知识库的基础能力。

## 是什么

Markdown 是轻量标记语言。它用普通文本表示标题、列表、链接、代码块、表格等结构，然后由 GitHub、VitePress 等工具渲染成 HTML。

## 它解决什么问题

- 用普通文本写结构化文档。
- 让学习笔记适合 Git 版本控制。
- 让 README、runbook、复盘和教程格式统一。
- 让 GitHub 和 VitePress 可以直接渲染内容。
- 降低分享和维护知识库的成本。

## 核心原理

```text
plain text .md
  -> Markdown parser
  -> HTML
  -> GitHub / VitePress / browser
```

Markdown 的价值不是复杂，而是简单、可读、适合版本控制。

## 基础语法

标题：

```md
# 一级标题
## 二级标题
### 三级标题
```

列表：

```md
- 第一项
- 第二项
```

编号：

```md
1. 第一步
2. 第二步
3. 第三步
```

链接：

```md
[Prometheus](https://prometheus.io/)
```

行内代码：

```md
执行 `git status` 查看状态。
```

代码块：

````md
```bash
git status
```
````

表格：

```md
| 技术 | 作用 |
|---|---|
| Prometheus | 指标采集 |
| Grafana | 仪表盘 |
```

引用：

```md
> 这是一段引用。
```

## GitHub Markdown 特性

任务列表：

```md
- [x] 创建仓库
- [ ] 完成第一个项目
```

相对链接：

```md
[技术栈](../tech-stack/README.md)
```

## 在 AIOps 中的作用

- 写 runbook。
- 写事故复盘。
- 写学习记录。
- 写项目 README。
- 写告警规则说明。
- 写面试故事。

## 好文档结构

技术学习笔记：

```md
# 技术名

## 是什么
## 为什么学
## 原理
## 架构
## 安装配置
## 入门实验
## 排障
## 学习证据
```

Runbook：

```md
# Runbook: 故障名称

## 适用场景
## 前置检查
## 处理步骤
## 验证方式
## 风险
## 回滚
```

事故复盘：

```md
# 事故复盘：标题

## 影响
## 时间线
## 根因
## 处理过程
## 做得好的地方
## 待改进
## 行动项
```

## 入门实验

创建：

```text
docs/learning-records/markdown-first-note.md
```

写一篇包含标题、列表、表格、代码块、链接的学习记录。

## 排障清单

### 表格渲染错

- 表头和分隔行要完整。
- 每行列数尽量一致。
- 中文全角竖线容易出问题，使用英文 `|`。

### 代码块坏掉

- 三个反引号要成对。
- 如果文档里讲代码块，可以用四个反引号包住。

### 链接失效

- 相对路径是否正确。
- 文件名大小写是否一致。
- VitePress 里目录链接尽量指向具体文件。

## 学习检查清单

- [ ] 我能写标题、列表、链接、代码块和表格。
- [ ] 我能写 GitHub task list。
- [ ] 我能解释 Markdown 为什么适合版本控制。
- [ ] 我能写一篇结构清晰的技术学习笔记。
- [ ] 我能写一个 runbook 模板。
- [ ] 我能写一篇事故复盘模板。
- [ ] 我能排查表格、代码块、相对链接渲染问题。
- [ ] 我能用 Markdown 把实验过程提交到 GitHub。

## 面试题

1. Markdown 相比 Word 文档有什么优势？
2. 为什么技术知识库适合用 Markdown 管理？
3. README、runbook、事故复盘的结构有什么不同？
4. Markdown 表格渲染错通常是什么原因？
5. 如何在 Markdown 中写代码块？
6. GitHub Flavored Markdown 有哪些常用特性？
7. 为什么学习记录要包含命令、输出和结论？
8. 如何让 Markdown 文档更适合 VitePress 渲染？
9. 一篇好的故障复盘应该包含哪些部分？
10. Markdown 如何帮助你把运维经验变成求职作品集？

## 学习证据

- 一篇格式规范的学习记录。
- 一个项目 README。
- 一个 runbook。
