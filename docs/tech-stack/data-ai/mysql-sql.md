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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>HighErrorRate</code> | 这一行里的英文要这样读：`HighErrorRate` 是高错误率告警名，通常表示某个服务的请求失败比例超过阈值。 |
| 第 2 行 | <code>service=order-api</code> | `service` 是服务名称字段，`order-api` 是具体服务名，表示这条记录属于这个服务。 |
| 第 3 行 | <code>severity=critical</code> | `severity` 是告警严重级别字段，`critical` 表示严重级别，通常表示需要优先处理。 |
| 第 4 行 | <code>started_at=2026-07-02 10:20:00</code> | `started_at` 是告警开始时间字段，`2026-07-02 10:20:00` 表示具体时间值，表示事件、告警或记录发生的时间点。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>MySQL</code> | 这一行里的英文要这样读：`MySQL` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 2 行 | <code>  -&gt; Tutorial</code> | 这一行要理解这些英文词：`Tutorial` 是教程或入门章节。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>     -&gt; connect</code> | 这一行要理解这些英文词：`connect` 是连接。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; enter queries</code> | 这一行要理解这些英文词：`enter queries` 是enter=输入，queries=查询。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; create database</code> | 这一行要理解这些英文词：`create database` 是database=数据库。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; create table</code> | 这一行要理解这些英文词：`create table` 是table=表。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>     -&gt; load data</code> | 这一行要理解这些英文词：`load data` 是load=加载，data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>     -&gt; retrieve data</code> | 这一行要理解这些英文词：`retrieve data` 是retrieve=检索，data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; batch mode</code> | 这一行要理解这些英文词：`batch mode` 是batch=批处理，mode=模式。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; common queries</code> | 这一行要理解这些英文词：`common queries` 是common=常见，queries=查询。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; MySQL Programs</code> | 这一行要理解这些英文词：`MySQL Programs` 是mysql=MySQL 数据库或客户端命令，programs=程序集合。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>     -&gt; mysql client</code> | 这一行要理解这些英文词：`mysql client` 是mysql=MySQL 数据库或客户端命令，client=客户端。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>     -&gt; mysqld server</code> | 这一行要理解这些英文词：`mysqld server` 是mysqld=MySQL 服务端进程，server=服务端。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>     -&gt; mysqladmin</code> | 这一行要理解这些英文词：`mysqladmin` 是MySQL 管理命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>     -&gt; mysqldump</code> | 这一行要理解这些英文词：`mysqldump` 是MySQL 备份导出工具。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>     -&gt; mysqlimport</code> | 这一行要理解这些英文词：`mysqlimport` 是导入数据到 MySQL 的工具。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>     -&gt; mysqlshow</code> | 这一行要理解这些英文词：`mysqlshow` 是查看 MySQL 数据库对象的工具。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>     -&gt; mysqlbinlog</code> | 这一行要理解这些英文词：`mysqlbinlog` 是查看 MySQL 二进制日志的工具。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>  -&gt; SQL Language</code> | 这一行要理解这些英文词：`SQL Language` 是sql=结构化查询语言，language=语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>     -&gt; language structure</code> | 这一行要理解这些英文词：`language structure` 是language=语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>     -&gt; data types</code> | 这一行要理解这些英文词：`data types` 是data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>     -&gt; functions and operators</code> | 这一行要理解这些英文词：`functions and operators` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>     -&gt; SQL statements</code> | 这一行要理解这些英文词：`SQL statements` 是sql=结构化查询语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>       -&gt; DDL</code> | 这一行要理解这些英文词：`DDL` 是数据定义语言，用来建库、建表、建索引。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>       -&gt; DML</code> | 这一行要理解这些英文词：`DML` 是数据操作语言，用来增删改查数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>       -&gt; transaction statements</code> | 这一行要理解这些英文词：`transaction statements` 是transaction=事务。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>       -&gt; administration statements</code> | 这一行要理解这些英文词：`administration statements` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>       -&gt; utility statements</code> | 这一行要理解这些英文词：`utility statements` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>  -&gt; Optimization</code> | 这一行要理解这些英文词：`Optimization` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>     -&gt; indexes</code> | 这一行要理解这些英文词：`indexes` 是索引。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>     -&gt; optimizer</code> | 这一行要理解这些英文词：`optimizer` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>     -&gt; EXPLAIN</code> | 这一行要理解这些英文词：`EXPLAIN` 是解释执行计划的命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>     -&gt; slow query log</code> | 这一行要理解这些英文词：`slow query log` 是query=查询。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>  -&gt; InnoDB</code> | 这一行要理解这些英文词：`InnoDB` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>     -&gt; ACID</code> | 这一行要理解这些英文词：`ACID` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 36 行 | <code>     -&gt; MVCC</code> | 这一行要理解这些英文词：`MVCC` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 37 行 | <code>     -&gt; buffer pool</code> | 这一行要理解这些英文词：`buffer pool` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 38 行 | <code>     -&gt; clustered index</code> | 这一行要理解这些英文词：`clustered index` 是index=索引或目录。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 39 行 | <code>     -&gt; secondary index</code> | 这一行要理解这些英文词：`secondary index` 是index=索引或目录。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 40 行 | <code>     -&gt; redo log</code> | 这一行要理解这些英文词：`redo log` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 41 行 | <code>     -&gt; undo log</code> | 这一行要理解这些英文词：`undo log` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 42 行 | <code>     -&gt; locks</code> | 这一行要理解这些英文词：`locks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 43 行 | <code>     -&gt; transactions</code> | 这一行要理解这些英文词：`transactions` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 44 行 | <code>     -&gt; deadlocks</code> | 这一行要理解这些英文词：`deadlocks` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 45 行 | <code>  -&gt; Administration</code> | 这一行要理解这些英文词：`Administration` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 46 行 | <code>     -&gt; users</code> | 这一行要理解这些英文词：`users` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 47 行 | <code>     -&gt; privileges</code> | 这一行要理解这些英文词：`privileges` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 48 行 | <code>     -&gt; variables</code> | 这一行要理解这些英文词：`variables` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 49 行 | <code>     -&gt; backup and recovery</code> | 这一行要理解这些英文词：`backup and recovery` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 50 行 | <code>     -&gt; logs</code> | 这一行要理解这些英文词：`logs` 是日志。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 51 行 | <code>  -&gt; Observability</code> | 这一行要理解这些英文词：`Observability` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 52 行 | <code>     -&gt; INFORMATION_SCHEMA</code> | 这一行要理解这些英文词：`INFORMATION_SCHEMA` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 53 行 | <code>     -&gt; Performance Schema</code> | 这一行要理解这些英文词：`Performance Schema` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 54 行 | <code>     -&gt; sys schema</code> | 这一行要理解这些英文词：`sys schema` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysql client</code> | 这一行里的英文要这样读：`mysql client` 这个英文标识可以拆开理解为：客户端。 |
| 第 2 行 | <code>  -&gt; database/table/row/column</code> | 这一行要理解这些英文词：`database` 是数据库；`table` 是表；`row` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`column` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; SELECT/WHERE/GROUP BY/JOIN</code> | 这一行要理解这些英文词：`SELECT` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`WHERE` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`GROUP BY` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`JOIN` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; INSERT/UPDATE/DELETE</code> | 这一行要理解这些英文词：`INSERT` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`UPDATE` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`DELETE` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; data types</code> | 这一行要理解这些英文词：`data types` 是data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; primary key/index</code> | 这一行要理解这些英文词：`primary key` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`index` 是索引或目录。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; transaction</code> | 这一行要理解这些英文词：`transaction` 是事务。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; EXPLAIN</code> | 这一行要理解这些英文词：`EXPLAIN` 是解释执行计划的命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; InnoDB</code> | 这一行要理解这些英文词：`InnoDB` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; users/privileges</code> | 这一行要理解这些英文词：`users` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`privileges` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; backup/slow query/troubleshooting</code> | 这一行要理解这些英文词：`backup` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`slow query` 是query=查询；`troubleshooting` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Alertmanager / GitHub Actions / Runbook / Incident</code> | `Alertmanager / GitHub Actions / Runbook / Incident` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  -&gt; collector</code> | 这一行要理解这些英文词：`collector` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; MySQL</code> | 这一行要理解这些英文词：`MySQL` 是MySQL 数据库或客户端命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>      alerts</code> | 这一行里的英文要这样读：`alerts` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 5 行 | <code>      incidents</code> | 这一行里的英文要这样读：`incidents` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 6 行 | <code>      deployments</code> | 这一行里的英文要这样读：`deployments` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 7 行 | <code>      runbook_executions</code> | 这一行里的英文要这样读：`runbook_executions` 这个英文标识可以拆开理解为：故障处理手册。 |
| 第 8 行 | <code>      feedback_labels</code> | 这一行里的英文要这样读：`feedback_labels` 这个英文标识可以拆开理解为：标签字段，用来标识告警或指标身份。 |
| 第 9 行 | <code>  -&gt; SQL analysis</code> | 这一行要理解这些英文词：`SQL analysis` 是sql=结构化查询语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; pandas / scikit-learn</code> | 这一行要理解这些英文词：`pandas` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`scikit-learn` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; FastAPI dashboard</code> | 这一行要理解这些英文词：`FastAPI dashboard` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>  -&gt; RAG / LLM explanation</code> | 这一行要理解这些英文词：`RAG` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`LLM explanation` 是llm=大语言模型。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>client</code> | 这一行里的英文要这样读：`client` 是客户端。 |
| 第 2 行 | <code>  -&gt; sends SQL</code> | 这一行要理解这些英文词：`sends SQL` 是sql=结构化查询语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; MySQL Server</code> | 这一行要理解这些英文词：`MySQL Server` 是mysql=MySQL 数据库或客户端命令，server=服务端。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; parser / optimizer / executor</code> | 这一行要理解这些英文词：`parser` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`optimizer` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`executor` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; storage engine</code> | 这一行要理解这些英文词：`storage engine` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; data files and logs</code> | 这一行要理解这些英文词：`data files and logs` 是data=数据，logs=日志。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>database: aiops_lab</code> | `database` 是数据库名称字段，冒号后面的 `aiops_lab` 是这个字段的示例内容或模板表达式。 |
| 第 2 行 | <code>  table: alerts</code> | `table` 是table 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `alerts` 是这个字段的示例内容或模板表达式。 |
| 第 3 行 | <code>    row: 一条告警</code> | `row` 是row 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `一条告警` 是这个字段的示例内容或模板表达式。 |
| 第 4 行 | <code>    column: service_name / severity / created_at</code> | `column` 是column 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，冒号后面的 `service_name / severity / created_at` 是这个字段的示例内容或模板表达式。 |

“关系”不只是表格，而是表和表之间可以通过键关联：

```text
alerts.service_name
  -> services.name

