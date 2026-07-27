# TensorFlow 深讲

> 学习目标：从零理解 Tensor、自动微分、Keras、`tf.data`、训练与验证、模型保存和在线推理，能独立完成一个 AIOps 告警风险分类实验，并能回答大型企业面试中关于计算图、分布式训练、性能、数据泄漏、模型漂移、发布回滚和故障排查的追问。

## 版本边界

本文使用以下版本边界：

- TensorFlow：`2.21.0`。
- Python：`3.10` 到 `3.13`。
- 示例基线：Python `3.13` + TensorFlow `2.21.0`。
- TensorFlow `2.21` 不再支持 Python `3.9`。
- 从 TensorFlow `2.21` 开始，`tensorboard` 不再作为 `tensorflow` 包的直接依赖；要使用 TensorBoard 时需显式安装。
- Windows 原生 GPU 支持停留在 TensorFlow `2.10`。TensorFlow `2.11` 及以后在 Windows 上使用 NVIDIA GPU，应采用 WSL2；Windows 原生仍可运行 CPU 版本。

版本和硬件支持会变化，安装前以 [TensorFlow pip installation](https://www.tensorflow.org/install/pip) 和 [TensorFlow releases](https://github.com/tensorflow/tensorflow/releases) 为准。

## 官方资料

- [TensorFlow repository and releases](https://github.com/tensorflow/tensorflow)
- [Install TensorFlow with pip](https://www.tensorflow.org/install/pip)
- [TensorFlow basics](https://www.tensorflow.org/guide/basics)
- [Introduction to tensors](https://www.tensorflow.org/guide/tensor)
- [Automatic differentiation](https://www.tensorflow.org/guide/autodiff)
- [Introduction to graphs and tf.function](https://www.tensorflow.org/guide/intro_to_graphs)
- [Better performance with tf.function](https://www.tensorflow.org/guide/function)
- [Keras built-in training methods](https://www.tensorflow.org/guide/keras/training_with_built_in_methods)
- [tf.data performance](https://www.tensorflow.org/guide/data_performance)
- [Distributed training with Keras](https://www.tensorflow.org/guide/keras/distributed_training)
- [Checkpoint training state](https://www.tensorflow.org/guide/checkpoint)
- [SavedModel format](https://www.tensorflow.org/guide/saved_model)
- [TensorFlow Profiler](https://www.tensorflow.org/guide/profiler)
- [Mixed precision](https://www.tensorflow.org/guide/mixed_precision)
- [TensorFlow Extended](https://www.tensorflow.org/tfx/guide)
- [TensorFlow Serving with Docker](https://www.tensorflow.org/tfx/serving/docker)

本文按 AIOps 实战重新组织官方概念，不复制官方教程全文。API 的精确签名、硬件矩阵和版本变化应回到官方文档核对。

## 官方知识地图

```text
TensorFlow
  ├── tensor computation
  │   ├── Tensor
  │   ├── Variable
  │   ├── operation
  │   ├── device
  │   └── dtype / shape / rank
  ├── model development
  │   ├── keras.Layer
  │   ├── keras.Model
  │   ├── loss
  │   ├── optimizer
  │   ├── metric
  │   └── callback
  ├── execution
  │   ├── eager execution
  │   ├── GradientTape
  │   ├── tf.function
  │   └── graph tracing
  ├── data
  │   ├── tf.data.Dataset
  │   ├── map / batch / shuffle
  │   ├── cache
  │   └── prefetch
  ├── scale and performance
  │   ├── distribution strategy
  │   ├── mixed precision
  │   ├── XLA
  │   └── profiler
  └── delivery
      ├── checkpoint
      ├── .keras model
      ├── SavedModel
      ├── TensorFlow Serving
      └── TFX pipeline
```

`dtype` 是数据类型，`shape` 是各维长度，`rank` 是维度数量；`XLA` 是加速线性代数编译器；`TFX` 是 TensorFlow Extended，用于构建生产机器学习流水线。

## 场景开场

一个支付系统每分钟产生 CPU、内存、接口延迟和错误率。传统规则是“错误率高于 5% 就告警”，但实际情况更复杂：

- 发布后 CPU 和延迟一起缓慢上涨，但任何单项都没越过阈值。
- 大促时 CPU 很高却是正常负载。
- 某些故障先出现延迟，再出现错误率。
- 新版本改变了指标分布，旧模型开始大量误报。

你希望用历史样本训练一个模型，输入四个指标，输出“未来窗口发生故障的概率”。训练只是第一步，还必须回答：

- 训练集和测试集有没有时间穿越？
- 归一化是否偷看了测试数据？
- 为什么验证集很好，生产误报却很高？
- 输入有 `NaN`、字段错序或单位变化时怎么办？
- 新模型如何灰度、监控和回滚？

TensorFlow 能完成张量计算、模型训练和交付，但生产质量取决于完整的数据与工程链路。

## 一句话人话版

TensorFlow 是一个数值计算和机器学习框架：你用 Tensor 表示数据，用 Keras 定义模型，它自动计算梯度并更新参数，最后把训练好的模型保存并用于预测。

## 小白最先会问的 10 个问题

### TensorFlow 和 Python 是什么关系

Python 是编写训练程序的语言，TensorFlow 是其中一个计算框架。你写 Python API，真正的大规模张量运算由 TensorFlow 的底层实现调度到 CPU、GPU 或其他设备。

### Tensor 是不是数组

可以先把 Tensor 理解为“带数据类型和形状的多维数组”。但它还会参与设备放置、自动微分和计算图，不能只当普通 Python 列表。

### Keras 和 TensorFlow 是什么关系

Keras 是高层模型 API，用于搭建 Layer、Model、训练循环和保存模型。TensorFlow 提供底层张量、自动微分、图执行和设备能力。日常建模通常从 Keras 开始。

### 训练到底在做什么

模型先根据输入算预测，loss 衡量预测与真实答案的差距，自动微分求每个参数对 loss 的影响，optimizer 再沿着降低 loss 的方向更新参数。这个过程反复执行。

### Epoch、Batch 和 Step 有什么区别

- Batch：一次送入模型的一小批样本。
- Step：处理一个 batch 并更新一次参数。
- Epoch：完整遍历一遍训练数据。

如果有 1000 个样本，batch size 为 100，那么一个 epoch 大约有 10 个 step。

### 为什么不能拿全部数据训练

如果没有独立验证集和测试集，你只能知道模型记住训练数据的程度，不能估计它面对未见数据的表现。

### 准确率高是不是模型就好

不一定。如果 99% 时间都正常，一个永远预测正常的模型也有 99% accuracy，却漏掉全部故障。AIOps 常需要同时看 recall、precision、误报率、漏报率、检测提前量和业务成本。

### GPU 一定更快吗

不一定。小模型、小 batch 或数据读取很慢时，GPU 等待和传输开销可能超过计算收益。需要用 Profiler 观察，而不是只看有没有 GPU。

### 训练好的模型能直接上线吗

不能。还需要固定输入字段、单位、缺失值策略、模型版本、阈值、服务接口、监控、灰度和回滚。

### TensorFlow 是不是 AIOps 必选

不是。小数据和传统算法可能更适合 scikit-learn；研究和大模型生态常选 PyTorch。TensorFlow 的价值在成熟张量计算、Keras、分布式策略和生产交付生态。选择应由问题、团队和运行环境决定。

## 为什么 AIOps 工程师要掌握 TensorFlow

TensorFlow 可以用于：

- 多指标异常检测。
- 告警风险分类和降噪。
- 容量与负载预测。
- 日志文本分类。
- 根因候选排序。
- 故障时间序列预测。
- 模型在线推理和批量评分。

它在 AIOps 链路中通常处于“数据特征之后、决策动作之前”：

```text
metrics / logs / traces / events
                |
                v
cleaning / windowing / feature engineering
                |
                v
        TensorFlow model
                |
                v
probability / anomaly score / class
                |
                v
threshold / policy / human review
                |
                v
alert routing / RCA / automation
```

模型输出是证据，不是天然正确的生产命令。高风险自动修复必须加策略、审批、影响范围和回滚。

## 学习边界

本文重点是“从基础张量到可交付 AIOps 模型”的完整主线：

- Tensor、Variable、Operation 和设备。
- 自动微分、Keras、loss、optimizer 和 metric。
- `tf.data` 输入流水线。
- 训练、验证、测试和数据泄漏。
- `tf.function`、计算图和 retracing。
- 分布式训练和性能排查。
- 模型保存、Serving、监控和回滚。
- 基础实验与脏数据故障注入。

本文不深入推导每个神经网络数学证明，也不覆盖视觉、NLP、强化学习的全部模型。先掌握通用工程地基，再按任务学习 CNN、Transformer 或时序网络。

## TensorFlow 的核心对象

### Tensor

**是什么：** Tensor 是带 `dtype` 和 `shape` 的不可变多维数据。

**为什么需要：** 统一数据表示后，同一套操作可以运行在 CPU、GPU 或分布式设备上，并参与自动微分和图优化。

**如何工作：** TensorFlow operation 接收一个或多个 Tensor，再产生新的 Tensor。Tensor 本身不能原地修改。

**怎么使用或观察：**

```python
import tensorflow as tf

x = tf.constant([[1.0, 2.0], [3.0, 4.0]], dtype=tf.float32)
print("shape:", x.shape)
print("rank:", tf.rank(x).numpy())
print("dtype:", x.dtype)
print("device:", x.device)
```

预期：

- `shape` 为 `(2, 2)`，表示两行两列。
- `rank` 为 `2`，表示二维。
- `dtype` 为 `float32`。
- `device` 显示 Tensor 实际放在哪个设备。

**坏了怎么查：** 先打印 shape、dtype 和最小最大值。多数初学者错误来自维度不匹配、整数参与除法、字符串未解析或设备内存不足。

### Variable

**是什么：** `tf.Variable` 是可修改的张量状态。

**为什么需要：** 模型权重在训练时要不断更新，不能使用不可变常量。

**如何工作：** Optimizer 根据梯度对 Variable 执行更新；Checkpoint 也会保存这些变量。

```python
weight = tf.Variable(2.0, name="weight")
weight.assign_sub(0.1)
print(weight.numpy())
```

`assign_sub(0.1)` 表示从当前值减去 `0.1`。

**怎么观察：** 查看 `model.trainable_variables`、参数数量和梯度是否为 `None`。

**坏了怎么查：** 如果参数不更新，检查变量是否 trainable、是否在 `GradientTape` 观察范围内、loss 是否真的依赖该变量。

### Operation 与 Eager Execution

Operation 是张量运算，例如矩阵乘法、加法、激活函数。TensorFlow 2 默认 eager execution，即执行一行立刻得到结果，便于调试。

```python
a = tf.constant([[1.0, 2.0]])
b = tf.constant([[3.0], [4.0]])
c = tf.matmul(a, b)
print(c.numpy())
```

`tf.matmul` 做矩阵乘法，结果是 `1×3 + 2×4 = 11`。

Eager 易调试，但每个 Python 调用可能有额外开销。稳定计算可用 `tf.function` 转成图执行。

### Device

TensorFlow 会把 operation 放到可用设备。查看设备：

```python
print(tf.config.list_physical_devices())
print(tf.config.list_physical_devices("GPU"))
```

GPU 列表为空不一定是 TensorFlow 安装损坏，还可能是：

- 当前安装是 CPU 路径。
- Windows 原生版本边界不支持。
- WSL2、驱动或 CUDA 运行库不匹配。
- GPU 未透传到容器。
- 设备被环境变量隐藏。

## 自动微分

### GradientTape

**是什么：** `tf.GradientTape` 记录前向计算，用于自动求导。

**为什么需要：** 神经网络可能有数百万参数，手工推导和实现每个梯度不可行。

**如何工作：** Tape 记录变量到 loss 的运算路径，再反向应用链式法则。

```python
import tensorflow as tf

w = tf.Variable(3.0)

with tf.GradientTape() as tape:
    loss = (w - 1.0) ** 2

gradient = tape.gradient(loss, w)
print("loss:", loss.numpy())
print("gradient:", gradient.numpy())
```

当 `w=3` 时，`(w-1)^2` 的梯度为 `2×(3-1)=4`。

**怎么观察：** 打印 loss、每层梯度范数和是否出现 `None`、`NaN` 或极大值。

**坏了怎么查：**

- 梯度为 `None`：计算路径断开，可能转成了 NumPy 或使用了不可导操作。
- 梯度为 `NaN`：输入、loss 或数值范围异常。
- 梯度爆炸：考虑输入缩放、学习率、梯度裁剪和模型结构。
- 梯度接近 0：检查激活饱和、初始化和网络深度。

## Keras 模型结构

### Layer

Layer 是一层可复用计算，持有权重并实现输入到输出的变换。`Dense` 是全连接层：

```text
output = activation(input × weight + bias)
```

`ReLU` 激活把负值变为 0，保留正值，使多层网络能够学习非线性关系。

### Model

Model 把 Layer 连接成完整输入输出，并提供 `fit`、`evaluate`、`predict`、`save` 和 `export`。

```python
from tensorflow import keras

model = keras.Sequential(
    [
        keras.Input(shape=(4,), name="metrics"),
        keras.layers.Dense(16, activation="relu"),
        keras.layers.Dense(1, activation="sigmoid"),
    ]
)
```

- 输入 shape `(4,)` 表示每个样本有 4 个特征。
- 中间层有 16 个神经元。
- `sigmoid` 把输出压到 `0` 到 `1`，可解释为二分类概率。

### Loss

Loss 是训练优化目标。二分类常用 binary cross-entropy：

```text
真实为 1 但预测接近 0 -> loss 很大
真实为 0 但预测接近 1 -> loss 很大
预测接近真实标签     -> loss 较小
```

Loss 下降不代表生产目标一定改善。模型可能过拟合、数据泄漏，或优化了不合适的代理目标。

### Optimizer

Optimizer 根据梯度更新参数。Adam 常作为起点：

```python
optimizer = keras.optimizers.Adam(learning_rate=1e-3)
```

`1e-3` 等于 `0.001`。学习率太大可能震荡或 `NaN`，太小则收敛很慢。

### Metric

Metric 用于评价，不直接等于优化目标。二分类常看：

- Precision：被模型判为故障的样本中，有多少真的故障。
- Recall：真实故障中，有多少被模型抓到。
- AUC：模型在不同阈值下区分正负样本的能力。
- Confusion matrix：TP、FP、TN、FN 四种结果。

`TP` 是正确识别故障，`FP` 是误报，`TN` 是正确识别正常，`FN` 是漏报。

## 训练循环到底发生了什么

```text
batch enters model
      |
      v
forward pass produces predictions
      |
      v
loss compares predictions with labels
      |
      v
GradientTape computes gradients
      |
      v
optimizer updates trainable variables
      |
      v
metrics record current behavior
```

`model.fit()` 把这套循环封装起来。需要特殊算法时可以重写 `train_step` 或写自定义循环，但初学阶段先掌握内置训练流程、回调和数据管道。

## 数据集拆分和数据泄漏

### Train、Validation 与 Test

- Train：用于拟合权重。
- Validation：用于选择超参数、阈值和停止时机。
- Test：只在最终方案确定后评估一次。

如果反复根据 test 结果改模型，test 就被间接用于训练，不再是独立证据。

### 时间序列不能随意随机打散

AIOps 数据有时间顺序。推荐：

```text
oldest data       newer data       newest data
    train      -> validation    ->    test
```

随机拆分可能让未来模式进入训练集，产生时间穿越。还要按故障事件或主机分组，避免同一次故障的相邻窗口分散到 train 和 test。

### 常见泄漏

- 用全量数据计算均值和标准差，再拆分。
- 特征中包含故障结束后才知道的字段。
- 标签由告警规则直接生成，同时把该规则结果作为特征。
- 同一请求或同一故障的重复样本进入不同集合。
- 训练前对全量数据做缺失值填充。

正确做法是只在训练集 `adapt` 或计算统计量，再把相同参数用于 validation、test 和生产。

## tf.data 输入流水线

### Dataset

**是什么：** `tf.data.Dataset` 是可组合的数据读取和转换流水线。

**为什么需要：** 模型计算很快时，文件读取、解析和预处理可能让 GPU 一直等待。

**如何工作：**

```text
source
  -> parse
  -> filter
  -> shuffle training data
  -> batch
  -> prefetch
```

**怎么使用或观察：**

```python
train_ds = (
    tf.data.Dataset.from_tensor_slices((x_train, y_train))
    .shuffle(buffer_size=len(x_train), seed=42)
    .batch(64)
    .prefetch(tf.data.AUTOTUNE)
)
```

- `from_tensor_slices`：按第一维把数组切成逐样本数据。
- `shuffle`：只打乱训练集，减少固定顺序偏差。
- `batch(64)`：每次向模型提供 64 个样本。
- `prefetch(AUTOTUNE)`：训练当前 batch 时准备下一个 batch。

**坏了怎么查：** 用 Profiler 比较 host input time 与 device compute time；检查 map 函数、远程存储、压缩、cache 位置和并行度。

### cache、map、interleave 与 prefetch

- `map`：对每个样本解析或转换。
- `interleave`：并行交错读取多个文件。
- `cache`：缓存不再变化的数据结果。
- `prefetch`：重叠数据准备与模型计算。

不能无条件 `cache()` 整个超大数据集，否则可能耗尽内存。若缓存到磁盘，要规划空间和失效策略。

## tf.function 与计算图

### 它解决什么问题

`tf.function` 把 Python 函数追踪成 TensorFlow Graph。Graph 能减少 Python 调用开销，便于优化、跨设备执行和导出。

```python
import tensorflow as tf

@tf.function
def score(x):
    return tf.math.sigmoid(x * 2.0)

print(score(tf.constant([0.2, 0.8])))
```

### Tracing

第一次看到某种输入签名时，TensorFlow 执行 tracing，创建 ConcreteFunction。输入 dtype、shape 或 Python 值变化可能触发新 tracing。

频繁 retracing 会造成：

- 延迟尖峰。
- 内存增长。
- 图缓存膨胀。
- 日志出现 retracing warning。

### 避免 retracing

```python
@tf.function(
    input_signature=[
        tf.TensorSpec(shape=[None, 4], dtype=tf.float32)
    ]
)
def stable_score(x):
    return model(x, training=False)
```

`None` 表示 batch 长度可变，第二维固定为 4 个特征。输入服务必须保证 dtype 和特征数一致。

### Python 副作用陷阱

普通 Python `print`、列表追加和随机逻辑可能只在 tracing 时执行，而不是每次图调用都执行。图内调试用 `tf.print`，状态使用 TensorFlow Variable 或明确的输入输出。

### 怎么排查

1. 固定输入 dtype 和 rank。
2. 避免把不断变化的 Python 标量传给 `tf.function`。
3. 使用 `input_signature`。
4. 查看日志和 Profiler 中 tracing 时间。
5. 必要时先去掉 `tf.function` 用 eager 定位逻辑错误，再恢复图执行。

## 完整机器学习数据路径

```text
raw monitoring data
      |
      v
schema and unit validation
      |
      v
time window and label construction
      |
      v
time-based train/validation/test split
      |
      v
train-only statistics and preprocessing
      |
      v
tf.data pipeline
      |
      v
model training and validation
      |
      v
threshold selection and test evaluation
      |
      v
model + metadata + signature
      |
      v
shadow / canary deployment
      |
      v
serving metrics + drift + delayed labels
      |
      v
rollback or retraining
```

上线的是“模型 + 元数据 + 数据契约 + 阈值 + 运行环境”，不是一个孤立权重文件。

## 数据质量、过拟合与类别不平衡

### 缺失值和异常值

先区分：

- 真正业务缺失。
- 采集失败。
- 延迟到达。
- 无穷大或除零。
- 单位变更。
- 设备重启导致 counter 清零。

不同原因不能用同一个 `0` 填充。采集失败本身可能就是故障信号，应额外保留 missing indicator。

### 过拟合

表现：

- 训练 loss 持续下降。
- 验证 loss 开始上升。
- 训练指标远好于验证指标。

应对：

- 更多有代表性的数据。
- 减少模型复杂度。
- 正则化或 Dropout。
- EarlyStopping。
- 更严格的按时间、主机或故障分组验证。

### 类别不平衡

故障样本通常远少于正常样本。可考虑：

- class weight。
- 合理过采样或欠采样。
- focal loss。
- 选择适合业务成本的阈值。
- 按主机、业务和时间段分层评估。

不能只追求 recall。把所有样本都判为故障，recall 为 100%，但告警系统无法使用。

### 阈值不是模型的一部分吗

二分类模型输出概率，最终是否告警还需要阈值。阈值应根据 validation 集上的误报成本、漏报成本和告警承载能力选择，再在 test 集确认。

生产中应把阈值与模型版本一起管理。模型相同但阈值变化，也是一项需要审计和回滚的发布。

## 状态与一致性

训练不是一个完全无状态的批处理。状态包括：

- 模型权重。
- Optimizer 的动量等槽变量。
- 当前 epoch 和 global step。
- 随机种子与数据 shuffle 状态。
- 数据预处理统计量。
- Checkpoint 和最佳模型。

### Checkpoint 与完整模型

- Checkpoint 适合恢复训练状态，可包含模型和 optimizer。
- `.keras` 文件保存 Keras 模型结构、权重和训练配置，适合开发和重新加载。
- SavedModel 用于导出可调用签名，常用于 Serving 或其他运行时。

三者用途不同。只保存权重却丢失特征顺序、归一化统计量和阈值，模型仍无法可靠上线。

### 故障恢复语义

多机训练 worker 故障后，是否从同一个 checkpoint 恢复、是否重复消费样本、optimizer step 是否一致，都影响最终模型。机器学习训练通常不承诺逐位完全相同，必须定义可接受的可复现边界和质量验证。

## 分布式训练

### 同步数据并行

最常见模式：

```text
global batch
  ├── replica 0 local batch -> gradients
  ├── replica 1 local batch -> gradients
  ├── replica 2 local batch -> gradients
  └── replica 3 local batch -> gradients
                 |
                 v
          all-reduce gradients
                 |
                 v
       every replica updates weights
```

`replica` 是模型副本；`all-reduce` 把各副本梯度聚合后分发回所有副本。

### MirroredStrategy

单机多 GPU 常用：

```python
strategy = tf.distribute.MirroredStrategy()

with strategy.scope():
    model = build_model()
    model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )
```

模型和 optimizer 必须在 `strategy.scope()` 内创建，才能正确复制变量。

### MultiWorkerMirroredStrategy

多机同步训练使用 worker 集群。需要：

- 每个 worker 可相互通信。
- 一致代码、依赖、数据和时钟。
- 正确 `TF_CONFIG` 集群信息。
- 共享或可访问的 checkpoint 路径。
- 处理 chief 负责保存和协调的语义。

任何一个慢 worker 都会拖慢同步 step，这叫 straggler 问题。

### Global Batch Size

如果 4 个 replica 每个处理 64 个样本，global batch size 是 `256`。扩展 GPU 时盲目保持每卡 batch 不变会放大全局 batch，可能需要调整学习率和训练步数。

### 分布式训练不线性加速的原因

- 梯度通信占比过高。
- 输入数据不足。
- 模型太小。
- worker 性能不一致。
- 网络带宽或拓扑受限。
- 频繁 checkpoint。
- Python 或预处理成为瓶颈。

先用 Profiler 测 step time 分解，再决定增加 GPU、优化数据还是修改模型。

## 性能与容量

### 训练内存由什么组成

粗略包含：

```text
parameters
+ gradients
+ optimizer state
+ activations
+ input batches
+ runtime workspace
+ graph and framework overhead
```

Adam 通常还维护额外状态，激活内存又受 batch size 和网络深度影响，所以不能只用“参数数量 × 4 bytes”估算 GPU 内存。

### OOM 排查

`OOM` 是 Out Of Memory，即内存不足。

1. 保存 batch size、输入 shape、dtype、模型 summary 和设备内存。
2. 先减小 batch，确认是否与激活内存相关。
3. 检查数据是否意外多了一维或使用 `float64`。
4. 查循环是否不断创建新模型或新 graph。
5. 评估 gradient accumulation、mixed precision 或模型切分。

### Mixed Precision

Mixed precision 使用较低精度做部分计算，通常可降低显存并利用现代 GPU 加速。它也可能引入数值稳定问题。

```python
from tensorflow.keras import mixed_precision

mixed_precision.set_global_policy("mixed_float16")
```

输出层或关键计算可能需要保持 `float32`。上线前比较 loss、指标、NaN 和数值误差，不能只看吞吐。

### XLA

XLA 可以融合和编译部分计算图，减少 kernel 启动和内存访问，但并非所有模型都加速，也可能增加首次编译延迟。用基准测试决定是否启用。

### Profiler

Profiler 重点看：

- Input pipeline 是否让设备等待。
- Host 与 device 时间占比。
- 每个 operation 耗时。
- GPU kernel 利用率。
- 内存峰值。
- 多设备通信。
- tf.function tracing。

优化前保存基线：

```text
samples per second
step time p50 / p95
GPU utilization
GPU memory
input wait ratio
validation metric
```

吞吐增加但验证质量下降，不是成功优化。

## 安全与供应链

- 固定并审计 TensorFlow、CUDA、驱动和依赖版本。
- 使用可信模型和数据来源。
- 对 SavedModel、`.keras`、自定义 operation 和加载代码做来源校验。
- 训练数据中的用户、业务和日志字段按敏感等级处理。
- 服务账号只读模型仓库，只写必要日志。
- 推理 API 做认证、限流、输入大小和 shape 限制。
- 不在模型 metadata、TensorBoard 日志或异常堆栈中泄露密钥和原始敏感数据。
- 保存软件物料清单、镜像 digest、训练代码 commit 和数据快照标识。

模型文件是可执行计算的一部分，不应把未知来源模型当普通数据随意加载。

## 安装

### Windows CPU 或 Linux CPU

安装受支持的 Python 后：

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install tensorflow==2.21.0 tensorboard
python -c "import tensorflow as tf; print(tf.__version__); print(tf.config.list_physical_devices())"
```

- `venv`：创建项目独立 Python 环境。
- `Activate.ps1`：让当前 PowerShell 使用该环境。
- `pip install --upgrade pip`：先升级包安装工具。
- 显式安装 `tensorboard`：TensorFlow `2.21` 不再自动带上它。
- 最后一条命令验证版本和设备。

不要把 TensorFlow 安装进系统全局 Python，再让多个项目共享同一组依赖。

### Linux 或 WSL2 NVIDIA GPU

```bash
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install "tensorflow[and-cuda]==2.21.0" tensorboard
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

如果 GPU 列表为空，按官方 pip 安装页核对 NVIDIA 驱动、WSL2、动态库路径和兼容矩阵。不要随机安装多个 CUDA 版本反复覆盖。

### requirements.txt

```text
tensorflow==2.21.0
tensorboard
numpy
```

生产项目还应生成完整 lock 或带 hash 的依赖清单，并在固定镜像中复现。

## 基础实验：训练 AIOps 故障风险分类器

### 实验目标

输入：

- `cpu_pct`：CPU 百分比。
- `memory_pct`：内存百分比。
- `latency_ms`：接口延迟毫秒。
- `error_rate`：错误率，`0.05` 表示 5%。

输出：

- `0`：正常。
- `1`：高故障风险。

实验会生成合成数据，只验证工程链路，不证明模型能用于真实生产。

### 前置条件

- Python `3.10` 到 `3.13`。
- 已安装 `requirements.txt`。
- 至少 2 GB 可用内存。
- 当前目录可创建 `artifacts`、`logs` 和 `serving_model`。

### 创建 train.py

```python
import json
import os
import random
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow import keras

SEED = 42
FEATURE_NAMES = ["cpu_pct", "memory_pct", "latency_ms", "error_rate"]
BATCH_SIZE = 64


def set_reproducible_seed(seed: int) -> None:
    os.environ["PYTHONHASHSEED"] = str(seed)
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)


def make_synthetic_data(sample_count: int = 6000) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(SEED)

    cpu = rng.uniform(10, 100, sample_count)
    memory = rng.uniform(20, 100, sample_count)
    latency = rng.lognormal(mean=np.log(180), sigma=0.55, size=sample_count)
    error_rate = rng.beta(1.5, 20, sample_count)

    noise = rng.normal(0, 0.8, sample_count)
    risk = (
        0.035 * (cpu - 70)
        + 0.030 * (memory - 75)
        + 0.006 * (latency - 350)
        + 12.0 * (error_rate - 0.04)
        + noise
    )

    features = np.column_stack([cpu, memory, latency, error_rate]).astype("float32")
    labels = (risk > 0).astype("float32")
    return features, labels


def make_dataset(
    features: np.ndarray,
    labels: np.ndarray,
    training: bool,
) -> tf.data.Dataset:
    dataset = tf.data.Dataset.from_tensor_slices((features, labels))
    if training:
        dataset = dataset.shuffle(
            buffer_size=len(features),
            seed=SEED,
            reshuffle_each_iteration=True,
        )
    return dataset.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)


def build_model(normalizer: keras.layers.Normalization) -> keras.Model:
    inputs = keras.Input(shape=(len(FEATURE_NAMES),), name="metrics")
    x = normalizer(inputs)
    x = keras.layers.Dense(32, activation="relu")(x)
    x = keras.layers.Dropout(0.10)(x)
    x = keras.layers.Dense(16, activation="relu")(x)
    outputs = keras.layers.Dense(1, activation="sigmoid", name="risk")(x)

    model = keras.Model(inputs=inputs, outputs=outputs, name="aiops_risk_classifier")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss=keras.losses.BinaryCrossentropy(),
        metrics=[
            keras.metrics.AUC(name="auc"),
            keras.metrics.Precision(name="precision"),
            keras.metrics.Recall(name="recall"),
        ],
    )
    return model


def confusion_counts(
    labels: np.ndarray,
    probabilities: np.ndarray,
    threshold: float,
) -> dict[str, int]:
    predictions = probabilities >= threshold
    truth = labels.astype(bool)
    return {
        "tp": int(np.sum(predictions & truth)),
        "fp": int(np.sum(predictions & ~truth)),
        "tn": int(np.sum(~predictions & ~truth)),
        "fn": int(np.sum(~predictions & truth)),
    }


def main() -> None:
    set_reproducible_seed(SEED)
    features, labels = make_synthetic_data()

    train_end = int(len(features) * 0.70)
    validation_end = int(len(features) * 0.85)

    x_train, y_train = features[:train_end], labels[:train_end]
    x_validation = features[train_end:validation_end]
    y_validation = labels[train_end:validation_end]
    x_test, y_test = features[validation_end:], labels[validation_end:]

    normalizer = keras.layers.Normalization(name="feature_normalization")
    normalizer.adapt(x_train)

    train_ds = make_dataset(x_train, y_train, training=True)
    validation_ds = make_dataset(x_validation, y_validation, training=False)
    test_ds = make_dataset(x_test, y_test, training=False)

    Path("artifacts").mkdir(exist_ok=True)
    Path("logs").mkdir(exist_ok=True)

    model = build_model(normalizer)
    model.summary()

    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=5,
            restore_best_weights=True,
        ),
        keras.callbacks.ModelCheckpoint(
            filepath="artifacts/best.keras",
            monitor="val_loss",
            save_best_only=True,
        ),
        keras.callbacks.TensorBoard(log_dir="logs"),
    ]

    model.fit(
        train_ds,
        validation_data=validation_ds,
        epochs=40,
        callbacks=callbacks,
        verbose=2,
    )

    test_metrics = model.evaluate(test_ds, return_dict=True, verbose=0)
    probabilities = model.predict(test_ds, verbose=0).reshape(-1)
    threshold = 0.50

    metadata = {
        "model_name": model.name,
        "model_version": "1",
        "tensorflow_version": tf.__version__,
        "feature_names": FEATURE_NAMES,
        "feature_units": ["percent", "percent", "milliseconds", "ratio"],
        "feature_medians": np.median(x_train, axis=0).astype(float).tolist(),
        "threshold": threshold,
        "test_metrics": {name: float(value) for name, value in test_metrics.items()},
        "confusion_matrix": confusion_counts(y_test, probabilities, threshold),
    }

    model.save("artifacts/alert_model.keras")
    model.export("serving_model/1")

    Path("artifacts/metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

### 代码主线

这段代码做了 12 件事：

1. 固定 Python、NumPy 和 TensorFlow 随机种子。
2. 生成四个具有不同分布的合成指标。
3. 用一个带噪声的风险函数生成标签。
4. 按原始顺序切分 70% train、15% validation、15% test。
5. 只在 train 上计算归一化统计量。
6. 训练集 shuffle，验证集和测试集不 shuffle。
7. 建立两层 Dense 二分类模型。
8. 使用 AUC、precision 和 recall，而不是只看 accuracy。
9. EarlyStopping 防止无限过拟合。
10. 保存最佳 `.keras` 模型和 TensorBoard 日志。
11. 用独立 test 做最终评估。
12. 导出完整模型、Serving 模型和数据契约元数据。

### 运行

```powershell
python train.py
tensorboard --logdir logs
```

TensorBoard 默认可从 `http://localhost:6006` 访问。不要把 TensorBoard 无认证暴露到公网。

### 预期结果

不应承诺固定 AUC 或准确率，因为硬件、底层库和随机运算可能产生差异。正确的验证标准是：

- loss 为有限数字，没有 `NaN`。
- train 和 validation 都有多轮记录。
- `artifacts/best.keras` 存在。
- `artifacts/alert_model.keras` 存在。
- `artifacts/metadata.json` 包含特征顺序、单位、中位数、阈值和 test 指标。
- `serving_model/1` 成功导出并包含可调用签名。
- confusion matrix 的四个数量之和等于 test 样本数。

### 如果没有成功，先查这些

1. `No matching distribution`：Python 版本不受支持或平台不匹配。
2. `ModuleNotFoundError: tensorboard`：显式安装 `tensorboard`。
3. shape 错误：确认每个样本恰好 4 个特征。
4. loss 为 `NaN`：打印输入有限性、最小最大值和学习率。
5. 内存不足：减小样本数和 batch size。
6. `model.export` 失败：核对 TensorFlow/Keras 版本和目标目录权限。

## 预测程序

创建 `predict.py`：

```python
import json
from pathlib import Path

import numpy as np
from tensorflow import keras


def validate_features(values: np.ndarray, expected_count: int) -> None:
    if values.shape != (expected_count,):
        raise ValueError(
            f"expected {expected_count} features, received shape {values.shape}"
        )
    if not np.isfinite(values).all():
        raise ValueError("features contain NaN or infinity")


metadata = json.loads(
    Path("artifacts/metadata.json").read_text(encoding="utf-8")
)
model = keras.models.load_model("artifacts/alert_model.keras")

# 顺序必须与 metadata.feature_names 完全一致。
features = np.array([82.0, 78.0, 520.0, 0.08], dtype="float32")
validate_features(features, len(metadata["feature_names"]))

probability = float(model.predict(features[None, :], verbose=0)[0, 0])
is_high_risk = probability >= float(metadata["threshold"])

print("feature_names:", metadata["feature_names"])
print("probability:", probability)
print("high_risk:", is_high_risk)
```

`features[None, :]` 增加 batch 维，把 shape 从 `(4,)` 变成 `(1, 4)`。模型输入永远按 batch 处理，即使只有一条数据。

这段程序仍只是实验。生产 API 还要校验字段名、单位、范围、时间戳、模型版本、超时和请求 ID。

## 故障注入实验：让输入包含 NaN

### 为什么注入 NaN

监控系统可能因为除零、采集失败或解析错误产生 `NaN`。如果直接送入神经网络，输出可能也变成 `NaN`，阈值比较会产生不可预测的业务结果。

### 创建 fault_injection.py

```python
import json
from pathlib import Path

import numpy as np
from tensorflow import keras


def repair_or_reject(
    values: np.ndarray,
    medians: np.ndarray,
) -> tuple[np.ndarray, list[int]]:
    invalid_positions = np.flatnonzero(~np.isfinite(values)).tolist()
    repaired = values.copy()
    repaired[invalid_positions] = medians[invalid_positions]
    return repaired, invalid_positions


metadata = json.loads(
    Path("artifacts/metadata.json").read_text(encoding="utf-8")
)
model = keras.models.load_model("artifacts/alert_model.keras")

# memory_pct 故意注入 NaN，模拟采集或解析故障。
dirty = np.array([82.0, np.nan, 520.0, 0.08], dtype="float32")
medians = np.asarray(metadata["feature_medians"], dtype="float32")
repaired, invalid_positions = repair_or_reject(dirty, medians)

if not invalid_positions:
    raise RuntimeError("fault injection failed: no invalid feature was detected")

probability = float(model.predict(repaired[None, :], verbose=0)[0, 0])
if not np.isfinite(probability):
    raise RuntimeError("model returned a non-finite probability")

print("invalid_positions:", invalid_positions)
print("repaired_features:", repaired.tolist())
print("probability:", probability)
```

### 运行

```powershell
python fault_injection.py
```

### 预期结果

- `invalid_positions` 包含索引 `1`，对应 `memory_pct`。
- 修复后的第二个值等于训练集 `memory_pct` 中位数。
- 模型返回有限概率。
- 程序没有把 `NaN` 静默当作 `0`。

### 生产中修复还是拒绝

取决于业务：

- 在线告警风险评分：可用训练统计量修复，同时输出 `input_repaired=true` 并降低置信度。
- 高风险自动修复：更适合拒绝请求，回退到规则或人工处理。
- 某字段长期缺失：应停止模型使用并修复上游，不应永久靠填充掩盖。

中位数必须来自 train 并与模型一起版本化。用当前线上全量数据实时计算中位数会导致训练与服务不一致。

### 故障实验清理

```powershell
Remove-Item -Recurse -Force artifacts, logs, serving_model
```

只在实验目录执行。若这些目录包含要保留的模型证据，请先归档。

## 模型保存与交付

### .keras

适合保存和重新加载 Keras 模型：

```python
model.save("artifacts/alert_model.keras")
restored = keras.models.load_model("artifacts/alert_model.keras")
```

发布前要做“保存前后相同输入的预测差异”测试。

### Checkpoint

需要恢复训练时：

```python
checkpoint = tf.train.Checkpoint(
    model=model,
    optimizer=model.optimizer,
)
checkpoint_path = checkpoint.save("checkpoints/ckpt")
checkpoint.restore(checkpoint_path)
```

Checkpoint 保存对象图状态，但应用代码仍要用相同结构创建对象。生产训练需保留 global step、数据版本和恢复日志。

### SavedModel

Keras 3 使用 `model.export()` 导出用于推理的 SavedModel：

```python
model.export("serving_model/1")
```

SavedModel 包含图、变量和签名，但不会自动包含业务数据契约、阈值、负责人和回滚信息，所以仍需 metadata。

## TensorFlow Serving

### 实验启动

完成基础实验后，可在安装 Docker 的环境运行：

```powershell
docker run --rm -p 8501:8501 `
  --mount "type=bind,source=$((Resolve-Path serving_model).Path),target=/models/aiops" `
  -e MODEL_NAME=aiops `
  tensorflow/serving:latest
```

`latest` 只适合本地学习。TensorFlow Serving 的发布节奏与 TensorFlow Python 包不一定一致，生产环境要固定经过兼容测试的镜像版本或 digest。

### REST 预测

```powershell
$body = @{
  signature_name = "serve"
  instances = @(
    @(82.0, 78.0, 520.0, 0.08)
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8501/v1/models/aiops:predict" `
  -ContentType "application/json" `
  -Body $body
```

- `signature_name`：SavedModel 暴露的调用签名。
- `instances`：一个 batch 的样本。
- 每个样本必须严格保持 4 个特征的顺序和单位。

如果签名名不同，使用 `saved_model_cli show --all` 或模型工具检查导出的真实签名，不能盲猜。

### 生产模型配置

TensorFlow Serving 可通过 model config 管理多个模型和版本。生产策略应包含：

- 明确 base path。
- 固定可加载版本。
- 预热。
- 健康检查。
- 请求超时和大小限制。
- 并发和批处理。
- 旧版本保留。
- 加载失败不切流。

Serving 只负责模型执行，不负责业务阈值、特征查询、漂移检测和审批策略。

## 训练与服务的可观测性

### 训练指标

- train/validation loss。
- AUC、precision、recall。
- 每 epoch 和每 step 时间。
- samples per second。
- 数据读取等待时间。
- CPU、GPU 利用率和显存。
- 梯度范数和 NaN。
- checkpoint 保存耗时与成功率。

### 服务指标

- QPS。
- p50、p95、p99 延迟。
- HTTP/gRPC 错误率。
- 超时和队列长度。
- 当前模型版本。
- 每个版本请求占比。
- batch size。
- CPU/GPU 使用率和 OOM。

### 模型质量指标

- 输入字段缺失率。
- 每个特征分布和训练基线差异。
- 预测概率分布。
- 高风险比例。
- 真实标签延迟到达后的 precision/recall。
- 分业务、环境、版本的切片指标。
- 告警量、误报和漏报业务成本。

### 数据漂移与概念漂移

- 数据漂移：输入分布变化，例如新机器 CPU 基线不同。
- 概念漂移：输入与故障之间的关系变化，例如架构升级后延迟不再代表故障。

只监控输入分布无法证明模型仍准确；有延迟标签时必须回算真实质量。

## 常见故障与排查

### 无法安装 TensorFlow

检查：

1. Python 是否在支持范围。
2. Python 和操作系统架构是否为受支持的 64 位环境。
3. pip 是否使用当前 venv。
4. 包索引是否有对应 wheel。
5. 是否混用了 Conda、系统 Python 和 venv。

用 `python -m pip` 比直接 `pip` 更能保证安装到当前解释器。

### GPU 不可见

证据链：

- `tf.config.list_physical_devices("GPU")`。
- 操作系统能否看到 GPU。
- Windows 是否使用 WSL2。
- 驱动和运行库是否符合当前官方安装要求。
- 容器是否传入 GPU。
- TensorFlow 日志是否报告动态库缺失。

不要看到 CUDA 日志就直接重装系统。

### loss 变成 NaN

1. 检查输入和标签是否有限。
2. 检查归一化分母和 log/除法。
3. 降低学习率。
4. 查看梯度范数。
5. 评估 gradient clipping。
6. mixed precision 下检查 loss scaling 和输出 dtype。

先定位第一个出现 NaN 的 batch，而不是只把 NaN 替换成 0。

### 训练很慢且 GPU 利用率低

- 用 Profiler 看 input wait。
- 增加 `prefetch` 和并行 `map`。
- 避免 Python 逐样本处理。
- 增大合理 batch。
- 检查远程存储和小文件。
- 确认模型计算规模是否值得使用 GPU。

### 验证指标远差于训练

可能是过拟合、拆分分布不同、标签质量差或预处理不一致。对比 train/validation 的时间、业务、主机、版本和特征分布，不要先堆更多网络层。

### 离线很好，线上很差

重点检查：

- 线上字段顺序和单位。
- 训练/服务预处理是否同源。
- 时间窗口和标签定义。
- 数据泄漏。
- 线上流量与离线样本差异。
- 阈值是否一致。
- 新模型实际是否加载。

### tf.function 频繁 retracing

固定 dtype、rank 和稳定 shape；使用 `input_signature`；不要把变化的 Python 对象作为参数；监控图创建和请求延迟。

### 内存持续增长

检查是否在循环中：

- 重复创建模型。
- 为不同 shape 不断 tracing。
- 保存 Python 引用和回调结果。
- cache 无限数据。
- 累积预测结果不释放。

先用最小复现区分 Python 内存、TensorFlow runtime 内存和 GPU 显存。

### 多 GPU 没有加速

比较单卡与多卡：

- step time。
- 输入等待。
- all-reduce 时间。
- global batch。
- 每卡计算量。

模型太小或网络太慢时，多 GPU 可能更慢。

### 模型加载失败

保存以下证据：

- TensorFlow/Keras 版本。
- 保存格式。
- 是否包含 custom layer/loss。
- SavedModel signature。
- 错误堆栈。
- 模型来源和 hash。

自定义对象必须提供兼容代码；版本升级前要用历史模型做加载回归测试。

### Serving 返回 shape 错误

把请求实际 JSON、模型 signature 和预期 shape 放在一起比较。常见错误是：

- 少了 batch 维。
- 特征数不是 4。
- 把对象字段直接传给只接收数组的签名。
- 数字被序列化成字符串。

### 模型版本已经发布但结果没变化

- 查询 Serving model status。
- 确认流量路由到新实例。
- 返回响应中带模型版本。
- 检查客户端缓存和中间代理。
- 用固定 golden input 比较新旧输出。

## 升级、灰度与回滚

### 升级前

1. 阅读 TensorFlow、Keras 和依赖 release notes。
2. 在新环境加载历史 `.keras`、Checkpoint 和 SavedModel。
3. 对 golden dataset 比较旧环境与新环境输出。
4. 重新运行训练和推理基准。
5. 验证 CPU/GPU、CUDA、driver 和 Serving 组合。
6. 生成固定镜像、依赖锁和 SBOM。
7. 保留旧镜像、旧模型和特征代码。

`SBOM` 是 Software Bill of Materials，即软件物料清单。

### 发布阶段

推荐：

```text
offline validation
  -> shadow traffic
  -> canary 1%
  -> canary 10%
  -> canary 50%
  -> full rollout
```

- Shadow：复制真实请求给新模型，但结果不影响用户。
- Canary：让少量真实流量使用新模型，并对比技术和业务指标。

每一阶段必须有自动停止条件，例如错误率、p99、输入拒绝率、高风险比例或真实误报超限。

### 回滚

回滚要同时恢复：

- 模型版本。
- 特征处理版本。
- 字段 schema。
- 阈值和策略。
- Serving 镜像。

只把权重换回去，而新特征顺序仍保留，可能让旧模型产生更危险的错误。

## TensorFlow 与其他框架怎么选

| 场景 | 更合适的起点 | 原因 |
|---|---|---|
| 表格小数据、可解释基线 | scikit-learn | 开发快，传统模型丰富 |
| Keras 训练和成熟交付链 | TensorFlow | 高层 API、图执行、Serving/TFX |
| 研究、动态图和大模型生态 | PyTorch | 研究生态和调试体验广泛 |
| 浏览器或移动端推理 | 评估对应轻量运行时 | 受设备、算子和模型大小约束 |

先做可解释基线，再证明深度模型的收益。一个 Dense 网络不一定比梯度提升树更适合四列监控特征。

## TensorFlow 在 AIOps 中的生产落地

### 告警风险评分

输入最近 5 到 30 分钟多指标窗口，输出未来窗口故障概率。必须防止同一故障相邻窗口跨数据集，并监控告警量和漏报。

### 时间序列预测

预测容量或流量后与实际值比较。评估不同预测跨度，保留季节性、节假日和发布特征，并提供区间而不是单个确定数字。

### 日志分类

将日志映射到故障类别或负责团队。需要脱敏、处理新模板、避免把主机名等捷径特征当成根因。

### 根因候选排序

模型根据拓扑、时间顺序、指标异常和变更记录输出候选排序。最终结果要能展示证据，不应只返回一个无法解释的服务名。

### 自动修复

只有当模型置信度、规则、影响范围和运行条件都满足时才进入 runbook。修复后必须执行 post-check，失败立即熔断并回滚。

## 生产设计题：每天 5 亿指标如何做故障风险评分

### 需求

- 原始监控每天 5 亿点。
- 每分钟为 2 万个服务生成风险概率。
- 标签通常在故障结束后才确认。
- 推理 p95 小于 200 毫秒。
- 新模型可以一键回滚。

### 设计答案

1. 原始数据进入时序存储或数据湖，不让在线模型直接扫描全量历史。
2. 流处理按服务和时间窗口生成稳定特征，输出 feature timestamp 和 schema version。
3. 离线训练使用同源特征定义，按时间和故障事件拆分。
4. 先训练可解释基线，再评估 TensorFlow 模型增益。
5. 模型、归一化、字段顺序、阈值和代码一起版本化。
6. 在线特征存储提供最近窗口，服务做严格 schema、单位和有限值校验。
7. TensorFlow Serving 多副本部署，按延迟和吞吐压测设置资源。
8. 新模型先 shadow，再 canary；响应和日志带 model version。
9. 监控技术指标、输入漂移、预测分布和延迟标签质量。
10. 模型注册表保留上一稳定版本，路由和特征处理可一起回滚。

### 追问：如何保证离线和在线一致

- 同一份版本化特征定义。
- 训练统计量作为模型 artifact。
- golden input/output 测试。
- schema 和单位校验。
- 对一批线上样本同时跑离线与在线结果比对。
- 发布时把特征版本和模型版本绑定。

## 事故题：新模型上线后告警量涨了 8 倍

### 先止损

- 暂停继续放量。
- 切回上一稳定模型或规则链路。
- 保留新模型请求、输出、版本和输入统计，不立即删除实例。
- 高风险自动修复进入人工审批。

### 建立假设

1. 阈值配置从 `0.8` 误变成 `0.08`。
2. `error_rate` 从比例改成百分数，放大 100 倍。
3. 特征顺序变化。
4. 新流量分布漂移。
5. 模型或归一化 artifact 不匹配。
6. Serving 实际加载了错误版本。

### 验证

- 对同一批 golden input 比较旧模型和新模型。
- 检查响应中的 model version。
- 比较每个特征线上分位数与训练基线。
- 检查 schema、单位、阈值和 metadata commit。
- 对误报样本回放离线流水线。

### 修复与回滚

如果是单位或顺序错误，修复特征契约并重新走 shadow/canary；如果是模型质量问题，保持旧模型，重新训练和评估。不要仅把阈值调高到告警量恢复正常，因为那可能掩盖漏报。

### 复盘

增加：

- schema compatibility gate。
- 单位和范围校验。
- golden dataset 回归。
- 预测分布发布门禁。
- 模型与阈值联合版本。
- 自动回滚条件。

## 面试速答

### 30 秒回答：TensorFlow 是什么

TensorFlow 是面向张量计算和机器学习的框架。Tensor 表示带类型和形状的数据，GradientTape 自动计算梯度，Keras 用 Layer 和 Model 组织训练，`tf.data` 构建输入流水线，`tf.function` 把稳定计算追踪成图。训练完成后可以保存 `.keras` 或导出 SavedModel，再通过 Serving 等方式交付。

### 3 分钟回答：一次模型训练如何完成

1. 按时间和故障事件拆分 train、validation、test。
2. 只在 train 上拟合归一化和缺失值统计。
3. `tf.data` 负责读取、shuffle、batch 和 prefetch。
4. Model 前向计算概率。
5. Binary cross-entropy 计算预测与标签的差距。
6. 自动微分计算参数梯度。
7. Adam 更新权重。
8. Validation 监控过拟合并 EarlyStopping。
9. 固定方案后在 test 上评估。
10. 导出模型、签名、字段顺序、单位、阈值和版本，再灰度上线。

### 追问题 1：Eager 和 Graph 有什么区别

Eager 逐行立即执行，调试直观；Graph 通过 `tf.function` 追踪计算，减少 Python 开销并支持优化和导出。Graph 要注意输入签名、retracing 和 Python 副作用。

### 追问题 2：为什么会 retracing

输入 dtype、shape 或 Python 参数变化导致 TensorFlow 创建新的 ConcreteFunction。固定输入签名、使用 Tensor 参数并减少 Python 动态结构可以降低 retracing。

### 追问题 3：训练集指标很好为什么不能上线

可能过拟合、数据泄漏、类别不平衡或训练与线上分布不同。必须看独立 validation/test、业务切片、误报漏报成本和线上 shadow 结果。

### 追问题 4：分布式训练怎么保证参数一致

同步数据并行为每个 replica 计算局部梯度，再 all-reduce 聚合，所有副本按同一结果更新参数。还要处理 global batch、慢 worker、checkpoint 和故障恢复。

### 追问题 5：Checkpoint 和 SavedModel 有何区别

Checkpoint 主要保存训练状态，适合恢复模型与 optimizer；SavedModel 保存推理图、变量和签名，适合交付。数据契约、阈值和业务元数据仍要另行版本化。

### 追问题 6：如何排查 GPU 利用率低

用 Profiler 分解 input、host、device 和通信时间。若设备等待数据，优化 `tf.data`；若模型太小，增大合理 batch 或不用多卡；若通信占比高，调整拓扑和训练策略。

### 追问题 7：如何防止训练服务偏差

使用同源版本化特征转换，把训练统计量打包进模型或 artifact，严格校验字段顺序、单位和 schema，用 golden input 对比离线与在线输出，并绑定模型与特征版本。

### 追问题 8：AIOps 模型如何安全触发自动修复

模型只给风险证据，策略层再结合规则、拓扑、置信度和影响范围。高风险动作需要审批或更高阈值，runbook 必须幂等、限次、可回滚，并在执行后验证效果。

## 学习检查清单

- [ ] 能解释 Tensor 的 shape、rank、dtype 和 device。
- [ ] 能区分 Tensor 与 Variable。
- [ ] 能用 GradientTape 解释自动微分。
- [ ] 能解释 Layer、Model、loss、optimizer 和 metric。
- [ ] 能区分 batch、step 和 epoch。
- [ ] 能按时间拆分 train、validation 和 test。
- [ ] 能识别常见数据泄漏。
- [ ] 能构建 shuffle、batch、prefetch 的 `tf.data` 流水线。
- [ ] 能解释 eager、graph、tracing 和 retracing。
- [ ] 能解释同步数据并行和 global batch。
- [ ] 能用 Profiler 思路排查输入、计算和通信瓶颈。
- [ ] 能区分 Checkpoint、`.keras` 和 SavedModel。
- [ ] 能完成基础训练和 NaN 故障注入实验。
- [ ] 能设计模型监控、灰度、自动停止和回滚。
- [ ] 能回答大规模在线风险评分架构题。

## GitHub 学习证据

建议建立：

```text
tensorflow-aiops-lab/
  ├── README.md
  ├── requirements.txt
  ├── train.py
  ├── predict.py
  ├── fault_injection.py
  ├── tests/
  │   ├── test_input_schema.py
  │   └── test_saved_model.py
  ├── artifacts/
  │   └── metadata.example.json
  ├── screenshots/
  │   └── tensorboard-curves.png
  └── incident-notes/
      └── nan-input-drill.md
```

不要提交体积巨大的训练数据、真实监控明细、用户信息、内部服务名或生产模型密钥。大模型文件应使用模型仓库或对象存储，并在 Git 中保存版本和 hash。

`README.md` 至少记录：

- Python、TensorFlow 和运行设备版本。
- 数据字段、单位、标签定义和拆分方式。
- 模型结构、loss、optimizer 和阈值选择。
- 实验命令与预期结果。
- NaN 注入、检测、修复或拒绝策略。
- 当前限制和生产化差距。

## 下一步

1. 学 [机器学习](/tech-stack/data-ai/machine-learning)，补齐监督学习、评估和特征工程主线。
2. 学 [scikit-learn](/tech-stack/data-ai/scikit-learn)，建立可解释表格模型基线。
3. 学 [Python](/tech-stack/foundation/python)，掌握类型、虚拟环境、测试和工程结构。
4. 学 [FastAPI](/tech-stack/app-engineering/fastapi)，为模型建立带 schema 的服务接口。
5. 学 [Prometheus](/tech-stack/observability/prometheus)，监控推理延迟、错误率和模型版本。

读完本篇不等于自动通过面试。大型企业还会继续考察 Python、算法与数据结构、机器学习基础、系统设计、工程实践、项目证据和沟通能力；本篇提供的是一条可实验、可排障、可交付的 TensorFlow 主线。
