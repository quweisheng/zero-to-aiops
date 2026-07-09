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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CPU &gt; 80% 就告警</code> | 这一行里的英文要这样读：`CPU` 是名称、状态或组件标识，真实环境里要结合上下文确认它指的是哪个告警、服务或资源。 |

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
scikit-learn
  -> Getting started
     -> estimator
     -> fit
     -> predict
     -> transform
     -> X shape: n_samples x n_features
  -> Supervised learning
     -> classification
     -> regression
     -> linear models
     -> SVM
     -> trees
     -> ensembles
  -> Unsupervised learning
     -> clustering
     -> dimensionality reduction
     -> novelty and outlier detection
  -> Model selection and evaluation
     -> train_test_split
     -> cross-validation
     -> metrics
     -> hyperparameter tuning
     -> threshold tuning
  -> Dataset transformations
     -> preprocessing
     -> imputation
     -> encoding categorical features
     -> Pipeline
     -> ColumnTransformer
  -> Computing with scikit-learn
     -> performance
     -> parallelism
     -> scaling to larger data
  -> Model persistence
     -> pickle/joblib/skops/ONNX
     -> security and version compatibility
  -> Common pitfalls
     -> inconsistent preprocessing
     -> data leakage
     -> bad train/test evaluation
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>scikit-learn</code> | 这一行里的英文要这样读：`scikit-learn` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; Getting started</code> | 这一行要理解这些英文词：`Getting started` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>     -&gt; estimator</code> | 这一行要理解这些英文词：`estimator` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>     -&gt; fit</code> | 这一行要理解这些英文词：`fit` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>     -&gt; predict</code> | 这一行要理解这些英文词：`predict` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>     -&gt; transform</code> | 这一行要理解这些英文词：`transform` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>     -&gt; X shape: n_samples x n_features</code> | 这一行要理解这些英文词：`X shape` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`n_samples x n_features` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; Supervised learning</code> | 这一行要理解这些英文词：`Supervised learning` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>     -&gt; classification</code> | 这一行要理解这些英文词：`classification` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>     -&gt; regression</code> | 这一行要理解这些英文词：`regression` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>     -&gt; linear models</code> | 这一行要理解这些英文词：`linear models` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 12 行 | <code>     -&gt; SVM</code> | 这一行要理解这些英文词：`SVM` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 13 行 | <code>     -&gt; trees</code> | 这一行要理解这些英文词：`trees` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 14 行 | <code>     -&gt; ensembles</code> | 这一行要理解这些英文词：`ensembles` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 15 行 | <code>  -&gt; Unsupervised learning</code> | 这一行要理解这些英文词：`Unsupervised learning` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 16 行 | <code>     -&gt; clustering</code> | 这一行要理解这些英文词：`clustering` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 17 行 | <code>     -&gt; dimensionality reduction</code> | 这一行要理解这些英文词：`dimensionality reduction` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 18 行 | <code>     -&gt; novelty and outlier detection</code> | 这一行要理解这些英文词：`novelty and outlier detection` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 19 行 | <code>  -&gt; Model selection and evaluation</code> | 这一行要理解这些英文词：`Model selection and evaluation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 20 行 | <code>     -&gt; train_test_split</code> | 这一行要理解这些英文词：`train_test_split` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 21 行 | <code>     -&gt; cross-validation</code> | 这一行要理解这些英文词：`cross-validation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 22 行 | <code>     -&gt; metrics</code> | 这一行要理解这些英文词：`metrics` 是指标。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 23 行 | <code>     -&gt; hyperparameter tuning</code> | 这一行要理解这些英文词：`hyperparameter tuning` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 24 行 | <code>     -&gt; threshold tuning</code> | 这一行要理解这些英文词：`threshold tuning` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 25 行 | <code>  -&gt; Dataset transformations</code> | 这一行要理解这些英文词：`Dataset transformations` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 26 行 | <code>     -&gt; preprocessing</code> | 这一行要理解这些英文词：`preprocessing` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 27 行 | <code>     -&gt; imputation</code> | 这一行要理解这些英文词：`imputation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 28 行 | <code>     -&gt; encoding categorical features</code> | 这一行要理解这些英文词：`encoding categorical features` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 29 行 | <code>     -&gt; Pipeline</code> | 这一行要理解这些英文词：`Pipeline` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 30 行 | <code>     -&gt; ColumnTransformer</code> | 这一行要理解这些英文词：`ColumnTransformer` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 31 行 | <code>  -&gt; Computing with scikit-learn</code> | 这一行要理解这些英文词：`Computing with scikit-learn` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 32 行 | <code>     -&gt; performance</code> | 这一行要理解这些英文词：`performance` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 33 行 | <code>     -&gt; parallelism</code> | 这一行要理解这些英文词：`parallelism` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 34 行 | <code>     -&gt; scaling to larger data</code> | 这一行要理解这些英文词：`scaling to larger data` 是data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 35 行 | <code>  -&gt; Model persistence</code> | 这一行要理解这些英文词：`Model persistence` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 36 行 | <code>     -&gt; pickle/joblib/skops/ONNX</code> | 这一行要理解这些英文词：`pickle` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`joblib` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`skops` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`ONNX` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 37 行 | <code>     -&gt; security and version compatibility</code> | 这一行要理解这些英文词：`security and version compatibility` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 38 行 | <code>  -&gt; Common pitfalls</code> | 这一行要理解这些英文词：`Common pitfalls` 是common=常见。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 39 行 | <code>     -&gt; inconsistent preprocessing</code> | 这一行要理解这些英文词：`inconsistent preprocessing` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 40 行 | <code>     -&gt; data leakage</code> | 这一行要理解这些英文词：`data leakage` 是data=数据。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 41 行 | <code>     -&gt; bad train/test evaluation</code> | 这一行要理解这些英文词：`bad train` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`test evaluation` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

初学路线：

```text
pandas feature table
  -> X and y
  -> train/test split
  -> preprocessing
  -> model
  -> Pipeline
  -> fit
  -> predict / decision_function / score_samples
  -> metrics / review
  -> persist model
  -> AIOps report
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pandas feature table</code> | 这一行里的英文要这样读：`pandas feature table` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>  -&gt; X and y</code> | 这一行要理解这些英文词：`X and y` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; train/test split</code> | 这一行要理解这些英文词：`train` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`test split` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; preprocessing</code> | 这一行要理解这些英文词：`preprocessing` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>  -&gt; model</code> | 这一行要理解这些英文词：`model` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 6 行 | <code>  -&gt; Pipeline</code> | 这一行要理解这些英文词：`Pipeline` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 7 行 | <code>  -&gt; fit</code> | 这一行要理解这些英文词：`fit` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 8 行 | <code>  -&gt; predict / decision_function / score_samples</code> | 这一行要理解这些英文词：`predict` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`decision_function` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`score_samples` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 9 行 | <code>  -&gt; metrics / review</code> | 这一行要理解这些英文词：`metrics` 是指标；`review` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; persist model</code> | 这一行要理解这些英文词：`persist model` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; AIOps report</code> | 这一行要理解这些英文词：`AIOps report` 是aiops=智能运维。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

