# GitHub Actions

> 目标：不是只会复制一段 `.github/workflows/*.yml`，而是能解释 GitHub Actions 如何从事件触发 workflow，如何把 job 分配到 runner，如何执行 step/action，如何传递变量、产物和权限，并能用日志定位失败原因。

## 官方资料

优先读这些官方资料：

- [GitHub Actions documentation](https://docs.github.com/actions)
- [Workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows)
- [Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [Using jobs in a workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs)
- [Choosing the runner for a job](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job)
- [Contexts reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)
- [Variables reference](https://docs.github.com/en/actions/reference/workflows-and-actions/variables)
- [Expressions](https://docs.github.com/en/actions/concepts/workflows-and-actions/expressions)
- [Using secrets in GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [Use GITHUB_TOKEN for authentication in workflows](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token)
- [Workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts)
- [Dependency caching](https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching)
- [Workflow commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)
- [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)

说明：本文按 GitHub 官方文档的概念结构整理，用原创中文讲解，不复制官方全文。

仓库边界：本站当前使用 React/Vite，`npm run docs:build` 是构建脚本别名，产物目录是 `dist`。下文提及 VitePress 的地方用于说明静态站点场景，不代表当前仓库仍以 VitePress 部署。示例中的 action 主版本用于教学，落地时请核验官方支持范围，并在生产按组织策略固定审核过的提交摘要。

## 场景开场

你维护一个 AIOps 知识库。每次改完文档，理论上都要做这些事：

1. 拉最新代码。
2. 安装依赖。
3. 本地运行 `npm run docs:build`。
4. 确认没有 Markdown、路由、代码块问题。
5. 推送到 GitHub。
6. 发布到 GitHub Pages。
7. 如果失败，查日志、修复、重新跑。

刚开始靠手工可以。文档一多，人一定会漏步骤。

GitHub Actions 的价值，是把这些重复步骤写成仓库里的自动化流程。以后每次 `push` 或打开 Pull Request，GitHub 自动起一台 runner，按 workflow 执行检查、构建、测试、打包、发布。

对 AIOps 来说，这不是“部署工具”这么简单。它是把“变更 -> 校验 -> 产物 -> 发布 -> 反馈”串起来的第一条自动化闭环。

## 一句话人话版

GitHub Actions 就是 GitHub 里的自动化执行平台：当仓库发生某个事件时，它读取 `.github/workflows/*.yml`，在 runner 机器上按 job 和 step 执行命令或 action。

## 小白可能会问

- workflow、event、job、runner、step、action 到底谁包着谁？
- 为什么 workflow 文件一定放在 `.github/workflows/`？
- `run` 和 `uses` 有什么区别？
- `actions/checkout` 为什么几乎每个 workflow 都要写？
- `ubuntu-latest` 是什么？它是我的服务器吗？
- `env`、`vars`、`secrets`、`github` context 有什么区别？
- `artifact` 和 `cache` 都能存文件，为什么不能混用？
- 为什么本地能构建，Actions 里失败？
- 为什么 Pages 发布需要 `contents: read`、`pages: write`、`id-token: write` 这种权限？
- 为什么 `pull_request_target` 很危险？

## 官方知识地图

GitHub Actions 官方文档大致可以按这张地图理解：

```text
GitHub Actions（平台自动化工作流）
  -> Workflows and actions（工作流与可复用动作）
     -> workflows（流程定义）
     -> actions（动作组件）
     -> variables（变量）
     -> contexts（上下文数据）
     -> expressions（表达式）
     -> artifacts（运行制品）
     -> cache（依赖缓存）
     -> reusable workflows（可复用工作流）
     -> environments（部署环境与审批边界）
     -> concurrency（并发控制）
  -> Runners（执行机器）
     -> GitHub-hosted runners（平台托管机器）
     -> larger runners（更大规格机器）
     -> self-hosted runners（自托管机器）
     -> runner groups（执行机器分组）
     -> Actions Runner Controller（在 Kubernetes 中管理执行器的控制器）
  -> Security（安全）
     -> secrets（机密值）
     -> GITHUB_TOKEN（任务临时凭据）
     -> permissions（权限）
     -> OIDC（开放身份连接：换取短期云凭据）
     -> secure use（安全使用）
     -> pull_request_target risk（目标分支上下文事件的风险）
  -> Manage workflow runs（管理运行实例）
     -> logs（日志）
     -> rerun（重新执行）
     -> cancel（取消）
     -> artifacts（制品）
     -> cache（缓存）
     -> debug logging（调试日志）
  -> Reference（参考手册）
     -> workflow syntax（工作流语法）
     -> events（触发事件）
     -> workflow commands（工作流命令协议）
     -> variables（变量）
     -> contexts（上下文）
     -> expressions（表达式）
     -> limits（额度与限制）
```

初学不要从所有 action 开始背。先把这条主线吃透：

```text
Event（触发事件）
  -> Workflow file（工作流文件）
  -> Job（任务）
  -> Runner（执行机器）
  -> Step（步骤）
  -> run command or uses action（执行命令或调用动作）
  -> Logs / artifact / status（日志、制品、状态）
```

## GitHub Actions 在 AIOps 链路中的位置

AIOps 不是只有模型和告警。真正的 AIOps 系统还需要稳定的工程链路：

```text
代码或配置变更
  -> GitHub push / Pull Request（源码推送或合并请求）
  -> GitHub Actions 自动检查
  -> 单元测试、文档构建、镜像构建、IaC plan
  -> 产物上传或部署
  -> 运行结果写入日志、通知、Issue、Dashboard
  -> 人或自动化系统继续处理
```

Actions 能支撑这些 AIOps 场景：

| 场景 | Actions 做什么 | 学到什么 |
|---|---|---|
| 文档知识库 | push 后自动构建 VitePress | 最基础的 CI |
| Python 告警脚本 | PR 时跑 lint、test | 质量门禁 |
| Docker 服务 | 构建镜像并上传 registry | 交付产物 |
| Terraform | PR 时跑 `terraform fmt`、`validate`、`plan` | 变更预演 |
| Kubernetes | 合并后部署到集群 | CD 和权限 |
| Runbook | 定时或手动触发诊断脚本 | 运维自动化 |
| 值班反馈 | 失败后发 Issue、通知或工单 | 自动闭环 |

## GitHub Actions 是什么

GitHub Actions 是 GitHub 内置的自动化平台。

它不是一台长期运行的服务器，也不是 Jenkins 的某个插件。你可以把它理解成：

1. GitHub 监听仓库事件。
2. 事件满足 workflow 里的 `on` 条件后，创建一次 workflow run。
3. workflow run 里有一个或多个 job。
4. 每个 job 被分配到一个 runner。
5. runner 拉取 job 定义，按顺序执行 step。
6. 每个 step 不是运行 shell 命令，就是调用 action。
7. 执行结果写回 GitHub，形成绿色成功、红色失败、黄色跳过等状态。

它适合做：

- CI：持续集成，比如测试、构建、格式检查。
- CD：持续交付/部署，比如发布 Pages、部署应用。
- 自动化任务：打标签、创建 Issue、定时清理、生成报告。
- 运维任务：手动触发 runbook、巡检、生成诊断 artifact。

它不适合做：

- 长期驻留服务。runner 是执行 job 的临时环境，不是业务服务器。
- 无限时长任务。Actions 有使用时长、并发、存储等限制。
- 存放生产密钥的唯一系统。生产认证更推荐 OIDC 短期凭证或专门密钥系统。
- 直接跑不可信代码并带写权限。尤其要小心 fork PR、`pull_request_target`、第三方 action。

## 核心执行模型

最重要的关系：

```text
Repository
  contains .github/workflows/*.yml

Event
  triggers Workflow

Workflow
  contains Jobs

Job
  runs on Runner
  contains Steps

Step
  runs shell command
  or uses Action

Action
  reusable unit
  may be JavaScript action, Docker action, or composite action
```

上图中 Repository 是仓库，contains 表示包含关系，triggers 表示触发；runs on 指任务被安排到某台执行机器，reusable unit 是可重复调用的动作单元。JavaScript、Docker 和 composite 分别表示脚本动作、容器动作与组合多个步骤的动作，它们不是三种任务调度系统。

### workflow run 是什么

一次 workflow 被触发后，就产生一个 workflow run。

比如你 push 了一次 commit，`Build docs` workflow 被触发，GitHub Actions 页面出现一条运行记录，这条记录就是 workflow run。

workflow run 里能看到：

- 触发事件：push、pull_request、workflow_dispatch 等。
- 分支和 commit SHA。
- 哪些 job 成功或失败。
- 每个 step 的日志。
- 上传的 artifact。
- 使用的 runner。
- 总耗时。

### job 是什么

job 是 workflow 里的一个执行单元。

一个 job 有自己的 runner。默认情况下，多个 job 会并行跑，除非用 `needs` 指定依赖。

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "build"

  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
```

上面 `build` 和 `test` 默认可以并行。

如果要 test 等 build 成功：

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "build"

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "test after build"
```

### step 是什么

step 是 job 里的具体步骤。

step 有两种常见写法：

```yaml
steps:
  - name: Run shell command
    run: npm run docs:build

  - name: Checkout repository
    uses: actions/checkout@v4
```

`run` 表示在 runner 的 shell 里执行命令。

`uses` 表示调用一个 action。

### runner 是什么

runner 是执行 job 的机器。

常见写法：

```yaml
runs-on: ubuntu-latest
```

这表示让 GitHub 提供一台 Ubuntu runner 来跑这个 job。

runner 类型：

| 类型 | 是什么 | 适合 |
|---|---|---|
| GitHub-hosted runner | GitHub 托管的临时虚拟机或运行环境 | 开源项目、普通 CI、文档构建 |
| Larger runner | 更大规格的 GitHub 托管 runner | 大型编译、更多 CPU/内存 |
| Self-hosted runner | 你自己提供的机器 | 访问内网、特殊环境、私有硬件 |
| ARC runner | 用 Actions Runner Controller 在 Kubernetes 中弹性创建 runner | 企业级 runner 池 |

初学阶段优先用 `ubuntu-latest`。等需要访问内网、私有集群或特殊工具时，再学 self-hosted runner。

## workflow 文件结构

workflow 文件放在：

```text
.github/workflows/<name>.yml
.github/workflows/<name>.yaml
```

一个最小 workflow：

```yaml
name: Check

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - name: Print message
        run: echo "hello aiops"
```

## Event 触发器

event 是 workflow 的入口。

官方支持很多事件，初学先掌握这些：

| Event | 什么时候触发 | 常见用途 |
|---|---|---|
| `push` | 有 commit push 到仓库 | 构建、测试、发布 |
| `pull_request` | PR 打开、更新、重新打开等 | PR 检查 |
| `workflow_dispatch` | 手动点击 Run workflow 或 API 触发 | 手动 runbook、临时任务 |
| `schedule` | 按 cron 定时触发 | 每日巡检、定时报表 |
| `release` | 创建或发布 release | 打包发布 |
| `workflow_call` | 被另一个 workflow 调用 | 复用流水线 |
| `repository_dispatch` | 外部系统通过 API 触发 | 外部告警触发自动化 |
| `workflow_run` | 另一个 workflow 完成后触发 | 分阶段发布 |

### push

```yaml
on:
  push:
    branches:
      - main
    paths:
      - "docs/**"
      - "package.json"
      - "package-lock.json"
```

含义：

- 只有 push 到 `main` 才触发。
- 只有改动匹配 `paths` 时才触发。
- 对文档站来说，改 `docs/**` 或依赖文件才构建，可以少跑无关任务。

### pull_request

```yaml
on:
  pull_request:
    branches:
      - main
    paths:
      - "docs/**"
```

含义：

- PR 目标分支是 `main` 时触发。
- 用于合并前检查。
- 适合跑测试、构建、lint、预览。

注意：来自 fork 的 PR 权限更受限制，secrets 通常不可用。这是安全设计。

### workflow_dispatch

```yaml
on:
  workflow_dispatch:
    inputs:
      target:
        description: "Target environment"
        required: true
        type: choice
        options:
          - dev
          - prod
```

含义：

- 允许在 Actions 页面手动点 Run workflow。
- 可以输入参数。
- 适合手动巡检、重新发布、临时诊断。

在 step 里读取：

```yaml
run: echo "target=${{ inputs.target }}"
```

### schedule

```yaml
on:
  schedule:
    - cron: "0 2 * * *"
```

含义：

- 使用 cron 表达式。
- 常用于每天定时检查、生成报表。
- 需要注意 GitHub 使用 UTC 时间，不是北京时间。

如果想北京时间每天 10:00 跑，UTC 是 02:00：

```yaml
on:
  schedule:
    - cron: "0 2 * * *"
```

### repository_dispatch

```yaml
on:
  repository_dispatch:
    types: [aiops-alert]
```

含义：

- 让外部系统通过 GitHub API 触发 workflow。
- 适合告警系统触发诊断 runbook。

例如外部告警平台发现服务错误率高，可以调用 GitHub API，让 Actions 跑一段诊断脚本，收集日志和指标。

## YAML 基础和常见坑

GitHub Actions workflow 使用 YAML。

### 缩进

YAML 靠缩进表达层级：

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "ok"
```

错一个缩进，含义就变了。

### 列表

列表用 `-`：

```yaml
branches:
  - main
  - release/*
```

也可以短写：

```yaml
branches: [main, "release/*"]
```

### 字符串

普通字符串可以不加引号：

```yaml
runs-on: ubuntu-latest
```

包含 `*`、`!`、<code v-pre>${{ }}</code>、冒号、特殊字符时，建议加引号：

```yaml
branches:
  - "release/*"
```

### 多行命令

用 `|` 写多行 shell：

```yaml
steps:
  - name: Build and inspect
    run: |
      npm ci
      npm run docs:build
      ls -la dist
```

含义：这三行会在同一个 step 的 shell 里顺序执行。

## Jobs 深讲

job 是 workflow 的主要执行块。

```yaml
jobs:
  build-docs:
    name: Build docs
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run docs:build
```

字段解释：

| 字段 | 含义 | AIOps 里的用法 |
|---|---|---|
| `build-docs` | job id | 给 `needs`、日志和状态引用 |
| `name` | UI 展示名 | 让人看得懂 |
| `runs-on` | 选择 runner | 普通构建用 Ubuntu |
| `timeout-minutes` | 超时时间 | 防止任务卡死浪费资源 |
| `steps` | 步骤列表 | 安装依赖、构建、上传产物 |

### job id 和 name 的区别

```yaml
jobs:
  build_docs:
    name: Build VitePress docs
```

`build_docs` 是机器读的 id。

`Build VitePress docs` 是人看的名字。

后续依赖要写 id：

```yaml
deploy:
  needs: build_docs
```

### needs

`needs` 用来指定 job 依赖。

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "build"

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "deploy after build"
```

如果 `build` 失败，`deploy` 默认不会跑。

这正好符合 CI/CD 的门禁逻辑：构建失败就不要发布。

### if

`if` 可以控制 job 或 step 是否执行。

```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "deploy only on main"
```

含义：只有 main 分支才部署。

step 级别：

```yaml
steps:
  - name: Upload logs when failed
    if: failure()
    run: echo "collect logs"
```

常用状态函数：

| 函数 | 意思 |
|---|---|
| `success()` | 前面步骤成功 |
| `failure()` | 前面有失败 |
| `cancelled()` | workflow 被取消 |
| `always()` | 无论成功失败都运行 |

### matrix

matrix 用来让同一个 job 按多组变量重复运行。

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
```

含义：

- GitHub 会生成两个 job 变体。
- 一个用 Node 20。
- 一个用 Node 22。
- 任何一个失败，整体检查就失败。

AIOps 用法：

- 多 Python 版本测试诊断脚本。
- 多 Node 版本测试文档构建。
- 多操作系统测试命令兼容性。
- 多 Kubernetes 版本测试部署模板。

### outputs

job 可以把结果传给后续 job。

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact-name: ${{ steps.meta.outputs.name }}
    steps:
      - id: meta
        run: echo "name=docs-dist" >> "$GITHUB_OUTPUT"

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "artifact=${{ needs.build.outputs.artifact-name }}"
```

关键点：

- step 要有 `id`。
- 用 `$GITHUB_OUTPUT` 写 step output。
- job 的 `outputs` 再引用 step output。
- 下游 job 用 `needs.<job_id>.outputs.<name>` 读取。

## Runner 深讲

runner 是真正执行命令的环境。

```yaml
runs-on: ubuntu-latest
```

这句话不是“部署到 Ubuntu”，而是“用 GitHub 提供的一台 Ubuntu runner 来执行这个 job”。

### GitHub-hosted runner 的特点

- 每个 job 是相对干净的新环境。
- job 结束后环境销毁。
- 预装常用工具。
- 不能假设上一次 job 的文件还在。
- 如果要保存文件，必须用 artifact、cache 或上传到外部系统。

所以这个 workflow：

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "hello" > result.txt

  read:
    runs-on: ubuntu-latest
    steps:
      - run: cat result.txt
```

`read` 大概率失败，因为它是另一个 job、另一个 runner，拿不到 `build` 里的文件。

要传文件，使用 artifact。

### self-hosted runner

self-hosted runner 是你自己提供的机器。

适合：

- 访问内网 Kubernetes。
- 访问私有数据库。
- 使用公司内网工具。
- 需要特殊硬件或软件。

风险：

- 不像 GitHub-hosted runner 那样天然临时干净。
- 如果跑了不可信代码，机器可能被持久污染。
- secrets 可能泄漏。
- 多仓库共享 runner 时风险范围更大。

初学不要急着上 self-hosted runner。先用 GitHub-hosted runner 把 CI/CD 模型学明白。

## Steps、run、uses

step 是 job 的最小可见执行单位。

### run

`run` 执行 shell 命令：

```yaml
steps:
  - name: Print workspace
    run: pwd

  - name: Build docs
    run: npm run docs:build
```

默认 shell 和操作系统有关：

- Ubuntu/macOS 常用 bash。
- Windows 常用 PowerShell。

你可以显式指定：

```yaml
steps:
  - name: Use bash
    shell: bash
    run: |
      set -euo pipefail
      npm ci
      npm run docs:build
```

### uses

`uses` 调用 action：

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 22
      cache: npm
```

`actions/checkout@v4` 的意思：

| 片段 | 含义 |
|---|---|
| `actions` | GitHub 组织名 |
| `checkout` | action 仓库名 |
| `@v4` | 使用 v4 版本 |

为什么几乎都要 `checkout`？

runner 启动时不自动带你的仓库文件。要让 runner 看到代码，需要先 checkout。

如果没有 checkout：

```yaml
steps:
  - run: npm ci
```

通常会失败，因为当前目录没有 `package.json`。

### with

`with` 给 action 传输入参数：

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
```

含义：

- 安装或选择 Node 22。
- 为 npm 依赖启用缓存。

不同 action 支持的 `with` 参数不同，要看该 action 的 README。

### env

step 可以设置环境变量：

```yaml
steps:
  - name: Use env
    env:
      APP_ENV: dev
    run: echo "$APP_ENV"
```

job 也可以设置：

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
    steps:
      - run: echo "$NODE_ENV"
```

workflow 顶层也可以设置：

```yaml
env:
  DOCS_DIR: docs
```

优先级一般是：step env > job env > workflow env。

## Contexts

context 是 GitHub Actions 提供的一组结构化运行时信息。

常见 context：

| Context | 包含什么 | 例子 |
|---|---|---|
| `github` | 本次 workflow run 和仓库事件信息 | `github.ref`、`github.sha`、`github.repository` |
| `env` | workflow/job/step 定义的环境变量 | `env.DOCS_DIR` |
| `vars` | 仓库、组织、环境级配置变量 | `vars.DEPLOY_TARGET` |
| `secrets` | 可用 secrets | `secrets.NPM_TOKEN` |
| `runner` | 当前 runner 信息 | `runner.os` |
| `job` | 当前 job 信息 | `job.status` |
| `steps` | 已执行 step 的输出和结论 | `steps.build.outputs.path` |
| `matrix` | matrix 当前组合 | `matrix.node-version` |
| `needs` | 依赖 job 的结果和输出 | `needs.build.result` |
| `inputs` | 手动触发或复用 workflow 的输入 | `inputs.target` |

读取 context 使用表达式语法：

```yaml
run: echo "sha=${{ github.sha }}"
```

### github context

常用字段：

| 字段 | 意思 |
|---|---|
| `github.repository` | 仓库名，例如 `quweisheng/zero-to-aiops` |
| `github.ref` | Git ref，例如 `refs/heads/main` |
| `github.ref_name` | 短分支或 tag 名，例如 `main` |
| `github.sha` | 当前 commit SHA |
| `github.event_name` | 触发事件名 |
| `github.actor` | 触发人 |
| `github.workflow` | workflow 名称 |
| `github.run_id` | workflow run id |
| `github.workspace` | runner 上的仓库工作目录 |

示例：

```yaml
steps:
  - name: Print run metadata
    run: |
      echo "repo=${{ github.repository }}"
      echo "ref=${{ github.ref }}"
      echo "sha=${{ github.sha }}"
      echo "actor=${{ github.actor }}"
```

### runner context

```yaml
steps:
  - name: Print runner
    run: |
      echo "os=${{ runner.os }}"
      echo "arch=${{ runner.arch }}"
      echo "temp=${{ runner.temp }}"
```

用于判断当前环境、输出诊断信息。

### needs context

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      status: ${{ steps.meta.outputs.status }}
    steps:
      - id: meta
        run: echo "status=ok" >> "$GITHUB_OUTPUT"

  report:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "build status=${{ needs.build.outputs.status }}"
```

用于跨 job 传递状态。

## Expressions

expression 用 <code v-pre>${{ ... }}</code> 表示。

它能做：

- 读取 context。
- 做条件判断。
- 拼字符串。
- 调用函数。
- 生成 cache key。
- 根据分支决定是否运行。

### 条件判断

```yaml
if: github.ref == 'refs/heads/main'
```

### contains

```yaml
if: contains(github.event.head_commit.message, '[deploy]')
```

含义：commit message 包含 `[deploy]` 才运行。

### startsWith

```yaml
if: startsWith(github.ref, 'refs/tags/v')
```

含义：只有 `v` 开头的 tag 才运行。

### 拼接字符串

```yaml
env:
  IMAGE_TAG: ${{ github.ref_name }}-${{ github.sha }}
```

### hashFiles

常用于 cache key：

```yaml
key: npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

含义：

- 操作系统不同，缓存分开。
- `package-lock.json` 变了，缓存 key 变。

### 不可信输入

任何来自 Issue、PR title、commit message、branch name 的内容，都可能被攻击者控制。

危险例子：

```yaml
run: echo "${{ github.event.pull_request.title }}"
```

如果把不可信输入拼到 shell 命令里，就可能变成脚本注入。

更稳的写法是先放到环境变量，并加引号使用：

```yaml
env:
  PR_TITLE: ${{ github.event.pull_request.title }}
run: |
  printf '%s\n' "$PR_TITLE"
```

## Variables、env、secrets

这几个概念很容易混。

| 名称 | 放什么 | 是否敏感 | 在哪里配置 |
|---|---|---|---|
| `env` | 当前 workflow/job/step 的普通环境变量 | 否 | workflow YAML |
| default environment variables | GitHub 自动提供的变量 | 否 | GitHub 自动注入 |
| `vars` | 仓库/组织/环境级普通配置 | 否 | Settings |
| `secrets` | 密码、token、私钥等敏感值 | 是 | Settings -> Secrets and variables |

### env

```yaml
env:
  DOCS_DIR: docs

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "$DOCS_DIR"
```

### vars

`vars` 适合放非敏感配置：

```yaml
env:
  DEPLOY_TARGET: ${{ vars.DEPLOY_TARGET }}
```

比如：

- `DEPLOY_TARGET=prod`
- `REGION=ap-southeast-1`
- `DOCS_BASE=/zero-to-aiops/`

### secrets

secrets 适合放敏感信息：

```yaml
env:
  API_TOKEN: ${{ secrets.API_TOKEN }}
```

原则：

- 不要把 secrets 写进仓库。
- 不要把 secrets echo 到日志。
- 不要把 secrets 传给不可信脚本。
- 尽量用最小权限 token。
- 能用 OIDC 短期凭证时，不要长期保存云厂商密钥。

### GITHUB_TOKEN

`GITHUB_TOKEN` 是 GitHub Actions 为每个 job 提供的临时凭据；它不是你的个人密码，各任务权限应分别收窄。

常见用途：

- 调用 GitHub API。
- 创建 Issue。
- 评论 PR。
- 上传 Pages。
- 读取仓库内容。

读取方式：

```yaml
env:
  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

更重要的是权限：

```yaml
permissions:
  contents: read
  issues: write
```

这表示：

- 可以读取仓库内容。
- 可以写 Issue。
- 没写的权限通常不给。

这叫最小权限原则。

## permissions

`permissions` 控制 `GITHUB_TOKEN` 能做什么。

顶层权限：

```yaml
permissions:
  contents: read
```

所有 job 默认只有这些权限。

job 级权限：

```yaml
jobs:
  create-issue:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - run: gh issue create --repo "$GITHUB_REPOSITORY" --title "AIOps report" --body "done"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Pages 发布常见权限：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

含义：

| 权限 | 意思 |
|---|---|
| `contents: read` | 读取仓库代码 |
| `pages: write` | 发布 GitHub Pages |
| `id-token: write` | 获取 OIDC token，供 Pages 部署认证使用 |

安全习惯：

- 不要一上来写 `write-all`。
- 不需要权限时可以写 `permissions: {}`。
- 每个 job 按实际需要单独授权。
- PR from fork 通常拿不到写权限和 secrets，这是正常现象。

## Artifacts

artifact 是 workflow 产生的文件。

适合保存：

- 构建后的静态站点。
- 测试报告。
- 覆盖率报告。
- 截图。
- 日志。
- 诊断结果。

上传 artifact：

```yaml
steps:
  - uses: actions/upload-artifact@v4
    with:
      name: docs-dist
      path: dist
```

下载 artifact：

```yaml
steps:
  - uses: actions/download-artifact@v4
    with:
      name: docs-dist
      path: dist
```

核心理解：

```text
job A 生成文件
  -> upload-artifact（上传作业制品的动作）
  -> GitHub 存储
  -> job B download-artifact（下游作业下载制品）
  -> 继续使用
```

artifact 是“结果产物”，不是依赖缓存。

## Cache

cache 用来复用依赖，加快 workflow。

例如 npm：

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
```

更底层的缓存写法：

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      npm-${{ runner.os }}-
```

artifact 和 cache 区别：

| 项目 | Artifact | Cache |
|---|---|---|
| 用途 | 保存 job 产物 | 复用依赖 |
| 例子 | dist、报告、日志 | npm 缓存、pip 缓存 |
| 生命周期 | 给人看或给后续 job 用 | 给后续 run 加速 |
| key | 通常用名字 | 通常用 lockfile hash |
| 能否替代 | 不应替代 cache | 不应替代 artifact |

## Workflow commands

workflow command 是 step 与 runner 通信的机制。

常见用法不是直接写 `::command::`，而是写环境文件。

### 设置后续 step 的环境变量

```yaml
steps:
  - name: Set environment
    run: echo "DOCS_STATUS=ok" >> "$GITHUB_ENV"

  - name: Read environment
    run: echo "$DOCS_STATUS"
```

### 设置 step output

```yaml
steps:
  - id: meta
    run: echo "version=1.0.0" >> "$GITHUB_OUTPUT"

  - run: echo "version=${{ steps.meta.outputs.version }}"
```

### 添加 job summary

```yaml
steps:
  - name: Summary
    run: |
      echo "## AIOps Docs Build" >> "$GITHUB_STEP_SUMMARY"
      echo "- status: success" >> "$GITHUB_STEP_SUMMARY"
```

job summary 会显示在 Actions 页面，比让人翻日志更友好。

## Concurrency

concurrency 控制并发。

如果连续 push 多次，旧的构建可能还没跑完，新的又来了。对 Pages 发布来说，通常只需要最新一次。

```yaml
concurrency:
  group: docs-${{ github.ref }}
  cancel-in-progress: true
```

含义：

- 同一个分支只保留一条正在运行的 docs workflow。
- 新 run 来了，取消旧 run。

部署类 workflow 建议加 concurrency，避免两个部署同时写同一个环境。

## Environments

environment 表示部署目标，比如 `dev`、`staging`、`production`。

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - run: echo "deploy"
```

environment 可以配置：

- required reviewers：部署前需要审批。
- wait timer：等待一段时间再部署。
- deployment branches：限制哪些分支能部署。
- environment secrets：只有部署到该环境的 job 能读。
- environment variables：环境级变量。

AIOps 用法：

- `dev` 自动部署。
- `prod` 需要人工审批。
- prod 的 token 只放在 production environment secrets。
- 诊断脚本按 environment 选择集群或服务。

## Reusable workflows

如果多个仓库都要跑同样流程，可以把 workflow 做成可复用。

被调用的 workflow：

```yaml
name: Reusable docs build

on:
  workflow_call:
    inputs:
      node-version:
        required: false
        type: string
        default: "22"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: npm
      - run: npm ci
      - run: npm run docs:build
```

调用方：

```yaml
jobs:
  docs:
    uses: ./.github/workflows/reusable-docs.yml
    with:
      node-version: "22"
```

适合：

- 多个服务共享 CI 模板。
- 多个文档站共享构建流程。
- 平台团队提供统一发布流水线。

## Custom actions

action 是可复用步骤。

三类常见 action：

| 类型 | 文件/运行方式 | 适合 |
|---|---|---|
| JavaScript action | Node.js 运行 | 调 GitHub API、处理数据 |
| Docker action | 容器运行 | 固定复杂环境 |
| Composite action | 多个 step 组合 | 封装 shell 流程 |

初学最常用第三方 action 和官方 action：

- `actions/checkout`
- `actions/setup-node`
- `actions/upload-artifact`
- `actions/download-artifact`
- `actions/cache`
- `actions/configure-pages`
- `actions/upload-pages-artifact`
- `actions/deploy-pages`

什么时候自己写 action？

- 同一组 step 在多个 workflow 重复出现。
- 想把复杂脚本封装成一个稳定接口。
- 想给团队复用。

初学阶段不要急着写 custom action。先把 workflow、job、step、权限、日志学清楚。

## 静态知识库构建 workflow

下面是适合独立静态知识库的最小构建检查；若用于本站，路径过滤还应覆盖 `src/**`、`public/**` 和相关构建配置，否则界面代码修改可能漏检：

```yaml
name: Build docs

on:
  push:
    branches: [main]
    paths:
      - "docs/**"
      - "package.json"
      - "package-lock.json"
      - ".github/workflows/docs-build.yml"
  pull_request:
    branches: [main]
    paths:
      - "docs/**"
      - "package.json"
      - "package-lock.json"
      - ".github/workflows/docs-build.yml"
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: docs-build-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    name: Build VitePress
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build docs
        run: npm run docs:build

      - name: Upload dist
        uses: actions/upload-artifact@v4
        with:
          name: docs-dist
          path: dist
```

你应该能解释：

- 为什么 PR 也要跑：合并前发现文档构建错误。
- 为什么 `permissions: contents: read`：构建只需要读仓库。
- 为什么加 `paths`：减少无关运行。
- 为什么加 `concurrency`：连续 push 时保留最新 run。
- 为什么上传 artifact：失败排查或后续部署可用。

## GitHub Pages 发布 workflow

VitePress 发布到 GitHub Pages 的典型结构：

```yaml
name: Deploy docs

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

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

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

执行链路：

```text
push main（推送主分支）
  -> build job（构建作业）
     -> checkout（检出代码）
     -> setup node（准备脚本运行时）
     -> npm ci（按依赖锁文件安装）
     -> npm run docs:build（执行项目定义的文档构建别名）
     -> upload pages artifact（上传网站部署制品）
  -> deploy job（部署作业）
     -> deploy-pages（部署静态网站的动作）
  -> GitHub Pages 更新
```

常见失败点：

| 失败点 | 现象 | 排查 |
|---|---|---|
| Pages 设置不是 GitHub Actions | workflow 成功但页面不更新 | Settings -> Pages |
| `base` 配错 | 页面资源 404 | 检查 VitePress `base` |
| artifact 路径错 | deploy 找不到文件 | 检查实际构建输出 `dist` |
| 权限不够 | 403 或 deployment failed | 检查 `pages: write`、`id-token: write` |
| 构建失败 | build job 红色 | 看 `npm run docs:build` 日志 |

## AIOps Runbook workflow 示例

用手动触发模拟一次诊断 runbook：

```yaml
name: AIOps diagnostic

on:
  workflow_dispatch:
    inputs:
      service:
        description: "Service name"
        required: true
        type: string
      window:
        description: "Time window"
        required: true
        type: choice
        options:
          - 15m
          - 1h
          - 6h

permissions:
  contents: read
  issues: write

jobs:
  diagnose:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - name: Generate diagnostic report
        env:
          DIAGNOSTIC_SERVICE: ${{ inputs.service }}
          DIAGNOSTIC_WINDOW: ${{ inputs.window }}
        run: |
          mkdir -p reports
          {
            echo "# AIOps Diagnostic Report"
            echo ""
            printf -- '- service: %s\n' "$DIAGNOSTIC_SERVICE"
            printf -- '- window: %s\n' "$DIAGNOSTIC_WINDOW"
            echo "- commit: ${{ github.sha }}"
            echo "- run: ${{ github.run_id }}"
          } > reports/diagnostic.md

      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: aiops-diagnostic
          path: reports/diagnostic.md

      - name: Add summary
        run: |
          cat reports/diagnostic.md >> "$GITHUB_STEP_SUMMARY"
```

这个例子还没有真的连 Prometheus、Loki、Kubernetes，但它已经具备 runbook 形态：

- 人手动选择服务和时间窗口。
- workflow 生成诊断报告。
- 报告以 artifact 和 summary 保存。
- 后续可以扩展成查询 Prometheus、拉 Loki 日志、创建 Issue。

## 常用字段字典

| 字段 | 位置 | 意思 | 例子 |
|---|---|---|---|
| `name` | workflow/job/step | 展示名 | `name: Build docs` |
| `on` | workflow 顶层 | 触发事件 | `on: push` |
| `permissions` | workflow/job | `GITHUB_TOKEN` 权限 | `contents: read` |
| `concurrency` | workflow/job | 并发控制 | `cancel-in-progress: true` |
| `env` | workflow/job/step | 环境变量 | `NODE_ENV: production` |
| `defaults` | workflow/job | 默认 shell/working directory | `defaults.run.shell: bash` |
| `jobs` | workflow 顶层 | job 集合 | `jobs.build` |
| `runs-on` | job | runner 选择 | `ubuntu-latest` |
| `needs` | job | job 依赖 | `needs: build` |
| `if` | job/step | 条件执行 | `if: github.ref == 'refs/heads/main'` |
| `timeout-minutes` | job/step | 超时 | `timeout-minutes: 10` |
| `strategy.matrix` | job | 多组合运行 | Node 20/22 |
| `steps` | job | step 列表 | checkout、build |
| `run` | step | 执行 shell 命令 | `npm ci` |
| `uses` | step/job | 调用 action 或 reusable workflow | `actions/checkout@v4` |
| `with` | step/job | 给 action 传参 | `node-version: 22` |
| `id` | step | 给 step 设置 id | `id: meta` |
| `outputs` | job/action | 输出值 | `needs.build.outputs.version` |
| `environment` | job | 部署环境 | `production` |
| `services` | job | 服务容器 | PostgreSQL、Redis |
| `container` | job | 让 job 在容器中运行 | `node:22` |

## 常用命令字典

下面这些是 GitHub CLI `gh` 命令。使用前需要安装 `gh` 并登录。

### gh auth login

```bash
gh auth login
```

作用：登录 GitHub CLI。

用于：

- 本地触发 workflow。
- 查看 run。
- 管理 secrets。
- 下载 artifact。

### gh workflow list

```bash
gh workflow list
```

作用：列出仓库 workflow。

常看字段：

- workflow 名字。
- 状态是否 active。
- workflow id。

### gh workflow view

```bash
gh workflow view "Build docs"
```

作用：查看某个 workflow 的信息。

### gh workflow run

```bash
gh workflow run "AIOps diagnostic" -f service=api -f window=1h
```

作用：手动触发带 `workflow_dispatch` 的 workflow。

含义：

- `-f service=api` 传输入参数。
- `-f window=1h` 传诊断窗口。

### gh run list

```bash
gh run list --limit 10
```

作用：查看最近 workflow runs。

常用：

```bash
gh run list --workflow "Build docs"
gh run list --branch main
gh run list --status failure
```

### gh run view

```bash
gh run view '<run-id>'
```

作用：查看某次 run 详情。以下命令中的整个 `<run-id>` 都要替换为已核对仓库和用途的运行编号，保留单引号；重跑和取消操作还要确认授权，不能直接执行占位示例。

带日志：

```bash
gh run view '<run-id>' --log
```

### gh run watch

```bash
gh run watch '<run-id>'
```

作用：实时等待 run 完成。

### gh run rerun

```bash
gh run rerun '<run-id>'
```

作用：重新运行某次 workflow run。

适合临时网络失败、外部服务抖动后重试。

### gh run cancel

```bash
gh run cancel '<run-id>'
```

作用：取消正在运行的 run。

### gh run download

```bash
gh run download '<run-id>' -n docs-dist
```

作用：下载 artifact。

### gh secret list

```bash
gh secret list
```

作用：列出仓库 secrets 名称。

注意：只能看到名字，看不到值。

### gh secret set

```bash
gh secret set API_TOKEN
```

作用：设置 secret。命令会提示输入值。

从文件读取：

```bash
gh secret set API_TOKEN < token.txt
```

### gh cache list

```bash
gh cache list
```

作用：查看 Actions cache。

### gh cache delete

```bash
gh cache delete '<cache-id>'
```

作用：删除 cache。先从缓存列表核对目标，把整个 `<cache-id>` 换成待删除缓存的编号并保留单引号；不要把运行编号和缓存编号混用。

适合缓存污染时清理。

## 入门实验 1：最小 workflow

目标：让你第一次看到 Actions 自动运行。

创建文件：

```text
.github/workflows/hello.yml
```

内容：

```yaml
name: Hello Actions

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - name: Print context
        run: |
          echo "repository=${{ github.repository }}"
          echo "ref=${{ github.ref }}"
          echo "sha=${{ github.sha }}"
          echo "runner=${{ runner.os }}"
```

操作：

1. 提交并 push。
2. 打开 GitHub 仓库。
3. 进入 Actions。
4. 找到 `Hello Actions`。
5. 点进去看 job 和 step 日志。

你要能说清：

- 是 `push` 触发了 workflow。
- `hello` job 跑在 `ubuntu-latest`。
- step 通过 context 打印了仓库、分支、commit、runner。

## 入门实验 2：构建 VitePress 文档

创建：

```text
.github/workflows/docs-build.yml
```

内容：

```yaml
name: Build docs

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

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

故意制造一次失败：

1. 在自己的实验分支中，在构建前添加一个独立步骤 `- run: exit 42`。
2. 推送实验分支并触发检查，不向正式部署分支注入故障。
3. 查看失败步骤，预期退出码为 `42`；构建步骤因为前置失败而跳过。
4. 删除这个故障步骤，保留原本的构建检查。
5. 再次推送，确认新运行成功，并关闭实验分支。未闭合 Markdown 围栏并不保证构建报错，因此不能用它制造确定性失败。

学习重点：

- CI 的价值是提前发现错误。
- 日志要从失败 step 往上看。
- 本地和 Actions 的 Node/npm 版本要尽量一致。

## 入门实验 3：上传构建产物

在构建后增加：

```yaml
- name: Upload dist
  uses: actions/upload-artifact@v4
  with:
    name: docs-dist
    path: dist
```

完成后：

1. 打开 workflow run。
2. 找 Artifacts 区域。
3. 下载 `docs-dist`。
4. 确认里面有 `index.html` 和静态资源。

你要能解释：

- artifact 是构建结果。
- artifact 可以给人下载，也可以给后续 job 使用。
- artifact 不是依赖缓存。

## 入门实验 4：定时生成 AIOps 报告

```yaml
name: Daily AIOps report

on:
  schedule:
    - cron: "0 2 * * *"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - name: Generate report
        run: |
          mkdir -p reports
          date -u > reports/daily.txt
          echo "AIOps daily check placeholder" >> reports/daily.txt

      - uses: actions/upload-artifact@v4
        with:
          name: daily-aiops-report
          path: reports/daily.txt
```

学习重点：

- `schedule` 用 UTC。
- `workflow_dispatch` 方便你手动测试。
- 定时任务输出应保存成 artifact 或发送到外部系统。

## 典型故障排查表

| 现象 | 常见原因 | 怎么查 | 怎么修 |
|---|---|---|---|
| workflow 没触发 | 文件不在 `.github/workflows/` | 看仓库路径 | 移到正确目录 |
| workflow 没触发 | `on` 条件不匹配 | 看事件、分支、paths | 调整 `branches`、`paths` |
| workflow 没触发 | workflow 文件不在默认分支 | 看 default branch | 先合入默认分支 |
| YAML 报错 | 缩进错误 | Actions 页面报语法行号 | 修缩进 |
| `npm ci` 失败 | 没有 `package-lock.json` | 看 npm 日志 | 提交 lockfile 或改用 `npm install` |
| `npm ci` 失败 | Node 版本不匹配 | 看 `setup-node` 和本地版本 | 固定 `node-version` |
| 找不到文件 | 没 checkout | 看 step 前是否有 `actions/checkout` | 添加 checkout |
| job B 找不到 job A 文件 | 不同 job 不共享文件系统 | 看 job 分隔 | 用 artifact 传递 |
| PR 里 secret 为空 | fork PR 安全限制 | 看触发来源 | 不在 fork PR 中使用 secret |
| API 403 | `GITHUB_TOKEN` 权限不够 | 看 workflow permissions | 增加最小所需权限 |
| Pages deploy 失败 | 缺少 Pages 权限 | 看 deploy 日志 | 加 `pages: write`、`id-token: write` |
| Pages 资源 404 | VitePress `base` 配错 | 打开浏览器 Network | 修 `base` |
| cache 没命中 | key 变了 | 看 cache step 日志 | 检查 `hashFiles` 和 restore key |
| matrix 某项失败 | 某版本不兼容 | 看失败组合 | 分版本修复 |
| workflow 很慢 | 每次重新下载依赖 | 看安装耗时 | 启用 cache |
| self-hosted runner 卡住 | runner 离线或标签不匹配 | 看 runner 状态和 `runs-on` | 启动 runner 或修标签 |
| 日志泄漏敏感信息 | echo 了 secret 或命令输出 | 看日志 | 不打印 secret，使用 masking |
| 第三方 action 风险 | action 版本不可信 | 看 `uses` | 选可信 action，重要场景 pin SHA |

## 排障流程

看到红色失败时，不要乱改。按顺序查：

1. 看 workflow run 的触发事件、分支、commit。
2. 看哪个 job 失败。
3. 看哪个 step 失败。
4. 展开失败 step 的日志。
5. 找第一条真正的 error，不要只看最后一行。
6. 判断是 YAML、依赖、命令、权限、网络、路径还是外部服务问题。
7. 本地复现能复现的命令。
8. 修复后重新 push 或 rerun。

常见判断：

```text
YAML 解析失败
  -> workflow 文件格式问题

checkout 失败
  -> 仓库权限、网络、ref 问题

npm ci 失败
  -> lockfile、node 版本、registry 问题

build 失败
  -> 项目代码、文档、配置问题

deploy 失败
  -> permissions、environment、artifact、Pages 设置问题

secret 为空
  -> secret 未配置、名字错、fork PR 限制、environment 未通过审批
```

## 安全边界

GitHub Actions 一旦能拿 token、读 secret、部署生产环境，就变成安全敏感系统。

### 最小权限

推荐从只读开始：

```yaml
permissions:
  contents: read
```

需要写 Issue 才加：

```yaml
permissions:
  contents: read
  issues: write
```

需要 Pages 才加：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

### 不要滥用 pull_request_target

`pull_request_target` 在 base 仓库上下文运行，可能拿到更高权限和 secrets。

危险模式：

```yaml
on:
  pull_request_target:

jobs:
  dangerous:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
      - run: ./script-from-pr.sh
```

这等于用高权限运行了 PR 里别人提交的代码。

安全原则：

- 不要在高权限 workflow 中 checkout 并执行不可信 PR 代码。
- fork PR 检查用 `pull_request`。
- 需要评论、打标签等高权限自动化时，只处理元数据，不执行 PR 代码。

### 第三方 action

`uses: someone/action@v1` 本质上是在运行别人的代码。

建议：

- 选官方或可信维护者 action。
- 重要生产流程 pin 到 commit SHA。
- 定期更新 action 版本。
- 用 Dependabot 管理 Actions 依赖。
- 不给不必要的 token 权限。

### OIDC

如果 Actions 要访问云厂商，长期保存云 AK/SK 不是最佳方式。

更推荐：

```text
GitHub Actions（自动化工作流）
  -> OIDC token（开放身份连接令牌）
  -> cloud provider trust policy（云端信任策略）
  -> short-lived credential（短期凭据）
```

好处：

- 不需要在 GitHub Secrets 保存长期云密钥。
- 凭证短期有效。
- 可以按仓库、分支、environment 限制。

## AIOps 中如何设计 workflow

一个成熟的 AIOps 项目可以按这几类 workflow 分层：

| Workflow | 触发 | 作用 |
|---|---|---|
| `docs-build.yml` | PR、push | 确保知识库能构建 |
| `python-test.yml` | PR、push | 测试告警脚本、诊断脚本 |
| `docker-build.yml` | tag、release | 构建 AIOps 服务镜像 |
| `terraform-plan.yml` | PR | 预览基础设施变更 |
| `terraform-apply.yml` | workflow_dispatch、environment approval | 执行基础设施变更 |
| `deploy.yml` | push main、release | 部署服务 |
| `daily-report.yml` | schedule | 生成每日巡检报告 |
| `runbook.yml` | workflow_dispatch、repository_dispatch | 手动或外部告警触发诊断 |

设计原则：

- PR 阶段只做检查和 plan，不做不可逆变更。
- main 分支合并后才发布。
- 生产部署走 environment 审批。
- 每个 job 权限最小化。
- 每个重要结果保留 artifact 或 summary。
- 失败日志要让新人能读懂。

## 面试怎么讲

可以这样讲：

GitHub Actions 是 GitHub 内置的 CI/CD 和自动化平台。它通过事件触发 workflow，workflow 定义在 `.github/workflows/*.yml`，里面包含一个或多个 job。每个 job 会被分配到 runner 上执行，job 里按 step 顺序运行 shell 命令或复用 action。Actions 还提供 contexts、expressions、variables、secrets、artifacts、cache、permissions、environments、concurrency 等机制，用来控制条件、传递数据、保护密钥、保存产物、加速依赖和发布环境。

在 AIOps 知识库里，我会用 Actions 在 PR 或 push 时自动构建 VitePress 文档，失败时通过日志定位问题；发布 Pages 时使用最小权限和 Pages artifact；后续还可以扩展到 Terraform plan、Docker 镜像构建、定时巡检、手动 runbook 和告警触发诊断。

## 学习检查清单

- [ ] 我能解释 event、workflow、job、runner、step、action 的关系。
- [ ] 我知道 workflow 文件必须放在 `.github/workflows/`。
- [ ] 我能写一个 `push` + `workflow_dispatch` 的最小 workflow。
- [ ] 我能解释 `run` 和 `uses` 的区别。
- [ ] 我知道为什么需要 `actions/checkout`。
- [ ] 我能用 `actions/setup-node` 构建 VitePress。
- [ ] 我能解释 `env`、`vars`、`secrets` 的区别。
- [ ] 我能读取 `github.sha`、`github.ref`、`runner.os`。
- [ ] 我能用 `if` 控制 step 或 job。
- [ ] 我能用 `needs` 控制 job 顺序。
- [ ] 我能解释 matrix 的用途。
- [ ] 我能区分 artifact 和 cache。
- [ ] 我能用 `$GITHUB_OUTPUT` 设置 step output。
- [ ] 我能用 `$GITHUB_STEP_SUMMARY` 输出摘要。
- [ ] 我能解释 `GITHUB_TOKEN` 和 `permissions`。
- [ ] 我知道 fork PR 中 secrets 受限制。
- [ ] 我知道 `pull_request_target` 的风险。
- [ ] 我能看 Actions 日志定位失败 step。
- [ ] 我能用 `gh run view --log` 查看日志。
- [ ] 我能设计一个文档构建 workflow 和一个 runbook workflow。

## 面试题

1. GitHub Actions 是什么？它和 Jenkins 有什么相似和不同？
2. workflow、job、step、runner、action 分别是什么？
3. `run` 和 `uses` 有什么区别？
4. 为什么很多 workflow 第一行 step 是 `actions/checkout`？
5. `push`、`pull_request`、`workflow_dispatch`、`schedule` 分别适合什么场景？
6. 多个 job 默认并行还是串行？如何让它们串行？
7. `needs` 除了控制顺序，还能做什么？
8. matrix 适合解决什么问题？
9. GitHub-hosted runner 和 self-hosted runner 有什么区别？
10. `env`、`vars`、`secrets` 怎么区分？
11. context 和默认环境变量有什么区别？
12. expression 的 <code v-pre>${{ ... }}</code> 什么时候用？
13. artifact 和 cache 有什么区别？
14. `$GITHUB_ENV`、`$GITHUB_OUTPUT`、`$GITHUB_STEP_SUMMARY` 分别做什么？
15. `GITHUB_TOKEN` 是什么？为什么要配置 `permissions`？
16. 为什么 fork PR 里 secrets 通常不可用？
17. `pull_request_target` 为什么危险？
18. Pages 发布 workflow 需要哪些权限？
19. workflow 失败后你如何定位问题？
20. GitHub Actions 如何支撑 AIOps 的自动化闭环？

## 老师带练：同一次提交，为什么任务成功还不等于发布成功

请先想象我们在给值班同事发布一本操作手册。我们至少需要回答四个不同问题：检查的是哪次提交？打出的包是不是来自这次提交？发布系统接收的是不是这个包？用户浏览器看到的是不是这版页面？Actions 的绿色图标只能说明工作流定义的成功条件成立。如果流程里只有 `echo "deployed"`，绿色图标就只证明这句话打印成功。

### 先分清两台“解释器”和两种生命周期

`${{ github.sha }}` 这样的表达式由 Actions 处理；`$GITHUB_SHA` 这样的变量由 runner 上的 shell 展开。前者像老师在发卷前填入班级名称，后者像学生拿到卷子后在自己的桌面上做计算。把不可信的 Issue 标题、服务名直接插入 `run` 脚本，可能把原本的数据变成命令的一部分。上面的诊断示例因此先把输入交给 `env`，再用有引号的变量和固定格式的 `printf` 输出。即使不执行命令，未经清洗的内容写入 Markdown 仍可能伪造报告标题或链接，展示前还要做格式处理。

同一 job 的步骤通常共享工作目录，却不是同一个持续运行的 shell。上一步执行 `export COLOR=blue`，不代表下一步还能读到这个变量；上一步创建文件，下一步一般可以从同一工作目录读到它。不同 job 则不能假定共享磁盘，哪怕两个 job 都写了 `runs-on: ubuntu-latest`。机器标签相同不等于机器实例相同。

因此先问“数据要传给谁”，再选通道。只给后续步骤的环境变量写入 `GITHUB_ENV`；要成为步骤输出的短值写入 `GITHUB_OUTPUT`，再通过 `steps.<id>.outputs` 读取；跨 job 的短值声明 job outputs；跨 job 或留作交付证据的文件上传 artifact。cache 用于加速可重建依赖，不应用作唯一发布包。刚写入 `GITHUB_ENV` 的内容不会回头改变当前步骤环境，多行和不可信值也不能随意用未经校验的分隔符拼接。机密值不应作为这些通道里的普通证据公开传播。

### 基础与故障实验：跨任务传递提交证据，再主动让验证失败

实验环境是你自己的 GitHub 练习仓库，已允许 Actions，有创建工作流权限。它不需要云账号、生产服务器或第三方密钥，但执行会使用账户适用的 Actions 额度。下面文件保存为 `.github/workflows/artifact-classroom.yml`，提交到该练习仓库的默认分支。所有名字都故意使用 `classroom`，便于之后辨认和回收。示例 `@v4` 是明确的教学版本选择，不代表所有运行环境的最新或唯一选择。

```yaml
name: Artifact classroom
on:
  workflow_dispatch:
    inputs:
      fail_verification:
        description: 主动制造一次验证失败
        type: boolean
        default: false
permissions:
  contents: read
jobs:
  make:
    runs-on: ubuntu-latest
    outputs:
      revision: ${{ steps.meta.outputs.revision }}
    steps:
      - id: meta
        shell: bash
        run: |
          printf '%s\n' "$GITHUB_SHA" > revision.txt
          printf 'revision=%s\n' "$GITHUB_SHA" >> "$GITHUB_OUTPUT"
      - uses: actions/upload-artifact@v4
        with:
          name: classroom-revision
          path: revision.txt
          if-no-files-found: error
          retention-days: 1
  verify:
    needs: make
    runs-on: ubuntu-latest
    steps:
      - name: 证明文件不会自动跨任务出现
        run: test ! -e revision.txt
      - uses: actions/download-artifact@v4
        with:
          name: classroom-revision
          path: evidence
      - name: 验证提交身份
        env:
          EXPECTED_REVISION: ${{ needs.make.outputs.revision }}
          FAIL_VERIFICATION: ${{ inputs.fail_verification }}
        run: |
          actual=$(cat evidence/revision.txt)
          test "$actual" = "$EXPECTED_REVISION"
          if [ "$FAIL_VERIFICATION" = true ]; then
            echo '课堂故障：主动返回 42'
            exit 42
          fi
          echo 'verified: 文件内容与上游任务声明一致'
      - name: 失败时也保留证据
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: classroom-verification-evidence
          path: evidence/revision.txt
          if-no-files-found: warn
          retention-days: 1
```

在 Actions 页面选择这个工作流，点 Run workflow，第一次保持复选框关闭。预期两个 job 都成功；下载制品后，文件里的一行提交摘要应与该运行页面上的提交一致。为什么没有 checkout？因为实验只生成元数据，不需要读取仓库源码；真正构建代码的任务仍需要检出正确版本。

第二次勾选故障开关。预期 `make` 成功，`verify` 的验证步骤退出 `42`，整个运行失败，而后面的证据上传仍会执行。`!cancelled()` 的含义是没有被取消时保留这类收尾工作，并不是让先前的失败消失。打开失败日志应明确看到课堂故障文字，下载验证证据还能找到同一提交摘要。第三次关闭开关再运行，确认恢复成功。请在笔记中分别记录运行编号、尝试次数、提交摘要、失败步骤和制品名，不能只贴最后一个绿色截图。

如果看不到 Run workflow，先确认文件已在默认分支、YAML 解析正常、仓库允许 Actions。找不到制品时，先看上传步骤是否执行、名称是否精确一致、保存期是否到期，再看下载步骤，不要先重跑全部任务。如果上游输出为空，核对步骤 `id`、写入的输出名称以及 job outputs 的映射；`needs` 只声明依赖关系，不会自动传文件。清理时在这个练习仓库删除该工作流文件，已有制品可在运行页面删除或等待一天保存期到期；日志按仓库保存策略管理。没有创建服务器，也无需撤销任何云资源。

这只是“文件与声明一致”的课堂证明，不是防恶意构建的完整供应链证明。若同一受攻击的 job 同时伪造文件和输出，它们仍然能相等。生产还需要可信构建来源、摘要验证、访问控制以及按需求配置的来源证明。

### 看懂失败传播，而不是用忽略错误换绿色

一个 step 有自身执行结果；`continue-on-error` 还会影响平台最终如何归类它。面试遇到“测试报错但流水线是绿色”，先看是不是忽略了错误、shell 是否丢失退出码、测试命令是否真的收集了测试，不要直接认定平台出故障。`always()`、`success()`、`failure()`、`cancelled()` 是状态条件，不是业务验收。下载失败后清理步骤又因为找不到文件而失败，还可能掩盖第一现场，因此收尾步骤应容忍自己的前置资源尚未创建。

矩阵任务像给多组学生发同一份卷子，分别测试不同语言版本或系统。`fail-fast` 决定某个矩阵成员失败后是否提前取消其他成员，不等于“失败的版本不重要”。排兼容性问题时可以保留全部结果；昂贵构建可以考虑尽早停止，但交付结论必须说明哪些组合实际完成、哪些取消而未知。

Pull Request 场景中的提交身份也要看事件语义：默认 PR 检查可能针对平台生成的合并引用，不能一概把 `github.sha` 当成 PR 源分支最后一次提交。回归测试关心的是集成结果，代码审查定位可能关心源分支摘要，两者都记录才能避免“日志中的版本找不到”。定时任务按平台规则调度，不是实时计时器；它可能延迟，通常读取默认分支上的工作流。需要分钟级故障自愈时，应选择有合适时效保证的调度系统，而不是把定时 Actions 当监控核心。详见[官方事件说明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)。

### 生产设计：从凭据到执行机器都要划边界

自托管 runner 的优点是能访问内网、使用专用硬件；代价是你要维护补丁、隔离、磁盘、并发和清理。允许不可信 PR 在能访问生产网的持久 runner 上执行，就像让陌生人拿着自己的脚本进入机房。仅仅隐藏 secrets 不足以消除机器上已有凭据、挂载目录或网络权限。应按信任域隔离执行池，并优先使用可销毁的执行环境。

OIDC 是让任务证明身份再向云端换取短期凭据，不是自动获得安全。云端信任策略必须检查允许的仓库、分支或 environment、受众等条件；`id-token: write` 允许申请身份令牌，本身不等于云资源管理员权限。组织安全要求应落实到云角色授权和部署审批，而不是只在 YAML 里出现一个 OIDC 字样。参见[官方安全使用说明](https://docs.github.com/en/actions/reference/security/secure-use)。

容量上把排队时间和执行时间分开统计：十个任务各跑两分钟，等待二十分钟可能是 runner 配额或环境审批，不是 npm 突然变慢。并发分组可以控制同一环境的部署，但取消旧运行不会撤销已经完成的数据库更新或外部 API 调用。变更带副作用时，应让部署步骤可幂等重入，并记录“未开始、已提交、已确认、结果未知”；遇到未知先查询远端操作编号，再决定是否重试。

### 面试的三层表达

30 秒回答：“Actions 根据事件调度工作流，在隔离的 job 中执行步骤。我用输出传递短值、artifact 传递交付文件、cache 加速依赖，同时把权限、环境审批和真实发布验证作为独立边界。”

3 分钟回答：以本节实验为起点，先讲提交身份如何生成，再讲不同 job 为什么要显式下载制品，然后讲退出码如何产生失败结论，最后补充生产中的可信来源、最小权限、runner 隔离和网页验收。讲每一步要看什么证据，比背一长串 action 名称更有说服力。

追问“`needs` 有了为什么还找不到文件？”回答依赖图不共享文件系统；“绿色 workflow 为什么网页仍旧？”回答逐层核对构建摘要、上传制品、部署完成状态和页面版本标记、资源缓存；“给 PR 部署权限方便预览是否可行？”回答先定义可信贡献者与隔离预览环境，不能让不可信代码接触生产凭据。你的 GitHub 证据应包含三次运行结果和清理记录，并标明这是课堂实验，不是假称已有生产落地。

## 平台进阶课堂：为什么任务一直等，或者根本没有出现

### 先区分触发、依赖、审批、并发和执行器等待

老师让你排查“二十分钟没完成”。如果没有运行记录，先查事件和过滤条件；如果运行已创建但依赖未完成，先看上游；如果等待环境审批，先确认审批策略和授权人；如果并发分组占用，先找同组运行；只有任务已经等待执行机器时，才重点查 runner 标签、可用性、配额与容量。把所有等待都叫“runner 慢”，会让人扩容错误的层次。

工作流级 `paths` 过滤会使整个工作流不启动。若分支保护又要求它上报检查，便可能出现改动被认为无关、合并却一直等待的矛盾。要让必需检查具有稳定结果，可以建立覆盖相关事件的门禁任务，由它明确判断哪些检查适用，而不是让必需检查无声消失。新增目录和构建入口后同步审查过滤条件，别只在最初配置一次。

合并队列还有自己的事件：`merge_group`。普通 PR 绿色不能替代队列中组合后的验证；使用合并队列的仓库，要让要求的检查响应适用的队列事件。否则加入队列后可能一直等不到必需结果。核对的是运行的事件、临时合并提交和检查名称，不要把旧 PR 日志当成新组合的证据。[事件与合并队列说明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#merge_group)

### 默认并发分组不是保存每次请求的任务队列

本文普通 `concurrency` 示例没有配置额外排队选项，默认同组最多保留一个运行中和一个等待中的任务；新等待任务可替换已有等待任务。因此 `cancel-in-progress: false` 只是不主动取消当前运行，并不承诺每次中间提交都会执行。适合只关心最新状态的构建，不适合把每次计费、迁移或审计事件都寄托在这个等待槽位。

组名按实际互斥对象设计。两个不同分支如果部署同一生产环境，用分支名隔离组反而允许它们同时写环境；两个无关工作流若用了同一个取消型组名，又可能互相取消。组名大小写不能用来隔离资源。平台现有文档也提供额外排队能力，但启用前应核验适用版本与限制；无论怎样排队，目标端仍需检查发布代次和幂等性。[官方并发控制](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

调度顺序不能直接当作业务发生顺序。任务何时开始等待可能受审批和依赖影响，较早触发的发布也可能较晚到达执行阶段。若每个请求都必须处理，应持久保存请求及处理状态，由消费端确认成功并防重复；Actions 可以承担执行角色，却不能用几个绿色图标代替业务账本。AIOps 平台应把被替换、取消、跳过和失败分别计数。

### 可复用工作流不是自动继承全部环境

复用像调用一个有输入、输出与权限约定的程序。调用方通过 `with` 提供声明过的参数，通过专门的秘密传递机制提供需要的凭据；不能假设调用方的普通工作流环境变量会自动变成被调用方的同名配置。被调用链的权限只能保持或收窄，不能凭借嵌套层级提升原始授权。

秘密也只传到直接调用的下一层。甲调用乙、乙调用丙，丙想使用某个秘密，乙还必须明确再传递。广泛使用 `secrets: inherit` 虽然省事，却会扩大模板接触的秘密范围；更容易审计的接口是只传实际需要的命名秘密。环境秘密与调用参数不是同一种传递渠道，模板内部使用哪个环境，需要结合该环境审批和秘密来源一起审核。[复用与权限传递](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)

升级共享模板会影响很多仓库，所以先在少量代表服务验证输入兼容、输出名称、所需权限和运行时，再推广到剩余调用者。生产固定经过审核的提交引用，并保留旧引用与兼容窗口。回退模板不能撤销已经部署的外部状态，还要读取目标版本；如果新模板改变了输出协议，下游消费者也可能需要协调恢复。

执行器升级也属于兼容变更。动作自身使用的脚本运行时，与 `setup-node` 给项目安装的运行时是两层；把项目切到某个版本，不会自动满足新版动作对自托管 runner 的最低要求。升级前记录 runner 版本、动作固定引用、镜像和项目运行时，用小范围任务验证网络、证书、依赖下载与制品上传。若失败，先定位是哪一层不兼容，再按记录回退对应层，避免把平台问题误改成业务依赖问题。定期验证无人维护的旧执行器是否还能接收安全更新，也是平台运维责任。

### 纸面并发实验：预测丢失的是哪一次

前提是读懂前面的跨任务文件实验，本练习不创建任何线上运行。在笔记写下同组甲正在运行，乙等待；然后让丙进入，保持默认排队设置与 `cancel-in-progress: false`。预期甲继续，乙被新等待者替换，丙等待。故障注入把业务要求改成“甲乙丙每次都必须完成”，判断当前设计不满足需求，而不是把乙解释成执行成功。

验证方式是给每个请求分别写出是否有完成证据，以及需要在哪里持久记录。再将乙和丙改为不同环境，检查是否还应该共用同一组。如果结果和预测不同，先核对自己是否假设了额外排队选项，或者混淆工作流级和任务级分组。清理只删除合成笔记，不取消真实运行。这个实验训练调度推理，不表示账户中已验证平台排队实现。

事故题“所有检查成功但合并队列卡住”，三十秒先区分旧检查和本次队列检查；三分钟给出事件、提交、必需检查名称、过滤条件、权限和执行器证据链。设计题“每天两万次诊断请求”则应先算排队与运行时间、隔离信任域、设计持久请求和去重，再选择执行池容量。模型可以归类失败日志，不能替代持久状态或自动批准高权限模板升级。

最终交接保留规则版本与未验证项目，便于下一次复核。

## 学习证据

学完这篇，建议留下这些证据：

1. 一个成功运行的 `Hello Actions` workflow 链接或截图。
2. 一个能构建 VitePress 的 `docs-build.yml`。
3. 一次故意失败再修复的 Actions 日志记录。
4. 一个上传 artifact 的 workflow run。
5. 一篇笔记：event、workflow、job、runner、step、action 的关系图。
6. 一篇笔记：artifact 和 cache 的区别。
7. 一篇笔记：`GITHUB_TOKEN`、secrets、permissions 的安全边界。
8. 一个手动触发的 AIOps diagnostic workflow。
