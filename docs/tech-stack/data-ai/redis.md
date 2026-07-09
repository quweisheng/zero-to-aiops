# Redis

> 目标：不是只会 `SET` / `GET`，而是能理解 Redis 为什么是“内存数据结构服务器”，掌握 key、TTL、String、Hash、List、Set、Sorted Set、Stream、持久化、内存淘汰、复制、Sentinel、Cluster、安全、慢命令和 AIOps 告警去重/事件流场景。

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HighErrorRate</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>service=order-api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>instance=10.0.1.11</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>severity=critical</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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
Redis
  -> Get started
     -> install
     -> redis-server
     -> redis-cli
     -> clients
  -> Data types
     -> strings
     -> hashes
     -> lists
     -> sets
     -> sorted sets
     -> streams
     -> bitmaps / bitfields
     -> geospatial
     -> HyperLogLog / probabilistic
     -> JSON / time series / vector sets
  -> Commands
     -> key commands
     -> string commands
     -> hash commands
     -> list commands
     -> set commands
     -> sorted set commands
     -> stream commands
     -> server commands
  -> Operate
     -> persistence
     -> replication
     -> Sentinel
     -> Cluster
     -> security / ACL
     -> memory optimization
     -> latency troubleshooting
     -> monitoring with INFO / SLOWLOG
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Redis</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; Get started</code> | 这一行要理解这些英文词：`Get started` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>     -&gt; install</code> | 这一行要理解这些英文词：`install` 是安装，把工具或依赖放到环境里。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; redis-server</code> | 这一行要理解这些英文词：`redis-server` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; redis-cli</code> | 这一行要理解这些英文词：`redis-cli` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; clients</code> | 这一行要理解这些英文词：`clients` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; Data types</code> | 这一行要理解这些英文词：`Data types` 是数据类型，规定字段能存什么样的值，例如数字、文本、时间。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>     -&gt; strings</code> | 这一行要理解这些英文词：`strings` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; hashes</code> | 这一行要理解这些英文词：`hashes` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; lists</code> | 这一行要理解这些英文词：`lists` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; sets</code> | 这一行要理解这些英文词：`sets` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>     -&gt; sorted sets</code> | 这一行要理解这些英文词：`sorted sets` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>     -&gt; streams</code> | 这一行要理解这些英文词：`streams` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>     -&gt; bitmaps / bitfields</code> | 这一行要理解这些英文词：`bitmaps` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`bitfields` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>     -&gt; geospatial</code> | 这一行要理解这些英文词：`geospatial` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>     -&gt; HyperLogLog / probabilistic</code> | 这一行要理解这些英文词：`HyperLogLog` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`probabilistic` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>     -&gt; JSON / time series / vector sets</code> | 这一行要理解这些英文词：`JSON` 是结构化数据格式；`time series` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`vector sets` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>  -&gt; Commands</code> | 这一行要理解这些英文词：`Commands` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>     -&gt; key commands</code> | 这一行要理解这些英文词：`key commands` 是key=键。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>     -&gt; string commands</code> | 这一行要理解这些英文词：`string commands` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>     -&gt; hash commands</code> | 这一行要理解这些英文词：`hash commands` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>     -&gt; list commands</code> | 这一行要理解这些英文词：`list commands` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>     -&gt; set commands</code> | 这一行要理解这些英文词：`set commands` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>     -&gt; sorted set commands</code> | 这一行要理解这些英文词：`sorted set commands` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>     -&gt; stream commands</code> | 这一行要理解这些英文词：`stream commands` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>     -&gt; server commands</code> | 这一行要理解这些英文词：`server commands` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>  -&gt; Operate</code> | 这一行要理解这些英文词：`Operate` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>     -&gt; persistence</code> | 这一行要理解这些英文词：`persistence` 是持久化，把数据保存到磁盘或可靠存储中。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>     -&gt; replication</code> | 这一行要理解这些英文词：`replication` 是复制，把数据同步到副本以提高可靠性或读性能。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>     -&gt; Sentinel</code> | 这一行要理解这些英文词：`Sentinel` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>     -&gt; Cluster</code> | 这一行要理解这些英文词：`Cluster` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>     -&gt; security / ACL</code> | 这一行要理解这些英文词：`security` 是安全，涉及认证、授权、加密和访问控制；`ACL` 是访问控制列表，用来定义谁可以访问哪些资源。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>     -&gt; memory optimization</code> | 这一行要理解这些英文词：`memory optimization` 是optimization=优化。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>     -&gt; latency troubleshooting</code> | 这一行要理解这些英文词：`latency troubleshooting` 是latency=延迟。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>     -&gt; monitoring with INFO / SLOWLOG</code> | 这一行要理解这些英文词：`monitoring with INFO` 是monitoring=监控，info=信息类通知；`SLOWLOG` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


初学路线：

