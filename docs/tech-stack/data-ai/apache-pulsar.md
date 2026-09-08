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
命名：tenant（租户） -> namespace（策略命名空间） -> topic（主题） -> partition（分区）
发送：producer（生产者） -> broker（接入与调度节点） -> managed ledger（托管日志） -> bookie（存储节点）
消费：subscription（订阅） -> consumer（消费者） -> receive（接收） -> process（业务处理） -> ack（确认）
状态：cursor（游标）/backlog（积压） -> redelivery（重投） -> retry（重试）/DLQ（死信队列） -> retention（保留）/expiry（过期）
治理：认证授权 -> quota（配额） -> schema（消息结构） -> geo-replication（跨地域复制） -> observability（可观测性）
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
Producer（生产者）
  -> DNS/TLS/认证
  -> Broker 查 topic 所有权
  -> 分区路由
  -> BookKeeper ledger 多副本写入
  -> Broker 返回确认

Consumer（消费者）
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

### 清理时机

若继续下文“两本进度账”实验，先保留本教学容器与卷；全部实验完成后执行文末清理命令。单机实验没有模拟 Bookie 故障、跨地域或 TCE 运维，不能将结果当作这些能力的验证。

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

## 老师带你顺着一张告警通知走一遍

学生：“既然生产者显示成功，为什么工单里没有这条告警？”老师：“你把快递交给快递站，收件人还没签收，两件事当然可以同时发生。我们要追踪交件、运输、业务处理、签收四个时刻。”

告警接收程序先把 `eventId=alert-001` 写入消息内容，发送到主题；broker 将持久化工作交给 BookKeeper，在规定条件满足后返回生产确认。工单消费者从自己的订阅收到消息，在数据库提交工单后发送 ACK。审计消费者使用另一个订阅，独立保存记录；它的进度慢，不应让工单订阅误以为自己也没有处理。

这里要分清三种身份：业务 `eventId` 表示同一个告警事件；消息 ID 表示消息系统里的某个位置；订阅名表示哪个消费群体的进度。生产者主动重发相同业务事件可能得到新的消息 ID，所以业务去重不能只依赖“消息 ID 没见过”。消费者把订阅名字改了，也不是简单改显示名，而可能建立一套新的消费进度。

把消息当成事实记录时，字段最好包含业务键、事件版本、发生时间、来源、结构版本与关联请求 ID。发生时间与消息发布时间不同：网络中断后补发的告警可能刚进队列，却是十分钟前发生的事故。根因分析不能把到达顺序直接当成业务发生顺序。

### 四种订阅怎么选，先用班级分作业理解

Exclusive（独占）像只让一位同学批改这份作业；Failover（故障接替）安排一位主批改者和备用者。Shared（共享）把不同作业发给多位同学，吞吐提高，但先发的作业不一定先批完。Key_Shared（按键共享）让同一位学生的作业持续交给同一位批改者，不同学生可并行。

比喻讲完要回到约束：分区、客户端批处理、消息键、重投与订阅配置都影响顺序表现。按设备键分配，不代表整个主题全局有序；消费者收到顺序正确，也不代表异步调用下游后完成顺序相同。若业务要求同设备状态不能倒退，还应比较业务版本或序号。

“每个设备一条有序流”和“单设备每秒十万条”发生冲突时，先让业务明确是否真的要对所有事件排序。心跳、指标和控制指令可能可以分开；同一控制对象的状态迁移仍保持顺序。无限增加消费者不能突破一个严格串行热点键的处理上限。

### ACK 课堂：最危险的不是报错，而是不知道结果

我们列出两个崩溃位置。先 ACK 后提交数据库：确认已经前移，进程却在写库前退出，消息系统可能不再给你这条消息。先写库后 ACK：数据库已有结果，进程在确认前退出，消息会重投。这就是为什么业务通常选择后者并补幂等，而不是寻找一个“不会发生崩溃的时间点”。

幂等记录与业务副作用应尽量处于同一个持久化事务中。例如 `processed_events(event_id UNIQUE)` 和 `tickets` 同事务写入，重复事件触发已有结果查询。只在内存保存一组已处理 ID，重启就忘记；先写去重记录再另写工单，中间崩溃又会出现“记录说处理过，工单其实没建立”。

