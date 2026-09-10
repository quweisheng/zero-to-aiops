# Dell EMC VMAX 深讲

> 学习目标：从零理解 VMAX/VMAX3/VMAX All Flash 的硬件与逻辑架构，能讲清主机 I/O、SRP、Thin Device、Masking View、缓存保护、SnapVX 与 SRDF，能使用只读 SYMCLI 建立容量和性能基线，并按证据处理路径、容量、复制与性能故障。

## 官方资料

- [Dell VMAX All Flash 手册与文档](https://www.dell.com/support/product-details/en-us/product/vmax-all-flash/resources/manuals)
- [VMAX All Flash 250F/450F/850F/950F Product Guide](https://www.dell.com/support/manuals/en-us/vmax-950f/esd_p_vmax_product_guide_all_flash)
- [Dell Solutions Enabler 手册与文档](https://www.dell.com/support/product-details/en-us/product/solutions-enabler/resources/manuals)
- [Dell Unisphere for PowerMax 手册与文档](https://www.dell.com/support/product-details/en-us/product/unisphere-powermax/resources/manuals)
- [VMAX Auto-provisioning Groups 官方说明](https://www.dell.com/support/manuals/en-us/vmax-450f/esd_p_vmax_product_guide_all_flash/auto-provisioning-groups-on-open-systems)
- [Dell PowerMax Family Product Guide](https://www.dell.com/support/product-details/en-us/product/powermax-os-5978/resources/manuals)

说明：VMAX 是一个跨多代硬件和软件的产品家族。本文以 VMAX3 与 VMAX All Flash 的通用运维模型为主，并解释与后继 PowerMax 的关系。命令能否使用、字段名称、SLO、SRDF 模式、端口与容量上限必须以具体数组 SID、HYPERMAX OS/PowerMaxOS、Solutions Enabler 版本、授权和支持矩阵为准。

## 官方知识地图

```text
VMAX 官方资料
  -> 产品代际：Symmetrix VMAX、VMAX3、VMAX All Flash、PowerMax
  -> 硬件：V-Brick（扩展单元）、Engine（引擎）、Director（处理节点）、DAE（磁盘柜）、Front-end（主机侧）、Back-end（磁盘侧）、Cache（缓存）
  -> 逻辑容量：SRP（资源池）、Data Pool（数据池）、Thin Device（精简设备）、Storage Group（存储组）、SLO（服务目标）
  -> 主机访问：Initiator Group（主机端口组）、Port Group（阵列端口组）、Storage Group（卷组）、Masking View（访问关联视图）
  -> 数据保护：TimeFinder SnapVX（快照）、SRDF（远程复制）、D@RE（静态加密）、Vault（缓存保护与恢复相关机制）
  -> 运维：Unisphere（管理界面）、Solutions Enabler/SYMCLI（管理命令）、REST API（管理接口）、性能、升级
```

本文按“主机发出一次写请求，如何到达闪存并被保护”学习，再进入配置、容量性能、复制、自动化、实验和故障处理。

## 场景开场

凌晨数据库延迟升高，主机多路径都在线，交换机也没有端口 down。存储页面却同时出现 SRP 使用率上升、一个 Storage Group 响应时间变差和 SRDF 复制积压。

这不是一句“存储慢”能解决的问题。你需要知道主机卷属于哪个 Storage Group、走哪个 Masking View、使用什么 SLO、落在哪个 SRP、是否受远程复制和后台任务影响，才能形成可验证的根因假设。

## 一句话人话版

```text
VMAX = 面向企业核心业务的高端块存储阵列，用冗余 Director、共享缓存、池化闪存和本地/远程复制，把大量主机 I/O 稳定地写入并保护起来。
```

## 小白可能会问

- **VMAX 和 PowerMax 是一个东西吗？** 不是同一代产品，但 PowerMax 继承并发展了很多 VMAX 架构、对象和管理方式。存量运维必须先确认型号和系统版本。
- **创建了 LUN，主机为什么看不到？** 还要把设备加入 Storage Group，准备 Initiator Group 与 Port Group，并创建 Masking View。
- **SRP 还有空闲，为什么会告警？** 要同时看订阅容量、有效已用、压缩/数据缩减、预留、增长率和快照/复制占用，不能只看一个百分比。
- **SnapVX 是备份吗？** 它是阵列内时间点副本能力，不能自动替代跨故障域、不可变、可恢复验证的备份。
- **SRDF/Metro 等于应用双活吗？** 不等于。它解决阵列卷的远程同步访问，应用一致性、主机集群、网络和故障切换仍需单独设计。

## 为什么要学

VMAX/PowerMax 常承载 Oracle、核心交易、虚拟化和大型主机业务。AIOps 需要把应用、主机设备、WWPN、Masking View、Storage Group、SRP、端口、Director、快照、SRDF 和变更事件连成服务拓扑。否则“阵列总体正常”会掩盖单组、单端口或单 RDF 链路的局部故障。

## 是什么

VMAX 是 Dell EMC 高端企业块存储家族。它通过多 Engine、双 Director、缓存、前后端适配器、磁盘柜和 HYPERMAX OS 提供大规模块设备、服务等级、快照、远程复制、加密与无中断维护能力。

### 产品代际边界

| 家族 | 典型名称 | 主要学习重点 |
|---|---|---|
| 早期 Symmetrix VMAX | VMAX 10K/20K/40K 等 | 传统池、设备、Director 与 Enginuity 时代概念 |
| VMAX3 | VMAX 100K/200K/400K | SRP、SLO、FAST、HYPERMAX OS、服务化管理 |
| VMAX All Flash | VMAX 250F/450F/850F/950F | 全闪、V-Brick、HYPERMAX OS 5977、SnapVX、SRDF |
| PowerMax | PowerMax 2000/8000 及后续型号 | 后继平台、NVMe/SCM 代际与 PowerMaxOS；具体能力单独核对 |

官方 VMAX All Flash Product Guide 将 V-Brick 描述为一个 Engine 加相应闪存容量；一个 Engine 包含两台冗余 Director。不同型号的扩展规模不同，面试时不要背一个容量数字套用全部型号。

## 它解决什么问题

1. 为大量关键主机提供高可用、低延迟块存储。
2. 用 SRP 和 Thin Device 做容量池化与按需分配。
3. 用 Auto-provisioning Groups 降低手工 mapping/masking 错误。
4. 用 SLO 和性能策略管理不同工作负载。
5. 用 SnapVX 提供本地时间点副本，用 SRDF 提供远程复制和灾备能力。
6. 通过 Unisphere、SYMCLI 和 REST API 支撑可观测与自动化。

它不替代主机多路径、SAN 双 Fabric、数据库一致性、备份恢复、灾备编排或业务容量管理。

## 核心原理

### 主机写 I/O 数据路径

```text
应用或数据库写入
  -> 文件系统 / 裸设备 / ASM
  -> 主机多路径设备
  -> Fabric A / Fabric B（相互独立的两套存储交换网络）
  -> VMAX Front-end Port（连接主机的阵列前端端口）
  -> Director 与全局内存/缓存处理
  -> Thin Device 对应的逻辑地址
  -> SRP 中的物理数据布局
  -> Back-end（阵列后端）路径
  -> DAE 中的闪存介质
```

写请求通常先受到缓存和数据保护机制的保障，再按阵列调度写入后端介质。断电时的缓存保护、Vault 行为和恢复流程依具体代际而定，不能简单说成“写到缓存就永远不会丢”。

### 主机访问对象链

```text
主机 HBA WWPN（主机适配器端口的全球唯一名称）
  -> Initiator Group：一台或一组主机的发起端

阵列 Front-end Port（连接主机的前端端口）
  -> Port Group：允许主机使用的目标端口集合

Thin Device（精简配置逻辑卷）
  -> Storage Group：业务卷集合，可关联 SLO

Initiator Group + Port Group + Storage Group（主机发起端组、阵列端口组、业务卷组）
  -> Masking View：自动完成主机到卷的 mapping 和 masking
```

`Mapping` 可以理解为把设备放到前端端口的地址空间，`Masking` 是限制哪些 Initiator 可以看到这些设备。Masking View 把三组对象绑定，减少逐设备配置的风险。

### 本地快照路径

```text
源 Storage Group / Device（源存储组或设备）
  -> 创建 SnapVX 时间点
  -> 阵列保存时间点元数据并跟踪变化
  -> 可按需 Link（关联呈现）到目标设备供测试、恢复或备份读取
```

SnapVX 的 `targetless snapshot` 表示创建时间点时不必先准备传统固定目标设备，但真正让主机访问副本时仍可能需要 Link 到目标。Secure Snap、级联、保留策略等能力受版本与授权影响。

### SRDF 远程复制路径

```text
主阵列 R1 Device（源侧设备）
  -> RDF Group / RDF Director / Link（远程复制组、复制控制部件、复制链路）
  -> 远端阵列 R2 Device（目标侧设备）
  -> 根据同步、异步或 Metro 模式决定写确认与故障行为
```

- **SRDF/S**：Synchronous，同步模式，远端写入条件会进入主机确认路径，RPO 可趋近于 0，但受距离和时延约束。
- **SRDF/A**：Asynchronous，异步模式，以周期/批次传输变化，降低长距离写延迟影响，但存在非零 RPO。
- **SRDF/Metro**：面向受支持配置的双端访问，需配合主机多路径、Witness/偏置机制和一致性设计。

不同 VMAX 代际并不支持所有模式或组合。设计必须核对产品、代码、网络和 Solutions Enabler 版本。

## 关键术语拆解

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| Engine | 一对 Director 组成的核心处理单元 | 提供计算、缓存、连接与冗余 |
| Director | 执行前端、后端、复制或管理功能的处理节点 | 故障和热点常定位到 Director/Port 层 |
| V-Brick | VMAX All Flash 的扩展构建块 | 理解容量和性能随 Engine/闪存扩展 |
| DAE | Drive Array Enclosure，磁盘/闪存柜 | 承载后端介质 |
| SRP | Storage Resource Pool，存储资源池 | Thin Device 实际消耗容量的核心池 |
| TDEV | Thin Device，精简设备 | 主机看到的逻辑块设备基础 |
| Storage Group | 一组业务设备 | 容量、SLO、快照、复制和监控常以组为边界 |
| SLO | Service Level Objective，服务等级目标 | 表达性能目标，不是绝对延迟保证 |
| Initiator Group | 主机 WWPN 集合 | 定义谁来访问 |
| Port Group | 阵列前端端口集合 | 定义从哪些端口访问 |
| Masking View | 三个 Group 的关联视图 | 决定主机最终看到哪些卷 |
| Gatekeeper | 管理主机与阵列通信的小型设备 | Solutions Enabler 管理与发现的重要通道之一 |
| SnapVX | 原生时间点快照技术 | 支撑恢复点、测试副本和备份集成 |
| SRDF | Symmetrix Remote Data Facility | 阵列间远程复制家族 |
| R1 / R2 | SRDF 对的源侧/目标侧设备角色 | 判断复制方向和灾备操作的基础 |
| D@RE | Data at Rest Encryption，静态数据加密 | 保护介质丢失时的数据，需管理密钥生命周期 |

## 核心知识树

### Engine、Director 与冗余

**是什么：** Engine 内有两台 Director，承担 I/O 与管理相关处理；多 Engine 通过内部互联协作。

**为什么需要：** 单个 Director、端口或组件维护时，正确配置的主机应通过其他路径继续访问。

**怎么工作：** 主机 I/O 分布到前端端口和 Director，内部缓存与后端调度共同完成读写。

**怎么用或观察：** 在 Unisphere 或 `symcfg`/`symstat` 中查看 Director、端口、环境和性能状态，并和主机路径拓扑对应。

**坏了怎么查：** 先判断是组件 down 还是负载倾斜。核对同一业务是否集中在单端口/Director、其他路径是否接管、主机错误是否停止增长。

### SRP、Thin Device 与容量

**是什么：** SRP 汇集后端容量，TDEV 向上提供逻辑容量，实际写入再消耗池空间。

**为什么需要：** 便于共享容量、快速供给和提高利用率。

**怎么工作：** 创建 TDEV 并不等于立即占满全部物理空间；数据写入、快照、复制和系统开销共同消耗有效容量。

**怎么用或观察：** 同时查看 provisioned、subscribed、allocated/used、effective used、free、data reduction、增长率和告警阈值。

**坏了怎么查：** 如果 SRP 接近满，先停止继续扩容和非必要副本，确认增长来源、快照/复制占用和数据缩减变化，再决定清理、迁移或物理扩容。不要仅删除主机文件就假设空间立刻回收。

### Auto-provisioning 与 Masking View

**是什么：** Initiator Group、Port Group、Storage Group 通过 Masking View 自动完成主机卷呈现。

**为什么需要：** 降低大规模手工映射错误，并让访问关系可以查询和审计。

**怎么工作：** View 创建后，组成员变化会按规则传播到映射和 masking 关系。

**怎么用或观察：** 用 `symaccess list view` 和详细查询核对 View、IG、PG、SG、WWPN 和设备。

**坏了怎么查：** 主机看不到卷时依次查 HBA login、zoning、IG、PG、SG、View 和主机重扫；看到错误卷时立即阻止写入，核对 WWPN 与变更记录。

### SLO 与性能

**是什么：** SLO 是阵列对 Storage Group 工作负载的服务目标和调度表达。

**为什么需要：** 不同业务不能只靠“都放全闪”来保证性能，需要基于负载和目标治理资源。

**怎么工作：** 阵列根据工作负载、资源与策略进行调度；具体 SLO 名称和实现随代际变化。

**怎么用或观察：** 关注 Storage Group 的 IOPS、吞吐、响应时间、读写比例、I/O 大小、队列与 SLO 合规趋势。

**坏了怎么查：** 先确认工作负载是否改变，再查前端、Director、后端、SRP、复制与后台任务，避免把 SLO 当成硬性延迟合同。

### SnapVX

**是什么：** 阵列内时间点快照和副本能力。

**为什么需要：** 快速创建恢复点、测试副本或给备份流程读取。

**怎么工作：** 保存时间点关系并跟踪源数据变化，按需 link、restore、relink 或 terminate。

**怎么用或观察：** 只读查询快照名称、generation、source、target、link 状态、过期时间和失败状态。

**坏了怎么查：** 检查源/目标设备状态、SRP/RDP 资源、快照关系、并发操作和最近代码缺陷。Restore/Terminate 会改变数据，必须确认对象和恢复点。

### SRDF

**是什么：** 阵列间远程复制能力家族。

**为什么需要：** 应对阵列或站点级灾难，并支持迁移或双站点架构。

**怎么工作：** R1/R2 设备通过 RDF Group 和链路传输数据，不同模式有不同确认、RPO 和延迟权衡。

**怎么用或观察：** 查询 pair state、RDF mode、link state、invalid tracks、cycle time、session 和一致性状态。

**坏了怎么查：** 先确定复制方向与当前业务侧，再检查链路、端口、网络、RDF Group、积压和远端容量。不要在方向未确认时执行 failover、swap 或 establish。

## 生产架构和数据流

### 可靠接入拓扑

```text
主机 HBA-A -> Fabric A -> VMAX FE Port（Director A 路径）
主机 HBA-B -> Fabric B -> VMAX FE Port（Director B 路径）

VMAX Engine/Director（阵列引擎与控制部件）
  -> 冗余 Back-end Path（阵列后端路径）
  -> DAE / Flash（磁盘扩展机箱与闪存介质）

VMAX RDF Port A/B（两条远程复制端口路径）
  -> 独立复制链路
  -> 远端 VMAX/PowerMax（受支持组合）
```

生产设计要检查：双 Fabric 是否独立、端口是否跨 Director、主机多路径策略是否受支持、Storage Group 是否按业务隔离、SRP 是否有增长余量、复制链路是否按峰值变化量设计、备份是否独立且可恢复。

### 容量规划

至少回答六个问题：

1. 当前物理/可用/有效已用容量是多少？
2. TDEV 订阅容量与实际写入容量分别是多少？
3. 数据缩减比是否稳定，哪些数据不可压缩？
4. SnapVX、SRDF、备份和系统预留消耗多少？
5. 最近 30/90 天峰值增长率是多少？
6. 达到采购、扩容、变更冻结和紧急阈值分别还有多久？

### 安全边界

- 管理主机、Unisphere、Solutions Enabler 与 REST API 放在受控管理区。
- 使用最小权限角色和个人账号，保留审计日志。
- D@RE 应按现场使用的嵌入式或外部密钥管理方式，验证密钥保护、备份和灾备恢复；不能假定所有阵列都依赖外部密钥管理器。
- Masking View 变更属于数据访问控制变更，错误 WWPN 可能导致数据泄露或误写。
- 导出中含 SID、WWPN、设备号、主机名和业务名，进入 GitHub 前必须脱敏。

### 升级与回滚

升级前：

1. 核对数组型号、目标代码、Solutions Enabler、Unisphere、主机 OS/HBA/驱动、多路径、SRDF 对端和管理插件兼容性。
2. 消除 failed component、单路径、SRP 高水位、快照失败、SRDF 积压和正在进行的迁移。
3. 保存配置、性能基线、support bundle、主机路径与复制状态。
4. 确认 NDU 前提、升级顺序、厂商支持和业务降级方案。
5. 升级后验证硬件、端口、SG、MV、主机路径、性能、SnapVX、SRDF 和业务读写。

阵列微码通常不能像应用版本一样随意降级。回滚计划应写清暂停点、业务切换、故障隔离和厂商恢复路径。

## 安装与启动

VMAX 不是可以在笔记本上 `docker run` 的软件。真实学习环境需要：

1. 一套受支持的 VMAX/VMAX All Flash 或实验阵列。
2. 管理网络和 SAN 访问。
3. 兼容版本的 Solutions Enabler 和/或 Unisphere。
4. 必要的 Gatekeeper、账号、证书和授权。

在没有硬件时，应使用官方文档、脱敏导出和离线检查练习。不要下载来源不明的阵列镜像，也不要把“命令语法能读懂”写成“已完成真实设备实验”。

## 配置详解

下面是供给清单，不是可直接导入阵列的配置文件：

```yaml
array_sid: "000197900001"          # 示例 SID，真实提交前必须脱敏
service: order-db                  # 业务服务名
storage_group: sg_order_db         # 业务设备与 SLO 的管理边界
initiator_group: ig_order_db       # 订单数据库主机的 WWPN 集合
port_group: pg_prod_a_b            # 跨 Director、跨 Fabric 的前端端口集合
masking_view: mv_order_db          # 把 IG、PG、SG 关联起来
srp: SRP_1                         # Thin Device 实际消耗的存储资源池
slo: application-approved          # 使用经容量/性能评审的服务等级
snapshot_policy: daily-7           # 本地时间点保留策略，不等于备份策略
rdf_group: rdfg_dr                 # 远程复制链路与设备对的逻辑组
```

| 配置项 | 含义 | 新手容易错在哪里 |
|---|---|---|
| `array_sid` | 阵列唯一标识 | 多阵列环境在错误 SID 上执行写命令 |
| `storage_group` | 业务卷、SLO、快照和复制边界 | 把无关业务混在一个组，故障影响面难控制 |
| `initiator_group` | 允许访问的主机 WWPN | 复制错 WWPN，把卷呈现给错误主机 |
| `port_group` | 阵列前端端口集合 | 端口都在同一 Director 或同一 Fabric |
| `masking_view` | IG、PG、SG 的关系 | 只创建 SG，没有创建 View |
| `snapshot_policy` | 本地快照保留 | 误认为阵列内副本能抵御整阵列故障 |
| `rdf_group` | 远程复制逻辑链路 | 没确认 R1/R2 方向就做控制操作 |

## 常用只读命令

以下为常见 SYMCLI 查询思路。不同 Solutions Enabler 版本选项可能变化，先执行 `<command> -h` 并查当前版本 CLI Guide。

```text
symcfg list                                      # 发现可管理阵列及 SID
symcfg -sid <SID> list                           # 查看指定阵列配置摘要
symcfg -sid <SID> list -dir all                  # 查看 Director 与端口状态
symcfg -sid <SID> list -srp                      # 查看 SRP 容量与订阅
symdev -sid <SID> list                           # 查看设备状态
symaccess -sid <SID> list view                   # 查看 Masking View 清单
symaccess -sid <SID> show view <VIEW_NAME>       # 展开 IG、PG、SG 与设备关系
symaccess -sid <SID> list logins                 # 查看前端登录与 WWPN
symstat -sid <SID> -type REQUESTS -i 5 -c 12     # 每 5 秒采样一次，共 12 次请求负载
symrdf -sid <SID> list                           # 查看 SRDF 设备对与状态
symsnapvx -sid <SID> list                        # 查看 SnapVX 关系
```

命令参数大小写和可用选项以本机版本为准。任何 `create`、`delete`、`establish`、`restore`、`failover`、`swap`、`terminate` 都是写操作或数据状态变更，不属于日常只读采集。

## 命令 / 对象字典

| 名称 | 作用 | 常用写法 | 关键字段 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `symcfg` | 阵列、硬件、端口、SRP 清单 | `symcfg -sid <SID> list -srp` | total、used、free、subscribed | 状态正常且容量有余量 | 忘记指定 SID，读错阵列 |
| `symdev` | 设备清单和状态 | `symdev -sid <SID> list` | device、configuration、status、capacity | 业务设备 ready | 只看设备 ready，不查主机映射 |
| `symaccess` | 管理/查询 Auto-provisioning | `symaccess -sid <SID> show view <MV>` | IG、PG、SG、WWPN、ports | 与设计台账一致 | 错误主机名不代表 WWPN 正确 |
| `symstat` | 性能实时采样 | `symstat -sid <SID> -i 5 -c 12` | reads、writes、response、queue | 与业务基线接近 | 采样太短，错过周期性尖峰 |
| `symsnapvx` | SnapVX 查询与控制 | `symsnapvx -sid <SID> list` | source、snapshot、generation、state | 关系有效，无 failed | 把 list 与 restore 的风险混为一谈 |
| `symrdf` | SRDF 查询与控制 | `symrdf -sid <SID> list` | R1/R2、mode、pair state、invalid tracks | 链路和 pair 符合设计 | 未确认方向就执行 failover |
| Unisphere | 图形化配置、容量、性能与告警 | Storage > Storage Groups | SG、SLO、capacity、performance | 状态与 CLI 一致 | 只看仪表盘绿色，不做对象级下钻 |
| REST API | 自动采集配置与性能 | 以当前 Unisphere API 文档为准 | array、SG、volume、metrics | 返回受控、可审计数据 | 在采集账号上授予写权限 |

## 在 AIOps 中的作用

### 指标分层

| 层次 | 重点信号 | 用途 |
|---|---|---|
| 主机 | path state、device latency、queue depth、I/O errors | 判断业务真实体验和多路径状态 |
| Masking | login、WWPN、MV/IG/PG/SG 关系 | 定位卷不可见或错误呈现 |
| Storage Group | IOPS、MB/s、response time、read/write ratio、SLO compliance | 找到具体业务热点 |
| Front-end | port utilization、errors、queue、Director load | 发现端口或 Director 倾斜 |
| SRP | used、effective used、subscribed、growth、data reduction | 预测容量耗尽 |
| Back-end | drive/DAE health、back-end response、rebuild | 判断介质与后端瓶颈 |
| SnapVX | count、failed state、retention、resource usage | 控制快照堆积和恢复风险 |
| SRDF | link、pair state、invalid tracks、cycle time、lag | 判断灾备 RPO 和链路积压 |
| 变更 | MV/SLO/Snap/RDF/微码时间线 | 关联性能和可用性回退 |

### 告警原则

- 容量告警同时包含当前值、增长率、预计耗尽时间和最大增长业务。
- 性能告警以 Storage Group 和主机服务为主，不只用全阵列平均值。
- 路径减少即使业务未中断也要告警，因为冗余已丢失。
- SRDF 告警同时显示业务方向、R1/R2、积压量和 RPO 风险。
- 自动化默认只读，任何数据呈现、快照恢复和复制切换需审批。

## 入门实验：离线容量与复制基线

### 实验目标

用脱敏 CSV 模拟 VMAX Storage Group 日检，检查路径、响应时间、容量余量和 SRDF 状态。

### 前提

- Python 3。
- 新建目录 `vmax-lab`。
- 示例阈值只用于学习，不代表生产统一标准。

### 创建 `vmax-health.csv`

```csv
storage_group,service,srp_used_pct,response_ms,expected_paths,online_paths,srdf_state
sg_order_db,order-db,62,1.8,4,4,Synchronized
sg_payment_db,payment-db,71,2.2,4,4,Synchronized
sg_batch,batch,55,4.5,2,2,NotConfigured
```

### 创建 `check_vmax.py`

```python
import csv
import sys

problems = []
expected_groups = {"sg_order_db", "sg_payment_db", "sg_batch"}
seen_groups = set()

with open("vmax-health.csv", encoding="utf-8", newline="") as file:
    for row in csv.DictReader(file):
        group = row["storage_group"]
        if group in seen_groups or group not in expected_groups:
            raise ValueError("重复或未知的课堂存储组")
        seen_groups.add(group)
        if float(row["srp_used_pct"]) >= 85:
            problems.append(f'{row["storage_group"]}: SRP used >= 85%')
        if float(row["response_ms"]) >= 10:
            problems.append(f'{row["storage_group"]}: response >= 10 ms')
        if int(row["online_paths"]) < int(row["expected_paths"]):
            problems.append(
                f'{row["storage_group"]}: paths '
                f'{row["online_paths"]}/{row["expected_paths"]}'
            )
        if row["srdf_state"] not in {"Synchronized", "NotConfigured"}:
            problems.append(
                f'{row["storage_group"]}: SRDF state={row["srdf_state"]}'
            )

if seen_groups != expected_groups:
    raise ValueError("课堂存储组覆盖不完整，不能判为健康")

if problems:
    print("VMAX_HEALTH=CRITICAL")
    print("\n".join(problems))
    sys.exit(2)

print("VMAX_HEALTH=OK")
```

### 运行与验证

```powershell
python .\check_vmax.py
$LASTEXITCODE
```

预期输出为 `VMAX_HEALTH=OK`，退出码为 `0`。

## 故障注入实验：模拟容量、单路径和 SRDF 积压

### 精确步骤

1. 确认当前为本轮独立目录且备份文件不存在，再执行 `Copy-Item .\vmax-health.csv .\vmax-health.backup.csv`；已有备份则停止，不覆盖。
2. 把支付业务的完整一行替换为 `sg_payment_db,payment-db,89,14.6,4,2,SyncInProg`，保留组名和业务名两列。
3. 执行 `python .\check_vmax.py`。

预期结果包含：

```text
VMAX_HEALTH=CRITICAL
sg_payment_db: SRP used >= 85%
sg_payment_db: response >= 10 ms
sg_payment_db: paths 2/4
sg_payment_db: SRDF state=SyncInProg
```

`$LASTEXITCODE` 应为 `2`。这四条信号不能直接归结为同一个根因：容量、性能、访问冗余和复制状态需要分别取证，再看是否有共同变更或后台任务。

### 恢复和清理

```powershell
Copy-Item .\vmax-health.backup.csv .\vmax-health.csv -Force
python .\check_vmax.py
Remove-Item .\vmax-health.backup.csv
```

### 如果没有成功

1. 检查 CSV 是否使用英文逗号。
2. 检查数值字段是否混入 `%` 或 `ms` 字符。
3. 检查脚本和 CSV 是否在同一目录。
4. 检查 Python 是否为 3.x。
5. 真实导出先脱敏，并单独保存原始只读证据，不能覆盖。

## 常见故障排查

### 主机看不到新卷

1. 确认 TDEV 是否加入正确 Storage Group。
2. 展开 Masking View，核对 IG、PG、SG 和 WWPN。
3. 检查 Fabric Name Server 与 zoning。
4. 检查阵列前端 login 和端口状态。
5. 主机执行受支持的总线重扫并查看多路径。
6. 用已知正常主机做对比，不要反复删除/重建 View。

### 只有一个 Storage Group 延迟高

先查该组工作负载变化、I/O 大小、读写比、队列和 SLO，再比较所用前端端口、Director、SRP、SnapVX/SRDF 任务和主机路径。全阵列响应正常不能否定局部热点。

### SRP 高水位

先保留容量快照并识别增长来源；检查 TDEV 写入、快照、复制、数据缩减变化和回收状态；暂停非必要供给；估算耗尽时间；在清理、迁移或扩容后验证有效已用和业务读写。删除快照或设备前必须确认依赖关系。

### SRDF 不同步

1. 确认 R1/R2 和当前业务侧。
2. 查看 RDF Group、端口、链路和 pair state。
3. 记录 invalid tracks、cycle time 和增长速度。
4. 检查远端 SRP、设备、链路带宽和最近变更。
5. 判断 RPO 是否超标并升级事件级别。
6. 任何 establish、resume、failover、swap 前确认数据权威方向和回滚。

### SnapVX 失败

检查源/目标设备、快照状态、SRP/RDP 资源、保留策略、并发操作和代码已知问题。不要通过删除全部快照来快速消除告警；先确认哪些快照用于备份、测试和恢复。

## 事故场景：数据库延迟与 SRDF 积压同时发生

**证据收集：**

- 应用 p95/p99、数据库等待事件、主机设备延迟与队列。
- SG 级 IOPS、吞吐、响应时间、SLO 和前端端口分布。
- SRP 容量、后端延迟、重建和数据缩减状态。
- SRDF mode、cycle time、invalid tracks、链路利用率。
- 同时段 SnapVX、备份、迁移、微码和网络变更。

**假设：** 工作负载突增、复制链路带宽不足、远端阵列变慢、前端端口热点、后台复制/快照竞争，或多个独立问题同时出现。

**验证：** 用时间线和对象关联排除假设。若只有带 SRDF 的组慢，继续对比同端口但不复制的组；若所有组慢，扩大到 Director/SRP/后端；若主机单路径，先恢复冗余并观察。

**修复与回滚：** 优先降低非关键后台负载或恢复故障路径，避免未经评审切断复制。任何模式切换都要评估 RPO、远端恢复能力和反向同步风险。

## 生产设计题

**题目：** 为核心 Oracle 集群设计 VMAX All Flash 存储与同城/异地灾备。

答题主线：

1. 明确业务 RTO、RPO、延迟、峰值 IOPS、容量增长和一致性边界。
2. 主机双 HBA、双 Fabric、PG 跨 Director，受支持多路径。
3. 按业务建立 SG、IG、PG、MV，控制故障域和访问权限。
4. 以实测工作负载和增长率规划 SRP、SLO、前后端端口与余量。
5. 本地使用 SnapVX 作为快速恢复点，但另建跨故障域不可变备份。
6. 根据距离和 RPO 选择 SRDF/S、SRDF/A 或受支持的 Metro 方案。
7. 设计数据库一致性、应用切换、网络、DNS、演练和反向恢复。
8. 建立 SG 级监控、容量预测、复制 RPO 告警和变更审计。

## 面试怎么讲

### 30 秒版本

```text
VMAX 是面向核心业务的高端块存储。主机卷通常来自 SRP 中的 Thin Device，通过 Storage Group、Initiator Group、Port Group 和 Masking View 呈现。I/O 经双 Fabric 到前端 Director，再由缓存和后端路径写入闪存；SnapVX 提供本地时间点副本，SRDF 提供远程复制。排障时我会从主机路径、Masking View、SG 性能、前端 Director、SRP、后端和复制链路逐层验证。
```

### 3 分钟版本要点

1. 先划分 VMAX3、VMAX All Flash 与 PowerMax 代际。
2. 讲 Engine、双 Director、V-Brick、DAE 和缓存保护。
3. 讲 SRP/TDEV 与 IG/PG/SG/MV 对象关系。
4. 讲 SnapVX 与备份的区别、SRDF 模式和 RPO/延迟权衡。
5. 讲容量预测、局部性能热点、双 Fabric、安全与升级门禁。
6. 用 SRDF 积压事故展示证据、假设、修复和回滚。

### 连续追问

**问：LUN 已创建但主机看不到，先查什么？** 先确认具体 SID 和设备，再查 SG、MV、IG 的 WWPN、PG 端口 login、Fabric zoning，最后查主机扫描与多路径。

**问：为什么 SRP 不能只看 free？** 因为精简供给、数据缩减、快照、复制、预留和增长率共同决定风险；需要预计耗尽时间和回收可行性。

**问：SRDF/S 与 SRDF/A 怎么选？** 用业务 RPO、允许写延迟、距离、链路质量、峰值变化量和灾备流程权衡，不能只回答“同步更安全”。

**问：SnapVX 为什么不等于备份？** 它通常仍依赖同一阵列和管理域，无法单独覆盖整阵列故障、凭据失陷或全部副本被删除，还必须验证恢复过程。

**问：PowerMax 能否直接套用 VMAX 命令？** 很多对象和 SYMCLI 思路延续，但要按 PowerMaxOS、Solutions Enabler 和 Unisphere 版本核对，不可假设全部参数与限制相同。

## 面试题

1. **VMAX 主机供给需要哪些对象？** 说明 TDEV/Storage Group、Initiator Group、Port Group 和 Masking View 的关系，再补充 zoning 与主机多路径。
2. **SRP 明明还有空间为什么仍可能高风险？** 结合精简订阅、有效已用、数据缩减、快照/复制、增长率和回收延迟回答。
3. **SnapVX 与传统备份有什么边界？** 讲时间点、副本依赖、故障域、不可变性和恢复验证。
4. **SRDF/S、SRDF/A 与 SRDF/Metro 怎么选？** 以 RPO、RTO、距离、写延迟、带宽、双端访问和应用切换权衡。
5. **单个 Storage Group 延迟高但全阵列正常，怎么排查？** 下钻 SG 工作负载、SLO、端口/Director 分布、SRP、后端与复制任务，不能用全局平均值否定问题。

## 学习检查清单

- [ ] 我能区分 VMAX、VMAX3、VMAX All Flash 和 PowerMax。
- [ ] 我能画出主机到 Front-end、Director、SRP、Back-end 和闪存的数据路径。
- [ ] 我能解释 SRP、TDEV、SG、IG、PG 和 Masking View。
- [ ] 我能解释 SnapVX、SRDF/S、SRDF/A 和 SRDF/Metro 的边界。
- [ ] 我能使用只读 SYMCLI 建立配置、容量、性能和复制基线。
- [ ] 我知道哪些命令会改变数据或复制方向。
- [ ] 我能完成离线基线与故障注入实验。
- [ ] 我能回答容量、性能、安全、升级、灾备与事故追问。

## 老师带你读懂一张数据库存储变更单

### 先把“加 1 TB 磁盘”拆成四个问题

假设同事说：“订单数据库容量不够，给它加 1 TB。”刚入门容易马上寻找创建卷按钮。老师会先问：数据库是表空间不足、文件系统不足、逻辑卷不足，还是阵列资源池不足？这四处都可能显示百分比很高，但对应的操作完全不同。

从底向上看，阵列提供块地址，主机识别设备，再由分区、逻辑卷管理器、文件系统或数据库 ASM 使用。ASM 是 Oracle 的自动存储管理组件，它接管数据库磁盘组织，不一定使用普通文件系统。阵列扩容成功，只能证明最底层容量变化；上层还可能需要重新识别设备大小、扩展逻辑结构并由数据库验证。命令顺序依主机和数据库版本变化，因此应由各层负责人签署自己的验收结果，不能用一张 Unisphere 截图代替业务验收。

还要问新容量是否增加写入压力。假如只是保留更多冷历史数据，容量增长快但 IOPS 不一定增加；若是上线批量对账，容量、吞吐和写放大可能同时增长。IOPS 是每秒 I/O 次数，吞吐是每秒搬运字节数；两者近似满足“吞吐 = IOPS × 平均 I/O 大小”。例如 10,000 次/秒、每次 8 KiB，约为 78 MiB/s。换成 256 KiB 后即使 IOPS 不变，也会到约 2,500 MiB/s。只背阵列峰值 IOPS，不能证明你的业务路径有足够带宽。

### 访问呈现不是一个勾选框，而是三张名单

把 SG 想成“这一组货物”，IG 是“允许领取货物的人”，PG 是“允许通行的大门”，MV 则是把人、大门和货物关联起来的通行证。这个类比帮助记忆，但真正执行时不能靠显示名称判断身份，要核对主机 HBA 的 WWPN。WWPN 是光纤通道端口的全球唯一名字，和主机 IP 不是同一回事。

一台主机有两个 HBA 端口，不代表两个端口都进了正确 IG；一个 PG 有四个端口，也不代表跨了两个独立 Fabric 和不同 Director。把四条路径画出来，标出交换机、供电、Director、HBA，才能判断单个故障会切断几条。这里的“4”是数量，“是否独立”是可靠性，两者不能互相替代。

若新主机突然看到了不该看到的卷，第一目标是防止误写并控制影响范围，不是让操作系统重新分区“试试看”。记录 SID、设备 ID、WWPN、MV 和变更时间；由负责人撤销错误呈现并验证正确主机仍能访问。格式化、清除签名和导入陌生磁盘组都会把访问配置事故扩大成数据事故。

### 写成功的收据到底是谁签的

应用说“保存成功”，数据库通常已经按自身持久化策略完成日志处理，但操作系统、主机 HBA、阵列缓存、后端介质和远程副本分别承担不同责任。理解缓存保护，不是背一句“缓存很快”，而是追问：哪些缓存受保护？哪些失效组合在支持范围内？同步复制在哪一步满足确认条件？恢复时需要哪些系统和密钥？

SRDF/S 的远端参与同步确认，因此网络 RTT，也就是一次往返时间，会进入延迟预算。这里不能用“主机延迟 = 本地阵列延迟 + RTT”当作精确公式，因为请求可并发、排队和控制协议还有影响；它只是帮助你识别延迟下限与预算的思考方式。SRDF/A 则接受尚未传到远端的数据窗口，换取不同的距离和延迟权衡。选择模式必须从业务可容忍损失和恢复流程出发。

老师再追问：复制状态正常，为什么数据库仍不能启动？因为复制块并不知道应用事务含义。数据文件、日志文件、控制文件如果处于不同时间点，可能需要数据库恢复，甚至缺少必要日志。快照组、一致性组和应用冻结/备份接口要共同设计；“阵列一致”与“应用能恢复”是两张不同验收单。

### 容量预测练习：不要等到 99% 才采购

假设 SRP 有 10 TiB 可用余量，但运维要求保留 2 TiB 安全空间，最近高峰每天净增长 200 GiB。可供正常增长的约为 8,192 GiB，粗估约 41 天到达保留线。若采购和变更需要 45 天，现在已经该启动计划，而不是因为“还剩 10 TiB”就标绿。

这个估算的前提是净增长可代表未来；快照批次、复制重建、数据压缩效果变化和大促写入都可能使它失真。因此报告要同时放保守情景、趋势范围和已知事件。删除主机文件也不等于池空间立即下降，还要检查应用删除方式、文件系统空间回收、UNMAP 支持及阵列回收进度。UNMAP 是主机通知存储“这些逻辑块不再需要”的机制，不是通用的数据擦除或立即减容承诺。

### 用实验结果回答事故追问

前面的检查器把复制非正常状态标为 CRITICAL，是为了练习规则分支；真实生产的 `SyncInProg` 可能是已审批恢复过程，不一定意味着新事故。AIOps 需要叠加维护窗口、持续时间、积压增长方向和 RPO 目标，避免把已知重建反复升级。相反，“NotConfigured” 对批处理样例可以接受，对要求灾备的订单库却不能接受，告警必须知道业务期望。

面试时可以这样推进：“先确认业务等级和模式，再看复制积压是否持续增长；用同端口但不复制的 SG 做对照，区分前端共享瓶颈与复制特有问题；若调整后台任务，先记录基线和停止条件，随后验证业务延迟与 RPO 两个目标，不能为降延迟悄悄取消灾备保护。”把这个推理过程写进实验 README，比多贴十条命令更能证明能力。

## 快照机制课堂：可读的目标不等于所有数据已独立复制

SnapVX 的时间点、关联目标和完整复制是三个不同对象或状态。时间点描述某一时刻的数据视图；关联目标使主机可以访问那个视图；复制模式决定是否把相应数据复制到目标的分配空间。不能看到测试主机读到了文件，就推断后台完整复制已经完成，也不能把快照名称当作目标设备号。

VMAX All Flash 产品指南区分 Nocopy 与 Copy 关联。前者借助快照关系提供时间点视图，目标可写；后者把有关数据复制到目标，进度与完成仍需观察。Nocopy 目标取消关联后也能够保留数据视图，因此“取消关联就一定没有数据”是错误理解；同样不应从取消关联推断所有容量依赖已经释放。按[该代际产品指南](https://www.delltechnologies.com/asset/it-it/products/storage/technical-support/docu67503.pdf)理解关系，再核对现场代码，不能把后续 PowerMax 重构后的实现细节直接套回来。

教师给出源卷、上午快照、下午快照、测试目标四个标签。基础步骤把测试目标关联上午快照，记录预期看见上午的数据。故障步骤仅把目标重新关联到下午快照，问为什么昨天保存的测试校验值不再匹配。正确答案先核对快照代次与关联操作，不立刻判断介质损坏。恢复步骤按批准关系重新准备测试目标并复验，清理只删除纸面关系，不执行真实 relink 或 restore。

生产恢复还要保护原卷。直接 restore 会改变源侧数据状态，通常需要应用停写、确认恢复点、保存当前事故现场和独立回退选择。若先把快照关联到隔离目标，可先验证数据库能否恢复，但这一步仍要避免相同数据库标识、集群身份或备份任务误接生产。隔离副本不仅是换个卷名，还包括主机、网络、凭据与自动任务。

快照空间估算取决于保留时间内的数据变化与共享关系。每天保存一个时间点，不应简单按源卷全容量乘天数，也不能假设元数据很小所以总占用永远很小。高覆盖写入、测试目标写入和较长保留期都可能增加实际消耗。容量告警应关联快照策略变更及异常写入趋势，删除前检查备份读取、恢复和测试依赖。

## 一致性课堂：先确定哪份数据有资格成为恢复源

复制的 R1 与 R2 是关系中的角色，不是永远不变的“正确”和“错误”。切换后业务可能已在原目标侧写入，此时旧源即使重新上线，也不自动重新成为权威。任何重新同步都必须确认当前写入方、最后一致点、差异和目标方向，否则可能把新业务数据覆盖为旧副本。

RPO 是可接受的数据损失窗口，RTO 是恢复服务所需时间目标。复制积压量、最早未复制时间和应用一致恢复点分别提供不同证据。积压字节数低不一定代表时间窗口短，例如长时间没有新写入但必要一致性状态未完成；同样链路恢复不等于所有差异追平。报表把链路状态、复制对状态、可用恢复点和业务恢复能力分开。

用合成流水做生产模拟：主站已确认业务序号一百二十，远端一致恢复点为一百一十，业务要求最多丢失五笔。基础步骤核对序号来源和事务完整性；故障步骤让主站不可用，计算十笔差距超过目标，不能宣称零损失切换。恢复选择可能包括等待源站恢复、找日志补齐或由业务接受损失，技术人员不能替业务隐瞒这一取舍。

回切阶段再让远端新增到一百三十。正确答案先保护正在写入的一侧并阻止双写，再按支持方案同步、校验和迁移入口。把旧主站上线直接视为自动恢复，会产生两份不同历史。实验清理恢复合成序号表，保留决策记录，既不执行 SRDF 控制命令，也不声称这个简化模型实现了厂商一致性协议。

一致性组的意义是把有关设备作为一个恢复边界看待，而不是任意卷集合都叫组。数据库数据、日志与控制信息分别放卷时，应依据应用恢复方法组织同步、冻结或日志重放；多个不同应用放同一大组，又会放大切换与恢复影响面。设计时由业务、数据库和存储负责人共同确认，而不是只按存储组命名决定。

## 性能课堂：从缓存命中到后端排队，不用一个平均值回答全部问题

读命中缓存与读后端介质的路径不同；写入受保护缓存与后台下刷的时间边界也不同。短时间的写入突发可能被缓存吸收，持续写入超过后端处理能力则逐渐积压。缓存大不是无限容量承诺，验收必须覆盖足够长的稳态窗口与恢复过程，不能只做几十秒短测得出长期吞吐。

响应时间还要说清测量位置。应用计时包含自身排队、数据库等待和系统调用，主机设备统计包含它所观察的 I/O 路径，阵列指标则有自己的起止点。应用延迟高但阵列平均延迟低，可能是阵列前面的排队或局部业务被总体平均稀释。把同一时间窗、同一设备与同一业务关联，才有可比性。

可以用稳定系统的近似关系“在途请求数约等于每秒完成数乘平均响应秒数”检查量级。例如每秒两万次、平均两毫秒，对应约四十个在途请求。它帮助判断队列数字是否自洽，不是给所有 HBA 设置队列深度四十的建议。真实队列分布跨多层，还受突发、并发主机和控制器资源限制，盲目增大队列可能使尾延迟更差。

纸面故障分别增加大块顺序读取与小块同步写入，要求学生预测哪种更可能先受吞吐、哪种更敏感于确认延迟。恢复方案比较错峰批处理、修复路径、调整经批准的策略和扩充实际瓶颈资源。验证不仅看 IOPS，还看吞吐、读写比例、请求大小和业务尾延迟，清理回到原始负载表。不能用高端阵列标签替代负载模型。

## 密钥与访问课堂：加密保护介质，不替代卷呈现权限

D@RE 的目标是保护静态介质上的数据，不是禁止被合法映射的主机读取明文。若把支付卷错误呈现给测试主机，加密不会自动识别这是越权；IG、PG、SG、MV、SAN 访问和主机授权仍要正确。安全设计题应分别回答“介质被拿走”“管理账号泄露”“主机获得错误卷”三类威胁。

该代际支持嵌入式或外部密钥管理，不能一律要求外部服务器。Dell 的 [D@RE 组件说明](https://www.dell.com/support/manuals/en-us/vmax-250f/esd_p_vmax_product_guide_all_flash/dre-components?guid=guid-6df5f2e1-8cc6-433a-b2cb-233b71f5f37a&lang=en-us)明确区分两种组成。现场记录实际模式、受支持备份恢复方法、负责人和可恢复证据；外部模式还应验证网络、信任、冗余和密钥服务恢复顺序。

更换管理组件、整阵列恢复或迁移时，不能只验证业务数据副本，而遗漏解密所需材料。密钥材料不放进公共 GitHub，也不粘贴给模型分析；学习记录可以保存脱敏的模式、有效性检查结果、审批人与演练结论。失去恢复密钥与丢失数据同样严重，但复制明文密钥到普通表格并不是安全的备份方式。

## 交付与实验验收：一项告警必须知道业务期望

基础 CSV 的 `NotConfigured` 只对不要求远程保护的课堂批处理组通过。真正的检查器应额外读取业务保护策略：要求 SRDF 的组缺少复制就是风险，允许恢复中的组要根据维护窗口与积压趋势判断。不能把固定几个状态字符串当成所有模式的健康规范，尤其不能把同步模式规则套到异步与 Metro。

本课新增覆盖检查防止空 CSV 或缺组被报成健康，但它仍不是完整生产解析器。下一步独立练习包括非法数值、重复组、过期采样、缺少阵列编号和预期组变化，分别输出采集错误或策略违规。修复回归先恢复原 CSV，确认所有样例组存在、零退出码，再删除本轮备份。仅完成基础课也应记录实际检查范围，不写“所有阵列健康”。

采购与升级验收清单应保存具体型号、系统代码、管理软件、授权功能、主机兼容矩阵和厂商支持承诺。性能、无中断维护与复制组合是有条件的产品能力，不是只要购买某个型号就自动实现。离线练习结束可以保留脚本和合成数据作为学习证据；如要清理，先确认独立目录，只删除本轮明确文件及空目录。本轮未连接阵列、创建快照、修改密钥或执行复制切换。

### 主机扩卷与阵列扩卷的恢复边界

再看最初“加容量”的请求。若阵列卷扩大后主机识别成功，但文件系统扩展失败，回滚不应默认把阵列卷缩回去。先保护已存在数据，记录各层大小、错误和操作进度，再按文件系统或数据库支持路径继续处理。跨层操作属于一张变更单中的多个阶段，每阶段有自己的负责人、停止条件和可逆性，不能用一个绿色总状态代替。

纸面练习把卷容量、主机设备容量、逻辑卷容量和文件系统容量写成四格。正常步骤依次更新并验证，故障步骤让第三格停在旧值，要求解释为什么第四格没有增加。恢复步骤只处理已定位阶段，并保留其他三格的证据；清理恢复合成表。此练习不提供通用扩卷命令，因为普通文件系统、裸设备和 ASM 的操作不同，错误照抄会破坏业务。

当前对本文 Python 样例实际验证了四种内存输入：正常、容量及复制故障、空表、重复组。退出码分别符合零、二、一、一的预期；空表和重复组不会输出健康。没有写入本地实验文件，也没有调用 SYMCLI。这项测试只证明课堂规则与覆盖检查的分支，不证明真实阵列指标语义、文件导出格式或灾备切换能力，后续现场验收仍须补充这些证据。

若管理查询超时但业务仍可读写，先区分管理通道与数据通道，再检查管理主机和阵列状态。管理入口故障不能单独证明业务卷失效，也不能因此执行复制切换。

## 学习证据

```text
vmax-lab/
  README.md                    # 产品代际、对象关系和主机 I/O 图
  vmax-health.csv              # 脱敏 SG 基线
  check_vmax.py                # 容量、性能、路径和 SRDF 检查
  masking-view-audit.md        # 脱敏 IG/PG/SG/MV 审计记录
  incident-srdf-lag.md         # 复制积压事故推理与回滚
  screenshots/                 # 仅保存脱敏截图
```

README 必须注明实验数据来源和限制。没有真实阵列时写“基于官方文档和脱敏样例完成离线实验”，不得写成“已在生产 VMAX 验证”。
