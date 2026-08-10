# IBM WebSphere 技术栈深讲

> 学习目标：从零理解 WebSphere Application Server traditional 与 WebSphere Liberty 的边界，能画出一次请求经过 IBM HTTP Server、Web Server Plug-in、Cluster Member、JDBC/JMS 和后端系统的完整路径，能安全完成 EAR 更新前检查、控制台或 `wsadmin` 更新、节点同步、启动验证与回滚，能识别 BLA/Composition Unit 残留，并能分析传统 WAS 的部署、会话、线程池、连接池、JVM、证书、集群和配置同步故障。

## 官方资料

- [IBM WebSphere Application Server 9.0.5 文档](https://www.ibm.com/docs/en/was/9.0.5)
- [WebSphere Application Server traditional 生命周期策略](https://www.ibm.com/support/pages/lifecycle-policy-websphere-application-server-traditional)
- [IBM WebSphere Application Server 支持声明](https://www.ibm.com/new/announcements/ibm-websphere-application-server-support)
- [WebSphere Liberty 官方概览](https://www.ibm.com/docs/en/was-liberty/base?topic=liberty-overview)
- [WebSphere Liberty 容器镜像](https://www.ibm.com/docs/en/was-liberty/base?topic=images-liberty-container)
- [Open Liberty 入门指南](https://openliberty.io/guides/getting-started.html)
- [Open Liberty Server 配置说明](https://www.openliberty.io/docs/latest/reference/config/server-configuration-overview.html)
- [WebSphere `wsadmin` 入门](https://www.ibm.com/docs/en/was/9.0.5?topic=clients-getting-started-wsadmin-scripting)
- [更新企业应用文件的官方方法](https://www.ibm.com/docs/en/was/9.0.5?topic=files-ways-update-enterprise-application)
- [`AdminApp` 命令参考](https://www.ibm.com/docs/en/was/9.0.5?topic=scripting-commands-adminapp-object-using-wsadmin)
- [删除 Business-level Application](https://www.ibm.com/docs/en/was-nd/9.0.5?topic=applications-deleting-business-level)
- [使用 `wsadmin` 删除 Business-level Application](https://www.ibm.com/docs/en/was/9.0.5?topic=scripting-deleting-business-level-applications-using-wsadmin)
- [备份和恢复管理配置](https://www.ibm.com/docs/en/was/9.0.5?topic=files-backing-up-restoring-administrative-configuration)
- [模块到 Server/Cluster/Web Server 的映射](https://www.ibm.com/docs/en/was/9.0.5?topic=files-mapping-modules-servers)
- [应用 Edition 兼容性](https://www.ibm.com/docs/en/was-nd/9.0.5?topic=concepts-edition-compatibility)
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
  -> 应用变更：EAR、Enterprise Application、Asset、BLA、Composition Unit、Edition
  -> 发布链路：制品校验、Update、保存、同步、展开、启动、路由、业务验证、回滚
  -> 运维：Admin Console、wsadmin、PMI、日志、FFDC、Dump、备份
  -> 生产治理：高可用、容量、安全、升级、回滚、现代化迁移
```

本文分两层学习：

```text
基础层
  -> 区分 traditional 与 Liberty
  -> 认识 Cell、Node、Server、Cluster
  -> 跑通 Open Liberty 健康检查
  -> 看懂一次 EAR 安装、更新、启动和访问验证
  -> 看懂日志、线程池和 JDBC 连接池

进阶层
  -> 画出请求、配置、会话和事务路径
  -> 按阶段排查 EAR 制品、绑定、同步、启动、路由和 Composition Unit 残留
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
| `AdminTask` BLA 命令组 | 查询或删除 BLA/CU | `listBLAs`、`listCompUnits`、`deleteCompUnit`、`deleteBLA` | 输出对象或删除结果 | 删除前没查引用，或把示例 `cuID` 当真实值 |
| `Help` | 查看 wsadmin 帮助 | `Help.help()` | 输出帮助 | Jacl 与 Jython 语法混用 |

IBM 官方提醒：Server 运行时不建议在 local mode 下做冲突配置变更，因为本地配置与运行/DMgr 配置可能互相覆盖甚至损坏。自动化应默认连接 DMgr，使用 Jython、版本控制脚本、变更审计和幂等检查。

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 关键字段 / 参数 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `serverStatus` | 查询进程状态 | `serverStatus.sh -all` | Server name、status | 显示 STARTED | STARTED 不等于应用健康 |
| `startServer` | 启动 Application Server | `startServer.sh server1` | Profile、Server name | `ADMU3000I` | 从错误 Profile 启动同名 Server |
| `wsadmin` | 脚本化管理 | `wsadmin.sh -lang jython` | host、SOAP port、user、language | 连接 DMgr 并进入提示符 | 把密码明文写入 Shell History |
| `AdminApp.list` | 只读列出应用 | `print AdminApp.list()` | 可选 Target scope | 返回应用列表 | 配置存在不代表每个成员运行成功 |
| `AdminApp.update` | 更新完整 EAR、模块或文件 | `AdminApp.update(app, 'app', [...])` | content type、operation、contents、binding options | 返回更新任务结果 | 更新成功后忘记 Save/Sync/Start/业务验证 |
| `AdminTask.listBLAs` | 列出 Business-level Applications | `print AdminTask.listBLAs()` | 无参数或版本支持选项 | 返回 BLA 清单 | 损坏 CU 可能让查询本身报 `CWWMH0121E` |
| `AdminTask.listCompUnits` | 列出 BLA 中的 CU | `listCompUnits('-blaID ...')` | 准确 `blaID` | 返回 CU 清单 | `blaID` 与应用显示名混淆 |
| `AdminTask.deleteCompUnit` | 从 BLA 删除一个 CU | `deleteCompUnit('-blaID ... -cuID ...')` | 准确 `blaID`、`cuID` | 返回删除结果 | 未核对引用或删错 Edition；高风险写操作 |
| `AdminTask.deleteBLA` | 删除已经没有 CU 的 BLA | `deleteBLA('-blaID ...')` | 准确 `blaID` | 返回被删配置 ID | BLA 仍被引用、未保存配置；高风险写操作 |
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
| DMgr `SystemOut` / FFDC | EAR 分析、配置保存、Rollout Update 和管理任务 | `ADMA`/`CWWMH` 消息、应用名、任务开始与最终结果 |
| Node Agent / `syncNode.log` | Node 同步与应用二进制分发 | 连接 DMgr、下载、权限、磁盘和同步完成状态 |
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

## EAR 更新与部署：从发布门禁到故障闭环

这一节来自一次已经脱敏的真实故障复盘：旧应用卸载或失败回滚后，普通企业应用列表里已经没有目标应用，但 Business-level Application（BLA，业务级应用）和 Composition Unit（CU，组合单元）仍留在配置仓库，再次安装同名 EAR 时出现：

```text
A composition unit with name ExampleApp already exists.
ADMA5014E: Application ExampleApp installation failed.
```

继续查询 BLA 时又出现 `CWWMH0121E`，说明 CU 的企业应用配置无法正常读取。这个案例很典型，但不能因此把“移动 `blas` 和 `cus` 目录”当成所有部署问题的通用答案。大多数 EAR 故障应先在制品、应用身份、绑定、配置保存、节点同步、应用启动或 HTTP 路由层解决。

### 先说边界：“所有问题”应该怎么理解

WebSphere 版本、Java 级别、应用模块、第三方库、数据库、MQ 和安全配置组合非常多，没人能列出未来所有错误码。更可靠的学习方式，是覆盖一次更新会经过的所有阶段，并让未知错误也能归到某一阶段：

```text
制品生成
  -> 上传与解包
  -> 应用分析
  -> 模块、资源和安全绑定
  -> 写入主配置仓库
  -> 节点同步与二进制分发
  -> JVM 加载和应用启动
  -> Plug-in / Virtual Host / Context Root 路由
  -> 数据库、MQ、外部接口和业务验证
  -> 回滚与配置收敛
```

本文覆盖每一层的高频故障、证据和操作方法。若出现新的 `ADMA`、`CWWMH`、`J2CA` 或其他消息，先看它发生在哪一层，再查 IBM 对应版本的消息参考和 APAR，不要只搜索一条命令照抄。

### 安装、更新、卸载重装和 Edition 不是一回事

| 操作 | 人话解释 | 适用场景 | 主要风险 |
|---|---|---|---|
| Install | 第一次在 Cell 中创建这个应用身份 | 应用确实不存在 | 同名应用、BLA/CU 或 Asset 已存在时冲突 |
| Update | 保留应用身份，用新 EAR、模块或文件替换旧内容 | 正常版本发布 | 旧绑定合并、自动重启、部分节点未同步 |
| Uninstall + Install | 先删除旧身份，再重新创建 | 应用身份、模块结构或元数据变化必须重建时 | 中断更长、绑定丢失、卸载不完整留下孤儿对象 |
| Rollout Update | 按节点顺序传播 Cluster 中的更新 | 多节点 Cluster，尽量缩短单成员不可用时间 | 不是零中断保证；HTTP/JMS 在途工作可能受影响 |
| Application Edition | 同一应用保留多个 Edition，再激活、验证或按路由切换 | 支持 Edition 管理且新旧版本兼容 | 数据库和 Session 不兼容时仍不能无损切换 |

[IBM 的更新方式说明](https://www.ibm.com/docs/en/was/9.0.5?topic=files-ways-update-enterprise-application)把完整 EAR、单模块、单文件和 Partial Application 区分开。第一次处理正常版本发布时，优先选 **Update**，不要为了“干净”习惯性卸载重装。

Update 内部还分四种，选错对象会把一个小变更扩大成整包重启，或者把本应完整替换的内容更新残缺：

| Update 类型 | 实际更新什么 | 适合什么变更 | 新手最容易犯的错 |
|---|---|---|---|
| Full application | 用一个完整新 EAR 更新现有应用 | 模块、公共依赖或多个描述符一起变化 | 以为它只覆盖新文件；实际上新 EAR 中缺少的旧内容可能被移除 |
| Single module | 更新 EAR 内一个 WAR、EJB JAR 或 RAR | 模块 URI 不变且影响范围清楚 | 模块 URI 写错，被识别成新增模块或找不到原模块 |
| Single file | 更新归档内一个精确 URI 的文件 | 经过验证的极小变更 | `contenturi` 写错，文件落到错误位置，元数据没有重新分析 |
| Partial application | 用一组相对路径更新部分内容 | 有成熟流水线能生成、审计和回滚差异包 | 差异包漏文件，节点最终内容不再等于任何完整构建产物 |

对新手和生产常规发版，完整 EAR Update 最容易审计：新 EAR 的哈希、模块清单和测试结果能一一对应。Single Module/File/Partial 不是“更高级”，只是影响范围不同，必须能证明 URI、依赖和回滚都正确。

如果更新改变了注解相关的部署描述、类层次或元数据，仅重启应用可能不足，IBM 明确提示某些变化需要重新安装。是否重装应由变更内容和测试结果决定，不是看到报错就先卸载。

### 小白必须先懂的部署对象

| 对象 | 是什么 | 放在哪里或由谁管理 | 坏了会怎样 |
|---|---|---|---|
| EAR | 包含 WAR、EJB JAR、RAR、公共 JAR 和描述符的发布制品 | 发布仓库和上传临时目录 | ZIP 损坏、缺模块、描述符错误会在分析阶段失败 |
| Enterprise Application | 控制台“WebSphere 企业应用程序”里管理的应用身份 | Cell 配置仓库 | 同名存在时应 Update；目标和绑定错误会启动失败 |
| Asset | 被产品管理域登记的可部署二进制资产 | Asset Repository | 旧 Asset 或版本引用可能阻止删除或替换 |
| BLA | 把一个或多个可部署单元组织成业务级应用的管理对象 | `config/cells/<cell>/blas` | 引用没清理时，删除或重装可能冲突 |
| Composition Unit | BLA 中指向具体 Asset、共享库或其他 BLA 的单元 | `config/cells/<cell>/cus` | 同名孤儿 CU 会让同名安装失败 |
| Deployment | 应用部署目标、模块、Classloader 等配置对象 | Cell 主配置仓库 | `deployment.xml` 等配置损坏会影响应用加载 |
| Application Binary | 同步并展开到目标 Node 的应用文件 | 通常在 Node 的 `installedApps/<cell>` | 磁盘、权限、同步或文件锁会造成部分成员缺文件 |
| Application Edition | 同一应用的一个可管理版本身份 | Edition Control Center | Edition 未激活、路由未保存或版本不兼容会切换失败 |

这里最容易混淆的是：**控制台企业应用列表没有应用，不等于所有相关对象都已删除。** BLA、CU、Asset、Deployment 和 Node 上的应用二进制可能处于不同状态。反过来，磁盘上看到一个目录也不等于它仍是有效配置对象。

### 一次完整 EAR 更新到底改了什么

```text
发布人员提交新 EAR
  -> DMgr / stand-alone Server 接收文件
  -> 在临时工作目录解包并分析模块、注解、描述符和绑定
  -> AdminApp 更新 Enterprise Application 配置
  -> 保存到 Cell 主配置仓库
  -> Node Agent 与 DMgr 同步
  -> 新二进制传到目标 Node 并写入 installedApps
  -> 目标 JVM 停止旧应用、加载新类和资源、启动新应用
  -> 必要时重新生成和传播 plugin-cfg.xml
  -> 健康检查、业务冒烟、日志和指标确认
```

在 ND 中，配置真相以 DMgr 的 Master Repository 为准；Node Profile 是同步副本。IBM 的 `AdminApp` 参考也强调，ND 配置更新只有连接 DMgr 才可用。不要连接 Managed Node 后用 local mode 修改配置，也不要把 Node 的 `config` 目录当主仓库。

### 用“失败阶段”代替“看到报错就重启”

| 失败阶段 | 常见现象 | 第一批证据 |
|---|---|---|
| 制品 | 上传前就无法解压，EAR 哈希不符 | 制品哈希、`unzip -t`、构建记录 |
| 应用分析 | Update Wizard 或 `AdminApp.update` 在校验时报错 | DMgr/SystemOut、FFDC、EAR 描述符和模块清单 |
| 身份与对象 | `already exists`、`CWWMH0121E` | `AdminApp.list()`、BLA/CU/Asset 清单、四处目录只读检查 |
| 绑定与目标 | JNDI、EJB、资源引用或 Module Mapping 未完成 | 安装任务输出、当前绑定、目标 Server/Cluster 版本 |
| 配置保存 | Finish 成功但 Save 失败，或存在冲突工作区 | DMgr 日志、未保存变更、管理员并发操作 |
| 节点同步 | DMgr 有新版本，Node 仍是旧版本 | Node Sync 状态、Node Agent 日志、同步时间和错误 |
| 二进制分发 | 某些 Node 的 `installedApps` 未更新 | Node 磁盘/权限、Node Agent/SystemOut、制品时间和哈希 |
| 应用启动 | 安装成功但应用 Failed/Stopped | Member SystemOut/SystemErr、FFDC、Classloader/JNDI/JDBC/JMS |
| HTTP 路由 | 应用 Started，但 IHS 路径 404/503 | Context Root、Virtual Host、`plugin-cfg.xml`、Plug-in 日志 |
| 业务运行 | 健康页成功，但登录、交易或消息失败 | 业务日志、数据库/MQ/API、事务、指标和 Trace |
| 回滚 | 旧 EAR 恢复后仍失败 | 配置、数据库 Schema、缓存、Session、Plug-in 和绑定差异 |

### 更新前门禁：还没点 Update 就先做完

#### 1. 识别拓扑和唯一目标

先记录：

- WAS Edition、Fix Pack、Java SDK 和操作系统；
- stand-alone 还是 ND；
- DMgr、Cell、Node、Cluster、Server 和 IHS 名称；
- 应用名、当前 Edition、模块名、Context Root 和目标；
- 当前 EAR 的版本、SHA-256、发布时间和变更单；
- 本次是 Update、重装还是 Edition Rollout。

```bash
PROFILE_ROOT=/opt/IBM/WebSphere/AppServer/profiles/AppSrv01

"$PROFILE_ROOT/bin/versionInfo.sh"       # 查看产品与 Fix Pack；保存完整输出
"$PROFILE_ROOT/bin/serverStatus.sh" -all # 确认当前 Profile 中有哪些进程
```

如果命令来自 AppSrv Profile，却误以为自己连接的是 DMgr，后续结论会全部偏掉。ND 环境应从 DMgr Profile 启动 `wsadmin`，并在提示信息中确认连接进程类型。

#### 2. 验证 EAR 是同一个制品

```bash
EAR=/release/ExampleApp-2026.08.10.ear

sha256sum "$EAR"       # 与构建流水线记录对比；不一致就停止发布
unzip -t "$EAR"        # 校验 ZIP 结构；正常结尾应说明未发现错误
jar tf "$EAR" | sed -n '1,120p' # 查看模块和 META-INF，不会修改 EAR
```

小白要记住：文件名相同不代表内容相同。哈希能证明“现在服务器上的字节”和评审通过的字节是否一致。`unzip -t` 通过只说明压缩结构可读，不证明 Java EE 版本、类库和业务逻辑兼容。

#### 3. 保存当前应用配置，不只保存 EAR

至少记录：

- 模块到 Cluster/Server/Web Server 的映射；
- Virtual Host、Context Root；
- JNDI 资源引用、DataSource、JMS、EJB Binding；
- 安全角色到用户/组的映射和 RunAs；
- Classloader Order、WAR Classloader Policy、Shared Library；
- Session、事务、启动顺序和应用自定义属性。

旧 EAR 只能恢复代码，不能自动恢复被错误覆盖的绑定。生产应把 `AdminApp.view()` 输出、脱敏控制台截图或受控导出脚本纳入发布证据。

若应用对象当前可读，可先从正确的管理 Profile 导出已安装版本：

```python
app_name = 'ExampleApp'
AdminApp.export(app_name, '/safe/backup/ExampleApp-before-update.ear')
```

`AdminApp.export` 解决“上一版应用包还能不能取回”的问题；`backupConfig` 解决“整个管理配置仓库能不能恢复”的问题；绑定、模块映射和外部资源快照解决“配置含义能不能复原”的问题。三者不能互相替代。导出后还要计算哈希并确认文件非 0 字节。参考 [IBM 导出应用说明](https://www.ibm.com/docs/en/was/9.0.5?topic=scripting-exporting-applications-using-wsadmin)。

#### 4. 检查配置、临时目录和 Node 容量

```bash
df -h "$PROFILE_ROOT" /tmp # 检查容量；上传、解包、同步和备份都会占空间
df -i "$PROFILE_ROOT" /tmp # 检查 inode；大量小文件时容量未满也可能写不进去
```

还要检查 DMgr 与每个目标 Node。只看 DMgr 有空间不够，因为应用二进制最终要传到各 Node。不要在进程运行时为“腾空间”随意清空 `wstemp`、`temp`、`config` 或 `installedApps`。

大型 EAR 还要额外检查：

- Windows 上 Profile、Cell、应用名和归档内部路径叠加后是否过长；`CWWMH0187E` 可能指向 259 字符路径限制；
- 杀毒、备份或索引进程是否锁住 EAR/JAR/DLL；
- WebSphere 运行账号能否读源 EAR、写临时区和展开目录；
- Shell `ulimit`、可打开文件数和进程内存是否足够；
- OOM 出现在 `wsadmin` 客户端、DMgr、stand-alone Server 还是目标 Member，不能只给业务 JVM 加堆。

#### 5. 准备三类回滚材料

1. **配置回滚：** `backupConfig` ZIP，版本和 Fix Pack 必须与恢复目标一致。
2. **应用回滚：** 上一版 EAR、哈希、绑定和启动参数。
3. **业务回滚：** 数据库 Schema、缓存、消息格式和外部接口的向后兼容方案。

IBM 明确说明，`restoreConfig` 应使用与当前产品 Release 和 Fix Level 相同的备份。`backupConfig` 也不保留 UNIX/Linux 原始权限与所有者；恢复后要验证权限，不能只看到 ZIP 成功就认为万无一失。

#### 6. 为 Cluster 留出故障容量

滚动更新时至少有一个成员会暂时不可用。更新前要证明剩余成员可以承载流量，并确定：

- 如何从负载均衡或 Plug-in 中排空成员；
- 等待多长时间算在途请求结束；
- Session 是否兼容、是否会丢失；
- 每个成员用什么技术和业务探针验收；
- 哪个条件触发停止发布并回滚。

### 使用控制台更新完整 EAR

适合第一次操作、需要人工确认绑定的场景：

1. 打开 `Applications > Application Types > WebSphere enterprise applications`。
2. 先确认目标应用存在且名称完全一致；若不存在，不要点 Update 后猜原因。
3. 选中应用，点击 **Update**。
4. 选择 **Full application**，上传经过哈希核对的 EAR。
5. 逐页核对模块目标、Virtual Host、资源引用、安全角色和安装选项。
6. 点击 **Finish** 后阅读全部消息；成功分析不等于已经持久化。
7. 点击 **Save** 保存到主配置。
8. ND 环境确认各 Node 同步；Cluster 使用经过评审的 Rollout Update 或逐成员发布流程。
9. 检查每个成员的应用状态、日志、版本和业务探针。

IBM 说明：应用在运行时更新，产品通常会停止、更新并重启应用；若未自动启动，需要人工启动。不要因此省略停机影响评估，因为停止和重启本身会影响请求。

### 使用 `wsadmin` 更新完整 EAR

下面是最小 Jython 逻辑。生产建议放入版本控制脚本，增加参数校验、日志、审批号和失败退出；不要把管理员密码写进脚本或 Shell History。

```python
app_name = 'ExampleApp'
ear_path = '/release/ExampleApp-2026.08.10.ear'

print(AdminApp.list())

# content type=app 表示更新完整应用；operation=update 表示替换现有内容。
result = AdminApp.update(
    app_name,
    'app',
    ['-operation', 'update', '-contents', ear_path]
)
print(result)

# 只有前面的更新任务成功后，才保存配置。
if AdminConfig.hasChanges():
    AdminConfig.save()
```

正常输出通常包含 `ADMA5078I`（更新开始）、目标版本校验、解包、文件合并和配置写入消息。消息编号会因版本和更新类型不同而变化，判断标准是任务无异常、配置已保存、节点已同步且业务验证通过。

如果更新命令抛异常且配置尚未保存，可以用 `AdminConfig.reset()` 放弃当前 `wsadmin` 工作区中的未保存配置。但这不是万能回滚：IBM 的 `AdminApp` 文档指出，完整应用更新时，Application Analysis Report 可能在未保存前已被删除。因此，生产仍要提前备份并保留旧制品。

更新命令成功返回，也可能早于全部 Node 完成分发和展开。保存后继续查询：

```python
app_name = 'ExampleApp'

# true 说明产品判断应用二进制已准备好；ND 中尤其不能跳过。
print(AdminApp.isAppReady(app_name))

# 查看每个目标的 distribution / expansion 状态和失败信息。
print(AdminApp.getDeployStatus(app_name))

# 有返回值才说明运行时存在该应用的 Application MBean。
print(AdminControl.completeObjectName('type=Application,name=' + app_name + ',*'))
```

这三项分别回答“文件准备好了吗”“分发到哪里、是否展开成功”“JVM 里真的运行了吗”。它们仍不能替代 HTTP 和业务验证。参考 [IBM 安装应用的异步分发说明](https://www.ibm.com/docs/en/was/9.0.5?topic=scripting-installing-enterprise-applications-using-wsadmin)与[运行状态查询](https://www.ibm.com/docs/en/was-zos/9.0.5?topic=scripting-querying-application-state-using-wsadmin)。

### 为什么不推荐直接改 `installedApps`

直接替换 `installedApps` 中的文件属于 Hot Deployment/手工热部署思路。IBM 把它定位为更复杂的方式，并建议新手使用控制台更新。它的问题包括：

- DMgr 主配置不知道你改了什么；
- 下一次节点同步或 `restoreConfig` 可能覆盖手工修改；
- 注解、描述符、类层次和绑定可能没有重新分析；
- 集群不同 Node 容易出现不同字节；
- 没有稳定的审计和回滚证据。

开发环境中受控热部署不等于生产可以复制 EAR 到目录。生产默认使用 Console、`wsadmin`、属性文件或经过验证的发布工具。

### EAR 更新故障库：按阶段检查

下面不是“看到关键字就执行修复”的自动匹配表。每一类都按现象、概念、证据、修复和验证走完整闭环。

#### 1. EAR 损坏、传错版本或内容不完整

**现象：** 上传失败、解包异常、`AdminApp` 在 Extract/Analyze 阶段报错，或发布成功后发现版本不对。

**概念：** EAR 本质是 ZIP 格式的企业应用归档。WebSphere 必须先读出模块、描述符和类，才能建立部署配置。

**先查：**

1. 构建流水线与服务器文件的 SHA-256 是否一致；
2. `unzip -t` 是否完整通过；
3. `jar tf` 是否包含预期 WAR/EJB JAR、`META-INF` 和依赖；
4. 上传用户是否能读文件，路径是否写错；
5. DMgr/Server 的临时目录、Profile 和 Node 是否有磁盘与 inode。
6. Windows 完整展开路径是否过长，是否出现 `CWWMH0187E`；
7. 杀毒、备份或索引进程是否锁住了 EAR/JAR，是否出现 `ADMA0053E`。

**修复：** 从可信制品库重新获取固定版本，重新核对哈希。不要从聊天软件传来的同名文件继续重试，也不要在服务器上临时修改 EAR 后绕过构建流程。

**验证：** 构建记录、发布机和 DMgr 接收的文件哈希一致；解包测试通过；版本端点或 Manifest 显示目标版本。

#### 2. 应用名已存在，却又执行 Install

**现象：** 安装向导或脚本提示同名应用已存在。

**概念：** Install 创建新的应用身份；Update 修改已经存在的身份。相同 EAR 文件名与相同应用名不是一回事，应用名可由部署选项、描述符或人工输入决定。

**先查：**

```python
print(AdminApp.list())
```

再到控制台同时检查 WebSphere Enterprise Applications、Business-level Applications 和 Assets。

**修复：** 正常发版使用 Update。只有应用身份必须重建、已验证卸载完整且回滚方案就绪时，才采用 Uninstall + Install。

**验证：** 发布前后应用身份、模块映射和资源绑定符合设计，没有多出同名或近似名对象。

#### 3. Java、Java EE/Jakarta 或目标 Server 版本不兼容

**现象：** 应用分析提示模块版本不受目标支持；启动时出现 `UnsupportedClassVersionError`、缺少 `javax.*`/`jakarta.*` 类，或注解无法识别。

**概念：** 编译字节码级别、企业规范级别和包名空间是三条不同兼容线。WAS traditional 9.0.5 属于 Java EE 时代的运行时，使用 `jakarta.*` 命名空间的新 Jakarta EE 应用不能假设无需改造就能运行。

**先查：**

- `versionInfo` 和 `managesdk` 输出；
- EAR/WAR 的 `web.xml`、`application.xml`、`ejb-jar.xml` 版本；
- 编译工具链和 `maven.compiler.release`/Gradle Toolchain；
- 目标 Cluster 是否混有更旧版本 Node；
- IBM Detailed System Requirements 和目标 Fix Pack 文档。

**修复：** 用目标支持的 Java 和规范重新构建，或先升级受支持运行时。不要把旧 Node 留在同一部署目标后强行跳过校验。

**验证：** 在与生产相同 WAS/Java/Fix Pack 的环境完成安装、启动和接口测试；不是只在开发 Tomcat 或新 JDK 上通过。

#### 4. 部署描述符、注解或模块结构错误

**现象：** `web.xml`、`application.xml`、EJB 描述符或 IBM Binding/Extension 文件解析失败；应用分析阶段报 Schema、URI、重复模块或 Annotation 错误。

**概念：** 描述符告诉容器模块是什么、如何装配、需要哪些资源。注解也会参与元数据合并。更新了元数据，却只替换单个类或文件，可能留下旧的合并结果。

**先查：**

1. EAR 内实际描述符，而不是源码目录中的文件；
2. XML Namespace、Schema、版本、编码和闭合标签；
3. `application.xml` 的模块 URI 是否与归档路径一致；
4. `web-fragment.xml`、Annotation 与 `metadata-complete` 的关系；
5. Java EE 5 之前的 `.xmi` 与 Java EE 5+ `.xml` Binding 文件边界。

**修复：** 在构建阶段做 XML/归档校验；涉及描述符、注解或类层次的大变化时，用完整 EAR Update 或经过评审的重新安装，不要只做 Single File 热替换。

**验证：** 安装分析无警告，Web/EJB 模块清单正确，启动日志没有持续的 Metadata/Annotation 错误。

#### 5. Module Mapping、Context Root 或 Virtual Host 错误

**现象：** 安装完成但某个模块没在目标成员运行，或应用 Started 而访问 404。

**概念：** EAR 里的每个模块都要映射到 Server/Cluster；Web 模块还要有 Context Root 和 Virtual Host。Web Server 作为目标时，映射还影响 `plugin-cfg.xml` 的生成。

**先查：**

- `Applications > ... > <application> > Manage modules`；
- 每个模块的目标 Server/Cluster/Web Server；
- Context Root 是否与访问 URL 一致；
- Virtual Host Alias 是否包含实际 Host 和 Port；
- 直连 Cluster Member 与经过 IHS 的结果差异。

**修复：** 把模块映射到正确、兼容的目标；修正 Context Root/Virtual Host；保存、同步，并在路由变化时重新生成和传播 Plug-in 配置。

**验证：** 每个成员都启动正确模块；直连和 IHS 路径都返回预期状态；Plug-in 日志显示目标 URI 被正确匹配。

#### 6. JNDI、JDBC、JMS、EJB 或安全角色绑定缺失

**现象：** 安装向导停在 Binding Task；应用能安装但启动时报 `NameNotFound`、`J2CA`、JMS、EJB Binding 或安全角色错误。

**概念：** 应用代码通常只写逻辑名称，例如 `jdbc/orderDB`；部署时要把它绑定到 WebSphere 中真实资源。Update 默认可能合并旧模块绑定，但新增或改名的资源引用仍要重新映射。

**先查：**

1. EAR 中资源引用和部署描述符；
2. 当前应用 Binding 与旧版本导出记录；
3. DataSource/JMS/Shared Library 的 Scope 是否覆盖所有目标成员；
4. Authentication Alias 是否存在且有权限；
5. 安全角色、RunAs、用户组和 Access ID。

**修复：** 在正确 Scope 创建或修复资源，然后在安装任务中完成映射。不要把真实数据库密码写进 EAR、Jython 或 Git。

**验证：** 每个成员都能完成 JNDI 查找、数据库连接测试、JMS 连接和受控业务调用；不是只在一个 Node 验证。

#### 7. DMgr 配置保存失败或多人并发变更

**现象：** Update Wizard 显示 Finish，但 Save 失败；另一个管理员保存后覆盖了当前变更；`wsadmin` 有未保存工作区。

**概念：** Console/`wsadmin` 先在管理工作区准备变更，`Save` 才写入 Cell 主配置。多个管理会话同时改同一应用会产生竞态和漂移。

**先查：**

- DMgr `SystemOut.log`、`SystemErr.log` 和 FFDC；
- 控制台是否显示待保存变更；
- 同时段管理员、流水线和 Monitored Directory 是否也在发布；
- DMgr Profile 的磁盘、inode、权限与文件系统状态；
- 审计日志和变更单时间线。

**修复：** 冻结并发发布，确认唯一变更所有者；对未保存工作区选择 Save 或 Discard。配置仓库出现异常时先备份并升级管理员/IBM 支持，不要手工改 `deployment.xml`、`serverindex.xml` 或其他 XML。

**验证：** 主配置保存成功，审计记录只有预期变更，Node 同步后配置一致。

#### 8. Node Agent 不通、节点 Out of Sync 或同步到一半

**现象：** DMgr 显示新版本，但一个 Node 仍运行旧版本；应用在部分 Cluster Member 成功、部分失败。

**概念：** ND 中配置和应用二进制从 DMgr 主仓库同步到 Node。同步是发布链路的一部分，不是安装完成后的可选整理动作。

**先查：**

- Node Agent 和 DMgr 进程、SOAP 端口、网络与证书；
- `System administration > Nodes` 的同步状态；
- Node Agent/SystemOut、`syncNode.log` 和 DMgr 同时段日志；
- DMgr 与 Node 时间、磁盘、inode、权限；
- 每个 Node 的制品时间、大小和哈希。

**修复：** 先修网络、认证、证书、Node Agent 或磁盘，再执行受支持同步。不要在 Managed Node 的配置副本上手改并等待 DMgr“接受”。

**验证：** 所有目标 Node 为同步状态，各成员加载同一制品哈希和版本，重启后仍一致。

#### 9. 二进制分发、展开目录或文件锁失败

**现象：** 配置已同步，但某个 Node 的应用文件缺失；复制、解压或删除旧文件时报权限、空间或文件占用错误。

**概念：** 应用二进制在同步期间从 DMgr 下载到 Node，并写入指定安装位置。`installedApps` 是分发结果，不是独立发布源。

**先查：**

1. Node 的磁盘、inode、挂载只读状态和目录权限；
2. WAS 进程运行用户与文件所有者；
3. 安全软件、备份软件或其他进程是否占用文件；
4. 自定义 `application binaries` 路径和共享文件系统健康；
5. Node Agent/Server 日志中的复制与展开错误。

**修复：** 恢复受支持的容量和权限，解除外部文件锁，再从 DMgr 重新同步或受控重新部署。不要用 `chmod -R 777` 或复制另一个 Node 的整个目录来掩盖根因。

**验证：** 所有 Node 文件所有者、大小、哈希和时间符合发布记录；应用重新启动后无展开错误。

#### 10. 类加载或共享库冲突

**现象：** `ClassNotFoundException`、`NoClassDefFoundError`、`NoSuchMethodError`、`LinkageError`，或一个成员成功、另一个成员失败。

**概念：** 缺类和“加载了错误版本的同名类”是两类问题。Parent First/Last、WAR Classloader Policy、Shared Library 和 EAR 自带 JAR 都会影响最终类来源。

**先查：**

- 异常链中第一个业务类和 Classloader 信息；
- EAR/WAR 的 `WEB-INF/lib`、`APP-INF/lib` 与 Manifest Class-Path；
- Shared Library 内容、Scope 与关联；
- 当前 Classloader Order 和 WAR Classloader Policy；
- 所有 Node 是否真的使用同一 EAR 和共享库版本。
- 控制台 `Troubleshooting > Class loader viewer` 中，目标类实际由哪个 Classloader、哪个 JAR 加载。

**修复：** 补齐缺失依赖或消除重复版本；只有经过兼容测试才调整 Parent Last。不要把 JAR 逐个扔进全局目录试错。

**验证：** 所有成员都启动，关键类来自预期位置，完整接口与批处理路径通过，而不只是首页能打开。

#### 11. 应用启动时依赖不可用

**现象：** 安装和同步成功，应用启动失败或持续 Initializing；日志出现数据库、MQ、LDAP、证书、外部 API 或事务恢复错误。

**概念：** “部署成功”只说明配置和文件阶段完成。应用初始化还会建立资源、扫描组件、恢复事务、加载缓存并连接外部系统。

**先查：**

- Member 的 SystemOut/SystemErr/FFDC 第一条根异常；
- DataSource Test Connection 与数据库账户/网络；
- MQ/JMS、LDAP、外部 HTTPS 的证书和超时；
- JTA Transaction Log 和未决事务；
- 应用启动顺序及其他应用依赖。
- `dumpNameSpace` 的真实 JNDI 树，确认应用查找名、绑定名和 Scope 一致。

**修复：** 修复对应依赖或配置；若新版应用在启动阶段改变了数据库 Schema 或消息格式，按业务回滚计划处理。不要删除事务日志来让错误“消失”。

如果强制停止留下了 active 或 in-doubt XA 事务，应先恢复数据库、MQ 等参与方连接，再由管理员评估事务恢复模式：

```bash
"$PROFILE_ROOT/bin/startServer.sh" server1 -recovery
```

Recovery Mode（恢复模式）只处理未决事务，不接收新业务；恢复完成后 Server 会停止，再正常启动。它不是每次发版都要执行的固定步骤。`tranlog` 与 `partnerlog` 是事务恢复证据，不能作为“清缓存”删除。参考 [IBM 事务恢复模式说明](https://www.ibm.com/docs/en/was/9.0.5?topic=servers-restarting-application-server-in-recovery-mode)。

**验证：** 应用状态、依赖连接、事务、健康检查和业务冒烟同时通过，日志没有持续重试风暴。

#### 12. 应用 Started，但 IHS 返回 404、503 或旧页面

**现象：** 直连成员正常，经 IHS/负载均衡失败；或部分请求仍命中旧版本。

**概念：** 应用状态与入口路由是两层。Context Root、Virtual Host、Web Server Module Mapping 和 `plugin-cfg.xml` 决定请求能否进入正确成员。

**先查：**

1. 直连每个成员；
2. IHS access/error log 和 Plug-in log；
3. `plugin-cfg.xml` 中 URI、VirtualHostGroup、ServerCluster、Transport；
4. 生成、传播和 IHS reload/restart 的时间；
5. 上游缓存、CDN、浏览器缓存和旧 Session Affinity。

**修复：** 修正映射后通过受支持流程重新生成、传播并加载 Plug-in 配置；按需清理应用级缓存。不要长期手改生成文件，因为下次生成会覆盖。

**验证：** 带唯一版本标记的探针通过 IHS 和每个成员，访问日志显示请求只进入期望版本。

#### 13. Cluster 滚动更新造成新旧版本混跑

**现象：** 同一请求有时成功、有时失败；Session 反序列化异常；不同成员输出不同字段。

**概念：** Node 同步是异步的。IBM 对高可用更新的说明明确指出，普通同步过程中应用可用性与工作负载路由并不自动对应，因此不能把 Rollout Update 理解成绝对零中断。

**先查：**

- 每个成员的版本、启动时间、应用状态和制品哈希；
- 负载均衡/Plug-in 是否在更新前排空成员；
- Session 对象和 Cookie 是否跨版本兼容；
- 数据库 Schema、消息和 API 是否向后兼容；
- HTTP/JMS 在途工作是否在停止时丢失。

**修复：** 停止继续滚动，把不一致成员移出流量；按兼容矩阵决定完成升级还是整体回退。大变化使用 Edition + Routing Rule、蓝绿环境或明确停机，而不是强行混跑。

**验证：** 所有成员版本一致，切换成员和新建/旧 Session 的业务用例都通过。

#### 14. Console 或 `wsadmin` 超时，不知道更新到底成功没有

**现象：** 浏览器会话或 SOAP Client 超时，但后台仍可能继续分析、同步或滚动；操作人员重复点击导致并发发布。

**概念：** 客户端超时只说明客户端没有等到结果，不等于服务端已经回滚。

**先查：**

- DMgr/Node/Member 日志中的同一开始时间、应用名和任务；
- `AdminApp.list()`、当前应用版本和未保存变更；
- Node 同步、Member 状态和制品哈希；
- 是否已有另一个管理任务仍在运行。
- `wsadmin`、DMgr/stand-alone Server 和业务 Member 中哪一个进程出现 Heap Dump、Javacore 或 `OutOfMemoryError`；
- `soap.client.props` 中 `com.ibm.SOAP.requestTimeout` 是否小于本次部署真实耗时。

**修复：** 先停止重复操作，确认服务端最终状态。若任务仍运行，等待或按 IBM 支持流程处理；只有明确状态后才决定保存、回滚或重新发布。确认确实只是客户端等待不足后，才按发布耗时调整 SOAP timeout；把它设为 `0` 会取消超时保护，不应作为默认修复。若是 OOM，必须给实际 OOM 的进程做容量和堆分析，不能盲目扩大所有 JVM。

[IBM SOAP Connector 属性说明](https://www.ibm.com/docs/en/was-nd/9.0.5?topic=services-java-management-extensions-connector-properties)给出的常见客户端默认值是 180 秒，但实际值以现场文件和版本为准；大型 EAR 部署还可能让 `wsadmin` 客户端自身 OOM，见 [IBM 部署期间 OOM 排查](https://www.ibm.com/support/pages/outofmemory-errors-while-deploying-applications-websphere-application-server)。

**验证：** 任务只有一次、配置只有一个目标版本、所有 Node 收敛，审计时间线完整。

#### 15. 回滚旧 EAR 后仍未恢复

**现象：** 旧制品重新部署成功，但业务仍报错，或只有部分用户恢复。

**概念：** 应用回滚不等于系统回滚。数据库 Schema、缓存、Session、MQ 消息、外部 API、绑定和 Plug-in 都可能已经变化。

**先查：**

- 旧 EAR 哈希与旧绑定是否准确；
- 数据库迁移是否向后兼容；
- 新版是否写入旧版无法读取的数据/消息；
- Session、缓存、插件和路由是否仍指向新结构；
- 是否只回退部分成员。

**修复：** 按预先评审的业务回滚顺序处理，必要时切回完整旧环境而不是反复覆盖同一应用。数据库回退必须由数据负责人审批并验证恢复点。

**验证：** 技术状态、业务交易、数据一致性、消息积压、错误率和延迟同时恢复到基线。

### 案例深挖：同名 Composition Unit 残留

#### 脱敏后的现场证据

| 检查项 | 结果 | 能证明什么 |
|---|---|---|
| WebSphere Enterprise Applications | 没有 `ExampleApp` | 正常企业应用身份已经不在列表中 |
| `AdminApp.list()` | 没有 `ExampleApp` | 脚本视角也没有正常 Enterprise Application |
| `AdminTask.listBLAs()` | 对 `ExampleApp` 报 `CWWMH0121E` | BLA/CU 配置读取异常，可能损坏 |
| `AdminTask.listAssets()` | 需要现场查询 | 确认同名 Asset 是否存在、是否仍被其他 CU 引用 |
| `config/cells/<cell>/blas` | 有 `ExampleApp` | 同名 BLA 配置仍在 |
| `config/cells/<cell>/cus` | 有 `ExampleApp` | 同名 CU 配置仍在 |
| `applications` / `installedApps` | 没有 `ExampleApp` | 正常应用配置和 Node 二进制不在原位置 |

不能只凭一条 `find` 就下结论。这个案例之所以指向孤儿 BLA/CU，是因为“管理对象、四处目录和错误消息”同时支持同一个假设。

#### 先走受支持的删除路径

[IBM 的 BLA 删除文档](https://www.ibm.com/docs/en/was-nd/9.0.5?topic=applications-deleting-business-level)要求先删除 BLA 中的 Composition Unit，再删除 BLA，最后保存配置。`wsadmin` 的准确顺序是：

```python
app_name = 'ExampleApp'
bla_id = 'WebSphere:blaname=' + app_name

print(AdminTask.listBLAs())
print(AdminTask.listAssets())
print(AdminTask.listCompUnits('-blaID ' + bla_id))

# 只有 listCompUnits 能准确返回目标，而且已确认没有其他 BLA 引用时才删除。
print(AdminTask.deleteCompUnit('-blaID ' + app_name + ' -cuID ' + app_name))
print(AdminTask.deleteBLA('-blaID ' + app_name))
AdminConfig.save()
```

真实 `cuID` 不一定等于应用名。必须使用 `listCompUnits` 或控制台显示的准确值，不能把示例直接复制到生产。

`-force true` 会绕过一部分依赖保护，不是“删得更干净”的常规参数。遇到 `CWWMH0149E`，通常表示 BLA 里仍有 CU；遇到 `CWWMH0151E`，通常表示该 BLA 仍被上层 BLA 引用；Asset 被 CU 使用时也不能先删。先画清依赖，再决定顺序。

控制台路径是：

```text
Applications
  -> Application Types
  -> Business-level applications
  -> <目标 BLA>
  -> 先删除每个 Composition Unit
  -> 再删除空 BLA
  -> Save
```

如果控制台和 `listCompUnits` 可以正常读取并删除，就到这里为止。不要继续碰文件系统。

#### 什么时候才进入手工仓库处理

IBM 只在下面前提成立时，把手工处理 `blas/<BLA>` 与 `cus/<BLA>` 作为最后兜底：

1. 控制台 Delete 没有完整删除 BLA/CU，或损坏对象已经无法通过管理接口读取；
2. 已确认目标 BLA 不被其他 BLA 引用；
3. 精确确认应用名、BLA、CU、Cell 和拓扑；
4. 在 stand-alone Server 或 DMgr 主仓库侧处理，而不是 Managed Node 副本；
5. 已完成配置备份、维护窗口、回滚和影响面审批；
6. 多服务器环境随后从 DMgr 同步 Node。

> **高风险边界：** 下面是配置仓库恢复，不是日常发布步骤。`AdminApp.list()` 中仍有正常应用、引用关系不清、ND 同步异常、同名目录不只两处、或存在大量其他仓库错误时，立即停止并升级 WebSphere 资深管理员或 IBM Support。

IBM 原文使用“删除精确目录”。为了降低误删且保留对象级回退，本文示例先把两个精确目录移动到 Profile 外的隔离目录。这是可恢复的运维安全改写，不是对 IBM 命令的逐字引用；正式执行仍要服从现场版本文档、变更审批和 IBM Support 意见。

#### 第一步：只读确认 Profile、Cell 和拓扑

```bash
PROFILE_ROOT=/opt/IBM/WebSphere/AppServer/profiles/AppSrv01
CELL_NAME=exampleCell
SERVER_NAME=server1
APP_NAME=ExampleApp

cd "$PROFILE_ROOT"
ls -la config/cells/ # 先看真实 Cell 名，不要照抄 exampleCell
"$PROFILE_ROOT/bin/serverStatus.sh" -all
```

进入 `wsadmin` 后确认连接对象并查询：

```python
print(AdminApp.list())
print(AdminTask.listBLAs())
print(AdminTask.listAssets())
print(AdminTask.listCompUnits('-blaID WebSphere:blaname=ExampleApp'))
```

如果输出显示连接 DMgr，就是 ND 管理面；如果连接 `server1` 且只有一个 AppSrv Profile，才可能是 stand-alone。不能只根据目录名猜拓扑。

#### 第二步：只读检查四类位置

```bash
cd "$PROFILE_ROOT"

find "config/cells/$CELL_NAME/blas" -iname "*$APP_NAME*" -print
find "config/cells/$CELL_NAME/cus" -iname "*$APP_NAME*" -print
find "config/cells/$CELL_NAME/applications" -iname "*$APP_NAME*" -print
find "installedApps" -iname "*$APP_NAME*" -print
```

只有 `blas/<APP_NAME>` 和 `cus/<APP_NAME>` 命中，且管理清单无正常应用、BLA/CU 读取损坏时，才符合本案例。若 `applications` 或 `installedApps` 也命中，说明状态不同，不能套用这个清理步骤。

#### 第三步：停服并生成可验证配置备份

stand-alone 示例：

```bash
cd "$PROFILE_ROOT/bin"
./stopServer.sh "$SERVER_NAME" # 安全启用时用公司批准的凭据方式，不把密码写进命令历史

CONFIG_ZIP=/tmp/AppSrv01_before_${APP_NAME}_cleanup_$(date +%Y%m%d_%H%M%S).zip
./backupConfig.sh "$CONFIG_ZIP" -nostop # 已经停服，所以不再让 backupConfig 尝试停服
ls -lh "$CONFIG_ZIP"
```

继续条件：

- 停止命令明确成功，且该 Profile 没有仍在写配置的 Java 进程；
- `backupConfig` 返回成功；
- ZIP 存在、非 0 字节，完整路径已经记录；
- 备份与当前 WAS Release/Fix Pack 一致。

ND 不是只停止一个 Member 就可以手工改仓库。若进入 IBM 的手工兜底，目标是 **DMgr Profile 的主配置仓库**，需要按审批决定 DMgr、Node Agent 和成员的停止/恢复顺序，并评估整个 Cell 的影响。

#### 第四步：移动前再次锁定两个精确目录

```bash
cd "$PROFILE_ROOT"

BLA_DIR="config/cells/$CELL_NAME/blas/$APP_NAME"
CU_DIR="config/cells/$CELL_NAME/cus/$APP_NAME"
CASE_BACKUP=/tmp/${APP_NAME}_orphan_$(date +%Y%m%d_%H%M%S)

ls -ld "$BLA_DIR" "$CU_DIR" # 两项都必须精确显示，不能是通配符返回的一组目录
mkdir -p "$CASE_BACKUP"
printf 'quarantine=%s\n' "$CASE_BACKUP"
```

源故障手册有一处排版错误，把续行后的目标写成了 `+"$BACKUP/..."`。前面的 `+` 会变成路径的一部分，不能照抄。这里使用完整单行命令避免歧义：

```bash
mv "$BLA_DIR" "$CASE_BACKUP/blas_$APP_NAME"
mv "$CU_DIR" "$CASE_BACKUP/cus_$APP_NAME"
```

不要移动整个 `blas` 或 `cus`，不要处理 `applications`、`installedApps`、`deployment.xml`、`serverindex.xml` 或其他应用目录，也不要使用 `rm -rf`。

#### 第五步：立刻核对移动结果

```bash
ls -la "$CASE_BACKUP"

find "config/cells/$CELL_NAME/blas" -iname "*$APP_NAME*" -print
find "config/cells/$CELL_NAME/cus" -iname "*$APP_NAME*" -print
```

预期是隔离目录中恰好有两个对象，原位置两个 `find` 无输出。如果数量、名称或路径不符合预期，不要启动后继续重装，先按对象级备份恢复并复核。

#### 第六步：启动并先验证配置层

stand-alone 示例：

```bash
cd "$PROFILE_ROOT/bin"
./startServer.sh "$SERVER_NAME"
./serverStatus.sh "$SERVER_NAME"
```

再进入 `wsadmin`：

```python
print(AdminTask.listBLAs())
print(AdminTask.listAssets())
print(AdminApp.list())
```

预期：不再出现针对 `ExampleApp` 的 `CWWMH0121E`，正常应用清单未受影响。此时还没有重装 `ExampleApp`，所以不要把“列表里仍没有它”误判成清理失败。

ND 需要先恢复 DMgr 管理面、保存/确认主配置，再同步每个 Node；同步成功后才能验证成员。不要从 Node 副本反向覆盖 DMgr。

#### 第七步：重新安装 EAR 并完成全链路验证

1. 用固定哈希 EAR 执行 Install；
2. 核对应用名、模块目标、Virtual Host、Context Root、JNDI/JDBC/JMS 和安全角色；
3. Save，并在 ND 中完成 Node 同步；
4. 启动应用；
5. 检查 DMgr、Node Agent、Member、IHS/Plug-in 日志；
6. 完成健康检查和关键业务冒烟；
7. 记录 EAR 哈希、备份路径、变更单和验证人。

只有“同名安装成功”还不够。它只能证明 CU 冲突解除，不能证明数据库、MQ、事务、路由和业务都正常。

#### stand-alone 与 ND 的操作边界

| 项目 | stand-alone | ND / Cluster |
|---|---|---|
| 配置真相 | AppSrv Profile 自己的仓库 | DMgr Profile 的 Master Repository |
| `wsadmin` 连接 | Application Server | DMgr |
| 手工兜底位置 | stand-alone Profile | 只在 DMgr 主仓库，不能改 Managed Node 副本 |
| 影响面 | 一个 Server 上的应用 | 整个 Cell、多个 Node/Cluster Member |
| 后续动作 | 启动 Server、验证、重装 | 恢复 DMgr、保存/同步 Node、逐成员验证 |
| 何时升级 | 状态与证据不一致 | 默认更早升级资深管理员/IBM Support |

#### Composition Unit 清理如何回退

如果启动失败、其他应用异常或证据与预期不一致：

1. 停止继续安装和保存新变更；
2. 保存启动日志、FFDC、目录清单和时间线；
3. 在对应管理进程停止后，把隔离目录中的两个对象移回原精确位置；
4. 如果对象级恢复不足，由管理员评估 `restoreConfig`；
5. `restoreConfig` 前确认备份版本/Fix Pack 一致，并评估备份之后的其他配置变更；
6. ND 恢复后重新同步所有 Node，并验证其他应用。

整体 `restoreConfig` 会回退整个 Profile，不只是一个应用。它可能覆盖故障之后的其他合法变更，所以不能把它当作第一步。

### 更新后的验收清单

#### 配置与制品

- [ ] DMgr/stand-alone 主配置已保存；
- [ ] 所有 Node 同步；
- [ ] `AdminApp.isAppReady()` 为 `true`，`getDeployStatus()` 无未完成分发或展开失败；
- [ ] 每个目标成员的 EAR 版本和哈希一致；
- [ ] BLA/CU/Asset/Enterprise Application 没有孤儿或重复对象；
- [ ] 模块目标、Context Root、Virtual Host 和绑定符合基线。

#### 运行与入口

- [ ] 所有目标成员应用 Started，启动日志无持续错误；
- [ ] 每个目标成员都能查询到预期 Application MBean；
- [ ] 直连成员和 IHS/负载均衡路径都通过；
- [ ] `plugin-cfg.xml` 在需要时已重新生成、传播和加载；
- [ ] 新旧 Session、Cookie 和缓存行为符合预期；
- [ ] 错误率、延迟、线程池、JDBC Pool、Heap/GC 没有异常回归。

#### 业务与回滚

- [ ] 数据库、JMS/MQ、LDAP 和外部 API 连接正常；
- [ ] 登录、查询、写入、交易或消息至少完成一轮冒烟；
- [ ] 数据库 Schema 和消息格式与回滚版本兼容；
- [ ] 旧 EAR、配置备份和对象隔离目录仍在保留期内；
- [ ] 变更单记录实际开始/结束、异常、处置和验证人。

### 把 EAR 发布接入 AIOps

不要只采集“部署成功/失败”一个布尔值。建议把下面事件写入变更和观测平台：

```json
{
  "change_id": "CHG-20260810-001",
  "cell": "prodCell",
  "cluster": "orderCluster",
  "application": "ExampleApp",
  "artifact_sha256": "<sha256>",
  "stage": "node-sync",
  "node": "appNode01",
  "result": "failed",
  "message_id": "<IBM message id>",
  "rollback_ready": true
}
```

AIOps 可以做：

- 把发布窗口与 5xx、延迟、JDBC Wait、GC 和告警自动关联；
- 检测同一 Cluster 成员版本或哈希不一致；
- 检测 Node Out of Sync、应用状态漂移和 Plug-in 版本过旧；
- 根据消息 ID 推荐只读 Runbook 和证据清单；
- 在未通过容量、备份、审批和探针门禁时阻止继续滚动。

AIOps 不应自动做：删除 BLA/CU、修改配置仓库 XML、执行 `restoreConfig`、回退数据库或强制停止整个 Cluster。这些动作影响面大，需要人工确认和可验证回滚。

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
WebSphere 是企业 Java 应用服务器。traditional ND 用 Cell、Deployment Manager、Node Agent、Application Server 和 Cluster 做集中管理与高可用；EAR 更新会经过制品分析、配置保存、节点同步、二进制分发、应用启动和入口路由。排障时我会把应用身份、BLA/CU、同步、类加载、资源绑定、线程池、连接池、JVM、会话、事务和最近变更串成证据链，而不是看到安装完成或进程 Started 就判断健康。
```

### 3 分钟版本

1. 区分 traditional、ND、Liberty、Open Liberty 和 IHS。
2. 解释 Profile、Cell、DMgr、Node、Node Agent、Server、Cluster。
3. 画出 Client -> IHS/Plug-in -> WebContainer -> JDBC/JMS -> Backend。
4. 解释主配置同步、应用发布、Session Affinity/Replication 和 JTA 恢复。
5. 解释 Thread Pool、JDBC Pool、Heap/GC 的背压关系。
6. 说明 PMI、日志、FFDC、Thread/Heap Dump 和 AIOps 关联。
7. 说明 EAR 的 Install、Update、Rollout Update、Edition 和卸载重装边界。
8. 说明制品校验、配置备份、BLA/CU 残留、Node Sync、业务验证和回滚。
9. 说明双 Node/IHS、高可用、滚动升级、安全和回滚。
10. 补充 traditional 到 Liberty 的迁移边界，不承诺零改造。

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

### 7. EAR 更新时报“同名 Composition Unit 已存在”怎么查？

**第一问，先判断操作类型：** 如果 `AdminApp.list()` 中仍有正常同名应用，正常发版应走 Update，不应再次 Install。

**第二问，建立证据链：** 交叉检查 Enterprise Application、BLA、CU、Asset，以及 `applications`、`installedApps`、`blas`、`cus` 四类位置。单独看到目录不能直接判定孤儿对象。

**第三问，优先受支持删除：** 若 BLA/CU 能正常读取，先用控制台或 `listCompUnits -> deleteCompUnit -> deleteBLA -> AdminConfig.save()` 清理，并确认没有其他 BLA 引用。

**第四问，损坏对象怎么处理：** 只有管理接口不能完整删除、引用关系明确、备份和维护窗口就绪时，才按 IBM 文档在 stand-alone 或 DMgr 主仓库精确处理同名 `blas/cus`；ND 不能改 Managed Node 副本。

**第五问，如何证明恢复：** 清理后先验证 `listBLAs` 不再报错、其他应用未受影响，再重装 EAR，完成节点同步、所有成员启动、IHS 路由和业务冒烟。必须保留配置 ZIP、隔离目录、EAR 哈希和回滚条件。

## 学习检查清单

- [ ] 我能区分 WAS traditional、Network Deployment、WebSphere Liberty、Open Liberty 和 IHS。
- [ ] 我能解释 Profile、Cell、DMgr、Node、Node Agent、Server 与 Cluster。
- [ ] 我能画出请求、配置同步、应用发布、Session 和事务路径。
- [ ] 我能解释 WebContainer、JDBC Pool、JMS、JTA、JNDI 和 Classloader。
- [ ] 我能使用只读命令查询进程、版本、应用和运行 MBean。
- [ ] 我能区分 EAR Install、Update、Uninstall + Install、Rollout Update 和 Application Edition。
- [ ] 我能画出 EAR 从上传、分析、保存、同步、展开、启动到 IHS 路由的完整路径。
- [ ] 我能在更新前核对 EAR 哈希、模块与绑定、Node 容量、配置备份和业务回滚。
- [ ] 我能按制品、身份、绑定、仓库、同步、启动、路由和业务阶段定位部署失败。
- [ ] 我能解释 Asset、BLA、Composition Unit、Enterprise Application 和 `installedApps` 的区别。
- [ ] 我知道 Composition Unit 残留必须先走控制台/`wsadmin`，手工处理仅是有前提的最后兜底。
- [ ] 我能说明 stand-alone 与 ND 在配置真相、处理位置、同步和影响面上的差异。
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
  ear-update-checklist.md     # 制品、绑定、容量、备份、发布和回滚门禁
  ear-inventory-redacted.txt # 应用、BLA/CU、模块目标和版本的脱敏只读清单
  incident-orphan-cu.md       # Composition Unit 残留证据链与安全恢复复盘
  artifact-sha256.txt         # 新旧 EAR 哈希和制品来源
  rollback-evidence.md        # 配置、应用、数据库与路由回滚验证
  incident-pool-exhaustion.md # JDBC Pool 耗尽事故推理练习
  capacity-model.md           # Thread/JDBC/JVM/Session 容量估算
  rolling-upgrade.md          # 滚动升级、验证和回滚清单
  screenshots/                # 仅保存脱敏截图
```

README 必须说明：本地实验运行的是 Open Liberty，不是生产 traditional ND；未在真实 WebSphere 上执行应用部署、BLA/CU 删除、配置仓库修改、全局安全修改、证书替换、事务日志删除或集群重启。真实应用名、Cell/Node、主机/IP、日志、Heap Dump、FFDC、EAR 和配置备份进入 GitHub 前必须脱敏；不要提交真实 EAR、密码或配置备份 ZIP。