失败消息分两类：临时数据库超时可以退避重试；格式错误、缺少必填字段可能每次都失败。后一类要进入可观测的失败处理流程，保留原因、原始结构版本和重放工具。DLQ 只是停放处，不会自动修复业务；必须有负责人、期限和修正后重放方法。

### 老师带你用现有实验验证“两个订阅，两本进度账”

在前文正常消费完成且教学容器仍运行时，先建立第二个订阅，再发送一条新消息。命令都只面向 `persistent://public/default/incidents` 教学主题：

```powershell
docker exec pulsar-learning bin/pulsar-admin topics create-subscription -s audit-worker -m latest persistent://public/default/incidents
docker exec pulsar-learning bin/pulsar-client produce persistent://public/default/incidents -m 'eventId=lesson-two-subs;status=OPEN'
docker exec pulsar-learning bin/pulsar-client consume persistent://public/default/incidents -s incident-worker -n 1
docker exec pulsar-learning bin/pulsar-admin topics stats persistent://public/default/incidents
```

预期工单订阅处理这条消息后积压归零，`audit-worker` 仍有一条待处理。再用同样的消费命令把订阅名换成 `audit-worker`，应读到相同教学内容。建立订阅使用 `latest` 是因为它在新消息发送前就存在；前文第一次实验使用 `earliest` 则用于避免错过先前消息，两者的时间关系要讲明白。

若审计订阅读不到，先确认它创建成功且早于发送，再核对完整主题和名称，检查消息是否已经被该订阅其他消费者确认。不要靠删除重建订阅碰运气。这个实验的故障模拟就是故意不启动审计消费者，证据是两份独立积压；恢复是启动它，清理仍使用前文明确命名的容器和卷。

### 容量课堂：积压能清完，数学上先要成立

假设每秒新增 5,000 条，消费者可持续处理 8,000 条，停机十分钟积压 300 万条。恢复后的净减少速度只有每秒 3,000 条，理论上还要 1,000 秒，不是 `300 万 ÷ 8,000`。如果数据库只能承受每秒 4,000 条，消费者进程再多也只会增加等待，积压会继续增长。

每条平均 2 KiB，则这次积压原始体量约 5.72 GiB；还需要按副本、索引、保留以及日志开销计算。消息数相同，2 KiB 和 2 MiB 的恢复负担差上千倍，因此消息数与字节数必须同时观察。短时间大消息也可能卡住带宽或下游解析内存。

扩容前先查：生产增速是否持续、消费者是否 CPU 忙、下游是否有余量、单键是否倾斜、是否大量重投。扩容后记录净消化速度与业务延迟，达到下游安全边界就停止加并发。恢复过程需要留新流量容量，否则历史积压处理越猛，当前用户越慢。

### BookKeeper 课堂：存储分离的代价从哪里来

broker 承担客户端通信与主题管理，持久消息存在由 bookie 组成的存储层。这有利于分别扩展连接处理与存储，但一次发布确认仍依赖网络、存储副本和元数据协调。你看见 broker CPU 很低，可能是它正在等存储确认。

Ensemble（副本成员集合）、write quorum（写入副本数）、ack quorum（确认门槛）是理解 BookKeeper 日志复制的入口。具体数值和故障容忍必须服从部署版本及方案，不能只记“三副本掉两台也行”。成员故障后还要有可用空间和带宽重建冗余，系统能继续写与系统已经恢复完整保护是两个阶段。

生产排障先看发布延迟是否与 bookie 写入延迟同步，再看磁盘队列、剩余容量、网络和副本恢复任务。手工改账本或清存储目录可能破坏恢复路径；此类操作必须由熟悉具体版本的维护流程处理。更适合 AIOps 的自动动作是补充证据、限制非核心流量和预测容量耗尽时间。

### 面试再追两层

“为什么不把所有消费者放一个 Shared 订阅？”答同订阅表达分担，一条消息由其中消费者处理；审计和工单各自都要收到全部事件时，需要独立订阅。继续问慢订阅影响什么：它自己的进度、保留与整体存储压力，需要按订阅观测并明确过期策略。

