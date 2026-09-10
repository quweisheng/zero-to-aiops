# MySQL / SQL

> 目标：不是只会写几条 `SELECT`，而是能理解 MySQL Server、数据库、表、行、列、索引、事务、锁、InnoDB、执行计划、权限、备份、慢查询和 AIOps 数据建模之间的关系，并能用 SQL 回答真实运维问题。

## 官方资料

零基础先理解：客户端是发请求的程序，服务端是长期保存数据的进程；关闭客户端不会自动删除数据库。表像有明确列类型的账本，行是记录，主键是身份。先学会核对当前库、当前账号和查询条件，再学修改数据。下面所有写操作只面向你新建的隔离课堂库。

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
MySQL（关系型数据库）
  -> Tutorial（入门教程）
     -> connect（建立连接）
     -> enter queries（输入查询）
     -> create database（创建数据库）
     -> create table（创建表）
     -> load data（数据）
     -> retrieve（检索） data（数据）
     -> batch（批次） mode
     -> common queries（常见查询）
  -> MySQL Programs（MySQL 工具程序）
     -> mysql client（客户端）
     -> mysqld server（数据库服务器进程）
     -> mysqladmin（管理命令工具）
     -> mysqldump（逻辑导出工具）
     -> mysqlimport（数据导入工具）
     -> mysqlshow（对象查看工具）
     -> mysqlbinlog（二进制日志查看工具）
  -> SQL（结构化查询语言） Language
     -> language structure（语言结构）
     -> data types（数据类型）
     -> functions and operators（函数与运算符）
     -> SQL（结构化查询语言） statements
       -> DDL（数据定义语言）
       -> DML（数据操作语言）
       -> transaction statements（事务语句）
       -> administration statements（管理语句）
       -> utility statements（辅助语句）
  -> Optimization（优化）
     -> indexes（索引）
     -> optimizer（优化器）
     -> EXPLAIN（查看执行计划）
     -> slow query（查询） log（日志）
  -> InnoDB（事务存储引擎）
     -> ACID（事务的原子性、一致性、隔离性与持久性）
     -> MVCC（多版本并发控制）
     -> buffer pool（缓冲池：缓存数据页与索引页）
     -> clustered index（聚簇索引：叶子页保存行数据）
     -> secondary index（辅助索引：叶子记录包含主键值）
     -> redo log（重做日志）
     -> undo log（撤销日志：支持回滚与多版本读取）
     -> locks（锁）
     -> transactions（事务）
     -> deadlocks（死锁）
  -> Administration（管理）
     -> users（用户）
     -> privileges（权限）
     -> variables（变量）
     -> backup（备份） and recovery
     -> logs（日志）
  -> Observability（可观测性）
     -> INFORMATION_SCHEMA（对象元数据视图）
     -> Performance Schema（性能观测系统库）
     -> sys schema（便于分析性能的系统视图库）
```

初学路线：

```text
mysql client（客户端）
  -> database/table/row/column（数据库、表、行、列）
  -> SELECT/WHERE/GROUP BY/JOIN（查询、筛选、分组与关联）
  -> INSERT/UPDATE/DELETE（插入、更新与删除）
  -> data types（数据类型）
  -> primary key/index（主键与主键索引）
  -> transaction（事务）
  -> EXPLAIN（查看执行计划）
  -> InnoDB（事务存储引擎）
  -> users/privileges（用户与权限）
  -> backup/slow query/troubleshooting（备份、慢查询与故障排查）
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
Alertmanager（告警管理器） / GitHub Actions / Runbook（操作手册） / Incident（故障）
  -> collector（采集器）
  -> MySQL（关系型数据库）
      alerts（告警表）
      incidents（故障表）
      deployments（部署记录表）
      runbook_executions（操作手册执行表）
      feedback_labels（反馈标签表）
  -> SQL（结构化查询语言） analysis
  -> pandas / scikit-learn（数据处理与机器学习）
  -> FastAPI dashboard（仪表盘）
  -> RAG（检索增强生成） / LLM（大语言模型） explanation（解释）
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
client（客户端）
  -> sends SQL（结构化查询语言）
  -> MySQL Server（数据库服务进程）
  -> parser / optimizer（优化器） / executor
  -> storage（存储） engine
  -> data（数据） files（文件） and logs（日志）
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
alerts.service_name（告警所属服务）
  -> services.name（服务名称）

