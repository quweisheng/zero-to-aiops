# VictoriaMetrics

> 学习目标：能理解 VictoriaMetrics 为什么适合作为 Prometheus 兼容的时序数据存储，能讲清单机版、集群版、vmagent、vmalert、MetricsQL、remote write、retention、cardinality 和 Grafana 查询链路，并能跑通一个最小指标写入和查询实验。

## 老师先带你认路

今天先不部署整套监控平台。我们只做一件可验收的事：向本机存储写入一个带服务名的数字，再确认它在什么时间、什么标签条件下能被查询。然后故意把样本时间移到十分钟前，观察为什么“接收成功”和“当前图表有数据”不是一回事。

前置概念从零开始：指标是用数字描述系统状态；标签是区分数字属于谁的维度；端口是程序接收请求的编号；进程是运行中的程序；容器是隔离运行程序的环境。你无需先理解 Kubernetes。需要补 Docker 的启动、端口与数据卷知识时读 [Docker](../cloud-native/docker.md)，需要区分计数器和瞬时值时读 [Prometheus](./prometheus.md) 对应部分即可。

真实课堂采用 Windows PowerShell 和 Docker Desktop 的 Linux 容器，预留本机 8428 端口、约 2 GB 空闲内存与少量实验磁盘，容器本身限制 1 GB。这个预算只用于几条样本，不是生产选型结论。没有 Docker 时先做现有 Node.js 合成演练，仍可理解序列与容量；它不证明 VictoriaMetrics 已启动或恢复可用。先读基础实验，再回到复制、保留和生产设计，第二遍练习解释每一处取舍。

## 官方资料

优先读这些 VictoriaMetrics 官方资料：

