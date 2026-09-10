# Elasticsearch

> 目标：能理解 Elasticsearch 为什么适合搜索和日志分析，能讲清 cluster、node、index、document、field、mapping、analyzer、inverted index、shard、replica、data stream、index template、Query DSL、aggregation、ingest pipeline、ILM 和 cluster health，能写入/查询文档，并能排查 yellow/red、mapping 错、查不到字段、写入慢、查询慢。

## 老师先带你认路

今天的任务不是搭一套公司日志平台，而是回答一个值班问题：“支付超时日志到底没有产生、没有存进去，还是已经存了却没有被我们的查询找到？”这三种现象在仪表盘上都可能表现为空白，修复方法却完全不同。我们先用两条可控日志找到差别，再讨论怎样把方法放大到多节点。

你需要知道的前置知识只有三件：进程是正在运行的程序；端口是程序接收连接的编号；JSON 是用字段名和值表达一条记录的文本格式。HTTP 请求则包含操作方法、访问地址和可选正文。本文的 GET 用来读取，PUT 用来创建或指定标识写入，POST 用来提交处理，DELETE 会删除指定对象，不能拿生产地址练习。

第一遍读场景、字段语义以及后文的 Windows PowerShell 基础实验；第二遍再读分片、恢复、容量与面试。实验需要已启动的 Docker Desktop Linux 容器环境、可用的本机 9200 端口和约 4 GB 空闲内存，给实验容器限制 2 GB 内存，另留镜像与少量数据空间。不会看容器状态时，只补读 [Docker 的镜像、容器和端口部分](../cloud-native/docker.md)；网络不通时再看 [网络基础](../foundation/networking.md)，不要求先学 Kubernetes。

## 官方资料

