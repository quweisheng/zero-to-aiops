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
client（客户端）/ CI（持续集成）/ Kubernetes（容器编排）
  -> Harbor portal（网页入口）与 registry API（制品仓库接口）
  -> project（项目）/ repository（仓库）/ artifact（制品）/ tag（标签）
  -> authentication（认证）/ robot account（机器人账号）/ RBAC（角色授权）
  -> scanning（扫描）/ signing（签名）/ replication（复制）/ retention（保留）
  -> storage（制品存储）/ database（元数据库）/ cache（缓存）/ job service（任务服务）
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
git commit（源码提交）
  -> CI build（流水线构建）
  -> image tag and digest（镜像标签与内容摘要）
  -> Harbor registry API（镜像仓库接口）
  -> project policy / scan / storage（项目策略/扫描/存储）
  -> Kubernetes image pull（节点拉取镜像）
  -> running Pod image ID（实际运行的镜像身份）
```

Harbor 常见组件包括 Portal、Core、Registry、Job Service、Database、Valkey-compatible cache、Scanner 和后端存储。高可用必须覆盖状态组件与存储，不是简单把 Portal 扩成多个副本。

### 一次 pull 为什么先得到 401

```text
Docker / containerd（发起镜像请求的客户端或运行时）
  -> GET https://harbor.example/v2/（探测镜像仓库接口）
  <- 401 + WWW-Authenticate challenge（要求按响应头提示取得认证令牌）
  -> Core / token service（核心服务/令牌服务）：验证用户或 Robot（机器人账号），检查 project/repository（项目/仓库）权限
  <- 短期 Bearer token（持有者令牌，携带它访问被授权的接口）
  -> Registry（镜像仓库服务）：读取 manifest（镜像清单）与 blob（按内容寻址的数据块）
  -> PostgreSQL：Harbor 元数据、项目、策略、审计
  -> shared filesystem / object storage（共享文件系统/对象存储）：真实 layer（镜像层）与 manifest（清单）内容
  <- manifest + layers（返回镜像清单与镜像层）
```

图中的 PostgreSQL 和后端存储是两类状态依赖说明，不表示 Registry 要逐次把每个镜像层先送进数据库。Core 等管理服务使用数据库保存元数据，镜像层的真实内容由 Registry 的存储后端保存。第一个 401 通常是正常的认证挑战，不等于密码错。真正排障要看客户端是否根据 `WWW-Authenticate` 找到正确 token service、证书是否可信、Token scope 是否允许目标 repository，以及 Registry 能否访问存储。

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
# PowerShell 的续行反引号必须是行尾最后一个字符，后面不能接注释或空格。
helm template harbor harbor/harbor `
  --version $chartVersion `
  --namespace harbor `
  --set externalURL=https://harbor.lab.local `
  --set expose.type=clusterIP > harbor-rendered.yaml
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

## 老师带你认识一份镜像：名字、目录和内容不是同一件事

先看 `harbor.lab.example/aiops/order-api:v2`。最左边是仓库服务地址，`aiops` 是项目，`order-api` 是仓库名，`v2` 是标签。你可以把标签理解成书架上的便签，它告诉人“这份叫第二版”，但在允许覆盖的仓库里，便签可以被贴到另一份内容上。

Digest（摘要）由内容计算出来，帮助精确识别这一份制品。CI 推送后应保存返回的 digest，发布时记录实际使用的 digest。只保存 `v2`，过几天标签被移动，你就不能回答“事故时到底运行了什么”。OCI 是 Open Container Initiative，制定容器镜像与分发相关标准；Artifact 泛指按这类方式保存的制品，并不都能直接运行。

Manifest（清单）像镜像目录，引用配置对象和各层 Blob（二进制数据块）。多个镜像可以共享基础层，所以一百个标签不等于一百份完全独立的磁盘占用。相反，一个大体积新层即使只有一个标签，也可能占掉很多空间。容量必须看唯一内容增长和实际存储，而非仅数标签。

多架构镜像还可能先返回 Index（索引），再按操作系统和处理器架构选择子 Manifest。仓库页的顶层摘要与运行时展示的某个具体平台摘要可能不同。核验时记录对象层次和架构，不能看两个哈希不同就直接断言供应链被替换。

### 从构建到运行，请你收齐五张收据

