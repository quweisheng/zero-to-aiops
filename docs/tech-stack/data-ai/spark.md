# Apache Spark 深讲

> 学习目标：从零理解 Spark 的 Driver、Executor、Job、Stage、Task、Partition 和 Shuffle，能用 PySpark 完成告警聚合实验，能读懂 SQL 执行计划与 Web UI，能分析数据倾斜、OOM、Shuffle、GC、序列化和 Streaming 故障，并能设计生产容量、高可用、安全、升级和回滚方案。

## 官方资料

- [Apache Spark 官网](https://spark.apache.org/)
- [Apache Spark 下载页](https://spark.apache.org/downloads.html)
- [Spark 4.2.0 文档](https://spark.apache.org/docs/4.2.0/)
- [Spark SQL、DataFrame 与 Dataset 指南](https://spark.apache.org/docs/4.2.0/sql-programming-guide.html)
- [Structured Streaming 指南](https://spark.apache.org/docs/4.2.0/streaming/index.html)
- [Spark 监控与 Web UI](https://spark.apache.org/docs/4.2.0/monitoring.html)
- [Spark 配置](https://spark.apache.org/docs/4.2.0/configuration.html)

版本边界：本文以 Apache Spark 4.2.0 正式版为主线。存量平台仍可能使用 3.5.x 或 4.0/4.1 维护线。生产选版本要核对 Java、Scala、Python、Hadoop、Catalog、Connector 和文件格式兼容，不要只追最新版本号。

## 官方知识地图

```text
Apache Spark
  -> API：PySpark、Scala、Java、R
  -> 抽象：RDD、DataFrame、Dataset、SQL
  -> 执行：Driver、DAG Scheduler、Task Scheduler、Executor
  -> 计划：Logical Plan、Catalyst、Physical Plan、Codegen、AQE
  -> 数据：Partition、Shuffle、Cache、Broadcast、Checkpoint
  -> 模块：Spark SQL、Structured Streaming、MLlib、GraphX
  -> 部署：Standalone、YARN、Kubernetes、Local
  -> 运维：Web UI、History Server、Metrics、Event Log、日志
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
spark-submit / Notebook / Service
  -> Driver 创建 SparkSession
  -> DataFrame/SQL 形成 Logical Plan
  -> Catalyst 分析、优化并选择 Physical Plan
  -> Action 触发 Job
  -> DAG Scheduler 按 Shuffle 切 Stage
  -> Task Scheduler 把 Task 发给 Executor
  -> Executor 读取输入 Partition
  -> Filter/Project/Aggregate/Join
  -> 必要时 Shuffle Write -> Network -> Shuffle Read
  -> 结果写到存储或返回 Driver
  -> Event Log / Metrics / UI 保存运行证据
```

`show()`、`collect()` 会把结果拉回 Driver；对大结果误用会造成 Driver OOM。生产优先写出到分布式存储或限制结果规模。

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

## Shuffle 数据路径

```text
Map Task
  -> 按目标 Partition 分桶
  -> 内存缓冲、排序、必要时 Spill 到磁盘
  -> 生成 Shuffle 文件与索引

Reduce Task
  -> 通过网络 Fetch 多个 Map 输出
  -> 合并/排序/聚合
  -> 生成下一阶段结果
```

Shuffle 故障要关联 Fetch Failed、Executor 丢失、磁盘空间、网络、GC、外部 Shuffle Service、重试和数据倾斜。

## 缓存、Persist 与 Checkpoint

- `cache/persist`：为了复用计算结果，可被淘汰并按 Lineage 重算。
- Checkpoint：把数据或流状态写入可靠存储，截断 Lineage 或支持恢复。
- Structured Streaming Checkpoint：保存 Offset、Commit、State 等进度，不能被当作普通缓存随意删除。

缓存前先确认数据是否会复用、是否能放下、序列化格式和淘汰后的重算成本。缓存所有中间表可能让内存更差。

## PySpark 入门

```python
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("aiops-alert-summary").getOrCreate()

alerts = (
    spark.read
    .option("header", True)                         # 第一行是列名
    .option("inferSchema", True)                    # 实验自动推断类型；生产建议显式 Schema
    .csv("/opt/spark/work-dir/alerts.csv")
)

bad_rows = alerts.filter(F.col("severity") == "BROKEN").count() # 实验质量门禁
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
spark.executor.instances=6                          # 静态 Executor 数；动态分配时语义不同
spark.executor.cores=4                              # 每个 Executor 并发 Task 上限之一
spark.executor.memory=8g                            # JVM Heap，不包含全部 Overhead
spark.executor.memoryOverhead=2g                    # Python、Off-heap、Native 等额外内存
spark.sql.shuffle.partitions=400                    # SQL Shuffle 默认 Partition 数，需按数据量压测
spark.sql.adaptive.enabled=true                     # 开启 AQE；仍需验证计划与结果
spark.eventLog.enabled=true                         # 保存事件日志供 History Server 复盘
spark.eventLog.dir=hdfs:///spark-history            # 使用可靠存储，不写 Driver 临时盘
```

资源总量要乘以 Executor 数。只改 `executor.memory` 而忽略 Overhead、Python Worker、Container 上限和并发 Task，仍可能被 YARN/Kubernetes OOM Kill。

## 常用命令字典

| 命令 | 作用 | 关键证据 | 常见坑 |
|---|---|---|---|
| `spark-submit` | 提交应用 | Application ID、退出码、参数 | Client/Cluster 模式混淆 |
| `pyspark` | 交互式 PySpark | SparkSession、UI | 不适合长期生产作业 |
| `spark-sql` | SQL CLI | Catalog、计划、结果 | 当前 Catalog/Database 错误 |
| `df.explain('formatted')` | 查看计划 | Scan、Exchange、Join | 计划不等于运行耗时 |
| `df.rdd.getNumPartitions()` | 查看分区数 | 并行度 | 触碰 RDD API 会失去部分结构化优化语义 |
| `spark.catalog.clearCache()` | 清理当前会话缓存 | 缓存状态 | 生产清缓存会影响其他查询 |

## 入门实验：Docker 运行 PySpark 聚合

### 准备数据

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
4. Streaming 升级前核对 Checkpoint/State Schema 兼容，必要时从 Savepoint/新 Checkpoint 迁移。
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

## 选型取舍

- Spark vs MapReduce：Spark DAG 与通用 API 更灵活，MapReduce 阶段和磁盘边界更简单。
- Spark vs Flink：Spark Structured Streaming 与批/SQL 生态强；Flink 更强调原生状态流、事件时间和低延迟持续处理。
- Spark SQL vs Hive：Spark 是计算引擎，Hive 提供 SQL/Metastore 生态；可组合而非必然替代。
- Spark vs Trino：Spark 适合 ETL/复杂计算/机器学习，Trino 更偏交互式联邦查询。

## 面试怎么讲

### 30 秒版本

Spark 是通用分布式计算引擎。Driver 把 DataFrame/SQL 通过 Catalyst 变成物理计划，DAG Scheduler 按 Shuffle 切成 Stage，再把每个 Partition 的 Task 发给 Executor。排障重点是 Partition、Shuffle、倾斜、内存、GC、Executor 丢失和外部存储，并用 Event Log 与 Web UI 留证据。

### 3 分钟版本

1. 解释 Application、Driver、Executor、Job、Stage、Task。
2. 解释懒执行、Action 和 DAG。
3. 画 Shuffle Write/Fetch/Read 路径。
4. 说明 DataFrame/Catalyst/AQE 与 RDD 边界。
5. 说明 Cache、Lineage、Checkpoint 和 Streaming State。
6. 说明资源、HA、安全、升级和 Sink 一致性。
7. 用 Stage/Task 分布而不是平均值排障。

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

## 学习证据

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
