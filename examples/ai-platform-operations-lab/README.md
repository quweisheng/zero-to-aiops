# AI 平台存量运维离线实验：限流、流式中断与长任务恢复

> 目标：不花钱、不接生产系统，亲自区分“请求收到”“文字开始输出”“业务完成”，并在这组单线程离线序列中验证恢复长任务时不会重复执行副作用。

这不是模型部署示例，也不是乐搭平台的实现说明。它是一组 **Python 标准库事件序列模拟**：没有网络请求，没有模型密钥，没有真实 HTTP 服务，没有真正写工单，也没有真实进程崩溃。HTTP 是 Hypertext Transfer Protocol（超文本传输协议），其状态码在这里仅作为输入数字。代码不会安装依赖或修改配置，结果只打印到标准输出，也就是当前终端。

它不验证真实 LLM（Large Language Model，大语言模型）的推理质量与性能，不验证 MCP（Model Context Protocol，模型/应用连接工具的协议）、A2A（Agent2Agent，智能体间协作协议）、Kubernetes 集群、数据库事务或网络代理。你可以把它作为“AI 运维岗位专项路线”的第一份学习证据，但不能把运行结果写成生产平台治理经历。

## 先想一想：这三个“成功”是不是一回事

想象一个智能体在查询告警、生成诊断结论、向工单补充备注。Agent（智能体）在这里指会按步骤组织任务、选择工具的程序，而不是一个永远可靠的“机器人同事”。你看见接口返回 200，用户也收到几个字，于是宣布任务成功。过了一会儿，工单却没有备注；重跑任务后，又出现两条一样的备注。

我们先不猜哪台机器坏了，而是把判断分成三层：

1. **传输被接受**：这个请求的响应状态是 200，只能说明本次 HTTP 响应所表达的那一层成功，不能推导后台长任务已结束。
2. **应用有进展**：收到一块文字，说明流里出现了数据，不保证文字完整，也不保证后续工具执行完毕。
3. **业务完成有证据**：应用给出了约定的完成状态，长任务保存了完成收据，而且有副作用的写入没有重复。

SSE 是 Server-Sent Events（服务端发送事件）：服务端沿着一个连接持续发事件，客户端一点点接收。这里的 `completed` 是**我们为课堂约定的应用完成事件**，不是 SSE 标准要求所有服务都发送的统一结束标记。真实平台可能使用其他事件、结束字段或任务状态；必须按该平台契约适配，不得看到连接关闭就自动算完成。

这条图里的箭头代表任务推进，下面一行代表恢复所依赖的状态，不是所有组件都直接互相发网络请求：

```text
请求被接受 -> 收到部分文字 -> 完成事件 -> 业务结果可核对
长任务：采集证据 -> 记录待执行步骤和操作键 -> 工具执行 -> 记录收据
```

今天不要求你先学完整个 Python 或 Kubernetes。你只要知道“终端是输入命令的窗口”“文件路径是找到脚本的位置”“JSON 是带名称和值的结构化文本”。想补前置，只看 [实验准备](../../docs/tech-stack/experiment-start.md) 中的 Python、终端与运行目录；随后看 [Python 精讲](../../docs/tech-stack/foundation/python.md) 的函数、字典和测试，以及 [RESTful API 精讲](../../docs/tech-stack/foundation/restful-api.md) 的状态码、超时和幂等性。

## 一、工具与运行位置：先完成正常基线

需要 Windows PowerShell 或 Linux/macOS 终端，Python **3.10 或更新版本**，以及完整仓库。这三个文件是：

```text
examples/ai-platform-operations-lab/
  README.md    课堂讲解与验收方法
  lab.py       一次运行正常基线和三类故障序列
  test_lab.py  自动测试恢复、停止与反例
```

不需要管理员权限，不需要 `pip install`，也不需要启动 Docker。CPU、内存需求很小，程序使用虚拟等待而不真的睡眠。下面全部命令都**从仓库根目录运行**，不是从 `docs` 或脚本所在目录随意执行。

Windows，仓库位于 `D:\zero-to-aiops`：

