# Nexus Repository 深讲

> 学习目标：理解 hosted、proxy、group 仓库和 blob store，能启动 Nexus、创建学习仓库、上传并下载制品，并定位权限、代理缓存、磁盘和清理策略问题。

## 官方资料

- [Nexus Repository 帮助中心](https://help.sonatype.com/en/sonatype-nexus-repository.html)
- [仓库类型](https://help.sonatype.com/en/repository-types.html)
- [清理策略](https://help.sonatype.com/en/cleanup-policies.html)
- [Repositories API](https://help.sonatype.com/en/repositories-api.html)
- [自动化](https://help.sonatype.com/en/automation.html)

具体格式、API 和功能可能随版本或授权变化，操作前以当前 Nexus 实例的内置 API 文档与官方版本说明为准。

## 官方知识地图

```text
Nexus Repository
  -> Repository Format
  -> hosted / proxy / group
  -> Component / Asset / Version
  -> Blob Store
  -> 权限、Realm 与用户
  -> Cleanup Policy / Compact / Backup
  -> API、任务、监控与升级
```

## 场景开场

构建流水线每次都从公网下载 Maven、npm 或 Python 依赖。公网抖动后所有 Job 同时失败，而且团队找不到上个月发布的内部包。Nexus 用代理缓存和内部仓库把依赖与正式制品稳定下来。

## 一句话人话版

Nexus 是制品仓库：集中保存公司发布包、缓存外部依赖，并用版本、权限和策略管理它们。

## 小白可能会问

- Nexus 与 Git、Jenkins、Harbor 分别保存什么？
- hosted、proxy、group 有什么区别？
- 删除组件后为什么磁盘没有立刻下降？
- Cache、Artifact 和正式制品为什么不能混为一谈？

## 为什么要学

岗位点名 Nexus，实际考察的是软件供应链和发布治理。AIOps 平台也会产生 Python 包、模型文件、规则包或 Agent 安装包，需要可追溯、可回滚、可审计的制品来源。

## Nexus Repository 是什么

Nexus Repository 是通用制品仓库管理器。它支持 Maven、npm、PyPI、Docker 等格式；Repository 决定访问方式，Blob Store 保存二进制内容，数据库保存组件、资产和元数据关系。

## 它解决什么问题

- 保存团队自己发布的版本化制品。
- 代理并缓存外部仓库，降低公网依赖。
- 通过 group 给客户端提供一个统一入口。
- 用权限和审计限制谁能上传、覆盖或删除。
- 用清理、备份和恢复控制容量与可用性。

## 核心原理

### hosted、proxy 与 group

- **是什么**：hosted 保存内部制品；proxy 缓存远端；group 聚合多个仓库。
- **为什么需要**：分别处理发布、外部依赖和统一访问入口。
- **怎么工作**：客户端请求 group，Nexus 按成员顺序查找；proxy 未命中时访问远端并缓存。
- **怎么看或怎么用**：客户端通常下载走 group，内部发布写 hosted，不能发布到 group。
- **坏了怎么查**：检查成员顺序、在线状态、远端 URL、负缓存和路由规则。

### Component、Asset 与 Blob Store

- **是什么**：Component 表示一个逻辑制品版本，Asset 是实际文件，Blob Store 保存文件内容。
- **为什么需要**：一个 Maven 组件可能同时包含 JAR、POM、校验文件和元数据。
- **怎么工作**：元数据把组件和资产映射到 blob；删除记录与回收底层空间可能不是同一步。
- **怎么看或怎么用**：从 Browse 找组件，再查 blob store 用量、任务和日志。
- **坏了怎么查**：不要手工删数据目录；先查任务、数据库一致性、磁盘和官方恢复流程。

### 权限、Realm 与匿名访问

- **是什么**：Realm 接入认证机制，Privilege、Role、User 决定可执行操作。
- **为什么需要**：下载、上传、删除和管理的风险完全不同。
- **怎么工作**：请求先认证，再按仓库、格式和动作权限授权。
- **怎么看或怎么用**：流水线使用独立服务账号，只授予目标 hosted 仓库上传权限。
- **坏了怎么查**：401 查认证，403 查授权，404 还要考虑路径、格式和内容选择器。

### 清理、压缩、备份与恢复

- **是什么**：Cleanup Policy 选择过期内容，相关任务执行删除；回收空间还可能需要 blob compact。
- **为什么需要**：制品只增不减会耗尽磁盘，但误删又会破坏回滚。
- **怎么工作**：策略按最后下载、发布时间等条件匹配，任务按计划运行并记录结果。
- **怎么看或怎么用**：先预估命中范围，在非生产验证，保留发布保留期和法律要求。
- **坏了怎么查**：磁盘告警时先暂停大规模写入和清理变更，确认备份可恢复后再处置。

## 架构和数据流

```text
开发机 / CI
  -> group 仓库下载依赖
  -> hosted 命中内部包
  -> proxy 命中缓存或访问远端

发布流水线
  -> 认证与授权
  -> hosted 仓库
  -> 元数据 + Blob Store
  -> 下游部署按固定版本下载
```

## 安装与启动

本地学习使用 Sonatype 官方容器镜像并持久化 `/nexus-data`。生产环境要评审支持矩阵、外部 TLS、存储、备份和升级。

```powershell
docker volume create nexus-data # 创建持久卷保存配置、数据库和 blob
docker run -d --name nexus-lab -p 8081:8081 -v nexus-data:/nexus-data sonatype/nexus3:latest # 启动学习环境
docker logs -f nexus-lab # 等待日志显示服务已启动；按 Ctrl+C 退出跟踪
docker exec nexus-lab cat /nexus-data/admin.password # 读取首次登录密码
```

浏览器访问 `http://localhost:8081`。首次登录后立即修改密码，学习完成也不要把密码写入仓库。

## 配置详解

以 Maven 为例，客户端应从 group 下载依赖，把内部发布上传到 hosted：

```xml
<mirror>
  <id>company-nexus</id>
  <mirrorOf>*</mirrorOf>
  <url>https://nexus.example.internal/repository/maven-public/</url>
</mirror>
```

`mirrorOf` 为 `*` 表示 Maven 依赖统一经过 Nexus；`maven-public` 通常是 group。发布地址应在项目 `distributionManagement` 或 CI 参数中指向 releases/snapshots hosted 仓库，而不是 group。

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| hosted | 保存内部制品 | `maven-releases` | 上传后可按坐标下载 | 允许随意覆盖正式版本 |
| proxy | 代理远端仓库 | `maven-central` | 首次回源、之后缓存 | 远端证书或代理网络失败 |
| group | 聚合成员仓库 | `maven-public` | 客户端只配置一个下载入口 | 成员顺序导致取到错误包 |
| Cleanup Policy | 选择可清理内容 | 按格式和时间条件 | 任务删除匹配内容 | 未验证规则就作用于生产 |
| REST API | 自动化管理 | `/service/rest/v1/...` | 返回 JSON 或状态码 | 版本差异和权限不足 |

## 在 AIOps 中的作用

Nexus 可提供请求量、响应延迟、错误码、远端仓库状态、任务结果、磁盘和 blob 用量。AIOps 能识别依赖下载失败是否来自远端、容量还是权限，并把部署版本与制品仓库中的不可变版本、校验值关联。

## 入门实验：上传并下载 Raw 制品

### 实验目标

在页面创建名为 `raw-lab` 的 hosted Raw 仓库，上传文本文件后通过 HTTP 下载并校验内容。

### 实验步骤

1. 登录 Nexus，进入 Repositories，新建 `raw (hosted)`，名称填写 `raw-lab`。
2. 在实验目录创建 `hello.txt`，内容写 `zero-to-aiops`。
3. 使用学习账号执行：

```powershell
$pair = 'admin:你的新密码' # 仅在本地临时变量使用，不写入脚本或 Git
$token = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
Invoke-WebRequest -Method Put -Uri 'http://localhost:8081/repository/raw-lab/hello.txt' -Headers @{Authorization="Basic $token"} -InFile '.\hello.txt' # 上传文件
Invoke-WebRequest -Uri 'http://localhost:8081/repository/raw-lab/hello.txt' -OutFile '.\downloaded-hello.txt' # 下载文件
Get-FileHash .\hello.txt, .\downloaded-hello.txt # 两个 SHA256 应一致
```

### 验证结果

上传返回成功状态，浏览仓库能看到 `hello.txt`，两个文件 SHA256 相同。

### 如果没有成功

1. 连接失败：确认容器、8081 端口和启动日志。
2. 401：检查账号密码；403：检查上传权限。
3. 404：检查仓库名、Raw 格式和 URL 路径。
4. Hash 不同：确认下载的不是代理错误页面，并查看响应状态。

## 常见故障排查

| 现象 | 先检查 | 处理思路 |
|---|---|---|
| 下载返回 401/403 | 凭据、Realm、Role、Privilege | 区分认证与授权后修正最小权限 |
| proxy 无法回源 | Remote URL、DNS、TLS、代理、负缓存 | 修复网络并按需失效缓存 |
| 磁盘持续增长 | 仓库增长、Cleanup 任务、blob 用量 | 评审保留策略后清理和 compact |
| group 返回旧版本 | 成员顺序、元数据缓存、版本策略 | 修正顺序并避免覆盖正式版本 |
| 重启后不可用 | 磁盘、权限、数据库、升级兼容 | 依据日志和官方恢复步骤处理 |

## 面试怎么讲

Nexus 用 hosted 保存内部制品、proxy 缓存远端依赖、group 统一下载入口。生产治理重点是版本不可变、最小权限、磁盘与清理策略、备份恢复和升级兼容。排障时先按 HTTP 状态区分认证、授权、路径和后端，再检查远端与 blob store。

## 学习检查清单

- [ ] 能解释 hosted、proxy、group。
- [ ] 能区分 Component、Asset 和 Blob Store。
- [ ] 能上传、下载并校验一个 Raw 制品。
- [ ] 能说明删除内容后空间为何不一定立刻下降。
- [ ] 能设计流水线服务账号的最小权限。

## 面试题

1. hosted、proxy 和 group 各用于什么场景？
2. Nexus 与 Harbor 的边界是什么？
3. 删除制品后磁盘未释放如何处理？
4. 如何保证发布制品可追溯且不可随意覆盖？
5. 制品仓库故障会怎样影响 CI/CD？

## 学习证据

- Raw 仓库配置截图。
- 上传、下载与 Hash 校验结果。
- 一份 hosted/proxy/group 设计图。
- 一份容量告警或代理失败排障记录。

## 本文边界与下一步

本文覆盖岗位所需的制品仓库主线。生产环境还应深入对应格式的布局、HA/灾备支持边界、数据库与 blob 备份一致性、升级路径、恶意包治理和供应链安全。
