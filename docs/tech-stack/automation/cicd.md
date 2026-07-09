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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>10:01 合并 PR</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>10:03 CI 通过</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>10:05 构建镜像</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>10:07 部署到 staging</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>10:12 人工批准 production 发布</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>10:15 production 开始滚动更新</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>10:18 错误率上升</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>10:20 告警触发</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 9 行 | <code>10:23 值班同学回滚</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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
CI/CD
  -> Source control
     -> commit
     -> branch
     -> pull request
     -> merge
     -> tag / release
  -> CI: Continuous Integration
     -> trigger
     -> checkout
     -> dependency install
     -> lint / format
     -> unit test
     -> integration test
     -> build
     -> security scan
     -> artifact
     -> status check
  -> CD: Continuous Delivery / Deployment
     -> artifact registry
     -> environment
     -> deployment
     -> approval
     -> secrets
     -> rollout
     -> smoke test
     -> observability verification
     -> rollback
  -> Release strategy
     -> rolling update
     -> blue / green
     -> canary
     -> feature flag
  -> Operational feedback
     -> deployment history
     -> logs
     -> metrics
     -> alerts
     -> incidents
     -> postmortem
  -> Delivery metrics
     -> deployment frequency
     -> change lead time
     -> change fail rate
     -> failed deployment recovery time
     -> deployment rework rate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CI/CD</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Source control</code> | 这一行要理解这些英文词：`Source control` 是source=来源，control=控制。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>     -&gt; commit</code> | 这一行要理解这些英文词：`commit` 是Git 提交，保存一次代码或文档变更快照。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; branch</code> | 这一行要理解这些英文词：`branch` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; pull request</code> | 这一行要理解这些英文词：`pull request` 是拉取请求，用来提交代码变更并触发评审。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; merge</code> | 这一行要理解这些英文词：`merge` 是合并，把一个分支的变更合入另一个分支。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>     -&gt; tag / release</code> | 这一行要理解这些英文词：`tag` 是标签，Git 中常用来标记版本；`release` 是发布版本，把代码或配置交付到可用环境。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; CI: Continuous Integration</code> | 这一行要理解这些英文词：`CI` 是持续集成；`Continuous Integration` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; trigger</code> | 这一行要理解这些英文词：`trigger` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; checkout</code> | 这一行要理解这些英文词：`checkout` 是检出代码或切换到指定版本。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; dependency install</code> | 这一行要理解这些英文词：`dependency install` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>     -&gt; lint / format</code> | 这一行要理解这些英文词：`lint` 是静态检查，用规则提前发现格式、语法或风格问题；`format` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>     -&gt; unit test</code> | 这一行要理解这些英文词：`unit test` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>     -&gt; integration test</code> | 这一行要理解这些英文词：`integration test` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>     -&gt; build</code> | 这一行要理解这些英文词：`build` 是构建，把源码、配置或文档生成可运行或可发布的产物。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>     -&gt; security scan</code> | 这一行要理解这些英文词：`security scan` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>     -&gt; artifact</code> | 这一行要理解这些英文词：`artifact` 是构建产物，例如打包后的文件、镜像或部署包。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>     -&gt; status check</code> | 这一行要理解这些英文词：`status check` 是check=检查。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>  -&gt; CD: Continuous Delivery / Deployment</code> | 这一行要理解这些英文词：`CD` 是持续交付或持续部署；`Continuous Delivery` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Deployment` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>     -&gt; artifact registry</code> | 这一行要理解这些英文词：`artifact registry` 是registry=插件或模块注册中心。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>     -&gt; environment</code> | 这一行要理解这些英文词：`environment` 是环境，例如开发、测试、预发或生产。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>     -&gt; deployment</code> | 这一行要理解这些英文词：`deployment` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>     -&gt; approval</code> | 这一行要理解这些英文词：`approval` 是审批，表示需要人工确认后才能继续执行。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>     -&gt; secrets</code> | 这一行要理解这些英文词：`secrets` 是密钥或敏感配置，例如密码、Token、证书。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>     -&gt; rollout</code> | 这一行要理解这些英文词：`rollout` 是滚动发布，把新版本逐步发布到实例或节点。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>     -&gt; smoke test</code> | 这一行要理解这些英文词：`smoke test` 是冒烟测试，发布后快速验证核心功能是否可用。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>     -&gt; observability verification</code> | 这一行要理解这些英文词：`observability verification` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>     -&gt; rollback</code> | 这一行要理解这些英文词：`rollback` 是回滚。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>  -&gt; Release strategy</code> | 这一行要理解这些英文词：`Release strategy` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>     -&gt; rolling update</code> | 这一行要理解这些英文词：`rolling update` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>     -&gt; blue / green</code> | 这一行要理解这些英文词：`blue` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`green` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>     -&gt; canary</code> | 这一行要理解这些英文词：`canary` 是金丝雀发布，先让少量流量使用新版本以降低风险。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>     -&gt; feature flag</code> | 这一行要理解这些英文词：`feature flag` 是功能开关，用来控制某个功能是否启用。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>  -&gt; Operational feedback</code> | 这一行要理解这些英文词：`Operational feedback` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>     -&gt; deployment history</code> | 这一行要理解这些英文词：`deployment history` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 36 行 | <code>     -&gt; logs</code> | 这一行要理解这些英文词：`logs` 是日志。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 37 行 | <code>     -&gt; metrics</code> | 这一行要理解这些英文词：`metrics` 是指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 38 行 | <code>     -&gt; alerts</code> | 这一行要理解这些英文词：`alerts` 是告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 39 行 | <code>     -&gt; incidents</code> | 这一行要理解这些英文词：`incidents` 是事故，表示已经影响服务或用户的故障事件。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 40 行 | <code>     -&gt; postmortem</code> | 这一行要理解这些英文词：`postmortem` 是事故复盘报告。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 41 行 | <code>  -&gt; Delivery metrics</code> | 这一行要理解这些英文词：`Delivery metrics` 是metrics=指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 42 行 | <code>     -&gt; deployment frequency</code> | 这一行要理解这些英文词：`deployment frequency` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 43 行 | <code>     -&gt; change lead time</code> | 这一行要理解这些英文词：`change lead time` 是change=变更。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 44 行 | <code>     -&gt; change fail rate</code> | 这一行要理解这些英文词：`change fail rate` 是change=变更。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 45 行 | <code>     -&gt; failed deployment recovery time</code> | 这一行要理解这些英文词：`failed deployment recovery time` 是failed=失败。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 46 行 | <code>     -&gt; deployment rework rate</code> | 这一行要理解这些英文词：`deployment rework rate` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


最小主线：

```text
commit
  -> CI checks
  -> artifact
  -> deploy to staging
  -> approval
  -> deploy to production
  -> verify
  -> monitor
  -> rollback or continue
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>commit</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; CI checks</code> | 这一行要理解这些英文词：`CI checks` 是ci=持续集成，checks=检查。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; artifact</code> | 这一行要理解这些英文词：`artifact` 是构建产物，例如打包后的文件、镜像或部署包。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; deploy to staging</code> | 这一行要理解这些英文词：`deploy to staging` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; approval</code> | 这一行要理解这些英文词：`approval` 是审批，表示需要人工确认后才能继续执行。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; deploy to production</code> | 这一行要理解这些英文词：`deploy to production` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; verify</code> | 这一行要理解这些英文词：`verify` 是验证，检查结果是否符合预期。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; monitor</code> | 这一行要理解这些英文词：`monitor` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; rollback or continue</code> | 这一行要理解这些英文词：`rollback or continue` 是rollback=回滚。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


