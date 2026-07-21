# Brocade 6510 光纤交换机深讲

> 学习目标：从零理解 Fibre Channel SAN、Brocade 6510、Fabric OS、端口登录、zoning、FSPF、BB Credit 与双 Fabric，能使用只读命令建立交换机基线，定位链路错误、慢排水设备、拥塞和卷不可见，并能说明 6510 退役迁移方案。

## 官方资料

- [Brocade 6510 Switch Data Sheet](https://docs.broadcom.com/doc/12379855)
- [Brocade 6520/6510/6505 FAQ](https://docs.broadcom.com/doc/12379746)
- [Brocade 6510 End-of-Life Notice](https://docs.broadcom.com/doc/Brocade-6510-EOL-OT)
- [Brocade Fabric OS](https://www.broadcom.com/products/fibre-channel-networking/software/fabric-operating-system)
- [Brocade Fibre Channel Networking](https://www.broadcom.com/products/fibre-channel-networking)
- [Brocade FOS 8.2 FIPS Guide 支持平台表](https://docs.broadcom.com/doc/FOS-820-FIPS-Crypto-UG)
- [Brocade MAPS 官方说明](https://docs.broadcom.com/htmldocs/SANnav111/SANnav111/v24229825.html)
- [Brocade SANnav 官方说明](https://docs.broadcom.com/htmldocs/SANnav111/SANnav111/v24250417.html)

说明：Brocade 6510 已结束官方生命周期。Broadcom EOL Notice 给出的日期是：2019-12-17 发布 EOL，2020-06-17 最后出货，2023-06-17 后不再为该型号提供新 GA FOS，2025-06-17 End of Support。OEM 型号、合同和固件获取渠道可能不同，但这不改变新项目应迁移到受支持平台的结论。生产操作必须依据当前 FOS 命令参考、Release Notes、Fabric OS Support Matrix 和厂商/OEM 合同。

## 官方知识地图

```text
Brocade 6510 与 Fabric OS
  -> 硬件：Gen 5、16G、24/36/48 Ports、SFP、Power/Fan
  -> FC 基础：WWN、N_Port、F_Port、E_Port、Frame、Buffer Credit
  -> Fabric：Domain ID、Principal Switch、FSPF、ISL、Trunk、RSCN
  -> 访问控制：Alias、Zone、Zone Configuration、Effective Configuration
  -> 运维：CLI、Web Tools、MAPS、Flow Vision、SNMP、Syslog、SupportSave
  -> 生命周期：FOS 兼容、升级路径、双 Fabric 迁移、退役验证
```

本文先讲一次 SCSI I/O 如何穿过 FC Fabric，再讲 6510 的配置对象、只读命令、错误计数、AIOps、实验、事故和退役设计。

## 场景开场

数据库主机还能访问磁盘，但延迟间歇升高。存储阵列端口正常，主机多路径显示 Fabric A 的路径抖动，Brocade 交换机端口没有 down，却持续增加 CRC、link reset 和 C3 discard。

这类故障不能只靠“端口是 Online”判断。光模块、光纤、速率协商、Buffer Credit、慢排水设备、ISL 拥塞和 zoning 变化都可能让链路在线但业务质量很差。

## 一句话人话版

```text
Brocade 6510 = 一台 16G Fibre Channel SAN 交换机，把服务器 HBA 和存储阵列端口接入同一个受控 Fabric，并用 zoning 决定哪些主机可以发现哪些存储端口。
```

## 小白可能会问

- **FC 交换机和以太网交换机一样吗？** 都转发流量，但 FC 使用自己的帧、端口类型、登录、名称服务、流控和 Fabric 路由机制，不能把 VLAN、IP 路由概念直接套过来。
- **6510 有双电源，为什么还要两台交换机？** 双电源只保护单机电源故障，不能覆盖交换机主板、FOS、配置、维护和整个 Fabric 故障。生产高可用通常依赖相互独立的 Fabric A/B。
- **端口 Online 就说明正常吗？** 不说明。CRC、loss of sync、C3 discard、credit zero 和慢排水可在端口在线时持续伤害 I/O。
- **zoning 等于 LUN masking 吗？** 不等于。zoning 控制 Initiator 与 Target 是否能在 Fabric 中通信；阵列 masking 决定登录后的主机能看到哪些 LUN，两层都要正确。
- **6510 还能继续用吗？** 存量设备可以按组织风险接受流程维护，但它已在 2025-06-17 EOS。新项目应使用受支持平台，存量应制定双 Fabric 逐步迁移和退役计划。

## 为什么要学

企业存储故障经常跨主机、HBA、FC 交换机和阵列。AIOps 只有把 WWPN、交换机端口、zone、存储端口、LUN 与业务服务映射起来，才能回答“哪条路径坏了、影响哪些主机、是否还有冗余、错误从什么时候开始”。Brocade 6510 虽是旧平台，但其 FOS、zoning、FSPF、BB Credit 和端口排障知识仍能迁移到后续 Brocade SAN。

## 是什么

Brocade 6510 是 Gen 5（16G）Fibre Channel 固定端口交换机。官方资料说明它采用 1U 机箱，可从 24 个激活端口通过 Ports on Demand 以 12 口增量扩展到 36/48 口，支持 2/4/8/10/16 Gbps（具体端口模式和光模块受配置限制），并提供冗余电源/风扇和可选风道方向。

### 硬件边界

| 项目 | 6510 特点 | 运维含义 |
|---|---|---|
| 代际 | Gen 5 Fibre Channel | 最高 16G 代际，不支持把 Gen 6/7 能力直接套用 |
| 端口 | 24 起步，PoD 扩到 36/48 | 物理口存在不代表许可证已激活 |
| 机箱 | 1U | 适合接入/中型 Fabric，但容量设计仍看流量和 ISL |
| 速率 | 2/4/8/10/16G，依端口/光模块/模式 | 自动协商不等于最佳，需核对链路两端和支持矩阵 |
| 电源/风扇 | 冗余，支持风道选型 | PSU 冗余不等于 Fabric 冗余；风道混装会造成热风险 |
| 软件 | Fabric OS | 功能和命令受 FOS、许可证与平台支持限制 |
| 生命周期 | 2025-06-17 EOS | 不应再作为新建生产 Fabric 的首选 |

## 它解决什么问题

1. 让大量服务器 HBA 和存储端口在 FC Fabric 中可靠互联。
2. 通过 Name Server 和 zoning 控制设备发现与通信范围。
3. 通过 FSPF 选择 Fabric 内路径，通过 ISL 扩展多交换机 Fabric。
4. 通过硬件级 Buffer Credit 流控避免接收方缓存溢出。
5. 通过 FOS、MAPS、SNMP、Syslog 和 supportsave 提供健康与排障证据。

它不提供 LUN、RAID、主机多路径或数据复制，也不能凭单台设备实现完整 SAN 高可用。

## 核心原理

### 一次读 I/O 的完整路径

```text
应用发起读取
  -> 操作系统块设备 / 多路径
  -> HBA（Initiator WWPN）
  -> Fabric A 的 Brocade F_Port
  -> Name Server 与 zoning 已允许通信
  -> 本交换机转发，或经 E_Port / ISL / FSPF 到目标交换机
  -> 存储 Target Port（Target WWPN）
  -> 阵列控制器、缓存、LUN、后端介质
  -> 数据沿 FC 路径返回主机
```

Fabric B 应有独立的 HBA 端口、交换机、zoning 和存储端口。主机多路径软件把 A/B 两条或多条路径组合成一个逻辑设备，并在路径故障时切换。

### FC 登录过程

```text
物理光链路建立
  -> FLOGI：设备登录 Fabric，获得 FC Address
  -> PLOGI：Initiator 与 Target 建立端到端登录
  -> PRLI：协商上层协议角色，例如 FCP 的 Initiator/Target
  -> SCSI 命令和数据帧开始传输
```

`WWPN` 是端口的全球唯一名称，`FCID` 是设备在当前 Fabric 中获得的地址。排障时主机报 WWPN，交换机输出可能同时显示 FCID，两者要能对应。

### Fabric 内转发

- **Domain ID：** 每台交换机在 Fabric 中的域编号，必须唯一。
- **Principal Switch：** 参与 Fabric 参数协调，不代表所有业务流量都经过它。
- **FSPF：** Fabric Shortest Path First，FC Fabric 的路径选择协议，根据链路成本计算交换机间路径。
- **ISL：** Inter-Switch Link，交换机之间的链路，端口通常为 E_Port。
- **Trunk：** 将符合条件的多条 ISL 组合以提高带宽和负载分布，依许可证与配置。
- **RSCN：** Registered State Change Notification，Fabric 成员变化通知；频繁 RSCN 可能让主机反复重新发现设备。

### Buffer Credit 与慢排水

FC 使用基于 Credit 的链路流控。发送端只有在有可用接收缓冲信用时才发送帧；接收方处理后通过 `R_RDY` 等机制返还信用。

```text
正常设备及时处理帧
  -> Credit 及时返还
  -> 端口持续发送

慢排水设备处理过慢
  -> Credit 长时间不返还
  -> 上游端口等待
  -> 拥塞沿路径传播
  -> 其他无关业务也可能延迟或丢帧
```

慢排水不一定是交换机坏了，可能来自主机 HBA、驱动、虚拟化栈、存储端口或工作负载。必须结合端口、流和终端证据判断。

## 关键术语拆解

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| Fabric | 一组协同工作的 FC 交换机与连接 | zoning、路由和名称服务的管理边界 |
| WWNN | World Wide Node Name，节点标识 | 标识主机或阵列节点 |
| WWPN | World Wide Port Name，端口标识 | zoning、login 和资产映射的核心键 |
| FCID | Fabric 分配的 24 位地址 | 当前 Fabric 内实际转发地址，可随登录变化 |
| N_Port | 主机或存储设备端口 | FC 终端端口 |
| F_Port | 交换机连接 N_Port 的端口 | 大多数主机/存储接入口状态 |
| E_Port | 交换机之间形成 ISL 的端口 | Fabric 扩展和 FSPF 路径基础 |
| G_Port | 可协商为 F_Port/E_Port 的通用端口 | 端口尚未确定角色时常见 |
| NPIV | 一个物理端口承载多个虚拟 WWPN | 虚拟化和分区环境常见 |
| ISL | 交换机间链路 | 带宽、冗余和拥塞关键点 |
| BB Credit | Buffer-to-Buffer Credit | 控制逐跳发送，信用耗尽会停发 |
| FSPF | FC Fabric 最短路径协议 | 决定跨交换机帧走哪条路径 |
| RSCN | 注册状态变化通知 | 设备/zone 变化会触发重新发现 |
| Alias | WWPN 的可读别名 | 降低 zoning 输入错误，但仍需台账核对 |
| Zone | 允许通信的一组成员 | 控制 Initiator 与 Target 发现范围 |
| Zone Configuration | 一组生效 zone 的配置 | 只有 effective configuration 真正生效 |
| C3 Discard | Class 3 帧因拥塞/资源等被丢弃 | 常与信用、拥塞和慢排水相关 |
| CRC Error | 帧校验错误 | 常指向光模块、光纤、端口或信号质量 |
| MAPS | Monitoring and Alerting Policy Suite | 按阈值持续监控 Fabric、端口和环境 |

## 核心知识树

### WWPN、Name Server 与登录

**是什么：** WWPN 标识端口，Name Server 保存当前登录设备信息。

**为什么需要：** zoning、资产台账和故障影响分析都依赖准确的 WWPN。

**怎么工作：** 设备通过 FLOGI 加入 Fabric，注册到 Name Server，再与允许的对端 PLOGI/PRLI。

**怎么用或观察：** 使用 `nsshow` 查看登录，`nodefind <WWPN>` 定位某个端口，`switchshow` 对应物理端口。

**坏了怎么查：** 若 WWPN 不在 Name Server，先查物理链路、SFP、HBA/阵列端口和 FLOGI；若已登录但卷不可见，再查 zoning 与阵列 masking。

### Zoning

**是什么：** Fabric 层的通信访问控制。

**为什么需要：** 缩小设备发现范围，减少误访问、RSCN 影响和配置混乱。

**怎么工作：** Alias 可映射 WWPN，Zone 包含成员，Zone Configuration 包含多个 Zone；启用后成为 Effective Configuration。

**怎么用或观察：** 只读使用 `cfgshow`、`zoneshow`，并以 `Effective configuration` 为准；推荐单 Initiator zoning，每个 Zone 通常包含一个 Initiator 和所需 Target 端口。

**坏了怎么查：** 比较 defined 与 effective 配置，核对 WWPN、Fabric A/B 命名、Target 端口和变更记录。不要因为 Alias 名称正确就跳过实际 WWPN 验证。

### 双 Fabric 与主机多路径

**是什么：** Fabric A 和 B 是两个互不合并的独立 SAN 故障域，主机多路径同时使用或接管路径。

**为什么需要：** 覆盖交换机、FOS、配置、ISL、光纤和维护故障。

**怎么工作：** 每个 Fabric 有独立 Domain、zoning 和存储路径；主机端 MPIO/DM-Multipath/PowerPath 等按阵列支持策略管理路径。

**怎么用或观察：** 分别验证 A/B 的 WWPN、交换机端口、zone、阵列映射和主机 path state。

**坏了怎么查：** 业务未中断但路径减半时也要开事件。先保持健康 Fabric 稳定，再修故障 Fabric，避免同时变更两边。

### ISL、FSPF 与 Trunk

**是什么：** ISL 连接交换机，FSPF 计算路径，Trunk 把多条兼容 ISL 组合。

**为什么需要：** 多交换机 Fabric 的扩展、冗余和带宽依赖它们。

**怎么工作：** E_Port 形成 Fabric 邻接，FSPF 根据成本选择路径；流量分布与 ASIC、交换机代际、Trunk 条件有关。

**怎么用或观察：** `fabricshow` 看成员，`islshow` 看 ISL，`trunkshow` 看 Trunk，结合端口带宽和 C3 discard 判断拥塞。

**坏了怎么查：** 查 Domain 冲突、分区 Fabric、ISL 速率、光信号、信用、错误计数与过度订阅。单条 ISL 在线不代表容量充足。

### 光模块、光纤与端口错误

**是什么：** SFP 把电信号转换为光信号，光纤连接设备。

**为什么需要：** 物理层轻微劣化会表现为间歇 CRC、loss of sync 或 link reset。

**怎么工作：** 收发光功率和信号质量必须在光模块与链路预算范围内。

**怎么用或观察：** `sfpshow <port>` 查看厂商、速率和数字光诊断；`porterrshow` 看计数变化；`portshow <port>` 看状态与原因。

**坏了怎么查：** 记录基线后做受控清洁、跳纤/模块/端口替换，每次只改变一个变量；修复后确认计数不再增长，而不是只清零计数。

### MAPS、Flow Vision 与慢排水

**是什么：** MAPS 按策略监控端口、Fabric 和环境；Flow Vision 用于流级可见性。功能依 FOS 和许可证。

**为什么需要：** 端口在线但拥塞、信用停顿或慢排水时，需要趋势和流级证据。

**怎么工作：** 规则对指标设置阈值，触发 RASLog、SNMP、邮件或受支持动作；Flow Monitor 可跟踪指定 Initiator/Target 流。

**怎么用或观察：** 先查询有效策略、MAPS dashboard、端口与 Flow 数据，不要直接启用隔离或 toggle 动作。

**坏了怎么查：** 将异常端口与实际 WWPN、业务、上游端口和终端延迟关联，区分链路损坏、过度订阅和 slow-drain device。

### 生命周期与迁移

**是什么：** 6510 已超过 Broadcom EOS，后续安全、缺陷和兼容支持受限。

**为什么需要：** “设备还能亮”不等于满足生产支持、审计和恢复要求。

**怎么工作：** 新型号和 FOS 演进带来新的硬件、监控和兼容矩阵，旧型号停止获得新 GA FOS。

**怎么用或观察：** 建立交换机序列号、OEM、FOS、许可证、SFP、端口、Fabric、合同和业务清单。

**坏了怎么查：** 无厂商支持时先按业务风险升级；不要从非授权来源下载固件；优先迁移到受支持 Fabric，而不是无限延长存量风险。

## Zoning 设计详解

### 推荐命名

```text
Alias:
  a_srv_order01_hba1       # order01 主机 HBA1 的 WWPN
  a_vmax01_fa1             # VMAX01 某个前端 Target WWPN

Zone:
  z_srv_order01_hba1_vmax01_fa1

Configuration:
  cfg_prod_fabric_a
```

### 单 Initiator zoning

```text
Zone A-1: 主机 HBA1 + 存储 Target A1
Zone A-2: 主机 HBA1 + 存储 Target A2

Fabric B 使用主机 HBA2 与另一组存储 Target，配置独立。
```

是否把多个 Target 放在同一个 Zone 取决于组织标准和阵列最佳实践，但不要把多个不相关 Initiator 放进一个大 Zone。变更前必须核对 WWPN、Fabric、阵列端口角色和主机多路径设计。

### 写命令仅作识别

```text
alicreate "a_srv_order01_hba1", "10:00:00:00:00:00:00:01"
zonecreate "z_srv_order01_hba1_vmax01_fa1", "a_srv_order01_hba1;a_vmax01_fa1"
cfgadd "cfg_prod_fabric_a", "z_srv_order01_hba1_vmax01_fa1"
cfgsave
cfgenable "cfg_prod_fabric_a"
```

这些命令会修改生产 zoning，示例 WWPN 也是虚构值。真实执行前必须备份 defined/effective 配置、确认主机与存储双方、评估 RSCN、使用同行复核，并准备恢复原 effective configuration。不要在教程实验中连接生产交换机执行。

## 常用只读命令

```text
version                         # 查看 FOS 版本；判断文档和命令边界
firmwareshow                    # 查看固件分区/版本状态
switchshow                      # 查看交换机、Domain、端口类型、速率和状态
fabricshow                      # 查看 Fabric 成员、Domain 和 Principal
nsshow                          # 查看 Name Server 中已登录设备
nodefind <WWPN>                 # 按 WWPN 定位设备、FCID 和端口
portshow <PORT>                 # 查看单端口状态、类型和链路信息
porterrshow                     # 查看所有端口错误计数
sfpshow <PORT>                  # 查看 SFP 与数字光诊断信息
islshow                         # 查看 ISL 连接
trunkshow                       # 查看 Trunk 状态
cfgshow                         # 查看 defined 与 effective zoning 配置
zoneshow                        # 查看 zone 与成员
licenseshow                     # 查看许可证；输出可能敏感，提交前脱敏
errdump                         # 查看 RASLog 事件
mapsdb --show                   # 查看 MAPS dashboard；语法随 FOS 版本核对
supportshow                     # 汇总大量只读诊断输出，可能较慢且含敏感信息
```

`supportsave` 会采集并传输诊断包，虽然通常不改变数据路径，但会产生管理和传输负载，并包含敏感信息。应按维护流程选择保存位置、检查剩余空间和脱敏要求。

## 命令 / 状态字典

| 名称 | 作用 | 常用写法 | 关键字段 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `switchshow` | 总览交换机和端口 | `switchshow` | switchState、Domain、port、type、speed、state | switch Online，预期端口 Online | 只看 Online，不看错误增长 |
| `fabricshow` | Fabric 成员关系 | `fabricshow` | Domain、WWN、IP、Principal | 成员与设计一致 | 把 Principal 当作数据必经节点 |
| `nsshow` | 登录设备清单 | `nsshow` | FCID、port name、node name | 预期 WWPN 均登录 | 设备登录不等于 zoning/masking 正确 |
| `nodefind` | 定位某 WWPN | `nodefind <WWPN>` | local/remote、port、FCID | 找到唯一预期位置 | WWPN 格式或大小写输入错误 |
| `portshow` | 单端口详情 | `portshow 12` | state、type、speed、flags | 与连接设计一致 | 端口编号与 slot/port 表示混淆 |
| `porterrshow` | 端口错误计数 | `porterrshow` | CRC、enc、disc c3、link fail、loss sync | 基线稳定，不持续增长 | 清零后不记录旧值，丢失证据 |
| `sfpshow` | 光模块诊断 | `sfpshow 12` | vendor、speed、temperature、Tx/Rx power | 在模块支持范围且趋势稳定 | 单次功率正常就排除间歇问题 |
| `cfgshow` | zoning 配置 | `cfgshow` | defined、effective | effective 与变更单一致 | 只检查 defined，忽略真正生效配置 |
| `errdump` | 事件日志 | `errdump` | time、severity、module、message | 无持续关键事件 | 交换机时间/NTP 错误导致时间线错位 |
| `mapsdb` | MAPS 健康与违规 | `mapsdb --show` | category、rule、measure、value | 无未处理 critical violation | 未确认许可证/FOS 就照抄动作命令 |

## 端口计数怎么读

| 计数/现象 | 常见含义 | 优先检查 |
|---|---|---|
| CRC 增长 | 帧校验失败 | SFP、光纤清洁/弯折、端口、速率、对端 |
| encoding error | 物理编码错误 | 光信号质量、模块/光纤兼容性 |
| loss of sync/signal | 链路同步或光信号丢失 | 松动、模块、跳纤、对端重启 |
| link fail | 链路建立失败或反复重建 | 两端速率、SFP、光纤、端口 |
| C3 discard | Class 3 帧被丢弃 | 拥塞、credit、慢排水、ISL 过订阅 |
| credit zero | 暂无可发送信用 | 终端处理慢、长距离 credit 配置、拥塞 |
| link reset | 链路复位 | HBA/存储端口、驱动、物理层、维护事件 |
| port flapping | 端口反复上下线 | 物理链路、设备重启、速率协商、供电 |

计数必须看“增量”和“时间”。设备运行多年累积 10 个 CRC 与 5 分钟内新增 10 个 CRC 风险完全不同。

## 生产高可用架构

```text
                 Fabric A                          Fabric B
主机 HBA1 -> Brocade Switch A -> 存储端口 A   主机 HBA2 -> Brocade Switch B -> 存储端口 B
                 独立电源/机柜/配置                  独立电源/机柜/配置
                          \                        /
                           主机多路径统一呈现 LUN
```

关键规则：

1. A/B Fabric 不互联，不共享交换机，不同时变更。
2. 主机 HBA、SFP、跳纤和存储 Target 分散故障域。
3. zoning 在两个 Fabric 中逻辑对称，但 WWPN 和配置独立。
4. 交换机管理、NTP、DNS、Syslog、SNMP 和 AAA 有冗余。
5. ISL 按峰值与故障后流量设计，避免一条故障后剩余链路过载。
6. 定期做单路径/单 Fabric 切换演练，并验证业务而非只看端口。

### 容量与性能

- 计算物理端口、已激活 PoD、已用端口、保留端口和增长需求。
- 统计每端口 IOPS、吞吐、帧大小、峰值和 95/99 分位。
- 对 ISL 计算正常与单链路故障后的过订阅比例。
- 长距离链路需按距离、速率和帧往返评估 Buffer Credit。
- 评估错误计数、拥塞和慢排水趋势，不只看带宽利用率。

### 安全边界

- 管理网与业务网隔离，限制 SSH/HTTPS/SNMP 来源。
- 使用 AAA、个人账号、最小权限和命令审计。
- 优先使用受支持的安全协议，禁用不需要的旧服务。
- zoning 不是完整数据安全；阵列 masking、主机权限和加密仍要配置。
- supportsave、cfgshow、nsshow 含拓扑和 WWPN，公开前必须脱敏。

## 安装与启动

6510 是专用 FC 交换机，首次部署不是安装一个桌面软件。标准流程包括核对风道与电源、上架接地、连接串口/管理网、设置管理地址与时间、规划唯一 Domain ID、安装受支持 FOS/许可证、接入 SFP/光纤、创建 Fabric、配置 zoning，并在接入业务前保存基线。

个人学习不应把 EOS 设备随意接入生产 Fabric。若有隔离实验设备，先只连接管理口，使用 `version`、`switchshow`、`licenseshow` 和 `firmwareshow` 核对现状；加入现有 Fabric、修改 Domain、合并 zoning database 和启用端口前必须查对应 FOS Administration Guide。

## FOS 升级与 6510 退役

### 升级前门禁

1. 确认交换机确切型号/OEM、当前 FOS、目标 FOS 和合法下载来源。
2. 查 Release Notes、支持矩阵和规定的逐版本升级路径，不能任意跨大版本。
3. 确认 Fabric 中其他交换机、SANnav/Web Tools、光模块和功能兼容。
4. 检查 `switchshow`、`fabricshow`、`porterrshow`、zoning、MAPS 和环境健康。
5. 验证主机在另一 Fabric 上有健康路径，并做业务级切换测试。
6. 保存 configuration、supportsave、许可证和端口基线。
7. 每次只升级一个 Fabric，观察稳定后再处理另一个。

6510 已 EOS，不应把寻找“更高的非支持 FOS”当作长期方案。应以受支持的目标交换机建立新 Fabric，分批迁移主机/存储端口，验证多路径，再退役旧 Fabric。

### 双 Fabric 迁移顺序

1. 盘点 A/B Fabric 的 WWPN、zone、端口、速率和业务依赖。
2. 建立目标 Fabric B，预配置经复核的 zoning。
3. 确认所有业务在 Fabric A 上有足够健康路径。
4. 分批迁移 Fabric B 的主机和存储连接。
5. 验证登录、zoning、阵列 mapping、主机路径和业务 I/O。
6. 稳定观察后，以同样方法迁移 Fabric A。
7. 保存旧配置和回退接线图，完成业务签字后退役 6510。

回滚以“把本批端口接回旧 Fabric 并恢复原配置”为主，前提是旧 Fabric 在观察期保持完整且未同时变更。

## 在 AIOps 中的作用

### 应采集的信号

| 类别 | 信号 | AIOps 用途 |
|---|---|---|
| 资产 | switch WWN、Domain、FOS、license、port、SFP | 构建真实拓扑和生命周期清单 |
| 登录 | WWPN、FCID、switch/port、login time | 将主机/阵列端口映射到物理路径 |
| 端口 | state、speed、type、traffic、utilization | 发现断链、协商错误和热点 |
| 错误 | CRC、encoding、loss、link reset、C3 discard | 异常检测与物理/拥塞分类 |
| Credit | credit zero、latency、congestion | 发现慢排水和背压传播 |
| Fabric | ISL、FSPF path、Domain、RSCN、segmentation | 发现 Fabric 分区和路由变化 |
| Zoning | defined/effective diff、change actor/time | 变更审计和影响分析 |
| 环境 | PSU、fan、temperature | 预测硬件风险 |
| 生命周期 | EOS、合同、备件、目标迁移批次 | 将技术债转成可执行风险计划 |

### 拓扑关联

```text
service
  -> host
  -> HBA WWPN
  -> switch WWN / port / fabric
  -> zone
  -> storage target WWPN
  -> array / LUN
```

发生 CRC 告警时，系统应能立即给出对应业务、是否还有 Fabric B 路径、同端口错误增量和最近变更。自动化可以生成诊断包或工单，不应自动禁用端口或修改 zoning。

## 入门实验：离线端口健康基线

### 实验目标

使用脱敏 CSV 模拟 `porterrshow` 与端口台账，检查端口状态、CRC、C3 discard、loss of sync 和在线路径冗余。

### 前提

- Python 3。
- 新建目录 `brocade-6510-lab`。
- 阈值用于学习，生产应基于计数增量和业务基线。

### 创建 `fabric-ports.csv`

```csv
fabric,switch,port,role,device,state,crc_delta,c3_delta,loss_sync_delta,credit_zero_delta
A,san-a-01,0,F-Port,order01-hba1,Online,0,0,0,0
A,san-a-01,8,F-Port,vmax01-fa1,Online,0,0,0,0
B,san-b-01,0,F-Port,order01-hba2,Online,0,0,0,0
B,san-b-01,8,F-Port,vmax01-fa2,Online,0,0,0,0
```

### 创建 `check_fabric.py`

```python
import csv
import sys

problems = []

with open("fabric-ports.csv", encoding="utf-8", newline="") as file:
    for row in csv.DictReader(file):
        label = f'{row["fabric"]}/{row["switch"]}/{row["port"]}/{row["device"]}'
        if row["state"] != "Online":
            problems.append(f"{label}: state={row['state']}")
        if int(row["crc_delta"]) > 0:
            problems.append(f"{label}: CRC delta={row['crc_delta']}")
        if int(row["c3_delta"]) > 0:
            problems.append(f"{label}: C3 delta={row['c3_delta']}")
        if int(row["loss_sync_delta"]) > 0:
            problems.append(f"{label}: loss_sync delta={row['loss_sync_delta']}")
        if int(row["credit_zero_delta"]) > 100:
            problems.append(
                f"{label}: credit_zero delta={row['credit_zero_delta']}"
            )

if problems:
    print("FABRIC_HEALTH=CRITICAL")
    print("\n".join(problems))
    sys.exit(2)

print("FABRIC_HEALTH=OK")
```

### 运行与验证

```powershell
python .\check_fabric.py
$LASTEXITCODE
```

预期输出：

```text
FABRIC_HEALTH=OK
0
```

## 故障注入实验：模拟坏光链路和慢排水

### 精确步骤

1. 执行 `Copy-Item .\fabric-ports.csv .\fabric-ports.backup.csv`。
2. 将 `A,san-a-01,0` 这一行的 `crc_delta` 改成 `12`，`loss_sync_delta` 改成 `2`。
3. 将 `A,san-a-01,8` 这一行的 `c3_delta` 改成 `37`，`credit_zero_delta` 改成 `900`。
4. 执行 `python .\check_fabric.py`。

预期结果包含：

```text
FABRIC_HEALTH=CRITICAL
A/san-a-01/0/order01-hba1: CRC delta=12
A/san-a-01/0/order01-hba1: loss_sync delta=2
A/san-a-01/8/vmax01-fa1: C3 delta=37
A/san-a-01/8/vmax01-fa1: credit_zero delta=900
```

退出码应为 `2`。第一组证据优先怀疑物理链路；第二组需要调查存储端口处理能力、下游拥塞和慢排水，不能把两组都归因于光纤。

### 修复回归与清理

```powershell
Copy-Item .\fabric-ports.backup.csv .\fabric-ports.csv -Force
python .\check_fabric.py
Remove-Item .\fabric-ports.backup.csv
```

### 如果没有成功

1. 检查 CSV 是否使用英文逗号和原始表头。
2. 检查脚本中引号是否完整。
3. 检查 PowerShell 是否位于实验目录。
4. `credit_zero_delta` 是采样区间增量，不是设备历史累计值。
5. 真实 `supportshow`/`supportsave` 不得直接提交公开仓库。

## 常见故障排查

### 主机看不到 LUN

1. 主机确认 HBA link 和 WWPN。
2. `switchshow` 确认端口 Online/F_Port。
3. `nsshow`/`nodefind` 确认 Initiator 和 Target 已登录。
4. `cfgshow` 确认正确 Zone 位于 effective configuration。
5. 阵列确认 Target 端口与主机 WWPN masking。
6. 主机重扫并查看多路径，记录 A/B Fabric 差异。

### CRC 持续增长

记录端口和对端计数、SFP Tx/Rx、温度、速率和时间线；检查清洁度、弯曲半径和兼容性；按“跳纤 -> SFP -> 端口/对端”的受控顺序替换，每次只改变一个变量；修复后观察增量停止。不要先清零再丢掉证据。

### C3 discard 与延迟

检查 discard 增长端口、credit zero、MAPS/FPI、ISL 利用率和流向。定位慢排水终端或过度订阅链路，比较同一 Target 的其他 Initiator。修复可能是终端驱动/固件、负载调度、增加 ISL 或更换路径，不能机械地换光纤。

### Fabric segmentation

检查 Domain ID、Fabric 参数、FOS 兼容、zoning database 和 ISL 日志。不要为了快速合并而随意覆盖 zoning database；先确定哪一侧配置权威并保存双方配置。

### 端口反复上下线

把 `errdump`、端口状态、光功率、HBA/阵列日志和维护时间线对齐。若主机多路径已通过另一 Fabric 保持服务，优先隔离故障路径并稳定证据，再做物理替换。

## 事故场景：单个慢排水设备拖慢整个 Fabric

**现象：** 多个无关数据库同时延迟，但没有端口 down；一个存储 Target 方向出现大量 credit zero 和 C3 discard。

**证据：**

- MAPS/FPI 违规、端口 credit 和 frame loss。
- Flow Vision 或端口流量中 Initiator/Target 对应关系。
- 上游 ISL 同时段拥塞和 discard。
- 终端 HBA/阵列端口队列、固件、驱动和延迟。
- 最近 zoning、固件、迁移和工作负载变更。

**假设：** 某终端处理帧过慢导致信用停顿；ISL 过订阅；物理错误引发重传/复位；多个问题叠加。

**验证：** 沿受影响流从下游向上游追 credit 和 discard；对比不经过该目标的流；确认故障是否跟随终端、SFP、端口或路径。

**修复：** 在确认主机有健康冗余路径后，受控隔离问题路径/终端，修复驱动、固件、负载或物理链路；必要时按支持策略使用 MAPS 隔离能力。任何端口 toggle/disable 都需审批。

**影响面与回滚：** 通过 zone 和 WWPN 图计算受影响服务；隔离前验证 Fabric B；回滚是恢复原端口/路径并确认错误不再增长，而不是仅把端口改回 Online。

## 生产设计题

**题目：** 将两台 EOS 的 Brocade 6510 迁移到新一代交换机，业务不能整体停机。

答题主线：

1. 盘点 FOS、许可证、SFP、端口、WWPN、zone、ISL、主机多路径和阵列支持矩阵。
2. 目标仍采用独立 Fabric A/B，不把两边合并。
3. 先建立目标 B Fabric，转换并同行审查 zoning，保留旧 A Fabric 承载业务。
4. 按业务小批迁移主机与存储端口，每批验证 login、zone、masking、path、I/O 和错误计数。
5. 观察后迁移 A Fabric，避免 A/B 同时操作。
6. 设计接线、配置和端口级回退，旧设备在验收前保持可回接。
7. 迁移完成后清理旧 zoning、更新 CMDB/监控/Runbook，并安全擦除配置后退役。

## 面试怎么讲

### 30 秒版本

```text
Brocade 6510 是 16G Gen 5 FC 交换机，24 口起步可按 PoD 扩到 48 口，目前已经 EOS。FC 设备通过 FLOGI 加入 Fabric，Name Server 记录 WWPN，zoning 控制 Initiator 与 Target 通信，FSPF 负责跨交换机路径，BB Credit 做逐跳流控。排障时我会从主机多路径、登录、effective zoning、端口错误、SFP、ISL、credit 和终端延迟逐层验证，并始终保护独立 Fabric A/B。
```

### 3 分钟版本要点

1. 讲清 6510 的 16G、24/36/48 口、FOS 和 EOS 边界。
2. 讲 FLOGI/PLOGI/PRLI、WWPN/FCID、F_Port/E_Port。
3. 讲 Alias/Zone/Configuration 和阵列 masking 区别。
4. 讲 FSPF、ISL、Trunk、BB Credit、慢排水与 C3 discard。
5. 讲双 Fabric、多路径、只读基线、安全、升级和迁移。
6. 用慢排水事故展示端到端证据，而不是只背 `porterrshow`。

### 连续追问

**问：端口 Online 为什么业务还慢？** Online 只说明链路建立。继续看错误增量、光功率、credit zero、C3 discard、MAPS/FPI、ISL 和终端队列。

**问：zoning 和 masking 的区别？** zoning 在 Fabric 层决定 Initiator 能否与 Target 通信；masking 在阵列层决定该 Initiator 能看到哪些 LUN。两者缺一不可。

**问：为什么推荐单 Initiator zoning？** 缩小故障和 RSCN 影响，便于审计 WWPN 与业务关系，也降低一个 Initiator 影响其他 Initiator 的范围。

**问：Principal Switch 挂了是否全 Fabric 停止转发？** 不能简单回答会。Principal 负责部分 Fabric 协调，数据面有各交换机和 FSPF 路径；实际影响取决于拓扑、冗余和故障组合。

**问：CRC 和 C3 discard 有什么不同？** CRC 更偏物理帧损坏；C3 discard 常与拥塞、资源、信用和慢排水相关。两者都要看增量和端到端位置。

**问：6510 还能升级到最新 FOS 吗？** 不能把“最新 FOS”理解为当前全系列最新版本。官方已在 2023-06-17 停止为 6510 提供之后 GA 的新 FOS，并在 2025-06-17 EOS；只能按该平台最后受支持路径和合同处理，长期方案是迁移。

## 面试题

1. **主机到阵列的一次 FC I/O 经过哪些步骤？** 从 HBA、FLOGI/PLOGI/PRLI、F_Port、zoning、FSPF/ISL、Target 到阵列 LUN 讲完整路径。
2. **zoning 与 LUN masking 有什么区别？** 分别说明 Fabric 通信控制和阵列卷访问控制，并补充主机多路径。
3. **端口 Online 但 CRC 持续增长怎么办？** 记录增量和光诊断，按跳纤、SFP、端口、对端逐一替换变量，验证错误停止增长。
4. **C3 discard 与慢排水如何关联？** 讲 BB Credit、下游处理慢、背压传播、ISL 拥塞和流级证据，避免把所有 discard 都归因于同一原因。
5. **如何不中断迁移两台 6510？** 坚持独立 Fabric A/B，逐 Fabric、逐批迁移，验证健康冗余路径，保留接线与配置回退。

## 学习检查清单

- [ ] 我能解释 FC 与以太网的主要差异。
- [ ] 我能解释 WWPN、FCID、FLOGI、PLOGI 和 PRLI。
- [ ] 我能解释 F_Port、E_Port、ISL、FSPF、RSCN 和 BB Credit。
- [ ] 我能设计单 Initiator zoning，并区分 zoning 与 LUN masking。
- [ ] 我能说明双电源为什么不等于双 Fabric。
- [ ] 我能读 `switchshow`、`nsshow`、`porterrshow`、`sfpshow` 和 `cfgshow`。
- [ ] 我能区分 CRC、C3 discard、credit zero 和慢排水。
- [ ] 我能完成离线基线与故障注入实验。
- [ ] 我能说明 6510 的 EOS 风险和不中断迁移顺序。

## 学习证据

```text
brocade-6510-lab/
  README.md                    # FC 登录、zoning、FSPF 与双 Fabric 图
  fabric-ports.csv             # 脱敏端口基线
  check_fabric.py              # 错误增量与状态检查器
  zoning-review.md             # 虚构 WWPN 的变更评审示例
  incident-slow-drain.md       # 慢排水证据、假设、修复和回滚
  migration-6510.md            # EOS 风险与双 Fabric 迁移计划
  screenshots/                 # 脱敏实验截图
```

README 中明确注明：未连接生产交换机执行 zoning、端口禁用或固件升级；所有 WWPN、交换机名和业务名均为虚构或脱敏数据。
