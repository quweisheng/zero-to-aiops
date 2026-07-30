# MongoDB 技术栈深讲

> 学习目标：从零理解 MongoDB 文档模型、BSON、CRUD、索引与查询计划、WiredTiger、复制集、读写关注、事务、分片和 Change Stream，能跑通可验证的文档数据库实验与主节点故障切换，并能设计生产一致性、高可用、容量、安全、备份、升级、回滚和 AIOps 数据链路。

## 官方资料

- [MongoDB 文档首页](https://www.mongodb.com/docs/)
- [MongoDB Server Manual](https://www.mongodb.com/docs/manual/)
- [MongoDB 版本模型](https://www.mongodb.com/docs/manual/reference/versioning/)
- [MongoDB 8.3 发布说明](https://www.mongodb.com/docs/manual/release-notes/8.3/)
- [MongoDB 8.2 发布说明](https://www.mongodb.com/docs/manual/release-notes/8.2/)
- [从 8.2 升级到 8.3](https://www.mongodb.com/docs/manual/release-notes/8.3-upgrade/)
- [安装 MongoDB Community Edition](https://www.mongodb.com/docs/manual/administration/install-community/)
- [CRUD 操作](https://www.mongodb.com/docs/manual/crud/)
- [索引](https://www.mongodb.com/docs/manual/indexes/)
- [查询计划 explain](https://www.mongodb.com/docs/manual/reference/explain-results/)
- [复制](https://www.mongodb.com/docs/manual/replication/)
- [三成员复制集](https://www.mongodb.com/docs/manual/core/replica-set-architecture-three-members/)
- [读关注](https://www.mongodb.com/docs/manual/reference/read-concern/)
- [写关注](https://www.mongodb.com/docs/manual/reference/write-concern/)
- [事务](https://www.mongodb.com/docs/manual/core/transactions/)
- [分片](https://www.mongodb.com/docs/manual/sharding/)
- [Change Streams](https://www.mongodb.com/docs/manual/changeStreams/)
- [安全检查清单](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [监控](https://www.mongodb.com/docs/manual/administration/monitoring/)
- [备份方法](https://www.mongodb.com/docs/manual/core/backups/)
- [MongoDB 官方 Docker 镜像](https://hub.docker.com/_/mongo)

说明：本文基于 MongoDB 官方文档和官方 Docker 镜像重新组织，不复制官方全文。版本、支持周期、平台兼容、安全公告和升级限制会变化，生产选型前必须重新核对目标版本的 Release Notes、Compatibility Changes 和 Security Bulletins。

截至 2026-07-30，`8.3.7` 是最新 Minor Release，`8.2.12` 是上一条 Minor Release。官方明确 Minor Release 与 Major Release 一样稳定并适合生产；区别不是“稳定版与预览版”，而是生命周期和升级节奏：8.0 Major 以更长生命周期为主，8.2/8.3 更早提供功能，但需要更频繁地按相邻版本升级，部分迁移工具还可能不支持 Minor Release。

本文实验固定使用 `mongo:8.2.12`，它只是可重复的上一 Minor 实验基线，不是对生产版本的推荐。截至本文日期，`mongo:latest` 和 `mongo:8` 仍指向 8.2.12，而不是 8.3；因此无论实验还是生产都应显式固定完整补丁版本和镜像 Digest，不能依赖移动标签。

## 官方知识地图

```text
数据模型
  -> BSON / Document / Collection / Database
  -> Schema Validation / Embedded / Reference

读写与查询
  -> CRUD / Aggregation / Index / Query Planner
  -> Session / Transaction / Read Concern / Write Concern

分布式
  -> Replica Set / Election / Oplog
  -> Sharding / mongos / Config Server / Balancer
  -> Change Stream

运维
  -> 配置 / 安全 / 监控 / 备份
  -> 容量 / 性能 / 升级 / 恢复
```

本文学习顺序：

1. 先理解文档不是“无约束 JSON”。
2. 再跑 CRUD、聚合、索引和 `explain`。
3. 再走一遍 WiredTiger 写入与读取路径。
4. 再理解复制集的一致性、选举和故障切换。
5. 然后理解事务、分片与 Change Stream 的边界。
6. 最后做主节点停止实验，进入生产设计和面试。

## 场景开场

AIOps 平台每天接收主机、应用、告警、工单和变更事件。不同来源的字段不完全一样：

```json
{"type":"alert","service":"order-api","severity":"critical"}
{"type":"change","service":"order-api","commit":"abc123","operator":"ci"}
```

如果每增加一种事件都先改十几张关系表，研发会觉得很重；但如果把所有东西都塞进没有约束的 JSON，又会出现字段拼错、类型混乱、索引失控和数据无法治理。

MongoDB 要解决的是：在保留文档模型灵活性的同时，提供索引、查询、事务、复制、分片、安全和可运维的数据库能力。

## 一句话人话版

MongoDB 是把一条业务对象按 BSON 文档保存、查询和复制的数据库；它允许文档结构灵活，但仍然需要模型、索引、一致性和容量设计。

## 小白可能会问

- MongoDB 就是“可以存 JSON”吗？
- 没有固定表结构是不是不用设计 Schema？
- 单文档原子性和多文档事务有什么区别？
- 三节点复制集为什么还可能写失败或读到旧数据？
- `w: "majority"` 是否等于永不丢数据？
- 有复制集以后为什么还要备份？
- 分片是不是数据大了直接加机器就行？

## 为什么要学

MongoDB 常用于事件、资产、配置、内容、设备、会话和半结构化业务数据。AIOps 场景里，它可以承载告警上下文、变更事件、自动化执行记录、RCA 草稿和知识条目元数据。

学习重点不是背 `insertOne()`，而是理解：

- 文档边界如何影响原子性。
- 索引如何影响读、写和磁盘。
- 复制集如何在故障后选出 Primary。
- 读偏好、读关注和写关注如何决定一致性。
- 分片键如何决定扩展上限和热点。
- Change Stream 如何把状态变化接到事件处理链。

## 是什么

MongoDB 是面向文档的数据库。数据以 BSON（Binary JSON，二进制 JSON）格式保存。BSON 支持 ObjectId、日期、二进制、Decimal128 等 JSON 原生没有的类型。

基本层级：

```text
MongoDB Deployment
  -> Database
      -> Collection
          -> Document
              -> Field
```

它不是“完全没有 Schema”。Schema 可以由应用、JSON Schema Validation、索引、唯一约束和数据治理共同定义。灵活 Schema 的正确含义是文档可以演进，不是字段可以随便写。

### Community、Enterprise 与 Atlas

| 形态 | 谁运维 | 适合什么 | 需要注意 |
|---|---|---|---|
| Community Edition | 自己 | 学习、自建、通用数据库能力 | 企业特性和支持边界不同 |
| Enterprise Advanced | 自己并购买商业支持 | 企业安全、管理和支持需求 | 许可与功能以合同和版本为准 |
| MongoDB Atlas | MongoDB 托管 | 希望减少底层运维 | 成本、区域、网络、合规和云依赖 |

## 它解决什么问题

- 一个业务对象可以以嵌套文档保存，减少频繁跨表拼装。
- 支持丰富查询、聚合、索引和地理/时间序列等数据能力。
- 复制集提供自动选主和副本容错。
- 分片把数据和请求分散到多个 Shard。
- Change Stream 把数据变更转成可消费事件。
- 驱动提供拓扑发现、连接池、重试和 Server Selection。

## 核心原理

### 单次写入路径

```text
应用
  -> MongoDB Driver 选择可写 Primary
  -> mongod 解析命令、认证、校验
  -> WiredTiger 并发控制和缓存
  -> Journal / Checkpoint 持久化路径
  -> Oplog 记录复制操作
  -> Secondary 拉取并应用 Oplog
  -> 达到 Write Concern 后返回客户端
```

客户端收到成功的时间取决于 Write Concern。`w: 1` 与 `w: "majority"` 等待的副本确认范围不同；`j: true` 关注日志持久化。不能只说“MongoDB 写入成功”，必须说明采用什么写关注。

### 单次读取路径

```text
应用
  -> Driver 按 Read Preference 选择节点
  -> 认证与命令解析
  -> Query Planner 选择执行计划
  -> Index Scan 或 Collection Scan
  -> WiredTiger Cache / 磁盘
  -> 按 Read Concern 返回可见数据
```

Read Preference 决定“去哪个成员读”，Read Concern 决定“需要什么可见性保证”。从 Secondary 读可以分担部分流量，但可能读到落后数据，也会占用 Secondary 做复制和备份所需的资源。

### WiredTiger

WiredTiger 是 MongoDB 默认存储引擎。它管理缓存、并发、压缩、Journal、Checkpoint 和磁盘文件。

你可以把它理解成：

```text
内存中的活跃页
  -> 修改
  -> Journal 提供崩溃恢复路径
  -> Checkpoint 周期性形成一致磁盘视图
```

WiredTiger Cache 不是越大越好。数据库进程还需要连接、聚合、索引构建、压缩、操作系统页缓存和其他内存。容器中必须按限制观察实际可用内存，不能只看宿主机总内存。

### Oplog 与复制

Oplog 是复制集内部记录可复制操作的 capped collection。Secondary 按顺序拉取并应用操作，形成与 Primary 接近的状态。

复制延迟会缩短故障余量。若 Secondary 落后时间超过 Oplog Window，可用 Oplog 已覆盖掉它缺失的历史，成员通常需要重新 Initial Sync。

### 选举与多数派

复制集成员通过心跳判断拓扑。Primary 失联后，具有投票资格且数据足够新的成员可以发起选举。获得多数票的成员成为新 Primary。

官方推荐的最小高可用形态是三个数据承载成员：

```text
Primary
Secondary
Secondary
```

一个 Arbiter 只投票不保存数据。它省资源，但不增加数据副本。能选出 Primary 不等于数据冗余充足。

## 关键术语拆解

| 术语 | 人话解释 | 关键风险 |
|---|---|---|
| BSON | MongoDB 的二进制文档格式 | 类型与驱动映射不一致 |
| Document | 一条业务对象记录 | 文档过大、边界设计错误 |
| Collection | 一组文档 | 缺少验证和索引治理 |
| `_id` | 文档唯一主键 | 类型不一致影响查询与分片 |
| ObjectId | 常用 `_id` 类型 | 不能把它当严格连续业务时间 |
| WiredTiger | 默认存储引擎 | Cache、磁盘和 Checkpoint 压力 |
| Journal | 崩溃恢复日志 | 磁盘延迟影响写入确认 |
| Oplog | 复制操作日志 | Window 太短导致成员重同步 |
| Replica Set | 一组复制成员 | 多数派、延迟和故障域 |
| Primary | 接受普通写入的成员 | 单个 Primary 不等于单点数据 |
| Secondary | 复制并可参与选举的成员 | 可能落后，读一致性不同 |
| Read Concern | 读取可见性要求 | 保障越强通常成本越高 |
| Write Concern | 写入确认范围 | 设置过弱可能降低持久性保证 |
| Shard Key | 决定数据分布的键 | 低基数或单调热点难以扩展 |
| mongos | 分片路由进程 | 路由元数据、连接和延迟 |

## 核心知识树

### 文档建模

是什么：决定哪些字段放在同一文档，哪些对象嵌入或引用。

为什么需要：文档边界同时决定查询次数、原子性、更新冲突和文档增长。

怎么工作：经常一起读取、生命周期一致且大小有界的数据适合嵌入；独立增长或多对多关系常用引用。

怎么用：先从访问模式设计，再写 Schema Validation 和索引。

坏了怎么查：看慢查询、文档平均/最大大小、更新冲突、数组增长和重复数据一致性。

### CRUD

是什么：Create、Read、Update、Delete。

为什么需要：这是应用最基础的数据操作。

怎么工作：过滤条件匹配文档，更新操作符修改目标字段，单文档写入具有原子性。

怎么用：`insertOne`、`find`、`updateOne`、`deleteOne`。

坏了怎么查：先看过滤条件、类型、Write Concern、权限和返回的 matched/modified count。

### 聚合管道

是什么：让文档依次经过 `$match`、`$group`、`$project`、`$sort` 等 Stage 的计算链。

为什么需要：统计、转换和关联不能只靠简单 `find`。

怎么工作：每个 Stage 接收上一阶段输出并产生下一阶段输入；优化器会做部分重排和下推。

怎么用：尽早 `$match` 和合理索引，使用 `explain` 观察。

坏了怎么查：看扫描文档数、内存、磁盘 Spill、Stage 顺序和类型转换。

### 索引

是什么：按字段值组织的额外数据结构，用写入和磁盘成本换读取速度。

为什么需要：没有合适索引时查询可能扫描整个 Collection。

怎么工作：Query Planner 比较候选计划，常见 B-tree 索引可支持过滤、排序和部分覆盖查询。

怎么用：根据高频查询的等值、排序和范围顺序设计复合索引，用 `explain("executionStats")` 验证。

坏了怎么查：看 `COLLSCAN`、`IXSCAN`、`totalDocsExamined`、`totalKeysExamined`、返回行数和索引使用统计。

### 复制集

是什么：维护同一数据集的多个 `mongod` 成员。

为什么需要：节点故障后自动选举和继续服务。

怎么工作：Primary 产生 Oplog，Secondary 复制应用，多数派维持选举和提交语义。

怎么用：至少三个投票成员跨故障域，应用连接字符串列出多个 Seed。

坏了怎么查：`rs.status()`、`rs.printReplicationInfo()`、`rs.printSecondaryReplicationInfo()`、日志、网络和时钟。

### 分片

是什么：把一个 Collection 的数据范围分到多个 Shard。

为什么需要：单个复制集的容量或吞吐达到上限时横向扩展。

怎么工作：`mongos` 根据 Shard Key 和 Config Server 元数据路由；Balancer 移动 Range 以改善分布。

怎么用：先验证访问模式和 Shard Key，再启用分片。

坏了怎么查：看 Targeted/Scatter-Gather、Chunk/Range 分布、Jumbo、Balancer、热点和 Config Server。

### 事务

是什么：让多个文档或多个 Collection 的操作作为一个事务提交或回滚。

为什么需要：有些业务不可能压进一个原子文档。

怎么工作：Session 维护事务上下文，复制集或分片集群协调提交。

怎么用：保持事务短小、限制访问文档和重试逻辑。

坏了怎么查：看锁、超时、写冲突、TransientTransactionError、重试和跨 Shard 范围。

### Change Stream

是什么：基于复制日志观察数据变化的订阅接口。

为什么需要：把数据库变更连接到缓存、搜索、审计和事件处理。

怎么工作：驱动打开可恢复 Cursor，消费插入、更新、删除等事件，并用 Resume Token 续接。

怎么用：只在复制集或分片集群上使用，持久化 Resume Token。

坏了怎么查：Oplog Window、Resume Token、权限、消费者延迟和事件处理幂等。

## 架构和数据流

### 单复制集

```text
应用 Driver
  -> Seed List / Topology Discovery
  -> Primary
      -> Oplog
      -> Secondary A
      -> Secondary B
```

应用不应只写一个固定 Primary 地址。Driver 需要多个 Seed 才能在拓扑变化后发现新 Primary。

### 分片集群

```text
应用
  -> mongos 路由
      -> Config Server Replica Set
      -> Shard A Replica Set
      -> Shard B Replica Set
      -> Shard C Replica Set
```

Shard 自己通常也是复制集。分片解决容量和吞吐，复制解决单个 Shard 的可用性，两者不是同一件事。

### 状态边界

- 数据文档：Shard/复制集成员上的 WiredTiger 文件。
- 复制历史：Oplog。
- 分片元数据：Config Server Replica Set。
- 驱动拓扑：客户端内存中持续更新。
- Change Stream 进度：消费者保存的 Resume Token。
- 备份状态：快照、Oplog 或备份系统的恢复点。

## 安装与启动

### 单节点学习环境

```yaml
name: mongodb-lab

services:
  mongo:
    image: mongo:8.2.12
    command: ["mongod", "--auth", "--bind_ip_all"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: mongodb_lab_root
      MONGO_INITDB_DATABASE: aiops
    ports:
      - "127.0.0.1:27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "mongosh --quiet -u root -p mongodb_lab_root --authenticationDatabase admin --eval 'db.adminCommand({ping:1}).ok' | grep 1"
        ]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  mongodb_data:
```

`init/01-user.js`：

```javascript
db = db.getSiblingDB("aiops");

db.createUser({
  user: "aiops_app",
  pwd: "aiops_lab_password",
  roles: [{ role: "readWrite", db: "aiops" }]
});

db.createCollection("events", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["type", "service", "severity", "createdAt"],
      properties: {
        type: { enum: ["alert", "change", "incident"] },
        service: { bsonType: "string" },
        severity: { enum: ["info", "warning", "critical"] },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

db.events.createIndex({ service: 1, createdAt: -1 });
db.events.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 });
```

初始化脚本只在空数据目录第一次启动时执行。修改脚本后重启容器不会自动重跑，这是新手最常见的误判之一。

启动：

```powershell
docker compose -p mongodb-lab up -d
docker compose -p mongodb-lab ps
docker compose -p mongodb-lab logs --tail 100 mongo
```

## 配置详解

生产常使用 YAML 配置：

```yaml
storage:
  dbPath: /var/lib/mongo
  journal:
    enabled: true

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true

net:
  bindIp: 10.10.20.15
  port: 27017
  tls:
    mode: requireTLS
    certificateKeyFile: /etc/mongo/tls/server.pem
    CAFile: /etc/mongo/tls/ca.pem

security:
  authorization: enabled

replication:
  replSetName: rs0
  oplogSizeMB: 51200

processManagement:
  timeZoneInfo: /usr/share/zoneinfo
```

| 配置 | 作用 | 常见坑 |
|---|---|---|
| `storage.dbPath` | 数据目录 | 卷权限、磁盘类型和备份边界不清 |
| `systemLog.path` | 服务日志 | 与 stdout 重复或日志占满磁盘 |
| `net.bindIp` | 监听地址 | `0.0.0.0` 加无认证等于暴露数据库 |
| `net.tls.mode` | TLS 策略 | 客户端证书、CA 和主机名不匹配 |
| `security.authorization` | 开启 RBAC | 开启前未准备管理员会锁住自己 |
| `replication.replSetName` | 复制集名称 | 所有成员和连接串必须一致 |
| `replication.oplogSizeMB` | Oplog 大小 | 只看 GB，不看写入速率与 Window |
| `storage.wiredTiger.engineConfig.cacheSizeGB` | WiredTiger Cache 上限 | 抢光系统和查询额外内存 |

## 常用命令与查询

### CRUD

```javascript
use aiops

db.events.insertOne({
  type: "alert",
  service: "order-api",
  severity: "critical",
  createdAt: new Date(),
  labels: { region: "cn-north", source: "prometheus" }
})

db.events.find(
  { service: "order-api", severity: "critical" },
  { service: 1, severity: 1, createdAt: 1 }
).sort({ createdAt: -1 }).limit(20)

db.events.updateOne(
  { _id: ObjectId("替换为真实 id") },
  { $set: { acknowledged: true }, $currentDate: { updatedAt: true } }
)

db.events.deleteOne({ _id: ObjectId("替换为真实 id") })
```

### 聚合

```javascript
db.events.aggregate([
  { $match: { createdAt: { $gte: new Date(Date.now() - 3600 * 1000) } } },
  {
    $group: {
      _id: { service: "$service", severity: "$severity" },
      eventCount: { $sum: 1 },
      latestAt: { $max: "$createdAt" }
    }
  },
  { $sort: { eventCount: -1 } },
  { $limit: 20 }
])
```

### 查询计划

```javascript
db.events.find({
  service: "order-api",
  createdAt: { $gte: new Date(Date.now() - 3600 * 1000) }
}).sort({ createdAt: -1 }).explain("executionStats")
```

重点看：

- `winningPlan` 是 `IXSCAN` 还是 `COLLSCAN`。
- `nReturned` 返回多少。
- `totalDocsExamined` 扫了多少文档。
- `totalKeysExamined` 扫了多少索引键。
- 执行是否出现排序或磁盘 Spill。

| 命令 | 作用 | 正常结果 | 异常先查 |
|---|---|---|---|
| `db.adminCommand({ping:1})` | 检查服务响应 | `{ ok: 1 }` | 网络、认证、进程 |
| `db.serverStatus()` | 实例状态 | 返回连接、内存、操作、WT 等 | 权限、命令开销 |
| `db.currentOp()` | 查看当前操作 | 找到慢或等待操作 | 权限、过滤条件 |
| `db.collection.getIndexes()` | 查看索引 | 索引规格符合预期 | 重复、隐藏、构建中 |
| `explain("executionStats")` | 看真实查询计划 | 扫描量接近返回量 | 索引、选择性、类型 |
| `rs.status()` | 复制集成员状态 | 一个 Primary、其余 Secondary | 多数派、网络、时钟 |
| `rs.printReplicationInfo()` | 看 Oplog Window | Window 覆盖最长故障/维护时间 | 写速率、Oplog 大小 |
| `sh.status()` | 看分片状态 | Shard 和分布正常 | Config Server、Balancer |

## 在 AIOps 中的作用

### 告警与变更文档

MongoDB 适合保存字段可能随来源扩展，但仍有公共核心字段的事件：

```json
{
  "eventId": "evt-20260730-001",
  "type": "alert",
  "service": "order-api",
  "severity": "critical",
  "occurredAt": "2026-07-30T03:20:00Z",
  "labels": {
    "region": "cn-north",
    "cluster": "prod-a"
  },
  "evidence": {
    "metric": "http_5xx_rate",
    "value": 0.18,
    "traceIds": ["7f...", "8a..."]
  }
}
```

公共字段用 Schema Validation 保底，来源特有字段放在有边界的子文档中。不要让同一个 `occurredAt` 有时是 String、有时是 Date。

### Change Stream

Change Stream 可把新告警、事件状态更新和自动化结果推到关联分析服务：

```text
MongoDB Change Stream
  -> 事件标准化
  -> 去重 / 关联 / 富化
  -> Runbook 建议
  -> 人工审批
  -> 执行结果写回
```

消费者必须保存 Resume Token，并保证重复事件幂等。Change Stream 不是永久消息队列；若消费者停机超过可恢复历史范围，必须有补数方案。

### 可观测与异常检测

把 MongoDB 自身的连接、查询、复制延迟、Oplog Window、WT Cache、锁、磁盘、页故障和分片分布接入 Prometheus、Atlas 或企业监控，再与应用 SLI 和变更事件关联。

## 基础实验：CRUD、验证、TTL、索引与 explain

### 实验目标

启动带认证的单节点 MongoDB，写入 AIOps 事件，验证 Schema、TTL 索引和查询计划。

### 第一步：启动并连接

```powershell
docker compose -p mongodb-lab up -d
docker compose -p mongodb-lab ps

docker compose -p mongodb-lab exec mongo mongosh `
  "mongodb://aiops_app:aiops_lab_password@localhost:27017/aiops?authSource=aiops"
```

预期进入 `mongosh`。

### 第二步：写入事件

```javascript
db.events.insertMany([
  {
    type: "alert",
    service: "order-api",
    severity: "critical",
    createdAt: new Date(),
    value: 0.18
  },
  {
    type: "change",
    service: "order-api",
    severity: "info",
    createdAt: new Date(),
    commit: "abc1234"
  }
])
```

预期 `acknowledged: true`，并返回两个 `_id`。

### 第三步：验证 Schema

故意写错类型：

```javascript
db.events.insertOne({
  type: "unknown",
  service: "order-api",
  severity: 5,
  createdAt: "not-a-date"
})
```

预期收到 Document failed validation。这个失败是实验成功证据。

### 第四步：验证索引

```javascript
db.events.getIndexes()

db.events.find({
  service: "order-api",
  createdAt: { $gte: new Date(Date.now() - 3600 * 1000) }
}).sort({ createdAt: -1 }).explain("executionStats")
```

预期查询计划可以使用 `{ service: 1, createdAt: -1 }` 索引。小数据集上优化器也可能选择不同计划，因此要解释输出，不能只搜索 `IXSCAN` 字符串。

### 第五步：保存证据

```javascript
db.events.countDocuments({})
db.events.find().sort({ createdAt: -1 })
db.events.stats()
```

保存查询结果、索引定义、Explain 摘要和验证失败信息。

### 如果没有成功

1. `docker compose ps` 是否 healthy。
2. 初始化脚本是否只在空卷首次运行。
3. `authSource` 是否为创建用户的 `aiops`。
4. 日期是否用 `new Date()` 而不是 String。
5. Collection 是否在初始化前已被意外创建。
6. 端口 27017 是否冲突。

### 清理

```powershell
docker compose -p mongodb-lab down
```

确认不再需要数据后：

```powershell
docker compose -p mongodb-lab down -v
```

## 故障注入实验：停止 Primary 并观察重新选举

### 实验目标

启动三个数据节点的复制集，确认 Majority 写入，停止 Primary，观察短暂不可写与新 Primary 选举，再恢复旧节点。

### 实验边界

仅用于本地实验。为减少密钥配置，下面复制集不启用认证，只绑定本机映射端口和 Compose 网络。不要把它部署到共享网络或公网。

### `compose.rs.yaml`

```yaml
name: mongodb-rs-lab

services:
  mongo1:
    image: mongo:8.2.12
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all", "--port", "27017"]
    ports: ["127.0.0.1:27117:27017"]
    volumes: [mongo1_data:/data/db]

  mongo2:
    image: mongo:8.2.12
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all", "--port", "27017"]
    ports: ["127.0.0.1:27118:27017"]
    volumes: [mongo2_data:/data/db]

  mongo3:
    image: mongo:8.2.12
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all", "--port", "27017"]
    ports: ["127.0.0.1:27119:27017"]
    volumes: [mongo3_data:/data/db]

volumes:
  mongo1_data:
  mongo2_data:
  mongo3_data:
```

### 第一步：启动与初始化

```powershell
docker compose -f compose.rs.yaml -p mongodb-rs-lab up -d

docker compose -f compose.rs.yaml -p mongodb-rs-lab exec mongo1 mongosh --quiet --eval @'
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 3 },
    { _id: 1, host: "mongo2:27017", priority: 2 },
    { _id: 2, host: "mongo3:27017", priority: 1 }
  ]
})
'@
```

等待约十几秒，再检查：

```powershell
docker compose -f compose.rs.yaml -p mongodb-rs-lab exec mongo1 `
  mongosh --quiet --eval "rs.status().members.map(m => ({name:m.name,state:m.stateStr}))"
```

预期一个 Primary、两个 Secondary。

### 第二步：Majority 写入

```powershell
docker compose -f compose.rs.yaml -p mongodb-rs-lab exec mongo1 mongosh --quiet --eval @'
db = db.getSiblingDB("aiops");
db.events.insertOne(
  {eventId:"before-failover", createdAt:new Date()},
  {writeConcern:{w:"majority", wtimeout:5000}}
)
'@
```

### 第三步：确认并停止当前 Primary

由于优先级设置，初始 Primary 通常是 `mongo1`，但必须先用 `db.hello().primary` 确认，不能靠猜。

```powershell
$primaryHost = docker compose -f compose.rs.yaml -p mongodb-rs-lab exec -T mongo1 `
  mongosh --quiet --eval "db.hello().primary"

$primaryService = ($primaryHost.Trim() -split ":")[0]
if ($primaryService -notin @("mongo1", "mongo2", "mongo3")) {
  throw "无法识别当前 Primary：$primaryHost"
}

"停止当前 Primary：$primaryService"
docker compose -f compose.rs.yaml -p mongodb-rs-lab stop $primaryService
```

后续命令要在同一个 PowerShell 窗口执行，以便继续使用 `$primaryService`。

### 第四步：观察选举

```powershell
$remainingServices = @("mongo1", "mongo2", "mongo3") |
  Where-Object { $_ -ne $primaryService }

docker compose -f compose.rs.yaml -p mongodb-rs-lab logs --since 3m $remainingServices

$newPrimaryService = $null
foreach ($candidate in $remainingServices) {
  $isPrimary = docker compose -f compose.rs.yaml -p mongodb-rs-lab exec -T $candidate `
    mongosh --quiet --eval "db.hello().isWritablePrimary"

  if ($isPrimary.Trim() -eq "true") {
    $newPrimaryService = $candidate
    break
  }
}

if (-not $newPrimaryService) {
  throw "选举尚未完成，请稍后重新执行本步骤"
}

"新 Primary：$newPrimaryService"
```

预期经过选举后，`mongo2` 或 `mongo3` 成为 Primary。应用在 Server Selection 与选举期间可能短暂写失败或等待。

### 第五步：验证数据与恢复成员

```powershell
docker compose -f compose.rs.yaml -p mongodb-rs-lab exec -T $newPrimaryService mongosh --quiet --eval @'
db = db.getSiblingDB("aiops");
db.events.find({eventId:"before-failover"}).toArray()
'@

docker compose -f compose.rs.yaml -p mongodb-rs-lab start $primaryService
```

恢复后检查三个成员状态和复制延迟。原 Primary 可能以 Secondary 身份回归，也可能因优先级再次触发 Primary 变化；生产中要把故障恢复和主动回切分成两个变更，并评估二次切换是否符合稳定性目标。

### 第六步：清理

```powershell
docker compose -f compose.rs.yaml -p mongodb-rs-lab down
docker compose -f compose.rs.yaml -p mongodb-rs-lab down -v
```

第二条会删除实验数据，只能在确认项目名和卷都属于本实验后执行。

### 如果没有得到预期结果

- 三个成员是否能用 Compose 服务名互相解析。
- `rs.initiate()` 中 Host 是否和实际成员自报地址一致。
- 是否真的停止了当前 Primary。
- 剩余两个投票成员是否形成多数派。
- Oplog、磁盘或时钟是否异常。
- 客户端是否只连接一个宿主机端口，而没有使用复制集连接串。

## 常见故障排查

### 连接超时或 Server Selection Timeout

检查 DNS、端口、防火墙、TLS、Seed List、`replicaSet` 参数和成员自报地址。能 TCP 通一个节点不等于 Driver 能发现完整拓扑。

### 认证失败

确认用户创建在哪个数据库、连接串 `authSource`、认证机制、用户名大小写和 Secret。不要通过关闭认证解决。

### 查询突然变慢

按顺序看慢查询日志、Profiler/Query Stats、`explain`、扫描量、索引、缓存命中、磁盘和并发。先确认计划与数据分布，再决定加索引。

### 索引很多但仍然慢

过多索引增加写放大、Cache 压力和磁盘。检查索引是否真正使用、是否前缀重复、低选择性和排序顺序是否匹配。

### Secondary 延迟持续增长

比较 Primary 写入速率、Secondary 应用速率、磁盘、网络、长查询、备份和索引构建。不要先把所有读取都导向落后的 Secondary。

### Oplog Window 过短

增加 Oplog 前先估算写入速率和最长维护/故障时间，检查异常批量写是否突然压缩 Window。Window 已断裂的成员可能需要 Initial Sync。

### Primary 频繁切换

检查网络丢包、心跳、磁盘停顿、CPU 饱和、时钟、宿主机重启、容器驱逐和投票配置。不要只不断提高 Election Timeout 掩盖资源故障。

### WiredTiger Cache 压力

看 Cache 使用、脏页、Eviction、磁盘读写延迟和工作集。减少无界查询、优化索引和文档，再评估内存；不能只把 Cache 调到接近容器上限。

### 磁盘满

区分数据文件、Journal、日志、临时 Spill、Oplog 和备份占用。先阻止继续扩散和保护副本，不在生产执行未经评估的 `repairDatabase` 或直接删文件。

### 分片热点

查看 Shard Key 基数、单调写、Targeted Query、Chunk/Range 分布和 Balancer。已经选错的 Shard Key 可能需要 Resharding，而不是单纯加 Shard。

## 容量与性能

至少估算：

- 每秒读写、峰值和读写比例。
- 平均、p95、最大文档大小与增长。
- 热工作集和索引能否放入可用内存。
- 每次写入要更新多少索引。
- Oplog 每小时增长和 Window。
- Primary 与 Secondary 的磁盘、网络和复制延迟。
- 连接池总量是否超过数据库承载。
- 聚合内存与 Spill 磁盘。
- 备份、恢复、Initial Sync 和 Resharding 时间。

索引收益不能只看“查询从 2 秒变 20 毫秒”，还要评估：

```text
新增索引
  -> 每次写入多维护一份结构
  -> 更多磁盘
  -> 更多 Cache
  -> 更长备份和同步
```

## 一致性取舍

### Write Concern

- `w: 1`：Primary 确认，延迟较低，但确认范围较小。
- `w: "majority"`：等待多数派相关确认，常用于重要写入。
- `wtimeout`：等待超时并不自动证明写入完全没有发生，应用要按幂等键确认结果。

### Read Concern

不同 Read Concern 提供不同可见性。事务和强一致业务要根据官方语义选择，不用“从 Primary 读就绝对安全”替代完整设计。

### Read Preference

从 Secondary 读可扩展某些读场景，但可能读旧数据，并和复制、备份争抢资源。账户余额、权限判断和刚写后读通常需要更严格策略。

### 事务

事务是工具，不是修复错误文档模型的默认答案。长事务会增加资源、冲突和 Oplog 压力。优先让强一致边界落在单文档，确实需要时再使用多文档事务。

## 安全

- 默认实验实例不要暴露公网。
- 开启认证和 RBAC，应用使用专用最小权限用户。
- 网络层限制访问来源，配置 TLS。
- 生产 Secret 不写入连接串日志、Compose 或 Git。
- 管理员、备份、监控和应用账号分离。
- 开启适用的审计能力并集中保存审计日志。
- 对敏感字段评估客户端字段级加密或 Queryable Encryption 的版本和 Edition 边界。
- 定期查看 Security Bulletins，升级到修复安全问题的 Patch。
- 禁止应用任意传入未过滤查询对象，防止查询注入和资源滥用。
- 备份同样要加密、访问控制和恢复审计。

## 备份与灾备

复制集不是备份：

- 误删除会复制到所有成员。
- 错误应用写入会复制。
- 勒索或权限误操作可能影响整个集群。
- 逻辑损坏不会因为有三个副本自动恢复。

备份设计要回答：

- RPO：最多允许丢多少时间的数据？
- RTO：多久恢复服务？
- 备份是一致快照、逻辑备份还是持续备份？
- 分片集群如何跨 Shard 保持一致恢复点？
- Oplog 是否用于 Point-in-Time Recovery？
- 恢复是否在隔离环境定期演练？

`mongodump` 适合小规模逻辑迁移和对象级恢复，但不应自动视为所有大型生产集群的最佳备份。使用存储快照、Atlas、Ops Manager 或企业备份时，按官方流程保证一致性。

## 升级、FCV 与回滚

FCV（Feature Compatibility Version，特性兼容版本）控制集群何时启用新版本会改变磁盘或协议兼容的能力。

安全升级思路：

1. 阅读当前到目标版本之间所有 Release Notes 和 Compatibility Changes。
2. 核对驱动、操作系统、内核、备份工具、监控 Agent 和安全功能。
3. 确认复制健康、Oplog Window、备份与恢复演练。
4. 按官方顺序滚动升级 Secondary，再 Step Down 和升级 Primary。
5. 新二进制稳定运行一段观察期后再提升 FCV。
6. FCV 提升前保留明确回退窗口；提升后回退限制可能改变。

查看与提升 FCV：

```javascript
db.adminCommand({
  getParameter: 1,
  featureCompatibilityVersion: 1
})

db.adminCommand({
  setFeatureCompatibilityVersion: "8.3",
  confirm: true
})
```

从 8.2 升 8.3 前，FCV 必须先是 `8.2`。复制集按“逐个 Secondary → `rs.stepDown()` → 原 Primary → 观察期 → 提升 FCV”的顺序执行。分片集群还要先停止 Balancer，再依次升级 Config Server Replica Set、各 Shard 复制集和 `mongos`，恢复 Balancer 并观察后才提升 FCV。旧版 `mongos` 不能连接 FCV 更高的集群，也不要在 Initial Sync 期间提升 FCV。

官方文档还强调不能把多个版本随意跨过去升级或降级；Community Edition 的二进制降级存在额外限制。不要把“滚动升级成功”理解成“随时能把包降回去”，更不能在提升 FCV 后假设原回退路径仍然成立。

## 选型取舍

| 场景 | 候选 | 取舍 |
|---|---|---|
| 关系、约束和复杂事务为主 | PostgreSQL / MySQL | 关系模型和 SQL 生态更直接 |
| 嵌套对象、Schema 演进、文档查询 | MongoDB | 文档模型自然，但仍需索引和治理 |
| 纯缓存、极低延迟 Key-Value | Redis | 数据结构和持久化语义不同 |
| 大规模事件流和长期顺序日志 | Kafka | Broker 日志与数据库查询模型不同 |
| 托管文档数据库 | MongoDB Atlas / 云厂商兼容服务 | 要核对兼容性，不能只看 API 名称 |

不要用“MongoDB 无 Schema”作为选型理由。真正要比较访问模式、事务边界、查询、扩展、团队能力、备份、合规和总成本。

## 事故场景：Primary 正常，但接口 p99 从 40ms 升到 4s

### 现象

- CPU 约 55%，没有明显 OOM。
- Primary 没有切换。
- 最近上线了一个按 `tenantId + status + createdAt` 查询的告警列表。
- `opcounters.query` 和磁盘读取上升。

### 证据顺序

1. 从应用 Trace 定位慢在 MongoDB 调用。
2. 获取慢查询 Filter、Sort、返回量和 Comment。
3. 用生产等价数据执行 `explain("executionStats")`。
4. 比较 `nReturned`、`totalDocsExamined` 和 `totalKeysExamined`。
5. 看 Query Plan Cache、索引、WT Cache 和磁盘延迟。
6. 对齐新版本发布时间和查询形态。

### 假设

- 缺少匹配过滤和排序的复合索引。
- 字段类型混乱导致索引无法有效使用。
- 返回字段过大，网络与反序列化成为瓶颈。
- 新索引构建或工作集变化挤压 Cache。

### 验证

若计划为 `COLLSCAN`，每次返回 50 条却扫描 300 万文档，并且问题只出现在新查询，就有强证据支持索引/查询设计假设。

### 修复

- 在生产等价数据验证候选复合索引。
- 评估索引写放大和磁盘后再上线。
- 对查询加稳定排序、分页边界和字段投影。
- 金丝雀观察 p99、扫描比、写延迟和复制延迟。

### 爆炸半径与回滚

大型索引构建会消耗 CPU、内存、磁盘和复制资源。不要在高峰直接执行；准备取消、隐藏或删除索引的回滚方案，并确认回滚不会让查询重新全表扫描。

### 复盘

给高频查询建立 Explain 回归、扫描比告警、字段类型验证和索引变更评审。

## 生产系统设计题

题目：设计一个保存 90 天 AIOps 告警与变更事件、峰值每秒 2 万写、需要按服务和时间查询并订阅实时变更的 MongoDB 平台。

回答主线：

1. 定义事件 Schema、文档大小、幂等 `eventId`、时间和租户边界。
2. 先验证单复制集容量，再决定是否分片。
3. 每个 Shard 使用跨故障域三数据节点复制集。
4. Shard Key 结合租户/服务和散列或时间策略，避免单调热点。
5. 按查询设计复合索引，用 TTL 管理 90 天保留，但评估删除压力。
6. 关键写用合适 Write Concern，消费者保存 Change Stream Resume Token。
7. 监控 WT Cache、磁盘、复制延迟、Oplog Window、扫描比和分片分布。
8. 做持续备份、PITR 和隔离恢复演练。
9. 升级先滚动二进制，观察后再提升 FCV。
10. 故障演练覆盖 Primary、网络分区、磁盘慢、Oplog 断窗和错误 Shard Key。

## 面试怎么讲

### 30 秒版本

MongoDB 是 BSON 文档数据库。单文档写入原子，WiredTiger 负责缓存、并发、Journal 和 Checkpoint；复制集通过 Oplog、心跳和多数派选举提供故障切换。生产上我会用索引和 Explain 控制扫描量，用 Read/Write Concern 定义一致性，用 Oplog Window、复制延迟、Cache 和磁盘建立可观测性。

### 3 分钟版本

我会先从访问模式设计文档，决定嵌入还是引用，并用 JSON Schema Validation 防止灵活 Schema 变成字段混乱。查询通过 Query Planner 选择索引，`explain("executionStats")` 要比较返回量与扫描量。写入 Primary 后进入 WiredTiger 与 Oplog，Secondary 应用 Oplog；Write Concern 决定客户端等待什么确认。

复制集解决副本和选主，分片解决容量与吞吐，Shard 自己仍要做复制。强一致性不能只看 Primary，还要结合 Read Concern、Write Concern、Session 和事务。运维重点是工作集、索引写放大、Oplog Window、复制延迟、备份恢复和 FCV。排障时我按 Driver、查询计划、存储引擎、复制和底层资源收集证据。

## 面试题与递进追问

### 1. MongoDB 为什么叫文档数据库？

参考答案：它以 BSON 文档保存业务对象，文档可嵌套并拥有丰富类型；Collection 类似记录集合，但不能简单等同关系表。

继续追问：

- BSON 比 JSON 多什么？
- 灵活 Schema 为什么仍要验证？
- 什么时候嵌入，什么时候引用？

### 2. 索引为什么会拖慢写入？

参考答案：每次写文档还要维护相关索引，增加 CPU、Cache、磁盘和复制量。索引越多不等于性能越好。

继续追问：

- 复合索引字段顺序怎么定？
- 什么是覆盖查询？
- 如何证明索引有效？

### 3. 复制集如何选主？

参考答案：成员通过心跳感知拓扑，符合条件的 Secondary 发起选举，获得多数票后成为 Primary。多数派不可用时不能正常选出可写 Primary。

继续追问：

- Arbiter 为什么不增加数据冗余？
- 网络分区如何避免双主持续写？
- 客户端如何发现新 Primary？

### 4. `w: "majority"` 是否保证绝不丢数据？

参考答案：它提高已确认写入在多数派上的持久性保证，但仍要结合 Journal、故障模型、配置、备份和业务幂等。数据库副本不能防误删除和业务错误。

继续追问：

- `wtimeout` 后能否直接重试？
- 如何用幂等键确认结果？
- 为什么还需要备份？

### 5. 分片键怎么选？

参考答案：要兼顾高基数、均匀写入、Targeted Query、数据局部性和未来增长。单调时间键容易把写流量集中在一个 Chunk。

继续追问：

- Hashed Key 的代价是什么？
- Scatter-Gather 如何识别？
- 选错后如何 Reshard？

### 6. 事务什么时候用？

参考答案：单文档原子性优先；确实有多个文档必须一起提交时使用事务，并保持短小、限制范围和实现重试。

继续追问：

- 长事务为什么危险？
- 分片事务成本在哪里？
- 如何识别 TransientTransactionError？

### 7. Primary 还活着但查询慢怎么查？

参考答案：先从应用 Trace 拿查询形态，再看慢日志和 Explain，然后看 Cache、磁盘、连接和并发；进程存活不是性能健康。

继续追问：

- `COLLSCAN` 一定错误吗？
- 扫描量和返回量怎么比较？
- 如何安全上线大索引？

## 学习检查清单

- [ ] 我能解释 BSON、Document、Collection 和 `_id`。
- [ ] 我能根据访问模式选择嵌入或引用。
- [ ] 我能跑 CRUD、聚合、索引和 Explain。
- [ ] 我能解释 WiredTiger Cache、Journal 和 Checkpoint。
- [ ] 我能画出 Primary、Oplog 和 Secondary 写入路径。
- [ ] 我能区分 Read Preference、Read Concern 和 Write Concern。
- [ ] 我能解释复制、分片和备份不是同一件事。
- [ ] 我能完成 Primary 停止与重新选举实验。
- [ ] 我能监控复制延迟、Oplog Window、扫描比和 Cache。
- [ ] 我能设计认证、TLS、RBAC、备份、FCV 和回滚。
- [ ] 我能回答事故题和生产系统设计题。

## 学习证据

```text
mongodb-aiops-lab/
  README.md
  compose.yaml
  compose.rs.yaml
  init/01-user.js
  queries/
    crud.js
    aggregation.js
    explain.js
  evidence/
    healthy.json
    validation-error.txt
    explain-before.json
    explain-after.json
    rs-before.json
    election.log
    rs-recovered.json
  notes/
    document-model.md
    consistency.md
    shard-key-review.md
    backup-restore.md
    incident-review.md
```

README 写清镜像版本、连接串脱敏、预期与实际输出、故障时间线、数据清理和哪些步骤未在真实生产验证。

本文边界是从零到生产运维与面试主线，没有穷尽全部聚合 Stage、索引类型、Atlas 服务、加密模式、分片调优、驱动 API 和内部源码。深入时继续阅读目标版本 Manual、Release Notes、Compatibility Changes 和 Security Bulletins。

读完本文也不等于自动具备数据库岗位能力。还需要训练数据建模、操作系统、网络、存储、备份恢复、容量压测、驱动代码和真实事故沟通。
