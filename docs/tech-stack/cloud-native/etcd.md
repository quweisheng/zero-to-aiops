# etcd 深讲

> 学习目标：从零理解 etcd 的 Raft、多数派、MVCC、revision、Watch、Lease、事务和存储维护，能运行一个安全的学习实例，完成读写、并发控制、快照和故障实验，能分析 Kubernetes 因 etcd 延迟、无 Leader、空间告警或证书问题导致的控制面故障，并能回答平台工程岗位的连续追问。

## 官方资料

- [etcd v3.6 文档](https://etcd.io/docs/v3.6/)
- [etcd API 设计](https://etcd.io/docs/v3.6/learning/api/)
- [Raft 学习资料](https://etcd.io/docs/v3.6/learning/)
- [运维指南](https://etcd.io/docs/v3.6/op-guide/)
- [配置参数](https://etcd.io/docs/v3.6/op-guide/configuration/)
- [维护指南](https://etcd.io/docs/v3.6/op-guide/maintenance/)
- [灾难恢复](https://etcd.io/docs/v3.6/op-guide/recovery/)
- [监控指标](https://etcd.io/docs/v3.6/metrics/)
- [性能与硬件建议](https://etcd.io/docs/v3.6/op-guide/performance/)
- [传输安全](https://etcd.io/docs/v3.6/op-guide/security/)
- [Kubernetes 运维 etcd](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)

说明：本文以 etcd 3.6 API 和运维文档为主。实验固定使用明确版本，生产部署应核对 Kubernetes 兼容矩阵、etcd 发布说明和最新补丁，不要只把镜像标签改成 `latest`。

## 官方知识地图

```text
etcd
  -> KV API
     -> Range / Put / Delete
     -> Transaction
     -> revision / version
  -> Watch API
     -> 按 key 或前缀监听
     -> 从指定 revision 续看
     -> compacted revision 后重新 List
  -> Lease API
     -> TTL
     -> KeepAlive
     -> 过期删除绑定 key
  -> Raft
     -> Leader / Follower / Learner
     -> 日志复制
     -> 多数派提交
  -> Storage
     -> WAL
     -> snapshot
     -> MVCC backend
     -> compact / defrag
  -> Operations
     -> TLS / Auth
     -> member management
     -> metrics / alarm
     -> backup / restore / upgrade
```

本文按“先单机理解 API，再理解三节点一致性，最后进入 Kubernetes 生产运维”的顺序学习。

## 场景开场

凌晨两点，业务 Pod 还在跑，用户请求暂时也能返回，但所有新 Pod 都创建失败，`kubectl` 时快时慢，Deployment 无法扩容。有人说“应用没挂，先等等”，也有人准备重启所有控制面节点。

真正的问题可能在 etcd：磁盘 `fsync` 延迟升高，Leader 反复切换，API Server 写请求无法在超时前提交。旧 Pod 不依赖每次请求都访问 API Server，所以还能继续工作；但调度、扩容、更新和控制器收敛都被卡住。

这类故障如果不懂多数派和写入链路，很容易把“控制面不可写”误判成“工作负载全部不可用”，或者在最危险的时候同时重启多个成员。

## 一句话人话版

etcd 是一个用 Raft 保证多副本一致的键值存储，专门保存少量但关键的系统状态，并向客户端提供可靠读写、监听变化和租约能力。

## 小白可能会问

- etcd 看起来只是 `key=value`，为什么比 Redis 复杂？
- 三个成员为什么只能同时坏一个？四个成员为什么没有明显更可靠？
- Leader 挂了以后，已经运行的 Kubernetes Pod 会不会立刻消失？
- `compact` 和 `defrag` 为什么不是一回事？
- 快照文件存在就等于可以恢复吗？
- Watch 断线后怎样保证不漏掉变化？

## 为什么要学

对 Kubernetes 来说，etcd 保存 API 对象的持久状态。Deployment、Secret、ConfigMap、Node、Lease、RBAC 和 CRD 等最终都以存储版本进入 etcd。etcd 不健康时，常见表现不是某一个业务接口报错，而是整个控制面的创建、更新、调度和控制循环一起变慢。

平台工程、SRE、DevOps 面试通常不会只问“etcd 是什么”，还会追问：

1. Raft 写请求怎样提交？
2. 为什么推荐奇数成员？
3. 线性一致读和串行化读有什么区别？
4. 如何备份、验证和恢复？
5. 磁盘慢为什么会触发 Leader 切换？
6. 数据库空间告警如何处理，为什么不能直接删除数据目录？

## etcd 是什么

etcd 是一个强一致、高可用的分布式键值存储。它通过 gRPC 提供 KV、Watch、Lease、Auth、Cluster 和 Maintenance 等 API，通过 Raft 在成员之间复制日志。

它适合保存：

- 集群配置和元数据。
- 服务成员、选主锁和租约状态。
- 需要按 revision 观察变化的控制面数据。
- 数据量不大、但错误写入或丢失会影响整个系统的关键状态。

它不适合保存：

- 大文件和对象存储数据。
- 高频日志流或海量时序数据。
- 依赖复杂 SQL 查询的业务数据。
- 把成员数不断增加来换取吞吐量的场景。

## 它解决什么问题

- 多个控制面实例需要看到一致状态。
- 写入需要有全局顺序，避免不同副本各说各话。
- 客户端需要监听状态变化，而不是持续全量轮询。
- 临时成员和锁需要在客户端失联后自动过期。
- 并发更新需要比较版本，避免后写覆盖先写。
- 少数成员故障时，系统仍应继续读写并恢复副本。

## 学习路径

```text
基础层
  -> key / value
  -> revision / version
  -> put / get / delete
  -> watch / lease / txn
  -> snapshot

原理层
  -> Raft Leader
  -> WAL 与多数派提交
  -> MVCC
  -> 线性一致读
  -> compact 与 defrag

生产层
  -> 3/5 成员与故障域
  -> TLS 与最小访问面
  -> 磁盘延迟和容量
  -> 备份恢复演练
  -> 成员替换与滚动升级
  -> Kubernetes 控制面联动排障
```

## 架构和端口

```text
客户端 / kube-apiserver
  -> 2379 client URL
  -> etcd member
     -> KV / Watch / Lease API
     -> Raft
     -> WAL + snapshot + backend

member-1 <-> 2380 peer URL <-> member-2
member-2 <-> 2380 peer URL <-> member-3
member-3 <-> 2380 peer URL <-> member-1
```

| 概念 | 作用 | 排障重点 |
|---|---|---|
| client URL | 客户端访问的地址，常用 2379 | 证书 SAN、监听和 advertise 地址 |
| peer URL | 成员间 Raft 通信地址，常用 2380 | 双向网络、peer TLS、成员配置 |
| member | 一个 etcd 进程和数据目录 | member ID、name、data-dir |
| Leader | 接收并排序一致性写入 | Leader 切换、心跳、磁盘延迟 |
| Follower | 复制日志并参与投票 | 与 Leader 的网络和应用延迟 |
| Learner | 只学习日志、暂不参与投票 | 追平后再提升，避免直接改多数派 |

## 一次写请求怎样完成

```text
客户端 Put
  -> 任意 member 接收
  -> 转给 Leader
  -> Leader 生成 Raft 日志
  -> 写 WAL
  -> 复制给 Followers
  -> 多数派确认
  -> 标记 committed
  -> 各成员应用到 MVCC backend
  -> 返回新的 revision
  -> Watchers 收到事件
```

关键点：

- 写入延迟受 Leader、网络往返和多数派成员磁盘共同影响。
- 只要多数派存活，少数成员离线不阻止提交。
- 多数派丢失后，旧数据可能仍能被部分成员读到，但不能安全提交新状态。
- 客户端超时不一定代表写入一定失败；请求可能已经提交但响应丢失，重试要考虑幂等和比较条件。

### 写入坏了怎么查

1. `endpoint status` 确认 Leader、Raft term、revision 和 DB 大小。
2. `endpoint health` 验证一次真实提案能否提交。
3. 看 `etcd_server_has_leader` 和 Leader 切换次数。
4. 看 WAL `fsync`、backend commit 延迟分位数。
5. 检查成员间 2380 网络、丢包、时钟和 CPU 抢占。
6. 最后才考虑成员替换；不要先重启多数成员。

## Raft、多数派和奇数成员

### 是什么

Raft 是 etcd 用来选 Leader、复制日志并让成员对提交顺序达成一致的共识算法。

### 为什么需要

如果三个副本可以独立接受写入，网络分区后会产生互相冲突的状态。Raft 要求写入得到多数派确认，确保两个合法多数派一定至少共享一个成员，避免出现两个都能提交写入的分区。

### 容错计算

可容忍永久故障数：

```text
floor((N - 1) / 2)
```

| 投票成员 | 多数派 | 可容忍故障 | 结论 |
|---:|---:|---:|---|
| 1 | 1 | 0 | 只适合学习 |
| 2 | 2 | 0 | 任意一个故障都不能写 |
| 3 | 2 | 1 | 常见生产起点 |
| 4 | 3 | 1 | 比 3 成员多成本，容错未增加 |
| 5 | 3 | 2 | 更高可用，但写入需要更多复制 |

### 设计取舍

- 增加成员提高的是容错，不会线性提高写吞吐量。
- 跨很远地域部署会把网络 RTT 放进每次一致性写入延迟。
- 3 个成员适合三个独立故障域；5 个成员用于确有两成员容错需求的场景。
- 不要把 etcd 放进自动伸缩组随意替换，成员身份和数据目录需要受控管理。

## Leader 选举和 term

Follower 在选举超时内收不到 Leader 心跳，会增加 `term` 并发起选举。获得多数票的候选者成为新 Leader。

频繁选举通常不是“Raft 太敏感”，而是证据：

- Leader 磁盘 `fsync` 停顿。
- CPU 长时间被抢占。
- 成员间网络抖动或丢包。
- 虚拟化宿主机暂停。
- 心跳和选举超时不适合实际 RTT。

不要把调大超时当成唯一修复。超时过大也会延长真实 Leader 故障的恢复时间。

## MVCC、revision 和 version

MVCC 是 Multi-Version Concurrency Control，多版本并发控制。etcd 不只保存 key 当前值，还用全局 revision 给已提交修改排序。

| 字段 | 人话解释 | 常见用途 |
|---|---|---|
| `revision` | 整个 keyspace 最近一次提交的全局版本 | Watch 续传、快照点 |
| `create_revision` | 该 key 第一次创建时的 revision | 判断创建时间线 |
| `mod_revision` | 该 key 最近修改时的 revision | CAS 并发更新 |
| `version` | 该 key 从创建后被修改的次数 | 判断是否首次创建 |
| `lease` | 绑定的租约 ID | 临时 key 生命周期 |

一次事务可以修改多个 key，但它们共享同一个提交 revision。revision 不是每个 key 独立自增，也不是墙上时钟。

### 并发更新为什么要比较 revision

两个客户端都读到旧值，然后直接 `put`，后提交者会覆盖前者。安全做法是事务比较：只有 `mod_revision` 仍等于读取时的值才更新，否则重新读取并计算。

```text
读取 key 和 mod_revision=20
  -> 计算新值
  -> txn compare mod_revision == 20
     -> 成功：写入新值
     -> 失败：说明别人先改了，重新读取
```

这就是 Compare-And-Swap，简称 CAS。

## 线性一致读和串行化读

默认一致性读取会确保结果不落后于已完成写入，通常需要和 Leader 协调。串行化读取使用 `--consistency=s`，可以由当前成员直接返回，延迟可能更低，但可能读到稍旧数据。

选择原则：

- 选主锁、配置更新确认、并发控制使用线性一致读。
- 允许短暂陈旧的监控或只读列表可以评估串行化读。
- 不要为了压低延迟，把所有读取都改成串行化后再假设它是最新值。

## Watch：从变化中持续构建状态

Watch 可以监听一个 key 或前缀，并从指定 revision 接收后续事件。

```text
先 List 得到当前对象和 revision=100
  -> 从 revision=101 开始 Watch
  -> 收到 PUT / DELETE
  -> 本地缓存更新
  -> 连接中断后从最后 revision 续看
```

Kubernetes controller 的 List-Watch/Informer 思路就建立在这类能力上。

### Watch 不是永久事件仓库

历史 revision 会被 compact。客户端落后到已清理的 revision 时会收到 compacted 错误，正确处理是重新 List 当前状态，再从新 revision 建立 Watch。

坏了怎么查：

- Watch 数量是否异常增长。
- 客户端消费是否太慢。
- 是否反复从过旧 revision 重连。
- compact 策略是否过激或完全没配置。
- API Server/客户端是否实现了重新 List。

## Lease：让临时状态自动过期

Lease 是带 TTL 的租约。key 可以绑定到租约；客户端持续 KeepAlive，租约过期或被 revoke 时，绑定 key 会被删除并产生 Watch 事件。

常见用途：

- 服务成员在线状态。
- 分布式锁持有者。
- Leader Election 的临时记录。

注意：Lease 表示“在一段时间内收到续租”，不等于业务进程一定健康。进程可能还能续租，但内部工作线程已经阻塞，因此仍要配合业务健康检查。

## Transaction：原子条件判断

etcd Transaction 由三部分组成：

```text
Compare
  -> 条件成立执行 Success 操作
  -> 条件不成立执行 Failure 操作
```

它可以比较 value、version、create revision 或 mod revision，再执行多个 Range、Put、Delete 操作。事务是实现锁、选主和安全配置更新的基础，但复杂协调优先使用成熟客户端库。

## WAL、snapshot 和 backend

| 存储部分 | 作用 | 故障关注点 |
|---|---|---|
| WAL | Write-Ahead Log，提交前先写的顺序日志 | `fsync` 延迟、磁盘损坏 |
| Raft snapshot | 截断过长 Raft 日志所需的状态快照 | 生成和发送快照压力 |
| backend | 保存 MVCC keyspace 的持久数据库 | DB 配额、碎片、提交延迟 |
| data-dir | 一个成员的完整本地状态目录 | 不能在运行中随意复制或跨成员复用 |

快照命令生成的灾备文件和 Raft 内部 snapshot 不是完全相同的运维概念。面试时要先问清楚对方指“内部日志压缩”还是“可恢复备份”。

## compact 和 defrag

`compact` 删除指定 revision 以前的历史 MVCC 版本，使旧 Watch 无法再从这些版本续看。它解决逻辑历史增长。

`defrag` 重写某个成员的 backend 文件，回收 compact 后仍占据的物理空间。它解决磁盘文件碎片。

```text
历史版本很多
  -> compact 清理逻辑历史
  -> backend 仍可能很大
  -> 逐成员 defrag 回收物理空间
```

注意：

- 先确认备份和监控，再维护。
- defrag 是逐成员操作，可能阻塞该成员读写。
- 不要同时对所有生产成员 defrag。
- Kubernetes 场景优先遵循发行版和官方维护流程。

## 成员变更和 Learner

直接加入一个落后很多的投票成员会改变多数派并增加复制压力。Learner 先作为非投票成员追日志，追平后再 promote 为投票成员，更适合安全替换。

成员替换顺序通常是：

```text
确认集群当前有多数派和备份
  -> 添加 Learner
  -> 等待追平
  -> promote
  -> 删除旧成员
  -> 验证 endpoint 与告警
```

一次只做一个成员变更。不要在集群已失去多数派时继续按普通扩缩容流程操作。

## etcd 与 Kubernetes 的关系

```text
kubectl / controller / scheduler
  -> kube-apiserver
  -> 认证 / 鉴权 / 准入 / 校验
  -> etcd

etcd 不直接理解 Pod
etcd 保存的是 API Server 序列化后的资源状态
```

重要边界：

- kubelet 和 Pod 不会为每个业务请求访问 etcd。
- etcd 故障时，已运行容器通常继续运行。
- 新建、更新、调度和控制器收敛会受影响。
- 不应让普通用户或工作负载绕过 API Server 直接读写 Kubernetes 的 etcd。
- etcd 快照包含 Secret 等敏感集群状态，必须加密、限制访问并审计。

## 安装与启动：单节点学习环境

下面实验使用 Docker 和 etcd 3.6.0，只用于学习。生产必须使用受支持补丁、TLS、独立故障域、备份和容量监控。

```powershell
docker run -d --name etcd-lab `
  -p 2379:2379 -p 2380:2380 `
  quay.io/coreos/etcd:v3.6.0 `
  etcd `
  --name s1 `
  --data-dir /etcd-data `
  --listen-client-urls http://0.0.0.0:2379 `
  --advertise-client-urls http://127.0.0.1:2379 `
  --listen-peer-urls http://0.0.0.0:2380 `
  --initial-advertise-peer-urls http://127.0.0.1:2380 `
  --initial-cluster s1=http://127.0.0.1:2380 `
  --initial-cluster-state new
```

验证：

```powershell
docker exec etcd-lab etcdctl endpoint health # 发起一次真实提案，正常应显示 is healthy
docker exec etcd-lab etcdctl endpoint status --write-out=table # 查看 Leader、revision 和 DB 大小
```

如果没有成功，先检查：

1. `docker ps -a --filter name=etcd-lab` 看容器是否退出。
2. `docker logs etcd-lab` 看参数、端口和数据目录错误。
3. 本机 2379/2380 是否被占用。
4. 镜像是否成功拉取。

## 基础实验：KV、Watch、Lease 和事务

### 1. 写入和读取

```powershell
docker exec etcd-lab etcdctl put /aiops/config/version v1 # 写入配置版本，返回 OK
docker exec etcd-lab etcdctl get /aiops/config/version --write-out=json # 查看值和 revision 元数据
docker exec etcd-lab etcdctl put /aiops/services/order 10.0.0.10 # 写入第一个服务地址
docker exec etcd-lab etcdctl put /aiops/services/pay 10.0.0.11 # 写入第二个服务地址
docker exec etcd-lab etcdctl get /aiops/services/ --prefix # 按前缀读取全部服务
```

### 2. Watch

终端 A：

```powershell
docker exec -it etcd-lab etcdctl watch /aiops/config/ --prefix # 持续监听配置前缀
```

终端 B：

```powershell
docker exec etcd-lab etcdctl put /aiops/config/version v2 # 终端 A 应收到 PUT 事件
```

### 3. Lease

```powershell
docker exec etcd-lab etcdctl lease grant 20 # 创建 20 秒 TTL，记下返回的 lease ID
docker exec etcd-lab etcdctl put /aiops/agents/agent-01 online --lease=<LEASE_ID> # 把临时成员绑定到租约
docker exec etcd-lab etcdctl lease timetolive <LEASE_ID> --keys # 查看剩余 TTL 和绑定 key
```

不续租时，约 20 秒后执行：

```powershell
docker exec etcd-lab etcdctl get /aiops/agents/agent-01 # 正常应没有返回值
```

### 4. 事务比较

```powershell
docker exec -it etcd-lab etcdctl txn
```

交互输入：

```text
value("/aiops/config/version") = "v2"

put /aiops/config/version v3

get /aiops/config/version
```

第一段是 Compare，第二段是 Success，第三段是 Failure，空行用于结束每一段。正常应显示事务成功并把值更新为 `v3`。

## 故障实验：Watch 落后于 compact

### 实验目标

理解控制器为什么必须能在 Watch 历史不可用时重新 List，而不是无限重连旧 revision。

### 步骤

```powershell
docker exec etcd-lab etcdctl put /aiops/lab/key one
docker exec etcd-lab etcdctl endpoint status --write-out=json # 记录当前 revision，例如 12
docker exec etcd-lab etcdctl put /aiops/lab/key two
docker exec etcd-lab etcdctl put /aiops/lab/key three
docker exec etcd-lab etcdctl compact <CURRENT_REVISION> # 清理该 revision 及以前的历史
docker exec etcd-lab etcdctl watch /aiops/lab/key --rev=1 # 从过旧 revision 监听
```

预期结果：Watch 被取消，并提示所需 revision 已 compact。正确恢复思路：

```powershell
docker exec etcd-lab etcdctl get /aiops/lab/key --write-out=json # 重新 List 当前值并取得新 revision
```

然后从新 revision 的下一位重新 Watch。不要把 compact 当成数据损坏，也不要删除 data-dir。

## 快照、验证和恢复演练

### 创建快照

```powershell
docker exec etcd-lab etcdctl snapshot save /tmp/etcd-snapshot.db # 从在线成员保存快照
docker exec etcd-lab etcdutl snapshot status /tmp/etcd-snapshot.db --write-out=table # 验证 revision、key 数和哈希
docker cp etcd-lab:/tmp/etcd-snapshot.db .\etcd-snapshot.db # 把备份复制到宿主机
```

只执行 `snapshot save` 不够，至少还要验证：

- 命令成功退出。
- `snapshot status` 可读。
- 文件被复制到独立故障域。
- 备份被加密并限制访问。
- 定期在隔离环境完成恢复演练。

### 恢复边界

恢复会生成新的数据目录和集群身份。生产 Kubernetes 恢复前应停止所有 API Server，避免旧控制面继续向正在恢复的 etcd 写入。etcd 3.6 应使用 `etcdutl snapshot restore`，不要把旧教程里的 `etcdctl snapshot restore` 当成长期方案。

```powershell
docker run --rm `
  -v ${PWD}:/backup `
  -v etcd-restore-data:/restore `
  quay.io/coreos/etcd:v3.6.0 `
  etcdutl snapshot restore /backup/etcd-snapshot.db --data-dir=/restore
```

实验恢复到新目录后，先隔离验证，不要覆盖正在运行的 `etcd-lab` 数据目录。

## 配置字典

| 参数 | 作用 | 常见设置 | 关键风险 |
|---|---|---|---|
| `--name` | 成员名称 | 每个成员唯一 | 名称和 initial-cluster 不一致 |
| `--data-dir` | WAL、snapshot、backend 目录 | 独立低延迟磁盘 | 复用别的成员目录 |
| `--listen-client-urls` | 本机监听客户端连接 | `https://0.0.0.0:2379` | 监听公网但无认证 |
| `--advertise-client-urls` | 告知客户端的可达地址 | 稳定 IP/DNS | 发布 127.0.0.1 或不可达地址 |
| `--listen-peer-urls` | 本机监听成员连接 | `https://0.0.0.0:2380` | 防火墙阻断双向连接 |
| `--initial-advertise-peer-urls` | 向集群发布 peer 地址 | 稳定成员地址 | 证书 SAN 不匹配 |
| `--initial-cluster` | 首次启动的成员清单 | `name=url,...` | 已有集群仍使用 `new` |
| `--initial-cluster-state` | 新建或加入既有集群 | `new` / `existing` | 误建平行集群 |
| `--quota-backend-bytes` | backend 配额 | 结合容量和告警设置 | 到配额触发 NOSPACE |
| `--auto-compaction-mode` | 自动压缩模式 | `periodic` 或 `revision` | 历史太短导致 Watch 频繁重列 |
| `--auto-compaction-retention` | 历史保留窗口 | 按恢复和 Watch 延迟设计 | 完全不 compact 导致空间增长 |
| `--snapshot-count` | 触发内部 snapshot 的提交数 | 按版本默认和负载评估 | 过小增加快照压力 |
| `--client-cert-auth` | 要求客户端证书 | 生产建议启用 | 证书轮换失误导致全拒绝 |
| `--peer-client-cert-auth` | 验证 peer 证书 | 生产建议启用 | peer SAN 或 CA 不一致 |

## etcdctl / etcdutl 命令字典

| 命令 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `endpoint health` | 验证端点能提交提案 | `etcdctl --cluster endpoint health` | 每个端点 healthy | 只检查一个成员 |
| `endpoint status` | 看 Leader、term、revision、DB | `--write-out=table` | 成员状态一致 | 误把 DB 大小差异当数据不一致 |
| `member list` | 查看成员身份和 peer URL | `etcdctl member list -w table` | 成员均 started | 残留旧 member |
| `alarm list` | 查看 NOSPACE/CORRUPT 等告警 | `etcdctl alarm list` | 正常为空 | 未解决根因就 disarm |
| `get --prefix` | 按前缀读取 | `get /aiops/ --prefix` | 返回匹配 key | 生产直接全量扫大前缀 |
| `watch` | 监听变化 | `watch /aiops/ --prefix` | 持续收到事件 | 未处理 compacted revision |
| `lease timetolive` | 查看租约和 key | `--keys` | 显示 TTL | 把租约当业务健康 |
| `compact` | 清理历史 revision | `compact <rev>` | compact 完成 | 选择过新的 revision |
| `defrag` | 回收物理碎片 | 逐端点执行 | DB 文件缩小 | 同时阻塞全部成员 |
| `snapshot save` | 创建在线快照 | `snapshot save file.db` | saved snapshot | 备份仍放原磁盘 |
| `etcdutl snapshot status` | 离线检查快照 | `-w table` | 显示 hash/revision | 只看文件存在 |
| `etcdutl snapshot restore` | 恢复到新 data-dir | `--data-dir` | 生成恢复目录 | API Server 未停止 |

TLS 客户端常用参数：

```bash
etcdctl \
  --endpoints=https://etcd-1:2379,https://etcd-2:2379,https://etcd-3:2379 \
  --cacert=/etc/etcd/pki/ca.crt \
  --cert=/etc/etcd/pki/client.crt \
  --key=/etc/etcd/pki/client.key \
  endpoint health --cluster
```

## 生产架构检查单

### 高可用

- 使用 3 或 5 个投票成员，分布到独立故障域。
- 让 API Server 使用多个 endpoint，或采用经过验证的客户端负载策略。
- 任何维护前确认当前多数派和 Leader 稳定。
- 一次只滚动一个成员。
- 成员替换优先 Learner 流程。

### 性能和容量

- WAL 和 backend 使用稳定、低延迟的 SSD。
- 避免与高 I/O 工作负载共享磁盘和宿主机。
- 监控 WAL `fsync` 和 backend commit 的 P99。
- 监控 DB 总大小、实际使用大小和配额比例。
- 控制单个 value 大小、事务操作数、Watch 数和客户端并发。
- 不用增加成员数解决写吞吐瓶颈。

### 安全

- client 和 peer 通信都启用 TLS。
- 限制 2379/2380 网络访问面。
- Kubernetes etcd 不给普通工作负载直连。
- 快照按最高敏感等级保护。
- 规划证书有效期、轮换和回滚。
- 开启所需认证和审计，保留成员变更记录。

### 变更和灾备

- 升级前阅读版本兼容和降级限制。
- 先做快照并验证恢复。
- 先升级非 Leader 还是 Leader应遵循当前版本官方升级流程，不自行猜测顺序。
- Kubernetes 恢复要同时考虑 API Server、证书、静态 Pod manifest 和外部依赖。
- 定义 RPO、RTO，并以恢复演练结果而不是口头承诺验收。

## 在 AIOps 中的作用

etcd 属于控制面关键状态存储。AIOps 不应只看“进程是否存活”，而要把共识、磁盘、容量和上层 API 信号关联起来。

| 信号 | 说明 | 建议关联 |
|---|---|---|
| `etcd_server_has_leader` | 当前成员是否看到 Leader | API Server 写错误 |
| `etcd_server_leader_changes_seen_total` | Leader 切换累计数 | 网络、磁盘、CPU 抖动 |
| `etcd_server_proposals_failed_total` | 提案失败数 | 写请求失败 |
| `etcd_server_proposals_pending` | 待处理提案 | 控制面拥塞 |
| `etcd_disk_wal_fsync_duration_seconds` | WAL 落盘延迟 | 磁盘延迟 P99 |
| `etcd_disk_backend_commit_duration_seconds` | backend 提交延迟 | DB/磁盘压力 |
| `etcd_mvcc_db_total_size_in_bytes` | DB 文件总大小 | 配额、compact/defrag |
| `etcd_mvcc_db_total_size_in_use_in_bytes` | 实际使用空间 | 碎片比例 |
| gRPC 请求指标 | 请求数、错误码和延迟 | API Server 流量变化 |

指标名称会随版本调整，接入前以当前 `/metrics` 和官方文档为准。

一个有效告警链路：

```text
WAL fsync P99 升高
  -> proposals pending 增长
  -> API Server 写延迟升高
  -> controller workqueue 堆积
  -> Pod 创建和 rollout 变慢
```

## 常见故障排查

### 集群没有 Leader

- 现象：`has_leader=0`，写入失败，成员反复选举。
- 检查：成员存活数、2380 网络、peer TLS、磁盘延迟、CPU、term 变化。
- 处理：优先恢复能组成多数派的原成员；不要复制别的成员 data-dir 冒充。

### 写延迟突然升高

- 现象：API Server timeout，WAL `fsync` P99 升高。
- 检查：Leader 所在磁盘、虚拟化抢占、快照/备份任务、Follower 确认延迟。
- 处理：消除 I/O 争用或故障设备，确认多数派稳定后再迁移成员。

### `mvcc: database space exceeded`

- 现象：NOSPACE alarm，新写入被拒绝。
- 检查：DB 总大小、in-use 大小、配额、自动 compact 状态。
- 处理：备份，compact 合理 revision，逐成员 defrag，确认空间下降后再 disarm；不要先 disarm 再不处理根因。

### Watch 报 compacted

- 现象：客户端从旧 revision 重连失败。
- 检查：客户端最后 revision、compact 窗口、消费延迟。
- 处理：重新 List 当前状态，再从新 revision Watch。

### TLS 握手失败

- 现象：`x509`、unknown authority、certificate expired。
- 检查：CA、用途、SAN、系统时间、证书有效期、client/peer 是否混用。
- 处理：按轮换方案逐成员更新并验证，保留旧证书回滚窗口。

### 成员状态不一致或残留

- 现象：`member list` 有 unstarted 成员，健康检查只部分成功。
- 检查：member ID、name、peer URL、initial-cluster-state、data-dir 来源。
- 处理：先确认多数派和备份，再按成员替换流程修复。

### 数据损坏告警

- 现象：CORRUPT alarm 或成员哈希不一致。
- 检查：磁盘/文件系统错误、官方 corruption 流程、可用快照和健康成员。
- 处理：隔离损坏成员，按官方流程从健康状态恢复；不要手工编辑 backend。

## Kubernetes 控制面事故推演

题目：三控制面节点的 Kubernetes 集群中，业务 Pod 正常，但创建 Pod 超时，etcd Leader 每分钟切换，WAL `fsync` P99 为 1.8 秒。你怎么处理？

回答框架：

1. **限定影响**：说明现有数据面可能继续工作，但控制面写入、调度和收敛受影响，暂停发布和自动扩缩容变更。
2. **保存证据**：API Server 延迟/错误、etcd endpoint status、Leader 变化、磁盘延迟、成员日志、Node 资源。
3. **形成假设**：Leader 节点磁盘抖动导致心跳和日志复制超时，而不是先认定网络故障。
4. **交叉验证**：比较三成员磁盘延迟和 Leader 所在位置，检查 2380 RTT/丢包和宿主机事件。
5. **恢复方案**：消除 I/O 争用或受控迁移单个成员；始终保留多数派，不同时重启。
6. **验证**：Leader 稳定、endpoint health 全绿、fsync P99 恢复、API 写请求成功、controller 队列回落。
7. **复盘**：独立磁盘、宿主机反亲和、延迟告警、维护窗口、恢复演练和容量基线。

## 面试怎么讲

### 30 秒回答

etcd 是基于 Raft 的强一致分布式键值存储，Kubernetes 用它保存控制面状态。写请求由 Leader 排序，写 WAL 并复制到多数派后提交；MVCC revision 支持一致读取、事务和 Watch。生产重点是 3 或 5 个成员、低延迟磁盘、TLS、容量和备份恢复。排障先看 Leader 和多数派，再看 WAL fsync、网络、DB 配额和证书。

### 3 分钟回答

先讲定位：etcd 保存少量关键状态，不是业务大数据仓库。再讲写链路：客户端请求到成员，Leader 生成 Raft 日志，WAL 落盘并复制，多数派确认后提交到 MVCC backend，再向 Watcher 推送 revision 事件。然后讲高可用：3 成员容忍 1 个故障，5 成员容忍 2 个，4 成员并不比 3 成员多容忍故障；成员跨故障域但不能让 RTT 失控。最后讲运维：监控 Leader、提案、fsync、backend commit、DB 空间，定期 compact、逐成员 defrag、加密快照并做恢复演练。Kubernetes 控制面异常时，先保护多数派并暂停高风险变更，不能一上来重启所有控制面。

## 核心面试题与递进追问

### 1. 为什么 etcd 推荐奇数成员？

参考答案：Raft 写入需要多数派。3 和 4 成员都只能容忍 1 个故障，但 4 成员每次提交需要 3 个确认，成本更高且容错未增加，因此通常选 3 或 5。

追问：两个机房各放两个成员可以吗？

回答要点：四成员容错没有增加；任何一边网络分区都要看哪边有多数派。更关键的是故障域设计不能只追求“平均摆放”，要保证预期故障后仍有多数派，同时评估跨机房 RTT。

### 2. 默认读取一定经过 Leader 吗？

参考答案：客户端可以连接任意成员。线性一致读需要确认读点不落后于已提交写入，通常需要 Leader 协调；串行化读可由本地成员返回，但可能陈旧。

追问：监控列表能否全部改成串行化读？

回答要点：要看业务容忍的陈旧窗口，不能让监控结果参与需要最新状态的锁、并发控制或配置确认。

### 3. compact 和 defrag 的区别？

参考答案：compact 清理旧 revision 的逻辑历史；defrag 重写单成员 backend 回收物理文件空间。通常先 compact，再逐成员 defrag。

追问：为什么不能同时 defrag 三个成员？

回答要点：defrag 可能阻塞成员读写，同时执行会放大延迟甚至影响多数派提交。

### 4. 客户端 Put 超时后能否直接重试？

参考答案：超时只能说明客户端没有及时收到结果，写入可能已经提交。需要使用幂等 key、事务比较、请求语义或读回确认，不能假设一定没写。

### 5. 快照成功为什么仍可能无法恢复？

参考答案：文件可能损坏、证书和静态配置不匹配、恢复步骤未演练、RTO 不满足，或备份和原集群处于同一故障域。必须验证 snapshot status 并在隔离环境恢复。

### 6. etcd 挂了，业务 Pod 为什么还在跑？

参考答案：业务数据面不为每个请求访问 etcd。已有容器由节点上的 kubelet 和运行时维持；但控制面不能可靠创建、更新和调度，故障持续后节点状态和控制器动作会逐渐失去收敛能力。

## 系统设计题

设计一个承载 1000 节点 Kubernetes 集群的 etcd 方案。

至少覆盖：

- 选择 3 还是 5 成员及理由。
- 故障域和网络 RTT。
- 独立 CPU、内存和 SSD，WAL/backup 的隔离。
- client/peer TLS 与访问控制。
- DB 配额、compact、defrag 策略。
- 指标、日志和 SLO。
- 快照频率、加密、异地保存、RPO/RTO。
- 成员替换、证书轮换、补丁升级和回滚。
- API Server 并发和事件规模对 etcd 的压力测试。

## 学习检查清单

- [ ] 能画出一次写请求从客户端到多数派提交的路径。
- [ ] 能解释 3、4、5 成员的多数派和容错差异。
- [ ] 能区分 revision、mod_revision 和 version。
- [ ] 能说明线性一致读和串行化读的取舍。
- [ ] 能用 Transaction 实现 CAS 思路。
- [ ] 能解释 Watch 断线和 compacted 后的恢复。
- [ ] 能完成 Lease 过期实验。
- [ ] 能区分 compact、defrag 和 snapshot。
- [ ] 能创建、验证并隔离恢复快照。
- [ ] 能解释 etcd 故障对 Kubernetes 数据面和控制面的不同影响。
- [ ] 能按 Leader、多数派、磁盘、网络、容量、证书顺序排障。
- [ ] 能设计生产高可用、监控、升级和灾备方案。

## 学习证据

完成后提交：

- `etcd-lab.md`：KV、Watch、Lease 和 Transaction 实验记录。
- `etcd-write-path.md`：Raft 写入数据流图。
- `etcd-snapshot-runbook.md`：备份、验证、恢复和回滚步骤。
- `etcd-alerts.yml`：Leader、fsync、proposal、DB 配额告警草案。
- `etcd-incident-review.md`：一次无 Leader、NOSPACE 或磁盘延迟故障复盘。
- 脱敏后的 endpoint status、指标截图和恢复演练耗时。

## 本文边界与下一步

本文覆盖 etcd 3.6 从零到 Kubernetes 平台岗位面试所需主线，不展开 Raft 数学证明、源码中的 raft node 状态机、BoltDB 页结构和超大规模基准测试实现。下一步结合 [Kubernetes](./kubernetes.md)、[Calico](./calico.md)、[Cilium](./cilium.md) 和 [Apache ZooKeeper](../data-ai/zookeeper.md)，比较控制面状态、协调服务和网络数据面的不同故障模型。
