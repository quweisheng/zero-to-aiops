# 爱数 AnyStorage 深讲

> 学习目标：从零理解 AnyStorage 7 统一存储与 AnyStorage GX 存储虚拟化网关的区别，掌握 SAN/NAS 数据路径、控制器、缓存、RAID 2.0、卷、主机映射、多路径、快照、复制、双活和 CDP；能完成一次脱敏健康巡检实验，并按业务到介质的链路定位常见故障。

## 官方资料

- [AnyStorage 7 智能数据存储](https://www.aishu.cn/cn/anystorage)
- [AnyStorage 7 GX 存储虚拟化网关](https://www.aishu.cn/cn/anystorage-gx)
- [爱数帮助文档中心](https://docs.aishu.cn/help)
- [爱数产品下线公告](https://www.aishu.cn/cn/offline)
- [AnyBackup Enterprise 8 备份与恢复系统](https://www.aishu.cn/cn/anybackup-family-8)
- [AnyStorage 双活存储客户案例](https://www.aishu.cn/cn/case/457)
- [AnyStorage GX 高可用镜像说明](https://www.aishu.cn/cn/blog/41)

说明：本文以爱数官网当前公开的 AnyStorage 7、AS5210、AS5310 和 AnyStorage 7 GX 信息为基础。完整安装、命令、兼容矩阵、许可和部件操作文档可能需要支持账号或随项目交付。生产操作必须以设备准确型号、软件版本、合同许可和爱数技术支持文档为准。

## 官方知识地图

爱数公开资料把内容分散在产品页、帮助中心、生命周期公告、客户案例和支持服务中。学习时可以整理成下面这张图：

```text
产品定位
  -> AnyStorage 7 统一存储
  -> AnyStorage 7 GX 存储虚拟化网关
  -> AnyBackup 独立备份与恢复

统一存储主线
  -> SAN / NAS 接入
  -> 控制器、缓存、介质和 RAID 2.0
  -> 卷、共享、主机映射和多路径
  -> 快照、克隆、远程复制、双活和 WORM
  -> 性能、容量、告警、变更和生命周期
```

本文按下面的顺序学习：

```text
先分清产品边界
  -> 再画 SAN / NAS 数据路径
  -> 再理解卷、池、RAID、多路径和共享
  -> 再学习快照、复制、双活、CDP 与备份
  -> 再做离线巡检实验
  -> 最后建立 AIOps 拓扑、告警和 Runbook
```

## 场景开场

数据库突然出现 I/O 超时。业务主机还能访问磁盘，AnyStorage 总体状态也没有显示完全离线，但值班人员发现：

```text
数据库卷：8 条 SAN 路径只剩 4 条在线
存储池：已用容量从 72% 增长到 84%
远程复制：最近一次同步延迟超过业务 RPO
后台：一块成员盘正在重构
```

这四条信息可能相互关联，也可能只是同时发生。路径减少会让剩余端口负载升高；重构会争用后端资源；容量不足可能让快照、复制或重构继续恶化。

真正的排障不是看到哪个告警就重启哪个部件，而是沿应用、主机、网络、控制器、卷、存储资源和保护关系逐层验证。

## 一句话人话版

AnyStorage 7 是爱数的企业统一存储：它把 SSD、SAS 或 NL-SAS 介质组织成可靠容量，通过 SAN 和 NAS 提供给业务，并用快照、复制、双活、分层和流控保护数据服务。

## 小白可能会问

- AnyStorage 7 和 AnyStorage GX 是不是同一台存储？
- 官网写了 HTTP、FTP，是否说明它是 S3 对象存储？
- RAID 2.0 和计算机教材里的 RAID 2 是一回事吗？
- 双控制器、快照和双活都有了，为什么还需要 AnyBackup？
- 存储状态正常，为什么主机仍然只剩一条路径？

## 为什么 AIOps 工程师要学 AnyStorage

数据库、虚拟化、文件共享和行业应用的故障，最终经常落到存储路径、容量、延迟和数据保护上。AIOps 不能只接收一条“硬盘故障”告警，还要回答：

- 哪个应用使用了受影响卷或共享？
- 故障路径属于哪块 HBA、哪个交换机、哪个控制器端口？
- 存储池还能否承受重构和业务增长？
- 快照、复制、双活和备份分别是否可用？
- 告警发生前是否有扩容、迁移、升级或策略变更？
- 自动化可以安全收集什么，哪些操作必须审批？

AnyStorage 提供存储侧证据；AIOps 把这些证据与主机、网络、应用、CMDB、告警和变更关联起来。

## AnyStorage 是什么

官网当前把 AnyStorage 7 定位为智能数据存储，列出的 AS5210 和 AS5310 支持多控制器、SSD/SAS/NL-SAS 介质，以及 FC、iSCSI、NFS、CIFS、HTTP、FTP 等协议。

它的主线是集中式统一存储，而不是 Ceph 那种由通用节点组成的开源分布式对象存储。官网所列 HTTP、FTP 访问能力也不能直接推导为兼容 S3 的对象存储；协议语义必须按准确版本文档确认。

### 产品边界

| 产品 | 主要职责 | 新手要注意 |
|---|---|---|
| AnyStorage 7 | 自带控制器、缓存、硬盘和统一 SAN/NAS 服务的存储系统 | 本文主要讲解对象 |
| AnyStorage 7 GX | 位于主机和异构后端阵列之间的存储虚拟化网关 | 重点是资源整合、双活、CDP、在线迁移和统一容灾管理 |
| AnyBackup | 独立的备份、恢复、副本数据管理、归档和容灾平台 | 用于建立独立副本和恢复体系，不能被本地快照替代 |
| AnyShare | 企业内容管理和文档协作产品 | 面向文档业务，不等同于底层 AnyStorage 卷或 NAS 共享 |
| AnyRobot | 可观测性与数据分析产品族 | 可以参与运维分析，但不是 AnyStorage 的存储数据面 |

产品名称相似不代表组件可以互换。设计、告警和资产台账必须记录完整产品、型号、版本、许可与角色。

## 它解决什么问题

- 统一提供 FC/iSCSI 块服务和 NFS/CIFS 等文件服务。
- 通过多控制器、冗余部件、RAID、快速重构和多路径降低单点风险。
- 通过 SSD 加速、Flash Cache、数据分层、缓存分区和服务质量控制管理性能。
- 通过快照、卷镜像、卷拷贝、克隆和 WORM 提供本地数据服务与保护能力。
- 通过同步/异步复制、SAN/NAS 双活和两地三中心增强业务连续性。
- 通过 GX 整合不同品牌的后端阵列并支持在线迁移、CDP 和异构双活。
- 与 AnyBackup 组合建立独立备份、恢复和长期保留能力。

## 先分清 SAN 与 NAS

| 类型 | 主机看到什么 | AnyStorage 公开协议 | 典型场景 |
|---|---|---|---|
| SAN 块存储 | 一块逻辑磁盘或 LUN | FC、iSCSI | 数据库、虚拟化、集群文件系统 |
| NAS 文件存储 | 一个共享目录 | NFS、CIFS，以及版本支持的 HTTP/FTP 文件访问 | 文件共享、影像、归档目录、应用文件 |

SAN 中的文件系统通常由业务主机创建和管理；NAS 的文件系统和共享由存储系统管理。主机看到一个卷，不代表它可以安全地被多台服务器同时写入；是否允许共享写入取决于集群文件系统和应用协调机制。

## 核心原理

AnyStorage 7 的 SAN 数据路径可以先这样理解：

```text
应用读写
  -> 操作系统文件系统 / 数据库
  -> 主机多路径软件
  -> FC HBA 或 iSCSI NIC
  -> 双 SAN fabric 或双 IP 网络
  -> AnyStorage 前端端口
  -> 控制器、缓存和 SAN 服务
  -> 卷 / LUN
  -> 存储池、RAID 2.0 或 RAID 资源
  -> SSD / SAS / NL-SAS
```

NAS 数据路径是：

```text
客户端
  -> NFS / CIFS / 版本支持的文件协议
  -> NAS 业务地址和前端端口
  -> 控制器与文件服务
  -> 文件系统 / 共享
  -> 存储资源
  -> 物理介质
```

管理登录、告警、审计和性能采集属于管理面。SAN/NAS 业务 I/O 属于数据面。复制、双活和仲裁还会使用独立的保护与仲裁链路。生产设计不能把这些网络只按 IP 地址区分而共用同一故障域。

## 关键术语

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| controller | 处理前端 I/O、缓存、存储服务和后端介质访问的控制器 | 控制器健康和负载影响大量业务对象 |
| cache | 控制器中的高速内存缓存 | 写保护、命中率和缓存镜像会影响性能与安全 |
| pool | 从介质组织出的逻辑容量资源 | 卷、文件系统、容量和性能争用都与池有关 |
| volume / LUN | 映射给 SAN 主机的逻辑块设备 | 数据库和虚拟化最常使用的对象 |
| initiator | 主机发起 FC 或 iSCSI 访问的身份 | FC 常用 WWPN，iSCSI 常用 IQN |
| target | 存储接收 SAN 请求的端点 | 主机通过 target 访问卷 |
| mapping | 把卷授权给指定主机的关系 | 配错会导致看不到卷或数据越权 |
| multipath | 把同一卷的多条物理路径合并成一个设备 | 提供链路冗余和负载分担 |
| RAID 2.0 | AnyStorage 用于介质虚拟化、数据均衡和快速重构的技术名称 | 影响容量、性能、故障恢复和热点分布 |
| Flash Cache | 使用 SSD 缓存热点数据 | 加速依赖工作集和命中率，不是无限性能 |
| WORM | Write Once Read Many，写入后按策略不可修改 | 用于防篡改和合规保留 |
| CDP | Continuous Data Protection，持续数据保护 | 保留更细的时间点，缩短逻辑故障恢复点 |
| RPO | Recovery Point Objective，最多允许丢多少时间的数据 | 决定复制、CDP 和备份频率 |
| RTO | Recovery Time Objective，业务允许恢复多久 | 决定切换、恢复和演练方案 |
| quorum | 双活故障时决定哪一侧继续服务的仲裁 | 防止两端同时写入形成脑裂 |

## 核心知识树

### 1. 控制器、缓存与冗余部件

**是什么**：控制器运行存储 I/O 和管理逻辑；缓存暂存读写数据。官网当前列出的 AS5210/AS5310 支持多控制器扩展，具体数量取决于型号和配置。

**为什么需要**：单个 CPU、控制器、电源、风扇、端口或链路不能成为整个存储系统的单点故障。

**怎么工作**：I/O 从前端端口进入控制器，经缓存和数据服务处理后写入后端介质。写缓存必须有冗余、掉电保护和安全落盘机制，具体实现以版本文档为准。

**怎么看 / 怎么用**：在管理控制台查看系统、控制器、缓存、电源、风扇、接口模块、盘框和链路的健康、运行、冗余和固件状态。

**坏了怎么查**：先确认故障部件及其冗余是否健康，再看主机路径、业务延迟、缓存保护和卷状态。不能把“还有一个控制器在线”当成可以无限期降级运行。

### 2. RAID 2.0、经典 RAID 与重构

**是什么**：爱数官网把 RAID 2.0 描述为底层介质虚拟化技术，将数据块均衡分布到成员盘中，以实现负载均衡和快速重构。

**为什么需要**：传统固定盘组容易出现容量、性能和重构热点，介质虚拟化可以把数据和恢复工作更均匀地分散。

**怎么工作**：数据块分布在成员盘上，介质故障后由其余冗余数据并行恢复。具体条带、校验、热备和故障容忍规则必须查对应版本的技术文档。

**怎么看 / 怎么用**：查看存储资源的 RAID/保护策略、成员盘、可用容量、降级状态、故障盘、重构进度和预计剩余时间。

**坏了怎么查**：重构慢时同时检查其他盘错误、后端负载、业务 I/O、剩余容量和重构优先级。不要在未确认冗余状态时继续拔盘或并行维护同一故障域。

这里的 `RAID 2.0` 是 AnyStorage 的产品技术名称，不等同于教材里使用位级条带和海明码的经典 RAID 2 级别。

### 3. 存储池、介质层与数据分层

**是什么**：存储池把 SSD、SAS 或 NL-SAS 等介质组织成可分配资源；数据分层根据冷热特征把数据迁移到不同性能层。

**为什么需要**：关键热数据需要低时延，冷数据更看重容量成本，所有数据都放在最高性能介质上并不经济。

**怎么工作**：系统分析数据访问热度并按策略迁移；SSD 加速和 Flash Cache 可缩短热点读取路径。迁移本身也会消耗后端资源。

**怎么看 / 怎么用**：检查池的介质组成、总量、已用量、已分配量、增长率、分层策略、迁移状态、热点和数据倾斜。

**坏了怎么查**：性能下降时确认热数据是否命中正确层、SSD/Flash Cache 是否健康、迁移是否积压；容量不足时区分逻辑分配、真实使用、快照和保护副本。

### 4. 卷、LUN、主机和映射

**是什么**：卷/LUN 是 SAN 主机看到的逻辑块设备；主机对象记录 initiator；映射决定哪台主机能看到哪个卷。

**为什么需要**：一套存储服务多台服务器，必须控制访问边界并独立管理容量和性能。

**怎么工作**：阵列识别主机的 WWPN 或 IQN，再根据映射授权卷和主机侧编号。网络层还要允许 initiator 与 target 连通。

**怎么看 / 怎么用**：建立业务、owner、主机、initiator、卷、WWID、容量、映射、前端端口和多路径的对应表。具体控制台对象名称以版本为准。

**坏了怎么查**：主机看不到卷时沿卷健康、映射、initiator、FC zoning 或 iSCSI 网络、前端端口、主机 rescan 和 multipath 检查。不要先格式化无法确认来源的磁盘。

### 5. FC、iSCSI 与多路径

**是什么**：FC 使用专用存储网络，iSCSI 在 IP 网络上传输 SCSI 命令；多路径软件把同一卷的多条链路合并为一个设备。

**为什么需要**：HBA/NIC、光模块、线缆、交换机、存储端口和控制器都可能故障，单路径无法提供端到端高可用。

**怎么工作**：主机通过两套独立 fabric 或 IP 网络连接多个 target；多路径根据 WWID 识别同一卷，执行负载分担和故障切换。

**怎么看 / 怎么用**：Linux 用 `multipath -ll` 查看 WWID、path group 和路径状态；FC 用 `systool -c fc_host -v` 查看 HBA；iSCSI 用 `iscsiadm -m session` 查看会话。

**坏了怎么查**：先定位丢失路径属于哪块 HBA/NIC、交换机和控制器端口，再检查链路、zoning、VLAN、MTU、路由和登录。路径恢复前不要把剩余路径安排进同一维护窗口。

### 6. NAS 文件系统、共享和权限

**是什么**：NAS 服务通过 NFS、CIFS 以及版本支持的 HTTP/FTP 等方式提供文件访问。文件系统、共享、业务地址、客户端权限和认证共同组成访问链。

**为什么需要**：用户和应用需要按目录共享数据，而不是管理裸块设备。

**怎么工作**：客户端连接 NAS 业务地址，通过协议认证与共享规则访问文件，数据最终写入存储池和介质。

**怎么看 / 怎么用**：检查业务地址、端口、文件系统、共享路径、NFS 客户端规则、CIFS 身份、配额、容量和 owner。

**坏了怎么查**：先分清 DNS/网络不通、协议服务异常、权限错误、认证失败、配额满、文件系统满和底层池异常。管理地址可访问不能证明 NAS 业务地址正常。

### 7. 服务质量控制、缓存分区和性能隔离

**是什么**：服务质量控制按业务优先级或流控规则分配性能资源；缓存分区把缓存资源分配给不同业务。

**为什么需要**：共享存储中的一个批处理、备份或扫描任务可能挤占关键数据库资源。

**怎么工作**：系统按策略限制、保障或优先处理不同对象的 I/O。策略效果取决于实际 IOPS、带宽、I/O 大小、读写比和缓存命中。

**怎么看 / 怎么用**：记录策略目标对象、优先级、阈值、生效时间和业务 SLO，同时观察卷、主机、端口、控制器和池性能。

**坏了怎么查**：业务慢时检查是否命中错误策略、阈值是否低于基线、缓存分区是否失衡。QoS 不能修复故障硬盘、单路径或容量不足。

### 8. 快照、卷镜像、卷拷贝、克隆与 WORM

**是什么**：快照保存时间点视图；卷镜像维护冗余数据；卷拷贝和克隆生成副本；WORM 按策略限制修改。

**为什么需要**：误删除、升级失败、测试数据、合规保留和逻辑故障需要不同类型的数据副本。

**怎么工作**：快照通常依赖源存储和变化数据；克隆可形成独立可用副本；WORM 通过保留策略防止修改。具体写时复制或重定向写机制需以版本文档为准。

**怎么看 / 怎么用**：检查源对象、状态、创建时间、保留期、占用空间、依赖关系、恢复步骤和最近恢复验证。

**坏了怎么查**：快照或克隆失败时先查池容量、源卷状态、数量限制、许可和后台任务；WORM 策略错误可能导致数据在保留期内无法修改，必须在启用前测试。

### 9. 同步/异步复制与两地三中心

**是什么**：远程复制把数据同步到另一套存储；同步复制等待远端确认，异步复制按时间或批次传输差异。

**为什么需要**：单阵列内部冗余无法防住整机房或整套存储故障。

**怎么工作**：同步复制可以把 RPO 降到接近或达到 0，但对链路时延、带宽和稳定性要求高；异步复制对前台影响较小，但存在非零 RPO。两地三中心组合本地高可用和异地灾备。

**怎么看 / 怎么用**：检查复制关系、角色、链路、同步状态、最近成功时间、待同步量、实际 RPO、远端容量和一致性组。

**坏了怎么查**：先区分源端、目标端、复制链路、容量、许可和关系状态。恢复前确认哪端数据最新、业务当前写哪端，避免反向同步覆盖正确数据。

### 10. SAN/NAS 双活、双仲裁与脑裂

**是什么**：AnyStorage 官网说明其方案支持 SAN/NAS 一体化双活与双仲裁，让两套存储共同提供服务并在故障时仲裁。

**为什么需要**：单套阵列或单站点故障时，关键业务仍需要继续访问数据。

**怎么工作**：主机连接双活两端，数据在两端保持一致；站点间通信异常时，仲裁决定允许哪端继续服务，防止两端分别接受写入形成脑裂。

**怎么看 / 怎么用**：检查双活关系、两端角色、同步状态、业务网络、镜像网络、仲裁连接、preferred site、实际路径和应用状态。

**坏了怎么查**：先保护当前服务端并收集两端证据。不要在没有确认数据权威端时执行强制启动、切换、回切、拆分或重建关系。

官网场景中的 `RPO=0`、`RTO≈0` 是完整方案目标，不是只购买两台设备就自动获得的结果。网络、仲裁、主机多路径、应用支持、演练和运维流程都必须满足设计条件。

### 11. AnyStorage GX、异构虚拟化与 CDP

**是什么**：AnyStorage GX 是位于主机和异构后端阵列之间的存储虚拟化网关。CDP 是持续数据保护，用更细时间点支持回滚。

**为什么需要**：企业可能已有多个品牌和代际的阵列，需要统一资源、在线迁移、双活和容灾管理。

**怎么工作**：主机 I/O 先经过 GX 虚拟化层，再访问后端阵列；GX 抽象后端差异并提供镜像、缓存、迁移、双活和 CDP 能力。网关自身、后端路径和元数据都必须高可用。

**怎么看 / 怎么用**：建立 `主机 -> GX 虚拟卷 -> GX 节点/端口 -> 后端阵列卷 -> 物理存储` 映射，检查前端路径、后端路径、镜像、迁移和 CDP 状态。

**坏了怎么查**：应用慢时同时看前端主机到 GX 和 GX 到后端阵列两段链路。后端卷正常不代表 GX 虚拟卷正常，GX 正常也不代表后端阵列没有重构或容量问题。

### 12. AnyBackup 与独立备份

**是什么**：AnyBackup 是独立的备份与恢复产品，官网当前主线为 AnyBackup Enterprise 8，覆盖备份恢复、副本数据管理、归档、容灾与迁移。

**为什么需要**：快照、镜像和双活可能把误删除、逻辑损坏或勒索写入快速同步到所有在线副本。

**怎么工作**：备份按策略生成独立副本，并通过保留、不可变、隔离、校验和恢复编排建立更强故障域。

**怎么看 / 怎么用**：检查保护范围、最近成功备份、恢复点、保留期、不可变或 Air-Gap、异地副本和恢复演练。

**坏了怎么查**：备份成功不等于能恢复。定期执行文件、卷、数据库和整机不同粒度的恢复验证，并记录 RPO/RTO 实测结果。

## 架构和数据流

### AnyStorage 7 SAN 写入

```text
数据库 / 虚拟化
  -> 主机块设备
  -> 多路径
  -> FC / iSCSI 双网络
  -> AnyStorage 前端端口
  -> 多控制器与缓存
  -> SAN 卷 / LUN
  -> 存储池和 RAID 2.0
  -> SSD / SAS / NL-SAS
```

### AnyStorage 7 NAS 访问

```text
客户端
  -> DNS 与 NAS 业务地址
  -> NFS / CIFS / 支持的文件协议
  -> 控制器与 NAS 服务
  -> 文件系统、共享、权限和配额
  -> 存储池
  -> 物理介质
```

### AnyStorage GX 虚拟化

```text
应用主机
  -> 前端多路径
  -> AnyStorage GX 高可用网关
  -> 虚拟卷、镜像、缓存、CDP 或迁移
  -> 后端多路径
  -> 不同品牌存储阵列
  -> 后端卷和介质
```

GX 让路径多了一层。拓扑、性能和告警模型也必须多一层，不能把后端阵列卷与主机可见卷按名称直接等同。

## 高可用、容灾和备份的边界

| 层级 | AnyStorage 相关能力 | 主要解决 | 不能替代 |
|---|---|---|---|
| 部件冗余 | 多控制器、冗余部件、RAID、快速重构 | 单部件故障 | 主机路径、站点灾难、误删除 |
| 主机路径 | 双 HBA/NIC、双交换网络、多路径 | 链路或端口故障 | 数据损坏和阵列级故障 |
| 本地副本 | 快照、卷镜像、卷拷贝、克隆 | 快速回滚、测试和局部保护 | 独立备份与异地灾难 |
| 远程容灾 | 同步/异步复制 | 阵列或站点故障 | 被同步扩散的逻辑错误 |
| 双活 | SAN/NAS 双活、仲裁 | 业务连续性 | 历史版本和长期留存 |
| 连续保护 | GX CDP | 更细恢复时间点 | 离线、不可变、长期备份 |
| 独立备份 | AnyBackup | 恢复、归档、隔离和合规 | 实时业务双活 |

## 安装、初始化与交付

AnyStorage 是商业企业存储，不能像开源软件一样在个人电脑中直接安装。小白要掌握的是交付顺序、风险边界和验收方法；硬件上架、布线、初始化、部件更换和升级必须由授权人员按项目文档实施。

### 交付前准备

- 设备完整型号、序列号、软件版本、许可和生命周期状态。
- 机柜 U 位、承重、供电、接地、制冷和盘框布线。
- 管理、SAN、NAS、复制、双活和仲裁网络设计。
- FC WWPN 与 zoning，或 iSCSI/NAS 的 VLAN、MTU、路由和网关。
- 服务器、操作系统、HBA/NIC、驱动、固件和多路径兼容性。
- 存储池、介质层、保护策略、卷、共享、owner 和容量设计。
- 快照、复制、双活、CDP、备份的 RPO/RTO 和恢复流程。
- 变更审批、停止条件、回退路径和爱数支持联系人。

### 初始化主线

```text
硬件与线缆检查
  -> 冗余上电和部件健康检查
  -> 管理地址、时间、DNS、证书和账号
  -> 许可与版本核对
  -> 介质、RAID 和存储池配置
  -> SAN 卷 / NAS 文件系统与共享
  -> 主机、initiator、映射和网络
  -> 多路径与业务访问验证
  -> 快照、复制、双活或备份策略
  -> 告警通知、性能基线和恢复演练
  -> 脱敏验收证据归档
```

正式上线前要模拟单路径故障、控制器或端口维护、告警通知、快照恢复和备份恢复。只有“能创建卷”不算交付完成。

## 配置详解：先写设计单

下面是学习用设计单，不是 AnyStorage 可直接导入的配置：

```yaml
product: AnyStorage-7             # 产品主线；GX 项目必须明确写 AnyStorage-7-GX
model: AS5210                     # 示例型号，真实项目以设备铭牌和支持合同为准
application: order-db             # 使用存储的业务名称
owner: dba-team                   # 容量、性能和保护告警责任团队
service: SAN                      # SAN 块服务；NAS 项目需要记录共享和权限
protocol: FC                      # FC 或 iSCSI，决定网络和 initiator 类型
volume_name: vol_order_db_01      # 卷名称包含业务、用途和序号
logical_capacity_gib: 2048        # 主机可见逻辑容量，不等于立即消耗全部物理空间
pool: pool_prod                   # 卷所在存储池
initiators:                       # FC HBA 的 WWPN，必须从主机和交换机双向核对
  - "21000024ff223401"
  - "21000024ff223402"
expected_paths: 8                 # 验收时预期的主机路径数量
snapshot_policy: hourly-24        # 快照意图，正式策略名按现场规范填写
replication_mode: none            # 未启用复制，不能误报为已有异地容灾
backup_policy: daily-30           # 独立备份频率和保留意图
```

| 字段 | 要回答的问题 | 常见错误 |
|---|---|---|
| `product` / `model` | 是统一存储还是 GX，具体型号是什么 | 把 GX 网关和 AS5210 阵列写成同一设备 |
| `application` / `owner` | 谁使用、谁响应告警 | 对象名没有业务负责人 |
| `service` / `protocol` | 是 SAN 还是 NAS，使用什么协议 | 用 NAS 排障步骤处理 FC LUN |
| `volume_name` / `pool` | 逻辑卷来自哪个资源池 | 只看卷，不看池和介质层 |
| `initiators` | 哪些主机身份有权访问 | WWPN/IQN 抄错或绑定错误主机 |
| `expected_paths` | 正常应有多少条端到端路径 | 只要磁盘可读就忽略路径降级 |
| `snapshot_policy` | 本地恢复点如何保留 | 有快照但没有恢复验证 |
| `replication_mode` | 是否有远端副本和实际 RPO | 把本地镜像当成异地复制 |
| `backup_policy` | 是否有独立、可恢复副本 | 认为双活等于备份 |

## 管理操作字典

公开官网没有提供完整、版本化的 AnyStorage CLI 命令参考，因此这里不编造命令。登录对应版本管理控制台后，先掌握这些只读对象；菜单名称以项目文档为准。

| 管理对象 | 要看什么 | 正常结果 | AIOps 用途 | 常见坑 |
|---|---|---|---|---|
| 系统总览 | 型号、版本、健康、运行、时间 | 与资产台账一致且无未解释异常 | 巡检入口、版本关联 | 总体正常不代表路径和业务正常 |
| 控制器与缓存 | 控制器、缓存保护、负载、接管 | 冗余在线、无保护降级 | 故障影响和性能分析 | 单控在线仍被当成健康稳态 |
| 硬盘与盘框 | 健康、介质错误、温度、重构 | 无故障盘，重构可解释 | 预测故障和根因分析 | 只换告警盘，不看同组其他错误 |
| 存储池 | 总量、已用、已分配、增长、保护 | 有重构与增长余量 | 容量预测、资源治理 | 混淆逻辑分配与物理使用 |
| 卷与映射 | 卷状态、WWID、主机、initiator、路径 | 映射正确且卷在线 | 业务拓扑和访问审计 | 仅按卷名关联，忽略唯一标识 |
| NAS 文件系统 | 容量、共享、业务 IP、权限、配额 | 共享可访问且权限正确 | 文件服务 SLO | 管理 IP 可达就判定 NAS 正常 |
| 前端端口 | link、speed、error、IOPS、带宽 | 双网络符合设计 | 路径和端口瓶颈 | 端口 up 不代表 zoning/VLAN 正确 |
| QoS 与缓存分区 | 策略、目标对象、阈值、命中 | 与业务 SLO 一致 | noisy neighbor 分析 | 错误策略被误判成硬件故障 |
| 快照/克隆/WORM | 状态、保留、空间、依赖、恢复 | 策略执行且恢复已验证 | 数据保护就绪度 | 快照存在就等于可恢复 |
| 复制关系 | 模式、角色、链路、延迟、RPO | 满足业务 RPO | 容灾告警 | 没核对权威端就反向同步 |
| 双活与仲裁 | 两端、同步、路径、仲裁、角色 | 关系正常且仲裁冗余 | 业务连续性 | 未演练就相信 RTO≈0 |
| 许可与生命周期 | feature、到期、扩容和支持状态 | 变更所需能力有效 | 变更门禁 | 菜单可见不等于已许可 |

## 主机侧命令字典

这些是 Linux 标准检查命令，不是 AnyStorage 厂商 CLI。

| 命令 | 作用 | 关键字段 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS` | 查看块设备和挂载 | NAME、SIZE、FSTYPE、MOUNTPOINTS | 目标卷容量和用途匹配 | 把新出现设备直接格式化 |
| `multipath -ll` | 查看多路径 | WWID、path group、active/ready/running | 路径数和状态符合设计 | 只看 map 存在，不看路径减少 |
| `lsscsi -t` | 查看 SCSI 与传输路径 | host、channel、target、lun | 设备经预期协议发现 | 设备号会变化，不能替代 WWID |
| `systool -c fc_host -v` | 查看 FC HBA | port_name、port_state、speed | HBA online 且 WWPN 正确 | 命令来自 sysfsutils，系统可能未安装 |
| `iscsiadm -m session` | 查看 iSCSI 会话 | target、portal、session | 所有预期 target 已登录 | 会话在线不代表 multipath 完整 |
| `findmnt` | 查看文件系统挂载 | SOURCE、TARGET、FSTYPE、OPTIONS | 源和挂载参数符合设计 | NFS 卡顿时命令也可能等待 |
| `nfsstat -m` | 查看 NFS 挂载参数 | server、mount options | 版本和超时参数符合方案 | 客户端参数与服务端能力不匹配 |
| `smbclient -L //server -U user` | 枚举 CIFS/SMB 共享 | server、share、auth | 能看到获授权共享 | 认证失败和网络失败混为一谈 |

## 性能与容量怎么读

### 性能四要素

- IOPS：每秒 I/O 次数，小块随机负载常重点关注。
- 带宽：每秒传输数据量，大块顺序负载常重点关注。
- 响应时间：一次 I/O 完成耗时，必须与业务 SLO 和历史基线比较。
- I/O 大小：大致可由 `带宽 / IOPS` 估算，帮助区分小 I/O 和大 I/O。

还要同时看读写比、随机度、队列深度、缓存命中、路径数量、端口负载、重构、分层迁移、复制、快照后台任务和 QoS。

### 容量至少分六层

- 原始物理容量：所有介质标称容量。
- 冗余后可用容量：扣除 RAID、系统和保护开销。
- 已分配逻辑容量：承诺给卷和文件系统的容量。
- 真实已用容量：业务实际写入占用。
- 快照、克隆、镜像和复制占用：保护副本消耗。
- 可支撑增长余量：还要为重构、迁移和突发写入留空间。

容量告警不能只看一个百分比。AIOps 要计算增长率、预计耗尽时间、最满池、保护关系和扩容交付周期。

## AnyStorage 在 AIOps 中的位置

### 建议拓扑

```text
service
  -> application / database / VM
  -> host
  -> initiator and multipath
  -> FC fabric / iSCSI network / NAS network
  -> AnyStorage front-end port
  -> volume / file system / share
  -> controller and cache
  -> storage pool and media tier
  -> drive / enclosure
  -> snapshot / replication / active-active / backup
```

GX 场景还要插入：

```text
host
  -> GX virtual volume
  -> GX node and front-end path
  -> GX back-end path
  -> heterogeneous array volume
  -> back-end pool and drive
```

### 建议采集

| 层级 | 指标或状态 | 用途 |
|---|---|---|
| 系统 | health、running、version、time | 总体健康与版本变更关联 |
| 控制器/缓存 | status、load、cache protection、failover | 判断控制器压力和降级 |
| 端口/路径 | link、speed、error、path count、traffic | 找链路故障和负载偏斜 |
| 卷/文件系统 | health、used、IOPS、bandwidth、latency | 业务级容量和性能 |
| 存储池 | used、allocated、growth、rebuild、tiering | 容量预测与后台任务影响 |
| 介质 | health、media error、temperature、rebuild | 预测故障和重构风险 |
| 复制/双活 | pair status、role、lag、RPO、quorum | 容灾就绪度 |
| GX | front/back path、mirror、migration、CDP | 区分网关与后端故障 |
| 采集链路 | last success、event count、data age | 发现监控盲区 |

### 告警治理

| 告警 | 风险 | 富化字段 | 降噪方法 |
|---|---|---|---|
| 控制器或缓存降级 | 影响多个卷和共享 | 冗余状态、受影响对象、接管事件 | 合并同一根部件派生告警 |
| SAN 路径减少 | 下一故障可能中断业务 | host、WWID、fabric、port、remaining paths | 按剩余故障域和维护窗口升级 |
| NAS 业务地址异常 | 文件业务不可达 | share、client、protocol、network | 与管理地址告警分开 |
| 池容量高 | 写入、快照、重构可能失败 | growth、ETA、owner、protection | 趋势和多阈值告警 |
| 卷延迟高 | 直接影响应用 | IOPS、bandwidth、I/O size、QoS、paths | 使用业务基线和持续时间 |
| 硬盘故障/重构 | 冗余下降且后台压力增加 | pool、enclosure、progress、remaining redundancy | 区分预警、故障和重构停滞 |
| 复制延迟 | 实际 RPO 扩大 | pair、role、last sync、backlog、link | 按业务 RPO 判断严重级别 |
| 双活/仲裁异常 | 业务连续性风险 | sites、role、sync、quorum、network | 关联共同网络和维护事件 |
| GX 后端路径异常 | 虚拟卷可能降级 | GX node、backend array、volume、paths | 前端与后端告警拓扑归并 |
| 监控数据过旧 | 形成观测盲区 | collector、last success、age | 独立的数据新鲜度告警 |

### 自动化边界

适合自动化：

- 收集只读系统、控制器、端口、卷、池和保护关系状态。
- 把业务、owner、WWID、主机路径、后端卷和最近变更补到告警。
- 计算路径在线率、容量增长率、预计耗尽时间和实际 RPO。
- 生成巡检报告、风险清单、工单和审批建议。
- 在变更后验证路径、性能、复制、双活和告警通知。

不适合根据单条告警自动执行：

- 删除卷、文件系统、共享、快照、映射或存储池。
- 初始化、格式化、扩容文件系统或修改主机卷编号。
- 强制双活切换、回切、拆分、重建或改变仲裁。
- 反向复制、提升目标端、清理 CDP 时间点或 WORM 数据。
- 修改 RAID、缓存、QoS、分层、端口、zoning 或后端虚拟化关系。
- 拔插硬盘、控制器、接口模块或执行固件升级。

## 入门实验：生成 AnyStorage 脱敏健康报告

### 实验目标

在没有 AnyStorage 设备的 Windows 电脑上，读取一份脱敏指标样本，正确识别容量告警、路径降级和复制 RPO 超标，并输出可供监控系统使用的退出码。

### 实验步骤

1. 创建实验目录：

```powershell
New-Item -ItemType Directory -Force anystorage-lab | Out-Null # 创建目录，重复执行也不会报错
Set-Location anystorage-lab                                  # 进入实验目录
```

2. 创建指标样本：

```powershell
@'
object,metric,value,warn,critical,direction,unit
pool-prod,pool_used_pct,84,80,90,higher,percent
db-host-01,path_online_pct,75,100,50,lower,percent
replica-prod,replication_lag_s,45,30,300,higher,second
nas-prod,error_rate_pct,0.2,1,5,higher,percent
'@ | Set-Content anystorage-health.csv -Encoding utf8 # 使用虚构名称，不包含真实设备信息
```

`higher` 表示越高越危险；`lower` 表示越低越危险。不同业务的阈值应来自容量计划、链路设计和 RPO/SLO，本文数字仅用于学习规则引擎。

3. 创建 `check-anystorage.ps1`：

```powershell
$rows = Import-Csv .\anystorage-health.csv # 读取 CSV，每一行成为一个指标对象

$results = foreach ($row in $rows) {
    $value = [double]$row.value       # 把文本值转换成数字
    $warn = [double]$row.warn         # warning 阈值
    $critical = [double]$row.critical # critical 阈值

    if ($row.direction -eq 'higher') {
        $status = if ($value -ge $critical) { 'CRITICAL' } elseif ($value -ge $warn) { 'WARN' } else { 'OK' }
    } else {
        $status = if ($value -le $critical) { 'CRITICAL' } elseif ($value -lt $warn) { 'WARN' } else { 'OK' }
    }

    [pscustomobject]@{
        Object = $row.object
        Metric = $row.metric
        Value = $value
        Unit = $row.unit
        Status = $status
    }
}

$results | Format-Table -AutoSize # 输出巡检结果

if ($results.Status -contains 'CRITICAL') { exit 2 } # critical 时返回 2
if ($results.Status -contains 'WARN') { exit 1 }     # 只有 warning 时返回 1
exit 0                                               # 全部正常时返回 0
```

4. 执行并检查退出码：

```powershell
powershell -ExecutionPolicy Bypass -File .\check-anystorage.ps1 # 只对本次进程放宽脚本策略
$LASTEXITCODE                                                   # 立即查看脚本退出码
```

### 预期结果

```text
Object       Metric              Value Unit    Status
------       ------              ----- ----    ------
pool-prod    pool_used_pct        84   percent WARN
db-host-01   path_online_pct      75   percent WARN
replica-prod replication_lag_s    45   second  WARN
nas-prod     error_rate_pct        0.2 percent OK
```

退出码应为 `1`。这表示存在需要处理的风险，但样本中没有达到 critical 的指标。

### 验证结果

把 `pool_used_pct` 改为 `92` 后重跑，池状态应为 `CRITICAL`，退出码应为 `2`。把 `path_online_pct` 改为 `100`，路径状态应恢复为 `OK`。

### 如果没有成功

按顺序检查：

1. 当前目录是否同时有 CSV 和 PowerShell 脚本。
2. CSV 表头是否完整，分隔符是否为英文逗号。
3. 数值列是否只写数字，单位是否单独放在 `unit` 列。
4. `direction` 是否只使用 `higher` 或 `lower`。
5. `$LASTEXITCODE` 是否在脚本执行后立即查看。

有授权设备时，可以从管理控制台导出或抄录脱敏只读数据，再转换成相同结构。公开仓库不能出现真实管理地址、序列号、WWPN/IQN、WWID、卷名、主机名、客户名、许可和支持包。

## 常见故障排查

### 主机看不到 SAN 卷

按顺序检查：

1. 卷是否健康在线并来自正确存储池。
2. 卷是否映射给正确主机或主机组。
3. FC WWPN 或 iSCSI IQN 是否正确、在线并属于该主机。
4. 双 fabric zoning 或 iSCSI VLAN、IP、MTU、路由是否正确。
5. 存储前端端口和主机 HBA/NIC 是否在线。
6. 主机是否完成 SCSI rescan 或 iSCSI 登录。
7. `multipath -ll` 是否识别同一 WWID 的预期路径。
8. 新卷是否被 LVM、文件系统、ASM 或虚拟化平台正确接管。

### 多路径从 8 条降为 4 条

先确认丢失路径是否集中在同一 HBA、交换机、控制器或站点，这能快速确定故障域。再检查光模块、线缆、交换机端口、zoning、目标端口和控制器。路径恢复前评估剩余链路负载，禁止同时维护剩余故障域。

### NFS/CIFS 共享不可访问

依次检查 DNS、客户端到业务地址网络、NAS 端口、协议服务、共享路径、客户端规则、域认证、权限、配额、文件系统容量和底层池。管理控制台能登录与 NAS 业务可用是两件事。

### 业务延迟突然升高

对齐同一时间窗口：

- 应用响应、数据库 wait event 和主机 I/O wait。
- 卷、主机、端口、控制器和池的 IOPS、带宽、延迟。
- I/O 大小、读写比、随机度和并发是否变化。
- 多路径是否减少、负载是否偏斜。
- 是否有重构、数据分层、迁移、快照、复制或备份任务。
- QoS、缓存分区和 Flash Cache 是否符合设计。
- 最近是否发生扩容、升级、映射、zoning 或业务发布。

### 存储池容量快速增长

区分逻辑分配、真实使用、快照/克隆、镜像、复制和数据分层占用。找出增长最快的卷或文件系统，结合业务 owner、保留策略和预计耗尽时间处理。不要只提高告警阈值，也不要在未确认数据归属时删除快照。

### 硬盘故障或重构停滞

检查故障盘、同盘框其他介质错误、存储池冗余、剩余容量、重构进度、后端负载和业务延迟。更换部件前确认备件、槽位、冗余状态、维护步骤和厂商支持意见。

### 远程复制落后于 RPO

检查源端、目标端、复制链路、带宽、时延、丢包、待同步量、目标容量和关系状态。同步复制还要看前台写入延迟；异步复制要把实际延迟与业务 RPO 比较。

### 双活或仲裁异常

分别验证主机业务网络、站点间镜像网络和仲裁网络，确认两端角色、同步状态、当前对外服务端和数据权威端。强制切换或回切属于高风险操作，必须按经过演练的 Runbook 和爱数支持指导执行。

### 快照存在但恢复失败

检查快照依赖、源卷状态、目标容量、映射、应用一致性和恢复步骤。数据库恢复不能只把卷恢复到某个时间点，还要结合数据库日志和一致性要求。

### AnyStorage GX 后端阵列正常但业务仍慢

GX 数据路径分前端和后端两段。检查主机到 GX 的多路径、GX 节点与缓存、虚拟卷镜像/CDP/迁移、GX 到后端阵列的路径，以及后端卷、池和介质。必须用唯一标识关联虚拟卷与后端卷。

### 告警没有进入 AIOps 平台

先确认 AnyStorage 是否真实产生告警，再检查通知规则、级别、目标地址、管理网络、防火墙、时间同步、证书和接收端解析。采集器自身要有最后成功时间和数据新鲜度告警。

## 变更、升级与生命周期

变更前至少完成：

- 按准确型号、版本和许可获取官方变更手册与兼容矩阵。
- 在爱数产品下线公告中核对销售、扩容和支持生命周期；旧 AS5000E/AS5000F 等型号不能按当前 AS5210/AS5310 页面推断能力。
- 确认控制器、缓存、池、卷、共享、所有路径、复制和双活均健康。
- 检查容量和性能有足够的重构、迁移和升级余量。
- 备份并脱敏保存配置、拓扑、告警、基线和变更前证据。
- 验证 AnyBackup 或其他独立备份能够恢复。
- 写清停止条件、回退路径、业务验证和厂商支持联系人。
- 避免同时维护双 fabric、双控制器、双活两端或双仲裁故障域。
- 变更后验证业务 I/O、多路径、NAS、性能、复制、双活、备份和告警通知。

管理账号遵循最小权限，管理网络与业务网络隔离，审计共享账号、默认口令、弱加密和过期证书。技术支持包可能含完整拓扑与敏感数据，不能提交公开 GitHub。

## 面试怎么讲

AnyStorage 7 是爱数的企业统一存储，当前官网主线包括 AS5210 和 AS5310，提供 FC/iSCSI SAN 与 NFS/CIFS 等 NAS 服务。SAN I/O 从主机多路径经过双网络进入前端端口，由多控制器和缓存处理，再落到卷、存储池和 SSD/SAS/NL-SAS 介质。其 RAID 2.0 是爱数的介质虚拟化和数据均衡技术名称，不是经典 RAID 2。AnyStorage 还提供分层、QoS、快照、克隆、复制、WORM 和 SAN/NAS 双活；AnyStorage GX 则在主机与异构阵列之间提供虚拟化、在线迁移、双活和 CDP。快照、双活和 CDP 都不能替代 AnyBackup 等独立备份。排障时我会沿应用、主机、路径、网络、控制器、卷、池、介质和保护关系逐层验证，并把拓扑、性能、告警和最近变更接入 AIOps。

## 学习检查清单

- [ ] 我能分清 AnyStorage 7、AnyStorage GX、AnyBackup 和 AnyShare。
- [ ] 我能解释 SAN 与 NAS 的差异。
- [ ] 我能画出 AnyStorage SAN 和 NAS 数据路径。
- [ ] 我能解释控制器、缓存、存储池、卷、initiator 和 mapping。
- [ ] 我知道 AnyStorage RAID 2.0 不等于经典 RAID 2。
- [ ] 我能解释 FC/iSCSI、多路径和双 fabric 的关系。
- [ ] 我能说明 SSD 加速、Flash Cache、数据分层、QoS 和缓存分区。
- [ ] 我能区分快照、卷镜像、克隆、复制、双活、CDP 和备份。
- [ ] 我能解释仲裁为何用于防止脑裂。
- [ ] 我能画出 GX 前端和后端两段数据路径。
- [ ] 我能完成脱敏健康报告实验。
- [ ] 我能排查卷不可见、路径减少、NAS 不通、容量高和复制延迟。

## 面试题

1. AnyStorage 7 和 AnyStorage GX 的区别是什么？
2. AnyStorage、AnyBackup、AnyShare 分别解决什么问题？
3. AnyStorage 的 SAN 与 NAS 数据路径有什么不同？
4. FC 和 iSCSI 的主机身份分别如何表示？
5. 卷、LUN、存储池、映射和多路径是什么关系？
6. 为什么卷已映射，Linux 仍可能看不到设备？
7. 为什么双控制器不能替代双交换机和主机多路径？
8. AnyStorage RAID 2.0 与经典 RAID 2 有什么区别？
9. 介质虚拟化为什么能缓解热点和加快重构？
10. SSD 加速、Flash Cache 和数据分层如何分工？
11. IOPS、带宽、响应时间与 I/O 大小是什么关系？
12. 如何区分 QoS 限制、路径故障和后端介质瓶颈？
13. 快照、镜像、克隆、复制、双活和备份如何分层？
14. 同步复制与异步复制如何影响 RPO 和性能？
15. 双活为什么需要仲裁？
16. 为什么官网的 RPO=0、RTO≈0 需要完整方案验证？
17. GX 为什么需要同时监控前端和后端路径？
18. CDP 为什么仍不能替代离线或不可变备份？
19. 如何建立 AnyStorage 的 AIOps 拓扑？
20. 哪些 AnyStorage 操作可以自动化，哪些必须人工审批？

## 学习证据

学习完成后，建议提交：

- `labs/aishu-anystorage/product-map.md`：AnyStorage、GX、AnyBackup、AnyShare 边界。
- `labs/aishu-anystorage/san-data-path.md`：主机到卷再到介质的数据路径。
- `labs/aishu-anystorage/gx-data-path.md`：GX 前端虚拟卷到后端阵列卷的映射。
- `labs/aishu-anystorage/design-sanitized.yaml`：脱敏设计单。
- `labs/aishu-anystorage/anystorage-health.csv`：本文健康样本。
- `labs/aishu-anystorage/check-anystorage.ps1`：健康判定脚本。
- `labs/aishu-anystorage/health-report.txt`：脚本输出与退出码。
- `labs/aishu-anystorage/multipath-sanitized.txt`：脱敏多路径样本。
- `labs/aishu-anystorage/runbook-volume-not-visible.md`：卷不可见 Runbook。
- `labs/aishu-anystorage/runbook-active-active.md`：双活只读检查、升级和审批边界。
- `labs/aishu-anystorage/recovery-test.md`：快照和独立备份恢复验证记录。

公开仓库不要提交真实管理地址、序列号、WWPN/IQN、WWID、主机名、卷名、共享名、客户名、license、账号、密码、支持包、日志包或完整灾备拓扑。

## 本文边界与下一步

本文覆盖 AnyStorage 从零理解到 AIOps 运维的主线，但公开资料不足以安全展开所有厂商 CLI、内部对象、安装参数和故障码。遇到具体设备时，必须使用项目随附文档、爱数帮助中心和技术支持给出的准确版本资料。

下一步建议：

1. 在授权实验设备上用只读账号完成系统、控制器、池、卷、共享和保护关系巡检。
2. 用 Linux 实验主机练习 FC/iSCSI 发现、WWID 对齐和 DM-Multipath。
3. 在非生产环境验证 NFS/CIFS 共享、权限和客户端故障排查。
4. 完成快照创建、恢复、清理和容量变化实验。
5. 学习同步/异步复制的一致性、RPO 和反向同步风险。
6. 在隔离环境演练双活业务网、镜像网、仲裁网和主机路径故障。
7. 单独学习 AnyStorage GX 异构虚拟化、CDP 和在线迁移。
8. 用 AnyBackup 或其他独立备份系统完成恢复演练。
9. 把存储指标、主机多路径、SAN/NAS 网络、CMDB、变更和业务 SLO 接入统一 AIOps 看板。