“消费者重启后工单翻倍，消息系统有 bug 吗？”答先核对业务键、消息位置、重投计数及确认时机；至少一次语义下重投可能是正常恢复。修复是持久幂等和事务边界，验证是同一业务事件只有一份有效工单及可追溯处理记录。

“跨地域复制成功是否可以宣布容灾完成？”答还要核对订阅进度语义、写入权、应用入口、外部数据库、凭据与回切方案。用业务产生—消费—提交的全过程演练报告说明结果，而不是仅展示集群页面正常。

## 生产机制加深：连接成功只是进入第一扇门

### Topic 所有权与客户端查找

客户端不一定始终把所有请求交给第一次连接的 broker。它需要查找 Topic 的拥有者，再建立实际生产或消费连接。Topic 所有权像服务台负责哪一排窗口，窗口因维护或负载变化移动后，客户端要发现变化并重连。因此“入口端口能通”不能排除随后查找、重定向或目标地址不可达。

这在本机 Docker 和代理环境里尤其常见：宿主机能访问映射端口，但 broker 告诉客户端的地址属于容器网络，宿主机无法直连。排障先区分 bootstrap（初始入口）和 advertised address（向客户端公布的地址），再核对 DNS、代理与网络路径。不要只把端口映射多开几个，也不要为省事把全部管理端口暴露公网。本文命令在容器内执行客户端，减少这类额外网络条件；宿主机 SDK 连接要另按部署方案配置。

生产看到大量重连时，将客户端错误、Topic 所有权转移、broker 重启、长时间垃圾回收和网络变更放在一起看。所有权正常转移与反复抖动不同；前者是有限的迁移过程，后者可能让可用连接不断被打断。自动反复重启 broker 可能进一步扩大连接风暴，应先停止叠加变更、保留异常窗口并定位反复迁移的原因。

### 游标不只是一个正在增加的整数

你可以先把 cursor 理解成进度书签，但共享消费时，前面的消息可能慢、后面的消息已经处理。系统需要表示这些确认状态，而不只是粗暴删除“某编号之前全部内容”。Individual acknowledgement（单条确认）和 cumulative acknowledgement（累积确认）表达不同边界，后者意为某位置及其前面消息都完成，不能随意用于并行乱序处理的订阅。具体订阅支持与客户端 API 必须对照版本。

假设第 1 条处理慢，第 2 至第 100 条完成，你既想不丢第 1 条，又不想重做后面所有业务。消息平台记录投递与确认，应用保留幂等记录，共同实现可恢复性。由于积压统计、已投递未确认和实际下游结果处在不同边界，单看一个数字会误判。特别是消费者预取后本地缓存很多消息，broker 的出流量上去了，业务完成率却可能仍很低。

消费超时设置应覆盖正常处理的长尾，而不是拍脑袋写得很短。任务需要十秒，确认超时只有两秒，系统可能不断重投仍在运行的任务，工作量反而上升。处理真正卡死又不能无限等，因此要有业务执行超时、受控重试、心跳或状态查询，以及持续超时进入人工处理的出口。确认超时与业务超时是两套机制，需要一起设计。

### 批处理、消息键与顺序的细节

Batching（批量发送）把多条消息合在一批，减少网络与持久化开销，但增加短时等待，也影响按键分配与失败恢复的粒度。使用 Key_Shared 时，需要验证生产者的批处理策略是否保持所需的键语义。不能只检查消费者参数正确，就忽略生产端把不同键混在一批造成的交互约束。

顺序至少有四层：业务发生顺序、生产者发送顺序、broker 存储顺序、消费者处理完成顺序。发生在不同机器上的事件还受时钟和网络影响；多生产者针对同一对象发送更新时，最好有权威业务版本或序列。处理端发现旧版本可以记录并拒绝覆盖新状态，而不是把时间戳最大永远当真，因为时钟可能不可靠。

