# PyTorch 技术栈深讲

> 学习目标：从零理解 Tensor、Autograd、`nn.Module`、Loss、Optimizer、Dataset/DataLoader、设备与精度、训练和推理状态，能在 Windows CPU 环境完成一个 AIOps 指标异常分类实验与数据质量故障注入，并能分析 GPU 不可见、显存不足、Loss 为 NaN、数据加载慢、`torch.compile` 重编译、Checkpoint 恢复和分布式训练卡住等生产问题。

## 核验日期与版本边界

本文在 **2026 年 8 月 13 日**核验，版本锚点如下：

- PyTorch 最新正式版：`2.13.0`，官方 GitHub Release 发布于 2026 年 7 月 8 日；
- 本文基础实验：Windows、Python `3.14.5`、PyTorch `2.13.0+cpu`；
- 官方 Get Started 当前说明 Latest Stable 需要 Python `3.10` 或更高版本，Windows 页面明确列出 Python `3.10–3.14`；
- GPU 安装不能只看“电脑装了 CUDA Toolkit”，还要同时核对 GPU、驱动、PyTorch Wheel 的计算后端和目标 Python；
- `nightly` 是预览构建，不等于适合生产的稳定版。

版本、Wheel、编译器、分布式 API 和加速器支持变化很快。复制命令前必须回到 [PyTorch Get Started](https://pytorch.org/get-started/locally/) 重新选择操作系统、包管理器和计算平台；具体破坏性变化以 [PyTorch Release](https://github.com/pytorch/pytorch/releases) 为准。

本文不会把“文档示例可以运行”写成“任何 GPU 都能跑得快”，也不会把一次 CPU 实验冒充 CUDA、ROCm、多机训练或生产推理验证。

## 官方资料

- [PyTorch 2.13.0 Release](https://github.com/pytorch/pytorch/releases/tag/v2.13.0)
- [PyTorch 2.13 Release Blog](https://pytorch.org/blog/pytorch-2-13-release-blog/)
- [PyTorch Get Started](https://pytorch.org/get-started/locally/)
- [Learn the Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro.html)
- [Tensor 教程](https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html)
- [Dataset 与 DataLoader](https://docs.pytorch.org/tutorials/beginner/basics/data_tutorial.html)
- [`nn.Module` 搭建模型](https://docs.pytorch.org/tutorials/beginner/basics/buildmodel_tutorial.html)
- [Autograd 自动微分](https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html)
- [优化训练循环](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html)
- [保存与加载模型](https://docs.pytorch.org/tutorials/beginner/basics/saveloadrun_tutorial.html)
- [序列化说明](https://docs.pytorch.org/docs/stable/notes/serialization.html)
- [Automatic Mixed Precision](https://docs.pytorch.org/docs/stable/amp.html)
- [`torch.compile`](https://docs.pytorch.org/docs/stable/generated/torch.compile.html)
- [Scaled Dot Product Attention](https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html)
- [PyTorch Profiler](https://docs.pytorch.org/docs/stable/profiler.html)
- [可复现性说明](https://docs.pytorch.org/docs/stable/notes/randomness.html)
- [PyTorch Distributed 总览](https://docs.pytorch.org/tutorials/beginner/dist_overview.html)
- [DistributedDataParallel](https://docs.pytorch.org/docs/stable/generated/torch.nn.parallel.DistributedDataParallel.html)
- [FSDP2 教程](https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html)
- [Distributed Checkpoint](https://docs.pytorch.org/docs/stable/distributed.checkpoint.html)
- [Windows FAQ](https://docs.pytorch.org/docs/main/notes/windows.html)

说明：本文按 AIOps 学习与生产排障主线重新组织官方资料，不逐段翻译官方教程。稳定原理、当前 API 行为、工程建议和本地实跑结果会分开表达。

## 官方知识地图

```text
PyTorch
  ├── tensor and operators
  │   ├── dtype / shape / stride / storage
  │   ├── device: CPU / CUDA / ROCm / MPS / XPU
  │   ├── view / reshape / broadcasting
  │   └── random and numerical accuracy
  ├── automatic differentiation
  │   ├── requires_grad
  │   ├── forward graph
  │   ├── backward
  │   ├── grad / grad_fn / leaf tensor
  │   └── no_grad / inference_mode / detach
  ├── model and optimization
  │   ├── nn.Module / Parameter / buffer
  │   ├── loss
  │   ├── optimizer / scheduler
  │   ├── train / eval
  │   └── state_dict / checkpoint
  ├── data pipeline
  │   ├── Dataset / IterableDataset
  │   ├── DataLoader / Sampler
  │   ├── batch / shuffle / collate
  │   └── worker / prefetch / pinned memory
  ├── performance
  │   ├── AMP
  │   ├── torch.compile
  │   ├── profiler / benchmark
  │   ├── activation checkpointing
  │   └── memory allocator
  └── scale and delivery
      ├── DDP / FSDP2 / TP / PP
      ├── torchrun / ProcessGroup / collective
      ├── Distributed Checkpoint
      ├── torch.export / ONNX / AOTInductor
      └── serving, observability, upgrade and rollback
```

第一次看到这些英文不用背。先记住主线：**数据变成 Tensor，模型做前向计算，Loss 衡量误差，Autograd 计算梯度，Optimizer 更新参数，Checkpoint 保存状态。** 其他能力都是让这条链路更快、更大、更可靠或更容易交付。

## 建议学习路线

### 第一天：跑通一个训练闭环

```text
Tensor
  -> nn.Module
  -> forward
  -> loss
  -> backward
  -> optimizer.step
  -> eval + inference_mode
  -> state_dict
```

目标不是背 API，而是能解释每一行为什么存在，知道梯度什么时候产生、参数什么时候变化、模型什么时候只是预测。

### 第一周：能排查单机训练

```text
Dataset / DataLoader
  -> dtype / shape / device
  -> CPU 与 GPU 数据搬运
  -> AMP
  -> 显存组成
  -> Profiler
  -> Checkpoint 恢复
```

### 生产与面试层：能解释扩展和失败

```text
torch.compile
  -> DDP / FSDP2
  -> 集合通信
  -> 分布式 Checkpoint
  -> 推理副本与灰度
  -> 指标、日志、Trace、质量监控
  -> 安全、升级和回滚
```

## 场景开场：GPU 很忙，模型却没有真的学会

一个告警分类模型上线前，训练日志看起来很漂亮：

- GPU 利用率接近 100%；
- Loss 一直下降；
- 训练集准确率达到 99%；
- Checkpoint 文件也成功写到了磁盘。

但灰度一开始，误报率突然升高。进一步检查发现：

- 训练和推理的特征顺序不一致；
- 验证阶段忘记调用 `model.eval()`，Dropout 仍在随机丢数据；
- 只保存了模型权重，没有保存特征 Schema 和阈值；
- 某些输入带 `NaN`，模型仍然继续计算；
- “GPU 利用率高”只证明计算设备在忙，不能证明样本、标签和评估方法正确。

PyTorch 能帮你完成张量计算和梯度更新，但生产模型是否可信，取决于数据、状态、评估、发布和观测是否形成闭环。

## 一句话人话版

PyTorch 是一个张量计算和深度学习框架：你用 Tensor 表示数据，用 `nn.Module` 定义模型，它通过 Autograd 自动计算梯度，再由 Optimizer 更新参数。

## 小白最容易问的 12 个问题

### PyTorch 是一种编程语言吗

不是。日常通常用 Python 写 PyTorch 程序，真正的张量算子由底层 C++、CPU 向量指令、CUDA、ROCm 等实现执行。

### Tensor 和 NumPy 数组有什么区别

它们都能表示多维数据。Tensor 还带设备、自动微分和深度学习算子能力，可以放在 GPU 等加速器上；某些 CPU Tensor 与 NumPy 数组可以共享底层内存，修改一方可能影响另一方。

### PyTorch 就是大模型吗

不是。PyTorch 是通用计算与训练框架；Transformer、CNN、RNN 等是模型结构；某个具体大模型是结构、权重、Tokenizer 和运行配置的组合。

### 为什么 `loss.backward()` 不会自动更新参数

`backward()` 只负责沿计算图求梯度并累加到 `.grad`。真正修改参数的是 `optimizer.step()`。把求导与更新分开，才能支持梯度累积、多个 Optimizer 和自定义训练循环。

### 为什么每轮都要 `zero_grad`

PyTorch 默认累加梯度。这个设计支持多个小 Batch 模拟大 Batch，但如果你不是有意累积，忘记清零会把上一轮梯度带到下一轮。

### `model.eval()` 会关闭梯度吗

不会。它主要切换 Dropout、BatchNorm 等模块的训练/评估行为。推理还应使用 `torch.inference_mode()` 或至少 `torch.no_grad()`，避免构建不需要的梯度图。

### 电脑有 NVIDIA 显卡，为什么 `torch.cuda.is_available()` 仍是 False

常见原因是装了 CPU Wheel、驱动不兼容、装到另一个 Python、进程看不到 GPU，或容器没有挂载设备。系统里有 CUDA Toolkit 也不等于当前 PyTorch Wheel 能使用 GPU。

### Batch 越大训练越好吗

不一定。大 Batch 可提高吞吐，却增加显存、改变优化行为，也可能降低泛化；还要同步调整学习率、梯度累积和分布式 Global Batch Size。

### Loss 下降就说明模型可上线吗

不说明。还要看独立验证集、时间泄漏、类别不平衡、阈值、数据漂移、业务成本和线上输入契约。

### `torch.compile` 一定更快吗

不一定。首次编译有成本，动态 Shape、Graph Break、频繁重编译或小模型可能让收益小于开销。必须预热并用真实负载比较 Eager 与 Compile 的正确性、延迟和吞吐。

### 多张 GPU 用 `DataParallel` 就够了吗

生产分布式训练通常优先 `DistributedDataParallel`（DDP）。它采用一进程一设备，并能跨机器工作；`DataParallel` 是单进程多线程方式，扩展性与性能通常更差。

### Checkpoint 文件存在就能恢复吗

不能只看文件存在。要验证能否加载、模型结构是否匹配、Optimizer/Scheduler/AMP/RNG/数据位置是否齐全，并做一次真实恢复演练。

## 为什么 AIOps 工程师要学 PyTorch

PyTorch 在 AIOps 链路中通常位于“智能分析与模型工程”层：

- 用指标窗口训练异常分类或预测模型；
- 用日志、Trace、工单训练分类、聚类或表示模型；
- 给告警做风险评分、去重和根因候选排序；
- 微调或评估 Transformer；
- 构建训练、Checkpoint、评估、灰度和漂移监控流水线；
- 用 Profiler、GPU 指标和训练日志定位 AI 工作负载故障。

但 PyTorch 不是数据治理、特征平台、模型注册中心、在线 Serving、告警系统或自动化审批的完整替代品。生产 AIOps 还需要数据契约、实验追踪、模型仓库、服务平台、监控与人工控制。

## PyTorch 是什么，不是什么

PyTorch 核心提供：

1. Tensor 和大量数值算子；
2. 自动微分引擎；
3. 神经网络模块和优化器；
4. 数据加载、设备和分布式能力；
5. 编译、导出、Profiling 与扩展接口。

它不是：

- 自动保证数据没有泄漏的训练平台；
- 自动寻找最佳模型和超参数的系统；
- 自动具备高可用、鉴权、限流和灰度的推理服务；
- 自动让任意 Python 程序变快的编译器；
- 自动保证跨版本、跨硬件位级一致的数值系统。

## PyTorch、TensorFlow、Transformer、CUDA 的关系

| 名称 | 它是什么 | 负责什么 | 常见误解 |
|---|---|---|---|
| PyTorch | 张量与机器学习框架 | 建模、求导、训练、设备调度、分布式 | 把框架当成某个具体模型 |
| TensorFlow | 另一套机器学习框架 | 张量、Keras、图执行、分布式和交付生态 | 认为二者只能按性能排名选择 |
| Transformer | 模型架构家族 | 用 Attention 处理序列与上下文 | 把架构当成训练框架 |
| CUDA | NVIDIA 的并行计算平台 | 让支持的程序使用 NVIDIA GPU | 认为装 Toolkit 就自动获得 PyTorch CUDA 能力 |
| cuDNN / NCCL | NVIDIA 加速与通信库 | 深度学习算子、GPU 集合通信 | 把库版本与显卡驱动版本混为一谈 |

选型应看团队生态、已有模型、硬件、部署平台、调试方式和长期维护，而不是只比较一张 Benchmark。

## 一次训练迭代的完整数据路径

```text
原始文件 / 数据库 / 对象存储
  -> Dataset 读取一个样本
  -> transform / parse / feature validation
  -> DataLoader worker 组成 batch
  -> CPU Tensor
  -> Host-to-Device copy
  -> model.forward
  -> operator / kernel
  -> logits / prediction
  -> loss
  -> autograd backward
  -> gradient accumulation / synchronization
  -> optimizer.step
  -> parameter new state
  -> metric / checkpoint / log
```

这条路径有三个不同的“状态世界”：

- **数据状态：** 样本顺序、随机增强、Sampler 位置、特征 Schema；
- **训练状态：** 参数、梯度、Optimizer、Scheduler、AMP Scaler、随机数；
- **运行状态：** 进程、Worker、GPU Stream、通信组、编译缓存和内存分配器。

只保存参数，并不能自动恢复后两类状态。

## 核心概念一：Tensor

### 是什么

Tensor 是带有 `dtype`、`shape`、设备和内存布局的多维数据容器。模型输入、输出、参数、梯度和中间激活通常都是 Tensor。

### 为什么需要

Python List 不适合高吞吐矩阵计算，也不知道数据应在 CPU 还是 GPU。Tensor 把数据布局、算子和设备执行统一起来。

### 怎么工作

```python
import torch

x = torch.tensor([[1.0, 2.0], [3.0, 4.0]], dtype=torch.float32)
print(x.shape)   # torch.Size([2, 2])：两行两列
print(x.dtype)   # torch.float32：每个元素的数值类型
print(x.device)  # cpu：当前存放设备
print(x.stride()) # (2, 1)：相邻维度在底层存储中的步长
```

`shape` 回答“每个维度多长”，`dtype` 回答“每个元素如何解释”，`device` 回答“数据在哪里”，`stride` 回答“如何从底层 Storage 走到下一个元素”。

### 怎么用或观察

```python
x = torch.randn(32, 4)       # 32 个样本、每个 4 个特征
w = torch.randn(4, 8)        # 4 维输入映射到 8 维隐藏表示
y = x @ w                    # 矩阵乘法，结果 shape 为 [32, 8]
print(y.shape, y.isfinite().all())
```

### 坏了怎么查

- Shape 错：先打印输入、标签、模型输出和 Loss 期望 Shape；
- Dtype 错：分类标签常要求整数 `long`，回归和大多数权重常用浮点；
- Device 错：参与同一算子的 Tensor 通常必须在兼容设备；
- 出现 NaN/Inf：用 `torch.isfinite` 从输入开始逐层定位；
- View 报错：检查是否连续，必要时使用 `reshape` 或明确调用 `contiguous()`，但要评估复制成本。

## 核心概念二：View、Storage 与连续性

### 是什么

多个 Tensor 可以共享同一块底层 Storage。切片、转置和 `view` 可能只改变元数据，不复制字节。

### 为什么需要

避免复制能节省内存和带宽，但共享存储也意味着一个原地修改可能影响另一个 Tensor。

### 怎么工作

```python
x = torch.arange(6).reshape(2, 3)
y = x[:, 1:]                 # y 是 x 的一个视图
y[0, 0] = 99
print(x)                     # x[0, 1] 也变成 99

z = x.t()                    # 转置后通常不是连续布局
print(z.is_contiguous())     # False
```

### 怎么用或观察

- `tensor.storage_offset()`：视图从 Storage 哪里开始；
- `tensor.stride()`：各维如何步进；
- `tensor.is_contiguous()`：是否满足默认连续布局；
- `tensor.clone()`：复制出独立数据；
- `tensor.detach()`：与 Autograd 图断开，但仍可能共享 Storage；需要独立数据时用 `detach().clone()`。

### 坏了怎么查

发现“改了临时变量，原数据也变了”时，先检查是否共享存储。发现内存突然增大时，检查 `contiguous`、`clone` 和隐式复制是否在热路径反复发生。

## 核心概念三：Autograd 动态计算图

### 是什么

Autograd 是自动微分引擎。只要参与计算的 Tensor 需要梯度，PyTorch 会记录本次前向的算子关系，并在 `backward()` 时按链式法则反向求导。

### 为什么需要

深度网络可能有数百万乃至更多参数，人工推导和实现每个梯度既困难又容易错。

### 怎么工作

```text
x, parameter
  -> forward operators
  -> prediction
  -> loss
  -> backward traverses graph
  -> parameter.grad accumulates
```

PyTorch 的图通常在每次前向时重新建立，所以 Python 控制流可以影响本次图，这也是“动态图”体验的重要来源。

```python
import torch

w = torch.tensor(2.0, requires_grad=True)
x = torch.tensor(3.0)
loss = (w * x - 10.0) ** 2
loss.backward()

print(loss.item()) # 16.0
print(w.grad)      # -24：d(w*x-10)^2 / dw
```

### 怎么用或观察

- `requires_grad`：是否需要跟踪梯度；
- `grad_fn`：这个非叶子 Tensor 由哪个反向节点产生；
- `.grad`：叶子参数累积的梯度；
- `torch.autograd.set_detect_anomaly(True)`：诊断反向异常的受控工具，开销较高；
- Hook：观察梯度或激活，生产要限制开销和生命周期。

### 坏了怎么查

- `.grad is None`：参数没参与 Loss、被 `detach`、处于无梯度上下文，或检查的不是叶子 Tensor；
- “backward through graph a second time”：同一图已释放，检查是否误复用 Loss；不要习惯性加 `retain_graph=True`；
- 原地修改版本错误：某个反向所需 Tensor 被 `add_`、索引赋值等操作改写；
- 梯度爆炸：记录 Grad Norm，检查学习率、输入尺度、初始化和 Loss；
- 梯度全零：检查激活饱和、冻结参数、混合精度下溢和错误的 `no_grad`。

## 核心概念四：`nn.Module`、Parameter 与 Buffer

### 是什么

`nn.Module` 是模型和子层的组织单元。赋值给 Module 属性的子 Module、`nn.Parameter` 和注册 Buffer 会被框架发现，并进入设备迁移或状态管理。

### 为什么需要

模型不只是一个函数，还要管理可训练参数、非训练状态、子模块层级、训练/评估模式和序列化。

### 怎么工作

```python
from torch import nn

class RiskClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(4, 16),
            nn.ReLU(),
            nn.Dropout(p=0.1),
            nn.Linear(16, 1),
        )

    def forward(self, x):
        return self.network(x).squeeze(-1) # 输出每个样本一个 logit
```

`Linear` 的 Weight/Bias 是 Parameter；BatchNorm 的运行均值是典型 Buffer；普通 Python List 中的层不会自动注册，应使用 `ModuleList` 或 `Sequential`。

### 怎么用或观察

```python
model = RiskClassifier()
print(model)
print(sum(p.numel() for p in model.parameters()))
print(model.state_dict().keys())
```

### 坏了怎么查

- 参数数量为 0：层没有注册到 Module；
- 参数没更新：不在 Optimizer 参数组、`requires_grad=False` 或没有梯度；
- 加载出现 Missing/Unexpected Keys：代码结构、命名或版本不匹配；
- 设备迁移后仍报错：普通 Tensor 属性没有注册成 Parameter/Buffer，也没有手工迁移。

## 核心概念五：Loss、Backward 与 Optimizer

### 是什么

Loss 把预测质量变成一个可优化的标量；`backward` 求梯度；Optimizer 根据梯度和自己的状态更新参数。

### 为什么需要

这三者分别回答：错多少、每个参数应往哪边改、按什么策略改多大。

### 怎么工作

```python
criterion = torch.nn.BCEWithLogitsLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)

optimizer.zero_grad(set_to_none=True) # 清除上一轮累积梯度
logits = model(features)              # forward
loss = criterion(logits, labels)      # 计算标量 Loss
loss.backward()                       # 梯度累加到 Parameter.grad
optimizer.step()                      # 更新参数与 Adam 状态
```

`BCEWithLogitsLoss` 把 Sigmoid 与二分类交叉熵放在一起，数值上通常比先手工 Sigmoid 再算 BCE 更稳定。它接收 Logit，不接收已经二值化的预测。

### 怎么用或观察

- 记录 Loss，而不是只打印最后一个 Batch；
- 记录学习率、Grad Norm、参数 Norm；
- 每次 `step` 前确认 Loss 与梯度有限；
- 梯度累积时明确 `accumulation_steps`，并按设计缩放 Loss；
- Gradient Clipping 只能限制梯度，不会修复脏数据或错误标签。

### 坏了怎么查

- Loss 不降：先验证一个极小 Batch 能否过拟合，再查标签、Loss、学习率和模型输出；
- 参数不变：比较 `step` 前后参数，确认 Optimizer 绑定的是当前模型参数；
- 梯度越来越大：检查是否忘记清零或错误累积；
- 类别严重不平衡：看 Precision、Recall、PR-AUC 和混淆矩阵，不要只看 Accuracy。

## 核心概念六：Dataset、DataLoader 与 Sampler

### 是什么

- `Dataset` 定义“第几个样本是什么”；
- `DataLoader` 负责取样、组 Batch、多进程加载和内存准备；
- `Sampler` 决定样本索引顺序；
- `collate_fn` 决定多个样本如何拼成 Batch。

### 为什么需要

训练计算很快时，读取、解码和预处理可能让 GPU 一直等数据。数据管道也决定随机性、分布式去重和样本边界。

### 怎么工作

```text
Sampler indexes
  -> Dataset.__getitem__
  -> worker process
  -> transform
  -> collate_fn
  -> CPU batch
  -> optional pinned memory
  -> accelerator copy
```

### 怎么用或观察

```python
loader = torch.utils.data.DataLoader(
    dataset,
    batch_size=64,
    shuffle=True,
    num_workers=0, # Windows 入门先用 0，跑通后再调优
)
```

重要参数：

| 参数 | 控制什么 | 什么时候调整 | 常见坑 |
|---|---|---|---|
| `batch_size` | 每次迭代样本数 | 显存、吞吐和优化行为一起评估 | 只为占满 GPU 盲目增大 |
| `shuffle` | 每个 Epoch 是否打乱 | 训练集通常打乱，验证集通常不需要 | 与显式 Sampler 同时使用冲突 |
| `num_workers` | 后台加载进程数 | 数据读取成为瓶颈时逐步压测 | Windows 缺少 main guard 导致递归启动 |
| `pin_memory` | 使用页锁定 CPU 内存 | CUDA Host-to-Device Copy | 开了不代表一定更快，也占主机内存 |
| `persistent_workers` | Epoch 间保留 Worker | Worker 启动成本高时 | Dataset 状态和资源没有正确刷新 |
| `prefetch_factor` | 每个 Worker 预取 Batch 数 | GPU 等数据且内存允许时 | 预取过多造成内存暴涨 |
| `drop_last` | 丢弃最后不足 Batch | BatchNorm 或 Shape 强约束 | 无意丢样本，评估统计不完整 |

### Windows 特别注意

Windows 多进程通常使用 `spawn`。创建 DataLoader 和启动训练的代码应放进：

```python
def main():
    ...

if __name__ == '__main__':
    main()
```

否则每个 Worker 导入脚本时可能再次启动 Worker，出现递归进程、卡住或 RuntimeError。

### 坏了怎么查

1. 先把 `num_workers` 改成 0，看异常是否来自多进程；
2. 单独迭代 DataLoader，统计每批加载耗时；
3. 打印 Batch 的 Shape、Dtype、范围和有限性；
4. 检查某个 Worker 是否因坏文件退出；
5. 分布式时确认 `DistributedSampler`、Rank 和 `set_epoch`；
6. 不要一看到 GPU 空闲就只增加 Worker，磁盘、解码、锁和网络也可能是根因。

## 核心概念七：训练模式、评估模式与梯度上下文

这三个概念经常被混为一谈：

| 控制 | 主要影响 | 不会自动做什么 |
|---|---|---|
| `model.train()` | 将 Module 切到训练模式 | 不会开始训练，不会自动更新参数 |
| `model.eval()` | 将 Dropout/BatchNorm 等切到评估行为 | 不会关闭 Autograd |
| `torch.no_grad()` | 临时不记录梯度 | 不会切换 Dropout/BatchNorm |
| `torch.inference_mode()` | 更强的推理无梯度模式，减少额外开销 | 不适合混入随后要参与 Autograd 的 Tensor 工作流 |

正确的评估骨架：

```python
model.eval()
with torch.inference_mode():
    logits = model(features)
    probabilities = torch.sigmoid(logits)
```

回到训练前再调用 `model.train()`。如果验证结果每次波动，先检查随机增强、Sampler、Dropout/BatchNorm、随机种子和输入顺序。

## 核心概念八：设备与计算后端

### CPU

最容易验证环境和正确性，适合小模型、数据预处理、单元测试和本篇实验。CPU 能跑不代表 GPU 构建正确。

### NVIDIA CUDA

使用 NVIDIA GPU。官方 Wheel 通常带有配套 CUDA Runtime 组件，但仍依赖兼容的 NVIDIA 驱动。不要把本机 `nvcc` 版本直接当成 `torch.version.cuda`。

### AMD ROCm

主要面向 Linux AMD GPU。PyTorch Python API 仍大量使用 `torch.cuda` 命名，因此看到 `torch.cuda.is_available()` 不代表底层一定是 NVIDIA CUDA；还要看 `torch.version.hip`。

### Apple MPS

通过 Metal Performance Shaders 使用 Apple Silicon/部分 Mac GPU。算子覆盖、精度和性能边界要按目标版本验证。

`torch.backends.mps.is_built()` 只说明当前包包含 MPS 支持，`is_available()` 才说明当前机器真的能用。`PYTORCH_ENABLE_MPS_FALLBACK=1` 可以让部分未实现算子回退 CPU，但会产生设备搬运和性能断层，不能把“没有报错”当成“全程跑在 GPU”。

### Intel XPU 与其他加速器

PyTorch 正在扩展统一 Accelerator API 和 XPU 等后端。生产不能假设每个 CUDA 算子、Dtype 和编译优化都能原样迁移。

### 设备选择骨架

```python
if torch.cuda.is_available():
    device = torch.device('cuda')
elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
    device = torch.device('mps')
else:
    device = torch.device('cpu')

model = model.to(device)
features = features.to(device)
labels = labels.to(device)
```

生产代码还应允许显式配置设备，避免“某台机器突然看到 GPU 后自动换后端”，导致性能、精度或容量行为未经验证就变化。

## 安装与环境验证

### 2.13.0 二进制平台快照

截至本文核验日，官方选择器和 Wheel 索引的主要边界是：

| 平台 | Python 与架构快照 | 加速后端边界 |
|---|---|---|
| Windows | 常规 x64 Wheel 为 CPython 3.10～3.14 | CPU 或 NVIDIA CUDA；ROCm 不适用 |
| Linux | CPU 可见 x86_64、aarch64、s390x，CPython 3.10～3.15；不同后端架构范围不同 | CPU、CUDA；受支持 AMD GPU 可用 ROCm 7.2 |
| macOS | 2.13 索引以 macOS 14 ARM64 Wheel 为主，CPython 3.10～3.14 | CPU 或 Apple MPS，不存在 macOS CUDA |

Stable 选择器在核验日提供 CUDA 12.6、13.0、13.2。Wheel 存在只表示有对应构建，最终命令仍应在安装当天由 [Start Locally](https://pytorch.org/get-started/locally/) 生成。图像任务还要使用与 Torch 2.13 配对的 torchvision 0.28，不能独立随意混装。

### 为什么先建隔离环境

全局 Python 中直接升级 Torch 可能破坏其他项目。一个项目一个虚拟环境，才能固定依赖、复现问题和安全回滚。

### Windows CPU 固定实验环境

```powershell
New-Item -ItemType Directory -Path .\pytorch-aiops-lab -Force
Set-Location .\pytorch-aiops-lab

py -3.14 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install numpy==2.5.2
.\.venv\Scripts\python.exe -m pip install torch==2.13.0 --index-url https://download.pytorch.org/whl/cpu
```

如果没有 `py -3.14`，可用受支持的 Python `3.10–3.14` 创建环境，并记录实际版本。本文固定 CPU Wheel 是为了让第一次实验不依赖显卡和驱动。

### NVIDIA GPU 环境

不要从本文硬抄一个可能过时的 CUDA Wheel 地址。打开 [PyTorch Get Started](https://pytorch.org/get-started/locally/)，选择：

```text
PyTorch Build: Stable
OS: 实际系统
Package: Pip
Language: Python
Compute Platform: 与目标驱动和 GPU 匹配的 CUDA 选项
```

把生成命令和下列信息保存到实验记录：

```powershell
nvidia-smi
python -m pip show torch
python -m torch.utils.collect_env
```

### 安装后最小验证

```powershell
.\.venv\Scripts\python.exe -c "import torch; print(torch.__version__); print(torch.rand(2, 3)); print(torch.cuda.is_available())"
```

CPU 实验预期：

```text
2.13.0+cpu
tensor([...])
False
```

最后一行是 `False` 对 CPU Wheel 来说是正确结果，不是失败。

### 环境证据脚本

```python
import platform
import torch

print('python_platform=', platform.platform())
print('torch=', torch.__version__)
print('cuda_available=', torch.cuda.is_available())
print('torch_cuda_runtime=', torch.version.cuda)
print('torch_hip_runtime=', torch.version.hip)
print('mps_available=', hasattr(torch.backends, 'mps') and torch.backends.mps.is_available())

if torch.cuda.is_available():
    print('device_name=', torch.cuda.get_device_name(0))
```

把输出脱敏后保存，才能区分“代码问题”和“环境根本不是同一套”。

## 基础实验：训练一个 AIOps 故障风险分类器

### 实验目标与边界

这个实验把一条最小但完整的 PyTorch 工程链跑通：

```text
合成监控指标
  -> Dataset / DataLoader
  -> 前向计算
  -> BCEWithLogitsLoss
  -> backward
  -> AdamW 更新参数
  -> 独立测试集评估
  -> state_dict 保存
  -> 新模型重载并核对输出
```

输入的四个字段都归一到 `0~1`：

| 字段 | 小白解释 | 例子 |
|---|---|---|
| `cpu_ratio` | CPU 使用比例 | `0.82` 表示 82% |
| `memory_ratio` | 内存使用比例 | `0.76` 表示 76% |
| `latency_ratio` | 延迟相对上限的比例 | `0.70` 表示已接近高延迟区间 |
| `error_ratio` | 请求错误比例 | `0.08` 表示 8% |

输出 `0` 代表实验数据中的正常样本，`1` 代表高风险样本。

这里使用人为生成、刻意容易区分的数据，只证明代码链路可以运行。它**不能证明**模型能识别真实生产事故，也不能替代真实标签、时间切分、业务评审和灰度验证。

### 前置条件

- 已按上一节创建隔离环境并安装 `torch==2.13.0`。
- 至少有 1 GB 可用内存和约 10 MB 实验输出空间。
- 当前目录是专门的 `pytorch-aiops-lab`，不是生产程序目录。
- Windows 首次实验保持 `num_workers=0`，先排除多进程带来的干扰。

### 创建 train.py

```python
import json
import random
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

SEED = 20260813
FEATURE_NAMES = [
    "cpu_ratio",
    "memory_ratio",
    "latency_ratio",
    "error_ratio",
]
FEATURE_UNITS = ["ratio", "ratio", "ratio", "ratio"]
BATCH_SIZE = 64


def set_seed(seed: int) -> None:
    random.seed(seed)
    torch.manual_seed(seed)


def make_synthetic_data(
    sample_count: int = 4000,
) -> tuple[torch.Tensor, torch.Tensor]:
    """生成两簇可分数据，只用于验证训练工程链路。"""
    if sample_count % 2 != 0:
        raise ValueError("sample_count must be even")

    generator = torch.Generator().manual_seed(SEED)
    half = sample_count // 2

    normal_center = torch.tensor([0.35, 0.45, 0.25, 0.01])
    risk_center = torch.tensor([0.83, 0.82, 0.78, 0.16])
    normal_scale = torch.tensor([0.08, 0.08, 0.07, 0.01])
    risk_scale = torch.tensor([0.07, 0.07, 0.08, 0.04])

    normal = normal_center + torch.randn(
        half, len(FEATURE_NAMES), generator=generator
    ) * normal_scale
    risk = risk_center + torch.randn(
        half, len(FEATURE_NAMES), generator=generator
    ) * risk_scale

    features = torch.cat([normal, risk]).clamp_(0.0, 1.0).to(torch.float32)
    labels = torch.cat([torch.zeros(half), torch.ones(half)]).to(torch.float32)

    order = torch.randperm(sample_count, generator=generator)
    return features[order], labels[order]


def split_data(
    features: torch.Tensor,
    labels: torch.Tensor,
) -> tuple[tuple[torch.Tensor, torch.Tensor], ...]:
    train_end = int(len(features) * 0.70)
    validation_end = int(len(features) * 0.85)
    return (
        (features[:train_end], labels[:train_end]),
        (features[train_end:validation_end], labels[train_end:validation_end]),
        (features[validation_end:], labels[validation_end:]),
    )


class RiskClassifier(nn.Module):
    def __init__(self, feature_mean: torch.Tensor, feature_std: torch.Tensor):
        super().__init__()
        # Buffer 随 state_dict 保存，但不会被优化器当成可训练参数。
        self.register_buffer("feature_mean", feature_mean.clone())
        self.register_buffer("feature_std", feature_std.clone())
        self.network = nn.Sequential(
            nn.Linear(len(FEATURE_NAMES), 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU(),
            nn.Linear(8, 1),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        normalized = (features - self.feature_mean) / self.feature_std
        return self.network(normalized).squeeze(-1)


def evaluate(
    model: nn.Module,
    data_loader: DataLoader,
    loss_function: nn.Module,
) -> dict[str, float | int]:
    model.eval()
    total_loss = 0.0
    total = 0
    tp = fp = tn = fn = 0

    with torch.inference_mode():
        for features, labels in data_loader:
            logits = model(features)
            loss = loss_function(logits, labels)
            predictions = torch.sigmoid(logits) >= 0.5
            truth = labels.to(torch.bool)

            batch_size = labels.numel()
            total_loss += loss.item() * batch_size
            total += batch_size
            tp += int((predictions & truth).sum().item())
            fp += int((predictions & ~truth).sum().item())
            tn += int((~predictions & ~truth).sum().item())
            fn += int((~predictions & truth).sum().item())

    accuracy = (tp + tn) / total
    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    return {
        "loss": total_loss / total,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "tp": tp,
        "fp": fp,
        "tn": tn,
        "fn": fn,
    }


def build_loader(
    features: torch.Tensor,
    labels: torch.Tensor,
    shuffle: bool,
) -> DataLoader:
    generator = torch.Generator().manual_seed(SEED) if shuffle else None
    return DataLoader(
        TensorDataset(features, labels),
        batch_size=BATCH_SIZE,
        shuffle=shuffle,
        num_workers=0,
        generator=generator,
    )


def main() -> None:
    set_seed(SEED)
    features, labels = make_synthetic_data()
    train, validation, test = split_data(features, labels)

    train_mean = train[0].mean(dim=0)
    train_std = train[0].std(dim=0).clamp_min(1e-6)
    model = RiskClassifier(train_mean, train_std)

    train_loader = build_loader(*train, shuffle=True)
    validation_loader = build_loader(*validation, shuffle=False)
    test_loader = build_loader(*test, shuffle=False)

    loss_function = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)

    best_validation_loss = float("inf")
    best_state: dict[str, torch.Tensor] | None = None

    for epoch in range(1, 31):
        model.train()
        for batch_features, batch_labels in train_loader:
            optimizer.zero_grad(set_to_none=True)
            logits = model(batch_features)
            loss = loss_function(logits, batch_labels)
            loss.backward()
            optimizer.step()

        validation_metrics = evaluate(
            model, validation_loader, loss_function
        )
        if validation_metrics["loss"] < best_validation_loss:
            best_validation_loss = float(validation_metrics["loss"])
            best_state = {
                name: value.detach().cpu().clone()
                for name, value in model.state_dict().items()
            }

        if epoch == 1 or epoch % 5 == 0:
            print(
                f"epoch={epoch:02d} "
                f"validation_loss={validation_metrics['loss']:.6f} "
                f"validation_accuracy={validation_metrics['accuracy']:.4f}"
            )

    if best_state is None:
        raise RuntimeError("no best model state was captured")

    Path("artifacts").mkdir(exist_ok=True)
    model.load_state_dict(best_state)
    torch.save(best_state, "artifacts/model_state.pt")

    reloaded = RiskClassifier(torch.zeros(4), torch.ones(4))
    loaded_state = torch.load(
        "artifacts/model_state.pt",
        map_location="cpu",
        weights_only=True,
    )
    reloaded.load_state_dict(loaded_state)

    test_metrics = evaluate(reloaded, test_loader, loss_function)
    probe = torch.tensor([[0.82, 0.78, 0.74, 0.12]])
    with torch.inference_mode():
        before = model(probe)
        after = reloaded(probe)
    reload_max_abs_diff = float((before - after).abs().max().item())

    metadata = {
        "model_name": "aiops-risk-classifier",
        "model_version": "1",
        "torch_version": torch.__version__,
        "feature_names": FEATURE_NAMES,
        "feature_units": FEATURE_UNITS,
        "threshold": 0.5,
        "test_metrics": test_metrics,
        "reload_max_abs_diff": reload_max_abs_diff,
        "experiment_limit": "synthetic CPU learning experiment",
    }
    Path("artifacts/metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    if test_metrics["accuracy"] < 0.95:
        raise RuntimeError("accuracy below the experiment acceptance threshold")
    if reload_max_abs_diff > 1e-7:
        raise RuntimeError("reloaded model output changed unexpectedly")

    print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

### 逐步理解训练循环

每个 batch 都按下面的顺序处理：

1. `model.train()`：进入训练模式。
2. `optimizer.zero_grad(set_to_none=True)`：清除上一步梯度；梯度默认会累加。
3. `logits = model(batch_features)`：执行前向计算。
4. `loss = loss_function(logits, batch_labels)`：计算预测与真实标签的差距。
5. `loss.backward()`：沿计算图反向计算每个参数的梯度。
6. `optimizer.step()`：AdamW 根据梯度更新参数。

`BCEWithLogitsLoss` 把 Sigmoid 和二元交叉熵合在一起，数值上通常比“先手工 Sigmoid，再算损失”更稳定。因此训练时把原始 `logits` 交给 loss，只有评估概率时才调用 `torch.sigmoid()`。

### 运行和验收

```powershell
.\.venv\Scripts\python.exe train.py
Get-ChildItem .\artifacts
Get-Content .\artifacts\metadata.json
```

不同机器最后几位小数可能不同，不应背固定数字。验收条件是：

- 程序退出码为 `0`。
- `validation_loss` 下降且始终是有限数字。
- 独立测试集 `accuracy` 达到这个合成实验设置的 `0.95` 门槛。
- `tp + fp + tn + fn` 等于测试样本数。
- `artifacts/model_state.pt` 和 `artifacts/metadata.json` 存在。
- `reload_max_abs_diff` 不大于 `1e-7`，证明新建模型加载权重后输出未漂移。

这里的 `0.95` 只是故意容易区分的合成数据的链路门槛，**不是生产模型质量标准**。生产质量要根据误报成本、漏报成本、时间切分、业务切片和延迟标签来决定。

### 本文环境的真实运行结果

2026-08-13 在隔离环境实际运行的环境证据：

```text
OS: Windows 11 10.0.26200 AMD64
Python: 3.14.5
PyTorch: 2.13.0+cpu
NumPy: 2.5.2
torch.cuda.is_available(): False
torch.version.cuda: None
```

关键输出：

```text
epoch=01 validation_loss=0.633798 validation_accuracy=0.7633
epoch=05 validation_loss=0.041076 validation_accuracy=1.0000
epoch=30 validation_loss=0.000397 validation_accuracy=1.0000

test_loss=0.00040471475726614397
test_accuracy=1.0
precision=1.0
recall=1.0
tp=294 fp=0 tn=306 fn=0
reload_max_abs_diff=0.0
model_state.pt=4293 bytes
metadata.json=595 bytes
```

这证明本页给出的 CPU 训练、评估、保存和重载链路在上述环境跑通。满分结果来自刻意可分的合成数据，不能外推到真实告警数据，更不能证明 GPU、分布式或生产性能。

### 如果没有成功，先查这些

1. `No matching distribution found`：检查 Python 版本、系统架构和 Wheel 索引。
2. `ModuleNotFoundError: torch`：确认执行的是 `.venv` 中的 Python。
3. shape 报错：单个 batch 应为 `[batch_size, 4]`，标签应为 `[batch_size]`。
4. loss 是 `NaN`：在模型前检查 `torch.isfinite(features).all()`，再查学习率和除法。
5. accuracy 约为 `0.5`：确认执行了 `optimizer.step()`，标签没有全部相同，训练数据没有被误清空。
6. 重载时报 missing/unexpected keys：模型类结构与保存时不一致，打印 `load_state_dict` 的返回信息。
7. Windows 多进程报错：先保持 `num_workers=0`，且入口必须放在 `if __name__ == "__main__"` 下。

## 推理程序：先验证数据契约，再调用模型

创建 `predict.py`：

```python
import json
from pathlib import Path

import torch

from train import FEATURE_NAMES, RiskClassifier


def validate_features(values: torch.Tensor) -> None:
    expected_shape = (1, len(FEATURE_NAMES))
    if tuple(values.shape) != expected_shape:
        raise ValueError(
            f"expected shape {expected_shape}, received {tuple(values.shape)}"
        )
    if not bool(torch.isfinite(values).all()):
        raise ValueError("features contain NaN or infinity")
    if bool(((values < 0.0) | (values > 1.0)).any()):
        raise ValueError("ratio features must be between 0 and 1")


metadata = json.loads(
    Path("artifacts/metadata.json").read_text(encoding="utf-8")
)
model = RiskClassifier(torch.zeros(4), torch.ones(4))
state = torch.load(
    "artifacts/model_state.pt",
    map_location="cpu",
    weights_only=True,
)
model.load_state_dict(state)
model.eval()

# 字段顺序必须与 metadata.feature_names 完全一致。
features = torch.tensor([[0.82, 0.78, 0.74, 0.12]])
validate_features(features)

with torch.inference_mode():
    probability = torch.sigmoid(model(features)).item()

print("feature_names=", metadata["feature_names"])
print("model_version=", metadata["model_version"])
print("probability=", probability)
print("high_risk=", probability >= float(metadata["threshold"]))
```

运行：

```powershell
.\.venv\Scripts\python.exe predict.py
```

即使只有一条数据，也保留 batch 维，所以 shape 是 `[1, 4]`，不是 `[4]`。生产 API 还应校验字段名、单位、采集时间、来源、模型版本、超时和请求 ID。

## 故障注入实验：NaN 在进入模型前被拒绝

### 为什么选择 NaN

`NaN` 是 Not a Number，表示“不是有效数字”。除零、空字段转换、采集器异常或上游计算故障都可能产生它。`NaN` 进入神经网络后会沿矩阵计算传播，最后可能让 loss、梯度或风险概率全部变成 `NaN`。

本实验不把坏值偷偷改成 `0`，而是验证“检测、隔离、回放”闭环。

### 创建 fault_injection.py

```python
import json
from pathlib import Path

import torch

from train import FEATURE_NAMES, RiskClassifier


def validate_features(values: torch.Tensor) -> None:
    expected_shape = (1, len(FEATURE_NAMES))
    if tuple(values.shape) != expected_shape:
        raise ValueError(
            f"expected shape {expected_shape}, received {tuple(values.shape)}"
        )
    if not bool(torch.isfinite(values).all()):
        raise ValueError("features contain NaN or infinity")
    if bool(((values < 0.0) | (values > 1.0)).any()):
        raise ValueError("ratio features must be between 0 and 1")


metadata = json.loads(
    Path("artifacts/metadata.json").read_text(encoding="utf-8")
)
model = RiskClassifier(torch.zeros(4), torch.ones(4))
model.load_state_dict(
    torch.load(
        "artifacts/model_state.pt",
        map_location="cpu",
        weights_only=True,
    )
)
model.eval()

# 故意把 memory_ratio 注入 NaN，模拟采集或解析失败。
dirty = torch.tensor([[0.82, float("nan"), 0.74, 0.12]])

try:
    validate_features(dirty)
except ValueError as error:
    print("rejected_dirty_sample=", error)
else:
    raise RuntimeError("fault injection failed: dirty sample was accepted")

# 模拟从可靠原始事件重新计算后的干净样本，而不是静默篡改脏样本。
replayed = torch.tensor([[0.82, 0.78, 0.74, 0.12]])
validate_features(replayed)

with torch.inference_mode():
    probability = torch.sigmoid(model(replayed)).item()

if not torch.isfinite(torch.tensor(probability)):
    raise RuntimeError("model returned a non-finite probability")

print("replay_status= accepted")
print("model_version=", metadata["model_version"])
print("probability=", probability)
```

### 运行与预期结果

```powershell
.\.venv\Scripts\python.exe fault_injection.py
```

应看到类似输出：

```text
rejected_dirty_sample= features contain NaN or infinity
replay_status= accepted
model_version= 1
probability= 一个 0 到 1 之间的有限数字
```

本文同一隔离环境的实际输出是：

```text
rejected_dirty_sample= features contain NaN or infinity
replay_status= accepted
model_version= 1
probability= 0.9991193413734436
```

验收点：

- 脏样本在模型计算前被明确拒绝。
- 错误信息能指出无效数字，而不是只留下一个下游 `NaN loss`。
- 回放的干净样本通过同一套校验。
- 模型版本进入输出证据，便于事故关联。

### 按事故处理思路复盘

1. **现象**：输入被拒绝或模型输出非有限值。
2. **证据**：记录请求 ID、字段名、采集时间、原始值、特征版本和模型版本；敏感信息先脱敏。
3. **假设**：采集失败、除零、单位转换错误或模型数值不稳定。
4. **验证**：在模型前后分别做 `isfinite`，定位第一个出现坏值的环节。
5. **修复**：优先修上游并从可信原始数据回放；只有数据契约明确允许时，才使用随模型版本化的训练统计量填补。
6. **止损**：高风险自动修复链路应回退到规则或人工审批，不应把 `NaN` 当作低风险。
7. **复盘**：为缺失率、拒绝率和非有限值建立指标与告警。

### 清理

确认当前路径确实是实验目录，再执行：

```powershell
Remove-Item -LiteralPath .\artifacts -Recurse -Force
```

如果要把结果作为 GitHub 学习证据，请先复制 `metadata.json` 和脱敏后的终端输出；不要删除仍要用于复盘的证据。

## 常用命令、API 与参数字典

### 环境和设备命令

| 命令 | 用途 | 看什么结果 | 常见坑 |
|---|---|---|---|
| `python -m pip show torch` | 查看当前解释器安装的包 | Version、Location | 直接运行 `pip` 可能指向另一个 Python |
| `python -m torch.utils.collect_env` | 收集 PyTorch、系统、编译和 GPU 环境 | Torch/CUDA/驱动/CPU 信息 | 输出可能含主机和路径信息，分享前脱敏 |
| `nvidia-smi` | 查看 NVIDIA 驱动、GPU 进程和显存 | Driver Version、Memory-Usage | 能看到 GPU 不代表当前 Torch Wheel 带 CUDA |
| `torch.cuda.is_available()` | 问当前进程能否使用 CUDA | `True` 或 `False` | 只看操作系统设备管理器不够 |
| `torch.cuda.get_device_name(0)` | 查看第 0 个 CUDA 设备名 | 实际 GPU 名称 | 先判断 CUDA 可用，否则会报错 |

`nvidia-smi` 显示的 “CUDA Version” 更接近驱动可支持的上限，不等同于 `torch.version.cuda` 所表示的 PyTorch 构建运行时版本。排障时要把驱动、Torch Wheel 和容器运行时三层分开。

### Tensor 创建与转换

| API | 用途 | 关键行为 | 常见坑 |
|---|---|---|---|
| `torch.tensor(data)` | 从数据创建新 Tensor | 通常复制数据 | 未显式 dtype 时可能得到不期望的整数或双精度 |
| `torch.as_tensor(data)` | 尽量少复制地转换 | 条件允许时共享底层数据 | 原数据被修改时结果可能一起变 |
| `torch.from_numpy(array)` | 从 NumPy 数组创建 Tensor | CPU 上通常共享内存 | NumPy dtype、连续性和可写性要匹配 |
| `tensor.to(device, dtype)` | 改设备或 dtype | 必要时产生新 Tensor | 必须接住返回值，`x.to(...)` 不保证原地修改 |
| `tensor.detach()` | 从当前自动求导图分离 | 可能仍共享存储 | 需要独立副本时用 `detach().clone()` |

### DataLoader 参数

```python
DataLoader(
    dataset,
    batch_size=64,
    shuffle=True,
    num_workers=0,
    pin_memory=False,
    drop_last=False,
    persistent_workers=False,
)
```

- `batch_size`：一次送入模型的样本数。增大可能提高吞吐，也会增加内存并改变优化行为。
- `shuffle`：每轮打乱样本。训练集常用，验证和测试通常不用。
- `num_workers`：并行读取数据的子进程数。`0` 表示主进程读取，最容易排障。
- `pin_memory`：为 CPU 内存使用页锁定，CUDA 主机到设备复制可能更快；CPU 实验没有必要开启。
- `drop_last`：最后不足一个 batch 时是否丢弃。它会改变每轮真实样本数，不能无意识开启。
- `persistent_workers`：多轮训练时保持 worker，不必每个 epoch 重建；会长期占用进程和内存。

排查 DataLoader 卡住时，先退回 `num_workers=0`。若主进程正常，再逐步增加 worker，检查数据读取、序列化、共享内存、文件句柄、Windows 入口保护和网络存储。

### 训练循环中的六个关键调用

| 调用 | 目的 | 漏掉后的典型现象 |
|---|---|---|
| `model.train()` | 启用训练模式行为 | Dropout/BatchNorm 行为不符合训练预期 |
| `optimizer.zero_grad()` | 清除旧梯度 | 梯度意外累加，更新越来越异常 |
| `model(inputs)` | 执行 `forward` | 不要手工直接调用 `model.forward()`，否则可能绕过框架钩子 |
| `loss.backward()` | 计算梯度 | 参数的 `.grad` 没有本轮结果 |
| `optimizer.step()` | 更新参数 | loss 基本不变，权重不变 |
| `model.eval()` | 启用评估模式行为 | 验证结果随机或与线上不一致 |

`eval()` 不会关闭梯度记录，`no_grad()` 也不会自动把模型切到评估模式。推理通常两者都要：

```python
model.eval()
with torch.inference_mode():
    output = model(input_tensor)
```

## 模型状态、保存、恢复与一致性

### `state_dict` 是什么

`state_dict` 是“带名字的状态字典”：

- 模型的 `state_dict` 包含参数和持久化 Buffer。
- 优化器的 `state_dict` 包含动量、步数等训练状态。
- 它不自动包含模型类代码、特征字段、阈值、数据版本和发布审批。

推荐保存状态而不是直接 Pickle 整个模型对象：

```python
torch.save(model.state_dict(), "model_state.pt")

model = RiskClassifier(feature_mean, feature_std)
state = torch.load(
    "model_state.pt",
    map_location="cpu",
    weights_only=True,
)
model.load_state_dict(state, strict=True)
```

`strict=True` 要求键名全部匹配，适合发布门禁。迁移学习时可以有意识地用 `strict=False`，但必须审查并记录 missing keys 和 unexpected keys，不能把不匹配静默忽略。

### 推理制品和训练 Checkpoint 不同

推理制品只需模型运行相关状态；训练恢复还需要更多内容：

```python
checkpoint = {
    "model_state": model.state_dict(),
    "optimizer_state": optimizer.state_dict(),
    "epoch": epoch,
    "global_step": global_step,
    "torch_rng_state": torch.get_rng_state(),
    "data_version": "metrics-2026-08-13-v1",
    "code_commit": "replace-with-real-git-sha",
}
torch.save(checkpoint, "checkpoints/last.pt")
```

使用混合精度时还要保存 GradScaler 状态；使用学习率调度器时保存 scheduler；分布式采样时记录能够恢复数据位置的状态。否则“成功加载权重”不等于“从同一个训练步骤继续”。

恢复顺序通常是：

1. 用同一份配置创建模型、优化器和调度器。
2. 加载 checkpoint 到明确设备。
3. 恢复各对象的 `state_dict`。
4. 恢复 epoch、global step、随机状态和数据游标。
5. 先跑一小段验证或 golden batch，再恢复正式训练。

### 保存过程也会出现半成品

进程可能在写文件时崩溃。单机本地文件可先写临时文件，再在同一文件系统内替换：

```python
from pathlib import Path
import os
import torch

target = Path("checkpoints/last.pt")
temporary = target.with_suffix(".pt.tmp")
target.parent.mkdir(exist_ok=True)
torch.save(checkpoint, temporary)
os.replace(temporary, target)
```

这不是对象存储、NFS 或多节点场景的完整事务保证。生产中还要：

- 由明确的 coordinator 或 rank 负责发布完成标记。
- 写校验和、大小、模型版本和创建时间。
- 先验证可加载，再更新“当前稳定版本”指针。
- 保留上一份已验证 checkpoint。
- 定期做真实恢复演练，而不只是确认文件存在。

### 分布式 Checkpoint

大模型的状态可能无法由一个进程一次收集和写出。PyTorch 的 Distributed Checkpoint（DCP）用于让多个 rank 分片保存与加载状态。`rank` 是分布式进程编号。

它解决的是分片和并行 I/O，不会自动替你解决：

- 数据集版本是否一致。
- 模型代码是否兼容。
- 训练拓扑变化是否经过验证。
- 对象存储的一致性和权限。
- 哪一个 checkpoint 已经完成并允许恢复。

DCP 部分 API 仍是 experimental。异步保存会先复制状态到 CPU buffer，再在后台写存储，因此会额外占用主存或页锁定内存；官方示例建议最多只保留一个尚未完成的 future，并在作业退出前等待它结束。目录出现了不代表所有 rank 都完成，晋级前仍要做 load smoke test。

## 随机性、可复现与数值正确性

### 固定 seed 不等于绝对复现

基础设置：

```python
import random
import torch

seed = 42
random.seed(seed)
torch.manual_seed(seed)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(seed)
```

需要更强确定性时可评估：

```python
torch.use_deterministic_algorithms(True)
```

某些 CUDA 算子、并行归约、底层库、硬件和版本仍可能产生差异；确定性算法也可能更慢，部分算子会直接报错。PyTorch 官方明确不保证跨 release、平台和 CPU/GPU 的完全相同结果。因此生产验收通常使用允许误差的数值比较和业务指标门槛，而不是要求所有位完全一致。

必须一起记录：

- 代码 commit 和配置 hash。
- PyTorch、Python、驱动、CUDA/ROCm、操作系统版本。
- 模型初始化和数据采样 seed。
- 数据快照、拆分规则和样本顺序。
- 是否启用 AMP、TF32、确定性算法或编译。
- 硬件型号和分布式拓扑。

### 梯度异常怎样尽早暴露

调试时可临时启用：

```python
torch.autograd.set_detect_anomaly(True)
```

它会帮助定位产生 `NaN` 或错误反向传播的算子，但开销较大，不应默认用于长期生产训练。

还可以监控梯度范数：

```python
total_norm = torch.nn.utils.clip_grad_norm_(
    model.parameters(),
    max_norm=1.0,
    error_if_nonfinite=True,
)
```

梯度裁剪是控制更新幅度的策略，不是掩盖坏数据的万能修复。先找到第一个非有限输入、loss 或梯度，再决定是否需要裁剪、降低学习率或修改模型。

## 自动混合精度 AMP

AMP 是 Automatic Mixed Precision，自动混合精度。它让适合的算子使用较低精度以提升吞吐和减少显存，同时保留敏感计算的精度。

CUDA 训练的典型结构：

```python
scaler = torch.amp.GradScaler("cuda")

for features, labels in train_loader:
    features = features.to("cuda", non_blocking=True)
    labels = labels.to("cuda", non_blocking=True)
    optimizer.zero_grad(set_to_none=True)

    with torch.autocast(device_type="cuda", dtype=torch.float16):
        logits = model(features)
        loss = loss_function(logits, labels)

    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

- `autocast`：按算子选择适合的 dtype。
- `GradScaler`：放大 loss，降低 float16 小梯度下溢风险。
- `scaler.step`：发现梯度非有限时可以跳过危险更新。
- `scaler.update`：根据运行状态调整缩放因子。

AMP 不是无损开关。启用前要比较 loss 曲线、关键指标、吞吐、峰值显存和 golden output；CPU、CUDA、MPS 的支持 dtype 和收益也不同。

## `torch.compile`：先理解再加速

PyTorch 默认 eager mode 是“Python 调到哪一步就执行哪一步”，容易调试。`torch.compile` 尝试捕获稳定的计算图，再交给后端优化；默认后端是 TorchInductor。

```python
compiled_model = torch.compile(model)
output = compiled_model(features)
```

内部路径可以理解为：

```text
Python 调用
  -> TorchDynamo 捕获图
  -> guards 检查输入与程序假设
  -> AOT Autograd 处理前向/反向图
  -> TorchInductor 生成优化代码
  -> 执行并缓存
```

`guard` 是保护条件，例如 dtype、shape 或对象状态仍符合已编译图的假设。条件变化可能触发重新编译。Python 数据相关分支、不支持的操作或副作用可能导致 graph break，即计算图被切断。

排障环境变量：

```powershell
$env:TORCH_LOGS="graph_breaks,recompiles"
python train.py
```

当前 shell 关闭后这个临时变量即失效。重点看：

- 是否反复对新 shape 编译。
- graph break 在哪一行发生。
- 首轮编译时间和稳态 step time 分别是多少。
- 优化后的数值与 eager 是否在允许误差内。
- 内存是下降还是反而升高。

PyTorch 2.13 文档中的默认重新编译上限是 8；达到上限后的行为和日志要以当前版本为准。不要把首次编译的冷启动耗时混进稳态吞吐，也不要在没有 golden test 和回滚开关时直接替换生产 eager 路径。

Windows CPU 从 PyTorch 2.5 起有 TorchInductor 支持，但官方教程仍位于 `unstable` 路径，并要求配置 MSVC、LLVM 或 Intel C++ 编译器环境。它不是安装 PyTorch 或完成本文基础实验的前置条件；要把“框架可导入”和“本地编译链可用”分开验收。

## SDPA：Transformer 注意力的高性能接口

SDPA 是 Scaled Dot Product Attention，即缩放点积注意力。它把 `query × key`、缩放、Mask、Softmax、Dropout 和乘 `value` 组合成统一接口。CUDA 上会按设备、dtype、shape 和 Mask 等条件选择 Flash Attention、Memory-Efficient、cuDNN 或数学实现；同一个 API 不保证每次都走同一个 kernel。

```python
dropout_probability = 0.1 if model.training else 0.0
output = torch.nn.functional.scaled_dot_product_attention(
    query,
    key,
    value,
    attn_mask=attention_mask,
    dropout_p=dropout_probability,
    is_causal=False,
)
```

这里有三个生产坑：

1. `model.eval()` 不会替 SDPA 把 `dropout_p` 变成 0；评估时调用方必须显式传 `0.0`。
2. 融合后端有输入限制，不满足时可能回退数学实现或给出 warning；“接口调用成功”不等于性能路径符合预期。
3. 后端和精度变化可能产生允许范围内的数值差异，升级时要比较 golden output、吞吐和显存。

SDPA 属于 Transformer 交叉学习内容，不是本文 CPU 分类实验的必需依赖。注意力原理和 Mask 语义可继续阅读 [Transformer](/tech-stack/data-ai/transformer)。

## 性能、容量与 Profiler

### 训练内存到底被谁占用

粗略拆分：

```text
模型参数
+ 参数梯度
+ 优化器状态
+ 激活值
+ 临时工作区
+ 通信缓冲
+ CUDA allocator 保留与碎片
= 峰值内存
```

以 FP32 Adam 类优化器做非常粗略估算，参数、梯度和两份一阶/二阶矩状态合计常接近每参数 16 字节，还没有算激活和临时空间。10 亿参数仅这些状态就可能约 16 GB；混合精度、主权重、副本和实现细节会改变结果，所以只能用它做第一轮容量判断，最终必须实测峰值。

CUDA 证据：

```python
torch.cuda.reset_peak_memory_stats()

# 执行若干个有代表性的训练 step

print("allocated=", torch.cuda.memory_allocated())
print("reserved=", torch.cuda.memory_reserved())
print("peak=", torch.cuda.max_memory_allocated())
print(torch.cuda.memory_summary())
```

`allocated` 是 Tensor 实际占用，`reserved` 是 CUDA caching allocator 向驱动保留的内存。任务结束后 `nvidia-smi` 仍看到较高保留，不等于所有内存都泄漏；要结合 Tensor 引用、allocated、reserved 和跨 step 趋势判断。

### OOM 的排查顺序

OOM 是 Out Of Memory，内存不足。

1. 保存完整异常、batch shape、sequence length、dtype 和当时的峰值显存。
2. 确认是 CPU RAM、GPU 显存，还是容器/调度器限制。
3. 比较正常 step 与失败 step 的输入大小，寻找异常长样本或动态 shape。
4. 检查是否把带计算图的 loss/output 长期放入 Python 列表。
5. 逐步减小 batch size 或 sequence length，确认容量拐点。
6. 再评估 AMP、梯度累积、activation checkpointing、FSDP 或模型缩小。
7. 用 Profiler 或内存快照验证修复，不要只靠频繁 `empty_cache()`。

`torch.cuda.empty_cache()` 释放 allocator 中当前未使用的缓存给其他进程，但不会释放仍被 Tensor 引用的显存，也不会自动修复泄漏。

### 吞吐低时先分四段

```text
数据读取等待
  -> CPU 预处理与 Host-to-Device 拷贝
  -> GPU 前向/反向计算
  -> 多卡通信与同步
```

常见证据：

- samples/s、tokens/s、step time。
- DataLoader queue wait。
- CPU、磁盘和网络吞吐。
- GPU utilization、kernel time、memory bandwidth。
- all-reduce 时间和慢 rank。
- batch/sequence length 分布。

只有先定位哪一段最慢，才知道应该增加 DataLoader worker、批量化小算子、使用 AMP/compile、优化存储，还是调整分布式拓扑。

### `torch.profiler` 最小示例

```python
from torch.profiler import ProfilerActivity, profile, schedule, tensorboard_trace_handler

with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    schedule=schedule(wait=1, warmup=1, active=3, repeat=1),
    on_trace_ready=tensorboard_trace_handler("profiler-logs"),
    record_shapes=True,
    profile_memory=True,
) as profiler:
    for features, labels in train_loader:
        train_one_step(features, labels)
        profiler.step()
```

没有 CUDA 时删除 `ProfilerActivity.CUDA`。Profiler 本身有开销，`record_shapes` 和内存分析开销更明显；应在代表性短窗口采样，不要不加控制地长期全量记录。Trace 可能包含算子形状、路径或标记，上传前同样要审查敏感信息。

## 分布式训练：从一张卡扩展到多张卡

### 先判断是否真的需要分布式

推荐按问题选择：

1. 模型能放进一张 GPU，只是希望更快处理更多数据：优先考虑 DistributedDataParallel（DDP）。
2. 模型、梯度和优化器状态放不进一张 GPU：评估 Fully Sharded Data Parallel 2（FSDP2）。
3. 单层本身太大或 FSDP2 通信成为瓶颈：再评估 Tensor Parallel（TP，张量并行）或 Pipeline Parallel（PP，流水线并行）。
4. 数据和模型都很小：多卡的进程、通信和同步开销可能让它更慢。

### DDP 的数据和梯度路径

DDP 通常让每张 GPU 对应一个进程。每个进程持有完整模型副本，读取不同的数据分片：

```text
rank 0: batch A -> forward -> backward -> local gradients --\
rank 1: batch B -> forward -> backward -> local gradients ----> all-reduce -> 每个 rank 得到一致的聚合梯度 -> step
rank 2: batch C -> forward -> backward -> local gradients ----/
```

`all-reduce` 是把各 rank 的梯度聚合，再把结果发回所有 rank。同步点意味着一个慢 rank 可能拖住所有进程。

DDP 不会自动把一批数据切开，必须配合 `DistributedSampler`：

```python
sampler = torch.utils.data.DistributedSampler(
    dataset,
    shuffle=True,
)
loader = DataLoader(
    dataset,
    batch_size=per_rank_batch_size,
    sampler=sampler,
    shuffle=False,
)

for epoch in range(start_epoch, total_epochs):
    sampler.set_epoch(epoch)
    for features, labels in loader:
        train_one_step(features, labels)
```

调用 `set_epoch(epoch)` 才能让每个 epoch 获得确定但不同的打乱顺序。已经使用 sampler 时不要再同时设置 `shuffle=True`。

### DDP 最小启动方式

初始化代码骨架：

```python
import os
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

dist.init_process_group(backend="nccl")
local_rank = int(os.environ["LOCAL_RANK"])
torch.cuda.set_device(local_rank)

model = RiskClassifier(...).to(local_rank)
model = DDP(model, device_ids=[local_rank])

# 训练结束后所有 rank 都应进入清理路径。
dist.destroy_process_group()
```

单机四卡示例：

```bash
torchrun --standalone --nproc-per-node=4 train_ddp.py
```

- `torchrun`：启动和管理分布式训练进程。
- `--nproc-per-node=4`：本机启动四个进程，通常一进程一 GPU。
- `LOCAL_RANK`：当前进程在本机的设备编号。
- `RANK`：当前进程在整个作业中的全局编号。
- `WORLD_SIZE`：全部进程数量。
- `nccl`：NVIDIA GPU 训练常用通信后端。
- `gloo`：常用于 CPU 或某些调试场景。

PyTorch 官方把 Linux 上的分布式训练作为主要稳定路径；Windows 分布式支持仍有原型边界，而且没有 NCCL。生产 GPU 多机实验应在目标 Linux、驱动、网卡和调度环境中验证，不能拿本文 Windows CPU 实验替代。

### Global batch 和学习率

```text
global_batch_size
= per_rank_batch_size
* world_size
* gradient_accumulation_steps
```

卡数从 1 变 8 而每卡 batch 不变，global batch 也扩大 8 倍。它会改变优化过程，不是纯性能参数。要重新评估学习率、warmup、收敛、类别分布和每个 epoch 的 step 数。

梯度累积用于显存不够时用多个 micro-batch 模拟较大 batch。DDP 中非同步累积步骤可以用 `no_sync()` 减少不必要的 all-reduce，但最后一个 micro-batch 必须同步；写错会造成梯度不一致。

### DDP 常见故障

#### 所有进程“卡住”但没有报错

常见原因：

- 某个 rank 先异常退出，其他 rank 仍等待 collective。
- 不同 rank 走了不同条件分支，调用 collective 的次数或顺序不同。
- 某个 DataLoader、磁盘或网络特别慢。
- 防火墙、端口、DNS、网卡或 NCCL 拓扑配置错误。

证据链：

1. 收集所有 rank 同一时间窗口的日志，不能只看 rank 0。
2. 找到各 rank 最后一个共同完成的 step 和 collective。
3. 记录主机、GPU、网卡、进程退出码和调度器事件。
4. 用小模型、小数据、单节点逐层缩小范围。
5. 仅在受控调试环境开启分布式调试日志，避免长期产生海量或敏感输出。

#### 指标比单卡差很多

检查 global batch、学习率、sampler、是否重复或漏样本、BatchNorm 行为、随机种子和评价聚合。每个 rank 只计算自己的 accuracy，再只打印 rank 0 的局部值，不代表全局指标。

#### 多卡反而更慢

比较计算时间、all-reduce 时间、DataLoader 等待和慢 rank。模型太小、batch 太小、跨机网络慢或 GPU 拓扑不合理时，通信收益可能为负。

### FSDP2：模型放不进单卡时分片

DDP 每个 rank 都保存完整参数、梯度和优化器状态。FSDP2 把状态分片到多个 rank，需要某层计算时再按策略聚合参数，计算后重新分片，从而降低单卡峰值。

```text
持久状态按 rank 分片
  -> all-gather 当前模块参数
  -> forward / backward
  -> reduce-scatter 梯度
  -> 参数重新保持分片
```

官方当前主线是 FSDP2，FSDP1 已弃用。FSDP2 使用基于 DTensor 的 `fully_shard` 路径。它不是“把 DDP 包一层就自动成功”：

- 分片边界会影响通信和内存峰值。
- forward prefetch、backward prefetch 与通信重叠需要实测。
- 模型初始化、meta device、混合精度和 CPU offload 都有约束。
- 保存与加载应使用匹配的分布式 state/checkpoint API。
- 变更 world size 的恢复需要明确测试。
- 应先调用 `fully_shard`，再创建 optimizer，确保优化器引用分片后的参数。
- 必须调用 `model(inputs)` 触发框架 hooks，不能直接绕到 `model.forward(inputs)`。

选择 FSDP2 前先建立单卡或 DDP 基线，记录每步耗时、峰值显存、通信占比和恢复时间。否则即使“不 OOM 了”，也不知道吞吐是否退化、故障恢复是否可用。

### TP 与 PP 的适用边界

- TP：把一次矩阵计算分到多设备，适合单层本身过大；通信频繁，通常偏好节点内高速互联。
- PP：把连续模型层放到不同 stage，micro-batch 像流水线一样流动；要处理 pipeline bubble、负载不均和调度。
- 3D 并行：组合 data、tensor 和 pipeline parallel，容量更大，但拓扑、checkpoint、观测和故障复杂度也显著上升。

面试时不能只背三个缩写，要能说明“状态复制在哪里、通信发生在哪里、单卡内存为什么下降、慢节点如何影响全局”。

### 高可用和故障恢复语义

训练作业的高可用通常不是让每个进程永不失败，而是：

```text
进程/节点失败
  -> 调度器或 elastic launcher 判定作业失败
  -> 释放或重建 worker group
  -> 从最近一份已完成 checkpoint 恢复
  -> 验证 global step 与数据位置
  -> 继续训练
```

必须定义：

- RPO：最多允许丢多少训练进度，例如 10 分钟。
- RTO：失败后多久必须恢复，例如 30 分钟。
- checkpoint 周期、写入耗时和保留策略。
- 哪些错误允许自动重试，哪些错误会在重试后重复破坏数据或结果。
- world size 变化后 batch、学习率和数据采样语义是否保持。

Elastic 负责成员变化和重启编排，不会自动保证你的 checkpoint 完整、数据游标正确或训练结果等价。

## 从训练代码到生产推理服务

### PyTorch 本身不是完整业务服务

`model(input)` 只完成模型执行。生产服务还需要：

- HTTP/gRPC 协议和认证。
- 请求 schema、字段单位、大小和超时校验。
- 动态 batching、排队、并发和背压。
- 模型版本、预热、健康检查和流量路由。
- 指标、日志、trace、审计和告警。
- 灰度、熔断、回滚与自动修复审批。

不要把 Jupyter、调试端口或裸 Python 进程直接暴露到公网。

### Eager、`torch.export` 与运行时选择

- Eager：最贴近 Python 代码，调试和动态控制流最直接，部署时需要兼容的 Python/PyTorch 环境。
- `torch.export`：在明确输入约束下导出更完整的张量计算图，适合进一步转换和部署；动态 shape 需要显式表达约束。
- ONNX 或专用推理运行时：适合跨运行时或特定硬件，但算子覆盖、动态 shape、精度和性能必须单独验证。

当前官方文档已将 TorchScript 标记为弃用方向并引导使用 `torch.export`。旧系统仍可能依赖 TorchScript，但新项目不应不经评估就把它当默认长期路线。

导出不是“文件生成成功”就完成。至少要对同一批 golden inputs 比较：

- Eager 与导出模型输出误差。
- 边界 shape 和动态 shape。
- 冷启动、p50/p95/p99 延迟和吞吐。
- CPU/GPU 内存峰值。
- 不支持算子和 fallback。

### 模型制品契约

建议把以下内容作为一个不可拆散的发布单元：

```text
model state / exported graph
+ model code or runtime image
+ preprocessing and postprocessing
+ feature names, order, units and ranges
+ label meaning and threshold
+ framework and dependency versions
+ training data/version summary
+ offline metrics and known limitations
+ hash, owner, approval and rollback target
```

权重、特征顺序和阈值来自不同版本时，服务即使“启动成功”也可能做出错误判断。

### 典型在线路径

```text
监控事件
  -> API 网关：认证、限流、请求大小
  -> 特征服务：窗口聚合、schema、单位、时间戳
  -> 推理服务：batch、PyTorch runtime、模型版本
  -> 策略层：阈值、拓扑、维护窗口、审批
  -> 告警或 Runbook
  -> post-check 与审计
```

模型输出应被当作证据，不是不可质疑的命令。删除、重启、扩缩容等高风险操作仍要经过策略、影响范围、幂等、限次和回滚控制。

## 安全与供应链边界

### 不加载不可信模型文件

PyTorch 的保存机制长期与 Python Pickle 生态相关。从 PyTorch 2.6 起，未显式传 `pickle_module` 时，`torch.load` 默认使用 `weights_only=True`。它会限制可反序列化对象范围，但官方明确说明它仍不能防止拒绝服务或所有内存破坏风险；不要加载不可信来源的数据。

安全做法：

1. 模型只从受控仓库和审批流程进入。
2. 固定版本、对象存储 version ID 或内容 digest，不用可漂移的 `latest`。
3. 下载后验证 SHA-256 或签名。
4. 在低权限、无生产密钥、限制网络的隔离环境扫描和加载。
5. 优先保存普通 Tensor 的 `state_dict`，加载时显式 `weights_only=True`。
6. 自定义代码、扩展和算子单独审计，不因权重格式安全就默认信任代码。
7. 记录 SBOM、许可证和漏洞扫描结果。

`weights_only=True` 不是恶意模型的万能沙箱，也不会检查模型是否有后门、超大内存消耗或错误业务行为。

### GPU 和训练平台也有权限边界

- 训练容器不应默认拥有宿主机特权。
- 数据集、模型仓库和 checkpoint 存储使用最小权限身份。
- Notebook、TensorBoard、Profiler 页面和分布式 rendezvous 端口不得无认证暴露。
- 日志不得输出原始用户数据、密钥、完整 Prompt 或内部拓扑。
- 多租户 GPU 要评估隔离、显存残留、驱动漏洞和拒绝服务风险。
- 自动下载模型或自定义算子的出网权限应受控。

### 数据和模型风险

PyTorch 能把 loss 降低，不代表数据使用合法或模型决策安全。生产评审还要覆盖数据授权、个人信息、保留周期、训练数据投毒、模型偏差、成员推断和输出可解释性。

## 可观测性：把训练和推理接入 AIOps

### 指标 Metrics

训练过程至少监控：

- `train_loss`、`validation_loss` 和关键业务指标。
- step/epoch 耗时、samples/s 或 tokens/s。
- DataLoader 等待时间、数据拒绝率和坏 batch 数。
- CPU、内存、GPU 利用率、显存和温度。
- 学习率、梯度范数、非有限 loss/gradient 数。
- checkpoint 大小、耗时、失败次数和最后成功时间。
- 分布式每个 rank 的 step time、collective 时间和重启次数。

推理服务至少监控：

- QPS、并发、队列长度和 batch size。
- p50、p95、p99 延迟、超时和错误率。
- 当前模型、特征、阈值和运行时版本。
- 输入缺失/越界/NaN/拒绝率。
- 输出概率分布、高风险比例和各版本流量占比。
- CPU/GPU 使用率、显存、OOM 和进程重启。
- 延迟标签到达后的 precision、recall、误报与漏报成本。

技术指标只能说明服务是否健康，不能单独证明模型判断正确。输入漂移、输出漂移和真实业务结果要一起看。

### 日志 Logs

结构化日志建议包含：

```json
{
  "request_id": "redacted-id",
  "model_version": "risk-v7",
  "feature_version": "metrics-window-v4",
  "runtime": "pytorch-2.13.0",
  "input_validation": "passed",
  "probability": 0.91,
  "decision": "manual_review",
  "latency_ms": 18,
  "fallback": false
}
```

原始指标、日志文本或用户数据可能敏感。优先记录 hash、统计量、字段状态和可追踪标识，不把完整生产样本随意写入普通应用日志。

### 链路追踪 Traces

一次 AIOps 判定可拆为：

```text
receive event
  -> fetch features
  -> validate schema
  -> queue / batch
  -> model inference
  -> policy decision
  -> runbook approval
  -> action
  -> post-check
```

Trace 帮助回答延迟卡在特征查询、排队、GPU 推理还是自动化动作。span 中记录版本和状态即可，避免直接塞入大 Tensor 或敏感正文。

### 告警 Alerts

告警必须可执行：

- 推理 p99 和错误率同时恶化：先切分网关、排队、特征和模型时间。
- 输入拒绝率突升：比较字段/schema/采集器版本，暂停高风险自动化。
- 输出高风险比例突变：检查流量分布、单位、顺序、阈值和模型版本。
- checkpoint 长时间未成功：按 RPO 计算当前风险，停止无保护的长时间训练。
- 某个 rank 持续落后：对比主机/GPU/网络/DataLoader，避免把慢节点误当模型计算问题。

告警中应链接证据面板和 Runbook，不应只写“GPU 异常”。

## AIOps 生产用例

### 指标异常检测和风险评分

把多个时间窗口的 CPU、内存、延迟、错误率和变更信号送入模型，输出风险概率。必须按时间和故障事件切分数据，防止同一事故的相邻窗口同时出现在训练和测试中。

### 日志分类和聚类表示

PyTorch 可训练文本编码器或分类器，把日志归类到故障类型或负责团队。训练前要脱敏，避免模型只记住主机名、工单号等捷径；新日志模板出现后要监控未知率和漂移。

### 根因候选排序

输入拓扑关系、变更时间、指标异常和 trace，输出候选根因排名。服务应返回支持证据和置信度，而不是只给一个无法验证的服务名。

### 容量与时间序列预测

模型预测未来资源需求，策略层根据预测区间而不是单点值决定扩容。节假日、发布、业务活动和缺失数据都可能改变分布，要保留简单基线和人工覆盖能力。

### 告警降噪与自动化

模型可为告警做去重、聚合和优先级排序。只有置信度、规则、依赖拓扑、维护窗口和影响范围同时满足时，才允许进入 Runbook；动作必须幂等、限次、审计、可停止、可回滚，并执行 post-check。

## 升级、灰度和回滚

### 升级前清单

1. 阅读目标 PyTorch 和相关域库的 release notes、迁移说明和弃用项。
2. 固定 Python、PyTorch、CUDA/ROCm、驱动、编译器和自定义扩展组合。
3. 在新环境加载历史权重和 checkpoint。
4. 用 golden dataset 比较旧/新输出、指标和允许误差。
5. 重新跑训练恢复、导出、推理、AMP、compile 和分布式回归。
6. 比较吞吐、p99、CPU/GPU 内存和首次编译/冷启动。
7. 生成固定镜像、依赖锁、SBOM 和校验和。
8. 保留旧运行时、旧模型、旧特征和旧阈值的完整回滚单元。

域库也有独立兼容矩阵，例如 torchvision、torchaudio 或 torchtext 不能只看名字相近就随意混装。自定义 CUDA/C++ 扩展通常要针对目标 ABI、编译器和运行时重新构建与测试。

PyTorch 2.13 还移除了 named tensors 和 Bazel 构建支持，源码/扩展构建要求 C++20；依赖实验 API 或自定义 C++/CUDA 算子的项目必须逐项迁移。ROCm 7.2 Wheel 在无 GPU 环境执行 CPU `torch.compile` 还有已登记的向量 ISA 检测回归：无 GPU 主机应使用普通 CPU/CUDA 构建，不能把 ROCm Wheel 当通用 CPU 包。

### 发布顺序

```text
离线回归
  -> 影子流量 shadow
  -> 1% canary
  -> 10% canary
  -> 50% canary
  -> 全量
```

- Shadow：复制真实请求给新版本，但不让结果影响业务。
- Canary：少量真实流量使用新版本，并与稳定版本对比。

每一阶段设置自动停止条件：错误率、p99、OOM、输入拒绝率、预测分布、真实误报/漏报或业务动作失败率超过阈值就停止放量。

### 回滚不是只换权重

要一起回滚：

- 运行时镜像和自定义算子。
- 模型权重或导出图。
- 前后处理和特征 schema。
- 归一化统计量、字段顺序和单位。
- 阈值、策略、路由和缓存。

回滚后用固定请求验证实际响应中的版本，再观察缓存、队列和旧实例是否排空。控制面显示“已切换”不等于所有请求已经使用旧模型。

## 常见故障库

### 安装时报 `No matching distribution found`

证据：Python 版本、系统/CPU 架构、pip 版本、索引 URL、代理日志和 `pip debug --verbose`。

判断：包索引是否真的提供当前 Python/平台的 Wheel。不要关闭 TLS 校验来“修复”网络问题，也不要把别的平台 Wheel 改名强装。

### `torch.cuda.is_available()` 是 `False`

分层检查：

1. 当前安装的是 CPU 还是 CUDA Wheel：看 `torch.__version__`、`torch.version.cuda`。
2. 操作系统是否识别 NVIDIA GPU：看 `nvidia-smi`。
3. 驱动是否符合当前官方安装选择要求。
4. 容器是否获得 GPU 设备和正确 runtime。
5. 当前进程是否被 `CUDA_VISIBLE_DEVICES` 等配置隐藏设备。

不要因为一个 `False` 就同时重装 Python、驱动、CUDA Toolkit 和系统；每次只验证一层假设。

### `Expected all tensors to be on the same device`

打印输入、标签、参数和 Buffer 的 `.device`。常见原因是模型在 GPU、标签仍在 CPU，或新建 Tensor 默认落在 CPU。修复是统一明确的 device policy，不是在每个报错处盲目 `.cuda()`。

### dtype 不匹配

`Long`、`Float` 或 `Half` 报错时同时检查数据和 loss 契约：分类索引标签常需要 `torch.long`，二元 BCE 标签通常用浮点；Embedding 输入需要整数索引。不要只为消除错误把所有内容都转成 float。

### shape 不匹配

把每层输入输出 shape 写在错误旁。特别检查 batch 维、类别维、序列维和是否错误使用 `squeeze()`。无参数 `squeeze()` 在 batch size 为 1 时可能把 batch 维一起删除。

### `Trying to backward through the graph a second time`

常见原因是保存并复用带图 Tensor，或对同一计算图反向两次。多数场景应重新做 forward 或对仅用于日志的值使用 `.detach()`/`.item()`。`retain_graph=True` 会保留图并增加内存，只在算法确实需要时使用。

### loss 不下降

逐项验证：

- 数据和标签能否被简单规则区分。
- 参数是否 `requires_grad=True` 且进入 optimizer。
- `backward()` 后梯度是否非空、有限。
- 是否执行 `optimizer.step()`。
- 学习率是否过大或过小。
- loss、输出层和标签契约是否匹配。
- train/eval 模式是否正确。

先让一个很小 batch 过拟合，是区分代码链路与数据泛化问题的实用方法。

### loss 或梯度变成 NaN/Inf

沿路径查第一个坏值：输入 → 中间激活 → loss → 梯度 → 参数。检查除零、log/sqrt 域、异常大输入、学习率、低精度下溢/上溢和自定义算子。高风险链路应拒绝本次更新并保存可复现 batch，而不是继续把坏参数保存成“最新 checkpoint”。

### CUDA OOM

记录失败 batch 的 shape 和 `memory_summary`；减小 batch/sequence length 验证容量边界；查是否长期保存计算图；再评估 AMP、梯度累积、activation checkpointing 或分片。不要把 `empty_cache()` 当作唯一方案。

### DataLoader 卡住或吞吐很低

先用 `num_workers=0` 复现；检查单样本读取、损坏文件、远程存储、worker 异常、共享内存、Windows main guard 和自定义 `collate_fn`。比较取数据时间与模型 step time，避免只增加 worker 导致磁盘争用。

### 验证结果每次变化或线上与离线不同

检查 `model.eval()`、`inference_mode()`、随机增强、数据顺序、归一化、字段单位、阈值、框架/硬件版本和非确定性算子。对同一个 golden input 同时记录输入 hash、模型版本和原始 logits。

### `torch.compile` 频繁重编译或更慢

开启 `TORCH_LOGS="graph_breaks,recompiles"`，比较 shape/dtype/控制流；把冷启动与稳态分开；确认模型计算量足以覆盖编译和调度开销。保留一键回到 eager 的配置开关。

### DDP 挂起

收集所有 rank 的最后日志和堆栈，确认 collective 顺序一致，找第一个退出或落后的 rank，检查网络与 rendezvous。不要只给一个 rank 延长超时，这可能只是把真正的错误藏得更久。

### Checkpoint 加载失败

核对文件 hash、大小、写入完成标记、PyTorch/代码版本和 state keys。用明确的 `map_location`；先在隔离环境加载；对 missing/unexpected keys 做审计；如果文件半写入，恢复上一份已验证 checkpoint。

### 模型部署成功但结果没有变化

响应中返回 model version；查询实例实际加载状态；用 golden input 比较新旧输出；检查流量路由、缓存、队列和旧副本是否仍接收请求。发布系统的成功状态不能替代数据面验证。

## 生产设计题：每天 5 亿指标如何做故障风险评分

### 需求

- 每天约 5 亿个指标点。
- 每分钟为 2 万个服务生成一次风险结果。
- 标签可能在事故结束后几小时才确认。
- 在线 p95 小于 200 毫秒。
- 新模型可灰度并在数分钟内回滚。
- 高风险建议可能触发自动化，因此要有安全闸门。

### 设计答案

1. 原始指标进入消息流和时序/湖仓存储，在线服务不直接扫描全量历史。
2. 流处理按服务和窗口生成特征，输出事件时间、schema version 和数据质量标记。
3. 离线训练复用版本化特征定义，按时间和故障事件切分，避免泄漏。
4. 先用规则和 scikit-learn 做可解释基线，再证明 PyTorch 深度模型有实际增益。
5. 训练平台记录数据、代码、配置、环境、指标和 checkpoint；失败按明确 RPO/RTO 恢复。
6. 模型、预处理、字段单位、阈值、运行时和 hash 组成不可拆的发布单元。
7. 在线特征服务做新鲜度、范围和有限值校验，坏数据回退到规则或人工。
8. 推理服务多副本部署，经过容量测试设置队列、batch、并发、超时和资源限制。
9. 新版本依次离线、shadow、canary；响应、日志和 trace 带模型与特征版本。
10. 策略层结合拓扑、维护窗口、规则和影响范围，再决定是否进入 Runbook。
11. 同时监控技术健康、输入/输出漂移和延迟到达的真实质量。
12. 保留上一稳定发布单元和明确路由开关，回滚后用 golden request 验证数据面。

### 追问：单机还是 DDP/FSDP2

先做模型和数据基准。如果模型能放入单卡、训练周期满足要求，单卡复杂度最低；需要更高数据吞吐再用 DDP；只有状态放不进单卡才用 FSDP2；单层仍过大再评估 TP。用峰值显存、step time、通信占比、checkpoint/恢复时间来证明选择，而不是以 GPU 数量决定架构。

### 追问：如何保证离线在线一致

- 同一份版本化特征转换和字段契约。
- 训练统计量随模型制品发布。
- golden inputs 比较离线和在线 logits。
- 响应返回 model/feature/runtime version。
- 对一批影子流量做逐请求差异分析。
- 模型、阈值和特征变更一起审批、灰度和回滚。

## 事故题：新模型上线后自动扩容建议暴涨 8 倍

### 第一步：先止损

- 暂停继续放量，关闭新版本触发自动动作的权限。
- 路由切回上一稳定发布单元或规则链路。
- 保留新版本实例、日志、trace、输入统计和模型 hash 供取证。
- 对已经发出的动作做影响范围和 post-check，不贸然执行相反动作。

### 第二步：建立可验证假设

1. `error_ratio` 从比例变成百分数，数值放大 100 倍。
2. 字段顺序或归一化统计量错配。
3. 阈值从 `0.8` 误配置为 `0.08`。
4. 输入流量真实发生变化，例如重大促销或采集器升级。
5. 新运行时、AMP、compile 或导出图造成超过容忍度的数值差异。
6. 数据面实际加载了错误模型，或部分旧/新副本流量比例异常。

### 第三步：收集证据并验证

- 取同一时间窗口、同一服务的一批脱敏请求，对旧/新版本回放。
- 比较字段名、顺序、单位、分位数、NaN/拒绝率和 feature version。
- 比较 eager、导出/编译路径的原始 logits，而不是只看阈值后的布尔值。
- 核对响应版本、制品 hash、路由和各副本流量。
- 对照变更记录、采集器版本和真实资源使用，判断是否确有业务变化。

### 第四步：修复和安全恢复

若是字段或单位错误，修复特征契约并增加兼容门禁；若是模型质量问题，保持旧模型并重新训练评估；若是运行时数值变化，回退 eager/旧运行时并补 golden tolerance。所有修复重新走 shadow 和 canary，不通过简单调高阈值来掩盖根因。

### 第五步：复盘改进

- schema 和单位兼容测试。
- 模型、特征、阈值、运行时联合版本。
- golden request 与输出差异门禁。
- 预测分布和动作量 canary 自动停止。
- 高风险动作审批、限次、幂等和回滚演练。
- 数据面版本探针，而不是只信发布控制面。

## PyTorch 与相邻技术怎么选

| 场景 | 建议起点 | 原因与边界 |
|---|---|---|
| 小型表格异常检测、需要解释 | scikit-learn | 基线快、传统模型丰富，先证明深度学习收益 |
| 动态研究、深度学习、大模型生态 | PyTorch | Eager 调试直接，训练和分布式能力丰富 |
| Keras 工作流和既有 TensorFlow 平台 | TensorFlow | 团队能力和现有交付链往往比框架偏好更重要 |
| 只调用现成模型 API | 不一定需要自己训练 PyTorch | 先解决服务、成本、隐私和可靠性问题 |
| 本地运行已量化大模型 | Ollama 等推理服务 | 面向模型拉取和服务化，不等于通用训练框架 |
| 注意力架构原理 | Transformer | Transformer 是模型架构，PyTorch 是实现它的框架之一 |

选型应基于模型效果、团队能力、目标硬件、部署运行时、算子生态、调试、容量、升级和总拥有成本，而不是“哪个框架更热门”。

## 面试速答与渐进追问

### 30 秒回答：PyTorch 是什么

PyTorch 是以 Tensor 为核心的机器学习和张量计算框架。`nn.Module` 组织模型，Autograd 根据动态计算图求梯度，optimizer 更新参数，Dataset/DataLoader 提供数据，CPU/CUDA/MPS 等后端负责执行。它还提供编译、性能分析、分布式训练、模型保存和导出能力，但生产服务、数据契约、灰度和安全仍要由完整平台补齐。

### 3 分钟回答：一次训练发生了什么

1. 按时间和事件切分 train、validation、test，只在 train 拟合预处理统计量。
2. Dataset 定义样本，DataLoader 负责 sampler、batch 和并行读取。
3. 模型前向把输入 Tensor 计算成 logits。
4. loss 衡量 logits 与标签差距。
5. Autograd 从 loss 反向计算每个参数梯度。
6. optimizer 根据梯度更新参数，下一 step 前清掉旧梯度。
7. validation 使用 `eval()` 和 `inference_mode()`，不更新参数。
8. 固定方案后在独立 test 上评估，并按业务成本选择阈值。
9. 保存 `state_dict`、模型代码、预处理、字段、阈值、环境和数据版本。
10. 部署前做重载、golden input、容量、安全、shadow、canary 和回滚验证。

### 追问 1：Autograd 如何工作

前向时记录由 Tensor 操作组成的动态计算图和反向规则；对标量 loss 调用 `backward()` 后，链式法则把梯度传播到需要梯度的叶子参数，结果累加在 `.grad`。无梯度推理应使用 `inference_mode()`，非叶子 Tensor 要保留梯度需显式处理。

### 追问 2：为什么梯度默认累加

它支持多个 micro-batch 或多个 loss 的梯度相加，但普通训练若忘记 `zero_grad` 会把历史梯度意外带入。梯度累积必须有明确的累计步数、loss 缩放和 DDP 同步策略。

### 追问 3：`train()`、`eval()` 和 `no_grad()` 有何区别

`train/eval` 改变 Dropout、BatchNorm 等模块行为；`no_grad/inference_mode` 控制是否记录自动求导。推理通常需要 `eval()` 加 `inference_mode()`，两者不能互相替代。

### 追问 4：DDP 为什么参数能保持一致

每个 rank 有完整模型副本，在 backward 中对参数梯度做 all-reduce 聚合，随后各 rank 用相同梯度和优化器状态更新。初始化、数据分片、collective 顺序、global batch 和指标聚合仍需正确设计。

### 追问 5：DDP 和 FSDP2 怎么选

模型能放单卡而要扩吞吐，用 DDP；参数、梯度和优化器状态放不下单卡，用 FSDP2 分片。FSDP2 降低状态内存但增加 all-gather/reduce-scatter、分片边界和 checkpoint 复杂度，必须用容量与通信数据证明收益。

### 追问 6：怎样排查 GPU 利用率低

用 Profiler 把 DataLoader、主机到设备复制、GPU kernel 和通信分开；再看 batch、算子规模、存储、CPU、网络和慢 rank。若 GPU 等数据就优化输入，若小算子调度多再评估 compile，若通信占比高则调整 batch、分片或拓扑。

### 追问 7：`state_dict` 和完整 checkpoint 有何区别

模型 `state_dict` 主要保存参数和 Buffer，适合权重交付；可恢复训练的 checkpoint 还应包含 optimizer、scheduler、scaler、step、随机状态、数据版本和代码配置。文件存在不代表完整，必须验证加载和真实恢复。

### 追问 8：`torch.compile` 为什么会重编译

捕获图时建立的 shape、dtype 或 Python 状态 guard 失效会触发新图；动态控制流和不支持操作会 graph break。用 `TORCH_LOGS` 看重编译和断点，把冷启动与稳态分开，并保留 eager 回滚路径。

### 追问 9：怎样保证训练和线上结果一致

版本化同源预处理；把字段、单位、统计量和阈值随模型发布；用 golden input 比较 eager、导出和在线 logits；响应携带版本；影子流量逐请求对比；框架和硬件升级做误差与性能回归。

### 追问 10：模型如何安全触发自动修复

模型只提供风险证据。策略层结合规则、拓扑、维护窗口、置信度和影响范围，高风险操作需要审批。Runbook 要幂等、限次、可停止、可回滚，并用 post-check 验证效果；输入坏值或模型异常时回退到规则/人工。

## 学习检查清单

- [ ] 能解释 Tensor 的 shape、dtype、device、stride 和 storage。
- [ ] 能解释 Autograd 图、叶子参数、梯度累加和 `detach`。
- [ ] 能区分 Module、Parameter、Buffer 和 `state_dict`。
- [ ] 能写出 forward、loss、backward、step 的训练循环。
- [ ] 能区分 `train/eval` 与 `no_grad/inference_mode`。
- [ ] 能解释 Dataset、Sampler、DataLoader 和 Windows worker 陷阱。
- [ ] 能创建隔离 CPU 环境并收集环境证据。
- [ ] 能跑通基础分类实验、保存、重载并核对输出。
- [ ] 能完成 NaN 故障注入、拒绝、回放和复盘。
- [ ] 能解释随机 seed 为什么不保证跨平台位级复现。
- [ ] 能解释 AMP、GradScaler 和数值风险。
- [ ] 能用 graph break、guard 和 recompile 解释 `torch.compile`。
- [ ] 能按数据、计算、通信拆解性能瓶颈。
- [ ] 能解释显存组成、allocated/reserved 和 OOM 证据链。
- [ ] 能解释 DDP 的进程、sampler、all-reduce 和 global batch。
- [ ] 能说明 FSDP2 的分片收益与通信/checkpoint 代价。
- [ ] 能设计训练 checkpoint、RPO、RTO 和恢复演练。
- [ ] 能定义模型制品、服务观测、灰度和联合回滚。
- [ ] 能说明不可信权重、Pickle、自定义代码和平台权限边界。
- [ ] 能回答生产设计题和完整事故处置题。

## GitHub 学习证据

建议建立：

```text
pytorch-aiops-lab/
  ├── README.md
  ├── requirements.txt
  ├── train.py
  ├── predict.py
  ├── fault_injection.py
  ├── tests/
  │   ├── test_input_contract.py
  │   └── test_model_reload.py
  ├── artifacts/
  │   └── metadata.example.json
  ├── benchmark/
  │   └── cpu-result.md
  └── incident-notes/
      └── nan-input-drill.md
```

`requirements.txt` 至少固定：

```text
numpy==2.5.2
torch==2.13.0
```

若使用官方专用 Wheel 索引，把安装命令写在 README，不要让读者误以为包版本能表达全部 CUDA 平台选择。生产项目应进一步使用锁文件、hash、固定镜像和 SBOM。

README 至少记录：

- Python、PyTorch、操作系统和 CPU/GPU 证据。
- 字段、顺序、单位、标签和数据拆分。
- 模型、loss、optimizer、batch、seed 和训练命令。
- test 指标、混淆矩阵和实验限制。
- 保存/重载输出差异。
- NaN 注入、拒绝、回放和清理记录。
- 未验证的 GPU、分布式、性能和生产化边界。

不要提交真实监控明细、用户数据、内部主机/服务名、访问令牌、私有模型权重或巨大的 checkpoint。大文件放受控模型仓库或对象存储，Git 只保存版本、hash、评估和获取说明。

## 本文验证边界

本文的正式验收分开记录：

- 静态事实：以 PyTorch 官方文档、教程、release 和源码页面交叉核对。
- 基础实验：只在本文记录的 Windows、Python 与 CPU Wheel 环境运行。
- 故障实验：只验证 NaN 输入在模型前被拒绝并能以干净样本回放。
- 未验证：本文不声称在本机跑通 CUDA、MPS、ROCm、AMP、`torch.compile`、DDP、FSDP2、TP、PP、DCP 或生产推理集群。

真实生产环境仍要按目标硬件、驱动、数据、网络、存储、框架组合和安全要求重新压测、演练和审批。

## 下一步

1. 学 [机器学习](/tech-stack/data-ai/machine-learning)，补齐监督学习、评估、泄漏和特征工程。
2. 学 [scikit-learn](/tech-stack/data-ai/scikit-learn)，先建立可解释表格模型基线。
3. 学 [Transformer](/tech-stack/data-ai/transformer)，理解注意力、训练和 KV Cache，再回到 PyTorch 实现。
4. 学 [Ollama](/tech-stack/data-ai/ollama)，理解已经训练好的模型如何在本地被加载和服务化。
