# Prometheus 精讲

> 学习目标：能启动 Prometheus，读懂 `prometheus.yml`，理解数据模型、指标类型、抓取、TSDB、PromQL、recording rules、alerting rules、HTTP API 和 `promtool`，并知道它在 AIOps 数据链路里的位置。

## 官方资料

- [Prometheus Overview](https://prometheus.io/docs/introduction/overview/)
- [Data model](https://prometheus.io/docs/concepts/data_model/)
- [Metric types](https://prometheus.io/docs/concepts/metric_types/)
- [Jobs and instances](https://prometheus.io/docs/concepts/jobs_instances/)
- [Getting started](https://prometheus.io/docs/prometheus/latest/getting_started/)
- [Configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
- [Recording rules](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/)
- [Alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [PromQL basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [PromQL functions](https://prometheus.io/docs/prometheus/latest/querying/functions/)
- [HTTP API](https://prometheus.io/docs/prometheus/latest/querying/api/)
- [Storage](https://prometheus.io/docs/prometheus/latest/storage/)
- [prometheus command line](https://prometheus.io/docs/prometheus/latest/command-line/prometheus/)
- [promtool command line](https://prometheus.io/docs/prometheus/latest/command-line/promtool/)
- [Metric and label naming best practices](https://prometheus.io/docs/practices/naming/)
- [Histograms and summaries best practices](https://prometheus.io/docs/practices/histograms/)

说明：本文基于 Prometheus 官方文档和 AIOps 学习场景重新组织，不复制官方全文。官方文档负责定义概念和参数边界，本文负责把它讲成一条可以从 0 学会的路径。

## 场景开场

“告警又响了，接口超时，CPU 也高。现在先看哪儿？”

如果只会登录服务器执行 `top`，你只能看到此刻谁比较忙，但很难回答这些问题：

- 这个问题是刚发生，还是已经慢慢恶化了两小时？
- 是所有实例都慢，还是只有一台实例慢？
- 是 CPU 高导致接口慢，还是请求量上涨把 CPU 打高了？
- 错误率、延迟、请求量之间有没有时间顺序？
- 问题恢复以后，能不能把过程复盘成数据证据？

Prometheus 要解决的就是这类问题。它把系统状态变成时间序列指标：每隔一段时间采一次数字，把数字和标签存起来，然后让你用 PromQL 查询、画图、告警和复盘。

## 一句话人话版

Prometheus 是一个面向指标的监控和告警系统：它定时抓取 `/metrics`，把数字按时间存成时间序列，再用 PromQL 查询和计算。

## 学习边界

这一篇重点讲 Prometheus Server 本身：

- 数据模型：metric、label、sample、time series。
- 指标类型：Counter、Gauge、Histogram、Summary。
- 抓取模型：job、instance、target、scrape interval。
- 配置文件：`global`、`scrape_configs`、`rule_files`、`alerting`。
- PromQL：选择器、向量、范围、聚合、常用函数。
- 规则：recording rules 和 alerting rules。
- 命令和 API：`prometheus` flags、`promtool`、HTTP API。
- 存储和排障：TSDB、保留时间、高基数、target DOWN。

不在这一篇深入展开：

- Grafana dashboard 设计。
- Alertmanager 分组、抑制、静默和通知。
- Kubernetes service discovery 的完整配置。
- Thanos、Cortex、Mimir、VictoriaMetrics 等长期存储方案。

这些会在后续专题里讲。这里先把 Prometheus 的地基打稳。

## 官方知识地图

Prometheus 官方文档可以按这棵树理解：

```text
Prometheus docs（指标系统官方文档）
  ├── Introduction（介绍）
  │   └── Overview: 是什么、适合什么、不适合什么
  ├── Concepts（概念）
  │   ├── Data model: metric、label、sample、time series（指标、标签、样本与时间序列）
  │   ├── Metric types: Counter、Gauge、Histogram、Summary（计数器、仪表值、直方图与摘要）
  │   └── Jobs and instances: job、instance、target（任务、实例和抓取目标）
  ├── Prometheus Server（Prometheus服务端）
  │   ├── Getting started and installation（入门与安装）
  │   ├── Configuration（配置）
  │   ├── Recording rules（预计算记录规则）
  │   └── Alerting rules（告警规则）
  ├── Querying（查询）
  │   ├── PromQL basics（指标查询语言基础）
  │   ├── Operators（运算符）
  │   ├── Functions（函数）
  │   └── HTTP API（HTTP接口）
  ├── Storage（存储）
  │   ├── local TSDB（本地时序数据库）
  │   ├── retention（保留期）
  │   └── remote read / write（远端读写）
  ├── Command Line（命令行）
  │   ├── prometheus（时序指标采集与查询系统）
  │   └── promtool（Prometheus校验与测试工具）
  ├── Instrumenting（为应用增加埋点）
  │   ├── client libraries（客户端埋点库）
  │   ├── exporters（导出器）
  │   └── exposition formats（指标暴露格式）
  └── Best practices（实践建议）
      ├── naming（命名规范）
      ├── histograms and summaries（直方图与摘要）
      ├── alerting（告警处理）
      └── recording rules（预计算记录规则）
```

本篇按官方这条线来讲。你学完以后再去看官方文档，会知道每一块在解决什么问题，而不是迷失在参数列表里。

## 老师带你从一个数字理解整条监控链

先想象停车场入口累计计数：今天 10,000，昨天 9,000，差值才表示新增。Counter（计数器）保存累计事件，Gauge（仪表值）表示当前状态，如排队人数，可以升降。先问数字代表什么，再选查询方法；否则一条合法表达式也可能给出错误结论。

程序在 `/metrics` 暴露指标，Prometheus 周期抓取，按指标名、标签、时间和值保存样本。标签组合确定时间序列：同名指标的实例或状态不同，可能就是另一条序列。10,000 条序列每 15 秒抓一次，一天约 5,760 万样本；标签基数、保留时间、索引和压缩决定实际成本。

### 第一课：计数器重启后，为什么不能只算首尾差

课堂观测值是 `0、3、7、1、4`，其中一次归零。按已知重置处理，观测增量为 `3+4+1+3=11`，首尾差只有 4。真实 `rate`（单位时间增长率）还包含窗口和采样外推，这个演示不是完整 PromQL 实现。采样间未观测的事件也不能凭空补回。

先按各序列计算增长率，再汇总，通常能避免一个实例归零被其他实例增长掩盖。不要对 Gauge 无条件套 Counter 的规则。计算整体错误比例时，先汇总失败和总请求，再除；不能简单平均不同流量实例的比例。

### 基础实验与故障实验：亲手找出算法误差

本机准备 Node.js，在仓库根目录执行，不需要启动监控服务。

```powershell
node examples/teacher-led-reliability-lab/telemetry.mjs prometheus
node examples/teacher-led-reliability-lab/telemetry.mjs prometheus --fault
```

正常输出 `resetAware: 11`、`estimate: 11`；故障模式使用首尾差，输出 `estimate: 4` 和 `issue: true`。先手算，再解释哪段重启信息被丢掉。若输出不同，检查参数、目录和脚本版本。程序不写文件、不创建服务，无须清理；保存两次输出。后文真实安装与查询实验再验证产品行为。

### 第二课：分位数、持久化和告警各自回答什么

Histogram（直方图）保存延迟分布，经典格式的桶计数是累计的；P95 表示约 95% 请求不超过的耗时，不是最慢 5% 的平均值。不同实例的 P95 通常不能直接平均。经典直方图聚合时保留 `le`（小于等于某桶上界）再估计分位数；原生直方图表示不同，要按版本选择查询。详见 [官方直方图实践](https://prometheus.io/docs/practices/histograms/)。

WAL 是 Write-Ahead Log（预写日志），用于恢复尚未形成持久块的数据；它不免除磁盘和备份管理。双 Prometheus 可以独立抓取以降低采集单点，远端查询去重、长期保留和重复告警仍要单独设计。不要把两个独立本地库当成自动一致的分布式数据库。

`up=1` 证明抓取成功，不证明业务完成。空结果可能是标签变化、数据过期或过滤，并非数值零。监控自身的抓取、规则计算、存储与远端队列；配置变更先校验并测试规则，再观察实际生效。回滚保留旧配置和规则，避免通过删除数据目录处理未知问题。

### 面试课堂：30 秒到 3 分钟

30 秒：“Prometheus 周期抓指标，按指标名和标签保存时序样本，用 PromQL 查询并计算规则。我先确定指标语义与标签成本，再验证抓取、存储和通知链。”

3 分钟沿暴露、发现、抓取、存储、查询、规则和通知讲流程，拿归零和分位数说明取舍。追问：“规则不报警先看什么？”从原始样本、表达式、窗口和规则状态查到通知。“为什么请求标识不适合普通指标标签？”因为持续新增组合会扩大基数，更适合日志和追踪。

设计题：多个集群长期查询，怎样安排本地抓取、远端存储、去重和中断缓冲。事故题：发布后图断但指标名未变，比较标签、时间和抓取状态。GitHub 学习证据包括指标合同、算术实验、真实抓取配置与一条故障查询记录。

## 深入课堂：从抓取配置走到可解释的 PromQL

### 服务发现找到目标，重标记决定保留什么

同学，采集之前先要知道去哪里拿指标。静态目标适合简单实验，服务发现则从集群、云平台或其他注册信息获得候选目标。发现到一个地址不等于已经成功采集，也不等于它适合当前监控职责。

Relabeling（重标记）可以在不同阶段选择目标或调整标签。目标重标记发生在抓取前，指标重标记处理已抓取的样本，远端写入还可能有独立规则。阶段不同，能看到的字段和产生的成本也不同。想减少网络抓取成本，却只在抓取后丢弃样本，就没有省掉前面的传输与解析。

配置变更后先查看目标发现与标签结果，再看抓取状态和实际样本。若目标消失，查发现与筛选；若目标存在但抓取失败，查地址、路径、协议和认证；若抓取成功但某个指标缺失，查指标生成与过滤。这个顺序比同时修改所有相关参数更容易定位原因。

### 每种指标先讲业务意义，再讲函数

Counter 表示累计事件，通常用区间增长或增长率理解；Gauge 表示当前状态，可以升降；Histogram 和 Summary 用于观察分布，但它们的聚合能力和误差机制不同。函数能接受某种输入，不代表业务语义就正确。

例如“当前队列长度”下降可能说明消费追上了，也可能说明队列被清空或数据源切换。对它套计数器重置逻辑，会把正常下降错误地理解成累计重置。反过来，直接展示累计请求数常只会看到持续上升，无法看出最近流量变化。

给每个自定义指标写合同：名称、单位、类型、标签取值、何时更新、是否跨重启保留、用于哪条判断。路由模板通常比原始 URL 更适合标签；请求标识更适合日志与链路关联。命名清楚只能减少误解，不能代替实际数据验证。

### 向量匹配：两边都查得到，为什么相除却为空

PromQL 中很多表达式的结果是一组带标签的序列。两组结果做运算时，要按规则找到对应关系。分子按服务与实例区分，分母只有服务标签，若匹配关系没有按预期表达，就可能得到空结果或匹配错误，而不是正常的逐项除法。

先分别执行分子和分母，列出标签集合，确认它们代表相同统计对象，再决定聚合或显式匹配。不要为了让表达式返回数字随意添加 `group_left`。它表达特定的一对多匹配关系，必须能解释多出来的标签来自哪边、每组是否唯一以及结果是否符合业务。

课堂先不用记复杂语法：写两张小表，一张是各实例失败数，一张是各服务请求总数，尝试手工配对。若连纸面配对都说不清，先修统计口径，再写查询。AIOps 特征流水线也要遵循这个原则，否则合法结果仍可能混合不同服务的数据。

### 记录规则是预计算，也是一份新的数据合同

Recording rule（记录规则）周期计算常用表达式并把结果存成新序列。它能减少看板重复查询成本，统一统计口径，但会增加规则评估与存储负担。记录结果保留哪些标签、使用什么窗口、以什么周期更新，都要与使用者约定。

若原始标签改变，记录规则可能变空；若规则计算变慢，结果可能迟到；若把过多维度保留在结果中，预计算反而制造更多序列。监控规则评估失败、耗时与输出新鲜度，并用有重置、缺失和边界值的样本测试。

告警规则再使用记录结果时，还要把两层评估延迟算进去。图上看似每分钟刷新，不代表新故障一分钟内必然送达值班人员；采集、规则、持续时间和通知等待共同决定端到端延迟。

### 存储为什么怕不断出生的新序列

样本数影响容量，序列数与序列变化也影响索引和内存。一万个稳定实例与不断出现的一万个新请求标识，后者会持续创建新组合。即使某一瞬间活跃序列看起来不高，频繁变化也可能造成长期负担。

先量化活跃序列、采集样本、标签取值增长、磁盘增量和查询成本，再调整采集范围与保留。Prometheus 本地存储适合其定位下的时序任务，不应被当成需要精确逐笔结算的业务账本。重试、重启和采样窗口都可能影响统计，财务或订单事实应以业务系统为准。

高可用部署要说明两份采集的标签、规则与通知如何处理，远端汇总如何避免不恰当重复。副本、远端保存和备份各有职责；恢复时核对历史查询、规则、目标配置和数据缺口，而不是只看进程重新运行。

### 面试反问练习：一个漂亮的数值能否被证明

面试官给你“错误率突然变成零”。先提出至少四种解释：业务真的改善、错误序列被过滤、分子标签改变、分母暴增或时间窗口不合适，再用原始指标和请求日志区分。不要看到绿色就停止检查。

为本章做一张查询卡片：业务问题、原始指标合同、分子分母、标签配对、缺失处理、预期值和反例。选一条真实实验中的表达式完成卡片并保存输出。如果只能背 PromQL 函数名，却无法说出数字代表什么，就继续练这一步。

## 查询时钟课堂：瞬时查询为什么还能拿到稍早的样本

瞬时查询是在一个求值时刻计算表达式，不保证每个目标恰在该毫秒采样。Prometheus 按查询回看与陈旧性规则寻找适用的最近样本。范围查询则在一串步长时刻重复计算表达式，也不是直接导出原始全部样本。这能解释“采集十五秒一次，导出却只有每分钟一个点”。

`step` 决定范围查询求值间隔，`[5m]` 决定范围选择器使用的历史跨度，`scrape_interval` 决定抓取节奏，三者属于不同层。步长变小不会创造更高频真实观测，还可能重复使用相近数据、增加成本；窗口变大则改变统计含义，不只是曲线变平滑。

目标仍在配置但抓取失败，通常看到 `up=0`；目标被服务发现移除或标签变化，则可能看不到原序列。零与不存在需要不同检测。`absent` 或 `absent_over_time` 可表达缺失，但要先定义预期对象和合理窗口，否则正常扩缩容也可能被当成丢失。缺失检查本身不能判断业务停了还是采集器看不到。

排障固定求值时间，把原始选择器、范围函数、聚合与过滤逐层展开。AIOps 导出数据保留单位、步长、缺失标记与表达式版本，不能把特殊数值盲目转成零。训练时也不能用事故结束后补齐的信息生成事故开始时本不可能知道的特征。

## 重标记事故实验：删除标签可能把两条序列挤成一条

前置是纸笔，不改生产采集。写两条样本，指标都叫课堂队列深度，服务和实例相同，只有分区标签分别为甲与乙，值分别十和二十。预测删除分区标签后是什么：两条样本具有相同身份，不会自动正确相加为三十，可能产生冲突或丢失原本的信息。

所以 `labeldrop` 删除标签名，不是聚合函数。想得到总队列深度，应先确认值可相加，再在查询或记录规则按合适维度求和。想不采一类高基数指标，可按指标名丢弃整条样本；想保留指标但去掉维度，则要证明去掉后不会碰撞。配置解析不能证明这个条件。

故障注入是把删除标签名的正则写成匹配所有非空名字，预期几乎全部标签都可能被移除，远超计划。修复为精确匹配目标标签名，并在只读样本上比较改前改后身份集合。验收检查剩余标签、序列唯一性与下游查询，不能只看内存下降就宣布成功。无资源清理，保留原样本、错误规则和修正版。

## 远端写入与恢复：队列能缓冲，不代表永远不会丢

Remote write（远端写入）把采集数据发送给另一时序系统，便于统一保留和查询。暂时落后时，队列与相关本地日志机制能提供一定缓冲，但能力受版本、模式、资源、接收端错误与保留约束限制。不能因为本地历史仍在，就假定任意长中断后都会自动完整补发。

关注最新成功发送时间与当前采集时间的差距、待发送量、重试和丢弃信号。恢复后确认接收端权限、容量与时间限制，再看积压是否收敛。大量重试可能让刚恢复的远端再次过载，增加并发前先估算处理余量。接收方拒绝过旧或不合法数据时，继续重复请求未必有效。

高可用副本应有可区分的身份，在支持的远端方案中正确去重，不能把两份相同业务计数相加。告警发送前是否移除特定副本标签，也要与通知设计一致；环境与租户等隔离维度不能为去重一并删掉。规则和远端配置要版本化，并保留脱敏样本供回归。

保留大小不是磁盘严格配额。写入日志、活跃块和压实会占空间，旧块清理也有时机，应留余量并独立告警。恢复时先区分损坏块、日志与配置，保留原目录证据，按已验证备份恢复。删除 WAL 会丢失其覆盖的数据，不是通用启动修复，本文不提供不加判断的删除命令。

## 多集群设计题：让监控在事故中仍可用

可以让各集群保留本地采集、规则与短期查询，远端负责跨集群汇总和长期保留。这样远端中断不必让本地值班失去全部信号，但本地通知路径也要独立可达。把 DNS、身份、证书、存储和通知依赖画出，检查是否共用正在监控的故障域。

容量按活跃序列、每秒样本、标签变化和查询并发共同估算。采集量相同，频繁创建新序列会增加索引负担；大查询与规则争抢资源也可能拖慢评估。分层或分片时说明依据，验证关键业务不会因为范围调整而掉出所有监控分片。

追问“配置通过为何不告警”，沿发现、抓取、样本、表达式、保留标签、持续时间与通知逐段查证。追问“降抓取频率能否解决高基数”，它降低样本速度但不一定减少身份数量。追问“如何证明修好”，用同一故障样本验证全链路，并说明历史缺口是否仍在。

## Prometheus 在 AIOps 链路中的位置

```text
applications / hosts / databases / middleware（应用、主机、数据库和中间件）
        |
        v
/metrics or exporters（指标接口或指标导出器）
        |
        v
Prometheus scrape（Prometheus周期抓取）
        |
        v
local TSDB（本地时序数据库）
        |
        +--> PromQL queries（指标查询语言）
        +--> Grafana dashboards（Grafana仪表盘）
        +--> recording rules（预计算记录规则）
        +--> alerting rules（告警规则）
        +--> HTTP API（HTTP接口）
                 |
                 v
        Python / AIOps analysis（Python或智能运维分析）
```

在 AIOps 里，Prometheus 通常承担“指标数据入口”和“实时查询计算层”：

| AIOps 能力 | Prometheus 提供什么 |
|---|---|
| 异常检测 | CPU、内存、QPS、错误率、延迟等时间序列 |
| 告警治理 | 规则表达式、告警标签、持续时间、历史触发数据 |
| 根因分析 | 多指标同一时间线对比 |
| SLO | 可用性、错误率、延迟达标率计算 |
| 容量预测 | 历史使用量、增长趋势、峰谷模式 |
| 自动化修复 | 告警触发后给 runbook 提供证据 |

## Prometheus 是什么

Prometheus 是开源监控和告警系统，核心处理对象是时间序列指标。

时间序列可以理解成“一条随时间变化的数字流”：

```text
10:00:00  http_requests_total{job="api",instance="api-1:8000"} 1000
10:00:15  http_requests_total{job="api",instance="api-1:8000"} 1080
10:00:30  http_requests_total{job="api",instance="api-1:8000"} 1160
```

Prometheus 不适合保存日志全文，也不适合保存每一笔订单明细。它适合保存数值指标：

- 请求总数。
- 错误总数。
- 请求耗时分布。
- CPU 使用率。
- 内存使用量。
- 队列长度。
- 活跃连接数。
- 磁盘剩余空间。

一句话公式：

```text
Prometheus = 指标抓取 + 本地时序存储 + PromQL 查询 + 规则计算 + 告警发送
```

## Prometheus 适合什么，不适合什么

适合：

- 数值型时间序列监控。
- 微服务指标。
- 主机和容器资源指标。
- 中间件指标。
- 告警规则计算。
- 故障期间快速查询。

不适合：

- 精确账单系统。
- 保存日志全文。
- 保存链路追踪明细。
- 保存业务明细表。
- 需要永久历史的唯一存储。

Prometheus 的设计重点是可靠和可查询。它的本地单节点模式很适合故障时直接使用，但如果你要多年历史、海量多租户或跨集群全局查询，就要引入远程存储或长期存储方案。

## 架构和数据流

Prometheus 生态可以简化成：

```text
instrumented app（完成埋点的应用）
node exporter（主机指标导出器）
database exporter（数据库指标导出器）
pushgateway（短生命周期任务的指标推送网关）
        |
        v
Prometheus server（Prometheus服务端）
  ├── service discovery（服务发现）
  ├── scrape manager（抓取管理器）
  ├── TSDB（时序数据库）
  ├── PromQL engine（查询计算引擎）
  ├── rule manager（规则管理器）
  └── notification sender（告警发送组件）
        |
        +--> Grafana（仪表盘平台）
        +--> Alertmanager（告警处理器）
        +--> HTTP API clients（HTTP接口客户端）
```

核心组件：

| 组件 | 是什么 | 为什么需要 |
|---|---|---|
| Prometheus server | 抓取、存储、查询、规则计算的主程序 | 指标链路核心 |
| Client library | 应用代码中暴露指标的库 | 让业务服务直接输出 `/metrics` |
| Exporter | 把已有系统状态转换成 Prometheus 指标 | Linux、MySQL、Redis 等通常不能天然输出 Prometheus 格式 |
| Pushgateway | 为短生命周期批任务临时接收指标 | 批任务结束太快，Prometheus 可能来不及抓 |
| Alertmanager | 接收 Prometheus 告警并做通知治理 | 分组、静默、抑制、路由 |
| Grafana | 可视化 dashboard 工具 | 给人看趋势和状态 |

## Pull 抓取模型

Prometheus 默认使用 pull 模型。

```text
target exposes /metrics
        ^
        |
Prometheus scrapes target every scrape_interval
        |
        v
samples written to TSDB
```

流程：

1. 应用或 exporter 暴露 HTTP `/metrics`。
2. Prometheus 根据 `scrape_configs` 找到 targets。
3. Prometheus 按 `scrape_interval` 定时访问 targets。
4. target 返回指标文本。
5. Prometheus 解析样本，附加时间戳，写入 TSDB。
6. 用户用 PromQL 查询，或者规则引擎定期计算。

Pull 模型的好处：

- Prometheus 可以主动判断目标是否可抓取。
- `/targets` 页面能直接显示 UP/DOWN 和错误。
- 服务发现和标签处理集中在 Prometheus 侧。
- 调试时可以用浏览器或 curl 直接看目标 `/metrics`。

不足：

- Prometheus 必须能访问 target。
- 短生命周期任务可能来不及被抓，需要 Pushgateway 或别的模式。
- 跨网络边界时要处理防火墙、服务发现和认证。

## 数据模型

Prometheus 数据模型有四个基础词：metric、label、sample、time series。

### metric name

metric name 是指标名，例如：

```text
http_requests_total
process_cpu_seconds_total
node_memory_MemAvailable_bytes
```

命名建议：

| 建议 | 例子 |
|---|---|
| 名字表达测量对象 | `http_requests_total` |
| 单位放在后缀 | `_seconds`、`_bytes`、`_total` |
| Counter 用 `_total` 结尾 | `errors_total` |
| 不把标签内容塞进指标名 | 用 label 区分 method、status、instance |

坏例子：

```text
api_get_200_requests
api_post_500_requests
```

好例子：

```text
http_requests_total{method="GET",status="200"}
http_requests_total{method="POST",status="500"}
```

### label

label 是键值对，用于描述维度。

```text
http_requests_total{method="GET",status="200",instance="api-1:8000"}
```

这里的标签：

| label | 含义 |
|---|---|
| `method="GET"` | HTTP 方法 |
| `status="200"` | HTTP 状态码 |
| `instance="api-1:8000"` | 被抓取实例 |

标签的力量在于查询和聚合：

```text
sum by (status) (rate(http_requests_total[5m]))
```

标签的风险是高基数。任何会无限增长或变化很快的值，都不应该放进 label：

- `user_id`
- `request_id`
- `trace_id`
- 完整 URL 参数
- error message 原文
- IP 地址明细，除非你明确知道规模

因为每一种 label 组合都会形成新的时间序列。时间序列越多，Prometheus 的内存、磁盘和查询压力越大。

### sample

sample 是一个具体时间点的值。

```text
value + timestamp
```

例子：

```text
http_requests_total{job="api",instance="api-1:8000"} 1080 @ 10:00:15
```

Prometheus 抓取时通常给样本附加抓取时间。你在 PromQL 里看到的曲线，就是一系列 sample 组成的。

### time series

time series 由指标名和完整 label 集合唯一确定。

```text
http_requests_total{method="GET",status="200",instance="api-1:8000"}
http_requests_total{method="GET",status="500",instance="api-1:8000"}
```

这两条是不同 time series，因为 `status` 不同。

判断是否新建时间序列：

| 变化 | 是否新 time series |
|---|---|
| 样本值变化 | 否 |
| 时间戳变化 | 否 |
| label 值变化 | 是 |
| 新增 label | 是 |
| 删除 label | 是 |
| metric name 变化 | 是 |

## Jobs、Instances 和 Targets

官方文档里有三个很重要的词。

| 名词 | 含义 | 例子 |
|---|---|---|
| job | 一组同类抓取目标 | `api`、`node`、`prometheus` |
| instance | 一个具体抓取目标 | `api-1:8000`、`node-1:9100` |
| target | Prometheus 要抓的地址和标签集合 | `localhost:9090` 加上 labels |

配置：

```yaml
scrape_configs:
  - job_name: "demo-api"
    static_configs:
      - targets:
          - "demo-api-1:8000"
          - "demo-api-2:8000"
```

Prometheus 会自动加上常见标签：

```text
job="demo-api"
instance="demo-api-1:8000"
```

查询：

```text
up{job="demo-api"}
```

如果你看到：

```text
up{job="demo-api",instance="demo-api-1:8000"} 1
up{job="demo-api",instance="demo-api-2:8000"} 0
```

意思是第一个实例抓取成功，第二个实例抓取失败。

## 指标类型

Prometheus 客户端库常见四种指标类型。

| 类型 | 一句话 | AIOps 例子 |
|---|---|---|
| Counter | 只增不减，重启可归零 | 请求总数、错误总数 |
| Gauge | 可增可减的瞬时值 | CPU、内存、队列长度 |
| Histogram | 把观测值放进桶里统计分布 | 请求耗时、响应大小 |
| Summary | 客户端侧计算分位数摘要 | 客户端延迟分位数 |

### Counter

Counter 像汽车总里程，只会增加，进程重启时可能归零。

例子：

```text
http_requests_total{method="GET",status="200"} 1027
```

不要直接拿 Counter 的当前值当 QPS。要用 `rate()` 看增长速度：

```text
rate(http_requests_total[5m])
```

坏用法：

```text
current_running_requests_total
```

当前正在运行的请求数会上升也会下降，应该用 Gauge。

### Gauge

Gauge 像温度计，可以升也可以降。

例子：

```text
node_memory_MemAvailable_bytes 123456789
queue_depth{queue="orders"} 42
```

适合：

- 当前 CPU 使用率。
- 当前内存使用量。
- 当前队列长度。
- 当前连接数。
- 当前 goroutine 数。

常用查询：

```text
node_memory_MemAvailable_bytes
max_over_time(queue_depth[30m])
```

### Histogram

Histogram 用桶统计一批观测值的分布。

典型指标：

```text
http_request_duration_seconds_bucket{le="0.1"} 240
http_request_duration_seconds_bucket{le="0.3"} 500
http_request_duration_seconds_bucket{le="1"} 900
http_request_duration_seconds_bucket{le="+Inf"} 1000
http_request_duration_seconds_sum 123.4
http_request_duration_seconds_count 1000
```

你可以把它理解成：Prometheus 不保存每一次请求耗时，而是保存“多少请求落在每个耗时桶里”。

计算 P95：

```text
histogram_quantile(
  0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

如果有多个实例，要保留 `le` 标签聚合：

```text
histogram_quantile(
  0.95,
  sum by (job, le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

### Summary

Summary 也用于耗时、响应大小，支持分位数的客户端实现可在客户端计算分位数；不是所有语言库都提供该能力，例如本文 Python 客户端的 Summary 不提供下面展示的分位数输出。

常见形态：

```text
rpc_duration_seconds{quantile="0.5"} 0.05
rpc_duration_seconds{quantile="0.9"} 0.2
rpc_duration_seconds_sum 123.4
rpc_duration_seconds_count 1000
```

初学建议：

- 想跨实例聚合 P95，优先学 Histogram。
- Summary 的客户端分位数不适合简单跨实例再聚合。

## `/metrics` 暴露格式

一个 `/metrics` 页面可能长这样：

```text
# HELP http_requests_total Total number of HTTP requests.
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1027
http_requests_total{method="GET",status="500"} 12

# HELP queue_depth Current queue depth.
# TYPE queue_depth gauge
queue_depth{queue="orders"} 42
```

解释：

| 行 | 含义 |
|---|---|
| `# HELP` | 给人看的指标说明 |
| `# TYPE` | 指标类型 |
| 样本行 | 指标名、标签和值 |

排障时可以直接访问 target 的 metrics：

```bash
curl demo-api:8000/metrics
```

如果这个接口不返回 Prometheus 格式，Prometheus 就抓不到有效样本。

## 安装和启动

### Docker 启动

最小启动：

```bash
docker run --rm --name prometheus -p 127.0.0.1:9090:9090 prom/prometheus:v3.5.0
```

访问：

```text
localhost:9090
```

查看日志：

```bash
docker logs prometheus
```

### 使用配置文件启动

准备 `prometheus.yml`：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

PowerShell：

```powershell
docker run --rm --name prometheus `
  -p 127.0.0.1:9090:9090 `
  -v "${PWD}/prometheus.yml:/etc/prometheus/prometheus.yml:ro" `
  prom/prometheus:v3.5.0
```

Linux/macOS：

```bash
docker run --rm --name prometheus \
  -p 127.0.0.1:9090:9090 \
  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
  prom/prometheus:v3.5.0
```

注意：示例版本号要按你实际使用的 Prometheus 镜像调整。不要在生产中长期依赖裸 `latest`。

## Web 页面

常用页面：

| 页面 | 用途 |
|---|---|
| `/targets` | 查看抓取目标 UP/DOWN、错误、最后抓取时间 |
| `/graph` | 执行 PromQL 查询 |
| `/alerts` | 查看告警状态 |
| `/rules` | 查看 recording rules 和 alerting rules |
| `/status/config` | 查看当前加载配置 |
| `/status/tsdb` | 查看 TSDB 基本状态和基数相关信息 |
| `/-/ready` | readiness 检查 |
| `/-/healthy` | health 检查 |

排障顺序通常是：先 `/targets`，再 PromQL。target 不 UP 时，PromQL 查不到数据只是结果，不是根因。

## 配置文件结构

Prometheus 配置文件是 YAML。

典型结构：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]
```

字段解释：

| 字段 | 是什么 | 为什么需要 | 坏了怎么查 |
|---|---|---|---|
| `global` | 全局默认配置 | 避免每个 job 重复写间隔 | `/status/config` 看实际加载 |
| `scrape_interval` | 抓取间隔 | 控制多久采一次指标 | 太大看不清波动，太小增加压力 |
| `evaluation_interval` | 规则计算间隔 | 控制告警和 recording rules 多久算一次 | 告警延迟时检查它 |
| `rule_files` | 规则文件路径 | 加载 recording 和 alerting rules | `promtool check rules` |
| `scrape_configs` | 抓取任务 | 定义抓谁、怎么抓、加什么标签 | `/targets` |
| `alerting` | Alertmanager 地址 | 告警触发后发给谁 | `/alerts` 和 Prometheus 日志 |

## `scrape_configs` 详解

一个抓取 job：

```yaml
scrape_configs:
  - job_name: "demo-api"
    scrape_interval: 10s
    scrape_timeout: 5s
    metrics_path: "/metrics"
    scheme: "http"
    static_configs:
      - targets:
          - "demo-api-1:8000"
          - "demo-api-2:8000"
        labels:
          env: "dev"
          team: "platform"
```

字段解释：

| 字段 | 含义 |
|---|---|
| `job_name` | 抓取任务名，会成为 `job` 标签 |
| `scrape_interval` | 这个 job 的抓取间隔，覆盖 global 默认值 |
| `scrape_timeout` | 单次抓取超时时间 |
| `metrics_path` | metrics 路径，默认 `/metrics` |
| `scheme` | `http` 或 `https` |
| `static_configs` | 静态目标列表 |
| `targets` | 目标地址，格式通常是 `host:port` |
| `labels` | 给这些 targets 额外加的标签 |

坏了怎么查：

1. `/targets` 看状态。
2. 点开 target 看 Last Error。
3. 在 Prometheus 容器或同网络容器里 curl 目标地址。
4. 检查 `metrics_path`、端口、DNS、网络。
5. 用 `promtool check config prometheus.yml` 检查配置语法。

## relabel 的入门理解

relabel 是 Prometheus 在抓取前后改标签的机制。它很强，但也容易把新手绕晕。

最粗略理解：

```text
service discovery discovers many targets
        |
        v
relabel_configs selects and rewrites target labels
        |
        v
scrape target
        |
        v
metric_relabel_configs can drop or rewrite scraped metrics
```

初学先知道三个点：

| 配置 | 发生时间 | 常见用途 |
|---|---|---|
| `relabel_configs` | 抓取前，对 target 处理 | 改 `instance`、保留/丢弃 target |
| `metric_relabel_configs` | 抓取后，写入前，对样本处理 | 丢弃高基数指标或标签 |
| `__` 开头标签 | Prometheus 内部标签 | 服务发现和 relabel 阶段常见 |

例子：按标签名移除 `pod_uid`。先证明移除后样本身份仍唯一，不能把删除标签当聚合：

```yaml
metric_relabel_configs:
  - regex: "pod_uid"
    action: labeldrop
```

真实生产里 relabel 很重要，但刚入门时先把 static target、job、instance、labels 理清楚。

## TSDB 和存储

Prometheus 本地存储叫 TSDB，也就是 time series database。

你可以把它理解成：

```text
scraped samples（抓取的样本）
  -> write-ahead log（预写日志）
  -> head block（活跃数据块）
  -> compacted blocks on disk（磁盘上的合并数据块）
```

你需要知道的重点：

| 概念 | 含义 |
|---|---|
| WAL | write-ahead log，用于崩溃恢复 |
| head | 最近写入、还没完全压缩成块的数据 |
| block | 一段时间范围内压缩后的数据块 |
| retention | 本地数据保留多久或保留多大 |
| cardinality | 时间序列数量，直接影响内存和磁盘 |

常见启动参数：

```bash
prometheus \
  --config.file=prometheus.yml \
  --storage.tsdb.path=data \
  --storage.tsdb.retention.time=15d
```

Docker 中挂载数据目录：

```bash
docker volume create prometheus-data

docker run -d --name prometheus \
  -p 127.0.0.1:9090:9090 \
  -v prometheus-data:/prometheus \
  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
  prom/prometheus:v3.5.0 \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --storage.tsdb.retention.time=15d
```

如果不挂载数据卷，容器删除后本地 TSDB 数据会丢。

## PromQL 基础

PromQL 是 Prometheus Query Language。

它不是 SQL。PromQL 的核心是对时间序列做选择、范围计算、聚合和向量运算。

## PromQL 数据类型

PromQL 常见类型：

| 类型 | 含义 | 例子 |
|---|---|---|
| instant vector | 某一时刻的一组时间序列样本 | `up` |
| range vector | 每条时间序列在一段时间内的样本集合 | `http_requests_total[5m]` |
| scalar | 单个数字 | `0.95` |
| string | 字符串，实际使用少 | `"demo"` |

新手最重要的是分清 instant vector 和 range vector。

```text
http_requests_total
```

这是 instant vector，表示当前查询时刻每条序列的值。

```text
http_requests_total[5m]
```

这是 range vector，表示最近 5 分钟每条序列的一组样本。`rate()` 这类函数需要 range vector。

## 选择器和标签匹配

查询所有 `up`：

```text
up
```

按 label 过滤：

```text
up{job="demo-api"}
```

匹配器：

| 写法 | 含义 |
|---|---|
| `label="value"` | 等于 |
| `label!="value"` | 不等于 |
| `label=~"regex"` | 正则匹配 |
| `label!~"regex"` | 正则不匹配 |

例子：

```text
http_requests_total{status=~"5.."}
```

表示 status 是 500、502、503 这类 5xx。

## 聚合

按 job 聚合：

```text
sum by (job) (rate(http_requests_total[5m]))
```

去掉 instance 维度：

```text
sum without (instance) (rate(http_requests_total[5m]))
```

常见聚合：

| 函数 | 用途 |
|---|---|
| `sum` | 求和 |
| `avg` | 平均 |
| `min` | 最小 |
| `max` | 最大 |
| `count` | 序列数量 |
| `topk` | 取前 K 个 |
| `bottomk` | 取后 K 个 |

AIOps 常用：

```text
topk(5, sum by (service) (rate(http_requests_total[5m])))
```

意思是最近 5 分钟请求速率最高的 5 个服务。

## 常用 PromQL 字典

### `up`

| 项 | 内容 |
|---|---|
| 是什么 | Prometheus 自动生成的抓取成功指标 |
| 返回 | `1` 表示成功，`0` 表示失败 |
| 常用查询 | `up`、`up{job="demo-api"}` |
| AIOps 场景 | 判断 target 是否可抓取 |
| 常见坑 | `up=1` 只表示抓取成功，不代表业务接口一定正常 |

### `rate()`

| 项 | 内容 |
|---|---|
| 是什么 | 计算 Counter 在时间窗口内的每秒平均增长率 |
| 输入 | range vector，例如 `http_requests_total[5m]` |
| 常用查询 | `rate(http_requests_total[5m])` |
| AIOps 场景 | QPS、错误速率、网络字节速率 |
| 常见坑 | 不要对 Gauge 乱用 `rate()`；窗口太短会抖 |

### `irate()`

| 项 | 内容 |
|---|---|
| 是什么 | 使用最近两个样本计算瞬时增长率 |
| 输入 | range vector |
| 常用查询 | `irate(http_requests_total[5m])` |
| AIOps 场景 | 看短时尖峰 |
| 常见坑 | 告警通常更适合 `rate()`，`irate()` 太敏感 |

### `increase()`

| 项 | 内容 |
|---|---|
| 是什么 | 计算 Counter 在窗口内大约增加了多少 |
| 输入 | range vector |
| 常用查询 | `increase(errors_total[1h])` |
| AIOps 场景 | 最近 1 小时错误总数 |
| 常见坑 | 它不是每秒速率，和 `rate()` 语义不同 |

### `histogram_quantile()`

| 项 | 内容 |
|---|---|
| 是什么 | 根据 Histogram bucket 估算分位数 |
| 输入 | bucket 的速率或聚合 |
| 常用查询 | `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))` |
| AIOps 场景 | P95、P99 延迟 |
| 常见坑 | 经典 Histogram 聚合时必须保留 `le` 标签 |

### `avg_over_time()`

| 项 | 内容 |
|---|---|
| 是什么 | 计算时间窗口内平均值 |
| 输入 | range vector |
| 常用查询 | `avg_over_time(cpu_usage[30m])` |
| AIOps 场景 | 平滑短时波动 |
| 常见坑 | 对 Counter 当前值求平均通常意义不大 |

### `max_over_time()`

| 项 | 内容 |
|---|---|
| 是什么 | 计算时间窗口内最大值 |
| 输入 | range vector |
| 常用查询 | `max_over_time(queue_depth[1h])` |
| AIOps 场景 | 看峰值、容量风险 |
| 常见坑 | 峰值不等于持续问题，要结合时间窗口 |

### `changes()`

| 项 | 内容 |
|---|---|
| 是什么 | 计算窗口内值变化次数 |
| 输入 | range vector |
| 常用查询 | `changes(up{job="demo-api"}[1h])` |
| AIOps 场景 | 判断实例是否反复抖动 |
| 常见坑 | 值频繁变化的 Gauge 会天然很高 |

### `predict_linear()`

| 项 | 内容 |
|---|---|
| 是什么 | 基于简单线性回归预测未来值 |
| 输入 | range vector 和未来秒数 |
| 常用查询 | `predict_linear(node_filesystem_free_bytes[6h], 3600 * 24)` |
| AIOps 场景 | 磁盘空间趋势预测 |
| 常见坑 | 只适合较线性的趋势，周期波动场景容易误判 |

## 常见 SRE 查询

### 请求速率

```text
sum by (job) (rate(http_requests_total[5m]))
```

### 错误率

```text
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

### 按服务错误率

```text
sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))
/
sum by (service) (rate(http_requests_total[5m]))
```

### P95 延迟

```text
histogram_quantile(
  0.95,
  sum by (service, le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

### 实例抓取失败

```text
up == 0
```

### 最近 1 小时实例抖动

```text
changes(up[1h]) > 2
```

### 磁盘可能 24 小时内耗尽

```text
predict_linear(node_filesystem_free_bytes[6h], 24 * 3600) < 0
```

## Recording Rules

Recording rules 用来把常用或昂贵的 PromQL 预先计算成新的时间序列。

为什么需要：

- Dashboard 查询更快。
- 告警表达式更简单。
- 复杂 SLO 指标可以复用。
- 降低重复查询成本。

示例 `rules/recording.yml`：

```yaml
groups:
  - name: demo-api-recording
    interval: 30s
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))
```

字段解释：

| 字段 | 含义 |
|---|---|
| `groups` | 规则组列表 |
| `name` | 规则组名称 |
| `interval` | 该组规则计算间隔 |
| `record` | 新生成的指标名 |
| `expr` | PromQL 表达式 |

命名建议：

```text
level:metric:operations
```

例子：

```text
job:http_requests:rate5m
```

## Alerting Rules

Alerting rules 用来定义告警条件。

示例 `rules/alerting.yml`：

```yaml
groups:
  - name: demo-api-alerts
    rules:
      - alert: InstanceDown
        expr: up{job="demo-api"} == 0
        for: 2m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "demo-api instance is down"
          description: "Prometheus cannot scrape {{ $labels.instance }} for more than 2 minutes."
```

字段解释：

| 字段 | 含义 |
|---|---|
| `alert` | 告警名 |
| `expr` | 触发条件 |
| `for` | 条件持续多久后进入 firing |
| `labels` | 告警标签，用于分组、路由、筛选 |
| `annotations` | 给人看的说明 |

告警状态：

```text
inactive -> pending -> firing（未激活、等待持续时间、触发中的规则状态）
```

解释：

| 状态 | 含义 |
|---|---|
| inactive | 条件不成立 |
| pending | 条件成立，但还没满足 `for` 持续时间 |
| firing | 条件持续满足，告警触发 |

好的告警应该尽量关注用户影响：

- 错误率。
- 延迟。
- 可用性。
- 队列积压。
- SLO 错误预算。

不要只写一堆“CPU > 80%”。CPU 高可能是问题，也可能只是流量上涨。更好的做法是把资源指标作为诊断信息，把用户影响作为告警入口。

## Alertmanager 连接

Prometheus 负责计算告警，Alertmanager 负责处理告警通知。

```text
Prometheus alerting rule fires（指标告警规则进入触发状态）
        |
        v
Alertmanager（告警处理器）
  ├── group（告警组）
  ├── inhibit（抑制通知）
  ├── silence（静默）
  └── notify（发送通知）
```

Prometheus 配置：

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - "alertmanager:9093"
```

注意：Alertmanager 的详细配置在 Alertmanager 专题里讲。这里你先记住：Prometheus 不是直接负责发飞书、邮件、短信的完整通知治理中心，它把 firing alerts 发给 Alertmanager。

## HTTP API

Prometheus 提供 HTTP API，AIOps 脚本可以通过 API 拉指标。

常用接口：

| API | 用途 |
|---|---|
| `/api/v1/query` | 瞬时查询 |
| `/api/v1/query_range` | 范围查询 |
| `/api/v1/series` | 查询时间序列 |
| `/api/v1/labels` | 查询 label 名 |
| `/api/v1/label/<label_name>/values` | 查询某个 label 的值 |
| `/api/v1/targets` | 查询 target 状态 |
| `/api/v1/rules` | 查询规则 |
| `/api/v1/alerts` | 查询告警 |

示例：瞬时查询。

```bash
curl "localhost:9090/api/v1/query?query=up"
```

示例：范围查询。

```bash
curl "localhost:9090/api/v1/query_range?query=up&start=2026-07-02T00:00:00Z&end=2026-07-02T01:00:00Z&step=30s"
```

API 返回通常包含：

| 字段 | 含义 |
|---|---|
| `status` | `success` 或 `error` |
| `data.resultType` | `vector`、`matrix` 等 |
| `data.result` | 查询结果 |
| `errorType` | 错误类型 |
| `error` | 错误信息 |

Python 拉取 Prometheus 数据时，要注意：

- URL 编码。
- timeout。
- 查询范围不要太大。
- step 不要太小。
- 处理 Prometheus 返回的 error。

## 命令 / 配置 / API 字典

### `prometheus --config.file`

| 项 | 内容 |
|---|---|
| 作用 | 指定 Prometheus 配置文件 |
| 示例 | `prometheus --config.file=prometheus.yml` |
| AIOps 场景 | 启动本地或服务器 Prometheus |
| 常见坑 | 容器里路径和宿主机路径不同 |

### `--web.listen-address`

| 项 | 内容 |
|---|---|
| 作用 | 指定 Web UI 和 HTTP API 监听地址 |
| 示例 | `--web.listen-address=0.0.0.0:9090` |
| AIOps 场景 | 暴露查询入口给 Grafana 或脚本 |
| 常见坑 | 监听地址不等于 Docker 端口映射，容器还要 `-p` |

### `--storage.tsdb.path`

| 项 | 内容 |
|---|---|
| 作用 | 指定本地 TSDB 数据目录 |
| 示例 | `--storage.tsdb.path=/prometheus` |
| AIOps 场景 | 持久化 Prometheus 数据 |
| 常见坑 | Docker 中不挂 volume，容器删除后数据丢失 |

### `--storage.tsdb.retention.time`

| 项 | 内容 |
|---|---|
| 作用 | 按时间保留本地数据 |
| 示例 | `--storage.tsdb.retention.time=15d` |
| AIOps 场景 | 控制本地历史窗口 |
| 常见坑 | 保留越久，磁盘压力越大；长期历史应考虑远程存储 |

### `--web.enable-lifecycle`

| 项 | 内容 |
|---|---|
| 作用 | 允许通过 HTTP 触发 reload 或 shutdown |
| 示例 | `--web.enable-lifecycle` |
| AIOps 场景 | 自动化部署配置后 reload |
| 常见坑 | 开启后要注意访问控制，不要暴露给不可信网络 |

### `promtool check config`

| 项 | 内容 |
|---|---|
| 作用 | 检查 Prometheus 配置文件语法 |
| 示例 | `promtool check config prometheus.yml` |
| AIOps 场景 | CI 中检查配置，避免坏配置上线 |
| 常见坑 | 只能证明语法和部分结构正确，不证明 target 一定可达 |

### `promtool check rules`

| 项 | 内容 |
|---|---|
| 作用 | 检查规则文件 |
| 示例 | `promtool check rules rules/alerting.yml` |
| AIOps 场景 | 防止告警规则语法错误 |
| 常见坑 | 表达式能解析，不代表告警语义合理 |

### `/targets`

| 项 | 内容 |
|---|---|
| 作用 | 查看抓取目标状态 |
| 入口 | Prometheus UI 的 `/targets` |
| 关键字段 | State、Labels、Last Scrape、Scrape Duration、Error |
| AIOps 场景 | 排查数据采集断点 |
| 常见坑 | target UP 不代表业务健康，只代表 metrics 抓取成功 |

### `/api/v1/query`

| 项 | 内容 |
|---|---|
| 作用 | HTTP API 瞬时查询 |
| 示例 | `curl "localhost:9090/api/v1/query?query=up"` |
| AIOps 场景 | Python 脚本拉当前状态 |
| 常见坑 | 查询语句要 URL 编码，复杂查询建议用 HTTP client 传 params |

### `/api/v1/query_range`

| 项 | 内容 |
|---|---|
| 作用 | HTTP API 范围查询 |
| 参数 | `query`、`start`、`end`、`step` |
| AIOps 场景 | 拉历史窗口做异常检测 |
| 常见坑 | 时间范围太大或 step 太小，会导致查询慢或超限 |

## AIOps 入门实验：监控一个 demo 应用

目标：

- 启动一个暴露 `/metrics` 的 Python demo。
- 启动 Prometheus 抓取它。
- 在 `/targets` 看到 demo 是 UP。
- 用 PromQL 查询请求数、错误率和延迟。
- 写一个 `InstanceDown` 告警规则。

### 第 1 步：准备目录

新建本轮独立 `prometheus-lab` 目录并进入，不覆盖已有实验。准备 Python 3 与 Docker Desktop，确认 8000、9090 端口及示例容器名未被占用。固定 Prometheus 3.5.0 与下面的 Python 库版本仅用于隔离课堂，不是生产安全版本推荐；记录实际环境，升级前核对兼容与安全公告。

```text
prometheus-lab/
  app.py
  requirements.txt
  prometheus.yml
  rules/
    alerting.yml
```

### 第 2 步：创建 Python demo

`requirements.txt`：

```text
prometheus-client==0.20.0
```

`app.py`：

```python
import random
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlsplit

from prometheus_client import Counter, Histogram, generate_latest


REQUESTS = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["path"],
)

# 提前初始化低基数状态，避免从未发生错误时错误序列不存在。
for route in ("/", "/health", "/fail", "/other"):
    for code in ("200", "404", "500"):
        REQUESTS.labels(method="GET", path=route, status=code)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        start = time.perf_counter()
        request_path = urlsplit(self.path).path

        if request_path == "/metrics":
            body = generate_latest()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4")
            self.end_headers()
            self.wfile.write(body)
            return

        route = request_path if request_path in ("/", "/health", "/fail") else "/other"
        if route == "/health":
            status = 200
            body = b"ok"
        else:
            status = 500 if route == "/fail" else (404 if route == "/other" else 200)
            body = b"demo"

        time.sleep(random.uniform(0.01, 0.2))
        REQUESTS.labels(method="GET", path=route, status=str(status)).inc()
        LATENCY.labels(path=route).observe(time.perf_counter() - start)

        self.send_response(status)
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
```

安装运行：

因为本节让容器访问宿主机应用，示例应用监听所有本机接口。仅在隔离学习网络使用，不给公网或其他不可信机器放行 8000；它没有生产鉴权。无法安全提供该连接时，改用同一隔离容器网络的方案，不关闭防火墙或证书校验来凑实验结果。

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

另开一个终端访问几次：

```bash
curl localhost:8000/
curl localhost:8000/health
curl localhost:8000/metrics
```

`/` 与 `/health` 固定成功，`/fail` 固定返回五百，便于你有意制造已知失败；其他路径归入 `/other`，不把请求参数无限加入指标标签。测耗时使用单调计时器，系统时间校正不会把本次持续时间变成负数。指标延迟只覆盖示例记录前的处理时间，不等同于用户端全部网络耗时。

抓取启动后，在另一个 PowerShell 终端运行以下有限流量，共一百次、约两分钟，每五次有一次固定失败。它仅访问本机课堂地址，不是压力测试：

```powershell
1..100 | ForEach-Object {
  $lessonRoute = if ($_ % 5 -eq 0) { '/fail' } else { '/' }
  curl.exe -s -o NUL "http://127.0.0.1:8000$lessonRoute"
  Start-Sleep -Seconds 1
}
```

预期业务计数增量为八十成功、二十失败；若同时访问了健康页等路径，总量会包含额外请求，查询应限定同一统计集合。`rate` 窗口估算可能因抓取边界与样本不足不恰好等于百分之二十，先核对累计计数和样本时间，不把近似估计当逐笔账本。

### 第 3 步：配置 Prometheus

如果 Prometheus 用 Docker 跑，demo 在宿主机跑，Docker Desktop 上可以用 `host.docker.internal`：

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/rules/*.yml"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  - job_name: "demo-api"
    metrics_path: "/metrics"
    static_configs:
      - targets: ["host.docker.internal:8000"]
        labels:
          service: "demo-api"
          env: "local"
```

Linux 上如果 Prometheus 和 demo 都用容器跑，建议放到同一个 Docker network，用容器名访问。这个会在 Docker Compose 篇里更完整地做。

### 第 4 步：创建告警规则

`rules/alerting.yml`：

```yaml
groups:
  - name: demo-api-alerts
    rules:
      - alert: DemoApiDown
        expr: up{job="demo-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "demo-api target is down"
          description: "Prometheus cannot scrape {{ $labels.instance }}."
```

### 第 5 步：启动 Prometheus

PowerShell：

```powershell
docker run --rm --name prometheus `
  -p 127.0.0.1:9090:9090 `
  -v "${PWD}/prometheus.yml:/etc/prometheus/prometheus.yml:ro" `
  -v "${PWD}/rules:/etc/prometheus/rules:ro" `
  prom/prometheus:v3.5.0 `
  --config.file=/etc/prometheus/prometheus.yml
```

### 第 6 步：检查 targets

打开：

```text
localhost:9090/targets
```

应该看到：

- `prometheus` 是 UP。
- `demo-api` 是 UP。

如果 `demo-api` DOWN，先看 Last Error。

### 第 7 步：执行 PromQL

抓取状态：

```text
up{job="demo-api"}
```

请求速率：

```text
sum by (status) (rate(http_requests_total{job="demo-api"}[5m]))
```

错误率：

```text
sum(rate(http_requests_total{job="demo-api",status="500"}[5m]))
/
sum(rate(http_requests_total{job="demo-api"}[5m]))
```

P95 延迟：

```text
histogram_quantile(
  0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket{job="demo-api"}[5m]))
)
```

### 第 8 步：验证规则

打开：

```text
localhost:9090/rules
localhost:9090/alerts
```

停止本轮 Python demo 后，经历下一次失败抓取、规则评估以及完整一分钟持续期，`DemoApiDown` 应从 pending 变为 firing，实际等待会超过一分钟。恢复应用后观察抓取回到一、告警恢复，并重新产生有限流量检查计数器重置后的查询。这里未部署 Alertmanager，因此只验证规则状态，不宣称通知已经送达。

清理时在应用终端按 Ctrl+C，并仅停止本轮创建的 Prometheus 容器；带 `--rm` 的临时容器会移除。保留配置、查询与输出，虚拟环境在确认属于本次独立目录后可自行删除。不要清理已有 Prometheus 数据卷。恢复后若无数据，优先看应用是否重启、采样是否足够、查询时间与标签是否仍一致。

## 实验排障

### `demo-api` target DOWN

检查：

```bash
docker logs prometheus
curl localhost:8000/metrics
```

如果 Prometheus 在容器里，demo 在宿主机上：

- Windows/macOS Docker Desktop 优先用 `host.docker.internal:8000`。
- Linux 要考虑 Docker 网络，或把 demo 也容器化。

### Prometheus 配置加载失败

检查：

```bash
promtool check config prometheus.yml
```

如果用 Docker 镜像里的 promtool：

```bash
docker run --rm --entrypoint promtool -v "${PWD}/prometheus.yml:/etc/prometheus/prometheus.yml:ro" -v "${PWD}/rules:/etc/prometheus/rules:ro" prom/prometheus:v3.5.0 check config /etc/prometheus/prometheus.yml
```

### PromQL 查不到 demo 指标

排查：

1. `/targets` 是否 UP。
2. `curl localhost:8000/metrics` 是否有指标。
3. 指标名是否写对。
4. 是否刚启动，样本还没抓到。
5. 查询时间窗口是否太短。
6. label 是否写错，例如 `job="demo"` 和 `job="demo-api"`。

### P95 查询为空

检查：

- 是否存在 `_bucket` 指标。
- 查询时是否保留 `le` 标签。
- 最近 5 分钟是否有请求。
- Histogram 名字是否和查询一致。

## 常见故障排查表

| 现象 | 常见原因 | 检查入口 | 处理方向 |
|---|---|---|---|
| target DOWN | 地址错、网络不通、metrics 路径错、服务没启动 | `/targets` Last Error | 修地址、端口、路径、网络 |
| PromQL 无数据 | 指标不存在、label 写错、时间范围不对 | `/graph`、自动补全 | 先查裸指标名 |
| Prometheus 启动失败 | YAML 错、规则错、挂载路径错 | `docker logs`、`promtool` | 修配置和挂载 |
| 内存升高 | 高基数、target 太多、抓取太频繁 | `/status/tsdb`、日志 | 降基数、删标签、调间隔 |
| 磁盘增长快 | 保留时间长、序列多、抓取频繁 | `docker system df`、TSDB 目录 | 调 retention、清高基数 |
| 告警不触发 | 表达式无结果、`for` 未满足、规则没加载 | `/rules`、`/alerts` | 检查规则和表达式 |
| 告警误报多 | 规则太敏感、窗口太短、只看资源 | 告警历史 | 调整窗口，关注用户影响 |
| Grafana 有图但 Prometheus 查不到 | 数据源或查询范围不同 | Grafana query inspector | 对齐数据源和时间范围 |
| API 查询慢 | 范围太大、step 太小、序列太多 | Prometheus 日志 | 缩小范围，做 recording rule |

## 高基数专项

高基数是 Prometheus 新手最容易踩的大坑。

时间序列数量大致等于：

```text
metric names * label combinations
```

例子：

```text
http_requests_total{
  method="GET",
  status="200",
  user_id="123456",
  request_id="abc..."
}
```

如果 `user_id` 有 100 万个，`request_id` 每次请求都不同，时间序列会爆炸。

正确做法：

- 用日志或 tracing 保存 request_id。
- 用指标保存聚合维度。
- URL path 用模板，例如 `/api/users/:id`，不要用 `/api/users/123`。
- 对无用指标和标签做 metric relabel drop。
- 定期看 `/status/tsdb` 和高基数指标。

## Prometheus 和日志、链路追踪的区别

| 数据类型 | 代表工具 | 保存什么 | 适合回答 |
|---|---|---|---|
| Metrics | Prometheus | 数值时间序列 | 系统是否异常、趋势如何 |
| Logs | Loki、Elasticsearch | 离散事件文本 | 具体错误是什么 |
| Traces | Jaeger、Tempo | 请求调用链 | 慢在哪个服务或 span |

不要让 Prometheus 做所有事。AIOps 需要三类数据协同，但 Prometheus 的核心职责是指标。

## 学习路线

### 第 1 阶段：理解数据模型

- metric name。
- label。
- sample。
- time series。
- job 和 instance。

学习证据：写一篇笔记，解释 `http_requests_total{method="GET",status="200"}` 是什么。

### 第 2 阶段：跑起来

- Docker 启动 Prometheus。
- 写 `prometheus.yml`。
- 打开 `/targets`。
- 查询 `up`。

学习证据：提交 `prometheus.yml` 和 `/targets` 截图。

### 第 3 阶段：学 PromQL

- 选择器。
- label 匹配。
- `rate()`。
- `sum by`。
- `histogram_quantile()`。
- 错误率和 P95。

学习证据：整理 10 条 PromQL 查询和每条含义。

### 第 4 阶段：学规则

- recording rules。
- alerting rules。
- `for`。
- labels 和 annotations。
- `promtool check rules`。

学习证据：提交 `rules/alerting.yml` 和一次告警状态截图。

### 第 5 阶段：接入 AIOps

- HTTP API。
- Python 查询历史指标。
- 异常检测。
- SLO 计算。
- 告警降噪。

学习证据：写一个 Python 脚本调用 `/api/v1/query_range` 拉取 1 小时 QPS。

## 小白可能会问

### 我已经会看日志了，为什么还要学 Prometheus？

日志告诉你“发生了什么事件”，指标告诉你“系统状态如何随时间变化”。排查接口变慢时，日志能看到错误细节，Prometheus 能看到 QPS、错误率、P95、CPU、内存是否同时变化。两者互补。

### `/metrics` 到底是什么？

它是一个 HTTP 接口，返回 Prometheus 能解析的指标文本。应用可以通过 client library 暴露它，数据库和系统组件可以通过 exporter 暴露它。

### Counter、Gauge、Histogram 第一天先懂哪个？

先懂 Counter 和 Gauge。Counter 记录累计次数，用 `rate()` 看速度。Gauge 记录当前值，可以上升下降。Histogram 用于延迟分布，等你要看 P95/P99 时再重点学。

### Prometheus 和 Grafana 什么关系？

Prometheus 负责采集、存储和查询指标，Grafana 将查询结果画成看板。Grafana 也能连接其他指标数据源，并非只能依赖 Prometheus；没有 Grafana，Prometheus 仍能查询与计算告警。

### Prometheus 能不能长期保存所有历史？

本地 TSDB 可以保留一段时间，但 Prometheus 单节点本地存储不是为无限长期历史设计的。长期存储通常使用 remote write 或 Thanos、Cortex、Mimir、VictoriaMetrics 等方案。

## 面试怎么讲

Prometheus 是面向指标的监控和告警系统。它默认用 pull 模型定期抓取 target 的 `/metrics`，把样本按 metric name 和 labels 存成 time series，再用 PromQL 查询和规则计算。它的数据模型是多维标签模型，优点是查询和聚合灵活，风险是高基数标签会导致序列数量爆炸。排障时我会先看 `/targets` 是否 UP，再查指标名和标签，最后看 PromQL 窗口、规则和 TSDB 基数。在 AIOps 中，Prometheus 提供 CPU、QPS、错误率、延迟等历史指标，是异常检测、SLO、容量预测和告警降噪的重要输入。

## 面试题

1. Prometheus 解决什么问题？
2. Prometheus 为什么默认使用 pull 模型？
3. metric、label、sample、time series 分别是什么？
4. job、instance、target 有什么区别？
5. Counter 和 Gauge 有什么区别？
6. 为什么 Counter 要用 `rate()` 看 QPS？
7. Histogram 的 `_bucket`、`_sum`、`_count` 分别是什么？
8. Summary 和 Histogram 有什么区别？
9. 什么是高基数标签？为什么危险？
10. `scrape_interval` 和 `evaluation_interval` 分别控制什么？
11. `up` 指标代表什么？它有什么局限？
12. `rate()`、`increase()`、`irate()` 有什么区别？
13. 如何计算 HTTP 5xx 错误率？
14. 如何计算 P95 延迟？
15. recording rules 解决什么问题？
16. alerting rules 中 `for` 有什么作用？
17. Prometheus 和 Alertmanager 的边界是什么？
18. target DOWN 你会按什么顺序排查？
19. Prometheus 不适合做什么？
20. Prometheus 在 AIOps 异常检测中提供什么输入？

## 学习检查清单

- [ ] 我能解释 Prometheus 是什么，以及它适合和不适合的场景。
- [ ] 我能画出 Prometheus 抓取、存储、查询、告警的数据流。
- [ ] 我能解释 metric、label、sample、time series。
- [ ] 我能解释 job、instance、target。
- [ ] 我能区分 Counter、Gauge、Histogram、Summary。
- [ ] 我能读懂 `/metrics` 中的 HELP、TYPE 和样本行。
- [ ] 我能启动 Prometheus 并访问 `/targets`。
- [ ] 我能写一个最小 `prometheus.yml`。
- [ ] 我能解释 `scrape_interval`、`evaluation_interval`、`scrape_configs`。
- [ ] 我能用 `promtool check config` 检查配置。
- [ ] 我能用 `up`、`rate()`、`sum by`、`histogram_quantile()` 写基础 PromQL。
- [ ] 我能写一个 recording rule。
- [ ] 我能写一个 alerting rule。
- [ ] 我能用 HTTP API 查询 `up`。
- [ ] 我能排查 target DOWN、PromQL 无数据、高基数和规则不触发。
- [ ] 我能说明 Prometheus 在 AIOps 中如何支持异常检测、SLO 和告警降噪。

## 学习证据

学完这篇后，建议提交这些内容到 GitHub：

- `labs/prometheus/prometheus.yml`
- `labs/prometheus/rules/alerting.yml`
- `labs/prometheus/app.py`
- `labs/prometheus/requirements.txt`
- 一张 `/targets` 页面截图。
- 一张 `/rules` 或 `/alerts` 页面截图。
- 一篇笔记：`Prometheus 数据模型.md`
- 一篇笔记：`Counter、Gauge、Histogram、Summary 的区别.md`
- 一篇排障记录：`Prometheus target DOWN 排查.md`
- 一个 Python 脚本：调用 `/api/v1/query_range` 拉取最近 1 小时 QPS。

如果你能从 demo 的 `/metrics` 一路讲到 Prometheus target、TSDB、PromQL、告警规则和 HTTP API，就说明你已经真正理解了 Prometheus 的主干，而不是只会打开一个 dashboard。