```text
redis-cli
  -> key / TTL
  -> String / Hash / Set / List / Sorted Set / Stream
  -> key naming
  -> memory and eviction
  -> persistence: RDB / AOF
  -> replication
  -> Sentinel / Cluster concept
  -> security / ACL
  -> INFO / SLOWLOG / latency
  -> AIOps alert dedup and event stream
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; key / TTL</code> | 这一行要理解这些英文词：`key` 是键；`TTL` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; String / Hash / Set / List / Sorted Set / Stream</code> | 这一行要理解这些英文词：`String` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Hash` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Set` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`List` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Sorted Set` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Stream` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; key naming</code> | 这一行要理解这些英文词：`key naming` 是key=键。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; memory and eviction</code> | 这一行要理解这些英文词：`memory and eviction` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; persistence: RDB / AOF</code> | 这一行要理解这些英文词：`persistence` 是持久化，把数据保存到磁盘或可靠存储中；`RDB` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态；`AOF` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; replication</code> | 这一行要理解这些英文词：`replication` 是复制，把数据同步到副本以提高可靠性或读性能。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Sentinel / Cluster concept</code> | 这一行要理解这些英文词：`Sentinel` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`Cluster concept` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; security / ACL</code> | 这一行要理解这些英文词：`security` 是安全，涉及认证、授权、加密和访问控制；`ACL` 是访问控制列表，用来定义谁可以访问哪些资源。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; INFO / SLOWLOG / latency</code> | 这一行要理解这些英文词：`INFO` 是信息类通知；`SLOWLOG` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态；`latency` 是延迟。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; AIOps alert dedup and event stream</code> | 这一行要理解这些英文词：`AIOps alert dedup and event stream` 是aiops=智能运维，alert=告警，dedup=去重。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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
Alertmanager webhook
  -> FastAPI receiver
  -> Redis Set/String 做去重和限流
  -> Redis Stream 写入待处理事件
  -> worker 消费事件
  -> LLM / 规则分析
  -> MySQL 保存长期结果
  -> Grafana / FastAPI 展示
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager webhook</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; FastAPI receiver</code> | 这一行要理解这些英文词：`FastAPI receiver` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; Redis Set/String 做去重和限流</code> | 这一行要理解这些英文词：`Redis Set` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`String` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; Redis Stream 写入待处理事件</code> | 这一行要理解这些英文词：`Redis Stream` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; worker 消费事件</code> | 这一行要理解这些英文词：`worker` 是后台处理进程。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; LLM / 规则分析</code> | 这一行要理解这些英文词：`LLM` 是大语言模型。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; MySQL 保存长期结果</code> | 这一行要理解这些英文词：`MySQL` 是MySQL 数据库或客户端命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Grafana / FastAPI 展示</code> | 这一行要理解这些英文词：`Grafana` 是仪表盘和可视化平台，用来展示指标、日志和告警数据；`FastAPI` 是Python Web API 框架，常用来写模型服务或运维接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


Redis 负责：

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Redis is an in-memory data structure server.</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


重点有三个：

1. **in-memory**：主要在内存里读写，所以快，但要关注内存容量。
2. **data structure**：不是只有字符串，还有 hash、list、set、sorted set、stream 等结构。
3. **server**：它是一个网络服务，客户端通过协议发命令。

Redis 不是“小号 MySQL”。MySQL 的核心是关系模型、事务和长期结构化查询；Redis 的核心是内存数据结构和原子命令。

## 核心执行模型

简化架构：

```text
client
  -> TCP 6379
  -> redis-server
      -> command parser
      -> event loop
      -> in-memory keyspace
      -> data structures
      -> persistence: RDB / AOF
      -> replication
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; TCP 6379</code> | 这一行要理解这些英文词：`TCP` 是传输控制协议，提供可靠的网络连接。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; redis-server</code> | 这一行要理解这些英文词：`redis-server` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>      -&gt; command parser</code> | 这一行要理解这些英文词：`command parser` 是command=命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>      -&gt; event loop</code> | 这一行要理解这些英文词：`event loop` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>      -&gt; in-memory keyspace</code> | 这一行要理解这些英文词：`in-memory keyspace` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>      -&gt; data structures</code> | 这一行要理解这些英文词：`data structures` 是data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>      -&gt; persistence: RDB / AOF</code> | 这一行要理解这些英文词：`persistence` 是持久化，把数据保存到磁盘或可靠存储中；`RDB` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态；`AOF` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>      -&gt; replication</code> | 这一行要理解这些英文词：`replication` 是复制，把数据同步到副本以提高可靠性或读性能。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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

```bash
docker run -d --name aiops-redis \
  -p 6379:6379 \
  redis:latest
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name aiops-redis \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -p 6379:6379 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  redis:latest</code> | 执行 `redis:latest` 相关命令，后面的参数决定它具体操作什么对象。 |


连接：

```bash
docker exec -it aiops-redis redis-cli
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker exec -it aiops-redis redis-cli</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |


