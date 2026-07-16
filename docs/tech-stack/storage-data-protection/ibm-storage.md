# IBM Storage 深讲

> 学习目标：从零理解块、文件、对象和磁带存储，能说清 IBM FlashSystem、Storage Virtualize、Storage Scale、Storage Ceph、DS8000、Cloud Object Storage、Storage Protect、Tape 和 Storage Insights 的分工；能读懂卷、池、主机映射、双控、多路径、快照、复制、备份和容量指标，完成一次离线健康分析实验，并按端到端链路排查常见存储故障。

## 官方资料

- [IBM 企业存储解决方案总览](https://www.ibm.com/solutions/storage)
- [IBM Storage FlashSystem](https://www.ibm.com/products/flashsystem)
- [IBM FlashSystem 9.1.2 文档](https://www.ibm.com/docs/en/flashsystem-9x00/9.1.2)
- [IBM Storage Virtualize 升级规划](https://www.ibm.com/support/pages/ibm-storage-virtualize-family-products-upgrade-planning)
- [IBM Storage Insights](https://www.ibm.com/products/storage-insights)
- [IBM Storage Insights 文档](https://www.ibm.com/docs/en/storage-insights)
- [IBM Storage Scale](https://www.ibm.com/products/storage-scale)
- [IBM Storage Scale 6.0.0 文档](https://www.ibm.com/docs/en/storage-scale/6.0.0)
- [IBM Storage Ceph](https://www.ibm.com/products/storage-ceph)
- [IBM Storage Ceph 9.9.1 文档](https://www.ibm.com/docs/en/storage-ceph/9.9.1)
- [IBM Storage DS8000](https://www.ibm.com/products/ds8000)
- [IBM Cloud Object Storage](https://www.ibm.com/products/cloud-object-storage)
- [IBM Storage Protect](https://www.ibm.com/products/storage-protect)
- [IBM Tape Storage](https://www.ibm.com/products/tape)

> 时点说明：本文按 2026 年 7 月仍可查到的 IBM 官方资料整理。IBM 的型号、软件版本、授权、支持矩阵和产品名称会变化，采购、扩容、升级或容灾设计前必须重新查看对应型号的 IBM Documentation、Fix Central、System Storage Interoperation Center 和支持生命周期。本文讲学习主线，不替代 IBM 或合作伙伴的正式方案设计。

## 官方知识地图

IBM Storage 不是一个软件包，也不是一台固定型号的设备。先按数据访问方式理解产品线：

```text
企业应用数据
  -> 块存储：FlashSystem / Storage Virtualize / DS8000
  -> 文件存储：Storage Scale
  -> 统一块、文件、对象：Storage Ceph
  -> 对象存储：Cloud Object Storage
  -> 备份与恢复：Storage Protect
  -> 长期保留和物理隔离：Tape
  -> 统一监控与支持：Storage Insights
```

本文按下面的顺序学习：

1. 先分清块、文件、对象、备份和归档。
2. 再理解 FlashSystem 与 Storage Virtualize 的块存储主线。
3. 再打通主机、SAN、存储端口、卷、池和物理介质的数据路径。
4. 再学习双控、多路径、快照、复制和备份的不同故障边界。
5. 最后把容量、性能、事件、复制和恢复数据接入 AIOps。

## 场景开场

凌晨 2 点，数据库告警显示写入延迟从 2 毫秒升到 40 毫秒。应用团队说数据库没有慢 SQL，系统团队说 CPU 和内存都正常，网络团队说业务网络没有丢包。

存储控制台同时出现池容量紧张和一个 SAN 路径异常。有人准备直接重启数据库，有人想删除旧快照，还有人说“阵列是双控，不会出问题”。

这时真正要回答的是：

- 慢的是应用、文件系统、多路径、交换机端口、存储控制器，还是后端介质？
- 主机看到的是一块真实磁盘，还是存储系统提供的逻辑卷？
- 一个路径坏了，主机有没有走另一条路径？
- 看到的 100 TB 是物理容量、可用容量、已分配容量，还是压缩后的有效容量？
- 删除快照能否安全释放空间，会不会破坏恢复链？
- 双控、RAID、复制、快照和备份分别能防哪类故障？

IBM Storage 的学习重点不是记型号，而是建立一条可以观测、验证和排障的数据路径。

## 一句话人话版

IBM Storage 是一组把硬盘和闪存组织成可靠数据服务，并通过块、文件、对象、复制、备份和监控能力交给业务使用的企业存储产品。

## 小白可能会问

- 服务器已经有硬盘，为什么还需要企业存储？
- FlashSystem、Storage Virtualize、Storage Scale 和 Storage Ceph 是什么关系？
- LUN、volume、vdisk、pool、MDisk 为什么看起来都像“磁盘”？
- 阵列有双控和 RAID 后，为什么还要多路径、复制和备份？
- 没有真实 IBM 阵列，能不能先学会监控和排障方法？

## 为什么 AIOps 工程师要学 IBM Storage

数据库、虚拟机、Kubernetes 持久卷、日志平台、备份系统和 AI 数据集最终都要落到存储。存储故障常常在上层表现为应用超时、数据库卡顿、节点失联或备份失败，很容易被误判成应用问题。

AIOps 工程师需要把存储数据放进完整故障上下文：

- **指标**：IOPS、吞吐量、响应时间、队列、容量、压缩率和复制延迟。
- **日志与事件**：控制器、端口、驱动器、卷、复制关系和 Call Home 事件。
- **拓扑**：应用到主机、HBA、SAN Fabric、存储端口、卷、池和阵列的依赖关系。
- **告警**：把单点阈值升级为容量趋势、路径冗余、持续时间和业务影响告警。
- **自动化**：自动采集只读证据、关联变更、创建工单和执行低风险检查。
- **根因分析**：区分应用慢、主机排队、SAN 拥塞、控制器过载和后端介质问题。
- **恢复验证**：证明快照、复制和备份真的能恢复，而不只是任务显示成功。

## IBM Storage 是什么

“Storage”在这里有两层意思：

1. 存储基础设施，把闪存、磁盘、磁带、网络和控制软件组合起来。
2. 数据服务，向主机或应用提供块、文件、对象、快照、复制、备份和归档能力。

企业存储与服务器本地盘的核心区别，不只是容量更大，而是把可用性、共享访问、数据保护、容量效率、统一管理和跨站点恢复做成平台能力。

## 它解决什么问题

- 多台主机需要稳定、受控地共享企业级存储容量。
- 单盘、单控制器、单链路或单站点故障不能轻易中断核心业务。
- 容量需要按业务动态分配，并能统一扩容、迁移和回收。
- 数据要有时间点副本、远程复制、独立备份和长期保留等多层保护。
- 运维团队需要统一看到健康、性能、容量、配置、事件和恢复能力。
- 故障发生后，团队需要沿应用、主机、SAN、控制器、卷、池和介质快速定位影响层。

## 先分清四种访问方式

| 类型 | 应用看到什么 | 常见接口或协议 | 典型 IBM 产品 | 适合场景 |
|---|---|---|---|---|
| 块存储 | 一块可分区、可格式化的逻辑磁盘 | Fibre Channel、iSCSI、NVMe/FC、NVMe/TCP | FlashSystem、Storage Virtualize、DS8000、Storage Ceph | 数据库、虚拟机、核心交易 |
| 文件存储 | 目录和文件 | NFS、SMB、POSIX | Storage Scale、Storage Ceph | AI 数据集、共享文件、HPC |
| 对象存储 | bucket 中带元数据的 object | S3、Swift、REST API | Cloud Object Storage、Storage Ceph | 备份、归档、数据湖、云原生应用 |
| 磁带 | 顺序写入的可移动介质 | 磁带库、驱动器、LTFS | IBM Tape、Storage Protect | 长期保留、离线副本、低成本归档 |

Fibre Channel，简称 FC，是为存储流量设计的高速网络协议。SAN 是 Storage Area Network，中文常说存储区域网络。HBA 是 Host Bus Adapter，主机总线适配器，负责让服务器接入 FC SAN。

块、文件和对象不是性能等级。对象存储不等于一定慢，块存储也不等于一定快。最终表现取决于协议、网络、控制器、介质、数据布局、工作负载和配置。

## IBM 产品线怎么选

| 产品 | 核心定位 | 先掌握什么 | 不要误解成什么 |
|---|---|---|---|
| FlashSystem | 基于 Storage Virtualize 的企业块存储 | 池、卷、主机映射、双控、复制、数据缩减 | 只有闪存硬件 |
| Storage Virtualize | 统一虚拟化和管理块存储的数据服务软件 | MDisk、pool、volume、copy services | 文件系统或备份软件 |
| Storage Scale | 高性能并行共享文件和非结构化数据平台 | cluster、node、filesystem、NSD、policy | 普通单机 NFS |
| Storage Ceph | 软件定义的统一块、文件、对象存储 | MON、MGR、OSD、pool、RBD、CephFS、S3 gateway | 单台存储设备 |
| DS8000 | 面向 IBM Z 和 IBM i 等关键负载的企业块存储 | FICON/FCP、FlashCopy、HyperSwap、复制 | FlashSystem 的简单大型号 |
| Cloud Object Storage | 大规模 S3 对象存储 | bucket、object、resiliency、storage class、retention | 可直接挂载的普通磁盘 |
| Storage Protect | 备份、恢复、保留和数据保护管理 | client、server、policy、storage pool、catalog | 阵列快照的别名 |
| Tape | 长期保留和物理隔离介质 | library、drive、cartridge、pool、offsite copy | 在线随机访问主存储 |
| Storage Insights | 存储健康、容量、性能、配置和支持可观测性 | data collector、probe、performance monitor、alert | 所有产品的配置控制面 |

## 架构和数据流：FlashSystem 与 Storage Virtualize 主线

多数企业块存储入门知识，可以用下面这条链理解：

```text
应用 / 数据库
  -> 文件系统或数据库裸设备
  -> 操作系统多路径设备
  -> HBA 或以太网存储接口
  -> SAN Fabric A 和 Fabric B
  -> FlashSystem 前端端口
  -> I/O Group 中的两个 node canister
  -> volume / vdisk
  -> storage pool / MDisk group
  -> MDisk / array
  -> FlashCore Module、NVMe SSD 或被虚拟化的外部存储
```

node canister 可以理解为控制器节点。两个节点组成 I/O Group，共同为卷提供访问路径。MDisk 是 Managed Disk，表示 Storage Virtualize 管理的后端存储单元。MDisk group 是旧命令和许多输出中对 storage pool 的称呼。vdisk 是旧命令中对 volume 的称呼。

### 一次写入怎么走

1. 数据库发出写请求。
2. 操作系统把请求交给多路径设备。
3. 多路径软件选择一条可用路径，经 HBA 和 SAN 交换机到达存储端口。
4. Storage Virtualize 接收请求，通过缓存和元数据确认卷的位置。
5. 数据被写到卷对应的 extent，再落到池中的 MDisk 或内部阵列。
6. 存储向主机返回完成状态，监控系统同时记录 IOPS、吞吐量和响应时间。

extent 是池中的固定大小分配单元。卷通常不是绑定某一块物理盘，而是由分布在池内的许多 extent 组成。

## 核心知识树

### 1. volume、LUN 与主机映射

**是什么**：volume 是存储系统提供的逻辑块设备。主机经常把映射后的逻辑单元叫 LUN，LUN 是 Logical Unit Number。

**为什么需要**：应用不应该直接管理阵列里的每块盘。存储管理员可以按容量、性能和保护策略创建卷，再只授权给指定主机或主机集群。

**怎么工作**：存储通过主机的 WWPN、IQN 或 NQN 识别发起端。WWPN 用于 FC，IQN 用于 iSCSI，NQN 用于 NVMe-oF。卷映射把 volume 与 host 关联，并分配主机侧可识别的逻辑编号。

**怎么看 / 怎么用**：用 `lsvdisk` 查看卷，用 `lshost` 查看主机对象，用 `lshostvdiskmap` 查看映射。主机侧还要重新扫描总线并检查多路径设备。

**坏了怎么查**：先确认卷在线，再确认映射、主机标识、SAN zoning、存储端口登录和多路径状态。不要看到主机没盘就立即删除并重建映射。

### 2. pool、MDisk 与 extent

**是什么**：pool 是向卷分配容量的逻辑资源池，底层由一个或多个 MDisk 或内部 array 提供空间。

**为什么需要**：把物理介质和业务卷解耦，才能统一扩容、迁移、分层、虚拟化和统计容量。

**怎么工作**：后端容量被切成 extent，创建或扩展卷时从池中分配。不同池可以承载不同性能、保护级别和业务重要性的工作负载。

**怎么看 / 怎么用**：用 `lsmdiskgrp` 查看池状态和容量，用 `lsmdisk`、`lsarray`、`lsdrive` 逐层查看后端资源。

**坏了怎么查**：池告警时先区分容量不足、后端 MDisk 离线、array 降级、驱动器故障或控制器不可达。只扩容卷不会增加池的物理容量。

### 3. thin provisioning 与数据缩减

**是什么**：thin provisioning 是精简配置，先给主机较大的逻辑容量，只有实际写入时才消耗更多物理空间。压缩和去重进一步减少物理占用。

**为什么需要**：业务申请容量通常有余量，一次性预留全部物理空间会造成浪费。

**怎么工作**：系统分别记录 provisioned、used、written 和 physical capacity。不同版本、池类型与 FlashCore Module 支持的数据缩减能力不同。

**怎么看 / 怎么用**：同时看池可用空间、逻辑分配、实际写入、数据缩减率和增长速度，不能只看一个“有效容量”数字。

**坏了怎么查**：最危险的是逻辑分配继续增长而物理池接近耗尽。压缩率也不是承诺值，数据库加密、已经压缩的文件和随机数据可能几乎无法再压缩。

### 4. 双控、I/O Group 与 quorum

**是什么**：双控让两个控制器节点共同提供卷访问；quorum 是仲裁信息，用于在节点或站点通信异常时避免双方都继续写入造成分裂。

**为什么需要**：单个控制器维护、重启或故障时，业务仍应通过另一个节点访问数据。

**怎么工作**：卷由 I/O Group 提供服务，主机通过多条前端路径连接两个节点。控制器高可用、主机多路径、双 Fabric 和后端冗余必须同时成立。

**怎么看 / 怎么用**：用 `lsnodecanister` 看节点状态，用 `lssystem` 看系统与 quorum 配置，用主机多路径工具确认到两个控制器和两张 Fabric 的路径。

**坏了怎么查**：双控正常不代表主机有冗余。如果 zoning 只接到一个节点，或者多路径未安装，单个端口故障仍会让业务中断。

### 5. SAN zoning 与 multipath

**是什么**：zoning 控制哪些主机 HBA 端口能和哪些存储端口通信；multipath 把同一 LUN 的多条物理路径合成一个逻辑设备。

**为什么需要**：既要限制访问边界，也要避免 HBA、光纤、交换机、存储端口或控制器成为单点。

**怎么工作**：生产环境通常使用两张独立 Fabric。主机每张 HBA 分别连接不同 Fabric，再分别到达存储的两个控制器。

**怎么看 / 怎么用**：Linux 常用 `multipath -ll`，AIX 常用 `lspath`，VMware 在设备路径页面查看 active、standby、dead 状态。交换机侧检查端口、错误计数、登录和 zoning。

**坏了怎么查**：先确认操作系统是否把多条路径识别为同一个设备，再查失效路径对应的 HBA、交换机端口、zone 和存储端口。不要在路径抖动时反复扫描或强制删除设备。

### 6. RAID、快照、复制和备份

| 能力 | 主要保护对象 | 能防什么 | 不能单独防什么 |
|---|---|---|---|
| RAID / Distributed RAID | 介质故障 | 单盘或部分驱动器故障 | 误删除、勒索、站点灾难 |
| 双控与多路径 | 访问路径 | 控制器、端口、链路维护和故障 | 数据逻辑损坏 |
| FlashCopy / snapshot | 时间点状态 | 快速回滚、测试副本 | 同一故障域损坏、长期独立保留 |
| Metro Mirror | 同步远程复制 | 较低 RPO 的站点保护 | 误删除同步传播、应用一致性缺失 |
| Global Mirror | 异步远程复制 | 远距离容灾、降低链路时延影响 | 零数据丢失保证 |
| HyperSwap / HA | 跨站点连续访问 | 站点或阵列故障切换 | 错误数据和恶意加密传播 |
| Safeguarded Copy | 受保护的时间点副本 | 防止普通管理操作篡改或删除副本 | 未验证恢复、超出保留期的数据 |
| Storage Protect / 独立备份 | 独立恢复副本与目录 | 误删、损坏、长期保留、跨介质恢复 | 未纳管数据、失败但未发现的任务 |
| Tape 离线副本 | 长期介质 | 物理隔离、低成本保留 | 快速在线恢复和随机访问 |

最重要的结论是：RAID 不是备份，快照不是独立备份，复制也不是备份。一个可恢复方案要同时定义 RPO、RTO、故障域、保留期、不可变性和恢复验证。

RPO 是 Recovery Point Objective，可接受的数据丢失时间窗口。RTO 是 Recovery Time Objective，可接受的恢复时长。

### 7. FlashCopy 与 Safeguarded Copy

**是什么**：FlashCopy 建立卷的时间点副本关系。Safeguarded Copy 使用受保护策略创建不可由普通操作随意修改或删除的副本。

**为什么需要**：数据库误操作、勒索加密或升级失败后，需要回到受影响前的状态。

**怎么工作**：时间点副本依赖映射、元数据和后台复制机制。副本一致性还取决于应用是否冻结写入、刷新缓存或使用应用一致性编排。

**怎么看 / 怎么用**：查看 snapshot policy、volume group、FlashCopy mapping、受保护副本保留和恢复演练记录。

**坏了怎么查**：确认策略是否真正执行、最近成功时间是否满足 RPO、池是否有足够空间、恢复主机是否隔离，以及数据库能否打开并通过业务校验。

## 其他 IBM Storage 产品的边界

### Storage Scale

Storage Scale 基于 GPFS 技术，是并行集群文件系统。多个节点可以并发访问同一文件系统，适合 HPC、AI 训练、分析和大规模非结构化数据。

核心对象包括 cluster、node、filesystem、NSD 和 policy。NSD 是 Network Shared Disk，表示由 Storage Scale 管理并提供给集群的数据设备。排障要同时看集群 quorum、节点、文件系统挂载、NSD、网络和磁盘状态。

### Storage Ceph

Storage Ceph 是软件定义的分布式存储，可以提供块、文件和对象接口。MON 保存集群地图并维持一致性，MGR 提供管理与监控，OSD 存储数据并执行复制、纠删码、恢复和重平衡。

Ceph 的容量和性能来自多节点共同工作。节点或 OSD 故障后，恢复和 rebalancing 会额外消耗网络与磁盘资源，AIOps 不能只告警“一个 OSD down”，还要关联降级对象数、恢复速率和业务延迟。

### DS8000

DS8000 面向 IBM Z、IBM i 和高事务关键负载，支持 FICON 和 FCP，并提供 FlashCopy、HyperSwap、Safeguarded Copy 和多站点复制等能力。它与 FlashSystem 有相似的企业存储目标，但硬件架构、主机集成、命令和运维流程不同，不能直接套用 FlashSystem CLI。

### Cloud Object Storage

Cloud Object Storage 把数据存为 bucket 中的 object，通过 S3 风格 API 访问。对象带有 key 和 metadata，没有传统块设备那样的分区和文件系统语义。

监控时要关注容量、请求率、错误率、首字节延迟、生命周期、保留策略、跨区域韧性和凭据权限。对象存储的 durability 不等于业务 availability，也不等于已经有独立备份。

### Storage Protect 与 Tape

Storage Protect 管理备份客户端、策略、版本、存储池、目录和恢复流程，可以把数据写到磁盘、对象存储或磁带。Tape 适合长期保留和离线副本，但恢复速度、装载、介质管理和异地取回必须进入 RTO 设计。

备份系统最重要的指标不是“任务成功率”一个数字，而是关键资产覆盖率、最近可恢复点、恢复演练成功率、目录健康、介质可读性和实际恢复时间。

## 安装与启动

FlashSystem 和 DS8000 是企业设备，没有适合普通电脑的通用安装包。正式上架通常涉及机柜、电源、管理网络、服务 IP、前端端口、SAN、支持注册、时间同步、DNS、认证、加密和 Call Home，应由有授权的人员按具体型号安装指南实施。

零基础学习分三条路径：

1. 使用 IBM FlashSystem 官方自助演示熟悉 GUI，但不要把演示环境当生产配置依据。
2. 在已授权的实验或生产系统使用只读账号执行查询命令。
3. 没有设备时，先完成本文的离线指标分析实验，掌握对象、指标和排障顺序。

首次连接真实 FlashSystem 前，至少确认：

- 管理 IP、DNS、NTP 和时区已经评审。
- 账号使用个人身份并遵循最小权限，不共用超级管理员。
- SSH host key 和 HTTPS 证书经过确认。
- 当前型号、软件级别、支持状态和兼容矩阵已经记录。
- 任何创建、映射、删除、扩容、迁移和复制操作都有变更单与回退方案。

连接只读 CLI 的常见方式：

```powershell
ssh monitor@192.0.2.20 # 用授权的只读账号连接管理地址；192.0.2.0/24 是文档示例网段
```

登录后先执行：

```text
lssystem       # 查看系统身份、状态、容量和关键功能
lsnodecanister # 查看两个控制器节点是否在线
lseventlog     # 查看事件；先处理未修复的错误和告警
```

预期结果：系统和两个节点处于正常在线状态，命令返回码为 `0`，没有需要立即处置的未修复严重事件。命令返回码为 `1` 时，应先读取标准错误中的 IBM CLI 错误代码，不要反复执行写操作。

## 配置详解：先写设计单

下面是学习用 YAML，不是可以直接导入阵列的配置文件：

```yaml
request_id: CHG-2026-0716-001       # 关联审批、实施、验证和回退记录
application: order-db               # 说明卷服务哪个业务，避免出现无人认领卷
environment: production             # 区分生产、测试和开发环境
storage_class: gold                 # 映射组织内部定义的性能、可用性和保护策略
capacity_gib: 2048                  # 主机申请的逻辑容量，不等于立即占用的物理容量
pool: prod_flash_pool               # 选择已经评审容量和故障域的存储池
provisioning: thin                  # 精简配置必须同时设置物理池容量告警
host_cluster: oracle-rac-prod       # 映射给主机集群，不要误映射给无关服务器
protocol: fc                        # FC 还需要 WWPN、双 Fabric zoning 和多路径
snapshot_policy: hourly-24-daily-30 # 这里只表达目标，实际策略按版本和业务 RPO 设计
replication: metro-mirror           # 同步复制需要评估链路时延、带宽和站点故障域
rpo_minutes: 0                      # 业务目标；不能只靠字段声明，必须验证实际能力
rto_minutes: 30                     # 包括发现、决策、切换、启动和业务校验时间
owner: database-platform            # 明确容量、性能和恢复问题的责任团队
```

配置评审至少回答：

| 字段 | 要回答的问题 | 常见坑 |
|---|---|---|
| `capacity_gib` | 当前和 12 个月增长需要多少容量 | 把逻辑容量直接当物理采购量 |
| `pool` | 池的性能、冗余、剩余空间和故障域是否合适 | 所有业务挤进同一池 |
| `provisioning` | thick 还是 thin，谁监控物理池 | thin 卷总分配远超可承受增长 |
| `host_cluster` | 哪些节点必须看到相同 LUN | 只映射一个 RAC 或虚拟化节点 |
| `protocol` | FC、iSCSI 还是 NVMe-oF | 存储配置好了但网络和多路径没完成 |
| `snapshot_policy` | 需要多密的恢复点和多长保留 | 只创建策略，从不做恢复验证 |
| `replication` | 同步还是异步，正常和故障时数据怎么走 | 把复制当成独立备份 |
| `rpo_minutes` | 最多允许丢多少数据 | 目标与复制、备份周期不一致 |
| `rto_minutes` | 多久必须恢复业务 | 只计算存储切换，不算应用启动和校验 |

## 常用只读命令

不同 Storage Virtualize 版本和产品支持的字段可能不同。先用当前版本命令帮助和 IBM Documentation 核对，不要把网上旧命令直接用于生产。

```text
lssystem -delim :          # 输出系统详细信息，并用冒号分隔字段，便于脚本解析
lsnodecanister -delim :    # 查看控制器节点、I/O Group 和在线状态
lsdrive -delim :           # 查看驱动器状态、位置和寿命相关字段
lsarray -delim :           # 查看内部阵列和降级状态
lsmdisk -delim :           # 查看 Storage Virtualize 管理的后端磁盘
lsmdiskgrp -delim :        # 查看存储池容量、状态和数据缩减信息
lsvdisk -delim :           # 查看卷的容量、状态、池和 I/O Group
lshost -delim :            # 查看主机对象和协议标识
lshostvdiskmap -delim :    # 查看主机与卷的映射关系
lsportfc -delim :          # 查看 FC 端口状态、速度和 WWPN
lsfabric -delim :          # 查看已登录的主机和 Fabric 可见性
lsfcmap -delim :           # 查看 FlashCopy mapping 状态
lsrcrelationship -delim :  # 查看远程复制关系和同步状态
lseventlog -delim :        # 查看系统事件，结合修复状态和时间排查
```

正常结果不是“命令能运行”就结束，而是对象之间能对上：业务主机存在、主机标识正确、卷在线、映射正确、路径冗余、池有余量、后端健康、复制满足 RPO、严重事件已经闭环。

## 命令字典

| 命令 | 作用 | 关键结果 | AIOps 场景 | 常见坑 |
|---|---|---|---|---|
| `lssystem` | 查看系统总览 | 状态、代码级别、容量、quorum、功能开关 | 资产发现和系统级健康基线 | 不同版本字段不同 |
| `lsnodecanister` | 查看控制器节点 | status、I/O Group、配置节点 | 双控状态和节点变更关联 | 两节点在线不等于主机路径冗余 |
| `lsdrive` | 查看物理驱动器 | status、slot、use、寿命 | 介质故障和寿命趋势 | 直接换盘前未确认型号和维护流程 |
| `lsarray` | 查看内部阵列 | status、RAID、成员 | 重建和降级事件关联 | 重建期间忽略性能影响 |
| `lsmdisk` | 查看后端 MDisk | status、mode、pool | 外部存储和后端故障定位 | 把 MDisk 与业务卷混为一谈 |
| `lsmdiskgrp` | 查看存储池 | physical、usable、free、virtual | 容量预测和超配风险 | 只看压缩后有效容量 |
| `lsvdisk` | 查看卷 | status、capacity、pool、I/O Group | 业务卷健康和热点分析 | vdisk 是历史命令名称，不是虚拟机磁盘 |
| `lshost` | 查看主机对象 | WWPN、IQN、NQN、type | CMDB 对账和孤儿主机发现 | 主机名正确但 initiator 已更换 |
| `lshostvdiskmap` | 查看卷映射 | host、volume、SCSI ID | 主机看不到 LUN 的检查 | 映射存在但 zoning 不通 |
| `lsportfc` | 查看 FC 端口 | status、speed、WWPN | 端口故障和降速告警 | 端口 online 不代表无 CRC 错误或拥塞 |
| `lsfabric` | 查看 Fabric 登录 | host port、storage port | 核对端到端登录 | 临时登录残留造成判断混乱 |
| `lsfcmap` | 查看 FlashCopy | source、target、status、progress | 快照失败和恢复点新鲜度 | 一致性和容量没有验证 |
| `lsrcrelationship` | 查看远程复制 | state、primary、secondary、progress | RPO 和复制中断告警 | relationship 存在不等于数据已同步 |
| `lseventlog` | 查看事件 | sequence、timestamp、error、fixed | 事件关联、自动建单和 RCA | 只清事件不处理根因 |

## 主机侧常用检查

存储控制台正常时，还要检查主机侧。下面命令只读，但仍应在授权窗口执行。

```bash
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS # Linux 查看块设备、文件系统和挂载关系
multipath -ll                             # Linux 查看每个多路径设备及其 path 状态
cat /sys/class/fc_host/host*/port_state   # Linux 查看 FC HBA 端口是否 Online
cat /sys/class/fc_host/host*/port_name    # Linux 查看 HBA WWPN，和存储主机对象对账
iostat -x 1 5                             # Linux 连续采样设备等待、队列和利用率
```

```text
lspath         # AIX 查看磁盘路径是否 Enabled
lsmpio -ql hdisk2 # AIX 查看指定多路径磁盘的路径和属性；设备名按现场替换
```

正常结果：同一个业务 LUN 只有一个多路径设备，多条底层路径分布到独立 HBA、Fabric 和存储控制器；没有 failed 或 missing 路径；主机 WWPN 与 `lshost` 中配置一致。

## 存储指标怎么读

### IOPS、吞吐量和响应时间

- **IOPS** 是每秒 I/O 次数，适合描述大量小块随机请求。
- **吞吐量** 常用 MiB/s 或 GiB/s，适合描述大块顺序读写。
- **response time / latency** 是请求响应时间，通常按读写和资源层级拆分。

同样 10,000 IOPS，4 KiB 随机读与 1 MiB 顺序写完全不是同一种压力。任何性能结论都要带上读写比例、块大小、并发、缓存命中和时间窗口。

### 容量

至少区分：

- raw capacity：介质原始容量。
- usable capacity：经过 RAID、备用空间和系统开销后的可用容量。
- provisioned capacity：分配给卷的逻辑容量。
- written / used capacity：业务实际写入或占用容量。
- physical capacity：数据缩减后真正消耗的物理容量。
- effective capacity：按特定数据缩减假设展示的可承载容量。

容量告警不能只用固定百分比。还要计算增长速度、预计耗尽时间、快照和复制额外需求、重建保留空间，以及采购交付周期。

### AIOps 建议指标

| 指标 | 表示什么 | 告警思路 |
|---|---|---|
| system/node health | 系统与控制器是否正常 | 非 online 立即关联业务和路径 |
| unfixed event count | 未修复事件数量 | 按严重度、持续时间和影响升级 |
| volume response time | 业务卷响应时间 | 与主机延迟、IOPS、吞吐和变更联合判断 |
| port utilization | 前端端口利用率 | 持续高利用率加拥塞或错误才升级 |
| path redundancy | 主机可用路径数 | 从冗余降为单路径立即处理 |
| pool used percent | 池物理容量占用 | 结合增长趋势和交付周期预测 |
| thin overcommit ratio | 逻辑分配与物理承载关系 | 结合真实写入增长，不照抄统一阈值 |
| data reduction ratio | 压缩去重效果 | 突变时关联工作负载和加密变化 |
| copy age | 最近可用副本距当前时间 | 超过业务 RPO 告警 |
| replication lag | 主从差距或未同步量 | 结合链路、带宽和业务写入速率 |
| restore test age | 距最近成功恢复演练的时间 | 过期说明恢复能力未经验证 |
| data collection status | 监控采集是否新鲜 | 数据断流必须告警，避免把缺数据当健康 |

## Storage Insights 在 AIOps 中的位置

Storage Insights 可以采集和展示存储健康、容量、配置和性能元数据，并提供趋势、告警和支持协作。不同版本、授权和设备类型可用功能不同。

官方资料显示，多数设备的 performance monitor 以分钟级采集性能数据，probe 以更低频率采集配置、容量和状态数据。做 RCA 时必须记录数据采样频率，不能用一天一次的配置探测去证明一分钟内没有发生性能抖动。

```text
FlashSystem / DS8000 / 交换机 / 主机
  -> Data Collector、Call Home、probe、performance monitor
  -> Storage Insights
  -> 健康、容量、性能、配置和事件
  -> 告警 / 工单 / Runbook / RCA
  -> 变更、扩容、路径修复、复制修复或恢复演练
  -> 验证业务指标恢复
```

AIOps 自动化应优先做只读采集、对象关联、影响分析和审批辅助。删除卷、强制移除池、切换复制方向、故障转移和恢复覆盖都属于高风险动作，不应由模型根据单个告警直接执行。

## 入门实验：分析 IBM 块存储健康样本

### 实验目标

在没有 IBM 阵列的 Windows 学习机上，分析一组脱敏的 FlashSystem 风格指标，识别容量风险、性能风险、路径降级和未修复事件，输出可提交 GitHub 的 CSV 报告。

### 实验步骤

打开 PowerShell，执行：

```powershell
$lab = Join-Path $PWD 'labs\ibm-storage-health' # 把实验文件集中到独立目录
New-Item -ItemType Directory -Force -Path $lab | Out-Null # 目录存在时可重复执行

@'
timestamp,system,pool,volume,iops,throughput_mib_s,latency_ms,pool_used_percent,node_status,path_status,unfixed_events
2026-07-16T09:00:00+08:00,fs-prod-01,prod_flash_pool,order-db,8200,510,2.4,68,online,healthy,0
2026-07-16T09:05:00+08:00,fs-prod-01,prod_flash_pool,order-db,9100,560,2.8,88,online,healthy,0
2026-07-16T09:10:00+08:00,fs-ai-01,ai_pool,training-data,24000,3100,14.2,72,online,healthy,0
2026-07-16T09:15:00+08:00,fs-core-01,core_pool,erp-db,7600,430,6.1,74,online,degraded,2
'@ | Set-Content -LiteralPath (Join-Path $lab 'metrics.csv') -Encoding UTF8 # 写入脱敏样本

$rows = Import-Csv -LiteralPath (Join-Path $lab 'metrics.csv') # 读取每个采样点
$report = foreach ($row in $rows) {
    $reasons = [System.Collections.Generic.List[string]]::new() # 收集同一采样点的所有风险原因
    $severity = 'OK' # 没有命中规则时保持正常

    if ($row.node_status -ne 'online') {
        $severity = 'CRITICAL' # 控制器节点异常直接判为严重
        $reasons.Add("node=$($row.node_status)")
    }
    if ($row.path_status -ne 'healthy') {
        $severity = 'CRITICAL' # 多路径降级可能使下一次链路故障中断业务
        $reasons.Add("path=$($row.path_status)")
    }
    if ([int]$row.unfixed_events -gt 0) {
        $severity = 'CRITICAL' # 未修复事件必须进入处置闭环
        $reasons.Add("unfixed_events=$($row.unfixed_events)")
    }
    if ([double]$row.pool_used_percent -ge 85) {
        if ($severity -eq 'OK') { $severity = 'WARNING' }
        $reasons.Add("pool_used=$($row.pool_used_percent)%")
    }
    if ([double]$row.latency_ms -ge 10) {
        if ($severity -eq 'OK') { $severity = 'WARNING' }
        $reasons.Add("latency=$($row.latency_ms)ms")
    }

    [pscustomobject]@{
        timestamp = $row.timestamp
        system = $row.system
        volume = $row.volume
        severity = $severity
        reason = if ($reasons.Count) { $reasons -join '; ' } else { 'healthy' }
    }
}

$report | Format-Table -AutoSize # 在终端查看分级结果
$report | Export-Csv -LiteralPath (Join-Path $lab 'health-report.csv') -NoTypeInformation -Encoding UTF8 # 保存学习证据

if (@($report | Where-Object severity -eq 'CRITICAL').Count -ne 1) {
    throw '验证失败：预期正好识别 1 条 CRITICAL 记录。' # 用断言防止脚本悄悄产出错误结果
}
```

### 预期结果

终端应显示：

```text
timestamp                  system     volume        severity reason
---------                  ------     ------        -------- ------
2026-07-16T09:00:00+08:00 fs-prod-01 order-db      OK       healthy
2026-07-16T09:05:00+08:00 fs-prod-01 order-db      WARNING  pool_used=88%
2026-07-16T09:10:00+08:00 fs-ai-01   training-data WARNING  latency=14.2ms
2026-07-16T09:15:00+08:00 fs-core-01 erp-db        CRITICAL path=degraded; unfixed_events=2
```

实验目录中应生成 `metrics.csv` 和 `health-report.csv`。这个实验只演示规则和证据格式，`85%` 与 `10 ms` 不是适用于所有业务的 IBM 官方统一阈值。生产阈值必须按工作负载基线、SLO、持续时间和容量交付周期校准。

### 验证方法

```powershell
Import-Csv .\labs\ibm-storage-health\health-report.csv | Group-Object severity | Select-Object Name,Count # 应看到 OK、WARNING、CRITICAL 的数量分别为 1、2、1
```

然后回答：

1. `order-db` 容量告警是立即扩容，还是先看增长趋势和快照占用？
2. `training-data` 延迟升高时，IOPS 和吞吐量说明它可能是哪类工作负载？
3. `erp-db` 为什么应先恢复路径冗余并处理事件，而不是只看 6.1 ms 延迟？

### 如果没有成功

按顺序检查：

1. 当前 PowerShell 是否有权在仓库中创建 `labs` 目录。
2. `metrics.csv` 是否使用逗号分隔，表头有没有被手工换行。
3. 数值字段是否仍使用点作为小数点。
4. 是否修改了样本，导致 CRITICAL 数量不再是 1。
5. `health-report.csv` 是否被 Excel 占用，导致无法覆盖写入。

## 常见故障排查

### 主机看不到新 LUN

按数据路径逐层确认：

1. `lsvdisk`：卷是否 online，容量和 I/O Group 是否正确。
2. `lshostvdiskmap`：卷是否映射给正确 host 或 host cluster。
3. `lshost`：WWPN、IQN 或 NQN 是否和主机当前值一致。
4. `lsfabric`：主机发起端是否登录到预期存储端口。
5. SAN 交换机：两张 Fabric 的 zoning 是否都生效。
6. 主机：HBA 是否 Online，是否完成安全的总线扫描。
7. 多路径：新路径是否合并成一个设备，而不是出现重复磁盘。

常见根因是换 HBA 后 WWPN 没更新、只完成一张 Fabric、映射给同名旧主机对象，或主机没有重新扫描。修复后要验证读写和路径切换，不只验证“能看到盘”。

### 业务延迟突然升高

先确定发生时间和受影响对象，再对齐：

- 应用和数据库延迟。
- 主机 `iostat` 的等待、队列和设备利用率。
- volume、pool、node、port 和 backend 的响应时间。
- IOPS、吞吐量、块大小与读写比例。
- SAN 端口拥塞、CRC、丢弃和 slow drain 现象。
- 同期备份、快照、复制、迁移、重建、升级和批处理变更。

如果只有一个卷慢，优先查该卷和工作负载。如果同一池所有卷慢，查池和后端。如果多个池和端口同时慢，查节点、前端链路或系统级变更。

### 多路径从冗余变成单路径

先保留仍可用路径，不要贸然重启或删除设备。把失效 path 映射到主机 HBA、交换机端口、zone、存储端口和控制器节点，确认是计划维护还是意外故障。

修复后验证路径数量、路径分布和故障切换。只恢复到“两条路径”还不够，如果两条都经过同一 HBA 或同一 Fabric，仍然存在共同故障点。

### pool 容量紧张

先区分物理使用率、逻辑分配、实际写入、快照占用、复制开销和数据缩减变化。计算最近 7、30、90 天增长速度和预计耗尽时间，再决定清理、迁移、扩容或调整保留策略。

不要直接删除不认识的卷或 FlashCopy。先查业务所有者、主机映射、最近 I/O、复制关系、快照链、备份和变更记录。

### volume 或 MDisk offline

先看 `lseventlog`，再从 volume 向 pool、MDisk、array、drive 或外部存储追踪。offline 可能来自后端不可达、阵列降级、节点问题、保护机制或配置变更。

不要用强制删除、强制脱离池或重新初始化来“清告警”。这类动作可能破坏唯一数据副本，应按 IBM 错误代码和支持流程处理。

### 远程复制不同步

检查 relationship 状态、主从角色、链路连通性、带宽限制、写入速率、积压量、目标池容量和双方代码兼容性。同步复制还要检查站点延迟，异步复制要确认实际 lag 是否超过 RPO。

恢复关系后，要确认数据重新同步完成、应用一致性成立、故障转移 Runbook 更新，并安排非生产演练。

### 快照存在但恢复失败

检查副本时间是否在事故前、策略是否成功、源和目标状态、依赖卷组、池容量、恢复主机隔离和应用一致性。数据库能挂载不等于业务恢复成功，还要做事务、对象数量和关键查询校验。

### Storage Insights 显示设备 unreachable

区分设备本身故障和采集链路故障。检查 Data Collector、probe、performance monitor、凭据权限、管理网络、证书、DNS、时间同步和防火墙。

采集失败期间不能把空白图表解释成“没有异常”。应单独告警数据新鲜度，并在 RCA 中标记观测盲区。

## 变更与升级

Storage Virtualize 版本可能分为长期支持和非长期支持分支。不要只因为版本号更高就直接升级，也不要长期停在已结束支持的版本。

升级前至少完成：

- 核对具体型号、当前代码、目标代码、升级路径和中间版本要求。
- 核对主机操作系统、HBA、驱动、multipath、交换机和外部存储兼容性。
- 检查系统、节点、池、卷、复制和事件全部处于允许升级的状态。
- 阅读目标版本 release notes、已知问题和 APAR。
- 确认配置备份、支持渠道、维护窗口、业务验证和停止条件。
- 观察升级前基线，并在每个节点升级后验证路径、延迟和事件。

并发升级不等于无风险升级。主机多路径或 SAN 冗余配置错误时，一个控制器进入维护就可能暴露单点。

## 面试怎么讲

IBM Storage 不是单一阵列，而是一套覆盖块、文件、对象、备份和磁带的数据基础设施。块存储主线通常以 FlashSystem 和 Storage Virtualize 为核心：主机通过双 HBA 和双 Fabric 连接两个控制器节点，卷映射给主机后由多路径合并，卷的 extent 从 storage pool 分配，底层再落到 MDisk、array 和闪存介质。高可用要同时看双控、quorum、SAN、多路径和后端冗余；RAID、FlashCopy、远程复制、Safeguarded Copy、Storage Protect 和 Tape 解决的是不同故障层，不能互相替代。在 AIOps 中，我会把 volume、host、port、pool、copy relationship 和业务拓扑关联起来，用 IOPS、吞吐、延迟、容量趋势、路径冗余、未修复事件、复制 lag 和恢复演练做告警与 RCA。

## 学习检查清单

- [ ] 我能区分块、文件、对象和磁带存储。
- [ ] 我能说出 IBM 主要存储产品的定位和边界。
- [ ] 我能解释 volume、LUN、host mapping、pool、MDisk 和 extent。
- [ ] 我能画出应用到后端介质的完整 I/O 路径。
- [ ] 我能解释双控、双 Fabric 和 multipath 为什么缺一不可。
- [ ] 我能区分 raw、usable、provisioned、used、physical 和 effective capacity。
- [ ] 我能解释 RAID、快照、复制、Safeguarded Copy、备份和 Tape 的差别。
- [ ] 我能使用只读 CLI 检查系统、节点、池、卷、映射、端口、复制和事件。
- [ ] 我能按端到端链路排查主机看不到 LUN 和高延迟。
- [ ] 我能完成离线健康分析实验并解释每条告警。
- [ ] 我知道升级前必须检查兼容矩阵、路径和版本支持状态。
- [ ] 我能设计存储 AIOps 指标、告警和恢复验证闭环。

## 面试题

1. IBM FlashSystem 与 IBM Storage Virtualize 是什么关系？
2. volume、LUN、vdisk、MDisk 和 storage pool 分别是什么？
3. 主机通过 FC 访问 FlashSystem 时，完整数据路径是什么？
4. 为什么阵列双控后仍然必须配置主机多路径和双 Fabric？
5. thick 和 thin provisioning 有什么区别，thin 最大的运维风险是什么？
6. IOPS、吞吐量和 latency 应该怎样一起分析？
7. raw、usable、provisioned 和 effective capacity 有什么区别？
8. RAID、FlashCopy、Metro Mirror、Global Mirror 和备份分别解决什么问题？
9. Safeguarded Copy 为什么仍然需要恢复演练？
10. 主机看不到新 LUN 时，你会按什么顺序检查？
11. 多路径降为单路径时，为什么不应该先重启主机？
12. 同一 storage pool 中所有卷同时变慢，说明排障重点在哪里？
13. Storage Scale 与 Storage Ceph 的核心架构有什么不同？
14. DS8000 主要服务什么场景，为什么不能直接套用 FlashSystem 命令？
15. Storage Insights 采集断流时，为什么“没有告警”不能代表健康？
16. 如何用 AIOps 做存储容量预测和异常检测？
17. 如何证明复制或备份满足业务 RPO 和 RTO？
18. Storage Virtualize 升级前必须验证哪些依赖？

## 学习证据

学习完成后，建议提交脱敏内容：

- `labs/ibm-storage-health/metrics.csv`：离线指标样本。
- `labs/ibm-storage-health/health-report.csv`：自动分级结果。
- `docs/ibm-storage/architecture.md`：应用到存储介质的数据路径图。
- `docs/ibm-storage/object-dictionary.md`：volume、pool、MDisk、host 和 copy relationship 对照表。
- `docs/ibm-storage/lun-troubleshooting.md`：主机看不到 LUN 的排障记录。
- `docs/ibm-storage/capacity-plan.md`：容量口径、增长速度和预计耗尽时间。
- `docs/ibm-storage/recovery-test.md`：一次脱敏恢复演练记录。
- 一篇“为什么 RAID、快照和复制都不是备份”的学习笔记。

不要公开真实管理 IP、WWPN、IQN、NQN、序列号、系统名、客户名、卷名、拓扑、账号、配置备份、事件包、支持日志、许可证、漏洞、密钥或生产性能数据。

## 本文边界与下一步

IBM Storage 产品线很大，本文覆盖零基础到 AIOps 运维所需的共同主线，不假装一篇文章可以替代每个产品的安装、命令和性能指南。

下一步建议：

1. 有 FlashSystem 环境时，按当前版本文档逐项验证本文只读命令和输出字段。
2. 学习 FC SAN、Brocade 或 Cisco 交换机、Linux DM Multipath、AIX MPIO 与 VMware NMP。
3. 分别深入 Storage Scale、Storage Ceph、DS8000 和 Storage Protect，不混用命令体系。
4. 把 Storage Insights、主机指标、SAN 端口、CMDB、变更和业务 SLO 接入一张依赖图。
5. 建立容量预测、单路径、复制超 RPO、未修复事件和恢复演练过期的持续告警。
