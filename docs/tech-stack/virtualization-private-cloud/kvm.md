# KVM 虚拟化深讲

> 学习目标：从零理解 KVM、QEMU、libvirt 和 `virsh` 的分工，能在 Linux 上创建一台虚拟机，读懂 CPU、内存、网络和存储数据路径，完成一次可回滚的网络故障实验，并能回答生产高可用、性能、安全、迁移与故障排查问题。

本文按“零基础能跑通、生产问题能分析、大厂面试能承受连续追问”的标准编写。它不能保证读完就通过面试；Linux、网络、存储、脚本、系统设计、项目经验和现场表达仍然需要单独练习。

## 官方资料

- [Linux 内核 KVM 文档](https://www.kernel.org/doc/html/latest/virt/kvm/index.html)
- [KVM API 总说明](https://www.kernel.org/doc/html/latest/virt/kvm/api.html)
- [QEMU System Emulation 文档](https://www.qemu.org/docs/master/system/index.html)
- [QEMU 命令行参考](https://www.qemu.org/docs/master/system/invocation.html)
- [QEMU 磁盘镜像文档](https://www.qemu.org/docs/master/system/images.html)
- [libvirt 文档入口](https://libvirt.org/docs.html)
- [libvirt QEMU/KVM 驱动](https://libvirt.org/drvqemu.html)
- [libvirt Domain XML](https://libvirt.org/formatdomain.html)
- [virsh 命令手册](https://libvirt.org/manpages/virsh.html)
- [libvirt 虚拟网络](https://libvirt.org/formatnetwork.html)
- [libvirt 存储管理](https://libvirt.org/storage.html)
- [libvirt 迁移](https://libvirt.org/migration.html)
- [libvirt 磁盘镜像链](https://libvirt.org/kbase/backing_chains.html)

说明：KVM 跟随 Linux 内核演进，QEMU、libvirt 和发行版软件包也各自发布版本。生产环境应以操作系统厂商支持矩阵为准，不要把网上某一条命令或某一个上游版本号当成所有环境的统一答案。

## 官方知识地图

KVM 不是一个单独安装后就包办所有事情的“虚拟化平台”。官方资料分散在四个层次：

```text
Linux 内核
  -> KVM API、vCPU、内存虚拟化、中断、设备直通

QEMU
  -> 虚拟机进程、机器类型、虚拟设备、磁盘镜像、QMP

libvirt
  -> Domain XML、生命周期、网络、存储、迁移、安全

管理工具或云平台
  -> virsh、virt-install、virt-manager、OpenStack 等
```

本文覆盖：

1. KVM、QEMU、libvirt、`virsh` 和 OpenStack 的边界。
2. 虚拟机启动、CPU 执行、内存映射、网络收发和磁盘 I/O 路径。
3. Domain XML、NAT、Linux Bridge、Virtio、qcow2、快照、备份和迁移。
4. Ubuntu 上可复现的单机实验与网络故障注入。
5. 生产高可用、容量、性能、安全、升级回滚和可观测性。
6. 递进面试题、系统设计题、事故复盘题和 GitHub 学习证据。

本文不展开 QEMU 每一种设备模型、每一个 CPU 架构或所有云平台实现，也不会把 Pacemaker、OpenStack、Ceph 再完整讲一遍。遇到这些边界时，会说明它们在 KVM 生产架构中的位置，并链接到对应技术栈。

## 两层学习路径

基础层：

```text
理解四个组件的分工
  -> 检查硬件虚拟化能力
  -> 安装 libvirt / QEMU / KVM
  -> 创建第一台虚拟机
  -> 看懂 XML、网络和磁盘
  -> 完成网络故障恢复
```

进阶层：

```text
画出 vCPU、内存、网络和存储路径
  -> 理解 live/config 两套状态
  -> 解释迁移与脏页收敛
  -> 设计高可用和故障隔离
  -> 做容量、性能、安全与升级方案
  -> 用证据完成事故诊断
```

## 场景开场

一台业务虚拟机突然变慢。虚拟机里看 CPU 使用率只有 40%，磁盘空间也没满，但接口延迟持续升高。

如果只登录虚拟机内部，你可能看不到宿主机 CPU 争用、NUMA 跨节点访问、虚拟磁盘后端延迟、`tap` 网卡丢包或 QEMU 进程被限流。KVM 运维真正难的地方，是把“客户机看到的现象”和“宿主机发生的事实”对应起来。

## 一句话人话版

KVM 让 Linux 内核借助 CPU 硬件运行虚拟机，QEMU 提供虚拟硬件，libvirt 负责统一管理它们。

## 小白可能会问

- KVM、QEMU 和 libvirt 到底谁才是虚拟机？
- 虚拟机是不是一个特殊的 Linux 进程？
- `virsh start` 以后，CPU、内存、网卡和磁盘分别经过哪里？
- KVM 和 VMware ESXi、容器、OpenStack 有什么区别？
- 宿主机坏了，KVM 会不会自动把虚拟机拉到另一台机器？

## 为什么 AIOps 工程师要学 KVM

很多 Kubernetes 节点、数据库服务器、监控平台和中间件实际运行在虚拟机里。上层看到的 CPU、内存、磁盘和网络异常，根因可能落在虚拟化层。

学习 KVM 后，你能把 AIOps 证据链补完整：

```text
业务延迟或错误
  -> 客户机进程与操作系统指标
  -> 虚拟机 vCPU / 内存 / 网卡 / 磁盘指标
  -> QEMU 进程与宿主机资源
  -> 物理 CPU / NUMA / 网卡 / 存储
```

常见价值包括：

- 资产关系：把业务、虚拟机、宿主机、存储卷和网络接口连成拓扑。
- 异常检测：识别 CPU steal、内存交换、磁盘延迟、丢包和宿主机超售异常。
- 根因分析：区分客户机内部、虚拟化层和物理基础设施故障。
- 自动化：通过 libvirt API 或管理平台执行受控的启动、迁移和资源调整。
- 容量规划：用峰值、超售比、故障域和迁移余量判断是否需要扩容。

## KVM 是什么

KVM 是 Kernel-based Virtual Machine 的缩写，中文通常叫“基于内核的虚拟机”。它是 Linux 内核中的虚拟化能力，通过 `/dev/kvm` 向用户态程序提供创建虚拟机和虚拟 CPU 的接口。

仅有 KVM 还不够。虚拟机还需要主板、磁盘控制器、网卡、固件和控制台等设备模型，这些通常由 QEMU 提供；运维又需要稳定的配置、权限、网络、存储和生命周期接口，这些通常由 libvirt 提供。

### 四个名字先分清

| 名称 | 它是什么 | 主要职责 | 出问题先看 |
|---|---|---|---|
| KVM | Linux 内核虚拟化模块 | vCPU 运行、内存虚拟化、中断和硬件加速接口 | `/dev/kvm`、内核模块、内核日志 |
| QEMU | 用户态虚拟机进程和设备模型 | 创建机器、虚拟设备、内存和 I/O 后端 | QEMU 进程、QEMU 日志、QMP |
| libvirt | 虚拟化管理 API 和守护进程 | 配置、生命周期、网络、存储、迁移与安全 | libvirt URI、服务、Domain XML、日志 |
| `virsh` | libvirt 命令行客户端 | 调用 libvirt API 管理虚拟机 | 连接 URI、权限、命令返回值 |

`virt-install` 用于创建虚拟机，`virt-manager` 是图形管理工具。它们最终也是通过 libvirt 管理 QEMU/KVM。

### KVM、QEMU、libvirt 和 OpenStack 的关系

```text
用户或自动化平台
  -> OpenStack Nova / virsh / virt-install
  -> libvirt API
  -> QEMU 虚拟机进程
  -> /dev/kvm
  -> Linux 内核与 CPU 虚拟化扩展
```

OpenStack 不是 KVM 的替代品。OpenStack 可以在大量计算节点上负责租户、镜像、网络、卷、调度和 API，底层计算虚拟化常见组合仍然是 QEMU/KVM + libvirt。

### KVM 和容器不是同一层

| 维度 | KVM 虚拟机 | Linux 容器 |
|---|---|---|
| 内核 | 每台虚拟机运行自己的客户机内核 | 容器共享宿主机内核 |
| 隔离边界 | 硬件虚拟化加独立内核 | namespace、cgroup 和安全策略 |
| 启动速度 | 通常慢于容器 | 通常更快 |
| 资源开销 | 包含客户机操作系统 | 通常更轻 |
| 典型用途 | 多操作系统、强隔离、传统应用、基础设施 | 微服务、弹性应用、标准化交付 |

二者可以叠加：Kubernetes 节点经常运行在 KVM 虚拟机上。

## 它解决什么问题

没有虚拟化时，一台物理服务器往往只能承载少量相互隔离困难的系统，硬件利用率、交付速度和故障隔离都受限制。

KVM 技术栈主要解决：

1. 在一台 Linux 主机上运行多个彼此隔离的操作系统。
2. 把 CPU、内存、网络和存储抽象成可配置的虚拟硬件。
3. 通过模板、克隆和自动化缩短环境交付时间。
4. 通过迁移、备份和外部集群管理提高可维护性与可用性。
5. 为 OpenStack 等 IaaS 平台提供计算虚拟化底座。

它不自动解决应用数据一致性、数据库高可用、跨机房容灾或业务无损切换。虚拟机重启成功，也不代表应用已经恢复服务。

## 核心架构

先看一台虚拟机启动后的整体关系：

```text
客户机操作系统
  -> vCPU / virtio-net / virtio-blk / virtio-scsi
  -> QEMU 进程和 vCPU 线程
  -> KVM、vhost、TAP、Linux Bridge、块设备后端
  -> Linux 调度器、内存管理、网络栈、存储栈
  -> 物理 CPU、内存、网卡、磁盘或共享存储
```

一台 QEMU/KVM 虚拟机通常对应宿主机上的一个 QEMU 进程。虚拟机的多个 vCPU 通常对应这个进程中的多个线程，所以宿主机调度器仍然决定这些 vCPU 线程什么时候获得物理 CPU 时间。

## 核心知识树

### 1. CPU 硬件虚拟化与 `/dev/kvm`

**是什么：** Intel VT-x 或 AMD-V 是处理器提供的硬件虚拟化扩展；Linux KVM 模块把这些能力暴露为 `/dev/kvm` 设备。

**为什么需要：** 如果没有硬件加速，QEMU 可以使用 TCG（Tiny Code Generator，动态翻译执行）模拟 CPU，但运行完整服务器工作负载通常会慢很多。

**怎么工作：** QEMU 打开 `/dev/kvm`，创建 VM 和 vCPU；vCPU 大部分时间直接在硬件支持的客户机模式执行，遇到特权操作、设备访问或某些异常时退出到 KVM/QEMU 处理，这叫 VM exit。

**怎么看：**

```bash
lscpu | grep -E 'Virtualization|Hypervisor' # 看 CPU 是否暴露虚拟化能力，以及当前系统是否本身运行在虚拟机中
ls -l /dev/kvm                              # 设备存在通常说明 KVM 模块和硬件能力已经可用
lsmod | grep -E '^kvm(_intel|_amd)?'         # 确认通用 KVM 模块和 Intel/AMD 模块是否加载
```

**坏了怎么查：** 先看 BIOS/UEFI 是否开启 VT-x/AMD-V，再看是否处于不支持嵌套虚拟化的上层虚拟机，最后检查 `dmesg | grep -i kvm` 和 `/dev/kvm` 权限。

### 2. QEMU 进程、vCPU 线程与 VM exit

**是什么：** QEMU 是承载虚拟机用户态部分的进程，负责机器模型、设备模型、内存映射和控制接口。

**为什么需要：** KVM 不负责模拟所有网卡、磁盘控制器、固件和显示设备；QEMU 把这些组件组合成客户机看到的一台“计算机”。

**怎么工作：** 客户机普通指令通过 KVM 在物理 CPU 上运行；需要用户态设备模型参与时产生 VM exit，QEMU 处理后再让 vCPU 继续执行。频繁 VM exit 会增加开销，因此 Virtio、vhost、设备直通等方案尽量缩短 I/O 路径。

**怎么看：**

```bash
pgrep -a qemu-system              # 查看所有 QEMU 虚拟机进程和启动参数
virsh domstats kvm-lab --vcpu     # 通过 libvirt 查看虚拟机 vCPU 累计运行统计
ps -T -p "$(pgrep -f 'guest=kvm-lab' | head -n1)" # 查看该 QEMU 进程的线程；名称和参数因发行版而异
```

**坏了怎么查：** 如果客户机 CPU 不高但响应慢，对照宿主机运行队列、vCPU 线程调度、CPU steal、NUMA 位置和中断负载，不要只看客户机 `%CPU`。

### 3. libvirt 连接与 Domain

**是什么：** libvirt 把一台虚拟机称为 Domain，提供统一 API 管理不同虚拟化后端。

**为什么需要：** 手写很长的 QEMU 命令难以长期维护，也难以统一权限、网络、存储、迁移和状态查询。

**怎么工作：** `virsh` 连接到一个 libvirt URI，例如服务器场景常用的 `qemu:///system`；libvirt 读取 Domain XML，准备磁盘、网络、安全标签和 cgroup，再启动 QEMU。

**怎么看：**

```bash
virsh uri                              # 显示当前实际连接的 URI
virsh -c qemu:///system list --all     # 明确查询系统级 QEMU/KVM 实例
virsh -c qemu:///session list --all    # 查询当前用户的会话级实例
```

**坏了怎么查：** “刚创建的虚拟机不见了”经常只是连接到了不同 URI。先执行 `virsh uri`，再检查 system/session、当前用户和远端主机是否一致。

### 4. 持久配置、运行配置和状态收敛

**是什么：** 持久 Domain 重启后仍有定义；临时 Domain 停止后定义消失。运行中的虚拟机还有一份 live 配置。

**为什么需要：** 运维变更可能只改当前运行状态、只改下次启动配置，或同时修改两者。如果不分清，重启后容易“配置回去了”。

**怎么工作：** `virsh define` 保存持久 XML，`virsh create` 从 XML 启动临时 Domain；许多设备或调优命令通过 `--live`、`--config` 或 `--current` 指定作用范围。

**怎么看：**

```bash
virsh dumpxml kvm-lab > live-or-current.xml       # 导出当前可见的 Domain XML
virsh dumpxml kvm-lab --inactive > next-boot.xml  # 导出下次启动使用的持久配置
diff -u next-boot.xml live-or-current.xml         # 对比运行态和持久态差异
```

**坏了怎么查：** 变更后先同时检查 live 与 inactive XML，再决定是否热更新、重启生效或回滚。不要直接编辑 libvirt 内部保存目录里的 XML 文件。

### 5. CPU 模型、拓扑、超售与亲和性

**是什么：** vCPU 是呈现给客户机的逻辑 CPU；CPU model 决定客户机看到哪些指令集特性；topology 描述 socket、core 和 thread。

**为什么需要：** CPU 模型影响性能、许可证、NUMA 和迁移兼容性。vCPU 数量不是越多越好，过多 vCPU 可能让调度等待更严重。

**怎么工作：** vCPU 线程由宿主机 Linux 调度器放到 pCPU 上运行。`host-passthrough` 通常暴露更多宿主机特性，但跨不同 CPU 的迁移兼容性更差；基线 CPU 模型牺牲部分特性换取迁移范围。

**怎么看：**

```bash
virsh vcpuinfo kvm-lab                     # 查看 vCPU 状态、运行时间和亲和性
virsh domstats kvm-lab --vcpu --balloon    # 同时查看 vCPU 与内存统计
virsh capabilities > host-capabilities.xml # 保存宿主机能力，做迁移和变更前证据
virsh domcapabilities > domain-caps.xml     # 查看当前组合可创建哪些虚拟机能力
```

**坏了怎么查：** 先比较 vCPU 数、宿主机 pCPU、运行队列和 CPU steal，再检查 pinning、NUMA、功耗模式和同宿主机其他虚拟机。不要看到“CPU 高”就直接加 vCPU。

### 6. 内存虚拟化、NUMA 与回收

**是什么：** 客户机看到的是 guest virtual/physical memory，KVM 和硬件的 EPT/NPT 二级页表再把它映射到宿主机物理内存。

**为什么需要：** 每台虚拟机需要独立地址空间，同时平台可能使用超售、balloon、KSM、透明大页或 HugeTLB 优化容量和性能。

**怎么工作：** QEMU 为虚拟机建立内存后端，KVM 管理客户机映射；宿主机 NUMA、页表、内存回收和交换都会影响虚拟机。Balloon 设备可让客户机驱动归还部分页面，但不能凭空创造内存。

**怎么看：**

```bash
virsh dommemstat kvm-lab                   # 查看客户机可用、未使用、balloon 等内存统计
numastat -p "$(pgrep -f 'guest=kvm-lab' | head -n1)" # 查看 QEMU 进程内存落在哪些 NUMA 节点
cat /proc/meminfo | grep -E 'MemAvailable|SwapFree|HugePages' # 查看宿主机可用内存、交换与大页
```

**坏了怎么查：** 分清“虚拟机分配了多少”“QEMU 实际驻留多少”“宿主机还能用多少”和“客户机还剩多少”。如果宿主机开始 swap，整批虚拟机都可能出现长尾延迟。

### 7. Virtio 与 vhost

**是什么：** Virtio 是面向虚拟化的半虚拟化设备规范；客户机使用 Virtio 驱动与宿主机后端通过共享队列交换请求。vhost 可以把部分数据面处理放到内核或专用后端。

**为什么需要：** 完整模拟传统硬件兼容性好，但设备寄存器访问和 VM exit 较多。Virtio 让客户机“知道自己在虚拟环境”，减少不必要的模拟开销。

**怎么工作：** 客户机把描述符放入 virtqueue，通知后端处理；后端完成 I/O 后更新队列并通知客户机。`virtio-net`、`virtio-blk`、`virtio-scsi` 和 balloon 都使用这类思路。

**怎么看：**

```bash
virsh dumpxml kvm-lab | grep -E "virtio|vhost" # 查看虚拟磁盘、网卡等是否使用 Virtio 模型
ethtool -i eth0                              # 在客户机里查看网卡驱动，接口名可能不是 eth0
lsblk -o NAME,TYPE,TRAN,SIZE                 # 在客户机里观察虚拟磁盘呈现方式
```

**坏了怎么查：** 新系统通常自带 Virtio 驱动；旧系统尤其是 Windows 需要准备驱动。设备不可见时同时检查 Domain XML、客户机驱动和 QEMU 日志。

### 8. 虚拟网络

**是什么：** libvirt 可以创建 NAT 虚拟网络，也可以把虚拟机接入 Linux Bridge、Open vSwitch、macvtap 或 SR-IOV VF。

**为什么需要：** 开发实验只需要方便联网，生产业务可能需要二层接入、VLAN、带宽控制、多队列、网络策略或接近物理网卡的性能。

**怎么工作：** 默认 NAT 网络常见路径如下：

```text
客户机 virtio-net
  -> QEMU / vhost-net
  -> TAP 设备 vnetN
  -> Linux Bridge virbr0
  -> 宿主机路由与 NAT
  -> 物理网卡
```

桥接网络常见路径如下：

```text
客户机 virtio-net
  -> TAP 设备
  -> 生产 Linux Bridge
  -> 物理网卡或 bond
  -> 交换机 VLAN
```

**怎么看：**

```bash
virsh domiflist kvm-lab       # 查看虚拟机网卡、网络来源、模型和 MAC 地址
virsh net-list --all          # 查看 libvirt 虚拟网络是否活动及是否自启动
ip -d link show               # 查看 TAP、bridge、bond、VLAN 等链路细节
bridge link show              # 查看哪些接口接入了 Linux Bridge
virsh net-dhcp-leases default # 查看默认网络分配的 DHCP 地址
```

**坏了怎么查：** 按“客户机地址与路由 -> 虚拟网卡 link -> TAP -> bridge -> 宿主机路由/防火墙 -> 物理交换网络”逐层定位。SR-IOV 性能高，但迁移、可观测性和灵活性通常更复杂。

### 9. 虚拟存储、raw 与 qcow2

**是什么：** 虚拟机磁盘可以是宿主机文件、逻辑卷、物理块设备或 NFS、iSCSI、Ceph RBD 等网络存储。raw 和 qcow2 是常见镜像格式。

**为什么需要：** 不同工作负载对性能、快照、稀疏分配、共享存储、备份和迁移的要求不同。

**怎么工作：** qcow2 使用元数据和 Copy-on-Write（写时复制）支持稀疏分配、backing file 与快照；raw 结构更直接、可移植性好，性能路径通常更简单。实际差异还取决于文件系统、缓存、预分配和存储后端。

**怎么看：**

```bash
virsh domblklist kvm-lab --details             # 查看虚拟磁盘目标名、来源和设备类型
qemu-img info /var/lib/libvirt/images/vm.qcow2 # 查看格式、虚拟容量、实际占用和 backing file
qemu-img info --backing-chain vm-overlay.qcow2 # 展开整个镜像链，排查缺失或过长的 backing chain
virsh domblkinfo kvm-lab vda                    # 查看虚拟磁盘容量和分配情况
```

**坏了怎么查：** 先确认路径、权限和 SELinux 标签，再检查存储是否挂载、镜像链是否完整、空间与 inode 是否耗尽、底层延迟是否异常。运行中的镜像不要随意用 `qemu-img check -r` 修复。

### 10. 快照、克隆与备份边界

**是什么：** 快照记录某个时点的磁盘或虚拟机状态；克隆创建新虚拟机；备份把可恢复数据复制到独立故障域。

**为什么需要：** 快照适合短期变更保护和某些备份流程，但快照仍依赖原存储和镜像链，不能替代独立备份。

**怎么工作：** 外部快照通常创建新的 overlay，后续写入进入新层，旧层保持不变。链越长，管理、性能和恢复复杂度越高，需要受控地 block commit 或 block pull。

**怎么看：**

```bash
virsh snapshot-list kvm-lab                     # 查看 libvirt 记录的快照元数据
virsh domblklist kvm-lab --details              # 确认当前活动层实际指向哪个文件
qemu-img info --backing-chain /path/to/top.qcow2 # 核对每一层路径和格式
```

**坏了怎么查：** 快照删除卡住时先检查 block job、镜像链、空间和底层 I/O；不要先手工删除某一层文件。生产数据库优先使用应用一致备份或数据库原生备份，再与虚拟化备份协调。

### 11. QEMU Guest Agent

**是什么：** QEMU Guest Agent（QGA）是运行在客户机里的代理，通过虚拟通道接受受控命令。

**为什么需要：** 宿主机仅知道虚拟硬件状态，不一定知道客户机 IP、文件系统冻结状态或操作系统关机进度。

**怎么工作：** libvirt 通过 virtio-serial channel 与客户机里的 `qemu-ga` 通信，可用于查询信息、协调关机和文件系统 freeze/thaw。

**怎么看：**

```bash
virsh domfsinfo kvm-lab   # QGA 正常时可返回客户机文件系统信息
virsh guestinfo kvm-lab   # 查询客户机代理可提供的信息；能力随版本和系统变化
```

**坏了怎么查：** 检查客户机 `qemu-guest-agent` 服务、Domain XML 中 channel、宿主机 socket 和权限。不要把 QGA 当成通用远程执行后门，生产操作仍要有权限、审计和超时。

### 12. 在线迁移

**是什么：** 在线迁移是在虚拟机继续运行时，把执行位置从源宿主机转移到目标宿主机。

**为什么需要：** 宿主机维护、硬件故障预警和资源再平衡需要尽量减少业务停机。

**怎么工作：** 常见 pre-copy 先复制内存，再反复复制运行期间变脏的页面，最后短暂停顿并复制剩余状态。脏页速度持续高于迁移带宽时可能难以收敛。post-copy 可以先切到目标再按需拉取页面，但迁移中目标或网络故障的风险更高。

```text
源 QEMU
  -> 协商 CPU、机器类型、设备和存储兼容性
  -> 复制内存与设备状态
  -> 短暂停顿并切换
  -> 目标 QEMU 继续运行
```

**怎么看：**

```bash
virsh domjobinfo kvm-lab           # 查看正在进行的迁移或块任务进度
virsh cpu-compare target-cpu.xml   # 比较 CPU 定义是否兼容当前宿主机
virsh migrate --help               # 先在本机版本确认支持的迁移参数
```

**坏了怎么查：** 依次检查 CPU model、机器类型、QEMU/libvirt 兼容性、目标资源、存储可见性、迁移网络、TLS/SSH、DNS、端口和脏页速率。迁移前必须明确取消、回退和业务验证方法。

## 四条内部数据路径

### 虚拟机启动路径

```text
virsh start kvm-lab
  -> libvirt 校验 Domain XML 和权限
  -> 准备网络、存储、安全标签与 cgroup
  -> 启动 QEMU 进程
  -> QEMU 打开 /dev/kvm 并创建 vCPU
  -> 固件加载引导设备
  -> 客户机内核启动
```

启动失败时，要找到停在哪一层。XML 校验失败、镜像权限失败、网络不存在和 `/dev/kvm` 不可用，会留下完全不同的证据。

### CPU 执行路径

```text
客户机线程
  -> 客户机调度器选择 vCPU
  -> QEMU vCPU 线程获得宿主机 pCPU
  -> KVM 进入客户机模式执行
  -> VM exit 时由 KVM 或 QEMU 处理
  -> 返回客户机继续执行
```

### 网络数据路径

```text
客户机应用
  -> 客户机 TCP/IP 栈
  -> virtio-net
  -> virtqueue / vhost-net
  -> TAP
  -> Linux Bridge / OVS
  -> 宿主机物理网卡
  -> 交换网络
```

### 磁盘写入路径

```text
客户机应用 write
  -> 客户机文件系统与块层
  -> virtio-blk / virtio-scsi
  -> QEMU IOThread 或主事件循环
  -> qcow2/raw/块设备/网络存储
  -> 宿主机文件系统或存储客户端
  -> 物理介质与副本机制
```

应用调用 `fsync` 成功意味着什么，取决于客户机文件系统、虚拟磁盘 cache mode、QEMU、宿主机和底层存储是否正确传递持久化语义。生产数据库不能只靠“磁盘看起来很快”判断数据安全。

## 安装与启动

### 实验前提

推荐使用一台可重装的 Ubuntu 24.04 LTS Linux 实验机，至少 2 核 CPU、4 GiB 内存、20 GiB 可用磁盘。实验机可以是物理机，也可以是明确支持 nested virtualization（嵌套虚拟化）的上层虚拟机。

不要在 Windows 本机直接期待 `/dev/kvm`。KVM 的宿主机是 Linux；如果使用 WSL2 或其他虚拟机，是否能继续运行 KVM 取决于硬件、Windows 版本和上层虚拟化是否向内暴露嵌套能力。

### 第一步：验证硬件条件

```bash
lscpu | grep -E 'Virtualization|Hypervisor' # Intel 常见 VT-x，AMD 常见 AMD-V；没有输出不一定是 CPU 不支持，也可能是上层没透传
grep -Eoc '(vmx|svm)' /proc/cpuinfo          # 大于 0 表示至少有 CPU 线程暴露了 Intel vmx 或 AMD svm 标志
test -e /dev/kvm && echo '/dev/kvm ready' || echo '/dev/kvm missing' # 直接确认 KVM 设备是否存在
```

预期结果：CPU 标志计数大于 0，且 `/dev/kvm ready`。如果缺失，先处理 BIOS/UEFI 或嵌套虚拟化，不要继续创建虚拟机。

### 第二步：安装软件包

```bash
sudo apt update # 刷新 Ubuntu 软件包索引
sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients virtinst qemu-utils libosinfo-bin # 安装 KVM/QEMU、libvirt、virt-install、镜像和 OS 识别工具
sudo usermod -aG libvirt,kvm "$USER" # 把当前用户加入管理和 /dev/kvm 访问组；执行后需要重新登录
```

重新登录后验证：

```bash
id                                         # 输出中应包含 libvirt 和 kvm 组
sudo systemctl enable --now libvirtd        # 传统单体守护进程发行版启用 libvirtd；模块化发行版可能使用 virtqemud socket
virt-host-validate                         # 检查 KVM、设备、cgroup、IOMMU 等宿主机条件
virsh -c qemu:///system list --all         # 能返回列表且没有连接错误，说明管理链路跑通
```

如果系统提示没有 `libvirtd.service`，先执行：

```bash
systemctl list-unit-files | grep -E 'libvirtd|virtqemud' # 识别当前发行版使用单体还是模块化守护进程
sudo systemctl enable --now virtqemud.socket             # 仅在系统确实提供该 socket 时启用
```

### 第三步：确认默认网络

```bash
virsh -c qemu:///system net-list --all          # 查看 default 网络是否存在和活动
sudo virsh -c qemu:///system net-start default  # 仅当 default 显示 inactive 时启动；已活动会提示重复启动
sudo virsh -c qemu:///system net-autostart default # 让 default 网络随 libvirt 启动
```

预期结果：`default` 同时显示 `active` 和 `autostart`。部分精简安装不会自动创建 default 网络，此时应按发行版文档安装网络配置，而不是随便复制未知 XML。

## Domain XML 配置详解

下面是一份教学用骨架。真实环境应先用 `virt-install` 或管理平台生成，再通过 `virsh dumpxml` 学习和版本管理；不要在不知道设备兼容性的情况下从零手写整个生产 XML。

```xml
<domain type='kvm'>
  <!-- name 是 libvirt 中唯一、便于运维识别的虚拟机名称 -->
  <name>kvm-lab</name>

  <!-- memory 是最大内存；单位 KiB，2097152 KiB 等于 2 GiB -->
  <memory unit='KiB'>2097152</memory>

  <!-- currentMemory 是启动时给客户机的内存；配合 balloon 才可能动态调整 -->
  <currentMemory unit='KiB'>2097152</currentMemory>

  <!-- vcpu 定义客户机可见的逻辑 CPU 数量 -->
  <vcpu placement='static'>2</vcpu>

  <os>
    <!-- hvm 表示硬件辅助的全虚拟化客户机；x86_64 使用 q35 机器类型 -->
    <type arch='x86_64' machine='q35'>hvm</type>
    <!-- UEFI 固件的具体写法由发行版和 libvirt 能力决定，优先让工具自动选择 -->
    <boot dev='hd'/>
  </os>

  <features>
    <!-- acpi 让现代客户机获得电源管理和硬件描述能力 -->
    <acpi/>
  </features>

  <!-- host-model 在宿主机能力与迁移兼容性之间折中；集群必须统一评估 -->
  <cpu mode='host-model' check='partial'/>

  <devices>
    <disk type='file' device='disk'>
      <!-- qcow2 是磁盘镜像格式；cache 和 io 策略必须结合存储能力压测 -->
      <driver name='qemu' type='qcow2' cache='none' io='native'/>
      <!-- source 是宿主机看到的实际镜像路径 -->
      <source file='/var/lib/libvirt/images/kvm-lab.qcow2'/>
      <!-- target vda 是客户机设备名，virtio 表示使用半虚拟化磁盘总线 -->
      <target dev='vda' bus='virtio'/>
    </disk>

    <interface type='network'>
      <!-- 接入 libvirt 的 default NAT 网络 -->
      <source network='default'/>
      <!-- 使用 virtio 虚拟网卡，客户机需要对应驱动 -->
      <model type='virtio'/>
    </interface>

    <!-- pty 串口让无图形环境也能通过 virsh console 连接 -->
    <console type='pty'>
      <target type='serial' port='0'/>
    </console>

    <!-- QEMU Guest Agent 使用的 virtio channel -->
    <channel type='unix'>
      <target type='virtio' name='org.qemu.guest_agent.0'/>
    </channel>

    <!-- virtio balloon 用于内存统计与受控回收，不代表可以无风险超售 -->
    <memballoon model='virtio'/>
  </devices>
</domain>
```

### 核心字段字典

| 字段 | 含义 | 生产判断 | 常见坑 |
|---|---|---|---|
| `domain type='kvm'` | 使用 KVM 硬件加速 | 宿主机必须可访问 `/dev/kvm` | 写成 `qemu` 可能退回软件模拟 |
| `machine` | 虚拟主板版本 | 集群迁移和升级前要检查兼容性 | 两端机器类型缺失或版本不同 |
| `cpu mode` | 客户机 CPU 特性策略 | 性能和迁移范围之间取舍 | `host-passthrough` 跨代迁移失败 |
| `memory` | 最大或配置内存 | 结合 NUMA、预留和故障迁移余量 | 只加总配置值，不看实际驻留和峰值 |
| `vcpu` | 客户机逻辑 CPU | 结合工作负载并发和宿主机超售 | vCPU 越多，调度等待可能越大 |
| `driver type` | 镜像格式 | 必须与实际格式一致 | 把 qcow2 误报成 raw 可能损坏数据 |
| `cache` | QEMU 磁盘缓存策略 | 结合掉电保护和持久化语义测试 | 为追求跑分忽略数据安全 |
| `source` | 网络或存储来源 | 迁移两端都要可用或随迁移复制 | 路径存在但权限/标签不允许访问 |
| `model type='virtio'` | 半虚拟化网卡 | 优先性能，同时确认客户机驱动 | 旧系统无驱动导致设备不可见 |
| `channel` | QGA 通信通道 | 用于受控客户机协作 | XML 有通道但客户机代理未运行 |

## 网络配置取舍

| 模式 | 数据路径 | 优点 | 代价与边界 | 适合场景 |
|---|---|---|---|---|
| libvirt NAT | TAP -> `virbr0` -> NAT | 实验简单、默认隔离 | 外部主动访问需额外转发 | 单机学习、开发测试 |
| Linux Bridge | TAP -> bridge -> 物理口 | 二层接入直观、生态成熟 | 要处理 VLAN、STP、bond 和宿主机地址迁移 | 常规服务器虚拟化 |
| Open vSwitch | TAP -> OVS -> uplink | 流表、隧道和云网络能力丰富 | 组件和排障复杂度更高 | OpenStack、复杂 SDN |
| macvtap | macvtap -> 物理口 | 路径较短、配置相对少 | 宿主机与客户机互访、交换机策略有约束 | 特定直连场景 |
| SR-IOV | VF 直通给客户机 | 延迟低、吞吐高 | 迁移、资源池化、观测和策略更难 | 高性能网络工作负载 |

选择网络模式时先回答：是否需要在线迁移、租户隔离、VLAN/Overlay、带宽保证、宿主机互访和统一可观测性。单看吞吐最高值做选型是不完整的。

## 存储配置取舍

| 方案 | 优点 | 代价 | 关键检查 |
|---|---|---|---|
| 本地 qcow2 | 稀疏、快照和克隆方便 | 镜像链、元数据和迁移更复杂 | backing chain、空间、预分配、备份 |
| 本地 raw/LVM | 路径直接、行为较明确 | 克隆和快照能力取决于底层 | 对齐、缓存、LVM 元数据、备份 |
| NFS | 共享简单、迁移方便 | 网络和服务端成为关键依赖 | mount、锁、延迟、吞吐、SELinux |
| iSCSI/FC | 块存储、企业存储生态成熟 | 多路径、LUN 映射和隔离复杂 | multipath、队列、故障切换、LUN 权限 |
| Ceph RBD | 分布式副本、与云平台结合紧密 | 集群、网络和恢复流量需要专业运维 | PG/OSD 健康、延迟、客户端、容量水位 |

更多分布式存储原理见 [Ceph 深讲](../storage-data-protection/ceph.md)。

## `virsh` 命令字典

| 命令 | 作用 | 常用写法 | 关键观察 | 正常结果 | 常见坑 |
|---|---|---|---|---|---|
| `uri` | 查看连接目标 | `virsh uri` | system/session/远端 | 返回预期 URI | 在错误 URI 上操作 |
| `list` | 查看 Domain | `virsh list --all` | ID、Name、State | 目标虚拟机存在 | 不加 `--all` 看不到关机虚拟机 |
| `dominfo` | 查看基本状态 | `virsh dominfo NAME` | State、CPU、Memory、Persistent | 状态与配置一致 | 只看状态不看日志 |
| `dumpxml` | 导出配置 | `virsh dumpxml NAME --inactive` | CPU、磁盘、网卡、设备 | 得到可解析 XML | 混淆 live 与 inactive |
| `start` | 启动持久 Domain | `virsh start NAME` | 返回值、QEMU 日志 | `Domain started` | 启动命令成功不等于应用就绪 |
| `shutdown` | 请求客户机正常关机 | `virsh shutdown NAME` | 客户机 ACPI/agent 响应 | 状态逐步变为 shut off | 客户机卡死时可能不响应 |
| `destroy` | 强制终止 QEMU | `virsh destroy NAME` | 相当于断电 | 立即停止 | 可能造成文件系统或数据库损坏 |
| `console` | 连接串口 | `virsh console NAME` | 启动日志、登录提示 | 出现客户机控制台 | 客户机没启用串口 |
| `domiflist` | 查看网卡 | `virsh domiflist NAME` | Interface、Source、Model、MAC | 显示 TAP 和 MAC | 把 MAC、客户机接口名混为一谈 |
| `domblklist` | 查看磁盘 | `virsh domblklist NAME --details` | target 与 source | 映射到正确后端 | 只看 vda 不查实际文件 |
| `domstats` | 批量统计 | `virsh domstats NAME --vcpu --balloon --block --interface` | CPU、内存、块、网卡计数器 | 返回键值统计 | Counter 需要计算速率才有意义 |
| `net-list` | 查看虚拟网络 | `virsh net-list --all` | Active、Autostart | 目标网络 active | 网络定义和 Linux bridge 状态不一致 |
| `event` | 监听事件 | `virsh event NAME --all --loop` | 生命周期、设备、watchdog | 变更时出现事件 | 命令退出后不再监听 |

### 高风险命令边界

- `destroy` 是强制断电，不是“优雅关闭”。
- `undefine` 删除的是 libvirt 定义；搭配存储参数可能影响磁盘，执行前必须读本机帮助并备份。
- `vol-delete`、`pool-delete` 和镜像链操作可能不可逆。
- `snapshot-revert` 会让虚拟机回到旧状态，分布式系统可能出现数据和身份回退问题。
- 生产迁移、CPU/内存热调、设备热插拔都必须有兼容性检查、业务验证和回滚方案。

## `qemu-img` 命令字典

| 命令 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `info` | 查看镜像元数据 | `qemu-img info disk.qcow2` | 显示格式、虚拟/实际大小 | 对运行镜像使用不合适参数 |
| `create` | 创建镜像 | `qemu-img create -f qcow2 disk.qcow2 20G` | 创建稀疏镜像 | 虚拟大小不是立即占用大小 |
| `convert` | 转换或复制格式 | `qemu-img convert -p -O qcow2 src.raw dst.qcow2` | 进度完成且目标可读 | 空间不足、源仍在写入 |
| `resize` | 修改虚拟容量 | `qemu-img resize disk.qcow2 +10G` | 虚拟容量增加 | 客户机分区和文件系统不会自动扩大 |
| `check` | 检查镜像一致性 | `qemu-img check disk.qcow2` | 无错误或给出问题 | 对活动镜像直接修复风险高 |
| `map` | 查看分配区域 | `qemu-img map --output=json disk.qcow2` | 返回数据/空洞分布 | JSON 需要工具解析，不要靠肉眼猜 |

## 入门实验：创建第一台 KVM 虚拟机

### 实验目标

在可重装的 Ubuntu KVM 宿主机上，通过官方 Ubuntu 云镜像创建 `kvm-lab`，确认它使用 KVM、Virtio 网卡、qcow2 磁盘和 default NAT 网络。

实验会下载约 600 MB 镜像并占用额外磁盘空间。所有命令只用于个人实验机；不要在现有生产 libvirt 宿主机直接执行。

### 前置检查

```bash
virt-host-validate                         # 所有关键 KVM 检查应通过；警告要结合环境判断
virsh -c qemu:///system list --all         # 确认没有同名 kvm-lab
virsh -c qemu:///system net-info default   # 确认 default 网络 Active: yes
df -h "$HOME"                             # 确认可用空间足够保存基础镜像和 overlay
```

### 实验步骤

1. 创建下载目录和 SSH 密钥。

```bash
DOWNLOAD_DIR="$HOME/kvm-lab-download" # 普通用户下载区，不直接作为 system Domain 的运行目录
mkdir -p "$DOWNLOAD_DIR"               # 创建独立下载目录，方便校验和清理
cd "$DOWNLOAD_DIR"                     # 后续下载文件先放在这里
test -f "$HOME/.ssh/id_ed25519.pub" || ssh-keygen -t ed25519 -f "$HOME/.ssh/id_ed25519" -N '' # 没有密钥时创建实验密钥
```

2. 下载 Ubuntu 24.04 LTS 云镜像，校验摘要并检查格式。

```bash
curl -fL -o noble-server-cloudimg-amd64.img https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img # 下载官方当前 Noble 云镜像
curl -fLO https://cloud-images.ubuntu.com/noble/current/SHA256SUMS # 下载同目录的官方 SHA256 摘要清单
grep 'noble-server-cloudimg-amd64.img' SHA256SUMS | sha256sum -c - # 预期输出 OK；摘要不匹配时立即删除镜像并停止
qemu-img info noble-server-cloudimg-amd64.img # 应看到 file format: qcow2；若不是，后续 backing format 必须按实际值调整
```

3. 把基础镜像安装到 libvirt 标准目录，再创建 12 GiB overlay。

```bash
LAB_DIR=/var/lib/libvirt/images/kvm-lab # system Domain 使用的标准镜像目录
sudo install -d -o libvirt-qemu -g kvm -m 0750 "$LAB_DIR" # Ubuntu 上让 QEMU 账号可进入目录
sudo install -o root -g kvm -m 0640 noble-server-cloudimg-amd64.img "$LAB_DIR/noble-base.qcow2" # 基础层只需让 QEMU 读取
sudo qemu-img create -f qcow2 -F qcow2 -b "$LAB_DIR/noble-base.qcow2" "$LAB_DIR/kvm-lab.qcow2" 12G # 新写入落在 overlay，基础镜像保持不变
sudo chown libvirt-qemu:kvm "$LAB_DIR/kvm-lab.qcow2" # 让 Ubuntu 的 QEMU 运行账号能够写 overlay
sudo chmod 0660 "$LAB_DIR/kvm-lab.qcow2"            # 只给文件所有者和 kvm 组读写权限
sudo qemu-img info --backing-chain "$LAB_DIR/kvm-lab.qcow2" # 应看到 overlay 和绝对路径基础镜像两层
```

这里指定的是 Ubuntu 默认的 `libvirt-qemu:kvm`。其他发行版的 QEMU 用户和组可能不同，应先从 `/etc/libvirt/qemu.conf`、运行中的 QEMU 进程或发行版文档确认，不能照抄所有权。

4. 创建并启动虚拟机。

```bash
virt-install \
  --connect qemu:///system \
  --name kvm-lab \
  --virt-type kvm \
  --memory 2048 \
  --vcpus 2 \
  --import \
  --disk path="$LAB_DIR/kvm-lab.qcow2",format=qcow2,bus=virtio \
  --network network=default,model=virtio \
  --os-variant ubuntu24.04 \
  --graphics none \
  --console pty,target_type=serial \
  --cloud-init clouduser-ssh-key="$HOME/.ssh/id_ed25519.pub",disable=on \
  --noautoconsole # 创建持久 Domain 并后台启动；cloud-init 把公钥写入镜像默认用户
```

如果本机 `osinfo-query os` 中没有 `ubuntu24.04`，先更新 `libosinfo-data`，或根据命令给出的候选值选择最接近且受支持的变体；不要盲目写 `generic` 后忽略设备兼容性。

5. 验证虚拟机和资源路径。

```bash
virsh -c qemu:///system list --all                       # kvm-lab 应为 running
virsh -c qemu:///system dominfo kvm-lab                  # Persistent 应为 yes，CPU 为 2，内存约 2 GiB
virsh -c qemu:///system domiflist kvm-lab                # Model 应为 virtio，Source 应为 default
virsh -c qemu:///system domblklist kvm-lab --details     # vda 应指向 kvm-lab.qcow2
virsh -c qemu:///system dumpxml kvm-lab | grep "domain type='kvm'" # 确认使用 KVM 而不是纯软件模拟
virsh -c qemu:///system net-dhcp-leases default          # 等待 cloud-init 启动后应看到该 MAC 对应的 IP
```

6. 登录客户机。

先从 DHCP lease 找到 IP。Ubuntu 官方云镜像默认用户通常是 `ubuntu`：

```bash
ssh -i "$HOME/.ssh/id_ed25519" ubuntu@VM_IP # 把 VM_IP 替换为实际地址；首次连接核对主机指纹后确认
```

进入客户机后：

```bash
hostnamectl                       # 确认正在 kvm-lab 客户机中，而不是宿主机
systemd-detect-virt               # 预期输出 kvm
find /sys/bus/virtio/devices -maxdepth 1 -mindepth 1 -printf '%f\n' # 不依赖额外软件包，查看客户机发现的 Virtio 设备
ip -br address                    # 查看客户机地址
cat /proc/cpuinfo | grep -m1 name # 查看客户机暴露的 CPU 模型
```

### 验证结果

实验成功必须同时满足：

- `virsh list --all` 显示 `kvm-lab` 为 running。
- Domain XML 根元素为 `type='kvm'`。
- 网卡模型为 Virtio，来源为 `default`。
- 磁盘目标为 `vda`，来源为实验 overlay。
- 客户机内 `systemd-detect-virt` 输出 `kvm`。
- 客户机能获得地址并通过 SSH 登录。

### 如果没有成功

按顺序检查：

1. `/dev/kvm` 是否存在，当前用户是否在 `kvm` 和 `libvirt` 组。
2. `virsh uri` 是否真的是 `qemu:///system`。
3. `virt-host-validate` 哪一项失败。
4. `default` 网络是否 active，`virbr0` 是否存在。
5. `qemu-img info --backing-chain` 是否能访问每一层绝对路径。
6. `journalctl -u libvirtd -u virtqemud --since '-10 min'` 是否有权限、网络或设备错误。
7. `/var/log/libvirt/qemu/kvm-lab.log` 是否记录 QEMU 启动错误；日志路径随发行版变化。

### 实验清理

先退出客户机，再在宿主机执行：

```bash
virsh -c qemu:///system shutdown kvm-lab # 请求客户机正常关机
virsh -c qemu:///system domstate kvm-lab # 等待状态变为 shut off，不要立刻强制断电
virsh -c qemu:///system undefine kvm-lab # 删除 libvirt 定义；这里没有携带删除存储参数
sudo rm -f /var/lib/libvirt/images/kvm-lab/kvm-lab.qcow2 # 确认 Domain 已删除后，再删除实验 overlay
sudo rm -f /var/lib/libvirt/images/kvm-lab/noble-base.qcow2 # overlay 删除后再删除它依赖的基础镜像
sudo rmdir /var/lib/libvirt/images/kvm-lab # 目录为空时删除 system Domain 实验目录
rm -f "$HOME/kvm-lab-download/noble-server-cloudimg-amd64.img" # 删除下载区的云镜像副本
rm -f "$HOME/kvm-lab-download/SHA256SUMS" # 删除下载区的摘要清单
rmdir "$HOME/kvm-lab-download"            # 目录为空时再删除下载目录，避免误删其他文件
```

不要删除 `~/.ssh/id_ed25519`，除非它确实是专为本实验创建且没有被其他环境使用。

## 故障实验：切断并恢复实验虚拟机网卡

### 实验边界

只对 `kvm-lab` 的单张实验网卡执行。不要停止生产 bridge、default 网络、物理网卡或 libvirt 服务。实验前保持一个宿主机终端，不要通过被测试虚拟机反向管理宿主机。

### 故障目标

主动把虚拟网卡 link 设为 down，观察 SSH 中断和 libvirt 状态证据，再恢复 link 并验证网络收敛。

### 1. 建立基线

```bash
VM=kvm-lab # 明确实验对象，避免把命令作用到别的虚拟机
IFACE=$(virsh -c qemu:///system domiflist "$VM" | awk 'NR>2 && $1 != "" {print $1; exit}') # 取第一张 TAP 接口名，例如 vnet0
test -n "$IFACE" && echo "$IFACE" # 必须打印非空接口名；为空时立即停止实验
virsh -c qemu:///system domif-getlink "$VM" "$IFACE" # 基线应为 up
ip -s link show "$IFACE"                              # 保存收发包、丢包和错误计数
```

### 2. 注入故障

```bash
virsh -c qemu:///system domif-setlink "$VM" "$IFACE" down # 只把实验虚拟网卡的虚拟 link 设为 down
virsh -c qemu:///system domif-getlink "$VM" "$IFACE"      # 预期输出 down
```

现象：已有 SSH 连接会中断或超时，客户机对外网络不可用，但 `virsh domstate kvm-lab` 仍显示 running。这证明“虚拟机进程活着”不能代表“业务网络健康”。

### 3. 收集证据并形成假设

```bash
virsh -c qemu:///system domstate "$VM"       # 确认计算状态仍为 running
virsh -c qemu:///system domiflist "$VM"      # 确认目标网卡和网络来源没变
virsh -c qemu:///system domif-getlink "$VM" "$IFACE" # 直接证明 link 为 down
ip -d link show "$IFACE"                     # 查看宿主机 TAP 状态和 bridge 归属
virsh -c qemu:///system net-info default      # 排除整个 default 网络停止
```

假设：故障只发生在 `kvm-lab` 的虚拟网卡 link，不是 QEMU 进程退出，也不是 default 网络整体故障。

### 4. 验证和修复

```bash
virsh -c qemu:///system domif-setlink "$VM" "$IFACE" up # 恢复该虚拟网卡 link
virsh -c qemu:///system domif-getlink "$VM" "$IFACE"    # 预期输出 up
virsh -c qemu:///system net-dhcp-leases default            # 确认 lease 仍存在或重新出现
```

重新 SSH 到客户机后：

```bash
ip -br link       # 客户机接口应恢复 UP
ip route          # 默认路由应存在
ping -c 3 GATEWAY # 把 GATEWAY 替换为 default 网络网关，验证最短网络路径
```

### 5. 清理和复盘

本实验没有增加持久配置，link 恢复为 up 后无需额外删除。复盘至少记录：

- 故障前后的时间。
- SSH 和业务探测现象。
- `domstate` 与 `domif-getlink` 为什么给出不同维度的状态。
- 证明故障域只在单 VM 网卡的证据。
- 恢复命令、恢复耗时和业务验证结果。

## 生产高可用：KVM 不等于 HA 平台

KVM 负责运行虚拟机，不负责跨宿主机做成员管理、调度决策、仲裁和自动重启。生产 HA 至少需要：

```text
多台 KVM 宿主机
  + 一致的 CPU / QEMU / 机器类型兼容策略
  + 可靠的共享或复制存储
  + 冗余业务、管理、存储和迁移网络
  + 集群成员与仲裁
  + fencing / STONITH 故障隔离
  + 虚拟机放置和重启控制器
  + 应用健康检查与流量切换
```

Fencing 是先确认故障宿主机不能继续写共享资源，再到其他节点重启虚拟机。没有 fencing 的自动接管可能造成同一虚拟机磁盘被两台宿主机同时写入，后果比暂时不可用更严重。

### 三类生产方案

| 方案 | 适合场景 | 优点 | 风险与边界 |
|---|---|---|---|
| libvirt + 成熟集群管理器 | 小规模、团队能承担底层运维 | 组件可控 | 调度、仲裁、fencing、升级都要自己设计 |
| OpenStack | 多租户、大规模 IaaS、自助 API | 计算、网络、存储、调度体系完整 | 建设和运维复杂度高 |
| 商业或社区 KVM 管理平台 | 需要统一 UI、HA、模板和生命周期 | 交付快、功能集成 | 许可证、产品边界和升级路径需评估 |

不要用“定时脚本发现进程没了就到另一台启动”代替集群高可用。它缺少可靠仲裁、资源锁和故障隔离。

### 应用高可用仍然要单独设计

虚拟机 HA 解决的是计算节点故障后的重启位置，恢复时间通常包含故障检测、隔离、启动和应用恢复。数据库复制、消息队列副本、Kubernetes 控制面多数派、负载均衡和业务探活不能被虚拟机 HA 替代。

## 容量与性能

### CPU

关键指标：

- 宿主机 CPU 使用率、load、运行队列和上下文切换。
- 每台 VM 的 vCPU 时间、vCPU/pCPU 超售比和峰值重叠。
- 客户机 CPU steal time，表示 vCPU 想运行但未及时获得物理 CPU 的时间。
- NUMA 命中、本地/远端内存访问和 vCPU pinning。
- 模拟线程、IOThread 和 vhost 线程是否成为热点。

判断原则：不要只看整机平均 CPU。一个热点 pCPU、单个 QEMU 主循环或 NUMA 跨节点，也可能让某台 VM 变慢。

### 内存

关键指标：

- 已配置内存、当前 balloon、QEMU RSS 和宿主机 `MemAvailable`。
- 宿主机 swap in/out、直接回收、OOM 和 PSI memory pressure。
- 客户机 available、major page fault 和 swap。
- NUMA 内存分布、HugePages 使用和碎片。

生产超售必须基于工作负载峰值和故障迁移余量。平时“还有空闲”不代表一台宿主机故障后，其余节点接得住全部虚拟机。

### 存储

关键指标：

- 客户机看到的 IOPS、吞吐、平均/分位延迟和队列深度。
- QEMU 块设备统计、IOThread 饱和和 block job。
- 宿主机文件系统、LVM、multipath 或 Ceph 客户端延迟。
- 后端阵列端口、磁盘、缓存、复制链路和容量水位。
- qcow2 镜像链长度、实际占用、预分配和碎片。

排障时把延迟按层对齐。客户机 `await` 高只是现象，根因可能是同一存储池的 noisy neighbor、路径切换、快照合并或后端恢复流量。

### 网络

关键指标：

- 客户机接口丢包、重传、队列和软中断。
- TAP、bridge/OVS、物理网卡的 drops/errors。
- vhost 线程 CPU、multiqueue 和 RSS/RPS 配置。
- bond、VLAN、MTU、交换机端口和上联拥塞。
- SR-IOV VF 资源、IOMMU 错误和交换机策略。

### 容量设计公式

可用容量不能只做 `宿主机数量 x 单机容量`：

```text
可承载容量
  = 总物理容量
  - 宿主机系统与管理预留
  - N+1 或 N+2 故障接管预留
  - 迁移与恢复临时开销
  - 性能安全余量
```

CPU 可以适度超售，内存和存储延迟通常更需要谨慎。最终超售比应由真实峰值、SLO 和故障演练决定，而不是照搬固定数字。

## 安全边界

### 分层防护

1. **身份与授权：** libvirt 远程连接使用 SSH、TLS 等受控通道，结合 polkit、账户和 API 权限做最小授权。
2. **进程权限：** QEMU 不应无理由以完整 root 权限运行。
3. **强制访问控制：** SELinux sVirt 或 AppArmor 为不同虚拟机进程和镜像建立隔离。
4. **资源控制：** cgroup 限制 CPU、内存和设备访问，防止单 VM 拖垮宿主机。
5. **系统调用与命名空间：** seccomp 和 namespace 缩小 QEMU 被利用后的能力。
6. **启动与设备安全：** UEFI Secure Boot、vTPM、IOMMU、受控设备直通。
7. **镜像与密钥：** 镜像来源校验、静态加密、密钥系统、备份加密和访问审计。
8. **管理面隔离：** 管理、迁移、存储和业务网络按风险划分，限制端口与来源。

libvirt 默认安全策略拒绝 QEMU 访问某个自定义镜像路径时，不要第一反应关闭 SELinux。先检查文件所有权、目录执行权限和安全标签，让最小范围的资源获得正确权限。

### 设备直通的风险

VFIO（Virtual Function I/O）可把 PCI 设备交给虚拟机，降低虚拟化数据路径开销。使用前必须检查 IOMMU group 是否能安全隔离设备，并评估迁移、热插拔、驱动、固件和宿主机可观测性损失。

### 秘密信息

Domain XML 可以引用 libvirt secret，但不应把明文存储密码、云凭据或私钥提交到 Git。学习证据要脱敏：主机名、IP、MAC、UUID、路径、租户和业务名称都可能是敏感资产信息。

## 可观测性与 AIOps

### 最少采集四层数据

| 层 | 指标与证据 | 典型用途 |
|---|---|---|
| 业务与客户机 | 延迟、错误率、CPU steal、内存、磁盘、TCP | 判断用户影响和客户机症状 |
| libvirt/QEMU | Domain 状态、vCPU、balloon、block、interface、事件 | 判断虚拟资源与生命周期异常 |
| 宿主机 | CPU、NUMA、PSI、swap、TAP、bridge、磁盘、多路径 | 判断物理资源争用和数据路径故障 |
| 平台与基础设施 | 调度、迁移、存储集群、交换机、BMC、机架 | 判断故障域、依赖和变更影响 |

可以使用 node_exporter 采集宿主机，使用 libvirt exporter 或管理平台 API 采集虚拟机状态，再把客户机监控关联起来。具体 exporter 选型必须核对维护状态、权限范围和指标语义。

### 关键关联键

- Domain name 与 UUID。
- 宿主机名称和计算集群。
- 虚拟网卡 MAC 与客户机 IP。
- 虚拟磁盘 target 与后端卷、LUN 或 RBD image。
- QEMU PID、cgroup 与虚拟机 UUID。
- 变更单、迁移任务、快照任务和告警时间。

名称会变，IP 会漂移，PID 会重启。生产拓扑应优先使用稳定 UUID，再把可读名称作为标签。

### 告警建议

有意义的告警示例：

- 虚拟机运行但业务探测失败，同时虚拟网卡 link down。
- 宿主机内存压力持续升高并发生 swap，多个 VM 延迟同步恶化。
- 存储延迟超过 SLO，且同池多台 VM 同时异常。
- 迁移长时间不收敛，脏页速率接近或超过迁移吞吐。
- qcow2 backing chain 缺失、快照链过长或存储空间接近高水位。
- 宿主机不可达且 fencing 未完成，禁止自动在其他节点重复启动 VM。

不要仅因单次 `virsh list` 不返回某台 VM 就自动启动它。先确认连接目标、集群所有权、fencing 和存储写入权。

### 自动化分级

| 级别 | 示例 | 要求 |
|---|---|---|
| 只读 | 采集 XML、状态、指标和日志 | 最小权限、超时、脱敏 |
| 建议 | 推荐迁移目标或资源调整 | 显示证据、风险和预期收益 |
| 人工批准 | 在线迁移、扩容、快照合并 | 兼容检查、审批、回滚、业务验证 |
| 自动执行 | 恢复实验 VM 网卡、重启无状态测试 VM | 明确故障域、幂等、限速、熔断 |
| 高风险 | fencing、存储删除、批量迁移、宿主机升级 | 双人复核、审计、演练和停止条件 |

LLM 可以总结证据、生成排障假设或检索 runbook，但不应仅凭自然语言结论直接执行 `destroy`、`undefine`、存储删除或 fencing。

## 常见故障排查

### `/dev/kvm` 不存在

可能原因：BIOS/UEFI 未开启虚拟化、CPU 标志未透传、KVM 模块未加载或上层不支持嵌套虚拟化。

检查顺序：`lscpu` -> `/proc/cpuinfo` -> `lsmod` -> `dmesg` -> 上层虚拟化配置。修复后重新执行 `virt-host-validate`，不要用 TCG 的“能启动”掩盖硬件条件问题。

### `virsh` 看不到刚创建的虚拟机

先执行 `virsh uri`。最常见原因是一个命令用了 `qemu:///session`，另一个用了 `qemu:///system`。再检查当前用户、远端 URI 和虚拟机是否为 transient Domain。

### 虚拟机启动时报 Permission denied

检查镜像每一级目录权限、QEMU 运行用户、SELinux/AppArmor 日志、sVirt 标签、挂载选项和 libvirt 日志。不要直接 `chmod 777` 或全局关闭安全策略。

### `Network not found: no network with matching name 'default'`

检查 `virsh net-list --all`、网络定义、`virbr0`、dnsmasq 进程和防火墙。实验网络可按发行版默认定义恢复；生产网络必须根据设计单恢复，不能随意创建同名 NAT 网络。

### 虚拟机有地址但外网不通

在客户机检查 IP、路由、DNS 和防火墙；在宿主机检查 TAP、bridge、转发、NAT 和物理出口；再检查上游交换机/VLAN。分别测试网关 IP、外部 IP 和域名，避免把 DNS 问题误判为网络全断。

### 虚拟机 CPU 不高但业务很慢

查看客户机 steal、宿主机运行队列、vCPU 线程、NUMA、CPU pinning 和同宿主机其他 VM；同时排除磁盘和网络等待。加 vCPU 前先证明瓶颈是可并行 CPU 算力不足。

### 宿主机内存还有，虚拟机仍在交换

客户机内存回收由客户机自己决定；宿主机有空闲不代表客户机获得了更多内存。检查 balloon 目标、客户机工作集、swap、NUMA 和是否允许热调内存。扩容后还要验证客户机是否识别。

### qcow2 镜像突然变大

检查客户机写入、discard/TRIM、快照/overlay、预分配、稀疏文件复制方式和 `qemu-img info --backing-chain`。文件删除后空间不一定立刻在宿主机回收。

### 快照合并长时间不结束

查看 `virsh domjobinfo`、底层 I/O 延迟、剩余空间、镜像链和客户机写入速率。不要手工删除活动链文件。必要时限速、选择业务低峰，并准备中止和恢复方案。

### 在线迁移失败

按 CPU/机器类型 -> QEMU/libvirt 版本 -> 目标资源 -> 存储路径 -> 网络/DNS/TLS -> 安全标签 -> 脏页速率排序。源 VM 仍运行时先稳定业务，不要反复无参数重试。

### 在线迁移一直不收敛

高写内存工作负载会持续产生脏页。比较 dirty rate 与迁移带宽，评估限速业务、增加迁移带宽、启用适当迁移能力或安排短暂停机。post-copy 不是无风险万能开关。

### 宿主机故障后 VM 没有在其他节点启动

先检查集群是否确认节点故障、fencing 是否成功、存储是否安全、目标节点容量、资源约束和启动日志。没有完成隔离时，不应强行在第二台主机启动同一共享磁盘 VM。

## 变更、升级与回滚

### 变更前

- 导出 Domain inactive XML、网络 XML、存储映射和宿主机能力。
- 记录 QEMU、libvirt、内核、机器类型、CPU model 和固件版本。
- 核对备份可恢复性，不把快照当备份。
- 确认目标宿主机容量、迁移兼容性、维护窗口和业务联系人。
- 明确什么指标触发停止、回滚或人工接管。

### 滚动升级思路

```text
选择一台非故障宿主机
  -> 迁出或受控关闭 VM
  -> 进入维护状态
  -> 升级内核 / QEMU / libvirt / 固件
  -> 重启并验证宿主机能力
  -> 创建或迁回金丝雀 VM
  -> 验证业务、性能、迁移和安全
  -> 再处理下一台
```

已经运行的 VM 可能继续使用旧 QEMU 二进制或旧机器状态，升级软件包不等于所有 VM 已获得新能力。是否需要重启 VM、重新迁移或更新机器类型，要根据发行版支持文档和兼容策略决定。

### 回滚边界

软件包降级可能受状态、固件、机器类型和配置格式限制。真正可执行的回滚通常包括：保留旧宿主机、把 VM 迁回兼容节点、恢复已验证的配置、停止扩大变更范围，而不是假定任何 RPM/DEB 都能原地降级。

## 生产设计检查单

### 计算

- CPU 型号、微码、NUMA 和虚拟化能力是否形成兼容池。
- vCPU 超售、CPU model、pinning、HugePages 的适用边界是什么。
- 是否为宿主机故障和迁移预留资源。

### 网络

- 管理、业务、存储、迁移和 fencing 网络如何划分。
- bond、VLAN、MTU、bridge/OVS、multiqueue 是否端到端一致。
- 单网卡、单交换机和单上联故障域是否消除。

### 存储

- 数据一致性、缓存、flush 和掉电保护是否经过验证。
- 共享/复制存储的容量、水位、延迟、路径和恢复流量是否监控。
- 快照、备份、恢复演练和保留策略是否独立设计。

### 高可用

- 谁做成员管理、仲裁、fencing、放置和重启。
- 同一 VM 是否可能被两个节点同时启动，如何阻止。
- VM 恢复后，谁验证应用和切换流量。

### 安全

- libvirt API、SSH/TLS、polkit 和平台账号是否最小权限。
- sVirt/AppArmor、seccomp、cgroup 和镜像标签是否启用。
- 镜像、备份、密钥、vTPM 和审计是否覆盖全生命周期。

### 运维

- 宿主机、QEMU、libvirt、客户机和基础设施指标如何关联。
- 变更、迁移、快照、备份和告警是否进入统一事件时间线。
- 升级顺序、兼容矩阵、金丝雀、停止条件和回滚是否演练。

## 选型取舍

### KVM 与 VMware vSphere

KVM 是开源 Linux 虚拟化底座，组合灵活，适合深度集成和云平台；vSphere 提供高度集成的商业虚拟化套件。选型要比较团队能力、现有生态、硬件支持、功能、许可证、自动化接口、迁移成本和长期运维，而不是只比较 hypervisor 跑分。

更多 vSphere 内容见 [VMware vSphere 深讲](./vsphere.md)。

### KVM 与 OpenStack

KVM 负责单机执行虚拟机，OpenStack 是跨节点 IaaS 控制平台。只有少量固定 VM 时，完整 OpenStack 可能过重；需要多租户、自助服务、配额、调度、镜像、网络和卷 API 时，OpenStack 才体现价值。

更多云平台内容见 [OpenStack 深讲](./openstack.md)。

### KVM 与容器

需要独立内核、不同操作系统、强隔离或传统软件认证时偏向 VM；需要高密度、快速启动和应用级编排时偏向容器。实际平台常把容器运行在 VM 上，通过两层边界平衡基础设施隔离与应用交付效率。

## 面试怎么讲

### 30 秒回答

KVM 是 Linux 内核的硬件虚拟化能力，QEMU 负责虚拟机进程和设备模型，libvirt 用 Domain XML 和 API 管理生命周期、网络、存储与迁移，`virsh` 是客户端。我排障会从客户机、QEMU/libvirt、宿主机和物理基础设施四层收集证据。KVM 本身不等于集群 HA，生产还需要可靠存储、仲裁、fencing、调度和应用健康检查。

### 3 分钟回答

一次 `virsh start` 会先通过 libvirt 读取持久 Domain XML，检查磁盘、网络和安全权限，再启动 QEMU。QEMU 创建内存和虚拟设备，通过 `/dev/kvm` 创建 vCPU，普通客户机指令依靠硬件虚拟化直接执行，特权操作或设备访问触发 VM exit。网络常见路径是 virtio-net、vhost、TAP、Linux Bridge 和物理网卡；存储路径是客户机文件系统、virtio-blk/virtio-scsi、QEMU、qcow2/raw 或网络块存储。

生产设计要同时看 CPU model 与迁移兼容、NUMA 和超售、内存交换、磁盘缓存语义、网络故障域、安全隔离和可观测性。在线迁移常用 pre-copy，脏页速率高时可能不收敛。KVM/libvirt 不独立提供完整集群 HA，需要外部控制器、仲裁、fencing 和可靠存储，恢复 VM 后还要验证应用和流量。排障时我不会直接重启，而是按客户机症状、Domain 状态、QEMU 进程、宿主机资源和底层网络存储逐层缩小范围。

## 递进面试题与参考答案

### 1. KVM、QEMU、libvirt 如何分工？

参考答案：KVM 是内核硬件虚拟化接口；QEMU 是用户态虚拟机进程和设备模型；libvirt 提供配置、权限、生命周期、网络、存储和迁移 API；`virsh` 调用 libvirt。回答时要画出从客户端到 `/dev/kvm` 的调用链。

追问：如果 `/dev/kvm` 不存在，QEMU 一定不能启动吗？

回答要点：QEMU 可能使用 TCG 软件模拟启动，但性能和能力不同。生产 KVM 环境应验证实际 accelerator，不能把“能开机”当成“KVM 正常”。

### 2. 为什么说虚拟机也是宿主机进程？

参考答案：一台 QEMU/KVM VM 通常对应一个 QEMU 进程，vCPU 是线程，内存是该进程映射的地址空间，宿主机调度器和 cgroup 仍然控制它。客户机拥有独立内核，但底层资源最终由宿主 Linux 管理。

追问：虚拟机内 CPU 40%，为什么仍可能很慢？

回答要点：检查 steal、宿主机运行队列、热点 pCPU、NUMA 远端访问、I/O wait 和 QEMU 数据面线程；客户机使用率只表示它得到时间后的忙碌程度，不完整反映等待物理资源的时间。

### 3. Virtio 为什么快？

参考答案：Virtio 避免完整模拟传统硬件，客户机驱动与宿主后端通过 virtqueue 交换描述符；vhost 还能缩短部分用户态数据路径，减少 VM exit 和数据拷贝。

追问：为什么不全部使用 SR-IOV？

回答要点：SR-IOV 可降低延迟，但设备数量、迁移、热插拔、策略、观测、驱动和 IOMMU 隔离更复杂。选型要结合性能目标和平台能力。

### 4. qcow2 和 raw 怎么选？

参考答案：qcow2 支持稀疏、backing file、快照和压缩等能力，但元数据和镜像链增加复杂度；raw 结构直接、兼容和性能路径通常更简单。最终要结合预分配、缓存、底层存储和运维流程压测。

追问：快照为什么不是备份？

回答要点：快照通常仍依赖原存储和 backing chain，同一故障域损坏时一起丢失；备份需要独立副本、保留策略和恢复验证，并考虑应用一致性。

### 5. libvirt 的 live 和 config 有什么区别？

参考答案：live 是当前运行实例的配置，config/inactive 是下次启动的持久配置。只改 live 会在重启后丢失，只改 config 不会立即影响当前 VM。变更后应对比两套 XML。

追问：热插拔成功后还要做什么？

回答要点：确认持久配置、客户机识别、监控、容量和回滚；命令返回成功不等于应用已经使用新增资源。

### 6. 在线迁移为什么可能卡住？

参考答案：pre-copy 反复复制脏页，如果客户机写内存速度接近或超过迁移带宽，就难以收敛。还要检查 CPU、机器类型、设备、存储和目标容量兼容性。

追问：post-copy 是否更好？

回答要点：它可避免长时间不收敛，但切换后仍依赖源端和网络拉取缺页，迁移过程故障风险更高。必须结合业务、网络和恢复能力选择。

### 7. KVM 集群如何做 HA？

参考答案：KVM 本身只运行 VM。集群 HA 需要成员与仲裁、fencing、共享或复制存储、资源控制器、目标容量和应用探活。先隔离故障节点，再在安全节点重启，避免双写。

追问：为什么不能 ping 不通就到另一台启动？

回答要点：管理网络不通不代表原节点已经停止写存储；未经 fencing 的重复启动可能造成 split brain 和磁盘损坏。

### 8. 如何排查 KVM 虚拟机磁盘延迟？

参考答案：先确认业务影响和客户机设备延迟，再看 libvirt/QEMU block 统计、IOThread、宿主机文件系统或多路径、网络存储客户端，最后看阵列或 Ceph。把各层时间线和同池其他 VM 对齐。

追问：看到客户机 `await` 高能直接说存储阵列慢吗？

回答要点：不能。队列、客户机文件系统、QEMU 限流、qcow2 链、宿主机拥塞和后端存储都可能贡献延迟，需要分层证据。

### 9. 如何保证虚拟机隔离安全？

参考答案：使用非特权 QEMU 用户、SELinux sVirt/AppArmor、seccomp、namespace、cgroup、最小设备权限、受控 libvirt API、镜像校验和补丁管理。设备直通还要验证 IOMMU group。

追问：遇到 SELinux 拒绝能否先关闭？

回答要点：生产不应以关闭全局防护作为常规修复。应定位被拒绝资源，修正所有权、目录权限、挂载选项或标签，并验证最小授权。

### 10. 如何设计 KVM 容量？

参考答案：按 CPU、内存、存储和网络分别建模，使用峰值与分位数，不只看平均值；扣除宿主机预留、N+1/N+2 故障余量、迁移恢复开销和性能安全余量，再确定超售策略。

追问：CPU 和内存能用同一个超售比吗？

回答要点：不能机械复用。CPU 是可调度时间资源，内存压力可能触发回收、swap 或 OOM，尾延迟和故障影响不同；必须按工作负载和 SLO 验证。

### 11. QEMU Guest Agent 有什么价值和风险？

参考答案：它让宿主机能查询客户机信息、协调关机和文件系统冻结，提高备份和运维协作能力。风险在于它扩展了管理面能力，需要最小权限、审计、超时和客户机内服务治理。

追问：QGA 正常是否能证明业务正常？

回答要点：不能。它只证明管理通道和代理可响应，业务端口、依赖和数据一致性仍需独立探测。

### 12. 宿主机升级如何控制风险？

参考答案：建立兼容矩阵，逐台迁空，升级内核/QEMU/libvirt/固件，重启后验证 KVM、网络、存储和安全，再用金丝雀 VM 测试启动、性能和迁移，最后扩大。回滚优先迁回已验证兼容节点。

追问：为什么包升级成功不等于变更成功？

回答要点：运行 VM、机器类型、固件、安全策略、驱动和迁移兼容性都可能仍有问题，必须用业务和平台验收证明结果。

## 系统设计题

### 题目

设计一个承载 300 台 Linux 业务虚拟机的 KVM 平台，要求单宿主机故障可恢复、支持滚动维护、核心业务 RTO 10 分钟，并接入统一 AIOps 平台。

### 答题框架

1. **澄清需求：** VM 规格与峰值、业务分级、RPO、是否多租户、网络吞吐、存储延迟、机房边界和预算。
2. **计算池：** 同兼容域 CPU 型号，按故障域分集群，预留 N+1/N+2 容量，管理和 BMC 独立。
3. **网络：** 业务、管理、迁移、存储分流或至少逻辑隔离，双上联、bond、双交换机，端到端 MTU 验证。
4. **存储：** 选择经验证的共享或复制存储，明确一致性、缓存、延迟、容量水位、备份和恢复。
5. **控制面：** 使用成熟平台或集群管理器完成调度、仲裁、fencing 和 VM 重启，禁止自制无仲裁脚本。
6. **可用性：** 宿主机、交换机、存储、控制面逐层消除单点；VM HA 和应用 HA 分别设计。
7. **安全：** 管理 API 最小权限、sVirt、镜像供应链、密钥、审计和补丁窗口。
8. **可观测性：** 关联 VM UUID、宿主机、卷、网络和业务，采集四层指标、日志、事件与变更。
9. **变更：** 兼容池、金丝雀、逐台维护、停止条件、迁回路径和季度故障演练。
10. **验收：** 实测宿主机掉电、网络单链路、存储路径、迁移、恢复 300 台中的优先级和 RTO。

优秀回答不会直接给出固定宿主机数量，而会先用业务规格、峰值、超售、故障余量和恢复并发计算。

## 事故复盘题

### 题目

凌晨一台 KVM 宿主机失联，平台在另一节点启动了 20 台 VM，其中 3 台数据库启动后文件系统报错。你如何处理？

### 参考思路

1. **先控影响：** 暂停自动批量重启和对可疑共享磁盘的写入，确认业务流量和数据库主从角色。
2. **确认隔离：** 检查原宿主机是否真正下电或 fencing 成功，排除双节点同时写盘。
3. **建立时间线：** 宿主机心跳、fencing、存储路径、VM 启动、文件系统和数据库日志按时间对齐。
4. **划分故障域：** 比较正常与异常 VM 的宿主机、数据存储、LUN/RBD、文件系统和启动顺序。
5. **形成假设：** 例如 fencing 未完成导致并发写、存储路径在故障期间抖动、缓存持久化语义错误或应用未一致恢复。
6. **验证假设：** 只读检查磁盘与镜像链，使用存储和数据库证据验证；不要在原件上直接做破坏性修复。
7. **选择恢复：** 从一致副本或验证过的备份恢复，必要时隔离损坏卷；每一步保留回退点。
8. **业务验收：** 验证数据库一致性、复制、读写和业务探测，不以 VM running 为结束。
9. **复盘改进：** 修正 fencing、启动门禁、存储一致性监控、恢复优先级和故障演练。

回答重点不是背命令，而是证明你会控制扩大、保护数据、按证据排查并准备回滚。

## 学习检查清单

- [ ] 我能解释 KVM、QEMU、libvirt、`virsh` 和 OpenStack 的边界。
- [ ] 我能画出虚拟机启动和 vCPU 执行路径。
- [ ] 我能画出 Virtio 网络和磁盘 I/O 路径。
- [ ] 我能区分 `qemu:///system` 与 `qemu:///session`。
- [ ] 我能区分 live 配置和持久配置。
- [ ] 我能创建并验证一台 KVM 虚拟机。
- [ ] 我能解释 raw、qcow2、backing chain、快照和备份的区别。
- [ ] 我能解释 pre-copy 迁移为什么可能不收敛。
- [ ] 我能按 CPU、内存、网络、存储四条路径排障。
- [ ] 我能说明 KVM 为什么不等于完整 HA 平台。
- [ ] 我能设计仲裁、fencing、存储和应用验证链路。
- [ ] 我能列出 sVirt、seccomp、cgroup、IOMMU 等安全边界。
- [ ] 我能设计容量、升级、金丝雀和回滚方案。
- [ ] 我完成了网卡故障注入并保留证据。
- [ ] 我能用 30 秒和 3 分钟两种长度讲清 KVM。

## 自测题

1. `/dev/kvm` 在整个技术栈中扮演什么角色？
2. QEMU 使用 TCG 和使用 KVM 有什么区别？
3. 一台 VM 为什么通常对应一个 QEMU 进程？
4. 什么是 VM exit，为什么过多会影响性能？
5. Virtio 和完整设备模拟有什么区别？
6. vhost-net 缩短了哪一段数据路径？
7. NAT、bridge、macvtap 和 SR-IOV 如何取舍？
8. TAP、Linux Bridge 和物理网卡分别在哪里？
9. raw 与 qcow2 的主要取舍是什么？
10. backing chain 为什么不能无限增长？
11. 快照、克隆和备份有什么本质区别？
12. `qemu:///system` 与 `qemu:///session` 为什么会让 VM 看起来“消失”？
13. persistent 和 transient Domain 有什么区别？
14. `--live` 与 `--config` 分别影响什么？
15. `host-passthrough` 为什么可能影响跨主机迁移？
16. vCPU 多于 pCPU 一定有问题吗？应该看哪些证据？
17. 客户机 CPU steal 高说明了什么？
18. 内存 balloon、宿主机 swap 和客户机 swap 有什么区别？
19. HugePages 为什么不是所有 VM 都应默认启用？
20. NUMA 跨节点访问如何形成长尾延迟？
21. 磁盘 cache mode 为什么关系数据安全？
22. 客户机 `fsync` 经过哪些层？
23. QEMU Guest Agent 能做什么，不能证明什么？
24. pre-copy 在线迁移的核心步骤是什么？
25. dirty rate 高于迁移吞吐会发生什么？
26. post-copy 的主要风险是什么？
27. 非共享存储迁移为什么更慢、更复杂？
28. 为什么 HA 接管前必须 fencing？
29. VM HA 为什么不能替代数据库 HA？
30. 如何为 KVM 集群预留 N+1 容量？
31. 如何发现 noisy neighbor？
32. 如何分层排查虚拟磁盘延迟？
33. SELinux 拒绝 QEMU 访问镜像时应如何处理？
34. VFIO 设备直通为什么依赖 IOMMU group？
35. 如何给 libvirt 只读采集程序做最小权限？
36. 哪些键可以关联 VM、宿主机、磁盘和业务？
37. 为什么自动修复前要确认集群所有权？
38. QEMU/libvirt 升级后为什么仍需迁移和业务测试？
39. 如何设计 KVM 平台的金丝雀升级？
40. 一次宿主机故障演练应该保留哪些证据？

## 学习证据

建议建立一个 `kvm-aiops-lab` 仓库，提交：

```text
kvm-aiops-lab/
  README.md
  architecture/
    kvm-stack.md
    cpu-memory-network-storage-path.md
  inventory/
    host-capabilities.sanitized.xml
    domain.sanitized.xml
  scripts/
    collect-kvm-health.sh
  evidence/
    create-vm.md
    network-fault-injection.md
    screenshots/
  runbooks/
    vm-start-failure.md
    vm-network-down.md
    storage-latency.md
  interview/
    30-second-answer.md
    3-minute-answer.md
    follow-up-questions.md
```

`collect-kvm-health.sh` 只做只读采集，并为每条命令设置超时。提交前删除真实 IP、MAC、UUID、主机名、用户名、存储路径、业务名和凭据。

一次合格的学习证据至少包括：

- `virt-host-validate` 和 `/dev/kvm` 验证结果。
- 脱敏后的 Domain XML。
- 虚拟机、网卡、磁盘和 DHCP lease 验证截图或命令输出。
- 网卡故障实验的现象、证据、假设、修复和恢复耗时。
- 一张 KVM 四层监控拓扑图。
- 一份生产 HA、容量、安全、升级与回滚检查单。

## 本文边界与下一步

本文完成的是 KVM/QEMU/libvirt 从零入门到生产设计和面试表达的主线，不覆盖所有 CPU 架构、QMP 指令、实时虚拟化、机密计算、GPU 虚拟化或每一种云平台实现。

建议下一步按这个顺序继续：

1. [Linux 深讲](../foundation/linux.md)：补进程、内存、网络、文件系统和权限基础。
2. [网络基础](../foundation/networking.md)：理解 bridge、路由、NAT、MTU 和 TCP。
3. [Ceph 深讲](../storage-data-protection/ceph.md)：理解 KVM 常见分布式存储后端。
4. [OpenStack 深讲](./openstack.md)：理解大规模 KVM 计算节点如何被 IaaS 控制面管理。
5. [VMware vSphere 深讲](./vsphere.md)：比较商业虚拟化平台的集成能力和运维模型。

真正达到生产和面试要求，需要把本文实验亲自跑通，保留失败证据，完成至少一次宿主机或网络故障演练，并能解释每个设计取舍的业务背景。