alerts.incident_id
  -> incidents.id

runbook_executions.alert_id
  -> alerts.id
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>alerts.service_name</code> | `alerts.service_name` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  -&gt; services.name</code> | 这一行要理解这些英文词：`services.name` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>alerts.incident_id</code> | `alerts.incident_id` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>  -&gt; incidents.id</code> | 这一行要理解这些英文词：`incidents.id` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>runbook_executions.alert_id</code> | `runbook_executions.alert_id` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>  -&gt; alerts.id</code> | 这一行要理解这些英文词：`alerts.id` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysql client</code> | 这一行里的英文要这样读：`mysql client` 这个英文标识可以拆开理解为：客户端。 |
| 第 2 行 | <code>  -&gt; TCP 3306 / socket</code> | 这一行要理解这些英文词：`TCP` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`socket` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; MySQL Server</code> | 这一行要理解这些英文词：`MySQL Server` 是mysql=MySQL 数据库或客户端命令，server=服务端。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>      -&gt; connection manager</code> | 这一行要理解这些英文词：`connection manager` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>      -&gt; SQL parser</code> | 这一行要理解这些英文词：`SQL parser` 是sql=结构化查询语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>      -&gt; optimizer</code> | 这一行要理解这些英文词：`optimizer` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>      -&gt; executor</code> | 这一行要理解这些英文词：`executor` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>      -&gt; storage engine API</code> | 这一行要理解这些英文词：`storage engine API` 是api=应用程序接口。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>      -&gt; InnoDB</code> | 这一行要理解这些英文词：`InnoDB` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>          -&gt; buffer pool</code> | 这一行要理解这些英文词：`buffer pool` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>          -&gt; clustered index</code> | 这一行要理解这些英文词：`clustered index` 是index=索引或目录。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>          -&gt; secondary indexes</code> | 这一行要理解这些英文词：`secondary indexes` 是indexes=索引。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>          -&gt; redo log</code> | 这一行要理解这些英文词：`redo log` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>          -&gt; undo log</code> | 这一行要理解这些英文词：`undo log` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>          -&gt; data files</code> | 这一行要理解这些英文词：`data files` 是data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker run -d --name aiops-mysql \</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 双横线参数是命令选项，真实环境要按自己的路径、端口或资源名调整。 |
| 第 2 行 | <code>  -e MYSQL_ROOT_PASSWORD=aiops_root_pwd \</code> | 执行 `-e` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>  -e MYSQL_DATABASE=aiops_lab \</code> | 执行 `-e` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 4 行 | <code>  -e MYSQL_USER=aiops \</code> | 执行 `-e` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>  -e MYSQL_PASSWORD=aiops_pwd \</code> | 执行 `-e` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 6 行 | <code>  -p 3306:3306 \</code> | 执行 `-p` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 7 行 | <code>  mysql:8.4</code> | 执行 `mysql:8.4` 相关命令，后面的参数决定它具体操作什么对象。 |

