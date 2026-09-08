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
GitHub Docs（官方文档）
  ├── Get started（入门）
  │   ├── About GitHub and Git（平台与版本控制的关系）
  │   ├── GitHub flow（分支协作流程）
  │   ├── Connecting to GitHub（连接与认证）
  │   └── Writing on GitHub（平台写作）
  ├── Repositories（仓库）
  │   ├── create and manage repositories（创建与管理）
  │   ├── README（仓库说明）
  │   ├── branches and tags（分支与标签）
  │   ├── releases（发布说明与附件）
  │   └── repository settings（仓库设置）
  ├── Issues and Projects（问题追踪与项目管理）
  │   ├── issues（议题）
  │   ├── labels（分类标签）
  │   ├── milestones（里程碑）
  │   └── projects（项目看板）
  ├── Pull requests（合并请求，简称 PR）
  │   ├── create PR（提出变更）
  │   ├── review changes（审查变更）
  │   ├── checks（自动检查）
  │   ├── merge（合并）
  │   └── branch protection（分支保护）
  ├── Actions（自动化平台）
  │   ├── workflows（工作流）
  │   ├── events（触发事件）
  │   ├── jobs（作业）
  │   ├── steps（步骤）
  │   ├── runners（执行机器）
  │   ├── actions（可复用动作）
  │   └── secrets（机密变量）
  ├── Pages（静态网站托管）
  │   ├── publish static site（发布静态站点）
  │   ├── branch or Actions source（分支或工作流作为发布源）
  │   └── custom domains（自定义域名）
  ├── Authentication（身份认证）
  │   ├── passwordless HTTPS auth（不用账号密码的 Git 认证）
  │   ├── personal access tokens（个人访问令牌）
  │   ├── SSH keys（SSH 公私钥）
  │   └── credential storage（凭据保存）
  └── Code security（代码安全）
      ├── Dependabot（依赖更新与漏洞提醒）
      ├── secret scanning（机密扫描）
      ├── code scanning（代码扫描）
      └── security advisories（安全通告）
```

本篇按这个结构讲。你学完以后再看官方文档，会知道每块功能服务于什么学习和工程目标。

## GitHub 在 AIOps 学习链路中的位置

```text
local learning and labs（本地学习与实验）
  ├── notes（笔记）
  ├── configs（配置）
  ├── scripts（脚本）
  ├── dashboards（仪表盘）
  └── screenshots（截图）
        |
        v
Git commits（版本提交）
        |
        v
GitHub repository（远端仓库）
  ├── README（项目说明）
  ├── docs site（文档网站）
  ├── Issues（问题与任务）
  ├── Pull Requests（合并请求）
  ├── Actions（自动化工作流）
  ├── Pages（静态网站托管）
  └── Releases（版本发布）
        |
        v
public portfolio and interview evidence（公开作品与面试证据）
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
Git（本地版本控制工具）
  -> tracks file changes（追踪文件变更）
  -> commits（提交记录）
  -> branches（分支）
  -> merges（合并）

GitHub（远端代码协作平台）
  -> hosts remote repositories（托管远端仓库）
  -> shows README and code（展示项目说明和代码）
  -> manages Issues and PRs（管理议题与合并请求）
  -> runs Actions（执行自动化）
  -> publishes Pages（发布静态站点）
  -> manages permissions and security（管理权限与安全）
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
main（主分支）
  └── docs/deepen-grafana（用于深化文档的示例分支名）
      └── commits（提交记录）
      └── pull request（合并请求）
      └── merge back to main（合并回主分支）
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
create branch（创建分支）
  -> make changes（修改内容）
  -> commit and push（提交并推送）
  -> open pull request（发起合并请求）
  -> review and checks（评审与检查）
  -> merge（合并）
  -> delete branch（删除分支）
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
workflow（工作流）
  ├── event（触发事件）
  ├── jobs（作业）
  │   ├── runner（执行器）
  │   └── steps（步骤）
  │       ├── run command（运行命令）
  │       └── use action（调用动作）
  └── artifacts / cache / secrets（制品、缓存与秘密）
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
Markdown docs（文档源码）
  -> VitePress build（文档站构建）
  -> static files（静态文件）
  -> GitHub Pages（静态站托管）
  -> public docs site（公开文档网站）
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