## CI/CD 在 AIOps 链路中的位置

AIOps 需要多类信号：

```text
Metrics: CPU、内存、请求量、错误率、延迟
Logs: 应用日志、访问日志、错误堆栈
Traces: 请求链路、慢调用
Events: 发布、配置变更、扩容、重启、故障
Incidents: 告警、工单、复盘
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Metrics: CPU、内存、请求量、错误率、延迟</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>Logs: 应用日志、访问日志、错误堆栈</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>Traces: 请求链路、慢调用</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>Events: 发布、配置变更、扩容、重启、故障</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>Incidents: 告警、工单、复盘</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>错误率升高前 30 分钟内，production 有没有部署？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>部署版本对应哪些 PR？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>部署后 smoke test 是否通过？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>失败服务的日志是否只出现在新版本 Pod 上？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>回滚后 SLO 是否恢复？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## CI、持续交付、持续部署

三个词很像，但边界不同。

### CI：Continuous Integration

CI 是持续集成。

核心思想：频繁把代码合入共享仓库，并自动构建和测试，尽早发现错误。

```text
developer commit
  -> push / pull request
  -> build
  -> lint
  -> test
  -> report status
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>developer commit</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; push / pull request</code> | 这一行要理解这些英文词：`push` 是推送，把本地提交上传到远程仓库；`pull request` 是拉取请求，用来提交代码变更并触发评审。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; build</code> | 这一行要理解这些英文词：`build` 是构建，把源码、配置或文档生成可运行或可发布的产物。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; lint</code> | 这一行要理解这些英文词：`lint` 是静态检查，用规则提前发现格式、语法或风格问题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; test</code> | 这一行要理解这些英文词：`test` 是测试，用来验证代码、配置或文档是否符合预期。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; report status</code> | 这一行要理解这些英文词：`report status` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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
merge main
  -> build
  -> test
  -> package artifact
  -> deploy staging
  -> smoke test
  -> manual approval
  -> deploy production
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>merge main</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; build</code> | 这一行要理解这些英文词：`build` 是构建，把源码、配置或文档生成可运行或可发布的产物。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; test</code> | 这一行要理解这些英文词：`test` 是测试，用来验证代码、配置或文档是否符合预期。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; package artifact</code> | 这一行要理解这些英文词：`package artifact` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; deploy staging</code> | 这一行要理解这些英文词：`deploy staging` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; smoke test</code> | 这一行要理解这些英文词：`smoke test` 是冒烟测试，发布后快速验证核心功能是否可用。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; manual approval</code> | 这一行要理解这些英文词：`manual approval` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; deploy production</code> | 这一行要理解这些英文词：`deploy production` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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
merge main
  -> build
  -> test
  -> package
  -> deploy production automatically
  -> verify
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>merge main</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; build</code> | 这一行要理解这些英文词：`build` 是构建，把源码、配置或文档生成可运行或可发布的产物。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; test</code> | 这一行要理解这些英文词：`test` 是测试，用来验证代码、配置或文档是否符合预期。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; package</code> | 这一行要理解这些英文词：`package` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; deploy production automatically</code> | 这一行要理解这些英文词：`deploy production automatically` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; verify</code> | 这一行要理解这些英文词：`verify` 是验证，检查结果是否符合预期。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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
Trigger
  -> Checkout
  -> Setup runtime
  -> Install dependencies
  -> Lint
  -> Unit test
  -> Build
  -> Package artifact
  -> Upload artifact
  -> Deploy staging
  -> Smoke test
  -> Approval
  -> Deploy production
  -> Verify
  -> Notify / record deployment
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Trigger</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Checkout</code> | 这一行要理解这些英文词：`Checkout` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; Setup runtime</code> | 这一行要理解这些英文词：`Setup runtime` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; Install dependencies</code> | 这一行要理解这些英文词：`Install dependencies` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; Lint</code> | 这一行要理解这些英文词：`Lint` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; Unit test</code> | 这一行要理解这些英文词：`Unit test` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; Build</code> | 这一行要理解这些英文词：`Build` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Package artifact</code> | 这一行要理解这些英文词：`Package artifact` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; Upload artifact</code> | 这一行要理解这些英文词：`Upload artifact` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; Deploy staging</code> | 这一行要理解这些英文词：`Deploy staging` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; Smoke test</code> | 这一行要理解这些英文词：`Smoke test` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; Approval</code> | 这一行要理解这些英文词：`Approval` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  -&gt; Deploy production</code> | 这一行要理解这些英文词：`Deploy production` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>  -&gt; Verify</code> | 这一行要理解这些英文词：`Verify` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>  -&gt; Notify / record deployment</code> | 这一行要理解这些英文词：`Notify` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`record deployment` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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
pull_request
  -> lint + test + build