```powershell
Set-Location -LiteralPath 'D:\zero-to-aiops'
python --version # 确认是 Python 3.10 或更高，不是商店占位提示
python -B examples/ai-platform-operations-lab/lab.py
if ($LASTEXITCODE -ne 0) { throw '实验未通过，先阅读终端错误，不继续当作成功' }
python -B -m unittest discover -s examples/ai-platform-operations-lab -p 'test_*.py' -v
if ($LASTEXITCODE -ne 0) { throw '测试未通过，保留报错后排查' }
```

Linux/macOS，假定你已把仓库放在当前用户的 `zero-to-aiops` 目录；若放在别处，只改第一行路径：

```bash
cd "$HOME/zero-to-aiops" || exit 1
python3 --version # 确认 Python 3.10 或更高
python3 -B examples/ai-platform-operations-lab/lab.py || exit 1
python3 -B -m unittest discover -s examples/ai-platform-operations-lab -p 'test_*.py' -v || exit 1
```

`-B` 告诉 Python 不生成字节码缓存文件；`-m unittest` 调用随 Python 自带的测试工具；`discover -s` 指定寻找测试的目录，`-p` 指定文件名模式，`-v` 逐项显示结果。它们不连接任何远端。直接执行 `python lab.py` 也能运行，但那要求你已经进入本实验目录；主路线采用仓库根目录命令，避免混淆。

如果 `python` 不存在，先按实验准备完成安装并重新打开终端；已经安装 Windows Python Launcher 时，也可以先确认 `py -3 --version`，再将上面 `python` 换成 `py -3`。不要跳过版本检查，使用来源不明的安装程序，或为这个离线实验添加模型密钥。

### 看哪些结果，才算这一课跑通

输出是一份 JSON，默认应当满足下面的条件；这里是**预期验收规则**，不是你本机已经运行的记录。

| 位置 | 默认预期 | 它证明什么 |
|---|---|---|
| `evidence_scope` | `offline_event_sequence_simulation` | 数据是离线序列，不是真实服务日志 |
| `network_calls`、`persistent_writes`、`real_sleep_seconds` | 都是 `0` | 没有远程请求、持久写入或真实等待 |
| `normal.rate.outcome` | `completed` | 正常非流式响应基线完成 |
| `normal.stream.outcome` | `completed` | 正常流看到本课堂约定的完成事件 |
| `normal.agent.recovery.outcome` | `completed` | 正常任务有保存的完成收据 |
| `classroom_checks_passed` | `true` | 课堂对照与安全停止条件通过，不代表真实平台健康 |

接着阅读 `faults`（故障序列）中的三项。正常基线与故障应一同出现；故障检测成功也可能是 `incomplete` 或 `paused_unknown`，不能把这些状态改名为“任务成功”。测试正常结束时显示 `OK`。

## 二、429：为什么不能“失败就一直重试”

429 通常表示请求太多或当前配额条件不允许继续。本实验把它作为“可按策略等待后重试”的输入，但真实平台也可能是余额、项目额度、租户限额耗尽；那时反复重试不会补上额度。先核对错误类型、模型/租户、配额、并发和时间窗口，再决定能否恢复。

默认输入是 `[429, 429, 200]`。程序第一次收到 429，安排虚拟等待 1 秒；第二次安排 2 秒；第三次得到完整的非流式响应，结束。指数退避就是失败后逐步延长等待，这里按 1、2、4 秒增长并设上限。它减少立即重试造成的额外压力；它不能保证模型服务会恢复。

`Retry-After` 是服务端可能给出的“何时再试”提示。本实验只接受**相对秒数**作为参数，不解析真实 HTTP 头、日期格式或时钟偏差。等待不能小于这个提示；提示超过课堂等待上限 4 秒时，我们停止并交给更高层安排，而不是截成 4 秒提前请求。生产系统还应考虑随机抖动、每租户并发隔离、队列长度、取消信号和总调用时间，不能照搬这个虚拟调度器。

先预测，再运行：

```powershell
python -B examples/ai-platform-operations-lab/lab.py --rate-failures 8 --max-attempts 3
python -B examples/ai-platform-operations-lab/lab.py --budget-seconds 2
python -B examples/ai-platform-operations-lab/lab.py --retry-after 30
```