进入容器内连接：

```bash
docker exec -it aiops-mysql mysql -uaiops -paiops_pwd aiops_lab
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker exec -it aiops-mysql mysql -uaiops -paiops_pwd aiops_lab</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

从宿主机连接：

```bash
mysql -h 127.0.0.1 -P 3306 -u aiops -p aiops_lab
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysql -h 127.0.0.1 -P 3306 -u aiops -p aiops_lab</code> | 连接或操作 MySQL 数据库，用来查询 AIOps 结构化数据。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT VERSION();</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>SELECT USER();</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 3 行 | <code>SELECT DATABASE();</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 4 行 | <code>SHOW DATABASES;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>SHOW TABLES;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE DATABASE IF NOT EXISTS aiops_lab</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 2 行 | <code>  DEFAULT CHARACTER SET utf8mb4</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  DEFAULT COLLATE utf8mb4_0900_ai_ci;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>USE aiops_lab;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE TABLE alerts (</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 2 行 | <code>  id BIGINT PRIMARY KEY AUTO_INCREMENT,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  service_name VARCHAR(100) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  instance VARCHAR(100) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  severity ENUM('info', 'warning', 'critical') NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>  alert_name VARCHAR(200) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 7 行 | <code>  metric_name VARCHAR(100),</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 8 行 | <code>  metric_value DOUBLE,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 9 行 | <code>  status ENUM('firing', 'resolved') NOT NULL DEFAULT 'firing',</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 10 行 | <code>  created_at DATETIME NOT NULL,</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 11 行 | <code>  resolved_at DATETIME NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 12 行 | <code>  INDEX idx_alerts_service_time (service_name, created_at),</code> | 定义索引，加速按这些字段过滤、排序或关联查询。 |
| 第 13 行 | <code>  INDEX idx_alerts_severity_time (severity, created_at),</code> | 定义索引，加速按这些字段过滤、排序或关联查询。 |
| 第 14 行 | <code>  INDEX idx_alerts_status_time (status, created_at)</code> | 定义索引，加速按这些字段过滤、排序或关联查询。 |
| 第 15 行 | <code>) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>INSERT INTO alerts</code> | 向表里新增数据，常用于写入告警、事件或学习样例。 |
| 第 2 行 | <code>  (service_name, instance, severity, alert_name, metric_name, metric_value, status, created_at, resolved_at)</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>VALUES</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  ('order-api', '10.0.1.11', 'critical', 'HighErrorRate', 'http_5xx_rate', 0.23, 'resolved', '2026-07-01 09:10:00', '2026-07-01 09:25:00'),</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  ('order-api', '10.0.1.12', 'warning', 'HighLatency', 'p95_latency_ms', 1200, 'firing', '2026-07-01 10:05:00', NULL),</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>  ('payment-api', '10.0.2.21', 'critical', 'DatabaseConnectionError', 'db_conn_errors', 35, 'resolved', '2026-07-01 10:12:00', '2026-07-01 10:40:00'),</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 7 行 | <code>  ('gateway', '10.0.0.8', 'info', 'TrafficSpike', 'request_per_second', 4200, 'resolved', '2026-07-01 11:00:00', '2026-07-01 11:05:00');</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

### 查询所有告警

```sql
SELECT *
FROM alerts;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT *</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts;</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |

`*` 表示返回所有列。学习阶段可以用，生产查询和接口里建议明确列名。

### 查询严重告警

```sql
SELECT service_name, instance, alert_name, created_at
FROM alerts
WHERE severity = 'critical'
ORDER BY created_at DESC;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT service_name, instance, alert_name, created_at</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>WHERE severity = 'critical'</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 4 行 | <code>ORDER BY created_at DESC;</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT service_name, COUNT(*) AS alert_count</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>GROUP BY service_name</code> | 按指定字段分组，让每组单独统计或聚合。 |
| 第 4 行 | <code>ORDER BY alert_count DESC;</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>  service_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  alert_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  TIMESTAMPDIFF(MINUTE, created_at, resolved_at) AS mttr_minutes</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 6 行 | <code>WHERE resolved_at IS NOT NULL;</code> | 过滤原始数据行，只保留符合条件的记录。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE DATABASE aiops_lab;</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 2 行 | <code>CREATE TABLE alerts (...);</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 3 行 | <code>ALTER TABLE alerts ADD COLUMN owner VARCHAR(100);</code> | 修改数据库对象结构，例如新增字段或索引。 |
| 第 4 行 | <code>DROP TABLE alerts;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>INSERT INTO alerts (...) VALUES (...);</code> | 向表里新增数据，常用于写入告警、事件或学习样例。 |
| 第 3 行 | <code>UPDATE alerts</code> | 更新已有数据，生产执行前要先用 SELECT 确认影响范围。 |
| 第 4 行 | <code>SET status = 'resolved'</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>WHERE id = 1;</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 7 行 | <code>DELETE FROM alerts</code> | 删除数据，生产执行前必须确认 WHERE 条件避免误删。 |
| 第 8 行 | <code>WHERE id = 1;</code> | 过滤原始数据行，只保留符合条件的记录。 |

生产执行 `UPDATE` / `DELETE` 前，先把同样条件写成 `SELECT` 看影响范围：

```sql
SELECT *
FROM alerts
WHERE id = 1;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT *</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>WHERE id = 1;</code> | 过滤原始数据行，只保留符合条件的记录。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT service_name, COUNT(*) AS alert_count -- 取服务名，并统计每个服务有多少条告警，统计结果命名为 alert_count</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts                                  -- 从 alerts 告警表中读取数据</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>WHERE created_at &gt;= NOW() - INTERVAL 1 DAY   -- 只统计最近 1 天的告警，避免把很久以前的历史告警也算进去</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 4 行 | <code>GROUP BY service_name                        -- 按服务名分组，让每个服务单独形成一组</code> | 按指定字段分组，让每组单独统计或聚合。 |
| 第 5 行 | <code>HAVING COUNT(*) &gt;= 10                        -- 分组后只保留告警数大于等于 10 的服务</code> | 对分组后的结果再次过滤，常用于限制 COUNT、AVG 等聚合结果。 |
| 第 6 行 | <code>ORDER BY alert_count DESC                    -- 按告警数量从多到少排序，先看到最吵的服务</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |
| 第 7 行 | <code>LIMIT 10;                                    -- 只返回前 10 个服务，适合做告警治理 TopN</code> | 限制返回行数，避免结果太多影响阅读或性能。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>FROM       -&gt; 先决定从哪张表读数据，这里是 alerts 告警表</code> | 这一行要理解这些英文词：`FROM` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`alerts` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 2 行 | <code>  -&gt; WHERE -&gt; 再过滤原始行，只留下最近 1 天的告警</code> | 这一行要理解这些英文词：`WHERE` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; GROUP BY -&gt; 然后按 service_name 分组，让每个服务单独统计</code> | 这一行要理解这些英文词：`GROUP BY` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`service_name` 是service=服务。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; HAVING -&gt; 分组后再过滤，只留下告警数不少于 10 的服务</code> | 这一行要理解这些英文词：`HAVING` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; SELECT -&gt; 选择最终要展示的列，比如服务名和告警数量</code> | 这一行要理解这些英文词：`SELECT` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; ORDER BY -&gt; 对结果排序，让告警最多的服务排在前面</code> | 这一行要理解这些英文词：`ORDER BY` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; LIMIT -&gt; 限制返回数量，避免结果太多不好看</code> | 这一行要理解这些英文词：`LIMIT` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>metric_value DOUBLE</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service_name VARCHAR(100) NOT NULL</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

原始告警可以用 `JSON`：

```sql
raw_payload JSON
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>raw_payload JSON</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>resolved_at DATETIME NULL</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