GitHub 已不支持用账号密码进行 Git HTTPS 认证；使用受支持的凭据管理器或访问令牌。浏览器登录与 Git 认证不是同一条通道。

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
generate SSH key（生成连接密钥）
  -> add public key to GitHub（把公钥添加到平台）
  -> use SSH remote URL（使用安全连接的远端地址）
  -> push / pull（推送与拉取）
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
push to main（推送到主分支）
  -> GitHub Actions build（自动化构建）
  -> upload static artifact（上传静态制品）
  -> deploy to GitHub Pages（部署到静态托管）
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

## 老师带练：把一次告警规则修改追踪到底

假设你把支付服务的告警持续时间从 30 秒改成 2 分钟。我们不先讨论“在哪点 Merge”，先问：谁提出需求，修改的具体版本是什么，检查通过的是哪一个提交，线上究竟用了哪一版？Issue 记录为什么改，分支隔离正在做的改动，PR 把差异、讨论和检查放在同一个入口，发布记录说明最后交付了什么。GitHub 让这条链可审查，但不会替你证明阈值合理。

前面图里的 `local learning and labs` 是本地学习与实验，`Git commits` 是版本快照，`public portfolio and interview evidence` 是公开作品和面试证据。`push` 是发送 Git 对象与更新远程引用，`review` 是人工审查，`checks` 是机器检查，`merge` 是合并变更，`deploy` 才是把产物投入托管环境。不要把这些英文按钮理解成一组都叫“保存”的操作。

### PR 不是文件压缩包：它比较两条历史

PR 有 base（准备合入的目标分支）和 head（提供修改的来源分支）。你推送新的提交后，PR 差异与检查状态可能改变，因此“昨天有人批准过”不自动证明今天新增的代码也被审查。合并策略也不同：普通合并保留分支结构，压缩合并把变更压成一个提交，变基合并重放提交；选择要服从团队历史策略，不能只看哪个按钮最顺手。

必需检查（required checks）是合并门禁，不是测试内容本身。如果一个检查只运行 `echo ok`，它再绿也不能说明应用正确。检查还必须针对预期的提交或合并结果，并有稳定名称。高并发团队可能使用合并队列验证组合后的结果；不是说每个 PR 单独通过，合起来就一定通过。Ruleset（规则集）可以集中约束分支或标签，但可用能力取决于仓库可见性和套餐，先核对实际设置，不假定所有仓库相同。[GitHub 规则集](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)

### 基础实验与故障实验：看到红灯后能解释原因

本实验只在你有权限的全新练习仓库里做，不在团队主仓库临时关闭保护规则。前提：已登录 GitHub、仓库允许 Actions、能用网页编辑文件；不需要部署凭据。工作流会消耗少量运行额度，先确认账户允许。

1. 新建个人练习仓库 `github-change-lab`，初始化 README。创建文件 `threshold.txt`，内容单独一行 `5`。它表示练习用错误率阈值，不对应真实系统。
2. 在默认分支创建 `.github/workflows/rule-check.yml`，输入完整内容：

```yaml
name: Rule classroom
on:
  push:
  pull_request:
permissions:
  contents: read
jobs:
  validate-rule:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate threshold
        shell: bash
        run: |
          value=$(tr -d '\r\n' < threshold.txt)
          if [[ ! "$value" =~ ^[0-9]+$ ]]; then
            echo 'threshold must be an integer'
            exit 1
          fi
          if (( 10#$value < 1 || 10#$value > 20 )); then
            echo 'threshold must be within 1..20'
            exit 1
          fi
          echo "validated threshold=$value"
```

`permissions: contents: read` 只给读取代码权限；`exit 1` 让失败成为可被平台识别的退出状态；范围判断是业务约束，不是 GitHub 内置规则。`checkout@v4` 是本课示例主版本标签，不是宣称最新版本；生产按官方兼容信息升级，并在审查后固定完整提交 SHA（提交标识）。

