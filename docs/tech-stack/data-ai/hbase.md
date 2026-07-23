# Apache HBase 深讲

> 学习目标：从零理解 HBase 如何在 HDFS 上提供按 RowKey 的低延迟随机读写，能画出写入、读取、Region 定位、WAL 恢复、Flush、Compaction 和 Split 路径，能完成单机表操作与可回收故障实验，并能分析热点、RegionServer、ZooKeeper、HDFS、GC、Compaction 和复制问题。

## 官方资料

- [Apache HBase 官网](https://hbase.apache.org/)
- [Apache HBase 下载页](https://hbase.apache.org/downloads/)
- [Apache HBase Reference Guide](https://hbase.apache.org/book.html)
- [Apache HBase API](https://hbase.apache.org/apidocs/)
- [Apache HBase GitHub 仓库](https://github.com/apache/hbase)

版本边界：本文以 HBase 2.6.6 稳定线为主线。下载页可能同时列出 3.x Beta 或 Alpha，预发布版不应仅因为版本号更大就直接进入生产。生产必须核对 HBase、Hadoop、ZooKeeper、Java、客户端和协处理器兼容矩阵。

## 官方知识地图

```text
Apache HBase
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
Client
  -> ZooKeeper / cached meta location
  -> hbase:meta 定位目标 Region
  -> RegionServer
       -> Region
          -> WAL
          -> MemStore
          -> BlockCache
          -> HFile on HDFS

HMaster
  -> Region 分配、故障恢复、Schema、Balancer、Procedure

HDFS
  -> NameNode + DataNode 保存 WAL/HFile
```

### HMaster

**是什么：** HBase 控制面，负责 Region 分配、Schema 变更、Balancer 和 Procedure。

**为什么需要：** Region 数量和节点状态不断变化，需要统一协调。

**怎么工作：** Active Master 执行管理 Procedure，Backup Master 等待接管；普通已定位读写不要求每次经过 HMaster。

**怎么看：** Master UI、Master 日志、Procedure 状态、RIT（Region In Transition）。

**坏了怎么查：** 看 ZooKeeper 会话、Active Master 选举、Procedure 卡点、HDFS、时间和 GC。不要因客户端仍可短时读写就认定控制面无影响。

### RegionServer 与 Region

RegionServer 承载多个 Region。Region 是一段连续 RowKey 范围，一个 Region 在同一时刻由一个 RegionServer 提供在线服务。

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
  -> RegionServer
  -> BlockCache
  -> MemStore
  -> Bloom Filter / HFile Index 缩小候选文件
  -> HDFS 读取 HFile Block
  -> 合并版本、删除标记和过滤条件
  -> 返回结果
```

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
scan 'alerts', {STARTROW => '07#host-001#', LIMIT => 10}          # 从前缀起做有限范围扫描
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

`hbase.rootdir` 决定数据根路径，改错可能让集群像“空集群”一样启动；`hbase.zookeeper.quorum` 必须使用奇数仲裁集群的正确地址；生产分布式模式不能照搬单机实验值。

## 入门实验：构建官方发布包单机 HBase

HBase 没有与 Spark/Flink 相同形式的 ASF 官方 Docker 镜像。实验使用 Apache 官方二进制发布包，加通用 Java 基础镜像构建；这比使用来源不明的第三方镜像更容易说明软件来源。

### 下载并验证

```powershell
New-Item -ItemType Directory -Path .\hbase-lab -Force
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
docker run --detach --name hbase-lab --publish 16010:16010 hbase-lab:2.6.6
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

1. 解释数据模型和 RowKey 排序。
2. 画 Client、ZooKeeper、meta、RegionServer、HDFS。
3. 说明 WAL/MemStore/Flush/HFile/Compaction。
4. 说明 BlockCache/Bloom/HFile Index 读路径。
5. 说明单行强一致与跨集群异步复制边界。
6. 说明热点、预分区、容量、HA、安全和升级。
7. 用 Region、RPC、WAL、Compaction、GC、HDFS 证据排障。

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

## 学习证据

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
