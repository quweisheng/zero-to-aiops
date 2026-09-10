# Apache Spark 深讲

> 学习目标：从零理解 Spark 的 Driver、Executor、Job、Stage、Task、Partition 和 Shuffle，能用 PySpark 完成告警聚合实验，能读懂 SQL 执行计划与 Web UI，能分析数据倾斜、OOM、Shuffle、GC、序列化和 Streaming 故障，并能设计生产容量、高可用、安全、升级和回滚方案。

## 老师先带你认路

先不要被“大数据”吓住。今天只拿三行告警做一张汇总表，借这个小问题认识分工、搬运和失败恢复。程序是你写的处理步骤，进程是正在执行它的运行实体，线程是在同一个进程中推进工作的执行单位。一个容器可以装进程，却不是一台真实物理机器；本课使用本地两个工作线程演示任务，并不冒充多机器测试。

你需要 Windows PowerShell、Docker Desktop 的 Linux 容器环境和能创建文本文件的编辑器。建议起步预留四个逻辑核心、八 GB 可用内存与十 GB 磁盘；镜像自带 Python、Java 和 Spark，宿主机无需再安装一整套开发环境。不懂 Python 时，只先阅读 [Python 基础](../foundation/python.md) 中的导入、变量和函数调用；不懂镜像和目录挂载时，先看 [Docker](../cloud-native/docker.md) 对应部分，不必先搭 Kubernetes。

第一遍按“输入三行 → 写变换计划 → 预测严重告警数 → 运行 → 读取计划 → 制造坏数据”完成课堂。第二遍才看状态、内存、流处理和生产设计。验收不是终端出现很多日志，而是结果只有订单服务两条严重告警，坏数据让作业失败，修复后同一输入回到同一结果。本文实验命令是待读者执行的课堂步骤，本轮修订只做文档与示例静态检查，没有运行 Spark 容器或多节点集群。

## 官方资料