alerts.incident_id（告警归属故障编号）
  -> incidents.id（故障主键）

runbook_executions.alert_id（执行记录中的告警编号）
  -> alerts.id（告警主键）
```

这就是为什么 SQL 能回答“告警是否和事故、变更、runbook 有关”。

## MySQL 架构

一个简化架构：

```text
mysql client（客户端）
  -> TCP 3306 / socket（TCP 端口或本地套接字）
  -> MySQL Server（数据库服务进程）
      -> connection manager（连接管理）
      -> SQL（结构化查询语言） parser
      -> optimizer（优化器）
      -> executor（语句执行器）
      -> storage（存储） engine API
      -> InnoDB（事务存储引擎）
          -> buffer pool（缓冲池）
          -> clustered index（聚簇索引）
          -> secondary indexes（二级索引）
          -> redo log（重做日志）
          -> undo log（撤销日志）
          -> data（数据） files（文件）
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

标为 Bash 的多行命令使用反斜线续行，不能原样粘贴到 PowerShell。Windows 初学者可以优先采用后面的 Compose 文件路线；单行 Docker、SQL 客户端命令则按所在终端输入。SQL 代码块要在 `mysql` 提示符里运行，不是在操作系统终端里运行。

适合学习。下面固定 `8.4.6` 作为明确的历史课堂版本，不是当前安全补丁推荐；生产必须核对支持周期与安全公告。删除容器不等于删除持久卷，重做课堂前也不能随意清理已有数据。单次容器和后面的 Compose 路线二选一，不要同时抢同名容器与端口。

```bash
docker run -d --name aiops-mysql \
  -e MYSQL_ROOT_PASSWORD=aiops_root_pwd \
  -e MYSQL_DATABASE=aiops_lab \
  -e MYSQL_USER=aiops \
  -e MYSQL_PASSWORD=aiops_pwd \
  -p 127.0.0.1:3306:3306 \
  mysql:8.4.6
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

`TIMESTAMPDIFF` 用来计算两个时间之间的差值。这里表示单条已恢复告警的持续分钟数，不是天然等同于事故平均恢复时间。样例三个已恢复告警分别为十五、二十八和五分钟；未恢复的一条必须单独统计，不能悄悄从服务质量结论中消失。

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
SELECT service_name, COUNT(*) AS alert_count -- 取服务名，并统计每个服务有多少条告警，统计结果命名为 alert_count
FROM alerts                                  -- 从 alerts 告警表中读取数据
WHERE created_at >= NOW() - INTERVAL 1 DAY   -- 只统计最近 1 天的告警，避免把很久以前的历史告警也算进去
GROUP BY service_name                        -- 按服务名分组，让每个服务单独形成一组
HAVING COUNT(*) >= 10                        -- 分组后只保留告警数大于等于 10 的服务
ORDER BY alert_count DESC                    -- 按告警数量从多到少排序，先看到最吵的服务
LIMIT 10;                                    -- 只返回前 10 个服务，适合做告警治理 TopN
```

查询逻辑顺序可以这样记：

