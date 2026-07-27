# RabbitMQ 深讲

> 学习目标：从零理解 RabbitMQ 的消息流转、可靠性和集群机制，能独立搭建实验环境，能判断消息为什么丢失、重复、积压或卡住，并能在面试中说明生产架构的取舍。

## 版本边界

本文按 **RabbitMQ 4.3.4** 编写，示例客户端使用 **Pika 1.4.2**。

- RabbitMQ 4.3.4 发布于 2026 年 7 月 23 日，版本与支持周期以 [RabbitMQ Release Information](https://www.rabbitmq.com/release-information) 为准。
- RabbitMQ 4.3 开始只支持 Khepri 元数据存储。Mnesia 和旧的网络分区策略已经移除，参见 [RabbitMQ 4.3 Release](https://www.rabbitmq.com/blog/2026/04/23/rabbitmq-4.3-release)。
- 经典队列镜像从 RabbitMQ 4.0 起已经移除。需要复制与多数派一致性时，应优先评估 Quorum Queue。
- 本文实验使用单节点，目的是看清消息链路。单节点实验不能证明生产高可用。
- 阅读本文不能代替 Linux、网络、Python、容量评估和真实项目演练，但可以建立一条完整的 RabbitMQ 学习与排障主线。

## 官方资料

建议先收藏，再按本文顺序使用：

- [Download RabbitMQ](https://www.rabbitmq.com/docs/download)：安装方式和当前版本。
- [AMQP 0-9-1 Model](https://www.rabbitmq.com/tutorials/amqp-concepts)：消息、交换机、队列与绑定的协议模型。
- [Queues](https://www.rabbitmq.com/docs/queues)：队列属性、消息状态、队列类型和顺序边界。
- [Quorum Queues](https://www.rabbitmq.com/docs/quorum-queues)：基于 Raft 的复制队列。
- [Streams](https://www.rabbitmq.com/docs/streams)：可回放的追加日志。
- [Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms)：消费确认与发布确认。
- [Consumer Prefetch](https://www.rabbitmq.com/docs/consumer-prefetch)：未确认消息窗口。
- [Dead Letter Exchanges](https://www.rabbitmq.com/docs/dlx)：死信交换机。
- [Time-To-Live and Expiration](https://www.rabbitmq.com/docs/ttl)：消息和队列过期。
- [Clustering Guide](https://www.rabbitmq.com/docs/clustering)：集群成员、网络与节点发现。
- [Network Partitions](https://www.rabbitmq.com/docs/partitions)：网络分区和多数派行为。
- [Production Checklist](https://www.rabbitmq.com/docs/production-checklist)：生产资源、安全与运行建议。
- [Monitoring](https://www.rabbitmq.com/docs/monitoring) 和 [Prometheus](https://www.rabbitmq.com/docs/prometheus)：指标采集与告警。
- [Access Control](https://www.rabbitmq.com/docs/access-control)：用户、虚拟主机和权限。
- [Upgrade Guide](https://www.rabbitmq.com/docs/upgrade)：滚动升级、版本路径与回滚边界。
- [Pika](https://pypi.org/project/pika/)：本文 Python 客户端。

## 官方知识地图

```text
客户端
  -> Connection：TCP 连接，负责网络和心跳
      -> Channel：连接内的轻量逻辑通道
          -> Publish：生产者发布消息
              -> Exchange：交换机按规则路由
                  -> Binding：绑定声明路由关系
                      -> Queue：队列保存待处理消息
                          -> Consumer：消费者取得消息
                              -> Ack / Nack：确认成功或失败

可靠性
  -> durable / persistent：重启后的声明与消息持久性
  -> publisher confirm：代理是否接管了消息
  -> mandatory / alternate exchange：不可路由消息如何暴露
  -> manual ack：业务处理完成后再确认
  -> idempotency：重复投递时不重复产生业务副作用
  -> retry / dead letter：可重试失败与永久失败分流

生产架构
  -> Khepri：用户、vhost、交换机、队列、绑定、策略等元数据
  -> Classic Queue：单副本普通队列
  -> Quorum Queue：Raft 多副本工作队列
  -> Stream：可回放、适合长积压和多订阅者的追加日志
  -> Prometheus：长期指标采集
  -> Federation / Shovel：跨地域异步传递
```

这里的 `Exchange` 是交换机，负责决定消息去哪里；`Binding` 是绑定关系；`Ack` 是确认；`Nack` 是否定确认；`vhost` 是 virtual host，中文常译为虚拟主机，用来隔离命名空间和权限。

## 推荐学习顺序

1. 先跑通单节点发送和消费。
2. 再理解交换机、路由键和绑定。
3. 补齐发布确认、手动确认、幂等和死信。
4. 对比 Classic Queue、Quorum Queue 和 Stream。
5. 学习集群、多数派、Khepri 和网络分区。
6. 最后练容量、安全、升级、监控和事故排障。

## 场景开场

假设监控系统每秒产生告警，告警处理服务要做三件事：

1. 把高危告警写入工单系统。
2. 把普通告警发送到值班群。
3. 对临时失败进行重试，把无法处理的消息放入死信队列。

如果监控系统直接调用三个下游服务，下游变慢时，上游线程会被占满；下游停机时，上游还要自己保存失败请求；每增加一个下游，上游都要改代码。

RabbitMQ 可以放在中间：

```text
监控系统 -> RabbitMQ -> 工单消费者
                     -> 通知消费者
                     -> 审计消费者
```

上游只负责可靠发布消息，下游按自己的速度处理。RabbitMQ 由此承担缓冲、路由和投递责任。

## 一句话解释

RabbitMQ 是一个消息代理：生产者把消息交给它，它按照路由规则把消息放入队列，再把消息交给消费者处理。

## 小白最容易问的八个问题

### 1. RabbitMQ 是数据库吗

不是。它可以把消息写入磁盘，但主要目标是消息路由与投递，不是通用查询、关联分析和永久数据保存。业务事实仍应写入业务数据库。

### 2. 生产者会直接把消息写进队列吗

通常不会。生产者把消息发布到交换机，交换机根据路由键和绑定把消息路由到一个或多个队列。空字符串名称代表默认交换机，它会按队列名直接路由。

### 3. 消费者收到消息就代表处理成功吗

不代表。消费者收到消息后，业务代码还可能失败。使用手动确认时，应在业务副作用完成后发送 `ack`。

### 4. 消息写入磁盘就绝对不会丢吗

不绝对。还要看队列是否持久、消息是否持久、生产者是否收到发布确认、队列是否复制、集群是否仍有多数派，以及磁盘和运维操作是否可靠。

### 5. 为什么会重复消费

消费者可能已经完成业务处理，但在发送 `ack` 前崩溃。RabbitMQ 不知道业务是否完成，只能重新投递。重复投递是至少一次语义的正常结果，所以消费者必须幂等。

### 6. 消息积压一定是消费者太少吗

不一定。也可能是消费者卡在外部接口、预取过大、消息毒化后无限重试、连接被资源告警阻塞、队列失去多数派，或发布速度长期大于确认速度。

### 7. 三节点集群是否会自动复制所有消息

不会。集群共享拓扑和元数据，但消息数据是否复制取决于队列类型。RabbitMQ 4.x 的 Classic Queue 是单副本；Quorum Queue 和 Stream 才提供复制能力。

### 8. RabbitMQ 能做到真正的 exactly-once 吗

消息代理通常提供至少一次或至多一次基础语义。端到端“业务只生效一次”要靠发布确认、手动确认、幂等键、数据库唯一约束、Outbox/Inbox 等应用设计共同完成。

## 为什么 AIOps 工程师需要学习 RabbitMQ

RabbitMQ 常位于这些链路中：

- 告警事件异步分发。
- 自动化任务调度。
- 日志或审计事件缓冲。
- 模型推理任务排队。
- CMDB 变更事件通知。
- Runbook 执行状态回传。
- 工单、短信和邮件异步通知。

AIOps 系统一旦出现“告警没收到”“任务执行两遍”“队列积压”“故障恢复后雪崩”，RabbitMQ 的路由、确认、重试、幂等、容量和多数派就是排障核心。

## RabbitMQ 解决什么问题

### 解耦

生产者不需要知道消费者部署在哪里，只需要遵守消息契约。

### 削峰

短时间突发流量先进入队列，消费者按可承受速度处理。

### 异步

非实时步骤不阻塞主请求，例如先返回“已受理”，再异步生成报告。

### 路由

一条消息可以按业务类型、严重级别或来源进入不同队列。

### 失败隔离

失败消息可以重试、延迟或进入死信队列，不必拖垮正常消息。

## 核心对象

## Connection：连接

**它是什么**

`Connection` 是客户端到 RabbitMQ 节点的一条 TCP 网络连接。

**为什么需要**

建立 TCP、TLS 和身份认证都比较昂贵。RabbitMQ 让多个 Channel 复用同一连接，降低连接开销。

**它怎么工作**

连接承载协议帧和心跳。心跳用于发现断开的网络连接，但心跳过低会因短暂抖动产生误判。

**怎么使用和观察**

- 应用通常长期复用连接，不要每条消息新建连接。
- 发布者和消费者最好使用不同连接，避免发布阻塞影响消费确认。
- 管理界面和 `rabbitmqctl list_connections` 可以查看连接数量、用户、vhost 和状态。

**坏了怎么排**

先看 DNS、端口 5672、TLS、用户名密码、vhost 权限和心跳超时，再看连接是否被内存或磁盘告警阻塞。Pika 不会替应用自动恢复所有连接，应用要实现带退避的重连。

## Channel：通道

**它是什么**

`Channel` 是一个 TCP 连接内的轻量逻辑通道。发布、声明队列、消费和确认都发生在 Channel 上。

**为什么需要**

一个进程可能有多个并发发布或消费单元。使用多个 Channel 比建立很多 TCP 连接更轻。

**它怎么工作**

每个 Channel 有自己的编号和协议状态。消费确认的 `delivery tag` 只在当前 Channel 内有效。

**怎么使用和观察**

连接长期复用，Channel 按线程或执行单元使用。多数客户端的 Channel 不是线程安全对象，不要让多个线程无保护地共用。

**坏了怎么排**

如果日志出现 `unknown delivery tag`，检查是否在错误 Channel 上确认、是否重复确认、是否混用了自动确认和手动确认。声明参数冲突也会关闭 Channel。

## Virtual Host：虚拟主机

**它是什么**

Virtual Host，简称 `vhost`，是 RabbitMQ 内的逻辑隔离空间。不同 vhost 可以有同名交换机和队列。

**为什么需要**

它隔离环境、团队和权限，例如 `/dev`、`/test`、`/prod`。

**它怎么工作**

客户端连接时选择一个 vhost。交换机、队列、绑定、策略和权限都属于该 vhost。

**怎么使用和观察**

```bash
rabbitmqctl add_vhost aiops
rabbitmqctl add_user aiops_app 'replace-with-strong-secret'
rabbitmqctl set_permissions -p aiops aiops_app "^aiops\." "^aiops\." "^aiops\."
```

三段正则依次控制 `configure`、`write`、`read` 权限。生产环境应按应用最小授权。

**坏了怎么排**

出现 `ACCESS_REFUSED` 时检查用户是否存在、连接的 vhost 是否正确、权限正则是否覆盖目标交换机和队列。

## Producer：生产者

**它是什么**

Producer 是发布消息的应用，例如监控平台的告警生成模块。

**为什么需要**

它把业务事件编码成稳定消息契约，并可靠交给 RabbitMQ。

**它怎么工作**

生产者选择交换机、路由键、消息属性和消息体，再通过 Channel 发布。

**怎么使用和观察**

消息应至少包含：

- `message_id`：业务唯一标识，用于幂等和追踪。
- `content_type`：消息格式，例如 `application/json`。
- `timestamp`：产生时间。
- `type`：事件类型。
- `correlation_id`：跨服务关联标识。

**坏了怎么排**

不要只看 `basic_publish` 调用没有报错。还要启用发布确认，处理不可路由消息，记录消息标识，并监控确认延迟和 nack 数量。

## Message：消息

**它是什么**

消息由消息体和属性组成。消息体是业务数据，属性描述持久性、内容类型、标识和过期时间等。

**为什么需要**

稳定的消息契约让生产者和消费者独立演进，并让故障排查有统一证据。

**它怎么工作**

RabbitMQ 通常把消息体视为字节，不理解 JSON 字段的业务含义。序列化、版本兼容和字段校验由应用负责。

**怎么使用和观察**

推荐使用带版本的 JSON：

```json
{
  "schema_version": 1,
  "event_id": "alert-20260727-0001",
  "event_type": "HighErrorRate",
  "service": "order-api",
  "severity": "critical",
  "occurred_at": "2026-07-27T10:20:00+08:00"
}
```

**坏了怎么排**

消费失败时保留原始消息、消息属性、队列、路由键和异常。不要把密码、令牌或完整个人数据直接放入消息。

## Exchange：交换机

**它是什么**

Exchange 接收生产者发布的消息，再根据类型、路由键和绑定决定消息进入哪些队列。

**为什么需要**

生产者不必绑定具体队列，路由拓扑可以独立调整。

**它怎么工作**

常见四种交换机：

| 类型 | 匹配方式 | 典型场景 |
|---|---|---|
| `direct` | 路由键完全相等 | 按严重级别或任务类型分队列 |
| `topic` | 按点分词并使用 `*`、`#` 匹配 | `alert.prod.critical` 这类分层事件 |
| `fanout` | 忽略路由键，广播到所有绑定队列 | 配置刷新、缓存失效 |
| `headers` | 按消息头匹配 | 多字段组合路由，使用相对较少 |

`*` 匹配一个单词，`#` 匹配零个或多个单词。

**怎么使用和观察**

```text
路由键：alert.prod.critical
绑定键：alert.*.critical      可以匹配
绑定键：alert.#               可以匹配
绑定键：alert.dev.warning     不匹配
```

**坏了怎么排**

消息没有进入队列时，依次核对 vhost、交换机名称、交换机类型、路由键、绑定键和队列状态。发布时使用 `mandatory=true` 暴露不可路由消息。

## Binding：绑定

**它是什么**

Binding 是交换机与队列之间的路由关系，可以带绑定键。

**为什么需要**

没有绑定，非默认交换机通常不知道应把消息送到哪里。

**它怎么工作**

同一队列可以绑定多个交换机，同一交换机也可以绑定多个队列。一条消息可能被复制到多个队列，但一个队列内仍是一份消息。

**怎么使用和观察**

```bash
rabbitmqctl list_bindings -p aiops source_name destination_name routing_key
```

**坏了怎么排**

不要只看队列存在。确认绑定确实在同一个 vhost，绑定键符合交换机类型。

## Queue：队列

**它是什么**

Queue 保存等待消费者处理的消息。消息常见状态是 `ready` 和 `unacked`：

- `ready`：还没有交给消费者。
- `unacked`：已经交给消费者，但还没收到确认。

**为什么需要**

队列把生产速度和消费速度解耦，并为失败恢复保留待处理消息。

**它怎么工作**

队列声明包含名称、类型、`durable`、`exclusive`、`auto-delete` 和参数。已有同名队列再次声明时，关键属性必须等价，否则 Channel 会因 `PRECONDITION_FAILED` 关闭。

**怎么使用和观察**

```bash
rabbitmqctl list_queues -p aiops \
  name type durable messages_ready messages_unacknowledged consumers
```

**坏了怎么排**

- `ready` 持续上升：发布速度大于确认速度，或消费者不工作。
- `unacked` 很高：消费者处理慢、卡住，或 prefetch 太大。
- 消费者为 0：检查部署、连接、权限和订阅。
- 队列反复创建删除：检查 `exclusive`、`auto-delete` 和客户端重连逻辑。

## Consumer：消费者

**它是什么**

Consumer 是从队列接收并处理消息的应用。

**为什么需要**

它把消息变成业务动作，例如创建工单、执行 Runbook 或调用模型。

**它怎么工作**

RabbitMQ 向消费者推送消息。多个消费者订阅同一普通队列时，消息会被分摊，不是每个消费者都收到一份。

**怎么使用和观察**

消费者应有明确的超时、幂等、重试分类和优雅关闭逻辑。关闭前停止接收新消息，等待正在处理的消息完成或让其重新投递。

**坏了怎么排**

先分清消费者是没收到消息、收到后处理慢、处理失败，还是处理成功但没确认。分别查看连接、Channel、消费速率、确认速率、外部依赖和错误日志。

## Ack、Nack 与 Reject

**它是什么**

- `ack`：消费者确认消息处理完成。
- `nack`：消费者否定确认，可以选择重新入队。
- `reject`：拒绝单条消息，也可以选择重新入队。

**为什么需要**

RabbitMQ 不知道业务函数是否成功，必须由消费者明确告知。

**它怎么工作**

手动确认时，消息在确认前保持 `unacked`。连接或 Channel 关闭后，未确认消息会重新变成可投递状态。

**怎么使用和观察**

```python
# 业务处理成功后确认。
channel.basic_ack(delivery_tag=method.delivery_tag)

# 临时故障可重新入队，但不能无休止快速循环。
channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

# 格式错误属于永久失败，拒绝后交给死信策略。
channel.basic_reject(delivery_tag=method.delivery_tag, requeue=False)
```

**坏了怎么排**

确认必须在收到消息的同一个 Channel 上执行。不要在业务提交前 `ack`，也不要对永久错误无限 `requeue=true`。

## Prefetch：预取

**它是什么**

Prefetch 是 RabbitMQ 在未收到确认前，最多允许发给消费者多少条消息。

**为什么需要**

它限制在途消息，防止一个慢消费者拿走过多任务，也提供反压。

**它怎么工作**

RabbitMQ 通常把 `prefetch_count` 分别应用到每个消费者。值为 0 表示不限制，不适合作为生产默认值。

**怎么使用和观察**

```python
channel.basic_qos(prefetch_count=10)
```

- 单条任务耗时长或占内存大：从 1 到 10 小步测试。
- 任务很轻且网络延迟明显：可以逐步增大。
- 不能只追求吞吐，还要观察 P95/P99 延迟、内存和公平性。

**坏了怎么排**

`unacked` 很高且消费者内存上涨时先降低 prefetch；消费者经常空闲且队列大量积压时，再评估并发数、外部依赖和 prefetch。

## Publisher Confirm：发布确认

**它是什么**

Publisher Confirm 是 RabbitMQ 对生产者的异步或同步确认，表示目标队列已经按其语义接管消息。

**为什么需要**

TCP 写入成功不代表消息已经安全进入队列。连接可能在写入与落盘之间断开。

**它怎么工作**

RabbitMQ 对发布序号返回 `ack` 或 `nack`。对于持久 Quorum Queue，确认与多数派复制相关。确认只说明代理接管消息，不代表消费者业务成功。

**怎么使用和观察**

```python
channel.confirm_delivery()
channel.basic_publish(
    exchange="alerts.topic",
    routing_key="alert.prod.critical",
    body=b"...",
    mandatory=True,
)
```

`mandatory=True` 要求消息无法路由到任何队列时通知生产者。生产者应记录消息标识、确认结果和耗时。

**坏了怎么排**

超时时不要直接假定失败，也不要盲目生成新消息标识。结果可能处于“代理已接收，但客户端没收到确认”的不确定状态。使用相同业务幂等键重试。

## Consumer Ack 与 Publisher Confirm 的关系

二者彼此独立：

```text
生产者 -> RabbitMQ：Publisher Confirm
RabbitMQ -> 消费者：Consumer Ack
```

发布确认解决“代理是否接管”；消费确认解决“消费者是否处理完成”。只做其中一个，端到端链路仍有缺口。

## 三种交换机路由实例

### Direct

```text
exchange = alert.direct
routing_key = critical

critical 队列绑定 critical
warning 队列绑定 warning
```

高危消息只进入 `critical` 队列。

### Topic

```text
exchange = alert.topic
routing_key = alert.prod.critical

值班队列绑定 alert.prod.*
审计队列绑定 alert.#
```

值班队列接收生产环境任意级别告警，审计队列接收全部告警。

### Fanout

```text
exchange = config.broadcast

华北实例队列绑定该交换机
华东实例队列绑定该交换机
```

发布一次配置刷新事件，两个队列各得到一份消息。

## 消息从发布到确认的完整数据路径

```text
1. 生产者建立 Connection 和 Channel
2. 生产者序列化业务事件并生成 message_id
3. 生产者向 Exchange 发布消息
4. Exchange 根据 routing key 和 Binding 计算目标 Queue
5. Queue 按类型保存消息
6. RabbitMQ 向生产者返回 confirm
7. Consumer 按 prefetch 接收消息
8. Consumer 校验消息并执行幂等业务
9. Consumer 成功后发送 ack
10. RabbitMQ 从 Queue 删除或提交该消息的消费进度
```

第 4 步没有匹配队列时，消息可能被丢弃。第 8 步完成、第 9 步之前消费者崩溃时，消息会重复投递。第 6 步超时时，生产者无法确定消息是否已经进入队列。这些不确定窗口正是可靠性设计的重点。

## 队列类型怎么选

## Classic Queue：经典队列

### 它是什么

RabbitMQ 4.x 的 Classic Queue 是单副本普通队列。

### 适合什么

- 可接受节点故障后短暂不可用或消息丢失的任务。
- 临时、独占和自动删除队列。
- 不需要复制的低成本场景。

### 不适合什么

需要节点级故障容忍的关键业务。三节点集群不会自动把 Classic Queue 的消息复制三份。

### 观察与排障

查看队列所在节点。该节点不可用时，即使其他集群节点在线，单副本队列也不能提供同等的数据安全。

## Quorum Queue：仲裁队列

### 它是什么

Quorum Queue 是基于 Raft 共识算法的复制工作队列。一个副本是 Leader，其他副本是 Follower。

### 为什么需要

它让消息和队列状态复制到多个节点，并使用多数派确认日志，从而容忍少数节点故障。

### 它怎么工作

三副本队列需要至少两个副本形成多数派。Leader 接收写入，把日志复制给 Follower，多数派接受后才能提交。失去多数派时，系统优先保持一致性，会拒绝或暂停写入，而不是让两个分区各自接受冲突消息。

### 怎么使用和观察

```python
channel.queue_declare(
    queue="alerts.work",
    durable=True,
    arguments={"x-queue-type": "quorum"},
)
```

生产通常使用 3 或 5 个成员。偶数副本不会增加可容忍故障数，超过 7 个成员通常只会增加共识成本。

```bash
rabbitmq-queues quorum_status --vhost aiops alerts.work
rabbitmq-diagnostics check_if_node_is_quorum_critical
```

### 坏了怎么排

- 没有 Leader：检查网络、节点时钟、磁盘和多数派是否在线。
- 发布被 nack：检查是否失去多数派或达到队列限制。
- 副本落后：看磁盘延迟、节点负载和网络丢包。
- 不要为短命、独占队列使用 Quorum Queue。

### 重要限制

Quorum Queue 面向高可靠工作队列，不适合超低延迟、超大长积压、临时独占队列和大量订阅者回放。RabbitMQ 4.x 对 Quorum Queue 的默认投递次数限制为 20，超过限制的消息会被丢弃或死信，具体取决于死信配置。

## Stream：流

### 它是什么

Stream 是不可变的追加日志。消费者读取消息时维护偏移量，消息不会因为一个消费者确认就立刻从日志删除。

### 为什么需要

它适合消息回放、长时间保留、大积压、多个独立订阅者和高吞吐事件流。

### 它怎么工作

消息按段追加并按保留策略删除。消费者可以从起点、时间或偏移量重新读取。

### 怎么使用和观察

典型场景：

- 告警事件回放。
- 审计流水。
- 模型特征事件。
- 多团队独立消费同一事件历史。

### 坏了怎么排

观察发布速率、读取速率、消费者偏移滞后、磁盘使用和保留策略。不要把 Stream 当成普通“处理完即删除”的任务队列。

## 选择表

| 需求 | 优先选择 | 原因 |
|---|---|---|
| 临时回复队列 | Classic Queue | 支持独占和自动删除 |
| 关键任务至少一次处理 | Quorum Queue | 多副本、Raft、多数派 |
| 可回放事件历史 | Stream | 按偏移读取、保留日志 |
| 数百万长积压或大量订阅者 | Stream | 比普通工作队列更匹配 |
| 单节点低成本非关键任务 | Classic Queue | 资源开销较低 |

选择不是只看吞吐。还要同时考虑延迟、积压长度、保留时间、订阅模型、数据安全和运维能力。

## RabbitMQ 4.3 的状态模型

## Khepri 保存什么

Khepri 是 RabbitMQ 4.3 唯一支持的元数据存储，保存：

- 用户和权限。
- vhost。
- 交换机、队列声明和绑定。
- 策略和运行参数。
- 集群拓扑相关元数据。

Khepri 不保存队列和 Stream 的消息正文。消息数据由对应队列类型自己的存储和复制机制负责。

## 为什么这个区别重要

“元数据恢复”不等于“消息数据恢复”。导出 definitions 可以恢复用户、vhost、交换机、队列和绑定声明，但不能替代消息备份或跨集群灾备。

## Khepri 怎么达成一致

Khepri 使用 Raft 共识算法复制元数据。RabbitMQ 4.3 的关键复制组件，包括 Khepri、Quorum Queue 和 Stream 协调器，都以多数派为基础。生产集群因此应使用奇数节点，并把节点放在低延迟、可靠的局域网中。

## 集群与网络分区

### 集群是什么

RabbitMQ 集群让多个节点共享用户、vhost、交换机、队列和绑定等拓扑信息，并让支持复制的队列跨节点保存数据。

### 推荐拓扑

生产起步通常是 3 个节点：

```text
应用 -> 四层负载均衡或客户端节点列表
          -> rabbit-1
          -> rabbit-2
          -> rabbit-3

Quorum Queue A：rabbit-1 / rabbit-2 / rabbit-3
Khepri 元数据：rabbit-1 / rabbit-2 / rabbit-3
```

两个节点不推荐，因为失去任意一个节点后无法同时兼顾多数派和故障容忍。

### 网络边界

RabbitMQ 集群面向同一低延迟局域网，不应跨高延迟或不稳定 WAN 拉成一个集群。跨地域使用 Federation 或 Shovel 异步传递，并明确恢复点目标和重复消息处理。

### 分区时会发生什么

对于 Raft 组件，拥有多数派的一侧可以选出 Leader 并继续工作；少数派侧不能提交写入。没有多数派时，关键写入会失败或暂停。这是以可用性换一致性。

### 怎么排查

```bash
rabbitmq-diagnostics cluster_status
rabbitmq-diagnostics check_running
rabbitmq-diagnostics check_local_alarms
rabbitmqctl list_queues -p aiops name type state
rabbitmq-queues quorum_status --vhost aiops alerts.work
```

不要在证据不足时强制删节点。先确认网络、节点身份、磁盘状态、在线副本和当前 Leader，评估操作是否会进一步失去多数派。

## 可靠性语义

## At-most-once：至多一次

消息最多处理一次，可能丢失。

典型做法是自动确认，或业务处理前就确认。优点是简单、低延迟；缺点是消费者崩溃时消息无法恢复。

适合允许丢失的低价值采样，不适合工单、支付、变更执行和关键告警。

## At-least-once：至少一次

消息不会轻易丢失，但可能重复。

需要：

- 发布者确认。
- 持久队列和持久消息。
- 消费者手动确认。
- 失败重试。
- 业务幂等。

这是关键任务最常见的基础语义。

## Exactly-once：业务恰好生效一次

消息网络存在不确定窗口，不能只靠 RabbitMQ 的一个开关实现端到端 exactly-once。工程上通常追求：

```text
至少一次投递 + 幂等消费 = 业务效果只发生一次
```

常用手段：

- 用 `message_id` 建立数据库唯一约束。
- 在同一数据库事务中写 Inbox 记录和业务结果。
- 调用外部 API 时传递幂等键。
- 生产侧用 Transactional Outbox，避免“业务提交了但消息没发”。

## Transactional Outbox：事务发件箱

业务服务在同一个数据库事务中写业务表和 `outbox` 表。独立发布进程读取 `outbox`，发布到 RabbitMQ，收到 confirm 后标记已发送。

```text
业务事务
  -> 更新订单
  -> 插入 outbox 事件

发布进程
  -> 读取未发送事件
  -> 发布并等待 confirm
  -> 标记已发送
```

发布进程可能在 RabbitMQ 已接收后、标记已发送前崩溃，因此仍可能重复发布。消费者必须幂等。

## Inbox：收件箱幂等

消费者在业务数据库中记录已处理的 `message_id`。重复消息到来时，如果唯一键已存在，就跳过业务副作用并确认消息。

```sql
CREATE TABLE consumer_inbox (
    message_id VARCHAR(100) PRIMARY KEY,
    processed_at TIMESTAMP NOT NULL
);
```

Inbox 记录和业务更新应在同一数据库事务中提交。否则仍会出现“一边成功、一边失败”的窗口。

## 不丢消息需要哪些条件

至少要同时检查：

1. 交换机和队列是持久声明。
2. 消息属性 `delivery_mode=2`。
3. 生产者启用 confirm 并处理 nack、超时和不可路由。
4. 关键队列使用 Quorum Queue，而不是假设集群自动复制 Classic Queue。
5. 消费者在业务成功后手动 ack。
6. 消费者幂等。
7. 死信、容量限制、磁盘告警和人工删除被纳入监控。
8. 备份、灾备和恢复流程做过演练。

只配置 `durable=true` 不等于端到端可靠。

## 不可路由消息

生产者发布到交换机后，如果没有任何绑定匹配：

- `mandatory=false` 时，消息可能被代理直接丢弃。
- `mandatory=true` 时，代理把消息退回生产者。
- 也可以给交换机配置 Alternate Exchange，把不可路由消息送到兜底交换机。

生产应记录退回消息数量并告警。不可路由通常意味着路由键拼错、绑定缺失、环境拓扑不一致或发布顺序错误。

## 重试、死信和毒消息

## 死信是什么

消息在这些情况下可以进入 Dead Letter Exchange，简称 DLX：

- 消费者 `reject` 或 `nack` 且 `requeue=false`。
- 消息过期。
- 队列达到长度限制并按策略移出消息。
- Quorum Queue 消息超过投递次数限制。

DLX 是交换机，不是特殊队列。还要为 DLX 绑定死信队列。

## 为什么策略优于硬编码参数

生产环境优先使用 Policy 配置 TTL、DLX、长度和投递限制，因为策略可以在线调整。硬编码 `x-arguments` 往往要求删除并重建队列才能修改。

```bash
rabbitmqctl set_policy -p aiops alerts-dlx "^alerts\." \
  '{"dead-letter-exchange":"alerts.dlx"}' \
  --apply-to queues
```

实验为了自包含会在代码里声明参数，生产应由平台统一管理策略。

## 重试分类

### 可重试失败

例如下游 503、短暂网络超时、临时限流。应指数退避或进入带 TTL 的重试队列，不能立即无限重入主队列。

### 永久失败

例如 JSON 格式错误、必填字段缺失、业务对象不存在。应进入死信队列，等待人工或修复程序处理。

### 未知失败

先保留上下文和原始消息，设置有限次数重试，超过阈值进入死信。不要让一条毒消息拖垮整个队列。

## 延迟重试队列

一个常见拓扑：

```text
主队列处理失败
  -> 5 秒重试队列
      -> TTL 到期后死信回主交换机
          -> 主队列再次处理

超过最大次数
  -> 最终死信队列
```

每次重试应保留原始 `message_id`，增加重试计数，并控制总时间预算。多个固定延迟等级比每条消息创建一个临时队列更容易管理。

## RabbitMQ 4.3 原生延迟重试

RabbitMQ 4.3 为 Quorum Queue 增加了原生 delayed retry。消息可以先留在原队列内部，到达延迟时间后再允许重新投递，不必在主队列和 TTL 重试队列之间来回重写。

```bash
rabbitmqctl set_policy -p aiops qq-delayed-retry "^alerts\.work$" \
  '{"delayed-retry-type":"all","delayed-retry-min":5000,"delayed-retry-max":60000}' \
  --apply-to quorum_queues
```

- `delayed-retry-type`：哪些返回或失败要延迟，`disabled` 为关闭，`all` 为全部。
- `delayed-retry-min`：第一次延迟的最小毫秒数。
- `delayed-retry-max`：线性退避的最大毫秒数。
- 计算近似为 `min(delayed-retry-min x delivery-count, delayed-retry-max)`。

如果整个数据库都不可用，应暂停消费者或执行整体限流，而不是给每一条消息分别延迟。原生延迟重试更适合单个租户限流、单行锁冲突这类局部失败。

### RabbitMQ 4.3 的两个重新投递计数

Quorum Queue 会区分：

- `acquired-count`：消息每次重新入队都会增加。
- `delivery-count`：只有被认定为失败的投递才增加，并用于 poison message 的 delivery limit。

AMQP 0-9-1 的 `basic.nack` 重新入队只增加 `acquired-count`，不会增加 `delivery-count`；`basic.reject`、客户端崩溃或连接丢失会增加失败计数。换句话说，不能靠无限 `basic.nack(requeue=true)` 自动撞上 delivery limit，应用仍要实现有限重试预算。

## 消费者超时

消费者拿到消息后长期不确认，会占用 unacked 窗口。RabbitMQ 4.3 把 Quorum Queue 的 consumer timeout 放入队列自身处理，超时后返回消息，并优先只取消超时消费者。

```ini
# 全局默认值，单位是毫秒；生产需按最长合法任务时长设置。
consumer_timeout = 1800000
```

也可以通过消费者参数、队列参数或队列策略设置 `x-consumer-timeout` / `consumer-timeout`。超时时间短于合法任务时长会制造重复投递；设置过长则不能及时回收卡死消费者。

## TTL 与队列长度

TTL 使用毫秒。`60000` 表示 60 秒，不是 60 分钟。

```bash
rabbitmqctl set_policy -p aiops alerts-ttl "^alerts\.retry\." \
  '{"message-ttl":60000}' \
  --apply-to queues

rabbitmqctl set_policy -p aiops alerts-limit "^alerts\.work$" \
  '{"max-length-bytes":1073741824,"overflow":"reject-publish"}' \
  --apply-to queues
```

`reject-publish` 会拒绝新发布，并可通过 publisher confirm 返回 nack。默认 `drop-head` 会从队头移除旧消息。选择时要明确“保旧消息”还是“保新消息”的业务含义。

## 顺序保证

单个队列在简单情况下按入队顺序投递，但这些因素会改变业务观察到的顺序：

- 多个并发消费者完成时间不同。
- 消息被 nack 后重新入队。
- 优先级队列。
- 不同队列或分区并行。
- 网络重连和重复发布。

严格顺序场景可以评估：

- 单队列、单消费者。
- Quorum Queue 的 Single Active Consumer。
- Stream 按分区键和偏移消费。
- 在业务层按实体版本号拒绝旧事件。

严格顺序通常牺牲吞吐和可用性，必须说明顺序范围是“全局”还是“同一业务键”。

## 消息优先级

RabbitMQ 4.3 的 Quorum Queue 支持 32 个严格优先级，数值更高的消息先投递。它适合少量紧急告警插队，但不能替代容量规划：

- 持续高优先级流量会让低优先级消息饥饿。
- 管理界面应同时观察各优先级积压。
- 生产者必须限制优先级取值，不能让每个团队任意定义。
- 真正需要独立 SLO 时，拆成独立队列通常比共享一个优先级队列更清楚。

## 生产架构设计

## 基础三节点方案

```text
客户端
  -> 节点列表或 TCP 负载均衡
      -> RabbitMQ 1
      -> RabbitMQ 2
      -> RabbitMQ 3

关键任务：3 副本 Quorum Queue
临时回复：Classic exclusive Queue
回放审计：3 副本 Stream
指标：rabbitmq_prometheus -> Prometheus -> Grafana / Alertmanager
日志：节点日志 -> 日志平台
```

客户端必须能重连到其他节点。只给客户端配置一个节点地址，会让三节点集群仍然存在单接入点。

## 容量要回答的六个问题

1. 峰值发布速率是多少。
2. 峰值确认速率是多少。
3. 单条消息平均和 P99 大小是多少。
4. 最长允许积压多久。
5. 需要保留多少磁盘和内存安全余量。
6. 节点或消费者故障时，剩余容量能否承接流量。

## 三个基础公式

### 积压增长速度

```text
积压增长速度 = 发布速率 - 确认速率
```

发布 5000 条/秒，确认 3500 条/秒，积压每秒增加 1500 条。

### 清空积压时间

```text
清空时间 = 当前积压 / (确认速率 - 发布速率)
```

只有确认速率大于发布速率时公式才有意义。100 万条积压、发布 3000 条/秒、确认 5000 条/秒，理论清空时间约 500 秒。实际还要考虑消息大小、下游限流和重试。

### 稳态在途数量

Little's Law 可以写成：

```text
系统内平均消息数 = 平均到达速率 x 平均停留时间
```

它用于稳定系统的量级估算，不适合直接解释正在持续恶化的积压。

## 内存与磁盘

RabbitMQ 默认内存高水位约为可用内存的 60%。官方生产建议通常在 0.4 到 0.7 之间评估，并给操作系统、文件缓存和其他进程留出余量。

磁盘剩余阈值不能沿用开发环境的小默认值。生产应根据内存高水位、写入速率、恢复时间和运维响应时间设置更大的绝对值。

触发内存或磁盘告警后，RabbitMQ 会对发布连接施加流控或阻塞。此时生产者延迟升高，而消费者可能仍在排空队列。

## 文件描述符

连接、队列和磁盘文件都消耗文件描述符。生产节点应配置至少数万级限制，并按连接与队列的 P95 数量留余量。发现 `too many open files` 时不能只重启，要修正操作系统限制并排查连接泄漏。

## 连接与 Channel 规划

- 不要建立大量短连接。
- 发布者和消费者使用独立连接池。
- Channel 数量要有上限。
- 客户端重连使用指数退避和随机抖动。
- 心跳一般不要低于 5 秒，避免瞬时抖动造成误断。
- 负载均衡空闲超时必须大于心跳周期。

## 安全边界

### 身份认证

生产不要使用 `guest`。`guest` 默认只允许从 localhost 登录，也不应被放开给远程生产应用。

### 最小权限

按应用创建独立用户、vhost 和权限正则。发布者通常只需写交换机，消费者通常只需读队列，部署组件才需要声明拓扑。

### TLS

跨主机流量应启用 TLS。客户端校验证书链和主机名，不要为了“先跑通”永久关闭校验。更高要求可以使用双向 TLS、X.509 或 OAuth 2。

### 消息安全

- 不在消息中放明文密码和令牌。
- 敏感字段加密或只传引用。
- 管理端口 15672 不暴露到公网。
- Prometheus 端口 15692 放在监控网络。
- 管理员、应用和只读监控账号分离。

### 审计

记录用户、vhost、来源、连接事件、权限变更、策略变更和队列删除。拓扑变更应走版本控制和审批。

## 安装与启动

## 前置条件

- Docker Desktop 或兼容 Docker Engine。
- Python 3.10 或更高版本。
- 可用端口 5672、15672、15692。
- 至少 2 GB 可用内存用于单节点实验。

## 创建实验目录

```powershell
New-Item -ItemType Directory rabbitmq-lab
Set-Location rabbitmq-lab
```

## `compose.yaml`

```yaml
services:
  rabbitmq:
    image: rabbitmq:4.3.4-management
    hostname: rabbitmq-lab
    ports:
      - "5672:5672"   # AMQP 客户端端口
      - "15672:15672" # 管理界面端口
      - "15692:15692" # Prometheus 指标端口
    environment:
      RABBITMQ_DEFAULT_USER: aiops
      RABBITMQ_DEFAULT_PASS: aiops-lab-only
      RABBITMQ_DEFAULT_VHOST: aiops
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s
      retries: 12

volumes:
  rabbitmq-data:
```

`aiops-lab-only` 只用于本机实验，不能用于生产。

## 启动

```powershell
docker compose up -d
docker compose ps
docker compose logs --tail 100 rabbitmq
```

预期 `rabbitmq` 最终显示为 `healthy`。

打开 `http://localhost:15672`，用户名 `aiops`，密码 `aiops-lab-only`，选择 vhost `aiops`。

## 启用 Prometheus 插件

```powershell
docker compose exec rabbitmq rabbitmq-plugins enable rabbitmq_prometheus
Invoke-WebRequest http://localhost:15692/metrics |
  Select-Object -ExpandProperty StatusCode
```

预期状态码为 `200`。

## 生产配置字典

生产环境通常把配置写入 `rabbitmq.conf`，再由配置管理或镜像发布。

```ini
# 把内存高水位设为可用内存的 50%。
vm_memory_high_watermark.relative = 0.50

# 磁盘剩余低于 4 GiB 时触发磁盘告警。
disk_free_limit.absolute = 4GB

# 每 10 秒更新一次统计，配合不低于 15 秒的 Prometheus 抓取周期。
collect_statistics_interval = 10000

# 30 秒心跳用于发现失效连接。
heartbeat = 30

# 限制单个 TCP 连接可创建的 Channel 数量。
channel_max = 256

# 禁止远程使用 guest。
loopback_users.guest = true
```

这些值不是可直接复制的生产答案。应根据节点内存、磁盘、连接规模、消息大小、峰值流量和恢复时间压测后确定。

## 常用命令与 API 字典

## 节点健康

```bash
rabbitmq-diagnostics ping
rabbitmq-diagnostics status
rabbitmq-diagnostics check_running
rabbitmq-diagnostics check_local_alarms
rabbitmq-diagnostics cluster_status
```

- `ping`：检查 Erlang 虚拟机和 RabbitMQ 节点是否响应。
- `status`：查看运行时、内存、文件描述符和监听端口。
- `check_running`：确认 RabbitMQ 应用正在运行。
- `check_local_alarms`：查看本节点内存和磁盘告警。
- `cluster_status`：查看节点成员、运行节点和分区信息。

## 队列观察

```bash
rabbitmqctl list_queues -p aiops \
  name type state messages_ready messages_unacknowledged \
  message_bytes consumers consumer_utilisation
```

- `messages_ready`：待投递消息数。
- `messages_unacknowledged`：已投递未确认消息数。
- `message_bytes`：消息体占用的字节量。
- `consumers`：消费者数量。
- `consumer_utilisation`：队列能够立即向消费者投递的时间比例，低值可能表示消费能力不足或受限。

## 连接与 Channel

```bash
rabbitmqctl list_connections name user vhost state channels send_pend
rabbitmqctl list_channels connection number consumer_count messages_unacknowledged
```

`send_pend` 持续较高可能表示网络或客户端读取跟不上。Channel 激增通常说明应用没有复用或存在泄漏。

## 用户和权限

```bash
rabbitmqctl list_users
rabbitmqctl list_vhosts
rabbitmqctl list_permissions -p aiops
rabbitmqctl list_user_permissions aiops_app
```

## 策略

```bash
rabbitmqctl list_policies -p aiops
rabbitmqctl set_policy -p aiops policy-name "^queue-prefix\." \
  '{"max-length-bytes":1073741824}' \
  --apply-to queues
rabbitmqctl clear_policy -p aiops policy-name
```

策略变更前先确认正则匹配范围。过宽的 `.*` 可能影响整个 vhost。

## HTTP API

管理插件提供 HTTP API：

```powershell
$pair = "aiops:aiops-lab-only"
$auth = [Convert]::ToBase64String(
  [Text.Encoding]::ASCII.GetBytes($pair)
)

Invoke-RestMethod `
  -Uri "http://localhost:15672/api/queues/aiops" `
  -Headers @{ Authorization = "Basic $auth" }
```

生产应使用专用只读监控账号和 HTTPS，不要把密码写进脚本仓库。

## 基础实验：可靠告警队列

实验目标：

- 声明 Topic Exchange、Quorum Queue 和死信队列。
- 使用 publisher confirm 和 `mandatory`。
- 使用手动 ack、prefetch 和 Inbox 幂等。
- 看见消息从发布到确认的完整路径。

## 1. 安装客户端

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install pika==1.4.2
```

## 2. 创建 `producer.py`

```python
import json
import uuid

import pika
from pika.exceptions import UnroutableError


credentials = pika.PlainCredentials("aiops", "aiops-lab-only")
parameters = pika.ConnectionParameters(
    host="localhost",
    port=5672,
    virtual_host="aiops",
    credentials=credentials,
    heartbeat=30,
    blocked_connection_timeout=60,
)

connection = pika.BlockingConnection(parameters)
channel = connection.channel()

channel.exchange_declare(
    exchange="alerts.topic",
    exchange_type="topic",
    durable=True,
)
channel.exchange_declare(
    exchange="alerts.dlx",
    exchange_type="direct",
    durable=True,
)

channel.queue_declare(
    queue="alerts.dead",
    durable=True,
    arguments={"x-queue-type": "quorum"},
)
channel.queue_bind(
    queue="alerts.dead",
    exchange="alerts.dlx",
    routing_key="alerts.dead",
)

channel.queue_declare(
    queue="alerts.work",
    durable=True,
    arguments={
        "x-queue-type": "quorum",
        "x-delivery-limit": 5,
        "x-dead-letter-exchange": "alerts.dlx",
        "x-dead-letter-routing-key": "alerts.dead",
    },
)
channel.queue_bind(
    queue="alerts.work",
    exchange="alerts.topic",
    routing_key="alert.prod.*",
)

channel.confirm_delivery()

event_id = str(uuid.uuid4())
message = {
    "schema_version": 1,
    "event_id": event_id,
    "event_type": "HighErrorRate",
    "service": "order-api",
    "severity": "critical",
}

try:
    channel.basic_publish(
        exchange="alerts.topic",
        routing_key="alert.prod.critical",
        body=json.dumps(message).encode("utf-8"),
        properties=pika.BasicProperties(
            content_type="application/json",
            delivery_mode=pika.DeliveryMode.Persistent,
            message_id=event_id,
            type="HighErrorRate",
        ),
        mandatory=True,
    )
    print(f"published and confirmed: {event_id}")
except UnroutableError:
    print(f"unroutable: {event_id}")
    raise
finally:
    connection.close()
```

代码中的关键点：

- `durable=True`：交换机和队列在节点重启后保留声明。
- `delivery_mode=Persistent`：消息按持久消息处理。
- `confirm_delivery()`：启用发布确认。
- `mandatory=True`：没有任何匹配队列时让生产者感知失败。
- `message_id`：消费端幂等和链路追踪的标识。
- `x-queue-type=quorum`：实验队列使用 Quorum Queue。
- `x-delivery-limit=5`：失败投递计数超过限制后进入死信；RabbitMQ 4.3 的 `basic.nack` 返回不增加该失败计数。

## 3. 创建 `worker.py`

```python
import json
import sqlite3

import pika


database = sqlite3.connect("inbox.db")
database.execute(
    """
    CREATE TABLE IF NOT EXISTS consumer_inbox (
        message_id TEXT PRIMARY KEY,
        processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """
)
database.commit()

credentials = pika.PlainCredentials("aiops", "aiops-lab-only")
parameters = pika.ConnectionParameters(
    host="localhost",
    port=5672,
    virtual_host="aiops",
    credentials=credentials,
    heartbeat=30,
)

connection = pika.BlockingConnection(parameters)
channel = connection.channel()
channel.basic_qos(prefetch_count=10)


def handle_message(channel, method, properties, body):
    message_id = properties.message_id

    if not message_id:
        print("missing message_id, send to dead letter")
        channel.basic_reject(
            delivery_tag=method.delivery_tag,
            requeue=False,
        )
        return

    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        print(f"invalid JSON: {message_id}")
        channel.basic_reject(
            delivery_tag=method.delivery_tag,
            requeue=False,
        )
        return

    try:
        with database:
            inserted = database.execute(
                """
                INSERT OR IGNORE INTO consumer_inbox(message_id)
                VALUES (?)
                """,
                (message_id,),
            ).rowcount

            if inserted:
                print(
                    "create ticket:",
                    event["event_type"],
                    event["service"],
                    event["severity"],
                )
            else:
                print(f"duplicate ignored: {message_id}")
    except (KeyError, TypeError):
        print(f"invalid schema: {message_id}")
        channel.basic_reject(
            delivery_tag=method.delivery_tag,
            requeue=False,
        )
        return
    except sqlite3.Error as error:
        print(f"temporary database error: {error}")
        channel.basic_nack(
            delivery_tag=method.delivery_tag,
            requeue=True,
        )
        return

    channel.basic_ack(delivery_tag=method.delivery_tag)


channel.basic_consume(
    queue="alerts.work",
    on_message_callback=handle_message,
    auto_ack=False,
)

print("waiting for alerts, press Ctrl+C to stop")
try:
    channel.start_consuming()
except KeyboardInterrupt:
    channel.stop_consuming()
finally:
    connection.close()
    database.close()
```

SQLite 只用于展示 Inbox 思路。真实系统要把 Inbox 与工单更新放进同一个业务数据库事务；调用外部系统时还要使用对方支持的幂等键。

## 4. 运行

终端一：

```powershell
.\.venv\Scripts\Activate.ps1
python worker.py
```

终端二：

```powershell
.\.venv\Scripts\Activate.ps1
python producer.py
```

生产者预期：

```text
published and confirmed: <一个 UUID>
```

消费者预期：

```text
create ticket: HighErrorRate order-api critical
```

## 5. 验证

```powershell
docker compose exec rabbitmq rabbitmqctl list_queues -p aiops `
  name type messages_ready messages_unacknowledged consumers
```

预期：

- `alerts.work` 类型为 `quorum`。
- 消费完成后 `messages_ready` 和 `messages_unacknowledged` 都为 0。
- 消费者运行时 `consumers` 为 1。

## 6. 如果没有成功，先检查

1. `docker compose ps` 是否显示 healthy。
2. 5672 端口是否被其他程序占用。
3. Pika 连接的 vhost 是否为 `aiops`。
4. 路由键是否匹配 `alert.prod.*`。
5. 队列是否已经用不同参数声明过。
6. 管理界面是否显示连接、Channel 和消费者。

## 故障注入实验：崩溃、重投与死信

实验目标：

- 观察消费者在 ack 前崩溃后的重新投递。
- 验证相同 `message_id` 不会重复产生业务副作用。
- 把格式错误的毒消息送入死信队列。

## 前置条件

- 基础实验已经成功。
- `worker.py` 暂时停止。
- `alerts.work` 和 `alerts.dead` 已存在。

## 1. 创建 `crash_worker.py`

```python
import os

import pika


credentials = pika.PlainCredentials("aiops", "aiops-lab-only")
parameters = pika.ConnectionParameters(
    host="localhost",
    port=5672,
    virtual_host="aiops",
    credentials=credentials,
    heartbeat=30,
)

connection = pika.BlockingConnection(parameters)
channel = connection.channel()
channel.basic_qos(prefetch_count=1)


def crash_before_ack(channel, method, properties, body):
    print(
        "received but not acknowledged:",
        properties.message_id,
        "redelivered=",
        method.redelivered,
        flush=True,
    )
    os._exit(1)


channel.basic_consume(
    queue="alerts.work",
    on_message_callback=crash_before_ack,
    auto_ack=False,
)
channel.start_consuming()
```

## 2. 触发 ack 前崩溃

```powershell
python producer.py
python crash_worker.py
```

`crash_worker.py` 收到消息后立即退出，没有发送 ack。再启动正常消费者：

```powershell
python worker.py
```

预期能再次收到消息。管理界面或日志中的 `redelivered` 表明这是重新投递。重复并不表示 RabbitMQ 出错，而是至少一次语义在不确定窗口中的正确行为。

再次使用相同 `message_id` 发布时，Inbox 唯一键应使消费者输出：

```text
duplicate ignored: <相同的 message_id>
```

基础 `producer.py` 每次会生成新 UUID。要测试同一标识，可以临时把 `event_id` 替换为固定实验值，测试后恢复。

## 3. 创建 `publish_poison.py`

```python
import uuid

import pika


credentials = pika.PlainCredentials("aiops", "aiops-lab-only")
parameters = pika.ConnectionParameters(
    host="localhost",
    port=5672,
    virtual_host="aiops",
    credentials=credentials,
    heartbeat=30,
)

connection = pika.BlockingConnection(parameters)
channel = connection.channel()
channel.confirm_delivery()

message_id = str(uuid.uuid4())
channel.basic_publish(
    exchange="alerts.topic",
    routing_key="alert.prod.critical",
    body=b"this is not JSON",
    properties=pika.BasicProperties(
        content_type="application/json",
        delivery_mode=pika.DeliveryMode.Persistent,
        message_id=message_id,
    ),
    mandatory=True,
)
print(f"poison message published: {message_id}")
connection.close()
```

运行正常消费者和毒消息发布者：

```powershell
python worker.py
python publish_poison.py
```

消费者识别 JSON 错误并执行 `requeue=False`，消息随后进入 `alerts.dead`。

## 4. 验证死信

```powershell
docker compose exec rabbitmq rabbitmqctl list_queues -p aiops `
  name messages_ready messages_unacknowledged
```

预期 `alerts.dead` 至少有 1 条 ready 消息。管理界面可以查看消息头中的 `x-death` 信息，但查看消息时要选择 requeue，避免误删证据。

## 5. 故障实验排障

- 毒消息仍在主队列：确认正常消费者正在运行并执行了 `basic_reject(requeue=False)`。
- 消息消失但死信为空：核对主队列 DLX 名称、死信路由键和死信队列绑定。
- 重新声明失败：已有队列参数与代码不一致，先导出证据，再在实验环境删除并重建。
- 消息不断快速循环：停止消费者，检查异常分类和 `requeue=True`，改用有限次数与延迟重试。

## 6. 清理

```powershell
docker compose down -v
Remove-Item inbox.db -ErrorAction SilentlyContinue
```

`-v` 会删除实验数据卷。生产环境不能照搬该命令。

## 可观测性

## 指标来源

生产推荐启用 `rabbitmq_prometheus`，由 Prometheus 抓取 15692 端口。管理界面适合临时观察，不适合替代长期指标系统。

抓取周期通常不低于 15 秒；`collect_statistics_interval` 可设置为 10000 毫秒，避免过高统计开销。

## 四类黄金信号

### 流量

- 发布速率。
- 投递速率。
- 确认速率。
- 每秒消息字节量。

### 延迟

- publisher confirm 延迟。
- 消息端到端处理延迟。
- 最老 ready 消息年龄。
- 下游 API 延迟。

### 错误

- 发布 nack。
- 不可路由 return。
- 消费失败与重试。
- 死信增长。
- 认证和权限拒绝。

### 饱和度

- ready 和 unacked。
- 内存、磁盘和文件描述符。
- 连接与 Channel。
- 消费者利用率。
- Quorum Queue 在线成员和 Leader。

## 建议告警

| 告警 | 不要只看瞬时值 | 需要关联的证据 |
|---|---|---|
| 队列积压 | ready 持续增长且消息年龄超过 SLO | 发布速率、确认速率、消费者数、下游延迟 |
| 未确认过高 | unacked 持续高于消费者可处理窗口 | prefetch、线程栈、外部调用、消费者内存 |
| 无消费者 | 关键队列消费者为 0 持续一段时间 | 部署状态、连接错误、权限、订阅日志 |
| 死信增长 | 单位时间新增死信超过基线 | 异常类型、消息版本、发布方版本 |
| 资源告警 | 内存或磁盘 alarm 激活 | 水位、磁盘延迟、积压字节、发布阻塞 |
| Quorum 不健康 | 在线成员不足或 Leader 不稳定 | 节点、网络、磁盘、时钟、最近变更 |

固定消息数阈值容易误报。更有意义的是消息年龄、持续时间、增长斜率和业务 SLO。

## 日志与追踪

每次发布和消费至少关联：

- `message_id`。
- `correlation_id`。
- exchange、routing key、queue。
- 发布确认结果。
- 消费尝试次数。
- redelivered 状态。
- 业务结果和耗时。

OpenTelemetry Trace 可以把 HTTP 请求、消息发布、消费和下游调用串起来。消息体不宜作为高基数字段写入指标标签。

## 常见故障排查

## 故障一：ready 持续增长

### 先取证

```bash
rabbitmqctl list_queues -p aiops \
  name messages_ready messages_unacknowledged consumers consumer_utilisation
```

再看发布和确认速率、最老消息年龄、消费者部署和下游依赖。

### 常见假设

- 消费者数量不足。
- 单条处理变慢。
- 下游数据库或 API 限流。
- 毒消息重复重试。
- 消费者没有 ack。

### 修复与回滚

先修复下游瓶颈或异常分类，再逐步扩容消费者。盲目扩容可能把已经过载的数据库彻底压垮。扩容前记录当前速率，扩容后观察确认速率和下游错误，恶化时立即回滚副本数。

## 故障二：unacked 很高

### 证据

- unacked 是否接近 `消费者数 x prefetch`。
- 消费者线程是否阻塞。
- 外部请求是否没有超时。
- 消费者内存是否增长。

### 处理

先降低 prefetch 和给外部调用设置超时，再评估并发。终止消费者会让未确认消息重新投递，因此必须先确认幂等能力。

## 故障三：消息“丢了”

按链路逐段回答：

1. 生产者是否真正执行发布。
2. 是否收到 publisher confirm。
3. 是否发生不可路由 return。
4. 目标队列是否存在、绑定是否正确。
5. 是否因 TTL、长度限制或 delivery limit 进入死信。
6. 是否有消费者自动确认后处理失败。
7. 是否被人工 purge、delete 或策略变更移除。

没有 `message_id`、confirm 记录和消费审计时，很难证明消息在哪一段消失。

## 故障四：重复消费

重复是至少一次的预期边界。检查：

- 消费者是否在业务提交后、ack 前崩溃。
- ack 是否因 Channel 关闭未到达。
- 生产者 confirm 超时后是否用新标识重发。
- 消费者是否有 Inbox 或唯一约束。

修复重点是幂等，而不是试图禁止所有重新投递。

## 故障五：连接被阻塞

出现 `connection.blocked` 或发布延迟突然升高时：

1. 检查内存和磁盘告警。
2. 检查 ready 消息字节量和磁盘延迟。
3. 确认发布和消费是否共用连接。
4. 排查磁盘空间被日志或其他程序占用。
5. 谨慎清理或扩容，不能直接 purge 关键队列。

解除告警后还要观察积压恢复是否冲击下游。

## 故障六：Quorum Queue 不可写

先看：

```bash
rabbitmq-queues quorum_status --vhost aiops alerts.work
rabbitmq-diagnostics cluster_status
rabbitmq-diagnostics check_if_node_is_quorum_critical
```

确认是否拥有多数派、Leader 在哪里、哪些副本落后。不要同时重启多个节点。恢复多数派后再观察 Leader 选举、积压和 confirm 延迟。

## 故障七：认证或权限失败

错误为 `ACCESS_REFUSED` 时：

- 核对用户名、密码和 vhost。
- 查看 `list_permissions`。
- 检查权限正则是否覆盖交换机或队列。
- TLS 场景检查证书有效期、主机名和证书链。

不要通过授予全局管理员权限来长期绕过问题。

## 故障八：Channel 频繁关闭

常见原因：

- 同名队列声明参数不一致。
- 在错误 Channel ack。
- 重复 ack。
- 发布到不存在的交换机。
- 超过 Channel 或资源限制。

应用日志必须保留 RabbitMQ 返回的 reply code 和 reply text。

## 故障九：毒消息循环

症状是消费失败速率高、同一消息反复出现、CPU 上升但确认速率不升。

立即措施：

1. 暂停受影响消费者。
2. 保存消息、异常和 `x-death`。
3. 区分永久错误与临时错误。
4. 给重试增加次数和退避。
5. 将无法自动修复的消息送入死信。

## 故障十：消息顺序错乱

先确认业务要求是全局顺序还是同一实体顺序。查看消费者并发、重新投递和发布分片。大多数系统应按业务键维护版本号，而不是为了全局顺序把所有吞吐压到一个消费者。

## 升级与回滚

## RabbitMQ 4.3 升级边界

- RabbitMQ 4.3 只支持从 4.2 升级。
- 3.13 需要先升级到 4.2，再升级到 4.3。
- 升级前必须启用要求的稳定 Feature Flags。
- RabbitMQ 不正式支持原地降级。

## 滚动升级前检查

1. 阅读目标版本 Release Notes 和兼容性说明。
2. 确认 Erlang/OTP、插件和客户端兼容。
3. 导出 definitions，并备份数据目录。
4. 验证所有稳定 Feature Flags。
5. 确认 Quorum Queue 有足够在线成员。
6. 检查无内存、磁盘和网络分区告警。
7. 停止不必要的拓扑变更。
8. 准备逐节点回滚或蓝绿切换方案。

关键命令：

```bash
rabbitmq-diagnostics check_if_node_is_quorum_critical
rabbitmq-upgrade await_online_quorum_plus_one
rabbitmq-queues rebalance all
```

停止节点前运行 quorum critical 检查，避免停掉维持多数派的关键节点。

## 为什么回滚优先蓝绿

原地降级不受支持，数据库格式和 Feature Flags 可能已经变化。更可靠的回滚方式是：

1. 保留旧集群。
2. 新建目标版本集群。
3. 通过 Federation、Shovel 或双写迁移。
4. 验证消息、拓扑、消费者和指标。
5. 切换客户端。
6. 失败时切回旧集群。

切换期间必须接受并处理重复消息，明确旧新集群的写入主权。

## 备份与灾备

## Definitions 备份

Definitions 包含用户、vhost、交换机、队列、绑定和策略等声明，不包含队列消息：

```bash
rabbitmqctl export_definitions /backup/definitions.json
rabbitmqctl import_definitions /backup/definitions.json
```

导出的文件可能包含敏感配置，应加密和限制访问。

## 数据目录备份

离线或一致性数据目录备份需要保持节点身份与数据状态。Quorum Queue 和 Stream 对节点名敏感，不能把“改目录名后复制回来”当成可靠恢复方案。

## 跨地域灾备

不要把一个 RabbitMQ 集群跨 WAN 部署。使用：

- Federation：按需从上游拉取交换机或队列消息。
- Shovel：一个受管消费者从源取消息，再发布到目标并使用确认。

跨集群复制通常是异步的，恢复点目标不可能天然为零。要演练断网、重复、顺序变化、目标不可用和回切。

## AIOps 应用模式

## 告警事件总线

```text
监控平台 -> alert.topic
  -> 工单 Quorum Queue
  -> 通知 Quorum Queue
  -> 审计 Stream
```

每个下游有独立队列，一个下游积压不会直接阻止其他下游。事件使用 `alert_id` 幂等。

## Runbook 任务队列

任务消息包含目标、动作、变更单和幂等键。消费者必须：

- 校验审批状态。
- 限制并发和目标范围。
- 设置执行超时。
- 回传开始、成功、失败和取消状态。
- 对危险操作提供人工确认和回滚。

队列可靠不代表自动化操作本身安全。

## 模型推理队列

对 GPU 推理任务设置较小 prefetch，避免一个 Worker 占据过多任务。消息只保存对象存储引用，不直接塞入大型模型输入。监控排队年龄，而不是只看消息数。

## 变更事件

CMDB 或发布系统发布不可变事件。消费者按资源 ID 和版本号处理，拒绝旧版本覆盖新状态。需要回放和多订阅者时优先评估 Stream。

## AIOps 自动化闭环

```text
指标 / 日志 / Trace
  -> 异常检测
  -> RabbitMQ 告警事件
  -> 规则与模型判断
  -> Runbook 任务
  -> 执行结果事件
  -> 工单与知识库
```

每一跳都使用 correlation ID，才能做根因链路和自动化效果评估。

## RabbitMQ、Kafka 与 Redis Streams 怎么选

| 维度 | RabbitMQ | Kafka | Redis Streams |
|---|---|---|---|
| 核心模型 | 交换机路由和队列投递 | 分区追加日志 | Redis 内的流数据结构 |
| 路由能力 | 强，支持多种交换机 | 通常按 Topic 和分区 | 相对简单 |
| 消费后保留 | 普通队列通常删除 | 按保留策略保存 | 按长度或策略保存 |
| 回放 | Stream 支持，普通队列不擅长 | 原生强项 | 支持按 ID 读取 |
| 工作队列 | 强 | 需要额外消费语义设计 | 中小规模方便 |
| 超大事件流 | Stream 可评估 | 常见选择 | 取决于 Redis 内存和持久化 |
| 运维重点 | 队列、确认、积压、Raft | 分区、副本、消费滞后 | Redis 内存、持久化、消费者组 |

不能用“RabbitMQ 快，Kafka 吞吐高”一句话结束选型。要拿消息大小、峰值速率、保留时间、回放、路由、顺序、延迟、故障模型和团队能力做验证。

## 面试表达

## 30 秒回答：RabbitMQ 是什么

RabbitMQ 是一个消息代理。生产者把消息发布到交换机，交换机依据路由键和绑定把消息送入队列，消费者处理完成后确认。生产中我会用 publisher confirm、mandatory、持久消息、Quorum Queue、手动 ack、幂等和有限重试形成端到端可靠链路，并用 Prometheus 监控积压年龄、确认速率、资源告警和多数派健康。

## 3 分钟回答：如何保证消息不丢不重

我会分三段说明。

第一段是生产者到 RabbitMQ：业务事件有稳定 `message_id`，生产者开启 publisher confirm 和 mandatory。业务数据库与发消息之间用 Transactional Outbox 避免双写不一致，confirm 超时使用相同幂等键重试。

第二段是 RabbitMQ 内部：交换机和队列持久化，消息设为 persistent，关键任务使用三副本 Quorum Queue。TTL、长度限制、死信和策略变更都要监控，避免消息被规则移除却误判成丢失。

第三段是 RabbitMQ 到消费者：关闭自动确认，业务提交后 ack；失败区分可重试与永久失败；消费者使用 Inbox 或业务唯一约束幂等。这样接受至少一次投递，但让业务副作用只发生一次。

面试追问时还要说明：confirm 不代表消费成功，durable 不代表消息绝不丢，集群不代表 Classic Queue 自动复制，真正 exactly-once 需要应用事务边界配合。

## 高频问题与追问

### 问题一：Exchange 有哪些类型

回答要点：

- Direct 精确匹配路由键。
- Topic 使用 `*` 和 `#` 做分层匹配。
- Fanout 广播，忽略路由键。
- Headers 按消息头匹配。

追问：Topic 的 `*` 与 `#` 有什么区别？

答：`*` 恰好匹配一个点分单词，`#` 匹配零个或多个。

### 问题二：Ack 和 Confirm 有什么区别

回答要点：

- Confirm 是 RabbitMQ 给生产者的确认。
- Ack 是消费者给 RabbitMQ 的确认。
- 两者独立，解决不同链路。

追问：Confirm 超时能否判断消息没写入？

答：不能，可能是消息已写入但确认丢失。生产者应使用相同业务幂等键重试，消费者幂等。

### 问题三：为什么会重复消费

回答要点：

消费者完成业务后、ack 前崩溃，RabbitMQ 会重新投递。网络断开也会造成同类不确定窗口。解决方式是 Inbox、唯一约束和外部 API 幂等键。

追问：先 ack 再处理可以避免重复吗？

答：可能减少重复，但会在处理失败时永久丢失业务动作，语义变成至多一次。

### 问题四：Quorum Queue 和 Classic Queue 有什么区别

回答要点：

- Classic Queue 在 RabbitMQ 4.x 是单副本。
- Quorum Queue 基于 Raft，多副本，多数派提交，偏向一致性和数据安全。
- Quorum Queue 资源开销更高，不支持临时独占队列，也不适合超大长积压。

追问：三节点 Quorum Queue 能容忍几个节点故障？

答：一个。三个副本的多数派是两个；失去两个后不能形成多数派。

### 问题五：消息积压怎么处理

回答框架：

1. 先看 ready、unacked、消息年龄、发布与确认速率。
2. 再看消费者数量、处理耗时、外部依赖、prefetch 和重试。
3. 判断是入口突增、消费退化还是 RabbitMQ 资源问题。
4. 修复瓶颈后逐步扩容，并保护下游。
5. 评估过期消息是否仍有业务价值，不能随意 purge。

追问：为什么不直接把消费者扩十倍？

答：瓶颈可能在数据库或第三方接口，盲目扩容会放大压力和错误。

### 问题六：RabbitMQ 如何保证顺序

回答要点：

单队列单消费者最容易保持观察顺序；并发消费者、重试和重新入队会打乱完成顺序。严格顺序可使用 Single Active Consumer 或 Stream 分区，并在业务层按实体版本控制。要先明确顺序范围和吞吐取舍。

### 问题七：Prefetch 如何设置

回答要点：

Prefetch 控制每个消费者未确认消息窗口。任务重、内存大时设小；任务轻、网络延迟高时逐步增大。通过压测观察吞吐、P99 延迟、unacked、内存和公平性，不能背固定值。

### 问题八：为什么三节点集群还会丢消息

回答要点：

可能使用了单副本 Classic Queue；生产者没开 confirm；消息不是 persistent；消费者自动确认；策略过期或达到长度；人工误删；整个多数派和存储同时损坏。集群节点数只是条件之一。

### 问题九：网络分区时 RabbitMQ 怎么办

回答要点：

RabbitMQ 4.3 的 Khepri、Quorum Queue 等关键组件基于多数派。多数派侧可继续选 Leader，少数派侧不能提交写入。集群应部署在 LAN，跨地域使用 Federation 或 Shovel。

### 问题十：如何滚动升级

回答要点：

确认支持的版本路径和 Feature Flags，备份 definitions 与数据，检查 Quorum Queue 多数派和资源告警，逐节点升级，每次等待节点同步后再继续。4.3 只能从 4.2 升级，原地降级不受支持，所以重要升级应准备蓝绿回滚。

## 生产系统设计题

### 题目

设计一个每天 5000 万条告警、峰值 2 万条/秒的事件处理平台。要求关键告警不丢、通知可重试、审计可回放、单机故障不中断，跨地域灾备 RPO 小于 1 分钟。

### 回答结构

#### 1. 先补需求

- 平均和 P99 消息大小。
- 端到端延迟 SLO。
- 最长保留时间。
- 是否需要全局顺序。
- 下游最大处理能力。
- RTO 和允许重复的边界。
- 两地网络延迟与带宽。

#### 2. 队列类型

- 工单和通知任务使用三副本 Quorum Queue。
- 审计和回放使用 Stream。
- 按租户或服务拆分，避免一个超大热点队列。

#### 3. 可靠性

- 生产者 Outbox、confirm、mandatory。
- 消费者手动 ack、Inbox 幂等。
- 临时失败进入分级延迟队列。
- 永久失败进入死信并触发告警。

#### 4. 容量

按峰值而不是平均值压测。正常状态保留至少一个节点和一部分消费者的故障余量。用消息年龄和清空时间证明故障恢复能力。

#### 5. 可观测性

监控发布、确认、ready、unacked、消息年龄、死信、资源告警、连接、Channel、消费者、Quorum 成员和跨地域滞后。

#### 6. 灾备

两个地域各自部署独立 RabbitMQ 集群，通过 Federation 或 Shovel 异步复制。应用用全局 `event_id` 幂等。演练主站断电、复制中断、灾备接管和回切。

#### 7. 安全

TLS、独立 vhost、最小权限、密钥轮换、管理面隔离和审计。

### 面试官可能继续追问

- 2 万条/秒为什么不用 Kafka？
- 一个 Quorum Queue 能否承载全部流量？
- 跨地域异步复制如何满足 RPO？
- 目标站点接管时怎样防止双写？
- 死信堆积如何重放且不冲击下游？

好的回答不是坚持某个产品，而是提出可测量假设、压测方案、故障边界和回滚路径。

## 事故推演

### 事故

上午 10:00，`alerts.work` 的 ready 从 2 万增长到 300 万，unacked 固定在 500，消费者 50 个。工单数据库 CPU 98%，死信也开始增长。

### 取证

1. 保存 RabbitMQ 队列速率、消息年龄、消费者数、unacked 和资源告警。
2. 查看消费者 P95/P99 处理时间和数据库错误。
3. 检查 `50 x prefetch` 是否等于 500。
4. 按 `message_id` 抽取失败样本，区分超时、限流和格式错误。
5. 核对最近应用、数据库和策略变更。

### 假设

unacked 固定为 500，正好等于 50 个消费者乘以 prefetch 10，说明消费者窗口已满。数据库 CPU 98%，最可能是下游数据库成为瓶颈，不是 RabbitMQ 自己无法投递。

### 处置

1. 暂停非关键消费者或降低其并发。
2. 对数据库请求限流，防止重试放大。
3. 将永久格式错误送死信，不参与重试。
4. 优化慢 SQL、恢复索引或回滚最近数据库变更。
5. 数据库稳定后逐步恢复消费者。

### 为什么不能立即扩十倍消费者

更多消费者会向已经过载的数据库发出更多并发请求，可能让数据库彻底失去服务能力。

### 回滚与风险

每次调整记录副本数、prefetch 和确认速率。如果数据库错误上升，立即回滚消费者并发。不能为了快速下降队列数字而 purge 未评估的关键告警。

### 复盘改进

- 给工单数据库设置明确容量和限流。
- 告警积压使用消息年龄 SLO。
- 重试增加指数退避和全局预算。
- 压测“一个下游变慢”的退化场景。
- 建立死信重放审批、速率限制和审计。

## 学习检查清单

### 入门层

- [ ] 能解释 Producer、Exchange、Binding、Queue、Consumer。
- [ ] 能区分 ready 和 unacked。
- [ ] 能说明 Direct、Topic、Fanout、Headers。
- [ ] 能运行发送和消费实验。
- [ ] 能使用管理界面和基础命令查看队列。

### 可靠性层

- [ ] 能区分 publisher confirm 和 consumer ack。
- [ ] 能说明 durable、persistent 为什么仍不够。
- [ ] 能解释至少一次和重复投递。
- [ ] 能实现 Inbox 幂等。
- [ ] 能配置有限重试和死信。
- [ ] 能处理不可路由消息。

### 生产层

- [ ] 能对比 Classic Queue、Quorum Queue 和 Stream。
- [ ] 能说明 Raft 多数派与网络分区。
- [ ] 能解释 Khepri 保存什么、不保存什么。
- [ ] 能根据发布、确认、消息大小和积压时间估算容量。
- [ ] 能设置内存、磁盘、文件描述符和连接边界。
- [ ] 能设计 TLS、vhost 和最小权限。
- [ ] 能制定升级、蓝绿回滚和灾备演练。

### 面试层

- [ ] 能用 30 秒解释 RabbitMQ。
- [ ] 能用 3 分钟回答不丢不重。
- [ ] 能分析积压、重复、丢失和 Quorum 故障。
- [ ] 能完成系统设计题并说明 Kafka 取舍。
- [ ] 能以证据、假设、验证、修复、影响面和回滚组织事故回答。

## GitHub 学习证据

建议提交：

```text
rabbitmq-lab/
  compose.yaml
  requirements.txt
  producer.py
  worker.py
  crash_worker.py
  publish_poison.py
  README.md
  screenshots/
    queue-overview.png
    dead-letter.png
  evidence/
    queue-status.txt
    failure-timeline.md
    capacity-calculation.md
    interview-notes.md
```

`README.md` 至少记录：

1. 环境版本。
2. 启动和清理步骤。
3. 正常消息链路。
4. ack 前崩溃的预期结果。
5. 毒消息进入死信的证据。
6. 一次真实排障记录。
7. 生产设计与实验环境的差异。

不要提交真实密码、Cookie、TLS 私钥或生产消息。

## 下一步

完成本文后继续学习：

1. [Kafka 深讲](./kafka.md)，理解分区日志与消费者组。
2. [Redis 深讲](./redis.md)，理解缓存、持久化和 Streams。
3. [Prometheus 深讲](../observability/prometheus.md)，建立 RabbitMQ 指标告警。
4. [OpenTelemetry 深讲](../observability/opentelemetry.md)，串联消息发布和消费 Trace。
5. [Kubernetes 深讲](../cloud-native/kubernetes.md)，理解 RabbitMQ Operator、持久卷和调度边界。

RabbitMQ 真正的掌握标准不是“会启动服务”，而是能回答每一条关键消息由谁接管、何时确认、失败后去哪里、重复时如何幂等、节点故障时剩多少多数派，以及变更失败时怎样回滚。
