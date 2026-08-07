# n8n 技术栈深讲

> 很多人会搜索“N8N”，但官方产品名写作小写 `n8n`，读作 “n-eight-n”。本文后续统一使用官方写法。

## 学习目标

学完这篇文章，你应该能做到：

1. 用一句人话解释 n8n，不把它误说成大模型、脚本语言或单纯的定时任务工具。
2. 分清 Workflow、Node、Connection、Item、Execution、Credential、Trigger 与 Task Runner。
3. 从 Webhook 一直追到节点执行、数据库状态和 HTTP 响应，画出完整数据路径。
4. 用固定版本的 Docker Compose 启动学习环境，跑通一条无外部副作用的 AIOps 告警工作流。
5. 用 Stop And Error 与 Error Workflow 完成一次可恢复的故障注入，而不是只看“绿色成功”。
6. 解释 Regular mode 与 Queue mode 的区别，知道 Redis、PostgreSQL、worker、webhook processor 各负责什么。
7. 设计幂等、重试、审批、审计、容量保护、备份、升级和回滚，不把“画出流程”当作生产完成。
8. 面对“Webhook 返回成功但工单延迟 20 分钟”这类事故，按证据排查而不是盲目重启。

本文覆盖从零入门到生产设计和面试追问，但不会承诺“看完就能拿 Offer”。Linux、网络、数据库、脚本、系统设计、真实项目和沟通表达仍需单独练习。

## 版本、许可与验证边界

本文事实快照日期为 **2026-08-07**：

| 项目 | 本文基线 | 说明 |
| --- | --- | --- |
| 稳定版 | `2.33.5` | 2026-08-06 发布；本文 Docker 实验固定这个数字版本 |
| 预发布版 | `2.34.2` | 只用于识别未来功能，不作为学习和生产基线 |
| 镜像 | `docker.n8n.io/n8nio/n8n:2.33.5` | 不使用会随时间漂移的 `latest` |
| 许可 | Sustainable Use License / fair-code | source-available，不是 OSI 意义上的开源软件 |

版本边界必须记住：官方文档的 `main` 分支可能领先于稳定版。例如文档已经描述从 `2.34.0` 起可用的大 Webhook 响应 offload，但本文稳定版仍是 `2.33.5`，因此不会把它写成当前实验能力。

许可边界也不能含糊：

- 通常允许公司内部业务、个人和非商业用途。
- 通常允许为客户提供工作流咨询、实施和内部服务器维护服务。
- Sustainable Use License 不允许把 n8n 白标后收费，也不允许托管 n8n 后向客户收访问费。
- 仓库中的 `.ee.` 文件或 `.ee` 目录受 Enterprise License 约束。
- 商业 SaaS、代托管、嵌入式多租户或代管终端用户第三方凭据时，应直接咨询 n8n 官方。本文不是法律意见。

Community 可以使用 Queue mode，但不代表所有生产治理能力都免费。Multi-main、SSO、Projects、External secrets、外部二进制存储、Log streaming、Git environments 等存在计划边界；权益会变化，上线前要重新核对官方定价和功能对比页。

本仓库写作时，本机 Docker 客户端可用，但 Docker Desktop 的 Linux Engine 未运行。因此本文提供的 Compose 已做静态解析验证，工作流步骤依据稳定版官方文档设计；本文**不声称本机已成功启动 n8n 容器或点击完成 UI 实验**。读者按实验执行时，应保存自己的真实输出与截图。

## 官方资料

