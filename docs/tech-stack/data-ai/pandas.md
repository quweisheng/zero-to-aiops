# pandas

## 官方资料

- [pandas documentation](https://pandas.pydata.org/docs/)
- [10 minutes to pandas](https://pandas.pydata.org/docs/user_guide/10min.html)
- [Intro to data structures](https://pandas.pydata.org/docs/user_guide/dsintro.html)
- [Group by: split-apply-combine](https://pandas.pydata.org/docs/user_guide/groupby.html)

> 学习说明：本篇按 pandas 官方“10 minutes to pandas”的主线，从 Series、DataFrame、选择、过滤、缺失值、分组、合并和读写文件开始，改造成 AIOps 数据分析练习。

## 是什么

pandas 是 Python 里最常用的数据分析库。它的核心数据结构是：

- `Series`：一列带索引的数据。
- `DataFrame`：一张二维表，类似 Excel 表格或 SQL 查询结果。

AIOps 工程师会用 pandas 做这些事：

- 清洗告警 CSV。
- 统计服务告警数量。
- 合并告警、变更、工单数据。
- 计算 MTTR、告警压缩率、重复告警率。
- 为 scikit-learn 准备训练数据。

## 核心原理

pandas 的核心是“带标签的表格计算”：

```text
CSV / JSON / SQL
  -> DataFrame
      -> select columns
      -> filter rows
      -> clean missing values
      -> groupby aggregate
      -> merge tables
      -> export result
```

你可以把 pandas 理解成“Python 里的可编程 Excel + SQL 聚合工具”。

## 安装

建议使用虚拟环境：

```bash
python -m venv .venv
. .venv/bin/activate
pip install pandas numpy
```

Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install pandas numpy
```

验证：

```bash
python -c "import pandas as pd; print(pd.__version__)"
```

## Series 和 DataFrame

```python
import pandas as pd

s = pd.Series([1, 3, 5, None, 6, 8])
print(s)
```

创建 DataFrame：

```python
import pandas as pd

alerts = pd.DataFrame(
    [
        {"service": "order-api", "severity": "critical", "duration_min": 15},
        {"service": "order-api", "severity": "warning", "duration_min": 0},
        {"service": "payment-api", "severity": "critical", "duration_min": 28},
    ]
)

print(alerts)
```

## 读取数据

CSV：

```python
import pandas as pd

df = pd.read_csv("alerts.csv")
print(df.head())
```

JSON Lines：

```python
df = pd.read_json("alerts.jsonl", lines=True)
```

MySQL 查询结果：

```python
import pandas as pd
from sqlalchemy import create_engine

engine = create_engine("mysql+pymysql://aiops:aiops_pwd@127.0.0.1:3306/aiops_lab")
df = pd.read_sql("SELECT * FROM alerts", engine)
```

安装 MySQL 依赖：

```bash
pip install sqlalchemy pymysql
```

## 查看数据

```python
print(df.head())
print(df.tail())
print(df.info())
print(df.describe())
print(df.columns)
print(df.shape)
```

运维数据第一步永远是“看清楚字段、类型、缺失值、行数”。

## 选择列和过滤行

选择列：

```python
df[["service", "severity", "duration_min"]]
```

过滤 critical：

```python
critical = df[df["severity"] == "critical"]
```

过滤持续时间大于 10 分钟：

```python
long_alerts = df[df["duration_min"] > 10]
```

多个条件：

```python
critical_long = df[(df["severity"] == "critical") & (df["duration_min"] > 10)]
```

## 时间处理

告警数据通常有时间字段。读取后要转成时间类型：

```python
df["created_at"] = pd.to_datetime(df["created_at"])
df["resolved_at"] = pd.to_datetime(df["resolved_at"])
```

计算恢复时间：

```python
df["duration_min"] = (df["resolved_at"] - df["created_at"]).dt.total_seconds() / 60
```

按小时统计告警：

```python
df["hour"] = df["created_at"].dt.floor("h")
hourly = df.groupby("hour").size().reset_index(name="alert_count")
```

## 缺失值

查看缺失值：

```python
print(df.isna().sum())
```

填充缺失：

```python
df["status"] = df["status"].fillna("unknown")
```

删除关键字段缺失的行：

```python
df = df.dropna(subset=["service", "created_at"])
```

对 AIOps 来说，缺失值通常不是“脏数据”这么简单，它可能代表告警未恢复、字段采集失败、数据源版本不一致。处理前要先理解业务含义。

## 分组聚合

按服务统计：

```python
service_counts = (
    df.groupby("service")
      .size()
      .reset_index(name="alert_count")
      .sort_values("alert_count", ascending=False)
)
```

按服务和级别统计：

```python
by_service_severity = (
    df.groupby(["service", "severity"])
      .size()
      .reset_index(name="alert_count")
)
```

计算平均恢复时间：

```python
mttr = (
    df.dropna(subset=["duration_min"])
      .groupby("service")["duration_min"]
      .mean()
      .reset_index(name="avg_mttr_min")
)
```

## 合并数据

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
print(enriched)
```

AIOps 经常做 enrichment：给告警补充服务负责人、业务线、集群、等级、最近变更等上下文。

## 透视表

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

这适合做日报：

```text
service      critical  warning  info
order-api    3         12       5
payment-api  1         4        0
```

## 导出结果

CSV：

```python
service_counts.to_csv("service-alert-counts.csv", index=False)
```

Excel：

```python
service_counts.to_excel("service-alert-counts.xlsx", index=False)
```

Markdown：

```python
print(service_counts.to_markdown(index=False))
```

导出 Markdown 很适合直接贴到 GitHub 学习记录里。

## AIOps 中的作用

pandas 是 AIOps 入门数据分析的桥：

```text
MySQL / CSV / JSONL / Kafka exported data
  -> pandas cleaning
  -> pandas feature engineering
  -> scikit-learn anomaly detection
  -> report / API / GitHub learning record
```

你可以先用 pandas 把“人眼看不清的数据”变成清晰表格，再进入机器学习。

## 入门练习：告警日报

目录建议：

```text
projects/pandas-alert-report/
  README.md
  alerts.csv
  analyze_alerts.py
  report.md
```

`alerts.csv`：

```csv
service,severity,alert_name,created_at,resolved_at
order-api,critical,HighErrorRate,2026-07-01 09:10:00,2026-07-01 09:25:00
order-api,warning,HighLatency,2026-07-01 10:05:00,
payment-api,critical,DatabaseConnectionError,2026-07-01 10:12:00,2026-07-01 10:40:00
gateway,info,TrafficSpike,2026-07-01 11:00:00,2026-07-01 11:05:00
```

`analyze_alerts.py`：

```python
import pandas as pd

df = pd.read_csv("alerts.csv")
df["created_at"] = pd.to_datetime(df["created_at"])
df["resolved_at"] = pd.to_datetime(df["resolved_at"])
df["duration_min"] = (df["resolved_at"] - df["created_at"]).dt.total_seconds() / 60

by_service = df.groupby("service").size().reset_index(name="alert_count")
by_severity = df.groupby("severity").size().reset_index(name="alert_count")
mttr = (
    df.dropna(subset=["duration_min"])
      .groupby("service")["duration_min"]
      .mean()
      .reset_index(name="avg_mttr_min")
)

with open("report.md", "w", encoding="utf-8") as f:
    f.write("# 告警日报\n\n")
    f.write("## 按服务统计\n\n")
    f.write(by_service.to_markdown(index=False))
    f.write("\n\n## 按级别统计\n\n")
    f.write(by_severity.to_markdown(index=False))
    f.write("\n\n## 平均恢复时间\n\n")
    f.write(mttr.to_markdown(index=False))
    f.write("\n")
```

安装依赖：

```bash
pip install pandas tabulate
python analyze_alerts.py
```

## 常见故障

### 日期字段是 object

```python
df.info()
```

如果时间字段不是 `datetime64`，使用：

```python
df["created_at"] = pd.to_datetime(df["created_at"])
```

### 中文乱码

读取 CSV 时指定编码：

```python
df = pd.read_csv("alerts.csv", encoding="utf-8")
```

如果来自 Excel 中文 Windows 环境，有时是：

```python
df = pd.read_csv("alerts.csv", encoding="gbk")
```

### SettingWithCopyWarning

优先使用 `.copy()`：

```python
critical = df[df["severity"] == "critical"].copy()
critical["is_critical"] = True
```

### 数据量太大

学习阶段 pandas 没问题。生产环境如果 CSV 很大：

- 先用 SQL 做过滤。
- 用 `chunksize` 分块读。
- 只读取必要列。
- 需要分布式再考虑 Spark / Flink。

## 学习证据

学完后，在 GitHub 留下：

- 一份样例 `alerts.csv`。
- 一个 pandas 分析脚本。
- 自动生成的 `report.md`。
- README 解释 `groupby`、`merge`、时间处理。
- 至少一张分析结果截图。