- [Elastic Docs](https://www.elastic.co/docs/)
- [Elasticsearch Reference](https://www.elastic.co/docs/reference/elasticsearch)
- [Index settings](https://www.elastic.co/docs/reference/elasticsearch/index-settings/index-modules)
- [Data streams](https://www.elastic.co/docs/manage-data/data-store/data-streams)
- [Index templates](https://www.elastic.co/docs/manage-data/data-store/templates)
- [Get cluster health API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-cluster-health)
- [CAT health API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-cat-health)
- [CAT indices API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-cat-indices)
- [CAT shards API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-cat-shards)
- [Search API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-search)
- [Terms aggregation](https://www.elastic.co/docs/reference/aggregations/search-aggregations-bucket-terms-aggregation)
- [Elasticsearch Python client](https://elasticsearch-py.readthedocs.io/)

说明：本文基于 Elastic 官方文档和 API 文档整理，是原创中文教程，不复制官方全文。Elasticsearch 版本、授权和部署形态变化较快，生产环境请以当前集群的 `GET /` 版本和对应官方文档为准。

## 场景开场

你把应用日志发进 Elasticsearch，想查：

```text
最近 15 分钟 checkout-api 的 5xx 日志
按 service 聚合错误数
按 trace_id 找某次请求
按 message 搜 timeout
```

结果遇到一堆问题：

- 字段明明写进去了，为什么查询不到？
- `message` 能 match，但 `service` 该用 match 还是 term？
- 为什么 `user_id` 聚合很慢？
- 为什么集群 health 是 yellow？
- 为什么索引越来越多、磁盘越来越满？
- 为什么写入突然变慢？
- 为什么日志时间字段没识别成 date？
- 为什么同一个字段有时候是 text，有时候是 object，导致 mapping conflict？

Elasticsearch 的学习重点不是“会 curl 一条搜索 API”，而是理解文档写入后如何被 mapping 解析、如何被 analyzer 分词、如何进 shard、如何建立倒排索引、查询时 Query DSL 如何命中、聚合如何消耗资源、时间序列日志如何用 data stream / template / ILM 管理生命周期。

## 一句话人话版

Elasticsearch 把日志等文档整理成可快速查找和统计的索引，帮助你从大量记录中找到故障证据。

## 学习边界

入门阶段先抓这条知识依赖链。这里的箭头表示接下来学习什么，不表示模板会在每次写入时重新创建，也不表示查询负责触发副本复制：

```text
JSON document（JSON文档记录）
  -> index / data stream（索引或数据流）
  -> index template（索引模板）
  -> mappings / settings（字段映射与索引设置）
  -> ingest pipeline（写入处理流水线）
  -> primary shard（主分片）
  -> inverted index / doc values（倒排索引与列式字段值）
  -> replica shards（副本分片）
  -> Query DSL search（使用领域查询语言搜索）
  -> aggregations（聚合统计）
  -> ILM rollover / retention（索引生命周期滚动与保留）
```

必须掌握：

- cluster、node、index、document、field。
- shard、primary shard、replica shard。
- mapping、dynamic mapping、mapping conflict。
- text 和 keyword 的区别。
- analyzer、token、inverted index。
- Query DSL：match、term、range、bool、filter。
- aggregations：terms、date_histogram。
- data stream 和 backing indices。
- index template 和 component template。
- ingest pipeline 和 processors。
- ILM rollover、hot/warm/cold/delete 思路。
- cluster health green/yellow/red。
- `_cat/indices`、`_cat/shards`、`_cluster/health`。

暂时可以先不深挖：

- Lucene segment merge 内部细节。
- scoring 的 BM25 公式。
- 向量检索和 hybrid search。
- cross-cluster replication/search。
- snapshot repository 生产细节。
- shard allocation awareness 高级策略。
- query cache/request cache 深度调优。
- Elastic Security、APM、Fleet 全套生态。

## 官方知识地图

Elasticsearch 官方资料可按这些模块读：

```text
Core concepts（核心概念）
  -> Cluster（集群）
  -> Node（节点）
  -> Index（索引）
  -> Document（文档）
  -> Field（字段）
  -> Shards and replicas（分片与副本）

Data modeling（数据建模）
  -> Mappings（字段映射）
  -> Field types（字段类型）
  -> Dynamic mapping（动态映射）
  -> Runtime fields（查询时计算字段）
  -> Index settings（索引设置）
  -> Analyzers（文本分析器）

Data management（数据管理）
  -> Data streams（数据流）
  -> Index templates（索引模板）
  -> Component templates（组件模板）
  -> Aliases（别名）
  -> ILM（索引生命周期管理）
  -> Snapshot and restore（快照与恢复）

Ingest（数据写入）
  -> Document APIs（文档接口）
  -> Bulk API（批量接口）
  -> Ingest pipelines（写入流水线）
  -> Processors（处理器）

Search（搜索）
  -> Search API（搜索接口）
  -> Query DSL（查询领域语言）
  -> Full-text queries（全文查询）
  -> Term-level queries（词项级查询）
  -> Compound queries（组合查询）
  -> Sort（排序）
  -> Pagination（分页）
  -> Highlighting（高亮）

Aggregations（聚合统计）
  -> Bucket aggregations（分桶聚合）
  -> Metrics aggregations（指标聚合）
  -> Pipeline aggregations（流水线聚合）
  -> Terms aggregation（按词项分组聚合）
  -> Date histogram（日期直方图）

Operations（运行维护）
  -> Cluster health（集群健康）
  -> CAT APIs（便于查看的表格类接口）
  -> Shard allocation（分片分配）
  -> Index lifecycle（索引生命周期）
  -> Monitoring（监控）
```

学习顺序：

```text
先懂 document/index/shard（文档、索引和分片）
  -> 再懂 mapping 和 analyzer（字段映射和文本分析器）
  -> 再懂 query DSL（查询领域语言）
  -> 再懂 aggregation（聚合统计）
  -> 再懂 data stream/template/ILM（数据流、模板和生命周期管理）
  -> 最后学集群健康和性能排障
```

## 老师带你理解“写进去了，为什么搜不到”

我们写入一条日志 `Payment Timeout`。程序显示成功，你用同样大小写搜索却可能找不到。先分清 Document（文档：一条 JSON 记录）、Field（字段：记录中的一项）、Mapping（映射：字段如何解释）、Analyzer（分析器：文本如何拆分和规范化）。搜索结果取决于字段语义与查询方式，不只是屏幕上看见的字符串。

`text` 常用于全文检索，内容会经过分析；`keyword` 常用于精确值和聚合。假设分析结果是 `payment`、`timeout`，词项级查询直接找 `Payment` 可能不匹配；全文查询通常会按其规则处理输入。实际分析器可配置，先看目标索引映射与分析结果，不把本例拆分规则当所有语言的通用算法。

### 基础实验与故障实验：先观察索引中的词

准备 Node.js，在仓库根目录执行纯数据演练：

```powershell
node examples/teacher-led-reliability-lab/telemetry.mjs elasticsearch
node examples/teacher-led-reliability-lab/telemetry.mjs elasticsearch --fault
```

正常查 `payment` 命中，故障查 `Payment` 不命中，`analyzedTokens` 列出课堂索引词，`issue` 表示设定故障。这个脚本不启动 Elasticsearch，仅帮助理解词项与原文的区别。后文真实实验用映射、写入和搜索验证。失败先查目录、参数和 Node；无资源要清理，保留输出与推理。

### 第二课：确认写入、持久化与可搜索是不同阶段

请求经过协调与主分片，复制按集群设置参与确认；搜索可见性还涉及 Refresh（刷新可搜索视图）。不要把频繁强制刷新当默认修复，写入吞吐会受影响。故障时区分响应是否确认、目标索引是否正确、查询窗口与映射是否匹配，再查刷新与分片状态。

Shard（分片）将索引数据拆开，Replica（副本）提高部分故障下可用性并参与读取。分片太多会增加管理开销，太少又限制某些扩展方式，按数据规模、增长和查询负载设计。集群黄色通常与副本分配有关，红色意味着至少某些主分片不可用；具体影响要定位索引，不能看到颜色就删除数据。

### 第三课：日志平台的容量和恢复

写入预算取决于文档数、大小、字段数、分析、复制与存储。动态字段失控会扩大映射，批量写入还要逐项检查失败，不能只看请求级状态。查询要限制时间与范围、选择合适字段、正确处理分页；高开销聚合和深分页可能拖慢集群。

生命周期管理安排滚动索引和保留，快照提供历史恢复；副本不会替代快照。升级前核对版本、插件、索引兼容和客户端行为，在隔离环境验证快照恢复与典型查询。为写入与查询分配不同最小权限，日志脱敏并限制跨租户访问。

### 面试课堂：30 秒与 3 分钟

30 秒：“Elasticsearch 把文档按映射与分析规则组织成可搜索索引，分片承担数据和查询。排障先区分写入、可见性、字段语义与分片分配。”

3 分钟用一条日志讲写入、分析、主副本与搜索，再说明 `text` 和 `keyword` 的取舍。追问：“写入成功搜索为空？”检查索引、刷新、时间与查询类型。“分片越多越快？”解释并发收益和协调成本。“有副本为何备份？”复制不能提供所有历史恢复能力。

设计题：每日增长的多租户日志如何滚动、保留、限制和恢复。事故题：新日志引入大量动态字段，先看映射变化和逐项写入失败，再回退生产者或模板并评估既有数据。GitHub 保存映射、实验、真实查询和恢复说明。

## 进阶课堂：把搜索系统的内部账本讲明白

### 从零认识“索引”：同一个词为什么有两种意思

同学，你会在文章里反复看到 index。作为资源名，它表示一组文档及其映射、设置；作为数据结构，它表示为了加速查找而建立的辅助组织。可以把前者想成一本登记册，把后者想成册后的检索目录。它们有关联，但不是同一层概念。

假设有三条日志，分别包含“支付超时”“支付成功”“库存超时”。如果每次查询都从头看三条原文，数据越多越慢。倒排索引换一个方向，先记“支付出现在哪些文档”“超时出现在哪些文档”，查询时再找候选集合。实际中文分词由分析器决定，这里的两个词是人为划定的课堂词项，不暗示默认分析器会按这个方式处理中文。

倒排索引适合从词找文档；聚合需要按文档读取字段值，通常利用另一种按列组织的结构 Doc values（文档值）。这解释了为什么“全文能搜到”不代表“这个字段适合直接做分组统计”。你遇到字段不适合聚合时，应检查映射和预期语义，不能仅为消除报错就打开高内存成本的选项。

映射因此不是写完便忘的配置。它像数据合同：时间是什么格式，耗时用整数还是小数，状态码用于计算还是精确匹配，消息用于全文搜索还是保留原样。上线前准备几条正常和异常样本验证合同。生产者把 `duration_ms` 从数值改成带单位字符串时，需要同时调整合同、转换和查询，而不是要求接收端“自动理解”。

### 再走一遍写入路径：为什么有几个不同的成功点

客户端发送文档后，协调节点根据路由找到主分片，主分片完成处理，再按相关配置与副本交互。节点还需要维护恢复用的事务日志 Translog，以及用于查询的索引结构。这里没有一个万能的“保存完成”：请求确认、崩溃恢复保证、搜索可见性，是你必须分别说明的三个问题。

默认的请求级事务日志持久策略，会在相关事务日志完成持久化后再报告成功；异步策略则改变崩溃时的风险窗口。Refresh（刷新）处理搜索可见性，Flush（刷写与事务日志维护）处理另一层生命周期。不要因中文都叫“刷新”就混成一个操作。参数与部署形态以 [Translog 官方说明](https://www.elastic.co/docs/reference/elasticsearch/index-settings/translog) 为准。

如果业务流程确实要求“写完接着搜”，可以评估请求的 `refresh=wait_for`：等待相应刷新，而不是每条都主动制造一个小刷新。它也会增加等待，不能无限提高调用频率。先确定业务是否真需要立即搜索，是否可按文档标识直接读取，再做吞吐与延迟取舍。参见 [refresh 参数说明](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/refresh-parameter)。

现在请你解释：写入日志返回成功，仪表盘仍没有结果，要按什么顺序检查？先查实际索引或别名，再查事件时间、时区、租户、字段类型与过滤条件，最后结合分片和刷新证据定位。若直接反复提交，可能产生重复日志，反而污染错误率和 AIOps 训练集。

### Bulk 批量写入：整车到了，不代表每个包裹都签收

Bulk API 把多项写入放在一个请求里，减少网络往返。它的每个项目仍有自己的处理结果，所以请求返回正常并不证明所有文档都成功。采集程序要检查顶层 `errors` 和每项结果，区分格式不合法、权限问题、并发冲突和暂时拒绝。具体格式见 [Bulk 官方接口](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-bulk)。

假设 100 条里 97 条成功、2 条字段类型冲突、1 条暂时拒绝。合理处理不是把 100 条无限重发：先记录成功项；类型冲突进入受控隔离区，保留脱敏样例等待修订；暂时失败按退避策略有限重试。退避表示失败后逐步延长等待，抖动表示给等待加少量随机变化，避免所有采集器同一瞬间再次冲击后端。

选择稳定文档标识能帮助重试去重，但要明确语义：同一标识用覆盖方式写入，会把旧内容替换；自动生成不同标识可能保留重复事件。审计日志是否允许覆盖、纠错事件如何追加，都应先定业务合同。不能只为了去重省事，改变证据的完整性要求。

### 两位同学同时修改：版本条件为什么不能省

小王和小李都读取同一条配置摘要。小王把负责人改为甲，小李稍后拿旧文档修改备注并整体提交，可能覆盖小王的更新。这叫 Lost update（丢失更新）：请求都成功了，但较早的正确修改消失了。

乐观并发控制的思路是“我只在对象仍是刚才那个版本时修改”。Elasticsearch 可用 `if_seq_no` 与 `if_primary_term` 表达条件，它们对应操作序号和主分片任期相关信息，不要自行猜一个数字。先读到版本信息，再带条件提交；冲突时重新读取并决定合并或拒绝。见 [乐观并发控制](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/optimistic-concurrency-control)。

课堂练习不需要生产数据：在笔记中写原值、两次读取、第一次提交、第二次带旧条件提交四行，推导第二次为什么应拒绝。进阶追问是“自动重试是否一定正确”：若业务是覆盖备注，合并规则与累加计数不同，必须先定义操作语义。并发工具不能代替业务规则。

### 容量设计：不要只问有多少 GB

同样一天 100 GB 日志，少量大文档与大量小文档的负担不同；固定十个字段与不断增加动态字段的负担不同；只查最近一小时与全量多维聚合的负担也不同。容量评估要同时记录文档速率、大小分布、字段增长、分片数量、保留、副本和查询形态，再留故障与恢复余量。

分片多会增加索引管理和查询协调开销。新增节点也不等于某个热点写入立即平均分散。先观察数据和请求是否集中到少数分片，检查路由设计与热点租户；再选择滚动索引、调整下一代索引布局或迁移方案。改变已有索引结构常涉及重建与数据搬迁，需要双读校验和切换回退，不是改一行注释就结束。

恢复验收也不能只看集群变绿。至少验证代表性时间范围可搜索、文档数与约定校验一致、权限未放宽、写入仍可持续、面板与告警引用正确索引。备份目录存在只证明有文件；恢复到隔离环境并完成这些核对，才为恢复能力提供证据。

## 深入建模：先保证查到的确实是你要的记录

### 一个字段的三份用途：原文、倒排与列式值

现在你已经知道倒排索引用于“拿词找文档”，我们再看一个容易忽略的事实：在常见默认设置中，返回结果里的 `_source` 是保存的原始文档表示，搜索使用的结构却不等于这份原文。一个字段可能存在于原文中，但没有按你设想的方式建立检索结构。因此，看到结果里有这个字段，只能证明原文包含它，不能证明这个字段可用任意方式搜索。

Doc values 是写入时为适用字段构建的列式字段值，方便排序和聚合时读取。这里“列式”指相同字段的值按便于访问的方式组织，不等于把整个 Elasticsearch 变成分析型关系数据库。数值和关键词通常可以利用它，全文文本一般走另一条路径。对关键词做分组出现报错时，先查目标字段与索引映射，而不是直接打开全文字段的高成本内存加载。细节见 [doc values 官方说明](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/doc-values)。

用课堂日志推理：消息正文需要搜“超时”，服务名需要精确识别支付服务，耗时需要算平均值。三者分别适合全文文本、关键词和数值类型。若把所有字段都存成全文文本，接收看似很方便，但排序、分组和数值范围都失去了正确前提；若全部存成关键词，又丢掉了自然语言全文分析的能力。建模应从“将来怎样问问题”倒推，而不是从“今天怎样最容易写进去”正推。

还有一种故障更隐蔽：关键词字段设置了长度限制 `ignore_above`，过长内容仍可能留在原文，却不进入该字段的索引。处理格式异常值的 `ignore_malformed` 也不是把坏数据自动修好。生产需要记录被忽略字段和失败文档的比例，明确哪些记录只是“接收了原文”、哪些真的进入了关键统计；否则错误率下降可能只是错误记录变得不可检索。核对 [长度忽略规则](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/ignore-above) 与 [格式异常处理边界](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/ignore-malformed)。

### 对象数组：为什么“甲负责数据库”会被误查成真

设想一条事故记录列出两位参与者：甲负责网络，乙负责数据库。你要查“甲且负责数据库”，直觉上不该命中。但普通对象数组可能把姓名值和职责值分别组织起来，丢失“谁对应哪个职责”的对象边界。分别满足两个条件并不能证明它们来自同一个数组元素。这是数据模型问题，增加搜索重试不会修好。

Nested（嵌套类型）用于保存这种数组元素之间的独立关联。它在底层增加隐藏文档，查询时通过嵌套查询明确要求条件落在同一个对象内。好处是语义正确，代价是文档数、写入和查询工作量增加。只有确实要约束同一数组元素的字段组合时才选它，不要把每个对象都设成嵌套。验证方法是同时准备“应该命中”和“看似相关但不应命中”的反例，不能只测一条成功数据。[嵌套类型说明](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/nested)。

Flattened（扁平化字段类型）解决的是另一类问题：例如外部设备不断带来不同名称的附加属性，逐个动态扩展映射会造成字段数量失控。它把对象里的叶子值按关键词式语义索引，适合不稳定的键值属性集合；它不是嵌套关联的通用替代，也不能把看起来像数字的字符串范围当真正数值范围使用。订单耗时、容量和时间等核心字段仍应单独显式建模。[扁平化类型说明](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/flattened)。

暂停一下：设备自定义属性里有温度，要做超过阈值的告警，放进扁平化字段是否足够？参考回答是，先保留灵活属性用于查找，再把用于计算的温度提取成明确单位的数值字段，并校验转换失败率。这样灵活性和计算正确性各有落点，不让告警暗中依赖字符串排序。

### 模板变更为什么没有修好旧索引

索引模板是新索引创建时应用的规则，不是不断覆盖既有索引的后台同步程序。假如旧索引把耗时识别为文本，今天修改模板，新一天的索引可能正确，昨天的数据仍然错误；跨两天搜索就可能出现字段能力不一致。排障时把“模板预期”“实际索引映射”“跨索引查询字段能力”分开保存，才能解释问题为什么只在某些时间窗口出现。

`GET /logs-aiops*/_field_caps?fields=status_code` 可以检查匹配索引中该字段的类型以及能否搜索、聚合。这里通配符是只读查询范围，实际生产要缩小到已授权的索引集合。响应中出现不同类型时，先定位是哪一代索引偏离合同；这比在仪表盘反复修改查询更直接。字段已建立为错误类型，通常需要新索引和受控重建，而非原地更改类型。

重建的教学顺序是：先创建正确目标映射，再复制小批脱敏数据，比较文档数、转换失败数和代表性查询，最后才讨论持续写入期间如何补齐增量、切换别名和回退。别名是访问一个或多个索引的稳定名字，可以减少客户端改地址，但别名切换不负责自动搬数据。未经补数核对就切换，会把“字段正确”换成“历史缺失”。

## 深入查询：结果快、完整、相关是三件事

### 评分和过滤不要混为“查询速度开关”

查询上下文会判断匹配程度并产生相关性分数；过滤上下文只回答是否符合条件。相关性不是事故严重程度，也不是事件发生概率。默认常用的 BM25 是文本相关性方法，考虑词频、词在文档集合中的稀有程度以及文档长度等因素。它能帮助找相似错误描述，不能直接把最高分文档认定为根因。

值班要查“生产环境支付服务最近十五分钟超时”，环境、服务和时间通常是不参与相关性打分的过滤条件，消息正文才可能需要全文相关性。过滤条件有缓存机会，但是否缓存取决于策略、重复使用和请求特点，不是写了过滤就保证缓存命中。特别是不断变化的当前时间窗口，不能照搬固定历史查询的性能预期。[查询与过滤上下文](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-filter-context)。

`bool` 的 `should` 也不是无条件“必须满足至少一个”。当组合里已有 `must` 或 `filter` 时，默认语义可能让它只是加分；如果你的业务要求多个候选条件至少命中一个，应明确写出 `minimum_should_match`。先把每个条件读成中文布尔逻辑，再准备正反样本验证。这样能够发现“查询合法但筛选条件实际没有生效”的错误。[布尔查询规则](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-bool-query)。

### 分散执行、集中合并为什么影响统计答案

一次搜索通常由接收请求的协调节点分发给相关分片副本，各分片完成局部搜索，再由协调节点合并候选结果、取回所需字段。一次查询并不是必定同时在同一分片的所有副本上完整执行。副本能帮助分散多次读取负载，但分片越多，一次宽范围查询涉及的分发和合并工作也越多。

按服务取错误数最多的十项时，各分片先贡献局部候选，协调节点再归并。因此分布式 `terms` 聚合在某些排序与截断条件下存在计数误差，不能把返回的前十项当完整账本。先理解返回的误差与未返回桶统计，再根据目的调整候选规模；要遍历大量分组，可研究带分页的复合聚合，而不是把桶数量无限调大。原有的 [词项聚合官方页](https://www.elastic.co/docs/reference/aggregations/search-aggregations-bucket-terms-aggregation) 解释了这些条件。

现在问你：审计报告中“所有服务错误数之和”为何小于错误文档总数？可能不是丢日志，而是只返回了前十个分组，也可能服务字段缺失、受长度限制未索引，或者查询期间有分片失败。应该分别检查分组范围、字段覆盖率和响应完整性，再判断是否真的发生采集丢失。AIOps 自动生成结论时也要保存这些质量标记。

深分页则有另一个陷阱：新增日志不断到达，按时间翻页时，相同时间戳和可变视图可能使结果重复或遗漏。`search_after` 利用上一页的排序值继续，PIT（时间点搜索视图）帮助固定搜索视图；还需稳定的排序规则与相应的并列值处理。PIT 会保留资源，应设短存活时间并及时关闭，不把它当长期数据快照或备份。

## 深入运行：路由、恢复与生命周期的真实边界

### 路由像分柜规则，不像访问权限

默认路由通常利用文档标识决定主分片；自定义 `routing` 可以让同一租户的文档进入相同分片范围，减少带相同路由查询时需要访问的分片。代价是大租户可能成为热点，并且写入、按标识读取、更新和删除必须遵守相同路由约定。路由缺失导致找错分片，不等于数据已经删除。[路由字段说明](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/mapping-routing-field)。

路由也不是租户隔离：知道一个路由值不是获得授权的凭证，未带路由的宽范围搜索仍可能覆盖多个租户。权限应在身份、索引访问和必要的数据隔离层控制。对大租户可以单独索引或另行分区，但要把分片管理成本和迁移路径一起计算；不能仅因为某个查询慢就给每位用户创建一个索引。

### 未分配、恢复中与可服务不是同一个状态

一个副本重新加入，可能需要复制文件并补齐操作，然后才具备完整服务能力。故障诊断先看主分片是否存在可用副本，再看分配解释指出的约束，最后看恢复进度与资源竞争。磁盘水位、节点角色、分片分配规则都可能拒绝放置；“还有一台活机器”并不证明它满足放置条件。

针对实验索引可用 `GET /logs-aiops/_recovery?active_only=true` 查看正在进行的恢复。响应为空可能是没有活动恢复，而非恢复接口坏了；有任务则观察阶段、文件与操作进度是否持续推进。把它和磁盘吞吐、网络、节点日志结合，可以区分“正在慢慢恢复”和“无法开始恢复”。不要一看到进度慢就同时提高所有恢复并发，恢复与在线查询会争用相同资源。

跨故障域部署时，主副本需要分布到不同物理风险范围。三台虚拟机若依赖同一宿主机或同一块不可靠存储，不等于三个独立故障域。主节点候选角色主要协调集群元数据，数据分片主要承载业务内容；选主机制和分片复制解决不同问题。设计题里既要说明控制面失去多数时怎么办，也要说明数据副本和磁盘损坏时怎么办。

### 生命周期不是按每条日志设置闹钟

滚动把后续写入切到新的后备索引，旧索引仍可被数据流查询。前文策略中年龄或主分片大小达到相应条件后触发滚动，条件如何组合以策略和官方规则为准。滚动之后，后续阶段的最小年龄通常以滚动时间计算，不是逐条按事件时间倒计时。所以“删除阶段三十天”不能承诺每条事件都恰好保存三十天，迟到事件和索引边界尤其需要单独分析。[滚动与年龄规则](https://www.elastic.co/docs/manage-data/lifecycle/index-lifecycle-management/rollover)。

生命周期卡住时，先用 `GET /logs-aiops/_ilm/explain` 确认这个索引是否受策略管理，再看当前阶段、动作、步骤和错误。未绑定策略、错误写入别名、没有满足滚动条件，以及下一阶段要求的节点不存在，属于不同问题。先修条件再重试失败步骤；手工移动生命周期步骤可能跳过必要动作，不适合做自动修复的默认选项。

备份是另一条链。快照复制可用主分片的段到独立仓库，它并不是对整个集群进行单一瞬间的事务冻结；节点本地配置与已注册仓库等内容也不能假定全部包含。恢复时明确恢复哪些索引、集群状态和功能状态，避免把隔离验证环境的权限或配置意外覆盖到别处。快照版本也不能任意向旧版恢复，这直接限制“升级后换回旧镜像”的回滚想象。[快照与恢复边界](https://www.elastic.co/docs/deploy-manage/tools/snapshot-and-restore)。

## Elasticsearch 在 AIOps 链路中的位置

Elasticsearch 常用于日志搜索、事件检索、告警上下文查询和历史分析。

下图箭头表示日志从产生到被分析利用的流程，不代表各组件只存在单向网络连接：

```text
应用/系统日志
  -> Logstash / Beats / Elastic Agent / OTel Collector（日志或遥测采集处理组件）/ 自定义写入
  -> Elasticsearch data streams / indices（日志数据流或索引）
  -> Kibana / API（查询界面或接口）/ AIOps 分析服务
  -> 告警上下文、根因分析、异常搜索
```

它给 AIOps 提供：

| 能力 | 价值 |
|---|---|
| 全文检索 | 搜 exception、timeout、error message |
| 精确过滤 | 按 service、env、trace_id、host 查 |
| 时间范围查询 | 查故障窗口 |
| 聚合 | 按 service/status/error_type 统计 |
| ingest pipeline | 写入时解析、规范化、补字段 |
| ILM/data stream | 管理持续增长日志 |
| cluster APIs | 监控集群健康和 shard 状态 |

与 Loki 相比：

- Elasticsearch 更擅长复杂字段检索和全文搜索。
- Loki 更强调低成本标签化日志和 Grafana/Prometheus 风格查询。

选型不是谁替代谁，而是看查询模式、成本、团队经验和生态。

## Elasticsearch 是什么

Elasticsearch 是基于 Apache Lucene 的分布式搜索和分析引擎。它通过 REST API 接收 JSON 文档，建立索引，并支持近实时搜索和聚合分析。

关键词：

| 概念 | 含义 |
|---|---|
| document | 一条 JSON 数据 |
| index | 一组相似 document 的逻辑集合 |
| field | document 里的字段 |
| mapping | 字段类型和索引方式定义 |
| shard | index 的分片 |
| replica | shard 的副本 |
| analyzer | 文本分词处理器 |
| inverted index | 从词到文档的索引结构 |

最小写入：

```bash
curl -X POST "http://localhost:9200/logs-aiops/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-07-02T10:00:00Z",
    "service": "checkout-api",
    "level": "error",
    "message": "payment timeout",
    "status_code": 504
  }'
```

最小搜索：

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "match": {
        "message": "payment timeout"
      }
    }
  }'
```

## Cluster、Node、Index、Document

### Cluster

Cluster 是一个或多个 Elasticsearch nodes 的集合。

查看：

```bash
curl -s http://localhost:9200/
curl -s http://localhost:9200/_cluster/health?pretty
```

### Node

Node 是集群中的一个 Elasticsearch 实例。

常见节点角色：

| 角色 | 作用 |
|---|---|
| master-eligible | 参与选主，管理集群元数据 |
| data | 存储和搜索数据 |
| ingest | 执行 ingest pipeline |
| coordinating | 接收请求、分发查询、合并结果 |
| transform / ml | 特定功能节点 |

小集群可能一个节点多种角色，大集群会拆分。

### Index

Index 是 documents 的逻辑集合。

例子：

```text
logs-aiops-2026.07.02
metrics-app
alerts-history
```

Index 有：

- settings。
- mappings。
- aliases。
- shards。
- replicas。

### Document

Document 是 JSON 数据。

例子：

```json
{
  "@timestamp": "2026-07-02T10:00:00Z",
  "service": "checkout-api",
  "level": "error",
  "message": "payment timeout",
  "trace_id": "abc123"
}
```

每个 document 有 `_index`、`_id`、`_source` 等元信息。

## Shards 和 Replicas

Index 会被拆成 shards。

```text
index logs-aiops（名为logs-aiops的索引）
  -> primary shard 0（编号0的主分片）
  -> primary shard 1（编号1的主分片）
  -> primary shard 2（编号2的主分片）
```

Replica 是 primary shard 的副本。

```text
primary shard 0 on node A（主分片0放在节点A）
replica shard 0 on node B（同一分片的副本放在节点B）
```

作用：

- 水平扩展数据和查询。
- 提高可用性。
- primary 挂了 replica 可提升。

常见误区：

- shard 不是越多越好。
- 单节点集群设置 replica > 0 会 yellow，因为 replica 无法和 primary 放同一节点。
- primary shard 数量创建后通常不能随便改，规划要慎重。

查看：

```bash
curl -s "http://localhost:9200/_cat/indices?v"
curl -s "http://localhost:9200/_cat/shards?v"
```

## Cluster health：green、yellow、red

查看：

```bash
curl -s "http://localhost:9200/_cluster/health?pretty"
curl -s "http://localhost:9200/_cat/health?v"
```

状态：

| 状态 | 含义 |
|---|---|
| green | primary 和 replica shards 都已分配 |
| yellow | primary 都已分配，但至少有 replica 未分配 |
| red | 至少有 primary shard 未分配，部分数据不可用 |

单节点实验常见 yellow：

```text
number_of_replicas=1（每个主分片要求一个副本）
只有一个 node（节点）
replica（副本）无法分配到主分片所在的同一 node（节点）
```

修实验环境：

```bash
curl -X PUT "http://localhost:9200/logs-aiops/_settings" \
  -H "Content-Type: application/json" \
  -d '{
    "index": {
      "number_of_replicas": 0
    }
  }'
```

生产环境不要为了 green 盲目设 replica 0。要先判断容量、节点、allocation、磁盘水位、故障域。

## Mapping 是什么

Mapping 定义字段类型和索引方式。

示例：

```json
{
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "service": { "type": "keyword" },
      "level": { "type": "keyword" },
      "message": { "type": "text" },
      "status_code": { "type": "integer" },
      "trace_id": { "type": "keyword" }
    }
  }
}
```

字段类型影响：

- 能否全文搜索。
- 能否精确过滤。
- 能否排序。
- 能否聚合。
- 存储和索引成本。

查看 mapping：

```bash
curl -s "http://localhost:9200/logs-aiops/_mapping?pretty"
```

## text 和 keyword

这是新手最重要的字段类型区别。

### text

用于全文搜索，会经过 analyzer 分词。下面是 `mappings.properties` 内部的字段定义对象，不是完整建索引请求：

```json
{ "message": { "type": "text" } }
```

适合：

- 日志消息。
- 文本描述。
- 需要 match 搜索的内容。

### keyword

用于精确匹配、排序、聚合，不分词。下面同样展示 `mappings.properties` 内的字段定义：

```json
{ "service": { "type": "keyword" } }
```

适合：

- service 名。
- level。
- env。
- trace_id。
- host。
- status 字符串。

查询差异：

```json
{
  "query": {
    "match": {
      "message": "payment timeout"
    }
  }
}
```

适合 text 全文搜索。

```json
{
  "query": {
    "term": {
      "service": "checkout-api"
    }
  }
}
```

适合 keyword 精确过滤。

错误示例：

```json
{
  "query": {
    "term": {
      "message": "payment timeout"
    }
  }
}
```

如果 `message` 是 text，term 查询不会分析查询词，可能查不到预期结果。

## Analyzer 和倒排索引

Analyzer 把文本变成 tokens。

例如：

```text
"Payment Timeout Error"
```

可能被处理为：

```text
payment
timeout
error
```

Elasticsearch 建立倒排索引：

```text
payment -> doc1, doc7（词payment指向文档1和7）
timeout -> doc1, doc3（词timeout指向文档1和3）
error   -> doc1, doc5（词error指向文档1和5）
```

这让全文搜索很快。

测试 analyzer：

```bash
curl -X POST "http://localhost:9200/_analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "analyzer": "standard",
    "text": "Payment Timeout Error"
  }'
```

入门记住：

```text
text 字段会分析，适合 match
keyword 字段不分析，适合 term/filter/aggregation
```

## Dynamic mapping 和 mapping conflict

如果你没有显式 mapping，Elasticsearch 会尝试动态推断字段类型。

第一条：

```json
{ "status_code": 500 }
```

默认动态映射通常会把这个 JSON 整数识别为 `long`，即长整数；前文显式定义的 `integer` 是另一个较小范围的整数类型。字段类型以实际 `_mapping` 为证，不根据样例数字大小猜测。[动态字段映射规则](https://www.elastic.co/docs/manage-data/data-store/mapping/dynamic-field-mapping)。

后面写入：

```json
{ "status_code": "timeout" }
```

就可能失败，因为同一字段类型冲突。

日志场景常见 conflict（字段类型冲突）：下面每行是单独一条文档，不是让你把两行当一个请求体提交。

```jsonl
{ "user": "alice" }
{ "user": { "id": "alice", "name": "Alice" } }
```

同一字段一会儿字符串，一会儿对象，会出问题。

解决：

- 提前定义 index template。
- 规范日志 schema。
- ingest pipeline 中重命名或转换字段。
- 对不确定字段使用 flattened 等合适类型。

## Index settings

Index settings 控制分片、副本、刷新、默认 pipeline 等。

创建 index：

```bash
curl -X PUT "http://localhost:9200/logs-aiops" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "service": { "type": "keyword" },
        "level": { "type": "keyword" },
        "message": { "type": "text" },
        "trace_id": { "type": "keyword" }
      }
    }
  }'
```

常见 settings：

| setting | 作用 |
|---|---|
| `number_of_shards` | primary shard 数 |
| `number_of_replicas` | replica 数 |
| `refresh_interval` | refresh 间隔，影响近实时可见性和写入成本 |
| `index.default_pipeline` | 默认 ingest pipeline |
| `index.final_pipeline` | 最终 pipeline |

## Data streams

日志、指标这类持续追加的时间序列数据，推荐理解 data stream。

Data stream 是多个隐藏 backing indices 的抽象。

```text
logs-aiops（日志数据流名称）
  -> .ds-logs-aiops-2026.07.02-000001（第一个日期后备索引示例）
  -> .ds-logs-aiops-2026.07.03-000002（第二个日期后备索引示例）
```

Data stream 需要匹配的 index template。template 定义：

- mappings。
- settings。
- ILM policy。
- data stream 启用。

写入时写到 data stream 名，Elasticsearch 自动写入当前 write backing index。

适合：

- 日志。
- 指标。
- APM events。
- 安全事件。

## Index templates

Index template 定义新 index 或 data stream 创建时套用的 settings/mappings/aliases。

示例：

```bash
curl -X PUT "http://localhost:9200/_index_template/logs-aiops-template" \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["logs-aiops-*"],
    "priority": 500,
    "template": {
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 1
      },
      "mappings": {
        "properties": {
          "@timestamp": { "type": "date" },
          "service": { "type": "keyword" },
          "level": { "type": "keyword" },
          "message": { "type": "text" },
          "trace_id": { "type": "keyword" }
        }
      }
    }
  }'