查询 `NULL` 必须用：

```sql
WHERE resolved_at IS NULL
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>WHERE resolved_at IS NULL</code> | 过滤原始数据行，只保留符合条件的记录。 |

不能写：

```sql
WHERE resolved_at = NULL
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>WHERE resolved_at = NULL</code> | 过滤原始数据行，只保留符合条件的记录。 |

### DEFAULT

默认值：

```sql
status ENUM('firing', 'resolved') NOT NULL DEFAULT 'firing'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>status ENUM('firing', 'resolved') NOT NULL DEFAULT 'firing'</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT *</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>WHERE severity = 'critical'</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 4 行 | <code>  AND created_at &gt;= '2026-07-01 00:00:00';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT service_name, alert_name, created_at</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>ORDER BY created_at DESC;</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |

`DESC` 是倒序，`ASC` 是正序。

### LIMIT

限制返回行数：

```sql
SELECT *
FROM alerts
ORDER BY created_at DESC
LIMIT 10;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT *</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>ORDER BY created_at DESC</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |
| 第 4 行 | <code>LIMIT 10;</code> | 限制返回行数，避免结果太多影响阅读或性能。 |

在运维排查中，`LIMIT` 很有用，因为你通常先看最新或最严重的少量记录。

### GROUP BY

分组统计：

```sql
SELECT service_name, COUNT(*) AS alert_count
FROM alerts
GROUP BY service_name;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT service_name, COUNT(*) AS alert_count</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>GROUP BY service_name;</code> | 按指定字段分组，让每组单独统计或聚合。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT service_name, COUNT(*) AS alert_count</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>GROUP BY service_name</code> | 按指定字段分组，让每组单独统计或聚合。 |
| 第 4 行 | <code>HAVING COUNT(*) &gt;= 2;</code> | 对分组后的结果再次过滤，常用于限制 COUNT、AVG 等聚合结果。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>  service_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  alert_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  CASE</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>    WHEN severity = 'critical' THEN 'page_oncall'</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>    WHEN severity = 'warning' THEN 'create_ticket'</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 7 行 | <code>    ELSE 'record_only'</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 8 行 | <code>  END AS action_hint</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 9 行 | <code>FROM alerts;</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE TABLE deployments (</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 2 行 | <code>  id BIGINT PRIMARY KEY AUTO_INCREMENT,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  service_name VARCHAR(100) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  version VARCHAR(100) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  commit_sha VARCHAR(100) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>  environment VARCHAR(50) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 7 行 | <code>  deployed_at DATETIME NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 8 行 | <code>  status ENUM('success', 'failed', 'rolled_back') NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 9 行 | <code>  INDEX idx_deployments_service_time (service_name, deployed_at)</code> | 定义索引，加速按这些字段过滤、排序或关联查询。 |
| 第 10 行 | <code>) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

插入样例：

```sql
INSERT INTO deployments
  (service_name, version, commit_sha, environment, deployed_at, status)
VALUES
  ('order-api', '1.4.2', 'abc1234', 'production', '2026-07-01 08:55:00', 'success'),
  ('payment-api', '2.1.0', 'def5678', 'production', '2026-07-01 10:00:00', 'success');
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>INSERT INTO deployments</code> | 向表里新增数据，常用于写入告警、事件或学习样例。 |
| 第 2 行 | <code>  (service_name, version, commit_sha, environment, deployed_at, status)</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>VALUES</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  ('order-api', '1.4.2', 'abc1234', 'production', '2026-07-01 08:55:00', 'success'),</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  ('payment-api', '2.1.0', 'def5678', 'production', '2026-07-01 10:00:00', 'success');</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>  a.service_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  a.alert_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  a.created_at,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  d.version,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>  d.deployed_at</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 7 行 | <code>FROM alerts AS a</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 8 行 | <code>JOIN deployments AS d</code> | 把两张表按关联字段连接起来，用于把告警、服务、变更等上下文拼在一起。 |
| 第 9 行 | <code>  ON a.service_name = d.service_name;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>  a.service_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  a.alert_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  a.created_at,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  d.version,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>  d.commit_sha,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 7 行 | <code>  d.deployed_at</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 8 行 | <code>FROM alerts AS a</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 9 行 | <code>JOIN deployments AS d</code> | 把两张表按关联字段连接起来，用于把告警、服务、变更等上下文拼在一起。 |
| 第 10 行 | <code>  ON a.service_name = d.service_name</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 11 行 | <code> AND d.environment = 'production'</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 12 行 | <code> AND d.deployed_at BETWEEN a.created_at - INTERVAL 30 MINUTE AND a.created_at</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 13 行 | <code>WHERE a.severity = 'critical';</code> | 过滤原始数据行，只保留符合条件的记录。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>  a.id,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  a.service_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  a.alert_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  d.version</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>FROM alerts AS a</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 7 行 | <code>LEFT JOIN deployments AS d</code> | 把两张表按关联字段连接起来，用于把告警、服务、变更等上下文拼在一起。 |
| 第 8 行 | <code>  ON a.service_name = d.service_name</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 9 行 | <code> AND d.deployed_at BETWEEN a.created_at - INTERVAL 30 MINUTE AND a.created_at;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT service_name, COUNT(*) AS alert_count</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>GROUP BY service_name</code> | 按指定字段分组，让每组单独统计或聚合。 |
| 第 4 行 | <code>HAVING COUNT(*) &gt; (</code> | 对分组后的结果再次过滤，常用于限制 COUNT、AVG 等聚合结果。 |
| 第 5 行 | <code>  SELECT AVG(service_alerts.alert_count)</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 6 行 | <code>  FROM (</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 7 行 | <code>    SELECT service_name, COUNT(*) AS alert_count</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 8 行 | <code>    FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 9 行 | <code>    GROUP BY service_name</code> | 按指定字段分组，让每组单独统计或聚合。 |
| 第 10 行 | <code>  ) AS service_alerts</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 11 行 | <code>);</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>WITH service_alerts AS (</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 2 行 | <code>  SELECT service_name, COUNT(*) AS alert_count</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 3 行 | <code>  FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 4 行 | <code>  GROUP BY service_name</code> | 按指定字段分组，让每组单独统计或聚合。 |
| 第 5 行 | <code>)</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>SELECT *</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 7 行 | <code>FROM service_alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 8 行 | <code>ORDER BY alert_count DESC;</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |

AIOps 报表查询通常会越来越复杂，CTE 能让查询像分步骤推理。

## 索引

索引是数据库为了加快查找而维护的数据结构。

没有索引时，查询可能扫描整张表：

```sql
SELECT *
FROM alerts
WHERE service_name = 'order-api';
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT *</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>WHERE service_name = 'order-api';</code> | 过滤原始数据行，只保留符合条件的记录。 |

有索引时，数据库可以更快定位相关行：

```sql
CREATE INDEX idx_alerts_service ON alerts(service_name);
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE INDEX idx_alerts_service ON alerts(service_name);</code> | 创建数据库对象，例如表、索引或视图。 |

### 主键索引

```sql
id BIGINT PRIMARY KEY AUTO_INCREMENT
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>id BIGINT PRIMARY KEY AUTO_INCREMENT</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE INDEX idx_alerts_service_time</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 2 行 | <code>ON alerts(service_name, created_at);</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

这种索引用于：

```sql
WHERE service_name = 'order-api'
  AND created_at >= '2026-07-01 00:00:00'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>WHERE service_name = 'order-api'</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 2 行 | <code>  AND created_at &gt;= '2026-07-01 00:00:00'</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

### 最左前缀

复合索引 `(service_name, created_at)` 适合：

```sql
WHERE service_name = 'order-api'
WHERE service_name = 'order-api' AND created_at >= ...
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>WHERE service_name = 'order-api'</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 2 行 | <code>WHERE service_name = 'order-api' AND created_at &gt;= ...</code> | 过滤原始数据行，只保留符合条件的记录。 |

不太适合只按 `created_at` 查：

```sql
WHERE created_at >= '2026-07-01 00:00:00'
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>WHERE created_at &gt;= '2026-07-01 00:00:00'</code> | 过滤原始数据行，只保留符合条件的记录。 |

如果经常按时间查全局告警，应单独建：

```sql
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE INDEX idx_alerts_created_at ON alerts(created_at);</code> | 创建数据库对象，例如表、索引或视图。 |

### 覆盖索引

如果查询需要的列都在索引里，数据库可能不用回表。

```sql
CREATE INDEX idx_alerts_service_severity_time
ON alerts(service_name, severity, created_at);

SELECT service_name, severity, created_at
FROM alerts
WHERE service_name = 'order-api';
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE INDEX idx_alerts_service_severity_time</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 2 行 | <code>ON alerts(service_name, severity, created_at);</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>SELECT service_name, severity, created_at</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 5 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 6 行 | <code>WHERE service_name = 'order-api';</code> | 过滤原始数据行，只保留符合条件的记录。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>EXPLAIN</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 2 行 | <code>SELECT *</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 3 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 4 行 | <code>WHERE service_name = 'order-api'</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 5 行 | <code>  AND created_at &gt;= '2026-07-01 00:00:00';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>type = ALL</code> | `type` 是主机、服务、告警或资源的示例名称；`type` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`ALL` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 2 行 | <code>  -&gt; 可能全表扫描</code> | 这一行表示上一级主题下的子项“可能全表扫描”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 4 行 | <code>key = NULL</code> | `key` 是主机、服务、告警或资源的示例名称；`key` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`NULL` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |
| 第 5 行 | <code>  -&gt; 没有用索引</code> | 这一行表示上一级主题下的子项“没有用索引”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 7 行 | <code>rows 很大</code> | 这一行里的英文要这样读：`rows` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 8 行 | <code>  -&gt; 扫描数据太多</code> | 这一行表示上一级主题下的子项“扫描数据太多”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 10 行 | <code>Extra 有 Using filesort</code> | 这一行里的英文要这样读：`Extra` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源；`Using filesort` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 11 行 | <code>  -&gt; 排序可能额外耗时</code> | 这一行表示上一级主题下的子项“排序可能额外耗时”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>START TRANSACTION;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>UPDATE alerts</code> | 更新已有数据，生产执行前要先用 SELECT 确认影响范围。 |
| 第 4 行 | <code>SET status = 'resolved',</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>    resolved_at = NOW()</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>WHERE id = 2;</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 8 行 | <code>INSERT INTO alert_events(alert_id, event_type, message, created_at)</code> | 向表里新增数据，常用于写入告警、事件或学习样例。 |
| 第 9 行 | <code>VALUES (2, 'resolved', 'manual resolved by oncall', NOW());</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 11 行 | <code>COMMIT;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

如果中间发现不对：

```sql
ROLLBACK;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ROLLBACK;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT @@autocommit;</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |

如果 `autocommit = 1`，每条单独语句执行后自动提交。

显式事务用：

```sql
START TRANSACTION;
...
COMMIT;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>START TRANSACTION;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 2 行 | <code>...</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>COMMIT;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT @@transaction_isolation;</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW ENGINE INNODB STATUS\G</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SQL layer</code> | 这一行里的英文要这样读：`SQL layer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; parse / optimize / execute</code> | 这一行要理解这些英文词：`parse` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`optimize` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`execute` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>storage engine layer</code> | 这一行里的英文要这样读：`storage engine layer` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>  -&gt; read/write rows</code> | 这一行要理解这些英文词：`read` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`write rows` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>query</code> | 这一行里的英文要这样读：`query` 是查询。 |
| 第 2 行 | <code>  -&gt; check buffer pool</code> | 这一行要理解这些英文词：`check buffer pool` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; if page exists, read from memory</code> | 这一行要理解这些英文词：`if page exists` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`read from memory` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; if not, read from disk into buffer pool</code> | 这一行要理解这些英文词：`if not` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`read from disk into buffer pool` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

生产调优里 `innodb_buffer_pool_size` 很重要。

查看：

```sql
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW VARIABLES LIKE 'innodb_buffer_pool_size';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

### 聚簇索引

InnoDB 表数据按主键组织。主键索引的叶子节点里存整行数据，这叫聚簇索引。

简单理解：

