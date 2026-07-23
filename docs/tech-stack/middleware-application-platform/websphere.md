# IBM WebSphere 技术栈深讲

> 学习目标：从零理解 WebSphere Application Server traditional 与 WebSphere Liberty 的边界，能画出一次请求经过 IBM HTTP Server、Web Server Plug-in、Cluster Member、JDBC/JMS 和后端系统的完整路径，能完成 Liberty 入门与故障注入实验，并能分析传统 WAS 的部署、会话、线程池、连接池、JVM、证书、集群和配置同步故障。

## 官方资料

- [IBM WebSphere Application Server 9.0.5 文档](https://www.ibm.com/docs/en/was/9.0.5)
- [WebSphere Application Server traditional 生命周期策略](https://www.ibm.com/support/pages/lifecycle-policy-websphere-application-server-traditional)
- [IBM WebSphere Application Server 支持声明](https://www.ibm.com/new/announcements/ibm-websphere-application-server-support)
- [WebSphere Liberty 官方概览](https://www.ibm.com/docs/en/was-liberty/base?topic=liberty-overview)
- [WebSphere Liberty 容器镜像](https://www.ibm.com/docs/en/was-liberty/base?topic=images-liberty-container)
- [Open Liberty 入门指南](https://openliberty.io/guides/getting-started.html)
- [Open Liberty Server 配置说明](https://www.openliberty.io/docs/latest/reference/config/server-configuration-overview.html)
- [WebSphere `wsadmin` 入门](https://www.ibm.com/docs/en/was/9.0.5?topic=clients-getting-started-wsadmin-scripting)
- [WebSphere PMI 性能监控](https://www.ibm.com/docs/en/was-nd/9.0.5?topic=health-performance-monitoring-infrastructure-pmi)

说明：本文基于 IBM 和 Open Liberty 官方资料重新组织，不复制官方全文。IBM 当前声明 WebSphere Application Server traditional 8.5.5 和 9.0.5 没有计划中的结束支持日期，但这不代表旧 Fix Pack、旧 Java、旧操作系统和第三方依赖可以无限期不升级。生产环境必须核对 IBM Recommended Updates、详细系统要求、Java 支持、操作系统生命周期、授权和安全公告。

## 官方知识地图

```text
WebSphere 官方资料
  -> 产品：traditional、Network Deployment、Liberty、Open Liberty
  -> 管理拓扑：Profile、Cell、Node、Deployment Manager、Node Agent
  -> 运行时：Application Server、JVM、Web/EJB Container、Cluster
  -> 接入：IBM HTTP Server、Web Server Plug-in、plugin-cfg.xml、Session Affinity
  -> 资源：JNDI、JDBC、JMS、JTA、Thread Pool、Connection Pool
  -> 运维：Admin Console、wsadmin、PMI、日志、FFDC、Dump、备份
  -> 生产治理：高可用、容量、安全、升级、回滚、现代化迁移
```

本文分两层学习：

```text
基础层
  -> 区分 traditional 与 Liberty
  -> 认识 Cell、Node、Server、Cluster
  -> 跑通 Open Liberty 健康检查
  -> 看懂日志、线程池和 JDBC 连接池

进阶层
  -> 画出请求、配置、会话和事务路径
  -> 设计多节点高可用与滚动发布
  -> 分析 JVM、线程、连接、插件和依赖故障
  -> 完成安全、容量、升级、回滚和现代化取舍
```

## 场景开场

凌晨业务开始大量超时，负载均衡器仍能连到 IBM HTTP Server，WebSphere 集群也显示 Started。应用团队说数据库正常，系统团队说 CPU 不高，可用户依旧不断收到 `500` 和超时。

这时“进程还在”只能证明 Java 进程没有退出。真正要查的是：Web Server Plug-in 有没有把请求路由到健康成员、WebContainer 线程是否耗尽、JDBC 连接池是否卡住、GC 是否长暂停、事务是否阻塞，以及下游接口是否拖慢了全部工作线程。

## 一句话人话版

```text
WebSphere = 承载企业 Java 应用的中间件平台，负责接收请求、运行 Servlet/EJB、管理数据库和消息连接、处理事务与安全，并在集群成员之间分配和恢复业务流量。
```

## 小白可能会问

- **WebSphere 是 Web 服务器吗？** 不是一回事。IBM HTTP Server 等 Web Server 负责前端 HTTP/TLS 和静态内容，WebSphere Application Server 负责运行 Java 企业应用；两者常通过 Web Server Plug-in 协作。
- **一个 Java 进程就是一个 WebSphere 集群吗？** 不是。一个 Application Server 通常对应一个 JVM 进程，多个 Server 可以组成 Cluster，多个 Node 由一个 Cell 统一管理。
- **Deployment Manager 挂了，业务一定立刻中断吗？** 通常运行中的 Application Server 可以继续处理既有配置下的业务，但集中管理、部署、同步和部分自动化会受影响；具体影响取决于拓扑和依赖。
- **Liberty 是传统 WAS 的精简模式吗？** 它们属于 WebSphere 家族，但配置、发布和运行模型明显不同。Liberty 采用特性化、轻量、持续交付模型，更适合容器和云原生；不能把传统 WAS 的 Cell/DMgr 操作直接套给 Liberty。
- **Open Liberty 和 WebSphere Liberty 有什么区别？** Open Liberty 是开源运行时和社区项目；WebSphere Liberty 是 IBM 商业产品发行与支持路径，包含相应授权和支持能力。学习实验可以使用 Open Liberty，生产选型要核对授权和支持要求。

## 为什么要学

银行、保险、政企、运营商和大型传统企业仍有大量核心 Java 应用运行在 WebSphere 上。平台工程师和 AIOps 工程师需要把 WebSphere 从“一个黑盒 Java 进程”拆成可观测对象：Cell、Node、Cluster、Server、Application、JVM、Thread Pool、JDBC Pool、JMS、Transaction、HTTP Session、Plug-in 和下游依赖。

学会 WebSphere 后，你能把“接口慢”转成一条证据链：

```text
用户错误率
  -> Web Server / Plug-in 路由
  -> Cluster Member
  -> Servlet 与线程池
  -> JDBC/JMS/JTA
  -> 数据库或外部服务
  -> JVM Heap / GC / OS
  -> 最近部署和配置变更
```

## 是什么

IBM WebSphere Application Server（常缩写为 WAS）是 Java 企业应用服务器。它为应用提供 Web Container、EJB Container、JDBC、JMS、JTA、安全、会话、管理、集群和监控能力，让应用不必自己实现这些基础设施。

### 产品边界

| 名称 | 主要定位 | 管理模型 | 适合场景 |
|---|---|---|---|
| WAS traditional Base | 传统单机或较简单拓扑 | Profile、Application Server、Admin Console | 存量单机 Java EE 应用 |
| WAS traditional Network Deployment | 传统集中管理与集群 | Cell、DMgr、Node Agent、Cluster | 大型存量核心系统和多节点高可用 |
| WebSphere Liberty | IBM 商业支持的轻量运行时 | `server.xml`、Feature、打包服务器或容器 | 现代 Java、微服务、容器与渐进现代化 |
| Open Liberty | Liberty 的开源项目与运行时 | 与 Liberty 相近的特性化配置 | 本地学习、开源应用和社区支持场景 |
| IBM HTTP Server | Web Server，不是 Java 应用服务器 | HTTP/TLS/VirtualHost/Plug-in | 前端接入、静态内容和反向代理 |

本文的生产运维主线是 WAS traditional Network Deployment，实验使用 Open Liberty。两者共享 Java 应用服务器、JVM、HTTP、JDBC、JMS、日志和可观测性知识，但拓扑与配置方式必须分开理解。

## 它解决什么问题

1. 运行 WAR/EAR 等企业 Java 应用，并提供标准容器能力。
2. 统一管理数据库连接、消息连接、事务、会话和安全。
3. 在多台 JVM 和多台主机之间做负载均衡与故障接管。
4. 集中部署、配置、同步和审计大型应用环境。
5. 提供 PMI、JMX、日志、FFDC、Thread Dump 和 Heap Dump 等诊断入口。
6. 让存量 Java EE 应用逐步升级、容器化或迁移到 Liberty。

WebSphere 不替代数据库高可用、消息中间件高可用、外部负载均衡、操作系统监控、应用代码治理或备份恢复。

## 核心原理

### 一次 HTTP 请求的数据路径

```text
浏览器 / API Client
  -> DNS / 外部负载均衡
  -> IBM HTTP Server 或其他受支持 Web Server
  -> Web Server Plug-in 读取 plugin-cfg.xml
  -> 选择可用 Cluster Member
  -> Application Server HTTP Transport
  -> Web Container Thread
  -> Filter / Servlet / Framework / EJB
  -> JNDI 查找 DataSource、JMS 或其他资源
  -> JDBC Connection Pool / JMS Connection Factory
  -> 数据库、消息队列或外部接口
  -> 事务提交或回滚
  -> 响应沿原路径返回
```

任何一层都可能制造同样的“请求超时”。排障不能从重启 JVM 开始，而要先确认请求到底停在哪一层。

### 管理配置路径

```text
管理员通过 Admin Console / wsadmin 修改配置
  -> Deployment Manager 写入 Cell Master Repository
  -> 保存配置工作区
  -> Node Agent 与 DMgr 同步
  -> Node 本地配置仓库更新
  -> 运行中的 Server 动态读取，或按要求重启后生效
```

传统 ND 中，DMgr 保存 Cell 的主配置。Node Agent 负责节点管理和配置同步。Node 显示 `out of sync` 时，控制台里的配置可能与服务器实际使用的本地配置不同。

### 应用发布路径

```text
EAR / WAR 制品
  -> 上传到 DMgr 或由 wsadmin 读取
  -> 解析模块、Context Root、Classloader、资源引用和目标
  -> 安装到 Cluster 或 Server 配置
  -> 同步到各 Node
  -> Application Server 加载应用
  -> Web Server Plug-in 配置生成与传播
  -> 健康检查和业务验证
```

“控制台显示安装成功”不等于发布完成。还要确认所有 Cluster Member 都启动应用、Node 已同步、Plug-in 已传播、资源绑定正确，并完成业务级探测。

### 状态与一致性

WebSphere 中至少有四类状态：

| 状态 | 保存在哪里 | 一致性风险 |
|---|---|---|
| Cell 配置 | DMgr Master Repository 与 Node 本地副本 | Node 未同步导致配置漂移 |
| 应用运行状态 | 每个 Application Server JVM | 某些成员 Started、某些成员 Failed |
| HTTP Session | 本 JVM 内存、复制域或数据库 | 成员故障后登录态丢失或旧对象不兼容 |
| JTA 事务状态 | 事务服务和事务日志 | JVM 故障后存在 in-doubt transaction，需要恢复而非直接删日志 |

高可用不是只把 JVM 数量改成 2。你还要处理配置、会话、事务、数据库、消息、插件、证书和外部入口的一致性。

## 关键术语拆解

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| Profile | 一套独立的 WAS 运行与配置目录 | 同一安装二进制可创建 DMgr、Node 或 Server Profile |
| Cell | traditional ND 的最高管理域 | 一个 Cell 共享主配置和集中管理边界 |
| Node | 一组由同一 Node Agent 管理的 Server | 通常对应一台主机上的一个 Profile 管理域 |
| Deployment Manager | DMgr，Cell 的集中管理进程 | 保存主配置，承载 Admin Console 和管理操作 |
| Node Agent | DMgr 与本节点 Server 之间的管理代理 | 负责同步、启停和状态上报 |
| Application Server | 运行应用的 JVM 进程 | 性能、日志、线程和故障的主要边界 |
| Cluster | 部署同一应用的一组 Server | 提供横向扩展和成员故障接管 |
| Cluster Member | Cluster 中的一个 Application Server | 每个成员都有独立 JVM、端口和资源消耗 |
| Web Container | 执行 Servlet/JSP 等 Web 请求的容器 | WebContainer 线程池耗尽会让请求排队 |
| EJB Container | 执行 Enterprise JavaBeans 的容器 | 负责事务、安全和远程调用等服务 |
| Web Server Plug-in | Web Server 到 WAS 的请求路由模块 | 依据 `plugin-cfg.xml` 选择 Cluster Member |
| Session Affinity | 同一会话尽量回到原成员 | 降低复制读取成本，但不能代替会话持久化 |
| JNDI | Java Naming and Directory Interface | 应用通过逻辑名查找 DataSource/JMS 等资源 |
| JDBC DataSource | 数据库连接工厂与连接池 | 连接泄漏或池耗尽会拖住业务线程 |
| JMS | Java Message Service | 应用与消息系统异步通信的标准接口 |
| JTA | Java Transaction API | 协调一个或多个资源的事务提交/回滚 |
| PMI | Performance Monitoring Infrastructure | WAS 内置性能指标基础设施 |
| FFDC | First Failure Data Capture | 首次故障时自动收集诊断上下文 |
| wsadmin | WAS 脚本管理工具 | 用 Jython/Jacl 查询和自动化配置 |
| Feature | Liberty 按需启用的运行能力 | 未声明的能力不会自动进入轻量运行时 |

## 核心知识树

### Cell、DMgr、Node 与 Node Agent

**是什么：** Cell 是管理域，DMgr 保存主配置，Node Agent 管理一个 Node 内的 Server 并同步配置。

**为什么需要：** 大型环境不能逐 JVM 手工改配置，需要统一部署、审计和状态管理。

**怎么工作：** Admin Console 或 wsadmin 连接 DMgr，配置先保存到 Cell Repository，再同步到各 Node。Node Agent 与 Server 通过管理协议交互。

**怎么看 / 怎么用：** 在控制台查看 `System administration > Nodes` 的同步状态；用 `serverStatus`、`syncNode`、`wsadmin` 查询运行与配置。

**坏了怎么查：** DMgr 不通先确认进程、端口、证书、SOAP 连接和日志；Node 不同步检查 Node Agent、时间、网络、认证、文件权限和 `syncNode.log`，不要直接复制整个配置目录覆盖。

### Application Server、JVM 与 Container

**是什么：** Application Server 是一个 JVM；内部 Web Container、EJB Container 等组件运行应用代码。

**为什么需要：** Java EE/Jakarta EE 应用依赖容器提供生命周期、线程、事务、安全和资源管理。

**怎么工作：** Server 启动后加载配置、类、应用和资源；请求由容器线程执行，调用连接池和后端系统。

**怎么看 / 怎么用：** 查看 JVM Heap、GC、Thread Pool、Application Status、SystemOut、SystemErr、FFDC 和 Native Logs。

**坏了怎么查：** 进程在但应用失败时，区分 Server、Application、Module 和 Endpoint 状态；先抓 Thread Dump/Heap 使用与日志证据，再考虑重启。

### Cluster、Plug-in 与负载均衡

**是什么：** Cluster 由多个运行同一应用的成员组成，Web Server Plug-in 根据 `plugin-cfg.xml` 路由请求。

**为什么需要：** 单 JVM 容量和故障域有限，需要横向扩展、维护窗口和成员故障接管。

**怎么工作：** Plug-in 根据 URI、Virtual Host、Cluster、Server、Transport、权重和可用性选择成员；连接失败或受支持的错误条件下可尝试其他成员。

**怎么看 / 怎么用：** 核对 Cluster Member 状态、应用是否全部启动、`plugin-cfg.xml` 更新时间、Plug-in 日志、IHS access/error log 和成员访问量。

**坏了怎么查：** 如果只有 IHS 路径失败但直连成员正常，重点检查 Plug-in 配置、证书、端口、Virtual Host 和传播；不要通过把所有请求固定到一个成员长期绕过。

### HTTP Session

**是什么：** HTTP Session 保存用户会话状态，例如登录、购物车或流程上下文。

**为什么需要：** HTTP 本身无状态，但很多传统应用需要跨请求保留状态。

**怎么工作：** Session 通常先保存在创建它的 JVM，Plug-in 使用 Affinity 让后续请求回到原成员；需要故障恢复时可使用 Memory-to-Memory Replication 或 Database Persistence。

**怎么看 / 怎么用：** 查看 Session Manager、Cookie、Timeout、Persistence、Replication Domain、Active Sessions 和 Session Size。

**坏了怎么查：** 登录态丢失时检查 Cookie/Path/Domain、Affinity、成员切换、复制或数据库连接、Session 对象是否可序列化，以及发布后类版本是否兼容。

### WAR/EAR、类加载与共享库

**是什么：** WAR 是 Web 模块，EAR 可组合多个企业模块；Classloader 决定类和依赖从哪里加载。

**为什么需要：** 大型应用常同时依赖应用自带库、共享库和 WAS 运行时库，版本冲突会造成启动或运行异常。

**怎么工作：** 应用按模块和 Classloader Policy 加载类；Parent First/Parent Last 影响同名类优先级。

**怎么看 / 怎么用：** 核对 Application Binary、Module、Shared Library、Classloader Order、Manifest 和实际制品哈希。

**坏了怎么查：** `ClassNotFoundException` 查缺失依赖和模块范围；`NoSuchMethodError`/`LinkageError` 查同名库版本冲突；不要把大量 JAR 随意复制进全局目录。

### JNDI、JDBC 与连接池

**是什么：** 应用通过 JNDI 名称查找 DataSource，DataSource 管理 JDBC 连接池。

**为什么需要：** 避免每个请求新建数据库连接，并把地址、凭据、池大小与应用代码分离。

**怎么工作：** 请求线程从连接池借连接，执行 SQL 和事务后归还。连接创建、验证、超时和清理由池策略控制。

**怎么看 / 怎么用：** 查看 JNDI Scope、Provider、DataSource、Authentication Alias、Current/Free/Pool Size、Wait Time、Faults 和数据库会话。

**坏了怎么查：** 池耗尽先查连接是否归还、慢 SQL、事务范围、数据库最大会话、网络和验证查询；盲目增大池会把压力转移到数据库。

### JMS 与 JTA 事务

**是什么：** JMS 管理消息通信，JTA 管理事务边界和多资源协调。

**为什么需要：** 核心业务常需要数据库与消息的可靠处理、回滚和恢复。

**怎么工作：** 应用在事务中调用资源；事务管理器记录状态并协调 prepare/commit/rollback。故障后可能出现待恢复事务。

**怎么看 / 怎么用：** 查看 Transaction Service、JMS Connection Factory、Destination、Message Engine/MQ、Transaction Log、超时和恢复日志。

**坏了怎么查：** 先确认事务是否仍可恢复、资源是否可达、日志目录是否完整；不要删除 transaction log 来“消除启动报错”，这可能破坏 in-doubt transaction 恢复。

### Thread Pool、Connection Pool 与背压

**是什么：** Thread Pool 限制并发执行线程，Connection Pool 限制可同时使用的后端连接。

**为什么需要：** 无限制并发会把 JVM、数据库和下游系统压垮；池是资源保护，也是排队点。

**怎么工作：** 请求进入队列，获得 WebContainer 线程，再尝试获取 JDBC/JMS 连接。下游慢时线程和连接占用时间变长，最终出现排队与超时。

**怎么看 / 怎么用：** 关联 Thread Pool Active/Pool Size、JDBC Pool Wait、Servlet Response Time、数据库响应和 Thread Dump。

**坏了怎么查：** 大量线程都阻塞在同一数据库/HTTP 调用时，根因通常不在“线程数太小”；先修下游、超时、连接泄漏或代码阻塞，再评估池大小。

### Liberty Feature 与配置

**是什么：** Liberty 用 `server.xml` 的 `<featureManager>` 按需启用 Servlet、JDBC、JMS、MicroProfile 等能力。

**为什么需要：** 只加载应用需要的功能，降低镜像和启动负担，并让配置进入版本控制。

**怎么工作：** Liberty 读取 `server.env`、`jvm.options`、`bootstrap.properties`、`server.xml` 和 `configDropins`；XML 配置可以被动态监控和合并。

**怎么看 / 怎么用：** 检查启动日志中的 Feature 列表、`CWWKF0011I` Ready 消息、配置变量、应用和 `/health`、`/metrics` 端点。

**坏了怎么查：** Feature 名称错误或依赖缺失时会出现 `CWWKF`/`CWWKG` 消息；先核对运行时版本、Java、Feature 和配置合并优先级。

## 架构和数据流

### 传统 ND 生产拓扑

```text
                    管理网
                      |
              Deployment Manager
              Master Repository
                /             \
        Node Agent A       Node Agent B
           |                   |
      Server A1/A2         Server B1/B2
           \                   /
             Application Cluster
                      ^
                      |
Load Balancer -> IBM HTTP Server A/B -> Web Server Plug-in
                      |
              Database / MQ / APIs
```

### 故障域

- 两个 Cluster Member 在同一 Node，只能覆盖单 JVM，不能覆盖主机故障。
- 两个 Node 在同一虚拟化宿主机，仍可能共享物理故障域。
- 两台 IHS 使用同一个上游负载均衡单点，入口仍不高可用。
- Session 只存在本 JVM 时，成员故障会丢会话。
- 数据库和 MQ 只有单实例时，WebSphere Cluster 仍无法提供端到端高可用。

### 高可用设计

1. Cluster Member 至少跨两个独立 Node 和底层故障域。
2. IHS/Plug-in 至少双实例，并由上游健康检查分流。
3. 关键会话采用可接受的复制/持久化策略，或把应用改造成无状态。
4. JDBC/JMS 后端有受支持的高可用、超时和连接恢复策略。
5. DMgr 不处于业务数据面，但要备份配置并设计管理恢复；依赖自动部署的环境评估 HA DMgr。
6. 每次只滚动一个成员，先移出流量、等待排空、发布、验证再继续。

## 安装与启动

### Traditional 安装边界

WAS traditional 通常通过 IBM Installation Manager 安装，介质和仓库访问受 IBM 授权约束。生产安装步骤应是：

1. 核对操作系统、Java、WAS Edition、Fix Pack 和详细系统要求。
2. 安装 Installation Manager 与产品二进制。
3. 使用 Profile Management Tool 或 `manageprofiles` 创建 DMgr/Application Server Profile。
4. 启动 DMgr，将 Node Federate 到 Cell。
5. 创建 Cluster/Member、JDBC/JMS、安全、IHS 和 Plug-in。
6. 安装应用，完成同步、健康检查和业务验收。

常见 Linux/UNIX 启停命令：

```bash
$PROFILE_ROOT/bin/startManager.sh                      # 启动 DMgr；成功应看到 ADMU3000I
$PROFILE_ROOT/bin/startNode.sh                         # 启动 Node Agent；成功应看到 ADMU3000I
$PROFILE_ROOT/bin/startServer.sh server1              # 启动 server1；成功应看到 ADMU3000I
$PROFILE_ROOT/bin/serverStatus.sh -all                 # 查询本 Profile 下进程状态
$PROFILE_ROOT/bin/stopServer.sh server1 -username ... # 受安全配置保护的停止操作，生产需审批
```

Windows 使用同名 `.bat`。`$PROFILE_ROOT` 是具体 Profile 目录，不是 WAS 安装根目录。不要在不知道 Profile 的情况下从任意 `bin` 执行脚本。

### Liberty 入门方式

本文使用 Open Liberty 官方容器镜像完成实验，因为它可以合法、快速地在本机复现 Liberty 配置与健康检查。它不是传统 ND Cell 模拟器，也不能证明你已经操作过生产 WebSphere。

## 配置详解

### Liberty 最小 `server.xml`

```xml
<server description="websphere beginner lab">
    <featureManager>
        <feature>mpHealth-4.0</feature>
    </featureManager>

    <httpEndpoint id="defaultHttpEndpoint"
                  host="*"
                  httpPort="9080"
                  httpsPort="9443" />

    <logging consoleLogLevel="INFO" />
</server>
```

| 配置项 | 含义 | 新手容易错在哪里 |
|---|---|---|
| `featureManager` | 声明运行时需要的能力 | 复制了应用但没有启用对应 Servlet/JPA/JDBC Feature |
| `mpHealth-4.0` | 提供 MicroProfile Health 端点 | 生产应核对目标 Liberty 版本支持的 Feature |
| `host="*"` | 监听容器内所有网卡 | 裸机生产不能因此跳过防火墙和访问控制 |
| `httpPort` | HTTP 监听端口 | 宿主机映射端口与容器端口混淆 |
| `httpsPort` | HTTPS 监听端口 | 配了端口却没有正确证书和 TLS 配置 |
| `consoleLogLevel` | 控制台日志级别 | 长期开 DEBUG/TRACE 导致磁盘和性能风险 |

### Traditional DataSource 设计清单

```yaml
scope: Cluster=orderCluster          # 资源作用域，必须覆盖所有应用成员
jndi_name: jdbc/orderDB              # 应用通过这个逻辑名称查找 DataSource
auth_alias: orderDbAlias             # 凭据别名；真实密码不能进入 Git
min_connections: 10                  # 基线连接，不是越大越好
max_connections: 80                  # 必须与数据库容量和成员数一起计算
connection_timeout_seconds: 10       # 池耗尽时最多等待多久
unused_timeout_seconds: 300          # 空闲连接回收策略
purge_policy: FailingConnectionOnly  # 连接失败后清理范围，按驱动和故障模式评审
```

一个 Cluster 有 4 个成员，每个成员最大 80 条连接，理论上仅这一 DataSource 就可能向数据库建立约 320 条连接。还要加管理、批处理、报表和其他应用连接，不能只在单 JVM 视角调池。

### Web Server Plug-in 关键项

`plugin-cfg.xml` 由 WebSphere 配置生成，核心对象包括 `VirtualHostGroup`、`UriGroup`、`ServerCluster`、`Server` 和 `Transport`。它决定什么 URI 进入哪个 Cluster，以及成员的 HTTP/HTTPS 端口。

生产中应通过受支持流程生成和传播，不要长期手工维护生成文件。若必须临时修改，也要明确下一次自动生成会覆盖它。

## 常用命令

### Traditional 只读检查

```bash
$PROFILE_ROOT/bin/serverStatus.sh -all                # 查看 Profile 内 DMgr、Node Agent 或 Server 状态
$PROFILE_ROOT/bin/versionInfo.sh                      # 查看 WAS 安装与版本信息
$PROFILE_ROOT/bin/historyInfo.sh                      # 查看安装维护历史
$WAS_HOME/bin/managesdk.sh -listEnabledProfileAll     # 查看各 Profile 启用的 Java SDK
$PROFILE_ROOT/bin/wsadmin.sh -lang jython -c "print AdminApp.list()" # 列出已安装应用
$PROFILE_ROOT/bin/wsadmin.sh -lang jython -c "print AdminControl.queryNames('type=Server,*')" # 查询运行 Server MBean
```

### 诊断命令

```bash
kill -3 <java_pid>              # Linux/UNIX 触发 Java Thread Dump；不会终止 JVM，但会产生诊断开销
jcmd <java_pid> Thread.print    # 受支持 JDK 上输出线程栈；先核对 WAS/Java 版本
jcmd <java_pid> GC.heap_info    # 查看堆摘要；命令可用性依 Java 实现
```

Thread Dump 通常是低风险只读诊断，但高负载时连续大量抓取仍有开销。Heap Dump 可能暂停进程、占用大量磁盘并包含敏感数据，必须先确认空间、影响和存储权限。

### Liberty 命令

```bash
server status defaultServer        # 查看 Liberty Server 状态
server start defaultServer         # 启动后台 Server
server run defaultServer           # 前台启动，适合实验观察日志
server stop defaultServer          # 受控停止 Server
featureUtility viewSettings        # 查看 Feature Utility 仓库与设置
productInfo version                # 查看 Liberty 产品版本
```

容器镜像中常通过容器入口点启动，不应在同一容器里再手工启动第二个 Server 进程。

## wsadmin 对象字典

| 对象 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `AdminApp` | 查询、安装、更新、卸载应用 | `print AdminApp.list()` | 输出应用名 | `install/update/uninstall` 是写操作 |
| `AdminConfig` | 查询和修改配置仓库 | `AdminConfig.list('Server')` | 输出配置对象 ID | 修改后忘记 `AdminConfig.save()`，或保存错误对象 |
| `AdminControl` | 操作运行中的 MBean | `AdminControl.queryNames('type=Server,*')` | 输出运行对象 | Server 未运行时查不到 Runtime MBean |
| `AdminTask` | 面向任务的管理命令 | `AdminTask.help('-commands')` | 输出命令组 | 不同 Edition/版本可用命令不同 |
| `Help` | 查看 wsadmin 帮助 | `Help.help()` | 输出帮助 | Jacl 与 Jython 语法混用 |

IBM 官方提醒：Server 运行时不建议在 local mode 下做冲突配置变更，因为本地配置与运行/DMgr 配置可能互相覆盖甚至损坏。自动化应默认连接 DMgr，使用 Jython、版本控制脚本、变更审计和幂等检查。

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 关键字段 / 参数 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `serverStatus` | 查询进程状态 | `serverStatus.sh -all` | Server name、status | 显示 STARTED | STARTED 不等于应用健康 |
| `startServer` | 启动 Application Server | `startServer.sh server1` | Profile、Server name | `ADMU3000I` | 从错误 Profile 启动同名 Server |
| `wsadmin` | 脚本化管理 | `wsadmin.sh -lang jython` | host、SOAP port、user、language | 连接 DMgr 并进入提示符 | 把密码明文写入 Shell History |
| `AdminApp.list` | 只读列出应用 | `print AdminApp.list()` | 可选 Target scope | 返回应用列表 | 配置存在不代表每个成员运行成功 |
| `syncNode` | 从 DMgr 同步 Node | `syncNode.sh <dmgr-host> <soap-port>` | DMgr host、SOAP port | Node 同步成功 | Node Agent 状态和认证问题未解决就反复同步 |
| `backupConfig` | 备份 Profile 配置 | `backupConfig.sh backup.zip` | 输出路径、是否停止 Server | 生成可验证 ZIP | 备份文件和当前 Fix Pack/二进制不匹配 |
| `plugin-cfg.xml` | Web Server Plug-in 路由配置 | 通过 Console/脚本生成传播 | URI、Cluster、Server、Transport | 与当前应用/成员一致 | 手工改后被下次生成覆盖 |
| `server.xml` | Liberty 主配置 | `<featureManager>...` | Feature、Endpoint、App、Resource | 启动日志无配置错误 | `configDropins/overrides` 覆盖了主文件 |
| PMI | 运行时性能指标 | Console/TPV/JMX Client | JVM、Thread、JDBC、Servlet | 指标持续采集且开销可控 | 一次开启全部高粒度指标造成额外开销 |

## 日志与诊断文件

| 文件/目录 | 常见内容 | 先看什么 |
|---|---|---|
| `SystemOut.log` | 应用、容器和标准运行日志 | 错误时间、线程、应用名、异常链 |
| `SystemErr.log` | 标准错误输出 | JVM/Native/库加载错误 |
| `native_stderr.log` | JVM Native 层错误 | 崩溃、内存、JVM 启动问题 |
| `trace.log` | 按 Trace Specification 产生的详细日志 | 是否在受控时间窗开启、磁盘增长 |
| `ffdc/` | 首次故障自动捕获 | Exception、Probe ID、时间和关联线程 |
| `javacore.*.txt` | Thread Dump 与 JVM 状态 | BLOCKED、锁、调用栈、Heap/GC 摘要 |
| `heapdump.*` | Java Heap 快照 | 需 MAT/Heap Analyzer，文件可能很大且敏感 |
| `core.*` / `Snap.*` | JVM/Native 崩溃诊断 | 对应 PID、信号、操作系统和 JVM 版本 |
| IHS access/error log | 前端请求和 Web Server 错误 | 状态码、URI、后端连接与耗时 |
| Plug-in log | 路由、成员标记和连接失败 | Cluster、Server、Transport、重试 |

## 在 AIOps 中的作用

### 指标

IBM PMI 可以提供 Servlet 响应时间、JDBC Pool、Thread Pool、JVM GC/Heap、EJB、事务等数据。AIOps 平台应把这些指标与主机、数据库、MQ、负载均衡和业务 SLI 对齐。

| 层次 | 重点指标 | 能回答的问题 |
|---|---|---|
| 入口 | request rate、4xx/5xx、IHS/Plug-in connect errors | 请求是否到达、路由是否失败 |
| Application | application/module status、Servlet response time | 哪个应用或接口异常 |
| Thread Pool | active、pool size、queue、hung threads | 请求是否在 JVM 内排队或阻塞 |
| JDBC Pool | current/free、wait time、faults、use time | 是否连接池耗尽或数据库变慢 |
| JVM | heap used、GC time/pause、CPU、thread count | 是否内存、GC 或线程压力 |
| Session | active、created、invalidated、serialized size | 会话是否膨胀或丢失 |
| Transaction | active、timeout、rollback、recovery | 是否事务阻塞或大量回滚 |
| JMS | connection/session、queue depth、consumer lag | 消息处理是否积压 |
| Config | node sync、app version、plugin timestamp | 是否配置/发布漂移 |

### 日志关联

建议统一结构化字段：

```json
{
  "service": "order-api",
  "cell": "prodCell",
  "node": "appNode01",
  "server": "orderServer1",
  "cluster": "orderCluster",
  "application": "order-ear",
  "trace_id": "8f40...",
  "message_id": "J2CA0045E"
}
```

生产日志中还要加入变更 ID、制品版本和主机/Pod 标识。WebSphere 消息 ID 往往能定位组件，但不能只按消息编号自动执行修复；要结合前后日志和运行状态。

### 自动化边界

- 适合自动化：只读清单、节点同步检查、应用版本比对、PMI 采集、日志归档、Thread Dump 采集审批、Runbook 推荐。
- 需审批：重启成员、扩线程池、刷新连接池、重新传播 Plug-in、滚动发布。
- 高风险人工确认：删除事务日志、强制停止整个 Cluster、卸载应用、修改全局安全、替换证书、恢复配置仓库。

## 入门实验：运行 Open Liberty 健康端点

### 实验目标

第一次接触 WebSphere 家族的读者，在本机启动一个 Open Liberty Server，看到 Ready 日志，并通过 `/health` 验证运行时可用。

### 前提

- 已安装并启动 Docker Desktop。
- 本机 `9080` 和 `9443` 端口未被占用。
- 实验使用 Open Liberty 开源镜像，不需要连接生产 WebSphere。

### 第一步：创建实验目录

```powershell
New-Item -ItemType Directory -Path .\websphere-lab -Force
Set-Location .\websphere-lab
```

### 第二步：创建 `server.xml`

把“配置详解”中的最小 `server.xml` 保存到当前目录。

### 第三步：启动容器

```powershell
docker run --detach `
  --name openliberty-lab `
  --publish 9080:9080 `
  --publish 9443:9443 `
  --mount "type=bind,source=$((Get-Location).Path)\server.xml,target=/config/server.xml,readonly" `
  icr.io/appcafe/open-liberty:full-java21-openj9-ubi-minimal
```

说明：版本未固定的镜像标签适合学习，但生产必须固定经过验证的 Liberty 版本或镜像 Digest，并进入漏洞扫描和发布审批。

### 第四步：验证 Ready 日志

```powershell
docker logs openliberty-lab
```

预期看到类似：

```text
CWWKF0011I: The defaultServer server is ready to run a smarter planet.
```

### 第五步：验证健康端点

```powershell
curl.exe --fail --show-error http://localhost:9080/health
```

预期返回总体状态 `UP`。不同版本的 JSON 格式可能略有不同，判断标准是 HTTP 成功且顶层状态为 `UP`。

### 验证结果

```powershell
docker ps --filter "name=openliberty-lab"
docker inspect --format "{{.State.Health.Status}}" openliberty-lab
```

如果镜像未定义 Docker Healthcheck，第二条可能返回空值；此时以 `/health` 和 Ready 日志为准，不要把“没有容器 Healthcheck”误判成应用故障。

### 如果没有成功

1. `docker version` 是否能同时显示 Client 和 Server。
2. `docker logs openliberty-lab` 是否出现 Feature 或 XML 配置错误。
3. `Get-NetTCPConnection -LocalPort 9080` 是否显示端口冲突。
4. `server.xml` 是否是完整 XML，根元素是否为 `<server>`。
5. Docker Desktop 是否允许当前磁盘目录共享给 Linux 容器。
6. 公司代理是否阻止从 IBM Container Registry 拉取镜像。

## 故障注入实验：制造 Feature 配置错误

### 实验目标

主动制造一个可回收的 Liberty 配置错误，完成“现象 -> 证据 -> 假设 -> 验证 -> 修复 -> 清理”。

### 实验边界

只操作本地 `openliberty-lab` 容器和实验配置，不连接生产环境。开始前备份正确配置。

### 精确步骤

1. 备份：`Copy-Item .\server.xml .\server.good.xml`。
2. 停止并删除基线容器：`docker rm --force openliberty-lab`。
3. 把 `<feature>mpHealth-4.0</feature>` 改成 `<feature>not-a-real-feature-1.0</feature>`。
4. 使用相同 `docker run` 命令再次启动。
5. 执行 `docker logs openliberty-lab`。
6. 执行 `curl.exe --fail --show-error http://localhost:9080/health`。

### 预期现象与证据

- 日志出现 `CWWKF0001E`，指出 `not-a-real-feature-1.0` 的 Feature 定义不存在。
- `/health` 不再正常返回 `UP`，`curl.exe` 会收到空响应、连接失败或非成功状态。
- 某些 Liberty 版本仍会打印 `CWWKF0011I` Ready，因为运行时内核已经启动；这不代表所需 Feature 和业务端点可用。监控必须同时验证启动日志、配置错误和业务健康端点，不能只看进程或 Ready 消息。

### 假设与验证

假设是 `server.xml` 声明了运行时不存在的 Feature。对比：

```powershell
Compare-Object (Get-Content .\server.good.xml) (Get-Content .\server.xml)
```

如果只有 Feature 名称发生变化，且日志同时指出该 Feature，证据支持该假设。

### 修复

```powershell
docker rm --force openliberty-lab
Copy-Item .\server.good.xml .\server.xml -Force
# 再次执行基础实验中的 docker run 命令
curl.exe --fail --show-error http://localhost:9080/health
```

预期重新返回 `UP`。

### 清理

```powershell
docker rm --force openliberty-lab
Remove-Item .\server.good.xml
Set-Location ..
```

保留 `server.xml`、脱敏日志和实验记录作为学习证据；不再需要时再删除整个实验目录。

## 常见故障排查

### 应用显示 Started，但访问 404

1. 确认请求 URL、Context Root 和 Virtual Host Alias。
2. 直连每个 Cluster Member 的 HTTP 端口验证应用。
3. 确认应用模块是否在所有成员启动。
4. 检查 `plugin-cfg.xml` 是否包含目标 URI/Cluster/Transport。
5. 检查 Plug-in 配置是否已传播到正确 IHS，并完成受控 reload/restart。
6. 对比 IHS access log、Plug-in log 和 SystemOut 时间线。

### 请求变慢并出现 Hung Thread

1. 从业务 SLI 确定影响接口和开始时间。
2. 连续抓取 3 份间隔 Thread Dump，找持续停在同一调用栈的线程。
3. 关联 JDBC Pool Wait、数据库慢 SQL、外部 HTTP、MQ 和锁等待。
4. 检查 WebContainer Active 与 Pool Size，确认是排队还是 CPU 饱和。
5. 先处理下游慢、连接泄漏、无超时调用或死锁，再决定是否调池。

Hung Thread 检测说明线程超过阈值，不自动证明死锁。长批处理、慢数据库和无超时网络调用都可能触发。

### JDBC 连接池耗尽

现象通常包括获取连接超时、`J2CA` 消息、请求线程等待和数据库会话达到上限。

排查顺序：连接池 Current/Free/Wait -> Thread Dump -> 慢 SQL/锁 -> 连接泄漏 -> 数据库最大连接 -> 网络 -> 最近发布。修复后验证连接归还速率和请求延迟，不要只把 Max Connections 调大。

### JVM OOM 或频繁 Full GC

1. 保存 JVM 版本、Heap 参数、GC Log、javacore 和 Heap Dump。
2. 判断是 Java Heap、Native Memory、Metaspace/Class、Direct Buffer 还是 OS 限制。
3. 观察老年代增长是否在 Full GC 后仍不下降。
4. 用 Heap Analyzer 找 Dominator、Classloader、Session/Cache 和引用链。
5. 核对最近应用版本、流量和配置变化。
6. 修复泄漏或容量模型后再调整 Heap；扩大 Heap 可能只会延后 OOM。

### Node Out of Sync

检查 DMgr/Node Agent 状态、SOAP 网络、证书、时间、认证、磁盘与权限。保存 DMgr 和 Node 日志后执行受支持同步；若反复失败，找出造成配置写入或文件冲突的根因。不要在 Server 运行时手工覆盖 XML 配置仓库。

### SSL 证书过期或握手失败

确认失败链路是 Client-IHS、IHS-WAS、WAS-Database/MQ 还是管理 SOAP；收集握手端点、SNI、协议、Cipher、证书链、有效期、Truststore 和时间。证书替换要同时考虑 Cell/Node 同步、Plug-in Key Database、回滚证书和重启顺序。

### 部署后 `ClassNotFoundException` / `NoSuchMethodError`

前者多为类缺失或 Scope 不对，后者多为加载到错误版本。检查 EAR/WAR 实际内容、Shared Library、Classloader Order、Parent First/Last、重复 JAR 和制品哈希。不要通过向全局目录不断复制 JAR 试错。

## 容量与性能

### 容量模型

每个 Cluster 至少估算：

```text
峰值并发请求
  / 单请求平均占用线程时间
  -> WebContainer 线程需求

Cluster Member 数量
  x 每成员 JDBC 最大连接
  -> 数据库潜在连接总量

活跃 Session 数
  x 平均 Session 大小
  x 副本数量
  -> Session 内存与复制流量
```

还要预留 GC、滚动升级少一个成员、单节点故障和流量突增容量。生产容量应通过压测和故障演练验证，不靠公式直接定值。

### 性能取舍

- 增大 Thread Pool 可提高并发，也可能压垮数据库并增加上下文切换。
- 增大 JDBC Pool 可减少等待，也会增加数据库会话和内存。
- 增大 JVM Heap 可降低 GC 频率，也可能增加 Full GC 暂停和 Dump 大小。
- 开启 Session Replication 提高故障恢复能力，也增加序列化、网络和内存开销。
- 开启全部 PMI/Trace 提高可见性，也会产生额外运行和磁盘开销。

## 安全

1. 集成受支持的 LDAP/Federated Repository，区分管理员、操作员、审计员和部署账号。
2. 使用最小权限，生产 wsadmin 禁止共享超级管理员和命令行明文密码。
3. 管理 Console/SOAP 与业务网络分区，限制来源并启用 TLS。
4. 管理 Cell Default Truststore/Keystore、IHS Key Database、应用双向 TLS 和证书到期告警。
5. 使用 LTPA（Lightweight Third-Party Authentication）等机制时，保护 Key、设置合理 Token 生命周期并设计轮换。
6. DataSource/JMS 凭据使用安全别名或 Secret 管理，不写入 Git、脚本和日志。
7. 管理 Java 反序列化、JNDI、上传、管理端点和旧协议风险，及时应用 IBM 安全修复。
8. Heap Dump、Thread Dump、FFDC 和 support archive 可能含 Token、SQL、用户数据与凭据，按敏感数据管控。

## 升级、回滚与现代化

### Traditional Fix Pack 升级门禁

1. 核对 WAS、Java、IHS、Web Server Plug-in、Installation Manager、OS、数据库驱动、MQ Client 和第三方产品兼容性。
2. 保持推荐 Fix Pack，阅读 Known Issues、APAR 和安全公告。
3. 执行 `backupConfig`，保存 Installation Manager 清单、应用制品、配置脚本、证书和性能基线。
4. 在同版本测试环境验证应用、Classloader、JDBC/JMS、Session 和 SSL。
5. 集群逐 Node/Member 滚动升级，保留健康容量并做业务探测。
6. 升级 DMgr、Node 和 Plug-in 的顺序必须按 IBM 文档，混合版本只在支持窗口内使用。
7. 升级后验证 Node Sync、应用、插件、事务恢复、PMI 和完整业务链路。

回滚不能只写“卸载 Fix Pack”。要明确二进制回退是否受支持、配置仓库格式是否变化、Java 是否可回退、制品和数据库 Schema 是否兼容，以及如何把流量切回未升级成员。

### Traditional 到 Liberty 的取舍

适合评估 Liberty：应用主要使用标准 Java/Jakarta API、希望容器化、配置即代码、快速启动和独立发布。

需要谨慎：大量依赖 traditional 专有 API、共享 Cell 资源、复杂 EJB/事务、旧 Java、特殊安全集成或第三方产品认证。

现代化路径通常是：

```text
清点应用与依赖
  -> 使用迁移工具扫描 API 和配置
  -> 修复不兼容项
  -> 在 Liberty 测试功能、性能和事务
  -> 建立容器、监控、安全和发布流水线
  -> 小流量验证
  -> 分批迁移并保留回滚
```

## 事故场景：集群全部 Started，但订单接口大量超时

**现象：** IHS 返回超时，4 个 Cluster Member 都是 Started，CPU 约 40%，数据库监控显示连接数接近上限。

**证据：**

- IHS access/Plug-in log 的 URI、成员和超时。
- Servlet response、WebContainer active/pool、Hung Thread。
- 3 份间隔 Thread Dump 中的调用栈。
- JDBC current/free/wait、数据库 Session、锁和慢 SQL。
- GC pause、Heap、CPU 和最近发布。
- 同时段数据库、网络和变更事件。

**假设：** 慢 SQL 或锁使连接长时间不归还，JDBC Pool 耗尽，WebContainer 线程继而等待；也可能是连接泄漏或数据库网络抖动。

**验证：** Thread Dump 若大量线程等待 `getConnection`，继续查看池和数据库；若已获得连接但卡在同一 SQL，验证执行计划/锁；若卡在外部 HTTP，则转查接口与超时。CPU 低不排除 I/O 等待。

**修复：** 优先终止或优化异常 SQL/锁、恢复数据库容量或隔离故障流量；必要时滚动重启受污染成员，但要先保留 Dump。只有数据库有余量且无泄漏时才评估临时扩池。

**影响面与回滚：** 计算共享该 DataSource 的应用和成员；任何连接池/SQL/发布变更都要保留原值、回退制品和流量切回路径。

**复盘：** 补充 JDBC Wait、数据库锁、慢 SQL、Thread Pool 饱和和变更关联告警，完善自动抓取有限份 Thread Dump 的审批 Runbook。

## 生产系统设计题

**题目：** 为日峰值 3000 RPS 的订单系统设计跨两台物理主机的 WebSphere traditional ND 平台，要求单 JVM、单 Node 或单 IHS 故障不整体中断，发布可回滚。

答题主线：

1. 明确请求类型、p95/p99、状态会话、数据库/MQ、RTO/RPO 和故障域。
2. 两台以上 IHS 接上游负载均衡，Plug-in 配置自动生成和审计。
3. Cluster Member 跨至少两个 Node/物理故障域，容量按少一个 Node 仍可承载设计。
4. 优先无状态；必要会话使用受支持持久化/复制并压测开销。
5. JDBC 连接总量按成员数计算，与数据库容量、超时和熔断协同。
6. 管理 DMgr/Node Agent 备份、恢复和管理面安全，业务不依赖单 DMgr 实时转发。
7. 监控入口、Servlet、Thread/JDBC/JVM、事务、MQ、数据库和变更。
8. 发布采用逐成员排空、安装、同步、启动、健康验证和逐步放量。
9. 回滚保留上一制品、配置、插件、数据库兼容和流量切换路径。

## 面试怎么讲

### 30 秒版本

```text
WebSphere 是企业 Java 应用服务器。traditional ND 用 Cell、Deployment Manager、Node Agent、Application Server 和 Cluster 做集中管理与高可用；请求通常从 IHS 的 Web Server Plug-in 进入 Cluster Member，再由 WebContainer 线程调用 JDBC/JMS/JTA 和后端系统。排障时我会把入口路由、应用状态、线程池、连接池、JVM、会话、事务和最近变更串成证据链，而不是看到进程 Started 就判断健康。
```

### 3 分钟版本

1. 区分 traditional、ND、Liberty、Open Liberty 和 IHS。
2. 解释 Profile、Cell、DMgr、Node、Node Agent、Server、Cluster。
3. 画出 Client -> IHS/Plug-in -> WebContainer -> JDBC/JMS -> Backend。
4. 解释主配置同步、应用发布、Session Affinity/Replication 和 JTA 恢复。
5. 解释 Thread Pool、JDBC Pool、Heap/GC 的背压关系。
6. 说明 PMI、日志、FFDC、Thread/Heap Dump 和 AIOps 关联。
7. 说明双 Node/IHS、高可用、滚动升级、安全和回滚。
8. 补充 traditional 到 Liberty 的迁移边界，不承诺零改造。

## 面试题与递进追问

### 1. Cell、Node、Cluster 分别是什么？

**第一问，定义：** Cell 是集中管理域，Node 是 Node Agent 管理的一组 Server，Cluster 是部署同一工作负载的一组 Application Server。

**第二问，机制：** DMgr 保存 Cell 主配置，Node Agent 同步到 Node，Cluster Member 独立运行 JVM。

**第三问，取舍：** 同 Node 多 Member 只能覆盖 JVM 故障；跨 Node 才能覆盖主机故障，但带来更多容量、证书和配置管理成本。

**第四问，故障：** Node Out of Sync 时检查 Node Agent、SOAP、认证、时间、磁盘和同步日志。

**第五问，生产：** Cluster 跨故障域，按少一个 Node 容量设计，并建立配置备份与同步告警。

### 2. DMgr 挂了业务是否中断？

**参考答案：** 运行中的 Server 通常可以继续按本地已同步配置处理业务，因为 DMgr 不在普通 HTTP 数据路径；但部署、集中配置、同步、状态管理和依赖 DMgr 的自动化会受影响。不能回答“完全没影响”，要看证书、配置、HA DMgr 和运维流程。

### 3. 为什么线程池不能越大越好？

**参考答案：** 线程越多并不等于吞吐无限增加。下游数据库只有固定连接和 CPU，过多线程会增加排队、上下文切换、内存和超时风暴。应以压测和端到端容量确定线程、连接、超时和背压。

### 4. WebSphere Cluster 如何保持 Session？

**参考答案：** 默认依靠 Plug-in Session Affinity 把请求送回原成员；若成员故障后还要恢复 Session，需要 Memory-to-Memory Replication 或 Database Persistence。复制提高可用性，但增加序列化、网络和内存成本，优先推动无状态设计。

### 5. 连接池耗尽怎么查？

**参考答案：** 看 JDBC Current/Free/Wait 与获取连接错误，再用多份 Thread Dump 判断线程是在等待连接、执行慢 SQL、等待锁还是未归还连接；同时查数据库会话和网络。先修根因，再决定是否调池。

### 6. Liberty 与 traditional 怎么选？

**参考答案：** 新应用、标准 API、容器化、配置即代码和独立发布更适合 Liberty；强依赖 traditional 专有能力、复杂存量 Cell 资源和第三方认证的应用要先扫描与验证。选型是迁移成本、支持、性能、运维模型和团队能力的综合权衡。

## 学习检查清单

- [ ] 我能区分 WAS traditional、Network Deployment、WebSphere Liberty、Open Liberty 和 IHS。
- [ ] 我能解释 Profile、Cell、DMgr、Node、Node Agent、Server 与 Cluster。
- [ ] 我能画出请求、配置同步、应用发布、Session 和事务路径。
- [ ] 我能解释 WebContainer、JDBC Pool、JMS、JTA、JNDI 和 Classloader。
- [ ] 我能使用只读命令查询进程、版本、应用和运行 MBean。
- [ ] 我知道部署、同步、重启、证书和事务日志操作的风险边界。
- [ ] 我能完成 Open Liberty 健康实验和 Feature 故障注入。
- [ ] 我能按证据排查 404、Hung Thread、连接池、OOM、同步和 SSL 故障。
- [ ] 我能设计跨 Node/IHS 的高可用、容量、安全、升级和回滚方案。
- [ ] 我能回答传统 WAS 到 Liberty 现代化的取舍与迁移步骤。

## 学习证据

完成后提交：

```text
websphere-lab/
  README.md                    # 产品边界、传统 ND 拓扑和请求路径
  server.xml                  # Open Liberty 最小配置
  health-result.json          # /health 脱敏结果
  startup.log                 # 保留 Ready 和故障消息，删除主机/IP/凭据
  incident-feature-error.md   # Feature 故障注入证据、假设、修复和清理
  incident-pool-exhaustion.md # JDBC Pool 耗尽事故推理练习
  capacity-model.md           # Thread/JDBC/JVM/Session 容量估算
  rolling-upgrade.md          # 滚动升级、验证和回滚清单
  screenshots/                # 仅保存脱敏截图
```

README 必须说明：本地实验运行的是 Open Liberty，不是生产 traditional ND；未在真实 WebSphere 上执行应用部署、全局安全修改、证书替换、事务日志删除或集群重启。真实日志、Heap Dump、FFDC 和配置备份进入 GitHub 前必须脱敏。
