# 腾讯专有云 TCE 全栈技术地图

> 学习目标：从零分清 Tencent TCE、TCS、TStack 和公有云；掌握 TCE 的必修能力域、地域/AZ/租户/资源模型、IaaS 与 PaaS 请求链、版本/BOM/License、交付升级、安全容灾和 AIOps 排障，并能按现场采购清单选择后续专题。

## 官方资料

- [Tencent TCE 官方概览](https://intl.cloud.tencent.com/zh/solutions/tce?lang=zh)
- [腾讯专有云产品形态总览](https://cloud.tencent.com/solution/privatecloud)
- [TCE 兼容性指南](https://cloud.tencent.com/solution/tce/compatibilityguide)
- [TCE 私有云文档中心](https://cloud.tencent.com/privatecloud/document?folder_id=0&solution=%E8%85%BE%E8%AE%AF%E4%B8%93%E6%9C%89%E4%BA%91%E4%BC%81%E4%B8%9A%E7%89%88+TCE&version=3.10.11)
- [TCE Terraform Provider 官方仓库](https://github.com/TencentCloud/terraform-provider-tencentcloudenterprise)
- [TKE 本地化与 TCE 形态说明](https://cloud.tencent.com/document/product/457/119577)
- [腾讯云可观测平台](https://cloud.tencent.com/document/product/248/13467)
- [操作审计 CloudAudit](https://cloud.tencent.com/product/cloudaudit)

> 版本快照：2026-08-31。公开兼容性资料出现 3.10.0、3.10.11、3.10.12，只能说明相关兼容项或资料存在，不能证明完整历史、当前最新版或现场版本。生产结论以 TCE 控制台、BOM、Hotfix/构建号、升级报告、原厂工单和维保合同为准。

## “相关的所有技术栈”到底指什么

TCE 是全栈私有化云平台，不是一个进程，也不是固定安装所有腾讯云服务。本路线把“所有”定义为：

### 平台必修域

1. 服务器、CPU、内存、网卡、HBA/RAID、交换与带外管理。
2. DCOS/云底座与服务器生命周期。
3. CVM 计算、镜像、规格、配额和调度。
4. VPC、子网、路由、安全组、ACL、CLB 和互联。
5. CBS/CFS/COS 等块、文件、对象存储。
6. 地域、可用区、租户、项目、账号、角色和 CAM。
7. 控制台、云 API、SDK、CLI、Terraform 和审计。
8. 监控、日志、告警、事件、拓扑、容量和变更。
9. 安全、备份、容灾、交付、补丁、升级与原厂支持。

### 按现场 BOM/License 选修域

- TKE、镜像仓库、微服务与云原生套件。
- TDSQL、Redis、CKafka、Pulsar 等数据与中间件。
- HCC、TurboFS、RDMA 和智算能力。
- INTA、NIPS 及其他安全产品。
- 大数据、AI 和行业 PaaS。

腾讯公有云产品目录不能直接当作 TCE 现场清单。每学一个产品都要问：BOM 有吗、License 有吗、部署了吗、版本是什么、谁维护、是否验证过。

## 官方知识地图

```text
产品边界
  -> TCE / TCS / TStack / CDC/CDZ / 公有云

基础设施
  -> 服务器、网络、存储、DCOS、硬件兼容

IaaS
  -> CVM、镜像、VPC、CLB、CBS/CFS/COS

PaaS
  -> TKE、TDSQL、Redis、CKafka、Pulsar、微服务、大数据、AI

治理面
  -> 地域/AZ、租户、CAM、配额、计量、API、Terraform、审计

运维面
  -> 监控、日志、告警、拓扑、容量、巡检、备份、DR、升级、安全
```

## 场景开场

业务申请一台 CVM，控制台长时间显示“创建中”。十分钟后，数据库、容器和消息平台也出现零星告警。

可能的停点不是一个：

```text
身份/配额
  -> 可用区计算容量
  -> 镜像
  -> VPC 端口和安全策略
  -> CBS 卷
  -> 宿主机/硬件
  -> 客户机启动
  -> 应用安装与健康检查
```

如果同一可用区的 TKE 节点和数据库同时异常，还要怀疑共享网络、存储、宿主机或变更，而不是每个产品各重启一次。

## 一句话人话版

Tencent TCE 是把计算、网络、存储、容器、数据库、中间件、安全和云管理能力私有化部署到客户环境中的企业级全栈云平台。

## TCE、TCS、TStack 与分布式云形态

| 形态 | 官方定位概括 | 学习重点 | 不能推断 |
|---|---|---|---|
| Tencent TCE | 基于腾讯云成熟体系的私有化全栈云 | 本路线主体 | 不能说“就是 OpenStack” |
| Tencent TCS | Kubernetes 与中间件组成的云原生 PaaS | 容器、微服务、中间件 | 不等于完整 TCE IaaS |
| Tencent TStack | 官方明确描述采用 OpenStack/Kubernetes 等开源架构 | OpenStack + K8s + 产品化 | 不是 TCE 别名 |
| CDC/CDZ 等 | 公有云能力延伸到客户附近/专属环境 | 网络、控制面位置、责任边界 | 不等于完全私有化 TCE |

TCE 官方还出现企业版、大数据版、AI 版、敏捷版等应用形态。它们是方案/产品形态，不代替现场完整版本与组件台账。

## TCE 的三类平面

### 管理面

用户、控制台、API、租户、权限、配额、工单、计量、审计、运维门户。

### 控制面

接收资源意图，保存状态，调度计算/网络/存储/服务实例，执行生命周期任务。

### 数据面

业务真实流量和数据：CVM、容器、负载均衡、虚拟网络、云盘、文件/对象、数据库和消息。

```text
管理面可登录 ≠ 控制面所有任务成功 ≠ 数据面业务健康
```

事故通报要分别给证据。

## 地域、可用区与故障域

```text
Region 地域
  -> Availability Zone 可用区
     -> 集群/资源池
        -> 机柜/供电/交换/存储故障域
           -> 宿主机/服务节点
```

多 AZ 只是基础条件。业务是否跨 AZ 还取决于实例放置、数据库复制、存储、网络、负载均衡、DNS、应用状态和演练。

### 高可用层级

| 层级 | 典型目标 | 验收证据 |
|---|---|---|
| 进程/副本 | 单服务实例故障自动恢复 | 副本、切换事件、探针 |
| 节点 | 单服务器故障 | 实例/Pod/服务恢复记录 |
| 集群 | 局部控制面或资源池故障 | 仲裁、容量与故障演练 |
| AZ | 机房级故障 | 跨 AZ 数据和流量切换 |
| 地域 | 城市/地域灾难 | DR 演练、RPO/RTO |
| 应用 | 端到端业务可用 | 真实业务探针与数据核对 |

## 租户、账号、项目、角色与资源

多租户云必须回答：谁、以哪个角色、在什么范围、对哪个资源、执行什么动作。

```text
身份
  -> 租户/组织/项目范围
  -> 角色与策略
  -> API/控制台动作
  -> 资源 ID
  -> 审计记录
```

具体对象名称按目标版本确认。最小权限原则：日常只读、业务资源操作、平台管理、安全审计和紧急账号分离；机器账号不与个人共用；密钥有轮换、吊销和使用审计。

## TCE 专题树

### 1. IaaS

[TCE IaaS 深讲](./tce-iaas.md) 覆盖 DCOS、CVM、镜像、VPC、CLB、CBS、任务和容量。

### 2. TKE on TCE

[TKE on TCE](../cloud-native/tke-on-tce.md) 连接 TCE IaaS 与 Kubernetes，重点是节点、CNI、CSI、镜像、版本矩阵和升级。

### 3. 存储

[TCE 存储](../storage-data-protection/tce-storage.md) 区分 CBS、CFS、COS、TurboFS 和 CSP 的块/文件/对象边界。

### 4. 数据库与中间件

- [TDSQL MySQL](../data-ai/tdsql-mysql.md)
- [Apache Pulsar](../data-ai/apache-pulsar.md)
- [TCE 数据与中间件](../data-ai/tce-data-middleware.md)
- 仓库现有 [Redis](../data-ai/redis.md)、[Kafka](../data-ai/kafka.md)、[MySQL](../data-ai/mysql-sql.md) 只解释通用原理，不等同 TCE 产品实现。

### 5. 运维与安全

[TCE 运维、安全与升级](./tce-operations-security.md) 覆盖版本、BOM、License、兼容矩阵、交付、监控、审计、备份、DR、升级和原厂边界。

## 一次 CVM 创建的总链路

```text
用户/自动化
  -> TCE 入口和身份认证
  -> 权限、租户、配额校验
  -> 创建任务/request ID
  -> 选择地域、AZ、规格和宿主资源
  -> 获取镜像
  -> 创建 VPC 端口/安全策略
  -> 创建或挂载 CBS
  -> 启动 CVM
  -> 注入初始化配置（若启用）
  -> 上报状态与审计
  -> 业务探针验证
```

页面的任务状态是线索，不是根因。保存 request ID、task ID、resource ID、错误码和发生时间，才能跨计算、网络、存储查同一次操作。

## 一次业务访问的总链路

```text
用户
  -> DNS
  -> 边界/WAF（若有）
  -> CLB 监听器和转发规则
  -> VPC 路由/安全组/ACL
  -> CVM 或 TKE Service/Ingress
  -> 应用
  -> TDSQL/Redis/MQ/COS 等依赖
```

“CVM 能 ping”只证明一小部分网络。业务成功还需要域名、证书、负载均衡健康检查、端口、应用协议、依赖和返回路径。

## TCE 与 OpenStack/Kubernetes 的关系

### 可以复用什么

- OpenStack：IaaS 的租户、计算、网络、镜像、卷和请求链心智模型。
- Kubernetes：容器声明式 API、控制循环、Pod/Service/Storage 等通用原理。
- KVM/Ceph/MySQL/Kafka/Redis：各领域基础机制。

### 不能直接复用什么

- 内部服务名、数据库、消息总线、端口和修复命令。
- 版本矩阵、控制台、License、升级路径和厂商 SLA。
- 产品实现细节和现场已安装组件。

TCE 官方定位是自研私有化全栈，不应写成“OpenStack 套壳”。TStack 才是官方明确描述使用 OpenStack/Kubernetes 的另一形态。

## 硬件与兼容性

兼容性指南按计算、存储、网络、数据库、中间件、安全、平台和服务器管理等分组查询推荐硬件/软件。

变更前至少核对：

- 服务器型号、CPU 代际、NUMA、内存。
- NIC/HBA/RAID 型号、固件、驱动和链路速度。
- 交换机、光模块、存储设备和协议。
- Guest OS、内核、云驱动。
- GPU/RDMA/TurboFS/HCC 的专属配套。
- TCE 目标版本和 Hotfix。

“硬件能启动”不等于“在目标 TCE 版本受支持”。兼容矩阵例外需原厂书面确认。

## 版本、BOM、License 与证据等级

### 版本记录模板

```text
产品形态：Tencent TCE ______
主版本：______
补丁/Hotfix：______
构建号：______
组件/BOM：______
兼容性指南版本：______
License 范围/期限：______
原厂维保有效期：______
证据来源与日期：______
```

### 证据等级

| 等级 | 证据 | 能说明什么 |
|---|---|---|
| A | 腾讯官方公开页、兼容性、官方代码仓库 | 公开产品能力和资料存在 |
| B | 经授权的目标版本产品/升级文档 | 该版本的操作和限制 |
| C | 现场控制台、BOM、License、合同、工单、演练 | 现场实际状态 |

正式报告不能拿 A 级资料替代 C 级现场事实。

## Terraform 与云 API

TCE 官方提供独立 Terraform Provider，并公开私有 endpoint、Region 和凭据配置思路。使用前必须核对 Provider 版本支持的 TCE 版本与具体资源。

```text
Terraform configuration
  -> provider plugin
  -> TCE private API endpoint
  -> identity/tenant authorization
  -> plan
  -> apply task/request ID
  -> resource state + audit
```

生产规则：

1. 凭据进入安全注入，不写 tfvars/仓库。
2. 先 `plan` 并审批，保存不可含敏感值的计划摘要。
3. state 是敏感资产，远端加密、锁定、备份和最小权限。
4. 不导入未知资源后立刻 apply。
5. Provider 升级单独变更，检查 schema/state migration。
6. API 返回成功后仍验证资源和业务。

## 容量与性能

### 五种容量不能混算

1. 物理安装量。
2. 平台保留与控制面消耗。
3. 已分配逻辑资源。
4. 实际使用和峰值。
5. 扣除故障/维护余量后的可承诺容量。

每个 AZ 按 N+1/业务目标计算，不用整个地域总量掩盖单 AZ 热点。

关键层：CVM vCPU/内存、宿主机、VPC 带宽/连接、CLB 新建连接和并发、CBS IOPS/吞吐/时延、CFS/COS 容量与请求、TKE Pod/节点、数据库连接/复制、MQ lag/磁盘。

## 安全责任边界

平台方负责底座与产品控制面安全，租户/业务团队仍负责账号、网络策略、系统补丁、应用漏洞、数据、密钥和错误配置。具体边界按合同和服务目录确认。

安全主线：

- CAM/最小权限和临时凭据。
- 管理面网络隔离、堡垒机、MFA 和紧急账号。
- 安全组、ACL、WAF/防火墙与零信任边界。
- KMS/Secret 管理，代码与镜像不含明文秘密。
- CloudAudit/平台审计的不可抵赖和留存。
- 漏洞、补丁、镜像、供应链和基线。
- 脱敏日志、数据分级、备份隔离和恢复演练。

## 高可用、备份和容灾

```text
组件多副本
  != 数据备份
  != 跨 AZ 高可用
  != 跨地域灾备
  != 应用端到端恢复
```

设计时逐项定义：故障域、复制模式、仲裁、RPO/RTO、应用一致性、流量切换、DNS、依赖顺序、回切、双写防护和演练。

营销材料中的能力不是现场承诺。用保护关系、复制状态、备份恢复、切换报告和业务核对证明。

## 可观测性与 AIOps

### 统一证据模型

```text
resource_id + tenant + region/AZ + time
  -> metric
  -> log
  -> alarm/event
  -> task/request_id
  -> audit/change_id
  -> topology neighbors
  -> business probe
```

跨产品 RCA 先确定共同故障域和时间：同 AZ 多服务异常优先看共享基础设施/变更；单租户异常优先看权限、配额、VPC 和业务配置。

### 自动化分级

| 级别 | 动作 | 示例 |
|---|---|---|
| L0 | 只读采集 | 版本、容量、告警、任务、拓扑 |
| L1 | 生成建议 | 假设、下一步检查、影响面 |
| L2 | 人工审批的低风险操作 | 测试实例重试、规则恢复 |
| L3 | 高风险/闭源内部动作 | 升级、主备、数据修复、DR 切换 |

L3 需要原厂/授权 SOP、审批、备份、停止条件和回滚。

## 基础实验：平台证据与容量报告

使用 [private-cloud-evidence-lab](https://github.com/quweisheng/zero-to-aiops/tree/main/examples/private-cloud-evidence-lab)：

```powershell
cd examples\private-cloud-evidence-lab
powershell -ExecutionPolicy Bypass -File .\Invoke-PrivateCloudAudit.ps1 `
  -InputPath .\fixtures\healthy.json `
  -OutputPath .\evidence\healthy-report.md
```

预期：PASS；报告显示 TCE 产品形态、合成版本、管理节点、CVM/对象存储容量和 CVM/TKE/观测组件摘要。

实验只验证台账、阈值和报告逻辑，不证明真实 TCE 组件或版本。

## 故障实验：跨平台容量与组件副本异常

```powershell
powershell -ExecutionPolicy Bypass -File .\Invoke-PrivateCloudAudit.ps1 `
  -InputPath .\fixtures\degraded.json `
  -OutputPath .\evidence\degraded-report.md
```

预期退出码 2；TCE 对象存储越过 90%，CVM 分配接近阈值，TKE 控制面 2/3 且 degraded。

不要直接得出“根因就是容量”。下一步应核对趋势、配额、故障冗余、业务指标、组件日志、同 AZ 告警和最近变更。

## 跨产品故障定位总流程

1. **影响**：哪些租户、业务、地域/AZ 和操作失败。
2. **时间**：首次失败、告警、变更、缓解和恢复统一时区。
3. **入口**：DNS/控制台/API/CLB 是否可达。
4. **任务**：request/task/resource ID 停在哪一阶段。
5. **依赖**：计算、网络、存储、身份、数据库、中间件。
6. **故障域**：同宿主、机柜、交换、存储、AZ 是否成片。
7. **容量**：资源、连接、队列、磁盘和复制是否越线。
8. **变更**：Terraform、控制台、升级、策略、硬件维护。
9. **修复**：最小动作、影响面、审批、停止条件、回滚。
10. **验证**：平台状态 + 业务探针 + 数据核对。

## 高频故障矩阵

| 现象 | 证据 | 假设方向 | 红线 |
|---|---|---|---|
| CVM 创建失败 | request/task、配额、AZ、镜像、VPC、CBS、宿主 | 资源或依赖停点 | 不反复创建 |
| CVM 有 IP 业务不通 | 路由、安全组、ACL、CLB、监听、应用 | 策略/返回路径/应用 | 不全放通 |
| 云盘 I/O 异常 | 卷、挂载、IOPS/时延、路径、后端告警 | 容量、网络、设备、任务 | 不强制解挂载 |
| TKE 节点 NotReady | event、kubelet、runtime、CNI、VPC、证书 | 节点/网络/证书 | 不批量删节点 |
| 数据库延迟 | SQL、连接、锁、复制、磁盘、分片 | 热点/复制/存储 | 不直接重启集群 |
| MQ 积压 | 生产/消费、partition/subscription、lag、磁盘 | 消费者/分布/下游 | 不随意重置 offset |
| 升级失败 | 版本、BOM、预检、备份、失败阶段 | 兼容/健康/包 | 不删升级状态 |
| DR 切换失败 | 复制、仲裁、网络/DNS、依赖、演练 | 数据/流量/顺序 | 防止双写 |

## 生产设计题

题目：为金融核心与互联网业务设计双 AZ TCE。

回答必须包含：业务分级与 RPO/RTO；地域/AZ/故障域；CVM/TKE/数据库/存储跨 AZ 策略；CLB/DNS 流量；控制面和数据面容量；CAM/审计/密钥；备份和异地 DR；BOM/License/维保；升级灰度和回退；业务级演练。

不能只画“两个机房各一套”。要说明数据怎样复制、谁仲裁、网络怎样接管、故障后容量够不够、怎样防双写、如何证明恢复。

## 事故题

题目：一次网络变更后，同 AZ 的 CVM、TKE 和 TDSQL 同时超时。

先冻结变更和限制影响，按共同故障域检查物理/虚拟网络、路由、MTU、ACL、存储网络是否共享；关联审计与变更单。不要三个产品分别重启。回退最小网络变更后，用业务探针和数据一致性验证，再复盘变更模拟、灰度和监控盲区。

## 面试怎么讲

### 30 秒版本

TCE 是腾讯云成熟能力的私有化全栈平台，包含 IaaS、PaaS、运营和运维，不等同 OpenStack，也不代表现场安装腾讯云所有产品。我会先核对版本、BOM、License 和故障域，再从身份、CVM、VPC、存储、TKE、数据库和中间件画请求链，用 request ID、资源 ID、告警、审计和业务探针排障。

### 3 分钟版本

先分清 TCE、TCS、TStack；再按基础设施、IaaS、PaaS、治理和运维五层解释。以创建 CVM 为例，经过认证授权、配额、AZ 调度、镜像、VPC、CBS、宿主和客户机。生产设计要同时覆盖地域/AZ/故障域、容量、CAM、安全、备份/DR、BOM、升级和回滚。AIOps 用资源/请求/任务/变更 ID 关联指标日志告警和拓扑；闭源控制面、数据一致性、Hotfix 和跨版本回退升级原厂。

### 连续追问

1. **TCE 是 OpenStack 吗？** 官方把 TCE 定义为基于腾讯云成熟体系自研的私有化全栈；TStack 才明确使用 OpenStack/K8s。
2. **为什么不列全腾讯云产品？** 现场能力由版本、BOM、License 和部署决定。
3. **多 AZ 是否自动容灾？** 不是，还要应用、数据、流量、容量和演练。
4. **API 成功是否完成？** 未必，异步任务还要跟 task/resource 和业务验证。
5. **Terraform 是否可管理全部 TCE？** 需核对 Provider/TCE 版本和资源支持；state 与凭据要治理。
6. **何时找原厂？** 闭源内部、补丁/升级、主备一致性、License、数据修复和 DR 高风险操作。

## 学习路线

### P0 基础

Linux、网络、KVM、存储、HTTP/API、身份权限、监控与事件响应。

### P1 平台

本总览 -> [TCE IaaS](./tce-iaas.md) -> [TCE 运维安全](./tce-operations-security.md) -> 合成只读实验。

### P2 现场组件

[TKE on TCE](../cloud-native/tke-on-tce.md) -> [TCE 存储](../storage-data-protection/tce-storage.md) -> [TDSQL](../data-ai/tdsql-mysql.md) -> [Pulsar](../data-ai/apache-pulsar.md) -> [数据中间件总览](../data-ai/tce-data-middleware.md)。

### P3 生产与面试

双 AZ/地域设计、容量模型、升级回滚、DR 演练、跨产品故障和原厂边界。

## 学习检查清单

- [ ] 能分清 TCE/TCS/TStack/CDC/CDZ。
- [ ] 能解释“平台必修 + BOM 选修”的范围。
- [ ] 能画管理面、控制面和数据面。
- [ ] 能画 CVM 创建和业务访问链。
- [ ] 能建立版本、BOM、License 与维保台账。
- [ ] 能按 region/AZ/故障域做容量与 HA 判断。
- [ ] 能解释 API/Terraform/state/审计边界。
- [ ] 能区分多副本、备份、跨 AZ、跨地域和应用恢复。
- [ ] 能完成基础和故障实验并正确声明合成边界。
- [ ] 能在跨产品事故中找共同故障域而不是分别重启。

## GitHub 学习证据

```text
tce-learning/
  architecture/
    tce-capability-map.md
    cvm-request-path.md
  inventory/
    asset-software-license-ledger.md
    sanitized-bom.json
  automation/
    terraform-plan-sanitized.md
  evidence/
    capacity-report.md
    alarm-change-timeline.md
  postmortem/
    cross-product-incident.md
```

不得提交真实 endpoint、IP、账号、SecretId/SecretKey、Token、BOM、License、租户、业务数据或原始日志。