```text
primary key index
  -> contains full row data
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>primary key index</code> | 这一行里的英文要这样读：`primary key index` 这个英文标识可以拆开理解为：索引或目录。 |
| 第 2 行 | <code>  -&gt; contains full row data</code> | 这一行要理解这些英文词：`contains full row data` 是data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>commit</code> | 这一行里的英文要这样读：`commit` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; write redo log</code> | 这一行要理解这些英文词：`write redo log` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; later flush dirty pages</code> | 这一行要理解这些英文词：`later flush dirty pages` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>writer updates row</code> | 这一行里的英文要这样读：`writer updates row` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>reader can still read an older committed version</code> | 这一行里的英文要这样读：`reader can still read an older committed version` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

这就是为什么很多查询不会简单地阻塞写入。

## 用户和权限

数据库权限是生产安全的基本线。

### 创建用户

```sql
CREATE USER 'aiops_app'@'%' IDENTIFIED BY 'change_me';
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE USER 'aiops_app'@'%' IDENTIFIED BY 'change_me';</code> | 创建数据库对象，例如表、索引或视图。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>GRANT SELECT, INSERT, UPDATE</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 2 行 | <code>ON aiops_lab.*</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>TO 'aiops_app'@'%';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

含义：允许这个用户对 `aiops_lab` 库里的所有表执行查询、插入、更新。

不要给应用账号 `ALL PRIVILEGES`，更不要让应用直接用 root。

### 查看权限

```sql
SHOW GRANTS FOR 'aiops_app'@'%';
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW GRANTS FOR 'aiops_app'@'%';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

### 回收权限

```sql
REVOKE UPDATE
ON aiops_lab.*
FROM 'aiops_app'@'%';
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>REVOKE UPDATE</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 2 行 | <code>ON aiops_lab.*</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>FROM 'aiops_app'@'%';</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW VARIABLES LIKE 'max_connections';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 2 行 | <code>SHOW VARIABLES LIKE 'character_set_server';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>SHOW VARIABLES LIKE 'innodb_buffer_pool_size';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>SHOW VARIABLES LIKE 'slow_query_log';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW PROCESSLIST;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW STATUS LIKE 'Threads_connected';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 2 行 | <code>SHOW VARIABLES LIKE 'max_connections';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

### 查看表结构

```sql
DESCRIBE alerts;
SHOW CREATE TABLE alerts\G
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>DESCRIBE alerts;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 2 行 | <code>SHOW CREATE TABLE alerts\G</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

`DESCRIBE` 看字段概要，`SHOW CREATE TABLE` 看完整建表语句。

## 备份和恢复

没有备份的数据库，谈不上可靠。

### mysqldump 备份

```bash
mysqldump -h 127.0.0.1 -u root -p aiops_lab > aiops_lab.sql
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysqldump -h 127.0.0.1 -u root -p aiops_lab &gt; aiops_lab.sql</code> | 执行 `mysqldump` 相关命令，后面的参数决定它具体操作什么对象。 |

含义：

- 连接 MySQL。
- 导出 `aiops_lab` 数据库。
- 保存到 SQL 文件。

### 恢复

```bash
mysql -h 127.0.0.1 -u root -p aiops_lab < aiops_lab.sql
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysql -h 127.0.0.1 -u root -p aiops_lab &lt; aiops_lab.sql</code> | 连接或操作 MySQL 数据库，用来查询 AIOps 结构化数据。 |

### 只备份某张表

```bash
mysqldump -u root -p aiops_lab alerts > alerts.sql
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysqldump -u root -p aiops_lab alerts &gt; alerts.sql</code> | 执行 `mysqldump` 相关命令，后面的参数决定它具体操作什么对象。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW VARIABLES LIKE 'slow_query_log';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 2 行 | <code>SHOW VARIABLES LIKE 'long_query_time';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

临时打开：

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SET GLOBAL slow_query_log = 'ON';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 2 行 | <code>SET GLOBAL long_query_time = 1;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 2 行 | <code>  -&gt; 找到慢 SQL</code> | 这一行要理解这些英文词：`SQL` 是结构化查询语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; EXPLAIN 看执行计划</code> | 这一行要理解这些英文词：`EXPLAIN` 是解释执行计划的命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; 看是否全表扫描</code> | 这一行表示上一级主题下的子项“看是否全表扫描”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 5 行 | <code>  -&gt; 看索引是否合适</code> | 这一行表示上一级主题下的子项“看索引是否合适”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 6 行 | <code>  -&gt; 看返回行数是否太大</code> | 这一行表示上一级主题下的子项“看返回行数是否太大”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 7 行 | <code>  -&gt; 看是否锁等待</code> | 这一行表示上一级主题下的子项“看是否锁等待”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 8 行 | <code>  -&gt; 优化 SQL / 索引 / 数据模型</code> | 这一行要理解这些英文词：`SQL` 是结构化查询语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services</code> | 这一行里的英文要这样读：`services` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; alerts</code> | 这一行要理解这些英文词：`alerts` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; incidents</code> | 这一行要理解这些英文词：`incidents` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; deployments</code> | 这一行要理解这些英文词：`deployments` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; runbook_executions</code> | 这一行要理解这些英文词：`runbook_executions` 是runbook=故障处理手册。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; feedback_labels</code> | 这一行要理解这些英文词：`feedback_labels` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE TABLE services (</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 2 行 | <code>  id BIGINT PRIMARY KEY AUTO_INCREMENT,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  service_name VARCHAR(100) NOT NULL UNIQUE,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  owner_team VARCHAR(100) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  tier ENUM('core', 'normal', 'internal') NOT NULL DEFAULT 'normal',</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 7 行 | <code>) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE TABLE incidents (</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 2 行 | <code>  id BIGINT PRIMARY KEY AUTO_INCREMENT,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  incident_key VARCHAR(100) NOT NULL UNIQUE,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  service_name VARCHAR(100) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  severity ENUM('sev1', 'sev2', 'sev3') NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>  title VARCHAR(200) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 7 行 | <code>  started_at DATETIME NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 8 行 | <code>  resolved_at DATETIME NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 9 行 | <code>  root_cause_type VARCHAR(100),</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 10 行 | <code>  INDEX idx_incidents_service_time (service_name, started_at)</code> | 定义索引，加速按这些字段过滤、排序或关联查询。 |
| 第 11 行 | <code>) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE TABLE runbook_executions (</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 2 行 | <code>  id BIGINT PRIMARY KEY AUTO_INCREMENT,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  alert_id BIGINT NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  runbook_name VARCHAR(200) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  automation_level ENUM('L0', 'L1', 'L2', 'L3', 'L4') NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>  status ENUM('queued', 'running', 'succeeded', 'failed', 'cancelled') NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 7 行 | <code>  started_at DATETIME NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 8 行 | <code>  finished_at DATETIME NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 9 行 | <code>  summary TEXT,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 10 行 | <code>  INDEX idx_runbook_alert (alert_id),</code> | 定义索引，加速按这些字段过滤、排序或关联查询。 |
| 第 11 行 | <code>  INDEX idx_runbook_status_time (status, started_at)</code> | 定义索引，加速按这些字段过滤、排序或关联查询。 |
| 第 12 行 | <code>) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CREATE TABLE feedback_labels (</code> | 创建数据库对象，例如表、索引或视图。 |
| 第 2 行 | <code>  id BIGINT PRIMARY KEY AUTO_INCREMENT,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  alert_id BIGINT NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  label ENUM('true_positive', 'noise', 'duplicate', 'unknown') NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  labeled_by VARCHAR(100) NOT NULL,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>  labeled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 7 行 | <code>  note TEXT,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 8 行 | <code>  INDEX idx_feedback_alert (alert_id),</code> | 定义索引，加速按这些字段过滤、排序或关联查询。 |
| 第 9 行 | <code>  INDEX idx_feedback_label_time (label, labeled_at)</code> | 定义索引，加速按这些字段过滤、排序或关联查询。 |
| 第 10 行 | <code>) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT service_name, COUNT(*) AS alert_count -- 取服务名，并统计每个服务最近 24 小时的告警数量</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts                                  -- 从 alerts 告警表里读取数据</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>WHERE created_at &gt;= NOW() - INTERVAL 1 DAY   -- 只保留最近 1 天创建的告警</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 4 行 | <code>GROUP BY service_name                        -- 按服务名分组，做到每个服务一行统计结果</code> | 按指定字段分组，让每组单独统计或聚合。 |
| 第 5 行 | <code>ORDER BY alert_count DESC                    -- 按告警数量从多到少排序</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |
| 第 6 行 | <code>LIMIT 10;                                    -- 只展示前 10 个服务，方便快速定位告警最多的对象</code> | 限制返回行数，避免结果太多影响阅读或性能。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>  service_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) AS avg_mttr_minutes</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 5 行 | <code>WHERE resolved_at IS NOT NULL</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 6 行 | <code>GROUP BY service_name</code> | 按指定字段分组，让每组单独统计或聚合。 |
| 第 7 行 | <code>ORDER BY avg_mttr_minutes DESC;</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |

