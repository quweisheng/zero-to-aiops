# Dell EMC VPLEX 深讲

> 学习目标：从零理解 VPLEX 如何把异构块存储虚拟化成主机可访问的虚拟卷，能讲清 Local/Metro、双站点 I/O、Consistency Group、Witness 与故障仲裁，能安全采集健康信息、分析路径故障，并完成一套可复现的离线健康检查与故障注入实验。

## 官方资料

- [Dell VPLEX VS6 手册与文档](https://www.dell.com/support/product-details/en-us/product/vplex-vs6/resources/manuals)
- [VPLEX GeoSynchrony 6.2 SP2 CLI Reference Guide](https://www.dell.com/support/manuals/en-us/vplex-series/vplex_p_cli_guide_6.2sp2)
- [VPLEX `health-check` 命令参考](https://www.dell.com/support/manuals/en-us/vplex-vs2/vplex_p_clirefguide_62sp1/health-check)
- [VPLEX `ds summary` 命令参考](https://www.dell.com/support/manuals/en-us/vplex-series/vplex_p_cli_guide_6.2sp2/ds-summary)
- [VPLEX 与 Metro node SAN 连接最佳实践](https://www.dell.com/support/product-details/en-us/product/vplex-vs6/resources/manuals)
- [Dell Metro node 文档](https://www.dell.com/support/product-details/en-us/product/dell-emc-metro-node/resources/manuals)

说明：VPLEX 的功能和命令会随 VS2、VS6、GeoSynchrony 补丁级别以及授权变化。本文讲清通用原理，并以 GeoSynchrony 6.2 的只读命令为主；生产操作前必须以设备当前版本的 Release Notes、Simple Support Matrix 和维护合同为准。Metro node 是 Dell 当前同类双活访问方案之一，但不能把 Metro node 的能力直接套到存量 VPLEX。

## 官方知识地图

```text
VPLEX 官方资料
  -> 产品与硬件：Local、Metro、Cluster、Engine、Director
  -> 存储虚拟化：Storage Volume、Extent、Device、Virtual Volume
  -> 主机访问：Initiator、Front-end Port、Storage View
  -> 双站点：Distributed Device、Consistency Group、Detach Rule、Witness
  -> 运维：Health Check、性能、告警、升级、数据迁移、安全
```

本文按“主机一次读写怎样经过 VPLEX”展开：先认清对象，再理解 Local/Metro 和仲裁，然后学习配置边界、只读命令、指标、实验、生产事故与面试表达。

## 场景开场

数据库主机同时看到两个机房的存储路径。某天站点间链路中断，两个机房都还通电。此时最危险的问题不是“链路红了”，而是两个站点能否同时继续写同一块数据。如果双方都写，恢复链路后可能出现无法自动合并的两份数据。

VPLEX Metro 要解决的是：在同步距离内让两个站点访问同一个逻辑卷，并在链路或站点故障时依据一致性组、优选站点和 Witness 做出确定的访问决策。

## 一句话人话版

```text
VPLEX = 放在主机与后端块存储之间的虚拟化层，把多套阵列的 LUN 重新组织成虚拟卷，并可在两个站点之间提供同步双活访问与数据移动能力。
```

## 小白可能会问

- **VPLEX 是存储阵列吗？** 不是。它位于主机与后端阵列之间，后端阵列仍负责磁盘、RAID、池和物理数据持久化。
- **VPLEX Metro 等于数据库双活吗？** 不等于。它提供块设备访问连续性，不负责数据库事务冲突、应用会话、DNS 或流量切换。
- **有 Witness 就一定不会双写吗？** 还要正确配置一致性组、Detach Rule、优选站点和第三故障域网络，并验证主机多路径及应用恢复流程。
- **VPLEX 是备份吗？** 不是。镜像两边的错误删除、逻辑损坏和勒索加密也可能同步，仍需独立备份和恢复演练。
- **第一天最少学什么？** 先能画出主机、双 Fabric、VPLEX 前后端、后端阵列的路径，并说清 Storage Volume 到 Virtual Volume 的对象链。

## 为什么要学

VPLEX 常出现在金融、运营商、政企核心系统和数据中心迁移场景。AIOps/SRE 不一定每天创建虚拟卷，但必须知道告警来自哪一层：主机多路径、SAN Fabric、VPLEX Director、站点间链路还是后端阵列。只有把这些证据按数据路径关联，才能避免“看到路径少了一条就误判阵列故障”。

## 是什么

VPLEX 是面向块存储的虚拟化与数据可用性平台。它向主机呈现虚拟卷，向后端消费阵列提供的 LUN。主机不直接依赖某个后端阵列的物理卷，因此可以在受支持条件下做跨阵列迁移、镜像和双站点访问。

### 产品与代际边界

| 名称 | 主要定位 | 学习时要注意 |
|---|---|---|
| VPLEX Local | 单站点存储虚拟化与数据移动 | 关注单集群、异构阵列、在线迁移和本地高可用 |
| VPLEX Metro | 两个 VPLEX 集群之间的同步分布式卷 | 关注站点间时延、Consistency Group、Detach Rule 和 Witness |
| VS2 / VS6 | VPLEX 的不同硬件代际 | 端口、容量、支持版本和升级路径不同，不能混用参数上限 |
| GeoSynchrony | VPLEX 软件环境 | 命令、状态字段和特性受补丁级别影响 |
| Metro node | Dell 的后续同类块存储双活访问平台 | 架构和运维方式与 VPLEX 有继承关系，但必须单独核对支持矩阵 |

## 它解决什么问题

1. 把多套异构阵列的块存储统一呈现给主机。
2. 在不改变主机卷标识的前提下迁移后端数据。
3. 在同一站点内通过冗余 Director 和双 Fabric 提供访问高可用。
4. 在两个站点间构建同步分布式卷，并对分区故障做访问仲裁。
5. 为容量、路径、重建、链路和组件健康提供统一观测对象。

它不替代数据库复制、备份、灾备编排、主机多路径软件、SAN 双 Fabric 或业务级一致性验证。

## 核心原理

### 单站点数据路径

```text
应用读写
  -> 主机文件系统或数据库
  -> 主机多路径设备
  -> Fabric A / Fabric B
  -> VPLEX Front-end Port
  -> Director 全局缓存与设备映射
  -> VPLEX Back-end Port
  -> 后端阵列 LUN
  -> 后端阵列缓存、RAID/池、磁盘
```

`Front-end` 是面向主机的一侧，`Back-end` 是面向后端存储阵列的一侧。排障时必须分别检查，不能把“主机到 VPLEX 的路断了”和“VPLEX 到阵列的路断了”混成一个故障。

### 对象链

```text
后端阵列 LUN
  -> Storage Volume：VPLEX 发现并认领的后端卷
  -> Extent：从 Storage Volume 切出的容量范围
  -> Device：由一个或多个 Extent 组成，可做本地镜像
  -> Virtual Volume：向主机导出的逻辑卷
  -> Storage View：把 Initiator、VPLEX 端口和 Virtual Volume 关联起来
```

### Metro 写入路径

```text
站点 A 主机写入
  -> 站点 A VPLEX Cluster
  -> 更新本地 Device
  -> 通过站点间链路发送到站点 B Cluster
  -> 更新远端 Device
  -> 满足同步写完成条件后向主机确认
```

同步写意味着站点间往返时延会进入写 I/O 延迟。官方 6.2 CLI 示例中可见特定配置的 Metro RTT 上限，但这不是对所有型号和版本的通用承诺；设计时必须查询本机 `health-check --limits`、支持矩阵和应用延迟预算。

## 关键术语拆解

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| Cluster | 一套 VPLEX 管理与 I/O 集群 | Local 有一个，Metro 通常跨两个站点各一个 |
| Engine | 含两台 Director 的硬件单元 | 提供成对冗余和扩展能力 |
| Director | 执行 I/O、缓存和虚拟化处理的控制器 | 单个 Director 故障不应中断正确配置的多路径业务 |
| Storage Volume | 后端阵列交给 VPLEX 的 LUN | 是 VPLEX 对后端容量的入口 |
| Extent | Storage Volume 的全部或部分容量 | Device 的最小构造材料之一 |
| Device | 由 Extent 组成的本地逻辑设备 | 可做条带或镜像，并承载 Virtual Volume |
| Distributed Device | 两个集群的 Device 组成的同步分布式设备 | Metro 双站点访问的核心对象 |
| Virtual Volume | 主机最终看到的卷 | 主机分区、文件系统和数据库建立在它之上 |
| Storage View | Initiator、前端端口、虚拟卷的访问关系 | 相当于 VPLEX 的主机映射视图 |
| Consistency Group | 一组需要按相同故障规则处理的卷 | 数据库多卷、仲裁和故障切换不能逐卷随意决策 |
| Detach Rule | 站点失联时哪一边保留 I/O 的规则 | 防止两个站点同时写入形成 split-brain |
| Witness | 部署在第三故障域的仲裁服务 | 帮助区分站点故障与站点间链路故障，不承载业务数据 |
| Metadata Volume | 保存 VPLEX 配置元数据的系统卷 | 损坏会影响系统恢复与配置一致性 |
| Logging Volume | 记录分布式设备在中断期间需要重建的区域 | 影响恢复后增量同步和一致性 |

## 核心知识树

### Storage Volume、Extent、Device 与 Virtual Volume

**是什么：** 四层对象把物理后端 LUN 转换为主机使用的虚拟卷。

**为什么需要：** 解耦主机与后端阵列，使迁移、镜像和统一导出成为可能。

**怎么工作：** VPLEX 先发现并 claim 后端卷，再创建 Extent 和 Device，最后从 Device 创建 Virtual Volume 并加入 Storage View。

**怎么用或观察：** 从 `storage-volume summary`、`extent summary`、`local-device summary`、`virtual-volume summary` 顺序检查对象数量、容量、健康和父子关系。

**坏了怎么查：** 从异常 Virtual Volume 反查 Device、Extent 和 Storage Volume；若底层显示 `dead` 或 `unreachable`，继续检查 VPLEX 后端路径、Fabric 和阵列端口。

### Storage View 与主机多路径

**是什么：** Storage View 定义哪些主机 WWPN 可以通过哪些 VPLEX 前端端口访问哪些虚拟卷。

**为什么需要：** 没有访问隔离，错误主机可能看到不属于自己的卷；路径设计错误则会出现单点。

**怎么工作：** 主机 HBA 的 WWPN 作为 Initiator 注册，前端端口作为 Target，Virtual Volume 作为 LUN，三者在 Storage View 内关联。

**怎么用或观察：** 检查 `export storage-view summary`、主机 `multipath -ll` 或操作系统等价工具，并核对 Fabric A/B 是否各有独立路径。

**坏了怎么查：** 先区分“卷完全不可见”“路径数减少”“路径存在但 I/O 超时”。依次核对主机 HBA、zoning、VPLEX Initiator 注册、Storage View、前端端口和多路径策略。

### 本地镜像与分布式卷

**是什么：** 本地镜像在一个集群内保护 Device；Distributed Device 把两个 VPLEX 集群的 Device 组成同步镜像。

**为什么需要：** 前者应对后端阵列或本地路径故障，后者支撑双站点访问和站点级故障切换。

**怎么工作：** 写入需要按对象策略到达镜像成员；成员失联后记录差异，恢复后重建。

**怎么用或观察：** 使用 `ds summary --verbose` 关注 `health-state`、`operational-status`、`service-status`、成员是否 out-of-date 以及重建状态。

**坏了怎么查：** `minor failure` 可能表示成员正在重建或 Logging Volume 异常；`major failure`、`stressed`、`cluster unreachable`、`need resume` 需要结合一致性组和站点事件判断，不能直接执行恢复写命令。

### Consistency Group、Detach Rule 与 Witness

**是什么：** Consistency Group 让相关卷按同一规则处理；Detach Rule 定义失联时优选站点；Witness 在第三故障域帮助判断故障类型。

**为什么需要：** 一个数据库可能有数据卷、日志卷和仲裁卷。只恢复其中一部分，应用层可能不一致。

**怎么工作：** 正常时两个集群同步；分区时系统结合连通性、规则和 Witness 判断哪边继续 I/O、哪边暂停。Witness 不复制数据，也不替应用做事务恢复。

**怎么用或观察：** 检查 `health-check --cluster_witness`、一致性组状态、规则、优选集群、Witness 到两个集群的独立连通性。

**坏了怎么查：** 先冻结高风险人工操作，确认两个站点真实 I/O 状态、站点间链路和 Witness 三方连通性，再确定唯一数据权威方。没有证据时不要在两边分别 `resume`。

### 缓存、Metadata 与 Logging Volume

**是什么：** Director 使用缓存处理 I/O；Metadata Volume 保存系统配置；Logging Volume 记录同步中断期间的差异区域。

**为什么需要：** 它们决定断电恢复、配置恢复和远端成员重新同步能否安全进行。

**怎么工作：** 脏缓存通过受保护机制写回；VS2/VS6 支持的缓存保护方式依硬件而定；差异位图用于增量重建。

**怎么用或观察：** 检查 `health-check --cache`、系统卷状态和 `vault status`（仅适用于命令支持的平台）。

**坏了怎么查：** 区分业务卷故障和系统卷故障。Metadata/Logging Volume 告警应尽快升级给存储支持团队，保留 `health-check --full` 和 support bundle，不要自行删除或重建系统卷。

## 生产架构设计

### 最小可靠拓扑

```text
主机 HBA-A -> Fabric A -> VPLEX Director 前端 A
主机 HBA-B -> Fabric B -> VPLEX Director 前端 B

VPLEX Director 后端 A -> Fabric A -> 阵列控制器端口 A
VPLEX Director 后端 B -> Fabric B -> 阵列控制器端口 B

Metro Cluster 1 <-> 独立站点间链路 <-> Metro Cluster 2
                         |
                    第三故障域 Witness
```

设计检查：

1. Fabric A/B 电源、机柜、交换机和路径独立。
2. 前端与后端 zoning 遵循 Dell 当前连接最佳实践。
3. 主机使用受支持的多路径软件、策略和超时参数。
4. 两站点应用、网络、DNS、数据库和依赖也有切换方案。
5. Witness 不与任一数据站点共享同一故障域。
6. 同步链路延迟、带宽和抖动经过峰值写流量验证。
7. 备份位于独立故障域，并做过恢复演练。

### 容量与性能

- **容量链路：** Virtual Volume 容量不能只看主机，要同时检查 Device、Extent、Storage Volume 和后端池。
- **写延迟：** Metro 同步写受站点间 RTT、后端阵列延迟和队列影响。
- **队列：** 单个 Director、端口或后端卷热点会在总体平均值正常时拖慢少数应用。
- **重建：** 故障恢复后的 rebuild 与生产 I/O 争用链路和后端能力，应设置观察窗口和限速策略。
- **增长：** 记录 allocated、used、free、thin oversubscription 和增长率，避免只看虚拟容量。

### 安全边界

- 管理网与业务 SAN 隔离，限制 SSH/HTTPS 来源。
- 使用个人账号和最小权限，不共享管理员账号。
- CLI、REST、SNMP、Syslog 使用受支持的安全协议。
- 导出的 support bundle 可能含 WWPN、序列号、IP 和卷名，上传仓库前必须脱敏。
- 对 Storage View、Consistency Group、Detach Rule、迁移和恢复操作实施双人复核。

### 升级与回滚

VPLEX 升级不是普通软件包更新。升级前至少完成：

1. 核对硬件、GeoSynchrony、后端阵列、SAN、HBA、驱动、多路径和管理组件兼容矩阵。
2. 执行完整健康检查，消除 degraded、rebuild、单路径和系统卷告警。
3. 备份配置与 support bundle，记录基线性能和主机路径数。
4. 确认 NDU（Non-Disruptive Upgrade，无中断升级）前提、跳跃版本和维护窗口。
5. 准备业务停写、主机切换、厂商支持和故障升级路径。
6. 升级后复核集群、Director、前后端路径、分布式卷、Witness、主机多路径和业务事务。

固件降级不一定受支持，“回滚”往往是停止升级、保持业务在健康 Director/站点、按官方恢复流程处理，而不是自行刷回旧版本。

## 安装与启动

VPLEX 依赖专用硬件、受支持的后端阵列、FC SAN 和 Dell 实施流程，不能在个人电脑上安装出等价生产环境。真实上架与首次启动至少包括站点供电/机柜、管理网络、前后端 FC、站点间链路、后端 LUN、Metadata/Logging Volume、集群初始化和健康验收。

小白应先在授权实验环境做只读验收：确认设备型号和 GeoSynchrony 版本，运行 `cluster summary` 与 `health-check`，再核对前端、后端、系统卷、分布式卷和 Witness。任何初始化、claim、导出或仲裁设置都应由受训人员按当前 Installation Guide 实施。

## 配置详解

VPLEX 没有一份适用于所有对象的单一 YAML。下面用设计清单表达最重要的生产配置字段：

```yaml
service: order-db                 # 业务名称，用来关联卷、告警和变更单
virtual_volume: vv_order_db_01    # 主机看到的 VPLEX 虚拟卷
consistency_group: cg_order_db    # 同一数据库相关卷放进同一一致性组
preferred_cluster: cluster-1      # 失联时优先保留 I/O 的站点，必须与业务主站一致
witness_failure_domain: site-3    # Witness 位于独立第三故障域
fabric_a_paths: 2                 # A Fabric 的期望路径数
fabric_b_paths: 2                 # B Fabric 的期望路径数
backup_policy: daily-plus-pitr     # 双活不是备份，仍需独立备份策略
```

| 配置项 | 含义 | 新手容易错在哪里 |
|---|---|---|
| `preferred_cluster` | 分区时的优选集群 | 只按机房编号设置，没对齐数据库主站和业务流量 |
| `consistency_group` | 一组共同切换的卷 | 数据卷与日志卷分开，故障时状态不一致 |
| `witness_failure_domain` | Witness 所在故障域 | 把 Witness 放在站点 A 的虚拟化集群里 |
| `fabric_*_paths` | 每个独立 Fabric 的期望路径 | 总路径数够，但全部经过同一交换机或同一 Director |
| `backup_policy` | 独立备份与恢复目标 | 把 Metro 镜像误当成防误删和勒索保护 |

## 常用只读命令

先进入 VPLEX CLI，再执行只读检查。不同补丁可能存在字段差异，先用 `help` 或当前版本 CLI Reference 核对。

```text
version                              # 查看 GeoSynchrony 版本和平台信息
cluster summary                      # 查看两个集群是否 connected、是否 expelled、健康是否为 ok
cluster status                       # 查看集群详细运行状态和 transition 信息
health-check                         # 快速汇总主要硬件、软件和对象健康
health-check --full                  # 完整扫描，耗时更长，输出日志路径
health-check --front-end             # 只检查主机侧连接
health-check --back-end              # 只检查后端阵列侧连接
health-check --wan                   # 检查 Metro 站点间连接
health-check --cluster_witness       # 检查 Witness 相关状态
ds summary --verbose                 # 汇总分布式卷、一致性组和异常成员
storage-volume summary               # 查看后端卷可达性和健康
extent summary                       # 查看 Extent 是否 out-of-date、dead 或 unreachable
virtual-volume summary               # 查看导出虚拟卷健康
export storage-view summary          # 查看主机访问视图和导出关系
ll /clusters/**/system-volumes/      # 查看 Metadata/Logging 等系统卷
```

正常基线不是“命令能运行”，而是集群与对象状态为 `ok`、预期路径均可达、无未知或不可恢复状态，并且结果与资产台账一致。

## 命令 / 状态字典

| 名称 | 作用 | 常用写法 | 关键字段 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `health-check` | 总体健康入口 | `health-check --full` | component、health、log path | 关键项为 `OK` | 只看最后一行，不读前面的 warning |
| `cluster summary` | 判断集群连接与隔离 | `cluster summary` | Connected、Expelled、Operational、Health | connected、not expelled、ok | 把 `degraded` 当作可长期运行状态 |
| `ds summary` | 查看分布式设备 | `ds summary --verbose` | health、operational、service、CG | 成员健康且 running | 看到 `need resume` 就直接恢复两边 |
| `storage-volume summary` | 检查后端卷 | `storage-volume summary` | reachable、I/O status、health | reachable/ok | 忽略后端只有单路径 |
| `extent summary` | 检查 Extent | `extent summary` | out-of-date、unhealthy、unusable | 无异常计数 | 只修 Extent，不追到底层 Storage Volume |
| `export storage-view summary` | 核对主机映射 | `export storage-view summary` | initiator、port、virtual volume | 与设计台账一致 | 修改前未核对 WWPN 所属主机 |
| `ll` | 查看上下文对象属性 | `ll /clusters/**/system-volumes/` | operational、health、active | 系统卷健康 | 把通配路径输出当成单个对象 |
| `vault status` | 查看支持平台的缓存保护状态 | `vault status -c cluster-1 --verbose` | vault/unvault state | 无异常 vault 流程 | 在不支持的平台照抄命令 |

### 高风险命令边界

以下动作会改变生产状态，不应从教程直接复制执行：claim/unclaim Storage Volume、创建或删除 Device/Virtual Volume、修改 Storage View、迁移、添加/移除镜像、修改 Consistency Group 或 Detach Rule、`resume`/`choose-winner`、Director/端口禁用、NDU。

生产变更必须有对象清单、影响分析、双人复核、应用停写或一致性计划、回滚路径和厂商版本文档。

## 在 AIOps 中的作用

### 应采集的信号

| 层次 | 指标或事件 | 告诉你什么 |
|---|---|---|
| 主机 | path count、path state、I/O latency、queue | 业务看到的真实访问质量 |
| Front-end | port state、IOPS、MB/s、latency、queue | 主机侧端口是否断链或拥塞 |
| Director | CPU、cache、I/O、health | 是否出现控制器热点或组件异常 |
| Back-end | port state、latency、queue、Storage Volume reachability | VPLEX 到阵列的路径和后端响应 |
| Metro | WAN RTT、bandwidth、packet/link errors、rebuild | 同步链路是否成为写延迟瓶颈 |
| Distributed Device | health、service status、out-of-date、rebuild progress | 双站点数据是否同步且可服务 |
| 系统卷 | metadata/logging health | 配置与恢复基础是否可靠 |
| 变更 | zoning、Storage View、CG、升级时间 | 把故障与最近变更关联起来 |

### 告警关联思路

```text
主机延迟升高
  -> 是否只有单主机：检查 HBA、多路径、队列
  -> 是否同一 VPLEX 前端端口：检查 FE port 与 Fabric
  -> 是否同一后端 Storage Volume：检查 BE path 与阵列卷
  -> 是否所有 Metro 写：检查 WAN RTT、抖动、重建
  -> 是否紧随变更：核对 zoning、Storage View、CG 和固件时间线
```

AIOps 的价值不是自动执行 `resume`，而是把主机、交换机、VPLEX、阵列和变更数据对齐到同一个服务拓扑，缩小假设范围；涉及数据权威和仲裁的修复仍应保留人工审批。

## 入门实验：离线健康基线

### 实验目标

不接触真实设备，用脱敏 CSV 模拟 VPLEX 日检输出，生成健康结论并理解每个异常状态为什么需要升级处理。

### 前提

- 安装 Python 3。
- 新建空目录 `vplex-lab`。
- 所有文件只含样例数据，不含真实 WWPN、IP、序列号和卷名。

### 第一步：创建 `vplex-health.csv`

```csv
object_type,name,cluster,health,operational,service_status,paths,rebuild_percent
cluster,cluster-1,cluster-1,ok,ok,running,8,100
cluster,cluster-2,cluster-2,ok,ok,running,8,100
distributed-device,dd_order_db,cluster-1,ok,ok,running,4,100
system-volume,meta_cluster_1,cluster-1,ok,ok,running,4,100
```

### 第二步：创建 `check_vplex.py`

```python
import csv
import sys

bad_rows = []

with open("vplex-health.csv", encoding="utf-8", newline="") as file:
    for row in csv.DictReader(file):
        state_ok = row["health"] == "ok" and row["operational"] == "ok"
        service_ok = row["service_status"] == "running"
        paths_ok = int(row["paths"]) >= 2
        if not (state_ok and service_ok and paths_ok):
            bad_rows.append(row)

if bad_rows:
    print("VPLEX_HEALTH=CRITICAL")
    for row in bad_rows:
        print(
            f'{row["object_type"]} {row["name"]}: '
            f'health={row["health"]}, operational={row["operational"]}, '
            f'service={row["service_status"]}, paths={row["paths"]}'
        )
    sys.exit(2)

print("VPLEX_HEALTH=OK")
```

### 第三步：运行

```powershell
python .\check_vplex.py
```

预期结果：

```text
VPLEX_HEALTH=OK
```

验证方法：执行 `$LASTEXITCODE`，应得到 `0`；同时人工核对 CSV 中每个对象都为 `ok/running` 且路径数不少于 2。

## 故障注入实验：模拟分区与单路径

### 实验目标

在样例副本中模拟分布式卷进入 `cluster-unreachable`，并模拟系统卷只剩一条路径，验证检查器能同时发现状态故障和冗余丢失。

### 精确步骤

1. 复制基线：`Copy-Item .\vplex-health.csv .\vplex-health.backup.csv`。
2. 把 `dd_order_db` 行改为 `degraded,stressed,cluster-unreachable,4,40`。
3. 把 `meta_cluster_1` 的 `paths` 改为 `1`。
4. 再次执行 `python .\check_vplex.py`。

预期结果：

```text
VPLEX_HEALTH=CRITICAL
distributed-device dd_order_db: health=degraded, operational=stressed, service=cluster-unreachable, paths=4
system-volume meta_cluster_1: health=ok, operational=ok, service=running, paths=1
```

验证方法：`$LASTEXITCODE` 应为 `2`。第一条异常说明 Metro 对端或站点间链路需要调查；第二条说明对象仍在线但已经失去路径冗余。

### 修复与回归

```powershell
Copy-Item .\vplex-health.backup.csv .\vplex-health.csv -Force
python .\check_vplex.py
```

应恢复 `VPLEX_HEALTH=OK`。实验结束后执行 `Remove-Item .\vplex-health.backup.csv` 清理备份副本。

### 如果没有成功

1. `python --version` 是否能显示 Python 3。
2. CSV 表头是否完整，逗号是否被中文标点替换。
3. 脚本与 CSV 是否在同一目录。
4. PowerShell 当前目录是否为 `vplex-lab`。
5. 是否把生产导出直接放进公开仓库；如果是，立即移除并检查 Git 历史中的敏感信息。

## 生产故障排查

### 主机少路径或卷不可见

1. 确认影响范围：单主机、单 Fabric、单 VPLEX 端口还是所有主机。
2. 主机检查 HBA link、WWPN、multipath path state 和最近扫描日志。
3. Fabric 检查 zoning、Name Server、端口错误与 SFP。
4. VPLEX 检查 Initiator 是否注册、Storage View 是否含正确卷与端口。
5. 核对后端卷健康，排除 VPLEX 后端路径故障。
6. 修复单条路径后验证路径数、I/O 和错误计数，不要通过重启所有主机掩盖根因。

### Metro 写延迟突然升高

证据顺序：应用延迟 -> 主机块设备延迟 -> VPLEX FE/Director/BE -> WAN RTT/丢包/抖动 -> 远端阵列 -> rebuild/迁移/备份任务 -> 最近变更。

可能原因包括站点间链路拥塞、远端阵列变慢、Distributed Device 重建、Director/端口热点或应用写模式变化。先隔离变量，不要只凭 WAN 平均 RTT 判断。

### 站点间链路中断

1. 建立统一事件时间线，确认两个站点和 Witness 的实际连通性。
2. 查询 `cluster summary`、`cluster status`、`ds summary --verbose` 与 Witness 健康。
3. 确认哪一侧仍在提供 I/O，应用是否发生写入。
4. 检查 Consistency Group、Detach Rule 和优选集群是否符合设计。
5. 在恢复链路前明确唯一权威数据侧和恢复步骤。
6. 任何 `resume`、`choose-winner` 或重新同步动作均需双人复核和厂商流程。

### 后端阵列维护后 Storage Volume unreachable

检查 VPLEX 后端端口、SAN zoning、阵列 LUN masking、目标端口状态和所有 Director 的可见性。常见错误是只让一台 Director 重新看到 LUN，表面恢复但留下单点。恢复后必须验证所有预期路径和持续错误计数。

## 事故场景：两个站点都声称自己应继续写

**现象：** WAN 中断后，站点 A 与 B 的应用团队都要求立即恢复写入。

**证据：**

- 两边 `cluster summary`、`ds summary --verbose` 和一致性组状态。
- Witness 到两集群的连通性与事件日志。
- Detach Rule、preferred cluster 的配置快照。
- 两边主机最近成功写入时间、数据库角色与事务日志位置。
- WAN、Fabric、阵列和变更时间线。

**假设：** 站点间分区、Witness 同时失联、规则配置错误，或人工在一侧绕过暂停状态。

**处置：** 先阻止双边人工恢复；确定唯一权威侧；在应用/数据库、存储和厂商支持共同确认后恢复服务。非权威侧保持隔离，按官方步骤重新同步。

**影响面与回滚：** 评估一致性组内所有卷和共享该链路的业务。回滚不是“让两边都写”，而是回到单一权威站点、受控访问和可验证的恢复点。

## 生产设计题

**题目：** 为两地机房的 Oracle RAC 设计 VPLEX Metro 存储接入，要求单 Fabric、单 Director、单阵列控制器或单站点故障时尽量保持服务。

答题主线：

1. 先说明 VPLEX 只提供块存储访问与同步，不替代 Oracle RAC/数据库仲裁和备份。
2. 两个独立 Fabric，主机双 HBA，VPLEX 前后端跨 Director/阵列控制器冗余。
3. 数据库相关卷纳入正确 Consistency Group，并让 preferred cluster 对齐业务主站。
4. Witness 位于第三故障域，验证三方网络独立性。
5. 以峰值写流量验证 RTT、带宽、后端延迟和故障后重建窗口。
6. 设计主机多路径、数据库服务漂移、网络流量切换、备份恢复和演练计划。
7. 建立端到端监控与变更关联，自动化只做证据收集和低风险诊断。

## 面试怎么讲

### 30 秒版本

```text
VPLEX 是主机与后端块存储之间的虚拟化层。它把后端 LUN 组织成 Virtual Volume，通过 Storage View 提供给主机；Metro 用两个集群的 Distributed Device 做同步双活，并用 Consistency Group、Detach Rule 和第三故障域 Witness 避免分区时双写。排障时我会按主机多路径、SAN、VPLEX 前端、Director、后端、阵列和 WAN 的数据路径逐层取证。
```

### 3 分钟版本要点

1. 讲清 Storage Volume -> Extent -> Device -> Virtual Volume -> Storage View。
2. 讲清 Local 与 Metro、同步写延迟和分布式卷重建。
3. 讲清 Witness 不走数据面、不能替代应用仲裁。
4. 讲清双 Fabric、多路径、系统卷、备份和升级前健康门禁。
5. 用链路分区事故说明如何确定唯一数据权威侧，而不是背恢复命令。

### 连续追问

**问：VPLEX Metro 和 SRDF/Metro 有什么区别？** 先从部署层次回答：VPLEX 是独立于后端阵列的虚拟化层，可覆盖受支持的异构阵列；SRDF/Metro 是 PowerMax/VMAX 阵列原生复制能力。再比较支持矩阵、故障仲裁、管理复杂度、性能和迁移需求。

**问：Witness 挂了业务会立刻停吗？** 不一定。要看当前集群和 WAN 是否健康、规则与故障组合。Witness 丢失首先意味着后续分区故障的自动判定能力下降，应立即告警并恢复冗余，而不是简单回答“业务一定中断”或“完全没影响”。

**问：为什么双活还要备份？** 双活解决可用性，不保证对逻辑删除、应用损坏、勒索和人为误操作提供历史恢复点。

**问：`need resume` 怎么处理？** 先确认两个站点谁是权威数据侧、是否发生双边写入及一致性组状态，再按版本对应的官方恢复流程处理；不能把 `resume` 当成通用修复按钮。

## 面试题

1. **从后端 LUN 到主机卷经过哪些 VPLEX 对象？** 按 Storage Volume、Extent、Device、Virtual Volume、Storage View 回答，并说明每层故障如何向上影响。
2. **VPLEX Metro 如何避免网络分区时双写？** 讲 Consistency Group、Detach Rule、preferred cluster、Witness 与唯一数据权威侧，不要只说“有仲裁”。
3. **为什么 Witness 必须在第三故障域？** 说明它要独立观察两个数据站点，若与任一站点共同失效就会降低故障判定能力。
4. **Metro 写延迟高怎么定位？** 按应用、主机、FE、Director、BE、两端阵列、WAN RTT/抖动和重建任务构建证据链。
5. **VPLEX 能否替代备份和数据库集群？** 明确不能，并分别说明块访问、事务一致性和历史恢复点的责任边界。

## 学习检查清单

- [ ] 我能画出主机、双 Fabric、VPLEX 前后端和阵列数据路径。
- [ ] 我能解释 Storage Volume、Extent、Device、Virtual Volume 和 Storage View。
- [ ] 我能解释 Distributed Device、Consistency Group、Detach Rule 和 Witness。
- [ ] 我知道 VPLEX 双活不等于应用双活，也不等于备份。
- [ ] 我能用只读命令检查集群、前后端、分布式卷和系统卷。
- [ ] 我能完成离线健康与故障注入实验。
- [ ] 我能按证据处理站点分区，而不是直接恢复两边 I/O。
- [ ] 我能回答生产架构、高可用、性能、安全、升级和故障场景追问。

## 学习证据

完成后可提交到 GitHub：

```text
vplex-lab/
  README.md                    # 画出数据路径并记录产品/版本边界
  vplex-health.csv             # 脱敏健康基线
  check_vplex.py               # 只读检查脚本
  incident-partition.md        # 分区故障证据、假设、处置与回滚
  screenshots/                 # 仅放脱敏结果截图
```

README 中注明：实验使用脱敏样例，并未在真实 VPLEX 上执行创建、删除、恢复或仲裁写操作。真实设备导出必须去除 IP、WWPN、序列号、业务卷名和客户信息。
