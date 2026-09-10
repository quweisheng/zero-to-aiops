# pandas

> 目标：不是只会 `read_csv` 和 `groupby`，而是能理解 pandas 的 Series、DataFrame、Index、dtype、选择、过滤、缺失值、合并、分组聚合、时间序列、窗口计算、IO、性能边界，并能用它分析 AIOps 告警、事故、变更和 runbook 数据。

## 官方资料

优先读这些 pandas 官方资料：

- [pandas documentation](https://pandas.pydata.org/docs/)
- [User Guide](https://pandas.pydata.org/docs/user_guide/index.html)
- [10 minutes to pandas](https://pandas.pydata.org/docs/user_guide/10min.html)
- [Intro to data structures](https://pandas.pydata.org/docs/user_guide/dsintro.html)
- [Essential basic functionality](https://pandas.pydata.org/docs/user_guide/basics.html)
- [Indexing and selecting data](https://pandas.pydata.org/docs/user_guide/indexing.html)
- [Working with missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html)
- [Group by: split-apply-combine](https://pandas.pydata.org/docs/user_guide/groupby.html)
- [Merge, join, concatenate and compare](https://pandas.pydata.org/docs/user_guide/merging.html)
- [Reshaping and pivot tables](https://pandas.pydata.org/docs/user_guide/reshaping.html)
- [Time series / date functionality](https://pandas.pydata.org/docs/user_guide/timeseries.html)
- [Categorical data](https://pandas.pydata.org/docs/user_guide/categorical.html)
- [IO tools](https://pandas.pydata.org/docs/user_guide/io.html)
- [Enhancing performance](https://pandas.pydata.org/docs/user_guide/enhancingperf.html)
- [Scale to large datasets](https://pandas.pydata.org/docs/user_guide/scale.html)

说明：本文按 pandas 官方用户指南结构整理，用 AIOps 场景重新讲解，不复制官方全文。

## 场景开场

你导出了一周告警 CSV：

```text
service,severity,alert_name,created_at,resolved_at
order-api,critical,HighErrorRate,2026-07-01 09:10:00,2026-07-01 09:25:00
order-api,warning,HighLatency,2026-07-01 10:05:00,
payment-api,critical,DatabaseConnectionError,2026-07-01 10:12:00,2026-07-01 10:40:00
```

值班复盘真正想知道的是：

- 哪个服务告警最多？
- critical 告警平均多久恢复？
- 哪些告警一直没有恢复？
- 哪个小时段告警最集中？
- 告警前 30 分钟是否有发布？
- 哪些告警重复率最高？
- 哪些字段缺失，影响了分析？
- 如何把这些数据变成 scikit-learn 可以训练的特征表？

用肉眼看表格很慢。只用 SQL 做探索也不够灵活。pandas 的价值，是把 CSV、JSON、SQL 查询结果读进 Python，在内存里快速清洗、过滤、分组、合并、时间窗口计算和导出报告。

## 一句话人话版

pandas 是 Python 里的表格数据分析工具：它用 Series 和 DataFrame 表示带标签的数据，让你像写代码版 Excel/SQL 一样清洗、筛选、聚合、合并和分析 AIOps 数据。

## 小白可能会问

- DataFrame 和 Excel、SQL 表有什么相似和不同？
- Series、DataFrame、Index、dtype 分别是什么？
- 为什么读取 CSV 后日期经常是 `object`？
- 为什么 `groupby` 是告警统计的核心？
- `merge` 和 SQL 的 `JOIN` 有什么关系？
- `loc`、`iloc`、布尔过滤到底怎么用？
- 缺失值是脏数据，还是有业务含义？
- `SettingWithCopyWarning` 为什么出现？
- pandas 能处理多大数据？什么时候该换 SQL、Spark、Polars？
- pandas 和 scikit-learn 怎么衔接？

## 官方知识地图

pandas 官方用户指南可以按这张地图理解：

```text
pandas（单机表格数据处理库）
  -> Getting started（入门）
     -> 10 minutes to pandas（十分钟入门教程）
     -> intro to data structures（数据结构简介）
  -> Core objects（核心数据对象）
     -> Series（带索引的一维数据）
     -> DataFrame（二维数据表）
     -> Index（索引标签）
     -> dtype（数据类型）
  -> Basic operations（基础操作）
     -> head / tail / info / describe（查看首尾、结构与统计摘要）
     -> select columns（选列）
     -> filter rows（筛选行）
     -> assign new columns（新增列）
     -> sort（排序）
  -> Indexing（按索引选取数据）
     -> []
     -> loc（按标签选取）
     -> iloc（按位置选取）
     -> boolean indexing（布尔条件筛选）
     -> copy vs view（复制与共享视图）
  -> Missing data（缺失数据）
     -> isna（识别缺失值）
     -> fillna（填充缺失值）
     -> dropna（删除缺失项）
     -> nullable dtypes（可空数据类型）
  -> Combining data（合并数据）
     -> concat（拼接）
     -> merge（按键合并）
     -> join（连接）
     -> compare（比较差异）
  -> Grouping and reshaping（分组与变形）
     -> groupby（分组）
     -> aggregate（聚合）
     -> transform（保持对应关系的变换）
     -> pivot_table（透视表）
     -> stack（堆叠） / unstack（展开）
     -> melt（宽表转长表）
  -> Time series（时间序列）
     -> to_datetime（转换为日期时间）
     -> DatetimeIndex（时间索引）
     -> resample（按时间重采样）
     -> rolling（滑动窗口）
     -> time zones（时区）
  -> IO（数据读写）
     -> CSV（逗号分隔表格文件）
     -> JSON（结构化文本数据格式）
     -> Excel（电子表格）
     -> SQL（结构化查询语言）
     -> Parquet（列式数据文件）
  -> Performance and scale（性能与规模）
     -> vectorization（向量化批量计算）
     -> categorical（分类类型）
     -> chunksize（分块行数）
     -> memory usage（内存占用）
```

初学路线：

```text
read data（读取数据）
  -> inspect data（观察数据）
  -> fix dtypes（修正类型）
  -> select/filter（选择与过滤）
  -> handle missing values（处理缺失值）
  -> groupby（分组） aggregate（聚合）
  -> merge with context tables（关联上下文表）
  -> time window analysis（时间窗口分析）
  -> export report（导出报告）
  -> prepare features for ML（为机器学习准备特征）
```

## pandas 在 AIOps 链路中的位置

AIOps 数据链路可以这样看：

```text
MySQL / CSV（逗号分隔表格文件） / JSONL / Kafka export / Prometheus export
  -> pandas（单机表格数据处理库）
      clean（清洗）
      filter（过滤）
      aggregate（聚合）
      join（连接）
      time window（时间窗口）
      feature engineering（特征工程）
  -> report.md / CSV（逗号分隔表格文件） / Parquet（列式数据文件）
  -> scikit-learn（传统机器学习工具库）
  -> FastAPI / dashboard（仪表盘）
```

pandas 适合：

- 告警日报。
- 事故复盘数据分析。
- 告警降噪效果统计。
- 从 MySQL 查询结果生成特征。
- 小到中等规模 CSV/JSON/SQL 数据探索。
- 机器学习前的数据清洗。

pandas 不适合：

- 直接承载生产级高并发服务状态。
- 处理无限流事件。
- 替代 Kafka/Flink 做大规模实时流处理。
- 替代 MySQL 做长期结构化存储。
- 在单机内存不够时硬读超大数据。

## pandas 是什么

pandas 是 Python 数据分析库。它的核心数据结构是：

| 结构 | 维度 | 类比 | AIOps 例子 |
|---|---|---|---|
| `Series` | 一维 | 一列数据 | 每条告警的恢复分钟数 |
| `DataFrame` | 二维 | 表格 / SQL 查询结果 | 告警表 |
| `Index` | 标签轴 | 行标签或列标签 | 时间索引、服务名索引 |

最重要的一句话：

```text
DataFrame = 带行索引和列名的二维表
```

DataFrame 不只是 list of dict。它还带有：

- 列名。
- 行索引。
- 每列 dtype。
- 向量化运算。
- 对齐规则。
- 分组、合并、时间序列能力。

## 安装和环境

建议在虚拟环境里安装：

```bash
python -m venv .venv
. .venv/bin/activate
pip install pandas numpy tabulate sqlalchemy pymysql
```

Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install pandas numpy tabulate sqlalchemy pymysql
```

验证：

```bash
python -c "import pandas as pd; print(pd.__version__)"
```

常用导入：

```python
import numpy as np
import pandas as pd
```

## Series、DataFrame、Index

### Series

Series 是一列带索引的数据。

```python
import pandas as pd

durations = pd.Series([15, None, 28, 5], name="duration_min")
print(durations)
```

你会看到左侧是 index，右侧是值。

```text
0    15.0
1     NaN
2    28.0
3     5.0
Name: duration_min, dtype: float64
```

为什么整数变成 float？因为 `None` / `NaN` 参与后，传统整数列不能表示缺失值，pandas 会转成浮点。

### DataFrame

```python
alerts = pd.DataFrame(
    [
        {"service": "order-api", "severity": "critical", "duration_min": 15},
        {"service": "order-api", "severity": "warning", "duration_min": None},
        {"service": "payment-api", "severity": "critical", "duration_min": 28},
    ]
)

print(alerts)
```

DataFrame 由多列 Series 组成，每列可以有不同 dtype。

### Index

默认 index 是 0、1、2：

```python
print(alerts.index)
```

可以把时间设为 index：

```python
alerts["created_at"] = pd.to_datetime(
    ["2026-07-01 09:10:00", "2026-07-01 10:05:00", "2026-07-01 10:12:00"]
)
alerts = alerts.set_index("created_at")
```

时间索引适合做 resample、rolling 等时间序列分析。

## dtype

dtype 是每列的数据类型。

```python
print(alerts.dtypes)
```

常见 dtype：

| dtype | 含义 | AIOps 例子 |
|---|---|---|
| `object` | 通用 Python 对象，可能混合字符串与其他值；不要据此保证列是纯文本 | 历史数据里的混合列 |
| `str` / `string` | 字符串类型，具体推断与缺失值表现要核对 pandas 版本 | 服务名、告警名 |
| `string` | pandas 字符串类型 | 文本字段 |
| `int64` | 整数 | 次数 |
| `float64` | 浮点 | 错误率、延迟 |
| `bool` | 布尔 | 是否噪声 |
| `datetime64[ns]` | 时间 | 告警时间 |
| `timedelta64[ns]` | 时间差 | 恢复耗时 |
| `category` | 分类 | severity、status |

为什么 dtype 重要？

- 日期如果是 `object`，不能正确做时间窗口。
- 数字如果是字符串，排序会错。
- category 可以节省内存。
- 缺失值会影响整数和布尔类型。

## 读取数据

### CSV

```python
df = pd.read_csv("alerts.csv")
```

常用参数：

```python
df = pd.read_csv(
    "alerts.csv",
    encoding="utf-8",
    parse_dates=["created_at", "resolved_at"],
)
```

| 参数 | 作用 |
|---|---|
| `encoding` | 文件编码 |
| `parse_dates` | 读取时解析日期 |
| `usecols` | 只读部分列 |
| `dtype` | 指定列类型 |
| `chunksize` | 分块读取 |

### JSON Lines

Kafka 或日志导出常见 JSONL：

```python
df = pd.read_json("alerts.jsonl", lines=True)
```

### SQL

```python
from sqlalchemy import create_engine

engine = create_engine("mysql+pymysql://aiops:aiops_pwd@127.0.0.1:3306/aiops_lab")
df = pd.read_sql("SELECT * FROM alerts", engine)
```

建议 SQL 里先过滤时间范围：

```python
df = pd.read_sql(
    """
    SELECT *
    FROM alerts
    WHERE created_at >= NOW() - INTERVAL 7 DAY
    """,
    engine,
)
```

不要把整库数据全读进 pandas 再过滤。

### Parquet

```python
df.to_parquet("alerts.parquet", index=False)
df = pd.read_parquet("alerts.parquet")
```

Parquet 适合保存分析中间结果，通常比 CSV 更保留类型信息，也更适合大一些的数据。上面的安装命令不包含它的读写引擎；运行本节前，在同一虚拟环境安装并锁定兼容的 `pyarrow`，记录 pandas 与引擎版本。没有引擎时报依赖错误，不是文件必然损坏。

## 查看数据

拿到 DataFrame 后，先做体检。

```python
print(df.head())
print(df.tail())
print(df.shape)
print(df.columns)
print(df.info())
print(df.describe(include="all"))
```

每个命令看什么：

| 命令 | 看什么 |
|---|---|
| `head()` | 前几行，确认读入是否正常 |
| `tail()` | 最后几行 |
| `shape` | 行数、列数 |
| `columns` | 字段名 |
| `info()` | dtype、非空数量、内存 |
| `describe()` | 数值分布 |

运维数据分析第一步永远是：

```text
字段是什么？
类型对不对？
有没有缺失？
时间范围是什么？
行数有多少？
```
## 选择和过滤

### 选择列

```python
df["service"]
df[["service", "severity", "created_at"]]
```

单列返回 Series，多列返回 DataFrame。

### loc

`loc` 按标签选择。

```python
df.loc[:, ["service", "severity"]]
df.loc[df["severity"] == "critical", ["service", "alert_name"]]
```

### iloc

`iloc` 按位置选择。

```python
df.iloc[0:5, 0:3]
```

含义：前 5 行，前 3 列。

### 布尔过滤

```python
critical = df[df["severity"] == "critical"]
```

多个条件：

```python
critical_long = df[
    (df["severity"] == "critical")
    & (df["duration_min"] > 10)
]
```

注意：pandas 多条件要用 `&`、`|`，每个条件用括号包起来。

### isin

```python
df[df["service"].isin(["order-api", "payment-api"])]
```

### 字符串过滤

```python
df[df["alert_name"].str.contains("Error", na=False)]
```

`na=False` 表示缺失值不匹配，避免报错。

## 新增和修改列

### 直接新增

```python
df["is_critical"] = df["severity"] == "critical"
```

### assign

```python
df = df.assign(
    is_critical=lambda x: x["severity"] == "critical"
)
```

### np.where

```python
df["action"] = np.where(
    df["severity"] == "critical",
    "page_oncall",
    "record",
)
```

### map

```python
severity_score = {
    "info": 1,
    "warning": 2,
    "critical": 3,
}

df["severity_score"] = df["severity"].map(severity_score)
```

这一步常用于机器学习特征。

## 时间处理

### 转换时间

```python
df["created_at"] = pd.to_datetime(df["created_at"])
df["resolved_at"] = pd.to_datetime(df["resolved_at"])
```

无法解析的值可以设为缺失：

```python
df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")
```

### 计算持续时间

```python
df["duration_min"] = (
    df["resolved_at"] - df["created_at"]
).dt.total_seconds() / 60
```

未恢复告警的 `duration_min` 会是缺失值。

### 提取时间字段

```python
df["hour"] = df["created_at"].dt.hour
df["date"] = df["created_at"].dt.date
df["weekday"] = df["created_at"].dt.day_name()
```

### floor

按小时归桶：

```python
df["hour_bucket"] = df["created_at"].dt.floor("h")
```

### set_index

```python
time_df = df.set_index("created_at").sort_index()
```

时间索引后可以 resample：

```python
hourly = time_df.resample("1h").size().reset_index(name="alert_count")
```

### rolling

```python
hourly["rolling_3h_alerts"] = hourly["alert_count"].rolling(window=3).mean()
```

这可以生成异常检测特征：过去 3 小时平均告警量。

## 缺失值

### 查看缺失

```python
df.isna().sum()
```

### 缺失值的业务含义

| 字段 | 缺失可能表示 |
|---|---|
| `resolved_at` | 告警仍未恢复 |
| `owner` | 服务负责人缺失 |
| `deployment_id` | 没关联到发布 |
| `metric_value` | 告警来源没带指标值 |

缺失值不是都要填掉。先理解业务含义。

### 填充

```python
df["status"] = df["status"].fillna("unknown")
df["owner"] = df["owner"].fillna("unowned")
```

### 删除

```python
df = df.dropna(subset=["service", "created_at"])
```

只删除关键字段缺失的行。

### nullable dtype

pandas 支持可空类型，例如：

```python
df["retry_count"] = df["retry_count"].astype("Int64")
```

注意是大写 `Int64`，不是 NumPy 的 `int64`。

## 分组聚合

pandas 官方把 groupby 解释成 split-apply-combine：

```text
split: 按 key 拆组
apply: 每组计算
combine: 合并结果
```

### 按服务统计告警数

```python
service_counts = (
    df.groupby("service")
      .size()
      .reset_index(name="alert_count")
      .sort_values("alert_count", ascending=False)
)
```

### 按服务和级别统计

```python
by_service_severity = (
    df.groupby(["service", "severity"])
      .size()
      .reset_index(name="alert_count")
)
```

### 多聚合

```python
summary = (
    df.groupby("service")
      .agg(
          alert_count=("alert_name", "count"),
          critical_count=("is_critical", "sum"),
          avg_duration_min=("duration_min", "mean"),
          max_duration_min=("duration_min", "max"),
      )
      .reset_index()
)
```

### transform

`transform` 返回和原 DataFrame 同长度的结果。

```python
df["service_alert_count"] = (
    df.groupby("service")["alert_name"].transform("count")
)
```

用途：给每一行补充所在服务的总告警数。

## 合并数据

AIOps 分析经常需要 enrich。

### merge

告警表：

```python
alerts = pd.DataFrame(
    [
        {"alert_id": 1, "service": "order-api", "created_at": "2026-07-01 09:10:00"},
        {"alert_id": 2, "service": "payment-api", "created_at": "2026-07-01 10:12:00"},
    ]
)
```

服务负责人表：

```python
owners = pd.DataFrame(
    [
        {"service": "order-api", "owner": "team-order"},
        {"service": "payment-api", "owner": "team-payment"},
    ]
)
```

合并：

```python
enriched = alerts.merge(owners, on="service", how="left")
```

`how` 类似 SQL join：

| how | 类似 SQL | 含义 |
|---|---|---|
| `inner` | INNER JOIN | 两边匹配才保留 |
| `left` | LEFT JOIN | 左表全保留 |
| `right` | RIGHT JOIN | 右表全保留 |
| `outer` | FULL OUTER JOIN | 两边都保留 |

### merge_asof

把告警和最近一次发布关联起来。以下是处理片段，`alerts` 与 `deployments` 必须先由后面“告警日报”实验的两个 CSV 读入，不能跳过输入准备直接执行：

```python
alerts["created_at"] = pd.to_datetime(alerts["created_at"])
deployments["deployed_at"] = pd.to_datetime(deployments["deployed_at"])

alerts = alerts.sort_values("created_at")
deployments = deployments.sort_values("deployed_at")

with_deploy = pd.merge_asof(
    alerts,
    deployments,
    left_on="created_at",
    right_on="deployed_at",
    by="service",
    direction="backward",
    tolerance=pd.Timedelta("30min"),
)
```

含义：对每条告警，找同服务在告警前 30 分钟内最近一次发布。

这非常适合 AIOps 变更关联。

### concat

拼接多天 CSV：

```python
frames = [pd.read_csv(path) for path in ["alerts-0701.csv", "alerts-0702.csv"]]
df = pd.concat(frames, ignore_index=True)
```

## 透视和重塑

### pivot_table

```python
pivot = pd.pivot_table(
    df,
    index="service",
    columns="severity",
    values="alert_name",
    aggfunc="count",
    fill_value=0,
)
```

输出类似：

```text
severity     critical  info  warning
service
gateway             0     1        0
order-api           1     0        1
payment-api         1     0        0
```

### melt

宽表转长表：

```python
long_df = pivot.reset_index().melt(
    id_vars="service",
    var_name="severity",
    value_name="alert_count",
)
```

很多画图和机器学习场景更喜欢长表。

## 排序、去重、采样

### sort_values

```python
df.sort_values(["severity_score", "created_at"], ascending=[False, False])
```

### drop_duplicates

```python
deduped = df.drop_duplicates(
    subset=["service", "alert_name", "instance"],
    keep="first",
)
```

告警去重分析可以先定义 fingerprint 字段，再看重复率。

### sample

```python
df.sample(10, random_state=42)
```

用于抽样检查数据质量。

## apply 和向量化

初学者容易滥用 `apply`。

慢写法：

```python
df["is_critical"] = df.apply(lambda row: row["severity"] == "critical", axis=1)
```

更好的向量化写法：

```python
df["is_critical"] = df["severity"] == "critical"
```

原则：

- 优先用 pandas / NumPy 向量化操作。
- 再考虑 `map`、`where`、`cut`。
- 最后才考虑 `apply`。

## category 和内存

severity、status、service 这类低基数字段可以考虑 category：

```python
df["severity"] = df["severity"].astype("category")
df["status"] = df["status"].astype("category")
```

查看内存：

```python
df.info(memory_usage="deep")
```

category 适合：

- 重复值多。
- 类别集合有限。
- 用于 groupby 或过滤。

不适合：

- 每行都几乎唯一的字段，例如 request_id。

## 大数据量边界

pandas 是单机内存工具。

如果数据量大：

### 只读必要列

```python
df = pd.read_csv("alerts.csv", usecols=["service", "severity", "created_at"])
```

### 分块读取

```python
chunks = pd.read_csv("alerts.csv", chunksize=100_000)

parts = []
for chunk in chunks:
    part = chunk.groupby("service").size()
    parts.append(part)

result = pd.concat(parts).groupby(level=0).sum()
```

### 先用 SQL 过滤

```sql
SELECT *
FROM alerts
WHERE created_at >= NOW() - INTERVAL 7 DAY;
```

然后再读入 pandas。

### 该换工具时换工具

| 场景 | 更合适 |
|---|---|
| 单机内存够，探索分析 | pandas |
| SQL 能直接聚合 | MySQL / PostgreSQL |
| 大规模离线分布式 | Spark |
| 流式实时 | Kafka Streams / Flink |
| 类 pandas 但更快探索 | Polars |

## AIOps 入门实验：告警日报

目录：

```text
projects/pandas-alert-report/
  README.md
  requirements.txt
  alerts.csv
  deployments.csv
  analyze_alerts.py
  report.md
```

### requirements.txt

```text
pandas
tabulate
```

### alerts.csv

```csv
alert_id,service,instance,severity,alert_name,created_at,resolved_at
1,order-api,10.0.1.11,critical,HighErrorRate,2026-07-01 09:10:00,2026-07-01 09:25:00
2,order-api,10.0.1.12,warning,HighLatency,2026-07-01 10:05:00,
3,payment-api,10.0.2.21,critical,DatabaseConnectionError,2026-07-01 10:12:00,2026-07-01 10:40:00
4,gateway,10.0.0.8,info,TrafficSpike,2026-07-01 11:00:00,2026-07-01 11:05:00
```

### deployments.csv

```csv
service,version,commit_sha,deployed_at
order-api,1.4.2,abc1234,2026-07-01 08:55:00
payment-api,2.1.0,def5678,2026-07-01 10:00:00
```

### analyze_alerts.py

```python
import pandas as pd

alerts = pd.read_csv(
    "alerts.csv",
    parse_dates=["created_at", "resolved_at"],
)
deployments = pd.read_csv(
    "deployments.csv",
    parse_dates=["deployed_at"],
)

alerts["duration_min"] = (
    alerts["resolved_at"] - alerts["created_at"]
).dt.total_seconds() / 60
alerts["is_critical"] = alerts["severity"] == "critical"
alerts["hour"] = alerts["created_at"].dt.floor("h")

by_service = (
    alerts.groupby("service")
    .agg(
        alert_count=("alert_id", "count"),
        critical_count=("is_critical", "sum"),
        avg_duration_min=("duration_min", "mean"),
    )
    .reset_index()
    .sort_values("alert_count", ascending=False)
)

by_hour = (
    alerts.groupby("hour")
    .size()
    .reset_index(name="alert_count")
)

alerts_sorted = alerts.sort_values("created_at")
deployments_sorted = deployments.sort_values("deployed_at")

with_deploy = pd.merge_asof(
    alerts_sorted,
    deployments_sorted,
    left_on="created_at",
    right_on="deployed_at",
    by="service",
    direction="backward",
    tolerance=pd.Timedelta("30min"),
)

open_alerts = alerts[alerts["resolved_at"].isna()][
    ["alert_id", "service", "severity", "alert_name", "created_at"]
]

with open("report.md", "x", encoding="utf-8") as f:
    f.write("# 告警日报\n\n")
    f.write("## 按服务统计\n\n")
    f.write(by_service.to_markdown(index=False))
    f.write("\n\n## 按小时统计\n\n")
    f.write(by_hour.to_markdown(index=False))
    f.write("\n\n## 未恢复告警\n\n")
    f.write(open_alerts.to_markdown(index=False))
    f.write("\n\n## 告警关联最近 30 分钟发布\n\n")
    f.write(
        with_deploy[
            ["alert_id", "service", "alert_name", "created_at", "version", "commit_sha", "deployed_at"]
        ].to_markdown(index=False)
    )
    f.write("\n")
```

运行：

```bash
pip install -r requirements.txt
python analyze_alerts.py
```

学习点：

- `parse_dates` 让时间字段直接变成 datetime。
- `duration_min` 是从两个时间列计算出来的。
- `groupby().agg()` 生成服务级指标。
- `merge_asof` 把告警和最近发布关联。
- `to_markdown` 生成可提交到 GitHub 的报告。

## pandas 到 scikit-learn

scikit-learn 通常需要一个特征矩阵 `X`。

从 pandas 准备特征：

```python
features = (
    alerts.groupby("service")
    .agg(
        alert_count=("alert_id", "count"),
        critical_count=("is_critical", "sum"),
        avg_duration_min=("duration_min", "mean"),
    )
    .reset_index()
)

features["duration_unknown"] = features["avg_duration_min"].isna()

X = features[["alert_count", "critical_count", "avg_duration_min"]]
```

如果有分类列：

```python
X = pd.get_dummies(features, columns=["service"], drop_first=False)
```

pandas 的角色是把原始数据整理成“每行一个样本，每列一个特征”。这里保留缺失平均耗时，并单列“耗时未知”；后续模型若不接受缺失值，应在只用训练集拟合的预处理流水线里处理，不能把尚未恢复的告警静默改成零耗时。

## 常用 API 字典

### read_csv

```python
pd.read_csv("alerts.csv", parse_dates=["created_at"])
```

作用：读取 CSV。

### read_json

```python
pd.read_json("alerts.jsonl", lines=True)
```

作用：读取 JSON Lines。

### read_sql

```python
pd.read_sql("SELECT * FROM alerts", engine)
```

作用：读取 SQL 查询结果。

### head / info / describe

```python
df.head()
df.info()
df.describe()
```

作用：快速体检数据。

### loc / iloc

```python
df.loc[df["severity"] == "critical", ["service", "alert_name"]]
df.iloc[0:5, 0:3]
```

作用：按标签或位置选择。

### to_datetime

```python
pd.to_datetime(df["created_at"])
```

作用：转时间类型。

### groupby

```python
df.groupby("service").size()
```

作用：分组统计。

### agg

```python
df.groupby("service").agg(alert_count=("alert_id", "count"))
```

作用：多指标聚合。

### merge

```python
alerts.merge(owners, on="service", how="left")
```

作用：表关联。

### merge_asof

```python
pd.merge_asof(alerts, deployments, left_on="created_at", right_on="deployed_at", by="service")
```

作用：按时间找最近匹配。

### pivot_table

```python
pd.pivot_table(df, index="service", columns="severity", values="alert_id", aggfunc="count")
```

作用：透视统计。

### resample

```python
df.set_index("created_at").resample("1h").size()
```

作用：按时间频率重采样。

### rolling

```python
series.rolling(window=3).mean()
```

作用：滚动窗口计算。

### to_csv / to_markdown

```python
df.to_csv("result.csv", index=False)
df.to_markdown(index=False)
```

作用：导出结果。

## 典型故障排查表

| 现象 | 常见原因 | 怎么查 | 怎么修 |
|---|---|---|---|
| 日期字段是 `object` | 没解析时间 | `df.info()` | `pd.to_datetime` 或 `parse_dates` |
| 中文乱码 | 编码不匹配 | 打开文件或试读 | 指定 `encoding` |
| 链式赋值不生效，或旧版本出现 `SettingWithCopyWarning` | 对筛选结果再赋值，误以为修改了原表 | 看版本与实际原表值 | 需要改原表时使用一次 `.loc` 赋值；独立处理则显式创建结果 |
| groupby 结果少了空值 | 默认可能排除 NA 分组 | 看缺失值 | 先 `fillna` |
| 数字排序像字符串 | 数字列是 object | `df.dtypes` | `pd.to_numeric` |
| merge 后行数暴涨 | join key 不唯一 | 检查重复 key | 去重或确认一对多 |
| merge 后很多 NaN | key 不匹配 | 比较 key 值 | 清洗空格、大小写、类型 |
| 内存不够 | 数据太大 | `df.info(memory_usage="deep")` | usecols、chunksize、SQL 过滤 |
| apply 很慢 | 行级 Python 函数 | 看代码 | 改向量化 |
| to_markdown 报错 | 缺少 tabulate | 报错信息 | `pip install tabulate` |

## 面试怎么讲

可以这样讲：

pandas 是 Python 的表格数据分析库，核心对象是 Series 和 DataFrame。AIOps 场景里，我会用 pandas 从 CSV、JSONL、SQL 查询结果中读取告警、事故、发布和 runbook 数据，然后检查 dtype 和缺失值，使用过滤、groupby、merge、pivot_table、resample、rolling 等能力做告警统计、MTTR 计算、变更关联和时间窗口特征。pandas 适合单机探索分析和机器学习前的数据准备，不适合作为生产流处理或长期存储。

## 学习检查清单

- [ ] 我能解释 Series、DataFrame、Index。
- [ ] 我能读取 CSV、JSONL、SQL。
- [ ] 我能用 `head`、`info`、`describe` 体检数据。
- [ ] 我能解释 dtype 的作用。
- [ ] 我能用 `loc`、`iloc`、布尔过滤选择数据。
- [ ] 我能处理缺失值。
- [ ] 我能把字符串时间转成 datetime。
- [ ] 我能计算告警恢复时长。
- [ ] 我能按服务、级别、小时分组聚合。
- [ ] 我能用 `merge` 补充服务负责人。
- [ ] 我能用 `merge_asof` 关联最近发布。
- [ ] 我能用 `pivot_table` 生成报表。
- [ ] 我能用 `resample` 和 `rolling` 做时间窗口。
- [ ] 我能导出 Markdown 报告。
- [ ] 我能说明 pandas 和 scikit-learn 的衔接方式。

## 面试题

1. pandas 是什么？AIOps 中适合做什么？
2. Series 和 DataFrame 有什么区别？
3. Index 是什么？时间索引有什么用？
4. 为什么 dtype 很重要？
5. `loc` 和 `iloc` 有什么区别？
6. pandas 中如何处理缺失值？
7. `groupby` 的 split-apply-combine 是什么意思？
8. `merge` 和 SQL JOIN 有什么关系？
9. `merge_asof` 适合什么 AIOps 场景？
10. 如何计算告警 MTTR？
11. 如何按小时统计告警量？
12. rolling window 可以做什么特征？
13. 为什么 `apply(axis=1)` 可能慢？
14. pandas 数据太大怎么办？
15. pandas 和 SQL、Spark、scikit-learn 分别是什么关系？

## 老师带你重新审视：程序没报错，报表为什么仍然错

我们做告警日报，不是把 CSV 换个样子输出，而是在解释业务事实。先约定一行表示什么：一次采集、一个告警生命周期，还是一次通知？同一告警每五分钟通知一次，如果直接按行计数，就会把“通知次数”写成“事故数量”。这类错误不会触发 Python 异常，只会让结论失真。

学生：“那先去重可以吗？”老师：“先定义去重身份和保留规则。”按 `alert_id` 去重适合稳定告警编号；按服务名去重会丢掉同服务不同事故；按全部字段去重又不能合并时间不同的重发。保存原始输入、处理规则和被剔除记录数量，让读者能反查每一个统计值。

### Index 课堂：pandas 会按标签对齐，不只是按位置相加

Index（索引标签）负责告诉 pandas 每个值属于谁。它和数据库索引不同，不自动代表唯一主键，也不是给查询一定加速的承诺。两个 Series 运算时通常按标签对齐；标签顺序不同，pandas 仍会找到同名标签，缺少对应标签的位置可能得到缺失值。

```python
import pandas as pd
before = pd.Series([10, 20], index=['order', 'pay'])
after = pd.Series([25, 12], index=['pay', 'order'])
print(after - before)  # order 为 2，pay 为 5；不是按两行位置直接相减
```

你可以把它理解成按姓名发成绩，不能因为某同学换了座位就把成绩算给旁边的人。`loc` 按标签选，`iloc` 按整数位置选；标签恰好也是整数时更要分清。奇怪的空值或错位出现后，先看索引、重复标签和排序，再检查算式。

### 缺失值课堂：没有恢复时间不等于恢复用时零

未恢复告警的 `resolved_at` 为空，表示事件仍打开；恢复用时应该暂时未知，不能填零后参与平均。这样做会让问题越严重、未恢复越多，平均恢复时间反而越漂亮。报告应分“已恢复耗时分布”和“未恢复数量及当前年龄”，并说明统计截止时间。

`NaN`、`NaT`、`pd.NA` 是不同数据类型中的缺失表示。判断用 `isna()`，不要写 `value == NaN`；填补前问缺失原因，计算后报告被排除多少条。计数函数也要注意：`size()` 统计行，`count()` 通常统计各列非空项，它们不是同义词。

日期解析加 `errors='coerce'` 会把解析失败变成 `NaT`，只是把错误转成可检查数据，不代表修好了。紧接着统计失败数量并保存原值样本，不能悄悄丢掉。时区先明确源字段是 UTC、当地时间还是已带偏移，再统一转换；对无时区时间直接当 UTC 可能产生整整八小时的错位。

### 关联课堂：一次错误合并可以把告警翻十倍

`merge` 按键关联两表。左边同一服务有两条告警，右边同一服务有三个负责人版本，直接关联会得到六行。不是 pandas 随机重复，而是多对多关系在展开。用 `validate='many_to_one'` 表达“很多告警对应一个当前负责人”的预期，可以让错误在生成报表前暴露。

下面是完整可回收实验，前提安装 pandas。保存为 `merge_lesson.py`，正常数据先跑通，再故意制造重复维表：

```python
import pandas as pd
alerts = pd.DataFrame({'id':[1,2], 'service':['order','order']})
owners = pd.DataFrame({'service':['order'], 'owner':['team-a']})
normal = alerts.merge(owners, on='service', how='left', validate='many_to_one')
assert len(normal) == 2
print('normal rows:', len(normal))

bad_owners = pd.concat([owners, owners], ignore_index=True)
try:
    alerts.merge(bad_owners, on='service', validate='many_to_one')
except pd.errors.MergeError:
    print('DETECTED: 负责人表的服务键不唯一')

fixed = bad_owners.drop_duplicates()
result = alerts.merge(fixed, on='service', how='left', validate='many_to_one', indicator=True)
assert len(result) == len(alerts)
assert result['_merge'].eq('both').all()
print('recovered rows:', len(result))
```

预期正常 2 行、捕获错误、恢复 2 行。这里两条负责人完全相同，因此精确去重合理；真实数据如果负责人不同，必须按生效时间或权威记录处理，不能任意保留第一条。`indicator=True` 增加匹配来源列，帮助查看未关联记录。失败先检查右表重复键、键类型、空格和缺失；结束只需删除教学脚本，不影响原始日报数据。

### 时间窗口课堂：关联到发布不等于发布导致事故

`merge_asof` 可以找某告警之前最近一次发布，但需要按时间键满足排序要求，并使用服务分组与明确的容许时间窗。时间最近只是候选关联；还要核对变更对象、链路、指标变化和未变更对照服务，才能形成根因假设。

生成模型特征时，滚动平均只能使用预测时刻之前的信息。中心窗口或把当前标签窗口后的数据算进去，会泄漏未来。重采样要约定桶边界、标签落左还是落右、空桶如何表示；没有数据与真实零次请求应分别表达。把这些规则写在报表说明中，别人才能复算。

### 版本与生产课堂：写法可复现，报告可恢复

pandas 3.0 默认采用 Copy-on-Write（写时复制）语义；历史文章里常见的 `SettingWithCopyWarning` 不能作为所有版本的统一行为说明。需要修改原表时使用清晰的一次 `.loc[条件, 列] = 值`，不要依赖链式赋值的副作用；保留 `pd.__version__` 并查对应版本的 [写时复制指南](https://pandas.pydata.org/docs/user_guide/copy_on_write.html)。

内存预算不仅是 CSV 文件大小。解析后的对象、临时列、合并输出、排序和复制都可能放大峰值。使用 `memory_usage(deep=True)` 查看对象列，先在数据源过滤列和时间范围；分块算法也必须能正确合并统计。分块均值不能直接再取平均，应保存和与有效计数；分位数更不能随意平均各块分位数。

定时报表的高可用主要体现在可重跑与结果发布：输入快照、代码和参数固定，先写临时结果，校验行数、时间范围与关键统计，再发布新版本。失败保留上一份已验证报告，标注时间，不让空文件覆盖正常报告。涉及用户提供的 CSV，还要限制文件大小、列数与内容输出，避免内存耗尽或把敏感字段写进日志。

### 面试回答练习

30 秒：pandas 用带标签的表结构完成单机数据处理。我先定义行粒度、类型、时区与缺失含义，用受约束的合并和分组统计生成可复算报表，并监控输入、异常记录和输出质量。

3 分钟：用告警日报讲 `read_csv` 到类型检查、去重、维表关联、恢复时间、时间窗口和输出；展示重复负责人故障实验，说明为什么不随意 `drop_duplicates`；再讲内存峰值、分块统计、可重跑和模型特征的时间泄漏。

追问报表突然翻倍：比较原始行数、唯一事件数和每次合并后的行数，检查键基数。追问 MTTR 变好是否真实：核对未恢复事件、统计口径与时区。追问为何不用 Spark：在单机预算与时效满足时 pandas 更容易迭代，超出内存、并发或实时需求再选其他执行体系，不能只按数据文件名字决定。

## 老师的第二堂课：把告警日报做成可审计的数据产品

### 第一站：先写数据合同，再打开文件

数据合同不是很高级的软件。你先写五句话就够用：一行是一条告警生命周期；`alert_id` 是唯一编号；时间采用带时区的 UTC；严重程度只能是规定枚举；恢复时间为空表示尚未恢复。这样的约定能让加载、清洗、关联和汇总使用同一把尺。没有合同，三个同学用三种方式清洗同一文件，都可能得到看起来合理但彼此冲突的报告。

读取 CSV 时，字符串 `0012` 可能是设备编号，不应因为只包含数字就变成整数 `12`。身份证、邮编、业务主键、端口、计数看着都像数字，语义却不同：编号通常不需要加减，计数需要。为编号指定字符串类型，为测量值执行明确的数值转换，再用合法范围验证。对于错误率要说清是 `0.05` 还是 `5%`，对于容量要说清字节还是 GiB，不能依赖列名猜测。

初学者常问：“读取时一把全部转成字符串最安全吗？”它能避免部分误推断，却把时间计算、排序和数值运算推迟了。字符串 `100` 排在 `20` 前面并不是数值大小顺序。更可靠的方式是先保留原始输入，在经过类型校验的工作表上分析，转换失败进入隔离记录。隔离记录至少带原始行号、字段、错误原因和输入批次，避免修复时找不到源头。

验证不是只写 `assert len(df) > 0`。日报可能某天合法地没有告警；相反，十万行也可能全是重复通知。你需要核对时间覆盖、主键非空与唯一、枚举合法、恢复时间不早于发生时间、来源系统符合预期，以及输入与有效、隔离、过滤三类记录是否守恒。一个小表格记录每一步行数，比只在最后打印 `success` 更能说明数据没有悄悄流失。

### 第二站：看懂分组输出的每个分母

`groupby` 的思路是先按键分堆、对每堆计算、再组合结果。它不是按屏幕上的连续行分堆，同一服务的行即使隔很远仍可归在一组。分组键可以是服务，也可以是服务加时间桶；粒度越细，输出数量和空组合问题就越明显。开始分析前先口述：“我要一行一个服务一天”，再用列与唯一性检查证明结果真的如此。

看一个容易骗人的例子：甲服务有 10 次请求失败 1 次，乙服务有 1000 次请求失败 10 次。两个失败率分别是 10% 和 1%，直接平均得到 5.5%；全平台真正的请求失败率应为总失败 `11` 除以总请求 `1010`，约 1.09%。两者回答不同问题：前者把每个服务等权，后者把每个请求等权。报告必须命名清楚，不可把“服务平均失败率”写成“全平台请求失败率”。

恢复时间同样要交代分母。按告警条数平均会让高频告警服务占更大权重；先求每个事故的恢复时间再平均，回答事故层面问题；按严重等级分层又是第三种问题。pandas 能准确执行你给的算式，但不能替你选择业务口径。老师希望你先解释分母，再解释函数。

`agg` 适合把一组压成一行，例如求服务的告警数和平均耗时；`transform` 则把组级计算结果对齐回每个原始行，例如每条告警所在服务的总量。前者改变粒度，后者保留粒度。若后续还要查原始告警，别在聚合后假装每一行仍是一条事件。你可以显式保留事件明细和服务摘要两个变量，变量名就能提醒自己不混用。

### 第三站：基础实验补课——别把未来发布关联给过去告警

前提是已安装 pandas；下面全部使用内存合成数据，不访问真实系统。保存为 `time_join_lesson.py`，执行 `python time_join_lesson.py`。先读预测：两条告警分别发生在 09:10 和 09:20；发布发生在 09:00 和 09:15。正确的历史视角中，前一条只能看到 v1，后一条才能看到 v2。

```python
import pandas as pd

alerts = pd.DataFrame({
    'id': [1, 2], 'service': ['order', 'order'],
    'at': pd.to_datetime(['2026-01-01T09:10:00Z', '2026-01-01T09:20:00Z']),
})
changes = pd.DataFrame({
    'service': ['order', 'order'], 'version': ['v1', 'v2'],
    'deployed_at': pd.to_datetime(['2026-01-01T09:00:00Z', '2026-01-01T09:15:00Z']),
})

def associate(direction):
    return pd.merge_asof(
        alerts.sort_values('at'), changes.sort_values('deployed_at'),
        left_on='at', right_on='deployed_at', by='service',
        direction=direction, tolerance=pd.Timedelta('30min'),
    )

normal = associate('backward')
assert normal['version'].tolist() == ['v1', 'v2']
assert (normal['deployed_at'] <= normal['at']).all()
print('normal:', normal['version'].tolist())

bad = associate('nearest')  # 故障注入：更近不等于当时已经发生
future = bad['deployed_at'] > bad['at']
assert future.sum() == 1
print('DETECTED future matches:', int(future.sum()))

fixed = associate('backward')
assert (fixed['deployed_at'] <= fixed['at']).all()
print('recovered:', fixed['version'].tolist())
```

预期正常 `['v1', 'v2']`，故障检测到一条未来关联，恢复后再次得到 `['v1', 'v2']`。09:10 距 09:15 只有五分钟，比距离 09:00 的十分钟更近，因此 `nearest` 会选未来记录；算法完全按你的要求工作，错误在要求不符合业务时间方向。这比背“必须用 backward”更重要：有些传感器校准任务确实允许两侧最近邻，不能把一种业务规则硬套给所有分析。

`by='service'` 要求只在同一服务里找，`tolerance` 限制最多允许跨多远的时间，左右时间键必须按官方要求排序。若报未排序，先看时间键是否整体递增，而不是只在每个服务内部递增；若全部关联为空，核对时区、容许窗口、服务名和类型。相关参数边界见 [merge_asof 官方接口](https://pandas.pydata.org/docs/reference/api/pandas.merge_asof.html)。

清理时结束进程即可，数据随内存释放；教学脚本和输出可保留在实验目录。不要删除日报原始文件。本实验的成功证据是业务断言，不是只看到脚本退出码为零。继续挑战：插入一条没有历史发布的服务，预期关联字段为空并进入“未找到发布候选”，而不是强行关联到其他服务。

### 第四站：窗口、缺测与计数器重置

一分钟窗口不等于最近一分钟。前者可能是固定边界的 09:00 到 09:01，后者在 09:00:37 查询时可能是 08:59:37 到 09:00:37。`resample` 常用于规则时间桶，`rolling` 常用于随每个时刻移动的窗口。边界开闭、窗口标签和最少有效观测数必须明确；同一条恰好卡在整分钟的样本，不能在两个窗口都算或两个都不算。

对分钟计数求和通常有意义，对累计计数直接求和通常没有意义。累计请求数像汽车里程表，你需要相邻读数的变化和时间间隔；进程重启后计数归零又会造成负差。此时应判断重置、缺测和数据源变化，不能把负值绝对值当请求量。监控系统原生计数器函数通常更适合处理这类语义，pandas 报表仍要保留采集口径说明。

缺测和零值也不同。某分钟没有任何请求可能是业务空闲，也可能采集器断线；仅有请求日志就无法区分这两者。应关联采集健康、服务存活或计划采样清单，再决定空桶是否可填零。线上流量低谷如果被错误补零后参与模型训练，模型会把采集故障当正常低负载，这就是数据质量通过分析链传到 AIOps 决策的例子。

时区问题别只看显示格式。无时区时间先说明原本在哪个地区，再使用正确的本地化语义；带时区时间可以转换展示。跨夏令时地区可能出现同一本地时刻两次或某些时间不存在，处理策略要明确。生产保存统一时间轴，报表展示时转换为读者时区，并把时间窗口的起止与包含规则写进标题或元数据。

### 第五站：单机内存里的容量与恢复

排序需要重新组织数据，合并可能制造比两边都大的结果，对象字符串可能比磁盘上的压缩数据占更多内存。内存达到上限时，被系统终止的 Python 进程不一定留下完整异常栈。排障要同时看任务输入量、峰值内存、系统退出原因和输出文件状态。不要把“没捕获异常”解释为程序正常结束。

第一层优化是减少工作：只读需要列、在数据库过滤日期、先汇总再传输、避免重复合并。第二层才是类型与算子选择，例如低基数类别、向量化、减少无意义复制。第三层才考虑分块或更大机器。不能先把所有数据 `concat` 到一个大表，再说用了 `chunksize` 所以不会占内存；分块中间结果也要有可控大小。

分块聚合要求结果可组合。计数和总和容易合并，平均需要同时保留和与有效计数，方差需要更完整的组合状态，精确分位数可能需要保留大量数据或换专门算法。去重也要区分块内和跨块：同一编号可能出现在不同文件或批次，仅每块去重不能保证全局唯一。需要稳定分区规则、外部状态或数据源约束，并将这一成本纳入容量。

一次日报发布最好遵循“输入快照—生成临时结果—业务校验—发布版本”的顺序。重试使用同一批次编号，不覆盖原始输入；文件、代码、参数和依赖版本共同构成可复现条件。多实例同时运行时，必须有任务唯一性或发布互斥机制，避免两个报告抢同一路径。pandas 本身不会给文件写入提供数据库事务。

### 面试黑板题：日报变好，值班同学却更忙

题目给出三个现象：日报平均恢复时间下降一半；工单积压增加；最近上线了自动补缺和维表关联。你先提出可检验假设：未恢复耗时被填零、重复维表放大某些样本、统计日期因时区变化错位。分别保留原始输入与新旧转换的中间表，统计未恢复比例、每次合并行数和事件时间范围。

如果证据显示 `fillna(0)` 只发生在恢复耗时列，先恢复“未知不计入已恢复耗时”的口径，并增加未恢复年龄指标；重算受影响日期而非只修今天。若维表键重复，先确认版本生效规则再关联，不盲目去重。缓解期间保留上一份可信日报并注明数据延迟，不发布看似完整的错误结果。

追问“怎样防止再次出现”：在管道中写粒度、唯一性、时间方向和计数守恒断言；设置未知值比例及行数变化阈值；把故障脚本加入回归测试；抽取固定金样本由业务负责人确认口径。再追问“高可用怎么做”：输入与结果版本化、任务幂等、失败重跑、发布互斥和旧版回退，比给单个 DataFrame 加锁更切题。最后展示原始样本到修复报告的证据链，证明你理解的是数据产品，不只是熟悉几个函数。

## 交付前的最后一课：输出文件也有合同

日报生成成功，不代表打开的人会按同一方式理解。导出 CSV 时要明确编码、分隔符、时区和小数格式；导出数据库时明确列类型和主键；导出 Parquet 时记录 Schema 与读取依赖。一个本来作为字符串保存的服务编号，交给电子表格软件后可能再次被推断成数字，所以关键编号应带类型说明，接收方也要按合同导入。

如果输出包含用户可控制的文本，并会在电子表格中打开，要考虑以等号等字符开头的内容被当公式解释的风险。防护应在面向表格的导出层按目标工具规则实现，同时保留原始数据；不要为了安全把原始证据无痕改写。文件大小、行数和字段长度也要有上限，避免异常输入使一次日报生成占满磁盘或让读者无法打开。

Markdown 报告同样需要对非可信文本做恰当处理，避免用户字段改变表格结构或被误当成可信链接。脱敏不仅是删密码，还包括内网地址、请求参数、人员身份与原始工单描述。学习证据用合成数据；生产日报按内部权限发布，不能因为它只是统计文件就默认允许公开。

### 分位数为什么不能像总和一样汇总

甲实例有九十九次请求耗时一毫秒，一次耗时一千毫秒；乙实例有上万次请求耗时三毫秒。各实例的高分位再平均，既忽略请求数，也丢失分布形状。分位数是排序位置的概念，不是能直接加起来的总量。你需要原始样本、适当的可合并分布摘要或监控系统支持的直方图口径，不能把几个 P99 做平均后命名为整体 P99。

即使样本都在 DataFrame 里，窗口长度不同、采样率不同和缺测也会影响解释。老师建议在报告边上写清“以请求为样本”还是“以每分钟汇总为样本”。前者的 P99 是请求延迟分位，后者是分钟统计值的分位，这两个数都可能合法，但不能互换。面试能指出这一点，通常比会写 `quantile` 更有价值。

### 一页发布检查单怎样写才有用

先列输入文件哈希、覆盖区间和行粒度，再列类型失败、主键重复、未关联与未恢复数量；随后记录输出粒度、守恒核对和关键指标金样本；最后记录发布位置、生成批次和回退版本。检查项必须能失败，例如主键重复超过零就停止发布，或者缺测超阈值则标记“不完整”而不是照常给趋势结论。

当别人复现你的报告时，应能从 README 找到 Python 与 pandas 版本、安装方式、精确运行命令、预期样本和清理范围。不要把自己执行过的实际结果与文章里的预期混写。数据源不可公开时，提交同 Schema 的合成样本和校验脚本，比提交一张看不懂来源的截图更适合作为 GitHub 学习证据。

## 老师再检查三个容易漏掉的数据边界

### 空关联键不是“不可能匹配”

学过数据库的同学可能预测：左右表的服务名都缺失，它们不会相等。pandas 的 `merge` 对空键有不同于通常 SQL 连接的行为：两侧的空键可能匹配。如果左边有三条未标明服务的告警，右边有两条未标明服务的负责人记录，合并后可能得到六条看起来有负责人的记录。程序顺利运行，业务含义却完全不成立。官方 [merge 接口](https://pandas.pydata.org/docs/reference/api/pandas.merge.html) 特别说明了这个差异。

因此关联前要分别检查键为空、键重复、键格式漂移。为空的告警可以进入“待识别服务”的独立输出，不能用一个空字符串把它自动接到某个团队；为负责人表补默认团队也需要明确业务授权。`validate="many_to_one"` 能发现维表键不唯一，却不能替你证明这个唯一键有意义。即使右表只有一个空键，校验通过也不代表分配正确。

下面是另一个完全在内存中运行的课堂实验。前提是当前环境可以导入 pandas。把它作为一个独立 Python 片段执行，不连接数据库，不读写文件。先预测错误关联会产生几行，再观察断言。

```python
import pandas as pd

events = pd.DataFrame({"alert_id": [1, 2], "service": [None, None]})
owners = pd.DataFrame({"service": [None, None], "owner": ["team-a", "team-b"]})
wrong = events.merge(owners, on="service", how="left")
assert len(wrong) == 4
quarantine = events[events["service"].isna()].copy()
valid = events[events["service"].notna()].copy()
valid_owners = owners[owners["service"].notna()].copy()
fixed = valid.merge(valid_owners, on="service", how="left", validate="many_to_one")
assert len(fixed) == 0 and len(quarantine) == 2
print("wrong=4 accepted=0 quarantine=2")
```

预期是错误结果四行，正式接收零行，隔离两行，而不是为了让报表好看强行留下两行。验证时既检查总数，也检查每个告警编号出现次数和隔离原因；清理只需结束进程。若结果不同，先检查 pandas 版本、输入是否被之前的单元格修改、是否无意间给空键填过值。修复的代价是暂时减少覆盖率，收益是避免给错误团队发送告警；报告应同时披露隔离比例。

### 写时复制是对象语义，不是数据库事务

写时复制主要回答“从原表取得的新对象被修改时，原表是否受影响”。它不是把一次日报任务里的所有操作装进一个可以回滚的事务，也不保证外部数据库和输出文件一起成功。pandas 3.0 的默认语义让派生对象修改与原对象分离，但 `alias = df` 只是把同一个对象换一个名字；通过别名修改仍在操作同一对象。先分清对象身份，再讨论底层内存是否暂时共享。

这对排障很重要：如果函数先修改传入表，再遇到异常退出，调用者手里的对象可能已经变了。明确函数是返回新表还是原地修改，并在边界增加断言，比事后到处补 `.copy()` 更可靠。复制整张大表可能增加峰值内存；写时复制也不是所有操作都不复制，排序、合并、类型转换和后续写入仍可能分配新内存。观测应包含进程峰值、输入规模与处理中间表形状，不能只看最终结果的内存估计。

数据工程中的“回退”通常是重新指向上一份已验证产物，再用固定输入重跑新版本，而不是指望 Python 异常自动撤销一切。本课日报使用文件独占创建模式：已有 `report.md` 时明确失败，避免误覆盖历史证据。重跑请在新的独立实验目录执行，或先确认旧文件确实只属于本次练习并改名归档。生产任务应先在唯一运行目录生成、完成核对后发布清单；发布指针切换的原子性要由所在文件系统或对象存储协议保证。

### 从一张表到可信批任务还差什么

单机 pandas 没有服务器副本选主，也不自动接管失败任务。生产高可用由调度器、输入存储和产物发布协议共同实现：输入可重新读取，任务标识可去重，失败能够重跑，读者只看到已经完成校验的版本。多个工作进程同时生成同一天日报时，必须由外部租约或唯一任务约束防止互相覆盖，不能把进程内锁当成跨机器的协调机制。

安全边界也在进程外。CSV 可能包含用户姓名、工单详情或敏感地址；只读分析身份不应拥有源表删除权限。中间文件权限、日志内容和提交到仓库的样本都应脱敏。依赖升级先拿固定小样本验证列类型、空值、排序、分组的分类列行为、时区和导出格式，再拿代表性大样本测内存；结果一致但内存峰值翻倍，也可能不适合直接上线。保留旧环境锁定文件与输入快照，才能重建上一份报表，而不只是回退一行脚本。

容量估算从“读入之后是什么类型”开始。磁盘上的压缩文件大小不能等同于内存大小；一列本来可以用整数表达，却混入一个错误字符串，可能改变表示成本和计算路径。先对样本测量，再按峰值中间表数和并发任务数留余量；如果业务查询可以在数据库端筛选并聚合，就不要先全量下载再过滤。若必须分块，先判断运算能否安全组合：计数和总和可相加，平均数要同时保存总和与数量，精确中位数不能简单平均各块中位数。

### 三分钟答案：如何证明这份告警日报值得信任

可以这样回答：“我首先把日报定义成一个有版本的数据产品，固定事件时间、统计截止点、时区和告警唯一编号。读取时检查字段、类型、空键与重复；恢复时间缺失表示未恢复，不直接当零。关联负责人先验证维表唯一性，并把未知服务隔离。关联发布采用同服务、只看过去、限定时间容差的规则，结果只能形成调查线索，不自动宣布根因。”

“随后我为每一步保留数量守恒证据：原始数等于接收数加隔离数，普通维表连接前后告警数不变，已恢复耗时与未恢复年龄分开解释。输出先写到独立运行目录，校验后再发布；失败保留上一份可信结果并明确新鲜度，不把空表当正常零告警。依赖升级用固定输入对比结果、列类型和峰值内存，回退依赖和产物版本可以分别执行。”

追问“测试都通过为什么还会错”，回答测试只覆盖写出的合同，合同本身也可能有业务错误；需要值班人员抽查真实样本和历史事故对照。追问“什么时候改用分布式处理”，回答先确认瓶颈在数据规模、并行需求还是错误的数据路径，再比较数据库下推、列式查询引擎与分布式框架的运维成本，不以行数作为唯一分界线。

## 本课 GitHub 学习证据

学完这篇，建议留下这些证据：

1. 一个 `alerts.csv`。
2. 一个 `deployments.csv`。
3. 一个 `analyze_alerts.py`。
4. 一个自动生成的 `report.md`。
5. 一段 `merge_asof` 关联告警和发布的代码。
6. 一段 `groupby().agg()` 生成服务级指标的代码。
7. 一篇 README，解释 Series、DataFrame、groupby、merge、resample、rolling 在 AIOps 告警分析中的作用。
