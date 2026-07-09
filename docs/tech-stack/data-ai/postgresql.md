# PostgreSQL 深讲

> 学习目标：理解 PostgreSQL 为什么适合做 AIOps 后端数据底座，能讲清 database、schema、table、index、MVCC、WAL、vacuum、autovacuum、EXPLAIN、extension、replication、backup 和权限模型，并能用它保存告警、事件、变更、runbook、向量索引元数据和分析结果。

## 官方资料

- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- [SQL Commands](https://www.postgresql.org/docs/current/sql-commands.html)
- [Data Definition](https://www.postgresql.org/docs/current/ddl.html)
- [Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [MVCC](https://www.postgresql.org/docs/current/mvcc.html)
- [Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)
- [Monitoring Database Activity](https://www.postgresql.org/docs/current/monitoring.html)
- [Backup and Restore](https://www.postgresql.org/docs/current/backup.html)

说明：PostgreSQL 文档非常完整。本文按 AIOps 项目需要重新组织，优先讲“怎么建模、怎么查询、怎么排障、怎么监控”，不复制官方全文。

## 场景开场

你要做一个 AIOps 小系统，准备保存这些数据：

- Alertmanager 进来的告警。
- 告警降噪后的 incident candidate。
- 每次 runbook 执行记录。
- 发布变更记录。
- RCA 复盘结论。
- 人工反馈：误报、有效、已处理。
- RAG 文档索引和元数据。

这些数据既要能事务更新，又要能 SQL 分析，还要方便和 Python、FastAPI、Grafana、Prometheus exporter 连接。PostgreSQL 很适合作为第一版 AIOps 数据底座：开源、功能完整、SQL 能力强、扩展生态好，也适合本地作品集和生产系统演进。

## 一句话人话版

PostgreSQL 是开源关系型数据库，擅长标准 SQL、事务、索引、JSON、扩展和可靠存储；在 AIOps 中，它可以保存告警、事件、变更、runbook、反馈和分析结果。

## 为什么要学 PostgreSQL

相比只学 MySQL，PostgreSQL 额外值得关注：

- JSONB 适合保存告警原始 payload。
- 丰富索引适合复杂查询。
- MVCC 和事务语义清晰。
- extension 生态强，能扩展全文检索、时序、向量等能力。
- `EXPLAIN (ANALYZE, BUFFERS)` 对性能分析很有帮助。
- 开源项目、SaaS 后端、数据平台里都很常见。

AIOps 工程师学习 PostgreSQL，不是为了背所有参数，而是为了能设计可靠数据表、写出可解释 SQL，并在查询慢、连接满、磁盘涨、复制延迟时知道先看哪里。

## 核心概念

### Database、Schema、Table

```text
PostgreSQL instance
  -> database
     -> schema
        -> table
        -> index
        -> view
        -> function
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>PostgreSQL instance</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; database</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>     -&gt; schema</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>        -&gt; table</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>        -&gt; index</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>        -&gt; view</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>        -&gt; function</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


常见理解：

- database 是隔离的数据库空间。
- schema 是 database 内的命名空间。
- table 保存结构化数据。
- index 加速查询。
- view 把复杂查询封装起来。

### MVCC

MVCC 是多版本并发控制。简单说：读和写不一定互相阻塞，数据库用数据版本维持一致性。

你需要知道：

- 长事务会阻碍旧版本清理。
- 大量更新/删除后会产生 dead tuples。
- vacuum 负责清理无用版本。
- autovacuum 不健康会导致表膨胀和查询变慢。

### WAL

WAL 是 Write-Ahead Log，写前日志。PostgreSQL 先把变更写进 WAL，再落到数据文件，用于崩溃恢复和复制。

WAL 异常常见影响：

- 磁盘增长。
- 复制延迟。
- 备份链路异常。
- 写入性能下降。

### Index

常见索引：

| 类型 | 适合场景 |
|---|---|
| B-tree | 默认选择，等值、范围、排序 |
| GIN | JSONB、数组、全文检索 |
| GiST | 地理、范围、相似性等扩展场景 |
| BRIN | 超大表按物理顺序扫描 |

索引不是越多越好。索引会加速读，也会增加写入成本和存储成本。AIOps 表如果写入很多，需要谨慎选择索引。

### EXPLAIN

`EXPLAIN` 用来查看执行计划，`EXPLAIN ANALYZE` 会实际执行并显示真实耗时。

排查慢查询时重点看：

- 是否走索引。
- 扫描行数和实际行数差异。
- join 顺序。
- sort/hash 是否溢出。
- buffers 命中情况。
- 是否因为统计信息过期导致估算错误。

## 架构和数据流

```text
FastAPI / worker
  |
  v
PostgreSQL
  |
  +--> table: alerts
  +--> table: incidents
  +--> table: changes
  +--> table: runbook_runs
  +--> table: feedback
  +--> index: service + started_at
  +--> JSONB: raw alert payload
  +--> WAL
  +--> backup / replica
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FastAPI / worker</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  v</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>PostgreSQL</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  &#124;</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  +--&gt; table: alerts</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  +--&gt; table: incidents</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  +--&gt; table: changes</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  +--&gt; table: runbook_runs</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>  +--&gt; table: feedback</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>  +--&gt; index: service + started_at</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>  +--&gt; JSONB: raw alert payload</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>  +--&gt; WAL</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>  +--&gt; backup / replica</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


一个 AIOps 事件可以这样落库：

```text
Alertmanager webhook
  -> alert-api
  -> insert alerts
  -> dedupe worker creates incident_candidate
  -> runbook worker records action
  -> user feedback updates incident status
  -> RCA stores final summary
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager webhook</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; alert-api</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; insert alerts</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; dedupe worker creates incident_candidate</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; runbook worker records action</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; user feedback updates incident status</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; RCA stores final summary</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


## 最小数据模型

```sql
CREATE TABLE alerts (
  id BIGSERIAL PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  service_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  labels JSONB NOT NULL DEFAULT '{}',
  annotations JSONB NOT NULL DEFAULT '{}',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_service_time
ON alerts (service_name, starts_at DESC);

CREATE INDEX idx_alerts_labels_gin
ON alerts USING GIN (labels);
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE TABLE alerts (</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 2 行 | <code>  id BIGSERIAL PRIMARY KEY,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  fingerprint TEXT NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  service_name TEXT NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  severity TEXT NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>  status TEXT NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 7 行 | <code>  labels JSONB NOT NULL DEFAULT '{}',</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 8 行 | <code>  annotations JSONB NOT NULL DEFAULT '{}',</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 9 行 | <code>  starts_at TIMESTAMPTZ NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 10 行 | <code>  ends_at TIMESTAMPTZ,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 11 行 | <code>  created_at TIMESTAMPTZ NOT NULL DEFAULT now()</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 12 行 | <code>);</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 13 行 | <em>空行</em> | 空行，用来把 SQL 的不同逻辑段分开。 |
| 第 14 行 | <code>CREATE INDEX idx_alerts_service_time</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 15 行 | <code>ON alerts (service_name, starts_at DESC);</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 16 行 | <em>空行</em> | 空行，用来把 SQL 的不同逻辑段分开。 |
| 第 17 行 | <code>CREATE INDEX idx_alerts_labels_gin</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 18 行 | <code>ON alerts USING GIN (labels);</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |


查询最近 24 小时告警最多的服务：

```sql
SELECT service_name, COUNT(*) AS alert_count
FROM alerts
WHERE starts_at >= now() - interval '24 hours'
GROUP BY service_name
ORDER BY alert_count DESC;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT service_name, COUNT(*) AS alert_count</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>WHERE starts_at &gt;= now() - interval '24 hours'</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 4 行 | <code>GROUP BY service_name</code> | 按指定字段分组，让每组单独统计或聚合。 |
| 第 5 行 | <code>ORDER BY alert_count DESC;</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |


查询某个标签：

```sql
SELECT *
FROM alerts
WHERE labels @> '{"team": "platform"}';
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT *</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>WHERE labels @&gt; '{"team": "platform"}';</code> | 过滤原始数据行，只保留符合条件的记录。 |


## 常用观测点

| 观测点 | 含义 | 异常解读 |
|---|---|---|
| connections | 当前连接数 | 连接池过大、泄漏或突增 |
| active queries | 活跃查询 | 慢查询、锁等待、并发压力 |
| locks | 锁 | 长事务或 DDL 阻塞 |
| dead tuples | 死元组 | vacuum 跟不上，表膨胀 |
| replication lag | 复制延迟 | 主从同步风险 |
| WAL generation | WAL 生成速率 | 写入突增、备份/复制压力 |
| cache hit ratio | 缓存命中 | 内存不足或查询模式变化 |
| disk usage | 磁盘占用 | 表增长、索引膨胀、WAL 堆积 |

## 入门实验

目录建议：

```text
labs/postgresql-aiops-store/
  compose.yaml
  schema.sql
  seed.sql
  queries.sql
  README.md
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>labs/postgresql-aiops-store/</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  compose.yaml</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>  schema.sql</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>  seed.sql</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>  queries.sql</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>  README.md</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


`compose.yaml` 可以先只跑一个 PostgreSQL：

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: aiops
      POSTGRES_PASSWORD: aiops
      POSTGRES_DB: aiops
    ports:
      - "5432:5432"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  postgres:</code> | 定义 `postgres` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    image: postgres:17</code> | 设置 `image` 字段的值为 `postgres:17`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 5 行 | <code>      POSTGRES_USER: aiops</code> | 设置 `POSTGRES_USER` 字段的值为 `aiops`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 6 行 | <code>      POSTGRES_PASSWORD: aiops</code> | 设置 `POSTGRES_PASSWORD` 字段的值为 `aiops`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>      POSTGRES_DB: aiops</code> | 设置 `POSTGRES_DB` 字段的值为 `aiops`，真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>    ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 9 行 | <code>      - "5432:5432"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |


实验目标：

- 建 `alerts`、`incidents`、`runbook_runs` 三张表。
- 插入模拟告警。
- 用 SQL 聚合服务告警次数。
- 用 JSONB 保存原始 labels。
- 给常用查询加索引。
- 用 `EXPLAIN ANALYZE` 对比索引前后。

## 排障路径

### 连接打满

先看：

1. 当前连接数和最大连接数。
2. 应用连接池配置。
3. 是否有 idle in transaction。
4. 是否所有请求都新建连接。
5. 是否需要 PgBouncer。

### 查询变慢

先看：

1. 慢 SQL 文本。
2. `EXPLAIN (ANALYZE, BUFFERS)`。
3. 是否走索引。
4. 统计信息是否过期。
5. 表是否膨胀。
6. 是否锁等待。
7. 最近是否有数据量、索引或 SQL 改动。

### 表膨胀

常见原因：

- 高频 update/delete。
- autovacuum 跟不上。
- 长事务阻止清理。
- 批处理一次改太多数据。

处理方向：

- 找长事务。
- 检查 autovacuum。
- 调整表级 vacuum 参数。
- 优化更新模式。
- 必要时重建表或索引。

### 复制延迟

先看：

- 主库 WAL 生成是否突增。
- 从库 replay 是否变慢。
- 网络是否抖动。
- 从库查询是否阻塞回放。
- replication slot 是否积压 WAL。

## 在 AIOps 中的位置

| AIOps 环节 | PostgreSQL 作用 |
|---|---|
| 数据采集 | 保存告警、事件、变更、runbook 执行记录 |
| 告警降噪 | 用 fingerprint、labels、时间窗口做去重和聚合 |
| 根因分析 | 关联服务、变更、日志摘要、历史 RCA |
| 反馈学习 | 保存人工确认、误报标记、处理结果 |
| RAG | 保存文档元数据、chunk 关系和检索日志 |
| 报表 | 用 SQL 输出服务稳定性、MTTR、告警质量 |

## 面试怎么讲

PostgreSQL 是开源关系型数据库，适合保存结构化业务数据和 AIOps 事件数据。核心概念包括 database、schema、table、index、transaction、MVCC、WAL、vacuum、replication 和 backup。做 AIOps 项目时，我会用 PostgreSQL 保存 alerts、incidents、changes、runbook_runs、feedback 等事实表，用 JSONB 保存原始告警 labels，用 B-tree 和 GIN 索引支持常用查询。

排障时我会先按现象分类：连接打满看连接池、idle in transaction 和最大连接数；查询慢看 `EXPLAIN ANALYZE`、索引、统计信息、锁等待和表膨胀；磁盘增长看表、索引、WAL 和 vacuum；复制延迟看 WAL 生成、网络、从库回放和 replication slot。这样可以把数据库问题和应用错误率、发布变更、告警噪声关联起来。

## 学习检查清单

- [ ] 我能解释 database、schema、table、index 的关系。
- [ ] 我能说明 MVCC、WAL、vacuum 的作用。
- [ ] 我能设计 alerts / incidents / runbook_runs 表。
- [ ] 我能用 JSONB 保存告警 labels。
- [ ] 我能写服务告警 TopN 聚合 SQL。
- [ ] 我能用 `EXPLAIN ANALYZE` 看慢查询。
- [ ] 我能解释 B-tree 和 GIN 索引的常见用途。
- [ ] 我能排查连接打满、查询慢、表膨胀、复制延迟。
- [ ] 我能说明 PostgreSQL 在 AIOps 数据底座中的位置。

## 面试题

1. PostgreSQL 的 database 和 schema 有什么区别？
2. MVCC 是什么？它解决什么问题？
3. WAL 有什么作用？
4. vacuum 和 autovacuum 为什么重要？
5. B-tree 和 GIN 索引分别适合什么场景？
6. JSONB 在 AIOps 中能用来做什么？
7. 慢查询你会怎么分析？
8. 连接数打满你会怎么排查？
9. 表膨胀是什么原因导致的？
10. PostgreSQL 如何支持 AIOps 事件和反馈数据建模？

## 学习证据

学完后建议提交：

- `labs/postgresql-aiops-store/compose.yaml`
- `labs/postgresql-aiops-store/schema.sql`
- `labs/postgresql-aiops-store/queries.sql`
- 一份 `EXPLAIN ANALYZE` 前后对比记录。
- 一篇 `PostgreSQL 连接打满排查.md`。
- 一篇 `PostgreSQL 慢查询排查.md`。