### 仍在触发的 critical 告警

```sql
SELECT id, service_name, instance, alert_name, created_at
FROM alerts
WHERE severity = 'critical'
  AND status = 'firing'
ORDER BY created_at ASC;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT id, service_name, instance, alert_name, created_at</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>FROM alerts</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 3 行 | <code>WHERE severity = 'critical'</code> | 过滤原始数据行，只保留符合条件的记录。 |
| 第 4 行 | <code>  AND status = 'firing'</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>ORDER BY created_at ASC;</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>  a.id AS alert_id,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  a.service_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  a.alert_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  a.created_at AS alert_time,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>  d.version,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 7 行 | <code>  d.commit_sha,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 8 行 | <code>  d.deployed_at</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 9 行 | <code>FROM alerts AS a</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 10 行 | <code>LEFT JOIN deployments AS d</code> | 把两张表按关联字段连接起来，用于把告警、服务、变更等上下文拼在一起。 |
| 第 11 行 | <code>  ON a.service_name = d.service_name</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 12 行 | <code> AND d.environment = 'production'</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 13 行 | <code> AND d.deployed_at BETWEEN a.created_at - INTERVAL 30 MINUTE AND a.created_at</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 14 行 | <code>WHERE a.severity = 'critical';</code> | 过滤原始数据行，只保留符合条件的记录。 |

### 噪声告警比例

```sql
SELECT
  f.label,
  COUNT(*) AS label_count
FROM feedback_labels AS f
GROUP BY f.label
ORDER BY label_count DESC;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>  f.label,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  COUNT(*) AS label_count</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>FROM feedback_labels AS f</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 5 行 | <code>GROUP BY f.label</code> | 按指定字段分组，让每组单独统计或聚合。 |
| 第 6 行 | <code>ORDER BY label_count DESC;</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SELECT</code> | 选择最终要返回的字段或计算结果，是查询结果表头的来源。 |
| 第 2 行 | <code>  runbook_name,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 3 行 | <code>  COUNT(*) AS total_runs,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 4 行 | <code>  SUM(status = 'succeeded') AS succeeded_runs,</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 5 行 | <code>  ROUND(SUM(status = 'succeeded') / COUNT(*) * 100, 2) AS success_rate_percent</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |
| 第 6 行 | <code>FROM runbook_executions</code> | 指定从哪张表读取数据，是 SQL 逻辑执行的起点。 |
| 第 7 行 | <code>GROUP BY runbook_name</code> | 按指定字段分组，让每组单独统计或聚合。 |
| 第 8 行 | <code>ORDER BY success_rate_percent DESC;</code> | 对查询结果排序，让最重要或最新的数据排在前面。 |

在 MySQL 中，布尔表达式为真可当作 1，假可当作 0，所以 `SUM(status = 'succeeded')` 可以统计成功次数。

## 常用命令字典

### mysql

```bash
mysql -h 127.0.0.1 -P 3306 -u aiops -p aiops_lab
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysql -h 127.0.0.1 -P 3306 -u aiops -p aiops_lab</code> | 连接或操作 MySQL 数据库，用来查询 AIOps 结构化数据。 |

作用：连接 MySQL。

### mysql -e

```bash
mysql -h 127.0.0.1 -u aiops -p -e "SHOW DATABASES;"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysql -h 127.0.0.1 -u aiops -p -e "SHOW DATABASES;"</code> | 连接或操作 MySQL 数据库，用来查询 AIOps 结构化数据。 |

作用：从命令行执行一条 SQL，适合脚本。

### 批量执行 SQL 文件

```bash
mysql -u aiops -p aiops_lab < schema.sql
mysql -u aiops -p aiops_lab < seed.sql
mysql -u aiops -p aiops_lab < queries.sql
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysql -u aiops -p aiops_lab &lt; schema.sql</code> | 连接或操作 MySQL 数据库，用来查询 AIOps 结构化数据。 |
| 第 2 行 | <code>mysql -u aiops -p aiops_lab &lt; seed.sql</code> | 连接或操作 MySQL 数据库，用来查询 AIOps 结构化数据。 |
| 第 3 行 | <code>mysql -u aiops -p aiops_lab &lt; queries.sql</code> | 连接或操作 MySQL 数据库，用来查询 AIOps 结构化数据。 |

作用：导入建表、样例数据和查询。

### mysqldump

```bash
mysqldump -u root -p aiops_lab > aiops_lab.sql
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysqldump -u root -p aiops_lab &gt; aiops_lab.sql</code> | 执行 `mysqldump` 相关命令，后面的参数决定它具体操作什么对象。 |

作用：逻辑备份。

### mysqladmin ping

