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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager 产生告警</code> | 这一行里的英文要这样读：`Alertmanager` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 3 行 | <code>CI/CD 系统产生发布事件</code> | `CI/CD 系统产生发布事件` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>Prometheus 规则产生异常事件</code> | 这一行里的英文要这样读：`Prometheus` 是指标采集和告警规则评估系统。 |
| 第 5 行 | <code>Runbook 系统产生自动化执行记录</code> | 这一行里的英文要这样读：`Runbook` 是故障处理手册。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager -&gt; 通知服务</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 2 行 | <code>Alertmanager -&gt; 事故服务</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>Alertmanager -&gt; LLM 分析服务</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器；`LLM` 是大语言模型。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>Alertmanager -&gt; MySQL 写入服务</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器；`MySQL` 是MySQL 数据库或客户端命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>日志服务 -&gt; LLM 分析服务</code> | 这一行要理解这些英文词：`LLM` 是大语言模型。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

这会带来几个问题：

- 上游必须知道所有下游。
- 下游慢了会影响上游。
- 新增一个分析服务要改很多地方。
- 事件处理失败后不好重放。
- 昨天的告警流不能拿来重新跑新算法。

Kafka 的价值，是把事件放进一个可持久、可订阅、可回放、可扩展的事件流平台：

```text
producers
  -> Kafka topics
  -> many independent consumer groups
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>producers</code> | 这一行里的英文要这样读：`producers` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; Kafka topics</code> | 这一行要理解这些英文词：`Kafka topics` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; many independent consumer groups</code> | 这一行要理解这些英文词：`many independent consumer groups` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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
Apache Kafka
  -> Get Started
     -> Introduction
     -> Quickstart
     -> Use Cases
     -> KRaft vs ZooKeeper
     -> Docker
  -> Core Concepts
     -> event / record / message
     -> topic
     -> partition
     -> offset
     -> producer
     -> consumer
     -> consumer group
     -> broker
     -> replication
     -> retention
  -> APIs
     -> Admin API
     -> Producer API
     -> Consumer API
     -> Kafka Streams API
     -> Kafka Connect API
  -> Configuration
     -> broker configs
     -> topic configs
     -> producer configs
     -> consumer configs
     -> group configs
  -> Operations
     -> topic operations
     -> partitions
     -> graceful shutdown
     -> monitoring
     -> KRaft
     -> tiered storage
     -> rebalance protocol
  -> Security
     -> listeners
     -> TLS / SSL
     -> SASL
     -> ACL
  -> Ecosystem
     -> Kafka Connect
     -> Kafka Streams
     -> clients
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Apache Kafka</code> | 这一行里的英文要这样读：`Apache Kafka` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; Get Started</code> | 这一行要理解这些英文词：`Get Started` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>     -&gt; Introduction</code> | 这一行要理解这些英文词：`Introduction` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; Quickstart</code> | 这一行要理解这些英文词：`Quickstart` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; Use Cases</code> | 这一行要理解这些英文词：`Use Cases` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; KRaft vs ZooKeeper</code> | 这一行要理解这些英文词：`KRaft vs ZooKeeper` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>     -&gt; Docker</code> | 这一行要理解这些英文词：`Docker` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Core Concepts</code> | 这一行要理解这些英文词：`Core Concepts` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; event / record / message</code> | 这一行要理解这些英文词：`event` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`record` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`message` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; topic</code> | 这一行要理解这些英文词：`topic` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; partition</code> | 这一行要理解这些英文词：`partition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>     -&gt; offset</code> | 这一行要理解这些英文词：`offset` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>     -&gt; producer</code> | 这一行要理解这些英文词：`producer` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>     -&gt; consumer</code> | 这一行要理解这些英文词：`consumer` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>     -&gt; consumer group</code> | 这一行要理解这些英文词：`consumer group` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>     -&gt; broker</code> | 这一行要理解这些英文词：`broker` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>     -&gt; replication</code> | 这一行要理解这些英文词：`replication` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>     -&gt; retention</code> | 这一行要理解这些英文词：`retention` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>  -&gt; APIs</code> | 这一行要理解这些英文词：`APIs` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>     -&gt; Admin API</code> | 这一行要理解这些英文词：`Admin API` 是api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>     -&gt; Producer API</code> | 这一行要理解这些英文词：`Producer API` 是api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>     -&gt; Consumer API</code> | 这一行要理解这些英文词：`Consumer API` 是api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>     -&gt; Kafka Streams API</code> | 这一行要理解这些英文词：`Kafka Streams API` 是api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>     -&gt; Kafka Connect API</code> | 这一行要理解这些英文词：`Kafka Connect API` 是connect=连接，api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>  -&gt; Configuration</code> | 这一行要理解这些英文词：`Configuration` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>     -&gt; broker configs</code> | 这一行要理解这些英文词：`broker configs` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>     -&gt; topic configs</code> | 这一行要理解这些英文词：`topic configs` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>     -&gt; producer configs</code> | 这一行要理解这些英文词：`producer configs` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>     -&gt; consumer configs</code> | 这一行要理解这些英文词：`consumer configs` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>     -&gt; group configs</code> | 这一行要理解这些英文词：`group configs` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>  -&gt; Operations</code> | 这一行要理解这些英文词：`Operations` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>     -&gt; topic operations</code> | 这一行要理解这些英文词：`topic operations` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>     -&gt; partitions</code> | 这一行要理解这些英文词：`partitions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>     -&gt; graceful shutdown</code> | 这一行要理解这些英文词：`graceful shutdown` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>     -&gt; monitoring</code> | 这一行要理解这些英文词：`monitoring` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 36 行 | <code>     -&gt; KRaft</code> | 这一行要理解这些英文词：`KRaft` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 37 行 | <code>     -&gt; tiered storage</code> | 这一行要理解这些英文词：`tiered storage` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 38 行 | <code>     -&gt; rebalance protocol</code> | 这一行要理解这些英文词：`rebalance protocol` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 39 行 | <code>  -&gt; Security</code> | 这一行要理解这些英文词：`Security` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 40 行 | <code>     -&gt; listeners</code> | 这一行要理解这些英文词：`listeners` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 41 行 | <code>     -&gt; TLS / SSL</code> | 这一行要理解这些英文词：`TLS` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`SSL` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 42 行 | <code>     -&gt; SASL</code> | 这一行要理解这些英文词：`SASL` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 43 行 | <code>     -&gt; ACL</code> | 这一行要理解这些英文词：`ACL` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 44 行 | <code>  -&gt; Ecosystem</code> | 这一行要理解这些英文词：`Ecosystem` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 45 行 | <code>     -&gt; Kafka Connect</code> | 这一行要理解这些英文词：`Kafka Connect` 是connect=连接。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 46 行 | <code>     -&gt; Kafka Streams</code> | 这一行要理解这些英文词：`Kafka Streams` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 47 行 | <code>     -&gt; clients</code> | 这一行要理解这些英文词：`clients` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

初学主线：

```text
Quickstart
  -> create topic
  -> produce events
  -> consume events
  -> topic / partition / offset
  -> consumer group
  -> replication / retention
  -> lag and troubleshooting
  -> AIOps event pipeline
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Quickstart</code> | 这一行里的英文要这样读：`Quickstart` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 2 行 | <code>  -&gt; create topic</code> | 这一行要理解这些英文词：`create topic` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; produce events</code> | 这一行要理解这些英文词：`produce events` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; consume events</code> | 这一行要理解这些英文词：`consume events` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; topic / partition / offset</code> | 这一行要理解这些英文词：`topic` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`partition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`offset` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; consumer group</code> | 这一行要理解这些英文词：`consumer group` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; replication / retention</code> | 这一行要理解这些英文词：`replication` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`retention` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; lag and troubleshooting</code> | 这一行要理解这些英文词：`lag and troubleshooting` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; AIOps event pipeline</code> | 这一行要理解这些英文词：`AIOps event pipeline` 是aiops=智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

## Kafka 在 AIOps 链路中的位置

Kafka 适合做 AIOps 的事件总线：

```text
Event sources
  -> Alertmanager
  -> log parser
  -> CI/CD deployment event
  -> runbook execution event
  -> user feedback

