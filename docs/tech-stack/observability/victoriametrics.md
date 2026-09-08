# VictoriaMetrics

> 学习目标：能理解 VictoriaMetrics 为什么适合作为 Prometheus 兼容的时序数据存储，能讲清单机版、集群版、vmagent、vmalert、MetricsQL、remote write、retention、cardinality 和 Grafana 查询链路，并能跑通一个最小指标写入和查询实验。

## 官方资料

优先读这些 VictoriaMetrics 官方资料：

- [VictoriaMetrics Quick start](https://docs.victoriametrics.com/victoriametrics/quick-start/)
- [Single-node VictoriaMetrics](https://docs.victoriametrics.com/victoriametrics/single-server-victoriametrics/)
- [VictoriaMetrics Cluster](https://docs.victoriametrics.com/victoriametrics/cluster-victoriametrics/)
- [vmagent](https://docs.victoriametrics.com/victoriametrics/vmagent/)
- [vmalert](https://docs.victoriametrics.com/victoriametrics/vmalert/)
- [MetricsQL](https://docs.victoriametrics.com/victoriametrics/metricsql/)
- [VictoriaMetrics topologies](https://docs.victoriametrics.com/guides/vm-architectures/)
- [Grafana integration](https://docs.victoriametrics.com/victoriametrics/integrations/grafana/)

说明：本文按 VictoriaMetrics 官方资料结构整理，用 AIOps 指标存储、长期查询、告警规则和 Grafana 数据源场景重新讲解，不复制官方全文。

## 官方知识地图

VictoriaMetrics 官方资料可以按这张地图理解：

```text
VictoriaMetrics（时序数据存储与查询系统）
  -> install（安装）
     -> single-node（单机模式）
     -> cluster（集群模式）
     -> cloud（托管云形态）
     -> helm / operator（包管理或控制器部署）
  -> write data（写入数据）
     -> Prometheus remote write（Prometheus远端写入）
     -> vmagent scrape and remote write（vmagent采集与远端写入）
     -> import APIs（数据导入接口）
  -> query data（查询数据）
     -> Prometheus-compatible API（兼容Prometheus的接口）
     -> MetricsQL（VictoriaMetrics查询语言）
     -> VMUI（内置查询界面）
     -> Grafana（仪表盘平台）
  -> alerting（告警处理）
     -> vmalert（规则计算组件）
     -> recording rules（预计算记录规则）
     -> alerting rules（告警规则）
     -> Alertmanager（告警处理器）
  -> productionization（生产化）
     -> retention（保留期）
     -> capacity planning（容量规划）
     -> backups（备份）
     -> limits（资源限制）
     -> security（安全）
  -> cluster（集群模式）
     -> vminsert（写入接收组件）
     -> vmstorage（数据存储组件）
     -> vmselect（查询组件）
```

本文覆盖：

1. VictoriaMetrics 与 Prometheus 的关系。
2. 单机版和集群版的使用边界。
3. vmagent、vmalert、MetricsQL 和 Grafana 的位置。
4. 最小 Docker 实验：写入一条指标并查询。
5. 常见排障：写不进去、查不到、cardinality 过高、retention 配错。

## 老师带你从“存得下”走到“查得准、能恢复”

假设你已能在 Grafana 看到曲线，现在想保留三个月历史并汇总多个环境。先把工作分开：采集器去拿数字，存储系统保留数字，查询程序解释数字，规则程序根据数字判断是否报警。VictoriaMetrics 可以承担时序存储和查询，也提供采集与规则组件；产品名字相近，不等于这些组件职责相同。

Time series（时间序列）由指标名与完整标签集合标识，Sample（样本）是某个时间的值。`service=checkout` 和 `service=payment` 属于不同序列，实例标签变化也可能产生新序列。先能看懂这一点，才能理解后面的容量、去重和查询。

### 第一课：采集成功与远端保存成功有什么差别

vmagent 抓到了指标，但远端写入可能失败。它可以将待发送数据暂存在队列，网络恢复后继续发送。`-remoteWrite.tmpDataPath` 指定持久队列位置，`-remoteWrite.maxDiskUsagePerURL` 限制每个远端地址的磁盘缓冲；达到限制时会丢弃最旧缓冲以接收新数据。具体行为参考 [vmagent 持久队列说明](https://docs.victoriametrics.com/victoriametrics/vmagent/)。

因此“有磁盘队列”不是“不丢数据”的无条件保证。你要知道队列是否挂在持久盘、可用空间是多少、平均进入速率与恢复后的发送速率是什么。假设积压 60 GB，恢复后净排空速率仅每秒 10 MB，理想情况下也要约 100 分钟；还需要考虑新数据、抖动和重试。

发送目标路径、租户、协议和认证都要匹配。单机与集群的写入、查询入口不同，不要把 `vminsert`（写入接收）地址当查询地址。查询“没有这条数据”时，分别检查采集、队列、写入、租户、指标名、时间和标签，逐段缩小问题。

### 基础实验与故障实验：容量为何突然放大一千倍

前置条件是 Node.js，在仓库根目录运行合成模型，不启动存储服务。

```powershell
node examples/teacher-led-reliability-lab/telemetry.mjs victoriametrics
node examples/teacher-led-reliability-lab/telemetry.mjs victoriametrics --fault
```

正常为 10,000 条序列，每 15 秒采一次，一天约 57,600,000 个样本。故障模式加入能与原组合形成 1,000 倍组合的标签，序列变成 10,000,000，样本也放大一千倍。`labelMultiplier` 是课堂标签组合倍数，`samplesPerDay` 是估算样本数，`issue` 提醒超过本模型预算。

先用 `序列数 × 86400 ÷ 抓取间隔秒数` 复算。输出不符先检查目录和参数。实验不写文件、不连接服务，无须清理；保留正常与故障输出。公式不是磁盘字节公式，实际容量要测压缩、索引、活跃序列变化和查询负载，不能用固定每样本字节数包打天下。

### 第二课：读写分离后的状态在哪里

单机版在一个进程中组合写入、存储与查询，操作相对集中。集群把入口、数据保存与查询拆为 `vminsert`、`vmstorage`、`vmselect`。读写分工让不同层可以扩展，但数据仍由存储层负责。增加查询进程不能修复底层磁盘已满，增加写入入口也不能自动提升存储写能力。

多副本采集同一目标可能带来重复样本。去重的前提是标签和时间策略符合预期；同名但不同业务含义的数据不能因为“看起来重复”就合并。配置去重间隔前先核对采集周期、HA 标签处理和希望保留的分辨率，再用固定输入验证。

Retention（保留期）决定数据何时退出可查询范围，备份决定其他时间点如何恢复，复制提高某些故障下的可用性。这三件事互不替代。误删会影响在线数据，副本可能一起反映错误；备份若未验证恢复，也不能证明可用。

### 第三课：慢查询怎样定位而不乱调上限

先查一个指标和一个实例的短窗口，确认数据存在；再增加标签、时间范围和聚合。范围越长、序列越多、步长越小，通常需要处理更多数据。Recording rule（记录规则）把常用结果预计算，可以减少重复成本，但也占规则计算与存储资源，并固定了一部分聚合口径。

MetricsQL 是 VictoriaMetrics 的查询语言，和 PromQL 有兼容与扩展关系。迁移时对你实际使用的表达式逐条回归，比较空值、窗口和边界数据，而不是凭兼容标签假定全部结果完全相同。仪表盘、告警和 AIOps 特征计算都可能依赖这些细节。

生产要看活跃序列、样本进入速率、队列积压、查询耗时、磁盘余量和数据新鲜度。查询成功但返回旧窗口，不代表写入健康；写入健康但租户配置错，用户也可能查不到。为租户入口配置身份与权限，限制昂贵查询，并对敏感指标名和标签进行治理。

### 第四课：升级、恢复和课堂反证

升级前记录组件版本、参数、数据路径、租户路由、规则和备份位置，读目标版本兼容说明。先在隔离环境用固定样本验证写入、范围查询和规则结果，再逐步推进。回滚不仅要有旧镜像，还要确认新版本写入的数据格式和状态是否支持旧版本读取。

故障模拟再加一个问题：“采集进程所在节点丢失，队列放在容器临时目录。”学生应能推断重建进程并不恢复丢失的队列文件。修订方案把持久缓冲与故障域、容量告警、恢复流程一起定义，再用隔离部署演练确认。纸面推导先标为模拟，不能当真实节点故障验证。

### 面试课堂：30 秒、3 分钟和连续追问

30 秒：“VictoriaMetrics 保存并查询时序数据，vmagent 负责采集转发，vmalert 计算规则。我会沿采集、队列、写入、存储、查询和通知分别验证，并重点管理基数、保留与恢复。”

3 分钟用多集群长期监控场景讲单机与集群分工，再算标签变化对容量的影响，解释缓冲、去重和备份边界。追问：“加 vmselect 能解决写入慢吗？”定位存储瓶颈再回答。“有复制还需要备份吗？”区分可用性和历史恢复。“数据后来补到了，告警会自动补发吗？”规则评估窗口、回放和通知行为需分别核实，不能自动推定。

设计题：分支机构网络每天可能中断两小时，估算采集缓冲、排空速率和缺口告警。事故题：指标突然翻倍，比较采集副本、标签、去重与新业务流量再判原因。GitHub 学习证据包括容量表、两次实验、租户路由、备份恢复记录与真实写入查询结果。

## 进阶课堂：从一条样本推演整个指标平台

### 先看时间：事件发生、被采集和被查询不是同一时刻

同学，把一条样本写成“指标名、标签集合、时间戳、值”四部分。时间戳说明这个值对应的时间；到达存储的时间说明传输延迟；你点击查询的时间只是观察时刻。网络中断后补传历史样本，不代表故障发生在补传这一刻。

我们用一个纸面案例练习：10:00 产生故障样本，网络 10:20 才恢复，10:21 查询最近五分钟。样本即使已经补齐，也可能不在这个窗口里。先扩大到包含 10:00 的区间，确认时间语义，再讨论规则当时为何没触发。把查询窗口改大可以帮助诊断，但不能修复实时检测迟到。

数据新鲜度是“最新可信样本距离现在多久”，不是单纯接口延迟。一个毫秒级返回的查询也可能只返回半小时前的数据。为关键服务建立新鲜度约束，并区分业务值为零、序列不存在、样本过旧和查询失败。AIOps 特征计算要保留这些状态，不能统一填成零后告诉模型“系统没有流量”。

### 再看查询：点、范围、步长各负责什么

即时查询在一个评估时刻求表达式结果，范围查询在一系列评估时刻求结果。Step（步长）决定这些评估点之间相隔多久，抓取间隔决定原始样本多久采一次，二者不是一个参数。图上每分钟一个点，不代表采集器每分钟才工作一次。

假设原始抓取间隔 15 秒，查询跨度七天，面板却要求每秒一个评估点。系统可能做很多额外计算，但没有凭空产生一秒一次的新原始测量。按屏幕分辨率、排障目的和指标变化速度选择步长；关键峰值的回溯再缩短范围精查。不要把折线看起来平滑当成数据更准确。

聚合时也要明确维度。把多个实例的请求数相加常有业务意义，把不同分母的错误率直接平均却可能误导。一个实例 1,000 次请求错 10 次，另一个 10 次错 1 次，整体错误率是 11 除以 1,010，约 1.09%，不是两者百分比的算术平均 5.5%。先聚合可加的分子和分母，再计算比例。

### 多节点少了一台：结果还能信多少

集群查询涉及多个存储节点，某个节点未返回时，要面对可用性与完整性的取舍。返回已有部分数据可能让页面继续显示，却可能低估请求量或错误数；拒绝不完整结果会让查询报错，但避免用户把缺失当正常。VictoriaMetrics 有部分响应相关标识和 `-search.denyPartialResponse` 控制，行为需结合实际复制设置理解。参见 [集群高可用与查询说明](https://docs.victoriametrics.com/victoriametrics/cluster-victoriametrics/)。

副本因子的配置必须与真实数据放置匹配。只在查询端声明“我有多份副本”，不会帮你创造缺失的副本。设计时记录写入复制、查询端假设、节点故障域和丢失多少节点后的保证，再用隔离环境验证。这里讨论的是结果完整性，不是在宣称系统提供关系数据库式事务一致性。

课堂设计题：大屏可接受显示“部分数据”，预算告警却不能低估错误率。你可以给两类查询设置不同的失败策略与显眼状态提示，并为查询失败单独告警。关键不是永远返回数字，而是让使用者知道数字的可信边界。

### 标签治理：删掉一个维度会损失什么

高基数不能只靠“把标签全删了”解决。实例标签有助于定位故障节点，版本标签有助于比较灰度发布，租户标签可能承担业务分析语义。先画使用清单：谁需要这个维度、取值增长多快、在哪一层使用、需要保留多久，再决定保留、聚合或迁移到日志与链路。

例如请求路径中含订单号，直接把原始路径作为指标标签会持续增长。可以把 `/orders/123` 和 `/orders/456` 归为路由模板 `/orders/{id}`，具体订单标识保留在受控日志或链路里。这样保留“哪个接口慢”的指标价值，又避免为每笔订单创建序列。处理前后用小样本核对路由分类，不要把不同业务接口错误合并。

标签也可能携带敏感信息。用户邮箱、令牌片段或完整查询参数既增加基数，也扩大泄露面。治理应在采集或生成端尽早完成；后端查询权限不能撤回此前已经广泛复制出去的数据。变更标签规则时记录开始时间，提醒历史与新数据的查询口径可能不同。

### 教你算恢复预算：缓冲不是容量本身

假设正常进入速率每秒 5 MB，中断两小时，未计压缩与额外开销的输入量约 36,000 MB。网络恢复后总发送能力每秒 8 MB，扣除继续到达的 5 MB，真正清积压只有每秒 3 MB，理想排空约 12,000 秒，也就是 200 分钟。课堂统一十进制单位，实际测量还要考虑队列编码、重试和磁盘波动。

现在问你：把网络恢复就宣布完成有什么问题？积压仍可能持续三个多小时，历史查询和实时告警都会受数据迟到影响。验收至少包括队列回落、最新样本及时、随机历史区间补齐、发送拒绝恢复和磁盘安全余量。若发送能力不高于进入速率，队列就没有稳定排空的条件。

生产预算还要考虑灾难恢复同时发生的负载：存储重建、副本恢复、大范围历史查询会竞争磁盘与网络。不要只用空闲实验环境的吞吐规划故障恢复。记录典型查询混合负载下的指标，再约定恢复时限制昂贵查询、分批补传或临时扩容的触发条件。

### 老师追问：监控系统坏了，谁来监控它

用同一条失效链路报告自己的失效会形成盲点。可以增加独立的外部探测、通知链路心跳和数据新鲜度检查，重要控制信息保留在不依赖该存储的渠道。独立并不意味着再建一套同样复杂的系统，而是确保关键失败有不同路径可见。

为本章提交一份设计记录：采集与存储职责、容量假设、部分响应策略、缓冲预算、恢复验收和剩余风险。面试时先解释假设，再展示算式和证据；若只做了纸面推导，就明确说“设计练习”，不要把它描述成线上运维经验。

## 场景开场

你已经用 Prometheus 采集指标，Grafana 也能看图。问题来了：

```text
Prometheus 本地磁盘越来越大。
历史数据只保留 15 天，不够做月度复盘。
多个集群各有 Prometheus，查询很分散。
PromQL 查询慢，指标标签越来越多。
```

这时候你需要思考：Prometheus 继续负责采集和规则，还是把长期时序数据写到一个更适合存储和查询的后端？

VictoriaMetrics 的位置就是这里：它常被用作 Prometheus 兼容的高性能时序数据库，也可以配合 vmagent、vmalert、Grafana 和 Alertmanager 组成一套完整的指标链路。

## 一句话人话版

VictoriaMetrics 是一个 Prometheus 兼容的时序数据库和监控组件集合：它接收指标数据，按时间序列存储，支持 MetricsQL / PromQL 风格查询，再给 Grafana、vmalert 和 AIOps 分析使用。

## 小白可能会问

- VictoriaMetrics 和 Prometheus 是替代关系还是配合关系？
- 单机版和集群版怎么选？
- vmagent、vmalert、vminsert、vmselect、vmstorage 分别是什么？
- MetricsQL 和 PromQL 有什么关系？
- remote write 是什么？
- retention 为什么很重要？
- label cardinality 为什么会把时序数据库拖垮？
- Grafana 怎么查 VictoriaMetrics？
- AIOps 里为什么需要长期指标数据？

## 为什么要学

AIOps 很依赖历史数据。只有最近几小时指标，你能定位当前故障；有几个月指标，你才能做容量趋势、发布影响分析、异常检测训练集和 SLO 复盘。

VictoriaMetrics 在 AIOps 中常用于：

- 长期保存 Prometheus 指标。
- 汇聚多集群、多环境指标。
- 支持 Grafana 查询和大盘。
- 用 vmalert 做 recording rules 和 alerting rules。
- 给 pandas、机器学习、RAG 事故分析提供历史指标证据。

## 是什么

VictoriaMetrics 可以先理解成：

```text
metrics receiver + time series storage + query API
```

它接收的数据通常长这样：

```text
http_requests_total{service="order-api",status="500"} 42 1710000000000
```

这条数据包含：

| 部分 | 含义 |
|---|---|
| `http_requests_total` | 指标名 |
| `service="order-api"` | 标签 |
| `status="500"` | 标签 |
| `42` | 当前样本值 |
| `1710000000000` | 时间戳 |

VictoriaMetrics 把这些样本按时间序列存储起来。查询时，你可以用 MetricsQL 或 PromQL 风格表达式取出它们。

## 它解决什么问题

### 问题 1：Prometheus 本地存储边界

Prometheus 非常适合采集、短期查询和告警，但当你要做长期、大规模、多集群指标存储时，需要考虑远程存储。

VictoriaMetrics 可以作为 remote write 目标：

```text
Prometheus / vmagent（指标采集端）
  -> remote write（远端写入）
  -> VictoriaMetrics（时序数据存储与查询系统）
  -> Grafana / vmalert / API（图形查询、规则计算或接口访问）
```

### 问题 2：指标查询需要集中入口

多个 Prometheus 分散在不同环境时，AIOps 分析很难统一查询。VictoriaMetrics 可以做集中存储或查询后端。

### 问题 3：需要历史指标做复盘和建模

异常检测、容量预测、SLO 复盘都需要历史窗口。retention 不能拍脑袋，要根据业务需求和磁盘容量设计。

## 核心原理

单机版数据流：

```text
scrape target / remote write（抓取目标或远端写入）
  -> VictoriaMetrics single-node（单机时序数据库）
      ingest（写入处理）
      storage（存储）
      query（查询）
  -> Grafana / API / vmalert（图形界面、接口或规则计算）
```

集群版数据流：

```text
vmagent / Prometheus（指标采集与发送端）
  -> vminsert（写入接收组件）
  -> vmstorage（数据存储组件）
  -> vmselect（查询组件）
  -> Grafana / vmalert / API（图形查询、规则计算或接口访问）
```

### 关键术语拆解

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| time series | 指标名加标签组合形成的一条时间线 | 查询和存储的基本单位 |
| sample | 某个时间点的值 | 每次采集都会产生样本 |
| label | 指标维度 | 服务、实例、状态码、环境 |
| cardinality | 时间序列数量 | 过高会增加内存、磁盘和查询压力 |
| retention | 数据保留时间 | 决定历史查询和磁盘成本 |
| remote write | Prometheus 把指标写到远程后端 | 常用于长期存储 |
| MetricsQL | VictoriaMetrics 查询语言 | 兼容 PromQL 思路并有扩展 |
| vmagent | 指标采集和转发组件 | 可替代只做采集转发的 Prometheus |
| vmalert | 规则计算和告警组件 | 执行 recording / alerting rules |

## 核心知识树

### 单机版 VictoriaMetrics

是什么：一个 all-in-one 进程，负责写入、存储和查询。

为什么需要：学习、单机部署、中小规模场景启动简单。

怎么工作：

```text
write API（写入接口）
  -> local storage（本地存储）
  -> query API（查询接口）
```

怎么用：Docker 启动，挂载数据目录，配置 retention。

坏了怎么查：看进程是否启动、端口是否监听、数据目录是否可写、retention 是否过短。

### 集群版 VictoriaMetrics

是什么：把写入、存储和查询拆成多个组件。

为什么需要：水平扩展、复制、多租户和更大规模。

怎么工作：

```text
vminsert accepts writes
vmstorage stores data
vmselect handles queries
```

怎么用：生产上用 Helm、Operator 或官方拓扑建议规划。

坏了怎么查：看 vminsert 到 vmstorage 的连接、vmselect 的 `-storageNode` 配置、各组件指标和日志。

### vmagent

是什么：指标采集和 remote write 转发组件。

为什么需要：如果 Prometheus 只负责 scrape 和转发，vmagent 可以作为更轻量的采集器。

怎么工作：

```text
targets（抓取目标）
  -> vmagent scrape（vmagent抓取）
  -> relabel / filter / aggregate（标签重写、过滤与聚合）
  -> remote write（远端写入）
  -> VictoriaMetrics（时序数据存储与查询系统）
```

怎么用：配置 scrape targets 和 remote write URL。

坏了怎么查：看 targets 是否 up、remote write 是否失败、relabel 是否误删指标。

### vmalert

是什么：规则计算组件。

为什么需要：查询 VictoriaMetrics 并执行 recording rules 和 alerting rules。

怎么工作：

```text
vmalert（规则计算组件）
  -> query VictoriaMetrics（查询时序数据库）
  -> evaluate rules（评估规则）
  -> send alerts to Alertmanager（发送告警给处理器）
```

怎么用：配置 datasource URL、rule 文件、Alertmanager URL。

坏了怎么查：看规则语法、查询是否返回数据、Alertmanager 是否可达。

### MetricsQL

是什么：VictoriaMetrics 的查询语言，和 PromQL 思路相近。

为什么需要：查询指标、聚合、计算 rate、做 dashboard 和规则。

怎么工作：

```text
selector（序列选择器）
  -> range function（时间窗口函数）
  -> aggregation（聚合）
  -> vector result（向量查询结果）
```

怎么用：

```text
rate(http_requests_total[5m])
sum by (service) (rate(http_requests_total[5m]))
```

坏了怎么查：先查原始指标是否存在，再查 label，再逐层加函数和聚合。

## 架构和数据流

入门架构：

```text
app / node_exporter（应用或主机指标导出器）
  -> Prometheus or vmagent scrape（由采集器周期抓取）
  -> VictoriaMetrics single-node（单机时序数据库）
  -> Grafana dashboard（图形仪表盘）
  -> vmalert rules（告警或记录规则）
  -> Alertmanager（告警处理器）
```

生产集群架构：

```text
many clusters（多个集群）
  -> vmagent（指标采集与转发组件）
  -> vminsert（写入接收组件）
  -> vmstorage（数据存储组件）
  -> vmselect（查询组件）
  -> Grafana / vmalert / API（图形查询、规则计算或接口访问）
```

AIOps 扩展：

```text
VictoriaMetrics query API（时序数据库查询接口）
  -> Python / pandas（Python与表格数据分析）
  -> machine learning anomaly score（机器学习异常评分）
  -> LangGraph / RAG summary（流程编排与检索增强摘要）
  -> incident evidence（事故证据）
```

## 安装与启动

使用 Docker 启动单机版：

```powershell
docker run -d --name victoriametrics `
  -p 8428:8428 `
  -v vmdata:/victoria-metrics-data `
  victoriametrics/victoria-metrics:latest `
  -retentionPeriod=30d
```

预期结果：

```text
容器处于 running 状态，浏览器访问 http://localhost:8428/vmui/ 可以打开 VMUI。
```

检查：

```powershell
docker ps --filter "name=victoriametrics"
Invoke-WebRequest http://localhost:8428/health
```

## 配置详解

常见启动参数：

| 参数 | 含义 | 新手容易错在哪里 |
|---|---|---|
| `-retentionPeriod=30d` | 数据保留 30 天 | 默认保留期不符合复盘需求 |
| `-storageDataPath` | 数据目录 | 容器不挂卷，重建后数据丢失 |
| `-httpListenAddr=:8428` | HTTP 监听地址 | 端口没映射，外部访问不到 |
| `-promscrape.config` | 单机版内置 scrape 配置 | 学习阶段可用，生产多用 vmagent |
| `-search.maxQueryDuration` | 查询最长时间 | 大查询被提前终止 |

Prometheus remote write 示例：

```yaml
remote_write:
  - url: "http://victoriametrics:8428/api/v1/write"
```

## 常用命令

```powershell
docker logs victoriametrics
Invoke-WebRequest http://localhost:8428/health
Invoke-WebRequest "http://localhost:8428/api/v1/query?query=up"
docker stop victoriametrics
docker rm victoriametrics
```

每条命令在检查什么：

| 命令 | 作用 | 正常结果 | 异常时先看 |
|---|---|---|---|
| `docker logs` | 看启动和错误日志 | 没有持续报错 | 参数、数据目录、端口 |
| `/health` | 健康检查 | HTTP 200 | 容器状态、端口映射 |
| `/api/v1/query` | 查询指标 | JSON result | 指标是否写入 |
| `docker stop/rm` | 清理实验容器 | 容器停止删除 | 是否还有进程占端口 |

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 关键字段 / 参数 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `/api/v1/write` | Prometheus remote write 入口 | Prometheus 配置 remote write | URL、网络 | 指标写入 | 网络不通、路径写错 |
| `/api/v1/import/prometheus` | 导入 Prometheus 文本格式 | POST 文本指标 | 指标名、labels、value | 可查询到数据 | 格式不对 |
| `/api/v1/query` | 即时查询 | `query=up` | MetricsQL 表达式 | JSON result | label 写错 |
| `/api/v1/query_range` | 范围查询 | `query=rate(...[5m])` | start/end/step | 时间序列结果 | step 太小 |
| `vmagent` | 采集和转发 | remote write 到 VictoriaMetrics | scrape config | targets 正常 | relabel 误删 |
| `vmalert` | 规则和告警 | query + rules + alertmanager | rule file | 触发告警 | datasource 配错 |

## 在 AIOps 中的作用

VictoriaMetrics 属于 AIOps 的指标存储层：

```text
metrics（指标）
  -> VictoriaMetrics（时序数据存储与查询系统）
  -> query / dashboard / alert rules（查询、仪表盘与告警规则）
  -> anomaly detection / RCA / capacity planning（异常检测、根因分析与容量规划）
```

它给 AIOps 提供：

- 更长时间窗口的指标证据。
- 多集群指标汇聚。
- SLO burn rate 和历史趋势查询。
- 异常检测训练数据。
- 事故复盘中的指标截图和查询结果。

## 入门实验

### 实验目标

手动写入一条 AIOps demo 指标，再用查询 API 查出来。

### 实验步骤

启动 VictoriaMetrics 后，写入一条 Prometheus 文本格式指标：

```powershell
$body = 'aiops_demo_requests_total{service="order-api",status="200"} 42'
Invoke-WebRequest `
  -Method Post `
  -Uri "http://localhost:8428/api/v1/import/prometheus" `
  -Body $body
```

查询：

```powershell
Invoke-RestMethod "http://localhost:8428/api/v1/query?query=aiops_demo_requests_total"
```

也可以打开：

```text
http://localhost:8428/vmui/
```

输入：

```text
aiops_demo_requests_total
```

### 验证结果

你应该能看到类似：

```json
{
  "metric": {
    "__name__": "aiops_demo_requests_total",
    "service": "order-api",
    "status": "200"
  },
  "value": [...]
}
```

这说明写入路径、存储路径和查询路径都通了。

### 如果没有成功

按顺序检查：

1. `docker ps` 是否看到 `victoriametrics`。
2. `http://localhost:8428/health` 是否返回 200。
3. 写入文本是否包含指标名和值。
4. 查询的指标名是否一致。
5. 是否把容器端口映射到本机 8428。

## 常见故障排查

### 写入后查不到

- 可能原因：写入端点错误、请求体格式错误、查询指标名不一致。
- 检查命令：`docker logs victoriametrics`，再查 `/api/v1/query`。
- 解决办法：先用 `/api/v1/import/prometheus` 写最小指标，确认链路。

### Grafana 连接失败

- 可能原因：URL 写错、容器网络不通、数据源类型不对。
- 检查方法：Grafana data source test，或者从 Grafana 容器里 curl VictoriaMetrics。
- 解决办法：同一个 compose 网络中使用服务名，例如 `http://victoriametrics:8428`。

### 查询很慢

- 可能原因：label cardinality 高、时间范围太大、step 太小、表达式太复杂。
- 检查方法：缩小时间范围，先查原始 selector，再逐步加聚合。
- 解决办法：优化 label 设计，限制高基数字段，增加 recording rules。

### 磁盘增长很快

- 可能原因：retention 太长、采集频率太高、指标数量太多。
- 检查方法：看数据目录大小、active series 数量、scrape 配置。
- 解决办法：调整 retention、降低无用指标、过滤高基数标签。

### vmalert 不发告警

- 可能原因：规则查询无结果、Alertmanager URL 错、规则时间窗口不合适。
- 检查方法：看 vmalert 日志、手动执行查询、检查 Alertmanager。
- 解决办法：先写简单 always-firing 规则确认链路，再调业务规则。

## 面试怎么讲

可以这样说：

```text
VictoriaMetrics 是 Prometheus 兼容的时序数据库和监控组件集合。我会把它放在 AIOps 指标存储层，用 Prometheus 或 vmagent 采集指标，通过 remote write 写入 VictoriaMetrics，再由 Grafana 查询展示、vmalert 执行规则、Python 或 AIOps 服务读取历史指标做异常检测和复盘。单机版适合学习和中小规模，集群版通过 vminsert、vmstorage、vmselect 分离写入、存储和查询，适合更大规模。使用时我会重点关注 retention、label cardinality、查询范围、备份和安全访问，不会把它当成万能监控平台。
```

## 学习检查清单

- [ ] 我能解释 VictoriaMetrics 和 Prometheus 的关系。
- [ ] 我能区分单机版和集群版。
- [ ] 我能说出 vmagent、vmalert、vminsert、vmselect、vmstorage 的作用。
- [ ] 我能写入一条 demo 指标并查询。
- [ ] 我能解释 remote write。
- [ ] 我能说明 retention 和 cardinality 的风险。
- [ ] 我能把 VictoriaMetrics 接到 Grafana 的位置讲清楚。
- [ ] 我能说明它在 AIOps 历史指标分析中的价值。

## 面试题

1. VictoriaMetrics 解决了 Prometheus 哪些边界问题？
2. 单机版 VictoriaMetrics 适合什么场景？
3. VictoriaMetrics 集群版的 vminsert、vmstorage、vmselect 分别做什么？
4. vmagent 和 Prometheus scrape 有什么关系？
5. vmalert 在告警链路里做什么？
6. MetricsQL 和 PromQL 有什么关系？
7. 什么是 label cardinality？为什么危险？
8. retention 应该怎么设计？
9. Grafana 查询 VictoriaMetrics 的链路是什么？
10. AIOps 为什么需要长期指标数据？

## 学习证据

学习完成后，把下面内容提交到 GitHub：

- `docker-compose.yaml` 或启动命令记录。
- 一张 VMUI 查询 `aiops_demo_requests_total` 的截图。
- 一份 `prometheus.yml` remote write 示例。
- 一份 `victoriametrics-notes.md`：说明 retention、cardinality、单机/集群边界。
- 一条排障记录：写入后查不到时如何定位。
