# Apache Tomcat 技术栈深讲

> 学习目标：从零理解 Tomcat 的版本边界、容器层级、HTTP 请求路径、WAR 部署、类加载、线程与连接队列、JNDI/JDBC、会话和集群，能用 Docker 跑通一个可观测的 JSP 应用，完成一次 `web.xml` 故障注入，并能设计生产高可用、容量、安全、升级和回滚方案。

## 官方资料

- [Apache Tomcat 官方首页](https://tomcat.apache.org/)
- [Tomcat 版本与 Jakarta/Java 兼容矩阵](https://tomcat.apache.org/whichversion.html)
- [Tomcat 11 文档首页](https://tomcat.apache.org/tomcat-11.0-doc/index.html)
- [Tomcat 11 架构说明](https://tomcat.apache.org/tomcat-11.0-doc/architecture/index.html)
- [Tomcat 11 配置参考](https://tomcat.apache.org/tomcat-11.0-doc/config/)
- [HTTP Connector 配置参考](https://tomcat.apache.org/tomcat-11.0-doc/config/http.html)
- [部署与 Deployer 说明](https://tomcat.apache.org/tomcat-11.0-doc/deployer-howto.html)
- [类加载说明](https://tomcat.apache.org/tomcat-11.0-doc/class-loader-howto.html)
- [监控与 JMX](https://tomcat.apache.org/tomcat-11.0-doc/monitoring.html)
- [安全加固清单](https://tomcat.apache.org/tomcat-11.0-doc/security-howto.html)
- [Tomcat 迁移指南](https://tomcat.apache.org/migration.html)
- [Tomcat Docker Official Image](https://hub.docker.com/_/tomcat)

说明：本文基于 Apache Tomcat 与 Docker Official Image 官方资料重新组织，不复制官方全文。版本号会持续变化，动手前应再次检查兼容矩阵、下载页、变更日志和安全公告。

截至 2026-07-28，官方兼容矩阵中的主要受支持分支是：

| 分支 | 当前版本 | 最低 Java | 规范与迁移边界 |
|---|---:|---:|---|
| Tomcat 11.0.x | 11.0.24 | Java 17 | 面向 Jakarta EE 11 所需的一组 Web 相关规范；Servlet 6.1、Pages 4.0、EL 6.0、WebSocket 2.2 |
| Tomcat 10.1.x | 10.1.57 | Java 11 | 面向 Jakarta EE 10 相关 Web 规范；应用使用 `jakarta.*` 包名 |
| Tomcat 9.0.x | 9.0.120 | Java 8 | Java EE 8 / Servlet 4.0；最后一个主要使用 `javax.*` 包名的 Tomcat 分支 |

这里的“实现规范”不等于“完整 Jakarta EE 应用服务器”。Tomcat 的核心定位是 Servlet/JSP 容器和 Web 服务器，它不原生提供完整平台中的全部 EJB、JMS、JTA 等能力。

## 官方知识地图

```text
Tomcat 官方资料
  -> 版本：Tomcat 11 / 10.1 / 9 与 Java、Jakarta 规范
  -> 启动：Bootstrap、Catalina、CATALINA_HOME、CATALINA_BASE
  -> 容器：Server、Service、Engine、Host、Context、Wrapper
  -> 接入：Coyote、HTTP/1.1、HTTP/2、TLS、AJP、反向代理
  -> 应用：WAR、Servlet、Filter、Listener、JSP、WebSocket
  -> 资源：JNDI、JDBC DataSource、Realm、Session
  -> 运维：Manager、JMX、JULI、Access Log、Thread Dump、Heap Dump
  -> 生产：集群、容量、安全、升级、回滚、故障诊断
```

本文按两层学习：

```text
基础层
  -> 认清 Tomcat、JDK、反向代理和应用的边界
  -> 看懂目录、容器层级和一次 HTTP 请求
  -> 跑通一个 JSP 应用并读取日志
  -> 处理 404、端口冲突和应用部署失败

进阶层
  -> 解释线程、连接、队列和下游连接池的背压关系
  -> 设计多实例、高可用、会话和无状态发布
  -> 建立指标、日志、链路、变更和告警证据链
  -> 完成容量、安全、升级、回滚、事故和系统设计
```

## 场景开场

凌晨网关开始报 `502`，监控显示 Tomcat 的 Java 进程仍在，CPU 只有 35%，运维同事准备先重启。

但“进程活着”只证明 JVM 没退出。应用可能部署失败，Connector 线程可能全部卡在数据库，JDBC 连接池可能耗尽，反向代理可能连错端口，Full GC 可能让实例长时间没有响应，刚发布的 WAR 也可能只在一半节点上成功。

真正的排障起点不是重启，而是先回答：请求有没有到 Tomcat、进入了哪个 Context、占用了哪个线程、卡在哪个依赖、哪些节点受影响、最近发生过什么变更。

## 一句话人话版

```text
Tomcat = 把 HTTP 请求交给 Java Web 应用执行，并负责连接接入、Servlet 生命周期、会话、部署和运行诊断的轻量应用容器。
```

## 小白可能会问

- **Tomcat 和 NGINX、Apache HTTP Server 是一回事吗？** 不是。NGINX/Apache HTTP Server 常负责公网接入、TLS、静态资源和反向代理；Tomcat 重点运行 Servlet、JSP 和 Java Web 应用。
- **装了 JDK 就能访问 Java 网站吗？** 不能。JDK 提供 Java 运行与开发工具，Tomcat 在 JVM 上提供 Web 容器；还要部署应用、开放端口并通过健康检查。
- **Spring Boot 自带 Tomcat，还需要学外置 Tomcat 吗？** 需要。嵌入式和外置方式的生命周期不同，但 Connector、线程、请求、Session、JVM、日志和故障分析知识相通。
- **Tomcat 进程在，为什么仍然 404？** 进程状态、应用状态和 URL 路由是三件事。Context 没部署、Context Path 写错、WAR 启动失败都可能返回 404。
- **Tomcat 11 能直接运行老的 `javax.servlet` 应用吗？** 通常不能直接运行。Tomcat 10 以后改用 `jakarta.*` 命名空间，需要迁移源码、依赖、描述符并完成兼容性测试。

## 为什么要学

Tomcat 广泛出现在 Java 单体应用、Spring MVC、传统 WAR 部署、政企系统、内部管理平台和部分微服务中。SRE、DevOps 与 AIOps 工程师不能只把它看成“8080 端口上的一个 Java 进程”，而要把它拆成可观测对象：

```text
入口流量
  -> Connector 连接与线程
  -> Engine / Host / Context 路由
  -> Filter / Servlet / Framework
  -> JDBC / 缓存 / 消息 / 外部 API
  -> JVM Heap / GC / OS / 容器资源
  -> 响应、Access Log、指标和链路
```

学会 Tomcat 后，你可以把“接口慢”转成证据：

- 网关和 Access Log 能证明请求到了哪里。
- JMX 能证明线程是否忙、Session 是否异常、请求错误是否上升。
- Thread Dump 能证明线程是在运行、等待锁，还是卡在数据库和外部接口。
- GC 日志和 Heap Dump 能证明是否存在内存压力或泄漏。
- 发布记录和制品哈希能证明故障是否与变更相关。

## 是什么

Apache Tomcat 是开源的 Servlet 容器和 Web 服务器。Servlet 可以理解为“接收 HTTP 请求并生成响应的 Java 组件”；JSP（Jakarta Server Pages）会被 Jasper 编译成 Servlet 后运行。

Tomcat 主要包含：

- **Coyote**：接收和解析 HTTP/AJP 连接，把请求交给容器。
- **Catalina**：实现 Servlet 容器层级、应用生命周期、Session、安全和请求处理。
- **Jasper**：把 JSP 编译成 Java Servlet。
- **Tribes**：为 Tomcat 集群通信和 Session 复制提供能力。
- **JULI**：Tomcat 对 `java.util.logging` 的扩展日志实现。

### 产品边界

| 名称 | 主要职责 | Tomcat 是否替代它 |
|---|---|---|
| JDK / JVM | 运行 Java 字节码，提供内存、线程、GC 和诊断工具 | 不替代；Tomcat 运行在 JVM 上 |
| NGINX / Apache HTTP Server | 边缘接入、TLS、静态资源、代理、限流 | 不完全替代；生产常放在 Tomcat 前面 |
| Spring Boot 嵌入式 Tomcat | 应用进程自己创建和管理 Tomcat | 属于 Tomcat 的另一种交付模型 |
| WebSphere / WebLogic / 完整 Jakarta EE Server | 更完整的企业平台、集中管理和企业规范能力 | Tomcat 更轻，不能假装拥有全部平台能力 |
| Kubernetes | 调度、服务发现、滚动发布、自愈和资源治理 | 不替代；Kubernetes 可以承载 Tomcat |
| 数据库 / Redis / MQ | 保存业务状态、缓存和消息 | 不替代；Tomcat 只是调用这些依赖 |

## 它解决什么问题

1. 监听 HTTP/TLS/AJP 连接并把请求交给 Java Web 应用。
2. 管理 Servlet、Filter、Listener、JSP、WebSocket 和 Session 生命周期。
3. 通过 WAR 或展开目录部署应用。
4. 通过 JNDI 为应用提供 DataSource 等受管资源。
5. 提供 Realm、Valve、Manager、JMX、Access Log 和诊断入口。
6. 支持多虚拟主机、多应用、反向代理和一定范围的 Session 集群。

Tomcat 不自动解决：

- 数据库和消息系统高可用。
- 应用代码的慢 SQL、死锁、内存泄漏和幂等。
- 多节点配置中心、发布编排和全局一致性。
- 完整的流量治理、熔断、限流、服务网格和业务级健康判断。

## 核心原理

### 启动路径

```text
catalina.sh / catalina.bat
  -> Bootstrap.main()
  -> 创建 Tomcat 类加载器
  -> Catalina 解析 server.xml
  -> 初始化 Server / Service / Connector / Container
  -> 部署 Host appBase 下的 Context
  -> 初始化 Filter / Listener / Servlet
  -> Connector 开始接收请求
```

启动日志出现 `Server startup in ... milliseconds` 只能证明 Tomcat Server 完成启动。每个应用是否成功部署，还要检查部署日志、Context 状态和业务探针。

### 一次 HTTP 请求的数据路径

```text
浏览器 / API Client
  -> DNS / 负载均衡 / 反向代理
  -> Coyote HTTP Connector
  -> Socket、连接限制和请求线程
  -> Catalina Engine
  -> Host：按域名选择虚拟主机
  -> Context：按 URL 前缀选择 Web 应用
  -> Wrapper：选择目标 Servlet
  -> Valve / Filter Chain
  -> Servlet / Spring MVC / 业务代码
  -> JDBC / Redis / MQ / 外部 API
  -> 响应沿原路径返回
  -> Access Log、应用日志、指标、Trace
```

一个普通同步请求在处理期间需要占用一个请求线程。线程不够时，请求先等待可用线程；连接达到 `maxConnections` 后，操作系统再按 `acceptCount` 控制的队列排队。队列也满时，新连接会超时或被拒绝。

### 应用部署路径

```text
WAR / 展开目录
  -> Host 扫描 appBase
  -> 创建 Context
  -> 读取 META-INF/context.xml 与 WEB-INF/web.xml
  -> 建立 Webapp ClassLoader
  -> 扫描注解、JAR、ServletContainerInitializer
  -> 初始化 Listener、Filter、Servlet
  -> Context 标记可用
  -> 请求按 Context Path 进入应用
```

部署成功必须同时满足：制品完整、描述符可解析、类和依赖兼容、资源可绑定、应用初始化成功、端点可访问。

### 状态与一致性

Tomcat 本身没有像 Kubernetes API Server 或 WebSphere Deployment Manager 那样的集中控制面。多实例时至少要区分这些状态：

| 状态 | 常见位置 | 一致性风险 |
|---|---|---|
| Tomcat 配置 | 每个实例的 `conf/` 或镜像/配置管理 | 节点参数漂移，导致只有部分节点异常 |
| 应用制品 | `webapps/`、镜像层或制品仓库 | WAR 版本或哈希不一致 |
| HTTP Session | 本 JVM、复制节点或外部存储 | 节点故障后登录态丢失、复制风暴、对象不兼容 |
| 临时和编译产物 | `work/`、`temp/` | 旧 JSP 产物、磁盘满、文件权限问题 |
| 业务数据 | 数据库、缓存、消息系统 | Tomcat 重启不能修复业务一致性 |
| 运行状态 | JVM 内存、线程、连接池 | 实例间天然不同，必须逐实例观测 |

生产环境应把配置和应用做成不可变、可追踪的版本，用 CI/CD 或配置管理统一发布，而不是人工登录每台主机复制文件。

## 关键术语拆解

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| `CATALINA_HOME` | Tomcat 程序二进制和共享库所在目录 | 多实例可以共享同一套程序文件 |
| `CATALINA_BASE` | 某个实例自己的配置、应用、日志、临时目录 | 隔离不同实例的端口、配置和应用 |
| Server | 一个 Tomcat 运行实例的顶层容器 | 对应 `server.xml` 根元素 |
| Service | 把一组 Connector 与一个 Engine 关联起来 | 一个 Service 可有多个接入 Connector |
| Connector | 接收 HTTP、HTTPS 或 AJP 连接的入口 | 线程、连接、超时和 TLS 从这里开始 |
| Engine | Service 的请求处理入口 | 把请求继续路由到 Host |
| Host | 虚拟主机 | 按域名隔离应用 |
| Context | 一个 Web 应用 | 通常对应一个 WAR 和一个 Context Path |
| Wrapper | 一个 Servlet 的容器 | 把请求映射到具体 Servlet |
| Valve | 插在 Container 请求链上的处理组件 | 常用于 Access Log、认证和请求控制 |
| Filter | 应用级请求过滤链 | 常用于鉴权、Trace、编码和审计 |
| Realm | 用户、密码和角色的认证授权数据源 | 保护 Manager 或容器管理的应用 |
| WAR | Web Application Archive | Java Web 应用的标准归档格式 |
| Context Path | 应用在 URL 中的前缀 | `orders.war` 默认对应 `/orders` |
| JNDI | Java Naming and Directory Interface | 应用用逻辑名查找 DataSource 等资源 |
| JMX | Java Management Extensions | 读取 JVM 和 Tomcat MBean 运行指标 |
| Session | 跨 HTTP 请求保存的用户会话状态 | 影响扩容、故障接管和发布兼容性 |

## 核心知识树

### `CATALINA_HOME` 与 `CATALINA_BASE`

**是什么：** `CATALINA_HOME` 指向 Tomcat 安装目录；`CATALINA_BASE` 指向某个实例的运行目录。

**为什么需要：** 一套只读程序文件可以服务多个实例，每个实例仍拥有独立端口、配置、应用、日志和临时文件。

**怎么工作：** 启动脚本从 `HOME/bin` 读取程序，从 `BASE/conf` 加载实例配置，并把应用、日志、工作目录落在 `BASE`。

**怎么看 / 怎么用：** 运行 `version.sh` 或 `version.bat` 查看 `CATALINA_HOME`、`CATALINA_BASE`、Java Home 和 JVM 版本。

**坏了怎么查：** 如果配置明明修改却不生效，先确认实际 `CATALINA_BASE`；不要只改共享 `HOME` 后猜测实例会自动使用。

### Server、Service、Engine、Host、Context 与 Wrapper

**是什么：** 这是 Tomcat 从实例到 Servlet 的容器树。

**为什么需要：** 它把连接入口、虚拟主机、应用和 Servlet 的职责分开。

**怎么工作：** Connector 接收请求后，Engine 按主机交给 Host，Host 按 Context Path 交给 Context，再由 Wrapper 找到 Servlet。

**怎么看 / 怎么用：** 重点读 `conf/server.xml`、`conf/Catalina/localhost/*.xml`、应用的 `WEB-INF/web.xml` 和启动日志。

**坏了怎么查：** 404 时依次验证 Host、Context Path、Context 部署和 Servlet Mapping；不要只确认端口能连通。

### Coyote Connector、线程、连接与队列

**是什么：** Connector 是网络入口，负责 Socket、HTTP 解析、连接限制和请求线程调度。

**为什么需要：** 外部连接速度与应用处理速度不同，必须通过线程和队列控制并发与背压。

**怎么工作：** 普通同步请求占用线程；线程最多增长到 `maxThreads`。连接可继续增长到 `maxConnections`，随后由操作系统队列和 `acceptCount` 承接。

**怎么看 / 怎么用：** 通过 JMX 查看 `ThreadPool` 的 `currentThreadsBusy`、`currentThreadCount`、`maxThreads` 和 Connector 请求统计；结合负载均衡超时、Access Log 延迟与 Thread Dump。

**坏了怎么查：** 忙线程长期接近上限时，先找线程在等什么。盲目增大 `maxThreads` 可能让数据库、内存和上下文切换更糟。

### Catalina、Valve、Filter 与 Servlet

**是什么：** Catalina 是 Servlet 容器；Valve 属于 Tomcat Container 链，Filter 属于 Web 应用链，Servlet 执行业务入口。

**为什么需要：** 不同层负责不同范围的日志、安全、路由和业务处理。

**怎么工作：** 请求先经过 Engine/Host/Context/Wrapper 上配置的 Valve，再进入应用 Filter Chain，最后到 Servlet。

**怎么看 / 怎么用：** AccessLogValve 在 `server.xml`；Filter 和 Servlet 通常在 `web.xml`、注解或框架配置中。

**坏了怎么查：** 请求没进应用日志但 Access Log 有记录时，检查路由、Valve、Filter 和初始化异常；过滤器顺序错误也会造成认证或编码问题。

### WAR、Context Path 与自动部署

**是什么：** WAR 是应用归档，Context Path 是访问路径前缀。

**为什么需要：** 一台 Tomcat 可以隔离运行多个 Web 应用。

**怎么工作：** Host 根据 `appBase`、`autoDeploy`、`deployOnStartup` 和 `unpackWARs` 扫描应用。`ROOT.war` 映射 `/`，`orders.war` 通常映射 `/orders`。

**怎么看 / 怎么用：** 检查 `webapps/`、`conf/Catalina/localhost/`、Manager 应用、启动部署日志和 URL。

**坏了怎么查：** 同名 WAR、目录和 Context XML 可能冲突；热替换还可能残留旧类、旧连接和旧工作文件。生产优先重新创建实例或容器。

### 类加载与依赖隔离

**是什么：** Tomcat 使用 Bootstrap、System、Common 和每个应用独立的 Webapp ClassLoader 加载类。

**为什么需要：** 多个应用需要隔离自己的 JAR，同时共享 Tomcat 与 Java 基础类。

**怎么工作：** Web 应用通常先看 `WEB-INF/classes` 和 `WEB-INF/lib`，但 Java 基础类和 Tomcat 实现的 Jakarta API 等存在委派例外。

**怎么看 / 怎么用：** 检查应用 `WEB-INF/lib`、`CATALINA_BASE/lib`、`catalina.properties` 的 loader 配置、制品依赖树和启动日志。

**坏了怎么查：** `ClassNotFoundException` 先查缺失 JAR；`NoSuchMethodError`、`LinkageError` 重点查同名库版本冲突；不要把所有业务依赖都塞进全局 `lib/`。

### JNDI、DataSource 与 JDBC 连接池

**是什么：** JNDI 提供资源命名，DataSource 负责提供和复用数据库连接。

**为什么需要：** 数据库地址、凭据和连接池参数不应硬编码在每个请求中。

**怎么工作：** 应用按 `java:comp/env/jdbc/...` 查找 DataSource，从池中借连接，执行 SQL 后归还。

**怎么看 / 怎么用：** 检查 Context Resource、驱动 JAR、JNDI 名称、池活跃数、等待数、借还耗时和数据库会话。

**坏了怎么查：** 连接池耗尽时同时查泄漏、慢 SQL、数据库锁、网络超时和池容量。把连接池直接调大可能先压垮数据库。

### Session 与 Tomcat Cluster

**是什么：** Session 保存用户会话；Tomcat Cluster 可在节点间复制 Session 和部分上下文信息。

**为什么需要：** 多实例负载均衡时，用户后续请求可能落到其他节点。

**怎么工作：** 常见方案是负载均衡粘性会话、Tomcat 内存复制，或把必要状态放到外部存储。Tomcat 集群通信要求受信网络。

**怎么看 / 怎么用：** 查看活跃 Session、平均存活时间、Session 大小、路由 Cookie、复制通道和节点切换后的登录状态。

**坏了怎么查：** 登录态丢失先查 Cookie Domain/Path、粘性路由、节点切换、对象可序列化和版本兼容；复制流量暴涨时检查大 Session 和节点数量。

### 外置 Tomcat 与嵌入式 Tomcat

**是什么：** 外置模式由平台启动 Tomcat 再部署 WAR；嵌入式模式由应用 `main()` 创建 Tomcat 并打包为可执行 JAR。

**为什么需要：** 两种方式适应传统集中运维和现代应用自治。

**怎么工作：** 外置模式运行时与应用制品分离；嵌入式模式的 Tomcat 版本、配置和生命周期跟随应用。

**怎么看 / 怎么用：** 看制品是 WAR 还是可执行 JAR，看启动命令、依赖树、配置来源和端口所有者。

**坏了怎么查：** 不要在 Spring Boot 嵌入式应用里盲找外置 `server.xml`；也不要假设升级系统 Tomcat 能升级应用内打包的 Tomcat。

## 架构和数据流

### 单实例学习拓扑

```text
Client
  -> localhost:18080
  -> Tomcat Connector
  -> ROOT Context
  -> index.jsp
```

它适合学习，不是生产高可用。

### 生产拓扑

```text
用户
  -> DNS / WAF
  -> 四层或七层负载均衡
  -> NGINX / Apache HTTP Server / Ingress
  -> Tomcat A（可用区 A）
  -> Tomcat B（可用区 B）
  -> Tomcat C（容量冗余）
       -> 数据库高可用
       -> Redis / Session Store
       -> MQ
       -> 外部服务

每一层
  -> Metrics
  -> Logs
  -> Traces
  -> Change Events
  -> Alert / RCA / Runbook
```

### 故障域

至少把这些故障域分开：

- 单个 Servlet 或业务接口。
- 单个 Context / WAR。
- 单个 Tomcat JVM。
- 单台主机或单个容器节点。
- 单个机架、可用区或数据中心。
- 数据库、缓存、消息和第三方依赖。
- 负载均衡、DNS、证书和网络入口。
- 同一版本或同一配置造成的共因故障。

多开几个 JVM 不能消除共因故障。错误 WAR、过期证书、同一数据库连接池配置或同一机房断电仍可能同时影响全部实例。

### 高可用设计

1. 至少两个实例跨主机或故障域部署，并保留 N+1 容量。
2. 区分存活探针、就绪探针和业务探针；JVM 活着不等于可以接流量。
3. 优先让应用无状态，把关键状态放到可靠外部系统。
4. 若必须使用 Session，明确粘性、复制或外部存储的取舍和失败行为。
5. 采用不可变制品、滚动或蓝绿发布；逐实例验证版本、哈希和配置。
6. 反向代理超时应与 Tomcat、应用和下游超时形成有边界的链路。
7. 数据库、Redis、MQ 和配置中心必须各自有高可用与容量设计。

## 安装与启动

### 方式一：压缩包安装

前提是安装受支持的 Java。Linux/macOS 使用：

```bash
java -version # 确认 Java 版本；Tomcat 11 至少需要 Java 17
echo "$JAVA_HOME" # 确认 Tomcat 会使用哪套 Java
./bin/version.sh # 查看 Tomcat、CATALINA_BASE、JVM 和操作系统信息
./bin/configtest.sh # 解析关键配置；看到配置无严重错误才继续
./bin/startup.sh # 启动 Tomcat
tail -f logs/catalina.out # 观察启动和应用部署日志
```

Windows PowerShell 使用：

```powershell
java -version # 确认 Java 版本
$env:JAVA_HOME # 查看当前 JAVA_HOME
.\bin\version.bat # 查看 Tomcat 与 JVM 信息
.\bin\configtest.bat # 检查配置
.\bin\startup.bat # 启动
Get-Content .\logs\catalina.*.log -Wait # 持续读取 Catalina 日志
```

预期看到 Tomcat 版本、Java Home，并在启动日志中看到 Server startup。然后还要访问业务健康端点。

### 方式二：Docker 学习环境

```powershell
docker version # Client 和 Server 都有版本信息，说明 Docker Engine 可用
docker pull tomcat:11.0.24-jdk21-temurin-noble # 拉取本文固定的学习镜像
docker run --rm tomcat:11.0.24-jdk21-temurin-noble /usr/local/tomcat/bin/version.sh # 只打印版本后退出
```

正常结果包含 `Server version: Apache Tomcat/11.0.24` 和 Java 21。本文固定版本是为了让实验可复现；生产还要记录镜像 Digest，并建立安全补丁更新流程。

### 目录字典

```text
CATALINA_BASE/
  bin/       启停、版本、诊断脚本
  conf/      server.xml、web.xml、context.xml、logging.properties
  lib/       实例和全部应用共享的库
  logs/      容器日志、访问日志、应用输出
  temp/      临时文件
  webapps/   默认应用部署目录
  work/      JSP 编译和应用工作文件
```

| 目录 | 正常用途 | 常见坑 |
|---|---|---|
| `conf/` | 实例配置 | 手工改多台节点导致漂移 |
| `lib/` | 真正需要跨应用共享的库 | 业务 JAR 冲突污染全部应用 |
| `logs/` | 日志证据 | 无轮转导致磁盘满 |
| `webapps/` | WAR 或展开目录 | 热覆盖产生半发布状态 |
| `work/` | JSP 编译产物 | 误把临时产物当源代码 |
| `temp/` | 运行临时文件 | 清理前未确认进程和路径 |

## 配置详解

### `server.xml` 的容器树

下面不是完整生产配置，只用来理解层级：

```xml
<Server port="-1" shutdown="SHUTDOWN">
  <Service name="Catalina">
    <Connector
      port="8080"
      protocol="HTTP/1.1"
      connectionTimeout="20000"
      maxThreads="200"
      maxConnections="8192"
      acceptCount="100"
      maxParameterCount="1000" />

    <Engine name="Catalina" defaultHost="localhost">
      <Host
        name="localhost"
        appBase="webapps"
        unpackWARs="true"
        autoDeploy="true">
        <Valve
          className="org.apache.catalina.valves.AccessLogValve"
          directory="logs"
          prefix="localhost_access_log"
          suffix=".txt"
          pattern="%h %l %u %t &quot;%r&quot; %s %b %D %{X-Request-ID}i" />
      </Host>
    </Engine>
  </Service>
</Server>
```

| 配置项 | 含义 | 生产判断 |
|---|---|---|
| `port` | Connector 监听端口 | 与代理、Service 和防火墙保持一致 |
| `connectionTimeout` | 等待请求数据的连接超时 | 太长会占资源，太短会误伤慢客户端 |
| `maxThreads` | 内部线程池最大请求线程数 | 使用外部 Executor 时这里会被忽略 |
| `maxConnections` | Connector 同时接受和处理的连接上限 | 不是业务成功并发数 |
| `acceptCount` | 达到连接上限后 OS 等待队列参考值 | 队列只会延迟失败，不会增加处理能力 |
| `maxParameterCount` | 可解析参数数量上限 | 兼顾业务需要和资源滥用防护 |
| `appBase` | Host 的应用目录 | 不要指向不受控可写目录 |
| `unpackWARs` | 是否展开 WAR | 影响磁盘、启动和发布模型 |
| `autoDeploy` | 运行中是否自动扫描变更 | 不可变生产环境通常更谨慎 |
| Access Log `pattern` | 访问日志字段 | `%D` 记录微秒耗时，请求 ID 用于跨层关联 |

不要照抄上述线程和连接值到生产。先做压测，结合 CPU、堆、GC、平均与尾延迟、JDBC 连接池、下游容量和失败目标确定参数。

### JVM 参数放在哪里

外置 Tomcat 推荐把实例 JVM 参数放到 `bin/setenv.sh` 或 `bin/setenv.bat`，避免直接修改发行版自带的 `catalina` 脚本。

```bash
export CATALINA_OPTS="-Xms2g -Xmx2g -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/tomcat"
```

这只是写法示例，不是生产推荐值。`Xms/Xmx` 必须结合容器内存限制、非堆内存、线程栈、Direct Buffer、Native Memory 和系统余量设计。Heap Dump 可能包含敏感数据，路径要限权并保证空间。

### 应用级 Context

```xml
<Context>
  <Resource
    name="jdbc/orders"
    auth="Container"
    type="javax.sql.DataSource"
    factory="org.apache.tomcat.jdbc.pool.DataSourceFactory"
    driverClassName="org.postgresql.Driver"
    url="${orders.db.url}"
    username="${orders.db.user}"
    password="${orders.db.password}"
    maxActive="30"
    maxWait="3000"
    testOnBorrow="true"
    validationQuery="SELECT 1" />
</Context>
```

生产不要把真实密码提交到 Git。应通过受控 Secret、凭据文件、JNDI 工厂或平台密钥机制注入，并限制配置文件权限。池参数还要与数据库总连接预算协调。

### 反向代理后的地址

代理终止 TLS 时，应用仍需要知道原始协议、主机和客户端地址。可以由受信代理传递 `Forwarded` / `X-Forwarded-*`，并在 Tomcat 配置 `RemoteIpValve` 或由框架处理。

安全边界是“只信任明确的代理网段”。如果直接信任任何客户端提交的 `X-Forwarded-For`，审计和访问控制就可能被伪造。

## 常用命令

### 启停与配置

```bash
./bin/version.sh # 查看 Tomcat、JVM、CATALINA_HOME 和 CATALINA_BASE
./bin/configtest.sh # 在启动或重启前检查配置解析
./bin/catalina.sh run # 前台运行，适合容器和调试
./bin/catalina.sh start # 后台启动
./bin/catalina.sh stop # 请求优雅停止
```

正常启动后仍要检查 Context 日志和业务端点。停止超时先抓线程和请求状态，不要直接删除 PID 文件假装已停止。

### 端口、HTTP 与日志

```bash
ss -lntp | grep 8080 # 查看 8080 是否监听及进程；无输出说明未监听或权限不足
curl -i http://127.0.0.1:8080/health # 查看状态码、响应头和业务健康内容
tail -n 100 logs/catalina.out # 查看最近容器与应用输出
tail -n 100 logs/localhost_access_log*.txt # 查看请求状态、字节和耗时
```

Windows 可用：

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen # 确认监听进程
curl.exe -i http://127.0.0.1:8080/health # 使用 curl.exe 避免 PowerShell 别名差异
Get-Content .\logs\catalina.*.log -Tail 100 # 查看最近日志
```

### JVM 诊断

```bash
jcmd -l # 列出本机 Java 进程和启动主类
jcmd <PID> VM.version # 查看目标 JVM 版本
jcmd <PID> VM.flags # 查看实际生效 JVM 参数
jcmd <PID> Thread.print > thread-$(date +%s).txt # 保存 Thread Dump
jcmd <PID> GC.heap_info # 查看堆概况
jcmd <PID> GC.class_histogram > histogram.txt # 生成类实例直方图，会产生诊断开销
jcmd <PID> JFR.start name=incident settings=profile duration=60s filename=incident.jfr # 录制 60 秒 JFR
```

JFR 是 Java Flight Recorder。它能记录线程、锁、CPU、分配、GC 和 I/O 等事件。生产执行诊断前应评估开销、磁盘、权限和敏感信息，并遵守变更流程。

### Manager 文本接口

```bash
curl -u "$TOMCAT_USER:$TOMCAT_PASSWORD" \
  http://127.0.0.1:8080/manager/text/list # 列出 Context、状态、Session 和路径
```

自动化用户只授予 `manager-script` 等必要角色，Manager 只开放给管理网络。不要把用户名和密码直接写进脚本、命令历史或仓库。

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 关键字段 / 参数 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `version.sh` / `version.bat` | 查看运行基础信息 | `bin/version.sh` | Base、Home、Java Home | 版本与预期一致 | 查的是另一套实例 |
| `configtest` | 启动前解析配置 | `bin/configtest.sh` | XML、组件初始化 | 无严重配置错误 | 通过不代表应用业务可用 |
| `catalina run` | 前台启动 | `catalina.sh run` | 当前环境变量 | 日志在标准输出 | 终端退出会结束进程 |
| `curl -i` | 验证 HTTP | `curl -i URL` | 状态码、Header、Body | 200 与正确业务内容 | 只测主页，没有测依赖 |
| `jcmd Thread.print` | 抓线程快照 | `jcmd PID Thread.print` | 线程状态、栈、锁 | 得到可分析 Dump | 只抓一次看不到变化趋势 |
| `jcmd JFR.start` | 录制 JVM 事件 | `duration=60s` | 名称、时长、文件 | 生成 `.jfr` | 无磁盘预算或未脱敏 |
| Manager `/text/list` | 列应用状态 | 带最小权限凭据访问 | Context、状态、Session | 应用为 `running` | 对公网暴露管理接口 |
| `maxThreads` | 限制并发请求线程 | Connector 属性 | 线程池上限 | 忙线程低于上限且延迟稳定 | 使用 Executor 后被忽略 |
| `maxConnections` | 限制连接数 | Connector 属性 | 并发连接上限 | 连接有余量 | 与成功请求吞吐混为一谈 |
| `acceptCount` | 控制等待队列 | Connector 属性 | OS backlog | 突发时短暂排队 | 用大队列掩盖过载 |
| `connectionTimeout` | 限制读取请求等待 | 毫秒 | 客户端与代理行为 | 慢连接被有界处理 | 与业务处理超时混淆 |
| AccessLogValve | 记录访问证据 | `pattern=...` | 状态、字节、耗时、请求 ID | 能按请求关联 | 未轮转或记录敏感 Header |
| JMX | 暴露 MBean | 本地或受控远程 JMX | ObjectName、Attribute | 可读取线程和请求指标 | 无认证、无 TLS 地暴露远程端口 |

## 在 AIOps 中的作用

Tomcat 位于“应用运行时”这一层。它把入口请求、应用执行、JVM 资源和下游依赖连接起来，是异常检测和根因分析的重要证据源。

### 指标

建议至少采集：

| 层 | 指标 | 能回答的问题 |
|---|---|---|
| Connector | 请求数、错误数、处理时间、接收/发送字节 | 流量、错误和延迟是否异常 |
| Thread Pool | 当前线程、忙线程、最大线程 | 是否线程耗尽或长期排队 |
| Session | 活跃 Session、创建/过期/拒绝数 | 会话量和异常是否上升 |
| JVM | Heap、Metaspace、GC 次数/暂停、线程、类加载 | 是否内存、GC 或线程异常 |
| 进程/容器 | CPU、RSS、文件句柄、网络、磁盘、重启次数 | 是否资源耗尽或被平台杀死 |
| 依赖 | JDBC 活跃/空闲/等待、SQL 延迟、外部调用 | Tomcat 慢是否由下游造成 |

Tomcat 没有默认提供 Prometheus `/metrics`。常见做法是通过安全配置的 JMX Exporter、OpenTelemetry Java Agent、应用指标库或平台 Agent 转换和采集；选择前要验证版本、开销和标签基数。

### 日志

至少区分：

- Access Log：谁在何时访问什么、状态码、响应大小和耗时。
- Catalina 日志：容器启动、停止、部署和组件错误。
- Localhost / Host 日志：虚拟主机和应用上下文相关错误。
- 应用日志：业务异常、请求 ID、用户或订单等业务上下文。
- GC 日志：内存回收和暂停。
- 反向代理日志：入口状态、上游地址、上游耗时。

日志中应贯穿 `trace_id` 或 `request_id`，但不要记录密码、Token、Cookie、身份证号等敏感数据。

### 链路

OpenTelemetry Java Agent 可以在不大改代码的情况下采集常见 Servlet、JDBC 和 HTTP Client 调用链。链路要与 Access Log、应用日志和发布版本关联，才能回答：

```text
哪个入口请求慢
  -> 落到哪个 Tomcat 实例
  -> 哪个 Servlet / Controller
  -> 哪条 SQL 或外部调用
  -> 是否与某次发布同时发生
```

### 告警

不要只告警“Tomcat 进程不存在”。更有用的组合包括：

- 用户侧 5xx 或成功率违反 SLO。
- p95/p99 延迟持续异常。
- 忙线程接近上限，同时请求排队或代理超时上升。
- GC 暂停、Heap 使用和分配速率共同异常。
- JDBC 等待上升、活跃连接满、数据库延迟上升。
- 应用部署失败或 Context 不可用。
- 实例版本、配置哈希或 WAR 哈希不一致。

### 自动化边界

可自动执行的低风险动作：

- 收集版本、配置哈希、应用列表、日志片段和只读 JMX 指标。
- 在告警时抓取有频率限制的 Thread Dump。
- 把异常实例从负载均衡摘除，再执行业务探针。
- 比对发布前后错误率、延迟和资源指标。

需要审批或强保护的动作：

- 重启全部实例。
- 清空 `work/`、`temp/` 或 Session。
- 修改线程池、JDBC 池、证书、Realm 和远程 JMX。
- 回滚 WAR、JDK 或数据库变更。

## 入门实验：运行一个可观测的 Tomcat 应用

### 实验目标

启动 Tomcat 11.0.24，访问一个 JSP 健康端点，看到 HTTP 200、Tomcat 版本、请求 ID、启动日志和 Access Log。

### 前提

- Docker Desktop 或 Docker Engine 正常。
- 端口 `18080` 未被占用。
- 实验目录没有生产配置和生产数据。

先检查：

```powershell
docker version # 必须同时看到 Client 和 Server
Get-NetTCPConnection -LocalPort 18080 -ErrorAction SilentlyContinue # 无输出表示端口通常未占用
```

### 第一步：创建目录

```text
tomcat-aiops-lab/
  compose.yaml
  webapps/
    ROOT/
      index.jsp
      WEB-INF/
        web.xml
```

### 第二步：创建 `compose.yaml`

```yaml
services:
  tomcat:
    image: tomcat:11.0.24-jdk21-temurin-noble
    ports:
      - "18080:8080" # 主机 18080 映射到容器 Tomcat 8080
    volumes:
      - ./webapps/ROOT:/usr/local/tomcat/webapps/ROOT:ro # 只读挂载实验应用
    restart: "no" # 学习环境不自动重启，避免掩盖故障
```

官方镜像默认不会自动启用示例应用。这里显式挂载自己的 `ROOT` 应用。

### 第三步：创建 `webapps/ROOT/WEB-INF/web.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app
  xmlns="https://jakarta.ee/xml/ns/jakartaee"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="https://jakarta.ee/xml/ns/jakartaee https://jakarta.ee/xml/ns/jakartaee/web-app_6_1.xsd"
  version="6.1">
  <display-name>tomcat-aiops-lab</display-name>
  <welcome-file-list>
    <welcome-file>index.jsp</welcome-file>
  </welcome-file-list>
</web-app>
```

### 第四步：创建 `webapps/ROOT/index.jsp`

```jsp
<%@ page contentType="application/json; charset=UTF-8" %>
<%
  String requestId = request.getHeader("X-Request-ID");
  if (requestId == null || requestId.isBlank()) {
    requestId = "missing";
  }
%>
{"status":"UP","requestId":"<%= requestId %>","server":"<%= application.getServerInfo() %>"}
```

这是学习用 JSP。生产 JSON 接口应使用框架和 JSON 序列化库，并校验、转义外部输入。

### 第五步：启动并观察日志

在 `tomcat-aiops-lab` 目录运行：

```powershell
docker compose up -d # 后台启动
docker compose ps # 状态应为 Up
docker compose logs --no-color tomcat # 应看到 Server startup 和 ROOT 应用部署信息
docker compose exec tomcat /usr/local/tomcat/bin/version.sh # 查看容器内实际 Tomcat 与 Java 版本
```

### 第六步：访问与验证

```powershell
curl.exe -i -H "X-Request-ID: lab-001" http://127.0.0.1:18080/
```

预期结果：

```text
HTTP/1.1 200
Content-Type: application/json;charset=UTF-8

{"status":"UP","requestId":"lab-001","server":"Apache Tomcat/11.0.24"}
```

再查看 Access Log：

```powershell
docker compose exec tomcat sh -lc "tail -n 5 /usr/local/tomcat/logs/localhost_access_log*.txt"
```

预期能看到 `GET / HTTP/1.1` 和状态码 `200`。

### 验证结果

- [ ] 容器为 Up。
- [ ] `version.sh` 显示 Tomcat 11.0.24 与 Java 21。
- [ ] HTTP 返回 200。
- [ ] JSON 中有 `status`、`requestId` 和 `server`。
- [ ] Access Log 有本次请求。

### 如果没有成功

按顺序检查：

1. `docker version` 是否有 Server 信息。
2. `docker compose ps` 是否显示容器退出。
3. `docker compose logs tomcat` 是否有 XML、权限、JSP 编译或端口错误。
4. `Get-NetTCPConnection -LocalPort 18080` 是否被其他进程占用。
5. 目录是否真的是 `webapps/ROOT/WEB-INF/web.xml`，大小写是否正确。
6. 使用的是 `curl.exe` 还是 PowerShell 的旧 `curl` 别名。

### 清理

```powershell
docker compose down # 停止并删除实验容器和网络，不删除本地实验文件
```

## 故障注入实验：让 Tomcat 进程活着但应用部署失败

### 实验目标

主动挂载一个错误的 `web.xml`，观察容器仍运行、应用却返回 404 的现象，完成“现象 -> 证据 -> 假设 -> 验证 -> 修复 -> 清理”。

### 实验边界

- 只操作本地 `tomcat-aiops-lab`。
- 不连接生产数据库，不修改真实 Tomcat。
- 故障通过 Compose 覆盖文件注入，移除覆盖后即可恢复。

### 实验前提

- 已完成基础实验，并保留正常的 `compose.yaml`、`index.jsp` 和 `web.xml`。
- Docker Engine 正常，`18080` 端口没有被其他程序占用。
- 已保存一份正常响应，便于故障前后对照。

### 第一步：增加故障文件

目录增加：

```text
tomcat-aiops-lab/
  compose.fault.yaml
  faults/
    web.xml
```

`compose.fault.yaml`：

```yaml
services:
  tomcat:
    volumes:
      - ./faults/web.xml:/usr/local/tomcat/webapps/ROOT/WEB-INF/web.xml:ro
```

`faults/web.xml` 故意使用错误的结束标签：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee" version="6.1">
  <display-name>broken-tomcat-aiops-lab</display-name>
</broken-web-app>
```

### 第二步：注入故障

```powershell
docker compose -f compose.yaml -f compose.fault.yaml up -d --force-recreate
docker compose -f compose.yaml -f compose.fault.yaml ps
curl.exe -i http://127.0.0.1:18080/
```

预期现象：

- 容器仍可能显示 Up。
- HTTP 不再返回原来的 200，通常为 404。
- 这证明“JVM/Tomcat 进程活着”不等于“Context 可用”。

### 第三步：收集证据

```powershell
docker compose -f compose.yaml -f compose.fault.yaml logs --no-color tomcat
```

在日志中查找 XML 解析、Context 启动或应用部署失败信息：

```powershell
docker compose -f compose.yaml -f compose.fault.yaml logs --no-color tomcat |
  Select-String -Pattern "Parse|SAX|deploy|Context|SEVERE"
```

证据链：

```text
容器 Up
  + 8080 仍监听
  + ROOT 返回 404
  + 日志出现 web.xml 解析 / Context 部署错误
  -> 根因在应用部署，不在 Docker 进程存活
```

### 第四步：形成并验证假设

假设：`web.xml` XML 不合法，ROOT Context 启动失败。

验证：

1. 对比正常和故障 `web.xml`。
2. 确认故障文件结束标签不是 `</web-app>`。
3. 查看日志时间与 `--force-recreate` 时间一致。
4. 确认没有同时发生端口冲突和镜像拉取失败。

### 第五步：修复与回归

关闭带故障覆盖的实例，再只用基础 Compose 启动：

```powershell
docker compose -f compose.yaml -f compose.fault.yaml down
docker compose -f compose.yaml up -d --force-recreate
curl.exe -i -H "X-Request-ID: lab-recovered" http://127.0.0.1:18080/
```

预期重新得到 200 和 `"status":"UP"`。

### 第六步：清理

```powershell
docker compose -f compose.yaml down
```

保留以下学习证据后，可以手工删除整个 `tomcat-aiops-lab` 实验目录：

- 正常响应。
- 故障响应。
- 部署失败日志。
- 修复后响应。
- 一页故障复盘。

### 如果没有得到预期故障

1. 用 `docker compose config` 确认覆盖后的嵌套挂载存在。
2. 用 `docker compose exec tomcat cat /usr/local/tomcat/webapps/ROOT/WEB-INF/web.xml` 确认容器看到的是故障文件。
3. 确认执行了 `--force-recreate`，旧容器不会继续使用旧挂载。
4. 如果是 500 而不是 404，也以部署日志为准；不同阶段失败可能返回不同状态。

## 常见故障排查

### Tomcat 启动失败

- **现象：** 进程立即退出，端口未监听。
- **证据：** 标准输出、Catalina 日志、`configtest`、系统服务日志。
- **常见原因：** `server.xml` XML 错误、端口占用、Java 版本不兼容、目录无权限、Listener 或 Realm 初始化失败。
- **处理：** 先修复配置或依赖，再启动；不要无限自动重启制造日志噪声。

### 访问返回 404

- **现象：** Tomcat 首页或某端口可访问，但业务 URL 404。
- **检查：** Context Path、WAR 文件名、部署日志、Manager 应用列表、Servlet Mapping、代理重写。
- **常见原因：** 应用未部署、Context 启动失败、路径写错、ROOT 与业务 WAR 混淆。
- **处理：** 先恢复 Context 可用并验证直连，再修复代理路由。

### 代理返回 502 / 504

- **现象：** 通过 NGINX/负载均衡失败，直连节点可能正常或很慢。
- **检查：** 代理 upstream、DNS、端口、连接拒绝、上游耗时、Tomcat Access Log 和健康检查。
- **区别：** 502 常见于上游连接或协议失败；504 常见于等待上游超时，但最终以具体代理日志为准。
- **处理：** 不要只放大代理超时；先定位是网络、线程、GC 还是下游慢。

### 线程池耗尽

- **现象：** 忙线程接近上限，延迟与超时上升，CPU 不一定高。
- **检查：** JMX ThreadPool、连续 3 次 Thread Dump、Access Log 慢请求、数据库和外部调用。
- **常见原因：** 慢 SQL、锁等待、无限外部超时、大文件 I/O、代码死锁。
- **处理：** 先限制流量、摘除异常节点或回滚变更，再修复阻塞点；线程池调大必须经过容量验证。

### JDBC 连接池耗尽

- **现象：** 请求线程等待连接，数据库连接池活跃数到顶。
- **检查：** 池等待时间、借出连接、泄漏检测、慢 SQL、数据库锁和会话上限。
- **处理：** 修复连接未关闭、慢事务或数据库瓶颈；池上限要服从数据库总连接预算。

### Full GC、OOM 或容器被杀

- **现象：** 长暂停、响应锯齿、`OutOfMemoryError`、退出码 137 或平台 OOMKilled。
- **检查：** GC 日志、Heap/Non-Heap、Native Memory、线程数、容器限制、Heap Dump、JFR。
- **处理：** 先保存证据和隔离流量，再按对象增长、缓存、类加载器、线程和 Direct Buffer 分析。仅增大 `-Xmx` 可能延后故障。

### `ClassNotFoundException` / `NoSuchMethodError`

- **现象：** 应用启动失败，或请求到某功能才失败。
- **检查：** `WEB-INF/lib`、全局 `lib/`、Maven/Gradle 依赖树、制品哈希、类加载日志。
- **区别：** 前者多为类缺失，后者多为运行时加载了错误版本。
- **处理：** 统一依赖和作用域，减少全局共享库，重新构建并灰度验证。

### `javax.*` 与 `jakarta.*` 不兼容

- **现象：** Tomcat 9 应用迁到 10/11 后类找不到、Servlet 初始化失败。
- **检查：** 源码 import、依赖版本、`web.xml` 命名空间、第三方框架兼容矩阵。
- **处理：** 建立迁移分支，转换命名空间和依赖，重新编译并做集成测试；不要只改 WAR 文件名。

### Session 丢失

- **现象：** 扩容、节点故障或发布后用户频繁掉登录。
- **检查：** Cookie、负载均衡粘性、Session 存储、对象序列化、节点版本和会话大小。
- **处理：** 优先减少服务端 Session；必须保留时明确复制或外部存储的一致性与降级策略。

### 日志或临时目录占满磁盘

- **现象：** 写日志失败、部署失败、JSP 编译失败、应用行为异常。
- **检查：** 文件系统使用、inode、日志轮转、Heap Dump/JFR 大文件、`work/` 与 `temp/`。
- **处理：** 先确认精确目录和进程，再归档或按保留策略清理；不要在运行中递归删除整个 `CATALINA_BASE`。

## 容量与性能

### 先用请求并发估算

Little's Law 的实用近似：

```text
平均并发请求数 ≈ 每秒请求数 × 平均响应时间（秒）
```

例如 300 RPS、平均响应 0.2 秒，平均在途请求约为 60。它不是 `maxThreads=60` 的直接结论，因为还要考虑 p95/p99、突发、慢依赖、后台任务、GC 和安全余量。

### 容量约束链

```text
入口并发
  -> Connector 连接
  -> 请求线程
  -> JVM CPU / Heap / Native Memory
  -> JDBC / Redis / HTTP Client 连接池
  -> 数据库 / 缓存 / 外部服务容量
```

最小的那一层决定端到端容量。`maxThreads=500` 而 JDBC 池只有 30，可能产生 470 个等待线程；把 JDBC 池也改成 500，又可能让数据库先崩。

### 关键性能取舍

| 选择 | 好处 | 风险 |
|---|---|---|
| 增大 `maxThreads` | 可承接更多阻塞请求 | 内存、切换和下游压力上升 |
| 增大 `acceptCount` | 吸收短突发 | 延迟更长，失败更晚 |
| Keep-Alive 更长 | 减少握手开销 | 慢或空闲连接占用更久 |
| 启用压缩 | 降低网络字节 | CPU 开销，已压缩内容收益低 |
| Session 复制 | 节点故障后保留会话 | 网络、序列化和一致性成本 |
| 自动部署 | 修改后快速生效 | 生产易出现半发布和类加载泄漏 |
| 虚拟线程 | 阻塞 I/O 场景可降低平台线程成本 | 不增加 CPU、数据库和外部系统容量 |

Tomcat 11 的 HTTP Connector 可通过 `useVirtualThreads` 使用虚拟线程，默认关闭。启用前要验证应用库的 ThreadLocal、Pinning、监控、性能和故障行为；它不是移除限流、连接池和下游容量约束的开关。

### 压测门禁

压测至少记录：

- 版本、JDK、JVM 参数、容器限制和配置哈希。
- 请求模型、数据规模、并发、RPS 和持续时间。
- p50/p95/p99、错误率和吞吐。
- 忙线程、连接数、JDBC 池、CPU、Heap、GC、网络。
- 下游数据库和缓存负载。
- 过载时是否有界排队、快速失败和恢复。

## 安全

### 最小安全基线

1. 使用仍受支持的 Tomcat/JDK，并订阅安全公告。
2. 用专用低权限账号、容器或虚拟机运行，限制文件、网络和系统能力。
3. 删除不需要的示例、文档、Manager 和 Host Manager 应用。
4. Manager 必须限制到管理网络，角色与用户分离，使用强认证。
5. JMX 远程连接必须限制网络、认证、授权和加密；能本地采集就不要公网暴露。
6. 不需要 AJP 就不启用；需要时限制监听地址、网络和 Secret。
7. TLS 私钥、数据库密码和 Token 不进入 Git、镜像层和普通日志。
8. 限制请求头、参数、请求体和超时，防止资源滥用。
9. Access Log 和错误页避免泄露 Session、凭据、源码路径和详细栈。
10. 记录制品来源、SBOM、依赖漏洞、配置变更和操作审计。

Tomcat 11 已移除 Java SecurityManager 运行支持。应用隔离应更多依赖单应用实例、容器/虚拟机、操作系统权限、网络策略和最小权限，而不是继续寻找旧 SecurityManager 开关。

### Manager 角色边界

`manager-gui`、`manager-script`、`manager-status` 和 `manager-jmx` 用途不同。GUI 用户与自动化用户应分开，自动化只拿需要的接口角色。文本和 JMX 管理接口不能依赖浏览器侧 CSRF 防护来保证安全。

## 升级、回滚与兼容性

### 升级前盘点

- 当前 Tomcat、JDK、操作系统和镜像 Digest。
- 应用是 `javax.*` 还是 `jakarta.*`。
- WAR、全局 `lib/`、Listener、Valve、Realm、JNDI、JDBC Driver。
- `server.xml`、`context.xml`、`web.xml` 与默认值差异。
- TLS、AJP、代理、Session、JMX 和监控 Agent。
- JVM 参数、GC、启动脚本、系统服务和容器资源。
- 数据库 Schema、消息格式和跨版本 Session 兼容性。

### 正确升级路径

1. 阅读目标分支迁移指南、Release Notes、Changelog 和安全公告。
2. 在新目录或新镜像中使用目标版本的默认配置。
3. 逐项重新应用有依据的配置差异，不要整目录覆盖旧 `conf/`。
4. 重新构建应用，执行单元、集成、性能和安全测试。
5. 用影子、金丝雀、滚动或蓝绿方式逐实例切流。
6. 验证业务 SLI、线程、GC、连接池、日志和依赖。
7. 观察一个完整业务周期后再清理旧版本。

从 Tomcat 9 升到 10/11 是应用平台迁移，不是普通补丁升级。`javax.*` 到 `jakarta.*`、JDK 基线、第三方依赖和规范行为都要验证。

### 回滚设计

- 保留旧镜像、旧 JDK、旧 WAR、旧配置和制品哈希。
- 数据库变更使用向前/向后兼容的 Expand-Contract 策略。
- 新旧版本并存时避免写入不兼容 Session。
- 预先定义回滚触发器：错误率、p99、关键业务失败、GC、资源和依赖异常。
- 回滚后继续验证，不把“切回旧版本”当成事故结束。

## 选型取舍

| 场景 | 更适合的方式 | 原因 |
|---|---|---|
| 传统多个 WAR、统一运行时管理 | 外置 Tomcat | 运行时与应用分离，符合既有运维模型 |
| Spring Boot 单服务、容器化交付 | 嵌入式 Tomcat | 应用和运行时一起版本化、扩缩和发布 |
| 需要完整企业 Jakarta EE 能力 | 完整应用服务器或相应平台 | 不应手工拼装 Tomcat 缺失的全部平台能力 |
| 极简异步服务或特定框架 | 评估 Jetty、Undertow、Netty 等 | 按框架生态、性能模型和运维能力选，不按流行度猜 |
| 静态站点、边缘代理和缓存 | NGINX / Apache HTTP Server / CDN | 没必要用 Servlet 容器承担全部边缘职责 |

选型要比较生态兼容、团队经验、升级节奏、可观测性、资源、故障模式和支持边界，而不是只看一次基准测试。

## 事故场景：Java 进程都在，订单接口却大量 504

### 现象

- 网关 504 从 0.1% 升到 18%。
- 三个 Tomcat 实例都显示进程存活。
- CPU 约 40%，Heap 约 55%。
- 10 分钟前刚发布新订单查询功能。

### 证据顺序

1. **用户层：** 确认受影响接口、状态码、区域、租户和开始时间。
2. **入口层：** 查看网关 upstream 地址、连接时间、首字节时间和总耗时。
3. **Tomcat 层：** 对比各实例 Access Log；判断请求是否到达、在哪些实例慢。
4. **线程层：** 查看忙线程是否接近 `maxThreads`，连续抓 3 次 Thread Dump。
5. **依赖层：** 检查 JDBC 池等待、慢 SQL、数据库锁和外部调用。
6. **JVM 层：** 排除长 GC、线程死锁、文件句柄和容器节流。
7. **变更层：** 对齐发布版本、配置哈希和故障开始时间。

### 假设

- 新功能引入慢 SQL，Tomcat 线程等待数据库。
- JDBC 连接泄漏，线程等不到连接。
- 代理超时短于应用正常执行时间。
- 新 WAR 只在部分节点生效，节点状态不一致。

### 验证

Thread Dump 中多数 HTTP 线程停在 JDBC 驱动读取，JDBC 池活跃数达到上限；数据库同时出现新 SQL 全表扫描。没有长 GC，只有新版本节点出现慢请求。

### 修复

1. 暂停继续发布并冻结无关变更。
2. 把新版本节点从流量池摘除，确认旧节点剩余容量。
3. 按预案回滚应用，验证错误率和 p99 恢复。
4. 优化 SQL 和索引，在影子数据与压测环境验证。
5. 小流量重新发布，观察 JDBC、数据库与业务 SLI。

### 爆炸半径与回滚

- 摘节点前先确认旧节点具备 N+1 容量，避免缓解动作制造全站过载。
- 不通过无限增大线程池和连接池“抢救”，否则数据库可能从局部慢变成整体不可用。
- 回滚还要考虑新版本是否写入了旧版本无法读取的数据。

### 复盘

把慢 SQL、发布版本、Thread Dump、连接池曲线、回滚时间线和缺失门禁写入 RCA，并新增：

- SQL 执行计划与数据量回归测试。
- 金丝雀节点的 JDBC 和 p99 自动判定。
- 发布前后 WAR/配置哈希比对。
- 线程池高水位自动取证 Runbook。

## 生产系统设计题

**题目：** 为一个峰值流量明显、需要跨可用区、允许单节点维护但不允许会话大面积丢失的订单 Web 系统设计 Tomcat 平台。

答题主线：

1. **需求：** 明确 RPS、p99、可用性、RTO/RPO、Session、数据一致性、合规和预算。
2. **入口：** DNS/WAF、跨故障域负载均衡、TLS、限流和业务健康检查。
3. **计算：** 至少三个无状态 Tomcat 实例跨故障域，按压测结果保留 N+1。
4. **状态：** 优先无状态 Token；必须保留 Session 时使用受支持的外部存储或明确的复制策略。
5. **依赖：** 数据库、Redis、MQ 各自高可用，并设置连接预算、超时、重试和熔断。
6. **发布：** 不可变镜像、SBOM、签名、金丝雀、自动 SLI 判定和一键回滚。
7. **可观测：** Metrics、Access/App/GC Logs、Trace、JFR 受控取证、变更事件。
8. **安全：** 最小权限、Secret、网络分区、Manager/JMX 管理面隔离、补丁策略。
9. **灾备：** 跨区流量切换、配置与制品备份、数据库恢复演练。
10. **验证：** 节点故障、慢数据库、线程耗尽、错误 WAR、证书和回滚演练。

面试官继续问“为什么不用 Session 复制”时，不要回答“复制不好”。要说明 Session 大小、节点数量、复制带宽、序列化兼容、故障恢复目标和团队运维能力，再给出取舍。

## 面试怎么讲

### 30 秒版本

Tomcat 是运行 Java Web 应用的 Servlet 容器和 Web 服务器。请求从 Coyote Connector 进入，经过 Engine、Host、Context、Wrapper 和 Filter/Servlet，再访问数据库或外部服务。生产排障我不会只看 Java 进程，而会把网关、Access Log、线程池、Thread Dump、JDBC 池、GC 和发布变更串成证据链。

### 3 分钟版本

Tomcat 由 Connector 和 Catalina 容器体系组成。Connector 负责连接、协议、线程和队列；Catalina 用 Engine、Host、Context、Wrapper 把请求路由到具体应用和 Servlet。普通同步请求会占用线程，所以 `maxThreads`、`maxConnections`、`acceptCount` 与 JDBC 池、CPU、Heap、GC 和下游容量必须一起设计。

部署方面，外置 Tomcat 通常通过 WAR 和 Context 管理应用；Spring Boot 常把 Tomcat 嵌入可执行 JAR。多实例时 Tomcat 没有集中配置一致性控制面，应该用不可变镜像和 CI/CD 保证制品与配置一致。Session 优先无状态，必要时再选择粘性、复制或外部存储。

可观测性上，我会采集 Connector 请求与错误、线程池、Session、JVM、GC、进程和 JDBC 指标；用请求 ID 关联代理 Access Log、Tomcat Access Log、应用日志和 Trace。遇到超时，先定位请求停在哪层，再抓连续 Thread Dump 和依赖证据。升级时尤其关注 Tomcat 9 的 `javax.*` 到 10/11 的 `jakarta.*` 迁移，并采用新目录、新默认配置、金丝雀和可验证回滚。

## 面试题与递进追问

### 1. Tomcat 是什么，与 NGINX 有什么区别？

**参考答案：** Tomcat 主要运行 Servlet/JSP 等 Java Web 应用，NGINX 更擅长边缘代理、TLS、静态资源、缓存和流量控制。生产常由 NGINX 接入，再反向代理到多个 Tomcat。

**继续追问：**

- 为什么不让 Tomcat 直接暴露公网？
- TLS 放代理还是 Tomcat？证书和客户端 IP 怎么传？
- 代理 502 与 504 分别如何取证？

### 2. 一次请求在 Tomcat 中怎么走？

**参考答案：** Connector 接收并解析请求，Catalina 按 Engine、Host、Context、Wrapper 路由，经过 Valve、Filter 到 Servlet，再调用业务依赖并返回。

**继续追问：**

- Context Path 如何确定？
- Valve 与 Filter 的范围有什么差异？
- Access Log 有请求但应用日志没有，查什么？

### 3. `maxThreads`、`maxConnections`、`acceptCount` 是什么关系？

**参考答案：** 线程限制同时处理的同步请求；连接可多于线程并等待；达到连接上限后由 OS 队列承接，队列满则拒绝或超时。它们只能控制过载形态，不能创造 CPU 和数据库容量。

**继续追问：**

- 为什么线程越大吞吐反而可能下降？
- 使用 Executor 后哪个参数生效？
- 虚拟线程能否消除 JDBC 池限制？

### 4. Tomcat 进程活着但 404，怎么查？

**参考答案：** 先确认 URL 的 Host 和 Context Path，再看 Context 是否部署成功、`web.xml` 和应用初始化是否报错、Servlet Mapping 是否存在、代理是否重写错路径。

**继续追问：**

- `ROOT.war` 与 `orders.war` 的路径是什么？
- WAR 和同名展开目录同时存在有什么风险？
- 如何把“应用健康”做成负载均衡探针？

### 5. Tomcat 集群如何处理 Session？

**参考答案：** 可用粘性会话、Tomcat 复制或外部 Session 存储。无状态优先；选择时权衡节点故障恢复、Session 大小、复制成本、版本兼容和外部存储可用性。

**继续追问：**

- 为什么节点越多复制成本越高？
- 发布期间新旧类如何影响 Session 反序列化？
- Session Store 故障时业务如何降级？

### 6. Tomcat 9 升级到 11 最容易漏什么？

**参考答案：** 不只是 JDK 版本，还包括 `javax.*` 到 `jakarta.*`、Servlet/JSP 规范行为、第三方框架、驱动、Listener/Valve/Realm、配置默认值、代理、Session 和监控 Agent。

**继续追问：**

- 为什么官方建议用新版本默认配置而不是覆盖旧 `conf/`？
- 数据库 Schema 如何支持应用回滚？
- 什么指标会触发金丝雀回滚？

### 7. 线程池耗尽怎么排查？

**参考答案：** 先确认忙线程和用户延迟，再连续抓 Thread Dump，按相同栈聚类，结合 JDBC 池、数据库、外部调用、锁和 GC 判断阻塞点。缓解时控制流量或回滚，不先把池无限调大。

**继续追问：**

- 为什么要连续抓多次 Dump？
- CPU 不高为什么线程仍会耗尽？
- 如何自动取证但避免告警风暴？

## 学习检查清单

- [ ] 我能说明 Tomcat 11、10.1、9 与 Java、`jakarta.*`、`javax.*` 的边界。
- [ ] 我能区分 JDK、Tomcat、NGINX、Spring Boot 和完整应用服务器。
- [ ] 我能画出 Connector 到 Servlet 和下游依赖的请求路径。
- [ ] 我能解释 Server、Service、Engine、Host、Context、Wrapper。
- [ ] 我能解释线程、连接、队列与 JDBC 池的约束关系。
- [ ] 我能区分 `CATALINA_HOME` 与 `CATALINA_BASE`。
- [ ] 我能读懂核心 `server.xml` 和 Context 配置。
- [ ] 我能跑通基础实验并读到 Access Log。
- [ ] 我能完成错误 `web.xml` 故障注入、修复和清理。
- [ ] 我能用 JMX、Thread Dump、GC 日志和 Trace 建立证据链。
- [ ] 我能设计多实例、Session、容量、安全、升级和回滚方案。
- [ ] 我能完成事故题和生产系统设计题。

## 学习证据

建议把下面内容提交到自己的 GitHub 学习仓库：

```text
tomcat-aiops-lab/
  README.md
  compose.yaml
  compose.fault.yaml
  webapps/ROOT/index.jsp
  webapps/ROOT/WEB-INF/web.xml
  faults/web.xml
  evidence/
    version.txt
    healthy-response.txt
    access-log.txt
    failed-deploy-log.txt
    recovered-response.txt
  notes/
    request-path.md
    thread-connection-queue.md
    tomcat9-to-11-migration.md
    incident-review.md
    production-design.md
```

`README.md` 至少写清：

1. 实验环境、Tomcat/JDK/镜像版本和日期。
2. 请求路径图和容器层级图。
3. 启动、验证、故障注入、修复与清理命令。
4. 预期结果和实际结果。
5. 一次故障的现象、证据、假设、验证、修复、爆炸半径和回滚。
6. 哪些只做了静态学习，哪些在本机真实运行过。

本文边界是“从零到生产运维与面试主线”，没有逐行讲 Tomcat 源码、全部 Connector 属性、所有 Realm/Valve、Native/OpenSSL、JSP 编译器和每一种集群拓扑。深入时继续阅读官方 Architecture、Configuration Reference、Security、Monitoring、Migration Guide 和目标版本 Changelog。

读完本文也不等于自动具备岗位能力。还需要单独训练 Java/JVM、Linux、网络、数据库、Spring、容器、Kubernetes、可观测性、系统设计、编码和真实事故沟通。
