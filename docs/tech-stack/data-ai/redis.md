# Redis

> 目标：不是只会 `SET` / `GET`，而是能理解 Redis 为什么是“内存数据结构服务器”，掌握 key、TTL、String、Hash、List、Set、Sorted Set、Stream、持久化、内存淘汰、复制、Sentinel、Cluster、安全、慢命令和 AIOps 告警去重/事件流场景。

## 老师先带你认路

今天我们给告警接收器做一个“短期记事本”：同一告警反复到达时，不重复消耗分析资源。你暂时不必会数据库开发，先认识三个对象。进程是正在运行的程序；端口是网络连接找到某个服务的入口；键值对是“用一个名字找到一份内容”，这里的键不是加密密钥。Redis 服务端保管数据，命令行客户端负责发出请求，它们不是同一个程序。

本课使用已经安装并启动的 Docker Desktop 或 Linux Docker，以及一个能输入命令的终端。Docker 把教学服务放在独立容器里，容器可以理解为隔离的运行环境，但同一宿主机故障仍会影响所有容器。不会 Docker 的同学只需先读 [Docker](../cloud-native/docker.md) 的镜像、容器、端口部分；需要理解回环地址时读 [网络基础](../foundation/networking.md)，写告警程序时再补 [Python](../foundation/python.md) 的字典、函数和异常。

第一遍走“连接、键、类型、过期、去重实验”；第二遍再追踪一次请求怎样执行，为什么缓存能返回旧值，为什么主节点成功返回后仍要考虑故障丢失。本课的验收不是截图里出现一个成功，而是你能预测重复请求、过期、错误类型和消费者中断的结果。文中的服务实验是供读者执行的步骤与预期，本次文档修订没有启动 Redis，也没有完成真实集群或生产压测。

## 官方资料

优先读这些 Redis 官方资料：

