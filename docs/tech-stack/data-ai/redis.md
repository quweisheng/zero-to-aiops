# Redis

## 官方资料

- [Redis Quick starts](https://redis.io/docs/latest/develop/get-started/)
- [Redis data types](https://redis.io/docs/latest/develop/data-types/)
- [Redis CLI](https://redis.io/docs/latest/develop/tools/cli/)
- [Redis commands](https://redis.io/docs/latest/commands/)

> 学习说明：本篇基于 Redis 官方 quick start、数据类型和 redis-cli 文档整理，重点放在 AIOps 工程师需要掌握的缓存、限流、队列、事件流和临时状态管理。

## 是什么

Redis 是内存数据结构服务器。它常被用作缓存、消息中间件、排行榜、分布式锁、延迟队列、实时计数器，也能处理 Stream、Time Series、Vector Sets 等更高级的数据结构。

运维转 AIOps 时，Redis 的典型作用是：

- 保存短期告警去重状态。
- 做告警风暴限流。
- 做临时任务队列。
- 保存最近 N 分钟的服务状态。
- 缓存大模型分析结果，减少重复调用。
- 用 Stream 串起“采集 -> 分析 -> 处理”流程。

## 核心原理

Redis 的核心特点：

| 特点 | 说明 | 运维理解 |
|---|---|---|
| 内存优先 | 数据主要存放在内存 | 速度快，但要关注内存容量 |
| key-value | 每个数据都有 key | key 设计决定可维护性 |
| 多数据结构 | String、Hash、List、Set、Sorted Set、Stream 等 | 不同场景选不同结构 |
| 单线程事件循环为主 | 命令执行简单可预测 | 慢命令会影响整体延迟 |
| 可持久化 | RDB / AOF | 可在重启后恢复数据 |
| 支持复制和高可用 | Replica、Sentinel、Cluster | 生产环境不是单机裸跑 |

Redis 不是“简单缓存”这么窄，它更像一个高性能内存数据结构工具箱。

## 架构

单机 Redis：

```text
client
  -> TCP 6379
  -> redis-server
      -> event loop
      -> command execution
      -> in-memory data structures
      -> persistence: RDB / AOF
```

生产 Redis：

```text
app clients
  -> Redis primary
      -> replicas
      -> persistence
      -> monitoring
      -> Sentinel or Cluster
```

AIOps 实验中先学单机，理解数据结构和命令；之后再学高可用、集群和内存治理。

## 安装和启动

### Docker 启动

```bash
docker run -d --name aiops-redis \
  -p 6379:6379 \
  redis:latest
```

连接：

```bash
docker exec -it aiops-redis redis-cli
```

测试：

```bash
PING
```

预期返回：

```text
PONG
```

### 使用 redis-cli 执行单条命令

```bash
redis-cli INCR mycounter
redis-cli GET mycounter
```

如果用 Docker：

```bash
docker exec aiops-redis redis-cli INCR mycounter
```

## 数据类型

Redis 官方文档强调 Redis 是 data structure server。学习时不要只记 `SET` / `GET`，要知道每种结构解决什么问题。

| 类型 | 常用命令 | AIOps 场景 |
|---|---|---|
| String | `SET`、`GET`、`INCR`、`EXPIRE` | 计数器、开关、缓存 |
| Hash | `HSET`、`HGETALL` | 告警对象、服务状态 |
| List | `LPUSH`、`BRPOP` | 简单队列 |
| Set | `SADD`、`SISMEMBER` | 去重、成员判断 |
| Sorted Set | `ZADD`、`ZRANGE` | 排行榜、按分数排序 |
| Stream | `XADD`、`XREADGROUP` | 事件流、消费组 |
| HyperLogLog | `PFADD`、`PFCOUNT` | 近似去重计数 |
| Time Series | Redis Stack 命令 | 时间序列数据 |
| Vector Sets | Redis 新向量能力 | 语义检索、相似告警 |

## 基础命令

### String：告警次数计数

```bash
redis-cli INCR alerts:order-api:critical:20260701
redis-cli EXPIRE alerts:order-api:critical:20260701 86400
redis-cli GET alerts:order-api:critical:20260701
```

含义：

- `INCR` 原子加一。
- `EXPIRE` 设置过期时间。
- key 中包含业务含义，方便排查。

### Hash：保存当前服务状态

```bash
redis-cli HSET service:order-api status degraded error_rate 0.23 updated_at 2026-07-01T10:00:00
redis-cli HGETALL service:order-api
```

适合保存一个对象的多个字段。

### Set：告警去重

```bash
redis-cli SADD alert:fingerprints fp-order-api-5xx
redis-cli SISMEMBER alert:fingerprints fp-order-api-5xx
redis-cli EXPIRE alert:fingerprints 600
```

10 分钟内相同 fingerprint 只处理一次，这是告警降噪的基本思路。

### List：简单任务队列

生产者：

```bash
redis-cli LPUSH aiops:jobs '{"type":"analyze_alert","alert_id":1001}'
```

消费者：

```bash
redis-cli BRPOP aiops:jobs 0
```

List 适合简单队列，但复杂消费确认和消费组建议用 Stream。

### Stream：事件流

写入事件：

```bash
redis-cli XADD aiops:alert-stream '*' service order-api severity critical alert HighErrorRate
```

读取事件：

```bash
redis-cli XREAD COUNT 10 STREAMS aiops:alert-stream 0
```

创建消费组：

```bash
redis-cli XGROUP CREATE aiops:alert-stream aiops-workers 0 MKSTREAM
```

消费组读取：

```bash
redis-cli XREADGROUP GROUP aiops-workers worker-1 COUNT 10 STREAMS aiops:alert-stream '>'
```

确认处理完成：

```bash
redis-cli XACK aiops:alert-stream aiops-workers 1700000000000-0
```

Stream 很适合 AIOps 的“事件处理流水线”。

## key 设计

好的 key 能降低排障成本。

推荐格式：

```text
domain:entity:scope:field
```

例子：

```text
alert:dedup:order-api:high-5xx
alert:count:payment-api:critical:20260701
service:state:gateway
job:queue:runbook
llm:cache:alert-summary:sha256hash
```

原则：

- 用冒号分层。
- 不要把 key 写得完全随机。
- 包含业务范围和时间范围。
- 有生命周期的数据必须设置过期时间。
- 不要在生产使用 `KEYS *` 扫全库，改用 `SCAN`。

## 配置重点

常见配置项：

| 配置 | 作用 | 学习建议 |
|---|---|---|
| `port` | 默认端口 6379 | 本机冲突时修改 |
| `bind` | 监听地址 | 生产不要随便暴露公网 |
| `requirepass` / ACL | 认证 | 生产必须启用 |
| `maxmemory` | 最大内存 | 防止 Redis 占满机器 |
| `maxmemory-policy` | 内存淘汰策略 | 缓存场景常用 LRU / LFU |
| `appendonly` | AOF 持久化 | 重要数据建议开启 |
| `save` | RDB 快照 | 根据恢复要求配置 |

查看配置：

```bash
redis-cli CONFIG GET maxmemory
redis-cli CONFIG GET appendonly
```

临时修改配置：

```bash
redis-cli CONFIG SET maxmemory 256mb
```

生产配置要写入配置文件或部署系统，不要只靠临时命令。

## 监控重点

Redis 是高性能组件，但最怕“慢命令、内存打满、连接数暴涨、阻塞操作”。

常用命令：

```bash
redis-cli INFO server
redis-cli INFO memory
redis-cli INFO clients
redis-cli INFO stats
redis-cli SLOWLOG GET 10
redis-cli CLIENT LIST
```

重点指标：

| 指标 | 说明 | 风险 |
|---|---|---|
| `used_memory` | 已用内存 | 接近上限会淘汰或失败 |
| `connected_clients` | 当前连接数 | 连接泄漏 |
| `instantaneous_ops_per_sec` | 每秒操作数 | 突增可能是流量或异常 |
| `keyspace_hits/misses` | 缓存命中和未命中 | 缓存设计是否有效 |
| `rejected_connections` | 被拒连接 | maxclients 不够 |
| slowlog | 慢命令 | 阻塞 Redis |

## AIOps 中的作用

一个典型告警处理链路：

```text
Alertmanager webhook
  -> FastAPI receiver
  -> Redis Set 做去重
  -> Redis Stream 写入待分析事件
  -> Python worker 消费
  -> LLM / 规则分析
  -> MySQL 保存结果
```

Redis 负责的是“快、短期、状态型”的部分。MySQL 负责长期事实，Prometheus 负责指标，Loki / Elasticsearch 负责日志。

## 入门练习：告警去重器

目标：用 Redis 做一个 10 分钟去重窗口。

目录建议：

```text
projects/redis-alert-dedup/
  README.md
  dedup.py
  examples.md
```

`dedup.py`：

```python
import hashlib
import json
import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)


def fingerprint(alert: dict) -> str:
    raw = f"{alert['service']}|{alert['name']}|{alert['instance']}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def should_process(alert: dict, ttl_seconds: int = 600) -> bool:
    fp = fingerprint(alert)
    key = f"alert:dedup:{fp}"
    created = r.set(key, json.dumps(alert, ensure_ascii=False), nx=True, ex=ttl_seconds)
    return created is True


sample = {
    "service": "order-api",
    "name": "HighErrorRate",
    "instance": "10.0.1.11",
    "severity": "critical",
}

print("process" if should_process(sample) else "duplicate")
```

安装依赖：

```bash
pip install redis
python dedup.py
python dedup.py
```

第一次应该输出 `process`，第二次输出 `duplicate`。

## 常见故障

### 连接不上

```text
Could not connect to Redis at 127.0.0.1:6379
```

排查：

```bash
docker ps
docker logs aiops-redis
redis-cli -h 127.0.0.1 -p 6379 PING
```

### NOAUTH

说明 Redis 开启了认证：

```bash
redis-cli -a your_password PING
```

代码中要配置密码。

### 内存打满

查看：

```bash
redis-cli INFO memory
```

处理方向：

- 给临时 key 设置 TTL。
- 设置 `maxmemory`。
- 选择合适的 `maxmemory-policy`。
- 清理异常增长 key。

### 慢命令

```bash
redis-cli SLOWLOG GET 10
```

避免：

- 大 key。
- 生产环境 `KEYS *`。
- 一次返回巨大集合。
- Lua 脚本执行太久。

## 学习证据

学完后，在 GitHub 留下：

- 一个 Redis 启动说明。
- 一个告警去重 Python 脚本。
- 一段 Stream 事件写入和消费示例。
- 一张 `INFO memory` 或 `SLOWLOG GET` 截图。
- README 解释 Redis 在 AIOps 链路中的位置。