```text
FROM       -> 先决定从哪张表读数据，这里是 alerts 告警表
  -> WHERE -> 再过滤原始行，只留下最近 1 天的告警
  -> GROUP BY -> 然后按 service_name 分组，让每个服务单独统计
  -> HAVING -> 分组后再过滤，只留下告警数不少于 10 的服务
  -> SELECT -> 选择最终要展示的列，比如服务名和告警数量
  -> ORDER BY -> 对结果排序，让告警最多的服务排在前面
  -> LIMIT -> 限制返回数量，避免结果太多不好看
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

下面是已在建表语句中出现的索引定义说明，不要在同一张课堂表重复执行同名创建语句。先用 `SHOW INDEX FROM alerts;` 核对现有索引；冗余索引也会增加写入成本。

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
type = ALL（计划显示全表扫描）
  -> 可能全表扫描

key = NULL（执行计划未选择索引）
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

前提是在新课堂库先创建处理事件表；若表名已经存在，先核对定义，不要删除重建覆盖旧内容。

```sql
CREATE TABLE alert_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  alert_id BIGINT NOT NULL,
  event_type VARCHAR(32) NOT NULL,
  message VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_alert_events_alert (alert_id)
) ENGINE=InnoDB;
```

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
| REPEATABLE READ | 普通一致性读取通常复用首次一致性读建立的快照；锁定读与本事务写入需分别理解 |
| SERIALIZABLE | 对并发读取施加更严格的串行化约束，通常增加等待成本 |

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
SQL layer（SQL 处理层）
  -> parse（解析） / optimize（优化） / execute（执行）
storage engine layer（存储引擎层）
  -> read/write rows（读写数据行）
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
query（查询）
  -> check buffer pool（检查缓冲池中是否已有目标数据页）
  -> if page exists, read from memory（缓冲池命中时直接读取内存页）
  -> if not, read from disk into buffer pool（未命中时从磁盘读取到缓冲池）
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
primary key index（主键索引）
  -> contains full row data（包含完整行数据）
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
commit（提交）
  -> write redo log（写入重做日志）
  -> later flush dirty pages（之后刷写脏页）
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

两句分别表示“写事务更新行”和“读事务仍可能看到符合快照规则的较旧已提交版本”。这里不是说所有读取都读旧值：锁定读、隔离级别和本事务自己的修改会影响可见性。地图里的 `batch mode` 是批量执行模式，`backup and recovery` 是备份与恢复，`parser` 是语法解析器。

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

只向新建、确认没有业务数据的隔离恢复库导入。恢复 SQL 可能包含删除和重建对象，绝不能把下面示例改成生产库直接试验。先由有权限的课堂管理员建立 `aiops_restore_lab`，再核对转储文件内容及目标库。

```bash
mysql -h 127.0.0.1 -u root -p aiops_restore_lab < aiops_lab.sql
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
services（服务清单）
  -> alerts（告警）
  -> incidents（故障）
  -> deployments（发布）
  -> runbook_executions（操作手册执行记录）
  -> feedback_labels（人工反馈标签）
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
SELECT service_name, COUNT(*) AS alert_count -- 取服务名，并统计每个服务最近 24 小时的告警数量
FROM alerts                                  -- 从 alerts 告警表里读取数据
WHERE created_at >= NOW() - INTERVAL 1 DAY   -- 只保留最近 1 天创建的告警
GROUP BY service_name                        -- 按服务名分组，做到每个服务一行统计结果
ORDER BY alert_count DESC                    -- 按告警数量从多到少排序
LIMIT 10;                                    -- 只展示前 10 个服务，方便快速定位告警最多的对象
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
    image: mysql:8.4.6
    container_name: aiops-mysql
    environment:
      MYSQL_ROOT_PASSWORD: aiops_root_pwd
      MYSQL_DATABASE: aiops_lab
      MYSQL_USER: aiops
      MYSQL_PASSWORD: aiops_pwd
    ports:
      - "127.0.0.1:3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

启动：

```bash
docker compose -p mysql-alert-classroom up -d
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
  -> EXPLAIN（查看执行计划）
  -> 看是否全表扫描
  -> 看 rows 估算
  -> 看 key 是否为空
  -> 看是否排序/临时表
  -> 调整索引或 SQL
```

### 写入卡住