Kafka topics
  -> aiops-alerts
  -> aiops-log-events
  -> aiops-deployments
  -> aiops-runbook-events
  -> aiops-feedback

Consumer groups
  -> anomaly-detector
  -> alert-enricher
  -> incident-writer
  -> notification-worker
  -> llm-triage-worker
  -> feature-builder
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Event sources</code> | 这一行里的英文要这样读：`Event sources` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; Alertmanager</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; log parser</code> | 这一行要理解这些英文词：`log parser` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; CI/CD deployment event</code> | 这一行要理解这些英文词：`CI` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`CD deployment event` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; runbook execution event</code> | 这一行要理解这些英文词：`runbook execution event` 是runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; user feedback</code> | 这一行要理解这些英文词：`user feedback` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>Kafka topics</code> | 这一行里的英文要这样读：`Kafka topics` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 9 行 | <code>  -&gt; aiops-alerts</code> | 这一行要理解这些英文词：`aiops-alerts` 是aiops=智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; aiops-log-events</code> | 这一行要理解这些英文词：`aiops-log-events` 是aiops=智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; aiops-deployments</code> | 这一行要理解这些英文词：`aiops-deployments` 是aiops=智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; aiops-runbook-events</code> | 这一行要理解这些英文词：`aiops-runbook-events` 是aiops=智能运维，runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>  -&gt; aiops-feedback</code> | 这一行要理解这些英文词：`aiops-feedback` 是aiops=智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>Consumer groups</code> | 这一行里的英文要这样读：`Consumer groups` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 16 行 | <code>  -&gt; anomaly-detector</code> | 这一行要理解这些英文词：`anomaly-detector` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>  -&gt; alert-enricher</code> | 这一行要理解这些英文词：`alert-enricher` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>  -&gt; incident-writer</code> | 这一行要理解这些英文词：`incident-writer` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>  -&gt; notification-worker</code> | 这一行要理解这些英文词：`notification-worker` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>  -&gt; llm-triage-worker</code> | 这一行要理解这些英文词：`llm-triage-worker` 是llm=大语言模型。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>  -&gt; feature-builder</code> | 这一行要理解这些英文词：`feature-builder` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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
partition log
  offset 0 -> event
  offset 1 -> event
  offset 2 -> event
  offset 3 -> event
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>partition log</code> | 这一行里的英文要这样读：`partition log` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  offset 0 -&gt; event</code> | 这一行要理解这些英文词：`offset` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`event` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  offset 1 -&gt; event</code> | 这一行要理解这些英文词：`offset` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`event` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  offset 2 -&gt; event</code> | 这一行要理解这些英文词：`offset` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`event` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  offset 3 -&gt; event</code> | 这一行要理解这些英文词：`offset` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`event` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{</code> | 对象开始，表示下面是一组键值对配置。 |
| 第 2 行 | <code>  "key": "order-api",</code> | `key` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`order-api` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 3 行 | <code>  "value": {</code> | `value` 是数值字段，`{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 4 行 | <code>    "alert": "HighErrorRate",</code> | `alert` 是告警，`HighErrorRate` 是高错误率告警名，表示请求失败比例过高；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 5 行 | <code>    "severity": "critical"</code> | `severity` 是告警严重级别字段，`critical` 表示严重级别，通常表示需要优先处理；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 6 行 | <code>  },</code> | 当前对象或数组结束，逗号表示后面还有同级项目。 |
| 第 7 行 | <code>  "timestamp": "2026-07-02T10:20:00Z",</code> | `timestamp` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`2026-07-02T10:20:00Z` 表示具体时间值，表示事件、告警或记录发生的时间点；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 8 行 | <code>  "headers": {</code> | `headers` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`{` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 9 行 | <code>    "source": "alertmanager"</code> | `source` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`alertmanager` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实环境要根据自己的告警、服务或接口返回调整。 |
| 第 10 行 | <code>  }</code> | 对象结束，表示这一组键值对配置到这里结束。 |
| 第 11 行 | <code>}</code> | 对象结束，表示这一组键值对配置到这里结束。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>aiops-alerts</code> | 这一行里的英文要这样读：`aiops-alerts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>aiops-deployments</code> | 这一行里的英文要这样读：`aiops-deployments` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>aiops-log-events</code> | 这一行里的英文要这样读：`aiops-log-events` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>aiops-feedback</code> | 这一行里的英文要这样读：`aiops-feedback` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

你可以粗略把 topic 理解成文件夹，但更准确地说：

```text
topic = 多个 partition log 的逻辑名字
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>topic = 多个 partition log 的逻辑名字</code> | `topic` 是主机、服务、告警或资源的示例名称；`topic` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`多个` 是这个字段的中文取值，已经直接说明了含义。 |

### Partition

Partition 是 topic 的分片日志。

```text
topic: aiops-alerts
  partition 0: offset 0, 1, 2...
  partition 1: offset 0, 1, 2...
  partition 2: offset 0, 1, 2...
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>topic: aiops-alerts</code> | `topic` 是topic 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `aiops-alerts` 是这个字段的示例内容或模板表达式。 |
| 第 2 行 | <code>  partition 0: offset 0, 1, 2...</code> | `partition 0` 是partition 0 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `offset 0, 1, 2...` 是这个字段的示例内容或模板表达式。 |
| 第 3 行 | <code>  partition 1: offset 0, 1, 2...</code> | `partition 1` 是partition 1 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `offset 0, 1, 2...` 是这个字段的示例内容或模板表达式。 |
| 第 4 行 | <code>  partition 2: offset 0, 1, 2...</code> | `partition 2` 是partition 2 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `offset 0, 1, 2...` 是这个字段的示例内容或模板表达式。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>partition 0</code> | 这一行里的英文要这样读：`partition` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  offset 0</code> | 这一行里的英文要这样读：`offset` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>  offset 1</code> | 这一行里的英文要这样读：`offset` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>  offset 2</code> | 这一行里的英文要这样读：`offset` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>broker 0</code> | 这一行里的英文要这样读：`broker` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>broker 1</code> | 这一行里的英文要这样读：`broker` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>broker 2</code> | 这一行里的英文要这样读：`broker` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>一个 partition 同一时间只分配给 group 内一个 consumer</code> | 这一行里的英文要这样读：`partition` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`group` 是分组；`consumer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

不同 group 之间：

```text
可以独立消费同一个 topic
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>可以独立消费同一个 topic</code> | 这一行里的英文要这样读：`topic` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

例子：

```text
topic: aiops-alerts

consumer group: notification-worker
  -> 负责发通知

consumer group: incident-writer
  -> 负责写 MySQL

consumer group: llm-triage-worker
  -> 负责生成排障摘要
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>topic: aiops-alerts</code> | `topic` 是topic 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `aiops-alerts` 是这个字段的示例内容或模板表达式。 |
| 第 3 行 | <code>consumer group: notification-worker</code> | `consumer group` 是consumer group 这个英文标识可以拆开理解为：分组，冒号后面的 `notification-worker` 是这个字段的示例内容或模板表达式。 |
| 第 4 行 | <code>  -&gt; 负责发通知</code> | 这一行表示上一级主题下的子项“负责发通知”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 6 行 | <code>consumer group: incident-writer</code> | `consumer group` 是consumer group 这个英文标识可以拆开理解为：分组，冒号后面的 `incident-writer` 是这个字段的示例内容或模板表达式。 |
| 第 7 行 | <code>  -&gt; 负责写 MySQL</code> | 这一行要理解这些英文词：`MySQL` 是MySQL 数据库或客户端命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>consumer group: llm-triage-worker</code> | `consumer group` 是consumer group 这个英文标识可以拆开理解为：分组，冒号后面的 `llm-triage-worker` 是这个字段的示例内容或模板表达式。 |
| 第 10 行 | <code>  -&gt; 负责生成排障摘要</code> | 这一行表示上一级主题下的子项“负责生成排障摘要”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |

这三个 group 都能读同一批告警事件，互不影响。

## 架构

```text
producers
  -> Kafka cluster
      broker 0
      broker 1
      broker 2
        topic aiops-alerts
          partition 0 leader + replicas
          partition 1 leader + replicas
          partition 2 leader + replicas
  -> consumers
      group notification-worker
      group incident-writer
      group anomaly-detector
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>producers</code> | 这一行里的英文要这样读：`producers` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; Kafka cluster</code> | 这一行要理解这些英文词：`Kafka cluster` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>      broker 0</code> | 这一行里的英文要这样读：`broker` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>      broker 1</code> | 这一行里的英文要这样读：`broker` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 5 行 | <code>      broker 2</code> | 这一行里的英文要这样读：`broker` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 6 行 | <code>        topic aiops-alerts</code> | 这一行里的英文要这样读：`topic aiops-alerts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 7 行 | <code>          partition 0 leader + replicas</code> | 这一行里的英文要这样读：`partition` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`leader` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`replicas` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 8 行 | <code>          partition 1 leader + replicas</code> | 这一行里的英文要这样读：`partition` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`leader` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`replicas` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 9 行 | <code>          partition 2 leader + replicas</code> | 这一行里的英文要这样读：`partition` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`leader` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`replicas` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 10 行 | <code>  -&gt; consumers</code> | 这一行要理解这些英文词：`consumers` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>      group notification-worker</code> | 这一行里的英文要这样读：`group notification-worker` 这个英文标识可以拆开理解为：分组，工作进程。 |
| 第 12 行 | <code>      group incident-writer</code> | 这一行里的英文要这样读：`group incident-writer` 这个英文标识可以拆开理解为：分组，线上故障或事件。 |
| 第 13 行 | <code>      group anomaly-detector</code> | 这一行里的英文要这样读：`group anomaly-detector` 这个英文标识可以拆开理解为：分组。 |

### Leader 和 Replica

Partition 可以有多个副本。

```text
partition 0
  leader: broker 0
  replica: broker 1
  replica: broker 2
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>partition 0</code> | 这一行里的英文要这样读：`partition` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  leader: broker 0</code> | `leader` 是leader 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `broker 0` 是这个字段的示例内容或模板表达式。 |
| 第 3 行 | <code>  replica: broker 1</code> | `replica` 是replica 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `broker 1` 是这个字段的示例内容或模板表达式。 |
| 第 4 行 | <code>  replica: broker 2</code> | `replica` 是replica 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `broker 2` 是这个字段的示例内容或模板表达式。 |

Producer/consumer 通常和 leader 交互。Follower replica 复制 leader 的数据。

### Replication Factor

Replication factor 表示每个 partition 有几份副本。

```bash
--replication-factor 3
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>--replication-factor 3</code> | 注释行，提前说明下面命令的目的或注意事项。 |

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
docker run -p 9092:9092 apache/kafka:4.3.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -p 9092:9092 apache/kafka:4.3.1</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

Native 镜像：

```bash
docker run -p 9092:9092 apache/kafka-native:4.3.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -p 9092:9092 apache/kafka-native:4.3.1</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

### 下载包启动

需要 Java 17+。

```bash
tar -xzf kafka_2.13-4.3.1.tgz
cd kafka_2.13-4.3.1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>tar -xzf kafka_2.13-4.3.1.tgz</code> | 执行 `tar` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>cd kafka_2.13-4.3.1</code> | 切换当前目录，确保后续命令在正确项目位置执行。 |

生成 cluster id：

```bash
KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"</code> | 执行 `kafka_cluster_id="$(bin/kafka-storage.sh` 相关命令，后面的参数决定它具体操作什么对象。 |

格式化存储目录：

```bash
bin/kafka-storage.sh format --standalone -t "$KAFKA_CLUSTER_ID" -c config/server.properties
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-storage.sh format --standalone -t "$KAFKA_CLUSTER_ID" -c config/server.properties</code> | 执行 `bin/kafka-storage.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

启动：

```bash
bin/kafka-server-start.sh config/server.properties
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-server-start.sh config/server.properties</code> | 执行 `bin/kafka-server-start.sh` 相关命令，后面的参数决定它具体操作什么对象。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ZooKeeper 模式</code> | 这一行里的英文要这样读：`ZooKeeper` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 2 行 | <code>  -&gt; ZooKeeper 管理元数据和控制面</code> | 这一行要理解这些英文词：`ZooKeeper` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>KRaft 模式</code> | 这一行里的英文要这样读：`KRaft` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 5 行 | <code>  -&gt; Kafka 自己管理元数据和控制面</code> | 这一行要理解这些英文词：`Kafka` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

初学阶段按官方 quickstart 使用 KRaft 即可。

## 第一个 Kafka 实验

### 创建 topic

```bash
bin/kafka-topics.sh --create \
  --topic aiops-alerts \
  --bootstrap-server localhost:9092
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-topics.sh --create \</code> | 执行 `bin/kafka-topics.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  --topic aiops-alerts \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --bootstrap-server localhost:9092</code> | 注释行，提前说明下面命令的目的或注意事项。 |

查看：

```bash
bin/kafka-topics.sh --describe \
  --topic aiops-alerts \
  --bootstrap-server localhost:9092
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-topics.sh --describe \</code> | 执行 `bin/kafka-topics.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  --topic aiops-alerts \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --bootstrap-server localhost:9092</code> | 注释行，提前说明下面命令的目的或注意事项。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Topic: aiops-alerts</code> | `Topic` 是Topic 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `aiops-alerts` 是这个字段的示例内容或模板表达式。 |
| 第 2 行 | <code>PartitionCount: ...</code> | `PartitionCount` 是PartitionCount 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `...` 是这个字段的示例内容或模板表达式。 |
| 第 3 行 | <code>ReplicationFactor: ...</code> | `ReplicationFactor` 是ReplicationFactor 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `...` 是这个字段的示例内容或模板表达式。 |
| 第 4 行 | <code>Partition: 0</code> | `Partition` 是Partition 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `0` 是这个字段的示例内容或模板表达式。 |
| 第 5 行 | <code>Leader: ...</code> | `Leader` 是Leader 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `...` 是这个字段的示例内容或模板表达式。 |
| 第 6 行 | <code>Replicas: ...</code> | `Replicas` 是Replicas 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `...` 是这个字段的示例内容或模板表达式。 |
| 第 7 行 | <code>Isr: ...</code> | `Isr` 是Isr 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源，冒号后面的 `...` 是这个字段的示例内容或模板表达式。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-console-producer.sh \</code> | 执行 `bin/kafka-console-producer.sh` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  --topic aiops-alerts \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --bootstrap-server localhost:9092</code> | 注释行，提前说明下面命令的目的或注意事项。 |

输入：

```json
{"service":"order-api","severity":"critical","alert":"HighErrorRate","value":0.23}
{"service":"payment-api","severity":"warning","alert":"HighLatency","value":1200}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{"service":"order-api","severity":"critical","alert":"HighErrorRate","value":0.23}</code> | `service` 是服务名称字段，`order-api` 是具体服务名，表示这条记录属于这个服务；`severity` 是告警严重级别字段，`critical` 表示严重级别，通常表示需要优先处理；`alert` 是告警，`HighErrorRate` 是高错误率告警名，表示请求失败比例过高；`value` 是数值字段，`0.23` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 2 行 | <code>{"service":"payment-api","severity":"warning","alert":"HighLatency","value":1200}</code> | `service` 是服务名称字段，`payment-api` 是具体服务名，表示这条记录属于这个服务；`severity` 是告警严重级别字段，`warning` 是告警级别，用来决定响应优先级；`alert` 是告警，`HighLatency` 是高延迟告警名，表示请求耗时过高；`value` 是数值字段，`1200` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

默认情况下，每一行是一条事件。

### 读取事件

```bash
bin/kafka-console-consumer.sh \
  --topic aiops-alerts \
  --from-beginning \
  --bootstrap-server localhost:9092
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-console-consumer.sh \</code> | 执行 `bin/kafka-console-consumer.sh` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  --topic aiops-alerts \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --from-beginning \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --bootstrap-server localhost:9092</code> | 注释行，提前说明下面命令的目的或注意事项。 |

`--from-beginning` 表示从最早可用事件开始读。

如果不加，通常只会读启动 consumer 后的新事件。

### 再开一个 consumer

再运行一次同样命令，你仍然可以读到事件。

这说明：

```text
Kafka 事件不会因为某个 consumer 读过就立刻消失
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Kafka 事件不会因为某个 consumer 读过就立刻消失</code> | 这一行里的英文要这样读：`Kafka` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源；`consumer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-topics.sh --create \</code> | 执行 `bin/kafka-topics.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  --topic aiops-log-events \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --partitions 3 \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --replication-factor 1 \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --bootstrap-server localhost:9092</code> | 注释行，提前说明下面命令的目的或注意事项。 |

### partition 决定并行度

如果一个 topic 有 3 个 partition，一个 consumer group 最多可以让 3 个 consumer 并行处理这个 topic。

```text
partition 0 -> consumer A
partition 1 -> consumer B
partition 2 -> consumer C
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>partition 0 -&gt; consumer A</code> | 这一行要理解这些英文词：`partition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`consumer A` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 2 行 | <code>partition 1 -&gt; consumer B</code> | 这一行要理解这些英文词：`partition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`consumer B` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>partition 2 -&gt; consumer C</code> | 这一行要理解这些英文词：`partition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`consumer C` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-topics.sh --alter \</code> | 执行 `bin/kafka-topics.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  --topic aiops-alerts \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --partitions 6 \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --bootstrap-server localhost:9092</code> | 注释行，提前说明下面命令的目的或注意事项。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>from kafka import KafkaProducer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>producer = KafkaProducer(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 5 行 | <code>    bootstrap_servers="localhost:9092",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <code>    key_serializer=lambda v: v.encode("utf-8"),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>    value_serializer=lambda v: json.dumps(v, ensure_ascii=False).encode("utf-8"),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 8 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>event = {</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>    "service": "order-api",</code> | `service` 是服务名称字段，`order-api` 是具体服务名，表示这条记录属于这个服务；这是 Python 字典里的一个键值对。 |
| 第 12 行 | <code>    "instance": "10.0.1.11",</code> | `instance` 是实例名称字段，`10.0.1.11` 表示IP 地址，表示一台机器或服务端点的位置；这是 Python 字典里的一个键值对。 |
| 第 13 行 | <code>    "severity": "critical",</code> | `severity` 是告警严重级别字段，`critical` 表示严重级别，通常表示需要优先处理；这是 Python 字典里的一个键值对。 |
| 第 14 行 | <code>    "alert": "HighErrorRate",</code> | `alert` 是告警，`HighErrorRate` 是高错误率告警名，表示请求失败比例过高；这是 Python 字典里的一个键值对。 |
| 第 15 行 | <code>    "value": 0.23,</code> | `value` 是数值字段，`0.23` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 16 行 | <code>}</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>producer.send("aiops-alerts", key=event["service"], value=event)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>producer.flush()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

安装：

```bash
pip install kafka-python
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install kafka-python</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>from kafka import KafkaConsumer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>consumer = KafkaConsumer(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 5 行 | <code>    "aiops-alerts",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 6 行 | <code>    bootstrap_servers="localhost:9092",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>    group_id="aiops-triage-worker",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 8 行 | <code>    auto_offset_reset="earliest",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>    enable_auto_commit=True,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>    value_deserializer=lambda v: json.loads(v.decode("utf-8")),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>for message in consumer:</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 14 行 | <code>    event = message.value</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 15 行 | <code>    print(message.topic, message.partition, message.offset, event)</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |

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
poll
  -> process
  -> auto commit periodically
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>poll</code> | 这一行里的英文要这样读：`poll` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; process</code> | 这一行要理解这些英文词：`process` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; auto commit periodically</code> | 这一行要理解这些英文词：`auto commit periodically` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

风险：处理失败但 offset 已提交，消息可能被跳过。

更稳的模式：

```text
poll
  -> process successfully
  -> commit offset
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>poll</code> | 这一行里的英文要这样读：`poll` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; process successfully</code> | 这一行要理解这些英文词：`process successfully` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; commit offset</code> | 这一行要理解这些英文词：`commit offset` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

这能实现更接近 at-least-once 的处理语义。

## Consumer Group 和 Lag

### Consumer group 并行

同一个 group 内，partition 会分配给 consumer：

```text
topic: aiops-alerts, partitions=3

group: incident-writer
  consumer-1 -> partition 0
  consumer-2 -> partition 1
  consumer-3 -> partition 2
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>topic: aiops-alerts, partitions=3</code> | `partitions` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`3` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 3 行 | <code>group: incident-writer</code> | `group` 是分组，冒号后面的 `incident-writer` 是这个字段的示例内容或模板表达式。 |
| 第 4 行 | <code>  consumer-1 -&gt; partition 0</code> | 这一行要理解这些英文词：`consumer-1` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`partition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  consumer-2 -&gt; partition 1</code> | 这一行要理解这些英文词：`consumer-2` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`partition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  consumer-3 -&gt; partition 2</code> | 这一行要理解这些英文词：`consumer-3` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`partition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

如果 consumer-2 挂了，group 会 rebalance：

```text
consumer-1 -> partition 0, partition 1
consumer-3 -> partition 2
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>consumer-1 -&gt; partition 0, partition 1</code> | 这一行要理解这些英文词：`consumer-1` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`partition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 2 行 | <code>consumer-3 -&gt; partition 2</code> | 这一行要理解这些英文词：`consumer-3` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`partition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

### 查看 consumer group

```bash
bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --list
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-consumer-groups.sh \</code> | 执行 `bin/kafka-consumer-groups.sh` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  --bootstrap-server localhost:9092 \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --list</code> | 注释行，提前说明下面命令的目的或注意事项。 |

查看 lag：

```bash
bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --group aiops-triage-worker
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-consumer-groups.sh \</code> | 执行 `bin/kafka-consumer-groups.sh` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  --bootstrap-server localhost:9092 \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --describe \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --group aiops-triage-worker</code> | 注释行，提前说明下面命令的目的或注意事项。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>producer 写入速度 &gt; consumer 处理速度</code> | 这一行里的英文要这样读：`producer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`consumer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-configs.sh \</code> | 执行 `bin/kafka-configs.sh` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  --bootstrap-server localhost:9092 \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --entity-type topics \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --entity-name aiops-alerts \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --alter \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 6 行 | <code>  --add-config retention.ms=604800000</code> | 注释行，提前说明下面命令的目的或注意事项。 |

`604800000` 毫秒是 7 天。

### 大小保留

也可以按大小：

```bash
--add-config retention.bytes=1073741824
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>--add-config retention.bytes=1073741824</code> | 注释行，提前说明下面命令的目的或注意事项。 |

### Log compaction

Log compaction 会按 key 保留较新的记录，用于保存某个 key 的最新状态。

```bash
--add-config cleanup.policy=compact
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>--add-config cleanup.policy=compact</code> | 注释行，提前说明下面命令的目的或注意事项。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 2 行 | <code>  -&gt; 消费端做幂等</code> | 这一行表示上一级主题下的子项“消费端做幂等”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |

例如写 MySQL 时用 event_id 做唯一键，重复消费不会插入两次。

## Kafka Connect 和 Kafka Streams

### Kafka Connect

Kafka Connect 用来连接外部系统和 Kafka。

```text
source connector
  -> external system to Kafka

sink connector
  -> Kafka to external system
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>source connector</code> | 这一行里的英文要这样读：`source connector` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; external system to Kafka</code> | 这一行要理解这些英文词：`external system to Kafka` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>sink connector</code> | 这一行里的英文要这样读：`sink connector` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 5 行 | <code>  -&gt; Kafka to external system</code> | 这一行要理解这些英文词：`Kafka to external system` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>projects/kafka-alert-stream/</code> | `projects/kafka-alert-stream/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  README.md</code> | `README.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>  requirements.txt</code> | `requirements.txt` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>  sample-events.jsonl</code> | `sample-events.jsonl` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>  producer.py</code> | `producer.py` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>  consumer.py</code> | `consumer.py` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

### sample-events.jsonl

```json
{"event_id":"evt-001","service":"order-api","instance":"10.0.1.11","severity":"critical","alert":"HighErrorRate","value":0.23}
{"event_id":"evt-002","service":"payment-api","instance":"10.0.2.21","severity":"warning","alert":"HighLatency","value":1200}
{"event_id":"evt-003","service":"gateway","instance":"10.0.0.8","severity":"info","alert":"TrafficSpike","value":4200}
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>{"event_id":"evt-001","service":"order-api","instance":"10.0.1.11","severity":"critical","alert":"HighErrorRate","value":0.23}</code> | `event_id` 是事件唯一编号字段，`evt-001` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；`service` 是服务名称字段，`order-api` 是具体服务名，表示这条记录属于这个服务；`instance` 是实例名称字段，`10.0.1.11` 表示IP 地址，表示一台机器或服务端点的位置；`severity` 是告警严重级别字段，`critical` 表示严重级别，通常表示需要优先处理；`alert` 是告警，`HighErrorRate` 是高错误率告警名，表示请求失败比例过高；`value` 是数值字段，`0.23` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 2 行 | <code>{"event_id":"evt-002","service":"payment-api","instance":"10.0.2.21","severity":"warning","alert":"HighLatency","value":1200}</code> | `event_id` 是事件唯一编号字段，`evt-002` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；`service` 是服务名称字段，`payment-api` 是具体服务名，表示这条记录属于这个服务；`instance` 是实例名称字段，`10.0.2.21` 表示IP 地址，表示一台机器或服务端点的位置；`severity` 是告警严重级别字段，`warning` 是告警级别，用来决定响应优先级；`alert` 是告警，`HighLatency` 是高延迟告警名，表示请求耗时过高；`value` 是数值字段，`1200` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 3 行 | <code>{"event_id":"evt-003","service":"gateway","instance":"10.0.0.8","severity":"info","alert":"TrafficSpike","value":4200}</code> | `event_id` 是事件唯一编号字段，`evt-003` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；`service` 是服务名称字段，`gateway` 是具体服务名，表示这条记录属于这个服务；`instance` 是实例名称字段，`10.0.0.8` 表示IP 地址，表示一台机器或服务端点的位置；`severity` 是告警严重级别字段，`info` 是告警级别，用来决定响应优先级；`alert` 是告警，`TrafficSpike` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；`value` 是数值字段，`4200` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

### requirements.txt

```text
kafka-python
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>kafka-python</code> | 这一行里的英文要这样读：`kafka-python` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>from pathlib import Path</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>from kafka import KafkaProducer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <code>producer = KafkaProducer(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>    bootstrap_servers="localhost:9092",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 8 行 | <code>    key_serializer=lambda value: value.encode("utf-8"),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>    value_serializer=lambda value: json.dumps(value, ensure_ascii=False).encode("utf-8"),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>for line in Path("sample-events.jsonl").read_text(encoding="utf-8").splitlines():</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 13 行 | <code>    event = json.loads(line)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 14 行 | <code>    producer.send("aiops-alerts", key=event["service"], value=event)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>producer.flush()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>print("sent events")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <code>from kafka import KafkaConsumer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <code>consumer = KafkaConsumer(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <code>    "aiops-alerts",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>    bootstrap_servers="localhost:9092",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 8 行 | <code>    group_id="aiops-demo-consumer",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>    auto_offset_reset="earliest",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>    enable_auto_commit=True,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>    value_deserializer=lambda value: json.loads(value.decode("utf-8")),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>for message in consumer:</code> | 循环处理一组数据，常用于逐条处理告警、日志或指标样本。 |
| 第 15 行 | <code>    print(</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 16 行 | <code>        {</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>            "topic": message.topic,</code> | `topic` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`message.topic` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 18 行 | <code>            "partition": message.partition,</code> | `partition` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`message.partition` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 19 行 | <code>            "offset": message.offset,</code> | `offset` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`message.offset` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 20 行 | <code>            "key": message.key.decode("utf-8") if message.key else None,</code> | `key` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`message.key.decode("utf-8") if message.key else None` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 21 行 | <code>            "value": message.value,</code> | `value` 是数值字段，`message.value` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；这是 Python 字典里的一个键值对。 |
| 第 22 行 | <code>        }</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>    )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-topics.sh --create \</code> | 执行 `bin/kafka-topics.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  --topic aiops-alerts \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --partitions 3 \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --replication-factor 1 \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --bootstrap-server localhost:9092</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 7 行 | <code>pip install -r requirements.txt</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |
| 第 8 行 | <code>python producer.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 9 行 | <code>python consumer.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-storage.sh random-uuid</code> | 执行 `bin/kafka-storage.sh` 相关命令，后面的参数决定它具体操作什么对象。 |

作用：生成 KRaft cluster id。

### kafka-storage.sh format

```bash
bin/kafka-storage.sh format --standalone -t "$KAFKA_CLUSTER_ID" -c config/server.properties
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-storage.sh format --standalone -t "$KAFKA_CLUSTER_ID" -c config/server.properties</code> | 执行 `bin/kafka-storage.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

作用：格式化 Kafka 存储目录。

### kafka-server-start.sh

```bash
bin/kafka-server-start.sh config/server.properties
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-server-start.sh config/server.properties</code> | 执行 `bin/kafka-server-start.sh` 相关命令，后面的参数决定它具体操作什么对象。 |

作用：启动 broker。

### kafka-topics.sh --create

```bash
bin/kafka-topics.sh --create --topic aiops-alerts --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-topics.sh --create --topic aiops-alerts --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092</code> | 执行 `bin/kafka-topics.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

作用：创建 topic。

### kafka-topics.sh --describe

```bash
bin/kafka-topics.sh --describe --topic aiops-alerts --bootstrap-server localhost:9092
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-topics.sh --describe --topic aiops-alerts --bootstrap-server localhost:9092</code> | 执行 `bin/kafka-topics.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

作用：查看 topic、partition、leader、replicas、ISR。

### kafka-console-producer.sh

```bash
bin/kafka-console-producer.sh --topic aiops-alerts --bootstrap-server localhost:9092
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-console-producer.sh --topic aiops-alerts --bootstrap-server localhost:9092</code> | 执行 `bin/kafka-console-producer.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

作用：命令行写事件。

### kafka-console-consumer.sh

```bash
bin/kafka-console-consumer.sh --topic aiops-alerts --from-beginning --bootstrap-server localhost:9092
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-console-consumer.sh --topic aiops-alerts --from-beginning --bootstrap-server localhost:9092</code> | 执行 `bin/kafka-console-consumer.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

作用：命令行读事件。

### kafka-consumer-groups.sh --describe

```bash
bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group aiops-demo-consumer
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group aiops-demo-consumer</code> | 执行 `bin/kafka-consumer-groups.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

作用：查看 consumer group offset 和 lag。

### kafka-configs.sh

```bash
bin/kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name aiops-alerts \
  --describe
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-configs.sh --bootstrap-server localhost:9092 \</code> | 执行 `bin/kafka-configs.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  --entity-type topics \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --entity-name aiops-alerts \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --describe</code> | 注释行，提前说明下面命令的目的或注意事项。 |

作用：查看配置。

修改 retention：

```bash
bin/kafka-configs.sh --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name aiops-alerts \
  --alter \
  --add-config retention.ms=604800000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-configs.sh --bootstrap-server localhost:9092 \</code> | 执行 `bin/kafka-configs.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  --entity-type topics \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 3 行 | <code>  --entity-name aiops-alerts \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 4 行 | <code>  --alter \</code> | 注释行，提前说明下面命令的目的或注意事项。 |
| 第 5 行 | <code>  --add-config retention.ms=604800000</code> | 注释行，提前说明下面命令的目的或注意事项。 |

### kafka-delete-records.sh

```bash
bin/kafka-delete-records.sh --bootstrap-server localhost:9092 --offset-json-file delete-records.json
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>bin/kafka-delete-records.sh --bootstrap-server localhost:9092 --offset-json-file delete-records.json</code> | 执行 `bin/kafka-delete-records.sh` 相关命令，后面的参数决定它具体操作什么对象。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>broker 是否启动</code> | 这一行里的英文要这样读：`broker` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; bootstrap-server 是否正确</code> | 这一行要理解这些英文词：`bootstrap-server` 是server=服务端。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; advertised.listeners 是否客户端可达</code> | 这一行要理解这些英文词：`advertised.listeners` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 安全认证是否需要</code> | 这一行表示上一级主题下的子项“安全认证是否需要”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 5 行 | <code>  -&gt; 网络和端口是否通</code> | 这一行表示上一级主题下的子项“网络和端口是否通”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |

### 消费不到数据

```text
topic 是否有数据
  -> 是否用 --from-beginning
  -> group 是否已有 offset
  -> retention 是否清掉历史
  -> consumer 是否订阅正确 topic
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>topic 是否有数据</code> | 这一行里的英文要这样读：`topic` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; 是否用 --from-beginning</code> | 这一行要理解这些英文词：`from-beginning` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; group 是否已有 offset</code> | 这一行要理解这些英文词：`group` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`offset` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; retention 是否清掉历史</code> | 这一行要理解这些英文词：`retention` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; consumer 是否订阅正确 topic</code> | 这一行要理解这些英文词：`consumer` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`topic` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

### lag 变大

```text
看 consumer group lag
  -> 看每个 partition lag
  -> 看 consumer 数量和 partition 数
  -> 看处理耗时
  -> 看下游系统
  -> 看 rebalance 日志
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>看 consumer group lag</code> | 这一行里的英文要这样读：`consumer group lag` 这个英文标识可以拆开理解为：分组。 |
| 第 2 行 | <code>  -&gt; 看每个 partition lag</code> | 这一行要理解这些英文词：`partition lag` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 看 consumer 数量和 partition 数</code> | 这一行要理解这些英文词：`consumer` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`partition` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 看处理耗时</code> | 这一行表示上一级主题下的子项“看处理耗时”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 5 行 | <code>  -&gt; 看下游系统</code> | 这一行表示上一级主题下的子项“看下游系统”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 6 行 | <code>  -&gt; 看 rebalance 日志</code> | 这一行要理解这些英文词：`rebalance` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

## 学习证据

学完这篇，建议留下这些证据：

1. Kafka 启动命令或 Docker 说明。
2. `kafka-topics.sh --describe` 输出截图。
3. 一个 `sample-events.jsonl`。
4. 一个 Python producer。
5. 一个 Python consumer。
6. 一次 `kafka-consumer-groups.sh --describe` lag 输出。
7. 一篇 README，解释 topic、partition、offset、consumer group 和 AIOps 事件流设计。