```

查看：

```bash
curl -s "http://localhost:9200/_index_template/logs-aiops-template?pretty"
```

为什么重要？

日志是持续新建 index/data stream backing indices。如果没有 template，新索引可能使用错误 dynamic mapping，后续查询和聚合就乱了。

上面的示例是普通索引模板：匹配带后缀的 `logs-aiops-*`，不匹配无后缀的 `logs-aiops`，而且没有启用 `data_stream`。若要创建数据流，模板需显式配置 `data_stream: {}`、匹配数据流名称并提供时间字段约束；不能仅凭索引名里含日志单词就把它叫数据流。学习时先完成普通索引实验，再按官方数据流章节建立独立对象，避免同名索引与数据流混用。

## Ingest pipeline

Ingest pipeline 在文档写入前处理文档。

用途：

- 解析日志。
- 增加字段。
- 重命名字段。
- 转换类型。
- 删除字段。
- 设置时间字段。

示例：

```bash
curl -X PUT "http://localhost:9200/_ingest/pipeline/aiops-log-pipeline" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Parse AIOps log lines",
    "processors": [
      {
        "set": {
          "field": "event.dataset",
          "value": "aiops"
        }
      },
      {
        "convert": {
          "field": "status_code",
          "type": "integer",
          "ignore_missing": true
        }
      }
    ]
  }'