第一张是源码提交，第二张是构建日志和依赖版本，第三张是推送摘要，第四张是部署清单，第五张是节点实际拉取和运行身份。没有构建过程，镜像来源不清；没有运行身份，仓库里存在正确镜像也不能证明线上使用了它。

AIOps 可以把这五张收据关联起来：发布后某版本错误率上升，先确定受影响 Pod 的镜像内容，再找对应构建和提交。这样生成的是可追溯变更链，不是按发布时间猜测谁有责任。

## 认证课堂：登录成功为什么还是不能拉镜像

`docker login` 验证客户端能凭身份与仓库交互，但具体仓库、项目与操作还要接受授权。Token scope（令牌作用范围）可以包含特定仓库的 pull 或 push 权限；只给拉取的机器人不应能覆盖生产标签。

开发电脑和 Kubernetes 节点拥有不同的凭据保存位置与证书信任。你在电脑登录成功，不会自动把凭据送到每台节点。`imagePullSecret` 是让 Kubernetes 在相应命名空间向运行时提供拉取凭据的一种方式，它还要被 Pod 或 ServiceAccount 正确引用。

排障先读 Pod Event 的原始错误。`unauthorized` 优先查凭据与范围；`x509` 查证书名称、有效期、信任链和系统时间；`manifest unknown` 查路径与摘要；超时查 DNS、网络、代理和仓库负载。不同错误对应不同证据，重启所有 Pod 会同时放大拉取压力。

机器人轮换应先创建或配置新凭据，更新一组测试拉取方，确认新节点也能拉取固定摘要，然后扩展到所有目标，最后撤销旧凭据。提前撤销会使已有 Pod 继续运行却无法扩容，直到事故时才暴露。

## 清理课堂：删标签为什么像撕便签，而不是扔书

