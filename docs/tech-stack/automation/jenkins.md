# Jenkins 技术栈深讲

> 学习目标：从零理解 Jenkins Controller、Agent、Queue、Executor、Pipeline、Plugin、Credentials 与 `JENKINS_HOME` 的关系，能启动固定版本的学习环境、运行并验证一条 Pipeline、完成一次队列故障注入，并能设计生产容量、安全、备份恢复、升级回滚、可观测性与 AIOps 变更闭环。

## 版本边界

Jenkins 同时维护两条发布线：

| 发布线 | 截至 2026-07-30 的版本 | 节奏与选择 |
|---|---|---|
| LTS（Long-Term Support，长期支持） | `2.568.1`，发布于 2026-07-08 | 大约每 12 周选择一个新基线，每 4 周发布一次稳定补丁；生产通常优先评估 |
| Weekly | `2.575` | 更快获得功能和修复，也要承担更频繁的兼容验证 |

当前 LTS 与 Weekly 的 Jenkins 系统进程支持 Java 21 或 Java 25。这里的“系统进程”包括 Controller、Agent、CLI 和其他 Jenkins 组件，不等于你的项目必须用 Java 21 编译。业务构建可以在 Agent 中使用自己的 JDK、Node.js、Go、Python 或容器工具链。

本文学习环境固定使用官方镜像：

```text
jenkins/jenkins:2.568.1-jdk21
```

完整版本比 `lts-jdk21`、`latest` 这类移动标签更容易复现；滚动标签只适合明确接受持续跟随更新的环境。生产还应记录镜像 Digest、插件清单和基础镜像，因为同一个 Jenkins 核心版本并不能单独描述整个运行环境。这里使用 Jenkins 项目维护的 `jenkins/jenkins`，不使用已经废弃的旧 `jenkins` 镜像；官方 Controller 镜像也不内置 Docker CLI，把 Docker Socket 交给流水线会扩大宿主机控制权限。

## 官方资料