```

写入时指定：

```bash
curl -X POST "http://localhost:9200/logs-aiops/_doc?pipeline=aiops-log-pipeline" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-07-02T10:00:00Z",
    "service": "checkout-api",
    "status_code": "504",
    "message": "payment timeout"
  }'
```

模拟 pipeline：

```bash
curl -X POST "http://localhost:9200/_ingest/pipeline/aiops-log-pipeline/_simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "docs": [
      {
        "_source": {
          "status_code": "504"
        }
      }
    ]
  }'
```

## Query DSL

Elasticsearch 查询使用 JSON Query DSL。

### match

全文查询，会分析查询文本。

```json
{
  "query": {
    "match": {
      "message": "payment timeout"
    }
  }
}
```

### term

精确查询，不分析查询词。

```json
{
  "query": {
    "term": {
      "service": "checkout-api"
    }
  }
}
```

### range

范围查询。

```json
{
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-15m",
        "lte": "now"
      }
    }
  }
}
```

### bool

组合查询。

```json
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "service": "checkout-api" } },
        { "term": { "level": "error" } },
        { "range": { "@timestamp": { "gte": "now-15m" } } }
      ],
      "must": [
        { "match": { "message": "timeout" } }
      ],
      "must_not": [
        { "term": { "path": "/health" } }
      ]
    }
  }
}
```

经验：

- 精确过滤放 `filter`，不参与评分，适合缓存。
- 全文相关性放 `must` / `should`。
- 日志排障大多是 filter + range + match。

## Aggregations

Aggregations 做统计分析。

按 service 统计错误：

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "size": 0,
    "query": {
      "range": {
        "@timestamp": {
          "gte": "now-15m"
        }
      }
    },
    "aggs": {
      "by_service": {
        "terms": {
          "field": "service"
        }
      }
    }
  }'
```