保留策略决定哪些制品仍应保留，垃圾回收 GC 才处理不再被引用的底层内容。多个标签、签名和关联制品、正在进行的上传都可能影响回收判定。Harbor 的[垃圾回收文档](https://goharbor.io/docs/2.15.0/administration/garbage-collection/)给出目标版本的实际行为；先做 dry run（预演）并复核报告。

课堂上我们先不执行删除。取三份发布记录：当前生产、上一可回退版本、仍在测试的候选。逐一找出它们的摘要及关联签名，再看保留规则会不会匹配这些对象。时间最老的版本也可能仍然是一个长期运行系统的恢复依赖，因此“超过三十天就删”需要业务证据。

存储快满时，还要给新上传和 GC 自身保留操作空间。满到无法写数据库或临时文件，再尝试大量任务会更难恢复。先停止非必要推送、评估可安全扩容，保护当前业务所需制品；直接在对象存储里删除目录会破坏引用关系。

## 三分钟面试回答：仓库怎样变成可靠的发布依赖

**30 秒：**Harbor 在标准镜像分发之外增加项目权限、扫描、复制、保留和审计。我用摘要贯通构建、发布和运行证据，用最小权限机器人进行自动化，并分别验证仓库服务、状态依赖和真实节点拉取。

**3 分钟：**从一次拉取讲起：客户端先得到认证挑战，到令牌服务换取特定仓库范围的令牌，再读取清单和数据层。网页能打开不证明 Registry、元数据库或存储都健康。标签可能变化，发布要保存内容摘要和架构，遇到多架构索引则区分顶层与平台清单。

生产方案要给数据库、缓存、共享存储和入口各自设计高可用与恢复，把异步复制延迟算进 RPO。扫描有漏洞库新鲜度边界，签名与集群准入要形成配套验证，不能把扫描完成当作绝对安全。容量治理通过保留预演与 GC 完成，升级回滚需要成套的状态与存储恢复，最后从真实节点验证拉取和灰度发布。

面试追问“旧 Pod 正常能不能稍后修”，要指出节点故障、扩容和回滚都可能随时触发镜像拉取；“双站点复制是不是备份”，要指出误删除传播、复制延迟、身份策略和配置备份的边界。课堂证据应包含一次错误 Token 的可回收实验和一次按摘要核验的成功链。

## 分发协议课堂：为什么推一份镜像会访问好几个接口

老师先让你暂停在 `docker push`。它不是一次把整份镜像作为 ZIP 上传：客户端与仓库协商身份，检查已有数据层，上传缺失 Blob，最后提交引用这些内容的 Manifest。共享层已存在时可能直接复用，所以“这次上传很快”不代表网络突然变快；也不能把镜像解压后的体积等同本次线上传输量。

上传可能经历创建上传会话、传送数据、提交内容摘要等阶段。反向代理若重写了错误的外部地址、限制请求大小或中断长上传，用户可能登录成功、小镜像成功、大镜像失败。诊断要保存返回状态码、请求阶段、时间和服务端对应日志，避免把所有上传错误叫成权限问题。不要记录令牌正文、完整认证头或客户仓库名到公开工单。

`externalURL` 是客户端看到的仓库外部地址，内外地址不一致可能影响认证挑战或重定向。TLS 证书名称应匹配客户端访问的域名，证书链应被真正执行拉取的运行时信任。浏览器接受证书不代表节点容器运行时也信任；浏览器可能有另一套信任库或人工例外。正确修复是让客户端信任经过批准的 CA 链，而不是全局关闭 TLS 校验。

接着问持久性：推送响应成功、UI 能列出 Artifact、从另一台干净客户端完整拉取，是三个有价值但不同的证据。第三个能避免客户端已有层缓存掩盖仓库缺失内容。生产验收应使用隔离验证节点或独立缓存环境，不为了测试而清空正在服务的所有节点镜像缓存；那会放大启动延迟和仓库压力。

## 扫描与签名课堂：两张不同的质量证明

漏洞扫描把制品中的软件包信息与某时刻的漏洞数据库比较，结果依赖识别能力、漏洞库新鲜度和扫描范围。“零高危”可能表示当前规则未发现，不等于不存在漏洞，更不表示没有恶意业务代码。离线环境尤其要记录漏洞库更新日期、制品摘要、扫描时间和扫描器版本；拿几个月前的库给今天的镜像盖绿色章，缺少时间口径。

签名证明的是制品与某个签名身份之间的关系，常用于校验来源和防止内容被替换；它不自动证明代码安全。SBOM 是 Software Bill of Materials（软件物料清单），列出软件组成；它有助于漏洞影响分析，但需要与制品摘要和构建来源关联。扫描、签名、物料清单、构建证明各答不同问题，把任意一个叫成完整供应链安全都不够。

更重要的是执行点。Harbor 里显示签名，不意味着 Kubernetes 会自动拒绝未签名镜像；需要配置兼容的准入验证组件和可信身份规则。准入拒绝在 API 创建阶段发生，镜像拉取错误在节点启动阶段发生，定位时先找阶段。豁免应有负责人、原因、有效期和范围，不能让一个永久通配例外绕过所有生产发布。

若扫描任务积压，先区分 JobService 排队、扫描器资源、漏洞库访问、镜像拉取权限和底层存储。不要无上限增加并发：扫描会读取很多内容、占用 CPU 和临时空间，可能反过来拖慢生产节点拉取。给交付时效与交付风险分别定义门槛，例如新镜像先完成有效扫描才允许发布，旧镜像遇到新漏洞则按影响和修复期限治理。

## 复制与备份课堂：双仓库怎样仍然可能一起丢数据

复制规则是异步把选中的制品同步到另一个 Registry。它需要目标认证、网络、兼容接口、过滤规则和任务执行都成功。控制台有一条“复制规则”，不证明每个关键摘要已到目标；源端推送成功也不代表目标立即可用。故障切换前应从目标直接按摘要拉取，并核对签名等关联制品是否按版本支持行为同步。

请做一道算术题：源仓库十分钟内产生四十份制品，复制平均积压十五分钟。主站此时完全丢失，不能承诺最近十分钟发布一定可恢复。RPO 衡量可接受的数据缺口，必须从任务队列、失败重试和目标实际对象核验计算，不用“每五分钟调度一次”替代真实延迟。大镜像和多架构制品会改变复制耗时，平均值之外还要看最慢任务。

备份关注能否恢复某个一致时间点，复制关注另一端是否有最新选中对象。误删除、错误保留策略或泄漏凭据可能影响两个站点；是否传播删除也取决于规则与版本。数据库保存项目、用户、制品关联等元信息，Registry 存储保存数据内容，密钥、证书和配置决定恢复后是否能读懂和授权访问。只备份对象存储桶或只备份数据库都可能得到一套不完整状态。

恢复演练必须在隔离地址进行，不能把恢复库直接连到生产 JobService，让旧任务继续执行。先确认数据库与存储恢复点协调，再启动所需组件、验证身份与权限、按摘要拉取关键镜像，最后才讨论切流。恢复用的证书、机器人权限与复制出口也要限制，防止测试站误向生产写入。保留演练耗时、失败阶段和数据核验范围，未验证的能力写成待验证。

## 生产容量课堂：镜像仓库为什么在节点故障时突然成为关键路径

平时 Pod 一直运行，Harbor 每小时可能只有少量拉取。一个机架重启后，大批节点没有缓存，要同时下载基础镜像和应用层。假设两百个节点各需新增 2 GiB 数据，冷启动总下载约 400 GiB；即使链路有效吞吐 1 GiB/s，也至少需要约四百秒，还没计磁盘、并发限制、重试和认证。这个下界帮助你解释恢复为何慢，但不能当成真实压测结果。

容量不仅包括存储总量，还包括入口连接、Registry 吞吐、数据库访问、对象存储请求、JobService 并发以及扫描产生的额外读流量。共同瓶颈可能在外部存储或网络，而不在 Registry Pod 的 CPU。高可用增加前端副本也不能突破共享后端上限，应使用冷缓存恢复场景与日常推送场景分别压测。

保留规则要兼顾正在运行的版本、计划回退版本、灾备与长期停用后可能恢复的应用。运行中的节点缓存不能作为备份：节点损坏后缓存也会消失。对于按 digest 部署但已经没有 tag 的制品，必须验证保留与 GC 规则是否仍保护它及关联内容，不能只保护某几个标签名字。执行预演、人工复核和小范围治理比直接对整个仓库套“最近十个”更可靠。

## 带练事故：一批新节点全部 ImagePullBackOff，旧 Pod 正常

先把影响说清楚：既有请求仍有容量，但新建、扩容与回滚路径受阻。保存一个失败 Pod 的 Event 和一个成功节点的对照，按 `x509`、`unauthorized`、`manifest unknown`、超时或 5xx 分流。假设 Event 明确说机器人凭据无效，且今天刚轮换 Token，那么重点查新节点使用的 Secret 版本、所在命名空间和 ServiceAccount 引用，而不是先扩容存储。

验证要使用同一摘要与同一授权范围。开发电脑管理员登录成功不反驳节点机器人失败。更换测试命名空间的拉取凭据后，只创建一个无业务副作用的测试 Pod，确认它在之前失败的新节点上拉取成功，再分批更新其他命名空间。控制 Secret 的查看和修改权限，不在终端 `-o yaml` 打印全部认证数据，不把 Token 写进版本库。

修复后还要检查“撤销旧 Token”这一步是否安全：所有目标消费者是否完成迁移，离线节点上线后会不会仍使用旧 Secret，灾备仓库机器人是否单独轮换。回滚不是把过期 Token 从聊天记录抄回来，而是使用受控的有效旧凭据或预备恢复凭据，必要时走紧急授权流程。最终关闭单据的证据是新增节点按固定摘要成功运行、相关错误率恢复且旧凭据按计划撤销。

课堂错误 Token 实验的恢复也必须使用同一个独立 Docker 配置目录，否则可能被默认目录的缓存登录掩盖。修复时将正确凭据通过 `--password-stdin` 传给 `docker --config .\harbor-bad-credential-lab login`，随后用 `docker --config .\harbor-bad-credential-lab pull $repoDigest` 验证，再对该配置目录 logout。删除目录前先确认其绝对路径位于专用实验目录，且内容只有本次生成的客户端配置；真实令牌和该配置目录不进入 GitHub。

## 学习证据

- `labs/harbor/artifact-model.md`
- `labs/harbor/harbor-rendered.yaml`
- `labs/harbor/image-traceability.md`
- `labs/harbor/retention-gc-runbook.md`
- `labs/harbor/image-pull-failure.md`

公开仓库不要提交 Robot Secret、真实仓库地址、漏洞豁免、客户镜像名、证书私钥和数据库备份。

## 本文边界与下一步

本文覆盖岗位所需 Harbor 主线。本次更新只做官方资料和命令的静态核对，没有安装 Harbor、登录实例、Push/Pull、更新漏洞库、运行 GC、复制、备份恢复或升级；产品 2.15.2 与目标 Helm Chart、PostgreSQL、Valkey、S3、离线 Trivy DB、签名和准入组件的精确组合必须在授权隔离环境验证。下一步按上面的实验保存真实输出，不能把文档步骤当成跑通证明。
