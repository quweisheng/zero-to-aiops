# Apache ActiveMQ 技术栈深讲：Classic 与 Artemis

> 学习目标：从零理解 ActiveMQ Classic 与 Apache Artemis 的产品边界、Queue/Topic、JMS、持久化、确认、重投、死信、流控、KahaDB/Journal、集群与高可用，能启动当前 Classic 版本、完成消息收发和持久化恢复实验，并能设计生产可靠性、容量、安全、升级迁移、可观测与 AIOps 消息链路。

## 版本边界

ActiveMQ Classic 与 Apache Artemis 有历史关系，但从 2025-11-19 起已经是两个独立的 Apache 顶级项目。本文把它们放在一起，是为了帮助读者理解存量系统、技术差异和迁移边界，不代表 Artemis 仍是 ActiveMQ 项目下的子产品。

| 产品线 | 截至 2026-07-30 的官方版本事实 | 核心定位 |
|---|---|---|
| ActiveMQ Classic | `6.3.0`、`6.2.8`、`5.19.9` 所在系列均标记为 Stable - Supported | 大量存量 Java/JMS 系统使用的经典 Broker |
| Apache Artemis | `2.55.0`，要求 Java 17+ | 更新的高性能多协议消息 Broker，拥有不同地址、队列、Journal 和 HA 模型 |

Classic 6.3.0 支持 Java 17、21、25。Classic 6.x 使用 Jakarta JMS 相关 API；5.19.x Broker 仍面向 `javax.jms` 1.1 生态并支持较低 Java 基线。升级前必须核对应用到底导入 `javax.jms.*` 还是 `jakarta.jms.*`。

官方 Docker Hub 的镜像标签可能落后于 Apache 下载页。生产不能因为 `latest` 能拉取就忽略补丁和安全公告；本文基础实验直接使用 Apache 6.3.0 官方二进制并校验 SHA-512。

Artemis 从 2.50.0 起，Maven `groupId` 也从 `org.apache.activemq` 迁到 `org.apache.artemis`。升级客户端或插件时，要把坐标变化与 Broker 行为迁移分开验证。

## 官方资料

