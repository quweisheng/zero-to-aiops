# Apache ZooKeeper 深讲

> 学习目标：理解 ZooKeeper 的 znode、Session、Watch、临时节点、顺序节点、Quorum 和 ACL，能启动学习环境、完成配置/成员/选主实验，并按会话、网络、磁盘和多数派链路排查常见故障。

## 官方资料

- [ZooKeeper 3.9 官方文档](https://zookeeper.apache.org/doc/current/)
- [官方发布页](https://zookeeper.apache.org/releases/)
- [Getting Started](https://zookeeper.apache.org/doc/current/zookeeperStarted.html)
- [Programmer's Guide](https://zookeeper.apache.org/doc/current/zookeeperProgrammers.html)
- [Administrator's Guide](https://zookeeper.apache.org/doc/current/zookeeperAdmin.html)
- [CLI 使用指南](https://zookeeper.apache.org/doc/current/zookeeperCLI.html)
- [监控指南](https://zookeeper.apache.org/doc/current/zookeeperMonitor.html)
- [Recipes and Solutions](https://zookeeper.apache.org/doc/current/recipes.html)

截至 2026-07-17，官方发布页列出 3.9.5 为 current release、3.8.6 为 latest stable release。部署前应重新核对版本、JDK、客户端和上层组件的兼容矩阵，不要只追求版本号最新。

## 官方知识地图

```text
ZooKeeper
  -> 树形数据模型与 znode
  -> Session、临时节点与连接状态
  -> Watch 通知
  -> 顺序节点与分布式协调配方
  -> Leader、Follower、Observer 与 Quorum
  -> 快照、事务日志与数据恢复
  -> ACL、TLS、SASL 与审计
  -> 指标、四字命令、运维与升级
```

本文先解释客户端看到的数据模型，再沿着一次写请求进入复制集群，最后学习部署、监控和故障处理。

## 场景开场

三个调度器实例同时启动，但同一时刻只能有一个实例执行全局任务。你还希望主实例宕机后，其他实例能及时发现并重新选主。

把“谁是主实例”写进普通数据库并不断轮询，会遇到锁超时、故障检测、并发覆盖和脏状态清理问题。ZooKeeper 用 Session、临时顺序节点和 Watch 提供了一套更适合分布式协调的基础能力。

## 一句话人话版

ZooKeeper 保存少量关键协调状态，让多个进程对成员、配置、顺序和主节点达成一致。

## 小白可能会问

- ZooKeeper 看起来像目录树，它是不是一个数据库？
- 为什么三台服务器只能坏一台？
- 临时节点为什么会自动消失？
- Watch 是消息队列吗，会不会漏事件？
- Kafka 现在还必须依赖 ZooKeeper 吗？

## 为什么要学

ZooKeeper 广泛用于分布式系统的配置协调、服务成员管理、Leader Election（主节点选举）、锁和元数据管理。HBase、SolrCloud 和部分存量 Kafka 集群等系统会直接依赖它。

在 AIOps 中，ZooKeeper 故障经常表现为上层系统大面积不可用。只看上层报错容易误判，必须能把连接失败、Session Expired（会话过期）、没有多数派、事务日志磁盘变慢等信号串起来。

## ZooKeeper 是什么

ZooKeeper 是 Apache 的分布式协调服务。它向客户端提供一个类似文件目录的树形命名空间，每个数据节点叫 `znode`。应用通过创建、读取、更新、删除 znode，以及监听变化来实现更高层协调逻辑。

ZooKeeper 不是用来保存业务大表、日志流或大文件的通用数据库。znode 适合保存体积较小、读多写少、需要一致顺序和通知的协调元数据。

## 它解决什么问题

- **配置协调**：保存当前配置版本，并通知订阅者重新读取。
- **成员发现**：用临时节点表示当前在线实例。
- **主节点选举**：用临时顺序节点选出序号最小的候选者。
- **分布式锁**：让竞争者按顺序等待前一个节点删除。
- **命名与元数据**：保存分布式系统中的位置、状态和归属信息。
- **故障感知**：Session 过期后自动删除该会话拥有的临时节点。

锁、队列和选主并不是一个“执行按钮”，而是客户端基于 ZooKeeper 原语实现的 recipe（协调配方）。真实项目应优先使用经过验证的客户端库，不要自行拼接一个看似能跑的锁算法。

## 核心原理

### znode 与树形数据模型

- **是什么**：znode 是 ZooKeeper 命名空间中的数据节点，例如 `/aiops/config`。
- **为什么需要**：路径天然表达层级、归属和子节点关系，便于组织协调元数据。
- **怎么工作**：每个 znode 可保存一段字节数据和 `Stat` 元数据，也可以有子节点；数据读写是原子的。
- **怎么看或怎么用**：用 `ls` 看子节点，`get -s` 看数据和版本，`stat` 只看元数据。
- **坏了怎么查**：先核对路径、大小、子节点数量、`dataVersion` 和 ACL；不要把大量业务数据塞进 znode。

`Stat` 中常见字段：`dataVersion` 是数据修改次数，`cversion` 是子节点列表变化次数，`ephemeralOwner` 非零时表示它属于某个 Session。

### Persistent、Ephemeral 与 Sequential

- **是什么**：Persistent 是持久节点；Ephemeral 是随 Session 消失的临时节点；Sequential 会在名称后追加单调递增序号。
- **为什么需要**：持久节点保存配置根路径，临时节点表示在线成员，顺序节点提供公平排队和选主顺序。
- **怎么工作**：服务端把临时节点与 Session ID 关联；会话真正过期后自动删除。顺序号由父路径下的计数生成。
- **怎么看或怎么用**：使用 `create`、`create -e`、`create -s`；用 `getEphemerals` 查看当前会话的临时节点。
- **坏了怎么查**：节点没有消失时先判断会话只是断开还是已经过期；节点重复时检查连接结果不确定后的重试逻辑。

临时节点不能拥有子节点。网络短暂中断也不会立刻删除临时节点，因为客户端可能在 Session Timeout（会话超时）内重连到其他服务器。

### Session 与连接状态

- **是什么**：Session 是客户端与 ZooKeeper 服务之间有超时时间的逻辑会话，不等同于某一条固定 TCP 连接。
- **为什么需要**：客户端可以在服务器切换时保留身份、Watch 和临时节点，同时让集群识别真正失联的成员。
- **怎么工作**：客户端在服务器列表中连接一个节点并发送心跳；连接断开后尝试重连，超过协商后的超时时间则 Session Expired。
- **怎么看或怎么用**：客户端必须处理 `SyncConnected`、`Disconnected`、`Expired` 和认证失败等状态。
- **坏了怎么查**：检查 GC 停顿、网络抖动、CPU 饱和、Session Timeout、服务器延迟和客户端事件处理线程是否阻塞。

收到 `Disconnected` 时应进入保守模式，因为此时收不到 Watch；收到 `Expired` 后旧会话不可恢复，客户端必须新建会话并重新创建临时节点、注册监听。

### Watch 通知

- **是什么**：Watch 是服务端在 znode 数据或子节点变化时发给客户端的异步通知。
- **为什么需要**：避免客户端高频轮询配置和成员列表。
- **怎么工作**：普通 Watch 默认是 one-time trigger，即触发一次后需要重新读取并重新注册；3.6 起还支持 Persistent Watch 和递归 Watch。
- **怎么看或怎么用**：`get -w` 监听数据变化，`ls -w` 监听子节点变化；收到通知后重新读取当前状态。
- **坏了怎么查**：检查 Session 状态、是否重新注册、事件处理线程、Watch 数量和是否把通知误当成完整数据。

Watch 不是消息队列，也不保证把每次中间变化都当成独立事件交给业务。正确模式是“通知告诉你可能变了，然后读取最新状态”。

### Leader、Follower、Observer 与 Quorum

- **是什么**：Leader 负责协调写事务；Follower 参与投票并服务请求；Observer 同步数据但不参与投票；Quorum 是能形成多数派的投票成员集合。
- **为什么需要**：多副本必须对写入顺序达成一致，才能在节点故障后保持协调状态可靠。
- **怎么工作**：写请求被转交 Leader，Leader 提议事务，超过半数投票成员确认后提交；读取通常由客户端连接的服务器本地处理。
- **怎么看或怎么用**：逐台检查角色、当前 zxid、延迟和同步状态；验证存活的投票成员是否仍超过一半。
- **坏了怎么查**：反复选主先查 2888/3888 网络、DNS、时钟、磁盘延迟、GC 和 `myid`/`server.X` 一致性。

三台投票成员能容忍一台故障，五台能容忍两台。四台仍只能容忍一台，因此通常选择奇数投票成员。Observer 可以分担读请求，但不能增加可容忍的投票成员故障数。

### 一致性、zxid 与版本写入

- **是什么**：`zxid` 是 ZooKeeper 事务顺序标识；版本字段支持带版本更新，即 Compare-And-Set（比较后写入）。
- **为什么需要**：并发客户端必须知道谁先修改，并防止旧数据覆盖新数据。
- **怎么工作**：所有更新按统一顺序提交；客户端可用 `set -v VERSION` 只在版本匹配时更新。
- **怎么看或怎么用**：用 `get -s` 查看 `mZxid` 和 `dataVersion`，更新时携带已读取版本。
- **坏了怎么查**：出现 BadVersion 不要直接去掉版本检查，应重新读取、重新计算并决定是否重试。

ZooKeeper 的写入有全局顺序，但普通读取可能来自某个尚未追上最新事务的 Follower。需要在特定流程中确认最新视图时，应理解客户端库的 `sync` 语义，而不是把所有读取想象成数据库强制主库读。

### ACL、认证与传输安全

- **是什么**：ACL 是 Access Control List（访问控制列表），对 znode 定义 Create、Delete、Read、Write、Admin 五类权限，常缩写为 `cdrwa`。
- **为什么需要**：协调数据能影响整个集群，匿名写入或删除会造成大面积故障。
- **怎么工作**：客户端先按 digest、SASL 等方案认证，服务端再依据每个 znode 的 ACL 授权；TLS 用于保护网络传输。
- **怎么看或怎么用**：用 `getAcl` 检查权限，用受限服务身份访问业务根路径。
- **坏了怎么查**：`AuthFailed` 先查认证，`NoAuth` 先查 ACL 和身份映射；不要用 `skipACL` 当长期修复。

## 架构和数据流

```text
客户端
  -> 连接任一 ZooKeeper Server
  -> 读取：通常由当前 Server 返回本地视图
  -> 写入：转交 Leader 排序
  -> Follower 投票确认
  -> 多数派提交事务
  -> 各副本应用更新
  -> 相关客户端收到 Watch 通知
```

磁盘侧的数据路径：

```text
写事务
  -> Transaction Log 事务日志
  -> 内存数据树
  -> 周期性 Snapshot 快照
  -> 重启时由快照 + 后续事务日志恢复
```

`dataLogDir` 可把事务日志放到独立低延迟设备，`dataDir` 保存快照和 `myid`。生产环境还要避免交换分区导致 JVM 停顿。

## 安装与启动

### Docker 单节点学习环境

单节点只适合学习和开发，不具备复制或多数派容错。

```powershell
docker pull zookeeper:3.9.5 # 拉取与当前官方发布对应的 Docker Official Image
docker run -d --name zk-lab -p 2181:2181 zookeeper:3.9.5 # 启动单节点并暴露客户端端口
docker logs zk-lab # 查看启动日志，确认没有持续报错或退出
docker exec zk-lab zkServer.sh status # 正常应看到 standalone 模式和客户端端口
```

### 三节点生产结构

三节点必须分布在不同故障域。把三个容器放在同一台电脑只能学习协议，不能提供真实冗余。

```properties
tickTime=2000
dataDir=/var/lib/zookeeper
dataLogDir=/var/log/zookeeper-txn
clientPort=2181
initLimit=5
syncLimit=2
server.1=zk1.example.internal:2888:3888
server.2=zk2.example.internal:2888:3888
server.3=zk3.example.internal:2888:3888
```

每台服务器的 `dataDir/myid` 只写自己的数字，例如第一台写 `1`。`2888` 用于 Leader 与 Follower 同步，`3888` 用于选主通信，`2181` 用于客户端连接。

## 配置详解

```properties
tickTime=2000
# 基础时间单位为 2000 毫秒；心跳和多个超时参数都以它为单位

initLimit=5
# Follower 初次连接并同步 Leader 最多等待 5 个 tick，即本例 10 秒

syncLimit=2
# 正常运行时 Follower 与 Leader 通信最多落后 2 个 tick

dataDir=/var/lib/zookeeper
# 保存快照、myid；目录必须持久化并监控容量

dataLogDir=/var/log/zookeeper-txn
# 单独保存事务日志，生产环境宜使用独立低延迟磁盘

clientPort=2181
# 明文客户端连接端口；生产环境应评审 secureClientPort 和 TLS

autopurge.snapRetainCount=5
# 保留最近 5 份快照及对应事务日志，最低允许值是 3

autopurge.purgeInterval=24
# 每 24 小时执行一次自动清理；默认 0 表示关闭

metricsProvider.className=org.apache.zookeeper.metrics.prometheus.PrometheusMetricsProvider
# 启用官方 Prometheus MetricsProvider

metricsProvider.httpPort=7000
# 在 7000 端口暴露 Prometheus 指标

4lw.commands.whitelist=srvr,stat,mntr,ruok
# 只允许列出的四字命令，不要为了省事长期配置为星号
```

配置修改必须在同版本文档中确认。`reconfigEnabled` 默认关闭；动态增删成员涉及 Quorum 和授权，必须先在测试环境演练并准备回退。

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 关键参数或结果 | AIOps 场景 | 常见坑 |
|---|---|---|---|---|---|
| `zkCli.sh` | 连接命令行客户端 | `zkCli.sh -server zk1:2181,zk2:2181` | 连接成功后显示 `SyncConnected` | 验证客户端路径 | 只写一个地址降低故障切换能力 |
| `ls` | 查看子节点 | `ls -s /aiops` | 返回子节点和 Stat | 盘点成员、任务和配置路径 | 路径存在不代表数据正确 |
| `get` | 读取数据 | `get -s /aiops/config` | 返回内容、版本、zxid | 核对配置版本 | 把二进制内容当普通文本 |
| `create` | 创建节点 | `create -e /members/a online` | `-e` 临时，`-s` 顺序 | 注册在线实例、选主 | 请求结果不确定时盲目重试 |
| `set -v` | 带版本更新 | `set -v 3 /aiops/config v4` | 版本匹配才成功 | 防止配置并发覆盖 | BadVersion 后直接强制写 |
| `getAcl` | 查看 ACL | `getAcl /aiops` | 返回 scheme、id、权限 | 安全审计 | 根路径安全但子节点过度开放 |
| `sync` | 请求同步视图 | `sync /aiops/config` | 同步请求完成 | 对最新配置要求较高的检查 | 误以为普通读都来自 Leader |
| `zkServer.sh status` | 查看服务角色 | `zkServer.sh status` | standalone/leader/follower | 节点角色巡检 | 单节点正常不代表集群有多数派 |

四字命令 `ruok` 返回 `imok` 只表示进程处于非错误状态并监听客户端端口，不保证已加入 Quorum。运维应结合 `srvr`、`mntr`、AdminServer、Prometheus 指标和真实读写探针。

## 在 AIOps 中的作用

ZooKeeper 位于“平台依赖与协调状态”层：

- **指标**：请求延迟、未完成请求、连接数、Watch 数、znode 数、包收发、Leader 选举、快照和同步。
- **日志**：Session 过期、连接拒绝、选主、磁盘、认证和快照异常。
- **拓扑**：把 ZooKeeper Ensemble 与 HBase、SolrCloud、存量 Kafka 等上层依赖关联起来。
- **告警**：多数派风险、Follower 落后、延迟升高、磁盘不足、连接接近限制、选主频繁。
- **根因分析**：当多个上层系统同时异常时，优先判断是否共享同一个 ZooKeeper 故障域。
- **自动化**：只读诊断可以自动执行；成员变更、快照恢复和数据清理应保留审批、备份与回滚。

不要只告警“进程存活”。更有效的健康判断是：多数派存在、读写探针成功、延迟可接受、事务日志磁盘健康、上层 Session 稳定。

## 入门实验：节点、Watch 与会话

### 实验目标

在单节点环境中完成持久节点、临时节点、顺序节点和一次性 Watch 实验，亲眼看到 Session 与节点生命周期的关系。

### 实验步骤

1. 按前文命令启动 `zk-lab`。
2. 打开终端 A，进入交互客户端：

```powershell
docker exec -it zk-lab zkCli.sh -server 127.0.0.1:2181 # 打开终端 A 的 ZooKeeper 会话
```

3. 在终端 A 创建实验路径：

```text
create /aiops zero-to-aiops
create /aiops/config version-1
create /aiops/agents online-members
create -s /aiops/task- pending
create -e /aiops/agents/agent-01 online
ls -s /aiops
```

正常会看到类似 `Created /aiops/task-0000000000`，并能在 `/aiops` 下看到 `agents`、`config` 和顺序任务节点。

4. 在终端 A 注册普通 Watch：

```text
get -w /aiops/config
```

5. 打开终端 B，修改配置：

```powershell
docker exec zk-lab zkCli.sh -server 127.0.0.1:2181 set /aiops/config version-2 # 触发终端 A 的数据 Watch
```

终端 A 应出现 `NodeDataChanged`。再次从终端 B 执行 `set /aiops/config version-3`，普通 Watch 不会再次通知，因为它已经触发并移除。

6. 在终端 A 输入 `quit` 结束 Session，再从终端 B 查询：

```powershell
docker exec zk-lab zkCli.sh -server 127.0.0.1:2181 ls /aiops/agents # agent-01 应在会话关闭后消失
docker exec zk-lab zkCli.sh -server 127.0.0.1:2181 get -s /aiops/config # config 持久节点仍存在，内容为 version-3
```

### 验证结果

- 顺序节点名称带自动生成的递增数字。
- 第一次修改触发 Watch，第二次修改不会触发同一个普通 Watch。
- 终端 A 的会话结束后，临时节点 `agent-01` 消失。
- 持久节点 `/aiops/config` 继续存在。

### 如果没有成功

1. 容器退出：执行 `docker logs zk-lab`，先处理端口、磁盘或配置错误。
2. 客户端连接失败：检查容器是否运行、2181 端口和命令中的地址。
3. Watch 没显示：确认是在终端 A 执行了 `get -w`，并保持该会话在线。
4. 临时节点没消失：确认关闭的是拥有该节点的终端 A，会话可能需要短时间完成关闭处理。
5. 提示 NodeExists：先执行 `deleteall /aiops` 清理旧实验，再重新创建。

## 生产集群检查顺序

```text
上层应用报 ZooKeeper 错误
  -> 客户端 DNS / TCP / TLS / 认证是否正常
  -> Session 是 Disconnected 还是 Expired
  -> 每个 Server 进程、角色与端口
  -> 是否存在多数派和稳定 Leader
  -> 请求延迟、未完成请求、连接和 Watch 数
  -> CPU、GC、网络、磁盘延迟与剩余空间
  -> 事务日志、快照、配置与 myid 一致性
  -> 最近成员变更、升级和上层客户端变更
```

先保存日志、指标、`Stat` 和配置证据，再做重启、成员变更或数据目录操作。不要同时重启半数以上投票成员。

## 常见故障排查

### 集群没有 Leader

- **现象**：上层持续连接失败，节点反复进入 LOOKING，选主日志频繁出现。
- **检查**：存活投票成员数、2888/3888 双向网络、DNS、`myid`、`server.X`、磁盘和时钟。
- **处理**：先恢复能组成多数派的成员和网络，不要为了“凑数”临时复制数据目录或修改 ID。

### Session Expired 激增

- **现象**：临时节点消失，上层服务频繁重新注册或选主。
- **检查**：客户端/服务端 GC、网络抖动、请求延迟、Session Timeout 和事件线程阻塞。
- **处理**：消除长停顿和网络问题，确认客户端正确重建 Session；不能简单无限增大超时。

### 写请求延迟升高

- **现象**：配置更新和选主变慢，但部分读取仍然成功。
- **检查**：Leader 磁盘 fsync、事务日志设备、Follower 确认延迟、未完成请求、GC 和快照。
- **处理**：为事务日志使用稳定低延迟存储，减少资源争用，并通过压测验证改动。

### 磁盘持续增长

- **现象**：`dataDir` 或 `dataLogDir` 接近满，服务可能因无法写入退出。
- **检查**：快照、事务日志、autopurge、日志滚动、备份状态和实际磁盘占用。
- **处理**：先备份并确认恢复流程，再启用合理的自动清理；不要手工随意删除最新快照和日志。

### Watch 或连接过多

- **现象**：内存、连接数或通知压力升高，配置变化时出现尖峰。
- **检查**：客户端连接复用、Watch 注册路径、是否重复注册、znode 和连接指标。
- **处理**：复用客户端、收窄监听范围、修复重连重复注册，并评估 Persistent Recursive Watch 的放大范围。

### NoAuth / AuthFailed

- **现象**：能连上但无法读写，或认证后 Session 立即失败。
- **检查**：认证方案、账号、SASL/TLS、目标 znode ACL、父子节点权限和时钟。
- **处理**：修正身份与最小权限；修改 ACL 前先验证仍保留可管理路径，避免把所有管理员锁在外面。

## 与 etcd、Consul、Kafka 的边界

| 技术 | 主要定位 | 不应混淆的点 |
|---|---|---|
| ZooKeeper | 分布式协调和元数据 | 不是业务消息流或大数据存储 |
| etcd | 强一致键值存储，Kubernetes 控制面核心存储 | API 和 Watch 模型不同，不能直接替换现有 ZooKeeper 依赖 |
| Consul | 服务发现、健康检查、配置和服务网格能力 | 产品边界比纯协调服务更宽 |
| Kafka | 持久化事件流平台 | Kafka 2.8 引入 KRaft，现代 Kafka 可不依赖 ZooKeeper；存量集群仍需按版本处理迁移 |

选型先看上层产品官方支持，不要为了统一技术栈擅自替换其协调组件。

## 面试怎么讲

ZooKeeper 是分布式协调服务，核心抽象是树形 znode、Session 和 Watch。持久节点保存配置，临时节点表达在线成员，临时顺序节点可实现选主和锁。写入由 Leader 排序并经多数派提交，Follower 可服务读取；生产一般部署 3 或 5 个投票成员。排障时我先判断客户端会话和多数派，再看选主网络、事务日志磁盘、GC、连接/Watch 和最近变更。

## 学习检查清单

- [ ] 能解释 ZooKeeper 为什么不是普通数据库或消息队列。
- [ ] 能区分持久、临时和顺序节点。
- [ ] 能说明 Session 断开与过期的区别。
- [ ] 能解释普通 Watch 为什么要重新注册。
- [ ] 能计算 3、4、5 个投票成员各能容忍几个故障。
- [ ] 能说出 Leader、Follower 和 Observer 的职责。
- [ ] 能使用版本字段避免并发覆盖。
- [ ] 能完成节点、Watch 和会话实验。
- [ ] 能按多数派、网络、磁盘和 GC 路径排障。
- [ ] 能说明现代 Kafka 与 ZooKeeper 的版本边界。

## 面试题

1. ZooKeeper 的 znode 有哪些常见类型？
2. 临时节点在 TCP 断开后会立即删除吗？为什么？
3. 普通 Watch 能保证收到每一次中间变化吗？
4. 三节点与五节点 Ensemble 分别能容忍几台投票成员故障？
5. 为什么四节点不比三节点多容忍一个故障？
6. ZooKeeper 写请求为什么依赖多数派？
7. Follower 本地读取可能带来什么一致性注意事项？
8. 如何用临时顺序节点实现 Leader Election？
9. Session Expired 激增时如何定位？
10. `ruok` 返回 `imok` 为什么仍不能证明集群完全健康？

## 学习证据

完成后把以下内容提交到 GitHub：

- `compose.yaml` 或启动命令与使用的精确版本。
- 持久、临时、顺序节点的 CLI 记录。
- 一次 Watch 触发和重新注册说明。
- 一张 Leader/Follower/Quorum 写入数据流图。
- 一份脱敏后的 `zoo.cfg` 和字段说明。
- 一张 Prometheus/Grafana 监控截图。
- 一份 Session Expired、选主失败或磁盘延迟的故障复盘。

## 本文边界与下一步

本文覆盖从零到企业运维常用的 ZooKeeper 主线，不展开 ZAB 协议证明、客户端库源码、层级 Quorum 和跨地域部署细节。下一步结合 [Kafka](./kafka.md)、[微服务](../cloud-native/microservices.md)、[Prometheus](../observability/prometheus.md) 和 [RCA 根因分析](../sre-aiops/rca.md)，把协调服务接入完整的可观测与故障复盘链路。
