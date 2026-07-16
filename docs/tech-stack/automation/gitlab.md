# GitLab 与 GitLab CI/CD 深讲

> 学习目标：理解 GitLab 项目、流水线、Runner、制品和环境的关系，能写一条最小 CI/CD 流水线，验证配置并按队列、Runner、脚本和发布环境排障。

## 官方资料

- [GitLab 文档](https://docs.gitlab.com/)
- [CI/CD 文档](https://docs.gitlab.com/ci/)
- [Runner 文档](https://docs.gitlab.com/runner/)
- [Runner 工作原理](https://docs.gitlab.com/ci/runners/)
- [CI/CD YAML 参考](https://docs.gitlab.com/ci/yaml/)

GitLab 功能和语法会随版本演进，实际使用应以公司 GitLab 实例版本对应的文档为准。

## 官方知识地图

```text
GitLab
  -> Group / Project / Repository
  -> Merge Request 与代码评审
  -> .gitlab-ci.yml
  -> Pipeline / Stage / Job
  -> Runner / Executor
  -> Cache / Artifact / Package / Registry
  -> Environment / Deployment / Approval
  -> 权限、变量、审计与运维
```

## 场景开场

开发把代码推到仓库后，测试、构建镜像和部署仍靠人在终端逐条执行。结果是步骤不一致、凭据散落、失败无法复现。GitLab CI/CD 的目标，是让每次变更经过同一条可审计流水线。

## 一句话人话版

GitLab 保存代码和协作记录，GitLab CI/CD 再把仓库中的步骤交给 Runner 自动执行并保存结果。

## 小白可能会问

- GitLab 与 GitHub、Jenkins 有什么区别？
- Pipeline、Stage、Job 分别是什么？
- `.gitlab-ci.yml` 是谁执行的？
- Cache、Artifact 和制品仓库为什么不能混用？

## 为什么要学

岗位明确要求 GitLab、CI/CD 和 DevOps。平台运维不仅要会点“运行”，还要理解 Runner 容量、构建隔离、凭据、制品追溯、审批、回滚以及流水线指标。

## GitLab 是什么

GitLab 是覆盖代码托管、协作和软件交付的平台。仓库中的 `.gitlab-ci.yml` 定义流水线；Runner 是领取并执行 Job 的程序；Executor 决定 Job 在 Shell、Docker 或 Kubernetes 等环境中怎样运行。

## 它解决什么问题

- 把代码、评审、构建、测试和部署记录关联起来。
- 让交付步骤版本化并可重复执行。
- 通过受保护变量和环境限制生产权限。
- 保存测试报告和构建产物。
- 用流水线状态阻止未经验证的变更进入主分支。

## 核心原理

### Pipeline、Stage 与 Job

- **是什么**：Pipeline 是一次流水线；Stage 是阶段；Job 是最小执行单元。
- **为什么需要**：把复杂交付过程拆成有依赖、有并行度的步骤。
- **怎么工作**：GitLab 根据 YAML 创建 Job，前一 Stage 成功后进入下一 Stage，同 Stage 通常并行。
- **怎么看或怎么用**：从 Pipeline 图进入失败 Job，查看脚本、Runner、变量和日志。
- **坏了怎么查**：先区分 YAML 未创建、Job 等待、脚本失败还是部署失败。

### Runner 与 Executor

- **是什么**：Runner 从 GitLab 领取 Job；Executor 决定执行环境。
- **为什么需要**：GitLab 服务本身不直接在服务器上执行用户脚本。
- **怎么工作**：Runner 注册并轮询任务，按标签和保护规则匹配 Job，执行后回传日志和状态。
- **怎么看或怎么用**：查看 Runner online 状态、标签、版本、并发和最近任务。
- **坏了怎么查**：Pending 先查是否有匹配标签和权限的 Runner，再查网络、令牌和容量。

### Cache、Artifact 与 Package

- **是什么**：Cache 加速重复下载；Artifact 保存 Job 输出；Package/Registry 保存可发布制品。
- **为什么需要**：加速数据和交付证据的生命周期不同。
- **怎么工作**：Cache 可跨 Job 复用但不保证永久；Artifact 按流水线保存；Package 有版本和仓库语义。
- **怎么看或怎么用**：为测试报告设 Artifact，为依赖目录设 Cache，为正式包使用制品仓库。
- **坏了怎么查**：检查 key、路径、过期时间、对象存储、权限和上传大小限制。

### 变量、环境与发布控制

- **是什么**：CI/CD Variable 提供参数或秘密；Environment 记录部署目标；保护规则限制生产操作。
- **为什么需要**：代码可以公开流程，但不应包含密码，也不能让任意分支发布生产。
- **怎么工作**：GitLab 在 Job 运行时注入变量，并按分支、环境和审批规则决定是否允许执行。
- **怎么看或怎么用**：秘密使用 masked/protected 变量，生产 Job 使用受保护环境和手动审批。
- **坏了怎么查**：不要输出秘密；检查变量 scope、分支保护、环境授权和 OIDC/凭据有效期。

## 架构和数据流

```text
Git push / Merge Request
  -> GitLab 读取 .gitlab-ci.yml
  -> 创建 Pipeline 与 Jobs
  -> 匹配 Runner
  -> Executor 准备隔离环境
  -> 执行测试 / 构建 / 发布
  -> 回传日志、报告、制品与部署状态
```

## 安装与启动

企业环境通常由平台团队部署 GitLab，项目使用者先验证仓库与 Runner。Runner 的安装方式应按官方文档和操作系统选择。

```powershell
git remote -v # 确认代码指向预期 GitLab 项目
git ls-remote origin # 验证 Git 协议、DNS 和权限，正常会返回远端引用
gitlab-runner --version # 在 Runner 主机上确认程序版本
gitlab-runner verify # 在 Runner 主机上验证已注册实例的连通性
```

## 配置详解

```yaml
stages:
  - test # 先验证代码
  - package # 测试通过后再生成交付物

shell-test:
  stage: test
  image: alpine:3.20 # Docker/Kubernetes executor 使用的隔离镜像
  script:
    - test -f README.md # 文件不存在时命令返回非零，Job 失败

package-evidence:
  stage: package
  image: alpine:3.20
  script:
    - mkdir -p dist
    - cp README.md dist/README.md
  artifacts:
    paths:
      - dist/ # 保存给下载或后续 Job 使用的输出目录
    expire_in: 7 days # 学习制品七天后自动过期
```

`image` 只对支持容器镜像的 Executor 生效；Shell executor 会直接在 Runner 主机执行，必须特别关注隔离和权限。

## 命令 / 配置 / API 字典

| 名称 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `rules` | 决定 Job 是否创建 | `if: '$CI_COMMIT_BRANCH == "main"'` | 只在符合条件时出现 | 同时混用 `only/except` 造成误判 |
| `needs` | 声明 Job 依赖 | `needs: [build]` | 可跨 Stage 提前执行 | 忘记传递所需 Artifact |
| `tags` | 匹配 Runner | `tags: [linux]` | 被带对应标签的 Runner 领取 | 没有 Runner 匹配导致 Pending |
| `artifacts` | 保存 Job 输出 | `paths: [dist/]` | 页面可下载制品 | 路径相对工作目录，写错会为空 |
| CI Lint | 校验 YAML | 项目 Build > Pipeline editor | 配置显示 Valid | 语法有效不等于脚本一定成功 |

## 在 AIOps 中的作用

GitLab 提供流水线成功率、排队时长、Job 时长、部署频率、失败日志和变更关联。AIOps 可以识别 Runner 容量异常、归类常见失败原因，并把生产告警关联到最近一次 Deployment 和 Commit。

## 入门实验：运行第一条流水线

### 实验目标

让一次提交依次完成文件测试和学习制品打包，并能从页面下载 Artifact。

### 实验步骤

1. 在测试项目根目录创建上面的 `.gitlab-ci.yml`。
2. 在 Pipeline editor 中打开 CI Lint，确认配置 Valid。
3. 提交到非生产分支并推送。
4. 打开流水线，观察 `shell-test` 成功后 `package-evidence` 开始。
5. 从第二个 Job 下载 Artifact，确认包含 `dist/README.md`。

### 验证结果

流水线为 passed，两个 Job 都成功，Artifact 可下载且文件内容与提交一致。

### 如果没有成功

1. 流水线未创建：查 YAML 路径、语法、workflow/rules。
2. Job 一直 Pending：查 Runner online、标签、保护规则和容量。
3. 脚本失败：从第一条非零退出命令开始读日志。
4. Artifact 不存在：查相对路径、生成步骤、大小限制和过期时间。

## 常见故障排查

| 现象 | 先检查 | 处理思路 |
|---|---|---|
| Pipeline 不出现 | YAML、workflow、rules | 用 CI Lint 和模拟规则检查 |
| Job 一直 Pending | Runner、标签、保护、并发 | 恢复匹配 Runner 或调整容量 |
| 构建偶发失败 | 依赖锁定、网络、Cache、资源 | 消除不确定依赖并保留失败证据 |
| 发布成功但应用异常 | 部署对象、健康检查、版本、回滚 | 关联环境与 Commit，执行回滚 Runbook |
| Runner 风险过高 | Executor、权限、网络、秘密 | 使用隔离 Runner 和最小权限 |

## 面试怎么讲

GitLab CI/CD 由仓库里的 YAML 定义，GitLab 负责调度，Runner 负责执行。我的设计会把测试、构建和部署分开，正式制品写入 Harbor 或 Nexus，生产环境使用受保护变量、环境审批和可验证回滚；故障则按规则、队列、Runner、脚本、制品、环境逐层排查。

## 学习检查清单

- [ ] 能解释 Pipeline、Stage、Job、Runner 和 Executor。
- [ ] 能写并校验一条两阶段流水线。
- [ ] 能区分 Cache、Artifact 和正式制品。
- [ ] 能定位 Pending Job。
- [ ] 能说明生产变量和环境应如何保护。

## 面试题

1. GitLab Runner 为什么不应全部共用 Shell executor？
2. Job 一直 Pending 如何排查？
3. Cache 与 Artifact 有什么区别？
4. 如何设计一条可回滚的 Kubernetes 发布流水线？
5. 如何把流水线数据用于 AIOps？

## 学习证据

- `.gitlab-ci.yml`。
- 流水线成功页面和 Artifact 截图。
- Runner 标签与执行器选型说明。
- 一份失败 Job 的排障和改进记录。

## 本文边界与下一步

本文覆盖项目使用和 Runner 运维主线，不展开 GitLab 服务端的数据库、对象存储、Gitaly、高可用和灾备。承担平台管理员岗位时，应继续学习对应版本的参考架构、备份恢复和升级文档。