- [Apache ActiveMQ 项目首页](https://activemq.apache.org/)
- [ActiveMQ Classic 首页](https://activemq.apache.org/components/classic/)
- [ActiveMQ Classic 当前版本与支持状态](https://activemq.apache.org/components/classic/download/)
- [ActiveMQ Classic 文档](https://activemq.apache.org/components/classic/documentation/)
- [Classic Getting Started](https://activemq.apache.org/components/classic/documentation/getting-started)
- [Classic JMS 与客户端](https://activemq.apache.org/components/classic/documentation/jms)
- [Classic Features](https://activemq.apache.org/components/classic/documentation/features)
- [Classic Security](https://activemq.apache.org/components/classic/documentation/security)
- [Classic Persistence](https://activemq.apache.org/components/classic/documentation/persistence)
- [Classic JMX](https://activemq.apache.org/components/classic/documentation/jmx)
- [Apache Classic Docker 仓库（已归档、标签可能落后）](https://hub.docker.com/r/apache/activemq-classic)
- [Apache Artemis 首页](https://artemis.apache.org/)
- [Apache Artemis 成为独立顶级项目的公告](https://artemis.apache.org/news/artemis-tlp)
- [Artemis Maven groupId 迁移说明](https://artemis.apache.org/artemis-tlp-groupid-migration)
- [Apache Artemis 当前版本](https://artemis.apache.org/components/artemis/download/)
- [Apache Artemis 文档](https://artemis.apache.org/components/artemis/documentation/latest/)
- [Artemis Docker 运行说明](https://artemis.apache.org/components/artemis/documentation/latest/docker.html)
- [Artemis 升级说明](https://artemis.apache.org/components/artemis/documentation/latest/upgrading.html)
- [Artemis 官方 Docker 镜像](https://hub.docker.com/r/apache/artemis)

说明：本文基于 Apache 官方文档、发布页和官方镜像信息重新组织，不复制官方全文。Classic 与 Artemis 的配置、存储格式、HA、CLI 和迁移边界不同，任何生产动作都要回到目标版本文档验证。

## 官方知识地图

```text
消息模型
  -> Producer / Consumer / Message
  -> Queue / Topic / Durable Subscription
  -> JMS / AMQP / OpenWire / STOMP / MQTT

可靠性
  -> Persistent / Store / Producer Ack
  -> Consumer Ack / Transaction / Redelivery / DLQ
  -> Ordering / Duplicate / Idempotency

Broker 运维
  -> Destination / Cursor / Paging / Flow Control
  -> KahaDB / Artemis Journal
  -> JMX / Web Console / Security

分布式
  -> Classic Network of Brokers / Master-Slave
  -> Artemis Cluster / HA Pair / Replication / Shared Store
  -> Upgrade / Migration / Disaster Recovery
```

本文顺序：

1. 先分清 Classic、Artemis、JMS 和协议。
2. 再走消息发布、持久化、分发和确认路径。
3. 再理解 Queue、Topic、Ack、重试与死信。
4. 然后运行 Classic 6.3.0，完成持久消息恢复实验。
5. 再学习容量、流控、HA、安全和迁移。
6. 最后进入事故推演、系统设计和面试追问。

## 场景开场

告警平台收到 1 万条告警后，要依次调用短信、工单和自动化系统。如果告警接收线程同步等所有下游返回，任何一个依赖变慢都会把入口拖死。

团队于是加了 ActiveMQ：

```text
告警入口
  -> 把事件发到 Broker
  -> 短信消费者
  -> 工单消费者
  -> Runbook 消费者
```

上线后新问题又来了：为什么 Broker 重启后有些消息没了？消费者崩溃后为什么消息重复？两个 Broker 用 Network Connector 连起来为什么不等于消息自动有两份？

学 ActiveMQ 的重点就是回答这些“异步以后谁负责可靠性”的问题。

## 一句话人话版

ActiveMQ 是消息中转站：生产者把消息交给 Broker，Broker 按 Queue 或 Topic 保存和路由，消费者处理后确认；可靠性取决于持久化、确认、重试、幂等和高可用共同设计。

## 小白可能会问

- ActiveMQ 与 JMS 是不是同一个东西？
- Queue 和 Topic 有什么区别？
- Producer `send()` 返回是否等于消息绝不会丢？
- Consumer 收到消息是否等于业务处理成功？
- 重投为什么会造成重复消费？
- Network of Brokers 是不是数据库复制集？
- Classic 与 Artemis 能不能直接共享数据目录？

## 为什么要学

ActiveMQ 常见于传统 Java 企业系统、ESB、订单、支付、工单、设备和运维自动化。它能提供异步、解耦、缓冲和协议适配。

AIOps 场景：

- 告警事件进入处理队列。
- Runbook 任务按优先级执行。
- 变更、CMDB 和审计事件广播。
- 模型推理任务异步消费。
- 不同协议的设备事件统一进入处理链。

但消息队列不会自动给出业务“恰好一次”。Broker 至少一次投递、消费者幂等、事务发件箱、去重键和补偿机制必须一起设计。

## 是什么

Apache ActiveMQ 是 Apache Software Foundation 下的消息 Broker 项目家族。

### JMS

JMS（Java Message Service）是 Java 消息 API 规范。它定义 Connection、Session、MessageProducer、MessageConsumer、Queue、Topic 等编程接口。

JMS 不是网络协议，也不是一个 Broker。客户端可以通过 Broker 支持的具体协议通信。

### ActiveMQ Classic

Classic 是历史悠久的 Java Broker，常见核心包括：

- Broker Service。
- Transport Connector。
- Destination。
- Dispatch、Subscription 与 Prefetch。
- KahaDB 或 JDBC Persistence Adapter。
- Network Connector。
- JMX 与 Web Console。

### Apache Artemis

Artemis 是另一套 Broker 内核。它使用 Address、Queue 和 Routing Type 建模：

- Anycast：一条消息路由给一个匹配队列/消费者路径。
- Multicast：一条消息复制到多个匹配队列。
- 高性能 Journal、Paging、Cluster Connection 和 HA Pair。

Classic Queue/Topic 与 Artemis Address/Queue/Routing Type 有概念映射，但配置文件、数据目录和故障机制不能直接互换。

## 它解决什么问题

- 异步：生产者不用等下游业务全部完成。
- 解耦：生产者只依赖消息契约，不直接依赖每个消费者地址。
- 削峰：短时突发先进入队列，消费者按能力处理。
- 路由：Queue、Topic、Selector 和协议把消息送到目标。
- 失败隔离：重投、过期和 DLQ 把异常消息隔离。
- 协议桥接：OpenWire、AMQP、STOMP、MQTT 等连接不同客户端。

## 核心原理

### 一条持久消息的数据路径

```text
Producer
  -> Client Session
  -> TCP / OpenWire 或其他协议
  -> Transport Connector
  -> 认证与授权
  -> Destination
  -> Persistence Adapter / Journal
  -> Broker 按发送语义确认 Producer
  -> Dispatch / Prefetch
  -> Consumer
  -> 业务处理
  -> Ack 或 Transaction Commit
  -> Broker 删除或推进消息状态
```

每个箭头都有故障窗口。要问“会不会丢”，必须继续追问：

- Message 是否 Persistent？
- Broker 是否启用持久化？
- Producer 是否同步等待 Broker 确认或使用事务？
- 存储是否真的持久？
- Consumer 在业务提交前还是后 Ack？
- 重投后业务是否幂等？

### Queue

Queue 是点对点目的地。一条消息通常由一个消费者处理；多个消费者竞争分担工作。

Queue 不保证你的业务永远按全局顺序完成。Prefetch、多消费者、重投、优先级和处理耗时都会影响完成顺序。

### Topic

Topic 是发布/订阅。一条消息可以发给多个订阅者。

非持久订阅者离线时通常收不到离线期间消息。Durable Subscription 用稳定 Client ID 和 Subscription Name 保存订阅状态，但会增加 Broker 存储和积压责任。

### Ack 与事务

常见 JMS Ack 模式：

| 模式 | 人话解释 | 风险 |
|---|---|---|
| `AUTO_ACKNOWLEDGE` | 客户端在接收回调正常返回等时机自动确认 | 业务外部事务边界可能不一致 |
| `CLIENT_ACKNOWLEDGE` | 应用显式确认 | 一次确认可能覆盖 Session 中多条消息，要核对语义 |
| `DUPS_OK_ACKNOWLEDGE` | 允许延迟确认，容忍重复 | 业务必须能去重 |
| Transacted Session | Session Commit 时一起确认或发送 | 仍不自动包含任意外部数据库事务 |

最危险的代码顺序是：

```text
先 Ack
  -> 再写业务数据库
  -> 数据库失败
  -> Broker 已认为成功
```

更常见的安全顺序是业务提交后 Ack，但在“数据库提交成功、Ack 尚未到达 Broker”窗口崩溃时会重投，因此消费者必须幂等。

### Redelivery 与 DLQ

Consumer 未确认、回滚、连接断开或抛出异常时，消息可能重投。达到 Redelivery Policy 阈值后，毒消息进入 DLQ（Dead Letter Queue，死信队列）。

DLQ 不是垃圾桶。它要有：

- 原始 Destination。
- Message ID、业务幂等键和重投次数。
- 首次/最后失败时间。
- 异常类型和代码版本。
- 人工修复、重放和丢弃审批。

### 持久化

Classic 默认常用 KahaDB。它通过 Journal、索引和恢复机制保存 Persistent Message 和相关状态。

```text
消息 Journal
  + Destination / Ack 索引
  + Checkpoint / Cleanup
```

磁盘延迟会直接影响持久消息吞吐。KahaDB 目录不能被多个不受支持的 Broker 同时读写。

Artemis 使用自己的 Journal、Bindings Journal、Paging 和 Large Message 存储。Classic 数据目录不能直接挂给 Artemis。

### Prefetch 与流控

Prefetch 让 Broker 预先把多条消息推给 Consumer，减少往返、提高吞吐。但 Prefetch 太大时：

- 消息集中到慢消费者。
- Broker 队列看似变少，实际变成 Consumer 未确认。
- 故障后重投批量变大。
- 公平性下降。

Producer Flow Control 在 Broker 内存、Store 或 Temp 使用达到阈值时限制生产者，避免 Broker 被无限写爆。它会把压力传回上游，所以生产者必须有超时、指标和降级策略。

## 关键术语拆解

| 术语 | 人话解释 | 观察重点 |
|---|---|---|
| Broker | 接收、保存、路由消息的服务 | 状态、存储、连接、线程 |
| Destination | Queue 或 Topic 的逻辑地址 | 消息数、消费者、策略 |
| Producer | 发送消息的客户端 | 发送率、失败、阻塞 |
| Consumer | 接收并处理消息的客户端 | Ack、Prefetch、处理时长 |
| Persistent | 要求 Broker 走持久化路径的消息 | Store、确认和恢复 |
| Non-Persistent | 可走更弱持久化路径的消息 | Broker 故障可能丢失 |
| Ack | Consumer 告诉 Broker 处理进度 | Ack 时机和批量语义 |
| Redelivery | 消息再次交付 | 重投次数、幂等 |
| DLQ | 超过重投策略后的隔离队列 | Owner、重放和保留期 |
| KahaDB | Classic 常用持久化适配器 | Journal、磁盘、Checkpoint |
| Cursor | Broker 管理待分发消息的位置和缓存 | 内存与 Paging |
| Prefetch | 预先推给 Consumer 的消息数 | 公平性、未确认数 |
| Network Connector | Classic Broker 间转发需求/消息 | 不是通用数据复制 |
| Address | Artemis 的路由地址 | Anycast/Multicast |

## 核心知识树

### Connection 与 Session

是什么：Connection 是客户端到 Broker 的物理连接，Session 是 JMS 操作和事务上下文。

为什么需要：每条消息新建 TCP 连接成本很高，Session 提供轻量通道和顺序边界。

怎么工作：Connection 内创建一个或多个 Session，Session 再创建 Producer、Consumer 和 Destination。

怎么用：复用 Connection，按线程安全规则使用 Session，配置有界连接池。

坏了怎么查：连接数、心跳、证书、协议、线程泄漏、Session 泄漏和 Broker 日志。

### Transport Connector

是什么：Broker 监听客户端协议和端口的入口。

为什么需要：OpenWire、AMQP、STOMP、MQTT 等客户端握手和帧格式不同。

怎么工作：Connector 接受连接，协议解析后交给 Broker 核心。

怎么用：只启用需要的协议，配置 TLS、连接数、帧大小和网络访问控制。

坏了怎么查：端口、协议是否匹配、TLS、帧大小、认证、连接限制。

### Destination Policy

是什么：对 Queue 或 Topic 应用内存、流控、死信、过期和分发策略。

为什么需要：不同业务的重要性、消息大小和消费者速度不同。

怎么工作：按 Destination 通配符匹配 Policy Entry。

怎么用：用具体业务前缀分组策略，变更前验证命中范围。

坏了怎么查：查看实际 Destination 名、策略优先级、JMX 属性和启动配置。

### Persistence Adapter

是什么：Classic 把持久消息和 Broker 状态写入磁盘或数据库的抽象。

为什么需要：Broker 进程重启后恢复消息。

怎么工作：KahaDB 使用 Journal 与索引；JDBC Adapter 使用关系数据库和锁。

怎么用：按支持矩阵配置数据目录、磁盘、备份和 HA。

坏了怎么查：磁盘延迟、空间、文件权限、锁、损坏、数据库连接和 Store Percent Usage。

### Network of Brokers

是什么：多个 Classic Broker 通过 Network Connector 转发消费者需求和消息。

为什么需要：跨站点、分区客户端或扩展路由。

怎么工作：Broker 建立桥接，按配置传播 Advisory、Subscription 和消息。

怎么用：明确 Duplex、TTL、静态/动态 Destination 和环路控制。

坏了怎么查：桥接状态、网络、重复路由、消息 TTL、消费者需求和环路。

它不是复制集。一个消息被转发走后，不代表源和目标始终保留同步副本。

### Artemis Address 与 Queue

是什么：Address 是路由入口，Queue 是消息实际排队处。

为什么需要：把“消息发到哪里”和“哪些队列接收”分开。

怎么工作：Anycast 选择一个匹配 Queue，Multicast 把消息复制到多个 Queue。

怎么用：按业务语义显式配置 Routing Type、Address 和 Queue。

坏了怎么查：Address 是否存在、自动创建策略、Routing Type、Binding 和 Consumer。

## 架构和数据流

### Classic 单 Broker

```text
Producer
  -> OpenWire :61616
  -> ActiveMQ Classic Broker
      -> Queue / Topic
      -> KahaDB
      -> JMX :1099（按配置）
      -> Web Console :8161
  -> Consumer
```

### Classic 多 Broker

```text
客户端 A -> Broker A
             |
             | Network Connector
             v
客户端 B -> Broker B
```

Network Connector 主要解决消息路由和消费者需求传播。HA 要另外选择受支持的 Shared Store、JDBC Lock、主备或其他架构，不能把“桥接成功”当作“同步复制成功”。

### Artemis HA

```text
客户端
  -> Primary Broker（旧称 Live）
      -> Shared Store 或 Replication
  -> Backup Broker
      -> 故障后激活
```

Artemis Cluster Connection 用于拓扑和消息分布，HA Policy 用于 Primary/Backup（旧称 Live/Backup）。Cluster 和 HA 是相关但不同的维度。

### 故障域

- Producer：发送超时、连接断开、不确定是否已写入。
- Broker 进程：未持久消息丢失、持久消息恢复。
- Store：磁盘满、延迟、损坏或共享存储故障。
- Consumer：慢、崩溃、Ack 丢失、毒消息。
- 网络：客户端重连、Broker Bridge 断开、重复路由。
- 配置：策略匹配错误、协议端口暴露、权限过宽。

## 安装与启动

### 前提

- Windows、Linux 或 macOS。
- JDK 17，并正确设置 `JAVA_HOME`。
- 61616 和 8161 端口未占用。
- 本实验不暴露公网。

### 下载并校验 Classic 6.3.0

PowerShell：

```powershell
$version = '6.3.0'
$base = "https://downloads.apache.org/activemq/$version"
$zip = "apache-activemq-$version-bin.zip"

Invoke-WebRequest "$base/$zip" -OutFile $zip
Invoke-WebRequest "$base/$zip.sha512" -OutFile "$zip.sha512"

$expected = ((Get-Content "$zip.sha512" -Raw).Trim() -split '\s+')[0].ToUpperInvariant()
$actual = (Get-FileHash $zip -Algorithm SHA512).Hash

if ($expected -ne $actual) {
  throw "ActiveMQ SHA-512 校验失败"
}

Expand-Archive $zip -DestinationPath . -Force
Set-Location "apache-activemq-$version"
```

若镜像站的校验文件格式变化，先人工查看内容并核对官方说明，不要为了让脚本通过而跳过校验。

发行版默认 OpenWire Connector 监听 `0.0.0.0:61616`，会接受来自宿主机其他网卡的连接。本文实验先备份配置并改成仅监听本机：

```powershell
Copy-Item .\conf\activemq.xml .\conf\activemq.xml.lab-backup

$brokerConfig = Get-Content .\conf\activemq.xml -Raw
$brokerConfig = $brokerConfig.Replace(
  "tcp://0.0.0.0:61616",
  "tcp://127.0.0.1:61616"
)
$brokerConfig | Set-Content .\conf\activemq.xml -Encoding utf8

Select-String -Path .\conf\activemq.xml -Pattern "127.0.0.1:61616"
```

若最后一条命令没有命中，就不要启动，先查看目标版本实际 Connector 配置。这个修改只限制 Broker Connector；Web Console、JMX、防火墙和认证还要分别检查。

### 启动

```powershell
.\bin\activemq.bat start
.\bin\activemq.bat status
```

访问 `http://localhost:8161/admin/`。学习发行版常见默认控制台账号为 `admin/admin`，首次实验后就应修改；生产绝不能保留默认凭据。

前台观察日志可用：

```powershell
.\bin\activemq.bat console
```

前台和后台启动不能同时运行同一实例。

## 目录字典

| 目录/文件 | 作用 | 排障重点 |
|---|---|---|
| `bin/` | 启停和 CLI | Java、实例路径、PID |
| `conf/activemq.xml` | Broker、Connector、Store 和策略 | XML、端口、变量 |
| `conf/users.properties` | Broker 用户 | 默认凭据、权限 |
| `conf/groups.properties` | 用户组 | 角色映射 |
| `conf/jetty*.xml` | Web Console | 监听、TLS、访问控制 |
| `data/` | KahaDB、临时文件和运行数据 | 磁盘、权限、备份 |
| `data/activemq.log` | Broker 日志 | 启动、Store、连接、桥接 |

不要把配置目录和数据目录混在应用包升级里。升级使用新发行目录，显式迁移受支持的配置和数据。

## 配置详解

`conf/activemq.xml` 核心结构示意：

```xml
<broker xmlns="http://activemq.apache.org/schema/core"
        brokerName="aiops-broker"
        persistent="true"
        useJmx="true"
        schedulerSupport="true">

  <destinationPolicy>
    <policyMap>
      <policyEntries>
        <policyEntry queue="AIOPS.>"
                     producerFlowControl="true"
                     memoryLimit="64mb">
          <deadLetterStrategy>
            <individualDeadLetterStrategy
              queuePrefix="DLQ."
              useQueueForQueueMessages="true"/>
          </deadLetterStrategy>
        </policyEntry>
      </policyEntries>
    </policyMap>
  </destinationPolicy>

  <persistenceAdapter>
    <kahaDB directory="${activemq.data}/kahadb"/>
  </persistenceAdapter>

  <systemUsage>
    <systemUsage>
      <memoryUsage>
        <memoryUsage limit="512 mb"/>
      </memoryUsage>
      <storeUsage>
        <storeUsage limit="20 gb"/>
      </storeUsage>
      <tempUsage>
        <tempUsage limit="5 gb"/>
      </tempUsage>
    </systemUsage>
  </systemUsage>

  <transportConnectors>
    <transportConnector name="openwire"
      uri="tcp://127.0.0.1:61616?maximumConnections=1000&amp;wireFormat.maxFrameSize=10485760"/>
  </transportConnectors>
</broker>
```

这是学习示意，不是可直接覆盖生产的完整配置。XML 中 `&` 要转义为 `&amp;`。

| 配置 | 作用 | 常见坑 |
|---|---|---|
| `brokerName` | Broker 标识 | 多节点重名影响观测和桥接 |
| `persistent` | 是否启用持久化 | 不等于所有消息自动 Persistent |
| `useJmx` | 暴露管理 MBean | JMX 远程访问必须加固 |
| `schedulerSupport` | 启用调度消息 | 增加存储与运维面 |
| `queue="AIOPS.>"` | 匹配 Queue 策略 | 通配符过宽误伤其他业务 |
| `producerFlowControl` | 高水位反压 Producer | 应用未设置超时会长时间阻塞 |
| `memoryLimit` | 单 Destination 内存限制 | 太小频繁 Paging，太大挤压 Broker |
| `kahaDB directory` | 持久化目录 | 共享、权限和磁盘延迟 |
| `storeUsage limit` | Store 使用上限 | 配得大于真实磁盘没有意义 |
| `maximumConnections` | Connector 连接上限 | 要和线程、文件句柄一起规划 |
| `wireFormat.maxFrameSize` | 单帧大小保护 | 太小拒绝合法大消息，太大增加内存风险 |

## 常用命令

```powershell
.\bin\activemq.bat status
.\bin\activemq.bat query
.\bin\activemq.bat dstat
.\bin\activemq.bat browse queue:AIOPS.ALERTS

.\bin\activemq.bat producer `
  --destination queue://AIOPS.ALERTS `
  --messageCount 5 `
  --persistent true `
  --message "alert-event"

.\bin\activemq.bat consumer `
  --destination queue://AIOPS.ALERTS `
  --messageCount 5

.\bin\activemq.bat stop
```

不同版本 CLI 参数可能调整，先执行：

```powershell
.\bin\activemq.bat producer --help
.\bin\activemq.bat consumer --help
```

| 命令 | 作用 | 正常结果 | 异常先查 |
|---|---|---|---|
| `status` | 看 Broker 进程 | 显示运行 PID/状态 | PID、Java、实例目录 |
| `query` | 查询 JMX 对象 | 返回 Broker/Queue MBean | JMX URL、认证、进程 |
| `dstat` | Destination 统计 | 消息、入队、出队、消费者 | JMX、Destination 是否存在 |
| `producer` | 发送测试消息 | 发送计数完成 | URL、协议、认证、流控 |
| `consumer` | 消费测试消息 | 收到指定条数 | Selector、Prefetch、Ack |
| `browse` | 不消费地浏览 Queue | 看到消息属性和正文 | Queue 名、权限、消息已被消费 |

## 协议与端口

常见默认端口：

| 协议/界面 | 常见端口 | 用途 |
|---|---:|---|
| OpenWire | 61616 | ActiveMQ Classic 原生 Java 客户端 |
| AMQP | 5672 | 跨语言标准消息协议 |
| STOMP | 61613 | 简单文本协议 |
| MQTT | 1883 | IoT 设备常用协议 |
| WebSocket | 61614 | 浏览器或 WebSocket 客户端 |
| Web Console | 8161 | 管理界面 |

生产只启用需要的协议。每多开一个 Connector，就多一套认证、TLS、帧限制、连接数和漏洞面。

## 可靠性语义

### Producer 端

至少确认：

- 消息 Delivery Mode。
- 发送是否同步确认。
- 事务何时 Commit。
- 超时后业务如何判断“不确定结果”。
- Message ID 或业务幂等键。

### Consumer 端

安全处理框架：

```text
接收消息
  -> 校验格式和版本
  -> 用 eventId 检查幂等
  -> 执行业务事务
  -> 记录处理结果
  -> Ack / Commit
```

若 Ack 丢失，Broker 会重投，但幂等表能识别已完成业务。

### “恰好一次”边界

Broker 可以提供事务、去重或特定确认能力，但跨 Broker、业务数据库、第三方 API 的端到端 Exactly Once 不能只靠一个开关。

常见工程方案：

- Transactional Outbox：业务数据和待发送事件写同一数据库事务。
- Inbox：消费者按业务幂等键记录处理。
- 幂等外部 API。
- 补偿与对账。

## 可观测性

### JMX 与 Web Console

Classic 通过 JMX 暴露 Broker、Connector、Destination、Subscription、Persistence Adapter 等状态。Web Console 适合人工观察，不应作为唯一监控来源。

核心指标：

- Enqueue Count / Rate。
- Dequeue Count / Rate。
- Queue Size。
- Inflight / Dispatch / Unacked。
- Consumer Count、Producer Count。
- Expired、DLQ、Redelivery。
- Memory Percent Usage。
- Store Percent Usage。
- Temp Percent Usage。
- Connection 和线程。
- KahaDB Checkpoint、Journal、磁盘延迟。
- Network Bridge 状态。

### 四类黄金信号

```text
流量：enqueue/dequeue rate
延迟：message age / processing latency / producer send latency
错误：send failure / rollback / DLQ / expired
饱和：queue size / memory / store / temp / consumer utilization
```

Queue Size 高不一定故障。要同时看消息年龄、到达率、完成率和业务 SLO。

## 在 AIOps 中的作用

### 告警事件队列

```text
Prometheus / Zabbix / 日志告警
  -> 标准化 Event
  -> AIOPS.ALERTS
  -> 去重消费者
  -> 关联消费者
  -> 工单 / 通知 / Runbook
```

每个消费者使用自己的 Queue，或通过 Topic + Durable Subscription 获取副本。不要让短信和工单消费者竞争同一个 Queue，否则一条消息只会被其中一个业务拿走。

### 自动化任务

消息包含：

```json
{
  "taskId": "task-20260730-001",
  "runbook": "restart-service",
  "target": "order-api-3",
  "riskLevel": "L2",
  "approvedBy": "change-1234"
}
```

Broker 只负责传递。执行器还要校验审批、权限、目标、幂等、超时、回滚和审计。

### 变更关联

把 Producer、Destination、Message ID、服务、Commit、部署批次和 Trace ID 写入结构化日志，才能把消息积压与某次发布关联。

## 基础实验：发送、浏览和消费持久消息

### 实验目标

启动 Classic 6.3.0，向 `AIOPS.ALERTS` 发送五条 Persistent 消息，先 Browse 不消费，再由 Consumer 处理。

### 第一步：确认状态

```powershell
.\bin\activemq.bat status
.\bin\activemq.bat dstat
```

### 第二步：发送

```powershell
.\bin\activemq.bat producer `
  --destination queue://AIOPS.ALERTS `
  --messageCount 5 `
  --persistent true `
  --message "service=order-api,severity=critical"
```

预期 Producer 完成发送，`dstat` 中 Queue 的 Enqueue 和 Size 增加。

### 第三步：浏览

```powershell
.\bin\activemq.bat browse queue:AIOPS.ALERTS
```

Browse 不应减少 Queue Size。保存 Message ID、Persistent 标志和正文。

### 第四步：消费

```powershell
.\bin\activemq.bat consumer `
  --destination queue://AIOPS.ALERTS `
  --messageCount 5
```

预期 Consumer 收到五条消息，Queue Size 回落，Dequeue Count 增加。

### 验证

- `dstat` 能看到 Enqueue/Dequeue 变化。
- Web Console 中 Queue 存在。
- Browse 不消费。
- Consumer 后 Queue Size 回到预期。
- `data/activemq.log` 没有 Store 或权限错误。

### 如果没有成功

1. `JAVA_HOME` 与 `java -version`。
2. 61616、8161 是否冲突。
3. Broker 是否真正启动。
4. CLI 连接 URL、账号和协议。
5. Destination 是否拼写一致。
6. Producer 是否因 Flow Control 阻塞。
7. 日志是否有 KahaDB 锁或权限错误。

## 故障注入实验：Broker 重启后恢复持久消息

### 实验目标

在不消费的情况下发送持久消息，停止 Broker，重新启动后验证 KahaDB 恢复消息。

### 实验边界

只操作刚下载的本地实验实例。不要对生产 Broker 执行本节停机命令。

### 第一步：清空测试 Queue

先确认 `AIOPS.RECOVERY` 是实验专用 Queue。若里面有旧消息，通过实验 Consumer 消费干净，不使用管理页批量删除未知消息。

### 第二步：发送并建立基线

```powershell
.\bin\activemq.bat producer `
  --destination queue://AIOPS.RECOVERY `
  --messageCount 10 `
  --persistent true `
  --message "recovery-test"

.\bin\activemq.bat browse queue:AIOPS.RECOVERY
.\bin\activemq.bat dstat
```

记录 Queue Size、Enqueue Count 和 Message ID。

### 第三步：停止 Broker

```powershell
.\bin\activemq.bat stop
.\bin\activemq.bat status
```

确认进程已停止。保存停止前后日志，不删除 `data/`。

### 第四步：重新启动

```powershell
.\bin\activemq.bat start
Start-Sleep -Seconds 10
.\bin\activemq.bat status
.\bin\activemq.bat browse queue:AIOPS.RECOVERY
```

预期十条 Persistent 消息仍可浏览。启动日志应包含 KahaDB 打开和恢复信息，而不是新建空 Store。

### 第五步：消费与验证

```powershell
.\bin\activemq.bat consumer `
  --destination queue://AIOPS.RECOVERY `
  --messageCount 10

.\bin\activemq.bat dstat
```

### 形成证据链

```text
现象：Broker 进程被停止。
证据：停止前 Queue 有 10 条 Persistent 消息。
假设：KahaDB 会在重启后恢复未确认消息。
验证：重启后 Browse 仍显示 10 条，Message ID 可对照。
修复：Broker 启动并恢复服务。
清理：消费实验消息，停止实验实例。
```

### 如果消息没有恢复

- Producer 是否真的使用 Persistent Delivery Mode。
- `persistent="true"` 是否生效。
- 重启前后是否使用同一个 ActiveMQ Base 和 `data/`。
- Store 是否报锁、权限、磁盘或损坏错误。
- 是否意外执行了清理数据目录的命令。
- Message 是否过期。

### 清理

```powershell
.\bin\activemq.bat stop
Set-Location ..
```

保留 `data/` 作为学习证据，或在确认路径只属于本实验后手工归档/删除。不要复制生产 KahaDB 目录到正在运行的 Broker。

## 常见故障排查

### Broker 启动失败

检查 Java 版本、端口、XML、KahaDB Lock、目录权限、磁盘和 JVM Heap。先看日志中第一个根因，不要只看最后的“Broker stopped”。

### Producer Send 变慢或阻塞

看 Memory/Store/Temp Percent Usage、Flow Control、磁盘延迟、连接和网络。Producer 被反压是保护机制，不应简单关闭。

### Queue Size 持续增长

计算：

```text
积压增长速度 = Enqueue Rate - Dequeue Rate
清空时间 ≈ Queue Size / (Dequeue Rate - Enqueue Rate)
```

再看 Consumer Count、处理时长、错误、下游依赖、Prefetch、选择器和消息大小。

### Queue Size 不高但内存很高

消息可能在 Consumer Prefetch/Inflight、Topic Subscription、Cursor 或大消息中。查看 Inflight、Subscription、Temp Store 和 Heap。

### 消息重复

检查 Consumer 是否在业务提交后 Ack、连接是否在 Ack 前断开、事务是否回滚、Broker 是否 Failover、Producer 是否因超时重试。用业务幂等键解决，不能假设 Message ID 覆盖全部重发路径。

### 消息“丢失”

沿链路查：

1. Producer 是否生成并记录业务 ID。
2. Send 是否成功、是否超时不确定。
3. Destination 名和协议映射是否正确。
4. 消息是否 Non-Persistent、Expired 或被 Selector 排除。
5. 是否被 Consumer 取走但未产生业务结果。
6. 是否进入 DLQ。
7. Broker 是否重启、Store 是否恢复。

### DLQ 持续增长

按异常类型和代码版本聚类，区分永久格式错误、依赖临时失败和消费者 Bug。先修消费者或数据，再有审批地重放，避免 DLQ 与主 Queue 来回循环。

### KahaDB 磁盘增长

检查 Queue/Topic 积压、Durable Subscription、慢 Consumer、DLQ、Journal Cleanup、Store 使用和磁盘延迟。不要直接删除 Journal 文件。

### Network Bridge 断开

看 Bridge MBean、连接日志、TLS、DNS、端口、Duplex 和协议。桥恢复后还要验证消息路由方向和重复。

### Consumer 很多但吞吐不升

瓶颈可能在下游数据库、单消息锁、单一有序组、Broker Store、网络或 CPU。增加 Consumer 可能放大数据库压力和重复。

## 容量与性能

容量设计至少回答：

- 平均与峰值 Message Rate。
- 平均、p95、最大消息大小。
- Persistent 与 Non-Persistent 比例。
- Queue/Topic、Durable Subscription 数量。
- Consumer 处理时长、并发和 Prefetch。
- 允许积压多久，磁盘需要多大。
- KahaDB/Journal 延迟和吞吐。
- Broker Heap、Memory/Store/Temp 上限。
- 连接、Session、Producer、Consumer 和文件句柄。
- DLQ、过期消息和审计日志保留期。

简单估算：

```text
积压磁盘 ≈ 积压消息数 × 平均持久化大小 × 索引/日志放大系数
在途消息 ≈ 到达速率 × 平均处理时长
```

实际还要压测协议、确认、事务、消息大小、磁盘和 GC。

### 大消息

Broker 不是对象存储。大消息会占用网络、Heap、Store 和 Consumer 反序列化内存。常见做法是对象放受控存储，消息只传 URI、校验、权限和元数据；仍要解决对象生命周期和一致性。

## 安全

- 删除默认账号或修改默认密码。
- Broker 用户、Web Console、JMX 和操作系统账号分离。
- 按 Destination 配置最小读、写、管理权限。
- 客户端 Connector 使用 TLS，并校验证书和主机名。
- Web Console 不暴露公网，使用反向代理、MFA/SSO 能力和网络限制。
- JMX 仅在管理网开放，启用认证和 TLS。
- 只开启业务需要的协议。
- 限制连接数、帧大小、消息大小和反序列化类型。
- Java ObjectMessage 有反序列化风险，优先 JSON/Avro/Protobuf 等明确 Schema，并遵循官方可信包安全指南。
- Secret 不写入 XML、脚本、日志或 Git。
- 记录配置、用户、权限、Destination Policy 和插件变更。

## 高可用

### Classic

Classic 的高可用要按目标版本选择官方支持方案，例如共享 Store/JDBC 锁定的主备等。Network of Brokers 主要用于消息网络与路由，不自动提供每条消息的同步副本语义。

共享存储方案的 Broker 进程可以切换，但共享存储本身必须高可用；否则只是把单点下移。

Classic 默认推荐的本地持久化是 KahaDB。KahaDB Replication 目前仍处于审核中且不受支持，Replicated LevelDB 已弃用并不受支持，不能把它们作为新生产方案。选择共享文件系统或共享 JDBC 数据库加锁时，还要单独验证共享存储、锁、隔离与恢复。

### Artemis

Artemis 当前术语是 Primary/Backup（旧文档常写 Live/Backup）：

- Shared Store：Primary 与 Backup 共享持久化存储。
- Replication：Primary 通过网络把 Journal 状态复制给 Backup。

Artemis 默认持久化使用文件 Journal，也可配置 JDBC Store。HA 还要设计 Quorum、Split Brain 防护、客户端 Failover、Topology 更新和故障域。两个 Broker 启动成功不等于 HA 已验证，必须做网络、进程、磁盘和脑裂演练。

### 跨站点灾备

同步 HA、异步消息转发和灾备复制目标不同。跨地域网络延迟和分区会影响确认与恢复。要明确定义 RPO、RTO、双写/单写、切换审批和回切。

## 升级、回滚与迁移

### Classic 5.x 到 6.x

重点不是只换 JAR：

- Java 版本。
- `javax.jms.*` 与 `jakarta.jms.*`。
- Spring、Jetty、Log4j 和客户端依赖。
- Broker XML Schema 和默认值。
- 插件、认证、Web Console 和 JMX。
- Store 兼容与升级路径。
- 客户端 Failover 和协议互操作。

### Classic 版本升级

1. 阅读目标系列 Release Notes 和安全公告。
2. 备份配置并按官方支持方式备份 Store。
3. 在生产消息副本或可重放数据上演练启动和恢复。
4. 检查 Java、客户端和协议兼容。
5. 先升级备用或隔离节点，验证消息收发、Ack、DLQ、JMX 和 Console。
6. 观察 Queue、Store、GC 和错误后继续。

Classic 6.3.0 是 6.3 系列首版，包含 Spring 7、Jetty 12 与 JDK 25 支持等平台变化。把 6.2.8 升到 6.3.0 当作普通补丁替换，会漏掉框架、控制台、插件和客户端兼容风险。

### Artemis 版本升级

升级前备份 Broker Instance，并逐个阅读跨越版本的 Version History。官方升级工具会保留 `broker.xml` 与数据，但刷新启动脚本和 Profile；自定义脚本内容通常需要人工重新合并：

```bash
cd "$NEW_ARTEMIS_HOME/bin"
./artemis upgrade /path/to/broker-instance
```

工具执行成功不等于业务升级完成，还要验证客户端重连、Address/Queue、持久消息、Paging、DLQ、HA 切换、指标和回滚恢复点。

### Classic 到 Artemis

这是迁移项目，不是原地小升级：

```text
客户端 API / 协议
  -> Destination 命名和语义
  -> Queue / Topic 到 Address / Routing Type
  -> Ack / Redelivery / DLQ
  -> 事务和 Selector
  -> 安全、监控、HA
  -> 存量消息迁移或排空
```

JMS 客户端能连接不代表所有 Broker 行为一致。采用双写、桥接、排空或离线迁移前要设计去重、顺序和回滚。

### 回滚

回滚要回答：

- 新 Broker 是否写入旧版无法读取的 Store。
- 客户端是否已升级到新 API。
- 消息是否在新旧集群之间移动。
- 回滚是否造成重复投递。
- DLQ、定时消息和 Durable Subscription 如何处理。

仅把二进制目录换回旧版不是完整回滚。

## 选型取舍

| 场景 | 更可能选择 | 说明 |
|---|---|---|
| 存量 ActiveMQ Classic、JMS 和成熟运维体系 | ActiveMQ Classic | 优先稳定升级和治理 |
| 新建高性能、多协议、需要 Artemis HA 模型 | Apache Artemis | 评估 Address、Journal、HA 和客户端迁移 |
| 复杂路由、成熟 AMQP 生态 | RabbitMQ | Exchange/Binding 与 Quorum Queue 模型不同 |
| 大规模持久事件流、回放和流处理 | Kafka | Partition Log 与 Consumer Offset 模型不同 |
| 轻量任务队列、已有 Redis | Redis Streams 等 | 可靠性、持久化和治理能力不同 |

不能只用单机吞吐 Benchmark 选 Broker。还要比较语义、客户端、运维经验、故障模式、升级、跨站点、可观测和许可。

## 事故场景：Broker 存活，但告警队列越积越多

### 现象

- Broker 进程和 61616 端口正常。
- `AIOPS.ALERTS` Queue Size 30 分钟从 2 万升到 80 万。
- Consumer Count 没变。
- Store Percent Usage 从 40% 升到 78%。
- 20 分钟前消费者发布了新版本。

### 证据顺序

1. 看 Enqueue/Dequeue Rate 和最老消息年龄。
2. 看 Consumer Count、Inflight、Prefetch 和 Ack。
3. 对比每个消费者处理时长、异常和下游数据库。
4. 查新旧版本、配置和发布批次。
5. 看 DLQ、Redelivery、Expired 和消息大小。
6. 看 Broker Heap、GC、Store、磁盘和 Flow Control。

### 假设

- 新消费者在外部 API 变慢后处理速度下降。
- 消费成功但 Ack 未提交，Inflight 堆积。
- 毒消息快速重投，占满处理线程。
- Broker Store 变慢导致 Dispatch 和 Ack 持久化延迟。

### 验证

若 Consumer 日志显示下游数据库连接池耗尽、平均处理从 80ms 升到 3s，Broker Dequeue 同步下降而 Store 磁盘仍正常，根因更可能在消费者依赖而不是 Broker。

### 处置

- 暂停非必要 Producer 或做上游限流。
- 回滚消费者新版本，保留幂等。
- 隔离毒消息到 DLQ。
- 按下游容量增加 Consumer，而不是盲目扩到十倍。
- 监控净清空速率和预计恢复时间。

### 爆炸半径与回滚

批量扩 Consumer 可能压垮数据库；清 Queue 会永久丢业务；关闭 Flow Control 可能写满磁盘。所有缓解动作先评估上游、Broker、下游和数据恢复。

### 复盘

新增消息年龄 SLO、消费者处理时长、下游连接池、DLQ 分类、积压预测和发布前压测门禁。

## 生产系统设计题

题目：为告警、工单和自动化任务设计 ActiveMQ 平台，要求单节点维护不中断、重要消息可恢复、毒消息隔离、跨机房有灾备。

回答主线：

1. 明确 Queue/Topic、消息大小、峰值、顺序、保留期、RPO/RTO。
2. 决定 Classic 还是 Artemis，并说明存量兼容和团队能力。
3. 重要消息 Persistent，Producer 有界确认和幂等业务 ID。
4. Consumer 业务提交后 Ack，Inbox 去重，重试分级，DLQ 有 Owner。
5. 按官方支持架构做主备/复制，节点跨故障域。
6. 存储低延迟、有容量余量并纳入备份与恢复演练。
7. TLS、RBAC、管理网、Secret 和协议最小化。
8. 监控消息年龄、Queue Size、速率、Inflight、DLQ、Store、GC 和 Bridge。
9. 升级先备用节点/新集群，金丝雀验证发送、消费、Failover 和 Store。
10. 跨机房明确异步 DR、切换审批、重复消息和回切。

## 面试怎么讲

### 30 秒版本

ActiveMQ Classic 与 Apache Artemis 是两个独立 Apache 顶级项目，但有历史关系和常见迁移需求。Producer 把消息通过 OpenWire、AMQP 等协议发给 Broker，Broker 按 Queue/Topic 或 Address/Queue 路由；持久消息进入 Store，Consumer 业务处理后 Ack。生产可靠性要同时设计 Producer 确认、持久化、Consumer 幂等、重投、DLQ 和 HA。

### 3 分钟版本

我会先区分 JMS 只是 Java API 规范，Classic 与 Artemis 是不同 Broker 内核。Classic 常用 Destination、KahaDB、Prefetch、Destination Policy 和 Network Connector；Artemis 使用 Address、Queue、Anycast/Multicast、Journal、Paging 和 Primary/Backup。

消息可靠性不是一个 Persistent 开关。Producer 超时可能结果不确定，Consumer 在业务提交后 Ack 又可能因为 Ack 丢失而重投，所以端到端通常采用至少一次加业务幂等。排障时我会把 Enqueue/Dequeue、消息年龄、Inflight、DLQ、Memory/Store/Temp、KahaDB、Consumer 下游和变更时间线串起来。升级特别关注 `javax` 到 `jakarta`，Classic 到 Artemis 则按迁移项目处理。

## 面试题与递进追问

### 1. ActiveMQ 与 JMS 有什么区别？

参考答案：JMS 是 Java 消息 API 规范，ActiveMQ 是实现消息存储、路由和协议的 Broker。应用可以用 JMS API，通过具体协议连接 Broker。

继续追问：

- OpenWire 与 AMQP 是什么？
- `javax.jms` 与 `jakarta.jms` 有什么升级影响？
- 非 Java 客户端怎么连接？

### 2. Queue 与 Topic 有什么区别？

参考答案：Queue 中一条消息通常由一个竞争消费者处理；Topic 把消息发布给多个订阅。离线接收需要 Durable Subscription 等状态。

继续追问：

- 三个业务都要收到消息该怎么设计？
- Durable Subscription 为什么会积压？
- 顺序在多消费者下如何变化？

### 3. 如何保证消息不丢？

参考答案：重要消息用 Persistent，Broker Store 可靠，Producer 等待明确确认，Consumer 业务提交后 Ack，并做 HA、备份和故障演练。

继续追问：

- Producer 超时后怎么办？
- Broker Ack 与磁盘持久化是什么关系？
- 复制为什么不能替代备份？

### 4. 为什么会重复消费？

参考答案：业务已提交但 Ack 未到 Broker、Consumer 崩溃、事务回滚、Failover 或 Producer 重试都可能导致重复。用业务幂等键和 Inbox 去重。

继续追问：

- Message ID 能否直接当业务幂等键？
- 外部 API 如何幂等？
- DLQ 重放如何避免重复？

### 5. Prefetch 怎么设置？

参考答案：Prefetch 在吞吐、公平性、内存和故障重投之间权衡。任务慢或消息大时要小，短小同质消息可适当增大，并通过 Inflight 和处理时长压测。

继续追问：

- Queue Size 低为什么仍有大量未处理？
- Prefetch 为 1 的代价是什么？
- 多消费者顺序如何保证？

### 6. Network of Brokers 与 HA 有什么区别？

参考答案：Network Connector 主要传播消费者需求和转发消息；HA 关注一个 Broker 故障后其持久状态如何继续服务。桥接不等于同步副本。

继续追问：

- 消息转发后源 Broker 还保留吗？
- 如何防止网络环路？
- 跨机房如何定义 RPO？

### 7. Classic 与 Artemis 怎么选？

参考答案：存量系统优先考虑 Classic 兼容和稳定升级；新系统可评估 Artemis 的性能、协议、Address 模型和 HA。迁移要验证语义、配置、Store、客户端和运维，不是直接换进程。

继续追问：

- Queue/Topic 如何映射 Address/Routing Type？
- 存量消息如何处理？
- 如何设计回滚和去重？

## 学习检查清单

- [ ] 我能区分 ActiveMQ Classic、Artemis、JMS 和传输协议。
- [ ] 我能解释 Queue、Topic、Durable Subscription。
- [ ] 我能画出 Producer、Broker、Store、Consumer 和 Ack 路径。
- [ ] 我能解释 Persistent 不等于端到端绝不丢。
- [ ] 我能说明 Ack、事务、重投、DLQ 和幂等。
- [ ] 我能启动 Classic 6.3.0 并完成收发实验。
- [ ] 我能验证 Broker 重启后的持久消息恢复。
- [ ] 我能监控消息年龄、速率、Inflight、Store 和 DLQ。
- [ ] 我能区分 Network of Brokers、Cluster 与 HA。
- [ ] 我能设计安全、容量、升级、迁移和回滚。
- [ ] 我能回答事故题和生产系统设计题。

## 学习证据

```text
activemq-aiops-lab/
  README.md
  checksums/
    apache-activemq-6.3.0-bin.zip.sha512
  config/
    activemq.xml
    users.properties.example
    groups.properties.example
  evidence/
    version.txt
    sha512-verified.txt
    queue-before.txt
    broker-stop.log
    recovery-browse.txt
    queue-after.txt
    jmx-dashboard.png
  notes/
    classic-vs-artemis.md
    delivery-semantics.md
    capacity-plan.md
    upgrade-migration.md
    incident-review.md
```

示例配置不能包含真实密码。README 记录 Java、Broker 版本、下载校验、预期与实际输出、故障时间线、数据目录和清理过程。

本文边界是从零到生产运维和面试主线，没有穷尽 Classic/Artemis 的全部协议、插件、Store、客户端、Selector、XA、调度、Mirror、Federation、Cluster 和 HA 拓扑。深入时继续阅读目标版本 Classic 或 Artemis 官方文档和 Release Notes。

读完本文也不等于自动具备消息平台岗位能力。还需要训练 Java/JMS、网络、Linux/JVM、存储、事务、容量压测、应用幂等和真实事故沟通。
