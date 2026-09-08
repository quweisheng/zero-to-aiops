# SLI / SLO / SLA

> 目标：不是背会三个缩写，而是能从用户体验出发定义 SLI，把 SLI 写成可测量的 SLO，用错误预算指导发布和稳定性工作，并用 burn rate 告警把“服务是否伤害用户”接入 Prometheus、Alertmanager 和 AIOps。

## 官方资料

优先读这些 Google SRE 官方资料：

- [Google SRE Book - Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Workbook - Implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [Google SRE Workbook - Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Google SRE Workbook - Error Budget Policy](https://sre.google/workbook/error-budget-policy/)
- [Google SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE Book - Embracing Risk](https://sre.google/sre-book/embracing-risk/)

说明：本文基于 Google SRE 对 SLI、SLO、SLA、错误预算和 SLO 告警的官方说明，整理成 AIOps 初学者可以落地的中文教程。

## 场景开场

凌晨 2 点，值班群里来了三条告警：

```text
CPU 92%
order-api 5xx rate 1.2%
p99 latency 3s
```

到底哪条应该叫醒人？

如果没有 SLI/SLO，团队很容易把“能采集到的指标”都当成告警依据。结果是：

- CPU 高就告警，但用户可能没受影响。
- 平均延迟正常，但 p99 已经很差。
- 错误率升高一点点，不知道是否值得打断发布。
- 每个团队对“服务还行不行”有不同口径。

SLI/SLO/SLA 的价值，是把稳定性从“感觉”和“资源指标”变成“用户体验指标 + 明确目标 + 预算决策”。

## 一句话人话版

SLI/SLO/SLA 是描述服务可靠性的三层语言：SLI 是怎么量，SLO 是量到多少算够好，SLA 是对外承诺以及没做到会有什么后果。

## 小白可能会问

- CPU、内存、磁盘能不能直接当 SLI？
- 为什么 Google SRE 说不要从能采集什么指标开始？
- SLO 为什么不能设成 100%？
- 99%、99.9%、99.99% 差别到底有多大？
- 错误预算怎么影响发布？
- burn rate 是什么？
- 为什么 SLO 告警要用多个窗口？
- 低流量服务为什么 SLO 告警容易误报？
- SLA 和 SLO 有什么实际区别？
- AIOps 异常检测为什么要对齐 SLO？

## 官方知识地图

Google SRE 的 SLO 知识可以按这张图理解：

```text
User journey（用户操作路径）
  -> What users care about（用户关心什么）
     -> availability（可用性）
     -> latency（延迟）
     -> correctness（正确性）
     -> freshness（新鲜度）
     -> durability（持久性）
  -> SLI（服务水平指标）
     -> good events / total events（好事件数除以有效事件数）
     -> latency threshold（延迟阈值）
     -> freshness threshold（新鲜度阈值）
     -> correctness checks（正确性检查）
  -> SLO（服务水平目标）
     -> target（目标值）
     -> window（统计窗口）
     -> scope（范围）
     -> exclusions（排除项）
     -> data source（数据源）
  -> Error budget（错误预算）
     -> 1 - SLO（一减目标比例）
     -> release decision（发布决策）
     -> reliability work priority（可靠性工作优先级）
  -> Burn-rate alerting（预算燃烧率告警）
     -> short window（短窗口）
     -> long window（长窗口）
     -> page vs ticket（立即通知与工单的区分）
  -> AIOps（智能运维）
     -> SLO-centered anomaly detection（围绕服务目标的异常检测）
     -> alert prioritization（告警优先级）
     -> incident impact（事故影响）
```

初学路线：

```text
choose user journey（选择用户路径）
  -> define good and bad events（定义好坏事件）
  -> write availability SLI（编写可用性指标）
  -> write latency SLI（编写延迟指标）
  -> choose SLO target（选择目标）
  -> calculate error budget（计算错误预算）
  -> create recording rules（创建记录规则）
  -> create burn-rate alerts（创建燃烧率告警）
  -> use budget in change decisions（用预算参与变更决策）
```

## 老师带你从一次用户操作算可靠性

先不要背三个缩写。假设你在网页点击“提交订单”，最关心的是订单正确保存并及时得到结果。服务器 CPU 低、进程存活，只能说明某些内部状态。SLI 是 Service Level Indicator（服务水平指标），用一个可计算的量描述用户体验；SLO 是 Service Level Objective（服务水平目标），规定它在某个窗口内达到什么值；SLA 是 Service Level Agreement（服务水平协议），涉及对外约定及其责任，具体以双方约定为准。

我们先写分母：哪些请求属于要承诺的有效请求？再写分子：什么样的结果算好？若只把 HTTP 200 算成功，却漏掉业务返回“扣款失败”，指标可能很好看，用户却无法完成交易。客户端主动取消、无权限请求、健康探测是否计入，都要在规则里明确并保持一致。

### 第一课：99.9% 是怎样算出来的

假设观察窗口内有 10,000 个有效请求，成功 9,990 个，成功比例就是 99.9%。允许失败的比例是 0.1%，这部分叫 Error budget（错误预算）。它表达为可靠性和变更速度之间的讨论依据，不能理解为“计划让十个用户失败”。超过预算时，应按事先约定的策略处理可靠性风险。

请求比例和时间比例不是同一个口径。一个请求量很低的小时出现一次失败，与高峰一分钟全部失败，影响人数可能不同。不要把请求型 SLO 随意换算成固定停机分钟数。低流量时一个失败就让比例剧烈变化，需要结合失败数量、合成探测和业务重要性判断。

### 基础实验：纸笔与程序互相检查

本机准备 Node.js，在仓库根目录运行，不需要安装监控平台。

```powershell
node examples/teacher-led-reliability-lab/lab.mjs slo
node examples/teacher-led-reliability-lab/lab.mjs slo --fault
```

正常案例 10,000 次中失败 5 次，错误比例 0.0005，预算允许比例 0.001，燃烧率为 `0.0005 / 0.001 = 0.5`。应看到 `WITHIN_BUDGET`（在课堂预算内）。故障案例失败 100 次，错误比例 1%，燃烧率为 10，出现 `BUDGET_EXCEEDED`（超出预算）。这是同一窗口下的比例比较，推算长期耗尽时间还需要流量与错误表现持续近似稳定。

`total` 是有效事件数，`bad` 是坏事件数，`successRate` 是成功比例，`burnRate` 是燃烧率。先手算再核对。输出不符先查目录、参数和脚本版本。脚本不写文件也不创建服务，无须清理；保存两份输出和自己的口径说明。它验证算术，不验证真实日志采集完整性。

### 故障实验：分母选错会让什么结论翻转

再做一个纸面演练：核心交易 100 次失败 10 次，健康探测 9,900 次全部成功。若混在一起，错误比例是 0.1%；只看核心交易，错误比例是 10%。你应能解释差异来自分母，不是系统突然发生变化。修复方法是按用户路径定义 SLI，再保留全站汇总供其他用途。

恢复验收也要按同一口径。观测系统漏采时出现空结果，不能当错误数为零。明确数据新鲜度、有效样本数和缺失策略，必要时触发“监控数据缺失”事件。清理仅涉及自己写的案例记录，建议保留错误计算和修正版作为反例。

### 第二课：为什么告警要看长短窗口

短窗口发现快，但容易被瞬时波动触发；长窗口更稳定，却可能在故障结束后仍保持高值。组合窗口的目的是兼顾持续影响与当前状态，阈值应由服务目标和允许的通知负担推导。可参考 [Google SRE 的 SLO 告警章节](https://sre.google/workbook/alerting-on-slos/)，先理解其假设，再用于自己的流量与目标。

延迟目标同样先定义好事件，例如“有效请求在 300 毫秒内完成”。按延迟桶统计满足阈值的请求，有时比只看单个 P95 更容易对应错误预算。不要平均不同实例的分位数来得到总体分位数；要先合并适当分布或事件计数，再计算整体结果。

生产设计还要明确指标归属、规则版本、数据保留、跨租户权限和告警路由。目标更新是一次策略变更，需要记录原因与生效时间，避免为了让报表变绿事后调整口径。AIOps 使用 SLO 时，应把用户影响和预算作为排序线索，并保留缺失数据与低样本的不确定性。

### 面试课堂：30 秒到 3 分钟

30 秒：“SLI 测量用户体验，SLO 规定窗口内的目标，SLA 是对外约定。先定义有效事件和好事件，用错误预算讨论发布与可靠性，再设计能反映真实影响的告警。”

3 分钟用订单案例讲分子分母、目标窗口、燃烧率、长短窗口和数据缺失。追问：“为什么不定 100%？”讨论成本、依赖和可测量性。“低流量服务怎么做？”解释比例波动、绝对数量和合成探测。“CPU 高但 SLO 正常要叫醒人吗？”结合容量风险和紧急性，不能只凭一个资源阈值。

生产设计题：为同步下单和异步报表分别设计 SLI，后者还需考虑 Freshness（新鲜度：数据或任务结果落后多久）。事故题：仪表盘达标但用户投诉，检查统计范围、业务成功定义和采集缺失。GitHub 学习证据是口径文档、实验输出、反例和规则变更记录。

## 算术课堂：把可靠性承诺算成能执行的规则

### 先定义用户动作，再选择可测量事件

同学，用户点击“提交订单”后，页面显示已接收，后台十分钟后才真正落单。如果我们只统计接收接口的 HTTP 成功率，可能得到很漂亮的数字，却没有测到用户最在意的结果。SLI 是服务质量指标，它的观察位置和事件定义必须对应真实用户目标。

你可以分别定义“请求被正确接受”和“被接受的有效订单在约定时间内完成”。前者观察同步接口，后者观察异步流程。它们有不同分母、时间窗口和失败分类，不能混成一个百分比。对批处理任务，按时完成、结果完整、结果正确也可能需要不同指标。

怎样判断该把哪些事件排除？先明确业务合同，再检查排除是否可独立识别。无效参数请求是否计入，依赖故障是否计入，维护窗口是否排除，都应在测量前写明，不能故障后为了让数字好看临时改口径。还要观察被排除事件数量，避免排除规则误伤真实用户请求。

### 用十万个请求认识错误预算

课堂约定一个窗口内总共有 100,000 次有效请求，目标是 99.9% 成功。那么允许的坏请求比例为 0.1%，对应 100 次坏请求。若已有 40 次失败，已消耗 40%，剩余 60 次。错误预算不是鼓励制造故障，而是帮助团队讨论可靠性与变更速度的有限风险空间。

如果目标改成 99.99%，同样分母只允许 10 次失败。多一个“9”意味着允许失败量缩小十倍，不是把阈值改得更好看而已。监测精度、依赖能力、容量、恢复速度和成本都可能需要改变。目标应由用户需要、历史能力与工程成本共同决定。

请求型预算按事件数量计算，时间型预算按满足条件的时间计算。低流量时一次失败和高峰时一万次失败，在时间窗口里可能都只占一分钟，但用户影响不同。选择哪种口径，要说明它衡量的是什么，不能拿请求预算直接换算成宕机分钟而不说明假设。

### 为什么燃烧率比固定错误率更有解释力

Burn rate（预算燃烧率）是当前坏事件比例与允许坏事件比例之比。目标 99.9% 时允许 0.1%，当前错误率若为 1%，燃烧率就是 10。意思是按当前比例持续运行，预算消耗速度是目标允许速度的十倍，不是说当前已经消耗了整月预算的十倍。

燃烧率、观察窗口和整个目标窗口要一起看。持续多久、流量是否稳定、统计口径是否一致，都会影响“还能撑多久”的推算。课堂先按恒定流量练算，再明确真实生产需要用实际事件量累计预算，避免把理想化速度估算当精确倒计时。

长窗口帮助确认问题持续，短窗口帮助确认现在仍在发生。组合窗口告警是为了平衡发现速度与噪声，并非照抄一组阈值就适用于所有业务。具体设计参见 [Google SRE 多窗口预算告警](https://sre.google/workbook/alerting-on-slos/)，学习时同时写出每组阈值想覆盖的事故时间尺度。

### 平均延迟很好，为什么用户仍在投诉

想象九个请求各用 100 毫秒，一个请求用 10 秒，平均约 1.09 秒。平均值既没表达九个人较快，也没突出一个人非常慢。分位数描述分布位置，例如 p95 是约 95% 观测值不超过的边界，不是“最慢那 5% 的平均值”。

若承诺大部分请求低于 300 毫秒，使用“满足延迟阈值的事件数除以有效事件总数”能直接对应目标。直方图通过区间计数帮助估算分布，但区间设计会影响边界精度。先让测量覆盖你真正关心的阈值，再讨论漂亮的曲线。

两个实例的 p95 通常不能直接平均为整体 p95，因为分位数本身没有携带完整分布。应在支持的指标结构上先合并可聚合的桶计数，再计算所需分位数；具体查询还要核对经典与原生直方图的语法差异。请回到 Prometheus 章节理解指标类型，而不是记一个看起来通用的公式。

### 没流量、没采到、真为零，要分成三种状态

分母为零时，数学上的比例没有定义。它既不自动代表 100% 成功，也不自动代表故障。若业务本来就低频，需要说明暂无有效样本；若理应持续有流量，却突然没有数据，就可能是采集链路或业务入口问题。

因此 SLO 面板应同时显示样本量、数据新鲜度和采集健康。合成探测可以检查关键路径是否能工作，但不能未经说明就与真实用户请求混成同一个分母。真实流量很低时，探测给出额外证据，不会凭空创造用户体验统计。

AIOps 系统尤其容易犯统一补零的错误。模型可能把“监控停止采集”识别为“系统负载很低”，从而抑制告警。数据预处理要保留缺失原因，并让下游在证据不足时降低置信度或转人工判断。

### 用预算管理变更，而不是只画一张月报

假设核心服务预算消耗过快，团队可以暂停高风险功能发布，优先处理可靠性缺口；但必要安全修复与事故恢复不能机械地全部禁止。预算策略应事先约定适用变更、例外审批、恢复正常节奏的条件和负责人。

设计题是一个共享数据库支撑多个服务：每个服务用户目标不同，不能只给数据库一个 CPU 阈值就替代全部业务 SLO。先定义服务用户结果，再分析共同依赖风险和共享容量预算。依赖指标帮助诊断，业务指标决定是否伤害用户。

课堂交付包含一页口径说明、十万请求算例、零分母处理、预算告警理由和一次变更决策记录。请别人故意提出反例：用户超时但后台成功、重复请求、维护期间数据缺失。能说明这些如何计入，才表明你掌握的是测量设计，而不是三个缩写。

## 三个概念

| 名词 | 全称 | 一句话理解 |
|---|---|---|
| SLI | Service Level Indicator | 衡量服务表现的指标 |
| SLO | Service Level Objective | SLI 应该达到的目标 |
| SLA | Service Level Agreement | 对外承诺，通常带业务或合同后果 |

例子：

```text
SLI: order-api 外部请求成功率
SLO: 最近 30 天成功率 >= 99.9%
SLA: 如果低于 99.9%，客户可获得服务补偿
```

最容易记错的是：

```text
SLI 是指标。
SLO 是目标。
SLA 是承诺和后果。
```

## SLI 是什么

Google SRE 对 SLI 的核心定义是：对服务水平某个方面的仔细定义的定量度量。

翻成人话：

```text
SLI = 用数字衡量用户体验。
```

常见 SLI：

| 服务类型 | SLI | 用户关心的问题 |
|---|---|---|
| HTTP API | 可用性 | 请求能不能成功 |
| HTTP API | 延迟 | 请求快不快 |
| 批处理 | 新鲜度 | 数据是否及时更新 |
| 批处理 | 覆盖率 | 应处理的数据是否处理完 |
| 存储 | 持久性 | 写入的数据以后能不能读到 |
| 搜索 | 正确性 | 返回结果是否正确 |
| 消息系统 | 消费延迟 | 消息是否及时被处理 |

重要原则：

```text
不要用所有指标当 SLI。
选择少数能代表用户体验的指标。
```

Google SRE 也提醒，用户真正关心的体验有时只能通过代理指标近似。例如客户端延迟最贴近用户，但你可能只有服务端延迟。要清楚写明测量来源。

## SLO 是什么

SLO 是 SLI 的目标。

格式：

```text
在某个时间窗口内，某个 SLI 达到某个目标。
```

示例：

```text
order-api 在任意连续 30 天内，外部用户 HTTP 请求成功率 >= 99.9%。
```

一个完整 SLO 要写清楚：

| 项目 | 示例 |
|---|---|
| 服务 | order-api |
| 用户旅程 | 外部用户下单接口 |
| SLI | HTTP 请求成功率 |
| good event | 非 5xx 响应 |
| total event | 所有外部用户请求 |
| 时间窗口 | 30 天滚动窗口 |
| 目标 | 99.9% |
| 排除项 | 健康检查、压测、维护窗口 |
| 数据来源 | Prometheus `http_requests_total` |

不完整写法：

```text
order-api 可用性 99.9%。
```

问题是没人知道：

- 哪些请求算进来？
- 4xx 算失败吗？
- 健康检查算吗？
- 时间窗口是什么？
- 数据从哪里来？
- 维护窗口是否排除？

## SLA 是什么

SLA 是面向用户或客户的服务级别协议。

判断一个目标是不是 SLA，可以问：

```text
没做到会发生什么明确后果？
```
如果没有明确补偿、赔偿、服务条款后果，那通常是 SLO，不是 SLA。

SRE 通常不单独制定 SLA，因为 SLA 涉及产品、商务、法务、客户关系。但 SRE 会帮助：

- 定义可测量的 SLI。
- 制定内部 SLO。
- 降低触发 SLA 后果的风险。

## 为什么 SLO 不该是 100%

100% 可靠性几乎不现实，也通常不经济。

原因：

- 硬件会坏。
- 网络会抖。
- 依赖会故障。
- 软件会有 bug。
- 发布和创新需要承担一定风险。

如果目标是 100%，团队会倾向于：

- 不敢发布。
- 过度设计。
- 把大量资源花在用户不一定感知到的可靠性上。
- 把所有小毛刺都当成重大事件。

SLO 的核心是权衡：

```text
足够可靠，但不过度可靠。
```
错误预算就是这个权衡的工具。

## Good Events / Total Events

最常用的 SLI 写法是：

```text
SLI = good events / total events
```

可用性：

```text
good events = 非 5xx 请求
total events = 所有外部用户请求
```

延迟：

```text
good events = 延迟 <= 500ms 的请求
total events = 所有外部用户请求
```

任务完成：

```text
good events = 30 分钟内完成的任务
total events = 应该完成的任务
```

这样写的好处：

- 清晰。
- 可计算。
- 适合错误预算。
- 适合 Prometheus recording rules。

## 不同系统的 SLI

### 请求型服务

例如 API、Web 服务：

| SLI | 定义 |
|---|---|
| 可用性 | 成功请求数 / 总请求数 |
| 延迟 | 足够快的请求数 / 总请求数 |
| 质量 | 未降级响应数 / 总响应数 |
| 吞吐 | 能否处理目标流量 |

### 数据管道

例如 ETL、报表、流处理：

| SLI | 定义 |
|---|---|
| 新鲜度 | 足够新的数据请求数 / 总请求数 |
| 覆盖率 | 成功处理的数据量 / 应处理的数据量 |
| 正确性 | 输出正确的数据量 / 总数据量 |
| 端到端延迟 | 在目标时间内完成的数据量 / 总数据量 |

### 存储系统

例如数据库、对象存储：

| SLI | 定义 |
|---|---|
| 可用性 | 成功读写请求 / 总读写请求 |
| 延迟 | 足够快的读写请求 / 总读写请求 |
| 持久性 | 可成功读回的数据 / 已写入数据 |
| 正确性 | 读到正确数据的请求 / 总请求 |

### AIOps 服务

例如告警分析 API、RAG 助手：

| SLI | 定义 |
|---|---|
| 分析可用性 | 成功生成分析结果 / 分析请求总数 |
| 分析延迟 | 目标时间内完成分析 / 分析请求总数 |
| 检索质量 | 正确 runbook 出现在 top-k / 测试问题总数 |
| 自动化安全 | 无审批高风险动作数应为 0 |

## 延迟 SLI 不要只看平均值

平均值会隐藏长尾。

例如 100 个请求：

```text
95 个请求 50ms
5 个请求 5000ms
```

平均值可能看起来还能接受，但 5% 用户体验很差。

Google SRE 推荐关注分布和百分位，例如 p95、p99。更适合 SLO 的写法是：

```text
99% 的请求在 500ms 内完成。
```

这可以转成 good / total：

```text
good events = duration <= 500ms
total events = all requests
```

比 `histogram_quantile` 更适合算错误预算，因为它直接得到比例。

## Prometheus SLI 示例

假设指标：

```text
http_requests_total{job="order-api",code="200"}
http_request_duration_seconds_bucket{job="order-api",le="0.5"}
```

### 可用性 SLI

错误率：

```text
sum(rate(http_requests_total{job="order-api",code=~"5.."}[5m]))
/
sum(rate(http_requests_total{job="order-api"}[5m]))
```

成功率：

```text
1 -
(
  sum(rate(http_requests_total{job="order-api",code=~"5.."}[5m]))
  /
  sum(rate(http_requests_total{job="order-api"}[5m]))
)
```

### 延迟 SLI

500ms 内完成的比例：

```text
sum(rate(http_request_duration_seconds_bucket{job="order-api",le="0.5"}[5m]))
/
sum(rate(http_request_duration_seconds_count{job="order-api"}[5m]))
```

注意这和 p99 不同。这个表达式直接回答：

```text
有多少比例的请求足够快？
```
## SLO 目标怎么选

不要只根据当前系统表现拍脑袋。

Google SRE 的建议包括：

- 从用户关心什么出发。
- 保持简单。
- 避免绝对目标。
- SLO 尽量少。
- 可以先宽松，再逐步收紧。
- 不要把系统当前表现直接变成目标。

例如：

```text
当前 order-api 成功率 99.98%
```

不代表 SLO 必须设成 99.98%。你还要考虑：

- 用户是否能感知差异？
- 达成更高目标要花多少成本？
- 依赖服务能否支撑？
- 团队是否还有发布速度要求？
- SLA 是否要求更高？

## 错误预算

错误预算是 SLO 允许失败的空间。

```text
错误预算 = 1 - SLO
```

如果 SLO 是 99.9%：

```text
允许错误率 = 0.1%
```
30 天内 1,000,000 个请求：

```text
允许失败请求 = 1,000,000 * 0.001 = 1,000
```

如果已经失败了 800 个请求：

```text
预算已消耗 80%
```
错误预算的作用：

| 状态 | 决策 |
|---|---|
| 预算充足 | 正常发布、实验、迭代 |
| 预算消耗快 | 降低发布风险，关注稳定性 |
| 预算快耗尽 | 暂停高风险变更 |
| 预算耗尽 | 优先修可靠性，复盘和改进 |

错误预算把稳定性讨论从“你感觉危险不危险”变成：

```text
我们还能承受多少失败？
```
## Burn Rate

burn rate 是错误预算燃烧速度。

```text
burn rate = 当前错误率 / SLO 允许错误率
```

SLO 99.9%：

```text
允许错误率 = 0.1% = 0.001
```
如果当前错误率是 1%：

```text
burn rate = 0.01 / 0.001 = 10
```

意思是：

```text
当前错误预算消耗速度是正常允许速度的 10 倍。
```
burn rate 告警比“错误率超过 1%”更通用，因为它和 SLO 目标绑定。

## 多窗口 Burn Rate 告警

Google SRE Workbook 推荐 multiwindow, multi-burn-rate 的思路。

原因：

- 短窗口能快速发现严重故障。
- 长窗口能确认问题不是瞬时毛刺。
- 多个 burn rate 能区分页级告警和工单级告警。

99.9% SLO 的常见起点：

| 严重级别 | 长窗口 | 短窗口 | Burn rate | 预算消耗 |
|---|---|---|---:|---:|
| Page | 1h | 5m | 14.4 | 约 2% |
| Page | 6h | 30m | 6 | 约 5% |
| Ticket | 3d | 6h | 1 | 约 10% |

核心判断：

```text
长窗口超过阈值 AND 短窗口也超过阈值
```

这样可以减少“问题已经恢复但长窗口还没降下来”的持续告警。

## Prometheus 记录规则

先记录错误率，而不是每条告警里重复写复杂 PromQL。

`slo-rules.yml`：

```yaml
groups:
  - name: order-api-slo
    rules:
      - record: job:slo_errors_per_request:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{job="order-api",code=~"5.."}[5m]))
          /
          sum(rate(http_requests_total{job="order-api"}[5m]))

      - record: job:slo_errors_per_request:ratio_rate30m
        expr: |
          sum(rate(http_requests_total{job="order-api",code=~"5.."}[30m]))
          /
          sum(rate(http_requests_total{job="order-api"}[30m]))

      - record: job:slo_errors_per_request:ratio_rate1h
        expr: |
          sum(rate(http_requests_total{job="order-api",code=~"5.."}[1h]))
          /
          sum(rate(http_requests_total{job="order-api"}[1h]))

      - record: job:slo_errors_per_request:ratio_rate6h
        expr: |
          sum(rate(http_requests_total{job="order-api",code=~"5.."}[6h]))
          /
          sum(rate(http_requests_total{job="order-api"}[6h]))
```

## Prometheus 告警规则

99.9% SLO 的允许错误率：

```text
0.001
```
Page 告警：

```yaml
groups:
  - name: order-api-slo-alerts
    rules:
      - alert: OrderApiFastBurn
        expr: |
          (
            job:slo_errors_per_request:ratio_rate1h{job="order-api"} > (14.4 * 0.001)
            and
            job:slo_errors_per_request:ratio_rate5m{job="order-api"} > (14.4 * 0.001)
          )
          or
          (
            job:slo_errors_per_request:ratio_rate6h{job="order-api"} > (6 * 0.001)
            and
            job:slo_errors_per_request:ratio_rate30m{job="order-api"} > (6 * 0.001)
          )
        labels:
          severity: page
          service: order-api
        annotations:
          summary: "order-api is burning error budget quickly"
          description: "The order-api availability SLO is burning too fast."
```

这比“5xx > 1% 就告警”更贴近可靠性目标。

## 低流量服务的坑

低流量服务很难用同样的 burn-rate 告警。

例如 99.9% SLO、每小时只有 10 个请求：

```text
1 个失败请求 = 10% 错误率
```
这会产生极高 burn rate，但可能只是一个偶发请求失败。

处理方向：

- 使用合成流量。
- 合并多个小服务的 SLO 观察。
- 调整产品设计，让单个失败影响变小。
- 用工单而不是 page。
- 对高价值低频请求单独设计流程。

低流量不是不用 SLO，而是 SLO 告警方式要更谨慎。

## SLO 与告警治理

不是所有指标异常都应该叫醒人。

推荐优先级：

```text
用户体验 SLO 被快速消耗
  -> page（需要立即响应的通知）
SLO 被慢速消耗
  -> ticket（工单）
资源指标异常但无用户影响
  -> dashboard / ticket（仪表盘或工单）
单实例问题但服务无影响
  -> automation / repair（自动化与修复）
```

CPU 90% 不是天然 page。它需要回答：

```text
是否正在伤害 SLO？
```

如果没有伤害 SLO，可以作为容量或风险信号，但不一定叫醒人。

## SLO 与 AIOps

AIOps 不应该只追求发现“任何异常”。它应该围绕 SLO 判断“哪些异常重要”。

常见用法：

| AIOps 能力 | 如何对齐 SLO |
|---|---|
| 异常检测 | 优先检测 SLI 相关指标 |
| 告警降噪 | 低影响告警降级，SLO burn 升级 |
| 根因分析 | 以 SLO 受损时间线为中心 |
| 变更关联 | 看变更后 SLI 是否恶化 |
| Runbook 推荐 | 按 SLO 类型推荐排障步骤 |
| 事故分级 | 根据预算消耗和用户影响定级 |
| 报告生成 | 总结 SLO 影响、预算消耗、恢复时间 |

错误示例：

```text
模型发现 CPU 比昨天高 20%，立即 page。
```

更好的做法：

```text
CPU 升高 + latency SLI 恶化 + error budget 快速燃烧 -> page。
```

## 入门实验：order-api SLO

目标：

```text
order-api 在任意连续 30 天内，外部用户 HTTP 请求成功率 >= 99.9%。
```

### SLI 规格

| 项目 | 内容 |
|---|---|
| 用户旅程 | 下单 API |
| good event | 非 5xx 响应 |
| total event | 外部用户请求 |
| 排除项 | 健康检查、压测、维护窗口 |
| 数据源 | Prometheus `http_requests_total` |

### SLO

```text
30 天滚动窗口内，good events / total events >= 99.9%。
```

### 错误预算

```text
允许错误率 = 0.1%
```
如果 30 天 2,000,000 请求：

```text
允许失败请求 = 2,000,000 * 0.001 = 2,000
```

### 告警

Page：

```text
1h and 5m burn rate > 14.4
or
6h and 30m burn rate > 6
```

Ticket：

```text
3d and 6h burn rate > 1
```

### README 要写清楚

```text
本服务不对 CPU 使用率直接 page。
CPU 告警只作为容量和诊断信号。
真正叫醒人的条件是 SLO 快速燃烧。
```

## 常见错误

### 直接用 CPU 当 SLI

CPU 是资源指标，不是用户体验指标。可以辅助诊断，但通常不是 SLI。

### SLO 太多

SLO 太多会没人关注。优先挑少数能代表核心用户体验的指标。

### SLO 设成 100%

这会让错误预算为 0，团队没有发布和实验空间。

### 只看平均延迟

平均值会隐藏长尾。关注百分位或“足够快请求比例”。

### 没写排除项

健康检查、压测、维护窗口是否计入，要提前写清楚。

### 只告警当前错误率

错误率不和 SLO 目标绑定。burn rate 更能表达预算消耗速度。

### 低流量服务照搬高流量规则

一个失败请求就可能触发极高错误率。需要特殊处理。

## 常用公式字典

### 可用性 SLI

```text
availability = successful_requests / total_requests
```

### 错误率

```text
error_rate = bad_events / total_events
```

### SLO

```text
SLI >= target over window
```

### 错误预算

```text
error_budget = 1 - SLO
```

### 允许失败事件

```text
allowed_bad_events = total_events * (1 - SLO)
```

### Burn Rate

```text
burn_rate = current_error_rate / allowed_error_rate
```

### 预算消耗比例

```text
budget_consumed = bad_events / allowed_bad_events
```

## 面试怎么讲

SLI、SLO、SLA 是 SRE 用来管理可靠性的核心语言。SLI 是衡量服务水平的指标，应该从用户体验出发选择，例如请求成功率、足够快请求比例、数据新鲜度、持久性，而不是直接把 CPU、内存当成用户体验。SLO 是对 SLI 的目标，比如 30 天内 99.9% 请求成功；SLA 是对外协议，通常有明确业务或合同后果。

我会用 good events / total events 定义 SLI，再写清楚窗口、范围、排除项和数据来源。SLO 不应该追求 100%，因为错误预算让团队能在可靠性和发布速度之间做决策。告警上，我会用 burn rate，尤其是多窗口多 burn rate，快速发现严重预算燃烧，同时减少瞬时毛刺误报。AIOps 的异常检测和告警降噪也应该围绕 SLO：优先处理真正伤害用户体验、消耗错误预算的异常。

## 学习检查清单

- [ ] 我能解释 SLI、SLO、SLA 的区别。
- [ ] 我能说明为什么 SLI 要从用户体验出发。
- [ ] 我能写出 good events / total events 形式的 SLI。
- [ ] 我能为 HTTP API 设计可用性 SLI。
- [ ] 我能为 HTTP API 设计延迟 SLI。
- [ ] 我能解释为什么平均延迟不够。
- [ ] 我能写完整 SLO：范围、窗口、目标、排除项、数据源。
- [ ] 我能计算错误预算。
- [ ] 我能解释错误预算如何影响发布决策。
- [ ] 我能计算 burn rate。
- [ ] 我能说明多窗口 burn-rate 告警的价值。
- [ ] 我能说明低流量服务的 SLO 告警问题。
- [ ] 我能解释 AIOps 为什么要围绕 SLO 做异常检测。

## 面试题

1. SLI、SLO、SLA 分别是什么？
2. 如何判断一个目标是 SLO 还是 SLA？
3. 为什么不应该从 CPU、内存开始设计 SLI？
4. good events / total events 如何用于可用性 SLI？
5. 延迟 SLI 为什么不建议只看平均值？
6. 什么是错误预算？
7. 为什么 SLO 不应该设成 100%？
8. 错误预算如何影响发布策略？
9. burn rate 是什么？
10. 为什么 SLO 告警要用长短窗口？
11. 低流量服务为什么容易触发误报？
12. 如何为 order-api 写一个完整 SLO？
13. 健康检查和压测流量是否应该计入 SLO？
14. AIOps 异常检测如何对齐 SLO？
15. CPU 高但 SLO 没受损，应该 page 吗？

## 学习证据

学完后，在 GitHub 留下这些证据：

- 一份 `order-api-slo.md`。
- 至少 2 个 SLI 定义：可用性和延迟。
- 一个 30 天 99.9% SLO。
- 错误预算计算示例。
- Prometheus recording rules。
- Prometheus burn-rate alert rules。
- README 解释为什么不直接用 CPU 当 page 告警。
- 一段说明：AIOps 告警优先级如何根据 SLO 和错误预算调整。
