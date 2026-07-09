# RabbitMQ 深讲

> 学习目标：理解 RabbitMQ 为什么适合做消息队列，能讲清 producer、exchange、queue、binding、routing key、consumer、ack、prefetch、durable、dead letter、retry、TTL、vhost、permission 和 management UI，并能把它用于 AIOps 告警事件缓冲、异步 runbook 和微服务解耦。

## 官方资料

- [RabbitMQ Documentation](https://www.rabbitmq.com/docs)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials)
- [AMQP 0-9-1 Model Explained](https://www.rabbitmq.com/tutorials/amqp-concepts)
- [RabbitMQ Consumers](https://www.rabbitmq.com/docs/consumers)
- [Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms)
- [Dead Letter Exchanges](https://www.rabbitmq.com/docs/dlx)
- [TTL](https://www.rabbitmq.com/docs/ttl)
- [Management Plugin](https://www.rabbitmq.com/docs/management)
- [Monitoring RabbitMQ](https://www.rabbitmq.com/docs/monitoring)

说明：本文基于 RabbitMQ 官方文档和 AIOps 场景重新组织，不复制官方全文。重点讲清“消息如何从生产者到消费者”和“坏了先看哪里”。

## 场景开场

你有一个告警接收服务，它会收到 Alertmanager webhook。最直接的写法是：

```text
Alertmanager -> alert-api -> LLM 分析 -> 写数据库 -> 发通知
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager -&gt; alert-api -&gt; LLM 分析 -&gt; 写数据库 -&gt; 发通知</code> | 这一行要理解这些英文词：`Alertmanager` 是Prometheus 生态里的告警管理器；`alert-api` 是alert=告警，api=应用程序接口；`LLM` 是大语言模型。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

问题是：LLM 慢、数据库偶尔抖、通知服务偶尔失败。alert-api 如果同步等所有步骤完成，告警入口就会很脆弱。

更合理的做法是：

```text
Alertmanager
  |
  v
alert-api
  |
  v
RabbitMQ queue
  |
  +--> enrich-worker
  +--> notify-worker
  +--> rca-worker
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager</code> | 这一行里的英文要这样读：`Alertmanager` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 2 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 3 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 4 行 | <code>alert-api</code> | 这一行里的英文要这样读：`alert-api` 这个英文标识可以拆开理解为：告警，应用程序接口。 |
| 第 5 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 6 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 7 行 | <code>RabbitMQ queue</code> | 这一行里的英文要这样读：`RabbitMQ queue` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 8 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 9 行 | <code>  +--&gt; enrich-worker</code> | 这一行要理解这些英文词：`enrich-worker` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  +--&gt; notify-worker</code> | 这一行要理解这些英文词：`notify-worker` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  +--&gt; rca-worker</code> | 这一行要理解这些英文词：`rca-worker` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

这样 alert-api 先把告警事件放进队列，后面的分析、通知、RCA 可以异步处理。RabbitMQ 负责暂存消息、分发消息、控制消费速度和处理失败消息。

## 一句话人话版

RabbitMQ 是消息队列中间件：生产者把消息发给 exchange，exchange 按规则路由到 queue，消费者从 queue 取消息并确认处理结果。

## 为什么要学 RabbitMQ

RabbitMQ 在运维和 AIOps 中常用于：

- 告警事件缓冲。
- 异步任务队列。
- 微服务解耦。
- 削峰填谷。
- runbook 执行队列。
- 通知发送队列。
- 失败重试和死信处理。

Kafka 更像事件日志和流平台，适合高吞吐、可回放、事件流分析。RabbitMQ 更像任务分发和消息路由系统，适合复杂路由、工作队列、可靠投递和消费者确认。

## 核心概念

### Producer

Producer 是发送消息的一方。

例子：

```text
alert-api publishes AlertReceived
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alert-api publishes AlertReceived</code> | 这一行里的英文要这样读：`alert-api publishes AlertReceived` 这个英文标识可以拆开理解为：告警，应用程序接口，告警。 |

生产者要关心：

- 发到哪个 exchange。
- routing key 是什么。
- 消息是否持久化。
- 发布是否确认。
- 失败时是否重试。

### Exchange

Exchange 接收生产者消息，并根据类型和 binding 规则把消息路由到 queue。

常见类型：

| 类型 | 路由方式 | 适合场景 |
|---|---|---|
| direct | routing key 精确匹配 | 按 severity、service 路由 |
| fanout | 广播到绑定队列 | 一个事件多个消费者都要处理 |
| topic | 通配符匹配 | `alert.order.critical` 这类层级路由 |
| headers | 按 header 匹配 | 少用，规则更复杂 |

### Queue

Queue 是消息排队等待消费的地方。

需要关注：

- durable：队列元数据是否持久。
- message durability：消息是否持久。
- ready：等待消费的消息数。
- unacked：已投递但未确认的消息数。
- consumers：消费者数量。

### Binding

Binding 是 exchange 到 queue 的路由规则。

例子：

```text
exchange: alerts.topic
binding key: alert.*.critical
queue: critical-alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>exchange: alerts.topic</code> | `exchange` 是exchange 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `alerts.topic` 是这个字段的示例内容或模板表达式。 |
| 第 2 行 | <code>binding key: alert.*.critical</code> | `binding key` 是binding key 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `alert.*.critical` 是这个字段的示例内容或模板表达式。 |
| 第 3 行 | <code>queue: critical-alerts</code> | `queue` 是queue 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `critical-alerts` 是这个字段的示例内容或模板表达式。 |

当 routing key 是 `alert.order.critical` 时，消息会进入 `critical-alerts`。

### Consumer

Consumer 是消费消息的一方。

消费者要关心：

- 一次拿多少消息。
- 处理成功后何时 ack。
- 处理失败时 reject、requeue 还是进入死信队列。
- 消费是否幂等。
- 消费速度是否跟得上生产速度。

### Ack

Ack 是消费者告诉 RabbitMQ：“这条消息我处理完了，可以删除。”

如果消费者拿到消息后进程崩溃，没有 ack，RabbitMQ 可以把消息重新投递给其他消费者。

这也是 RabbitMQ 适合任务队列的原因之一。

### Prefetch

prefetch 控制 RabbitMQ 一次最多给消费者多少条未确认消息。

如果 prefetch 太大：

- 一个慢消费者可能拿走太多消息。
- 消息堆在消费者内存里。
- 其他消费者闲着。

如果 prefetch 合理：

- 消费更均衡。
- 慢任务不会拖垮全部消费者。

常见起点：

```text
prefetch = 1 到 50，根据任务耗时调整
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>prefetch = 1 到 50，根据任务耗时调整</code> | `prefetch` 是主机、服务、告警或资源的示例名称；`prefetch` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`1` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

## 架构和数据流

```text
producer
  |
  | publish(exchange, routing_key, message)
  v
exchange
  |
  | binding rules
  v
queue
  |
  | deliver
  v
consumer
  |
  | ack / reject / nack
  v
RabbitMQ updates message state
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>producer</code> | 这一行里的英文要这样读：`producer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 3 行 | <code>  &#124; publish(exchange, routing_key, message)</code> | 这一行里的英文要这样读：`publish` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`exchange` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`routing_key` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值；`message` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 5 行 | <code>exchange</code> | 这一行里的英文要这样读：`exchange` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 6 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 7 行 | <code>  &#124; binding rules</code> | 这一行里的英文要这样读：`binding rules` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 8 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 9 行 | <code>queue</code> | 这一行里的英文要这样读：`queue` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 10 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 11 行 | <code>  &#124; deliver</code> | 这一行里的英文要这样读：`deliver` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 12 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 13 行 | <code>consumer</code> | 这一行里的英文要这样读：`consumer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 14 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 15 行 | <code>  &#124; ack / reject / nack</code> | `| ack / reject / nack` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 16 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 17 行 | <code>RabbitMQ updates message state</code> | 这一行里的英文要这样读：`RabbitMQ updates message state` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

AIOps 告警队列示例：

```text
Alertmanager webhook
  |
  v
alert-api
  |
  v
exchange: alerts.topic
  |
  +-- routing key alert.order.critical --> queue: critical-alerts
  +-- routing key alert.order.warning  --> queue: normal-alerts
  +-- routing key alert.*.*            --> queue: aiops-analysis
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager webhook</code> | 这一行里的英文要这样读：`Alertmanager webhook` 这个英文标识可以拆开理解为：通过 HTTP 回调接收通知的接口。 |
| 第 2 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 3 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 4 行 | <code>alert-api</code> | 这一行里的英文要这样读：`alert-api` 这个英文标识可以拆开理解为：告警，应用程序接口。 |
| 第 5 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 6 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 7 行 | <code>exchange: alerts.topic</code> | `exchange` 是exchange 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `alerts.topic` 是这个字段的示例内容或模板表达式。 |
| 第 8 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 9 行 | <code>  +-- routing key alert.order.critical --&gt; queue: critical-alerts</code> | 这一行要理解这些英文词：`routing key alert.order.critical` 是alert=告警；`queue` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`critical-alerts` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  +-- routing key alert.order.warning  --&gt; queue: normal-alerts</code> | 这一行要理解这些英文词：`routing key alert.order.warning` 是alert=告警；`queue` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`normal-alerts` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  +-- routing key alert.*.*            --&gt; queue: aiops-analysis</code> | 这一行要理解这些英文词：`routing key alert.` 是alert=告警；`queue` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`aiops-analysis` 是aiops=智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

## 和 Kafka 的区别

| 对比 | RabbitMQ | Kafka |
|---|---|---|
| 核心模型 | queue + exchange | append-only log |
| 消息保留 | 消费后通常删除 | 按时间/大小保留 |
| 重放 | 不是核心能力 | 核心能力 |
| 路由 | exchange 很强 | topic/partition 为主 |
| 消费确认 | ack/nack 语义清晰 | offset 提交 |
| 适合 | 任务队列、复杂路由、RPC-like 异步 | 事件流、日志、回放、流处理 |
| AIOps 例子 | 告警任务分发、通知队列 | 事件总线、历史分析、特征流 |

不要问“哪个更好”，要问“现在要解决的是任务分发，还是事件流平台”。

## 安装和启动

本地实验可以用 Docker：

```bash
docker run --rm --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:4-management
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run --rm --name rabbitmq \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -p 5672:5672 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -p 15672:15672 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  rabbitmq:4-management</code> | 执行 `rabbitmq:4-management` 相关命令，后面的参数决定它具体操作什么对象。 |

端口：

| 端口 | 用途 |
|---|---|
| 5672 | AMQP 客户端连接 |
| 15672 | Management UI |

访问：

```text
http://localhost:15672
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>http://localhost:15672</code> | `http` 表示访问协议，`localhost:15672` 是域名或主机名，`/` 是具体接口路径；真实环境要换成自己的域名和路径。 |

默认用户名密码通常是：

```text
guest / guest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>guest / guest</code> | `guest / guest` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

注意：默认 guest 用户只适合本地实验，生产环境必须创建独立用户、vhost 和权限。

## Python 入门实验

目录：

```text
labs/rabbitmq-alert-queue/
  compose.yaml
  producer.py
  worker.py
  requirements.txt
  README.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labs/rabbitmq-alert-queue/</code> | `labs/rabbitmq-alert-queue/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  compose.yaml</code> | `compose.yaml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>  producer.py</code> | `producer.py` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>  worker.py</code> | `worker.py` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>  requirements.txt</code> | `requirements.txt` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>  README.md</code> | `README.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

`requirements.txt`：

```text
pika==1.3.2
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pika==1.3.2</code> | `pika` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`=1.3.2` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

### 生产者

```python
import json
import pika

connection = pika.BlockingConnection(pika.ConnectionParameters("localhost"))
channel = connection.channel()

channel.exchange_declare(exchange="alerts.topic", exchange_type="topic", durable=True)
channel.queue_declare(queue="critical-alerts", durable=True)
channel.queue_bind(
    exchange="alerts.topic",
    queue="critical-alerts",
    routing_key="alert.*.critical",
)

message = {
    "alertname": "OrderApiHighErrorRate",
    "service": "order-api",
    "severity": "critical",
}

channel.basic_publish(
    exchange="alerts.topic",
    routing_key="alert.order.critical",
    body=json.dumps(message).encode("utf-8"),
    properties=pika.BasicProperties(delivery_mode=2),
)

connection.close()
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import pika</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 4 行 | <code>connection = pika.BlockingConnection(pika.ConnectionParameters("localhost"))</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 5 行 | <code>channel = connection.channel()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>channel.exchange_declare(exchange="alerts.topic", exchange_type="topic", durable=True)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>channel.queue_declare(queue="critical-alerts", durable=True)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 9 行 | <code>channel.queue_bind(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 10 行 | <code>    exchange="alerts.topic",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>    queue="critical-alerts",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>    routing_key="alert.*.critical",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>message = {</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 16 行 | <code>    "alertname": "OrderApiHighErrorRate",</code> | `alertname` 是告警名称字段，`OrderApiHighErrorRate` 是高错误率告警名，表示请求失败比例过高；这是 Python 字典里的一个键值对。 |
| 第 17 行 | <code>    "service": "order-api",</code> | `service` 是服务名称字段，`order-api` 是具体服务名，表示这条记录属于这个服务；这是 Python 字典里的一个键值对。 |
| 第 18 行 | <code>    "severity": "critical",</code> | `severity` 是告警严重级别字段，`critical` 表示严重级别，通常表示需要优先处理；这是 Python 字典里的一个键值对。 |
| 第 19 行 | <code>}</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>channel.basic_publish(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 22 行 | <code>    exchange="alerts.topic",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 23 行 | <code>    routing_key="alert.order.critical",</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 24 行 | <code>    body=json.dumps(message).encode("utf-8"),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 25 行 | <code>    properties=pika.BasicProperties(delivery_mode=2),</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 26 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <code>connection.close()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

关键点：

- `exchange_declare` 创建 exchange。
- `queue_declare` 创建 queue。
- `queue_bind` 创建路由规则。
- `delivery_mode=2` 表示消息持久化。

### 消费者

```python
import json
import pika

connection = pika.BlockingConnection(pika.ConnectionParameters("localhost"))
channel = connection.channel()

channel.queue_declare(queue="critical-alerts", durable=True)
channel.basic_qos(prefetch_count=1)


def handle_message(ch, method, properties, body):
    alert = json.loads(body)
    print("received:", alert["alertname"], alert["service"])
    ch.basic_ack(delivery_tag=method.delivery_tag)


channel.basic_consume(queue="critical-alerts", on_message_callback=handle_message)
channel.start_consuming()
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import pika</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 4 行 | <code>connection = pika.BlockingConnection(pika.ConnectionParameters("localhost"))</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 5 行 | <code>channel = connection.channel()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>channel.queue_declare(queue="critical-alerts", durable=True)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 8 行 | <code>channel.basic_qos(prefetch_count=1)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>def handle_message(ch, method, properties, body):</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 12 行 | <code>    alert = json.loads(body)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>    print("received:", alert["alertname"], alert["service"])</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 14 行 | <code>    ch.basic_ack(delivery_tag=method.delivery_tag)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>channel.basic_consume(queue="critical-alerts", on_message_callback=handle_message)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>channel.start_consuming()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

关键点：

- `basic_qos(prefetch_count=1)` 控制未 ack 消息数量。
- 处理成功后 `basic_ack`。
- 如果处理失败，要设计 reject / retry / dead letter。

## 死信和重试

坏消息不能无限重试，否则会形成失败风暴。

常见策略：

```text
main queue
  |
  | consumer fails
  v
retry queue with TTL
  |
  | TTL expires
  v
main queue
  |
  | exceeds retry limit
  v
dead letter queue
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>main queue</code> | 这一行里的英文要这样读：`main queue` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 3 行 | <code>  &#124; consumer fails</code> | 这一行里的英文要这样读：`consumer fails` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 5 行 | <code>retry queue with TTL</code> | 这一行里的英文要这样读：`retry queue with TTL` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 6 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 7 行 | <code>  &#124; TTL expires</code> | 这一行里的英文要这样读：`TTL expires` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 8 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 9 行 | <code>main queue</code> | 这一行里的英文要这样读：`main queue` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 10 行 | <code>  &#124;</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 11 行 | <code>  &#124; exceeds retry limit</code> | 这一行里的英文要这样读：`exceeds retry limit` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 12 行 | <code>  v</code> | ASCII 图里的连接符号，用来辅助表示上下层关系；真正要理解的是它连接的前后组件。 |
| 第 13 行 | <code>dead letter queue</code> | 这一行里的英文要这样读：`dead letter queue` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

Dead Letter Exchange 适合保存：

- 格式错误的消息。
- 重试多次仍失败的消息。
- 过期消息。
- 被 reject 且不 requeue 的消息。

AIOps 场景里，死信队列要有告警。死信堆积意味着某类自动化任务持续失败。

## 监控指标

RabbitMQ 重点看：

| 指标 | 含义 | 异常解读 |
|---|---|---|
| messages_ready | 等待消费的消息 | 消费慢或消费者不足 |
| messages_unacknowledged | 已投递未确认 | 消费者慢、卡住或 prefetch 太大 |
| consumers | 消费者数量 | 为 0 时无人处理 |
| publish rate | 生产速率 | 流量突增 |
| deliver / ack rate | 消费确认速率 | 低于 publish rate 会堆积 |
| connections | 连接数 | 泄漏或频繁重连 |
| channels | channel 数 | 客户端使用方式异常 |
| memory / disk | 节点资源 | 触发 flow control |

RabbitMQ 可以通过 management UI、HTTP API、Prometheus 插件或 exporter 暴露监控数据。

## 排障路径

### 消息堆积

先看：

1. `messages_ready` 是否增长。
2. `consumers` 是否为 0。
3. `messages_unacknowledged` 是否很高。
4. worker 日志是否报错。
5. 下游数据库/API 是否慢。
6. 是否有单条坏消息反复失败。

处理方向：

- 扩消费者。
- 降低单条任务耗时。
- 调整 prefetch。
- 拆分慢队列。
- 把坏消息送入死信。

### 消费者重复处理

RabbitMQ 至少一次投递很常见。消费者必须尽量幂等。

幂等方法：

- 用 message_id 去重。
- 数据库唯一键。
- 状态机判断。
- 处理结果可重复覆盖。
- 外部动作加幂等键。

### 消息丢失

排查：

- queue 是否 durable。
- message 是否 persistent。
- publisher confirm 是否开启。
- consumer 是否 auto ack。
- broker 是否异常重启。
- 是否错误使用临时队列。

生产环境里，可靠投递要同时考虑生产者确认、队列持久化、消息持久化和消费者 ack。

### 连接失败

检查：

- host / port 是否正确。
- vhost 是否存在。
- 用户权限是否正确。
- 防火墙和网络策略。
- TLS 配置。
- RabbitMQ 节点是否启动。

## 在 AIOps 中的位置

| AIOps 环节 | RabbitMQ 作用 |
|---|---|
| 告警接入 | 缓冲 Alertmanager webhook |
| 告警降噪 | 把事件分发给去重、聚合 worker |
| 自动化 | 排队执行低风险 runbook |
| 通知 | 异步发送飞书、邮件、短信 |
| RAG | 异步构建或刷新知识库任务 |
| RCA | 分发复盘生成、证据收集任务 |
| 稳定性 | 用队列长度和消费延迟识别系统压力 |

RabbitMQ 本身也要纳入监控。消息队列不是“黑盒缓冲区”，队列堆积往往就是故障早期信号。

## 面试怎么讲

RabbitMQ 是基于 AMQP 模型的消息队列。生产者把消息发到 exchange，exchange 根据 binding 和 routing key 把消息路由到 queue，消费者从 queue 消费并通过 ack 确认。它适合任务队列、复杂路由、异步解耦和削峰填谷。

我会重点关注可靠性和排障：生产者侧用 publisher confirm，队列和消息都要持久化；消费者侧关闭 auto ack，处理成功后再 ack；失败消息要有重试和死信队列；消费者要保证幂等。运维排障时，我会先看 ready、unacked、consumer count、publish rate、ack rate、连接数、内存和磁盘，再结合 worker 日志判断是生产过快、消费太慢、消费者挂了，还是下游依赖慢。

## 学习检查清单

- [ ] 我能解释 producer、exchange、queue、binding、routing key、consumer。
- [ ] 我能区分 direct、fanout、topic exchange。
- [ ] 我能说明 ack、nack、reject 的作用。
- [ ] 我能解释 prefetch 为什么影响消费均衡。
- [ ] 我能说明 durable queue 和 persistent message 的区别。
- [ ] 我能画出告警事件进入 RabbitMQ 再被 worker 消费的数据流。
- [ ] 我能解释死信队列和重试队列。
- [ ] 我能说出 RabbitMQ 和 Kafka 的核心区别。
- [ ] 我能排查消息堆积、重复消费、消息丢失和连接失败。
- [ ] 我能说明 RabbitMQ 在 AIOps 告警和自动化中的作用。

## 面试题

1. RabbitMQ 的 exchange、queue、binding 分别是什么？
2. direct、fanout、topic exchange 有什么区别？
3. RabbitMQ 如何保证消费者处理失败后消息不丢？
4. 什么是 ack？auto ack 有什么风险？
5. prefetch 解决什么问题？
6. durable queue 和 persistent message 是一回事吗？
7. 什么是死信队列？什么时候会进入死信？
8. RabbitMQ 和 Kafka 怎么取舍？
9. 消息堆积你会怎么排查？
10. 如何避免重复消费造成副作用？
11. RabbitMQ 在 AIOps 告警链路里能做什么？
12. 生产环境 RabbitMQ 需要监控哪些指标？

## 学习证据

学完后建议提交：

- `labs/rabbitmq-alert-queue/compose.yaml`
- `labs/rabbitmq-alert-queue/producer.py`
- `labs/rabbitmq-alert-queue/worker.py`
- 一张 RabbitMQ Management UI 队列截图。
- 一份 `rabbitmq-alert-queue-runbook.md`。
- 一篇排障记录：`RabbitMQ messages_ready 持续上涨怎么查.md`。
- 一份对比笔记：`RabbitMQ 和 Kafka 在 AIOps 中怎么取舍.md`。
