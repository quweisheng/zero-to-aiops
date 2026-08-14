# Harbor 深讲

> 学习目标：从零理解 Harbor 为什么不只是一个 Docker Registry，掌握 Project、Repository、Artifact、Tag、Robot Account、扫描、复制、保留、垃圾回收和高可用边界，并能完成一次 Helm Chart 离线渲染实验。

## 官方资料

- [Harbor 2.15 文档](https://goharbor.io/docs/2.15.0/)
- [安装与配置](https://goharbor.io/docs/2.15.0/install-config/)
- [使用 Harbor](https://goharbor.io/docs/2.15.0/working-with-projects/)
- [漏洞扫描](https://goharbor.io/docs/2.15.0/administration/vulnerability-scanning/)
- [复制](https://goharbor.io/docs/2.15.0/administration/configuring-replication/)
- [Harbor Helm Chart](https://github.com/goharbor/harbor-helm)
- [Harbor 2.15.2 release](https://github.com/goharbor/harbor/releases/tag/v2.15.2)
- [Harbor release policy](https://github.com/goharbor/harbor/blob/main/RELEASES.md)
- [Harbor Helm releases](https://github.com/goharbor/harbor-helm/releases)
- [Harbor 高可用 Helm 部署](https://goharbor.io/docs/2.15.0/install-config/harbor-ha-helm/)
- [Harbor 升级](https://goharbor.io/docs/2.15.0/administration/upgrade/)
- [Harbor metrics](https://goharbor.io/docs/2.15.0/administration/metrics/)

说明：Harbor 的 Chart、数据库、Valkey-compatible cache、Scanner、对象存储和 Kubernetes 版本需要按发行说明核对。示例使用虚构域名，不是生产部署参数。

## 2026-08-14 版本与组件边界

| 对象 | 本文锚点 | 不能想当然的地方 |
|---|---|---|
| Harbor 产品 | 2.15.2 | 发行说明决定数据库迁移、漏洞修复和组件变化 |
| Harbor 文档 | 2.15.0 路径 | 文档 minor 与产品 patch 是两个维度；patch 行为仍看 2.15.2 release notes |
| Harbor Helm Chart | 不在本文猜版本 | Chart 版本不等于 Harbor 产品版本，必须从官方 harbor-helm release 选择精确配对 |
| cache backend | 2.15.2 出现 Redis 到 Valkey 的变化 | 外部 Redis/Valkey 的协议、TLS、认证与 Chart 字段要按目标版本实测 |
| Scanner | Trivy 等适配器 | “扫描器在线”不等于漏洞库新鲜，也不等于制品绝对安全 |

旧文章常把 Redis 写成 Harbor 永远不变的固定组件。更准确的说法是：Harbor 需要缓存/任务协调后端，2.15.2 已出现向 Valkey 迁移的版本变化；部署时以当前 Chart values 和 release notes 为准。

## 官方知识地图

```text
client / CI / Kubernetes
  -> Harbor portal and registry API
  -> project / repository / artifact / tag
  -> authentication / robot account / RBAC
  -> scanning / signing / replication / retention
  -> registry storage / database / Valkey-compatible cache / job service
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

Harbor 常见组件包括 Portal、Core、Registry、Job Service、Database、Valkey-compatible cache、Scanner 和后端存储。高可用必须覆盖状态组件与存储，不是简单把 Portal 扩成多个副本。

### 一次 pull 为什么先得到 401

```text
Docker / containerd
  -> GET https://harbor.example/v2/
  <- 401 + WWW-Authenticate challenge
  -> Core / token service：验证用户或 Robot，并检查 project/repository 权限
  <- 短期 Bearer token
  -> Registry：读取 manifest 与 blob
  -> PostgreSQL：Harbor 元数据、项目、策略、审计
  -> shared filesystem / object storage：真实 layer 与 manifest 内容
  <- manifest + layers
```

第一个 401 通常是正常的认证挑战，不等于密码错。真正排障要看客户端是否根据 `WWW-Authenticate` 找到正确 token service、证书是否可信、Token scope 是否允许目标 repository，以及 Registry 能否访问存储。

Push 还会产生分片 upload 状态；扫描和复制则经过 Job Service、队列/cache 与对应适配器。Core 正常但 Registry、数据库或存储异常时，Portal 可能能打开，Push/Pull 仍会失败。

## 状态一致性：Tag、Digest、数据库和 Blob

| 对象 | 人话解释 | 典型故障证据 |
|---|---|---|
| Tag | 可移动的名字，例如 `prod` | Tag 指向变化、不可变策略、审计日志 |
| Digest | 内容身份，例如 `sha256:...` | CI push 输出、Harbor artifact、Pod imageID |
| DB metadata | 项目、用户、策略、任务、制品关系 | Core/DB 日志、迁移状态、连接池 |
| Blob storage | 真正占空间的 layer | 存储容量/IO、upload 目录、GC 报告 |
| Replication | 源与目标最终收敛，不是同一事务 | 任务状态、延迟、目标端 digest |

删除一个 Tag 只是解除一个名字的引用。若同一 Artifact 还有其他 Tag、保留策略尚未执行、上传未清理，或 GC 尚未在安全窗口完成，底层 Blob 仍会占空间。禁止绕过 Harbor 直接删对象存储路径，否则 DB 与 Blob 的关系可能永久不一致。

## 生产高可用、容量与安全

### 高可用与灾备

- Portal、Core、Job Service、Registry 可做多副本，但 PostgreSQL、共享对象存储和 Valkey 各自仍要实现 HA、备份、RPO 与 RTO。
- Registry 多副本必须看到同一份可靠存储；本地单机目录不能因为 Pod 多了就变成共享存储。
- 备份至少覆盖 `harbor.yml`/Helm values、数据库、Registry storage、secret key、证书与外部组件配置。必须在隔离环境验证 DB 与 Blob 能成对恢复。
- 多站点复制提高制品可用性，但异步复制有延迟；灾备切换前要核对关键 Digest，而不是只看 Tag 名。

### 容量模型

估算从“新增唯一 Blob/天 × 保留天数 × 副本/站点”开始，再加并发上传临时空间、扫描数据库、GC 安全余量和备份。Blob 去重能省空间，但不能按镜像 Tag 数直接推断容量。还要压测并发 Push/Pull、出口带宽、存储 IOPS、DB 连接、Job 队列、Scanner 并发和 proxy cache。

### 安全边界

- 人员通过 OIDC/LDAP 等身份源登录，流水线使用最小 scope、可过期、可轮换的 Robot Account；不要共享 admin。
- 全链路使用 TLS。私有 CA 要安全分发到开发机、CI、Kubernetes 节点/containerd 和扫描/复制端，不能关闭证书校验。
- Public Project 让匿名读取边界扩大，必须经过评审。复制凭据、Robot Secret、OIDC Secret 和数据库备份不能进 Git。
- Harbor 可以保存 OCI 签名/证明及其关联 Artifact，但“签名动作”和“集群准入验证”通常由 Cosign/Notation 与 admission policy 完成；不能说 Harbor 自动替你签名并阻止所有风险镜像。
- 漏洞报告必须带扫描时间、漏洞库版本和例外审批。无报告、过期报告和“0 漏洞”都不是绝对安全证明。

## 升级与真正的回滚边界

按官方 upgrade matrix 逐级升级，先在备份副本上演练。变更前固定产品版本、Chart、数据库、Valkey、存储驱动、Scanner 与客户端组合；冻结 GC 和大规模复制，记录关键 Artifact Digest。数据库 schema migration 后，仅回退旧容器镜像通常无法恢复服务，真正的回滚是恢复相互匹配的数据库、Blob、secret key 和配置。升级完成要复验登录、Push、Pull-by-digest、扫描、复制、审计和 GC dry-run。

## 安装与启动

常见方式：离线/在线安装包配合 Docker Compose，或在 Kubernetes 上使用官方 Helm Chart。生产前确认：

- FQDN、TLS、反向代理和客户端信任链。
- 外部 PostgreSQL/Valkey-compatible cache 或 Chart 内置组件的可用性。
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
$chartVersion = (helm search repo harbor/harbor --versions -o json | ConvertFrom-Json |
  Select-Object -First 1).version
$chartVersion | Out-File -Encoding utf8 harbor-chart-version.txt # 固化本次实际解析值
helm show chart harbor/harbor --version $chartVersion # 查看固定 Chart 元数据
helm template harbor harbor/harbor `          # 只进行本地渲染
  --version $chartVersion `                   # 产品 2.15.2 不代表 Chart 也叫 2.15.2
  --namespace harbor `                        # 指定实验命名空间
  --set externalURL=https://harbor.lab.local `# 设置虚构对外地址
  --set expose.type=clusterIP > harbor-rendered.yaml # 不创建真实外部入口
Select-String harbor-rendered.yaml -Pattern 'harbor.lab.local|PersistentVolumeClaim' # 验证结果
```

### 验证结果

命令退出码为 0，YAML 中能找到虚构域名和 Harbor 组件。渲染成功不代表存储、TLS、数据库和高可用已设计完成。

### 如果没有成功

检查 Helm、官方仓库网络、代理/CA、Chart 名称和 PowerShell 续行符位置。

这里故意不替你填一个未经核准的 Chart 号。先打开官方 release，确认该 Chart 的 `appVersion`、支持的 Kubernetes 和升级说明，再把精确值写入 `$chartVersion`；这是实验步骤的一部分，不是缺失项。

## 基础实验：完整 Push、Pull 与 Digest 证据链

### 前置条件

- 已在隔离环境安装并授权使用一个 Harbor 2.15.2 实例。
- 已创建专用实验 Project 和只具备 Push/Pull 权限、可过期的 Robot Account。
- Docker daemon 可用，客户端信任 Harbor TLS；以下变量均为实验值，禁止使用生产 admin。

```powershell
$harborHost = 'harbor.lab.example'
$project = 'aiops-lab'
$robotUser = '把控制台生成的完整 Robot 用户名填这里'
$robotToken = Read-Host '输入一次性 Robot Token' -AsSecureString
$credential = [pscredential]::new($robotUser, $robotToken)
$plainToken = $credential.GetNetworkCredential().Password
$plainToken | docker login $harborHost --username $robotUser --password-stdin
```

拉取一个固定公共镜像、重新打 Tag 并推送：

```powershell
docker pull busybox:1.37.0
docker tag busybox:1.37.0 "$harborHost/$project/busybox:1.37.0-lab"
docker push "$harborHost/$project/busybox:1.37.0-lab" 2>&1 |
  Tee-Object -FilePath harbor-push.txt

$digestMatch = Select-String -Path harbor-push.txt -Pattern 'digest:\s+(sha256:[0-9a-f]{64})' |
  Select-Object -Last 1
if (-not $digestMatch) { throw 'push 输出中没有 digest，停止实验' }
$digest = $digestMatch.Matches[0].Groups[1].Value
$repoDigest = "$harborHost/$project/busybox@$digest"
$repoDigest | Out-File -Encoding utf8 harbor-digest.txt
docker pull $repoDigest
```

预期：login 成功，push 最后一段给出 digest，`harbor-digest.txt` 保存 `repository@sha256:...`，按 Digest 再拉取成功。到 Harbor 页面核对 Project、Artifact、Tag、Digest、Push 审计和扫描状态；扫描 Pending 或数据库过旧必须如实记录。

清理：执行 `docker logout $harborHost`，关闭包含 Token 的终端，并按实验 Project 的审批流程处理 Artifact。不要为了让容量数字立即下降而直接运行生产 GC；保留脱敏 push 输出、Digest、扫描时间和审计截图。

### 没跑通先查这些

1. `/v2/` 首次 401 是否带正确 `WWW-Authenticate` realm。
2. Robot 完整用户名、scope、到期时间和 Project 路径是否匹配。
3. Docker 是否信任完整 CA 链，系统时间是否准确。
4. 413 看 Ingress/代理上传限制；5xx 看 Core、Registry、DB、Valkey 与存储。
5. Push 成功但 UI 不显示时，核对目标 Harbor/Project 与 Core 元数据日志。

## 故障注入实验：错误 Robot Token

使用独立 Docker 配置目录，避免本机缓存的正确凭据掩盖故障：

```powershell
New-Item -ItemType Directory -Force .\harbor-bad-credential-lab | Out-Null
$badToken = 'this-token-is-intentionally-invalid'
$badToken | docker --config .\harbor-bad-credential-lab login $harborHost `
  --username $robotUser --password-stdin
$LASTEXITCODE
```

预期：login 失败，退出码非 0，Core/审计日志出现同时间窗的认证失败；Registry 和存储健康不应被误判为故障。修复时改用受控的正确 Token，确认 login 与 `docker pull $repoDigest` 成功，再执行 `docker --config .\harbor-bad-credential-lab logout $harborHost`。保留失败/成功对照日志；确认目录只含实验 Docker 配置后再由学习者处理。

## 生产事故题：所有新 Pod 都 ImagePullBackOff

**证据**：固定第一个失败时间，保存 Pod Events、节点 containerd 日志、`crictl pull`/Docker 错误、DNS/TLS、Harbor `/v2/` challenge、Core/Registry/DB/Valkey/存储指标与日志、证书变更和最近 GC/升级记录。

**假设**：镜像路径或 Digest 错、imagePullSecret 过期、Robot scope 改变、节点不信任新 CA、Registry 无端点、数据库/Valkey 慢、对象存储不可用，或代理把大响应截断。用一个受影响节点和一个已知 Digest 做最小复现，不要批量重启全部 Pod。

**修复与影响面**：若只是新凭据，轮换 Secret 并灰度验证；若 CA 变化，按节点池分批更新信任；若存储异常，冻结 Push/删除/GC并按存储恢复。已运行 Pod 不一定立即受影响，但重启、扩容和新发布都会失败，爆炸半径要按“需要重新拉镜像的工作负载”评估。

**复验与回滚**：从真实节点按 Digest 拉取，创建一个 canary Pod，验证审计和延迟，再逐批恢复发布。证书/升级回滚必须保证 DB、Blob、secret key 和配置匹配。

## 系统设计题：双站点企业制品仓库

答案应覆盖全局命名与 Project 隔离、Digest 发布、OIDC/Robot 最小权限、TLS/私有 CA、外部 PostgreSQL/Valkey、共享对象存储、异步复制 RPO、不可变 Tag、扫描新鲜度、签名与准入、容量/GC 窗口、审计、备份恢复、升级矩阵和灾备切换。追问“两个站点同名 Tag 不一致怎么办”时，要以 Digest 为准并明确冲突处理与发布冻结。

## 常见故障排查

### ImagePullBackOff

先看 Pod Event，再检查镜像路径/Tag/Digest、`imagePullSecret`、Robot 权限、DNS、TLS、节点到 Harbor 网络和 Registry 日志。

### Push 返回 413/5xx

检查 Ingress/代理上传限制、Core/Registry、后端存储、磁盘空间、Job Service 和超时。

### 删除 Tag 后容量不降

确认 Artifact 是否仍被其他 Tag 引用、保留策略与软删除状态，再按版本文档安排 GC。不要在未备份时直接清理存储目录。

### 扫描长期 Pending

检查 Scanner Pod、漏洞库、网络出口、Job 队列、Valkey-compatible cache、资源限制和 Harbor 版本兼容。

### 复制失败

检查源/目标凭据、项目、网络、TLS、目标容量、过滤规则和任务日志，确认复制方向没有写反。

## 面试怎么讲

Harbor 是 OCI 制品仓库，核心对象是 Project、Repository、Artifact、Tag 和 Digest。CI 用最小权限 Robot Account 推送，Kubernetes 按 Digest 拉取。扫描结果必须包含扫描时间和漏洞库新鲜度；Tag 删除后还要经过引用判断和 GC 才可能释放存储。排障按客户端、认证授权、Core/Registry、Job、数据库/cache 和后端存储逐层进行。

递进追问可以这样答：

- **“第一次访问 `/v2/` 为什么是 401？”** Registry 用 401 challenge 告诉客户端去哪个 token service 认证；拿到带正确 scope 的 Bearer Token 后才读写 manifest/blob。
- **“Tag 和 Digest 哪个能做发布证据？”** Tag 可移动，Digest 对应内容；发布、复制和灾备复验都以 Digest 为准。
- **“多副本 Registry 为什么还可能全挂？”** PostgreSQL、Valkey、共享对象存储、TLS 或入口仍可能单点，HA 要覆盖完整状态路径。
- **“回滚旧镜像为什么不够？”** 数据库 schema、Blob/metadata 与 secret key 必须匹配，跨迁移边界要恢复成套备份。

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

本文覆盖岗位所需 Harbor 主线。本次更新只做官方资料和命令的静态核对，没有安装 Harbor、登录实例、Push/Pull、更新漏洞库、运行 GC、复制、备份恢复或升级；产品 2.15.2 与目标 Helm Chart、PostgreSQL、Valkey、S3、离线 Trivy DB、签名和准入组件的精确组合必须在授权隔离环境验证。下一步按上面的实验保存真实输出，不能把文档步骤当成跑通证明。
