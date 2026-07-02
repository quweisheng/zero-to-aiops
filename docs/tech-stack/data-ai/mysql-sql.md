# MySQL / SQL

> 目标：不是只会写几条 `SELECT`，而是能理解 MySQL Server、数据库、表、行、列、索引、事务、锁、InnoDB、执行计划、权限、备份、慢查询和 AIOps 数据建模之间的关系，并能用 SQL 回答真实运维问题。

## 官方资料

优先读这些 MySQL 8.4 官方资料：

- [MySQL 8.4 Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [Tutorial](https://dev.mysql.com/doc/refman/8.4/en/tutorial.html)
- [Connecting to and Disconnecting from the Server](https://dev.mysql.com/doc/refman/8.4/en/connecting-disconnecting.html)
- [Creating and Selecting a Database](https://dev.mysql.com/doc/refman/8.4/en/creating-database.html)
- [Creating a Table](https://dev.mysql.com/doc/refman/8.4/en/creating-tables.html)
- [Loading Data into a Table](https://dev.mysql.com/doc/refman/8.4/en/loading-tables.html)
- [Retrieving Information from a Table](https://dev.mysql.com/doc/refman/8.4/en/retrieving-data.html)
- [Using mysql in Batch Mode](https://dev.mysql.com/doc/refman/8.4/en/batch-mode.html)
- [Examples of Common Queries](https://dev.mysql.com/doc/refman/8.4/en/examples.html)
- [mysql command-line client](https://dev.mysql.com/doc/refman/8.4/en/mysql.html)
- [Data Types](https://dev.mysql.com/doc/refman/8.4/en/data-types.html)
- [Functions and Operators](https://dev.mysql.com/doc/refman/8.4/en/functions.html)
- [SQL Statements](https://dev.mysql.com/doc/refman/8.4/en/sql-statements.html)
- [SELECT Statement](https://dev.mysql.com/doc/refman/8.4/en/select.html)
- [JOIN Clause](https://dev.mysql.com/doc/refman/8.4/en/join.html)
- [CREATE TABLE Statement](https://dev.mysql.com/doc/refman/8.4/en/create-table.html)
- [CREATE INDEX Statement](https://dev.mysql.com/doc/refman/8.4/en/create-index.html)
- [EXPLAIN Statement](https://dev.mysql.com/doc/refman/8.4/en/explain.html)
- [Introduction to InnoDB](https://dev.mysql.com/doc/refman/8.4/en/innodb-introduction.html)
- [InnoDB Architecture](https://dev.mysql.com/doc/refman/8.4/en/innodb-architecture.html)
- [Clustered and Secondary Indexes](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html)
- [InnoDB Transaction Model](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-model.html)
- [Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)
- [InnoDB Locking](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html)
- [Deadlocks in InnoDB](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html)
- [The Slow Query Log](https://dev.mysql.com/doc/refman/8.4/en/slow-query-log.html)
- [CREATE USER](https://dev.mysql.com/doc/refman/8.4/en/create-user.html)
- [GRANT](https://dev.mysql.com/doc/refman/8.4/en/grant.html)
- [mysqldump](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html)

说明：本文按 MySQL 官方手册结构整理，用 AIOps 场景重新讲解，不复制官方全文。

## 场景开场

你收到一个告警：

```text
HighErrorRate
service=order-api
severity=critical
started_at=2026-07-02 10:20:00
```

只看这一条告警，你只能知道“现在有问题”。但值班和复盘真正想问的是：

- 最近 24 小时哪个服务告警最多？
- 这个服务过去 7 天是否反复出现同类告警？
- 故障前 30 分钟有没有发布？
- 这次告警多久恢复？
- 哪个 runbook 被执行过？
- 哪个处理动作真的有效？
- 哪些告警最后被人工标记为噪声？

这些答案都不是 Prometheus 单条时序、Loki 单行日志或一个大模型回答能凭空给出的。你需要把告警、事故、变更、runbook、人工反馈这些“结构化事实”放进数据库，再用 SQL 过滤、聚合和关联。

MySQL / SQL 的价值，就是把 AIOps 的证据变成能查询、能统计、能复盘的数据。

## 一句话人话版

MySQL 是保存结构化数据的关系型数据库，SQL 是查询和操作这些数据的语言；在 AIOps 里，它像一本可查询的运维账本，用来记录告警、事故、变更、处理动作和人工反馈。

## 小白可能会问

- MySQL 和 SQL 是什么关系？
- Prometheus 已经能存指标，为什么还要 MySQL？
- 数据库、表、行、列、主键、外键分别是什么？
- `SELECT` 的执行顺序为什么不是从 `SELECT` 开始？
- `WHERE` 和 `HAVING` 有什么区别？
- `JOIN` 为什么是 SQL 的核心？
- 索引为什么能加速查询？为什么索引不是越多越好？
- 事务 ACID 到底保护了什么？
- MySQL 的 InnoDB 是什么？为什么总听到它？
- 慢查询、锁等待、死锁怎么查？
- AIOps 项目里应该怎么设计告警表、事故表、变更表？

## 官方知识地图

MySQL 官方手册可以按这张地图理解：

```text
MySQL
  -> Tutorial
     -> connect
     -> enter queries
     -> create database
     -> create table
     -> load data
     -> retrieve data
     -> batch mode
     -> common queries
  -> MySQL Programs
     -> mysql client
     -> mysqld server
     -> mysqladmin
     -> mysqldump
     -> mysqlimport
     -> mysqlshow
     -> mysqlbinlog
  -> SQL Language
     -> language structure
     -> data types
     -> functions and operators
     -> SQL statements
       -> DDL
       -> DML
       -> transaction statements
       -> administration statements
       -> utility statements
  -> Optimization
     -> indexes
     -> optimizer
     -> EXPLAIN
     -> slow query log
  -> InnoDB
     -> ACID
     -> MVCC
     -> buffer pool
     -> clustered index
     -> secondary index
     -> redo log
     -> undo log
     -> locks
     -> transactions
     -> deadlocks
  -> Administration
     -> users
     -> privileges
     -> variables
     -> backup and recovery
     -> logs
  -> Observability
     -> INFORMATION_SCHEMA
     -> Performance Schema
     -> sys schema
```

初学路线：

```text
mysql client
  -> database/table/row/column
  -> SELECT/WHERE/GROUP BY/JOIN
  -> INSERT/UPDATE/DELETE
  -> data types
  -> primary key/index
  -> transaction
  -> EXPLAIN
  -> InnoDB
  -> users/privileges
  -> backup/slow query/troubleshooting
```

## MySQL / SQL 在 AIOps 链路中的位置

AIOps 里常见数据源：

| 数据 | 典型系统 | MySQL 是否适合 |
|---|---|---|
| 原始指标点 | Prometheus、VictoriaMetrics、Thanos | 不适合做主存储 |
| 原始日志 | Loki、Elasticsearch | 不适合做主存储 |
| Trace span | Jaeger、Tempo、OTel backend | 不适合做主存储 |
| 告警事件 | Alertmanager webhook、告警平台 | 适合 |
| 事故单 | Incident system、工单系统 | 适合 |
| 发布记录 | GitHub Actions、CI/CD | 适合 |
| Runbook 执行记录 | 自动化平台 | 适合 |
| 人工反馈标签 | 值班、复盘、模型标注 | 适合 |
| 聚合后的特征 | pandas / ML pipeline | 适合 |

MySQL 在 AIOps 项目里通常处在这个位置：

```text
Alertmanager / GitHub Actions / Runbook / Incident
  -> collector
  -> MySQL
      alerts
      incidents
      deployments
      runbook_executions
      feedback_labels
  -> SQL analysis
  -> pandas / scikit-learn
  -> FastAPI dashboard
  -> RAG / LLM explanation
```

MySQL 不替代 Prometheus 和 Loki。它保存的是“结构化事实”和“关联上下文”。

## MySQL、SQL、关系型数据库

### SQL 是什么

SQL 是 Structured Query Language，结构化查询语言。

它用来：

- 定义数据结构：建库、建表、加索引。
- 写入数据：插入、更新、删除。
- 查询数据：过滤、排序、分组、聚合、关联。
- 控制事务：提交、回滚。
- 管理权限：创建用户、授权。

### MySQL 是什么

MySQL 是关系型数据库管理系统。

你可以把它理解成一个长期运行的服务：

```text
client
  -> sends SQL
  -> MySQL Server
  -> parser / optimizer / executor
  -> storage engine
  -> data files and logs
```

客户端可以是：

- `mysql` 命令行。
- Python 程序。
- Java 程序。
- FastAPI 后端。
- DBeaver、DataGrip 等图形工具。

### 关系型数据库是什么

关系型数据库把数据组织成表。

```text
database: aiops_lab
  table: alerts
    row: 一条告警
    column: service_name / severity / created_at
```

“关系”不只是表格，而是表和表之间可以通过键关联：

```text
alerts.service_name
  -> services.name

alerts.incident_id
  -> incidents.id

runbook_executions.alert_id
  -> alerts.id
```

这就是为什么 SQL 能回答“告警是否和事故、变更、runbook 有关”。

## MySQL 架构

一个简化架构：

```text
mysql client
  -> TCP 3306 / socket
  -> MySQL Server
      -> connection manager
      -> SQL parser
      -> optimizer
      -> executor
      -> storage engine API
      -> InnoDB
          -> buffer pool
          -> clustered index
          -> secondary indexes
          -> redo log
          -> undo log
          -> data files
```

| 组件 | 是什么 | 为什么要懂 |
|---|---|---|
| client | 发 SQL 的程序 | 你用 `mysql`、Python、FastAPI 都是客户端 |
| connection | 客户端和 server 的连接 | 连接打满会导致应用连不上 |
| parser | 解析 SQL | 语法错误在这里失败 |
| optimizer | 选择执行计划 | 索引是否使用由它决定 |
| executor | 执行计划 | 真的读写数据 |
| storage engine | 存储引擎接口 | MySQL 可以支持不同引擎 |
| InnoDB | 默认存储引擎 | 事务、行锁、崩溃恢复核心 |
| buffer pool | InnoDB 内存缓存 | 性能关键 |
| redo log | 重做日志 | 崩溃恢复已提交事务 |
| undo log | 回滚日志 | 支持 rollback 和 MVCC |

## 安装和连接

### Docker 实验环境

适合学习，删除容器就能重来。

```bash
docker run -d --name aiops-mysql \
  -e MYSQL_ROOT_PASSWORD=aiops_root_pwd \
  -e MYSQL_DATABASE=aiops_lab \
  -e MYSQL_USER=aiops \
  -e MYSQL_PASSWORD=aiops_pwd \
  -p 3306:3306 \
  mysql:8.4
```

进入容器内连接：

```bash
docker exec -it aiops-mysql mysql -uaiops -paiops_pwd aiops_lab
```

从宿主机连接：

```bash
mysql -h 127.0.0.1 -P 3306 -u aiops -p aiops_lab
```

参数解释：

| 参数 | 意思 |
|---|---|
| `-h` | 主机地址 |
| `-P` | 端口，MySQL 默认 3306 |
| `-u` | 用户名 |
| `-p` | 提示输入密码 |
| `aiops_lab` | 连接后默认使用的数据库 |

### 连接后先看什么

```sql
SELECT VERSION();
SELECT USER();
SELECT DATABASE();
SHOW DATABASES;
SHOW TABLES;
```

含义：

| SQL | 作用 |
|---|---|
| `SELECT VERSION()` | 查看 MySQL 版本 |
| `SELECT USER()` | 查看当前登录用户 |
| `SELECT DATABASE()` | 查看当前选择的数据库 |
| `SHOW DATABASES` | 列出数据库 |
| `SHOW TABLES` | 列出当前库的表 |

## 第一个 AIOps 数据库实验

### 创建数据库

```sql
CREATE DATABASE IF NOT EXISTS aiops_lab
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE aiops_lab;
```

为什么要 `USE`？

`CREATE DATABASE` 只是创建库，不代表后续 SQL 自动在这个库里执行。`USE aiops_lab` 才是选择当前库。

### 创建告警表

```sql
CREATE TABLE alerts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  service_name VARCHAR(100) NOT NULL,
  instance VARCHAR(100) NOT NULL,
  severity ENUM('info', 'warning', 'critical') NOT NULL,
  alert_name VARCHAR(200) NOT NULL,
  metric_name VARCHAR(100),
  metric_value DOUBLE,
  status ENUM('firing', 'resolved') NOT NULL DEFAULT 'firing',
  created_at DATETIME NOT NULL,
  resolved_at DATETIME NULL,
  INDEX idx_alerts_service_time (service_name, created_at),
  INDEX idx_alerts_severity_time (severity, created_at),
  INDEX idx_alerts_status_time (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

字段解释：

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | `BIGINT` | 主键，唯一标识一条告警 |
| `service_name` | `VARCHAR(100)` | 服务名 |
| `instance` | `VARCHAR(100)` | 主机、Pod 或实例 |
| `severity` | `ENUM` | 严重级别 |
| `alert_name` | `VARCHAR(200)` | 告警名称 |
| `metric_name` | `VARCHAR(100)` | 触发告警的指标 |
| `metric_value` | `DOUBLE` | 触发时指标值 |
| `status` | `ENUM` | firing 或 resolved |
| `created_at` | `DATETIME` | 触发时间 |
| `resolved_at` | `DATETIME NULL` | 恢复时间，未恢复时为空 |

为什么要索引？

- 按服务和时间查：`idx_alerts_service_time`。
- 按严重级别和时间查：`idx_alerts_severity_time`。
- 查未恢复告警：`idx_alerts_status_time`。

### 插入样例数据

```sql
INSERT INTO alerts
  (service_name, instance, severity, alert_name, metric_name, metric_value, status, created_at, resolved_at)
VALUES
  ('order-api', '10.0.1.11', 'critical', 'HighErrorRate', 'http_5xx_rate', 0.23, 'resolved', '2026-07-01 09:10:00', '2026-07-01 09:25:00'),
  ('order-api', '10.0.1.12', 'warning', 'HighLatency', 'p95_latency_ms', 1200, 'firing', '2026-07-01 10:05:00', NULL),
  ('payment-api', '10.0.2.21', 'critical', 'DatabaseConnectionError', 'db_conn_errors', 35, 'resolved', '2026-07-01 10:12:00', '2026-07-01 10:40:00'),
  ('gateway', '10.0.0.8', 'info', 'TrafficSpike', 'request_per_second', 4200, 'resolved', '2026-07-01 11:00:00', '2026-07-01 11:05:00');
```

### 查询所有告警

```sql
SELECT *
FROM alerts;
```

`*` 表示返回所有列。学习阶段可以用，生产查询和接口里建议明确列名。

### 查询严重告警

```sql
SELECT service_name, instance, alert_name, created_at
FROM alerts
WHERE severity = 'critical'
ORDER BY created_at DESC;
```

含义：

- `FROM alerts`：从告警表取数据。
- `WHERE severity = 'critical'`：只保留 critical。
- `ORDER BY created_at DESC`：按时间倒序。

### 按服务统计告警量

```sql
SELECT service_name, COUNT(*) AS alert_count
FROM alerts
GROUP BY service_name
ORDER BY alert_count DESC;
```

这回答的是：哪个服务告警最多。

### 计算恢复分钟数

```sql
SELECT
  service_name,
  alert_name,
  TIMESTAMPDIFF(MINUTE, created_at, resolved_at) AS mttr_minutes
FROM alerts
WHERE resolved_at IS NOT NULL;
```

`TIMESTAMPDIFF` 用来计算两个时间之间的差值。这里可以粗略表示告警恢复时长。

## SQL 语句分类

| 类别 | 名称 | 用途 | 常见语句 |
|---|---|---|---|
| DDL | Data Definition Language | 定义结构 | `CREATE`、`ALTER`、`DROP` |
| DML | Data Manipulation Language | 修改数据 | `INSERT`、`UPDATE`、`DELETE` |
| DQL | Data Query Language | 查询数据 | `SELECT` |
| TCL | Transaction Control Language | 控制事务 | `START TRANSACTION`、`COMMIT`、`ROLLBACK` |
| DCL | Data Control Language | 权限控制 | `CREATE USER`、`GRANT`、`REVOKE` |
| Utility | 工具/管理 | 查看状态 | `SHOW`、`EXPLAIN`、`DESCRIBE` |

### DDL

```sql
CREATE DATABASE aiops_lab;
CREATE TABLE alerts (...);
ALTER TABLE alerts ADD COLUMN owner VARCHAR(100);
DROP TABLE alerts;
```

DDL 改结构，风险通常比普通查询高。生产环境执行前要确认备份、变更窗口和回滚方案。

### DML

```sql
INSERT INTO alerts (...) VALUES (...);

UPDATE alerts
SET status = 'resolved'
WHERE id = 1;

DELETE FROM alerts
WHERE id = 1;
```

生产执行 `UPDATE` / `DELETE` 前，先把同样条件写成 `SELECT` 看影响范围：

```sql
SELECT *
FROM alerts
WHERE id = 1;
```

### DQL

```sql
SELECT service_name, COUNT(*) AS alert_count
FROM alerts
WHERE created_at >= NOW() - INTERVAL 1 DAY
GROUP BY service_name
HAVING COUNT(*) >= 10
ORDER BY alert_count DESC
LIMIT 10;
```

查询逻辑顺序可以这样记：

```text
FROM
  -> WHERE
  -> GROUP BY
  -> HAVING
  -> SELECT
  -> ORDER BY
  -> LIMIT
```

虽然 SQL 写的时候 `SELECT` 在最前面，但理解查询时要从 `FROM` 开始。

## 数据类型

设计表时，字段类型就是数据契约。类型选错，会影响存储、查询、排序、索引和业务含义。

### 数值类型

| 类型 | 适合 | AIOps 例子 |
|---|---|---|
| `TINYINT` | 很小整数 | 布尔标记、等级 |
| `INT` | 普通整数 | 重试次数、端口 |
| `BIGINT` | 大整数 | 主键、事件 ID |
| `DECIMAL(p,s)` | 精确小数 | 金额、精确比例 |
| `FLOAT` / `DOUBLE` | 浮点数 | 指标值、延迟、CPU 使用率 |

告警指标值通常可以用 `DOUBLE`：

```sql
metric_value DOUBLE
```

金额不要用 `DOUBLE`，因为浮点有精度问题，应使用 `DECIMAL`。

### 字符串类型

| 类型 | 适合 | AIOps 例子 |
|---|---|---|
| `CHAR(n)` | 固定长度 | 固定编码 |
| `VARCHAR(n)` | 可变长度短文本 | 服务名、实例名、告警名 |
| `TEXT` | 长文本 | 错误堆栈、备注 |
| `JSON` | JSON 文档 | 原始告警 payload、扩展字段 |

服务名用 `VARCHAR`：

```sql
service_name VARCHAR(100) NOT NULL
```

原始告警可以用 `JSON`：

```sql
raw_payload JSON
```

注意：不是所有数据都应该塞进 JSON。经常过滤、分组、关联的字段，要拆成普通列。

### 日期时间类型

| 类型 | 适合 |
|---|---|
| `DATE` | 日期 |
| `TIME` | 时间 |
| `DATETIME` | 日期时间，不随时区转换 |
| `TIMESTAMP` | 时间戳，和时区转换有关 |

AIOps 事件时间建议统一：

- 存 UTC。
- 字段名明确：`created_at`、`started_at`、`resolved_at`。
- 展示时再转本地时区。

### NULL

`NULL` 表示未知、无值或不适用。

例如未恢复告警：

```sql
resolved_at DATETIME NULL
```

查询 `NULL` 必须用：

```sql
WHERE resolved_at IS NULL
```

不能写：

```sql
WHERE resolved_at = NULL
```

### DEFAULT

默认值：

```sql
status ENUM('firing', 'resolved') NOT NULL DEFAULT 'firing'
```

含义：插入时不指定 `status`，默认就是 `firing`。

## SELECT 深讲

### WHERE

`WHERE` 在分组前过滤行。

```sql
SELECT *
FROM alerts
WHERE severity = 'critical'
  AND created_at >= '2026-07-01 00:00:00';
```

常用条件：

| 写法 | 意思 |
|---|---|
| `=` | 等于 |
| `<>` 或 `!=` | 不等于 |
| `>`、`>=`、`<`、`<=` | 大小比较 |
| `BETWEEN a AND b` | 范围 |
| `IN (...)` | 在列表中 |
| `LIKE` | 模糊匹配 |
| `IS NULL` | 是空值 |
| `AND` | 同时满足 |
| `OR` | 满足任一 |

### ORDER BY

排序：

```sql
SELECT service_name, alert_name, created_at
FROM alerts
ORDER BY created_at DESC;
```

`DESC` 是倒序，`ASC` 是正序。

### LIMIT

限制返回行数：

```sql
SELECT *
FROM alerts
ORDER BY created_at DESC
LIMIT 10;
```

在运维排查中，`LIMIT` 很有用，因为你通常先看最新或最严重的少量记录。

### GROUP BY

分组统计：

```sql
SELECT service_name, COUNT(*) AS alert_count
FROM alerts
GROUP BY service_name;
```

`GROUP BY service_name` 的意思是：把相同服务的行放成一组，再对每组计算 `COUNT(*)`。

### 聚合函数

| 函数 | 作用 | 例子 |
|---|---|---|
| `COUNT(*)` | 行数 | 告警数 |
| `SUM(x)` | 求和 | 请求总数 |
| `AVG(x)` | 平均值 | 平均恢复时长 |
| `MIN(x)` | 最小值 | 最早触发时间 |
| `MAX(x)` | 最大值 | 最高错误率 |

### HAVING

`HAVING` 在分组后过滤组。

```sql
SELECT service_name, COUNT(*) AS alert_count
FROM alerts
GROUP BY service_name
HAVING COUNT(*) >= 2;
```

区别：

| 子句 | 过滤对象 | 发生时机 |
|---|---|---|
| `WHERE` | 行 | 分组前 |
| `HAVING` | 组 | 分组后 |

### CASE

`CASE` 可以在查询里做分类：

```sql
SELECT
  service_name,
  alert_name,
  CASE
    WHEN severity = 'critical' THEN 'page_oncall'
    WHEN severity = 'warning' THEN 'create_ticket'
    ELSE 'record_only'
  END AS action_hint
FROM alerts;
```

AIOps 用法：把告警级别映射成处理策略。

## JOIN 深讲

只会查一张表还不够。AIOps 的关键是关联。

### 准备变更表

```sql
CREATE TABLE deployments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  service_name VARCHAR(100) NOT NULL,
  version VARCHAR(100) NOT NULL,
  commit_sha VARCHAR(100) NOT NULL,
  environment VARCHAR(50) NOT NULL,
  deployed_at DATETIME NOT NULL,
  status ENUM('success', 'failed', 'rolled_back') NOT NULL,
  INDEX idx_deployments_service_time (service_name, deployed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

插入样例：

```sql
INSERT INTO deployments
  (service_name, version, commit_sha, environment, deployed_at, status)
VALUES
  ('order-api', '1.4.2', 'abc1234', 'production', '2026-07-01 08:55:00', 'success'),
  ('payment-api', '2.1.0', 'def5678', 'production', '2026-07-01 10:00:00', 'success');
```

### INNER JOIN

查告警和同服务发布：

```sql
SELECT
  a.service_name,
  a.alert_name,
  a.created_at,
  d.version,
  d.deployed_at
FROM alerts AS a
JOIN deployments AS d
  ON a.service_name = d.service_name;
```

`JOIN` 默认是 inner join：只有两边都匹配的记录才返回。

### 时间窗口关联

查告警前 30 分钟内是否有发布：

```sql
SELECT
  a.service_name,
  a.alert_name,
  a.created_at,
  d.version,
  d.commit_sha,
  d.deployed_at
FROM alerts AS a
JOIN deployments AS d
  ON a.service_name = d.service_name
 AND d.environment = 'production'
 AND d.deployed_at BETWEEN a.created_at - INTERVAL 30 MINUTE AND a.created_at
WHERE a.severity = 'critical';
```

这是 AIOps 里非常有用的查询：把告警和近期变更关联起来。

### LEFT JOIN

查所有告警，即使没有匹配发布也返回：

```sql
SELECT
  a.id,
  a.service_name,
  a.alert_name,
  d.version
FROM alerts AS a
LEFT JOIN deployments AS d
  ON a.service_name = d.service_name
 AND d.deployed_at BETWEEN a.created_at - INTERVAL 30 MINUTE AND a.created_at;
```

如果 `d.version` 是 `NULL`，说明没有匹配到发布。

### JOIN 常见坑

- 忘写 `ON` 条件会导致笛卡尔积，结果行数暴涨。
- 关联字段类型不一致会影响性能。
- 关联时间窗口太大，可能匹配无关变更。
- `LEFT JOIN` 后在 `WHERE` 里过滤右表字段，可能把结果变回 inner join。

## 子查询和 CTE

### 子查询

查告警数超过平均值的服务：

```sql
SELECT service_name, COUNT(*) AS alert_count
FROM alerts
GROUP BY service_name
HAVING COUNT(*) > (
  SELECT AVG(service_alerts.alert_count)
  FROM (
    SELECT service_name, COUNT(*) AS alert_count
    FROM alerts
    GROUP BY service_name
  ) AS service_alerts
);
```

### CTE

CTE 用 `WITH` 把中间结果命名，让复杂查询更可读：

```sql
WITH service_alerts AS (
  SELECT service_name, COUNT(*) AS alert_count
  FROM alerts
  GROUP BY service_name
)
SELECT *
FROM service_alerts
ORDER BY alert_count DESC;
```

AIOps 报表查询通常会越来越复杂，CTE 能让查询像分步骤推理。

## 索引

索引是数据库为了加快查找而维护的数据结构。

没有索引时，查询可能扫描整张表：

```sql
SELECT *
FROM alerts
WHERE service_name = 'order-api';
```

有索引时，数据库可以更快定位相关行：

```sql
CREATE INDEX idx_alerts_service ON alerts(service_name);
```

### 主键索引

```sql
id BIGINT PRIMARY KEY AUTO_INCREMENT
```

主键特点：

- 唯一。
- 不能为 `NULL`。
- 一张表只能有一个主键。
- InnoDB 会按主键组织数据，称为聚簇索引。

### 二级索引

```sql
CREATE INDEX idx_alerts_service_time
ON alerts(service_name, created_at);
```

这种索引用于：

```sql
WHERE service_name = 'order-api'
  AND created_at >= '2026-07-01 00:00:00'
```

### 最左前缀

复合索引 `(service_name, created_at)` 适合：

```sql
WHERE service_name = 'order-api'
WHERE service_name = 'order-api' AND created_at >= ...
```

不太适合只按 `created_at` 查：

```sql
WHERE created_at >= '2026-07-01 00:00:00'
```

如果经常按时间查全局告警，应单独建：

```sql
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
```

### 覆盖索引

如果查询需要的列都在索引里，数据库可能不用回表。

```sql
CREATE INDEX idx_alerts_service_severity_time
ON alerts(service_name, severity, created_at);

SELECT service_name, severity, created_at
FROM alerts
WHERE service_name = 'order-api';
```

### 索引不是越多越好

索引会提高读查询速度，但也有代价：

- 插入要维护索引。
- 更新索引列要维护索引。
- 删除要维护索引。
- 索引占磁盘。
- 过多索引会让优化器选择更复杂。

经验：

- 给高频过滤、排序、关联字段建索引。
- 给低选择性字段单独建索引要谨慎。
- 用 `EXPLAIN` 验证索引是否被使用。

## EXPLAIN 和执行计划

`EXPLAIN` 用来看 MySQL 打算怎么执行查询。

```sql
EXPLAIN
SELECT *
FROM alerts
WHERE service_name = 'order-api'
  AND created_at >= '2026-07-01 00:00:00';
```

常看字段：

| 字段 | 意思 | 怎么理解 |
|---|---|---|
| `table` | 访问哪张表 | 多表查询时很重要 |
| `type` | 访问类型 | `ALL` 通常表示全表扫描 |
| `possible_keys` | 可能使用的索引 | 候选索引 |
| `key` | 实际使用的索引 | 为空说明没用索引 |
| `rows` | 估算扫描行数 | 越大越可能慢 |
| `Extra` | 额外信息 | filesort、temporary 等要关注 |

常见判断：

```text
type = ALL
  -> 可能全表扫描

key = NULL
  -> 没有用索引

rows 很大
  -> 扫描数据太多

Extra 有 Using filesort
  -> 排序可能额外耗时
```

排查慢 SQL 时，不要凭感觉加索引。先看 `EXPLAIN`。

## 事务

事务用于保证一组操作要么都成功，要么都失败。

例如把告警标记为恢复，同时插入一条处理事件：

```sql
START TRANSACTION;

UPDATE alerts
SET status = 'resolved',
    resolved_at = NOW()
WHERE id = 2;

INSERT INTO alert_events(alert_id, event_type, message, created_at)
VALUES (2, 'resolved', 'manual resolved by oncall', NOW());

COMMIT;
```

如果中间发现不对：

```sql
ROLLBACK;
```

### ACID

| 字母 | 含义 | 运维理解 |
|---|---|---|
| A | Atomicity 原子性 | 一组操作整体成功或整体失败 |
| C | Consistency 一致性 | 数据满足约束 |
| I | Isolation 隔离性 | 并发事务互相隔离 |
| D | Durability 持久性 | 提交后崩溃也能恢复 |

### autocommit

MySQL 默认通常是自动提交：

```sql
SELECT @@autocommit;
```

如果 `autocommit = 1`，每条单独语句执行后自动提交。

显式事务用：

```sql
START TRANSACTION;
...
COMMIT;
```

### 隔离级别

InnoDB 支持不同事务隔离级别。初学先理解四个名字：

| 隔离级别 | 简单理解 |
|---|---|
| READ UNCOMMITTED | 可能读到别人未提交的数据 |
| READ COMMITTED | 只能读到已提交数据 |
| REPEATABLE READ | 同一事务内多次读结果保持一致，MySQL InnoDB 默认常用 |
| SERIALIZABLE | 最严格，并发最低 |

查看当前隔离级别：

```sql
SELECT @@transaction_isolation;
```

### 锁

锁是为了并发下保护数据。

常见：

| 锁 | 含义 |
|---|---|
| shared lock | 共享锁，允许读 |
| exclusive lock | 排他锁，写入时使用 |
| record lock | 锁索引记录 |
| gap lock | 锁索引记录之间的间隙 |
| next-key lock | record lock + gap lock |

初学不必一下子背完所有锁，但要知道：

- 事务不提交可能一直持有锁。
- 慢事务会阻塞其他写入。
- 索引会影响锁范围。
- 死锁不是数据库坏了，是并发事务互相等待。

### 死锁

两个事务互相等对方释放锁，就可能死锁。

查看最近死锁：

```sql
SHOW ENGINE INNODB STATUS\G
```

常见处理：

- 让事务尽量短。
- 多个事务按固定顺序更新表。
- 给查询条件加合适索引。
- 捕获死锁错误后重试。

## InnoDB 深讲

InnoDB 是 MySQL 默认存储引擎，也是学习 MySQL 必须理解的核心。

### 为什么需要存储引擎

MySQL Server 负责解析和执行 SQL，存储引擎负责真正存数据。

```text
SQL layer
  -> parse / optimize / execute
storage engine layer
  -> read/write rows
```

InnoDB 提供：

- 事务。
- 行级锁。
- 外键。
- 崩溃恢复。
- MVCC。
- 聚簇索引。

### Buffer Pool

Buffer Pool 是 InnoDB 用来缓存数据页和索引页的内存区域。

读数据时：

```text
query
  -> check buffer pool
  -> if page exists, read from memory
  -> if not, read from disk into buffer pool
```

生产调优里 `innodb_buffer_pool_size` 很重要。

查看：

```sql
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
```

### 聚簇索引

InnoDB 表数据按主键组织。主键索引的叶子节点里存整行数据，这叫聚簇索引。

简单理解：

```text
primary key index
  -> contains full row data
```

二级索引叶子节点通常保存二级索引键和主键值，再通过主键找到整行。

所以主键设计很重要：

- 稳定。
- 尽量短。
- 唯一。
- 不频繁更新。

### Redo Log

redo log 用于崩溃恢复。

事务提交后，即使数据页还没完全写回磁盘，也可以通过 redo log 恢复已提交修改。

简单理解：

```text
commit
  -> write redo log
  -> later flush dirty pages
```

### Undo Log

undo log 用于回滚和 MVCC。

如果事务执行后需要回滚，InnoDB 通过 undo 信息撤销修改。

MVCC 也依赖 undo，让读事务看到合适版本的数据。

### MVCC

MVCC 是 Multi-Version Concurrency Control，多版本并发控制。

它让读写可以更好并发：

```text
writer updates row
reader can still read an older committed version
```

这就是为什么很多查询不会简单地阻塞写入。

## 用户和权限

数据库权限是生产安全的基本线。

### 创建用户

```sql
CREATE USER 'aiops_app'@'%' IDENTIFIED BY 'change_me';
```

含义：

| 片段 | 意思 |
|---|---|
| `'aiops_app'` | 用户名 |
| `'%'` | 允许从任意主机连接 |
| `IDENTIFIED BY` | 设置密码 |

学习环境可以用 `%`，生产环境应尽量限制来源主机。

### 授权

```sql
GRANT SELECT, INSERT, UPDATE
ON aiops_lab.*
TO 'aiops_app'@'%';
```

含义：允许这个用户对 `aiops_lab` 库里的所有表执行查询、插入、更新。

不要给应用账号 `ALL PRIVILEGES`，更不要让应用直接用 root。

### 查看权限

```sql
SHOW GRANTS FOR 'aiops_app'@'%';
```

### 回收权限

```sql
REVOKE UPDATE
ON aiops_lab.*
FROM 'aiops_app'@'%';
```

AIOps 项目建议：

- collector 账号只需要写入告警和事件。
- dashboard 账号只需要读取。
- migration 账号单独管理结构变更。
- 备份账号只给备份需要的权限。

## 配置和状态

### 查看变量

```sql
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'character_set_server';
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'slow_query_log';
```

常见配置：

| 配置 | 意思 | AIOps 关注点 |
|---|---|---|
| `port` | 服务端口 | 默认 3306 |
| `max_connections` | 最大连接数 | 连接池设置不能乱配 |
| `character_set_server` | 默认字符集 | 建议 utf8mb4 |
| `innodb_buffer_pool_size` | InnoDB 缓存 | 影响性能 |
| `slow_query_log` | 慢查询日志 | 排查性能 |
| `long_query_time` | 慢查询阈值 | 实验可设小 |

### 查看连接

```sql
SHOW PROCESSLIST;
```

它能看到：

- 当前连接。
- 执行的 SQL。
- 状态。
- 执行时间。

如果应用连不上，常看：

```sql
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';
```

### 查看表结构

```sql
DESCRIBE alerts;
SHOW CREATE TABLE alerts\G
```

`DESCRIBE` 看字段概要，`SHOW CREATE TABLE` 看完整建表语句。

## 备份和恢复

没有备份的数据库，谈不上可靠。

### mysqldump 备份

```bash
mysqldump -h 127.0.0.1 -u root -p aiops_lab > aiops_lab.sql
```

含义：

- 连接 MySQL。
- 导出 `aiops_lab` 数据库。
- 保存到 SQL 文件。

### 恢复

```bash
mysql -h 127.0.0.1 -u root -p aiops_lab < aiops_lab.sql
```

### 只备份某张表

```bash
mysqldump -u root -p aiops_lab alerts > alerts.sql
```

### 备份注意事项

- 备份要定期演练恢复。
- 只备份不验证，等于没有备份。
- 生产大库要考虑锁、耗时、一致性和备份工具。
- binlog 可以用于时间点恢复，但初学先理解概念即可。

## 慢查询

慢查询是 MySQL 排障重点。

### 打开慢查询日志

学习环境可以这样查看和设置：

```sql
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';
```

临时打开：

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

生产环境改全局参数要按变更流程。

### 慢查询排查流程

```text
发现接口慢
  -> 找到慢 SQL
  -> EXPLAIN 看执行计划
  -> 看是否全表扫描
  -> 看索引是否合适
  -> 看返回行数是否太大
  -> 看是否锁等待
  -> 优化 SQL / 索引 / 数据模型
```

### 常见慢 SQL 原因

| 原因 | 例子 | 修复方向 |
|---|---|---|
| 没有索引 | 按 `service_name` 查但没索引 | 建索引 |
| 索引失效 | 对索引列做函数 | 改 SQL |
| 返回太多 | 不加时间范围 | 加过滤和分页 |
| 排序昂贵 | 大结果集 `ORDER BY` | 索引或减少结果 |
| JOIN 爆炸 | 关联条件错误 | 修 `ON` 条件 |
| 锁等待 | 长事务未提交 | 查事务和锁 |

## AIOps 数据建模

一个实用的 AIOps 小库可以这样设计：

```text
services
  -> alerts
  -> incidents
  -> deployments
  -> runbook_executions
  -> feedback_labels
```

### services

```sql
CREATE TABLE services (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  service_name VARCHAR(100) NOT NULL UNIQUE,
  owner_team VARCHAR(100) NOT NULL,
  tier ENUM('core', 'normal', 'internal') NOT NULL DEFAULT 'normal',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### incidents

```sql
CREATE TABLE incidents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  incident_key VARCHAR(100) NOT NULL UNIQUE,
  service_name VARCHAR(100) NOT NULL,
  severity ENUM('sev1', 'sev2', 'sev3') NOT NULL,
  title VARCHAR(200) NOT NULL,
  started_at DATETIME NOT NULL,
  resolved_at DATETIME NULL,
  root_cause_type VARCHAR(100),
  INDEX idx_incidents_service_time (service_name, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### runbook_executions

```sql
CREATE TABLE runbook_executions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  alert_id BIGINT NOT NULL,
  runbook_name VARCHAR(200) NOT NULL,
  automation_level ENUM('L0', 'L1', 'L2', 'L3', 'L4') NOT NULL,
  status ENUM('queued', 'running', 'succeeded', 'failed', 'cancelled') NOT NULL,
  started_at DATETIME NOT NULL,
  finished_at DATETIME NULL,
  summary TEXT,
  INDEX idx_runbook_alert (alert_id),
  INDEX idx_runbook_status_time (status, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### feedback_labels

```sql
CREATE TABLE feedback_labels (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  alert_id BIGINT NOT NULL,
  label ENUM('true_positive', 'noise', 'duplicate', 'unknown') NOT NULL,
  labeled_by VARCHAR(100) NOT NULL,
  labeled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT,
  INDEX idx_feedback_alert (alert_id),
  INDEX idx_feedback_label_time (label, labeled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

这些表可以支持：

- 告警治理。
- 事故复盘。
- 变更关联。
- runbook 效果评估。
- 机器学习标签数据。

## AIOps 常用 SQL

### 最近 24 小时告警最多的服务

```sql
SELECT service_name, COUNT(*) AS alert_count
FROM alerts
WHERE created_at >= NOW() - INTERVAL 1 DAY
GROUP BY service_name
ORDER BY alert_count DESC
LIMIT 10;
```

### 平均恢复时长

```sql
SELECT
  service_name,
  AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) AS avg_mttr_minutes
FROM alerts
WHERE resolved_at IS NOT NULL
GROUP BY service_name
ORDER BY avg_mttr_minutes DESC;
```

### 仍在触发的 critical 告警

```sql
SELECT id, service_name, instance, alert_name, created_at
FROM alerts
WHERE severity = 'critical'
  AND status = 'firing'
ORDER BY created_at ASC;
```

### 告警前 30 分钟内的发布

```sql
SELECT
  a.id AS alert_id,
  a.service_name,
  a.alert_name,
  a.created_at AS alert_time,
  d.version,
  d.commit_sha,
  d.deployed_at
FROM alerts AS a
LEFT JOIN deployments AS d
  ON a.service_name = d.service_name
 AND d.environment = 'production'
 AND d.deployed_at BETWEEN a.created_at - INTERVAL 30 MINUTE AND a.created_at
WHERE a.severity = 'critical';
```

### 噪声告警比例

```sql
SELECT
  f.label,
  COUNT(*) AS label_count
FROM feedback_labels AS f
GROUP BY f.label
ORDER BY label_count DESC;
```

### Runbook 成功率

```sql
SELECT
  runbook_name,
  COUNT(*) AS total_runs,
  SUM(status = 'succeeded') AS succeeded_runs,
  ROUND(SUM(status = 'succeeded') / COUNT(*) * 100, 2) AS success_rate_percent
FROM runbook_executions
GROUP BY runbook_name
ORDER BY success_rate_percent DESC;
```

在 MySQL 中，布尔表达式为真可当作 1，假可当作 0，所以 `SUM(status = 'succeeded')` 可以统计成功次数。

## 常用命令字典

### mysql

```bash
mysql -h 127.0.0.1 -P 3306 -u aiops -p aiops_lab
```

作用：连接 MySQL。

### mysql -e

```bash
mysql -h 127.0.0.1 -u aiops -p -e "SHOW DATABASES;"
```

作用：从命令行执行一条 SQL，适合脚本。

### 批量执行 SQL 文件

```bash
mysql -u aiops -p aiops_lab < schema.sql
mysql -u aiops -p aiops_lab < seed.sql
mysql -u aiops -p aiops_lab < queries.sql
```

作用：导入建表、样例数据和查询。

### mysqldump

```bash
mysqldump -u root -p aiops_lab > aiops_lab.sql
```

作用：逻辑备份。

### mysqladmin ping

```bash
mysqladmin -h 127.0.0.1 -u root -p ping
```

作用：检查 MySQL server 是否响应。

### SHOW DATABASES

```sql
SHOW DATABASES;
```

作用：列出数据库。

### SHOW TABLES

```sql
SHOW TABLES;
```

作用：列出当前库的表。

### DESCRIBE

```sql
DESCRIBE alerts;
```

作用：查看表字段。

### SHOW CREATE TABLE

```sql
SHOW CREATE TABLE alerts\G
```

作用：查看完整建表语句。

### EXPLAIN

```sql
EXPLAIN SELECT * FROM alerts WHERE service_name = 'order-api';
```

作用：查看执行计划。

### SHOW PROCESSLIST

```sql
SHOW PROCESSLIST;
```

作用：查看当前连接和正在执行的 SQL。

### SHOW ENGINE INNODB STATUS

```sql
SHOW ENGINE INNODB STATUS\G
```

作用：查看 InnoDB 状态，常用于死锁和锁等待排查。

## 入门实验：告警分析数据库

目标：做一个可以放进 GitHub 的 MySQL / SQL 小项目。

目录：

```text
projects/mysql-alert-analysis/
  README.md
  docker-compose.yml
  schema.sql
  seed.sql
  queries.sql
  screenshots/
```

### docker-compose.yml

```yaml
services:
  mysql:
    image: mysql:8.4
    container_name: aiops-mysql
    environment:
      MYSQL_ROOT_PASSWORD: aiops_root_pwd
      MYSQL_DATABASE: aiops_lab
      MYSQL_USER: aiops
      MYSQL_PASSWORD: aiops_pwd
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

启动：

```bash
docker compose up -d
```

导入：

```bash
mysql -h 127.0.0.1 -u aiops -p aiops_lab < schema.sql
mysql -h 127.0.0.1 -u aiops -p aiops_lab < seed.sql
mysql -h 127.0.0.1 -u aiops -p aiops_lab < queries.sql
```

### README 要写什么

- 项目解决什么 AIOps 问题。
- 数据库表结构。
- 每张表的字段解释。
- 如何启动 MySQL。
- 如何导入数据。
- 每条 SQL 回答什么问题。
- 查询结果截图。
- 你从结果里得到什么结论。

## 典型故障排查表

| 现象 | 常见原因 | 怎么查 | 怎么修 |
|---|---|---|---|
| `Access denied` | 用户名、密码或来源主机不对 | 检查连接参数和 `SHOW GRANTS` | 修账号或授权 |
| `Unknown database` | 库不存在或名字错 | `SHOW DATABASES` | `CREATE DATABASE` |
| `Table already exists` | 表已存在 | `SHOW TABLES` | 用 `IF NOT EXISTS` 或确认后 drop |
| `Unknown column` | 字段名写错 | `DESCRIBE table` | 修字段名 |
| `Duplicate entry` | 主键或唯一键冲突 | 看报错键名 | 改数据或唯一约束 |
| 查询慢 | 没索引或返回太多 | `EXPLAIN` | 加索引、加过滤 |
| 连接打满 | 连接池过大或慢查询 | `SHOW PROCESSLIST` | 调连接池、修慢 SQL |
| 锁等待 | 长事务未提交 | `SHOW PROCESSLIST`、InnoDB status | 提交/回滚长事务 |
| 死锁 | 事务互相等待 | InnoDB status | 固定更新顺序、重试 |
| 磁盘满 | 数据、binlog、日志增长 | 查磁盘和 MySQL 目录 | 清理、扩容、调整保留 |
| 字符乱码 | 字符集不一致 | `SHOW VARIABLES LIKE 'character%'` | 使用 utf8mb4 |

## 排障流程

### 连接失败

```text
确认 MySQL 是否运行
  -> 确认 host/port
  -> 确认用户名密码
  -> 确认用户 host 匹配
  -> 确认权限
  -> 查看 MySQL error log
```

### 查询慢

```text
找到 SQL
  -> EXPLAIN
  -> 看是否全表扫描
  -> 看 rows 估算
  -> 看 key 是否为空
  -> 看是否排序/临时表
  -> 调整索引或 SQL
```

### 写入卡住

```text
SHOW PROCESSLIST
  -> 找等待连接
  -> 找长事务
  -> 看 InnoDB status
  -> 判断锁等待或死锁
```

## MySQL 和其他系统的边界

| 系统 | 适合 | 不适合 |
|---|---|---|
| MySQL | 结构化事实、关系查询、事务 | 原始高频指标、全文日志、向量检索 |
| Redis | 缓存、计数器、队列、短期状态 | 强事务复杂分析 |
| Kafka | 流式事件、解耦、削峰 | 直接做复杂查询 |
| Prometheus | 时序指标和告警 | 工单、审批、人工反馈 |
| Loki/Elasticsearch | 日志检索 | 强关系事务 |
| 向量数据库 | embedding 相似检索 | 结构化事务数据 |

## 面试怎么讲

可以这样讲：

MySQL 是关系型数据库，SQL 是操作和查询关系型数据的语言。在 AIOps 项目里，我会用 MySQL 保存结构化事实，比如告警、事故、发布、runbook 执行和人工反馈。SQL 的价值是可以用 `WHERE` 做过滤，用 `GROUP BY` 做聚合，用 `JOIN` 把告警和变更、事故、runbook 关联起来。MySQL 底层常用 InnoDB，它支持 ACID 事务、行级锁、MVCC、聚簇索引和崩溃恢复。排查性能时我会先用慢查询日志找到 SQL，再用 `EXPLAIN` 看是否走索引、扫描行数和执行计划。

## 学习检查清单

- [ ] 我能解释 MySQL 和 SQL 的区别。
- [ ] 我能解释 database、table、row、column。
- [ ] 我能使用 `mysql` 客户端连接数据库。
- [ ] 我能写 `CREATE DATABASE`、`CREATE TABLE`。
- [ ] 我能选择合适的数据类型。
- [ ] 我能写 `SELECT`、`WHERE`、`ORDER BY`、`LIMIT`。
- [ ] 我能写 `GROUP BY`、聚合函数和 `HAVING`。
- [ ] 我能写 `JOIN` 关联告警和发布。
- [ ] 我能解释主键、唯一键、普通索引、复合索引。
- [ ] 我能用 `EXPLAIN` 看执行计划。
- [ ] 我能解释事务、`COMMIT`、`ROLLBACK`。
- [ ] 我能解释 ACID。
- [ ] 我能说出 InnoDB 的 buffer pool、redo log、undo log、MVCC。
- [ ] 我能创建用户并授权。
- [ ] 我能用 `mysqldump` 做基础备份。
- [ ] 我能排查 Access denied、慢查询、锁等待。
- [ ] 我能设计 AIOps 告警表、事故表、发布表。

## 面试题

1. MySQL 和 SQL 有什么区别？
2. 关系型数据库里的表、行、列、主键分别是什么？
3. `WHERE` 和 `HAVING` 有什么区别？
4. `INNER JOIN` 和 `LEFT JOIN` 有什么区别？
5. 为什么告警表需要按服务名和时间建复合索引？
6. 什么是最左前缀？
7. 索引为什么不是越多越好？
8. `EXPLAIN` 主要看哪些字段？
9. 事务 ACID 分别是什么意思？
10. `COMMIT` 和 `ROLLBACK` 分别做什么？
11. InnoDB 为什么是 MySQL 学习重点？
12. buffer pool、redo log、undo log 分别解决什么问题？
13. MVCC 是什么？
14. 死锁是什么，如何减少？
15. 慢查询应该怎么排查？
16. MySQL、Redis、Kafka、Prometheus 分别适合保存什么数据？
17. 如何用 SQL 判断告警是否和近期发布有关？
18. AIOps 项目里 MySQL 可以保存哪些结构化事实？

## 学习证据

学完这篇，建议留下这些证据：

1. 一个 `docker-compose.yml`，能启动 MySQL 8.4。
2. 一个 `schema.sql`，包含 alerts、deployments、incidents、runbook_executions 表。
3. 一个 `seed.sql`，包含至少 20 条样例告警和发布数据。
4. 一个 `queries.sql`，包含至少 10 条 AIOps 分析 SQL。
5. 一张 `EXPLAIN` 截图或输出记录。
6. 一份慢查询排查笔记。
7. 一篇 README，解释每张表和每条 SQL 回答什么运维问题。
