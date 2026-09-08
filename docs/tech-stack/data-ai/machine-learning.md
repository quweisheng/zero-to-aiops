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
Machine Learning（机器学习）
  -> problem framing（明确预测问题）
     -> 你要预测什么
     -> 你有什么数据
     -> 预测错了有什么成本
  -> data（数据）
     -> samples（样本）
     -> features（特征）
     -> labels（标签答案）
     -> train / validation / test（训练集 / 验证集 / 测试集）
  -> learning types（学习类型）
     -> supervised learning（监督学习）
     -> unsupervised learning（无监督学习）
     -> anomaly detection（异常检测）
  -> model training（模型训练）
     -> fit（拟合）
     -> loss（损失函数）
     -> parameters（学习得到的参数）
     -> hyperparameters（训练前选定的超参数）
  -> inference（推理）
     -> predict（预测）
     -> score / probability（分数 / 概率）
  -> evaluation（评估）
     -> confusion matrix（混淆矩阵）
     -> precision / recall（精确率 / 召回率）
     -> ROC / AUC（分类阈值曲线 / 曲线下面积）
     -> business review（业务复核）
  -> production concerns（生产问题）
     -> data drift（数据分布漂移）
     -> model version（模型版本）
     -> monitoring（监控）
     -> rollback（回滚）
```

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
普通程序是人写规则：

```text
if error_rate > 0.05:
    alert()
```

机器学习是给程序很多历史样本，让它学习一条不容易手写的边界：

```text
request_rate + error_rate + latency（延迟） + deploy_changed + restart_count
  -> incident（故障） / noise
```

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
机器学习可以把这些字段变成特征，让模型学习组合模式。

### 问题 3：告警太多

有些告警每次都会自动恢复，有些告警一定要人工处理。机器学习可以先做辅助排序：

```text
high priority
medium priority
likely noise
```

## 核心原理

机器学习最小链路是：

```text
raw data（数据）
  -> feature table（特征表）
  -> split train / test（划分训练集与测试集）
  -> train model（训练模型）
  -> predict（预测） new samples
  -> evaluate（评估）
  -> feed result（结果） back to AIOps workflow（工作流）
```

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
Prometheus / logs（日志） / tickets（工单） / deployments
  -> export CSV（逗号分隔表格文件） or query（查询） database
  -> pandas clean（清洗） and aggregate（聚合）
  -> feature table（特征表）
  -> train model（训练模型）
  -> evaluate with test set（用测试集评估）
  -> save model（模型） and metrics（指标）
  -> FastAPI or batch（批次） job
  -> dashboard（仪表盘） / alert（告警） enrichment / runbook（操作手册） suggestion（建议）
```

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

预期结果：

```text
sklearn ok
```

如果 `python` 找不到，先确认 Python 已安装并加入 PATH。
如果 PowerShell 不允许激活虚拟环境，用：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

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
metrics（指标） / logs（日志） / alerts / changes
  -> feature engineering（特征工程）
  -> model（模型） score（分数）
  -> enrich alert（告警）
  -> human review（人工复核）
  -> feedback（反馈）
  -> retrain or adjust rule（重新训练或调整规则）
