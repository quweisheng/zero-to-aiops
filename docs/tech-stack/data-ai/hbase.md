# Apache HBase 深讲

> 学习目标：从零理解 HBase 如何在 HDFS 上提供按 RowKey 的低延迟随机读写，能画出写入、读取、Region 定位、WAL 恢复、Flush、Compaction 和 Split 路径，能完成单机表操作与可回收故障实验，并能分析热点、RegionServer、ZooKeeper、HDFS、GC、Compaction 和复制问题。

## 官方资料

第一天先做单机表实验，不需要 Hadoop 集群。工具是 Windows PowerShell、Docker Desktop 的 Linux 容器与文本编辑器，预留至少约四 GiB 空闲内存和数 GiB 磁盘。只需补 [Docker](../cloud-native/docker.md) 的镜像、端口和容器概念；表与行的基本含义可读 [SQL](./mysql-sql.md)，但不要把关系数据库全部事务能力带入 HBase。

- [Apache HBase 官网](https://hbase.apache.org/)
- [Apache HBase 下载页](https://hbase.apache.org/downloads/)
- [Apache HBase Reference Guide](https://hbase.apache.org/book.html)
- [Apache HBase API](https://hbase.apache.org/apidocs/)
- [Apache HBase GitHub 仓库](https://github.com/apache/hbase)

版本边界：本文以 HBase 2.6.6 稳定线为主线。下载页可能同时列出 3.x Beta 或 Alpha，预发布版不应仅因为版本号更大就直接进入生产。生产必须核对 HBase、Hadoop、ZooKeeper、Java、客户端和协处理器兼容矩阵。

这个固定补丁是课堂标识，不是持续安全支持承诺。官网文档入口可能指向其他开发系列，查 API 和默认值时必须切换对应版本；上线仍需核对当时安全公告与受支持补丁。

## 官方知识地图

```text
Apache HBase（面向大规模行键读写的数据库）
  -> 数据模型：Namespace、Table、RowKey、Column Family、Qualifier、Cell、Version
  -> 客户端：Connection、Table、BufferedMutator、Scan、Filter
  -> 元数据：hbase:meta、ZooKeeper、Master Procedure
  -> 服务端：HMaster、RegionServer、Region
  -> 写路径：WAL、MemStore、Flush、HFile
  -> 读路径：BlockCache、MemStore、HFile、Bloom Filter
  -> 维护：Compaction、Region Split、Balancer、HBCK2
  -> 生产：HA、Replication、Backup、安全、容量、升级、监控
```

```text
基础层
  -> 理解 RowKey 和列族
  -> 完成 create/put/get/scan
  -> 看懂 Region、WAL、MemStore、HFile

进阶层
  -> 解释客户端定位与读写路径
  -> 设计 RowKey、预分区、容量和热点治理
  -> 分析 Compaction、GC、RegionServer 和 HDFS 故障
  -> 设计 HA、复制、安全、升级和回滚
```

## 场景开场

知识地图里的 Namespace 是命名空间，Qualifier 是列限定符，Cell 是单元格，Version 是时间戳版本。Connection 表示客户端连接管理对象，Table 是表操作接口，BufferedMutator 是缓冲批量写入器，Scan 和 Filter 分别是范围扫描与过滤条件。Master Procedure 是主控维护的管理流程，Balancer 是区域均衡器，HBCK2 是修复诊断工具，不是可无条件执行的自动修复命令。箭头表示学习顺序。

你需要保存数十亿条告警事件，查询模式是“按设备 ID 和时间范围取最近 100 条”。Hive 扫描适合离线聚合，但每次为了一个设备扫描大量文件并不合适。团队考虑 HBase，因为它可以按设计好的 RowKey 快速定位行范围。

上线后某台 RegionServer 负载长期比其他节点高，延迟抖动并伴随频繁 Compaction。问题可能不是“机器太小”，而是 RowKey 把连续写入全压到最后一个 Region，形成热点。

## 一句话人话版

`HBase = 建在 HDFS 上、按排序 RowKey 分片的分布式列族数据库，擅长海量稀疏数据的随机读写和范围扫描。`

## 小白可能会问

### HBase 是列式数据库吗

HBase 使用列族数据模型，但它与 ORC/Parquet 那种分析型列式文件不是一回事。HBase 面向按 RowKey 的在线读写；ORC/Parquet 面向大批量扫描和聚合。

### HBase 为什么依赖 HDFS

HBase 把持久化 HFile 放在 HDFS，借助 HDFS 副本和故障恢复。HBase 自己负责表、Region、WAL、内存写缓存和查询服务。HDFS 正常只是底层条件，不代表 HBase Region 一定在线。

### ZooKeeper 保存所有表数据吗

不保存。ZooKeeper 用于协调、Master 地址和 RegionServer 存活等小量状态；用户数据在 HFile，表与 Region 元数据由 HBase 管理并使用 `hbase:meta`。

### HBase 支持 SQL 吗

HBase 原生主要通过 Java API、Shell、REST/Thrift 等访问。Phoenix 等项目可提供 SQL 层，但其索引、一致性和运维边界要单独学习。

## 为什么要学

- AIOps 事件、设备时序、画像和明细可能需要按实体快速读取。
- HBase 把 RowKey 设计、分片、缓存和日志恢复结合在一起，是分布式存储面试高频题。
- Kafka/Flink/Spark 常把结果写入或读取 HBase。
- 热点、Compaction、GC 和 Region 移动能训练完整的证据链排障能力。

## 数据模型

| 概念 | 人话解释 | 设计影响 |
|---|---|---|
| Namespace | 表的逻辑分组 | 权限和命名边界 |
| Table | 行的集合 | 由多个 Region 承载 |
| RowKey | 行的唯一键，按字节排序 | 决定定位、范围扫描和热点 |
| Column Family | 一组一起配置和存储的列 | 数量应少，配置影响整个族 |
| Qualifier | 列族中的具体列名 | 可稀疏、可动态出现 |
| Cell | RowKey + Family + Qualifier + Timestamp 对应的值 | 一个逻辑列可保留多版本 |
| Version | 同一 Cell 的时间戳版本 | 会增加存储和 Compaction 成本 |

示例：

```text
RowKey: 07#host-001#20260723102000
  info:severity = critical
  info:message  = disk latency high
  metric:value  = 82.5
```

`07` 是散列前缀，用于把连续写入分散到多个 Region；它会增加跨前缀查询成本，所以必须从访问模式反推设计。

## 架构

```text
Client（客户端）
  -> ZooKeeper / cached meta location（协调服务与已缓存的元数据位置）
  -> hbase:meta 定位目标 Region
  -> RegionServer（区域数据服务进程）
       -> Region（连续行键范围的数据区域）
          -> WAL（预写日志）
          -> MemStore（内存写入缓冲）
          -> BlockCache（读取数据块缓存）
          -> HFile on HDFS（保存在 HDFS 的数据文件）

HMaster（区域管理主控进程）
  -> Region 分配、故障恢复、Schema、Balancer、Procedure

HDFS（分布式文件系统）
  -> NameNode + DataNode 保存 WAL/HFile
```

### HMaster

**是什么：** HBase 控制面，负责 Region 分配、Schema 变更、Balancer 和 Procedure。

**为什么需要：** Region 数量和节点状态不断变化，需要统一协调。

**怎么工作：** Active Master 执行管理 Procedure，Backup Master 等待接管；普通已定位读写不要求每次经过 HMaster。

**怎么看：** Master UI、Master 日志、Procedure 状态、RIT（Region In Transition）。

**坏了怎么查：** 看 ZooKeeper 会话、Active Master 选举、Procedure 卡点、HDFS、时间和 GC。不要因客户端仍可短时读写就认定控制面无影响。

### RegionServer 与 Region

RegionServer 承载多个 Region。Region 是一段连续 RowKey 范围，默认主区域由一个 RegionServer 提供强一致读写；启用区域只读副本时，还会有提供时间线一致读的副本，不能把它理解成任意节点都可同时写。

RegionServer 故障后，Master 根据 WAL 和元数据把 Region 重新分配到其他节点。恢复时间取决于 WAL Split、Region 数、HDFS、Master Procedure 和目标节点容量。

## 一次写入路径

```text
Client 定位 Region
  -> RegionServer 校验行和权限
  -> 追加 WAL（Write-Ahead Log，预写日志）
  -> 写入 MemStore
  -> 返回成功
  -> MemStore 达到阈值后 Flush 成 HFile
  -> 后台 Compaction 合并 HFile
```

WAL 先于 MemStore 成功是为了 RegionServer 崩溃后恢复尚未 Flush 的写入。WAL 和 HFile 都在 HDFS 上，但生命周期不同，不能手工删除“占空间的旧日志”。

## 一次读取路径

```text
Client 缓存的 Region 位置
  -> RegionServer（区域数据服务进程）
      -> MemStore（读取尚未刷写的内容）
      -> HFile（候选持久文件）
          -> Bloom Filter / Index（布隆过滤与索引缩小候选）
          -> BlockCache（已有块缓存）或 HDFS（读取数据块）
  -> 合并版本、删除标记和过滤条件
  -> 返回结果
```

图表示数据来源与合并关系，不是“缓存命中就永远不看内存新值”的固定顺序。实际读取由扫描器、缓存与文件元数据协作。

读慢要区分定位慢、RegionServer 排队、缓存未命中、HFile 太多、HDFS 慢、GC 或 RowKey 扫描范围过大。

## 一致性与原子性

- HBase 默认提供单行操作的强一致读写语义。
- 同一行内多个列可以通过单个 Mutation 保持行级原子性。
- 跨行事务不是 HBase 的通用默认能力。
- Secondary Replica 可用于时间线一致读取，但可能读到较旧数据，必须显式理解语义。
- 异步跨集群 Replication 通常不等于零 RPO 强同步复制。

面试不能简单回答“HBase 强一致”或“HBase 最终一致”，要说清操作、行范围、Replica 和跨集群场景。

## RowKey 设计

### 原则

1. 从主要查询模式倒推键，而不是从字段表顺序拼接。
2. 避免时间戳放在最左侧造成单调递增热点。
3. 控制长度，因为 RowKey 会出现在索引和每个 Cell 关联结构中。
4. 让需要范围扫描的数据相邻，同时避免单 Region 承担全部写入。
5. 需要预分区时，Split Key 必须匹配真实分布。

### 常见方案

```text
hash(device_id) % 16 # device_id # reverse_timestamp
```

优点是分散写入；缺点是查询某设备可能需要知道前缀算法，跨全部设备时间范围扫描要访问多个前缀。

## MemStore、Flush 与 Compaction

### Flush

MemStore 到阈值后写成不可变 HFile。Flush 太频繁可能说明写入碎片、内存配置或 Region 数不合理；太迟会增加内存和恢复压力。

### Minor Compaction

合并较小 HFile，降低读放大，不一定清除所有 Delete Marker 和过期版本。

### Major Compaction

重写 Store 的大量或全部 HFile，可清理过期版本和删除标记，但带来高 I/O、CPU 和网络压力。生产不能同时对大量 Region 强制 Major Compaction。

### Region Split

Region 变大后按 Split Key 拆成两个 Region。Split 不等于马上完成所有文件物理重写；过多 Region 会增加 Master、RegionServer 内存和恢复成本。

## BlockCache 与 Bloom Filter

BlockCache 缓存常用 HFile Block，提高热点读取命中率。Bloom Filter 用较小内存判断“某个文件大概率没有这个 Row/RowCol”，减少无效磁盘读取；它可能有假阳性，但不应有假阴性。

调优要看命中率、工作集、GC/Off-heap、HFile 数和访问模式，不能只把缓存调大。

## 常用 Shell 命令

```ruby
status 'detailed'                                                # 查看 Master、RegionServer、Region 等状态
list                                                             # 列出当前可见表

create 'alerts', {NAME => 'info', VERSIONS => 2, BLOOMFILTER => 'ROW'} # 创建列族并保留两个版本
put 'alerts', '07#host-001#20260723102000', 'info:severity', 'critical' # 写入一个 Cell
put 'alerts', '07#host-001#20260723102000', 'info:message', 'disk high' # 同一行写另一个列

get 'alerts', '07#host-001#20260723102000'                       # 按 RowKey 点查
scan 'alerts', {ROWPREFIXFILTER => '07#host-001#', LIMIT => 10}  # 限定该设备前缀并最多返回十行
describe 'alerts'                                                # 查看列族配置
count 'alerts', INTERVAL => 1000                                 # 小实验计数；大表生产慎用
```

高风险命令：`disable`、`drop`、`truncate`、`major_compact`、`move`、`split` 和 HBCK2 修复都必须先确认环境、影响、备份和回滚。

## 配置重点

```xml
<configuration>
  <property>
    <name>hbase.rootdir</name>
    <value>hdfs://nameservice1/hbase</value>
  </property>
  <property>
    <name>hbase.zookeeper.quorum</name>
    <value>zk1,zk2,zk3</value>
  </property>
  <property>
    <name>hbase.cluster.distributed</name>
    <value>true</value>
  </property>
</configuration>
```

`hbase.rootdir` 决定数据根路径，改错可能让集群像“空集群”一样启动；`hbase.zookeeper.quorum` 必须使用实际仲裁集群的正确地址。生产通常选择奇数投票成员提高资源利用效率，并非偶数成员在协议上绝不能工作；生产分布式模式不能照搬单机实验值。

## 入门实验：构建官方发布包单机 HBase

HBase 没有与 Spark/Flink 相同形式的 ASF 官方 Docker 镜像。实验使用 Apache 官方二进制发布包，加通用 Java 基础镜像构建；这比使用来源不明的第三方镜像更容易说明软件来源。

### 下载并验证

```powershell
if (Test-Path -LiteralPath .\hbase-lab) { throw '课堂目录已存在，请先核对归属' }
docker ps -a --filter 'name=^/hbase-lab$'
Get-NetTCPConnection -LocalPort 16010 -State Listen -ErrorAction SilentlyContinue
# 同名容器或端口有输出时先停止，不删除未知对象
New-Item -ItemType Directory -Path .\hbase-lab
Set-Location .\hbase-lab

curl.exe --fail --location --output hbase-2.6.6-bin.tar.gz `
  https://dlcdn.apache.org/hbase/2.6.6/hbase-2.6.6-bin.tar.gz
curl.exe --fail --location --output hbase-2.6.6-bin.tar.gz.sha512 `
  https://downloads.apache.org/hbase/2.6.6/hbase-2.6.6-bin.tar.gz.sha512

$checksumText = Get-Content .\hbase-2.6.6-bin.tar.gz.sha512 -Raw
$expected = (($checksumText -replace '^[^:]+:\s*', '') -replace '\s', '').ToLower()
$actual = (Get-FileHash .\hbase-2.6.6-bin.tar.gz -Algorithm SHA512).Hash.ToLower()
if ($actual -ne $expected) { throw 'HBase SHA512 mismatch' }
```

Apache 的校验文件是“文件名 + 冒号 + 多行分组哈希”，所以上面的命令先去掉文件名前缀，再删除换行和空格。不要只取第一段文本，否则拿到的是文件名而不是 SHA512。

### Dockerfile

```dockerfile
FROM eclipse-temurin:17-jdk-jammy

COPY hbase-2.6.6-bin.tar.gz /tmp/hbase.tar.gz
RUN mkdir -p /opt/hbase /data/hbase /data/zookeeper \
    && tar -xzf /tmp/hbase.tar.gz --strip-components=1 -C /opt/hbase \
    && rm /tmp/hbase.tar.gz

ENV HBASE_HOME=/opt/hbase
ENV PATH=/opt/hbase/bin:$PATH

COPY hbase-site.xml /opt/hbase/conf/hbase-site.xml
EXPOSE 16010
CMD ["bash", "-lc", "start-hbase.sh && tail -F /opt/hbase/logs/*master*.log"]
```

### 单机配置

```xml
<configuration>
  <property>
    <name>hbase.cluster.distributed</name>
    <value>false</value>
  </property>
  <property>
    <name>hbase.rootdir</name>
    <value>file:///data/hbase</value>
  </property>
  <property>
    <name>hbase.zookeeper.property.dataDir</name>
    <value>/data/zookeeper</value>
  </property>
  <property>
    <name>hbase.unsafe.stream.capability.enforce</name>
    <value>false</value>
  </property>
</configuration>
```

最后一个配置只因为实验使用 `file://` 本地文件系统：它不支持 WAL 所需的 `hflush/hsync` 能力。关闭检查会让你失去进程或节点故障时的数据持久性保证，**绝不能照搬到生产**；生产应使用满足能力要求的 HDFS 等可靠存储，并保留检查。

### 构建、启动和验证

```powershell
docker build --tag hbase-lab:2.6.6 .
docker run --detach --name hbase-lab --memory 2g --publish 127.0.0.1:16010:16010 hbase-lab:2.6.6
docker logs hbase-lab
docker exec -it hbase-lab hbase shell
```

在 Shell 执行前面的 `create`、`put`、`get` 和 `scan`。打开 `http://localhost:16010`，确认 Master、Server 和 Region 状态。

### 如果没成功

1. SHA512 是否匹配，压缩包是否完整。
2. Docker 构建日志是否显示 Java/HBase 解压成功。
3. `docker logs hbase-lab` 是否有端口、目录权限或 Java 错误。
4. `docker exec hbase-lab jps` 是否能看到 HMaster，并在 Shell 执行 `status 'simple'` 确认 Master 真正可服务；进程存在不等于初始化成功。
5. 单机模式只用于学习，不能据此证明 ZooKeeper/HDFS/RegionServer 生产拓扑正常。

## 故障注入实验：禁用表

### 边界

只对本地 `alerts` 实验表操作。生产禁用表会中断业务，必须审批和确认调用方。

### 注入

```ruby
disable 'alerts'                                                  # 暂时让实验表离线
get 'alerts', '07#host-001#20260723102000'                        # 预期报 TableNotEnabledException
```

### 证据与假设

执行 `is_enabled 'alerts'`、`is_disabled 'alerts'`，结合 Master UI 确认是表状态导致请求失败，而不是 HDFS 数据丢失或 RegionServer 退出。

### 修复与验证

```ruby
enable 'alerts'                                                   # 恢复实验表在线
get 'alerts', '07#host-001#20260723102000'                        # 应重新读到 severity 和 message
```

### 清理

先在 HBase Shell 输入 `exit` 回到宿主机终端，再执行下列容器清理。没有挂载外部数据卷，删除容器会移除本课写入的表和单机协调状态；需要保留时先只停止容器。不要在 Shell 里直接粘贴 Docker 命令。

```powershell
docker rm --force hbase-lab
Set-Location ..
```

保留校验值、建表脚本、Shell 输出和故障记录；下载包和本地镜像可按磁盘情况清理。

## 高可用与故障恢复

- HMaster 部署 Active/Backup，ZooKeeper 协调 Active。
- RegionServer 无共享本地用户数据，持久数据与 WAL 在 HDFS，但 Region 恢复需要时间。
- HDFS NameNode/DataNode 自身必须高可用并满足容量与副本要求。
- ZooKeeper 使用独立、稳定的奇数节点仲裁，避免与高负载服务争抢磁盘。
- 跨集群 Replication 用于灾备和数据分发，必须监控 lag、队列、丢失和冲突语义。
- 备份恢复与复制不是一回事；误删会被复制到对端，仍需要快照/备份。

## 容量与性能

### Region 数量

Region 太少会限制并行和形成热点；太多会增加内存、Store、WAL、Master 元数据和故障恢复开销。依据数据量、写入、节点内存、列族数、HFile 和恢复目标估算。

### 列族

一个 Region 中每个列族都有独立 Store/MemStore/HFile。列族过多会放大 Flush、Compaction 和文件数量。把生命周期与访问模式相近的列放在同一族。

### 热点

观察每 Region 请求率、写入字节、队列、Flush、Compaction 和节点负载。如果某个 RowKey 范围集中，增加机器不一定自动分散已经形成的键模式。

### GC

BlockCache、MemStore、RPC、Cell 对象和 Compaction 都消耗内存。GC 长暂停会导致 ZooKeeper Session 超时和 RegionServer 被判失联。需要关联 Heap、GC Log、RPC Queue 和系统 I/O。

## 安全

- Kerberos 认证集群与用户身份。
- HBase ACL 控制 Namespace/Table/Column Family 权限。
- HDFS 权限不能替代 HBase API 权限，客户端也不应直接操作 HBase 根目录。
- RPC/TLS、静态加密、密钥管理和审计按发行版能力落地。
- 禁止把 Kerberos Keytab、ZooKeeper 地址、RowKey 样本和业务 Cell 原值提交到公开仓库。

## 可观测性与 AIOps

重点指标：

- RegionServer read/write request rate、p95/p99 latency。
- RPC queue、handler utilization、Call Queue Too Big。
- MemStore Size、Flush Queue、Flush Time。
- BlockCache hit ratio、eviction、failed insert。
- StoreFile Count、Compaction Queue、Compaction Time。
- Region Count、RIT、Region Move/Split。
- WAL append/sync latency、Replication lag。
- JVM Heap、GC pause、线程、进程文件句柄。
- HDFS latency、missing/under-replicated block。

```text
cluster + namespace + table + region + regionserver
  + column_family + operation + client
  + deploy_id + schema_version + hdfs_node
```

AIOps 可识别热点、Compaction 风暴、RegionServer 异常和复制积压，但自动 Move/Split/Major Compaction 风险高，应先生成建议和证据，再审批执行。

## 常见故障排查

### 单个 RegionServer 延迟高

先看该节点 Region/请求分布、热点 RowKey、RPC Queue、GC、Flush/Compaction、磁盘和 HDFS，再比较同集群其他节点。

### Region 长期处于 Transition

看 Master Procedure、RegionServer 状态、`hbase:meta`、WAL Split、HDFS 和 ZooKeeper。不要直接修改 `hbase:meta`；优先使用受支持的 HBCK2 流程并准备备份。

### Compaction Queue 持续增长

比较写入速度、Flush、HFile 数、磁盘吞吐和 Compaction 配置。强制 Major Compaction 可能让问题更严重。

### 读到旧值

检查时间戳版本、客户端 API、过滤条件、Replica 读取策略和跨集群复制；不要先归因“缓存没刷新”。

### 写入超时

沿 Client -> Region 定位 -> RPC Queue -> WAL Sync -> MemStore -> HDFS 检查。WAL 慢、Region 移动和热点都可能表现为写超时。

### ZooKeeper Session Expired

关联网络、GC 停顿、ZooKeeper 延迟、Session Timeout 和节点负载。单纯增大超时可能延长真实故障发现。

## 扩容、升级与回滚

扩容前估算 Region 分布和网络迁移；加 RegionServer 后 Balancer 才可能移动 Region。缩容先优雅下线并验证 Region 转移，不能直接关机。

升级检查：

1. 阅读兼容矩阵和发布说明。
2. 备份、快照并验证恢复。
3. 检查 HFile/WAL 格式、协处理器和客户端兼容。
4. 在测试集群完成滚动/停机方案演练。
5. 设定错误率、RIT、延迟、Compaction 和 Replication 回滚阈值。
6. 不可逆格式升级前明确回滚只能恢复备份或旧集群。

## 生产事故题：写入延迟突然升高

现象：集群整体 CPU 不高，但一个 RegionServer 写 p99 达 15 秒，Compaction Queue 和 StoreFile Count 上升。

处理：

1. 控制影响，限制低优先级批写并保留指标。
2. 按 Table/Region 分解请求，确认是否热点。
3. 对比 WAL Sync、Flush、Compaction、GC 和 HDFS I/O。
4. 检查最近 Schema、TTL、版本数、批写并发和 RowKey 变更。
5. 根据证据选择限流、修复 RowKey、预分区、调度 Compaction 或扩容。
6. 评估 Region Move/Split 的网络和缓存失效影响，准备停止变更和回退客户端。

## 系统设计题

设计一个每天新增 50 亿条设备事件、保留 180 天、按设备读取最近 100 条的 HBase 平台。

必须说明 RowKey、散列前缀、反向时间、列族、TTL、版本数、预分区、Region/节点估算、HDFS 副本、Master/ZooKeeper HA、Replication、备份、安全、热点监控、扩容和升级。

## 选型取舍

- HBase：低延迟 RowKey 点查/范围扫描、稀疏宽表、持续写入。
- Hive/Spark：大范围扫描、Join、聚合和离线分析。
- Cassandra：无 HDFS 依赖、对称节点模型和不同一致性取舍。
- Elasticsearch：全文检索和倒排索引，不应用作 HBase 的通用替代品。
- 关系数据库：复杂事务、二级索引和关联查询更自然，但水平扩展模型不同。

## 面试怎么讲

### 30 秒版本

HBase 是构建在 HDFS 上的分布式列族数据库，按有序 RowKey 把表切成 Region。写入先追加 WAL 再写 MemStore，Flush 形成 HFile；读取合并 BlockCache、MemStore 和 HFile。生产重点是 RowKey 热点、Region 数、Flush/Compaction、GC、ZooKeeper/HDFS 依赖和跨集群复制。

### 3 分钟版本

我会从按设备查询最近告警说明键设计。行键按字节排序，连续范围形成区域，客户端先定位区域再直接访问负责的数据服务节点。主控负责管理与故障恢复，不是每次普通读写都要经过的数据代理。

写入按持久性配置记录预写日志并进入内存缓冲，刷写后形成持久文件；读需要合并内存、缓存和文件中的版本与删除标记。后台合并减少文件数量和读放大，却消耗存储带宽。单行原子性不能扩大成跨行事务，时间线副本读取和跨集群异步复制也有不同的新鲜度保证。

生产排障先按区域分解热点、请求队列、日志同步、刷写、合并和垃圾回收，再看底层存储。扩容之前核对行键是否允许负载分散；升级之前验证客户端、文件格式和扩展兼容，保留可恢复备份。课堂禁用再启用表只证明对象状态恢复，不证明多节点容灾。

## 递进面试题

### 1. HBase 写成功为什么要先写 WAL

为了在 MemStore 尚未 Flush 时仍可恢复已确认写入。追问要说明 WAL Sync 延迟会直接影响写延迟，删除 WAL 会破坏恢复。

### 2. RowKey 为什么会热点

Region 按连续键范围分片，单调递增键会把新写入集中到末端 Region。解决要兼顾查询，不能只随机 UUID 导致范围查询失效。

### 3. Minor 与 Major Compaction 区别

Minor 合并部分小文件；Major 重写更完整的 Store 文件并清理过期/删除数据，资源冲击更大。

### 4. HMaster 挂了读写会怎样

已定位 Region 的普通请求可能继续，但 Region 分配、Schema、Balancer 和故障恢复受影响。客户端缓存失效或 Region 变化时影响扩大。

### 5. HBase 与 Hive 怎么组合

HBase 服务在线随机访问，Hive/Spark 对历史数据做大范围分析；组合要考虑 Snapshot、Connector、负载隔离和一致性，不要让离线全表扫描拖垮在线 RegionServer。

## 学习检查清单

- [ ] 我能解释 RowKey、列族、Cell 和 Version。
- [ ] 我能画出读写路径和 Region 定位过程。
- [ ] 我能解释 WAL、MemStore、HFile、Flush 和 Compaction。
- [ ] 我能完成 create/put/get/scan 实验。
- [ ] 我能恢复表被禁用的实验故障。
- [ ] 我能分析热点、RIT、GC、Compaction 和 HDFS 故障。
- [ ] 我能设计 HA、复制、备份、安全、容量和升级方案。

## 老师带你从查询问题倒推 RowKey

先不讨论集群多大。用户要“某设备最近一百条告警”，你就要让这台设备相关记录在键的排序中靠近。RowKey（行键）按字节顺序排列，不会理解字符串里的数字大小；未经补齐的 `host-2` 和 `host-10` 排序，可能与直觉不同。编码、长度、分隔符和时间表示都属于表设计。

学生：“最前面放时间，写入不是很方便吗？”老师：“方便找到最后一个区域，也可能把所有新写入都压在那里。”Region（区域）按连续键范围切分，单调递增前缀容易形成尾部热点；用设备哈希前缀分散写入，又会增加跨设备时间扫描的成本。这里没有一个对所有查询都最优的键。

请先写三条访问需求：单设备点查、单设备时间范围、全设备某日统计。前两类可以由 RowKey 支持，第三类可能交给 Spark/Hive 分析链更合适。为了一个少见报表破坏全部在线写入分布，通常不值得。预分区也必须匹配真实键分布，否则很多 Region 空着，热点仍在一个区域。

### 一条写入为什么会在内存和文件里都留下痕迹

WAL（写前日志）提供恢复凭据，MemStore（内存写缓冲）提供近期数据访问，Flush（刷写）把缓冲写成 HFile（持久数据文件）。这些不是三份独立业务真相，而是同一写入在存储生命周期里的不同表示。关闭 WAL 来求吞吐会改变崩溃后的数据保障，必须明确 durability（持久性）边界。

HFile 主要不可变，因此更新产生新版本，删除常产生 tombstone（删除标记），读时需要合并版本与可见性。Compaction（文件合并整理）逐步减少文件数量并按规则清理过期版本与删除标记；它消耗读写带宽，所以大量短小 Flush 可能在后面变成压缩整理压力。

Bloom Filter（布隆过滤器）帮助判断某键是否可能存在于文件。它允许误判“可能存在”，但在正常配置语义下用于排除不可能项；它不会代替数据读取，也不会让任意条件过滤都变成索引查询。Scan 上加 Filter 可能只是减少返回结果，不能据此推断服务器扫描量很小。

### 读写故障怎样建立证据链

沿前文基础实验的同一个教学表，写入相同行键的不同时间戳版本，读取时指定需要的版本数量，观察返回；再按前文故障实验制造教学错误并恢复。记录 RowKey、列族、版本配置和查询范围。这里观察的是行与单元格语义，不能把一次 get 成功当成整个集群一致性验证。

当读延迟升高，先分清 Region 定位、RegionServer 排队、缓存未命中、HFile 数量、HDFS 读取和 GC。缓存命中降低可能来自扫描污染；某 Region 长期忙而其他空闲可能是键分布；所有 Region 同时抖动则检查共享存储和网络。每个假设都要对照相应指标，而不是先移动全部 Region。

RegionServer 退出后，HMaster 协调日志恢复与区域重新分配。故障恢复时间受日志量、区域数、元数据操作、底层文件系统和目标节点余量影响。HDFS 副本完整不代表 Region 已提供服务，Region 在线也不代表每条客户端重试都安全。幂等写要考虑业务键和版本，跨行流程需另设一致性方案。

### 面试课堂：从“强一致”继续追问

30 秒先说明按有序行键分片、行级操作一致性和在线随机读写价值。3 分钟画客户端定位、WAL/MemStore、Flush/HFile、缓存读取与故障恢复，接着解释键设计、合并整理和热点取舍。

追问“两个设备状态能同时提交吗”：单行原子性不能直接推广为跨行事务。追问“表多列为什么不多建列族”：列族影响独立存储和维护成本，数量应根据访问与生命周期，而不是把每个业务字段都建成列族。追问“升级如何回滚”：验证 HBase、Hadoop、Java、客户端和扩展兼容，保留备份与恢复证据，不能只依赖旧安装包。

生产设计题可选设备告警库，给出查询比例、键编码、预分区、版本保留、缓存与磁盘预算、跨故障域和恢复目标。事故复盘用热点区域的输入速率、合并整理、GC 和读取延迟组成时间线，再证明修复后负载分布与业务延迟改善。

## 机制继续讲：一条 Get 到底读了哪些地方

客户端先通过元数据与位置缓存找到目标 RowKey 所属 Region，再向负责该区域的 RegionServer 请求。数据可能在内存 MemStore，也可能已经写成多个 HFile；读取需要结合这些来源、版本、删除标记与过滤规则，返回符合条件的结果。Region 迁移或拆分后，旧位置缓存失效，客户端需要重新定位，因此短暂位置异常不应直接归为数据丢失。

BlockCache（数据块缓存）减少反复从存储读取，Bloom Filter（布隆过滤器）帮助排除某些肯定不存在的候选块或文件。布隆过滤器可能有误判，不能当成真正的存在性答案；缓存命中高也不能证明所有业务请求快，因为未命中读、范围扫描和 compaction 竞争仍可能拖慢尾部。先按请求类型区分 Get、短 Scan 和长 Scan，再解释指标。

## 数据语义课堂：RowKey、列族、限定符和版本

你可以把 RowKey 看成抽屉编号，Column Family（列族）是固定的大分格，Qualifier（列限定符）是格子里的具体字段名。列族属于表设计的重要存储边界，不能因为字段很多就给每个字段建一个列族；动态字段可以放在合理设计的限定符中，但数量、宽行和访问模式仍要控制。

Cell（单元格）由行、列族、限定符和版本时间等共同定位。写入同一个行列不必意味着旧值立即物理消失，读取版本数、保留策略与时间戳影响可见结果。应用自定义时间戳时，时钟偏差与重复写入会改变版本选择；不要把任意客户端时间当成严格全局业务顺序。关键状态最好有明确的业务版本或条件更新规则。

删除通常先留下删除标记，后续读取据此隐藏旧版本，物理文件回收要等相应维护条件。于是“已经删除”和“磁盘立即下降”是两件事。手工删除 HFile 试图加快空间回收可能造成损坏；排障先看保留、版本、快照、compaction 和复制状态，按照目标版本的支持流程处理。

### 原子性边界要说完整

HBase 主要强调行级别操作的一致性能力，不能把它默认理解成任意多行、任意多表关系事务。一次修改同一行的若干列，与同时更新两个独立行的业务约束是不同问题。跨行转移资源、扣减余额等需求必须另做一致性设计，或选择更适合关系事务的存储。

条件修改可表达“只有当前版本仍是旧值，才写入新值”。它比应用先读再无条件写更适合保护行内状态迁移，但不能自动保护另一个外部工单系统。重试 Increment（增量计数）或 Append（追加）这类非覆盖写操作时，要核对客户端去重机制与具体失败边界，不能像普通幂等覆盖写那样任意重发。

## 查询设计课堂：Filter 不等于二级索引

Scan 的起止行范围决定先看哪一段键空间，Filter（过滤器）决定在被访问的数据里保留哪些结果。一个过滤条件可以减少返回网络量，却未必减少读取范围。如果按“严重等级为 critical”查询，但严重等级不在行键访问路径里，也没有额外索引，仍可能扫描很多无关行。

反向时间编码可以帮助“某设备最近记录”的访问，但必须明确固定宽度与排序规则，并解释单设备热点。加盐分散写入后，按原业务范围查询可能需要同时扫多个盐桶，再合并排序和限量；这是写分散换读取复杂度，不是免费优化。选择 RowKey 时要把所有主要读写写成例子，估算放大倍数。

如果需要丰富 SQL 查询，可以评估上层查询系统或离线分析链，但它们各有索引、事务与运维边界。不要因为某层支持 SQL 就假设底层变成普通关系数据库。对 AIOps 来说，按设备快速保存时间序列状态与全量跨设备报表可能是两条不同链路，职责分清后更容易控制延迟与成本。

## 运维推理：为什么写入堵住，读还勉强正常

写入进入 WAL（预写日志）与 MemStore，内存到阈值后 Flush（刷写）形成文件。文件越多，读取合并成本增加，因此 Compaction（文件合并整理）继续合并并处理满足条件的旧数据。写入、刷写与合并是连续生产线，任何一段长期跟不上，都会累积压力。

假设小文件数量增加、合并队列上升、磁盘吞吐接近上限，随后写入受阻。这时调大 MemStore 只能推迟刷写，还可能使一次刷写更大；增加应用并发又会加快积累。先限制非关键写入，确认磁盘与合并能力、热点 Region 和后台任务，再选择容量或表设计调整。

强行对全表做大规模合并可能抢占正常业务 I/O，触发更多长尾，不适合把它写进无条件自动修复。恢复验证要同时看写延迟、文件数趋势、合并积压、Region 分布和业务查询。快照引用、历史保留与复制责任也可能影响空间回收，不能只看一次 major compaction 执行完成。

## 实验复盘与面试进阶

前文禁用表的故障实验用来训练“服务进程正常但对象不可服务”的区分。执行前保存表状态、样例行与查询结果，禁用后观察明确对象错误，恢复启用后查询同一行验证内容。不要把容器重建后重新插入样本叫作原表恢复；这改变了需要证明的事实。

面试官若追加 RegionServer 故障，先说客户端定位变化、Region 接管、WAL 恢复与重试，再说明底层存储、元数据和客户端超时也是依赖。追问备份，说明复制会复制误操作，快照、导出与跨故障域恢复需按方案验证。最后给出 RowKey 访问模式、行级一致性和 compaction 预算的取舍，明确本课单机禁用表未验证多节点故障容忍。

## 深入课堂：从行键的每一个字节推到恢复目标

### 先把查询写成范围，再决定编码

“查设备甲最近一百条”包含设备等值、时间排序和数量上限三个条件。设备放在前缀使相关记录相邻，固定宽度时间保证字节顺序与设计一致；如果使用反向时间，最新值排在前面。编码方案要规定时区、精度、分隔符转义和字段长度，否则不同客户端可能写出不兼容的键。

加盐并不是一定要多扫全部盐桶。若盐由设备编号稳定计算，查询已知设备时可以直接得到桶；若盐按事件随机生成，为查一个设备就可能需要跨桶合并。前者无法分散单个超级设备的全部写入，后者牺牲读取简单性。应该说明自己用了哪一种，而不是只说“加盐解决热点”。

假设十六个桶对应十六段预分区，实际客户端却生成没有补齐的十六进制前缀或另一种编码，预切分边界可能与写入分布不匹配。上线前用真实编码器生成样本，按字节排序查看每个范围覆盖多少，而不是看打印出来像有十六种就认为均匀。

预分区只提供潜在并行范围，不保证这些范围已经均匀放到节点，也不能把一个行拆成多份并发写。超宽行或单行计数热点仍需要业务建模。将所有设备计数放在同一行，可能得到行内原子性，却主动放弃了跨行分散能力。

### 单行原子性到底让你可以做什么

一次同一行的多列修改可以作为一个行级操作原子呈现，适合保存设备状态与状态版本。两个独立请求先写严重度、再写说明，却不是天然同一操作；另一个读取可能落在中间，看到业务不一致的组合。客户端应把需要一起变化的列组织成同一受支持操作。

扫描也不是默认给整张表拍一个全局事务快照。并发写入时，跨多行扫描可能看到不同时间推进的行，即使每一行自身的读写是正确的。需要严格跨表一致报表时，应选择明确快照或离线导出方案，不能把单行强一致直接推导成全库快照隔离。[官方原子性边界](https://hbase.apache.org/acid-semantics/)。

条件更新可以要求当前状态版本等于预期值再写入，避免两个处理者相互覆盖。失败表示前置条件已经不成立，应该重新读取并决定是否仍需要操作，不是无条件再次覆盖。若同时还要修改另一行或调用外部工单接口，就重新进入跨系统一致性问题。

写请求超时尤其要谨慎。服务器可能已经完成写入，只是响应丢失。普通带稳定行列与固定时间戳的覆盖写，与增量计数的重试后果不同；后者重复执行会改变数值。应核对具体客户端的重试和去重能力，必要时用业务操作编号协调，不能假定所有写接口都天然幂等。

### 版本实验：看见两个值不代表有两条业务行

仍在同一个新建教学容器的 HBase Shell，前面的 `alerts` 表列族已经配置保留两个版本。下面只写一条专用课堂行，显式给出两个毫秒时间戳，避免依赖两次命令恰好发生在不同毫秒。先确认不存在这条行；如果已有数据则换新的课堂行名。

```ruby
get 'alerts', 'lesson-version-row'
put 'alerts', 'lesson-version-row', 'info:severity', 'warning', 1700000000000
put 'alerts', 'lesson-version-row', 'info:severity', 'critical', 1700000001000
get 'alerts', 'lesson-version-row', {COLUMN => 'info:severity', VERSIONS => 2}
```

预期能看到同一行同一列的两个版本，较新时间戳对应严重告警。它仍是一行，不是两条不同设备事件。读取默认版本与请求两个版本的结果不同，因此排查“旧值还在”时先看读取选项和列族保留，而不是立即怀疑复制延迟。

故障注入是再次使用较旧时间戳写入信息级别，然后读默认最新版本，预期仍为严重告警。你不能靠命令执行时间判定值新旧，因为版本选择使用的是单元格时间戳。修复实验输入需使用明确的新版本时间戳，或重新审视业务是否应该自己提供时间戳。

```ruby
put 'alerts', 'lesson-version-row', 'info:severity', 'info', 1700000000000
get 'alerts', 'lesson-version-row'
put 'alerts', 'lesson-version-row', 'info:severity', 'resolved', 1700000002000
get 'alerts', 'lesson-version-row'
```

预期最后返回 `resolved`。这只是合成状态词，不代表正式告警级别枚举。验证记录行键、请求时间戳与实际返回时间戳，若不符合预期先看列族是否还是两版本、表是否启用、是否配置额外过期策略。实验表没有设置 TTL，不能把旧时间戳直接复制到已设置短保留期的生产表。

清理可随本课容器一起删除，无须对其他行执行删除。若保留容器继续学习，可以在 Shell 中使用 `deleteall 'alerts', 'lesson-version-row'` 删除这条经确认的合成行，再查询应为空；这是逻辑删除，不承诺磁盘立即减少。不要用表级清空替代这一行清理。

### 时间戳、过期和删除标记的组合风险

版本时间戳是存储可见性的一部分，不自动等于业务发生时间。客户端误写未来时间戳，可能让正常后续写看起来更旧；误写很老的时间戳，在设置过期策略时可能很快不可见。业务事件时间可以保存在普通字段，是否同时用作版本时间要有明确理由。

删除标记会影响被覆盖范围内的版本可见性，但不同删除操作指定的列、版本或时间范围不同。重放历史数据时若没有理解删除语义，可能无法看到刚写回的旧时间版本。恢复流程要验证读取结果，而不是只统计写命令成功次数。

保留多个版本不是完整审计机制。版本数上限、过期、合并整理和删除都会影响长期历史；同一时间戳再次写入还可能覆盖对应版本。真正不可删减的审计应有独立保留合同、权限和导出恢复路径，不能只把版本数调大就宣称满足审计要求。

### 读放大、写放大与空间放大怎么观察

一次点查可能访问多个持久文件，称为读放大；后台合并把已有数据再次读取和写入，形成写放大；多版本、删除标记、快照引用与临时文件让物理占用高于当前有效值，形成空间放大。三个放大相互关联，但不能用一个缓存命中率概括。

如果写入短时间很碎，刷写形成许多小文件，读请求合并成本上升，后台整理又占用磁盘。增加缓存可能帮助热点读取，却不能消除持续产生的小文件。应沿写入批量、区域数量、内存压力、刷写与合并能力判断，而不是把所有延迟都当作缓存不够。

长范围扫描还可能污染热点缓存。在线设备点查依赖的块被大批离线扫描挤出后，即使扫描结束，热点读也需要重新暖缓存。可评估扫描缓存策略、独立查询时间窗或离线读取快照，但具体参数与一致性代价要按访问接口验证，不能直接全局关闭缓存。

布隆过滤器回答“这个候选是否肯定不含目标”的排除问题，不负责找到记录位置，更不能解决任意严重度筛选。扫描返回十条并不保证只读十行：过滤条件稀疏时可能扫描很多候选。应同时观察扫描字节、服务端处理时间和返回行数。

### 写缓冲与异步客户端也要有确认边界

BufferedMutator 将多个写入先放客户端缓冲以提高吞吐，应用函数返回与服务端已确认全部写入可能不是同一时刻。结束程序前需要按客户端合同完成刷新、错误处理和资源关闭。只记录“已加入缓冲”作为成功，会在退出或网络失败时漏掉真实写入错误。

批请求也要检查每个操作结果。某一批可能部分成功，随后重试整批会再次触碰已经成功的行。普通覆盖写和计数增加操作不能采用相同补偿策略；生产接收端应记录稳定业务操作编号，并对失败项保留可追踪信息。

限制批量同时考虑消息条数和字节。十条小计数与十条大文本占用完全不同，大批次还会占用服务端处理线程更久，拖慢小请求。测试至少包含常见大小、长尾大行、并发点查和写入峰值，不能只用固定短字符串估算生产吞吐。

### 容量题从日写入量算到恢复余量

前文每天五十亿条，平均每秒约五万七千八百七十条；峰值通常更高。保留一百八十天共有九千亿条。如果每条有效业务数据二百字节，仅原始有效载荷就约一百八十 TB，尚未计键、列族限定符、版本、文件索引、日志、压缩和副本。

压缩比需要真实样本验证。把 HDFS 三副本简单乘到压缩前数据，可以作为保守粗算的一部分，却不是最终磁盘采购结论。还要留合并临时空间、故障域失效后重新复制、快照引用与新增数据增长，不能把磁盘规划到正常状态刚好够用。

恢复目标决定区域数量是否合理。很多小区域带来更多打开、分配和元数据操作，少量大区域又增加热点和单次迁移负担。应测量一次节点故障后的区域接管与客户端尾延迟，不仅测平稳吞吐。这里不给脱离硬件、数据和版本的万能区域大小。

### 高可用不是让客户端无限重试

节点故障后客户端需要重新定位区域并在预算内重试。重试太紧会制造请求风暴，重试过久又让上游线程和连接堆积。应传播总请求预算，区分定位变化、服务不可用和参数错误，不能对所有异常都使用相同无限循环。

跨集群异步复制还涉及写入权、延迟和冲突。主集群暂时不可达并不自动授权灾备集群接收全部写入；切换前要按方案确认复制位置、隔离旧入口和下游依赖。两端重新连通后的数据对账与回切同样需要设计，不能把复制链路绿色当成零丢失证明。

快照通常复用文件引用，保留它可能阻止某些文件回收；把快照导出到独立故障域才进一步保护原存储整体丢失。权限、元数据、目标容量和恢复版本也要一起验证。只有备份任务成功日志，没有实际恢复与行级查询结果，仍应列为未验证能力。

### 从只读证据到受控修复

当区域长期处于转换中，先保存主控流程标识、当前拥有者、日志错误和底层文件健康。不要手工改元数据或强行指派来跳过正在进行的恢复。工具参数必须匹配实际版本和具体故障，原厂或官方流程的适用前提比一条修复命令本身更重要。

生产事故复盘应区分触发因素和放大因素。例如批写变更制造热点是触发，区域过多、磁盘无合并余量、客户端无界重试是放大。回退批写后延迟下降，并不意味着另外三个风险已消失；分别提出容量、限制与恢复演练的验证任务。

面试最后追问：为什么不选关系数据库？答案不是“HBase 更大更快”，而是主要请求是可设计行键的海量稀疏明细访问，愿意接受跨行事务和丰富索引需要另做。若业务核心是复杂关联与跨行一致更新，关系数据库或其他模型可能更合适。选型依据是访问合同，而不是产品流行程度。

## 本课 GitHub 学习证据

```text
hbase-lab/
  README.md                    # 版本、边界和架构
  Dockerfile                  # 基于官方发布包构建
  hbase-site.xml              # 仅限单机实验配置
  hbase.sha512.txt            # 下载校验结果
  schema.hbase                # 表、列族和 RowKey 示例
  shell-output.txt            # create/put/get/scan 脱敏输出
  incident-table-disabled.md  # 故障注入与恢复
  rowkey-design.md            # 访问模式、候选键和热点取舍
  production-design.md        # HA、容量、安全、升级与回滚
```

不要提交真实 RowKey、Cell、ZooKeeper、HDFS 路径、Kerberos Keytab 或集群拓扑。本文覆盖大厂面试所需的 HBase 核心主线，但生产能力仍需要多节点实验、Java 客户端、Hadoop 基础和真实容量压测。