按时间统计：

```json
{
  "aggs": {
    "errors_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "fixed_interval": "1m"
      }
    }
  }
}
```

注意：

- terms aggregation 应用于 keyword/numeric 等适合聚合的字段。
- 对 text 字段直接聚合通常不是你想要的。
- 高基数字段聚合成本高。

## Sort、pagination 和 search_after

查最新日志：

```json
{
  "sort": [
    { "@timestamp": "desc" }
  ],
  "size": 100
}
```

浅分页：

```json
{
  "from": 0,
  "size": 100
}
```

深分页不要无限用 `from + size`，会越来越贵。大量分页应学习 `search_after` 或 scroll/PIT 等方案。

日志排障通常更推荐：

- 限定时间范围。
- 明确过滤条件。
- 按时间排序。
- size 控制在合理范围。

## ILM：Index Lifecycle Management

ILM 管理索引生命周期。

时间序列日志常见阶段：

```text
hot -> warm -> cold -> frozen -> delete（热、温、冷、冻结到删除的生命周期阶段）
```

简化策略：

```json
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_primary_shard_size": "50gb"
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

ILM 价值：

- 自动 rollover。
- 控制 shard 大小。
- 控制保留时间。
- 降低人工管理索引成本。

日志场景不要让索引无限增长。

## 安装与启动：Windows 隔离课堂

以下是真实产品实验步骤，待读者在自己的隔离环境执行；本轮文档修订没有启动 Elasticsearch，也不把示例输出当实测结果。使用固定的历史教学版本 8.19.0 复现基础接口，不表示它是当前生产推荐版本；上生产前另按版本维护、安全公告和组织基线选择。启动方式参考 [官方 Docker 单节点说明](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic)。

在 PowerShell 执行下面命令。实验只绑定本机回环地址，不开启外部访问；关闭认证仅为本机无业务数据课堂简化前置，绝不用于共享主机或生产。若本机已经有同名容器或 9200 端口被占用，停在这里，另选实验机器，不删除原对象。`discovery.type` 表示按单节点发现模式运行，内存限制约束本课堂进程的预算。

```powershell
docker version
docker ps -a --filter 'name=^/aiops-es-class$'
Get-NetTCPConnection -LocalPort 9200 -State Listen -ErrorAction SilentlyContinue
docker run -d --name aiops-es-class --memory 2g `
  -p 127.0.0.1:9200:9200 `
  -e 'discovery.type=single-node' `
  -e 'xpack.security.enabled=false' `
  -e 'ES_JAVA_OPTS=-Xms1g -Xmx1g' `
  docker.elastic.co/elasticsearch/elasticsearch:8.19.0
```

