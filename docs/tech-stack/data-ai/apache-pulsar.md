# Apache Pulsar 技术栈深讲

> 学习目标：理解 Pulsar 的 broker、BookKeeper、topic、subscription、ack、backlog、保留和多租户；能完成生产消费与消费者停机积压实验，并能设计容量、高可用、升级、安全和消息一致性方案。

## 官方资料与 TCE 边界

- [Apache Pulsar 官方文档](https://pulsar.apache.org/docs/)
- [Pulsar 4.0 Docker standalone](https://pulsar.apache.org/docs/4.0.x/getting-started-docker/)
- [Pulsar 架构](https://pulsar.apache.org/docs/4.0.x/concepts-architecture-overview/)
- [Messaging 概念](https://pulsar.apache.org/docs/4.0.x/concepts-messaging/)
- [Pulsar 安全](https://pulsar.apache.org/docs/4.0.x/security-overview/)
- [Pulsar 指标](https://pulsar.apache.org/docs/4.0.x/reference-metrics/)
- [腾讯云 TDMQ Pulsar 文档](https://cloud.tencent.com/document/product/1179)

Apache Pulsar 是开源分布式消息与流平台。腾讯云 TDMQ Pulsar 及 TCE 中可能交付的相关消息能力，产品包装、版本、接口、控制台、存储和运维责任可能不同；是否安装及支持哪些能力以现场 BOM/License/版本手册为准。本地 standalone 只学习消息语义，不代表生产拓扑。

## 官方知识地图

```text
命名：tenant -> namespace -> topic -> partition
发送：producer -> broker -> managed ledger -> BookKeeper bookie
消费：subscription -> consumer -> receive -> process -> ack
状态：cursor/backlog -> redelivery -> retry/DLQ -> retention/expiry
治理：认证授权 -> quota -> schema -> geo-replication -> observability
```

tenant 是租户，namespace 是策略管理范围，topic 是消息主题，partition 是并行分区。broker 接收客户端请求，bookie 是 BookKeeper 的存储节点；cursor（游标）记录订阅消费位置。

## 场景开场

告警采集每秒写入 5000 条，消费者发布后停了十分钟。生产者仍成功，页面却看不到新告警。恢复消费者后数据库被瞬间打满，消息开始重复。

这不是简单“队列挂了”，而是积压、恢复速率、下游承载、确认时机和幂等共同决定。

## 一句话人话版

Pulsar 像一套分区、可保留、能让多个订阅按各自进度收件的消息物流系统；broker 管交通，BookKeeper 保存包裹，订阅游标记住每个收件队伍到哪里。

## 小白常问

### Queue 和 Topic 有什么区别？

队列通常强调一组消费者分担任务，Topic 强调发布订阅。Pulsar 通过 subscription 类型表达独占、共享、故障切换等消费方式，一个 Topic 可有多个独立订阅。

### Producer 成功后消息一定被业务处理了吗？

只说明按当前确认策略写入消息系统，不说明消费者处理或数据库提交成功。要监控端到端业务状态。

### 消费者收到一次就只有一次吗？

网络、超时和进程崩溃会导致重投。应用通常按“至少一次”设计幂等；不要把营销式“精确一次”脱离边界理解。

### backlog 是消息数量吗？

它是某订阅尚未确认的数据，可以看消息数和字节。大消息与小消息恢复时间不同，且过期/保留策略影响存储。

## 为什么要学与解决的问题

AIOps 需要吸收告警、指标、日志和自动化任务。消息平台隔离生产者与消费者、缓冲峰值并支持异步处理，但也带来重复、乱序、积压、热点和存储压力。理解状态模型才能安全恢复。

## 写入与读取路径

```text
Producer
  -> DNS/TLS/认证
  -> Broker 查 topic 所有权
  -> 分区路由
  -> BookKeeper ledger 多副本写入
  -> Broker 返回确认

Consumer
  -> Broker 订阅/游标
  -> 推送消息
  -> 应用处理下游事务
  -> ACK 确认
  -> 游标前移/积压下降
```

ledger 是顺序追加的日志段。元数据服务保存集群、命名和所有权信息，4.0 standalone 默认可使用 RocksDB 元数据存储；生产部署形态按官方版本和交付方案。

## 核心概念一：Topic、分区与顺序

**是什么：** Topic 是消息流，分区把流拆成可并行处理的多条日志。

**为什么需要：** 单一路径的吞吐有限，多分区提高并行度。

**怎样工作：** Producer 按路由策略或消息 key 选择分区；同 key 能否保持顺序取决于路由、订阅和消费设计。

**怎样使用/观察：** 选择稳定业务 key，例如设备 ID；观察分区速率、大小和积压，识别热点。

**坏了怎样查：** 总吞吐正常但某分区积压，多为 key 倾斜或单消费者慢。盲目加分区可能改变顺序和路由，先评估客户端行为。

## 核心概念二：Subscription 与消费类型

订阅拥有自己的游标，所以审计和告警处理两个订阅可以各自消费同一 Topic。

- Exclusive：通常一个消费者独占订阅，易保序但并行有限。
- Failover：有主消费者和备用消费者，主失败后接替。
- Shared：多个消费者分担消息，提高并行，通常不承诺全局顺序。
- Key_Shared：按 key 分配消费，目标是在同 key 上保持顺序并并行。

具体限制与客户端支持以使用版本为准。选择依据是顺序范围、并行度、恢复和消费者伸缩，不是“哪种最快”。

观察订阅类型、消费者数、unacked（已投递未确认）与 backlog。坏了先看活跃消费者、流控和确认，不随意删除订阅；删除可能丢失消费位置。

## 核心概念三：ACK、重投与幂等

ACK 是消费者告诉 broker“这条已按约定处理”。若先 ACK 再写数据库，写库失败会丢业务；若先写库后 ACK，ACK 失败会重投，因此数据库写必须幂等。

常见幂等方法：业务唯一键、处理记录表、状态机版本、去重窗口。消息 ID 可用于诊断，但跨重发/业务重建时不一定等于稳定业务 ID。

Negative ACK 表示暂时失败希望重投；重试 Topic/死信 Topic（DLQ）可隔离反复失败消息。若无限立即重试，会形成重试风暴。

排障关联 message ID、business ID、subscription、redelivery count 与下游事务，敏感内容脱敏。

## 核心概念四：backlog、retention 与 expiry

backlog 是订阅未确认消息；retention 决定已确认消息是否继续保留；expiry 可让过旧未确认消息到期。三者解决的问题不同。

容量估算：`写入字节/秒 × 需要保留秒数 × 副本开销 + 积压/索引/安全余量`。例如 10 MiB/s 保留 24 小时，原始数据约 844 GiB，尚未计副本和额外开销。

消息 TTL（生存时间）和保留策略错误可能在消费者恢复前删除数据。修改前确认业务合规、最慢消费者和恢复能力。

## 核心概念五：Broker 与 BookKeeper 分离

Broker 主要处理连接、路由、协议和 Topic 所有权，BookKeeper 持久保存 ledger。分离有利于独立扩展计算和存储，但故障路径也分开。

Broker 转移所有权可能引起客户端重连；Bookie 故障触发副本风险/恢复。生产需关注 broker 连接/吞吐/延迟、bookie 磁盘/网络/写延迟、ensemble/quorum 配置与副本恢复，具体参数按版本。

不要因 broker 重启可恢复就忽略存储冗余，也不要直接操作 BookKeeper 内部账本修复业务消息。

## 核心概念六：Schema 与契约演进

Schema 规定字段类型和结构，帮助生产/消费双方发现不兼容。消息格式升级时，新消费者可能先上线并兼容旧字段，再逐步让生产者发送新字段。

删除/改类型比增加可选字段风险大；还要考虑旧积压仍含旧格式。回滚应用时也必须能读升级期间产生的数据。

Schema registry 或产品能力是否启用以现场版本为准。即使没有平台 Schema，应用也应有版本字段、契约测试和未知字段处理。

## 多租户、安全与配额

租户和 namespace 提供策略管理边界，仍需认证、授权、TLS、网络隔离、配额和审计。Producer 只给写目标 Topic，Consumer 只给读指定订阅，管理权限独立。

配额覆盖生产速率、消费速率、存储或连接等时，要在峰值和恢复速度间平衡。凭据轮换需允许客户端平滑更新，不能将 Token 写入镜像和 Git。

## 高可用与跨地域

生产需要多个 broker、元数据高可用、多个 bookie 及磁盘/机架故障域。副本写确认涉及一致性和时延取舍，参数只能按官方支持方案设置。

Geo-replication（跨地域复制）可复制 Topic 数据，但不自动保证外部数据库事务、订阅游标、DNS 和应用切流全部一致。必须定义哪个地域可写、怎样防双写、RPO/RTO 和故障后回切。

## 安装启动与版本固定

真实 TCE 相关产品按 BOM 和原厂交付开通。开始前核对 Apache/TDMQ/TCE 产品形态、服务端和客户端版本、协议、认证、网络、Topic/订阅策略、容量、备份和支持期限。

本地用官方 4.0 文档示例的 `apachepulsar/pulsar:4.0.13` 镜像；生产不能从 Docker Hub 命令替换 TCE 组件。镜像也要记录 digest 并扫描。

## 命令与字段字典

| 命令/指标 | 用途 | 预期/关键字段 | AIOps 场景与坑 |
|---|---|---|---|
| `brokers healthcheck` | standalone/broker 健康探测 | 成功退出 | 不代表业务端到端完成 |
| `topics create` | 显式创建测试 Topic | 完整 Topic 名 | 生产创建需命名、配额和保留评审 |
| `topics create-subscription` | 在指定位置创建订阅 | `-s` 名称、`-m earliest/latest` | 起点错误会漏读或重放历史 |
| `pulsar-client produce` | 发送测试消息 | topic、消息、次数 | 测试 Topic 与生产隔离 |
| `pulsar-client consume` | 创建订阅并消费 | `-s` 订阅、`-n` 数量 | 订阅名拼错会新建游标 |
| `topics stats` | 查 Topic/订阅状态 | rate、throughput、backlog、consumer | 输出很大且含客户端地址 |
| `msgRateIn/Out` | 每秒消息 | 看分区/订阅趋势 | 数量不反映大消息字节量 |
| `msgBacklog` | 未确认数量 | 按订阅观察 | 零可能是订阅不存在 |
| `unackedMessages` | 已投递未确认 | 消费者处理/ACK | 高值可能是下游慢 |
| storageSize | 存储大小 | 与保留/副本一起解释 | 不能直接等于业务有效数据 |

管理命令也需认证授权。生产执行 Topic 删除、订阅删除、跳过消息、清空 backlog 或改保留属于数据变更，必须审批。

## 基础实验：发送、消费和看统计

### 前提

Docker 20.10+、至少 4 GiB 可用内存与 5 GiB 空间；使用 Linux 容器。主机端口 16650/18080 空闲。实验只绑定 `127.0.0.1`，使用命名容器/卷。

### 步骤

```powershell
docker run --name pulsar-learning -d -p 127.0.0.1:16650:6650 -p 127.0.0.1:18080:8080 --mount source=pulsar-learning-data,target=/pulsar/data --mount source=pulsar-learning-conf,target=/pulsar/conf apachepulsar/pulsar:4.0.13 bin/pulsar standalone
docker exec pulsar-learning bin/pulsar-admin brokers healthcheck
docker exec pulsar-learning bin/pulsar-admin topics create persistent://public/default/incidents
docker exec pulsar-learning bin/pulsar-admin topics create-subscription -s incident-worker -m earliest persistent://public/default/incidents
docker exec pulsar-learning bin/pulsar-client produce persistent://public/default/incidents -m 'incident=INC-001;status=OPEN'
docker exec pulsar-learning bin/pulsar-client consume persistent://public/default/incidents -s incident-worker -n 1
docker exec pulsar-learning bin/pulsar-admin topics stats persistent://public/default/incidents
docker inspect pulsar-learning --format "{{json .Image}}"
```

`persistent://租户/namespace/topic` 是持久化 Topic 名；创建订阅时 `-m earliest` 从最早位置开始，`-s` 指定订阅，消费命令的 `-n 1` 表示取一条后退出。预期健康检查成功，生产/消费各显示成功，stats 中 `incident-worker` 的 backlog 为 0。显式先建 Topic 和订阅，避免默认 `latest` 起点跳过之前的教学消息。

若启动失败看 `docker logs pulsar-learning`；Windows 确认 Linux 容器；健康检查过早可等日志出现 messaging service ready。实验消息不是敏感数据。

## 故障注入实验：消费者停机形成积压

基础实验成功后，不启动消费者，向同一 Topic 生产 20 条：

```powershell
docker exec pulsar-learning bin/pulsar-client produce persistent://public/default/incidents -m 'incident=INC-BACKLOG;status=OPEN' -n 20
docker exec pulsar-learning bin/pulsar-admin topics stats persistent://public/default/incidents
```

预期 `incident-worker` 的 `msgBacklog` 增加，而 broker 健康检查仍成功。这证明组件健康不等于消费及时。

恢复消费并再次检查：

```powershell
docker exec pulsar-learning bin/pulsar-client consume persistent://public/default/incidents -s incident-worker -n 20
docker exec pulsar-learning bin/pulsar-admin topics stats persistent://public/default/incidents
```

预期消费 20 条；ACK 可能按组发送，游标和统计也可能短暂延迟，因此等待几秒并重复查询，最终 backlog 应回到 0。若持续不下降，核对订阅名是否完全一致、消费者是否 ACK、是否又有生产者写入。消费输出数量与 `msgBacklog` 一起验证，不只看命令退出码。

### 清理

```powershell
docker rm -f pulsar-learning
docker volume rm pulsar-learning-data pulsar-learning-conf
```

只删除命名为 `pulsar-learning` 的教学容器与两个实验卷，数据不可恢复；不要替换为生产名称。本实验没有模拟 Bookie 故障、重投、跨地域或 TCE 运维。

## AIOps 可观测与容量

端到端关联 producer/topic/partition/subscription/consumer/business ID/change。观察生产/消费消息与字节速率、发布/投递 P99、失败、backlog 数量和字节、unacked、重投、broker 连接/所有权、bookie 写延迟/磁盘和下游数据库。

恢复时间粗估：`积压字节 ÷ (可持续消费速率 - 持续生产速率)`，只有消费大于生产才会下降。还要取下游数据库和 API 可承受上限的最小值，不能一次性放开所有消费者。

AIOps 可以预测积压清空时间、关联消费者发布，但自动跳过/清空消息风险很高。Runbook 应先限流、扩容或隔离毒消息，有停止条件和业务核对。

## 升级与回滚

核对 broker/bookie/元数据/客户端/协议/Schema/函数连接器兼容；记录 Topic/namespace 策略和积压基线，验证备份或恢复方案。先兼容客户端和小流量，再滚动组件，监控所有权移动、重连、写入/消费和存储冗余。

消息和元数据格式变化可能阻止降级。回滚要说明客户端、服务端、Schema 和升级期间消息怎样兼容；不要在副本恢复或磁盘高水位时叠加升级。

## 排障字典

| 现象 | 证据 | 假设 | 安全处置 |
|---|---|---|---|
| 生产失败 | DNS/TLS/认证、owner、broker、bookie | 入口/权限/存储确认失败 | 有界重试并查结果，防重复 |
| backlog 上升 | 生产/消费率、consumer、下游 | 消费停/慢或热点 | 按下游能力恢复，不清空 |
| 重投上升 | ACK 延迟、错误、业务 ID | 处理失败或 ACK 丢失 | 幂等修复、退避、DLQ |
| 单分区热点 | key 分布、partition rate | key 倾斜 | 先改路由设计，评估顺序 |
| Broker 频繁转移 | 所有权、GC、网络、负载 | 进程/网络/资源不稳 | 限制变更，保留诊断 |
| Bookie 磁盘高 | ledger/副本/保留/backlog | 消费停或容量不足 | 扩容/治理前确认保留 |
| 消费顺序异常 | key、分区、订阅、重试 | 设计不保证该顺序 | 明确顺序边界，不强行重排 |

## 生产设计题

设计告警事件流：峰值 5 万条/秒，设备内顺序，三类消费者独立，允许重复但不能重复建工单，保留 7 天。

回答应包含 topic/partition/key、三个订阅、幂等键、Schema、积压容量、恢复限流、DLQ、安全权限、跨 AZ、副本和备份/重放。追问单一设备产生热点怎么办：顺序要求限制并行，要评估上游聚合、分层 key 或拆分业务语义，不能无损无限扩展。

## 事故题

消费者版本发布后 backlog 暴涨、数据库 CPU 也升高。先停止扩大发布，收集消费率、重投、下游 SQL、版本和分区分布；假设新版本导致每条消息重复查询或 ACK 变慢。

回退小批消费者或隔离坏版本，同时限制恢复并发保护数据库。验证 backlog 下降速度、重投、业务唯一键和下游事务。不可直接清空积压来消除告警。

## 面试回答

### 30 秒

Pulsar 将 broker 与 BookKeeper 存储分离，Topic 可分区，每个 subscription 有独立游标。可靠消费关键是业务处理和 ACK 的先后、幂等、积压容量与下游保护，而不只是 broker 存活。

### 3 分钟

画生产确认和消费 ACK 两条路径，解释四种订阅、分区顺序、重投/DLQ、retention 与 backlog。用消费者停机实验说明健康检查与端到端 SLO 的区别，再讲多 AZ、副本、跨地域、Schema、安全和兼容升级。

### 递进追问

1. **为什么 broker 无状态仍不能随便重启全部？** 连接和所有权迁移有冲击，存储/元数据仍是依赖。
2. **先 ACK 还是先写库？** 先写库再 ACK 并保证幂等；追问结果未知怎样查。
3. **增加分区有什么代价？** 路由/顺序/运维和存储开销，既有 key 分布会变化。
4. **backlog 数量够不够？** 还看字节、消息大小、保留、消费净速率。
5. **跨地域复制等于 DR 吗？** 还缺应用、游标/数据语义、入口、下游和切换演练。
6. **何时找原厂？** TCE 产品包装、闭源控制面、元数据/BookKeeper 修复、补丁和升级。

## GitHub 学习证据与检查清单

- [ ] 能画生产确认与消费 ACK 路径。
- [ ] 能解释 Topic、分区、四种订阅和顺序边界。
- [ ] 能完成生产消费与积压恢复实验并安全清理。
- [ ] 能设计幂等、Schema、DLQ、容量、HA 和安全。
- [ ] 能说明 standalone 不代表 TCE 生产架构。

可提交实验命令/脱敏统计、消息契约、容量公式、积压事故时间线和生产设计；不得提交 Token、真实 Topic/租户、内部地址、业务消息或 BOM。继续学习 [TCE 数据与中间件](./tce-data-middleware.md)、[Kafka](./kafka.md) 与 [TCE 存储](../storage-data-protection/tce-storage.md)。
