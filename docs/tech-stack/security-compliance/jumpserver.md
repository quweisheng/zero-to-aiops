# JumpServer 技术栈深讲

> 学习目标：从零理解 JumpServer 的用户、资产、账号、授权、连接代理和审计链路，能在隔离实验环境部署固定版本、完成一次 SSH 资产访问与审计闭环、制造并定位一次连接故障，并能设计生产高可用、容量、安全、备份与升级方案。

## 版本与产品边界

截至 2026-07-30，JumpServer 官方 GitHub 最新发布是：

| 发布线 | 当前版本 | 发布时间 | 本文选择 |
|---|---|---|---|
| JumpServer v4 LTS | `v4.10.18-lts` | 2026-07-28 | 新建实验与生产评估基线 |
| JumpServer v3 LTS | `v3.10.22-lts` | 2026-07-24 | 仍在维护的旧主线，存量环境先评估迁移 |

本文命令固定到 `v4.10.18`，社区版镜像标签固定为 `v4.10.18-ce`，不使用 `latest` 代替版本号。固定版本便于复现；生产还应记录安装器、容器镜像 Digest、配置、数据库版本和外部存储版本。

JumpServer 社区版是 GPLv3 开源软件，提供堡垒机和 PAM 主线能力；部分组织、多级审批、账号改密、数据库类型、数据脱敏和高级访问控制属于企业版或 X-Pack。本文遇到这类能力会明确标注，不能因为官方手册展示了某个页面，就默认社区版一定包含。

安全版本边界也要单独看。官方公告说明 v4 `<= 4.10.11` 受 CVE-2025-62712 与 CVE-2025-62795 影响，v4 应至少升级到 `4.10.12`；本文选择的 `4.10.18` 已高于该安全下限。生产上线前仍要重新核对最新安全公告。

## 官方资料

