# Kubeflow 技术栈深讲

> 学习目标：从零理解 Kubeflow 为什么不是一个单体程序，而是一组运行在 Kubernetes 上的 AI 平台子项目与生态集成；能解释一次 Notebook、Pipeline、Katib 搜索、分布式训练、模型登记和推理交付经过哪些组件；能完成 KFP Pipeline 的本地编译与类型故障实验；能按证据排查 Pending、PVC、权限、流水线、GPU、制品和控制器故障，并能回答生产高可用、容量、安全、升级回滚和 AIOps 平台设计追问。

> 版本快照：本文在 2026-08-14 核验 Kubeflow Community Distribution（KCD，Kubeflow 社区发行版）`26.03.1`。它采用“年.月.补丁”的日历版本号，内部固定多个独立子项目版本，不等于所有组件都叫 `26.03.1`。生产部署必须固定发行版 tag/commit、镜像 digest 和自己的 Kustomize overlay，不能直接安装滚动变化的 `master`。

## 官方资料

- [Kubeflow 官方文档](https://www.kubeflow.org/docs/)
- [Kubeflow Introduction](https://www.kubeflow.org/docs/started/introduction/)
- [Kubeflow Architecture](https://www.kubeflow.org/docs/started/architecture/)
- [Kubeflow Subprojects](https://www.kubeflow.org/docs/components/)
- [安装 Kubeflow](https://www.kubeflow.org/docs/started/installing-kubeflow/)
- [Kubeflow Community Distribution 仓库](https://github.com/kubeflow/community-distribution)
- [KCD 26.03.1 Release](https://github.com/kubeflow/community-distribution/releases/tag/26.03.1)
- [KCD 26.03 发布页与组件矩阵](https://www.kubeflow.org/docs/kubeflow-distribution/releases/kubeflow-26.03/)
- [KCD 26.03.1 发布公告](https://blog.kubeflow.org/kubeflow-26.03-release/)
- [Kubeflow Pipelines 文档](https://www.kubeflow.org/docs/components/pipelines/)
- [KFP 2.16.1 Release](https://github.com/kubeflow/pipelines/releases/tag/2.16.1)
- [编译 Pipeline](https://www.kubeflow.org/docs/components/pipelines/user-guides/core-functions/compile-a-pipeline/)
- [运行 Pipeline](https://www.kubeflow.org/docs/components/pipelines/user-guides/core-functions/run-a-pipeline/)
- [连接 KFP API](https://www.kubeflow.org/docs/components/pipelines/user-guides/core-functions/connect-api/)
- [KFP 安装文档](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/)
- [KFP v1 到 v2 迁移](https://www.kubeflow.org/docs/components/pipelines/user-guides/migration/)
- [Kubeflow Katib 文档](https://www.kubeflow.org/docs/components/katib/)
- [Katib 架构](https://www.kubeflow.org/docs/components/katib/reference/architecture/)
- [Katib 0.19.0 Release](https://github.com/kubeflow/katib/releases/tag/v0.19.0)
- [Kubeflow Trainer 文档](https://trainer.kubeflow.org/en/latest/)
- [Trainer 安装](https://trainer.kubeflow.org/en/latest/operator-guides/installation.html)
- [Trainer v1 迁移到 v2](https://trainer.kubeflow.org/en/latest/operator-guides/migration/)
- [Trainer 2.2.0 Release](https://github.com/kubeflow/trainer/releases/tag/v2.2.0)
- [Kubeflow Notebooks 文档](https://www.kubeflow.org/docs/components/notebooks/)
- [Kubeflow Dashboard 文档](https://www.kubeflow.org/docs/components/dashboard/)
- [Kubeflow Hub 概览](https://www.kubeflow.org/docs/components/hub/overview/)
- [Kubeflow Hub 0.3.9 Release](https://github.com/kubeflow/hub/releases/tag/v0.3.9)
- [Kubeflow Spark Operator 文档](https://www.kubeflow.org/docs/components/spark-operator/)
- [Spark Operator 2.5.0 Release](https://github.com/kubeflow/spark-operator/releases/tag/v2.5.0)
- [KServe 官方文档](https://kserve.github.io/website/)
- [KServe 0.18.0 Release](https://github.com/kserve/kserve/releases/tag/v0.18.0)
- [Kubernetes 文档](https://kubernetes.io/docs/home/)
- [Kueue 文档](https://kueue.sigs.k8s.io/docs/)
- [JobSet 文档](https://jobset.sigs.k8s.io/docs/)

本文只吸收官方概念、版本、API 和运维边界，再按 AIOps 学习场景重新组织，不复制官方全文。版本、兼容矩阵、镜像和 CRD 会继续变化，执行前必须回到对应 tag 的 README、release notes 和迁移指南复核。

## 先把版本与产品边界说清楚

### 当前稳定发行版不是旧式 `1.x`

Kubeflow 社区正在从旧的整体 `1.x` 版本转向 Calendar Versioning（日历版本）。截至本文核验日，安装页推荐的稳定社区发行版是 `26.03.1`：

```text
26.03.1
  26 = 2026 年
  03 = 3 月发行线
  1  = 该发行线的第一个补丁
```

社区计划一年发布大约两个基础版本，并对每个日期版本提供大约 6 个月的 best-effort（尽力而为）社区支持。它不是商业 SLA，也不能理解成“超过 6 个月就一定立即失效”；平台团队仍要关注安全公告、上游组件支持期和所选发行商的合同边界。

### `26.03.1` 是一张经过组合的版本清单

KCD `26.03.1` 固定的主要组件如下。表中“角色”比版本号更重要：一次升级不能把每一行都独立改成 upstream latest（上游最新版）。

| 层 | KCD 26.03.1 固定版本 | 人话作用 | 关键边界 |
|---|---:|---|---|
| Kubeflow Pipelines | `2.16.1` | 编排可重复的机器学习步骤 | KFP 上游已有更新版本也不代表能绕过发行版矩阵直接替换 |
| Katib | `0.19.0` | 超参数搜索、早停和 AutoML 调度 | 每个 Trial 会消耗真实计算资源，搜索空间会放大成本 |
| Kubeflow Trainer | `2.2.0` | 用 TrainJob 与 TrainingRuntime 编排分布式训练 | 与旧 Training Operator v1 API 不是同一套对象 |
| Training Operator v1 | `1.9.2` | 兼容旧 PyTorchJob、TFJob、MPIJob 等工作负载 | KCD 固定了兼容版本，但默认 `example` 未启用它；已是 legacy（旧版）路径 |
| Notebooks v1 | `1.11.0` | 管理 Notebook Server、PVC 和相关 Web App | v1 在 2026 年底 EOL；v2 alpha 不能当生产 GA |
| Dashboard | `2.0.0` | 统一入口与组件 UI 导航 | 2.0 有迁移清理步骤，不能只替换镜像 |
| Kubeflow Hub | `0.3.9` | Model Registry + Model Catalog | Registry 主要保存元数据和制品 URI，不等于保存模型权重 |
| Spark Operator | `2.5.0` | 用 SparkApplication 管理 Kubernetes 上的 Spark | Spark 计算引擎、Operator 和 Kubeflow 是三层 |
| KServe | `0.18.0` | 在 Kubernetes 上部署模型推理服务 | 官方景观中属于生态项目，但 KCD 参考清单包含该集成 |
| Istio | `1.30.1` | 入口、路由和授权策略 | Kubernetes Ready 不代表 Istio Gateway/AuthorizationPolicy 正常 |
| Knative | `1.22.0` | 支持 KServe 的可选 Serverless 路径 | 只有选择相应 KServe 模式时才需要理解其缩放语义 |
| cert-manager | `1.20.2` | 为 Webhook 等组件签发和轮换证书 | Webhook 证书异常会让对象创建卡在准入阶段 |
| Dex | `2.45.1` | 示例身份提供与 OIDC 连接 | 生产不能继续使用示例静态账号密码 |
| OAuth2 Proxy | `7.15.2` | 入口处执行 OIDC 会话认证 | 认证成功不等于 Kubernetes RBAC 已授权 |

截至 2026-08-14，部分子项目已经发布了比 KCD 固定值更新的稳定版。这张表不是让你逐项升级，而是帮你识别“发行版组合”与“上游发布节奏”的差别：

| 子项目 | KCD `26.03.1` 固定值 | 核验日上游稳定版 | 正确决策 |
|---|---:|---:|---|
| Kubeflow Pipelines | `2.16.1` | [`2.17.0`](https://github.com/kubeflow/pipelines/releases/tag/2.17.0) | 默认跟随 KCD；单独升级前验证 API、数据库迁移、SDK 与 UI |
| Kubeflow Trainer | `2.2.0` | [`2.3.0`](https://github.com/kubeflow/trainer/releases/tag/v2.3.0) | 核对 CRD、Runtime、JobSet 和迁移说明 |
| Kubeflow Hub | `0.3.9` | [`0.3.14`](https://github.com/kubeflow/hub/releases/tag/v0.3.14) | Hub 上游仍标注 Alpha，不能只因版本更高就作为生产承诺 |
| Spark Operator | `2.5.0` | [`2.5.2`](https://github.com/kubeflow/spark-operator/releases/tag/v2.5.2) | 核对 Spark/Kubernetes 兼容、Webhook 与既有 `SparkApplication` |
| KServe | `0.18.0` | [`0.20.0`](https://github.com/kserve/kserve/releases/tag/v0.20.0) | 独立生态项目；按 KCD 集成矩阵验证 Gateway、存储和推理运行时 |

Kubeflow 核心仓库通常采用 Apache-2.0 许可证，但这不自动覆盖你下载的模型、数据集、GPU 驱动、容器镜像和云服务。上线前要分别保存许可证、来源、使用范围与安全扫描证据，不能把“平台开源”推导成“平台里的所有东西都可商用”。

### Kubernetes 兼容信息必须以发行版实测矩阵为准

官方页面在快速迁移阶段存在不同口径：`26.03` 基础发布页、`26.03.1` 公告和 release highlights 对 Kubernetes 最低版本与 CI 组合的描述不完全相同；`26.03.1` release 特别提到 Kind `0.32+` 与 Kubernetes `1.36` CI。本文不会把这些差异硬凑成一个虚假的“支持所有版本”承诺。

生产选择应按这个顺序：

1. 固定准备安装的 KCD tag，例如 `26.03.1`。
2. 读取该 tag 的 README、release notes 和 CI workflow。
3. 再读取云厂商或 Kubernetes 发行版的 Kubeflow 支持矩阵。
4. 核对 Istio、Knative、cert-manager、CSI、GPU 驱动和 Kubernetes minor。
5. 在一次性集群跑完整安装、升级、回滚和关键 Pipeline，而不是只做 `kustomize build`。

### Kubeflow、KCD、子项目和发行商产品不是一回事

```text
Kubeflow
  -> 一组面向 Kubernetes AI 平台的开源子项目与共同愿景

Kubeflow Community Distribution（KCD）
  -> 社区维护的 vendor-neutral 参考组合
  -> 固定子项目与公共依赖版本
  -> 给出 Kustomize 清单和示例身份入口

Packaged Distribution
  -> Canonical、云厂商或其他维护方打包、测试和支持的发行版
  -> 版本、安装器、支持平台、升级路径和商业 SLA 各自不同

Kubeflow Subproject
  -> Pipelines、Katib、Trainer、Notebooks、Hub 等可独立安装的项目

Kubeflow Ecosystem Project
  -> 与 Kubeflow 集成但有独立治理和发布节奏的项目，例如 KServe
```

“KCD 清单里包含 KServe”与“KServe 在官方景观里属于生态项目”可以同时成立。前者说明某个发行版做了集成，后者说明治理和发布边界。面试和生产设计都要把这两层说清楚。

## 场景开场

一家公司的数据科学团队最初用几台 GPU 服务器训练模型：

- 甲同学在自己的 Notebook 里装了一套依赖。
- 乙同学用另一份脚本清洗数据。
- 丙同学把“最好的模型”复制到共享目录。
- 运维同学收到 GPU 告警，却不知道对应哪个团队、哪次实验。
- 三个月后没人能回答线上模型来自哪份代码、哪批数据、哪组参数。

模型本身可能没有错，平台过程却不可重复、不可审计、不可隔离。团队真正缺的是一条可治理链路：

```text
交互开发
  -> 数据处理
  -> Pipeline 编排
  -> 参数搜索
  -> 分布式训练
  -> 指标与制品记录
  -> 模型登记
  -> 审批与推理部署
  -> 监控、漂移和再训练
```

Kubeflow 的价值不是替你发明模型，而是把这些动作映射成 Kubernetes 可声明、可调度、可观察和可授权的对象与服务。

## 一句话人话版

Kubeflow 是搭在 Kubernetes 上的 AI 平台工具箱：它把 Notebook、流水线、调参、训练、模型元数据和生态推理组件连接起来，让多人机器学习工作可以重复、隔离、追踪和运维。

## 小白最先会问

### Kubeflow 是 Kubernetes 自带的吗

不是。Kubernetes 提供 API、调度、Pod、网络、存储、RBAC 和控制器机制；Kubeflow 在这些能力之上增加 AI 工作负载的 CRD、控制器、API 和 UI。你需要先有 Kubernetes 集群，再选择 Kubeflow 子项目或发行版。

### Kubeflow 是一个容器吗

不是。完整 KCD 会安装大量 Namespace、CRD、Deployment、Service、Webhook、数据库、对象存储接口和授权策略。某个 Pod Running 只证明一个组件进程活着，不能代表整个平台健康。

### Kubeflow 会训练模型吗

Kubeflow 负责组织和运行你的训练代码。真正做张量计算的是 PyTorch、TensorFlow、JAX、XGBoost 等框架；真正提供 GPU 能力的是节点驱动、Container Toolkit、device plugin 和调度链。

### Kubeflow Pipelines 和普通 Python 函数有什么区别

普通函数在同一进程里共享内存；KFP Component 通常会成为独立容器任务，参数和 Artifact 必须通过明确契约传递。Pipeline 先被编译成 YAML，再由后端创建 Kubernetes/Argo 工作负载。

### Dashboard 里显示成功，模型就上线了吗

不一定。Pipeline 成功只说明其定义的步骤完成；还要证明制品上传成功、模型登记指向正确 URI、审批通过、推理服务加载了目标 digest，并用真实请求验证结果。

### Kubeflow 和 MLflow 是竞争关系吗

能力有交集，但重点不同。Kubeflow 更偏 Kubernetes 原生 AI 平台与工作负载编排；MLflow 更聚焦实验跟踪、模型管理和交付接口。团队可以集成两者，也可以只选择所需子项目，不能只按 UI 数量选型。

### 装了 Kubeflow 就自动拥有多租户安全吗

不会。Profile、Namespace、RBAC、Istio AuthorizationPolicy 和身份入口提供基础机制；镜像权限、共享 PVC、对象存储、GPU、Secrets、网络出口和集群管理员仍要单独治理。

## 为什么 AIOps 工程师要学 Kubeflow

Kubeflow 位于 AIOps 的“模型工程与平台化”层。它能把一次性 Notebook 实验变成可重复的训练和发布流程：

- **指标**：记录 Pipeline、训练、GPU、队列、控制器和推理服务状态。
- **日志**：把任务 Pod、Driver/Worker、控制器和 API 日志关联到 run/job UID。
- **链路**：把数据版本、代码 commit、镜像 digest、参数、指标、模型 URI 和部署版本串成 lineage（血缘）。
- **告警**：发现 Pipeline 失败、队列等待、GPU OOM、PVC 卡住、制品上传失败和模型服务异常。
- **自动化**：按审批触发再训练、评估、登记、灰度和回滚。
- **异常检测**：周期性训练 AIOps 模型，但用数据质量和业务门禁防止错误模型自动接管生产。
- **根因分析**：区分“模型代码错”“平台调度错”“存储/网络错”“制品指针错”和“推理版本错”。

## 学习边界与前置知识

本文会完整覆盖小白到生产设计主线，但不会从零重讲 Kubernetes、PyTorch、对象存储、Istio 和 GPU 驱动内部实现。建议先掌握：

1. 容器镜像、Registry 和 digest。
2. Kubernetes Namespace、Pod、Deployment、Job、Service、PVC、Secret、RBAC、CRD、controller。
3. Python 虚拟环境和类型标注。
4. PyTorch 或 TensorFlow 的最小训练循环。
5. HTTP、DNS、TLS 和对象存储 URI。

基础层目标：

```text
认清组件
  -> 编译第一个 Pipeline
  -> 看懂 Profile / Notebook / Experiment / TrainJob
  -> 用 kubectl 找到对应 Pod、Event、PVC 和日志
  -> 完成一个可恢复故障实验
```

进阶层目标：

```text
解释控制面和数据面
  -> 说明状态与制品放在哪里
  -> 设计租户、GPU、队列、存储和身份边界
  -> 做 HA、容量、升级与恢复
  -> 用证据回答系统设计和事故追问
```

## 官方知识地图

当前官方文档把 Kubeflow 分成“社区发行版、子项目和生态”三层。建议按下面顺序学习：

```text
Kubeflow Introduction / Architecture
  -> Community Distribution 与 Packaged Distribution
  -> Dashboard / Profile / Access Management
  -> Notebooks
  -> Pipelines
  -> Katib
  -> Trainer
  -> Hub（Registry + Catalog）
  -> Spark Operator
  -> Ecosystem：KServe、MLflow Integration 等
  -> Kubernetes / Istio / Storage / GPU / Observability
```

对应一次 AI 生命周期：

```text
Notebook 开发
  -> Pipeline 固化步骤
  -> Katib 搜索参数
  -> Trainer 执行单机或分布式训练
  -> Artifact 写入对象存储
  -> Metrics / Metadata / Lineage 进入平台记录
  -> Hub 登记模型版本和制品 URI
  -> KServe 等生态组件部署推理
  -> 指标、日志、漂移和审批触发下一轮
```

## Kubeflow 是什么，不是什么

Kubeflow 是 Kubernetes 上构建 AI 平台的一组开源项目。它利用 Kubernetes 的声明式 API 和 controller pattern（控制器调和模式），把 Notebook、Pipeline、参数搜索和分布式训练等需求变成可观察对象。

Kubeflow 不是：

- Kubernetes 发行版；它不替你维护 etcd、CNI、CSI 和 Node。
- PyTorch/TensorFlow 替代品；它不实现反向传播和优化器。
- 通用数据湖；对象存储、数据仓库和 Feature Store 仍是外部系统。
- 代码版本库；Git commit 和 CI 构建证据仍要外部维护。
- 自动安全边界；默认示例密码、广权限和共享存储必须生产加固。
- 自动高可用产品；参考清单不等于所有数据库和存储都已经 HA。
- “一键安装后不用运维”的 SaaS；控制器、依赖、CRD 和数据迁移都需要平台责任人。

## 它解决什么问题

| 原始问题 | Kubeflow 提供的能力 | 仍需平台团队负责 |
|---|---|---|
| 每个人环境不同 | Notebook/Workspace、镜像模板和 PVC | 镜像供应链、依赖锁定和数据权限 |
| 训练步骤靠手工记忆 | KFP Component、Pipeline 和 Run | 业务逻辑、数据契约、幂等与验收门禁 |
| 参数搜索成本不可控 | Katib Experiment、Trial、早停 | 搜索空间、并发配额、预算和目标指标质量 |
| 多机训练难组织 | Trainer、TrainingRuntime、JobSet | 网络、GPU 驱动、拓扑、checkpoint 和框架调优 |
| 模型版本说不清 | Hub Registry、版本与 Artifact URI | 权重实际存储、签名、审批和保留策略 |
| 多团队互相影响 | Profile、Namespace、RBAC、NetworkPolicy | 身份治理、集群管理员边界和共享资源策略 |
| 平台故障难定位 | CR status、Event、Pod log、组件指标 | 统一遥测、告警规则、Runbook 和事故流程 |

## 总体架构：先分控制面、执行面和数据面

```text
用户 / CI / SDK
  -> OAuth2 Proxy / Dex 或企业 OIDC
  -> Istio Gateway / AuthorizationPolicy
  -> Central Dashboard / 各子项目 API
  -> Kubernetes API Server
  -> CRD + controller reconcile
  -> Job / Pod / Service / PVC
  -> CPU / GPU Node 执行代码

状态与数据旁路
  -> Kubernetes etcd：对象 spec/status、RBAC、Secret 引用
  -> 组件数据库：Pipeline/Run、Katib、Hub 等元数据
  -> 对象存储：数据集、Pipeline Artifact、模型权重
  -> PVC：Notebook 工作目录、部分数据库或缓存
  -> Registry：容器镜像与 digest
  -> Prometheus / Log / Trace：运行证据
```

**控制面**负责接收期望状态、鉴权、创建对象和持续调和。**执行面**是实际运行用户代码的 Notebook、Pipeline task、Trial、Training worker 和推理 Pod。**数据面**在本文中还包括模型请求与训练数据/制品传输；它们的容量、权限和故障模式与控制器不同。

最常见误判是只看控制面 UI：

```text
UI 显示已提交
  != API 已持久化
  != controller 已观察
  != Pod 已调度
  != 容器已启动
  != 数据已读取
  != Artifact 已上传
  != 模型已登记
  != 推理版本已切流
```

## 核心组件一：Dashboard、Profile 与访问管理

### 是什么

Central Dashboard 是统一 Web 入口；Profile 是描述用户/团队工作空间与 Namespace、RBAC 关系的 Kubernetes 自定义资源。Access Management API、Profile Controller、PodDefaults Webhook 和 Istio 授权策略共同参与多用户体验。

### 为什么需要

没有租户边界时，数据科学家很容易在错误 Namespace 创建任务、看到其他团队资源，或让某次参数搜索占满全公司的 GPU。平台需要把“谁、在哪个空间、能做什么”落到可审计对象。

### 怎么工作

```text
用户登录
  -> OIDC 身份进入 OAuth2 Proxy
  -> Istio 入口认证/授权
  -> Dashboard 选择 Profile
  -> Profile Controller 调和 Namespace 与 RBAC
  -> 用户在该 Namespace 创建 Notebook / Pipeline / Experiment / TrainJob
```

Profile 不是一层脱离 Kubernetes 的虚拟目录。它最终要通过 Namespace、RoleBinding、ServiceAccount、Istio AuthorizationPolicy 等对象生效。不同 KCD 版本中具体 controller 和 API 所属仓库可能迁移，因此升级时必须按 release migration 执行。

还要认识一个容易被 UI 掩盖的边界：Profile 提供的是以 Namespace 为中心的基础隔离，不会把所有组件数据自动变成强租户隔离。KFP 的 Pipeline definition 共享以及部分 ML Metadata（MLMD，机器学习元数据）读取仍有官方说明的多用户限制。生产环境应逐项验证“普通成员能否列出、读取、修改别的团队对象”，并用 NetworkPolicy、对象存储前缀/凭据、独立数据库授权和审计补齐边界。

### 怎么使用和观察

```bash
kubectl get profiles.kubeflow.org # 查看平台 Profile 列表
kubectl get profile PROFILE_NAME -o yaml # 查看 owner、成员和 status
kubectl get ns # 确认 Profile 对应 Namespace 是否存在
kubectl get rolebinding -n USER_NAMESPACE # 检查 Namespace 内授权
kubectl auth can-i create notebooks.kubeflow.org -n USER_NAMESPACE --as USER # 用目标身份验证权限
```

正常结果是 Profile、Namespace、RoleBinding 与用户身份一致。`kubectl auth can-i` 返回 `yes` 只证明某个 Kubernetes 动词被允许，不证明 Istio 入口、对象存储和组件 API 权限都正确。

### 坏了怎么查

1. 保存登录用户、请求时间、目标 Profile/Namespace 和 HTTP 状态码。
2. 区分 `401`（通常未认证）与 `403`（通常已认证但未授权）。
3. 查看 Profile `status`、Event、controller 日志和 RoleBinding subject。
4. 比较浏览器身份、SDK token 与本地 kubeconfig 身份，避免拿管理员 kubectl 结果证明普通用户可用。
5. 检查 Istio AuthorizationPolicy、OIDC issuer/audience、时间同步和反向代理 Header。

## 核心组件二：Notebooks 与 Workspaces

### 是什么

Kubeflow Notebooks 为 Jupyter 等交互式开发环境提供 controller 和 Web App。用户从页面选择镜像、CPU/GPU、PVC 和 PodDefault，平台创建 Notebook CR，再由 controller 创建 Pod、Service 和存储挂载。

### 为什么需要

Notebook 让数据科学家保留熟悉的交互体验，同时把资源、镜像、网络和身份纳入 Kubernetes 管理。它解决“手工 SSH 到 GPU 服务器、环境不可追踪”的一部分问题，但不会自动让 Notebook 代码可重复。

### 怎么工作

```text
用户提交 Notebook 表单
  -> Notebook CR
  -> Notebook Controller
  -> StatefulSet/Pod + Service + PVC
  -> PodDefault Webhook 注入环境、卷或 Secret
  -> Istio 路由到 Notebook Server
```

KCD `26.03.1` 的生产稳定路径仍包含 Notebooks v1 `1.11.0`。官方已公告 Notebooks v1 在 2026 年底进入 EOL；Workspaces/Notebooks v2 的 `2.0.0-alpha.3` 清单只适合评估，不应因为界面更新就当作生产 GA。

### 怎么使用和观察

```bash
kubectl get notebooks -n USER_NAMESPACE # 查看 Notebook CR
kubectl describe notebook NOTEBOOK -n USER_NAMESPACE # 查看 spec、status 和事件
kubectl get pod,pvc,svc -n USER_NAMESPACE # 沿着 CR 找执行 Pod、卷和服务
kubectl logs POD -n USER_NAMESPACE --all-containers # 查看 Notebook 与注入容器日志
kubectl get poddefault -n USER_NAMESPACE # 查看可能注入卷、Secret 或环境变量的规则
```

### 坏了怎么查

- 一直 Pending：查 PVC、资源 requests、GPU、taint/toleration、quota 和调度事件。
- 页面 404/503：查 Notebook Service、EndpointSlice、Istio VirtualService 和 Pod readiness。
- 环境变量没注入：查 PodDefault selector 与 Notebook Pod label。
- 重启后文件丢失：确认写入 PVC 挂载路径，而不是容器临时层。
- 镜像能拉但内核启动失败：查镜像契约、用户 UID、工作目录、依赖和启动日志。

## 核心组件三：Kubeflow Pipelines

### 是什么

Kubeflow Pipelines（KFP）把机器学习流程拆成有输入、输出和依赖关系的 Component，再把它们组成 Pipeline。KFP SDK 使用 Python DSL（Domain-Specific Language，领域专用语言）描述流程，Compiler 把它编译成 IR YAML；后端再创建实际任务。

### 为什么需要

手工按顺序运行脚本无法可靠回答：使用了什么参数、哪步失败、是否能重试、产物在哪里、旧结果能否缓存、谁触发了运行。Pipeline 把这些关系变成显式 DAG（Directed Acyclic Graph，有向无环图）。

### 怎么工作

KCD `26.03.1` 提供两种 Pipeline definition（定义）存储模式：

| 模式 | 定义放在哪里 | 优点 | 重点风险 |
|---|---|---|---|
| 传统数据库模式 | KFP 后端数据库 | 成熟路径、兼容现有 UI/API | 数据库迁移、备份和恢复必须单独设计 |
| Kubernetes Native API mode | `Pipeline`、`PipelineVersion` CR | 便于 kubectl/GitOps 与准入治理 | 需要 KFP 2.14+；CRD、Webhook、RBAC 和 etcd 容量进入故障链 |

一次运行的大致路径：

```text
pipeline.py
  -> KFP Compiler 静态类型检查
  -> IR YAML 或 Kubernetes Pipeline/PipelineVersion YAML
  -> KFP API / UI / kubectl 提交
  -> Run 元数据持久化
  -> Argo Workflow / Kubernetes 工作负载
  -> 每个 Component 对应一个或多个 Pod
  -> 参数通过小值契约传递
  -> Artifact 通过对象存储 URI 传递
  -> Pod 状态、日志、指标和制品信息回写
```

KCD `26.03.1` 的参考清单把 SeaweedFS 用作默认 S3-compatible artifact store（兼容 S3 API 的制品存储），并保留 `minio-service` 兼容入口。生产可以接企业对象存储，但必须同时验证 endpoint、TLS、凭据、bucket policy、生命周期和网络带宽。

### 参数与 Artifact 不能混

- Parameter 适合整数、浮点、字符串、布尔和小型结构化值。
- Artifact 适合数据集、模型、报告和其他大文件；Pipeline 在组件间传递元数据/URI，不把整个模型塞进 API 参数。
- 组件 Pod 不共享 Python 内存。上一步返回对象并不意味着下一步拿到同一内存对象。

### 缓存、重试和幂等

缓存命中依赖组件定义、输入和后端缓存语义。它不是“代码没变就一定复用”，也不能用于带外部副作用的步骤而不设计幂等键。

```text
危险例子
  -> 训练组件顺手覆盖 production/model.bin
  -> 重试或缓存让副作用与 Run 状态不一致

推荐思路
  -> 每次运行写不可变 URI
  -> 用 run_id / data_version / code_sha / image_digest 标识
  -> 评估通过后再由独立发布步骤更新生产别名
```

### 怎么使用和观察

```bash
python pipeline.py # 本地编译 Pipeline；正常生成 YAML
kfp dsl compile --py pipeline.py --output pipeline.yaml # 用 CLI 编译
kubectl get workflows -n USER_NAMESPACE # 在 Argo 模式查看实际 Workflow
kubectl get pods -n USER_NAMESPACE -l workflows.argoproj.io/workflow # 找到任务 Pod
kubectl logs POD -n USER_NAMESPACE --all-containers # 查看 launcher、main 等容器日志
```

具体 CR 名称与 label 随 KFP 存储模式变化。先执行 `kubectl api-resources | grep -i pipeline` 和 `kubectl get crd | grep -E 'pipeline|workflow'`，再使用所在版本真实存在的资源，不能照抄旧博客。

### 坏了怎么查

1. 编译失败：先查 Python 语法、KFP SDK 版本和组件 I/O 类型。
2. 提交失败：查 endpoint、认证 token、Namespace、RBAC、API 日志和 CRD。
3. Run 卡住：查 Workflow/Run condition、Pod Event、quota、PVC 和镜像。
4. 单步失败：查该 Component 的 main/launcher/init 容器，不要只看 UI 最后一行。
5. Artifact 缺失：查 URI、凭据、DNS、TLS、对象存储响应和 upload 完成标记。
6. UI 成功但模型不对：比较 run ID、参数、data version、image digest、artifact checksum 和发布记录。

## 核心组件四：Katib

### 是什么

Katib 是 Kubernetes-native AutoML 项目，主要提供 hyperparameter tuning（超参数优化）、early stopping（早停）和 NAS（Neural Architecture Search，神经架构搜索）。核心对象包括 Experiment、Suggestion、Trial 和 Metrics Collector。

### 为什么需要

人工试几个学习率既慢又难复盘。Katib 把搜索空间、目标指标、算法、并发 Trial 和停止规则声明化，让平台能追踪每次候选训练。

### 怎么工作

```text
Experiment spec
  -> Katib Controller
  -> Suggestion service 产生候选参数
  -> Trial Controller 创建 Job / TrainJob / 自定义模板
  -> Metrics Collector 读取 stdout、文件或其他指标源
  -> Objective 比较
  -> Early Stopping 决定是否终止
  -> optimalTrial / best parameters 写入 status
```

Katib 只会优化你提供的 objective（目标指标）。如果指标采集错、验证集泄漏或目标与业务价值不一致，它会更高效地找到“错误目标的最优解”。

### 怎么使用和观察

```bash
kubectl get experiments -A # 查看所有 Katib Experiment
kubectl describe experiment NAME -n NS # 查看算法、并发、Trial 和 condition
kubectl get trials -n NS # 查看候选任务
kubectl get suggestions -n NS # 查看建议服务对象
kubectl logs -n kubeflow-system deploy/katib-controller # 名称以实际发行版为准
```

### 坏了怎么查

- Experiment 不产生 Trial：查 Suggestion、controller、模板字段和准入错误。
- Trial 一直 Pending：查并发数、quota、GPU、PVC、镜像和调度。
- 指标始终空：查 Metrics Collector 注入、日志格式、指标名和 sidecar 权限。
- 搜索成本失控：暂停 Experiment，检查 maxTrialCount、parallelTrialCount、早停和每 Trial 资源。
- 最优结果不可复现：保存 seed、数据版本、镜像 digest、框架版本和实际 Trial spec。

## 核心组件五：Kubeflow Trainer v2

### 是什么

Kubeflow Trainer v2 使用 `TrainJob`、`TrainingRuntime`/`ClusterTrainingRuntime` 与 JobSet 等 Kubernetes 能力组织单机和多节点训练。Runtime 描述平台提供的执行模板；TrainJob 描述用户代码、节点数、资源和输入。

### 为什么需要

分布式训练不只是“多开几个 Pod”。各 worker 需要一致的 rendezvous（会合）、rank、网络、镜像、代码、数据、GPU 和失败语义。Trainer 把这些平台细节封装进可复用 Runtime。

### 怎么工作

```text
TrainJob
  -> Trainer Controller
  -> 选择 TrainingRuntime / ClusterTrainingRuntime
  -> JobSet 组织复制 Job
  -> PodGroup / Kueue 等调度集成（按部署选择）
  -> Worker Pod 启动框架分布式运行时
  -> checkpoint / model 写对象存储或 PVC
  -> JobSet / TrainJob status 收敛
```

Trainer v2 支持的 Runtime 与框架会继续演进。`PyTorchJob`、`TFJob`、`MPIJob` 等属于 Training Operator v1 旧 API；KCD `26.03.1` 的版本矩阵仍固定 v1 `1.9.2`，但默认 `example` 未启用这套旧控制器。它是迁移兼容选项，不代表默认已安装，也不代表新旧 CR 可以直接互换。

### 怎么使用和观察

```bash
kubectl get trainjobs -A # 查看 Trainer v2 任务
kubectl get trainingruntimes -A # 查看 Namespace Runtime
kubectl get clustertrainingruntimes # 查看集群级 Runtime
kubectl get jobsets -A # 沿 TrainJob 查 JobSet
kubectl get pods -n NS -l jobset.sigs.k8s.io/jobset-name=JOBSET # 查看 worker
kubectl logs POD -n NS --all-containers # 查看各 rank 日志
```

### 坏了怎么查

- 没有匹配 Runtime：查 `runtimeRef`、Namespace、label 和 Runtime condition。
- JobSet 没生成：查 Trainer controller 日志、CRD 版本和 admission。
- Worker 部分启动：查 gang scheduling、quota、GPU、拓扑和 PodGroup/Kueue 状态。
- NCCL timeout：查各 rank 日志、节点网络、MTU、防火墙、RDMA/NCCL 配置和某个 worker OOM。
- 重启后从头训练：查 checkpoint 周期、原子写入、共享存储可见性和 resume 参数。

## 核心组件六：Kubeflow Hub

### 是什么

Kubeflow Hub 是原 Model Registry 项目的新名称，组合两类能力：

- Model Registry：登记团队自己的模型、版本、Artifact 元数据和生命周期信息。
- Model Catalog：聚合外部目录元数据，提供只读发现、搜索和筛选。

### 为什么需要

共享目录里的 `model-final-v7-really-final.bin` 无法说明训练来源、评估、许可证和上线状态。Registry 用结构化对象把模型名、版本、格式、URI、指标和自定义属性关联起来。

### 怎么工作

```text
训练/评估完成
  -> 权重写入 s3://... / gs://... / pvc://...
  -> checksum、格式、指标、data/code/image 版本形成元数据
  -> Hub REST API / Python Client 登记
  -> 审批或发布系统选择特定 ModelVersion
  -> KServe 或其他服务按 URI 获取权重
```

Model Catalog 聚合 Hugging Face 或 YAML 等来源的元数据，但不替你保存远端模型权重。Registry 里的 Artifact URI 也只是指针；只有同时验证对象存在、checksum、权限和不可变策略，才能证明可恢复。

### 怎么使用和观察

```bash
kubectl get pod,svc,pvc -n kubeflow-system | grep -Ei 'hub|registry|catalog' # 名称按发行版核对
kubectl logs POD -n kubeflow-system --all-containers # 查看 Hub API/UI/数据库错误
curl -fsS http://HUB_API/health # 真实路径以当前 API 文档为准
```

### 坏了怎么查

- 能看到版本但下载失败：先查 Artifact URI、对象权限和 checksum，不要删 Registry 记录。
- API 500：查数据库连接、schema migration、磁盘和后端日志。
- Catalog 搜索无结果：查 source 配置、外部 API、限流、网络出口和同步时间。
- 发布了旧模型：比较 Registry version ID、URI、digest、部署 manifest 与 KServe 实际加载日志。

## 核心组件七：Spark Operator 与 KServe 集成

### Spark Operator

Spark Operator 把 SparkApplication 转成 Driver/Executor Pod。Kubeflow 负责平台入口与组合，不改变 Spark 的 DAG、Shuffle、Executor 内存和数据倾斜原理。

```bash
kubectl get sparkapplications -A # 查看 SparkApplication 状态
kubectl get pod -n NS -l spark-role=driver # 查看 Driver
kubectl logs DRIVER_POD -n NS # Driver 日志通常是首要证据
```

坏了先查 Driver Event/日志、ServiceAccount、对象存储、Executor requests、动态分配和 Shuffle，不要只重启 Operator。

### KServe

KServe 是独立治理的 Kubernetes 模型推理项目，在当前 Kubeflow 官方景观中属于 ecosystem integration。KCD `26.03.1` 的 reference example 固定并包含 KServe `0.18.0`、Models Web App 与所需依赖，因此用户可以从同一平台入口管理模型服务。

```text
InferenceService
  -> KServe Controller
  -> ServingRuntime / ClusterServingRuntime
  -> Storage Initializer 获取模型
  -> Predictor Pod 加载权重
  -> Service / Gateway 接收请求
  -> Revision / rollout / autoscaling（按部署模式）
```

KServe Ready 之前必须分别证明：CR condition、runtime 匹配、模型下载、容器 readiness、Service endpoint、Gateway/TLS 和真实推理响应。模型登记成功不等于推理加载成功。

## 一次完整训练和交付的数据流

```text
1. Git commit + data version + image digest
  -> 2. KFP 编译 Pipeline
  -> 3. KFP API 创建 Run
  -> 4. 数据准备 Component 生成 Dataset Artifact
  -> 5. Katib 可选地产生参数 Trial
  -> 6. Trainer 创建 JobSet 与 worker Pod
  -> 7. 框架读取数据并训练
  -> 8. checkpoint / model 写对象存储
  -> 9. 评估 Component 产生指标和报告
  -> 10. 门禁判断是否允许登记
  -> 11. Hub 登记 ModelVersion + Artifact URI + checksum
  -> 12. 发布系统创建/更新 InferenceService
  -> 13. KServe 拉取并加载特定模型
  -> 14. 真实流量、指标、日志和漂移回流
```

这个流程至少涉及四种 ID：Pipeline Run ID、Trial/TrainJob UID、Model Version ID 和 Deployment/InferenceService revision。AIOps 关联必须保存映射，不能只靠相似名称猜。

## 安装方式怎么选

| 需求 | 推荐起点 | 不要误解 |
|---|---|---|
| 只想学习 Pipeline DSL | 本地安装固定版 KFP SDK并编译 YAML | 不需要先安装完整 Kubeflow，也没有执行任务 |
| 已有 Kubernetes，只缺一个能力 | 独立安装 Pipelines、Katib、Trainer 等子项目 | 需要自己补身份、入口、存储、备份和集成测试 |
| 想学习完整社区组合 | 固定 KCD release tag，在一次性 Kind/Minikube 或测试集群安装 | reference distribution 不是生产自动 HA |
| 企业生产 | 评估 KCD overlay 或发行商 packaged distribution | 先看支持矩阵、SLA、升级、身份、GPU 和存储集成 |
| 只做模型 serving | 直接评估 KServe 或现有推理平台 | 不必为了一个 InferenceService 安装整套 Kubeflow |

Kubeflow Community Distribution 明确支持模块化选择。平台越大，故障域和升级耦合越多；“全部安装”不一定比“按需组合”更成熟。

## 安装前盘点

### 1. Kubernetes 与工具链

```bash
kubectl version # 同时记录 client/server；只有 client 不能证明集群兼容
kustomize version # KCD 26.03.1 清单对应 Kustomize 5.8.1
kubectl get nodes -o wide # 查看版本、架构、运行时和节点状态
kubectl get storageclass # 确认默认动态制备 StorageClass
kubectl get ingressclass,gatewayclass # 盘点现有入口，避免与 Istio/KServe 重复
```

KCD `26.03.1` release 强调了 Kind `0.32+` 与 Kubernetes `1.36` CI。其他 Kubernetes minor 或发行商平台必须以目标发行版自己的验证矩阵为准。

### 2. 最小资源不是生产容量

官方 `26.03.1` tag 的参考清单按组件 requests/实际使用粗算：

| 指标 | 参考清单合计 |
|---|---:|
| CPU | 约 `4380m`，即 4.38 核 |
| 内存 | 约 `12341Mi`，即约 12 GiB |
| PVC | 约 `65GB` |

官方对单命令实验建议至少 8 CPU、16 GB 内存；删减组件后可以在 2–4 CPU、4–8 GB 内存探索。这个数字只覆盖控制面/默认组件，不包含用户 Notebook、训练数据、GPU worker、模型权重、日志指标和备份。

### 3. 存储

至少回答：

- 默认 StorageClass 是否支持动态制备、扩容、快照和拓扑绑定。
- Notebook PVC、组件数据库与对象存储分别放在哪里。
- 对象存储 endpoint、bucket、TLS、KMS、生命周期和跨区带宽。
- 备份是否只保存 metadata，还是也保存 Artifact/权重。
- 恢复时 URI、DNS、凭据和 checksum 是否仍有效。

### 4. GPU 与节点

```bash
kubectl get nodes -L nvidia.com/gpu.present,node.kubernetes.io/instance-type # 标签以实际 GPU 方案为准
kubectl get daemonset -A | grep -Ei 'nvidia|device-plugin|gpu' # 查看驱动/device plugin 组件
kubectl describe node NODE # 检查 Allocatable GPU、taint 和已有分配
kubectl get resourcequota,limitrange -A # 查看租户资源边界
```

“节点装了显卡”不等于容器能请求 GPU。至少还需要宿主驱动、Container Toolkit、device plugin、兼容镜像、调度标签/taint 和框架 runtime 配套。

### 5. 身份、域名和证书

生产必须确定企业 OIDC issuer、client、redirect URI、group claim、session key、外部域名、TLS 证书和 service-to-service 身份。KCD 示例中的 `user@example.com` / `12341234` 只用于一次性实验，绝不能暴露到共享网络。

## KCD 26.03.1 一次性实验安装主线

下面只适用于可删除的学习集群。不要对现有生产集群直接执行。先固定 release，再阅读其 README；不要把 `master` 当稳定安装源。

```bash
git clone --depth 1 --branch 26.03.1 \
  https://github.com/kubeflow/community-distribution.git
cd community-distribution

git rev-parse HEAD # 26.03.1 应对应固定提交；保存输出作为证据
kustomize build example >/dev/null # 先做离线渲染，不能证明集群接受
```

官方单命令示例会反复执行 server-side apply，原因是 CRD 必须先建立，后续 CR 才能被 API Server 识别：

```bash
while ! kustomize build example \
  | kubectl apply --server-side --force-conflicts -f -; do
  echo "CRD 或依赖可能尚未就绪，20 秒后重试"
  sleep 20
done
```

这条命令方便实验，却有三个生产风险：

1. `--force-conflicts` 会接管字段所有权，必须先评审 Server-Side Apply managedFields。
2. 无限重试会掩盖永久错误；生产 Runbook 应设置次数、超时、日志和人工停止点。
3. 默认 example 包含示例账号、多个依赖和大量资源，不等于企业 overlay。

生产更适合把 upstream tag 当 base，用自己的 Kustomize overlay 修改域名、身份、存储、资源、安全策略和组件选择，并在 Git 中审计差异。

## 安装后不要只看 Pod Running

建议按层验收：

```bash
kubectl get crd | grep -Ei 'kubeflow|katib|pipeline|jobset|kserve|spark' # CRD 层
kubectl get pods -A # 进程与 readiness 层
kubectl get pvc -A # 持久化层
kubectl get validatingwebhookconfiguration,mutatingwebhookconfiguration # 准入层
kubectl get gateway,virtualservice,authorizationpolicy -A # 入口和授权层
kubectl get profiles -A # 租户层
kubectl get events -A --sort-by=.metadata.creationTimestamp # 最近故障证据
```

然后用普通用户完成：

1. 登录 Dashboard。
2. 打开自己的 Profile。
3. 创建 Notebook 并验证 PVC。
4. 编译、提交并运行一条最小 Pipeline。
5. 观察 Artifact 和日志。
6. 运行一个受配额限制的训练任务。
7. 登记模型 metadata。
8. 如果启用 KServe，再发送一条真实推理请求。

只有这条业务探针成功，才能说明核心链路可用。

## 常用对象、命令和 API 字典

| 名称 | 作用 | 常用写法 | 关键字段/结果 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `Profile` | 建立用户/团队空间 | `kubectl get profile -o yaml` | owner、plugins、status | 对应 Namespace/RBAC 已调和 | 把浏览器账号与 kubeconfig 管理员混用 |
| `Notebook` | 声明交互开发环境 | `kubectl describe notebook NAME -n NS` | image、resources、volume | Pod Ready、PVC 挂载、页面可达 | 数据写在临时层 |
| `PodDefault` | 按 selector 注入配置 | `kubectl get poddefault -n NS` | selector、env、volume | 目标 Pod 出现预期注入 | label 不匹配或 Secret 越权 |
| KFP Compiler | 编译 Pipeline DSL | `python pipeline.py` | IR YAML、类型检查 | 生成非空 YAML | 编译成功不等于后端运行成功 |
| `kfp.Client` | 调用 KFP API | `Client(host=..., existing_token=...)` | endpoint、token、namespace | 能列出/提交本租户 Run | 在代码里硬编码 cookie/token |
| `Experiment` | 声明 Katib 搜索 | `kubectl describe experiment NAME -n NS` | objective、algorithm、parallelTrialCount | Trial 产生并回写最佳参数 | 目标指标错或并发失控 |
| `TrainJob` | 声明 Trainer v2 训练 | `kubectl get trainjob -n NS -o yaml` | runtimeRef、trainer、resources | JobSet/worker 被创建 | 与旧 PyTorchJob 字段混用 |
| `ClusterTrainingRuntime` | 平台级训练模板 | `kubectl get clustertrainingruntime` | framework、template、plugins | 被 TrainJob 正确引用 | 给租户过度可配置权限 |
| `JobSet` | 管理一组协同 Job | `kubectl describe jobset NAME -n NS` | replicatedJobs、status | 所有工作组按语义完成 | 只看某一个 worker |
| Hub API | 登记模型元数据 | Python client / REST | model、version、artifact URI | 返回稳定 ID | 误以为数据库保存权重 |
| `InferenceService` | 声明模型服务 | `kubectl get isvc -n NS` | predictor、runtime、storageUri | Ready condition 为 True 且探针成功 | Ready 与真实模型语义不同 |
| `SparkApplication` | 声明 Spark 作业 | `kubectl describe sparkapplication` | driver、executor、deps | Driver/Executor 正常结束 | Operator 日志代替 Driver 日志 |
| `kubectl events` | 查看调度/挂载/拉镜像事件 | `kubectl events -n NS --for pod/NAME` | reason、note、time | 能建立失败时间线 | Event 有保留期，事故后才采集 |

## 配置详解：一份最小 Trainer v2 思维模型

下面 YAML 用来解释字段关系，不保证直接适配所有 Runtime。执行前先用 `kubectl explain trainjob --recursive` 和当前 Trainer 文档确认 API。

```yaml
apiVersion: trainer.kubeflow.org/v1alpha1
kind: TrainJob
metadata:
  name: aiops-train
  namespace: team-aiops # 任务只能访问该租户获授权资源
spec:
  runtimeRef:
    name: torch-distributed # 引用平台管理员维护的 Runtime
    kind: ClusterTrainingRuntime
  trainer:
    numNodes: 2 # 需要两个训练节点；资源不足时应整体等待而非半启动
    resourcesPerNode:
      requests:
        cpu: "4"
        memory: 16Gi
        nvidia.com/gpu: "1"
      limits:
        nvidia.com/gpu: "1"
```

关键点：

- `apiVersion` 仍可能处于 alpha；升级前必须检查 CRD conversion 和兼容性。
- `runtimeRef` 把平台模板与用户任务分开，便于统一镜像、网络和启动器。
- `numNodes` 会放大总资源：上例至少需要 8 CPU、32 GiB 内存和 2 GPU。
- 分布式任务通常需要 gang scheduling（成组调度）思维；只启动一半 worker 可能占资源却无法训练。
- 训练代码、数据 URI、checkpoint 和 Runtime 的具体表达要以当前 SDK/API 为准。

## 状态、一致性和“成功”的证据边界

### Kubernetes 对象状态

Controller 按 eventually consistent（最终收敛）方式工作：它观察 spec，创建下游对象，再把结果写入 status。API 返回创建成功只说明对象进入 etcd，不说明 controller 已处理。

排障时重点比较：

- `metadata.generation`：spec 被修改的代数。
- `status.observedGeneration`：controller 已处理到哪一代；具体字段以 CRD 为准。
- `conditions[].type/status/reason/message`：组件给出的结构化判断。
- `metadata.uid` 与 ownerReferences：确认下游对象属于哪次任务。
- `resourceVersion`：对象并发版本，不是业务模型版本。

### Pipeline 元数据和 Artifact 状态

```text
Run 状态成功
  -> 每个任务按后端语义完成

Artifact 可用
  -> 对象存在 + 上传完成 + checksum 正确 + 权限可读

模型可发布
  -> Artifact 可用 + 评估门禁 + 安全扫描 + 审批

模型已生效
  -> 推理 Pod 加载目标版本 + 真实请求命中 + 指标正常
```

这些状态不能互相替代。对象存储写入必须尽量使用不可变 key、临时对象 + 原子发布标记或 checksum；不要让多个 Run 并发覆盖同一个 `latest/model.bin`。

### Controller 重试与幂等

Kubernetes controller 可能重复 reconcile；Pipeline task 也可能因节点失败或重试策略重新运行。任何外部副作用都需要幂等键：

```text
idempotency_key
  = pipeline_run_id
  + component_name
  + input_data_version
  + code/image version
```

写数据库、发送工单、发布模型、删除对象等步骤应先查询现有结果，再决定创建、更新或跳过，并保存审计记录。

## 存储、数据库和备份

### 先分五类状态

| 状态 | 常见位置 | 丢失后影响 | 备份重点 |
|---|---|---|---|
| Kubernetes 声明 | etcd / GitOps repo | CR、RBAC、Service 等丢失 | etcd 备份 + Git 中的 overlay |
| 组件元数据 | MySQL/PostgreSQL 等 | Run、Experiment、ModelVersion 记录丢失 | 一致性快照、schema/version 记录 |
| Notebook 工作区 | PVC | 交互代码/临时数据丢失 | VolumeSnapshot 或文件级备份；鼓励代码进 Git |
| Pipeline/模型 Artifact | S3-compatible 对象存储 | 数据集、报告、权重不可恢复 | versioning、replication、checksum、生命周期 |
| 容器镜像 | Registry | 旧 Run/模型无法重建 | digest 固定、镜像复制、SBOM 与签名 |

备份成功不等于恢复成功。至少在隔离集群演练：恢复数据库、对象 bucket、Secrets/证书、Profile/RBAC、KFP Run 查询和一个已登记模型的加载。

### Hub Registry 不替代对象存储

Registry 备份只会保护模型关系和 URI。如果 `s3://models/team-a/model-17/weights` 已被生命周期规则删除，数据库恢复后仍只有一个失效指针。保留策略必须把 metadata 与 Artifact 同时纳入。

## GPU、队列与调度

### GPU 容量不等于卡数

至少关注：

- GPU 型号、显存和互联拓扑。
- MIG（Multi-Instance GPU）或 time-slicing 的隔离语义。
- 单任务 GPU 数与 gang scheduling。
- 数据加载、CPU、内存、网络和存储吞吐。
- GPU 驱动、CUDA、框架和容器镜像兼容。
- 租户 quota、PriorityClass、队列和抢占策略。

### Kueue 的位置

Kueue 可以为批处理/AI 工作负载提供队列、配额借用、公平共享和准入控制。它决定任务何时被允许占用资源，不替代 Kubernetes Scheduler 的节点选择，也不替代 Trainer 的分布式拓扑。

```text
TrainJob / JobSet
  -> Kueue admission：集群配额是否允许
  -> Kubernetes Scheduler：具体放到哪些 Node
  -> kubelet/device plugin：容器实际获得 GPU
```

任务 Pending 时必须区分：尚未被队列准入、已准入但节点资源不足、PVC 未绑定、镜像拉取失败、还是 admission webhook 拒绝。

## 高可用设计

Kubeflow 的 HA 是多个组件的组合，不是把 Dashboard replicas 改成 3：

| 层 | HA 重点 | 常见假象 |
|---|---|---|
| Kubernetes 控制面 | 多 API Server、etcd 多数派、跨故障域 | Node Ready 不代表 etcd 可写 |
| Controller | 多副本 + leader election、PDB、反亲和 | 多副本不等于多个同时调和同一对象 |
| API/UI | 多副本、Service、入口和 session 策略 | Dashboard 可开不代表后端 API 正常 |
| 数据库 | 外部 HA、备份、连接池、schema migration | Pod 重启后数据库数据仍可能损坏 |
| 对象存储 | 多副本/云服务、版本化、跨域恢复 | HTTP 200 不代表目标 Artifact 完整 |
| Notebook/PVC | 存储后端 HA、快照和挂载恢复 | StatefulSet 重建不等于用户文件恢复 |
| GPU 执行 | 跨节点容量、checkpoint、可重试语义 | Controller HA 不会让训练自动续跑 |
| 入口/身份 | 多副本、DNS/TLS、IdP 可用性 | 本地管理员 kubectl 正常不能证明用户可登录 |

训练任务的“高可用”通常是失败后从可靠 checkpoint 重建，而不是让同一 GPU kernel 跨节点无损漂移。Checkpoint 间隔要在存储开销与可接受重算时间之间取舍。

## 容量与性能

### 控制面容量

关注 API QPS、watch 数、CRD 对象量、Webhook 延迟、controller queue depth、数据库连接/事务、对象存储请求和 UI/API P99。大量 Katib Trial 与 Pipeline task 会同时放大 Kubernetes API 和遥测基数。

### 执行面容量

一个粗略并发估算：

```text
可并发训练数
  <= min(
       可用 GPU / 每训练 GPU,
       可用 CPU / 每训练 CPU,
       可用内存 / 每训练内存,
       存储吞吐 / 每训练读取吞吐,
       网络带宽 / 每训练通信带宽
     )
```

Katib 最坏资源需求还要乘以 `parallelTrialCount`。Pipeline 也可能并行展开多个 task。容量评审应以 N-1 节点/故障域压测为基线，不能用所有节点全健康时的理论卡数承诺 SLA。

### Pipeline 时长拆解

```text
总时长
  = 队列等待
  + Pod 调度/拉镜像
  + 数据读取
  + 计算
  + 分布式通信
  + Artifact 上传
  + 元数据回写
```

GPU utilization 低不一定是 GPU 问题；可能是队列、镜像、CPU preprocessing、对象存储、DataLoader、NCCL 或 upload 在等待。

## 安全边界

### 身份认证与授权分开

- OIDC/Dex/OAuth2 Proxy 回答“你是谁”。
- Kubernetes RBAC、Istio AuthorizationPolicy、对象存储 policy 回答“你能做什么”。
- 一个层面的管理员不能自动继承所有外部系统权限。

### Notebook 是高风险执行入口

Notebook 允许用户运行任意代码。生产要限制：

- 可选镜像来源和 digest。
- root、privileged、hostPath、hostNetwork、capabilities。
- ServiceAccount token 是否自动挂载。
- 网络出口和 metadata service。
- Secret/PVC 的跨租户访问。
- idle culling 只释放计算，不等于删除持久数据。

### Pipeline Component 也是供应链代码

每个 base image 和包安装都会进入生产执行面。应固定 digest、生成 SBOM、扫描漏洞、验证签名、限制私有包源并保存构建 provenance。不要让轻量 Component 每次运行都从公网浮动安装未固定依赖。

### Secret 不进入 Pipeline 参数和公开证据

Pipeline 参数、UI、日志和 YAML 可能被长期保存。密码、token、cookie、对象存储 key 和 kubeconfig 应通过 Secret、工作负载身份或外部 Secrets 系统注入，并对日志脱敏。

### 训练数据和模型同样不可信

模型文件可能包含危险反序列化内容；数据可能含隐私、投毒样本或恶意压缩包。加载前验证格式、来源、checksum、许可证和扫描结果；不要因为文件来自“内部 bucket”就直接反序列化。

## 可观测性：建立一条 Run 证据链

### Metrics

至少覆盖：

- KFP Run/task 成功率、时长、队列等待与重试。
- Katib Experiment/Trial 数、并发、失败率和搜索成本。
- TrainJob/JobSet phase、GPU utilization/显存、NCCL、checkpoint 时长。
- controller reconcile error、workqueue depth、Webhook 延迟。
- 数据库连接、查询 P99、磁盘与 replication。
- 对象存储请求错误、吞吐、延迟和容量。
- Notebook Pending/Running、PVC 和空闲时长。
- KServe request、P50/P95/P99、5xx、冷启动和模型加载。

### Logs

日志必须至少带或可关联：Namespace、Profile、run ID、task name、pod UID、TrainJob UID、model version、image digest 和 change ID。只按 Pod name 搜索会在重建后丢失上下文。

### Events 与 Conditions

Event 适合回答“调度、挂载、拉镜像为什么失败”，但有保留期；Condition 适合查看 controller 的结构化判断。事故采集器应在故障窗口主动保存，而不是一周后再查。

### Traces

Pipeline task 本身未必自动形成端到端 trace。可以在业务 Component、对象存储客户端和推理服务中传播 trace context，再把 KFP run/task ID 加入 span attribute，避免把控制器 trace 与模型推理 trace 混为一条天然链路。

### 告警设计

```text
高价值告警
  -> 大量 Run 同时失败且共享同一对象存储错误
  -> TrainJob 队列等待超过 SLO
  -> Webhook P99 升高并导致对象创建失败
  -> Artifact 上传失败但 task 被错误标记成功
  -> 模型加载失败或生产版本与审批版本不一致

低价值告警
  -> 单个短暂 Pod 重启，没有业务影响和持续条件
  -> 只看 Dashboard 进程存活
  -> 只看 GPU utilization 低，不区分等待阶段
```

## 基础实验：不装集群也能编译第一条 KFP Pipeline

### 实验目标

在隔离 Python 环境中固定安装 KFP SDK `2.16.1`，编写两个有类型契约的 Component，编译出 IR YAML，并保存版本与依赖证据。

这个实验只验证：

- KFP SDK 可以导入。
- DSL 可以构建 Pipeline。
- Compiler 可以生成 YAML。
- 参数类型进入 IR。

它不验证 KCD、KFP backend、Argo、Kubernetes、对象存储、GPU 或真实任务执行。

### 前置条件

- Python `>=3.9`，这是 `kfp==2.16.1` 包 metadata 给出的最低边界；该版本官方包分类器列到 Python 3.13。
- 能访问经过批准的 Python 包源。
- 至少约 500 MB 临时空间。
- 不在系统 Python 或生产 Notebook 中直接安装实验依赖。

本文编写环境使用 Windows、Python `3.14.5`；该组合实际安装和编译成功，只是超出已声明分类器范围的一次本机观察，不是官方支持承诺，更不证明所有插件和后端组合都兼容。

### 第 1 步：建立隔离环境

PowerShell：

```powershell
$lab = Join-Path $env:TEMP 'kubeflow-kfp-lab'
python -m venv $lab
& "$lab\Scripts\python.exe" -m pip install --upgrade pip
& "$lab\Scripts\python.exe" -m pip install "kfp==2.16.1"
& "$lab\Scripts\python.exe" -m pip check
```

Bash：

```bash
python3 -m venv /tmp/kubeflow-kfp-lab
/tmp/kubeflow-kfp-lab/bin/python -m pip install --upgrade pip
/tmp/kubeflow-kfp-lab/bin/python -m pip install 'kfp==2.16.1'
/tmp/kubeflow-kfp-lab/bin/python -m pip check
```

正常应看到 `No broken requirements found`。在受控项目中还要保存 `pip freeze`，因为 `kfp` 声明的部分传递依赖是版本范围，未来解析结果可能变化。

### 第 2 步：创建 `pipeline.py`

```python
from pathlib import Path

from kfp import compiler, dsl


@dsl.component(base_image="python:3.11-slim")
def normalize_alert_count(raw_count: int) -> int:
    """把负数告警数归零，模拟一个轻量数据清洗步骤。"""
    return max(raw_count, 0)


@dsl.component(base_image="python:3.11-slim")
def classify_risk(alert_count: int, threshold: int) -> str:
    """根据阈值输出风险等级。"""
    return "high" if alert_count >= threshold else "normal"


@dsl.pipeline(name="aiops-alert-risk")
def alert_risk_pipeline(raw_count: int = 12, threshold: int = 10) -> str:
    cleaned = normalize_alert_count(raw_count=raw_count)
    result = classify_risk(alert_count=cleaned.output, threshold=threshold)
    return result.output


output = Path(__file__).with_name("pipeline.yaml")
compiler.Compiler().compile(alert_risk_pipeline, package_path=str(output))
print(f"COMPILED={output}")
print(f"SIZE={output.stat().st_size}")
```

第一次出现的关键字段：

| 字段 | 人话含义 | 坏了先看 |
|---|---|---|
| `@dsl.component` | 把 Python 函数声明为可编译组件 | 函数源码是否可被 inspect、类型是否支持 |
| `base_image` | 将来执行该组件时的容器基础镜像 | tag 是否浮动、架构/依赖/安全是否匹配 |
| `@dsl.pipeline` | 声明组件之间的 DAG | 是否形成循环、必填参数是否传入 |
| `.output` | 上游组件的输出通道 | 与下游输入类型是否一致 |
| `package_path` | 编译产物路径 | 扩展名、写权限、目录是否存在 |

### 第 3 步：编译

PowerShell：

```powershell
& "$lab\Scripts\python.exe" .\pipeline.py
Select-String -Path .\pipeline.yaml -Pattern '^# PIPELINE DEFINITION','parameterType'
Get-FileHash .\pipeline.yaml -Algorithm SHA256
& "$lab\Scripts\python.exe" -m pip freeze | Set-Content .\requirements.lock.txt
```

Bash：

```bash
/tmp/kubeflow-kfp-lab/bin/python pipeline.py
grep -E '^# PIPELINE DEFINITION|parameterType' pipeline.yaml | head
sha256sum pipeline.yaml
/tmp/kubeflow-kfp-lab/bin/python -m pip freeze > requirements.lock.txt
```

### 真实运行结果

本文环境实际得到：

```text
PYTHON=3.14.5
KFP=2.16.1
No broken requirements found.
COMPILED=...\pipeline.yaml
SIZE=5023
```

生成 YAML 中包含：

```text
# PIPELINE DEFINITION
# Name: aiops-alert-risk
parameterType: NUMBER_INTEGER
parameterType: STRING
```

5023 字节只是本次依赖解析和脚本内容下的证据，不是跨环境必须相同的验收值。验收应要求文件非空、Pipeline 名正确、输入/输出类型存在，并把 hash 与 lock 文件一起保存。

### 第 4 步：理解“编译成功”以后还差什么

```text
pipeline.yaml 已生成
  -> 还没认证 KFP API
  -> 还没创建 Run
  -> 还没调度 Component Pod
  -> 还没拉取 base image
  -> 还没访问数据/对象存储
  -> 还没产生模型
```

在有授权的 KCD 集群中，下一步才是连接 API、提交到自己的 Profile Namespace，并观察 Run、Workflow/CR、Pod、Artifact 和日志。

### 如果没有成功，先查这些

1. `No matching distribution`：执行 `python --version`，确认正在使用虚拟环境和批准的包源。
2. `ModuleNotFoundError: kfp`：用同一个解释器执行 `-m pip`，不要混用系统 `pip`。
3. `OSError: could not get source code`：把组件定义保存到真实 `.py` 文件，不要在不支持 inspect 的交互方式中定义。
4. YAML 未生成：看完整 traceback、目录权限和 `package_path`。
5. 类型错误：不要关闭 type check 逃避，先修正组件 I/O 契约。

### 清理

确认学习证据已复制到个人实验仓库后，只删除自己创建的实验目录：

```powershell
Remove-Item -LiteralPath (Join-Path $env:TEMP 'kubeflow-kfp-lab') -Recurse -Force
```

```bash
rm -rf -- /tmp/kubeflow-kfp-lab
```

执行删除前打印并核对绝对路径，不能把空变量、用户主目录或仓库根目录作为递归删除目标。

## 故障注入实验：让组件类型契约不一致

### 实验目标

把上游输出故意声明为 `str`，下游输入声明为 `int`，观察 KFP 在创建任何集群任务前就拒绝这条 Pipeline；修复类型后用同一命令重新编译。

这是安全的 shift-left（左移）故障实验：错误停在本地编译阶段，不消耗 GPU，也不修改集群。

### 前置条件与回滚点

- 复用基础实验虚拟环境。
- 单独使用 `pipeline_type_fault.py`，不要覆盖已成功的 `pipeline.py`。
- 预期退出码非 0，且 `broken-pipeline.yaml` 不应存在。

### 第 1 步：创建错误版本

```python
from pathlib import Path

from kfp import compiler, dsl


@dsl.component(base_image="python:3.11-slim")
def read_alert_count() -> str:
    # 故意把数字声明为字符串输出。
    return "12"


@dsl.component(base_image="python:3.11-slim")
def classify_risk(alert_count: int) -> str:
    return "high" if alert_count >= 10 else "normal"


@dsl.pipeline(name="aiops-alert-risk-type-fault")
def broken_pipeline() -> str:
    source = read_alert_count()
    result = classify_risk(alert_count=source.output)
    return result.output


output = Path(__file__).with_name("broken-pipeline.yaml")
compiler.Compiler().compile(broken_pipeline, package_path=str(output))
```

### 第 2 步：运行并采证

PowerShell：

```powershell
& "$lab\Scripts\python.exe" .\pipeline_type_fault.py
$LASTEXITCODE # 预期为非 0
Test-Path .\broken-pipeline.yaml # 预期为 False
```

Bash：

```bash
/tmp/kubeflow-kfp-lab/bin/python pipeline_type_fault.py
echo $? # 预期为非 0
test ! -f broken-pipeline.yaml
```

本文实际错误：

```text
kfp.dsl.types.type_utils.InconsistentTypeException:
Incompatible argument passed to the input 'alert_count' of component
'classify-risk': Argument type 'STRING' is incompatible with the input
type 'NUMBER_INTEGER'
```

实际 `FAULT_EXIT=1`，`BROKEN_YAML_EXISTS=False`。证据说明编译器在组件连线阶段发现契约不一致，而不是等任务运行后再由 Python 比较运算报错。

### 第 3 步：形成和验证假设

假设：`read_alert_count.output` 的 KFP 参数类型是 `STRING`，而 `classify_risk.alert_count` 需要 `NUMBER_INTEGER`。

验证：错误消息同时列出上游实参类型和下游输入类型；不存在镜像拉取、网络、GPU 或对象存储证据，因此不应把根因猜成集群问题。

### 第 4 步：修复

把上游契约和实际返回值都改成整数：

```python
@dsl.component(base_image="python:3.11-slim")
def read_alert_count() -> int:
    return 12
```

然后把输出文件改为 `fixed-pipeline.yaml`，再次执行相同编译命令。

本文真实恢复结果：

```text
RECOVERED=...\fixed-pipeline.yaml
SIZE=4122
FIXED_EXIT=0
FIXED_YAML_EXISTS=True
```

### 第 5 步：复盘

- 不要用 `type_check=False` 把错误推迟到昂贵的集群运行阶段。
- 采集/解析层应尽早把字符串转换成经过验证的数字。
- 生产数据仍可能绕过静态类型检查，例如字符串内部是非法值；组件运行时还要做范围、空值、NaN 和 schema 校验。
- 把失败 traceback、修复 diff、成功 YAML 和依赖锁文件保存为 GitHub 证据。

## 可选集群故障模拟：TrainJob 引用了不存在的 Runtime

只在一次性、已安装 Trainer v2 的 Namespace 中做。先根据当前 CRD 生成一份能正常创建的最小 TrainJob，再把 `runtimeRef.name` 改成一个确认不存在的名字，例如 `missing-runtime-for-lab`。

```bash
kubectl get clustertrainingruntime # 先保存真实 Runtime 基线
kubectl apply -f trainjob-missing-runtime.yaml # 只提交到实验 Namespace
kubectl get trainjob aiops-runtime-fault -n kubeflow-lab -o yaml
kubectl get events -n kubeflow-lab --sort-by=.metadata.creationTimestamp
kubectl logs -n kubeflow-system deploy/kubeflow-trainer-controller-manager
```

预期：controller 无法解析 Runtime，TrainJob 不会进入正常训练路径；具体 Condition reason 以当前版本实际输出为准，不能在文章里编造固定字符串。

修复时把 `runtimeRef` 改回 `kubectl get clustertrainingruntime` 中已验证的名称，用同一 TrainJob UID/新 generation 观察收敛；实验后删除 TrainJob 和实验 Namespace。不要删除 ClusterTrainingRuntime、CRD 或 controller。

## 常见故障矩阵

| 现象 | 第一层证据 | 常见假设 | 不要先做 |
|---|---|---|---|
| Dashboard 401 | OIDC/OAuth2 Proxy 日志、cookie、issuer | 未认证、回调错误、token 过期 | 重装全部 Kubeflow |
| Dashboard 403 | 用户、Profile、RBAC、AuthorizationPolicy | 已登录但无目标资源权限 | 给用户 cluster-admin |
| 创建对象超时/x509 | Webhook、Certificate、Secret、Service endpoint | cert-manager/CA/服务异常 | 删除所有 webhook |
| Notebook Pending | Pod Event、PVC、quota、GPU | 存储未绑定或资源不足 | 反复删除 Pod |
| Notebook 页面 503 | Service/EndpointSlice/readiness/Istio | 后端未 Ready 或路由错误 | 只改浏览器代理 |
| Pipeline 编译失败 | Python traceback、SDK/lock、I/O 类型 | DSL/依赖/契约错误 | 关闭静态类型检查 |
| Pipeline Run 不创建 | KFP API、认证、Namespace、RBAC | endpoint/token/模式不一致 | 用管理员账号长期绕过 |
| Run 卡在 Pending | Workflow/CR condition、Pod Event | quota、队列、PVC、镜像 | 重启 KFP API |
| task 成功但 Artifact 缺失 | launcher 日志、对象 URI、checksum | 上传/权限/endpoint 错 | 手工把 Run 改成成功 |
| Katib 没有 Trial | Experiment status、Suggestion/controller | 算法/模板/控制器异常 | 扩大搜索空间 |
| Trial 没指标 | Metrics Collector、stdout 格式 | 指标名或注入错误 | 把空指标当 0 |
| TrainJob 一直等待 | Runtime、JobSet、Kueue、quota、PodGroup | 未准入/Runtime/GPU 不足 | 拆散 worker 强行启动 |
| 多机训练 hang | 各 rank 日志、节点网络、NCCL | 某 worker OOM/网络/拓扑 | 只重启 rank 0 |
| CUDA OOM | GPU 显存、batch、模型/optimizer 状态 | 容量估算不足/碎片 | 无限自动重试 |
| Hub 有记录但权重 404 | Artifact URI、bucket、checksum | metadata 与对象生命周期脱节 | 删除 ModelVersion 证据 |
| InferenceService 不 Ready | condition、storage initializer、predictor | runtime/模型下载/探针失败 | 直接切生产流量 |
| 升级后部分对象 404 | CRD/API discovery、controller 版本 | CRD/controller 顺序或 API 迁移 | 立即删除旧 CRD |

## 401 与 403：先区分身份和权限

### 401 排查

1. 记录 URL、回调路径、时间、浏览器和 response header。
2. 检查 OIDC issuer、client ID、redirect URI、TLS 和系统时间。
3. 查看 OAuth2 Proxy/Dex 或企业 IdP 日志。
4. 清理过期 session 前先保存失败证据；不要把 token 写进工单。

### 403 排查

1. 确认请求中的真实用户/ServiceAccount。
2. 核对 Profile、Namespace、RoleBinding 和 Istio AuthorizationPolicy。
3. 用目标身份执行 `kubectl auth can-i`，而不是管理员身份。
4. SDK 从集群外访问时，还要核对 token issuer/audience 与入口支持模式。

`401 -> 先认证`，`403 -> 先授权` 是方向，不是绝对根因。反向代理配置也可能把上游错误改写成不同状态码，因此还要对齐入口和后端日志。

## Webhook 故障：为什么整个集群都像“创建不了对象”

Kubeflow、cert-manager、KServe、Trainer 等都可能安装 admission webhook。API Server 创建资源时要调用 Webhook；如果 Service 无 endpoint、证书过期、CA bundle 不匹配或 Webhook 超时，用户会看到对象创建失败。

```bash
kubectl get validatingwebhookconfiguration,mutatingwebhookconfiguration
kubectl get certificate,certificaterequest -A
kubectl get svc,endpointslice -A | grep -Ei 'webhook|admission'
kubectl get events -A --sort-by=.metadata.creationTimestamp
```

修复前先定位准确 webhook name、目标 Service、证书 Secret 和影响资源。不要批量删除 Webhook；这会绕过校验/注入并扩大安全风险。

## Notebook Pending 排障回路

```text
Notebook CR 是否存在
  -> controller 是否创建 Pod
  -> Pod scheduler event
  -> PVC 是否 Bound
  -> ResourceQuota / LimitRange
  -> GPU/device plugin/taint
  -> image pull
  -> init/main container
  -> readiness / Service / Istio
```

常用命令：

```bash
kubectl describe notebook NAME -n NS
kubectl describe pod POD -n NS
kubectl get pvc -n NS -o wide
kubectl describe resourcequota -n NS
kubectl get events -n NS --sort-by=.metadata.creationTimestamp
```

如果 PVC Pending，先查 StorageClass、CSI controller/node、拓扑和容量；删除 Notebook Pod通常不会让一个没有后端卷的 PVC 自动变好。

## Pipeline 失败排障回路

### 先判断失败在哪个阶段

```text
编译
  -> API 认证/提交
  -> Run/Workflow/CR 创建
  -> Pod 调度
  -> init/launcher
  -> main container
  -> Artifact 上传
  -> metadata 回写
  -> UI 展示
```

每一层的修复不同。比如 `ImagePullBackOff` 应查 Registry，而不是修改 Python DSL；Artifact 403 应查对象存储身份，而不是给 Pod 更多 GPU。

### 结果不确定时不要盲目重提

API 超时可能发生在后端已经创建 Run 之后。客户端重试前先用 idempotency key、run name、request ID 或列表 API 查询现有 Run，避免重复训练和重复发布。

## Katib 成本与指标排障

Katib 事故往往不是 controller 宕机，而是配置“合法但危险”：

```text
maxTrialCount = 500
parallelTrialCount = 50
每个 Trial = 4 GPU
理论瞬时需求 = 200 GPU
```

审批门禁至少限制 Trial 总数、并发、每 Trial 资源、运行时长、Namespace quota 和队列。Metrics Collector 必须把“缺失”与真实数值 0 区分，避免错误目标污染最优结果。

## 分布式训练故障排障

### 一部分 worker Running，另一部分 Pending

这是典型成组资源不足。查 JobSet、Kueue admission、PodGroup、quota、节点 GPU 和拓扑。不要让已启动 worker 长时间占卡空等；使用成组调度或任务超时释放资源。

### NCCL timeout

收集每个 rank 同一时间窗口日志，并检查：

- 所有 worker 是否使用同一镜像和代码版本。
- rank/world size/master address 是否一致。
- 某个 Pod 是否 OOM、重启或被抢占。
- Node 间 MTU、端口、防火墙、RDMA/网卡选择。
- GPU/NCCL/驱动兼容和时钟。

只看 rank 0 的最后一行通常会把“另一个 worker 已先死”误判为网络根因。

### Checkpoint 恢复失败

检查 checkpoint 是否完整、写入是否原子、所有 worker 是否看见同一 URI、框架/模型/optimizer/world size 是否兼容。恢复测试必须真的从中断点继续若干 step 并比较 global step/loss，而不是只证明文件能打开。

## 模型登记与 serving 故障排障

```text
Hub ModelVersion
  -> Artifact URI / checksum
  -> 对象存储权限
  -> InferenceService spec
  -> ServingRuntime
  -> Storage Initializer
  -> Predictor readiness
  -> Gateway / Service
  -> 真实请求
```

如果新模型响应仍是旧结果，按顺序比较：ModelVersion ID、URI、对象 checksum、InferenceService generation、Pod image/model digest、加载日志、路由 revision 和响应 header。不要因为 Deployment rollout 完成就宣布模型已经切换。

## 证据优先 Runbook

### 1. 定义影响窗口

记录首个失败时间、最后成功时间、受影响 Profile/Namespace、组件、模型/Run/TrainJob ID、错误比例和业务影响。

### 2. 保存只读快照

```bash
kubectl get pods,pvc -n NS -o wide
kubectl get events -n NS --sort-by=.metadata.creationTimestamp
kubectl get trainjob,jobset,experiment,trial -n NS -o yaml
kubectl get workflow -n NS -o yaml # 仅在实际部署存在该资源时
kubectl get isvc -n NS -o yaml # 仅在启用 KServe 时
```

再保存相关 controller/API/worker 日志、KFP run metadata、Artifact head/checksum 和最近变更。

### 3. 建立多个假设

按“控制面、调度、执行、存储、身份、网络、数据/模型”分类，不要第一分钟就宣布根因。

### 4. 选择最小修复

优先暂停新 Run/Trial、降低并发、回滚单个 overlay/镜像、恢复凭据或扩容明确瓶颈。删除 CRD、数据库和 bucket 属于高风险动作，不是通用修复。

### 5. 用同一探针复验

修复前失败的同一个 Pipeline 参数、模型请求或训练最小 case必须在修复后成功。再观察队列、错误率、Artifact 与业务指标，防止只修绿 UI。

### 6. 沉淀证据

把事件时间线、假设、命令、修复、回滚点和验证写入 incident review，敏感信息脱敏后作为学习证据。

## 升级与回滚

### 升级前清单

- 固定源/目标 KCD tag 和 commit。
- 阅读 KCD、Dashboard、Notebooks、KFP、Trainer、Katib、Hub、KServe 的 release/migration notes。
- 导出 CRD、Profile、RBAC、Kustomize overlay 与 managedFields 基线。
- 备份组件数据库、对象存储、Notebook PVC、Secrets/证书和镜像。
- 盘点所有自定义 Pipeline、Runtime、PodDefault、Webhook、AuthorizationPolicy。
- 在隔离集群恢复备份并跑 golden pipelines（黄金流水线）。
- 设置停止阈值和回滚负责人。

### 推荐升级顺序

```text
一次性环境验证
  -> 公共依赖兼容性
  -> CRD / conversion / webhook
  -> controller / API
  -> 数据库 schema migration
  -> UI
  -> 少量测试租户
  -> Notebook / Pipeline / Katib / Trainer / Hub / KServe 探针
  -> 分批生产
```

具体顺序必须服从 release migration。比如 Dashboard 2.0 的仓库/组件迁移包含旧资源清理步骤，官方明确要求保留 Profile CRD 和 Namespace；照搬 `kubectl delete` 批量命令可能删除租户状态。

### Kustomize overlay 而不是改 upstream

```text
community-distribution@26.03.1
  -> overlays/company/base
  -> overlays/company/dev
  -> overlays/company/prod
```

这样升级时能把 base 引用改到新 tag，再审查 render diff。直接修改 clone 下来的 upstream 文件会让下一次升级难以区分官方变化和企业定制。

### `kubectl apply` 回滚边界

Kubernetes manifest 不是数据库事务：

- CRD schema 可能不支持旧 controller。
- 数据库 migration 可能不可逆。
- immutable field 可能要求删除并重建某个 Deployment。
- `apply` 不会自动删除新版本不再声明的旧对象。
- 对象存储和 Pipeline 运行中的副作用不会随 Git revert 消失。

因此“把 Git tag 改回去”只是回滚的一部分。过了不可逆 schema 门后，可能只能恢复备份或 forward-fix。

### Notebooks v1 与 v2

KCD `26.03.1` 公告给出的 v2 alpha 清单用于测试，Notebooks v1 则进入维护并计划在 2026 年底 EOL。平台应在隔离集群验证工作区、PVC、镜像、PodDefault、URL 和身份迁移；不能为了赶 EOL 把 alpha 直接推生产。

## AIOps 实战：用 Kubeflow 管理异常检测模型

### 一个受控闭环

```text
Prometheus / Log / Event 数据
  -> 数据快照并分配 data_version
  -> KFP 清洗与特征工程
  -> Katib 搜索参数（有预算）
  -> Trainer 训练并定期 checkpoint
  -> 评估：离线指标 + 稳定性 + 公平性/安全
  -> Hub 登记候选版本
  -> 人工/策略审批
  -> KServe 灰度
  -> 在线误报率、延迟、漂移监控
  -> 达到停止阈值则回滚
```

不要让“模型输出异常”直接触发高风险重启或扩缩容。先把模型结果作为证据候选，与规则、拓扑、变更、日志和人工审批组合。

### 告警自动富化字段

Runbook 可以自动附加：

- `profile`、`namespace`、`pipeline_run_id`、`task_name`。
- `experiment/trial/trainjob/jobset UID`。
- `data_version`、`code_sha`、`image_digest`。
- `model_version_id`、`artifact_uri` 的脱敏形式和 checksum。
- 最近 controller condition、Pod Event 和变更 ID。
- GPU/CPU/内存/队列/存储关键指标。

默认只读富化；重试训练、提高 quota、删除任务、切模型和回滚应经过审批、预算、幂等和审计。

### 异常检测边界

平台自身会产生季节性负载、批量提交和训练尖峰。模型要区分计划实验与未知异常，并监控 feature drift、concept drift、缺失数据和标签延迟。训练 Pipeline 成功不能作为模型质量唯一门禁。

## 与相邻技术怎么选

Kubeflow 很大，实际项目经常只需要其中一部分。先按问题选能力，再决定是否安装整套 KCD：

| 选择 | 更适合的场景 | 代价与边界 | 选择前必须回答 |
|---|---|---|---|
| Kubeflow vs 直接使用 Kubernetes | 多团队需要 Notebook、Pipeline、训练、模型登记和统一入口时选 Kubeflow；只有少量固定 Job 时可先用原生 Kubernetes | Kubeflow 带来更多 CRD、controller、数据库、对象存储、入口和升级工作 | 谁负责平台 SLO、升级、备份与多租户安全 |
| KFP vs Argo Workflows | 任务围绕 ML 参数、Artifact、缓存和 lineage 时优先 KFP；通用容器工作流可直接评估 Argo | KFP 后端可能使用 Argo 或原生 Kubernetes API，但 KFP 语义不等于 Argo YAML | 是否需要 ML 元数据、SDK 编译和模型谱系 |
| KFP vs Airflow | Kubernetes 原生 ML DAG 和容器任务更贴合 KFP；大量企业数据调度、时间依赖和既有 Operator 生态可能更贴合 Airflow | 两者都能编排，不应为了“统一”把所有任务硬塞进一个系统 | 调度中心是谁，跨系统失败与重试如何追踪 |
| Trainer v2 vs 原生 Job | 单机短任务可用 Job；多节点、可复用 Runtime、JobSet 和训练生命周期适合 Trainer | Trainer API 仍在演进，必须固定 CRD/controller 组合 | 分布式会合、gang、checkpoint 和失败重启由谁负责 |
| Katib vs 训练脚本内 Optuna | 需要 Kubernetes 级 Trial、资源隔离和统一 UI 时选 Katib；单机轻量搜索可在代码内完成 | 每个 Trial 都可能创建真实工作负载，搜索空间会迅速放大 GPU 成本 | 最大 Trial、并发、早停和预算上限是多少 |
| Hub vs MLflow Registry | 需要 Kubeflow/KServe 元数据衔接时评估 Hub；已有 MLflow Tracking/Registry 体系可继续以它为状态源 | Kubeflow 的 MLflow integration 仍是 experimental；双写会产生状态冲突 | 哪个系统是模型版本、审批和阶段的唯一事实源 |
| KServe vs 自建 Deployment | 多模型协议、模型加载、自动缩放和推理生命周期适合 KServe；极简固定服务可直接 Deployment | Standard 与 Knative 模式的入口、冷启动和缩放语义不同 | 延迟、scale-to-zero、GPU 常驻成本和回滚目标是什么 |

正确答案常常是“先独立安装 KFP 或 Trainer，再按业务增长补齐能力”，而不是第一天就部署整套平台。也不要把“组件能独立安装”误解成“身份、存储、观测和运维会自动完整”。

## 生产系统设计：20 个团队、200 名用户怎样落地

### 先定义目标而不是先画组件图

假设平台要支持 20 个团队、200 名用户、CPU Notebook、两类 GPU、每天约 1000 个 Pipeline task、分布式训练和在线推理。设计前先收集：

- Notebook/训练/推理的并发与峰值，不只收日均值。
- 两类 GPU 的型号、显存、MIG（Multi-Instance GPU，多实例 GPU）策略和任务可替代性。
- 数据量、Artifact 增长、保留期、跨区域流量与合规要求。
- Pipeline、训练和推理各自的 SLO（服务目标）、RPO（可接受数据丢失量）和 RTO（可接受恢复时间）。
- 失败任务能否重算、训练多久做一次 checkpoint、在线模型允许多久回滚。

### 推荐逻辑架构

```text
企业 OIDC / HTTPS Gateway
  -> Central Dashboard 与组件 API
  -> Profile / Namespace / RBAC / AuthorizationPolicy

Git + 镜像仓库 + 数据目录
  -> KFP 编排
  -> Katib 搜索（有并发和预算）
  -> Trainer v2 / Spark 执行
  -> Hub 登记元数据
  -> 人工或策略审批
  -> KServe 灰度与回滚

公共依赖
  -> 外部 HA SQL
  -> 版本化对象存储
  -> CSI 持久卷
  -> Prometheus / 日志 / Trace / Event
  -> Kueue 或其他经过验证的批调度层
```

### 节点池与调度

至少把 system、CPU Notebook、批训练、GPU 推理分成可独立扩缩和维护的节点池。用 label 表达硬件属性，用 taint/toleration 阻止普通任务误占 GPU，用 ResourceFlavor/ClusterQueue 表达不同 GPU 配额。分布式训练需要整组资源时启用经过验证的 gang admission；否则先启动的 worker 会占着卡等待未启动的同伴。

在线推理与离线训练不应无边界争抢同一批 GPU。可以用独立节点池、PriorityClass、队列配额和最大并发保护推理 SLO，但抢占前必须确认训练有可用 checkpoint；“提高优先级”可能终止别人几十小时的任务。

### 租户与安全

每个团队使用独立 Profile/Namespace，并配置：

- 最小 RBAC、独立 ServiceAccount 和短期身份凭据。
- ResourceQuota、LimitRange、默认请求/限制和 GPU 队列配额。
- 默认拒绝的 NetworkPolicy，再按数据源、镜像源和对象存储开通 egress。
- 独立对象存储前缀/凭据以及可审计的数据访问。
- 受控 Notebook 镜像、镜像签名/扫描、Pod Security 与高权限 Pod 审批。

Profile 只是起点。验收时要用普通成员身份做负向测试：列举别的团队 Pipeline、读取 Artifact、挂载 Secret、访问 Notebook URL、登记或发布模型都应按策略被拒绝。

### 状态、HA 与灾备

按状态源分别设计：

| 状态 | 生产策略 | 恢复验证 |
|---|---|---|
| Kubernetes/CRD | etcd 备份 + GitOps 清单 + CRD/version 清单 | controller 能重新调和，既有 CR 可读取 |
| KFP/Katib/Hub SQL | 外部 HA 数据库、PITR、schema 迁移备份 | 历史 Run/Trial/ModelVersion 可查询且关系正确 |
| Artifact/模型对象 | 版本化对象存储、跨故障域复制、生命周期规则 | 用记录的 URI 和 checksum 下载真实对象 |
| Notebook PVC/checkpoint | CSI 快照/备份、恢复演练和保留策略 | Notebook 文件可打开，训练可从 checkpoint 继续 |
| Secret/证书 | 加密、轮换、备份与最小恢复权限 | 入口、Webhook、对象存储和 SDK 身份均可验证 |

多副本 controller 只有在组件支持 leader election、共享状态和幂等调和时才叫 HA。把一个不支持并发写的 controller 副本数改成 3，可能制造重复执行。恢复验收必须至少跑一条真实 Pipeline、一次训练 checkpoint、一次模型登记和一次推理请求，不能只看 Pod 全绿。

### 容量验收

KCD 参考清单的静态资源求和约为 `4.38 CPU`、`12.341 GiB` 内存与 `65 GB` PVC，官方面向完整示例建议至少准备 `8 CPU / 16 GB` 级别资源；这些数字都不包含用户 Notebook、训练、Artifact、GPU 和生产冗余。容量模型应拆成：

```text
平台基线
+ 并发 Notebook request
+ Pipeline driver / launcher / task Pod
+ Katib 并发 Trial
+ Trainer 完整 worker 组
+ 推理常驻与峰值副本
+ 数据库、对象存储、网格和观测开销
+ 节点故障与升级余量
```

压测要记录排队时间、镜像拉取、Pod 启动、数据读取、训练、Artifact 上传、metadata commit 和回收各阶段，而不是只记录一个总时长。

## 生产事故推演：平台全绿，但新训练都排不上 GPU

### 现象与影响面

Dashboard、Trainer Controller、Kueue Controller 都是 Running；旧任务继续训练，新 TrainJob 长时间 Pending。先定义影响窗口、受影响 Namespace、TrainJob、请求 GPU 类型/数量和最近变更，不要直接宣布“GPU 坏了”或重启全集群。

### 按因果链取证

```bash
kubectl get trainjob TRAIN_JOB -n NS -o yaml
kubectl get jobset,workload -n NS -o yaml
kubectl get localqueue -n NS -o yaml
kubectl get clusterqueue,resourceflavor -o yaml
kubectl get pods -n NS -o wide
kubectl get events -n NS --sort-by=.metadata.creationTimestamp
kubectl get nodes -o custom-columns=NAME:.metadata.name,GPU:.status.allocatable.nvidia\\.com/gpu
kubectl describe node GPU_NODE
```

逐步验证：

1. TrainJob 是否已经生成 JobSet，还是卡在 Runtime/controller。
2. Kueue Workload 是否 admitted；Pending reason 是配额、ResourceFlavor、队列停止还是完整资源组不足。
3. Pod 请求的资源名、GPU 型号 label、MIG profile、nodeSelector 与 toleration 是否真实存在。
4. 节点 allocatable、device plugin Pod 和已分配 GPU 是否一致。
5. gang 所需完整资源是否被碎片化，而不是简单“总空闲卡数够”。
6. 最近是否改过 ClusterQueue、PriorityClass、Runtime、device plugin 或节点维护策略。

### 假设、最小修复与回滚

| 经证据确认的假设 | 最小修复 | 影响与回滚 |
|---|---|---|
| ClusterQueue 配额或 ResourceFlavor 写错 | 修正单个队列配置，先提交一条小任务 | 评估会瞬间放行多少任务；异常则恢复旧 GitOps 版本并暂停队列 |
| GPU 资源碎片导致 gang 无法满足 | 等待短任务结束或有计划地 cordon/drain 单个节点池 | drain 前确认 checkpoint，不能破坏在线推理 |
| device plugin 只在部分节点异常 | cordon 受影响节点并只修该 DaemonSet/驱动 | 记录节点范围；失败就恢复旧插件/驱动组合 |
| Runtime 请求不存在的资源名或型号 | 修 Runtime/TrainJob 并重新提交最小任务 | 旧任务保持暂停，不批量删除历史对象 |
| Katib/Pipeline 并发挤占队列 | 降低新 Trial/Run 并发 | 恢复前观察推理与关键队列 SLO |

### 恢复验收

不能以“Pod 创建了”为结束。要确认 Workload admitted、完整 worker 组进入 Running、GPU 指标合理、训练 step/loss 持续前进、checkpoint 能写入并可读取；再观察一个稳定窗口，最后解除变更冻结并补事故时间线。

## 面试回答：从 30 秒到架构追问

### 30 秒回答

Kubeflow 是一组运行在 Kubernetes 上的 AI 平台子项目，不是一个单体程序。它用 Profile/Namespace 管理工作空间，用 Notebooks 做交互开发，用 KFP 编排可重复流程，用 Katib 做参数搜索，用 Trainer 组织分布式训练，用 Hub 登记模型元数据，并可集成 KServe 上线推理。生产重点不是“把组件装绿”，而是管理版本组合、多租户、GPU 队列、数据库/Artifact 状态、可观测性和可恢复升级。

### 3 分钟回答

回答时按一条模型生命周期展开：代码和数据先形成版本；KFP SDK 把 Python DSL 编译成 IR，backend 创建 task Pod；参数走小型结构化值，Artifact 存对象存储，运行关系进 SQL/MLMD；Katib 可批量生成 Trial，Trainer v2 用 Runtime、TrainJob、JobSet 组织单机或分布式训练；模型权重先写存储，再由 Hub 登记 URI、checksum、指标和审批状态，最后交给 KServe 灰度。每一层都有独立成功条件，所以 UI 绿、Pod exit 0、Artifact 上传和生产切流不能混为一谈。架构上我会固定 KCD 版本矩阵，按 Profile/Namespace 做基础租户隔离，再补 RBAC、NetworkPolicy、Quota、对象存储权限和审计；用队列/gang 管 GPU；分别备份 etcd、SQL、对象存储、PVC 与 Secret；升级前做 CRD/数据库迁移和黄金流水线恢复演练。

### 递进问题与答题指导

#### 1. Kubeflow 和 Kubernetes 是什么关系

主线：Kubernetes 提供声明式 API、调度、网络和存储基础；Kubeflow 在其上增加面向 AI 生命周期的 CRD、controller、API 和 UI。
追问：只需要跑训练是否必须装 Kubeflow？不必须，原生 Job 或单独 Trainer 可能足够，选择取决于多团队复用、谱系、调度和运维需求。

#### 2. KCD 与 Kubeflow 是同一个版本吗

主线：KCD 是社区参考发行版，`26.03.1` 固定一组独立子项目版本。
追问：为什么不能把 KFP 单独升到 latest？因为 CRD、API、UI、数据库 schema、认证和公共依赖是组合验证的；越过矩阵要自己承担集成测试与回滚。

#### 3. Profile 是否实现了完全多租户

主线：Profile 把工作空间映射为 Namespace、RBAC 与 Istio 策略，是基础边界，不是绝对安全容器。
追问：怎么验收？用普通成员做跨 Namespace、KFP definition/metadata、对象存储、Secret 和 URL 的正负向测试，并审计实际请求身份。

#### 4. KFP 从 Python 到 Pod 经历什么

主线：DSL 构 DAG，Compiler 生成 IR YAML，上传后 backend 持久化并转换成运行对象，controller 创建 task Pod，Artifact 和 metadata 分别落存储。
追问：本地 compile 成功证明什么？只证明 DSL、类型和 IR 生成，不证明认证、调度、镜像、数据、存储和业务逻辑。

#### 5. Parameter、Artifact 和 Metadata 有什么区别

主线：Parameter 是小型结构化值；Artifact 是带 URI 的大对象；Metadata 记录运行、版本和关系。
追问：为什么不能把模型塞进 Parameter？大小、序列化、安全、缓存和谱系都不合适，应把权重放对象存储并传受控引用。

#### 6. Pipeline task 容器 exit 0 为什么仍可能失败

主线：用户代码退出、launcher/driver、Artifact 上传和 metadata commit 是不同阶段。
追问：先查什么？固定 run/task/Pod UID 和时间，查所有容器日志、task condition、对象 URI/checksum 与 SQL/MLMD 记录。

#### 7. Trainer v2 相比 Training Operator v1 改了什么

主线：v2 用统一 TrainJob + Runtime 模板 + JobSet，减少每个框架一个顶层 CRD 的分裂。
追问：代价是什么？API 和 Runtime 仍演进，旧 PyTorchJob/TFJob/MPIJob 不能直接替换，迁移要做 CRD、语义和恢复测试。

#### 8. 分布式训练为什么需要 gang scheduling

主线：所有 worker 通常需要同时获得资源；部分启动会占卡空等甚至超时。
追问：总空闲 GPU 足够为什么仍 Pending？型号、拓扑、MIG、配额与碎片可能使完整资源组无法同时满足。

#### 9. Katib 怎样避免烧光预算

主线：限定搜索空间、maxTrialCount、parallelTrialCount、单 Trial 资源、超时和早停。
追问：Experiment 一直 Running 怎么查？看 condition、Trial、Suggestion、metrics collector、目标指标格式、失败上限和数据库。

#### 10. Hub 是否保存模型权重

主线：Hub/Registry 主要保存模型与版本元数据以及 Artifact URI；真实权重通常在对象存储。
追问：灾备只备份数据库够吗？不够，还要备份对象、checksum、凭据和 URI 对应关系，并实际下载验证。

#### 11. KServe Standard 与 Knative 怎么选

主线：Standard 更贴近 Deployment/Gateway/HPA；Knative 提供 revision 与 scale-to-zero，但依赖和冷启动更复杂。
追问：GPU 模型适合 scale-to-zero 吗？取决于加载时间、显存成本和延迟 SLO，不能只追求省卡。

#### 12. 怎样升级和回滚 Kubeflow

主线：固定源/目标矩阵，先备份并恢复验证，再处理 CRD/webhook/controller、数据库 schema、UI 与租户，分批跑黄金流水线。
追问：为什么 Git revert 不够？CRD/schema、不可变字段、数据库 migration、对象存储副作用和运行中的任务不会随清单回退自动撤销。

## 分阶段学习路线

### 第 1 阶段：先建立全景

- 能说清 Kubeflow、KCD、子项目、KServe 与商业发行版的边界。
- 画出登录、Profile、Notebook、Pipeline、Trainer、Hub、KServe 的数据流。
- 认识 CRD、controller、Namespace、Artifact、checkpoint 与 model registry。

### 第 2 阶段：做可复现实验

- 在隔离环境固定 `kfp==2.16.1`，编译 Pipeline 并保存 lock/hash。
- 制造 `str -> int` 类型错误，保留失败证据、修复 diff 与恢复结果。
- 有一次性集群后再做 Notebook 拉取失败或错误 Runtime 故障，并完整清理。

### 第 3 阶段：掌握生产链路

- 按 Profile、RBAC、NetworkPolicy、Quota 与存储凭据验证多租户。
- 跟踪一次 Run 的 CR、Pod、日志、Artifact 与 metadata。
- 练习 GPU 排队、部分 worker Pending、Artifact 丢失与 KServe 503 的证据链。

### 第 4 阶段：做到面试和设计深度

- 能估算平台基线、Notebook、Trial、worker、推理和故障余量。
- 能解释状态源、HA、灾备、不可逆迁移与回滚停止门。
- 用明确事实、假设、验证、修复、影响面和恢复验收回答事故题。

## 学习完成检查表

- [ ] 我能用一句话解释 Kubeflow，并说明它不是单体软件。
- [ ] 我能区分 KCD 固定版本与上游 latest，不会混装组件。
- [ ] 我能解释 Profile/Namespace 的作用和多租户限制。
- [ ] 我能画出 KFP 从 Python DSL、IR、backend 到 task Pod 的路径。
- [ ] 我能区分 Parameter、Artifact、metadata 与 model registry。
- [ ] 我完成了 KFP 编译实验，并保存版本、lock、hash 和预期输出。
- [ ] 我完成了类型故障注入、修复与清理，没有关闭类型检查逃避问题。
- [ ] 我能沿 TrainJob、JobSet、Workload、Pod 排查 GPU Pending。
- [ ] 我能说明 Katib 的成本控制和 Trainer v2 的 Runtime 模型。
- [ ] 我能区分 Hub 的元数据与对象存储中的模型权重。
- [ ] 我能解释高可用副本、状态备份和业务恢复验收的区别。
- [ ] 我能设计一次有停止门、回滚点和黄金流水线的升级。
- [ ] 我能把 Kubeflow 指标、日志、事件、Trace 和模型谱系接进 AIOps。
- [ ] 我能回答至少一个生产设计题和一个事故题的递进追问。

## GitHub 学习证据怎么提交

建议在个人实验仓库保存下面这些脱敏材料：

```text
kubeflow-lab/
  README.md                    # 环境、目标、边界与复现步骤
  versions.md                  # KCD/KFP/Python/Kubernetes 核验日期
  pipeline.py                  # 基础 Pipeline 源码
  pipeline.yaml                # 编译后的 IR
  requirements.lock.txt        # 本次实际依赖解析结果
  pipeline.sha256              # 产物 hash
  fault/bad_pipeline.py        # 类型故障
  fault/stderr.txt             # 脱敏错误证据
  fault/fix.diff               # 修复前后变化
  diagrams/data-flow.md        # 控制面、执行面、数据面
  runbooks/gpu-pending.md      # 证据、假设、修复、回滚与验收
  cluster/                     # 有集群后再添加 Profile/Quota/Runtime 示例
  screenshots/                # Dashboard/Run 图，去掉 token、域名和业务数据
```

README 至少记录精确命令、预期与实际结果、没有验证的部分、清理结果和敏感信息处理。不要提交 kubeconfig、token、Secret、对象存储密钥、内部域名、真实数据或受限模型权重。截图不是唯一证据；YAML、版本、hash、日志片段和恢复结果更容易复核。

## 本文验证边界

本文不是把静态文档包装成生产实战。当前实际完成的验证是：

- 在 Windows、Python `3.14.5` 的临时虚拟环境安装 `kfp==2.16.1`，`pip check` 无依赖破损。
- 实际编译 `aiops-alert-risk`，得到 5023 字节 IR YAML；SHA256 为 `9CE84797F7CA5E814E6A8A127D5707416775E301062C982949E6A2089FEF87C7`。
- 实际注入 `STRING -> NUMBER_INTEGER` 类型不匹配，进程以非零状态失败且没有可交付错误 YAML；修复后编译成功，产物 4122 字节，SHA256 为 `757713E853879DE8D739081E72B3D6CF5EC01B239C1E5980B156053D57F7C46E`。
- 固定 KCD `26.03.1` tag、commit `f09f3eeaa25cc852665f460497a42b7fc68639ac`，使用 kubectl 内置 Kustomize `5.8.1` 静态渲染 `example` 成功；输出约 273,716 行并包含 79 个 CRD。这只证明清单能在本地构建，不证明 Kubernetes API 接受或任何 Pod Ready。

本机 Docker daemon 当前不可用，也没有一次性 Kubernetes 集群，因此没有安装 KCD，没有运行 Notebook、KFP backend、Katib、Trainer、Hub、Spark、KServe、GPU/NCCL/MPI，也没有做 HA、压测、备份恢复和生产升级。Python 3.14 的成功只是本机观察，不能替代官方支持范围。以后补做集群实验时，应把命令、UID、时间、状态、清理和恢复证据追加到个人实验仓库，而不是改写历史结果。

学完本文，你应当能完成从零到实践、排障和架构讨论的主线；但强平台/SRE/DevOps/AIOps 面试仍会继续考察 Linux、网络、Kubernetes、Python、机器学习基础、系统设计、编码、项目经历和沟通，不能靠背一篇文章替代这些训练。