容器标识返回只证明启动请求已发出，不证明服务已就绪。等待片刻后执行以下读取；版本响应的 `version.number` 应与选定镜像一致，健康接口应返回结构化结果。若连接失败，先看这一个容器的日志和退出原因；内存不足、镜像拉取失败和内核启动检查不通过要分别处理，不在未确认原因前更改宿主机内核参数。

```powershell
docker logs --tail 80 aiops-es-class
$esClass = 'http://127.0.0.1:9200'
Invoke-RestMethod "$esClass/"
Invoke-RestMethod "$esClass/_cluster/health"
```

### 基础实验：先写合同，再比较全文与精确查询

本组命令在同一个 PowerShell 窗口连续执行；对象仅为新容器中的 `teacher-logs` 索引。先预测：正文写入大写单词，按全文搜小写是否命中？服务名改变大小写又会怎样？下面显式映射和标准分析器决定答案，而不是所有语言都遵循同一规则。

```powershell
$mapping = @{
  settings = @{ number_of_shards = 1; number_of_replicas = 0 }
  mappings = @{ dynamic = 'strict'; properties = @{
    '@timestamp' = @{ type = 'date' }
    service = @{ type = 'keyword' }
    message = @{ type = 'text'; analyzer = 'standard' }
    duration_ms = @{ type = 'integer' }
  } }
} | ConvertTo-Json -Depth 8
Invoke-RestMethod -Method Put -Uri "$esClass/teacher-logs" `
  -ContentType 'application/json' -Body $mapping
$sample = @{
  '@timestamp' = [DateTimeOffset]::UtcNow.ToString('o')
  service = 'checkout-api'; message = 'Payment Timeout'; duration_ms = 500
} | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri "$esClass/teacher-logs/_doc/one?refresh=wait_for" `
  -ContentType 'application/json' -Body $sample
$search = '{"query":{"bool":{"filter":[{"term":{"service":"checkout-api"}}],"must":[{"match":{"message":"timeout"}}]}}}'
$found = Invoke-RestMethod -Method Post -Uri "$esClass/teacher-logs/_search" `
  -ContentType 'application/json' -Body $search
$found.hits.hits | ConvertTo-Json -Depth 8
Invoke-RestMethod -Method Post -Uri "$esClass/teacher-logs/_analyze" `
  -ContentType 'application/json' -Body '{"field":"message","text":"Payment Timeout"}'
```

预期命中文档标识 `one`，原文仍保留大写，但分析结果出现小写词项。`dynamic: strict` 表示遇到未声明的新字段就拒绝文档，方便课堂立即发现合同偏离；生产是否严格拒绝要结合隔离队列、数据演进与告警决定。`ConvertTo-Json -Depth 8` 保留嵌套配置层次，若省略深度导致对象被截断，问题出在请求构造而非映射机制。

验收不能只看命中一次：复制查询，把服务名改成 `Checkout-API`，预期不命中，因为关键词没有按本例设置做大小写规范化；恢复服务名，再把全文条件改为 `term` 搜 `Payment`，预期不命中。若结果相反，查看实际映射、词项和请求正文，确认没有复用旧索引。不要创建同名索引失败后继续执行，否则已经偏离实验前提。

### 故障实验：字段类型错误，不是服务宕机

仍在同一个隔离索引，把耗时故意改为非数字字符串。先预测：整条文档会成功但字段空白，还是写入被拒绝？本例没有启用忽略格式错误，所以应捕获客户端错误，并看到与字段解析相关的响应。PowerShell 不同版本展示异常正文不同，保留状态码和脱敏响应，不依赖一种异常排版。

```powershell
$badSample = '{"service":"checkout-api","message":"bad duration","duration_ms":"slow"}'
try {
  Invoke-RestMethod -Method Put -Uri "$esClass/teacher-logs/_doc/two" `
    -ContentType 'application/json' -Body $badSample -ErrorAction Stop
} catch {
  $_.Exception.Message
  $_.ErrorDetails.Message
}
Invoke-RestMethod "$esClass/teacher-logs/_mapping"
Invoke-RestMethod "$esClass/_cluster/health"
$fixedSample = '{"service":"checkout-api","message":"fixed duration","duration_ms":800}'
Invoke-RestMethod -Method Put -Uri "$esClass/teacher-logs/_doc/two?refresh=wait_for" `
  -ContentType 'application/json' -Body $fixedSample
Invoke-RestMethod "$esClass/teacher-logs/_count"
```

预期故障请求失败，集群仍可响应，修复后计数为二。因果链是“字段契约不符导致单项写入失败”，不是“集群颜色不好导致超时”。证据来自失败正文、实际映射、健康响应和修复后计数四个独立观察。若第二次仍失败，检查字段名称、类型以及是否确实向这个实验索引写入；不要通过删索引逃过原因分析。

完成后先保存两次请求与解释，再停止并删除本课堂容器。这里没有挂载命名数据卷，删除后课堂索引随容器可写层消失；不清理其他容器、镜像或磁盘目录。保留数据就只停止，不执行删除。

```powershell
docker stop aiops-es-class
docker rm aiops-es-class
```

### 故障复盘进阶：大量拒绝，先判断拒绝来自哪一层