测试：

```bash
PING
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>PING</code> | 发送 ICMP 探测包，用来粗略判断网络连通性。 |


预期：

```text
PONG
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>PONG</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### redis-cli 执行单条命令

```bash
redis-cli -h 127.0.0.1 -p 6379 PING
redis-cli SET hello world
redis-cli GET hello
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli -h 127.0.0.1 -p 6379 PING</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |
| 第 2 行 | <code>redis-cli SET hello world</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |
| 第 3 行 | <code>redis-cli GET hello</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


Docker：

```bash
docker exec aiops-redis redis-cli SET hello world
docker exec aiops-redis redis-cli GET hello
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker exec aiops-redis redis-cli SET hello world</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |
| 第 2 行 | <code>docker exec aiops-redis redis-cli GET hello</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |


### 连接参数

| 参数 | 意思 |
|---|---|
| `-h` | Redis 主机 |
| `-p` | Redis 端口，默认 6379 |
| `-a` | 密码 |
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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>domain:entity:scope:field</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


AIOps 示例：

```text
alert:dedup:order-api:high-error-rate:10.0.1.11
alert:count:order-api:critical:20260702
service:state:order-api
job:queue:runbook
llm:cache:alert-summary:sha256
stream:alerts
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alert:dedup:order-api:high-error-rate:10.0.1.11</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>alert:count:order-api:critical:20260702</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>service:state:order-api</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>job:queue:runbook</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>llm:cache:alert-summary:sha256</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>stream:alerts</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SET alert:dedup:fp123 seen EX 300</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 2 行 | <code>TTL alert:dedup:fp123</code> | 执行 `ttl` 相关命令，后面的参数决定它具体操作什么对象。 |


给已有 key 设置过期：

```bash
EXPIRE alert:dedup:fp123 300
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>EXPIRE alert:dedup:fp123 300</code> | 执行 `expire` 相关命令，后面的参数决定它具体操作什么对象。 |


取消过期：

```bash
PERSIST alert:dedup:fp123
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>PERSIST alert:dedup:fp123</code> | 执行 `persist` 相关命令，后面的参数决定它具体操作什么对象。 |


查看 key 是否存在：

```bash
EXISTS alert:dedup:fp123
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>EXISTS alert:dedup:fp123</code> | 执行 `exists` 相关命令，后面的参数决定它具体操作什么对象。 |


删除：

```bash
DEL alert:dedup:fp123
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>DEL alert:dedup:fp123</code> | 执行 `del` 相关命令，后面的参数决定它具体操作什么对象。 |


TTL 在 AIOps 里的核心作用：

```text
同一告警 fingerprint 在 5 分钟内只处理一次
5 分钟后 key 自动消失
下次告警可以重新处理
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>同一告警 fingerprint 在 5 分钟内只处理一次</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>5 分钟后 key 自动消失</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>下次告警可以重新处理</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


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

初学先掌握 String、Hash、List、Set、Sorted Set、Stream。

## String

String 是最基础的数据类型。它可以保存文本、数字、JSON 字符串、二进制内容。

### 缓存一个告警摘要

```bash
SET llm:cache:alert-summary:fp123 "order-api 5xx increased after deployment" EX 1800
GET llm:cache:alert-summary:fp123
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SET llm:cache:alert-summary:fp123 "order-api 5xx increased after deployment" EX 1800</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 2 行 | <code>GET llm:cache:alert-summary:fp123</code> | 执行 `get` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>INCR alert:count:order-api:critical:20260702</code> | 执行 `incr` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>EXPIRE alert:count:order-api:critical:20260702 86400</code> | 执行 `expire` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>GET alert:count:order-api:critical:20260702</code> | 执行 `get` 相关命令，后面的参数决定它具体操作什么对象。 |


`INCR` 是原子操作。多个客户端同时加一，也不会丢计数。

### SET NX EX

告警去重最常用：

```bash
SET alert:dedup:fp123 seen NX EX 300
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SET alert:dedup:fp123 seen NX EX 300</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |


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
HSET service:state:order-api \
  status degraded \
  error_rate 0.23 \
  p95_latency_ms 1200 \
  updated_at 2026-07-02T10:20:00Z

HGETALL service:state:order-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HSET service:state:order-api \</code> | 执行 `hset` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>  status degraded \</code> | 执行 `status` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  error_rate 0.23 \</code> | 执行 `error_rate` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  p95_latency_ms 1200 \</code> | 执行 `p95_latency_ms` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>  updated_at 2026-07-02T10:20:00Z</code> | 执行 `updated_at` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <em>空行</em> | 空行，用来把命令分成更容易阅读的几段。 |
| 第 7 行 | <code>HGETALL service:state:order-api</code> | 执行 `hgetall` 相关命令，后面的参数决定它具体操作什么对象。 |


适合：

- 当前服务状态。
- 告警上下文。
- 任务元数据。