在 Linux/macOS 把 `python` 换成 `python3`。参数里 `--rate-failures` 是成功前连续 429 的个数，`--max-attempts` 是**包含首个请求**的总尝试上限。`--budget-seconds` 限制累计虚拟等待，不是包含排队、网络和推理耗时的真实端到端超时；本模拟没有这些耗时。

三个反例的准确预期：

- 8 次限流、最多尝试 3 次：`faults.rate_limit.outcome=stopped_attempt_budget`，`attempts=3`，等待仍为 `[1,2]`，最后一次失败后不再多等一次。
- 等待预算 2 秒：`outcome=stopped_wait_budget`，`attempts=2`，已等 1 秒；下一次想等 2 秒会超过累计预算，所以不发第三次请求。
- 提示等 30 秒：`outcome=stopped_retry_after_exceeds_cap`，`attempts=1`，等待列表为空；不是偷偷提前重试。

默认验收字段则是 `faults.rate_limit.statuses=[429,429,200]`、`attempts=3`、`scheduled_delays_seconds=[1,2]`、`outcome=completed`。如果你得到其他状态，先看输出顶部的 `parameters`，确认自己是否还带着上一轮反例参数；不要为了得到 `completed` 无限增大预算。

## 三、流式中断：200 和几个字为什么不是完成

默认故障流只经过“200、第一块文字、断开连接”。在 `faults.stream_interrupted.failure` 中，你会同时看到：

```json
{
  "http_status": 200,
  "first_chunk_seen": true,
  "completion_marker_seen": false,
  "outcome": "incomplete"
}
```

这说明请求层已经给出响应，应用输出开始了，但业务完成没有证据。`partial_text` 是当前接到的片段，不能以最终答案展示给用户或据此自动执行修复。如果用户说“回答一半就没了”，先保存请求标识、开始/首块/最后事件时间、网关与应用日志、上游结束原因，再区分代理超时、连接取消、服务崩溃或模型侧终止。状态码只能排除一部分假设，不能单独定位根因。

试着换一个断点：

```powershell
python -B examples/ai-platform-operations-lab/lab.py --stream-failure timeout
python -B examples/ai-platform-operations-lab/lab.py --stream-failure missing-completed
python -B examples/ai-platform-operations-lab/lab.py --stream-failure unknown-event
```

`timeout` 是已接到部分数据后发生超时；`missing-completed` 是序列自然结束却缺少完成标记；两者都应 `incomplete`。`unknown-event` 表示适配器不认识输入事件，应 `stopped_invalid_event`，先检查接口契约，不能臆造“它大概是完成”。这些模拟没有真的测量超时秒数，也没有证明 Nginx、Ingress、浏览器或模型网关的配置。

课堂恢复将故障输入替换成已知正常序列，模拟**允许重做的只读生成**重新开始：`recovery.outcome=completed`，完整内容是 `diagnostic summary`。`recovery_policy=discard_partial_and_start_new_read_only_generation` 表示丢弃第一轮片段，再按新结果展示。我们不把两次片段直接拼接，也没有实现网络断点续传。真实任务如果流里还能触发工具、扣费或写数据，必须先核对副作用与幂等规则，不能照搬这个只读恢复办法。

注意一个反例：即使日志中出现过 `completed`，后面又出现非法数据，本模拟也可能判为协议异常。`completion_marker_seen` 记录“曾经看见”，最终验收仍看 `outcome` 和业务收据，不能只抓一个字段。

## 四、长任务：从检查点恢复，为什么还要幂等

checkpoint（检查点）是保存“任务走到哪里、依赖哪些输入”的记录。它的作用不是让进程永远不宕机，而是宕机后不必凭记忆重跑所有步骤。在本实验里，采集阶段先完成，然后保存 `pending_write`（等待执行或核对写入）状态、稳定操作键与写入内容。

副作用指改变外部世界的操作，例如补工单、发通知、修改配置。幂等是同一个逻辑操作重复提交时，不重复产生这类改变。这里 `key`（幂等键）标识同一操作；相同键与相同内容取回原收据，相同键但内容变了就暂停，不能拿旧结果冒充新执行。键只存在于示例内存，不是模型密钥。

默认故障在工具**已经受理并执行**之后丢失响应。你会观察到这组看似矛盾但合理的证据：

