# AIOps 闭环

> 目标：不是把 AIOps 理解成“接一个聊天机器人”，而是能设计一条从观测、检测、关联、解释、推荐、执行、验证到学习的工程闭环；每一层都有输入、输出、工具、护栏、验证方式和反馈机制。

## 官方资料

优先读这些官方资料和高可信资料：

- [Microsoft Learn - AIOps and agentic operations in Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/aiops/aiops-and-agentic-operations)
- [Microsoft Learn - Azure Copilot Observability Agent](https://learn.microsoft.com/en-us/azure/azure-monitor/aiops/observability-agent-overview)
- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
- [Google SRE Book - Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Book - Emergency Response](https://sre.google/sre-book/emergency-response/)
- [Google SRE Book - Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
- [IBM - What is AIOps?](https://www.ibm.com/think/topics/aiops)
- [Red Hat - What is AIOps?](https://www.redhat.com/en/topics/ai/what-is-aiops)

说明：本文把前面所有技术串成一个 AIOps 闭环。它不是某个单品工具，而是一条从观测、检测、关联、解释、行动到复盘学习的工程链路。

## 场景开场

你已经有：

- Prometheus。
- Grafana。
- Alertmanager。
- Loki / Elasticsearch。
- OpenTelemetry。
- FastAPI。
- MySQL / Redis / Kafka。
- pandas / scikit-learn。
- OpenAI API / RAG / 向量数据库。
- Ansible / Terraform / CI/CD / Runbook Automation。
- SLI/SLO、告警治理、事件响应、RCA、变更管理。

那是不是就有 AIOps 了？

不一定。

如果这些能力只是散落在各处，它们只是工具。AIOps 的关键是闭环：

```text
数据能采到。
异常能发现。
上下文能关联。
解释能给证据。
动作有护栏。
结果能验证。
复盘能反哺。
```
少一环，就容易变成孤立 demo。

## 一句话人话版

AIOps 闭环是把运维数据变成受控行动的链路：观测、检测、关联、解释、推荐、执行、验证、学习，每一步都有证据和边界。

## 小白可能会问

- AIOps 是不是等于大模型运维助手？
- AIOps 和 SRE 是什么关系？
- 异常检测、告警降噪、根因分析、自动化修复怎么串起来？
- 哪些动作可以自动执行，哪些必须审批？
- 为什么没有 SLO 就很难做 AIOps？
- LLM 在闭环里到底做什么？
- RAG 和向量数据库在哪一层？
- 怎么证明 AIOps 项目真的改善了运维效率？
- 一个能放到 GitHub 的 AIOps 项目应该长什么样？

## 官方知识地图

AIOps 闭环可以按这张地图理解：

```text
Observe（观测）
  -> metrics（指标）
  -> logs（日志）
  -> traces（链路）
  -> events（事件）
  -> changes（变更）
  -> topology（依赖拓扑）
Detect（检测）
  -> SLO burn-rate alerts（服务目标错误预算燃烧率告警）
  -> static thresholds（静态阈值）
  -> anomaly detection（异常检测）
  -> forecasting（趋势预测）
Correlate（关联）
  -> alert grouping（告警分组）
  -> service topology（服务依赖图）
  -> time window（时间窗口）
  -> recent changes（近期变更）
  -> similar incidents（相似事故）
Explain（解释）
  -> evidence（证据）
  -> logs（日志）
  -> metrics（指标）
  -> runbooks（运行操作手册）
  -> RCA history（历史根因分析）
  -> LLM summary（大语言模型摘要）
Recommend（推荐）
  -> next checks（下一项检查）
  -> runbook steps（手册步骤）
  -> safe actions（经评估的低风险动作）
  -> approval-needed actions（需要批准的动作）
Act（执行）
  -> create ticket（创建工单）
  -> collect diagnostics（收集诊断信息）
  -> run read-only checks（执行只读检查）
  -> execute approved automation（执行已获准的自动化）
Verify（验证）
  -> SLI back to normal（服务指标恢复正常）
  -> alerts stop（告警停止）
  -> business metrics recover（业务指标恢复）
Learn（学习改进）
  -> postmortem（事故复盘）
  -> action items（改进行动项）
  -> updated alerts（更新告警规则）
  -> updated runbooks（更新操作手册）
  -> updated features/models（更新特征与模型）
```

Microsoft Azure Monitor 的 AIOps / agentic operations 资料也强调：现代运维智能不只是发现异常，还包括跨信号调查、解释发生了什么、说明证据、指导下一步行动。这个思路和 SRE 闭环天然契合。

## 老师带你把“模型很聪明”变成可验证的工作流程

先设定一个具体问题：值班者每天收到大量重复告警，想知道哪些属于同一事件、下一步该查什么。不要立即从模型开始。先确认告警字段、时间、服务标识和依赖是否可靠，再建立简单分组规则，最后比较模型是否比基线更有帮助。

闭环的意思是处理结果会回到系统：发现异常，关联证据，提出解释，选择动作，验证效果，再修正规则或模型。若只有一次摘要输出，就还没有完成验证与学习。每一段都要有输入、输出、状态、失败方式和责任人。

### 第一课：区分检测、诊断与决策

Detection（检测）回答“哪里偏离正常”，Diagnosis（诊断）回答“哪些机制可能解释现象”，Decision（决策）回答“在证据和风险约束下做什么”。异常分数高不等于根因确定，根因候选排名第一也不等于已经获准修改生产。

模型输入要保留数据时间、服务范围和缺失情况。一次请求重试可以制造多条日志，十条相似日志不一定代表十个独立事故。Feature（特征）是用于计算的输入量，例如五分钟错误比例；Label（标签）是评估时的真实分类。这里标签与监控系统的维度标签同名但用途不同，需要按上下文区分。

### 基础实验：自己算准确率以外的指标

前置条件是 Node.js，在本仓库根目录运行；脚本只使用十条合成分类结果。

```powershell
node examples/teacher-led-reliability-lab/lab.mjs aiops
node examples/teacher-led-reliability-lab/lab.mjs aiops --fault
```

正常结果中 TP（真正例：识别出的真实异常）为 3，FP（假正例：误报）为 1，FN（假负例：漏报）为 1。Precision（精确率）为 `3/(3+1)=0.75`，Recall（召回率）为 `3/(3+1)=0.75`。请在纸上标出每条预测属于哪一格，再复算。异常稀少时总准确率很容易被正常样本主导，所以还需关注误报、漏报与成本。

### 故障实验：分数没变，为什么评估被拒绝

故障模式让训练数据最晚时间为 12，而测试最早时间为 10，出现 `REJECT_TIME_LEAKAGE`（拒绝时间泄漏）。这是把评估时不应知道的未来信息带进训练；即使表面分数没变，评估设计也已经不可靠。正常模式训练最晚为 8，测试开始为 10，输出 `EVALUATION_SPLIT_OK`，仅表示这一项时间检查通过。

如果运行失败，检查 Node、目录和参数。脚本不训练模型、不连接服务、不写持久数据，因此无资源需清理；保存两次输出与时间轴。真实评估还要检查同一事故跨集合、特征计算窗口、标签延迟与版本漂移，不能只比较两个时间数。

### 第二课：让系统在不确定时有明确出口

检索出的知识可能过期、模型可能误读日志、工具可能超时。给每个步骤定义“成功、证据不足、失败、待人工处理”等状态，并保存引用与输入摘要。不要把异常捕获后返回空对象当成成功，否则下游会把缺失信息理解成没有问题。

自动动作应校验目标、当前状态、权限、并发预算和幂等条件。任务超时先确认动作是否已经生效，再决定重试。高风险操作要有明确的控制流程，批量触发时限制影响面。验证阶段重新检查用户功能和观测新鲜度，不能仅以工具返回“已执行”关闭事件。

容量包含模型延迟、工具调用、队列和人工复核。高峰告警涌入时，优先保住原有监控与响应流程，再为摘要设置限流与超时。模型服务不可用时，可以降级到规则和人工处理；不要让新增智能功能成为值班工作的唯一入口。

版本管理同时覆盖规则、特征、检索资料、提示词、模型和工具。升级时用固定评估集回归、影子运行与小范围启用，再看新数据表现。回滚要恢复匹配组合，否则旧提示词调用新工具接口仍可能失败。敏感日志的脱敏、租户隔离、引用权限和审计属于数据链路设计的一部分。

### 面试课堂：30 秒、3 分钟与设计题

30 秒：“AIOps 把观测、检测、证据关联、建议、受控执行、业务验证和反馈连起来。先建基线和评估口径，再证明模型对真实运维任务的增益。”

3 分钟用告警分组案例讲输入质量、基线、评估、状态流转、权限和恢复验证。追问：“精确率高是否足够？”还要看召回、延迟、重要事故和人工成本。“大模型输出根因就能执行吗？”需要来源、适用性、状态确认和权限。“自动化没有节省时间怎么办？”测整条流程的人工总成本，而不是只测生成摘要速度。

设计题：每日十万条告警、多个租户、模型偶尔不可用，怎样保证基础响应不断。事故题：模型引用过期 Runbook 推荐错误回滚，沿文档版本、证据引用和动作前置校验找缺口。GitHub 学习证据包括数据口径、评估输出、状态图、失败降级和一次复盘。

## 系统设计课堂：把模型放进有边界的运维流程

### 第一层，给数据建立一份合同

同学，假设模型同时收到“延迟 500”和“延迟 0.5”，没有单位时它无法知道两者可能代表同一件事。数据合同要定义字段、单位、时间、对象标识、来源和质量状态。输入缺失、迟到或被采样时保留标记，不用一个默认零掩盖差异。

服务名也需要统一关系。监控里叫 `order-api`，日志里叫 `orders`，资产台账里又用另一个资源标识，不能仅按字符串相似就自动认定同一系统。维护服务、实例、租户、依赖与负责人之间的映射，保留版本和生效时间，关联结果才有可解释基础。

数据权限随来源继承。能看聚合指标的人不一定能读原始日志，能检索事故摘要的人不一定能访问包含业务信息的证据。检索和模型输出都要保持权限边界，不能把知识库当作统一放开权限的中转站。

### 第二层，检测不是诊断，异常不等于事故

检测回答“与预期相比哪里不寻常”，诊断回答“什么机制可能造成了它”，事件分级回答“对用户有多大影响”。定时备份导致的规律性负载上升可能异常但可接受；没有明显资源波动的认证错误却可能造成严重影响。

从简单基线开始有助于知道模型到底增加了什么价值。固定阈值、历史同期比较、业务日历和依赖健康，都可以作为基线。复杂模型只有在代表性数据上改善了有意义的指标，并且成本与维护可接受时，才值得加入。

标注数据也要谨慎。没有人工处理不等于误报，可能是通知未送达；被关闭的工单不等于原因已确认；历史恢复动作不一定是正确动作。把标签来源与不确定性保存下来，避免模型把流程漏洞学成“最佳实践”。

### 第三层，解释必须能落回证据

一个可靠解释应包含观察、竞争假设、支持证据、反证、适用版本与缺失信息。模型可以帮助整理线索和提出下一步检查，但“它说得很有条理”不是证据。相似事故检索也只产生候选，当前对象与状态仍需验证。

把日志、网页和工单内容当数据，不当操作指令。恶意或无意写入的“忽略规则、执行命令”不能扩大工具权限。工具调用参数应来自受控结构、经过范围校验，并在执行前核对目标与授权，而不是把一段自然语言直接拼接进终端。

当证据不足、来源冲突或目标不明，系统应能回答“暂不能确定”，并给出最有价值的只读检查。拒绝过早下结论是能力的一部分，不是让模型无论何时都输出某个根因。

### 第四层，建议与执行之间建立明确门槛

模型推荐“重启实例”后，执行器仍要检查这个实例是否归当前服务、版本是否适用、可用副本是否足够、是否存在正在进行的变更、操作者是否获准，以及动作会影响多少用户。只读建议与写入操作不能共享一个没有区别的授权开关。

执行要有任务标识、幂等策略、持久状态、并发限制和审计。超时后先查实际效果，不自动重复不可逆动作。失败时决定停止、补偿或交给人工；回退模型、提示词或知识库版本，也不会自动撤销已经发生的业务变化。

课堂设计一条最小安全路径：模型只生成诊断建议，人工确认后由有白名单的执行器处理一个指定测试对象，随后独立检查结果。只有多轮演练证明前置条件、失败分支与回退可靠，再逐步扩大自动化范围。不要从第一天就让模型拥有全环境管理员权限。

### 第五层，验证结果不能让建议者自己说了算

验证应基于预先定义的业务成功条件，而不是模型生成一句“已恢复”。同时核对目标状态、用户指标、数据正确性和新风险；证据不足就继续观察。对于重要动作，可让独立规则或验证组件检查，降低同一错误推理贯穿全过程的风险。

评价 AIOps 时看检测延迟、遗漏、噪声、建议采纳后的效果、错误动作率和人工成本，而不是只数生成报告或调用工具的次数。任务成功率也要定义分母，不能把被系统提前拒绝或转人工的高风险任务全部悄悄排除。

模型失效时要有降级路径：保留确定性告警、人工 Runbook 和可读证据。模型服务不可用不应同时让基础监控、事件通知和人工诊断全部失灵。架构设计要检查哪些依赖共用网络、凭据或存储，避免“备用路径”其实依赖同一个故障点。

### 第六层，持续学习先防止把自己的答案喂回自己

系统生成的推测若未经确认就进入知识库，下一次检索会把它当资料，再次强化错误。这是反馈污染。把机器建议、人工确认、实验验证和真实恢复结果分层保存，只有满足质量条件的内容才进入高可信知识集。

训练与评估按时间和实体边界拆分，避免同一事故的近重复记录同时进入两边。调阈值用验证集，最终测试集用于独立评价；上线后跟踪数据分布与业务变化。高离线分数不保证新服务或新版本同样有效。

毕业作品可以先做“小而完整”的只读事故助手：读取合成指标和脱敏知识，给三项假设及证据链接，生成下一步检查清单，拒绝超出范围的写入请求，并对正常、缺数据和误导文本三类案例做测试。能解释失败边界和安全设计，比演示一次漂亮对话更能支撑面试追问。

## AIOps 不是聊天机器人

聊天界面只是交互方式。

真正的 AIOps 需要：

- 数据。
- 规则。
- 模型。
- 上下文。
- 流程。
- 权限。
- 审批。
- 审计。
- 验证。
- 反馈。

坏架构：

```text
raw logs（原始日志）
  -> LLM（大语言模型）
  -> "root cause is database"（未经证据确认就断言数据库是根因的错误示例）
  -> auto restart production（直接自动重启生产的错误示例）
```

好架构：

```text
alert（告警）
  -> SLO impact（服务目标影响）
  -> recent changes（近期变更）
  -> logs / metrics / traces（日志、指标与链路）
  -> runbook retrieval（检索操作手册）
  -> LLM summary with evidence（带证据的大语言模型摘要）
  -> human approval（人工批准）
  -> controlled automation（受控自动化）
  -> verify SLI（验证服务指标）
  -> postmortem updates knowledge（复盘更新知识）
```

## 闭环总架构

一个适合个人作品集的 AIOps 闭环：

```text
Demo service（示例服务）
  -> Prometheus metrics（Prometheus指标）
  -> Grafana dashboard（图形仪表盘）
  -> Alertmanager alert（处理器告警）
  -> FastAPI webhook receiver（FastAPI回调接收器）
  -> Redis dedup（Redis去重）
  -> MySQL incident store（MySQL事故记录存储）
  -> Kafka event stream（Kafka事件流）
  -> pandas feature table（pandas特征表）
  -> scikit-learn anomaly signal（机器学习异常信号）
  -> vector database runbook retrieval（向量数据库检索操作手册）
  -> OpenAI summary（通过OpenAI模型生成摘要）
  -> human approval（人工批准）
  -> Ansible / script action（Ansible或脚本动作）
  -> Prometheus verifies recovery（Prometheus验证恢复）
  -> RCA updates runbook and rules（根因分析更新手册和规则）
```

这条链路把本知识库的技术栈串起来了。

## 分层输入输出

| 层 | 输入 | 输出 | 代表技术 |
|---|---|---|---|
| 数据层 | 指标、日志、链路、告警、变更 | 可查询数据 | Prometheus、Loki、OpenTelemetry、MySQL |
| 检测层 | SLI、规则、特征 | 告警、异常分数 | Alertmanager、scikit-learn |
| 关联层 | 告警、拓扑、变更、时间窗口 | incident candidate | Redis、Kafka、MySQL |
| 解释层 | 上下文、runbook、历史事故 | 证据化摘要 | RAG、OpenAI API |
| 建议层 | runbook、策略、风险等级 | 下一步检查和动作 | LLM、规则引擎 |
| 行动层 | 审批后的动作 | 自动化执行结果 | Ansible、脚本、CI/CD |
| 验证层 | SLI、告警、业务指标 | 恢复判断 | Prometheus、Grafana |
| 学习层 | RCA、行动项、反馈 | 更新规则/模型/文档 | Markdown、GitHub、向量库 |

每一层都应该有清晰边界。不要让 LLM 同时承担所有角色。

## 数据层

数据层决定 AIOps 上限。

需要收集：

| 数据 | 工具 | 用途 |
|---|---|---|
| 指标 | Prometheus | SLI、SLO、异常检测 |
| 日志 | Loki / Elasticsearch | 错误证据 |
| 链路 | OpenTelemetry | 依赖和延迟路径 |
| 告警 | Alertmanager | 事件入口 |
| 变更 | GitHub Actions / CI/CD | 根因候选 |
| Runbook | Markdown / GitHub | 处理知识 |
| RCA | Markdown / MySQL | 学习反馈 |
| 拓扑 | Kubernetes / CMDB | 依赖关系 |

最低数据质量要求：

- 有 service 标签。
- 有 owner。
- 有环境 env。
- 有时间戳。
- 有 request id / trace id。
- 告警能关联 runbook_url。
- 变更能关联 commit、artifact、service。

没有这些字段，后面的聚类、RAG、根因分析都会变弱。

## 检测层

检测层不应该只靠机器学习。

推荐顺序：

```text
SLO burn-rate alert
  + static thresholds
  + anomaly detection
  + forecast
```

各自职责：

| 方法 | 优点 | 风险 |
|---|---|---|
| SLO 告警 | 贴近用户影响 | 需要定义好 SLI |
| 静态阈值 | 简单可解释 | 不适应周期变化 |
| 异常检测 | 发现模式偏离 | 可能误报 |
| 预测 | 提前发现容量问题 | 依赖历史数据 |

初学项目中：

- Prometheus 负责 SLO 和阈值。
- pandas 负责统计和特征。
- scikit-learn 负责异常分数。
- Alertmanager 负责通知入口。

## 关联层

关联层回答：

```text
这些告警是不是同一个事故？
最近有没有相关变更？
和历史哪次事故相似？
是否来自同一个下游依赖？
```
最小关联规则：

```text
same service（相同服务）
  + same 10-minute window（同一十分钟窗口）
  + same dependency（相同依赖）
  + same recent change（相同近期变更）
  -> incident candidate（候选事故分组）
```

数据模型：

```json
{
  "incident_candidate_id": "ic-20260702-001",
  "service": "order-api",
  "start_time": "2026-07-02T09:10:00Z",
  "alerts": ["OrderApiHighErrorRate", "OrderApiHighLatency"],
  "recent_changes": ["CHG-2026-0702-001"],
  "suspected_dependencies": ["mysql", "payment-api"],
  "slo_impact": {
    "availability_burn_rate": 14.4
  }
}
```

关联不是定根因，只是组织上下文。

## 解释层

解释层必须带证据。

坏输出：

```text
根因是数据库。
```
好输出：

```text
候选原因：数据库连接池配置异常。
证据：
1. 09:02 有 order-api 发布 CHG-2026-0702-001。
2. 09:10 5xx 错误率从 1% 升到 23%。
3. Loki 日志显示 database connection timeout 占 5xx 的 78%。
4. Runbook 指出该现象需要检查连接池和最近配置 diff。
缺失信息：
- 当前没有数据库连接池 active 指标。
- 当前没有慢查询统计。
```

LLM 适合做：

- 摘要。
- 证据组织。
- 缺失信息列举。
- runbook 步骤改写。
- 状态更新草稿。

LLM 不适合做：

- 无证据定根因。
- 绕过审批执行动作。
- 访问无权限数据。
- 替代 SLO 和监控规则。

## 建议层

建议层输出“下一步”。

建议应该分级：

| 类型 | 示例 |
|---|---|
| next_checks | 检查最近发布、数据库连接池、下游 payment-api |
| safe_actions | 拉取日志摘要、创建工单、通知 owner |
| approval_required_actions | 回滚、扩容、摘除实例 |
| forbidden_actions | 删除数据、绕过权限、无审批重启核心服务 |

结构化输出示例：

```json
{
  "summary": "order-api 5xx 和延迟升高，时间上接近一次发布。",
  "possible_causes": [
    {
      "title": "发布引入数据库连接池配置问题",
      "evidence": ["CHG-2026-0702-001", "database timeout logs"],
      "confidence": 0.68
    }
  ],
  "next_checks": ["检查连接池 active 指标", "对比配置 diff"],
  "safe_actions": ["创建 incident 文档", "生成状态更新草稿"],
  "approval_required_actions": ["回滚 order-api"],
  "missing_information": ["数据库慢查询统计"]
}
```

## 行动层

行动层必须有护栏。

| 动作 | 自动化级别 |
|---|---|
| 收集日志 | 可自动 |
| 查询最近变更 | 可自动 |
| 检索 runbook | 可自动 |
| 生成摘要 | 可自动 |
| 创建工单 | 可自动或半自动 |
| 发送客户通知 | 人工确认 |
| 扩容 | 审批后自动 |
| 回滚 | IC 审批后执行 |
| 删除数据 | 禁止自动 |

护栏：

- 权限最小化。
- 审批。
- 审计。
- 幂等。
- 超时。
- 回滚。
- 执行前后验证。
- 高风险动作人工确认。

## 验证层

执行动作后必须验证。

验证问题：

- SLI 是否恢复？
- 错误预算是否停止燃烧？
- 告警是否停止 firing？
- 用户工单是否停止增加？
- 日志是否停止出现关键错误？
- 业务指标是否恢复？
- 变更或自动化是否产生新问题？

恢复标准示例：

```text
order-api 5xx < 1% 持续 15 分钟。
p95 延迟 < 300ms 持续 15 分钟。
SLO burn rate < 1。
无新增用户投诉。
```

没有验证层，自动化只是“执行了动作”，不是“解决了问题”。

## 学习层

学习层让系统变聪明。

每次 incident 后更新：

- 告警规则。
- SLO。
- runbook。
- RCA。
- 变更门禁。
- 自动化脚本。
- RAG 知识库。
- 异常检测特征。
- 权限和审批规则。

闭环公式：

```text
incident -> postmortem -> action items -> updated system -> fewer repeat incidents（事故、复盘、改进行动、系统更新与减少重复故障）
```

如果没有 RCA 和行动项，AIOps 只是一次性分析，不是闭环。

## 最小作品集项目

项目名：

```text
zero-to-aiops-lab
```

目录：

```text
projects/zero-to-aiops-lab/
  README.md
  docker-compose.yaml
  app/
  prometheus/
  grafana/
  alertmanager/
  api/
  analysis/
  runbooks/
  incidents/
  rca/
  changes/
```

目标链路：

1. 启动一个模拟 `order-api`。
2. Prometheus 采集 `http_requests_total` 和延迟直方图。
3. Grafana 展示四个黄金信号。
4. Alertmanager 触发 `OrderApiHighErrorRate`。
5. FastAPI 接收 webhook。
6. Redis 基于 fingerprint 去重。
7. MySQL 保存 incident candidate。
8. Kafka 发布 `alert.received` 事件。
9. pandas 生成 1 小时告警统计。
10. scikit-learn 给异常分数。
11. RAG 检索 `order-api` runbook。
12. OpenAI 生成证据化摘要。
13. 人工审批回滚建议。
14. Ansible 或脚本执行只读检查。
15. Prometheus 验证恢复。
16. RCA 更新 runbook 和告警规则。

## 最小数据模型

### alert_event

```json
{
  "alert_id": "a-001",
  "alertname": "OrderApiHighErrorRate",
  "service": "order-api",
  "severity": "page",
  "starts_at": "2026-07-02T09:10:00Z",
  "labels": {
    "env": "prod",
    "owner": "team-order"
  },
  "annotations": {
    "runbook_url": "runbooks/order-api-high-error-rate.md"
  }
}
```

### incident_candidate

```json
{
  "incident_id": "inc-001",
  "service": "order-api",
  "status": "investigating",
  "alerts": ["a-001"],
  "recent_changes": ["CHG-001"],
  "slo_impact": {
    "burn_rate": 14.4
  }
}
```

### aiops_analysis

```json
{
  "incident_id": "inc-001",
  "summary": "order-api 5xx increased after a recent release.",
  "possible_causes": [],
  "next_checks": [],
  "safe_actions": [],
  "approval_required_actions": [],
  "sources": []
}
```

结构化数据越清楚，LLM 和自动化越安全。

## AIOps 成熟度

| 阶段 | 能力 | 目标 |
|---|---|---|
| L0 手工运维 | 人看监控、手工排障 | 知道问题在哪里 |
| L1 可观测 | 指标、日志、链路、告警齐全 | 看得见 |
| L2 规则治理 | SLO、告警分级、runbook | 少而准 |
| L3 数据分析 | pandas、SQL、异常检测 | 找模式 |
| L4 智能辅助 | LLM 摘要、RAG 检索、相似事故 | 辅助人 |
| L5 受控自动化 | 审批下自动执行 | 减少 toil |
| L6 闭环学习 | RCA 反哺规则、模型、runbook | 持续变好 |

建议学习路线：

```text
先做到 L2。
再做 L3。
再做 L4。
谨慎进入 L5。
最后追求 L6。
```

不要从“全自动修复”开始。

## 衡量 AIOps 是否有效

不要只展示“模型能回答”。

要看结果：

| 指标 | 说明 |
|---|---|
| MTTA | 告警到确认时间 |
| MTTR | 告警到恢复时间 |
| pages per shift | 值班每班 page 数 |
| duplicate alert ratio | 重复告警比例 |
| actionable alert ratio | 可行动告警比例 |
| runbook coverage | page 告警有 runbook 的比例 |
| change correlation coverage | incident 能关联变更的比例 |
| RCA action completion | 复盘行动项完成率 |
| repeat incident rate | 重复事故比例 |
| automation success rate | 自动化成功率 |
| human override rate | 人工否决模型建议比例 |

一个好的 AIOps 项目应该能说明：

```text
它让告警更少了吗？
让定位更快了吗？
让恢复更快了吗？
让重复事故更少了吗？
```
## Guardrails

AIOps 必须有护栏文档。

至少写清楚：

- 数据脱敏规则。
- 权限边界。
- 模型可访问数据范围。
- 哪些动作可自动。
- 哪些动作必须审批。
- 哪些动作禁止自动。
- 审计日志字段。
- 回滚方案。
- 人工 override。
- 失败降级。

示例：

```text
禁止 LLM 直接执行生产回滚。
LLM 只能生成建议。
回滚必须由 IC 审批，并由自动化平台记录执行人、时间、参数和结果。
```

## 常见失败模式

### 把 AIOps 当成聊天机器人

聊天只是入口。核心是数据、流程、护栏、验证和学习。

### 没有 SLO

没有 SLO，就不知道异常是否真的重要。

### 数据标签混乱

没有 service、owner、env，告警聚类和路由会很弱。

### 没有变更上下文

很多事故和变更有关。没有变更数据，RCA 会慢。

### 直接自动修复

没有审批、验证、回滚的自动化很危险。

### 没有验证恢复

执行动作不等于恢复服务。

### 没有复盘学习

没有 RCA 和行动项，系统不会变聪明。

### 模型输出无证据

没有证据的“根因”只是猜测。

## 入门练习：画出自己的 AIOps 闭环

目录：

```text
projects/aiops-loop-design/
  README.md
  architecture.md
  data-flow.md
  guardrails.md
  incident-example.md
```

`architecture.md` 必须写：

- 观测数据来源。
- 告警如何进入系统。
- 如何去重和关联。
- 如何关联最近变更。
- 如何检索 runbook。
- LLM 生成什么。
- 哪些动作可自动。
- 哪些动作必须审批。
- 如何验证恢复。
- RCA 如何回写知识库。

`guardrails.md` 必须写：

- 自动动作白名单。
- 审批动作清单。
- 禁止动作清单。
- 审计字段。
- 降级方案。

## 常用对象字典

### alert

告警事件，是 AIOps 闭环入口之一。

### incident candidate

由多个告警、变更、拓扑和时间窗口关联出的事件候选。

### evidence

支持结论的证据，例如指标、日志、变更、runbook、RCA。

### recommendation

下一步检查或动作建议。

### guardrail

安全护栏，例如审批、权限、回滚、审计。

### feedback

人工确认、RCA、行动项、模型评估结果。

## 面试怎么讲

AIOps 不是单个工具，而是一条从观测到行动再到学习的工程闭环。它先收集指标、日志、链路、告警、变更、runbook 和 RCA；再通过 SLO、规则和异常检测发现问题；随后把告警、拓扑、时间窗口和最近变更关联成 incident candidate；再用 RAG、历史事故和 LLM 生成带证据的摘要、候选原因和下一步建议；最后在权限、审批、审计和回滚护栏下执行动作，并用 SLI/SLO 验证恢复。

我会特别强调边界：LLM 适合总结、解释、检索、生成建议和状态更新草稿，不应该无审批执行高风险生产动作。真正的闭环来自学习层，每次 incident 和 RCA 都要更新告警规则、runbook、变更门禁、异常检测特征和知识库，这样系统才会越用越好。

## 学习检查清单

- [ ] 我能画出 AIOps 从观测到学习的闭环。
- [ ] 我能说明每一层的输入和输出。
- [ ] 我能区分检测、关联、解释、建议、行动、验证、学习。
- [ ] 我能说明 SLO 在 AIOps 中的作用。
- [ ] 我能说明 LLM 的安全边界。
- [ ] 我能设计最小 AIOps 项目切片。
- [ ] 我能写 incident candidate 数据模型。
- [ ] 我能写 guardrails 文档。
- [ ] 我能说明如何验证自动化动作是否成功。
- [ ] 我能说明 RCA 如何反哺知识库。
- [ ] 我能列出衡量 AIOps 有效性的指标。

## 面试题

1. AIOps 闭环包含哪些阶段？
2. 为什么 AIOps 不能等同于机器学习模型？
3. 为什么 AIOps 不能等同于聊天机器人？
4. 指标、日志、链路、告警、变更分别提供什么信息？
5. 告警降噪和根因分析有什么区别？
6. RAG 在 AIOps 中属于哪一层？
7. LLM 在 AIOps 中适合做什么？
8. 自动化修复为什么需要审批、验证和回滚？
9. 什么是 incident candidate？
10. 如何证明 AIOps 项目真的改善了运维效率？
11. RCA 如何让 AIOps 形成闭环？
12. 一个从 0 到 1 的 AIOps 作品集应该包含什么？

## 学习证据

学完后，在 GitHub 留下这些证据：

- 一张 AIOps 架构图或文字数据流。
- 一份最小闭环项目说明。
- 一份 `guardrails.md`。
- 一个 `incident-example.md`。
- 一个 alert -> incident candidate -> analysis 的数据样例。
- 一次模拟告警从触发到 RCA 的完整记录。
- README 说明如何衡量这个 AIOps 闭环是否有效。
