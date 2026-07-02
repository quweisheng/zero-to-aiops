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
pandas
  -> Getting started
     -> 10 minutes to pandas
     -> intro to data structures
  -> Core objects
     -> Series
     -> DataFrame
     -> Index
     -> dtype
  -> Basic operations
     -> head / tail / info / describe
     -> select columns
     -> filter rows
     -> assign new columns
     -> sort
  -> Indexing
     -> []
     -> loc
     -> iloc
     -> boolean indexing
     -> copy vs view
  -> Missing data
     -> isna
     -> fillna
     -> dropna
     -> nullable dtypes
  -> Combining data
     -> concat
     -> merge
     -> join
     -> compare
  -> Grouping and reshaping
     -> groupby
     -> aggregate
     -> transform
     -> pivot_table
     -> stack / unstack
     -> melt
  -> Time series
     -> to_datetime
     -> DatetimeIndex
     -> resample
     -> rolling
     -> time zones
  -> IO
     -> CSV
     -> JSON
     -> Excel
     -> SQL
     -> Parquet
  -> Performance and scale
     -> vectorization
     -> categorical
     -> chunksize
     -> memory usage
```

初学路线：

```text
read data
  -> inspect data
  -> fix dtypes
  -> select/filter
  -> handle missing values
  -> groupby aggregate
  -> merge with context tables
  -> time window analysis
  -> export report
  -> prepare features for ML
```

## pandas 在 AIOps 链路中的位置

AIOps 数据链路可以这样看：

```text
MySQL / CSV / JSONL / Kafka export / Prometheus export
  -> pandas
      clean
      filter
      aggregate
      join
      time window
      feature engineering
  -> report.md / CSV / Parquet
  -> scikit-learn
  -> FastAPI / dashboard
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
| `object` | 通常是字符串或混合对象 | 服务名、告警名 |
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

Parquet 适合保存分析中间结果，通常比 CSV 更保留类型信息，也更适合大一些的数据。

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

把告警和最近一次发布关联起来：

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

with open("report.md", "w", encoding="utf-8") as f:
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
    .fillna(0)
    .reset_index()
)

X = features[["alert_count", "critical_count", "avg_duration_min"]]
```

如果有分类列：

```python
X = pd.get_dummies(features, columns=["service"], drop_first=False)
```

pandas 的角色是把原始数据整理成“每行一个样本，每列一个特征”。

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
| `SettingWithCopyWarning` | 对切片赋值 | 看警告行 | `.copy()` 或 `.loc` |
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

## 学习证据

学完这篇，建议留下这些证据：

1. 一个 `alerts.csv`。
2. 一个 `deployments.csv`。
3. 一个 `analyze_alerts.py`。
4. 一个自动生成的 `report.md`。
5. 一段 `merge_asof` 关联告警和发布的代码。
6. 一段 `groupby().agg()` 生成服务级指标的代码。
7. 一篇 README，解释 Series、DataFrame、groupby、merge、resample、rolling 在 AIOps 告警分析中的作用。
