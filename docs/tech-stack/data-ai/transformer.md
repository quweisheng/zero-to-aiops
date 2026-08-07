# Transformer 技术栈深讲

> 学习目标：从零理解 Transformer 如何把 Token 变成向量、通过注意力建立上下文关系，并完成训练和逐 Token 推理；能运行一个不依赖第三方库的注意力实验，能解释 Encoder、Decoder、Mask、KV Cache、长上下文与显存之间的关系，也能按证据排查输出泄漏、延迟上升、显存耗尽、Tokenizer 不一致和模型升级故障。

## 核验日期与学习边界

本文在 2026 年 8 月 7 日核验。版本锚点是 PyTorch 2.13.0，以及 Hugging Face Transformers 5.14.0 稳定文档；研究日 Transformers 最新代码补丁版为 5.14.1。稳定原理来自原始论文，具体 API 行为绑定这些版本，后续版本必须重新核对。

先把边界说清楚：

- Transformer 是一种神经网络架构，不是一个可以单独启动的服务，也不是某个厂商的产品。
- 2017 年论文中的 Transformer 是用于序列到序列任务的 Encoder-Decoder 架构；今天常见的 BERT、GPT、T5 和大量多模态模型是在这条主线上做出的不同取舍，不能把所有现代模型细节都说成原始论文设计。
- Tokenizer、训练数据、损失函数、采样策略、推理服务、RAG 和 Agent 不属于注意力公式本身，但它们共同决定最终系统是否可用。
- PyTorch 和 Hugging Face Transformers 的 API 会持续演进。复制示例前要确认自己的库版本、模型配置和硬件后端，不要把“stable 文档”理解成永久不变的接口。
- 本文以理解机制和 AIOps 工程为主，不覆盖所有视觉、语音、扩散模型、稀疏专家模型和长上下文论文。
- 文中的容量公式用于估算和提出假设，不替代目标模型、目标硬件、真实请求分布下的压测。

## 官方资料

