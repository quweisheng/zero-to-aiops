# Tencent TCE IaaS 技术栈深讲

> 学习目标：理解 TCE 基础设施、DCOS、CVM、镜像、VPC、CLB 与 CBS 的职责和完整请求链；能用只读证据定位实例创建、业务访问、云盘和容量问题，并设计高可用、安全、升级和回滚方案。

## 官方资料

- [Tencent TCE 官方概览](https://intl.cloud.tencent.com/zh/solutions/tce?lang=zh)
- [TCE 兼容性指南](https://cloud.tencent.com/solution/tce/compatibilityguide)
- [云服务器 CVM 文档](https://intl.cloud.tencent.com/zh/document/product/213?lang=zh)
- [VPC 概述](https://intl.cloud.tencent.com/zh/document/product/215/535?lang=zh&pg=)
- [CBS 产品页](https://cloud.tencent.com/product/cbs)
- [CLB 产品页](https://cloud.tencent.com/product/clb)
- [TCE Terraform Provider](https://github.com/TencentCloud/terraform-provider-tencentcloudenterprise)

说明：公有云文档帮助理解产品语义，TCE 的可用功能、规格、API、内部实现和操作以现场版本/BOM/授权文档为准。本文不把公有云 SLA、价格或配额照搬到 TCE。

## 官方知识地图

```text
硬件与 DCOS
  -> 服务器、BMC、PXE/装机、固件、兼容性、硬件监控

计算
  -> CVM、镜像、规格、宿主、调度、配额、生命周期

网络
  -> VPC、子网、路由、ENI、安全组、ACL、EIP/NAT/专线（按 BOM）、CLB

存储
  -> CBS 创建、挂载、快照、性能、容量和后端故障域

治理
  -> region/AZ、tenant、CAM、API、task、audit、Terraform
```

## 场景开场

控制台显示 CVM 创建失败，错误文字只有“内部错误”。真正链路至少经过身份、配额、镜像、计算调度、网络端口和云盘。若只重试，可能创建重复卷、残留端口和更多任务。

## 一句话人话版

TCE IaaS 把机房的服务器、网络和存储包装成可按租户通过 API 申请的 CVM、VPC、CLB 和云盘资源。

## 小白问题

- CVM 是不是一台物理服务器？不是，它通常是运行在资源池上的云虚拟机。
- VPC 是 VLAN 吗？不是，VPC 是租户逻辑网络，底层可能结合多种虚拟与物理网络技术。
- 安全组和防火墙一样吗？安全组常绑定实例/网卡进行状态化访问控制，边界防火墙职责更广；现场实现按产品确认。
- 云盘快照是不是备份？快照是恢复手段之一，不自动等于跨故障域、长期、可验证备份。

## IaaS 对象模型

```text
Region
  -> AZ
     -> VPC
        -> Subnet
           -> ENI / private IP
              -> CVM
                 -> CBS volumes
           -> CLB frontend/backend
```

控制对象靠 ID 关联，不用名称猜关系。CMDB 还应映射业务、负责人、环境、数据等级和变更单。

## DCOS 与硬件生命周期

公开兼容性指南出现 Data Center Operating System（DCOS）自动装机和硬件监控能力。可以把这一层理解为“把裸金属服务器纳入云底座的工厂线”：

```text
BMC/带外
  -> 硬件发现与兼容性
  -> PXE/DHCP/DNS/镜像
  -> RAID/HBA/NIC/固件
  -> OS/云底座安装
  -> 健康检查
  -> 加入资源池
```

### 自动装机失败怎么查

1. BMC、电源、管理网和账号权限。
2. PXE、DHCP、TFTP/HTTP、DNS 和路由。
3. 服务器/CPU/NIC/HBA/RAID 与目标 TCE 兼容矩阵。
4. 固件、驱动、磁盘布局和安全启动。
5. 任务 ID、失败阶段和目标版本文档。

不要为“让它装上”关闭所有安全、刷未知固件或跳过兼容检查。固件/RAID 变更需要维护窗和原厂边界。

## CVM 五件套

是什么：Cloud Virtual Machine，按规格、镜像、网络和磁盘创建的云主机。

为什么需要：把物理资源池按租户按需交付，支持 API、配额、镜像和生命周期。

怎么工作：控制面校验请求并调度宿主，连接虚拟网络与云盘，再启动客户机。

怎么观察：实例状态、task/request ID、镜像、规格、VPC、ENI、CBS、宿主故障域、客户机控制台和监控。

坏了怎么查：先定位创建/启动/网络/磁盘/客户机哪一阶段，再检查依赖，不重复创建。

### 状态不能只看 Running

```text
控制面实例状态：Running
客户机 OS：可能启动失败
网络：可能无路由/策略阻断
云盘：可能文件系统未挂载
应用：可能未监听或依赖失败
```

最终验收用业务探针。

## 镜像与初始化

镜像不仅是一个磁盘文件，还包含 OS、驱动、cloud-init/初始化代理、分区、安全基线和兼容性。

镜像治理：

- 来源、校验和、负责人、版本和漏洞扫描。
- Guest OS 与 TCE/CVM 驱动兼容。
- 不含固定密码、SSH 私钥、Token、机器身份和真实数据。
- 首次启动脚本幂等、有超时、日志和失败标记。
- 旧镜像下线前确认仍有重建/回滚需求。

“实例已创建但无法登录”要查启动日志、网卡/驱动、初始化、SSH/RDP、密码/密钥和安全组，不能先重装。

## 计算调度、配额和容量

调度要同时满足 AZ、规格、资源、亲和/反亲和、硬件特性和平台策略。报容量不足不一定是全平台 CPU 不够，可能是目标 AZ、特定型号、连续大页、GPU/RDMA 或故障冗余不足。

### 容量公式心智模型

```text
可承诺容量
= 物理可用
- 控制面与系统预留
- N+1/故障预留
- 维护预留
- 已承诺资源
- 增长与突发安全余量
```

超分比必须结合工作负载峰值和 SLO，不按一个固定行业数字照抄。

## VPC、子网和路由

### VPC 五件套

是什么：租户隔离的逻辑私有网络。

为什么：让业务自定义地址、子网、路由和安全边界，不直接暴露物理网络细节。

怎么工作：控制面创建逻辑对象，数据面通过虚拟交换/路由、隧道或其他网络能力转发。

怎么用：规划不重叠 CIDR、AZ 子网、路由、DNS、出口和互联。

坏了怎么查：从 ENI/IP、子网、路由、安全组、ACL、NAT/专线、物理底座逐层检查。

### CIDR 规划

地址规划要考虑：当前规模、增长、容器 Pod/Service 网段、数据库、管理、跨 VPC/专线和并购互联。网段重叠会让路由与混合云复杂化，不能事后只靠 NAT 全解决。

## 安全组与 ACL

安全规则最小化：源/目标、协议、端口和方向明确。不要用 `0.0.0.0/0` 临时放通后忘记回收。

排障：

```text
应用是否监听
  -> 客户机防火墙
  -> 安全组
  -> 子网 ACL
  -> 路由/NAT/专线
  -> 对端返回路径
```

状态化/无状态、规则优先级和默认行为按现场版本确认。

## CLB 完整路径

```text
客户端 DNS
  -> CLB VIP/监听器
  -> 证书与协议（若终止 TLS）
  -> 转发规则
  -> 健康检查
  -> 后端 CVM/TKE 节点与端口
  -> 应用
```

### 后端不健康

检查健康路径、Host、协议、端口、预期状态码、超时、阈值、安全策略和应用日志。把健康检查关闭只能隐藏问题，还会把流量发给坏实例。

### 会话与连接容量

关注新建连接、并发、带宽、后端连接、超时、长连接、四层/七层和客户端 IP 传递。容量设计以目标版本规格与压测为准。

## CBS 云硬盘完整路径

```text
应用
  -> 文件系统/卷管理
  -> 客户机块设备
  -> CVM 虚拟 I/O
  -> CBS 接入/网络
  -> 后端存储节点/磁盘
```

### 生命周期

创建 -> 可用 -> 挂载 -> 客户机识别 -> 分区/文件系统 -> 挂载点 -> 使用 -> 卸载 -> 解挂载 -> 删除。

控制面“已挂载”不证明客户机已 mount；强制解挂载可能损坏数据。先停止写入、卸载文件系统并核对设备身份。

### 性能

IOPS、吞吐、时延和队列要一起看。小随机 I/O、顺序大块、读写比例和同步写对性能影响不同。还要检查实例规格、文件系统、客户机队列、网络和后端重建。

### 快照与备份

快照前确认应用一致性，数据库可能需要冻结/flush 或使用专用备份。恢复必须定期演练；有快照记录不等于可恢复。

## CVM 创建故障证据链

1. request ID/task ID/resource ID。
2. 身份、租户、配额和策略。
3. Region/AZ、规格和可用容量。
4. 镜像状态与兼容。
5. VPC/subnet/ENI/安全组。
6. CBS 创建/挂载。
7. 宿主与硬件告警。
8. 客户机启动与初始化。
9. 同时间审计和变更。

每完成一层都记录正常/异常证据，避免同时改多处。

## API 与异步任务

云 API 常返回请求已接受，后台任务继续执行。客户端要保存 request ID，轮询状态有退避、超时和终止状态。

写操作需要客户端 token/幂等策略、服务端去重和结果查询。客户端超时后先查任务，不生成新意图重复创建。

API 凭据：最小权限、短期优先、密钥轮换、来源限制、审计和安全注入。签名失败先查时间、endpoint、region、凭据和规范化请求，不打印 SecretKey。

## Terraform 生产边界

```text
代码评审
  -> init/provider lock
  -> validate
  -> plan
  -> 审批
  -> apply
  -> TCE task/request
  -> 资源验证
  -> state 安全保存
```

高风险变更查看 replace/destroy；关键数据库、云盘、网络资源使用保护策略并人工复核。drift 先判断是紧急操作、控制台变更还是 Provider 读写差异，不直接 apply 覆盖。

## 高可用设计

- 控制面按产品支持部署冗余。
- 工作负载跨宿主和故障域，反亲和不等于跨 AZ。
- CLB 后端跨故障域并有应用健康检查。
- 数据盘/数据库保护按 RPO/RTO 设计。
- 单 AZ 故障后剩余容量足够。
- DNS、专线、出口和管理面也有冗余。

平台 HA 不代替应用无状态/会话、数据库复制和依赖恢复。

## 安全与审计

每个 API/控制台动作关联操作者、角色、源、request ID、资源 ID、时间和结果。机器账号和人员账号分开。高危网络、云盘删除、镜像共享和规格变更进入审批。

日志脱敏，不记录凭据、完整 userdata、云初始化秘密和业务数据。镜像与 Terraform state 按敏感资产保护。

## 可观测性

| 层 | 指标/事件 | 故障价值 |
|---|---|---|
| 硬件/DCOS | BMC、温度、磁盘、NIC、装机任务 | 找物理与交付问题 |
| CVM | 状态、CPU/内存/磁盘、迁移/重启 | 找实例和宿主范围 |
| VPC | 端口、流量、丢包、路由/规则变更 | 找网络路径 |
| CLB | 健康、连接、状态码、延迟 | 区分入口与后端 |
| CBS | 容量、IOPS、吞吐、时延、挂载 | 找 I/O 路径 |
| 审计 | API、Terraform、控制台动作 | 关联变更 |

## 基础实验

运行 [private-cloud-evidence-lab](https://github.com/quweisheng/zero-to-aiops/tree/main/examples/private-cloud-evidence-lab) 的健康样本，观察 CVM vCPU 与对象存储容量、IaaS 控制组件状态。它是对象/容量模型实验，不是 TCE 实机验证。

```powershell
cd examples\private-cloud-evidence-lab
powershell -ExecutionPolicy Bypass -File .\verify.ps1
```

预期：`private-cloud-evidence-lab verification passed`。

## 故障实验：安全组或健康路径错误

仅在授权测试租户：

1. 创建测试 VPC/subnet/security group/CVM，部署无数据 HTTP 服务。
2. 通过 CLB 使用 `/healthz` 检查。
3. 故意把测试安全组后端端口改错或健康路径改为 `/wrong`。
4. 记录 CLB 后端不健康、CVM 仍运行和应用本地正常。
5. 用审批过的原配置回滚。
6. 验证 CLB、端到端请求和审计记录。
7. 删除测试资源前核对资源 ID，保留脱敏证据。

不能在生产注入，也不能用全放通作为修复。

## 高频排障

| 现象 | 先看 | 处理主线 |
|---|---|---|
| CVM Creating/Error | task、配额、AZ、镜像、VPC、CBS | 找停点和共同故障域 |
| 登录失败 | console、OS、初始化、网络、安全组 | 区分客户机与平台 |
| 业务超时 | DNS、CLB、路由、规则、应用、依赖 | 端到端逐跳 |
| CLB 不健康 | listener/规则/探针/后端日志 | 修探针或应用 |
| CBS 挂载卡住 | 卷状态、attachment、客户机、后端 | 不强制破坏状态 |
| I/O 延迟 | 文件系统、队列、实例、CBS、后端 | 同时间趋势和任务 |
| Terraform 漂移 | state、审计、控制台/紧急变更 | 先确认权威状态 |

## 生产设计题

设计一个三层业务：CLB -> 多 AZ CVM/TKE -> TDSQL，静态对象入 COS，数据盘用 CBS。说明 CIDR、路由、安全组、负载健康、故障域、容量、备份、审计、Terraform state、升级与业务探针。单 AZ 失败后必须计算剩余连接和容量。

## 事故题

“CVM 创建失败率升高，现有 CVM 正常。”这更像控制面/容量/新建依赖，而非全数据面故障。比较新建任务的 AZ/规格/镜像/VPC/CBS，查看最近配额和变更，保护现有业务，不贸然重启数据面。

## 面试回答

### 30 秒

TCE IaaS 把硬件通过 DCOS 和云控制面变成 CVM、VPC、CLB、CBS 等租户资源。创建 CVM 会经过认证授权、配额、AZ 调度、镜像、网络和云盘。排障时我拿 request/task/resource ID 定位停点，再查共同故障域和审计，不把控制台“内部错误”当根因。

### 连续追问

1. **Running 为何业务不通？** 客户机、网络、CLB、应用和依赖仍需验证。
2. **容量不足只看 CPU？** 不，可能是单 AZ、规格、内存、GPU/RDMA、存储或故障余量。
3. **安全组故障怎么查？** 监听、客户机防火墙、安全组、ACL、路由和返回路径。
4. **CBS 快照是备份吗？** 不自动等于独立、跨域、应用一致且已验证恢复。
5. **Terraform apply 成功就结束？** 还要跟 TCE task、资源状态、业务和 state。

## 学习清单

- [ ] 能画 DCOS 装机与 CVM 创建链。
- [ ] 能解释 CVM、镜像、规格、配额和 AZ 调度。
- [ ] 能画 VPC/CLB 到应用路径。
- [ ] 能画 CBS 到后端的 I/O 路径。
- [ ] 能用 task/request/resource ID 排障。
- [ ] 能设计容量、HA、安全、审计和 Terraform state。
- [ ] 能完成基础与测试租户故障实验。

## GitHub 学习证据

- 脱敏 IaaS 对象图、CIDR 和故障域设计。
- 合成容量报告、API/task 时间线。
- Terraform plan 摘要与 state 安全说明。
- CLB 健康检查故障复盘。
- 镜像、版本和兼容矩阵核对表。

## 下一步

继续 [TCE 运维安全](./tce-operations-security.md)、[TCE 存储](../storage-data-protection/tce-storage.md) 与 [TKE on TCE](../cloud-native/tke-on-tce.md)。
