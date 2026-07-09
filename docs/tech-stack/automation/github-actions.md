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
GitHub Actions
  -> Workflows and actions
     -> workflows
     -> actions
     -> variables
     -> contexts
     -> expressions
     -> artifacts
     -> cache
     -> reusable workflows
     -> environments
     -> concurrency
  -> Runners
     -> GitHub-hosted runners
     -> larger runners
     -> self-hosted runners
     -> runner groups
     -> Actions Runner Controller
  -> Security
     -> secrets
     -> GITHUB_TOKEN
     -> permissions
     -> OIDC
     -> secure use
     -> pull_request_target risk
  -> Manage workflow runs
     -> logs
     -> rerun
     -> cancel
     -> artifacts
     -> cache
     -> debug logging
  -> Reference
     -> workflow syntax
     -> events
     -> workflow commands
     -> variables
     -> contexts
     -> expressions
     -> limits
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>GitHub Actions</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Workflows and actions</code> | 这一行要理解这些英文词：`Workflows and actions` 是actions=动作或改进项。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>     -&gt; workflows</code> | 这一行要理解这些英文词：`workflows` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; actions</code> | 这一行要理解这些英文词：`actions` 是动作或改进项。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; variables</code> | 这一行要理解这些英文词：`variables` 是变量。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; contexts</code> | 这一行要理解这些英文词：`contexts` 是上下文，表示命令或组件运行时依赖的环境信息。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>     -&gt; expressions</code> | 这一行要理解这些英文词：`expressions` 是表达式，由变量、函数和运算符组成的计算语句。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>     -&gt; artifacts</code> | 这一行要理解这些英文词：`artifacts` 是构建产物集合，例如多个包、报告或镜像信息。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; cache</code> | 这一行要理解这些英文词：`cache` 是缓存，用来临时保存数据以提高访问速度。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; reusable workflows</code> | 这一行要理解这些英文词：`reusable workflows` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; environments</code> | 这一行要理解这些英文词：`environments` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>     -&gt; concurrency</code> | 这一行要理解这些英文词：`concurrency` 是并发控制。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  -&gt; Runners</code> | 这一行要理解这些英文词：`Runners` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>     -&gt; GitHub-hosted runners</code> | 这一行要理解这些英文词：`GitHub-hosted runners` 是github=代码托管平台。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>     -&gt; larger runners</code> | 这一行要理解这些英文词：`larger runners` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>     -&gt; self-hosted runners</code> | 这一行要理解这些英文词：`self-hosted runners` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>     -&gt; runner groups</code> | 这一行要理解这些英文词：`runner groups` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>     -&gt; Actions Runner Controller</code> | 这一行要理解这些英文词：`Actions Runner Controller` 是actions=动作或改进项。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>  -&gt; Security</code> | 这一行要理解这些英文词：`Security` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>     -&gt; secrets</code> | 这一行要理解这些英文词：`secrets` 是密钥或敏感配置，例如密码、Token、证书。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>     -&gt; GITHUB_TOKEN</code> | 这一行要理解这些英文词：`GITHUB_TOKEN` 是github=代码托管平台。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>     -&gt; permissions</code> | 这一行要理解这些英文词：`permissions` 是权限，决定谁能读、写、执行或管理资源。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>     -&gt; OIDC</code> | 这一行要理解这些英文词：`OIDC` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>     -&gt; secure use</code> | 这一行要理解这些英文词：`secure use` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>     -&gt; pull_request_target risk</code> | 这一行要理解这些英文词：`pull_request_target risk` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>  -&gt; Manage workflow runs</code> | 这一行要理解这些英文词：`Manage workflow runs` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>     -&gt; logs</code> | 这一行要理解这些英文词：`logs` 是日志。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>     -&gt; rerun</code> | 这一行要理解这些英文词：`rerun` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>     -&gt; cancel</code> | 这一行要理解这些英文词：`cancel` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>     -&gt; artifacts</code> | 这一行要理解这些英文词：`artifacts` 是构建产物集合，例如多个包、报告或镜像信息。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>     -&gt; cache</code> | 这一行要理解这些英文词：`cache` 是缓存，用来临时保存数据以提高访问速度。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>     -&gt; debug logging</code> | 这一行要理解这些英文词：`debug logging` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>  -&gt; Reference</code> | 这一行要理解这些英文词：`Reference` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>     -&gt; workflow syntax</code> | 这一行要理解这些英文词：`workflow syntax` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>     -&gt; events</code> | 这一行要理解这些英文词：`events` 是事件集合。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 36 行 | <code>     -&gt; workflow commands</code> | 这一行要理解这些英文词：`workflow commands` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 37 行 | <code>     -&gt; variables</code> | 这一行要理解这些英文词：`variables` 是变量。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 38 行 | <code>     -&gt; contexts</code> | 这一行要理解这些英文词：`contexts` 是上下文，表示命令或组件运行时依赖的环境信息。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 39 行 | <code>     -&gt; expressions</code> | 这一行要理解这些英文词：`expressions` 是表达式，由变量、函数和运算符组成的计算语句。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 40 行 | <code>     -&gt; limits</code> | 这一行要理解这些英文词：`limits` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


初学不要从所有 action 开始背。先把这条主线吃透：