3. 打开 Actions（工作流页面），找到此次提交对应的运行，确认 `validate-rule` 成功、日志有 `validated threshold=5`。记录提交号，不只截一张绿色图标。
4. 创建分支 `lab/invalid-threshold`，把文件改为 `99`，发起 PR 指向默认分支。预期检查失败，日志明确指出范围应为 1 到 20。不要添加 `continue-on-error` 绕过实验故障。
5. 在同一分支改为 `8` 并提交，确认新提交的检查成功，PR 差异只含预期文件。故障修复证据是“失败提交 → 失败步骤 → 修复提交 → 成功结果”，不是重复运行旧的错误提交。
6. 清理：这是练习，不需要合入主线；关闭 PR，确认该分支没有唯一需要保留的成果后删除练习分支。要停止后续运行可在练习仓库禁用这条工作流。保留脱敏截图与文字记录，不删除正式仓库。

若 Actions 没运行，先看文件位置、YAML 缩进、事件和仓库策略；若运行了但找不到文件，检查提交确实含 `threshold.txt`、checkout 是否成功；若“失败但还能合并”，说明你还没把它设为必需检查，这不代表测试无效，而是检查结果尚未连接门禁。管理员只在练习仓库配置对应规则后再验证阻止效果，不能口头假定保护已经存在。

### 安全和一致性：平台提供能力，维护者定义边界