push main
  -> build artifact + deploy staging

workflow_dispatch or approval
  -> deploy production

tag v*
  -> publish release artifact
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pull_request</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; lint + test + build</code> | 这一行要理解这些英文词：`lint` 是静态检查，用规则提前发现格式、语法或风格问题；`test` 是测试，用来验证代码、配置或文档是否符合预期；`build` 是构建，把源码、配置或文档生成可运行或可发布的产物。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>push main</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  -&gt; build artifact + deploy staging</code> | 这一行要理解这些英文词：`build artifact` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`deploy staging` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 7 行 | <code>workflow_dispatch or approval</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>  -&gt; deploy production</code> | 这一行要理解这些英文词：`deploy production` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 10 行 | <code>tag v*</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 11 行 | <code>  -&gt; publish release artifact</code> | 这一行要理解这些英文词：`publish release artifact` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


为什么 PR 阶段不直接生产发布？

因为 PR 里的代码还没有被合并，可能来自 fork，权限和可信度都不一样。CI 可以检查它，但不应该让它拿生产 secrets。

## CI 阶段深讲

### checkout

runner 默认不是你的项目目录。需要先拉代码。

```yaml
- uses: actions/checkout@v4
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


如果忘了 checkout，后面的 `npm ci`、`pytest`、`docker build` 通常会找不到文件。

### setup runtime

指定运行时版本。

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>- uses: actions/setup-python@v5</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>  with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    python-version: "3.12"</code> | 设置 `python-version` 字段的值为 `"3.12"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    cache: pip</code> | 设置 `cache` 字段的值为 `pip`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