### 读取字段

```bash
HGET service:state:order-api status
HMGET service:state:order-api status error_rate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HGET service:state:order-api status</code> | 执行 `hget` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>HMGET service:state:order-api status error_rate</code> | 执行 `hmget` 相关命令，后面的参数决定它具体操作什么对象。 |


### 增加字段数值

```bash
HINCRBY service:state:order-api restart_count 1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HINCRBY service:state:order-api restart_count 1</code> | 执行 `hincrby` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>LPUSH job:queue:alert-analysis '{"alert_id":1001,"service":"order-api"}'</code> | 执行 `lpush` 相关命令，后面的参数决定它具体操作什么对象。 |


消费者：

```bash
BRPOP job:queue:alert-analysis 0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>BRPOP job:queue:alert-analysis 0</code> | 执行 `brpop` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>LPUSH recent:alerts '{"service":"order-api","alert":"HighErrorRate"}'</code> | 执行 `lpush` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>LTRIM recent:alerts 0 99</code> | 执行 `ltrim` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>LRANGE recent:alerts 0 9</code> | 执行 `lrange` 相关命令，后面的参数决定它具体操作什么对象。 |


`LTRIM` 保留前 100 条，避免 list 无限增长。

## Set

Set 是不重复集合。

### 告警去重集合

```bash
SADD alert:fingerprints fp-order-api-5xx
SISMEMBER alert:fingerprints fp-order-api-5xx
EXPIRE alert:fingerprints 600
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SADD alert:fingerprints fp-order-api-5xx</code> | 执行 `sadd` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>SISMEMBER alert:fingerprints fp-order-api-5xx</code> | 执行 `sismember` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>EXPIRE alert:fingerprints 600</code> | 执行 `expire` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SADD alerts:team:sre order-api payment-api gateway</code> | 执行 `sadd` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>SADD alerts:team:backend order-api checkout-api</code> | 执行 `sadd` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>SINTER alerts:team:sre alerts:team:backend</code> | 执行 `sinter` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>SUNION alerts:team:sre alerts:team:backend</code> | 执行 `sunion` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ZINCRBY alert:rank:services 1 order-api</code> | 执行 `zincrby` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>ZINCRBY alert:rank:services 1 payment-api</code> | 执行 `zincrby` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>ZREVRANGE alert:rank:services 0 9 WITHSCORES</code> | 执行 `zrevrange` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ZADD alert:events:order-api 1782960000 fp1</code> | 执行 `zadd` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>ZADD alert:events:order-api 1782960060 fp2</code> | 执行 `zadd` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>ZRANGEBYSCORE alert:events:order-api 1782960000 1782960300</code> | 执行 `zrangebyscore` 相关命令，后面的参数决定它具体操作什么对象。 |


清理窗口外数据：

```bash
ZREMRANGEBYSCORE alert:events:order-api -inf 1782959700
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ZREMRANGEBYSCORE alert:events:order-api -inf 1782959700</code> | 执行 `zremrangebyscore` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>XADD stream:alerts '*' service order-api severity critical alert HighErrorRate</code> | 执行 `xadd` 相关命令，后面的参数决定它具体操作什么对象。 |


返回类似：

```text
1782960000000-0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>1782960000000-0</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这是 stream entry id，通常由毫秒时间戳和序号组成。

### 读取事件

```bash
XREAD COUNT 10 STREAMS stream:alerts 0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>XREAD COUNT 10 STREAMS stream:alerts 0</code> | 执行 `xread` 相关命令，后面的参数决定它具体操作什么对象。 |


从头读。

只读新消息：

```bash
XREAD BLOCK 5000 STREAMS stream:alerts '$'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>XREAD BLOCK 5000 STREAMS stream:alerts '$'</code> | 执行 `xread` 相关命令，后面的参数决定它具体操作什么对象。 |


### 消费组

创建消费组：

```bash
XGROUP CREATE stream:alerts aiops-workers 0 MKSTREAM
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>XGROUP CREATE stream:alerts aiops-workers 0 MKSTREAM</code> | 执行 `xgroup` 相关命令，后面的参数决定它具体操作什么对象。 |


消费：

```bash
XREADGROUP GROUP aiops-workers worker-1 COUNT 10 STREAMS stream:alerts '>'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>XREADGROUP GROUP aiops-workers worker-1 COUNT 10 STREAMS stream:alerts '&gt;'</code> | 执行 `xreadgroup` 相关命令，后面的参数决定它具体操作什么对象。 |


确认：

```bash
XACK stream:alerts aiops-workers 1782960000000-0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>XACK stream:alerts aiops-workers 1782960000000-0</code> | 执行 `xack` 相关命令，后面的参数决定它具体操作什么对象。 |


查看 pending：

```bash
XPENDING stream:alerts aiops-workers
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>XPENDING stream:alerts aiops-workers</code> | 执行 `xpending` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>XADD stream:alerts MAXLEN ~ 10000 '*' service order-api severity critical</code> | 执行 `xadd` 相关命令，后面的参数决定它具体操作什么对象。 |