```

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

运行：

```powershell
python ml_alert_classifier.py
```

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

## 老师带你把“预测事故”变成一个严谨问题

学生：“我把告警文件交给模型，它就能知道什么时候出事故吗？”老师：“先告诉我，你希望在什么时刻做决定，而且那个时刻已经能看到哪些信息。”如果目标是在 10:00 预测未来五分钟是否发生事故，10:03 的错误日志和 10:20 才填写的根因不能放进输入。数据里存在这个字段，不代表预测当时就能获得它。

一个样本可以定义为“某服务截至当前的一分钟观察窗口”；特征是过去五分钟错误率、延迟变化和重启次数；标签是之后五分钟是否由人工确认事故。这里存在观察窗口、预测窗口和标签到达延迟三个时间概念。先画时间线，后写训练代码，能防止很多看起来准确的作弊模型。

监督学习用已有答案学映射；回归预测数值，例如预计剩余容量天数；分类预测类别，例如告警是否需要人工。无监督方法学习分组或偏离程度，没有标签不代表不需要人工验证。异常检测模型只是发现“不像训练时的样子”，它不知道计划内压测是不是事故，所以分数还要结合维护窗口与业务证据。

### 损失函数和业务损失不是一个东西

Loss（损失函数）给训练算法一把尺子，让它知道参数应该往哪个方向调整。逻辑回归通常通过分类损失学习特征权重，正则化限制过于复杂的拟合；你调的正则化强度属于超参数，训练得到的具体权重属于参数。训练不是把所有历史记录原样记下来，而是在模型假设下寻找能解释样本的规律。

模型优化的数学损失与值班成本还隔一层。漏掉支付故障可能比多提醒一次严重得多，阈值不能盲目固定 0.5。应在验证集上比较不同阈值对应的误报数、漏报数、人工处理量与事故覆盖，选择满足业务预算的一点，再对独立测试集做最终评估。

如果 10,000 个窗口只有 20 个事故，全猜正常也能得到 99.8% 正确率。假设模型报 30 次、其中 15 次是真的，那么精确率是 15/30=50%，召回率是 15/20=75%。这几个数字说明的事情不同：一半提醒有价值，四分之一事故仍漏掉。把分母说清楚，你就不会被漂亮总分带偏。

### 拆分数据：同一场事故不能换个名字出现在考卷里

随机拆分适用于独立样本的入门演示，但运维窗口常高度相关。同一事故连续五十分钟的数据如果被随机分到训练和测试，模型可能只是在认熟悉事故。生产评估要按时间以及服务、主机或事故事件进行合理分组；训练早期、验证中期、测试后期，并检查跨边界窗口重叠。

预处理也会泄漏。先在所有数据上计算均值填空、标准差缩放或筛选相关特征，再划分测试集，相当于提前偷看考卷分布。用 Pipeline（处理流水线）把预处理和模型一起放在训练折内拟合，测试时只做已经确定的转换。官方 [常见陷阱](https://scikit-learn.org/stable/common_pitfalls.html) 对这个边界有专门说明。

### 可回收故障实验：发现偷偷混入的答案

前提是前文 Python 实验依赖已安装。把下面保存为 `leakage_lesson.py`，只生成合成数据，不读取生产文件：

```python
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

rng = np.random.default_rng(42)
y = rng.integers(0, 2, 2000)
x = rng.normal(size=(2000, 4))  # 特意设计成与标签无关
train, test = train_test_split(np.arange(len(y)), random_state=42)
clean = DecisionTreeClassifier(max_depth=3, random_state=42)
clean.fit(x[train], y[train])
print('clean:', accuracy_score(y[test], clean.predict(x[test])))

