# Apache Flink 深讲

> 学习目标：从零理解 Flink 的 JobManager、TaskManager、Operator、Slot、State、Watermark、Checkpoint 和 Savepoint，能运行一个持续流作业并观察恢复，能分析反压、Checkpoint、状态膨胀、数据倾斜、序列化和 Connector 故障，并能回答状态一致性、Exactly-once、高可用、容量和升级的连续追问。

## 官方资料

先补三个词：流是不断到来的记录，状态是处理下一条记录时还需要记住的中间值，并行实例是同一逻辑的不同执行副本。前置只需 [SQL 基础](./mysql-sql.md) 的筛选与分组、[Docker Compose](../cloud-native/docker-compose.md) 的服务和数据卷。今天先看五秒窗口打印，再观察计算节点停止后的恢复；不需要先学习整套 Kubernetes。

- [Apache Flink 官网](https://flink.apache.org/)
- [Apache Flink 下载页](https://flink.apache.org/downloads/)
- [Flink 2.3 稳定版文档](https://nightlies.apache.org/flink/flink-docs-stable/)
- [Flink 架构](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/flink-architecture/)
- [Checkpoint](https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/checkpoints/)
- [Checkpoint 与 Savepoint](https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/checkpoints_vs_savepoints/)
- [生产就绪检查单](https://nightlies.apache.org/flink/flink-docs-stable/docs/deployment/production/)

版本边界：本文以 Apache Flink 2.3.0 稳定版为主线。Flink 1.20、2.0、2.1、2.2 等存量版本在 API、配置、Connector、State 和升级路径上存在差异，执行命令前必须选择与目标集群完全匹配的文档版本。

固定版本是教学复现条件，不代表以后继续使用这个首发补丁是安全的。生产需重新核对支持状态、安全公告和独立发布的连接器兼容矩阵；不要让会随时间移动的稳定版文档覆盖现场版本事实。

## 官方知识地图

```text
Apache Flink（有状态流处理引擎）
  -> API：Flink SQL（结构化查询语言）、Table API、DataStream API
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

地图中的 Table API 是表操作接口，DataStream API 是数据流编程接口；Processing Time、Event Time 分别是处理时间和事件时间。Keyed State 是按键保存的状态，Operator State 是算子状态，State Backend 管理计算中的状态，Barrier 是检查点屏障。StreamGraph、JobGraph、ExecutionGraph 分别表示流逻辑、提交作业与运行执行图；Operator Chain 是串联在同一执行任务中的算子链。箭头表达学习分层，不是某条数据每次经过的所有步骤。

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
SQL（结构化查询语言） Client（客户端） / Java Client（客户端）
  -> 构建逻辑拓扑
  -> StreamGraph / JobGraph（流逻辑图与作业图）
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
Checkpoint（检查点） Coordinator
  -> Source 注入 Barrier N
  -> Barrier 随数据流经过 Operator
  -> Operator 在一致位置 Snapshot State
  -> State 写入 Checkpoint Storage
  -> 事务 Sink 保存待提交信息，各 Task 确认快照完成
  -> Coordinator 确认 Checkpoint N 完成
  -> 受支持 Sink 据完成通知推进外部提交
```

这是常见事务接收端的简化过程，提交与恢复细节由具体连接器实现；不能把任意外部写入都画成检查点完成前已原子提交。Checkpoint Storage 是检查点持久存储，Coordinator 是协调者，Task Ack 表示任务确认快照阶段完成。

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
  'scan.startup.mode' = 'group-offsets',                -- 无恢复状态的新作业按消费组位点确定起点
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

从检查点或保存点恢复时，源的位置主要由恢复状态决定，不是每次都重新采用消费组的外部提交位点。上面的 Kafka 表还需要匹配版本的连接器及目标服务；它是生产配置讲解，不属于后文无外部依赖的 Datagen 实验。

## 配置重点

```yaml
jobmanager.rpc.address: jobmanager              # TaskManager 连接 JobManager 的地址
taskmanager.numberOfTaskSlots: 2                # 每个 TaskManager 的 Slot 数
parallelism.default: 2                          # 未显式指定时的默认并行度
execution.checkpointing.interval: 10s           # 每 10 秒触发 Checkpoint
execution.checkpointing.timeout: 2min           # 超时即失败，需结合状态和存储压测
execution.checkpointing.storage: filesystem          # 使用文件系统保存状态和元数据
execution.checkpointing.dir: file:///opt/flink/checkpoints # 仅实验；生产用可靠共享存储
execution.checkpointing.savepoint-dir: file:///opt/flink/savepoints # 保存点目录
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

运行位置是新的 `flink-classroom` 目录，只放下面两个文件；需要 Docker Desktop Linux 容器与 Compose，至少预留约四 GiB 可用内存和数 GiB 磁盘。启动前检查 `docker compose -p flink-classroom ps -a` 没有已有资源，`docker volume ls --filter name=flink-classroom_flink-state` 没有旧状态卷，本机 8081 未被占用。任一命中先确认归属，不覆盖或删除未知对象。

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
      - "127.0.0.1:8081:8081"            # 仅本机 Web UI 和 REST
    environment:
      FLINK_PROPERTIES: |
        jobmanager.rpc.address: jobmanager
        rest.bind-address: 0.0.0.0
        taskmanager.numberOfTaskSlots: 2
        parallelism.default: 1
        execution.checkpointing.interval: 5s
        execution.checkpointing.storage: filesystem
        execution.checkpointing.dir: file:///opt/flink/checkpoints
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
        execution.checkpointing.storage: filesystem
        execution.checkpointing.dir: file:///opt/flink/checkpoints
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
docker compose -p flink-classroom up --detach
docker compose -p flink-classroom ps

docker compose -p flink-classroom exec --detach jobmanager `
  ./bin/sql-client.sh `
  -f /opt/flink/usrlib/job.sql
```

`checkpoint-init` 只以 `root` 运行一次，把新命名卷交给镜像内 UID 9999 的 `flink` 用户；JobManager 和 TaskManager 仍以非 root 用户运行。不要为了绕过权限问题让整个计算集群长期以 root 运行。

打开 `http://localhost:8081`，确认 Job 为 RUNNING。执行：

```powershell
curl.exe --fail http://localhost:8081/jobs/overview
docker compose -p flink-classroom logs --tail 80 taskmanager
```

TaskManager 日志中的 `+I[...]` 是 Print Sink 的插入结果。生产不要使用 Print Sink 承载业务。

这里使用处理时间窗口，通常接近每五秒输出一个计数，起停边界、调度与恢复会使计数不固定为二十五。Datagen 的序列有一百万上限，因此这是足够课堂观察的长时间有界源，不是永不结束的真实事件流。检查点采用 2.3 配置中的 `execution.checkpointing.*` 目录键，不能照搬旧系列键名后只看进程启动成功。[对应版本配置](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/deployment/config/)。

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
docker compose -p flink-classroom stop taskmanager # 只停止本地实验 TaskManager
curl.exe --fail http://localhost:8081/jobs/overview
```

不同版本和调度阶段的顶层 Job 状态可能进入 `RESTARTING`/`FAILING`，也可能暂时保持 `RUNNING`。不要只看这一个字段：同时确认 `/overview` 中 TaskManager 和可用 Slot 变为 0，并在 Job 详情中观察 Vertex/Task 退回 `CREATED`、`SCHEDULED` 或 `DEPLOYING`，以及 Checkpoint 停止增长。

### 恢复

```powershell
docker compose -p flink-classroom start taskmanager
docker compose -p flink-classroom logs --tail 120 taskmanager
curl.exe --fail http://localhost:8081/jobs/overview
```

验证 TaskManager 重新注册、Job/Task 回到 RUNNING、Checkpoint 继续成功、Print Sink 重新产生窗口结果。记录短窗口、缺口或重复输出；Datagen 和 Print Sink 不提供端到端事务一致性，因此它们只用于观察恢复流程，不代表生产 Exactly-once Source/Sink。

### 清理

```powershell
docker compose -p flink-classroom down --volumes # 只删除本实验容器、网络和状态卷
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

我会以按服务统计错误率为例。客户端提交逻辑，协调节点安排执行，计算节点的并行实例接收事件。同一服务通过键分区进入对应状态，保存请求数、错误数和窗口；事件时间来自业务记录，水位线决定何时认为窗口可以输出，迟到数据按明确合同处理。

检查点把可重放输入位置和算子状态协调到一致边界，故障后从最近完成的检查点恢复并重算后续记录。外部工单并不会被状态恢复撤销，所以接收端要支持事务提交或业务幂等。保存点用于受控迁移，稳定算子标识和状态序列化兼容决定能否接续。

生产上我从接收端反查反压，比较每个并行实例，区分热点键、慢数据库和状态存储。容量不只看处理器，还包括状态、网络缓冲、检查点上传与恢复追赶。最后验证新旧数据结果、迟到计数、持续检查点和外部副作用，才说明恢复目标是否达成。

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

## 老师带你把一条迟到告警放回正确窗口

想象值班老师每五分钟统计一次缺勤。学生 10:04 离开教室，但报告在 10:06 才送到。按到达时间算会记入后一个窗口，按事件发生时间算则属于 10:00 到 10:05。Event Time（事件时间）正是为这种业务时间服务，Processing Time（处理时间）则是程序当前处理它的时刻。

学生：“那永远有人迟到，窗口是不是永远不能结束？”老师：“所以我们需要 Watermark（水位线），明确系统目前认为事件时间推进到哪里，而不是无限等待。”它是一种进度判断策略，不是承诺再也不会来更早事件。迟到数据要有侧输出、修正或丢弃并计数的约定，不能悄悄消失。

多个输入分区合流时，慢分区可能拖住整体进度。空闲检测可以避免长期没消息的分区阻挡，但它不能把真正网络故障变成正常空闲。检查窗口不出结果时，先看输入事件时间、水位线、空闲分区和时区，再看 CPU。一个时间戳误写成未来一年，也可能让后续正常事件被视作过迟。

### State 和 Checkpoint 为什么要一起理解

统计最近五分钟错误率，必须记住分母请求数与分子错误数，这些中间值是 State（状态）。`keyBy(service)` 让同服务数据进入对应并行实例，状态才不会分散失控；热点服务也可能因此限制并行。状态要定义生命周期，窗口关闭和 TTL（存活时间）控制不能只靠“内存迟早会回收”。

Checkpoint（检查点）不是分别给每个进程随便拍一张照片。它协调输入位置与算子状态，保证恢复后不会一部分记到第 100 条、一部分只记到第 80 条却无法解释。Barrier（检查点屏障）沿数据流传递，在相关边界上形成一致切面；反压严重时，对齐等待或在途数据保存会影响耗时与大小。

Source（输入端）恢复到已保存的位置，状态恢复到同一检查点，重新处理之后的数据。外部 HTTP 写工单并不会因为 Flink 状态恢复就自动撤销，所以必须有业务幂等键或合适输出提交协议。回答 exactly-once（精确一次）时先圈出保障边界，是面试里的关键。

### 跟着实验观察，别只看 RUNNING

运行前文基础作业后，记录已处理数量、最新成功检查点编号、状态大小与输出结果。完成前文停止/恢复实验，再核对恢复使用哪个检查点、输入从哪里继续、输出有没有重复。预期是符合所选 Source/Sink 的声明语义；不能仅凭作业变成 RUNNING 就宣称数据完全正确。

可增加一个不修改集群的推理练习：让某服务的全部事件使用同一个 key，估计哪一个并行实例会承载它；再比较 UI 中该实例的输入速率、忙碌比例和其他实例。小样本用于观察映射，不代表大规模倾斜压测。清理保留检查点证据后按原实验命名资源执行，不能顺手删掉共享检查点根目录。

### 反压课堂：最忙的地方可能在最下游

数据库写入每秒只能 1,000 条，输入每秒 5,000 条，缓冲最终填满，压力沿上游传播，这叫 Backpressure（反压）。上游读得慢可能是保护作用，不一定是 Kafka 或源端出故障。定位从 Sink 往前找第一个忙碌或等待资源的阶段，再核对 SQL、连接池、序列化和网络。

扩大缓冲只能推迟耗尽，不能增加长期处理能力。并行度提高也受分区数、热点键、外部吞吐与状态迁移限制。恢复预算应计算状态下载、任务初始化、历史追赶和当前新增速率；如果追赶能力不超过输入，RTO（恢复时间目标）就没有实现依据。

### 升级与面试课堂

Savepoint（人工管理的保存点）适合受控迁移，但状态映射依赖稳定算子 UID（身份标识）、序列化格式与并行度规则。删除一个带状态算子、新增状态字段或换连接器，都要在隔离环境真实恢复验证；旧程序是否能读新状态也决定回滚是否成立。

30 秒回答强调持续计算、事件时间、状态和恢复。3 分钟用五分钟错误率讲输入、键控状态、窗口、水位线、检查点和输出，再给出迟到处理与外部幂等。追问“作业健康却没告警”，用输入—水位线—窗口—输出逐段排查；事故题设置 Sink 升级变慢，先回退坏版本并限制恢复并发，最后验证检查点和业务结果同时正常。

## 流处理机制加深：状态为什么必须和输入位置一起恢复

### 用计数器理解 Checkpoint

假设一个算子已经读到消息位置 100，累计告警计数为 10。故障后若输入从 101 继续，状态却恢复成位置 80 时的计数，就漏掉一段结果；若状态保留到 100，却输入从 81 重放而没有一致恢复，又可能重复计数。Checkpoint（检查点）要协调状态和可恢复输入位置，让它们对应同一个一致切面，而不只是定时复制一份内存。

Barrier（屏障标记）沿数据流传播，帮助算子界定检查点边界。多输入算子需要处理不同输入通道屏障到达的关系。对齐等待会在反压时拖长检查点；非对齐检查点可以把在途数据纳入快照，但会增加需要保存和恢复的数据，且支持与配置要按版本核对。不能把一种模式宣传成对所有任务都更快。

“检查点成功”主要证明运行时完成了该快照协议，不自动证明任意下游 HTTP 动作恰好执行一次。端到端语义还依赖源可重放、状态恢复、sink（结果接收端）的事务或幂等能力，以及外部副作用边界。写工单接口不支持幂等时，即使 Flink 状态恢复正确，重放仍可能再次建单。

### 状态大小为何越跑越大

Keyed State（按键状态）像按设备分格子的抽屉，记录各设备窗口、计数或历史。键数量增长、窗口迟迟不关闭、状态没有过期或业务保存全部原始记录，都可能使抽屉越积越多。TTL（状态生存时间）能限制保留，但过期策略、可见性和实际清理时机需要按状态后端与版本理解，不能把过期时间当成瞬间回收全部磁盘的承诺。

迟到允许范围扩大，通常意味着需要保留更多窗口状态；一条异常远未来时间戳又可能改变水位线与迟到判断。排障先观察事件时间分布、输入水位线、活动键数、窗口积压与状态字节，再决定是修时间合同还是调资源。把所有迟到数据直接丢掉会让结果更快，却可能改变业务完整性，必须由业务接受并计数。

调整并行度也涉及状态重新分配，不是只多启动几个进程。按键状态需要在新旧并行实例之间映射，稳定算子 UID 和兼容的序列化格式有助于恢复。升级时删除或改名算子、改变状态类型、改变最大并行约束，都应在保存点副本上演练。控制台启动成功后还要验证历史状态是否接续，不可用从零计数冒充恢复。

### 反压为什么从下游传回来

下游数据库每秒只能写一千行，上游算子每秒产生三千行，缓冲用尽后上游就必须等。这种等待是保护系统的信号，不一定是等待的那个算子代码慢。观察整条作业图：哪个算子忙、哪个算子反压、哪里的输出吞吐先下降，结合外部依赖延迟找到起点。

增加上游并行度可能把更多压力送到同一个数据库，使整体更差。正确顺序是确认瓶颈、估算外部预算、调整批量或分区、限制输入或增加经过验证的下游能力。任务恢复时历史数据追赶和实时数据共享资源，需要留出余量；若净处理速率没有超过输入速率，积压在数学上就不会消失。

## 教学实验的读数方法

前文停止 TaskManager 的故障实验开始前，保存作业编号、最近成功检查点、输入和输出速率。故障后记录状态变化、重启次数、恢复检查点和恢复所需时间；恢复后观察新检查点持续成功，而不是只出现一次 RUNNING。这样才能区分“重新提交了空状态作业”和“从已有状态恢复”。

Datagen（合成数据发生器）与 print sink（打印输出端）方便入门，但不能证明真实 Kafka 源与事务数据库接收端的端到端精确一次。日志可能在重启后重复展示部分输出，且生成源的可恢复语义要看连接器能力。因此本课用它验证部署、检查点与恢复过程，不宣称每条业务消息都已验证不重不漏。

如果恢复失败，先核对检查点存储仍存在、容器权限、作业参数与算子状态兼容，再检查资源和重启策略。不要先删除 checkpoint 目录让作业从头开始，因为这会改变状态恢复目标。教学清理只能使用前文明示的项目与卷；生产旧检查点是否可回收，应与恢复窗口、版本和保存点策略一起评审。

## 连续面试题：窗口不出结果，系统却很空闲

先回答事件时间由输入决定，水位线推进受通道影响，CPU 空闲不能证明业务时钟正常。检查是否某输入分区无数据且未合理标记空闲，或者时间字段单位、时区和解析错误；再看窗口定义、迟到策略与上游速率。若业务时间正常但输出慢，才进一步转查反压和接收端。

追问“把水位线调快可以吗”：更快意味着少等迟到数据，可能牺牲完整性；应衡量真实乱序分布、允许延迟与补偿途径。追问“怎样验证”：用一组包含按时、乱序、迟到、空闲恢复的合成事件，给出每个窗口预期计数和侧输出数量。最后说明状态恢复、业务正确性和延迟目标是三份验收，不是一条进程健康状态。

## 实战加深：把五分钟错误率拆成四份合同

### 时间合同：乱序等待和允许迟到不是同一个参数

事件时间水位策略决定进度怎样从输入时间推导，窗口允许迟到则决定初次触发后是否继续接受旧窗口的数据。把水位延后半分钟，不等于所有窗口再额外保留半分钟；不同接口和窗口算子的迟到处理能力也不同。SQL 的窗口表函数与 DataStream 窗口不能不加区分地套用同一组参数。

业务应先说清初步结果什么时候需要、允许多大修正、最终结果如何发布。如果告警要求三十秒内响应，而最终完整统计要求等待两分钟乱序，单个最终结果不可能同时满足这两个目标。可以设计快速预警与较晚确认两层，给初步结果标注版本，并用撤回或更新协议修正。

水位不是计时器按墙钟自然走。上游完全停流时，某些事件时间窗口可能一直没有足够进度触发；把它当成“过五分钟必定发报表”会误判。要监控输入空闲、水位滞后和业务数据完整性，必要时设计明确的结束信号或补算流程，而不是伪造未来事件推动时间。

再想一个反例：分区甲持续产生当前事件，分区乙还在补昨晚数据。整体进度受慢输入约束，甲的窗口状态可能增加。把乙标为空闲可以推进进度，却不是免费优化：它恢复后带来的旧事件可能已经超过有效窗口。必须先判定乙是真的暂时无数据，还是仍有重要积压。

### 手工事件实验：亲自算出哪些数据晚了

这是一项离线生产语义模拟，不启动 Flink。准备表格，列出事件编号、事件秒数、到达顺序和窗口。设窗口为零到十秒、十到二十秒，左边包含右边不包含；进度规则简化为已见最大事件秒数减二，窗口在水位达到结束边界时关闭，关闭后到达的旧窗口记录单独计数。

依次输入事件秒数二、八、六、十二、九。处理前三条时最大值八、水位六，零到十秒窗口累计三条。第四条属于十到二十秒，最大值十二、水位十，前一个窗口输出三。第五条九秒虽然刚到，但旧窗口已经关闭，应进入迟到记录，不能悄悄改成当前时间。

故障注入是把第四条的十二误写成一百二十。它会让教学水位骤升，更多正常事件可能被判为过迟。修复不是把乱序预算无限扩大，而是检查时间单位、来源时钟和异常时间范围；恢复原十二重新推演，应得到前窗三条、后窗一条、迟到一条。

验收保存五条输入、每步水位和两种结果。清理只删这张合成表。这个模型刻意忽略周期水位生成、毫秒边界、多输入最小值和不同窗口实现，不能声称验证了 Flink 的精确触发时序；它验证的是事件时间与到达时间的概念。真实连接器应使用同类带边界的输入进行隔离测试。

### 状态合同：保存的是聚合值还是整段历史

计算计数和求和通常可以增量维护少量状态，每来一条更新数值。若为计算同样结果把窗口全部原始记录放进列表，状态量会随输入速率和窗口长度增长。读者应该先写出需要保留的信息，再选择状态结构，不是先找一种后端就认为容量问题已经解决。

滑动窗口会让同一事件影响多个窗口。窗口长度十分钟、每分钟滑动一次，概念上一个事件可能参与多个重叠结果，状态与计算成本和不重叠窗口不同。实现可能复用中间结果，但不能无条件用滚动窗口的容量估算代替实际计划。

规则广播是另一种状态。所有并行实例收到规则更新，不代表更新和业务事件天然具有跨输入的全局顺序。如果规则版本影响结果，就记录每次判断使用的规则版本，明确相同事件重放时是采用历史规则还是当前规则。否则故障恢复后结果变化可能来自规则变动，而非状态损坏。

定时器也占状态和恢复工作量。每事件注册一个不同时间的定时器，可能产生远多于业务键数的管理对象。先确认是否可以按键和时间粒度合并，观察定时器数量与触发耗时；不能只统计用户状态字节就宣称内存使用可控。

### 检查点合同：运行态与恢复介质分别负责什么

状态后端决定运行期间怎样访问状态，检查点存储决定恢复文件放在哪里。换成磁盘型状态后端，不代表本地磁盘损坏后仍能恢复；把检查点放对象存储，也不会让每次运行态访问都自动变成远程读取。两者要分别说明延迟、容量和故障域。

增量检查点可能复用已有状态文件，某次新上传字节小不等于完整恢复只需这些字节。人工删除看似旧的共享文件可能破坏多个恢复点。必须让受支持的生命周期管理处理引用关系，保存点和外置检查点的保留责任也要明确。

看检查点变慢时，先区分触发后等待屏障、同步快照阶段、异步上传和最终完成。对齐时间很长常伴随通道不均或反压；上传很慢则要检查存储权限、带宽和状态变化量。单纯加超时可以暂缓失败，却可能让可恢复进度越来越旧。

假设每次要新上传六 GiB，存储有效带宽一百 MiB 每秒，仅传输理论上就需六十一点四四秒。把间隔设成十秒不代表每十秒都有一个成功检查点，实际还受并发限制与暂停策略。要让恢复目标落地，需同时减少变化状态、提高可靠带宽或放宽恢复窗口。

### 输出合同：更新流不是普通追加流

持续聚合可能产生更新和撤回，而不是每次只新增一条永不改变的记录。接收端如果只会追加，就可能把同一个服务窗口的多个版本都当成独立事实。先看 SQL 结果的变更日志类型，再选择支持相应写入语义的连接器和主键。

窗口结果可以用服务名、窗口起止和计算版本构成业务身份，更新时替换同一逻辑结果；审计需求则另外追加版本记录。二者的存储模型不同，不能只为消除重复而删除历史。告警发送还要判断是新告警、升级、恢复还是结果修正，避免每次重算都重新通知。

事务接收端常把检查点与外部提交关联，外部事务的最大允许时间应覆盖合理的检查点、故障恢复与延迟。具体连接器如何恢复未完成提交必须按版本验证。普通 HTTP 请求没有这些机制，不能靠给函数起名为事务就获得相同保证。

### 状态恢复和追赶的容量预算

恢复时间包含资源申请、制品下载、状态恢复、任务初始化与输入追赶。状态能下载完成，只是开始继续处理；业务是否追平还取决于完成速率是否超过新输入。把第一条新日志出现的时间当作完整恢复时间，会漏掉后面数小时的历史积压。

举例每秒新增两万条，故障十分钟积压一千二百万条，恢复后安全处理三万条，净减少一万条每秒，至少还需二十分钟追赶。若下游只允许每秒两万条，理论上永远追不平。这个结果与作业是否显示运行无关，解决必须涉及上游、计算或下游的能力和降级选择。

内存诊断先分堆、托管状态内存、网络直接内存、元空间、线程和其他原生分配。容器被杀而堆并不高，不能只改堆上限；改大堆还可能挤压同一进程预算中的其他区域。结合退出原因、进程总内存和各子系统指标，才能选择有依据的参数调整。

任务槽不是独占处理器核。算子链、资源共享组和任务并行度一起决定实际调度，多个算子可以共享槽资源。调大槽数会增加并发，但不凭空增加总 CPU、内存或网络预算。热点键依然要由对应实例串行处理，更多空闲槽不能拆开其语义。

最后补一个常见观测误区：输入记录数和输出记录数不总应该相等。过滤会减少，连接可能放大，窗口聚合会把很多记录合成少量结果，展开操作可能增加。为每个算子写出预期数量关系，才能把正常数据变换与丢失区分；单纯报警“流入不等于流出”会制造大量无效告警。

### 安全与变更要保护状态中的业务数据

作业提交意味着允许执行用户代码，因此提交权限、制品来源与运行账号权限应联合控制。即使管理界面只在内网，拥有提交能力的人仍可能访问运行账号能读取的数据。检查点也可能保存原始用户字段、模型特征或连接状态，不能直接上传到公开仓库作证据。

凭据轮换要覆盖源、接收端与状态存储。正在运行的任务能继续访问，不代表下一次重启能获得同样凭据；保存点恢复时可能才暴露历史配置缺失。轮换验收包括新连接和恢复路径，而不仅是已有长连接没有断开。

作业升级先固定身份映射，再核对状态类型、键序列化、连接器与外部表结构。允许丢弃无法映射状态的选项是明确的数据决策，不能当作恢复报错的通用开关。若一个去重算子的状态被丢弃，作业也许成功启动，但会再次通知大量历史事件。

回退方案需列清旧制品可以读取哪个恢复点、那个点之后外部系统已发生哪些结果、重放是否幂等。两个版本双跑应隔离输出或明确只有一个能产生副作用，不能为了对照性能向同一工单接口各写一遍。技术验证和业务权限边界必须一起成立。

### 事故复盘的连续追问

问题：水位正常推进、输入稳定、检查点也成功，但告警结果变少，怎么办？先查过滤条件、空值解析、规则版本、迟到计数与接收端失败，而不是自动重启计算节点。检查点成功说明恢复协议完成，不证明业务逻辑正确。

追问：升级后为何只有某些服务变慢？比较每实例输入量、键分布、状态访问和接收端目标，不看全局平均。若单一大服务在一个键上形成热点，应确认是否允许分阶段聚合或拆分业务键；拆键会改变顺序和状态边界，不能作为无风险扩容。

最终验收至少回答三件事：结果是否按相同口径正确，故障后是否恢复同一状态历史，端到端时延是否满足目标。报告里把纸面演练、静态配置检查和实际运行分别记录；本文给出可执行课堂步骤，没有声称已经在读者的机器或生产集群通过这些验证。

## 本课 GitHub 学习证据

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
