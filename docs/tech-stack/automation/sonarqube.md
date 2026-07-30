# SonarQube 技术栈深讲

> 学习目标：从零理解 SonarQube Community Build 与商业版 SonarQube Server 的边界、扫描与计算链路、Quality Profile、Quality Gate、数据库和搜索索引状态，能搭建本地分析环境、完成一次代码扫描和数据库故障注入，并能设计生产容量、安全、升级、回滚与 AIOps 变更风险闭环。

## 官方资料

- [SonarQube Community Build 文档](https://docs.sonarsource.com/sonarqube-community-build)
- [Community Build 快速体验](https://docs.sonarsource.com/sonarqube-community-build/try-out-sonarqube)
- [Community Build 服务端安装](https://docs.sonarsource.com/sonarqube-community-build/server-installation)
- [Community Build Docker 安装](https://docs.sonarsource.com/sonarqube-community-build/server-installation/from-docker-image/installation-overview)
- [SonarQube Server 文档](https://docs.sonarsource.com/sonarqube-server)
- [SonarQube Server 发布周期](https://docs.sonarsource.com/sonarqube-server/server-update-and-maintenance/update/release-cycle-model)
- [SonarQube Server 2026.1 LTA 发布说明](https://docs.sonarsource.com/sonarqube-server/server-update-and-maintenance/release-notes)
- [Server 主机与 Java 要求](https://docs.sonarsource.com/sonarqube-server/server-installation/server-host-requirements)
- [Scanner 环境通用要求](https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/scanners/scanner-environment/general-requirements)
- [支持的数据库](https://docs.sonarsource.com/sonarqube-server/server-installation/installing-the-database)
- [Data Center Edition 安装要求](https://docs.sonarsource.com/sonarqube-server/server-installation/data-center-edition/installation-requirements)
- [项目分析设置](https://docs.sonarsource.com/sonarqube-community-build/analyzing-source-code/overview)
- [Quality Gate 说明](https://docs.sonarsource.com/sonarqube-community-build/user-guide/quality-standards-administration/managing-quality-gates/introduction)
- [Web API](https://docs.sonarsource.com/sonarqube-community-build/extension-guide/web-api)
- [监控指标](https://docs.sonarsource.com/sonarqube-community-build/server-update-and-maintenance/monitoring)
- [更新与维护](https://docs.sonarsource.com/sonarqube-community-build/server-update-and-maintenance/update)
- [官方 Docker 镜像](https://hub.docker.com/_/sonarqube)

说明：本文基于 SonarSource 官方文档和官方容器镜像重新组织，不复制官方全文。版本、许可、语言支持和平台要求会变化，安装前必须再次核对目标版本的发布说明、系统要求、升级路径和插件兼容矩阵。

截至 2026-07-30，本文用下面两条版本线说明产品边界：

| 产品线 | 本文使用的版本事实 | 适合做什么 |
|---|---|---|
| SonarQube Community Build | 官方镜像存在 `26.7.0.124771-community`，本地实验固定使用该标签 | 免费自建；普通分支只分析主分支，也可分析目标为主分支的 Pull Request |
| SonarQube Server | 当前功能版本为 `2026.4.0`；当前长期活跃补丁版为 `2026.1.4 LTA` | 完整多分支与 Pull Request 分析，以及由 Edition 决定的治理、报告和扩展能力 |

不要把 Community Build、Developer Edition、Enterprise Edition、Data Center Edition 和云端 SonarQube Cloud 混成一个产品。功能、扩展方式、高可用能力和许可边界并不相同。

服务端与 Scanner 的 Java 要求要分开理解。ZIP 安装的 Community Build / SonarQube Server 需要完整的 JDK 21 或 25，这不限制被分析项目自身使用的 Java 版本。Scanner 未启用 JRE 自动供应时需要 Java 21 或更高版本；启用自动供应后，不同 Scanner 对宿主 Java 的最低要求不同，安装前应按目标 Scanner 版本核对官方表格，而不是把“Server 要 JDK 21/25”机械套到所有 CI。

生产外部数据库也有明确支持边界。截至本文日期，官方列出的范围包括 PostgreSQL 14–18、SQL Server 2017/2019/2022，以及 Oracle 19c、21c、23ai 和 XE；内置 H2 只适合测试与试用，不能作为生产数据库。版本范围会继续变化，落地时仍以目标 SonarQube 版本文档为准。

## 官方知识地图

官方资料大致可以拆成：

```text
产品与版本
  -> Community Build / Server Editions / Cloud
  -> 发布周期 / LTA / 升级路径 / 许可

代码分析
  -> Scanner / CI 集成 / 分析参数 / 报告上传
  -> Rules / Issues / Security Hotspots / Measures
  -> Quality Profile / Quality Gate / New Code

服务端
  -> Web Server / Compute Engine / Search
  -> 外部数据库 / 日志 / 插件 / Web API
  -> 备份 / 监控 / 安全 / 更新 / 恢复
```

本文按下面的顺序学习：

1. 先区分产品线和“扫描器”与“服务器”。
2. 再走一遍从 CI 扫描到 Quality Gate 的完整路径。
3. 再理解数据库、搜索索引和后台任务的状态关系。
4. 然后用 Docker Compose 跑通服务器与一次真实扫描。
5. 再主动停止数据库，按证据链恢复。
6. 最后进入生产高可用、容量、安全、升级和面试设计。

## 场景开场

团队刚上线一个订单服务。单元测试是绿的，应用也能编译，但两周后线上出现空指针、重复代码和一个硬编码密钥。

经理问：“CI 不是成功了吗，为什么这些问题没挡住？”

因为“能编译”只证明代码能被构建，“测试通过”只证明现有测试没有失败。你还需要一套规则，把可靠性、可维护性、安全问题、覆盖率和重复率转成可追踪的 Issue，并在合并或发布前用统一门禁做判断。

## 一句话人话版

SonarQube 就像代码进入生产前的自动质检中心：Scanner 读取源码和测试报告，服务器计算问题与指标，再用 Quality Gate 决定这次变更是否达到团队标准。

## 小白可能会问

- SonarQube 会执行我的所有单元测试吗？
- Scanner、Server 和 IDE 插件是不是一回事？
- Quality Profile 与 Quality Gate 有什么区别？
- 为什么 SonarQube 需要数据库，又内置一个 Elasticsearch？
- CI 显示 Quality Gate 通过，是否等于代码绝对安全？
- Community Build 能不能直接做生产级多节点高可用？

## 为什么要学

对 DevOps 来说，SonarQube 是 CI/CD 质量门禁的一环；对 SRE 来说，它能把变更质量信号和故障、回滚、发布失败关联；对 AIOps 来说，它能提供结构化的代码风险、复杂度、重复率、覆盖率和质量门状态。

典型链路是：

```text
Git 提交
  -> CI 构建与测试
  -> SonarScanner 分析
  -> SonarQube 后台计算
  -> Quality Gate
  -> 允许合并 / 阻断发布
  -> 变更事件进入可观测平台
  -> 事故后关联代码风险与部署版本
```

它不能代替代码评审、单元测试、SAST 之外的安全测试、依赖治理、运行时防护和人工威胁建模。它提供的是证据和门禁，不是“零缺陷证明”。

## 是什么

SonarQube 是一个自托管的自动代码审查和静态分析平台。

“静态分析”表示主要在不运行目标业务程序的情况下读取源码、字节码、配置和外部报告，按规则发现潜在问题。“Measure”是度量值，例如代码行、复杂度、覆盖率。“Issue”是规则命中的待处理问题。

### 产品边界

| 产品 | 人话解释 | 需要注意 |
|---|---|---|
| SonarQube for IDE | 写代码时在编辑器里给即时反馈 | 不是中心服务器，也不能代替 CI 门禁 |
| SonarQube Community Build | 免费、自建的社区构建 | 功能和支持边界以当前官方文档为准 |
| SonarQube Server Editions | Developer、Enterprise、Data Center 等商业版本 | Edition 决定分支、报告、治理和 HA 能力 |
| SonarQube Cloud | SonarSource 托管的 SaaS | 不需要自己维护服务器和数据库 |
| SonarScanner | 运行在开发机或 CI Runner 上的分析客户端 | 它产生并上传分析结果，不保存平台最终状态 |

## 它解决什么问题

- 让团队用同一套规则检查可靠性、可维护性和安全问题。
- 把代码质量从口头意见变成 Issue、Measure、历史趋势和责任闭环。
- 用 Quality Gate 把“是否允许进入下一阶段”变成可自动判断的条件。
- 让 CI、代码平台和质量平台共享项目、分支、提交和状态。
- 给审计、复盘和变更风险分析留下可查询证据。

## 核心原理

### 一次分析的数据路径

```text
源码 / 字节码 / 覆盖率报告
  -> SonarScanner 加载规则与分析参数
  -> 本地传感器分析
  -> 生成分析报告
  -> 上传到 SonarQube Web Server
  -> 进入 Compute Engine 后台任务队列
  -> 计算 Issues / Measures / Quality Gate
  -> 写入外部数据库
  -> 更新内置搜索索引
  -> UI / Web API / Webhook / CI 获取结果
```

Scanner 与 Server 之间要通过项目 Key、Server URL 和 Token 建立身份。CI 里的扫描成功只表示报告被生成或上传，不一定表示后台计算和 Quality Gate 已经完成。需要等待 Quality Gate 的流水线必须显式启用等待或查询任务状态。

### 状态与一致性

SonarQube 的业务主状态在外部关系型数据库中，包括项目、配置、用户、Issue、Measure 和后台任务结果。内置 Elasticsearch 主要服务搜索和查询，是可以由数据库重建的派生索引。

因此：

- 备份的重点是数据库，不是只复制 Elasticsearch 目录。
- 搜索页面异常不一定代表业务数据丢失，可能是索引落后或只读。
- 更新或恢复数据库后通常需要重建搜索索引。
- 插件、配置、Secret、代理和证书仍要单独纳入配置备份。

### Quality Profile 与 Quality Gate

```text
Quality Profile
  -> “用哪些规则检查代码”

Quality Gate
  -> “检查结果达到什么条件才算通过”
```

Profile 决定规则集合和规则参数；Gate 决定门槛。比如 Java Profile 启用“不要硬编码凭据”规则，Gate 再要求新代码上没有新的高风险问题、覆盖率不低于目标值。

### New Code 策略

只盯“全部历史代码”会让老系统第一次接入时出现几万条问题，团队很容易放弃。New Code 策略先约束新增和修改的代码，使债务不再继续增长，再按风险分批治理旧代码。

这不是掩盖历史债务。正确做法是把“新代码门禁”和“存量治理计划”分开管理。

## 关键术语拆解

| 术语 | 人话解释 | 坏了通常看哪里 |
|---|---|---|
| Project Key | 项目的稳定唯一标识 | Scanner 参数与服务器项目是否一致 |
| Rule | 一条代码检查规则 | 语言插件、Profile 是否启用 |
| Quality Profile | 某种语言使用的规则集合 | 项目绑定的 Profile 和继承关系 |
| Issue | 规则检测到的问题实例 | Rule、文件、行号、状态与责任人 |
| Security Hotspot | 需要人工审查上下文的敏感代码 | 不应直接等同于已确认漏洞 |
| Measure | 覆盖率、重复率、复杂度等数值 | 外部报告路径和分析日志 |
| Quality Gate | 一组通过/失败条件 | New Code 定义、条件和值 |
| Compute Engine | 异步处理分析报告的后台计算进程 | `ce.log`、后台任务队列 |
| Search Index | 为快速检索构建的派生索引 | `es.log`、磁盘水位、重建进度 |
| Token | Scanner 或 API 的凭据 | 权限、过期时间、Secret 注入 |

## 核心知识树

### Scanner

是什么：运行在构建环境中的分析客户端。

为什么需要：服务器不会主动登录每台构建机读取源码，Scanner 要在源码、依赖和测试报告旁边收集上下文。

怎么工作：读取 `sonar-project.properties` 或 Maven、Gradle、.NET 等构建参数，加载分析器，生成报告并上传。

怎么看：扫描日志中要能看到项目 Key、Server 版本、分析文件数、报告上传和任务 URL。

坏了怎么查：先查 Token、Server URL、代理、证书、源码挂载、编译产物与覆盖率报告路径。

### Web Server

是什么：提供 UI、认证、项目配置和 Web API 的服务进程。

为什么需要：它是用户、CI 和管理系统进入 SonarQube 的入口。

怎么工作：接收请求和分析报告，与数据库交互，把后台计算任务交给 Compute Engine。

怎么看：访问 `/api/system/status`，再看 `web.log` 和 HTTP 入口指标。

坏了怎么查：检查端口、反向代理、数据库连接、JVM、认证配置和 `web.log`。

### Compute Engine

是什么：处理扫描报告的异步后台计算进程，常缩写为 CE。

为什么需要：大型项目计算 Issue、Measure 和索引更新可能耗时，不适合阻塞报告上传请求。

怎么工作：从任务队列取报告，计算结果，提交数据库并更新索引。

怎么看：Administration 中的 Background Tasks、`ce.log`、队列长度和最长等待时间。

坏了怎么查：先看失败任务详情，再查 CE Heap、数据库延迟、插件异常和磁盘。

### Database

是什么：SonarQube 业务状态的持久化中心。

为什么需要：项目、权限、规则配置、Issue 历史和分析结果必须可靠保存。

怎么工作：Web 与 CE 通过 JDBC 访问数据库；事务保证单次状态修改的原子性。

怎么看：数据库连接数、延迟、锁、磁盘、备份和 SonarQube JDBC 日志。

坏了怎么查：先确认 DNS、端口、凭据和 TLS，再看连接池、慢 SQL、锁和数据库可用性。

### Search

是什么：SonarQube 内置的 Elasticsearch 搜索进程。

为什么需要：跨项目、Issue 和组件的检索不适合全部直接压在关系数据库上。

怎么工作：CE 把业务结果写入数据库后同步更新搜索索引；索引可以从数据库重建。

怎么看：`es.log`、索引状态、重建进度、磁盘水位和 Heap。

坏了怎么查：磁盘达到 Elasticsearch 水位时索引可能只读；释放空间后还要按官方步骤重启或重建。

## 架构和数据流

### 学习环境

```text
浏览器 / Scanner
  -> SonarQube Community Build 容器 :9000
      -> Web
      -> Compute Engine
      -> Search
  -> PostgreSQL 容器 :5432
```

### 常规生产环境

```text
开发者 / CI Runner
  -> HTTPS 反向代理 / 负载入口
  -> SonarQube 应用实例
      -> 外部受管数据库
      -> 内置搜索
      -> 日志 / 指标 / Webhook
```

Community Build 和普通 Server Edition 不能因为放了两个容器就自动变成安全的多活集群。需要应用级高可用时，要核对 Data Center Edition 的支持架构、许可、节点角色和共享状态要求。

### 故障域

- CI Runner 故障：扫描没开始或报告没上传。
- 网络或代理故障：Scanner 无法访问 Server，Webhook 也可能失败。
- Web 故障：UI 和 API 不可用，新的报告无法进入。
- CE 饱和：上传成功，但门禁长时间没有结果。
- 数据库故障：核心业务状态无法读写。
- Search 故障：检索和部分页面异常，索引可能需要重建。
- 磁盘故障：日志、临时文件或索引把节点拖入只读或启动失败。

## 安装与启动

### 最小快速体验

官方快速体验允许在本地关闭 Elasticsearch bootstrap checks：

```powershell
docker run -d --name sonarqube `
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true `
  -p 127.0.0.1:9000:9000 `
  sonarqube:26.7.0.124771-community
```

访问 `http://localhost:9000`，初始管理员是 `admin/admin`，首次登录必须修改密码。

`SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true` 只适合一次性本地实验。生产环境要满足 Linux、文件句柄、内存映射和 `/tmp` 等官方要求，而不是关闭检查。

### Docker Compose 学习环境

```yaml
name: sonarqube-lab

services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: sonarqube
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar_lab_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sonar -d sonarqube"]
      interval: 10s
      timeout: 5s
      retries: 10
    volumes:
      - postgresql_data:/var/lib/postgresql/data

  sonarqube:
    image: sonarqube:26.7.0.124771-community
    depends_on:
      db:
        condition: service_healthy
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://db:5432/sonarqube
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar_lab_password
      SONAR_ES_BOOTSTRAP_CHECKS_DISABLE: "true" # 仅限本机实验
    ports:
      - "127.0.0.1:9000:9000"
    volumes:
      - sonarqube_data:/opt/sonarqube/data
      - sonarqube_extensions:/opt/sonarqube/extensions
      - sonarqube_logs:/opt/sonarqube/logs

volumes:
  postgresql_data:
  sonarqube_data:
  sonarqube_extensions:
  sonarqube_logs:
```

启动并观察：

```powershell
docker compose -p sonarqube-lab up -d
docker compose -p sonarqube-lab ps
docker compose -p sonarqube-lab logs -f sonarqube
```

正常时日志最终会显示 SonarQube 可运行，`http://localhost:9000/api/system/status` 返回状态信息。首次启动需要初始化数据库和索引，不能用“容器刚进入 running”代替应用就绪。

## 配置详解

SonarQube ZIP 安装主要读取 `<sonarqubeHome>/conf/sonar.properties`。容器环境通常把系统属性改写成大写环境变量，例如：

```properties
sonar.jdbc.url=jdbc:postgresql://db.example:5432/sonarqube
sonar.jdbc.username=sonar
sonar.jdbc.password=${SONAR_DB_PASSWORD}
sonar.web.context=/sonarqube
sonar.web.systemPasscode=${MONITORING_PASSCODE}
```

容器中对应：

```yaml
environment:
  SONAR_JDBC_URL: jdbc:postgresql://db.example:5432/sonarqube
  SONAR_JDBC_USERNAME: sonar
  SONAR_JDBC_PASSWORD: ${SONAR_DB_PASSWORD}
  SONAR_WEB_CONTEXT: /sonarqube
  SONAR_WEB_SYSTEMPASSCODE: ${MONITORING_PASSCODE}
```

| 配置 | 作用 | 新手容易错在哪里 |
|---|---|---|
| `sonar.jdbc.url` | 外部数据库 JDBC 地址 | 容器里不能把宿主机数据库写成 `localhost` |
| `sonar.jdbc.username` | 数据库用户 | 不应使用数据库超级用户 |
| `sonar.jdbc.password` | 数据库密码 | 不要提交到 Git，应用 Secret 注入 |
| `sonar.web.host` | Web 监听地址 | 监听地址不等于用户访问域名 |
| `sonar.web.port` | Web 端口 | 还要核对代理和容器端口映射 |
| `sonar.web.context` | URL 子路径 | 代理转发和回调 URL 必须一致 |
| `sonar.web.systemPasscode` | 监控 API Passcode | 与用户 Token 不是一回事 |
| `sonar.path.logs` | 日志目录 | 容器重建时要保留或外送日志 |

生产环境不要直接复制旧版本完整 `sonar.properties` 覆盖新版本默认文件。官方升级流程要求基于新目录和新默认配置迁移仍然有效的自定义项。

## 常用命令与 API

```powershell
docker compose -p sonarqube-lab ps
docker compose -p sonarqube-lab logs --tail 200 sonarqube
docker compose -p sonarqube-lab exec db pg_isready -U sonar -d sonarqube

curl.exe -s http://localhost:9000/api/system/status
curl.exe -s http://localhost:9000/api/system/health
curl.exe -s http://localhost:9000/api/ce/activity
```

未授权接口可能返回 401 或权限错误，这反而证明认证边界在工作。生产监控使用专用 Token 或 `X-Sonar-Passcode`，不要把管理员密码写进采集配置。

| 名称 | 作用 | 常用写法 | 正常结果 | 异常先查 |
|---|---|---|---|---|
| `/api/system/status` | 看系统启动状态 | `curl .../api/system/status` | `UP` 或迁移相关状态 | Web 日志、数据库、启动阶段 |
| `/api/ce/activity` | 看后台任务 | Bearer Token 调用 | 能看到成功/失败任务 | CE 队列、权限、`ce.log` |
| `/api/measures/component` | 取项目指标 | 指定 `component` 和 `metricKeys` | 返回项目 Measure | 项目 Key、Token、指标名 |
| `/api/monitoring/metrics` | 暴露实例监控指标 | `X-Sonar-Passcode` | OpenMetrics 文本 | Passcode、代理、版本/Edition |
| `sonar-scanner` | 扫描项目 | `-Dsonar.projectKey=...` | 报告上传并给出任务 URL | Token、URL、源码、构建产物 |
| `docker compose logs` | 取容器日志 | `logs --tail 200 sonarqube` | 看见 Web/CE/ES 启动信息 | 容器状态、卷、磁盘 |

## 日志与可观测性

| 日志 | 主要内容 | 常见用途 |
|---|---|---|
| `app.log` | 主进程编排和启动/停止 | 判断哪个内部进程未启动 |
| `web.log` | Web、认证、HTTP 和数据库访问 | 排查 UI/API、JDBC 和代理问题 |
| `ce.log` | 后台计算任务 | 排查扫描上传后长期无结果 |
| `es.log` | 搜索进程和索引 | 排查磁盘水位、Heap、索引只读 |
| `access.log` | HTTP 访问 | 关联调用方、路径、状态码和耗时 |

至少监控：

- Web 可用性、HTTP 错误率和延迟。
- Compute Engine 队列长度、最长等待时间、失败任务。
- 数据库连接池、连接延迟和错误。
- Web/CE/Search JVM Heap、GC、CPU。
- Search 磁盘使用率、只读和重建进度。
- 分析数量、分析耗时、Quality Gate 失败率。
- Token 过期、Webhook 失败和插件加载错误。

## 在 AIOps 中的作用

### 变更风险信号

把 `projectKey`、Commit SHA、分支、Quality Gate、严重 Issue 数和覆盖率变化写入变更事件：

```json
{
  "service": "order-api",
  "commit": "abc1234",
  "quality_gate": "ERROR",
  "new_reliability_issues": 2,
  "new_security_issues": 1,
  "coverage_delta": -7.4
}
```

发布后若错误率升高，AIOps 平台可以把故障时间线与这次变更的质量信号关联，但不能只凭相关性自动断言 SonarQube Issue 就是根因。

### 告警与自动化

- CE 队列持续增长：先限流扫描、扩资源或错峰，不直接删除任务。
- Quality Gate 失败：阻断发布并把链接、责任人和规则摘要发送到协作平台。
- Token 即将过期：提前创建轮换工单。
- Search 磁盘高水位：先保护磁盘和业务，再按官方流程解除只读或重建。

自动化可以收集证据和执行低风险动作；数据库恢复、索引删除、升级和权限批量修改要经过审批。

## 基础实验：分析一个故意写坏的 JavaScript 项目

### 实验目标

启动 SonarQube 与 PostgreSQL，创建项目 Token，扫描一段包含重复逻辑和可维护性问题的 JavaScript，最后在 UI 中看到分析结果和 Quality Gate。

### 前提

- Docker Desktop Linux Engine 正常。
- 9000 端口未占用。
- 至少预留数 GB 磁盘和足够内存。
- 实验只在本机进行，不绑定公网。

### 第一步：准备目录

```powershell
New-Item -ItemType Directory -Force sonarqube-lab, sonarqube-lab\src | Out-Null
Set-Location sonarqube-lab
```

把前文 Compose 保存为 `compose.yaml`。

创建 `sonar-project.properties`：

```properties
sonar.projectKey=sonarqube-lab
sonar.projectName=SonarQube AIOps Lab
sonar.sources=src
sonar.sourceEncoding=UTF-8
```

创建 `src/app.js`：

```javascript
function severity(score) {
  if (score > 90) {
    return "critical";
  }
  if (score > 70) {
    return "high";
  }
  return "normal";
}

function duplicatedSeverity(score) {
  if (score > 90) {
    return "critical";
  }
  if (score > 70) {
    return "high";
  }
  return "normal";
}

console.log(severity(95), duplicatedSeverity(80));
```

### 第二步：启动并确认就绪

```powershell
docker compose -p sonarqube-lab up -d
docker compose -p sonarqube-lab ps
curl.exe -s http://localhost:9000/api/system/status
```

预期最终看到系统状态 `UP`。如果仍是 `STARTING`，继续观察日志，不要重复创建容器。

### 第三步：创建项目和 Token

1. 打开 `http://localhost:9000`。
2. 用 `admin/admin` 登录并修改密码。
3. 创建 Local Project，Project Key 填 `sonarqube-lab`。
4. 生成只用于本实验的分析 Token。
5. 在当前 PowerShell 会话设置：

```powershell
$env:SONAR_TOKEN = '粘贴刚生成的实验 Token'
```

不要把 Token 写进 `compose.yaml`、脚本或 Git。

### 第四步：运行官方 Scanner 容器

```powershell
docker run --rm `
  --network sonarqube-lab_default `
  -e SONAR_HOST_URL=http://sonarqube:9000 `
  -e SONAR_TOKEN=$env:SONAR_TOKEN `
  -v "${PWD}:/usr/src" `
  sonarsource/sonar-scanner-cli:latest
```

预期日志包含报告上传成功和后台任务 URL。`latest` 便于学习，生产流水线应固定 Scanner 版本或镜像 Digest。

### 第五步：验证

- 在项目 Overview 中看到本次分析时间。
- 在 Issues、Measures、Duplications 中能看到对应结果。
- Administration -> Background Tasks 中任务为 Success。
- 记录 Quality Gate 状态，而不是预先假定一定失败；默认规则和版本可能变化。

### 如果没有成功

按顺序检查：

1. `docker compose ps` 中 DB 是否 healthy、SonarQube 是否 running。
2. `/api/system/status` 是否真正为 `UP`。
3. Scanner 容器是否加入 `sonarqube-lab_default` 网络。
4. Token 是否有 Execute Analysis 权限。
5. Project Key 是否和属性文件一致。
6. Windows 挂载路径是否把源码映射到 `/usr/src`。
7. Scanner 日志给出的 CE 任务是否在后台失败。

### 清理

```powershell
Remove-Item Env:SONAR_TOKEN -ErrorAction SilentlyContinue
docker compose -p sonarqube-lab down
```

保留学习数据时不要加 `-v`。确认不再需要实验数据后才执行：

```powershell
docker compose -p sonarqube-lab down -v
```

## 故障注入实验：数据库停止后扫描报告无法完成

### 实验目标

主动停止 PostgreSQL，观察 Web/CE 的现象、日志和恢复过程，练习“现象 -> 证据 -> 假设 -> 验证 -> 修复 -> 清理”。

### 实验边界

只允许在前文新建的 `sonarqube-lab` 中执行。生产数据库绝不能用本实验命令停机。

### 第一步：建立健康基线

```powershell
curl.exe -s http://localhost:9000/api/system/status
docker compose -p sonarqube-lab ps
docker compose -p sonarqube-lab logs --tail 50 sonarqube
```

保存一张健康项目页截图和一份健康日志。

### 第二步：停止数据库

```powershell
docker compose -p sonarqube-lab stop db
```

刷新项目页或重新触发一次扫描。预期可能出现 API 错误、后台任务失败或连接异常；实际表现取决于连接池和请求时机。

### 第三步：收集证据

```powershell
docker compose -p sonarqube-lab ps
docker compose -p sonarqube-lab logs --since 5m sonarqube
docker compose -p sonarqube-lab logs --since 5m db
```

证据要回答：

- 数据库容器何时停止？
- Web 还能否响应？哪些接口失败？
- `web.log` 或 `ce.log` 是否出现 JDBC 连接错误？
- CE 任务是等待、失败，还是尚未创建？

### 第四步：形成并验证假设

假设：“扫描器网络正常，但 SonarQube 无法把任务结果写入数据库，所以门禁无法完成。”

不要用“页面打不开”直接证明数据库是根因。要同时看到数据库状态、SonarQube JDBC 错误和故障时间线吻合。

### 第五步：恢复

```powershell
docker compose -p sonarqube-lab start db
docker compose -p sonarqube-lab exec db pg_isready -U sonar -d sonarqube
docker compose -p sonarqube-lab restart sonarqube
curl.exe -s http://localhost:9000/api/system/status
```

系统恢复 `UP` 后重新扫描，确认后台任务成功和 UI 数据可查询。

### 清理与复盘

记录：

- 首个用户影响时间。
- 第一条 JDBC 错误。
- 恢复数据库与恢复服务的时间。
- 是否需要重跑失败分析。
- 生产环境应增加的数据库可用性、CE 队列和 Synthetic Check 告警。

## 常见故障排查

### 容器 running，但页面一直打不开

先看 `/api/system/status` 和 `docker logs`。常见原因包括初始化尚未结束、数据库不可达、端口冲突、内存不足、Linux 参数不满足和不能以 root 运行 Elasticsearch。

### Scanner 报 401 / 403

检查 Token 是否过期、是否传到正确环境变量、是否有 Execute Analysis 权限，以及项目是否允许当前用户分析。不要把管理员密码改写成 Token。

### Scanner 成功，Quality Gate 一直没有结果

查看 CE 任务 URL、Background Tasks、`ce.log` 和队列长度。报告上传与后台计算是两个阶段。

### 覆盖率一直是 0

SonarQube 通常读取测试工具生成的覆盖率报告，而不是替你执行所有测试。检查 CI 是否先跑测试、报告格式是否正确、路径是否相对扫描工作目录。

### 搜索页面异常或索引只读

检查 `es.log`、磁盘使用率和水位。官方文档说明磁盘达到高水位时索引可能只读；仅释放空间可能不够，还要重启或重建索引。

### 数据库恢复了，页面数据仍不完整

数据库是主状态，Search 是派生状态。确认索引重建进度，必要时按官方 reindex 流程操作，不要在运行中的生产实例随意删除目录。

### CE 队列持续增长

比较分析到达速率和 CE 完成速率，再看任务大小、数据库延迟、CE CPU/Heap、插件和并发。盲目增加 Scanner 并发只会继续放大队列。

### 插件升级后启动失败

停用不兼容插件，使用目标版本的插件兼容矩阵重新安装。官方不建议把旧目录中的插件无差别复制到新版本。

## 容量与性能

容量估算至少回答：

- 总代码行数和活跃项目数是多少？
- 每小时有多少次分析，峰值是否集中在上班或合并窗口？
- 单次报告多大、CE 平均和 p95 处理时间是多少？
- CE 到达率是否长期高于完成率？
- 数据库容量、IOPS、延迟和连接数如何增长？
- Search 索引、日志、临时目录和备份需要多少磁盘？
- 重建索引和数据库恢复的 RTO 能否接受？

一个简单队列判断：

```text
积压增长速度 = 分析到达速率 - CE 完成速率
清空时间 ≈ 当前积压任务数 / 可用净处理速率
```

质量平台在合并高峰变慢时，先区分“Scanner 慢”“报告上传慢”“CE 排队”“数据库慢”“Search 慢”，不要把所有问题都叫 SonarQube 慢。

## 安全

- 入口使用 HTTPS，SonarQube 放在受控反向代理之后。
- 初始管理员密码首次登录立即修改。
- CI 使用项目级或最小权限 Token，不使用共享管理员 Token。
- Token 放入 CI Secret，并监控过期时间和轮换。
- 数据库使用专用账号、网络隔离和 TLS，不授予超级权限。
- 管理 API、监控 Passcode 和普通用户 API 分权。
- 只安装可信且兼容的插件，记录来源、版本和校验。
- 限制匿名访问、项目可见性和全局权限。
- 日志避免输出 Token、密码和源码敏感信息。
- 备份、数据库 Dump 和诊断包也按敏感资产保护。

Quality Gate 不能替代 Secret 扫描、依赖漏洞管理、DAST、容器镜像扫描和运行时检测。生产安全要建立多层门禁。

## 高可用与灾备

### Community Build / 单实例 Server

常见设计是单应用实例加高可用外部数据库、可恢复配置和可重建 Search。它仍然有应用层单点，适合把恢复自动化和 RTO 说清楚，而不是伪装成多活。

### Data Center Edition

只有 Data Center Edition 支持官方应用集群。官方最小拓扑是 2 个应用节点和 3 个搜索节点；一套实例或一个 DCE 集群必须独占一个数据库 Schema，不能让两个独立实例或集群同时连接同一个 Schema，否则可能破坏数据。

不要自行复制 Community Build 容器并共享卷。应用节点、搜索节点、数据库、负载入口和故障域都要按官方支持架构设计，并实际验证节点丢失、搜索重建和客户端重试。

### 备份边界

优先备份：

- 外部数据库。
- `sonar.properties` 中的非 Secret 配置模板。
- Secret、证书、代理、身份源配置。
- 插件清单与版本。
- 部署清单、镜像 Digest 和变更记录。

Search 索引可从数据库重建。仍要估算重建时间，因为“可重建”不等于“立刻恢复”。

## 升级与回滚

升级前：

1. 阅读当前到目标版本之间的发布说明和升级路径。
2. 核对 JDK、数据库、操作系统、Kubernetes、浏览器、Scanner 和插件要求。
3. 做数据库备份并实际验证恢复。
4. 官方提醒迁移期间数据库空间可能临时接近正常用量的两倍，因此先确认余量。
5. 用近期生产数据库副本在隔离环境演练迁移和索引重建。
6. 记录当前镜像 Digest、配置、插件、任务队列和健康基线。

执行时使用新安装目录或新镜像，不覆盖旧目录。完成数据库迁移后，二进制回退未必安全；回滚必须与数据库恢复点配套。

Data Center Edition 更新也不是“逐节点无停机滚动升级”。官方流程要求先备份数据库并停止集群，把全部应用节点和搜索节点更新到同一版本，再启动集群，并由一个应用节点访问 `/setup` 完成数据库迁移。把混合版本节点长期留在集群里不是安全的升级策略。

```text
应用镜像回滚
  + 数据库是否已迁移
  + 插件是否兼容
  + Search 是否需要重建
  + Scanner / API 是否兼容
```

不能只把容器标签改回旧版就宣称完成回滚。

## 选型取舍

| 场景 | 更合适的选择 | 原因 |
|---|---|---|
| 自建、统一多语言质量门禁 | SonarQube | 集中规则、指标、历史和 CI 集成 |
| GitHub 仓库内快速安全扫描 | CodeQL / GitHub Advanced Security 等 | 与代码平台深度集成，能力边界不同 |
| 只做依赖组件漏洞 | SCA 工具 | SonarQube 不是所有供应链风险的唯一来源 |
| 开发者本地即时反馈 | SonarQube for IDE / IDE Linter | 反馈更快，但仍要中央门禁 |
| 不想维护服务器 | SonarQube Cloud | 省去自建运维，需评估合规和成本 |

选型比较语言覆盖、规则质量、误报治理、CI 延迟、平台运维、权限、报告、合规、许可和总成本，不用“Issue 数量多”判断工具更强。

## 事故场景：所有流水线都卡在 Waiting for Quality Gate

### 现象

- Scanner 日志显示报告上传成功。
- 30 多条流水线一直等待 Quality Gate。
- SonarQube 首页还能打开。
- 两小时前批量触发了全量项目扫描。

### 证据顺序

1. 从 CI 保存 CE Task URL 和 Commit SHA。
2. 查看 Background Tasks 的队列长度、最老任务和失败率。
3. 看 `ce.log` 中单任务阶段耗时和异常。
4. 检查 CE CPU/Heap、GC、数据库延迟和连接池。
5. 检查是否有超大项目、插件异常或批量调度变更。
6. 比较到达率和完成率，估算清空时间。

### 假设与验证

- 假设一：批量扫描到达率超过 CE 处理能力。
- 假设二：数据库慢导致每个任务处理时间拉长。
- 假设三：某个插件让特定语言任务反复失败。

若 CE CPU 正常但数据库写延迟和锁等待升高，每个任务都停在持久化阶段，就不能只靠增加 CE 资源解决。

### 处置

- 暂停非紧急全量扫描，保留关键合并请求。
- 给 CI 设置有界超时和失败策略，避免无限占用 Runner。
- 修复数据库瓶颈或回滚导致任务变慢的插件/配置。
- 恢复后按业务优先级重跑失败任务。

### 爆炸半径与回滚

不要直接清空 CE 队列；其中可能包含发布门禁证据。暂停扫描前评估哪些流水线会被阻断，插件回滚前核对兼容性，数据库变更必须有恢复点。

### 复盘

增加 CE 队列 SLO、批量扫描限速、项目分级、数据库延迟告警和变更关联。

## 生产系统设计题

题目：为 300 个仓库、每天 2000 次 CI 分析、要求质量门禁 10 分钟内返回的团队设计 SonarQube 平台。

回答主线：

1. 明确语言、代码量、峰值分析数、门禁 SLO、保留期、合规和 Edition。
2. CI Runner 与 Scanner 版本化，Token 按项目或团队最小授权。
3. 入口使用 HTTPS、SSO、网络控制和审计。
4. 根据支持边界选择单实例恢复型方案或 Data Center Edition。
5. 外部数据库高可用，低延迟连接，定期备份和恢复演练。
6. 监控 Web、CE、Search、数据库和 CI 等待时间。
7. 批量任务错峰，给关键项目更严格的流水线超时与升级路径。
8. Quality Profile、Gate 和例外都有 Owner、审批和版本记录。
9. 升级在生产数据副本上演练，镜像、插件和 Scanner 一起做兼容矩阵。
10. 故障时允许按风险采用“阻断”“人工审批”或“有限降级”，不能静默放行。

## 面试怎么讲

### 30 秒版本

SonarQube 是自建的自动代码审查和静态分析平台。Scanner 在 CI 中读取源码、字节码和测试报告，把分析报告上传给服务器；Compute Engine 异步计算 Issue、Measure 和 Quality Gate，业务状态保存在外部数据库，Elasticsearch 主要是可重建搜索索引。生产上我会重点监控 CE 队列、数据库、Search 磁盘和门禁等待时间。

### 3 分钟版本

我会先区分 Community Build、商业 Server Edition、Data Center Edition 和 Cloud，不能假设免费单节点通过复制容器就有多活。分析链路从 Scanner 开始，报告上传后进入 CE 队列，所以“扫描上传成功”和“Quality Gate 完成”是两个状态。Profile 决定规则，Gate 决定通过标准，New Code 策略用来先守住新增代码。

状态上数据库是项目、Issue、Measure 和配置的主来源，Search 是派生索引。备份重点是数据库，恢复后要考虑索引重建时间。排障时我会按 Scanner、Web、CE、数据库、Search 分层取证。升级前核对 JDK、数据库、插件和 Scanner 兼容，使用生产数据副本演练迁移，回滚要同时考虑数据库迁移而不是只改镜像标签。

## 面试题与递进追问

### 1. SonarQube 与 SonarScanner 有什么区别？

参考答案：Scanner 在源码旁执行分析并上传报告；SonarQube Server 保存配置和历史、异步计算结果、提供 UI/API 和 Quality Gate。

继续追问：

- Scanner 成功为什么 Gate 还可能失败或超时？
- Scanner 应该运行在开发机还是 CI？
- 编译产物和覆盖率报告为什么会影响分析？

### 2. Quality Profile 与 Quality Gate 有什么区别？

参考答案：Profile 是检查规则集合，Gate 是结果通过条件。前者回答“查什么”，后者回答“达到什么标准”。

继续追问：

- New Code 如何定义？
- 为什么不能所有项目共用完全相同门槛？
- 例外如何审批和过期？

### 3. SonarQube 为什么同时需要数据库和 Elasticsearch？

参考答案：数据库保存业务主状态，Elasticsearch 提供搜索索引。索引可以从数据库重建，所以备份和恢复策略不同。

继续追问：

- Search 目录丢失会怎样？
- 为什么磁盘满会影响 CE 和 Web？
- 重建期间哪些页面可能不可用？

### 4. CE 队列积压怎么排查？

参考答案：先确认到达率、完成率、最老任务和影响，再看任务阶段、CE 资源、GC、数据库延迟、插件和超大项目，最后决定限流、修复依赖或扩容。

继续追问：

- 为什么先增加 Scanner 并发会更糟？
- 如何给门禁设置 SLO？
- 队列能不能直接清空？

### 5. 如何做高可用？

参考答案：先按 Edition 和官方支持边界选型。单实例方案重点是外部数据库 HA、快速重建与明确 RTO；应用多节点和搜索高可用要使用受支持的 Data Center Edition 架构。

继续追问：

- 两个 Community Build 共享数据库是否可行？
- 数据库恢复后为什么还要等索引？
- CI 在平台故障时是失败关闭还是失败开放？

### 6. 如何安全升级和回滚？

参考答案：先确定升级路径和兼容矩阵，备份数据库，在生产数据副本演练，使用新目录或新镜像完成迁移并观察索引重建。若数据库已迁移，不能只回退应用二进制。

继续追问：

- 数据库空间为什么要留额外余量？
- 插件如何纳入门禁？
- 回滚演练要验证哪些 API 和项目？

## 学习检查清单

- [ ] 我能区分 Community Build、Server Editions、Data Center Edition、Cloud 和 IDE。
- [ ] 我能画出 Scanner、Web、CE、数据库和 Search 的数据路径。
- [ ] 我能解释 Profile、Gate、Issue、Measure、Hotspot 和 New Code。
- [ ] 我能跑通本地服务、创建 Token 并完成一次扫描。
- [ ] 我能解释为什么上传成功不等于 Gate 完成。
- [ ] 我能按 Web、CE、DB、Search 日志排查故障。
- [ ] 我能说明数据库主状态与搜索派生索引。
- [ ] 我能完成数据库停止故障实验并恢复。
- [ ] 我能设计容量、权限、备份、升级与回滚。
- [ ] 我能把质量信号关联到 AIOps 变更风险，但不伪造因果。
- [ ] 我能回答事故题和生产系统设计题。

## 学习证据

建议提交：

```text
sonarqube-aiops-lab/
  README.md
  compose.yaml
  sonar-project.properties
  src/app.js
  evidence/
    system-status.json
    scanner-success.log
    background-task.png
    quality-gate.png
    db-failure.log
    recovered-scan.log
  notes/
    analysis-path.md
    profile-vs-gate.md
    capacity-plan.md
    upgrade-rollback.md
    incident-review.md
```

README 必须区分“本文给出的预期结果”和“你实际跑出的结果”，记录镜像标签、Digest、实验日期、Token 清理、故障时间线和未验证边界。

本文边界是从零到生产运维与平台面试主线，没有穷尽所有语言分析参数、规则、商业 Edition 能力、LDAP/SAML 配置、Data Center Edition 拓扑和 Web API。深入时继续阅读目标版本官方文档、发布说明和 API 内置文档。

读完本文也不等于自动具备岗位能力。还需要训练编程语言、构建工具、测试、CI/CD、安全、数据库、Linux/JVM、容量规划和真实变更沟通。
