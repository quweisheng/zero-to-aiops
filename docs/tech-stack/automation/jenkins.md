# Jenkins 深讲

> 学习目标：理解 Jenkins Controller、Agent、Pipeline、插件和凭据，能启动学习环境、运行一条声明式流水线，并定位排队、Agent 离线、脚本与插件类故障。

## 官方资料

- [Jenkins 用户文档](https://www.jenkins.io/doc/)
- [Pipeline](https://www.jenkins.io/doc/book/pipeline/)
- [使用 Agents](https://www.jenkins.io/doc/book/using/using-agents/)
- [凭据](https://www.jenkins.io/doc/book/using/using-credentials/)
- [安全](https://www.jenkins.io/doc/book/security/)

## 官方知识地图

```text
Jenkins
  -> Controller / Agent / Executor / Queue
  -> Job / Build / Pipeline / Jenkinsfile
  -> Plugin 与升级
  -> Credentials 与权限
  -> Artifact 与外部制品仓库
  -> 备份、恢复与可观测性
```

## 场景开场

一条构建任务排队半小时，没有执行日志。有人认为 Jenkins 挂了，但也可能是 Agent 离线、标签不匹配、Executor 用满，或前面任务占住资源。理解调度模型，才能快速判断故障在哪一层。

## 一句话人话版

Jenkins Controller 负责保存和调度任务，Agent 提供执行环境，Jenkinsfile 把构建与发布步骤保存进代码仓库。

## 小白可能会问

- Jenkins 与 GitLab CI/CD 为什么会同时出现？
- Controller 能不能直接承担所有构建？
- Agent、Node 和 Executor 有什么关系？
- 插件越多是不是能力越强？

## 为什么要学

很多存量企业流水线仍由 Jenkins 承载。岗位需要的不只是写脚本，还包括 Agent 容量、插件风险、凭据、制品追溯、备份恢复和发布故障处理。

## Jenkins 是什么

Jenkins 是可扩展的自动化服务器。Controller 保存配置、调度 Queue 并提供界面；Agent 连接 Controller，在自己的 Workspace 中执行任务；Executor 表示一个 Agent 可并行执行多少个任务。

## 它解决什么问题

- 自动执行构建、测试、扫描和部署步骤。
- 用 Jenkinsfile 对流水线进行版本管理。
- 通过 Agent 标签把任务分配到合适环境。
- 使用凭据存储避免密码直接写进脚本。
- 通过插件连接 Git、Kubernetes、Harbor、Nexus 等系统。

## 核心原理

### Controller、Agent 与 Executor

- **是什么**：Controller 负责管理与调度，Agent 负责执行，Executor 是并发槽位。
- **为什么需要**：把控制职责与不可信、耗资源的构建隔离。
- **怎么工作**：任务进入 Queue，Jenkins 按 label、在线状态和空闲 Executor 选择 Agent。
- **怎么看或怎么用**：查看 Queue、Nodes、Agent 日志、label 和 executor 使用率。
- **坏了怎么查**：先看是否有匹配节点，再查连接、磁盘、工具链和资源压力。

### Pipeline 与 Jenkinsfile

- **是什么**：Pipeline 是交付流程，Jenkinsfile 是存放在仓库中的流程代码。
- **为什么需要**：让流水线随代码评审、版本化并可复现。
- **怎么工作**：Jenkins 读取声明式或脚本式语法，将 Stage 中的 Step 交给 Agent 执行。
- **怎么看或怎么用**：从 Stage View 和 Console Output 找第一处失败步骤。
- **坏了怎么查**：检查语法、共享库版本、环境变量、工作目录和命令退出码。

### Plugin 与升级

- **是什么**：Plugin 为 Jenkins 增加 SCM、凭据、Agent、界面等能力。
- **为什么需要**：不同企业交付链路差异很大，核心保持精简。
- **怎么工作**：插件在 Controller 内加载，并可能依赖其他插件和特定 Jenkins 核心版本。
- **怎么看或怎么用**：维护插件清单、依赖、版本、漏洞和重启要求。
- **坏了怎么查**：升级前备份并在测试环境验证；故障时查启动日志和依赖冲突，避免盲目批量升级。

### Credentials 与权限

- **是什么**：Credentials 存放口令、Token、SSH Key 或证书，权限模型控制谁能配置和使用。
- **为什么需要**：流水线必须访问外部系统，但秘密不能进入 Git 或普通日志。
- **怎么工作**：Job 在限定作用域内绑定凭据，运行时暂时注入环境或文件。
- **怎么看或怎么用**：采用最小作用域和最小权限，优先短期凭据并定期轮换。
- **坏了怎么查**：查凭据 ID、scope、授权、过期时间和目标端权限，禁止在日志中回显秘密。

## 架构和数据流

```text
代码提交 / 定时 / 人工触发
  -> Jenkins Controller 创建 Build
  -> Queue 等待匹配 Agent
  -> Agent Executor 准备 Workspace
  -> 执行 Jenkinsfile
  -> 测试报告 / 日志 / 制品 / 部署结果
  -> 外部 Harbor、Nexus 或目标环境
```

## 安装与启动

本地学习可使用 Jenkins 官方 Docker 镜像。生产环境要另外设计持久化、备份、TLS、反向代理、Agent 网络和升级。

```powershell
docker volume create jenkins_home # 创建持久卷，避免删除容器后丢配置
docker run -d --name jenkins-lab -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts-jdk21 # 启动 LTS 学习环境
docker logs jenkins-lab # 查看启动过程和初始解锁信息
docker exec jenkins-lab cat /var/jenkins_home/secrets/initialAdminPassword # 读取首次安装密码
```

浏览器访问 `http://localhost:8080`。首次学习可安装建议插件，但应记录插件清单。

## 配置详解

```groovy
pipeline {
  agent any // 使用任意可用 Agent；生产任务通常改成明确 label
  stages {
    stage('Validate') {
      steps {
        sh 'test -f README.md' // 确认仓库根目录存在 README.md
      }
    }
    stage('Package') {
      steps {
        sh 'tar -czf evidence.tar.gz README.md' // 生成本次学习制品
        archiveArtifacts artifacts: 'evidence.tar.gz', fingerprint: true // 归档并记录指纹
      }
    }
  }
  post {
    always {
      echo "build=${env.BUILD_NUMBER} result=${currentBuild.currentResult}" // 无论成功失败都输出构建摘要
    }
  }
}
```

`agent any` 便于入门，但生产应使用标签指定工具链和信任级别；正式发布包应进入 Nexus 或 Harbor，Jenkins 内部归档更适合短期证据。

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `agent` | 选择执行节点 | `agent { label 'linux' }` | 在匹配 Agent 运行 | 标签存在但节点离线 |
| `environment` | 定义环境变量 | `KEY = 'value'` | Stage 内可读取 | 把秘密写入 Jenkinsfile |
| `withCredentials` | 临时绑定凭据 | `credentialsId: 'registry'` | 作用域内可用 | 在命令回显秘密 |
| `archiveArtifacts` | 保存构建输出 | `artifacts: 'dist/**'` | Build 页面可下载 | 当作长期制品仓库 |
| `input` | 人工审批 | `input 'Deploy?'` | 获授权后继续 | Executor 被审批长期占用 |

## 在 AIOps 中的作用

Jenkins 可提供队列时长、构建时长、成功率、Agent 在线状态、Executor 使用率和失败日志。AIOps 可以检测 Runner/Agent 容量瓶颈、归类重复错误，并把应用告警与 Jenkins Build、Commit、制品指纹和部署时间关联。

## 入门实验：运行第一条 Pipeline

### 实验目标

启动 Jenkins，创建 Pipeline，生成并下载 `evidence.tar.gz`。

### 实验步骤

1. 按安装命令启动容器并完成首次登录。
2. 新建 Pipeline Job，把上面的 Jenkinsfile 内容放进 Pipeline script。
3. 确保 Workspace 中有 README.md；更推荐把 Jenkinsfile 和 README.md 放到测试 Git 仓库，再选择 Pipeline from SCM。
4. 点击 Build Now，打开 Console Output。
5. 构建完成后从 Artifacts 下载压缩包。

### 验证结果

Build 状态为 SUCCESS，两个 Stage 为绿色，Artifacts 中能看到 `evidence.tar.gz`，日志末尾有 build 编号和结果。

### 如果没有成功

1. 一直排队：查 Agent、label 和 Executor。
2. `sh` 不存在：当前节点可能是 Windows，改用 Linux Agent 或 `bat/powershell`。
3. 找不到 README：查 SCM checkout 和 Workspace 路径。
4. 无 Artifact：查文件是否生成、匹配表达式和权限。

## 常见故障排查

| 现象 | 先检查 | 处理思路 |
|---|---|---|
| Build 一直排队 | label、Agent、Executor、限制规则 | 恢复节点或扩容并发 |
| Agent 反复离线 | 网络、Java、磁盘、时间、连接日志 | 修复基础环境再重连 |
| 升级后无法启动 | 核心与插件兼容、启动日志、备份 | 在测试环境回放并恢复兼容版本 |
| 凭据不可用 | ID、scope、权限、有效期 | 修正授权并轮换凭据 |
| Controller 负载高 | Build 是否跑在 Controller、插件、队列 | 迁移构建到 Agent 并治理插件 |

## 面试怎么讲

Jenkins 采用 Controller 调度、Agent 执行的模型。我会把 Jenkinsfile 放进仓库、按信任和工具链划分 Agent、正式制品进入外部仓库，并对队列、构建、Agent 和插件建立监控。故障按 Queue、节点、Workspace、脚本、外部依赖的顺序定位。

## 学习检查清单

- [ ] 能区分 Controller、Agent、Executor 和 Queue。
- [ ] 能写一条声明式 Pipeline。
- [ ] 能解释为什么构建不应长期跑在 Controller。
- [ ] 能定位任务排队和 Agent 离线。
- [ ] 能说明插件与凭据的治理方法。

## 面试题

1. Jenkins Controller 为什么不适合执行普通构建？
2. Job 一直在 Queue 中如何排查？
3. Jenkinsfile 放仓库有什么价值？
4. 插件升级如何降低风险？
5. Jenkins 与 GitLab CI/CD 如何选型或共存？

## 学习证据

- Jenkinsfile。
- Pipeline 成功截图和制品。
- Agent 标签与容量设计说明。
- 一份插件清单、备份恢复或失败构建复盘。

## 本文边界与下一步

本文覆盖岗位常见的流水线和平台运维主线。生产 Jenkins 还要深入学习 Configuration as Code、共享库、Kubernetes 动态 Agent、权限矩阵、备份恢复和无损升级。