- [Redis Open Source](https://redis.io/docs/latest/get-started/)
- [Redis data types](https://redis.io/docs/latest/develop/data-types/)
- [Redis CLI](https://redis.io/docs/latest/develop/tools/cli/)
- [Redis commands](https://redis.io/docs/latest/commands/)
- [Redis strings](https://redis.io/docs/latest/develop/data-types/strings/)
- [Redis hashes](https://redis.io/docs/latest/develop/data-types/hashes/)
- [Redis lists](https://redis.io/docs/latest/develop/data-types/lists/)
- [Redis sets](https://redis.io/docs/latest/develop/data-types/sets/)
- [Redis sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)
- [Redis streams](https://redis.io/docs/latest/develop/data-types/streams/)
- [Redis keyspace](https://redis.io/docs/latest/develop/use/keyspace/)
- [Redis persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
- [Redis replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)
- [High availability with Redis Sentinel](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/)
- [Scale with Redis Cluster](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/)
- [Redis security](https://redis.io/docs/latest/operate/oss_and_stack/management/security/)
- [Redis ACL](https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/)
- [INFO command](https://redis.io/docs/latest/commands/info/)
- [SLOWLOG GET](https://redis.io/docs/latest/commands/slowlog-get/)
- [Diagnosing latency issues](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/)

说明：本文按 Redis 官方文档结构整理，用 AIOps 场景重新讲解，不复制官方全文。

## 场景开场

同一个告警 5 分钟内来了 300 次：

```text
HighErrorRate
service=order-api
instance=10.0.1.11
severity=critical
```

如果每一条都发通知，值班同学会被刷屏。你需要回答：

- 这条告警刚刚是不是已经处理过？
- 5 分钟内同一 fingerprint 是否只通知一次？
- 某个服务最近 1 分钟失败了多少次？
- LLM 已经分析过同样的告警，能不能缓存结果？
- 待分析告警能不能先放进队列？
- 多个 worker 能不能各自消费事件并确认处理？

这类问题不是 MySQL 最擅长的长期关系查询，也不是 Prometheus 的时序指标原始存储，而是“短期、快速、状态型”的问题。

Redis 擅长的正是这个位置：在内存里保存 key-value 和多种数据结构，用低延迟命令完成缓存、计数、去重、队列、排行榜、事件流和临时状态管理。

## 一句话人话版

Redis 是一个高性能内存数据结构服务器：每个 key 对应一种数据结构，你用不同命令对这些结构做原子操作，从而实现缓存、计数、去重、队列、限流、事件流和短期状态。

## 小白可能会问

- Redis 为什么快？是不是因为所有数据都在内存？
- Redis 和 MySQL 的区别是什么？
- String、Hash、List、Set、Sorted Set、Stream 分别适合什么场景？
- key 怎么设计才不会乱？
- TTL 和 `EXPIRE` 为什么对告警去重重要？
- Redis 内存打满会发生什么？
- RDB 和 AOF 是什么？Redis 重启后数据会不会丢？
- Redis 单线程为什么还能快？慢命令为什么危险？
- 复制、Sentinel、Cluster 分别解决什么问题？
- Redis 可以做消息队列吗？什么时候该用 Kafka？

## 官方知识地图

Redis 官方文档可以按这张地图理解：

```text
Redis（内存数据结构服务）
  -> Get started（入门）
     -> install（安装）
     -> redis-server（Redis 服务端进程）
     -> redis-cli（Redis 命令行客户端）
     -> clients（客户端）
  -> Data types（数据类型）
     -> strings（字符串）
     -> hashes（字段映射）
     -> lists（列表）
     -> sets（集合）
     -> sorted sets（有序集合）
     -> streams（追加式消息流）
     -> bitmaps（位图） / bitfields（位字段）
     -> geospatial（地理位置）
     -> HyperLogLog（近似基数统计结构） / probabilistic（概率数据结构）
     -> JSON（结构化文本数据格式） / time series（时间序列） / vector sets（向量集合）
  -> Commands（命令）
     -> key commands（键操作命令）
     -> string commands（字符串命令）
     -> hash commands（哈希命令）
     -> list commands（列表命令）
     -> set commands（集合命令）
     -> sorted set commands（有序集合命令）
     -> stream commands（消息流命令）
     -> server commands（服务器命令）
  -> Operate（运行管理）
     -> persistence（持久化）
     -> replication（复制）
     -> Sentinel（哨兵故障检测与切换机制）
     -> Cluster（分片集群）
     -> security（安全） / ACL（访问控制列表）
     -> memory optimization（内存优化）
     -> latency troubleshooting（延迟排查）
     -> monitoring（监控） with INFO（运行信息命令） / SLOWLOG（慢命令日志）
```

初学路线：

```text
redis-cli（Redis 命令行客户端）
  -> key（键） / TTL（剩余生存时间）
  -> String（字符串） / Hash（字段映射） / Set（集合） / List（列表） / Sorted Set（有序集合） / Stream（消息流）
  -> key naming（键命名）
  -> memory and eviction（内存与淘汰）
  -> persistence: RDB（内存快照文件） / AOF（追加写操作日志）
  -> replication（复制）
  -> Sentinel / Cluster concepts（哨兵高可用与分片集群概念）
  -> security（安全） / ACL（访问控制列表）
  -> INFO（运行信息命令） / SLOWLOG（慢命令日志） / latency（延迟）
  -> AIOps deduplication / event stream（智能运维告警去重与事件流）
```

## Redis 在 AIOps 链路中的位置

AIOps 常见数据系统分工：

| 系统 | 适合 | 不适合 |
|---|---|---|
| MySQL | 长期结构化事实、关联查询、事务 | 高频临时状态 |
| Redis | 缓存、去重、计数、短期状态、简单队列、事件流 | 长期复杂关系分析 |
| Kafka | 大规模持久事件流、解耦、重放 | 低延迟 key-value 查询 |
| Prometheus | 指标和告警规则 | 工单、人工反馈 |
| Loki / Elasticsearch | 日志检索 | 事务和强关系查询 |
| 向量数据库 | embedding 相似检索 | 计数、缓存、队列 |

一个 AIOps 告警处理链路：

```text
Alertmanager webhook（告警管理器发出的事件回调请求）
  -> FastAPI receiver（FastAPI 请求接收服务）
  -> Redis Set/String 做去重和限流
  -> Redis Stream 写入待处理事件
  -> worker（后台工作进程）消费事件
  -> LLM（大语言模型）或规则分析
  -> MySQL 保存长期结果
  -> Grafana / FastAPI 展示
```

箭头表示告警事件及处理结果的流向，不表示整条链路是一个原子事务。fingerprint 是按稳定告警字段生成的指纹，作用是识别同一类告警；embedding 是把内容转成向量的表示，作用是比较语义相似度，两者不要混为同一去重规则。Redis 负责：

- 快速判断是否重复。
- 保存短期窗口。
- 缓存昂贵结果。
- 暂存待处理任务。
- 给 worker 分发事件。

## Redis 是什么

Redis 官方把 Redis 描述为内存数据存储，可作为缓存、向量数据库、文档数据库、流处理引擎和消息中间件等使用。对初学者来说，先抓住这句话：

```text
Redis is an in-memory data structure server.
```

重点有三个：

1. **in-memory**：主要在内存里读写，所以快，但要关注内存容量。
2. **data structure**：不是只有字符串，还有 hash、list、set、sorted set、stream 等结构。
3. **server**：它是一个网络服务，客户端通过协议发命令。

Redis 不是“小号 MySQL”。MySQL 的核心是关系模型、事务和长期结构化查询；Redis 的核心是内存数据结构和原子命令。

## 核心执行模型

简化架构：

```text
client（客户端）
  -> TCP 6379（Redis 常见 TCP 端口）
  -> redis-server（Redis 服务端进程）
      -> command parser（命令解析器）
      -> event loop（事件循环）
      -> in-memory keyspace（内存键空间）
      -> data structures（数据结构）
      -> persistence: RDB（内存快照文件） / AOF（追加写操作日志）
      -> replication（复制）
```

关键概念：

| 概念 | 是什么 | 初学要点 |
|---|---|---|
| keyspace | Redis 当前所有 key 的集合 | key 命名决定可维护性 |
| command | 操作 Redis 的命令 | `SET`、`GET`、`HSET`、`XADD` |
| data type | key 对应的数据结构 | 选错结构会让代码复杂 |
| TTL | key 的过期时间 | 去重、缓存必须会 |
| persistence | 把内存数据保存到磁盘 | RDB、AOF |
| replication | 主节点同步到副本 | 读扩展和高可用基础 |
| Sentinel | 非 Cluster 场景高可用 | 监控、通知、自动故障转移 |
| Cluster | 分片扩展 | 多节点分摊 key |

## 安装和连接

### Docker 启动

先执行 `docker ps -a`，确认没有同名 `aiops-redis` 容器；若存在，先确认归属，不能覆盖。以下用一行 PowerShell 兼容命令启动独立教学容器，只绑定本机回环地址，没有挂载业务数据。本课固定 Redis 7.4.11，标签可在 [Docker Official Images Redis 清单](https://github.com/docker-library/official-images/blob/master/library/redis)核对；这是可复现的教学基线，不是要求已有生产集群直接升级。

```powershell
docker run -d --name aiops-redis -p 127.0.0.1:6379:6379 redis:7.4.11
docker exec aiops-redis redis-server --version # 记录实际服务端版本
docker image inspect redis:7.4.11 --format '{{json .RepoDigests}}' # 记录镜像摘要
```

返回容器标识后，仍要用下面的 PING 验证服务就绪。端口已占用时先停止本实验，不要停止未知进程；也可把宿主端口改成未占用的 16379，并同步改 Python 客户端端口。后文裸写的 `SET`、`GET` 等都输入到交互式 redis-cli，不是直接输给 PowerShell；带 `redis-cli` 的命令则在安装了客户端的终端执行。

连接：

```bash
docker exec -it aiops-redis redis-cli
```

测试：

```bash
PING
```

预期：

```text
PONG
```

### redis-cli 执行单条命令

```bash
redis-cli -h 127.0.0.1 -p 6379 PING
redis-cli SET hello world
redis-cli GET hello
```

Docker：

```bash
docker exec aiops-redis redis-cli SET hello world
docker exec aiops-redis redis-cli GET hello
```

### 连接参数

| 参数 | 意思 |
|---|---|
| `-h` | Redis 主机 |
| `-p` | Redis 端口，默认 6379 |
| `-a` | 密码参数，可能泄露到命令历史或进程参数，生产避免明文使用 |
| `-n` | 选择数据库编号 |
| `--raw` | 原样输出 |
| `--scan` | 使用 SCAN 迭代 key |

## Key 和 TTL

Redis 的所有数据都通过 key 访问。

### key 命名

推荐格式：

```text
domain:entity:scope:field
```

AIOps 示例：

```text
alert:dedup:order-api:high-error-rate:10.0.1.11
alert:count:order-api:critical:20260702
service:state:order-api
job:queue:runbook
llm:cache:alert-summary:sha256
stream:alerts
```

原则：

- 用冒号分层。
- 包含业务含义。
- 避免完全随机的 key。
- 热点 key 要小心。
- 临时 key 必须设置 TTL。
- 生产不要用 `KEYS *` 扫全库。

### TTL

设置过期：

```bash
SET alert:dedup:fp123 seen EX 300
TTL alert:dedup:fp123
```

给已有 key 设置过期：

```bash
EXPIRE alert:dedup:fp123 300
```

取消过期：

```bash
PERSIST alert:dedup:fp123
```

查看 key 是否存在：

```bash
EXISTS alert:dedup:fp123
```

删除：

```bash
DEL alert:dedup:fp123
```

TTL 在 AIOps 里的核心作用：

```text
同一告警 fingerprint 在 5 分钟内只处理一次
5 分钟后 key 自动消失
下次告警可以重新处理
```

## 数据类型总览

Redis 官方强调：Redis 是 data structure server。学习时不要只记命令，要先判断数据结构。

| 类型 | 结构 | 典型命令 | AIOps 场景 |
|---|---|---|---|
| String | 字节字符串 | `SET`、`GET`、`INCR` | 缓存、计数、锁标记 |
| Hash | field-value 对象 | `HSET`、`HGETALL` | 服务状态、告警对象 |
| List | 插入顺序列表 | `LPUSH`、`BRPOP` | 简单队列 |
| Set | 不重复集合 | `SADD`、`SISMEMBER` | 去重、成员判断 |
| Sorted Set | 带 score 的集合 | `ZADD`、`ZRANGE` | 排行榜、时间窗口 |
| Stream | append-only 事件日志 | `XADD`、`XREADGROUP` | 事件流、消费组 |
| Bitmap | bit 操作 | `SETBIT`、`BITCOUNT` | 活跃状态压缩 |
| HyperLogLog | 近似基数 | `PFADD`、`PFCOUNT` | 大规模近似去重计数 |
| JSON | 文档结构 | `JSON.SET` 等 | 结构化缓存 |
| Time series | 时间序列 | `TS.ADD` 等 | 轻量时序 |
| Vector sets | 向量集合 | `VADD`、`VSIM` 等 | 相似告警、语义检索 |

初学先掌握 String、Hash、List、Set、Sorted Set、Stream。后面的 JSON、Time series 和 Vector sets 是官方知识版图，不保证本课 7.4 基础镜像内置这些扩展能力；遇到未知命令先查发行版与模块，不要把“网上有该命令”当作当前环境已安装。

## String

String 是最基础的数据类型。它可以保存文本、数字、JSON 字符串、二进制内容。

### 缓存一个告警摘要

```bash
SET llm:cache:alert-summary:fp123 "order-api 5xx increased after deployment" EX 1800
GET llm:cache:alert-summary:fp123
```

含义：

- key 保存 LLM 对某个告警 fingerprint 的摘要。
- `EX 1800` 表示 1800 秒后自动过期。
- 同样告警再次出现时，可以先查缓存，避免重复调用 LLM。

### 计数器

```bash
INCR alert:count:order-api:critical:20260702
EXPIRE alert:count:order-api:critical:20260702 86400
GET alert:count:order-api:critical:20260702
```

`INCR` 是原子操作。多个客户端同时加一，也不会丢计数。

### SET NX EX

告警去重最常用：

```bash
SET alert:dedup:fp123 seen NX EX 300
```

含义：

| 片段 | 意思 |
|---|---|
| `SET` | 设置 key |
| `alert:dedup:fp123` | 去重 key |
| `seen` | value |
| `NX` | key 不存在才设置 |
| `EX 300` | 300 秒过期 |

如果第一次设置成功，说明需要处理。后续 300 秒内再设置会失败，说明重复。

## Hash

Hash 适合保存对象。

### 保存服务状态

```bash
HSET service:state:order-api status degraded error_rate 0.23 p95_latency_ms 1200 updated_at 2026-07-02T10:20:00Z

HGETALL service:state:order-api
```

适合：

- 当前服务状态。
- 告警上下文。
- 任务元数据。

### 读取字段

```bash
HGET service:state:order-api status
HMGET service:state:order-api status error_rate
```

### 增加字段数值

```bash
HINCRBY service:state:order-api restart_count 1
```

### Hash 和 JSON 的选择

| 需求 | 推荐 |
|---|---|
| 字段简单、经常单字段读写 | Hash |
| 嵌套结构复杂 | Redis JSON |
| 需要长期关系查询 | MySQL |

## List

List 是按插入顺序排列的列表。

### 简单队列

生产者：

```bash
LPUSH job:queue:alert-analysis '{"alert_id":1001,"service":"order-api"}'
```

消费者：

```bash
BRPOP job:queue:alert-analysis 0
```

含义：

- `LPUSH` 从左侧放入任务。
- `BRPOP` 从右侧阻塞弹出任务。
- `0` 表示一直等。

### List 适合什么

适合：

- 简单任务队列。
- 最近 N 条记录。
- 低复杂度异步处理。

不适合：

- 需要消费组。
- 需要消息确认。
- 需要重放。
- 需要多消费者可靠分配。

这些场景用 Stream 或 Kafka 更合适。

### 最近 N 条告警

```bash
LPUSH recent:alerts '{"service":"order-api","alert":"HighErrorRate"}'
LTRIM recent:alerts 0 99
LRANGE recent:alerts 0 9
```

`LTRIM` 保留前 100 条，避免 list 无限增长。

## Set

Set 是不重复集合。

### 告警去重集合

```bash
SADD alert:fingerprints fp-order-api-5xx
SISMEMBER alert:fingerprints fp-order-api-5xx
EXPIRE alert:fingerprints 600
```

含义：

- `SADD` 添加 fingerprint。
- `SISMEMBER` 判断是否存在。
- `EXPIRE` 给整个集合设置 10 分钟过期。

注意：如果所有告警都放进同一个 set，TTL 会作用在整个 set 上。更常见的去重方式是每个 fingerprint 一个 String key，用 `SET NX EX`。

### Set 运算

```bash
SADD alerts:team:sre order-api payment-api gateway
SADD alerts:team:backend order-api checkout-api
SINTER alerts:team:sre alerts:team:backend
SUNION alerts:team:sre alerts:team:backend
```

可用于：

- 服务归属交集。
- 告警影响范围。
- 去重成员判断。

## Sorted Set

Sorted Set 是带分数的集合。

### 按告警次数排行

```bash
ZINCRBY alert:rank:services 1 order-api
ZINCRBY alert:rank:services 1 payment-api
ZREVRANGE alert:rank:services 0 9 WITHSCORES
```

含义：

- `ZINCRBY` 增加某个成员分数。
- `ZREVRANGE` 按分数从高到低取 TopN。

### 时间窗口

用时间戳做 score：

```bash
ZADD alert:events:order-api 1782960000 fp1
ZADD alert:events:order-api 1782960060 fp2
ZRANGEBYSCORE alert:events:order-api 1782960000 1782960300
```

清理窗口外数据：

```bash
ZREMRANGEBYSCORE alert:events:order-api -inf 1782959700
```

适合做：

- 最近 5 分钟事件窗口。
- 服务告警排行榜。
- 延迟任务的简单调度。

## Stream

Stream 是 Redis 的 append-only 事件日志，支持消费组。

### 写入事件

```bash
XADD stream:alerts '*' service order-api severity critical alert HighErrorRate
```

返回类似：

```text
1782960000000-0
```
这是 stream entry id，通常由毫秒时间戳和序号组成。

### 读取事件

```bash
XREAD COUNT 10 STREAMS stream:alerts 0
```

从头读。

只读新消息：

```bash
XREAD BLOCK 5000 STREAMS stream:alerts '$'
```

### 消费组

创建消费组：

```bash
XGROUP CREATE stream:alerts aiops-workers 0 MKSTREAM
```

消费：

```bash
XREADGROUP GROUP aiops-workers worker-1 COUNT 10 STREAMS stream:alerts '>'
```

确认：

```bash
XACK stream:alerts aiops-workers 1782960000000-0
```

查看 pending：

```bash
XPENDING stream:alerts aiops-workers
```

### Stream 适合什么

适合：

- AIOps 事件流水线。
- 多 worker 消费。
- 需要确认处理。
- 需要短期保留和重放。

不适合：

- 超大规模长期事件平台。
- 跨团队复杂事件总线。
- 强持久、海量重放场景。

这些更适合 Kafka。

### 限制 Stream 长度

```bash
XADD stream:alerts MAXLEN ~ 10000 '*' service order-api severity critical
```

`MAXLEN` 防止 stream 无限增长。

## Bitmap 和 HyperLogLog

### Bitmap

Bitmap 用 bit 表示状态。

```bash
SETBIT service:active:20260702 1001 1
GETBIT service:active:20260702 1001
BITCOUNT service:active:20260702
```

适合：

- 某服务某天是否活跃。
- 用户或实例状态压缩。

### HyperLogLog

HyperLogLog 用很小内存近似统计基数。

```bash
PFADD alert:unique-services:20260702 order-api payment-api gateway
PFCOUNT alert:unique-services:20260702
```

适合：

- 大规模近似去重计数。
- 不要求精确列表，只要数量。

## 缓存模式

### Cache-aside

最常见模式：

```text
Application（应用）读取 Redis
  -> Hit（命中）：返回缓存值
  -> Miss（未命中）：读取 MySQL / API（权威数据库或接口）
      -> Fill with TTL（回填缓存并设置生存时间）
      -> Return result（返回查询结果）
```

Python 伪代码：

```python
cached = redis.get(cache_key)
if cached is not None:
    return cached

data = query_mysql()
redis.set(cache_key, data, ex=300)
return data
```

适合缓存：

- LLM 告警摘要。
- 查询报表。
- 服务元数据。
- Dashboard 热点数据。

### 缓存穿透

查询一个根本不存在的数据，缓存没有，数据库也没有。攻击或错误请求会一直打到后端。

解决：

- 缓存空结果，TTL 短一点。
- 参数校验。
- Bloom filter（布隆过滤器：以少量空间快速排除确定不存在的成员，可能误报存在）。

### 缓存击穿

一个热点 key 过期，大量请求同时打到后端。

解决：

- 热点 key 延长 TTL。
- 互斥锁。
- 提前刷新。
- 合并同一键的并发回源；随机 TTL 主要用于错开不同键，不能单独阻止一个热点键失效时的并发。

### 缓存雪崩

大量 key 同时过期，后端压力暴涨。

解决：

- TTL 加随机抖动。
- 分批刷新。
- 限流。
- 降级。

## 限流

### 固定窗口计数

```bash
INCR rate:order-api:202607021020
EXPIRE rate:order-api:202607021020 60
```

如果计数超过阈值，就拒绝或降级。

缺点：窗口边界可能突刺。

### 滑动窗口思路

用 Sorted Set 保存时间戳：

```bash
ZADD rate:order-api 1782960000 req-1
ZREMRANGEBYSCORE rate:order-api -inf 1782959940
ZCOUNT rate:order-api 1782959940 1782960000
```

更精确，但命令更多。

## 分布式锁

Redis 常被用于锁，但要小心。

最小写法：

```bash
SET lock:runbook:order-api request-123 NX EX 30
```

含义：

- key 不存在才设置。
- 设置过期时间，防止死锁。
- value 应该是请求唯一 id。

释放锁不能简单 `DEL`，要确认 value 是自己的锁。否则可能删掉别人刚获得的锁。

生产级分布式锁要认真评估，不要把它当万能工具。

## 持久化

Redis 主要在内存里，但可以持久化。

### RDB

RDB 是快照。

特点：

- 在某些时间点生成数据快照。
- 恢复速度较快。
- 两次快照之间的数据可能丢失。

适合：

- 可接受少量数据丢失。
- 备份。
- 快速恢复。

### AOF

AOF 是 append-only file，记录写命令。

特点：

- 数据丢失窗口更小。
- 文件可能更大。
- 可 rewrite 压缩。

开启：

```bash
redis-cli CONFIG SET appendonly yes
```

生产配置应写到配置文件或部署配置。

### RDB + AOF

重要数据可以同时使用 RDB 和 AOF。

但要记住：

```text
Redis 持久化不是关系型数据库事务替代品。
```

如果数据必须强一致、长期保存、复杂查询，仍然应落 MySQL、PostgreSQL 或事件存储。

## 内存和淘汰策略

Redis 快，是因为主要在内存里。代价是必须管理内存。

### 查看内存

```bash
redis-cli INFO memory
```

重点看：

| 字段 | 意思 |
|---|---|
| `used_memory` | Redis 分配器使用的内存 |
| `used_memory_human` | 人类可读内存 |
| `maxmemory` | 最大内存限制 |
| `mem_fragmentation_ratio` | 内存碎片比例 |

### maxmemory

设置最大内存：

```bash
redis-cli CONFIG SET maxmemory 512mb
```

生产应写配置文件，不要只临时设置。

### maxmemory-policy

内存满时如何淘汰 key：

| 策略 | 含义 | 适合 |
|---|---|---|
| `noeviction` | 不淘汰，写入报错 | 不允许静默丢数据 |
| `allkeys-lru` | 所有 key 中淘汰最近最少使用 | 通用缓存 |
| `volatile-lru` | 只淘汰设置过 TTL 的 key | 临时缓存 |
| `allkeys-lfu` | 所有 key 中淘汰低频使用 | 热点缓存 |
| `volatile-ttl` | 淘汰 TTL 更短的 key | 有过期语义的缓存 |
| `allkeys-random` | 随机淘汰 | 少用 |

AIOps 缓存通常可以用 LRU/LFU，但告警去重 key 丢失会导致重复通知，所以要理解业务影响。

## 复制

Redis replication 让一个 primary 把数据复制到 replica。

```text
client（客户端） writes
  -> primary（主节点）
  -> replicate to replicas（副本）
```

用途：

- 读扩展。
- 数据冗余。
- 高可用基础。

注意：

- Redis 复制通常是异步的。
- primary 写成功不代表 replica 立刻有数据。
- replica 可以用于读，但要接受短暂延迟。

可选复制观察：仅在同名容器和网络均不存在时执行，使用独立教学网络，不占用前面单节点的端口；两端统一镜像，避免引入跨版本变量。

```powershell
docker network create redis-repl-lesson
docker run -d --name redis-primary --network redis-repl-lesson redis:7.4.11
docker run -d --name redis-replica --network redis-repl-lesson redis:7.4.11 redis-server --replicaof redis-primary 6379
```

查看角色：

```powershell
docker exec redis-primary redis-cli INFO replication
docker exec redis-replica redis-cli INFO replication
```

预期分别看到主、副本角色，副本的 `master_link_status` 为 `up`；失败先看副本日志和网络成员。这里没有哨兵，不会自动切换。结束先执行 `docker stop redis-replica redis-primary`，再执行 `docker rm -v redis-replica redis-primary` 删除本实验容器及匿名数据卷，最后执行 `docker network rm redis-repl-lesson`；所有教学数据会消失，保留脱敏观察记录。

## Sentinel

Sentinel 解决非 Cluster 架构下的高可用。

它做三件事：

| 能力 | 说明 |
|---|---|
| monitoring | 监控 primary 和 replicas |
| notification | 发现异常时通知 |
| automatic failover | primary 故障时提升 replica |

简化模型：

```text
clients（客户端）
  -> ask Sentinel（哨兵故障检测与切换机制） for current primary（主节点）
  -> connect Redis primary（主节点）

Sentinels（哨兵节点集合）
  -> monitor（监控） primary（主节点） / replicas（副本）
  -> failover when needed（按策略执行故障切换）
```

要点：

- Sentinel 本身也要多个节点。
- 客户端需要支持 Sentinel。
- Sentinel 解决高可用，不解决数据分片。

## Cluster

Redis Cluster 用于水平扩展。

核心：

```text
key（键）
  -> hash slot（哈希槽）
  -> node（节点）
```

Redis Cluster 把 key 空间拆成 16384 个 hash slots，不同节点负责不同 slot。

适合：

- 数据量超过单机内存。
- QPS 需要多节点分摊。
- 需要分片。

注意：

- 多 key 操作要求 key 在同一个 slot，或使用 hash tag。
- 运维复杂度比单机/Sentinel 高。
- 初学先掌握单机和数据类型，再学 Cluster。

## 安全和 ACL

Redis 默认不应该暴露到公网。

### 基础安全原则

- 只监听内网地址。
- 开启认证。
- 使用 ACL 限制命令和 key。
- 不把密码写进代码仓库。
- 禁用或限制危险命令。
- 使用 TLS 或内网安全通道。

### AUTH

如果配置了密码：

```bash
redis-cli --user aiops_reader --askpass PING
```

`--askpass` 交互读取密码，避免把密码直接写入命令参数；账号还需有 `PING` 权限。远程连接应同时按环境配置 TLS，认证不会自动加密流量。

### ACL

创建只读用户的语法示意，下面内容输入已授权管理员的 redis-cli；`reader_pwd` 仅是占位文本，不能作为实际密码，也不要把这条带 `>` 的语法直接交给宿主机 shell：

先用 `ACL GETUSER aiops_reader` 核对账号不存在。若已存在，停止并检查原权限，因为 SETUSER 也会修改已有账号，不能把新增示例当成无影响操作。

```bash
ACL SETUSER aiops_reader on >reader_pwd ~service:* +ping +get +hget +hgetall +ttl
```

含义：

| 片段 | 意思 |
|---|---|
| `aiops_reader` | 用户名 |
| `on` | 启用 |
| `>reader_pwd` | 设置密码 |
| `~service:*` | 只能访问匹配 key |
| `+get` | 允许 GET 命令 |

查看用户：

```bash
ACL LIST
```

应用不要使用全权限默认用户。ACL 输出可能含凭据摘要、内部键规则和身份信息，学习证据只保留脱敏权限结构，不上传完整输出。

## 监控和排障入口

### INFO

```bash
redis-cli INFO server
redis-cli INFO clients
redis-cli INFO memory
redis-cli INFO stats
redis-cli INFO replication
redis-cli INFO keyspace
```

重点指标：

| 指标 | 含义 | 风险 |
|---|---|---|
| `connected_clients` | 当前客户端数 | 连接泄漏 |
| `blocked_clients` | 阻塞客户端数 | 队列/阻塞命令 |
| `used_memory` | 已用内存 | 接近 maxmemory |
| `instantaneous_ops_per_sec` | 每秒操作数 | 流量突增 |
| `keyspace_hits` / `keyspace_misses` | 缓存命中/未命中 | 缓存效果 |
| `evicted_keys` | 被淘汰 key 数 | 内存压力 |
| `expired_keys` | 过期 key 数 | TTL 工作情况 |
| `rejected_connections` | 拒绝连接 | maxclients 或资源问题 |

### SLOWLOG

查看慢命令：

```bash
redis-cli SLOWLOG GET 10
```

慢命令会影响 Redis 响应，因为命令执行时间过长会占住事件循环。

常见慢命令来源：

- 大 key。
- `KEYS *`。
- 一次取超大集合。
- 复杂 Lua 脚本。
- 长时间执行的服务端计算；注意它与等待数据的阻塞客户端不是一回事。

### LATENCY

Redis 提供 latency 诊断命令：

```bash
redis-cli LATENCY DOCTOR
redis-cli LATENCY LATEST
```

用于分析延迟尖刺。

## 大 key 和热 key

### 大 key

大 key 指 value 特别大，或集合元素特别多。

风险：

- 网络传输大。
- 删除阻塞。
- 复制压力。
- AOF/RDB 压力。

排查思路：

```bash
redis-cli --bigkeys
```

生产执行要谨慎，选择低峰。

### 热 key

热 key 指大量请求集中访问同一个 key。

风险：

- 单节点压力高。
- Cluster 中某个 slot 变热点。

处理：

- 本地缓存。
- 拆 key。
- 加随机分片。
- 降低访问频率。

## AIOps 入门实验：告警去重器

目标：用 Redis 实现“同一告警 5 分钟内只处理一次”。

目录：

```text
projects/redis-alert-dedup/
  README.md
  requirements.txt
  dedup.py
  stream_demo.sh
```

### requirements.txt

```text
redis
```

### dedup.py

```python
import hashlib
import json

import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)


def fingerprint(alert: dict) -> str:
    raw = json.dumps(
        [
            alert["service"],
            alert["name"],
            alert["instance"],
            alert["severity"],
        ],
        ensure_ascii=False,
        separators=(",", ":"),
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def should_process(alert: dict, ttl_seconds: int = 300) -> bool:
    fp = fingerprint(alert)
    key = f"alert:dedup:{fp}"
    value = json.dumps(alert, ensure_ascii=False)
    return r.set(key, value, nx=True, ex=ttl_seconds) is True


sample = {
    "service": "order-api",
    "name": "HighErrorRate",
    "instance": "10.0.1.11",
    "severity": "critical",
}

if should_process(sample):
    print("process")
else:
    print("duplicate")
```

运行：

```bash
pip install -r requirements.txt
python dedup.py
python dedup.py
```

第一次输出：

```text
process
```

第二次输出：

```text
duplicate
```

学习点：

- fingerprint 决定去重粒度。
- `SET NX EX` 是原子去重窗口。
- TTL 到期后告警会重新处理。

固定顺序的 JSON 数组避免简单分隔符拼接时出现字段边界歧义；生产还应加入租户、规则标识并统一字段规范。该程序假设上面四个字段已通过校验，不能直接接收任意外部结构。Redis 连接异常也不能等同于“重复告警”，需要明确是保守处理、暂存重试还是人工介入，最终工单幂等仍由业务系统保证。

在自己的 `projects/redis-alert-dedup/` 目录保存以上文件后运行；如果缺少依赖，先确认使用的是同一个 Python 环境，可用 `python -m pip install -r requirements.txt`。如果连不上，先看教学容器 PING 和宿主端口；若第一次就是 duplicate，检查是不是上次创建的指纹键仍在五分钟窗口内。实验结束让该键自然过期，或仅删除已核对的本次精确键名，不扫描删除其他告警数据。

## AIOps 入门实验：Stream 事件流

### 写入事件

```bash
redis-cli XADD stream:alerts '*' service order-api severity critical alert HighErrorRate
redis-cli XADD stream:alerts '*' service payment-api severity warning alert HighLatency
```

### 创建消费组

```bash
redis-cli XGROUP CREATE stream:alerts aiops-workers 0 MKSTREAM
```

如果组已存在会返回 `BUSYGROUP`。先用 `XINFO GROUPS stream:alerts` 确认是否为自己前次实验的组；可以复用并核对游标，但不能为了消除报错就删除未知 stream。后文故障实验使用独立课堂键，方便安全重做。

### 消费

```bash
redis-cli XREADGROUP GROUP aiops-workers worker-1 COUNT 10 STREAMS stream:alerts '>'
```

### 确认

把实际返回的 entry id 填进去：

```bash
redis-cli XACK stream:alerts aiops-workers 1782960000000-0
```

### 查看待确认

```bash
redis-cli XPENDING stream:alerts aiops-workers
```

学习点：

- Stream 可以承载 AIOps 事件流水线。
- 消费组让多个 worker 分工。
- `XACK` 表示处理完成。
- pending 消息需要补偿处理。

## 常用命令字典

### PING

```bash
redis-cli PING
```

作用：检查 Redis 是否响应。

### SET / GET

```bash
SET key value
GET key
```

作用：写入和读取 String。

### SET NX EX

```bash
SET alert:dedup:fp123 seen NX EX 300
```

作用：原子去重窗口。

### TTL / EXPIRE

```bash
TTL key
EXPIRE key 300
```

作用：查看和设置过期时间。

### DEL / UNLINK

```bash
DEL key
UNLINK key
```

作用：删除 key。`UNLINK` 是异步释放内存，更适合删除大 key。

### SCAN

```bash
SCAN 0 MATCH alert:* COUNT 100
```

作用：增量扫描 key。生产避免 `KEYS *`。

### HSET / HGETALL

```bash
HSET service:state:order-api status degraded error_rate 0.23
HGETALL service:state:order-api
```

作用：操作 Hash。

### LPUSH / BRPOP

```bash
LPUSH job:queue:aiops task1
BRPOP job:queue:aiops 0
```

作用：简单队列。

### SADD / SISMEMBER

```bash
SADD alert:fingerprints fp1
SISMEMBER alert:fingerprints fp1
```

作用：集合去重。

### ZINCRBY / ZREVRANGE

```bash
ZINCRBY alert:rank:services 1 order-api
ZREVRANGE alert:rank:services 0 9 WITHSCORES
```

作用：排行。

### XADD / XREADGROUP / XACK

```bash
XADD stream:alerts '*' service order-api alert HighErrorRate
XREADGROUP GROUP aiops-workers worker-1 COUNT 10 STREAMS stream:alerts '>'
XACK stream:alerts aiops-workers 1782960000000-0
```

作用：事件流和消费确认。

### INFO

```bash
INFO memory
INFO clients
INFO stats
```

作用：查看 Redis 状态。

### SLOWLOG GET

```bash
SLOWLOG GET 10
```

作用：查看慢命令。

### CONFIG GET

```bash
CONFIG GET maxmemory
CONFIG GET appendonly
```

作用：查看配置。

### ACL LIST

```bash
ACL LIST
```

作用：查看 ACL 用户和权限。

## 典型故障排查表

| 现象 | 常见原因 | 怎么查 | 怎么修 |
|---|---|---|---|
| 连接不上 | Redis 未启动、端口错、防火墙 | `PING`、`docker ps`、日志 | 启动服务、修端口 |
| `NOAUTH` | 开启认证但没传密码 | 返回错误 | 配置密码 |
| `WRONGTYPE` | 用错数据类型命令 | `TYPE key` | 核对数据归属后修调用或迁移，不能先删业务键 |
| key 不见了 | TTL 到期或被淘汰 | `TTL`、`INFO stats` | 调整 TTL / maxmemory-policy |
| 内存打满 | key 太多、大 key、无 TTL | `INFO memory`、`--bigkeys` | 设置 TTL、清理、扩容 |
| 命中率低 | cache key 设计差或 TTL 太短 | hits/misses | 调 key 和 TTL |
| 慢命令 | 大 key、`KEYS *`、Lua 脚本慢 | `SLOWLOG GET` | 改命令、拆 key |
| 连接数高 | 连接池泄漏 | `INFO clients`、`CLIENT LIST` | 修连接池 |
| Stream pending 堆积 | worker 未 ack 或处理慢 | `XPENDING` | 修 worker、重试 |
| replica 延迟 | 写入压力或网络问题 | `INFO replication` | 查网络、扩容 |
| Sentinel 未切换 | quorum 配置或网络问题 | Sentinel 日志 | 修配置和部署 |
| Cluster MOVED | 客户端不支持 Cluster | 错误信息 | 使用 Cluster-aware client |

## 排障流程

### 连接问题

```text
PING（连通性探测命令）
  -> 检查 host/port
  -> 检查密码/ACL
  -> 检查 bind/protected-mode
  -> 检查网络和容器端口
```

### 内存问题

```text
INFO memory（查看 Redis 内存使用信息）
  -> 看 used_memory / maxmemory
  -> 看 evicted_keys
  -> 找大 key
  -> 检查 TTL
  -> 调整数据模型或淘汰策略
```

### 延迟问题

```text
SLOWLOG（慢命令日志） GET
  -> LATENCY（延迟） DOCTOR
  -> 查大 key
  -> 查阻塞命令
  -> 查 CPU / swap / 磁盘持久化压力
```

## Redis 和 MySQL / Kafka 的边界

| 需求 | Redis | MySQL | Kafka |
|---|---|---|---|
| 5 分钟告警去重 | 很适合 | 可以但不自然 | 可以但重 |
| 长期事故记录 | 不适合 | 很适合 | 适合事件日志 |
| 复杂关联查询 | 不适合 | 很适合 | 不适合直接查询 |
| 高吞吐事件流 | 适合中小规模 | 不适合 | 很适合 |
| 多消费者确认 | Stream 可用 | 不适合 | 很适合 |
| 缓存 LLM 结果 | 很适合 | 可长期保存 | 不适合 |
| 强事务 | 不适合 | 很适合 | 不适合 |

## 面试怎么讲

可以这样讲：

Redis 是内存数据结构服务器，不只是缓存。它用 key 映射不同数据结构，比如 String、Hash、List、Set、Sorted Set 和 Stream，并通过原子命令支持计数、去重、队列、排行和事件流。AIOps 里我会用 Redis 做告警去重窗口、限流计数、LLM 分析结果缓存、短期服务状态和待处理事件流。使用时要特别关注 key 设计、TTL、内存上限、淘汰策略、慢命令、大 key、持久化、复制、高可用和 ACL 安全。

## 学习检查清单

- [ ] 我能解释 Redis 和 MySQL 的区别。
- [ ] 我能使用 `redis-cli` 连接 Redis。
- [ ] 我能设计有业务含义的 key。
- [ ] 我能用 `SET NX EX` 做告警去重。
- [ ] 我能解释 TTL 的作用。
- [ ] 我能用 String 做计数。
- [ ] 我能用 Hash 保存服务状态。
- [ ] 我能用 List 做简单队列。
- [ ] 我能用 Set 做成员去重。
- [ ] 我能用 Sorted Set 做排行榜或时间窗口。
- [ ] 我能用 Stream 写入事件、消费、ACK。
- [ ] 我能解释 RDB 和 AOF。
- [ ] 我能解释 maxmemory 和淘汰策略。
- [ ] 我能说明 replication、Sentinel、Cluster 的区别。
- [ ] 我能用 `INFO` 和 `SLOWLOG` 做基础排障。
- [ ] 我能说明 Redis 在 AIOps 链路中的边界。

## 面试题

1. Redis 是什么？为什么说它是数据结构服务器？
2. Redis 为什么快？快的代价是什么？
3. Redis 和 MySQL 的核心区别是什么？
4. Redis 常见数据类型有哪些？
5. `SET NX EX` 可以解决什么问题？
6. TTL 在告警去重中怎么用？
7. Hash 和 String 存 JSON 有什么区别？
8. List 和 Stream 都能做队列，区别是什么？
9. Set 和 Sorted Set 有什么区别？
10. 缓存穿透、击穿、雪崩分别是什么？
11. RDB 和 AOF 有什么区别？
12. maxmemory-policy 有哪些常见策略？
13. Redis replication、Sentinel、Cluster 分别解决什么问题？
14. 什么是大 key 和热 key？
15. 为什么生产不建议用 `KEYS *`？
16. Redis 慢命令怎么查？
17. Redis Stream 的消费组和 `XACK` 有什么作用？
18. AIOps 项目里 Redis 适合放在哪些环节？

## 机制课堂：成功返回，到底完成了哪一步

### 一次请求为什么可能在 Redis 外面变慢

老师先让你预测：服务端一个 GET 只花几十微秒，应用为什么可能等几百毫秒？客户端必须先从连接池取得可用连接，再把命令编码后发到网络；服务端解析请求、等待执行、访问数据、生成响应；响应还要经过网络和客户端解码。连接池是重复使用网络连接的容器，不是越大越好，连接太少会排队，太多会增加服务端缓冲和调度压力。

Redis 使用 RESP（Redis 序列化协议）表示命令和返回值。我们在终端敲入的文本会被客户端转成协议消息，因此空字符串、空结果和错误是不同类型，程序不能只靠真假判断缓存是否存在。缓存里合法保存的空字节串也算命中，前面的伪代码才使用“不是空对象”的判断。协议边界见 [官方 RESP 说明](https://redis.io/docs/latest/develop/reference/protocol-spec/)。

```text
Client pool（客户端连接池等待）
  -> Network（请求传输）
  -> Parse and queue（服务端解析与等待）
  -> Execute（执行数据结构操作）
  -> Reply buffer（暂存待发送响应的缓冲区）
  -> Client decode（客户端接收并解码）
```

箭头只表示一次请求和响应经过的环节；持久化和复制是相关的数据保护路径，并不意味着每次读取都要经过磁盘。排障时把应用总耗时拆开，才能知道应该修连接池、减小返回数据，还是优化服务端命令。

SLOWLOG 主要记录命令执行耗时，不包含与客户端通信的全部时间。慢日志为空不能排除网络、排队、操作系统调度和客户端自身停顿。先对齐应用延迟、每类命令耗时、服务端 CPU、网络字节和持久化时间，再判断瓶颈；阈值过高或日志长度过短也会让证据缺失。这个观测边界来自 [SLOWLOG 参考](https://redis.io/docs/latest/commands/slowlog/)。

再看一个常见误解：`BRPOP` 等待列表出现元素时，阻塞的是那个客户端的请求，不是让整个服务器停止服务。它可以让空闲消费者不必不停轮询。相反，一个扫描大量元素的命令或耗时脚本会占据执行资源，拖慢其他请求。`blocked_clients` 增长要结合等待队列和消费者数量解释，不能直接报“主线程卡死”；[BRPOP 文档](https://redis.io/docs/latest/commands/brpop/)明确了这种等待行为。

### 原子性解决交错，不自动解决业务失败

原子操作可以理解为：对其他命令而言，这次操作不会露出做了一半的中间状态。假设两个接收器都先 GET 再 SET，它们可能同时读到不存在，随后各自通知。`SET NX EX` 把检查、写值和过期合在一次操作里，消除了这段并发空隙。可是“登记成功”与“通知发出”不在同一个事务内，登记后程序退出仍可能漏通知。

`MULTI` 把后续命令加入队列，`EXEC` 执行队列，期间不会被其他客户端命令插入；`WATCH` 则监视键是否在执行前发生变化，是乐观并发控制。乐观的意思是先假设冲突少，提交时发现冲突再重读，而不是一开始就让所有人排队。执行前的语法错误与执行时的类型错误处理不同，后者不意味着已经执行的命令自动撤销，详见 [事务说明](https://redis.io/docs/latest/develop/using-commands/transactions/)。

前面固定窗口的 INCR 与 EXPIRE 是教学拆分，不是完整生产限流器。程序在两者之间退出会留下无过期计数；每次都重新 EXPIRE 又会延长生命周期。生产可用短小脚本把“计数加一，首次计数时设置过期”合并，并检查脚本的最大工作量。滑动窗口还要把移除旧成员、加入本次请求、统计数量和决定允许与否放到明确原子边界，成员标识必须能区分同一毫秒的不同请求。

流水线与事务也要区分。Pipeline（批量发送命令）通过减少网络往返提高吞吐，不天然提供一组命令的原子性；批量过大还会占用响应缓冲。超时后重试 INCR 可能重复加一，因为超时只说明客户端没及时收到回复，不说明服务端没执行。重要动作应有业务请求标识和结果查询，不能靠重试次数猜测成功。

### TTL、淘汰、删除是三种不同的离场原因

TTL 是键还能保留多久，解决短期数据自动失效的问题；淘汰是内存压力下按策略让键提前离场；DEL 则是显式删除。你给去重键设置五分钟 TTL，不等于它一定存在五分钟：有淘汰策略、人工删除和实例丢失时，它可能提前消失。设计上首先问“丢失后的后果”，再决定是否允许与普通缓存共用实例。

过期检查不是每个键各配一个计时线程。Redis 在访问时检查过期，也会主动抽样处理过期键；因此逻辑上已失效和物理内存已经回收不是同一个时刻。键过期也不是精确任务调度器，不能把“到点自动执行支付动作”交给过期通知。`TTL` 的 -2 表示键不存在，-1 表示没有过期，非负数是剩余秒数；更细时间粒度可以用 PTTL。机制与返回值分别见 [EXPIRE](https://redis.io/docs/latest/commands/expire/) 和 [TTL](https://redis.io/docs/latest/commands/ttl/)。

普通 SET 覆盖现有键会移除原来的过期时间，除非明确使用保留 TTL 的选项，或在本次写入中重新设置过期。HSET 修改字段通常不等于重建整个键，不能套用同一推断。实践中建议把缓存内容和有效期一起写入，避免某次修复脚本把短期状态变成永久状态；覆盖语义以 [SET 命令参考](https://redis.io/docs/latest/commands/set/)为准。

LRU 优先淘汰较久未访问的键，Redis 使用近似算法；LFU 近似选择使用频率较低的键，二者分别关注访问时间的远近和访问频率，都不是业务重要性评分。volatile 类策略只在带过期时间的键中选候选，候选不足仍会拒绝需要更多内存的写入。noeviction 不主动腾出业务键，适合不允许静默丢失状态的场景，但应用必须正确处理内存不足；它不代表所有命令全部停止，也不防止宿主机内存耗尽。

`maxmemory` 不是进程物理内存的绝对上限。复制与追加日志相关的部分缓冲不计入淘汰判断，还存在分配器、客户端和持久化峰值。对比 `used_memory`、`used_memory_rss`（操作系统看到的常驻内存）以及 `mem_not_counted_for_evict` 才能解释差异。碎片比例高但总字节很小，与几十吉字节实例的同等比例不是同一个风险。策略和计量边界见 [官方淘汰说明](https://redis.io/docs/latest/develop/reference/eviction/)。

### 数据结构必须和访问粒度一起选

一个 Hash 可以把同一服务的多个字段放在一起，更新单字段比反复编码整个 JSON 字符串更直接；但一次 HGETALL 仍会读取整个对象，字段无限增长仍会变成大键。Set 消除相同成员，Sorted Set 为唯一成员另附可排序分数：同一个指纹反复 ZADD 通常会更新这个成员，而不是自动增加事件条数。统计每次告警应使用独立事件标识，统计每类告警则可以以指纹为成员。

Bitmap 的偏移量代表位置，若直接拿稀疏而巨大的外部编号作位偏移，可能一次分配很大空间；需要先设计连续编号映射。HyperLogLog 估计不同成员的数量，不保存可供找回的成员清单，因此不能用于“列出具体哪些主机掉线”。类型选择没有脱离业务的标准答案，要先写出读取粒度、是否精确、保留窗口和增长上限。

SCAN 是遍历工具，不是稳定分页接口。COUNT 是工作量提示，某次返回为空且游标非零仍应继续；遍历中可能重复看到同一个键，数据持续变化时也不能声称得到某一时刻的完整快照。采集器应做幂等汇总，限速并记录范围；处理到游标回到零才完成一轮。不要把扫描结果直接拼成删除命令，详见 [SCAN 的保证与限制](https://redis.io/docs/latest/commands/scan/)。

## 缓存一致性课堂：先画旧值怎样回来

数据库或权威接口是事实来源，缓存是可重建副本。这里的“一致”不是抽象口号，而是你允许读者看到多旧的数据。例如监控趋势卡片允许滞后数十秒，权限撤销和自动化执行资格可能不能接受同样窗口。先把不同业务分开，才能决定哪里允许缓存、哪里需要读权威状态。

设数据库的配置版本为一，缓存刚过期。读请求甲拿到数据库旧版本后暂停；写请求乙把数据库改成版本二并删除缓存；甲恢复后又把版本一写回缓存。每个单独操作都成功，缓存却倒退了。老师请你指出错误：删除缓存只能删除当时的值，不能阻止一个已经在途的旧查询随后回填。

解决方案要对应这种时间线。值里记录业务版本和生成时间可帮助识别陈旧，但仅比较“当前缓存版本”仍不足：如果新版本键已被删除，旧请求又看不到比较对象。可以设计可靠的版本水位、失效事件消费与重试、按实体串行更新等协议，也可以在重要写后读路径暂时绕过缓存。哪一种可用要看权威源能否提供单调版本及事务边界，不能把“加版本字段”本身宣称为强一致修复。

所谓延迟双删，是更新后隔一段时间再删缓存，目的在于清理某些在途旧回填；它依赖请求耗时和重试假设，固定睡眠不能覆盖无限暂停。短 TTL 能收敛陈旧窗口，却会增加回源。故障分析应同时保存数据库提交时间、失效消息时间、回填读取版本、缓存写入时间和业务读到的版本，这些证据比命中率更能说明正确性。

穿透、击穿、雪崩的应对也需要边界。空值缓存应和“Redis 不可用”区别，不能把依赖超时误记为实体不存在；请求合并应有等待上限，重建失败时不能让所有等待者永久阻塞；随机 TTL 适合错开很多键，整体 Redis 不可用时仍需限流与降级。缓存降级成旧值是否允许，必须由业务定义，告警摘要可以提示过时，执行权限不应静默使用过期授权。

AIOps 中缓存大模型结果时，键还应区分租户、输入内容、模型或提示版本、知识库版本和访问范围。否则即使指纹相同，也可能把别的租户信息或旧知识结论返回。日志只记录脱敏的指纹与版本，不记录完整告警正文；命中率优化不能牺牲数据隔离。

## 恢复课堂：磁盘、副本和可用入口分别保护什么

### RDB 与 AOF 的恢复点不同

RDB 是某个时点的数据快照。后台保存通常使用子进程，父进程继续服务；写时复制表示父子进程先共享内存页，当页被修改时才复制，因此快照期间写入越活跃，额外内存压力越需要验证。所谓后台并非零成本，进程创建、磁盘和内存压力仍可能引起延迟。

AOF 记录能重建状态的写操作。写入操作系统缓存与实际同步到持久介质不同，`appendfsync everysec` 表示按秒同步的取舍，不是无条件零丢失合同；always 更重视同步时机，也会增加存储延迟影响。RPO 是允许丢多少最近数据，RTO 是允许多久恢复服务，应从业务倒推配置并以故障演练测量。

重写 AOF 的目的是用较紧凑内容重建当前状态，不是简单删除“旧日志”。Redis 7 起采用由清单管理的基础与增量文件，备份和恢复不能只拿其中一个随手挑选的文件。观察 `INFO persistence` 中后台任务、最近状态和耗时，先在独立恢复环境核对键、过期和业务样本，再认为备份可用。具体文件组织见 [持久化文档](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)。

### 复制追赶为什么突然变成全量同步

主节点持续生成复制流，复制标识区分数据历史，offset 表示已处理到复制流的哪个字节位置。副本短暂断开后可请求补齐缺失部分；如果主节点保留的 backlog（复制历史缓冲区）已覆盖不到那个位置，或历史不匹配，就要重新全量同步。它像补缺页，但类比不意味着按业务行精确补齐，也不能用偏移字节差直接解释丢失了几条告警。

规划缓冲要估计高峰复制字节速率乘以可容忍断连时间，再留余量，不是按请求条数随意设大小。全量同步会增加主节点快照、网络与副本加载压力，重连风暴可能让恢复越做越慢。观察角色、连接状态、复制偏移和同步日志，先判断落后趋势，再决定是否扩容或限写。

异步复制意味着主节点回复后仍存在副本未追上的窗口。WAIT 等待指定数量副本确认当前连接此前的写入，返回的是确认副本数，达到数量也没有把 Redis 变成所有故障下都不丢已确认写入的共识数据库。主节点无持久化而自动以空数据重启，还可能让副本跟着空主重新同步。上述风险见 [官方复制说明](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)。

### Sentinel 与 Cluster 不能互相替代

Sentinel 的 quorum 是判断客观下线需要的哨兵认可数，真正执行切换还需要获得多数哨兵的授权；把前者调成一不等于只剩一个哨兵时仍可安全切换。应用要能发现新主、重连并处理结果未知写入，代理或固定旧地址不能自动理解角色变化。多数副本放在同一故障域仍会一起失效，配置应与网络可达性一起核对。见 [Sentinel 官方说明](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/)。

Cluster 通过一万六千三百八十四个槽分摊数据，客户端根据键计算槽并找到节点。MOVED 通常表示槽归属需要更新，ASK 是迁移中的一次临时转向，还要按协议发送 ASKING；它们是路由指示，不等于数据已经损坏。持续重定向先查客户端能力、节点通告地址和迁移状态，而不是反复重启整个集群。

相关键用相同花括号标签可以落同槽，使有限范围的多键操作成立；若把所有租户都放同一个标签，所有相关负载又集中到一个分片。迁移时大键还会放大延迟。Cluster 通常使用数据库零，不提供通过 SELECT 切到多个逻辑库的同等用法；这些限制与路由语义见 [Cluster 规范](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)。

## 分布式锁课堂：随机凭证不等于隔离令牌

锁值中的随机请求标识用于证明“这一把锁是我的”，释放时必须原子比较锁值再删除。若先 GET 检查后 DEL，检查之后锁可能过期并被别人取得，原持有者仍会误删新锁。把比较与删除放在短小脚本里可解决误删，但不能解决持有者暂停太久仍继续操作的问题。

设甲拿到三十秒租约后暂停一分钟，乙在过期后获取锁并完成更新；甲恢复时仍可能执行旧任务。续租线程也会和进程一起暂停，因此不是绝对保护。Fencing token（隔离令牌）是新持有者比旧持有者更大的资格编号，下游在提交修改时原子检查并拒绝落后编号，而不是客户端自己看一眼就放心。

随机锁值用于区分所有者，没有先后大小；隔离令牌需要可信的单调来源及下游持久记录，不能随手拿一个可能在故障切换后回退的计数器就宣称安全。文件系统、外部设备或接口若不支持这类检查，还需要业务幂等、作业唯一约束或人工审批等边界。高风险 Runbook（自动化操作手册）尤其不能把“Redis 锁成功”当作唯一执行许可。官方 [分布式锁说明](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)也提醒评估隔离令牌、时钟和进程暂停。

## 基础实验：亲手证明过期和类型边界

前提是只连接前面创建的 `aiops-redis`，Docker 可用，不需要 Python。打开 `docker exec -it aiops-redis redis-cli`，下面均在该客户端输入。先执行 `EXISTS lesson:redis:dedup lesson:redis:object`，应返回零；若不为零，先确认是否自己的上轮数据，不要覆盖不明键。

```text
SET lesson:redis:dedup first NX EX 30
SET lesson:redis:dedup second NX EX 30
GET lesson:redis:dedup
TTL lesson:redis:dedup
SET lesson:redis:object plain-text
HGET lesson:redis:object status
TYPE lesson:redis:object
```

预期第一次写入返回 OK，紧接着第二次是空结果，GET 仍是 first；TTL 应在零到三十之间。HGET 返回 WRONGTYPE，而 TYPE 返回 string。现在别删除重建：证据已经说明连接和键都存在，只是调用把字符串当成字段对象。修复是选择 GET 读取这个教学值，或在明确的数据模型迁移后才改用 Hash。

用终端计时等待超过三十秒，再执行 TTL 与 GET，预期分别是不存在哪一种负数和空结果？先写下预测，再核对 -2。若第二次 SET 也成功，先查是否已过期、实例或数据库是否不同；若 TTL 是 -1，查是否被普通 SET 覆盖或执行了 PERSIST。以命令时间和返回值验收，而不是只截最后一行。

清理只执行 `DEL lesson:redis:dedup lesson:redis:object`，返回删除数量可能是一或二，因为第一个键可能已经过期；再执行 EXISTS 应为零。这个实验验证单节点命令语义，不验证复制安全、网络分区或长停顿下的分布式锁。

## 故障实验：消费者拿到事件后没有确认

本实验仍在同一教学 redis-cli，模拟消费者处理过程中退出，故意不做确认；不用停止任何服务。先检查 `EXISTS lesson:redis:stream` 返回零。实验根键包含 lesson 前缀，和上文业务示例分开；整个流会在清理时删除，不得换成真实事件流名称。

```text
XADD lesson:redis:stream * event_id event-001 service order-api
XGROUP CREATE lesson:redis:stream lesson-group 0
XREADGROUP GROUP lesson-group worker-a COUNT 1 STREAMS lesson:redis:stream >
XPENDING lesson:redis:stream lesson-group
XREADGROUP GROUP lesson-group worker-b COUNT 1 STREAMS lesson:redis:stream >
XAUTOCLAIM lesson:redis:stream lesson-group worker-b 0 0-0 COUNT 1
```

这些星号和大于号在交互式 redis-cli 中按原样输入；如果改成宿主机单条命令，要依照前文用引号保护 shell 特殊字符。记录第一条实际返回的消息编号，后续不复制文章里的示例编号。

现在暂停一下：worker-b 使用大于号会不会自动拿到 worker-a 的未确认消息？预期不会。大于号请求尚未交给该消费组的新消息，已交付未确认的内容记录在 PEL（待确认列表）里。XPENDING 应能看到一条待确认；XAUTOCLAIM 才把符合空闲时间条件的消息转给另一个消费者。这里的最小空闲时间故意设为零，只适用于无人并行处理的课堂；生产必须大于合理处理时间，否则会抢走仍在执行的任务，见 [XAUTOCLAIM 文档](https://redis.io/docs/latest/commands/xautoclaim/)。

假定 worker-b 的业务处理成功，把实际消息编号替换下面的占位词再确认：`XACK lesson:redis:stream lesson-group 实际消息编号`。它应返回一，随后 XPENDING 的待确认数量为零。但执行 XLEN 仍为一，因为确认移除的是消费组待确认记录，不自动删除流中事件。若需要保留与裁剪，要单独制定策略；近似 MAXLEN 不是精确上限，过早裁剪还可能让未完成消费者失去消息正文。

故障推理应记录为：影响是事件未完成；证据是一条待确认而新消息读取为空；假设是 worker-a 退出或未确认；补偿是确认所有权和业务结果后转移并重试。若 worker-a 实际已经写工单，只是确认前退出，补偿可能再次写工单，所以工单侧必须按 event_id 做幂等，不应宣称 Streams 自动实现端到端恰好一次。

确认实验记录保存后，执行 `DEL lesson:redis:stream` 并用 EXISTS 验证为零，消费组也随该流移除。全部实验结束且确认该容器仅属于本课后，可执行 `docker stop aiops-redis`、`docker rm -v aiops-redis`，这会删除容器与匿名教学数据卷。若保留容器继续学习，就不要执行容器清理。本次修订未运行上述真实 Redis 实验，预期需由读者在其环境验收。

## 生产设计题：告警去重和摘要缓存能共用一套策略吗

题目给定：每秒一万条告警，去重窗口五分钟，摘要缓存允许重建；工单不能漏，峰值可能翻倍。先别直接报机器规格。去重键数由窗口内不同指纹数量决定，不是总请求数；用“每秒新增不同指纹数乘保留秒数”估计驻留规模，再抽样测键名、值、对象和分配器开销。模型摘要长度变化大，还需看分位数而非只取平均。

老师要求你给三个有条件的取舍。第一，摘要缓存可用 LRU 或 LFU，去重与任务状态若被淘汰会改变业务语义，宜隔离实例或把最终可靠状态放在权威存储。第二，单机容量与吞吐够用时，哨兵方案降低分片复杂度；超过单机边界才评估 Cluster，并验算同槽热点。第三，多副本降低部分故障影响，但不能替代工单事务唯一性与历史备份。

容量预算还应包含连接缓冲、复制历史、快照期间写时复制、实例重启后的缓存预热和下游剩余能力。一次百万键预热如果把数据库打满，Redis 本身恢复得再快也不算业务恢复。缓存冷启动时先限回源并发、合并热点请求、按价值分批预热，在错误率和下游队列恢复后才逐步放量。

安全设计中，摘要读取账号只读必要键空间，事件消费者只允许相应流命令，运维账号再拥有配置权限；测试既要证明允许的操作成功，也要证明其他租户键和危险命令被拒绝。ACL 规则、凭据轮换、传输加密和备份读取权限分别检查，不能用“在内网”代替所有边界。

升级前记录服务端、客户端、模块、持久化格式和部署参数，先在隔离环境恢复备份，再用代表性流量验证命令兼容性、内存与延迟。滚动变更每次只动计划中的角色，等待复制追上且业务正常再继续。回滚不只是把镜像标签改回去：新版本写出的持久化文件或新命令产生的数据未必被旧版本接受，必须明确可恢复备份、切换方案、写入处置和停止条件。

## 事故推理题：命中率没变，重复工单却增加

给你一条合成时间线：十点整大摘要涌入，十点零一分 evicted_keys 增长，十点零二分重复工单增加，但缓存总命中率仍很高。先提出两个可区分假设：一是去重键被同实例淘汰，二是不同接收器计算了不同指纹。前者应有淘汰量、内存压力及同一规范指纹再次 SET 成功的关联；后者应有字段规范化或版本差异，不能只凭时间接近就确认根因。

先控制影响：暂停高体积非关键缓存回填，限制通知速率，并利用工单侧唯一约束挡住重复；不要直接切 noeviction 而不评估写入失败，否则可能把重复通知变成漏处理。随后按脱敏样本比对键、TTL、实例、数据库和客户端版本。修复后以重复比例、成功处理比例和积压收敛验证，不能仅以 Redis 内存下降结案。

回滚要明确撤销哪些流量控制、何时恢复摘要缓存，以及如何补处理被限制的事件。复盘保留“支持证据”和“尚未排除”两栏，AIOps 根因模型可以帮助排列假设，却不能自动删除业务状态或无审批调整生产淘汰策略。

## 递进面试参考答案

**30 秒用途回答**：Redis 用键组织多种内存数据结构，通过原子命令与过期时间处理缓存、计数、去重和短期事件。快不等于所有操作都快，也不等于成功回复后任何故障都不会丢失；我会同时设计数据边界、容量、持久化、复制与业务幂等。

**3 分钟机制回答**：以告警进入接收器为起点，解释规范化指纹、SET NX EX 的并发边界，再说明登记和外部工单不是同一事务；沿请求路径区分连接池、网络、命令执行与返回，沿保护路径区分 RDB、AOF、异步复制、哨兵切换和集群分片。最后用消费者未确认实验说明为什么消息可能重试，工单侧为什么要防重。讲述时引用实际做过的实验，不编造生产经历。

**追问一：为什么不用 GET 后 SET？** 参考答案是并发客户端可能同时看见不存在，原子条件写消除了该空档。继续追问“加锁后是否绝不重复”，应说明锁租约、暂停、结果未知、淘汰与故障切换，再给出下游幂等和隔离令牌的适用条件。

**追问二：为什么 Redis 延迟高而慢日志为空？** 先答慢日志的采样对象不是端到端请求，再说明连接池排队、网络、大响应、后台任务与系统暂停。若面试官给出 blocked_clients 高，要区分等待列表的消费者与占住执行路径的慢命令，提出能验证两种解释的指标。

**追问三：主节点写成功、副本读不到怎么办？** 首先确认读写入口与同一历史的复制进度；异步复制允许短暂落后。写后读可选择主节点或按业务采用更严格协议，WAIT 有减少丢失风险的作用但不能承诺强一致。继续问跨租户缓存或自动化权限时，要回到权威源和安全边界，不盲目加副本。

**追问四：Stream 已经确认，为什么长度不减少？** 确认影响消费组待确认列表，不等于删除原消息；保留和裁剪是另一项决策。继续问消费者崩溃，则画出处理成功但确认丢失的窗口，说明重试和工单唯一标识。这比背出消息命令列表更能证明理解。

## 本文边界与独立练习

本课覆盖 Redis 基础数据结构到常见生产取舍，不展开模块实现、集群协议证明和复杂跨系统事务。下一步可以把 [MySQL](./mysql-sql.md) 的业务唯一约束、[Kafka](./kafka.md) 的事件重放和 [RCA](../sre-aiops/rca.md) 的证据方法接入同一个告警小项目。学习文章不代表已经具备全部岗位能力，还需要独立编码、Linux 与网络基础、系统设计和表达训练。

做一次独立检查：不看示例说出 TTL 两种负数的区别；换一个教学键复现错误类型；独立完成未确认事件的接管；画出旧缓存回填与旧锁持有者恢复的时间线。做不出来时回到对应机制，而不是把构建通过或字数足够当作已经掌握。

## 本课 GitHub 学习证据

学完这篇，建议留下这些证据：

1. 一个 Redis Docker 启动说明。
2. 一个 `dedup.py`，用 `SET NX EX` 实现告警去重。
3. 一个 Stream demo，包含 `XADD`、`XGROUP`、`XREADGROUP`、`XACK`。
4. 一张 `INFO memory` 输出记录。
5. 一张 `SLOWLOG GET` 输出记录。
6. 一篇 README，解释 Redis、MySQL、Kafka 在 AIOps 链路中的分工。