```bash
mysqladmin -h 127.0.0.1 -u root -p ping
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysqladmin -h 127.0.0.1 -u root -p ping</code> | 执行 `mysqladmin` 相关命令，后面的参数决定它具体操作什么对象。 |

作用：检查 MySQL server 是否响应。

### SHOW DATABASES

```sql
SHOW DATABASES;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW DATABASES;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

作用：列出数据库。

### SHOW TABLES

```sql
SHOW TABLES;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW TABLES;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

作用：列出当前库的表。

### DESCRIBE

```sql
DESCRIBE alerts;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>DESCRIBE alerts;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

作用：查看表字段。

### SHOW CREATE TABLE

```sql
SHOW CREATE TABLE alerts\G
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW CREATE TABLE alerts\G</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

作用：查看完整建表语句。

### EXPLAIN

```sql
EXPLAIN SELECT * FROM alerts WHERE service_name = 'order-api';
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>EXPLAIN SELECT * FROM alerts WHERE service_name = 'order-api';</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

作用：查看执行计划。

### SHOW PROCESSLIST

```sql
SHOW PROCESSLIST;
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW PROCESSLIST;</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

作用：查看当前连接和正在执行的 SQL。

### SHOW ENGINE INNODB STATUS

```sql
SHOW ENGINE INNODB STATUS\G
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW ENGINE INNODB STATUS\G</code> | SQL 语句的续行，通常补充字段、条件、函数参数或子查询结构。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>projects/mysql-alert-analysis/</code> | `projects/mysql-alert-analysis/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  README.md</code> | `README.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>  docker-compose.yml</code> | `docker-compose.yml` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>  schema.sql</code> | `schema.sql` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>  seed.sql</code> | `seed.sql` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>  queries.sql</code> | `queries.sql` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 7 行 | <code>  screenshots/</code> | `screenshots/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>services:</code> | 定义 `services` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 2 行 | <code>  mysql:</code> | 定义 `mysql` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 3 行 | <code>    image: mysql:8.4</code> | `image` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`mysql:8.4` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 4 行 | <code>    container_name: aiops-mysql</code> | `container_name` 这个英文标识可以拆开理解为：名称字段，`aiops-mysql` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 5 行 | <code>    environment:</code> | 定义 `environment` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 6 行 | <code>      MYSQL_ROOT_PASSWORD: aiops_root_pwd</code> | `MYSQL_ROOT_PASSWORD` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`aiops_root_pwd` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 7 行 | <code>      MYSQL_DATABASE: aiops_lab</code> | `MYSQL_DATABASE` 这个英文标识可以拆开理解为：数据库名称字段，`aiops_lab` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 8 行 | <code>      MYSQL_USER: aiops</code> | `MYSQL_USER` 这个英文标识可以拆开理解为：用户，`aiops` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 9 行 | <code>      MYSQL_PASSWORD: aiops_pwd</code> | `MYSQL_PASSWORD` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`aiops_pwd` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值；真实 AIOps 环境里要按自己的服务名、端口、路径或策略调整。 |
| 第 10 行 | <code>    ports:</code> | 定义 `ports` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 11 行 | <code>      - "3306:3306"</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 12 行 | <code>    volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 13 行 | <code>      - mysql-data:/var/lib/mysql</code> | 列表项，表示同一个配置字段下面可以有多个值或多个对象。 |
| 第 15 行 | <code>volumes:</code> | 定义 `volumes` 配置段，下面缩进的内容都属于这个配置段。 |
| 第 16 行 | <code>  mysql-data:</code> | 定义 `mysql-data` 配置段，下面缩进的内容都属于这个配置段。 |

启动：

```bash
docker compose up -d
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>docker compose up -d</code> | 执行 Docker 容器命令，用来启动、查看、停止或构建容器化实验环境。 |

导入：

```bash
mysql -h 127.0.0.1 -u aiops -p aiops_lab < schema.sql
mysql -h 127.0.0.1 -u aiops -p aiops_lab < seed.sql
mysql -h 127.0.0.1 -u aiops -p aiops_lab < queries.sql
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mysql -h 127.0.0.1 -u aiops -p aiops_lab &lt; schema.sql</code> | 连接或操作 MySQL 数据库，用来查询 AIOps 结构化数据。 |
| 第 2 行 | <code>mysql -h 127.0.0.1 -u aiops -p aiops_lab &lt; seed.sql</code> | 连接或操作 MySQL 数据库，用来查询 AIOps 结构化数据。 |
| 第 3 行 | <code>mysql -h 127.0.0.1 -u aiops -p aiops_lab &lt; queries.sql</code> | 连接或操作 MySQL 数据库，用来查询 AIOps 结构化数据。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>确认 MySQL 是否运行</code> | 这一行里的英文要这样读：`MySQL` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 2 行 | <code>  -&gt; 确认 host/port</code> | 这一行要理解这些英文词：`host` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`port` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 确认用户名密码</code> | 这一行表示上一级主题下的子项“确认用户名密码”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 4 行 | <code>  -&gt; 确认用户 host 匹配</code> | 这一行要理解这些英文词：`host` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 确认权限</code> | 这一行表示上一级主题下的子项“确认权限”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 6 行 | <code>  -&gt; 查看 MySQL error log</code> | 这一行要理解这些英文词：`MySQL error log` 是mysql=MySQL 数据库或客户端命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>找到 SQL</code> | 这一行里的英文要这样读：`SQL` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |
| 第 2 行 | <code>  -&gt; EXPLAIN</code> | 这一行要理解这些英文词：`EXPLAIN` 是解释执行计划的命令。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; 看是否全表扫描</code> | 这一行表示上一级主题下的子项“看是否全表扫描”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 4 行 | <code>  -&gt; 看 rows 估算</code> | 这一行要理解这些英文词：`rows` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 看 key 是否为空</code> | 这一行要理解这些英文词：`key` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; 看是否排序/临时表</code> | 这一行表示上一级主题下的子项“看是否排序/临时表”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 7 行 | <code>  -&gt; 调整索引或 SQL</code> | 这一行要理解这些英文词：`SQL` 是结构化查询语言。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

### 写入卡住

```text
SHOW PROCESSLIST
  -> 找等待连接
  -> 找长事务
  -> 看 InnoDB status
  -> 判断锁等待或死锁
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SHOW PROCESSLIST</code> | 这一行里的英文要这样读：`SHOW PROCESSLIST` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; 找等待连接</code> | 这一行表示上一级主题下的子项“找等待连接”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 3 行 | <code>  -&gt; 找长事务</code> | 这一行表示上一级主题下的子项“找长事务”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 4 行 | <code>  -&gt; 看 InnoDB status</code> | 这一行要理解这些英文词：`InnoDB status` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; 判断锁等待或死锁</code> | 这一行表示上一级主题下的子项“判断锁等待或死锁”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |

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
