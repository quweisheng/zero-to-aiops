# Oracle Database 深讲

> 学习目标：理解 Oracle Database 在企业核心系统中的位置，能讲清 instance、database、CDB/PDB、schema、tablespace、datafile、redo、undo、archivelog、optimizer、AWR、RAC、Data Guard、GoldenGate、RMAN 和权限模型；能根据故障范围选择 RAC、OGG、Data Guard、Application Continuity 等高可用方案，并把它们用于 AIOps 中的核心库监控、复制延迟分析、容量预测和故障复盘。

## 官方资料

- [Oracle Database Documentation](https://docs.oracle.com/en/database/)
- [Oracle Database Concepts](https://docs.oracle.com/en/database/oracle/oracle-database/23/cncpt/)
- [SQL Language Reference](https://docs.oracle.com/en/database/oracle/oracle-database/23/sqlrf/)
- [Database Administrator's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/23/admin/)
- [Performance Tuning Guide](https://docs.oracle.com/en/database/oracle/oracle-database/23/tgdba/)
- [SQL Tuning Guide](https://docs.oracle.com/en/database/oracle/oracle-database/23/tgsql/)
- [Backup and Recovery User's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/23/bradv/)
- [Oracle Database Reference](https://docs.oracle.com/en/database/oracle/oracle-database/23/refrn/)
- [Oracle RAC Administration and Deployment Guide](https://docs.oracle.com/en/database/oracle/oracle-database/26/racad/)
- [Oracle Data Guard Concepts and Administration](https://docs.oracle.com/en/database/oracle/oracle-database/26/sbydb/)
- [Oracle GoldenGate Documentation](https://docs.oracle.com/en/database/goldengate/core/index.html)
- [Oracle GoldenGate Data Replication Components](https://docs.oracle.com/en/database/goldengate/core/26/coredoc/overview-components-data-replication-oracle-goldengate.html)
- [Oracle GoldenGate Lag Monitoring](https://docs.oracle.com/en/database/goldengate/core/26/coredoc/monitor-monitor-lag.html)
- [Oracle GoldenGate High Availability Best Practices](https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/overview-oracle-goldengate-high-availability-best-practices.html)
- [Oracle Database High Availability Overview](https://docs.oracle.com/en/database/oracle/oracle-database/26/haovw/)
- [Ensuring Application Continuity](https://docs.oracle.com/en/database/oracle/oracle-database/26/racad/ensuring-application-continuity.html)
- [Oracle Sharding Guide](https://docs.oracle.com/en/database/oracle/oracle-database/26/shard/)

说明：Oracle 是一个庞大的企业数据库体系。本文不追求覆盖所有产品线，而是先把 AIOps / 运维岗位最常遇到的数据库结构、监控指标、慢 SQL、备份恢复和高可用概念讲清楚。

版本说明：上面的核心数据库链接保留了文章原有的 23 版入口，高可用部分使用当前 26ai 官方入口。生产环境必须按实际数据库、Grid Infrastructure 和 GoldenGate 版本查认证矩阵、补丁要求与许可，不要把不同大版本的命令参数直接混用。

## 官方知识地图

Oracle 官方资料可以按下面的顺序理解：

```text
Database Concepts
  -> 实例、内存、进程和存储
  -> SQL、事务、redo、undo 和恢复
  -> 性能诊断与备份恢复
  -> RAC 本地多节点高可用
  -> Data Guard 异地灾备
  -> GoldenGate 逻辑复制与数据流动
  -> Application Continuity 客户端故障透明
  -> MAA 组合架构与运行规范
```

本文先讲单库基础，再讲 RAC 和 OGG 的工作机制，最后把不同高可用方案放进同一张选型图。重点是让你能回答三个问题：故障发生在哪一层、数据最多可能丢多少、业务多久能恢复。

## 场景开场

你接到一个核心业务告警：

```text
service=payment-api
symptom=接口超时
database=oracle-prod
duration=15m
```

应用日志只看到 `ORA-` 错误和连接池等待。业务同事问：是不是数据库挂了？DBA 问：是不是应用突然放大了 SQL 并发？值班的人需要先把问题拆开：

- 实例是否还活着？
- 会话数是否暴涨？
- 等待事件集中在哪一类？
- 慢 SQL 是新出现的，还是老 SQL 计划变了？
- 表空间是否满了？
- redo / archive 是否堆积？
- 最近是否有发布、统计信息刷新、索引变更或批处理任务？

Oracle 的学习价值就在这里：它经常承载企业最核心的数据，一旦抖动，上层服务会连锁超时。AIOps 不能只看应用错误率，还要把数据库等待、SQL、容量、备份、变更和业务链路关联起来。

## 一句话人话版

Oracle Database 是企业级关系型数据库，擅长事务、复杂 SQL、高可用、备份恢复和性能诊断；在 AIOps 里，它是核心业务事实和故障证据的重要来源。

## 小白可能会问

- RAC 有两个实例，是不是数据也自动有两份？
- OGG 把数据复制到另一套库，是不是就等于完整灾备？
- RAC、Data Guard 和 OGG 都叫高可用，为什么经常一起部署？
- 数据已经同步了，应用为什么仍然可能切不过去？

## 为什么要学 Oracle

很多传统行业、金融、制造、政企系统仍然大量使用 Oracle。AIOps 工程师不一定要替代 DBA，但至少要读懂这些信号：

- `ORA-` 错误码。
- session、process、connection pool。
- tablespace、datafile、undo、redo。
- wait event、AWR、ASH。
- SQL execution plan。
- backup、archive log、recovery point。
- RAC、Data Guard、主备切换。

不会 Oracle，遇到企业核心库问题时就只能看到“应用超时”。会一点 Oracle，至少能判断是连接池、锁等待、慢 SQL、空间、归档、网络还是主备切换引发的故障。

## 核心概念

### Database 和 Instance

Oracle 里常说的 database 和 instance 不是一回事：

| 概念 | 人话解释 |
|---|---|
| database | 磁盘上的数据文件、控制文件、redo log 等持久化数据 |
| instance | 内存结构和后台进程，用来访问 database |

排障时要分清：

- instance 挂了，连接会失败。
- datafile / control file 出问题，数据库可能无法打开。
- redo / archive 出问题，事务和恢复能力会受影响。

### CDB 和 PDB

现代 Oracle 使用多租户架构：

| 概念 | 含义 |
|---|---|
| CDB | Container Database，容器数据库 |
| PDB | Pluggable Database，可插拔数据库 |
| root | CDB 的根容器 |
| seed | 创建 PDB 的模板 |

对运维来说，先知道一件事：连接串、用户、权限、对象和监控数据可能属于不同 PDB。查问题时不要只看 CDB 层，也要看具体业务 PDB。

### Schema 和 User

Oracle 里 schema 通常和 user 绑定。一个用户拥有的表、索引、视图、过程等对象组成 schema。

常见排障点：

- 应用用户是否被锁。
- 密码是否过期。
- 权限是否缺失。
- 对象是否在错误 schema 下。
- synonym 是否指向错误对象。

### Tablespace 和 Datafile

Oracle 用 tablespace 组织逻辑存储，用 datafile 落到磁盘。

```text
tablespace
  -> datafile01.dbf
  -> datafile02.dbf
```

空间类告警常见原因：

- datafile 无法自动扩展。
- 磁盘满。
- 临时表空间被大 SQL 打满。
- undo 表空间压力过大。
- archive log 占满归档目录。

### Redo、Undo 和 Archive Log

| 概念 | 用途 |
|---|---|
| redo | 记录数据变更，用于崩溃恢复 |
| undo | 支持回滚和一致性读 |
| archive log | redo 归档，用于备份恢复和主备同步 |

如果 archive log 堆满，数据库可能无法继续正常写入。这类问题在 AIOps 中应该被当作强信号，而不是普通磁盘告警。

### Optimizer 和执行计划

Oracle 会根据统计信息和 SQL 结构选择执行计划。慢 SQL 常见原因：

- 没有合适索引。
- 统计信息过期。
- SQL 写法导致全表扫描。
- 绑定变量选择性变化。
- 执行计划突然变化。
- 并发导致锁等待或资源争用。

定位慢 SQL 时不要只看 SQL 文本，也要看执行计划、等待事件、数据量、统计信息和最近变更。

## 架构和数据流

```text
application
  |
  v
listener
  |
  v
Oracle instance
  |
  +--> SGA / PGA
  +--> background processes
  +--> redo log
  +--> undo tablespace
  +--> datafiles
  +--> control files
  +--> archive logs
```

高可用场景还会出现：

```text
primary database
  |
  | redo transport
  v
standby database

RAC:
instance A + instance B + shared storage
```

第一阶段不用把 RAC 和 Data Guard 的全部细节背下来，但要能听懂：RAC 解决多实例访问和高可用，Data Guard 解决主备灾备和数据保护。

## Oracle 高可用全景：先判断故障发生在哪一层

高可用不是“多装一台数据库”这么简单。设计前先记住两个指标：

| 指标 | 全称 | 人话解释 |
|---|---|---|
| RTO | Recovery Time Objective，恢复时间目标 | 故障后业务最多可以中断多久 |
| RPO | Recovery Point Objective，恢复点目标 | 恢复后最多可以接受丢失多长时间的数据 |

一个完整方案至少要同时考虑四层：

```text
应用层：连接能否发现故障、重连并安全重放请求
  -> 数据库服务层：实例或节点故障后，服务能否在别处继续
  -> 数据保护层：机房、存储或数据库损坏后，是否还有可用副本
  -> 恢复层：误删、逻辑错误和副本同时受损时，能否回到正确时间点
```

### 常见方案选型矩阵

| 方案 | 主要解决什么 | 核心机制 | 单独使用时解决不了什么 |
|---|---|---|---|
| Oracle Restart | 单机上的监听、实例、ASM 等进程异常退出 | 监控资源并自动重启 | 整台主机或机房故障 |
| RAC One Node | 单实例在集群节点间迁移或接管 | Clusterware 管理一个活动实例 | 多实例并发扩展；共享存储故障 |
| RAC | 同机房内实例或节点故障，并提供横向处理能力 | 多个实例访问同一数据库，服务在节点间转移 | 共享存储损坏、逻辑误操作、区域级灾难 |
| Data Guard | 整库的数据保护和异地灾备 | 传输并应用 redo，维护主库和备库角色 | 异构复制、按表转换数据、客户端请求自动恢复 |
| Active Data Guard | 在 Data Guard 基础上让物理备库承担只读、备份等工作 | 备库只读打开时持续应用 redo | 双边任意写入；它有独立许可要求 |
| GoldenGate（OGG） | 低延迟逻辑复制、异构同步、迁移和数据分发 | 从事务日志捕获已提交变更，经 trail 传输并在目标重放 | 数据库实例自动接管、应用连接自动切换、所有对象无条件复制 |
| Application Continuity / TAC / FAN | 数据库切换后减少应用报错和事务不确定性 | 故障通知、连接清理、会话恢复和安全请求重放 | 创建数据副本或替代 RAC、Data Guard |
| Sharding + Data Guard | 超大规模数据的水平拆分、故障隔离和跨地域部署 | 数据分片到独立数据库，每个 shard 再做主备保护 | 无改造地兼容所有跨分片事务与查询 |
| RMAN + Flashback | 介质损坏、误删和逻辑错误后的恢复 | 备份恢复、增量恢复、时间点回退 | 秒级自动接管；它们是最后恢复防线，不是流量切换组件 |

这张表最重要的结论是：RAC、Data Guard、OGG 和 Application Continuity 不是互斥替代品，它们通常保护不同故障层。

许可也是架构的一部分。RAC、Active Data Guard、GoldenGate、Sharding 等能力的许可和云服务计费并不相同，设计评审时要让采购、Oracle 合同负责人和技术团队一起确认，不能只根据“数据库里能看到某个参数”判断可以使用。

## RAC 深讲

RAC 的全称是 Oracle Real Application Clusters。你可以把它理解成“多个 Oracle 实例共同打开同一套数据库文件”。

### RAC 为什么存在

单实例数据库有一个明显风险：实例所在主机失效时，即使磁盘数据完好，业务也要等实例在别处启动。RAC 让其他节点上的实例已经处于运行状态，应用服务可以转移过去，同时还可以把不同服务分布到不同实例上。

RAC 主要解决：

- 数据库实例和服务器节点不再是单点。
- 多台服务器可以共同承担连接和 SQL 处理。
- 计划维护时可以先迁移服务、排空连接，再维护单个节点。

RAC 不直接解决：

- 共享存储整体不可用。
- 错误 SQL 把数据删掉。
- 数据库块损坏或整个机房不可用。
- 应用驱动不会重连，或者事务失败后不知道能否重试。

### RAC 怎么工作

```text
客户端
  -> SCAN listener
  -> 动态数据库 service
  -> instance 1（节点 1，自己的 SGA / PGA / undo / redo thread）
  -> instance 2（节点 2，自己的 SGA / PGA / undo / redo thread）

instance 1 <-> private interconnect <-> instance 2
              Cache Fusion

所有实例
  -> 共享 datafiles / control files / online redo
  -> 常见存储管理方式：ASM
```

第一次接触 RAC，需要先认识这些词：

| 术语 | 人话解释 | 坏了会看到什么 |
|---|---|---|
| Clusterware | 管理节点成员、VIP、监听、数据库、实例和 service 的集群软件 | 资源离线、反复重启、节点被驱逐 |
| SCAN | Single Client Access Name，给客户端使用的集群统一入口名 | 新连接无法找到可用监听或解析异常 |
| VIP | Virtual IP，节点故障时帮助连接更快收到失败并改连其他地址 | 连接长时间卡在网络超时 |
| service | 应用连接的逻辑服务名，可分配首选实例和可用实例 | 实例活着，但某个业务仍连接失败 |
| interconnect | RAC 节点间的私有高速网络 | `gc` 等待升高、性能抖动、极端时节点驱逐 |
| Cache Fusion | 节点间直接传递需要的数据块，协调各实例缓存 | 热块争用、跨实例访问过多、`gc` 等待升高 |
| ASM | Automatic Storage Management，Oracle 的卷与磁盘组管理能力 | 磁盘组空间不足、磁盘离线、数据库文件不可访问 |
| OCR / voting files | 保存集群配置和判断节点成员关系的关键文件 | Clusterware 启动失败或节点成员异常 |

### RAC 安装与启动边界

生产 RAC 不是适合用一个容器命令模拟的组件。完整部署至少需要经过这些阶段：

```text
认证过的操作系统、网络和共享存储
  -> 每个节点准备 public、private interconnect 和 SCAN 网络
  -> 安装 Grid Infrastructure（Clusterware + ASM）
  -> 在所有节点安装兼容版本的 Oracle Database Home
  -> 用 DBCA 创建 RAC CDB / PDB
  -> 创建业务动态 service
  -> 验证节点、实例、监听、service、ASM 和故障转移
```

Grid Infrastructure 版本必须满足目标数据库版本的兼容要求。实验环境也要先查官方认证矩阵；虚拟机能启动不代表网络、存储和时间同步满足 RAC 要求。

下面是管理员在已完成配置的环境中使用的启动命令，它们会改变运行状态，不属于只读检查：

```bash
srvctl start database -db ORCL  # 由 Clusterware 按配置启动 ORCL 的 RAC 实例
srvctl start service -db ORCL   # 启动 ORCL 下已经注册的业务动态 service
```

正常结果是命令无报错，随后 `srvctl status database -db ORCL` 能看到各实例运行节点，`srvctl status service -db ORCL` 能看到 service 在线。生产执行前要有变更窗口和回退方案，不要绕过 Clusterware 直接逐节点启动资源。

### RAC 发生节点故障时发生什么

```text
节点 1 失联
  -> Clusterware 判断节点状态
  -> 节点 1 上的实例和 service 被标记为不可用
  -> FAN 向支持的连接池发送 DOWN 事件
  -> 新连接通过 SCAN / service 去节点 2
  -> 节点 2 完成失败实例留下的恢复工作
  -> AC / TAC 在满足条件时重放未完成请求
```

FAN 是 Fast Application Notification，作用是尽快告诉连接池“某个实例或 service 已经不可用”。它减少的是等待网络超时的时间，不负责复制数据。

### RAC 常用只读检查

```bash
crsctl check cluster -all        # 检查每个节点的 Clusterware 核心服务是否在线
crsctl stat res -t               # 以表格查看 VIP、监听、ASM、数据库、实例和 service 状态
olsnodes -n -s                   # 查看节点编号和活动状态
srvctl status database -db ORCL  # 查看 ORCL 数据库的各实例运行在哪些节点
srvctl status service -db ORCL   # 查看 ORCL 下的业务 service 运行状态
asmcmd lsdg                      # 查看 ASM 磁盘组挂载状态、容量和冗余信息
```

正常情况下，目标节点和关键资源应为 `ONLINE`，数据库实例为运行状态，业务 service 至少在设计的首选或可用实例上在线。`ORCL` 是示例数据库唯一名，实际环境要先用 `srvctl config database` 确认名称。

进入 SQL*Plus 后，可以用全局动态性能视图 `GV$` 同时观察多个实例：

```sql
SELECT inst_id, instance_name, host_name, status
FROM gv$instance
ORDER BY inst_id; -- 确认每个 RAC 实例位于哪台主机以及是否 OPEN

SELECT inst_id, event, total_waits,
       ROUND(time_waited_micro / 1000000, 2) AS waited_seconds
FROM gv$system_event
WHERE event LIKE 'gc %'
ORDER BY time_waited_micro DESC
FETCH FIRST 20 ROWS ONLY; -- 找出耗时最高的全局缓存等待，判断是否有跨实例热块问题
```

查询 `GV$` 视图需要相应字典视图权限。没有权限时不要临时给应用账号扩权，应让 DBA 提供只读监控账号或经过授权的采集视图。`GV$SYSTEM_EVENT` 是实例启动以来的累计值，监控时要计算时间窗口增量，不能只凭累计总数判断当前故障。

### RAC 重点监控什么

| 监控对象 | 建议采集的信号 | 告警时先判断 |
|---|---|---|
| 节点与实例 | 节点状态、实例状态、实例重启次数 | 单实例故障还是整个节点失联 |
| service | service 在线实例、重定位次数、连接失败数 | 数据库活着但业务入口是否离线 |
| interconnect | 丢包、错误、带宽、时延 | 网络问题是否推高 Cache Fusion 等待 |
| 全局缓存 | `gc current request`、`gc cr request` 等等待 | 热块、服务分布、SQL 访问模式是否异常 |
| ASM | 磁盘组状态、可用空间、离线磁盘 | 存储容量还是硬件路径故障 |
| Clusterware | CRS 资源状态、节点驱逐、OCR/voting 可用性 | 是资源依赖失败还是节点成员问题 |
| 负载均衡 | 各实例 session、CPU、DB time | service 是否把热点压在单个实例上 |

### RAC 常见故障怎么查

**实例离线但节点在线**：先看 `crsctl stat res -t` 和 `srvctl status database`，再看数据库 alert log 与 Clusterware 日志。不要一上来反复手工 `startup`，Clusterware 可能正在按资源策略处理故障。

**节点被驱逐**：先保留时间点和所有节点日志，检查私网心跳、voting disk、存储延迟、系统卡顿和时钟。节点驱逐是集群为避免脑裂采取的保护动作，不能只把“节点重启”当作根因。

**`gc` 等待突然升高**：检查是否某张热表或热索引被多个实例频繁修改，再看 service 是否把强关联业务分散到了不同实例。修复可能是调整 SQL、分区或索引，也可能是重新规划 service 亲和性，不是简单增加节点。

## OGG 深讲

OGG 的全称是 Oracle GoldenGate。它是一套基于日志的逻辑复制与数据集成产品，擅长 CDC（Change Data Capture，变更数据捕获）、低延迟事务复制、异构数据库同步和低停机迁移。

### OGG 和 Data Guard 的根本区别

Data Guard 主要按 Oracle redo 维护整库级备份副本；OGG 会把日志里的变更解析成逻辑事务，再按表和映射规则发送到目标。因此 OGG 可以筛选表、改列映射、连接异构目标，也更容易做多目标分发，但对象支持、数据类型、键设计、冲突处理和两端结构兼容都需要单独验证。

### OGG 怎么工作

Oracle GoldenGate 当前主线使用 Microservices Architecture，核心数据流可以这样理解：

```text
源 Oracle RAC 的所有 redo threads
  -> Integrated Extract 捕获已提交事务
  -> local trail 保存可恢复的中间记录
  -> Distribution Service 发送数据
  -> Receiver Service 接收为 remote trail
  -> Integrated Replicat 在目标库应用事务
  -> heartbeat table 计算端到端延迟
```

| 组件 | 是什么 | 为什么需要 | 坏了怎么查 |
|---|---|---|---|
| Extract | 从源库日志捕获变更的进程组 | 避免周期性全表扫描，并保留事务顺序 | 看进程状态、报告、长事务、日志可用性和 capture lag |
| trail | OGG 自己的顺序数据文件 | 解耦捕获、网络和应用，让进程能从 checkpoint 继续 | 看磁盘空间、文件增长、读写位置和清理策略 |
| Distribution Service | 把本地 trail 路由到目标 | 统一管理网络传输与路径 | 看 path 状态、网络、证书和 routing lag |
| Receiver Service | 在目标端接收并写 remote trail | 让目标 Replicat 从稳定的本地文件读取 | 看接收路径、目标磁盘和连接状态 |
| Replicat | 读取 trail 并在目标重放 DML / DDL | 让目标数据追上源端已提交事务 | 看 apply lag、SQL 错误、约束冲突和目标库负载 |
| checkpoint | 进程已经安全处理到的位置 | 进程重启后避免从头处理 | 看 checkpoint age 是否持续变大 |
| heartbeat table | 周期性进入复制链路的心跳记录 | 计算源到目标的真实端到端延迟 | 看心跳任务、表更新和各段 lag |

### OGG 安装与启动边界

GoldenGate 的安装路径取决于源端、目标端、数据库版本和部署模式。当前 Microservices Architecture 的学习顺序是：

```text
查认证矩阵与许可
  -> 安装 GoldenGate 软件
  -> 用 OGGCA 创建 Service Manager 和 deployment
  -> 建立安全的数据库 credential alias
  -> 创建 Extract、trail、Distribution path 和 Replicat
  -> 配置 heartbeat 与监控
  -> 做初始装载和增量追平
  -> 验证故障重启、节点迁移、切换与回切
```

OGGCA 是 Oracle GoldenGate Configuration Assistant，用来创建和配置 Microservices 部署。第一次实验应使用测试库和测试 schema；生产初始化涉及数据一致性窗口、起始 SCN、初始装载和增量衔接，不能只靠复制参数文件完成。

### Oracle 源库的关键前置检查

下面是学习和评审时要理解的最小检查，不代表完整生产部署步骤：

```sql
SELECT log_mode, force_logging, supplemental_log_data_min
FROM v$database; -- 确认归档模式、强制日志和最小补充日志状态

SHOW PARAMETER enable_goldengate_replication; -- 确认数据库是否启用 OGG 所需的集成服务
```

按已认证的版本和部署方案，通常需要由 DBA 评估并执行类似配置：

```sql
ALTER SYSTEM SET enable_goldengate_replication = TRUE
  SCOPE = BOTH SID = '*'; -- RAC 所有实例必须保持同一设置

ALTER DATABASE FORCE LOGGING;              -- 防止 NOLOGGING 操作让复制缺少必要变更信息
ALTER DATABASE ADD SUPPLEMENTAL LOG DATA;   -- 增加逻辑复制识别行所需的最小补充信息
```

生产执行前必须确认 GoldenGate 许可、数据库和 OGG 认证矩阵、补丁要求、表级补充日志、主键或唯一键、支持的数据类型、字符集、时区和 DDL 策略。不要看到参数为 `FALSE` 就直接在生产修改。

### OGG 参数文件读法

下面的片段只用于理解“捕获哪些表”和“应用到哪里”，真实 Microservices 部署还要在管理界面或 Admin Client 中创建连接、trail 和 path：

```text
EXTRACT EXTORA
USERIDALIAS ogg_src DOMAIN OracleGoldenGate  -- 使用凭据存储中的别名连接源库，不在文件里写明文密码
EXTTRAIL ./dirdat/ea                         -- 把捕获结果写入前缀为 ea 的本地 trail
TABLE APP.ORDERS;                            -- 捕获 APP schema 下的 ORDERS 表
```

```text
REPLICAT REPORA
USERIDALIAS ogg_tgt DOMAIN OracleGoldenGate  -- 使用目标库凭据别名
MAP APP.ORDERS, TARGET APP.ORDERS;           -- 把源表事务应用到目标同名表
```

示例没有包含生产所需的错误处理、DDL、序列、心跳、并行度、冲突检测和 trail 保留策略。先理解数据流，再按实际版本的官方配置向导生成部署。

### OGG 常用只读检查

连接 GoldenGate Admin Client 后执行：

```text
INFO ALL                  -- 查看 Extract、Replicat 和传输路径的状态与 checkpoint lag
LAG EXTRACT EXTORA        -- 查看 EXTORA 当前捕获延迟，比只看进程是否 RUNNING 更有价值
LAG REPLICAT REPORA       -- 查看 REPORA 当前应用延迟
INFO EXTRACT EXTORA DETAIL
INFO REPLICAT REPORA DETAIL
INFO HEARTBEATTABLE       -- 确认端到端心跳表配置；需要先完成数据库登录
```

| 现象 | 先检查 | 常见原因 |
|---|---|---|
| Extract `ABENDED` | process report、诊断日志、源库 alert log | 权限、日志不可用、不支持对象、参数错误 |
| Extract lag 增长 | 长事务、redo 生成速率、capture 状态 | 大事务、日志读取慢、源库压力、旧归档被删 |
| Distribution path 停止 | 网络、TLS、目标 Receiver、磁盘 | 证书过期、端口中断、目标不可写 |
| Replicat lag 增长 | 目标等待事件、并行度、错误记录、trail backlog | 目标库慢、热点 SQL、约束冲突、大事务 |
| Replicat `ABENDED` | report、discard、具体数据库错误 | 唯一键冲突、缺列、对象不存在、权限不足 |
| 进程 RUNNING 但数据不更新 | heartbeat、表映射、checkpoint、源端是否有提交 | 只看状态漏掉卡住、映射遗漏或未提交事务 |

### OGG 的 AIOps 监控重点

不要只采集 `RUNNING` 或 `ABENDED`。至少把下面信号接入指标和告警：

- Extract、Distribution path、Receiver path、Replicat 状态。
- capture lag、routing lag、apply lag 和 heartbeat 端到端 lag。
- checkpoint age 与 trail 文件占用。
- 每秒处理记录数、redo 生成速率和目标应用吞吐。
- `ABENDED` 次数、discard 记录、数据库错误码和自动重启次数。
- 长事务持续时间、未复制对象、DDL 失败和双向冲突数。

## RAC + OGG：怎么组合才是真的高可用

RAC + OGG 常见于两类场景：一类是从核心 RAC 实时分发数据到报表、搜索、湖仓或异构数据库；另一类是两套独立 RAC 之间做低停机迁移、逻辑灾备或经过严格设计的双向复制。

### 典型架构

```text
业务应用
  -> SCAN / service
  -> 源 RAC：instance 1 + instance 2
  -> 源 RAC 的所有 redo threads
  -> OGG Integrated Extract
  -> local trail
  -> Distribution Service
  -> remote trail
  -> OGG Integrated Replicat
  -> 目标 RAC：instance 1 + instance 2
  -> 报表、迁移目标或备用业务入口
```

这里有三套不同的高可用责任：

1. 源 RAC 和目标 RAC 分别保护本地实例与节点故障。
2. OGG 负责两个独立数据库之间的逻辑事务流动。
3. XAG、Clusterware、应用 VIP 和共享或可复制的 OGG 文件系统负责 OGG 服务自身的重启与节点迁移。

XAG 是 Oracle Grid Infrastructure Agents。它把 GoldenGate 注册为 Clusterware 管理的资源，可以声明数据库 service、文件系统和 VIP 依赖，并通过 `AGCTL` 启停或迁移 GoldenGate。没有这一层时，数据库 RAC 正常并不代表 OGG Extract、trail 和 Replicat 自己没有单点。

已使用 XAG 注册 GoldenGate 时，可以先做只读检查：

```bash
agctl status goldengate OGG_PROD  # 查看 OGG_PROD 当前运行节点和资源状态
agctl config goldengate OGG_PROD  # 查看它依赖的 VIP、文件系统、数据库 service 和候选节点
```

`OGG_PROD` 是示例 XAG 资源名。状态异常时先检查资源依赖，不要绕过 XAG 在另一节点重复启动同一 deployment。

### 源端是 RAC 时必须注意什么

- Extract 必须覆盖 RAC 的所有 redo thread。只捕获一个实例的线程会漏掉其他实例产生的事务。
- RAC 节点切换后，OGG 连接使用的 service、权限和网络入口必须仍然可用。
- OGG 的配置、checkpoint、trail 和凭据存储要按官方 HA 方案放置，不能只存在于一台易失节点的本地盘。
- 同一个 Extract 不能因为错误的集群脚本在两个节点同时写同一 trail；启动、停止和迁移必须由单一资源管理策略控制。
- 数据库实例故障演练时，不只验证 RAC service 恢复，还要验证 capture lag 是否回落、事务是否完整到达目标。

### 目标端是 RAC 时必须注意什么

- Replicat 连接应使用为复制工作负载设计的数据库 service，不要绑定某个物理实例地址。
- service 切换后要验证 Replicat 是否自动恢复、checkpoint 是否继续前进。
- 目标 RAC 有两个实例，不代表同一个 Replicat 必须同时在两个实例执行；并行方式要按 Integrated Replicat 和表依赖关系设计。
- 目标约束、触发器、序列和业务写入会影响复制，不能只看网络延迟。

### 单向、双向和广播怎么选

| 拓扑 | 适合场景 | 最大风险 |
|---|---|---|
| 单向 | 报表卸载、数据平台、迁移预同步、只读备用 | 切换后如何反向同步和回切 |
| 双向 | 两地都要写、业务分区写入、极低停机迁移 | 同一行并发修改、序列冲突、复制回环 |
| 一对多 | 一个核心库分发到多个消费端 | 慢目标拖积压、不同目标数据一致性难观察 |
| 多对一 | 多分支或多租户汇聚到中心 | 主键冲突、来源标识缺失、中心写入瓶颈 |

双向复制不是把两条单向链路拼起来就完成。至少要设计：

- 每张表都有稳定主键或唯一标识。
- 写入归属，尽量避免两个站点同时修改同一业务键。
- 序列号、时间和全局唯一 ID 的生成规则。
- 防复制回环和 Conflict Detection and Resolution（CDR，冲突检测与解决）策略。
- DDL 变更顺序、灰度窗口和失败回滚。
- 切换时先停哪边写入、如何确认 lag 为零、如何改复制方向。

### RAC + OGG 切换前检查清单

```text
1. 源 RAC 所有实例、service 和 ASM 正常
2. Extract 覆盖所有 redo thread，状态正常
3. Distribution / Receiver path 正常
4. Replicat 正常，heartbeat 端到端 lag 达到切换门槛
5. 目标表结构、约束、序列和关键行数校验通过
6. 停止或隔离源端写入，确认最后事务已经应用
7. 保存 checkpoint、SCN、切换时间和审批记录
8. 切换应用 service / DNS / GDS 路由
9. 做写入、读取、回滚和关键业务验证
10. 决定回切前的数据回流方向，持续观察错误与 lag
```

“进程全绿”不能替代数据一致性验证。切换门槛要同时包含进程状态、端到端 lag、源端是否停止写入、关键表对账和业务验证。

### RAC + OGG 不等于 RAC + Data Guard

| 对比项 | RAC + OGG | RAC + Data Guard |
|---|---|---|
| 副本类型 | 逻辑复制，可筛选和转换 | 通常是整库物理 redo 复制 |
| 异构目标 | 支持多种数据库和数据平台，需查认证矩阵 | 目标是 Oracle Data Guard 备库 |
| 双边写入 | 可以设计，但必须处理冲突 | 常规物理备库不作为双写节点 |
| 坏操作传播 | 已提交的误删可能被逻辑复制到目标 | redo 同样会把已提交变更应用到备库 |
| 角色切换 | 需要额外编排复制方向和应用入口 | Broker 可管理 switchover / failover |
| 适合重点 | 数据分发、异构同步、低停机迁移 | 整库保护、灾难恢复、明确主备角色 |

如果核心目标是整库灾备和明确的数据保护等级，通常先评估 Data Guard；如果需要异构、按表筛选、转换、实时数据管道或迁移，再评估 OGG。大型系统常见做法是 RAC 保护站点内节点，Data Guard 保护站点间整库，OGG 再把业务数据分发到其他系统。

## 其他高可用方案

### Data Guard 与 Active Data Guard

Data Guard 通过 Redo Transport Services 传输 redo，通过 Apply Services 在备库应用，并通过 switchover 或 failover 改变数据库角色。Data Guard Broker 提供 `DGMGRL` 和管理框架，减少手工维护多个参数和切换步骤的风险。

| 备库类型 | 工作方式 | 常见用途 |
|---|---|---|
| Physical standby | 通过 Redo Apply 维护与主库物理结构一致的副本 | 整库灾备、只读卸载、滚动维护 |
| Logical standby | 把 redo 转成 SQL 后通过 SQL Apply 应用 | 逻辑结构更灵活的维护与升级场景，先查对象支持范围 |
| Snapshot standby | 暂停应用 redo，临时作为可写测试库；转回后丢弃本地测试修改并继续追赶 | 真实数据上的测试和工作负载验证 |
| Far Sync | 只接收并转发 redo，没有用户 datafile，不能成为主库 | 跨远距离时兼顾同步保护和网络时延 |

三个保护模式要先理解取舍：

| 模式 | 关注点 | 适合思路 |
|---|---|---|
| Maximum Performance | 优先保证主库性能，通常异步传输 | 能接受一定 RPO，距离或网络时延较大 |
| Maximum Availability | 正常时尽量同步且不轻易停主库 | 希望接近零数据丢失，同时保留可用性 |
| Maximum Protection | 不能把 redo 安全写到备端时宁可停主库 | 数据零丢失优先级高于主库持续运行 |

Active Data Guard 在物理备库只读打开时继续应用 redo，可用于只读查询、报表、备份卸载等。Far Sync 可以在靠近主库的位置接收同步 redo，再转发到远端备库，但它不含用户 datafile，不能升为主库，并且涉及 Active Data Guard 许可。

启用了 Data Guard Broker 时，先用只读命令确认配置，不要直接执行 switchover：

```text
SHOW CONFIGURATION;                    -- 查看整个 Broker 配置、主备角色和总体状态
SHOW DATABASE VERBOSE 'ORCL_STBY';     -- 查看 ORCL_STBY 的属性、延迟和错误
VALIDATE DATABASE 'ORCL_STBY';         -- 检查数据库是否满足角色切换和运行要求
```

在备库 SQL*Plus 中还可以查看：

```sql
SELECT database_role, open_mode, protection_mode
FROM v$database; -- 确认当前到底是主库还是备库，以及打开和保护模式

SELECT name, value, unit, time_computed
FROM v$dataguard_stats
WHERE name IN ('transport lag', 'apply lag'); -- 分开观察 redo 传输延迟与应用延迟
```

正常情况下，Broker 配置状态符合团队定义，数据库角色和预期一致，transport lag 与 apply lag 没有持续越过 RPO 告警阈值。短时为零并不能替代切换演练。

### Application Continuity、TAC、FAN 和 service

数据库副本切换成功，不代表用户请求一定成功。连接可能还挂在旧实例上，事务可能已经提交但确认消息丢了，应用盲目重试又可能造成重复扣款。

- FAN 负责快速发布实例和 service 的 UP / DOWN 事件。
- Application Continuity（AC）记录请求状态，在可恢复故障后安全重放满足条件的请求。
- Transparent Application Continuity（TAC）减少对应用知识和代码改造的依赖。
- Transaction Guard 帮助判断最后一次提交的结果，降低“到底提交没提交”的不确定性。
- 动态数据库 service 定义应用应该连哪里、在哪里运行以及如何故障转移。

这层要和 JDBC、ODP.NET、OCI、连接池版本和配置一起验证。只改 TNS 连接串，不做真实故障演练，无法证明事务能透明恢复。

### Oracle Restart、RAC One Node 与 Clusterware

预算或复杂度不允许多实例 RAC 时，可以先看故障目标：

- 只需要单机进程异常后自动拉起：Oracle Restart。
- 需要实例在集群节点之间迁移，但不需要多实例同时服务：RAC One Node。
- 需要多个实例同时打开同一数据库：RAC。

三者都不能替代异地数据副本。主机、集群、存储和机房故障是不同层次，方案要覆盖实际的单点。

### Sharding 与 Global Data Services

Oracle Sharding 把数据水平分布到多个独立数据库，每个 shard 只保存一部分数据。它能扩大容量并缩小单个故障的影响范围，再结合 Data Guard 给每个 shard 建立备库。Global Data Services（GDS）负责在分布式数据库环境中发现和路由数据库服务。

Sharding 需要数据模型和路由键设计，不是给现有单库加一个开关。跨 shard 查询、事务、扩容迁移和热点 shard 都要单独治理。

### RMAN、Flashback 与恢复能力

高可用副本可能同步复制误删和错误更新，所以还需要时间维度上的恢复能力：

- RMAN 提供备份、校验、恢复和时间点恢复。
- Flashback Database 可以在满足日志与保留条件时把数据库快速回退到较早时间点。
- Flashback Table / Query 用于更细粒度查看或恢复历史数据。

备份成功日志不等于可恢复。必须定期做 restore / recover 演练，记录实际恢复耗时，验证它是否满足 RTO 和 RPO。

### 推荐的分层组合

```text
应用连接与请求恢复：service + FAN + AC / TAC
  -> 站点内节点高可用：RAC 或 RAC One Node
  -> 站点间整库保护：Data Guard / Active Data Guard
  -> 异构复制与数据分发：GoldenGate
  -> 误操作和长期恢复：RMAN + Flashback
  -> 统一监控、告警、演练和自动化 Runbook
```

真正的高可用来自组合和演练，不来自产品名称堆叠。每一层都要有负责人、监控指标、切换条件、回退条件和最近一次演练证据。

## 常用观测点

| 观测点 | 代表什么 | 异常含义 |
|---|---|---|
| active sessions | 活跃会话 | 并发升高、SQL 卡住、连接池放大 |
| wait events | 等待事件 | CPU、IO、锁、网络或日志写入瓶颈 |
| tablespace usage | 表空间使用率 | 容量风险、自动扩展失败 |
| temp usage | 临时表空间 | 排序、hash join、大查询压力 |
| undo usage | undo 压力 | 长事务、回滚、快照过旧风险 |
| redo generation | redo 生成速率 | 写入压力、批处理、异常变更 |
| archive lag | 归档/同步延迟 | 备份恢复和灾备风险 |
| invalid objects | 失效对象 | 发布或依赖变更问题 |
| backup status | 备份状态 | 恢复能力风险 |
| RAC instance / service | 多实例和业务入口状态 | 节点故障、service 漂移失败、负载分布异常 |
| RAC global cache waits | 跨实例缓存协调等待 | interconnect、热块或 service 亲和性问题 |
| Data Guard transport / apply lag | redo 传输和应用延迟 | RPO 扩大、备库恢复时间变长 |
| OGG end-to-end lag | 逻辑复制端到端延迟 | 捕获、网络、trail 或目标应用出现瓶颈 |
| OGG checkpoint / trail usage | 复制进度和中间文件容量 | 进程卡住、积压或磁盘即将写满 |
| AC / TAC replay result | 请求重放成功率和耗时 | 数据库已接管但用户仍收到错误 |

## 入门实验

本地可以用容器或现成测试库做最小实验，目标不是搭生产 RAC，而是熟悉 SQL 和监控视角。

建议目录：

```text
labs/oracle-aiops-basics/
  README.md
  schema.sql
  queries.sql
  troubleshooting-notes.md
```

实验内容：

- 建一张 `alerts` 表。
- 插入告警、服务、严重级别、开始时间、恢复时间。
- 写 SQL 统计最近 24 小时告警最多的服务。
- 故意写一个无索引查询，观察执行计划。
- 记录一次“表空间/慢 SQL/连接失败”的模拟排障过程。

示例 SQL：

```sql
CREATE TABLE alerts (
  id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  service_name VARCHAR2(100) NOT NULL,
  severity VARCHAR2(20) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP
);

SELECT service_name, COUNT(*) AS alert_count
FROM alerts
WHERE started_at >= SYSTIMESTAMP - INTERVAL '1' DAY
GROUP BY service_name
ORDER BY alert_count DESC;
```

预期结果：查询返回最近一天至少一个服务名和对应告警数；执行计划能显示 Oracle 选择了哪种访问路径。失败时先检查当前连接的 PDB、用户建表权限、对象 schema 和时间字段类型。

### 高可用只读观察实验

这个实验不执行节点故障或主备切换，只验证你能把 RAC 与 OGG 的运行状态整理成一份 AIOps 证据。需要一套已经部署好的测试环境和授权只读账号。

**实验目标**：回答“RAC 有几个实例、业务 service 在哪里、OGG 哪一段最慢、当前端到端 RPO 风险多大”。

1. 在 RAC 节点执行 `crsctl stat res -t`，保存资源表格。
2. 执行 `srvctl status database -db ORCL` 和 `srvctl status service -db ORCL`，记录实例与 service 所在节点。
3. 在 SQL*Plus 执行前文的 `GV$INSTANCE` 查询，核对实例、主机和状态。
4. 在 GoldenGate Admin Client 执行 `INFO ALL`、`LAG EXTRACT EXTORA` 和 `LAG REPLICAT REPORA`。
5. 已配置 heartbeat 时，登录数据库连接并执行 `INFO HEARTBEATTABLE`，记录端到端 lag。
6. 把时间、命令、结果、异常项和判断写入 `labs/oracle-aiops-basics/ha-observation.md`。

验证成功的标准：Clusterware、`GV$INSTANCE` 和 `SRVCTL` 看到的实例关系一致；业务 service 至少有一个在线位置；OGG 关键进程为运行状态；lag 数值能够解释，且 checkpoint 持续前进。

如果没有成功，按顺序检查：

1. 当前操作系统用户是否有 Grid Infrastructure 命令权限。
2. `ORCL`、`EXTORA` 和 `REPORA` 是否已替换成真实名称。
3. SQL 账号是否有查询 `GV$` 视图的只读权限。
4. Admin Client 是否连接到正确的 deployment。
5. heartbeat 是否已经创建并正常更新。
6. 进程虽然显示运行，checkpoint 和 heartbeat 是否已经停止前进。

## 排障路径

### 应用连接失败

先查：

1. listener 是否可达。
2. 连接串 service name / PDB 是否正确。
3. 用户是否锁定或密码过期。
4. process / session 是否达到上限。
5. 网络、防火墙、DNS 是否异常。
6. 数据库实例状态是否正常。

### 接口变慢

先看：

1. 是否所有接口慢，还是某个 SQL 慢。
2. active sessions 是否升高。
3. top wait events 是 IO、锁、CPU 还是 log file sync。
4. 慢 SQL 执行计划是否变化。
5. 最近是否发布、统计信息刷新、索引变更。
6. 下游存储、归档、备份任务是否抢资源。

### 表空间告警

先判断：

- 是永久表空间、临时表空间、undo 还是 archive 目录。
- datafile 是否 autoextend。
- 磁盘是否还有空间。
- 是否有异常批处理写入。
- 是否有长事务撑住 undo。

### ORA 错误

不要只把 `ORA-xxxxx` 贴给 DBA。至少记录：

- 错误码和完整错误信息。
- 发生时间。
- 应用服务名和实例。
- SQL 或接口。
- 连接用户和 PDB。
- 最近变更。
- 同期数据库指标。

### RAC 节点或 service 异常

先区分节点、实例和 service：

1. `olsnodes -n -s` 看节点是否活动。
2. `crsctl stat res -t` 看具体哪一层资源离线。
3. `srvctl status database -db ORCL` 看实例位置。
4. `srvctl status service -db ORCL` 看业务入口是否还有在线实例。
5. 对齐数据库 alert log、Clusterware 日志、系统日志和网络/存储指标时间线。
6. 如果发生节点驱逐，先保全证据，不要只把节点重新加入集群就关闭事件。

### OGG 延迟或中断

按数据流从源到目标排查：

1. 源库是否仍产生并保留 OGG 需要的 redo / archive。
2. Extract 是 `RUNNING` 还是 `ABENDED`，capture lag 是否增长。
3. local trail 是否增长，所在文件系统是否有空间。
4. Distribution / Receiver path 是否存在网络或 TLS 错误。
5. remote trail 是否继续增长，Replicat checkpoint 是否前进。
6. 目标库是否被锁、IO、约束冲突或大事务拖慢。
7. heartbeat 端到端 lag 是否与各段 lag 一致。

### Data Guard 延迟

先把延迟拆成 transport lag 和 apply lag：前者大通常先查网络、redo 发送与远端接收，后者大通常先查备库应用进程、存储性能、standby redo log 和备库负载。再确认保护模式、主备角色、Broker 状态和归档缺口，不要只看“备库进程还在”。

### 切换成功但应用仍报错

数据库角色或 service 在线只是服务端成功。继续检查：

- SCAN、DNS、GDS 或连接串是否指向正确入口。
- 连接池是否接收 FAN 事件并清理旧连接。
- AC / TAC 是否对目标 service 启用，驱动版本是否支持。
- 最后事务是否存在提交结果不确定，应用是否盲目重试。
- 切换后的 PDB、service、用户、权限和只读/读写角色是否正确。

## 在 AIOps 中的位置

| AIOps 环节 | Oracle 作用 |
|---|---|
| 数据采集 | 提供核心业务表、会话、等待、空间、RAC、Data Guard、OGG 和备份状态 |
| 告警治理 | 区分连接失败、慢 SQL、空间、归档、节点故障、主备延迟和 OGG 积压 |
| 根因分析 | 关联应用超时、SQL、等待事件、RAC service、复制链路、变更和备份任务 |
| 容量预测 | 基于表空间、归档、redo 生成速率、trail 增长和复制吞吐预测风险 |
| 自动化 | 在满足审批和前置检查后执行 service 迁移、OGG 启停、切换核验和证据采集 |
| Runbook | 固化 ORA 错误、慢 SQL、表空间、RAC、OGG、Data Guard 和备份失败处理步骤 |
| RAG | 检索历史 DBA 处理记录、SQL 调优笔记、切换手册和故障复盘 |

## 面试怎么讲

Oracle 是企业级关系型数据库，核心概念包括 database、instance、schema、tablespace、datafile、redo、undo、archive log、optimizer 和执行计划。高可用上我会按故障层选方案：RAC 处理站点内实例或节点故障，Data Guard 保护整库和异地灾备，OGG 处理低延迟逻辑复制、异构同步和迁移，service、FAN、AC / TAC 处理应用连接和请求恢复，RMAN 与 Flashback 负责误操作和长期恢复。RAC + OGG 组合时，还必须保证 Extract 覆盖所有 redo thread、OGG 自身由 XAG / Clusterware 管理，并验证端到端 lag、数据一致性和应用切换。

在 AIOps 场景里，我不会只把 Oracle 当作黑盒数据库，而会把数据库指标、ORA 错误、SQL 指纹、执行计划变化、表空间增长、备份任务和应用链路关联起来。这样当支付接口超时时，系统能判断是应用发布、连接池放大、慢 SQL、锁等待、归档空间满，还是主备同步异常，而不是只给出“数据库慢”的笼统结论。

## 学习检查清单

- [ ] 我能区分 Oracle database 和 instance。
- [ ] 我能解释 CDB、PDB、schema、user 的关系。
- [ ] 我能说明 tablespace、datafile、redo、undo、archive log 的作用。
- [ ] 我能读懂常见 `ORA-` 错误的排障上下文。
- [ ] 我能解释执行计划为什么会影响 SQL 性能。
- [ ] 我能说出 active sessions 和 wait events 的价值。
- [ ] 我能说明 RAC 和 Data Guard 分别解决什么问题。
- [ ] 我能解释 RAC 的 Clusterware、SCAN、service、interconnect、Cache Fusion 和 ASM。
- [ ] 我能画出 OGG 的 Extract、trail、Distribution、Receiver、Replicat 和 heartbeat 数据流。
- [ ] 我能说明 RAC + OGG 中数据库高可用、复制进程高可用和应用切换是三件事。
- [ ] 我能比较 RAC、Data Guard、OGG、Application Continuity、Sharding 和 RMAN 的边界。
- [ ] 我能用只读命令判断 RAC 资源状态和 OGG 复制延迟。
- [ ] 我能设计一个 AIOps 告警表并写聚合 SQL。
- [ ] 我能描述表空间告警、慢 SQL、连接失败的排查路径。

## 面试题

1. Oracle database 和 instance 有什么区别？
2. CDB 和 PDB 是什么？
3. schema 和 user 在 Oracle 中是什么关系？
4. tablespace 和 datafile 分别是什么？
5. redo、undo、archive log 各自解决什么问题？
6. 慢 SQL 你会怎么查？
7. active sessions 和 wait events 有什么价值？
8. 表空间满了你会怎么排查？
9. RAC 和 Data Guard 分别适合什么场景？
10. OGG 的 Extract、trail 和 Replicat 分别做什么？
11. RAC + OGG 为什么仍然要设计 OGG 自身的高可用？
12. OGG 和 Data Guard 的副本机制及适用场景有什么区别？
13. 双向 OGG 为什么需要主键、写入归属和冲突处理？
14. 数据库已经切换，应用为什么仍然可能报错？
15. AIOps 如何利用 RAC、Data Guard 和 OGG 指标做根因分析？

## 学习证据

学完后建议提交：

- `labs/oracle-aiops-basics/schema.sql`
- `labs/oracle-aiops-basics/queries.sql`
- 一份 Oracle 核心概念图。
- 一篇 `Oracle 表空间告警排查.md`。
- 一篇 `Oracle 慢 SQL 与执行计划分析.md`。
- 一份 `oracle-core-db-runbook.md`。
- 一份 `ha-solution-matrix.md`，记录业务的 RTO、RPO 和方案选择。
- 一份 `ha-observation.md`，保存 RAC 资源、service 和 OGG lag 的只读检查结果。
- 一份 `rac-ogg-switchover-runbook.md`，写明切换前置条件、校验、回退和证据项。