`MAXLEN` 防止 stream 无限增长。

## Bitmap 和 HyperLogLog

### Bitmap

Bitmap 用 bit 表示状态。

```bash
SETBIT service:active:20260702 1001 1
GETBIT service:active:20260702 1001
BITCOUNT service:active:20260702
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SETBIT service:active:20260702 1001 1</code> | 执行 `setbit` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>GETBIT service:active:20260702 1001</code> | 执行 `getbit` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>BITCOUNT service:active:20260702</code> | 执行 `bitcount` 相关命令，后面的参数决定它具体操作什么对象。 |


适合：

- 某服务某天是否活跃。
- 用户或实例状态压缩。

### HyperLogLog

HyperLogLog 用很小内存近似统计基数。

```bash
PFADD alert:unique-services:20260702 order-api payment-api gateway
PFCOUNT alert:unique-services:20260702
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>PFADD alert:unique-services:20260702 order-api payment-api gateway</code> | 执行 `pfadd` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>PFCOUNT alert:unique-services:20260702</code> | 执行 `pfcount` 相关命令，后面的参数决定它具体操作什么对象。 |


适合：

- 大规模近似去重计数。
- 不要求精确列表，只要数量。

## 缓存模式

### Cache-aside

最常见模式：

```text
app reads Redis
  -> hit: return cache
  -> miss: read MySQL / API
  -> write Redis with TTL
  -> return result
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>app reads Redis</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; hit: return cache</code> | 这一行要理解这些英文词：`hit` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`return cache` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; miss: read MySQL / API</code> | 这一行要理解这些英文词：`miss` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`read MySQL` 是mysql=MySQL 数据库或客户端命令；`API` 是应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; write Redis with TTL</code> | 这一行要理解这些英文词：`write Redis with TTL` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; return result</code> | 这一行要理解这些英文词：`return result` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


Python 伪代码：

```python
cached = redis.get(cache_key)
if cached:
    return cached

data = query_mysql()
redis.set(cache_key, data, ex=300)
return data
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>cached = redis.get(cache_key)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 2 行 | <code>if cached:</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 3 行 | <code>    return cached</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 4 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 5 行 | <code>data = query_mysql()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <code>redis.set(cache_key, data, ex=300)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 7 行 | <code>return data</code> | 返回函数结果，调用方会拿到这个值继续处理。 |


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
- Bloom filter。

### 缓存击穿

一个热点 key 过期，大量请求同时打到后端。

解决：

- 热点 key 延长 TTL。
- 互斥锁。
- 提前刷新。
- 加随机 TTL。

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>INCR rate:order-api:202607021020</code> | 执行 `incr` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>EXPIRE rate:order-api:202607021020 60</code> | 执行 `expire` 相关命令，后面的参数决定它具体操作什么对象。 |


如果计数超过阈值，就拒绝或降级。

缺点：窗口边界可能突刺。

### 滑动窗口思路

用 Sorted Set 保存时间戳：

```bash
ZADD rate:order-api 1782960000 req-1
ZREMRANGEBYSCORE rate:order-api -inf 1782959940
ZCOUNT rate:order-api 1782959940 1782960000
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ZADD rate:order-api 1782960000 req-1</code> | 执行 `zadd` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>ZREMRANGEBYSCORE rate:order-api -inf 1782959940</code> | 执行 `zremrangebyscore` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>ZCOUNT rate:order-api 1782959940 1782960000</code> | 执行 `zcount` 相关命令，后面的参数决定它具体操作什么对象。 |


更精确，但命令更多。

## 分布式锁

Redis 常被用于锁，但要小心。

最小写法：

```bash
SET lock:runbook:order-api request-123 NX EX 30
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SET lock:runbook:order-api request-123 NX EX 30</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli CONFIG SET appendonly yes</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


生产配置应写到配置文件或部署配置。

### RDB + AOF

重要数据可以同时使用 RDB 和 AOF。

但要记住：

```text
Redis 持久化不是关系型数据库事务替代品。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Redis 持久化不是关系型数据库事务替代品。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果数据必须强一致、长期保存、复杂查询，仍然应落 MySQL、PostgreSQL 或事件存储。

## 内存和淘汰策略

Redis 快，是因为主要在内存里。代价是必须管理内存。

### 查看内存

```bash
redis-cli INFO memory
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli INFO memory</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli CONFIG SET maxmemory 512mb</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


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
client writes
  -> primary
  -> replicate to replicas
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client writes</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; primary</code> | 这一行要理解这些英文词：`primary` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; replicate to replicas</code> | 这一行要理解这些英文词：`replicate to replicas` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


用途：

- 读扩展。
- 数据冗余。
- 高可用基础。

注意：

