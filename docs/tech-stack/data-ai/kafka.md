# Kafka

## 官方资料

- [Apache Kafka Quickstart](https://kafka.apache.org/quickstart/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Apache Kafka Key Concepts](https://kafka.apache.org/documentation/#intro_concepts_and_terms)
- [Apache Kafka Operations](https://kafka.apache.org/documentation/#operations)

> 学习说明：本篇按照 Kafka 官方 quickstart 的“启动服务、创建 topic、写事件、读事件”主线，结合 AIOps 场景整理成原创中文教程。

## 是什么

Kafka 是分布式事件流平台。它把系统里发生的“事件”写入 topic，让多个消费者可以独立读取这些事件。

在 AIOps 里，Kafka 常用于：

- 汇聚告警事件。
- 汇聚日志解析后的结构化事件。
- 传递指标异常检测结果。
- 连接采集、清洗、分析、通知、工单等多个系统。
- 让数据处理链路可回放、可扩展、可解耦。

一句话：Kafka 让“实时事件流”成为系统的一等公民。

## 核心原理

Kafka 的核心对象：

| 名词 | 含义 | 运维理解 |
|---|---|---|
| Event | 一条事件 | 一条告警、一条变更、一条异常 |
| Topic | 事件分类 | 类似文件夹，事件写入某个 topic |
| Producer | 生产者 | 写入事件的程序 |
| Consumer | 消费者 | 读取事件的程序 |
| Broker | Kafka 服务节点 | 保存 topic 分区数据 |
| Partition | topic 的分片 | 提升吞吐和并行度 |
| Offset | 消费位置 | 消费者读到哪里了 |
| Consumer Group | 消费组 | 一组消费者共同处理一个 topic |
| Retention | 保留策略 | 事件保留多久或多大 |

Kafka 与普通消息队列的一个重要区别是：事件被持久保存一段时间，消费者可以按 offset 反复读取。这对 AIOps 很重要，因为你可以回放昨天的告警流，验证新的降噪算法。

## 架构

```text
producer
  -> topic: aiops-alerts
      -> partition 0
      -> partition 1
      -> partition 2
  -> broker cluster
      -> replicated logs
  -> consumer group: anomaly-detector
  -> consumer group: notification-worker
  -> consumer group: incident-writer
```

同一份事件可以被多个消费组独立消费：

- `anomaly-detector` 用来做异常检测。
- `notification-worker` 用来发通知。
- `incident-writer` 用来写 MySQL。
- `llm-triage-worker` 用来生成排障建议。

这就是事件流的解耦价值。

## 安装和启动

Kafka 官方 quickstart 使用二进制包和命令行工具。学习时建议先按官方方式跑通，因为它能让你理解 Kafka 自己的工具链。

### 1. 下载 Kafka

到 [Kafka downloads](https://kafka.apache.org/downloads) 选择当前稳定版本。示例命令中的版本号要以官网当前版本为准。

```bash
tar -xzf kafka_2.13-<version>.tgz
cd kafka_2.13-<version>
```

### 2. 启动 Kafka

新版 Kafka 默认可以使用 KRaft 模式，不再依赖 ZooKeeper。按官方 quickstart 生成集群 ID、格式化存储并启动：

```bash
KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"
bin/kafka-storage.sh format --standalone -t "$KAFKA_CLUSTER_ID" -c config/server.properties
bin/kafka-server-start.sh config/server.properties
```

Windows 可以使用对应的 `.bat` 脚本，学习时也可以在 WSL 里跑。

## 第一个 Kafka 实验

### 1. 创建 topic

```bash
bin/kafka-topics.sh --create \
  --topic aiops-alerts \
  --bootstrap-server localhost:9092
```

查看 topic：

```bash
bin/kafka-topics.sh --describe \
  --topic aiops-alerts \
  --bootstrap-server localhost:9092
```

### 2. 写入事件

```bash
bin/kafka-console-producer.sh \
  --topic aiops-alerts \
  --bootstrap-server localhost:9092
```

输入几行 JSON：

```json
{"service":"order-api","severity":"critical","alert":"HighErrorRate","value":0.23}
{"service":"payment-api","severity":"warning","alert":"HighLatency","value":1200}
```

每一行就是一个事件。

### 3. 读取事件

另开一个终端：

```bash
bin/kafka-console-consumer.sh \
  --topic aiops-alerts \
  --from-beginning \
  --bootstrap-server localhost:9092
```

你应该能看到刚才写入的事件。

### 4. 再开一个消费者

再运行一次 consumer 命令，你会发现也能从头读取。这说明 Kafka 中事件保留在 topic 里，不是被第一个消费者读完就消失。

## Topic 和 Partition

创建多分区 topic：

```bash
bin/kafka-topics.sh --create \
  --topic aiops-metrics-anomalies \
  --partitions 3 \
  --replication-factor 1 \
  --bootstrap-server localhost:9092
```

分区的作用：

- 提高写入吞吐。
- 让消费者并行处理。
- 同一个 key 的事件通常进入同一个分区，保证 key 内顺序。

对 AIOps 来说，常见 partition key：

- `service_name`
- `instance`
- `cluster`
- `tenant`

如果想保证同一个服务的告警顺序，可以用服务名作为 key。

## Producer

Python 生产者示例：

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

学习重点：

- `bootstrap_servers` 是 Kafka 地址。
- `key_serializer` 决定 key 如何编码。
- `value_serializer` 决定事件内容如何编码。
- `flush()` 确保程序退出前发送完成。

## Consumer

Python 消费者示例：

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

关键概念：

| 参数 | 含义 |
|---|---|
| `group_id` | 消费组 ID |
| `auto_offset_reset` | 没有 offset 时从哪里开始 |
| `enable_auto_commit` | 是否自动提交消费位置 |
| `message.offset` | 当前消息位置 |

生产环境通常需要更严格的 offset 提交策略，避免处理失败但 offset 已提交。

## 配置重点

学习阶段先理解这些配置：

| 配置 | 作用 | 学习建议 |
|---|---|---|
| `listeners` | Broker 监听地址 | Docker / 远程访问时最容易配错 |
| `advertised.listeners` | 对客户端暴露的地址 | 客户端连接失败常由它导致 |
| `log.dirs` | 数据目录 | 磁盘空间要监控 |
| `num.partitions` | 默认分区数 | 影响并行度 |
| `log.retention.hours` | 数据保留时间 | 支持回放窗口 |
| `log.retention.bytes` | 数据保留大小 | 防止磁盘打满 |
| `default.replication.factor` | 默认副本数 | 生产高可用要大于 1 |
| `min.insync.replicas` | 最小同步副本 | 影响可靠性 |

Topic 级别查看：

```bash
bin/kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name aiops-alerts \
  --describe
```

修改 topic 保留时间：

```bash
bin/kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name aiops-alerts \
  --alter \
  --add-config retention.ms=604800000
```

## AIOps 中的作用

Kafka 适合做 AIOps 数据总线：

```text
Prometheus alert webhook
Loki log parser
CI/CD change event
CMDB update
  -> Kafka topics
      -> aiops-alerts
      -> aiops-log-events
      -> aiops-changes
  -> consumers
      -> anomaly detection
      -> alert enrichment
      -> incident creation
      -> LLM summary
```

它解决的不是“存数据库”，而是“让多个系统可靠地看到同一批事件”。

## 入门练习：告警事件流

目录建议：

```text
projects/kafka-alert-stream/
  README.md
  producer.py
  consumer.py
  sample-events.jsonl
```

目标：

1. 创建 `aiops-alerts` topic。
2. `producer.py` 读取 `sample-events.jsonl` 并写入 Kafka。
3. `consumer.py` 从 Kafka 读取并打印。
4. README 截图记录 producer 和 consumer 的输出。

`sample-events.jsonl`：

```json
{"service":"order-api","instance":"10.0.1.11","severity":"critical","alert":"HighErrorRate","value":0.23}
{"service":"payment-api","instance":"10.0.2.21","severity":"warning","alert":"HighLatency","value":1200}
{"service":"gateway","instance":"10.0.0.8","severity":"info","alert":"TrafficSpike","value":4200}
```

## 常见故障

### 客户端连不上 Kafka

重点看：

- Kafka 是否启动。
- `bootstrap-server` 是否写对。
- `advertised.listeners` 是否对客户端可达。
- Docker 网络是否映射端口。

命令：

```bash
bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### topic 不存在

```bash
bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
bin/kafka-topics.sh --create --topic aiops-alerts --bootstrap-server localhost:9092
```

### 消费不到历史数据

检查：

- 是否加了 `--from-beginning`。
- 消费组是否已经提交过 offset。
- `auto_offset_reset` 是否为 `earliest`。
- topic 的 retention 是否已经清掉历史数据。

### Consumer lag 变大

含义：生产速度大于消费速度。

处理方向：

- 增加消费者数量，但不能超过分区数获得更多并行度。
- 优化消费逻辑。
- 增加 topic 分区。
- 检查下游 MySQL / LLM / API 是否变慢。

## 学习证据

学完后，在 GitHub 留下：

- Kafka 启动步骤。
- topic 创建命令。
- producer / consumer 代码。
- 一份 JSONL 告警样例。
- 截图证明事件可以写入和读取。
- README 解释 partition、offset、consumer group。

