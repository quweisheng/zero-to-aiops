# 机器学习

> 学习目标：能从 0 理解机器学习为什么能用于 AIOps，能讲清样本、特征、标签、训练、预测、评估、过拟合、数据泄漏和异常检测，能用一个最小 Python 实验把运维指标变成可评估的模型结果。

## 官方资料

优先读这些官方资料：

- [Google Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course)
- [Google ML Crash Course: Classification](https://developers.google.com/machine-learning/crash-course/classification)
- [Google ML Crash Course: Accuracy, precision, recall](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall)
- [Google ML Crash Course: Clustering](https://developers.google.com/machine-learning/clustering/)
- [scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
- [Choosing the right estimator](https://scikit-learn.org/stable/machine_learning_map.html)
- [Supervised learning](https://scikit-learn.org/stable/supervised_learning.html)
- [Unsupervised learning](https://scikit-learn.org/stable/unsupervised_learning.html)
- [Novelty and Outlier Detection](https://scikit-learn.org/stable/modules/outlier_detection.html)
- [Model selection and evaluation](https://scikit-learn.org/stable/model_selection.html)

说明：本文按 Google ML Crash Course 和 scikit-learn 官方用户指南重新组织，用 AIOps 场景讲清机器学习入门，不复制官方全文。

## 官方知识地图

机器学习入门可以按这张地图理解：

```text
Machine Learning
  -> problem framing
     -> 你要预测什么
     -> 你有什么数据
     -> 预测错了有什么成本
  -> data
     -> samples
     -> features
     -> labels
     -> train / validation / test
  -> learning types
     -> supervised learning
     -> unsupervised learning
     -> anomaly detection
  -> model training
     -> fit
     -> loss
     -> parameters
     -> hyperparameters
  -> inference
     -> predict
     -> score / probability
  -> evaluation
     -> confusion matrix
     -> precision / recall
     -> ROC / AUC
     -> business review
  -> production concerns
     -> data drift
     -> model version
     -> monitoring
     -> rollback
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Machine Learning</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; problem framing</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>     -&gt; 你要预测什么</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>     -&gt; 你有什么数据</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>     -&gt; 预测错了有什么成本</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; data</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>     -&gt; samples</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>     -&gt; features</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>     -&gt; labels</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 10 行 | <code>     -&gt; train / validation / test</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 11 行 | <code>  -&gt; learning types</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 12 行 | <code>     -&gt; supervised learning</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 13 行 | <code>     -&gt; unsupervised learning</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 14 行 | <code>     -&gt; anomaly detection</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 15 行 | <code>  -&gt; model training</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 16 行 | <code>     -&gt; fit</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 17 行 | <code>     -&gt; loss</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 18 行 | <code>     -&gt; parameters</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 19 行 | <code>     -&gt; hyperparameters</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 20 行 | <code>  -&gt; inference</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 21 行 | <code>     -&gt; predict</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 22 行 | <code>     -&gt; score / probability</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 23 行 | <code>  -&gt; evaluation</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 24 行 | <code>     -&gt; confusion matrix</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 25 行 | <code>     -&gt; precision / recall</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 26 行 | <code>     -&gt; ROC / AUC</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 27 行 | <code>     -&gt; business review</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 28 行 | <code>  -&gt; production concerns</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 29 行 | <code>     -&gt; data drift</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 30 行 | <code>     -&gt; model version</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 31 行 | <code>     -&gt; monitoring</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 32 行 | <code>     -&gt; rollback</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


本文覆盖：

1. 机器学习在 AIOps 里解决什么问题。
2. 样本、特征、标签、训练、预测这些基础词。
3. 监督学习、无监督学习、异常检测的区别。
4. 为什么要训练集、测试集和评估指标。
5. 一个可复现的告警分类小实验。
6. 机器学习在生产 AIOps 里的边界和排障。

## 场景开场

你已经有 Prometheus、日志和告警了，但还是会遇到这些问题：

```text
同一个服务一天告警 200 次，哪些是真的事故？
CPU 没超过 80%，但这个服务和平时相比明显不正常，要不要提醒？
发布后错误率只升了一点点，单看一条规则没触发，但多项指标一起变坏了。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>同一个服务一天告警 200 次，哪些是真的事故？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>CPU 没超过 80%，但这个服务和平时相比明显不正常，要不要提醒？</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>发布后错误率只升了一点点，单看一条规则没触发，但多项指标一起变坏了。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


规则告警适合明确条件，比如 `error_rate > 5%`。机器学习更适合从历史数据里学习“正常模式”和“异常模式”，然后给新数据一个分类、分数或相似度。

但先把边界说清楚：机器学习不是魔法，也不是替代 SRE 经验。它只是在你有数据、有目标、有评估方法时，帮助你把“经验判断”变成可复现的信号。

## 一句话人话版

机器学习就是让程序从历史样本中学习规律，然后对新样本做预测、分类、分组或异常评分；在 AIOps 里，它常用来做异常检测、告警降噪、相似故障聚类和风险预测。

## 小白可能会问

- 机器学习和普通规则判断有什么区别？
- 样本、特征、标签到底是什么？
- 监督学习、无监督学习、异常检测分别适合什么场景？
- 为什么不能把所有数据都拿去训练？
- accuracy、precision、recall 哪个更重要？
- 模型预测错了怎么办？
- AIOps 里机器学习能不能直接自动修复生产？

## 为什么要学

AIOps 的核心不是“上一个 AI 工具”，而是把运维过程里的数据、经验和反馈做成闭环。

机器学习在这个闭环里常见于三类任务：

| AIOps 任务 | 机器学习做什么 | 例子 |
|---|---|---|
| 检测异常 | 学习正常模式，发现偏离 | 延迟、错误率、重启数同时异常 |
| 降低噪声 | 区分高价值告警和低价值告警 | 告警是否需要叫醒人 |
| 聚合相似事件 | 把相似告警或事故归为一组 | 发现同一根因影响多个服务 |

学机器学习不是为了取代 Prometheus、Grafana、Runbook 和人工复盘，而是为了让它们产生的历史数据变得可学习、可评估、可复用。

## 是什么

你可以把机器学习理解成：

```text
历史数据 + 学习算法 -> 模型
新数据 + 模型 -> 预测结果
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>历史数据 + 学习算法 -&gt; 模型</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 2 行 | <code>新数据 + 模型 -&gt; 预测结果</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


普通程序是人写规则：

```text
if error_rate > 0.05:
    alert()
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>if error_rate &gt; 0.05:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>    alert()</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


机器学习是给程序很多历史样本，让它学习一条不容易手写的边界：

```text
request_rate + error_rate + latency + deploy_changed + restart_count
  -> incident / noise
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>request_rate + error_rate + latency + deploy_changed + restart_count</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; incident / noise</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


机器学习适合：

- 规则很多、很难手写完整。
- 多个指标组合后才有意义。
- 需要按历史模式判断“和平时相比是否异常”。
- 需要把经验沉淀成可重复评估的模型。

不适合：

- 没有数据。
- 没有目标。
- 没有评估。
- 错误动作成本很高但没有人工审批。

## 它解决什么问题

### 问题 1：规则太硬

固定阈值容易过粗：

```text
CPU > 80%
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>CPU &gt; 80%</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


但有些服务平时 CPU 只有 10%，突然到 55% 就值得关注；有些批处理任务 CPU 95% 反而正常。

### 问题 2：多指标组合很难手写

真实事故经常不是一个指标坏，而是多个弱信号叠加：

```text
错误率小幅上升
延迟小幅上升
请求量下降
最近 10 分钟有发布
同机房其他服务也抖动
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>错误率小幅上升</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>延迟小幅上升</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>请求量下降</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <code>最近 10 分钟有发布</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 5 行 | <code>同机房其他服务也抖动</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


机器学习可以把这些字段变成特征，让模型学习组合模式。

### 问题 3：告警太多

有些告警每次都会自动恢复，有些告警一定要人工处理。机器学习可以先做辅助排序：

```text
high priority
medium priority
likely noise
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>high priority</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>medium priority</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>likely noise</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 核心原理

机器学习最小链路是：

```text
raw data
  -> feature table
  -> split train / test
  -> train model
  -> predict new samples
  -> evaluate
  -> feed result back to AIOps workflow
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>raw data</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; feature table</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; split train / test</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; train model</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; predict new samples</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; evaluate</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; feed result back to AIOps workflow</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


### 关键术语拆解

| 术语 | 人话解释 | AIOps 例子 |
|---|---|---|
| sample | 一条可学习的数据 | 某服务某分钟的指标快照 |
| feature | 描述样本的字段 | `error_rate`、`p95_latency_ms` |
| label | 训练时告诉模型的答案 | `is_incident` |
| model | 学到规律的对象 | 告警分类模型 |
| training | 用历史数据学习规律 | 用过去事故训练 |
| inference | 用模型预测新数据 | 给当前告警打分 |
| metric | 衡量模型好坏的方法 | precision、recall |
| drift | 线上数据分布变了 | 新版本上线后指标模式变化 |

## 核心知识树

### 样本、特征、标签

是什么：样本是一行数据，特征是输入字段，标签是要预测的答案。

为什么需要：模型不能直接理解“这个服务有点怪”，它只能处理结构化字段。

怎么工作：

```text
service,timestamp,error_rate,p95_latency_ms,restart_count,is_incident
order-api,10:00,0.01,120,0,0
order-api,10:05,0.35,1800,3,1
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>service,timestamp,error_rate,p95_latency_ms,restart_count,is_incident</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>order-api,10:00,0.01,120,0,0</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code>order-api,10:05,0.35,1800,3,1</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


怎么用：把特征列组成 `X`，把标签列组成 `y`。

坏了怎么查：先看字段是否缺失、单位是否一致、标签是否可信。

### 监督学习

是什么：有标签的数据学习，比如已知哪些告警是真事故。

为什么需要：适合做分类和回归。

怎么工作：模型学习 `X -> y` 的映射。

怎么用：告警降噪、事故风险分类、恢复时间预测。

坏了怎么查：看标签质量、类别是否极度不平衡、测试集表现是否虚高。

### 无监督学习

是什么：没有标签也能找结构，比如聚类或异常点。

为什么需要：AIOps 初期往往没有高质量人工标签。

怎么工作：按数据相似度、密度或距离分组。

怎么用：相似告警聚类、服务行为分群、异常检测。

坏了怎么查：看特征尺度、聚类是否有业务意义、异常比例是否合理。

### 异常检测

是什么：找出和平时模式明显不同的数据点。

为什么需要：事故不一定超过固定阈值，但可能偏离历史正常模式。

怎么工作：常见方法会学习正常样本的分布、密度或隔离难度，再给新样本异常分数。

怎么用：监控指标异常、发布后风险评分、告警候选排序。

坏了怎么查：看训练数据是否混入大量事故、特征是否能表达异常、阈值是否过严或过松。

### 评估指标

是什么：衡量模型结果是否可信。

为什么需要：AIOps 里预测错了有成本，不能只看模型“看起来准”。

怎么工作：把预测和真实标签对比。

怎么用：

| 指标 | 关注点 | AIOps 场景 |
|---|---|---|
| accuracy | 总体猜对比例 | 类别均衡时参考 |
| precision | 报出来的异常有多少是真的 | 减少误报 |
| recall | 真实异常抓住了多少 | 减少漏报 |
| F1 | precision 和 recall 的折中 | 综合比较 |

坏了怎么查：如果事故样本很少，accuracy 可能骗人。比如 99% 正常，模型全猜正常也有 99% accuracy，但没有任何 AIOps 价值。

## 架构和数据流

一个入门 AIOps 机器学习链路可以这样设计：

```text
Prometheus / logs / tickets / deployments
  -> export CSV or query database
  -> pandas clean and aggregate
  -> feature table
  -> train model
  -> evaluate with test set
  -> save model and metrics
  -> FastAPI or batch job
  -> dashboard / alert enrichment / runbook suggestion
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Prometheus / logs / tickets / deployments</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; export CSV or query database</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; pandas clean and aggregate</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; feature table</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; train model</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; evaluate with test set</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; save model and metrics</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 8 行 | <code>  -&gt; FastAPI or batch job</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 9 行 | <code>  -&gt; dashboard / alert enrichment / runbook suggestion</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


关键边界：

- 数据采集仍然由 Prometheus、日志系统、数据库负责。
- 特征处理可以由 pandas 完成。
- 建模可以先用 scikit-learn。
- 模型输出只作为辅助信号。
- 自动化动作必须走审批、审计和回滚策略。

## 安装与启动

第一天只需要 Python、pandas 和 scikit-learn。

```powershell
mkdir aiops-ml-lab
cd aiops-ml-lab
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install pandas numpy scikit-learn
python -c "import sklearn; print('sklearn ok')"
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>mkdir aiops-ml-lab</code> | 创建目录，用来准备实验项目结构。 |
| 第 2 行 | <code>cd aiops-ml-lab</code> | 切换当前目录，确保后续命令在正确项目位置执行。 |
| 第 3 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 4 行 | <code>.\.venv\Scripts\Activate.ps1</code> | 执行 `.\.venv\scripts\activate.ps1` 相关命令，后面的参数决定它具体操作什么对象。 |
| 第 5 行 | <code>pip install pandas numpy scikit-learn</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |
| 第 6 行 | <code>python -c "import sklearn; print('sklearn ok')"</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


预期结果：

```text
sklearn ok
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>sklearn ok</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


如果 `python` 找不到，先确认 Python 已安装并加入 PATH。
如果 PowerShell 不允许激活虚拟环境，用：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass</code> | 执行 `set-executionpolicy` 相关命令，后面的参数决定它具体操作什么对象。 |


## 配置详解

机器学习入门项目最少需要这些配置意识：

| 配置项 | 含义 | 新手容易错在哪里 |
|---|---|---|
| `random_state` | 固定随机种子，便于复现 | 每次结果不同，无法复盘 |
| `test_size` | 测试集比例 | 全部数据拿去训练，评估虚高 |
| `stratify` | 按类别比例切分 | 事故样本太少时测试集没有正例 |
| `class_weight` | 类别不平衡时调整权重 | 事故样本少，模型只学会猜正常 |
| `threshold` | 把概率转成告警的阈值 | 阈值默认 0.5 不一定适合生产 |

## 常用命令

```powershell
python -m venv .venv
pip install pandas numpy scikit-learn
python ml_alert_classifier.py
pip freeze > requirements.txt
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python -m venv .venv</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 2 行 | <code>pip install pandas numpy scikit-learn</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |
| 第 3 行 | <code>python ml_alert_classifier.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |
| 第 4 行 | <code>pip freeze &gt; requirements.txt</code> | 管理 Python 依赖包，通常用于安装实验需要的库。 |


每条命令在检查什么：

| 命令 | 作用 | 正常结果 | 异常时先看 |
|---|---|---|---|
| `python -m venv .venv` | 创建隔离环境 | 出现 `.venv` 目录 | Python 是否安装 |
| `pip install ...` | 安装依赖 | 显示安装成功 | 网络、镜像源、虚拟环境 |
| `python ml_alert_classifier.py` | 运行实验 | 打印评估报告 | 依赖、文件名、语法 |
| `pip freeze > requirements.txt` | 固化依赖 | 生成依赖清单 | 是否在正确虚拟环境 |

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 关键字段 / 参数 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `train_test_split` | 划分训练/测试数据 | `train_test_split(X, y, test_size=0.3)` | `test_size`、`random_state`、`stratify` | 得到训练集和测试集 | 不分测试集导致自嗨 |
| `fit` | 训练模型 | `model.fit(X_train, y_train)` | 输入训练特征和标签 | 模型学到参数 | 把测试集也用于训练 |
| `predict` | 输出类别 | `model.predict(X_test)` | 输入特征矩阵 | 返回 0/1 或类别 | 不知道阈值从哪来 |
| `predict_proba` | 输出概率 | `model.predict_proba(X_test)` | 分类模型支持 | 返回每类概率 | 概率不等于事实 |
| `classification_report` | 输出分类指标 | `classification_report(y_test, y_pred)` | 真实标签和预测标签 | precision/recall/F1 | 类别不平衡时误读 |
| `Pipeline` | 串联预处理和模型 | `make_pipeline(StandardScaler(), LogisticRegression())` | 步骤顺序 | 一次 fit/predict | 预处理泄漏 |

## 在 AIOps 中的作用

机器学习在 AIOps 里更适合作为“检测层”和“辅助判断层”：

```text
metrics / logs / alerts / changes
  -> feature engineering
  -> model score
  -> enrich alert
  -> human review
  -> feedback
  -> retrain or adjust rule
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>metrics / logs / alerts / changes</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>  -&gt; feature engineering</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 3 行 | <code>  -&gt; model score</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 4 行 | <code>  -&gt; enrich alert</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 5 行 | <code>  -&gt; human review</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 6 行 | <code>  -&gt; feedback</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |
| 第 7 行 | <code>  -&gt; retrain or adjust rule</code> | 流程箭头，表示数据、请求或排障步骤从左边流向右边。 |


可落地场景：

- 告警优先级排序。
- 相似事故聚类。
- 发布风险评分。
- 异常指标候选发现。
- 噪声告警识别。
- Runbook 推荐前的事件归类。

## 入门实验

### 实验目标

用一批模拟 AIOps 指标训练一个二分类模型，判断某个指标窗口是否像事故。

最终要看到：

- 模型能输出 `precision`、`recall`、`f1-score`。
- 新样本能输出事故概率。
- 结果可以提交到 GitHub 作为学习证据。

### 实验步骤

创建 `ml_alert_classifier.py`：

```python
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(42)

normal = pd.DataFrame({
    "request_rate": rng.normal(1000, 120, 120),
    "error_rate": rng.normal(0.01, 0.006, 120).clip(0, 1),
    "p95_latency_ms": rng.normal(160, 35, 120).clip(20),
    "restart_count": rng.integers(0, 2, 120),
    "deploy_changed": rng.integers(0, 2, 120),
    "is_incident": 0,
})

incident = pd.DataFrame({
    "request_rate": rng.normal(760, 180, 40),
    "error_rate": rng.normal(0.18, 0.08, 40).clip(0, 1),
    "p95_latency_ms": rng.normal(900, 260, 40).clip(50),
    "restart_count": rng.integers(1, 6, 40),
    "deploy_changed": rng.integers(0, 2, 40),
    "is_incident": 1,
})

df = pd.concat([normal, incident], ignore_index=True)

features = [
    "request_rate",
    "error_rate",
    "p95_latency_ms",
    "restart_count",
    "deploy_changed",
]

X = df[features]
y = df["is_incident"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.3,
    random_state=42,
    stratify=y,
)

model = make_pipeline(
    StandardScaler(),
    LogisticRegression(class_weight="balanced", random_state=42),
)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print("confusion matrix:")
print(confusion_matrix(y_test, y_pred))
print()
print(classification_report(y_test, y_pred, target_names=["normal", "incident"]))

current = pd.DataFrame([{
    "request_rate": 690,
    "error_rate": 0.22,
    "p95_latency_ms": 1200,
    "restart_count": 3,
    "deploy_changed": 1,
}])

incident_probability = model.predict_proba(current)[0][1]
print(f"current incident probability: {incident_probability:.2f}")
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>import numpy as np</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 2 行 | <code>import pandas as pd</code> | 导入 Python 模块，后面的代码会使用这个模块提供的功能。 |
| 第 3 行 | <code>from sklearn.linear_model import LogisticRegression</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 4 行 | <code>from sklearn.metrics import classification_report, confusion_matrix</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 5 行 | <code>from sklearn.model_selection import train_test_split</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 6 行 | <code>from sklearn.pipeline import make_pipeline</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 7 行 | <code>from sklearn.preprocessing import StandardScaler</code> | 从某个模块导入指定对象，减少后面代码的书写量。 |
| 第 8 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 9 行 | <code>rng = np.random.default_rng(42)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 10 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 11 行 | <code>normal = pd.DataFrame({</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 12 行 | <code>    "request_rate": rng.normal(1000, 120, 120),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 13 行 | <code>    "error_rate": rng.normal(0.01, 0.006, 120).clip(0, 1),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 14 行 | <code>    "p95_latency_ms": rng.normal(160, 35, 120).clip(20),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 15 行 | <code>    "restart_count": rng.integers(0, 2, 120),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 16 行 | <code>    "deploy_changed": rng.integers(0, 2, 120),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 17 行 | <code>    "is_incident": 0,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 18 行 | <code>})</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 19 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 20 行 | <code>incident = pd.DataFrame({</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 21 行 | <code>    "request_rate": rng.normal(760, 180, 40),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 22 行 | <code>    "error_rate": rng.normal(0.18, 0.08, 40).clip(0, 1),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 23 行 | <code>    "p95_latency_ms": rng.normal(900, 260, 40).clip(50),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 24 行 | <code>    "restart_count": rng.integers(1, 6, 40),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 25 行 | <code>    "deploy_changed": rng.integers(0, 2, 40),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 26 行 | <code>    "is_incident": 1,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 27 行 | <code>})</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 28 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 29 行 | <code>df = pd.concat([normal, incident], ignore_index=True)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 30 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 31 行 | <code>features = [</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 32 行 | <code>    "request_rate",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 33 行 | <code>    "error_rate",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 34 行 | <code>    "p95_latency_ms",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 35 行 | <code>    "restart_count",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 36 行 | <code>    "deploy_changed",</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 37 行 | <code>]</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 38 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 39 行 | <code>X = df[features]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 40 行 | <code>y = df["is_incident"]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 41 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 42 行 | <code>X_train, X_test, y_train, y_test = train_test_split(</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 43 行 | <code>    X,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 44 行 | <code>    y,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 45 行 | <code>    test_size=0.3,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 46 行 | <code>    random_state=42,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 47 行 | <code>    stratify=y,</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 48 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 49 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 50 行 | <code>model = make_pipeline(</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 51 行 | <code>    StandardScaler(),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 52 行 | <code>    LogisticRegression(class_weight="balanced", random_state=42),</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 53 行 | <code>)</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 54 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 55 行 | <code>model.fit(X_train, y_train)</code> | 训练模型或拟合转换器，让算法从样本数据里学习规律。 |
| 第 56 行 | <code>y_pred = model.predict(X_test)</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 57 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 58 行 | <code>print("confusion matrix:")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 59 行 | <code>print(confusion_matrix(y_test, y_pred))</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 60 行 | <code>print()</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 61 行 | <code>print(classification_report(y_test, y_pred, target_names=["normal", "incident"]))</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |
| 第 62 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 63 行 | <code>current = pd.DataFrame([{</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 64 行 | <code>    "request_rate": 690,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 65 行 | <code>    "error_rate": 0.22,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 66 行 | <code>    "p95_latency_ms": 1200,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 67 行 | <code>    "restart_count": 3,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 68 行 | <code>    "deploy_changed": 1,</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 69 行 | <code>}])</code> | Python 代码行，通常是在调用函数、处理数据结构或把中间结果传给下一步。 |
| 第 70 行 | <em>空行</em> | 空行，用来分隔不同逻辑块，让代码更容易阅读。 |
| 第 71 行 | <code>incident_probability = model.predict_proba(current)[0][1]</code> | 给变量赋值，把右侧计算结果保存起来供后续代码使用。 |
| 第 72 行 | <code>print(f"current incident probability: {incident_probability:.2f}")</code> | 打印输出，用来在实验中确认变量、结果或调试信息。 |


运行：

```powershell
python ml_alert_classifier.py
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>python ml_alert_classifier.py</code> | 运行 Python 解释器或脚本，用来做实验、数据处理或服务启动。 |


### 验证结果

你应该看到类似：

```text
confusion matrix:
[[36  0]
 [ 0 12]]

              precision    recall  f1-score   support
      normal       1.00      1.00      1.00        36
    incident       1.00      1.00      1.00        12

current incident probability: 1.00
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>confusion matrix:</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 2 行 | <code>[[36  0]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 3 行 | <code> [ 0 12]]</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 4 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 5 行 | <code>              precision    recall  f1-score   support</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 6 行 | <code>      normal       1.00      1.00      1.00        36</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 7 行 | <code>    incident       1.00      1.00      1.00        12</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |
| 第 8 行 | <em>空行</em> | 空行，用来把示例结构分成更容易阅读的段落。 |
| 第 9 行 | <code>current incident probability: 1.00</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


这是模拟数据，所以结果可能很好。真实生产数据不会这么干净，重点不是追求 100%，而是学会：

1. 数据如何变成特征。
2. 模型如何训练。
3. 指标如何评估。
4. 输出如何进入 AIOps 流程。

### 如果没有成功

按顺序检查：

1. 虚拟环境是否激活。
2. `pip install pandas numpy scikit-learn` 是否成功。
3. 文件名是否是 `ml_alert_classifier.py`。
4. 是否把 `is_incident` 当成特征输入了。
5. `stratify=y` 是否因为某一类样本太少报错。

## 常见故障排查

### 训练结果特别好

- 可能原因：模拟数据太简单，或者发生数据泄漏。
- 检查方法：确认标签列没有混进 `features`。
- 解决办法：用真实历史数据重新做实验，保留独立测试集。

### accuracy 很高但事故抓不住

- 可能原因：正常样本远多于事故样本。
- 检查方法：看 `recall`，不要只看 accuracy。
- 解决办法：调整阈值、使用 `class_weight`、补充事故样本。

### 线上效果比测试集差

- 可能原因：数据漂移、发布模式变化、服务流量变化。
- 检查方法：对比训练数据和线上数据的特征分布。
- 解决办法：监控模型输入、定期复盘、重新训练。

### 模型输出没人信

- 可能原因：没有证据、没有解释、没有反馈记录。
- 检查方法：每次输出是否附带关键特征、概率、规则对照和历史相似案例。
- 解决办法：先做告警 enrichment，不直接触发动作。

## 面试怎么讲

可以这样说：

```text
机器学习在 AIOps 里不是替代监控，而是把历史指标、告警、变更和事故记录变成可学习的特征，用于异常检测、告警降噪、相似事件聚类和风险评分。我会先用 pandas 清洗数据，构造特征矩阵 X 和标签 y，再用 scikit-learn 做可复现的基线模型。评估时不会只看 accuracy，而会看 precision、recall、混淆矩阵和人工复盘结果。模型输出只作为辅助信号，高风险动作仍然要走 runbook、审批和审计。
```

逐行解释：

| 行 | 内容 | 说明 |
|---|---|---|
| 第 1 行 | <code>机器学习在 AIOps 里不是替代监控，而是把历史指标、告警、变更和事故记录变成可学习的特征，用于异常检测、告警降噪、相似事件聚类和风险评分。我会先用 pandas 清洗数据，构造特征矩阵 X 和标签 y，再用 scikit-learn 做可复现的基线模型。评估时不会只看 accuracy，而会看 precision、recall、混淆矩阵和人工复盘结果。模型输出只作为辅助信号，高风险动作仍然要走 runbook、审批和审计。</code> | 文本示例行，用来展示输出、目录、流程、错误信息或学习证据中的一条内容。 |


## 学习检查清单

- [ ] 我能解释机器学习和规则判断的区别。
- [ ] 我能解释样本、特征、标签、模型。
- [ ] 我能区分监督学习、无监督学习、异常检测。
- [ ] 我能说明为什么需要训练集和测试集。
- [ ] 我能解释 precision 和 recall 的区别。
- [ ] 我能跑通一个告警分类实验。
- [ ] 我能说出数据泄漏和过拟合的风险。
- [ ] 我能说明机器学习在 AIOps 中不能直接替代人工审批。

## 面试题

1. 机器学习在 AIOps 里适合解决什么问题？
2. 规则告警和机器学习异常检测有什么区别？
3. 什么是样本、特征和标签？
4. 监督学习和无监督学习有什么区别？
5. 为什么要划分训练集和测试集？
6. accuracy 为什么可能误导告警降噪场景？
7. precision 和 recall 分别代表什么？
8. 什么是数据泄漏？AIOps 数据里有哪些泄漏风险？
9. 模型上线后为什么还要监控输入数据？
10. 机器学习模型输出能不能直接触发生产修复？

## 学习证据

学习完成后，把下面内容提交到 GitHub：

- `ml_alert_classifier.py`：告警分类最小实验。
- `requirements.txt`：依赖版本。
- `README.md`：说明样本、特征、标签、评估指标。
- 一张运行截图：包含混淆矩阵和分类报告。
- 一条复盘笔记：说明模型不能直接自动修复生产，只能做辅助信号。