leaked = np.column_stack([x, y])  # 故意把答案混成第 5 个输入字段
wrong = DecisionTreeClassifier(max_depth=3, random_state=42)
wrong.fit(leaked[train], y[train])
print('leaked:', accuracy_score(y[test], wrong.predict(leaked[test])))
assert accuracy_score(y[test], wrong.predict(leaked[test])) == 1.0
```

正常输入预期接近随机猜测，泄漏输入得到 1.0。这不是模型突然变聪明，而是读取了答案。恢复方法是移除标签列，并建立“预测当时是否已知”的字段白名单；重新运行，性能回到合理基线才是实验成功。若干净结果也很高，核对是否确实随机生成独立标签、是否错误地在训练集上评分。清理删除该教学脚本即可，无后台服务或外部费用。

接着自己加入一个“事故处理完成时间”字段，解释它为什么也是隐蔽答案。故障记录应包括输入列、划分方式、两次分数、泄漏位置与修复后指标，不能只截取 100% 那张图放入作品集。

### 从离线模型到生产：状态、容量和回滚

模型文件只是发布物的一部分。还要绑定特征定义、单位、列顺序、预处理、标签规则、训练时间范围、依赖版本和阈值。它们共同决定结果；只替换模型文件却沿用错误的毫秒/秒转换，会让正常请求被大面积标成异常。

先做影子评估：接收真实形状的输入，但预测不影响处理流程；比较分布、缺失率、推理延迟和人工结果。再把分数用于排序或证据补充，保留已有规则兜底。每次升级固定评估集，同时观察新时间窗口，防止只优化一份旧考卷。

高可用要区分无状态推理副本和有状态特征聚合。推理副本可以复制同一版本；滚动窗口状态丢失会改变输入，需要定义冷启动和恢复方式。容量测量按输入速率、批大小、CPU/内存与延迟预算，超时有降级，队列有上限。回滚必须同时回退模型、预处理和阈值，记录哪些请求使用了哪一版。

数据漂移表示输入分布变化，概念漂移表示输入与标签关系变化，两者不完全相同。大促改变请求量可能只是分布变化，故障处置流程改变则可能让旧标签不再对应新业务价值。告警模型需要持续人工反馈，不能只靠输入分布检测宣称准确率没有下降。

### 面试课堂：怎么说出你真正做过的思考

30 秒：我先确定预测时刻、可用字段和误判成本，用独立数据建立基线，重点看事故召回和误报预算；再把预处理、模型和阈值一起版本化，输出先辅助值班人员。

3 分钟：从一分钟服务窗口讲样本和标签，说明为什么按时间与事故分组；用泄漏实验解释测试高分不等于上线可用；给出混淆矩阵和阈值选择，再讲影子运行、漂移监控、反馈与回滚。把自己的实验范围说明白，比宣称“自动判断所有故障”可信。

追问为什么选简单模型：它提供可解释、成本低的基线，复杂模型需要在同一评估和成本约束下证明增益。追问怎么发现上线崩坏：核对特征合同、缺失率、单位、版本和结果分布，结合延迟标签再确认业务效果。事故题可以设置“采集端把毫秒改成秒”，修复先恢复单位契约，不能看到告警多就临时把阈值调高。

## 机制精讲：先不用框架，亲手理解模型为什么会改变

### 预测函数、参数、损失、梯度、学习率

先想一个简化问题：根据请求量预测服务 CPU。假定输入 `x` 是已经缩放的请求量，输出 `y` 是相应负载，模型先使用 `预测值 = w × x`。`w` 是可学习参数，好比你估计“每增加一份请求大概增加多少负载”。这个模型省略了截距和现实中的非线性，只用来说明学习机制，不能直接拿它做生产容量承诺。

若样本为 `x=3, y=6`，而 `w=1`，模型预测 3，离答案差 3。平方损失把误差平方后变成 9，使正负误差不会相互抵消，并让较大误差受到更重惩罚。训练就是有规则地修改 `w`，希望损失变小。一个训练样本做得好不代表未见过的数据好，所以“会降低损失”和“会泛化”是两个阶段的问题。

梯度告诉我们，在当前位置轻轻增加参数会让损失朝哪个方向变化。这里损失对 `w` 的变化率是 `2 × (w×x-y) × x`，代入得到 -18。负号表示稍微增加 `w` 会降低损失，因此更新式用“旧参数减去学习率乘梯度”。学习率像每次迈多大一步，方向正确但步幅过大，仍可能越过谷底并越走越远。

下面是完全不依赖第三方库的基础实验。保存为 `gradient_lesson.py`，使用 Python 3 运行。它只处理一个合成样本，不读取文件、不联网、不启动服务。

```python
def train(rate):
    w, x, y = 1.0, 3.0, 6.0
    losses = []
    for _ in range(12):
        error = w * x - y
        losses.append(error ** 2)
        gradient = 2 * error * x
        w -= rate * gradient
    return w, losses

weight, normal = train(0.05)
assert normal[-1] < normal[0]
print('normal decreasing:', normal[-1] < normal[0])
print('weight near 2:', round(weight, 4))

