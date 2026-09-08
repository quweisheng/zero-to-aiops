# scikit-learn

> 目标：不是只会复制 `IsolationForest` 示例，而是能理解 scikit-learn 的 estimator API、`fit` / `predict` / `transform`、训练/测试拆分、预处理、Pipeline、特征矩阵、指标评估、异常检测、聚类、模型保存、常见陷阱，并能把 pandas 处理后的 AIOps 数据变成可验证的机器学习原型。

## 官方资料

优先读这些 scikit-learn 官方资料：

- [scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [Getting Started](https://scikit-learn.org/stable/getting_started.html)
- [Supervised learning](https://scikit-learn.org/stable/supervised_learning.html)
- [Unsupervised learning](https://scikit-learn.org/stable/unsupervised_learning.html)
- [Model selection and evaluation](https://scikit-learn.org/stable/model_selection.html)
- [Metrics and scoring](https://scikit-learn.org/stable/modules/model_evaluation.html)
- [Pipelines and composite estimators](https://scikit-learn.org/stable/modules/compose.html)
- [Preprocessing data](https://scikit-learn.org/stable/modules/preprocessing.html)
- [Imputation of missing values](https://scikit-learn.org/stable/modules/impute.html)
- [Novelty and Outlier Detection](https://scikit-learn.org/stable/modules/outlier_detection.html)
- [IsolationForest API](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html)
- [Clustering](https://scikit-learn.org/stable/modules/clustering.html)
- [train_test_split](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.train_test_split.html)
- [Model persistence](https://scikit-learn.org/stable/model_persistence.html)
- [Common pitfalls and recommended practices](https://scikit-learn.org/stable/common_pitfalls.html)
- [Choosing the right estimator](https://scikit-learn.org/stable/machine_learning_map.html)

说明：本文按 scikit-learn 官方用户指南结构整理，用 AIOps 场景重新讲解，不复制官方全文。

## 场景开场

固定阈值告警有一个老问题：

```text
CPU > 80% 就告警
```

但真实系统里，异常不一定是绝对值高：

- 某台机器平时 CPU 只有 10%，突然到 50%，也可能异常。
- 某个接口平时 P95 100ms，突然到 500ms，但没超过 1s 阈值。
- 某个服务告警量没到全局阈值，但比自己历史高很多。
- 某次发布后错误率、延迟、重启数一起轻微上升，单个指标看不明显。

scikit-learn 的价值，是让你把这些指标变成特征矩阵，用传统机器学习先做一个可复现、可解释、可评估的异常检测原型。

它不是替代监控规则，也不是让模型直接自动修复生产。它更像一个“辅助判断层”：帮助你发现模式偏离，再交给告警、复盘、人工反馈和 runbook 流程验证。

## 一句话人话版

scikit-learn 是 Python 的传统机器学习工具箱：它用统一的 estimator 接口训练模型、转换特征、预测结果和评估效果，适合快速做异常检测、分类、聚类、回归等 AIOps 原型。

## 小白可能会问

- 为什么 AIOps 入门先学 scikit-learn，而不是直接深度学习？
- `X` 和 `y` 到底是什么？
- `fit`、`predict`、`transform`、`fit_transform` 分别做什么？
- 什么是 estimator？为什么 scikit-learn API 看起来都很像？
- 为什么要划分训练集和测试集？
- Pipeline 为什么能避免数据泄漏？
- IsolationForest 为什么能找异常？
- 异常检测、分类、聚类有什么区别？
- 模型评估为什么不能只看 accuracy？
- 模型保存后能不能随便加载？

## 官方知识地图

scikit-learn 官方用户指南可以按这张地图理解：

```text
scikit-learn（传统机器学习工具库）
  -> Getting started（入门）
     -> estimator（估计器）
     -> fit（从训练数据学习）
     -> predict（预测）
     -> transform（按已拟合规则变换特征）
     -> X shape: n_samples（样本数） x n_features（特征数）
  -> Supervised learning（监督学习）
     -> classification（分类）
     -> regression（回归）
     -> linear models（线性模型）
     -> SVM（支持向量机）
     -> trees（决策树）
     -> ensembles（集成模型）
  -> Unsupervised learning（无监督学习）
     -> clustering（聚类）
     -> dimensionality reduction（降维）
     -> novelty and outlier detection（新颖性与离群检测）
  -> Model selection and evaluation（模型选择与评估）
     -> train_test_split（训练测试集拆分）
     -> cross-validation（交叉验证）
     -> metrics（指标）
     -> hyperparameter tuning（超参数搜索）
     -> threshold tuning（阈值调整）
  -> Dataset transformations（数据集变换）
     -> preprocessing（预处理）
     -> imputation（缺失值填补）
     -> encoding categorical features（类别特征编码）
     -> Pipeline（串联处理流水线）
     -> ColumnTransformer（按列应用不同变换）
  -> Computing with scikit-learn（计算资源使用）
     -> performance（性能）
     -> parallelism（并行度）
     -> scaling to larger data（扩展到更大数据）
  -> Model persistence（模型持久化）
     -> pickle/joblib/skops/ONNX（不同模型持久化或交换格式）
     -> security and version compatibility（安全与版本兼容）
  -> Common pitfalls（常见误区）
     -> inconsistent preprocessing（训练预测预处理不一致）
     -> data leakage（数据泄漏）
     -> bad train/test evaluation（错误的训练测试评估）
```

初学路线：

```text
pandas feature table（pandas 特征数据表）
  -> X and y（特征矩阵与标签）
  -> train/test split（训练集与测试集拆分）
  -> preprocessing（预处理）
  -> model（模型）
  -> Pipeline（串联处理流水线）
  -> fit（从训练数据学习）
  -> predict（预测） / decision_function（判别分数接口） / score_samples（样本评分接口）
  -> metrics（指标） / review
  -> persist model（保存模型）
  -> AIOps report（智能运维报告）
```

## scikit-learn 在 AIOps 链路中的位置

```text
Prometheus / MySQL / Kafka export / CSV（逗号分隔表格文件）
  -> pandas cleaning（用 pandas 清洗）
  -> feature engineering（特征工程）
  -> scikit-learn（传统机器学习工具库）
      anomaly detection（异常检测）
      classification（分类）
      clustering（聚类）
      regression（回归）
  -> anomaly score（异常分数） / class（预测类别） / cluster（聚类簇） / prediction（预测结果）
  -> report / dashboard（仪表盘） / alert（告警） enrichment
  -> human（人工） feedback（反馈）
```

适合 scikit-learn 的 AIOps 入门任务：

| 任务 | 类型 | 示例 |
|---|---|---|
| 指标异常检测 | 无监督 / outlier detection | CPU、错误率、延迟模式偏离 |
| 告警噪声分类 | 监督分类 | true_positive vs noise |
| 服务聚类 | 无监督聚类 | 按告警模式分组服务 |
| 恢复时间预测 | 回归 | 预测告警大概多久恢复 |
| 特征重要性分析 | 模型解释辅助 | 哪些指标最影响事故风险 |

不适合：

- 没有数据质量就直接上模型。
- 用模型替代基础监控。
- 模型输出直接触发高风险自动修复。
- 没有评估、没有人工反馈、没有版本记录就上线。

## 机器学习基础：X、y、样本、特征

scikit-learn 里最重要的输入是 `X`。

官方 Getting Started 里强调，`X` 通常是二维矩阵：

```text
shape = (n_samples, n_features)
```

也就是：

```text
每一行 = 一个样本
每一列 = 一个特征
```
AIOps 示例：

| timestamp | service | request_rate | error_rate | p95_latency_ms | cpu_usage |
|---|---|---:|---:|---:|---:|
| 10:00 | order-api | 1000 | 0.01 | 120 | 0.45 |
| 10:01 | order-api | 1020 | 0.01 | 130 | 0.46 |
| 10:05 | order-api | 700 | 0.35 | 1800 | 0.92 |

特征矩阵：

```python
features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]
X = df[features]
```

如果有标签，比如人工标注这行是否异常：

```python
y = df["is_incident"]
```

| 名称 | 含义 |
|---|---|
| `X` | 特征矩阵 |
| `y` | 目标标签 |
| sample | 一行样本 |
| feature | 一列特征 |
| label / target | 要学习或预测的答案 |

## Estimator API

scikit-learn 的模型和转换器都遵守一套统一接口。

### estimator

Estimator 是可以从数据中学习参数的对象。

例子：

```python
from sklearn.ensemble import RandomForestClassifier

clf = RandomForestClassifier(random_state=42)
clf.fit(X_train, y_train)
```

`RandomForestClassifier` 是 estimator。

### fit

`fit` 表示从数据中学习。

```python
model.fit(X_train, y_train)
```

无监督模型没有 `y`：

```python
model.fit(X_train)
```

### predict

`predict` 表示输出预测结果。

```python
y_pred = model.predict(X_test)
```

分类模型输出类别，异常检测常输出 `1` 或 `-1`。

### transform

`transform` 表示把数据变换成另一种表示。

```python
X_scaled = scaler.transform(X_test)
```

例如标准化、缺失值填充、one-hot 编码。

### fit_transform

训练转换器并立即转换：

```python
X_train_scaled = scaler.fit_transform(X_train)
```

注意：只能对训练集 `fit_transform`，测试集应该只 `transform`，否则会数据泄漏。

## 任务类型

### 监督学习

有标签 `y`。

| 类型 | 问题 | AIOps 例子 |
|---|---|---|
| classification | 预测类别 | 告警是噪声还是真故障 |
| regression | 预测数值 | 预测恢复时间 |

### 无监督学习

没有标签 `y`。

| 类型 | 问题 | AIOps 例子 |
|---|---|---|
| clustering | 自动分组 | 按告警模式聚类服务 |
| dimensionality reduction | 降维 | 可视化高维指标 |
| outlier detection | 找离群点 | 找异常指标点 |

### novelty detection 和 outlier detection

scikit-learn 官方异常检测文档区分：

| 概念 | 训练数据 | 用法 |
|---|---|---|
| novelty detection | 训练数据基本干净 | 学正常模式，再判断新数据是否异常 |
| outlier detection | 训练数据中混有异常 | 从污染数据里识别离群点 |

AIOps 更常见的是 outlier detection，因为真实历史指标里往往已经混有故障点。

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

### metrics.csv

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

### detect_anomaly.py

```python
import pandas as pd
from sklearn.ensemble import IsolationForest

df = pd.read_csv("metrics.csv", parse_dates=["timestamp"])

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

print(
    df[
        [
            "timestamp",
            "service",
            "error_rate",
            "p95_latency_ms",
            "anomaly_score",
            "is_anomaly",
        ]
    ]
)
```

运行：

```bash
python detect_anomaly.py
```

解释输出：

| 列 | 含义 |
|---|---|
| `prediction` | `1` 表示正常，`-1` 表示异常 |
| `anomaly_score` | 异常分数，越低越异常 |
| `is_anomaly` | 转成布尔，方便阅读 |

## IsolationForest 深讲

IsolationForest 的直觉：

```text
异常点通常远离正常群体
  -> 用随机切分更容易把它单独隔离出来
  -> 被隔离所需路径更短
  -> 更可能是异常
```

官方 API 文档里也强调，它通过随机选择特征和分割值来隔离样本。

关键参数：

| 参数 | 含义 | AIOps 建议 |
|---|---|---|
| `n_estimators` | 森林里树的数量 | 100 起步 |
| `max_samples` | 每棵树训练采样数 | 默认通常够用 |
| `contamination` | 预计异常比例 | 需要结合业务调 |
| `random_state` | 随机种子 | 实验必须固定 |
| `n_jobs` | 并行数 | 数据多时可设 |

常用方法：

| 方法 | 输出 | 用法 |
|---|---|---|
| `fit(X)` | 训练模型 | 学习数据分布 |
| `predict(X)` | `1` / `-1` | 判断正常/异常 |
| `fit_predict(X)` | 训练后预测 | 实验方便 |
| `decision_function(X)` | 决策分数 | 越低越异常 |
| `score_samples(X)` | 原始分数 | 可排序 review |

注意：

- `contamination` 不是“真实异常比例”的魔法答案。
- 异常检测结果必须结合人工 review。
- 模型发现的是统计离群，不等于一定是生产事故。

## 特征工程

模型效果首先取决于特征。

### 原始指标特征

| 特征 | 含义 |
|---|---|
| `request_rate` | 请求量 |
| `error_rate` | 错误率 |
| `p95_latency_ms` | P95 延迟 |
| `cpu_usage` | CPU 使用率 |
| `memory_usage` | 内存使用率 |
| `restart_count` | 重启次数 |

### 告警窗口特征

```python
df["error_rate_rolling_mean_3"] = df["error_rate"].rolling(window=3).mean()
df["latency_rolling_max_3"] = df["p95_latency_ms"].rolling(window=3).max()
df["request_rate_pct_change"] = df["request_rate"].pct_change()
df = df.dropna()
```

### 变更特征

来自 CI/CD 或 MySQL：

| 特征 | 含义 |
|---|---|
| `deploy_count_1h` | 过去 1 小时部署次数 |
| `minutes_since_deploy` | 距离最近一次发布分钟数 |
| `rollback_recently` | 最近是否回滚 |

### 告警历史特征

| 特征 | 含义 |
|---|---|
| `alert_count_5m` | 5 分钟告警数 |
| `critical_count_1h` | 1 小时 critical 数 |
| `same_alert_count_24h` | 24 小时同类告警数 |

## 预处理

### 缺失值

很多 estimator 不接受 NaN。

```python
from sklearn.impute import SimpleImputer

imputer = SimpleImputer(strategy="median")
X_imputed = imputer.fit_transform(X_train)
```

### 标准化

一些模型对尺度敏感：

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_train)
```

受影响明显的模型：

- SVM。
- KMeans。
- Logistic Regression。
- KNN。
- PCA。

树模型和 IsolationForest 对尺度没那么敏感，但 Pipeline 里保留标准化有时有助于切换模型。

### 类别编码

模型通常需要数值特征。服务名、环境、等级这类类别要编码。

```python
from sklearn.preprocessing import OneHotEncoder

encoder = OneHotEncoder(handle_unknown="ignore")
```

## Pipeline

Pipeline 把预处理和模型串起来。

为什么重要？

```text
训练时做了什么预处理
预测时也必须做同样预处理
```
否则线上特征空间会变，模型效果会坏。

### 数值特征 pipeline

```python
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]

pipeline = Pipeline(
    steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("model", IsolationForest(contamination=0.15, random_state=42)),
    ]
)

pipeline.fit(df[features])
df["prediction"] = pipeline.predict(df[features])
```

### ColumnTransformer

如果既有数值特征又有类别特征：

```python
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

numeric_features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]
categorical_features = ["service", "environment"]

preprocess = ColumnTransformer(
    transformers=[
        (
            "numeric",
            Pipeline(
                steps=[
                    ("imputer", SimpleImputer(strategy="median")),
                    ("scaler", StandardScaler()),
                ]
            ),
            numeric_features,
        ),
        (
            "categorical",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features,
        ),
    ]
)

model = Pipeline(
    steps=[
        ("preprocess", preprocess),
        ("classifier", RandomForestClassifier(random_state=42)),
    ]
)
```

这就是“生产可复用”的基本形态。

## 训练集、测试集和数据泄漏

监督学习必须评估泛化能力。

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)
```

### 数据泄漏

错误做法：

```python
scaler.fit(X)
X_scaled = scaler.transform(X)
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y)
```

问题：标准化已经看过测试集。

正确做法：

```python
pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)
```

Pipeline 会保证预处理只在训练集 `fit`，测试集只 `transform`。

### 时间序列注意

AIOps 指标有时间顺序。很多时候不能随机拆分。

更合理：

```text
前 80% 时间训练
后 20% 时间测试
```
避免“未来数据泄漏到过去”。

## 模型评估

### 分类指标

如果你有人工标签：

```python
from sklearn.metrics import classification_report, confusion_matrix

y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))
```

关键指标：

| 指标 | 含义 | 告警场景 |
|---|---|---|
| precision | 预测为异常里有多少是真的 | 误报压力 |
| recall | 真实异常里抓住多少 | 漏报风险 |
| f1-score | precision 和 recall 平衡 | 综合指标 |
| confusion matrix | TP/FP/FN/TN | 看错误类型 |

### 为什么 accuracy 不够

如果 1000 条里只有 10 条真故障，一个模型全预测正常，也有 99% accuracy。

但它漏掉所有故障。

告警场景更关心：

- 漏报多少。
- 误报多少。
- 值班能不能承受。
- 是否能提前发现事故。

### 无标签异常检测评估

没有标签时：

- 导出异常 TopN 给人工 review。
- 看异常点是否对应事故、发布、日志错误。
- 对比固定阈值告警。
- 用历史复盘事件做弱标签。
- 记录误报/漏报反馈。

```python
review = df.sort_values("anomaly_score").head(50)
review.to_csv("anomaly_review.csv", index=False)
```

## 其他常见模型

### LocalOutlierFactor

适合找局部密度异常。

```python
from sklearn.neighbors import LocalOutlierFactor

model = LocalOutlierFactor(n_neighbors=20, contamination=0.05)
df["prediction"] = model.fit_predict(X)
```

注意：LOF 默认更偏 outlier detection，不像普通模型那样直接对新样本 predict。要做 novelty detection 需要设置 `novelty=True` 并理解差异。

### OneClassSVM

```python
from sklearn.svm import OneClassSVM

model = OneClassSVM(nu=0.05, kernel="rbf", gamma="scale")
model.fit(X_train)
```

适合小到中等数据，参数较敏感，大数据上可能较慢。

### KMeans

服务聚类：

```python
from sklearn.cluster import KMeans

kmeans = KMeans(n_clusters=3, random_state=42)
df["cluster"] = kmeans.fit_predict(X)
```

用途：

- 按告警模式给服务分组。
- 找出和其他服务行为很不同的服务。

### RandomForestClassifier

有人工标签后可以做噪声分类：

```python
from sklearn.ensemble import RandomForestClassifier

clf = RandomForestClassifier(random_state=42)
clf.fit(X_train, y_train)
```

用途：

- 告警是否噪声。
- 告警是否会升级事故。
- runbook 推荐类别。

## 模型保存和加载

### joblib

```python
import joblib

joblib.dump(pipeline, "model/anomaly_pipeline.joblib")
pipeline = joblib.load("model/anomaly_pipeline.joblib")
```

建议保存整个 Pipeline，而不是只保存模型。

### 安全提醒

scikit-learn 官方模型持久化文档提醒，pickle/joblib 这类格式加载时有安全风险。不要加载不可信来源的模型文件。

项目 README 里应写清：

- scikit-learn 版本。
- Python 版本。
- 训练数据来源。
- 特征列表。
- 模型参数。
- 如何重新训练。

### 版本兼容

模型文件不一定能跨 scikit-learn 版本长期稳定加载。

更稳做法：

- 保存 `requirements.txt`。
- 保存训练脚本。
- 保存特征说明。
- 能从数据重新训练模型。

## AIOps 入门实验：指标异常检测器

目录：

```text
projects/sklearn-anomaly-detector/
  README.md
  requirements.txt
  metrics.csv
  train.py
  detect.py
  anomaly_review.csv
  model/
```

### requirements.txt

```text
pandas
numpy
scikit-learn
joblib
```

### train.py

```python
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]

df = pd.read_csv("metrics.csv", parse_dates=["timestamp"])
X = df[features]

pipeline = Pipeline(
    steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("model", IsolationForest(contamination=0.15, random_state=42)),
    ]
)

pipeline.fit(X)

Path("model").mkdir(exist_ok=True)
joblib.dump(pipeline, "model/anomaly_pipeline.joblib")
print("saved model/anomaly_pipeline.joblib")
```

### detect.py

```python
import joblib
import pandas as pd

features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]

df = pd.read_csv("metrics.csv", parse_dates=["timestamp"])
pipeline = joblib.load("model/anomaly_pipeline.joblib")

df["prediction"] = pipeline.predict(df[features])
df["anomaly_score"] = pipeline.decision_function(df[features])
df["is_anomaly"] = df["prediction"] == -1

review = df.sort_values("anomaly_score")
review.to_csv("anomaly_review.csv", index=False)

print(review[["timestamp", "service", "anomaly_score", "is_anomaly"]])
```

运行：

```bash
pip install -r requirements.txt
python train.py
python detect.py
```

README 要解释：

- 每个特征含义。
- `contamination` 为什么这么设。
- 哪些点被判异常。
- 是否符合人工直觉。
- 误报/漏报如何记录。

## 常用 API 字典

### train_test_split

```python
train_test_split(X, y, test_size=0.2, random_state=42)
```

作用：拆分训练和测试数据。

### StandardScaler

```python
StandardScaler()
```

作用：把特征标准化为均值 0、方差 1 附近。

### SimpleImputer

```python
SimpleImputer(strategy="median")
```

作用：填补缺失值。

### OneHotEncoder

```python
OneHotEncoder(handle_unknown="ignore")
```

作用：把类别特征转成数值特征。

### Pipeline

```python
Pipeline([("scaler", StandardScaler()), ("model", IsolationForest())])
```

作用：串联预处理和模型。

### ColumnTransformer

```python
ColumnTransformer([...])
```

作用：对不同列应用不同预处理。

### IsolationForest

```python
IsolationForest(contamination=0.05, random_state=42)
```

作用：无监督异常检测。

### classification_report

```python
classification_report(y_test, y_pred)
```

作用：输出 precision、recall、f1-score。

### confusion_matrix

```python
confusion_matrix(y_test, y_pred)
```

作用：查看分类错误分布。

### joblib.dump / load

```python
joblib.dump(pipeline, "model.joblib")
joblib.load("model.joblib")
```

作用：保存和加载模型。

## 典型故障排查表

| 现象 | 常见原因 | 怎么查 | 怎么修 |
|---|---|---|---|
| 输入有字符串报错 | 模型需要数值矩阵 | `X.dtypes` | OneHotEncoder 或删掉文本列 |
| NaN 报错 | 特征有缺失 | `df.isna().sum()` | SimpleImputer |
| 训练好测试差 | 过拟合或数据泄漏 | 对比训练/测试指标 | Pipeline、交叉验证 |
| 每次结果不同 | 随机性 | 看 random_state | 固定 random_state |
| 异常太多 | contamination 太高 | 看异常比例 | 调低 contamination |
| 异常太少 | contamination 太低 | 人工 review | 调高或改特征 |
| accuracy 很高但没用 | 类别极不平衡 | 看混淆矩阵 | 看 precision/recall |
| 线上预测报维度错 | 特征列不一致 | 打印 columns | 保存特征列表，Pipeline |
| 加载模型失败 | 版本不兼容 | 看 sklearn 版本 | 固定 requirements，重训 |
| 结果不可解释 | 特征没记录 | 看 README | 写清特征来源和含义 |

## 面试怎么讲

可以这样讲：

scikit-learn 是传统机器学习库，核心是统一的 estimator API。模型或转换器通过 `fit` 从数据中学习，通过 `predict` 输出预测，通过 `transform` 做特征变换。AIOps 场景里，我会先用 pandas 清洗指标、告警、变更数据，构造 `X` 特征矩阵，再用 IsolationForest、KMeans 或分类模型做异常检测、聚类或告警噪声分类。为了避免数据泄漏，我会用 Pipeline 把缺失值填补、标准化、编码和模型串起来，并用训练/测试拆分、人工 review、precision/recall 或异常 TopN 评估效果。模型结果只作为辅助信号，不直接触发高风险自动修复。

## 学习检查清单

- [ ] 我能解释 `X`、`y`、sample、feature。
- [ ] 我能解释 estimator、`fit`、`predict`、`transform`。
- [ ] 我能区分监督学习和无监督学习。
- [ ] 我能区分 novelty detection 和 outlier detection。
- [ ] 我能用 pandas 准备特征表。
- [ ] 我能训练 IsolationForest。
- [ ] 我能解释 `contamination`、`decision_function`。
- [ ] 我能使用 SimpleImputer 和 StandardScaler。
- [ ] 我能用 Pipeline 避免预处理不一致。
- [ ] 我能使用 train_test_split。
- [ ] 我能解释数据泄漏。
- [ ] 我能看 classification_report 和 confusion_matrix。
- [ ] 我能保存和加载模型。
- [ ] 我能说明模型在 AIOps 中的边界。

## 面试题

1. scikit-learn 是什么？适合哪些 AIOps 原型？
2. `X` 和 `y` 分别是什么？
3. `fit`、`predict`、`transform` 分别做什么？
4. Estimator API 为什么重要？
5. 监督学习和无监督学习有什么区别？
6. 异常检测和分类有什么区别？
7. novelty detection 和 outlier detection 有什么区别？
8. IsolationForest 的基本直觉是什么？
9. `contamination` 参数影响什么？
10. 为什么要划分训练集和测试集？
11. 什么是数据泄漏？
12. Pipeline 有什么价值？
13. 为什么不能只看 accuracy？
14. precision 和 recall 在告警场景中分别意味着什么？
15. 模型保存有什么安全和版本风险？
16. 为什么模型结果不能直接触发高风险自动修复？

## 老师带你理解工具箱里的三个动作

先别记算法名字。`fit` 像老师根据训练卷总结规律；`transform` 按已学规则改写输入，例如按训练集的均值和标准差缩放；`predict` 才输出预测答案。转换器也会学习，所以标准化、缺失值填补和类别编码都必须遵守训练与测试分离。

`X` 是二维输入，行是样本、列是特征；单个告警也通常要保持一行多列，不能随意压成一维。`y` 是监督学习的标签，并不是每个模型都需要。观察 `X.shape`、列名和类型，是报错时的第一站。训练五列、上线四列不只是少了数字，而是改变模型输入合同。

Pipeline（处理流水线）把步骤按顺序绑在一起，但它不能替你修复输入里本来就包含未来信息的字段。ColumnTransformer（按列处理器）让数值列填补和缩放、类别列编码分别进行；上线遇到新类别时 `handle_unknown='ignore'` 可避免直接报错，但未知类别比例突然上升仍应监控，不能把静默兼容当成数据健康。

### IsolationForest 为什么会觉得一个点奇怪

IsolationForest（孤立森林）反复随机选择特征与切分值。孤立、少见的点往往只需较少切分就能与其他点分开；多数密集正常点需要更长路径。它学习的是样本在特征空间中的相对孤立程度，不会理解“服务发布失败”的业务含义。

`contamination` 主要影响异常阈值的确定，不等于经过人工验证的事故比例。把它从 0.01 调到 0.2，报告更多异常不代表召回真的提高。先看原始分数排名、服务分组、人工标注和阈值带来的处理量，再决定策略。异常分数和概率也不是同一东西，不能把 `decision_function` 输出 0.8 说成事故概率 80%。

KMeans（K 均值聚类）按距离寻找分组中心，适合相似行为归类；它会给输入安排分组，并不保证每组都对应一个根因。不同量纲会影响距离，服务流量大小也可能盖过错误率形状。用业务样本检查聚类解释，再结合标准化、窗口定义和分组指标迭代。

### 可回收故障实验：训练记住了正确顺序，输入却偷偷换位

前提是安装本篇依赖。保存以下代码为 `feature_contract_lesson.py`，运行 `python feature_contract_lesson.py`，只在内存使用合成数据：

```python
import pandas as pd
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

features = ['error_rate', 'latency_ms']
x = pd.DataFrame([[0.01,100],[0.02,120],[0.2,900],[0.3,1200]], columns=features)
y = [0,0,1,1]
model = make_pipeline(StandardScaler(), LogisticRegression()).fit(x,y)
current = pd.DataFrame([[0.25,1000]], columns=features)
print('normal:', model.predict(current).tolist())

def checked_predict(frame):
    if list(frame.columns) != features:
        raise ValueError('特征名或顺序与模型合同不一致')
    if not frame['error_rate'].between(0,1).all():
        raise ValueError('错误率必须使用 0 到 1 的比例')
    return model.predict(frame)

try:
    checked_predict(current[['latency_ms','error_rate']])
except ValueError as error:
    print('DETECTED:', error)
print('recovered:', checked_predict(current[features]).tolist())
```

预期正常结果 `[1]`、明确检测列顺序错误、修复后 `[1]`。我们自己加合同检查，是为了让失败原因靠近输入，而不是等下游产生奇怪分数。再把错误率改成 `25`，应触发比例范围错误；恢复 `0.25` 即可。若未拦截，确认预测走了 `checked_predict`，没有绕过检查函数。清理删除教学脚本，无数据库或服务遗留。

### 参数搜索、持久化与生产推理

超参数搜索会反复使用验证数据作选择，所以最后仍需要一次未参与选型的测试评估。时间序列用符合时间方向的拆分，多个窗口来自同一事故时还要防组间泄漏。`random_state` 固定部分随机行为，不保证跨硬件、库版本和并行配置完全一致；记录环境与输入哈希更完整。

并行要计算总线程数。外层搜索开多进程，模型自身又开多线程，底层数学库再并行，可能发生资源过量竞争。先设并发上限，观察 CPU、内存峰值和任务完成时间，不能见到 `n_jobs=-1` 就当成最佳配置。

保存模型同时保存预处理、特征列表、单位、训练区间、指标和阈值。`pickle`、`joblib` 载入不可信文件可能执行代码，只载入可信、经过校验的构建产物；不同 sklearn 版本之间直接载入也没有通用兼容保证。按官方 [模型持久化](https://scikit-learn.org/stable/model_persistence.html) 选择部署格式，并用同一批输入校验导出前后结果。

无状态推理副本需要加载相同版本、设置输入大小与批量上限；模型加载成功只是就绪的一部分，仍应跑固定探针确认字段和预测契约。升级采用小流量对照，比较延迟、异常比例与人工标签；回滚整个 Pipeline 与阈值，不单独替换分类器。

### 面试带练

30 秒回答聚焦统一接口、训练边界和证据：我用 Pipeline 管预处理与模型，用时间合理的拆分评估，输入合同检查防止上线字段漂移，结果通过阈值和人工复核进入告警流程。

3 分钟用一个服务窗口走完 `X/y`、填补、标准化、拟合、评估和部署，接着讲孤立森林分数为什么不是事故概率，再展示特征错位实验。追问效果下降，先查输入合同与数据分布，再查标签与模型；追问换深度学习，要求在同一测试和资源预算下证明提升。

事故设计题：发布把延迟单位改成秒，异常比例从 2% 变成 40%。先冻结新模型推广，抽取脱敏输入与旧版对照，验证单位假设；恢复数据合同并回放影子样本，最后对比业务召回和误报。直接把 `contamination` 调回 2% 会掩盖输入错误。

## 第二轮精讲：从一个分数追问到上线决策

### 一、模型不是从列名读懂业务的

我们拿五分钟服务窗口做例子。每行包含请求总数、错误请求数、延迟分位数、CPU 使用率和是否处在发布窗口。机器只得到数值或编码后的类别，不会因为列名叫“错误率”就自动知道它应该在零到一之间。数据合同必须先表达单位、缺测、时间边界和取值范围，再交给估计器学习。

监督学习多了一个答案列，例如未来十分钟是否发生需人工处置的事故。这个答案通常在十分钟以后，甚至工单复核以后才能确定；训练时可以使用未来结果作标签，但不能把未来才出现的处理记录放进输入。请把“标签来自未来”和“特征偷看未来”分开理解：前者是预测问题本身，后者使离线成绩虚高。

逻辑回归不是简单的“名字里有回归，所以只能预测数值”。它先把特征按权重相加，再映射为分类得分或概率形式。权重受正则化约束，避免模型过分依赖少数样本。标准化后权重解释的是不同尺度下的作用，不是业务因果关系；几个高度相关的特征可能相互分担权重，不能只看某列权重小就宣布它与事故无关。

决策树像连续问问题：“错误率是否超过某值？延迟是否进一步升高？”每个叶子代表一组满足条件的样本。树很深时可以记住训练数据的细节，训练准确率很高而新数据差。限制深度、叶子最少样本和特征选择，是控制复杂度的方式；随机森林通过多棵有差异的树聚合降低某些方差，但并不能消除数据泄漏或错误标签。

这几类模型没有永久赢家。对少量结构化服务指标，简单模型往往易训练、易部署、易解释；对复杂非线性关系，树集成可能更好。选择必须在相同数据拆分、相同业务指标和相同资源预算下比较。把不同测试集上的两个分数放到一起，不构成算法优劣证据。

### 二、转换器的状态藏在哪里

`StandardScaler` 拟合时保存训练数据的均值和尺度，预测时用这些已保存值变换新数据；它不是每次接到一个新告警就重新计算那一条告警的均值。若你在每批线上数据重新 `fit_transform`，同一个原始数值的含义会随着同批其他请求变化，训练和预测不再处于同一坐标系。

`SimpleImputer` 也会记住填补统计，`OneHotEncoder` 记住类别集合。独热编码把类别展开成一组指示列，让模型不把服务编号当成有自然大小的数值。服务 A、B、C 被写成 1、2、3 时，某些模型可能利用不存在的距离关系；独热编码避免这种假大小关系，但类别过多会增加维度，因此还要控制字段选择和未知类别比例。

`ColumnTransformer` 按列把不同处理路径拼接，输出列的次序与编码展开都有约定。排障时不能只核对原始输入列，还应观察变换后维度和特征名。尤其在模型导出或线上非 Python 重写预处理时，编码顺序、空值规则、类别大小写和单位都要与训练保持一致。固定一组金样本逐层比对，是验证两套实现等价的有效办法。

如果转换后得到稀疏矩阵，不要为了打印方便就对全量数据调用转稠密操作。稀疏结构只保存大量零中的非零项，变成稠密后会为每个位置分配空间。某些缩放和模型对稀疏输入有参数要求，应按相应版本文档检查；内存报错先查数据形状、类别基数和意外稠密化，不先升级机器。

### 三、训练集、验证集和测试集分别扮演谁

老师给你三套卷子。训练集用于学规律，验证集用于挑模型与阈值，测试集最后检验选择是否泛化。如果看了测试分数又改特征，再看测试分数又改参数，这套“测试集”事实上变成了验证集，需要新的最终评估数据。名字叫 `test.csv` 不会自动保持独立性。

交叉验证让多组训练与验证轮换，可以减少一次拆分的偶然性，但拆分方式必须符合未来部署。随机划分适合近似独立同分布样本；同一事故拆出的多个窗口不独立，应按事故分组；时间上前后相关的服务数据，应按时间向前验证。`GroupKFold` 解决分组隔离，不自动保证时间向前；`TimeSeriesSplit` 解决顺序扩展，也不自动识别跨边界的同一事故。业务可能需要兼顾时间与分组的自定义拆分。

预测未来十分钟事故时，训练末尾和验证开头若共享同一个未来标签窗口，仍可能泄漏。两段之间留出符合预测跨度和数据到达延迟的间隔，是需要考虑的处理；间隔不能机械写成固定一天，要从特征窗口、标签窗口和延迟推导。官方 [交叉验证指南](https://scikit-learn.org/stable/modules/cross_validation.html) 给出拆分器能力，真正选哪个要由样本独立性和上线场景决定。

`GridSearchCV` 的参数名里出现双下划线，例如 `classifier__max_depth`，含义是“把参数交给 Pipeline 中名为 classifier 的步骤”。搜索会克隆并重复拟合候选管道，因此预处理也应放在里面，不能先在全数据上缩放后再搜索。一次实验要记录搜索空间、折数、评分函数、随机状态、最佳参数和每折分数，不只保留最高的那一格。

### 四、把模型分数翻译成值班同学的工作量

假设测试集有一万条窗口，真正事故有一百条。模型挑出二百条，里面八十条真事故：精确率是八十除以二百，即 40%；召回率是八十除以一百，即 80%。一百二十条误报就是值班同学实际要额外处理的工作，二十条漏报则是没有被模型提示的风险。准确率在这里可能仍然很高，但它把大量容易猜对的正常窗口也算进分母，容易遮住问题。

再想一步：一场事故连续二十分钟触发二十条正确窗口预测，窗口级召回很好，却可能只帮你发现了一场事故。因此需要同时看事件级召回、首次告警提前量、每小时通知数和合并后工单数。时间窗口评分与业务事件评分回答不同问题，不要只挑对模型有利的口径。

阈值是在漏报与误报之间做取舍。降低阈值通常让更多样本被标为正，但变化幅度取决于分数分布。AUC 一类排序指标有助于整体比较，却不能告诉你每天最多能处理多少条告警。上线前应画阈值与召回、误报量、人工预算的关系，按实际值班能力选点，而不是永远使用 0.5。评价函数的含义和约定见 [scikit-learn 评价指标](https://scikit-learn.org/stable/modules/model_evaluation.html)。

下面的基础决策实验不依赖模型训练，仅用 Python 演示同一组分数更换阈值后的业务结果。保存为 `threshold_lesson.py` 后执行 `python threshold_lesson.py`。这些分数是教学构造，不代表真实模型性能。

```python
labels = [1, 0, 1, 0, 0, 1]
scores = [0.95, 0.85, 0.75, 0.65, 0.20, 0.10]

def report(threshold):
    predicted = [score >= threshold for score in scores]
    tp = sum(p and y == 1 for p, y in zip(predicted, labels))
    fp = sum(p and y == 0 for p, y in zip(predicted, labels))
    fn = sum((not p) and y == 1 for p, y in zip(predicted, labels))
    precision = tp / (tp + fp) if tp + fp else None
    recall = tp / (tp + fn)
    return {'alerts': sum(predicted), 'tp': tp, 'fp': fp,
            'fn': fn, 'precision': precision, 'recall': recall}

normal = report(0.9)
assert normal['alerts'] == 1 and normal['tp'] == 1
overload = report(0.6)
assert overload['alerts'] == 4 and overload['fp'] == 2
print('normal:', normal)
print('DETECTED budget overflow:', overload['alerts'] > 2)
print('recovered:', report(0.9))
```

预期高阈值只通知一条，低阈值通知四条且其中两条误报，超过设定的两条预算。故障注入改变的是策略，不是权重，所以回滚也应恢复阈值版本。清理退出进程即可，无文件数据或服务残留。若结果不同，先核对 `>=` 的边界和标签顺序；把标签与分数分别排序后再相配，是另一种会让统计完全失真的错误。

### 五、一次单位事故如何从现象查到恢复

假设新发布后模型接口仍返回 200，推理时延正常，却突然多出十倍异常。不要立刻调阈值。先分别检查输入字段存在率、类型、单位、取值分位数、未知类别比例与空值率，再比对当前 Pipeline、特征版本和阈值版本。接口成功仅代表请求处理成功，不代表输入语义正确。

收集一小批脱敏金样本，同时送给旧版和新版离线实例，逐层比较原始值、变换后值、原始分数和最终决策。如果原始延迟由毫秒改成秒，差异在模型之前已经出现；如果原始值一致但转换输出不同，检查预处理产物或列顺序；如果分数一致但告警数不同，检查阈值和去重策略。这样把假设拆开，才能选择最小修复。

缓解先停止新版本继续推广，保留旧版本服务和确定性规则兜底；确认问题后恢复数据合同或完整模型包。业务回放只对只读或影子通道执行，避免把历史预测重新触发成真实自动化任务。恢复标准要同时包括特征合同通过、分数分布合理、固定金样本一致、告警量回归和人工抽检；不能只看 HTTP 错误归零。

### 六、生产设计与面试递进答案

设计“每秒处理一千个告警窗口”的服务时，先问允许多大延迟、是否每条都独立预测、能否微批、模型大小与每批内存。无状态 API 副本可以水平扩展，但每个副本都可能加载一份模型；进程数乘模型驻留大小会改变内存预算。底层数学库线程与服务工作进程要一起限额，防止多层并行争抢同一 CPU。

特征读取往往比 `predict` 更慢，因此追踪应拆成排队、特征查询、转换、模型计算和下游发布。缓存需绑定特征时间与模型版本，不能只按服务名缓存不同时间窗口的结果。高可用还包括模型注册存储、特征源和队列的故障策略；模型不可用时应明确降级为规则、排队延后或只告警，不隐式把分数填成正常。

面试官问“为什么 Pipeline 能防泄漏”，回答它让每个训练折里的转换器只从该折训练数据学习，但它防不住未来字段、同事故跨折和不正确时间标签。追问“怎么证明”，给出特征可用时间表和分组时间拆分的断言，不只说“用了 Pipeline”。再问“怎么回滚”，回答权重、预处理、特征合同、阈值与依赖组成一个版本单元，并用金样本和流量对照验证回退。

最后问“什么时候不用 scikit-learn”，你可以从数据、任务和交付回答：超过单机训练或内存边界、需要复杂端到端深度网络或特定流式状态更新时，应评估其他框架；但仍复用这里的数据合同、无泄漏评估和受控上线原则。能说出工具边界，比列举更多算法名更能表现判断力。

## 老师再追问：概率、异常分数和可信程度

`predict_proba` 给出的数值需要结合估计器类别顺序解释。二分类输出两列，哪一列代表事故应核对 `classes_`，不能在标签后来改成字符串后仍假定第二列永远是你要的正类。多分类每一行的各类分数与最终类别也有自己的约定，接口层应显式返回类别名，避免调用方自己猜列顺序。

概率校准关注“预测为八成的一组样本，是否大约八成真为正”，与排序能力不同。一个模型可能把危险样本排在前面，却把数值报得过于自信；另一个概率较准，却不一定在极低误报预算下召回最好。校准需要独立于拟合的合理数据，不能用训练样本校准后再在同一批上宣布可靠。更详细能力按目标版本 [概率校准指南](https://scikit-learn.org/stable/modules/calibration.html) 学习。

IsolationForest 等异常检测输出相对异常程度，不应通过随意线性变换冒充真实事故概率。某个新服务因流量远小于训练中的所有服务而被标异常，可能只是训练覆盖不足；系统应能标注分布外或未知服务情况，交给规则与人工，而不是强行给出高置信结论。

### 缺失不是都能自动填补

若 CPU 缺失是偶发采集故障，中位数填补加缺失指示也许能提供一个稳健基线；若所有特征都缺失，填补后的“平均服务”会让模型看起来很正常。输入合同应规定最低有效信息，超过缺失边界就返回数据不可用或降级，不把缺失自动翻译成无事故。

类别未知同样要观察。允许新类别不报错只是可用性策略，不代表模型真正学会新类别的风险。假设新版本把 `critical` 改名为 `fatal`，编码器静默忽略后模型失去关键输入，接口却仍然正常。监控未知比例、枚举版本和模型解释差异，可以让这种语义断裂在业务恶化之前暴露。

### 完整发布包的可核对清单

一份发布包至少包含可信模型产物、预处理与特征合同、类别顺序、阈值、依赖版本、训练区间、评估摘要、金样本和校验值。加载后先跑金样本，观察预测类别、概率或分数、输入异常处理与耗时；精确浮点比较要考虑合理容差，但不能大到掩盖错误模型。

回滚时还要查线上窗口状态和特征源是否已经迁移。旧模型依赖旧单位，新特征源只提供新单位，单独换回旧权重并不能恢复。保持兼容转换或同时回退相关版本，才是业务可执行的回滚。把这一依赖关系画出来并演练一次，比在文档里只写“保留上一版本”更完整。

## 本课 GitHub 学习证据

学完这篇，建议留下这些证据：

1. 一个 `metrics.csv`。
2. 一个 `train.py`，使用 Pipeline 训练异常检测模型。
3. 一个 `detect.py`，加载模型并输出异常结果。
4. 一个 `anomaly_review.csv`。
5. 一个 `requirements.txt` 固定依赖。
6. 一篇 README，解释特征、模型参数、异常结果、误报/漏报和 AIOps 使用边界。