```text
Event
  -> Workflow file
  -> Job
  -> Runner
  -> Step
  -> run command or uses action
  -> Logs / artifact / status
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Event</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Workflow file</code> | 这一行要理解这些英文词：`Workflow file` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; Job</code> | 这一行要理解这些英文词：`Job` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; Runner</code> | 这一行要理解这些英文词：`Runner` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; Step</code> | 这一行要理解这些英文词：`Step` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; run command or uses action</code> | 这一行要理解这些英文词：`run command or uses action` 是command=命令，action=动作或改进项。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; Logs / artifact / status</code> | 这一行要理解这些英文词：`Logs` 是日志；`artifact` 是构建产物，例如打包后的文件、镜像或部署包；`status` 是状态，表示资源、服务或任务当前处于什么情况。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


## GitHub Actions 在 AIOps 链路中的位置

AIOps 不是只有模型和告警。真正的 AIOps 系统还需要稳定的工程链路：

```text
代码或配置变更
  -> GitHub push / Pull Request
  -> GitHub Actions 自动检查
  -> 单元测试、文档构建、镜像构建、IaC plan
  -> 产物上传或部署
  -> 运行结果写入日志、通知、Issue、Dashboard
  -> 人或自动化系统继续处理
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>代码或配置变更</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; GitHub push / Pull Request</code> | 这一行要理解这些英文词：`GitHub push` 是github=代码托管平台；`Pull Request` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; GitHub Actions 自动检查</code> | 这一行要理解这些英文词：`GitHub Actions` 是github=代码托管平台，actions=动作或改进项。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 单元测试、文档构建、镜像构建、IaC plan</code> | 这一行要理解这些英文词：`IaC plan` 是plan=执行计划。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 产物上传或部署</code> | 这一行表示上一级主题下的子项“产物上传或部署”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 6 行 | <code>  -&gt; 运行结果写入日志、通知、Issue、Dashboard</code> | 这一行要理解这些英文词：`Issue` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Dashboard` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; 人或自动化系统继续处理</code> | 这一行表示上一级主题下的子项“人或自动化系统继续处理”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Repository</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  contains .github/workflows/*.yml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>Event</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  triggers Workflow</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 7 行 | <code>Workflow</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  contains Jobs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 10 行 | <code>Job</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  runs on Runner</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 12 行 | <code>  contains Steps</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 13 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 14 行 | <code>Step</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 15 行 | <code>  runs shell command</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 16 行 | <code>  or uses Action</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 17 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 18 行 | <code>Action</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 19 行 | <code>  reusable unit</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 20 行 | <code>  may be JavaScript action, Docker action, or composite action</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      - run: echo "build"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 7 行 | <code>  test:</code> | 定义 `test` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>      - run: echo "test"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      - run: echo "build"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 7 行 | <code>  test:</code> | 定义 `test` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>    needs: build</code> | 设置 `needs` 字段的值为 `build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>      - run: echo "test after build"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: Run shell command</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    run: npm run docs:build</code> | 设置 `run` 字段的值为 `npm run docs:build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 5 行 | <code>  - name: Checkout repository</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>    uses: actions/checkout@v4</code> | 设置 `uses` 字段的值为 `actions/checkout@v4`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


`run` 表示在 runner 的 shell 里执行命令。

`uses` 表示调用一个 action。

### runner 是什么

runner 是执行 job 的机器。

常见写法：

```yaml
runs-on: ubuntu-latest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.github/workflows/&lt;name&gt;.yml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>.github/workflows/&lt;name&gt;.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Check</code> | 设置 `name` 字段的值为 `Check`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  push:</code> | 定义 `push` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    branches: [main]</code> | 设置 `branches` 字段的值为 `[main]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  workflow_dispatch:</code> | 定义 `workflow_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 8 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  hello:</code> | 定义 `hello` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>      - name: Print message</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 13 行 | <code>        run: echo "hello aiops"</code> | 设置 `run` 字段的值为 `echo "hello aiops"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


逐行解释：

| 字段 | 意思 | 为什么需要 |
|---|---|---|
| `name` | workflow 在 GitHub UI 里的名字 | 让你知道是哪条流水线 |
| `on` | 触发条件 | 决定什么时候跑 |
| `push` | push 事件触发 | 代码更新后自动检查 |
| `branches` | 限制分支 | 避免所有分支都跑 |
| `workflow_dispatch` | 允许手动触发 | 方便调试和临时执行 |
| `jobs` | job 列表 | 定义要做哪些任务 |
| `hello` | job id | 在 YAML 和依赖里引用 |
| `runs-on` | runner 类型 | 决定在哪台机器跑 |
| `steps` | 步骤列表 | 定义实际执行过程 |
| `name` | step 展示名 | 方便看日志 |
| `run` | shell 命令 | 执行真正的动作 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  push:</code> | 定义 `push` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    branches:</code> | 定义 `branches` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - main</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>    paths:</code> | 定义 `paths` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>      - "docs/**"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 7 行 | <code>      - "package.json"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 8 行 | <code>      - "package-lock.json"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  pull_request:</code> | 定义 `pull_request` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    branches:</code> | 定义 `branches` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      - main</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 5 行 | <code>    paths:</code> | 定义 `paths` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>      - "docs/**"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  workflow_dispatch:</code> | 定义 `workflow_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    inputs:</code> | 定义 `inputs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      target:</code> | 定义 `target` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>        description: "Target environment"</code> | 设置 `description` 字段的值为 `"Target environment"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>        required: true</code> | 设置 `required` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>        type: choice</code> | 设置 `type` 字段的值为 `choice`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>        options:</code> | 定义 `options` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>          - dev</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>          - prod</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


含义：

- 允许在 Actions 页面手动点 Run workflow。
- 可以输入参数。
- 适合手动巡检、重新发布、临时诊断。

在 step 里读取：

```yaml
run: echo "target=${{ inputs.target }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>run: echo "target=${{ inputs.target }}"</code> | 设置 `run` 字段的值为 `echo "target=${{ inputs.target }}"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


### schedule

```yaml
on:
  schedule:
    - cron: "0 2 * * *"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  schedule:</code> | 定义 `schedule` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    - cron: "0 2 * * *"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  schedule:</code> | 定义 `schedule` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    - cron: "0 2 * * *"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


### repository_dispatch

```yaml
on:
  repository_dispatch:
    types: [aiops-alert]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  repository_dispatch:</code> | 定义 `repository_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    types: [aiops-alert]</code> | 设置 `types` 字段的值为 `[aiops-alert]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      - run: echo "ok"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