- `before_recovery.phase=pending_write`：任务检查点没有收到收据，还不敢记成完成。
- `writes_before_recovery=1`：模拟工具账本已发生一次副作用。
- 恢复时先查询账本，发现同键操作已完成，再用同键同内容取原收据。
- `recovery.decision=reuse_receipt`，`recovery.outcome=completed`，`side_effect_writes=1`：恢复之后没有多写一次。

这些字段都在 `faults.long_task_interrupted` 下。`collect_runs=1` 表示恢复不重新跑已记录的采集阶段。`schema_version` 是检查点格式版本；格式、必要字段或状态缺失时，测试要求停在 `paused_invalid_checkpoint`，不能猜出缺失的输入后继续。

现在把失败位置挪到写入之前，或让查询结果无法确认：

```powershell
python -B examples/ai-platform-operations-lab/lab.py --agent-failure before-write
python -B examples/ai-platform-operations-lab/lab.py --agent-failure unknown-state
```

`before-write` 时，恢复前副作用为 0；权威账本确认同键记录不存在，才执行一次，恢复后为 1。`unknown-state` 时，工具已经执行一次，但恢复查询不可确认；此时应 `recovery.outcome=paused_unknown`，检查点仍为 `pending_write`，副作用仍为 1。**不知道，不等于没执行。** 暂停、记录待核对对象和交给人工，是这轮安全行为的成功，不是长任务成功。

这里的账本是单线程内存字典，键检查和增加计数在同一调用中完成；查询“没有记录”被明确设定为权威结果。真实生产中的最终一致读、账本过期、并发提交、数据库事务崩溃、双写窗口、消息重复投递和多租户键隔离并未实现。真正的方案需要持久存储、原子唯一约束/事务、状态与收据核对、保留期限、任务取消规则；只有工具端提供受控幂等契约时才可用稳定键安全重放。不能把这个实验讲成分布式 exactly-once（恰好一次执行）证明。

本实验所谓“恢复”只把检查点做一次 JSON 内存往返，不启动第二个进程、不保存磁盘、也不模拟断电。它训练的是判断和控制分支，不是持久化可靠性。深入可以继续读 [LangGraph 精讲](../../docs/tech-stack/data-ai/langgraph.md) 中的状态、检查点和恢复边界。

## 五、机器验收、失败排查与清理

自动测试不是只看“程序没报错”，它断言：429 的次数与等待预算、不可重试状态停止、没有完成标记不能成功、非法事件顺序停止、重复写只产生一次副作用、同键异内容冲突、检查点缺字段停止、CLI 非法参数退出。CLI 是 Command-Line Interface（命令行接口），就是你通过参数启动程序的入口。

| 结果 | 应怎样理解 |
|---|---|
| 退出码 `0`，`classroom_checks_passed=true` | 课堂断言通过；包括预期的安全停止，不代表模型/平台可用 |
| 退出码 `1` | 某项课堂安全断言没有满足，应保存 JSON 中 `checks` 为 `false` 的项，不继续记“通过” |
| 退出码 `2`，终端出现 `error` | 参数非法，如负预算、`nan`、超出尝试上限；先修参数，未执行故障课堂 |
| `unittest` 显示 `FAILED` 或导入报错 | 先确认路径、Python 版本、脚本是否完整，再看具体失败用例 |

若提示找不到文件，先检查当前是否在仓库根目录、是否下载了整个仓库而不是网页单篇。若显示 `No module named lab`，使用正文中的 `discover -s` 命令，不要凭记忆在错误目录调用测试模块。若屏幕输出很多，先找顶层 `parameters`、最后的 `checks`，再逐段核对三类故障，不要把片段截成“全部成功”。

默认无需清理：运行结束，内存检查点和模拟账本就消失；下一次运行从零开始。`-B` 不产生本目录缓存，没有后台服务、端口、容器、凭证或需要删除的数据库。你如果主动保存终端输出，文件由你自己选位置、自己保留，不需要运行任何递归删除命令。

### 本仓库实际检查记录