### install dependencies

Node 项目：

```bash
npm ci
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm ci</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


`npm ci` 的特点：

- 按 `package-lock.json` 精确安装。
- 更适合 CI。
- lockfile 和 `package.json` 不一致时会失败。

Python 项目：

```bash
python -m pip install -r requirements.txt
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m pip install -r requirements.txt</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


如果项目使用 Poetry、uv、pip-tools，要按项目工具写。

### lint / format

lint 检查代码规范和潜在错误。

常见命令：

```bash
npm run lint
python -m ruff check .
python -m black --check .
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm run lint</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |
| 第 2 行 | <code>python -m ruff check .</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 3 行 | <code>python -m black --check .</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm run build</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |
| 第 2 行 | <code>npm run docs:build</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |
| 第 3 行 | <code>python -m build</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 4 行 | <code>go build ./...</code> | 执行 `go` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>docker build -t aiops-api:local .</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>不是所有安全问题都能阻断发布，</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>但严重风险必须进入质量门禁。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Build once, deploy the same artifact.</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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
          path: docs/.vitepress/dist
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Docs CI</code> | 设置 `name` 字段的值为 `Docs CI`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
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
| 第 16 行 | <code>    timeout-minutes: 10</code> | 设置 `timeout-minutes` 字段的值为 `10`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 17 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 18 行 | <code>      - uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 19 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 20 行 | <code>      - uses: actions/setup-node@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 21 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 22 行 | <code>          node-version: 22</code> | 设置 `node-version` 字段的值为 `22`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 23 行 | <code>          cache: npm</code> | 设置 `cache` 字段的值为 `npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 24 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 25 行 | <code>      - run: npm ci</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 26 行 | <code>      - run: npm run docs:build</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 27 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 28 行 | <code>      - uses: actions/upload-artifact@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 29 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 30 行 | <code>          name: docs-dist</code> | 设置 `name` 字段的值为 `docs-dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 31 行 | <code>          path: docs/.vitepress/dist</code> | 设置 `path` 字段的值为 `docs/.vitepress/dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ghcr.io/quweisheng/aiops-api:1.4.2</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>ghcr.io/quweisheng/aiops-api:sha-abc1234</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  name: production</code> | 设置 `name` 字段的值为 `production`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl apply -f k8s/</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 2 行 | <code>kubectl set image deployment/aiops-api aiops-api=ghcr.io/org/aiops-api:sha-abc1234</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |
| 第 3 行 | <code>helm upgrade --install aiops-api ./chart --set image.tag=sha-abc1234</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 4 行 | <code>terraform apply</code> | 执行 Terraform 基础设施命令，用来规划、应用或检查 IaC 变更。 |
| 第 5 行 | <code>az webapp deployment source config-zip</code> | 执行 `az` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>aws deploy create-deployment</code> | 执行 `aws` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -f https://example.com/healthz</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -f https://example.com/readyz</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


更成熟一点：

