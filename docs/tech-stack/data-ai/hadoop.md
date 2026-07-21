# Apache Hadoop 深讲

> 学习目标：让零基础读者从 Hadoop 3.5.0 单机实验开始，理解 HDFS、YARN、MapReduce 和 Hadoop Common 的职责，能画出文件读写与作业执行的数据路径，能完成 WordCount、观察指标、注入 DataNode 故障，并能在面试中讨论高可用、容量、安全、升级回滚和生产事故。

## 官方资料

- [Apache Hadoop 官网](https://hadoop.apache.org/)
- [Apache Hadoop 3.5.0 文档总览](https://hadoop.apache.org/docs/current/)
- [Apache Hadoop 发布与校验](https://hadoop.apache.org/releases.html)
- [单节点安装](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-common/SingleCluster.html)
- [集群安装](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-common/ClusterSetup.html)
- [HDFS 架构](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html)
- [HDFS 用户指南](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs/HdfsUserGuide.html)
- [HDFS 命令参考](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs/HDFSCommands.html)
- [HDFS QJM 高可用](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs/HDFSHighAvailabilityWithQJM.html)
- [HDFS Federation](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs/Federation.html)
- [HDFS Router-based Federation](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs-rbf/HDFSRouterFederation.html)
- [HDFS Erasure Coding](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs/HDFSErasureCoding.html)
- [YARN 架构](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html)
- [YARN ResourceManager 高可用](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/ResourceManagerHA.html)
- [YARN CapacityScheduler](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/CapacityScheduler.html)
- [MapReduce 教程](https://hadoop.apache.org/docs/current/hadoop-mapreduce-client/hadoop-mapreduce-client-core/MapReduceTutorial.html)
- [Hadoop 安全模式](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-common/SecureMode.html)
- [Hadoop Metrics2](https://hadoop.apache.org/docs/current/api/org/apache/hadoop/metrics2/package-summary.html)
- [DistCp](https://hadoop.apache.org/docs/current/hadoop-distcp/DistCp.html)

说明：本文基于 Apache 官方文档重新组织，不复制官方全文。本文更新时当前稳定文档为 Hadoop `3.5.0`。该版本服务端要求 Java 17，客户端支持 Java 17 和 Java 21。真实环境必须先执行 `hadoop version`、`java -version`，再阅读对应版本的 release notes、兼容性说明和发行版厂商文档。

## 官方知识地图

Apache Hadoop 不是一个单独的存储程序。官方文档可以先拆成四个核心项目和一组运维能力：

```text
Hadoop Common
  -> 配置、RPC、序列化、FileSystem API、脚本和通用库

HDFS
  -> NameNode 元数据
  -> DataNode 数据块
  -> 副本、机架感知、快照、HA、Federation、EC

YARN
  -> ResourceManager 全局资源管理
  -> NodeManager 节点执行
  -> ApplicationMaster 单应用协调
  -> Container 资源分配单元

MapReduce
  -> InputSplit / RecordReader
  -> Map
  -> Partition / Shuffle / Sort
  -> Reduce / OutputCommitter

生产运维
  -> Kerberos / ACL / 加密 / 审计
  -> Metrics2 / JMX / 日志 / Web UI
  -> HA / 容量 / Decommission / Balancer
  -> Upgrade / Rollback / DistCp / 灾备
```

本文按下面的顺序学习：

```text
先分清 Hadoop 核心与生态
  -> 看懂 HDFS 文件读写
  -> 看懂 YARN 作业生命周期
  -> 看懂 MapReduce shuffle
  -> 跑通单机实验
  -> 注入并恢复 DataNode 故障
  -> 进入 HA、容量、安全和升级
  -> 用证据回答系统设计与事故题
```

## 学习边界与面试目标

基础层要做到：

- 知道 Hadoop Common、HDFS、YARN、MapReduce 分别做什么。
- 能区分 NameNode、DataNode、ResourceManager、NodeManager、ApplicationMaster 和 Container。
- 能用 HDFS Shell 上传、读取、检查和删除实验数据。
- 能提交一个 MapReduce 作业并从 YARN、日志和输出验证结果。
- 能解释 block、副本、heartbeat、block report、safemode、queue 和 shuffle。

大厂面试层还要做到：

- 画出 HDFS 一次写入、一次读取和一次故障恢复的数据路径。
- 解释 FSImage、EditLog、checkpoint、QJM、ZKFC 和 fencing 的关系。
- 说明 YARN 资源申请、调度、Container 启动和失败重试过程。
- 分析小文件、NameNode GC、磁盘不均、shuffle 倾斜、队列拥塞和节点丢失。
- 给出 HDFS HA、ResourceManager HA、跨集群复制、容量和安全方案。
- 制定扩缩容、滚动升级、回滚、配置变更和故障演练步骤。
- 用指标、日志、Web UI、`fsck`、JMX、审计日志和作业 counters 形成证据链。

本文不会把 Hive、HBase、Spark、Flink、Ozone、Ranger、Atlas 或发行版管理平台全部展开。它们是 Hadoop 生态或相邻平台，不是 Hadoop Core 的同义词。本文把 Hadoop 核心讲到可实践、可排障、可应对连续追问，再由对应独立技术栈继续深入。

## 场景开场

每天凌晨，几百台服务器会产生数 TB 日志。单机磁盘放不下，直接把文件复制到多台机器又不知道哪份最新；分析任务一启动，CPU、内存、磁盘和网络还会互相争抢。

更麻烦的是，机器故障并不是偶发事件。集群规模变大后，总会有磁盘坏、进程挂、网络抖动或任务失败。

Hadoop 要解决的核心问题是：把大数据分散保存、把计算靠近数据安排，并在普通机器会失败的前提下继续完成批处理任务。

## 一句话人话版

Hadoop = 用 HDFS 把大文件分块存到多台机器，用 YARN 分配集群资源，再让 MapReduce 等计算框架并行处理这些数据。

## 小白可能会问

### Hadoop 就是 HDFS 吗

不是。HDFS 是分布式文件系统；YARN 管计算资源；MapReduce 是一种批处理计算框架；Common 提供共同依赖。只部署 HDFS 也可以作为独立分布式存储使用。

### Hadoop 过时了吗

把所有大数据计算都写成 MapReduce 已经不是唯一选择，但 HDFS、YARN、FileSystem API、数据本地性和 Hadoop 生态仍存在于大量平台。学习重点不是背旧命令，而是理解分布式存储、资源调度、批处理和生产运维的机制。

### Spark 会替代 Hadoop 吗

Spark 是计算引擎，不等于 HDFS 或 YARN。Spark 可以读取 HDFS，也可以运行在 YARN 上。现代架构也可能使用 Kubernetes 和对象存储。选择取决于存储、计算、延迟、成本、生态和运维能力。

### NameNode 会保存所有文件内容吗

不会。NameNode 主要保存目录、权限、文件到 block 的映射等元数据；真正的 block 数据由 DataNode 保存。客户端拿到位置后直接和 DataNode 传输数据。

### 副本数是 3 就绝对不会丢数据吗

不是。副本只能抵抗一定数量且故障域分散的失败。错误机架拓扑、同时损坏、误删除、凭据泄露、软件缺陷和灾难站点故障仍需要快照、备份、异地复制和恢复演练。

## 为什么要学

Hadoop 把很多 AIOps 基础问题集中在一起：

- 日志和指标历史数据需要大规模存储与离线分析。
- 训练数据、特征、模型输入输出需要可追踪的数据路径。
- 批量作业需要资源隔离、队列治理、失败重试和容量规划。
- 集群故障需要指标、日志、审计、拓扑和作业状态联合分析。
- 自动化扩容、坏盘处置、队列调节和故障恢复需要可靠 runbook。

即使最终使用的是云对象存储、Spark 或 Kubernetes，Hadoop 的数据块、副本、元数据、调度、数据本地性和 shuffle 仍是理解分布式数据平台的重要底座。

## Hadoop 是什么

Apache Hadoop 是面向大规模数据集的开源分布式存储与计算框架。它强调横向扩展，也就是通过增加机器扩展容量和吞吐，而不是只购买更大的单机。

它的设计前提不是“硬件永不故障”，而是“故障会发生，软件要检测并恢复”。这决定了 heartbeat、block report、副本、任务重试和高可用机制的重要性。

Hadoop 更擅长高吞吐、大文件、顺序读写和批处理，不以极低延迟随机访问为首要目标。在线事务、海量小文件、毫秒级查询或频繁原地修改通常需要其他系统配合。

## 它解决什么问题

| 问题 | Hadoop 的处理方式 | 取舍 |
|---|---|---|
| 单机磁盘放不下 | HDFS 把文件切成 block 分布到 DataNode | 元数据集中管理，小文件成本高 |
| 机器可能故障 | block 副本、校验和、heartbeat、重建 | 占用额外磁盘和网络 |
| 计算规模大 | YARN 在节点间分配资源 Container | 调度与资源配置更复杂 |
| 数据移动昂贵 | 尽量让计算靠近数据副本 | 受队列、负载和拓扑约束 |
| 批处理失败 | 框架重新执行失败 task | 重试可能放大下游压力 |
| 多租户争抢 | 队列、容量、ACL、资源限制 | 需要持续治理和容量预测 |

## Hadoop 核心与生态边界

| 名称 | 属于 Hadoop Core | 主要职责 |
|---|---:|---|
| Hadoop Common | 是 | 通用配置、RPC、文件系统抽象、脚本和库 |
| HDFS | 是 | 分布式文件存储 |
| YARN | 是 | 集群资源管理和应用调度 |
| MapReduce | 是 | 面向批处理的 map/shuffle/reduce 计算模型 |
| Hive | 否 | 把 SQL 转成底层计算任务，管理表和元数据 |
| HBase | 否 | 基于 HDFS 的分布式列族数据库 |
| Spark | 否 | 通用分布式计算引擎，可使用 HDFS/YARN |
| Flink | 否 | 流批处理引擎，可接 Hadoop 存储与生态 |
| ZooKeeper | 否 | 分布式协调，HDFS/YARN HA 可依赖它 |
| Ozone | Hadoop 子项目 | 面向对象存储语义的分布式存储系统 |

## 总体架构和数据流

```text
客户端
  -> Hadoop FileSystem API / HDFS Shell
  -> NameNode 查询元数据
  -> DataNode 直接传输 block

作业客户端
  -> ResourceManager 提交 application
  -> NodeManager 启动 ApplicationMaster
  -> ApplicationMaster 申请 Container
  -> NodeManager 启动 map / reduce task
  -> task 从 HDFS 读取输入并向 HDFS 写结果
  -> JobHistory Server 保存已完成作业历史
```

控制面与数据面要分开理解：

- NameNode 和 ResourceManager 主要做控制决策。
- DataNode 和任务 Container 承担主要数据传输与计算。
- 文件内容不经过 NameNode，任务数据也不经过 ResourceManager。

## HDFS 核心原理

### NameNode

是什么：HDFS 的元数据管理者，维护目录树、权限、配额、文件与 block 的关系，以及 block 所在 DataNode 信息。

为什么需要：客户端必须有一个权威入口判断文件是否存在、谁能访问、要读哪些 block、应该向哪些 DataNode 写入。

怎么工作：namespace 元数据主要保存在内存中以获得低延迟；持久状态由 FSImage 与 EditLog 表达，启动时加载并重放；DataNode 通过 heartbeat 和 block report 汇报状态。

怎么看：使用 NameNode Web UI、`hdfs dfsadmin -report`、JMX、NameNode 日志、`hdfs fsck` 和 HA 状态命令。

坏了怎么查：先判断进程、RPC、GC、磁盘和 HA 状态，再看 safemode、JournalNode quorum、FSImage/EditLog、block report 和客户端 failover 日志。

### DataNode

是什么：保存 HDFS block 并响应客户端读写的数据节点。

为什么需要：把容量和吞吐横向分散到多台机器，并通过副本抵抗节点或磁盘故障。

怎么工作：DataNode 把 block 和校验数据保存到本地卷，向 NameNode发送 heartbeat 与 block report，并按 NameNode 指令创建、删除、复制或移动 block。

怎么看：使用 DataNode Web UI、`hdfs dfsadmin -report`、volume failure 指标、磁盘 SMART、系统 IO 指标和 DataNode 日志。

坏了怎么查：区分进程死亡、整机失联、单盘故障、磁盘满、慢盘、网络丢包、checksum error 和版本不匹配。

### Block 与副本

是什么：HDFS 把文件切成较大的 block；每个 block 可以保存多个副本。

为什么需要：block 让文件能跨机器分布，副本让读取能从其他节点继续并支持故障恢复。

怎么工作：NameNode选择目标 DataNode，默认副本策略结合客户端位置、节点负载和机架拓扑；节点失联后，NameNode 将缺副本 block 安排到健康节点重建。

怎么看：`hdfs fsck <path> -files -blocks -locations` 可以查看 block、副本和位置；`hdfs dfs -stat '%r %o %n' <path>` 可观察副本数、block size 和文件名。

坏了怎么查：检查 missing、corrupt、under-replicated、pending replication、机架映射、可用空间、传输带宽和 DataNode 日志。

### HDFS 一次写入的数据路径

假设客户端写入一个超过一个 block 的文件，副本数为 3：

```text
1. Client -> NameNode: 创建文件，请求第一个 block
2. NameNode -> Client: 返回 DN1、DN2、DN3 pipeline
3. Client -> DN1: 发送 packet
4. DN1 -> DN2 -> DN3: 沿 pipeline 转发 packet
5. DN3 -> DN2 -> DN1 -> Client: 逐级返回 ACK
6. block 写满后，Client 再向 NameNode 申请下一个 block
7. close 时，NameNode 完成文件元数据状态
```

`packet` 是客户端传输的数据分片，ACK 是 acknowledgement，表示下游已经确认。写入失败时 pipeline 可以剔除故障节点并继续，但是否成功还取决于最小副本、超时和剩余节点。

面试追问不能只答“写三份”。要说明 NameNode 只参与元数据和目标选择，数据沿 DataNode pipeline 传输，ACK 反向返回。

### HDFS 一次读取的数据路径

```text
1. Client -> NameNode: 查询文件 block 位置
2. NameNode -> Client: 返回每个 block 的副本列表
3. Client: 按网络拓扑优先选择较近副本
4. Client -> DataNode: 直接读取 block 并验证 checksum
5. 副本失败: 切换其他副本，并向 NameNode 报告坏副本
6. 读完当前 block: 继续选择下一个 block 的 DataNode
```

读取慢要分别检查 NameNode 元数据 RPC、DataNode 磁盘、网络、客户端位置、短路读、checksum、热点 block 和 JVM GC，不能只看 NameNode CPU。

### FSImage、EditLog 与 Checkpoint

FSImage 是某个时间点的 namespace 持久化镜像；EditLog 记录之后发生的元数据变更。NameNode 启动时加载 FSImage，再重放 EditLog 得到最新状态。

Checkpoint 会把 FSImage 与已完成的 EditLog 合并生成新镜像，控制 edit 重放长度。它不是业务数据备份，也不自动等于 NameNode 热备。

在非 HA 架构中，Secondary NameNode 主要负责 checkpoint。它不是“第二个可以立即接管的 NameNode”。在 HA 架构中，Standby NameNode 会执行 checkpoint，不应再部署 Secondary NameNode。

排查启动慢时，要看 edit 数量、FSImage 大小、磁盘延迟、内存、GC 和日志。不要在没有备份和恢复方案时直接删除元数据文件。

### Heartbeat 与 Block Report

Heartbeat 用于表明 DataNode 存活并携带容量等状态。Block report 用于汇报节点保存的 block 清单。NameNode 根据这些证据维护位置并下发复制、删除等命令。

节点刚启动时，NameNode需要接收 block report 才能逐步确认 block 安全。网络隔离可能导致节点被判断为 dead，即使磁盘上的 block 还在。

### Safemode

Safemode 是 NameNode 的保护状态。启动时 NameNode 等待足够多的 block 达到安全副本条件；在 safemode 中通常不进行 namespace 写入和 block 复制。

```bash
hdfs dfsadmin -safemode get # 查看是否处于安全模式
hdfs dfsadmin -safemode wait # 等待自动退出，适合启动脚本而不是盲目 force leave
```

长期不退出时先检查 live DataNode、block report、missing/under-replicated block、阈值和 NameNode 日志。`-safemode leave` 只是改变状态，不会修复丢失的 block，错误强退可能扩大风险。

### 一致性、写入与删除语义

HDFS 面向 write-once-read-many。一个文件同一时刻只有一个 writer，支持 append，但不适合像数据库那样频繁随机修改文件中间内容。

客户端的 `hflush()` 与 `hsync()` 控制可见性和持久性边界。应用不能把“API 返回”笼统等同于“所有副本已永久落盘”，要结合调用语义和故障模型判断。

删除通常先进入 Trash，是否启用和保留多久由配置决定。Trash 不是备份，管理员删除、跳过 Trash、保留期结束或集群级灾难仍可能造成数据损失。

### Checksum 与损坏恢复

HDFS 为数据保存 checksum。读取发现校验失败时，客户端可以改读其他副本并报告损坏；NameNode 后续安排健康副本复制并处理坏副本。

发现 corrupt block 时先保留 `fsck`、DataNode 日志、SMART、内核日志和故障盘证据，再判断是介质、内存、控制器、网络还是软件问题。不要先批量删除 block pool 文件。

### Rack Awareness

机架感知把物理拓扑告诉 Hadoop。副本放置和任务调度可以据此减少跨机架流量，并避免所有副本落在同一故障域。

机架脚本返回错误、所有节点都映射到 `/default-rack` 或拓扑和真实网络不一致，会让副本数看似正常但无法抵抗机架故障。生产验收必须抽样核对 block location 与真实机架。

### Replication 与 Erasure Coding

三副本读取灵活、恢复简单，但约有 200% 额外存储开销。Erasure Coding，简称 EC，即纠删码，把数据块和校验块组合，在较低存储开销下容忍部分块丢失。

EC 更适合较冷、较大、低频修改的数据；编码、重建和小 IO 会增加 CPU、网络与操作复杂度。需要 `hflush()`、`hsync()` 或高频写入的路径要评估官方限制，不能只因“省空间”全局开启。

## YARN 核心原理

YARN 全称 Yet Another Resource Negotiator。它把“全局资源管理”与“每个应用自己的执行协调”分开。

### ResourceManager

是什么：集群级资源与应用入口，简称 RM。

为什么需要：多个用户和计算框架需要共享 CPU、内存等资源，并遵守队列、优先级和配额。

怎么工作：ApplicationsManager 接收应用并启动第一个 ApplicationMaster；Scheduler 按队列与资源策略分配 Container，但不负责具体 task 的业务重试。

怎么看：使用 RM Web UI、`yarn application -list`、`yarn queue -status`、Scheduler 指标、审计日志和 RM 日志。

坏了怎么查：检查 Active/Standby、ZooKeeper、state store、队列配置、可用资源、NodeManager 心跳、GC 和 scheduler 延迟。

### NodeManager

是什么：每个工作节点上的 YARN agent，简称 NM。

为什么需要：全局调度决定“给谁资源”，节点 agent 才能真正启动、隔离、监视并清理 Container。

怎么工作：NM 向 RM 注册和心跳，按请求本地化资源、启动 Container、采集资源使用与日志并汇报状态。

怎么看：使用 NM Web UI、`yarn node -list -all`、Container 日志、本地目录、cgroup 和节点系统指标。

坏了怎么查：区分 lost、unhealthy、decommissioned，检查磁盘健康、local/log dirs、内存、cgroup、容器执行器、网络与时钟。

### ApplicationMaster

是什么：每个 application 的协调进程，简称 AM。

为什么需要：不同框架有不同 task 模型，RM 不应理解 MapReduce、Spark 等所有内部细节。

怎么工作：AM 向 RM 注册，申请 Container，与 NM 协调 task 启动，跟踪进度和失败，完成后注销。

怎么看：从 application attempt、AM 日志、tracking URL 和 timeline/history 页面观察。

坏了怎么查：检查 AM attempt、队列 AM 资源上限、依赖本地化、凭据、Container exit code、NM 日志和重试次数。

### Container

YARN Container 是资源分配与执行边界，不是 Docker 容器的同义词。它通常描述一定量的内存、vcore 和其他可配置资源，并由 NodeManager 启动进程。

只配置申请值而没有可靠隔离，会出现“账面没超，物理机已经被拖垮”。生产环境要结合 cgroups、LinuxContainerExecutor、节点资源保留和监控验证隔离。

### 一次 YARN 作业提交的数据路径

```text
1. Client -> ResourceManager: 提交 application 与资源描述
2. ResourceManager -> NodeManager: 分配首个 Container
3. NodeManager: 启动 ApplicationMaster
4. ApplicationMaster -> ResourceManager: 注册并申请 task Container
5. ResourceManager Scheduler: 根据队列、资源、局部性分配 Container
6. ApplicationMaster -> NodeManager: 启动 task
7. task: 读取输入、计算、汇报进度并写结果
8. ApplicationMaster: 汇总成功或失败并注销
9. JobHistory / Timeline: 提供完成后的历史证据
```

作业长时间 `ACCEPTED` 往往还没有获得 AM Container。先看队列可用资源、AM resource percent、用户限制、节点标签和资源规格，不要直接重启 ResourceManager。

### Scheduler、Queue 与多租户

Scheduler 负责在约束下分配资源。CapacityScheduler 用层级队列表达组织容量、弹性、用户限制和 ACL。队列的 guaranteed capacity 不等于永远独占；有空闲资源时可以允许弹性使用，maximum capacity 决定上限。

调度设计要回答：

- 哪些生产任务必须有最低保障。
- 谁可以提交和管理队列中的应用。
- 单用户最多占多少。
- AM 最多占多少，避免大量小 application 把队列堵死。
- 是否允许抢占，抢占会怎样影响长任务和重试成本。
- 节点标签或 placement constraints 如何隔离 GPU、SSD 或敏感数据。

## MapReduce 核心原理

MapReduce 把大输入切成多个并行 map task，再按 key 将中间结果分组、传输、排序，最后交给 reduce task 聚合。

### InputSplit 与 RecordReader

InputSplit 是计算切分的逻辑描述，不等于 HDFS block。默认情况下二者常有关联，以利用数据本地性，但文件格式、压缩方式和 InputFormat 会改变切分行为。

RecordReader 把 split 转换为 Mapper 能消费的 key/value 记录。不可切分压缩文件可能让一个巨大文件只产生少量 map task，形成长尾。

### Mapper、Combiner 与 Partitioner

Mapper 处理输入记录并产生中间 key/value。

Combiner 是可选的本地聚合优化，可能执行零次、一次或多次，不能承担必须执行的业务逻辑。只有满足结合律与交换律等条件的操作才适合使用。

Partitioner 决定某个 key 进入哪个 reducer。默认常按 key hash 分区；热点 key 会让一个 reducer 远慢于其他 reducer。

### Shuffle、Sort 与 Reducer

Shuffle 不是一句“网络传输”就能概括。map 输出先在内存缓冲，达到阈值后 spill 到本地磁盘，分区并排序；reduce 端跨节点拉取属于自己的分区，再合并、排序和分组，最后调用 Reducer。

```text
Mapper output buffer
  -> spill file
  -> partition + sort
  -> merge
  -> network fetch
  -> reduce-side merge + sort
  -> group by key
  -> Reducer
  -> OutputFormat / OutputCommitter
```

Shuffle 性能受中间数据量、序列化、压缩、磁盘、网络、并发 fetch、spill 次数、倾斜和 reducer 数影响。排障要用 counters、task 时间线、节点 IO 和网络证据，不要只增大内存。

### OutputCommitter 与推测执行

OutputCommitter 负责把 task attempt 的临时结果安全提交为最终输出。失败 attempt 或推测执行可能产生多个尝试，因此输出逻辑必须避免重复副作用。

Speculative execution，即推测执行，会为明显落后的 task 启动额外 attempt，以先完成者为准。它能缓解偶发慢节点，但不能修复数据倾斜，还会增加资源和外部系统写入风险。

### 失败重试与语义边界

框架可以重新执行失败 task，但“重新执行”不自动等于“业务 exactly-once”。如果 task 向数据库、HTTP API 或消息系统产生外部副作用，必须设计幂等键、事务或去重。

## 安装与启动

### 实验前提

下面实验只用于 WSL2、Linux 虚拟机或独立测试机：

- Ubuntu 24.04 或兼容 GNU/Linux。
- 至少 4 vCPU、8 GB 内存、20 GB 空闲磁盘。
- Java 17。
- Hadoop 3.5.0。
- 端口只绑定在可信实验网络，不暴露到公网。

Windows 原生不是官方生产平台。Windows 用户建议使用 WSL2 或 Linux 虚拟机完成实验。

### 安装 Java、SSH 和 Hadoop

```bash
sudo apt-get update # 更新软件包索引
sudo apt-get install -y openjdk-17-jdk openssh-server rsync curl # 安装 Java 17、SSH、同步和下载工具
java -version # 预期看到 OpenJDK 17

cd /tmp # 在临时目录下载安装包
curl -fLO https://dlcdn.apache.org/hadoop/common/hadoop-3.5.0/hadoop-3.5.0.tar.gz # 下载 Hadoop 3.5.0 二进制包
curl -fLO https://downloads.apache.org/hadoop/common/hadoop-3.5.0/hadoop-3.5.0.tar.gz.sha512 # 下载 SHA-512 校验文件
sha512sum -c hadoop-3.5.0.tar.gz.sha512 # 必须显示 OK，失败时不要解压
sudo tar -xzf hadoop-3.5.0.tar.gz -C /opt # 解压到 /opt
sudo ln -sfn /opt/hadoop-3.5.0 /opt/hadoop # 用稳定软链接便于后续版本切换
sudo chown -R "$USER":"$USER" /opt/hadoop-3.5.0 # 仅实验机让当前用户管理目录
```

若镜像站路径变化，从 Apache 发布页重新选择镜像并验证签名或 SHA-512，不要从不明网盘下载二进制包。

### 配置环境变量

把下面内容加入 `~/.bashrc`：

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 # Java 17 安装目录，其他架构先用 readlink -f 查实际路径
export HADOOP_HOME=/opt/hadoop # Hadoop 稳定软链接
export HADOOP_CONF_DIR=$HADOOP_HOME/etc/hadoop # Hadoop XML 配置目录
export PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin # 让 shell 能找到 hadoop、hdfs、yarn 命令
```

```bash
source ~/.bashrc # 让当前终端重新加载环境变量
hadoop version # 预期首行包含 Hadoop 3.5.0
```

同时修改 `$HADOOP_HOME/etc/hadoop/hadoop-env.sh`：

```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 # daemon 启动时使用的 Java 17
```

## 配置详解

### core-site.xml

```xml
<configuration>
  <!-- 没写 scheme 的路径默认访问这个 HDFS；9000 是本实验 RPC 端口 -->
  <property>
    <name>fs.defaultFS</name>
    <value>hdfs://localhost:9000</value>
  </property>

  <!-- 实验临时目录；生产环境必须使用专用持久化磁盘和明确权限 -->
  <property>
    <name>hadoop.tmp.dir</name>
    <value>/tmp/hadoop-lab</value>
  </property>
</configuration>
```

### hdfs-site.xml

```xml
<configuration>
  <!-- 单机只有一个 DataNode，所以副本只能设为 1；生产不能照抄 -->
  <property>
    <name>dfs.replication</name>
    <value>1</value>
  </property>

  <!-- 实验 NameNode 元数据目录；格式化会写入这里 -->
  <property>
    <name>dfs.namenode.name.dir</name>
    <value>file:///tmp/hadoop-lab/dfs/name</value>
  </property>

  <!-- 实验 DataNode block 目录；生产通常配置多个独立数据卷 -->
  <property>
    <name>dfs.datanode.data.dir</name>
    <value>file:///tmp/hadoop-lab/dfs/data</value>
  </property>

  <!-- 允许 WebHDFS，便于实验观察；生产需配认证、授权和网络边界 -->
  <property>
    <name>dfs.webhdfs.enabled</name>
    <value>true</value>
  </property>
</configuration>
```

### mapred-site.xml

先从模板复制：

```bash
cp "$HADOOP_HOME/etc/hadoop/mapred-site.xml.template" "$HADOOP_HOME/etc/hadoop/mapred-site.xml" 2>/dev/null || true # 某些发行包已直接提供目标文件
```

如果目标文件不存在，就新建为：

```xml
<configuration>
  <!-- 让 MapReduce 任务交给 YARN 调度，而不是本地进程执行 -->
  <property>
    <name>mapreduce.framework.name</name>
    <value>yarn</value>
  </property>
</configuration>
```

### yarn-site.xml

```xml
<configuration>
  <!-- 启用 MapReduce shuffle 服务，让 reducer 能拉取 map 输出 -->
  <property>
    <name>yarn.nodemanager.aux-services</name>
    <value>mapreduce_shuffle</value>
  </property>

  <!-- 单机实验可分配给 YARN 的总内存，必须小于机器实际可用内存 -->
  <property>
    <name>yarn.nodemanager.resource.memory-mb</name>
    <value>4096</value>
  </property>

  <!-- 单个 Container 最小内存步长 -->
  <property>
    <name>yarn.scheduler.minimum-allocation-mb</name>
    <value>512</value>
  </property>

  <!-- 单个 Container 最大内存，不能大于 NodeManager 可管理总内存 -->
  <property>
    <name>yarn.scheduler.maximum-allocation-mb</name>
    <value>4096</value>
  </property>
</configuration>
```

### 核心配置字典

| 配置项 | 作用 | 正常判断 | 常见坑 |
|---|---|---|---|
| `fs.defaultFS` | 默认文件系统 URI | 客户端能解析并连接 NameNode | 写成单机 hostname，其他节点无法解析 |
| `dfs.blocksize` | 新文件默认 block 大小 | 大文件 block 数符合容量设计 | 为小文件问题盲目调小，增加元数据 |
| `dfs.replication` | 默认副本数 | 副本跨故障域且可满足 | 单节点设 3 会长期 under-replicated |
| `dfs.namenode.name.dir` | NameNode 本地元数据目录 | 低延迟、持久化、有备份 | 放 `/tmp` 或与高 IO 数据盘争用 |
| `dfs.datanode.data.dir` | DataNode block 卷 | 各卷容量和延迟受监控 | 多路径在同一物理盘却当多故障域 |
| `yarn.nodemanager.resource.memory-mb` | NM 可供 Container 使用的内存 | 给 OS、daemon 留足余量 | 直接写物理内存总量导致 swap/OOM |
| `yarn.scheduler.minimum-allocation-mb` | 最小分配单位 | 小任务浪费可接受 | 太大造成碎片，太小增加调度压力 |
| `mapreduce.map.memory.mb` | map Container 申请内存 | 超限和 GC 都可控 | JVM heap 与 Container limit 不匹配 |
| `mapreduce.reduce.memory.mb` | reduce Container 申请内存 | shuffle 与 reduce 有足够空间 | 只增大内存，不处理倾斜与 spill |

## 启动单机实验集群

警告：`hdfs namenode -format` 会初始化 NameNode 元数据。只在全新的实验目录执行一次，绝不能把它当成“修复启动失败”的生产命令。

```bash
jps # 先确认没有旧 Hadoop daemon，避免指向错误目录
hdfs namenode -format -clusterId CID-hadoop-lab # 仅首次初始化，预期日志包含 successfully formatted
hdfs --daemon start namenode # 启动 NameNode
hdfs --daemon start datanode # 启动 DataNode
yarn --daemon start resourcemanager # 启动 ResourceManager
yarn --daemon start nodemanager # 启动 NodeManager
mapred --daemon start historyserver # 启动作业历史服务
jps # 预期看到 NameNode、DataNode、ResourceManager、NodeManager、JobHistoryServer
```

默认常见 Web UI：

| 页面 | 实验地址 | 看什么 |
|---|---|---|
| NameNode | `http://localhost:9870` | 容量、live/dead DataNode、block 和 safemode |
| DataNode | `http://localhost:9864` | 节点与 volume 状态 |
| ResourceManager | `http://localhost:8088` | application、queue、node 和 scheduler |
| NodeManager | `http://localhost:8042` | 当前节点 Container 与日志入口 |
| JobHistory | `http://localhost:19888` | 已完成 MapReduce 作业、task 与 counters |

如果页面打不开，先用 `jps` 和 `ss -lntp` 判断进程与监听，再看 `$HADOOP_HOME/logs/`，不要先关闭防火墙。

## 常用命令

### HDFS 用户命令

```bash
hdfs dfs -ls / # 列出 HDFS 根目录；它不是 Linux 本地根目录
hdfs dfs -mkdir -p /user/$USER/input # 创建当前用户实验目录
hdfs dfs -put -f /tmp/alerts.txt /user/$USER/input/ # 上传本地文件并覆盖同名实验文件
hdfs dfs -cat /user/$USER/input/alerts.txt # 从 HDFS 读取文件内容
hdfs dfs -du -h /user/$USER # 查看逻辑文件大小和占用空间
hdfs dfs -count -q -h /user/$USER # 查看目录数、文件数、配额和空间配额
hdfs dfs -stat '%n %b %r %o' /user/$USER/input/alerts.txt # 查看名称、文件大小、副本数和 block size
hdfs dfs -rm -r -skipTrash /user/$USER/output # 仅清理可重建的实验输出；生产不要跳过 Trash
```

### HDFS 管理命令

```bash
hdfs dfsadmin -report # 查看 live/dead DataNode、总容量、使用率和 block pool
hdfs dfsadmin -safemode get # 查看 NameNode 是否处于 safemode
hdfs fsck /user/$USER -files -blocks -locations # 查看实验路径文件、block、副本和位置
hdfs haadmin -getAllServiceState # HA 集群查看所有 NameNode 状态
hdfs balancer -threshold 10 # 让节点间利用率向 10% 阈值收敛，生产先评估带宽
hdfs diskbalancer -report node.example.com # 查看单个 DataNode 内部各 volume 是否不均
```

Balancer 解决 DataNode 之间不均；Disk Balancer 解决同一 DataNode 内不同磁盘之间不均。两者对象不同，运行前都要评估业务 IO、带宽、升级状态和回滚方式。

### YARN 与 MapReduce 命令

```bash
yarn node -list -all # 查看所有 NodeManager 及状态
yarn application -list -appStates ALL # 查看所有状态的 application
yarn application -status application_123_0001 # 查看指定 application 的状态、队列和 tracking URL
yarn logs -applicationId application_123_0001 # 聚合读取指定 application 日志
yarn queue -status default # 查看队列容量和 application 状态
mapred job -list all # 查看 MapReduce 作业
mapred job -status job_123_0001 # 查看指定 MapReduce job 状态
```

### 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 关键字段或参数 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `hadoop version` | 确认客户端版本 | `hadoop version` | version、revision、Java | 版本与计划一致 | PATH 指向旧客户端 |
| `hdfs dfs` | 操作 HDFS 文件 | `hdfs dfs -ls /path` | URI、owner、permission | 能列出目标 | 把 HDFS 路径当本地路径 |
| `hdfs dfsadmin -report` | 查看集群节点和容量 | `-report` | live/dead、used、remaining | 节点数与 CMDB 一致 | 只看总空间，不看单节点 |
| `hdfs fsck` | 检查文件与 block | `-files -blocks -locations` | missing、corrupt、replica | HEALTHY 或符合预期 | 对全根目录频繁执行造成压力 |
| `hdfs haadmin` | 管理和检查 HDFS HA | `-getAllServiceState` | active、standby、observer | 只有预期 Active | 手工切换前未验证 fencing |
| `hdfs balancer` | 平衡节点间 block | `-threshold 10` | threshold、moved bytes | 不均衡逐步下降 | 高峰期抢网络和磁盘 |
| `hdfs diskbalancer` | 平衡节点内 volume | `-plan`、`-execute`、`-query` | node、plan ID | volume 利用率收敛 | 和 cluster balancer 混淆 |
| `yarn application` | 查看或控制应用 | `-list`、`-status`、`-kill` | application ID、state | 状态和 tracking URL 可见 | 未看根因就 kill/retry |
| `yarn logs` | 读取聚合日志 | `-applicationId` | app、container、owner | 能看到 AM/task 日志 | 日志聚合未启用或权限不足 |
| `yarn node` | 查看 NodeManager | `-list -all` | state、HTTP address | 节点与 CMDB 一致 | lost 与 unhealthy 混为一类 |
| `mapred job` | 查看 MapReduce 作业 | `-status` | map/reduce progress | task 进度可解释 | 旧命令与 YARN application ID 混用 |
| JMX `/jmx` | 获取 daemon 指标 | `curl http://host:port/jmx` | bean、tag、metric | 返回 JSON | 未认证端点暴露到公网 |
| RM REST API | 自动查询应用与集群 | `/ws/v1/cluster/apps` | state、queue、user | 返回 JSON | HA 地址、SPNEGO 和分页未处理 |

## 入门实验：HDFS 加 MapReduce WordCount

### 实验目标

把三行告警文本上传到 HDFS，通过 YARN 运行官方 WordCount，验证输出、作业状态和 counters。

### 前提与风险边界

- 已完成前面的单机配置与启动。
- 只操作 `/user/$USER/hadoop-lab-*`。
- 不在生产 NameNode 执行 format。
- 删除命令只针对可重建的实验输出。

### 准备输入

```bash
cat >/tmp/alerts.txt <<'EOF'
critical order-api timeout
warning payment-api latency
critical order-api latency
EOF
# 三行英文告警用于统计单词出现次数；EOF 之间是输入内容

hdfs dfs -mkdir -p /user/$USER/hadoop-lab-input # 创建 HDFS 输入目录
hdfs dfs -put -f /tmp/alerts.txt /user/$USER/hadoop-lab-input/ # 上传文本
hdfs dfs -cat /user/$USER/hadoop-lab-input/alerts.txt # 预期原样看到三行
```

### 提交作业

```bash
hdfs dfs -rm -r -skipTrash /user/$USER/hadoop-lab-output 2>/dev/null || true # WordCount 要求输出目录事先不存在，只清理实验路径

hadoop jar "$HADOOP_HOME/share/hadoop/mapreduce/hadoop-mapreduce-examples-3.5.0.jar" \
  wordcount \
  /user/$USER/hadoop-lab-input \
  /user/$USER/hadoop-lab-output
# 参数依次是 examples JAR、wordcount 类、HDFS 输入目录、HDFS 输出目录
```

正常日志会出现 application ID、map/reduce 进度和 `completed successfully`。随后验证：

```bash
hdfs dfs -cat /user/$USER/hadoop-lab-output/part-r-00000 # 查看 reducer 最终输出
yarn application -list -appStates FINISHED # 找到刚完成的 application
```

预期至少包含：

```text
critical 2
latency 2
order-api 2
payment-api 1
timeout 1
warning 1
```

### 证据怎么读

1. `_SUCCESS` 存在，说明 OutputCommitter 完成最终提交。
2. `part-r-00000` 是 reducer 输出，不是本地文件。
3. RM 页面能看到 queue、user、elapsed time 与 tracking URL。
4. JobHistory 中可以查看 map/reduce task、attempt 和 counters。
5. `FILE_BYTES_READ`、`HDFS_BYTES_READ`、`SPILLED_RECORDS` 等 counters 帮助理解 IO 与 shuffle。

### 如果没有成功

1. `java -version` 是否为 Java 17。
2. `hadoop version` 是否为 3.5.0，环境变量是否指向同一安装。
3. `jps` 是否包含五个实验 daemon。
4. `hdfs dfsadmin -safemode get` 是否显示 OFF。
5. `yarn node -list -all` 是否有一个 RUNNING 节点。
6. 输出目录是否已经存在；MapReduce 默认拒绝覆盖。
7. `$HADOOP_HOME/logs/` 中第一条 ERROR 是什么。
8. RM 页面 application 是 `ACCEPTED`、`RUNNING` 还是 `FAILED`，不同状态对应不同排查方向。

### 清理

```bash
hdfs dfs -rm -r /user/$USER/hadoop-lab-input # 移入 HDFS Trash，若实验启用了 Trash
hdfs dfs -rm -r /user/$USER/hadoop-lab-output # 删除可重建输出
rm -f /tmp/alerts.txt # 清理本地输入
```

## 故障注入实验：停止 DataNode

### 实验目标

主动停止唯一 DataNode，观察 HDFS 如何证明节点丢失和 block 不可读，再恢复服务并验证数据回来。这个实验展示“检测故障”和“自动恢复数据”不是同一件事。

### 前提与备份

- 只在前面的单机实验环境执行。
- 重新创建并保留 `/user/$USER/hadoop-fault-input/alerts.txt`。
- 记录 `hdfs fsck` 和 `hdfs dfsadmin -report` 基线。
- 单机副本数为 1，没有其他 DataNode 可以重建副本，所以绝不能在生产照抄。

### 建立基线

```bash
printf 'critical order-api\n' >/tmp/hadoop-fault.txt # 创建可重建的实验数据
hdfs dfs -mkdir -p /user/$USER/hadoop-fault-input # 创建故障实验目录
hdfs dfs -put -f /tmp/hadoop-fault.txt /user/$USER/hadoop-fault-input/alerts.txt # 上传实验文件
hdfs fsck /user/$USER/hadoop-fault-input -files -blocks -locations # 记录健康 block 与 DataNode 位置
```

### 注入故障

```bash
hdfs --daemon stop datanode # 只停止实验 DataNode
jps # 预期 DataNode 消失，NameNode 仍存在
```

DataNode dead 判定需要 heartbeat 超时，不一定立刻发生。等待后收集：

```bash
hdfs dfsadmin -report # 观察 Live datanodes 与 Dead datanodes
hdfs fsck /user/$USER/hadoop-fault-input -files -blocks -locations # 观察 block 健康与副本位置
hdfs dfs -cat /user/$USER/hadoop-fault-input/alerts.txt # 预期最终读取失败，因为唯一副本不可用
```

### 证据、假设与验证

现象：NameNode 进程健康，但文件读取失败。

证据：

- `jps` 没有 DataNode。
- `dfsadmin -report` 最终把节点列为 dead。
- `fsck` 显示没有可用副本或 block 异常。
- NameNode 日志出现节点心跳超时、缺副本相关信息。

假设：控制面还在，但承载唯一 block 副本的数据面停止，因此 NameNode 能回答元数据却没有健康 DataNode 提供内容。

验证：启动 DataNode 后，节点重新 heartbeat 并报告 block；同一路径应重新可读。

### 修复与恢复验证

```bash
hdfs --daemon start datanode # 恢复实验 DataNode
jps # 预期重新看到 DataNode
hdfs dfsadmin -report # 预期节点回到 live
hdfs dfs -cat /user/$USER/hadoop-fault-input/alerts.txt # 预期重新读到 critical order-api
hdfs fsck /user/$USER/hadoop-fault-input -files -blocks -locations # 预期恢复 HEALTHY
```

### 清理与复盘

```bash
hdfs dfs -rm -r /user/$USER/hadoop-fault-input # 清理 HDFS 实验目录
rm -f /tmp/hadoop-fault.txt # 清理本地实验文件
```

复盘要写清：

- 故障影响的是数据面，不是 NameNode 进程。
- 副本数 1 只能检测，无法从其他副本重建。
- 生产三副本还需要跨机架，才有对应故障域容忍度。
- 修复不能只看 DataNode 进程，要等 heartbeat、block report、缺副本收敛和真实读验证。

## 在 AIOps 中的作用

### 数据湖与长期分析

HDFS 可以保存大规模日志、离线指标、审计、模型训练数据和批处理结果。AIOps 平台可以在其上做趋势分析、容量建模、异常样本构建和故障复盘。

### 集群自身可观测性

Hadoop daemon 通过 Metrics2、JMX、Web UI 和日志暴露状态。采集后可以构建：

- HDFS 容量、增长率和耗尽预测。
- live/dead DataNode、volume failure 和 missing block 告警。
- NameNode RPC、queue、heap、GC 和 safemode 告警。
- YARN pending application、queue pending memory、lost node 和失败率告警。
- MapReduce task duration、shuffle bytes、spill、失败 attempt 和数据倾斜检测。

### 告警关联与根因分析

单个“作业超时”告警没有根因。可以把 application、queue、node、rack、dataset、HDFS block、磁盘、GC 和网络事件关联起来，判断是资源不足、热点 key、慢盘、节点丢失还是 NameNode 控制面抖动。

### 自动化 Runbook

适合自动化的是证据采集和低风险动作：

- 收集 `dfsadmin -report`、`fsck`、YARN application 和 JMX 快照。
- 标记异常节点并创建工单。
- 对可重试批任务执行有预算的重试。
- 生成容量和小文件治理报告。

高风险动作如 format、强退 safemode、手工 HA 切换、删除 block、finalize upgrade、批量 decommission，必须保留人工审批、备份、影响评估和回滚。

## HDFS 高可用设计

### QJM 数据路径

QJM 全称 Quorum Journal Manager。典型 HA nameservice 包含 Active NameNode、Standby NameNode、奇数个 JournalNode、ZooKeeper quorum 和每个 NameNode 上的 ZKFC。

```text
Client
  -> logical URI hdfs://prod
  -> Active NameNode
  -> majority of JournalNodes: 持久化 edit

Standby NameNode
  -> tail JournalNode edits
  -> 更新内存 namespace
  -> 接收 DataNode heartbeat / block report

ZKFC
  -> 监测本地 NameNode
  -> 通过 ZooKeeper 选举
  -> failover 前执行 fencing
```

JournalNode 使用多数派确认 edit。3 个 JournalNode 可容忍 1 个故障，5 个可容忍 2 个；增加节点也增加写入协调与运维成本。

### 自动故障转移

ZKFC 全称 ZooKeeper Failover Controller。它监测本地 NameNode 健康，通过 ZooKeeper session 和选举协调 Active，并在切换时执行 fencing。

Fencing 是隔离旧 Active，防止它继续对外提供不一致服务。QJM 会限制共享 edits 的单 writer，但旧 Active 仍可能短暂服务陈旧读取，因此生产不能把 fencing 省略成形式配置。

切换验证要同时检查：

1. 旧 Active 已被隔离。
2. 新 Active 已追平 edits 并转为 active。
3. 逻辑 URI 客户端完成 failover。
4. 读写业务恢复且没有双 Active。
5. JournalNode、ZooKeeper、ZKFC 和审计日志完整。

### Observer NameNode 与 Federation

Observer NameNode 可以承担读请求，降低 Active NameNode 读压力，但客户端一致性、读新鲜度和 failover provider 需要按官方机制配置。

HDFS Federation 用多个 nameservice 分散 namespace 和 block pool，解决单个 NameNode namespace 扩展边界。它不等于 HA：每个 nameservice 仍要独立设计 HA。

Router-based Federation 在客户端前提供统一挂载表和路由层。Router 可无状态扩展，但 State Store、mount table、路由缓存、子集群状态和跨 namespace 数据迁移成为新的运维对象。

## YARN 高可用与状态恢复

ResourceManager HA 使用 Active/Standby。自动 failover 可使用嵌入 RM 的 ZooKeeper ActiveStandbyElector，不需要像 HDFS 那样单独运行 ZKFC。

HA 只解决 RM 进程单点还不够，还要配置可靠 state store，让新 Active 恢复 application、attempt、token 和调度相关状态。客户端、AM 和 NM 配置多个 RM 地址，失败后寻找新 Active。

生产演练必须验证 running application 的影响，而不只是看到 Web UI 切换。要记录 AM 是否重连、Container 是否继续、提交端重试、日志和 timeline 是否完整。

## 容量与性能

### HDFS 容量估算

三副本的粗略原始容量：

```text
required_raw
  = logical_data
  * replication_factor
  / target_utilization
  * growth_headroom
```

例：逻辑数据 100 TB、副本 3、目标使用率 70%、增长与故障余量 1.25，粗估原始容量约为 `100 * 3 / 0.7 * 1.25 = 535.7 TB`。这还没有包含临时数据、快照保留、升级空间、EC 策略、日志和磁盘不可用损失。

容量计划至少记录：

- 每日写入、删除和净增长。
- 热、温、冷数据保留期。
- 副本或 EC policy。
- 单节点、单盘、单机架故障后的安全水位。
- re-replication、decommission 和升级需要的空闲空间。
- 峰值读写吞吐与恢复流量。

### 小文件问题

HDFS 的每个文件、目录和 block 都需要 NameNode 元数据。海量小文件会消耗 heap、增加 RPC 和 listing 压力，并让计算 task 过碎。

处理思路：

- 从数据生产端批量写入，控制 rollover。
- 使用适合的容器格式，例如 Parquet、ORC、SequenceFile。
- 对历史小文件做 compaction，同时保留可回滚版本。
- 用文件数、平均文件大小、block 数和 NameNode heap 建模。
- 不要用调大 NameNode heap 掩盖无限增长。

### NameNode 容量

NameNode 容量不是只看 HDFS TB 数。namespace object 数、block 数、snapshot、ACL、xattr、open file、RPC 并发和 edit rate 都会影响内存与 GC。

压测和容量评审要观察：

- 文件、目录、block 总数与增长率。
- heap used、old generation、GC pause 与 promotion。
- RPC queue、processing time、handler saturation。
- FSImage 保存与加载时间、EditLog 增长和 checkpoint 时长。
- failover 时 Standby 追平 edits 的时间。

### DataNode 与磁盘

节点总使用率均衡不代表节点内每块盘均衡。慢盘会拖慢 pipeline、read 和 block report；坏盘会减少有效容量并增加恢复流量。

监控每个 volume 的使用率、延迟、错误、吞吐、queue depth、SMART 和内核日志。替换盘后按 DataNode disk balancer 计划迁移，不要手工移动 block pool 文件。

### YARN 容量

NodeManager 资源不能等于整机资源。要为 OS、DataNode、日志、page cache、监控 agent 和突发留余量。

Container memory 同时考虑：

- JVM heap。
- direct buffer、native library 和线程栈。
- sort/shuffle buffer。
- Python 或外部子进程。
- Container overhead 与物理内存检查方式。

队列容量除了 MB/vcore，还要看 application 到达率、平均运行时间、AM 数、pending 时间、用户公平性和抢占成本。

### MapReduce 性能

先判断瓶颈阶段：

| 现象 | 重点证据 | 常见方向 |
|---|---|---|
| map 启动慢 | split 数、locality、queue wait | 小文件、节点不足、AM 调度 |
| map 长尾 | 每 task 输入、节点 IO、GC | 不可切分文件、慢盘、数据偏斜 |
| shuffle 慢 | map output、spill、fetch failure、网络 | 中间数据大、磁盘慢、网络拥塞 |
| 单个 reducer 慢 | key 分布、partition size、task timeline | 热点 key、partitioner 不合理 |
| Container OOM | exit code、heap、RSS、cgroup | heap/overhead 不匹配、数据结构过大 |
| 输出提交慢 | HDFS 延迟、OutputCommitter 日志 | NameNode RPC、对象存储提交语义 |

调优顺序通常是：确认数据分布和算法，再看并行度、序列化与压缩，最后才是内存和线程参数。没有基线的参数堆砌无法证明优化有效。

## 安全边界

默认非 secure mode 不能验证远程调用者身份。官方明确提醒：只靠网络可达性隔离时，能接入集群的人可能读取数据或提交任意工作。生产 Hadoop 应把 Kerberos 纳入基础架构。

### 身份认证

- 用户通过 `kinit` 获得 Kerberos Ticket Granting Ticket，简称 TGT。
- daemon 使用独立 service principal 与 keytab。
- forward/reverse DNS、hostname、realm 和时钟必须一致。
- keytab 是长期凭据，权限、分发、轮换和审计必须受控。

### 授权

- HDFS permission、ACL 和 group mapping 控制文件访问。
- YARN queue ACL 控制提交与管理应用。
- service-level authorization 控制 RPC 服务访问。
- proxy user 允许受控服务代表用户，host/group 范围必须最小化。

### 传输与静态加密

- RPC privacy 保护 Hadoop RPC 数据。
- DataNode data transfer encryption 保护 block 传输。
- HTTPS/SPNEGO 保护 Web UI 与 HTTP API。
- HDFS Transparent Encryption 使用 encryption zone、KMS 和密钥策略保护静态数据。

加密区不会自动保护导出到本地、日志、临时目录或下游系统的数据。KMS HA、密钥备份、轮换和恢复演练同样属于系统可用性。

### 审计与最小权限

采集 NameNode audit log、RM audit log、Kerberos、KMS 和系统审计，关联 user、proxy user、client IP、command、path、queue 与 result。日志应防篡改并有保留策略。

Web UI、JMX 和 REST API 也可能泄露路径、用户、作业参数和配置，必须通过认证、反向代理、网络策略和最小开放范围保护。

## 可观测性

### 证据来源

```text
Metrics2 / JMX
  -> 容量、RPC、block、queue、application、JVM

Daemon logs
  -> NameNode / DataNode / RM / NM / JobHistory / ZKFC / JournalNode

Audit logs
  -> 谁在何时访问哪个 path、提交或管理什么应用

Web UI / REST API
  -> 实时状态、队列、节点、application、task、counter

OS and hardware
  -> CPU、memory、disk latency、SMART、network、clock、process
```

### HDFS 重点指标

- `CapacityTotal`、`CapacityUsed`、`CapacityRemaining` 与增长率。
- `NumLiveDataNodes`、`NumDeadDataNodes`、failed volumes。
- `UnderReplicatedBlocks`、`MissingBlocks`、`CorruptBlocks`。
- pending replication、pending deletion、excess blocks。
- NameNode heap、GC、RPC queue time、processing time、call volume。
- edit log、checkpoint、safemode 和 HA state。

### YARN 重点指标

- active/lost/unhealthy/decommissioned NodeManager。
- allocated、available、pending、reserved memory 与 vcores。
- running、pending、failed、killed application。
- 各 queue capacity、utilization、pending resource 和 AM resource。
- scheduler operation latency、Container allocation delay。
- NM local/log disk health、Container OOM 和 exit code。

### MapReduce 重点证据

- map/reduce task duration 的分位数与长尾。
- input/output records 与 bytes。
- map output bytes、spilled records、shuffle bytes。
- failed fetch、failed/killed attempt、speculative attempt。
- data-local、rack-local 与 other-local task 比例。
- GC time、CPU time、physical/virtual memory counters。

### JMX 快速检查

```bash
curl -fsS http://localhost:9870/jmx > /tmp/namenode-jmx.json # 保存 NameNode JMX 快照
curl -fsS http://localhost:8088/jmx > /tmp/resourcemanager-jmx.json # 保存 RM JMX 快照
```

生产 secure mode 下应通过认证与受控网络访问，不能为了抓指标把 JMX 匿名暴露到公网。Prometheus exporter 的 label 也要限制基数，避免把 path、application ID 或 user 无界展开。

## 常见故障排查

### NameNode 长期处于 Safemode

现象：HDFS 读取可能正常，创建、删除或修改失败。

证据顺序：

1. `hdfs dfsadmin -safemode get` 确认状态。
2. NameNode 日志确认未满足的 block 阈值。
3. `dfsadmin -report` 检查 live/dead DataNode。
4. `fsck` 检查 missing、corrupt 与 under-replicated block。
5. 检查 block report、网络、磁盘和版本。

修复应针对 DataNode、block 或阈值根因。只有证据证明数据安全且经过审批，才评估人工 leave。

### HDFS 写入失败或 pipeline recovery 频繁

检查客户端异常中的目标 DataNode、DataNode 日志、磁盘剩余、volume failure、网络丢包、写超时、checksum 和副本放置。若多个节点集中在同一机架或交换机，结合拓扑判断共同故障域。

### Under-replicated blocks 持续上升

先判断是节点下线、空间不足、复制队列拥塞、机架约束、维护窗口还是大量副本策略变更。观察 pending replication、re-replication throughput 与网络，不要立即全速 balancer。

### Missing 或 corrupt block

保存 `fsck` 明细，确认是否仍有健康副本、快照、远端副本或上游可重建数据。隔离可疑硬件并检查 checksum、SMART、内核日志。恢复优先从可信副本或备份，不手工伪造 block 元数据。

### NameNode GC 长或 RPC queue 堆积

关联 heap、GC pause、文件/block 数、RPC call 类型、handler queue、checkpoint 和业务突发。小文件风暴、全目录 listing、快照操作和批量权限变更都可能造成压力。

### DataNode 磁盘使用不均

先区分节点间不均和节点内 volume 不均。前者看 balancer，后者看 disk balancer。运行前记录带宽、水位和业务峰谷，并确认没有升级、decommission 或大规模恢复同时进行。

### 作业一直 ACCEPTED

检查 queue pending resource、AM resource limit、用户上限、节点标签、最大 Container 规格、NM 健康和队列状态。`ACCEPTED` 不代表代码已经运行。

### 作业 RUNNING 但不推进

从 task timeline 找慢阶段，查看 AM/task 日志与 counters；再关联 HDFS、shuffle、节点磁盘、网络、GC 和外部依赖。不要用反复 kill/retry 掩盖稳定的数据倾斜。

### Container 被杀或 OOM

确认 exit code、physical memory、virtual memory、cgroup event、JVM heap、direct memory、线程和子进程。合理调整 heap 与 Container overhead，并修复无界集合、倾斜或泄漏。

### Shuffle fetch failed

检查 map output 是否被 NM 清理、shuffle service、磁盘、网络、端口、证书、NM 重启和 map attempt 状态。大量 fetch retry 会放大网络与磁盘压力，应限制重试风暴。

### Kerberos 登录或访问失败

按顺序检查 DNS 正反解、时钟、realm、principal、keytab 权限、`kinit`、`klist`、服务 principal、`auth_to_local`、token 续期和 KDC 日志。不要通过关闭认证验证生产问题。

## 生产架构检查单

### HDFS 高可用

- NameNode 分布在独立故障域，硬件与容量对等。
- JournalNode 使用 3 或 5 个奇数节点，磁盘与监控可靠。
- ZooKeeper quorum 与 ZKFC 安全配置完成。
- fencing 真实有效并经过演练，不是占位命令。
- 客户端使用逻辑 nameservice URI 和 failover provider。
- Standby edit lag、checkpoint 和 block report 可观测。

### YARN 高可用

- RM Active/Standby 与可靠 state store 配置完成。
- 客户端、AM、NM 能发现所有 RM。
- queue 容量、用户限制、ACL、抢占和 AM 上限有依据。
- NM 使用 cgroup 等方式验证资源隔离。
- JobHistory/Timeline、日志聚合和保留满足排障需求。

### 容量和性能

- 用 logical data、副本/EC、水位、增长和故障余量估算容量。
- 文件数、block 数和 NameNode heap 有增长模型。
- 预留 decommission、re-replication、升级和恢复带宽。
- DataNode 节点间与 volume 间均衡分别治理。
- MapReduce 有基线、数据倾斜检测和大作业准入。

### 安全

- Kerberos、DNS、NTP、principal、keytab 生命周期清晰。
- HDFS permission/ACL、YARN queue ACL 和 proxy user 最小化。
- RPC、block transfer、HTTP 与静态数据加密按威胁模型落地。
- KMS、ZooKeeper、JMX、Web UI 和 REST API 纳入保护。
- audit log 集中保存、可搜索且防篡改。

### 灾备

- 快照保护误操作，但明确它不等于异地备份。
- DistCp 复制到独立集群或存储故障域，定期校验。
- NameNode 元数据、配置、密钥和自动化脚本有备份。
- RPO、RTO、带宽、DNS/客户端切换和回切流程经过演练。

RPO 是 Recovery Point Objective，表示最多能接受丢失多长时间的数据；RTO 是 Recovery Time Objective，表示目标恢复时长。

## 扩容、缩容与数据平衡

扩容不是“加机器后立刻均衡”：

1. 验证硬件、OS、Java、时钟、DNS、磁盘和网络。
2. 部署一致版本和配置，加入 workers/include 列表。
3. 启动 DataNode/NodeManager，检查注册与健康。
4. 控制 balancer 带宽，在业务低峰迁移。
5. 观察容量、复制队列、IO、网络和应用延迟。

缩容必须使用 decommission：

1. 确认集群有足够空间和故障余量。
2. 把节点加入 exclude 配置并刷新节点。
3. 等待 block 副本迁移和 NodeManager 优雅下线。
4. 验证节点状态、missing/under-replicated block 与业务。
5. 再停止 daemon 和下线硬件。

直接关机可能把原本可控的维护变成副本紧急恢复，并与业务争抢带宽。

## 升级与回滚

### 升级前

- 阅读源版本到目标版本的 release notes、Java 要求和兼容性说明。
- 盘点客户端、Hive/Spark/HBase 等下游兼容性。
- 检查 HDFS health、HA、JournalNode、ZooKeeper、RM state store。
- 备份 NameNode 元数据、配置、密钥和自动化。
- 建立功能、性能和数据校验基线。
- 在预生产演练滚动升级、failover、rollback 和客户端兼容。

### 变更过程

按官方 rolling upgrade 或发行版流程分批执行，控制故障域和并发。每批验证 daemon version、节点健康、block、application、queue、GC、RPC 和业务抽样。

不要在刚升级完成后立刻 finalize。finalize 会放弃某些回滚能力；应在观察窗口通过、数据与下游验证完成后再审批执行。

### 回滚条件

- missing/corrupt block 增长。
- HA 或 state recovery 不符合预期。
- 关键客户端不兼容。
- 性能显著退化且无法在窗口内修复。
- 安全或审计能力缺失。

回滚也可能丢失升级后产生的新状态，必须依据对应版本的官方语义评估，而不是把 rollback 当无损撤销按钮。

## 生产事故场景：集群写入间歇失败

### 现象

业务报告 HDFS 写入偶发超时，`UnderReplicatedBlocks` 上升，部分 MapReduce 作业 shuffle 也变慢。NameNode 仍是 Active，集群总剩余容量看起来充足。

### 先控制影响

1. 冻结非必要大规模写入、balancer 和批量迁移。
2. 保护关键队列和恢复带宽，限制自动重试风暴。
3. 记录开始时间、受影响 path、application、rack 和 client。
4. 不执行 format、强退 safemode或手工删除 block。

### 收集证据

- `dfsadmin -report` 对比单节点和单 volume 水位。
- `fsck` 抽样受影响 path 的 block location。
- DataNode volume failure、disk latency、SMART 与内核日志。
- NameNode pipeline recovery、replication queue、RPC 和 GC。
- 交换机端口错误、丢包、跨机架带宽。
- YARN task 所在节点、shuffle fetch failure 和长尾。

### 形成假设

假设 A：某机架多块磁盘接近满，pipeline 经常选不到满足策略的目标。

假设 B：某机架交换机丢包，写 pipeline 与 shuffle 同时受影响。

假设 C：NameNode GC 导致分配 block RPC 超时。

假设必须对应可验证证据，不要同时改网络、GC 和副本参数。

### 验证与修复

- 如果问题集中在单机架且网络错误同步升高，先隔离网络故障域并控制恢复流量。
- 如果单 volume 满或慢，按维护流程处理磁盘，必要时执行受控 disk balancer。
- 如果 NameNode GC 与 RPC queue 同步恶化，分析 namespace 增长和请求类型，降低突发并治理小文件。
- 修复后观察 pipeline recovery、under-replicated、写延迟和作业长尾是否一起回落。

### 爆炸半径与回滚

评估哪些 path、rack、queue、application 和时间窗口受影响。任何带宽、队列或 balancer 调整都要保存旧值，并设定恢复阈值和回滚时间。最终用真实写入、读取、checksum、作业结果和业务确认闭环。

## 选型与架构取舍

### HDFS 与对象存储

HDFS 适合本地数据与计算紧密结合、需要高吞吐和可控集群的场景；对象存储把存储与计算解耦，容量弹性和跨服务共享更方便，但延迟、列表、一致性、提交协议、出口成本和依赖云服务需要重新评估。

### MapReduce 与 Spark/Flink

MapReduce 模型简单、磁盘阶段清晰、失败恢复成熟，适合离线批处理；Spark 更擅长通用 DAG 和内存复用；Flink 强项包括状态化流处理。三者可能共享 HDFS，也可能运行在 YARN 或其他调度平台。

### YARN 与 Kubernetes

YARN 面向大数据应用资源调度，与 HDFS 数据本地性和 Hadoop 安全集成成熟；Kubernetes 提供更通用的容器编排和云原生生态。选择要比较 workload、隔离、队列、公平性、数据位置、运维平台和团队能力，而不是按流行度决定。

## 面试怎么讲

### 30 秒版本

Hadoop Core 由 Common、HDFS、YARN 和 MapReduce 组成。HDFS 用 NameNode 管元数据、DataNode 存 block，并通过副本、机架感知和校验实现容错；YARN 用 ResourceManager、NodeManager、ApplicationMaster 和 Container 分配计算资源；MapReduce 经过 input、map、shuffle/sort、reduce 处理批数据。生产上我会重点设计 NameNode QJM HA、RM HA、容量水位、Kerberos、安全加密、Metrics2/JMX、滚动升级和灾备。

### 3 分钟版本

一次 HDFS 写入先向 Active NameNode 创建文件并申请 block，NameNode 根据副本策略返回 DataNode pipeline，客户端把 packet 发给第一个 DataNode 并逐级转发，ACK 反向返回；NameNode 不承载文件内容。NameNode 用内存 namespace 提供元数据服务，FSImage 与 EditLog 持久化状态，HA 下 Active 把 edits 写入多数 JournalNode，Standby 持续追平，ZKFC 通过 ZooKeeper 选举并在切换时 fencing 旧 Active。

YARN 把全局资源和应用内部协调分开。客户端向 ResourceManager 提交 application，NodeManager 启动 ApplicationMaster，AM 再申请 task Container 并跟踪执行。MapReduce 的关键性能路径是 map 输出 spill、partition、sort、网络 fetch、reduce merge；遇到长尾先看 key 分布、counters、task timeline、磁盘和网络，不是直接加内存。

生产设计会用跨故障域副本或 EC、NameNode/RM HA、Kerberos 与最小权限、RPC和数据传输加密、审计、容量预测、decommission 和受控 balancer。升级前建立健康与性能基线，保留 metadata/config/key 备份和回滚窗口，finalize 之前完成下游兼容与数据验证。故障时按控制面、数据面、资源面和硬件网络收集证据，再决定修复和回滚。

## 核心面试题参考答案与连续追问

### 1. Hadoop 四个核心模块分别做什么

Hadoop Common 提供共同基础；HDFS 存数据；YARN 管资源与应用；MapReduce 提供批处理计算模型。

追问：Spark 可以使用 HDFS/YARN，但不属于 Hadoop Core；只使用 HDFS 时不必运行 MapReduce。

### 2. NameNode 为什么是元数据瓶颈

namespace、文件到 block 映射和大量控制操作集中在 NameNode，元数据主要在内存中。瓶颈由 object 数、RPC、edit rate、GC 和 checkpoint 决定，不只由存储 TB 决定。

追问：Federation 用多个 nameservice 横向拆 namespace；HA 解决可用性，不直接解决单 namespace 扩展。

### 3. Secondary NameNode 是热备吗

不是。它主要合并 FSImage 与 EditLog 形成 checkpoint，不能自动替代 Active NameNode。HA 架构由 Standby NameNode 保持热状态并执行 checkpoint。

追问：Checkpoint 也不等于业务数据备份，block 和异地灾备要单独设计。

### 4. HDFS 写入为什么使用 pipeline

客户端把数据发给第一个 DataNode，再逐级复制并反向 ACK，避免客户端并行向每个副本重复发送全部数据，也能在失败时重组 pipeline。

追问：NameNode 负责目标选择和元数据，不转发 block 内容。

### 5. 三副本如何放置

放置策略结合客户端、节点、负载和机架拓扑，在可靠性与跨机架写流量之间取舍。不能只背固定节点顺序，因为版本、客户端位置和策略可能不同。

追问：如果所有节点都被错误映射到同一 rack，副本数 3 也无法提供预期机架容灾。

### 6. QJM 如何避免双写

Active 对多数 JournalNode 持久化 edits，JournalNode 只允许当前 writer epoch；Standby tail edits。failover 时新 Active 先追平并取得写权限，同时 fencing 旧 Active 的剩余服务能力。

追问：QJM 的单 writer 不意味着可以省略所有 fencing，因为旧 Active 仍可能提供陈旧读取或连接。

### 7. Safemode 为什么不应直接强退

Safemode 表示 NameNode 尚未确认足够 block 安全。强退只允许写操作继续，不会恢复 missing block，可能在证据不足时扩大数据风险。

追问：先看 live DataNode、block report、阈值、missing/under-replicated 和日志。

### 8. HDFS 小文件为什么危险

每个文件、目录和 block 都增加 NameNode 内存对象与 RPC/listing 开销；计算端也产生大量 split 和 task。治理应从写入批量、文件格式、compaction 和保留策略入手。

追问：只把 block size 调小通常会增加 block 元数据，并不会消灭小文件。

### 9. YARN 的 RM、NM、AM、Container 怎么协作

RM 全局调度，NM 管节点执行，AM 管单个应用，Container 是分配和启动资源边界。客户端提交后先获得 AM Container，AM 再申请 task Container。

追问：application 长期 ACCEPTED 多半先查 AM 资源和队列，不是 task 代码。

### 10. YARN Container 等于 Docker 容器吗

不等于。YARN Container 首先是资源与执行抽象，可以结合 Linux cgroup、Docker 或 runC 等执行方式，但概念层次不同。

追问：资源申请不等于物理隔离，生产需验证 cgroup 与节点保留资源。

### 11. MapReduce shuffle 发生什么

map 输出进入 buffer，达到阈值 spill 到本地磁盘，按 partition 排序和合并；reducer 跨节点 fetch 对应分区，再合并排序、按 key 分组后执行 reduce。

追问：热点 key 导致单 reducer 长尾，增加 reducer 数不一定解决，需要重设 key、分区或分阶段聚合。

### 12. Combiner 为什么不能保证执行

Combiner 是框架可选择的本地优化，可能执行零次或多次。业务正确性不能依赖它，函数还需满足适合局部聚合的代数性质。

追问：平均值不能简单对局部平均再平均，应携带 sum/count。

### 13. 推测执行有什么风险

它为慢 task 启动额外 attempt，可缓解偶发慢节点，但会额外消耗资源，并可能重复外部副作用。倾斜造成的稳定慢任务不会因此根治。

追问：对外部数据库写入要使用幂等、事务或关闭相关推测执行。

### 14. Balancer 与 Disk Balancer 区别

Balancer 在 DataNode 之间移动 block，使节点利用率接近；Disk Balancer 在同一 DataNode 的不同 volume 之间移动 block。

追问：两者都可能抢 IO 和网络，不能在恢复、升级和业务高峰无预算运行。

### 15. 副本与 EC 怎么选

副本读写和恢复更直接，适合热数据；EC 以编码计算和复杂恢复换取较低存储开销，适合较冷大文件。按数据温度、IO、恢复目标和官方限制选择。

### 16. Hadoop 安全为什么必须先解决身份

没有 Kerberos 时，集群难以可信识别远程用户，文件权限和队列 ACL 的主体可能被伪造。生产还要叠加授权、加密、审计和网络边界。

### 17. 怎样判断 NameNode 容量不足

同时观察 namespace object 增长、heap/GC、RPC queue、handler latency、edit rate、checkpoint 和 failover lag。单看 CPU 或 HDFS TB 会漏掉小文件与元数据压力。

### 18. 怎样设计跨集群灾备

定义数据分级、RPO/RTO、DistCp 或快照 diff、网络带宽、加密和校验；备份集群独立故障域，定期演练客户端切换、权限、密钥、增量同步和回切。

追问：同集群 snapshot 防误删，但不能抵抗整个集群或站点故障。

## 系统设计题

题目：设计一个每天新增 50 TB 日志、保留 180 天、支持离线分析的 Hadoop 平台。

回答框架：

1. 需求：日增、峰值写入、文件大小、读写模式、SLA、租户、安全、RPO/RTO。
2. 数据：按来源和日期分区，控制文件大小，热数据三副本，冷数据评估 EC。
3. HDFS：NameNode QJM HA、跨机架 DataNode、容量水位、快照和异地 DistCp。
4. YARN：RM HA、生产/探索/维护队列、用户限制、抢占与节点标签。
5. 性能：block size、压缩、文件格式、数据本地性、shuffle 和倾斜治理。
6. 安全：Kerberos、ACL、queue ACL、KMS、加密、审计和最小网络开放。
7. 可观测性：容量预测、block 健康、RPC/GC、queue pending、task 长尾和硬件指标。
8. 变更：decommission、balancer 预算、滚动升级、兼容验证和回滚窗口。
9. 成本：原始容量、增长、恢复余量、跨机架与异地带宽、运维人力。

面试官继续追问“多少台机器”时，不要凭空报数。先向对方索取单机磁盘、目标水位、压缩率、副本/EC、故障余量和吞吐基线，再给公式和假设。

## 事故复盘题

题目：凌晨大量任务失败，NameNode 正常，RM 页面显示多个 application RUNNING，但 reducer 长时间停在 90%。

回答顺序：

1. 控制重试，保护集群与关键队列。
2. 从慢 reducer 的 task/attempt、shuffle counters 和日志定位共同节点或 key。
3. 对照 NM、磁盘、网络、fetch failure 和 map output 丢失。
4. 区分数据倾斜、慢盘、NM 重启、shuffle service 与网络故障。
5. 做单变量验证，例如换节点重跑小样本或分析 partition size。
6. 根据根因修复，设置观察阈值和回滚。
7. 验证业务输出完整性，而不只看 application 变绿。
8. 补上倾斜检测、节点健康门禁、重试预算和演练记录。

## 学习路线

第一阶段：概念与命令

- 分清 Common、HDFS、YARN、MapReduce。
- 使用 `hdfs dfs`、`dfsadmin`、`fsck`、`yarn application`。
- 跑通单机 WordCount。

第二阶段：数据路径

- 手绘 HDFS read/write pipeline。
- 手绘 YARN application 生命周期。
- 用 counters 解释 MapReduce shuffle。

第三阶段：故障与证据

- 完成 DataNode 停止与恢复实验。
- 分析 safemode、小文件、倾斜和 Container OOM。
- 建立 metrics、logs、audit、OS 的证据矩阵。

第四阶段：生产设计

- 设计 NameNode QJM HA 与 RM HA。
- 完成容量、队列、Kerberos、灾备与升级方案。
- 演练 decommission、failover 和 rollback。

第五阶段：项目与面试

- 构建 Hadoop 监控 dashboard 和 runbook。
- 完成系统设计题与事故复盘题。
- 用自己的实验数据回答连续追问。

## 学习检查清单

- [ ] 我能解释 Hadoop Core 与 Hive、Spark、HBase 的边界。
- [ ] 我能解释 NameNode 和 DataNode 的职责。
- [ ] 我能画出 HDFS 写 pipeline 和读取路径。
- [ ] 我能解释 FSImage、EditLog、checkpoint 和 safemode。
- [ ] 我能解释 heartbeat、block report、副本和机架感知。
- [ ] 我能区分副本与 Erasure Coding。
- [ ] 我能解释 RM、NM、AM 和 Container。
- [ ] 我能说明 application 为什么长期 ACCEPTED。
- [ ] 我能画出 map、spill、shuffle、sort、reduce。
- [ ] 我能用 counters 分析长尾和倾斜。
- [ ] 我完成了单机 WordCount 实验。
- [ ] 我完成了 DataNode 故障注入和恢复验证。
- [ ] 我能解释 QJM、JournalNode、ZooKeeper、ZKFC 和 fencing。
- [ ] 我能解释 RM HA 与 state recovery。
- [ ] 我能区分 Federation 与 HA。
- [ ] 我能估算 HDFS 原始容量和安全水位。
- [ ] 我能解释小文件为什么伤害 NameNode。
- [ ] 我能设计 Kerberos、ACL、加密和审计边界。
- [ ] 我能制定 decommission、balancer、升级和回滚计划。
- [ ] 我能按证据完成一次 Hadoop 事故分析。

## 面试自测题

1. Hadoop Common、HDFS、YARN、MapReduce 分别解决什么问题？
2. 一次 HDFS 写入经过哪些组件？
3. 为什么文件内容不经过 NameNode？
4. block size 与 replication factor 分别影响什么？
5. heartbeat 与 block report 有什么区别？
6. FSImage、EditLog 和 checkpoint 的关系是什么？
7. Secondary NameNode 为什么不是热备？
8. Safemode 的进入和退出依据是什么？
9. HDFS 如何发现和恢复坏 block？
10. 机架感知错误会造成什么风险？
11. 三副本与 EC 如何取舍？
12. QJM 多数派如何计算可容忍故障数？
13. ZKFC、ZooKeeper 和 fencing 分别做什么？
14. Observer NameNode 解决什么问题？
15. Federation 与 HA 有什么区别？
16. Router-based Federation 引入哪些新故障点？
17. RM、NM、AM 和 Container 如何协作？
18. YARN Scheduler 为什么不负责具体 task 重试？
19. application 长期 ACCEPTED 怎么查？
20. Container memory 与 JVM heap 为什么不能相等？
21. CapacityScheduler 如何做多租户隔离？
22. InputSplit 与 HDFS block 为什么不是同一概念？
23. Combiner 为什么不能承载必须执行的业务逻辑？
24. Shuffle 的完整路径是什么？
25. 单 reducer 长尾如何判断是否数据倾斜？
26. 推测执行什么时候有帮助，什么时候危险？
27. OutputCommitter 解决什么问题？
28. task 重试为什么不保证外部副作用 exactly-once？
29. 小文件从存储和计算两侧造成什么问题？
30. NameNode 容量应该看哪些指标？
31. Balancer 与 Disk Balancer 有什么区别？
32. 怎样安全下线一个 DataNode？
33. Kerberos 解决什么，ACL 又解决什么？
34. KMS 故障会影响哪些数据路径？
35. HDFS snapshot 为什么不是异地备份？
36. DistCp 灾备如何验证数据一致性？
37. Hadoop 升级前为什么不能急着 finalize？
38. HDFS 写失败但总容量充足时怎么查？
39. reducer 卡在 90% 时证据顺序是什么？
40. Hadoop、Spark、对象存储和 Kubernetes 如何组合选型？

## 学习证据

完成本篇后，建议提交到 GitHub：

- `hadoop-lab/` 中脱敏后的四份 XML 配置与环境说明。
- Hadoop 3.5.0、Java 17 和 SHA-512 校验成功记录。
- WordCount 输入、命令、输出和 YARN application 截图。
- 一张 HDFS read/write pipeline 图。
- 一张 YARN application 与 MapReduce shuffle 图。
- DataNode 故障注入的基线、现象、日志、修复和恢复证据。
- 一份 NameNode QJM HA 与 ResourceManager HA 方案。
- 一份容量公式、假设、增长水位和扩容阈值。
- 一份 Kerberos、ACL、KMS、审计和网络边界检查单。
- 一份升级、finalize、rollback 和客户端兼容演练记录。
- 一张 Hadoop AIOps dashboard 与告警规则说明。
- 一段 3 分钟 Hadoop 原理与生产设计回答录音。

## 本文边界与下一步

读完本文并不保证通过任何公司的面试。还需要继续练习 Java 或 Python、Linux、网络、磁盘、ZooKeeper、数据库、算法、系统设计、真实项目和沟通表达。

下一步可以继续学习 ZooKeeper、Kafka、Spark、Flink、Hive、HBase、对象存储和数据湖表格式，并把本篇实验扩展成三节点、Kerberos、HA、监控与灾备均可验证的独立测试集群。