- [Apache Spark 官网](https://spark.apache.org/)
- [Apache Spark 下载页](https://spark.apache.org/downloads.html)
- [Spark 4.2.0 文档](https://spark.apache.org/docs/4.2.0/)
- [Spark SQL、DataFrame 与 Dataset 指南](https://spark.apache.org/docs/4.2.0/sql-programming-guide.html)
- [Structured Streaming 指南](https://spark.apache.org/docs/4.2.0/streaming/index.html)
- [Spark 监控与 Web UI](https://spark.apache.org/docs/4.2.0/monitoring.html)
- [Spark 配置](https://spark.apache.org/docs/4.2.0/configuration.html)
- [RDD 编程与容错](https://spark.apache.org/docs/4.2.0/rdd-programming-guide.html)
- [SQL 性能调优](https://spark.apache.org/docs/4.2.0/sql-performance-tuning.html)
- [内存与数据序列化调优](https://spark.apache.org/docs/4.2.0/tuning.html)
- [流查询 API、检查点与恢复限制](https://spark.apache.org/docs/4.2.0/streaming/apis-on-dataframes-and-datasets.html)

版本边界：本文以 Apache Spark 4.2.0 正式版为主线。存量平台仍可能使用 3.5.x 或 4.0/4.1 维护线。生产选版本要核对 Java、Scala、Python、Hadoop、Catalog、Connector 和文件格式兼容，不要只追最新版本号。

## 官方知识地图

```text
Apache Spark（分布式数据处理引擎）
  -> API：PySpark、Scala、Java、R（不同语言的编程接口）
  -> RDD（弹性分布式数据集）、DataFrame（带列结构的数据表）、Dataset（类型化数据集）
  -> Driver（驱动进程）、DAG Scheduler（阶段调度器）、Task Scheduler（任务调度器）、Executor（执行进程）
  -> Logical Plan（逻辑计划）、Catalyst（结构化查询优化器）、Physical Plan（物理计划）
  -> Codegen（代码生成）、AQE（依据运行信息调整查询计划）
  -> Partition（运行时数据分片）、Shuffle（跨分片重分布）、Cache（缓存副本）
  -> Broadcast（广播共享数据）、Checkpoint（持久化检查点）
  -> Spark SQL（结构化计算）、Structured Streaming（结构化流处理）、MLlib（机器学习）、GraphX（图计算）
  -> Standalone（自带集群管理）、YARN（Hadoop 资源调度）、Kubernetes（容器编排）、Local（单机模式）
  -> Web UI（运行页面）、History Server（历史页面服务）、Metrics（指标）、Event Log（运行事件日志）
```

```text
基础层
  -> 用 DataFrame 读、过滤、聚合和写出
  -> 认识 Driver/Executor/Job/Stage/Task
  -> 用 EXPLAIN 和 Web UI 找到 Shuffle

进阶层
  -> 解释 Catalyst、AQE、内存和失败重算
  -> 分析倾斜、OOM、GC、网络和 Streaming 状态
  -> 设计资源、HA、安全、升级、回滚和成本
```

## 场景开场

你要把一天 5 亿条告警日志按服务聚合，MapReduce 作业每个阶段都落盘，开发迭代很慢。Spark 可以把多个转换组成 DAG（Directed Acyclic Graph，有向无环图），由调度器切分阶段并在 Executor 上并行执行。

作业上线后，99% Task 在 3 分钟内完成，最后一个 Task 跑了 40 分钟。集群还有空闲 CPU，但 Job 就是不结束。这通常不是“Spark 整体慢”，而是某个 Partition 数据倾斜、Shuffle Fetch、GC 或外部调用拖住长尾。

## 一句话人话版

`Spark = 把批处理、SQL、流处理和机器学习计算拆成并行任务，在多个 Executor 上执行的通用分布式计算引擎。`

## 小白可能会问

### Spark 会保存我的数据吗

Spark 主要负责计算，数据通常来自 HDFS、对象存储、Hive、Kafka、数据库等。Cache 只是运行期间的加速副本，不能当永久存储或备份。

### Spark 是内存数据库吗

不是。Spark 会使用内存加速，但 Shuffle、溢写、缓存淘汰和大数据集都可能使用磁盘。把“Spark 快”简单归因于“全在内存”是不准确的。

### 一个 Spark Application 有几个 Driver

一个 Application 通常有一个 Driver 和多个 Executor。Driver 是控制核心，Driver 故障是否能恢复取决于部署模式、集群管理器和应用设计。

### Partition 是 HDFS Block 吗

不是同一概念。输入 Partition 可能由文件 Block/文件切片生成，经过 Repartition、Join、GroupBy 和 Shuffle 后会重新划分。

## 为什么要学

- AIOps 离线特征、日志 ETL、异常检测训练和报表常使用 Spark。
- Spark SQL 与 Hive Metastore、Iceberg/Delta/Hudi 等数据湖生态紧密相关。
- Job/Stage/Task/Shuffle 是大数据面试和生产排障基础。
- Structured Streaming 可连接 Kafka、状态计算和实时告警链路。

## 核心对象

| 对象 | 人话解释 | 常见误区 |
|---|---|---|
| Application | 一次完整 Spark 应用运行 | 不等于一个 SQL |
| Driver | 运行主程序、生成计划和调度任务 | 不是数据处理 Worker |
| Executor | 在 Worker 上执行 Task 并保存缓存 | Executor 数越多不一定越快 |
| Job | Action 触发的一组计算 | Transformation 通常懒执行 |
| Stage | 由 Shuffle 边界切开的任务阶段 | Stage 慢要看内部 Task 分布 |
| Task | 对一个 Partition 执行的一次工作 | 单 Task 数据过大会 OOM |
| Partition | 并行处理的数据切片 | 太多与太少都可能低效 |
| Shuffle | 按 Key 重分布数据 | 涉及网络、磁盘、序列化和长尾 |

## 一次批作业的数据路径

```text
spark-submit / Notebook / Service（提交命令、交互笔记或应用服务）
  -> Driver（驱动进程）创建 SparkSession（结构化计算会话）
  -> DataFrame/SQL（表操作或查询）形成 Logical Plan（逻辑计划）
  -> Catalyst（优化器）分析、优化并选择 Physical Plan（物理计划）
  -> Action（触发计算的动作）引出 Job（作业）
  -> DAG Scheduler（阶段调度器）按 Shuffle（重分布）切 Stage（阶段）
  -> Task Scheduler（任务调度器）把 Task（任务）发给 Executor（执行进程）
  -> Executor（执行进程）读取输入 Partition（数据分片）
  -> Filter/Project/Aggregate/Join（过滤、选列、聚合与关联）
  -> 必要时 Shuffle Write（写中间结果）-> Network（网络传输）-> Shuffle Read（读取中间结果）
  -> 结果写到存储或返回 Driver
  -> Event Log / Metrics / UI（事件日志、指标与页面）保存运行证据
```

`show()`、`collect()` 会把结果拉回 Driver；对大结果误用会造成 Driver OOM。生产优先写出到分布式存储或限制结果规模。

图中箭头是一次计算的推进关系，事件日志属于旁路证据，不是所有业务行都要经过的落盘站。OOM 是 Out Of Memory，即可用内存不足；`show()` 只取有限结果用于展示，`collect()` 则要把全部结果取回，危险程度不同。数据通常由执行进程直接读取外部存储，驱动进程负责协调，不能把它画成所有数据必经的中转服务器。

## RDD、DataFrame 与 SQL

### RDD

RDD（Resilient Distributed Dataset，弹性分布式数据集）提供分区、转换、Action、Lineage 和失败重算。它更接近底层，但优化器难以理解任意用户函数内部逻辑。

### DataFrame

DataFrame 有列和 Schema。Catalyst 能做列裁剪、谓词下推、常量折叠、Join 选择和代码生成。多数结构化数据任务优先使用 DataFrame/SQL。

### Dataset

Dataset 主要在 Scala/Java 提供编译期类型能力。PySpark 常用 DataFrame，没有 Scala Dataset 的静态类型编码器模型。

## Transformation、Action 与懒执行

`select`、`filter`、`groupBy` 等先构建计划；`count`、`write`、`collect` 等 Action 才触发执行。懒执行让优化器有机会查看整个计划，也意味着“这一行代码运行很快”可能只是还没真正计算。

## Narrow 与 Wide Dependency

- Narrow Dependency：父 Partition 通常只被少量子 Partition 使用，例如 `map`、多数 `filter`。
- Wide Dependency：多个父 Partition 的数据要重分布到多个子 Partition，例如 `groupByKey`、`join`、`repartition`。

Wide Dependency 通常形成 Shuffle 和新 Stage，是网络、磁盘和倾斜的重点。

## Catalyst、Tungsten 与 AQE

### Catalyst

Catalyst 负责解析、分析、逻辑优化和物理计划选择。缺统计信息时，优化器可能错误估计表大小或 Join 成本。

### Tungsten/代码生成

Spark SQL 通过二进制内存格式和 Whole-Stage Code Generation 等减少对象开销与虚函数调用。执行计划中的 `*` 常表示代码生成阶段，但仍要结合版本和计划解释。

### AQE

AQE（Adaptive Query Execution，自适应查询执行）在运行时使用实际统计信息调整计划，例如合并 Shuffle Partition、处理倾斜 Join 或切换 Join 策略。AQE 不是免调优开关，输入质量、Key 设计和资源上限仍然重要。

### 老师把计划和执行拆给你看

“保留严重告警，再按服务计数”是逻辑计划，只描述结果应该是什么；“扫描文件、分区内计数、交换局部结果、合并计数”是物理计划，描述具体怎样完成。解析器先理解表达式，分析器再结合列类型和目录服务解决名称，优化器在保持语义的条件下调整处理方式。比如不用日志正文那一列，就可以让后续扫描少读它，而不是先读完再丢弃。

为什么懒执行有价值？如果每写一行筛选就立即执行，优化器看不到后续只保留两列的需求，可能白读很多数据。先积攒计划，再由触发动作决定计算范围，给了整体优化的机会。它也改变排障方式：创建对象成功不代表文件可读；有些读取会在创建阶段检查路径、列结构或推断类型，真正的数据计算则可能直到动作才报错，因此不能绝对地说触发动作之前“完全没有任何工作”。

现在预测：同一个未缓存的汇总先展示，再写出，会执行几遍？通常会产生重复计算的机会，不能把已经看到一次结果当成数据自动缓存。一个动作也不保证严格只对应一个作业，广播、子查询、自适应调整和内部实现可能引出额外作业。学习时在 SQL 页面选择本次执行，再映射到作业和阶段，不根据代码行数猜数量。这个判断可用本课先展示再写出的脚本观察。

阶段是按数据依赖切出的执行边界，不是按代码缩进或每个函数切段。同一阶段的任务处理各自分区，不需要把每个过滤都独立落盘；遇到重分布，后续任务需要读取来自上游多处分区的结果。DAG 中的“无环”说的是计算依赖不绕回自身，不是说业务程序不能写循环；训练多轮模型时，程序循环仍会多次触发计算。

观察计划时优先找 Scan（输入扫描）、Filter（筛选）、Project（选择列）、Exchange（分布交换）、Aggregate（聚合）和 Join（关联）。若出现 Python UDF，意思是 Python 用户自定义函数，它的计算逻辑可能无法被查询优化器进一步推导，还可能增加跨语言传输成本。先用内置表达式表达能表达的逻辑；若必须用自定义函数，再用同一数据量测量性能和空值行为，不把所有慢查询都归咎于 Python。

AQE 的作用是在拿到运行统计后改进后续计划，不是把已经发生的所有昂贵工作撤销。你可能看到初始计划与最终计划不同，分区数量也从配置值收敛成较少的任务。这时要保存最终自适应计划与任务指标，不能因为任务数没有等于配置值就断言配置未生效。反过来，某类聚合热点也不保证被自适应连接倾斜优化解决，算子类型和可拆分语义仍是边界。[SQL 调优参考](https://spark.apache.org/docs/4.2.0/sql-performance-tuning.html)

## Shuffle 数据路径

```text
Map Task（生成 Shuffle 中间输出的映射阶段任务）
  -> 按目标 Partition 分桶
  -> 内存缓冲、排序、必要时 Spill 到磁盘
  -> 生成 Shuffle 文件与索引

Reduce Task（归约阶段任务）
  -> 通过网络 Fetch 多个 Map 输出
  -> 合并/排序/聚合
  -> 生成下一阶段结果
```

Shuffle 故障要关联 Fetch Failed、Executor 丢失、磁盘空间、网络、GC、外部 Shuffle Service、重试和数据倾斜。

### 内存课堂：溢写是退路，不等于事故

Shuffle 之前需要把记录按目标分区组织起来；聚合可能需要保存分组累计值，排序需要保存待排记录。这些工作都有临时内存需求。缓冲空间不够时，支持溢写的算子会把部分中间结果写到本地磁盘，之后再合并，这叫 Spill。它让大于可用内存的数据仍有机会完成，但多次写读会增加耗时，磁盘容量和吞吐因此成为计算资源的一部分。

不要把“看到溢写”直接翻译成“内存故障”。一个任务少量溢写后稳定完成，可能是合理取舍；输入不变而溢写突然增大，同时垃圾回收变多、阶段超时，才值得沿版本、计划、分区和并发变化调查。页面里的内存溢写量与磁盘溢写量可能受对象表示和压缩影响，不应直接相加当成源数据大小。先比较同一字段的前后变化，再解释它代表的资源。

执行器的内存不是一个可任意取用的大桶。Java 虚拟机堆内承载对象、执行工作区和部分缓存，堆外或本地库有另外的分配，Python 工作进程还会消耗独立内存。容器层看到的是进程组总占用，因此 Java 堆没有满也可能被容器限制终止。GC 是 Garbage Collection，即回收不再使用对象；长时间 GC 可能拖慢心跳，使资源问题表面上像网络失联。

同一个执行器并发四个大任务时，它们会争用内存和磁盘；给执行器更多核心不等于给每个任务更多空间。诊断时对比任务峰值、并发数、缓存占用和容器退出原因。如果一个分区大到需要保存海量独立分组状态，单纯给整个应用多加执行器未必改善这个任务；如果是 Python 工作进程超预算，只调 Java 堆也可能继续被杀。先判断哪个进程、哪个算子和哪个分区，再选减少列、预聚合、增加分区、降低并发或调整内存预算。

缓存是为了反复使用某个计算结果而保存的副本，调用缓存接口通常也要等动作才填充。它占用资源，也可能被淘汰；丢失后能否重算依赖原输入和血缘仍可用。血缘即从哪个输入经过哪些变换得到当前分区的依赖关系，不是一份自动保存的历史数据。完成复用后释放不再需要的缓存，比长期缓存所有中间结果更容易控制资源。[内存调优参考](https://spark.apache.org/docs/4.2.0/tuning.html)

### 容错课堂：重算一个分区，不代表外部动作只做一次

执行器丢失时，驱动进程可以重新安排相关任务；如果丢的是可重建中间数据，可以沿依赖关系重算。如果原始文件已被覆盖、来源无法重放，重算可能失败或得到不同结果。由此推导出生产条件：绑定不可变输入批次或表快照，保存代码和依赖版本，谨慎处理随机数、当前时间以及外部查询；否则所谓“重试”可能已经是另一道题。

任务内部函数连同它引用的必要变量会被发送到执行端执行，这叫闭包传送；对象通常需要序列化，即变成可传输字节。新手常在驱动端创建数据库连接，再试图让任务直接使用，可能遇到无法序列化或跨进程无效。正确做法不是把密码打印出来排查，而是让分区处理逻辑在受控范围内取得连接、限制并发并安全释放；生产还要考虑下游连接池能承受多少并发。

现在想象任务已向工单系统创建工单，却在上报成功前断线，重新执行会怎样？计算框架不知道外部工单已经成功，可能再创建一次。推测执行也可能让同一逻辑同时有多个尝试；推测执行指给特别慢的任务再启动一个副本以争取较快结果，不适合用来解决所有真实数据倾斜。因此外部副作用应有稳定业务键、幂等约束或事务发布设计，不能只把任务重试次数设为一就宣称精确一次。

本课 JSON 输出只验证批处理内容，不承诺目录覆盖是跨系统原子提交。生产可以先写独立运行目录，检查结果和质量，再通过表事务或受控发布指针让下游看到新版本；具体原子性取决于文件系统、提交协议和表格式。失败运行不能覆盖唯一的上一版可用结果，自动重跑也必须检查是否已经发布。[RDD 容错与共享变量](https://spark.apache.org/docs/4.2.0/rdd-programming-guide.html)

## 缓存、Persist 与 Checkpoint

- `cache/persist`：为了复用计算结果，可被淘汰并按 Lineage 重算。
- Checkpoint：把数据或流状态写入可靠存储，截断 Lineage 或支持恢复。
- Structured Streaming Checkpoint：保存 Offset、Commit、State 等进度，不能被当作普通缓存随意删除。

缓存前先确认数据是否会复用、是否能放下、序列化格式和淘汰后的重算成本。缓存所有中间表可能让内存更差。

## PySpark 入门

```python
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = (
    SparkSession.builder.appName("aiops-alert-summary")
    .config("spark.sql.session.timeZone", "UTC")      # 固定课堂时间解释，避免机器时区差异
    .getOrCreate()
)

alerts = (
    spark.read
    .option("header", True)                         # 第一行是列名
    .schema("service_name STRING, severity STRING, event_time STRING")
    .csv("/opt/spark/work-dir/alerts.csv")
    .withColumn("parsed_time", F.try_to_timestamp(F.col("event_time")))
)

invalid = (
    F.col("service_name").isNull() | (F.trim(F.col("service_name")) == "")
    | F.col("severity").isNull() | (~F.col("severity").isin("critical", "warning"))
    | F.col("parsed_time").isNull()
)
bad_rows = alerts.filter(invalid).count()             # 检查名称、级别与时间，而不是只找一个哨兵值
if bad_rows:
    raise ValueError(f"found {bad_rows} invalid alert rows")

summary = (
    alerts.filter(F.col("severity") == "critical")  # 只统计严重告警
    .groupBy("service_name")                         # 按服务触发 Shuffle 聚合
    .agg(F.count("*").alias("alert_count"))         # 统计每个服务告警数
    .orderBy(F.desc("alert_count"))                  # 数量从高到低
)

summary.explain(mode="formatted")                   # 保存计划，确认扫描和 Exchange
summary.show(truncate=False)                         # 实验结果很小，可安全回到 Driver

(
    summary.coalesce(1)                              # 仅实验小结果合并；大数据不要强制单分区
    .write.mode("overwrite")
    .json("/opt/spark/work-dir/output")
)

spark.stop()
```

这里的 Schema 是列名与类型约定，原始时间先保留字符串，`try_to_timestamp` 尝试解析，失败给出空值以便质量门禁集中处理。`isNull` 显式检查空值，避免 SQL 三值逻辑中的未知值悄悄绕过过滤；`isin` 限定本课允许的两种级别，生产名单由业务合同定义。统一使用 UTC，即协调世界时，样本没有时区后缀时按该会话时区解释，不把本地时间与统一时间混算。

## Spark SQL 示例

```sql
SELECT service_name, COUNT(*) AS alert_count         -- 统计每个服务的严重告警
FROM alerts                                          -- alerts 已注册为表或临时视图
WHERE severity = 'critical'                         -- 尽早过滤，减少后续数据量
GROUP BY service_name                               -- 按服务重分区和聚合
ORDER BY alert_count DESC;                          -- 排序会引入额外阶段
```

## 配置重点

```properties
# 静态执行器数；动态分配时语义不同
spark.executor.instances=6
# 每个执行器可并发任务数的约束之一
spark.executor.cores=4
# Java 虚拟机堆，不代表容器全部内存
spark.executor.memory=8g
# 额外内存预算；Python 专项预算和堆外配置还需单独核对
spark.executor.memoryOverhead=2g
# SQL 重分布的初始分区预算，运行中可被自适应计划调整
spark.sql.shuffle.partitions=400
# 启用自适应查询；仍需验证计划与结果
spark.sql.adaptive.enabled=true
# 记录运行事件供历史页面服务复盘
spark.eventLog.enabled=true
# 仅为集群配置示意；该可靠存储路径须事先准备并授权
spark.eventLog.dir=hdfs:///spark-history
```

资源总量要乘以 Executor 数。只改 `executor.memory` 而忽略 Overhead、Python Worker、Container 上限和并发 Task，仍可能被 YARN/Kubernetes OOM Kill。

## 常用命令字典

| 命令 | 作用 | 关键证据 | 常见坑 |
|---|---|---|---|
| `spark-submit` | 提交应用 | Application ID、退出码、参数 | Client/Cluster 模式混淆 |
| `pyspark` | 交互式 PySpark | SparkSession、UI | 不适合长期生产作业 |
| `spark-sql` | SQL CLI | Catalog、计划、结果 | 当前 Catalog/Database 错误 |
| `df.explain('formatted')` | 查看计划 | Scan、Exchange、Join | 计划不等于运行耗时 |
| `df.rdd.getNumPartitions()` | 查看对应 RDD 的分区数 | 当前计划下的数据分片 | 不是执行器数量；后续算子与自适应计划可能改变分区 |
| `spark.catalog.clearCache()` | 清理当前会话缓存 | 缓存状态 | 生产清缓存会影响其他查询 |

## 入门实验：Docker 运行 PySpark 聚合

### 准备数据

在自己选择的练习目录中创建一个全新 `spark-lab` 文件夹。以下文件都只含合成服务名称；不要把仓库根目录或真实日志目录整体挂载到容器。先用 `docker version` 确认 Client 与 Server 均可用，若有同名容器则先核实归属，不执行强制删除来腾名字。

创建 `spark-lab/alerts.csv`：

```csv
service_name,severity,event_time
order-api,critical,2026-07-23T09:00:00
pay-api,warning,2026-07-23T09:01:00
order-api,critical,2026-07-23T09:02:00
```

把前面的 Python 保存为 `spark-lab/alert_summary.py`。

### 运行

```powershell
Set-Location .\spark-lab

docker run --rm `
  --name spark-lab `
  --mount "type=bind,source=$((Get-Location).Path),target=/opt/spark/work-dir" `
  apache/spark:4.2.0 `
  /opt/spark/bin/spark-submit `
  --master 'local[2]' `
  /opt/spark/work-dir/alert_summary.py
```

预期看到 `order-api` 的 `alert_count=2`，并在 `output` 目录生成 JSON。保存 formatted plan，观察 `Exchange` 和聚合阶段。

`--rm` 在本次进程结束后移除容器，挂载目录里的输入和输出仍留在宿主机；`local[2]` 表示本机两个工作线程，不是两个执行器或两台节点。运行结束立即记录 `$LASTEXITCODE`，正常为零。读取 `output` 内以 `part-` 开头的 JSON 文件，比较服务名和数量，不以文件名或记录顺序做业务断言。写出路径是目录，目录中的提交标记和多个分片都不是额外告警。

### 如果没成功

1. 官方镜像标签是否存在，Docker 引擎是否启动。
2. 挂载路径是否使用绝对 Windows 路径。
3. CSV 和 Python 是否在同一实验目录。
4. 宿主机 `output` 是否被旧权限或进程占用。
5. 日志中的第一个 `Caused by` 通常比最后一行更接近根因。

## 故障注入实验：坏数据触发作业失败

### 注入

在 CSV 追加：

```csv
inventory-api,BROKEN,not-a-time
```

重跑 `docker run`。预期 Python 抛出 `ValueError: found 1 invalid alert rows`，Spark Application 失败且不应生成新的成功结果。

### 证据与修复

记录退出码、Driver 日志和坏数据数量。修复可以是隔离坏行、修正上游或显式 Schema 加质量规则；本实验直接删除坏行后重跑。

验证输出恢复且结果仍为 `order-api=2`。生产不能为了“让作业绿”直接吞掉所有坏行，应记录 quarantine 路径、数据质量指标和告警。

### 清理

删除本地实验 `output` 与临时 CSV 前，先保留脚本、计划、成功输出和故障复盘作为学习证据。

准确清理顺序是退出所有本课运行、在文件管理器核实当前路径确为自己新建的 `spark-lab`、只将其 `output` 移入回收站；保留输入与脚本供复现。若整课结束，可把整个专用练习目录移入回收站。不要对当前工作目录运行泛化的递归删除。故障修复时只移除自己刚追加的坏行；旧输出仍存在并不能证明失败运行已经发布成功，要把退出码和运行时间一起记下。

## Structured Streaming

Structured Streaming 把无界输入视为持续追加/更新的表，并使用与 Spark SQL 相近的 DataFrame API。

关键概念：

- Trigger：多久触发一次处理或采用何种执行模式。
- Source Offset：已经读到输入的哪个位置。
- Watermark：允许事件时间迟到的边界，用于控制状态清理。
- State Store：窗口、去重和聚合的持久状态。
- Checkpoint：保存进度、提交记录和状态恢复信息。
- Output Mode：Append、Update、Complete 的结果输出语义。

“Exactly-once”必须同时看 Source、Spark 状态、Checkpoint 和 Sink。外部接口若不支持幂等或事务，任务重试仍可能重复副作用。

### 先分清三只钟，再谈迟到

事件时间是告警实际发生的时间，处理时间是计算程序看到它的时间，触发间隔是程序安排一批工作的节奏。它们不是同一只钟。昨天发生的告警今天才入队，处理时间是今天，事件时间仍是昨天；把它按今天计数虽然容易实现，却改变了业务口径。流处理需要保留一段历史窗口状态，才能把迟到数据加回正确窗口。

State Store 即状态存储，保存某个窗口或键已经累计到什么程度。它不是源数据仓库：五分钟窗口按服务计数，状态里主要是各窗口各服务的累计值以及维护信息；做两条流关联时则可能要保留等待匹配的记录。状态规模取决于键数量、保留窗口、每键状态大小和算子类型，不能只按每秒输入行数估计内存。

Watermark 即事件时间水位，用已经观察到的事件时间进展和允许迟到时长，帮助引擎决定何时可以淘汰旧状态。它不是“当前电脑时间减十分钟”，也不是让源端自动延迟发送。聚合中，阈值内的迟到数据有被处理的保证；更迟的数据可能被丢弃，但并非一超过阈值就保证丢弃。水位更新与批次推进有关，不能把一个纸面减法当成每条记录的精确判决器。[官方水位语义](https://spark.apache.org/docs/4.2.0/streaming/apis-on-dataframes-and-datasets.html#semantic-guarantees-of-aggregation-with-watermarking)

### 检查点恢复的是进度合同

在默认微批处理方式中，引擎选择这一批要处理的输入范围，执行变换和状态更新，向输出端提交，再记录相关完成进度。Checkpoint 即检查点，保存偏移、提交记录和有状态计算恢复所需信息。Offset 是来源中的读取位置，不是“读了多少条”这个粗略数字。发生故障后可根据这些记录重放需要重做的输入；能否完成仍取决于源端保留数据与输出端协议。

每条独立流查询使用自己稳定的检查点位置，放在受支持、持久且有权限控制的存储上。不要把容器临时盘当恢复保障，不让两个运行实例竞争写同一检查点，也不要把删除检查点当日常排障按钮。新检查点意味着新的进度历史，可能重新处理大量数据；换一个输出目录也未必允许直接沿用旧检查点。查询的来源数量、状态分组键、状态结构等变更，需要逐项核对恢复兼容。

`foreachBatch` 是把每个微批交给自定义函数写出的接口，默认只能按至少一次的写入语义考虑。可以把批次标识与输出事务绑定来去重，但同一逻辑换了检查点后批次序号不能当跨历史全局唯一键。真正对外建单时，通常还需要业务事件键与处理版本组成稳定标识；如果写入多个系统，单个系统事务不自动形成跨系统事务。数据库去重表、结果发布表和补偿策略要一起设计。

### 不开集群也能完成的生产模拟

这是一项明确的纸面演练，不验证 Spark 实际批次调度。前置材料只有一张空表格，填四列：到达批次、事件时间、归属窗口、是否仍应保留该窗口。假设窗口为五分钟，允许迟到十分钟，第一批收到十二点零二分与十二点零八分的事件，先把它们分别放入十二点至零五分、零五分至十分的窗口。此时最晚事件时间尚不足以让第一个窗口定稿。

第二批再收到一条十二点零三分事件和一条十二点二十分事件。先预测：零三分记录虽然晚到，仍可能需要给第一个窗口补计；二十分记录推动事件时间进展，使更旧窗口随后有机会完成和清理。不要假定第二批内部按你纸上的先后逐行推进水位，实际批次水位需看查询进度。第三批加入十二点零一分事件，标为“超过允许范围，不能承诺纳入”，并设计离线补算入口，而不是在纸上强行写成绝对丢弃。

故障注入是把检查点一栏假设为丢失，让自己解释哪些输入会重放、旧输出是否还在、稳定业务键能否阻止重复。如果答不出来，就不能批准“删检查点后重启”。修复方案是在隔离存储里恢复可用检查点副本，或者建立明确的新进度与重放范围，并向独立结果版本写出后对账；不能随意复制正在更新的目录并称作一致备份。演练结束只需保存这张合成时间线，没有服务、账号或真实数据需要清理。

将来在真实隔离集群验证时，记录每批输入数、事件时间水位、状态行数、状态内存、批次耗时和输出提交标识。若新数据停了，水位未必按墙上时钟继续前进，旧窗口结果也可能迟迟不定稿；若源数据带有异常未来时间，水位推进可能伤害正常迟到数据。因此时间字段校验是状态治理的一部分，而不是只在展示时格式化日期。

## 集群部署与高可用

### YARN

YARN 管理 Container 和队列，Spark ApplicationMaster/Driver 模式取决于 deploy mode。排障需要同时看 Spark UI、YARN Application 和 NodeManager 日志。

### Kubernetes

Driver Pod 创建 Executor Pod。要设计 ServiceAccount、RBAC、镜像、Secret、PVC/对象存储、网络策略、Pod 模板和 Driver 故障恢复。

### Standalone

Spark 自带 Master/Worker 管理器，适合较简单场景。Master HA、Worker 故障、共享存储和 History Server 仍需设计。

## 容量与性能

### Partition 大小

太少：单 Task 数据过大、并行不足、长尾和 OOM。太多：调度、文件、Shuffle 连接和小任务开销增大。用输入字节、Task 时长、Shuffle 大小和核心数压测。

### Executor 形状

大 Executor 减少进程数但 GC 和故障影响更大；小 Executor 隔离更好但增加通信和调度开销。按 JVM、Python、缓存、Shuffle 和节点拓扑决定。

### Join

- Broadcast Hash Join：小表广播，避免大 Shuffle；广播过大会 Driver/Executor OOM。
- Sort Merge Join：适合大表等值 Join，但需要 Shuffle 和排序。
- Shuffle Hash Join：取决于数据规模和配置。

### 数据倾斜

证据是 Task 输入/Shuffle/耗时分布不均，而不是平均值高。解决包括 AQE Skew Join、过滤、预聚合、Broadcast、拆热点或 Salt，并验证语义。

## 安全

- 对接 Kerberos/Hadoop Token、Kubernetes ServiceAccount 或云 IAM。
- Spark UI、History Server、REST 和日志不应匿名公网暴露。
- JDBC、对象存储、Kafka 凭据使用 Secret，不进代码或 Event Log。
- 用户代码、UDF 和依赖 JAR 是代码执行边界，要做来源、漏洞和签名治理。
- Driver 日志、SQL Plan 和样本数据可能泄露字段与路径。

## 可观测性与 AIOps

### 重点指标

- Application/Job/Stage 成功率与耗时。
- Task duration、input/shuffle read/write、spill、GC、峰值内存。
- Active/failed Executor、lost Executor reason。
- Driver Heap、线程、事件循环和 RPC。
- Streaming input rows、processed rows、batch duration、watermark、state rows。
- YARN Queue/Kubernetes Pod 调度与资源不足。

### 关联键

```text
application_id + attempt_id + job_id + stage_id + task_id
  + executor_id + host + sql_execution_id
  + batch_id + checkpoint_path
  + code_version + data_version + config_version
```

这组字段用来串联证据，不是求和算式。应用标识及尝试标识区分一次运行和重新启动，作业、阶段、任务标识定位慢在哪里，执行器与主机定位资源位置。`sql_execution_id` 关联结构化查询页面，`batch_id` 是流微批标识，`checkpoint_path` 是检查点位置，最后三个版本字段分别记录代码、输入数据和有效配置。公开学习记录用代号替代内部路径，不能把未脱敏的事件日志整体提交。

AIOps 可自动识别倾斜、资源回归、失败签名和慢 Stage，但自动重试要防止重复写；自动增加资源要受预算、队列和下游容量约束。

## 常见故障排查

### Driver OOM

检查 `collect/toPandas`、广播、计划过大、分区/文件数和 Driver 结果大小。只加内存可能掩盖错误数据流。

### Executor OOM

看失败 Task、Partition 大小、聚合/Join、缓存、Python Worker、Overhead、GC 和容器 Kill 原因。

### Fetch Failed

关联源 Executor 是否丢失、磁盘、网络、Shuffle 文件、External Shuffle Service 和重试。大量重试可能是节点或磁盘持续故障。

### 最后几个 Task 很慢

比较 Task 分布、输入、Shuffle、GC、Locality 和外部 I/O。平均 Stage 指标会掩盖长尾。

### 作业一直等待资源

检查 YARN Queue/Kubernetes Quota、Driver/Executor 请求、节点标签、污点、镜像拉取和动态分配边界。

### Streaming 延迟持续增长

比较 input rate 与 processing rate、batch duration、state size、checkpoint、sink latency 和 backpressure。重启不解决长期吞吐不足。

## 升级与回滚

1. 盘点 Spark/Java/Scala/Python/Hadoop、Connector、Catalog、文件格式和 UDF。
2. 保存制品、锁定依赖并启用 Event Log。
3. 对核心作业做结果、计划、性能和数据质量回归。
4. Streaming 升级前核对检查点与状态结构兼容；不兼容时设计新检查点、输入重放和输出对账迁移，不套用 Flink 的 Savepoint 操作概念。
5. 灰度少量作业，比较耗时、成本、失败率和输出。
6. 回滚必须保留旧镜像/制品和可读数据格式；不可兼容状态不能直接用旧版本加载。

## 生产事故题：大部分 Task 完成但 Job 不结束

1. 控制影响：暂停低优先级重试，保留 Spark UI/Event Log。
2. 对比最后 Task 与中位 Task 的 input、shuffle、spill、GC、host。
3. 检查热点 Key、节点硬件、Fetch、外部接口和近期数据变化。
4. 形成可验证假设，例如单 Key 占 60% 数据。
5. 在样本或灰度作业验证 AQE、预聚合、Salt 或 Broadcast。
6. 评估结果语义、资源、下游写入和回滚。

## 系统设计题

设计每天 30 TB 日志 ETL 加近实时告警聚合平台，批作业 6 小时内完成，流作业 p99 延迟小于 2 分钟。

答案要覆盖数据源、Schema、分区/文件格式、批流边界、集群管理器、Driver/Executor、Shuffle、Checkpoint、Sink 幂等、资源隔离、History Server、指标、安全、成本、升级和灾备。

### 老师带你回答这道设计题

先拆两个服务目标：批处理六小时完成，与流处理百分之九十九事件两分钟内出现结果，并不需要抢同一个资源池。三十 TB 六小时的单遍理想读取吞吐约为每秒一点四 GB，还没算重分布、结果写出和失败重算；根据实际文件压缩率、查询列数、关联放大和下游吞吐做样本压测，再估算计算、网络与临时盘。批任务可以较大批量交换数据，关键告警流应保有独立资源配额，避免一场回填拖住实时处理。

然后指出需求中的潜在矛盾：如果允许十分钟迟到，还要求只输出永不变化的最终窗口结果，两分钟最终时延可能无法同时满足。可与业务约定先提供两分钟内的初步告警计数，允许后续更新；待事件时间水位越过窗口结束边界、相应微批完成后，再发布最终口径。数据停流时，这不保证在墙钟十分钟内发生。输出模式是接口合同：追加模式适合可定稿的新结果，更新模式需要下游能按窗口和服务更新现有值，完整模式会重复输出整张聚合结果表。不能把更新模式的多次结果直接追加相加。

Driver 的恢复责任要说清：客户端模式把驱动放在提交端，提交端断开或宕机的影响需要评估；集群模式把驱动交给集群环境管理，但重新启动仍不等于无损恢复所有应用逻辑。执行器扩缩容也要考虑正在使用的重分布文件如何保留或重建，以及源端和输出端是否承受额外并发。恢复指标应包含从故障到重新追平输入的时间，而非仅容器重新启动的时间。

升级先选独立输入批次和独立输出目录，比对新旧版本的空值、时间解析、类型转换、连接结果与成本；流作业额外核对来源连接器、状态结构、检查点及输出提交兼容。灰度不通过时保留旧制品，但若新程序已写入旧程序不能理解的状态，不能直接切回旧镜像。需要提前预留可恢复位置与输入保留期，按批准的重放计划恢复并对账，不借重跑把下游工单重复创建一遍。

## 选型取舍

- Spark vs MapReduce：Spark DAG 与通用 API 更灵活，MapReduce 阶段和磁盘边界更简单。
- Spark vs Flink：Spark Structured Streaming 与批/SQL 生态强；Flink 更强调原生状态流、事件时间和低延迟持续处理。
- Spark SQL vs Hive：Spark 是计算引擎，Hive 提供 SQL/Metastore 生态；可组合而非必然替代。
- Spark vs Trino：Spark 适合 ETL/复杂计算/机器学习，Trino 更偏交互式联邦查询。

## 面试怎么讲

### 30 秒版本

Spark 是通用分布式计算引擎。Driver 把 DataFrame/SQL 通过 Catalyst 变成物理计划，DAG Scheduler 按 Shuffle 切成 Stage，再把每个 Partition 的 Task 发给 Executor。排障重点是 Partition、Shuffle、倾斜、内存、GC、Executor 丢失和外部存储，并用 Event Log 与 Web UI 留证据。

### 3 分钟版本

可以这样沿本课作业展开：主程序在驱动进程创建会话，读取带列结构的告警数据，筛选和聚合先组成逻辑计划，优化器再选择物理算子。计数、展示或写出触发计算，阶段调度器根据重分布依赖拆分阶段，执行进程中的任务处理对应分区。局部计数先减少中间数据，随后交换各服务结果并合并；最终写出的目录与驱动端展示都需要单独核验。

如果最后一个任务很慢，我先比较同阶段任务的输入、交换读取、溢写、垃圾回收和所在节点。热点键、坏节点、外部写入慢对应不同修复；更多执行器无法自然解决已经集中到一个任务的巨量数据。缓存适合多次复用，但不能当数据备份；任务失败可以重算的前提是依赖与输入还可用，并且外部副作用有幂等保护。

流处理进一步需要保存读取进度和状态，检查点让查询从已知位置恢复，水位为迟到处理与状态清理提供边界。是否端到端精确一次，还要看输入能否重放、输出能否可靠提交。生产设计会把批流配额、驱动恢复、执行器内存与临时磁盘、身份权限、运行事件日志和升级回滚一起纳入；本课小样本结果不是多节点高可用或生产吞吐的实测证据。

## 递进面试题

### 1. Job 为什么会被切成多个 Stage

Shuffle 等 Wide Dependency 形成边界。追问要说明 Stage 内 Task 对不同 Partition 执行相同逻辑。

### 2. Spark 如何容错

RDD/DataFrame 可按 Lineage 重算丢失 Partition，Shuffle 文件和 Executor 丢失会触发相应 Stage 重试；Streaming 还依赖 Checkpoint 和 Source/Sink 语义。

### 3. 为什么 `groupByKey` 容易出问题

它可能把同 Key 的大量原始值拉到同一端，增加 Shuffle 和内存。能预聚合时优先 `reduceByKey` 或结构化聚合，但要看业务语义。

### 4. `repartition` 与 `coalesce` 区别

`repartition` 通常完整 Shuffle，可增减分区并均衡；`coalesce` 常用于减少分区并尽量避免完整 Shuffle，可能形成不均。

### 5. Exactly-once 怎么回答

必须限定 Structured Streaming 的 Source、Checkpoint、State 与 Sink。只说“Spark 保证 Exactly-once”是不完整的。

## 学习检查清单

- [ ] 我能解释 Driver、Executor、Job、Stage、Task 和 Partition。
- [ ] 我能画出 Catalyst 到 Executor 的执行路径。
- [ ] 我能解释 Shuffle、Cache、Lineage、Checkpoint 和 AQE。
- [ ] 我能运行 PySpark 聚合并读懂 formatted plan。
- [ ] 我能处理坏数据故障并保留证据。
- [ ] 我能分析 OOM、倾斜、Fetch Failed、长尾和流延迟。
- [ ] 我能设计资源、高可用、安全、升级和回滚。

## 老师带你把一天告警算成一张报表

先把五亿行日志想成一仓库装订好的账册。Driver（驱动进程）负责决定怎么分工，Executor（执行进程）负责翻看分到的账册；Partition（分区）是分给一次任务的数据份额。任务数、机器数、CPU 核数不是同一个数，因此“十台机器为什么有几千个 Task”并不矛盾。

学生：“我写了 `filter`，数据为什么没动？”老师：“你现在是在写作业计划，直到 `count`、`show` 或写出结果这种 Action（触发动作），才真正执行。”这种懒执行让优化器看见整段逻辑，提前去掉不用的列与不符合条件的行。排障时必须在触发计算的阶段观察，而不是只给创建 DataFrame 的语句计时。

按服务汇总时，同服务的记录原本散在不同分区，需要移动到对应处理方，这就是 Shuffle（跨分区重分布）。先在各分区做局部计数，再传较小汇总结果，通常比传全部原始行更经济；但可否预聚合由运算语义决定，不是每种业务都能随意合并。

### 看一个慢 Task，比盯集群平均 CPU 有用

假设 200 个任务里 199 个各处理 200 MB，最后一个处理 40 GB。增加 Executor 也无法把已经分给同一任务的数据自动分成任意多份。你应比较 Task 时长分布、输入、Shuffle 读取量、溢写、GC（垃圾回收）与失败次数，确认是数据倾斜还是机器异常。

如果热点来自某服务占九成数据，随机加盐可以先拆散，再第二次汇总，但会改变作业结构；如果业务是不能拆的复杂列表聚合，内存压力仍可能存在。Broadcast Join（广播连接）适合可安全复制到各执行进程的小表，不能把“比大表小”误解成“能放进每台机器内存”。

### 用前文实验再做一次容量推理

基础聚合完成后，复制几行 `order-api` 合成告警到教学 CSV，记录输入行数与该服务输出计数，重新运行原作业。预期计数按新增行增长，这是结果正确性检查；几行样本不足以证明倾斜性能，只能帮助理解聚合语义。随后查看 `formatted plan` 中的 Exchange（数据交换），把每个交换对应到分区变化。

保留前文坏数据故障的失败日志与修复后结果，再写一个停止条件：输入坏行大于零不发布报表。不要用输出目录里还有旧结果来证明本次执行成功；应核对运行 ID、输出时间、校验值和退出状态。清理只删除自己创建的实验输出，保留原始样本和复盘。

### 生产课堂：重新执行不能产生两份账

任务失败后 Spark 可重算分区，但外部副作用未必跟着回滚。若在每行处理中调用“创建工单”接口，任务重试会再次调用；应写中间结果、使用稳定业务键和支持提交协议的输出方式，把“计算成功”与“对外发布”分开管理。

Structured Streaming（结构化流处理）的检查点保存输入进度与状态等信息，是否端到端精确一次还依赖 Source（输入端）可重放和 Sink（输出端）事务或幂等能力。删除检查点后从头重跑，可能重新消费大量历史数据；升级要验证状态、源连接器、输出格式与检查点兼容。

Driver 高可用不能靠增加 Executor 实现。Driver 放哪里、谁重启它、应用怎样重新提交、输入如何定位、输出如何防重，是独立设计项。容量要同时计算 JVM 堆、Python 进程、堆外内存、Shuffle 磁盘和故障重算余量。AIOps 应关联同一 Application ID 的计划、事件日志、容器失败和存储请求，找出同一时间发生的公共依赖问题。

面试 30 秒说分布式计划与任务边界，3 分钟用告警聚合解释扫描、过滤、Shuffle、写出和重试。追问“为什么最后一个任务慢”，给出分布证据；追问“加内存有用吗”，先区分单分区过大、Python 开销、GC 和网络等待；追问“回滚怎么做”，回答作业制品、连接器、状态及输出发布版本一起验证。

## 执行机制加深：从一个慢 Task 找到真正瓶颈

### Stage 为什么在 Shuffle 处切开

把每个分区独立过滤，任务不需要等其他分区；按服务汇总却需要收齐同服务的数据。这两类依赖不同，Spark 会围绕跨分区重分布形成执行阶段。Stage（阶段）包含一批可按当前依赖并行推进的任务，Task（任务）处理其中一个分区；Job（作业）由触发动作引起，可能包含多个阶段。不要把这些词都翻成“任务”后混为一谈。

在 UI 中先找耗时最长的阶段，再比较同阶段任务的中位数和最大耗时。若几乎所有任务都慢，可能是普遍计算或存储问题；若只有一个任务慢十倍，考虑数据倾斜、异常大记录、少数节点或 GC。看输入记录、Shuffle 读写字节、磁盘溢出、执行时间和失败重试，比只看总 CPU 更接近原因。

Shuffle 写出中间结果，后续任务通过网络读取。执行器故障后这些结果可能需要重算，具体恢复与持久保存机制取决于部署配置。任务报取数失败，不一定是源表损坏；要看失去的是原始数据还是中间分区，以及 executor 日志、磁盘、网络和容器退出原因。无限提高重试次数会掩盖持续磁盘不足，必须把恢复次数和根因定位连起来。

### 分区数量不能只取一个“推荐值”

分区太少，每个任务数据很大、并行度低，还可能溢出内存；分区太多，调度、文件打开和结果提交开销增加。输入文件分区与 Shuffle 后分区又是两个边界，不能只改一个参数就认为所有阶段都变了。先记录输入大小、任务处理字节、可用执行核心和长尾，再小步调整并比较同一输入上的表现。

`repartition` 一般会重新分布数据，常涉及 Shuffle；`coalesce` 在减少分区时可减少某些重分布成本，但可能保留不均衡。为了生成单个结果文件使用 `coalesce(1)`，会让最后阶段集中在一个任务，适合很小摘要，不适合把大表强行压成一个文件。业务如果只需要“一个报告入口”，可以用目录与清单表达，不必要求一个物理巨文件。

### 倾斜修复必须尊重算式

假设 90% 告警都属于一个名为 `unknown` 的服务，按服务分组就可能制造热点。先问为什么服务名缺失：如果是采集解析错误，修复数据质量比给热点键加随机前缀更根本。Salting（加盐分散）把一个热点键拆到多个中间键，再二次聚合，可以用于某些可合并统计，但不能随意用于要求全部原始记录一起处理的逻辑。

例如总数可先分别计数再求和；均值需要合并总和与计数，不能平均各盐桶均值；精确去重和分位数需要相应状态与算法。加盐还可能在连接时要求复制另一侧数据，增加网络成本。面试回答不能止于“数据倾斜用加盐”，应说明聚合是否可组合、如何去掉盐、结果怎么校验，以及新增成本多大。

### 广播、缓存和重复计算

小维表广播到执行器，可以减少大表重分布，但小表必须在反序列化后仍适合各执行器内存。维表列很多、字符串长或版本误拉全历史时，磁盘文件小不代表广播对象小。广播超时先查维表大小、构建耗时、网络与内存，不直接把超时无限调大。

缓存适合同一中间结果被多次使用；只用一次的数据缓存可能额外消耗空间而没有收益。缓存不等于结果已永久保存，也不自动代表输入快照不变。源文件被覆盖或作业重试时，要明确读取的一致性边界；生产应绑定输入分区或版本。需要复现报告时，记录输入快照和变换代码，不能只记一次 `cache()`。

## 面试事故推演：扩容后反而更慢

题目给出新旧两次执行：数据大小相同，执行器翻倍，最终阶段仍只有一个 Task；输出使用 `coalesce(1)`，并写到慢速远端存储。先说明瓶颈在最终集中输出，增加前段计算并行无法消除串行段。验证 UI 的阶段耗时和输出字节，比较取消单文件要求后的结果，保证内容总量和聚合一致。

如果现象换成多数任务快、一个任务特别慢，转查倾斜和坏节点；如果所有任务 Shuffle 读取都慢，查网络、磁盘和共享存储；如果反复失败在同一坏数据行，回到前文故障注入实验的数据合同。把不同证据对应到不同修复，比对所有故障都“调大内存”更有判断力。

修复交付至少保留执行计划、Stage 分布、前后任务指标和结果断言。写出是否重复建单、输出是否覆盖旧版、失败后如何重跑，尤其当作业外部调用 API 时，Spark Task 重试可能再次执行副作用。纯聚合结果的幂等发布与任意外部系统操作不能混为一谈。本文提供本机批处理与坏数据实验步骤，但本轮修订没有运行它们；多节点丢执行器和外部存储恢复也仍需隔离集群另行验证。

## 本课 GitHub 学习证据

```text
spark-lab/
  README.md                  # 版本、边界、架构和实验
  alerts.csv                # 脱敏样本
  alert_summary.py          # PySpark 作业
  formatted-plan.txt        # 执行计划
  output/                   # 小规模验证结果
  incident-bad-row.md       # 失败、证据、修复和复盘
  skew-analysis.md          # Task 分布和热点分析
  production-design.md      # 批流、资源、安全、升级和回滚
```

不要提交云凭据、Kerberos Token、真实数据、内部路径或未脱敏 Event Log。读完本文不能保证获得 offer；还需要 Python/Scala、SQL、Linux、网络、Hadoop/Kubernetes 和项目表达能力。