- [VictoriaMetrics Quick start](https://docs.victoriametrics.com/victoriametrics/quick-start/)
- [Single-node VictoriaMetrics](https://docs.victoriametrics.com/victoriametrics/single-server-victoriametrics/)
- [VictoriaMetrics Cluster](https://docs.victoriametrics.com/victoriametrics/cluster-victoriametrics/)
- [vmagent](https://docs.victoriametrics.com/victoriametrics/vmagent/)
- [vmalert](https://docs.victoriametrics.com/victoriametrics/vmalert/)
- [MetricsQL](https://docs.victoriametrics.com/victoriametrics/metricsql/)
- [VictoriaMetrics topologies](https://docs.victoriametrics.com/guides/vm-architectures/)
- [Grafana integration](https://docs.victoriametrics.com/victoriametrics/integrations/grafana/)

说明：本文按 VictoriaMetrics 官方资料结构整理，用 AIOps 指标存储、长期查询、告警规则和 Grafana 数据源场景重新讲解，不复制官方全文。

## 官方知识地图

VictoriaMetrics 官方资料可以按这张地图理解：

```text
VictoriaMetrics（时序数据存储与查询系统）
  -> install（安装）
     -> single-node（单机模式）
     -> cluster（集群模式）
     -> cloud（托管云形态）
     -> helm / operator（包管理或控制器部署）
  -> write data（写入数据）
     -> Prometheus remote write（Prometheus远端写入）
     -> vmagent scrape and remote write（vmagent采集与远端写入）
     -> import APIs（数据导入接口）
  -> query data（查询数据）
     -> Prometheus-compatible API（兼容Prometheus的接口）
     -> MetricsQL（VictoriaMetrics查询语言）
     -> VMUI（内置查询界面）
     -> Grafana（仪表盘平台）
  -> alerting（告警处理）
     -> vmalert（规则计算组件）
     -> recording rules（预计算记录规则）
     -> alerting rules（告警规则）
     -> Alertmanager（告警处理器）
  -> productionization（生产化）
     -> retention（保留期）
     -> capacity planning（容量规划）
     -> backups（备份）
     -> limits（资源限制）
     -> security（安全）
  -> cluster（集群模式）
     -> vminsert（写入接收组件）
     -> vmstorage（数据存储组件）
     -> vmselect（查询组件）
```

本文覆盖：

1. VictoriaMetrics 与 Prometheus 的关系。
2. 单机版和集群版的使用边界。
3. vmagent、vmalert、MetricsQL 和 Grafana 的位置。
4. 最小 Docker 实验：写入一条指标并查询。
5. 常见排障：写不进去、查不到、cardinality 过高、retention 配错。

## 老师带你从“存得下”走到“查得准、能恢复”

假设你已能在 Grafana 看到曲线，现在想保留三个月历史并汇总多个环境。先把工作分开：采集器去拿数字，存储系统保留数字，查询程序解释数字，规则程序根据数字判断是否报警。VictoriaMetrics 可以承担时序存储和查询，也提供采集与规则组件；产品名字相近，不等于这些组件职责相同。

Time series（时间序列）由指标名与完整标签集合标识，Sample（样本）是某个时间的值。`service=checkout` 和 `service=payment` 属于不同序列，实例标签变化也可能产生新序列。先能看懂这一点，才能理解后面的容量、去重和查询。

### 第一课：采集成功与远端保存成功有什么差别

vmagent 抓到了指标，但远端写入可能失败。它可以将待发送数据暂存在队列，网络恢复后继续发送。`-remoteWrite.tmpDataPath` 指定持久队列位置，`-remoteWrite.maxDiskUsagePerURL` 限制每个远端地址的磁盘缓冲；达到限制时会丢弃最旧缓冲以接收新数据。具体行为参考 [vmagent 持久队列说明](https://docs.victoriametrics.com/victoriametrics/vmagent/)。

因此“有磁盘队列”不是“不丢数据”的无条件保证。你要知道队列是否挂在持久盘、可用空间是多少、平均进入速率与恢复后的发送速率是什么。假设积压 60 GB，恢复后净排空速率仅每秒 10 MB，理想情况下也要约 100 分钟；还需要考虑新数据、抖动和重试。

发送目标路径、租户、协议和认证都要匹配。单机与集群的写入、查询入口不同，不要把 `vminsert`（写入接收）地址当查询地址。查询“没有这条数据”时，分别检查采集、队列、写入、租户、指标名、时间和标签，逐段缩小问题。

### 基础实验与故障实验：容量为何突然放大一千倍

前置条件是 Node.js，在仓库根目录运行合成模型，不启动存储服务。

```powershell
node examples/teacher-led-reliability-lab/telemetry.mjs victoriametrics
node examples/teacher-led-reliability-lab/telemetry.mjs victoriametrics --fault
```

正常为 10,000 条序列，每 15 秒采一次，一天约 57,600,000 个样本。故障模式加入能与原组合形成 1,000 倍组合的标签，序列变成 10,000,000，样本也放大一千倍。`labelMultiplier` 是课堂标签组合倍数，`samplesPerDay` 是估算样本数，`issue` 提醒超过本模型预算。

先用 `序列数 × 86400 ÷ 抓取间隔秒数` 复算。输出不符先检查目录和参数。实验不写文件、不连接服务，无须清理；保留正常与故障输出。公式不是磁盘字节公式，实际容量要测压缩、索引、活跃序列变化和查询负载，不能用固定每样本字节数包打天下。

### 第二课：读写分离后的状态在哪里

单机版在一个进程中组合写入、存储与查询，操作相对集中。集群把入口、数据保存与查询拆为 `vminsert`、`vmstorage`、`vmselect`。读写分工让不同层可以扩展，但数据仍由存储层负责。增加查询进程不能修复底层磁盘已满，增加写入入口也不能自动提升存储写能力。

多副本采集同一目标可能带来重复样本。去重的前提是标签和时间策略符合预期；同名但不同业务含义的数据不能因为“看起来重复”就合并。配置去重间隔前先核对采集周期、HA 标签处理和希望保留的分辨率，再用固定输入验证。

Retention（保留期）决定数据何时退出可查询范围，备份决定其他时间点如何恢复，复制提高某些故障下的可用性。这三件事互不替代。误删会影响在线数据，副本可能一起反映错误；备份若未验证恢复，也不能证明可用。

### 第三课：慢查询怎样定位而不乱调上限

先查一个指标和一个实例的短窗口，确认数据存在；再增加标签、时间范围和聚合。范围越长、序列越多、步长越小，通常需要处理更多数据。Recording rule（记录规则）把常用结果预计算，可以减少重复成本，但也占规则计算与存储资源，并固定了一部分聚合口径。

MetricsQL 是 VictoriaMetrics 的查询语言，和 PromQL 有兼容与扩展关系。迁移时对你实际使用的表达式逐条回归，比较空值、窗口和边界数据，而不是凭兼容标签假定全部结果完全相同。仪表盘、告警和 AIOps 特征计算都可能依赖这些细节。

生产要看活跃序列、样本进入速率、队列积压、查询耗时、磁盘余量和数据新鲜度。查询成功但返回旧窗口，不代表写入健康；写入健康但租户配置错，用户也可能查不到。为租户入口配置身份与权限，限制昂贵查询，并对敏感指标名和标签进行治理。

### 第四课：升级、恢复和课堂反证

升级前记录组件版本、参数、数据路径、租户路由、规则和备份位置，读目标版本兼容说明。先在隔离环境用固定样本验证写入、范围查询和规则结果，再逐步推进。回滚不仅要有旧镜像，还要确认新版本写入的数据格式和状态是否支持旧版本读取。

故障模拟再加一个问题：“采集进程所在节点丢失，队列放在容器临时目录。”学生应能推断重建进程并不恢复丢失的队列文件。修订方案把持久缓冲与故障域、容量告警、恢复流程一起定义，再用隔离部署演练确认。纸面推导先标为模拟，不能当真实节点故障验证。

### 面试课堂：30 秒、3 分钟和连续追问

30 秒：“VictoriaMetrics 保存并查询时序数据，vmagent 负责采集转发，vmalert 计算规则。我会沿采集、队列、写入、存储、查询和通知分别验证，并重点管理基数、保留与恢复。”

3 分钟用多集群长期监控场景讲单机与集群分工，再算标签变化对容量的影响，解释缓冲、去重和备份边界。追问：“加 vmselect 能解决写入慢吗？”定位存储瓶颈再回答。“有复制还需要备份吗？”区分可用性和历史恢复。“数据后来补到了，告警会自动补发吗？”规则评估窗口、回放和通知行为需分别核实，不能自动推定。

设计题：分支机构网络每天可能中断两小时，估算采集缓冲、排空速率和缺口告警。事故题：指标突然翻倍，比较采集副本、标签、去重与新业务流量再判原因。GitHub 学习证据包括容量表、两次实验、租户路由、备份恢复记录与真实写入查询结果。

## 进阶课堂：从一条样本推演整个指标平台

### 先看时间：事件发生、被采集和被查询不是同一时刻

同学，把一条样本写成“指标名、标签集合、时间戳、值”四部分。时间戳说明这个值对应的时间；到达存储的时间说明传输延迟；你点击查询的时间只是观察时刻。网络中断后补传历史样本，不代表故障发生在补传这一刻。

我们用一个纸面案例练习：10:00 产生故障样本，网络 10:20 才恢复，10:21 查询最近五分钟。样本即使已经补齐，也可能不在这个窗口里。先扩大到包含 10:00 的区间，确认时间语义，再讨论规则当时为何没触发。把查询窗口改大可以帮助诊断，但不能修复实时检测迟到。

数据新鲜度是“最新可信样本距离现在多久”，不是单纯接口延迟。一个毫秒级返回的查询也可能只返回半小时前的数据。为关键服务建立新鲜度约束，并区分业务值为零、序列不存在、样本过旧和查询失败。AIOps 特征计算要保留这些状态，不能统一填成零后告诉模型“系统没有流量”。

### 再看查询：点、范围、步长各负责什么

即时查询在一个评估时刻求表达式结果，范围查询在一系列评估时刻求结果。Step（步长）决定这些评估点之间相隔多久，抓取间隔决定原始样本多久采一次，二者不是一个参数。图上每分钟一个点，不代表采集器每分钟才工作一次。

假设原始抓取间隔 15 秒，查询跨度七天，面板却要求每秒一个评估点。系统可能做很多额外计算，但没有凭空产生一秒一次的新原始测量。按屏幕分辨率、排障目的和指标变化速度选择步长；关键峰值的回溯再缩短范围精查。不要把折线看起来平滑当成数据更准确。

聚合时也要明确维度。把多个实例的请求数相加常有业务意义，把不同分母的错误率直接平均却可能误导。一个实例 1,000 次请求错 10 次，另一个 10 次错 1 次，整体错误率是 11 除以 1,010，约 1.09%，不是两者百分比的算术平均 5.5%。先聚合可加的分子和分母，再计算比例。

### 多节点少了一台：结果还能信多少

集群查询涉及多个存储节点，某个节点未返回时，要面对可用性与完整性的取舍。返回已有部分数据可能让页面继续显示，却可能低估请求量或错误数；拒绝不完整结果会让查询报错，但避免用户把缺失当正常。VictoriaMetrics 有部分响应相关标识和 `-search.denyPartialResponse` 控制，行为需结合实际复制设置理解。参见 [集群高可用与查询说明](https://docs.victoriametrics.com/victoriametrics/cluster-victoriametrics/)。

副本因子的配置必须与真实数据放置匹配。只在查询端声明“我有多份副本”，不会帮你创造缺失的副本。设计时记录写入复制、查询端假设、节点故障域和丢失多少节点后的保证，再用隔离环境验证。这里讨论的是结果完整性，不是在宣称系统提供关系数据库式事务一致性。

课堂设计题：大屏可接受显示“部分数据”，预算告警却不能低估错误率。你可以给两类查询设置不同的失败策略与显眼状态提示，并为查询失败单独告警。关键不是永远返回数字，而是让使用者知道数字的可信边界。

### 标签治理：删掉一个维度会损失什么

高基数不能只靠“把标签全删了”解决。实例标签有助于定位故障节点，版本标签有助于比较灰度发布，租户标签可能承担业务分析语义。先画使用清单：谁需要这个维度、取值增长多快、在哪一层使用、需要保留多久，再决定保留、聚合或迁移到日志与链路。

例如请求路径中含订单号，直接把原始路径作为指标标签会持续增长。可以把 `/orders/123` 和 `/orders/456` 归为路由模板 `/orders/{id}`，具体订单标识保留在受控日志或链路里。这样保留“哪个接口慢”的指标价值，又避免为每笔订单创建序列。处理前后用小样本核对路由分类，不要把不同业务接口错误合并。

标签也可能携带敏感信息。用户邮箱、令牌片段或完整查询参数既增加基数，也扩大泄露面。治理应在采集或生成端尽早完成；后端查询权限不能撤回此前已经广泛复制出去的数据。变更标签规则时记录开始时间，提醒历史与新数据的查询口径可能不同。

### 教你算恢复预算：缓冲不是容量本身

假设正常进入速率每秒 5 MB，中断两小时，未计压缩与额外开销的输入量约 36,000 MB。网络恢复后总发送能力每秒 8 MB，扣除继续到达的 5 MB，真正清积压只有每秒 3 MB，理想排空约 12,000 秒，也就是 200 分钟。课堂统一十进制单位，实际测量还要考虑队列编码、重试和磁盘波动。

现在问你：把网络恢复就宣布完成有什么问题？积压仍可能持续三个多小时，历史查询和实时告警都会受数据迟到影响。验收至少包括队列回落、最新样本及时、随机历史区间补齐、发送拒绝恢复和磁盘安全余量。若发送能力不高于进入速率，队列就没有稳定排空的条件。

生产预算还要考虑灾难恢复同时发生的负载：存储重建、副本恢复、大范围历史查询会竞争磁盘与网络。不要只用空闲实验环境的吞吐规划故障恢复。记录典型查询混合负载下的指标，再约定恢复时限制昂贵查询、分批补传或临时扩容的触发条件。

### 老师追问：监控系统坏了，谁来监控它

用同一条失效链路报告自己的失效会形成盲点。可以增加独立的外部探测、通知链路心跳和数据新鲜度检查，重要控制信息保留在不依赖该存储的渠道。独立并不意味着再建一套同样复杂的系统，而是确保关键失败有不同路径可见。

为本章提交一份设计记录：采集与存储职责、容量假设、部分响应策略、缓冲预算、恢复验收和剩余风险。面试时先解释假设，再展示算式和证据；若只做了纸面推导，就明确说“设计练习”，不要把它描述成线上运维经验。

## 存储课堂：同一个数字为什么有不同的可信程度

### 样本语义先于压缩率

先把两种常见数字分开：Counter（计数器）累计已经发生的事件，通常持续增加，进程重启时可能从零重新开始；Gauge（瞬时值）描述当前状态，可以增减，例如队列长度或当前温度。它们在存储中都表现为时间戳和值，但分析方法不同。看到数字就统一套用增长率，会把温度下降当作计数器重置，也可能把当前排队人数解释成累计完成量。

计数器通常先对每条独立实例序列求变化速率，再按服务求和。原因是重置发生在各实例内部：先把多个实例相加，某台重启造成的下降可能被另一台增长掩盖，查询函数失去识别重置的线索。你可以用两列手工样本做预测，一列从一百降到三，另一列持续增加；分别计算再聚合，比直接看总和更能保持业务语义。这个推导说明表达式顺序为何重要，不替代特定查询引擎的边界算法测试。

Histogram（直方图）用一组桶描述观测值分布。传统 Prometheus 桶是按上界累计的计数，计算延迟分位数时要理解桶边界和累计语义。不能把每台机器的百分之九十五分位数简单平均当成整个服务的分位数；应尽可能汇总兼容桶，再计算总体分位数。来自不同桶边界、单位或统计口径的数据，不能因为名称相同就混合。模型输入中保存指标类型与单位，是避免这种错误的第一步。

抓取成功也有层次：`up` 是采集器对目标抓取结果的观察，不是应用所有业务都正常的证明；采集到的值还可能被标签重写规则过滤，远端队列也可能积压。规则端见不到序列时，先看目标抓取，再检查重写后的标签集合与发送状态。用这一顺序可以区分“目标没有提供”“中途被过滤”和“尚未送达存储”，不用一开始就怀疑数据库损坏。

### 从标签索引找到样本块

时序存储不适合每次把全部样本从头扫描。VictoriaMetrics 使用索引把标签条件关联到序列，再按时间范围读取所需数据。IndexDB（标签与序列的索引数据库）负责帮助查找序列，样本数据则按时间等信息组织和压缩；它们承担不同工作。不断生成新序列时，即使每条只有几个点，也会给索引与缓存增加负担，所以“样本总量没涨多少”不能排除基数问题。

写入数据先经过内存缓冲与可查询的数据部分，再周期性持久化；磁盘上按月份分区，后台把较小数据部分合并成更合适的部分。合并减少读查询要处理的碎片，但会消耗磁盘读写与临时空间。这里不要借用 Elasticsearch 的事务日志确认模型：不同产品的成功确认、内存缓冲和落盘边界不同，需要按所部署版本和异常关机语义确认。[单机存储结构](https://docs.victoriametrics.com/victoriametrics/single-server-victoriametrics/#storage)。

查询已经能看到数据，也不代表突然断电时最后一段内存数据具有与已持久化数据相同的保障。正常退出会有善后过程，强制终止会跳过一些步骤；因此“重启后数据还在”与“断电不丢最后一个样本”不是同一个验收。本文只提供安全的写入查询课堂，不通过强制杀死用户服务来冒险验证数据安全。

遇到磁盘增长，先看增长来自新样本、标签索引、快照保留还是合并暂时占用，再决定处理。不要绕过服务直接删除数据目录里的某个文件：文件之间有关联，文件名看起来旧不代表能单独清理。也不把强制合并当每次磁盘告警的默认动作，它会制造额外读写压力，需要在隔离验证和容量评估之后才考虑。

### 活跃序列与不断换身份的序列

Cardinality（基数）回答有多少不同序列，Churn（序列更替）回答新序列产生、旧序列退出有多快。十万条稳定序列和每小时重新生成十万条序列，即使当前活跃量相近，索引维护和历史查询成本也可能不同。短命容器、每次发布改变的无意义标识、请求编号都可能造成高更替。

诊断时，先把新增序列按指标名、服务和标签变化分组，和发布、扩容时间线对齐。若业务请求翻倍但序列数稳定，主要压力可能来自样本或查询；若流量稳定而新序列激增，应先审查标签身份。只看总磁盘图，既看不见原因，也无法判断降采样能否帮忙。降采样减少时间分辨率，不会自动消除错误的标签维度设计。

给团队制定标签合同要包含：单位、值类型、哪些维度可枚举、取值上限、谁依赖该维度以及废弃时间。上限不是一个拍脑袋的全局数字；错误码通常有限，租户数会按业务增长，用户标识可能近乎无限。监控首先支持稳定的分组统计，具体请求上下文交给日志或链路，并通过受控关联标识连接，而不是在指标里复制全部业务字段。

## 查询课堂：兼容不是每个边界值都一样

### 一个窗口边界怎样改变增长量

MetricsQL 与 PromQL 在许多表达式上兼容，但官方明确说明：增长量与速率计算会参考回看窗口之前的最近原始样本，且不会按 Prometheus 的方式外推边界；它也有一些空值和指标名保留行为差异。迁移不应只检查查询是否报语法错误，还要检查数值、标签和缺失状态。[MetricsQL 差异说明](https://docs.victoriametrics.com/victoriametrics/metricsql/)。

举一个边界推理题：计数器在窗口开始前为十，窗口内首个样本为十二，后来为十四。只看窗口内首尾，会看见两次增长；把窗口之前的最近样本纳入考虑，会看到另一段增长。实际函数还涉及重置、样本间隔和窗口长度，不能用这三点替代完整算法，但它足以解释为什么两个引擎都没有故障、结果却可能不同。

准备回归样本时至少覆盖稳定递增、低流量稀疏变化、实例重启、抓取间隔抖动以及序列消失。固定相同的评估时间、回看窗口和步长，再比较两个端点的原始响应，不要只用自动缩放后的面板截图。先判断差异是否符合文档语义，再决定修改表达式或接受有说明的迁移口径。把查询差异当容量问题去加机器不会改变结果。

### 空值、过旧、部分响应分别怎样进入告警

即时表达式通常需要在评估时间附近找到可用样本，范围函数则看一段窗口；过时标记表示某条序列不再以原身份继续存在，和业务值为零不同。目标下线、采集器中断和业务真的没有请求，都可能让图上出现缺口，但应该触发不同处理。先为关键指标定义“缺失如何解释”，再谈自动填补。

例如错误率分子缺失但分母仍有数据，不应随意用零补齐后宣称没有错误。应该检查采集合同是否规定“没有错误也输出零”、是不是错误指标改名，以及查询标签能否正确配对。若分母也是零，则是无流量场景，不能与健康零错误率混淆。记录规则可以统一这些口径，但必须保存版本，避免模型训练使用的是新规则、历史标签却代表旧含义。

部分响应另有专门风险：返回成功的 JSON 里可能带 `isPartial: true`。大屏若继续显示，应有明显的“不完整数据”提示；预算、账单、关键服务目标告警通常应明确拒绝部分结果，并另报查询失败。请求参数 `deny_partial_response=1` 或查询组件参数 `-search.denyPartialResponse` 可以用于这类约束，但还必须检查查询端声明的复制因子与实际历史副本是否吻合。参数控制结果接纳策略，不是修复缺失数据。

## 高可用课堂：复制、去重和扩容必须一起推演

### 先问存了几份，再问少一台以后还有几份

应用层复制由写入端的 `-replicationFactor` 控制，指示把样本写到不同存储节点；查询端同名参数则影响对完整数据可用性的判断，两者职责不能混淆。若以前只写一份，今天把查询端改成两份，历史数据并不会自动多出副本。上线核对必须记录开始启用复制的时间，避免把新数据保证错误套到全部历史。[集群复制与数据安全](https://docs.victoriametrics.com/victoriametrics/cluster-victoriametrics/#replication-and-data-safety)。

课堂计算：复制因子为二，只有两台存储。坏一台后，过去已经成功写入两份的数据可能仍能查询，但新写入只有一台可接收，无法维持原定的两份放置。要在失去一台时仍有两台可存新副本，至少需要三台可用放置候选，这还没有计入机房同时故障和剩余节点负载。节点数只是必要条件，不能替代独立故障域与吞吐预算。

VictoriaMetrics 的存储节点彼此不共享状态、也不互相同步数据，写入入口负责分布数据。临时不可用时新样本可能被转送到其他节点，原节点恢复后也不能想象成关系数据库那样自动追平所有缺口。判断恢复完成，应覆盖故障前、故障期间和恢复后的固定时间窗口，再核对读写节点列表、复制状态与去重配置，而非只看所有进程重新出现。

### 去重只识别序列身份，不懂业务语义

存储复制产生的样本通常具有相同标签与时间戳；双采集器抓同一个目标则可能标签相同、时间略有偏移。两者需要分别考虑。`-dedup.minScrapeInterval` 指定离散去重间隔，在同一序列的每个时间区间保留时间戳最新的样本；若时间戳相同，按官方规则选择数值，并非按请求到达顺序覆盖。集群读取来自多个节点的数据时也需要查询侧去重，官方建议存储与查询的相关设置保持一致，不能只在一处改参数。

去重以完整标签集合相同为前提。采集器甲附加 `replica="a"`，乙附加 `replica="b"`，它们进入后端就是两条序列，不会因主机和指标名相同自动合并。若这些标签确实只用来区分采集副本，可在受控写入路径统一处理；若标签代表两台不同业务实例，删除它就可能误合并真实数据。先写清“同一业务测量”的定义再配置，顺序不能反过来。

还要理解间隔的代价。十五秒采一次的目标与一秒采一次的目标如果都采用十五秒去重区间，后者可能丢失本来有用的时间分辨率。去重不是计算平均值，也不是保证保留区间峰值，不能拿它替代业务需要的汇总。混合采集周期时要单独验证，必要时按不同采集与存储路径组织。[去重说明](https://docs.victoriametrics.com/victoriametrics/single-server-victoriametrics/#deduplication)。

### 扩容不自动搬历史，缩容更不能直接删节点

把新存储节点加入写入节点列表后，新数据会按新的分布关系写入；旧节点上的历史数据仍留在原处。好处是不会立刻启动大规模历史搬迁争抢资源，代价是旧节点磁盘高水位不会瞬间消失。刚扩容就删除旧节点，会让过去的查询失去数据。[集群重新分布说明](https://docs.victoriametrics.com/victoriametrics/cluster-victoriametrics/#rebalancing)。

安全缩容的思路是先停止向拟退出节点分配新写入，查询端仍保留它，等待历史自然过期或完成经验证的迁移，再退出读取路径与删除存储。具体命令因拓扑和版本而异，必须先在隔离集群演练。双端节点列表变化、长查询、备份和迁移速度都要记录，不能把“从负载均衡摘掉入口”和“已经可以销毁磁盘”当同一完成点。

## 多租户、安全与恢复课堂

### 租户号是数据隔间号码，不是开门钥匙

集群写入常见路径是 `http://vminsert:8480/insert/42/prometheus/api/v1/write`，读取是 `http://vmselect:8481/select/42/prometheus/api/v1/query`。这里四十二是课堂租户编号，两个域名是部署中的服务名，不是读者本机一定能解析的地址。单机入口路径没有这一层编号，不能直接交换。租户是互相区分的一组数据使用者或业务空间，不要求它一定对应一个自然人。

把编号从四十二改成四十三，本质是换数据空间，不是完成身份验证。生产应在 vmauth 或受控网关校验身份，把它固定映射到允许的路径，并限制客户端自带的租户路径或头部。仅在前端页面隐藏编号，后端直接暴露，不能形成可靠隔离。读取和写入分别授予最小权限，管理、删除、导出接口单独约束。[vmauth 官方说明](https://docs.victoriametrics.com/victoriametrics/vmauth/)。

传输加密保护数据在网络中的机密性，认证确认来者身份，授权决定能访问哪些租户和操作，这三件事不可互换。内网也可能存在误路由和横向访问，存储内部端口不应向所有业务网络开放。凭证保存在受控密钥系统或权限受限文件中，不写入示例仓库、截图和查询参数；审计记录保留身份与路径，但避免记录完整敏感标签。

### 保留期缩短，是数据变更而非普通调参

保留参数必须写单位，避免把一个裸数字误读为天。VictoriaMetrics 的保留清理与月份分区、数据部分和后台合并有关，缩短保留不会保证磁盘立即释放；相反，已经删除的旧数据不会因再次延长参数就自动回来。不要为抢救满盘随意把九十天改成一天，应先确认业务保留约束、备份与具体释放路径。[保留期说明](https://docs.victoriametrics.com/victoriametrics/single-server-victoriametrics/#retention)。

不同业务要不同保留期时，应核对所用版本与授权。社区版本的全局保留与企业版本的保留过滤能力不能混讲；用多个独立实例实现不同保留，需要同时维护数据路径、路由和查询边界。选择额外实例虽然提高隔离，也增加监控、备份与变更成本，不能只比较一个启动参数是否方便。

备份可使用 vmbackup，恢复可使用 vmrestore，集群需要覆盖各个持有数据的存储节点，不能只备份查询组件。先明确恢复点目标，即最多容忍丢失多久的数据；再明确恢复时间目标，即服务多久必须恢复。备份间隔、最后成功时间、传输时间和重建耗时共同决定能否达标，不能只说“每天有任务”。[vmbackup 说明](https://docs.victoriametrics.com/victoriametrics/vmbackup/)。

恢复工具会让目标数据目录与备份内容对齐，可能替换原有文件，因此不能对正在运行或含有未知数据的目录试运行。先恢复到独立空目录，确保对应数据库未运行，再启动隔离实例，抽查指标、租户、时间边界和标签维度，最后讨论切换。除了数据，也要备份采集、路由、规则和告警配置；否则数字回来了，业务通知链仍可能不工作。[vmrestore 的目标目录要求](https://docs.victoriametrics.com/victoriametrics/vmrestore/)。

## 场景开场

你已经用 Prometheus 采集指标，Grafana 也能看图。问题来了：

```text
Prometheus 本地磁盘越来越大。
历史数据只保留 15 天，不够做月度复盘。
多个集群各有 Prometheus，查询很分散。
PromQL 查询慢，指标标签越来越多。
```

这时候你需要思考：Prometheus 继续负责采集和规则，还是把长期时序数据写到一个更适合存储和查询的后端？

VictoriaMetrics 的位置就是这里：它常被用作 Prometheus 兼容的高性能时序数据库，也可以配合 vmagent、vmalert、Grafana 和 Alertmanager 组成一套完整的指标链路。

## 一句话人话版

VictoriaMetrics 是一个 Prometheus 兼容的时序数据库和监控组件集合：它接收指标数据，按时间序列存储，支持 MetricsQL / PromQL 风格查询，再给 Grafana、vmalert 和 AIOps 分析使用。

## 小白可能会问

- VictoriaMetrics 和 Prometheus 是替代关系还是配合关系？
- 单机版和集群版怎么选？
- vmagent、vmalert、vminsert、vmselect、vmstorage 分别是什么？
- MetricsQL 和 PromQL 有什么关系？
- remote write 是什么？
- retention 为什么很重要？
- label cardinality 为什么会把时序数据库拖垮？
- Grafana 怎么查 VictoriaMetrics？
- AIOps 里为什么需要长期指标数据？

## 为什么要学

AIOps 很依赖历史数据。只有最近几小时指标，你能定位当前故障；有几个月指标，你才能做容量趋势、发布影响分析、异常检测训练集和 SLO 复盘。

VictoriaMetrics 在 AIOps 中常用于：

- 长期保存 Prometheus 指标。
- 汇聚多集群、多环境指标。
- 支持 Grafana 查询和大盘。
- 用 vmalert 做 recording rules 和 alerting rules。
- 给 pandas、机器学习、RAG 事故分析提供历史指标证据。

## 是什么

VictoriaMetrics 可以先理解成以下职责组合，不是按顺序依次调用的三个远程服务：

```text
metrics receiver（指标接收）+ time series storage（时序存储）+ query API（查询接口）
```

它接收的数据通常长这样：

```text
http_requests_total{service="order-api",status="500"} 42 1710000000000
```

这条数据包含：

| 部分 | 含义 |
|---|---|
| `http_requests_total` | 指标名 |
| `service="order-api"` | 标签 |
| `status="500"` | 标签 |
| `42` | 当前样本值 |
| `1710000000000` | 此文本示例的 Unix 毫秒时间戳，即相对约定起点的毫秒数 |

VictoriaMetrics 把这些样本按时间序列存储起来。查询时，你可以用 MetricsQL 或 PromQL 风格表达式取出它们。

## 它解决什么问题

### 问题 1：Prometheus 本地存储边界

Prometheus 非常适合采集、短期查询和告警，但当你要做长期、大规模、多集群指标存储时，需要考虑远程存储。

VictoriaMetrics 可以作为 remote write 目标：

```text
Prometheus / vmagent（指标采集端）
  -> remote write（远端写入）
  -> VictoriaMetrics（时序数据存储与查询系统）
  -> Grafana / vmalert / API（图形查询、规则计算或接口访问）
```

### 问题 2：指标查询需要集中入口

多个 Prometheus 分散在不同环境时，AIOps 分析很难统一查询。VictoriaMetrics 可以做集中存储或查询后端。

### 问题 3：需要历史指标做复盘和建模

异常检测、容量预测、SLO 复盘都需要历史窗口。retention 不能拍脑袋，要根据业务需求和磁盘容量设计。

## 核心原理

单机版数据流：箭头表示数据从接收到被消费的逻辑顺序；末尾的仪表盘和规则组件通过查询请求取数，并非存储主动推送全部样本。

```text
scrape target / remote write（抓取目标或远端写入）
  -> VictoriaMetrics single-node（单机时序数据库）
      ingest（写入处理）
      storage（存储）
      query（查询）
  -> Grafana / API / vmalert（图形界面、接口或规则计算）
```

集群版分为写入和读取两条路径，箭头表示请求方向；查询响应按原路返回，不是存储把每个样本主动推到查询端：

```text
写入：vmagent / Prometheus（指标采集与发送端）
  -> vminsert（写入接收组件）
  -> vmstorage（数据存储组件）
读取：Grafana / vmalert / API（仪表盘、规则或接口客户端）
  -> vmselect（查询计算组件）
  -> vmstorage（按时间和标签读取样本）
```

### 关键术语拆解

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| time series | 指标名加标签组合形成的一条时间线 | 查询和存储的基本单位 |
| sample | 某个时间点的值 | 每次采集都会产生样本 |
| label | 指标维度 | 服务、实例、状态码、环境 |
| cardinality | 时间序列数量 | 过高会增加内存、磁盘和查询压力 |
| retention | 数据保留时间 | 决定历史查询和磁盘成本 |
| remote write | Prometheus 把指标写到远程后端 | 常用于长期存储 |
| MetricsQL | VictoriaMetrics 查询语言 | 兼容 PromQL 思路并有扩展 |
| vmagent | 指标采集和转发组件 | 可替代只做采集转发的 Prometheus |
| vmalert | 规则计算和告警组件 | 执行 recording / alerting rules |

## 核心知识树

### 单机版 VictoriaMetrics

是什么：一个 all-in-one 进程，负责写入、存储和查询。

为什么需要：学习、单机部署、中小规模场景启动简单。

怎么工作：

```text
write API（写入接口）
  -> local storage（本地存储）
  -> query API（查询接口）
```

怎么用：Docker 启动，挂载数据目录，配置 retention。

坏了怎么查：看进程是否启动、端口是否监听、数据目录是否可写、retention 是否过短。

### 集群版 VictoriaMetrics

是什么：把写入、存储和查询拆成多个组件。

为什么需要：水平扩展、复制、多租户和更大规模。

怎么工作：

```text
vminsert accepts writes（写入组件接收数据）
vmstorage stores data（存储组件保存样本）
vmselect handles queries（查询组件执行表达式）
```

怎么用：生产上用 Helm、Operator 或官方拓扑建议规划。

坏了怎么查：看 vminsert 到 vmstorage 的连接、vmselect 的 `-storageNode` 配置、各组件指标和日志。

### vmagent

是什么：指标采集和 remote write 转发组件。

为什么需要：如果 Prometheus 只负责 scrape 和转发，vmagent 可以作为更轻量的采集器。

怎么工作：

```text
targets（抓取目标）
  -> vmagent scrape（vmagent抓取）
  -> relabel / filter / aggregate（标签重写、过滤与聚合）
  -> remote write（远端写入）
  -> VictoriaMetrics（时序数据存储与查询系统）
```

怎么用：配置 scrape targets 和 remote write URL。

坏了怎么查：看 targets 是否 up、remote write 是否失败、relabel 是否误删指标。

### vmalert

是什么：规则计算组件。

为什么需要：查询 VictoriaMetrics 并执行 recording rules 和 alerting rules。

怎么工作：

```text
vmalert（规则计算组件）
  -> query VictoriaMetrics（查询时序数据库）
  -> evaluate rules（评估规则）
  -> send alerts to Alertmanager（发送告警给处理器）
```

怎么用：配置 datasource URL、rule 文件、Alertmanager URL。

坏了怎么查：看规则语法、查询是否返回数据、Alertmanager 是否可达。

### MetricsQL

是什么：VictoriaMetrics 的查询语言，和 PromQL 思路相近。

为什么需要：查询指标、聚合、计算 rate、做 dashboard 和规则。

怎么工作：

```text
selector（序列选择器）
  -> range function（时间窗口函数）
  -> aggregation（聚合）
  -> vector result（向量查询结果）
```

怎么用：

```text
rate(http_requests_total[5m])
sum by (service) (rate(http_requests_total[5m]))
```

坏了怎么查：先查原始指标是否存在，再查 label，再逐层加函数和聚合。

## 架构和数据流

入门架构中，箭头分别表示采集写入、查询和通知请求，仪表盘不是规则计算的上游：

```text
app / node_exporter（应用或主机指标导出器）
  -> Prometheus or vmagent scrape（由采集器周期抓取）
  -> VictoriaMetrics single-node（单机时序数据库）
Grafana dashboard（图形仪表盘）
  -> VictoriaMetrics query API（查询接口）
vmalert rules（告警或记录规则）
  -> VictoriaMetrics query API（读取规则所需数据，规则评估仍由vmalert负责）
vmalert firing alerts（规则组件发送已触发告警）
  -> Alertmanager（告警处理器）
```

生产集群架构仍要把写入请求和查询请求分开画，箭头不是全部数据依次流经每个组件：

```text
many clusters（多个集群）
  -> vmagent（指标采集与转发组件）
  -> vminsert（写入接收组件）
  -> vmstorage（数据存储组件）
Grafana / vmalert / API（图形查询、规则计算或接口访问）
  -> vmselect（查询组件）
  -> vmstorage（读取所需样本）
```

AIOps 扩展：

```text
VictoriaMetrics query API（时序数据库查询接口）
  -> Python / pandas（Python与表格数据分析）
  -> machine learning anomaly score（机器学习异常评分）
  -> LangGraph / RAG summary（流程编排与检索增强摘要）
  -> incident evidence（事故证据）
```

## 安装与启动

使用 Docker 启动隔离单机版。本实验固定历史教学版本 `v1.122.0`，用于复现稳定的基础写入与查询接口，不代表当前生产推荐；其他版本应按 [官方变更记录](https://docs.victoriametrics.com/victoriametrics/changelog/) 检查参数和查询差异。本文没有在本轮启动产品，下面预期结果待读者实际操作确认。

先确认 Docker 可用、8428 没有监听者，且没有同名容器和命名数据卷；检查命令若发现已存在对象，就暂停另选隔离环境，不删除已有内容。这里的数据卷是 Docker 管理的持久目录，名字与课堂绑定；容器删除后，卷默认仍保留。不要把宿主机业务数据目录挂进实验。

```powershell
docker version
docker ps -a --filter 'name=^/aiops-vm-class$'
docker volume ls --filter 'name=^aiops-vm-class-data$'
Get-NetTCPConnection -LocalPort 8428 -State Listen -ErrorAction SilentlyContinue
```

确认无冲突后运行：

```powershell
docker run -d --name aiops-vm-class --memory 1g `
  -p 127.0.0.1:8428:8428 `
  -v aiops-vm-class-data:/victoria-metrics-data `
  victoriametrics/victoria-metrics:v1.122.0 `
  -storageDataPath=/victoria-metrics-data `
  -retentionPeriod=30d
```

预期结果：

```text
容器处于 running 状态，浏览器访问 http://localhost:8428/vmui/ 可以打开 VMUI。
```

检查：

```powershell
docker ps --filter 'name=^/aiops-vm-class$'
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8428/health
```

端口映射只允许本机访问，本课堂没有配置认证，不能直接改成公开监听。健康响应正常只说明服务能应答；是否写入正确、能否跨时间查询，要靠下一节验证。若启动失败，先查看 `docker logs --tail 80 aiops-vm-class` 的具体错误，区分镜像下载、参数拼写、端口冲突和数据目录权限，不做重装或清空数据的盲目修复。

## 配置详解

常见启动参数：

| 参数 | 含义 | 新手容易错在哪里 |
|---|---|---|
| `-retentionPeriod=30d` | 数据保留 30 天 | 默认保留期不符合复盘需求 |
| `-storageDataPath` | 数据目录 | 容器不挂卷，重建后数据丢失 |
| `-httpListenAddr=:8428` | HTTP 监听地址 | 端口没映射，外部访问不到 |
| `-promscrape.config` | 单机版内置 scrape 配置 | 学习阶段可用，生产多用 vmagent |
| `-search.maxQueryDuration` | 查询最长时间 | 大查询被提前终止 |

Prometheus remote write 示例：

```yaml
remote_write:
  - url: "http://victoriametrics:8428/api/v1/write"
```

## 常用命令

```powershell
docker logs aiops-vm-class
Invoke-WebRequest -UseBasicParsing http://localhost:8428/health
Invoke-WebRequest -UseBasicParsing "http://localhost:8428/api/v1/query?query=up"
```

每条命令在检查什么：

| 命令 | 作用 | 正常结果 | 异常时先看 |
|---|---|---|---|
| `docker logs` | 看启动和错误日志 | 没有持续报错 | 参数、数据目录、端口 |
| `/health` | 健康检查 | HTTP 200 | 容器状态、端口映射 |
| `/api/v1/query` | 查询指标 | JSON result | 指标是否写入 |
| `docker stop/rm` | 实验全部完成后的清理，见后文 | 指定课堂容器停止、删除 | 是否误选其他容器，数据卷是否仍需保留 |

课堂仅手工导入数据，不自动抓取任何目标，因此查询 `up` 返回空数组通常是正常的：我们并没有写入它。用于验收的是后文自己写入的指标。把没有配置的指标当作健康探针，是“接口通了却判断服务坏了”的常见误区。

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 关键字段 / 参数 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `/api/v1/write` | Prometheus remote write 入口 | Prometheus 配置 remote write | URL、网络 | 指标写入 | 网络不通、路径写错 |
| `/api/v1/import/prometheus` | 导入 Prometheus 文本格式 | POST 文本指标 | 指标名、labels、value | 可查询到数据 | 格式不对 |
| `/api/v1/query` | 即时查询 | `query=up` | MetricsQL 表达式 | JSON result | label 写错 |
| `/api/v1/query_range` | 范围查询 | `query=rate(...[5m])` | start/end/step | 时间序列结果 | step 太小 |
| `vmagent` | 采集和转发 | remote write 到 VictoriaMetrics | scrape config | targets 正常 | relabel 误删 |
| `vmalert` | 规则和告警 | query + rules + alertmanager | rule file | 触发告警 | datasource 配错 |

## 在 AIOps 中的作用

VictoriaMetrics 属于 AIOps 的指标存储层：

```text
metrics（指标）
  -> VictoriaMetrics（时序数据存储与查询系统）
  -> query / dashboard / alert rules（查询、仪表盘与告警规则）
  -> anomaly detection / RCA / capacity planning（异常检测、根因分析与容量规划）
```

它给 AIOps 提供：

- 更长时间窗口的指标证据。
- 多集群指标汇聚。
- SLO burn rate 和历史趋势查询。
- 异常检测训练数据。
- 事故复盘中的指标截图和查询结果。

## 入门实验

### 实验目标

手动写入一条 AIOps demo 指标，再用查询 API 查出来。

### 实验步骤

启动上述 VictoriaMetrics 后，在同一 PowerShell 窗口写入一条 Prometheus 文本格式指标；它是课堂数据，不接收真实业务流量。这里不传时间戳，服务会按导入时刻记录；文本末尾加换行，明确用文本类型发送。先预测：服务标签是 `order-api`，换成支付服务标签会命中吗？

```powershell
$vmClass = 'http://127.0.0.1:8428'
$body = 'aiops_demo_requests_total{service="order-api",status="200"} 42' + "`n"
Invoke-WebRequest `
  -UseBasicParsing `
  -Method Post `
  -Uri "$vmClass/api/v1/import/prometheus" `
  -ContentType 'text/plain' `
  -Body $body
```

查询：

```powershell
$vmResult = Invoke-RestMethod "$vmClass/api/v1/query?query=aiops_demo_requests_total&latency_offset=0"
$vmResult.data.result | ConvertTo-Json -Depth 6
```

也可以打开：

上面仅为课堂核对，把 `latency_offset`（查询时间偏移）设为零。固定教学版本 v1.122.0 的普通即时查询默认向前偏移三十秒，以减少最新点尚未到齐的影响；因此下面 UI 使用默认行为时，刚导入的当前样本可能要超过三十秒才能查到。这不是导入失败，也不意味着生产应取消该保护。取值与请求处理方式可核对 [该版本源码](https://github.com/VictoriaMetrics/VictoriaMetrics/blob/v1.122.0/app/vmselect/prometheus/prometheus.go)。

```text
http://localhost:8428/vmui/
```

输入：

```text
aiops_demo_requests_total
```

### 验证结果

你应该能在响应的 `data.result` 中看到类似条目；下面时间戳只是示例，实际应对应本次查询评估时刻，不能拿示例数字判断自己的时钟：

```json
{
  "metric": {
    "__name__": "aiops_demo_requests_total",
    "service": "order-api",
    "status": "200"
  },
  "value": [1789000000, "42"]
}
```

应该检查响应状态成功，并且结果中指标名、服务、状态码和样本值都符合输入。这说明这一条课堂样本的写入与查询链路已通，不证明高可用、持久化、告警或备份已经通过验证。即使课堂请求取消时间偏移，仍可能有短暂写入缓冲延迟，可间隔一两秒重查几次；持续为空就进入下列排障步骤。使用默认偏移的查询应先考虑超过三十秒的可见时间差，不要连续重复导入造成观察混乱。

### 如果没有成功

按顺序检查：

1. `docker ps` 是否看到 `aiops-vm-class`。
2. `http://localhost:8428/health` 是否返回 200。
3. 写入文本是否包含指标名和值。
4. 查询的指标名是否一致。
5. 是否把容器端口映射到本机 8428。

### 故障实验：补传成功，当前窗口仍然为空

仍在同一个课堂容器，构造一条时间属于十分钟前的队列长度。它是瞬时值，因此不使用累计计数器后缀。记录评估时间后，把它和样本时间都固定下来；故障是故意制造的时间窗口错配，不修改系统时钟，也不停止采集器。导入文本的显式时间戳使用毫秒，查询 API 的 `time` 使用秒，两者不能混淆。

```powershell
$vmNow = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$vmEvent = $vmNow - 600
$lateSample = "aiops_class_queue{service=`"order-api`"} 88 $($vmEvent * 1000)`n"
Invoke-WebRequest -UseBasicParsing -Method Post `
  -Uri "$vmClass/api/v1/import/prometheus" `
  -ContentType 'text/plain' -Body $lateSample
$rangeExpr = [Uri]::EscapeDataString('aiops_class_queue{service="order-api"}[2m]')
$nowWindow = Invoke-RestMethod "$vmClass/api/v1/query?query=$rangeExpr&time=$vmNow"
$pastTime = $vmEvent + 30
$pastWindow = Invoke-RestMethod "$vmClass/api/v1/query?query=$rangeExpr&time=$pastTime"
$nowWindow.data.result | ConvertTo-Json -Depth 8
$pastWindow.data.result | ConvertTo-Json -Depth 8
```

预期当前两分钟窗口结果为空，围绕十分钟前的两分钟窗口能看到值八十八；返回原始样本的区间选择器有助于直接核对时间，不依赖图形界面的自动回看。空数组在某些 PowerShell 输出中不会打印内容，可用 `@($nowWindow.data.result).Count` 查看是否为零。若刚导入时两个窗口都空，等待片刻后重新执行两个查询，再查导入响应与毫秒时间戳。

修复课堂查询的方法是选择覆盖事件时间的窗口；生产修复还应处理为什么样本迟到，例如网络、队列或时钟错误。不能把样本时间改成现在来掩盖延迟，这会把历史故障错放到当前时间，也会污染容量预测和异常检测。已经错过的实时告警是否重放，需要单独设计规则回放与通知去重，存储后来有数据并不自动补发通知。

验收记录四项：导入时间、样本时间、两个查询窗口及结果。把这四项画成时间线，再用自己的话说明“存储可查到历史”与“实时检测及时”两种能力。这个实验没有模拟真实网络断连、磁盘损坏或集群故障，不应在简历中描述为线上高可用切换经验。

### 清理与证据保留

保存脱敏响应后，可停止并删除唯一课堂容器。数据卷仍保留，方便再启动复查；只想暂停实验时执行停止即可。确认卷确实由本实验创建、没有需要保留的数据后，才选择最后一条删除卷命令。删除的数据没有本实验自动备份，不能承诺恢复。

```powershell
docker stop aiops-vm-class
docker rm aiops-vm-class
docker volume inspect aiops-vm-class-data
# 以下命令可选：只删除刚核对的课堂数据卷，会永久移除课堂样本
docker volume rm aiops-vm-class-data
```

## 常见故障排查

### 写入后查不到

- 可能原因：写入端点错误、请求体格式错误、查询指标名不一致。
- 检查命令：课堂运行 `docker logs aiops-vm-class`，再查 `/api/v1/query`；生产替换为已经确认的实例。
- 解决办法：先用 `/api/v1/import/prometheus` 写最小指标，确认链路。

### Grafana 连接失败

- 可能原因：URL 写错、容器网络不通、数据源类型不对。
- 检查方法：Grafana data source test，或者从 Grafana 容器里 curl VictoriaMetrics。
- 解决办法：同一个 compose 网络中使用服务名，例如 `http://victoriametrics:8428`。

### 查询很慢

- 可能原因：label cardinality 高、时间范围太大、step 太小、表达式太复杂。
- 检查方法：缩小时间范围，先查原始 selector，再逐步加聚合。
- 解决办法：优化 label 设计，限制高基数字段，增加 recording rules。

### 磁盘增长很快

- 可能原因：retention 太长、采集频率太高、指标数量太多。
- 检查方法：看数据目录大小、active series 数量、scrape 配置。
- 解决办法：调整 retention、降低无用指标、过滤高基数标签。

### vmalert 不发告警

- 可能原因：规则查询无结果、Alertmanager URL 错、规则时间窗口不合适。
- 检查方法：看 vmalert 日志、手动执行查询、检查 Alertmanager。
- 解决办法：仅在隔离测试规则与测试通知接收端使用持续触发规则确认链路，验证后清理，再调业务规则；不要向真实值班组发送课堂测试告警。

## 面试怎么讲

可以这样说：

```text
VictoriaMetrics 是 Prometheus 兼容的时序数据库和监控组件集合。我会把它放在 AIOps 指标存储层，用 Prometheus 或 vmagent 采集指标，通过 remote write 写入 VictoriaMetrics，再由 Grafana 查询展示、vmalert 执行规则、Python 或 AIOps 服务读取历史指标做异常检测和复盘。单机版适合学习和中小规模，集群版通过 vminsert、vmstorage、vmselect 分离写入、存储和查询，适合更大规模。使用时我会重点关注 retention、label cardinality、查询范围、备份和安全访问，不会把它当成万能监控平台。
```

## 学习检查清单

- [ ] 我能解释 VictoriaMetrics 和 Prometheus 的关系。
- [ ] 我能区分单机版和集群版。
- [ ] 我能说出 vmagent、vmalert、vminsert、vmselect、vmstorage 的作用。
- [ ] 我能写入一条 demo 指标并查询。
- [ ] 我能解释 remote write。
- [ ] 我能说明 retention 和 cardinality 的风险。
- [ ] 我能把 VictoriaMetrics 接到 Grafana 的位置讲清楚。
- [ ] 我能说明它在 AIOps 历史指标分析中的价值。

## 面试题

### 第一组：从用途到单机与集群选型

先回答长期时序存储、集中查询与历史分析价值，再说明 Prometheus、vmagent、VictoriaMetrics 和 vmalert 是可组合的不同职责。追问“生产一定上集群吗？”答案是不一定，先看实测写入与查询规模、故障域要求和运维能力；单机职责集中易维护，集群提供分层扩展，但入口冗余、节点列表、数据分布与恢复更复杂。不能用“公司大”代替负载证据。

### 第二组：重复采集为何可能让结果翻倍

先解释完整标签集合决定序列身份，再分开存储复制和双采集器抓取。追问“配置去重就好吗？”检查副本标签是否不同、去重间隔是否伤害高频样本、查询和存储设置是否一致。追问“删掉实例标签最省事吗？”不同业务实例会被误合并，应该只处理确有重复测量语义的采集副本维度。用两个真实不同实例作为反例，证明自己不是背“删除标签”命令。

### 第三组：有数值返回，为什么告警还可能错误

参考答案区分数据新鲜度、窗口、函数语义、标签匹配和结果完整性。追问“与 Prometheus 结果不同是谁错了？”固定样本与评估时间，核对边界与外推差异再判断。追问“缺值补零可以吗？”先确认采集合同与无流量语义；查询失败、过旧和部分结果不能未经说明转换成健康零。追问“为什么先求速率再求和？”解释实例重置的信息需要在聚合前保留。

### 生产设计题：三地采集，一地查询，关键告警不能误报健康

先明确每个地点样本进入速率、活跃序列、更替速度、保留期、典型查询，以及网络中断与恢复目标。采集端独立持久队列覆盖约定中断期，汇聚入口校验身份并固定租户；读写入口各自冗余，存储复制跨独立故障域。重要查询拒绝部分响应，独立探针监控数据新鲜度和通知链，避免监控平台失效后自报健康。

三个条件化取舍是：复制提高容错也增加写入、磁盘与查询去重成本；长保留支持跨月复盘但增加存储和治理责任；预计算降低重复查询成本但固定口径并产生新数据。选择之前用代表性数据验证，而非只跑一个简单查询。测试应同时覆盖固定基数连续写入、受控新序列增长和历史查询混合负载，逐步增加压力并设置队列、延迟和磁盘的停止阈值。

升级演练记录所有组件版本、启动参数、租户路由和规则，先对比旧新环境的固定样本与关键告警，再滚动改变小范围组件。维护时剩余节点必须能承受额外负载，不能只检查进程数量。回滚需确认数据格式兼容，必要时采用独立旧环境加已验证备份的切换方案；备份恢复期间的新样本如何缓冲或补传也属于方案，不能留到故障后再决定。

### 事故题：新增存储节点后旧节点仍接近满盘

参考时间线：扩容前旧节点占用高，扩容后新写入分散，但过去三个月数据仍在旧节点。先核对读写节点列表与新旧时间窗口，再证明历史不自动搬迁这一机制；不要重启所有节点期望触发自动均衡。短期评估停止新增压力、增加安全空间和查询限流，长期选择自然过期或经验证的迁移。任何清理都先确认保留合同与备份，验收覆盖历史完整性、当前新鲜度、剩余容量和故障期间的查询表现。

## 学习证据

学习完成后，把下面内容提交到 GitHub：

- `docker-compose.yaml` 或启动命令记录。
- 一张 VMUI 查询 `aiops_demo_requests_total` 的截图。
- 一份 `prometheus.yml` remote write 示例。
- 一份 `victoriametrics-notes.md`：说明 retention、cardinality、单机/集群边界。
- 一条排障记录：写入后查不到时如何定位。