```bash
curl -fsS https://example.com/api/version
curl -fsS https://example.com/api/metrics
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>curl -fsS https://example.com/api/version</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |
| 第 2 行 | <code>curl -fsS https://example.com/api/metrics</code> | 发起 HTTP 请求，用来验证接口、健康检查、指标端点或 API 返回。 |


smoke test 不等于完整测试。它只回答：

```text
服务是不是起来了？
关键入口是不是能访问？
新版本是不是基本可用？
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>服务是不是起来了？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>关键入口是不是能访问？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>新版本是不是基本可用？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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
          path: docs/.vitepress/dist

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Delivery</code> | 设置 `name` 字段的值为 `Delivery`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 2 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 3 行 | <code>on:</code> | 定义 `on` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 4 行 | <code>  push:</code> | 定义 `push` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>    branches: [main]</code> | 设置 `branches` 字段的值为 `[main]`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>  workflow_dispatch:</code> | 定义 `workflow_dispatch` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 8 行 | <code>permissions:</code> | 定义 `permissions` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>  contents: read</code> | 设置 `contents` 字段的值为 `read`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 11 行 | <code>concurrency:</code> | 定义 `concurrency` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 12 行 | <code>  group: delivery-main</code> | 设置 `group` 字段的值为 `delivery-main`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 13 行 | <code>  cancel-in-progress: false</code> | 设置 `cancel-in-progress` 字段的值为 `false`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 14 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 15 行 | <code>jobs:</code> | 定义 `jobs` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>  build:</code> | 定义 `build` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 17 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 18 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 19 行 | <code>      - uses: actions/checkout@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 21 行 | <code>      - uses: actions/setup-node@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 22 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 23 行 | <code>          node-version: 22</code> | 设置 `node-version` 字段的值为 `22`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 24 行 | <code>          cache: npm</code> | 设置 `cache` 字段的值为 `npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 25 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 26 行 | <code>      - run: npm ci</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 27 行 | <code>      - run: npm run docs:build</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 28 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 29 行 | <code>      - uses: actions/upload-artifact@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 30 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 31 行 | <code>          name: docs-dist</code> | 设置 `name` 字段的值为 `docs-dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 32 行 | <code>          path: docs/.vitepress/dist</code> | 设置 `path` 字段的值为 `docs/.vitepress/dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 33 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 34 行 | <code>  deploy-staging:</code> | 定义 `deploy-staging` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 35 行 | <code>    needs: build</code> | 设置 `needs` 字段的值为 `build`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 36 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 37 行 | <code>    environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 38 行 | <code>      name: staging</code> | 设置 `name` 字段的值为 `staging`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 39 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 40 行 | <code>      - uses: actions/download-artifact@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 41 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 42 行 | <code>          name: docs-dist</code> | 设置 `name` 字段的值为 `docs-dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 43 行 | <code>          path: dist</code> | 设置 `path` 字段的值为 `dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 44 行 | <code>      - run: echo "deploy dist to staging"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 45 行 | <code>      - run: echo "smoke test staging"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 46 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 47 行 | <code>  deploy-production:</code> | 定义 `deploy-production` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 48 行 | <code>    needs: deploy-staging</code> | 设置 `needs` 字段的值为 `deploy-staging`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 49 行 | <code>    runs-on: ubuntu-latest</code> | 设置 `runs-on` 字段的值为 `ubuntu-latest`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 50 行 | <code>    environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 51 行 | <code>      name: production</code> | 设置 `name` 字段的值为 `production`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 52 行 | <code>    steps:</code> | 定义 `steps` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 53 行 | <code>      - uses: actions/download-artifact@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 54 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 55 行 | <code>          name: docs-dist</code> | 设置 `name` 字段的值为 `docs-dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 56 行 | <code>          path: dist</code> | 设置 `path` 字段的值为 `dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 57 行 | <code>      - run: echo "deploy dist to production"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 58 行 | <code>      - run: echo "verify production"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


为什么这是持续交付？

- 构建和 staging 自动。
- production 通过 environment 可以配置人工审批。
- 发布使用 build 产出的同一个 artifact。

如果 production 不需要审批，通过验证后自动发布，就更接近持续部署。

## 发布策略

### Rolling update

滚动更新是一批一批替换旧实例。

```text
old old old old
  -> new old old old
  -> new new old old
  -> new new new old
  -> new new new new
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>old old old old</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; new old old old</code> | 这一行要理解这些英文词：`new old old old` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; new new old old</code> | 这一行要理解这些英文词：`new new old old` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; new new new old</code> | 这一行要理解这些英文词：`new new new old` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; new new new new</code> | 这一行要理解这些英文词：`new new new new` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>blue: old version, serving traffic</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>green: new version, no traffic</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>validate green</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>switch traffic to green</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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
1% users -> new version
observe
10% users -> new version
observe
50% users -> new version
observe
100% users -> new version
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>1% users -&gt; new version</code> | 这一行要理解这些英文词：`users` 是用户账号；`new version` 是新版本，表示刚发布或准备发布的代码、镜像或配置。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 2 行 | <code>observe</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>10% users -&gt; new version</code> | 这一行要理解这些英文词：`users` 是用户账号；`new version` 是新版本，表示刚发布或准备发布的代码、镜像或配置。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>observe</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>50% users -&gt; new version</code> | 这一行要理解这些英文词：`users` 是用户账号；`new version` 是新版本，表示刚发布或准备发布的代码、镜像或配置。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>observe</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>100% users -&gt; new version</code> | 这一行要理解这些英文词：`users` 是用户账号；`new version` 是新版本，表示刚发布或准备发布的代码、镜像或配置。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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
deploy code with feature off
  -> enable for internal users
  -> enable for 5%
  -> enable for 50%
  -> enable for 100%
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>deploy code with feature off</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; enable for internal users</code> | 这一行要理解这些英文词：`enable for internal users` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; enable for 5%</code> | 这一行要理解这些英文词：`enable for` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; enable for 50%</code> | 这一行要理解这些英文词：`enable for` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; enable for 100%</code> | 这一行要理解这些英文词：`enable for` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl rollout status deployment/aiops-api -n prod</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


