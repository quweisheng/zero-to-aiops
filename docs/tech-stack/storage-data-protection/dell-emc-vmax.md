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
  -> 硬件：V-Brick、Engine、Director、DAE、Front-end、Back-end、Cache
  -> 逻辑容量：SRP、Data Pool、Thin Device、Storage Group、SLO
  -> 主机访问：Initiator Group、Port Group、Storage Group、Masking View
  -> 数据保护：TimeFinder SnapVX、SRDF、D@RE、Vault
  -> 运维：Unisphere、Solutions Enabler/SYMCLI、REST API、性能、升级
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
  -> Fabric A / Fabric B
  -> VMAX Front-end Port
  -> Director 与全局内存/缓存处理
  -> Thin Device 对应的逻辑地址
  -> SRP 中的物理数据布局
  -> Back-end 路径
  -> DAE 中的闪存介质
```

写请求通常先受到缓存和数据保护机制的保障，再按阵列调度写入后端介质。断电时的缓存保护、Vault 行为和恢复流程依具体代际而定，不能简单说成“写到缓存就永远不会丢”。

### 主机访问对象链

```text
主机 HBA WWPN
  -> Initiator Group：一台或一组主机的发起端

阵列 Front-end Port
  -> Port Group：允许主机使用的目标端口集合

Thin Device
  -> Storage Group：业务卷集合，可关联 SLO

Initiator Group + Port Group + Storage Group
  -> Masking View：自动完成主机到卷的 mapping 和 masking
```

`Mapping` 可以理解为把设备放到前端端口的地址空间，`Masking` 是限制哪些 Initiator 可以看到这些设备。Masking View 把三组对象绑定，减少逐设备配置的风险。

### 本地快照路径

```text
源 Storage Group / Device
  -> 创建 SnapVX 时间点
  -> 阵列保存时间点元数据并跟踪变化
  -> 可按需 Link 到目标设备供测试、恢复或备份读取
```

SnapVX 的 `targetless snapshot` 表示创建时间点时不必先准备传统固定目标设备，但真正让主机访问副本时仍可能需要 Link 到目标。Secure Snap、级联、保留策略等能力受版本与授权影响。

### SRDF 远程复制路径

```text
主阵列 R1 Device
  -> RDF Group / RDF Director / Link
  -> 远端阵列 R2 Device
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

VMAX Engine/Director
  -> 冗余 Back-end Path
  -> DAE / Flash

VMAX RDF Port A/B
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
- D@RE 需要把外部密钥管理器、密钥备份和灾备恢复纳入同一设计。
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

with open("vmax-health.csv", encoding="utf-8", newline="") as file:
    for row in csv.DictReader(file):
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

1. 执行 `Copy-Item .\vmax-health.csv .\vmax-health.backup.csv`。
2. 把 `sg_payment_db` 改为 `89,14.6,4,2,SyncInProg`。
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
