# CI/CD

> 目标：能真正讲清持续集成、持续交付、持续部署的区别，能设计一条从提交到发布再到回滚的最小流水线，并能把发布记录、部署结果、告警、指标和事故复盘串成 AIOps 里的变更时间线。

## 官方资料

CI/CD 不是某一个厂商的单项产品，所以本文用 GitHub Actions 官方 CI/CD 文档作为工程落地骨架，用 DORA 官方指标作为交付度量参考：

- [GitHub Actions documentation](https://docs.github.com/actions)
- [GitHub Actions quickstart](https://docs.github.com/en/actions/get-started/quickstart)
- [Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions)
- [Continuous integration with GitHub Actions](https://docs.github.com/en/actions/get-started/continuous-integration)
- [Continuous deployment with GitHub Actions](https://docs.github.com/en/actions/get-started/continuous-deployment)
- [Building and testing Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
- [Deploying with GitHub Actions](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments)
- [Managing environments for deployment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [Publishing packages with GitHub Actions](https://docs.github.com/en/actions/tutorials/publish-packages)
- [DORA software delivery performance metrics](https://dora.dev/guides/dora-metrics/)
- [Google Cloud Four Keys metrics](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance)

说明：本文是基于以上资料整理的原创中文教程，不复制官方全文。

## 场景开场

线上故障很少是“凭空出现”的。

更多时候，它前面有一串变更：

```text
10:01 合并 PR
10:03 CI 通过
10:05 构建镜像
10:07 部署到 staging
10:12 人工批准 production 发布
10:15 production 开始滚动更新
10:18 错误率上升
10:20 告警触发
10:23 值班同学回滚
```

如果没有 CI/CD，这条线会变成一团雾：谁改了什么？什么时候发布？发布的是哪个版本？有没有测试？有没有审批？回滚到了哪里？发布后哪些指标变坏？

CI/CD 的价值，是把“代码怎么到生产环境”这件事变成可重复、可检查、可追踪、可回滚的系统。

对 AIOps 来说，CI/CD 是变更数据源。没有变更上下文，AIOps 很容易只看到“CPU 高了、错误率高了”，却不知道“刚刚发布了一个版本”。

## 一句话人话版

CI/CD 就是把代码变更从提交到上线的过程流水线化：每次变更自动构建、测试、打包、部署、验证、记录结果，出了问题能快速定位和回滚。

## 小白可能会问

- CI、持续交付、持续部署是不是一个东西？
- pipeline、stage、job、step、artifact、environment 分别是什么？
- 为什么测试通过还不能保证发布没问题？
- 为什么 artifact 要不可变？
- 为什么发布到生产环境要审批？
- 蓝绿、滚动、金丝雀、功能开关到底解决什么问题？
- 回滚是不是重新部署旧版本？
- 数据库变更为什么会让回滚变复杂？
- CI/CD 指标和 DORA 指标有什么关系？
- AIOps 怎么用 CI/CD 记录做根因分析？

## 官方知识地图

可以把 CI/CD 学成这棵树：

```text
CI/CD（持续集成与持续交付或部署）
  -> Source control（源代码版本管理）
     -> commit（提交）
     -> branch（分支）
     -> pull request（合并请求）
     -> merge（合并）
     -> tag / release（标签／发布）
  -> CI: Continuous Integration（持续集成）
     -> trigger（触发）
     -> checkout（检出源码）
     -> dependency install（安装依赖）
     -> lint / format（静态检查／格式检查）
     -> unit test（单元测试）
     -> integration test（集成测试）
     -> build（构建）
     -> security scan（安全扫描）
     -> artifact（制品）
     -> status check（状态检查）
  -> CD: Continuous Delivery / Deployment（持续交付／持续部署）
     -> artifact registry（制品仓库）
     -> environment（环境）
     -> deployment（部署）
     -> approval（审批）
     -> secrets（机密配置）
     -> rollout（逐步发布）
     -> smoke test（基础可用性测试）
     -> observability verification（通过观测验证）
     -> rollback（回滚）
  -> Release strategy（发布策略）
     -> rolling update（滚动更新）
     -> blue / green（蓝绿发布）
     -> canary（金丝雀灰度）
     -> feature flag（功能开关）
  -> Operational feedback（运行反馈）
     -> deployment history（部署历史）
     -> logs（日志）
     -> metrics（指标）
     -> alerts（告警）
     -> incidents（事故）
     -> postmortem（复盘）
  -> Delivery metrics（交付度量）
     -> deployment frequency（部署频率）
     -> change lead time（变更前置时间）
     -> change fail rate（变更失败率）
     -> failed deployment recovery time（失败部署恢复时间）
     -> deployment rework rate（部署返工率）
```

最小主线：

```text
commit（提交）
  -> CI checks（集成检查）
  -> artifact（制品）
  -> deploy to staging（部署预发）
  -> approval（批准）
  -> deploy to production（部署生产）
  -> verify（验证）
  -> monitor（观察）
  -> rollback or continue（回滚或继续）
```

## CI/CD 在 AIOps 链路中的位置

AIOps 需要多类信号：

```text
Metrics: CPU、内存、请求量、错误率、延迟
Logs: 应用日志、访问日志、错误堆栈
Traces: 请求链路、慢调用
Events: 发布、配置变更、扩容、重启、故障
Incidents: 告警、工单、复盘
```

CI/CD 提供的就是“变更事件”：

| 变更事件 | AIOps 为什么需要 |
|---|---|
| PR 合并时间 | 判断故障前是否刚合入变更 |
| commit SHA | 精确定位代码版本 |
| build id | 关联构建日志和产物 |
| artifact/image tag | 判断部署的到底是什么 |
| deployment environment | 区分 dev/staging/prod |
| approver | 复盘时知道谁批准 |
| rollout start/end | 对齐指标异常时间 |
| rollback | 判断恢复动作是否生效 |
| failed deployment | 计算变更失败率 |

没有 CI/CD 记录，AIOps 只能猜“是不是发布导致的”。有 CI/CD 记录，AIOps 可以问更具体的问题：

```text
错误率升高前 30 分钟内，production 有没有部署？
部署版本对应哪些 PR？
部署后 smoke test 是否通过？
失败服务的日志是否只出现在新版本 Pod 上？
回滚后 SLO 是否恢复？
```

## CI、持续交付、持续部署

三个词很像，但边界不同。

### CI：Continuous Integration

CI 是持续集成。

核心思想：频繁把代码合入共享仓库，并自动构建和测试，尽早发现错误。

```text
developer commit（开发者提交）
  -> push / pull request（推送或合并请求）
  -> build（构建）
  -> lint（静态风格检查）
  -> test（测试）
  -> report status（回报状态）
```

CI 关注的是“这个变更能不能安全合入”。

它回答：

- 代码能不能编译？
- 依赖能不能安装？
- 单元测试是否通过？
- 格式是否符合规范？
- 安全扫描是否有明显风险？
- 文档站是否能构建？

CI 不一定发布。

### Continuous Delivery：持续交付

持续交付的目标是：代码随时处于可发布状态。

流水线会自动构建、测试、打包、部署到预发环境，但生产发布通常需要人工确认。

```text
merge main（合并到主分支）
  -> build（构建）
  -> test（测试）
  -> package artifact（打包制品）
  -> deploy staging（部署预发布环境）
  -> smoke test（冒烟测试）
  -> manual approval（人工批准）
  -> deploy production（部署生产环境）
```

持续交付关注的是“我们是否随时能可靠发布”。

它回答：

- 产物是否可复现？
- staging 是否通过验证？
- 生产发布前是否有人审批？
- secrets 是否只在正确环境可用？
- 回滚方案是否明确？

### Continuous Deployment：持续部署

持续部署是更进一步：通过所有验证的变更会自动部署到生产。

```text
merge main（合并到主分支）
  -> build（构建）
  -> test（测试）
  -> package（打包）
  -> deploy production automatically（自动部署生产）
  -> verify（验证）
```

持续部署关注的是“发布是否完全自动化”。

它要求更高：

- 测试可靠。
- 监控完善。
- 发布策略安全。
- 自动回滚或快速回滚可用。
- 小批量变更。
- 团队能接受快速反馈。

### 三者对比

| 项目 | CI | 持续交付 | 持续部署 |
|---|---|---|---|
| 主要目标 | 尽早发现集成问题 | 保持随时可发布 | 自动把变更发布到生产 |
| 常见触发 | PR、push | merge、tag、release | merge 到主分支 |
| 是否构建 | 是 | 是 | 是 |
| 是否测试 | 是 | 是 | 是 |
| 是否打包产物 | 可选 | 是 | 是 |
| 是否部署 staging | 可选 | 常见 | 常见 |
| 是否部署 production | 否 | 人工批准后 | 自动 |
| 风险控制 | 状态检查 | 审批、环境、回滚 | 自动验证、金丝雀、自动回滚 |

## 核心对象

| 对象 | 是什么 | 为什么重要 |
|---|---|---|
| Source control | Git 仓库、分支、PR、commit | 变更来源 |
| Pipeline | 一条自动化流水线 | 把交付步骤标准化 |
| Stage | 流水线的大阶段 | build、test、deploy 等 |
| Job | 可执行任务单元 | 可并行、可依赖 |
| Step | job 内的具体命令 | 失败定位到最小步骤 |
| Runner/Agent | 执行 job 的机器 | 环境一致性和权限边界 |
| Artifact | 构建产物 | 发布的对象必须可追溯 |
| Registry | 存产物的地方 | Docker registry、package registry |
| Environment | 部署目标 | dev、staging、production |
| Approval | 人工审批 | 控制生产风险 |
| Secret | 敏感信息 | token、密码、云凭证 |
| Deployment | 一次发布动作 | AIOps 变更事件核心 |
| Release | 对外发布版本 | 用户可见版本 |
| Rollback | 恢复到旧版本或旧状态 | 缩短故障恢复时间 |

## Pipeline 如何工作

一条典型 pipeline：

```text
Trigger（触发器）
  -> Checkout（检出源码）
  -> Setup runtime（准备运行时）
  -> Install dependencies（安装依赖）
  -> Lint（静态检查）
  -> Unit test（单元测试）
  -> Build（构建）
  -> Package artifact（打包制品）
  -> Upload artifact（上传制品）
  -> Deploy staging（部署预发布）
  -> Smoke test（冒烟测试）
  -> Approval（批准）
  -> Deploy production（部署生产）
  -> Verify（验证）
  -> Notify / record deployment（通知并记录发布）
```

每个阶段都应该有清晰输入和输出：

| 阶段 | 输入 | 输出 |
|---|---|---|
| checkout | commit SHA | 工作目录 |
| install | lockfile | 依赖目录或缓存 |
| lint | 源码 | 格式/规范结果 |
| test | 源码、依赖 | 测试结果、覆盖率 |
| build | 源码、依赖 | build 文件 |
| package | build 文件 | artifact 或镜像 |
| deploy | artifact、环境配置 | 新版本运行中 |
| verify | 新版本、监控数据 | 成功/失败判断 |
| rollback | 上一个稳定版本 | 恢复结果 |

关键原则：

- 后一个阶段不要重复造前一个阶段的产物。
- 生产部署必须知道 artifact 来自哪个 commit。
- 失败要停在明确位置，不要吞掉错误。
- 每次部署要能被记录和查询。

## Source Control 和触发方式

CI/CD 从 Git 变更开始。

常见触发：

| 触发 | 用途 |
|---|---|
| `pull_request` | 合并前检查 |
| `push` to main | 合并后构建或发布 |
| tag | 发布版本 |
| release | 正式发版 |
| schedule | 定期巡检、依赖检查 |
| workflow_dispatch | 手动发布或回滚 |
| repository_dispatch | 外部系统触发 |

推荐分层：

```text
pull_request（合并请求触发）
  -> lint（静态风格检查） + test（测试） + build（构建）

push main（推送主分支）
  -> build artifact + deploy staging（构建制品并部署预发布）

workflow_dispatch or approval（人工触发或批准）
  -> deploy production（部署生产环境）

tag v*（版本标签触发）
  -> publish release artifact（发布正式制品）
```

为什么 PR 阶段不直接生产发布？

因为 PR 里的代码还没有被合并，可能来自 fork，权限和可信度都不一样。CI 可以检查它，但不应该让它拿生产 secrets。

## CI 阶段深讲

### checkout

runner 默认不是你的项目目录。需要先拉代码。

```yaml
- uses: actions/checkout@v4
```

如果忘了 checkout，后面的 `npm ci`、`pytest`、`docker build` 通常会找不到文件。

### setup runtime

指定运行时版本。

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
```

意义：

- 固定 Node 版本。
- 避免“我本地能跑，CI 不能跑”。
- cache 让依赖安装更快。

Python 示例：

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: "3.12"
    cache: pip
```

### install dependencies

Node 项目：

```bash
npm ci
```

`npm ci` 的特点：

- 按 `package-lock.json` 精确安装。
- 更适合 CI。
- lockfile 和 `package.json` 不一致时会失败。

Python 项目：

```bash
python -m pip install -r requirements.txt
```

如果项目使用 Poetry、uv、pip-tools，要按项目工具写。

### lint / format

lint 检查代码规范和潜在错误。

常见命令：

```bash
npm run lint
python -m ruff check .
python -m black --check .
```

format check 和自动 format 不一样：

- CI 里通常只检查，不自动改。
- 自动改代码应该在本地、pre-commit 或单独 bot 里做。

### test

测试分层：

| 类型 | 检查什么 | 速度 | CI 中的位置 |
|---|---|---|---|
| unit test | 单个函数/模块 | 快 | 每次 PR 必跑 |
| integration test | 模块之间、数据库、API | 中 | PR 或 main |
| contract test | 服务接口契约 | 中 | 微服务重要 |
| e2e test | 从用户路径验证 | 慢 | 合并前或发布前 |
| smoke test | 部署后基本健康 | 快 | staging/prod 发布后 |

测试失败时要看：

- 哪个测试文件失败。
- 失败断言是什么。
- 是否依赖外部服务。
- 是否因为环境变量缺失。
- 是否有并发或时间相关问题。

### build

构建把源码变成可运行或可发布产物。

例子：

```bash
npm run build
npm run docs:build
python -m build
go build ./...
docker build -t aiops-api:local .
```

构建失败常见原因：

- 依赖版本不一致。
- 环境变量缺失。
- TypeScript 类型错误。
- Markdown/VitePress 渲染错误。
- Dockerfile 路径错误。

### security scan

安全检查可以包括：

- 依赖漏洞扫描。
- secret scanning。
- container image scan。
- SAST 静态分析。
- IaC 配置扫描。

初学先理解原则：

```text
不是所有安全问题都能阻断发布，
但严重风险必须进入质量门禁。
```
### artifact

CI 的重要产出是 artifact。

artifact 可以是：

- 静态站点目录。
- Python wheel。
- Docker image。
- 测试报告。
- 覆盖率报告。
- SBOM。

核心原则：

```text
Build once, deploy the same artifact.
```

也就是只构建一次，后续环境都部署同一个产物。不要 dev 构建一次、staging 构建一次、prod 又构建一次。那样会导致“生产环境跑的不是你测试过的东西”。

## 最小 CI workflow

适合这个知识库的文档 CI：

```yaml
name: Docs CI

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
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npm run docs:build

      - uses: actions/upload-artifact@v4
        with:
          name: docs-dist
          path: dist
          if-no-files-found: error
```

这条流水线做了：

1. PR 和 main push 自动触发。
2. 拉取代码。
3. 固定 Node 版本。
4. 安装依赖。
5. 构建文档。
6. 保存构建产物。

它没有做：

- 生产部署。
- 审批。
- 回滚。
- 告警关联。

所以它是 CI，不是完整 CD。

## CD 阶段深讲

CD 的核心不是“把命令 ssh 到服务器上跑一下”，而是可控发布。

### artifact registry

构建产物要放到稳定位置。

常见 registry：

- GitHub Actions artifact。
- GitHub Packages。
- Docker Hub。
- AWS ECR。
- Azure Container Registry。
- Google Artifact Registry。
- npm / PyPI / Maven repository。

产物命名建议包含：

- 服务名。
- 版本号。
- commit SHA。
- 构建时间或 build number。

Docker image 示例：

```text
ghcr.io/quweisheng/aiops-api:1.4.2
ghcr.io/quweisheng/aiops-api:sha-abc1234
```

不要只用 `latest` 做生产发布依据。`latest` 会移动，事后难追踪。

### environment

环境是部署目标。

常见环境：

| 环境 | 作用 |
|---|---|
| dev | 开发自测 |
| test | 测试环境 |
| staging | 类生产预发 |
| production | 生产环境 |

GitHub Actions 里的 environment 可以加：

- required reviewers。
- wait timer。
- branch/tag 限制。
- environment secrets。
- environment variables。

生产环境建议：

```yaml
environment:
  name: production
```

然后在 GitHub Settings -> Environments 里配置审批和 secrets。

### approval

审批不是为了拖慢发布，而是为了在高风险操作前停一下。

适合审批的场景：

- 部署生产。
- 执行数据库迁移。
- 执行 Terraform apply。
- 回滚核心服务。
- 开启高风险功能开关。

审批时要看：

- 本次版本包含哪些 PR。
- CI 是否全绿。
- staging 验证是否通过。
- 是否有数据库变更。
- 是否有回滚方案。
- 当前是否处于业务高峰。

### deploy

部署动作可能是：

```bash
kubectl apply -f k8s/
kubectl set image deployment/aiops-api aiops-api=ghcr.io/org/aiops-api:sha-abc1234
helm upgrade --install aiops-api ./chart --set image.tag=sha-abc1234
terraform apply
az webapp deployment source config-zip
aws deploy create-deployment
```

部署命令本身不是重点。重点是它必须有：

- 明确环境。
- 明确版本。
- 明确权限。
- 明确输出。
- 明确失败处理。

### smoke test

smoke test 是发布后的快速健康检查。

例子：

```bash
curl -f https://example.com/healthz
curl -f https://example.com/readyz
```

更成熟一点：

```bash
curl -fsS https://example.com/api/version
curl -fsS https://example.com/api/metrics
```

smoke test 不等于完整测试。它只回答：

```text
服务是不是起来了？
关键入口是不是能访问？
新版本是不是基本可用？
```
### observability verification

发布后不能只看命令退出码。还要看运行状态。

建议观察：

- 错误率。
- P95/P99 延迟。
- 请求量。
- CPU/内存。
- Pod restart。
- 日志 error。
- 关键业务指标。
- SLO burn rate。

这一步是 CI/CD 和 AIOps 的交界处。

## 持续交付 workflow 示例

下面是一条“构建 -> staging -> 人工审批 -> production”的简化链路：

```yaml
name: Delivery

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: delivery-main
  cancel-in-progress: false

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

      - uses: actions/upload-artifact@v4
        with:
          name: docs-dist
          path: dist
          if-no-files-found: error

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: staging
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: docs-dist
          path: dist
      - run: echo "deploy dist to staging"
      - run: echo "smoke test staging"

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: docs-dist
          path: dist
      - run: echo "deploy dist to production"
      - run: echo "verify production"
```

这个示例展示持续交付的编排骨架，但 `echo` 步骤没有真的部署或验证，不能把绿色结果当成 staging 或 production 发布成功。要连接真实环境，必须实现部署、健康验证和回滚，并配置实际环境审批规则。

它表达的持续交付关系是：

- 构建和 staging 自动。
- production 通过 environment 可以配置人工审批。
- 发布使用 build 产出的同一个 artifact。

如果 production 不需要审批，通过验证后自动发布，就更接近持续部署。

## 发布策略

### Rolling update

滚动更新是一批一批替换旧实例。

```text
old（旧版） old（旧版） old（旧版） old（旧版）
  -> new（新版） old（旧版） old（旧版） old（旧版）
  -> new（新版） new（新版） old（旧版） old（旧版）
  -> new（新版） new（新版） new（新版） old（旧版）
  -> new（新版） new（新版） new（新版） new（新版）
```

优点：

- 简单。
- 资源占用较少。
- Kubernetes Deployment 默认就是滚动更新思路。

风险：

- 新旧版本会同时存在。
- 数据库/schema/API 不兼容会出问题。
- 如果错误慢慢出现，发现可能不够快。

适合：

- 普通无状态服务。
- 兼容性处理好的接口。

### Blue/green

蓝绿发布是同时保留两套环境：

```text
blue: old version, serving traffic
green: new version, no traffic

validate green
switch traffic to green
```

优点：

- 切换快。
- 回滚可以把流量切回 blue。
- 验证环境更完整。

风险：

- 资源成本高。
- 数据库共享时仍要处理兼容。
- 流量切换配置要可靠。

适合：

- 高风险发布。
- 需要快速切换/回滚的系统。

### Canary

金丝雀发布先给少量流量：

```text
1% users（用户） -> new version（新版本）
observe（观察）
10% users（用户） -> new version（新版本）
observe（观察）
50% users（用户） -> new version（新版本）
observe（观察）
100% users（用户） -> new version（新版本）
```

优点：

- 小范围暴露问题。
- 可以用真实流量验证。
- 很适合结合指标自动判断。

风险：

- 需要流量治理能力。
- 需要版本维度指标。
- 需要明确自动暂停/回滚条件。

适合：

- 用户量大。
- 监控成熟。
- 变更风险中高。

### Feature flag

功能开关把“部署代码”和“开启功能”拆开。

```text
deploy code with feature off（部署代码但关闭功能）
  -> enable for internal users（向内部用户启用）
  -> enable for 5%（向百分之五用户启用）
  -> enable for 50%（向半数用户启用）
  -> enable for 100%（向全部用户启用）
```

优点：

- 可以快速关闭功能。
- 发布和功能曝光解耦。
- 支持灰度。

风险：

- 开关太多会变成技术债。
- 每个开关要有清理计划。
- 代码路径更复杂。

适合：

- 新功能灰度。
- A/B 测试。
- 高风险逻辑。

## 回滚策略

回滚不是发布失败后才临时想。

发布前必须回答：

| 问题 | 为什么重要 |
|---|---|
| 回滚到哪个版本？ | 版本必须明确 |
| 旧 artifact 是否还在？ | 没产物无法回滚 |
| 配置能否回滚？ | 配置变更也会引发故障 |
| 数据库变更是否兼容？ | schema 改错最难回 |
| 谁有权限回滚？ | 故障时不能找不到人 |
| 回滚命令是什么？ | 值班时不能临场猜 |
| 回滚后怎么验证？ | 回滚不等于恢复 |

### Kubernetes 回滚

查看 rollout：

```bash
kubectl rollout status deployment/aiops-api -n prod
```

查看历史：

```bash
kubectl rollout history deployment/aiops-api -n prod
```

回滚：

```bash
kubectl rollout undo deployment/aiops-api -n prod
```

回滚到指定 revision：

```bash
kubectl rollout undo deployment/aiops-api -n prod --to-revision=3
```

### Helm 回滚

查看历史：

```bash
helm history aiops-api -n prod
```

回滚：

```bash
helm rollback aiops-api 3 -n prod
```

### 数据库变更

数据库是回滚最容易翻车的地方。

危险变更：

- 删除字段。
- 重命名字段。
- 改字段类型。
- 删除表。
- 不可逆数据迁移。

更安全的模式：

```text
expand（先扩展兼容结构）
  -> 先添加新字段，旧字段保留
migrate（迁移数据与使用方）
  -> 双写或后台迁移数据
contract（最后收缩旧结构）
  -> 确认旧版本不再使用后再删除旧字段
```

这个模式叫 expand-contract。它的目标是让新旧版本在一段时间内都能工作。

## 质量门禁

质量门禁就是“不满足条件，不允许进入下一阶段”。

常见门禁：

| 门禁 | 阻止什么 |
|---|---|
| lint 必须通过 | 格式和基础规范问题 |
| unit test 必须通过 | 明显逻辑回归 |
| build 必须通过 | 构建失败的代码 |
| security high/critical 阻断 | 高危漏洞 |
| coverage 不低于阈值 | 测试大幅退化 |
| PR review 必须通过 | 未审查代码 |
| branch protection | 直接推主分支 |
| staging smoke test | 预发不可用 |
| production approval | 未审批发布 |
| canary 指标健康 | 灰度异常扩大 |

AIOps 项目里，质量门禁还能加入：

- SLO burn rate 不正常时暂停发布。
- 当前存在 P1 事故时禁止非紧急发布。
- 关键告警未恢复时阻止部署。
- 变更窗口外需要额外审批。

## 可观测性和变更关联

发布后要把 deployment 当成一条事件写入观测系统。

理想事件字段：

```json
{
  "service": "aiops-api",
  "environment": "production",
  "version": "1.4.2",
  "commit_sha": "abc1234",
  "deployment_id": "deploy-20260702-101500",
  "started_at": "2026-07-02T10:15:00Z",
  "finished_at": "2026-07-02T10:18:00Z",
  "status": "success",
  "actor": "github-actions",
  "strategy": "rolling"
}
```

这样 AIOps 可以做：

```text
deployment event（部署事件）
  + Prometheus metrics（监控指标）
  + Loki logs（日志）
  + OpenTelemetry traces（链路数据）
  + Alertmanager alerts（告警）
  -> change-aware diagnosis（结合变更的诊断）
```

例子：

```text
10:15 deploy aiops-api 1.4.2
10:17 error_rate starts rising
10:18 p95 latency starts rising
10:20 alert fires

推断方向：
  new deployment is a likely contributor
```

注意：变更相关不等于一定是变更导致。它只是排查优先级很高。

## DORA 指标

DORA 指标用来衡量软件交付表现。官方现在将软件交付表现拆成吞吐和不稳定性等维度。

常见核心指标：

| 指标 | 含义 | 数据来源 |
|---|---|---|
| Deployment frequency | 一段时间内部署多少次 | deployment 记录 |
| Change lead time | 从 commit 到生产部署耗时 | commit 时间 + deployment 时间 |
| Change fail rate | 部署后需要干预的比例 | deployment + incident |
| Failed deployment recovery time | 失败部署恢复所需时间 | incident start/end + deployment |
| Deployment rework rate | 因生产事故产生的非计划部署比例 | deployment + incident/hotfix |

### Deployment frequency

看团队是否能小批量频繁发布。

计算：

```text
successful production deployments / time window
```

例如：

```text
本周 production 成功部署 20 次
deployment frequency = 20/week
```

### Change lead time

看一个变更从进入版本控制到生产运行用了多久。

需要：

- commit timestamp。
- deploy timestamp。
- deploy 包含哪些 commit。

如果一个 commit 周一提交，周三部署到生产，lead time 就是两天。

### Change fail rate

看多少生产部署导致故障、回滚或热修。

计算：

```text
failed deployments / total production deployments
```

关键是团队要定义什么叫 failed deployment：

- 触发生产事故。
- 需要回滚。
- 需要紧急 hotfix。
- 导致 SLO 明显违约。

普通 CI 失败不算 change fail rate，因为它没有进入生产。

### Failed deployment recovery time

看失败部署导致的服务影响恢复用了多久，并在团队统计说明中约定起止时间；故障发生、被发现和恢复是不同事件，不应悄悄互相替代。

需要：

- 事故开始时间。
- 恢复时间。
- 关联的 deployment id。

这和 AIOps 很相关，因为 AIOps 的目标之一就是缩短恢复时间。

## 常用命令字典

CI/CD 不是某一个命令，但这些命令经常出现在流水线里。

### git rev-parse HEAD

```bash
git rev-parse HEAD
```

作用：获取当前 commit SHA。

用途：

- 给 artifact 打版本。
- 写入 deployment event。
- 关联日志和发布。

### npm ci

```bash
npm ci
```

作用：按 lockfile 安装依赖。

适合 CI，因为它追求可重复安装。

### npm run docs:build

```bash
npm run docs:build
```

作用：运行项目定义的文档构建脚本。当前仓库 `docs:build` 是 `npm run build` 的别名，构建 React/Vite 网站，产物是 `dist`；历史 VitePress 项目使用不同目录，不可混用。

在这个知识库里，它就是最重要的 CI 检查之一。

### pytest

```bash
python -m pytest
```

作用：运行 Python 测试。

常见参数：

```bash
python -m pytest -q
python -m pytest tests/test_alerts.py
python -m pytest --maxfail=1
```

### docker build

```bash
docker build -t ghcr.io/quweisheng/aiops-api:sha-abc1234 .
```

作用：构建镜像。

关键点：

- tag 不要只用 `latest`。
- tag 最好包含版本号或 commit SHA。

### docker push

```bash
docker push ghcr.io/quweisheng/aiops-api:sha-abc1234
```

作用：把镜像推到 registry。

### kubectl rollout status

```bash
kubectl rollout status deployment/aiops-api -n prod
```

作用：等待 Kubernetes Deployment 发布完成。

### kubectl rollout undo

```bash
kubectl rollout undo deployment/aiops-api -n prod
```

作用：回滚 Kubernetes Deployment。

### helm upgrade --install

```bash
helm upgrade --install aiops-api ./chart -n prod --set image.tag=sha-abc1234
```

作用：安装或升级 Helm release。

### helm rollback

```bash
helm rollback aiops-api 3 -n prod
```

作用：回滚 Helm release 到指定 revision。

### gh run list

```bash
gh run list --workflow "Docs CI" --limit 10
```

作用：查看最近的 CI/CD runs。

### gh run view --log

```bash
gh run view '<run-id>' --log
```

作用：查看 workflow 运行日志。本节把整个 `<run-id>` 换成上一步核对过的运行编号，保留单引号；不要原样运行占位符。

### gh run rerun

```bash
gh run rerun '<run-id>'
```

作用：重新运行一次失败或需要重试的 workflow。

## 入门实验 1：给知识库建立 CI

目标：每次 PR 或 push 都自动构建文档。

文件：

```text
.github/workflows/docs-ci.yml
```

内容：

```yaml
name: Docs CI

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

做完后你要能解释：

- 为什么 PR 要跑。
- 为什么 push main 也要跑。
- 为什么用 `npm ci`。
- 为什么构建失败不能合并。

## 入门实验 2：保存构建产物

在上面的 workflow 后面加：

```yaml
      - uses: actions/upload-artifact@v4
        with:
          name: docs-dist
          path: dist
          if-no-files-found: error
```

验证：

1. 打开 Actions run。
2. 下载 artifact。
3. 确认有 `index.html`。

学习点：

- artifact 是流水线产物。
- 发布阶段应该使用这个产物。
- artifact 能帮助排查“构建出来的到底是什么”。

## 入门实验 3：模拟部署事件

创建一个脚本：

```bash
mkdir -p reports
cat > reports/deployment.json <<'JSON'
{
  "service": "zero-to-aiops-docs",
  "environment": "staging",
  "version": "sha-demo",
  "status": "success"
}
JSON
```

在 workflow 中上传：

```yaml
      - name: Write deployment event
        run: |
          mkdir -p reports
          cat > reports/deployment.json <<'JSON'
          {
            "service": "zero-to-aiops-docs",
            "environment": "staging",
            "version": "sha-demo",
            "status": "success"
          }
          JSON

      - uses: actions/upload-artifact@v4
        with:
          name: deployment-event
          path: reports/deployment.json
```

学习点：

- deployment event 是 AIOps 里的重要上下文。
- 后续可以把它写到日志系统、数据库或事件平台。

## 入门实验 4：故意制造失败

做一次受控失败：

1. 在独立练习分支的 CI 中加入一个明确的 `run: exit 42` 步骤，不修改生产部署流程。
2. push 该练习分支并发起匹配触发条件的 PR。
3. 观察 CI 在指定步骤失败。错误 Markdown 围栏未必会让解析器报错，不适合作为确定性故障。
4. 找到失败 step。
5. 修复。
6. 再 push。

记录一篇复盘：

```text
失败时间：
失败 workflow：
失败 job：
失败 step：
错误日志：
根因：
修复：
如何避免：
```

这就是最小事故复盘训练。

## 典型故障排查表

| 现象 | 常见原因 | 怎么查 | 怎么修 |
|---|---|---|---|
| pipeline 不触发 | trigger 不匹配 | 看 `on`、分支、paths | 调整触发条件 |
| workflow 语法错误 | YAML 缩进/字段错误 | Actions 页面行号 | 修 YAML |
| checkout 后没有代码 | 忘了 `actions/checkout` | 看 step | 添加 checkout |
| 依赖安装失败 | lockfile 不一致 | 看 npm/pip 日志 | 更新 lockfile |
| 本地过 CI 不过 | runtime 版本不同 | 看 setup-node/setup-python | 固定版本 |
| 测试偶发失败 | 时间、并发、外部服务不稳定 | 看多次 run | 隔离依赖或修测试 |
| build 找不到环境变量 | CI 没配置 env/secrets | 看日志 | 配置变量 |
| artifact 为空 | path 写错 | 下载 artifact 看内容 | 修 path |
| 部署没有权限 | token 权限不足 | 看 403 日志 | 配最小所需权限 |
| staging 成功 prod 失败 | 环境配置不同 | 比较 variables/secrets | 收敛配置 |
| 发布后错误率升高 | 新版本问题 | 对齐 deployment 和 metrics | 回滚或 hotfix |
| 回滚失败 | 旧产物不存在 | 看 registry/artifact | 保留产物 |
| 回滚失败 | 数据库不可逆变更 | 看 migration | 用兼容迁移 |
| 重复发布互相覆盖 | 并发未控制 | 看 run 时间线 | 加 concurrency |
| secret 泄漏风险 | 打印敏感值 | 看日志 | 不 echo secret，使用最小权限 |

## 排障思路

CI/CD 排障分两类：

```text
流水线没把东西交付出去
  -> CI/CD 自身问题

东西交付出去了，但线上坏了
  -> 变更质量或运行时问题
```

第一类看：

- trigger。
- YAML。
- runner。
- 依赖。
- 测试。
- 构建。
- 权限。
- artifact。

第二类看：

- 部署版本。
- 发布时间。
- 发布策略。
- 新旧版本指标差异。
- 日志错误。
- trace 慢点。
- 配置变化。
- 数据库迁移。
- 回滚结果。

## 发布前 checklist

生产发布前建议检查：

- [ ] PR 已 review。
- [ ] CI 全部通过。
- [ ] artifact/image tag 明确。
- [ ] staging 已部署并验证。
- [ ] smoke test 通过。
- [ ] 数据库变更已确认兼容。
- [ ] 配置变更已确认。
- [ ] 回滚版本明确。
- [ ] 回滚命令明确。
- [ ] 当前没有高优先级事故。
- [ ] 监控 dashboard 已打开。
- [ ] 值班同学知道发布窗口。

## 回滚 checklist

回滚时建议记录：

- [ ] 触发回滚的症状是什么。
- [ ] 影响范围是什么。
- [ ] 回滚到哪个版本。
- [ ] 谁批准回滚。
- [ ] 执行了什么命令。
- [ ] rollout 是否完成。
- [ ] 错误率是否下降。
- [ ] 延迟是否恢复。
- [ ] 告警是否恢复。
- [ ] 是否需要后续 hotfix。
- [ ] 是否需要复盘。

## CI/CD 设计原则

1. 小批量变更比大批量变更更容易排查。
2. PR 阶段跑快检查，发布前跑更完整验证。
3. 产物只构建一次，多个环境部署同一个产物。
4. production secrets 只给 production job。
5. 生产部署要有审批、并发控制和回滚方案。
6. 每次 deployment 都要留下可查询记录。
7. 发布后要看业务和技术指标，不只看部署命令成功。
8. 回滚也要自动化和演练。
9. 指标要用来改进系统，不是用来责备人。
10. CI/CD 是 AIOps 的变更感知入口。

## 面试怎么讲

可以这样讲：

CI/CD 是把软件从提交到发布的过程自动化和标准化。CI 关注持续集成，在 PR 或 push 时自动构建、lint、测试，尽早发现集成问题。持续交付在 CI 之后继续打包 artifact、部署到 staging、做验证，让代码始终处于可发布状态，生产发布通常需要人工批准。持续部署则把通过验证的变更自动发布到生产。

在 AIOps 场景里，CI/CD 不只是发布工具，它还是变更事件来源。每次部署的 commit、artifact、环境、审批、开始结束时间、结果和回滚记录，都可以和指标、日志、trace、告警放在同一条时间线上，用来判断故障是否和近期变更相关，并支持 DORA 指标统计，例如部署频率、变更前置时间、变更失败率和失败部署恢复时间。

## 学习检查清单

- [ ] 我能解释 CI、持续交付、持续部署的区别。
- [ ] 我能画出从 commit 到 production 的流水线。
- [ ] 我知道 pipeline、stage、job、step、runner 的关系。
- [ ] 我知道 artifact 是什么，为什么要可追溯。
- [ ] 我能写一个最小 GitHub Actions CI workflow。
- [ ] 我能解释为什么 PR 阶段不应该拿 production secrets。
- [ ] 我能解释 staging、production environment 的作用。
- [ ] 我能说明 approval、concurrency、secrets 为什么重要。
- [ ] 我能区分 rolling、blue/green、canary、feature flag。
- [ ] 我能写发布前 checklist。
- [ ] 我能写回滚 checklist。
- [ ] 我能从 CI/CD 日志定位失败阶段。
- [ ] 我能解释 DORA 指标。
- [ ] 我能把 deployment event 和 Prometheus/日志/告警关联起来。

## 面试题

1. CI、持续交付、持续部署分别是什么？
2. 一条最小 CI pipeline 应该包含哪些阶段？
3. 为什么 CI 里推荐 `npm ci` 而不是随便 `npm install`？
4. artifact 为什么要可追溯、不可随意覆盖？
5. 什么是 build once, deploy the same artifact？
6. staging 和 production 的区别是什么？
7. GitHub environment 可以解决哪些发布风险？
8. approval 适合放在哪些阶段？
9. rolling update、blue/green、canary 有什么区别？
10. feature flag 和 canary 有什么区别？
11. 回滚是不是一定能解决问题？为什么数据库变更麻烦？
12. 发布后错误率升高，你如何判断是否回滚？
13. CI/CD 日志在事故复盘中有什么价值？
14. DORA 的 deployment frequency 怎么算？
15. change lead time 需要哪些数据？
16. change fail rate 为什么不统计普通 CI 失败？
17. Failed deployment recovery time 和 MTTR 有什么关系？
18. AIOps 如何利用 CI/CD 变更记录做根因分析？

## 老师带练：发布系统首先是一台“状态机”

我们以支付服务的一次规则变更贯穿这一节。先不记流水线插件名称，先给每一张凭证编号：源码提交 A、构建运行 B、制品摘要 C、审批记录 D、部署记录 E、验证报告 F。只有它们指向同一批内容，才能回答“批准的、测试的、部署的究竟是不是同一个东西”。缺一个环节，可能出现测试了 A、生产却重新构建出另一个结果的情况。

前面的英文图中 developer 是开发者，staging 是预发环境，production 是生产环境，old/new 是旧版/新版，observe 是观察，serving traffic 是承接流量，change-aware diagnosis 是结合变更上下文的诊断。时间线里的 error_rate、p95 latency、alert fires 分别表示错误率、95 分位延迟和告警触发。把这些词还原成业务行为，才能知道一个阶段该拿什么证据。

### 为什么状态要比绿色按钮更细

“命令已经发送”不等于“服务已应用配置”，“服务开始运行”不等于“用户请求已恢复”。一条可用的部署状态机至少区分 queued（排队）、running（执行）、waiting_approval（待批）、applied（变更已应用）、verifying（验证）、succeeded（验收成功）、failed（已知失败）和 unknown（结果未知）。超时后的 unknown 尤其重要：操作可能已到远端，只是回复没回来。

所以重试不能简单从第一个步骤开始。下载制品失败通常可安全重试；创建发布记录要有幂等键；执行数据库迁移则要查询迁移版本和锁；切流量后中断，应查询实际流量指向再决定继续验证或恢复。状态机需要持久化关键转移，执行器重启后能查回原 execution ID（执行标识），不能靠终端里的一行成功文本猜状态。

### 制品身份、缓存和供应链是三回事

制品摘要（digest，用文件内容计算的指纹）让你发现内容是否变化，签名用于验证来源及签发身份，SBOM（Software Bill of Materials，软件物料清单）说明包含哪些组件。它们彼此补充，摘要相同不自动证明代码安全，签名正确也不自动证明功能没有 bug。制品仓库应禁止覆盖已发布版本，限制删除，并为回滚保留已验证产物。

缓存只是加速。缓存丢失后应能按锁文件重新构建；如果只有缓存里有一个手工安装的包，流水线本身就不可复现。第三方 action、基础镜像、构建脚本和依赖源都属于供应链输入；生产固定经审查的版本或摘要，定期升级后重新验证，而不是永远不升级。前面 workflow 中的版本标签是教学样例，落地前按项目运行时和执行器兼容性核对。

### 本地基础与故障实验：制品通过测试后，被改过还会不会发布

前提：有 Python 3，一个新建空目录 `delivery-classroom`，不需要 Docker、云账号或生产凭据。用编辑器创建 `delivery_lab.py`：

```python
import hashlib
import json
import sys
import tempfile
from pathlib import Path

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def verify(payload):
    if payload.get("threshold") != 5:
        raise ValueError("smoke test failed: threshold must be 5")

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "normal"
    if mode not in {"normal", "tamper", "bad-release"}:
        raise SystemExit("mode: normal | tamper | bad-release")
    with tempfile.TemporaryDirectory(prefix="delivery-classroom-") as folder:
        root = Path(folder)
        artifact = root / "release.json"
        payload = {"version": "v2", "threshold": 9 if mode == "bad-release" else 5}
        artifact.write_text(json.dumps(payload), encoding="utf-8")
        approved_digest = digest(artifact)
        current = {"version": "v1", "threshold": 5}
        previous = dict(current)
        if mode == "tamper":
            artifact.write_text('{"version":"v2","threshold":99}', encoding="utf-8")
        if digest(artifact) != approved_digest:
            print("blocked: artifact changed; current=v1")
            return 2
        current = json.loads(artifact.read_text(encoding="utf-8"))
        try:
            verify(current)
        except ValueError as error:
            current = previous
            verify(current)
            print(f"rolled_back: {error}; current={current['version']}")
            return 3
        print(f"verified: current={current['version']}")
        return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

依次执行 `python delivery_lab.py normal`、`python delivery_lab.py tamper`、`python delivery_lab.py bad-release`，每次执行后立即看 Bash 的 `$?` 或 PowerShell 的 `$LASTEXITCODE`。预期分别是 `verified: current=v2` 且 0、`blocked...current=v1` 且 2、`rolled_back...current=v1` 且 3。第二种在变更前拦截，第三种是合法制品但业务验证失败后恢复旧状态；这两个故障不是同一回事。

这只是本地状态模拟，不是真实服务器部署，也不是数字签名实验。`TemporaryDirectory` 只清理自己新建的临时目录；运行结束没有后台进程。保留源码与三次输出作为证据，要结束学习仅删除自己创建的 `delivery_lab.py` 和空目录即可。若输出不符，先核对 mode 拼写、保存的阈值和是否用了完整文件；若写临时目录失败，检查当前账户临时目录权限，不改系统根目录权限。

### 金丝雀判断：没有流量时，错误率为零也不算通过

给新版本 1% 流量，不代表一定有足够样本。总共只有 20 个请求时没有错误，很难证明新版本可靠。验收规则应同时要求最小请求量、足够观察窗口、错误率与尾延迟不恶化，并按版本、区域和用户群对比。低流量服务可以加入合成测试，但不能把模拟流量等同于所有真实用户行为。

指标缺失应得到“无法判断”，不能自动当成健康。若新版本 exporter（指标导出器）本身崩溃，查询可能没有数据；若代码把标签改名，仪表盘看起来可能归零。发布门禁先检验观测链路，再评价业务。观测数据也有采集与聚合延迟，刚切流立即读取上一分钟指标，可能是在给旧版本发合格证。

设计错误率门禁还要明确分母：失败数/请求数，排除或纳入哪些状态码；相对恶化与绝对上限分开。基线已经很差时“没有进一步恶化”不代表可以继续。AIOps 推荐回滚时应给出证据窗口、样本量、版本对比和影响范围，由确定策略和授权流程决定动作。

### 数据迁移：代码回滚为什么可能更危险

例如 v2 把 `owner` 改成 `owner_id` 并立刻删旧列，回滚 v1 后读不到它需要的字段。正确讨论不是“有没有 helm rollback”，而是新旧二进制、配置、消息和数据库结构在共存期间能否互相理解。扩展阶段先增加兼容结构，迁移阶段带校验和限速，收缩阶段等旧版本与回滚窗口退出后再删除。

迁移还可能有锁表、索引创建、回填流量和复制延迟，需要容量评估与中止条件。恢复数据库备份可能丢弃发布后合法业务写入，不能当成无成本回滚。发布前应明确哪些动作可逆、哪些只能向前修复、谁有批准权、如何保护已经产生的业务数据。

### 并发发布和控制面灾备

同一环境同时跑两条发布，旧任务可能比新任务更晚结束，最后把环境切回旧版。需要环境级互斥或明确代次检查，而不只是限制一个 job 的并行线程。取消工作流只发送取消信号，不保证远端副作用已停止；先确认部署目标的实际状态，再释放锁或启动下一次。

控制面故障时，已经运行的应用通常应继续服务，不能因为 CI 平台断连就停止。灾备至少保存流水线定义、制品、权限恢复流程、配置和发布记录；恢复演练需证明可以找到最后稳定版本并重新验证。执行器采用短生命周期隔离，减少上个 job 遗留的文件、进程和凭据污染。自托管执行器能访问内网，更需要限制谁能让它运行代码。

### DORA 与面试：讲改进，不刷数字

DORA 当前资料列出五项交付表现指标，本文保留历史 Four Keys 链接用于了解演变，统计时要声明所用定义。部署频率与失败率应按同一服务和相同口径分析，不把 CI 重跑或文档修改次数冒充生产价值；恢复时间的起止定义也要写进统计说明。拿指标发现审查等待、测试不稳定和回滚慢，再检验改进效果，不给个人按部署次数排队。[DORA 当前度量说明](https://dora.dev/guides/dora-metrics/)

30 秒：CI 让变更持续集成并验证，持续交付让产物保持可发布，持续部署把合格变更自动送到生产；可靠交付还要有同一制品、权限、发布后验证和回滚。

3 分钟：以 A 到 F 的证据链说明源码、制品和部署关系，展示篡改拦截与业务回滚两个实验，再讲金丝雀样本、数据库兼容和并发状态。追问“CI 全绿为何仍事故”，回答测试覆盖、环境差异、数据规模和运行时依赖；追问“发布命令超时可以重跑吗”，回答先查实际状态与幂等记录；追问“如何设计千万用户平台发布”，应给出分批比例、观测窗口、停止条件、容量余量、权限及恢复路径，而不只是列工具名称。

## 交付答辩：测试通过与可发布之间还缺哪几道证明

老师给你一个很常见的现象：同一提交在自己的电脑成功，在干净执行器失败。先别认为云端太慢。列出构建输入：源码、锁文件、运行时、操作系统、环境变量、构建参数和依赖下载来源。只要其中某项没有声明，构建就可能借用了本机残留状态。可重复构建首先是输入清楚，然后才讨论字节级一致性；有些构建包含时间戳或路径，还需要额外措施才能实现同字节输出。

测试也有不同职责。单元测试验证小范围逻辑，集成测试验证真实组件边界，契约测试验证生产者与消费者约定，端到端测试验证关键用户路径。不是端到端越多就越可靠：它通常更慢、定位更难；也不是只跑单元测试就能覆盖数据库、网络和权限。按风险分配测试，关键发布要求哪几类证据，要在流水线里明确而不是口头约定。

Flaky test（不稳定测试）指相同预期条件下结果不稳定，可能源于时钟、随机性、共享状态、网络依赖和错误等待。自动重跑可以帮助诊断偶发性，却不能让团队忽略失败。记录首次失败率与重跑通过率，隔离不稳定因素并限期修复；如果只统计最后一次绿色结果，指标会掩盖交付系统真实质量。

Secrets（秘密）与配置也应分层。构建公共前端时，注入到浏览器产物的值最终可能被用户读取，因此不能把服务端密钥当作普通构建变量。环境地址可以是配置，生产访问令牌不是前端公开配置。检查制品是否意外包含秘密，应发生在制品离开可信边界之前；凭据轮换则需要平台权限和依赖方协调，不能仅删除 Git 中的一行就认为历史泄漏已消失。

发布平台还应区分“能重跑”和“应该重跑”。构建失败可用相同输入重试，已部分部署的任务必须先检查目标状态。一个安全恢复入口应读取当前版本、期望版本和发布代次，识别操作是否已完成；环境锁与幂等记录一起使用。若锁服务暂时不可用，高风险发布应停止而不是默认放行；已有应用继续提供服务，控制面故障不应自动演变为数据面停机。

最后用一份真实交付记录回答面试：哪个提交、哪些检查、哪份制品、谁批准、何时到达哪个环境、目标返回什么版本、观察了多久、如果失败如何恢复。缺少任何一环都要准确说明边界。比如仅完成构建可以说“已生成并校验制品”，没有运行环境证据就不能说“生产更新成功”。这种表达不是保守措辞，而是交付工程对事实负责的基本能力。

## 发布信任课堂：审批的是哪一份东西

### 审批通过后，分支又移动了怎么办

老师给你一个时间顺序：上午十点测试提交甲，通过审批；十点五分分支新增提交乙；十点十分部署任务重新拉取主分支。即使界面显示审批通过，真正上线的也可能是没被审批的乙。问题不在审批人是否认真，而是审批对象没有固定。一次发布应绑定源码提交、制品摘要、配置版本、目标环境和发布代次。任何影响结果的输入变化，都要重新判断原审批是否仍有效。

分支名是移动指针，不是不可变证据；镜像标签也可能被覆盖。部署阶段先取获批的摘要，再核对下载到的字节，才能把“看过这个变更”和“运行这个产物”接起来。如果审批期间安全团队撤销某个依赖版本，原先通过的测试也不能覆盖新的禁用策略。门禁应有有效期、撤销入口以及暂停发布的明确负责人，不能永久缓存一次绿色结论。

配置与功能开关同样属于发布上下文。同一二进制配上不同超时、流量路由或开关值，可能出现完全不同的行为。回滚记录不能只有应用版本，还要说明哪些配置应一起恢复、哪些开关已经影响业务数据而不能直接反拨。排查“没有发版为什么出问题”，应同时查代码、配置、开关和依赖变更，而不是只看提交列表。

### 摘要、签名和构建证明，各自解决哪一层问题

摘要用于检测字节是否相同，但攻击者若能同时替换文件和摘要，就能制造一对自洽的假证据。签名进一步把声明与某个身份绑定，可是可信身份签过的程序仍可能存在业务错误。构建来源证明描述产物由什么构建过程产生，让接收方按政策验证来源；它不是安全扫描或功能测试的替代品。[GitHub 制品证明概念](https://docs.github.com/en/actions/concepts/security/artifact-attestations)

验证时不能只问“签名有效吗”，还要问签发身份是否获准、源码仓库和工作流是否匹配、提交是否符合发布政策、证明中的主体摘要是否就是眼前产物。SLSA 的来源证明把构建定义、输入、构建平台及本次运行信息组织起来；这些信息是否可信，依赖构建平台本身的隔离和记录能力。这里借用固定版本的模型教学，不宣称覆盖最新规范全部要求。[SLSA 1.1 来源证明模型](https://slsa.dev/spec/v1.1/provenance)

举个反例：证明准确记录了“某个个人分支通过非受控脚本构建”，它可能完全真实，但仍不符合生产政策。另一个反例是校验了证明文件，却没把其主体摘要与实际下载制品比较，最后部署的是另一个文件。诊断这类问题，应把验证输入、可信身份策略和拒绝原因保存为证据，不为赶时间把验证步骤改成永远成功。

### 缓存加速与制品留存不要混为一谈

缓存允许丢失，命中失败应能重新下载或重新计算；制品是后续发布需要引用的交付对象，丢失可能直接阻断恢复。不能把“缓存里还有旧包”当成可靠回滚方案，也不要因为清缓存能解决一次构建问题，就把清理当作每次发布的固定动作。先确认缓存键是否包含锁文件、工具链和平台差异，缓存内容是否来自允许的信任范围。

不受信任的贡献代码可能影响缓存内容或构建步骤。高权限发布不应直接信任低权限任务留下的任意脚本和输出，即使两个任务位于同一个项目。隔离执行器、限制共享目录、重新验证产物和分离凭据，可以减少信任跨越。秘密不该进入可下载的缓存、日志或制品；脱敏后的运行记录也要按其实际信息敏感程度决定保留范围。

### 不接触服务器的审批漂移实验

前置条件是完成前面的本地交付模拟，准备一份独立笔记。本练习只操作合成记录：写下批准对象为提交甲、摘要甲、测试环境；随后把“当前分支”改成乙，保持批准记录不变。第一轮让发布请求引用摘要甲，第二轮引用摘要乙。预期第一轮仅通过对象一致性检查，仍需后续业务验证；第二轮必须因审批对象不同而阻断，不能因分支名称相同放行。

故障注入再把目标从测试改成生产，其他值不变。预期同样阻断，因为目标环境是授权的一部分。验证方式是逐项比较输入，不靠看审批按钮颜色。若三轮都通过，先查规则是否只检查了“存在审批”而没检查审批覆盖的对象。清理删除自己的合成笔记即可，没有令牌、仓库设置或远端资源需要撤销。此实验验证判断逻辑，不证明真实平台已部署相应门禁。

三十秒面试答案：审批必须绑定不可变产物及环境，摘要、身份和来源证明各有职责，任何一环都不能代替运行后的业务验收。三分钟再沿输入固定、构建隔离、证明验证、环境授权、部署状态和恢复证据说明事故如何被拦截。生产设计追问“审批后又来紧急补丁”，应为新对象重新走适用的快速审批路径，而不是借用旧版本批准记录。

## 学习证据

学完这篇，建议留下这些证据：

1. 一个能构建本知识库的 CI workflow。
2. 一个上传 artifact 的 workflow run。
3. 一次故意失败再修复的 CI 记录。
4. 一份发布前 checklist。
5. 一份回滚 checklist。
6. 一份 deployment event JSON 示例。
7. 一篇笔记：CI、持续交付、持续部署的区别。
8. 一篇笔记：DORA 指标如何从 GitHub Actions 和事故记录中计算。
