# Linux

> 目标：能看懂一台服务器的基本状态，能用命令定位 CPU、内存、磁盘、网络和服务问题。AIOps 的数据很多都从 Linux 主机和容器节点开始。

## 官方资料

- [Linux kernel documentation](https://docs.kernel.org/)
- [cgroup v2 documentation](https://docs.kernel.org/admin-guide/cgroup-v2.html)
- [Red Hat performance monitoring options](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/8/html/monitoring_and_managing_system_status_and_performance/overview-of-performance-monitoring-options_monitoring-and-managing-system-status-and-performance)

说明：本文是基于官方文档和生产运维场景整理的原创中文学习教程，不复制官方全文。

## 为什么要学

Linux 是运维、SRE、云原生和 AIOps 的共同地基。Prometheus 的 node_exporter、Kubernetes 的 Node、Docker 的 cgroups、systemd 的服务管理、日志采集和自动化脚本，最终都运行在 Linux 上。

如果不会 Linux，AIOps 很容易停留在“看 dashboard”的层面；会 Linux，才能把异常指标一路追到进程、端口、磁盘、内存、日志和内核资源限制。

## 是什么

Linux 是服务器操作系统。它负责管理硬件资源，并给应用程序提供运行环境。你在 AIOps 中看到的很多指标，比如 CPU 使用率、内存使用率、磁盘 IO、网络连接数、进程状态，本质上都来自 Linux。

## 它解决什么问题

- 管理服务器硬件资源，让应用可以稳定运行。
- 提供进程、文件、网络、权限、日志等基础能力。
- 让运维人员可以用命令行快速定位系统问题。
- 给监控系统提供 CPU、内存、磁盘、网络、进程等原始数据。
- 给容器和 Kubernetes 提供资源隔离与调度基础。

## 官网学习路线

学习 Linux 时，不要从“命令大全”开始背。按这个顺序更适合 AIOps：

1. 文件和目录：知道配置、日志、程序一般放在哪里。
2. 进程：知道服务是否运行、为什么退出、占用多少资源。
3. CPU/内存：知道机器是否忙、是否内存不足。
4. 磁盘：知道空间、inode、IO 是否异常。
5. 网络：知道端口是否监听、请求是否能连通。
6. 日志：知道系统和服务把错误写在哪里。
7. 权限：知道为什么脚本不能执行、为什么文件不能读写。
8. cgroups/namespaces：理解容器资源隔离的基础。

## 核心原理

Linux 分为内核态和用户态：

```text
用户命令 / 应用程序
  -> C 库 / 系统调用
  -> Linux Kernel
  -> CPU / 内存 / 磁盘 / 网络设备
```

关键机制：

- 进程调度：内核决定哪个进程使用 CPU。
- 虚拟内存：每个进程看到自己的地址空间。
- 文件系统：一切尽量抽象成文件。
- 网络栈：处理 TCP/IP、路由、防火墙、socket。
- 权限模型：用户、用户组、读写执行权限。
- cgroups：限制和统计资源使用。
- namespaces：隔离进程、网络、挂载点、用户等视图。

## 架构

```text
Application
  -> process
  -> system calls
  -> kernel subsystems
       - scheduler
       - memory manager
       - VFS
       - network stack
       - block layer
       - cgroups
  -> hardware
```

AIOps 需要理解的是：监控系统不是凭空知道机器状态，它从 `/proc`、`/sys`、系统调用、日志、exporter 等地方拿证据。

## 常见目录

```text
/etc        配置文件
/var/log    日志文件
/opt        第三方应用
/usr/bin    常用命令
/proc       内核运行时信息
/sys        设备和内核对象信息
/tmp        临时文件
/home       用户目录
```

## 必学命令

### 系统概览

```bash
uname -a
uptime
hostnamectl
whoami
date
```

### CPU 和负载

```bash
top
uptime
mpstat 1
pidstat 1
```

关注：

- load average 是否长期高于 CPU 核数。
- CPU 使用率是 user 高、system 高，还是 iowait 高。
- 单个进程是否持续占用 CPU。

### 内存

```bash
free -h
vmstat 1
cat /proc/meminfo
```

关注：

- available memory。
- swap 是否大量使用。
- OOM killer 日志。

### 磁盘空间和 IO

```bash
df -h
df -i
du -sh /var/log/*
iostat -xz 1
```

关注：

- 空间是否满。
- inode 是否满。
- await、util、r/s、w/s 是否异常。

### 网络

```bash
ip addr
ip route
ss -tulnp
curl -v http://localhost:8080/health
dig example.com
ping example.com
```

关注：

- 服务是否监听正确端口。
- DNS 是否解析。
- 连接是否超时。
- HTTP 状态码是否异常。

### 日志

```bash
journalctl -xe
journalctl -u nginx -n 100
tail -f /var/log/syslog
tail -f /var/log/messages
```

## 配置重点

Linux 本身没有一个单独配置文件。学习时重点关注：

- `/etc/hosts`：本地域名解析。
- `/etc/resolv.conf`：DNS 配置。
- `/etc/fstab`：磁盘挂载。
- `/etc/sysctl.conf`：内核参数。
- `/etc/security/limits.conf`：进程资源限制。
- systemd unit：服务启动配置。

常见内核参数示例：

```bash
sysctl net.ipv4.ip_forward
sysctl vm.swappiness
sysctl fs.file-max
```

## AIOps 中的作用

Linux 是 AIOps 的最底层数据来源：

- node_exporter 采集 Linux 主机指标。
- 容器运行时依赖 cgroups/namespaces。
- Kubernetes 节点故障最终会落到 Linux 资源、网络、磁盘。
- 自动化 runbook 经常执行 Linux 命令做检查。

## 入门实验

创建学习记录：`docs/learning-records/linux-first-check.md`

内容模板：

```md
# Linux 第一次体检

## 机器信息
- 主机名：
- 内核版本：
- 当前时间：

## CPU
粘贴 `uptime` 和 `top` 里你看懂的部分。

## 内存
粘贴 `free -h` 输出，并解释 available 是多少。

## 磁盘
粘贴 `df -h` 输出，找出使用率最高的分区。

## 网络
用 `ss -tulnp` 找出监听端口。

## 我还不懂
- 问题 1
- 问题 2
- 问题 3
```

## 排障清单

服务不可用时按顺序看：

1. 进程是否存在：`ps -ef | grep app`
2. 端口是否监听：`ss -tulnp`
3. 本机是否能访问：`curl -v localhost:port`
4. 日志是否有错误：`journalctl -u app -n 100`
5. 磁盘是否满：`df -h`
6. 内存是否不足：`free -h`
7. CPU 或 IO 是否打满：`top`、`iostat`

## 学习检查清单

- [ ] 我能解释 Linux 内核态和用户态的区别。
- [ ] 我能说出 `/etc`、`/var/log`、`/proc`、`/sys` 的作用。
- [ ] 我能用 `top`、`free -h`、`df -h` 看基础资源状态。
- [ ] 我能用 `ss -tulnp` 判断端口是否监听。
- [ ] 我能用 `journalctl` 或日志文件查看服务错误。
- [ ] 我能解释 cgroups 和 namespaces 为什么和容器有关。
- [ ] 我能按固定顺序排查“服务不可用”问题。
- [ ] 我能把一次 Linux 体检记录提交到 GitHub。

## 面试题

1. Linux 中进程、线程和服务有什么区别？
2. load average 高一定代表 CPU 忙吗？
3. `free -h` 中 available 和 free 有什么区别？
4. 磁盘空间没满但文件写不进去，可能是什么原因？
5. 如何判断服务是否监听了正确端口？
6. `/proc` 目录里的信息来自哪里？
7. cgroups 和 namespaces 分别解决什么问题？
8. 如果一个服务访问不了，你会按什么顺序排查？
9. node_exporter 采集的很多指标为什么和 Linux 有关？
10. Linux 排障记录如何转成 AIOps 学习证据？

## 学习证据

- 一篇 Linux 体检记录。
- 一篇故障案例卡：某个服务为什么不可用。
- 一个脚本：自动输出 CPU、内存、磁盘、网络摘要。
