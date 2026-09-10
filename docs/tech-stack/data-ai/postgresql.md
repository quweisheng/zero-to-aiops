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

## 官方知识地图与老师给你的学习顺序

先别急着安装。你可以把数据库当成值班室的正式台账：谁确认了告警、谁批准了自动修复、哪个动作执行成功，都要有凭据。电子表格也能记账，但两个人同时修改、程序突然断电、一天进来百万条记录时，就需要数据库来管理并发、查找和恢复。

```text
Tutorial（入门教程） -> SQL Language（查询语言） -> Data Definition（表结构与约束）
  -> Concurrency Control（并发控制） -> Indexes（索引） -> Performance Tips（性能分析）
  -> Server Administration（服务管理） -> Monitoring（运行观测）
  -> Backup and Restore（备份恢复） -> High Availability（高可用）
  -> Client Interfaces（应用连接接口） -> Extensions（扩展能力）
```

第一次学习，先跟着本文做“登记告警、领取任务、观察争抢”这条线。第二遍再问：两个人同时领取为什么不会重复？数据库突然断电怎样恢复？第三遍才讨论复制、备份、权限、容量与升级。知识是逐层叠起来的，不要求你第一次就记住所有缩写。

本文实验固定使用 PostgreSQL 17 系列，官网 `/current/` 会随新主版本变化；查具体参数时切到你正在使用的版本。官方 [并发控制](https://www.postgresql.org/docs/17/mvcc.html)、[日常维护](https://www.postgresql.org/docs/17/maintenance.html)、[高可用与复制](https://www.postgresql.org/docs/17/high-availability.html) 是后续深入入口。

## 老师先带你辨认三种“成功”

学生：“页面显示处理成功，数据库就一定保存好了吧？”

老师：“我们先把一句话拆成三个时刻。应用收到了请求，只说明信送到了；事务提交成功，说明数据库接受了这次状态变化；业务校验成功，才说明变化满足了你的要求。网络可能在第二步和第三步之间断开，所以客户端超时不等于数据库回滚。”

假设同一告警被重试三次，三次请求都使用稳定的业务键 `alert-001`。数据库上加唯一约束，再用 `INSERT ... ON CONFLICT` 处理已存在记录，才能把重试收敛到一个业务对象。每次重试都换随机编号，就像把同一张发票换三个票号，数据库无法替你识别它们是同一件事。

先记住这个检查问题：你准备保存的是“收到了一次通知”，还是“这个告警的当前状态”？前者可能需要保留每次接收记录，后者需要稳定身份和合法状态迁移。把两类事实混在一张表里，是很多重复告警问题的起点。

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
PostgreSQL instance（运行中的数据库实例）
  -> database（数据库）
     -> schema（命名空间）
        -> table（数据表）
        -> index（索引）
        -> view（视图）
        -> function（函数）
```

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
| BRIN | 记录数据块范围摘要，适合列值与物理位置相关的大表；可能跳过不匹配的块，并非自动替代所有扫描 |

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
FastAPI（接口服务） / worker（后台工作进程）
  |
  v
PostgreSQL（关系型数据库）
  |
  +--> alerts（告警表）
  +--> incidents（事件表）
  +--> changes（变更表）
  +--> runbook_runs（操作执行记录）
  +--> feedback（人工反馈表）
  +--> index（索引）：service（服务） + started_at（开始时间）
  +--> JSONB（二进制 JSON）：原始告警内容
  +--> WAL（写前日志）
  +--> backup（备份） / replica（复制副本）
```

一个 AIOps 事件可以这样落库：

```text
Alertmanager webhook（告警管理器发送 HTTP 通知）
  -> alert-api（告警接收接口）
  -> insert alerts（写入原始告警）
  -> dedupe worker（去重进程）创建事件候选
  -> runbook worker（操作手册执行进程）记录动作
  -> user feedback（人工反馈）更新事件状态
  -> RCA（根因分析）保存复盘结论
```

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

查询最近 24 小时告警最多的服务：

```sql
SELECT service_name, COUNT(*) AS alert_count
FROM alerts
WHERE starts_at >= now() - interval '24 hours'
GROUP BY service_name
ORDER BY alert_count DESC;
```

查询某个标签：

```sql
SELECT *
FROM alerts
WHERE labels @> '{"team": "platform"}';
```

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

`compose.yaml` 可以先只跑一个 PostgreSQL：

```yaml
services:
  postgres:
    image: postgres:17.11
    environment:
      POSTGRES_USER: aiops
      POSTGRES_PASSWORD: aiops
      POSTGRES_DB: aiops
    ports:
      - "127.0.0.1:15432:5432" # 只开放本机教学端口，容器内仍使用 5432
```

实验目标：

- 建 `alerts`、`incidents`、`runbook_runs` 三张表。
- 插入模拟告警。
- 用 SQL 聚合服务告警次数。
- 用 JSONB 保存原始 labels。
- 给常用查询加索引。
- 用 `EXPLAIN ANALYZE` 对比索引前后。

## 精讲一：表结构怎样把业务约定变成规则

我们一起设计一张任务表。`id` 是记录身份证，`event_key` 是业务去重身份证，两者服务的目的不同。自增主键方便内部关联，但不能证明外部请求没有重复。`status` 表示当前状态，`version` 表示这是第几次修改，`created_at` 留下发生时间。

主键要求唯一且非空；唯一约束拒绝重复业务键；`NOT NULL` 要求字段必须有值；`CHECK` 限制字段取值。它们存在的理由是：同一份数据可能被网页、后台任务、人工脚本同时修改，只靠一个网页表单校验挡不住其他入口。约束放到数据库后，每条写入路径都必须遵守。

外键负责引用关系，例如执行记录中的 `incident_id` 必须对应存在的事件。它能防止孤儿记录，但删除父记录时到底拒绝、级联还是置空，需要业务明确。自动修复审计通常不应随着事件删除一起消失，因此不要照搬 `ON DELETE CASCADE`。观察约束的方法是在 `psql` 中运行 `\d 表名`，写入被拒绝时先读违反了哪个约束，再修正输入或业务模型。

学生：“JSONB 能装所有东西，是不是不用设计列了？”老师：“它像可扩展附件袋，适合标签和原始通知；工单主键、状态、负责人、发生时间仍适合明确字段。”JSONB 把 JSON 转成适合处理的表示，支持字段提取和包含查询，但不会保留原始文本的空格、键顺序及重复键表现。需要原样留证时另存原始文本或对象文件。

你要查询 `labels @> '{"team":"platform"}'`，GIN（广义倒排索引）可以帮助包含查询；经常按服务和时间筛选，B-tree（平衡树索引）更直接。索引选择由访问方式决定，不能因为字段是 JSONB 就无差别建多个索引。坏了先核对运算符、数据类型与索引操作符类是否匹配，再看选择性和执行计划。

## 精讲二：MVCC 不是把每行复制很多份那么简单

MVCC 的英文是 Multiversion Concurrency Control，中文是多版本并发控制。请想象老师发给每位学生一份某时刻的成绩单：有人正在更正最新成绩，已经拿到旧成绩单的人仍能按既定规则读完。数据库通过行版本、事务状态和快照判断“这个版本现在对你可见吗”，让普通读取不必等每次修改完成。

默认的 Read Committed（读已提交）通常以每条语句取得的快照为依据。同一事务里先后两次查询，可能看到别的事务刚提交的新结果。Repeatable Read（可重复读）让事务使用更稳定的快照，但不是自动禁止所有业务冲突。Serializable（可串行化）进一步检测无法等价于某种串行顺序的并发，可能返回序列化失败；应用必须能够重试整个事务。

举个具体问题：两个医生都读到“当前还有两个人值班”，于是各自下班。两人更新不同记录，普通行锁未必发生冲突，但最后无人值班。你要把业务不变量纳入设计，可以锁定代表值班组的同一条记录，也可以使用合适的可串行化事务并处理重试。面试不能把“有 MVCC”当成业务绝对正确的证明。

更新通常会留下旧行版本，新事务读新版本，旧快照仍可能需要旧版本。旧版本不再被任何事务需要时，普通 `VACUUM` 才能标记空间可重用；它通常不会把整个表文件立刻缩小后交还操作系统。`VACUUM FULL` 需要重写表并取得更强的锁，与日常自动清理不是同一个低风险动作。

`autovacuum` 是自动维护进程，不是可有可无的“后台垃圾清理”。除回收空间，它还涉及统计信息维护及事务 ID 回卷防护。长事务、空闲但未结束的事务、复制槽等可能延长旧版本保留。发现死元组估计数增长，先查事务年龄和维护记录，不能先关闭自动清理来换短暂的低负载。

```sql
SELECT pid, state, now() - xact_start AS transaction_age,
       wait_event_type, wait_event
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY xact_start NULLS LAST;

SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables;
```

第一条查看会话进程号、状态、事务年龄和等待原因；`idle in transaction` 表示客户端暂时不做事但事务没结束，仍可能保留锁和快照。第二条里的行数是统计估计，不是逐行精确计数。正常判断要看趋势与表写入量；小表暂时没有自动清理时间，并不自动说明故障。

## 精讲三：WAL、检查点、复制与备份各管哪件事

WAL 记录恢复需要的变更信息。数据库先满足日志的持久化要求，再按提交配置向客户端确认；数据页可以稍后分批写回。这样一次断电后，恢复进程能够从检查点附近开始重放必要日志，而不是把所有已提交状态都寄托在内存里。

Checkpoint（检查点）可以理解成“把恢复起跑线向前推”。它协调脏页写出并建立恢复位置。检查点太频繁可能放大写入压力，太稀疏可能增加崩溃恢复需要处理的日志量，具体由工作负载、存储能力和配置决定。看到提交变慢，应同时观察日志写延迟、数据页写压力、磁盘队列和复制确认，不能只把内存加大。

复制把变更传给另一个节点。异步复制允许主库先返回，因此备库落后时切换可能损失近期已确认写入；同步复制可要求指定备库参与确认，但会引入相应的网络延迟和可用性取舍。`synchronous_commit` 与同步备库配置共同决定等待边界，不能只看一个开关就声称“任何故障零丢失”。

Replication slot（复制槽）帮助主库知道消费者还需要哪些日志。它防止需要的 WAL 被过早回收，也可能在消费者长期掉线时占满磁盘。排查应查看槽状态、保留量、消费进度及业务用途；直接删除槽可能破坏复制或变更数据捕获链，需要先确认重建方案。

备份保存可恢复的历史基线。逻辑备份 `pg_dump` 导出对象和数据，适合单库迁移及选择性恢复；物理备份保存数据库集群文件，配合连续 WAL 可进行 PITR（时间点恢复）。主备同步了误删，备库照样没有那批记录，因此复制承担可用性，历史备份承担时间回退，两者需要配合。

恢复成功要做四道检查：服务能启动，数据和对象齐全，应用账号权限正确，关键业务查询与写事务通过。只看到导入命令返回零不够。备份涉及加密时，还必须验证恢复人员有可用密钥；密钥和备份一起丢失，会让文件存在但无法使用。

## 基础带练：从空数据库到一条可追溯告警

前提：电脑安装并启动 Docker Desktop，终端运行 `docker version` 能显示服务端；本机 `15432` 端口空闲。下面在 PowerShell 中执行，只建立名为 `pg-aiops-lesson` 的一次性容器，密码只用于本机实验。不需要预装 `psql`，客户端随容器提供。

```powershell
docker run --name pg-aiops-lesson -e POSTGRES_PASSWORD=lesson-only -e POSTGRES_DB=lesson -p 127.0.0.1:15432:5432 -d postgres:17.11
docker exec pg-aiops-lesson pg_isready -U postgres -d lesson
docker exec -it pg-aiops-lesson psql -U postgres -d lesson
```

第二条预期包含 `accepting connections`；如果启动尚未完成，先查看 `docker logs pg-aiops-lesson` 再重试检查。第三条成功后提示符变为 `lesson=#`，现在输入的是 SQL，不是 PowerShell。分号代表一句 SQL 结束，`\q` 退出客户端。

```sql
CREATE TABLE lesson_incidents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_key text NOT NULL UNIQUE,
  service text NOT NULL,
  status text NOT NULL CHECK (status IN ('OPEN','ACKED','CLOSED')),
  version integer NOT NULL DEFAULT 1,
  labels jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO lesson_incidents(event_key,service,status,labels)
VALUES ('alert-001','order-api','OPEN','{"team":"platform"}')
ON CONFLICT (event_key) DO NOTHING;

SELECT event_key, status, labels ->> 'team' AS team
FROM lesson_incidents;
```

预期一行 `alert-001 | OPEN | platform`。`->>` 是读取 JSON 字段并返回文本；`AS team` 为结果列起便于阅读的名字。再次执行同一条插入，再查 `COUNT(*)`，仍应为 1。这证明唯一约束把重复登记挡住了，并不证明后续发短信、建外部工单也天然不会重复。

现在模拟领取告警，只有仍为 OPEN 的记录才允许修改：

```sql
BEGIN;
UPDATE lesson_incidents
SET status='ACKED', version=version+1
WHERE event_key='alert-001' AND status='OPEN'
RETURNING event_key,status,version;
COMMIT;
```

第一次预期 `ACKED` 与版本 2，重复执行更新得到 `UPDATE 0`。这表示状态条件未满足，应用应反馈“已被领取”而不是报告数据库损坏。条件更新把检查与修改放在同一条语句里，比先查询、过一会儿无条件更新更可靠。

实验记录保存建表 SQL、两次插入的行数、两次更新的结果和 `SELECT version();`。数据库行数据只用这里的合成内容。若报 relation does not exist，先运行 `\dt` 确认在 `lesson` 数据库创建过表，再检查拼写与 schema（命名空间），不要盲目重建整个数据库。

## 故障带练：CPU 很低，为什么领取按钮仍然超时

保持上一个实验容器运行，打开两个终端，分别用前面的 `docker exec -it` 命令进入同一数据库。会话 A 执行下面两句，故意暂时不提交：

```sql
BEGIN;
UPDATE lesson_incidents SET status='OPEN' WHERE event_key='alert-001';
```

会话 B 先给等待设定两秒上限，然后尝试修改同一行：

```sql
SET lock_timeout='2s';
UPDATE lesson_incidents SET status='CLOSED' WHERE event_key='alert-001';
```

预期 B 收到因锁超时取消语句的错误。这时数据库不是“算不动”，而是 B 正在等 A 交回修改权。另开会话 C 可以观察活动；若想抓到两秒内的阻塞，先把 B 的会话锁超时改为 `'20s'`，在 B 等待期间执行：

```sql
SELECT pid, state, wait_event_type, wait_event,
       pg_blocking_pids(pid) AS blockers
FROM pg_stat_activity
WHERE datname='lesson';
```

`blockers` 是阻塞该会话的进程号数组。看到等待与阻塞关系，就有了“谁等谁”的证据。修复实验回到 A 执行 `ROLLBACK;`，撤销未提交修改并释放锁，再在 B 重试更新，应成功返回 `UPDATE 1`。若 B 从未等待，核对 A 有没有自动提交、是否操作相同记录、是否连到同一容器。

为什么不直接结束所有连接？因为有的连接正在做正常工作，强制结束会引起事务回滚和应用重试，甚至造成第二轮压力。生产先识别事务所有者、业务用途与回滚代价，再决定取消语句、终止会话或调整应用。我们的实验通过主动回滚明确知道只影响哪一条合成记录。

现在先退出会话 A 和 C，保留会话 B 继续下一节索引实验。全部实验结束后再按下方清理小节删除教学容器，不要在索引练习之前删除数据库。

## 索引带练：为什么十行数据不走索引也可能是正确的

你手里只有十张纸，顺着翻一遍常比先找目录更快。优化器也会估算扫描和随机访问成本，因此“没走索引”不能单独判定 SQL 有问题。判断需结合返回比例、表大小、缓存情况、数据分布、排序及连接方式。

在实验数据库中可用 `generate_series` 生成十万行合成记录，再比较同一条件加索引前后的计划。请注意 `EXPLAIN ANALYZE` 确实运行语句；本例只用查询，不对生产更新语句随意加它。

```sql
CREATE TABLE lesson_samples AS
SELECT n AS id, 'svc-' || (n % 1000) AS service, n % 7 AS severity
FROM generate_series(1,100000) AS n;
ANALYZE lesson_samples;
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM lesson_samples WHERE service='svc-42';

CREATE INDEX lesson_samples_service_idx ON lesson_samples(service);
ANALYZE lesson_samples;
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM lesson_samples WHERE service='svc-42';
```

预计查询返回 100 行；具体执行时间取决于电脑，不能把示例当成性能承诺。观察计划是否从顺序扫描转为索引或位图路径，以及扫描量、实际行数和缓冲区访问是否变化。第二次运行可能因为缓存变热而更快，要多次交替测试，不能把所有加速都归功于索引。

联合索引 `(service, created_at)` 像先按服务分柜、再按时间排档。适合固定服务后查时间范围，未必同样适合只按时间扫描。覆盖索引、部分索引、表达式索引各自有适用条件，先证明最常见查询和更新成本，再扩展。计划估算行数与实际行数差很多时，统计信息、数据倾斜及列间相关性都是候选原因。

## 第二次带练：看见“同一事务的世界”

现在把 MVCC 从术语变成眼前的现象。前面的锁故障实验观察写写冲突，这一轮观察读可见性。仍用教学容器，先在会话 B 运行 `SELECT COUNT(*) FROM lesson_samples;`，预期为 `100000`。然后另外打开两个 `psql` 会话，记成 A 和 B，确认都连接同一个教学数据库。

A 先执行下面三句，暂时不要提交：

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT COUNT(*) FROM lesson_samples;
SELECT pg_backend_pid();
```

`BEGIN` 开始事务；隔离级别说明读取采用什么可见性规则；最后一行给本会话一个可观察的进程编号。这里的可重复读快照在本事务第一次需要快照的语句时建立，不要误记成 TCP 连接建立时就拍照。A 第一次应看到十万行。

现在 B 执行一条明确可识别的插入并提交：

```sql
INSERT INTO lesson_samples VALUES (100001, 'lesson-new', 1);
SELECT COUNT(*) FROM lesson_samples;
```

如果 B 使用默认自动提交，这条插入完成即提交，计数应为 `100001`。若你之前手工开了事务，必须先完成那个事务，否则 A 看不到变化并不能证明快照机制。回到 A 再查询计数，预计仍为 `100000`；A 执行 `COMMIT;`，随后新查询应为 `100001`。这就是“旧事务读旧快照，新事务看到新事实”的证据，不是缓存错误。

把 A 改成默认的 `READ COMMITTED` 再做一轮时，同一事务内前后两条查询可能读到不同的已提交结果，因为普通查询通常每条语句获得自己的快照。你应写下业务到底需要哪种语义：只展示当前告警数量，语句级读通常足够；生成一份要求多张报表口径一致的快照报告，可能需要更稳定的读取视图。提高隔离级别不会凭空免费，还可能增加冲突、重试或长事务的维护成本。

### 把观察变成排障方法

假设同事说“我明明提交了，另一个窗口还查不到”。先问窗口是否在旧事务里、是否读备库、是否连接不同数据库或 schema，最后才猜引擎损坏。记录 `current_database()`、`current_schema()`、服务器地址、事务开始时间与实际 SQL，可以快速排除“看错地点”。不要在生产日志打印完整业务行，把对象身份和查询指纹脱敏保存即可。

这个实验也解释了为何长事务影响维护：数据库必须保留仍可能被旧快照读取的数据版本。解决办法不是定时把所有事务杀掉，而是缩短业务事务、禁止带事务等待用户输入、设置符合业务的超时、识别长期空闲事务的代码入口。`idle in transaction` 表示事务还开着但当前没有执行语句，它不是普通空闲连接。

### 清理与复做

先在每个教学会话执行 `ROLLBACK;`，确保没有遗留未完成事务，再退出 `psql`。在 PowerShell 中执行 `docker inspect pg-aiops-lesson --format '{{.Name}}'`，预期目标为 `/pg-aiops-lesson`；确认这就是本课创建的一次性容器后，执行 `docker rm -f -v pg-aiops-lesson`。这会删除该容器及其匿名卷，数据不能再用于后续练习。请先保存 SQL、计数截图和版本记录，不要替换成任何生产容器名称。

若要复做，回到基础实验创建容器和表，按第一次写入、重复写入、锁等待、索引、快照的顺序执行。不要因为第二次运行提示表已存在，就跳过错误继续比较一组来源不清的数据。每份实验记录应包含“从什么初始状态开始”，这是可复现比截图更重要的地方。

## 权限课堂：连得上，不等于可以做任何事

数据库认证回答“你是谁”，授权回答“你能碰哪些对象”。`pg_hba.conf` 中规则的匹配顺序、网络来源、数据库和用户限制都影响是否允许连接；进入数据库后，schema 使用权限、表权限、序列权限仍可能分别限制操作。出现 `permission denied` 时，先保留错误中的对象类型，明确缺的是库、schema、表还是序列访问。

例如应用能查询工单，却不能插入带序列默认值的主键，可能是序列权限未包含在表权限里。修复应补足明确对象和明确操作，不应把应用账号升级成超级用户。一个只读报表账号通常不需要执行结构变更；做备份的账号也不应自动拥有变更生产业务数据的权限。角色可以按职责分组，用户通过角色获得权限，离职或密钥轮换才不用逐表找散落授权。

把连接串和 SQL 参数分开处理同样重要。凭据放受控配置，日志只写脱敏连接身份；用户输入通过驱动参数绑定，不用字符串拼接成 SQL。参数化主要防止输入被误当 SQL 结构，不替代业务授权：用户即使只能提交合法 SQL 参数，也不能因此读取其他租户工单。多租户条件、对象授权或行级策略必须在服务端验证，并用“跨租户读取应失败”的测试留下证据。

## 生产设计课堂：一万次请求如何避免变成一万个连接

连接池保存一组可复用连接，让请求轮流使用。它解决认证与建立连接的重复成本，也为数据库并发设闸门。池越大不一定越快：数据库能够同时有效处理的查询有限，过量连接会增加内存、调度、锁竞争和排队。

算一笔账：有 12 个应用副本，每个池最多 30 个连接，仅应用就可能需要 360 个连接，还要为迁移、监控、后台任务和管理员留出空间。扩应用之前必须把池大小乘副本数重新算一遍。应用超时要覆盖排队和执行总预算，失败重试要有上限与退避，避免数据库慢时请求越积越多。

PgBouncer 是常见连接池代理。事务池模式让后端连接在事务结束后复用，适合一些短事务场景，但会影响依赖会话状态的功能。临时表、会话参数、预处理语句及驱动行为要按池模式和版本验证，不能把代理加上就宣称连接问题解决。

高可用设计需要明确唯一写入口、主节点选举、旧主隔离、客户端重连和数据校验。旧主隔离常称 fencing，作用是阻止网络分区后的旧主继续写，避免两个节点各自接单。只有多个数据库进程而没有可靠角色管理，并不构成可用的故障切换体系。

读副本适合可接受延迟的查询。刚确认工单立刻刷新，却被路由到落后副本，就可能看到旧状态。可以让这类读走主库，或使用有明确一致性条件的路由策略。分析报表与在线事务分流还要考虑大查询对备库回放和恢复目标的影响。

容量至少包含表、索引、WAL、临时排序文件、备份和维护峰值。例：每日增加 500 万行，每行连同索引平均 800 字节，仅新增逻辑量约 4 GB/日；再乘保留天数，并把副本、备份、膨胀、重建期间双份空间分开计算。这个例子是预算演示，真实比例应对你的数据测量。

安全从角色开始：应用账号只允许所需表操作，迁移账号处理结构变更，备份与管理员职责分开。`pg_hba.conf` 管连接认证范围，SQL `GRANT` 管入库后的对象权限，两者解决不同层的问题。网络接得通但权限不足，先查认证规则、角色成员与对象权限，不要为排障直接给应用超级用户。

扩展能力也要管理版本。安装 extension（扩展）会增加数据库对象或代码依赖，升级前检查 PostgreSQL 主版本、扩展版本、驱动和备份恢复兼容。主版本升级常采用 `pg_upgrade`、逻辑迁移或其他经验证路线；把旧二进制启动在新数据目录上不是可靠回滚。保留旧环境并定义切回条件，以及新写入如何同步或补偿。

## 事故复盘课堂：凌晨磁盘增长，先动哪一层

假设告警显示剩余空间从 30% 降到 8%，业务还在写。第一步记录增长速率和预计耗尽时间，同时识别是数据目录、WAL、日志、临时文件还是备份增长。未经确认不要删除数据库内部文件，尤其不要手工清空 WAL。

若 WAL 增长对应某复制槽的消费进度停止，假设是下游掉线；继续核对下游故障时间、网络和槽归属。若表和索引增长对应批量回填，假设是业务写入峰值；核对发布记录、写入速率与保留任务。若临时文件增长对应报表查询，比较执行计划及内存溢出，而不是误删表。

修复选择由证据决定：可以暂停非核心回填、限制昂贵查询、恢复下游消费、增加已验证容量。每项动作写清影响对象、风险、预期指标与撤销方法。恢复后不只看空闲空间，还要验证复制追上、写事务正常、备份链连续和磁盘增长率回到预期。

## AIOps 课堂：把数据库证据接入事件链

把接口 P99 延迟、连接池排队、数据库锁等待、WAL 增速、复制延迟和发布记录放到同一时间轴。P99 表示 99% 的请求不超过的延迟，适合观察少数慢请求，不是平均值。数据库请求很多但事务提交少，可能是重试或锁竞争；连接多但 CPU 低，可能是等待，并不自动意味着机器配置过高。

给慢查询使用规范化 SQL 指纹，把参数值脱敏。业务请求 ID 放日志或追踪中，不作为无限增长的监控标签。模型可以提出“某次发布改变查询计划”的候选，但执行取消查询、切换主库、清理数据和参数变更仍需可审计的处置流程。

## 面试带练：从 30 秒到连续追问

**30 秒回答：** PostgreSQL 是支持事务、关系建模、JSON 和扩展的数据库。我把告警与操作状态作为正式事实保存，用约束和条件更新保护业务规则。读写通过 MVCC 管可见性，WAL 支持恢复，vacuum 清理旧版本；排障从连接、锁、执行计划、存储和复制逐层取证。

**3 分钟回答：** 先画“接口—连接池—SQL 执行—表和索引—WAL—副本和备份”。接着用领取告警解释唯一业务键与条件更新，说明事务提交超时为什么需要结果查询；用两个会话的锁实验说明低 CPU 也会超时。再讲长事务如何影响旧版本清理，为什么索引收益要与写放大平衡。生产用连接预算保护数据库，用主角色隔离与重连保证切换路径，用独立恢复演练证明备份可用。最后说明实验是本机单实例，未把它包装成已验证的跨机房方案。

1. **读写不互阻是否代表没有锁？** 普通快照读取减少与行修改冲突；写写、显式锁定读和结构变更仍会等待。追问怎样定位：先看 `wait_event_type`，再用 `pg_blocking_pids` 找关系，结合事务年龄与业务决定处理。
2. **为什么 vacuum 后文件没变小？** 普通清理主要让空间在表内重用，文件缩小与重写是另一个成本和锁级别。追问如何证明有效：看死元组趋势、维护时间、空间复用与查询表现，而不是只看文件大小。
3. **主库成功返回是否等于备库已可读？** 由复制方式、提交等待边界和回放进度决定。追问读己之写：把关键后续读路由到满足一致性要求的节点，并明确故障后的 RPO。
4. **如何设计领取任务不重复？** 稳定业务键、状态条件更新和事务内执行记录。追问外部动作怎么办：用可恢复任务状态与外部幂等键，数据库事务不能撤销已经发生的外部副作用。
5. **索引上线后反而慢如何处理？** 比较受影响 SQL、计划、锁和写 I/O，区分建索引期间资源竞争与新计划回退；按预先验证的兼容路径撤回变化，保留前后证据。

学习停靠点：合上文章，画出一次告警领取的数据路径；解释三个失败位置分别如何证明与恢复。能说清这个小业务，比背出二十个参数更接近实际面试要求。

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

## 进阶课堂：领取任务之后，责任没有随事务一起结束

假设十个工作进程从一张表领取待分析告警，最朴素的写法是都读第一条待处理记录，再各自修改。读和写分开，就可能在中间被别人抢先。前面的条件更新已经解决同一行竞争；当任务很多时，还可以研究 `FOR UPDATE SKIP LOCKED`：锁定读尝试取得候选行的修改权，被别人锁住的行暂时跳过。它适合队列式领取，不适合需要完整一致结果的普通统计查询，因为跳过就是有意不读某些行。[官方锁定子句](https://www.postgresql.org/docs/17/sql-select.html#SQL-FOR-UPDATE-SHARE) 说明了这项取舍。

但这只决定本次短事务领取哪一条，不保证任务永远只执行一次。领取提交后进程崩溃，行锁已释放，任务状态却可能还写着“处理中”。因此任务模型还需要领取者、租约截止时间、尝试次数、稳定动作编号与执行结果。回收者发现租约过期可以重新分配，但过期并不能证明旧进程已经停止；新旧进程同时在外部操作时，目标系统还要识别幂等键或更高代次的执行权。

比如一次运行先创建外部工单，后保存工单编号，恰好在两步之间断网。仅看数据库里的“未完成”就重建，会产生重复工单。应先按稳定业务键查询外部结果，把已创建的编号补记回来；外部接口不支持查询或幂等时，把结果标为未知并交给人工核对，而不是不断尝试到成功。这个状态区分对自动修复尤其重要：数据库事务不能把已经重启的进程变回未重启。

观察这类队列，除了待处理数量，还要看最老待处理年龄、领取到完成延迟、租约过期率与重复抑制次数。积压变小可能只是全部被领走后卡死，不代表处理能力提高。状态迁移应通过带旧状态和版本条件的更新完成，影响零行表示并发或状态已经变化，要重新读取事实，不能直接覆盖别人刚写入的结果。

## 性能课堂：为什么一条参数会被乘很多次

`work_mem` 是排序、哈希等执行操作的内存预算基础，不是每个数据库固定只用一次的总池。一个查询可能包含多个此类节点，多个连接和并行执行又会叠加；哈希还有相关的倍率配置。因此把它从小值改成很大，并不能简单解读成“给每个用户多一点缓存”。先从执行计划里的排序方法、磁盘使用、哈希批次数和临时读写证据判断是否确实发生溢出，再在受控会话评估。[资源配置文档](https://www.postgresql.org/docs/17/runtime-config-resource.html) 给出了各参数的作用范围。

课堂估算：假设同时有二十条查询，每条存在三个可能同时占用内存的操作，各按三十二 MiB 预算，仅这一部分就是一千九百二十 MiB；它还没计算共享缓冲、连接开销、其他算子和操作系统。真实节点生命周期与哈希预算会改变峰值，所以这只是提醒你检查乘法，不是一个精确内存上限。全局调大之后出现内存耗尽，应核对并发和计划变化，不能只问某一条 SQL 为什么这么小。

观测 `BUFFERS` 时也要区分“逻辑访问”和“真正读盘”。共享缓冲命中表示数据库缓冲里找到了页，未命中后读取也可能由操作系统缓存满足；不能把命中率直接换算成存储设备负载。计划里的时间、循环次数和实际行数要一起阅读。某节点每次只处理少量记录，但被嵌套循环调用几十万次，累积成本依然很高。

慢查询修复的验收不只是平均耗时下降，还应检查结果集合不变、尾延迟、写入代价、锁等待和维护开销。创建索引有空间与 I/O 成本，即便选择并发建索引也有阶段性等待、失败残留和命令限制，不能把“并发”翻译为“零影响”。先在相似数据分布下验证，再给生产变更设置观察窗口与撤回条件。

## 恢复课堂：备份文件存在以后，还要回答三道题

第一道是恢复到哪里。恢复演练应使用独立目标，避免把备份直接覆盖正在服务的数据库。目标的主版本、扩展、排序规则与权限都属于恢复依赖；只有表数据没有角色和连接配置，应用仍可能无法工作。逻辑备份和物理备份覆盖对象范围不同，不能用同一个“备份成功”标签掩盖这些区别。

第二道是恢复到哪个时间点。连续归档恢复依赖可用基线和连续日志链，缺失关键 WAL 可能使目标时间不可达。时间点恢复还涉及恢复时间线：一次提升之后产生新分支，不能把来自不同时间线的日志随意拼接。课堂读懂 [连续归档与时间点恢复](https://www.postgresql.org/docs/17/continuous-archiving.html) 后，先画出基线、目标事务、误操作与恢复终点，再考虑具体命令；本文不让初学者在现有主库直接执行恢复配置。

第三道是恢复后如何接回业务。旧系统停写与新系统开放写之间需要明确切换边界；期间产生的新工单、人工确认和外部动作必须对账。恢复到误删前意味着也回退了那之后的正常数据库事务，不等于只撤销误删一件事。恢复验收应选几条带稳定编号的合成业务链，检查状态、关联对象与权限，并记录实际耗时，再用它修正恢复目标。

## 三分钟完整回答示范

“我用 PostgreSQL 保存告警和自动化任务的正式事实。接口先校验身份与参数，通过连接池把事务提交给数据库。表上的唯一业务键处理重复登记，条件更新保证合法领取；MVCC 决定读取看到哪个版本，行锁处理修改冲突，WAL 与检查点承担崩溃恢复。一次客户端超时不能直接解释成回滚，我会按业务键查询提交结果。”

“排障时先区分连接排队、锁等待、执行计划和存储压力。低 CPU 加长延迟常常是等待；死元组增长要关联长事务和自动清理；WAL 占用异常要检查复制槽和归档。内存不能只看单个参数，操作节点、连接和并行度会相乘。高可用设计要包含旧主隔离、客户端重连和允许的数据丢失边界，而备份用于恢复历史，两者不互相替代。”

“对于自动化任务，我把领取事务和外部执行分开，用租约、状态版本和幂等编号处理重试。数据库不能撤销已发生的外部动作，未知结果要先核对。升级前验证扩展、驱动、业务查询与独立恢复；回退不只是换旧二进制，还要处理新数据目录和新增写入。这些机制在单实例课堂可以观察一部分，多机故障切换仍需独立环境演练。”

## 学习证据

学完后建议提交：

- `labs/postgresql-aiops-store/compose.yaml`
- `labs/postgresql-aiops-store/schema.sql`
- `labs/postgresql-aiops-store/queries.sql`
- 一份 `EXPLAIN ANALYZE` 前后对比记录。
- 一篇 `PostgreSQL 连接打满排查.md`。
- 一篇 `PostgreSQL 慢查询排查.md`。