- Redis 复制通常是异步的。
- primary 写成功不代表 replica 立刻有数据。
- replica 可以用于读，但要接受短暂延迟。

实验：

```bash
docker run -d --name redis-primary -p 6379:6379 redis:latest
docker run -d --name redis-replica -p 6380:6379 redis:latest redis-server --replicaof host.docker.internal 6379
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name redis-primary -p 6379:6379 redis:latest</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>docker run -d --name redis-replica -p 6380:6379 redis:latest redis-server --replicaof host.docker.internal 6379</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


查看角色：

```bash
redis-cli -p 6379 INFO replication
redis-cli -p 6380 INFO replication
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli -p 6379 INFO replication</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |
| 第 2 行 | <code>redis-cli -p 6380 INFO replication</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


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
clients
  -> ask Sentinel for current primary
  -> connect Redis primary

Sentinels
  -> monitor primary / replicas
  -> failover when needed
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>clients</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; ask Sentinel for current primary</code> | 这一行要理解这些英文词：`ask Sentinel for current primary` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; connect Redis primary</code> | 这一行要理解这些英文词：`connect Redis primary` 是connect=连接。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 5 行 | <code>Sentinels</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  -&gt; monitor primary / replicas</code> | 这一行要理解这些英文词：`monitor primary` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`replicas` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; failover when needed</code> | 这一行要理解这些英文词：`failover when needed` 是failover=故障切换。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


要点：

- Sentinel 本身也要多个节点。
- 客户端需要支持 Sentinel。
- Sentinel 解决高可用，不解决数据分片。

## Cluster

Redis Cluster 用于水平扩展。

核心：

```text
key
  -> hash slot
  -> node
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>key</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; hash slot</code> | 这一行要理解这些英文词：`hash slot` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; node</code> | 这一行要理解这些英文词：`node` 是节点，可以指服务器、Kubernetes 节点或图里的一个步骤。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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
redis-cli -a your_password PING
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli -a your_password PING</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


### ACL

创建只读用户示例：

```bash
ACL SETUSER aiops_reader on >reader_pwd ~service:* +get +hget +hgetall +ttl
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ACL SETUSER aiops_reader on &gt;reader_pwd ~service:* +get +hget +hgetall +ttl</code> | 执行 `acl` 相关命令，后面的参数决定它具体操作什么对象。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ACL LIST</code> | 执行 `acl` 相关命令，后面的参数决定它具体操作什么对象。 |


应用不要使用全权限默认用户。

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli INFO server</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |
| 第 2 行 | <code>redis-cli INFO clients</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |
| 第 3 行 | <code>redis-cli INFO memory</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |
| 第 4 行 | <code>redis-cli INFO stats</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |
| 第 5 行 | <code>redis-cli INFO replication</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |
| 第 6 行 | <code>redis-cli INFO keyspace</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli SLOWLOG GET 10</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


慢命令会影响 Redis 响应，因为命令执行时间过长会占住事件循环。

常见慢命令来源：

- 大 key。
- `KEYS *`。
- 一次取超大集合。
- 复杂 Lua 脚本。
- 阻塞命令使用不当。

### LATENCY

Redis 提供 latency 诊断命令：

```bash
redis-cli LATENCY DOCTOR
redis-cli LATENCY LATEST
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli LATENCY DOCTOR</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |
| 第 2 行 | <code>redis-cli LATENCY LATEST</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli --bigkeys</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>projects/redis-alert-dedup/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  README.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  requirements.txt</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  dedup.py</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  stream_demo.sh</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### requirements.txt

```text
redis
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


### dedup.py

```python
import hashlib
import json

import redis

r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)


def fingerprint(alert: dict) -> str:
    raw = "|".join(
        [
            alert["service"],
            alert["name"],
            alert["instance"],
            alert["severity"],
        ]
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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import hashlib</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import json</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 4 行 | <code>import redis</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 5 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 6 行 | <code>r = redis.Redis(host="127.0.0.1", port=6379, decode_responses=True)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 9 行 | <code>def fingerprint(alert: dict) -&gt; str:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 10 行 | <code>    raw = "&#124;".join(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>        [</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>            alert["service"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>            alert["name"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>            alert["instance"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>            alert["severity"],</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>        ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>    )</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>    return hashlib.sha256(raw.encode("utf-8")).hexdigest()</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 19 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 20 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 21 行 | <code>def should_process(alert: dict, ttl_seconds: int = 300) -&gt; bool:</code> | 定义函数，把一段可复用逻辑命名，后续可以反复调用。 |
| 第 22 行 | <code>    fp = fingerprint(alert)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 23 行 | <code>    key = f"alert:dedup:{fp}"</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 24 行 | <code>    value = json.dumps(alert, ensure_ascii=False)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 25 行 | <code>    return r.set(key, value, nx=True, ex=ttl_seconds) is True</code> | 返回函数结果，调用方会拿到这个值继续处理。 |
| 第 26 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 27 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 28 行 | <code>sample = {</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 29 行 | <code>    "service": "order-api",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 30 行 | <code>    "name": "HighErrorRate",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 31 行 | <code>    "instance": "10.0.1.11",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 32 行 | <code>    "severity": "critical",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>}</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 35 行 | <code>if should_process(sample):</code> | 条件判断，只有条件成立时才执行下面缩进的代码。 |
| 第 36 行 | <code>    print("process")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 37 行 | <code>else:</code> | 兜底分支，前面的条件都不成立时执行。 |
| 第 38 行 | <code>    print("duplicate")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


运行：

```bash
pip install -r requirements.txt
python dedup.py
python dedup.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install -r requirements.txt</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |
| 第 2 行 | <code>python dedup.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 3 行 | <code>python dedup.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