错一个缩进，含义就变了。

### 列表

列表用 `-`：

```yaml
branches:
  - main
  - release/*
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>branches:</code> | 定义 `branches` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - main</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>  - release/*</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


也可以短写：

```yaml
branches: [main, "release/*"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>branches: [main, "release/*"]</code> | 设置 `branches` 字段的值为 `[main, "release/*"]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


### 字符串

普通字符串可以不加引号：

```yaml
runs-on: ubuntu-latest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


包含 `*`、`!`、<code v-pre>${{ }}</code>、冒号、特殊字符时，建议加引号：

```yaml
branches:
  - "release/*"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>branches:</code> | 定义 `branches` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - "release/*"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


### 多行命令

用 `|` 写多行 shell：

```yaml
steps:
  - name: Build and inspect
    run: |
      npm ci
      npm run docs:build
      ls -la docs/.vitepress/dist
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: Build and inspect</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    run: &#124;</code> | 设置 `run` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>      npm ci</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 5 行 | <code>      npm run docs:build</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 6 行 | <code>      ls -la docs/.vitepress/dist</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  build-docs:</code> | 定义 `build-docs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    name: Build docs</code> | 设置 `name` 字段的值为 `Build docs`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    timeout-minutes: 10</code> | 设置 `timeout-minutes` 字段的值为 `10`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>      - uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 8 行 | <code>      - run: npm ci</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>      - run: npm run docs:build</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  build_docs:</code> | 定义 `build_docs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    name: Build VitePress docs</code> | 设置 `name` 字段的值为 `Build VitePress docs`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


`build_docs` 是机器读的 id。

`Build VitePress docs` 是人看的名字。

后续依赖要写 id：

```yaml
deploy:
  needs: build_docs
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>deploy:</code> | 定义 `deploy` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  needs: build_docs</code> | 设置 `needs` 字段的值为 `build_docs`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      - run: echo "build"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 7 行 | <code>  deploy:</code> | 定义 `deploy` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>    needs: build</code> | 设置 `needs` 字段的值为 `build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>      - run: echo "deploy after build"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  deploy:</code> | 定义 `deploy` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    if: github.ref == 'refs/heads/main'</code> | 设置 `if` 字段的值为 `github.ref == 'refs/heads/main'`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>      - run: echo "deploy only on main"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


含义：只有 main 分支才部署。

step 级别：

```yaml
steps:
  - name: Upload logs when failed
    if: failure()
    run: echo "collect logs"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: Upload logs when failed</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    if: failure()</code> | 设置 `if` 字段的值为 `failure()`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    run: echo "collect logs"</code> | 设置 `run` 字段的值为 `echo "collect logs"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  test:</code> | 定义 `test` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    strategy:</code> | 定义 `strategy` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      matrix:</code> | 定义 `matrix` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>        node-version: [20, 22]</code> | 设置 `node-version` 字段的值为 `[20, 22]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>      - uses: actions/setup-node@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>          node-version: ${{ matrix.node-version }}</code> | 设置 `node-version` 字段的值为 `${{ matrix.node-version }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>      - run: npm ci</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 13 行 | <code>      - run: npm test</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    outputs:</code> | 定义 `outputs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      artifact-name: ${{ steps.meta.outputs.name }}</code> | 设置 `artifact-name` 字段的值为 `${{ steps.meta.outputs.name }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>      - id: meta</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 8 行 | <code>        run: echo "name=docs-dist" &gt;&gt; "$GITHUB_OUTPUT"</code> | 设置 `run` 字段的值为 `echo "name=docs-dist" >> "$GITHUB_OUTPUT"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 10 行 | <code>  deploy:</code> | 定义 `deploy` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>    needs: build</code> | 设置 `needs` 字段的值为 `build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>      - run: echo "artifact=${{ needs.build.outputs.artifact-name }}"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      - run: echo "hello" &gt; result.txt</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 7 行 | <code>  read:</code> | 定义 `read` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>      - run: cat result.txt</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: Print workspace</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    run: pwd</code> | 设置 `run` 字段的值为 `pwd`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 5 行 | <code>  - name: Build docs</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>    run: npm run docs:build</code> | 设置 `run` 字段的值为 `npm run docs:build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: Use bash</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    shell: bash</code> | 设置 `shell` 字段的值为 `bash`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    run: &#124;</code> | 设置 `run` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>      set -euo pipefail</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 6 行 | <code>      npm ci</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 7 行 | <code>      npm run docs:build</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>  - uses: actions/setup-node@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 4 行 | <code>    with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      node-version: 22</code> | 设置 `node-version` 字段的值为 `22`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>      cache: npm</code> | 设置 `cache` 字段的值为 `npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - run: npm ci</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


通常会失败，因为当前目录没有 `package.json`。

### with

`with` 给 action 传输入参数：

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- uses: actions/setup-node@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    node-version: 22</code> | 设置 `node-version` 字段的值为 `22`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    cache: npm</code> | 设置 `cache` 字段的值为 `npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: Use env</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    env:</code> | 定义 `env` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      APP_ENV: dev</code> | 设置 `APP_ENV` 字段的值为 `dev`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    run: echo "$APP_ENV"</code> | 设置 `run` 字段的值为 `echo "$APP_ENV"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    env:</code> | 定义 `env` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      NODE_ENV: production</code> | 设置 `NODE_ENV` 字段的值为 `production`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>      - run: echo "$NODE_ENV"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


workflow 顶层也可以设置：

```yaml
env:
  DOCS_DIR: docs
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>env:</code> | 定义 `env` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  DOCS_DIR: docs</code> | 设置 `DOCS_DIR` 字段的值为 `docs`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>run: echo "sha=${{ github.sha }}"</code> | 设置 `run` 字段的值为 `echo "sha=${{ github.sha }}"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: Print run metadata</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    run: &#124;</code> | 设置 `run` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>      echo "repo=${{ github.repository }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 5 行 | <code>      echo "ref=${{ github.ref }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 6 行 | <code>      echo "sha=${{ github.sha }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 7 行 | <code>      echo "actor=${{ github.actor }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


### runner context

```yaml
steps:
  - name: Print runner
    run: |
      echo "os=${{ runner.os }}"
      echo "arch=${{ runner.arch }}"
      echo "temp=${{ runner.temp }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: Print runner</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    run: &#124;</code> | 设置 `run` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>      echo "os=${{ runner.os }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 5 行 | <code>      echo "arch=${{ runner.arch }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 6 行 | <code>      echo "temp=${{ runner.temp }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    outputs:</code> | 定义 `outputs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      status: ${{ steps.meta.outputs.status }}</code> | 设置 `status` 字段的值为 `${{ steps.meta.outputs.status }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>      - id: meta</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 8 行 | <code>        run: echo "status=ok" &gt;&gt; "$GITHUB_OUTPUT"</code> | 设置 `run` 字段的值为 `echo "status=ok" >> "$GITHUB_OUTPUT"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 10 行 | <code>  report:</code> | 定义 `report` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>    needs: build</code> | 设置 `needs` 字段的值为 `build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>      - run: echo "build status=${{ needs.build.outputs.status }}"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>if: github.ref == 'refs/heads/main'</code> | 设置 `if` 字段的值为 `github.ref == 'refs/heads/main'`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


### contains

```yaml
if: contains(github.event.head_commit.message, '[deploy]')
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>if: contains(github.event.head_commit.message, '[deploy]')</code> | 设置 `if` 字段的值为 `contains(github.event.head_commit.message, '[deploy]')`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


含义：commit message 包含 `[deploy]` 才运行。

### startsWith

```yaml
if: startsWith(github.ref, 'refs/tags/v')
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>if: startsWith(github.ref, 'refs/tags/v')</code> | 设置 `if` 字段的值为 `startsWith(github.ref, 'refs/tags/v')`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


含义：只有 `v` 开头的 tag 才运行。

### format

```yaml
env:
  IMAGE_TAG: ${{ github.ref_name }}-${{ github.sha }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>env:</code> | 定义 `env` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  IMAGE_TAG: ${{ github.ref_name }}-${{ github.sha }}</code> | 设置 `IMAGE_TAG` 字段的值为 `${{ github.ref_name }}-${{ github.sha }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


### hashFiles

常用于 cache key：

```yaml
key: npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>key: npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}</code> | 设置 `key` 字段的值为 `npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


含义：

- 操作系统不同，缓存分开。
- `package-lock.json` 变了，缓存 key 变。

### 不可信输入

任何来自 Issue、PR title、commit message、branch name 的内容，都可能被攻击者控制。

危险例子：

```yaml
run: echo "${{ github.event.pull_request.title }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>run: echo "${{ github.event.pull_request.title }}"</code> | 设置 `run` 字段的值为 `echo "${{ github.event.pull_request.title }}"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


如果把不可信输入拼到 shell 命令里，就可能变成脚本注入。

更稳的写法是先放到环境变量，并加引号使用：

```yaml
env:
  PR_TITLE: ${{ github.event.pull_request.title }}
run: |
  printf '%s\n' "$PR_TITLE"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>env:</code> | 定义 `env` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  PR_TITLE: ${{ github.event.pull_request.title }}</code> | 设置 `PR_TITLE` 字段的值为 `${{ github.event.pull_request.title }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>run: &#124;</code> | 设置 `run` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  printf '%s\n' "$PR_TITLE"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>env:</code> | 定义 `env` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  DOCS_DIR: docs</code> | 设置 `DOCS_DIR` 字段的值为 `docs`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 4 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - run: echo "$DOCS_DIR"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


### vars

`vars` 适合放非敏感配置：

```yaml
env:
  DEPLOY_TARGET: ${{ vars.DEPLOY_TARGET }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>env:</code> | 定义 `env` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  DEPLOY_TARGET: ${{ vars.DEPLOY_TARGET }}</code> | 设置 `DEPLOY_TARGET` 字段的值为 `${{ vars.DEPLOY_TARGET }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>env:</code> | 定义 `env` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  API_TOKEN: ${{ secrets.API_TOKEN }}</code> | 设置 `API_TOKEN` 字段的值为 `${{ secrets.API_TOKEN }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


原则：

- 不要把 secrets 写进仓库。
- 不要把 secrets echo 到日志。
- 不要把 secrets 传给不可信脚本。
- 尽量用最小权限 token。
- 能用 OIDC 短期凭证时，不要长期保存云厂商密钥。

### GITHUB_TOKEN

`GITHUB_TOKEN` 是 GitHub Actions 给每个 workflow run 提供的自动 token。

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>env:</code> | 定义 `env` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}</code> | 设置 `GH_TOKEN` 字段的值为 `${{ secrets.GITHUB_TOKEN }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


更重要的是权限：

```yaml
permissions:
  contents: read
  issues: write
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  issues: write</code> | 设置 `issues` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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
      - run: gh issue create --title "AIOps report" --body "done"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  create-issue:</code> | 定义 `create-issue` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>      issues: write</code> | 设置 `issues` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - run: gh issue create --title "AIOps report" --body "done"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>        env:</code> | 定义 `env` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}</code> | 设置 `GH_TOKEN` 字段的值为 `${{ secrets.GITHUB_TOKEN }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


Pages 发布常见权限：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  pages: write</code> | 设置 `pages` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  id-token: write</code> | 设置 `id-token` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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
      path: docs/.vitepress/dist
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - uses: actions/upload-artifact@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      name: docs-dist</code> | 设置 `name` 字段的值为 `docs-dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>      path: docs/.vitepress/dist</code> | 设置 `path` 字段的值为 `docs/.vitepress/dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


下载 artifact：

```yaml
steps:
  - uses: actions/download-artifact@v4
    with:
      name: docs-dist
      path: dist
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - uses: actions/download-artifact@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>      name: docs-dist</code> | 设置 `name` 字段的值为 `docs-dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>      path: dist</code> | 设置 `path` 字段的值为 `dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


核心理解：

```text
job A 生成文件
  -> upload-artifact
  -> GitHub 存储
  -> job B download-artifact
  -> 继续使用
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>job A 生成文件</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; upload-artifact</code> | 这一行要理解这些英文词：`upload-artifact` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; GitHub 存储</code> | 这一行要理解这些英文词：`GitHub` 是代码托管平台。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; job B download-artifact</code> | 这一行要理解这些英文词：`job B download-artifact` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 继续使用</code> | 这一行表示上一级主题下的子项“继续使用”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- uses: actions/setup-node@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    node-version: 22</code> | 设置 `node-version` 字段的值为 `22`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    cache: npm</code> | 设置 `cache` 字段的值为 `npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


更底层的缓存写法：

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      npm-${{ runner.os }}-
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- uses: actions/cache@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    path: ~/.npm</code> | 设置 `path` 字段的值为 `~/.npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    key: npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}</code> | 设置 `key` 字段的值为 `npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    restore-keys: &#124;</code> | 设置 `restore-keys` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>      npm-${{ runner.os }}-</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: Set environment</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    run: echo "DOCS_STATUS=ok" &gt;&gt; "$GITHUB_ENV"</code> | 设置 `run` 字段的值为 `echo "DOCS_STATUS=ok" >> "$GITHUB_ENV"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 5 行 | <code>  - name: Read environment</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>    run: echo "$DOCS_STATUS"</code> | 设置 `run` 字段的值为 `echo "$DOCS_STATUS"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


### 设置 step output

```yaml
steps:
  - id: meta
    run: echo "version=1.0.0" >> "$GITHUB_OUTPUT"

  - run: echo "version=${{ steps.meta.outputs.version }}"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - id: meta</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    run: echo "version=1.0.0" &gt;&gt; "$GITHUB_OUTPUT"</code> | 设置 `run` 字段的值为 `echo "version=1.0.0" >> "$GITHUB_OUTPUT"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 5 行 | <code>  - run: echo "version=${{ steps.meta.outputs.version }}"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


### 添加 job summary

```yaml
steps:
  - name: Summary
    run: |
      echo "## AIOps Docs Build" >> "$GITHUB_STEP_SUMMARY"
      echo "- status: success" >> "$GITHUB_STEP_SUMMARY"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  - name: Summary</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 3 行 | <code>    run: &#124;</code> | 设置 `run` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>      echo "## AIOps Docs Build" &gt;&gt; "$GITHUB_STEP_SUMMARY"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 5 行 | <code>      echo "- status: success" &gt;&gt; "$GITHUB_STEP_SUMMARY"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


job summary 会显示在 Actions 页面，比让人翻日志更友好。

## Concurrency

concurrency 控制并发。

如果连续 push 多次，旧的构建可能还没跑完，新的又来了。对 Pages 发布来说，通常只需要最新一次。

```yaml
concurrency:
  group: docs-${{ github.ref }}
  cancel-in-progress: true
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>concurrency:</code> | 定义 `concurrency` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  group: docs-${{ github.ref }}</code> | 设置 `group` 字段的值为 `docs-${{ github.ref }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  cancel-in-progress: true</code> | 设置 `cancel-in-progress` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  deploy:</code> | 定义 `deploy` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      name: production</code> | 设置 `name` 字段的值为 `production`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>      url: https://example.com</code> | 设置 `url` 字段的值为 `https://example.com`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - run: echo "deploy"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Reusable docs build</code> | 设置 `name` 字段的值为 `Reusable docs build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  workflow_call:</code> | 定义 `workflow_call` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    inputs:</code> | 定义 `inputs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>      node-version:</code> | 定义 `node-version` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>        required: false</code> | 设置 `required` 字段的值为 `false`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>        type: string</code> | 设置 `type` 字段的值为 `string`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>        default: "22"</code> | 设置 `default` 字段的值为 `"22"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 11 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>      - uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 16 行 | <code>      - uses: actions/setup-node@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 17 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>          node-version: ${{ inputs.node-version }}</code> | 设置 `node-version` 字段的值为 `${{ inputs.node-version }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 19 行 | <code>          cache: npm</code> | 设置 `cache` 字段的值为 `npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 20 行 | <code>      - run: npm ci</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 21 行 | <code>      - run: npm run docs:build</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


调用方：

```yaml
jobs:
  docs:
    uses: ./.github/workflows/reusable-docs.yml
    with:
      node-version: "22"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  docs:</code> | 定义 `docs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    uses: ./.github/workflows/reusable-docs.yml</code> | 设置 `uses` 字段的值为 `./.github/workflows/reusable-docs.yml`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      node-version: "22"</code> | 设置 `node-version` 字段的值为 `"22"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

## VitePress 构建 workflow

适合这个知识库的最小构建检查：

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
          name: vitepress-dist
          path: docs/.vitepress/dist
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Build docs</code> | 设置 `name` 字段的值为 `Build docs`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  push:</code> | 定义 `push` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    branches: [main]</code> | 设置 `branches` 字段的值为 `[main]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>    paths:</code> | 定义 `paths` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>      - "docs/**"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 8 行 | <code>      - "package.json"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>      - "package-lock.json"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 10 行 | <code>      - ".github/workflows/docs-build.yml"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 11 行 | <code>  pull_request:</code> | 定义 `pull_request` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>    branches: [main]</code> | 设置 `branches` 字段的值为 `[main]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>    paths:</code> | 定义 `paths` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>      - "docs/**"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 15 行 | <code>      - "package.json"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 16 行 | <code>      - "package-lock.json"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 17 行 | <code>      - ".github/workflows/docs-build.yml"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 18 行 | <code>  workflow_dispatch:</code> | 定义 `workflow_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 19 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 20 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 21 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 23 行 | <code>concurrency:</code> | 定义 `concurrency` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 24 行 | <code>  group: docs-build-${{ github.ref }}</code> | 设置 `group` 字段的值为 `docs-build-${{ github.ref }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 25 行 | <code>  cancel-in-progress: true</code> | 设置 `cancel-in-progress` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 27 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 28 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 29 行 | <code>    name: Build VitePress</code> | 设置 `name` 字段的值为 `Build VitePress`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 30 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 31 行 | <code>    timeout-minutes: 10</code> | 设置 `timeout-minutes` 字段的值为 `10`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 32 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 33 行 | <code>      - name: Checkout</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 34 行 | <code>        uses: actions/checkout@v4</code> | 设置 `uses` 字段的值为 `actions/checkout@v4`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 35 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 36 行 | <code>      - name: Setup Node</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 37 行 | <code>        uses: actions/setup-node@v4</code> | 设置 `uses` 字段的值为 `actions/setup-node@v4`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 38 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 39 行 | <code>          node-version: 22</code> | 设置 `node-version` 字段的值为 `22`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 40 行 | <code>          cache: npm</code> | 设置 `cache` 字段的值为 `npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 41 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 42 行 | <code>      - name: Install dependencies</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 43 行 | <code>        run: npm ci</code> | 设置 `run` 字段的值为 `npm ci`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 44 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 45 行 | <code>      - name: Build docs</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 46 行 | <code>        run: npm run docs:build</code> | 设置 `run` 字段的值为 `npm run docs:build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 47 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 48 行 | <code>      - name: Upload dist</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 49 行 | <code>        uses: actions/upload-artifact@v4</code> | 设置 `uses` 字段的值为 `actions/upload-artifact@v4`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 50 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 51 行 | <code>          name: vitepress-dist</code> | 设置 `name` 字段的值为 `vitepress-dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 52 行 | <code>          path: docs/.vitepress/dist</code> | 设置 `path` 字段的值为 `docs/.vitepress/dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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
          path: docs/.vitepress/dist

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Deploy docs</code> | 设置 `name` 字段的值为 `Deploy docs`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  push:</code> | 定义 `push` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    branches: [main]</code> | 设置 `branches` 字段的值为 `[main]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  workflow_dispatch:</code> | 定义 `workflow_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 8 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>  pages: write</code> | 设置 `pages` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>  id-token: write</code> | 设置 `id-token` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 13 行 | <code>concurrency:</code> | 定义 `concurrency` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>  group: pages</code> | 设置 `group` 字段的值为 `pages`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 15 行 | <code>  cancel-in-progress: true</code> | 设置 `cancel-in-progress` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 16 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 17 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 19 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 20 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 21 行 | <code>      - uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 23 行 | <code>      - uses: actions/setup-node@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 24 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 25 行 | <code>          node-version: 22</code> | 设置 `node-version` 字段的值为 `22`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 26 行 | <code>          cache: npm</code> | 设置 `cache` 字段的值为 `npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 27 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 28 行 | <code>      - run: npm ci</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 29 行 | <code>      - run: npm run docs:build</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 30 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 31 行 | <code>      - uses: actions/configure-pages@v5</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 32 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 33 行 | <code>      - uses: actions/upload-pages-artifact@v3</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 34 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 35 行 | <code>          path: docs/.vitepress/dist</code> | 设置 `path` 字段的值为 `docs/.vitepress/dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 36 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 37 行 | <code>  deploy:</code> | 定义 `deploy` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 38 行 | <code>    needs: build</code> | 设置 `needs` 字段的值为 `build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 39 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 40 行 | <code>    environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 41 行 | <code>      name: github-pages</code> | 设置 `name` 字段的值为 `github-pages`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 42 行 | <code>      url: ${{ steps.deployment.outputs.page_url }}</code> | 设置 `url` 字段的值为 `${{ steps.deployment.outputs.page_url }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 43 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 44 行 | <code>      - id: deployment</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 45 行 | <code>        uses: actions/deploy-pages@v4</code> | 设置 `uses` 字段的值为 `actions/deploy-pages@v4`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


执行链路：

```text
push main
  -> build job
     -> checkout
     -> setup node
     -> npm ci
     -> npm run docs:build
     -> upload pages artifact
  -> deploy job
     -> deploy-pages
  -> GitHub Pages 更新
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>push main</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; build job</code> | 这一行要理解这些英文词：`build job` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>     -&gt; checkout</code> | 这一行要理解这些英文词：`checkout` 是检出代码或切换到指定版本。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; setup node</code> | 这一行要理解这些英文词：`setup node` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; npm ci</code> | 这一行要理解这些英文词：`npm ci` 是ci=持续集成。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; npm run docs:build</code> | 这一行要理解这些英文词：`npm run docs` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`build` 是构建，把源码、配置或文档生成可运行或可发布的产物。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>     -&gt; upload pages artifact</code> | 这一行要理解这些英文词：`upload pages artifact` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; deploy job</code> | 这一行要理解这些英文词：`deploy job` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; deploy-pages</code> | 这一行要理解这些英文词：`deploy-pages` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; GitHub Pages 更新</code> | 这一行要理解这些英文词：`GitHub Pages` 是github=代码托管平台。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


常见失败点：

| 失败点 | 现象 | 排查 |
|---|---|---|
| Pages 设置不是 GitHub Actions | workflow 成功但页面不更新 | Settings -> Pages |
| `base` 配错 | 页面资源 404 | 检查 VitePress `base` |
| artifact 路径错 | deploy 找不到文件 | 检查 `docs/.vitepress/dist` |
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
        run: |
          mkdir -p reports
          {
            echo "# AIOps Diagnostic Report"
            echo ""
            echo "- service: ${{ inputs.service }}"
            echo "- window: ${{ inputs.window }}"
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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: AIOps diagnostic</code> | 设置 `name` 字段的值为 `AIOps diagnostic`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  workflow_dispatch:</code> | 定义 `workflow_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    inputs:</code> | 定义 `inputs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>      service:</code> | 定义 `service` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>        description: "Service name"</code> | 设置 `description` 字段的值为 `"Service name"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>        required: true</code> | 设置 `required` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>        type: string</code> | 设置 `type` 字段的值为 `string`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>      window:</code> | 定义 `window` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>        description: "Time window"</code> | 设置 `description` 字段的值为 `"Time window"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <code>        required: true</code> | 设置 `required` 字段的值为 `true`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>        type: choice</code> | 设置 `type` 字段的值为 `choice`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>        options:</code> | 定义 `options` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>          - 15m</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 16 行 | <code>          - 1h</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 17 行 | <code>          - 6h</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 18 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 19 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 20 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 21 行 | <code>  issues: write</code> | 设置 `issues` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 22 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 23 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 24 行 | <code>  diagnose:</code> | 定义 `diagnose` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 25 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 26 行 | <code>    timeout-minutes: 15</code> | 设置 `timeout-minutes` 字段的值为 `15`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 27 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 28 行 | <code>      - uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 29 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 30 行 | <code>      - name: Generate diagnostic report</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 31 行 | <code>        run: &#124;</code> | 设置 `run` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 32 行 | <code>          mkdir -p reports</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 33 行 | <code>          {</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 34 行 | <code>            echo "# AIOps Diagnostic Report"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 35 行 | <code>            echo ""</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 36 行 | <code>            echo "- service: ${{ inputs.service }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 37 行 | <code>            echo "- window: ${{ inputs.window }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 38 行 | <code>            echo "- commit: ${{ github.sha }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 39 行 | <code>            echo "- run: ${{ github.run_id }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 40 行 | <code>          } &gt; reports/diagnostic.md</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 41 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 42 行 | <code>      - name: Upload report</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 43 行 | <code>        uses: actions/upload-artifact@v4</code> | 设置 `uses` 字段的值为 `actions/upload-artifact@v4`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 44 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 45 行 | <code>          name: aiops-diagnostic</code> | 设置 `name` 字段的值为 `aiops-diagnostic`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 46 行 | <code>          path: reports/diagnostic.md</code> | 设置 `path` 字段的值为 `reports/diagnostic.md`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 47 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 48 行 | <code>      - name: Add summary</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 49 行 | <code>        run: &#124;</code> | 设置 `run` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 50 行 | <code>          cat reports/diagnostic.md &gt;&gt; "$GITHUB_STEP_SUMMARY"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh auth login</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh workflow list</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：列出仓库 workflow。

常看字段：

- workflow 名字。
- 状态是否 active。
- workflow id。

### gh workflow view

```bash
gh workflow view "Build docs"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh workflow view "Build docs"</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：查看某个 workflow 的信息。

### gh workflow run

```bash
gh workflow run "AIOps diagnostic" -f service=api -f window=1h
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh workflow run "AIOps diagnostic" -f service=api -f window=1h</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：手动触发带 `workflow_dispatch` 的 workflow。

含义：

- `-f service=api` 传输入参数。
- `-f window=1h` 传诊断窗口。

### gh run list

```bash
gh run list --limit 10
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run list --limit 10</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


作用：查看最近 workflow runs。

常用：

```bash
gh run list --workflow "Build docs"
gh run list --branch main
gh run list --status failure
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run list --workflow "Build docs"</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>gh run list --branch main</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 3 行 | <code>gh run list --status failure</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### gh run view

```bash
gh run view <run-id>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run view &lt;run-id&gt;</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：查看某次 run 详情。

带日志：

```bash
gh run view <run-id> --log
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run view &lt;run-id&gt; --log</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### gh run watch

```bash
gh run watch <run-id>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run watch &lt;run-id&gt;</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：实时等待 run 完成。

### gh run rerun

```bash
gh run rerun <run-id>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run rerun &lt;run-id&gt;</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：重新运行某次 workflow run。

适合临时网络失败、外部服务抖动后重试。

### gh run cancel

```bash
gh run cancel <run-id>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run cancel &lt;run-id&gt;</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：取消正在运行的 run。

### gh run download

```bash
gh run download <run-id> -n vitepress-dist
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run download &lt;run-id&gt; -n vitepress-dist</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：下载 artifact。

### gh secret list

```bash
gh secret list
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh secret list</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：列出仓库 secrets 名称。

注意：只能看到名字，看不到值。

### gh secret set

```bash
gh secret set API_TOKEN
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh secret set API_TOKEN</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：设置 secret。命令会提示输入值。

从文件读取：

```bash
gh secret set API_TOKEN < token.txt
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh secret set API_TOKEN &lt; token.txt</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


### gh cache list

```bash
gh cache list
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh cache list</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：查看 Actions cache。

### gh cache delete

```bash
gh cache delete <cache-id>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh cache delete &lt;cache-id&gt;</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：删除 cache。

适合缓存污染时清理。

## 入门实验 1：最小 workflow

目标：让你第一次看到 Actions 自动运行。

创建文件：

```text
.github/workflows/hello.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.github/workflows/hello.yml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Hello Actions</code> | 设置 `name` 字段的值为 `Hello Actions`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  push:</code> | 定义 `push` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    branches: [main]</code> | 设置 `branches` 字段的值为 `[main]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  workflow_dispatch:</code> | 定义 `workflow_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 8 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 11 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>  hello:</code> | 定义 `hello` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>      - name: Print context</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 16 行 | <code>        run: &#124;</code> | 设置 `run` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 17 行 | <code>          echo "repository=${{ github.repository }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 18 行 | <code>          echo "ref=${{ github.ref }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 19 行 | <code>          echo "sha=${{ github.sha }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 20 行 | <code>          echo "runner=${{ runner.os }}"</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.github/workflows/docs-build.yml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Build docs</code> | 设置 `name` 字段的值为 `Build docs`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  pull_request:</code> | 定义 `pull_request` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    branches: [main]</code> | 设置 `branches` 字段的值为 `[main]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  push:</code> | 定义 `push` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <code>    branches: [main]</code> | 设置 `branches` 字段的值为 `[main]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>  workflow_dispatch:</code> | 定义 `workflow_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 10 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 13 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 14 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 16 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>      - uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 18 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 19 行 | <code>      - uses: actions/setup-node@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 20 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 21 行 | <code>          node-version: 22</code> | 设置 `node-version` 字段的值为 `22`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 22 行 | <code>          cache: npm</code> | 设置 `cache` 字段的值为 `npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 23 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 24 行 | <code>      - run: npm ci</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 25 行 | <code>      - run: npm run docs:build</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


故意制造一次失败：

1. 在某个 Markdown 文件里写一个未闭合代码块。
2. push。
3. 看 Actions 失败日志。
4. 修复 Markdown。
5. 再 push。

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
    path: docs/.vitepress/dist
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- name: Upload dist</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  uses: actions/upload-artifact@v4</code> | 设置 `uses` 字段的值为 `actions/upload-artifact@v4`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>    name: docs-dist</code> | 设置 `name` 字段的值为 `docs-dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    path: docs/.vitepress/dist</code> | 设置 `path` 字段的值为 `docs/.vitepress/dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Daily AIOps report</code> | 设置 `name` 字段的值为 `Daily AIOps report`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  schedule:</code> | 定义 `schedule` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    - cron: "0 2 * * *"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 6 行 | <code>  workflow_dispatch:</code> | 定义 `workflow_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 8 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 11 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>  report:</code> | 定义 `report` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>      - name: Generate report</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 16 行 | <code>        run: &#124;</code> | 设置 `run` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 17 行 | <code>          mkdir -p reports</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 18 行 | <code>          date -u &gt; reports/daily.txt</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 19 行 | <code>          echo "AIOps daily check placeholder" &gt;&gt; reports/daily.txt</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 21 行 | <code>      - uses: actions/upload-artifact@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 22 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 23 行 | <code>          name: daily-aiops-report</code> | 设置 `name` 字段的值为 `daily-aiops-report`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 24 行 | <code>          path: reports/daily.txt</code> | 设置 `path` 字段的值为 `reports/daily.txt`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>YAML 解析失败</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; workflow 文件格式问题</code> | 这一行要理解这些英文词：`workflow` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>checkout 失败</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  -&gt; 仓库权限、网络、ref 问题</code> | 这一行要理解这些英文词：`ref` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 7 行 | <code>npm ci 失败</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  -&gt; lockfile、node 版本、registry 问题</code> | 这一行要理解这些英文词：`lockfile` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`node` 是节点，可以指服务器、Kubernetes 节点或图里的一个步骤；`registry` 是插件或模块注册中心。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 10 行 | <code>build 失败</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  -&gt; 项目代码、文档、配置问题</code> | 这一行表示上一级主题下的子项“项目代码、文档、配置问题”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 12 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 13 行 | <code>deploy 失败</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 14 行 | <code>  -&gt; permissions、environment、artifact、Pages 设置问题</code> | 这一行要理解这些英文词：`permissions` 是权限，决定谁能读、写、执行或管理资源；`environment` 是环境，例如开发、测试、预发或生产；`artifact` 是构建产物，例如打包后的文件、镜像或部署包；`Pages` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 16 行 | <code>secret 为空</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 17 行 | <code>  -&gt; secret 未配置、名字错、fork PR 限制、environment 未通过审批</code> | 这一行要理解这些英文词：`secret` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`fork PR` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`environment` 是环境，例如开发、测试、预发或生产。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


## 安全边界

GitHub Actions 一旦能拿 token、读 secret、部署生产环境，就变成安全敏感系统。

### 最小权限

推荐从只读开始：

```yaml
permissions:
  contents: read
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


需要写 Issue 才加：

```yaml
permissions:
  contents: read
  issues: write
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  issues: write</code> | 设置 `issues` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


需要 Pages 才加：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>  pages: write</code> | 设置 `pages` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>  id-token: write</code> | 设置 `id-token` 字段的值为 `write`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  pull_request_target:</code> | 定义 `pull_request_target` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 4 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>  dangerous:</code> | 定义 `dangerous` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 8 行 | <code>      - uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 9 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 10 行 | <code>          ref: ${{ github.event.pull_request.head.sha }}</code> | 设置 `ref` 字段的值为 `${{ github.event.pull_request.head.sha }}`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 11 行 | <code>      - run: ./script-from-pr.sh</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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
GitHub Actions
  -> OIDC token
  -> cloud provider trust policy
  -> short-lived credential
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>GitHub Actions</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; OIDC token</code> | 这一行要理解这些英文词：`OIDC token` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; cloud provider trust policy</code> | 这一行要理解这些英文词：`cloud provider trust policy` 是provider=Terraform 连接云厂商或平台的插件。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; short-lived credential</code> | 这一行要理解这些英文词：`short-lived credential` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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
