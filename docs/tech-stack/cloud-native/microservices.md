# 微服务深讲

> 学习目标：理解微服务为什么出现，能讲清服务边界、API、服务发现、配置、容错、观测、发布和数据一致性，知道它和 Kubernetes、Ingress、Prometheus、OpenTelemetry、CI/CD、RabbitMQ / Kafka 在 AIOps 链路中的关系。

## 官方和权威资料

- [Martin Fowler: Microservices](https://martinfowler.com/articles/microservices.html)
- [microservices.io: Microservice Architecture](https://microservices.io/patterns/microservices.html)
- [Microsoft Learn: Microservices architecture design](https://learn.microsoft.com/en-us/azure/architecture/microservices/)
- [AWS: Microservices](https://aws.amazon.com/microservices/)
- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)
- [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)
- [Google SRE Books](https://sre.google/books/)

说明：微服务不是某个单一产品，也没有一个“官方命令手册”。这篇按业界权威资料和 AIOps 学习场景重新组织，重点讲清工程边界、运行机制和排障路径。

## 场景开场

你原来维护的是一个单体系统：一个仓库、一个发布包、一个数据库。上线时只要整包发布，出问题就回滚整个系统。

后来业务拆成了很多服务：

- user-service 管用户。
- order-service 管订单。
- payment-service 管支付。
- inventory-service 管库存。
- notification-service 发通知。

表面看更灵活了，但值班时问题也变多了：

- 订单接口慢，到底是订单服务慢，还是支付服务慢？
- 一个服务发布失败，为什么影响了另外三个服务？
- RabbitMQ 里消息堆积，是消费者慢，还是下游数据库慢？
- Kubernetes 里 Pod 都是 Running，为什么业务还是 500？
- 告警响了，怎么把指标、日志、链路、变更和拓扑串起来？

微服务不是“服务越拆越好”，而是把系统拆成多个可独立开发、部署、扩展和观测的业务服务。拆分之后，架构能力、运维能力和观测能力必须一起跟上。

## 一句话人话版

微服务是一种架构方式：把一个大系统拆成多个围绕业务能力的小服务，每个服务独立部署、独立伸缩，通过 API 或消息协作。

## 为什么要学微服务

AIOps 很少只面对单个进程。真实生产问题常常发生在服务之间：

- 上游超时。
- 下游错误率升高。
- 发布引入兼容性问题。
- 消息队列堆积。
- 单个服务扩容后数据库被打爆。
- 服务链路变长后根因定位变慢。

如果不理解微服务，你看 Prometheus、Grafana、OpenTelemetry、Kubernetes、RabbitMQ、Kafka 时会只看到工具，不知道它们在解决哪一类系统问题。

在 AIOps 中，微服务提供了“服务拓扑”和“故障传播路径”的背景。指标、日志、链路追踪、告警关联、变更关联、RAG runbook，最后都要回到服务边界和调用关系。

## 微服务解决什么问题

微服务主要解决这些问题：

| 问题 | 微服务怎么处理 |
|---|---|
| 单体太大，发布慢 | 拆成可独立发布的服务 |
| 团队协作冲突多 | 服务按业务能力归属团队 |
| 某个模块流量大 | 单独扩展高流量服务 |
| 技术栈难演进 | 不同服务可以逐步替换技术 |
| 故障影响面大 | 通过隔离、限流、降级缩小影响 |
| 业务边界不清 | 用领域边界逼迫模型清晰 |

但微服务也会带来新问题：

- 网络调用变多。
- 数据一致性变难。
- 发布依赖变复杂。
- 故障定位变难。
- 本地开发和测试成本变高。
- 需要更强的自动化和可观测性。

所以微服务不是免费午餐。没有 CI/CD、可观测性、容器编排和稳定性实践的微服务，通常会变成“分布式单体”。

## 核心概念

### 服务边界

服务边界回答：这个服务负责什么，不负责什么。

好的边界通常围绕业务能力：

- 用户。
- 订单。
- 支付。
- 库存。
- 通知。

坏边界常见于按技术层拆：

- controller-service。
- dao-service。
- util-service。

这种拆法会让一次业务请求横跨很多“技术层服务”，调用链变长，收益很低。

### API

服务之间需要接口协作。常见方式：

| 类型 | 例子 | 适合场景 |
|---|---|---|
| 同步 HTTP / REST | order 调 payment | 需要立即得到结果 |
| gRPC | 内部高性能调用 | 强 schema、低延迟 |
| 消息队列 | order 发 OrderCreated | 异步解耦、削峰 |
| 事件流 | Kafka 事件总线 | 审计、分析、订阅 |

初学阶段先理解：同步调用让流程直接，但耦合更紧；异步消息让系统更松，但状态和补偿更复杂。

### 服务发现

微服务实例会扩容、缩容、重启，IP 会变。服务发现就是回答：

```text
order-service 要调用 payment-service，payment-service 当前有哪些实例？
```

在 Kubernetes 中，常见方式是 Service + DNS：

```text
payment-service.default.svc.cluster.local
```

服务发现坏了，典型现象是：

- DNS 解析失败。
- 连接被拒绝。
- 只有部分实例收到流量。
- 发布后新 Pod 没有进入 Endpoints。

### 配置

微服务配置要从代码里拆出来：

- 端口。
- 数据库地址。
- Redis 地址。
- RabbitMQ 地址。
- feature flag。
- 超时时间。
- 重试次数。

Kubernetes 中常见对象：

- ConfigMap：非敏感配置。
- Secret：敏感配置。
- env：注入环境变量。
- volume：挂载配置文件。

### 容错

微服务最大的变化是：本地函数调用变成远程网络调用。网络调用一定可能失败。

常见容错手段：

| 手段 | 解决什么 |
|---|---|
| timeout | 不让调用无限等 |
| retry | 应对短暂抖动 |
| circuit breaker | 下游持续失败时快速失败 |
| bulkhead | 隔离不同资源池 |
| rate limit | 控制入口流量 |
| fallback | 返回降级结果 |
| idempotency | 重试不造成重复副作用 |

重试尤其要谨慎。没有超时、退避和幂等的重试，可能把下游压垮。

### 数据一致性

单体里常见一个数据库事务搞定多个表。微服务里不同服务可能拥有自己的数据。

这会带来问题：

```text
创建订单成功
扣库存成功
支付失败
订单现在应该是什么状态？
```

常见思路：

- 最终一致性。
- 事件驱动。
- Saga。
- Outbox pattern。
- 补偿动作。
- 幂等消费。

第一阶段不需要把所有模式都背下来，但要明白：跨服务事务很难，不能简单照搬单体数据库事务思维。

## 架构和数据流

一个最小微服务系统可以这样理解：

```text
client
  |
  v
Ingress / API Gateway
  |
  +--> user-service ---> user-db
  |
  +--> order-service ---> order-db
  |        |
  |        +--> RabbitMQ / Kafka
  |                 |
  |                 v
  |          notification-service
  |
  +--> payment-service ---> payment-db

Prometheus scrapes metrics
OpenTelemetry exports traces
Loki / Elasticsearch stores logs
CI/CD records deployments
```

AIOps 关注的不是“图画得多复杂”，而是能不能回答：

- 请求经过哪些服务？
- 每个服务当前实例是否健康？
- 哪个服务最近发布过？
- 哪个服务错误率先升高？
- 哪个消息队列开始堆积？
- 告警是否能关联到 runbook？

## 在 AIOps 中的位置

| AIOps 环节 | 微服务提供什么 |
|---|---|
| 数据采集 | service、instance、endpoint、version、owner 标签 |
| 告警治理 | 按服务边界分级、路由、关联 |
| 根因分析 | 服务拓扑和依赖关系 |
| 变更关联 | service version、deployment、commit |
| Runbook | 每个服务对应排障步骤 |
| RAG | 用服务名检索 runbook、RCA、架构说明 |
| 自动化 | 重启、扩容、回滚、摘流、限流 |

没有服务边界，AIOps 就很难把一堆告警组织成“一个事件候选”。

## 最小实验：两个服务和一个消息队列

目标：

- order-api 接收订单。
- order-api 把消息发到 RabbitMQ。
- worker 消费订单消息。
- Prometheus 或日志能看到请求、队列、消费状态。

目录：

```text
labs/microservices-rabbitmq/
  compose.yaml
  order-api/
    app.py
    requirements.txt
  worker/
    worker.py
    requirements.txt
  README.md
```

实验重点不是写复杂业务，而是观察这些问题：

- order-api 挂了，worker 是否受影响？
- RabbitMQ 挂了，order-api 如何失败？
- worker 变慢，队列是否堆积？
- 重复投递时 worker 是否幂等？
- 日志里是否有 trace id / order id？

## 排障路径

### 请求 500

先查：

1. Ingress / API Gateway 日志。
2. order-api 错误日志。
3. 下游 payment / RabbitMQ 连接错误。
4. 最近 deployment。
5. Prometheus 错误率和延迟。
6. OpenTelemetry trace。

不要一上来就重启所有服务。先找是哪条依赖链出问题。

### 只有一部分请求失败

常见原因：

- 某个 Pod 版本有问题。
- 某个实例连接池耗尽。
- 某个节点网络异常。
- Service Endpoints 里混入未就绪实例。

检查：

```bash
kubectl get pods -l app=order-api -o wide
kubectl get endpoints order-api
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### 队列堆积

常见原因：

- 消费者挂了。
- 消费者处理慢。
- 下游数据库慢。
- 消息重试风暴。
- 单条坏消息反复失败。

检查：

- ready messages。
- unacked messages。
- consumer count。
- publish rate。
- deliver / ack rate。
- worker 错误日志。

### 调用链断了

常见原因：

- trace context 没有透传。
- 异步消息没有带 trace id。
- 某个服务没有接入 OpenTelemetry。
- 采样率太低。

微服务排障时，trace id 是把日志、链路和消息串起来的关键线索。

## 面试怎么讲

微服务是一种围绕业务能力拆分系统的架构方式。它的收益是服务可以独立开发、部署、扩展和隔离故障；代价是网络调用、数据一致性、发布依赖和排障复杂度都会上升。真正能落地微服务，必须配套 CI/CD、服务发现、配置管理、限流熔断、可观测性、灰度发布和回滚机制。

在 AIOps 场景里，我会重点关注服务边界和依赖拓扑。每个服务都要有统一标签，比如 service、env、version、owner；指标、日志、链路、告警和变更都要能按这些标签关联。这样当一个服务错误率升高时，系统才能把上游请求、下游依赖、最近发布、队列堆积和历史 RCA 串成一个事件候选，而不是只给值班人员一堆零散告警。

## 学习检查清单

- [ ] 我能解释微服务和单体的区别。
- [ ] 我能说明服务边界为什么要围绕业务能力。
- [ ] 我能画出一个包含 API Gateway、服务、数据库、消息队列的微服务图。
- [ ] 我能解释同步调用和异步消息的取舍。
- [ ] 我能说明服务发现、配置、限流、熔断、重试的作用。
- [ ] 我能说明为什么跨服务事务困难。
- [ ] 我能说出 Saga、Outbox、幂等消费的大致用途。
- [ ] 我能用 Kubernetes Service 理解服务发现。
- [ ] 我能说明微服务排障为什么需要 trace id。
- [ ] 我能把微服务拓扑和 AIOps 告警关联起来。

## 面试题

1. 微服务解决什么问题，又带来什么问题？
2. 微服务和单体架构怎么取舍？
3. 什么是服务边界？坏的服务边界有什么表现？
4. 同步 HTTP 调用和消息队列有什么区别？
5. 什么是服务发现？
6. 为什么微服务必须重视 timeout 和 retry？
7. 熔断、限流、降级分别解决什么问题？
8. 微服务中如何处理数据一致性？
9. 什么是分布式单体？
10. 微服务排障为什么需要指标、日志和链路追踪一起看？
11. AIOps 如何利用服务拓扑做告警关联？
12. 一个微服务上线失败，你会怎么排查？

## 学习证据

学完后建议提交：

- 一张微服务架构图：`labs/microservices/architecture.md`。
- 一个两个服务 + RabbitMQ 的 `compose.yaml`。
- 一份服务标签规范：service、env、version、owner。
- 一篇排障记录：`微服务请求超时排查.md`。
- 一份 runbook：`order-api-error-rate-high.md`。
- 一次模拟事件：从请求失败、队列堆积、trace 查询到 RCA 的完整记录。