请求返回 429 表示需要检查限流或资源保护原因，不等于“只能加线程”。线程池队列满、索引写入压力和内存熔断都可能拒绝工作，入口网关也可能自行限流。先保存响应体与请求类型，区分网关拒绝和 Elasticsearch 拒绝，再对照节点统计、并发批次、磁盘耗时以及堆内存。[官方拒绝请求排障](https://www.elastic.co/docs/troubleshoot/elasticsearch/rejected-requests)。

设课堂事故为：十点发布后批次变大四倍，十点零二分队列增长，十点零三分开始拒绝。假设一是后端磁盘变慢，假设二是入口并发突增；检查发布前后吞吐、批次大小与磁盘延迟，不能只凭发生在发布后就确定原因。先小范围回退采集批量或并发，观察拒绝率和延迟是否改善，再决定长期调整。直接把队列扩大四倍可能只把拒绝推迟，增加内存占用和等待时间。

自动化修复应有停止条件：当单项失败率持续升高、队列不回落或成功写入明显减少，暂停加压并通知人工。已成功文档不能无差别重发，失败记录也不能无限丢弃。复盘最终要说明延迟积压能否补齐、重复记录如何识别，以及这段时间的告警统计是否需要重新计算。

## AIOps 入门实验：Bash 接口练习

下面保留 Linux 或 WSL 的接口练习，使用独立实验实例；不要将 Bash 的反斜杠续行原样粘进 PowerShell。零基础读者优先完成上面的闭环，再按需练习这些接口。固定历史日期用于解释字段，若改用“最近十五分钟”查询，应同步改成当前事件时间。示例不代表线上实例已经存在。

目标：创建日志索引，写入文档，定义 mapping，查询、聚合、模拟 pipeline，并查看 cluster health。

### 1. 查看集群

```bash
curl -s http://localhost:9200/?pretty
curl -s http://localhost:9200/_cluster/health?pretty
curl -s http://localhost:9200/_cat/nodes?v
```

### 2. 创建 index

```bash
curl -X PUT "http://localhost:9200/logs-aiops" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "service": { "type": "keyword" },
        "level": { "type": "keyword" },
        "message": { "type": "text" },
        "status_code": { "type": "integer" },
        "trace_id": { "type": "keyword" }
      }
    }
  }'
```

### 3. 写入文档

```bash
curl -X POST "http://localhost:9200/logs-aiops/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-07-02T10:00:00Z",
    "service": "checkout-api",
    "level": "error",
    "message": "payment timeout while calling gateway",
    "status_code": 504,
    "trace_id": "abc123"
  }'
```

刷新让实验马上可查：

```bash
curl -X POST "http://localhost:9200/logs-aiops/_refresh"
```

### 4. 查询

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "bool": {
        "filter": [
          { "term": { "service": "checkout-api" } },
          { "term": { "level": "error" } }
        ],
        "must": [
          { "match": { "message": "timeout" } }
        ]
      }
    }
  }'
```

### 5. 聚合

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "size": 0,
    "aggs": {
      "by_service": {
        "terms": {
          "field": "service"
        }
      }
    }
  }'
```

### 6. 形成学习证据

记录：

```text
index（索引）:
mapping（字段映射）:
document（原始文档）:
match query（全文查询）:
term query（词项精确查询）:
aggregation（聚合统计）:
cluster health（分片分配健康）:
```

## 常用 API 字典

### 查看版本

```bash
curl -s http://localhost:9200/?pretty
```

### Cluster health

```bash
curl -s http://localhost:9200/_cluster/health?pretty
curl -s http://localhost:9200/_cat/health?v
```

### Nodes

```bash
curl -s http://localhost:9200/_cat/nodes?v
```

### Indices

```bash
curl -s http://localhost:9200/_cat/indices?v
```

### Shards

```bash
curl -s http://localhost:9200/_cat/shards?v
```

官方提醒 CAT APIs 主要给人用，不建议应用程序依赖它们做机器解析；自动化更适合 JSON API。

### Mapping

```bash
curl -s http://localhost:9200/logs-aiops/_mapping?pretty
```

### Settings

```bash
curl -s http://localhost:9200/logs-aiops/_settings?pretty
```

### Search

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "match_all": {} } }'
```

### Analyze

```bash
curl -X POST "http://localhost:9200/_analyze" \
  -H "Content-Type: application/json" \
  -d '{ "analyzer": "standard", "text": "Payment Timeout Error" }'
```

### Explain allocation

```bash
curl -X GET "http://localhost:9200/_cluster/allocation/explain?pretty"
```

用于 shard 未分配排查。

## 典型故障排查表

| 现象 | 先看什么 | 常见原因 | 处理思路 |
|---|---|---|---|
| cluster yellow | `_cat/shards` | replica 未分配、单节点有副本 | 看 unassigned shards |
| cluster red | `_cluster/health`、allocation explain | primary 未分配 | 先恢复 primary |
| 字段查不到 | `_mapping` | 字段类型不对、没 refresh、时间范围错 | 查 mapping 和 query |
| term 查 text 查不到 | mapping/analyzer | text 被分词，term 不分析 | 对 text 用 match，对 keyword 用 term |
| 聚合报错或结果怪 | field type | 对 text 聚合、keyword 缺失 | 用 `.keyword` 或 keyword 字段 |
| mapping conflict | 写入错误 | 同字段多类型 | 规范 schema，建 template |
| 写入慢 | thread pool、refresh、bulk | 单条写入多、refresh 太频繁、磁盘慢 | bulk、调 refresh、看节点 |
| 查询慢 | query、shard、heap | 时间范围大、正则重、高基数聚合 | 限范围，优化 query |
| 磁盘满 | `_cat/allocation` | 索引无限增长、ILM 缺失 | ILM、删除、扩容 |
| shard 太多 | `_cat/shards` | 小索引过多 | rollover 策略、合并索引 |

## 排障流程：cluster yellow

```bash
curl -s "http://localhost:9200/_cluster/health?pretty"
curl -s "http://localhost:9200/_cat/indices?v"
curl -s "http://localhost:9200/_cat/shards?v"
```

看：

- 哪些 shards unassigned？
- 是 primary 还是 replica？
- 节点数是否足够？
- 磁盘水位是否过高？
- allocation rules 是否限制？

单节点实验 yellow 且只是 replica 未分配，可把 replicas 调 0：

```bash
curl -X PUT "http://localhost:9200/logs-aiops/_settings" \
  -H "Content-Type: application/json" \
  -d '{ "index": { "number_of_replicas": 0 } }'
```

生产要谨慎，replica 是可用性保障。

## 排障流程：查询不到字段

1. 看 mapping：

```bash
curl -s "http://localhost:9200/logs-aiops/_mapping?pretty"
```

2. 看文档是否真的写入：

```bash
curl -s "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "match_all": {} }, "size": 1 }'
```

3. 确认 query 类型：

- text 字段用 match。
- keyword 字段用 term。
- date 字段用 range。

4. 如果刚写入，实验中可以 refresh：

```bash
curl -X POST "http://localhost:9200/logs-aiops/_refresh"
```

## 排障流程：写入慢

检查：

```bash
curl -s "http://localhost:9200/_cluster/health?pretty"
curl -s "http://localhost:9200/_cat/thread_pool/write?v"
curl -s "http://localhost:9200/_cat/indices?v"
```

常见原因：

- 单条写入太多，没用 bulk。
- refresh_interval 太短。
- replica 太多。
- ingest pipeline 太重。
- mapping 爆炸。
- 磁盘 I/O 慢。
- JVM heap 压力。
- shard 太多。

优化方向：

- 使用 Bulk API。
- 合理设置 refresh_interval。
- 优化 pipeline。
- 控制字段数量和 mapping。
- 规划 shard 大小。
- 扩容 data nodes。

## 排障流程：查询慢

先看 query：

- 时间范围是否过大？
- 是否用了前导通配符？
- 是否对高基数字段聚合？
- 是否查了太多 shards？
- size 是否过大？

使用 profile API：

```bash
curl -X GET "http://localhost:9200/logs-aiops/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": true,
    "query": {
      "match": {
        "message": "timeout"
      }
    }
  }'
```

优化：

- 用 filter 限制 service/env/time。
- keyword 精确字段用 term。
- 避免不必要的正则和 wildcard。
- 聚合字段使用 keyword/numeric。
- 控制 time range。
- 看 shard 数和数据量。

## AIOps 自动化诊断脚本

```bash
#!/usr/bin/env bash
set -euo pipefail

es="${1:-http://localhost:9200}"
index="${2:-logs-aiops}"

echo "== version =="
curl --fail --silent --show-error --max-time 10 "$es/?pretty"