## scikit-learn 在 AIOps 链路中的位置

```text
Prometheus / MySQL / Kafka export / CSV
  -> pandas cleaning
  -> feature engineering
  -> scikit-learn
      anomaly detection
      classification
      clustering
      regression
  -> anomaly score / class / cluster / prediction
  -> report / dashboard / alert enrichment
  -> human feedback
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus / MySQL / Kafka export / CSV</code> | `Prometheus / MySQL / Kafka export / CSV` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  -&gt; pandas cleaning</code> | 这一行要理解这些英文词：`pandas cleaning` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 3 行 | <code>  -&gt; feature engineering</code> | 这一行要理解这些英文词：`feature engineering` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 4 行 | <code>  -&gt; scikit-learn</code> | 这一行要理解这些英文词：`scikit-learn` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 5 行 | <code>      anomaly detection</code> | 这一行里的英文要这样读：`anomaly detection` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 6 行 | <code>      classification</code> | 这一行里的英文要这样读：`classification` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 7 行 | <code>      clustering</code> | 这一行里的英文要这样读：`clustering` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 8 行 | <code>      regression</code> | 这一行里的英文要这样读：`regression` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 9 行 | <code>  -&gt; anomaly score / class / cluster / prediction</code> | 这一行要理解这些英文词：`anomaly score` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`class` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`cluster` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`prediction` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 10 行 | <code>  -&gt; report / dashboard / alert enrichment</code> | 这一行要理解这些英文词：`report` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`dashboard` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题；`alert enrichment` 是alert=告警。`->` 只是知识地图里的层级符号，不是要学习的概念。 |
| 第 11 行 | <code>  -&gt; human feedback</code> | 这一行要理解这些英文词：`human feedback` 是英文术语，表示本节知识地图里的一个组件、命令、状态或学习主题。`->` 只是知识地图里的层级符号，不是要学习的概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>shape = (n_samples, n_features)</code> | `shape` 是主机、服务、告警或资源的示例名称；`shape` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值，`(n_samples` 是示例取值，真实 AIOps 场景里要换成自己的服务、环境、路径或阈值。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 2 行 | <code>X = df[features]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |

如果有标签，比如人工标注这行是否异常：

```python
y = df["is_incident"]
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>y = df["is_incident"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.ensemble import RandomForestClassifier</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>clf = RandomForestClassifier(random_state=42)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>clf.fit(X_train, y_train)</code> | 训练模型或拟合转换器，让算法从样本数据里学习规律。 |

`RandomForestClassifier` 是 estimator。

### fit

`fit` 表示从数据中学习。

```python
model.fit(X_train, y_train)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>model.fit(X_train, y_train)</code> | 训练模型或拟合转换器，让算法从样本数据里学习规律。 |

无监督模型没有 `y`：

```python
model.fit(X_train)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>model.fit(X_train)</code> | 训练模型或拟合转换器，让算法从样本数据里学习规律。 |

### predict

`predict` 表示输出预测结果。

```python
y_pred = model.predict(X_test)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>y_pred = model.predict(X_test)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |

分类模型输出类别，异常检测常输出 `1` 或 `-1`。

### transform

`transform` 表示把数据变换成另一种表示。

```python
X_scaled = scaler.transform(X_test)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>X_scaled = scaler.transform(X_test)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |

例如标准化、缺失值填充、one-hot 编码。

### fit_transform

训练转换器并立即转换：

```python
X_train_scaled = scaler.fit_transform(X_train)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>X_train_scaled = scaler.fit_transform(X_train)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>. .venv/bin/activate</code> | 执行 `.` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>pip install pandas numpy scikit-learn joblib matplotlib</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |

Windows PowerShell：

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install pandas numpy scikit-learn joblib matplotlib
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>.venv\Scripts\Activate.ps1</code> | 执行 `.venv\scripts\activate.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 3 行 | <code>pip install pandas numpy scikit-learn joblib matplotlib</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |

验证：

```bash
python -c "import sklearn; print(sklearn.__version__)"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -c "import sklearn; print(sklearn.__version__)"</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>timestamp,service,request_rate,error_rate,p95_latency_ms,cpu_usage</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 2 行 | <code>2026-07-01 10:00:00,order-api,1000,0.01,120,0.45</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 3 行 | <code>2026-07-01 10:01:00,order-api,1020,0.01,130,0.46</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 4 行 | <code>2026-07-01 10:02:00,order-api,980,0.02,125,0.44</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 5 行 | <code>2026-07-01 10:03:00,order-api,990,0.01,128,0.47</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 6 行 | <code>2026-07-01 10:04:00,order-api,1010,0.02,132,0.45</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 7 行 | <code>2026-07-01 10:05:00,order-api,700,0.35,1800,0.92</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 8 行 | <code>2026-07-01 10:06:00,order-api,1005,0.01,124,0.43</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |
| 第 9 行 | <code>2026-07-01 10:07:00,order-api,995,0.02,127,0.46</code> | CSV 数据行，逗号分隔的每一列代表一个字段。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import pandas as pd</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>from sklearn.ensemble import IsolationForest</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>df = pd.read_csv("metrics.csv", parse_dates=["timestamp"])</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <code>features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>X = df[features]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>model = IsolationForest(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>    n_estimators=100,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>    contamination=0.15,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>    random_state=42,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>df["prediction"] = model.fit_predict(X)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>df["anomaly_score"] = model.decision_function(X)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>df["is_anomaly"] = df["prediction"] == -1</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>print(</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 20 行 | <code>    df[</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>        [</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 22 行 | <code>            "timestamp",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>            "service",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 24 行 | <code>            "error_rate",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 25 行 | <code>            "p95_latency_ms",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 26 行 | <code>            "anomaly_score",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 27 行 | <code>            "is_anomaly",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <code>        ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 29 行 | <code>    ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 30 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

运行：

```bash
python detect_anomaly.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python detect_anomaly.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 2 行 | <code>  -&gt; 用随机切分更容易把它单独隔离出来</code> | 这一行表示上一级主题下的子项“用随机切分更容易把它单独隔离出来”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 3 行 | <code>  -&gt; 被隔离所需路径更短</code> | 这一行表示上一级主题下的子项“被隔离所需路径更短”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |
| 第 4 行 | <code>  -&gt; 更可能是异常</code> | 这一行表示上一级主题下的子项“更可能是异常”。`->` 只是知识地图里的层级符号，真正要理解的是这句话里的操作或概念。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>df["error_rate_rolling_mean_3"] = df["error_rate"].rolling(window=3).mean()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>df["latency_rolling_max_3"] = df["p95_latency_ms"].rolling(window=3).max()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 3 行 | <code>df["request_rate_pct_change"] = df["request_rate"].pct_change()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 4 行 | <code>df = df.dropna()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.impute import SimpleImputer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>imputer = SimpleImputer(strategy="median")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>X_imputed = imputer.fit_transform(X_train)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |

### 标准化

一些模型对尺度敏感：

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_train)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.preprocessing import StandardScaler</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>scaler = StandardScaler()</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>X_scaled = scaler.fit_transform(X_train)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.preprocessing import OneHotEncoder</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>encoder = OneHotEncoder(handle_unknown="ignore")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.ensemble import IsolationForest</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <code>from sklearn.impute import SimpleImputer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>from sklearn.pipeline import Pipeline</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>from sklearn.preprocessing import StandardScaler</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <code>features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 8 行 | <code>pipeline = Pipeline(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>    steps=[</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>        ("imputer", SimpleImputer(strategy="median")),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>        ("scaler", StandardScaler()),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 12 行 | <code>        ("model", IsolationForest(contamination=0.15, random_state=42)),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>    ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>pipeline.fit(df[features])</code> | 训练模型或拟合转换器，让算法从样本数据里学习规律。 |
| 第 17 行 | <code>df["prediction"] = pipeline.predict(df[features])</code> | 用训练好的模型做预测，输出分类、异常分数或预测值。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.compose import ColumnTransformer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 2 行 | <code>from sklearn.ensemble import RandomForestClassifier</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>from sklearn.impute import SimpleImputer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>from sklearn.pipeline import Pipeline</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <code>from sklearn.preprocessing import OneHotEncoder, StandardScaler</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 7 行 | <code>numeric_features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 8 行 | <code>categorical_features = ["service", "environment"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <code>preprocess = ColumnTransformer(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 11 行 | <code>    transformers=[</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>        (</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>            "numeric",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>            Pipeline(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>                steps=[</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 16 行 | <code>                    ("imputer", SimpleImputer(strategy="median")),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>                    ("scaler", StandardScaler()),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>                ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>            ),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 20 行 | <code>            numeric_features,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>        ),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 22 行 | <code>        (</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>            "categorical",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 24 行 | <code>            OneHotEncoder(handle_unknown="ignore"),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 25 行 | <code>            categorical_features,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 26 行 | <code>        ),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 27 行 | <code>    ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 30 行 | <code>model = Pipeline(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 31 行 | <code>    steps=[</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 32 行 | <code>        ("preprocess", preprocess),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>        ("classifier", RandomForestClassifier(random_state=42)),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <code>    ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 35 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.model_selection import train_test_split</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>X_train, X_test, y_train, y_test = train_test_split(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 4 行 | <code>    X,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 5 行 | <code>    y,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 6 行 | <code>    test_size=0.2,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>    random_state=42,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 8 行 | <code>    stratify=y,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

### 数据泄漏

错误做法：

```python
scaler.fit(X)
X_scaled = scaler.transform(X)
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>scaler.fit(X)</code> | 训练模型或拟合转换器，让算法从样本数据里学习规律。 |
| 第 2 行 | <code>X_scaled = scaler.transform(X)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 3 行 | <code>X_train, X_test, y_train, y_test = train_test_split(X_scaled, y)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

问题：标准化已经看过测试集。

正确做法：

```python
pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pipeline.fit(X_train, y_train)</code> | 训练模型或拟合转换器，让算法从样本数据里学习规律。 |
| 第 2 行 | <code>y_pred = pipeline.predict(X_test)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.metrics import classification_report, confusion_matrix</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>y_pred = model.predict(X_test)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>print(classification_report(y_test, y_pred))</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 5 行 | <code>print(confusion_matrix(y_test, y_pred))</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>review = df.sort_values("anomaly_score").head(50)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 2 行 | <code>review.to_csv("anomaly_review.csv", index=False)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

## 其他常见模型

### LocalOutlierFactor

适合找局部密度异常。

```python
from sklearn.neighbors import LocalOutlierFactor

model = LocalOutlierFactor(n_neighbors=20, contamination=0.05)
df["prediction"] = model.fit_predict(X)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.neighbors import LocalOutlierFactor</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>model = LocalOutlierFactor(n_neighbors=20, contamination=0.05)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>df["prediction"] = model.fit_predict(X)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

注意：LOF 默认更偏 outlier detection，不像普通模型那样直接对新样本 predict。要做 novelty detection 需要设置 `novelty=True` 并理解差异。

### OneClassSVM

```python
from sklearn.svm import OneClassSVM

model = OneClassSVM(nu=0.05, kernel="rbf", gamma="scale")
model.fit(X_train)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.svm import OneClassSVM</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>model = OneClassSVM(nu=0.05, kernel="rbf", gamma="scale")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>model.fit(X_train)</code> | 训练模型或拟合转换器，让算法从样本数据里学习规律。 |

适合小到中等数据，参数较敏感，大数据上可能较慢。

### KMeans

服务聚类：

```python
from sklearn.cluster import KMeans

kmeans = KMeans(n_clusters=3, random_state=42)
df["cluster"] = kmeans.fit_predict(X)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.cluster import KMeans</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>kmeans = KMeans(n_clusters=3, random_state=42)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>df["cluster"] = kmeans.fit_predict(X)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from sklearn.ensemble import RandomForestClassifier</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>clf = RandomForestClassifier(random_state=42)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 4 行 | <code>clf.fit(X_train, y_train)</code> | 训练模型或拟合转换器，让算法从样本数据里学习规律。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import joblib</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <code>joblib.dump(pipeline, "model/anomaly_pipeline.joblib")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 4 行 | <code>pipeline = joblib.load("model/anomaly_pipeline.joblib")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>projects/sklearn-anomaly-detector/</code> | `projects/sklearn-anomaly-detector/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 2 行 | <code>  README.md</code> | `README.md` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 3 行 | <code>  requirements.txt</code> | `requirements.txt` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 4 行 | <code>  metrics.csv</code> | `metrics.csv` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 5 行 | <code>  train.py</code> | `train.py` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 6 行 | <code>  detect.py</code> | `detect.py` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 7 行 | <code>  anomaly_review.csv</code> | `anomaly_review.csv` 是文件、目录、接口路径或匹配模式示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |
| 第 8 行 | <code>  model/</code> | `model/` 是目录示例，用来告诉读者真实项目里应该把学习证据、配置或代码放在哪里。 |

### requirements.txt

```text
pandas
numpy
scikit-learn
joblib
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pandas</code> | 这一行里的英文要这样读：`pandas` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 2 行 | <code>numpy</code> | 这一行里的英文要这样读：`numpy` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 3 行 | <code>scikit-learn</code> | 这一行里的英文要这样读：`scikit-learn` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |
| 第 4 行 | <code>joblib</code> | 这一行里的英文要这样读：`joblib` 是英文标识，通常代表字段名、组件名、文件名、资源名或示例值。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>from pathlib import Path</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 3 行 | <code>import joblib</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 4 行 | <code>import pandas as pd</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 5 行 | <code>from sklearn.ensemble import IsolationForest</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <code>from sklearn.impute import SimpleImputer</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 7 行 | <code>from sklearn.pipeline import Pipeline</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 8 行 | <code>from sklearn.preprocessing import StandardScaler</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 10 行 | <code>features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>df = pd.read_csv("metrics.csv", parse_dates=["timestamp"])</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 13 行 | <code>X = df[features]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 15 行 | <code>pipeline = Pipeline(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 16 行 | <code>    steps=[</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 17 行 | <code>        ("imputer", SimpleImputer(strategy="median")),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>        ("scaler", StandardScaler()),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <code>        ("model", IsolationForest(contamination=0.15, random_state=42)),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 20 行 | <code>    ]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 21 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>pipeline.fit(X)</code> | 训练模型或拟合转换器，让算法从样本数据里学习规律。 |
| 第 25 行 | <code>Path("model").mkdir(exist_ok=True)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 26 行 | <code>joblib.dump(pipeline, "model/anomaly_pipeline.joblib")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 27 行 | <code>print("saved model/anomaly_pipeline.joblib")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import joblib</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import pandas as pd</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 4 行 | <code>features = ["request_rate", "error_rate", "p95_latency_ms", "cpu_usage"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 6 行 | <code>df = pd.read_csv("metrics.csv", parse_dates=["timestamp"])</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 7 行 | <code>pipeline = joblib.load("model/anomaly_pipeline.joblib")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 9 行 | <code>df["prediction"] = pipeline.predict(df[features])</code> | 用训练好的模型做预测，输出分类、异常分数或预测值。 |
| 第 10 行 | <code>df["anomaly_score"] = pipeline.decision_function(df[features])</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 11 行 | <code>df["is_anomaly"] = df["prediction"] == -1</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>review = df.sort_values("anomaly_score")</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 14 行 | <code>review.to_csv("anomaly_review.csv", index=False)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>print(review[["timestamp", "service", "anomaly_score", "is_anomaly"]])</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |

运行：

```bash
pip install -r requirements.txt
python train.py
python detect.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>pip install -r requirements.txt</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |
| 第 2 行 | <code>python train.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 3 行 | <code>python detect.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |

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

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>train_test_split(X, y, test_size=0.2, random_state=42)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

作用：拆分训练和测试数据。

### StandardScaler

```python
StandardScaler()
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>StandardScaler()</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

作用：把特征标准化为均值 0、方差 1 附近。

### SimpleImputer

```python
SimpleImputer(strategy="median")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>SimpleImputer(strategy="median")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

作用：填补缺失值。

### OneHotEncoder

```python
OneHotEncoder(handle_unknown="ignore")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>OneHotEncoder(handle_unknown="ignore")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

作用：把类别特征转成数值特征。

### Pipeline

```python
Pipeline([("scaler", StandardScaler()), ("model", IsolationForest())])
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Pipeline([("scaler", StandardScaler()), ("model", IsolationForest())])</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

作用：串联预处理和模型。

### ColumnTransformer

```python
ColumnTransformer([...])
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>ColumnTransformer([...])</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

作用：对不同列应用不同预处理。

### IsolationForest

```python
IsolationForest(contamination=0.05, random_state=42)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>IsolationForest(contamination=0.05, random_state=42)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

作用：无监督异常检测。

### classification_report

```python
classification_report(y_test, y_pred)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>classification_report(y_test, y_pred)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

作用：输出 precision、recall、f1-score。

### confusion_matrix

```python
confusion_matrix(y_test, y_pred)
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>confusion_matrix(y_test, y_pred)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

作用：查看分类错误分布。

### joblib.dump / load

```python
joblib.dump(pipeline, "model.joblib")
joblib.load("model.joblib")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>joblib.dump(pipeline, "model.joblib")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 2 行 | <code>joblib.load("model.joblib")</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |

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

## 学习证据

学完这篇，建议留下这些证据：

1. 一个 `metrics.csv`。
2. 一个 `train.py`，使用 Pipeline 训练异常检测模型。
3. 一个 `detect.py`，加载模型并输出异常结果。
4. 一个 `anomaly_review.csv`。
5. 一个 `requirements.txt` 固定依赖。
6. 一篇 README，解释特征、模型参数、异常结果、误报/漏报和 AIOps 使用边界。