_, broken = train(0.2)  # 故障注入：同一方向，步子却太大
assert broken[-1] > broken[0]
print('DETECTED divergence:', broken[-1] > broken[0])
_, recovered = train(0.05)
print('recovered:', recovered[-1] < recovered[0])
```

预期正常损失下降，权重靠近 2；学习率改大后损失增长；恢复原学习率后再次下降。不要记住“0.05 总是安全”，这个值只针对当前小模型和输入尺度。换输入尺度、损失、模型或优化器，合适范围会变化。若结果不符，检查更新负号、平方误差和每轮是否重新计算梯度。清理只需退出 Python，教学文件可留作证据。

这个实验也解释特征缩放为何重要：某些特征数值特别大，会改变优化曲面的尺度，让同一个步幅在不同方向效果悬殊。标准化是常见帮助，但必须只从训练数据估计统计量。树模型的切分机制与梯度优化线性模型不同，不能把“所有算法必须标准化”当口号。

### 从一个样本到一批样本

批次就是一次用来估计更新方向的一组样本。整批训练使用全部样本计算，方向较稳定但单步成本可能高；小批次每次只用一部分，单步轻一些但有随机波动。Epoch（训练轮次）表示按训练安排完整看过一轮训练数据，不是一次参数更新；同样十个轮次，数据量和批大小不同，更新次数也可能不同。

批次小、训练曲线抖动，不必然意味着失败；训练曲线很平滑，也可能是学习率小到几乎不学习。判断要同时看训练损失、验证指标、数据读取速度和模型输出。遇到 `NaN`，先检查输入非有限值、数值范围、损失计算和学习率；不要只换随机种子，让错误偶尔隐藏。

参数是从数据学到的权重，超参数是训练前或搜索时选的控制项，例如树深度、正则化强度、学习率。把超参数搜索做得很大，也会在验证集上过度选择。你要付出的不仅是计算成本，还有评估被反复使用的偏差。先做一个简单基线，再按错误分析有目的地增加复杂度。

## 泛化精讲：模型为什么在历史上优秀，在明天失败

### 欠拟合、过拟合和数据边界

欠拟合像只会用一条直线解释所有弯曲关系，训练和验证都不理想；过拟合像背下练习卷里的特殊细节，训练好而验证差。增加模型能力可能改善欠拟合，却加重过拟合；更多高质量、与上线相关的数据可能改善泛化，但重复复制旧数据不等于增加独立信息。

正则化约束参数或模型复杂度，是告诉模型“不要为解释少数训练样本做过于激烈的弯折”。早停则根据验证表现决定不再继续训练。两者是不同机制，也都不能挽救包含未来答案的数据。若训练、验证都达到近乎完美，别只庆祝，先检查是否把同一记录、同一事故或答案派生字段分到了两边。

样本数量还要看有效独立性。每天每秒采集一个服务，一个月看起来有数百万行，但很多相邻行几乎一样。对于罕见事故，真正独立的故障案例可能只有个位数。评估应报告事故数量、服务覆盖和时间范围，避免用海量正常采样行掩盖少数故障样本的不确定性。

### 标签不是天然真相

工单关闭不总等于事故真正恢复：可能人工延迟关闭，也可能自动关闭后仍在影响用户。告警被静默不等于误报：它可能是计划维护，也可能是疲劳下的错误操作。你需要写清标签来源、规则、复核方法和争议处理，而不是把系统里任何二值字段直接当正确答案。

标签迟到会影响评估。今天上午预测的事故，到晚上才有人确认，下午就统计精确率会把尚未确认的真事故算成误报。为标签设置成熟窗口，区分已确认、待确认和无法判断，并允许后续重算。没有标签的时期可以监控数据合同和分数分布，但不能据此宣称业务精确率稳定。

采样同样改变解释。为了训练方便，把正常与异常样本采成一比一，而线上异常只有千分之一时，模型分数的概率解释和阈值表现可能变化。最终测试应尽量符合真实到达分布，或明确加权与校准假设。不要把平衡训练集上的 95% 精确率直接承诺给真实值班系统。

### 相关性不能直接升级成自动修复

模型发现发布后经常出现错误，并不证明每次错误都由发布造成。流量高峰、维护窗口和第三方故障可能同时影响发布与错误。解释工具给出某特征对预测的贡献，主要解释模型行为，不自动证明现实因果。根因分析仍需时间线、依赖拓扑、变更范围、对照对象和可验证的机制。

因此模型适合先做排序、关联、证据摘要或候选分流。自动执行重启、扩容、清数据等动作，必须另有权限、前置条件、审批、幂等和回滚。即使某模型在离线测试里召回很好，也不能据此跨过生产变更的安全边界。老师希望你建立的是“模型给信号、系统管行动”的分层思维。

## 从实验到生产的连续设计题

题目：给三百个服务建立异常提醒，白天有促销流量，夜间有备份任务，每班值班人员最多能复核五十条新候选。先明确服务异质性：高流量服务和低流量服务的正常范围可能不同，不能用一个未分组的全局绝对阈值覆盖全部。基线可以按服务、时段或可解释规则建立，并保留无模型兜底。

第二步定义业务评估。你要在事件层统计发现了多少真实事故、平均提前多久、每班有多少需人工复核的候选，以及重复通知比例。再对不同严重等级、服务类型和时段分层，防止总分很好却漏掉关键支付服务。评估样本里应包含促销、维护、采集故障和发布，而不只选模型擅长的普通日。

第三步设计数据状态。在线窗口聚合需要记住过去数据，服务重启后的窗口可能不完整；明确冷启动标记，不把不足一分钟的窗口假装完整一分钟。特征写入、模型版本与阈值版本都进入预测记录，后续才能复算。当同一事件重放时，使用稳定事件身份避免重复建单，模型重新给分不等于业务需要再执行一遍。

第四步规定上线和回滚。影子阶段输出不影响处置，先检验输入合同、时延、分数和人工反馈；灰度阶段按少量服务启用排序，保留旧规则；若通知预算突破或重要事故遗漏，按预定条件回退策略与模型包。阈值、特征和模型一起受版本控制，但不意味着每次只能一齐修改；分别定位、成组回滚要有清楚的兼容关系。

第五步是持续学习而非无人监督的自动重训。数据漂移出现后，先判定是合法业务变化、采集口径变化还是数据错误。重新训练前复核标签与评估窗口，新模型必须通过相同门禁。若生产误报被自动写成训练标签，模型可能不断学习自己的错误，形成反馈环；保留人工独立反馈和随机抽检是打断这种循环的办法。

## 面试连续追问：把选择讲成证据

“为什么不直接用最复杂模型？”回答先建低成本基线，比较新增模型在同一时间拆分、事件指标和延迟预算上的增益；再用错误类型决定需要非线性、更长上下文还是更好的数据。复杂模型不能解决不存在的标签、错误单位和未来泄漏。

“分布变化了就一定要重训吗？”回答不一定。流量翻倍可能仍在模型可处理范围，也可能只是采集单位变化；先观察预测误差、分层指标和标签成熟情况。数据分布变化是诊断信号，不是自动重训命令。修复数据合同与重新学习业务规律是两种不同动作。

“上线效果下降怎么查？”从数据到决策逐层对照：输入合同、特征可用性、转换状态、模型版本、原始分数、阈值、合并去重、人工标签。先拿固定样本复现，再定位哪个边界变化；影响扩大时停止推广并回退，不用不断调整阈值掩盖原因。结束时给出恢复条件和未覆盖风险，而不是只报一个更漂亮的准确率。

### 最后的自测：不要把实验记录写成履历包装

合上文章，选一个服务窗口说明输入何时可用、标签何时成熟、训练为什么降低损失，以及上线为什么仍可能失败。再拿手工梯度实验指出学习率过大导致发散的具体证据，用泄漏实验解释“测试满分为何更值得警惕”。如果不能脱离代码解释这些结果，先回到机制课堂，不急着堆更复杂的框架。

学习证据应分别标明理论推导、合成数据运行、离线评估、影子运行和真实生产验证。没做过的层级写明未覆盖；不要把教程中的预期输出说成自己完成的生产案例。技术深度可以通过清楚的假设、可复现实验和诚实边界表达，不需要虚构部署规模或业务收益。

## 本课 GitHub 学习证据

学习完成后，把下面内容提交到 GitHub：

- `ml_alert_classifier.py`：告警分类最小实验。
- `requirements.txt`：依赖版本。
- `README.md`：说明样本、特征、标签、评估指标。
- 一张运行截图：包含混淆矩阵和分类报告。
- 一条复盘笔记：说明模型不能直接自动修复生产，只能做辅助信号。