```text
SHOW PROCESSLIST（显示会话和当前活动）
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

## 老师带你把 SQL 看成一连串筛选决定

我们要找“昨天仍未恢复、严重级别最高的服务”。先确定数据从哪张表来，再筛时间和状态，再分组统计，最后排序取前几名。SQL 的书写顺序不等于逻辑处理顺序，更不等于优化器实际执行顺序。你要能分别解释这三层，才不会看到执行计划与代码顺序不同就认为数据库出错。

`WHERE` 筛分组前的行，`HAVING` 筛聚合后的组；`COUNT(*)` 数行，`COUNT(resolved_at)` 数该列非空值。未恢复时间为 NULL，要写 `IS NULL`，不能用 `= NULL`。NULL 表示未知或不存在值，比较时涉及三值逻辑；它不是空字符串，也不是数字零。

### JOIN 为什么可能让结果翻倍

告警一行、对应三次操作记录，连接后就出现三行。此时直接 `COUNT(*)` 统计的是连接结果，不是独立告警数量。应按问题决定先聚合操作表、使用唯一键计数，或保持明细粒度。数据库没有替你决定“一个事故”的定义，SQL 正确运行不等于报表口径正确。

主键保证行身份，唯一业务键保证重试不会建立多份对象；外键约束引用关系，CHECK 约束合法取值。索引负责访问路径，不能替代业务约束。建模时把 `alerts` 原始告警、`incidents` 归并事件、`runbook_executions` 执行记录分清，避免一条重发通知被统计成一次新事故。

### 基础实验与故障注入：条件更新拒绝过期版本

在本篇教学数据库客户端中执行以下 SQL，只创建一张明确命名的实验表：

```sql
CREATE TABLE lesson_claim (
  id INT PRIMARY KEY, status VARCHAR(16) NOT NULL, version_no INT NOT NULL
) ENGINE=InnoDB;
INSERT INTO lesson_claim VALUES (1,'OPEN',1);
UPDATE lesson_claim SET status='ACKED', version_no=2 WHERE id=1 AND version_no=1;
SELECT ROW_COUNT() AS first_claim; -- 预期 1
UPDATE lesson_claim SET status='ACKED', version_no=2 WHERE id=1 AND version_no=1;
SELECT ROW_COUNT() AS stale_claim; -- 预期 0：模拟另一个客户端使用旧版本
SELECT * FROM lesson_claim;
```

第二次更新 0 行是版本保护发挥作用，恢复方式是读取当前状态并由业务决定下一步，不是去掉条件强制覆盖。用两个终端执行相同旧版本更新，也能观察仅一位成功。若第二次仍为 1，检查条件、表名与是否重新插入了初始记录。保存结果后只执行 `DROP TABLE lesson_claim;` 清理本课表，不操作其他表。

### InnoDB 课堂：日志、可见性和锁各管什么

Redo（重做日志）帮助崩溃恢复，Undo（撤销记录）参与回滚与历史版本读取，Binlog（二进制日志）服务复制等上层机制。它们不互相替代。缓冲池先缓存数据页，提交并非要求所有数据页立即写回；持久性要结合日志刷盘、复制与存储保障解释。

MVCC（多版本并发控制）让普通快照读按规则看历史版本，写与锁定读仍会争夺锁。长事务延长版本保留并可能持锁，慢 SQL 与锁等待也不能混为一谈。先找等待关系与事务年龄，再决定是否取消某请求；杀连接后大事务回滚本身可能很久。

死锁是循环等待，锁超时只是等得过久。预防可用固定加锁顺序、缩短事务、合理索引与有界重试。所有重试都要覆盖完整业务事务并保持幂等，不能只重放一条已失去上下文的 SQL。

### 面试和生产设计课堂

30 秒说明 SQL 描述数据需求，MySQL 用优化器与 InnoDB 完成查找、并发和恢复。3 分钟以领取告警讲表约束、条件更新、索引、事务、日志和结果未知，再讲连接池与副本一致性。

设计题要求一天百万告警、快速领取和历史报表。答案包括事件身份、联合索引与保留、在线事务和报表隔离、连接预算、备份恢复与 Schema（结构）兼容。事故题设为发布后慢查询增多，先比较 SQL 指纹、计划、扫描量、锁与流量；修复可以是回退查询、恢复兼容索引或限流，但必须验证业务结果和复制健康。

升级采用扩展—迁移—收缩：先新增可选字段，让新旧应用都能工作，再回填与切读，最后删除旧字段。删除旧字段后，仍依赖该字段的旧应用可能无法回滚运行，所以兼容窗口本身就是回滚方案的一部分。

## 把基础课堂跑成可核对的账本

基础实验先使用前面四条告警和两条发布，不必先凑二十条。创建文件只是组织方式，不要求把每个讲解片段都依次执行：建表、索引和样例数据只执行一次；带省略号的语法片段不能直接运行。尤其不能把分类说明里的删表语句当成下一步实验指令。

使用 Compose 时，将配置保存在新课堂目录，启动前检查 `aiops-mysql` 容器、课堂项目与数据卷不存在，确认三三零六端口未被现有数据库占用。若冲突，选择新的名称和端口并同步修改连接参数，不停止用户正在运行的数据库。示例密码只供回环地址上的合成实验使用。

连接后先执行版本、账号和当前库查询，确认进入 `aiops_lab`。四条样例导入后，总数应为四；按服务统计，订单服务两条，支付服务和网关各一条；严重告警两条；未恢复告警一条。这里的预期只成立于刚创建的空课堂表，重复导入会改变计数。

发布关联应得到两条严重告警各自的近期发布：订单告警在九点十分、发布在八点五十五分，相差十五分钟；支付告警在十点十二分、发布在十点整，相差十二分钟。它们只是时间上有关联的候选，不足以证明发布导致故障。需要进一步核对变更内容、影响范围和对照服务。

样例时间固定在七月一日，因此“最近二十四小时”的动态查询在其他日期可能返回空，这是正确结果。课堂可以把条件改成固定半开区间，起点包含、终点不包含，例如七月一日零点到七月二日零点；这样连续日期区间不会在午夜边界重复计数。

验证时分别保存总数、分组结果、关联结果和计划摘要。若结果翻倍，先查是否重复导入或一条告警匹配多次发布；若为空，先查时间范围和当前数据库；若乱码，核对客户端与表字符集。不要把所有错误都归到“索引失效”，索引通常改变性能，不应改变正确查询的业务答案。

清理前退出全部 `mysql` 客户端。Compose 路线执行 `docker compose -p mysql-alert-classroom down` 只停止并移除课堂容器网络，保留数据卷；明确不再需要课堂数据后才追加 `-v` 删除该项目卷。单次容器路线只删除自己创建的 `aiops-mysql` 及其课堂匿名卷，不混用清理方法。

## 一次更新从连接到磁盘，经过哪些决定

客户端先建立连接并认证，然后提交 SQL。服务端解析语法、检查对象权限，优化器根据索引和统计信息决定访问路径，执行器通过存储引擎访问记录。连接池等待可能发生在数据库收到 SQL 以前，所以应用总耗时长并不一定能在慢查询日志里找到等长记录。

InnoDB 根据索引找到相关页，在缓冲池中读取或载入页面，修改时维护事务版本与锁，并生成用于恢复的日志信息。脏页表示内存页比磁盘页更新，不表示数据损坏。后台刷脏页与提交日志路径协同工作，提交不要求把所有修改页当场逐一写回数据文件。

Redo 解决崩溃后如何重做必要修改，Undo 解决回滚及历史版本读取，Binlog 记录服务器层复制和恢复所需的变化。开启二进制日志时，提交需要协调存储引擎事务与二进制日志的一致性。不能把三类日志当成互相备份的同一种文件，更不能随意删除其中一个来腾空间。

持久性依赖日志刷盘设置与真实存储行为。为了降低延迟而放宽刷盘，可能扩大进程、操作系统或断电故障下的丢失窗口。生产变更必须说明允许丢什么、在什么故障下可能丢，而不是只展示吞吐上涨。磁盘缓存与硬件可靠性也要进入故障模型。

客户端发送提交后连接断开，是典型结果未知：事务可能已经提交，只是确认没回来。应用应通过稳定业务键查询结果，再决定是否重试；不能每次重试都生成新的告警编号和工单编号。数据库事务不能自动撤销邮件、远端部署或另一系统已发生的副作用。

## MVCC、锁定读和长事务的真实边界

普通一致性读取通过快照规则选择可见版本，降低读写相互阻塞。可重复读下，首次一致性读通常建立快照，后续同类读取复用它；读已提交下，每次一致性读使用新的快照。`START TRANSACTION` 本身不能被一概理解成马上固定所有未来读取结果。

锁定读如 `SELECT ... FOR UPDATE` 需要保护将要修改的当前记录，它不是简单复用普通快照查询结果。若业务先普通查询“可领取”，然后隔很久无条件更新“已领取”，中间别的事务可能已经完成领取。正确设计是条件更新，或在合适事务内锁定并验证前置条件。

行锁主要落在访问到的索引记录上。范围条件、隔离级别和索引路径可能使锁保护记录间隙，防止特定并发插入；因此“只修改一行，就永远只影响一行的并发”不成立。索引既影响查找成本，也影响需要检查和锁定的范围。

长事务即使暂时没有执行 SQL，也可能持有锁或维持旧快照。旧版本迟迟不能清理，历史链和空间压力会增长；一个看似空闲的连接因此可能仍是关键阻塞者。排查时要看事务开始时间与等待关系，不能只按当前语句运行秒数排序。

DDL 常有隐式提交和元数据锁行为。把 `ALTER TABLE` 放在 `START TRANSACTION` 与 `ROLLBACK` 之间，并不保证结构修改能够被应用回滚。在线变更也可能在关键阶段等待元数据锁或消耗大量磁盘，必须按具体操作与版本评估。官方 [隐式提交说明](https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html) 是必须核对的边界。

## 双会话故障课堂：看见锁等待，而不是猜数据库死了

前提是基础课堂已建立，打开两个独立 `mysql` 客户端连接同一个 `aiops_lab`。下面仅创建专用表 `lesson_lock_wait`，若它已存在则停下换新名字，不删除未知旧表。故障只让第二个课堂事务等待几秒，不改全局参数，也不终止其他连接。

先在会话甲建立两行数据，再持有第一行的写锁：

```sql
CREATE TABLE lesson_lock_wait (
  id INT PRIMARY KEY,
  value_no INT NOT NULL
) ENGINE=InnoDB;
INSERT INTO lesson_lock_wait VALUES (1, 10), (2, 20);
START TRANSACTION;
UPDATE lesson_lock_wait SET value_no = 11 WHERE id = 1;
-- 暂时不提交，也不关闭会话甲
```

会话乙设置只作用于自己的等待上限，尝试更新同一行：

```sql
SET SESSION innodb_lock_wait_timeout = 3;
START TRANSACTION;
UPDATE lesson_lock_wait SET value_no = 12 WHERE id = 1;
-- 预期收到锁等待超时错误，而不是更新成功
ROLLBACK;
```

预期乙等待大约三秒后失败，实际墙钟时间还包含调度和网络开销。锁等待超时与死锁不同，这里没有形成循环等待。乙显式回滚是为了结束自己的事务，不能假设所有配置下一个语句超时会替你回滚此前整个事务。

回到甲执行 `COMMIT;`，再在乙重试一个新的完整事务：

```sql
START TRANSACTION;
UPDATE lesson_lock_wait SET value_no = 12 WHERE id = 1;
COMMIT;
SELECT * FROM lesson_lock_wait ORDER BY id;
```

预期第一行十二、第二行二十。恢复成功说明阻塞来自甲未结束的事务，不证明磁盘和网络从未有问题。若乙立即成功，检查甲是否已提交、是否使用另一数据库或是否处于自动提交；若甲结束后仍等待，检查是否有第三个课堂事务持锁，别直接杀所有连接。

最后在两边确认事务结束，执行 `DROP TABLE lesson_lock_wait;` 清理专用表，关闭会话乙即可恢复其会话参数默认环境。保留甲乙的操作顺序、超时错误和最终两行结果。这个实验验证真实数据库锁行为的步骤，但本文没有替你运行服务器；学习证据应填写自己的实际观察。

## 查询计划不是一个“有没有索引”的开关

二级索引先定位主键，再回聚簇索引取得完整行，通常叫回表。查询所需信息全在索引里时，可能减少回表成本。复合索引顺序应服务具体的等值条件、范围和排序；最左前缀是理解访问路径的基础，但不能据此忽略优化器的其他扫描方式与成本选择。

`rows` 是计划估计，不是已经实测的精确行数；`Using filesort` 表示使用额外排序过程，不等于必然写磁盘文件。实际慢因可能是估计偏差、返回过多、磁盘读取、锁等待或连接等待。按层收集证据，避免对每个慢查询都机械加索引。

`EXPLAIN ANALYZE` 会实际运行受支持的语句并报告执行信息，不是免费的只看计划。生产查询即使只读，也可能扫描大量数据和占用资源。先在代表性脱敏数据验证、限定范围与期限，再决定是否在线采集，不能用复杂全库查询压测正在故障的实例。

分页还要稳定排序。仅按时间排序时，多条记录时间相同，分页边界可能重复或遗漏；增加唯一主键作为次序，并在高数据量场景考虑基于上一页末尾键的继续查询。深偏移分页可能仍需走过大量前置记录，返回十条不意味着只处理十条。

## 复制、高可用和备份分别解决什么问题

普通异步复制把源库二进制日志传给副本并应用。源库确认提交，不代表副本已经执行完，因此刚写后从副本读取可能看到旧状态。应用必须区分可接受延迟的历史报表和要求读到本次写入的领取结果，不能用“读写分离”四个字替代一致性设计。

半同步复制增加了等待副本确认的阶段，但确认接收不应被简单理解为所有副本完成执行。Group Replication 又有自己的成员、事务认证和一致性选项。不同方案的故障时可用性与数据保证不同，不能把普通主从、半同步和组复制统称为同一种强一致集群。

自动故障切换必须处理旧主隔离，避免旧主恢复后与新主同时接受不协调写入。还要考虑客户端发现新地址、连接池旧连接、未确认事务和副本延迟。切换演练的通过条件包括业务继续写、已有记录完整、重复请求被正确处理，以及旧节点如何安全重新加入。

副本会复制误删除，所以备份仍然必要。时间点恢复通常需要一致备份与连续可用的二进制日志，先在隔离实例恢复，再应用到目标时间或位置，验证对象与业务约束。恢复到错误操作之前可能丢失其后的合法写入，后续选择性补回需要对账，不能简单宣称回到过去就没有代价。

逻辑导出对大库会有读取成本和一致性条件。针对事务表的一致快照导出还要关注并发结构变更、非事务表、用户权限和工具选项。转储文件包含敏感数据与可执行 SQL，应加密、限制访问并检查恢复目标，不把“文件大小正常”当作备份恢复验证。

## 容量与安全：从一天百万告警推到实际约束

一天一百万告警平均每秒约十一点六条，但突发告警风暴可能比均值高很多。每条记录平均两千字节，九十天原始记录约一百八十吉字节，尚未计索引、副本、二进制日志和空间余量。需要分别测峰值写入、热查询范围与历史报表，而不是用平均速率证明无需容量设计。

连接池预算要加总。二十个应用实例，每个最多五十个连接，就是一千个潜在连接，还不含报表、任务和管理员。扩大数据库连接上限可能增加内存和调度压力，并不能修复慢查询。先控制应用并发与超时，避免一个数据库变慢把全站请求都堆在连接池。

业务写入使用参数绑定，不把用户输入拼进 SQL 字符串。参数化能保护值，但动态表名、排序字段等仍需白名单。账号按采集、查询、迁移和备份分权；生产不使用课堂 root 密码或任意来源授权。监控与错误日志也要避免完整打印敏感参数。

升级前核对数据库、驱动、字符排序规则、认证插件和备份工具兼容性，在隔离环境运行代表性读写和恢复。应用结构变更先扩展再迁移最后收缩；数据库二进制升级则按官方支持路径执行。不能把旧数据目录直接交给旧程序当作必然可行的降级方案。

## 三分钟与递进面试答案

三十秒回答：MySQL 保存关系型结构化事实，SQL 描述查询和修改需求，优化器与 InnoDB 实现访问、并发和恢复。我在 AIOps 中用它记录告警、事故、发布和执行结果，用约束与稳定业务键保护数据，用计划、锁和日志定位故障，模型只读取证据而不绕过数据库权限。

三分钟第一段讲表与查询：告警通知不等于独立事故，所以设计稳定事件身份和关联关系。查询先明确时间窗口与统计粒度，防止多次发布或执行记录把告警计数放大。索引按高频过滤和排序设计，通过估计与实际扫描验证收益，同时评估写入维护成本。

第二段讲事务：条件更新或锁定读保护领取，事务将数据库内相关修改一起提交；快照读按隔离级别选择历史版本，锁保护当前冲突。Redo、Undo 和 Binlog 分别服务恢复、回滚可见性与复制。提交确认丢失时先用业务键对账，不能盲目重复外部效果。

第三段讲生产：复制、故障切换和备份分开设计，读副本考虑延迟，旧主需要隔离，恢复需要演练。连接池、缓冲池、磁盘和日志共同决定容量。发布有结构兼容与回退窗口，故障时先定位 SQL、锁等待或资源层，再小范围验证修复，并核对业务结果而不仅是进程存活。

追问“为什么事务错误后不能只重试最后一句”，答案是前面语句可能已回滚或上下文已变化，需要按错误语义处理完整业务事务。追问“删除后磁盘为什么没明显变小”，答案是页内可复用空间与文件归还操作系统不是同一过程，不应据此去删数据文件。追问“报表成功率下降是不是自动化坏了”，先检查分母是否包括排队与运行中任务，再核对终态与业务验证。

## 本课 GitHub 学习证据

学完这篇，建议留下这些证据：

1. 一个 `docker-compose.yml`，能启动 MySQL 8.4。
2. 一个 `schema.sql`，包含 alerts、deployments、incidents、runbook_executions 表。
3. 一个 `seed.sql`，包含至少 20 条样例告警和发布数据。
4. 一个 `queries.sql`，包含至少 10 条 AIOps 分析 SQL。
5. 一张 `EXPLAIN` 截图或输出记录。
6. 一份慢查询排查笔记。
7. 一篇 README，解释每张表和每条 SQL 回答什么运维问题。
