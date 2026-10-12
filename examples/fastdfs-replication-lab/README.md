# FastDFS 异步副本课堂实验

这个实验只使用 Python 标准库，在你电脑的自有临时目录里放两份小文件。我们借它观察三个容易混在一起的事实：节点报告存活、某个文件是否存在、文件的字节是否正确。它们需要不同的证据。

先说清边界：这里没有安装 FastDFS，也没有实现它的协议、Tracker 调度、Storage 复制日志、网络或高可用。两份文件是本地模拟副本，`ACTIVE` 是脚本设置的模拟存活值。实验输出不能证明真实 FastDFS 何时确认写入、怎样选择下载节点、多久完成复制。脚本中的手工复制步骤，只用于让你观察“先有一份，再补齐另一份”的时间窗口。

## 开始之前

需要 Windows、Linux 或 macOS，以及 Python 3.9 以上版本；不用下载任何 Python 包，不连接外部服务。文件总量不到 1 KB。脚本使用 `tempfile.TemporaryDirectory`，每次创建独立目录，正常完成或发生 Python 异常时自动清理这次实验的目录，不扫描或删除用户的存储目录。强制结束进程或断电可能来不及清理临时目录，正常运行的输出会说明清理结果。

下列命令在仓库根目录执行。如果你的系统把 Python 3 命令命名为 `python3`，把命令中的 `python` 改成 `python3` 即可。先运行 `python --version`，预期看到 `Python 3.x.y`；找不到命令时，先处理 Python 安装或路径问题。

```bash
python examples/fastdfs-replication-lab/lab.py --help
```

预期看到 `demo`、`fault`、`capacity` 三个子命令。Windows PowerShell 同样可以逐条执行这些命令；命令中的相对路径从仓库根目录开始。

## 基础实验：预测上传后另一份副本在哪里

先做一个预测：如果上传节点已经写入，复制步骤还没开始，此时另一节点可能仍然报告存活吗？文件是不是一定已经存在？带着这两个问题运行：

```bash
python examples/fastdfs-replication-lab/lab.py demo
```

脚本打印 JSON，也就是有字段名的结构化记录。以下是应该核对的预期现象，不是真实 FastDFS 命令输出：

| 阶段字段 `stage` | 预期观察 | 这条证据说明什么 |
|---|---|---|
| `upload_ack_before_replication` | a 为 `MATCH`，b 为 `MISSING`，两个模拟节点都为 `ACTIVE` | 模拟上传确认时仍可能只有一份内容 |
| `lost_response_and_business_retry` | `retry_created_new_object=false`，`objects_created=1` | 本次进程内，同键同内容重试复用了原来的对象 |
| `after_manual_replication_step` | a、b 均为 `MATCH`，摘要与 `expected_sha256` 一致 | 推进模拟复制后，两份本地字节均与上传内容匹配 |

`MATCH` 表示计算出的 SHA-256 与预期一致；SHA-256 是把文件内容计算成固定长度摘要的算法。`MISSING` 表示目标文件不存在；`MISMATCH` 表示文件存在但摘要不同。`simulated_status=ACTIVE` 只表示这次教学设定的“节点存活”，不来自端口探测、FastDFS 监控或生产日志。

结尾的 `all_checks_passed=true` 表示脚本预设的实验断言通过，`temporary_data_cleaned=true` 表示本次自有临时目录已移除。看到这些值只能验收这个本地实验，不能据此验收真实集群。

### 丢了响应，为什么要业务键

想象用户点击一次“提交附件”：文件实际保存了，返回给用户的响应却在途中丢了。用户再次点击，如果应用每次都生成新对象，就可能留两份相同内容。这里用 `teaching-attachment-001` 代表一次业务操作的唯一标识，叫业务幂等键。幂等在这里的含义是：同一操作重复提交，不额外创建对象。

脚本故意把第一次响应标记为“客户端没收到”，然后用相同业务键和相同字节重试。它返回同一个模拟对象标识；如果相同键被换成另一份字节，立即拒绝，输出 `same_key_different_content_rejected=true`。这样能防止把“重复提交”和“偷偷换内容”混成一种行为。

这个映射只存在 Python 进程的内存中。下一次重新运行脚本，是全新的课堂，不会接着上一次的映射继续处理。它没有实现跨进程并发控制、数据库持久化事务、崩溃后的孤儿文件回收，也不证明 FastDFS 自动提供业务幂等。真实应用还需要约束业务键的租户和操作范围，用持久记录区分处理中、已完成、未知结果与失败，保存文件标识，并设计超时后的查询和对账。文件内容相同也不能直接认定属于同一用户或有相同访问权限。

## 故障实验：两个 ACTIVE 为什么还能读不到或读错

只在脚本自己创建的临时目录里做故障注入。先运行：

```bash
python examples/fastdfs-replication-lab/lab.py fault
```

脚本先建立两份正确文件，保存基线；接着删除本次临时目录中 b 的那份副本。两个模拟节点仍为 `ACTIVE`，但 `active_but_replica_missing` 阶段的 b 变成 `MISSING`。此时再多看几遍“节点存活”，也不能把文件找回来；需要检查目标文件及复制进度。

