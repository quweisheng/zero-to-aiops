# Kafka

> 目标：不是只会启动一个 producer/consumer，而是能理解 Kafka 为什么是分布式事件流平台，掌握 event、topic、partition、offset、broker、producer、consumer、consumer group、replication、retention、lag、KRaft、Connect、Streams、配置、命令和 AIOps 数据管道设计。

## 官方资料

优先读这些 Apache Kafka 官方资料：

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Apache Kafka Quickstart](https://kafka.apache.org/quickstart/)
- [Apache Kafka 4.3 Introduction](https://kafka.apache.org/43/getting-started/introduction/)
- [Apache Kafka 4.3 Basic Kafka Operations](https://kafka.apache.org/43/operations/basic-kafka-operations/)
- [Apache Kafka 4.3 Broker Configs](https://kafka.apache.org/43/generated/kafka_config.html)
- [Apache Kafka 4.3 Topic Configs](https://kafka.apache.org/43/generated/topic_config.html)
- [Apache Kafka 4.3 Producer Configs](https://kafka.apache.org/43/generated/producer_config.html)
- [Apache Kafka 4.3 Consumer Configs](https://kafka.apache.org/43/generated/consumer_config.html)
- [Apache Kafka 4.3 Security Overview](https://kafka.apache.org/43/security/security/)
- [Apache Kafka Connect](https://kafka.apache.org/43/connect/)
- [Apache Kafka Streams](https://kafka.apache.org/43/streams/)

说明：本文按 Apache Kafka 官方文档结构整理，用 AIOps 场景重新讲解，不复制官方全文。

## 场景开场

一个 AIOps 系统里，会持续发生很多事件：

```text
Alertmanager 产生告警
日志解析器提取错误事件
CI/CD 系统产生发布事件
Prometheus 规则产生异常事件
Runbook 系统产生自动化执行记录
值班系统产生人工处理反馈
```

如果每个系统都直接调用其他系统，链路会很快缠在一起：

```text
Alertmanager -> 通知服务
Alertmanager -> 事故服务
Alertmanager -> LLM 分析服务
Alertmanager -> MySQL 写入服务
日志服务 -> LLM 分析服务
发布系统 -> 事故服务
...
```

这会带来几个问题：

- 上游必须知道所有下游。
- 下游慢了会影响上游。
- 新增一个分析服务要改很多地方。
- 事件处理失败后不好重放。
- 昨天的告警流不能拿来重新跑新算法。

Kafka 的价值，是把事件放进一个可持久、可订阅、可回放、可扩展的事件流平台：

```text
producers（生产者）
  -> Kafka topics（Kafka 主题）
  -> many independent consumer groups（多个独立消费组）
```

生产者只负责写事件。消费者按自己的节奏读事件。多个系统可以独立消费同一批事件。

## 一句话人话版

Kafka 是分布式事件流平台：生产者把事件写入 topic，topic 被拆成 partition 并持久保存，消费者用 consumer group 按 offset 读取事件，从而让多个系统解耦、并行、可回放地处理数据流。

## 小白可能会问

- Kafka 是消息队列吗？为什么官方叫事件流平台？
- event、record、message 是不是一个东西？
- topic 像什么？partition 又像什么？
- offset 是谁维护的？为什么可以重放？
- 一个 topic 多个 consumer 会不会抢同一条消息？
- consumer group 怎么实现并行？
- partition 数越多越好吗？
- 为什么同一个 key 的事件会进同一个 partition？
- replication factor、leader、ISR 是什么？
- retention 到期后消息会不会被删除？
- consumer lag 变大说明什么？
- Kafka 和 Redis Stream 有什么区别？

## 官方知识地图

Kafka 官方文档可以按这张地图理解：

```text
Apache Kafka（持久事件流平台）
  -> Get Started（入门）
     -> Introduction（简介）
     -> Quickstart（快速开始）
     -> Use Cases（使用场景）
     -> KRaft vs ZooKeeper（自管元数据模式与旧协调模式）
     -> Docker（容器运行工具）
  -> Core Concepts（核心概念）
     -> event（事件） / record（记录） / message（消息）
     -> topic（主题）
     -> partition（分区）
     -> offset（日志位置）
     -> producer（生产者）
     -> consumer（消费者）
     -> consumer group（消费组）
     -> broker（消息服务节点）
     -> replication（复制）
     -> retention（保留策略）
  -> APIs（编程接口）
     -> Admin API（管理接口）
     -> Producer API（生产接口）
     -> Consumer API（消费接口）
     -> Kafka Streams API（流处理接口）
     -> Kafka Connect API（数据连接接口）
  -> Configuration（配置）
     -> broker configs（节点配置）
     -> topic configs（主题配置）
     -> producer configs（生产端配置）
     -> consumer configs（消费端配置）
     -> group configs（消费组配置）
  -> Operations（运维操作）
     -> topic operations（主题操作）
     -> partitions（分区）
     -> graceful shutdown（平稳停机）
     -> monitoring（监控）
     -> KRaft（Kafka 内置元数据共识机制）
     -> tiered storage（分层存储）
     -> rebalance protocol（消费分工重平衡协议）
  -> Security（安全）
     -> listeners（监听地址配置）
     -> TLS（传输层加密） / SSL（旧称安全套接层）
     -> SASL（可插拔认证框架）
     -> ACL（访问控制列表）
  -> Ecosystem（生态）
     -> Kafka Connect（数据连接框架）
     -> Kafka Streams（流处理库）
     -> clients（客户端）
```

初学主线：

```text
Quickstart（快速开始）
  -> create topic（创建主题）
  -> produce events（生产事件）
  -> consume events（消费事件）
  -> topic（主题） / partition（分区） / offset（日志位置）
  -> consumer group（消费组）
  -> replication（复制） / retention（保留策略）
  -> lag and troubleshooting（积压与故障排查）
  -> AIOps event pipeline（智能运维事件链）
```

## Kafka 在 AIOps 链路中的位置

Kafka 适合做 AIOps 的事件总线：

```text
Event sources（事件来源）
  -> Alertmanager（告警管理器）
  -> log parser（日志解析器）
  -> CI/CD deployment event（持续集成与交付的部署事件）
  -> runbook execution event（操作手册执行事件）
  -> user feedback（用户反馈）

Kafka topics（Kafka 主题）
  -> aiops-alerts（教学告警主题）
  -> aiops-log-events（教学日志事件主题）
  -> aiops-deployments（教学部署事件主题）
  -> aiops-runbook-events（教学操作手册执行事件主题）
  -> aiops-feedback（教学反馈主题）

Consumer groups（消费组）
  -> anomaly-detector（异常检测消费者）
  -> alert-enricher（告警上下文补充消费者）
  -> incident-writer（故障记录写入消费者）
  -> notification-worker（通知消费者）
  -> llm-triage-worker（模型分诊消费者）
  -> feature-builder（特征构建消费者）
```

Kafka 负责“事件流动和可回放”。MySQL 负责“长期结构化事实”。Redis 负责“短期状态和缓存”。Prometheus/Loki 负责“指标和日志原始信号”。

## Kafka 是什么

Kafka 官方把 Kafka 描述为 event streaming platform。

它有三类核心能力：

1. 发布和订阅事件流。
2. 持久、可靠地存储事件流。
3. 实时或事后处理事件流。

这比“消息队列”更宽。

传统队列里，一条消息常常被消费后就消失。Kafka 的核心抽象更像“可追加日志”：

```text
partition log（分区日志）
  offset（日志位置） 0 -> event（事件）
  offset（日志位置） 1 -> event（事件）
  offset（日志位置） 2 -> event（事件）
  offset（日志位置） 3 -> event（事件）
```

消费者不是把消息拿走，而是记录自己读到了哪个 offset。

所以同一批事件可以被不同消费组读取多次，也可以在保留期内回放。

## 核心概念

### Event / Record / Message

Kafka 文档里 event、record、message 经常表示同一类东西：发生过的一件事。

一个事件通常包含：

```json
{
  "key": "order-api",
  "value": {
    "alert": "HighErrorRate",
    "severity": "critical"
  },
  "timestamp": "2026-07-02T10:20:00Z",
  "headers": {
    "source": "alertmanager"
  }
}
```

| 部分 | 意思 | AIOps 例子 |
|---|---|---|
| key | 分区键 | `service_name` |
| value | 事件内容 | 告警 JSON |
| timestamp | 事件时间 | 告警触发时间 |
| headers | 元数据 | 来源、trace id、schema version |

### Topic

Topic 是事件分类。

```text
aiops-alerts
aiops-deployments
aiops-log-events
aiops-feedback
```

你可以粗略把 topic 理解成文件夹，但更准确地说：

```text
topic = 多个 partition log 的逻辑名字
```

### Partition

Partition 是 topic 的分片日志。

```text
topic: aiops-alerts
  partition 0: offset 0, 1, 2...
  partition 1: offset 0, 1, 2...
  partition 2: offset 0, 1, 2...
```

Partition 的意义：

- 提高写入吞吐。
- 让 broker 分摊数据。
- 让消费者并行处理。
- 保证单个 partition 内有序。

Kafka 不保证整个 topic 全局有序，只保证同一个 partition 内按写入顺序读取。

### Offset

Offset 是事件在某个 partition 里的位置。

```text
partition 0
  offset 0
  offset 1
  offset 2
```

注意：offset 只在 partition 内有意义。

`partition 0 offset 5` 和 `partition 1 offset 5` 是两条不同事件。

### Broker

Broker 是 Kafka 服务节点。

一个 Kafka 集群由多个 broker 组成：

```text
broker 0
broker 1
broker 2
```

每个 broker 负责一些 partition 的存储和读写。

### Producer

Producer 是写事件的客户端。

它决定：

- 写哪个 topic。
- 事件 key 是什么。
- value 如何序列化。
- 需要多少确认。
- 失败是否重试。

### Consumer

Consumer 是读事件的客户端。

它决定：

- 订阅哪个 topic。
- 属于哪个 group。
- 从哪里开始读。
- 何时提交 offset。
- 处理失败如何重试。

### Consumer Group

Consumer group 是一组共同完成同一个逻辑任务的消费者。

同一个 group 内：

```text
一个 partition 同一时间只分配给 group 内一个 consumer
```

不同 group 之间：

```text
可以独立消费同一个 topic
```

例子：

```text
topic: aiops-alerts（主题名为教学告警流）

consumer（消费者） group: notification-worker
  -> 负责发通知

consumer（消费者） group: incident-writer
  -> 负责写 MySQL

consumer（消费者） group: llm-triage-worker
  -> 负责生成排障摘要
```

这三个 group 都能读同一批告警事件，互不影响。

## 架构

```text
producers（生产者）
  -> Kafka cluster（Kafka 集群）
      broker（消息服务节点） 0
      broker（消息服务节点） 1
      broker（消息服务节点） 2
        topic（主题） aiops-alerts
          partition（分区） 0 leader（主副本） + replicas（副本）
          partition（分区） 1 leader（主副本） + replicas（副本）
          partition（分区） 2 leader（主副本） + replicas（副本）
  -> consumers（消费者）
      group（分组） notification-worker
      group（分组） incident-writer
      group（分组） anomaly-detector
```

### Leader 和 Replica

Partition 可以有多个副本。

```text
partition 0
  leader: broker 0
  replica: broker 1
  replica: broker 2
```

Producer/consumer 通常和 leader 交互。Follower replica 复制 leader 的数据。

### Replication Factor

Replication factor 表示每个 partition 有几份副本。

```bash
--replication-factor 3
```

含义：每个 partition 保留三份。

生产常见值是 3。学习单机实验只能用 1。

### ISR

ISR 是 in-sync replicas，同步副本集合。

如果一个 replica 跟不上 leader，它可能被移出 ISR。

生产可靠性常和这些配置一起看：

- `acks`
- `min.insync.replicas`
- `replication.factor`

## 安装和启动

Kafka 官方 quickstart 当前给了两种学习方式：下载二进制包运行脚本，或使用官方 Docker 镜像。

### Docker 启动

```bash
docker run -p 127.0.0.1:9092:9092 apache/kafka:4.3.1
```

Native 镜像：

```bash
docker run -p 127.0.0.1:9092:9092 apache/kafka-native:4.3.1
```

### 下载包启动

需要 Java 17+。

```bash
tar -xzf kafka_2.13-4.3.1.tgz
cd kafka_2.13-4.3.1
```

生成 cluster id：

```bash
KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"
```

格式化存储目录：

```bash
bin/kafka-storage.sh format --standalone -t "$KAFKA_CLUSTER_ID" -c config/server.properties
```

启动：

```bash
bin/kafka-server-start.sh config/server.properties
```

Windows 可以使用对应 `.bat` 脚本，也可以在 WSL 里跑。

### KRaft 和 ZooKeeper

新版本 Kafka 默认使用 KRaft，不再需要 ZooKeeper。

粗略理解：

```text
ZooKeeper 模式
  -> ZooKeeper 管理元数据和控制面

KRaft 模式
  -> Kafka 自己管理元数据和控制面
```

初学阶段按官方 quickstart 使用 KRaft 即可。需要维护旧版 Kafka、HBase、SolrCloud 或其他协调服务依赖时，再学习 [Apache ZooKeeper](./zookeeper.md) 的 Session、Watch、Quorum 和迁移边界。

## 第一个 Kafka 实验

### 创建 topic

```bash
bin/kafka-topics.sh --create \
  --topic aiops-alerts \
  --bootstrap-server localhost:9092
```

查看：

```bash
bin/kafka-topics.sh --describe \
  --topic aiops-alerts \
  --bootstrap-server localhost:9092
```

你会看到：

```text
Topic: aiops-alerts
PartitionCount: ...
ReplicationFactor: ...
Partition: 0
Leader: ...
Replicas: ...
Isr: ...
```

字段解释：

| 字段 | 意思 |
|---|---|
| `PartitionCount` | 分区数 |
| `ReplicationFactor` | 副本数 |
| `Leader` | 当前 leader broker |
| `Replicas` | 所有副本 |
| `Isr` | 同步副本 |

### 写入事件

```bash
bin/kafka-console-producer.sh \
  --topic aiops-alerts \
  --bootstrap-server localhost:9092
```

输入：

```json
{"service":"order-api","severity":"critical","alert":"HighErrorRate","value":0.23}
{"service":"payment-api","severity":"warning","alert":"HighLatency","value":1200}
```

默认情况下，每一行是一条事件。

### 读取事件

```bash
bin/kafka-console-consumer.sh \
  --topic aiops-alerts \
  --from-beginning \
  --bootstrap-server localhost:9092
```

`--from-beginning` 表示从最早可用事件开始读。

如果不加，通常只会读启动 consumer 后的新事件。

### 再开一个 consumer

再运行一次同样命令，你仍然可以读到事件。

这说明：

```text
Kafka 事件不会因为某个 consumer 读过就立刻消失
```

它会按 retention 保留。

## Topic 和 Partition 深讲

### 创建多分区 topic

```bash
bin/kafka-topics.sh --create \
  --topic aiops-log-events \
  --partitions 3 \
  --replication-factor 1 \
  --bootstrap-server localhost:9092
```

### partition 决定并行度

如果一个 topic 有 3 个 partition，一个 consumer group 最多可以让 3 个 consumer 并行处理这个 topic。

```text
partition（分区） 0 -> consumer（消费者） A
partition（分区） 1 -> consumer（消费者） B
partition（分区） 2 -> consumer（消费者） C
```

如果 group 里有 5 个 consumer，但 topic 只有 3 个 partition，则最多 3 个 consumer 有活干，另外 2 个空闲。

### partition key

Producer 写事件时可以带 key。

同一个 key 通常会进入同一个 partition。

AIOps 常用 key：

- `service_name`
- `instance`
- `cluster`
- `tenant`
- `alert_fingerprint`

如果要保证同一个服务的告警顺序，用 `service_name` 做 key。

代价是：某个服务特别热时，可能造成单 partition 热点。

### 增加 partition 的风险

可以增加分区：

```bash
bin/kafka-topics.sh --alter \
  --topic aiops-alerts \
  --partitions 6 \
  --bootstrap-server localhost:9092
```

但要注意：

- Kafka 不支持减少 topic 分区数。
- 增加分区不会自动重分布已有数据。
- 如果生产者用 key hash 分区，分区数变化可能改变 key 到 partition 的映射。
- 依赖 key 内顺序的业务要谨慎。

## Producer 深讲

Producer 负责把事件写到 Kafka。

### Python producer

```python
import json
from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    key_serializer=lambda v: v.encode("utf-8"),
    value_serializer=lambda v: json.dumps(v, ensure_ascii=False).encode("utf-8"),
)

event = {
    "service": "order-api",
    "instance": "10.0.1.11",
    "severity": "critical",
    "alert": "HighErrorRate",
    "value": 0.23,
}

producer.send("aiops-alerts", key=event["service"], value=event)
producer.flush()
```

安装：

```bash
pip install kafka-python
```

### Producer 关键配置

| 配置 | 意思 | 初学理解 |
|---|---|---|
| `bootstrap.servers` | 初始 broker 地址 | 客户端用它发现集群 |
| `key.serializer` | key 序列化 | 字符串、JSON、Avro 等 |
| `value.serializer` | value 序列化 | 事件内容编码 |
| `acks` | 写入确认级别 | 影响可靠性和延迟 |
| `retries` | 失败重试次数 | 网络抖动时有用 |
| `batch.size` | 批大小 | 吞吐和延迟权衡 |
| `linger.ms` | 等待组批时间 | 增加吞吐但可能增加延迟 |
| `compression.type` | 压缩 | 降低网络和磁盘 |

### acks

`acks` 决定 producer 等待什么确认。

| 值 | 含义 | 风险 |
|---|---|---|
| `0` | 不等确认 | 可能丢数据 |
| `1` | leader 写入即确认 | leader 故障时可能丢 |
| `all` | 等 ISR 中副本确认 | 更可靠，延迟更高 |

AIOps 告警事件通常不希望丢，生产建议更重视可靠性。

## Consumer 深讲

Consumer 负责读取事件。

### Python consumer

```python
import json
from kafka import KafkaConsumer

consumer = KafkaConsumer(
    "aiops-alerts",
    bootstrap_servers="localhost:9092",
    group_id="aiops-triage-worker",
    auto_offset_reset="earliest",
    enable_auto_commit=True,
    value_deserializer=lambda v: json.loads(v.decode("utf-8")),
)

for message in consumer:
    event = message.value
    print(message.topic, message.partition, message.offset, event)
```

### Consumer 关键配置

| 配置 | 意思 |
|---|---|
| `bootstrap.servers` | broker 地址 |
| `group.id` | 消费组 |
| `auto.offset.reset` | 没有已提交 offset 时从哪里读 |
| `enable.auto.commit` | 是否自动提交 offset |
| `auto.commit.interval.ms` | 自动提交间隔 |
| `max.poll.records` | 一次 poll 最多记录数 |
| `max.poll.interval.ms` | 两次 poll 最大间隔 |
| `session.timeout.ms` | 会话超时 |

### auto.offset.reset

只在没有已提交 offset 时生效。

| 值 | 意思 |
|---|---|
| `earliest` | 从最早可用 offset 读 |
| `latest` | 从最新位置开始，只读新事件 |
| `none` | 没 offset 时报错 |

为什么你加了 `earliest` 还读不到历史？

可能是这个 group 已经提交过 offset，所以 `auto.offset.reset` 不再生效。

### 自动提交 vs 手动提交

自动提交简单：

```text
poll（拉取消息）
  -> process（处理）
  -> auto commit periodically（定期自动提交位置）
```

风险：处理失败但 offset 已提交，消息可能被跳过。

更稳的模式：

```text
poll（拉取消息）
  -> process successfully（成功处理）
  -> commit offset（提交消费位置）
```

这能实现更接近 at-least-once 的处理语义。

## Consumer Group 和 Lag

### Consumer group 并行

同一个 group 内，partition 会分配给 consumer：

```text
topic: aiops-alerts, partitions（分区）=3

group: incident-writer（消费组名为故障记录写入者）
  consumer-1 -> partition（分区） 0
  consumer-2 -> partition（分区） 1
  consumer-3 -> partition（分区） 2
```

如果 consumer-2 挂了，group 会 rebalance：

```text
consumer-1 -> partition（分区） 0, partition（分区） 1
consumer-3 -> partition（分区） 2
```

### 查看 consumer group

```bash
bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --list
```

查看 lag：

```bash
bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --group aiops-triage-worker
```

常见字段：

| 字段 | 意思 |
|---|---|
| `TOPIC` | topic |
| `PARTITION` | 分区 |
| `CURRENT-OFFSET` | group 已提交 offset |
| `LOG-END-OFFSET` | partition 最新 offset |
| `LAG` | 积压量 |
| `CONSUMER-ID` | 当前消费者 |

### lag 变大说明什么

```text
producer 写入速度 > consumer 处理速度
```

常见原因：

- consumer 数量太少。
- partition 数量限制了并行度。
- 处理逻辑慢。
- 下游 MySQL / Redis / LLM 慢。
- consumer 卡住或频繁 rebalance。
- 单条消息处理失败反复重试。

## Retention 和 Log Compaction

Kafka 事件不是永久保留，除非你配置成那样。

### 时间保留

Topic 可以按时间保留：

```bash
bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name aiops-alerts \
  --alter \
  --add-config retention.ms=604800000
```

`604800000` 毫秒是 7 天。

### 大小保留

也可以按大小：

```bash
--add-config retention.bytes=1073741824
```

### Log compaction

Log compaction 会按 key 保留较新的记录，用于保存某个 key 的最新状态。

```bash
--add-config cleanup.policy=compact
```

适合：

- 服务配置快照。
- CMDB 最新状态。
- 每个 service 的最新健康状态。

不适合：

- 必须保留每一条历史告警的 topic。

## Delivery Semantics

Kafka 应用常见语义：

| 语义 | 意思 |
|---|---|
| at-most-once | 最多处理一次，可能丢 |
| at-least-once | 至少处理一次，可能重复 |
| exactly-once | 精确一次，配置和场景更严格 |

AIOps 初学项目建议先接受 at-least-once：

```text
消息可能重复
  -> 消费端做幂等
```

例如写 MySQL 时用 event_id 做唯一键，重复消费不会插入两次。

## Kafka Connect 和 Kafka Streams

### Kafka Connect

Kafka Connect 用来连接外部系统和 Kafka。

```text
source connector（来源连接器）
  -> external system to Kafka（从外部系统写入 Kafka）

sink connector（下游连接器）
  -> Kafka to external system（从 Kafka 写入外部系统）
```

例子：

- MySQL binlog -> Kafka。
- Kafka -> Elasticsearch。
- File -> Kafka。
- Kafka -> S3。

AIOps 场景：

- 从数据库变更捕获 deployment/incident 数据。
- 把 Kafka 清洗后的日志事件写入搜索系统。

### Kafka Streams

Kafka Streams 是流处理库。

它可以做：

- map/filter。
- aggregation。
- join。
- window。
- stateful processing。

AIOps 场景：

- 5 分钟窗口内告警计数。
- 按服务聚合错误事件。
- 告警事件 join 发布事件。
- 实时生成异常候选。

初学可以先用 Python consumer 理解概念，后续再学 Kafka Streams。

## 配置重点

### Broker / Topic 配置

| 配置 | 作用 | AIOps 关注 |
|---|---|---|
| `listeners` | broker 监听地址 | 客户端连不上常查 |
| `advertised.listeners` | broker 对客户端公布地址 | Docker/跨主机最常见坑 |
| `log.dirs` | 数据目录 | 磁盘容量 |
| `num.partitions` | 默认 topic 分区数 | 并行度 |
| `default.replication.factor` | 默认副本数 | 高可用 |
| `log.retention.hours` | 默认保留时间 | 回放窗口 |
| `log.retention.bytes` | 默认保留大小 | 防止磁盘打满 |
| `min.insync.replicas` | 最小同步副本 | 配合 `acks=all` |

### Producer 配置

| 配置 | 作用 |
|---|---|
| `acks` | 写入确认 |
| `retries` | 重试 |
| `enable.idempotence` | 幂等 producer |
| `linger.ms` | 等待批处理 |
| `batch.size` | 批大小 |
| `compression.type` | 压缩 |

### Consumer 配置

| 配置 | 作用 |
|---|---|
| `group.id` | 消费组 |
| `auto.offset.reset` | 无 offset 时起点 |
| `enable.auto.commit` | 自动提交 |
| `max.poll.records` | 单次拉取数量 |
| `max.poll.interval.ms` | 处理最长间隔 |
| `session.timeout.ms` | 会话超时 |

## AIOps 入门实验：告警事件流

目录：

```text
projects/kafka-alert-stream/
  README.md
  requirements.txt
  sample-events.jsonl
  producer.py
  consumer.py
```

### sample-events.jsonl

```json
{"event_id":"evt-001","service":"order-api","instance":"10.0.1.11","severity":"critical","alert":"HighErrorRate","value":0.23}
{"event_id":"evt-002","service":"payment-api","instance":"10.0.2.21","severity":"warning","alert":"HighLatency","value":1200}
{"event_id":"evt-003","service":"gateway","instance":"10.0.0.8","severity":"info","alert":"TrafficSpike","value":4200}
```

### requirements.txt

```text
kafka-python
```

### producer.py

```python
import json
from pathlib import Path

from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    key_serializer=lambda value: value.encode("utf-8"),
    value_serializer=lambda value: json.dumps(value, ensure_ascii=False).encode("utf-8"),
)

for line in Path("sample-events.jsonl").read_text(encoding="utf-8").splitlines():
    event = json.loads(line)
    producer.send("aiops-alerts", key=event["service"], value=event)

producer.flush()
print("sent events")
```

### consumer.py

```python
import json

from kafka import KafkaConsumer

consumer = KafkaConsumer(
    "aiops-alerts",
    bootstrap_servers="localhost:9092",
    group_id="aiops-demo-consumer",
    auto_offset_reset="earliest",
    enable_auto_commit=True,
    value_deserializer=lambda value: json.loads(value.decode("utf-8")),
)

for message in consumer:
    print(
        {
            "topic": message.topic,
            "partition": message.partition,
            "offset": message.offset,
            "key": message.key.decode("utf-8") if message.key else None,
            "value": message.value,
        }
    )
```

### 实验步骤

```bash
bin/kafka-topics.sh --create \
  --topic aiops-alerts \
  --partitions 3 \
  --replication-factor 1 \
  --bootstrap-server localhost:9092

pip install -r requirements.txt
python producer.py
python consumer.py
```

README 要解释：

- topic 是什么。
- 为什么分成 3 个 partition。
- key 为什么用 service。
- consumer group 是什么。
- offset 在输出里代表什么。

## 常用命令字典

### kafka-storage.sh random-uuid

```bash
bin/kafka-storage.sh random-uuid
```

作用：生成 KRaft cluster id。

### kafka-storage.sh format

```bash
bin/kafka-storage.sh format --standalone -t "$KAFKA_CLUSTER_ID" -c config/server.properties
```

作用：格式化 Kafka 存储目录。

### kafka-server-start.sh

```bash
bin/kafka-server-start.sh config/server.properties
```

作用：启动 broker。

### kafka-topics.sh --create

```bash
bin/kafka-topics.sh --create --topic aiops-alerts --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
```

作用：创建 topic。

### kafka-topics.sh --describe

```bash
bin/kafka-topics.sh --describe --topic aiops-alerts --bootstrap-server localhost:9092
```

作用：查看 topic、partition、leader、replicas、ISR。

### kafka-console-producer.sh

```bash
bin/kafka-console-producer.sh --topic aiops-alerts --bootstrap-server localhost:9092
```

作用：命令行写事件。

### kafka-console-consumer.sh

```bash
bin/kafka-console-consumer.sh --topic aiops-alerts --from-beginning --bootstrap-server localhost:9092
```

作用：命令行读事件。

### kafka-consumer-groups.sh --describe

```bash
bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group aiops-demo-consumer
```

作用：查看 consumer group offset 和 lag。

### kafka-configs.sh

```bash
bin/kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name aiops-alerts \
  --describe
```

作用：查看配置。

修改 retention：

```bash
bin/kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name aiops-alerts \
  --alter \
  --add-config retention.ms=604800000
```

### kafka-delete-records.sh

```bash
bin/kafka-delete-records.sh --bootstrap-server localhost:9092 --offset-json-file delete-records.json
```

作用：按 offset 删除旧记录。生产慎用。

## 典型故障排查表

| 现象 | 常见原因 | 怎么查 | 怎么修 |
|---|---|---|---|
| 客户端连不上 | Kafka 未启动、地址错 | `kafka-topics.sh --list` | 启动 broker、修地址 |
| Docker 外部连不上 | `advertised.listeners` 错 | 看客户端报错地址 | 修 advertised 地址 |
| topic 不存在 | 未创建或名字错 | `--list` | 创建 topic |
| 读不到历史 | group 已有 offset | `consumer-groups --describe` | 换 group 或 reset offset |
| lag 变大 | 消费慢或下游慢 | 查看 lag | 扩 consumer、优化处理 |
| consumer 空闲 | consumer 数 > partition 数 | 看 partition 分配 | 增 partition 或减少 consumer |
| 顺序错乱 | key 选择不当或加分区 | 看 key/partition | 固定 key，谨慎扩分区 |
| 消息重复 | at-least-once 重试 | 查业务幂等 | 用 event_id 去重 |
| 消息丢失 | acks 太低或提交太早 | 查 producer/consumer 配置 | 调 `acks=all`、手动提交 |
| 磁盘满 | retention 太长或流量大 | 查 log.dirs | 调 retention、扩容 |
| ISR 缩小 | replica 跟不上 | `--describe` | 查 broker、磁盘、网络 |
| rebalance 频繁 | consumer 超时或处理太慢 | consumer 日志 | 调 poll 和处理逻辑 |

## 排障流程

### 连接失败

```text
broker 是否启动
  -> bootstrap-server 是否正确
  -> advertised.listeners 是否客户端可达
  -> 安全认证是否需要
  -> 网络和端口是否通
```

### 消费不到数据

```text
topic 是否有数据
  -> 是否用 --from-beginning
  -> group 是否已有 offset
  -> retention 是否清掉历史
  -> consumer 是否订阅正确 topic
```

### lag 变大

```text
看 consumer group lag
  -> 看每个 partition lag
  -> 看 consumer 数量和 partition 数
  -> 看处理耗时
  -> 看下游系统
  -> 看 rebalance 日志
```

## Kafka、Redis Stream、MySQL 的边界

| 需求 | Kafka | Redis Stream | MySQL |
|---|---|---|---|
| 高吞吐事件流 | 很适合 | 中小规模可用 | 不适合 |
| 多消费组独立消费 | 很适合 | 可用但能力较轻 | 不适合 |
| 长时间保留和回放 | 很适合 | 不适合作为长期主链路 | 不适合 |
| 短期队列 | 可用但偏重 | 很适合 | 不适合 |
| 结构化查询和 JOIN | 不适合 | 不适合 | 很适合 |
| 事务记录 | 不适合 | 不适合 | 很适合 |
| 告警去重窗口 | 可用但偏重 | Redis String/Set 更适合 | 可用但慢 |

## 面试怎么讲

可以这样讲：

Kafka 是分布式事件流平台。生产者把事件写入 topic，topic 被拆成多个 partition，每个 partition 是有序追加日志，事件在 partition 中有 offset。消费者通过 consumer group 读取事件，同一个 group 内 partition 会分配给不同 consumer 实现并行，不同 group 可以独立消费同一批事件。Kafka 会按 retention 保留事件，所以消费者可以在保留期内重放。AIOps 场景里，我会用 Kafka 汇聚告警、日志解析结果、发布事件和 runbook 事件，再由异常检测、通知、入库、LLM 分析等多个 consumer group 独立处理。

## 学习检查清单

- [ ] 我能解释 Kafka 为什么是事件流平台。
- [ ] 我能解释 event、topic、partition、offset。
- [ ] 我能启动本地 Kafka。
- [ ] 我能创建 topic。
- [ ] 我能用 console producer 写事件。
- [ ] 我能用 console consumer 读事件。
- [ ] 我能解释 producer key 如何影响 partition。
- [ ] 我能解释 consumer group 如何并行。
- [ ] 我能查看 consumer lag。
- [ ] 我能解释 replication factor、leader、ISR。
- [ ] 我能解释 retention 和 log compaction。
- [ ] 我能写一个 Python producer/consumer。
- [ ] 我能说明 Kafka、Redis Stream、MySQL 的边界。

## 面试题

1. Kafka 解决什么问题？
2. Kafka 和传统消息队列有什么区别？
3. event、record、message 是什么？
4. topic 和 partition 分别是什么？
5. offset 有什么作用？
6. Kafka 为什么能回放历史事件？
7. consumer group 如何实现并行消费？
8. 为什么 consumer 数量超过 partition 数不会继续提升并行度？
9. producer key 如何影响消息顺序？
10. replication factor、leader、ISR 分别是什么？
11. `acks=all` 和 `min.insync.replicas` 有什么关系？
12. consumer lag 变大怎么排查？
13. `auto.offset.reset=earliest` 为什么有时读不到历史？
14. at-least-once 为什么可能重复？
15. AIOps 中哪些事件适合进入 Kafka？
16. Kafka 和 Redis Stream 如何选？

## 老师带你区分事件、位置和业务完成

把一个 Partition（分区）看成只能向后追加的记录簿，Offset（位移）是记录在该分区的位置。Topic（主题）由一个或多个这样的记录簿组成，Consumer Group（消费组）保存自己的阅读进度。两个组可以独立读同一批事件，同一组内则分担分区；位移不是整个主题统一的业务编号。

学生：“消费位移提交了，是不是工单一定建立？”老师：“提交位移只是告诉组下次从哪里继续，数据库事务是否成功是另一件事。”先提交位移后建工单，崩溃会漏处理；先建工单后提交，崩溃会重放，所以常用稳定事件键与事务内去重。Kafka 事务覆盖的边界也不能自动延伸到任意外部 HTTP 系统。

### 生产确认和副本集合怎么一起看

`acks=all` 表示按当前副本确认规则等待，但还要结合 ISR（同步副本集合）、`min.insync.replicas`（最少同步副本数）、副本布局和故障选举策略理解可靠性。它不是“所有配置下所有副本都一定写完”的口号。副本不足时拒绝写入，可能是保护持久性边界，而不是应该立即降参数的故障。

Producer（生产者）幂等可以处理适用会话与协议边界下的发送重试；业务主动创建一条新的同义事件仍需业务键去重。客户端超时要分类：没连接上、发送失败、确认丢失、事务结果不确定，后续策略各不相同。日志至少关联业务事件 ID、主题、分区、位移及发送错误类别。

### 保序课堂：收到的顺序与完成顺序不同

同分区内记录有顺序，但消费者把它们交给线程池后，第二条可能比第一条先完成。要保持某设备状态迁移顺序，应选稳定 key（键）、合理分区路由，并控制同键处理方式；增加分区可能改变后续路由，业务版本检查仍有价值。

Rebalance（组内分区重新分配）改变谁负责哪个分区。处理过慢、会话故障或成员变动可能触发重新分配；交接期间未提交位置会影响重放。持续加消费者却超过分区数，不一定增加有效并行；单热点键也不靠消费者总数解决。

### 补一条可回收故障验证路线

在前文教学主题与消费组实验里，先记录正常消费后的位移和 Lag（积压差），关闭教学消费者而保留生产者，写入固定数量的合成事件。预期生产仍成功、该组积压增加；恢复同一组后，记录处理数量和最终位移，确认积压下降。不要换组名后看到能读就宣布旧组恢复。

若积压不降，比较生产速率与可持续消费速率，核对是否卡在数据库或外部 API。理论清空时间为积压除以净消费速率，净速率小于等于零就不会清空。删除记录或重置位移是改变数据处理语义，不能作为让监控转绿的普通修复。完成后按前文实验清理，只处理专用主题与容器。

### 生产容量与面试课堂

容量要算消息平均字节、峰值、保留时间、复制、索引和恢复余量；日志压缩 Compaction（按键保留有效较新值）与压缩编码 Compression（减少字节）是不同概念。按时间/大小保留也不等于收到 ACK 就立即删除，所以消费进度与磁盘占用需要分别解释。

故障切换需要元数据控制面、分区副本和客户端网络路径一起正常。`bootstrap.servers` 只是初始接入点，客户端随后按元数据连接 broker 广播地址；初始连接成功后又失败，常要检查 `advertised.listeners` 对客户端网络是否可达。

30 秒回答聚焦分区日志、独立消费进度和可重放。3 分钟沿生产确认、副本、消费处理、位移提交和失败重试展开，再讲分区顺序、积压容量和外部幂等。事故题设置消费者发布后 SQL 变慢，证据链是版本—处理耗时—位移停滞—数据库等待；恢复先回退或限流坏版本，再按下游能力追赶并核对业务唯一性。

## 一套可以照着做的独立基础与故障实验

前提是 Docker 使用 Linux 容器，机器有约 3 GiB 可用内存、数 GiB 磁盘，端口 19092 空闲。它与前面的安装方式二选一，不要求同时运行。这里所有客户端在容器内访问 `localhost:9092`，映射端口不用于宿主机 SDK 测试；这样避免把 advertised listener（向客户端公布的地址）配置混进第一堂课。

### 建立基线

在 PowerShell 中逐条执行，若 Topic 创建提示服务暂未就绪，先看日志确认启动阶段，再重试该条，不能忽略错误继续：

```powershell
docker run --name kafka-lesson -d -p 127.0.0.1:19092:9092 apache/kafka:4.3.1
docker logs kafka-lesson
docker exec kafka-lesson /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic lesson-alerts --partitions 1 --replication-factor 1
'eventId=baseline-001' | docker exec -i kafka-lesson /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic lesson-alerts
docker exec kafka-lesson /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic lesson-alerts --group lesson-worker --from-beginning --max-messages 1
docker exec kafka-lesson /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group lesson-worker
```

预期读到 `baseline-001`，组提交位置最终追平日志末端。`CURRENT-OFFSET` 是已提交的下一读取位置，`LOG-END-OFFSET` 是日志末端位置，`LAG` 是两者差；它不是消费者业务数据库里还有多少条未完成事务。消费组初始化与位置提交可能存在短暂延迟，重复查看直到该单分区基线 Lag 为零，再继续后面的故障步骤。若始终没有组位置，检查消费是否真正完成、组名和消费者日志。

`--partitions 1` 让第一课只有一条日志，`--replication-factor 1` 明确这里只演示单副本，不能容忍丢失这份存储。`--from-beginning` 影响没有有效提交位置时的起点，不会把已有消费组每次都自动重置到最早；想重放与恢复原进度是两件事。用新组演示重放时，要给它新名字并记录目的，不能把新组读到数据说成旧组已恢复。

### 故障注入：消费者故意保持离线

上面的消费命令取一条后已经退出，现在不启动它，发送三条教学事件：

```powershell
@('eventId=paused-001','eventId=paused-002','eventId=paused-003') | docker exec -i kafka-lesson /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic lesson-alerts
docker exec kafka-lesson /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group lesson-worker
```

预期生产成功，消费组 Lag 从零变成三，可能提示该组没有活跃成员。此时 Kafka 服务本身没有失败，故障对象是消费处理链路。保留发送内容、组位置和观察时间，恢复同一个组：

```powershell
docker exec kafka-lesson /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic lesson-alerts --group lesson-worker --max-messages 3
docker exec kafka-lesson /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group lesson-worker
```

预期看到三条 `paused` 事件，提交传播后 Lag 回到零。若 Lag 不等于三，先检查是否重复发送、基线提交未完成、另一个消费者还在运行或 Topic 中已有上次实验数据。不要通过重置位移或删 Topic 让数字归零；那会绕过需要验证的恢复过程。

结束后用 `docker inspect kafka-lesson --format '{{.Name}}'` 核对目标，保存输出与镜像身份，再执行 `docker rm -f -v kafka-lesson`。删除教学容器及匿名卷后数据不可恢复，复做需从头开始。这个实验没有验证副本选举、生产者事务或外部工单幂等，单副本成功收发不代表生产高可用。

## 机制再讲深一层：消费完成和消费存活

消费者心跳用于证明成员还在，`poll` 调用及处理进度约束又关注它是否持续推进工作。程序心跳正常但业务处理卡住，也可能因为超出允许的轮询间隔而触发组调整；具体参数归属会随消费组协议变化，必须按客户端与 broker 版本查 [消费配置说明](https://kafka.apache.org/43/configuration/consumer-configs/)。不要把不同协议时代的参数行为混写。

`max.poll.records` 控制一次返回给应用的记录上限，不自动把一条慢任务变快。若一次批量处理上限太大，每轮总耗时超过预算，降低批量或改成受控异步处理可能有帮助；异步又要求正确管理每个分区的已完成位置，不能提交尚未完成的前序消息。你要对“收到了”“处理完了”“提交了”分别记状态。

消费者数量超过分区数量时，在常见消费组分担方式下可能出现闲置成员；频繁伸缩还会反复调整分区分配。单一热点分区需要查 key 分布、处理时间和数据大小，而不只看总消费者数。稳定业务版本可以防止乱序更新覆盖新状态，但它不等于 Kafka 为任意多分区提供全局顺序。

### 数据保留不是等消费者读完才删

Kafka 的日志保留由 Topic 策略决定，不是每个消费者的阅读进度决定。消费者停机太久，所需历史可能已经到期，即使应用从未处理也无法从当前日志读取。容量与保留期应覆盖可接受故障时间和追赶时间，监控最老待处理事件年龄，而不只看 Lag 条数。

日志压实关注相同键的最新状态视图，与按时间删除不同；压实后的日志也不等于任意时刻都只剩一条最新键值。业务事件流水若需要每次变化都保留，不能把状态主题的压实规则直接搬来。删除标记、保留与跨集群镜像的时序要在消费重放方案中解释，避免旧状态错误复活。

### 事故回答：位移归零，工单却缺了

先问是否在业务提交前提交了位置，是否更换组名、重置位置、到期丢历史或把异常记录直接跳过。用业务键与 Topic、分区、位移关联生产日志、消费日志和数据库，找到哪一步首先缺少证据。Kafka Lag 反映日志阅读进度，不能替代业务对账。

修复通常包含正确提交边界、持久幂等、错误隔离和受控重放。重放先使用影子消费或隔离下游验证范围，确认不会重复发通知或执行操作，再按批准的业务补偿路径进行。回滚消费者版本也要兼容积压中的消息结构；旧程序读不了新字段语义时，单独退镜像不能解决问题。

## 本课 GitHub 学习证据

学完这篇，建议留下这些证据：

1. Kafka 启动命令或 Docker 说明。
2. `kafka-topics.sh --describe` 输出截图。
3. 一个 `sample-events.jsonl`。
4. 一个 Python producer。
5. 一个 Python consumer。
6. 一次 `kafka-consumer-groups.sh --describe` lag 输出。
7. 一篇 README，解释 topic、partition、offset、consumer group 和 AIOps 事件流设计。