第一次输出：

```text
process
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>process</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


第二次输出：

```text
duplicate
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>duplicate</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


学习点：

- fingerprint 决定去重粒度。
- `SET NX EX` 是原子去重窗口。
- TTL 到期后告警会重新处理。

## AIOps 入门实验：Stream 事件流

### 写入事件

```bash
redis-cli XADD stream:alerts '*' service order-api severity critical alert HighErrorRate
redis-cli XADD stream:alerts '*' service payment-api severity warning alert HighLatency
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli XADD stream:alerts '*' service order-api severity critical alert HighErrorRate</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |
| 第 2 行 | <code>redis-cli XADD stream:alerts '*' service payment-api severity warning alert HighLatency</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


### 创建消费组

```bash
redis-cli XGROUP CREATE stream:alerts aiops-workers 0 MKSTREAM
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli XGROUP CREATE stream:alerts aiops-workers 0 MKSTREAM</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


如果组已存在会报错，实验时可以忽略或先删除 stream。

### 消费

```bash
redis-cli XREADGROUP GROUP aiops-workers worker-1 COUNT 10 STREAMS stream:alerts '>'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli XREADGROUP GROUP aiops-workers worker-1 COUNT 10 STREAMS stream:alerts '&gt;'</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


### 确认

把实际返回的 entry id 填进去：

```bash
redis-cli XACK stream:alerts aiops-workers 1782960000000-0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli XACK stream:alerts aiops-workers 1782960000000-0</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


### 查看待确认

```bash
redis-cli XPENDING stream:alerts aiops-workers
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli XPENDING stream:alerts aiops-workers</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>redis-cli PING</code> | 连接 Redis，用来检查缓存、队列、限流或告警去重状态。 |


作用：检查 Redis 是否响应。

### SET / GET

```bash
SET key value
GET key
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SET key value</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |
| 第 2 行 | <code>GET key</code> | 执行 `get` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：写入和读取 String。

### SET NX EX

```bash
SET alert:dedup:fp123 seen NX EX 300
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SET alert:dedup:fp123 seen NX EX 300</code> | 设置 shell 或工具变量，具体含义取决于当前终端环境。 |


作用：原子去重窗口。

### TTL / EXPIRE

```bash
TTL key
EXPIRE key 300
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>TTL key</code> | 执行 `ttl` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>EXPIRE key 300</code> | 执行 `expire` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：查看和设置过期时间。

### DEL / UNLINK

```bash
DEL key
UNLINK key
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>DEL key</code> | 执行 `del` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>UNLINK key</code> | 执行 `unlink` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：删除 key。`UNLINK` 是异步释放内存，更适合删除大 key。

### SCAN

```bash
SCAN 0 MATCH alert:* COUNT 100
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SCAN 0 MATCH alert:* COUNT 100</code> | 执行 `scan` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：增量扫描 key。生产避免 `KEYS *`。

### HSET / HGETALL

```bash
HSET service:state:order-api status degraded error_rate 0.23
HGETALL service:state:order-api
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HSET service:state:order-api status degraded error_rate 0.23</code> | 执行 `hset` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>HGETALL service:state:order-api</code> | 执行 `hgetall` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：操作 Hash。

### LPUSH / BRPOP

```bash
LPUSH job:queue:aiops task1
BRPOP job:queue:aiops 0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>LPUSH job:queue:aiops task1</code> | 执行 `lpush` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>BRPOP job:queue:aiops 0</code> | 执行 `brpop` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：简单队列。

### SADD / SISMEMBER

```bash
SADD alert:fingerprints fp1
SISMEMBER alert:fingerprints fp1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SADD alert:fingerprints fp1</code> | 执行 `sadd` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>SISMEMBER alert:fingerprints fp1</code> | 执行 `sismember` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：集合去重。

### ZINCRBY / ZREVRANGE

```bash
ZINCRBY alert:rank:services 1 order-api
ZREVRANGE alert:rank:services 0 9 WITHSCORES
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ZINCRBY alert:rank:services 1 order-api</code> | 执行 `zincrby` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>ZREVRANGE alert:rank:services 0 9 WITHSCORES</code> | 执行 `zrevrange` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：排行。

