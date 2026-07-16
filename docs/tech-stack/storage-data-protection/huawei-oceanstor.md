# 华为 OceanStor 深讲

> 学习目标：从零分清 OceanStor Dorado、OceanStor 混合闪存和 OceanStor Pacific，理解控制器、存储池、LUN、文件系统、主机映射、多路径、快照、远程复制和 HyperMetro；能完成一次不接触生产数据的健康巡检实验，并按数据路径排查容量、性能、链路和容灾故障。

## 官方资料

- [华为 OceanStor 数据存储产品总览](https://e.huawei.com/cn/products/storage)
- [OceanStor Dorado 全闪存存储](https://e.huawei.com/cn/products/storage/all-flash-storage)
- [OceanStor 混合闪存存储](https://e.huawei.com/en/products/storage/hybrid-flash-storage)
- [OceanStor Pacific 分布式存储](https://e.huawei.com/cn/products/storage/scale-out-storage)
- [OceanStor 产品文档入口](https://info.support.huawei.com/enterprise/en/multilingual-document/oceanstor-entry-level-series-pid-262794303)
- [OceanStor Dorado 块业务存储池配置](https://info.support.huawei.com/enterprise/en/doc/EDOC1100214958/cace42ce/creating-a-storage-pool)
- [OceanStor Dorado 块业务 CLI 管理](https://info.support.huawei.com/hedex/api/pages/EDOC1100214752/YEP0509J/16/resources/basic_block_cli_manage.html)
- [OceanStor Dorado 性能指标](https://info.support.huawei.com/enterprise/en/doc/EDOC1100214963/2b357c14/performance-indicators)
- [OceanStor Dorado HyperSnap](https://info.support.huawei.com/enterprise/en/doc/EDOC1100214964/78557007/Working%20Principle.htm)
- [OceanStor Dorado HyperMetro 组网原则](https://info.support.huawei.com/storage/docs/zh-cn/dorado-6.1.0/hypermetro-userguide-file/aa_nas_023.html)
- [OceanStor Dorado SmartQoS CLI](https://info.support.huawei.com/enterprise/en/doc/EDOC1100484984/ba5781f4/configuring-and-managing-smartqos-using-the-cli)
- [OceanStor 主机原生多路径说明](https://info.support.huawei.com/enterprise/en/doc/EDOC1100117892/4e5164f0/os-native-multipathing-software)

说明：OceanStor 的功能、菜单、命令参数、许可和兼容矩阵会随产品型号与版本变化。本文以 OceanStor Dorado V6、OceanStor 6.1.x 和 V700R001 官方资料中的通用概念为主。执行任何操作前，都要在华为支持网站按设备型号、产品版本和目标操作系统重新核对，不能把本文当成生产变更手册。

## 官方知识地图

华为官方资料不是一本从头到尾的单册教程，而是按产品和任务拆分：

```text
产品总览
  -> 产品描述与硬件架构
  -> 安装、初始化与交付
  -> 块 / 文件 / 对象基础业务
  -> 主机连通性与兼容性
  -> 快照、复制、双活、QoS、安全等特性
  -> 性能监控、管理员指南与例行维护
  -> 命令、事件、错误码和部件更换
```

本文按小白更容易理解的顺序学习：

```text
先分清产品族和访问方式
  -> 画出主机到介质的数据路径
  -> 理解池、LUN、文件系统和映射
  -> 理解冗余、多路径和容量
  -> 理解快照、复制、双活与备份边界
  -> 学只读巡检和性能指标
  -> 做离线健康判定实验
  -> 建立 AIOps 告警和排障闭环
```

## 场景开场

周一早上，数据库出现间歇性延迟。存储界面没有红色故障，但值班信息同时出现了三条线索：

```text
主机多路径：8 条路径中只有 4 条在线
存储池：已分配容量达到 82%
LUN：平均响应时间比平时高 3 倍
```

如果只盯着“存储系统 Running Status 是 Normal”，很容易得出“存储没问题”的结论。可真正的问题可能在 FC zoning、iSCSI 网络、前端端口、主机映射、多路径策略、控制器、存储池重构、快照增长或业务 I/O 模型中的任意一层。

学 OceanStor 的关键不是记住一个菜单，而是能把告警放回完整数据路径中验证。

## 一句话人话版

OceanStor 是华为的一组企业存储产品：它把 SSD 或 HDD 组织成可靠容量，通过块、文件或对象接口提供给业务，并用快照、复制、双活、监控和权限机制保护数据服务。

## 小白可能会问

- OceanStor、OceanStor Dorado 和 OceanStor Pacific 是同一个东西吗？
- LUN 已经映射给主机，为什么操作系统仍然看不到磁盘？
- 两个控制器是不是等于数据已经备份了两份？
- 有快照和 HyperMetro 后，还需要备份吗？
- 存储状态是 Normal，为什么数据库仍然很慢？

## 为什么 AIOps 工程师要学 OceanStor

企业里的数据库、虚拟化平台、文件共享和关键应用最终都要落到存储。应用层看到的超时，可能来自存储侧；存储侧看到的高延迟，也可能只是上层突然增加了随机小 I/O。

AIOps 要把以下证据关联起来：

- 指标：IOPS、带宽、响应时间、队列、缓存、端口、池容量和数据缩减率。
- 拓扑：业务、主机、HBA 或网卡、交换机、存储端口、LUN、文件系统、存储池和硬盘。
- 告警：控制器、接口模块、链路、硬盘、池、LUN、复制和双活状态。
- 日志与事件：登录、配置变更、链路变化、故障、恢复和维护窗口。
- 自动化：只读巡检、告警富化、容量预测、变更校验和工单编排。
- 知识库：型号差异、错误码、兼容矩阵、Runbook、历史事件和恢复验证。

不会存储数据路径，AIOps 很容易把“同时发生”误判成“根因”。

## OceanStor 是什么

OceanStor 是华为数据存储品牌下的一组产品，不是单一软件，也不是所有型号共享一套架构。

| 产品族 | 主要定位 | 常见访问方式 | 新手要抓住的边界 |
|---|---|---|---|
| OceanStor Dorado | 面向关键业务的集中式全闪存 | FC、iSCSI、NFS、SMB；新型号还可能支持对象等融合服务 | 本文的主要讲解对象，型号和许可决定具体能力 |
| OceanStor 混合闪存 | 使用 SSD 与 HDD 等介质的集中式企业存储 | 块、文件等 | 成本和容量更灵活，性能与分层设计要结合介质 |
| OceanStor Pacific | 面向海量数据的横向扩展分布式存储 | 文件、对象、HDFS、块等，依型号和服务而定 | 节点式分布式架构，不能直接套用集中式阵列概念 |
| OceanProtect | 备份、恢复和归档产品 | 备份协议与数据保护接口 | 是独立的数据保护产品线，不等于 OceanStor 快照 |
| OceanCyber | 统一安全管理、勒索检测与恢复编排 | 管理接口 | 是安全能力，不替代基础存储和离线备份 |

本文后续说“阵列”时，主要指 OceanStor Dorado 或 OceanStor 集中式存储。OceanStor Pacific 只讲产品边界，不展开其分布式内部机制。

## 它解决什么问题

- 把多块介质组织成可管理、可冗余、可扩展的存储池。
- 向数据库、虚拟化和操作系统提供稳定的块存储。
- 向用户和应用提供 NFS 或 SMB 文件共享。
- 通过双控制器、多路径、RAID、热备空间等机制降低单点故障风险。
- 通过快照、远程复制和 HyperMetro 支撑恢复与业务连续性。
- 通过 QoS、数据缩减、容量告警和性能监控管理资源。
- 通过 DeviceManager、CLI、DME、SNMP Trap 和 Syslog 接入运维体系。

## 先分清块、文件和对象

| 访问方式 | 业务看到什么 | 常见协议 | 典型场景 |
|---|---|---|---|
| 块存储 | 一块裸磁盘，文件系统由主机管理 | FC、iSCSI、NVMe 相关协议，依型号而定 | Oracle、VMware、数据库、虚拟机卷 |
| 文件存储 | 共享目录和文件 | NFS、SMB | 家目录、共享文件、内容服务 |
| 对象存储 | bucket 和 object | S3 兼容接口等，依型号而定 | 非结构化数据、应用对象、归档入口 |

LUN 是块存储里的逻辑单元。文件系统是 NAS 服务里的容量对象。bucket 是对象存储的命名容器。三者不能因为“都能存文件”就混为一谈。

## 核心原理

OceanStor 集中式块存储的主线可以先记成：

```text
应用读写
  -> 主机文件系统或数据库
  -> 主机多路径软件
  -> HBA / NIC
  -> FC fabric 或 IP 网络
  -> 存储前端端口
  -> 控制器、缓存和数据服务
  -> LUN 所属存储池
  -> SSD / HDD 与冗余布局
```

一次写入不能只看“硬盘有没有收到数据”。系统还要处理路径选择、缓存保护、地址映射、RAID 或其他冗余、数据缩减、快照元数据和远程保护关系。

文件业务的数据路径不同：

```text
客户端
  -> NFS / SMB
  -> 文件业务逻辑端口
  -> vStore、共享与文件系统
  -> 存储池
  -> 介质与冗余
```

管理流量必须和业务流量分清。DeviceManager 登录、CLI、SNMP、Syslog 和 DME 管理属于管理面；FC、iSCSI、NFS、SMB 与复制链路属于数据面或保护数据面。

## 关键术语

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| controller | 执行存储 I/O 和管理逻辑的控制器 | 控制器负载、故障与切换会影响数据路径 |
| engine | 高端型号中的控制器与互联组合单元 | 影响扩展、故障域和维护边界 |
| cache | 控制器中的高速读写缓存 | 写策略、保护状态和命中率会影响性能与可用性 |
| storage pool | 从物理介质组织出的逻辑容量池 | LUN、文件系统、容量告警和性能争用都与池相关 |
| LUN | 提供给主机的逻辑块设备 | 数据库和虚拟化通常使用它 |
| initiator | 主机发起存储访问的端点 | FC 用 WWPN，iSCSI 常用 IQN 识别 |
| target | 存储接收主机访问的端点 | 主机通过 target 访问 LUN |
| mapping | 把 LUN 授权给指定主机的关系 | 映射错误会导致看不到盘或数据暴露给错误主机 |
| multipath | 同一 LUN 通过多条物理路径访问 | 提供链路冗余和负载分担 |
| vStore | 隔离租户资源与管理边界的虚拟存储环境 | 多租户文件或块服务中常见 |
| Dtree | 文件系统中的目录树资源与管理边界 | 可用于配额、共享和管理 |
| HyperSnap | 华为存储的时间点快照能力 | 用于快速副本和逻辑误操作恢复入口 |
| HyperReplication | 阵列间远程复制能力 | 用于主备容灾和远端数据副本 |
| HyperMetro | 两端数据集作为一个可访问数据集提供服务的双活能力 | 用于跨阵列或跨站点业务连续性 |
| quorum | 双活故障时决定哪一侧继续服务的仲裁 | 避免两端同时写入形成脑裂 |

## 核心知识树

### 1. 控制器、缓存与 SmartMatrix

**是什么**：控制器处理前端主机请求、缓存、数据服务和后端介质访问。SmartMatrix 是部分 OceanStor 高端产品使用的全互联可靠性架构名称。

**为什么需要**：单个 CPU、控制器或链路不能成为整个存储系统的单点故障。

**怎么工作**：主机 I/O 从前端端口进入控制器，写入通常先进入受保护缓存，再按系统的数据布局写入介质。不同型号的控制器数量、互联、缓存镜像和故障接管机制不同。

**怎么看 / 怎么用**：在 DeviceManager 的硬件拓扑查看控制框、控制器、接口模块、风扇、电源和盘框；用 `show system general` 查看系统总体健康、运行状态、型号与版本。

**坏了怎么查**：先判断是控制器故障、接口模块故障、管理不可达还是业务路径故障，再检查冗余部件是否正常、主机路径是否变化、缓存或 LUN 是否进入保护状态。不要看到单个部件告警就直接拔插。

### 2. 硬盘域、存储池、RAID 与热备空间

**是什么**：物理盘先按产品版本的资源模型组织，再形成存储池；池向上提供 LUN 或文件系统容量。RAID policy 和 hot spare policy 决定冗余与故障重构方式。

**为什么需要**：业务不应该直接管理单块盘，需要统一分配容量、承受介质故障并执行重构。

**怎么工作**：系统把数据和校验信息分布到介质。盘故障后，冗余信息用于恢复数据，重构会消耗介质、控制器和后端带宽。

**怎么看 / 怎么用**：在 DeviceManager 查看池的健康、运行状态、总容量、已用容量、已分配容量、告警阈值和数据缩减；CLI 用 `show storage_pool general` 查询池。

**坏了怎么查**：池降级时先找故障盘、重构状态、剩余冗余和热备空间；容量紧张时区分物理已用、逻辑已分配、快照占用和数据缩减变化。不要靠提高告警阈值解决容量不足。

### 3. LUN、thin provisioning 与 application type

**是什么**：LUN 是映射给主机的逻辑块设备。thin LUN 先声明逻辑上限，再随写入动态消耗池的物理容量。application type 用于匹配常见业务 I/O 模型。

**为什么需要**：业务需要独立、可授权、可扩容的逻辑磁盘，而不是直接操作整个池。

**怎么工作**：主机写入 LUN 的逻辑块地址，阵列把逻辑地址映射到池内实际空间。thin provisioning 允许逻辑分配大于当前物理消耗，但增加超配风险。

**怎么看 / 怎么用**：用 `show lun general` 查看 LUN ID、名称、池、容量、健康和运行状态；在配置前记录业务 owner、容量、application type、保护策略和主机 LUN ID。

**坏了怎么查**：主机看不到 LUN 时沿 initiator、host、mapping、port、network 和 multipath 检查；LUN 写保护时查控制器、缓存保护、温度、盘和池状态。不要只在主机反复 rescan。

### 4. initiator、host、mapping view 与访问隔离

**是什么**：initiator 是主机 FC WWPN 或 iSCSI IQN；host 是阵列里的主机对象；mapping 把 LUN 或 LUN group 授权给 host 或 host group。port group 可限制访问端口。

**为什么需要**：同一套阵列服务很多主机，必须确保正确的主机只看到自己的 LUN。

**怎么工作**：阵列根据 initiator 身份识别主机，再根据 mapping 决定可访问的 LUN 与主机侧编号。交换机 zoning 或 IP 网络还要允许主机到目标端口通信。

**怎么看 / 怎么用**：用 `show initiator initiator_type=FC wwn=...` 查 initiator 在线状态和所属 Host ID，再用 `show host lun host_id=...` 查看映射给该主机的 LUN。

**坏了怎么查**：重点核对 WWPN/IQN 是否抄错、initiator 是否在线、是否绑定错误主机、zoning/VLAN 是否正确、LUN 是否加入正确映射、host LUN ID 是否冲突。映射错误属于数据越权风险，不只是连通性问题。

### 5. FC、iSCSI 与主机多路径

**是什么**：FC 是专用存储网络协议体系，iSCSI 在 IP 网络上传输 SCSI 命令。UltraPath 或操作系统原生 multipath 把同一 LUN 的多条路径合并成一个设备。

**为什么需要**：HBA、网卡、光模块、交换机、线缆、存储端口和控制器中的任何一处都可能故障，单路径无法提供端到端冗余。

**怎么工作**：主机通过两套独立 fabric 或网络连接多个存储端口；多路径软件识别相同 LUN WWN，按策略选择路径，并在故障时切换。

**怎么看 / 怎么用**：Linux 常用 `multipath -ll` 查看 path group、路径状态和 LUN WWID；FC 用 `systool -c fc_host -v` 查看 HBA 状态；iSCSI 用 `iscsiadm -m session` 查看会话。

**坏了怎么查**：从主机路径状态开始，依次核对 HBA/NIC、线缆、光模块、交换机端口、zoning/VLAN、存储前端端口和控制器。路径恢复前不要把剩余健康路径也纳入同一维护窗口。

### 6. 文件系统、vStore、Dtree、共享和逻辑端口

**是什么**：文件系统从池获得容量，NFS/SMB share 把目录提供给客户端；逻辑端口提供业务 IP；vStore 隔离租户；Dtree 可把目录树作为管理与配额边界。

**为什么需要**：文件业务还需要命名空间、认证、共享权限、配额和客户端协议，不是创建一个池就能访问。

**怎么工作**：客户端访问逻辑端口，经过 NFS/SMB 认证与共享规则进入文件系统或 Dtree，数据再落入底层池。

**怎么看 / 怎么用**：用 `show file_system general` 查看文件系统，用 DeviceManager 检查逻辑端口、NFS/SMB 服务、共享、客户端权限、域服务和配额。

**坏了怎么查**：先区分网络不通、逻辑端口异常、认证失败、共享权限错误、配额满、文件系统满和底层池异常。NAS 目录打不开不一定是磁盘故障。

### 7. HyperSnap、克隆与备份

**是什么**：HyperSnap 创建源数据的时间点副本；克隆用于生成可独立使用的数据副本；备份把一致数据复制到独立保护域，并保留恢复目录和策略。

**为什么需要**：逻辑误删除、补丁失败、勒索攻击和灾难恢复需要不同层次的副本。

**怎么工作**：快照通常依赖源存储和元数据，创建快、初始空间开销低；克隆逐步形成独立数据；备份通过应用一致性、保留策略和独立介质提供更强恢复边界。

**怎么看 / 怎么用**：检查快照是否健康、是否按计划创建、保留期、占用空间、源对象和最近一次恢复验证。关键数据库还要确认应用一致性而不只是 crash consistency。

**坏了怎么查**：快照失败时查池容量、源 LUN/文件系统状态、数量限制、计划和许可；恢复失败时查目标空间、映射、应用一致性和操作顺序。

快照不是备份。快照和源阵列共享故障域时，阵列级灾难可能让两者同时不可用。

### 8. HyperReplication 与 HyperMetro

**是什么**：HyperReplication 在阵列间维护远端副本，常用于主备容灾；HyperMetro 让两端数据集作为一个数据集提供服务，实现双活访问与故障切换。

**为什么需要**：单阵列内部冗余不能抵御整机房、整阵列或大范围网络故障。

**怎么工作**：同步复制要在主 I/O 完成前确认远端写入，RPO 可以趋近 0，但对链路时延和稳定性更敏感；异步复制按周期或差异传输，性能影响较小但存在非零 RPO。HyperMetro 还要通过仲裁决定通信中断时哪一端继续服务，避免脑裂。

**怎么看 / 怎么用**：查看 remote device、复制链路、pair、consistency group、同步进度、最近同步时间、HyperMetro domain、preferred site 和 quorum 状态。

**坏了怎么查**：先判断是业务网络、复制网络、仲裁网络、远端阵列还是 pair 状态异常。不要在证据不完整时执行 forcible start、split、switchover 或 secondary readable/writeable 等高风险动作。

### 9. SmartDedupe、SmartCompression 与 SmartQoS

**是什么**：重删消除重复数据块，压缩减少数据编码后的空间，SmartQoS 对 LUN、文件系统、主机等对象实施性能策略。

**为什么需要**：数据缩减提高有效容量，QoS 防止单个业务耗尽共享阵列资源。

**怎么工作**：数据缩减比会随数据类型变化；加密、已压缩和高熵数据通常难以继续缩减。QoS 根据策略限制或保障 IOPS、带宽等资源，具体能力依版本和许可。

**怎么看 / 怎么用**：查看池的数据缩减信息、LUN/文件系统应用类型和 `show smartqos_policy general`；性能判断要同时看 `show performance lun`、主机和池，而不是只看 QoS 名称。

**坏了怎么查**：缩减率下降时先核对数据类型和写入模式；性能异常时确认 QoS 是否命中错误对象、阈值是否过低、多个策略是否冲突。不要把 QoS 当成修复硬件瓶颈的工具。

### 10. DeviceManager、CLI、DME 与告警通知

**是什么**：DeviceManager 是阵列内置管理界面，CLI 用于命令行运维，DME/DME IQ 用于更广范围的管理与运维。SNMP Trap、Syslog、邮件等用于告警和事件通知。

**为什么需要**：人工登录界面只能看到当下，AIOps 需要持续、结构化、可关联的数据。

**怎么工作**：阵列生成健康、性能、告警、事件和审计数据，再通过管理平台或通知通道进入监控系统。华为文档说明 DeviceManager 内部 REST 路径不等于公开的外部开发接口，不能依赖未公开接口做生产采集。

**怎么看 / 怎么用**：用只读或自定义最小权限账号巡检；配置 SNMP Trap、Syslog 或受支持的管理平台；对通知通道做测试并监控最后成功接收时间。

**坏了怎么查**：告警没到监控平台时查阵列是否产生告警、通知规则、严重级别、目标地址、网络、防火墙、证书、时间同步和接收端解析。监控链路本身也要有心跳告警。

## 架构和数据流

### 块存储写入

```text
数据库写入
  -> 操作系统块设备
  -> UltraPath / DM-Multipath
  -> FC HBA 或 iSCSI NIC
  -> 双 fabric / 双 IP 网络
  -> OceanStor 前端端口
  -> 控制器与受保护缓存
  -> LUN 地址映射和数据服务
  -> 存储池冗余布局
  -> SSD / HDD
```

排障时从业务端开始往下走，也可以从故障部件往上找影响对象。最重要的是把 `LUN WWN`、`Host ID`、initiator、前端端口和应用 owner 关联起来。

### 文件存储访问

```text
Linux / Windows 客户端
  -> DNS 和业务 IP
  -> NFS / SMB
  -> OceanStor 逻辑端口
  -> vStore 与认证
  -> share、Dtree、quota
  -> 文件系统
  -> 存储池与介质
```

### HyperMetro 双活

```text
业务主机
  -> 两套独立前端网络
  -> 本端 OceanStor + 远端 OceanStor
  -> HyperMetro 同步与心跳网络
  -> 独立 quorum 网络
  -> 仲裁决定故障后继续服务的一端
```

业务网络、复制网络和仲裁网络不能只在图上分开，生产中还要按对应版本的官方组网要求做端口、交换机和故障域隔离。

## 高可用与数据保护怎么分层

| 层级 | 典型机制 | 主要防什么 | 防不了什么 |
|---|---|---|---|
| 部件级 | 双电源、双控制器、冗余链路、RAID、热备 | 单部件故障 | 误删除、勒索、阵列级灾难 |
| 主机路径级 | 双 HBA/NIC、双交换机、多路径 | 链路或端口故障 | LUN 数据损坏、站点故障 |
| 时间点副本 | HyperSnap、克隆 | 逻辑误操作、快速回滚入口 | 与源同故障域时的阵列灾难 |
| 远程容灾 | HyperReplication | 阵列或站点故障 | 未同步时间窗内的数据，取决于 RPO |
| 双活 | HyperMetro + quorum | 站点或阵列故障下的业务连续性 | 两端同时损坏、逻辑错误同步扩散 |
| 独立备份 | OceanProtect 或其他备份系统 | 长期保留、独立恢复、合规 | 未验证的备份仍可能无法恢复 |

高可用解决“服务继续跑”，备份解决“历史数据能恢复”。两者不能互相替代。

## 安装、初始化与交付

OceanStor 是企业硬件或专用存储系统，不能像普通开源软件一样在个人电脑用一条命令安装。新手需要学会的是交付顺序和验收证据，实际硬件安装、上电、扩容和部件更换必须按对应型号的官方指南与现场安全规范执行。

### 交付前规划

至少准备：

- 型号、版本、序列号、许可和支持合同。
- 机柜 U 位、承重、供电、接地、散热和布线图。
- 管理 IP、维护网络、DNS、NTP 和告警接收端。
- FC WWPN、zoning 设计，或 iSCSI/NAS 的 VLAN、MTU、路由和网关设计。
- 主机型号、操作系统、HBA/NIC、驱动、固件和多路径软件版本。
- 华为 Storage Interoperability Navigator 的兼容性核对结果。
- 池、LUN、文件系统、应用类型、容量、快照、复制和 owner 设计单。
- 回退方案、验收项和责任人。

### 初始化主线

```text
安装机柜与部件并检查线缆
  -> 按型号要求上电
  -> 配置管理地址和管理员安全策略
  -> 配置时间、NTP、DNS 与证书
  -> 导入和核对 license
  -> 创建或确认存储池
  -> 配置告警通知并发送测试消息
  -> 创建主机、initiator、LUN / 文件系统与映射
  -> 主机侧发现设备并验证多路径
  -> 做性能基线、故障切换和恢复验证
  -> 保存脱敏验收证据
```

初始化完成不等于业务可上线。至少要验证双 fabric 或双网络、多路径数量、LUN WWN、文件共享权限、性能基线、告警到达、快照恢复和计划内故障切换。

## 配置详解：先写设计单

下面是一个块存储设计单示例，不是可以直接导入阵列的配置文件：

```yaml
application: order-db             # 业务名称，用于把存储对象关联到应用负责人
owner: dba-team                    # 发生容量或性能告警时的责任团队
protocol: FC                       # 主机访问协议；还可能是 iSCSI
host_name: order-db-01             # 阵列中的 host 名称，应与资产台账一致
initiators:                        # 主机 HBA 的 WWPN，必须从主机和交换机双向核对
  - "21000024ff123401"
  - "21000024ff123402"
storage_pool: pool_prod_ssd        # LUN 使用的存储池
lun_name: lun_order_db_data_01     # LUN 名称，包含业务、用途和序号
logical_capacity_gib: 2048         # LUN 逻辑上限，不等于立即占用 2 TiB 物理空间
allocation: thin                   # 随实际写入分配空间，需要持续监控池超配
application_type: Oracle_OLTP      # 要与真实 I/O 模型和当前版本支持项匹配
snapshot_policy: hourly-24_daily-7 # 快照频率与保留意图，正式名称由现场规范决定
replication: none                  # 未配置远程复制，不能把它误报成已有容灾
```

| 字段 | 要回答的问题 | 常见错误 |
|---|---|---|
| `application` / `owner` | 谁使用、谁响应告警 | 只写技术对象名，出事找不到业务人 |
| `protocol` | 主机如何访问 | FC 和 iSCSI 的网络、标识与排障方法混用 |
| `initiators` | 哪些发起端有权访问 | WWPN/IQN 抄错或绑定到错误主机 |
| `storage_pool` | 容量和性能来自哪里 | 只看池剩余量，不看介质、负载和保护关系 |
| `logical_capacity_gib` | 业务最大可见容量 | 把逻辑分配当成真实物理占用 |
| `application_type` | I/O 优化假设是什么 | 预设场景与真实 OLTP/OLAP/VDI 负载不符 |
| `snapshot_policy` | 恢复点和保留期是什么 | 有策略但从未验证恢复 |
| `replication` | 是否有远端副本与 RPO | 把本地快照写成异地容灾 |

## 常用只读命令

不同型号和版本支持的 CLI 命令可能不同。先用只读账号，并在对应版本的命令参考中确认参数。

```text
show system general                       查看系统名称、健康、运行状态、型号和版本
show storage_pool general                 查看存储池状态与容量
show lun general                          查看 LUN 清单、容量和状态
show file_system general                  查看文件系统清单与状态
show initiator initiator_type=FC wwn=...  查看 FC initiator 在线状态和所属主机
show host lun host_id=...                 查看某个主机已映射的 LUN
show port general port_id=...             查看指定端口状态
show performance lun                      查看 LUN 性能数据
show performance host                     查看主机维度性能数据
show performance file_system              查看文件系统性能数据
show smartqos_policy general               查看 SmartQoS 策略
show license                               查看许可信息
```

先执行 `show system general`。只有 `Health Status` 和 `Running Status` 符合预期，才继续分析其他对象；但系统总体正常不能替代路径、性能和业务验证。

## 命令字典

| 命令 | 作用 | 关键字段 / 参数 | 正常结果 | AIOps 场景 | 常见坑 |
|---|---|---|---|---|---|
| `show system general` | 查看系统总览 | Health、Running、Model、Version、Time | 健康与运行状态正常，时间准确 | 巡检入口、资产与版本关联 | 总体正常不代表所有 LUN 和路径正常 |
| `show storage_pool general` | 查看池 | Pool ID、容量、健康、运行状态 | 池在线且有恢复余量 | 容量预测、热点和降级告警 | 混淆逻辑分配与物理使用 |
| `show lun general` | 查看 LUN | LUN ID、Name、Pool ID、Capacity、Status | 目标 LUN 健康在线 | LUN 资产、容量和性能关联 | 只用名称匹配，忽略 WWN |
| `show file_system general` | 查看文件系统 | ID、Name、Capacity、Health | 文件系统健康在线 | NAS 容量和可用性 | 忽略共享、逻辑端口和认证层 |
| `show initiator ...` | 查 initiator | WWN/IQN、Online、Host ID | initiator 在线并属于正确主机 | 主机不可见 LUN 排障 | WWPN 与端口 WWN、节点 WWN 混淆 |
| `show host lun host_id=...` | 查主机映射 | Host ID、LUN ID、LUN Name | 目标 LUN 出现在正确主机下 | 映射审计和告警富化 | 只看阵列映射，不看主机发现 |
| `show port general port_id=...` | 查端口 | port ID、running、link、speed | 端口和链路符合设计 | 端口故障、链路降速 | 端口 up 不代表 zoning/VLAN 正确 |
| `show performance lun` | 查 LUN 性能 | IOPS、带宽、响应时间等 | 与业务基线匹配 | 异常检测与 noisy neighbor 分析 | 单时刻数值没有趋势意义 |
| `show performance host` | 查 host 性能 | 主机 I/O 负载 | 与主机侧指标大致对应 | 主机到 LUN 影响分析 | Host 对象命名与 CMDB 不一致 |
| `show performance file_system` | 查文件系统性能 | IOPS、带宽、响应时间 | 与 NAS 基线匹配 | 文件业务异常检测 | 只看文件系统，不看客户端和网络 |
| `show smartqos_policy general` | 查 QoS | 策略、状态、目标对象 | 策略对象和阈值符合设计 | 解释性能限制和资源保障 | 误把 QoS 限制当硬件性能故障 |
| `show license` | 查许可 | feature、status、expiration | 所需特性有效 | 变更前特性门禁 | 有菜单不等于有有效许可 |

## 主机侧常用检查

```bash
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS # 查看主机识别到的块设备，确认容量和挂载关系
multipath -ll                             # 查看每个 LUN WWID、path group 和路径状态
lsscsi -t                                 # 查看 SCSI 设备及其传输路径
systool -c fc_host -v                     # FC 场景查看 HBA 端口状态、WWPN 和速率
iscsiadm -m session                       # iSCSI 场景查看当前登录会话
```

不要在不清楚设备用途时执行格式化、分区、文件系统修复或删除 multipath map。先用 LUN WWN 把主机设备和阵列对象对上。

## 性能和容量指标怎么读

### IOPS、带宽与响应时间

- IOPS 是每秒完成的 I/O 次数。随机小 I/O 场景常先看 IOPS。
- 带宽是每秒传输的数据量。顺序大 I/O 场景常先看 MB/s 或 GB/s。
- response time 或 latency 是一次 I/O 从发起到完成的时间，必须与业务 SLO 和历史基线比较。
- 平均 I/O 大小大致等于 `带宽 / IOPS`，它能帮助判断负载是小 I/O 还是大 I/O。
- 读写比例、随机度、并发深度和命中率会改变相同 IOPS 下的系统压力。

不能因为阵列宣传规格很高，就把所有延迟都归因于“存储性能不够”。先确认测试模型、端口、路径、业务并发、快照、重构、复制和主机队列是否一致。

### 容量

至少同时看：

- raw capacity：物理介质原始容量。
- usable capacity：扣除冗余等开销后可用容量。
- allocated capacity：已经分配给 LUN 或文件系统的逻辑容量。
- used capacity：真实写入并占用的容量。
- snapshot capacity：快照变化数据或元数据占用。
- data reduction ratio：重删压缩带来的逻辑/物理比值。
- subscription ratio：thin provisioning 的逻辑承诺与物理容量关系。

数据缩减率不是常数。备份文件、加密数据、压缩包和数据库压缩数据可能几乎无法再次缩减，容量预测必须使用实际业务趋势。

## OceanStor 在 AIOps 中的位置

### 建议的拓扑模型

```text
service
  -> application instance
  -> host / VM / cluster
  -> initiator
  -> SAN zone / VLAN / IP route
  -> storage front-end port
  -> LUN / file system / share
  -> storage pool
  -> controller / enclosure / drive
  -> snapshot / replication / HyperMetro relationship
```

只有建立拓扑，AIOps 才能回答“端口故障影响了哪些业务”“最满的池承载哪些数据库”“某次变更后哪些 LUN 延迟升高”。

### 建议采集的数据

| 层级 | 指标或状态 | 用途 |
|---|---|---|
| 系统 | health、running、version、time | 总体健康、版本和时间一致性 |
| 控制器 | CPU、缓存、状态、接管事件 | 判断控制面与数据服务压力 |
| 前端端口 | link、speed、IOPS、bandwidth、error | 定位路径和链路瓶颈 |
| host / initiator | online、path count、IOPS、latency | 关联主机和存储视角 |
| LUN / 文件系统 | health、capacity、IOPS、bandwidth、latency | 业务级容量和性能 |
| pool | used、allocated、subscription、reduction、reconstruction | 容量预测与重构风险 |
| drive / enclosure | health、media error、temperature、rebuild | 介质和硬件故障 |
| 保护关系 | pair status、sync progress、lag、RPO、quorum | 容灾就绪度 |
| 管理链路 | last trap、last syslog、collection success | 发现监控盲区 |

### 告警治理建议

| 告警 | 为什么重要 | 富化字段 | 降噪方式 |
|---|---|---|---|
| 系统或控制器异常 | 可能影响多个业务对象 | 型号、版本、冗余状态、受影响池/LUN | 合并同一根部件产生的派生告警 |
| 前端端口或路径减少 | 冗余下降，后续故障可能中断业务 | host、initiator、fabric、port、LUN | 按维护窗口和剩余健康路径判断级别 |
| pool 容量高 | 可能导致分配、写入、快照或重构失败 | 增长率、预计耗尽时间、owner、保护对象 | 采用趋势和多阈值，不只看单点百分比 |
| LUN / 文件系统延迟高 | 直接影响应用 | IOPS、带宽、I/O size、读写比、路径、QoS | 用业务基线和持续时间过滤突刺 |
| 重构或盘故障 | 冗余降低且后台负载增加 | 盘框、pool、进度、剩余冗余、业务延迟 | 区分单盘预警、已故障和重构停滞 |
| 复制不同步 | RPO 扩大 | pair、CG、last sync、lag、link、remote site | 按业务 RPO 和持续时间升级 |
| HyperMetro 异常 | 可能影响双活访问和仲裁 | domain、preferred site、quorum、pair、network | 关联复制与仲裁网络的共同故障 |
| 采集或通知中断 | 形成观测盲区 | last success、target、channel、certificate | 单独监控数据新鲜度 |

优先通过受支持的 DME、SNMP Trap、Syslog 和正式数据接口接入。不要抓取 DeviceManager 页面，也不要依赖未公开的内部 REST 接口。

### 自动化边界

适合自动化的低风险动作：

- 收集只读系统、池、LUN、文件系统、端口和性能信息。
- 把 LUN WWN、主机、owner、CMDB 和最近变更补到告警。
- 计算路径在线率、容量增长率、预计耗尽时间和复制延迟。
- 生成巡检报告、工单和人工审批建议。
- 在维护窗口结束后验证告警通知是否恢复。

不应由模型根据单条告警直接执行的动作：

- 删除 LUN、文件系统、快照、映射、池或复制关系。
- 初始化、格式化、扩容文件系统或改变主机 LUN ID。
- 强制启动 HyperMetro、切换站点、分裂 pair 或解除仲裁。
- 更改 RAID、QoS、数据缩减、缓存、端口或兼容性相关参数。
- 清除硬盘、拔插部件、升级控制器或修改生产 zoning。

## 入门实验：离线判断 OceanStor 健康样本

### 实验目标

在没有真实阵列的电脑上，用 PowerShell 读取一份脱敏健康样本，生成 `OK`、`WARN`、`CRITICAL` 结论，理解“数值越高越危险”和“路径在线率越低越危险”是两类不同规则。

### 实验步骤

1. 新建目录并进入：

```powershell
New-Item -ItemType Directory -Force oceanstor-lab | Out-Null # 创建实验目录，已存在时不报错
Set-Location oceanstor-lab                                  # 后续文件都放在实验目录
```

2. 创建脱敏样本：

```powershell
@'
metric,value,warn,critical,direction,unit
pool_used_pct,82,80,90,higher,percent
lun_latency_ms,3.6,5,10,higher,millisecond
path_online_pct,75,100,50,lower,percent
replication_lag_s,0,5,30,higher,second
'@ | Set-Content oceanstor-health.csv -Encoding utf8 # 保存四项健康指标，不含真实设备信息
```

`direction=higher` 表示数值越高越危险；`direction=lower` 表示数值越低越危险。路径在线率的 warning 门槛是 100%，意味着任何路径损失都要调查；critical 门槛 50% 只是实验规则，生产级别必须结合剩余故障域和业务等级设计。

3. 创建判定脚本 `check-oceanstor.ps1`：

```powershell
$rows = Import-Csv .\oceanstor-health.csv # 读取健康样本，每一行变成一个 PowerShell 对象

$results = foreach ($row in $rows) {
    $value = [double]$row.value       # 把 CSV 文本转换成可比较的数字
    $warn = [double]$row.warn         # 读取 warning 阈值
    $critical = [double]$row.critical # 读取 critical 阈值

    if ($row.direction -eq 'higher') {
        $status = if ($value -ge $critical) { 'CRITICAL' } elseif ($value -ge $warn) { 'WARN' } else { 'OK' }
    } else {
        $status = if ($value -le $critical) { 'CRITICAL' } elseif ($value -lt $warn) { 'WARN' } else { 'OK' }
    }

    [pscustomobject]@{ Metric = $row.metric; Value = $value; Unit = $row.unit; Status = $status }
}

$results | Format-Table -AutoSize # 输出适合值班人员阅读的健康表

if ($results.Status -contains 'CRITICAL') { exit 2 } # critical 时返回 2，便于监控或 CI 判断失败
if ($results.Status -contains 'WARN') { exit 1 }     # 只有 warning 时返回 1
exit 0                                               # 全部正常时返回 0
```

4. 运行脚本并查看退出码：

```powershell
powershell -ExecutionPolicy Bypass -File .\check-oceanstor.ps1 # 执行离线健康判断
$LASTEXITCODE                                                # 查看脚本退出码
```

### 预期结果

```text
Metric              Value Unit        Status
------              ----- ----        ------
pool_used_pct        82   percent     WARN
lun_latency_ms        3.6 millisecond OK
path_online_pct      75   percent     WARN
replication_lag_s     0   second      OK
```

退出码应为 `1`，因为存在 warning，但没有 critical。

### 验证结果

把 `pool_used_pct` 改为 `92` 再运行，状态应变成 `CRITICAL`，退出码应为 `2`。把 `path_online_pct` 改为 `100`，路径状态应恢复为 `OK`。

实验真正要学的是：同一阈值引擎必须知道指标方向、单位、对象、业务基线和持续时间，不能对所有指标统一使用“超过阈值就报警”。

### 如果没有成功

按顺序检查：

1. 当前目录是否同时有 `oceanstor-health.csv` 和 `check-oceanstor.ps1`。
2. CSV 第一行字段名是否完整，逗号是否是英文逗号。
3. PowerShell 执行策略是否阻止脚本；实验命令已用 `-ExecutionPolicy Bypass` 仅对本次进程生效。
4. 是否把数字写成带 `%` 或 `ms` 的文本；单位要放在 `unit` 列。
5. `$LASTEXITCODE` 是否在脚本执行后立即查看。

有真实设备时，可以用只读账号把 `show system general`、`show storage_pool general`、`show lun general` 和性能数据脱敏后转换为同样的健康模型。不要把阵列地址、序列号、WWN、主机名、业务 LUN 名或账号信息提交到公开仓库。

## 常见故障排查

### 主机看不到新 LUN

按链路排查：

1. LUN 是否健康，是否属于预期 pool。
2. LUN 是否映射给正确 host 或 host group。
3. initiator WWPN/IQN 是否正确、在线并属于该 host。
4. FC 双 fabric zoning 或 iSCSI VLAN、IP、MTU、路由是否正确。
5. 存储前端端口和主机 HBA/NIC 是否在线。
6. 主机是否完成 rescan 或 iSCSI 登录。
7. `multipath -ll` 是否识别出相同 WWID 的多条路径。
8. 新设备是否被 LVM、文件系统或集群按正确流程接管。

不要先格式化“看起来像新盘”的设备。必须先比对阵列 LUN WWN、主机 WWID、容量和变更单。

### 多路径从冗余变成单路径

先确认剩余路径是否承载全部流量、业务延迟是否上升，再定位丢失路径所属的 HBA/NIC、fabric、交换机端口、线缆、光模块、存储端口和控制器。单路径仍能读写不代表可以延期处理，因为下一次同故障域事件可能直接中断业务。

### 业务延迟突然升高

对齐同一时间窗口检查：

- 应用延迟、数据库 wait event 和主机 I/O wait。
- LUN、host、front-end port 的 IOPS、带宽和响应时间。
- I/O 大小、读写比例、随机度与队列深度是否变化。
- 多路径是否减少或负载是否偏到单个端口。
- 池是否在重构、迁移、快照删除、复制同步或数据回收。
- 控制器、缓存、端口、盘框和介质是否有告警。
- SmartQoS 是否限制了错误对象。
- 最近是否发生扩容、升级、zoning、映射或业务发布。

阵列平均延迟正常但应用慢时，继续查主机队列、文件系统、数据库锁、网络和应用；不要为了“证明是存储”只截取一个峰值。

### 存储池容量紧张

先区分 used、allocated、snapshot、reduction 和 subscription。再找增长最快的 LUN/文件系统、快照保留、未回收空间和异常写入。扩容前确认型号、许可、盘规格、兼容性和故障域；删除数据前确认 owner、保留政策和备份。

### LUN 进入写保护

写保护通常是保护数据的结果，不应绕过。检查 LUN 状态、控制器和缓存保护、池和盘、温度、电池或备电、系统是否单控运行，以及对应告警的官方处理建议。先恢复冗余和安全写入条件，再按华为支持流程解除影响。

### 硬盘故障或重构长期不结束

确认故障盘位置、池冗余、热备空间、重构进度、其他介质错误和业务性能。更换部件前必须确认另一冗余部件正常、备件匹配、维护人员资质和现场步骤。不要根据槽位照片猜盘。

### HyperReplication 不同步

检查本端与远端阵列健康、remote device、复制链路、pair/CG 状态、上次成功同步、待同步数据量、带宽、时延、丢包、容量和许可。异步复制延迟要与业务 RPO 比较；同步复制异常还要关注对前台写入的影响。

### HyperMetro 异常或站点通信中断

分别检查业务前端网络、HyperMetro 复制网络和 quorum 网络。确认 preferred site、domain、pair、仲裁连接和两端数据状态。先判断当前哪一端对外服务，再执行任何恢复动作。强制启动错误一端可能造成双写分叉或覆盖正确数据，必须由经过审批的 Runbook 和厂商支持指导。

### NFS/SMB 共享无法访问

按顺序查 DNS、客户端到逻辑端口网络、逻辑端口状态、vStore、NFS/SMB 服务、共享路径、客户端白名单或域认证、Dtree/quota、文件系统容量和底层 pool。能 ping 管理 IP 不能证明业务逻辑端口可用。

### 告警没有进入监控平台

先在 DeviceManager 确认告警真实存在，再查通知严重级别、事件开关、SNMP Trap/Syslog/邮件目标、网络、防火墙、证书、时间、接收端服务和解析规则。维护窗口结束后要验证屏蔽已经自动或人工解除。

## 变更、升级与安全

生产变更前至少完成：

- 按准确型号和当前版本获取升级路径、补丁说明与兼容矩阵。
- 核对控制器、盘框、接口模块、硬盘、HBA、驱动、交换机和多路径版本。
- 确认系统、池、LUN、文件系统、复制、双活和所有冗余路径健康。
- 检查容量和性能有足够的重构、迁移与升级余量。
- 导出并脱敏保存配置、拓扑、告警、性能基线和变更前截图。
- 验证备份可恢复，明确快照不等于独立备份。
- 写清停止条件、业务验证、回退或厂商支持路径。
- 避免把两套 fabric、两路供电、双活两端或仲裁同时纳入同一维护窗口。
- 变更后验证业务 I/O、多路径、告警通知、性能、复制 RPO 和 HyperMetro 状态。

账号要遵循最小权限；管理网络要隔离；默认口令、弱 TLS、过期证书和共享管理员账号必须治理。公开学习证据中不能包含真实管理地址、SN、WWN、IQN、主机名、LUN 名、拓扑、license、日志包或客户数据。

## 面试怎么讲

OceanStor 是华为企业存储产品族。我会先区分集中式 OceanStor Dorado、混合闪存阵列和分布式 OceanStor Pacific。以 Dorado 块存储为例，应用 I/O 从主机多路径经过 FC 或 iSCSI 网络进入存储前端端口，由控制器和受保护缓存处理，再通过 LUN 到存储池和介质。LUN 要经过 initiator、host 和 mapping 授权，端到端高可用还依赖双 HBA、双交换机和多路径。HyperSnap 提供时间点副本，HyperReplication 提供远端主备副本，HyperMetro 通过同步和仲裁实现双活，但这些都不能替代独立备份。排障时我会沿应用、主机、路径、网络、端口、LUN、池、控制器和介质逐层验证，并把容量、性能、告警、保护关系和最近变更关联到 AIOps 拓扑。

## 学习检查清单

- [ ] 我能分清 OceanStor Dorado、OceanStor 混合闪存、OceanStor Pacific 和 OceanProtect。
- [ ] 我能解释块、文件和对象访问方式的差异。
- [ ] 我能画出主机到 LUN 再到存储池和介质的数据路径。
- [ ] 我能解释 controller、cache、storage pool、LUN 和 initiator。
- [ ] 我能用 WWPN/IQN、Host ID、LUN WWN 和 mapping 对齐主机与阵列。
- [ ] 我能解释 FC/iSCSI、多路径和双 fabric 为什么缺一不可。
- [ ] 我能区分 used、allocated、snapshot、reduction 和 subscription。
- [ ] 我能解释 HyperSnap、HyperReplication、HyperMetro 与备份的边界。
- [ ] 我能说明 quorum 为什么能避免双活脑裂。
- [ ] 我能完成离线健康样本实验并理解指标方向。
- [ ] 我能排查主机看不到 LUN、路径减少、池容量高和延迟升高。
- [ ] 我能把 OceanStor 指标、告警、拓扑、日志和变更接入 AIOps。

## 面试题

1. OceanStor Dorado、OceanStor 混合闪存和 OceanStor Pacific 有什么区别？
2. 块存储、文件存储和对象存储分别向业务暴露什么？
3. 一次数据库写入 OceanStor LUN 的数据路径是什么？
4. controller、cache、storage pool 和 LUN 分别负责什么？
5. thin LUN 为什么会产生超配风险？
6. initiator、host、LUN group 和 mapping view 是什么关系？
7. LUN 已映射但 Linux 看不到盘，应如何排查？
8. 为什么双控制器不能替代主机多路径？
9. FC zoning 和阵列 mapping 分别控制哪一层访问？
10. 如何用 LUN WWN 对齐阵列对象和 Linux multipath 设备？
11. IOPS、带宽、响应时间和 I/O 大小是什么关系？
12. 为什么总体 Health Status 为 Normal，应用仍可能很慢？
13. used capacity 和 allocated capacity 有什么区别？
14. 数据缩减率为什么不能直接用于未来容量承诺？
15. HyperSnap、HyperReplication、HyperMetro 和备份如何分工？
16. 同步复制与异步复制如何影响 RPO、性能和网络要求？
17. HyperMetro 为什么需要 quorum 或明确的仲裁策略？
18. 双活通信中断时为什么不能随意 forcible start？
19. 如何设计 OceanStor 的 AIOps 拓扑和告警富化？
20. 哪些 OceanStor 操作适合自动化，哪些必须人工审批？

## 学习证据

学习完成后，建议提交：

- `labs/huawei-oceanstor/product-map.md`：Dorado、混合闪存、Pacific、OceanProtect 边界图。
- `labs/huawei-oceanstor/io-path.md`：应用到 LUN/文件系统再到 pool 的数据流。
- `labs/huawei-oceanstor/design-sanitized.yaml`：不含真实地址和标识的设计单。
- `labs/huawei-oceanstor/oceanstor-health.csv`：本文的脱敏健康样本。
- `labs/huawei-oceanstor/check-oceanstor.ps1`：离线健康判定脚本。
- `labs/huawei-oceanstor/health-report.txt`：脚本输出和退出码。
- `labs/huawei-oceanstor/multipath-sanitized.txt`：脱敏后的多路径示例。
- `labs/huawei-oceanstor/runbook-lun-not-visible.md`：主机看不到 LUN 的 Runbook。
- `labs/huawei-oceanstor/runbook-hypermetro.md`：只写检查、升级和审批边界，不写未经验证的强制动作。
- `labs/huawei-oceanstor/recovery-test.md`：快照或备份恢复验证记录。

公开仓库不要提交真实设备配置、账号、密码、管理地址、序列号、WWN、IQN、主机名、业务对象名、license、日志包、支持包、客户数据或完整灾备拓扑。

## 本文边界与下一步

本文覆盖 OceanStor 集中式存储从零到 AIOps 运维的主线，但不能代替按型号、版本、许可、协议和操作系统拆分的官方交付文档。

下一步建议：

1. 在授权实验阵列上用只读账号完成系统、池、LUN、文件系统和端口巡检。
2. 用两台 Linux 虚拟机学习 FC/iSCSI 发现、LUN WWN 对齐和 DM-Multipath。
3. 深入 OceanStor Dorado 块业务、文件业务和 Host Connectivity Guide。
4. 在非生产环境验证 HyperSnap 创建、挂载、恢复和清理流程。
5. 学习 HyperReplication 的一致性组、RPO 和故障切换 Runbook。
6. 用隔离实验环境理解 HyperMetro 的业务、复制、仲裁三张网络。
7. 单独学习 OceanStor Pacific 的分布式节点、文件、对象、HDFS 和块服务架构。
8. 把 SNMP Trap、Syslog、性能数据、CMDB、变更和业务 SLO 接入统一 AIOps 看板。
