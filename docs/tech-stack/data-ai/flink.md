# Apache Flink 深讲

> 学习目标：从零理解 Flink 的 JobManager、TaskManager、Operator、Slot、State、Watermark、Checkpoint 和 Savepoint，能运行一个持续流作业并观察恢复，能分析反压、Checkpoint、状态膨胀、数据倾斜、序列化和 Connector 故障，并能回答状态一致性、Exactly-once、高可用、容量和升级的连续追问。

## 官方资料

- [Apache Flink 官网](https://flink.apache.org/)
- [Apache Flink 下载页](https://flink.apache.org/downloads/)
- [Flink 2.3 稳定版文档](https://nightlies.apache.org/flink/flink-docs-stable/)
- [Flink 架构](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/flink-architecture/)
- [Checkpoint](https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/checkpoints/)
- [Checkpoint 与 Savepoint](https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/checkpoints_vs_savepoints/)
- [生产就绪检查单](https://nightlies.apache.org/flink/flink-docs-stable/docs/deployment/production/)

版本边界：本文以 Apache Flink 2.3.0 稳定版为主线。Flink 1.20、2.0、2.1、2.2 等存量版本在 API、配置、Connector、State 和升级路径上存在差异，执行命令前必须选择与目标集群完全匹配的文档版本。

## 官方知识地图

```text
Apache Flink
  -> API：Flink SQL、Table API、DataStream API
  -> 时间：Processing Time、Event Time、Watermark、Window
  -> 状态：Keyed State、Operator State、State Backend、TTL
  -> 容错：Checkpoint、Barrier、Savepoint、Restart Strategy
  -> 运行：Client、Dispatcher、JobManager、TaskManager、Slot
  -> 图：StreamGraph、JobGraph、ExecutionGraph、Operator Chain
  -> 部署：Standalone、YARN、Kubernetes
  -> 运维：Metrics、REST、Web UI、Backpressure、升级、安全
```

```text
基础层
  -> 跑一个有状态流作业
  -> 理解事件时间、Watermark 和窗口
  -> 在 Web UI 看 Job、Task 和 Checkpoint

进阶层
  -> 解释 Barrier Snapshot 和恢复
  -> 说明 Source/State/Sink 的一致性边界
  -> 分析反压、状态、倾斜和 Checkpoint 失败
  -> 设计 HA、容量、安全、升级和回滚
```

## 场景开场

告警事件从 Kafka 持续进入。你要按服务统计 5 分钟错误率，允许事件迟到 30 秒，并在任务重启后继续从正确 Offset 处理，不把同一告警重复写入工单系统。

这不是“每 5 分钟跑一次批任务”就能完整解决的问题。系统需要持续处理、保存窗口状态、理解事件时间，并在故障时协调输入进度、算子状态和输出副作用。

## 一句话人话版

`Flink = 持续处理有界或无界数据流、维护计算状态，并用 Checkpoint 在故障后恢复进度的分布式计算引擎。`

## 小白可能会问

### 流处理是不是一条来一条处理

逻辑上可以逐事件处理，但网络、序列化、算子链、缓冲和 Sink 常以批次优化吞吐。低延迟与吞吐之间需要压测取舍。

### Watermark 是系统时间吗

不是。Watermark 是对“事件时间大概推进到哪里”的估计，用来判断窗口何时可以计算和清理。它由 Source/策略生成，并会受到空闲分区和乱序影响。

### Checkpoint 是备份吗

Checkpoint 是运行时自动恢复机制，生命周期由 Flink 管理；Savepoint 更偏人为触发的版本迁移和运维快照。二者都不能替代原始数据备份和灾备。

### Flink 保证 Exactly-once 吗

只在明确的 Source、状态、Checkpoint 和 Sink 协议组合下讨论。外部 HTTP API 若没有事务或幂等键，重试仍可能产生重复副作用。

## 为什么要学

- 实时指标、告警关联、CEP、风控和在线特征需要状态化流处理。
- Kafka -> Flink -> 湖仓/数据库是常见数据链路。
- Watermark、Checkpoint、Backpressure 是流处理面试核心。
- AIOps 需要理解“检测延迟”来自数据迟到、计算反压还是 Sink 故障。

## 核心组件

| 组件 | 人话解释 | 关键证据 |
|---|---|---|
| Client | 构建 JobGraph 并提交 | 制品、参数、Job ID |
| Dispatcher | 接收作业并提供 REST 入口 | 提交、JobManager 启动 |
| JobManager | 协调调度、Checkpoint 和恢复 | Job 状态、Checkpoint Coordinator |
| TaskManager | 执行 Subtask、交换数据和保存本地状态 | Slot、Task、Network Buffer |
| Slot | TaskManager 的资源并发单位 | 可共享，不能简单等于 CPU 核 |
| Operator | Source/Map/Window/Sink 等处理逻辑 | UID、并行度、状态 |
| Subtask | Operator 的一个并行实例 | Task 指标、Key 范围 |

## 作业提交与运行路径

```text
SQL Client / Java Client
  -> 构建逻辑拓扑
  -> StreamGraph / JobGraph
  -> Dispatcher 接收 Job
  -> JobManager 建立 ExecutionGraph
  -> Scheduler 向 ResourceManager 申请 Slot
  -> TaskManager 启动 Subtask
  -> Source 读取事件
  -> Operator Chain 处理并交换数据
  -> Sink 写外部系统
```

KeyBy 会按 Key 重分区，通常引入网络交换。相同 Key 进入同一个并行 Subtask，才能维护该 Key 的一致状态；热点 Key 也会因此形成倾斜。

## 时间语义

### Processing Time

使用算子机器当前时间，简单、延迟低，但结果受调度、反压和重放时间影响。

### Event Time

使用事件携带的业务时间，适合处理乱序和重放。需要 Timestamp 与 Watermark。

### Ingestion Time

介于两者之间，但现代设计通常明确选择 Event Time 或 Processing Time，不应混淆业务时间。

## Watermark

```text
事件时间最大值 = 10:20:30
允许乱序 = 30 秒
Watermark 约为 10:20:00
```

当 Watermark 超过窗口结束时间，窗口才认为可以触发。某个 Kafka Partition 长期无数据可能拖住全局 Watermark，需要配置 idleness（空闲检测）；过于激进会把正常迟到事件当 Late Data。

## Window

- Tumbling Window：固定长度、不重叠，例如每 5 分钟。
- Sliding Window：固定长度、按步长滑动，窗口会重叠。
- Session Window：按活动间隔聚合，适合会话。
- Global Window：需要自定义 Trigger，使用不当会无限积累状态。

窗口必须说明时间语义、大小、允许迟到、Trigger、Evictor/清理和输出模式。

## State

### Keyed State

绑定到 `keyBy` 后的 Key，例如 ValueState、ListState、MapState。Flink 能在扩缩容时重新分配 Key Group。

### Operator State

绑定到 Operator 并行实例，例如 Source 分片信息。重分配策略与 Keyed State 不同。

### Broadcast State

把规则流广播到所有并行实例，适合动态规则，但规则大小和一致性要管理。

### State TTL

TTL 控制过期状态，避免无限增长。TTL 清理有具体触发与后端行为，不等于到点立即物理删除。

## Checkpoint 原理

```text
Checkpoint Coordinator
  -> Source 注入 Barrier N
  -> Barrier 随数据流经过 Operator
  -> Operator 在一致位置 Snapshot State
  -> State 写入 Checkpoint Storage
  -> Sink 完成对应事务/提交协议
  -> 所有 Task Ack 后 Checkpoint N 成功
```

Aligned Checkpoint 会在多输入算子对齐 Barrier，反压时对齐可能很慢；Unaligned Checkpoint 可把在途数据纳入快照，减少反压下对齐时间，但会增加快照体积和恢复成本。

## 故障恢复

Task 失败后，JobManager 根据 Restart Strategy 重启相应 Region/Job，从最近成功 Checkpoint 恢复 State 和 Source Offset。Checkpoint 间隔越短不一定越好：存储、网络和 Barrier 开销会增加。

## Savepoint 与升级

Savepoint 是人为管理的状态快照，常用于停止、迁移、升级和调整并行度。Operator UID 必须稳定，否则新作业可能找不到旧状态。

```java
stream
    .keyBy(Alert::service)
    .process(new AlertProcessFunction())
    .uid("alert-process-v1"); // 稳定 UID 用于状态映射；发布后不要随意改
```

状态 Schema、Serializer 和 Connector 兼容性决定能否从旧 Savepoint 恢复。发布前必须在测试环境真实恢复一次。

## Flink SQL 入门

```sql
CREATE TABLE alerts (
  alert_id BIGINT,                                      -- 告警唯一编号
  service_name STRING,                                  -- 服务名称
  severity STRING,                                      -- 告警级别
  event_ts TIMESTAMP(3),                                -- 事件实际发生时间
  WATERMARK FOR event_ts AS event_ts - INTERVAL '30' SECOND -- 允许 30 秒乱序
) WITH (
  'connector' = 'kafka',                                -- 从 Kafka 读取
  'topic' = 'alerts',                                   -- 主题名
  'properties.bootstrap.servers' = 'kafka:9092',        -- Broker 地址
  'properties.group.id' = 'flink-alert-summary',        -- 消费组
  'scan.startup.mode' = 'group-offsets',                -- 从已提交 Offset 恢复
  'format' = 'json'                                     -- 消息格式
);

SELECT
  window_start,
  window_end,
  service_name,
  COUNT(*) AS alert_count
FROM TABLE(
  TUMBLE(TABLE alerts, DESCRIPTOR(event_ts), INTERVAL '5' MINUTES) -- 5 分钟滚动窗口
)
WHERE severity = 'critical'
GROUP BY window_start, window_end, service_name;
```

生产要为 JSON Schema、坏消息、时区、空闲分区、迟到数据和 Sink 幂等制定规则。

## 配置重点

```yaml
jobmanager.rpc.address: jobmanager              # TaskManager 连接 JobManager 的地址
taskmanager.numberOfTaskSlots: 2                # 每个 TaskManager 的 Slot 数
parallelism.default: 2                          # 未显式指定时的默认并行度
execution.checkpointing.interval: 10s           # 每 10 秒触发 Checkpoint
execution.checkpointing.timeout: 2min           # 超时即失败，需结合状态和存储压测
state.checkpoints.dir: file:///opt/flink/checkpoints # 仅实验；生产用可靠共享存储
state.savepoints.dir: file:///opt/flink/savepoints   # 仅实验；生产用可靠共享存储
restart-strategy.type: fixed-delay              # 固定延迟重启策略
restart-strategy.fixed-delay.attempts: 3        # 连续失败最多重试次数
restart-strategy.fixed-delay.delay: 5s          # 每次重试等待 5 秒
```

生产不能把 Checkpoint 放在 Pod 临时盘；TaskManager 重建后会丢失本地文件，导致无法恢复。

## 常用命令与 REST

| 命令/API | 作用 | 关键结果 | 风险 |
|---|---|---|---|
| `flink list` | 查看 Job | Job ID、状态 | 连接错集群 |
| `flink run` | 提交 Job | Job ID | 制品和参数错误 |
| `flink cancel <id>` | 取消 Job | CANCELED | 会停止处理，需审批 |
| `flink savepoint <id> <path>` | 触发 Savepoint | 完成路径 | 状态大时有存储压力 |
| `flink stop --savepointPath ... <id>` | 有状态停止 | Savepoint + 停止 | Connector 支持和版本差异 |
| `GET /jobs/overview` | 查询 Job 概览 | jid、state | REST 需认证和网络控制 |
| `GET /jobs/<id>/checkpoints` | 查询 Checkpoint | 成功、失败、耗时、大小 | 只读但可能含内部路径 |

## 入门实验：Docker Compose 运行持续 SQL Job

### compose.yaml

```yaml
services:
  checkpoint-init:
    image: flink:2.3.0-scala_2.12-java17
    user: "0"                             # 仅初始化命名卷权限，完成后退出
    entrypoint: ["/bin/sh", "-c"]
    command: ["chown -R 9999:9999 /opt/flink/checkpoints"]
    volumes:
      - flink-state:/opt/flink/checkpoints

  jobmanager:
    image: flink:2.3.0-scala_2.12-java17  # Apache Flink 官方 Docker 镜像
    command: jobmanager
    depends_on:
      checkpoint-init:
        condition: service_completed_successfully
    ports:
      - "8081:8081"                      # Web UI 和 REST
    environment:
      FLINK_PROPERTIES: |
        jobmanager.rpc.address: jobmanager
        rest.bind-address: 0.0.0.0
        taskmanager.numberOfTaskSlots: 2
        parallelism.default: 1
        execution.checkpointing.interval: 5s
        state.checkpoints.dir: file:///opt/flink/checkpoints
        restart-strategy.type: fixed-delay
        restart-strategy.fixed-delay.attempts: 3
        restart-strategy.fixed-delay.delay: 3s
    volumes:
      - ./job.sql:/opt/flink/usrlib/job.sql:ro
      - flink-state:/opt/flink/checkpoints

  taskmanager:
    image: flink:2.3.0-scala_2.12-java17
    command: taskmanager
    depends_on:
      checkpoint-init:
        condition: service_completed_successfully
      jobmanager:
        condition: service_started
    environment:
      FLINK_PROPERTIES: |
        jobmanager.rpc.address: jobmanager
        taskmanager.numberOfTaskSlots: 2
        parallelism.default: 1
        execution.checkpointing.interval: 5s
        state.checkpoints.dir: file:///opt/flink/checkpoints
        restart-strategy.type: fixed-delay
        restart-strategy.fixed-delay.attempts: 3
        restart-strategy.fixed-delay.delay: 3s
    volumes:
      - flink-state:/opt/flink/checkpoints

volumes:
  flink-state:
```

### job.sql

```sql
SET 'execution.runtime-mode' = 'streaming';
SET 'pipeline.name' = 'aiops-alert-window-lab';

CREATE TABLE alert_source (
  alert_id BIGINT,
  proc_time AS PROCTIME()
) WITH (
  'connector' = 'datagen',
  'rows-per-second' = '5',
  'fields.alert_id.kind' = 'sequence',
  'fields.alert_id.start' = '1',
  'fields.alert_id.end' = '1000000'
);

CREATE TABLE alert_sink (
  window_start TIMESTAMP(3),
  window_end TIMESTAMP(3),
  alert_count BIGINT
) WITH ('connector' = 'print');

INSERT INTO alert_sink
SELECT window_start, window_end, COUNT(*)
FROM TABLE(
  TUMBLE(TABLE alert_source, DESCRIPTOR(proc_time), INTERVAL '5' SECOND)
)
GROUP BY window_start, window_end;
```

### 启动和提交

```powershell
docker compose up --detach
docker compose ps

docker compose exec --detach jobmanager `
  ./bin/sql-client.sh `
  -f /opt/flink/usrlib/job.sql
```

`checkpoint-init` 只以 `root` 运行一次，把新命名卷交给镜像内 UID 9999 的 `flink` 用户；JobManager 和 TaskManager 仍以非 root 用户运行。不要为了绕过权限问题让整个计算集群长期以 root 运行。

打开 `http://localhost:8081`，确认 Job 为 RUNNING。执行：

```powershell
curl.exe --fail http://localhost:8081/jobs/overview
docker compose logs taskmanager --tail 80
```

TaskManager 日志中的 `+I[...]` 是 Print Sink 的插入结果。生产不要使用 Print Sink 承载业务。

### 如果没成功

1. 镜像标签、Docker 与 8081 端口。
2. YAML 缩进和挂载路径。
3. JobManager 日志是否接受 TaskManager 注册。
4. SQL Client 是否提示 Connector/SQL 语法错误。
5. `GET /jobs/overview` 是否能看到 FAILED Job 和异常。

## 故障注入实验：停止 TaskManager

### 基线

确认 Job 为 RUNNING，至少有一次成功 Checkpoint，并记录 Job ID。

### 注入

```powershell
docker compose stop taskmanager # 只停止本地实验 TaskManager
curl.exe --fail http://localhost:8081/jobs/overview
```

不同版本和调度阶段的顶层 Job 状态可能进入 `RESTARTING`/`FAILING`，也可能暂时保持 `RUNNING`。不要只看这一个字段：同时确认 `/overview` 中 TaskManager 和可用 Slot 变为 0，并在 Job 详情中观察 Vertex/Task 退回 `CREATED`、`SCHEDULED` 或 `DEPLOYING`，以及 Checkpoint 停止增长。

### 恢复

```powershell
docker compose start taskmanager
docker compose logs taskmanager --tail 120
curl.exe --fail http://localhost:8081/jobs/overview
```

验证 TaskManager 重新注册、Job/Task 回到 RUNNING、Checkpoint 继续成功、Print Sink 重新产生窗口结果。记录短窗口、缺口或重复输出；Datagen 和 Print Sink 不提供端到端事务一致性，因此它们只用于观察恢复流程，不代表生产 Exactly-once Source/Sink。

### 清理

```powershell
docker compose down --volumes # 只删除本实验容器、网络和状态卷
```

## 反压

Backpressure（反压）表示下游处理速度跟不上，上游发送被逐级限制。现象可能是 busy/backpressured time 上升、Network Buffer 紧张、Checkpoint 对齐变慢和端到端延迟增加。

排查方向：

1. 从最下游 Sink 向上找首个繁忙算子。
2. 比较各 Subtask，而不是只看 Operator 平均值。
3. 检查外部存储延迟、批量、事务和连接池。
4. 检查热点 Key、序列化、CPU、GC、网络和状态访问。
5. 评估提高并行度是否会超过 Kafka Partition 或 Sink 容量。

## Checkpoint 常见故障

### Checkpoint 超时

看 Alignment、Start Delay、Duration、State Size、Upload、外部存储和反压。增加 Timeout 可能只是延后失败。

### Checkpoint 失败次数上升

按 Task/Subtask 查第一个失败点，检查共享存储、权限、网络、状态后端、并发 Checkpoint 和清理。

### 状态持续膨胀

检查 Key 基数、Window、TTL、迟到数据、Timer、去重集合和 Serializer。扩磁盘不能替代状态生命周期设计。

## 高可用

- Kubernetes 使用受支持的 HA Service 和持久化 JobManager 元数据。
- Standalone/YARN 可使用 ZooKeeper HA，具体按版本文档配置。
- Checkpoint/Savepoint 位于可靠共享存储并跨故障域。
- Kafka、对象存储、Catalog、Sink 数据库也要高可用。
- Job 制品、配置和 Connector 可重建，不能只备份 JobManager 本地目录。

## 容量与性能

- Source Partition 决定可用输入并行上限之一。
- KeyBy 后热点 Key 只能由一个 Key Group/Subtask 处理，需改 Key 或拆热点。
- Slot、CPU、内存、Managed Memory、Network Buffer 和 State Backend 一起估算。
- RocksDB/ForSt 类状态后端与 Heap State 的延迟、容量和运维取舍不同，以目标版本文档为准。
- Checkpoint 带宽必须小于存储持续能力，并预留业务 I/O。
- Sink 并行度和批量不能压垮数据库、搜索或工单 API。

## 安全

- REST/Web UI、SQL Gateway、Job 提交和对象存储启用认证与 TLS。
- Kubernetes RBAC/YARN Queue/Kerberos 使用最小权限。
- Connector Secret 通过 Secret 管理，不写 SQL、JAR 或日志。
- 任意用户上传 JAR 等于代码执行权限，需要制品来源与漏洞治理。
- State/Checkpoint 可能含业务数据，必须加密、授权和设置保留策略。

## 可观测性与 AIOps

重点指标：

- Job uptime、restart count、failed checkpoint。
- records in/out、bytes in/out、current input watermark。
- busy/idle/backpressured time。
- checkpoint duration、size、alignment、start delay。
- state size、timer count、managed memory。
- Kafka lag、source idle、sink latency/error。
- JVM Heap、GC、CPU、Network Buffer、TaskManager loss。

```text
cluster + job_id + job_name + operator_uid
  + vertex_id + subtask_index + attempt
  + checkpoint_id + source_partition + sink
  + artifact_version + config_version
```

AIOps 可做反压根因关联、Checkpoint 异常检测和容量预测，但自动 Cancel/Rescale/从 Savepoint 恢复会改变状态和输出，必须审批与验证。

## 常见故障排查

### Job 反复 RESTARTING

找第一次异常而不是最后一次重试信息，检查用户代码、Connector、序列化、资源和 Restart Strategy。

### Watermark 不推进

按 Source Partition 查看 Watermark 与空闲状态，确认是否有空闲分区、坏 Timestamp、时区或反压。

### Sink 重复写

确认 Checkpoint 成功边界、Sink 两阶段提交/幂等键、事务超时和重试。不能只看 Flink Job 状态。

### TaskManager OOM

区分 JVM Heap、Managed Memory、Direct/Network、Metaspace、Native 和容器限制，结合 Kill 原因和 GC。

### 状态恢复失败

检查 Savepoint 路径、权限、Operator UID、并行度最大值、Serializer/State Schema 和 Connector 版本。

### Kafka Lag 增长

比较 Source 读取、下游反压、并行度、Partition、Checkpoint 和 Sink。增加 Consumer 并行度超过 Partition 数不会继续提升输入并行。

## 升级与回滚

1. 固定稳定 Operator UID，保存作业制品和配置。
2. 触发 Savepoint 并验证完整路径与权限。
3. 在目标版本加载 Savepoint，验证 State/Serializer/Connector 兼容。
4. 对结果、Watermark、迟到数据、Checkpoint 和 Sink 副作用回归。
5. 灰度或双跑时防止同一 Consumer Group/Sink 重复写。
6. 回滚保留旧制品和旧版本可读取的 Savepoint；状态升级不可逆时要准备旁路迁移。

## 生产事故题：延迟上升但 CPU 不高

现象：Kafka Lag 增长，Flink CPU 只有 40%，Checkpoint Duration 从 20 秒升到 8 分钟。

处理：

1. 先看 Backpressure 图，从 Sink 逆向定位。
2. 对比各 Subtask，确认是否一个热点或外部数据库慢。
3. 关联 Checkpoint Alignment、State Size、Sink latency 和变更。
4. 形成假设，例如数据库连接池耗尽导致 Sink 阻塞。
5. 限制输入/保护下游，修复连接或批量策略，再逐步恢复。
6. 若调并行度，确认数据库容量、状态重分配、Savepoint 和回滚。

## 系统设计题

设计 Kafka -> Flink -> 湖仓与告警 API 的实时管道，要求 p99 端到端小于 30 秒、允许 2 分钟乱序、任务故障不丢状态、外部告警不重复。

答案要覆盖 Event Time、Watermark、Window、Key、State TTL、Checkpoint、Savepoint、Kafka Offset、事务/幂等 Sink、并行度、反压、HA、状态存储、安全、指标、升级和灾备。

## 选型取舍

- Flink vs Spark Structured Streaming：Flink 强调原生持续流和状态；Spark 与批、SQL、机器学习生态整合强。用延迟、状态、团队和生态压测选型。
- Flink vs Kafka Streams：Kafka Streams 更轻、嵌入应用且紧贴 Kafka；Flink 是独立分布式计算平台并支持更多 Source/Sink。
- Flink vs Storm：Flink 提供更完整的状态、事件时间、SQL 和批流能力；存量系统仍要考虑迁移成本。

## 面试怎么讲

### 30 秒版本

Flink 是状态化流处理引擎。JobManager 调度 Job，TaskManager 用 Slot 运行并行 Subtask；KeyBy 把相同 Key 送到同一实例维护 State。Checkpoint Barrier 对 Source Offset、算子状态和受支持 Sink 做一致快照，故障后从最近成功 Checkpoint 恢复。生产重点是 Watermark、状态、反压、Checkpoint 和端到端一致性。

### 3 分钟版本

1. 画 Client、JobManager、TaskManager、Slot 和 Operator。
2. 解释 Event Time、Watermark、Window 和 Late Data。
3. 解释 Keyed/Operator State 与 State Backend。
4. 画 Barrier、Checkpoint、恢复和 Savepoint。
5. 限定 Exactly-once 的 Source/State/Sink 边界。
6. 说明反压、倾斜、容量、HA、安全和升级。
7. 用 Job/Operator/Subtask/Checkpoint 指标形成证据链。

## 递进面试题

### 1. Watermark 为什么会卡住

多输入/多分区的全局 Watermark 受较慢输入约束；空闲分区、坏时间戳和反压都可能阻止推进。可配置 idleness，但要评估迟到语义。

### 2. Checkpoint 和 Savepoint 区别

Checkpoint 面向自动故障恢复、由 Flink 管理；Savepoint 面向用户控制的迁移升级。二者格式与生命周期能力按版本核对，不能互相当同义词。

### 3. Flink 如何实现 Exactly-once

通过一致 State Snapshot、可重放 Source 和支持事务/幂等的 Sink 协同。任何一端不支持，就只能得到更弱的端到端语义。

### 4. 反压怎么查

从最下游繁忙算子向上追，比较 Subtask、外部依赖、Key 分布、状态和 Checkpoint，不先全局加并行度。

### 5. 为什么 Operator UID 重要

Savepoint 用 UID 映射旧状态与新算子。随意更改会让恢复失败或丢弃状态。

## 学习检查清单

- [ ] 我能解释 JobManager、TaskManager、Slot、Operator 和 Subtask。
- [ ] 我能解释 Event Time、Watermark、Window 和 Late Data。
- [ ] 我能画出 Checkpoint Barrier 与故障恢复路径。
- [ ] 我能区分 Checkpoint、Savepoint 和业务备份。
- [ ] 我能运行 SQL 流作业并从 TaskManager 故障恢复。
- [ ] 我能分析反压、状态膨胀、Checkpoint 和 Sink 重复。
- [ ] 我能设计 HA、容量、安全、升级和回滚方案。

## 学习证据

```text
flink-lab/
  README.md                     # 版本、架构和实验边界
  compose.yaml                  # JobManager/TaskManager、Checkpoint 与重启配置
  job.sql                       # Datagen 窗口作业
  jobs-overview.json            # 脱敏 REST 结果
  checkpoint-evidence.json      # 成功与故障前后对比
  incident-taskmanager-stop.md  # 故障、恢复和重复语义观察
  production-design.md          # 状态、HA、安全、容量、升级
```

不要提交 Kafka 凭据、Checkpoint 业务数据、内部 REST 地址和真实事件。本文提供大厂平台/流计算面试所需的主线，但仍需 Java/SQL、Kafka、分布式系统、状态调优和生产演练。