- [Jenkins 文档首页](https://www.jenkins.io/doc/)
- [下载页与当前 LTS / Weekly](https://www.jenkins.io/download/)
- [LTS Changelog](https://www.jenkins.io/changelog-stable/)
- [LTS Upgrade Guide](https://www.jenkins.io/doc/upgrade-guide/)
- [Java 支持策略](https://www.jenkins.io/doc/book/platform-information/support-policy-java/)
- [硬件建议](https://www.jenkins.io/doc/book/scaling/hardware-recommendations/)
- [官方 Docker 安装](https://www.jenkins.io/doc/book/installing/docker/)
- [Pipeline 文档](https://www.jenkins.io/doc/book/pipeline/)
- [Pipeline 语法](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Pipeline 最佳实践](https://www.jenkins.io/doc/book/pipeline/pipeline-best-practices/)
- [Pipeline 扩展与持久性](https://www.jenkins.io/doc/book/pipeline/scaling-pipeline/)
- [使用 Jenkins Agents](https://www.jenkins.io/doc/book/using/using-agents/)
- [管理 Nodes](https://www.jenkins.io/doc/book/managing/nodes/)
- [Controller 隔离](https://www.jenkins.io/doc/book/security/controller-isolation/)
- [Credentials 安全](https://www.jenkins.io/doc/book/security/credentials/)
- [管理 Plugins](https://www.jenkins.io/doc/book/managing/plugins/)
- [Configuration as Code](https://www.jenkins.io/doc/book/managing/casc/)
- [备份与恢复](https://www.jenkins.io/doc/book/system-administration/backing-up/)
- [监控 Jenkins](https://www.jenkins.io/doc/book/system-administration/monitoring/)
- [Remote Access API](https://www.jenkins.io/doc/book/using/remote-access-api/)
- [Jenkins 安全公告](https://www.jenkins.io/security/advisories/)
- [Kubernetes Plugin](https://plugins.jenkins.io/kubernetes/)
- [Prometheus Metrics Plugin](https://plugins.jenkins.io/prometheus/)

说明：本文基于 Jenkins 官方文档、官方插件页和官方镜像重新组织，不复制官方全文。核心、插件、Java、Agent 和安全要求会变化，生产升级前必须重新核对目标 LTS 的 Changelog、Upgrade Guide、插件依赖与安全公告。

## 官方知识地图

Jenkins 官方资料可以拆成六块：

```text
交付模型
  -> Job / Build / Pipeline / Jenkinsfile
  -> Declarative / Scripted / Multibranch / Shared Library

调度与执行
  -> Controller / Queue / Node / Agent / Executor / Label
  -> Remoting / SSH / Inbound / WebSocket / Cloud Agent

状态
  -> JENKINS_HOME / Job Config / Build Record / Pipeline State
  -> Plugin / Credentials / Fingerprint / Artifact

平台治理
  -> Folder / RBAC / Credentials / Plugin / JCasC
  -> Backup / Restore / Upgrade / Security Advisory

扩展与容量
  -> Static Agent / Kubernetes Dynamic Agent
  -> Queue / Executor / Controller CPU / Heap / Disk I/O

可观测与自动化
  -> Console / Controller Log / Agent Log / Remote API
  -> Metrics / Alerts / Change Correlation / Runbook
```

本文学习顺序：

1. 先分清 Controller、Agent、Executor、Queue 和 Pipeline。
2. 再走一遍从代码提交到构建结果的完整路径。
3. 再理解 `JENKINS_HOME`、Pipeline 持久状态与插件状态。
4. 然后启动固定 LTS，跑通第一条 Pipeline。
5. 再制造 label 不匹配，让任务真实进入阻塞队列。
6. 最后进入容量、安全、动态 Agent、备份、升级、事故题和系统设计。

## 场景开场

周一早上，开发团队连续提交了几十个合并请求。Jenkins 首页能打开，但所有任务都显示“排队中”：

- 有人说 Controller 挂了。
- 有人说再加两个 Executor 就行。
- 有人准备重启 Jenkins。
- 还有人发现一个 Agent 在线，却没有任何任务被分配过去。

这时真正要回答的不是“Jenkins 页面能不能打开”，而是：

```text
任务是否成功创建
  -> 为什么进入 Queue
  -> 是否存在匹配 Label 的 Agent
  -> Agent 是否在线且有空闲 Executor
  -> 是否被并发、锁、审批或资源规则阻塞
  -> 拿到 Executor 后执行到哪个 Step
```

不理解这条链路，重启可能只会清掉现场，让同一批任务重新排队。

## 一句话人话版

Jenkins 是一个可扩展的自动化调度平台：Controller 保存任务和调度状态，Agent 提供隔离的执行环境，Jenkinsfile 把构建、测试、门禁和部署步骤变成可评审的代码。

## 小白可能会问

- Controller、Node、Agent、Executor 到底谁包含谁？
- Jenkinsfile 是普通 Groovy 脚本吗？
- 页面能打开，为什么任务仍然一个都不执行？
- 为什么官方建议 Controller 的 Executor 设为 0？
- 插件越多是不是功能越完整？
- 删除 Workspace 会不会把 Job 配置也删掉？
- Jenkins 放进 Kubernetes 就自动高可用了吗？
- Credentials 已加密，为什么恶意流水线仍可能偷走它？

## 为什么要学

Jenkins 仍承载大量企业的构建、测试、代码扫描、制品发布、数据库变更和生产部署。平台运维、DevOps、SRE 与 AIOps 岗位不只要求“会点 Build Now”，还要能处理：

- 构建排队与 Agent 容量。
- Pipeline 失败、恢复和重跑。
- Plugin 依赖与安全升级。
- 凭据泄露与权限越界。
- Controller 状态、备份和灾难恢复。
- 动态 Agent、工具链和供应链安全。
- 发布记录与线上告警的关联。

在 AIOps 链路中，Jenkins 位于“变更执行与证据生产”这一段：

```text
Commit / Merge Request
  -> Jenkins Build
  -> Test / Scan / Artifact
  -> Deploy / Approval / Rollback
  -> Metrics / Logs / Alerts
  -> Change Correlation / RCA / Runbook
```

## Jenkins 是什么

Jenkins 是开源自动化服务器。它的核心很小，大量能力来自 Plugin（插件）：

- Git、GitHub、GitLab 等 SCM 集成。
- Pipeline、Multibranch 与 Shared Library。
- Credentials、LDAP、OIDC、权限策略。
- Docker、Kubernetes 和云 Agent。
- JUnit、SonarQube、Nexus、Harbor 与通知。
- Prometheus、审计和配置即代码。

你可以把 Jenkins 理解成“可编程的调度控制面”，而不是一台万能构建机。Controller 的价值是管理状态、安排工作和收集结果；真正耗 CPU、内存、磁盘、Docker 或编译器资源的步骤应运行在 Agent。

## 它解决什么问题

### 把人工命令变成一致流程

同一份 Jenkinsfile 可以让每次提交都经历相同测试、扫描和构建步骤，减少“我电脑上可以”的差异。

### 把执行环境与控制面分开

不同 Agent 可以提供 Linux、Windows、ARM、GPU、签名机或隔离网络，Controller 不必安装所有工具链。

### 保存交付证据

Jenkins 把 Build Number、Commit、日志、测试报告、制品指纹和部署结果关联起来，支持审计和故障回溯。

### 连接存量系统

企业中可能同时存在 SVN、Git、物理 Agent、Windows 构建、传统中间件和新 Kubernetes 集群。Jenkins 的插件生态适合连接这些异构环境。

### 把发布风险放进门禁

Pipeline 可以加入测试、SonarQube、镜像扫描、人工审批、变更窗口和回滚验证，但“写了一个 Stage”并不自动等于门禁可靠，仍要设计失败策略和权限边界。

## 核心术语

| 术语 | 人话解释 | 关键边界 |
|---|---|---|
| Controller | Jenkins 控制进程，保存状态并调度任务 | 不应运行普通不可信构建 |
| Node | Jenkins 认识的一台执行节点定义 | Built-in Node 是 Controller 自己 |
| Agent | 在 Node 上与 Controller 通信、接受任务的进程 | Agent 失陷不能获得 Controller 文件权限 |
| Executor | Agent 上的一个并发执行槽位 | 数量不等于机器真实容量 |
| Queue | 已创建但还没拿到执行资源的任务队列 | `why` 字段比 Queue 长度更重要 |
| Job / Item | 被配置的一项工作 | Folder、Pipeline、Multibranch 都属于 Item 体系 |
| Build / Run | Job 的一次执行记录 | 需要关联 Commit、参数、制品和结果 |
| Pipeline | 可恢复、可编排的交付流程 | 控制逻辑主要运行在 Controller |
| Jenkinsfile | 存在 SCM 中的 Pipeline 定义 | 应经过代码评审 |
| Workspace | Agent 上本次或多次构建使用的工作目录 | 可清理、可漂移，不是最终状态仓库 |
| Artifact | 构建输出 | 正式发布包应进入外部制品仓库 |
| Plugin | 扩展 Jenkins 的模块 | 运行在 Controller 内，扩大故障和安全面 |
| `JENKINS_HOME` | Controller 的主要持久状态目录 | 不是普通缓存目录 |

## 内部数据路径

### 一次提交如何变成一次 Build

```text
Git Push / Webhook / Poll / Timer / API / Manual
  -> Jenkins Item 接收触发
  -> 创建 Queue Item
  -> Queue 计算约束与 Cause
  -> Label / Node / Executor / Lock / Concurrency 匹配
  -> 分配 Executor
  -> 准备 Workspace
  -> 执行 Pipeline Step
  -> 回传 Console / Test / Result
  -> 保存 Build Record
  -> 归档 Artifact / 推送外部制品库
  -> Webhook / API / Notification 返回状态
```

页面显示 Build Number，说明任务记录已经创建；不代表 Agent 已开始执行。任务可能长时间停留在 Queue，原因包括：

- 没有匹配 Label 的 Node。
- Node 离线或临时离线。
- Executor 全忙。
- 被 `disableConcurrentBuilds`、Throttle 或 Lock 限制。
- Controller 进入 Quiet Down。
- Kubernetes Pod 尚未调度或镜像拉取。
- 上游、审批或外部资源还没释放。

### Pipeline 控制逻辑在哪里运行

Jenkins Pipeline 的 Groovy 代码会经过 CPS（Continuation-Passing Style，续延传递风格）转换。你可以把它理解成：Jenkins 把流程拆成可暂停、可保存、可恢复的步骤，而不是让一段普通 Groovy 从头跑到尾。

```text
Jenkinsfile
  -> Controller 解析与 CPS 调度
  -> node / agent 申请 Executor
  -> sh / bat / powershell 在 Agent 执行
  -> Step 结果回到 Controller
  -> Pipeline 状态写入 JENKINS_HOME
```

因此：

- `sh`、`bat`、编译和测试应在 Agent。
- Groovy 循环、JSON 大对象和复杂排序可能消耗 Controller CPU/Heap。
- 把大文件读进 Pipeline 变量，会增加序列化和持久化压力。
- `@NonCPS` 可执行普通 Groovy 逻辑，但不能在其中随意调用 Pipeline Step。

### Pipeline 为什么能在重启后继续

Pipeline 会把执行状态持久化到 Build 目录。官方提供三类 durability（持久性）取舍：

| 模式 | 特点 | 适合 |
|---|---|---|
| `MAX_SURVIVABILITY` | 写盘最频繁、恢复能力最高、I/O 成本最大 | 生产部署、关键变更与审计流程 |
| `SURVIVABLE_NONATOMIC` | 仍频繁保存，但减少原子写开销 | 希望保留较强恢复能力的普通流程 |
| `PERFORMANCE_OPTIMIZED` | 减少写盘，提高性能；脏关机可能丢失运行态 | 可安全重跑的构建测试 |

这个设置只改变 Pipeline 运行态的性能与恢复取舍，不会让 Controller 本身自动高可用。强制杀进程、宿主机崩溃、OOM Kill 和存储中断属于脏关闭，风险高于正常 `SIGTERM` 或安全重启。

## 核心知识树

### Controller

- **是什么**：保存 Jenkins 配置、Job、Build 和 Pipeline 状态的控制进程。
- **为什么需要**：统一接收触发、鉴权、调度、记录结果和提供 UI/API。
- **怎么工作**：加载 Jenkins Core 与 Plugin，维护 Queue，把任务分配给 Agent。
- **怎么看或怎么用**：Manage Jenkins、System Information、System Log、Thread Dump 和 Controller 日志。
- **坏了怎么查**：先区分进程、HTTP、Heap/GC、磁盘、插件加载、`JENKINS_HOME` 与外部身份源。

生产通常把 Built-in Node 的 Executor 设置为 `0`。这样可以避免不可信构建读取 Controller 文件、抢占 Heap/CPU，或访问 `JENKINS_HOME` 中的敏感状态。

### Node、Agent 与 Executor

- **是什么**：Node 是执行节点配置；Agent 是实际连接进程；Executor 是并发槽位。
- **为什么需要**：隔离不同工具链、信任域和资源类型。
- **怎么工作**：Agent 通过 SSH、Inbound TCP 或 WebSocket 建立 Remoting 通道，Controller 按 Label 与空闲 Executor 分配任务。
- **怎么看或怎么用**：Manage Jenkins > Nodes、Agent Log、Node Monitor、Label 和 Queue Cause。
- **坏了怎么查**：检查 Java 版本、网络、证书、时间、磁盘、临时目录、Remoting、启动命令和权限。

一个 16 核 Agent 配 16 个 Executor 不一定合理。若每个 Maven Build 需要 4 核和 6 GB 内存，这台机器可能只能稳定运行 3–4 个 Build。

Remoting 不只是“Agent 心跳”，还承载 Controller 与 Agent 之间的远程调用、数据流和类加载。Agent 上运行的是可能不可信的构建代码，不能把 Agent 当成与 Controller 同一信任级别；Agent → Controller Access Control 应保持启用。

### Queue

- **是什么**：等待 Jenkins 分配执行资源的任务集合。
- **为什么需要**：构建到达速率经常高于瞬时执行能力，且任务有不同约束。
- **怎么工作**：Queue 维护等待项，结合 Label、在线状态、Executor、并发规则和插件约束调度。
- **怎么看或怎么用**：首页 Queue、`/queue/api/json`、Build 的排队原因和 Queue Wait 指标。
- **坏了怎么查**：不要先重启；先保存 `why`、`inQueueSince`、Label、Agent 状态、Executor 和最近配置变化。

Queue 内部状态比“队列长度”更有诊断价值：

| 状态 | 人话解释 | 常见证据 |
|---|---|---|
| Waiting | 仍在 Quiet Period 等待，尚未进入可调度阶段 | 提交后短暂延迟、预计进入队列时间 |
| Blocked | 被上游、并发限制、Lock 或其他条件阻塞 | `why` 指向锁、并发或上游条件 |
| Buildable | 条件已满足，但还没有合适 Executor | 无匹配 Label、节点离线或容量不足 |
| Pending | 已分配 Executor，正在交接但尚未真正开始 | Agent 连接、Workspace 或启动步骤仍在准备 |

同样是“没开始”，四种状态的修复完全不同。AIOps 告警应优先观察最老 Queue Age、各状态数量和 `why` 分类，而不只看总长度。

### Declarative 与 Scripted Pipeline

- **是什么**：Declarative 提供更受约束的 `pipeline {}` 结构；Scripted 使用 `node {}` 与更自由的 Groovy。
- **为什么需要**：简单流程需要可读规范，复杂逻辑需要一定编程能力。
- **怎么工作**：二者最终都由 Pipeline 插件和 CPS 引擎执行。
- **怎么看或怎么用**：Pipeline Syntax、Snippet Generator、Replay、Console 和 Stage 视图。
- **坏了怎么查**：先查语法和首个失败 Step，再查 Agent 工具链、环境变量、凭据和外部依赖。

团队默认优先 Declarative。复杂逻辑放进经过测试和评审的 Shared Library，不把 Jenkinsfile 写成几百行 Groovy 应用。

### Multibranch Pipeline

- **是什么**：根据 SCM 分支和 Pull Request 自动发现 Jenkinsfile 并创建分支 Job。
- **为什么需要**：避免每个分支手工建 Job。
- **怎么工作**：Branch Indexing 扫描仓库，SCM Source Plugin 识别分支/PR，按策略创建或删除 Item。
- **怎么看或怎么用**：Scan Repository Log、分支列表、Webhook 和 Orphaned Item Strategy。
- **坏了怎么查**：检查 Webhook、SCM Token、API Rate Limit、Jenkinsfile 路径、可信分支策略和索引日志。

来自 Fork 的 Pull Request 可能修改 Jenkinsfile。不能让不可信代码自动拿到生产 Credentials 或运行在签名 Agent。

### Shared Library

- **是什么**：在多个 Pipeline 间共享受控的 Groovy 步骤和规范。
- **为什么需要**：统一构建、扫描、制品和部署模板。
- **怎么工作**：Jenkins 从指定 SCM 与版本加载 `vars/`、`src/` 和 `resources/`。
- **怎么看或怎么用**：Global Trusted Library、Folder Library、`@Library` 和库仓库版本。
- **坏了怎么查**：检查库版本、缓存、权限、CPS 方法不匹配、向后兼容和调用栈。

“Trusted Library” 中的代码权限很高。只有平台管理员控制的仓库才能作为可信库，业务团队提交不能自动获得该信任。

### Plugin

- **是什么**：运行在 Controller 内的 Jenkins 扩展模块。
- **为什么需要**：连接 SCM、Agent、身份源、凭据、报告和云平台。
- **怎么工作**：Core 启动时解析 `.jpi`、依赖、最低核心版本与扩展点。
- **怎么看或怎么用**：Plugin Manager、Update Center、插件健康分、依赖、Security Warning 和插件清单。
- **坏了怎么查**：查看启动日志、Failed Plugins、依赖版本、核心兼容和最近升级批次。

插件治理原则：

1. 只安装有明确 Owner 和使用场景的插件。
2. 固定核心与插件版本，不在生产直接“全选更新”。
3. 保存插件短名、版本、依赖和安全公告。
4. 用恢复出的测试 Controller 回放升级。
5. 先禁用和观察，再删除不用的插件。

### Credentials

- **是什么**：Jenkins 管理的口令、Token、SSH Key、证书和 Secret File。
- **为什么需要**：Pipeline 要访问 SCM、制品库、云平台和部署目标。
- **怎么工作**：秘密加密保存在 Controller，Job 通过 Credential ID 在有限作用域内临时绑定。
- **怎么看或怎么用**：Folder Scope、Credentials Provider、`withCredentials` 和审计记录。
- **坏了怎么查**：检查 ID、Scope、权限、过期时间、目标端授权、时钟与轮换记录。

日志 Masking 只是降低误打印风险，不是安全沙箱。只要不可信代码能在拿到 Credential 的 Agent 上执行，它就可能通过网络、编码、文件或子进程窃取秘密。

### `JENKINS_HOME`

- **是什么**：Controller 的主要持久状态目录。
- **为什么需要**：保存系统配置、Job、Build、Plugin、Credentials 加密材料和 Pipeline 状态。
- **怎么工作**：Core 和 Plugin 主要通过文件写入状态，并在启动时加载。
- **怎么看或怎么用**：System Information 中确认路径，按目录分类容量、备份和恢复。
- **坏了怎么查**：查磁盘、inode、权限、延迟、文件损坏、并发写、备份一致性和最近升级。

典型结构：

```text
JENKINS_HOME/
  config.xml
  jobs/
    <job-name>/
      config.xml
      builds/
      workspace/
  plugins/
  users/
  secrets/
  nodes/
  fingerprints/
  logs/
```

`workspace/` 通常可以从 SCM 重建；Job 配置、Build 记录、插件版本和加密材料则不能简单当缓存删除。

### Configuration as Code

- **是什么**：JCasC（Jenkins Configuration as Code）用 YAML 管理 Controller 配置。
- **为什么需要**：减少手工 UI 漂移，让配置可以评审和重建。
- **怎么工作**：Configuration as Code Plugin 读取 `CASC_JENKINS_CONFIG` 指向的 YAML 并应用到 Jenkins 对象与插件配置。
- **怎么看或怎么用**：Manage Jenkins > Configuration as Code > View / Check / Reload。
- **坏了怎么查**：检查 YAML 缩进、插件是否安装、属性名、Secret 注入、冲突文件和重启覆盖。

JCasC 不是完整备份。它不能自动保存所有 Build 历史、插件二进制、加密密钥和 Pipeline 运行态。

### Kubernetes 动态 Agent

- **是什么**：Kubernetes Plugin 按 Queue 需求创建临时 Agent Pod。
- **为什么需要**：不用长期维护空闲机器，并能按任务选择镜像和资源。
- **怎么工作**：Controller 通过 Kubernetes API 创建 Pod，Scheduler 选择 Node 并拉取镜像，Pod 中的 Agent 再通过 Remoting/Inbound 或 WebSocket 回连 Controller；Build 结束后按保留策略删除 Pod。
- **怎么看或怎么用**：Kubernetes Cloud、Pod Template、Pod Event、Agent Log、Kubernetes Scheduler 和镜像拉取状态。
- **坏了怎么查**：从 Queue Cause 进入，依次查 Plugin Provisioning、API 权限、配额、调度、镜像、证书、网络和 Agent 注册。

动态 Agent 解决执行弹性，不解决 Controller 状态高可用。`emptyDir` Workspace 在 Pod 删除后会消失，关键制品必须先上传。

只有 Pod 丢失、节点消失等基础设施故障，才适合用 Kubernetes Plugin 的 `retry(count: 2, conditions: [kubernetesAgent(), nonresumable()])` 申请新 Pod。编译错误、测试失败或应用自身 OOM 应直接暴露，不要靠重试掩盖。生产还要为 Controller 的建 Pod 路径和 Agent 的回连路径分别配置 ServiceAccount/RBAC、NetworkPolicy、资源限制、镜像供应链和超时。

## 架构和数据流

### 最小学习架构

```text
Browser
  -> 127.0.0.1:8080
  -> Jenkins Controller Container
      -> Built-in Executor（仅限隔离实验）
      -> jenkins_home Docker Volume
```

### 常见生产架构

```text
Developer / SCM Webhook
  -> HTTPS Reverse Proxy / WAF
  -> Jenkins Controller
      -> JENKINS_HOME on reliable low-latency storage
      -> Identity Provider / LDAP / OIDC
      -> Static Agent Pool
      -> Kubernetes Cloud
          -> Ephemeral Agent Pod
      -> Nexus / Harbor / Object Storage
      -> SonarQube / Test / Deploy Target
      -> Prometheus / Logs / Audit
```

### 信任域拆分

不要只按操作系统打 Label，还要按信任边界拆分：

```text
linux-build
  -> 普通编译与测试，不持有生产权限

image-build
  -> 允许构建镜像，限制 Registry Scope

prod-deploy
  -> 只运行受保护分支，短期凭据，审批与审计

code-signing
  -> 独立 Agent / Controller，限制人员和网络
```

同一个 Agent 同时运行不可信 PR 和生产部署，会让 Workspace、进程、容器缓存与 Credential 形成横向移动路径。

## 状态、一致性与故障收敛

Jenkins 的主状态主要在 `JENKINS_HOME` 文件系统，而不是一个外部关系数据库。它没有为同一个 `JENKINS_HOME` 提供通用的多 Controller 多写一致性协议。

因此：

- 不要让两个活动 Controller 同时读写同一个 `JENKINS_HOME`。
- 可靠存储只能降低磁盘故障概率，不能自动让应用变成 Active-Active。
- Controller 故障恢复通常是“单写实例重启或重建 + 恢复相同状态”。
- 多 Controller 更适合按团队、信任域、地域或业务重要性拆分，而不是共享一个状态目录。
- Pipeline 能否恢复取决于持久性模式、关闭方式、插件和存储完整性。

Agent Workspace 是执行状态，不应作为唯一事实来源。源码来自 SCM，依赖来自受控仓库，正式制品进入 Nexus/Harbor/对象存储，部署状态由目标平台和审计系统共同证明。

## 安装与启动

### 前提

- Docker Desktop Linux Engine 正常。
- `8080` 端口未被占用。
- 至少为学习容器准备 4 GB 内存和 10 GB 磁盘余量。
- 本实验只监听 `127.0.0.1`，不暴露公网。

### 创建学习环境

PowerShell：

```powershell
docker volume create jenkins_home

docker run -d --name jenkins-lab `
  --restart unless-stopped `
  -p 127.0.0.1:8080:8080 `
  -v jenkins_home:/var/jenkins_home `
  jenkins/jenkins:2.568.1-jdk21
```

本文基础实验没有远程 Inbound Agent，因此不发布 `50000`。使用 WebSocket Agent 时也不需要该端口；生产只开放实际使用的入口。

### 检查启动

```powershell
docker ps --filter "name=jenkins-lab"
docker logs -f jenkins-lab
```

正常时日志最终会显示 Jenkins 已完成初始化，并监听 8080。容器处于 `running` 不等于应用已就绪，要等启动日志和 HTTP 页面都正常。

获取首次解锁密码：

```powershell
docker exec jenkins-lab `
  cat /var/jenkins_home/secrets/initialAdminPassword
```

打开 `http://localhost:8080`，安装建议插件并创建管理员账号。实验后也不要保留初始密码或弱密码。

### 确认版本

```powershell
(Invoke-WebRequest -UseBasicParsing http://localhost:8080/login).Headers["X-Jenkins"]
docker exec jenkins-lab java -version
```

预期分别看到 `2.568.1` 与 Java 21。若页面重定向到登录页，只要响应头存在 `X-Jenkins`，就能确认 Jenkins 服务和版本。

## Pipeline 配置详解

下面是一条小而完整的 Declarative Pipeline：

```groovy
pipeline {
  agent any // 仅限本地实验；生产改为明确的受控 Agent Label

  options {
    timestamps() // 给日志增加时间，便于和告警、发布事件对齐
    timeout(time: 10, unit: 'MINUTES') // 防止任务永久占用资源
    disableConcurrentBuilds() // 同一个 Job 不允许并发修改共享状态
    buildDiscarder(logRotator(numToKeepStr: '10')) // 限制 Build 记录增长
    skipDefaultCheckout(true) // 本实验不读取 SCM，避免隐式 checkout
  }

  environment {
    EVIDENCE_FILE = 'jenkins-evidence.txt'
  }

  stages {
    stage('Create evidence') {
      steps {
        writeFile(
          file: env.EVIDENCE_FILE,
          text: "build=${env.BUILD_NUMBER}\njob=${env.JOB_NAME}\n"
        )
        sh 'sha256sum "$EVIDENCE_FILE"'
      }
    }

    stage('Archive') {
      steps {
        archiveArtifacts(
          artifacts: env.EVIDENCE_FILE,
          fingerprint: true
        )
      }
    }
  }

  post {
    always {
      echo "result=${currentBuild.currentResult}"
    }
  }
}
```

### 关键块

| 配置 | 作用 | 新手容易错在哪里 |
|---|---|---|
| `agent` | 选择 Pipeline 或 Stage 的执行节点 | `any` 可能落到错误信任域 |
| `options` | 设置超时、并发、保留和日志策略 | 只设置全局，不让关键 Job 单独覆盖 |
| `environment` | 定义普通环境变量 | 把 Secret 明文写进 Jenkinsfile |
| `stages` | 组织交付阶段 | Stage 名漂亮但没有真实门禁 |
| `steps` | 执行具体动作 | 忽略命令退出码或吞掉异常 |
| `post` | 在不同结果后执行清理与通知 | 通知失败反过来覆盖主任务结果 |
| `archiveArtifacts` | 保存短期构建证据 | 把 Jenkins 当长期制品仓库 |
| `fingerprint` | 记录文件指纹与关联 | 指纹不是签名，也不证明供应链可信 |
| `input` | 暂停等待人工审批 | 放在已经分配的 `node` 或顶层 Agent 内会长期占用 Executor 与 Workspace；审批应尽量放在申请 Agent 之前 |

### 凭据绑定示例

```groovy
withCredentials([
  usernamePassword(
    credentialsId: 'nexus-publisher',
    usernameVariable: 'NEXUS_USER',
    passwordVariable: 'NEXUS_PASSWORD'
  )
]) {
  sh '''
    set +x
    curl --fail --user "$NEXUS_USER:$NEXUS_PASSWORD" \
      --upload-file dist/app.tar.gz \
      "$NEXUS_URL/repository/releases/app.tar.gz"
  '''
}
```

`set +x` 减少 Shell 回显，但不能阻止恶意代码主动读取或外传环境变量。Credential 作用域、Agent 信任和目标端最小权限必须一起设计。

## JCasC 最小示例

生产 Controller 通常把 Built-in Executor 设为 0：

```yaml
jenkins:
  systemMessage: "Managed by JCasC"
  numExecutors: 0
  mode: EXCLUSIVE
  quietPeriod: 5
```

容器通过环境变量指定配置：

```yaml
services:
  jenkins:
    image: jenkins/jenkins:2.568.1-jdk21
    environment:
      CASC_JENKINS_CONFIG: /var/jenkins_home/casc/jenkins.yaml
    volumes:
      - jenkins_home:/var/jenkins_home
      - ./casc:/var/jenkins_home/casc:ro
```

JCasC 默认读取 `$JENKINS_HOME/jenkins.yaml`，也可以通过 `CASC_JENKINS_CONFIG` 指定文件、目录或 URL。多个 YAML 必须互补，不能重复定义同一个配置键。不要把真实密码直接提交进 JCasC；使用环境变量、文件 Secret 或外部 Secret Provider，并验证导出的配置是否包含敏感值。

JCasC 只管理可声明的 Controller 配置，不负责安装 Plugin，也不替代 Build 历史、Pipeline 运行态和密钥备份。生产镜像应另外用固定版本的 `plugins.txt` 与 `jenkins-plugin-cli` 构建。

## 常用命令、页面与 API 字典

| 名称 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| Controller Log | 看启动、插件和系统异常 | `docker logs jenkins-lab` | 初始化完成，无持续异常 | 只看 Build Console |
| `X-Jenkins` | 确认服务与核心版本 | 查看 HTTP 响应头 | 返回版本号 | 200 页面可能来自错误代理 |
| Root API | 查询 Job 与总体信息 | `/api/json` | 返回 JSON | `depth` 太大压垮 Controller |
| Queue API | 查询排队原因 | `/queue/api/json` | 返回 Item、时间和 `why` | 只看 Queue 数量 |
| Computer API | 查询 Node 状态 | `/computer/api/json` | 返回在线、Executor 等 | API 字段受权限影响 |
| Build API | 查询构建结果 | `/job/<job>/<build>/api/json` | 返回结果、时间与 Cause | Folder 路径编码错误 |
| `quietDown` | 停止接收新构建 | POST `/quietDown` | Controller 进入安静模式 | 忘记 `cancelQuietDown` |
| `safeRestart` | 等安全点后重启 | POST `/safeRestart` | 重启后恢复服务 | 不等于所有插件无风险 |
| Script Console | 执行管理员 Groovy | Manage Jenkins > Script Console | 返回脚本结果 | 等同 Controller 远程代码执行 |
| `jenkins-plugin-cli` | 在镜像构建时解析插件 | `--plugin-file plugins.txt` | 安装兼容依赖 | 不固定版本导致漂移 |

使用 API Token 查询 Queue：

```powershell
$jenkinsUser = $env:JENKINS_USER
$jenkinsToken = $env:JENKINS_TOKEN
$plain = "${jenkinsUser}:${jenkinsToken}"
$basic = [Convert]::ToBase64String(
  [Text.Encoding]::ASCII.GetBytes($plain)
)

$headers = @{ Authorization = "Basic $basic" }

Invoke-RestMethod `
  -Headers $headers `
  -Uri "http://localhost:8080/queue/api/json?tree=items[id,why,inQueueSince,task[name,url]]"
```

不要把 Token 直接写进命令历史或 Git。API Token 认证通常优先于用户名密码；权限不足返回 403 时，应补最小读取权限，而不是改成管理员 Token。

## 在 AIOps 中的作用

### 变更关联

把这些字段写入部署事件：

```json
{
  "change_id": "CHG-20260730-018",
  "jenkins_url": "https://jenkins.example/job/order-api/183/",
  "job": "order-api",
  "build": 183,
  "commit": "9a2f4b1",
  "artifact_digest": "sha256:...",
  "environment": "prod",
  "started_at": "2026-07-30T02:10:00Z",
  "finished_at": "2026-07-30T02:18:41Z",
  "result": "SUCCESS"
}
```

应用错误率在 02:20 上升时，AIOps 可以把告警和两分钟前的 Build、Commit、制品与环境关联起来。这个时间相关性是根因假设，不是因果证明，还要对照流量、配置、依赖和回滚结果。

### 失败日志分类

可以把 Console 按失败阶段聚类：

- SCM 认证或网络。
- Agent / Pod 启动。
- 依赖下载。
- 编译或测试。
- SonarQube 门禁。
- 制品上传。
- 部署与健康验证。

LLM 可以总结证据并推荐 Runbook，但不能拿一个错误关键字自动执行生产回滚。

### 容量异常检测

长期记录 Queue Wait、Build Duration、Agent Provision Time 和 Executor Utilization，可以发现：

- 周一早高峰容量不足。
- 新基础镜像导致启动变慢。
- 某类测试持续增长。
- 某个 Plugin 升级后 Controller CPU 抬升。
- Kubernetes API 或 Registry 变慢。

## 可观测性

### 四层证据

| 层 | 关键证据 | 回答什么 |
|---|---|---|
| Controller | HTTP、Heap、GC、CPU、Thread、磁盘、启动日志 | 控制面是否健康 |
| Queue | Queue Size、Wait、`why`、取消率 | 为什么没有开始 |
| Agent | Online、Executor、Provision Time、连接日志、资源 | 有没有执行能力 |
| Build | Duration、Result、Stage、Console、Test、Artifact | 执行到哪里失败 |

### 推荐指标

- Controller 可用性、HTTP p95、5xx。
- JVM Heap、GC Pause、CPU、Thread。
- `JENKINS_HOME` 磁盘空间、inode、I/O 延迟。
- Queue Item 数、最老 Item 年龄、p50/p95 Queue Wait。
- Build 到达率、成功率、失败率、取消率、时长分位数。
- Agent Online 数、Offline 时长、Executor Busy Ratio。
- 动态 Agent Provision Time、Pod Pending、Image Pull、启动失败。
- Plugin Security Warning 与待重启状态。
- Backup 成功、恢复演练耗时和恢复点年龄。

### Prometheus

Prometheus Metrics Plugin 可暴露 Jenkins 指标。安装后按插件文档确认路径、权限和指标名，不要把 `/prometheus/` 无认证暴露公网。

Prometheus 抓取配置示意：

```yaml
scrape_configs:
  - job_name: jenkins
    metrics_path: /prometheus
    scheme: https
    static_configs:
      - targets:
          - jenkins.example.com
```

实际环境还要配置认证、TLS 与网络访问。插件指标名会变化，告警规则应基于当前实例真实输出。

### SLI / SLO

例子：

```text
Controller Availability >= 99.9%
P95 Queue Wait < 120 seconds
P95 Dynamic Agent Provision < 90 seconds
Critical Deploy Pipeline Success >= 99%
Backup Restore Drill RTO < 60 minutes
```

Build 失败率不能直接等于 Jenkins 可用性：业务测试失败是正确门禁，平台错误才属于 Jenkins 平台 SLI。

## 基础实验：完成第一条可验证 Pipeline

### 实验目标

启动固定 Jenkins LTS，创建一条 Pipeline，生成 `jenkins-evidence.txt`，归档并核对 SHA-256。

### 实验边界

- 只使用前文新建的 `jenkins-lab` 与 `jenkins_home`。
- Built-in Executor 只用于本地隔离实验。
- 不接入真实生产凭据、仓库或部署目标。
- 生产 Controller 应把 Built-in Executor 设为 0。

### 第一步：建立环境

按“安装与启动”章节启动容器，完成解锁、建议插件安装和管理员创建。

### 第二步：创建 Job

1. 点击 New Item。
2. 输入 `jenkins-foundation-lab`。
3. 选择 Pipeline。
4. 在 Pipeline Script 中粘贴前文 Declarative Pipeline。
5. 保存。

### 第三步：运行

点击 Build Now，打开 Console Output。

预期顺序：

```text
Create evidence
  -> 生成 jenkins-evidence.txt
  -> 输出 SHA-256
Archive
  -> 归档文件并生成 Fingerprint
Finished: SUCCESS
```

### 第四步：验证

- Build 页面结果为 `SUCCESS`。
- Stage 视图两个 Stage 都成功。
- Artifacts 中能下载 `jenkins-evidence.txt`。
- 文件内容包含本次 Build Number 和 Job Name。
- Console 中的 SHA-256 与下载文件重新计算的值一致。

PowerShell 重新计算：

```powershell
Get-FileHash .\jenkins-evidence.txt -Algorithm SHA256
```

### 第五步：保存证据

保存：

- Pipeline 截图。
- Console Output。
- Artifact 与 SHA-256。
- Jenkins 核心版本和 Java 版本。
- 插件清单。

### 如果没有成功

1. 一直排队：Built-in Node 是否有 Executor，Controller 是否 Quiet Down。
2. `writeFile` 不存在：Pipeline 相关建议插件是否安装完整。
3. `sh` 不存在：是否误用 Windows Agent；本实验官方 Controller 镜像是 Linux。
4. 没有 Artifact：文件是否生成，表达式是否匹配。
5. 页面 403：当前用户是否有 Job/Build、Job/Read 和 Run/Artifacts 权限。
6. 容器重启后 Job 丢失：`jenkins_home` 卷是否正确挂载。

### 清理

先停止并删除容器：

```powershell
docker rm -f jenkins-lab
```

若确定不再需要所有实验配置与 Build，再核对并删除卷：

```powershell
docker volume inspect jenkins_home
docker volume rm jenkins_home
```

第二条会永久删除实验 Jenkins 状态。生产环境绝不能照抄。

## 故障注入实验：Label 不匹配导致任务永久排队

### 实验目标

主动配置一个不存在的 Label，观察 Queue Cause，形成假设，修复后验证 Build 恢复。

### 前提

- 已完成基础实验。
- `jenkins-foundation-lab` 能成功。
- 实验没有真实发布动作。

### 第一步：保存健康基线

记录：

- 最近一次成功 Build。
- Queue 为空。
- Built-in Node Online。
- 当前 Executor 数。

### 第二步：注入错误

把 Pipeline 的：

```groovy
agent any
```

改成：

```groovy
agent {
  label 'linux-docker'
}
```

保存并点击 Build Now。不要创建这个 Label。

### 第三步：观察现象

预期：

- Build 已创建，但没有 Console Step 输出。
- Build 停留在 Queue。
- 页面提示没有 Label 为 `linux-docker` 的 Node，或没有可用 Executor。
- Queue API 的 `why` 字段给出类似原因。

不要用“Jenkins 挂了”概括现象，因为 Controller UI 和 API 仍然正常。

### 第四步：形成假设

假设：

```text
任务创建与 Controller HTTP 正常；
调度约束要求 linux-docker；
当前没有任何 Online Node 满足该 Label；
因此任务无法分配 Executor。
```

验证证据：

1. Queue Item 的 `why`。
2. Pipeline 的 Label。
3. Nodes 页面中的真实 Label。
4. Executor 是否空闲。
5. 同一时间其他 `agent any` Job 是否能运行。

### 第五步：修复

本实验不需要新增 Agent。把错误 Label 改回：

```groovy
agent any
```

保存。等待原 Queue Item 重新评估，或取消旧 Build 后重新 Build。

### 第六步：验证

- Queue Item 消失。
- Pipeline 获得 Executor。
- 两个 Stage 完成。
- Artifact 生成。
- 新 Build 为 `SUCCESS`。

### 爆炸半径与回滚

生产中不能把所有 Job 的 Label 批量改成 `any`，这可能把签名、生产部署或 Docker Build 送到错误信任域。正确修复可能是：

- 恢复指定 Agent。
- 修正拼错的 Label。
- 回滚 Pod Template / JCasC。
- 暂时扩容匹配的动态 Agent。

每种动作都要评估哪些 Job 会被重新调度，以及是否可能重复部署。

### 清理与复盘

删除故障 Build，或保留它作为学习证据。复盘至少记录：

- 注入时间和 Queue Wait。
- `why` 原文。
- 错误 Label 与可用 Label。
- 修复时间。
- 为什么不选择重启 Controller。
- 生产应该添加的 Label 变更审计和 Queue Age 告警。

### 如果没有得到预期结果

- Job 立即执行：可能已经存在同名 Label。
- 没有 Queue Item：Job 配置或 Pipeline 语法可能先失败。
- 改回 `any` 仍不执行：检查 Quiet Down、Executor、Built-in Node 和并发限制。
- Queue API 看不到内容：检查 API Token 和 Overall/Read、Job/Read 权限。

## 常见故障排查

### 页面能打开，所有 Job 一直排队

证据顺序：

1. Queue `why` 与最老 Item。
2. Controller 是否 Quiet Down。
3. Label 是否存在且大小写一致。
4. Agent 是否 Online。
5. Executor 是否全忙。
6. Throttle、Lock、并发和云 Provisioning。
7. 最近 JCasC、Plugin、Pod Template 或权限变更。

不要先扩容。若任务被 Lock 阻塞，加 Executor 不会解决。

### Agent 反复 Offline

检查：

- Agent Java 是否满足当前 Jenkins 要求。
- Controller URL、证书、DNS 和时钟。
- SSH / Inbound / WebSocket 连接方式。
- Remoting 日志、代理与负载均衡空闲超时。
- Agent 磁盘、临时目录、内存和进程。
- Node Monitor 是否因磁盘、Swap、时钟或响应时间主动下线。

修复网络或资源后再上线，不要长期关闭 Node Monitor。

### Pipeline 重启后不能恢复

检查：

- Controller 是否脏关闭或 OOM Kill。
- Pipeline durability 模式。
- Build 目录与 `program.dat` 是否完整。
- `JENKINS_HOME` I/O、NFS 和文件损坏。
- Pipeline Plugin 是否升级或降级。
- 是否存在 CPS Method Mismatch 或不可序列化对象。

关键生产 Pipeline 应测试正常重启、异常重启和恢复，不只相信配置名称。

### Controller CPU / Heap 很高

区分：

- Plugin ClassLoader 与内存泄漏。
- Groovy / CPS 在 Controller 做大量计算。
- 大量分支索引。
- Queue 维护与超大 Build 历史。
- 日志、API 大 `depth` 查询和 UI 渲染。
- GC、线程死锁或文件 I/O 等待。

先保存 Thread Dump、Heap/GC、请求和变更时间线，再决定重启。

### `JENKINS_HOME` 磁盘满

先看：

- `jobs/*/builds` 与 Archive。
- Workspace、Stash、Fingerprint 和日志。
- Plugin、Cache 与临时文件。
- Build Retention 是否生效。
- 外部制品是否仍重复保存在 Jenkins。

不要在运行中的 Controller 直接批量删除未知目录。先停止增长、确认目录语义和备份，再按 Jenkins 页面或受控脚本清理。

### Plugin 升级后 Jenkins 启动失败

保存启动日志中的：

- Failed to load。
- Dependency errors。
- Required Core version。
- Detached / Implied dependency。
- `Failed Loading plugin`。

使用恢复出的测试 Controller 重现。生产回滚必须匹配 Core、Plugin 与 `JENKINS_HOME` 状态，不能只把一个 `.jpi` 随便换旧。

### Credential 绑定成功但目标系统返回 401

检查 Credential ID、Folder Scope、类型、过期时间、目标端权限、用户名格式和时钟。Masking 后看不到明文是正常的，不要用 `echo` 绕过 Masking。

### Webhook 不触发 Multibranch

检查：

- SCM Webhook 投递记录和 HTTP 状态。
- Jenkins Root URL 与反向代理。
- SCM App/Token 权限和 Rate Limit。
- Multibranch Scan Log。
- Jenkinsfile 路径和 Branch Source 策略。
- Fork / PR 信任规则。

手工 Build 成功不能证明 Webhook 链路健康。

## 容量与性能

### Executor 不是越多越好

平均并发可以用 Little's Law 粗估：

```text
平均并发 ≈ 每分钟到达的 Build 数 × 平均 Build 分钟数
```

例如每小时 120 个 Build，平均 6 分钟：

```text
每分钟到达 2 个
平均并发 ≈ 2 × 6 = 12
```

再考虑峰值、失败重试、Agent 启动和维护，可能需要 18 个有效槽位。但“18 个 Executor”必须同时满足 CPU、内存、磁盘、网络、许可证和外部依赖容量。

### 有效容量

```text
有效并发 = min(
  Executor 数,
  CPU 可承载并发,
  内存可承载并发,
  磁盘与网络吞吐,
  外部服务限额,
  许可证数量
)
```

### Controller 容量

Controller 压力不只来自 Build 数，还来自：

- 并发 Pipeline 数和 Step 密度。
- CPS 状态写盘频率。
- Job、Branch 和 Build 历史数量。
- Plugin 数、ClassLoader 和事件监听。
- Queue 规模与 Label 计算。
- API、UI、Webhook 和分支索引。
- `JENKINS_HOME` IOPS、延迟和 inode。

### 动态 Agent 容量

额外观察：

- Pod 创建到 Agent Online 的 p95。
- Kubernetes API QPS 和限流。
- Namespace Quota、Node 容量和调度失败。
- 镜像大小、Registry 延迟与缓存。
- Pod 启动并发对 DNS、Registry 和存储的冲击。

动态扩容不是无限容量。一次性放出 500 个 Pod 可能先打垮 Registry 或 Kubernetes API。

## 安全

### 身份与权限

- 使用企业身份源、SSO、LDAP 或 OIDC。
- 用 Matrix / Role Strategy 按 Folder、Job 和操作分权。
- 严格限制 Overall/Administer、Script Console 和 Job/Configure。
- 生产部署权限与普通 Build 权限分开。
- API Token 设置过期时间并轮换。
- 审计用户、配置、Plugin、Credential 和发布操作。
- 保持 CSRF（跨站请求伪造）保护开启。用户名 + API Token 的 API 请求不需要 Crumb；使用用户名 + 密码和会话执行修改操作时要携带 Crumb，不能为省事全局关闭保护。

### Controller 隔离

- Built-in Executor 设为 0。
- Agent 不得读写 `JENKINS_HOME`。
- Agent 不得通过 `sudo` 或共享 Docker Socket 获得 Controller 宿主权限。
- 保持 Agent → Controller Access Control 启用。
- Script Approval 和 Trusted Library 视为高权限入口。

### 网络

- Jenkins UI/API 放在 HTTPS 反向代理之后。
- 只开放实际使用的端口。
- WebSocket Agent 可减少单独 Inbound TCP 端口需求。
- Controller 到 Agent、SCM、Registry、身份源和目标环境做最小网络访问。
- Webhook 入口验证来源与 Secret。

### 构建隔离

- 不可信 PR 不运行在生产部署或签名 Agent。
- 静态 Agent 定期清理 Workspace、进程和容器。
- 动态 Pod 使用非 Root、只读文件系统、最小 ServiceAccount 和资源限制。
- 不把宿主机 `/var/run/docker.sock` 无条件挂给业务 Pipeline。
- 构建基础镜像固定 Digest 并扫描。

### Credentials

- 从无权限开始，按 Folder / Job 最小授权。
- 平台、生产、制品和扫描凭据分离。
- 优先短期 Token 与外部 Secret Manager。
- 不在 SCM、JCasC、Console 和 Artifact 中写 Secret。
- 备份与加密密钥分开保存和授权。

### Plugin 供应链

- 只从受信 Update Center 或内部镜像安装。
- 关注插件维护状态、健康分与安全警告。
- 固定版本并保存依赖解析结果。
- 在隔离 Controller 测试 Core + Plugin 组合。
- 不因为一个插件方便就忽略其 Controller 代码执行权限。

## 高可用与灾难恢复

### 先承认 Controller 是有状态单写组件

开源 Jenkins 的常见恢复模型是：

```text
单个活动 Controller
  + 可靠低延迟 JENKINS_HOME
  + 自动重启 / 重新调度
  + 配置即代码
  + 一致备份
  + 已验证恢复 Runbook
```

Kubernetes StatefulSet、PVC 或云盘可以让 Controller 在节点故障后重建，但这属于基础设施恢复，不是两个活动 Controller 的应用级多活。

### 多 Controller

当单个 Controller 的信任域、插件、Job 数或爆炸半径过大时，按以下维度拆分：

- 普通构建与生产部署。
- 高安全签名与一般 CI。
- 业务线或部门。
- 地域与网络边界。
- 不同 Plugin / Java 生命周期。

拆分会增加身份、Plugin、JCasC、监控和升级治理成本，但能降低一个 Controller 故障影响全公司的风险。

### RPO 与 RTO

设计要回答：

- Job 配置最多允许丢多久？
- Build 记录与审计证据必须保留多久？
- 运行中的生产 Pipeline 丢失后如何判断目标状态？
- Controller 多久恢复？
- Agent 和 Webhook 如何重新连接？
- 恢复后是否会重复部署？

Jenkins 自己显示“Build Running”不是目标系统状态的最终证明。灾难恢复后，要去 Kubernetes、数据库、制品库和云平台核对实际变化。

## 备份与恢复

### 备份什么

- `JENKINS_HOME` 中的系统与 Job 配置。
- Build 记录、测试报告和必要审计历史。
- Plugin 短名、版本与二进制。
- Core 版本、Java 版本、镜像 Digest。
- JCasC、Helm Values、反向代理和启动参数。
- Credential 加密材料与 Controller Key。

Workspace、可重新下载的 Cache 和外部已有的 Artifact 可以按 RPO/RTO 选择是否备份。

### 密钥要分开

官方文档强调 Controller Key 与普通备份分开保存。恢复 Credentials 需要匹配的加密材料，但把数据备份和解密密钥放在同一位置，会让拿到备份的人同时拿到秘密。

建议：

- 普通 Jenkins 数据备份进入备份系统。
- `master.key` 与 `secrets/` 的必要恢复材料单独加密、单独授权。
- 恢复演练由两种权限共同完成。

### 一致性

优先使用能保证一致性的文件系统或存储快照。在线逐文件复制可能跨越多个写入时刻，恢复后出现 Job 配置、Build 状态和 Pipeline 文件不一致。

### 恢复验证

恢复到隔离环境后验证：

1. Core、Java 和 Plugin 组合一致。
2. Jenkins 能启动。
3. 身份与权限正确。
4. Credentials 可解密但不会被输出。
5. 关键 Job、Shared Library 和 JCasC 可加载。
6. 历史 Build 与 Artifact 符合保留策略。
7. Agent 能连接。
8. 一条无副作用 Pipeline 能成功。
9. RTO 与恢复步骤被记录。

备份任务成功不等于可恢复。

## 升级与回滚

### 升级前

1. 确认当前 Core、目标 LTS、Java、Plugin、Agent 和操作系统。
2. 阅读跨越的所有 LTS Upgrade Guide 与 Security Advisory。
3. 导出 Plugin 清单、JCasC、系统配置和 Node 配置。
4. 做一致备份，并在隔离环境恢复。
5. 用恢复数据测试目标 Core + Java + Plugin。
6. 回放关键 Multibranch、Credentials、Shared Library、Agent、Artifact 与 API。
7. 记录 Queue、运行中 Pipeline 和目标环境状态。
8. 定义维护窗口、Quiet Down、失败标准和恢复点。

### 执行

```text
停止接收新任务
  -> 等待或处置运行中任务
  -> 做最终恢复点
  -> 停止 Controller
  -> 更新 Java / Core / Plugin
  -> 启动并观察迁移
  -> 验证身份、Agent、Job、API
  -> 放开流量
  -> 观察一段时间
```

Agent 的 Java 与 Remoting 也必须满足目标 Core。Controller 升级成功而所有 Agent 因 Java 太旧离线，平台仍然不可用。

### 回滚

完整回滚单元：

```text
Core / Container Image
  + Java
  + Plugin 版本
  + JENKINS_HOME 恢复点
  + JCasC / 启动参数
  + Agent 兼容
  + 外部部署实际状态
```

新版本 Core 或 Plugin 可能改写配置和 Build 状态。只把镜像标签改回旧版，未必能读取已经迁移的数据。若升级期间 Pipeline 已发布生产，还要单独决定业务回滚，不能把 Jenkins 回滚当成应用回滚。

## 选型取舍

| 场景 | 更可能选择 | 主要取舍 |
|---|---|---|
| 大量存量异构系统、复杂插件和自建 Agent | Jenkins | 灵活，但平台治理成本高 |
| GitLab 仓库与一体化交付 | GitLab CI/CD | 代码平台集成强，Runner 与平台绑定 |
| GitHub 仓库与 SaaS 自动化 | GitHub Actions | 使用方便，需治理 Action 与 Runner |
| Kubernetes 原生声明式交付 | Argo CD / Flux | 擅长 GitOps 收敛，不替代所有 CI |
| Kubernetes 原生 Pipeline | Tekton 等 | 资源模型原生，迁移和生态取舍不同 |

企业常见组合：

```text
Jenkins 做 CI / 复杂构建
  -> Nexus / Harbor 保存制品
  -> Argo CD 做 Kubernetes CD
  -> Prometheus / Grafana 观测
```

选型比较现有系统、插件、工具链、执行隔离、权限、审计、弹性、升级、人力与总成本，不只比较 YAML 长短。

## 事故场景：升级后 500 条 Pipeline 全部排队

### 现象

- Jenkins 页面和登录正常。
- 500 条 Pipeline 在 Queue。
- 所有 Static Agent 与 Kubernetes Agent 都显示 Offline。
- Controller 昨晚从旧 LTS 升级到 `2.568.1`。
- 业务团队开始反复点击 Build Now。

### 证据顺序

1. 保存 Queue `why`、最老等待时间和增长速度。
2. 查看 Nodes 页面与 Agent Launch Log。
3. 比较 Controller 与 Agent Java 版本。
4. 查看 Remoting 最低版本和连接错误。
5. 检查 Kubernetes Pod Event、日志和证书。
6. 查看升级前后的 Core、Plugin、JCasC 与网络变化。
7. 暂停非紧急触发，避免 Queue 继续放大。

### 假设

- 假设一：Agent Java 版本低于目标 Jenkins 要求。
- 假设二：Remoting / Agent Image 与新 Core 不兼容。
- 假设三：JCasC 重载改变了 Controller URL 或 Inbound/WebSocket 配置。
- 假设四：反向代理升级后阻断 WebSocket。

若所有不同类型 Agent 都在同一升级时间点出现 `UnsupportedClassVersionError`，Java 不兼容比“云容量不足”更强。

### 处置

- Quiet Down 或暂停非关键 SCM 触发。
- 选一个隔离 Agent 升级 Java / Image，验证连接和无副作用 Pipeline。
- 若修复路径清晰，分批更新 Agent。
- 若目标 Core 存在更大兼容问题，按已验证恢复点回滚 Core、Plugin 与状态。
- 按业务优先级恢复 Queue，避免 500 条任务同时冲击 SCM、Registry 和集群。

### 爆炸半径与回滚

Agent 恢复后，排队 Pipeline 可能立即并发启动。先限流并识别哪些任务包含部署、数据库或签名动作。取消 Queue 也可能让业务误以为变更已执行，必须保留审计并通知 Owner。

### 复盘

- Agent Java 兼容矩阵为什么没有进入升级门禁？
- 测试 Controller 是否连接了真实类型的 Agent？
- 为什么 SCM Trigger 没有限速？
- 是否有 Queue Age、Agent Offline Ratio 和 Provision Failure 告警？
- 回滚演练是否覆盖了 Credentials、Plugin 和 Agent？

## 生产系统设计题

题目：为 300 个仓库、每天 2000 次构建、p95 Queue Wait 小于 2 分钟，并包含生产部署与代码签名的团队设计 Jenkins 平台。

回答主线：

1. 收集语言、工具链、平均/峰值到达率、时长、资源、信任域和 SLO。
2. 普通 CI、生产部署和代码签名按风险拆 Agent，必要时拆 Controller。
3. Controller Built-in Executor 为 0，`JENKINS_HOME` 使用可靠低延迟存储。
4. 普通 CI 使用 Kubernetes 动态 Agent，固定镜像 Digest、资源与 ServiceAccount。
5. 签名使用隔离静态 Agent，不接收 Fork PR。
6. Jenkinsfile 与 Shared Library 进入 SCM，平台模板版本化。
7. Credentials 按 Folder 最小授权，生产优先短期 Token 与审批。
8. 正式 Artifact 进入 Nexus/Harbor，Jenkins 只保存短期证据。
9. 用到达率 × 时长估算并发，再按 CPU/内存/IO/外部限额校正。
10. 监控 Controller、Queue、Agent、Build 和外部依赖，定义 Queue Wait SLO。
11. Core、Plugin、Java、Agent Image 使用兼容矩阵和分批升级。
12. JCasC、插件清单、一致备份与隔离恢复演练满足 RPO/RTO。
13. Controller 故障恢复后，对生产目标状态做幂等核对，防止重复部署。

## 面试怎么讲

### 30 秒版本

Jenkins 是可扩展的自动化调度平台。Controller 保存 Job、Queue、Pipeline 和插件状态，Agent 通过 Executor 执行构建，Jenkinsfile 把交付流程版本化。生产上我会把 Controller Executor 设为 0，按 Label 与信任域隔离 Agent，把正式制品放到外部仓库，并重点监控 Queue Wait、Agent Online、Controller JVM 和 `JENKINS_HOME`。

### 3 分钟版本

一次触发先在 Controller 创建 Queue Item，调度器根据 Label、Node 在线状态、空闲 Executor、并发和锁分配任务。Pipeline Groovy 由 Controller 的 CPS 引擎调度，真正的 `sh`、编译和测试运行在 Agent；Pipeline 状态、Job 配置、Build 记录和插件主要保存在 `JENKINS_HOME`。

所以排队问题先看 Queue `why`，再看 Label、Agent、Executor、Lock 和动态 Pod，而不是先重启。容量要用到达率、平均时长和资源需求算有效并发。安全上要隔离 Controller 与不可信构建，限制 Trusted Library、Script Console 和 Credential Scope。高可用不是复制两个 Controller 共享目录，而是单写状态、可靠存储、JCasC、备份恢复和必要的多 Controller 故障域拆分。

升级时我会把 Core、Java、Plugin、Agent 和 JCasC 当成一个兼容单元，先用生产备份恢复到测试 Controller，连接真实类型 Agent，验证关键 Pipeline，再维护窗口发布。回滚也要恢复匹配的 `JENKINS_HOME`，不能只改镜像标签。

## 面试题与递进追问

### 1. Controller、Agent、Node、Executor 有什么区别？

参考答案：Controller 管理和调度；Node 是 Jenkins 中的节点定义；Agent 是节点上建立 Remoting 连接的进程；Executor 是节点可并行执行任务的槽位。

继续追问：

- 为什么 Built-in Executor 要设为 0？
- Executor 数怎么定？
- Agent 在线为什么仍可能不接任务？
- 一个 Node 能不能有多个 Label？

### 2. Job 一直排队怎么排查？

参考答案：先保存 Queue `why` 和等待时间，再检查 Quiet Down、Label、Agent Online、Executor、并发、Lock、Throttle 和 Cloud Provisioning，最后看变更时间线。

继续追问：

- 加 Executor 为什么可能没用？
- 如何区分容量不足与 Label 错误？
- Queue 恢复后如何避免瞬时洪峰？
- 取消 Queue 有什么业务风险？

### 3. Jenkinsfile 为什么能在重启后继续？

参考答案：Pipeline 使用 CPS 模型，把可恢复执行状态持久化到 Build 目录；durability 模式控制写盘频率与性能/恢复取舍。

继续追问：

- 脏关闭与正常关闭有什么区别？
- `@NonCPS` 解决什么问题？
- 为什么大 Map 会拖慢 Controller？
- `PERFORMANCE_OPTIMIZED` 的代价是什么？

### 4. Plugin 升级为什么危险？

参考答案：Plugin 在 Controller 内运行，存在核心版本、依赖、配置格式和安全兼容。一个升级可能阻止 Jenkins 启动或改变 Job 行为。

继续追问：

- 如何导出插件清单？
- 为什么不能只回退一个 `.jpi`？
- 如何设计测试 Controller？
- Plugin 安全漏洞怎么排优先级？

### 5. Credentials 加密后为什么仍可能泄露？

参考答案：加密保护静态存储，但 Pipeline 使用时必须把秘密交给执行环境。不可信代码可以主动读取、编码或外传，Masking 只能减少误打印。

继续追问：

- Folder Scope 有什么价值？
- Fork PR 如何隔离？
- 为什么不把所有 Secret 放全局？
- 外部 Secret Manager 能解决什么、不能解决什么？

### 6. Jenkins 如何做高可用？

参考答案：先承认 Controller 是有状态单写组件。常见方案是可靠 `JENKINS_HOME`、自动重建、JCasC、一致备份和快速恢复；需要降低爆炸半径时按信任域拆多个 Controller。

继续追问：

- 两个 Controller 能否同时挂同一个目录？
- StatefulSet + PVC 是否等于 HA？
- 运行中 Pipeline 恢复后如何防重复部署？
- RPO 与 RTO 如何验证？

### 7. Kubernetes 动态 Agent 的完整链路是什么？

参考答案：Queue 匹配 Pod Template，Kubernetes Plugin 调用 API 创建 Pod，Scheduler 分配 Node，拉取镜像，Agent 容器连接 Controller，获得 Executor 后运行任务，完成后清理 Pod。

继续追问：

- Pod 一直 Pending 看哪里？
- 为什么 Agent Online 慢？
- Workspace 为什么会消失？
- 如何限制业务 Job 使用某个 Cloud？

### 8. Jenkins 与 GitLab CI / GitHub Actions 怎么选？

参考答案：Jenkins 适合存量异构环境和复杂自建集成，但平台治理成本高；GitLab CI 与 GitHub Actions 和代码平台结合更紧。很多企业会并存或把 Jenkins CI 与 GitOps CD 组合。

继续追问：

- 迁移先迁 Pipeline 还是 Agent？
- 如何保留制品追溯？
- Shared Library 如何迁移？
- 什么情况下应该保留 Jenkins？

## 学习检查清单

- [ ] 我能区分 LTS、Weekly、Jenkins Java 与项目构建 JDK。
- [ ] 我能画出 Trigger、Queue、Agent、Executor、Step 和 Build Record 路径。
- [ ] 我能解释 Controller、Node、Agent 与 Executor。
- [ ] 我能解释 Pipeline CPS 与 durability 取舍。
- [ ] 我能说明 `JENKINS_HOME` 中什么是主状态、什么可重建。
- [ ] 我能启动固定版本 Jenkins 并完成第一条 Pipeline。
- [ ] 我能制造 Label 不匹配并用 Queue `why` 证明原因。
- [ ] 我能设计静态与 Kubernetes 动态 Agent。
- [ ] 我能按信任域隔离普通构建、生产部署和签名任务。
- [ ] 我能治理 Plugin、Credentials、Shared Library 和 JCasC。
- [ ] 我能用到达率和时长估算有效并发。
- [ ] 我能建立 Controller、Queue、Agent 与 Build 四层监控。
- [ ] 我能设计一致备份、密钥分离和恢复演练。
- [ ] 我能解释为什么 Jenkins 不应伪装成共享目录 Active-Active。
- [ ] 我能给出 Core、Java、Plugin、Agent 与状态的升级回滚方案。
- [ ] 我能回答事故题和生产系统设计题。

## 学习证据

建议建立：

```text
jenkins-aiops-lab/
  README.md
  Jenkinsfile
  plugins.txt
  casc/
    jenkins.yaml
  evidence/
    version.txt
    java-version.txt
    plugin-list.txt
    pipeline-success.png
    artifact-sha256.txt
    queue-why.json
    label-failure.png
    recovered-build.png
  notes/
    controller-agent-path.md
    pipeline-durability.md
    credential-boundary.md
    capacity-plan.md
    backup-restore-drill.md
    upgrade-rollback.md
    incident-review.md
```

README 必须区分：

- 本文给出的预期结果。
- 你实际运行的 Jenkins / Java / Plugin 版本。
- 哪些实验真实执行。
- 哪些只完成静态设计。
- Credential 和 Token 如何销毁。
- 清理是否删除了 `jenkins_home`。
- 未验证的生产边界。

## 本文边界与下一步

本文覆盖从零入门到平台运维与大厂面试主线，没有穷尽所有 Pipeline Step、SCM Plugin、云 Provider、Windows Agent、FIPS、审计插件、外部 Secret Manager 和企业版高可用能力。

下一步可以继续：

1. 用 Git 仓库运行 Multibranch Pipeline。
2. 用 JCasC 与 `plugins.txt` 重建 Controller。
3. 接入一个独立 Agent，并把 Built-in Executor 设为 0。
4. 在 Kubernetes 创建动态 Agent，记录 Pod Provision Time。
5. 把 Jenkins Build 事件接入 Prometheus、日志平台和变更时间线。
6. 完成一次隔离恢复演练和 LTS 升级演练。

读完本文不等于自动具备 Jenkins 平台岗位能力。还需要训练 Linux、网络、Java/JVM、Groovy、Git、容器、Kubernetes、制品管理、供应链安全、容量压测和真实变更沟通。