### XADD / XREADGROUP / XACK

```bash
XADD stream:alerts '*' service order-api alert HighErrorRate
XREADGROUP GROUP aiops-workers worker-1 COUNT 10 STREAMS stream:alerts '>'
XACK stream:alerts aiops-workers 1782960000000-0
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>XADD stream:alerts '*' service order-api alert HighErrorRate</code> | 执行 `xadd` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>XREADGROUP GROUP aiops-workers worker-1 COUNT 10 STREAMS stream:alerts '&gt;'</code> | 执行 `xreadgroup` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>XACK stream:alerts aiops-workers 1782960000000-0</code> | 执行 `xack` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：事件流和消费确认。

### INFO

```bash
INFO memory
INFO clients
INFO stats
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>INFO memory</code> | 执行 `info` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>INFO clients</code> | 执行 `info` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>INFO stats</code> | 执行 `info` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：查看 Redis 状态。

### SLOWLOG GET

```bash
SLOWLOG GET 10
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SLOWLOG GET 10</code> | 执行 `slowlog` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：查看慢命令。

### CONFIG GET

```bash
CONFIG GET maxmemory
CONFIG GET appendonly
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CONFIG GET maxmemory</code> | 执行 `config` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 2 行 | <code>CONFIG GET appendonly</code> | 执行 `config` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：查看配置。

### ACL LIST

```bash
ACL LIST
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ACL LIST</code> | 执行 `acl` 相关命令，后面的参数决定它具体操作什么对象。 |


作用：查看 ACL 用户和权限。

## 典型故障排查表

| 现象 | 常见原因 | 怎么查 | 怎么修 |
|---|---|---|---|
| 连接不上 | Redis 未启动、端口错、防火墙 | `PING`、`docker ps`、日志 | 启动服务、修端口 |
| `NOAUTH` | 开启认证但没传密码 | 返回错误 | 配置密码 |
| `WRONGTYPE` | 用错数据类型命令 | `TYPE key` | 修 key 或删重建 |
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
PING
  -> 检查 host/port
  -> 检查密码/ACL
  -> 检查 bind/protected-mode
  -> 检查网络和容器端口
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>PING</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 检查 host/port</code> | 这一行要理解这些英文词：`host` 是主机，可以是一台服务器、虚拟机或节点；`port` 是端口，网络服务监听请求的入口编号。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 检查密码/ACL</code> | 这一行要理解这些英文词：`ACL` 是访问控制列表，用来定义谁可以访问哪些资源。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 检查 bind/protected-mode</code> | 这一行要理解这些英文词：`bind` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`protected-mode` 是mode=模式。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 检查网络和容器端口</code> | 这一行表示上一级主题下的子项“检查网络和容器端口”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |


### 内存问题

```text
INFO memory
  -> 看 used_memory / maxmemory
  -> 看 evicted_keys
  -> 找大 key
  -> 检查 TTL
  -> 调整数据模型或淘汰策略
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>INFO memory</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; 看 used_memory / maxmemory</code> | 这一行要理解这些英文词：`used_memory` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题；`maxmemory` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 看 evicted_keys</code> | 这一行要理解这些英文词：`evicted_keys` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 找大 key</code> | 这一行要理解这些英文词：`key` 是键。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 检查 TTL</code> | 这一行要理解这些英文词：`TTL` 是英文缩写或固定标识，结合本节上下文记住它代表的组件、命令或状态。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; 调整数据模型或淘汰策略</code> | 这一行表示上一级主题下的子项“调整数据模型或淘汰策略”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |


### 延迟问题

```text
SLOWLOG GET
  -> LATENCY DOCTOR
  -> 查大 key
  -> 查阻塞命令
  -> 查 CPU / swap / 磁盘持久化压力
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SLOWLOG GET</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; LATENCY DOCTOR</code> | 这一行要理解这些英文词：`LATENCY DOCTOR` 是latency=延迟。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 查大 key</code> | 这一行要理解这些英文词：`key` 是键。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 查阻塞命令</code> | 这一行表示上一级主题下的子项“查阻塞命令”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 5 行 | <code>  -&gt; 查 CPU / swap / 磁盘持久化压力</code> | 这一行要理解这些英文词：`CPU` 是中央处理器，负责执行程序计算；`swap` 是英文关键字，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |


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

## 学习证据

学完这篇，建议留下这些证据：

1. 一个 Redis Docker 启动说明。
2. 一个 `dedup.py`，用 `SET NX EX` 实现告警去重。
3. 一个 Stream demo，包含 `XADD`、`XGROUP`、`XREADGROUP`、`XACK`。
4. 一张 `INFO memory` 输出记录。
5. 一张 `SLOWLOG GET` 输出记录。
6. 一篇 README，解释 Redis、MySQL、Kafka 在 AIOps 链路中的分工。
