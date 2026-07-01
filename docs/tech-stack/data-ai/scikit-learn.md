# scikit-learn

## 官方资料

- [scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [Novelty and Outlier Detection](https://scikit-learn.org/stable/modules/outlier_detection.html)
- [IsolationForest API](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html)
- [Model persistence](https://scikit-learn.org/stable/model_persistence.html)

> 学习说明：本篇围绕 AIOps 最常见的入门机器学习任务“异常检测”展开，重点学习 scikit-learn 的数据准备、训练、预测、评估和模型保存。

## 是什么

scikit-learn 是 Python 机器学习库，提供分类、回归、聚类、降维、特征处理、模型评估、异常检测等能力。

AIOps 初学者最值得先学的是异常检测：

- 指标突然升高。
- 接口延迟偏离常态。
- 某个服务告警量异常。
- 某台机器 CPU、内存、磁盘模式和其他机器不同。

这里不先追求复杂深度学习，而是用 scikit-learn 训练一个可以解释、可以复现、可以放进 GitHub 项目的小模型。

## 核心原理

机器学习最小流程：

```text
raw data
  -> clean data
  -> feature matrix X
  -> train model
  -> predict / score
  -> evaluate
  -> save model
```

scikit-learn 的 API 很统一：

```python
model.fit(X_train)
model.predict(X_test)
model.score_samples(X_test)
```

官方异常检测文档区分两个概念：

| 概念 | 训练数据 | 用法 |
|---|---|---|
| outlier detection | 训练数据里已经混有异常点 | 从污染数据里识别离群点 |
| novelty detection | 训练数据基本干净 | 判断新数据是否不像正常模式 |

AIOps 里更常见的是 outlier detection，因为真实运维数据通常已经混有异常。

## 架构

一个 AIOps 异常检测小项目：

```text
Prometheus query / CSV
  -> pandas DataFrame
  -> feature engineering
      -> request_rate
      -> error_rate
      -> p95_latency_ms
      -> cpu_usage
  -> scikit-learn model
      -> IsolationForest
  -> anomaly score
  -> alert / report / MySQL
```

你要重点掌握：

- 特征是什么。
- 模型输入是什么形状。
- 模型输出是什么含义。
- 阈值如何影响误报和漏报。

## 安装

```bash
python -m venv .venv
. .venv/bin/activate
pip install pandas numpy scikit-learn joblib matplotlib
```

Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install pandas numpy scikit-learn joblib matplotlib
```

验证：

```bash
python -c "import sklearn; print(sklearn.__version__)"
```

## 第一个异常检测实验

### 1. 准备样例数据

`metrics.csv`：

```csv
timestamp,service,request_rate,error_rate,p95_latency_ms,cpu_usage
2026-07-01 10:00:00,order-api,1000,0.01,120,0.45
2026-07-01 10:01:00,order-api,1020,0.01,130,0.46
2026-07-01 10:02:00,order-api,980,0.02,125,0.44
2026-07-01 10:03:00,order-api,990,0.01,128,0.47
2026-07-01 10:04:00,order-api,1010,0.02,132,0.45
2026-07-01 10:05:00,order-api,700,0.35,1800,0.92
2026-07-01 10:06:00,order-api,1005,0.01,124,0.43
2026-07-01 10:07:00,order-api,995,0.02,127,0.46
```

### 2. 训练 IsolationForest

`detect_anomaly.py`：

```python
import pandas as pd
from sklearn.ensemble import IsolationForest

df = pd.read_csv("metrics.csv")

features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]
X = df[features]

model = IsolationForest(
    n_estimators=100,
    contamination=0.15,
    random_state=42,
)

df["prediction"] = model.fit_predict(X)
df["anomaly_score"] = model.decision_function(X)
df["is_anomaly"] = df["prediction"] == -1

print(df[["timestamp", "service", "error_rate", "p95_latency_ms", "anomaly_score", "is_anomaly"]])
```

运行：

```bash
python detect_anomaly.py
```

输出中 `is_anomaly=True` 的行就是模型认为异常的样本。

## IsolationForest 原理

IsolationForest 的直觉很适合运维理解：

- 正常点通常聚在一起，需要多次随机切分才能被单独分出来。
- 异常点通常远离大多数点，很容易被随机切分隔离。
- 越容易被隔离，越可能是异常。

关键参数：

| 参数 | 含义 | 学习建议 |
|---|---|---|
| `n_estimators` | 树的数量 | 100 起步即可 |
| `contamination` | 预计异常比例 | 告诉模型大概有多少异常 |
| `random_state` | 随机种子 | 实验要固定，结果可复现 |
| `max_samples` | 每棵树采样数量 | 默认通常够用 |

输出：

| 方法 | 输出 | 含义 |
|---|---|---|
| `fit_predict(X)` | `1` 或 `-1` | `-1` 代表异常 |
| `decision_function(X)` | 分数 | 越低越异常 |
| `score_samples(X)` | 原始分数 | 可用于排序 |

## 特征工程

模型效果主要取决于特征，而不是模型名字。

AIOps 常见特征：

| 特征 | 来源 | 含义 |
|---|---|---|
| `request_rate` | Prometheus | 请求量 |
| `error_rate` | Prometheus | 错误率 |
| `p95_latency_ms` | Prometheus / tracing | 95 分位延迟 |
| `cpu_usage` | node exporter | CPU 使用率 |
| `memory_usage` | node exporter | 内存使用率 |
| `disk_io` | node exporter | 磁盘 IO |
| `alert_count_5m` | Alertmanager / MySQL | 5 分钟告警数 |
| `deploy_count_1h` | CI/CD | 1 小时变更次数 |

构造滚动窗口特征：

```python
df["error_rate_rolling_mean_3"] = df["error_rate"].rolling(window=3).mean()
df["latency_rolling_max_3"] = df["p95_latency_ms"].rolling(window=3).max()
df = df.dropna()
```

构造相对变化：

```python
df["latency_pct_change"] = df["p95_latency_ms"].pct_change()
df["error_rate_pct_change"] = df["error_rate"].pct_change()
df = df.dropna()
```

## 数据标准化

一些模型对量纲敏感，比如 SVM、KMeans。IsolationForest 对量纲没有那么敏感，但学习阶段仍要知道标准化。

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(df[features])
```

配合模型：

```python
from sklearn.pipeline import Pipeline
from sklearn.ensemble import IsolationForest

pipeline = Pipeline(
    steps=[
        ("scaler", StandardScaler()),
        ("model", IsolationForest(contamination=0.15, random_state=42)),
    ]
)

df["prediction"] = pipeline.fit_predict(df[features])
```

## 保存模型

训练后保存：

```python
import joblib

joblib.dump(model, "isolation_forest.joblib")
```

加载：

```python
model = joblib.load("isolation_forest.joblib")
```

如果用了 `Pipeline`，建议保存整个 pipeline：

```python
joblib.dump(pipeline, "anomaly_pipeline.joblib")
```

这样标准化和模型不会分离。

## 评估

异常检测经常缺少标签，所以评估不能只靠准确率。

如果有人工标注：

```python
from sklearn.metrics import classification_report

print(classification_report(df["label"], df["prediction"]))
```

如果没有标签，就做运维视角评估：

- 异常点是否对应真实事故？
- 是否大量误报正常流量波动？
- 是否漏掉明显尖峰？
- 阈值调高后误报是否下降？
- 结果是否能被值班同事理解？

可以把异常分数导出给人工 review：

```python
df.sort_values("anomaly_score").to_csv("anomaly_review.csv", index=False)
```

## AIOps 中的作用

scikit-learn 位于 AIOps 的“分析判断”层：

```text
metrics/logs/alerts
  -> pandas cleaning
  -> feature engineering
  -> scikit-learn anomaly model
  -> anomaly score
  -> rule or human review
  -> incident / runbook / LLM summary
```

它不替代 Prometheus 告警规则。更合理的关系是：

- Prometheus 做明确阈值告警。
- scikit-learn 做模式偏离和辅助判断。
- 人工反馈帮助改进特征和阈值。

## 入门练习：指标异常检测器

目录建议：

```text
projects/sklearn-anomaly-detector/
  README.md
  metrics.csv
  train.py
  detect.py
  anomaly_review.csv
  model/
```

要求：

1. `train.py` 读取 `metrics.csv`。
2. 使用 `IsolationForest` 训练。
3. 保存 `model/anomaly_pipeline.joblib`。
4. `detect.py` 加载模型并输出异常点。
5. README 解释每个特征的含义。

`detect.py` 示例：

```python
import joblib
import pandas as pd

features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]

df = pd.read_csv("metrics.csv")
model = joblib.load("model/anomaly_pipeline.joblib")

df["prediction"] = model.predict(df[features])
df["is_anomaly"] = df["prediction"] == -1

print(df[df["is_anomaly"]])
```

## 常见故障

### 输入有字符串

scikit-learn 大多数模型需要数字矩阵。

错误方向：

```python
X = df[["service", "error_rate"]]
```

修复：

```python
X = df[["error_rate", "p95_latency_ms", "cpu_usage"]]
```

服务名这种类别字段需要编码后再用。

### NaN 报错

检查：

```python
print(df.isna().sum())
```

处理：

```python
df = df.dropna(subset=features)
```

或：

```python
df[features] = df[features].fillna(0)
```

### 结果每次不一样

设置随机种子：

```python
IsolationForest(random_state=42)
```

### 异常太多或太少

调整：

```python
IsolationForest(contamination=0.05)
```

`contamination` 越大，模型越容易判异常。

## 学习证据

学完后，在 GitHub 留下：

- `metrics.csv` 样例数据。
- `train.py` 和 `detect.py`。
- 保存的模型文件，或说明如何生成模型。
- `anomaly_review.csv`。
- README 解释 IsolationForest 原理、特征含义和异常结果。

