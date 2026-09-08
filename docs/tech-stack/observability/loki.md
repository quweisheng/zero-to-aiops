# Grafana Loki

> 目标：能理解 Loki 为什么是“像 Prometheus 一样的日志系统”，能讲清 log stream、labels、chunks、index、object storage、LogQL、distributor、ingester、querier、query frontend、compactor、ruler，能设计低基数标签，能写基础查询，并能排查“查不到日志、查询慢、标签爆炸、日志告警误报”。

## 官方资料

- [Grafana Loki documentation](https://grafana.com/docs/loki/latest/)
- [Loki architecture](https://grafana.com/docs/loki/latest/get-started/architecture/)
- [Loki components](https://grafana.com/docs/loki/latest/get-started/components/)
- [Understand labels](https://grafana.com/docs/loki/latest/get-started/labels/)
- [Cardinality](https://grafana.com/docs/loki/latest/get-started/labels/cardinality/)
- [Query Loki](https://grafana.com/docs/loki/latest/query/)
- [LogQL](https://grafana.com/docs/loki/latest/query/)
- [Loki configuration parameters](https://grafana.com/docs/loki/latest/configure/)
- [Loki storage](https://grafana.com/docs/loki/latest/configure/storage/)
- [Storage schema](https://grafana.com/docs/loki/latest/operations/storage/schema/)
- [Consistent hash rings](https://grafana.com/docs/loki/latest/get-started/hash-rings/)
- [Promtail agent](https://grafana.com/docs/loki/latest/send-data/promtail/)
- [Grafana Alloy documentation](https://grafana.com/docs/alloy/latest/)
- [Loki GitHub repository](https://github.com/grafana/loki)

说明：本文基于 Grafana Loki 官方文档整理，是原创中文教程，不复制官方全文。特别注意：Promtail 官方页面说明 Promtail 已在 2026-03-02 EOL，商业支持已结束，未来功能开发转到 Grafana Alloy。本文仍会解释 Promtail 的历史位置，但新项目应优先学习 Grafana Alloy 或其他受支持的日志采集方式。

## 场景开场

告警说：

```text
checkout-api 5xx rate > 5%
```

你想查日志：

```text
最近 15 分钟 checkout-api 的 ERROR 日志有哪些？
这些错误是否集中在某个 pod、namespace、cluster？
某条日志能不能跳到对应 trace？
能不能从日志里提取 status_code，按 5xx 统计？
为什么我一查 user_id 就非常慢？
为什么把 request_id 放 label 后 Loki 卡了？
```

传统全文索引日志系统会把日志内容大量索引。Loki 的设计不同：它主要索引 labels，日志内容压缩成 chunks 存储。查询时先用 label 找到日志流和 chunk，再在 chunk 里过滤内容。

这带来一个关键学习点：

```text
Loki 的核心不是“所有字段都建索引”
而是“用少量低基数 labels 快速定位日志流，再用 LogQL 过滤日志内容”
```

## 一句话人话版

Loki 是 Grafana 的日志聚合系统：它像 Prometheus 一样用 labels 组织数据，但存的是日志；它只索引少量标签，不索引全文内容，所以成本低、和指标标签体系一致，但标签设计错误，尤其高基数标签，会严重影响性能和成本。

## 学习边界

入门 Loki 先抓这条链：

```text
应用写日志
  -> Grafana Alloy / supported client 采集
  -> 添加 labels
  -> push 到 Loki distributor
  -> ingester 按 stream 写入 chunks
  -> index 记录 labels 到 chunks 的映射
  -> object storage 保存 chunks
  -> Grafana 用 LogQL 查询
```

第一阶段必须掌握：

- Loki 和 Elasticsearch 的设计差异。
- log stream 是什么。
- labels 是什么，为什么必须低基数。
- chunks 和 index 的关系。
- LogQL 的 log query、filter、parser、metric query。
- `{label="value"}` 选择器。
- `|=`, `!=`, `|~`, `!~`。
- `| json`, `| logfmt`, `| pattern`。
- `count_over_time`、`rate`。
- distributor、ingester、querier、query frontend、compactor、ruler。
- 单体、simple scalable、microservices 部署模式。
- Grafana 查询和日志告警。
- 查不到日志、查询慢、高基数、时间范围错误怎么排查。

暂时可以先不深挖：

- Loki 内部 chunk 编码细节。
- TSDB index 内部实现。
- 大规模多租户调优。
- shuffle sharding。
- query scheduler 复杂容量规划。
- ruler 远程规则存储。
- Bloom filters 细节。
- Grafana Alloy River 语言完整语法。

## 官方知识地图

Loki 官方资料可按这些模块读：

```text
Get started（入门）
  -> What is Loki（Loki是什么）
  -> Architecture（架构）
  -> Components（组件）
  -> Deployment modes（部署模式）
  -> Labels（标签）
  -> Cardinality（不同标签组合的基数）
  -> Query Loki（查询Loki）

Send data（发送数据）
  -> Grafana Alloy（Grafana遥测采集与处理组件）
  -> OpenTelemetry Collector（开放遥测收集器）
  -> Docker driver（容器日志驱动）
  -> Kubernetes integrations（容器平台集成）
  -> Promtail historical docs（旧版Promtail历史文档）

Query（查询）
  -> LogQL（Loki日志查询语言）
  -> Log queries（日志查询）
  -> Metric queries（从日志计算指标的查询）
  -> Parsers（解析器）
  -> Pattern match filters（模式匹配过滤）
  -> Template functions（模板函数）

Configure（配置）
  -> server（服务端监听设置）
  -> common（通用设置）
  -> schema_config（存储模式配置）
  -> storage_config（存储后端配置）
  -> limits_config（限额配置）
  -> ruler（规则计算组件）
  -> compactor（压缩整理组件）
  -> query_range（范围查询配置）

Operations（运行维护）
  -> Storage（存储）
  -> Schema（存储模式）
  -> Retention（保留期）
  -> Recording rules（预计算记录规则）
  -> Alerting rules（告警规则）
  -> Troubleshooting（故障排查）
  -> Scaling（扩缩容）
```

学习顺序：

```text
先懂 Loki 只索引 labels
  -> 再懂 log stream 和 cardinality
  -> 再懂写入路径 distributor/ingester/chunks
  -> 再懂查询路径 query frontend/querier/store
  -> 再懂 LogQL
  -> 最后学部署、告警、调优
```

## 老师带你分清日志内容与索引标签

把日志想成放在箱子里的记录，箱外写环境和服务，箱内是每条事件。Loki 用标签索引定位日志流，把正文压缩成块。类比只帮助理解索引选择，真实系统还有分发、缓冲、持久化与查询协调。Log stream 是日志流，Chunk 是压缩数据块，Index 是帮助找到块的索引。

### 第一课：请求标识为何容易造成标签爆炸

同一服务的四条日志各有不同 `trace_id`（链路标识）。把它作为索引标签，可能形成四个流；留在正文或适用的结构化元数据中，可以在具体检索时过滤。基数是不同标签组合数量，多个有限维度相乘也可能很大。

[Structured metadata（结构化元数据）](https://grafana.com/docs/loki/latest/get-started/labels/structured-metadata/) 用于不宜进入索引的字段，使用前核对版本、存储模式和索引类型。它仍占存储与查询资源，不是无限免费字段，也不替代租户权限隔离。

### 基础实验与故障实验：四条日志形成几个流

本机安装 Node.js，在仓库根目录运行：

```powershell
node examples/teacher-led-reliability-lab/telemetry.mjs loki
node examples/teacher-led-reliability-lab/telemetry.mjs loki --fault
```

正常案例按同一服务形成 1 个流，故障模式加入链路标识形成 4 个流，并输出 `issue: true`。先写出四个标签集合再数唯一组合。生产当然可以有多个正常流，课堂阈值只针对这个案例，不是生产容量标准。

输出不符先查目录、参数和脚本版本。程序不启动 Loki 或发送日志，无资源要清理；保留输出与标签选择理由。真实写入、查询与组件行为继续用后文实验验证。

### 第二课：查不到与查得慢要分开处理

查不到先确认日志产生、采集路径、读偏移、过滤、时间戳、租户和写入响应。采集时间与事件时间不同，延迟上传可能使日志不在当前窗口。没有结果不能直接解释为没有错误。

查询慢先缩小来源与时间，尽早做简单内容过滤，再执行必要解析和聚合。JSON 解析错误要按语义处理，不能为降低错误数直接丢掉不符合预期的事件。结果基数太高时先优化维度和查询，再评估资源与限制。

Distributor（分发器）处理入口与分配，Ingester（写入处理器）管理近期日志与块，Querier（查询器）读取数据，Compactor（整理组件）参与存储整理和保留。部署模式决定这些角色如何组合，图中一个角色不一定对应一台独立机器。

### 第三课：采集和存储一起决定可靠性

对象存储持久保存数据块，近期缓冲的恢复保证取决于具体配置。采集端管理日志轮转、读偏移、缓冲上限与背压；缓冲只是争取恢复时间，长期生产速率超过消费能力仍会积压。给写入拒绝、队列、查询延迟和数据新鲜度配置观察。

保留、租户限额、查询限制控制成本，权限和脱敏保护敏感日志。升级存储 Schema（模式）时保持旧时间段可读，按官方步骤演练迁移；只替换配置不能证明历史数据能正常查询。回滚验证既看新日志，也看旧日志与保留行为。

### 面试课堂：30 秒与 3 分钟

30 秒：“Loki 用标签索引定位日志流，把正文压缩保存，适合按来源和时间检索。关键是标签基数、采集完整性和查询范围。”

3 分钟沿产生、采集、分发、块存储与查询解释，再用链路标识说明成本取舍。追问：“标签越细越快？”可能减少扫描，也可能扩大索引和小块负担。“日志丢在哪？”逐段看偏移、队列、拒绝、租户和时间。

设计题：多租户日志平台如何选择稳定标签与查询限额。事故题：用户标识被升为标签导致流数陡增，核对变更与写入拒绝，回滚后检查数据缺口。GitHub 保存标签合同、实验输出、查询推导和故障记录。

## 深入课堂：从一行日志到一条可信的告警

### 第一站：程序真的把日志交给采集器了吗

我们先不看 Loki。程序可能把日志写到标准输出、文件或其他通道；采集器只会读被配置的来源。你在开发终端看到了日志，不代表生产容器的同一路径也能被采集。第一步是确定生产方式、文件路径或容器输出，再用一条不含敏感信息的独特测试消息观察整个链路。

文件采集通常需要保存读到哪里，这叫 Offset（偏移量）。程序轮转日志文件时，文件名相同不代表底层还是同一个文件。采集器如何识别文件、保存读取位置、应对截断和重命名，都会影响重复或遗漏。理解机制后，你就知道“删掉采集状态文件重启”可能把旧日志重新发送，并不是无害的通用修复。

课堂可以先用纸面模拟三行日志：读取到第二行，程序轮转文件，新文件从第一行开始。分别推导“只按文件名记位置”和“按文件身份与位置记状态”的差别，再查当前采集组件采用什么机制。真正的轮转实验放在独立练习目录，用少量合成日志完成，禁止拿业务审计日志做删除或截断实验。

### 第二站：时间格式为什么决定你能不能找到它

一行日志可能同时有应用事件时间和采集接收时间。前者表示事情何时发生，后者表示系统何时看到它。解析器若把毫秒当秒、把本地时间当 UTC，日志就可能落到错误窗口。UTC 是协调世界时，用统一时区存储并在显示时转换，有助于跨机房对齐事件。

先挑一条已知时间的测试事件，记录原文、解析后的时间、接收时间和页面窗口。若相差整小时，优先检查时区；若相差几个数量级，检查单位；若差值缓慢累积，检查缓冲和时钟。这里是定位线索，不是只凭差值就断定原因。节点时间校准状态、采集配置和写入响应才是验证材料。

多行日志又带来另一个问题：Java 异常栈可能有几十行，但它们属于同一次错误。采集器若每行当事件，错误计数可能被放大；如果多行合并规则过宽，又可能把两次事件粘在一起。用相邻两次异常和一条普通日志验证边界，比较原始条数、合并事件数与字段提取结果，再把规则上线。

### 第三站：LogQL 查询要按问题逐层收紧

先问“来自哪套环境和哪个服务”，用标签选择日志流；再问“哪段时间”，缩小读取区间；最后问“正文包含什么、哪个字段满足条件”。这相当于先找到正确箱子，再打开箱内记录。没有明确问题就搜索所有租户所有历史，会把诊断变成资源消耗。

例如只想找订单服务的超时事件，可以先选择稳定服务标签，再做简单字符串过滤，必要时解析 JSON 字段。`| json` 表示按 JSON 解析日志行，解析错误是输入与假设不一致的证据。不是所有包含大括号的文本都是合法 JSON，也不是所有日志都来自同一格式版本。

日志转指标时，先定义计数单位。`count_over_time` 统计窗口内匹配的日志条目；它不天然等于失败请求数，因为一次失败可能记录多条日志，也可能完全没有日志。要估算请求错误率，优先使用具有清晰分母的请求指标；若只能用日志，先验证记录策略与去重口径，并明确误差。

这一步直接影响 AIOps：模型如果把异常栈每一行当独立故障，会学习到错误的频率。准备训练或检索数据时保留事件边界、服务、环境、版本和时间，正文脱敏，不能为了结构整齐就丢掉所有解析失败样本而不计数。

### 第四站：为什么“保留七天”后磁盘还没下降

Retention（保留策略）不是界面上写一个数字就自动生效。当前受支持的索引方式下，Compactor 负责相关索引整理与保留处理；它先处理索引引用，再通过后续清理删除数据块。因此配置、组件运行、权限、处理进度与延迟都要核对，不能一到七天就期待所有空间瞬间释放。[官方保留说明](https://grafana.com/docs/loki/latest/operations/storage/retention/) 解释了这些阶段和版本条件。

对象存储自身的生命周期规则是另一套机制。它通常按对象年龄或前缀处理，不理解 Loki 的索引关系。粗暴设置整个桶到期删除，可能连仍需要的索引或状态对象一起处理。请把存储桶范围、Loki 保留和实际对象布局交叉检查；本文不提供“一条命令清整个桶”的做法。

排查空间时还要看是哪种空间：采集缓冲、本地写入数据、索引缓存、对象存储和历史备份，各自的生命周期不同。某处目录很大不能证明该目录都是可删除缓存。先确定组件、挂载、配置和官方恢复要求，再制定审批后的清理方案及可恢复性验证。

### 第五站：多租户不只是加一个请求头

Tenant（租户）用于区分数据归属，但客户端声明一个租户标识，不等于已经证明它拥有该租户权限。入口应由可信认证与授权层确认身份，并把身份映射到允许访问的租户。不要允许普通客户端任意伪造租户头后直接访问内部存储接口。

同时检查查询结果、规则评估、告警通知和备份导出是否保持租户边界。只保护写入入口，却允许共享仪表盘跨租户查询，仍会泄露数据。日志可能含请求参数、个人信息或认证材料，脱敏规则要先用合成敏感样例验证，再检查失败时是拒绝、隔离还是继续发送。

### 生产模拟：一场日志洪峰为什么会拖慢整个值班台

假设新版本把调试日志全部打开，某租户的写入突然变成原来的十倍，同时把请求标识提升为标签。写入量与流数量一起上升，小块增多，采集缓冲变长；值班人员又打开全量正则查询，读写竞争进一步加剧。这个案例是教学推演，不是声称发生过的真实事故。

先收集变更时间、日志量、活跃流、拒绝响应、采集积压、查询并发和存储延迟，对比未变更租户。短期选择回退调试级别与标签规则，限制昂贵查询，保护核心采集通道；是否丢弃低价值日志必须按明确策略决定，不能顺手丢审计证据。每个动作都写影响范围和恢复条件。

恢复后核对积压是否排空、数据缺口在哪里、查询口径是否变化，再补日志级别预算、标签合同、租户限额和代表性压测。面试讲到这里，重点是解释两个放大因素如何叠加，而不是只说“Loki 扩容即可”。学习证据保存正常样本、错误规则、观察记录、修订和验收，不保存真实用户日志。

## Loki 在 AIOps 链路中的位置

Loki 是 AIOps 的日志检索和日志指标化层。

```text
应用 / 系统 / Kubernetes
  -> stdout / files / journald（标准输出、文件或系统日志服务）
  -> Grafana Alloy / OTel Collector / supported client（日志采集器、遥测收集器或受支持客户端）
  -> Loki（日志存储与查询系统）
  -> Grafana Explore / Dashboards（交互探索或仪表盘）
  -> LogQL alerts（基于日志查询的告警）
  -> Alertmanager（告警处理器）
  -> AIOps 诊断
```

Loki 给 AIOps 提供：

| 能力 | 价值 |
|---|---|
| 标签化日志检索 | 按 cluster/namespace/service/pod 快速过滤 |
| 日志内容过滤 | 快速看 ERROR、timeout、exception |
| 结构化解析 | 从 JSON/logfmt 日志提取字段 |
| 日志转指标 | 用 LogQL 统计错误数、错误率 |
| trace 关联 | 通过 trace_id 跳到 Tempo/trace 后端 |
| 告警 | 基于日志模式触发告警 |
| 低成本存储 | 大量日志用 object storage 保存 chunks |

在 AIOps runbook 里，Loki 常用于回答：

```text
告警发生前后，服务有没有集中报错？
错误是否集中在某个版本、Pod、节点、租户？
这条 trace 对应哪些日志？
日志里是否出现同一个异常栈？
```

## Loki 是什么

Loki 是一个水平可扩展、高可用、多租户日志聚合系统，设计灵感来自 Prometheus。

最核心设计：

```text
Loki 不索引日志全文内容
Loki 索引 labels
日志内容压缩后放 chunks
```

这和 Elasticsearch 很不一样。

| 维度 | Loki | Elasticsearch |
|---|---|---|
| 索引策略 | 主要索引 labels | 倒排索引大量字段/全文 |
| 查询方式 | 先 label 选 stream，再过滤内容 | 字段/全文检索强 |
| 成本 | 通常更低 | 索引成本更高 |
| 最适合 | 云原生日志、和指标标签关联 | 复杂全文搜索、字段检索 |
| 风险 | label 高基数会很痛 | mapping/index 管理复杂 |

Loki 不是“廉价版 Elasticsearch”。它是不同设计取舍。用 Loki 必须接受一个原则：

```text
标签少而稳，内容用 LogQL 过滤。
```

## Log stream

Log stream 是 Loki 的基本日志组织单位。

一个 stream 由一组 labels 唯一确定。

例如：

```text
{cluster="prod", namespace="aiops", app="checkout-api", pod="checkout-api-7d9f"}
```

所有 labels 完全相同的日志属于同一个 stream。

如果 pod label 不同，就是不同 stream。

如果你把 request_id 放进 label：

```text
{app="checkout-api", request_id="abc"}
{app="checkout-api", request_id="def"}
{app="checkout-api", request_id="ghi"}
```

每个请求都可能变成新 stream。Loki 会创建大量小 stream、小 chunks、小索引项，性能和成本都会变差。

## Labels

Labels 是 Loki 查询入口。

好 labels：

```text
cluster
namespace
app
container
job
env
level
```

坏 labels：

```text
request_id
trace_id
user_id
order_id
ip
timestamp
pod_uid
```

官方文档明确强调高基数 labels 会显著影响 Loki 性能和成本。Loki 默认也限制 index labels 数量。

原则：

```text
低基数字段做 label
高基数字段留在日志内容或 structured metadata
```

低基数：

```text
env=prod/staging/dev
level=info/warn/error
namespace=aiops/platform/default
```

高基数：

```text
user_id=千万用户
trace_id=每个请求不同
timestamp=每行不同
```

## Chunks 和 index

Loki 存储时：

```text
log stream（日志流）
  -> append log entries（追加日志条目）
  -> buffer in ingester（在写入处理器中缓冲）
  -> compress into chunks（压缩成数据块）
  -> store chunks in object storage/filesystem（把数据块存入对象存储或文件系统）
  -> index records label -> chunk references（索引记录从标签到数据块的引用）
```

查询时：

```text
LogQL label selector（日志标签选择器）
  -> 查 index 找到相关 chunks
  -> 读取 chunks
  -> 在 chunk 内容里执行过滤和解析
```

这解释了为什么查询必须先写 label selector：

```text
{app="checkout-api"} |= "ERROR"
```

如果 label selector 太宽：

```text
{namespace=~".+"} |= "ERROR"
```

Loki 需要扫描很多 stream/chunks，查询会慢。

## 写入路径

Loki 写入路径：

```text
Client / Agent（客户端或采集代理）
  -> distributor（分发器）
  -> hash ring（用于分配的哈希环）
  -> ingester（写入处理器）
  -> chunks（压缩数据块）
  -> object storage（对象存储）
  -> index（索引）
```

### distributor

接收写入请求，校验租户、labels、limits，然后把日志分发给 ingesters。

### ingester

维护内存中的 active streams，把日志写进 chunks，达到条件后 flush 到存储。

### object storage

保存 chunks 和索引相关数据。生产常用 S3、GCS、Azure Blob 或兼容对象存储。

本地实验可用 filesystem。

## 查询路径

查询路径：

```text
Grafana / logcli（图形界面或日志命令行查询）
  -> query frontend（查询前端）
  -> query scheduler（查询调度器）
  -> querier（查询执行器）
  -> ingesters for recent in-memory data（从写入处理器取近期内存数据）
  -> object storage for persisted chunks（从对象存储取持久化数据块）
  -> result（结果）
```

### query frontend

接收查询，做拆分、缓存、排队等。

### querier

真正执行查询，从 ingester 和存储读取数据。

### query scheduler

调度查询任务，避免大查询拖垮 querier。

查询慢时，不要只看 Grafana，要看：

- 时间范围是否太大。
- label selector 是否太宽。
- 是否用了高成本正则。
- querier/query-frontend 是否资源不足。
- object storage 是否慢。
- ingester 是否压力大。

## 组件

Loki 是模块化系统，可单体运行，也可拆成多个组件。

常见组件：

| 组件 | 作用 |
|---|---|
| distributor | 接收写入并分发 |
| ingester | 写入 chunks，保存近期数据 |
| querier | 执行查询 |
| query-frontend | 查询拆分、缓存、排队 |
| query-scheduler | 调度查询 |
| compactor | 压缩索引、处理保留策略 |
| ruler | 执行 LogQL 规则和告警 |
| index-gateway | 查询索引网关，常用于大规模部署 |
| gateway | 入口代理，常用于 Helm 部署 |

部署模式：

| 模式 | 说明 |
|---|---|
| single binary | 所有组件一个进程，适合本地和小规模 |
| simple scalable | read/write/backend 三类目标，适合中等规模 |
| microservices | 组件拆开独立扩缩，适合大规模 |

入门先用 single binary 理解概念，再学习 simple scalable。

## Hash ring

Loki 一些组件使用一致性哈希 ring 来分配数据和协调实例。

需要接入 ring 的组件包括：

- distributors。
- ingesters。
- query schedulers。
- compactors。
- rulers。

入门理解：

```text
ring 决定某个 stream 应该由哪些 ingester 负责
```

如果 ring 异常，可能出现：

- 写入失败。
- ingester 找不到。
- 数据复制异常。
- 查询近期日志不完整。

## Storage schema

Loki 使用 `schema_config` 定义存储 schema。

schema 是按时间段生效的：

```yaml
schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h
```

字段：

| 字段 | 含义 |
|---|---|
| `from` | schema 生效开始日期 |
| `store` | 索引存储类型 |
| `object_store` | chunks/index 数据对象存储 |
| `schema` | schema 版本 |
| `index.prefix` | index 前缀 |
| `index.period` | index 周期 |

注意：schema 不是随便改的。生产变更前要看官方迁移文档和版本要求。

## 最小本地配置

本地实验配置示例：

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /tmp/loki
  storage:
    filesystem:
      chunks_directory: /tmp/loki/chunks
      rules_directory: /tmp/loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093
```

启动：

```bash
loki -config.file=loki-local.yaml
```

健康检查：

```bash
curl -v http://127.0.0.1:3100/ready
```

## 采集端：Alloy、OTel Collector、Promtail

### Grafana Alloy

截至 2026-07-02，新项目应优先学习 Grafana Alloy。Alloy 是 Grafana 的 OpenTelemetry Collector distribution，可以采集 logs、metrics、traces，并把日志发送到 Loki。

它替代了历史上的 Promtail 路线。

### OpenTelemetry Collector

OTel Collector 也可以参与日志采集和转发，尤其适合统一遥测管道。

### Promtail

Promtail 曾是 Loki 常见日志采集 agent，负责：

- 发现目标。
- tail 日志文件。
- 添加 labels。
- 维护 positions。
- 发送到 Loki。

但 Promtail 已于 2026-03-02 EOL。现有系统需要迁移，新系统不要再把 Promtail 当长期方案。

## LogQL 基础

LogQL 是 Loki 查询语言。

一条最简单查询：

```text
{app="checkout-api"}
```

含义：选择 label `app=checkout-api` 的所有日志流。

加内容过滤：

```text
{app="checkout-api"} |= "ERROR"
```

常见过滤：

| 写法 | 含义 |
|---|---|
| `|= "ERROR"` | 包含字符串 |
| `!= "healthcheck"` | 不包含字符串 |
| `|~ "5\\d\\d"` | 正则匹配 |
| `!~ "debug|trace"` | 正则不匹配 |

注意：先用 labels 缩小范围，再做内容过滤。

## LogQL parser

JSON 日志：

```text
{app="checkout-api"} | json | status_code >= 500
```

logfmt 日志：

```text
{app="checkout-api"} | logfmt | level="error"
```

pattern：

```text
{app="nginx"} | pattern `<ip> - - [<time>] "<method> <path> <_>" <status> <size>`
```

line_format：

```text
{app="checkout-api"} | json | line_format "{{.status_code}} {{.path}} {{.msg}}"
```

label_format：

```text
{app="checkout-api"} | json | label_format status="{{.status_code}}"
```

谨慎：把高基数字段临时提取为查询时标签可以用于分析，但不要把它们作为 Loki index labels 长期写入。

## LogQL metric queries

从日志生成指标：

统计 5 分钟内 ERROR 行数：

```text
count_over_time({app="checkout-api"} |= "ERROR" [5m])
```

按 pod 聚合：

```text
sum by (pod) (
  count_over_time({app="checkout-api"} |= "ERROR" [5m])
)
```

计算错误速率：

```text
sum by (app) (
  rate({app="checkout-api"} |= "ERROR" [5m])
)
```

解析 JSON 状态码后统计 5xx：

```text
sum by (app) (
  count_over_time({app="checkout-api"} | json | status_code >= 500 [5m])
)
```

这些查询可用于 Grafana 面板或 Loki ruler 告警。

## 日志告警

Loki ruler 可以基于 LogQL 产生告警，并发送到 Alertmanager。

示例：

```yaml
groups:
  - name: checkout-logs
    rules:
      - alert: CheckoutErrorLogsHigh
        expr: |
          sum by (app) (
            count_over_time({app="checkout-api"} |= "ERROR" [5m])
          ) > 20
        for: 10m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "checkout-api has too many ERROR logs"
          runbook_url: "https://example.com/runbooks/checkout-error-logs"
```

日志告警要谨慎：

- 日志格式变动会影响告警。
- ERROR 不一定等于用户影响。
- 采样/丢日志会影响准确性。
- 要避免每条错误日志触发一条告警。

## 多租户

Loki 支持多租户。HTTP 请求中通常通过 tenant header 区分。

常见 header：

```text
X-Scope-OrgID
```

本地实验常禁用：

```yaml
auth_enabled: false
```

生产多租户要设计：

- tenant 边界。
- 认证授权。
- per-tenant limits。
- retention。
- 查询隔离。

## Retention 和 compactor

日志不能无限存。

Loki 使用 compactor 等机制处理压缩和保留策略。

设计 retention 时要问：

- 业务日志保留多久？
- 审计日志保留多久？
- debug 日志是否更短？
- 不同租户是否不同？
- 删除是否满足合规要求？

不要等对象存储爆了再讨论 retention。

## 常用命令字典

### 启动 Loki

```bash
loki -config.file=loki-local.yaml
```

### 检查 ready

```bash
curl -v http://127.0.0.1:3100/ready
```

### 查询 labels

```bash
curl -s "http://127.0.0.1:3100/loki/api/v1/labels"
```

### 查询某 label 的值

```bash
curl -s "http://127.0.0.1:3100/loki/api/v1/label/app/values"
```

### 即时查询

```bash
curl -G "http://127.0.0.1:3100/loki/api/v1/query" \
  --data-urlencode 'query={app="checkout-api"}'
```

### 范围查询

```bash
curl -G "http://127.0.0.1:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={app="checkout-api"} |= "ERROR"' \
  --data-urlencode 'limit=100'
```

### Grafana Explore 查询

在 Grafana 里选择 Loki datasource，输入：

```text
{namespace="aiops", app="checkout-api"} |= "ERROR"
```

### Kubernetes 查看 Loki

```bash
kubectl get pods -n observability -l app.kubernetes.io/name=loki
kubectl logs -n observability -l app.kubernetes.io/name=loki --tail=200
kubectl get svc -n observability
```

## 配置字典

### server

| 字段 | 作用 |
|---|---|
| `http_listen_port` | HTTP API 端口，常见 3100 |
| `grpc_listen_port` | gRPC 端口 |

### common

| 字段 | 作用 |
|---|---|
| `path_prefix` | 本地路径前缀 |
| `storage` | 通用存储配置 |
| `replication_factor` | 复制因子 |
| `ring` | ring 配置 |

### schema_config

| 字段 | 作用 |
|---|---|
| `from` | schema 生效日期 |
| `store` | 索引存储 |
| `object_store` | 对象存储 |
| `schema` | schema 版本 |
| `index.period` | 索引周期 |

### storage_config

| 字段 | 作用 |
|---|---|
| `filesystem` | 本地文件系统存储 |
| `aws` | S3 存储 |
| `gcs` | Google Cloud Storage |
| `azure` | Azure Blob |

### limits_config

| 字段 | 作用 |
|---|---|
| `retention_period` | 保留周期 |
| `ingestion_rate_mb` | 写入速率限制 |
| `max_label_names_per_series` | 每个 stream label 数限制 |
| `reject_old_samples` | 是否拒绝旧样本 |
| `max_query_length` | 查询时间范围限制 |

## AIOps 入门实验

目标：启动本地 Loki，写入几条带 label 的日志，用 LogQL 查询和统计。

### 1. 启动 Loki

保存 `loki-local.yaml`，使用上面的最小配置。

启动：

```bash
loki -config.file=loki-local.yaml
```

检查：

```bash
curl -v http://127.0.0.1:3100/ready
```

### 2. 手工写入日志

Loki push API 示例：

```bash
curl -X POST "http://127.0.0.1:3100/loki/api/v1/push" \
  -H "Content-Type: application/json" \
  -d '{
    "streams": [
      {
        "stream": {
          "app": "checkout-api",
          "env": "lab",
          "level": "error"
        },
        "values": [
          [ "1893456000000000000", "ERROR payment timeout trace_id=abc123 status_code=504" ]
        ]
      }
    ]
  }'
```

时间戳是纳秒。实验时请替换成当前时间的纳秒时间戳，否则查询时间范围可能查不到。

PowerShell 获取纳秒时间戳可以用：

```powershell
[int64](([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) * 1000000)
```

### 3. 查询日志

```bash
curl -G "http://127.0.0.1:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={app="checkout-api"} |= "ERROR"' \
  --data-urlencode 'limit=20'
```

### 4. LogQL 指标化

```text
count_over_time({app="checkout-api"} |= "ERROR" [5m])
```

在 Grafana Explore 里执行，观察结果。

### 5. 形成学习证据

记录：

```text
labels:
为什么这些 labels 是低基数:
查询语句:
错误日志内容:
count_over_time 结果:
如果查不到，我检查了哪些时间范围和 labels:
```

## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| 查不到日志 | 时间范围、labels | 时间戳不在范围、label 错、tenant 错 | 查 labels API 和 query_range |
| Grafana 无数据源 | datasource 配置 | URL/tenant/auth 错 | 测 `/ready` 和 datasource |
| 日志写入失败 | Loki logs、client logs | label 太多、时间太旧、限流 | 查 limits_config |
| 查询很慢 | LogQL selector | selector 太宽、时间太长、正则重 | 缩小 labels 和时间范围 |
| Loki 内存高 | streams/cardinality | 高基数 labels | 移除 request_id/user_id 等 labels |
| chunks 很碎 | stream 太多 | 高基数导致小 chunks | 调整 label 设计 |
| 告警误报 | LogQL rule | 日志格式变、ERROR 语义不稳 | 改解析和阈值 |
| 近期日志不完整 | ingester | ingester 异常、ring 问题 | 查 ingester/ring |
| 历史日志查不到 | storage/schema | 对象存储/schema/retention | 查 storage_config 和 compactor |
| Promtail 配置过时 | Promtail EOL | 仍使用 Promtail | 迁移 Alloy |

## 排障流程：查不到日志

### 1. 确认 Loki ready

```bash
curl -v http://loki:3100/ready
```

### 2. 查 label 是否存在

```bash
curl -s "http://loki:3100/loki/api/v1/labels"
curl -s "http://loki:3100/loki/api/v1/label/app/values"
```

### 3. 缩小查询

先查最宽的低基数 label：

```text
{app="checkout-api"}
```

再加过滤：

```text
{app="checkout-api"} |= "ERROR"
```

### 4. 检查时间范围

Grafana Explore 默认时间范围可能太短。扩大到最近 6 小时或 24 小时。

如果手工 push，确认 timestamp 是当前纳秒时间戳。

### 5. 检查 tenant

多租户环境确认 `X-Scope-OrgID` 或 Grafana datasource tenant 设置。

## 排障流程：查询很慢

看查询：

```text
{namespace=~".+"} |~ ".*error.*"
```

问题：

- selector 太宽。
- 时间范围可能太大。
- 正则太重。
- 没有先用 labels 缩小。

优化：

```text
{namespace="aiops", app="checkout-api"} |= "ERROR"
```

再逐步加 parser：

```text
{namespace="aiops", app="checkout-api"} | json | level="error"
```

原则：

```text
先 label 过滤，再内容过滤，再解析，再聚合。
```

## 排障流程：高基数

症状：

- Loki 内存上升。
- ingester 压力高。
- 查询慢。
- chunks 很碎。
- index 增长快。

检查 labels：

```bash
curl -s "http://loki:3100/loki/api/v1/labels"
```

找危险 label：

```text
request_id
trace_id
user_id
pod_uid
ip
timestamp
```

处理：

- 从 index labels 移除高基数字段。
- 保留在日志正文或 structured metadata。
- 用 LogQL parser 查询时提取。
- 对需要关联 trace 的日志，把 trace_id 放正文或结构化字段，不做 Loki label。

## AIOps 自动化诊断脚本

```bash
#!/usr/bin/env bash
set -euo pipefail

loki="${1:-http://loki:3100}"
query="${2:-{app=\"checkout-api\"}}"

echo "== ready =="
curl -s "$loki/ready" || true

echo
echo "== labels =="
curl -s "$loki/loki/api/v1/labels" || true

echo
echo "== query =="
curl -G "$loki/loki/api/v1/query_range" \
  --data-urlencode "query=$query" \
  --data-urlencode "limit=20" || true
```

生产化前要补：

- tenant header。
- 自动检查时间范围。
- 查询 label cardinality。
- 采集 Loki 组件 logs。
- 保存 Grafana explore URL。
- 和 Alertmanager alert labels 联动生成 LogQL。

## 面试怎么讲

Loki 是受 Prometheus 启发的日志聚合系统。它和全文索引日志系统不同，Loki 主要索引 labels，不索引日志全文内容；日志内容按 stream 压缩成 chunks 存储到对象存储或本地文件系统。查询时先用 LogQL 的 label selector 找到相关 stream 和 chunks，再对日志内容做字符串、正则、JSON/logfmt/pattern 解析和聚合。Loki 的性能高度依赖标签设计，低基数标签能快速定位日志流，高基数标签如 request_id、user_id、trace_id 会造成大量 stream 和小 chunks，显著降低性能并增加成本。排障时我会先看时间范围、labels、tenant、写入客户端、Loki ready、组件日志，再分析 LogQL 是否过宽。

## 小白可能会问

### Loki 会索引日志全文吗？

不会像 Elasticsearch 那样索引全文。Loki 主要索引 labels，日志内容压缩成 chunks，查询时再过滤内容。

### 为什么不能把 trace_id 放 label？

trace_id 通常每个请求不同，是高基数字段。放 label 会创建大量 stream，影响性能和成本。可以放日志内容或 structured metadata，用查询时解析。

### labels 越多越好吗？

不是。Loki 标签要少而稳定。标签越多、基数越高，stream 越多，系统越难跑。

### 查不到日志第一步看什么？

先看时间范围和 label 是否存在。很多“查不到”是时间范围太窄、label 名不对、tenant 不对。

### Promtail 还能新项目使用吗？

不建议。Promtail 已在 2026-03-02 EOL，新项目应优先使用 Grafana Alloy 或其他受支持客户端。

## 学习路线

第一阶段：模型

- log stream。
- labels。
- chunks。
- index。
- cardinality。

第二阶段：查询

- label selector。
- line filters。
- parsers。
- metric queries。
- Grafana Explore。

第三阶段：架构

- distributor。
- ingester。
- querier。
- query frontend。
- compactor。
- ruler。

第四阶段：采集

- Grafana Alloy。
- OTel Collector。
- Kubernetes logs。
- Promtail 历史迁移。

第五阶段：AIOps

- 日志告警。
- 告警 label 转 LogQL。
- trace_id 日志关联。
- 错误模式聚合。
- 自动诊断报告。

## 学习检查清单

- [ ] 我能解释 Loki 和 Elasticsearch 的核心差异。
- [ ] 我能解释 Loki 为什么主要索引 labels。
- [ ] 我能解释 log stream 是什么。
- [ ] 我能说出哪些 label 是低基数，哪些是高基数。
- [ ] 我能解释 chunks 和 index 的关系。
- [ ] 我能写基础 LogQL label selector。
- [ ] 我能使用 `|=`、`!=`、`|~`、`!~`。
- [ ] 我能使用 `| json`、`| logfmt`、`| pattern`。
- [ ] 我能写 `count_over_time` 和 `rate` 查询。
- [ ] 我能解释 distributor、ingester、querier、query frontend。
- [ ] 我能解释 compactor 和 ruler 的作用。
- [ ] 我知道 Promtail 已 EOL，知道应学习 Alloy。
- [ ] 我能排查查不到日志。
- [ ] 我能排查查询慢。
- [ ] 我能识别高基数 label 问题。
- [ ] 我能把 Loki 查询写进 AIOps runbook。

## 面试题

1. Loki 解决什么问题？
2. Loki 和 Elasticsearch 最大设计差异是什么？
3. Loki 为什么不适合把 request_id 做 label？
4. 什么是 log stream？
5. labels、chunks、index 的关系是什么？
6. Loki 写入路径经过哪些组件？
7. Loki 查询路径经过哪些组件？
8. distributor 和 ingester 分别做什么？
9. query frontend 和 querier 分别做什么？
10. compactor 做什么？
11. ruler 做什么？
12. LogQL `{app="api"} |= "ERROR"` 是什么意思？
13. `| json` 和 `| logfmt` 用来做什么？
14. 如何从日志生成指标？
15. 查询很慢你会怎么优化 LogQL？
16. 查不到日志你会怎么排查？
17. 什么是高基数？它为什么伤害 Loki？
18. Promtail 当前状态是什么？新项目应该用什么？
19. Loki 如何和 Alertmanager 结合？
20. Loki 在 AIOps 根因分析中有什么价值？

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `loki-local.yaml` 本地配置。
- 一份手工 push 日志的 API 示例。
- 一份 LogQL 查询笔记，包含 label selector、line filter、parser、metric query。
- 一份高基数 label 反例说明。
- 一份“查不到日志”的排障记录。
- 一个 Loki 诊断脚本，能检查 ready、labels、query_range 和 tenant。