- [Attention Is All You Need 原始论文](https://arxiv.org/abs/1706.03762)
- [PyTorch 2.13.0 Release](https://github.com/pytorch/pytorch/releases/tag/v2.13.0)
- [PyTorch `nn.Transformer`](https://docs.pytorch.org/docs/stable/generated/torch.nn.Transformer.html)
- [PyTorch `nn.MultiheadAttention`](https://docs.pytorch.org/docs/stable/generated/torch.nn.MultiheadAttention.html)
- [PyTorch Scaled Dot Product Attention](https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html)
- [PyTorch Transformer Building Blocks 教程](https://docs.pytorch.org/tutorials/intermediate/transformer_building_blocks.html)
- [PyTorch Profiler](https://docs.pytorch.org/docs/stable/profiler.html)
- [PyTorch Fully Sharded Data Parallel](https://docs.pytorch.org/docs/stable/fsdp.html)
- [Hugging Face Transformers 文档](https://huggingface.co/docs/transformers/index)
- [Hugging Face Transformers 5.14.1 Release](https://github.com/huggingface/transformers/releases/tag/v5.14.1)
- [Hugging Face Auto Classes](https://huggingface.co/docs/transformers/model_doc/auto)
- [Hugging Face Generation](https://huggingface.co/docs/transformers/main_classes/text_generation)
- [Hugging Face Caching](https://huggingface.co/docs/transformers/cache_explanation)
- [Hugging Face Cache Strategies](https://huggingface.co/docs/transformers/kv_cache)
- [Hugging Face Quantization](https://huggingface.co/docs/transformers/quantization/overview)
- [Hugging Face Transformers 安全策略](https://github.com/huggingface/transformers/security/policy)
- [Safetensors 文档](https://huggingface.co/docs/safetensors/index)

说明：本文按原始论文、PyTorch 官方 API 和 Hugging Face 官方工程文档重新组织知识，不复制或逐段翻译官方内容。论文事实、具体库行为和生产工程建议会分开表达。

## 官方知识地图

Transformer 的资料不是一本线性手册，可以拆成六条线：

```text
原始架构
  -> Embedding 与位置
  -> Scaled Dot-Product Attention
  -> Multi-Head Attention
  -> Feed-Forward / Residual / LayerNorm
  -> Encoder / Decoder / Cross-Attention

训练
  -> Tokenizer 与数据
  -> 目标函数
  -> 反向传播与优化器
  -> 混合精度与分布式训练
  -> Checkpoint 与评估

推理
  -> Prefill
  -> Autoregressive Decode
  -> KV Cache
  -> Batching / Sampling
  -> Quantization / Serving

生产工程
  -> 容量与延迟
  -> 高可用与调度
  -> 安全与供应链
  -> 可观测性
  -> 灰度、升级与回滚

AIOps
  -> 日志与告警分类
  -> 事件摘要
  -> 根因候选排序
  -> Runbook 检索与解释
  -> 受控自动化
```

本文按“输入怎样进入模型、模型怎样计算、服务怎样运行、故障怎样取证”的顺序讲，不要求读者预先懂线性代数或深度学习框架。

## 建议学习路线

### 第一天：能看懂一次前向计算

1. 分清 Token、Token ID、Embedding 和位置表示。
2. 知道 Q、K、V 分别在做什么。
3. 看懂缩放点积注意力公式。
4. 理解 Padding Mask 与 Causal Mask 不同。
5. 跑通本文的纯 Python 注意力实验。

### 第一周：能解释模型家族与推理路径

1. 分清 Encoder-only、Decoder-only 和 Encoder-Decoder。
2. 理解多头注意力、前馈网络、残差和归一化。
3. 画出 Prefill、逐 Token Decode 和 KV Cache 路径。
4. 会看 Tensor shape、dtype、显存、TTFT 和 TPOT。
5. 能定位 Mask、Tokenizer、长度和采样配置问题。

### 生产与面试层：能做容量、变更和事故分析

1. 估算权重、激活、注意力矩阵和 KV Cache 的内存。
2. 解释数据并行、张量并行、流水线并行和量化取舍。
3. 设计多副本服务、过载保护、模型灰度与一致回滚。
4. 建立技术 SLO、质量评估和安全门禁。
5. 在事故中按请求、批次、模型版本和硬件证据验证假设。

## 场景开场：告警摘要很流畅，却漏掉了刚发生的变更

凌晨一点，数据库连接数告警触发。AIOps 助手收到过去两小时的告警、变更记录、日志片段和 Runbook，几秒钟后给出一段很流畅的摘要：

> 数据库连接池可能泄漏，建议扩容应用实例。

值班员却发现，输入的最后一段明明写着“00:53 刚完成数据库代理切换”。模型为什么没有把它列为首要证据？

继续看监控，又出现两个现象：

- 短输入首字延迟正常，长输入的首字延迟和显存快速上升。
- 同一个请求换到新模型版本后，输出不仅变了，连引用的日志顺序也不同。

这时不能只说“模型幻觉”。至少要拆开检查：

1. Tokenizer 是否截断了输入尾部。
2. Padding Mask 或 Causal Mask 是否写反。
3. 位置长度是否超出模型配置。
4. Prefill 是否被长上下文拖慢。
5. KV Cache 是否挤占了显存。
6. 新旧模型是否绑定了同一个 Tokenizer、模板和生成配置。
7. 检索、提示词和模型本身各自贡献了什么错误。

学习 Transformer 的价值，不是背一句“注意力机制”，而是能把这条黑盒链路拆成可观察、可验证、可回滚的工程系统。

## 一句话人话版

Transformer 会让序列中的每个位置按相关程度读取其他位置的信息，再经过多层变换得到可用于理解或生成的上下文表示。

## 小白最容易问的十个问题

### Transformer 是大模型吗

不完全是。Transformer 是架构；大语言模型通常是在这种架构或其变体上，用大量参数和数据训练出来的具体模型。

### Attention 就等于 Transformer 吗

不等于。注意力是核心计算，但完整 Transformer 还包含 Embedding、位置信息、多头投影、前馈网络、残差连接、归一化、Mask 和输出层。

### Token 是一个汉字或一个单词吗

不一定。Tokenizer 可能把文本切成字、子词、字节片段或特殊符号。Token 是模型词表里的离散单位，不等同于自然语言中的“词”。

### Q、K、V 是三份不同输入吗

通常不是。Self-Attention 中，它们往往由同一批隐藏状态乘三组不同权重得到；Cross-Attention 中，Q 和 K/V 才来自不同序列。

### 为什么需要位置编码

注意力计算本身只比较向量关系，不天然知道谁在前谁在后。位置表示把顺序信息注入模型。

### Multi-Head 是不是多跑几遍同样的 Attention

不是简单复制。每个头有自己的投影子空间，可以学习不同关系，最后把各头结果拼接并再次投影。

### Encoder 和 Decoder 有什么区别

Encoder 通常可以同时看完整输入，适合理解和分类；自回归 Decoder 用因果遮罩避免看到未来 Token，适合逐步生成。

### KV Cache 会不会让答案更准确

它主要减少重复计算、改善生成速度，不保证答案质量。错误的位置、Mask 或缓存复用反而会污染结果。

### 上下文越长越好吗

不一定。更长会增加计算、显存和噪声，还可能触发截断、检索稀释和“关键信息被忽略”。要用评估证明长度带来了收益。

### Transformer 能自动完成运维变更吗

模型可以归纳证据和生成建议，但生产写操作仍需要权限边界、参数校验、审批、幂等、审计、结果验证和回滚。

## 为什么 AIOps 工程师要学 Transformer

Transformer 位于 AIOps 智能分析链路的模型层：

- Encoder 可以把日志、告警和工单表示成向量或类别。
- Decoder 可以生成事件摘要、排障假设和沟通草稿。
- Encoder-Decoder 可以做结构化转换和摘要。
- 多模态变体可以联合处理文本、图像、音频或时序输入。
- Embedding 模型可以支持相似事故检索和 RAG。

但 AIOps 工程师更需要理解它的失败边界：

- 输入被截断，模型可能根本没有看到关键证据。
- 模型生成是概率过程，HTTP 200 不等于内容正确。
- 长上下文会把瓶颈推向 Prefill、注意力计算和显存。
- 自动批处理提高吞吐，却可能拉高单请求等待时间。
- 新模型、Tokenizer、提示模板和推理引擎必须作为一个版本化整体发布。

所以学习目标不是训练一个“万能模型”，而是能判断问题在数据、模型、运行时还是业务控制面。

## Transformer 到底是什么

Transformer 是处理序列或集合数据的神经网络架构。它通过注意力让每个位置聚合其他位置的信息，再用前馈网络逐位置变换表示。

原始论文用于机器翻译，采用 Encoder-Decoder：

```text
源语言 Token
  -> Embedding + Position
  -> Encoder 层重复 N 次
  -> 上下文表示
                         \
目标语言历史 Token       -> Decoder Cross-Attention
  -> Embedding + Position /
  -> Masked Self-Attention
  -> Feed-Forward
  -> Linear + Softmax
  -> 下一个 Token 概率
```

现代常见家族：

| 家族 | 典型注意力可见范围 | 常见任务 | 关键边界 |
|---|---|---|---|
| Encoder-only | 通常双向看输入 | 分类、标注、向量表示 | 不天然做开放式逐 Token 生成 |
| Decoder-only | 只能看当前位置及以前 | 文本生成、聊天、代码生成 | 逐 Token 解码，KV Cache 很重要 |
| Encoder-Decoder | Encoder 看输入，Decoder 看历史并读取 Encoder | 翻译、摘要、结构化转换 | 同时有 Self-Attention 与 Cross-Attention |

这些是架构方向，不是严格的产品标签。具体模型可能加入稀疏注意力、旋转位置、分组查询注意力、专家层或多模态适配器。

## 它解决什么问题

### 长距离依赖难学

序列前后很远的信息需要建立关系。注意力允许两个位置通过一次权重计算直接交互，而不必像传统循环结构那样逐步传递状态。

### 训练并行度受限

循环神经网络按时间步依次计算。Transformer 训练时可以并行处理序列中的多个位置，更适合矩阵加速硬件。

### 表示需要随上下文变化

同一个 Token 在不同上下文中含义不同。Self-Attention 根据整段输入动态形成上下文表示。

### 一个模型需要处理不同关系

多头注意力允许不同投影子空间关注不同模式，例如相邻关系、实体关系、否定词或跨段引用。

Transformer 没有自动解决这些问题：

- 数据偏差和标签错误。
- 事实时效性。
- 权限与执行安全。
- 幻觉与不确定性。
- 生产容量和成本。

## 核心原理总览

一层 Transformer 可以先理解成：

```text
输入隐藏状态 X
  -> 线性投影得到 Q、K、V
  -> Attention 计算“该读谁、读多少”
  -> 多头结果拼接和投影
  -> 残差 + 归一化
  -> Feed-Forward 逐位置变换
  -> 残差 + 归一化
  -> 下一层隐藏状态
```

缩放点积注意力常写成：

```text
Attention(Q, K, V) = softmax((Q K^T) / sqrt(d_k) + M) V
```

其中：

- `Q` 是 Query，表示当前位置正在寻找什么。
- `K` 是 Key，表示每个位置能被怎样匹配。
- `V` 是 Value，表示匹配后实际读取的内容。
- `d_k` 是每个头的 Key 维度。
- `M` 是 Mask，加到分数上，用于屏蔽 Padding 或未来位置。
- `softmax` 把一行分数变成和为 1 的权重。

下面按“五件套”拆每个核心概念。

## 核心概念一：Token、Token ID 与 Tokenizer

### 是什么

Tokenizer 把原始文本转换为 Token，再把 Token 映射成整数 ID。Transformer 接收的是 ID 或由 ID 查出的向量，不直接接收人类看到的字符串。

### 为什么需要

神经网络只能处理数值。词表把开放文本映射到有限离散空间，特殊 Token 还承担开始、结束、填充和未知字符等协议作用。

### 怎么工作

```text
"数据库连接告警"
  -> Tokenizer 切分
  -> ["数据库", "连接", "告警"]  # 仅为示意，真实切分由词表决定
  -> [1842, 907, 331]
  -> Embedding Lookup
  -> 三个 d_model 维向量
```

### 怎么用或观察

使用模型时要一起加载匹配的 Tokenizer，记录：

- 词表版本与哈希。
- 特殊 Token ID。
- 截断方向和最大长度。
- Padding 方向。
- 聊天模板。

观察输入不能只看字符数，要看最终 `input_ids` 长度和截断结果。

### 坏了怎么查

输出异常时先比较新旧版本的：

1. 同一文本的 Token ID。
2. 序列长度和被截断部分。
3. `bos`、`eos`、`pad` 等特殊 ID。
4. Chat Template 展开后的完整文本。
5. 模型配置中的词表大小。

Tokenizer 与模型权重不匹配，轻则质量下降，重则出现索引越界或特殊 Token 语义错乱。

## 核心概念二：Embedding 与位置信息

### 是什么

Embedding 是把 Token ID 映射为稠密向量的可训练表。位置表示告诉模型一个 Token 位于序列哪里。

### 为什么需要

ID `331` 的数值大小没有语义，Embedding 才把它放进可学习的向量空间。纯 Attention 对输入排列本身不敏感，位置表示补上顺序。

### 怎么工作

原始论文把 Token Embedding 与正弦/余弦位置编码相加。现代模型还常见可学习绝对位置、相对位置和旋转位置等变体。

```text
Token ID
  -> Token Embedding ---------+
                              + -> 初始隐藏状态 X
Position 0..S-1 -> Position --+
```

### 怎么用或观察

重点看模型配置里的：

- `vocab_size`：词表大小。
- `hidden_size` 或 `d_model`：隐藏向量宽度。
- `max_position_embeddings`：配置支持的位置范围之一。
- 位置编码类型及缩放配置。

### 坏了怎么查

- 长文本越界：先看 Token 长度是否超过模型和运行时共同支持的范围。
- 新模型长上下文质量差：检查位置缩放是否与训练方式一致。
- 相同权重升级后输出漂移：核对位置配置和运行时实现是否改变。
- Padding 方向变化：检查位置 ID 是否仍正确生成。

## 核心概念三：Query、Key、Value 与缩放点积注意力

### 是什么

Q、K、V 是输入隐藏状态经过三组线性投影得到的张量。Q 与 K 计算相关性，相关性权重再对 V 做加权求和。

### 为什么需要

模型需要针对“当前位置的问题”动态读取上下文，而不是把每个邻居固定权重平均。

### 怎么工作

以一行 Query 为例：

1. 用 `q · k` 计算它与每个 Key 的点积。
2. 除以 `sqrt(d_k)`，避免维度大时分数过大、Softmax 过于尖锐。
3. 加上 Mask，让非法位置接近负无穷。
4. Softmax 得到权重。
5. 用权重加权所有 Value。

Shape 主线：

```text
Q: [B, H, S_q, D]
K: [B, H, S_k, D]
V: [B, H, S_k, D_v]

Q K^T
  -> [B, H, S_q, S_k]
softmax 后乘 V
  -> [B, H, S_q, D_v]
```

`B` 是 Batch，`H` 是头数，`S` 是序列长度，`D` 是每个头的维度。

### 怎么用或观察

在代码和 Profiler 中观察：

- 输入 Shape 是否符合 API 的 Batch/Sequence 顺序。
- dtype 是 `float32`、`float16` 还是 `bfloat16`。
- 是否进入优化过的 Scaled Dot Product Attention Kernel。
- Mask Shape 能否广播到注意力分数。
- 输出和注意力权重是否出现 NaN。
- `dropout_p` 在推理路径是否显式为 0。
- 实际使用的是 Math、Memory-Efficient 还是 FlashAttention 后端，以及是否发生回退。

### 坏了怎么查

- Shape 报错：把 Q、K、V 和 Mask Shape 全部打印出来，不要只看最终异常。
- 输出几乎相同：检查投影权重、输入是否全零或 Mask 是否只留下一个位置。
- 权重出现 NaN：检查输入数值、混合精度溢出、Mask 是否产生全负无穷行。
- 显存暴涨：确认是否显式保留完整注意力权重，是否可以使用融合内核。
- `eval()` 后结果仍随机：若直接调用 PyTorch SDPA，检查是否仍传入大于 0 的 `dropout_p`。
- 换后端后末位小数不同：先用容差和任务指标判断；浮点运算顺序不同，不保证跨后端位级一致。

## 核心概念四：Mask

### 是什么

Mask 是注意力的可见性规则。常见的两类是 Padding Mask 和 Causal Mask。

### 为什么需要

- Padding Mask 防止模型把补齐长度用的空位置当成有效内容。
- Causal Mask 防止自回归训练或生成时读取未来答案。

### 怎么工作

```text
Causal Mask（✓ 可看，× 不可看）

            K0  K1  K2  K3
Query 0     ✓   ×   ×   ×
Query 1     ✓   ✓   ×   ×
Query 2     ✓   ✓   ✓   ×
Query 3     ✓   ✓   ✓   ✓
```

实现通常把不可见位置的分数加上负无穷，使 Softmax 后权重变成 0。

### 怎么用或观察

必须查当前 API 文档。以 PyTorch 2.13.0 为例，三个相邻 API 的布尔语义并不统一：

| API | 布尔值 `True` 的含义 | 迁移风险 |
|---|---|---|
| `F.scaled_dot_product_attention(attn_mask=...)` | 允许该位置参与注意力 | 直接复用 MHA 的 Mask 可能把可见性翻转 |
| `nn.MultiheadAttention` 的 `attn_mask` / `key_padding_mask` | 屏蔽或忽略该位置 | 与 SDPA 相反 |
| `nn.Transformer` 的布尔 Mask | 不允许该位置参与 | 错误的 Causal Hint 还可能造成错误执行 |

不能凭变量名猜，也不能只看 Shape 正确就认为逻辑正确。

验证方法：用 3 到 4 个 Token 的小矩阵打印权重；改变未来位置的 Value，较早位置的 Causal 输出必须不变；改变 Padding 位置的 Value，有效位置的输出也应不变。

### 坏了怎么查

- 训练指标异常好、线上生成很差：怀疑未来信息泄漏。
- Batch 中短样本质量差：检查 Padding Mask。
- 第一行全 NaN：检查是否把所有 Key 都屏蔽了。
- 换 API 后结果翻转：核对布尔语义、Shape、dtype 与广播方向。

Mask 错误常常不会报错，只会产生看似合理的错误结果，所以必须写断言和最小测试。

## 核心概念五：Multi-Head Attention

### 是什么

多头注意力把隐藏维度分成多个头，每个头用独立投影计算注意力，再拼接回完整表示。

### 为什么需要

单个相关性空间很难同时表达邻近、实体、时间、否定和跨段引用等关系。多个头提供不同表示子空间。

### 怎么工作

```text
X
  -> Head 1: Q1 K1 V1 -> Attention 1 --+
  -> Head 2: Q2 K2 V2 -> Attention 2 --+ -> Concat -> Output Projection
  -> ...                                |
  -> Head H: QH KH VH -> Attention H ---+
```

通常要求 `d_model` 能被 `num_heads` 整除，每个头维度约为 `d_model / num_heads`。

### 怎么用或观察

配置时一起看：

- `hidden_size` / `d_model`。
- `num_attention_heads`。
- `num_key_value_heads`，现代模型可能使用 Multi-Query 或 Grouped-Query Attention 减少 KV Cache。
- `head_dim`。

### 坏了怎么查

- 初始化报整除错误：检查隐藏维度和头数。
- 权重能加载但输出异常：检查模型配置与权重结构是否一致。
- KV Cache 比预期小或大：确认 K/V 头数，不要默认等于 Query 头数。
- 性能没有改善：确认运行时是否支持该头布局的融合内核。

## 核心概念六：Feed-Forward Network

### 是什么

Feed-Forward Network（FFN，前馈网络）对每个位置独立应用相同的非线性变换，通常先扩宽维度，再压回隐藏维度。

### 为什么需要

Attention 负责位置之间交换信息，FFN 负责对每个位置的表示做更强的特征变换。只有注意力而没有非线性前馈层，表达能力不足。

### 怎么工作

原始形式可以写成：

```text
FFN(x) = activation(x W1 + b1) W2 + b2
```

现代模型可能使用 GELU、SwiGLU 或门控变体，`intermediate_size` 往往大于隐藏维度。

### 怎么用或观察

看配置中的激活函数、`intermediate_size`、是否使用门控，以及 Profiler 中矩阵乘的耗时。

### 坏了怎么查

- 加载时报维度不一致：检查 FFN 类型和中间维度。
- 激活出现 Inf/NaN：看学习率、混合精度、输入范围和归一化。
- 推理延迟高：不要只盯 Attention，FFN 的参数量和计算量也可能占大头。

## 核心概念七：Residual、LayerNorm 与 Dropout

### 是什么

- Residual Connection（残差连接）把子层输入加回输出。
- Layer Normalization（层归一化）在特征维度稳定数值分布。
- Dropout 在训练时随机丢弃部分激活，帮助正则化。

### 为什么需要

深层网络需要稳定梯度和信息路径。残差允许信号绕过子层，归一化减少数值漂移，Dropout 降低过拟合风险。

### 怎么工作

原始 Transformer 使用 Add & Norm；很多现代模型采用 Pre-Norm，把归一化放到子层前。两者不能只换一行配置就假定权重兼容。

```text
Post-Norm 示意：LayerNorm(x + Sublayer(x))
Pre-Norm  示意：x + Sublayer(LayerNorm(x))
```

### 怎么用或观察

- 训练时确认模型处于 `train` 模式，Dropout 生效。
- 推理时使用 `eval` 模式，关闭 Dropout 等训练行为。
- 核对 `norm_first`、epsilon 和归一化类型。

### 坏了怎么查

- 相同输入推理结果反复抖动：检查是否忘记切 `eval`，也要区分采样随机性。
- 训练梯度爆炸或消失：看梯度范数、学习率、Norm 位置和混合精度。
- 权重迁移失败：确认 Pre-Norm/Post-Norm、LayerNorm/RMSNorm 与参数命名。

## 核心概念八：Encoder、Decoder 与 Cross-Attention

### 是什么

- Encoder 把输入序列编码为上下文表示。
- Decoder 根据已经可见的目标 Token 生成下一步表示。
- Cross-Attention 让 Decoder 的 Query 读取 Encoder 的 Key 和 Value。

### 为什么需要

理解任务和生成任务对可见范围的要求不同。翻译、摘要等输入输出分离的任务还需要把源序列信息传给目标序列。

### 怎么工作

```text
Encoder Self-Attention
  Q = Encoder Hidden
  K = Encoder Hidden
  V = Encoder Hidden

Decoder Masked Self-Attention
  Q/K/V = Decoder Hidden
  + Causal Mask

Decoder Cross-Attention
  Q = Decoder Hidden
  K/V = Encoder Output
```

### 怎么用或观察

根据任务选择架构，不要只比较参数量：

- 日志分类、实体抽取、向量表示：先看 Encoder 路线。
- 自由文本生成、聊天和代码：常见 Decoder-only 路线。
- 输入输出转换明确、需要完整编码源序列：评估 Encoder-Decoder。

### 坏了怎么查

- Decoder 训练泄漏未来：检查 Causal Mask 和标签移位。
- Cross-Attention Shape 不一致：检查源序列和目标序列的 Batch、隐藏维度与 Mask。
- 生成总是复制输入：检查任务数据、Decoder 输入和损失对齐。
- 模型类别选错：确认 Checkpoint 架构与 `AutoModelFor...` 任务头匹配。

## 核心概念九：训练目标与一次参数更新

### 是什么

训练通过目标函数衡量预测与目标的差距，再用反向传播计算梯度、由优化器更新参数。

### 为什么需要

Transformer 结构只定义怎样计算表示，不会凭空获得语言、日志或故障知识。能力来自数据、目标函数和优化过程。

### 怎么工作

以 Decoder-only 的下一 Token 训练为例：

```text
Token IDs
  -> 模型前向
  -> 每个位置的词表 Logits
  -> 与右移一位的真实 Token 计算 Cross-Entropy
  -> 反向传播
  -> 梯度裁剪 / 混合精度检查
  -> Optimizer Step
  -> 学习率调度
  -> 定期保存 Checkpoint 与评估
```

常见目标还有 Masked Language Modeling、序列到序列损失、分类损失和偏好优化。它们不是同一个训练协议。

### 怎么用或观察

至少记录：

- 训练与验证 Loss。
- 学习率。
- 梯度范数。
- 有效 Token 数和被忽略 Token 数。
- 每秒 Token 数。
- 数据、代码、Tokenizer、配置和 Checkpoint 版本。

### 坏了怎么查

- Loss 不降：先确认标签对齐、Mask、学习率和参数是否参与优化。
- Loss 突然 NaN：看输入、梯度、混合精度 Scale 和上一批次。
- 训练很好、验证很差：查数据泄漏、过拟合和训练/生产分布差异。
- 恢复训练后曲线跳变：确认优化器、调度器、随机状态和数据游标是否一起恢复。

## 核心概念十：自回归生成、Prefill 与 KV Cache

### 是什么

- Prefill 是一次处理完整输入 Prompt，建立每层上下文表示和 KV Cache。
- Decode 是每次生成一个或少量新 Token。
- KV Cache 保存此前 Token 在每个注意力层的 Key 和 Value，避免每一步重复计算。

### 为什么需要

自回归生成第 `t+1` 个 Token 时需要读取前 `t` 个 Token。如果每一步都重新计算全部历史 K/V，生成会非常浪费。

### 怎么工作

```text
Prompt: [t0, t1, ... t999]
  -> Prefill 一次
  -> 每层保存 K0..K999、V0..V999
  -> 得到第一个新 Token

新 Token t1000
  -> 只计算当前 Q/K/V
  -> Q1000 读取缓存 K0..K1000、V0..V1000
  -> 把 K1000/V1000 追加进 Cache
  -> 生成下一个 Token
```

### 怎么用或观察

Hugging Face Transformers 提供动态、静态、量化和可卸载等缓存策略。选择时要比较：

- 显存占用。
- 编译和固定 Shape 的需求。
- 长短请求混合时的浪费。
- CPU/GPU 搬运带来的延迟。
- 模型是否使用滑动窗口、分组查询或特殊 Cache。

### 坏了怎么查

- 长对话逐渐 OOM：检查每请求 KV Cache、并发和最大长度。
- 关闭 Cache 后结果不同：确认位置 ID、Attention Mask 和 Cache Position 是否正确。
- 多轮请求串话：严禁把一个用户的 Cache 误复用给另一个请求。
- 开启 Cache 反而变慢：检查短序列、CPU 卸载、复制开销、实现是否支持当前模型。
- 训练异常：KV Cache 主要用于推理，不要在训练中无条件开启。

## 三种完整数据路径

### Encoder-only：告警分类

```text
告警文本
  -> Tokenizer
  -> Input IDs + Attention Mask
  -> Embedding + Position
  -> 双向 Encoder 层
  -> Pooling / 特殊位置表示
  -> 分类头
  -> severity / category 概率
```

重点证据：截断比例、类别分布、混淆矩阵、置信度校准和漂移。

### Decoder-only：事故摘要生成

```text
告警 + 日志 + 变更 + Runbook
  -> Prompt Template
  -> Tokenizer / Truncation
  -> Prefill
  -> KV Cache
  -> Decode Token 1
  -> 更新 Cache
  -> Decode Token 2 ...
  -> Stop Token / Length Limit
  -> 结构校验与安全策略
```

重点证据：TTFT、TPOT、输入/输出 Token、停止原因、Cache 内存、引用证据和质量评估。

### Encoder-Decoder：日志到结构化事件

```text
原始日志
  -> Encoder 读取完整输入
  -> Encoder Context
  -> Decoder Masked Self-Attention
  -> Cross-Attention 读取 Context
  -> 逐 Token 生成 JSON 字段
  -> Schema 校验
```

重点证据：源输入截断、Cross-Attention、字段完整率和结构解析失败率。

## 状态、一致性与可复现性

Transformer 服务的“模型版本”不只是一个权重文件。至少包含：

| 状态 | 作用 | 不一致会怎样 |
|---|---|---|
| 模型权重 | 保存学习到的参数 | 输出能力和数值路径变化 |
| 模型配置 | 定义层数、维度、位置和架构 | 加载失败或静默错误 |
| Tokenizer 与词表 | 把文本映射为 ID | 输入含义改变 |
| Chat/Prompt Template | 组织角色和业务指令 | 行为与安全边界改变 |
| Generation Config | 控制长度、采样和停止 | 输出随机性、长度和成本变化 |
| Adapter / LoRA | 叠加任务参数 | 漏载或错载后能力变化 |
| Runtime 与 Kernel | 执行张量计算 | 性能、数值和兼容性变化 |
| KV Cache | 请求级历史 K/V | 串请求会造成数据泄漏 |

### 一致性边界

- 权重、Tokenizer、配置和模板必须作为同一不可变发布包。
- KV Cache 是请求运行状态，不是模型知识库，也不是长期事实存储。
- 多副本部署时，每个请求必须路由到拥有其 Cache 的实例，或使用服务明确支持的分布式 Cache 机制。
- 滚动升级期间不能让同一会话无控制地跨不兼容版本。
- 固定随机种子不等于跨 GPU、Kernel、Batch 和版本位级复现。

### 怎么验证

发布物生成 Manifest：

```json
{
  "model_id": "incident-transformer",
  "model_revision": "immutable-commit-or-digest",
  "tokenizer_revision": "same-release-revision",
  "prompt_version": "incident-v7",
  "generation_config_version": "prod-v3",
  "runtime_image_digest": "sha256:replace-with-real-digest"
}
```

JSON 不支持注释。生产 Manifest 还应加入文件哈希、许可证、数据评估集版本和审批记录。

## 安装与实验环境

### 路线一：只学注意力机制

本文基础实验只需要 Python 3，不需要联网、GPU 或第三方包。

Windows PowerShell：

```powershell
python --version # 确认 Python 可用；正常应看到 Python 3.x
python attention_lab.py # 运行基础实验；正常会输出注意力权重和 PASS
```

Linux 或 macOS：

```bash
python3 --version      # 确认 Python 可用
python3 attention_lab.py # 运行基础实验
```

### 路线二：使用 PyTorch 和 Hugging Face

先建立隔离环境：

```powershell
python -m venv .venv # 创建项目级虚拟环境
.\.venv\Scripts\Activate.ps1 # 进入环境，避免污染系统 Python
python -m pip install --upgrade pip # 更新当前虚拟环境里的 pip
```

Linux 或 macOS 激活命令是 `source .venv/bin/activate`。

PyTorch 的 CPU、CUDA 和 ROCm 安装命令不同，必须从 [PyTorch Get Started](https://pytorch.org/get-started/locally/) 按操作系统、包管理器和计算后端生成命令。不要随便复制另一台机器的 CUDA Wheel 地址。

安装后记录环境：

```powershell
python -c "import torch; print(torch.__version__); print(torch.cuda.is_available())" # 打印版本与 CUDA 可见性
python -m pip freeze | Out-File requirements.lock.txt -Encoding utf8 # 保存精确依赖快照
```

如果使用 Hugging Face Transformers，再按当前官方安装页选择稳定版本并固定依赖。本文核验时稳定文档是 5.14.0，最新代码补丁版是 5.14.1；这只是 2026 年 8 月 7 日的快照，不是永久安装建议。教学文档不直接写“永远安装 latest”，因为同一份模型代码可能随主版本改变。

### 安装失败先查什么

1. Python 版本是否在目标 PyTorch/Transformers 支持范围内。
2. 当前终端是否真正进入 `.venv`。
3. Wheel 的平台、Python ABI 与 CPU/CUDA 后端是否匹配。
4. NVIDIA 驱动是否满足目标 Runtime，注意驱动版本与本地 Toolkit 不是同一个概念。
5. 企业代理、证书、镜像源和磁盘空间是否正常。
6. `python -m pip` 与运行脚本使用的是否同一个 Python。

## 配置与 Shape 字典

### 模型结构配置

| 配置 | 控制什么 | 常见关系 | 正常验证 | 常见坑 |
|---|---|---|---|---|
| `vocab_size` | 词表行数 | 要覆盖所有 Token ID | 最大 ID 小于该值 | 模型与 Tokenizer 词表不一致 |
| `hidden_size` / `d_model` | 每个位置的隐藏宽度 | 影响参数、计算和通信 | 输入输出最后一维一致 | 只增宽不评估显存和吞吐 |
| `num_hidden_layers` | 层数 | 越深通常计算越多 | 权重层数与配置一致 | 配置和 Checkpoint 不匹配 |
| `num_attention_heads` | Query 头数 | 常要求整除隐藏维度 | `head_dim` 为整数 | 误以为头越多一定更好 |
| `num_key_value_heads` | K/V 头数 | 可小于 Query 头数 | Cache Shape 符合配置 | 按 Query 头数误算 KV Cache |
| `intermediate_size` | FFN 中间宽度 | 通常大于隐藏维度 | FFN 权重 Shape 匹配 | 忽略 FFN 的参数和计算占比 |
| `max_position_embeddings` | 位置范围配置 | 不等于所有运行时都能稳定跑满 | 长度边界测试通过 | 只改配置就声称扩展上下文 |
| `dropout` | 训练随机失活概率 | 推理 `eval` 时关闭 | 训练/推理模式正确 | 推理忘记切模式 |
| `norm_first` | Pre-Norm/Post-Norm 选择 | 必须匹配架构和权重 | 层结构与 Checkpoint 一致 | 当作无害开关修改 |

### 推理配置

| 参数 | 作用 | 正常结果 | AIOps 场景 | 常见坑 |
|---|---|---|---|---|
| `max_new_tokens` | 限制新增 Token | 输出不会无限增长 | 控制事故摘要上限 | 与输入总长度限制混淆 |
| `do_sample` | 是否采样 | 关闭时更确定 | 结构化诊断可先关闭 | 关闭不等于跨环境位级一致 |
| `temperature` | 调整分布尖锐度 | 值越低通常更保守 | 降低诊断建议发散 | 设为 0 的语义依库实现 |
| `top_p` | 从累计概率候选中采样 | 限制低概率尾部 | 控制摘要多样性 | 与 Beam Search 混用后不理解语义 |
| `eos_token_id` | 结束 Token | 遇到结束条件停止 | 防止无限输出 | Tokenizer 与模型不一致 |
| `pad_token_id` | Padding Token | Batch 对齐正确 | 混合长度请求 | 直接把 EOS 当 PAD 却没评估影响 |
| `use_cache` | 是否用 KV Cache | 自回归生成通常更快 | 降低逐 Token 重算 | 训练误开或位置处理错误 |
| `attention_mask` | 定义有效输入 | Padding 不参与注意力 | 批量告警摘要 | 布尔语义和 Shape 写错 |

`model.eval()` 会关闭模块按训练状态控制的 Dropout，但 PyTorch 2.13.0 的函数式 `scaled_dot_product_attention` 只看调用者传入的 `dropout_p`：只要大于 0 就会执行。因此评估和推理代码必须显式传 `0.0`，不能只依赖 `eval()`。

### 关键 Shape

| 张量 | 常见 Shape | 含义 |
|---|---|---|
| `input_ids` | `[batch, sequence]` | 每个位置的 Token ID |
| `hidden_states` | `[batch, sequence, hidden]` | 每个位置的上下文向量 |
| `q/k/v` | `[batch, heads, sequence, head_dim]` | 分头后的注意力输入 |
| `attention_scores` | `[batch, heads, query_len, key_len]` | Query 对每个 Key 的分数 |
| `logits` | `[batch, sequence, vocab]` | 每个位置对词表的未归一化分数 |
| `kv_cache` | 每层两组 K/V 张量 | 历史 Token 的注意力状态 |

不同框架可能使用 Sequence-first 或 Batch-first，必须以当前 API 为准。

## 常用检查命令与 API

| 名称 | 作用 | 常用写法 | 关键结果 | 异常先看 |
|---|---|---|---|---|
| Python 版本 | 确认解释器 | `python --version` | 支持的 Python 3.x | PATH 与虚拟环境 |
| 包版本 | 核对运行时 | `python -m pip show torch transformers` | 版本和安装路径 | 是否装到另一解释器 |
| CUDA 可见性 | 确认 PyTorch 能看到 GPU | `torch.cuda.is_available()` | `True` 或明确使用 CPU | 驱动、Wheel、容器设备 |
| GPU 状态 | 看显存与利用率 | `nvidia-smi` | 进程、显存、利用率 | 驱动、设备权限、其他进程 |
| `model.eval()` | 切换推理行为 | 推理前调用 | Dropout 等训练行为关闭 | 只加 `no_grad` 未切模式 |
| `torch.inference_mode()` | 关闭推理梯度跟踪 | 包裹前向 | 减少 Autograd 开销 | 训练代码误用 |
| `scaled_dot_product_attention` | 调用 SDPA | 传 Q/K/V/Mask，推理时 `dropout_p=0` | Shape 正确且无 NaN | Mask 语义、Dropout 与 Kernel 后端 |
| `generate` | 自回归生成 | 传长度、采样、Cache 配置 | 有结束原因和输出 Token | Tokenizer、停止条件、截断 |
| PyTorch Profiler | 分析 CPU/GPU 算子 | 采集短窗口 Trace | 看到热点与内存 | Profiling 开销和采样范围 |

## 基础实验：亲手算一次 Causal Self-Attention

### 实验目标

不用 PyTorch 和大模型，直接观察这五步：

1. Q 与 K 点积得到分数。
2. 分数除以 `sqrt(d_k)`。
3. Causal Mask 屏蔽未来位置。
4. Softmax 生成权重。
5. 权重加权 V 得到输出。

### 前置条件

- Python 3。
- 一个空目录。
- 不需要联网，不需要 GPU。

实验只操作本地小矩阵，不接触生产数据。

### 创建 `attention_lab.py`

```python
import argparse
import math


TOKENS = ["告警", "数据库", "变更"]

# 为了让实验可读，直接给三组二维向量。
Q = [[1.0, 0.0], [0.8, 0.2], [0.2, 1.0]]
K = [[1.0, 0.0], [0.7, 0.3], [0.0, 1.0]]
V = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]


def dot(left, right):
    return sum(a * b for a, b in zip(left, right))


def softmax(row):
    finite = [value for value in row if value != float("-inf")]
    if not finite:
        raise ValueError("这一行全部被 Mask，Softmax 没有有效 Key")

    max_value = max(finite)
    exps = [0.0 if value == float("-inf") else math.exp(value - max_value) for value in row]
    total = sum(exps)
    return [value / total for value in exps]


def attention(causal=True):
    scale = math.sqrt(len(K[0]))
    weights = []
    outputs = []

    for query_index, query in enumerate(Q):
        score_row = []
        for key_index, key in enumerate(K):
            score = dot(query, key) / scale
            if causal and key_index > query_index:
                score = float("-inf")
            score_row.append(score)

        weight_row = softmax(score_row)
        output_row = [
            sum(weight * value[column] for weight, value in zip(weight_row, V))
            for column in range(len(V[0]))
        ]
        weights.append(weight_row)
        outputs.append(output_row)

    return weights, outputs


def future_leak(weights):
    return max(
        (weights[row][column] for row in range(len(weights)) for column in range(row + 1, len(weights))),
        default=0.0,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--no-causal-mask",
        action="store_true",
        help="故障注入：允许当前位置看到未来 Token",
    )
    args = parser.parse_args()

    causal = not args.no_causal_mask
    weights, outputs = attention(causal=causal)

    print(f"tokens={TOKENS}")
    print(f"causal_mask={causal}")
    for index, (weight_row, output_row) in enumerate(zip(weights, outputs)):
        print(
            f"query={index}:{TOKENS[index]} "
            f"weights={[round(value, 4) for value in weight_row]} "
            f"sum={sum(weight_row):.4f} "
            f"output={[round(value, 4) for value in output_row]}"
        )

    leak = future_leak(weights)
    print(f"max_future_attention={leak:.6f}")

    assert all(abs(sum(row) - 1.0) < 1e-9 for row in weights), "每行权重必须归一化为 1"
    if leak > 1e-12:
        print("FAULT DETECTED: 自回归注意力读取了未来 Token")
        raise SystemExit(2)

    print("PASS: 权重归一化，未来位置权重为 0")


if __name__ == "__main__":
    main()
```

### 运行

```powershell
python attention_lab.py
```

### 预期结果

你会看到三行权重：

- 第 0 个 Query 只能看第 0 个 Token，所以权重是 `[1.0, 0.0, 0.0]`。
- 第 1 个 Query 可以看第 0、1 个 Token，未来的第 2 个权重是 0。
- 第 2 个 Query 可以看全部三个 Token。
- 每行 `sum` 都是 `1.0000`。
- 最后两行是：

```text
max_future_attention=0.000000
PASS: 权重归一化，未来位置权重为 0
```

数值小数可能因 Python 版本有微小显示差异，但断言应该通过。

### 这个实验证明了什么

它证明代码实现了“缩放、Mask、Softmax、加权求和”这条最小链路。它没有证明模型已经学会语言，也没有训练任何参数。

### 如果没有成功，先查这些

1. 文件名是否真的是 `attention_lab.py`，而不是 `.txt`。
2. 是否复制了完整代码，包括最后的 `main()`。
3. Python 是否是 3.x。
4. 缩进是否被编辑器破坏。
5. 如果出现“全部被 Mask”，检查条件是否误写成 `key_index >= query_index`。

## 故障注入实验：移除 Causal Mask，检测未来信息泄漏

### 实验边界

只对上面的三个本地向量做计算，不修改模型、不访问网络、不接触生产环境。这个故障用于模拟训练或推理代码把 Mask 写错。

### 注入故障

```powershell
python attention_lab.py --no-causal-mask
```

### 现象

预期：

- 第 0、1 个 Query 对未来位置出现非零权重。
- `max_future_attention` 大于 0。
- 程序输出 `FAULT DETECTED`。
- 进程退出码是 2。

PowerShell 检查退出码：

```powershell
$LASTEXITCODE # 预期为 2；这表示测试成功抓到了故障
```

### 证据

保留：

1. 正常运行的三行权重。
2. 故障运行的三行权重。
3. `max_future_attention`。
4. 退出码。
5. 当前代码提交 SHA。

### 假设

如果自回归训练指标异常好、线上生成却明显退化，一个高价值假设是：训练时 Token 读取了未来标签。

### 验证

最小测试直接验证任意 `column > row` 的权重是否为 0。真实框架还要分别验证：

- Batch 中每个样本的 Causal Mask。
- Padding 与 Causal Mask 合并后的结果。
- Prefill 和带 KV Cache Decode 的 Mask Shape。
- 更换 Attention API 前后的布尔语义。

### 修复

移除 `--no-causal-mask`，恢复正常运行：

```powershell
python attention_lab.py
```

看到 `PASS` 才算恢复。生产代码还应把这个断言做成单元测试和发布门禁。

### 清理

实验没有生成缓存或模型文件。需要清理时，只删除你自己实验目录里的 `attention_lab.py` 和截图；不要在不确定目录运行递归删除。

### 复盘

“训练 Loss 很低”只是现象。真正的排障链是：

```text
异常指标
  -> 检查标签对齐和可见性
  -> 打印最小注意力权重
  -> 证明未来位置非零
  -> 修复 Mask 语义
  -> 重跑训练与独立验证集
  -> 增加回归测试
```

## 可选 PyTorch Shape 实验

安装好匹配环境后，可以验证一个 Encoder Layer 的 Shape：

```python
import torch
from torch import nn

torch.manual_seed(7)

layer = nn.TransformerEncoderLayer(
    d_model=32,          # 每个 Token 的隐藏宽度
    nhead=4,             # 4 个头，每头维度 8
    dim_feedforward=64,  # FFN 中间宽度
    dropout=0.0,         # 实验关闭 Dropout，便于重复观察
    batch_first=True,    # 输入使用 [batch, sequence, hidden]
    norm_first=True,
)
layer.eval()

x = torch.randn(2, 5, 32)              # 2 个样本、每个 5 Token
padding_mask = torch.tensor(
    [[False, False, False, False, False],
     [False, False, False, True, True]]  # 第二个样本最后两个位置是 Padding
)

with torch.inference_mode():
    output = layer(x, src_key_padding_mask=padding_mask)

print(f"input_shape={tuple(x.shape)}")
print(f"mask_shape={tuple(padding_mask.shape)}")
print(f"output_shape={tuple(output.shape)}")
assert output.shape == x.shape
```

预期：

```text
input_shape=(2, 5, 32)
mask_shape=(2, 5)
output_shape=(2, 5, 32)
```

注意：Padding Mask 让注意力忽略相应 Key，不自动把最终输出位置清零。不要用“Padding 位置输出非零”直接判定 Mask 失效。

## Transformer 在 AIOps 中的作用

### 日志与工单分类

Encoder 把文本编码后接分类头，可用于故障类型、责任域和优先级预测。必须监控类别不平衡、置信度校准和新日志模板漂移。

### 告警与事件摘要

Decoder 或 Encoder-Decoder 可以把告警、日志、变更和处置记录压缩为时间线。摘要必须保留证据引用，不能让流畅度替代真实性。

### 相似事故检索

Transformer Encoder 可以生成 Embedding，供向量检索查找相似事故。距离相近只表示表示空间相近，不证明根因相同。

### 根因候选排序

模型可以根据拓扑、时间、变更和症状给候选排序，但输出应是“带证据的假设”，不是自动宣判根因。

### Runbook 问答

Transformer 是 RAG 的生成或编码组件。知识时效性、权限过滤、Chunk 与引用仍由完整 RAG 链路负责。

### 受控自动化

模型可以把自然语言意图转换成结构化建议。实际执行应交给确定性 Runbook 平台，并增加：

- JSON Schema 校验。
- 资源与参数白名单。
- 只读优先。
- 高风险动作审批。
- 幂等键。
- 执行后验证。
- 审计与回滚。

## 训练生产路径

```text
数据源
  -> 权限与脱敏
  -> 采样 / 去重 / 质量检查
  -> Tokenize
  -> Shard / Batch / Padding
  -> Distributed Training
  -> Checkpoint
  -> 离线评估 / 安全评估
  -> Model Registry
  -> 灰度部署
  -> 在线质量与漂移监控
  -> 反馈进入下一版本数据
```

### 数据状态

要版本化：

- 数据快照与过滤规则。
- 去重和脱敏代码。
- Tokenizer。
- 训练配置与随机种子。
- Checkpoint。
- 评估集和评分脚本。

### Checkpoint 恢复

继续训练通常不仅需要权重，还需要：

- Optimizer State。
- Learning Rate Scheduler State。
- Mixed Precision Scaler。
- 当前 Step/Epoch。
- 随机数状态。
- 数据采样器或数据游标。

缺少这些状态可能“能加载”，但并不等于从原位置一致恢复。

### 分布式训练取舍

| 方式 | 核心做法 | 主要收益 | 主要代价 |
|---|---|---|---|
| 数据并行 | 每个副本处理不同 Batch，再同步梯度 | 简单扩吞吐 | 每卡仍需放模型，通信随参数增长 |
| 参数分片 / FSDP | 参数、梯度和优化器状态分片 | 降低单卡状态内存 | 通信、调度和 Checkpoint 更复杂 |
| 张量并行 | 把单层矩阵切到多设备 | 单层放不下一张卡时有用 | 层内通信频繁，拓扑敏感 |
| 流水线并行 | 不同设备放不同层 | 支撑深模型 | Pipeline Bubble 与调度复杂 |
| 混合并行 | 组合以上方式 | 支撑更大模型和集群 | 故障域、配置和恢复复杂度最高 |

训练高可用不是简单“多开一个 Trainer”。集体通信中任何一个 Rank 异常都可能让整个 Job 停住，恢复依赖完整 Checkpoint 和调度器重新收敛。

## 推理生产路径

```text
Client
  -> API Gateway / Auth / Rate Limit
  -> Request Queue
  -> Tokenizer Pool
  -> Scheduler / Continuous Batching
  -> Model Replica
       -> Prefill
       -> KV Cache Allocation
       -> Decode Loop
  -> Detokenize
  -> Schema / Safety / Evidence Validation
  -> Stream or JSON Response
```

### Prefill 与 Decode 要分开观测

- Prefill 吃完整输入，长上下文对 TTFT 影响明显。
- Decode 每步生成新 Token，关注每 Token 延迟和 Cache 访问。
- 一个“总延迟”无法说明问题是在排队、Tokenize、Prefill、Decode 还是网络流式传输。

### Batching 取舍

Batching 可以提高设备利用率，但会引入等待和请求间干扰：

- Batch 太小：GPU 吃不满，吞吐低。
- Batch 太大：单批延迟、显存和失败半径增加。
- 长短请求混在一起：Padding 或调度让短请求被拖慢。
- Continuous Batching 改善动态请求利用率，但 Cache 管理和调度更复杂。

### 生成不是一个事务

流式响应已经发给客户端后，中途失败无法“撤回”。生产接口要定义：

- 超时前已经发送的 Token 如何标记。
- 客户端断线是否取消计算。
- 重试是否会生成不同内容。
- 请求 ID 和幂等语义。
- 工具调用或写操作是否允许在流未完成时触发。

## 容量与性能

### 四类内存不要混在一起

#### 权重内存

粗略估算：

```text
权重内存 ≈ 参数数量 × 每参数字节数
```

例如 FP16/BF16 通常每参数 2 字节，FP32 通常 4 字节。真实占用还包括对齐、量化 Scale、Runtime Buffer 和重复权重等。

#### 训练状态内存

训练还要保存激活、梯度、优化器状态和通信 Buffer。不能用“参数量 × 2 字节”估算训练显存。不同优化器、精度、分片和激活重计算差异很大。

#### 注意力中间量

朴素全注意力的分数 Shape 含 `query_len × key_len`。自注意力在序列长度维度通常呈二次增长：

```text
分数元素数量 ≈ batch × heads × sequence × sequence
```

FlashAttention 是 IO-aware 的精确全注意力实现：它用分块减少高带宽显存读写，并避免朴素方式长期物化完整注意力矩阵。它不会把稠密全注意力的二次算术关系变成线性，也不保证所有 GPU、dtype、Head Dim 和 Mask 都能使用；计算、读写、后端回退和 KV Cache 仍要实测。

#### KV Cache

Decoder-only 的粗略元素数量：

```text
KV 元素 ≈ 2 × layers × batch × sequence × kv_heads × head_dim
KV 字节 ≈ KV 元素 × dtype_bytes
```

`2` 代表 Key 和 Value。使用 Multi-Query 或 Grouped-Query Attention 时，`kv_heads` 可能小于 Query 头数。

### 核心性能指标

| 指标 | 人话解释 | 主要受什么影响 |
|---|---|---|
| Queue Time | 请求进入后等多久才执行 | 并发、调度、限流、Batch 策略 |
| TTFT | Time To First Token，首 Token 时间 | 输入长度、排队、Tokenize、Prefill |
| TPOT / ITL | 每个输出 Token 的时间 / Token 间延迟 | Decode、KV Cache、Batch、Kernel |
| Tokens/s | 每秒处理或生成 Token | 模型、硬件、Batch、精度、并行 |
| Throughput | 单位时间完成的请求或 Token | 调度、长度分布和设备利用率 |
| Cache Utilization | KV Cache 使用比例 | 上下文、并发、分配和回收 |
| OOM Rate | 显存耗尽比例 | Admission Control 与容量模型 |

### 容量规划步骤

1. 固定模型、Tokenizer、Runtime、dtype 和硬件。
2. 从真实业务抽取输入长度、输出长度和并发分布。
3. 分别压测短输入、长输入、短输出、长输出。
4. 记录 P50/P95/P99 的 Queue、TTFT、TPOT 和总延迟。
5. 记录峰值显存、Cache 利用率、GPU 利用率与功耗。
6. 逐步增加并发，找出延迟拐点和 OOM 边界。
7. 在目标 SLO 前留出故障转移和突发余量。

### 常见优化与代价

| 优化 | 收益 | 代价或风险 |
|---|---|---|
| 混合精度 | 降内存、提高 Tensor Core 利用 | 数值溢出、硬件支持差异 |
| Flash/融合 Attention | 降中间内存与访存 | 后端、Shape、Mask 和 dtype 限制 |
| Quantization | 降权重或 Cache 内存 | 精度、质量、Kernel 与校准成本 |
| Prefix Cache | 复用相同前缀 Prefill | Cache 命中、隔离和过期复杂 |
| Continuous Batching | 提高动态负载吞吐 | 调度、尾延迟和 Cache 管理复杂 |
| Speculative Decoding | 借助 Draft Model 加速 | 接受率、双模型资源和实现复杂 |
| Tensor Parallel | 单模型跨设备 | 高频通信和拓扑敏感 |
| CPU Offload | 腾出 GPU 内存 | PCIe/互连搬运拉高延迟 |

所有优化都要同时比较质量、P99、吞吐、显存和失败率，不能只看平均 Tokens/s。

## 高可用与故障域

### 推理服务

一个可讨论的生产架构：

```text
              +-> Replica A -> GPU Group A
Gateway ------+-> Replica B -> GPU Group B
              +-> Replica C -> GPU Group C
                    |
                    +-> Model Artifact Store（只读）

Control Plane
  -> Model Registry
  -> Deployment / Autoscaling
  -> Config and Secret Management
  -> Metrics / Logs / Traces / Evaluation
```

设计重点：

- 至少跨主机或故障域放副本。
- 模型加载完成并通过 Warmup 后才接流量。
- 过载时做 Admission Control，不让所有副本一起 OOM。
- 带本地 KV Cache 的会话需要粘滞或显式迁移策略。
- 发布新模型时旧副本保留到在途请求结束或被安全终止。
- Artifact Store 不可用时，已加载副本是否还能服务要提前定义。

### 训练任务

训练的高可用更接近“可恢复”，而不是请求级无感切换：

- 定期保存一致 Checkpoint。
- Checkpoint 写入临时路径，校验成功后原子标记可用。
- 保存全局 Step、优化器、调度器和数据状态。
- 演练单 Rank、单节点和存储故障后的重启。
- 估算 Checkpoint 时间对训练吞吐的影响。

### 不要把多副本误解成结果一致

副本使用相同版本只能降低配置漂移，不能保证概率生成逐字相同。质量一致性应通过评估集、结构约束和业务容差定义。

## 安全与供应链

### 模型文件不是普通图片

从不可信来源加载模型和自定义代码可能执行恶意逻辑或消耗资源。生产要求：

- 只从允许的 Registry 获取 Artifact。
- 固定不可变 Revision 或 Digest。
- 校验哈希和签名。
- 优先使用 Safetensors 等更安全的张量序列化格式；使用 PyTorch Checkpoint 时评估 `weights_only=True`。
- 把 Pickle 反序列化视为可能执行代码的高风险入口。
- 审核是否需要 `trust_remote_code`，默认不要对未知仓库开启。
- 扫描依赖、许可证和已知漏洞，但不要把扫描通过当成绝对安全证明。
- 在隔离构建环境做转换，不把长期云凭据挂进去。

### 输入安全

- 限制最大 Token 和请求体大小。
- 对超长、递归或高成本请求做配额。
- 脱敏日志、Prompt、输出和 Trace。
- 多租户 Cache、Batch 和日志必须隔离。
- Prompt Injection 不能只靠系统提示词防御。

### 输出与工具安全

- 模型输出视为不可信数据。
- JSON 经过 Schema 校验。
- Shell、SQL、Kubernetes 和云 API 参数经过白名单。
- 写操作需要审批、幂等和回滚。
- 输出中的链接、命令和代码不能自动执行。

### 数据与隐私

训练集、评估集、Prompt、KV Cache 和生成日志都可能含敏感信息。明确：

- 谁能读取。
- 保存多久。
- 是否进入第三方服务。
- 如何删除用户数据。
- 备份和 Trace 是否同样执行删除与加密。

## 可观测性

### 请求级字段

每次请求至少关联：

- Request/Trace ID。
- 模型、Tokenizer、Prompt 和 Runtime 版本。
- 输入/输出 Token 数。
- 截断和停止原因。
- Queue、Tokenize、Prefill、Decode、Postprocess 耗时。
- Batch ID 与副本/GPU 标识。
- 错误类型与重试次数。
- 安全策略与结构校验结果。

不要把完整 Prompt、密钥和敏感日志默认写入遥测。

### 指标建议

以下名称是建议的自建语义，不代表某个框架默认导出同名指标：

```text
transformer_requests_total{model,revision,status}
transformer_request_queue_seconds
transformer_ttft_seconds
transformer_tpot_seconds
transformer_input_tokens_total
transformer_output_tokens_total
transformer_tokens_per_second
transformer_kv_cache_bytes
transformer_kv_cache_utilization_ratio
transformer_batch_size
transformer_oom_total{stage}
transformer_truncations_total{reason}
transformer_schema_validation_failures_total
```

### GPU 与 Runtime 指标

- GPU 利用率、显存、功耗和温度。
- Tensor Core/Kernel 活动。
- Host-to-Device 与 Device-to-Host 传输。
- NCCL/集合通信时间和错误。
- Model Load 与 Warmup 时间。
- Cache 分配、回收和碎片。

### 质量指标

技术 SLO 之外还要有：

- 任务正确率或字段 F1。
- 引用命中与证据忠实度。
- 幻觉或无依据断言率。
- 安全拒答与越权率。
- 不同语言、长度、服务和严重级别切片表现。
- 人工升级、撤回和错误自动化率。

HTTP 200、GPU 80% 利用率和低延迟都不能证明模型答案正确。

### 告警

优先对症状告警：

- P95/P99 TTFT 或 TPOT 超过 SLO。
- Queue Age 持续增长。
- OOM 或 Worker 重启增加。
- 截断率突然上升。
- Cache 利用率接近安全线。
- 输出结构失败率上升。
- 质量集或线上反馈跌破门槛。
- 新版本与基线差异超过阈值。

## 升级、灰度与回滚

### 变更对象

一次“模型升级”可能同时改变：

- 权重。
- Tokenizer 和 Chat Template。
- 位置或 Cache 实现。
- Quantization。
- 推理 Runtime 和 Kernel。
- Prompt、RAG 或工具协议。
- 安全策略和生成参数。

每项都要进入变更记录，不能只记模型名称。

### 升级前

1. 固定 Artifact Revision 和哈希。
2. 生成 SBOM、许可证和漏洞检查结果。
3. 在隔离环境完成加载和 Warmup。
4. 对黄金集跑质量、安全、长度和结构评估。
5. 对真实长度分布做容量压测。
6. 验证旧版 Artifact 与部署配置仍可恢复。
7. 设定自动停止灰度的阈值。

### 灰度中

- 按用户、租户或请求哈希稳定分流。
- 对比 Queue、TTFT、TPOT、OOM、成本和质量。
- 防止同一会话跨版本导致 Cache 或模板不兼容。
- 保留新旧版本的完整版本标识和 Trace。
- 高风险工具调用先保持只读。

### 回滚

回滚要恢复完整发布包：

```text
Weights
  + Tokenizer
  + Config
  + Prompt/Chat Template
  + Generation Config
  + Adapter
  + Runtime Image
  + Safety Policy
```

如果新版本已经写入下游业务状态，只回滚模型不会撤销已执行动作。还需要业务补偿、审计和结果验证。

## 常见故障排查

### 现象一：长输入首字很慢

可能原因：

- Prefill 计算随长度增加。
- Queue 中有其他长请求。
- Tokenizer 成为 CPU 瓶颈。
- Attention Kernel 回退到慢路径。
- 跨 GPU 通信或 CPU Offload。

检查顺序：

1. 拆 Queue、Tokenize、Prefill、Decode 时延。
2. 按输入 Token 分桶比较 TTFT。
3. 看 Profiler 和 Kernel。
4. 看 Batch 中是否混入超长请求。
5. 看 GPU 利用率、显存和互连。

### 现象二：生成过程中 OOM

可能原因：并发、输出长度和 KV Cache 一起增长，或者 Cache 没及时回收。

检查顺序：

1. 记录 OOM 前每请求长度和并发。
2. 区分 Prefill OOM 与 Decode OOM。
3. 核对 KV 头数、层数、dtype 和 Cache 策略。
4. 检查取消请求是否释放 Cache。
5. 降低 Admission Limit 验证容量假设。

修复可能是长度限制、并发控制、量化 Cache、分组查询架构、更多设备或更好的调度，不是统一“加显存”。

### 现象三：Loss 变成 NaN

检查：

- 哪个 Step 和 Batch 首次出现。
- 输入和标签是否含异常值或非法 ID。
- 学习率和梯度范数。
- 混合精度 Scale。
- Attention 是否有全屏蔽行。
- 前一个 Checkpoint 是否正常。

先保留故障 Batch 和 Checkpoint，再修数据、数值稳定性或配置。不要只跳过所有 NaN 批次掩盖问题。

### 现象四：训练指标异常好，线上很差

高价值假设：

- Causal Mask 未来泄漏。
- 训练/验证样本重复。
- 标签信息进入输入。
- 线上截断或模板不同。
- 训练和服务 Tokenizer 不同。

用独立时间段、独立实体和最小 Mask 测试验证，不要先继续加数据训练。

### 现象五：模型升级后输出乱码或停止异常

检查：

- Tokenizer Revision。
- 词表大小和特殊 Token ID。
- Chat Template。
- `eos_token_id` / `pad_token_id`。
- Runtime 是否正确支持架构。
- Quantization 和权重转换日志。

### 现象六：输出重复、循环或不停止

检查生成参数、EOS、最大长度、采样、Prompt 重复、Cache Position 和模型自身质量。不要通过无限增大 `max_new_tokens` 解决停止问题。

### 现象七：多 GPU 训练卡住

检查：

1. 所有 Rank 最后一条日志和 Step。
2. 是否某个 Rank OOM 或数据读取失败。
3. 集体通信超时和网络错误。
4. 各 Rank Batch 数是否一致。
5. Checkpoint 是否正在阻塞共享存储。

不要只重启健康 Rank；先确定失败域并保证所有进程一致退出和恢复。

### 现象八：开启优化后吞吐没有提升

可能是：

- 请求太小，优化开销占比高。
- Shape 或 Mask 让融合 Kernel 不可用。
- CPU Tokenizer 或网络已是瓶颈。
- Batch 增大后 Queue 和尾延迟恶化。
- Quantization 后反量化 Kernel 不理想。

用 Profiler 和端到端 SLO 证明，而不是用“配置已开启”证明。

## 事故案例：新版本上线后遗漏关键变更，P99 TTFT 同时翻倍

### 现象

- 新版本灰度 20%。
- 短输入质量正常。
- 超过 12K Token 的事件摘要经常遗漏尾部变更记录。
- 新版本 P99 TTFT 是旧版约两倍。
- GPU OOM 开始出现。

### 先止损

1. 暂停扩大灰度。
2. 禁用所有自动写操作，只保留只读分析。
3. 将超长请求路由回旧版或返回明确降级提示。
4. 保存新旧版本请求 ID、Token 统计和 Trace。

### 收集证据

- 原始输入和脱敏后的完整 Token 序列。
- 截断方向、最大长度和实际保留区间。
- 模型、Tokenizer、模板和 Runtime Revision。
- Queue、Tokenize、Prefill、Decode 分段耗时。
- 每请求 KV Cache 和 GPU 峰值。
- 新旧版本同一评估集的证据命中率。

### 假设

按证据优先级：

1. 新 Tokenizer 让同一文本 Token 数增加，尾部被截断。
2. 新模板增加了系统前缀，占用了上下文预算。
3. 新模型 KV Cache 更大，导致并发下 OOM。
4. 新 Attention 实现没有进入融合路径。
5. 模型看到了变更，但生成阶段没有忠实使用。

### 验证

- 比较新旧 Tokenizer 对同一输入的 ID 数和尾部。
- 在模型调用前保存“最终实际输入”，不是只看业务原文。
- 固定相同生成配置做对照。
- 按输入长度分桶比较 Prefill。
- 计算实际 `kv_heads` 与 Cache 字节。
- 用 Profiler 确认 Kernel。

### 修复与回滚

- 如果输入被截断：调整 Prompt 预算、信息排序或先做检索/压缩，不能只盲目加长度。
- 如果 Cache 超限：降低并发和长度，评估量化/卸载或不同模型架构。
- 如果 Runtime 回退：恢复已验证镜像或修兼容配置。
- 回滚完整版本包，并确认旧版质量与容量恢复。

### 爆炸半径

确认：

- 哪些租户、长度和业务类型受影响。
- 是否已有错误建议进入工单或变更系统。
- 敏感输入是否进入不应进入的 Trace。
- OOM 是否影响同 GPU 上其他请求。

### 复盘改进

- 发布门禁增加 Tokenizer 长度差异和尾部保留测试。
- 黄金集按长度和“关键证据位置”切片。
- 容量测试覆盖真实长短混合并发。
- 仪表盘拆分 TTFT 和 TPOT。
- 模型、Tokenizer、模板与 Runtime 强制同版本发布。

## 生产系统设计题：设计企业 AIOps 事件分析 Transformer 服务

### 需求澄清

先问：

- 日均请求、峰值并发和长度分布是多少？
- 输出是建议、工单草稿还是能触发执行？
- 哪些日志和工单允许进入模型？
- 模型运行在本地还是外部服务？
- 延迟、可用性、成本和质量目标是什么？
- 需要保留多久的 Prompt、Trace 和 Cache？
- 租户、地域和权限边界是什么？

### 一个可讨论的架构

```text
Alert / Incident / Log / Change
  -> Ingestion Gateway
  -> Auth + Tenant + Redaction
  -> Evidence Retriever
  -> Prompt Budgeter
  -> Transformer Serving Pool
       -> Short-context Pool
       -> Long-context Pool
  -> Structured Output Validator
  -> Policy / Approval
  -> Ticket or Read-only Runbook
  -> Outcome Verification

Control Plane
  -> Model Registry and Manifest
  -> Evaluation Sets
  -> Canary Deployment
  -> Metrics / Logs / Traces
  -> Cost and Capacity Controller
```

### 关键取舍

#### 一个池还是长短分池

长短分池可以减少超长请求拖慢短请求，代价是容量碎片和调度复杂。用长度分布和 SLO 决定。

#### 全量上下文还是检索

全量拼接实现直观，但增加 Token、噪声和成本。大规模生产通常先按权限检索和重排，再把有限证据交给模型。

#### 大模型还是小模型级联

小 Encoder 可以先做分类和路由，复杂事件再进入生成模型。这样能降低成本，但增加模型间契约和误路由风险。

#### 流式输出还是完整校验后输出

流式改善感知延迟，却难在发送前做完整 Schema 和安全校验。高风险结构化操作更适合完整验证后返回。

#### 自动执行还是只给建议

关键生产变更默认只给证据和建议。达到明确可靠性、权限与回滚条件后，才逐步开放低风险、幂等、可验证动作。

### 容量回答

面试时不要凭空报“每卡多少 QPS”。应回答：

1. 固定模型、精度、Runtime 和卡型。
2. 采集真实输入/输出 Token 分布。
3. 估算权重和 KV Cache。
4. 测短、长和混合负载。
5. 找到 TTFT/TPOT/OOM 拐点。
6. 按单故障域损失后仍满足 SLO 预留容量。

## Transformer 与相邻技术怎么选

| 技术 | 更适合 | 不等于 |
|---|---|---|
| Transformer 架构 | 建模序列上下文、理解和生成 | 完整 AI 应用平台 |
| CNN | 局部结构、图像和特定时序模式 | 所有长距离序列任务都落后 |
| RNN/LSTM | 流式、小模型、特定序列约束 | 一定比 Transformer 慢或差 |
| Gradient Boosting | 结构化表格和可解释基线 | 不能处理任何文本 |
| Embedding 模型 | 向量表示、检索和相似度 | 生成模型或事实数据库 |
| RAG | 给模型检索外部证据 | 模型训练或注意力本身 |
| LangChain / Dify | 编排模型、工具、知识与发布 | Transformer 内部实现 |
| 推理引擎 | 调度、Batch、Cache 和 Kernel 优化 | 模型架构和业务正确性 |

选择时比较：数据类型、任务目标、延迟、吞吐、硬件、可解释性、训练数据、维护能力和失败代价。

## 面试表达

### 30 秒回答：Transformer 是什么

Transformer 是一种以注意力为核心的神经网络架构。它先把 Token 映射为带位置信息的向量，再通过 Q、K、V 计算每个位置应该读取哪些上下文，多头注意力负责跨位置交互，前馈网络负责逐位置变换，残差和归一化帮助深层训练。Encoder 常用于理解，带因果 Mask 的 Decoder 常用于自回归生成。生产上还要关注 Tokenizer、KV Cache、长上下文、显存、延迟、质量和版本一致性。

### 3 分钟回答：一次 Decoder-only 请求怎样完成

请求先经过业务鉴权、限流和脱敏，再由 Prompt Template 拼接证据。Tokenizer 把文本转成 Token ID，并按上下文预算截断或分配。Prefill 阶段一次处理全部输入：每层把隐藏状态投影为 Q、K、V，使用 Causal Self-Attention、FFN、残差和归一化得到上下文，同时建立每层 KV Cache。

接着进入自回归 Decode。每一步只计算当前 Token 的 Q/K/V，当前 Query 读取历史 Cache，输出词表 Logits，再按 Greedy、Sampling 或其他策略选择下一个 Token。新 K/V 追加进 Cache，直到遇到 EOS、长度或业务停止条件。

生产监控要拆 Queue、Tokenize、TTFT、Prefill、TPOT、总延迟、Token 数、Cache 和 OOM。权重、Tokenizer、模板、生成配置和 Runtime 必须作为一个版本包灰度。输出要做证据、Schema 和安全校验，任何运维写操作还要经过审批、幂等、审计和回滚。

## 高频面试题与连续追问

### 1. 为什么 Attention 要除以 `sqrt(d_k)`

回答要点：维度增加时点积方差会增大，Softmax 更容易进入很尖锐的区域，梯度变小。缩放让数值范围更稳定。

追问：是不是所有 Attention 都固定这样缩放？

回答：这是缩放点积注意力的经典设计。具体架构和 Kernel 可能加入温度、归一化或其他变体，要以实现为准。

### 2. Self-Attention 与 Cross-Attention 有什么区别

回答要点：Self-Attention 的 Q/K/V 来自同一序列表示；Cross-Attention 的 Q 来自目标或当前流，K/V 来自另一个上下文，例如 Encoder 输出。

追问：Decoder-only 模型有没有 Cross-Attention？

回答：普通纯 Decoder-only 通常只用 Causal Self-Attention；多模态或特殊条件模型可能加入 Cross-Attention，不能仅凭“Decoder”名称判断。

### 3. Padding Mask 与 Causal Mask 有什么区别

回答要点：Padding Mask 屏蔽补齐位置，Causal Mask 屏蔽未来位置。一个 Batch 可以同时需要两者。

追问：Mask 写错为什么不一定报错？

回答：Shape 可能仍能广播、Softmax 仍能输出数值，但模型读取了不该读的信息或屏蔽了有效信息。需要最小矩阵断言权重。

### 4. Multi-Head 为什么有用

回答要点：不同头在不同投影子空间计算关系，可并行学习多种交互。各头拼接后再映射回隐藏维度。

追问：头数翻倍一定更好吗？

回答：不一定。固定隐藏维度时每头维度会变小，参数布局、Kernel、训练数据和任务都会影响结果，还会改变通信和 Cache 结构。

### 5. Transformer 的复杂度为什么常说是 O(n²)

回答要点：全 Self-Attention 的 Query 与所有 Key 形成长度乘长度的分数矩阵，所以序列维度计算和朴素中间量呈二次增长。

追问：Flash Attention 把复杂度变成线性了吗？

回答：它通过分块和 IO-aware 实现减少中间物化与显存读写，显著改善实际性能，但全注意力的配对计算并没有普遍变成线性。要区分理论计算、额外内存和实际 Kernel。

### 6. KV Cache 为什么能加速，代价是什么

回答要点：它复用历史 Token 的 K/V，避免每步重复计算；代价是显存随层数、并发和上下文增长，还要处理分配、回收、隔离和迁移。

追问：为什么只缓存 K/V，不缓存 Q？

回答：生成当前 Token 时只需要当前 Query 去读取全部历史 Key/Value；过去 Query 的输出已经完成，不会被未来 Token 重新查询。

### 7. Encoder-only、Decoder-only 和 Encoder-Decoder 怎么选

回答要点：按任务可见性和输出协议选。分类/表示先看 Encoder，开放式自回归生成常用 Decoder，输入输出转换可评估 Encoder-Decoder。

追问：参数相同哪个一定更快？

回答：不能只凭家族判断，还要看长度、Batch、Kernel、生成步骤、Cache、硬件和实现。

### 8. Pre-Norm 与 Post-Norm 有什么区别

回答要点：归一化放在子层前或残差相加后，影响训练稳定性和权重结构。现代模型常有自己的 Norm 设计。

追问：能否把训练好的 Post-Norm 模型配置改成 Pre-Norm？

回答：不能把它当作无害开关。计算图变了，已有权重并不因此兼容，需要对应架构和训练验证。

### 9. 为什么模型训练恢复不能只加载权重

回答要点：Optimizer、Scheduler、Scaler、Step、随机状态和数据位置共同决定下一次更新。只加载权重更像重新开始一个训练阶段。

追问：推理回滚为什么也不能只换权重？

回答：Tokenizer、Config、Template、Generation、Adapter 和 Runtime 不一致都会改变行为或导致加载错误。

### 10. 如何排查 Transformer 推理 OOM

回答要点：先区分模型加载、Prefill 和 Decode；记录并发、输入/输出长度、Batch、dtype、KV 头数、Cache、取消回收和其他进程。根据证据做长度/并发限制、量化、分片或扩容。

追问：为什么平均显存不高仍会 OOM？

回答：峰值 Batch、碎片、临时 Workspace、同时 Prefill、其他进程或监控采样间隔都可能掩盖瞬时峰值。

### 11. 如何验证新模型比旧模型好

回答要点：固定业务任务和分层黄金集，同时比较质量、安全、结构、延迟、吞吐、显存和成本，再做稳定灰度。不能只比较通用榜单或一个 Demo。

追问：线上 A/B 输出是概率的，怎么比较？

回答：按稳定分流和足够样本统计业务指标；对需要确定性的评估可固定生成策略，并记录版本和随机条件，但仍承认跨实现非位级一致。

### 12. Transformer 如何安全用于 AIOps 自动化

回答要点：模型只产出带证据的结构化建议；网关和策略层做权限、Schema、白名单、审批、幂等、审计，确定性系统执行并验证结果。

追问：模型置信度很高能否跳过审批？

回答：模型自报置信度不等于校准后的业务风险。是否自动执行取决于动作风险、可逆性、权限、历史可靠性和独立验证。

## 事故复盘题

题目：一次升级后，AIOps 助手对数据库事故给出错误重启建议，并且 P99 延迟上升。你怎么处理？

回答框架：

1. 先停止危险写操作和扩大灰度。
2. 用 Request ID 固定一批失败样本。
3. 核对模型、Tokenizer、模板、Runtime 和生成配置。
4. 比较最终 Token 输入、截断、证据位置和输出。
5. 拆 Queue、Tokenize、Prefill、Decode。
6. 检查 KV Cache、GPU、Batch 和 Kernel。
7. 根据证据回滚完整发布包。
8. 验证旧版质量、延迟和容量恢复。
9. 查错误建议是否已经进入工单或执行链路。
10. 把失败样本加入长度、证据位置、安全和容量发布门禁。

面试官继续追问时，要说清现象、证据、假设、验证、缓解、修复、爆炸半径和回滚，不能只回答“模型有幻觉”。

## 学习检查清单

### 入门层

- [ ] 我能解释 Transformer 是架构，不等于一个具体大模型。
- [ ] 我能区分 Token、ID、Embedding 和位置表示。
- [ ] 我能用人话解释 Q、K、V。
- [ ] 我能写出缩放点积注意力公式。
- [ ] 我能区分 Padding Mask 与 Causal Mask。
- [ ] 我能跑通纯 Python 注意力实验。

### 实战层

- [ ] 我能画出 Encoder、Decoder 和 Cross-Attention 路径。
- [ ] 我能解释 Prefill、Decode 和 KV Cache。
- [ ] 我能读懂 Batch、Head、Sequence、Head Dim Shape。
- [ ] 我能完成未来信息泄漏故障注入并修复。
- [ ] 我能排查截断、Tokenizer、NaN、OOM 和生成不停止。
- [ ] 我能解释 TTFT 与 TPOT 的区别。

### 生产与面试层

- [ ] 我能估算权重和 KV Cache 内存。
- [ ] 我能解释 Attention 的二次长度边界和融合 Kernel 取舍。
- [ ] 我能比较数据、参数、张量和流水线并行。
- [ ] 我能设计多副本、过载保护和 Cache 隔离。
- [ ] 我能设计模型、Tokenizer、模板和 Runtime 一致灰度回滚。
- [ ] 我能建立技术 SLO 与模型质量双重评估。
- [ ] 我能说明 Prompt Injection、供应链和工具调用安全边界。
- [ ] 我能用证据回答系统设计和事故复盘题。

## GitHub 学习证据

建议建立一个小仓库：

```text
transformer-aiops-lab/
  README.md
  attention_lab.py
  tests/
    test_causal_mask.py
  notes/
    attention-formula.md
    encoder-decoder.md
    kv-cache-capacity.md
  incidents/
    causal-mask-leak.md
    long-context-oom.md
  manifests/
    model-release.example.json
  observability/
    metrics.md
    dashboard-screenshot.png
  results/
    normal-output.txt
    fault-output.txt
```

### 最少提交内容

1. `attention_lab.py`。
2. 正常与故障运行输出。
3. 一张 Q/K/V、Mask 和输出的数据流图。
4. 一份 KV Cache 容量估算。
5. 一篇“训练指标很好但线上失败”的排障记录。
6. 一个模型发布 Manifest 示例。

### 提交前检查

- 不提交真实告警、工单、Prompt 和用户数据。
- 不提交模型或服务密钥。
- 不提交无法确认许可证的模型文件。
- 输出和截图完成脱敏。
- README 写清 Python、框架、模型和硬件版本。
- 记录预期结果、失败检查和清理步骤。
- 区分“本机实跑”与“架构设计建议”。

别人能够按 README 复现实验、看到 Mask 故障、理解修复证据，这才是有效的学习项目。

## 学完之后

继续学习：

1. [TensorFlow](./tensorflow.md)：补张量、自动微分、训练和模型交付。
2. [LLM / OpenAI API](./llm-openai.md)：理解模型 API、结构化输出、工具、成本和限流。
3. [RAG](./rag.md)：把外部知识、检索、重排和生成串成完整链路。
4. [向量数据库](./vector-database.md)：理解 Embedding 的存储、索引与过滤。
5. [LangChain](./langchain.md)、[LangGraph](./langgraph.md) 与 [Dify](./dify.md)：学习应用编排与可观测运行。
6. [AIOps 闭环](../sre-aiops/aiops-loop.md)：把模型建议接入审批、执行、验证和学习。

本文提供的是 Transformer 从零到生产讨论的第一版学习主线，不承诺读完即可胜任所有模型训练、GPU 性能或大模型平台岗位。线性代数、概率、Python、深度学习、分布式系统、GPU 架构、安全和真实项目仍需分别训练。
