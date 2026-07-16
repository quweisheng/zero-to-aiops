# Harbor 深讲

> 学习目标：从零理解 Harbor 为什么不只是一个 Docker Registry，掌握 Project、Repository、Artifact、Tag、Robot Account、扫描、复制、保留、垃圾回收和高可用边界，并能完成一次 Helm Chart 离线渲染实验。

## 官方资料

- [Harbor 文档](https://goharbor.io/docs/)
- [安装与配置](https://goharbor.io/docs/main/install-config/)
- [使用 Harbor](https://goharbor.io/docs/main/working-with-projects/)
- [漏洞扫描](https://goharbor.io/docs/main/administration/vulnerability-scanning/)
- [复制](https://goharbor.io/docs/main/administration/configuring-replication/)
- [Harbor Helm Chart](https://github.com/goharbor/harbor-helm)

说明：Harbor 的 Chart、数据库、Redis、Scanner、对象存储和 Kubernetes 版本需要按发行说明核对。示例使用虚构域名，不是生产部署参数。

## 官方知识地图

```text
client / CI / Kubernetes
  -> Harbor portal and registry API
  -> project / repository / artifact / tag
  -> authentication / robot account / RBAC
  -> scanning / signing / replication / retention
  -> registry storage / database / Redis / job service
```

学习顺序：先懂 OCI Artifact，再学 push/pull、权限、扫描、复制、清理，最后接入 Kubernetes 与 CI/CD。

## 场景开场

Kubernetes 发布突然出现 `ImagePullBackOff`。镜像在开发电脑能拉取，但生产节点访问 Harbor 超时；同时 Harbor 数据盘接近满，旧 Tag 数量激增。排障不能只重启 Pod，必须检查凭据、DNS/TLS、Registry、存储和清理任务。

## 一句话人话版

Harbor 是企业 OCI 制品仓库：它保存和分发容器镜像等制品，并提供项目权限、机器人账号、扫描、复制、保留与审计。

## 小白可能会问

- Harbor 与 Docker Registry 有什么区别？
- Repository、Artifact、Tag 和 Digest 是什么关系？
- 删除 Tag 后为什么磁盘空间没有马上回来？
- 漏洞扫描通过是否代表镜像绝对安全？
- Kubernetes 为什么需要 `imagePullSecret`？

## 为什么要学

岗位点名 Harbor。它是源码构建到 Kubernetes 发布之间的软件供应链节点，也是 AIOps 关联提交、镜像 Digest、部署、漏洞和故障的关键数据源。

## Harbor 是什么

Harbor 基于 OCI Distribution 能力提供企业管理层。它可以保存容器镜像及其他 OCI Artifact，但不是源码仓库，也不是运行容器的平台。

## 它解决什么问题

- 内部镜像统一存储和分发。
- 项目与角色隔离。
- CI 使用 Robot Account 自动推送。
- 镜像漏洞扫描和拉取策略。
- 跨站点/仓库复制。
- Tag 保留、不可变和垃圾回收。
- 审计谁在何时推送、拉取或删除制品。

## 核心原理

### Artifact、Tag 与 Digest

**是什么**：Artifact 是制品；Tag 是可读别名；Digest 是内容哈希身份。

**为什么需要**：Tag 可以移动，Digest 才能精确证明部署了哪份内容。

**怎么工作**：Manifest 引用配置和 Layer，Registry 按内容摘要保存并复用 Blob。

**怎么看/怎么用**：发布记录同时保存 Project、Repository、Tag 和 Digest。

**坏了怎么查**：对比 Kubernetes 实际 Image ID、Harbor Digest 和 CI 输出，避免只比较 `latest`。

### Project、RBAC 与 Robot Account

**是什么**：Project 是权限与策略边界；Robot Account 是自动化身份。

**为什么需要**：人和流水线不能共享管理员账号。

**怎么工作**：用户/机器人获得项目角色，Registry 请求经认证授权后访问 Repository。

**怎么看/怎么用**：审计成员、Robot 权限、到期时间、Token 轮换和拉取范围。

**坏了怎么查**：区分未认证、无权限、凭据到期、Project 私有和 Repository 路径错误。

### 扫描、签名与策略

**是什么**：Scanner 分析已知漏洞；签名/证明用于验证来源和完整性；策略决定是否允许拉取或发布。

**为什么需要**：能构建镜像不代表镜像可信或没有已知高危漏洞。

**怎么工作**：Job Service 调度扫描，Scanner 返回报告，Harbor 保存摘要并用于策略判断。

**怎么看/怎么用**：记录扫描时间、数据库版本、严重级别、例外、Digest 和签名状态。

**坏了怎么查**：Scanner 离线、漏洞库过旧或任务失败时，不能把“无报告”当成“无漏洞”。

### 复制、保留与垃圾回收

**是什么**：复制同步制品；保留策略选择要保留的 Tag/Artifact；垃圾回收清除不再引用的 Blob。

**为什么需要**：多站点可用性和容量治理不能靠手工删除。

**怎么工作**：Replication Job 按规则传输；删除先解除引用，GC 再回收底层存储。

**怎么看/怎么用**：监控复制延迟/失败、保留预演、删除审计、GC 任务和存储增长。

**坏了怎么查**：先暂停危险删除，检查引用、只读窗口、任务队列、后端存储和目标端权限。

## 架构和数据流

```text
git commit
  -> CI build
  -> image tag and digest
  -> Harbor registry API
  -> project policy / scan / storage
  -> Kubernetes image pull
  -> running Pod image ID
```

Harbor 常见组件包括 Portal、Core、Registry、Job Service、Database、Redis、Scanner 和后端存储。高可用必须覆盖状态组件与存储，不是简单把 Portal 扩成多个副本。

## 安装与启动

常见方式：离线/在线安装包配合 Docker Compose，或在 Kubernetes 上使用官方 Helm Chart。生产前确认：

- FQDN、TLS、反向代理和客户端信任链。
- 外部 PostgreSQL/Redis 或 Chart 内置组件的可用性。
- 文件系统或对象存储容量、性能、备份和恢复。
- Scanner、镜像签名、复制和保留策略。
- Registry 高可用、负载均衡和上传大小限制。
- 与 Kubernetes container runtime 的证书信任。

## 配置详解

```yaml
expose:
  type: ingress                 # 通过 Kubernetes Ingress 暴露 Harbor
externalURL: https://harbor.lab.local # 客户端实际访问的虚构实验地址
persistence:
  enabled: true                # 制品和状态必须持久化
trivy:
  enabled: true                # 启用示例漏洞扫描器，生产需核对资源与更新源
```

| 配置 | 含义 | 常见坑 |
|---|---|---|
| `externalURL` | Harbor 对外身份 | 与证书、Ingress 地址不一致 |
| persistence | Registry/数据库等持久化 | 所有组件共用脆弱单盘 |
| scanner | 扫描适配器 | 漏洞库无法更新仍显示旧结果 |
| proxy | 外网访问 | 漏掉内部仓库和集群网段 |

## 命令字典

| 命令 | 作用 | 正常结果 | 常见坑 |
|---|---|---|---|
| `docker login harbor.lab.local` | 登录 Registry | Login Succeeded | 使用管理员账号给流水线 |
| `docker push harbor.lab.local/demo/app:1.0` | 推送镜像 | 返回 Digest | 只记 Tag 不记 Digest |
| `docker pull harbor.lab.local/demo/app@sha256:...` | 按 Digest 拉取 | 内容固定 | Digest 来自错误仓库 |
| `helm list -n harbor` | 查看 Helm Release | 状态 deployed | 忽略 Hook/Job 失败 |
| `kubectl -n harbor get pods,pvc` | 查看组件与存储 | Ready 且 PVC Bound | 只看 Portal Pod |

## 在 AIOps 中的作用

采集 API/Registry 可用性、Push/Pull 延迟、5xx、项目/制品数、存储增长、扫描新鲜度、严重漏洞、复制失败、Job 队列、证书到期和 GC 状态。把 `commit -> CI run -> image digest -> deployment -> Pod image ID` 串成变更拓扑。

自动化可生成过期 Tag 和大仓库报告；删除、GC、复制方向调整、Project 删除和漏洞豁免必须审批并先预演。

## 入门实验：离线渲染 Harbor Helm Chart

### 实验目标

不创建集群资源，只验证官方 Chart 能按虚构域名和持久化配置生成清单。

### 实验步骤

```powershell
helm repo add harbor https://helm.goharbor.io # 添加 Harbor 官方 Helm 仓库
helm repo update                              # 更新 Chart 索引
helm show chart harbor/harbor                 # 查看当前 Chart 元数据
helm template harbor harbor/harbor `          # 只进行本地渲染
  --namespace harbor `                        # 指定实验命名空间
  --set externalURL=https://harbor.lab.local `# 设置虚构对外地址
  --set expose.type=clusterIP > harbor-rendered.yaml # 不创建真实外部入口
Select-String harbor-rendered.yaml -Pattern 'harbor.lab.local|PersistentVolumeClaim' # 验证结果
```

### 验证结果

命令退出码为 0，YAML 中能找到虚构域名和 Harbor 组件。渲染成功不代表存储、TLS、数据库和高可用已设计完成。

### 如果没有成功

检查 Helm、官方仓库网络、代理/CA、Chart 名称和 PowerShell 续行符位置。

## 常见故障排查

### ImagePullBackOff

先看 Pod Event，再检查镜像路径/Tag/Digest、`imagePullSecret`、Robot 权限、DNS、TLS、节点到 Harbor 网络和 Registry 日志。

### Push 返回 413/5xx

检查 Ingress/代理上传限制、Core/Registry、后端存储、磁盘空间、Job Service 和超时。

### 删除 Tag 后容量不降

确认 Artifact 是否仍被其他 Tag 引用、保留策略与软删除状态，再按版本文档安排 GC。不要在未备份时直接清理存储目录。

### 扫描长期 Pending

检查 Scanner Pod、漏洞库、网络出口、Job 队列、Redis、资源限制和 Harbor 版本兼容。

### 复制失败

检查源/目标凭据、项目、网络、TLS、目标容量、过滤规则和任务日志，确认复制方向没有写反。

## 面试怎么讲

Harbor 是 OCI 制品仓库，核心对象是 Project、Repository、Artifact、Tag 和 Digest。CI 用最小权限 Robot Account 推送，Kubernetes 按 Digest 拉取。扫描结果必须包含扫描时间和漏洞库新鲜度；Tag 删除后还要经过引用判断和 GC 才可能释放存储。排障按客户端、认证授权、Core/Registry、Job、数据库/Redis 和后端存储逐层进行。

## 学习检查清单

- [ ] 我能解释 Tag 与 Digest 的区别。
- [ ] 我能设计 Project 和 Robot Account 权限。
- [ ] 我能解释扫描、复制、保留和 GC。
- [ ] 我能完成 Helm 离线渲染。
- [ ] 我能排查拉取、推送、扫描和容量问题。

## 面试题

1. Harbor 与普通 Registry 的区别是什么？
2. 为什么生产发布应记录 Digest？
3. Robot Account 如何最小授权？
4. 删除 Tag 为什么不立即释放空间？
5. 扫描无漏洞为何不等于绝对安全？
6. Harbor 高可用要保护哪些有状态组件？
7. 如何把 Harbor 数据接入 AIOps？

## 学习证据

- `labs/harbor/artifact-model.md`
- `labs/harbor/harbor-rendered.yaml`
- `labs/harbor/image-traceability.md`
- `labs/harbor/retention-gc-runbook.md`
- `labs/harbor/image-pull-failure.md`

公开仓库不要提交 Robot Secret、真实仓库地址、漏洞豁免、客户镜像名、证书私钥和数据库备份。

## 本文边界与下一步

本文覆盖岗位所需 Harbor 主线。下一步在授权环境完成 Project、Robot、镜像 Push/Pull、扫描、不可变 Tag、复制、保留预演、GC 和恢复演练。