查看历史：

```bash
kubectl rollout history deployment/aiops-api -n prod
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl rollout history deployment/aiops-api -n prod</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


回滚：

```bash
kubectl rollout undo deployment/aiops-api -n prod
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl rollout undo deployment/aiops-api -n prod</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


回滚到指定 revision：

```bash
kubectl rollout undo deployment/aiops-api -n prod --to-revision=3
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl rollout undo deployment/aiops-api -n prod --to-revision=3</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### Helm 回滚

查看历史：

```bash
helm history aiops-api -n prod
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm history aiops-api -n prod</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


回滚：

```bash
helm rollback aiops-api 3 -n prod
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm rollback aiops-api 3 -n prod</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


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
expand
  -> 先添加新字段，旧字段保留
migrate
  -> 双写或后台迁移数据
contract
  -> 确认旧版本不再使用后再删除旧字段
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>expand</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 先添加新字段，旧字段保留</code> | 这一行表示上一级主题下的子项“先添加新字段，旧字段保留”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 3 行 | <code>migrate</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  -&gt; 双写或后台迁移数据</code> | 这一行表示上一级主题下的子项“双写或后台迁移数据”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 5 行 | <code>contract</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  -&gt; 确认旧版本不再使用后再删除旧字段</code> | 这一行表示上一级主题下的子项“确认旧版本不再使用后再删除旧字段”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "service": "aiops-api",</code> | 设置 `service` 字段，值是 `"aiops-api"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "environment": "production",</code> | 设置 `environment` 字段，值是 `"production"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>  "version": "1.4.2",</code> | 设置 `version` 字段，值是 `"1.4.2"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>  "commit_sha": "abc1234",</code> | 设置 `commit_sha` 字段，值是 `"abc1234"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  "deployment_id": "deploy-20260702-101500",</code> | 设置 `deployment_id` 字段，值是 `"deploy-20260702-101500"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 7 行 | <code>  "started_at": "2026-07-02T10:15:00Z",</code> | 设置 `started_at` 字段，值是 `"2026-07-02T10:15:00Z"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>  "finished_at": "2026-07-02T10:18:00Z",</code> | 设置 `finished_at` 字段，值是 `"2026-07-02T10:18:00Z"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>  "status": "success",</code> | 设置 `status` 字段，值是 `"success"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 10 行 | <code>  "actor": "github-actions",</code> | 设置 `actor` 字段，值是 `"github-actions"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 11 行 | <code>  "strategy": "rolling"</code> | 设置 `strategy` 字段，值是 `"rolling"`；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 12 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |


