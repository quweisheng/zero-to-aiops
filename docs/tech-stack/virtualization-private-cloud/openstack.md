# OpenStack 深讲

> 学习目标：理解 IaaS 和 OpenStack 核心服务，能用命令行识别项目、网络、镜像、云主机与卷，完成一次只读资产盘点，并按请求链路定位常见故障。

## 官方资料

- [OpenStack 文档入口](https://docs.openstack.org/)
- [安装指南概览](https://docs.openstack.org/install-guide/overview.html)
- [逻辑架构](https://docs.openstack.org/install-guide/get-started-logical-architecture.html)
- [OpenStackClient 文档](https://docs.openstack.org/python-openstackclient/latest/)
- [运维指南](https://docs.openstack.org/operations-guide/)

官方安装指南明确面向学习和概念验证。生产云还需要发行版选型、高可用、容量、安全、升级与灾备设计，不能把最小实验直接当生产方案。

## 官方知识地图

```text
OpenStack IaaS
  -> 身份与目录：Keystone
  -> 计算：Nova 与 Placement
  -> 网络：Neutron
  -> 镜像：Glance
  -> 块存储：Cinder
  -> 对象存储：Swift
  -> 控制台：Horizon
  -> 数据库、消息队列与高可用
```

`IaaS` 是 Infrastructure as a Service，即通过 API 提供计算、网络和存储等基础资源。

## 场景开场

业务申请一台虚拟机，界面最终显示 ERROR。问题可能不在“虚拟机服务”本身：身份认证、规格容量、镜像下载、网络端口、存储卷或计算节点任一环节失败，都会让创建流程中断。

## 一句话人话版

OpenStack 把数据中心的计算、网络和存储包装成带租户隔离的 API，让用户像使用公有云一样申请资源。

## 小白可能会问

- OpenStack、VMware vSphere 和 Kubernetes 分别管什么？
- 为什么创建一台云主机会经过这么多服务？
- Project、User、Domain 和 Role 是什么关系？
- 控制节点正常，为什么实例仍然创建失败？

## 为什么要学

岗位点名 IaaS，并要求 Rancher、Kubernetes 和存储经验。OpenStack 常承载 Kubernetes 节点、负载均衡器和持久卷；其告警、日志、资源拓扑与变更记录也是 AIOps 根因分析的重要上下文。

## OpenStack 是什么

OpenStack 是一组互相配合的开源云服务。它不是单个进程：Keystone 管身份，Nova 管计算生命周期，Neutron 管网络，Glance 管镜像，Cinder 管块存储，Placement 记录资源供给与分配。

## 它解决什么问题

- 通过 API 自助申请和回收基础设施。
- 用 Project 隔离不同团队和环境。
- 统一调度多台计算节点上的资源。
- 把网络、镜像和存储接入同一资源生命周期。
- 为配额、审计、自动化和容量管理提供标准接口。

## 核心原理

### Keystone 身份、项目和目录

- **是什么**：Keystone 负责认证、Token、Project、Role 和服务目录。
- **为什么需要**：多租户云必须知道“谁以什么权限访问哪个项目”。
- **怎么工作**：客户端提交凭据换取 Token，再从服务目录找到 Nova、Neutron 等 API 地址。
- **怎么看或怎么用**：用 `openstack token issue`、`openstack catalog list` 验证身份和目录。
- **坏了怎么查**：先查凭据、Project、Domain、时间同步和 endpoint，再查 Keystone 日志。

### Nova 与 Placement

- **是什么**：Nova 管云主机生命周期，Placement 管 CPU、内存等资源供给和分配记录。
- **为什么需要**：创建实例需要从众多计算节点中找到满足规格的目标。
- **怎么工作**：Nova API 接收请求，调度器查询 Placement，选定计算节点后由 nova-compute 执行。
- **怎么看或怎么用**：看 server event、调度器日志、hypervisor 资源和 allocation candidate。
- **坏了怎么查**：出现 NoValidHost 时检查配额、库存、聚合、trait、资源超售与 Placement 同步。

### Neutron 网络

- **是什么**：Neutron 管 Network、Subnet、Port、Router、Security Group 和 Floating IP。
- **为什么需要**：云主机需要租户隔离、地址分配、路由和访问控制。
- **怎么工作**：API 创建逻辑资源，网络后端和 Agent 在节点上实现交换、路由或隧道。
- **怎么看或怎么用**：从 Port 状态、绑定主机、安全组、路由和底层网络逐层检查。
- **坏了怎么查**：先区分 DHCP、二层、三层、SNAT/DNAT 和安全组问题，不要只执行 ping。

### Glance 与 Cinder

- **是什么**：Glance 保存镜像元数据和镜像内容入口；Cinder 提供可挂载的块存储卷。
- **为什么需要**：镜像是系统模板，卷负责独立于实例生命周期保存数据。
- **怎么工作**：创建实例时下载或访问镜像；挂卷时 Cinder 后端创建卷并返回连接信息。
- **怎么看或怎么用**：检查 image/volume 状态、后端容量、服务状态和连接日志。
- **坏了怎么查**：镜像卡住查存储与格式，卷挂载失败查后端、协议、网络和主机映射。

## 架构和数据流

```text
用户 / 自动化
  -> Keystone 获取 Token 与服务目录
  -> Nova API 接收创建请求
  -> Placement 与 Scheduler 选择计算节点
  -> Glance 提供系统镜像
  -> Neutron 创建并绑定端口
  -> Cinder 按需创建并挂载卷
  -> nova-compute 启动实例
```

控制服务常依赖数据库保存状态、依赖消息队列传递异步任务。API 返回已受理，不代表后端流程已经全部成功。

## 安装与启动

先安装统一命令行客户端。没有授权云环境也可以完成客户端安装和帮助命令实验。

```powershell
python -m venv .venv # 创建独立 Python 环境，避免污染系统包
.\.venv\Scripts\Activate.ps1 # 激活 Windows 虚拟环境
python -m pip install python-openstackclient # 安装官方统一命令行客户端
openstack --version # 正常会输出客户端版本
```

接入真实云时优先使用受控的 `clouds.yaml` 或临时环境变量，不要把密码提交到 GitHub。

## 配置详解

```yaml
clouds:
  lab:
    auth:
      auth_url: https://keystone.example.internal/v3 # Keystone v3 认证入口
      username: learner # 实验账号，不要使用全局管理员
      password: ${OS_PASSWORD} # 示例占位；实际应使用安全凭据机制
      project_name: demo # 资源所在项目
      user_domain_name: Default # 用户所属 Domain
      project_domain_name: Default # 项目所属 Domain
    region_name: RegionOne # 选择服务目录中的区域
    interface: internal # 内网运维机通常访问 internal endpoint
    identity_api_version: 3
```

`clouds.yaml` 通常由 SDK 读取，但是否支持环境变量插值要按所用工具确认。最稳妥的做法是使用平台提供的 OpenRC/安全凭据管理，不在仓库保存明文密码。

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `token issue` | 验证认证链路 | `openstack --os-cloud lab token issue` | 返回 Token 与 Project | 本机时间偏差或 Domain 错误 |
| `server list` | 列云主机 | `openstack server list --long` | 返回状态、网络和规格 | 查错 Project |
| `network list` | 列逻辑网络 | `openstack network list` | 返回网络 ID 和状态 | 只看网络，不看 Port 绑定 |
| `volume list` | 列块存储卷 | `openstack volume list` | 返回卷状态与大小 | `available` 与 `in-use` 含义混淆 |
| `compute service list` | 看计算服务心跳 | `openstack compute service list` | State 为 up | 服务 up 不代表容量满足请求 |

## 在 AIOps 中的作用

OpenStack 能提供 API 延迟、服务心跳、消息堆积、资源容量、实例事件和租户拓扑。AIOps 可将“实例 ERROR”与同时间段的调度失败、Neutron Port 异常或 Cinder 后端容量告警关联起来，并触发只读诊断 Runbook。

## 入门实验：生成只读云资产快照

### 实验目标

验证认证与主要服务 API，并把当前项目资源保存为可复盘证据。实验只读，不创建或删除资源。

### 实验步骤

```powershell
$env:OS_CLOUD = 'lab' # 选择 clouds.yaml 中的 lab 配置
New-Item -ItemType Directory -Force openstack-lab | Out-Null
openstack token issue | Out-File -Encoding utf8 openstack-lab\token.txt # 验证身份
openstack server list --long | Out-File -Encoding utf8 openstack-lab\servers.txt # 保存云主机清单
openstack network list | Out-File -Encoding utf8 openstack-lab\networks.txt # 保存网络清单
openstack volume list | Out-File -Encoding utf8 openstack-lab\volumes.txt # 保存卷清单
```

### 验证结果

Token 命令成功，三个清单文件存在。空项目可以没有资源行，但不应出现 401、403 或 endpoint 连接错误。

### 如果没有成功

1. 401 先查账号、密码、Domain 和 Project。
2. 403 查 Role 与策略，不要换成管理员绕过问题。
3. 连接错误查 DNS、证书、代理和 endpoint interface。
4. 单个服务失败时用 `openstack catalog list` 核对该服务地址。

## 常见故障排查

| 现象 | 先检查 | 处理思路 |
|---|---|---|
| 实例长期 BUILD | request ID、任务状态、消息队列 | 沿 Nova 请求链路定位停点 |
| NoValidHost | 配额、Placement、规格、聚合、容量 | 找出未满足的调度条件 |
| 实例有 IP 但不通 | Port、DHCP、路由、安全组、底层网络 | 按二层到七层排查 |
| 卷卡在 attaching | Cinder 后端、连接协议、计算节点日志 | 修复后端或残留连接状态 |
| API 间歇超时 | HAProxy、API worker、数据库、消息队列 | 关联延迟、连接数和队列积压 |

## 面试怎么讲

OpenStack 是模块化 IaaS。创建实例会经过 Keystone、Nova、Placement、Neutron、Glance，并可能访问 Cinder。排障时我会拿 request ID 沿 API、调度、消息队列和计算节点追踪，而不是只看 Horizon 页面。

## 学习检查清单

- [ ] 能说出六个核心服务及职责。
- [ ] 能解释一次实例创建的数据流。
- [ ] 能区分认证失败、授权失败和 endpoint 不通。
- [ ] 能完成只读资产盘点。
- [ ] 能说明 NoValidHost 的排查方向。

## 面试题

1. OpenStack 和 vSphere、Kubernetes 有什么边界？
2. 创建实例经过哪些核心服务？
3. NoValidHost 一定是 CPU 不够吗？
4. 云主机网络不通如何分层排查？
5. OpenStack 哪些信号适合进入 AIOps？

## 学习证据

- 脱敏后的 `clouds.yaml` 模板。
- `openstack-lab/` 只读资产快照。
- 一张实例创建链路图。
- 一份带 request ID 的故障复盘。

## 本文边界与下一步

本文覆盖岗位所需的 IaaS 概念、核心服务和排障方法，不覆盖生产部署的全部复杂性。下一步应结合实际发行版学习高可用、升级、数据库/消息队列运维、Neutron 后端和 Cinder 存储驱动。
