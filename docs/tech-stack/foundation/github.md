# GitHub

> 目标：能把学习记录、项目代码、配置、实验截图和文档站托管到 GitHub，理解 repository、README、branch、Issue、Pull Request、Actions、Pages、Release、Token、SSH key、权限和安全边界，并能把 AIOps 知识库做成可展示的工程作品集。

## 官方资料

- [GitHub Docs](https://docs.github.com/)
- [About GitHub and Git](https://docs.github.com/en/get-started/start-your-journey/about-github-and-git)
- [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow)
- [About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
- [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [Basic writing and formatting syntax](https://docs.github.com/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [About issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues)
- [About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions)
- [What is GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [About code scanning](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning)

说明：本文基于 GitHub 官方文档整理成原创中文教程，不复制官方全文。官方文档负责定义功能和安全边界，本文负责把它组织成 AIOps 学习作品集的实践路径。

## 场景开场

“简历上写熟悉 Prometheus、Docker、Python，面试官凭什么相信？”

如果只有一句话，别人只能听你说。如果 GitHub 上有这些东西，证据就立起来了：

- 持续提交记录。
- README 说明学习路线。
- Docker Compose 实验环境。
- Prometheus 配置。
- Grafana dashboard JSON。
- VitePress 文档站。
- GitHub Actions 自动构建。
- Issues 记录学习任务和排障过程。
- Pull Requests 展示一次完整变更的思路。

对转 AIOps 来说，GitHub 不只是代码仓库。它是你的公开作品集、学习轨迹、工程习惯和自动化能力展示台。

## 一句话人话版

GitHub 是基于 Git 的云端协作平台：它托管仓库，也提供 Issues、Pull Requests、Actions、Pages、安全和权限管理，让你的学习成果变成可展示、可复现、可协作的工程资产。

## 学习边界

这一篇重点讲 GitHub 平台能力：

- GitHub 和 Git 的关系。
- repository、README、branch、commit、remote。
- GitHub flow。
- Issues 和 Projects。
- Pull Requests 和 code review。
- Actions 自动化。
- Pages 发布文档站。
- Releases 和 tags。
- Personal access token、SSH key、权限最小化。
- Secrets、Dependabot、code scanning 基础。
- AIOps 知识库如何组织成作品集。

Git 命令的内部机制已经在 Git 篇讲过。这一篇会使用一些 Git 命令，但重点不是重新讲对象模型，而是讲 GitHub 如何把 Git 仓库变成协作和展示平台。

## 官方知识地图

GitHub Docs 可以按这棵树理解：

```text
GitHub Docs
  ├── Get started
  │   ├── About GitHub and Git
  │   ├── GitHub flow
  │   ├── Connecting to GitHub
  │   └── Writing on GitHub
  ├── Repositories
  │   ├── create and manage repositories
  │   ├── README
  │   ├── branches and tags
  │   ├── releases
  │   └── repository settings
  ├── Issues and Projects
  │   ├── issues
  │   ├── labels
  │   ├── milestones
  │   └── projects
  ├── Pull requests
  │   ├── create PR
  │   ├── review changes
  │   ├── checks
  │   ├── merge
  │   └── branch protection
  ├── Actions
  │   ├── workflows
  │   ├── events
  │   ├── jobs
  │   ├── steps
  │   ├── runners
  │   ├── actions
  │   └── secrets
  ├── Pages
  │   ├── publish static site
  │   ├── branch or Actions source
  │   └── custom domains
  ├── Authentication
  │   ├── passwordless HTTPS auth
  │   ├── personal access tokens
  │   ├── SSH keys
  │   └── credential storage
  └── Code security
      ├── Dependabot
      ├── secret scanning
      ├── code scanning
      └── security advisories
```

本篇按这个结构讲。你学完以后再看官方文档，会知道每块功能服务于什么学习和工程目标。

## GitHub 在 AIOps 学习链路中的位置

```text
local learning and labs
  ├── notes
  ├── configs
  ├── scripts
  ├── dashboards
  └── screenshots
        |
        v
Git commits
        |
        v
GitHub repository
  ├── README
  ├── docs site
  ├── Issues
  ├── Pull Requests
  ├── Actions
  ├── Pages
  └── Releases
        |
        v
public portfolio and interview evidence
```

GitHub 能把 AIOps 学习中的四类证据集中起来：

| 证据 | GitHub 形式 |
|---|---|
| 知识笔记 | Markdown、VitePress 文档站 |
| 实验配置 | Docker Compose、Prometheus、Grafana JSON |
| 自动化能力 | GitHub Actions workflow |
| 学习轨迹 | commit history、Issues、PRs |

## GitHub 和 Git 的关系

Git 是版本控制系统。GitHub 是基于 Git 的云端平台。

```text
Git
  -> tracks file changes
  -> commits
  -> branches
  -> merges

GitHub
  -> hosts remote repositories
  -> shows README and code
  -> manages Issues and PRs
  -> runs Actions
  -> publishes Pages
  -> manages permissions and security
```

常见误解：

| 误解 | 正确理解 |
|---|---|
| GitHub 就是 Git | GitHub 使用 Git，但还提供协作、自动化、网站发布等能力 |
| 只有代码能放 GitHub | 文档、配置、实验记录、dashboard JSON 都可以 |
| push 了就等于作品好 | README、结构、可运行说明和提交质量同样重要 |
| token 可以随便放配置里 | token 是凭证，泄露后别人可能操作你的仓库 |

## Repository

Repository 是仓库，保存一个项目的文件和历史。

仓库里通常包含：

```text
zero-to-aiops/
  README.md
  docs/
  labs/
  projects/
  .github/
    workflows/
  package.json
```

Repository 解决的问题：

- 托管文件。
- 保存历史。
- 展示 README。
- 管理 Issues 和 Pull Requests。
- 运行 Actions。
- 发布 Pages。
- 设置权限和安全规则。

### Public 和 Private

| 类型 | 含义 | 适合 |
|---|---|---|
| Public | 公开可见 | 作品集、开源学习项目 |
| Private | 只有授权用户可见 | 私有项目、含敏感内容的仓库 |

你的 AIOps 知识库如果用于求职展示，可以公开。但要注意不要提交：

- 真实 token。
- 公司内部配置。
- 生产 IP。
- 私有域名。
- 客户数据。
- 敏感截图。

## README

README 是仓库首页，也是别人理解项目的第一入口。

一个 AIOps 学习仓库 README 至少回答：

| 问题 | 应该写什么 |
|---|---|
| 这是什么 | zero-to-aiops 是从 0 学 AIOps 的知识库和实验仓库 |
| 为什么做 | 记录从运维到 AIOps 的学习路径和项目证据 |
| 怎么看 | 文档站入口、技术栈入口、项目入口 |
| 怎么跑 | 本地启动 VitePress、运行实验环境 |
| 当前进度 | 已完成哪些专题，下一步做什么 |
| 证据在哪 | labs、dashboards、screenshots、Actions |

README 示例结构：

```markdown
# zero-to-aiops

## 目标

## 文档站

## 学习路线

## 技术栈

## 实验项目

## 本地运行

## 当前进度

## 学习证据
```

README 不是越长越好。它要像导航页，让别人一眼知道从哪里进入。

## Branch

Branch 是一条独立开发线。

在 GitHub flow 中，通常不要直接在 `main` 上改。更推荐：

```text
main
  └── docs/deepen-grafana
      └── commits
      └── pull request
      └── merge back to main
```

分支命名建议：

| 类型 | 示例 |
|---|---|
| 文档 | `docs/deepen-prometheus` |
| 修复 | `fix/broken-pages-build` |
| 实验 | `lab/prometheus-grafana-compose` |
| 自动化 | `ci/add-docs-build` |

分支的价值：

- 不影响主线。
- 可以发 PR 让别人 review。
- CI 可以先检查。
- 变更讨论有上下文。

## GitHub Flow

GitHub Flow 是官方推荐的轻量分支协作流程。

```text
create branch
  -> make changes
  -> commit and push
  -> open pull request
  -> review and checks
  -> merge
  -> delete branch
```

每一步的意义：

| 步骤 | 意义 |
|---|---|
| Create branch | 给一组变更独立空间 |
| Make changes | 修改文档、代码、配置 |
| Commit and push | 保存并上传变更 |
| Open PR | 说明变更目的，接受检查和讨论 |
| Review and checks | 发现问题，保证质量 |
| Merge | 进入主线 |
| Delete branch | 表示这条分支任务结束 |

你一个人学习也可以用 PR。原因不是“装正规”，而是训练工程表达：

- 这次改了什么？
- 为什么改？
- 怎么验证？
- 哪些风险？
- 下一步是什么？

## Issues

Issue 用来跟踪任务、问题、学习计划和排障记录。

AIOps 学习仓库可以这样用 Issues：

| Issue 类型 | 例子 |
|---|---|
| 学习任务 | `深入学习 Prometheus 数据模型` |
| 实验任务 | `搭建 Prometheus + Grafana Compose 实验` |
| 文档改进 | `补齐 Docker 命令字典` |
| 排障记录 | `Grafana 连接 Prometheus 失败` |
| 项目计划 | `完成第一版 AIOps 知识库导航` |

Issue 应该包含：

```markdown
## 背景

## 要完成什么

## 验收标准

## 参考资料

## 记录
```

好的 Issue 不只是“待办”，而是一个可追踪的问题上下文。

### Labels

Labels 用来分类 Issue 和 PR。

建议：

| Label | 用途 |
|---|---|
| `docs` | 文档 |
| `lab` | 实验 |
| `bug` | 问题 |
| `aiops` | AIOps 主线 |
| `observability` | 可观测性 |
| `cloud-native` | 云原生 |
| `good first issue` | 适合新手 |

### Milestones

Milestone 用来聚合一个阶段的 Issues。

例子：

```text
v0.1 技术栈深讲样板
v0.2 可观测性实验室
v0.3 AIOps 自动化项目
```

## Pull Requests

Pull Request，简称 PR，是一次变更进入主线前的讨论和检查入口。

一个好的 PR 包含：

```markdown
## Summary

- 深化 Docker Compose 文档
- 增加 Compose CLI 命令字典
- 增加 Prometheus + Grafana + demo app 实验

## Verification

- npm run docs:build
- git diff --check

## Notes

- 仍需继续深化 Kubernetes 文档
```

PR 的价值：

- 把变更说明和代码/文档放在一起。
- 让 CI 检查自动运行。
- 让 review 评论绑定具体行。
- 合并后保留讨论历史。

学习仓库也建议使用 PR，因为它能训练你把“做了什么”说清楚。

## Code Review

Code review 不只适合代码，也适合文档和配置。

Review 时关注：

- 文档是否准确。
- 命令是否能运行。
- 配置是否有安全风险。
- README 是否说明清楚。
- 实验是否可复现。
- 是否缺少验证。

AIOps 文档 PR 的 review 清单：

```text
官方资料是否列清？
核心概念是否讲透？
命令是否有解释和预期输出？
实验是否能跟着做？
排障是否覆盖常见失败？
学习证据是否明确？
```

## Repository Settings

仓库设置会影响可见性、安全和协作。

常见设置：

| 设置 | 作用 |
|---|---|
| Visibility | Public 或 Private |
| Default branch | 默认分支，通常是 `main` |
| Pages | 发布静态网站 |
| Actions permissions | 控制 workflow 权限 |
| Branch protection | 保护分支，要求 PR 和检查 |
| Secrets and variables | 保存 Actions 密钥和变量 |
| Collaborators | 管理协作者权限 |

学习仓库至少要会看：

- 默认分支。
- Pages 发布源。
- Actions 是否启用。
- Secrets 是否误用。

## Branch Protection

Branch protection 用来保护重要分支，例如 `main`。

常见规则：

- 禁止直接 push 到 `main`。
- 要求 PR。
- 要求 status checks 通过。
- 要求 review。
- 要求分支必须最新。

对个人学习仓库，不一定马上开启所有保护。但你要理解它解决的问题：防止主线被未经检查的变更弄坏。

## GitHub Actions

GitHub Actions 是 GitHub 的自动化平台。

它由几个核心对象组成：

```text
workflow
  ├── event
  ├── jobs
  │   ├── runner
  │   └── steps
  │       ├── run command
  │       └── use action
  └── artifacts / cache / secrets
```

术语解释：

| 术语 | 含义 |
|---|---|
| workflow | 自动化流程文件，放在 `.github/workflows/` |
| event | 触发条件，如 push、pull_request |
| job | 一组在同一 runner 上执行的步骤 |
| runner | 执行 job 的机器 |
| step | 一个命令或一个 action |
| action | 可复用自动化单元 |
| secret | workflow 使用的敏感值 |

VitePress 文档构建 workflow 示例：

```yaml
name: docs-build

on:
  push:
    branches: [main]
  pull_request:

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

      - name: Install dependencies
        run: npm ci

      - name: Build docs
        run: npm run docs:build
```

这个 workflow 的作用：

- 每次 push 或 PR 自动构建文档。
- 如果文档链接或 Markdown 构建出错，CI 会失败。
- PR 合并前能发现问题。

## GitHub Pages

GitHub Pages 用来发布静态网站。

对这个知识库来说，Pages 可以发布 VitePress 文档站：

```text
Markdown docs
  -> VitePress build
  -> static files
  -> GitHub Pages
  -> public docs site
```

常见发布方式：

| 方式 | 含义 |
|---|---|
| Deploy from branch | 从指定分支目录发布 |
| GitHub Actions | workflow 构建并部署 |

VitePress 更适合用 Actions 构建后发布，因为需要 Node 构建步骤。

Pages 排障关注：

- Pages 是否启用。
- 发布源是否正确。
- Actions 是否成功。
- VitePress base 配置是否匹配仓库路径。
- 构建产物目录是否正确。

## Releases 和 Tags

Tag 是 Git 中的版本标记，Release 是 GitHub 基于 tag 展示的版本发布页面。

学习仓库可以这样用：

```text
v0.1: 完成基础技术栈深讲样板
v0.2: 完成可观测性实验室
v0.3: 完成 AIOps 自动化项目
```

Release 适合写：

- 这一版完成了什么。
- 有哪些文档入口。
- 有哪些实验。
- 有哪些截图或构建产物。
- 下一版计划。

它能让你的学习路径看起来像一个持续演进的项目，而不是零散笔记。

## Authentication

GitHub 认证常见方式：

| 场景 | 常用方式 |
|---|---|
| 浏览器登录 | 账号、密码、2FA |
| Git HTTPS push | Personal Access Token 或 credential manager |
| Git SSH push | SSH key |
| GitHub Actions 访问仓库 | `GITHUB_TOKEN` 或 secrets |
| API 调用 | token |

### Personal Access Token

GitHub 不再建议用账号密码做 Git HTTPS 推送。HTTPS 推送通常使用 token。

Token 使用原则：

- 优先用 fine-grained token。
- 只授权需要的仓库。
- 只给需要的权限。
- 设置过期时间。
- 不写进代码。
- 不提交到 Git。
- 泄露后立刻 revoke。

常见权限：

| 权限 | 用途 |
|---|---|
| Contents: Read and write | push 代码或文档 |
| Actions: Read | 查看 workflow |
| Pull requests: Read and write | 自动化管理 PR |
| Issues: Read and write | 自动化管理 issue |

### SSH Key

SSH key 是另一种连接 GitHub 的方式。

流程：

```text
generate SSH key
  -> add public key to GitHub
  -> use SSH remote URL
  -> push / pull
```

远程地址形式：

```text
git@github.com:quweisheng/zero-to-aiops.git
```

HTTPS 地址形式：

```text
https://github.com/quweisheng/zero-to-aiops.git
```

两者都可以。关键是你要知道当前 remote 用的哪种：

```bash
git remote -v
```

## Secrets

GitHub Secrets 用来保存 Actions 中使用的敏感值。

例子：

- 云平台 token。
- 部署密钥。
- Webhook URL。
- 私有 registry 密码。

不要在 workflow 里写：

```yaml
env:
  TOKEN: ghp_xxx
```

应该把 token 放进 repository secrets，然后在 workflow 里引用。

学习仓库如果暂时只构建 VitePress，通常不需要额外 secret。

## Security

GitHub 提供多种安全能力。

| 能力 | 作用 |
|---|---|
| Dependabot alerts | 依赖漏洞提醒 |
| Dependabot updates | 自动提依赖升级 PR |
| Secret scanning | 检测泄露的 secrets |
| Code scanning | 静态分析代码风险 |
| Security policy | 告诉别人如何报告安全问题 |

AIOps 学习仓库至少要养成：

- 不提交 token。
- 不提交生产配置。
- 不提交敏感截图。
- 定期看 Actions 和 Dependabot 提示。
- 依赖升级要跑构建验证。

## GitHub 操作 / 配置 / API 字典

### Repository

| 项 | 内容 |
|---|---|
| 作用 | 托管项目文件和历史 |
| 关键配置 | visibility、default branch、license、topics |
| AIOps 场景 | 承载知识库、实验配置、文档站 |
| 常见坑 | 公开仓库不要提交敏感配置 |

### README

| 项 | 内容 |
|---|---|
| 作用 | 仓库首页说明 |
| 文件名 | `README.md` |
| AIOps 场景 | 展示学习路线、技术栈入口、实验入口 |
| 常见坑 | 只有口号，没有运行方式和证据入口 |

### Issue

| 项 | 内容 |
|---|---|
| 作用 | 跟踪任务、问题、学习计划 |
| 关键字段 | title、description、labels、assignees、milestone |
| AIOps 场景 | 管理每篇文档深讲改造和实验任务 |
| 常见坑 | 标题太泛，验收标准不清 |

### Pull Request

| 项 | 内容 |
|---|---|
| 作用 | 提交一组变更，请求合并 |
| 关键字段 | summary、files changed、checks、review、merge |
| AIOps 场景 | 文档升级、实验配置、CI 改动都走 PR |
| 常见坑 | PR 描述不写验证，review 很难判断 |

### Actions Workflow

| 项 | 内容 |
|---|---|
| 作用 | 自动化构建、测试、部署 |
| 路径 | `.github/workflows/*.yml` |
| AIOps 场景 | 自动构建 VitePress 文档站，验证 Markdown |
| 常见坑 | YAML 缩进错、触发分支错、Node 版本不匹配 |

### GitHub Pages

| 项 | 内容 |
|---|---|
| 作用 | 发布静态网站 |
| 发布源 | branch 或 GitHub Actions |
| AIOps 场景 | 发布知识库文档站 |
| 常见坑 | VitePress base 配置和仓库路径不一致 |

### Personal Access Token

| 项 | 内容 |
|---|---|
| 作用 | 用于 HTTPS Git 或 API 认证 |
| 推荐 | fine-grained、最小权限、设置过期 |
| AIOps 场景 | 本地 push、自动化脚本访问 GitHub |
| 常见坑 | token 泄露、权限过大、永不过期 |

### SSH Key

| 项 | 内容 |
|---|---|
| 作用 | 用 SSH 协议连接 GitHub |
| 关键点 | 私钥留本机，公钥放 GitHub |
| AIOps 场景 | 稳定 push/pull，避免 HTTPS token 输入 |
| 常见坑 | 把私钥提交到仓库，或 remote URL 与认证方式混用 |

### Repository Secret

| 项 | 内容 |
|---|---|
| 作用 | 给 Actions 保存敏感值 |
| 路径 | Repository settings -> Secrets and variables -> Actions |
| AIOps 场景 | 自动部署、调用外部服务 |
| 常见坑 | secrets 只在 workflow 中可用，不会自动出现在本地 |

### Branch Protection

| 项 | 内容 |
|---|---|
| 作用 | 保护主分支 |
| 常见规则 | require PR、require checks、require review |
| AIOps 场景 | 防止文档站主线被坏提交破坏 |
| 常见坑 | 规则太严但没有配置 CI，会导致自己也合不了 |

### Release

| 项 | 内容 |
|---|---|
| 作用 | 基于 tag 发布版本说明 |
| AIOps 场景 | 标记知识库阶段成果 |
| 常见坑 | 只打 tag 不写 release notes，别人看不懂变化 |

## AIOps 知识库仓库结构

推荐结构：

```text
zero-to-aiops/
  README.md
  docs/
    index.md
    tech-stack/
    projects/
    interview/
  labs/
    observability-compose/
    prometheus/
    grafana/
  scripts/
    alert_report.py
  .github/
    workflows/
      docs-build.yml
  package.json
  package-lock.json
```

每个目录的作用：

| 路径 | 作用 |
|---|---|
| `README.md` | 仓库首页导航 |
| `docs/` | 文档站源码 |
| `labs/` | 可运行实验 |
| `scripts/` | 自动化脚本 |
| `.github/workflows/` | CI/CD 自动化 |
| `package.json` | 文档站构建脚本 |

仓库要做到：

- 文档能读。
- 实验能跑。
- CI 能构建。
- README 能导航。
- 提交历史能证明持续学习。

## 入门实验：把 AIOps 知识库做成 GitHub 作品集

### 第 1 步：检查远程仓库

```bash
git remote -v
```

预期看到：

```text
origin  https://github.com/quweisheng/zero-to-aiops.git (fetch)
origin  https://github.com/quweisheng/zero-to-aiops.git (push)
```

如果是 SSH，也可能是：

```text
origin  git@github.com:quweisheng/zero-to-aiops.git (fetch)
```

### 第 2 步：整理 README

README 至少包含：

```markdown
# zero-to-aiops

## 目标

## 文档站

## 技术栈路线

## 可运行实验

## 本地开发

## 当前进度
```

### 第 3 步：创建 Issue

Issue 标题：

```text
深化 Prometheus 文档到官方知识地图粒度
```

内容：

```markdown
## 背景

当前 Prometheus 文档偏入门，需要补齐官方数据模型、PromQL、规则和排障。

## 验收标准

- [ ] 有官方知识地图
- [ ] 有数据模型说明
- [ ] 有 PromQL 字典
- [ ] 有实验
- [ ] npm run docs:build 通过
```

### 第 4 步：创建分支并提交

```bash
git switch -c docs/deepen-prometheus
git add docs/tech-stack/observability/prometheus.md
git commit -m "docs: deepen prometheus guide"
git push -u origin docs/deepen-prometheus
```

### 第 5 步：创建 PR

PR 描述：

```markdown
## Summary

- Added official knowledge map
- Expanded data model and metric types
- Added PromQL dictionary and AIOps lab

## Verification

- npm run docs:build
- git diff --check
```

### 第 6 步：配置 Actions 构建

`.github/workflows/docs-build.yml`：

```yaml
name: docs-build

on:
  pull_request:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run docs:build
```

### 第 7 步：发布 Pages

VitePress 文档站通常流程：

```text
push to main
  -> GitHub Actions build
  -> upload static artifact
  -> deploy to GitHub Pages
```

Pages 详细 workflow 在 VitePress 篇展开。这里先理解：GitHub Pages 让你的 Markdown 知识库变成公开网站。

## 常见故障排查

### push 被拒绝

现象：

```text
remote: Permission denied
```

检查：

```bash
git remote -v
git status
```

可能原因：

- 没有仓库权限。
- token 过期。
- SSH key 没添加到 GitHub。
- remote URL 指向错误仓库。
- branch protection 不允许直接 push。

### 反复要求输入账号密码

原因：

- HTTPS 认证没有正确缓存。
- token 没有保存到 credential manager。
- remote 用 HTTPS，但你以为自己在用 SSH。

检查：

```bash
git remote -v
```

处理：

- 使用 Git Credential Manager。
- 或切换 SSH remote。

### Actions 没有运行

检查：

- workflow 是否放在 `.github/workflows/`。
- 文件后缀是否是 `.yml` 或 `.yaml`。
- `on` 触发条件是否匹配当前事件。
- Actions 是否被仓库设置禁用。
- 默认分支是否正确。

### Actions 构建失败

排查：

- 查看失败 job。
- 展开失败 step。
- 本地运行同样命令，例如 `npm ci`、`npm run docs:build`。
- 检查 Node 版本。
- 检查 lockfile 是否提交。

### Pages 发布后 404

常见原因：

- Pages 没启用。
- 发布源选错。
- Actions 部署失败。
- VitePress `base` 配置不对。
- 仓库名路径和站点路径不匹配。

### README 图片不显示

检查：

- 图片路径大小写。
- 图片是否已提交。
- 相对路径是否正确。
- 文件名是否有空格或特殊字符。
- Markdown 语法是否正确。

### token 泄露

立刻处理：

1. Revoke token。
2. 从仓库历史中清理泄露内容。
3. 检查是否有异常提交或 Actions。
4. 重新生成最小权限 token。
5. 复盘为什么 token 会进入仓库。

## 典型故障排查表

| 现象 | 常见原因 | 检查入口 | 处理方向 |
|---|---|---|---|
| push 失败 | 权限、token、SSH、remote 错 | `git remote -v`、GitHub repo access | 修认证和权限 |
| PR 不能合并 | checks 失败、冲突、保护规则 | PR checks、Files changed | 修测试、解决冲突 |
| Actions 不触发 | workflow 路径或事件错误 | `.github/workflows`、Actions tab | 修 `on` 和文件路径 |
| Actions 构建失败 | 命令失败、依赖缺失、版本不匹配 | workflow logs | 本地复现并修复 |
| Pages 404 | 发布源、base、部署失败 | Pages settings、Actions | 修 Pages 配置 |
| README 不清晰 | 缺目标、运行方式、导航 | README | 按问题重写 |
| token 泄露 | 提交了凭证 | GitHub security alerts | revoke 并清理历史 |
| 图片不显示 | 路径、大小写、未提交 | README preview | 修路径并提交 |

## 学习路线

### 第 1 阶段：仓库能展示

- 创建仓库。
- 写 README。
- 推送本地提交。
- 确认网页能看到文档。

学习证据：仓库首页可读。

### 第 2 阶段：任务可追踪

- 使用 Issues。
- 使用 labels。
- 使用 milestones。
- 每个学习任务有验收标准。

学习证据：至少 5 个学习 Issues。

### 第 3 阶段：变更可 review

- 使用分支。
- 创建 PR。
- 写 summary 和 verification。
- 合并后删除分支。

学习证据：至少 3 个文档或实验 PR。

### 第 4 阶段：自动化可验证

- 添加 Actions workflow。
- 自动执行 `npm run docs:build`。
- PR 中展示 checks。

学习证据：Actions 构建通过截图。

### 第 5 阶段：成果可访问

- 发布 GitHub Pages。
- README 链接到文档站。
- Release 标记阶段成果。

学习证据：公开文档站 URL 和 release notes。

## 小白可能会问

### Git 和 GitHub 是一回事吗？

不是。Git 是版本控制工具，GitHub 是托管 Git 仓库并提供协作、自动化、Pages、安全等能力的平台。

### README 为什么这么重要？

因为 README 是别人进入仓库的第一眼。没有 README，别人不知道这个仓库是什么、怎么看、怎么跑、你完成了什么。

### 学习任务也要用 Issue 管吗？

建议用。Issue 能让学习从“脑子里想想”变成“有目标、有验收、有记录”。以后回看时，你能看到自己如何一步步推进。

### 一个人学习也要用 PR 吗？

可以用。PR 能训练你写变更说明、验证方式和风险说明。这是工程表达能力，不只是团队协作才需要。

### GitHub Actions 对知识库有什么用？

它能自动检查文档能不能构建。你以后改 Markdown、链接、VitePress 配置时，不用等部署后才发现坏了。

### GitHub Pages 对知识库有什么用？

它能把仓库里的 Markdown 文档发布成网站。面试或分享时，别人不需要 clone 仓库，直接看网站。

## 面试怎么讲

GitHub 对我来说不只是代码托管平台，也是 AIOps 学习作品集。我会把学习路线、技术栈深讲、Prometheus/Grafana/Docker Compose 实验配置、dashboard JSON、截图和自动化 workflow 放到仓库里。README 负责导航，Issues 负责跟踪学习任务，Pull Requests 负责说明和检查变更，Actions 负责自动构建文档站，Pages 负责公开发布。这样简历上的技术关键词能对应到真实仓库证据，而不是只停留在口头描述。

## 面试题

1. Git 和 GitHub 有什么区别？
2. Repository 在 GitHub 中承担什么角色？
3. README 应该包含哪些内容？
4. GitHub Flow 的步骤是什么？
5. Issue 和 Pull Request 分别解决什么问题？
6. 为什么一个人学习也可以使用 PR？
7. Branch protection 解决什么问题？
8. GitHub Actions 的 workflow、job、step、runner 分别是什么？
9. GitHub Pages 适合发布什么？
10. Personal Access Token 为什么要最小权限？
11. HTTPS token 和 SSH key 有什么区别？
12. Repository secrets 解决什么问题？
13. token 泄露后应该怎么处理？
14. Actions 构建失败应该怎么排查？
15. Pages 发布后 404 怎么排查？
16. 如何用 GitHub 展示 AIOps 学习成果？
17. 一个适合面试展示的 AIOps 仓库应该有哪些目录？
18. 为什么配置文件和 dashboard JSON 也应该纳入版本控制？
19. Dependabot、secret scanning、code scanning 分别有什么作用？
20. Release notes 对学习项目有什么价值？

## 学习检查清单

- [ ] 我能解释 Git 和 GitHub 的区别。
- [ ] 我能解释 repository、branch、commit、remote、PR 的关系。
- [ ] 我能创建或维护一个可读 README。
- [ ] 我能把本地提交推送到 GitHub。
- [ ] 我能用 Issue 管理学习任务。
- [ ] 我能用 labels 和 milestones 做分类。
- [ ] 我能按 GitHub Flow 创建分支、提交、PR、合并。
- [ ] 我能写清楚 PR summary 和 verification。
- [ ] 我能配置一个 GitHub Actions workflow 构建文档站。
- [ ] 我能解释 workflow、event、job、runner、step、action。
- [ ] 我能理解 GitHub Pages 的发布方式。
- [ ] 我能创建和安全使用 Personal Access Token。
- [ ] 我能解释 SSH key 的公钥和私钥。
- [ ] 我知道 token、私钥、生产配置不能提交。
- [ ] 我能说明 GitHub secrets 的作用。
- [ ] 我能用 GitHub 仓库展示 AIOps 文档、实验、截图和自动化。

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- 一个可读的 `README.md`。
- 至少 10 次有意义提交。
- 至少 5 个学习 Issue。
- 至少 3 个 Pull Request，PR 描述里包含 Summary 和 Verification。
- `.github/workflows/docs-build.yml`。
- Actions 构建通过截图。
- GitHub Pages 文档站入口。
- 一篇笔记：`GitHub Flow 如何用于个人学习项目.md`。
- 一篇排障记录：`GitHub Actions 构建失败怎么查.md`。

如果一个面试官打开你的仓库，能从 README 进入文档站，看到实验配置、Actions 构建、Issues 计划和持续提交记录，你的 GitHub 就不只是“代码网盘”，而是一个真正能证明学习能力和工程习惯的 AIOps 作品集。