这样 AIOps 可以做：

```text
deployment event
  + Prometheus metrics
  + Loki logs
  + OpenTelemetry traces
  + Alertmanager alerts
  -> change-aware diagnosis
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>deployment event</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  + Prometheus metrics</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  + Loki logs</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  + OpenTelemetry traces</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  + Alertmanager alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  -&gt; change-aware diagnosis</code> | 这一行要理解这些英文词：`change-aware diagnosis` 是change=变更。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


例子：

```text
10:15 deploy aiops-api 1.4.2
10:17 error_rate starts rising
10:18 p95 latency starts rising
10:20 alert fires

推断方向：
  new deployment is a likely contributor
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>10:15 deploy aiops-api 1.4.2</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>10:17 error_rate starts rising</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>10:18 p95 latency starts rising</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>10:20 alert fires</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 6 行 | <code>推断方向：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>  new deployment is a likely contributor</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>successful production deployments / time window</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


例如：

```text
本周 production 成功部署 20 次
deployment frequency = 20/week
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>本周 production 成功部署 20 次</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>deployment frequency = 20/week</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>failed deployments / total production deployments</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


关键是团队要定义什么叫 failed deployment：

- 触发生产事故。
- 需要回滚。
- 需要紧急 hotfix。
- 导致 SLO 明显违约。

普通 CI 失败不算 change fail rate，因为它没有进入生产。

### Failed deployment recovery time

看失败部署从发现到恢复用了多久。

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>git rev-parse HEAD</code> | 执行 Git 版本控制命令，用来查看状态、提交、推送或排查仓库问题。 |


作用：获取当前 commit SHA。

用途：

- 给 artifact 打版本。
- 写入 deployment event。
- 关联日志和发布。

### npm ci

```bash
npm ci
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm ci</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


作用：按 lockfile 安装依赖。

适合 CI，因为它追求可重复安装。

### npm run docs:build

```bash
npm run docs:build
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>npm run docs:build</code> | 执行 Node.js 项目脚本或依赖命令，常用于安装依赖、测试和构建文档站。 |


作用：构建 VitePress 文档站。

在这个知识库里，它就是最重要的 CI 检查之一。

### pytest

```bash
python -m pytest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m pytest</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


作用：运行 Python 测试。

常见参数：

```bash
python -m pytest -q
python -m pytest tests/test_alerts.py
python -m pytest --maxfail=1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m pytest -q</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>python -m pytest tests/test_alerts.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 3 行 | <code>python -m pytest --maxfail=1</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


### docker build

```bash
docker build -t aiops-api:sha-abc1234 .
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker build -t aiops-api:sha-abc1234 .</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |


作用：构建镜像。

关键点：

- tag 不要只用 `latest`。
- tag 最好包含版本号或 commit SHA。

### docker push

```bash
docker push ghcr.io/quweisheng/aiops-api:sha-abc1234
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker push ghcr.io/quweisheng/aiops-api:sha-abc1234</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |


作用：把镜像推到 registry。

### kubectl rollout status

```bash
kubectl rollout status deployment/aiops-api -n prod
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl rollout status deployment/aiops-api -n prod</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


作用：等待 Kubernetes Deployment 发布完成。

### kubectl rollout undo

```bash
kubectl rollout undo deployment/aiops-api -n prod
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kubectl rollout undo deployment/aiops-api -n prod</code> | 执行 Kubernetes 命令，用来查看集群资源、部署服务或排查 Pod 问题。 |


作用：回滚 Kubernetes Deployment。

### helm upgrade --install

```bash
helm upgrade --install aiops-api ./chart -n prod --set image.tag=sha-abc1234
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm upgrade --install aiops-api ./chart -n prod --set image.tag=sha-abc1234</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


作用：安装或升级 Helm release。

### helm rollback

```bash
helm rollback aiops-api 3 -n prod
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>helm rollback aiops-api 3 -n prod</code> | 执行 Helm 命令，用来安装、升级或回滚 Kubernetes 应用包。 |


作用：回滚 Helm release 到指定 revision。

### gh run list

```bash
gh run list --workflow "Docs CI" --limit 10
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run list --workflow "Docs CI" --limit 10</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


