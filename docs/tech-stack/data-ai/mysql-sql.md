# MySQL / SQL

## 官方资料

- [MySQL 8.4 Reference Manual - Tutorial](https://dev.mysql.com/doc/refman/8.4/en/tutorial.html)
- [Creating and Selecting a Database](https://dev.mysql.com/doc/refman/8.4/en/creating-database.html)
- [CREATE TABLE Statement](https://dev.mysql.com/doc/refman/8.4/en/create-table.html)
- [Introduction to InnoDB](https://dev.mysql.com/doc/refman/8.4/en/innodb-introduction.html)

> 学习说明：本篇不是复制 MySQL 官方手册，而是把官方教程中的连接、建库、建表、查询、事务和 InnoDB 基础，整理成 AIOps 初学者可以照着练的中文教程。

## 是什么

SQL 是关系型数据库的通用查询语言，MySQL 是最常见的开源关系型数据库之一。AIOps 里会经常接触“事件表、告警表、工单表、变更表、指标聚合表、用户操作记录表”，这些结构化数据很适合先用 SQL 管起来。

对运维转 AIOps 来说，MySQL / SQL 的价值不是“会背语法”，而是能回答这些问题：

- 最近 24 小时哪个服务告警最多？
- 一次故障前 30 分钟有没有发布变更？
- 某个主机的错误日志、指标异常和工单是否有关联？
- 一个告警策略调整后，告警量是否真的下降？

## 核心原理

MySQL 把数据放在“库、表、行、列”里：

```text
MySQL Server
  -> database: aiops_lab
      -> table: alerts
          -> row: 一条告警
          -> column: 告警字段，例如 service、severity、created_at
```

SQL 查询的基本思想是：

1. 先用 `FROM` 指定数据来源。
2. 再用 `WHERE` 过滤行。
3. 用 `GROUP BY` 把数据分组。
4. 用聚合函数计算数量、平均值、最大值。
5. 用 `ORDER BY` 排序。
6. 用 `LIMIT` 控制返回行数。

你可以把 SQL 看成“让数据库替你做筛选、统计和关联”的语言。

## 架构

一个最小 MySQL 架构如下：

```text
mysql client
  -> TCP 3306
  -> MySQL Server
      -> SQL parser
      -> optimizer
      -> executor
      -> storage engine: InnoDB
      -> data files and redo/undo logs
```

重要组件：

| 组件 | 作用 | 初学者要知道什么 |
|---|---|---|
| `mysql` 客户端 | 连接数据库、执行 SQL | 官网教程从这个客户端开始 |
| SQL parser | 解析 SQL 语法 | 语法错会在这里失败 |
| optimizer | 选择执行计划 | 索引影响查询速度 |
| InnoDB | 默认存储引擎 | 支持事务、行锁、外键、崩溃恢复 |
| Buffer Pool | 内存缓存数据页和索引页 | 大多数性能调优会关注它 |
| Redo Log | 保证已提交事务崩溃后可恢复 | 写入可靠性的基础 |
| Undo Log | 支持回滚和 MVCC | 事务隔离的基础 |

InnoDB 是 MySQL 8.4 默认存储引擎。它的关键能力是 ACID 事务、行级锁、聚簇索引、外键约束和崩溃恢复。AIOps 里如果要保存告警、事件、反馈结果，默认优先用 InnoDB。

## 安装和启动

### 方式一：Docker 实验环境

适合本仓库练习，避免污染本机。

```bash
docker run -d --name aiops-mysql \
  -e MYSQL_ROOT_PASSWORD=aiops_root_pwd \
  -e MYSQL_DATABASE=aiops_lab \
  -e MYSQL_USER=aiops \
  -e MYSQL_PASSWORD=aiops_pwd \
  -p 3306:3306 \
  mysql:8.4
```

连接：

```bash
docker exec -it aiops-mysql mysql -uaiops -paiops_pwd aiops_lab
```

或者：

```bash
mysql -h 127.0.0.1 -P 3306 -u aiops -p aiops_lab
```

### 方式二：本机安装

Windows 可以使用 MySQL Installer，Linux 可以使用系统包管理器。学习阶段建议先用 Docker，因为删除容器就能重来：

```bash
docker rm -f aiops-mysql
```

## 第一个数据库实验

### 1. 创建和选择数据库

官网教程强调：创建数据库并不会自动选择它，必须显式 `USE`。

```sql
CREATE DATABASE aiops_lab;
USE aiops_lab;
```

查看当前数据库：

```sql
SELECT DATABASE();
```

### 2. 创建告警表

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
  INDEX idx_alerts_severity_time (severity, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

字段设计思路：

| 字段 | 含义 | AIOps 用法 |
|---|---|---|
| `service_name` | 服务名 | 按服务统计告警 |
| `instance` | 实例或主机 | 定位问题机器 |
| `severity` | 严重级别 | 区分噪声和故障 |
| `metric_name` | 关联指标 | 连接 Prometheus 指标 |
| `metric_value` | 触发时数值 | 做异常检测样本 |
| `status` | 告警状态 | 计算恢复时长 |
| `created_at` | 触发时间 | 时间窗口分析 |
| `resolved_at` | 恢复时间 | MTTR 分析 |

### 3. 插入样例数据

```sql
INSERT INTO alerts
  (service_name, instance, severity, alert_name, metric_name, metric_value, status, created_at, resolved_at)
VALUES
  ('order-api', '10.0.1.11', 'critical', 'HighErrorRate', 'http_5xx_rate', 0.23, 'resolved', '2026-07-01 09:10:00', '2026-07-01 09:25:00'),
  ('order-api', '10.0.1.12', 'warning', 'HighLatency', 'p95_latency_ms', 1200, 'firing', '2026-07-01 10:05:00', NULL),
  ('payment-api', '10.0.2.21', 'critical', 'DatabaseConnectionError', 'db_conn_errors', 35, 'resolved', '2026-07-01 10:12:00', '2026-07-01 10:40:00'),
  ('gateway', '10.0.0.8', 'info', 'TrafficSpike', 'request_per_second', 4200, 'resolved', '2026-07-01 11:00:00', '2026-07-01 11:05:00');
```

### 4. 查询所有告警

```sql
SELECT * FROM alerts;
```

### 5. 查询严重告警

```sql
SELECT service_name, instance, alert_name, created_at
FROM alerts
WHERE severity = 'critical'
ORDER BY created_at DESC;
```

### 6. 按服务统计告警量

```sql
SELECT service_name, COUNT(*) AS alert_count
FROM alerts
GROUP BY service_name
ORDER BY alert_count DESC;
```

### 7. 计算恢复分钟数

```sql
SELECT
  service_name,
  alert_name,
  TIMESTAMPDIFF(MINUTE, created_at, resolved_at) AS mttr_minutes
FROM alerts
WHERE resolved_at IS NOT NULL;
```

### 8. 找出仍在触发的告警

```sql
SELECT *
FROM alerts
WHERE status = 'firing';
```

## SQL 语法主线

### 数据定义 DDL

DDL 用来定义结构：

```sql
CREATE DATABASE aiops_lab;
CREATE TABLE alerts (...);
ALTER TABLE alerts ADD COLUMN owner VARCHAR(100);
DROP TABLE alerts;
```

初学阶段不要随便执行 `DROP`，除非你确认是实验环境。

### 数据操作 DML

DML 用来处理数据：

```sql
INSERT INTO alerts (...) VALUES (...);
UPDATE alerts SET status = 'resolved' WHERE id = 1;
DELETE FROM alerts WHERE id = 1;
```

生产环境执行 `UPDATE` / `DELETE` 前，先写同条件的 `SELECT` 验证影响范围。

### 数据查询 DQL

```sql
SELECT service_name, COUNT(*)
FROM alerts
WHERE created_at >= NOW() - INTERVAL 1 DAY
GROUP BY service_name
HAVING COUNT(*) >= 10
ORDER BY COUNT(*) DESC
LIMIT 10;
```

查询顺序可以按这条线记：

```text
FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT
```

## 索引

索引是数据库为了更快查找数据而维护的数据结构。MySQL InnoDB 常用 B+Tree 索引。

没有索引时，数据库可能要扫描整张表：

```sql
SELECT * FROM alerts WHERE service_name = 'order-api';
```

给常用过滤字段建索引：

```sql
CREATE INDEX idx_alerts_service ON alerts(service_name);
```

复合索引适合“服务 + 时间”这种查询：

```sql
CREATE INDEX idx_alerts_service_created ON alerts(service_name, created_at);
```

查看执行计划：

```sql
EXPLAIN
SELECT *
FROM alerts
WHERE service_name = 'order-api'
  AND created_at >= '2026-07-01 00:00:00';
```

学习重点：

- 索引不是越多越好，写入时也要维护索引。
- 高选择性的字段更适合索引。
- 复合索引要关注最左前缀。
- 运维场景常给时间字段、服务字段、状态字段建索引。

## 事务

事务用于保证一组操作要么都成功，要么都失败。

```sql
START TRANSACTION;

UPDATE alerts
SET status = 'resolved', resolved_at = NOW()
WHERE id = 2;

INSERT INTO alert_events(alert_id, event_type, message, created_at)
VALUES (2, 'resolved', 'manual resolved by oncall', NOW());

COMMIT;
```

如果中间发现不对：

```sql
ROLLBACK;
```

事务的 ACID：

| 字母 | 含义 | 运维理解 |
|---|---|---|
| A | Atomicity 原子性 | 一组操作整体成败 |
| C | Consistency 一致性 | 数据符合约束 |
| I | Isolation 隔离性 | 并发事务互相隔离 |
| D | Durability 持久性 | 提交后崩溃也能恢复 |

## 配置重点

学习环境先知道这些参数：

| 配置 | 作用 | 学习建议 |
|---|---|---|
| `port` | 默认 3306 | 本机冲突时换端口 |
| `character_set_server` | 默认字符集 | 推荐 `utf8mb4` |
| `max_connections` | 最大连接数 | 连接打满是常见故障 |
| `innodb_buffer_pool_size` | InnoDB 缓存大小 | 生产调优核心参数 |
| `slow_query_log` | 慢查询日志 | 排查 SQL 性能 |
| `long_query_time` | 慢查询阈值 | 实验可设小一点 |
| `binlog_expire_logs_seconds` | binlog 保留时间 | 影响磁盘空间 |

查看变量：

```sql
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'slow_query_log';
```

查看连接：

```sql
SHOW PROCESSLIST;
```

## AIOps 中的作用

MySQL 在 AIOps 项目里通常负责保存“结构化事实”：

```text
Prometheus / Loki / Alertmanager
  -> Python collector
  -> MySQL tables
      -> alerts
      -> incidents
      -> changes
      -> runbook_actions
      -> model_feedback
  -> pandas / scikit-learn analysis
  -> FastAPI dashboard or API
```

适合保存：

- 告警事件
- 事故单
- 变更记录
- 值班处理动作
- 模型判断结果
- 人工反馈标签

不适合保存：

- 超高频原始指标点，优先 Prometheus / Thanos / VictoriaMetrics。
- 海量全文日志，优先 Loki / Elasticsearch。
- 大模型向量，优先向量数据库。

## 入门练习：告警分析数据库

目标：做一个能提交到 GitHub 的小实验。

目录建议：

```text
projects/mysql-alert-analysis/
  README.md
  schema.sql
  seed.sql
  queries.sql
  screenshots/
```

`schema.sql`：

```sql
CREATE DATABASE IF NOT EXISTS aiops_lab;
USE aiops_lab;

CREATE TABLE IF NOT EXISTS alerts (
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
  INDEX idx_alerts_severity_time (severity, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

`queries.sql` 至少包含：

```sql
-- 每个服务的告警数
SELECT service_name, COUNT(*) AS alert_count
FROM alerts
GROUP BY service_name
ORDER BY alert_count DESC;

-- 平均恢复时长
SELECT service_name,
       AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) AS avg_mttr_minutes
FROM alerts
WHERE resolved_at IS NOT NULL
GROUP BY service_name;

-- 当前仍未恢复的 critical 告警
SELECT *
FROM alerts
WHERE severity = 'critical'
  AND status = 'firing';
```

README 记录：

- 如何启动 MySQL。
- 如何导入 `schema.sql` 和 `seed.sql`。
- 每条 SQL 的作用。
- 查询截图。
- 自己对结果的解释。

## 常见故障

### Access denied

现象：

```text
ERROR 1045 (28000): Access denied for user
```

排查：

```bash
mysql -h 127.0.0.1 -u aiops -p
```

确认：

- 用户名是否正确。
- 密码是否正确。
- 是否允许从当前主机连接。
- 是否有目标数据库权限。

### Unknown database

```text
ERROR 1049 (42000): Unknown database
```

处理：

```sql
SHOW DATABASES;
CREATE DATABASE aiops_lab;
```

### Table already exists

实验环境可以先删表：

```sql
DROP TABLE alerts;
```

更稳妥的写法：

```sql
CREATE TABLE IF NOT EXISTS alerts (...);
```

### 查询慢

排查顺序：

1. `EXPLAIN` 看是否走索引。
2. 检查 `WHERE` 条件是否包含索引字段。
3. 检查返回行数是否太大。
4. 检查是否对索引字段做了函数计算。
5. 打开慢查询日志观察真实慢 SQL。

## 学习证据

学完后，在 GitHub 留下这些东西：

- `schema.sql`：建库建表语句。
- `seed.sql`：样例告警数据。
- `queries.sql`：至少 5 条分析 SQL。
- `README.md`：解释每条 SQL 回答了什么运维问题。
- 一张查询结果截图。

能做到这些，就说明你不是“看过 MySQL”，而是已经把 MySQL 用在 AIOps 场景里了。