脚本随后核对 a 的源文件摘要与最初上传记录一致，才人工模拟复制，得到 `repair_missing_and_retest`。这个验证顺序很关键：盲目选择一个“能读到的文件”当源，可能把错误复制给更多节点。

第二次故障把 b 的第一个字节翻转一个比特，即把该字节的一位从 0 变为 1，或从 1 变为 0。无论原字节是什么，这一步都会改变内容；不是偶尔才触发的随机损坏。`active_but_checksum_mismatch` 阶段应显示 a 为 `MATCH`、b 为 `MISMATCH`，且两个模拟节点仍为 `ACTIVE`。随后从经过校验的 a 人工恢复 b，`repair_corruption_and_retest` 中两者再次为 `MATCH`。

请按“现象 → 证据 → 假设 → 验证 → 人工模拟修复 → 复测”写一份排障记录。基础实验展示短暂不同步；故障实验展示持续缺失和字节损坏。真实事故需要结合业务请求路径、目标文件标识、节点日志、复制队列或日志进度、网络、磁盘与可信源判断原因。不要把这里的本地复制操作照搬成生产 FastDFS 的修复步骤。

## 容量实验：70 TB、两份、保留 20% 空闲

```bash
python examples/fastdfs-replication-lab/lab.py capacity --logical-tb 70 --copies 2 --reserve-percent 20
```

预期 `raw_required_tb=175.0`。计算是 `70 × 2 ÷ (1 - 20/100) = 175`：70 TB 业务数据存两份，需要 140 TB；若 140 TB 最多占物理总量的 80%，则物理总量至少为 175 TB，另留 35 TB 空闲。这里的 20% 以最终物理总容量为分母，所以不是把 140 TB 直接乘以 1.2。

`--logical-tb` 是一份业务数据的总量，要求有限且大于 0；`--copies` 是总副本数，包含最初那一份，要求正整数；`--reserve-percent` 是物理总容量中的空闲比例，要求大于等于 0、小于 100。`TB` 使用十进制容量单位；如果现场使用 `TiB`，先把所有输入统一单位再比较。副本是保存多份同一数据，不等于保留删除之前的历史，所以这条公式没有给你算备份。

这个数只是“数据副本 + 指定空闲比例”的规划下限，不包含文件系统与元数据开销、碎片、快照、备份、增长、重建期间的额外空间和故障域约束。脚本使用浮点数演示公式，不应替代真实资产容量、存储效率和故障重建的核算。

试着把预留比例改为 100，或把副本数改为 1.5。命令应返回非零退出码，并说明参数错误；它不会输出一份计算成功的证据。`NaN`、无穷大、负容量、零副本，以及计算溢出也会被拒绝。

## 保存证据与检查失败

所有子命令都支持 `--output`。它只创建一个新 JSON 文件，绝不覆盖已有文件；目标父目录必须已经存在。先选一个没有使用过的文件名，例如：

```bash
python examples/fastdfs-replication-lab/lab.py demo --output fastdfs-demo-evidence.json
python examples/fastdfs-replication-lab/lab.py fault --output fastdfs-fault-evidence.json
python examples/fastdfs-replication-lab/lab.py capacity --logical-tb 70 --copies 2 --reserve-percent 20 --output fastdfs-capacity-evidence.json
```

如果你已经用过这些文件名，换一个新的名字。正常完成返回退出码 0；参数错误通常为 2，断言、输出文件、文件系统或计算错误为 1。Windows PowerShell 可在每条命令后查看 `$LASTEXITCODE`，Linux/macOS shell 可查看 `$?`。证据文件是你主动要求保留的输出，不会随临时副本一起清理。

如果没有成功，先按以下顺序检查：

1. Python 版本和当前目录是否正确；复制的是完整命令还是其中的一部分。
2. 是否把 `demo` 的预期步骤与 `fault` 的阶段混在一起；本实验两个节点的存活值始终是模拟值。
3. 临时目录是否可写，或本地防护软件是否阻止 Python 创建与读取文件；先看完整错误信息，不关闭系统保护来跳过问题。
4. `--output` 指定的文件是否已经存在、父目录是否存在、目录是否可写。已有文件会被拒绝，这是预期保护。
5. 计算参数是不是有限数值，副本数是不是整数，预留是不是小于 100；极端输入的浮点结果溢出也会拒绝。

正常结束时临时副本自动消失。保留你需要的 JSON、终端截图和课堂笔记；不再需要证据文件时，仅删除你自己明确创建的那几个文件即可，实验不要求清空任何目录。

## 可以提交什么到 GitHub

提交这个脚本、一份 `demo` JSON、一份 `fault` JSON、容量计算，以及一篇短笔记：“为什么节点 ACTIVE、文件存在和内容正确需要三种证据？”在笔记中明确这些是本地模拟与真实哈希，不是真实 FastDFS 运行结果。AIOps 自动分析可以学习这些检查条件，但生产自动化还需要真实采集、审批、修复范围、可信源和回滚证据。
