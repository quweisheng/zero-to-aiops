# Ceph 深讲

> 学习目标：从零理解 Ceph 分布式存储的 RADOS、MON、MGR、OSD、MDS、RGW、pool、PG、CRUSH 和 BlueStore；能区分 RBD 块存储、CephFS 文件存储和 RGW 对象存储，使用 `cephadm` 搭建单机学习集群，创建第一个 RBD 镜像，读懂健康状态、容量和恢复过程，并按数据路径排查常见故障。

## 官方资料

- [Ceph 官方文档](https://docs.ceph.com/en/latest/)
- [Ceph 活跃版本与生命周期](https://docs.ceph.com/en/latest/releases/)
- [Ceph 架构](https://docs.ceph.com/en/latest/architecture/)
- [Cephadm 部署指南](https://docs.ceph.com/en/tentacle/cephadm/install/)
- [Cephadm OSD 服务](https://docs.ceph.com/en/tentacle/cephadm/services/osd/)
- [CRUSH Map](https://docs.ceph.com/en/tentacle/rados/operations/crush-map/)
- [Placement Group](https://docs.ceph.com/en/tentacle/rados/operations/placement-groups/)
- [集群监控与健康检查](https://docs.ceph.com/en/tentacle/rados/operations/monitoring/)
- [RBD 块设备](https://docs.ceph.com/en/tentacle/rbd/)
- [CephFS 文件系统](https://docs.ceph.com/en/tentacle/cephfs/)
- [Ceph Object Gateway](https://docs.ceph.com/en/tentacle/radosgw/)
- [Prometheus Manager 模块](https://docs.ceph.com/en/tentacle/mgr/prometheus/)
- [Cephadm 升级指南](https://docs.ceph.com/en/tentacle/cephadm/upgrade/)

> 时点说明：截至 2026 年 7 月，官方发布页列出的活跃版本包括 Tentacle 20.2.2 和 Squid 19.2.4。本文实验固定使用 Tentacle 20.2.2 以便复现，但生产选型应重新检查活跃版本、发行说明、操作系统与容器运行时兼容性。`latest` 文档可能指向开发版本，生产操作必须切换到自己的版本文档。

## 官方知识地图

Ceph 官方文档可以先拆成五层：

```text
基础存储层
  -> RADOS（对象底座）、OSD（数据进程）、BlueStore（本地存储后端）、pool（策略池）、PG（放置组）、CRUSH（放置算法）
  -> 集群控制层：MON（地图共识）、MGR（管理模块）、Cephx（认证）、cluster map（集群地图）
  -> 数据服务层：RBD（块）、CephFS + MDS（文件与元数据服务）、RGW（对象网关）
  -> 生命周期：cephadm（部署管理工具）、编排、扩容、升级、恢复
  -> 运维观测：health（健康）、events（事件）、logs（日志）、metrics（指标）、dashboard（仪表盘）
```

本文按下面的学习路径展开：

1. 先理解 Ceph 为什么不使用中央数据目录。
2. 再看对象如何经过 pool、PG 和 CRUSH 落到 OSD。
3. 再学习 MON、MGR、OSD、MDS 与 RGW 的职责。
4. 再用 `cephadm` 完成第一个可运行集群和 RBD 实验。
5. 最后学习容量、恢复、性能、AIOps 告警和故障排查。

## 场景开场

一个 Kubernetes 集群同时需要三类存储：数据库需要块设备，AI 训练任务需要共享文件，日志归档需要 S3 对象接口。

如果每种需求都采购一套完全不同的存储，容量、权限、监控、备份和故障处理会被拆成多套系统。团队于是部署了 Ceph，希望一套底层集群同时提供块、文件和对象服务。

上线后第一块磁盘故障，控制台出现：

```text
HEALTH_WARN
1 osds down
32 pgs degraded
recovery 18 MiB/s
```

小白最容易做的动作是立刻重启 OSD，或者看到“还能读写”就不管。真正要先回答的是：

- 哪个 OSD down，它是进程、磁盘、主机还是网络故障？
- 哪些 PG 降级，副本还剩几份？
- CRUSH 是否把副本放在真正独立的故障域？
- recovery 会不会挤占客户端 I/O？
- 如果再坏一个 OSD，数据是否仍可用？

## 一句话人话版

Ceph 是把多台服务器和多块磁盘组成一个自愈存储集群，再从同一底层向业务提供块、文件和对象接口的软件。

## 小白可能会问

- Ceph 是不是把很多硬盘做成一个超大的 RAID？
- MON 保存集群地图，为什么客户端不把数据写给 MON？
- object、pool、PG、OSD 和 CRUSH 到底是什么关系？
- RBD、CephFS 和 RGW 是否会把同一份数据自动互相转换？
- 一个 OSD down 后，为什么会同时出现 degraded、undersized 和 recovery？

## 为什么 AIOps 工程师要学 Ceph

Ceph 常见于 OpenStack、Kubernetes、私有云、虚拟化、备份和 AI 数据平台。它的故障会同时向上表现为虚拟机磁盘卡顿、Pod 挂载失败、共享目录超时或 S3 请求错误。

AIOps 要把多个层次的数据连起来：

- **指标**：集群健康、OSD up/in、PG 状态、容量、客户端延迟、恢复速度和网络心跳。
- **日志**：MON、MGR、OSD、MDS、RGW、cephadm 和容器运行时日志。
- **拓扑**：业务、接口、pool、PG、OSD、device、host、rack 和网络故障域。
- **告警**：区分瞬时恢复、冗余降低、数据不可用、容量临界和监控断流。
- **自动化**：自动采集只读证据、关联变更、生成工单和执行经过审批的 Runbook。
- **根因分析**：把 slow ops 与磁盘、网络、恢复、scrub、容量和业务负载关联。
- **容量预测**：同时计算原始容量、复制或纠删码开销、保留空间和增长速度。

## Ceph 是什么

Ceph 是开源分布式存储系统。底层核心叫 RADOS，完整英文是 Reliable Autonomic Distributed Object Store，可以理解为“可靠、自治的分布式对象存储底座”。

RADOS 负责把数据存成对象并分布到 OSD。上层服务再把这些对象组织成业务熟悉的形态：

| 服务 | 对外提供什么 | 核心组件 | 典型场景 |
|---|---|---|---|
| RBD | 块设备 image | `librbd`、kernel RBD、RADOS | 虚拟机、数据库、Kubernetes PVC |
| CephFS | POSIX 风格共享文件系统 | MDS、CephFS client、RADOS | AI 数据集、共享目录、HPC |
| RGW | S3 / Swift 兼容对象 API | `radosgw`、HTTP、RADOS | 备份、归档、对象应用、数据湖 |
| librados | 原生对象 API | client library、RADOS | 自定义存储应用 |

RBD image、CephFS file 和 RGW object 最终都会变成 RADOS object，但三种服务有自己的元数据、命名空间和访问语义。不能把一个 RBD image 当作 S3 bucket 直接读取。

## 它解决什么问题

- 用普通服务器和磁盘横向扩展容量与性能。
- 避免所有客户端都经过一个中央数据网关形成瓶颈和单点。
- 根据主机、机架、机房等故障域自动放置副本。
- 磁盘或节点变化后自动恢复和重平衡数据。
- 在同一 RADOS 底座上提供块、文件和对象服务。
- 通过软件定义的 pool、CRUSH rule、replication 和 erasure coding 区分存储策略。

## 核心原理

Ceph 最关键的数据映射链是：

```text
client data（客户端数据）
  -> RADOS object（底层对象）
  -> pool（逻辑池）
  -> placement group (PG，放置组)
  -> CRUSH rule + cluster map（放置规则与集群地图）
  -> primary OSD + replica OSDs（主副本与其他副本）
  -> BlueStore（本地存储引擎）
  -> block device（块设备）
```

客户端先从 MON 获得 cluster map，再在本地计算对象应该属于哪个 PG，以及该 PG 当前由哪些 OSD 负责。客户端直接连接 primary OSD，primary OSD 再协调其他副本 OSD。

MON 不转发正常数据流。它维护地图与集群共识。如果所有 I/O 都经过 MON，MON 就会成为性能瓶颈和数据平面单点。

## 关键术语

| 术语 | 人话解释 | 为什么重要 |
|---|---|---|
| daemon | 后台长期运行的 Ceph 进程 | 每种 daemon 负责不同控制或数据职责 |
| cluster map | 描述 MON、OSD、PG、CRUSH、MDS 状态的一组地图 | 客户端靠它定位数据和发现拓扑变化 |
| epoch | 某张 map 的版本号 | 排障时可判断组件是否看到同一代状态 |
| object | RADOS 存储的基本数据单元 | 三类上层服务最终都落成对象 |
| pool | 对象的逻辑存储空间和策略边界 | 决定副本、PG、CRUSH rule 和权限 |
| PG | Placement Group，放置组 | 把海量对象聚合后映射到 OSD，降低元数据开销 |
| OSD | Object Storage Daemon | 管理设备、保存对象并执行复制、恢复和 scrub |
| CRUSH | 数据放置算法与故障域规则 | 决定副本应该落到哪些 OSD、主机或机架 |
| BlueStore | 默认 OSD 存储后端 | 直接管理块设备和对象元数据 |
| replica | 同一对象的完整副本 | 用额外容量换取简单可靠的冗余 |
| erasure coding | 纠删码 | 用数据块和校验块提高容量效率 |
| recovery | 故障后补齐缺失副本 | 恢复冗余，但会占用磁盘和网络资源 |
| backfill | PG 位置变化后的数据迁移 | 扩容、CRUSH 变化或 OSD 回归时常见 |
| scrub | 对象和元数据一致性检查 | 发现静默损坏，deep scrub 还会检查数据内容 |

## 核心知识树

### 1. MON 与 quorum

**是什么**：MON 是 Monitor daemon，保存 cluster map 主副本并维护集群一致状态。多个 MON 通过 quorum 形成多数派。

**为什么需要**：所有客户端和 daemon 必须对“集群里有什么、谁在线、地图是哪一代”达成一致，否则可能访问错误位置或出现分裂。

**怎么工作**：MON 使用共识机制提交 map 变化。典型生产部署使用奇数个 MON，并把它们放在独立故障域中，保证多数派仍可用。

**怎么看 / 怎么用**：运行 `ceph quorum_status --format json-pretty`、`ceph mon stat` 和 `ceph mon dump`，确认 quorum 成员、rank、地址和 epoch。

**坏了怎么查**：先看主机、时间同步、网络端口、磁盘空间和 MON 日志。MON 数量很多不等于更安全，跨高延迟网络乱放 MON 可能更难形成稳定多数派。

### 2. MGR 与管理模块

**是什么**：MGR 是 Manager daemon，为指标、dashboard、编排、进度和插件模块提供管理入口。

**为什么需要**：MON 负责共识，不适合承担大量管理查询和扩展功能。MGR 把这些能力从 MON 分离出来。

**怎么工作**：一个 MGR active，其他 MGR standby。各 daemon 向 MGR 汇报性能计数，MGR 模块可以暴露 Prometheus 指标或提供 dashboard。

**怎么看 / 怎么用**：运行 `ceph mgr stat`、`ceph mgr dump`、`ceph mgr module ls` 和 `ceph mgr services`。

**坏了怎么查**：确认 active/standby、模块状态、容器和端口。MGR 故障可能让 dashboard、指标和编排不可用，但不等于现有 RADOS 数据立即不可读。

### 3. OSD 与 BlueStore

**是什么**：OSD 是保存 RADOS object 的数据 daemon，通常一个 OSD 管理一块数据设备。BlueStore 是现代 Ceph 默认的 OSD 存储后端。

**为什么需要**：把数据、复制、恢复、scrub 和设备管理分散到许多 OSD，集群才能横向扩展并避免中央数据服务器。

**怎么工作**：primary OSD 接收客户端请求，根据 acting set 把写入发送给其他副本。BlueStore 直接使用块设备，并使用 RocksDB 保存内部元数据。

**怎么看 / 怎么用**：运行 `ceph osd tree`、`ceph osd stat`、`ceph osd df tree`、`ceph osd perf` 和 `ceph orch ps --daemon-type osd`。

**坏了怎么查**：区分 OSD daemon down、设备故障、主机掉线、网络心跳慢、磁盘满或容器问题。不要看到 OSD down 就立即 purge，先确认数据冗余和故障是否可恢复。

### 4. pool 与 PG

**是什么**：pool 是对象策略和权限边界；PG 是 pool 内对象映射到 OSD 的中间分组。

**为什么需要**：逐对象维护位置会产生巨大元数据和迁移成本。PG 把一批对象作为单元映射、peering、恢复和迁移。

**怎么工作**：对象名经过 hash 得到 PG ID，CRUSH 再把 PG 映射到一组 OSD。PG autoscaler 可以根据容量和使用情况调整 `pg_num` 建议或自动变更。

**怎么看 / 怎么用**：运行 `ceph osd pool ls detail`、`ceph pg stat`、`ceph pg dump_stuck` 和 `ceph osd pool autoscale-status`。

**坏了怎么查**：PG 长期不 `active+clean` 时看具体 state、acting set、OSD 和最近 map 变化。PG 不是越多越好，过多会消耗 MON、OSD 的内存、CPU 和网络。

### 5. CRUSH 与故障域

**是什么**：CRUSH 是 Controlled Replication Under Scalable Hashing，按照拓扑和规则计算对象副本位置。

**为什么需要**：客户端可以计算位置，不需要查询中央对象目录；同时可以要求副本分散到不同 host、rack 或 datacenter。

**怎么工作**：CRUSH map 包含 device、host、rack 等 bucket 层级和 rule。pool 选择 rule 后，CRUSH 按权重和故障域放置 PG。

**怎么看 / 怎么用**：运行 `ceph osd tree` 看层级，运行 `ceph osd crush rule ls` 和 `ceph osd crush rule dump` 看规则。

**坏了怎么查**：重点检查真实物理拓扑是否和 CRUSH location 一致。三个副本都在同一台主机，即使落在三个 OSD，也防不了主机断电。

### 6. replication 与 erasure coding

**是什么**：replication 保存多份完整对象；erasure coding，简称 EC，把数据切成 `k` 个数据块和 `m` 个校验块。

**为什么需要**：副本池恢复简单、随机写友好，但容量开销高。EC 更节省容量，适合大对象和容量型场景。

**怎么工作**：副本数由 pool 的 `size` 控制，允许继续 I/O 的最低副本数受 `min_size` 影响。EC pool 按 profile 和 CRUSH rule 分布数据块与校验块。

**怎么看 / 怎么用**：运行 `ceph osd pool get <pool> all`，确认 size、min_size、crush_rule、pg_num 和 EC profile。

**坏了怎么查**：不要只为了省容量把副本数设为 1，也不要随意降低 `min_size` 强行写入。EC 的小随机写、恢复流量和元数据 pool 设计需要单独评估。

### 7. recovery、backfill 与 scrub

**是什么**：recovery 补齐丢失或过期副本；backfill 把 PG 数据迁移到新的目标 OSD；scrub 检查对象元数据和副本一致性。

**为什么需要**：分布式系统的磁盘和节点持续变化，必须自动恢复冗余并发现静默损坏。

**怎么工作**：OSD 或拓扑变化触发 peering，PG 确认权威历史后开始恢复。scrub 进行元数据检查，deep scrub 还读取并比较数据。

**怎么看 / 怎么用**：运行 `ceph -s` 看恢复进度，运行 `ceph pg stat` 看 PG 汇总状态；需要定位正在 scrub 或 repair 的 PG 时，再从 `ceph pg dump pgs_brief` 输出中筛选相应状态。

**坏了怎么查**：恢复长期不前进时查 down OSD、full ratio、网络、慢盘、recovery/backfill 限制和 blocked PG。不要为了短期降低延迟永久关闭 scrub 或恢复。

### 8. Cephx 身份与权限

**是什么**：Cephx 是 Ceph 自带的身份认证机制，通过 entity、keyring 和 capabilities 控制客户端能访问哪些 MON、MGR、OSD 或 MDS 能力。

**为什么需要**：不同 Kubernetes 集群、虚拟化平台、备份任务和管理员不应该共用 `client.admin`。

**怎么工作**：客户端用 keyring 认证，MON 发放会话凭据，各 daemon 按 caps 检查操作范围。

**怎么看 / 怎么用**：运行 `ceph auth ls` 查看 entity，运行 `ceph auth get client.example` 查看指定权限。公开仓库只能提交脱敏示例，不能提交真实 keyring。

**坏了怎么查**：遇到 permission denied 时确认 entity、keyring 路径、caps、pool/namespace 和时钟，不要直接把客户端改成 `client.admin`。

## 架构和数据流

### RBD 写入

```text
VM / database / Kubernetes PVC（虚拟机 / 数据库 / 持久卷申请）
  -> librbd or kernel RBD（用户态库或内核块设备客户端）
  -> MON（监视器）：获取集群地图并认证
  -> object（对象） -> pool（存储池） -> PG（放置组） -> CRUSH（放置算法）
  -> primary OSD（主数据守护进程）
  -> replica OSDs（副本数据守护进程）
  -> acknowledgement to client（返回客户端确认）
```

RBD image 会被切成多个 RADOS object。客户端直接与 OSD 通信，所以 MON 不在每个读写请求的数据路径上。

### CephFS 访问

```text
POSIX client（按文件系统接口访问的客户端）
  -> MDS（元数据服务）：目录、索引节点、权限等元数据
  -> OSD（数据服务）：文件内容对应的数据对象
```

MDS 是 Metadata Server。它管理目录、文件属性和客户端 metadata cache，不保存普通文件内容。MDS 出问题时，CephFS 可能不可用，但 RBD 与 RGW 不一定同时中断。

### RGW 访问

```text
S3 / Swift client（对象接口客户端）
  -> load balancer（负载均衡入口）
  -> RGW HTTP daemon（对象网关进程）
  -> bucket index and metadata（桶索引与元数据）
  -> RADOS data objects（底层数据对象）
```

RGW 有自己的用户、bucket、index 和 multisite 体系。RGW 不使用 CephFS 的 MDS。

## 网络与故障域设计

Ceph 常把网络分为：

- **public network**：客户端、MON、MGR、MDS、RGW 和 OSD 对外通信使用。
- **cluster network**：OSD 副本、heartbeat、recovery 和 backfill 可选择使用的内部网络。

小集群可以共用网络，生产大集群是否分离要根据带宽、故障域和运维复杂度评估。网络分成两张 VLAN 但仍经过同一交换机，不代表物理故障域已经隔离。

生产 CRUSH 拓扑至少应真实反映：

```text
root（根层级）
  -> datacenter or room（数据中心或机房）
  -> row or rack（列或机架）
  -> host（主机）
  -> osd device（OSD 使用的设备）
```

选择 `host` 作为副本故障域，可以防单机故障；要防整个机架断电，需要副本分散到 `rack`。故障域越大，对可用主机数量、网络和容量余量要求越高。

## 安装与启动

### 实验环境

本文实验使用一台专用 Linux 虚拟机：

- 4 vCPU，至少 8 GiB 内存。
- 40 GiB 系统盘。
- 3 块完全空闲的数据盘，每块至少 10 GiB，例如 `/dev/sdb`、`/dev/sdc`、`/dev/sdd`。
- 固定主机名和静态 IP，DNS 或 `/etc/hosts` 能解析本机名。
- Python 3、systemd、Podman 或 Docker、时间同步、LVM2、SSH。
- 能访问 Ceph 下载站和容器镜像仓库。

这是单主机学习集群。三个 OSD 在同一主机，只能演示数据流，不能提供生产级主机故障保护。不要在装有业务数据的服务器执行。

### 检查空盘

```bash
hostname -s                              # 记录 cephadm 使用的主机名
hostname -I                              # 找出其他主机可访问的固定 IP
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS # 确认三块数据盘没有分区、文件系统和挂载点
timedatectl status                       # 确认时间同步已启用
podman --version || docker --version     # 确认至少有一个兼容的容器运行时
```

预期结果：`/dev/sdb`、`/dev/sdc`、`/dev/sdd` 的 `FSTYPE` 和 `MOUNTPOINTS` 为空。只要设备上有真实数据、分区、LVM 或挂载点，就停止实验。

### 安装 cephadm

下面固定 Tentacle 20.2.2。版本变化后先回到官方 releases 页面更新变量：

```bash
CEPH_RELEASE=20.2.2 # 固定实验版本，避免每次下载不同构建
curl --fail --silent --show-error --remote-name --location \
  "https://download.ceph.com/rpm-${CEPH_RELEASE}/el9/noarch/cephadm" # 从 Ceph 官方下载 cephadm
chmod +x cephadm                         # 赋予当前用户执行权限
sudo ./cephadm add-repo --release tentacle # 添加 Tentacle 软件仓库
sudo ./cephadm install                   # 把 cephadm 安装到系统 PATH
cephadm version                          # 验证版本和命令可用
```

注意：下载文件使用了精确版本，但 `add-repo --release tentacle` 与后续包安装选择的是该分支仓库中的可用软件包，不保证仍为 20.2.2。继续前检查 `cephadm version`，按发行版包管理器锁定经过核对的版本；引导集群时也要显式使用已批准的 Ceph 容器镜像版本，不能把客户端版本当成所有 daemon 的运行版本。若目标精确包已经不可得，先修订实验版本记录，不伪称仍完全固定。下载失败先检查 DNS、代理、TLS、操作系统架构和容器运行时兼容性。

### bootstrap

把 `192.168.56.10` 替换成虚拟机真实的固定 IP：

```bash
MON_IP=192.168.56.10 # MON 对集群和客户端可达的地址，不要填 127.0.0.1
sudo cephadm --image quay.io/ceph/ceph:v20.2.2 bootstrap \
  --mon-ip "$MON_IP" \
  --single-host-defaults # 只用于单主机实验，生产集群不要使用这个选项
```

bootstrap 会创建第一个 MON 和 MGR，生成 SSH key，写入 `/etc/ceph/ceph.conf` 与高权限 `client.admin` keyring，并默认部署监控栈。

```bash
sudo cephadm shell -- ceph -s          # 进入 Ceph 容器环境并查看集群状态
sudo cephadm shell -- ceph orch host ls # 确认本机已被 orchestrator 管理
sudo cephadm shell -- ceph orch ps      # 查看 MON、MGR 和监控服务 daemon
```

此时没有 OSD，看到容量为 0 或 OSD 数量为 0 是正常的，但还不能存储数据。

### 添加 OSD

先让 orchestrator 判断设备是否 available：

```bash
sudo cephadm shell -- ceph orch device ls --wide # 三块空盘应显示 Available: Yes
```

再逐块显式添加，避免误吞系统中的其他空盘：

```bash
HOST=$(hostname -s) # 使用 ceph orch host ls 中登记的准确主机名
sudo cephadm shell -- ceph orch daemon add osd "${HOST}:/dev/sdb" # 创建第一个 OSD
sudo cephadm shell -- ceph orch daemon add osd "${HOST}:/dev/sdc" # 创建第二个 OSD
sudo cephadm shell -- ceph orch daemon add osd "${HOST}:/dev/sdd" # 创建第三个 OSD
```

这些命令会清空目标设备。只有确认三块盘是实验空盘后才能执行。生产环境优先使用经过评审、带 `service_id` 的 OSD service spec 和 `--dry-run`。

```bash
sudo cephadm shell -- ceph orch ps --daemon-type osd # 应看到 3 个 running OSD
sudo cephadm shell -- ceph osd tree                  # 应看到 osd.0、osd.1、osd.2 均为 up/in
sudo cephadm shell -- ceph -s                        # 等待 PG 恢复稳定
```

## 配置详解

正式环境可以用 service specification 描述 OSD 选择。下面仍是实验示例：

```yaml
service_type: osd             # 告诉 cephadm 这是 OSD 编排规范
service_id: lab_explicit_disks # 给规范稳定名称，避免和其他 OSD 规范混在一起
placement:
  hosts:
    - ceph-lab                # 只匹配明确主机，名称必须和 ceph orch host ls 一致
spec:
  data_devices:
    paths:
      - /dev/sdb              # 只允许使用已经核对为空的设备
      - /dev/sdc
      - /dev/sdd
```

把上面的内容保存为当前目录下的 `osd-spec.yaml`，先执行 dry run；只有预览中的主机和设备都正确，才可以去掉 `--dry-run`：

```bash
sudo cephadm shell --mount "$PWD" -- \
  ceph orch apply -i /mnt/osd-spec.yaml --dry-run # 只预览，不创建和清空 OSD
```

| 字段 | 含义 | 新手容易错在哪里 |
|---|---|---|
| `service_type` | 编排的服务类型 | 写成 daemon 名称或漏写 |
| `service_id` | 这组 OSD 规则的唯一名称 | 多份高级 spec 共用名称互相覆盖 |
| `placement.hosts` | 规则应用到哪些主机 | 主机名与 orchestrator 登记值不一致 |
| `data_devices.paths` | 明确允许使用的设备路径 | 设备名变化或误选业务盘 |
| `--dry-run` | 预览将创建哪些 OSD | 未预览就直接 apply |

生产中更适合按 rotational、model、vendor、size 等属性筛选，但必须先验证匹配结果。`ceph orch apply osd --all-available-devices` 会持续消费所有满足 available 条件的设备，不适合在不了解设备生命周期时随手执行。

## 入门实验：创建 pool 和 RBD image

### 实验目标

在前面的单主机集群创建一个 replicated pool，初始化 RBD，创建 1 GiB image，并验证集群保持可用。

### 实验步骤

```bash
sudo cephadm shell -- ceph osd pool create aiops-lab 32 # 创建 32 个 PG 的实验 pool
sudo cephadm shell -- ceph osd pool application enable aiops-lab rbd # 标记 pool 用于 RBD
sudo cephadm shell -- rbd pool init aiops-lab          # 初始化 RBD 所需的 pool 元数据
sudo cephadm shell -- rbd create aiops-lab/demo --size 1024 # 创建 1 GiB thin-provisioned image
sudo cephadm shell -- rbd ls --long aiops-lab          # 查看 image 名称、大小和格式
sudo cephadm shell -- rbd info aiops-lab/demo          # 查看 image 的 object size、features 和 ID
sudo cephadm shell -- ceph osd pool get aiops-lab all  # 查看 size、min_size、PG 和 CRUSH rule
sudo cephadm shell -- ceph -s                          # 确认集群最终回到稳定状态
```

`--single-host-defaults` 会调整单机实验的副本和 CRUSH 默认值，使副本可以落在同一主机的不同 OSD。这个设置不能证明主机级高可用，不能复制到生产方案。

### 预期结果

- `rbd ls --long aiops-lab` 能看到 `demo`，大小为 1 GiB。
- `ceph osd pool get aiops-lab all` 显示 replicated pool、PG 数和副本参数。
- `ceph -s` 最终应为 `HEALTH_OK`，PG 为 `active+clean`。
- `ceph df detail` 能看到 `aiops-lab`，但新建 thin image 不会立刻消耗完整 1 GiB 物理容量。

### 验证结果

```bash
sudo cephadm shell -- rbd info aiops-lab/demo --format json-pretty # 用结构化输出保存实验证据
sudo cephadm shell -- ceph df detail --format json-pretty         # 保存 pool 容量与对象统计
sudo cephadm shell -- ceph health detail                          # 应输出 HEALTH_OK 或没有活动告警
```

### 如果没有成功

按顺序检查：

1. `ceph -s` 是否已经有 3 个 OSD 且全部 `up/in`。
2. `ceph orch device ls --wide` 是否仍有设备拒绝原因。
3. PG 是否卡在 `inactive`、`undersized` 或 `peering`。
4. `--single-host-defaults` 是否在 bootstrap 时使用。
5. pool 的 `size`、`min_size` 和 CRUSH rule 是否能在当前实验拓扑满足。
6. 容器镜像是否拉取成功，`ceph orch ps` 是否有 error daemon。
7. 主机时间、主机名解析、磁盘空间和容器运行时是否正常。

不要为了让实验变绿就把 pool `size` 强行改为 1。先理解副本无法放置的原因。

## 常用命令

```bash
ceph -s                            # 查看健康、服务、数据、I/O 和恢复总览
ceph health detail                # 展开每个健康检查代码和受影响对象
ceph versions                     # 查看各类 daemon 当前运行版本，发现混合版本
ceph quorum_status --format json-pretty # 查看 MON quorum 成员与 leader
ceph mgr services                 # 查看 dashboard、Prometheus 等模块地址
ceph orch ps                      # 查看 cephadm 管理的 daemon、主机、状态和镜像
ceph orch device ls --wide        # 查看设备是否可用于 OSD 及拒绝原因
ceph osd tree                     # 查看 CRUSH 层级与 OSD up/in 状态
ceph osd df tree                  # 查看 OSD 容量、利用率和分布偏差
ceph osd perf                     # 查看 OSD apply/commit latency 线索
ceph df detail                    # 查看集群和 pool 的原始、可用、已用容量
ceph pg stat                      # 汇总 PG 状态和恢复进度
ceph pg dump_stuck                # 查找长期 inactive、unclean、stale 等 PG
ceph osd pool autoscale-status    # 查看 PG autoscaler 建议和状态
ceph config dump                  # 查看集中配置数据库中已设置的值
ceph auth ls                      # 查看 Cephx entity 和 capabilities，不要公开 key
```

使用 cephadm 时，可以在每条命令前加 `sudo cephadm shell --`。把只读命令纳入自动采集前，应使用最小权限 Cephx entity，不要把 `client.admin` keyring 复制到监控服务器。

## 命令字典

| 命令 | 作用 | 关键字段 / 状态 | 正常结果 | AIOps 场景 | 常见坑 |
|---|---|---|---|---|---|
| `ceph -s` | 集群总览 | health、services、data、io、recovery | 稳态通常为 HEALTH_OK | 值班总入口 | HEALTH_OK 不代表应用性能一定正常 |
| `ceph health detail` | 展开健康检查 | check code、affected object | 无活动告警 | 告警路由和 Runbook 选择 | 只 mute 不处理根因 |
| `ceph versions` | 查看 daemon 版本 | mon、mgr、osd、mds、rgw | 升级后逐步收敛到目标版本 | 关联升级窗口 | 混合版本在升级中可能是正常状态 |
| `ceph quorum_status` | 查看 MON 共识 | quorum、rank、leader、epoch | 预期 MON 在 quorum | 控制面故障定位 | 只看进程在线，不看是否进 quorum |
| `ceph orch ps` | 查看编排 daemon | status、age、host、image | daemon 为 running | 容器和服务生命周期 | Ceph health 与容器状态混为一谈 |
| `ceph orch device ls` | 查看设备清单 | available、rejected reasons | 目标空盘为 Yes | 自动发现和扩容审批 | 把有数据设备误当可用盘 |
| `ceph osd tree` | 查看 OSD 与 CRUSH | up/down、in/out、weight、host | OSD up/in 且拓扑正确 | 故障域影响分析 | up/in 不能证明磁盘性能正常 |
| `ceph osd df tree` | 看容量分布 | reweight、use、var、avail | 利用率相对均衡 | 容量热点和预测 | 看到偏差就手工乱调 reweight |
| `ceph osd perf` | 看 OSD 延迟线索 | commit/apply latency | 结合历史基线判断 | slow ops 初筛 | 不是完整客户端端到端延迟 |
| `ceph df detail` | 看集群和 pool 容量 | raw、avail、used、objects | 有恢复和增长余量 | 预计耗尽时间 | 忽略副本、EC 与 full ratio 开销 |
| `ceph pg stat` | 看 PG 汇总 | active、clean、degraded、recovering | 稳态 active+clean | 恢复进度和冗余风险 | 扩容恢复期短暂非 clean 可能正常 |
| `ceph pg dump_stuck` | 找长期异常 PG | inactive、unclean、stale | 无长期 stuck PG | 自动生成问题清单 | 未带持续时间就过度告警 |
| `ceph osd pool autoscale-status` | 看 PG 建议 | pg_num、new_pg_num、mode | 建议与 pool 规模匹配 | PG 规划 | 频繁手工调整造成迁移 |
| `ceph config dump` | 看显式配置 | who、name、value、level | 变更有记录可解释 | 配置漂移检测 | 没显示的默认值不代表不存在 |
| `ceph auth ls` | 看身份和 caps | entity、mon/osd/mds/mgr caps | 最小权限且有所有者 | 账号审计 | 输出可能包含敏感 key 信息 |
| `rbd ls --long` | 看 RBD image | size、format、features、parent | image 与申请一致 | PVC / VM 卷盘点 | image 名称与业务 owner 脱节 |
| `ceph fs status` | 看 CephFS | MDS rank、client、pool、activity | active MDS 和 standby 正常 | 文件服务健康 | RADOS 健康不等于 MDS 无瓶颈 |
| `radosgw-admin sync status` | 看 RGW multisite 同步 | realm、zone、metadata/data sync | 同步延迟满足目标 | 对象容灾 RPO | 单站点 RGW 不适用该检查 |

## PG 状态怎么读

| 状态 | 意思 | 第一检查点 |
|---|---|---|
| `active+clean` | PG 可服务且副本完整 | 稳态正常 |
| `degraded` | 部分对象副本缺失或过期 | down/out OSD、恢复进度 |
| `undersized` | acting set 数量少于 pool size | CRUSH 是否有足够故障域和 OSD |
| `peering` | OSD 正在确认 PG 权威历史 | 相关 OSD、网络和日志 |
| `inactive` | PG 不能正常服务 I/O | 立即确认 acting set 和丢失 OSD |
| `stale` | MON 长时间收不到 PG 状态 | primary OSD 或网络是否失联 |
| `remapped` | PG 临时映射到新 OSD | 扩容、故障恢复或 CRUSH 变化 |
| `recovering` | 正在补齐对象副本 | 恢复速率与客户端延迟 |
| `backfill_wait` | 等待迁移数据 | backfill 并发、容量和优先级 |
| `inconsistent` | scrub 发现副本不一致 | scrub detail、设备错误和修复流程 |

状态组合要连起来看。例如 `active+undersized+degraded` 说明还能服务，但副本数量不足；`inactive+peering` 表示当前不能正常服务，风险更高。

## 容量与 full ratio

Ceph 容量不能只看磁盘标称总和：

```text
raw capacity
  - replication or EC overhead
  - filesystem and BlueStore metadata
  - unavailable or out OSD capacity
  - recovery and backfill safety headroom
  = usable business capacity
```

图中的 raw capacity 是原始介质容量，replication/EC overhead 是副本或纠删码额外消耗，metadata 是系统元数据，headroom 是恢复与回填的安全余量；最后才得到可承诺的业务容量。该图是估算关系，不能把控制台不同口径字段直接相减。

集群会使用 nearfull、backfillfull 和 full ratio 保护数据。达到 nearfull 应进入容量治理；达到 backfillfull 可能阻塞回填；达到 full 会阻止部分写入以避免彻底填满设备。

```bash
ceph osd dump | grep -E 'full_ratio|backfillfull_ratio|nearfull_ratio' # 查看当前保护阈值
ceph osd df tree                                             # 找出最满 OSD 和分布偏差
ceph df detail                                               # 查看 pool 与集群容量口径
```

不要把调高 full ratio 当作扩容。先确认增长来源、最满 OSD、失败 OSD、PG 分布、快照、删除回收和扩容交付时间。

## Prometheus 与 AIOps

Ceph MGR 的 Prometheus 模块默认通过 HTTP 暴露指标，官方默认端口为 `9283`。cephadm bootstrap 默认还会部署监控栈，实际服务地址用 `ceph mgr services` 查询。

```bash
ceph mgr module enable prometheus # 启用 Prometheus 模块；已启用时重复执行不会创建第二份数据
ceph mgr services                 # 找到 prometheus endpoint 和 dashboard 地址
curl --fail http://127.0.0.1:9283/metrics | head # 在 endpoint 所在主机验证指标输出
```

生产抓取周期要和模块的 `mgr/prometheus/scrape_interval` 协调。官方不建议低于 10 秒，并推荐从 15 秒起步。大集群中抓取性能计数需要成本，缓存过期时 endpoint 可能返回 `503`，所以监控还要告警 exporter 新鲜度。

官方可见的关键指标类型包括：

- `ceph_health_detail`：按 health check code 暴露是否活动。
- `ceph_pool_metadata`：把 pool ID 与名称等元数据关联。
- `ceph_osd_metadata`：把 OSD 与主机、device class、地址关联。
- `ceph_disk_occupation_human`：帮助把 OSD 和 node_exporter 的磁盘指标关联。

建议建立以下告警：

| 规则 | 为什么重要 | 降噪方式 |
|---|---|---|
| MON 不在 quorum | 控制面无法提交 map | 按多数派与持续时间升级 |
| OSD down | 副本可能减少 | 关联 host、rack、PG 和维护窗口 |
| OSD up 但 out / down 但 in | 状态与数据放置不一致 | 区分计划操作和意外故障 |
| PG inactive / stale | 数据可能不可用 | 立即按受影响 pool 和业务升级 |
| PG degraded / undersized | 冗余降低 | 结合持续时间、剩余副本和恢复速度 |
| nearfull / backfillfull / full | 可能阻塞恢复或写入 | 结合预计耗尽时间和最满 OSD |
| slow OSD heartbeat | 网络或忙 OSD 线索 | 关联多对 OSD、交换机和恢复流量 |
| slow ops | 客户端请求被阻塞 | 关联 daemon、设备、网络和变更 |
| MDS damage / laggy | CephFS 元数据服务风险 | 只路由给使用 CephFS 的业务 |
| RGW 5xx / latency | 对象接口异常 | 按 zone、bucket、operation 聚合 |
| recovery 长期无进展 | 冗余无法恢复 | 看 bytes remaining 和恢复速率 |
| scrape 失败或样本过旧 | 形成观测盲区 | 单独监控 endpoint 和时间戳 |

### AIOps 数据流

```text
Ceph daemon metrics + logs + health checks（守护进程指标、日志与健康检查）
  -> Prometheus / log platform / event bus（指标库、日志平台与事件总线）
  -> topology（拓扑）：service（服务） -> pool（池） -> PG（放置组） -> OSD（数据进程） -> host（主机） -> rack（机架）
  -> anomaly detection and change correlation（异常检测与变更关联）
  -> alert + evidence + Runbook（告警、证据与操作手册）
  -> approved action（经审批执行）
  -> verify PG, latency, capacity and business SLO（复核放置组、延迟、容量与业务目标）
```

适合自动化的低风险动作包括查询健康、收集日志、保存 map、关联最近变更和生成工单。`ceph osd lost`、purge OSD、强制 PG 修复、降低 `min_size`、修改 CRUSH 或删除 pool 都可能造成数据损失，不能由模型根据单条告警直接执行。

## 常见故障排查

### HEALTH_WARN 不知道先看什么

先运行：

```bash
ceph -s             # 看健康摘要、服务、容量、PG 和恢复是否同时异常
ceph health detail  # 获取稳定的 health check code 和受影响对象
ceph orch ps        # 对照 daemon 容器状态和最近刷新时间
```

按 health check code 进入对应 Runbook。不要把整个 `HEALTH_WARN` 当成一个告警规则，也不要没有 TTL 地长期 mute。

### OSD down

检查顺序：

1. `ceph osd tree` 确认 OSD 是 down/in 还是 down/out。
2. `ceph orch ps --daemon-type osd` 找到 daemon、host 和容器状态。
3. 在目标主机检查 systemd、container runtime、设备、I/O error 和磁盘空间。
4. `ceph health detail` 与 `ceph pg stat` 判断副本和业务风险。
5. 检查 OSD heartbeat 网络、MTU、丢包、交换机和时间同步。

进程崩溃可以重启，物理盘故障需要替换，主机失联要修主机或网络。三种原因不能用同一个“restart OSD”动作处理。

### PG 长期 peering 或 inactive

先找 PG ID 和 acting set：

```bash
ceph pg dump_stuck inactive # 找出不能正常服务的 PG
ceph pg '<pg-id>' query     # 替换为上一条返回的目标 PG ID；查看 peering、blocked_by 和历史信息
ceph osd tree               # 对照 acting set 中 OSD 是否 up/in
```

常见原因包括多个相关 OSD 同时丢失、MON map 不一致、网络分区、OSD 磁盘问题或历史不完整。不要在不知道权威副本时执行破坏性 PG 操作。

`'<pg-id>'` 是模板：把整个尖括号内容替换成已核对的 PG 标识并保留引号，不能原样执行。引号确保参数不会被 Shell 解释成输入输出重定向。

### 集群接近 full

```bash
ceph df detail    # 看哪个 pool 增长和业务对象数量变化
ceph osd df tree  # 看最满 OSD、host 和利用率偏差
ceph osd dump     # 看 nearfull、backfillfull 和 full ratio
```

先阻止非关键增长，确认是否有 down/out OSD 使可用容量下降，再评估扩容、数据迁移、过期数据删除或 pool 策略调整。删除大量对象后还要观察回收速度和最满 OSD 是否下降。

### slow ops 或客户端延迟高

对齐同一时间窗口：

- `ceph health detail` 中 slow ops 和 slow heartbeat。
- `ceph osd perf` 的 OSD 延迟线索。
- node_exporter 的磁盘 await、queue、util 和网络丢包。
- recovery、backfill、deep scrub 和 rebalance 进度。
- RBD、CephFS、RGW 客户端延迟与业务请求量。
- 最近扩容、故障、升级、CRUSH、网络和 pool 变更。

单 OSD 慢重点查设备和主机；同机多个 OSD 慢重点查主机资源和 NIC；跨机 OSD heartbeat 同时慢重点查网络；所有业务在恢复期变慢要评估恢复与客户端 I/O 的资源竞争。

### 新磁盘显示 Available: No

`ceph orch device ls --wide` 会显示拒绝原因。常见原因是存在分区、文件系统、LVM、挂载点、BlueStore 签名，设备太小或 orchestrator 尚未刷新。

不要为了变成 Yes 直接执行 zap。先用 `lsblk`、`blkid`、`pvs`、`vgs`、`lvs` 查明设备来源，确认变更批准和数据所有者。

### MON 不在 quorum

检查 MON 主机解析、时间同步、网络连通、端口、防火墙、磁盘空间、进程日志和 monmap。只有少数派 MON 存活时，盲目在每台机器重建 MON 可能让状态更乱。

先保护现有多数派与数据目录，再按官方 MON 恢复流程处理。

### CephFS 卡顿

```bash
ceph fs status   # 看 active/standby MDS、client 和 metadata pool
ceph mds stat    # 看 rank 和 daemon 状态
ceph health detail # 查 MDS laggy、damage、cache 或 RADOS 底层告警
```

如果 metadata pool 或底层 RADOS 不健康，先恢复底层。只有 CephFS 目录操作慢时，再查 MDS CPU、内存、cache、client capability recall 和热点目录。

### RGW 返回 5xx

先区分负载均衡器、RGW daemon、认证、bucket index、底层 pool 和 multisite 同步。检查 RGW 日志、`ceph orch ps --daemon-type rgw`、集群健康、RGW pool 容量和请求操作类型。

S3 compatible 不等于支持 AWS S3 的全部行为。应用依赖特性要对照当前 Ceph S3 API 支持表。

### 扩容后恢复流量影响业务

新增 OSD 会改变 PG 映射并触发 backfill。先确认这不是设备故障，再观察客户端延迟、网络、最满 OSD、recovery/backfill 速率和预计完成时间。

限速是业务与恢复风险之间的取舍：恢复太快可能影响前台，恢复太慢会延长冗余降低窗口。参数调整必须有基线、审批、期限和恢复后回退。

## 升级与变更

Cephadm 支持编排滚动升级，但“滚动”不等于没有风险。升级前至少完成：

- 当前版本仍在支持期，目标版本的升级路径受官方支持。
- 所有 daemon 版本、容器镜像和操作系统兼容性已核对。
- 集群健康，PG 没有未知 inactive、inconsistent 或长期恢复问题。
- MON quorum、MGR standby、MDS standby 和业务故障域满足维护要求。
- 容量有足够 recovery/backfill headroom。
- RBD、CephFS、RGW 和上层 Kubernetes/OpenStack 兼容性已验证。
- 配置、CRUSH map、auth、service spec 和关键 dashboard 已备份并脱敏保存。
- 有停止条件、业务验证、回退或支持升级路径。

```bash
ceph -s                                      # 升级前确认集群健康且所有主机在线
ceph versions                                # 记录升级前各类 daemon 的版本
ceph orch upgrade start --ceph-version '<版本号>' # 替换为经兼容性验证和审批的精确目标版本
ceph orch upgrade status                     # 持续观察阶段、失败和剩余 daemon
ceph versions                                # 验证各 daemon 是否收敛到目标版本
```

镜像必须使用官方发布说明给出的完整地址和 tag 或 digest。不要把 `<target-image>` 原样复制执行。

上面的 `'<版本号>'` 也只是占位符，必须替换为已审批的完整目标版本并保留引号。引用参数不是安全性审批：只有前置健康检查、兼容验证和恢复准备全部满足时，才能启动升级。

## 面试怎么讲

Ceph 的底层是 RADOS。客户端从 MON 获取 cluster map 并通过 Cephx 认证，把 RBD、CephFS 或 RGW 的数据转换为 RADOS object；对象先映射到 pool 和 PG，再由 CRUSH 根据 host、rack 等故障域计算 primary 与 replica OSD。客户端直接访问 primary OSD，primary 协调其他副本，所以 MON 不在正常数据转发路径。OSD 使用 BlueStore 管理设备并执行复制、恢复和 scrub，MGR 提供监控与编排，MDS 只服务 CephFS 元数据，RGW 提供 S3/Swift HTTP 接口。排障时我先看 health code，再沿 service、pool、PG、acting set、OSD、host、device 和 network 定位，并把恢复流量、容量、版本和最近变更一起关联。

## 学习检查清单

- [ ] 我能解释 RADOS 与 RBD、CephFS、RGW 的关系。
- [ ] 我能说出 MON、MGR、OSD、MDS、RGW 各自职责。
- [ ] 我能画出 object 到 pool、PG、CRUSH 和 OSD 的映射链。
- [ ] 我能解释客户端为什么不通过 MON 转发正常数据。
- [ ] 我能区分 OSD up/down 与 in/out。
- [ ] 我能解释 PG、acting set、peering、recovery 和 backfill。
- [ ] 我能说明 replication 和 erasure coding 的取舍。
- [ ] 我能解释 CRUSH failure domain 为什么必须匹配真实拓扑。
- [ ] 我能用 cephadm 搭建单机学习集群并创建 RBD image。
- [ ] 我能读懂 active+clean、degraded、undersized、inactive 和 inconsistent。
- [ ] 我能排查 OSD down、PG stuck、nearfull 和 slow ops。
- [ ] 我能把 Ceph health、metrics、logs、topology 和 change 接入 AIOps。

## 面试题

1. Ceph 的 RADOS 是什么？
2. MON、MGR、OSD、MDS 和 RGW 分别负责什么？
3. Ceph 客户端为什么可以直接访问 OSD？
4. object、pool、PG、CRUSH 和 OSD 的映射关系是什么？
5. PG 为什么不能直接用 object 替代？
6. OSD 的 up/down 和 in/out 有什么区别？
7. `active+undersized+degraded` 表示什么风险？
8. CRUSH 如何利用 host 和 rack 故障域放置副本？
9. replication 与 erasure coding 如何选择？
10. recovery、backfill、rebalance 和 scrub 有什么区别？
11. RBD、CephFS 和 RGW 的数据路径有什么不同？
12. CephFS 为什么需要 MDS，而 RBD 和 RGW 不使用 CephFS MDS？
13. 一个 OSD down 后，你会怎样判断是否需要立即升级事件？
14. PG 长期 peering 时应检查哪些对象？
15. 集群 nearfull 时为什么不能只提高 full ratio？
16. 如何区分磁盘慢、主机慢、网络慢和 recovery 竞争？
17. Ceph Prometheus endpoint 返回 503 可能是什么原因？
18. 为什么单主机 3 OSD 实验不能证明生产高可用？
19. 如何用 AIOps 降低 Ceph 告警噪声？
20. Cephadm 升级前必须完成哪些检查？

## 老师带练：读懂降级，并把副本真正恢复

### 先讲清两个“多数”并不是同一个规则

MON 的多数派决定集群地图等控制状态能否达成共识；数据池的 `size` 与 `min_size` 则影响数据副本与继续 I/O 的条件。不能把 MON 的三台坏一台结论，直接套在任意 EC 或副本池上。OSD 的 `up/down` 表示进程可达状态，`in/out` 表示是否参与放置；一个 OSD 可以暂时 down 但仍 in，等待恢复或后续迁移。

再看 PG：`active` 表示能服务，`clean` 表示副本达到完整状态。两者像“今天还可以开门营业”和“仓库备货恢复齐全”，不是同一件事。服务恢复但冗余未恢复时，还处于风险窗口；值班事件不能只因为首页打开就结束。

### 实验前提与停止条件

只在本文新建的、没有任何业务数据的三 OSD 单机虚拟机中做下面实验。必须已完成基础实验。`--single-host-defaults` 的默认副本数未必是 3，因此先核对三个 OSD 都 `up/in`、实验池使用单机 OSD 故障域规则，再仅给这个新建的 `aiops-lab` 池设置下列实验保护目标。这是在有足够 OSD 时建立三副本基线，不是在故障后降低安全阈值：

```bash
sudo cephadm shell -- ceph osd pool set aiops-lab size 3
sudo cephadm shell -- ceph osd pool set aiops-lab min_size 2
sudo cephadm shell -- ceph -s
```

等待所有 PG `active+clean`，确认 `size=3`、`min_size=2`，且 `osd.0` 确实属于这台实验机。若放置规则无法满足三副本或任何 PG 未完成同步，停止并排查，不继续故障注入，更不能改生产池。

本实验只停一个数据进程，不停整个 OSD service，不拔盘，不清空设备，不强行声明数据丢失。官方提供单 daemon 的停止与启动接口，同时明确警告不要随意并行重启整组 OSD。[Cephadm 运维文档](https://docs.ceph.com/en/tentacle/cephadm/operations/)

### 精确步骤、预期与恢复

在实验 Linux 主机运行以下命令。`osd.0` 中的 0 是确认后的进程编号，不是磁盘名称。

```bash
sudo cephadm shell -- ceph osd pool get aiops-lab size
sudo cephadm shell -- ceph osd pool get aiops-lab min_size
sudo cephadm shell -- ceph osd tree
sudo cephadm shell -- ceph -s
sudo cephadm shell -- ceph orch daemon stop osd.0
sudo cephadm shell -- ceph health detail
sudo cephadm shell -- ceph pg stat
sudo cephadm shell -- rbd info aiops-lab/demo
```

等待状态传播后，应看到一个 OSD down、部分 PG 降级或副本不足；因为剩余两个副本满足前提，`rbd info` 应仍可读取元数据。它只证明这个元数据请求成功，不证明数据库读写压测或持久化验收成功。不同状态出现顺序受故障检测和放置影响，不要求输出逐字一致；记录实际时间和状态，不长期停着等待更多 OSD 自动退出放置。

随后立即恢复同一个进程：

```bash
sudo cephadm shell -- ceph orch daemon start osd.0
sudo cephadm shell -- ceph osd tree
sudo cephadm shell -- ceph pg stat
sudo cephadm shell -- ceph health detail
sudo cephadm shell -- rbd info aiops-lab/demo
```

持续查询直到 OSD `up/in`、PG 恢复 `active+clean`。若 OSD 被自动标记 out，先确认原进程与磁盘完整，再按官方 OSD 恢复流程评估重新加入；不要继续停第二个 OSD。启动失败先查 `ceph orch ps --daemon-type osd`、该 daemon 日志、容器运行时、设备及主机空间，不使用 purge、zap 或降低 `min_size`。

清理只针对实验对象：确认 `aiops-lab/demo` 没有任何需要保留的数据后，可执行 `sudo cephadm shell -- rbd rm aiops-lab/demo` 移除这一个测试镜像。pool 和集群可以保留用于下一课；不在教程里给出通配清盘命令。整套环境废弃时，在虚拟化平台核对这台专用虚拟机及三块实验磁盘的归属，再按实验资产销毁流程处理。

### 从三副本走到生产容量题

假设 3 台主机各提供 10 TiB 原始容量，三副本理论上只能容纳约 10 TiB 业务数据，还未扣元数据和恢复余量。更重要的是：副本故障域设为 host 时，坏一台后只剩两个 host，无法在它们上面重新凑出三个不同主机副本。总空间看起来还很多，规则也可能根本放不下第三份。

所以生产设计要回答“坏掉一个故障域后，能否在剩余故障域恢复到目标副本数”，不只是“现在能存多少”。若要求故障后仍完成重建，主机数、机架数、网络与剩余容量要一起满足。把故障域偷偷改成 OSD 虽可能让图变绿，却降低了原本承诺的保护等级。

### 面试答案与递进追问

**30 秒：**Ceph 用 RADOS 统一保存对象，客户端从 MON 获取地图后直接访问 OSD。PG 是对象放置与恢复的中间单位，CRUSH 按真实故障域选 OSD；上层 RBD、CephFS、RGW 提供不同接口，不能混为一种文件格式。

**3 分钟：**沿一次请求讲对象、PG、主副本、其他副本和持久化，再讲 MON 共识与数据副本的差别；用本实验解释 active 与 clean；最后讲容量余量、恢复对前台延迟的竞争、最小权限、备份和升级停止条件。

**追问：全局只有 70% 为什么停止回填？**先找最满的 OSD、CRUSH 约束和目标池的可用空间，全局平均值会掩盖局部满盘。提高 full 阈值不能创造物理空间，应查分布、故障域余量和增长来源。

**追问：如何处理一次扩容后 slow ops？**先确认扩容时间、PG remap、回填进度、网络与磁盘排队；用未参与本次迁移的池或 OSD 作对照。经审批调整恢复调度时，同时监控业务 p99 和副本风险窗口，写下恢复原参数的条件。不要把所有后台恢复永久关掉换取一时“快”。

**追问：升级失败能直接换旧镜像吗？**不保证。磁盘格式、特性位和集群要求可能已经变化；先暂停后续升级、保护健康多数派与副本，再按该发行版支持路径恢复。应用镜像回滚经验不能直接套在存储数据格式上。

## 请求深讲：客户端缓存和集群确认之间还有一道边界

老师给你两份结果：虚拟机写文件很快，OSD 磁盘吞吐却没有同步增加。这一定是指标错了吗？不一定，数据可能仍在客户机、虚拟化层或 RBD 客户端缓存。缓存让写入合并、读取复用，降低每次访问远端的成本，但也改变“当前这个返回值证明什么”。观察应用写入、刷新请求、客户端缓存和 OSD 确认，需要知道使用的是内核 RBD 还是用户态 librbd，以及缓存策略。

按照[该分支 RBD 缓存文档](https://docs.ceph.com/en/tentacle/rbd/rbd-config-ref/)，用户态库有自己的缓存，适当的 flush 请求会把脏数据提交到 OSD。脏数据不是损坏数据，而是尚未完成向下层写出的修改。不同缓存策略的返回条件不同，不能从小文件快速写入直接推导断电持久性。这里也不能把客户端 LRU 缓存、OSD 内部缓存和数据库缓冲池当成一个可以统一调大的参数。

验收数据库卷时，要说明数据库提交是否要求日志持久化，客户机是否正确传递刷新语义，所用驱动与虚拟化平台是否在支持矩阵内。测试集要足够覆盖真实工作负载，同时记录是否命中缓存。多个客户端并发访问同一个块镜像，还需要符合业务的协调和文件系统语义；普通文件系统不会因为底层 Ceph 有副本就自动变成多主共享文件系统。不要在两台主机同时挂载一个普通文件系统做“高可用测试”。

## 状态深讲：peering 为何要先确认历史

故障发生后，新的一组 OSD 不能仅凭“我本地对象最多”就宣布自己拥有全部正确数据。它们需要依据 PG 相关历史与日志确认哪些更新被接受、谁缺少哪些内容，才能安全恢复服务。这个协调过程就是 peering。它回答的是一组副本如何建立共同的有效状态，不是把全部对象都复制完。因此 peering 完成、可以服务、恢复完整副本，可能发生在不同时间。

某个必要历史所在的 OSD 不可达时，其他进程虽然在线，PG 仍可能无法推进。此时故障域、进程数量和权威数据是三个不同问题。先查询 PG 的 acting set、阻塞原因和历史，寻找可能包含必要数据的原 OSD。不能用“多数机器还活着”证明可以丢弃那个失联副本，更不能通过声明数据丢失来换一个绿色状态。

[官方 PG 状态说明](https://docs.ceph.com/en/tentacle/rados/operations/pg-states/)把恢复排队、目标过满、缺失对象等状态分别列出。若状态是等待恢复资源，查并发与优先级；若目标过满，查目标容量和放置约束；若缺失必要对象，查原始副本与支持恢复流程。三个状态看起来都像进度不动，修复方向完全不同。写 Runbook 时以健康代码和具体状态分流，比对所有异常统一重启更可靠。

## 隔离实验：纸面验证恢复位置与数据版本

没有专用磁盘时，先用一张表练习，不执行任何 Ceph 命令。准备三个虚构 OSD，分别位于甲、乙、丙主机，同一个对象最近已确认版本为七。正常轮三者都记录版本七，预期可服务且满足三副本目标。故障轮让丙失联，甲乙仍有版本七；在题目明确满足继续 I/O 条件的前提下，可以把服务可用与冗余不足分开记录。

现在加入丁主机作为候选位置，但只剩极少容量。先预测能否立刻恢复三副本，再核对故障域与容量两道条件。预期存在丁这个名字仍不够，还必须有空间和受支持的恢复路径。恢复轮给丁提供足够的虚构可用空间，并在表里把数据同步状态从待恢复改成完成，最后才标为三份完整。清理只丢弃表内模拟状态；它没有证明 Ceph 具体算法输出，也不代替前文单 OSD 的真实隔离实验。

追加一题：甲乙的数据都是六，只有失联丙可能有七，能否按两个比一个宣布版本六正确？不能。课堂题已经告诉你最新确认版本为七，数量票决不能替代数据历史确认。应保护仍可能有必要数据的设备并进入有证据的恢复流程。这项反例帮助理解为什么遇到 incomplete 或 unfound 等状态不能随意强制操作。

## 生产设计追问：为什么一块快速设备故障会影响多个 OSD

BlueStore 的数据设备与元数据、日志相关设备可以存在不同布局。为了提高性能，一些部署让多个 OSD 使用同一块快速设备承载相应 DB/WAL 内容。这样节省设备并提升部分访问性能，却可能形成共同依赖：快速设备故障影响的不是一个数据盘，而是一组 OSD。具体划分、容量和恢复要求按目标部署设计核对，不能只按“一个 OSD 一块盘”估算故障面。

台账应把每个 OSD 对应的主机、数据设备、DB/WAL 设备、设备类别与网络连接一起记录。告警发现同一批 OSD 同时变慢时，沿共同依赖追查，比独立创建几十张磁盘工单更有效。扩容评审也应问快速设备是否还有余量、故障后会同时损失多少副本、替换过程中能否保持其他故障域安全。

本轮只完成文档与离线推理核对，未下载或安装 Ceph、未使用空盘、未启动集群、未停 OSD。下一次取得隔离环境后，应把工具、容器镜像、各 daemon 版本、缓存设置和工作负载一起写入记录。真实的服务恢复、冗余恢复与性能恢复分别验收，三者都完成才关闭一次存储事故。

进一步阅读[BlueStore 设备布局](https://docs.ceph.com/en/tentacle/rados/configuration/bluestore-config-ref/)时，DB 指的是该存储引擎的元数据设备，不是业务数据库；WAL 是引擎预写日志，也不是客户机数据库日志。台账中必须带组件归属，才能避免把同名术语关联到错误的故障路径。

## 学习证据

学习完成后，建议提交：

- `labs/ceph/architecture.md`：对象到 OSD 的数据流与故障域图。
- `labs/ceph/osd-spec.yaml`：只包含虚拟实验盘的 OSD spec。
- `labs/ceph/ceph-status.txt`：脱敏的 `ceph -s` 输出。
- `labs/ceph/osd-tree.txt`：脱敏的 `ceph osd tree` 输出。
- `labs/ceph/rbd-info.json`：实验 RBD image 信息。
- `labs/ceph/capacity.json`：`ceph df detail` 的脱敏输出。
- `labs/ceph/health-runbook.md`：从 health code 到排障动作的 Runbook。
- `labs/ceph/incident-review.md`：一次 OSD down 或 PG degraded 模拟复盘。
- 一篇“为什么 Ceph 不是很多硬盘组成的普通 RAID”学习笔记。

不要公开真实 `ceph.conf`、keyring、FSID、主机名、IP、bucket、用户、access key、secret key、业务 pool、CRUSH 拓扑、日志包或客户数据。`client.admin` keyring 拥有高权限，绝不能提交到 GitHub。

## 本文边界与下一步

本文覆盖从零理解 Ceph 到完成第一个实验和 AIOps 运维的主线，但不能代替生产硬件规划、性能压测、网络设计、灾备方案和版本升级手册。

下一步建议：

1. 用 3 台 Linux 虚拟机各放 1 个 OSD，重做 host failure domain 实验。
2. 深入 RBD snapshot、clone、mirroring 和 Kubernetes CSI。
3. 深入 CephFS subvolume、MDS cache、standby-replay 和客户端驱逐。
4. 深入 RGW realm、zonegroup、zone、bucket index 与 multisite sync。
5. 学习 EC profile、device class、CRUSH rule 和容量模型。
6. 把 Ceph Prometheus、node_exporter、容器日志、变更记录和业务 SLO 接入统一 AIOps 看板。
