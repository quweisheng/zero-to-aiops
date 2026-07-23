# Apache HAWQ 存量运维与迁移深讲

> 学习目标：从零理解 HAWQ 的 MPP SQL、Master、Segment、Interconnect、HDFS、YARN 和 PXF 路径，能识别分布键倾斜、资源、网络、Catalog 和 HDFS 故障，能完成离线分布模拟与故障推演，并能为已退役项目制定只读盘点、风险隔离和迁移方案。

## 先说最重要的版本边界

Apache HAWQ 已于 **2024 年 7 月退休并进入 Apache Attic**。Attic 中的项目资源保留为只读历史资料，但项目不再由原 PMC 主动开发和发布安全修复。

因此本文定位是：

- 帮助接手存量 HAWQ 平台的人看懂架构和风险。
- 帮助运维人员做只读盘点、证据收集、故障分析和迁移。
- 帮助面试者解释 HAWQ、Greenplum、Hive、Spark SQL 和现代 MPP/湖仓的边界。
- **不建议把 HAWQ 作为新建生产数据平台的默认选型。**

## 官方历史资料

- [Apache Attic：HAWQ](https://attic.apache.org/projects/hawq.html)
- [Apache Attic 说明](https://attic.apache.org/)
- [HAWQ 历史官网](https://hawq.apache.org/)
- [HAWQ 历史用户指南](https://hawq.apache.org/docs/userguide/latest/index.html)
- [HAWQ Architecture](https://hawq.apache.org/docs/userguide/2.2.0.0-incubating/overview/HAWQArchitecture.html)
- [HAWQ 历史源码](https://github.com/apache/hawq)

历史文档中的版本、Hadoop、YARN、RHEL、Python、OpenSSL、PostgreSQL 兼容性可能已经过时。不要在联网生产主机上直接安装历史二进制做学习实验。

## 官方知识地图

```text
Apache HAWQ（已退休）
  -> SQL 接入：psql、JDBC、ODBC
  -> 控制：Master、Standby Master、Dispatcher、Catalog
  -> 计算：Physical Segment、Virtual Segment、Query Executor
  -> 网络：Interconnect、Motion
  -> 存储：HDFS、Append-Only Row/Column、Parquet、External Table
  -> 资源：HAWQ Resource Manager、YARN 或 Standalone
  -> 外部访问：PXF、HBase/HDFS/外部系统
  -> 运维：FTS、日志、EXPLAIN、Catalog、迁移
```

```text
基础层
  -> 知道 HAWQ 已退休及其风险
  -> 看懂 Master/Segment/HDFS/Interconnect
  -> 看懂 DISTRIBUTED BY 和 EXPLAIN Motion

进阶层
  -> 识别分布倾斜、资源与网络瓶颈
  -> 做只读资产、依赖、数据和查询盘点
  -> 设计双写/回放/校验/切换/回滚迁移
```

## 场景开场

你接手一套 2019 年建设的数据平台。监控只显示几个 `postgres` 风格进程，业务通过 JDBC 执行 SQL，数据却主要在 HDFS。原建设人员离职，文档里写着“HAWQ MPP”。

此时第一反应不应是在线升级或找最新版安装包，而应是确认项目已退役，冻结高风险变更，盘点版本、依赖、数据、查询、用户和替代方案。

## 一句话人话版

`HAWQ = 把 PostgreSQL 风格 SQL 与 MPP 并行执行放到 Hadoop/HDFS 上的历史查询引擎；现在应按遗留系统管理和迁移。`

## 小白可能会问

### Retired 是不是软件马上不能运行

不是。现有系统可能继续运行，但没有活跃项目团队提供新版本和安全修复。随着操作系统、Java、Hadoop、OpenSSL 和硬件变化，兼容与安全风险会持续扩大。

### HAWQ 是 Greenplum 吗

HAWQ 有 PostgreSQL/MPP 技术渊源和相似概念，但数据主要在 HDFS、Segment 模型和资源管理不同。不能直接把 Greenplum 升级手册用于 HAWQ。

### HAWQ 是 Hive 的替代品吗

两者都能查询 Hadoop 数据，但架构、SQL、优化器、元数据、资源和存储格式不同。迁移不是简单更换 JDBC URL。

### 为什么还要学退休项目

企业中遗留系统不会因项目退休自动消失。识别风险、稳定运行、保留证据并平滑迁移，是高级运维和架构岗位的重要能力。

## 核心架构

```text
BI / psql / JDBC
  -> HAWQ Master
       -> Parser / Optimizer / Dispatcher
       -> Global System Catalog
       -> Resource Manager -> YARN / Standalone Resource
       -> FTS 状态
  -> Interconnect
  -> Segment Hosts
       -> Virtual Segment
       -> Query Executor for each Slice
       -> 直接读取 HDFS 数据
  -> Motion 交换中间数据
  -> Master 汇总结果
  -> Client
```

### Master

**是什么：** SQL 入口和控制核心，处理连接、解析、优化、分发和结果协调，并保存 Global Catalog。

**为什么需要：** MPP 查询必须生成全局计划、分配资源并协调多个 Segment。

**怎么工作：** Master 把计划拆成 Slice，Dispatcher 将其发送到选定 Segment，最后汇总结果。

**怎么看：** 连接、Master 日志、Catalog、Query 状态、EXPLAIN 和资源队列。

**坏了怎么查：** 先确认 Master/Standby、Catalog、文件系统、端口、连接和最近变更；不要把 Segment 都在线等同于 SQL 入口可用。

### Physical Segment 与 Virtual Segment

历史架构中每个主机通常有一个 Physical Segment。查询按成本、资源、数据本地性选择 Virtual Segment 数；每个 Slice 在相应 Virtual Segment 上运行 Query Executor。

Segment 被描述为相对无状态，用户数据在 HDFS，但这不代表 Segment 故障没有影响：运行中 Query、网络连接、缓存和资源都会中断。

### Interconnect 与 Motion

Interconnect 是 Segment 间交换数据的网络层。历史文档描述默认 UDP Interconnect，并由 HAWQ 实现额外可靠性。Motion 是执行计划中的数据重新分布节点，例如按 Join Key 重分布。

网络丢包、乱序、MTU、队列和热点 Motion 都可能表现为 SQL 长尾。旧协议实现也增加了现代网络与安全审计难度。

### Resource Manager

HAWQ 可与 YARN 集成，也有历史 Standalone 资源管理模式。它按查询成本、Queue、数据本地性和当前使用分配 Virtual Segment。

“集群 CPU 空闲”不代表查询能获得资源；可能是 Queue、YARN Container、内存限制或并发策略阻止分配。

### Catalog、FTS 与 Standby

- Catalog 保存表、类型、权限、数据位置和系统元数据。
- FTS（Fault Tolerance Service）接收 Segment 心跳并检测故障。
- Standby Master 用于 Master 故障恢复，但切换、Catalog 同步和客户端重连必须演练。

## 一次查询的数据路径

```text
1. Client 连接 Master 并提交 SQL
2. Master 解析并访问 Catalog
3. Optimizer 选择扫描、Join、聚合和 Motion
4. Resource Manager 获取资源与 Virtual Segment
5. Dispatcher 把 Slice 发送到 Segment
6. Query Executor 读取 HDFS/External 数据
7. Segment 通过 Interconnect 交换中间结果
8. Master 汇总并返回 Client
```

慢查询必须分层：连接、解析/Catalog、资源等待、HDFS 读取、单 Segment 倾斜、Motion 网络、外部表/PXF、Master 汇总。

## 数据分布

```sql
CREATE TABLE alert_fact (
  alert_id BIGINT,                                      -- 告警唯一编号
  service_name TEXT,                                    -- 服务名称
  severity TEXT,                                        -- 告警级别
  event_time TIMESTAMP                                  -- 事件时间
)
WITH (
  appendonly = true,                                    -- 历史分析表采用追加优化存储
  orientation = column,                                 -- 列方向存储，适合分析扫描
  compresstype = snappy                                 -- 压缩算法必须与版本能力核对
)
DISTRIBUTED BY (alert_id);                              -- 按 alert_id 哈希分布到 Segment
```

`DISTRIBUTED BY` 决定同一分布键落到哪个 Segment。若选择低基数字段，例如只有三种值的 `severity`，可能让少数 Segment 承担大部分数据。

### Random Distribution

随机分布可让写入更均衡，但需要按业务 Key Join 时更容易产生 Motion。选择要看查询和数据分布。

### Hash Distribution

同 Key 稳定落到同一分布位置，有利于共置 Join，但热点/低基数会造成倾斜。

### Append-Only Row 与 Column

- Row：整行读取和某些写入模式更自然。
- Column：只读部分列、压缩和分析聚合更有利。

历史格式兼容性是迁移重点。目标平台是否能直接读取，必须通过实际文件、Schema 和样本验证。

## EXPLAIN 怎么看

```sql
EXPLAIN
SELECT service_name, COUNT(*)
FROM alert_fact
WHERE event_time >= TIMESTAMP '2026-07-23 00:00:00'
GROUP BY service_name;
```

重点关注：

- Scan 读取哪些表、分区和外部数据。
- Motion 类型和重新分布 Key。
- 每个 Slice 的并行度和 Virtual Segment。
- Join 顺序、广播/重分布和聚合位置。
- 估算行数与真实行数差异。

`EXPLAIN ANALYZE` 会实际运行 SQL，生产大查询有资源和副作用风险；默认先用 `EXPLAIN`。

## PXF 与外部数据

PXF（Platform Extension Framework）让 HAWQ 访问 HDFS、HBase 和其他外部系统。外部表故障可能来自：PXF 服务、Profile、Schema、网络、目标系统、权限或数据格式。

迁移时必须盘点每张 External Table 的协议、Location、Formatter、Credential 和依赖版本，不能只导出 Catalog DDL。

## 存量环境只读命令

以下命令也要先确认账号权限和版本。`hawq start/stop`、Master 切换、Catalog 修复和数据移动不属于只读检查。

```bash
hawq version                         # 查看客户端/安装版本，确认是否与服务端一致
hawq state -a                        # 查看 Master、Standby 和 Segment 状态；不同版本参数可能不同
hawq config -s hawq_rm_type          # 读取资源管理模式，不修改配置
psql -d postgres -c 'SELECT version();' # 从 SQL 层确认服务版本
```

```sql
SELECT current_database(), current_user;              -- 确认当前环境和账号
SELECT version();                                     -- 保存服务端版本证据
SHOW hawq_rm_type;                                    -- 查看资源管理模式
EXPLAIN SELECT COUNT(*) FROM target_table;            -- 只生成计划，不执行大扫描
```

读取 Catalog 视图前先查目标版本官方文档。不要从其他 PostgreSQL/Greenplum 版本复制修复 SQL 写系统表。

## 配置与日志重点

盘点至少包括：

- Master/Standby 主机、数据目录、端口和 Catalog 保护。
- Segment 主机、网卡、Interconnect、临时目录和文件句柄。
- HDFS NameService、认证、Short-circuit/Data Locality 相关配置。
- YARN/Standalone Resource Manager、Queue、内存和并发。
- PXF Server、Profile、Connector、JDBC Driver 和 Credential。
- `hawq-site.xml`、环境变量、启动脚本和发行版管理配置。
- Master、Segment、FTS、YARN、HDFS 和 PXF 日志保留。

## 为什么不提供“新装 HAWQ”实验

HAWQ 已进入 Apache Attic。为了学习而下载并运行不再维护的服务端，会引入已知和未知安全风险，也容易让小白误以为它仍适合新建平台。

本文改用两个安全实验：

1. 离线模拟 MPP 数据分布，理解倾斜。
2. 基于历史计划和只读信息制作迁移盘点，不连接生产。

这不是实际 HAWQ 运行证明，学习证据必须如实标注“offline simulation”。

## 入门实验：离线计算 Segment 倾斜

### 准备 CSV

`segment-rows.csv`：

```csv
segment_id,row_count
0,100000
1,98000
2,102000
3,100000
```

### PowerShell 脚本

```powershell
$rows = Import-Csv .\segment-rows.csv
$counts = $rows | ForEach-Object { [double]$_.row_count }

$total = ($counts | Measure-Object -Sum).Sum             # 全部 Segment 行数
$average = $total / $counts.Count                        # 理想平均行数
$maximum = ($counts | Measure-Object -Maximum).Maximum   # 最忙 Segment 行数
$ratio = if ($average -eq 0) { 0 } else { $maximum / $average }

[pscustomobject]@{
  segment_count = $counts.Count
  total_rows = [long]$total
  average_rows = [math]::Round($average, 2)
  max_rows = [long]$maximum
  skew_ratio = [math]::Round($ratio, 2)
  status = if ($ratio -ge 2) { 'critical' } elseif ($ratio -ge 1.5) { 'warning' } else { 'balanced' }
} | Format-List
```

预期 `skew_ratio` 接近 1，状态为 `balanced`。阈值只是实验规则，生产要结合数据量、查询、硬件和 SLA 定义。

## 故障注入实验：制造分布键热点

把 CSV 改成：

```csv
segment_id,row_count
0,900000
1,30000
2,35000
3,35000
```

重跑脚本，预期 `skew_ratio` 大于 2 并标记 `critical`。

### 证据与假设

- 现象：单 Segment 数据量远高于平均。
- 假设：分布键基数低、热点值集中或数据装载逻辑变化。
- 验证：检查键频率、DDL `DISTRIBUTED BY`、加载批次和 EXPLAIN Motion。
- 修复候选：选择更均匀且符合 Join 的分布键、重分布数据、拆热点或迁移时重写模型。
- 风险：重分布是大规模读写操作，会占用 HDFS、网络和临时空间。

恢复原 CSV，确认状态回到 `balanced`。这一步模拟的是证据判断，不允许拿脚本结果替代真实 Segment 和 Query 指标。

## 资产盘点实验

创建 `hawq-inventory.csv`：

```csv
object_type,name,owner,storage,dependency,criticality,migration_status
table,alert_fact,aiops,AO_COLUMN,HDFS,P1,not_started
external_table,raw_alerts,etl,PXF,HDFS_JSON,P1,blocked
view,daily_alert_summary,reporting,CATALOG,alert_fact,P2,not_started
udf,normalize_service,analytics,C_LIBRARY,libnormalize.so,P1,blocked
```

盘点必须覆盖 Table/View/External Table/UDF、数据量、更新频率、查询、用户、权限、调度、BI、Connector 和保留期限。真正迁移最容易漏的是 UDF、外部表、脚本和下游报表。

## 高可用与风险边界

历史 HAWQ 可配置 Standby Master，Segment 故障可被 FTS 检测并从资源集合移除；数据依赖 HDFS 的可靠性。但端到端仍有单点/风险：

- Client/VIP/DNS 是否能切换到 Standby。
- Catalog 同步和故障切换是否真实演练。
- HDFS、YARN、ZooKeeper/Kerberos 是否高可用。
- PXF 和外部数据源是否单点。
- 老旧操作系统、库和驱动是否存在无法修复漏洞。
- 备份是否包含 Catalog、配置、权限和外部依赖。

退役项目的“HA”只能降低硬件故障，不能解决社区停止维护和安全补丁缺失。

## 容量与性能

### 分布倾斜

比较 Segment 行数、扫描字节、CPU、内存、临时空间和执行时长。平均值正常时，最大值仍可能决定 Query 完成时间。

### Motion 与网络

大 Join/聚合可能通过 Motion 重分布。网络带宽、丢包、MTU、交换机队列和单 Key 倾斜都会放大长尾。

### HDFS 与本地临时空间

数据在 HDFS，但排序、Hash、Spill 和日志仍会使用本地资源。HDFS 健康不代表 Segment 临时盘充足。

### Master

解析、Catalog、优化和结果汇总集中在 Master。过多并发连接、复杂 SQL、Catalog 膨胀和大结果返回会形成控制面/入口瓶颈。

## 安全

- 退役软件应隔离网络、限制账号和端口，禁止公网暴露。
- 盘点 Kerberos、SSL、JDBC/ODBC、Role、HDFS 和 PXF Credential。
- 历史 OpenSSL、Python、JDK、C/C++ 依赖进入漏洞清单。
- 不能通过“系统太旧改不了”无限接受风险；要有例外审批、补偿控制和退出日期。
- Catalog Dump、DDL、日志和 EXPLAIN 可能泄露内部数据模型，公开前脱敏。

## 可观测性与 AIOps

重点证据：

- Master 连接、查询并发、解析/优化/执行时间。
- Query 每 Slice/Segment 的行数、CPU、内存、Spill 和长尾。
- Interconnect 丢包、重传、吞吐和错误。
- Resource Manager/YARN 分配等待和拒绝。
- HDFS 读取延迟、错误和数据本地性。
- FTS 心跳、Segment 状态和恢复事件。
- PXF 延迟、错误和外部系统状态。
- 版本、漏洞、变更和迁移进度。

AIOps 在遗留系统中的首要价值不是自动重启，而是把版本风险、依赖故障、查询倾斜和迁移证据统一起来。自动执行 `hawq stop/start`、Master 切换或 Catalog 修复必须禁止无审批触发。

## 常见故障排查

### 无法连接 Master

检查 DNS/VIP、端口、Master/Standby、认证、Catalog、磁盘和最近切换。不要立即在两台 Master 同时启动写服务，避免双主风险。

### 查询长时间等待资源

看 HAWQ RM/YARN Queue、Virtual Segment 分配、内存、并发和队列策略。CPU 空闲可能只是资源没有被授予。

### 单个 Segment 长尾

比较分布键、行数、扫描、Spill、磁盘、网络和外部调用。重点找“最大/平均”差异。

### Interconnect 错误

关联 Segment 主机、网卡、MTU、丢包、防火墙、交换机和 Motion。改网络参数前保存包计数和错误时间线。

### PXF 外部表失败

沿 Master -> PXF -> Profile/Connector -> 外部系统检查，核对 Schema、格式、权限和版本。

### HDFS 数据可见但表查不到

检查 Catalog、表 Location、分区/外部表定义、权限和目标环境。不要直接重建 Catalog 指针覆盖原定义。

## 迁移方法

### 1. 冻结与盘点

冻结非必要升级，记录版本、拓扑、账号、数据、DDL、UDF、PXF、查询、调度、BI、SLA 和恢复能力。

### 2. 目标选型

- Greenplum：MPP/PostgreSQL 体验相近，但存储和迁移工具需验证。
- Hive/Spark SQL：适合湖上批处理与 ETL，低延迟和事务能力不同。
- Trino：适合交互式联邦查询，写入与批计算模型不同。
- 云数据仓库：托管能力强，但数据迁移、锁定和成本要评估。

没有“一键等价替代”。按查询、数据、SLA、权限、运维和成本选择。

### 3. Schema 与 SQL 转换

逐对象记录兼容性：数据类型、函数、窗口、分区、分布键、外部表、UDF、事务和权限。自动转换后必须人工审查。

### 4. 数据迁移

使用可校验的全量 + 增量方案，记录文件数、字节、行数、Checksum/聚合校验、失败重试和断点。

### 5. 双跑与验收

对核心查询比较结果、空值、浮点、时区、性能和资源；双跑期间明确写入主系统，避免双写冲突。

### 6. 切换与回滚

按调用方分批切换，保留旧 JDBC 路由和只读窗口。回滚条件必须量化：错误率、结果差异、SLA 和成本。

### 7. 下线

完成审计保留、数据销毁、账号回收、DNS/证书撤销和资产台账更新，不能“停机但永远不下线”。

## 生产事故题：查询集体变慢

现象：Master 正常，HDFS 无坏块，上午起所有 Join 查询慢 5 倍。

处理：

1. 控制新大查询并保存 SQL/Query ID/计划。
2. 比较资源等待、Virtual Segment、Motion、各 Segment 长尾和 HDFS。
3. 查看近期数据分布、网络、YARN Queue、PXF 和配置变化。
4. 验证是分布倾斜、资源限制、Interconnect 还是外部源。
5. 选择限流、回退配置、恢复网络或调整查询；大规模重分布另开变更。
6. 将事故转成迁移优先级，避免长期只靠重启维持。

## 系统设计题

公司有 500 TB HAWQ 存量数据、300 个日报 SQL、40 个 BI 用户和 20 个 UDF，要求 12 个月迁移且业务停机不超过 2 小时。

答案必须覆盖资产盘点、目标选型、数据格式、网络带宽、全量/增量、SQL/UDF 转换、权限、双跑校验、性能基线、切换批次、回滚、审计和退役下线。

## 面试怎么讲

### 30 秒版本

HAWQ 是把 PostgreSQL 风格 SQL、MPP 并行执行和 Hadoop/HDFS 结合的历史查询引擎。Master 解析优化并分发 Slice，Segment 上的 Query Executor 读取 HDFS，通过 Interconnect/Motion 交换数据。项目已在 2024 年进入 Apache Attic，所以生产重点是只读排障、风险隔离、证据盘点和迁移，不建议新建。

### 3 分钟版本

1. 先声明退休状态和安全边界。
2. 画 Master、Catalog、Resource Manager、Segment、HDFS、Interconnect、PXF。
3. 说明 DISTRIBUTED BY、Virtual Segment、Slice 和 Motion。
4. 说明倾斜、网络、YARN、HDFS 和 Master 瓶颈。
5. 说明 Standby/FTS 不能消除项目退休风险。
6. 给出盘点、双跑、校验、切换、回滚和下线方案。

## 递进面试题

### 1. HAWQ 为什么叫 MPP

查询被切成多个 Slice/QE，在多个 Segment 并行执行，并通过 Interconnect 交换中间数据。追问要说明并行度受资源、数据分布和计划约束。

### 2. Segment 无状态为什么还会故障影响查询

持久数据在 HDFS，不代表运行状态不存在；QE、网络、临时文件、缓存和当前 Query 都会丢失或重试。

### 3. 分布键怎么选

在均匀分布与共置 Join 之间权衡。低基数或热点字段会倾斜，随机分布会增加某些 Join 的 Motion。

### 4. HAWQ 和 Greenplum 是什么关系

有技术渊源和相似 MPP/SQL 概念，但存储、资源和版本不是同一产品，不能直接原地升级替代。

### 5. 为什么不能继续长期运行

可以短期风险接受，但退休项目缺安全修复和活跃治理，依赖兼容风险持续增加。必须有补偿控制、责任人、迁移里程碑和退出日期。

## 学习检查清单

- [ ] 我能说明 HAWQ 已退休及其含义。
- [ ] 我能画出 Master、Segment、HDFS、YARN、Interconnect 和 PXF。
- [ ] 我能解释 Virtual Segment、Slice、QE、Motion 和分布键。
- [ ] 我能用离线数据计算 Segment 倾斜并说明局限。
- [ ] 我能按证据分析资源、网络、HDFS、PXF 和 Catalog 故障。
- [ ] 我能设计资产盘点、双跑、校验、切换和回滚。
- [ ] 我不会把离线模拟写成真实生产 HAWQ 经验。

## 学习证据

```text
hawq-legacy-study/
  README.md                    # 明确 retired 与 offline simulation
  architecture.md             # Master/Segment/HDFS/Interconnect
  segment-rows.csv            # 脱敏模拟数据
  measure-hawq-skew.ps1       # 倾斜检测脚本
  skew-baseline.txt           # 基线结果
  incident-skew.md            # 热点故障推演
  hawq-inventory.csv          # 对象与依赖盘点模板
  migration-assessment.md     # 目标选型和兼容缺口
  cutover-rollback.md         # 切换、验证和回滚
```

不得提交真实主机、Catalog Dump、DDL、用户、JDBC URL、业务数据或漏洞细节。HAWQ 学习成果应如实标注为历史资料研究、离线模拟或脱敏存量排障；不要虚构自己实施过生产迁移。
