# VMware vSphere 深讲

> 学习目标：从零理解 vSphere、ESXi（9.x 官方也称 ESX）、vCenter Server、虚拟机和集群的关系，掌握 HA、DRS、vMotion、EVC、虚拟网络、数据存储、资源管理、生命周期、日志与 API；能完成一个不依赖生产环境的健康判定实验，并沿业务、虚拟机、宿主机、网络和存储链路排查常见故障。

## 官方资料

- [VMware vSphere 产品页](https://www.vmware.com/products/cloud-infrastructure/vsphere)
- [vSphere in VMware Cloud Foundation 9.1 官方更新说明](https://blogs.vmware.com/cloud-foundation/2026/05/12/whats-new-with-vsphere-9-1/)
- [VMware vSphere 9.0 TechDocs](https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/vsphere/9-0.html)
- [VMware vSphere 8.0 TechDocs](https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/vsphere/8-0.html)
- [Broadcom Compatibility Guide](https://compatibilityguide.broadcom.com/)
- [Broadcom 产品生命周期与停止支持入口](https://knowledge.broadcom.com/external/article/150550/product-lifecycle-and-end-of-life-inform.html)
- [VMware Security Advisories](https://www.broadcom.com/support/vmware-security-advisories)
- [vSphere Automation API](https://developer.broadcom.com/xapis/vsphere-automation-api/latest/)
- [vSphere Web Services API](https://developer.broadcom.com/xapis/vsphere-web-services-api/latest/)
- [VCF PowerCLI](https://developer.broadcom.com/tools/vmware-powercli/latest)
- [VMware Hands-on Labs](https://www.vmware.com/resources/hands-on-labs)
- [vMotion 原理与故障排查](https://knowledge.broadcom.com/external/article/321009/understanding-and-troubleshooting-vmotio.html)
- [ESXi 日志位置和内容](https://knowledge.broadcom.com/external/article/306962/location-and-contents-of-esxi-log-files.html)
- [ESXi 远程 Syslog 配置](https://knowledge.broadcom.com/external/article/318939/configuring-syslog-on-esxi.html)
- [vSphere Lifecycle Manager 镜像模式](https://knowledge.broadcom.com/external/article/322186/managing-esxi-host-lifecycle-operations.html)

说明：截至本文更新时，Broadcom 官方资料已包含 vSphere 9.1 相关更新，同时大量企业仍运行 vSphere 8.x 或更早版本。本文讲跨版本稳定的入门主线，不能替代某个补丁版本的安装、升级、许可、兼容矩阵或变更手册。操作前必须确认 vCenter、ESXi/ESX、服务器、CPU、网卡、HBA、存储、固件、驱动、备份软件和第三方插件的准确版本组合。

从 9.0 起，Broadcom 把 Hypervisor 名称从 `VMware ESXi` 改为 `VMware ESX`，并说明 9.x 资料中两种写法可能交替出现；这里不是指已经结束的传统 ESX 4.1 架构。为了让运行 8.x 的初学者能对上现网界面，本文后面主要沿用 `ESXi`，涉及 9.x 时应同时理解为当前 `ESX` 主机。

官方页面当前把 PowerCLI 品牌更新为 VCF PowerCLI，但大量环境、模块名、脚本和旧资料仍会出现 VMware PowerCLI。学习时要认得两种叫法，安装模块和执行命令时以当前官方页面为准。

## 官方知识地图

vSphere 官方资料可以整理为六条主线：

```text
产品与架构
  -> ESXi、vCenter Server、vSphere Client
  -> 数据中心、集群、主机、虚拟机等清单对象

计算与可用性
  -> 虚拟 CPU、内存、资源池
  -> HA、DRS、vMotion、EVC、FT

网络与存储
  -> 标准交换机、分布式交换机、端口组、VMkernel
  -> datastore、VMFS、NFS、vSAN、vVols

生命周期与安全
  -> 安装、补丁、升级、兼容性、证书、权限、审计

运维与排障
  -> 性能图、任务、事件、告警、ESXi 日志、支持包

自动化与集成
  -> REST API、Web Services API、PowerCLI、Syslog、SNMP
```

本文按小白更容易理解的顺序学习：

```text
先理解虚拟化和虚拟机
  -> 再分清 ESXi 与 vCenter
  -> 再认识数据中心、集群和清单对象
  -> 再学 HA、DRS、vMotion 和资源争用
  -> 再学虚拟网络与数据存储
  -> 再学生命周期、安全、监控和备份
  -> 做离线健康判定实验
  -> 最后建立 AIOps 拓扑、告警和 Runbook
```

## 场景开场

凌晨两点，一个订单系统突然变慢。应用告警只说接口超时，vSphere 界面里同时出现了这些线索：

```text
虚拟机 order-api：CPU 使用率 45%，CPU Ready 明显升高
ESXi esx-03：物理 CPU 接近饱和，内存开始交换
集群：一台主机刚进入维护模式
数据存储：剩余空间低于容量基线
任务：DRS 正在迁移多台虚拟机
```

只看虚拟机内部的 CPU 使用率，会误以为 CPU 还有一半空闲。但虚拟机想运行时，物理 CPU 可能正忙着执行其他虚拟机，导致它在调度队列中等待。这个等待就是 CPU Ready 的来源之一。

真正的排障要把应用、客户机操作系统、虚拟机、ESXi、集群、网络、数据存储和最近变更放到同一条时间线上。

## 一句话人话版

vSphere 是企业服务器虚拟化平台：ESXi 把一台物理服务器切成多台隔离的虚拟机，vCenter 再把多台 ESXi 组织成可统一管理、迁移、容错和调度的资源池。

## 小白可能会问

- vSphere、ESXi 和 vCenter 是不是三个互相独立的产品？
- 虚拟机 CPU 只用了 40%，为什么应用仍然卡？
- 开了 HA 后，应用是不是就永远不会中断？
- vMotion 移动的是整台虚拟机文件，还是正在运行的状态？
- 虚拟机有快照，为什么还需要备份？
- vCenter 挂了，所有虚拟机会不会一起关机？

## 为什么 AIOps 工程师要学 vSphere

大量传统数据库、中间件、Windows/Linux 服务器和行业应用运行在 vSphere 上。AIOps 如果只采集虚拟机内部数据，会看不到宿主机争用、数据存储延迟、物理网卡丢包、HA 重启、DRS 迁移和平台变更。

vSphere 能为 AIOps 提供：

- 指标：CPU Ready、内存回收、磁盘延迟、数据存储空间、网络丢包和集群容量。
- 拓扑：业务到虚拟机、ESXi、集群、端口组、数据存储和物理设备的关系。
- 事件：开关机、迁移、重配置、HA 重启、主机断连、告警触发和用户操作。
- 日志：VMkernel、hostd、vpxa、FDM、vCenter 服务与认证日志。
- 自动化：只读巡检、容量报告、快照治理、变更验证和事件富化。
- 根因分析：区分客户机内部问题、平台资源争用、网络问题、存储问题和维护活动。

## vSphere 是什么

vSphere 不是单个进程，而是一组服务器虚拟化与管理能力。入门时先抓住两个核心组件：

| 组件 | 运行在哪里 | 主要职责 | 失效后的直接影响 |
|---|---|---|---|
| ESXi | 直接安装在物理服务器上 | 运行虚拟机，调度 CPU/内存，处理虚拟网络和存储 I/O | 该主机上的虚拟机受影响 |
| vCenter Server | 以专用 Appliance 形式部署 | 统一清单、权限、集群、HA、DRS、vMotion、告警、生命周期和 API | 已运行虚拟机通常继续运行，但集中管理和部分集群操作受影响 |
| vSphere Client | 管理员浏览器 | 连接 vCenter，查看和操作清单对象 | 客户端不可用不等于数据面停止 |

ESXi 属于 Type-1 Hypervisor，也叫裸机虚拟化层：它直接控制物理 CPU、内存、网卡和存储适配器，不需要先安装普通桌面操作系统。

### 产品边界

| 产品或能力 | 主要职责 | 不要混淆 |
|---|---|---|
| vSphere | ESXi、vCenter 与相关计算虚拟化能力 | 本文主体 |
| vSAN | 把 ESXi 主机本地磁盘组织成分布式数据存储 | 不是所有 vSphere 集群都使用 vSAN |
| NSX | 数据中心网络虚拟化和安全平台 | 不等于 vSphere 标准/分布式交换机 |
| VMware Cloud Foundation | 组合计算、网络、存储和云管理的完整私有云平台 | 范围大于单独 vSphere |
| VCF Operations | 容量、性能、日志和运维分析平台 | 可增强观测，但不是 ESXi 的替代品 |
| VMware Live Recovery | 复制、站点恢复和灾备编排相关能力 | 不等于 vSphere HA |
| VMware Tools | 安装在虚拟机客户机操作系统里的驱动和代理 | 不负责宿主机管理 |

具体功能是否可用取决于版本、许可、硬件和部署方式。不要仅凭界面里出现一个菜单，就假设生产许可包含该功能。

## 它解决什么问题

- 提高物理服务器利用率，让多台隔离虚拟机共享硬件。
- 用模板、克隆和内容库缩短服务器交付时间。
- 统一管理多台 ESXi、虚拟机、网络和数据存储。
- 通过 HA 在宿主机失败后重启虚拟机。
- 通过 DRS 和 vMotion 调整虚拟机放置，减少资源热点。
- 通过资源预留、份额和限制控制 CPU、内存竞争。
- 通过集中权限、任务、事件、告警、日志和 API 建立运维证据。
- 通过生命周期管理统一 ESXi 软件、驱动和固件的期望状态。

## 核心原理

### 先理解虚拟机如何运行

一台虚拟机由虚拟硬件和客户机操作系统组成：

```text
应用
  -> 客户机操作系统
  -> 虚拟 CPU / 虚拟内存 / 虚拟网卡 / 虚拟磁盘
  -> ESXi 虚拟化层
  -> 物理 CPU / 内存 / 网卡 / HBA / 本地盘
```

虚拟 CPU 不是一颗独占的物理 CPU。ESXi 调度器会把许多虚拟 CPU 安排到物理 CPU 上执行。虚拟内存也不代表对应容量永远独占物理内存；预留、份额、内存回收和交换都会影响真实体验。

虚拟机隔离能减少相互直接干扰，但资源仍然共享。邻居虚拟机突然占满 CPU、网络或数据存储，也可能让你的应用变慢。

## 关键术语

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| hypervisor | 在物理硬件上创建和运行虚拟机的虚拟化层 | ESXi 的核心角色 |
| guest OS | 虚拟机内部安装的 Windows 或 Linux | 与 ESXi 宿主机系统不同 |
| vCPU | 分配给虚拟机的虚拟处理器 | 数量过多也可能增加调度等待 |
| datastore | ESXi 用来存放虚拟机文件的逻辑存储空间 | 容量和延迟影响许多虚拟机 |
| cluster | 由 vCenter 管理的一组 ESXi 主机 | HA、DRS 和统一生命周期的主要边界 |
| HA | High Availability，高可用 | 主机故障后在其他主机重启虚拟机 |
| DRS | Distributed Resource Scheduler，分布式资源调度器 | 根据资源需求给出或执行放置建议 |
| vMotion | 把运行中虚拟机的计算状态迁移到另一台主机 | 支撑维护和负载平衡 |
| EVC | Enhanced vMotion Compatibility，增强迁移兼容性 | 统一虚拟机看到的 CPU 功能基线 |
| VMkernel | ESXi 的核心执行环境 | 调度、内存、存储、网络和驱动问题都可能在这里体现 |
| VMkernel adapter | ESXi 主机用于管理、vMotion、存储等服务的网络接口 | 与虚拟机业务网卡不是同一个对象 |
| port group | 一组网络端口的策略模板 | 关联 VLAN、安全和流量策略 |
| vSS | vSphere Standard Switch，单主机标准交换机 | 每台 ESXi 单独配置 |
| vDS | vSphere Distributed Switch，分布式交换机 | 由 vCenter 跨主机统一管理 |
| VMFS | VMware 的集群文件系统 | 多台 ESXi 可访问同一块共享块存储 |
| vSphere HA FDM | HA 在 ESXi 上运行的故障域管理代理 | 负责成员与主从协调、故障检测和重启动作 |
| admission control | HA 准入控制 | 为主机故障预留可恢复容量 |

## 核心知识树

### 1. ESXi、虚拟机和虚拟硬件

**是什么**：ESXi 是裸机 Hypervisor；虚拟机是由配置、虚拟磁盘、固件状态和运行状态组成的软件计算机。

**为什么需要**：物理服务器交付慢、利用率低，应用又需要隔离。虚拟化让计算资源可以池化和快速分配。

**怎么工作**：ESXi 把虚拟 CPU 调度到物理 CPU，把虚拟内存映射到主机内存，把虚拟网卡接到虚拟交换机，把虚拟磁盘 I/O 转到数据存储。

**怎么看/怎么用**：在 vSphere Client 查看 VM 的 Host、Datastore、Network、VMware Tools、Tasks、Events 和性能图；在 ESXi 上可用 `vim-cmd vmsvc/getallvms` 只读列出虚拟机。

**坏了怎么查**：先区分是客户机操作系统卡死、VMware Tools 失联、虚拟机进程异常，还是 ESXi、网络、存储故障。不要把“控制台黑屏”等同于虚拟机已经关机。

### 2. vCenter、清单与管理边界

**是什么**：vCenter 是集中管理平面；清单通常按 Datacenter、Folder、Cluster、Host、Resource Pool、VM、Network 和 Datastore 组织。

**为什么需要**：单独登录每台 ESXi 无法有效实现统一权限、集群、迁移、生命周期、告警和 API 自动化。

**怎么工作**：ESXi 上的管理代理与 vCenter 通信，vCenter 保存清单和配置，并向主机下发任务。管理员、API 和 PowerCLI 通常先访问 vCenter。

**怎么看/怎么用**：检查 vCenter Appliance 健康、服务、数据库空间、备份、证书、NTP、DNS，以及主机的 Connected/Disconnected/Not Responding 状态。

**坏了怎么查**：先确认 vCenter 虚拟机和 Appliance 服务是否运行，再查 DNS、时间、证书、磁盘空间和数据库。vCenter 故障时不要急着重启所有 ESXi；已运行虚拟机的数据面通常仍在工作。

### 3. Cluster、vSphere HA 与准入控制

**是什么**：Cluster 把多台 ESXi 作为一组资源管理；vSphere HA 监测主机和虚拟机可用性，并在满足条件时把受影响虚拟机重启到其他主机。

**为什么需要**：单台物理主机故障不应让所有承载业务长期停机。

**怎么工作**：HA FDM 代理维护集群成员和故障检测。发生主机故障后，HA 根据数据存储可见性、虚拟机保护状态、资源和策略选择其他主机重启虚拟机。Admission Control 负责保留故障恢复容量。

**怎么看/怎么用**：查看 HA Enabled、主机 HA 状态、受保护虚拟机、Admission Control、心跳数据存储、隔离地址、重启优先级和最近 HA 事件。

**坏了怎么查**：确认这是主机失败、管理网络隔离、数据存储 APD/PDL，还是单个客户机故障；检查 FDM 状态、管理网络、DNS、时间、心跳数据存储和剩余资源。HA 是“重启虚拟机”，不是应用零中断，也不替代数据库集群。

### 4. DRS、资源池与资源控制

**是什么**：DRS 根据主机资源和虚拟机需求决定初始放置，并给出或自动执行迁移建议。资源池通过 Reservation、Shares 和 Limit 表达资源保证、竞争优先级和上限。

**为什么需要**：集群有总空闲资源，不代表每台主机都均衡；静态放置会形成热点。

**怎么工作**：DRS 观察资源需求、约束和规则，计算更合适的虚拟机放置，再通过 vMotion 调整。VM/Host 亲和或反亲和规则会限制可选位置。

**怎么看/怎么用**：查看 DRS 自动化级别、建议、迁移历史、集群平衡、规则冲突、资源池层级、Reservation、Shares 和 Limit。

**坏了怎么查**：DRS 不迁移时，依次检查许可、自动化级别、主机状态、vMotion 网络、EVC/CPU 兼容、数据存储可见性、规则、资源预留和设备直通。不要把 DRS 当成容量扩容工具。

### 5. vMotion、Storage vMotion 与 EVC

**是什么**：vMotion 迁移运行中虚拟机的计算执行状态；Storage vMotion 迁移虚拟机磁盘和相关文件；EVC 为集群提供一致的 CPU 功能基线。

**为什么需要**：主机维护、硬件替换和负载平衡不能每次都停业务；存储维护也需要在线迁移能力。

**怎么工作**：vCenter 协调源与目标主机，复制内存状态并在短暂切换点转移执行。目标主机必须满足 CPU、网络、存储、设备和资源兼容要求。EVC 不会把 Intel 和 AMD 变成互相兼容。

**怎么看/怎么用**：迁移前运行兼容性检查，确认 VMkernel vMotion 服务、MTU、路由、带宽、EVC、端口组、数据存储和物理设备依赖。

**坏了怎么查**：先看任务错误发生在兼容检查、准备、内存复制还是切换阶段；再查 `vmkping`、丢包、带宽、CPU 特性、EVC、端口组、RDM/直通设备和源目标日志。不要反复点击重试掩盖网络问题。

### 6. vSS、vDS、端口组与 VMkernel 网络

**是什么**：vSS 是每台主机本地管理的虚拟交换机；vDS 是由 vCenter 跨主机统一管理的分布式交换机。端口组保存 VLAN、安全、整形和冗余策略。VMkernel adapter 承载 ESXi 自己的服务流量。

**为什么需要**：虚拟机业务流量、管理、vMotion、iSCSI/NFS、vSAN 和 FT 对隔离、带宽与故障域有不同要求。

**怎么工作**：虚拟网卡连接端口组，经虚拟交换机和物理上行口进入物理网络；VMkernel adapter 则代表 ESXi 主机在某类服务网络上的 IP 身份。

**怎么看/怎么用**：核对 vSwitch、dvSwitch、Port Group、VLAN ID、vmk 接口、服务勾选、物理 vmnic、teaming/failover、MTU 和物理交换机配置。

**坏了怎么查**：从虚拟机网卡连接状态开始，逐层检查端口组、VLAN、上行、物理交换机、路由和防火墙。vMotion 或存储网络异常时，用指定 VMkernel 接口的 `vmkping` 验证，而不是只从管理电脑 ping。

### 7. Datastore、VMFS、NFS、vSAN 与 vVols

**是什么**：Datastore 是 ESXi 看到的逻辑存储容器。它可以建立在 VMFS 块存储、NFS 文件共享、vSAN 或 vVols 等后端上。

**为什么需要**：虚拟机配置、虚拟磁盘、交换文件、快照和日志必须存放在多主机可管理的持久空间中。

**怎么工作**：虚拟磁盘 I/O 从客户机经过虚拟控制器、VMkernel 存储栈、HBA/NIC 和路径访问后端。共享存储还涉及 zoning、LUN 映射、多路径、NFS 网络或存储策略。

**怎么看/怎么用**：查看 Datastore Type、Capacity、Free Space、Latency、I/O、Host Connectivity、Path、Storage Policy 和事件；把虚拟机与具体数据存储、LUN/NFS export 或 vSAN 对象关联起来。

**坏了怎么查**：先区分容量不足、延迟高、路径减少、APD、PDL、NFS 断连、vSAN 健康还是单 VM I/O 模型变化。不要在多台主机同时重扫、卸载或重启存储服务。

### 8. 虚拟机文件、快照、克隆和模板

**是什么**：虚拟机常见文件包括配置、虚拟磁盘、NVRAM、日志和交换文件。快照保存某一时点后的差异链；克隆创建另一台虚拟机；模板是用于重复部署的标准源。

**为什么需要**：平台需要保存虚拟机状态、支持短期回退和快速交付。

**怎么工作**：创建快照后，新写入进入 delta 文件，读取可能沿快照链寻找数据；删除快照通常意味着合并，而不是简单删除一个小文件。

**怎么看/怎么用**：查看 Snapshot Manager、快照年龄/大小/层数、Datastore 空间、Consolidation Needed、任务进度和备份软件任务。

**坏了怎么查**：快照合并慢或失败时先看数据存储余量、I/O、锁、备份任务和快照链。不要手工删除 datastore 里的 delta 文件。快照与源虚拟磁盘共享故障域，不是独立备份。

### 9. VMware Tools、Content Library 与客户机协作

**是什么**：VMware Tools 提供客户机驱动、心跳、时间与关机协作等能力；Content Library 管理模板、OVF 和镜像等内容。

**为什么需要**：平台只有与客户机协作，才能更准确地获取状态、优雅关机和提高设备性能；内容库用于一致交付。

**怎么工作**：Tools 代理在客户机内运行并与虚拟化层通信；内容库项目可在权限和同步策略下被部署或订阅。

**怎么看/怎么用**：检查 Tools Running/Version/Status、客户机时间、驱动、模板版本、内容库同步和容量。

**坏了怎么查**：Tools 失联时确认虚拟机是否运行、客户机服务是否启动、版本是否兼容、客户机磁盘是否满。不要仅凭 Tools Not Running 就强制重启业务。

### 10. FT、vCenter HA 与应用高可用边界

**是什么**：Fault Tolerance（FT）通过主次虚拟机执行状态保护特定虚拟机；vCenter HA 保护 vCenter Appliance；应用集群在客户机内部保护服务和数据。

**为什么需要**：不同故障对象需要不同机制，单一 HA 功能无法覆盖平台、虚拟机、应用和数据所有层次。

**怎么工作**：vSphere HA 发生故障后重启，FT 维持次级执行实例，vCenter HA 维护管理平台副本，数据库或中间件集群自行处理应用角色与数据一致性。

**怎么看/怎么用**：查看功能是否启用、复制/同步状态、网络、放置、资源和限制；明确每层 RPO、RTO 和演练结果。

**坏了怎么查**：先确定失败的是主机、vCenter、虚拟机、客户机还是应用。不要把“虚拟机仍然运行”当成“应用可用”，也不要把 FT/HA 当成备份。

### 11. 权限、SSO、证书与安全边界

**是什么**：vCenter 通过身份源、用户/组、Role、Privilege、Permission 和传播规则控制访问；ESXi 与 vCenter 使用证书保护管理通信。

**为什么需要**：虚拟化管理员可以接触大量业务，权限过大、共享账号和管理面暴露会形成高风险入口。

**怎么工作**：Permission 把用户或组、角色和清单对象绑定起来；下级对象可继承。证书、时间和 DNS 共同影响可信连接。

**怎么看/怎么用**：审计全局权限、Administrator 组、直接授权、服务账号、API Token/Session、证书到期、Lockdown Mode、SSH/ESXi Shell、审计事件和 VMSA。

**坏了怎么查**：登录失败先区分 SSO、身份源、锁定、权限、证书、时间和 DNS。紧急账号只能用于应急并纳入审计，不能成为日常共享账号。

### 12. vSphere Lifecycle Manager 与兼容性

**是什么**：vSphere Lifecycle Manager（vLCM）用期望镜像管理 ESXi 版本、供应商附加组件、驱动和固件集成。Broadcom 已说明 vSphere 8 中旧的 baseline 模式处于弃用路径。

**为什么需要**：集群主机版本和驱动漂移会制造不可重复故障，手工逐台升级也容易破坏冗余。

**怎么工作**：为集群定义期望镜像，检查合规性，再按维护与迁移流程修复主机。硬件支持管理器和厂商组件是否可用取决于集成。

**怎么看/怎么用**：检查 Image、Compliance、Pre-check、Hardware Compatibility、Remediation、任务和日志；升级前查 Broadcom Compatibility Guide 与产品互操作矩阵。

**坏了怎么查**：修复失败先看预检查、硬件/固件/驱动兼容、维护模式、DRS 迁移、HA 容量、第三方 VIB、启动盘和下载源。禁止跳过兼容检查直接批量升级。

### 13. 备份、复制与灾难恢复

**是什么**：备份系统通过 vSphere API 和快照机制读取虚拟机数据并保存到独立存储；复制和站点恢复面向站点级恢复与编排。

**为什么需要**：HA 只处理运行位置，不能恢复误删、勒索、逻辑损坏和整站灾难。

**怎么工作**：备份通常短暂创建快照、传输数据、提交副本并合并快照；恢复需要重新注册或还原虚拟机、磁盘和应用数据。

**怎么看/怎么用**：查看最近成功备份、恢复点、快照清理、代理/传输节点、数据存储空间、复制 RPO 和恢复演练。

**坏了怎么查**：备份失败先关联 vCenter 任务、虚拟机快照、数据存储余量、CBT 状态、权限、网络和备份端日志。只有成功恢复演练才能证明备份可用。

### 14. 性能调度与资源争用

**是什么**：vSphere 性能不只是 CPU 使用率，还包括 CPU Ready/Co-stop、内存 Balloon/Compression/Swap、磁盘延迟/队列、网络吞吐/丢包和数据存储争用。

**为什么需要**：虚拟机内部指标可能正常，但平台层正在排队或回收资源。

**怎么工作**：当需求超过当前可调度资源，ESXi 会排队、按 Shares 分配、回收内存或触发交换；存储和网络也会在共享路径上排队。

**怎么看/怎么用**：同时看 VM、Host、Cluster、Datastore 和 Network 的实时与历史图，结合 `esxtop`、任务、事件和业务 SLO。阈值要按采样周期、vCPU 数、工作负载和历史基线解释。

**坏了怎么查**：先对齐时间，再判断是需求上升、资源超配、Limit/Reservation、NUMA、DRS 迁移、路径故障、备份/快照任务还是物理硬件瓶颈。不要只凭单个瞬时峰值扩容。

### 15. API、PowerCLI、任务与事件

**是什么**：vSphere 提供 REST Automation API、Web Services API 和 PowerCLI；Task 表示操作进度，Event 记录平台发生的事实，Alarm 根据规则触发状态。

**为什么需要**：AIOps 需要持续、可审计地读取清单、性能、事件和健康状态，而不是依赖人工截图。

**怎么工作**：客户端向 vCenter 认证后获取会话，再按权限读取对象或提交任务。事件和性能样本有保留范围，外部平台需要定期采集并记录游标与数据新鲜度。

**怎么看/怎么用**：使用只读服务账号调用 API 或 PowerCLI，记录 vCenter、对象 ID、采集时间、请求结果和版本；对自动化动作保留审批、幂等和回滚证据。

**坏了怎么查**：先查 DNS/TLS/时间、认证、权限、会话、API 版本、速率、分页和对象是否已删除；再查 vCenter 服务与任务。不要在脚本里明文保存管理员密码或关闭证书校验。

## 架构和数据流

### 管理链路

```text
管理员 / AIOps / PowerCLI / API client
  -> HTTPS 443
  -> vCenter Server
  -> inventory、permissions、tasks、events、alarms、performance
  -> ESXi management agents
  -> VM、network、datastore、cluster operation
```

### 虚拟机计算链路

```text
application
  -> guest OS
  -> virtual hardware
  -> ESXi scheduler and VMkernel
  -> physical CPU / memory / device
```

### 虚拟机网络链路

```text
guest virtual NIC
  -> port group
  -> vSS or vDS
  -> physical uplink vmnic
  -> physical switch / router / firewall
  -> destination service
```

### 虚拟磁盘链路

```text
guest filesystem / database
  -> virtual disk controller
  -> VMDK or storage object
  -> VMkernel storage stack
  -> HBA / NIC and multipath
  -> VMFS / NFS / vSAN / vVols backend
  -> physical media
```

### HA 故障恢复链路

```text
host or VM failure signal
  -> HA FDM and heartbeat evidence
  -> failure classification
  -> protected VM and capacity check
  -> select surviving host
  -> register and power on VM
  -> VMware Tools / app health verification
```

每条链路都要关联唯一对象标识。只用虚拟机显示名容易因重名或改名产生误关联，AIOps 台账应同时保存 vCenter、Datacenter、Cluster、Host、VM MoRef/UUID、Datastore 和 Network 标识。

## 安装、初始化与交付

### 先选择学习方式

| 方式 | 适合场景 | 注意事项 |
|---|---|---|
| VMware Hands-on Labs | 第一次认识界面和工作流 | 实验目录会变化，按官方当前可用实验选择 |
| 授权的嵌套实验室 | 学习 ESXi、vCenter、网络和集群 | 需要足够 CPU、内存、存储和嵌套虚拟化支持，不代表生产受支持 |
| 兼容认证的物理实验服务器 | 学习真实驱动、网络和存储 | 必须核对硬件兼容、固件和许可 |
| 生产环境 | 正式业务 | 必须经过容量设计、兼容验证、备份、审批和回退演练 |

不能把在普通笔记本里“能安装”理解成“生产受支持”。生产 ESXi 服务器、I/O 设备、存储和 Guest OS 都要查询 Broadcom Compatibility Guide。

### 交付前设计

- 准确版本：vCenter、ESXi、补丁、厂商镜像和 VMware Tools。
- 硬件：服务器型号、CPU、内存、启动设备、网卡、HBA、GPU、固件和驱动。
- DNS/NTP：正反向解析、FQDN、统一时间源和时区。
- 网络：管理、vMotion、存储、vSAN、FT、虚拟机业务和备份网络。
- 存储：类型、路径、容量、性能、数据存储命名和多路径策略。
- 集群：HA 容量、Admission Control、DRS、EVC、规则和故障域。
- 安全：管理网隔离、身份源、最小权限、证书、日志、VMSA 和应急账号。
- 保护：vCenter 基于文件的备份、虚拟机备份、恢复演练和站点灾备。
- 观测：性能保留、远程 Syslog、SNMP/API、告警通知和 CMDB 映射。

### 初始化主线

```text
核对许可与兼容性
  -> 安装首台 ESXi
  -> 配置管理地址、FQDN、DNS、NTP
  -> 部署 vCenter Server Appliance
  -> 创建 Datacenter 和 Cluster
  -> 添加 ESXi 并验证版本、证书和时间
  -> 配置虚拟网络与 VMkernel 服务
  -> 接入并验证 datastore 和多路径
  -> 设置 HA、DRS、EVC 和 Admission Control
  -> 配置权限、备份、日志、告警和生命周期
  -> 创建测试 VM
  -> 验证 vMotion、维护模式、HA 和恢复
```

安装顺序不是生产变更单。真实项目要使用对应版本的 TechDocs、厂商安装指南和经评审的低层设计。

## 配置详解：先写设计单

下面是脱敏学习示例，不是可以直接导入 vSphere 的配置文件：

```yaml
platform:
  version: "8.x-or-9.x"       # 记录准确版本和补丁，不能只写 vSphere
  vcenter_fqdn: "vcsa.lab.local" # vCenter 使用可解析的完整域名

cluster:
  name: "cluster-lab"         # 集群名称应能映射到环境和责任团队
  hosts: 3                     # 三主机仅为实验示例，生产按容量和故障模型设计
  ha_enabled: true             # 开启前还要配置准入控制和验证故障恢复
  drs_enabled: true            # 实际自动化级别和许可需单独记录
  evc_mode: "verified-mode"   # 只能填写硬件兼容检查确认的 CPU 基线
  spare_host_failures: 1       # 表达期望承受的主机故障数量

networks:
  management_vlan: 110         # ESXi 和 vCenter 管理网络
  vmotion_vlan: 120            # vMotion VMkernel 网络
  storage_vlan: 130            # iSCSI/NFS 等 IP 存储网络
  workload_vlan: 210           # 业务虚拟机示例 VLAN
  mtu: 1500                    # 端到端统一验证后才能使用 Jumbo Frame

storage:
  datastore: "ds-lab-01"      # 逻辑数据存储名称
  type: "VMFS-or-NFS-or-vSAN" # 后端类型决定排障路径
  warn_used_pct: 80            # 学习阈值，生产按增长率和保护余量制定
  critical_used_pct: 90        # 达到严重阈值前必须保留合并和恢复空间

operations:
  remote_syslog: "syslog.lab.local" # 使用 DNS 名称并验证证书/端口
  ntp: "ntp.lab.local"              # 所有管理组件统一时间源
  backup_policy: "daily-tested"     # 写明恢复验证，而不只写已配置备份
```

### 字段为什么重要

| 字段 | 控制什么 | 新手容易错在哪里 |
|---|---|---|
| `version` | 文档、API、兼容和补丁基线 | 只写 8.0，不记录 Update、补丁和 Build |
| `vcenter_fqdn` | vCenter 身份、证书和解析 | 安装后随意改名或 DNS 不完整 |
| `spare_host_failures` | HA 保留容量目标 | 只开启 HA，不留恢复容量 |
| `evc_mode` | 虚拟机可见 CPU 功能基线 | 未查 CPU 兼容就选择模式 |
| VLAN | 划分流量和广播域 | vSphere 与物理交换机两侧不一致 |
| `mtu` | 单帧可承载大小 | 只改 ESXi，漏改物理交换机或存储 |
| 容量阈值 | 快照、迁移、交换和恢复余量 | 只看百分比，不看增长率与最大对象 |
| `remote_syslog` | 主机故障后保留日志 | 日志仅放在本地 ramdisk 或同一故障域 |

## vSphere Client 操作字典

| 操作 | 目的 | 关键检查 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| 创建 Datacenter | 建立清单管理边界 | 名称、权限继承 | 下级可创建集群/主机 | 当成物理机房本身 |
| 创建 Cluster | 组织主机资源 | HA、DRS、EVC、vLCM | 主机可加入且合规 | 未做容量和兼容设计 |
| Add Host | 将 ESXi 纳入 vCenter | FQDN、证书、许可、时间 | 状态 Connected | 使用 IP 导致证书/DNS混乱 |
| Enter Maintenance Mode | 维护前疏散工作负载 | DRS、关机 VM、vSAN/存储策略 | 主机无运行工作负载 | 没确认迁移失败或本地盘 VM |
| Migrate | 迁移计算或存储 | 兼容、网络、存储、资源 | 任务成功且业务正常 | 只看任务成功，不做业务验证 |
| Configure HA | 配置故障恢复 | Admission Control、隔离响应 | VM 受保护且容量满足 | 误以为零中断 |
| Configure DRS | 配置放置和平衡 | 自动化级别、规则 | 建议可解释且可执行 | 规则互相冲突 |
| Create Snapshot | 短期变更回退点 | 一致性、空间、保留时间 | 快照创建并按时清理 | 长期保留替代备份 |
| Create Alarm | 监控对象状态 | 对象、触发、恢复、通知 | 告警和恢复均可验证 | 只有触发没有恢复通知 |
| Generate Support Bundle | 收集故障证据 | 时间窗、组件、敏感信息 | 可供授权支持分析 | 上传公开仓库泄露信息 |

## ESXi 只读命令字典

ESXi Shell 和 SSH 应按最小开放时间、最小权限和审计策略使用。命令结果会随版本与硬件变化。

| 命令 | 作用 | 关键字段 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `esxcli system version get` | 查看 ESXi 版本与 Build | Product、Version、Build | 与基线一致 | 只看 8.0，忽略 Build |
| `esxcli system hostname get` | 查看主机名和域名 | Host Name、Domain Name、FQDN | DNS 设计一致 | FQDN 与证书不一致 |
| `esxcli network ip interface list` | 查看 VMkernel 接口 | Name、MAC、Enabled、Portgroup | 预期 vmk 在线 | 把 vmk 与虚拟机 vNIC 混淆 |
| `esxcli network nic list` | 查看物理网卡 | Name、Link、Speed、Driver | 冗余上行在线且速率正确 | Link Up 不代表无丢包 |
| `vmkping -I vmk1 target-ip` | 从指定 VMkernel 测网络 | 接口、目标、时延、丢包 | 连续无丢包 | 从管理网测试了错误路径 |
| `esxcli storage filesystem list` | 查看数据存储挂载 | Volume、Type、Size、Mounted | 预期数据存储 Mounted | 只看名称不核对 UUID |
| `esxcli storage core path list` | 查看存储路径 | State、Adapter、Target、Device | 路径数和状态符合设计 | 某路径 Dead 仍认为可用 |
| `esxcli system maintenanceMode get` | 查看维护模式 | Enabled/Disabled | 与变更状态一致 | 主机卡在维护流程中 |
| `vim-cmd vmsvc/getallvms` | 列出主机登记虚拟机 | VMID、Name、File、Guest OS | 清单与预期一致 | 不代表 VM 当前健康 |
| `esxtop` | 实时查看 CPU、内存、磁盘和网络 | `%RDY`、内存回收、延迟、丢包 | 与历史基线一致 | 单次快照代替趋势分析 |
| `tail -n 100 /var/run/log/vmkernel.log` | 查看近期 VMkernel 日志 | 时间、级别、设备、错误 | 无持续硬件/路径异常 | 脱离事件时间窗搜索 |
| `vdf -h` | 查看 ESXi 系统分区空间 | Mount、Size、Use% | 关键分区有余量 | 与 datastore 容量混淆 |

示例：验证 vMotion 网络时，应先确认目标地址和 vmk 编号来自授权设计，再运行：

```shell
esxcli network ip interface list # 找到启用了 vMotion 服务的 VMkernel 接口及其状态
vmkping -I vmk1 192.0.2.22       # 从指定 vmk1 测试到实验目标；地址必须替换为授权实验地址
```

如果配置了大 MTU，还要按对应版本官方命令验证不可分片的大包，并同时确认物理交换机全链路。不要仅因为普通小包能 ping 通就认定 Jumbo Frame 正常。

## PowerCLI 只读入门

当前官方页面使用 VCF PowerCLI 名称。模块安装、支持的 PowerShell 版本和证书策略以官方页面为准。下面只展示常见只读工作流，不包含密码：

```powershell
$server = 'vcsa.lab.local'                                      # 指定授权实验 vCenter 的 FQDN
$credential = Get-Credential                                   # 交互输入只读账号，不把密码写进脚本
Connect-VIServer -Server $server -Credential $credential       # 建立受 TLS 保护的 vCenter 会话
Get-Cluster | Select-Object Name, HAEnabled, DrsEnabled        # 查看集群及 HA/DRS 状态
Get-VMHost | Select-Object Name, ConnectionState, PowerState   # 查看 ESXi 连接与电源状态
Get-Datastore | Select-Object Name, Type, CapacityGB, FreeSpaceGB # 查看数据存储类型和容量
Get-VM | Select-Object Name, PowerState, NumCpu, MemoryGB      # 查看虚拟机电源与规格
Disconnect-VIServer -Server $server -Confirm:$false            # 主动关闭会话，避免会话长期遗留
```

预期结果：能看到授权范围内的集群、主机、数据存储和虚拟机，不应为了让脚本成功而给账号全局 Administrator 权限。

失败先检查：PowerCLI 版本、DNS、443 端口、证书链、时间、账号锁定、权限和 vCenter 服务。不要使用永久关闭证书校验作为生产解决方案。

## API 字典

| 接口或对象 | 作用 | 关键内容 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `POST /api/session` | 创建 API 会话 | 认证、TLS、会话 ID | 返回可用于后续请求的会话 | 在日志中泄露凭据或 Token |
| `GET /api/vcenter/vm` | 列出虚拟机 | VM ID、Name、Power State | 只返回授权对象 | 忽略分页和权限过滤 |
| `GET /api/vcenter/host` | 列出 ESXi 主机 | Host ID、Connection、Power | 与清单一致 | 用显示名做唯一键 |
| `GET /api/vcenter/datastore` | 列出数据存储 | Datastore ID、Type、Capacity | 与清单一致 | 不关联后端存储对象 |
| Appliance Health API | 查看 vCenter Appliance 健康 | System、Storage、Swap、Service | 状态正常且数据新鲜 | 端口 443/5480 API 混用 |
| Web Services PerformanceManager | 查询性能计数器 | Counter、Entity、Interval、Sample | 样本连续且可解释 | 计数器单位和采样周期误读 |
| Task/Event objects | 获取任务和事件 | User、Entity、Time、State、Message | 可关联变更和故障 | 事件保留不足导致证据丢失 |

API 的字段和可用操作会随版本变化。代码应先协商或记录 API 版本，处理分页、超时、重试、限流、删除对象和权限不足，并把采集失败作为单独告警。

## 性能指标怎么读

### CPU

- Usage：虚拟机或主机实际消耗的 CPU 比例。
- Ready：vCPU 已准备运行，但等待物理 CPU 调度的时间。
- Co-stop：多 vCPU 虚拟机因协同调度产生的等待。
- Demand：工作负载真实请求的计算资源。
- Limit：人为设置的上限，可能让有空闲物理 CPU 的虚拟机仍被限制。

CPU Ready 的解释必须考虑采样周期和 vCPU 数。不要把某个论坛阈值直接当成所有环境的红线，应结合官方性能指南、业务 SLO 和历史基线。

### 内存

- Consumed：宿主机为虚拟机消耗的物理内存。
- Active：近期活跃使用的估算内存。
- Balloon：通过 VMware Tools 驱动在客户机内回收内存。
- Compression：在交换到磁盘前压缩内存页。
- Swap：ESXi 把虚拟机内存页交换到磁盘，通常需要重点调查。
- Reservation：保证给对象的资源下限。

客户机内部“还有可用内存”不代表宿主机没有资源压力；宿主机发生 Balloon 或 Swap 时要同时看集群容量和工作负载变化。

### 存储

- IOPS：每秒 I/O 次数。
- Throughput：每秒传输数据量。
- Latency：I/O 完成耗时，要区分客户机、虚拟磁盘、内核与设备层。
- Queue：请求排队情况。
- Outstanding I/O：尚未完成的请求。
- Path State：存储路径状态和冗余。

高延迟可能来自虚拟机负载、快照链、备份、数据存储拥塞、路径故障、阵列重构或后端介质。必须沿完整 I/O 链验证。

### 网络

- Packets、Bytes：数据包和流量。
- Dropped：发送或接收丢包。
- Errors：物理或协议错误。
- Usage：上行利用率。
- Teaming：上行冗余与负载策略。

虚拟交换机看不到的错误可能发生在物理交换机、网卡驱动、光模块或上游网络设备中，AIOps 要合并两侧证据。

## 日志、任务、事件和告警

| 证据 | 典型内容 | AIOps 用途 |
|---|---|---|
| `vmkernel.log` | 存储、网络、驱动、设备和 VMkernel 事件 | 定位路径、APD/PDL、网卡和硬件问题 |
| `hostd.log` | ESXi 主机管理、VM 任务和 SDK 请求 | 定位单主机管理与任务失败 |
| `vpxa.log` | ESXi 与 vCenter 的代理通信 | 定位 Disconnected/Not Responding |
| `fdm.log` | vSphere HA 代理 | 定位 HA 配置、选举和故障响应 |
| `vobd.log` | VMkernel Observation 事件 | 关联硬件和存储告警 |
| vCenter Tasks | 用户或系统发起的操作与状态 | 变更审计和失败定位 |
| vCenter Events | 对象状态变化和平台事实 | 告警富化、RCA 和时间线 |
| Alarm | 按规则判断对象状态 | 通知、工单和自动化入口 |

Broadcom 当前文档指出 ESXi 日志位于 `/var/run/log`。部分日志可能在 ramdisk 或本地 scratch 中，主机故障后会丢失，因此生产环境应配置持久日志位置和远程 Syslog，并监控最后成功发送时间。

## 在 AIOps 中的作用

vSphere 位于业务和物理基础设施之间。AIOps 既要采集虚拟机内部指标，也要采集 vCenter/ESXi 平台证据，才能区分应用问题与虚拟化资源争用。

### 建议拓扑

```text
business service
  -> application instance
  -> guest OS
  -> VM
  -> ESXi host
  -> cluster / resource pool
  -> vCenter

VM
  -> vNIC -> port group -> vSS/vDS -> vmnic -> physical network

VM
  -> virtual disk -> datastore -> path/network -> storage system
```

### 建议采集

| 层级 | 指标或状态 | 目的 |
|---|---|---|
| vCenter | health、service、disk、backup、certificate | 发现管理面风险 |
| Cluster | HA/DRS、admission、capacity、imbalance | 判断集群容错与热点 |
| Host | connection、CPU、memory、hardware、maintenance | 判断宿主机故障和资源压力 |
| VM | power、tools、CPU ready、memory reclaim、latency | 关联业务体验 |
| Network | vmk、vmnic、port group、drop、error、usage | 定位虚拟与物理网络 |
| Storage | datastore capacity、latency、path、APD/PDL | 定位容量和 I/O 故障 |
| Protection | snapshot、backup、replication、recovery test | 判断数据可恢复性 |
| Operations | task、event、alarm、user、change | 建立故障时间线 |
| Collector | last success、duration、object count、data age | 发现监控盲区 |

### 告警治理

| 告警 | 需要补充的上下文 | 降噪方式 |
|---|---|---|
| Host Not Responding | 集群、VM、管理网、存储、最近维护 | 将同主机派生 VM 告警归并 |
| HA Restart | 原主机、目标主机、重启 VM、恢复耗时 | 形成一次集群事件而非多条电源告警 |
| CPU Ready 高 | vCPU、Host Demand、DRS、Limit、业务 SLO | 持续时间与历史基线 |
| 内存 Swap | VM、Host、Cluster、Reservation、Balloon | 区分瞬时与持续回收 |
| Datastore 容量高 | 增长率、最大 VM、快照、交换、备份 | 按预计耗尽时间升级 |
| Datastore 延迟高 | VM I/O、路径、备份、快照、阵列事件 | 关联共同数据存储上的 VM |
| vMotion 失败 | 源/目标、阶段、vmk、EVC、网络、任务 | 按根因和迁移批次归并 |
| Snapshot 过期 | Owner、年龄、大小、备份任务、空间 | 排除有审批的短期窗口 |
| 采集数据过旧 | Collector、vCenter、API、最后成功时间 | 独立的观测盲区告警 |

### 自动化安全边界

适合自动化：

- 读取清单、版本、连接状态、性能、任务、事件和告警。
- 生成 VM 到 Host/Cluster/Datastore/Network 的拓扑。
- 计算容量增长、CPU Ready、快照年龄和数据新鲜度。
- 在变更前后执行只读健康检查并生成差异报告。
- 为告警补充 Owner、业务、最近迁移、备份和维护窗口。
- 创建工单、审批建议和只读诊断包索引。

必须审批并设置停止条件：

- 开关机、强制重启、迁移和删除虚拟机。
- 创建、删除或合并快照。
- 进入/退出维护模式和执行 vLCM Remediation。
- 修改 HA、DRS、EVC、资源池、Reservation、Limit 或规则。
- 修改 vDS、VLAN、VMkernel、MTU、存储路径或数据存储。
- 执行证书替换、密码重置、主机断开/重新连接。
- 强制故障切换、灾备恢复、存储卸载或设备重扫。

## 入门实验：生成 vSphere 脱敏健康报告

### 实验目标

在没有 vSphere 环境的 Windows 电脑上，用一份虚构的指标样本识别 CPU Ready、数据存储容量和采集新鲜度风险，同时理解“越高越危险”和“越低越危险”两类阈值。

本文阈值只用于学习规则引擎，不是 Broadcom 官方生产阈值。生产阈值必须结合采样周期、业务 SLO、历史基线和容量设计。

### 实验步骤

1. 创建实验目录：

```powershell
New-Item -ItemType Directory -Force vsphere-lab | Out-Null # 创建实验目录，重复运行不会报错
Set-Location vsphere-lab                                  # 进入实验目录
```

2. 创建脱敏指标样本：

```powershell
@'
object,metric,value,warn,critical,direction,unit
cluster-prod,ha_spare_hosts,1,1,0,lower,count
esx-01,cpu_ready_pct,6,5,10,higher,percent
datastore-prod,used_pct,82,80,90,higher,percent
vcsa,collection_age_min,18,10,30,higher,minute
vm-order-api,path_online_pct,100,100,50,lower,percent
'@ | Set-Content vsphere-health.csv -Encoding utf8 # 只使用虚构对象名，不包含生产信息
```

`higher` 表示数值越高风险越大；`lower` 表示数值越低风险越大。`ha_spare_hosts` 是实验中的容量字段，不代表 vSphere 的单一原生计数器。

3. 创建 `check-vsphere.ps1`：

```powershell
$rows = Import-Csv .\vsphere-health.csv # 读取 CSV，每行转换成一个指标对象

$results = foreach ($row in $rows) {
    $value = [double]$row.value       # 把当前值转换成数字
    $warn = [double]$row.warn         # 把 warning 阈值转换成数字
    $critical = [double]$row.critical # 把 critical 阈值转换成数字

    if ($row.direction -eq 'higher') {
        $status = if ($value -ge $critical) { 'CRITICAL' } elseif ($value -ge $warn) { 'WARN' } else { 'OK' }
    } else {
        $status = if ($value -le $critical) { 'CRITICAL' } elseif ($value -lt $warn) { 'WARN' } else { 'OK' }
    }

    [pscustomobject]@{
        Object = $row.object # 被检查的集群、主机、数据存储或虚拟机
        Metric = $row.metric # 指标名称
        Value = $value       # 当前指标值
        Unit = $row.unit     # 指标单位
        Status = $status     # 根据方向与阈值得出的状态
    }
}

$results | Format-Table -AutoSize # 输出便于值班人员阅读的表格

if ($results.Status -contains 'CRITICAL') { exit 2 } # 有严重风险时返回退出码 2
if ($results.Status -contains 'WARN') { exit 1 }     # 只有警告风险时返回退出码 1
exit 0                                               # 所有指标正常时返回退出码 0
```

4. 执行脚本并立即查看退出码：

```powershell
powershell -ExecutionPolicy Bypass -File .\check-vsphere.ps1 # 仅为本次子进程放宽脚本策略
$LASTEXITCODE                                                 # 查看脚本返回给监控系统的状态码
```

### 预期结果

```text
Object         Metric             Value Unit    Status
------         ------             ----- ----    ------
cluster-prod   ha_spare_hosts         1 count   OK
esx-01         cpu_ready_pct           6 percent WARN
datastore-prod used_pct               82 percent WARN
vcsa           collection_age_min     18 minute  WARN
vm-order-api   path_online_pct       100 percent OK
```

退出码应为 `1`，因为样本中存在警告，但没有严重指标。

### 验证结果

把 `datastore-prod` 的 `value` 从 `82` 改成 `92` 后重跑，状态应为 `CRITICAL`，退出码应为 `2`。把 `collection_age_min` 改成 `2`，该项应恢复为 `OK`。

### 如果没有成功

按顺序检查：

1. 当前目录是否同时存在 CSV 和 PowerShell 脚本。
2. CSV 表头是否完整，字段间是否使用英文逗号。
3. `value`、`warn`、`critical` 是否只写数字。
4. `direction` 是否只写 `higher` 或 `lower`。
5. 是否在脚本结束后立刻读取 `$LASTEXITCODE`。
6. 文件是否被表格软件保存成了其他编码或分隔格式。

接入授权 vSphere 后，可以用只读 PowerCLI/API 导出脱敏数据再转换为这个结构。公开仓库不能出现真实 vCenter/ESXi 地址、VM 名、UUID、MoRef、数据存储、VLAN、账号、Token、证书私钥或支持包。

## 常见故障排查

### vCenter 无法登录

1. 确认浏览器到 vCenter FQDN 和 443 端口可达。
2. 验证 DNS 正反向解析和客户端/vCenter 时间。
3. 区分 SSO 用户、外部身份源用户和本地 Appliance 管理账号。
4. 查看账号锁定、密码到期、权限和证书状态。
5. 检查 vCenter Appliance 服务、磁盘空间、数据库和健康 API。
6. 仍失败时按版本文档收集支持包，避免无依据重启所有服务。

### ESXi 显示 Disconnected 或 Not Responding

先确认主机和虚拟机是否仍运行，再检查管理 VMkernel、物理上行、VLAN、路由、防火墙、DNS、NTP、证书、hostd/vpxa 和 vCenter 状态。若同一交换机下多台主机同时异常，优先调查共同网络故障域。

### 虚拟机 CPU 不高但应用很慢

对齐同一时间窗检查客户机 load/CPU、vSphere CPU Ready、Co-stop、Host Demand、主机 CPU、DRS、Limit、Reservation、NUMA、vCPU 数和最近迁移。CPU Ready 高不一定只靠增加 vCPU 解决，盲目加 vCPU 可能让调度更困难。

### 虚拟机内存正常但宿主机发生交换

检查 Host/Cluster 可用内存、Balloon、Compression、Swap、VM Reservation、Limit、工作集变化和 DRS。客户机 page cache 也会让“已用内存”看起来很高，必须同时看平台回收指标和业务延迟。

### vMotion 兼容检查失败

检查目标主机状态、CPU/EVC、VMkernel vMotion 服务、网络连通、MTU、带宽、端口组、数据存储可见性、设备直通、RDM、ISO/本地设备、Affinity 和 Reservation。错误发生在哪个阶段，决定优先看网络、兼容还是任务日志。

### 主机无法进入维护模式

找出仍在运行或无法迁移的 VM，检查 DRS、迁移兼容、HA Admission Control、规则、本地数据存储、直通设备、vSAN 数据迁移模式和系统 VM。不要直接强制关机主机来“完成维护”。

### HA 没有重启虚拟机

检查虚拟机是否受保护、HA/FDM 状态、失败是否被判断为隔离、数据存储是否可见、剩余主机资源、Admission Control、重启优先级和依赖。HA 重启成功后还要验证客户机、应用和数据一致性。

### 数据存储空间不足

按占用拆分 VMDK、快照 delta、交换文件、ISO、模板、日志和未注册文件，结合增长率和预计耗尽时间处理。删除前确认 Owner、备份、保留和文件锁，禁止直接从 datastore browser 猜测删除。

### 数据存储延迟高

同时检查 VM IOPS/块大小/读写比、Host 内核延迟、设备延迟、队列、路径、备份、快照合并、Storage vMotion、阵列端口、池和介质。多台 VM 同时升高通常指向共同路径或数据存储，但仍需证据确认。

### 虚拟机网络不通

检查客户机 IP/路由/防火墙、vNIC Connected、Port Group、VLAN、vSS/vDS、vmnic、teaming、物理交换机和上游网络。只有某台主机上的 VM 不通时，重点比较该主机的上行与端口配置。

### 快照删除或 Consolidation 卡住

检查任务、快照链、数据存储余量、虚拟机 I/O、备份软件、文件锁和主机日志。合并会产生额外 I/O 和空间压力，应在业务窗口监控。禁止手工删除 delta 或 descriptor 文件。

### vLCM Remediation 失败

检查预检查结果、硬件兼容、镜像/厂商 Add-on、驱动、固件、第三方 VIB、维护模式、DRS 迁移、HA 容量、下载源和启动盘。修复前后都要保存合规与业务验证证据。

### API 或 PowerCLI 突然采集不到数据

检查采集器到 vCenter 的 DNS/TLS/443、时间、账号锁定、权限、会话、证书、API 版本、分页、超时、vCenter 服务和对象数变化。采集失败本身必须告警，否则平台会把“没有数据”误判为“没有故障”。

## 变更、升级与安全

变更前至少完成：

- 查询产品生命周期、VMSA、Release Notes 和已知问题。
- 用 Broadcom Compatibility Guide 验证服务器、CPU、I/O、存储和 Guest OS。
- 验证 vCenter 与 ESXi、备份、vSAN/NSX/插件和管理工具的互操作。
- 备份 vCenter，验证虚拟机备份和至少一个恢复点。
- 确认 HA/DRS、主机、路径、数据存储和集群余量健康。
- 写明逐台顺序、维护模式、迁移策略、停止条件和回退路径。
- 记录变更前版本、Build、合规、告警、性能和业务基线。
- 避免同时维护同一故障域的多台主机、交换机、存储路径或管理组件。
- 变更后验证 VM 电源、Tools、网络、存储、HA、DRS、备份、日志和业务 SLO。

管理网络应与普通业务网络隔离；禁止把 vCenter、ESXi 管理面直接暴露到互联网。持续跟踪 VMware Security Advisories，按风险、受影响版本、缓解措施、补丁和恢复验证形成闭环。

## 面试怎么讲

vSphere 的计算数据面由 ESXi 承担，vCenter 提供集中清单、权限、集群、迁移、告警、生命周期和 API。vSphere HA 在主机故障后把虚拟机重启到其他主机，不等于零中断；DRS 根据资源需求和规则做放置和平衡，通常通过 vMotion 执行迁移；EVC 统一 CPU 功能基线以提高迁移兼容性。排障时我会从应用和客户机开始，关联 VM、Host、Cluster、Network、Datastore、Tasks、Events 和最近变更，同时看 CPU Ready、内存回收、存储延迟、路径和网络丢包。快照、HA、FT 和 vCenter HA 都不能替代独立备份与恢复演练。AIOps 侧用只读 API/PowerCLI 构建拓扑和基线，高风险动作必须审批、验证和可回退。

## 学习检查清单

- [ ] 我能分清 vSphere、ESXi、vCenter、vSAN、NSX 和 VCF。
- [ ] 我能解释 Type-1 Hypervisor 和虚拟硬件。
- [ ] 我能画出应用到 ESXi 物理资源的数据路径。
- [ ] 我能说明 Datacenter、Cluster、Host、Resource Pool 和 VM 的关系。
- [ ] 我能区分 HA、DRS、vMotion、EVC、FT 和 vCenter HA。
- [ ] 我知道 HA 重启虚拟机，不保证应用零中断。
- [ ] 我能区分 vSS、vDS、Port Group、VMkernel adapter 和 vmnic。
- [ ] 我能区分 VMFS、NFS、vSAN、vVols 和 Datastore。
- [ ] 我能解释 CPU Ready、Balloon、Swap 和存储延迟。
- [ ] 我知道虚拟机快照不能替代独立备份。
- [ ] 我会使用 vSphere Client 和只读命令收集故障证据。
- [ ] 我能完成脱敏健康报告实验并解释退出码。
- [ ] 我知道升级前必须检查兼容性、生命周期和 VMSA。
- [ ] 我能说明哪些自动化只读安全，哪些动作必须审批。

## 面试题

1. vSphere、ESXi 和 vCenter 分别是什么？
2. Type-1 Hypervisor 与普通桌面虚拟化有什么区别？
3. vCenter 故障后，已运行虚拟机一定会停止吗？
4. Datacenter、Cluster、Host、Resource Pool 和 VM 如何组织？
5. vSphere HA 如何发现故障并重启虚拟机？
6. HA Admission Control 为什么重要？
7. HA、FT、vCenter HA 和应用集群有什么区别？
8. DRS 解决什么问题，为什么有时不会执行迁移？
9. vMotion、Storage vMotion 和冷迁移有什么区别？
10. EVC 如何帮助 vMotion，它能否跨 Intel/AMD？
11. vSS 与 vDS 的区别是什么？
12. VMkernel adapter 与虚拟机 vNIC 有什么区别？
13. VMFS、NFS、vSAN 和 vVols 如何向 ESXi 提供 Datastore？
14. CPU 使用率不高，CPU Ready 为什么仍可能很高？
15. Balloon、Compression 和 Swap 表示什么？
16. 虚拟机快照为什么不能长期保留或替代备份？
17. ESXi 的 `vmkernel.log`、`hostd.log`、`vpxa.log` 和 `fdm.log` 分别看什么？
18. vLCM 镜像模式如何减少集群配置漂移？
19. 如何把 vSphere 接入 AIOps 拓扑和告警治理？
20. 哪些 vSphere 操作可以自动化，哪些必须人工审批？

## 学习证据

学完后建议提交这些脱敏证据：

- `labs/vsphere/product-map.md`：vSphere、vSAN、NSX、VCF 和备份产品边界。
- `labs/vsphere/inventory-map.md`：Datacenter、Cluster、Host、VM、Network、Datastore 关系。
- `labs/vsphere/data-path.md`：虚拟机计算、网络和存储数据路径。
- `labs/vsphere/ha-drs-vmotion.md`：HA、DRS、vMotion、EVC 对比笔记。
- `labs/vsphere/design-sanitized.yaml`：脱敏实验设计单。
- `labs/vsphere/vsphere-health.csv`：本文健康样本。
- `labs/vsphere/check-vsphere.ps1`：健康判定脚本。
- `labs/vsphere/health-report.txt`：脚本输出和退出码。
- `labs/vsphere/powercli-readonly.ps1`：不含凭据的只读巡检脚本。
- `labs/vsphere/runbook-host-not-responding.md`：主机断连排障 Runbook。
- `labs/vsphere/runbook-vmotion-failed.md`：vMotion 失败排障 Runbook。
- `labs/vsphere/recovery-test.md`：虚拟机或应用恢复演练记录。

公开仓库不要提交真实 vCenter/ESXi 地址、许可证、序列号、VM/客户名、UUID、MoRef、VLAN、WWPN、IQN、数据存储、拓扑、账号、密码、Session ID、Token、证书私钥、日志全集或支持包。

## 本文边界与下一步

本文覆盖 vSphere 从零理解到 AIOps 运维的共同主线，没有展开所有版本专属功能、配置上限、API 对象、vSAN 内部机制、NSX、GPU、Kubernetes Supervisor、站点灾备和所有 `esxcli` 命令。原因是这些能力强依赖版本、许可、硬件和产品组合，混在一篇入门文章里反而容易误导生产操作。

下一步建议：

1. 在 VMware Hands-on Labs 或授权实验环境认识 vSphere Client 清单。
2. 画出一台 VM 的 Host、Network、Datastore 和业务关系。
3. 用只读 PowerCLI 导出脱敏 Cluster、Host、VM 和 Datastore 清单。
4. 在实验集群验证 vMotion、维护模式和 DRS 建议。
5. 在隔离环境演练 HA 主机故障，并记录 VM 与应用恢复耗时。
6. 练习用 `esxtop`、Tasks、Events 和四类关键日志定位故障。
7. 用兼容指南为一次模拟升级写预检查和停止条件。
8. 配置远程 Syslog 与采集新鲜度告警。
9. 完成虚拟机备份恢复，而不只验证备份任务成功。
10. 把 vSphere 拓扑、性能、告警、变更、备份和业务 SLO 接入统一 AIOps 看板。