作用：查看最近的 CI/CD runs。

### gh run view --log

```bash
gh run view <run-id> --log
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run view &lt;run-id&gt; --log</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


作用：查看 workflow 运行日志。

### gh run rerun

```bash
gh run rerun <run-id>
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>gh run rerun &lt;run-id&gt;</code> | 执行 `gh` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：重新运行一次失败或需要重试的 workflow。

## 入门实验 1：给知识库建立 CI

目标：每次 PR 或 push 都自动构建文档。

文件：

```text
.github/workflows/docs-ci.yml
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>.github/workflows/docs-ci.yml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>name: Docs CI</code> | 设置 `name` 字段的值为 `Docs CI`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
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
| 第 18 行 | <code>      - uses: actions/setup-node@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 19 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 20 行 | <code>          node-version: 22</code> | 设置 `node-version` 字段的值为 `22`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 21 行 | <code>          cache: npm</code> | 设置 `cache` 字段的值为 `npm`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 22 行 | <code>      - run: npm ci</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 23 行 | <code>      - run: npm run docs:build</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


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
          path: docs/.vitepress/dist
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>      - uses: actions/upload-artifact@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>          name: docs-dist</code> | 设置 `name` 字段的值为 `docs-dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>          path: docs/.vitepress/dist</code> | 设置 `path` 字段的值为 `docs/.vitepress/dist`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mkdir -p reports</code> | 创建目录，用来准备实验项目结构。 |
| 第 2 行 | <code>cat &gt; reports/deployment.json &lt;&lt;'JSON'</code> | 打印文件内容，用来检查配置或日志片段。 |
| 第 3 行 | <code>{</code> | 执行 `{` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  "service": "zero-to-aiops-docs",</code> | 执行 `"service":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>  "environment": "staging",</code> | 执行 `"environment":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>  "version": "sha-demo",</code> | 执行 `"version":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>  "status": "success"</code> | 执行 `"status":` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 8 行 | <code>}</code> | 执行 `}` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 9 行 | <code>JSON</code> | 执行 `json` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>      - name: Write deployment event</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 2 行 | <code>        run: &#124;</code> | 设置 `run` 字段的值为 `|`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 3 行 | <code>          mkdir -p reports</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 4 行 | <code>          cat &gt; reports/deployment.json &lt;&lt;'JSON'</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 5 行 | <code>          {</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 6 行 | <code>            "service": "zero-to-aiops-docs",</code> | 设置 `service` 字段的值为 `"zero-to-aiops-docs",`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>            "environment": "staging",</code> | 设置 `environment` 字段的值为 `"staging",`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>            "version": "sha-demo",</code> | 设置 `version` 字段的值为 `"sha-demo",`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>            "status": "success"</code> | 设置 `status` 字段的值为 `"success"`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>          }</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 11 行 | <code>          JSON</code> | 配置续行，通常和上一行的缩进层级一起决定它属于哪个配置对象。 |
| 第 12 行 | <em>空行</em> | 空行，用来分隔不同配置段，方便阅读。 |
| 第 13 行 | <code>      - uses: actions/upload-artifact@v4</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 14 行 | <code>        with:</code> | 定义 `with` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 15 行 | <code>          name: deployment-event</code> | 设置 `name` 字段的值为 `deployment-event`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 16 行 | <code>          path: reports/deployment.json</code> | 设置 `path` 字段的值为 `reports/deployment.json`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |


学习点：

- deployment event 是 AIOps 里的重要上下文。
- 后续可以把它写到日志系统、数据库或事件平台。

## 入门实验 4：故意制造失败

做一次受控失败：

1. 在 Markdown 中写一个错误代码块。
2. push。
3. 观察 CI 失败。
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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>失败时间：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>失败 workflow：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>失败 job：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>失败 step：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>错误日志：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>根因：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>修复：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <code>如何避免：</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>流水线没把东西交付出去</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; CI/CD 自身问题</code> | 这一行要理解这些英文词：`CI` 是持续集成；`CD` 是持续交付或持续部署。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 4 行 | <code>东西交付出去了，但线上坏了</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  -&gt; 变更质量或运行时问题</code> | 这一行表示上一级主题下的子项“变更质量或运行时问题”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |


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