压缩也有边界。压缩降低传输与存储字节，代价是编解码 CPU；很小的消息可能收益有限，特别大的批次又会增加内存和延迟。先在真实大小分布下测量吞吐、延迟、CPU 和故障重投，不拿单一平均值选参数。AIOps 报警最好同时有消息速率与字节速率，才能识别“条数没变、消息体突然增大”的事故。

### 保留、过期、压实与分层存储不要混淆

Retention（保留）解决消费完成后还留多久，TTL（生存时间）处理过旧未消费消息，compaction（按键压实）保留同键最新状态视图，offload（卸载到其他存储层）改变旧数据所在介质。这些能力可能同时出现，但不是四种“清理磁盘”的同义词。是否启用及具体支持范围以开源版本或交付产品为准。

如果 Topic 表达设备当前状态，按键压实可能有价值；如果每条消息都是不能省略的审计事件，丢掉同键旧事件会改变业务含义。分层存储可以降低本地成本，却要验证读取旧数据时的延迟、权限、网络和对象存储恢复。只把 ledger 卸载出去，而没有备份元数据、凭据和恢复操作，不构成完整灾备。

更重要的是，不同订阅可能有不同责任。工单订阅已追平，审计订阅停了三天，仍会影响保存数据的需要。清理前先列订阅所有者、业务期限、积压年龄和恢复计划；不认识的订阅不能直接视为无用。删除订阅、跳过消息、缩短保留是数据语义变更，风险远高于临时降低非核心生产速率。

### Bookie 故障后的两个恢复阶段

Bookie 不可用后，系统可能先通过副本与成员调整恢复服务，再通过数据修复恢复完整冗余。前者回答“现在还能不能接单”，后者回答“再坏一个故障域是否仍有保护”。值班不能只看到生产恢复就结束事故，还要确认欠保护数据、修复进度、剩余容量和存储延迟。

恢复工作会消耗磁盘与网络，可能与正常生产竞争。此时再做大规模 Topic 转移、版本升级或历史数据回放，容易让局部问题变为全局拥堵。处置计划应留出恢复带宽，限制非必要任务，并在观察窗口结束后确认冗余恢复。元数据、存储目录和日志段的修复应走目标版本官方工具与受控流程，不用通用删除命令试错。

### 面试官追加：如何验证整个系统真的恢复

先给每条教学事件稳定业务编号，记录生产是否明确确认、订阅收到与确认进度、下游工单唯一性，以及端到端延迟。恢复时同时检查新事件能及时处理、旧积压按净速率下降、重复事件不会重复建单、死信没有暗中增加、存储冗余与剩余容量正常。只验证其中一段会留下盲区。

追问“积压为零但业务缺数据”，沿消息身份找生产确认、订阅名、过期/跳过记录、消费确认时机和数据库事务，而不是先更换 broker。追问“数据没丢为什么还要复盘”，因为接近耗尽的容量、不可控重投或无界重试已经暴露系统边界，需要把消息年龄、恢复净速率、下游预算与变更门禁变成长期规则。

### 全部教学实验的清理

先保存两订阅统计、消息编号和观察时间，再确认 `docker inspect pulsar-learning --format '{{.Name}}'` 输出 `/pulsar-learning`。只清理本课创建的容器和两个实验卷：

```powershell
docker rm -f pulsar-learning
docker volume rm pulsar-learning-data pulsar-learning-conf
```

卷删除后教学消息与订阅状态不可恢复，重新练习应从基础实验开始；不要替换为任何生产实例或共享卷名称。

## 本课 GitHub 学习证据

- [ ] 能画生产确认与消费 ACK 路径。
- [ ] 能解释 Topic、分区、四种订阅和顺序边界。
- [ ] 能完成生产消费与积压恢复实验并安全清理。
- [ ] 能设计幂等、Schema、DLQ、容量、HA 和安全。
- [ ] 能说明 standalone 不代表 TCE 生产架构。

可提交实验命令/脱敏统计、消息契约、容量公式、积压事故时间线和生产设计；不得提交 Token、真实 Topic/租户、内部地址、业务消息或 BOM。继续学习 [TCE 数据与中间件](./tce-data-middleware.md)、[Kafka](./kafka.md) 与 [TCE 存储](../storage-data-protection/tce-storage.md)。