- [n8n 官方文档](https://docs.n8n.io/)
- [n8n 2.33.5 Release](https://github.com/n8n-io/n8n/releases/tag/n8n%402.33.5)
- [n8n 2.34.2 Pre-release](https://github.com/n8n-io/n8n/releases/tag/n8n%402.34.2)
- [Docker 安装](https://docs.n8n.io/deploy/host-n8n/install-options/install-with-docker/)
- [Community 与付费功能边界](https://docs.n8n.io/deploy/host-n8n/community-edition-features/)
- [Sustainable Use License](https://docs.n8n.io/privacy-and-security/sustainable-use-license/)
- [Queue mode](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/enable-queue-mode/)
- [Task Runner](https://docs.n8n.io/deploy/host-n8n/configure-n8n/set-up-task-runners/)
- [Execution 并发控制](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/control-concurrency/)
- [错误处理](https://docs.n8n.io/build/flow-logic/handle-errors-gracefully/)
- [健康检查与监控](https://docs.n8n.io/deploy/host-n8n/keep-n8n-running/monitor-n8n/)
- [Prometheus 指标](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/configuration-examples/enable-prometheus-metrics/)
- [安全审计](https://docs.n8n.io/deploy/host-n8n/configure-n8n/security/run-security-audits/)
- [CLI、导入与导出](https://docs.n8n.io/deploy/host-n8n/configure-n8n/use-the-command-line/)

阅读顺序建议：先看本文并完成实验，再用官方 Node 文档核对字段；准备生产时，再逐页阅读 Queue、Runner、安全、监控和升级文档。不要只收藏一张工作流截图。

## 官方知识地图

```text
n8n
├─ Build：在画布上构建
│  ├─ Workflow / Node / Connection
│  ├─ Trigger / Webhook / Schedule
│  ├─ Item / JSON / Binary data
│  ├─ Expression / Data mapping / Item linking
│  └─ Sub-workflow / Wait / Error Workflow
├─ Run：一次执行如何发生
│  ├─ Execution status / Retry / Timeout
│  ├─ Regular mode / Concurrency limit
│  ├─ Queue mode / Redis / Worker
│  └─ Code node / Task Broker / Task Runner
├─ Store：状态放在哪里
│  ├─ SQLite（入门默认）
│  ├─ PostgreSQL（生产共享状态）
│  ├─ Encryption key / Credentials
│  └─ Binary data / Retention / Pruning
├─ Operate：如何长期运行
│  ├─ Health / Readiness / Metrics / Logs
│  ├─ HA / Capacity / Backup / Recovery
│  ├─ Security / RBAC / SSO / Audit
│  └─ Upgrade / Migration / Rollback
└─ AIOps：如何形成闭环
   ├─ Metrics / Logs / Traces / Alerts
   ├─ Enrichment / Dedupe / RCA hypothesis
   ├─ Approval / Runbook / Automation
   └─ Verification / Ticket / Knowledge base
```

这里的英文第一次出现时要理解含义：Workflow 是工作流，Node 是处理步骤，Trigger 是触发入口，Execution 是某次运行记录，Credential 是加密保存的连接凭据，Runner 是隔离执行代码任务的进程。

## 建议学习路线

### 第一天：会搭、会跑、会看结果

1. 固定 `2.33.5` 启动本地环境。
2. 用 Manual Trigger、Edit Fields、If 理解节点和 Item。
3. 用 Webhook Test URL 接收一条告警 JSON。
4. 在 Executions 页面找到输入、每个节点输出和最终状态。

### 第一周：懂机制、会定位失败

1. 掌握 Expression、Item linking、Credential 与发布版本。
2. 分清手工执行、测试 Webhook 和生产 Webhook。
3. 配置 Error Workflow，做一次可回收故障注入。
4. 理解 SQLite/PostgreSQL、execution pruning 与 encryption key。

### 生产与面试层：能设计、能收敛风险

1. 画出 Queue mode 的 main、Redis、worker、PostgreSQL 数据路径。
2. 为 Code node 设计 external Task Runner 隔离。
3. 建立业务幂等、重试预算、审批、审计和回滚。
4. 用到达率、执行时间、并发和数据库连接估算容量。
5. 设计 HA、备份恢复、升级灰度和事故响应。

## 场景开场：告警已收到，为什么还是重复重启了三次

某电商的结算接口 5xx 升高，Alertmanager 连续发送三条相同告警。值班同学做了一条自动化：收到告警就调用脚本重启服务，再向群里发消息。

结果是：

- 三条告警触发了三次重启；
- 第一次已经恢复，后两次又把健康实例打断；
- 群消息显示“执行成功”，但没有验证 5xx 是否恢复；
- 没有审批、幂等键、影响范围或回滚记录；
- 事后只看到绿色节点，没人能回答哪次执行改了什么。

n8n 能把告警、CMDB、日志查询、工单、审批和 Runbook 串成流程，但它不会自动替你补上生产工程。真正可靠的链路应该是：

```text
告警事件
  -> 验签与规范化
  -> fingerprint 去重
  -> 补充指标/日志/Trace/变更证据
  -> 形成故障假设
  -> 风险分级
  -> 低风险自动 / 高风险审批
  -> 调用可回滚 Runbook
  -> 验证业务指标
  -> 更新工单、审计和知识库
```

这就是学习 n8n 的主线：不是“会拖节点”，而是“能把一次跨系统运维动作做成受控、可观察、可恢复的闭环”。

## 一句话人话版

> n8n 是一个工作流自动化平台：它接收事件或定时触发，把数据按节点流转，调用不同系统，并保存每次执行的状态和证据。

## 小白最容易问的十二个问题

### n8n 是大模型吗

不是。n8n 可以调用大模型、向量库和 Agent 节点，但它本身首先是工作流编排与自动化平台。

### 可视化编排是不是不用写代码

简单字段映射可以少写代码，但生产工作仍需要理解 JSON、HTTP、认证、数据库、错误语义和幂等。Code node 只是补充，不应成为所有逻辑的黑箱。

### n8n 和 cron 有什么区别

cron 主要按时间启动命令；n8n 还提供事件触发、跨系统节点、数据映射、分支、暂停、凭据、执行记录和错误工作流。

### n8n 和 Ansible 有什么区别

n8n 擅长跨系统事件编排和流程控制；Ansible 擅长以声明式、幂等方式配置主机和执行基础设施任务。常见做法是 n8n 负责审批与编排，Ansible/AWX 负责受控变更。

### n8n 和 Jenkins 或 GitHub Actions 有什么区别

Jenkins/GitHub Actions 以代码构建、测试和交付流水线为强项；n8n 更适合 Webhook、SaaS、工单、通知、审批和业务 API 的事件流程。边界可以重叠，选型看触发模型、治理与团队能力。

### n8n 和 Dify 有什么区别

Dify 以模型、知识库、Prompt、Agent 和 AI 应用发布为主；n8n 以通用系统集成和工作流自动化为主。AIOps 中可以让 Dify 生成建议，让 n8n 执行受控编排。

### 自托管 Community 就是完全开源、什么都能商用吗

不是。它是 source-available/fair-code，受 Sustainable Use License 约束；内部使用与把平台托管后收费是两种不同场景。

### Workflow 和 Execution 是一回事吗

不是。Workflow 是流程定义，Execution 是这套定义的一次实际运行。一个 Workflow 可以有成千上万条 Execution。

### Webhook Test URL 和 Production URL 为什么不同

测试 URL 只在你点击 **Listen for test event** 后临时注册，便于在编辑器看数据；生产 URL 需要保存并发布 Workflow，运行数据在 Executions 中查看。

### Redis 里是不是保存了完整工作流和最终结果

Queue mode 中 Redis 主要传 execution ID 和队列通知；PostgreSQL 才是工作流、凭据密文、执行状态和结果的共享持久状态中心。

### 多开 worker 就高可用了吗

没有。多 worker 解决执行数据面的吞吐和部分故障，但单 main、单 PostgreSQL、单 Redis 仍可能是单点。Multi-main 还是付费能力。

### Workflow 显示 success 就代表业务恢复了吗

不代表。success 只能说明节点没有以错误结束；必须再查业务 SLI、告警状态、工单结果和外部系统实际状态。

## 为什么 AIOps 学习者要学 n8n

### 它把“发现问题”和“采取动作”连起来

Prometheus、Zabbix、日志和 Trace 能产生证据，但不能自动完成所有跨系统协作。n8n 可以接收告警，查询 CMDB，创建工单，拉取诊断信息，申请审批，再调用 Runbook。

### 它让自动化过程可见

节点、分支和 Execution 让数据经过了什么步骤更容易观察。可见不等于天然正确，但比散落在个人机器上的脚本更容易复盘和交接。

### 它适合做“胶水层”

AIOps 很少只依赖一个产品。监控、日志、云平台、IM、工单、知识库、LLM 和自动化工具之间都需要 API 与字段映射，n8n 的长处正是连接这些系统。

### 它迫使你面对生产边界

一旦流程会发消息、建工单、重启服务或修改资源，你就必须讨论重试、幂等、权限、审批、审计、容量与回滚。这些也是平台、SRE、DevOps 和 AIOps 面试的核心。

## n8n 到底是什么

n8n 是一个可视化工作流自动化平台。用户在画布上连接节点形成 Workflow；Trigger 接收事件，后续节点转换 Item、调用外部 API 或执行逻辑；平台为每次运行创建 Execution，并在数据库中保存定义、凭据密文和执行数据。

它不是：

- 高频指标或日志存储引擎；
- 大规模流处理系统；
- 配置管理工具的完整替代品；
- 模型训练平台；
- 自带 exactly-once 业务语义的事务协调器；
- 不需要安全治理的“无代码捷径”。

## 它解决什么问题

### 跨系统 API 胶水重复

没有编排平台时，每条链路都要自己写认证、字段转换、重试、分支、通知和运行记录。n8n 把常用能力放进节点和工作流。

### 事件进入后无人接力

告警、表单、Webhook、消息和定时任务都可以成为 Trigger，让流程从“有人看到后手工操作”变成“自动收集上下文并进入受控决策”。

### 自动化缺少执行证据

Execution 保存输入、节点输出、耗时、状态和错误。结合外部审计与工单，可以回答“谁、何时、基于什么证据、执行了什么、结果如何”。

### 复杂流程散落在脚本和聊天记录里

分支、等待、子工作流和 Error Workflow 能把流程结构显式表达，但仍应配合版本管理、评审和环境隔离。

## 核心概念一：Workflow、Node、Connection 与 Item

### 是什么

- **Workflow**：整条自动化流程的定义。
- **Node**：流程中的一个触发、转换、查询或动作步骤。
- **Connection**：节点之间的数据流向。
- **Item**：节点处理的一个数据单元，通常包含 `json`，也可能包含 `binary`。

### 为什么需要

如果所有逻辑都放在一个大脚本里，字段、失败位置和责任边界很难观察。拆成节点后，可以分别检查输入、输出、耗时和错误。

### 怎么工作

Trigger 产生一个或多个 Item；节点接收输入 Item，返回零个、一个或多个 Item；Connection 决定这些输出接下来进入哪个节点。If、Switch 等节点根据条件把 Item 送到不同分支。

```text
Webhook
  -> Item 1: {service, severity, fingerprint}
  -> Edit Fields
  -> If
      ├─ critical -> 审批分支
      └─ other    -> 观察分支
```

### 怎么用或观察

在编辑器执行节点后，点击节点查看 Input 和 Output。先确认 Item 数量，再确认 `json` 字段和类型；附件则检查 binary 属性。不要只看画布上的绿色对勾。

### 坏了怎么查

1. 找到第一个输出与预期不一致的节点。
2. 比较 Input/Output 的 Item 数量和字段类型。
3. 检查上游是否返回空数组、嵌套 `body` 或 binary。
4. 检查分支条件是否把字符串 `"true"` 当成布尔值 `true`。
5. 若数据来自更早节点，检查 Item linking 是否还能关联原始 Item。

## 核心概念二：Trigger、Webhook、测试与发布

### 是什么

Trigger 是工作流入口。常见入口包括 Manual Trigger、Schedule Trigger、Webhook，以及第三方系统的事件 Trigger。

### 为什么需要

运维流程可能由人点击、时间计划、告警事件或工单状态变化启动。入口语义不同，可靠性、认证和重复事件风险也不同。

### 怎么工作

Webhook 节点提供两类 URL：

- Test URL：点击 **Listen for test event** 后临时注册，官方文档说明有效窗口为 120 秒。
- Production URL：保存并发布 Workflow 后注册，外部请求会创建生产 Execution。

Webhook 可选择立即响应、最后节点结束后响应，或由 Respond to Webhook 节点控制响应。HTTP 连接是否成功与后续业务是否最终成功必须分开设计。

### 怎么用或观察

开发时使用 `/webhook-test/...`，在编辑器检查输入；发布后使用 `/webhook/...`，到 Executions 页面检查运行记录。为生产 Webhook 配认证、签名、IP 限制、重放保护和请求大小限制。

### 坏了怎么查

1. 404：测试监听是否已过期，生产 Workflow 是否已发布，路径是否正确。
2. 401/403：Credential、Header/JWT、代理是否透传认证信息。
3. 502/504：反向代理超时、n8n readiness、队列和下游耗时。
4. 收到请求但没有执行：检查 LB 是否把 `/webhook/*` 路由到正确进程。
5. 重复执行：检查上游重试、网络超时和业务幂等键，不能靠删除 Execution 解决。

## 核心概念三：Expression、Data Mapping 与 Item Linking

### 是什么

Expression（表达式）从当前或之前节点读取字段并计算值；Data Mapping（数据映射）把一个系统的结构转换成下一个系统需要的结构；Item Linking 记录输出 Item 来自哪个输入 Item。

### 为什么需要

Alertmanager、CMDB、工单和 IM 的字段名不同。没有映射，就会把 `severity`、`priority`、`level` 混在一起；没有 Item 关联，多条告警合并或拆分后可能拿错上下文。

### 怎么工作

常见表达式包括：

```text
{{ $json.body.alertId }}
{{ $json.severity }}
{{ $json.alertId + ':create-ticket' }}
{{ $('Query CMDB').item.json.owner }}
```

`$json` 通常表示当前 Item 的 JSON。通过节点名读取更早节点时，n8n 会利用 Item linking 找到对应来源；自定义 Code node 若随意重排或新建 Item，需要保留关联信息。

### 怎么用或观察

在字段中切换到 Expression，使用数据面板拖入值；先用 Pin/Mock data 固定样例，再观察表达式预览。对关键映射建立明确契约，例如 `alertId` 必须是非空字符串，`severity` 只能是枚举值。

### 坏了怎么查

1. 先看实际输入结构，不凭记忆写路径。
2. 检查字段是否在 `$json.body` 而不是 `$json` 根层。
3. 检查节点改名后表达式中的节点名是否同步。
4. 检查数组、对象、字符串和数字类型。
5. 出现 “paired item data unavailable” 一类错误时，检查合并、拆分或 Code node 是否破坏 Item linking。

## 核心概念四：Execution、状态、Wait、Retry 与 Error Workflow

### 是什么

Execution 是 Workflow 的一次运行实例。稳定版源码定义的状态包括：

```text
canceled, crashed, error, new, running, success, unknown, waiting
```

Error Workflow 是以 Error Trigger 开始、专门接收失败上下文的工作流；Wait 节点可以让执行进入等待并把状态持久化。

### 为什么需要

生产自动化不是一次函数调用。它可能等待审批、超时、崩溃、重试或重启后恢复。只有把运行状态显式保存，才能观察和处置。

### 怎么工作

执行开始后依次记录节点输入、输出、时间和状态。Wait 暂停时会把 execution data 卸载到数据库，满足恢复条件后继续。失败 Execution 可以使用原 Workflow 或当前已保存 Workflow 配合旧输入重跑。主 Workflow 还可关联一个 Error Workflow 发送告警或登记事件。

### 怎么用或观察

在 Executions 页面按 Workflow、状态和时间筛选，打开失败记录找到第一个报错节点。给 Execution 关联业务 ID，如告警 fingerprint、工单号或变更号，才能把平台状态和业务状态连起来。

### 坏了怎么查

1. `error`：看具体节点错误、HTTP 状态和输入。
2. `crashed`：看进程重启、内存、数据库和启动恢复日志。
3. `waiting` 长期不恢复：检查 Wait 条件、回调 URL、时间和数据库状态。
4. Error Workflow 未触发：确认它以 Error Trigger 开始、已保存，并已在主 Workflow Settings 中选择；使用生产触发验证，不把未保存或手工停止当成执行失败。
5. Retry 产生重复副作用：立即停止自动重试，按业务幂等键审计外部系统。

## 核心概念五：Credential 与 Encryption Key

### 是什么

Credential 是节点访问外部系统所用的 API Key、密码、OAuth Token 等连接凭据。n8n 在凭据写入数据库前，使用实例 encryption key（加密密钥）进行加密。

### 为什么需要

如果每个节点都直接保存明文密码，导出 Workflow、查看执行数据或共享截图时很容易泄密。Credential 把连接配置与 Workflow 定义分开，encryption key 保护数据库中的密文。

### 怎么工作

首次启动时，n8n 会生成随机 key 并写入 `~/.n8n`。也可以显式设置 `N8N_ENCRYPTION_KEY`。Queue mode 的 main、worker 和 webhook processor 必须使用同一个 key，否则进程能读到数据库，却无法解密凭据。

数据库备份与 key 是两样东西：

```text
PostgreSQL 备份 + 丢失 encryption key
  -> workflow 定义可能还在
  -> credential 密文也还在
  -> 但无法正常解密使用
```

### 怎么用或观察

在 Credential 页面创建连接，让节点引用 Credential，不要把 Secret 填进普通字段或 Expression。将 `N8N_ENCRYPTION_KEY` 放到 Secret Manager、Kubernetes Secret 或受 ACL 保护且不提交 Git 的 `.env`。

### 坏了怎么查

1. 升级或扩容后全部凭据失败：比较每个进程的 key 来源与 Secret 挂载。
2. 只有某个 worker 失败：检查该 worker 是否拿到同一 key。
3. OAuth 失效：区分 token 过期、redirect URL 变化和解密失败。
4. 恢复后 Credential 无法使用：核对备份时间、实例 key 和数据库是否属于同一套环境。
5. 不要用 `export:credentials --decrypted` 当普通排障手段；它会产生高风险明文文件。

## 核心概念六：Code Node、Task Broker 与 Task Runner

### 是什么

Code node 运行用户编写的 JavaScript 或 Python 逻辑。Task Broker 是 n8n main/worker 内部的任务协调端；Task Runner 是实际执行代码任务的进程。

### 为什么需要

用户代码可能死循环、占满内存、读取文件或访问不该访问的网络。把代码直接放在核心进程里运行，会把工作流风险扩大为平台风险。

### 怎么工作

```text
Code node（Task Requester）
  -> Task Broker
  -> WebSocket + shared auth token
  -> Task Runner
  -> 返回结果，Workflow 继续
```

internal mode 由 n8n 拉起子进程，与 n8n 使用相同 UID/GID，官方不建议生产使用。external mode 使用独立 `n8nio/runners` sidecar；Queue mode 下通常每个 worker 都配一个同版本 Runner sidecar。

### 怎么用或观察

本地学习可以先理解内置 Code node；生产使用 external mode，并保证 `n8nio/n8n` 与 `n8nio/runners` 版本一致、共享安全随机的 `N8N_RUNNERS_AUTH_TOKEN`。观察 Runner heartbeat、任务等待、超时、内存与重启。

### 坏了怎么查

1. 只有 Code node 卡住：先查 Runner，而不是先查整个队列。
2. `task request timeout`：检查 Broker 地址、5679 端口、token 和网络策略。
3. 升级后 Runner 断连：检查 n8n 与 runners 镜像是否同版本。
4. OOM：检查输入 Item、binary data、用户代码与 Runner memory limit。
5. 不要为了恢复而开启 `N8N_RUNNERS_INSECURE_MODE=true`；先修认证和证书链路。

## 核心概念七：Regular Mode 与 Queue Mode

### 是什么

Regular mode 由一个 n8n 进程接收并执行工作流；Queue mode 将入口/编排与实际执行拆开，由 main 把 execution ID 放入 Redis，worker 消费并执行。

### 为什么需要

单进程适合学习和低流量，但大量 Webhook、慢 API、Code node 或 AI 调用会争抢同一 event loop 和内存。Queue mode 允许增加 worker 扩展执行吞吐。

### 怎么工作

Queue mode 的关键路径是：

```text
main / webhook processor
  -> PostgreSQL 创建 execution
  -> Redis 入队 execution ID
  -> worker 取 ID
  -> PostgreSQL 读取 workflow 与 execution data
  -> worker 执行节点
  -> PostgreSQL 写结果
  -> Redis 通知 main 完成
```

Redis 是调度通道，PostgreSQL 是共享持久状态中心。Queue mode 不支持用多个进程共享 SQLite；本地 filesystem binary mode 也不适合分布式 worker。

### 怎么用或观察

学习环境先用 Regular mode。生产需要扩展时设置 `EXECUTIONS_MODE=queue`，使用 PostgreSQL 和 Redis，运行 `n8n worker --concurrency=<n>`，并观察 waiting、active、completed、failed、执行耗时、数据库连接和 Redis 内存。

### 坏了怎么查

1. waiting 增长、active 为零：worker、Redis、worker readiness。
2. active 很高但 completed 不涨：慢节点、Runner、下游限流、DB 写入。
3. main 正常而生产 Webhook 5xx：webhook processor 和 LB 路由。
4. worker 增加后 DB pool 耗尽：降低并发，修连接池和慢查询；不是继续扩 worker。
5. 多 worker 仍无法消除控制面单点：这是 Multi-main/数据库/Redis HA 问题，不是 worker 数量问题。

## 核心概念八：重试、幂等、审批与受控执行

### 是什么

重试是在失败后再次尝试；幂等是同一个业务请求执行多次仍只产生一次期望副作用；审批是在高风险动作前由授权主体确认；受控执行还包括影响面、维护窗口、验证和回滚。

### 为什么需要

Webhook 调用方会重试，Queue 可能重新处理 stalled job，人工也会点击 Retry。第一次调用若已创建工单但响应丢失，第二次调用可能创建重复工单。平台重试不能替代业务幂等。

### 怎么工作

一个常见幂等键可以是：

```text
alert fingerprint + action type + time window
```

执行副作用前，到外部数据库用唯一约束 claim 这个 key；已存在则读取旧结果，不再执行；成功后保存外部资源 ID。高风险动作再增加审批、影响范围检查、回滚 token 与验证查询。

### 怎么用或观察

在 Item 中始终携带 `eventId`/`fingerprint`、`workflowId`、`executionId`、`changeId` 和 `idempotencyKey`。监控重复工单数、重复变更数、审批积压和回滚率，而不只看 Execution success rate。

### 坏了怎么查

1. 立即暂停有副作用的自动重试。
2. 按业务 key 查询下游系统，而不是只按 execution ID。
3. 区分“请求没到下游”“下游已成功但响应丢失”“下游明确失败”。
4. 修复后先以只读或 dry-run 验证，再逐步放量。
5. 对已重复的工单、通知或变更做补偿，并记录爆炸半径。

## 架构与内部数据流

## 最小学习架构

```text
Browser / Manual Trigger / Webhook
              |
              v
       一个 n8n 进程
       ├─ Editor 与 API
       ├─ Trigger 与 Scheduler
       ├─ Workflow execution
       └─ internal Task Runner（学习环境）
              |
              v
       .n8n volume + SQLite
```

这个架构足够学习节点、表达式、Webhook 和 Execution，但它有单进程、单数据库和本地存储边界，不是生产 HA。

## Regular Mode 的一次 Webhook 路径

```text
调用方 POST /webhook/aiops-alert
  -> 反向代理或本机 5678
  -> Webhook Trigger 匹配 method + path
  -> 创建 Execution
  -> 解析 body/header/query
  -> 节点链逐步处理 Item
  -> Respond to Webhook 生成 HTTP 响应
  -> 保存状态与执行数据
```

需要同时观察两个结果：调用方拿到的 HTTP 状态，以及 Execution/业务系统的最终状态。若选择“立即响应”，HTTP 2xx 只表示工作流已被接受，不表示后续节点成功。

## Queue Mode 的生产数据路径

```text
                 ┌──────────── Editor / API ────────────┐
Client -> LB/WAF ┼-> main(s)                             |
                 └-> webhook processor(s) -> Redis queue|
                                                |       |
                          ┌─────────────────────┘       |
                          v                             |
                    worker pool                        |
                    ├─ normal nodes                    |
                    └─ Task Broker -> Runner sidecar   |
                          |                             |
                          v                             |
                    PostgreSQL <───────────────────────┘
                    workflow / credential / execution
```

生产路由建议：

- `/webhook/*` 与 `/webhook-waiting/*` 进入 webhook processor 池。
- `/webhook-test/*` 仍进入 main，供编辑器调试。
- 不把 main 放进生产 Webhook 负载池，避免突发流量拖慢 Editor 和内部 API。
- 可用 `N8N_DISABLE_PRODUCTION_MAIN_PROCESS=true` 禁止 main 处理生产 Webhook。

## Task Runner 数据路径

Queue mode 中，每个 worker 的 Code node 应尽量只把任务交给它旁边的 Runner：

```text
worker-a -> runner-a
worker-b -> runner-b
worker-c -> runner-c
```

不要让所有 worker 依赖一个没有容量与 HA 的共享 Runner。Runner 镜像版本、token、CPU/内存限制、只读根文件系统、非 root 用户和网络范围都属于生产设计。

## 定时任务与 Multi-main

增加 worker 不会让 main 高可用。Self-hosted Enterprise 的 Multi-main 使用 leader/follower：leader 承担需要 at-most-once 的任务，leader 失联后 follower 接管。所有 main、worker 必须同版本并连接同一 PostgreSQL/Redis，负载均衡器还需要 sticky sessions。

即使使用 Multi-main，也不能宣称绝对 exactly-once。leader 切换、第三方持久连接和外部副作用仍需业务幂等与补偿。

## 状态、一致性与恢复模型

| 状态对象 | 权威位置 | 常见误区 | 恢复要点 |
| --- | --- | --- | --- |
| Workflow 定义 | SQLite 或 PostgreSQL | 以为 Redis 保存完整流程 | 数据库备份、版本与发布状态 |
| Credential 密文 | 数据库 | 只备份 DB 就够 | 同时保管正确的 encryption key |
| Execution 状态/结果 | 数据库 | `/healthz=200` 就能读写 | readiness、迁移、连接池、磁盘 |
| Queue job/通知 | Redis | 把 Redis 当最终事实库 | Redis 可用性、内存、stalled 与重放 |
| Binary data | memory/database/filesystem/S3，取决于模式 | 本地文件可被任意 worker 读取 | 分布式共享存储、生命周期、pruning |
| Wait 状态 | 数据库中的 execution data | 重启会自动从内存恢复 | DB 可恢复、回调/时间条件仍有效 |

n8n 能保存运行状态，但不为所有外部系统提供分布式事务。一次 Execution 中“Jira 工单创建成功、写回 n8n 前进程崩溃”仍可能在重试时重复创建。生产答案必须包含外部业务幂等。

## n8n 与相邻技术怎么选

| 工具 | 更擅长 | 不应勉强承担 | 与 n8n 的组合 |
| --- | --- | --- | --- |
| cron/systemd timer | 单机定时命令 | 跨系统审批与复杂状态 | cron 触发本地任务，n8n 管跨系统流程 |
| Ansible/AWX | 主机和配置变更、幂等任务 | 通用 SaaS 事件胶水 | n8n 审批编排，AWX 执行 Runbook |
| Jenkins | 构建、测试、存量发布流水线 | 高频业务 Webhook 集成 | Jenkins 交付，n8n 通知/工单/变更协作 |
| GitHub Actions | 仓库事件和云端 CI/CD | 内网长期状态编排 | Actions 构建，n8n 接发布事件做治理 |
| Dify | 模型、知识库、AI App/Agent | 通用基础设施事务编排 | Dify 给建议，n8n 做受控工具链 |
| Kafka/Flink | 高频事件流与有状态流计算 | 人工审批和低频 SaaS 编排 | 流平台聚合，n8n 消费关键事件 |
| 自研服务 | 强类型、高性能、专用协议 | 低成本试验和大量现成集成 | 核心事务自研，n8n 做外围编排 |

选型时问四个问题：吞吐和延迟是多少、是否有不可逆副作用、状态/一致性要求是什么、团队能否长期治理。不要因为“画布好看”就把所有系统迁入 n8n。

## 安装与启动

## 前置条件

准备：

- Docker Desktop 或 Docker Engine；
- Docker Compose v2；
- 本机端口 `5678` 未占用；
- 至少为实验预留 2 GiB 内存和可持久化磁盘；
- 一个不放进当前仓库的独立实验目录。

检查：

```powershell
docker version
docker compose version
Get-NetTCPConnection -LocalPort 5678 -ErrorAction SilentlyContinue
```

`docker version` 必须同时看到 Client 和 Server。只有 Client 而 Server 报连接失败，说明 Docker Engine 没启动，不能继续声称容器实验成功。

## 生成 Encryption Key

在实验目录中运行：

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToHexString($bytes).ToLowerInvariant()
```

把输出填入 `.env`：

```dotenv
N8N_ENCRYPTION_KEY=替换为刚才生成的随机字符串
```

不要把 `.env`、截图中的密钥或 decrypted credential export 提交到 GitHub。

## 固定版本 Compose

创建 `compose.yaml`：

```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:2.33.5
    restart: unless-stopped
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      TZ: Asia/Shanghai
      GENERIC_TIMEZONE: Asia/Shanghai
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: "true"
      N8N_METRICS: "true"
      EXECUTIONS_DATA_PRUNE: "true"
      EXECUTIONS_DATA_MAX_AGE: "168"
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

这个学习配置的设计理由：

- 数字版本保证可重复，不被 `latest` 悄悄升级。
- `127.0.0.1` 避免把无 TLS 的编辑器暴露到局域网或公网。
- named volume 保存 SQLite、实例 key 和其他 `.n8n` 资产。
- 显式保留七天执行数据，便于学习又避免无限增长。
- `/metrics` 只在本机实验开放；生产必须限制 Prometheus 来源。
- 2.x 不再需要已经 deprecated 的 `N8N_RUNNERS_ENABLED=true`。

## 启动与验证

```powershell
docker compose config
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail 100 n8n
```

预期：

- `docker compose config` 展开成功且 key 非空；
- n8n 容器处于 running；
- 日志没有 SQLite 权限、端口或 key 错误；
- 浏览器可以打开 `http://127.0.0.1:5678`。

验证三个端点：

```powershell
(Invoke-WebRequest 'http://127.0.0.1:5678/healthz' -UseBasicParsing).StatusCode
(Invoke-WebRequest 'http://127.0.0.1:5678/healthz/readiness' -UseBasicParsing).StatusCode
(Invoke-WebRequest 'http://127.0.0.1:5678/metrics' -UseBasicParsing).StatusCode
```

预期都是 `200`，但含义不同：

- `/healthz`：进程可访问；不检查数据库。
- `/healthz/readiness`：数据库已连接且迁移完成。
- `/metrics`：Prometheus 文本端点已启用；不证明业务 Workflow 正常。

首次打开页面时创建本地 Owner。生产环境还需要 HTTPS、反向代理、邮件、身份体系、网络隔离和备份，不能照搬这个本地配置。

## 配置字段字典

| 配置 | 用途 | 常用值/语义 | 预期结果 | 常见坑 |
| --- | --- | --- | --- | --- |
| `N8N_ENCRYPTION_KEY` | 加密 Credential | 安全随机字符串，所有进程一致 | 数据库密文可正常解密 | 丢 key、各 worker 不一致、提交 Git |
| `TZ` | 进程时区 | `Asia/Shanghai` | 日志时间符合预期 | 只改 UI、不改进程 |
| `GENERIC_TIMEZONE` | Schedule 节点时区 | `Asia/Shanghai` | 定时任务按目标时区触发 | 容器 UTC 导致错时 |
| `N8N_METRICS` | 开启 `/metrics` | `true` | Prometheus 可抓取 | 暴露公网泄露运行信息 |
| `EXECUTIONS_DATA_PRUNE` | 清理旧 Execution | 默认开启，建议显式配置 | 数据库不无限增长 | 误以为立即释放 SQLite 文件大小 |
| `EXECUTIONS_DATA_MAX_AGE` | 按小时保留完成记录 | `168` 表示 7 天 | 超龄记录进入清理 | 过短导致事故证据丢失 |
| `EXECUTIONS_DATA_PRUNE_MAX_COUNT` | 按数量限制完成记录 | 如 `50000` | 超量从旧到新清理 | `0` 表示无限，不是零条 |
| `N8N_CONCURRENCY_PRODUCTION_LIMIT` | Regular/Queue 生产并发上限 | 如 `20`；语义随模式核对 | 超限任务排队 | 不限制 manual/sub-workflow 等所有类型 |
| `EXECUTIONS_MODE` | 执行模式 | `regular` 或 `queue` | Queue mode 将任务交 worker | 配 queue 却继续用 SQLite |
| `DB_TYPE` | 数据库类型 | 生产常用 `postgresdb` | 多实例共享状态 | 只切类型没迁移/恢复数据 |
| `QUEUE_BULL_REDIS_HOST` | Redis 地址 | 服务名或内网 DNS | main/worker 共享队列 | Redis 暴露公网或无认证 |
| `QUEUE_HEALTH_CHECK_ACTIVE` | 开 worker 健康端点 | `true` | worker 提供 health/readiness | 把 health 当下游业务健康 |
| `N8N_DISABLE_PRODUCTION_MAIN_PROCESS` | main 不接生产 Webhook | `true` | 入口交给 processor | LB 仍把 `/webhook/*` 发 main |
| `N8N_RUNNERS_MODE` | Runner 模式 | 生产用 `external` | Code 任务交 sidecar | internal mode 当生产隔离 |
| `N8N_RUNNERS_AUTH_TOKEN` | Broker/Runner 认证 | 安全随机共享 token | Runner 能连接 Broker | 明文入 Git、版本间 token 不一致 |

字段不是越多越好。任何变量变更都要记录版本、默认值、影响组件、验证指标和回滚值。

## Queue Mode 最小生产概念配置

下面只是帮助理解组件关系，不是可以直接上线的完整清单：

```yaml
x-n8n-common: &n8n-common
  image: docker.n8n.io/n8nio/n8n:2.33.5
  environment:
    EXECUTIONS_MODE: queue
    DB_TYPE: postgresdb
    DB_POSTGRESDB_HOST: postgres
    QUEUE_BULL_REDIS_HOST: redis
    N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
    N8N_METRICS: "true"

services:
  main:
    <<: *n8n-common

  worker:
    <<: *n8n-common
    command: worker --concurrency=10
```

正式生产还要补 PostgreSQL/Redis 认证与 TLS、health/readiness、资源限制、external Runner、反向代理、Webhook processor、备份、NetworkPolicy、Secret 管理和监控。不要把这个片段当“生产一键部署”。

单 worker 默认 concurrency 为 10；官方建议不要堆大量低于 5 并发的 worker，因为每个进程都占数据库连接。实际值必须通过自己的 Workflow 压测决定。

## 常用命令、页面与 API 字典

| 操作 | 命令或页面 | 目的与预期 | AIOps 场景 | 常见坑 |
| --- | --- | --- | --- | --- |
| 看版本 | `docker compose exec -u node n8n n8n --version` | 输出精确版本 | 事故时间线、升级核对 | 只看镜像 tag 不看运行进程 |
| 看状态 | `docker compose ps` | 查看容器状态 | 快速确认组件存活 | running 不等于 ready |
| 看日志 | `docker compose logs --tail 200 n8n` | 查看启动和执行错误 | 关联 execution ID | 长期开 debug 泄露数据 |
| 看 readiness | `Invoke-WebRequest .../healthz/readiness` | DB 就绪时返回 200 | 探针与发布门禁 | 不检查第三方 API |
| 看指标 | `Invoke-WebRequest .../metrics` | 返回 Prometheus 文本 | 队列/执行告警 | 端点暴露公网 |
| 安全审计 | `docker compose exec -u node n8n n8n audit` | 输出实例风险报告 | 周期安全检查 | 它不是持续审计日志 |
| 导出 Workflow | `n8n export:workflow --backup --output=<dir>` | 保存 Workflow 定义 | 灾备和变更证据 | 导入后默认 inactive，需核验再发布 |
| 导出 Credential | `n8n export:credentials --backup --output=<dir>` | 备份 Credential | 灾备 | 不要随意使用 `--decrypted` |
| 查执行 | **Executions** 页面 | 按状态/Workflow/时间筛选 | 事故定位与重试 | 只看最后一个错误节点 |
| 配错误流程 | Workflow **Settings > Error workflow** | 关联 Error Trigger 工作流 | 失败通知与事件登记 | Error Workflow 自身也要监控 |
| 发布 | Workflow **Publish** | 注册生产 Trigger/Webhook | 生产入口 | 保存草稿不等于发布 |
| Public API | `X-N8N-API-KEY` 请求头 | 调用受支持 API | 平台治理与资产盘点 | API Key 泄露、无最小权限、无分页 |

在 Docker 容器里执行 CLI 时，官方建议使用容器内 `node` 用户。例如：

```powershell
docker exec -u node -it <n8n-container-name> n8n audit
```

命令中的容器名、输出路径和访问权限必须按实际环境替换。任何备份都要做恢复演练，不能以“命令退出码为 0”替代恢复成功。

## n8n 在 AIOps 中的作用

## 场景一：告警接入、补全与路由

```text
Alertmanager / Zabbix / Cloud Monitor
  -> Webhook 验签
  -> 规范化 alertId/service/severity/fingerprint
  -> 查询 CMDB owner、最近变更、Grafana、Logs、Traces
  -> 去重与抑制
  -> critical 进入人工响应，warning 进入观察队列
  -> 创建或更新同一张工单
```

n8n 适合作为跨系统编排层，不适合存储全量高频指标。原始指标留在 Prometheus/TSDB，日志留在日志平台，n8n 只传递事件与必要证据链接。

## 场景二：受控 Runbook 自动化

```text
事件证据
  -> 判断是否满足自动化前提
  -> 查询影响实例数
  -> 生成稳定 idempotency key
  -> 低风险自动 / 高风险审批
  -> 调用 AWX、Rundeck、云 API 或内部 Runbook API
  -> 轮询结果
  -> 验证业务 SLI
  -> 成功关闭事件 / 失败执行回滚并升级人工
```

n8n 负责控制流程，真正的主机配置变更可以交给 Ansible/AWX；不要把几十行 SSH 命令塞进一个不可审计的 Code node。

## 场景三：变更关联与发布观察

GitHub Actions、GitLab CI 或 Jenkins 发布后向 n8n 发送变更事件。n8n 将 commit、服务、环境、负责人和发布时间写入事件平台，并在观察窗口查询错误率、延迟和关键日志。若指标恶化，只生成回滚建议还是自动回滚，取决于风险等级和组织授权。

## 场景四：RCA 助手与知识闭环

n8n 可以从指标、日志、Trace 和变更系统收集证据，再调用 Dify/LLM/RAG 生成“假设和建议”。模型输出必须标成建议，不能直接成为生产事实。受控节点验证假设，人工审批高风险动作，事件结束后把真实根因和有效 Runbook 写回知识库。

## AIOps 数据契约示例

跨系统工作流应先定义事件契约：

```json
{
  "eventId": "alert-20260807-0001",
  "fingerprint": "checkout-api:high-5xx:prod",
  "service": "checkout-api",
  "environment": "prod",
  "severity": "critical",
  "summary": "5xx rate above 5% for 10 minutes",
  "startedAt": "2026-08-07T10:00:00+08:00",
  "evidence": {
    "dashboardUrl": "https://grafana.example/d/checkout",
    "traceUrl": "https://trace.example/abc",
    "recentChangeId": "chg-1024"
  },
  "automation": {
    "risk": "high",
    "approvalRequired": true,
    "idempotencyKey": "checkout-api:high-5xx:prod:create-ticket"
  }
}
```

字段设计重点：

- `eventId`：单次事件 ID，便于关联 Execution。
- `fingerprint`：稳定故障身份，便于合并重复告警。
- `environment`：防止把测试动作发到生产。
- `evidence`：保存证据链接，不把海量原始日志塞进 Execution。
- `risk` 与 `approvalRequired`：把安全决策显式化。
- `idempotencyKey`：约束外部副作用，不能只依赖 execution ID。

## 基础实验：用 Webhook 跑通第一条 AIOps 告警路由

## 实验目标

完成下面的无副作用流程：

```text
POST 告警 JSON
  -> Webhook
  -> Edit Fields 规范化字段
  -> If 判断 severity
  -> 设置 route 与 idempotencyKey
  -> Respond to Webhook 返回结果
```

你将验证 Test URL、Production URL、Item、Expression、分支、发布、Execution 和持久化。

## 实验边界

实验不创建真实工单、不发真实消息、不重启任何服务。它只返回 JSON，因此可以安全重复。本文给出预期结果，但仓库写作环境未启动 Docker Engine，不能替代你的实际执行证据。

## 前置条件

1. 已按“安装与启动”运行固定版 `2.33.5`。
2. 三个端点均返回 `200`。
3. 浏览器已创建本地 Owner 并登录。
4. PowerShell 可以访问 `127.0.0.1:5678`。

## 第一步：创建 Workflow

新建 Workflow，命名：

```text
n8n-lab-alert-router
```

添加 **Webhook** 节点：

| 字段 | 值 | 含义 |
| --- | --- | --- |
| HTTP Method | `POST` | 接收 JSON 告警 |
| Path | `aiops-alert` | 实验固定路径 |
| Authentication | `None` | 仅限 `127.0.0.1` 本地实验；生产必须认证 |
| Respond | `Using 'Respond to Webhook' Node` | 由末端节点返回结构化结果 |

此时节点顶部会显示 Test URL 与 Production URL。不要把两者混用。

## 第二步：规范化字段

添加 **Edit Fields (Set)** 节点，命名 `Normalize Alert`。保留以下字段：

| 输出字段 | Expression | 预期类型 |
| --- | --- | --- |
| `alertId` | `{{ $json.body.alertId }}` | String |
| `service` | `{{ $json.body.service }}` | String |
| `severity` | `{{ $json.body.severity }}` | String |
| `summary` | `{{ $json.body.summary }}` | String |

Webhook 接收到 JSON 后，请求体位于当前 Item 的 `body` 中。先用测试数据观察真实结构，再确认表达式预览有值。

## 第三步：建立风险分支

添加 **If** 节点，命名 `Is Critical`：

```text
Value 1: {{ $json.severity }}
Operation: is equal to
Value 2: critical
```

在 true 分支添加 Edit Fields，命名 `Route Human Review`，增加：

```text
route = human-review
approvalRequired = true
idempotencyKey = {{ $json.alertId + ':create-ticket' }}
```

在 false 分支添加 Edit Fields，命名 `Route Observe`，增加：

```text
route = observe
approvalRequired = false
idempotencyKey = {{ $json.alertId + ':record-event' }}
```

保留上游字段，这样响应仍包含 `alertId`、`service`、`severity` 和 `summary`。

## 第四步：返回结果

添加一个 **Respond to Webhook** 节点：

```text
Respond With: First Incoming Item
Response Code: 200
```

把 true 和 false 两个 Edit Fields 分支都连接到它。一次请求只会进入其中一个分支，因此只响应一次。

## 第五步：使用 Test URL

打开 Webhook 节点，选择 **Test URL**，点击 **Listen for test event**。测试监听约 120 秒，随后在 PowerShell 立即运行：

```powershell
$body = @{
  alertId = 'lab-001'
  service = 'checkout-api'
  severity = 'critical'
  summary = '5xx rate high'
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri 'http://127.0.0.1:5678/webhook-test/aiops-alert' `
  -ContentType 'application/json' `
  -Body $body
```

预期响应包含：

```json
{
  "alertId": "lab-001",
  "service": "checkout-api",
  "severity": "critical",
  "summary": "5xx rate high",
  "route": "human-review",
  "approvalRequired": true,
  "idempotencyKey": "lab-001:create-ticket"
}
```

字段顺序可能不同，不影响语义。若返回额外 Webhook 元数据，检查 `Normalize Alert` 是否设置成只输出目标字段。

## 第六步：验证另一条分支

再次点击 **Listen for test event**，把 `severity` 改为 `warning`：

```powershell
$body = @{
  alertId = 'lab-002'
  service = 'checkout-api'
  severity = 'warning'
  summary = 'latency elevated'
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri 'http://127.0.0.1:5678/webhook-test/aiops-alert' `
  -ContentType 'application/json' `
  -Body $body
```

预期：

```json
{
  "alertId": "lab-002",
  "service": "checkout-api",
  "severity": "warning",
  "summary": "latency elevated",
  "route": "observe",
  "approvalRequired": false,
  "idempotencyKey": "lab-002:record-event"
}
```

## 第七步：发布并验证 Production URL

1. 保存 Workflow。
2. 点击 **Publish**。
3. 回到 Webhook 节点，复制 Production URL。
4. 把请求地址改成：

```text
http://127.0.0.1:5678/webhook/aiops-alert
```

5. 再发送 `lab-001`。

生产请求不会像测试请求那样把 Item 实时显示在编辑器画布中。打开 Workflow 的 **Executions** 页面，找到这次运行并核对：

- 状态为 `success`；
- Webhook 输入 body 正确；
- `Is Critical` 进入 true 分支；
- 最终输出包含稳定的 `idempotencyKey`；
- HTTP 响应与最终 Item 一致。

## 第八步：验证持久化

```powershell
docker compose restart n8n
```

等待 readiness 恢复为 `200`，重新登录。预期：

- `n8n-lab-alert-router` 仍存在；
- Workflow 发布状态仍可核对；
- 历史 Execution 仍在保留期内；
- Production URL 再次调用成功。

这证明 named volume 保存了实验状态，但不等于已经验证生产数据库灾备。

## 基础实验的验证清单

- [ ] `docker compose config` 成功。
- [ ] `/healthz`、`/healthz/readiness`、`/metrics` 都返回 200。
- [ ] critical 和 warning 分别进入正确分支。
- [ ] Test URL 只在监听窗口内使用。
- [ ] Production URL 需要 Publish 后使用。
- [ ] Executions 中能找到业务 `alertId`。
- [ ] 重启后 Workflow 与 Execution 仍可查看。
- [ ] 没有把 `.env` 或密钥提交 Git。

## 如果基础实验没有成功，先查这些

### 页面打不开

```powershell
docker compose ps -a
docker compose logs --tail 200 n8n
Get-NetTCPConnection -LocalPort 5678 -ErrorAction SilentlyContinue
```

确认 Docker Engine、容器退出码、端口占用和 `.env`。不要一上来删除 volume。

### Test URL 返回 404

确认刚点击 **Listen for test event**，测试监听没有超过 120 秒，URL 中是 `/webhook-test/`，Path 拼写为 `aiops-alert`。

### Production URL 返回 404

确认 Workflow 已保存并 Publish，使用 `/webhook/` 而不是 `/webhook-test/`，且没有其他 Webhook 占用相同 method + path。

### Expression 返回 undefined

打开 Webhook 的 Output，看请求字段是否在 `body` 中。确认客户端发送了 `Content-Type: application/json`，字段大小写与表达式一致。

### critical 进入 false 分支

检查实际值是否为 `Critical`、`critical ` 或其他类型。生产前应增加标准化与枚举校验，不要默默接受未知严重度。

### HTTP 200 但 Executions 没有预期结果

确认响应模式、请求使用的环境和 Workflow ID。HTTP 层成功不等于你查看的是同一次 Execution；用 `alertId` 关联。

## 基础实验清理

停止容器但保留学习数据：

```powershell
docker compose down
```

只有确认不再需要 Workflow、Credential 和 Execution 时，才执行：

```powershell
docker compose down -v
```

`-v` 会删除 named volume，属于破坏性操作，不能作为普通“重试方法”。

## 故障注入实验：让主流程失败并验证 Error Workflow

## 实验目标

模拟“下游服务故障”，验证：

```text
生产 Webhook
  -> 主 Workflow 执行失败
  -> Error Workflow 收到错误上下文
  -> 运维人员能定位主 execution
  -> 移除故障后再次成功
```

实验使用 Stop And Error，不断网、不删库、不改 volume，也不调用真实生产系统。

## 前置条件

1. 基础实验的 Production URL 已成功。
2. 主 Workflow 已发布。
3. 你已保存一条成功 Execution 作为健康基线。
4. 记录当前 `/metrics` 和 n8n 日志时间点。

## 第一步：创建 Error Workflow

新建 Workflow，命名：

```text
n8n-lab-error-handler
```

第一个节点选择 **Error Trigger**，后接 **Edit Fields**，命名 `Record Error Context`。至少保留：

```text
handled = true
sourceWorkflow = 从 Error Trigger 输入中映射 workflow 名称或 ID
sourceExecution = 从 Error Trigger 输入中映射 execution ID/URL
errorMessage = 从 Error Trigger 输入中映射 error message
handledAt = {{ $now }}
```

不同错误类型的输入结构可能不同。先观察 Error Trigger 的真实 Input，再用数据面板映射，不要盲抄路径。保存 Error Workflow。

## 第二步：关联错误流程

打开 `n8n-lab-alert-router`：

```text
三点菜单 -> Settings -> Error workflow -> n8n-lab-error-handler
```

保存设置。

## 第三步：注入错误

在 critical true 分支的 `Route Human Review` 后、`Respond to Webhook` 前增加 **Stop And Error** 节点：

```text
Error Type: Error Message
Error Message: LAB_FAULT: simulate downstream outage
```

连接：

```text
Route Human Review -> Stop And Error
```

故障期间不要让 critical 分支直接到 Respond 节点。保存并重新 Publish。

## 第四步：通过生产入口触发

使用新的 `alertId`，避免和基础实验混淆：

```powershell
$body = @{
  alertId = 'lab-fault-001'
  service = 'checkout-api'
  severity = 'critical'
  summary = 'simulate downstream outage'
} | ConvertTo-Json

try {
  Invoke-RestMethod `
    -Method Post `
    -Uri 'http://127.0.0.1:5678/webhook/aiops-alert' `
    -ContentType 'application/json' `
    -Body $body
} catch {
  $_.Exception.Message
}
```

因为错误发生在响应前，调用方可能收到 5xx；实际响应由版本和节点设置决定。实验判断重点是 Execution，而不是强行要求某一段错误文本完全一致。

## 第五步：验证预期结果

在 **Executions** 页面确认：

- 主 Workflow 产生一条 `error` Execution；
- Stop And Error 节点包含 `LAB_FAULT`；
- 这条记录输入包含 `lab-fault-001`；
- `n8n-lab-error-handler` 自动产生一条 Execution；
- Error Workflow 能关联主 Workflow、主 execution 和错误信息；
- 日志或指标在相同时间窗口出现失败证据。

把主 execution ID、错误处理 execution ID、时间和 `alertId` 记录在同一份实验笔记中。

## 第六步：形成假设而不是只读错误文案

真实事故中的 `downstream outage` 可能代表：

1. DNS/网络不可达；
2. 下游返回 429；
3. 下游 5xx；
4. 认证过期；
5. 请求已经成功，但响应在途中丢失。

第五种情况最危险，因为直接 Retry 可能重复产生副作用。真实流程要先用 idempotency key 查询下游，再决定重试。

## 第七步：恢复

1. 删除或 Disable `Stop And Error`。
2. 重新连接 `Route Human Review -> Respond to Webhook`。
3. 保存并 Publish。
4. 使用 `lab-recovery-001` 再调用 Production URL。
5. 确认主 Execution 为 `success`，返回 `human-review`。

恢复验证还应确认 Error Workflow 没有继续产生新错误记录。

## 爆炸半径与回滚

本实验的影响范围只有本地 critical 分支。真实生产中，注入前要：

- 明确哪些 Workflow 和调用方受影响；
- 使用测试环境或限定测试事件；
- 避免真实通知、工单和变更副作用；
- 准备一键恢复连接或旧 Workflow 版本；
- 记录负责人、开始时间、停止条件和回滚时间。

## 故障实验清理与证据

保留以下学习证据：

- 健康基线 Execution；
- 主流程失败 Execution；
- Error Workflow Execution；
- 恢复后成功 Execution；
- 一张不含 Secret 的节点图；
- 一份“现象、证据、假设、修复、验证、影响面、回滚”记录。

清理时移除故障节点、取消测试用错误关联（若不再需要），并确认生产入口恢复。不要为了“清空红色记录”删除所有 Execution；故障记录正是学习证据。

## 如果 Error Workflow 没运行

依次检查：

1. Error Workflow 是否以 Error Trigger 开始。
2. 两个 Workflow 是否已保存。
3. 主 Workflow Settings 是否选对 Error Workflow。
4. 主流程是否通过 Production Webhook 自动执行，而不是未保存、手工停止或编辑器错误。
5. Error Workflow 自己是否失败。
6. 数据库是否成功写入主 Execution 的终态。

## 生产排障手册

## 先建立时间线

任何事故先记录：

```text
首次异常时间
最近发布/配置/密钥/网络变更
受影响 Workflow、入口和环境
HTTP 请求率与状态
queue waiting/active/completed/failed
main/worker/runner restart
PostgreSQL/Redis/下游 API 状态
已采取动作与指标变化
```

不要先重启所有组件。重启会丢失内存、连接、时间和部分现场证据，也可能造成 Queue 重处理和重复副作用。

## 分层证据顺序

```text
业务层：工单、通知、自动修复是否真的完成
Workflow 层：哪类 workflow / node / execution 失败
执行层：regular/queue、waiting、active、stalled、timeout
Runner 层：Code task、heartbeat、内存、版本和 token
状态层：PostgreSQL、Redis、binary storage
入口层：LB、WAF、DNS、TLS、Webhook 路由与认证
基础设施层：CPU、内存、磁盘、网络、容器重启
```

从业务影响开始，再沿数据路径向下查。只看到容器 running 不能结束调查。

## 常见故障一：Editor 正常，Production Webhook 404

**证据**：Test URL 可用、Editor 可登录，但 `/webhook/...` 404。

**常见原因**：Workflow 未 Publish、method/path 不匹配、LB 路由错、生产 Webhook 被禁在 main 但没有 processor、重复 path 注册冲突。

**处置**：核对发布版本、Webhook 节点、LB 规则和 processor 日志；用一个全新无副作用 path 验证。

**回滚**：恢复上一版已发布 Workflow 或上一条 LB 规则，避免临时把所有流量打到 main。

## 常见故障二：Webhook 很快返回 202，工单却延迟

**证据**：入口 HTTP 成功，queue waiting 增长，业务结果迟到。

**常见原因**：响应模式为立即返回；worker/Runner 饱和；DB pool 满；下游 API 限流；积压没有 oldest-age 告警。

**处置**：查 Execution 和业务 ID；观察 waiting/active/完成速率、worker readiness、Runner、DB 和下游延迟。

**边界**：入口可用性和工作流完成 SLO 是两个指标，不能用 HTTP 2xx 代替业务完成率。

## 常见故障三：Queue waiting 一直增长

**证据**：`n8n_scaling_mode_queue_jobs_waiting` 上升，completed rate 低于到达率。

**假设顺序**：

1. worker 是否 ready 且能连 Redis/PostgreSQL；
2. active 是否已经到并发上限；
3. Runner 是否只让 Code node 阻塞；
4. 下游是否 429/超时；
5. DB 是否锁、慢查询或连接池耗尽；
6. Redis 是否内存/连接/stalled 异常。

**修复**：只有在 DB、Redis、Runner 和下游都有余量时才小步扩 worker。若瓶颈在下游，扩容只会制造更大重试风暴。

## 常见故障四：只有 Code Node 超时

**证据**：普通 HTTP/Edit Fields 节点正常，Code node 出现 task request timeout。

**常见原因**：Runner 未连接、token 不一致、Broker 5679 被挡、Runner/n8n 版本不同、用户代码死循环或内存过大。

**处置**：查 worker 与对应 Runner 日志、heartbeat、镜像 tag、资源限制和输入大小。先用最小无副作用 Code 验证链路，再恢复业务代码。

## 常见故障五：恢复数据库后所有 Credential 失效

**证据**：Workflow 和 Credential 名称都在，但节点报解密或认证异常。

**常见原因**：恢复了 DB 却没有恢复同一 encryption key；不同进程 key 不一致；误把认证过期当解密问题。

**处置**：停止写入，核对备份批次与 key 指纹/Secret 版本，先在隔离环境恢复。不要通过重建同名 Credential 覆盖原始现场。

## 常见故障六：数据库快速增长

**证据**：Execution 表、binary data 或磁盘持续增长。

**常见原因**：成功执行保存过多、payload 过大、pruning 关闭、保留期/数量过大、annotated execution 不会被清理、S3 生命周期未配置。

**处置**：先统计按 Workflow/状态/时间的增长来源，再调整保存策略和 retention。pruning 默认按年龄或数量清理完成的 Execution；默认年龄是 336 小时（14 天），默认最大数量是 10,000。`new`、`running`、`waiting` 和已标注记录有不同清理边界。

**SQLite 提醒**：删除记录后文件大小可能不立即缩小，空间会被后续重用；释放文件需要理解 VACUUM 边界，不能在事故中盲目执行。

## 常见故障七：同一告警创建多张工单

**证据**：多个 execution ID 对应相同 fingerprint 和下游动作。

**常见原因**：上游重试、立即响应后网络超时、stalled job 重处理、人工 Retry、幂等键按 execution ID 生成。

**处置**：暂停创建动作，用稳定业务 key 查询和合并重复工单；在外部唯一约束前 claim；重试读取已有 resource ID。

**复盘指标**：重复动作率应成为业务 SLI，而不是藏在工单清理记录里。

## 常见故障八：Schedule 漏跑或错时

**证据**：计划任务未在预期北京时间运行，main 曾切换或重启。

**常见原因**：`GENERIC_TIMEZONE` 错、Workflow 未 Publish、main/leader 故障、数据库不可用、升级窗口覆盖触发时间。

**处置**：核对时区、发布状态、main/leader 日志、Execution 与外部业务记录。补跑前先检查幂等和观察窗口。

## 常见故障九：升级后大量 Execution crashed

**证据**：组件版本混杂、DB migration 或 Runner 协议错误、启动恢复将 in-progress 状态标为 crashed。

**处置**：停止继续滚动，确认 main/worker/webhook/runner 精确版本，检查迁移和 Release notes；按已验证方案恢复旧环境或完成同版本升级。

**回滚边界**：数据库 schema 已迁移或 encryption key rotation 新格式已写入时，不能假设“换回旧镜像”就能回滚。

## 可观测性

## Health、Readiness 与业务探针

| 检查 | 能证明 | 不能证明 |
| --- | --- | --- |
| main `/healthz` | 进程可访问 | DB 正常、Queue 正常、Workflow 成功 |
| main `/healthz/readiness` | DB 已连接且迁移完成 | Redis、Runner、下游 API 正常 |
| worker `/healthz` | worker 进程可访问 | DB/Redis 正常 |
| worker `/healthz/readiness` | worker 对 DB/Redis ready | 每条业务流程正确 |
| 合成 Webhook | 特定入口与节点链可运行 | 所有 Workflow 与外部系统正常 |
| 业务 SLI | 工单/修复/通知真正完成 | 平台所有组件无隐患 |

探针要分层。最小合成探针可以每五分钟发送一条带固定测试标识的无副作用告警，验证 Production URL、队列、worker、数据库和响应；不能用真实生产变更作为健康探针。

## Prometheus 指标

`N8N_METRICS=true` 开启 `/metrics`。Queue 指标需额外设置：

```dotenv
N8N_METRICS_INCLUDE_QUEUE_METRICS=true
```

官方示例包含：

```text
n8n_scaling_mode_queue_jobs_active
n8n_scaling_mode_queue_jobs_waiting
n8n_scaling_mode_queue_jobs_completed
n8n_scaling_mode_queue_jobs_failed
```

Multi-main 还可用 `instance_role_leader` 区分 leader。指标端点可能暴露敏感运行信息，只允许内部 Prometheus 网段抓取。

## 推荐 SLI 与告警

### 入口 SLI

- Webhook 请求率、4xx/5xx、p95/p99 latency。
- 验签失败率、请求体超限率、重复 event rate。
- LB 到 main/processor 的分布和拒绝数。

### Queue 与执行 SLI

- waiting 数和 oldest job age。
- active、completed/failed rate。
- success/error/crashed/canceled 比率。
- 按 Workflow/节点类型拆分的 p50/p95/p99 duration。
- waiting 状态年龄、timeout 与 Retry 数。

### 组件 SLI

- main/worker/processor/runner readiness。
- 容器 restart、CPU、RSS、event-loop lag。
- Runner task waiting/timeout/heartbeat。
- PostgreSQL pool、锁、慢查询、磁盘；Redis memory、connection、eviction、stalled。

### 业务 SLI

- 告警到工单创建时延。
- 自动修复后 SLI 恢复率。
- 重复工单/通知/变更率。
- 人工审批 backlog 与超时。
- 回滚率和需要人工接管的比例。

## 日志

`N8N_LOG_LEVEL` 支持 `silent`、`error`、`warn`、`info`、`debug`，默认 `info`。`N8N_LOG_OUTPUT` 可输出到 console、file 或两者。生产日志应关联：

```text
timestamp
workflowId
executionId
eventId / fingerprint / changeId
node name/type
error class / HTTP status
duration
instance / worker / runner
```

不要长期打开 debug，也不要把 token、Webhook Secret、Credential、完整告警敏感字段或 LLM Prompt 原文写入日志。

## Trace 与外部审计

若使用 OpenTelemetry 或外部网关，应传播 trace ID，把入口请求、n8n Execution、下游 API 和 Runbook 关联起来。n8n 的 `audit` 命令是某一时刻的风险扫描，不等于持续审计；付费 Log streaming 能持续发送更多 workflow、user、credential、worker、runner 和 queue 事件，但仍要核对计划边界。

## 容量与性能

## 先建立容量模型

用 Little's Law 的近似关系做第一步估算：

```text
同时执行数 C ≈ 到达率 λ × 平均执行时间 W
worker 数 ≈ ceil(C / 单 worker 安全并发) × 冗余系数
```

例如峰值 200 RPS、平均执行时间 2 秒，理论同时执行约 400。如果单 worker 实测安全并发为 10，基础数量约 40；乘 1.3 冗余约 52。这个数字只用于暴露量级，**不是 n8n 官方容量承诺**。如果下游工单 API 只能承受 20 RPS，52 个 worker 只会把它打垮。

## 压测方法

1. 用真实大小但脱敏的 payload。
2. 分开测试纯映射、HTTP、Code、binary、AI 节点。
3. 逐级增加 arrival rate，不直接冲峰值。
4. 同时观察 n8n、Runner、PostgreSQL、Redis 和下游。
5. 记录 p50/p95/p99、错误率、oldest queue age 和恢复时间。
6. 验证限流、超时、退避、熔断和停止条件。

## 常见容量瓶颈

- 下游 API 429 或连接限制。
- PostgreSQL connection pool、锁、慢查询和磁盘。
- Redis 内存、网络和连接。
- Runner CPU/内存与 Code task 并发。
- Node.js RSS、event-loop 与大 Item。
- binary data 留在内存或本地不可共享。
- Execution 保存过多导致写放大。

不要把 worker concurrency 设置成越大越好。CPU 型 Code、长连接、内存型 binary 和慢下游需要不同隔离池或 Workflow 拆分。

## 背压与容量保护

生产系统要定义：

- Webhook 限流和 payload 上限；
- Queue 最大可接受 oldest age；
- worker 并发与按下游系统的速率限制；
- Retry 次数、指数退避、抖动和总预算；
- 超过阈值后的降级：只登记事件、暂停自动修复、转人工；
- backlog 恢复后的慢启动，避免“积压清空风暴”。

## 高可用与灾难恢复

## Community Queue Mode 的边界

Community 可以增加 worker 和 webhook processor，但单 main 仍是 Editor/API、定时器和部分 Trigger 的关键点。它提高数据面吞吐，不等于控制面 HA。

## Multi-main

Self-hosted Enterprise 的 Multi-main 才用于 main 控制面高可用。设计要求包括：

- 多个同版本 main；
- 同一 PostgreSQL、Redis 和 encryption key；
- `N8N_MULTI_MAIN_SETUP_ENABLED=true`；
- LB sticky sessions；
- leader/follower 监控与切换验证。

PostgreSQL、Redis、对象存储和负载均衡器也必须单独 HA。两个 n8n main 无法修复单实例 PostgreSQL 的磁盘损坏。

## RPO 与 RTO

- **RPO**：最多能丢多少状态。例如 RPO 5 分钟意味着数据库、binary 与 Secret 备份链路要支撑这个目标。
- **RTO**：故障后多久恢复。例如 RTO 30 分钟要求有预创建环境、自动化恢复和演练，而不是事故时第一次读文档。

Workflow 导出不是数据库一致性备份；数据库备份也不自动包含 encryption key 和外部 binary。RPO/RTO 必须覆盖完整恢复对象。

## 备份对象

至少包含：

1. PostgreSQL 一致性备份，或学习环境中的 `.n8n` volume/SQLite。
2. `N8N_ENCRYPTION_KEY`，与数据库备份分开安全保存。
3. binary/object storage 与生命周期配置。
4. Compose/Helm、环境变量名称、Secret 引用、网络和证书配置。
5. Workflow/Credential 导出作为额外可读证据。
6. 版本、插件/Community node 清单和镜像 digest。
7. 恢复 Runbook、负责人、RPO/RTO 与最近演练报告。

## 恢复验证

在隔离环境按顺序验证：

```text
恢复数据库和 binary
  -> 恢复正确 encryption key
  -> 启动同版本组件
  -> readiness 与迁移
  -> Credential 解密和最小 API 调用
  -> Manual Workflow
  -> Production Webhook
  -> Schedule / Wait / Error Workflow
  -> Queue / Worker / Runner
  -> 业务对账
```

`import:workflow` 默认使导入 Workflow inactive。恢复后要逐条核验并再 Publish，不能批量激活后才发现触发器重复。

## 安全边界

## 把编辑权视为高权限

能编辑 Workflow 的人可能使用 Expression、HTTP Request、Code、文件系统或命令类节点触达凭据和内网。只给可信工程人员最小编辑权限；运行者、观察者和审批者应使用更窄角色。Projects、SSO、自定义角色的能力要按计划核对。

## Webhook 安全

- HTTPS 和可信反向代理。
- Header/JWT/Basic 等认证，优先签名校验。
- 时间戳 + nonce 防重放。
- IP allowlist 只能作为附加层，不能替代认证。
- 请求大小、速率和超时限制。
- Production 与 Test 路由分开。
- 外部响应不回显内部错误、Secret 或堆栈。

## 网络与 Credential

- PostgreSQL、Redis、Runner Broker 不暴露公网。
- 只允许需要的组件和目标域名。
- Secret 不写普通环境清单、Execution、日志和 Prompt。
- 生产使用外部 Secret 管理时核对付费功能；否则至少用平台 Secret 和 ACL。
- 数据库备份和 key 分离，访问与恢复都留审计。

## Node 与供应链

Community/Custom nodes 会在实例中执行代码。安装前审核来源、维护状态、版本和权限；固定版本，先在隔离环境测试。对不需要的高风险节点建立 blocklist。定期运行：

```powershell
docker exec -u node -it <n8n-container-name> n8n audit
```

审计报告会检查未使用 Credential、数据库表达式、文件系统节点、风险节点、未保护 Webhook、安全设置和版本。它只能发现部分风险，不是安全保证。

## Task Runner 加固

生产建议：external sidecar、distroless、非 root 用户 `65532`、只读根文件系统、最小可写 `/tmp`、AppArmor/容器策略、模块 allowlist、CPU/内存/任务超时和受限网络。

## 安全升级

n8n 历史上出现过官方 Critical Expression Injection RCE 公告。现实教训是：

- 订阅官方 Security Advisory；
- 把所有 Workflow 编辑者视为可信高权限主体；
- 限制 n8n OS、文件和网络权限；
- 安全修复进入快速但可回滚的升级通道；
- 不以“实例没暴露公网”替代内部威胁防护。

## 升级与回滚

## 升级前

1. 阅读从当前版本到目标版本的 Release notes 和 breaking changes。
2. 固定目标数字版本与镜像 digest。
3. 备份 DB、key、binary、配置，并在隔离环境恢复成功。
4. 复制代表性 Workflow 到 staging：Webhook、Schedule、Credential、Wait、Code/Runner、Queue、binary、Error Workflow。
5. 建立前后基线：错误率、duration、queue age、DB migration、Runner timeout 和业务重复率。
6. 明确停止条件、负责人和回滚决策点。

## 升级中

Docker Compose 的基本动作是：

```powershell
docker compose pull
docker compose down
docker compose up -d
```

生产不能只执行三条命令。所有 main、worker、webhook processor 和 Runner 应升级到同一版本；观察 readiness、迁移日志、Queue 和合成 Workflow，再逐步恢复流量。

## 升级后

- 核对运行版本而不是只看配置文件。
- 验证 Test/Production Webhook、Schedule、Wait 和 Error Workflow。
- 验证 Credential 解密、Runner 和 Community nodes。
- 比较 p95、失败率、waiting age、DB/Redis 与业务重复率。
- 观察一个完整业务周期后再删除旧环境和备份。

## 回滚边界

如果只是应用无状态代码且 schema 向后兼容，可能切回旧镜像；但如果数据库迁移、Workflow 格式或 encryption key 格式已改变，旧版本可能无法读取。特别是 encryption key rotation 功能开启后会写入新格式，官方文档说明不能简单关 flag 或降级；可靠回退是恢复开启前的完整数据库备份。

所以“回滚”不是一个命令，而是一套经过演练的应用、数据库、Secret、binary 和流量恢复方案。

## 生产事故场景：Webhook 正常，工单延迟 20 分钟

## 现象

09:30 起，Webhook 仍返回 202；main `/healthz` 为 200；worker 容器都显示 running。但告警到工单的时延从 10 秒升到 20 分钟，queue waiting 持续上涨。

## 先判断影响面

- 所有 Workflow 还是只有 Code node Workflow？
- 只有工单系统还是所有下游？
- critical 自动修复是否也积压？
- 是否已经产生重复工单或重复变更？
- backlog oldest age、增长速率和预计耗尽时间是多少？

若存在破坏性自动修复，应先降级为人工审批或只记录事件，防止积压恢复后集中执行旧动作。

## 证据顺序

1. 查 main `/healthz/readiness`，不把 health 当 ready。
2. 查 queue waiting、active、completed、failed 和 oldest age。
3. 查 worker readiness、日志、restart 与实际 concurrency。
4. 若只有 Code node 慢，查 Runner heartbeat、task wait、timeout 和资源。
5. 查 PostgreSQL pool、锁、慢查询、磁盘和连接数。
6. 查 Redis memory、connection、eviction 和 stalled。
7. 按 Workflow/node type 分解 duration，查下游 429/5xx/timeout。
8. 用 eventId 对账工单系统，确认是否“已成功但响应丢失”。

## 假设与验证

### 假设一：worker 容量不足

表现为 active 接近安全并发，CPU/内存合理，DB/Redis/下游仍有余量。小步增加一个 worker，若 completed rate 上升且 DB/下游稳定，假设得到支持。

### 假设二：Runner 故障

只有包含 Code node 的 Workflow 积压，Runner task timeout 增长。恢复对应 sidecar 后该类任务恢复，支持假设。

### 假设三：数据库连接耗尽

worker 看似空闲但 readiness/日志报 DB，连接池满或慢查询增加。降低 worker 并发后错误减少，支持假设；继续加 worker 会恶化。

### 假设四：下游限流

HTTP Request 节点出现 429，重试放大请求。降低消费、加退避后成功率恢复，支持假设。

## 修复

- worker 饱和且全链路有余量：小步扩容并观察。
- Runner 饱和：修复或扩对应 sidecar，不开 insecure mode。
- DB pool 满：停止扩 worker，降低并发，修慢查询/连接池。
- 下游限流：限速、指数退避、熔断，必要时暂停非关键 Workflow。
- Redis 异常：先保证队列一致性和持久状态可对账，再恢复消费。

## 验证

恢复标准不只是 waiting 归零：

- oldest age 回到 SLO 内；
- completed rate 稳定高于到达率，随后与到达率平衡；
- error/crashed/stalled 不反弹；
- DB/Redis/Runner 和下游在安全水位；
- 按 idempotency key 对账，无新增重复副作用；
- critical 事件的业务 SLI 真正恢复。

## 爆炸半径与回滚

记录调整了哪些 worker、并发、限速或超时，影响哪些 Workflow 和下游。若扩容导致 DB 或下游恶化，立即恢复旧并发/副本数；如果暂停自动化，明确人工接管列表和恢复顺序。

## 复盘改进

- 为 queue oldest age 和业务完成时延建告警。
- 将 Workflow 按下游/风险/资源类型隔离。
- 给 Runner、DB pool 和下游 429 建联合仪表盘。
- 强制 idempotency key 与业务对账。
- 演练“积压恢复慢启动”，避免清空风暴。

## 生产系统设计题：设计企业级 n8n AIOps 编排平台

## 题目

设计一个每天接收 50 万条告警、峰值 200 RPS 的平台。它需要：

- 告警去重、证据补全、工单和 IM 通知；
- 低风险自动修复，高风险人工审批；
- 控制面高可用；
- 消息不静默丢失，重复副作用可控；
- Credential 隔离与持续审计；
- 可观测、可扩容、可升级和可回滚。

## 先澄清需求

面试中不要直接画图，先问：

1. 50 万是原始告警还是治理后的事件？峰值持续多久？
2. Webhook 必须同步返回最终结果，还是 202 接收即可？
3. 哪些动作有破坏性？自动化授权等级是什么？
4. 工单、IM、CMDB、监控和 Runbook 的 QPS/SLA/幂等能力如何？
5. 能否使用 Enterprise Multi-main、SSO、External secrets 和 Log streaming？
6. RPO、RTO、数据保留与合规要求是什么？
7. Workflow 编辑者、审批者和运行者如何分权？

## 一个可讨论的设计

```text
External alert sources
        |
        v
DNS -> WAF/LB -> webhook processor pool
        |          ├─ auth/signature/replay protection
        |          └─ fast accept + event contract
        |
        +------> main pool (Editor/API, sticky session)
                       |
                       v
                 Redis HA queue
                       |
          +------------+------------+
          v            v            v
      worker pool  worker pool  worker pool
       HTTP/light   Code/Runner   high-risk flow
          |            |            |
          |       runner sidecars    +-> approval gateway
          |            |            +-> Runbook platform
          +------------+------------+
                       |
                       v
                 PostgreSQL HA
          workflow / credential / execution
                       |
       +---------------+----------------+
       v                                v
 shared binary/object store       metrics/logs/traces
```

## 入口设计

- 多个 webhook processor 由 LB 分流，main 不进入生产 Webhook 池。
- WAF/LB 做 TLS、速率和大小限制；Workflow 做签名、时间戳、nonce 与事件契约校验。
- 入口快速返回 202 时，必须另建“端到端完成时延”SLO，不能只报入口可用。
- `/webhook-test/*` 只到 main，生产和测试域名/路由分开。

## 编排与状态

- Queue mode 只把 execution ID 经 Redis 分发；worker 从 PostgreSQL 读写共享状态。
- PostgreSQL 是 Workflow、Credential 密文、Execution 状态/结果的权威存储。
- Redis、PostgreSQL 和 binary store 分别做 HA、备份、容量和告警。
- Wait/审批状态持久化，审批回调必须鉴权、防重放并校验 change ID。

## 隔离与容量

- 按资源类型拆 worker pool：轻量 HTTP、Code/Runner、长耗时/AI、高风险动作。
- 每个需要 Code 的 worker 配同版本 external Runner sidecar。
- 用实测 `λ × W` 算并发，结合 DB pool、下游限流和冗余决定 worker 数。
- 设置 per-downstream rate limit、timeout、Retry budget 与熔断。
- backlog 超阈值时降级：暂停自动修复，保留事件登记和人工响应。

## 幂等与一致性

稳定 key 示例：

```text
fingerprint + environment + action + incident-window
```

在外部动作账本使用唯一约束。流程先 claim，再执行，再写外部 resource ID；重试先查账本和下游。对不可逆动作使用审批、dry-run、影响面、回滚 token 和事后业务验证。系统提供的是 at-least-once 风险下的可控副作用，不宣称 exactly-once。

## 高可用

- Enterprise Multi-main + sticky sessions + leader/follower。
- main、worker、processor、Runner 全部同版本和同 encryption key。
- PostgreSQL/Redis 本身采用可靠 HA，不把应用副本数当数据层 HA。
- leader 切换、Schedule 和持久连接用业务幂等抵抗边界重复/遗漏。

如果预算只允许 Community，要明确单 main 风险，设计热备、快速恢复和人工降级；不能把方案包装成完整控制面 HA。

## 安全与治理

- SSO/RBAC/Projects 按计划启用；生产编辑权最小化。
- Credential 由统一 key 加密，key 和 DB 备份分离；外部 Secret 功能按计划核对。
- Runner 非 root、只读、资源/网络受限；高风险和 Community nodes 建准入清单。
- Security audit 周期执行，安全公告进入升级流程。
- Event、Execution、审批、Runbook 和外部结果用统一 ID 关联。

## 可观测与 SLO

至少定义：

- Webhook 接收可用性与 p95；
- 事件到工单/修复完成的 p95；
- queue oldest age；
- Execution success/error/crashed；
- 重复副作用率；
- 自动修复验证成功率；
- 人工审批时延；
- RPO/RTO 演练结果。

## 升级与灾备

固定版本，staging 回放代表性 Workflow，全组件同版本升级。备份 DB、key、binary、配置和导出；隔离恢复后验证 Credential、Webhook、Schedule、Wait、Error Workflow、Queue 和 Runner。数据库 schema/key 格式变化时，用完整备份回退，不能只换镜像。

## 关键取舍

### 同步响应还是异步接受

同步能直接告诉调用方结果，但会占连接并放大下游延迟；异步 202 更能吸收峰值，但必须提供状态查询、完成通知和端到端 SLO。

### 一个大 Workflow 还是多个子流程

一个大图容易入门，但权限、发布和故障范围过大。生产可按接入、补全、决策、执行、验证拆子工作流，通过清晰契约连接；避免无限嵌套让 Execution 难追踪。

### n8n 内直接执行还是调用 Runbook 平台

低风险 API 映射可直接做；主机配置、批量变更和高风险动作更适合交给 AWX/Rundeck/内部平台，由 n8n 负责编排、审批和验证。

### 保存全部 Execution 还是只存错误

全存便于调试但成本和敏感数据风险高；只存错误又可能缺成功基线。按 Workflow 风险、审计要求和 payload 大小制定策略，并把关键业务结果写入独立审计系统。

## 面试怎么讲

## 30 秒版本

> n8n 是一个 source-available 的工作流自动化平台，用 Trigger 接收事件，让 Item 在节点间流动，并把每次运行保存为 Execution。AIOps 中它适合连接监控、日志、CMDB、工单、审批和 Runbook。单机用 Regular mode；需要扩展时，main 把 execution ID 放入 Redis，worker 从 PostgreSQL 读取并执行。生产重点不是拖节点，而是业务幂等、Credential/Runner 隔离、Queue 和数据库容量、HA、可观测、备份与升级回滚。

## 3 分钟版本

> 我会把 n8n 分成入口、编排、执行、状态和治理五层。Webhook、Schedule 等 Trigger 创建 Execution；节点处理 JSON Item、调用外部系统，Expression 完成字段映射。Regular mode 适合学习，Queue mode 中 main 或 webhook processor 先在数据库创建执行，再把 execution ID 放进 Redis，worker 读取 PostgreSQL 中的 Workflow 和执行数据，完成后写回并通知 main。Redis 不是权威状态库，PostgreSQL 才是共享持久状态。
>
> Code node 在生产应使用 external Task Runner，每个 worker 配同版本 sidecar。多 worker 只能扩执行数据面，Community 单 main 仍是控制面单点；完整 Multi-main 是 Enterprise 能力，而且 PostgreSQL、Redis 和对象存储还要分别 HA。
>
> AIOps 流程里我会用 alert fingerprint 生成业务幂等键，外部唯一约束防重复工单或变更；高风险操作加审批、影响面、回滚 token 和业务 SLI 验证。监控不只看 `/healthz`，还看 readiness、queue oldest age、执行耗时、Runner、DB/Redis 和业务重复率。升级前固定版本、恢复演练、staging 回放，全组件同版本灰度；schema 或 encryption key 格式变化时不能假设只换旧镜像就能回滚。

## 面试题与递进追问

### 1. n8n 是什么，它解决什么问题

**回答指导**：说明它是工作流自动化平台，核心是事件入口、节点编排、系统集成和 Execution 证据；不要说成“无代码脚本”或“大模型平台”。

**追问一：为什么不用自己写服务？**

低到中等吞吐、集成多、流程变化快时，n8n 降低连接和可视化成本；核心高性能事务、强类型协议或复杂一致性仍适合自研。

**追问二：它不适合什么？**

高频指标存储、大规模流计算、模型训练和无治理的破坏性自动化。

### 2. Workflow、Node、Item、Execution 有什么区别

**回答指导**：Workflow 是定义，Node 是步骤，Item 是一次节点处理的数据单元，Execution 是 Workflow 的一次运行。

**追问：一个 Node 为什么可能运行多次或产生多个 Item？**

因为输入可能有多个 Item，节点也可能拆分、聚合或循环；要观察 Item 数和 Item linking，而不是假设“一节点一条数据”。

### 3. Test Webhook 与 Production Webhook 有什么区别

**回答指导**：Test URL 需要 Listen for test event，约 120 秒，数据显示在编辑器；Production URL 需要保存并 Publish，结果去 Executions 查看。

**追问：Production Webhook 返回 202 能证明什么？**

通常只证明入口接受，尤其立即响应模式；不能证明 Queue、worker、下游和业务修复完成。

### 4. Queue Mode 的完整数据路径是什么

**回答指导**：main/processor 创建 execution → Redis 入队 ID → worker 取 ID → PostgreSQL 读 Workflow/数据 → 执行 → PostgreSQL 写结果 → Redis 通知 main。

**追问：为什么不把完整 Workflow 都放 Redis？**

官方架构让数据库承担持久状态，Redis 做队列协调；这样各 worker 共享一致的定义和执行状态，但 DB 也成为关键容量与 HA 组件。

### 5. Redis 和 PostgreSQL 各自是什么角色

**回答指导**：Redis 是调度/通知通道，PostgreSQL 是 Workflow、Credential 密文和 Execution 的权威共享状态。

**追问：Redis 可以丢吗？**

不能轻率回答。队列故障会影响任务调度和在途处理；即使 DB 有状态，也要按队列恢复、stalled/重放和业务幂等对账，不能说“Redis 不存结果所以随便重建”。

### 6. n8n 如何保证 exactly-once

**回答指导**：先纠正问题：n8n 不自动提供跨外部系统 exactly-once。Webhook 重试、stalled job 和人工 Retry 都可能重复。

**追问：如何防止重复建工单？**

用稳定业务 key，在外部数据库做唯一约束/动作账本，先 claim 再执行；重试查询已有外部 resource ID。

### 7. 多个 Worker 是否等于高可用

**回答指导**：不等于。它改善执行吞吐和 worker 故障承受，但单 main、PostgreSQL、Redis、binary storage 仍可能单点。

**追问：完整 HA 怎么做？**

Enterprise Multi-main leader/follower + sticky sessions，再为 PostgreSQL、Redis、对象存储、LB 做各自 HA，并验证切换和业务幂等。

### 8. Task Runner 为什么重要

**回答指导**：它隔离执行 Code node 任务；生产用 external sidecar，Queue mode 每个 worker 配对应 Runner，同版本和共享 token。

**追问：Runner Down 时怎么看？**

普通节点可能正常，只有 Code node timeout；查 Broker 地址、5679、token、版本、heartbeat、资源和用户代码。

### 9. `/healthz=200` 为什么还可能不能工作

**回答指导**：health 只证明进程可达，不查数据库；readiness 检查 DB，但也不覆盖 Redis、Runner、下游 API 和业务结果。

**追问：你会建哪些 SLI？**

入口 5xx/p95、queue oldest age、execution duration/error、Runner timeout、DB/Redis，以及告警到工单时延、重复动作率和修复验证成功率。

### 10. Credential 加密后为什么还会泄露

**回答指导**：编辑者/节点可能使用 Credential 发请求，Execution/日志/导出也可能泄露值；encryption key 保护静态密文，不解决运行时权限和数据外传。

**追问：恢复后为何无法解密？**

DB 与 encryption key 不匹配，或进程之间 key 不一致。备份必须包含并安全分离保管 key。

### 11. 如何升级和回滚 n8n

**回答指导**：Release notes、固定版本、完整备份与恢复演练、staging、代表性 Workflow、全组件同版本、灰度和 SLI 验证。

**追问：为什么不能直接切回旧镜像？**

数据库 migration、Workflow 格式或 encryption key rotation 可能不向后兼容；必要时恢复升级前完整备份。

### 12. n8n、Ansible、Jenkins 和 Dify 怎么组合

**回答指导**：n8n 做通用事件和跨系统编排；Ansible/AWX 做幂等基础设施变更；Jenkins 做构建交付；Dify 做模型/知识/AI 应用。用清晰 API、权限和业务 ID 连接，而不是互相替代。

**追问：谁负责最终验证？**

编排流程必须查询外部业务 SLI 和实际资源状态；任何单个工具的绿色状态都不是最终事实。

## 学习检查清单

### 入门层

- [ ] 能用一句话解释 n8n。
- [ ] 能区分 Workflow、Node、Item 和 Execution。
- [ ] 能解释 Test/Production Webhook。
- [ ] 能查看节点 Input/Output 和分支。
- [ ] 能固定版本启动并读 health/readiness/metrics。
- [ ] 能完成基础告警路由实验。

### 机制层

- [ ] 能画出 Regular 和 Queue 两条数据路径。
- [ ] 知道 Redis 与 PostgreSQL 的角色。
- [ ] 能解释 Credential 与 encryption key。
- [ ] 能解释 Wait、Retry 和 Error Workflow。
- [ ] 能解释 internal/external Task Runner。
- [ ] 能说明业务幂等为什么不能靠 execution ID。

### 生产层

- [ ] 能设计 Webhook 鉴权、验签、防重放和限流。
- [ ] 能用 `λ × W` 做第一版容量估算并说明局限。
- [ ] 能设计 Queue、DB、Redis、Runner 和下游联合观测。
- [ ] 能说清 Queue 扩容与 Multi-main HA 的差别。
- [ ] 能列出完整备份对象并完成恢复演练。
- [ ] 能设计升级停止条件和 schema/key 回滚边界。
- [ ] 能处理积压、重复副作用和业务对账。

### 面试层

- [ ] 能讲 30 秒和 3 分钟版本。
- [ ] 能回答 Queue 完整数据路径。
- [ ] 能识别 `/healthz=200` 的证据边界。
- [ ] 能设计 50 万告警平台并说明计划/许可边界。
- [ ] 能按证据、假设、验证、修复、影响面、回滚回答事故题。

## GitHub 学习证据

完成实验后，可在自己的学习仓库提交如下结构：

```text
n8n-aiops-lab/
├─ README.md
├─ compose.yaml
├─ .env.example
├─ workflows/
│  ├─ n8n-lab-alert-router.json
│  └─ n8n-lab-error-handler.json
├─ samples/
│  ├─ critical-alert.json
│  └─ warning-alert.json
├─ evidence/
│  ├─ version-and-compose-config.txt
│  ├─ health-readiness-metrics.txt
│  ├─ baseline-execution.png
│  ├─ fault-execution.png
│  ├─ error-workflow-execution.png
│  └─ recovery-execution.png
└─ incident-notes/
   └─ lab-fault-review.md
```

`.env.example` 只放变量名：

```dotenv
N8N_ENCRYPTION_KEY=<generate-a-random-value-locally>
```

提交前检查：

```powershell
git status -sb
git diff --check
git grep -n -I -E 'N8N_ENCRYPTION_KEY=.{20,}|api[_-]?key|password|token' -- .
```

最后一条只是启发式检查，不能替代 Secret scanner 和人工审查。截图要遮住 Credential、Cookie、API Key、Webhook Secret、内部域名和用户信息。

学习证据至少回答：

1. 使用了哪个精确版本？
2. Compose 静态解析和容器状态是什么？
3. Test/Production Webhook 分别如何验证？
4. 故障注入的主 execution ID 是什么？
5. Error Workflow 收到了什么证据？
6. 恢复后用什么业务 ID 验证成功？
7. 如果进入生产，还缺哪些 HA、安全和容量措施？

## 本文边界与下一步

本文已经覆盖从本地第一条 Workflow 到 Queue、Runner、幂等、HA、容量、安全、灾备、升级、事故和系统设计的主线，但没有穷举每个内置 Node、每个付费计划或每个云厂商部署细节。

下一步建议：

1. 先完成本文两套实验并提交真实证据。
2. 学习 [RESTful API](../foundation/restful-api.md)，补 HTTP、认证、幂等和并发控制。
3. 学习 [Runbook Automation](./runbook-automation.md) 与 [Ansible](./ansible.md)，把高风险动作交给受控执行层。
4. 学习 [Prometheus](../observability/prometheus.md)、[OpenTelemetry](../observability/opentelemetry.md) 和 [告警治理](../sre-aiops/alert-governance.md)，建立证据入口。
5. 若接入模型，再学习 [Dify](../data-ai/dify.md) 与 [RAG](../data-ai/rag.md)，始终保留模型建议与生产执行之间的权限边界。
6. 准备生产前，重新核对 n8n Releases、Community/Business/Enterprise 权益、Security Advisory 和 breaking changes。

真正的大厂面试深度，不是背出节点名称，而是能从事件进入开始，解释数据在哪里、状态如何恢复、失败如何定位、副作用如何去重、容量如何估算、权限如何限制、升级如何回滚，以及最终怎样用业务证据证明系统恢复。