echo
echo "== cluster health =="
curl --fail --silent --show-error --max-time 10 "$es/_cluster/health?pretty"

echo
echo "== indices =="
curl --fail --silent --show-error --max-time 10 "$es/_cat/indices?v"

echo
echo "== shards =="
curl --fail --silent --show-error --max-time 10 "$es/_cat/shards?v"

echo
echo "== mapping =="
curl --fail --silent --show-error --max-time 10 "$es/$index/_mapping?pretty"

echo
echo "== sample docs =="
curl --fail --silent --show-error --max-time 10 "$es/$index/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{ "query": { "match_all": {} }, "size": 3 }'
```

先在本机合成日志索引运行。`--fail` 让 HTTP 错误返回非零退出码，`--silent --show-error` 隐藏进度但保留错误，`--max-time 10` 限制每次请求最多十秒。与 `set -e` 配合后，某一步失败就停止，不能把鉴权失败、超时或接口不存在当作“没有异常”；最后退出码为零也只说明这些请求成功，不代表业务健康。参数含义见 [curl 官方手册](https://curl.se/docs/manpage.html)。真实环境只访问获批索引，确认样例文档已经脱敏后才导出，不要把原始日志直接发给模型或提交公开仓库。

生产化前要补：

- 认证。
- TLS。
- JSON 解析。
- allocation explain。
- disk watermarks。
- slow logs。
- ILM status。
- data stream backing indices。

## 面试怎么讲

Elasticsearch 是基于 Lucene 的分布式搜索和分析引擎。数据以 JSON document 写入 index，index 根据 mapping 决定字段类型和索引方式，text 字段会经过 analyzer 分词建立倒排索引，keyword 字段适合精确过滤、排序和聚合。Index 被拆成 primary shards 和 replica shards 分布在 nodes 上，cluster health 的 green/yellow/red 反映 shard 分配状态。日志和时间序列场景通常用 data streams、index templates 和 ILM 管理持续写入、rollover 和保留周期。排障时我会先看 cluster health、indices、shards，再看 mapping、settings、query DSL、ingest pipeline 和 ILM。

## 小白可能会问

### Elasticsearch 和数据库有什么区别？

Elasticsearch 强在搜索和分析，尤其是全文检索和聚合；传统数据库强在事务、一致性和关系查询。不要把 Elasticsearch 当唯一事实数据源。

### index 是不是数据库表？

可以粗略类比，但不完全一样。index 是文档集合，并且包含 shard、mapping、settings、索引结构等。

### text 和 keyword 为什么这么重要？

text 会分词，适合全文 match；keyword 不分词，适合精确 term、聚合和排序。用错会导致查不到或聚合异常。

### yellow 是不是一定严重？

yellow 表示 primary 可用但 replica 未完全分配。单节点实验常见；生产要看副本缺失原因。

### 为什么刚写入搜不到？

Elasticsearch 是近实时搜索，写入后要等 refresh。实验可以手动 `_refresh`。

### 为什么日志场景要用 ILM？

日志持续增长，必须自动 rollover 和删除，否则索引和磁盘会失控。

## 学习路线

第一阶段：核心对象

- cluster。
- node。
- index。
- document。
- field。
- shard。
- replica。

第二阶段：索引和查询

- mapping。
- text vs keyword。
- analyzer。
- inverted index。
- Query DSL。
- aggregations。

第三阶段：日志建模

- data streams。
- index templates。
- ingest pipelines。
- ILM。

第四阶段：运维排障

- cluster health。
- CAT APIs。
- shard allocation。
- mapping conflict。
- 写入慢。
- 查询慢。

第五阶段：AIOps 集成

- 日志检索。
- 事件搜索。
- 告警上下文查询。
- 异常聚合。
- 自动诊断脚本。

## 学习检查清单

- [ ] 我能解释 cluster、node、index、document、field。
- [ ] 我能解释 primary shard 和 replica shard。
- [ ] 我能解释 green、yellow、red。
- [ ] 我能创建一个带 mapping 的 index。
- [ ] 我能解释 text 和 keyword 的区别。
- [ ] 我能解释 analyzer 和倒排索引。
- [ ] 我能写 match、term、range、bool 查询。
- [ ] 我能写 terms aggregation。
- [ ] 我能解释 data stream 和 backing indices。
- [ ] 我能解释 index template 的作用。
- [ ] 我能解释 ingest pipeline 的作用。
- [ ] 我能解释 ILM 为什么重要。
- [ ] 我能排查 cluster yellow。
- [ ] 我能排查字段查不到。
- [ ] 我能排查写入慢和查询慢。
- [ ] 我能把 Elasticsearch 诊断写进 AIOps runbook。

## 面试题

### 第一组：先讲用途，再讲字段为什么这样建模

第一问“为什么不用关系数据库搜索所有日志？”先承认关系数据库也能查询文本，再说明 Elasticsearch 的全文分析、倒排检索和分布式聚合更贴近本场景；不把它描述为所有操作都比数据库快。追问“为什么服务名不能和消息一样？”用精确服务过滤与消息分词的差别回答，举出课堂大小写反例。再追问“原文中有字段为什么聚合没有？”检查实际映射、长度限制和字段覆盖，不把看见原文当作可聚合证明。

### 第二组：写入成功后数据经过什么状态

参考答案先讲主分片、相关副本与事务日志确认，再把搜索刷新独立出来。追问“怎样写完立即搜？”说明等待刷新与主动刷新代价，先核对业务是否真要搜索而非按标识读取。追问“批量请求成功是否全部成功？”指出逐项结果与有限重试；追问“有人同时修改怎么办？”用操作序号和主分片任期条件检查，冲突后按业务规则合并，不编造自动重试能解决全部冲突。

### 第三组：查询慢，为什么不能只增加副本

先区分单次重查询、多用户并发与底层磁盘瓶颈，再解释副本主要提供冗余及读取分散机会，也消耗写入和存储。追问“查询返回很快为什么还要审结果？”检查分片失败、桶截断与字段缺失。追问“扩大分页上限行不行？”解释协调代价，再提出时间过滤、稳定排序以及按需使用时间点视图与后续分页。答案要包含何时不适用，不只列接口名称。

### 生产设计题：每日两百 GB 日志，保留一个月

先问清两百 GB 是原始文本还是已索引物理占用，查询是最近十五分钟故障定位还是全月统计，是否含敏感数据，允许缺多少日志和停多久。之后才做小规模代表性压测，测文档大小分布、峰值写入、索引放大与聚合并发，不能仅乘三十就报采购容量。

三个取舍应讲明白：多分片有并行空间也增加管理和合并成本；热数据快速存储改善故障窗口查询但成本更高；更长保留方便复盘却扩大容量和敏感信息暴露。主副本按独立故障域布置，关键集群控制角色考虑多数可用，容量要能承受单节点维护、恢复与在线负载叠加。写入账号只写授权索引，查询账号不持有删除权限，通信加密、脱敏与审计一起设计。

升级前检查插件、客户端、模板和索引兼容，先恢复快照到隔离环境回归典型写入与查询，再按官方升级路径推进。回退基线包含升级前快照、旧环境和切换点，不能依赖新版数据目录被旧进程直接打开。验收除了版本和集群颜色，还要比较窗口覆盖、失败文档、聚合误差、权限和告警效果。

### 事故题：发布后错误率下降，为什么反而需要警惕

给定时间线：发布前有稳定错误日志，发布后新增结构化对象字段，采集队列持续增长，仪表盘错误率下降。参考推理是先比较成功写入与逐项失败，核对字段合同是否从字符串变成对象；再判断错误日志是不是被拒绝，而非业务真的恢复。修复选择回退生产者字段或按兼容方案建立新索引，隔离并重放确有失败的记录，限制重放速度，保留撤销条件。最后对故障窗口重新核对计数，让自动摘要明确这段数据曾不完整。

## 学习证据

完成本篇后，建议留下这些证据：

- 一个 `logs-aiops` index 创建命令，包含 settings 和 mappings。
- 一份写入文档示例。
- 一份 match、term、bool、range 查询示例。
- 一份 terms aggregation 示例。
- 一份 `_cluster/health`、`_cat/indices`、`_cat/shards` 输出解读。
- 一份 cluster yellow 或 mapping conflict 排障笔记。
- 一个 Elasticsearch 诊断脚本，能采集 health、indices、shards、mapping 和样例文档。
