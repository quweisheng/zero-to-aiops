# Apache Hive 深讲

> 学习目标：从零理解 Hive 如何把 SQL 转成分布式计算任务，能区分 HiveServer2、Metastore、执行引擎和底层存储的职责，能完成建表与聚合实验，能分析慢查询、元数据故障、小文件、分区、倾斜、事务和高可用问题，并能在面试中说明 Hive、Spark SQL、Trino 与传统数据库的边界。

## 官方资料

- [Apache Hive 官网](https://hive.apache.org/)
- [Apache Hive 下载与版本说明](https://hive.apache.org/general/downloads/)
- [Apache Hive 最新文档](https://hive.apache.org/docs/latest/)
- [Hive Language Manual](https://hive.apache.org/docs/latest/language/)
- [Hive Administration Manual](https://hive.apache.org/docs/latest/admin/)
- [Hive GitHub 仓库](https://github.com/apache/hive)

版本边界：本文以 Apache Hive 4.2.0 为主线。Hive 官方已经把 3.x 声明为 EOL（End of Life，生命周期结束）；存量集群不能只因为“还能查询”就忽略 Java、Hadoop、Tez、Metastore Schema 和客户端兼容性。生产升级前必须核对官方发布说明和发行版支持矩阵。

## 官方知识地图

```text
Apache Hive
  -> SQL 接入：Beeline、JDBC/ODBC、HiveServer2
  -> 元数据：Hive Metastore、Database、Table、Partition、Statistics
  -> 编译优化：Parser、Semantic Analyzer、Calcite CBO、EXPLAIN
  -> 执行：Tez、MapReduce、Spark 等受支持执行路径
  -> 存储：HDFS、对象存储、ORC、Parquet、Text、Iceberg
  -> 数据组织：Managed/External Table、Partition、Bucket
  -> 事务：ACID、Write ID、Compaction、Lock
  -> 运维：配置、日志、指标、安全、高可用、升级
```

本文分两层学习：

```text
基础层
  -> 用 Hive SQL 建表、写入、查询和聚合
  -> 看懂表、分区、文件格式和执行计划
  -> 跑通 HiveServer2 与 Beeline 实验

进阶层
  -> 解释查询编译、优化和执行数据路径
  -> 设计 Metastore/HiveServer2 高可用与权限边界
  -> 处理小文件、数据倾斜、统计信息和 ACID Compaction
  -> 完成容量、安全、升级、事故和选型分析
```

## 场景开场

你有半年告警明细，数据已经按天落到 HDFS。直接用脚本遍历文件既慢又难维护，于是团队建了一张 Hive 表，让分析人员用 SQL 统计“每天哪个服务的严重告警最多”。

第二天查询突然从 3 分钟变成 40 分钟。CPU 没打满，HDFS 也没有坏。真正的问题可能是：查询没有分区裁剪、上游产生了几十万个小文件、Join 一侧数据严重倾斜、表统计信息过期，或 Metastore 响应变慢。

## 一句话人话版

`Hive = 给分布式文件和数据湖加上表、元数据和 SQL 能力，再把 SQL 编译成底层计算引擎能够执行的任务。`

## 小白可能会问

### Hive 是数据库吗

它有 Database、Table 和 SQL，但通常不负责像 MySQL 那样自行保存每一页用户数据。表数据主要在 HDFS、对象存储或表格式中，Hive 保存和使用元数据，并协调计算引擎完成查询。

### Hive 查询为什么不是毫秒级

传统 Hive 面向大规模分析吞吐，查询可能需要生成任务、申请资源、扫描大量文件和执行 Shuffle。它不是为高并发单行点查设计的。低延迟交互分析要结合数据规模、缓存、文件格式和其他引擎选型。

### 分区是不是自动把数据分到不同机器

Hive Partition（分区）通常对应目录层级，例如 `dt=2026-07-23`。它首先解决查询裁剪和数据管理问题，不等于 HDFS 副本放置，也不等于 Spark/Flink 的运行时分区。

### Hive 和 Spark SQL 是什么关系

Hive 提供 SQL 语义、Metastore 和表管理生态；Spark SQL 是 Spark 的结构化计算模块。Spark 可以读取 Hive Metastore 中的表，但二者的执行引擎、会话、缓存和调优方法不能混为一谈。

## 为什么要学

- 运维日志、告警、审计和历史指标常以文件或数据湖表长期保存。
- Hive Metastore 已成为许多计算引擎共享的表目录服务。
- 分区、列式格式、统计信息和小文件治理直接决定数据平台成本。
- AIOps 离线特征、告警趋势、容量预测和复盘报表常需要大规模 SQL。
- 面试会连续追问查询路径、分区裁剪、Join、倾斜、Metastore、ACID 和高可用。

## Hive 是什么

Apache Hive 是面向分布式数据的 SQL 数据仓库系统。用户提交 HiveQL 后，Hive 解析 SQL、查询元数据、生成逻辑和物理计划，再交给执行引擎读取底层数据并返回结果。

Hive 主要解决：

1. 用表和列描述原本只是目录与文件的数据。
2. 用 SQL 代替大量手写 MapReduce 程序。
3. 通过分区、统计信息和列式格式减少扫描成本。
4. 用 Metastore 让多个引擎共享表结构和数据位置。
5. 为批处理、ETL、数据湖和离线分析提供统一入口。

Hive 不适合替代高并发 OLTP 数据库，也不能自动保证上游数据质量、HDFS 高可用或对象存储的一致性。

## 核心组件

| 组件 | 人话解释 | 重点证据 |
|---|---|---|
| Beeline | 用户执行 Hive SQL 的命令行客户端 | JDBC URL、退出码、查询日志 |
| HiveServer2 | 接受 JDBC/ODBC 会话和 SQL 的服务端 | Session、Operation、编译与执行日志 |
| Hive Metastore | 保存库、表、列、分区、位置和统计信息 | 元数据库、Thrift 延迟、Schema 版本 |
| Driver | 管理查询生命周期 | Query ID、状态、错误阶段 |
| Compiler | 解析 SQL 并生成计划 | 语法、语义、EXPLAIN |
| Calcite CBO | 基于代价和统计信息优化计划 | 行数、NDV、Join 顺序 |
| Execution Engine | 真正运行分布式任务 | Tez/YARN DAG、Container、Counters |
| SerDe | 在文件字节与表中行列之间转换 | 格式、分隔符、Schema |

## 查询数据路径

```text
Beeline / BI / JDBC Client
  -> HiveServer2 建立认证会话
  -> Driver 接收 SQL 并分配 Query ID
  -> Parser 与 Semantic Analyzer 检查语法和对象
  -> Metastore 返回表、分区、位置和统计信息
  -> Optimizer 生成物理计划并选择 Join/扫描策略
  -> Tez/YARN 等执行引擎申请资源并运行 Task
  -> Task 从 HDFS/对象存储读取 ORC/Parquet 等文件
  -> Shuffle、Join、Aggregate、Sort
  -> 结果返回 HiveServer2，再返回客户端
```

排障时先确定慢在哪一段：连接、编译、Metastore、排队、扫描、Shuffle、写结果还是返回客户端。只看 HiveServer2 进程存在没有意义。

## 元数据与状态

Hive 至少有四类状态：

| 状态 | 保存位置 | 常见风险 |
|---|---|---|
| 表定义与分区 | Hive Metastore 后端数据库 | Schema 不兼容、分区未注册、连接池耗尽 |
| 数据文件 | HDFS/对象存储 | 路径误删、权限错误、小文件、延迟可见性 |
| 查询运行状态 | HiveServer2 与执行引擎 | 服务重启、队列等待、任务失败 |
| ACID 事务状态 | Metastore 事务表和 delta/base 文件 | Compaction 积压、锁等待、Write ID 异常 |

Metastore 备份不等于数据备份，HDFS 快照也不自动包含外部元数据库。恢复设计必须同时覆盖元数据、数据和权限。

## 表、分区与文件格式

### Managed Table 与 External Table

- Managed Table：Hive 管理表生命周期，删除表可能同时删除数据，具体行为受版本和表格式影响。
- External Table：Hive 主要管理元数据，数据生命周期通常由外部系统负责。

生产执行 `DROP TABLE` 前必须确认表类型、Location、对象存储版本控制和回收策略，不能凭“External 一定不删数据”做高风险判断。

### Partition

分区把数据按业务维度组织到不同路径。告警明细常按 `dt` 或 `hour` 分区：

```text
/warehouse/alerts/dt=2026-07-22/
/warehouse/alerts/dt=2026-07-23/
```

查询带 `WHERE dt='2026-07-23'` 时，优化器可以只扫描一天。若在分区列上套无法下推的函数，可能失去裁剪。

### Bucket

Bucket（分桶）按哈希把行分到固定数量文件。它可辅助采样、Join 或文件组织，但只有写入过程真正遵循分桶规则才有意义。声明了 `CLUSTERED BY` 不代表历史文件自动重排。

### ORC 与 Parquet

二者都是列式格式，适合只读取部分列、压缩和谓词下推。选择要考虑引擎兼容、Schema 演进、统计信息、压缩、生态和实际压测，不能只背“谁更快”。

## SQL 与 DDL 入门

```sql
CREATE DATABASE IF NOT EXISTS aiops;                         -- 创建 aiops 数据库；已存在时不报错

CREATE TABLE IF NOT EXISTS aiops.alerts (                    -- 创建告警明细表
  service_name STRING,                                       -- 服务名称，例如 order-api
  severity STRING,                                           -- 告警级别，例如 critical
  created_at TIMESTAMP                                       -- 告警产生时间
)
PARTITIONED BY (dt STRING)                                    -- 按日期分区，查询时用 dt 裁剪目录
STORED AS ORC;                                                -- 使用 ORC 列式格式保存数据

INSERT INTO aiops.alerts PARTITION (dt='2026-07-23')          -- 把数据写入指定日期分区
VALUES
  ('order-api', 'critical', TIMESTAMP '2026-07-23 09:00:00'),
  ('pay-api', 'warning', TIMESTAMP '2026-07-23 09:05:00'),
  ('order-api', 'critical', TIMESTAMP '2026-07-23 09:10:00');

SELECT service_name, COUNT(*) AS alert_count                 -- 按服务统计告警数量
FROM aiops.alerts                                             -- 从告警表读取数据
WHERE dt = '2026-07-23'                                      -- 只扫描目标日期分区
GROUP BY service_name                                        -- 每个服务独立聚合
ORDER BY alert_count DESC;                                   -- 最吵的服务排在前面
```

预期 `order-api` 为 2，`pay-api` 为 1。若结果为空，先检查当前数据库、分区是否存在、数据 Location 和文件权限。

## EXPLAIN 怎么看

```sql
EXPLAIN FORMATTED
SELECT service_name, COUNT(*)
FROM aiops.alerts
WHERE dt = '2026-07-23'
GROUP BY service_name;
```

重点看：

- 是否只访问目标分区。
- TableScan 读取哪些列和文件。
- 聚合是否分成局部与全局阶段。
- 是否产生 Shuffle/Exchange。
- Join 顺序和 Join 类型是否合理。
- 估算行数是否明显偏离真实数据。

EXPLAIN 是计划，不是运行证据；还要结合执行 DAG、Counters、扫描字节和阶段耗时。

## 核心配置

```xml
<property>
  <name>hive.metastore.uris</name>
  <value>thrift://metastore-1:9083,thrift://metastore-2:9083</value>
  <description>远程 Metastore 地址；客户端必须能解析主机名并通过认证</description>
</property>

<property>
  <name>hive.server2.thrift.port</name>
  <value>10000</value>
  <description>HiveServer2 Binary Thrift 监听端口</description>
</property>

<property>
  <name>hive.execution.engine</name>
  <value>tez</value>
  <description>执行引擎；生产值必须与当前 Hive 版本和发行版支持矩阵一致</description>
</property>

<property>
  <name>hive.exec.dynamic.partition.mode</name>
  <value>strict</value>
  <description>严格模式要求至少一个静态分区，降低误写大量分区的风险</description>
</property>
```

配置优先级可能来自 `hive-site.xml`、会话 `SET`、启动参数和发行版管理平台。排障先打印有效值，不要只看某一份文件。

## 常用命令字典

| 命令 | 作用 | 关键观察 | 常见坑 |
|---|---|---|---|
| `beeline -u <jdbc-url>` | 连接 HiveServer2 | 认证、连接耗时、提示符 | 把本地 CLI 与远程服务混淆 |
| `SHOW DATABASES` | 查看库 | 当前账号可见范围 | 权限会过滤结果 |
| `SHOW TABLES IN aiops` | 查看表 | 表名与数据库 | 连接到了错误环境 |
| `DESCRIBE FORMATTED table` | 查看表结构和 Location | 类型、分区、格式、路径 | 输出长，要保存证据 |
| `SHOW PARTITIONS table` | 查看已注册分区 | 分区值 | 文件存在不代表分区已注册 |
| `EXPLAIN FORMATTED ...` | 查看计划 | 裁剪、Join、阶段 | 不等于实际耗时 |
| `ANALYZE TABLE ...` | 收集统计信息 | 行数、列统计 | 对大表有扫描成本 |
| `SET key` | 查看有效配置 | 会话实际值 | 不要随意改生产会话全局参数 |

## 入门实验：HiveServer2 与分区聚合

### 实验边界

只使用本机 Docker 和临时容器，不连接生产 Metastore，不挂载生产数据。官方镜像标签会变化；执行前到 Hive 下载页核对当前版本。

### 启动

```powershell
docker run --detach `
  --name hive-lab `
  --publish 10000:10000 `
  --publish 10002:10002 `
  --env SERVICE_NAME=hiveserver2 `
  apache/hive:4.2.0

docker logs --follow hive-lab # 看到 HiveServer2 启动完成后按 Ctrl+C 退出日志跟随
```

### 进入 Beeline

```powershell
docker exec -it hive-lab `
  /opt/hive/bin/beeline -u 'jdbc:hive2://localhost:10000/default'
```

`-it` 会为 Beeline 分配交互终端。Hive 4.2.0 镜像中的 JLine 在无终端批处理环境里可能报 `Unable to create a terminal`；自动化脚本可使用 `docker exec -t` 配合 Beeline 的 `-f` 文件参数，并始终检查退出码。

在 Beeline 中执行前面的建库、建表、写入与聚合 SQL，再执行：

```sql
SHOW PARTITIONS aiops.alerts;                                -- 应看到 dt=2026-07-23
DESCRIBE FORMATTED aiops.alerts;                             -- 记录表类型、格式和 Location
```

### 验证

保存三类证据：聚合结果、`SHOW PARTITIONS` 输出和 `DESCRIBE FORMATTED` 中的 Location。三者分别证明 SQL、元数据和数据位置正常。

### 如果没成功

1. `docker version` 是否同时显示 Client 和 Server。
2. `docker logs hive-lab` 是否有 Metastore Schema 或端口错误。
3. `Get-NetTCPConnection -LocalPort 10000` 是否存在冲突。
4. Beeline JDBC URL 是否写成容器内的 `localhost:10000`。
5. 镜像标签是否仍存在，代理是否允许访问 Docker Hub。

## 故障注入实验：停止 HiveServer2

### 建立基线

先确认 `SELECT COUNT(*) FROM aiops.alerts;` 能返回 3，并保存时间和 Query ID。

### 注入故障

```powershell
docker stop hive-lab # 仅停止本地实验容器
Test-NetConnection localhost -Port 10000 -InformationLevel Quiet
```

端口探针预期返回 `False`，同时 `docker ps -a --filter name=hive-lab` 应显示 `Exited`。如果宿主机或另一个客户端容器已安装 Beeline，也可再次连接并保存连接拒绝或超时；不要在已停止的 `hive-lab` 内执行 `docker exec`，那只能证明容器已停止，不能产生 JDBC 客户端证据。

### 假设、修复与验证

假设是 HiveServer2 不可用，而不是表被删除。执行：

```powershell
docker start hive-lab
docker logs hive-lab | Select-Object -Last 80
Test-NetConnection localhost -Port 10000 -InformationLevel Quiet
```

等待端口探针恢复为 `True`，再连接并查询 `COUNT(*)`。如果数据仍为 3，说明本次故障影响服务可用性，没有破坏实验数据。生产环境还要验证负载均衡摘除、会话重连、执行中查询和 Metastore 是否独立可用。

### 清理

```powershell
docker rm --force hive-lab # 删除本地实验容器；不要对生产容器照搬
```

## 性能与容量

### 小文件

每个文件都带来 NameNode 元数据、对象存储请求、任务调度和打开文件成本。治理顺序：先定位上游为什么产生小文件，再通过合理分区、批量写入、Compaction 或重写合并，最后验证扫描文件数和查询耗时。

### 分区数量

分区太粗会扫描过多，太细会放大 Metastore 对象数和文件数。按查询条件、写入频率、保留策略和单分区数据量设计，不要机械地“按小时分区”。

### 数据倾斜

某个 key 占据大部分行时，一个 Reducer/Task 会成为长尾。证据包括单 Task 输入远高于平均值、Shuffle Read 集中、阶段迟迟不结束。修复可能是过滤异常值、预聚合、Map Join、拆分热点或加盐，必须验证结果语义。

### 统计信息

过期统计信息会让 CBO 误判表大小、NDV（Number of Distinct Values，不同值数量）和 Join 顺序。收集统计前评估扫描成本，收集后对比 EXPLAIN，不要把 `ANALYZE` 当万能调优。

## ACID 与 Compaction

Hive ACID 使用事务元数据、Write ID、base/delta/delete_delta 文件和 Compaction 协作。它能支持行级变更，但会引入更多文件、锁、事务清理和兼容性要求。

排查 ACID 表：

1. 确认表属性和客户端是否支持事务。
2. 查看 open/aborted transaction 与 lock。
3. 查看 Compaction 队列、失败记录和 Worker。
4. 检查 delta 文件数量、Metastore 和存储权限。
5. 修复服务和配置后再决定是否重跑 Compaction，不能直接删除 delta。

## 高可用设计

- HiveServer2 多实例放在负载均衡后，健康检查要验证可登录和执行轻量 SQL。
- Metastore 多实例共享受支持的高可用后端数据库；服务无状态不代表数据库无状态。
- 元数据库做备份、PITR 和恢复演练，并与数据快照保持恢复点关系。
- YARN/Tez、HDFS、ZooKeeper、Kerberos/KDC 也要有各自的 HA 设计。
- 查询历史、审计和日志进入独立可观测平台，避免服务故障时证据一起丢失。

## 安全

- Kerberos 解决“你是谁”，Ranger/Sentry 类策略解决“你能访问什么”；具体能力取决于发行版。
- HiveServer2 禁止匿名公网暴露，启用 TLS、强认证和最小权限。
- 表权限之外还要检查 HDFS/对象存储权限，避免绕过 SQL 直接读文件。
- UDF、`ADD JAR`、外部表 Location 和导出路径需要管控。
- SQL、审计日志和查询结果可能含账号、路径和业务数据，进入 GitHub 前必须脱敏。

## 可观测性与 AIOps

### 关键指标

- HiveServer2 活跃/排队 Session 与 Operation。
- SQL 编译时间、执行时间、成功率和取消率。
- Metastore 请求延迟、错误率、连接池使用率。
- YARN 队列等待、Container 失败和 Tez DAG 阶段耗时。
- 扫描字节、扫描文件数、Shuffle、输出行数和长尾 Task。
- ACID open transaction、aborted transaction、Compaction backlog。

### 关联模型

```text
query_id + user + queue + database + table + partition
  + hs2_instance + metastore_instance
  + yarn_application_id + tez_dag_id
  + deployment_id + config_version
```

AIOps 可以基于这些字段识别慢查询模式、元数据热点、文件数异常、数据倾斜和变更回归，但自动 Kill 查询、改队列或重写表都需要审批、影响评估和回滚。

## 常见故障排查

### 无法连接 HiveServer2

按 DNS/TCP/TLS/Kerberos/JDBC URL/HiveServer2 进程/负载均衡顺序检查。连接失败与 SQL 执行失败不是同一层。

### 查询长期排队

看 YARN Queue 容量、用户配额、AM 资源、并发限制和上游大作业。不要仅重启 HiveServer2，因为任务可能根本没获得资源。

### 查询突然变慢

对比数据量、分区裁剪、文件数、计划、统计信息、Task 分布和最近变更。先找变化，再调参数。

### `Table not found` 或分区缺失

确认环境、Database、Catalog、Metastore URI、账号权限和分区注册。文件存在不等于 Metastore 已登记。

### Metastore 超时

关联 Thrift 延迟、后端数据库连接/锁/慢 SQL、GC、线程池和网络。扩大连接池前先确认数据库承载能力。

### 写入产生大量小文件

查上游并发、动态分区、每批数据量和重试；合并只是补救，根因通常在写入粒度。

## 升级与回滚

1. 盘点 Hive、Java、Hadoop、Tez、Metastore DB、JDBC Driver、UDF 和客户端。
2. 备份 Metastore 并验证恢复，保存配置、权限和关键表清单。
3. 在测试环境运行 Schema Upgrade 与兼容性查询。
4. 对核心 SQL 做结果、计划、性能和权限回归。
5. 先灰度客户端或服务实例，观察错误率和延迟。
6. 明确 Metastore Schema 升级是否可逆；不可逆时回滚依赖数据库恢复和停写窗口。

## 生产事故题：日报查询全部超时

现象：HiveServer2 可连接，所有日报 SQL 都卡在编译后等待，Metastore 正常。

处理主线：

1. 控制影响：暂停低优先级批任务，保留失败 Query ID。
2. 收集证据：YARN 队列、AM 申请、Tez DAG、资源使用和最近调度配置变更。
3. 形成假设：队列资源耗尽、AM 上限、节点故障或单个大作业挤占。
4. 验证：对比故障前后队列指标与应用状态，不把“SQL 已编译”误判为 Hive 正在扫描。
5. 修复：恢复正确队列配置、释放异常任务或扩容，并逐步恢复流量。
6. 回滚：若变更无效，回退调度配置；验证新旧作业都能分配资源。

## 系统设计题

为每天 20 TB 日志设计 Hive 离线分析平台，要求 T+1 报表 8 点前完成，元数据和查询入口无单点。

答题至少覆盖：数据进入、分区、ORC/Parquet、压缩、小文件治理、HDFS/对象存储、双 HiveServer2、双 Metastore、元数据库 HA、Tez/YARN 队列、Kerberos/权限、统计信息、SLA 指标、备份恢复、升级回滚和成本模型。

## 选型取舍

- Hive：适合数据湖表管理、批量 SQL、Metastore 生态和成熟 Hadoop 集成。
- Spark SQL：适合通用 DAG、复杂 ETL、机器学习前处理和批流一体应用。
- Trino/Presto：更强调多数据源交互式 SQL，运维模型和事务能力不同。
- HBase：适合按 RowKey 的低延迟随机读写，不适合大范围扫描聚合替代 Hive。
- 传统数据库：适合事务、索引点查和高并发业务请求，不应把全部 OLTP 搬到 Hive。

## 面试怎么讲

### 30 秒版本

Hive 给 HDFS 或对象存储上的数据提供表、元数据和 SQL。查询从 HiveServer2 进入，经过解析、Metastore 查询和 CBO 优化，再由 Tez/YARN 等执行引擎读取 ORC/Parquet。生产排障要区分连接、编译、元数据、排队、扫描和 Shuffle，并重点治理分区、小文件、倾斜、统计信息和 Metastore 高可用。

### 3 分钟版本

1. 先说明 Hive 不是 OLTP 数据库，数据和元数据分离。
2. 画出 Client、HiveServer2、Metastore、Optimizer、Tez/YARN、HDFS 路径。
3. 解释 Managed/External、Partition/Bucket、ORC/Parquet。
4. 解释分区裁剪、统计信息、Join 和倾斜。
5. 说明 ACID、delta、Compaction 和锁的成本。
6. 说明 HS2/HMS/元数据库/HDFS/YARN 的端到端 HA。
7. 用 Query ID、Application ID、扫描字节和 Task 长尾构建证据链。

## 递进面试题

### 1. Hive 的数据到底存在哪里

**定义：** 通常在 HDFS、对象存储或表格式管理的数据文件中，Metastore 保存描述这些数据的元信息。

**追问：** 只恢复 Metastore 会怎样？表定义可能回来，但数据文件若丢失仍无法查询；只恢复数据则可能缺表、分区和权限元数据。

### 2. 分区和分桶有什么区别

**定义：** 分区通常映射目录并用于裁剪，分桶按哈希把行分到固定文件集合。

**追问：** 为什么分区越多不一定越好？因为会放大 Metastore 对象、小文件、规划时间和维护成本。

### 3. 小文件为什么慢

**机制：** 文件打开、元数据、对象请求和 Task 调度成本相对数据读取变大。

**追问：** 怎么证明？比较文件数量、平均文件大小、Task 数、扫描字节与耗时，不能只看 HDFS 总容量。

### 4. Hive SQL 慢怎么定位

**答案主线：** Query ID -> 编译/Metastore -> YARN 排队 -> 扫描和裁剪 -> Shuffle/Join -> 长尾 Task -> 写出结果 -> 变更对比。

### 5. Metastore 怎样高可用

多个 Metastore 服务实例共享高可用后端数据库，客户端配置多个 URI，并对数据库、Schema 升级、连接池、认证和备份恢复做完整设计。

## 学习检查清单

- [ ] 我能区分 Hive、HiveServer2、Metastore、Tez、HDFS 和 Spark SQL。
- [ ] 我能画出 SQL 从客户端到执行结果的数据路径。
- [ ] 我能解释 Managed/External、Partition、Bucket、ORC 和 Parquet。
- [ ] 我能用 EXPLAIN 判断分区裁剪和 Shuffle。
- [ ] 我能完成 Docker + Beeline 建表、写入和聚合实验。
- [ ] 我能恢复 HiveServer2 停止故障并验证数据未损坏。
- [ ] 我能分析小文件、倾斜、统计信息和 Metastore 故障。
- [ ] 我能设计端到端高可用、安全、容量、升级和回滚方案。

## 学习证据

```text
hive-lab/
  README.md                    # 版本、边界、架构和实验步骤
  schema.sql                   # 建库、分区表和查询
  explain.txt                  # 脱敏执行计划
  query-result.txt             # 聚合结果
  table-metadata.txt           # DESCRIBE FORMATTED 输出
  incident-hs2-stop.md         # 故障现象、证据、恢复和复盘
  small-files-governance.md    # 文件数与治理前后对比
  production-design.md         # HA、安全、容量、升级和回滚
```

真实 JDBC URL、Kerberos Principal、表路径、账号、SQL 文本和业务数据进入 GitHub 前必须脱敏。本文能帮助你达到平台运维面试所需的 Hive 主线深度，但不能替代 SQL、Linux、Hadoop、生产项目和现场沟通训练。