Token（令牌）回答“你是谁、能做什么”，Secret（机密存储）回答“敏感值放哪里”，Environment（部署环境）及审批回答“什么时候允许部署”。三者不能互相替代。保存为 Secret 不保证不会被恶意脚本外传；获得机密的步骤与第三方动作都处在信任边界里。尤其不要用带高权限的 `pull_request_target` 去检出并执行未经信任的 PR 代码。[GitHub Actions 安全使用](https://docs.github.com/en/actions/reference/security/secure-use)

平台上的代码、Issue、PR、Actions 日志、Release 附件是不同的数据。`git clone --mirror` 备份 Git 引用与对象，并不等于备份全部项目管理记录或构建附件。设计灾备时先列明恢复对象、恢复点目标（最多能丢多久的数据）与恢复时间目标（允许停多久），再选择导出和保存方法。大二进制也不要不断塞进 Git 历史；分清源代码、Git LFS 大文件和制品存储，并核对配额与保留策略。

发布知识库还需要单独核验：远程主分支指向目标提交；对应部署工作流 `completed` 且 `success`；访问最终 URL，看见新标题、正文和搜索结果。仅 `push` 成功说明远程接收了提交，不说明 Pages 更新。若构建成功却网页旧，依次检查部署步骤、产物路径、站点配置、访问域名及缓存，再考虑修复；不要先用强推覆盖历史。

### 面试：30 秒、3 分钟与追问

30 秒可以这样说：Git 管版本历史，GitHub 提供围绕这份历史的协作、检查、权限和发布。我会把告警规则变更关联 Issue、PR、检查提交号和部署版本，并以实际页面或服务验证作为结束条件。

3 分钟答案再展开：讲清 base/head、审查与检查的区别、如何限制机密和部署权限、如何处理失败后重试与回退，最后展示上面的失败检查和修复证据。追问“批准以后有人再推一次怎么办”，应解释重新审查策略和检查必须覆盖最新变更；追问“代码托管平台暂时不可用怎么办”，应说明本地 Git 可以继续提交但不能假装远程 CI 已通过，关键发布依赖与恢复流程要预先设计；追问“攻击者能改 workflow 呢”，应讨论受保护分支、审查、可信来源、最小权限和环境批准，而不是只答“把密码放 Secrets”。

## 托管平台课堂：一次合并请求到底证明了什么

先把评审意见和自动检查分开。Review（评审）由人判断意图、设计与风险，Check（检查）由配置好的程序验证某些条件。两个人批准但没有运行测试，不等于测试通过；所有检查绿色，也可能没人发现授权设计有问题。一个可靠合并策略需要根据仓库风险组合两者，而不是只追求一个统一绿色图标。

老师会让你在 PR 页面核对 base 和 head。Base 是准备接收修改的目标分支，head 是提出修改的一侧。选错 base 时，差异可能包含不属于这次工作的提交；合并前不能只看新增行数，还要看提交列表和文件范围。若批准后又新增提交，是否重新要求批准和最新检查，由仓库规则决定，不能假设所有仓库默认一样。

保护规则的存在也不代表不存在例外。管理员、自动化身份、紧急通道可能具备不同能力；应明确谁能绕过、何时允许、如何留下记录。个人学习项目也可以模拟这个思想：正常改动走分支与检查，紧急修复写清原因，并补验证与复盘。不要为一次检查失败永久关闭整个仓库门禁。

### Issue、PR、Release 与部署是不同对象

Issue 描述问题与验收条件，PR 提出一组修改，Release 组织某个发布版本的说明与附件，Deployment 描述向环境交付的事件。把 Issue 关闭表示任务管理状态改变，不会自动证明网站已部署；创建 Release 也不等于生产环境开始使用附件。

例如任务是更新告警规则，Issue 写“规则必须识别连续五分钟错误率异常”，PR 包含配置和测试，Release 指向已验证产物，部署记录关联目标环境，最后查询实际规则加载版本。只有这条链连起来，任务完成才有充分证据。把所有信息塞进聊天记录，未来很难还原哪个版本被批准。

合并按钮提供不同策略时，要理解它们如何影响历史。普通合并、压缩合并与变基合并会产生不同的提交关系与 SHA；不能假设 PR 页面中的原始头提交一定就是主分支最终提交。发布验证应查询实际主分支与对应工作流的提交标识，再核对线上内容。

### Fork 与自动化的信任边界

Fork（分叉仓库）让外部贡献者在自己的仓库修改，再向上游提合并请求。贡献内容本质上可能运行任意构建脚本，所以拥有内网访问和生产秘密的执行器不能无条件运行它。事件类型、工作流来源、检出哪个提交、令牌权限及环境批准共同决定风险。

把秘密放在 Secrets 里比写入源码好，但不意味着任何拿到它的脚本都可信。代码可以不打印秘密，而是通过网络使用或传走它。发布身份应与普通检查身份分离，采用最小权限和必要的短期凭据；共享动作与依赖也需要版本审阅，不能因为仓库知名就忽视供应链风险。

OIDC（开放身份连接）允许工作流身份声明被云端信任策略验证后换取短期凭据。关键不是“有令牌”三个字，而是云端是否约束了正确仓库、分支或环境、受众与其他必要条件。宽泛信任整个组织仍可能超出预期范围。学习实验可以展示受限身份设计，不把真实云密钥上传为证据。

### Pages 发布为何还要打开页面验证

源码推送成功说明远端收到提交；构建成功说明生成步骤结束；部署成功说明平台接受并完成相关部署流程。用户能否访问正确路由、导航和新正文，是另一层验证。页面可能引用错误路径、旧索引或不匹配资源，首页能打开也不能代表所有技术文章都正常。

在本仓库工作时，先读取当前 `package.json` 和部署工作流：现在的站点使用 React/Vite 链路，历史 VitePress 示例用于理解文档站，不应据此上传已不再使用的目录。一次完整验收至少核对远端 SHA、该 SHA 的部署结果，以及具体更新页面中的代表性新内容。不要在正文没出现时直接归因于缓存并宣布完成。

旧页面标签页还可能继续使用上一版脚本。部署策略需要考虑资源保留与接口兼容，回滚应使用已验证的整套产物，而不是临时编辑线上单个文件。失败时记录实际 URL、时间、响应状态和版本线索，再区分构建、部署、路径和缓存各层。

### 平台数据的备份与可迁移性

普通 clone 保存 Git 对象与引用，并不自动保存全部 Issue、评审、工作流日志、制品、Secrets、Pages 配置和权限规则。Git LFS 内容还可能依赖独立存储。灾备要列数据类别，再选择对应导出或恢复方式；不能把“我有源码副本”说成“我能恢复整个协作平台”。

秘密通常不应通过导出明文备份，而应有受控密钥管理与重建权限流程。恢复之后不仅检查能否登录，还要检查受限用户能否做允许的事、能否被阻止做禁止的事。否则平台虽然恢复可用，却可能失去原来的权限边界。

### 作品集怎样体现真实能力

老师不要求你制造固定数量的 Issue 或 PR。真正有价值的是每个条目有明确问题、合理变更、验证结果和边界。例如一次故障实验失败后，你能说明观察、假设、检查、修复与恢复；一次发布能找到从提交到页面的证据。十个重复的“update”提交不一定比一个清晰改动更能说明能力。

公开仓库中的数据要虚构或脱敏，截图隐藏账号、内部地址和令牌，日志裁剪到必要错误与上下文。引用官方文档用于证明机制，实验记录用于证明自己实际验证，两者分开。面试时可以坦诚说“这是学习环境的复现”，不把教程设计包装成生产经历。

## GitHub 学习证据

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