- [JumpServer 官方文档](https://docs.jumpserver.org/zh/v4/)
- [JumpServer 官方 GitHub 仓库](https://github.com/jumpserver/jumpserver)
- [JumpServer v4.10.18 Release](https://github.com/jumpserver/jumpserver/releases/tag/v4.10.18)
- [JumpServer Installer v4.10.18 Release](https://github.com/jumpserver/installer/releases/tag/v4.10.18)
- [系统架构](https://docs.jumpserver.org/zh/v4/architecture/)
- [快速入门](https://docs.jumpserver.org/zh/v4/quick_start/)
- [Linux 高可用部署准备](https://docs.jumpserver.org/zh/v4/installation/setup_linux_lb/requirements/)
- [配置参数](https://docs.jumpserver.org/zh/v4/manual/env/)
- [备份与恢复](https://docs.jumpserver.org/zh/v4/installation/backup_recovery/)
- [迁移指南](https://docs.jumpserver.org/zh/v4/installation/migration/)
- [用户列表](https://docs.jumpserver.org/zh/v4/manual/admin/console/users/users/)
- [资产列表](https://docs.jumpserver.org/zh/v4/manual/admin/console/assets/assets_list/)
- [账号列表](https://docs.jumpserver.org/zh/v4/manual/admin/console/account_management/account_list/)
- [资产授权](https://docs.jumpserver.org/zh/v4/manual/admin/console/authorization_manage/assets_authorization/)
- [访问控制](https://docs.jumpserver.org/zh/v4/manual/admin/console/access_control/acls/)
- [会话记录](https://docs.jumpserver.org/zh/v4/manual/admin/audit/session_audit/session_record/)
- [会话命令](https://docs.jumpserver.org/zh/v4/manual/admin/audit/session_audit/session_command/)
- [存储设置](https://docs.jumpserver.org/zh/v4/manual/admin/system_settings/storage/)
- [安全设置](https://docs.jumpserver.org/zh/v4/manual/admin/system_settings/security/)
- [REST API 文档](https://docs.jumpserver.org/zh/v4/dev/rest_api/)

说明：本文按官方文档和官方发布包重新组织，不复制官方全文。版本、协议、企业版边界和安全要求会变化，生产变更前必须重新核对目标版本文档与 Release Notes。

## 官方知识地图

JumpServer 官方知识可以拆成七块：

```text
身份
  -> User / User Group / MFA / SSO / System Role

资源
  -> Asset / Node / Platform / Protocol / Account

授权
  -> User + Asset + Account + Protocol + Action + Validity
  -> ACL / Approval / Command Filter

连接
  -> Core / Koko / Lion / Chen / Magnus
  -> Lina / Luna / Nginx / Load Balancer

状态
  -> Database / Redis / SECRET_KEY
  -> Recording Storage / Command Storage

审计
  -> Login / Session / Command / File Transfer / Replay / Activity

运维
  -> Install / Health / Capacity / HA / Backup / Upgrade / API
```

本文学习顺序：

1. 先分清 JumpServer 用户、目标资产和资产账号。
2. 再理解一条授权规则究竟允许谁、何时、用什么方式访问什么。
3. 走完 SSH、RDP 和数据库访问的内部路径。
4. 在隔离环境部署固定版本，完成 SSH 访问和审计。
5. 故意写错 SSH 端口，用日志和网络证据定位。
6. 最后进入生产架构、状态、高可用、容量、安全、升级和面试。

## 场景开场

凌晨 02:10，一台数据库服务器被执行了高风险命令。

你知道是通过公司堡垒机进入的，但现在必须回答：

- 是哪个自然人登录？
- 他被哪条授权规则允许访问？
- 实际使用的是目标主机上的哪个账号？
- 登录来自什么 IP？
- 会话中执行了哪些命令、传了哪些文件？
- 录像有没有完整保存？
- 这条权限为什么在凌晨仍然有效？
- 账号密码有没有被用户直接看到？

如果只能回答“服务器日志里显示 root 登录过”，身份、授权、账号和操作之间就没有形成审计闭环。

## 一句话人话版

JumpServer 是受控的运维访问入口：先确认“你是谁、能访问什么”，再代理你连接目标资产，同时记录授权、命令、文件和会话证据。

## 小白可能会问

- JumpServer 用户和 Linux 用户是同一个账号吗？
- 有了 VPN，为什么还需要堡垒机？
- 用户不知道服务器密码，为什么仍然能登录？
- 录像开启了，是否就能证明所有操作？
- Koko、Lion、Core 分别做什么？
- 两台 JumpServer 放到负载均衡后就算高可用了吗？
- 命令过滤能不能替代 Linux 的 `sudo` 和 Kubernetes RBAC？
- JumpServer 是不是等保要求中必须购买的某个品牌？

## 为什么要学

JumpServer 位于身份与生产资产之间，连接安全、运维、审计、DevOps 和 AIOps：

```text
员工 / 外包 / 自动化身份
  -> 认证与 MFA
  -> 最小授权
  -> 受控连接
  -> 命令 / 文件 / 录像证据
  -> 告警与事件响应
  -> 权限回收与改进
```

岗位上真正需要的不是“会添加一台资产”，而是：

- 设计人员身份与资产账号分离。
- 解释授权决策和连接代理路径。
- 限制高风险账号、协议、文件传输和会话分享。
- 保护托管密码、SSH Key、Token 和 `SECRET_KEY`。
- 处理 Koko、Lion、数据库、Redis、录像存储和负载均衡故障。
- 证明审计记录完整、可查询、可恢复。
- 把异常访问变成 AIOps 检测和响应输入。

## JumpServer 是什么

JumpServer 是开源 PAM（Privileged Access Management，特权访问管理）平台，也常被称为堡垒机。

这里的 PAM 不是只保管密码，而是管理一条特权访问生命周期：

```text
识别用户
  -> 判断权限
  -> 选择资产账号
  -> 建立代理连接
  -> 约束操作
  -> 记录证据
  -> 结束会话
  -> 复核与回收
```

它不是目标 Linux、Windows、数据库或 Kubernetes 自身的权限系统。目标端的 `sudo`、本地账号、AD、数据库 GRANT 和 Kubernetes RBAC 仍然是最终安全边界。

## 它解决什么问题

### 自然人与共享账号无法对应

多人直接知道 `root` 密码时，目标主机通常只能记录 `root` 登录。JumpServer 先认证自然人，再代用或代理资产账号，建立“人 -> 授权 -> 资产账号 -> 会话”的映射。

### 权限散落且长期有效

资产授权可以限制用户、用户组、资产、节点、账号、协议、动作和有效期，让“只在变更窗口访问两台主机并禁止下载”成为明确规则。

### 密码到处复制

资产账号凭据集中托管后，用户不必直接看到明文。但“托管”会把 JumpServer 变成高价值目标，因此必须保护数据库、密钥、备份和管理员权限。

### 操作难以追溯

JumpServer 可以记录会话、命令、文件传输和活动，并保存录像。审计员可以按用户、资产、账号、来源地址和时间还原访问过程。

### 访问入口暴露过多

运维人员不再需要从办公网直接访问每台生产主机。网络可以收敛为“用户到 JumpServer、JumpServer 到资产”的受控路径。

## 核心术语

| 术语 | 人话解释 | 关键边界 |
|---|---|---|
| User | 登录 JumpServer 的自然人或服务身份 | 不等于目标资产账号 |
| Asset | 被纳管的 Linux、Windows、数据库、Kubernetes 等资源 | JumpServer 不自动拥有目标端权限 |
| Node | 组织资产的树形分组 | 节点授权会随节点内资产变化扩大 |
| Platform | 一类资产的协议和自动化能力模板 | 平台配置错误会影响整类资产 |
| Account | 登录目标资产使用的账号、密码、Key 或 Token | 属于高敏感数据 |
| Authorization | 用户访问资产的许可规则 | 要同时看账号、协议、动作和有效期 |
| Core | API、认证、授权和业务状态核心 | 其他连接组件依赖它 |
| Koko | 字符协议连接组件 | 主要处理 SSH、Telnet、SFTP、Kubernetes 等 |
| Lion | 社区版图形协议连接组件 | 主要处理 Web 端 RDP、VNC |
| Razor / XRDP | 图形客户端与远程桌面相关组件 | 当前安装器归入 X-Pack |
| Chen | Web 数据库访问组件 | 数据库 Web GUI 路径 |
| Magnus | 数据库客户端代理组件 | 当前安装器归入 X-Pack |
| Video | 录像转码组件 | 当前安装器归入 X-Pack |
| Lina | 管理 Web UI | 静态前端，不保存主业务状态 |
| Luna | Web Terminal 前端 | 把浏览器操作交给连接组件 |
| Celery | 异步任务执行组件 | 账号、资产等自动化任务依赖它 |
| Session | 一次受控资产连接 | 在线状态与历史审计要区分 |
| Recording | 会话录像 | 需要容量、完整性和保留策略 |
| Command Storage | 会话命令记录存储 | 默认数据库，也可配置 Elasticsearch |

当前 `v4.10.18` 官方安装器把服务分成两组：

| 分组 | 当前安装器中的服务 | 阅读边界 |
|---|---|---|
| 社区版常规服务 | `core`、`celery`、`koko`、`lion`、`chen`、`web` | 本文基础实验只依赖这组主链路 |
| X-Pack 服务 | `magnus`、`razor`、`xrdp`、`video`、`panda`、`nec`、`facelive` | 需要相应许可，并按目标版本实测 |

这张表描述的是 `v4.10.18` 安装器，而不是永远不变的产品承诺。架构文档里还可能看到 **Kael**：它曾承担 Kubernetes 等连接能力；官方 v4 升级说明已说明 Kael 能力并入 Koko，当前安装器没有独立 `kael` 服务。因此新架构图不应再把 Kael 当成默认独立组件，但排查旧集群时仍可能在历史配置和日志里见到它。

## 内部访问路径

### 一次 SSH 登录经过什么

```text
User Browser / SSH Client
  -> HTTPS / SSH 入口
  -> Nginx / Load Balancer
  -> Core 认证用户与 MFA
  -> Core 计算资产授权
  -> 生成短期连接上下文
  -> Koko 接收 SSH / Web Terminal 会话
  -> Koko 使用获准的 Asset Account 连接目标 SSH
  -> 双向转发终端输入输出
  -> 命令记录写 Database / Elasticsearch
  -> 录像写本地共享目录或对象存储
  -> Session 元数据进入审计
```

页面能登录，只能证明用户到 Core 的身份链路基本可用，不能证明 Koko、资产账号、目标 SSH、录像和命令存储都正常。

### 一次 RDP 登录经过什么

```text
Browser / JumpServer Client
  -> Core 身份与授权
  -> Lion / Razor 图形连接组件
  -> RDP / VNC Target
  -> 画面与输入回传
  -> Session Metadata + Recording
  -> Video 组件按需做录像格式转换
```

RDP 录像带宽和容量通常远高于字符终端。生产容量规划必须按协议分别测量，不能用 SSH 的经验估算所有会话。

### 一次数据库访问经过什么

```text
Browser SQL Console
  -> Chen
  -> Core Authorization
  -> Database Target

Native Database Client
  -> Magnus / Database Proxy
  -> Core Authorization
  -> Database Target
```

不同数据库类型、客户端代理、数据脱敏和高级审计能力存在社区版与企业版差异，选型时必须按目标版本实测。

### 授权决策不是一个“允许”按钮

一条资产授权至少要回答：

```text
谁
  + 哪些资产或节点
  + 哪些目标账号
  + 哪些协议
  + 哪些动作
  + 什么有效期
  -> 允许的访问集合
```

“用户 + 用户组”或“资产 + 节点”的组合可能扩大实际权限范围。节点内后来新增资产时，节点授权也可能把新资产带入授权范围，所以权限审计要检查最终展开结果，而不只看规则名称。

## 核心知识树

### User、MFA 与身份源

- **是什么**：User 是登录 JumpServer 的身份，可来自本地数据库、LDAP/AD 等身份源。
- **为什么需要**：把自然人或服务身份与目标端共享账号分开。
- **怎么工作**：Core 完成认证、MFA 和角色判断，再进入资产授权。
- **怎么看或怎么用**：控制台 > 用户管理，检查来源、用户组、系统角色、MFA、激活和失效日期。
- **坏了怎么查**：检查身份源可达性、时间同步、用户唯一字段、MFA、账号锁定、角色和失效日期。

身份认证回答“你是谁”，系统角色回答“你能管理 JumpServer 的什么”，资产授权回答“你能访问哪些目标”。三者不能混成一个管理员角色。

### Asset、Node 与 Platform

- **是什么**：Asset 是目标资源；Node 是资产树分组；Platform 描述协议和自动化能力。
- **为什么需要**：统一管理不同系统、网络设备、数据库和 Kubernetes。
- **怎么工作**：资产绑定平台、地址和协议，Node 提供批量组织与授权范围。
- **怎么看或怎么用**：资产管理 > 资产列表；系统设置 > 平台列表。
- **坏了怎么查**：检查 DNS/IP、协议端口、平台类型、字符编码、网络路径和自动化方法。

资产“创建成功”不等于目标“可连接”。至少还要验证 JumpServer 节点到目标地址和端口可达、资产账号有效、协议匹配。

### Account

- **是什么**：Account 是连接目标资产的用户名与密码、SSH Key 或 Token。
- **为什么需要**：让用户在不知道目标凭据明文时完成受控访问。
- **怎么工作**：Core 按授权选择允许的账号，把短期连接上下文交给连接组件。
- **怎么看或怎么用**：账号管理 > 账号列表，查看资产、用户名、密文类型、激活状态和特权账号标识。
- **坏了怎么查**：检查账号是否存在、密码或 Key 是否过期、目标端权限、加密密钥、协议和账号授权范围。

查看或导出密码属于高风险操作。官方默认查看账号密码需要再次验证 MFA；不要为了操作方便关闭这个保护。

### Asset Authorization

- **是什么**：把用户与资产、账号、协议、动作和有效期关联起来的规则。
- **为什么需要**：落实最小权限和临时授权。
- **怎么工作**：Core 展开用户组、节点和指定对象，计算当前会话允许的连接能力。
- **怎么看或怎么用**：资产管理 > 资产授权，检查最终用户、资产、账号、协议、动作和到期时间。
- **坏了怎么查**：检查必填集合是否为空、规则是否过期、对象是否被移动、账号是否包含、动作是否允许。

“能看到资产但不能连接”通常不是同一个问题：可能是账号没被授权、协议没选、动作被禁、ACL 拒绝或连接组件异常。

### Core

- **是什么**：JumpServer 的 API、认证、授权和业务状态核心。
- **为什么需要**：所有前端、连接组件和自动化任务需要统一业务判断。
- **怎么工作**：读取数据库状态、使用 Redis 协调缓存与任务，把授权结果交给连接组件。
- **怎么看或怎么用**：`/api/health/`、Core 日志、API 文档、数据库与 Redis 状态。
- **坏了怎么查**：检查进程、HTTP、数据库、Redis、迁移、`SECRET_KEY`、磁盘、连接池和错误日志。

Core 健康检查成功不等于资产连接健康；它只是整条链路的一层。

### Koko

- **是什么**：类 Unix 字符协议连接组件。
- **为什么需要**：代理 SSH、Telnet、SFTP、Kubernetes 和部分数据库字符连接。
- **怎么工作**：向 Core 注册，获得连接授权，连接目标并记录字符会话。
- **怎么看或怎么用**：`/koko/health/`、Koko 日志、2222/5000 等实际配置端口、在线会话。
- **坏了怎么查**：检查 Core 地址、组件 Access Key、Redis、目标网络、SSH 握手、账号、DNS 和文件权限。

多 Koko 部署时要设计会话共享和负载均衡；只复制容器但不处理 Redis、会话和 WebSocket，不等于可用。

### Lion、Razor 与 Video

- **是什么**：Lion/Razor 处理图形会话，Video 处理部分录像格式转换。
- **为什么需要**：浏览器或客户端要访问 Windows RDP/VNC，并留下回放证据。
- **怎么工作**：图形组件代理远程桌面数据流，同时输出会话和录像。
- **怎么看或怎么用**：`/lion/health/`、组件日志、在线会话、录像处理状态和对象存储。
- **坏了怎么查**：检查 RDP/VNC 网络、证书、分辨率、浏览器 WebSocket、录像目录、CPU、内存和 Video 队列。

图形会话对带宽、CPU 和录像存储更敏感，必须独立做并发压测。

在本文固定的 `v4.10.18` 安装器里，Lion 属于社区版常规服务，Razor、XRDP 与 Video 属于 X-Pack。看到相关组件名不等于当前社区版许可可用，容量和故障设计也要按实际启用的组件拆开。

### Chen 与 Magnus

- **是什么**：Chen 提供 Web 数据库访问，Magnus 提供原生数据库客户端代理。
- **为什么需要**：把数据库连接也纳入身份、授权和审计。
- **怎么工作**：接收 SQL 会话，向 Core 核验授权，再连接目标数据库。
- **怎么看或怎么用**：数据库资产、协议配置、Chen/Magnus 日志、SQL 会话和命令审计。
- **坏了怎么查**：检查数据库协议、TLS、驱动、目标权限、SQL 解析、字符集和版本支持。

不要假设“能代理 MySQL”就等于所有数据库功能、客户端和 SQL 都完全兼容。要用真实客户端、事务、长 SQL 和大结果集测试。

Chen 在当前安装器的社区版常规服务中；Magnus 在 X-Pack 服务组。数据库类型、客户端路径和审计能力必须用“版本 + 许可 + 协议 + 客户端”四个条件描述，不能只写“JumpServer 支持数据库”。

### Command Filter 与 ACL

- **是什么**：按用户、资产、账号和命令规则执行允许、拒绝、告警或审批的控制。
- **为什么需要**：在进入目标系统前增加风险门禁。
- **怎么工作**：高优先级规则先匹配，命中后执行相应动作；未命中按配置继续。
- **怎么看或怎么用**：访问控制 > 命令过滤，检查规则类型、内容、大小写和优先级。
- **坏了怎么查**：检查规则作用域、正则、优先级、协议是否支持命令解析、审批链和通知。

命令过滤不是终极隔离。Shell 可以通过脚本、编码、别名、解释器或已有程序间接执行动作；RDP 图形操作也不是普通 Shell 命令。目标端的最小权限、`sudo`、SELinux、数据库权限和 Kubernetes RBAC 仍必须存在。

### Session、Command 与 Recording

- **是什么**：Session 是连接元数据，Command 是字符操作记录，Recording 是可回放会话内容。
- **为什么需要**：回答谁在何时通过什么账号对什么资产做了什么。
- **怎么工作**：连接组件把会话元数据、命令和录像写入各自存储。
- **怎么看或怎么用**：审计台 > 会话记录 / 会话命令，检查来源 IP、用户、资产、账号、协议、时间、命令、文件和录像。
- **坏了怎么查**：区分会话记录、命令存储和录像存储；检查存储配置、容量、权限、网络、上传失败和保留策略。

存在 Session 记录但没有录像，不代表没有访问；录像可播放也不代表命令索引一定完整。审计健康要分别验证。

## 架构和数据流

### 最小学习架构

```text
Admin Browser
  -> Isolated Linux VM
      -> JumpServer Installer
          -> Core / Koko / Lion / Web
          -> Local PostgreSQL
          -> Local Redis
          -> Local Recording Storage

Test User
  -> JumpServer
  -> Separate Test Asset VM via SSH
```

最小环境用于学习，不满足生产高可用、数据保护和安全隔离。

### 常见生产架构

```text
Users / Admins / Auditors
  -> SSO + MFA
  -> WAF / Load Balancer / TLS
      -> JumpServer Node A
          -> Core / Koko / Lion / Chen
      -> JumpServer Node B
          -> Core / Koko / Lion / Chen

Shared State
  -> HA PostgreSQL / MariaDB
  -> HA Redis
  -> Object Storage / Ceph for recordings
  -> Elasticsearch for command search (optional)

Targets
  -> Production / Test network zones
  -> Linux / Windows / Database / Kubernetes
```

负载均衡要同时理解 HTTP、WebSocket、SSH 和数据库代理端口。第三方 LB 若忽略会话保持、WebSocket Upgrade、长连接空闲超时和真实源 IP，会出现“页面能开但终端频繁断线”。

### 信任域

至少拆分：

- 普通用户区、管理员区和审计员区。
- 办公网入口与 JumpServer 管理入口。
- JumpServer 应用节点与数据库、Redis、对象存储。
- JumpServer 到生产、测试、网络设备和数据库的出口。
- 社区版能力与企业版 X-Pack 能力。

JumpServer 是通往大量高权限资产的中枢，不应直接暴露公网，也不应和普通业务容器共享高权限宿主机。

## 状态与一致性

### 关系数据库

数据库保存用户、资产、账号、授权、会话元数据、配置和默认命令记录等核心状态。数据库备份是恢复的必要部分，但不是全部。

`v4.10.18` 安装器给出的外部数据库要求是 PostgreSQL `>= 16`、MySQL `>= 5.7` 或 MariaDB `>= 10.6`。这只是版本下限，不代表所有发行版、参数、字符集和高可用组件都已兼容；生产必须按目标版本文档与回归结果决定。

### Redis

`v4.10.18` 安装器要求 Redis `>= 6.0`。它不只是“丢了还能重建的缓存”：官方当前配置把 Celery 任务放在逻辑库 DB 3、缓存放在 DB 4、用户会话放在 DB 5、WebSocket 协调放在 DB 6。Redis 故障可能导致登录、异步任务、会话共享或 Web Terminal 异常；不能因为关系数据库正常就忽略 Redis，也不能把清空全部逻辑库当成无风险操作。

### `SECRET_KEY`

`SECRET_KEY` 用于加密和解密敏感字段。迁移与恢复必须保持旧环境的 `SECRET_KEY`，否则数据库虽然恢复，托管凭据也可能无法解密。

`BOOTSTRAP_TOKEN` 用于组件向 Core 注册，同样属于秘密。二者都不能提交到 Git、工单正文或普通日志。

### 录像与静态文件

官方默认静态数据位于 `/data/jumpserver`，包括录像、日志、证书和组件注册文件。多节点需要共享或对象存储，不能让每个节点只保存自己的一部分录像。

### 命令存储

会话命令默认可存数据库，也可以配置 Elasticsearch。切换存储前要验证历史查询、索引生命周期、备份和故障降级，不能把 Elasticsearch 当“加上就自动更快”。

### 一致恢复单元

```text
Database
  + SECRET_KEY / BOOTSTRAP_TOKEN
  + config.txt
  + Component registration keys
  + Recording / static files
  + Command storage
  + Exact JumpServer / installer version
  -> 可验证恢复
```

只恢复数据库但丢失录像，会出现审计元数据存在、录像打不开；只恢复录像但数据库不是同一时间点，会出现文件无法关联。

## 安装与启动

### 实验前提

- 一台全新、隔离的 64 位 Linux 虚拟机。
- 至少 4 核 CPU、8 GB 内存；预留足够磁盘。
- 可以访问 GitHub 和容器镜像仓库。
- 一台独立的测试 Linux 资产。
- 防火墙只允许你的管理 IP 访问实验端口。
- 禁止复用生产数据库、Redis、域账号或真实生产密码。

Windows 和 macOS 不直接运行官方 Linux Installer。可以在 Linux 虚拟机中学习。

当前社区版离线包 `jumpserver-ce-v4.10.18-x86_64.tar.gz` 面向 `linux/amd64`。ARM64、国产化系统或其他架构不能仅凭“Docker 能运行”就假定离线包兼容，必须查看目标版本发布资产并完成真实协议回归。

### 下载固定安装器

在 JumpServer Linux 实验机执行：

```bash
cd /tmp

wget \
  https://github.com/jumpserver/installer/releases/download/v4.10.18/jumpserver-installer-v4.10.18.tar.gz

wget \
  https://github.com/jumpserver/installer/releases/download/v4.10.18/jumpserver-installer-v4.10.18.tar.gz.md5

md5sum -c jumpserver-installer-v4.10.18.tar.gz.md5
```

预期：

```text
jumpserver-installer-v4.10.18.tar.gz: OK
```

MD5 只能发现传输损坏，不是现代供应链签名。生产还要从官方 Release 页面核对下载地址，并记录镜像 Digest、下载时间和审批记录。

### 解压并安装

```bash
sudo tar -xf jumpserver-installer-v4.10.18.tar.gz -C /opt
cd /opt/jumpserver-installer-v4.10.18

sudo ./jmsctl.sh install
sudo ./jmsctl.sh start
sudo ./jmsctl.sh status
```

安装过程会交互式生成 `/opt/jumpserver/config/config.txt` 并拉取组件镜像。预期 `status` 中 Core、Koko、Web、数据库和 Redis 等必要组件处于运行状态。

官方快速脚本会把安装器下载到 `/opt` 后执行 `install` 与 `start`。学习时手动拆开步骤，更容易固定版本、校验文件和保存配置证据。

### 第一次登录

浏览器访问：

```text
http://<jumpserver-lab-ip>/
```

官方默认初始账号为 `admin`，初始密码为 `ChangeMe`。首次登录必须立刻修改，实验环境也不能暴露公网。

## 配置详解

核心配置通常位于：

```text
/opt/jumpserver/config/config.txt
```

关键字段：

| 字段 | 作用 | 生产注意 |
|---|---|---|
| `SECRET_KEY` | 加解密敏感字段 | 备份、分权保存，迁移时保持一致 |
| `BOOTSTRAP_TOKEN` | 组件注册 Core | 不能公开，注册流程结束后仍按秘密管理 |
| `LOG_LEVEL` | 日志详细度 | 生产通常避免长期 DEBUG |
| `DB_ENGINE` | 数据库类型 | 与目标版本支持矩阵一致 |
| `DB_HOST` / `DB_PORT` | 数据库地址与端口 | 生产使用 HA 数据库和 TLS |
| `REDIS_HOST` / `REDIS_PORT` | Redis 地址与端口 | 生产使用认证、隔离和高可用 |
| `HTTP_PORT` | Web 入口端口 | 生产由 TLS LB / 反向代理暴露 |
| `DOMAINS` | 受信访问域名 | 域名、端口和代理配置要一致 |
| `KOKO_SSH_PORT` | Koko SSH 入口 | LB、防火墙和客户端必须一致 |
| `SESSION_COOKIE_AGE` | 空闲会话有效期 | 按风险设定，不能无限放大 |
| `SESSION_EXPIRE_AT_BROWSER_CLOSE` | 关闭浏览器后是否过期 | 结合会话安全策略评估 |
| `CLIENT_MAX_BODY_SIZE` | 请求体上限 | 影响文件上传和反向代理限制 |

修改配置前先备份，并按官方要求停止或维护窗口变更。不要把完整 `config.txt` 直接提交 Git，因为其中包含秘密。

## 命令、页面与 API 字典

| 名称 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `jmsctl.sh status` | 查看组件状态 | `sudo ./jmsctl.sh status` | 必要容器运行 | 只看 Running，不看健康与依赖 |
| `jmsctl.sh tail` | 查看组件日志 | `sudo ./jmsctl.sh tail koko` | 持续输出 Koko 日志 | DEBUG 日志可能包含敏感上下文 |
| `jmsctl.sh restart` | 重启服务 | `sudo ./jmsctl.sh restart` | 组件重新运行 | 未评估在线会话和爆炸半径 |
| `jmsctl.sh backup_db` | 备份数据库 | `sudo ./jmsctl.sh backup_db` | 生成备份文件 | 不包含全部录像和密钥 |
| `jmsctl.sh restore_db` | 恢复数据库 | `sudo ./jmsctl.sh restore_db <file>` | 数据恢复 | 必须匹配配置、密钥和静态文件 |
| Core Health | 检查 Core | `GET /api/health/` | 返回健康响应 | 不代表 Koko、Lion、资产正常 |
| Koko Health | 检查 Koko | `GET /koko/health/` | 返回健康响应 | LB 可能没有正确路由 |
| Lion Health | 检查 Lion | `GET /lion/health/` | 返回健康响应 | 图形会话仍可能受 RDP 网络影响 |
| API Docs | 查看当前实例 API | `GET /api/docs/` | Swagger 页面 | 文档与当前实例权限有关 |
| Session Audit | 查在线/历史会话 | 审计台 > 会话记录 | 可见来源、资产和时间 | 录像与命令要分别验证 |
| Command Audit | 查询命令 | 审计台 > 会话命令 | 可查询命令和结果 | GUI 操作不能等同 Shell 命令 |

### API 认证

JumpServer 官方 API 支持 Session、临时 Token、Private Token 和 Access Key。生产自动化优先：

1. 创建专用服务身份。
2. 只授予需要的 API 权限。
3. 使用短期 Token 或受控 Access Key。
4. 把密钥放入 Secret Manager。
5. 记录调用来源、对象和结果。
6. 定期轮换并验证旧密钥失效。

永久 Token 泄露后的风险很高。不要在命令历史、截图、CI 日志或学习仓库中放真实 Token。

## 可观测性

### 五层证据

| 层 | 观察什么 | 常见证据 |
|---|---|---|
| 入口 | TLS、HTTP、WebSocket、SSH、源 IP | LB 日志、Nginx 日志、连接数 |
| Core | 登录、授权、API、Celery | Core 日志、`/api/health/`、任务状态 |
| Connector | SSH、RDP、数据库代理 | Koko/Lion/Chen/Magnus 日志与健康接口 |
| State | DB、Redis、录像、命令存储 | 连接池、延迟、容量、写入失败 |
| Target | 目标协议和账号 | SSH/RDP/DB 日志、认证失败、网络探测 |

### 推荐指标

- 登录成功率、失败率、MFA 失败和锁定数量。
- 资产连接成功率、失败分类和连接建立 p95。
- SSH、RDP、数据库并发会话数。
- Koko、Lion、Chen/Magnus 实例健康和重启次数。
- Core API 延迟、错误率、Celery 任务积压。
- 数据库连接池、慢查询、CPU、磁盘延迟和容量。
- Redis 延迟、连接数、内存、驱逐与主从/集群状态。
- 录像写入成功率、上传延迟、不可播放率和剩余容量。
- 命令索引写入失败、查询延迟和索引容量。
- 高风险命令、非工作时间访问、异常来源 IP 和大文件传输。
- 即将过期的授权、长期未使用权限和孤儿账号。

### SLI / SLO 示例

不要只定义“页面可访问”。更接近用户体验的 SLI：

```text
Asset Connection Success Rate
  = 成功建立并保持到验证点的会话数 / 有效连接尝试数

Audit Completeness
  = 同时具备 Session 元数据和应有审计对象的会话数 / 已结束会话数
```

健康接口成功但资产连接失败时，第一项 SLI 会真实下降；Session 存在但录像写入失败时，第二项会暴露审计缺口。

## 容量与性能

### 先按协议拆容量

| 类型 | 主要瓶颈 |
|---|---|
| SSH / SFTP | Koko 并发、网络、命令记录、文件传输 |
| RDP / VNC | Lion/Razor CPU、内存、带宽、录像 |
| Web 数据库 | Chen 内存、SQL 解析、结果集和目标数据库 |
| 原生数据库代理 | Magnus 连接数、协议和目标端限制 |
| 自动化任务 | Celery、数据库、目标端并发和网络 |

### 录像容量

粗估公式：

```text
Daily Recording
  ≈ Average Concurrent Sessions
  × Measured Average Recording Rate
  × 86400 seconds
```

再乘保留天数、压缩系数、副本和增长余量。平均码率必须从真实协议、分辨率和操作类型测量，不能凭空给一个统一数字。

### 数据库和 Redis

资产数不是唯一容量指标。还要看：

- 用户、账号和授权规则数量。
- 每秒登录和连接建立。
- 并发在线会话。
- 每个会话的命令和文件事件。
- Celery 自动化任务数量。
- 审计查询范围与索引。
- 权限展开和节点变更频率。

### 扩容原则

1. 先测连接建立时间、在线并发和资源曲线。
2. 按协议扩对应 Connector。
3. 检查 LB、数据库、Redis、对象存储是否已成为新瓶颈。
4. 小批扩容并观察。
5. 保留回滚和限流。

只加 Koko 容器不会自动扩大数据库、Redis、目标 SSH 和网络容量。

## 安全

### 身份

- 管理员、审计员和普通用户职责分离。
- 接入企业身份源并启用 MFA。
- 禁止共享 JumpServer 管理员账号。
- 用户设置失效日期，离职和外包到期自动回收。
- 服务身份与人类身份分开。

### 授权

- 以用户组、资产节点、指定账号和协议做最小授权。
- 上传、下载、剪贴板和会话分享默认从关闭开始评估。
- 临时变更使用明确有效期。
- 节点新增资产后重新计算节点授权爆炸半径。
- 定期找长期未用权限和离职用户残留授权。

### 凭据

- `SECRET_KEY`、`BOOTSTRAP_TOKEN`、资产密码、SSH Key、Token 分级管理。
- 不把完整配置和备份放在同一低权限位置。
- 查看、导出资产密码保留 MFA 和审计。
- 外部备份加密并控制下载。
- 生产优先短期凭据和可轮换账号。

### 网络

- 管理入口不直接暴露公网。
- TLS 在受控 LB 或 JumpServer 入口终止。
- 保留真实来源 IP。
- JumpServer 到资产采用最小目的网段和端口。
- 数据库、Redis、对象存储只允许应用节点访问。
- WebSocket 与长连接超时要显式配置。

### 容器与宿主机边界

`v4.10.18` 官方 Installer 的 Core Compose 配置会挂载宿主机 `/var/run/docker.sock`。这个 Socket 能控制 Docker 守护进程，获得它通常意味着可以进一步控制宿主机，因此不能把 Core 当成与宿主机完全隔离的普通容器：

- JumpServer 节点应使用专用、高信任等级的宿主机，不与普通业务容器混部。
- 严格限制主机登录、Docker 组成员、Compose 文件和 Socket 权限。
- 监控 Core 容器异常创建容器、挂载宿主目录和调用 Docker API 的行为。
- 漏洞处置要同时评估 JumpServer 应用、容器运行时和宿主机的爆炸半径。
- 若要改变官方挂载方式，先验证安装、升级、任务和组件管理功能，不能直接删除后假定无影响。

### 审计边界

- 录像不是目标系统日志的替代品。
- 命令过滤不是 Shell 安全沙箱。
- 加密隧道、脚本、GUI、数据库存储过程可能降低命令级可见性。
- JumpServer、目标系统、身份源和网络设备日志要进入统一时间线。
- 所有节点必须时间同步。

### 社区版与企业版

文章和方案必须把功能写成三类：

1. 当前社区版已验证。
2. 官方标注 X-Pack / 企业版。
3. 尚未在目标许可证和版本验证。

账号改密、组织角色、高级审批、数据脱敏和部分数据库能力不能模糊描述为所有版本都有。

## 高可用与灾难恢复

### 高可用不是两台 Web

生产高可用至少包括：

```text
Load Balancer
  + Multiple JumpServer Nodes
  + HA Database
  + HA Redis
  + Shared / Object Recording Storage
  + Command Storage
  + Consistent Secrets and Config
  + Tested Failover
```

官方高可用参考允许按需要扩 JumpServer 节点并加入 HAProxy，同时明确数据库、Redis、NFS/对象存储要有自己的高可用设计。单台 NFS 仍是单点，生产应使用高可用 NFS、Ceph 或受支持的对象存储。

### 故障域

- JumpServer 应用节点故障。
- LB 或 DNS 故障。
- 数据库主节点故障。
- Redis 故障或会话共享异常。
- 录像对象存储不可写。
- Elasticsearch 不可用。
- JumpServer 到某个生产网段断开。
- 身份源或 MFA 服务不可用。

每种故障的“页面是否可打开、已有会话是否继续、新会话是否允许、审计是否完整”都不同。

### RPO 与 RTO

设计要回答：

- 用户、资产、授权最多允许丢失多久？
- 会话录像和命令记录是否允许丢失？
- `SECRET_KEY` 丢失后如何恢复？
- 数据库与录像快照如何保持时间点对应？
- 多久能恢复登录和关键资产访问？
- 恢复期间是否启用紧急访问流程？
- 紧急访问如何事后补审计？

## 备份与恢复

### 备份对象

- JumpServer 关系数据库。
- `/opt/jumpserver/config/config.txt`。
- `SECRET_KEY` 与必要组件注册材料。
- `/data/jumpserver` 中的录像、日志和静态文件。
- 外部对象存储配置与数据保护策略。
- Elasticsearch 命令索引或可重建策略。
- 当前 JumpServer、Installer 与镜像版本。
- LB、TLS、DNS 和防火墙配置。

### 数据库备份

```bash
cd /opt/jumpserver-installer-v4.10.18
sudo ./jmsctl.sh backup_db
```

命令成功只证明生成了数据库备份，不证明录像、密钥和配置可恢复。

### 恢复演练

在隔离环境：

1. 准备相同版本安装器和依赖。
2. 恢复配置与 `SECRET_KEY`。
3. 恢复数据库。
4. 恢复同一时间点的静态文件或对象存储。
5. 恢复命令存储。
6. 启动并检查 Core、Koko、Lion。
7. 验证身份、授权和资产列表。
8. 用无副作用测试资产建立会话。
9. 验证命令记录和录像可回放。
10. 记录实际 RTO、缺失对象和人工步骤。

备份成功不等于恢复成功。

## 升级与回滚

### 升级前

1. 阅读目标版本和跨越版本的 Release Notes。
2. 核对社区版、企业版和插件/组件兼容。
3. 记录当前版本、镜像、数据库、Redis、存储和 LB。
4. 备份数据库、配置、密钥、录像和命令存储。
5. 在隔离环境恢复生产备份。
6. 用目标版本执行升级演练。
7. 回放 SSH、RDP、数据库、文件传输、命令过滤、API 和审计。
8. 定义维护窗口、在线会话处理和失败标准。

### 执行

官方集群升级流程要求先停止所有 JumpServer 节点，再选择一个节点执行首轮升级；数据库迁移和版本切换期间不应混跑新旧应用节点。它是有维护窗口的集群升级，不应宣传为滚动零停机。恢复其他节点前，先验证首节点的数据库迁移、Core 健康、测试资产访问和审计写入。

```text
进入维护窗口并停止所有 JumpServer 节点
  -> 记录在线会话
  -> 完成一致备份
  -> 选择一个节点更新 Installer / Images
  -> 执行数据库迁移并验证首节点
  -> 检查 Core / Koko / Lion / Chen 与审计写入
  -> 小范围测试资产
  -> 再升级并启动其余节点
  -> 逐步恢复入口
  -> 观察连接与审计
```

### 回滚

真正的回滚单元：

```text
Old JumpServer / Images
  + Pre-upgrade Database
  + Matching SECRET_KEY and Config
  + Matching Recording / Command Storage
  -> Verified Rollback
```

只把容器镜像标签改回旧版，可能无法读取已经迁移的数据库。升级期间产生的新会话和授权如何处理，也要在回滚计划中说明。

### `SECRET_KEY` 不能顺手重置

迁移和升级必须保持旧环境 `SECRET_KEY`。如果把它当普通随机配置重新生成，恢复出的资产凭据可能无法解密。

## 在 AIOps 中的作用

### 异常访问检测

可把以下事件送入安全分析或 AIOps 平台：

- 非工作时间首次访问关键资产。
- 新来源 IP、高风险地区或异常设备登录。
- 用户短时间访问大量资产。
- 高风险账号或 `root` 使用激增。
- 会话时长明显偏离个人和团队基线。
- 大文件上传下载。
- 命令过滤拒绝和审批异常。
- 录像写入失败或审计缺口。

异常只是调查线索，不应仅凭模型分数自动中断所有生产会话。

### 变更与事故关联

```text
Application Alert
  -> Find Deployment / Change Window
  -> Query JumpServer Sessions
  -> Correlate User + Asset + Account + Command + File
  -> Compare Target Logs
  -> Form Hypothesis
  -> Verify with Rollback or State Check
```

时间接近不等于因果。仍需目标系统日志、配置差异和修复结果共同验证。

### 权限治理

AIOps 可以生成候选：

- 90 天未使用的资产授权。
- 已离职用户仍有效的账号。
- 长期不过期的外包权限。
- 节点授权意外扩张。
- 无 Owner 的资产账号。
- 录像或命令审计不完整的资产类型。

自动回收高权限前必须有 Owner、审批、影响评估和回滚。

## 基础实验：完成 SSH 访问与审计闭环

### 实验目标

在隔离环境完成：

```text
创建测试用户
  -> 创建测试资产与账号
  -> 创建最小授权
  -> 通过 JumpServer 登录
  -> 执行无副作用命令
  -> 在审计台找到会话、命令和录像
```

### 实验边界

- 只使用可销毁的 JumpServer VM 和测试资产 VM。
- 不使用生产账号、生产网段或真实公司身份源。
- 测试用户不授予 JumpServer 管理员权限。
- 命令只读，不执行删除、改密和系统配置变更。

### 第一步：准备测试资产

在独立 Ubuntu 测试资产：

```bash
sudo apt-get update
sudo apt-get install -y openssh-server
sudo systemctl enable --now ssh

sudo useradd -m -s /bin/bash js-lab
sudo passwd js-lab

ip address
sudo ss -lntp | grep ':22'
```

为 `js-lab` 设置只用于实验的密码。预期看到 SSH 监听 `:22`，并记录测试资产私网 IP。

### 第二步：创建 JumpServer 测试用户

控制台：

```text
用户管理
  -> 用户列表
  -> 创建
```

建议：

- 用户名：`lab-user`
- 使用独立邮箱或本地实验信息。
- 开启 MFA。
- 系统角色只给普通用户。
- 设置短失效日期。

### 第三步：创建资产与账号

```text
资产管理
  -> 资产列表
  -> 创建 Linux 资产
```

填写：

- 名称：`ubuntu-ssh-lab`
- 地址：测试资产私网 IP
- 平台：Linux
- 协议：SSH
- 端口：22
- 账号：`js-lab`
- 密码：刚才设置的实验密码

先执行连接性测试。正常结果是资产 SSH 可达、账号认证成功。

### 第四步：创建最小授权

```text
资产管理
  -> 资产授权
  -> 创建
```

填写：

- 用户：`lab-user`
- 资产：`ubuntu-ssh-lab`
- 账号：只选择 `js-lab`
- 协议：只选择 SSH
- 动作：只保留连接；按实验需要决定是否允许上传下载
- 有效期：当天实验窗口

### 第五步：登录并执行只读命令

使用 `lab-user` 登录 Web Terminal，连接 `ubuntu-ssh-lab`：

```bash
whoami
hostname
date --iso-8601=seconds
id
```

预期：

- `whoami` 返回 `js-lab`。
- `hostname` 是测试资产名称。
- 会话可以正常退出。
- 用户不知道目标账号密码明文也能访问。

### 第六步：验证审计

用审计员或实验管理员进入：

```text
审计台
  -> 会话记录
  -> 历史会话
```

验证：

1. JumpServer 用户是 `lab-user`。
2. 资产是 `ubuntu-ssh-lab`。
3. 账号是 `js-lab`。
4. 来源 IP、开始时间、结束时间正确。
5. 会话命令包含四条只读命令。
6. 录像能打开并定位到对应时间。

### 第七步：保存证据

保存：

- 版本与 Installer 校验结果。
- `jmsctl.sh status`。
- 资产和授权截图，隐藏密码。
- SSH 会话成功截图。
- 会话记录、命令和录像截图。
- 一份身份到资产账号的映射说明。

### 如果没有成功

按顺序检查：

1. Core、Koko 和 Web 是否健康。
2. JumpServer 节点能否访问测试资产 IP:22。
3. 资产平台、协议和端口是否正确。
4. `js-lab` 密码是否有效。
5. 授权是否包含用户、资产、账号、协议和连接动作。
6. 授权是否过期。
7. Koko 日志是否有网络、SSH 握手或认证错误。
8. 录像存储是否可写。

### 清理

先导出学习证据，再按依赖顺序删除：

```text
资产授权
  -> 测试资产账号
  -> 测试资产
  -> 测试用户
```

最后销毁两台实验虚拟机。不要在共享或生产 JumpServer 上执行安装器的 `uninstall` 或手工删除 `/data/jumpserver`。

## 故障注入实验：SSH 端口错误导致资产连接失败

### 实验目标

把测试资产端口从 22 临时改成 2223，保存现象、网络与 Koko 证据，再恢复为 22。

### 前提

- 基础实验成功。
- 只有 `ubuntu-ssh-lab` 一个测试资产受影响。
- 已截图保存正常连接基线。
- 没有生产会话。

### 第一步：保存健康基线

```bash
sudo ss -lntp | grep ':22'
```

在 JumpServer 中再次完成一次成功连接，并记录时间。

### 第二步：注入错误

编辑 `ubuntu-ssh-lab`：

```text
SSH Port: 22 -> 2223
```

不要修改测试资产真实 SSH 服务。

### 第三步：观察现象

执行资产连接性测试，再尝试登录。

预期：

- JumpServer 页面仍可登录。
- 目标资产连接失败或超时。
- Core 健康接口仍可能正常。
- Koko 日志出现连接目标 `:2223` 失败。

查看日志：

```bash
cd /opt/jumpserver-installer-v4.10.18
sudo ./jmsctl.sh tail koko
```

只截取错误时间附近的日志，避免把 Token、账号或其他会话信息公开。

### 第四步：建立证据链

从 JumpServer 节点执行：

```bash
nc -vz <test-asset-ip> 2223
nc -vz <test-asset-ip> 22
```

预期：

- 2223 连接失败。
- 22 连接成功。

证据支持“资产端口配置错误”，而不是“JumpServer 整体宕机”或“密码错误”。

### 第五步：修复

把资产 SSH 端口恢复为 22，重新执行连接性测试和登录。

### 第六步：验证

- Koko 不再连接 2223。
- 资产连接成功。
- `whoami` 仍返回 `js-lab`。
- 新会话命令和录像完整。
- 其他实验资产未受影响。

### 爆炸半径与回滚

本实验只改一个测试资产元数据。若生产批量修改 Node、Platform 或导入模板，爆炸半径可能扩展到同类全部资产。生产批量变更必须：

1. 导出旧配置。
2. 先选一台金丝雀资产。
3. 定义连接成功率和回滚阈值。
4. 分批执行。
5. 保留变更审计。

### 清理与复盘

- 确认端口已恢复 22。
- 删除失败测试会话，或保留为脱敏学习证据。
- 记录为什么页面健康不能证明资产链路健康。
- 为 Connection Failure 按网络、端口、账号、授权、协议建立分类。

### 如果没有得到预期结果

- 2223 也能连接：目标可能已有服务监听，换一个确认未监听的高端口。
- 22 也不能连接：先恢复基础实验，不要继续注入。
- 没有 Koko 日志：检查当前连接是否走 Koko、日志级别和时间窗口。
- 修复后仍失败：检查缓存、资产保存结果、账号授权和目标 `sshd`。

## 常见故障排查

### 页面能打开，SSH 全部失败

按顺序：

1. `/koko/health/`。
2. Koko 是否注册到 Core。
3. LB 的 SSH/WebSocket 路由。
4. Koko 到目标网段的 DNS、路由和防火墙。
5. 资产账号与 SSH 算法。
6. 最近 Koko、网络和 Platform 变更。

不要先重启所有节点，否则会扩大在线会话影响并丢失现场。

### 用户看不到资产

检查：

- 用户和用户组。
- 资产和 Node。
- 授权规则有效期。
- 指定 Account。
- Protocol 与 Action。
- 组织边界是否属于企业版配置。
- 用户是否激活。

### 能看到资产但提示无可用账号

授权可能只包含资产，没有包含正确 Account；也可能账号已停用、资产关联变化或账号类型不支持当前协议。

### RDP 频繁断开

检查 Lion/Razor 健康、WebSocket、LB 空闲超时、RDP 网络、目标系统许可、分辨率、带宽、录像存储和节点 CPU/内存。

### 会话存在但录像打不开

检查录像文件或对象存储、文件权限、上传错误、Video 处理、数据库元数据关联、保留策略和恢复时间点。

### 命令审计查不到新数据

检查默认数据库或 Elasticsearch 配置、索引写入、磁盘、权限、连接组件日志和协议是否支持命令解析。

### 恢复后所有资产账号认证失败

优先核对恢复的 `SECRET_KEY` 是否与数据库匹配。不要尝试批量覆盖所有资产密码来掩盖密钥恢复错误。

### Redis 故障后会话异常

检查 Redis 连接、认证、延迟、内存和高可用状态，再区分新登录、会话共享、Celery 任务与现有连接的影响。

### 升级后 Chen 长 SQL 或多会话异常

保存目标版本、请求大小、SQL 长度、并发和 Chen 内存。`v4.10.18` 官方改进了长 SQL 解析分块和多会话内存，并修复多项 Chen 问题，但仍要用自己的数据库与 SQL 回归。

## 事故场景：负载均衡变更后所有终端间歇断线

### 现象

- 管理页面和登录大多正常。
- SSH Web Terminal 和 RDP 每隔数分钟断开。
- 直接访问单节点较稳定。
- 故障从 LB 配置变更后开始。

### 证据顺序

1. 保存 LB、Nginx、Core、Koko/Lion 的时间线。
2. 对比 HTTP、WebSocket、SSH 和 RDP 连接失败比例。
3. 检查 LB WebSocket Upgrade、空闲超时和会话策略。
4. 检查真实源 IP 是否保留。
5. 直连单节点做无副作用对照。
6. 检查 Connector 重启、Redis 和目标网络。
7. 记录受影响协议、节点和用户。

### 假设

- LB 空闲超时小于终端心跳间隔。
- WebSocket Upgrade 头丢失。
- 长连接被随机切到不同后端。
- SSH 入口没有按 TCP 转发。
- Redis 会话共享异常。

### 处置

1. 暂停继续修改 LB。
2. 将少量测试用户切到已知健康入口。
3. 恢复变更前超时与 WebSocket 配置。
4. 验证 SSH、RDP 和数据库三类连接。
5. 逐步恢复流量。
6. 对断线期间的审计完整性做专项检查。

### 爆炸半径与回滚

LB 回滚会影响所有入口连接。先告知在线用户并确认高风险会话状态；不能只看页面恢复，还要验证目标端是否残留未结束操作。

### 复盘

- 为什么 LB 变更没有真实长连接回归？
- 是否有连接时长和异常断开率告警？
- 是否保留了一条绕过故障 LB 的紧急受控入口？
- 回滚是否同时覆盖 HTTP、WebSocket 和 TCP？
- 断线后录像和命令是否仍完整？

## 生产系统设计题

题目：为 5000 台资产、800 个运维用户、峰值 400 个 SSH 会话和 80 个 RDP 会话设计 JumpServer，审计保留 180 天，并接入 SSO、MFA、SIEM 和变更审批。

回答主线：

1. 盘点资产类型、协议、网络区域、并发、文件传输和保留要求。
2. 用户从 SSO 进入并启用 MFA，管理员、审计员、普通用户分权。
3. 资产按环境和信任域建 Node，授权到指定 Account、Protocol、Action 和有效期。
4. HTTPS、WebSocket、SSH 和数据库代理经过明确支持长连接的 LB。
5. 部署多 JumpServer 节点，按 SSH、RDP、数据库实际压力扩 Connector。
6. 使用 HA 数据库、HA Redis 和受支持的共享/对象录像存储。
7. 命令量大时评估 Elasticsearch，同时设计索引生命周期和恢复。
8. 按实测码率估算 180 天录像容量、副本和增长。
9. JumpServer 到目标资产按网段和协议做最小网络访问。
10. `SECRET_KEY`、资产凭据和备份分权保存。
11. 建立连接成功率、异常断开、录像完整性和审计延迟 SLO。
12. 高风险访问事件进入 SIEM/AIOps，但自动阻断带人工护栏。
13. 用固定版本、备份恢复、金丝雀资产和多协议回归完成升级。
14. 定期演练应用节点、数据库、Redis、对象存储和 LB 故障。

## 选型取舍

| 场景 | JumpServer 的优势 | 需要额外评估 |
|---|---|---|
| 开源堡垒机与 PAM 主线 | 身份、资产、代理和审计一体化 | 企业功能、支持与合规责任 |
| 大量 Linux / SSH | Koko 和 Web/SSH 入口 | 命令过滤绕过、SFTP 与并发 |
| Windows / RDP | 图形会话与录像 | 带宽、录像容量和客户端兼容 |
| 数据库运维 | Web 与代理接入 | 数据库类型、SQL 兼容和版本边界 |
| 多组织与复杂审批 | 可扩展的授权模型 | 部分能力属于 X-Pack |
| 云原生短期访问 | 可纳管 Kubernetes 和资产 | 与云 IAM、零信任、短期凭据的集成 |

和 VPN 相比，JumpServer 更关注“访问哪个资产、使用哪个账号、做了什么”；VPN 更关注建立网络通道。二者可以组合。

和目标端 `sudo`、RBAC 相比，JumpServer 是入口与审计层；目标端权限是最终执行层。不能二选一。

和商业 PAM 相比，要比较账号发现与轮换、审批、会话控制、应用覆盖、灾备、合规认证、厂商支持、API 和总运维成本，而不只比较许可证价格。

## 面试怎么讲

### 30 秒版本

JumpServer 是开源 PAM 和堡垒机平台。它把自然人身份、资产、目标账号、授权规则和会话审计关联起来，由 Core 做认证授权，Koko/Lion/Chen 等组件代理 SSH、RDP 和数据库访问。生产上重点保护数据库、`SECRET_KEY`、Redis 和录像存储，并监控连接成功率与审计完整性。

### 3 分钟版本

用户先通过 SSO/密码和 MFA 登录 Core。Core 根据用户或用户组、资产或节点、Account、Protocol、Action 和有效期计算权限。SSH 会话交给 Koko，RDP 交给 Lion/Razor，Web 数据库交给 Chen；连接组件再用获准的目标账号访问资产，并把 Session、Command、File Transfer 和 Recording 写入数据库、命令存储和对象存储。

因此页面健康不等于访问链路健康。SSH 失败要按 Core 授权、Koko、LB、目标网络、资产账号和协议逐层取证。生产高可用也不是两台 Web，而是多应用节点加 HA 数据库、HA Redis、共享或对象录像存储、正确的长连接 LB 和恢复演练。

安全上我会区分 JumpServer 用户与资产账号，启用 MFA、最小授权和短有效期；命令过滤只是一层门禁，目标端 `sudo`、数据库权限和 Kubernetes RBAC 仍要收紧。升级回滚必须带上版本、数据库、`SECRET_KEY`、配置、录像和命令存储，不能只回退镜像。

## 面试题与递进追问

### 1. JumpServer 用户和资产账号有什么区别？

参考答案：JumpServer 用户代表自然人或服务身份；资产账号是在目标 Linux、Windows、数据库或 Kubernetes 上真正执行操作的账号。授权把二者关联，审计要同时记录。

继续追问：

- 多人使用同一个 `root`，如何追到自然人？
- 为什么不应该把资产密码直接发给用户？
- 同名账号与托管账号有什么取舍？
- 服务身份如何避免冒充自然人？

### 2. SSH 连接的完整路径是什么？

参考答案：用户进入入口，Core 完成认证与授权，Koko 获得连接上下文并使用允许的资产账号连接目标 SSH，同时保存会话、命令和录像。

继续追问：

- 页面能开但 SSH 失败先看哪里？
- Koko 到 Core 与 Koko 到资产分别用什么证据？
- LB 为什么会让 Web Terminal 断线？
- SFTP 的风险和普通命令有什么不同？

### 3. 一条资产授权包含哪些维度？

参考答案：用户/用户组、资产/节点、Account、Protocol、Action、开始与失效时间；高级 ACL 还可能看来源 IP、时间和审批。

继续追问：

- 节点授权为什么会静默扩权？
- 用户与用户组同时选择如何复核？
- 用户看见资产但没有账号怎么查？
- 如何设计临时生产变更权限？

### 4. JumpServer 如何实现高可用？

参考答案：多个 JumpServer 节点经过支持长连接的 LB，状态外置到 HA 数据库、HA Redis、共享或对象录像存储和命令存储，同时保持配置与密钥一致，并做真实协议故障演练。

继续追问：

- 两台应用节点共用单台数据库算 HA 吗？
- 单台 NFS 有什么问题？
- Redis 故障影响哪些路径？
- 已有会话和新会话的可用性是否相同？

### 5. 录像为什么不是完整安全证明？

参考答案：录像可能缺失、不可播放或无法反映加密隧道和间接操作；字符命令、GUI、文件和目标系统状态的可见性也不同。要把 Session、Command、Recording、目标日志和变更证据关联。

继续追问：

- 如何定义 Audit Completeness？
- 录像存储满了怎么办？
- RDP 和 SSH 容量怎么分开估算？
- 审计员能否修改审计证据？

### 6. `SECRET_KEY` 为什么必须备份？

参考答案：它用于敏感字段加解密。数据库恢复后若密钥不匹配，托管凭据可能无法解密；因此要与数据库共同满足恢复，但又要分权存放。

继续追问：

- 为什么不能把密钥放进普通 Git？
- 数据库与录像如何做一致恢复？
- 只回退镜像为什么不够？
- 恢复演练要验证哪些对象？

### 7. 命令过滤能否替代 `sudo`？

参考答案：不能。命令过滤是入口层规则，可能受脚本、解释器、编码、图形界面和协议能力限制；目标端最小权限才是最终执行边界。

继续追问：

- 如何测试规则绕过？
- RDP 操作如何控制？
- 数据库 SQL 和 Shell 命令有何差异？
- 审批失败时是否默认允许？

### 8. JumpServer 如何进入 AIOps 链路？

参考答案：把用户、资产、账号、来源 IP、会话、命令、文件和录像事件送入变更时间线和安全分析，检测异常访问、权限漂移和审计缺口，并为 RCA 提供证据。

继续追问：

- 模型高风险是否应自动断线？
- 如何减少夜间正常变更误报？
- 哪些权限可以自动回收？
- 如何证明告警真正降低风险？

## 学习检查清单

- [ ] 我能说明 v4.10.18 LTS 与旧 v3 LTS 的边界。
- [ ] 我能区分 JumpServer User、Asset 和 Account。
- [ ] 我能画出 SSH、RDP 和数据库连接路径。
- [ ] 我能解释资产授权的完整维度。
- [ ] 我能说明 Core、Koko、Lion、Chen 和 Celery 的职责。
- [ ] 我能解释数据库、Redis、录像和命令存储的状态边界。
- [ ] 我能完成 SSH 访问与审计基础实验。
- [ ] 我能制造端口错误并用 Koko 与网络证据定位。
- [ ] 我能说明命令过滤为什么不能替代目标端权限。
- [ ] 我能设计多节点、HA 数据库、HA Redis 和对象存储。
- [ ] 我能按协议估算连接与录像容量。
- [ ] 我能保护 `SECRET_KEY`、资产凭据和备份。
- [ ] 我能设计升级、回滚和恢复演练。
- [ ] 我能区分社区版、企业版与未验证能力。
- [ ] 我能回答事故题和生产系统设计题。

## 学习证据

建议建立：

```text
jumpserver-aiops-lab/
  README.md
  evidence/
    version.txt
    installer-md5.txt
    jmsctl-status.txt
    core-health.json
    koko-health.json
    authorization-redacted.png
    ssh-success.png
    session-audit.png
    command-audit.png
    recording-check.png
    bad-port-failure.png
    recovered-session.png
  design/
    identity-account-mapping.md
    ssh-data-path.md
    storage-boundary.md
    capacity-plan.md
    ha-rpo-rto.md
    upgrade-rollback.md
  incidents/
    wrong-ssh-port-review.md
```

README 必须区分：

- 官方预期结果。
- 你实际使用的 JumpServer 与 Installer 版本。
- 哪些实验真实执行。
- 哪些只做了静态设计。
- 是否使用社区版或企业版。
- 截图如何隐藏账号、IP、Token 和密码。
- 实验账号、授权和虚拟机是否清理。
- 没有验证的生产边界。

## 本文边界与下一步

本文覆盖 JumpServer 从零入门、核心访问链路、状态、生产设计、双层实验和大厂面试主线，没有穷尽所有身份源、云同步、数据库协议、RemoteApp、X-Pack、客户端、离线安装、Kubernetes 部署和商业支持条款。

下一步可以继续：

1. 接入隔离 LDAP/AD，验证停用用户权限收敛。
2. 用两台 JumpServer 节点验证 LB、WebSocket 和 SSH 长连接。
3. 接入对象存储，测试录像故障与恢复。
4. 用 API 读取脱敏资产与会话元数据。
5. 把登录、连接、命令和录像完整性接入 SIEM/AIOps。
6. 完成一次数据库、Redis、对象存储和应用节点故障演练。
7. 在恢复出的环境完成 `v4.10.x` 升级与回滚。

读完本文不等于自动具备 PAM 平台岗位能力。还需要训练 Linux、网络、SSH、RDP、数据库权限、LDAP/AD、TLS、负载均衡、数据库与 Redis 高可用、对象存储、安全审计、容量压测和真实变更沟通。