2026-10-14，Windows PowerShell / Python 3.14.5：实际运行默认脚本、参数反例和本目录 `unittest`。这些记录验证的是**本地 Python 模拟及其断言**，Linux/macOS 命令是兼容标准库的使用路径，尚不是该操作系统的实跑记录；真实乐搭/模型供应商/MCP/A2A/Kubernetes 未运行。最终测试数量以当前终端报告为准。

## 六、把实验变成 AIOps 与面试证据

AIOps 是把指标、日志、关联分析和受控自动化用于运维的工作链。这里你已经有三类可变成结构化日志的字段：尝试数与限流状态、流首块与结束原因、任务检查点与副作用收据。把它们关联到同一 `task_id`、请求标识和租户，在生产里才有条件回答“谁失败、失败在哪层、是否可以重放”；本模拟没有真的接入监控系统。

指标可以统计单位时间限流比例、未完成流比例、待人工核对任务数，告警附上证据查询链接，Runbook（操作手册）写清何时停止、谁批准恢复。不要把提示词全文、客户知识库或访问令牌直接当日志上传。对外提交的学习证据只用这里的合成文本。

面试 30 秒可以这样开头，但请换成你自己的表述：“我做了一组离线状态实验：429 退避有次数和等待上限，SSE 接到 200 与部分文字仍要等待应用完成证据，长任务恢复先核对操作状态并使用稳定幂等键。查询不可确认时暂停，不盲目重放。它验证了判断逻辑，没有证明真实平台的容灾能力。”

3 分钟讲法：先画请求层、流输出层、任务状态、工具账本的路径；拿默认的 `pending_write` 与账本已写一次解释为什么不能靠检查点单独推断是否执行；最后说明副作用不能回滚时如何缩小影响范围、找权威收据、维持暂停并升级给负责人。

连续追问练习：

1. 面试官问“429 都可以重试吗？”答：不一定，配额耗尽/永久限制要修额度或策略；本实验只是特定可重试输入。追问一万个客户端同时退避怎么办，要补随机抖动、全局/租户并发预算和排队约束。
2. 问“200 为什么还算失败？”答：200 是本次响应的一层证据，流式业务还要校验应用结束契约。追问结束标记没有收到但任务可能已完成，要查询任务状态，不能把断线直接映射为成功或重跑许可。
3. 问“幂等键是不是保证恰好一次？”答：不是，依赖工具端存储、原子检查、内容绑定和保留期限。追问同键换参数，本实验暂停冲突；生产需拒绝、审计和核对，不自动覆盖。
4. 设计题：“每天 5 万个长任务、外部工具非幂等，状态查询还会延迟，你如何恢复？”先划分只读步骤与副作用，确认状态来源与 RTO/RPO（恢复耗时与可接受数据损失目标），对未知执行先暂停；比较提供工具端幂等/持久收据与人工核对两个方案，不给‘多副本就好了’的答案。

### 合上教程，独立通关

1. 把连续限流设为 3 次、总尝试仍为 4。先写尝试和等待预测，再运行核对。判据：默认等待预算 10 秒下为 `[1,2,4]`、4 次尝试且完成；若预算改成 6 秒，第三次 429 后必须停止，不能等完 7 秒。
2. 不改变 HTTP 200，只删除完成事件。判据：结果不完整，不能用状态码辩解“已经成功”；回看流式小节区分事件契约与连接关闭。
3. 换成 `unknown-state`，说明两个假设：工具已执行但查询不可达；工具未执行且响应也丢失。判据：现有未知查询无法区分，先暂停，并说出需要权威收据/账本证据，不重复写。
4. 在测试副本里设计“同一键但不同备注”用例，先预测再执行。判据：冲突暂停，副作用数量不增；不得通过换键绕过保护，再说“恢复成功”。
5. 不看答案录一段 3 分钟说明，回答“如果内存账本随进程消失呢？”判据：主动承认模拟缺少持久化、真实并发和断电覆盖，提出下一步验证计划；不能包装为真实生产经历。

GitHub 学习成果可以包含：脱敏的运行截图、默认与一组参数变化的 JSON、测试报告、你自己画的状态路径、一次“未知状态为何暂停”的复盘，以及你写的新增反例测试。复盘按“现象—证据—假设—反证—修复边界—复测—剩余风险”写，不必堆模型名；能解释你实际观察到的结果，比一张全绿截图更能承受追问。
