# Linux 深讲

> 学习目标：理解 Linux 操作系统如何工作，能看懂内核、用户态、进程、内存、文件系统、网络、权限和日志这些基础概念；能掌握 AIOps / SRE 入门必会命令，并能用它们定位 CPU、内存、磁盘、网络和服务问题。

## 官方资料

- [Linux kernel documentation](https://docs.kernel.org/)
- [Linux kernel admin guide](https://docs.kernel.org/admin-guide/)
- [The Linux man-pages project](https://www.kernel.org/doc/man-pages/)
- [proc filesystem manual](https://man7.org/linux/man-pages/man5/proc.5.html)
- [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html)
- [GNU Coreutils manual](https://www.gnu.org/software/coreutils/manual/coreutils.html)
- [systemd documentation](https://systemd.io/)
- [Red Hat performance monitoring options](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/8/html/monitoring_and_managing_system_status_and_performance/overview-of-performance-monitoring-options_monitoring-and-managing-system-status-and-performance)

说明：Linux 不是一本单独的“命令大全”。Linux 严格来说主要指内核；你平时输入的很多命令来自 GNU coreutils、util-linux、procps-ng、iproute2、systemd、发行版包管理器等用户态项目。本文按官方资料的结构重新组织成 AIOps 初学者能学懂、能实操、能排障的中文教程。

## 场景开场

“Grafana 上 CPU 飙高，服务超时，告警响了。你第一步该看什么？”

如果只会说“Linux 是操作系统”，排障时还是会卡住。你需要知道：应用是进程，进程由内核调度；内存不足可能触发 OOM；磁盘满可能是空间满，也可能是 inode 满；端口不通可能是进程没监听、路由不通、防火墙拦截或 DNS 解析错。

Linux 是 AIOps 的地基。指标、日志、容器、Kubernetes 节点、自动化脚本，最后都会落到 Linux 这层。

## 一句话人话版

Linux 是服务器的底层管家：它用内核管理 CPU、内存、磁盘、网络和进程，再通过系统调用、文件系统、命令行和服务管理工具把这些能力交给应用和运维人员使用。

## 小白可能会问

- Linux 内核到底是什么，和 Ubuntu、CentOS、Debian 是什么关系？
- 用户态、内核态、系统调用分别是什么意思？
- `/proc`、`/sys`、`/etc`、`/var/log` 这些目录为什么这么重要？
- Linux 一共有多少命令？哪些是 AIOps 入门必须会的？
- 每个命令到底在看什么字段，怎么判断正常还是异常？

## 为什么要学

Linux 是运维、SRE、云原生和 AIOps 的共同地基。

Prometheus 的 `node_exporter` 从 Linux 读取主机指标；Docker 和 Kubernetes 依赖 cgroups、namespaces、网络和文件系统；systemd 管理服务；日志采集器读取文件或 journald；自动化 runbook 大量执行 Linux 命令。

不会 Linux，AIOps 很容易停留在“看 dashboard”的层面。会 Linux，才能把异常指标一路追到进程、端口、日志、磁盘、内存、网络和内核限制。

## 官方知识地图

Linux 官方资料不是按“新手教程”写的，而是围绕内核和系统接口展开。学习时可以把它拆成这几层：

```text
应用程序 / 命令 / Shell
  -> C 库 / 运行时
  -> 系统调用
  -> Linux 内核
       - 进程调度
       - 内存管理
       - 虚拟文件系统 VFS（统一文件访问接口）
       - 块设备和 IO（输入输出）
       - 网络协议栈
       - 设备驱动
       - cgroups（资源控制组）/ namespaces（命名空间隔离）
       - 安全和权限
  -> 硬件 / 虚拟机 / 云主机
```

本文按 AIOps 排障顺序学习：

1. Linux 是什么。
2. Linux 怎么启动和运行。
3. 内核、用户态、系统调用。
4. 文件系统和目录结构。
5. 用户、权限和 sudo。
6. 进程、线程和服务。
7. CPU、负载和调度。
8. 内存、缓存、swap 和 OOM。
9. 磁盘、inode、挂载和 IO。
10. 网络、端口、路由和 DNS。
11. 日志、journald 和内核日志。
12. AIOps 必会命令字典。
13. 一次完整 Linux 体检实验。

## Linux 是什么

严格说，Linux 是操作系统内核。Ubuntu、Debian、CentOS、Rocky Linux、AlmaLinux 这些通常叫 Linux 发行版。

一个发行版通常包含：

| 组成 | 作用 |
|---|---|
| Linux kernel | 管理硬件、进程、内存、文件系统、网络 |
| GNU / 用户态工具 | `ls`、`cp`、`mv`、`cat` 等常用命令 |
| Shell | 命令解释器，如 Bash、Zsh |
| systemd 或其他 init | 系统启动和服务管理 |
| 包管理器 | `apt`、`dnf`、`yum` 等 |
| 默认目录结构 | `/etc`、`/var`、`/usr`、`/home` 等 |
| 发行版配置 | 默认内核参数、仓库、服务、日志路径 |

所以，当你说“学 Linux”时，其实是在学三件事：

```text
Linux 内核原理
  + Linux 用户态命令
  + Linux 服务器运维方式
```

## Linux 怎么工作

### 用户态和内核态

CPU 执行代码时有不同权限级别。普通应用运行在用户态，不能直接操作硬件；内核运行在内核态，可以管理硬件和系统资源。

```text
用户态：nginx、python、bash、top、curl
  -> 通过系统调用请求内核
内核态：Linux kernel
  -> 管理 CPU / 内存 / 磁盘 / 网络 / 设备
```

为什么要分开？

- 防止普通程序随便改内存、磁盘和硬件。
- 一个程序崩溃时，不应该直接拖垮整个系统。
- 内核统一管理资源，保证多个进程能共享机器。

### 系统调用

系统调用是用户态程序请求内核帮忙的接口。

例子：

| 操作 | 背后常见系统调用 |
|---|---|
| 打开文件 | `open` |
| 读取文件 | `read` |
| 写入文件 | `write` |
| 创建进程 | `fork` / `clone` |
| 执行程序 | `execve` |
| 建立网络连接 | `socket` / `connect` |
| 修改权限 | `chmod` |

你执行：

```bash
cat /var/log/syslog
```

可以理解成：

```text
cat 程序
  -> open("/var/log/syslog")（请求打开日志文件）
  -> read(...)（从已打开文件读取字节）
  -> write(标准输出)
  -> 终端显示内容
```

### Linux 启动过程

不同发行版细节不同，但主线通常是：

```text
BIOS / UEFI（主板固件启动环境）
  -> bootloader，例如 GRUB
  -> 加载 Linux kernel
  -> 挂载根文件系统
  -> 启动 PID 1，常见是 systemd
  -> systemd 启动基础服务
  -> 网络、日志、SSH、业务服务陆续启动
```

排障时对应的问题：

| 阶段 | 常见问题 | 你会看什么 |
|---|---|---|
| bootloader | 机器起不来 | 云控制台、启动日志 |
| kernel | 内核 panic、驱动问题 | `dmesg`、console log |
| root filesystem | 根盘挂载失败 | `/etc/fstab`、磁盘 UUID |
| systemd | 服务启动失败 | `systemctl status`、`journalctl` |
| network | 网络没起来 | `ip addr`、`ip route` |

## 文件系统和目录结构

Linux 把很多资源都抽象成文件。普通文件、目录、设备、管道、socket，在很多场景下都能通过统一的文件接口访问。

### 常见目录

| 目录 | 作用 | AIOps / 运维关注点 |
|---|---|---|
| `/` | 根目录 | 所有目录的起点 |
| `/bin` | 基础命令 | 常见系统命令 |
| `/sbin` | 系统管理命令 | 网络、磁盘、服务管理命令 |
| `/usr/bin` | 用户命令 | 大多数命令所在位置 |
| `/usr/sbin` | 管理命令 | 管理类工具 |
| `/etc` | 配置文件 | DNS、服务、系统参数、启动配置 |
| `/var` | 可变数据 | 日志、缓存、队列、数据库文件 |
| `/var/log` | 日志 | 系统日志、应用日志 |
| `/home` | 普通用户目录 | 用户文件和脚本 |
| `/root` | root 用户目录 | root 的家目录 |
| `/tmp` | 临时文件 | 临时文件可能被清理 |
| `/opt` | 第三方软件 | 手动安装软件常放这里 |
| `/proc` | 进程和内核运行时信息 | CPU、内存、进程、内核参数 |
| `/sys` | 设备和内核对象 | cgroup、设备、内核状态 |
| `/dev` | 设备文件 | 磁盘、终端、随机数设备 |
| `/run` | 运行时状态 | pid 文件、socket、临时状态 |

### `/proc` 是什么

`/proc` 是 procfs，里面不是普通磁盘文件，而是内核暴露出来的运行时信息。

常用文件：

| 路径 | 含义 |
|---|---|
| `/proc/cpuinfo` | CPU 信息 |
| `/proc/meminfo` | 内存信息 |
| `/proc/loadavg` | 负载 |
| `/proc/uptime` | 启动时长 |
| `/proc/<pid>/` | 某个进程的信息 |
| `/proc/<pid>/cmdline` | 进程启动命令 |
| `/proc/<pid>/fd/` | 进程打开的文件描述符 |
| `/proc/sys/` | 可读写的内核参数 |

示例：

```bash
cat /proc/meminfo
cat /proc/loadavg
ls -l /proc/1/fd
```

### `/sys` 是什么

`/sys` 是 sysfs，主要暴露设备、驱动、内核对象和 cgroup 等信息。

容器和 Kubernetes 排障时，经常会接触：

```text
/sys/fs/cgroup
```

这里能看到 cgroups 对 CPU、内存、IO 等资源的限制和统计。

## 用户、权限和 sudo

Linux 是多用户系统。每个进程都有运行用户，每个文件都有属主、属组和权限。

### 用户和组

查看当前用户：

```bash
whoami
id
groups
```

`id` 输出示例：

```text
uid=1000(aiops) gid=1000(aiops) groups=1000(aiops),27(sudo)
```

含义：

| 字段 | 说明 |
|---|---|
| uid | 用户 ID |
| gid | 主组 ID |
| groups | 用户所属附加组 |

### 文件权限

查看文件：

```bash
ls -l app.sh
```

输出示例：

```text
-rwxr-xr-- 1 aiops aiops 120 Jul 02 10:00 app.sh
```

拆开看：

```text
-        文件类型
rwx      属主权限：读、写、执行
r-x      属组权限：读、执行
r--      其他人权限：读
aiops    属主
aiops    属组
```

权限数字：

| 数字 | 权限 |
|---:|---|
| 4 | read，读 |
| 2 | write，写 |
| 1 | execute，执行 |

常见命令：

```bash
chmod +x app.sh
chmod 644 config.yaml
chmod 755 script.sh
chown app:app app.log
```

排障例子：

| 现象 | 可能原因 | 检查 |
|---|---|---|
| 脚本不能执行 | 没有执行权限 | `ls -l script.sh` |
| 日志写不进去 | 目录属主不对 | `ls -ld /var/log/app` |
| 服务启动失败 | systemd 用户无权限 | `journalctl -u app -n 100` |

## 进程、线程和服务

### 进程是什么

进程是正在运行的程序实例。

一个程序文件可以启动多个进程。例如 `/usr/sbin/nginx` 是程序文件，运行后会产生 nginx master 和 worker 进程。

进程有：

| 字段 | 含义 |
|---|---|
| PID | 进程 ID |
| PPID | 父进程 ID |
| USER | 运行用户 |
| CMD | 启动命令 |
| 状态 | 运行、睡眠、僵尸等 |
| 资源使用 | CPU、内存、打开文件、网络连接 |

### 线程是什么

线程是进程内部的执行单元。一个进程可以有多个线程，共享同一个进程的内存空间。

排障时可以这样理解：

```text
进程：一个服务实例
线程：这个服务里面同时干活的工人
```
### 服务是什么

服务通常是长期运行的后台进程，由 systemd 管理。

```bash
systemctl status nginx
journalctl -u nginx -n 100
```

## CPU、负载和调度

### CPU 使用率

CPU 使用率不是一个单一数字，要看它花在哪里。

常见分类：

| 类型 | 含义 | 排障方向 |
|---|---|---|
| user | 用户态程序占用 | 应用代码、计算任务 |
| system | 内核态占用 | 系统调用、网络、IO、内核开销 |
| iowait | CPU 空闲期间存在未完成 IO 的一种统计 | 结合设备延迟和任务等待判断，不能当成某进程等待时间 |
| steal | 被虚拟化宿主抢走 | 云主机资源争用 |
| idle | 空闲 | CPU 没忙 |

### load average

`uptime` 会显示 load average：

```bash
uptime
```

示例：

```text
10:00:00 up 5 days,  2 users,  load average: 0.80, 1.20, 1.50
```

三个数字分别表示最近 1、5、15 分钟平均负载。

注意：load average 不等于 CPU 使用率。它统计可运行任务（包括正在运行和等待 CPU）以及不可中断等待任务的平均数量，后者常见于 IO 等待。CPU 忙、磁盘 IO 堵塞，都可能让 load 升高。

判断方法：

```text
如果 4 核机器 load 长期大于 4，需要进一步看 CPU 和 IO。
如果 CPU 不高但 load 高，要重点怀疑 IO wait 或不可中断任务。
```

## 内存、缓存、swap 和 OOM

### free 和 available

查看内存：

```bash
free -h
```

关键字段：

| 字段 | 含义 |
|---|---|
| total | 总内存 |
| used | 已使用 |
| free | 完全空闲 |
| buff/cache | 内核用于缓存的内存 |
| available | 估算还能给应用使用的内存 |

新手常见误解：看到 `free` 很低就以为内存不够。Linux 会尽量用空闲内存做缓存，所以更应该关注 `available`。

### swap

swap 是把一部分磁盘当作内存后备。大量使用 swap 说明内存压力可能很大，也会让服务变慢。

查看：

```bash
swapon --show
free -h
```

### OOM

OOM 是 Out Of Memory。内存不足时，内核可能杀掉某个进程。

检查：

```bash
dmesg -T | grep -i oom
journalctl -k | grep -i oom
```

## 磁盘、inode、挂载和 IO

### 空间满

查看磁盘空间：

```bash
df -h
```

关键字段：

| 字段 | 含义 |
|---|---|
| Filesystem | 文件系统或设备 |
| Size | 总大小 |
| Used | 已用 |
| Avail | 可用 |
| Use% | 使用率 |
| Mounted on | 挂载点 |

### inode 满

小文件太多时，空间没满也可能无法创建新文件。

```bash
df -i
```

### 找大目录

```bash
du -sh /var/log/*
du -ah /var/log | sort -h | tail -20
```

### 磁盘 IO

```bash
iostat -xz 1
```

重点字段：

| 字段 | 含义 |
|---|---|
| r/s | 每秒读请求 |
| w/s | 每秒写请求 |
| await | IO 平均等待时间 |
| %util | 设备繁忙程度 |

如果 `%util` 长期接近 100%，且 `await` 很高，磁盘可能是瓶颈；并行度高的 SSD、NVMe 或阵列还要结合队列深度、吞吐、延迟和设备能力判断，不能只凭 `%util` 宣布容量耗尽。

## 网络、端口、路由和 DNS

一次 HTTP 请求大致经过：

```text
域名
  -> DNS 解析成 IP
  -> TCP 建连
  -> TLS 握手，如果是 HTTPS
  -> HTTP 请求
  -> 负载均衡 / NGINX / Ingress
  -> 应用端口
  -> 下游数据库 / 缓存 / MQ
```

### IP 地址

```bash
ip addr
```

看网卡是否有 IP。

### 路由

```bash
ip route
```

看默认网关和路由规则。

### 端口监听

```bash
ss -tulnp
```

常用字段：

| 字段 | 含义 |
|---|---|
| State | 连接状态 |
| Local Address:Port | 本地监听地址和端口 |
| Peer Address:Port | 对端地址和端口 |
| Process | 进程信息 |

如果服务监听 `127.0.0.1:8080`，外部机器通常访问不了；如果监听 `0.0.0.0:8080`，表示监听所有 IPv4 地址。

### DNS

```bash
dig example.com
nslookup example.com
cat /etc/resolv.conf
```

### HTTP 检查

```bash
curl -v http://localhost:8080/health
curl -I https://example.com
```

`curl -v` 能看到 DNS、连接、TLS、请求头、响应头等过程。

## 日志和 journald

日志是排障证据。Linux 上常见日志来源：

| 来源 | 常见位置 / 命令 |
|---|---|
| systemd 服务日志 | `journalctl -u service` |
| 内核日志 | `dmesg`、`journalctl -k` |
| 系统日志 | `/var/log/syslog` 或 `/var/log/messages` |
| 应用日志 | `/var/log/app/` 或应用自定义目录 |
| 容器日志 | `docker logs`、Kubernetes logs |

常用命令：

```bash
journalctl -xe
journalctl -u nginx -n 100
journalctl -u nginx -f
journalctl -k
dmesg -T
tail -f /var/log/syslog
```

## AIOps 必会命令字典

Linux 命令没有一个“内核官方全集”。下面是 AIOps / SRE 入门必须掌握的命令集合。学习顺序按排障常用程度排列。

### 帮助和命令定位

| 命令 | 作用 | 常用用法 | 你要看懂什么 |
|---|---|---|---|
| `man` | 查看手册 | `man ps` | 命令说明、选项、字段 |
| `--help` | 查看简短帮助 | `ls --help` | 常用参数 |
| `type` | 判断命令来源 | `type cd` | 是 shell builtin 还是外部命令 |
| `which` | 查命令路径 | `which nginx` | 命令二进制位置 |
| `whereis` | 查命令和文档 | `whereis nginx` | 二进制、源码、man 路径 |
| `apropos` | 按关键词搜手册 | `apropos network` | 不知道命令名时搜索 |

示例：

```bash
type cd
which python
man ss
```

### 系统概览

| 命令 | 作用 | 常用用法 | AIOps 场景 |
|---|---|---|---|
| `uname` | 查看内核信息 | `uname -a` | 确认内核版本 |
| `hostnamectl` | 查看主机信息 | `hostnamectl` | 确认主机名、系统版本 |
| `uptime` | 查看运行时间和负载 | `uptime` | 判断 load 是否异常 |
| `date` | 查看时间 | `date` | 排查日志时间和时区 |
| `whoami` | 当前用户 | `whoami` | 判断权限上下文 |
| `id` | 用户和组 | `id` | 判断是否有 sudo / 组权限 |
| `env` | 环境变量 | `env` | 可能含密钥；仅本机查看必要项，不上传完整输出 |

### 文件和目录

| 命令 | 作用 | 常用用法 | 常见坑 |
|---|---|---|---|
| `pwd` | 当前目录 | `pwd` | 脚本里相对路径依赖当前目录 |
| `ls` | 列目录 | `ls -lah` | 隐藏文件要加 `-a` |
| `cd` | 切目录 | `cd /var/log` | shell builtin，不是外部程序 |
| `tree` | 树形目录 | `tree -L 2` | 有些系统默认没装 |
| `touch` | 创建空文件或更新时间 | `touch app.log` | 不会创建父目录 |
| `mkdir` | 创建目录 | `mkdir -p logs/app` | 多级目录用 `-p` |
| `cp` | 复制 | `cp -r src dst` | 复制目录要 `-r` |
| `mv` | 移动/改名 | `mv old new` | 会覆盖目标，操作前确认 |
| `rm` | 删除 | `rm file` | 危险命令，谨慎使用 |
| `ln` | 创建链接 | `ln -s target link` | 软链接路径容易写错 |
| `file` | 判断文件类型 | `file app` | 看是不是二进制、文本、压缩包 |
| `stat` | 查看元数据 | `stat file` | 看权限、时间、inode |
| `find` | 查找文件 | `find /var/log -name "*.log"` | 范围太大会慢 |

### 文本查看和处理

| 命令 | 作用 | 常用用法 | AIOps 场景 |
|---|---|---|---|
| `cat` | 输出文件 | `cat config.yaml` | 看小文件 |
| `less` | 分页查看 | `less app.log` | 看大文件 |
| `head` | 看开头 | `head -n 20 app.log` | 看文件格式 |
| `tail` | 看结尾 | `tail -n 100 app.log` | 看最新日志 |
| `tail -f` | 持续跟踪 | `tail -f app.log` | 实时看日志 |
| `grep` | 过滤文本 | `grep -i error app.log` | 查错误 |
| `awk` | 按列处理 | `awk '{print $1}' access.log` | 提取字段 |
| `sed` | 流式替换 | `sed 's/old/new/g' file` | 批量替换 |
| `sort` | 排序 | `sort file` | 排序统计 |
| `uniq` | 去重 | `sort file | uniq -c` | 统计重复行 |
| `wc` | 计数 | `wc -l app.log` | 统计行数 |
| `cut` | 切列 | `cut -d',' -f1 alerts.csv` | 简单 CSV 字段 |
| `tee` | 同时输出和写文件 | `cmd | tee out.log` | 保留执行证据 |
| `xargs` | 把输入转参数 | `cat hosts | xargs -I{} ping -c1 {}` | 批量处理 |

### 权限和用户

| 命令 | 作用 | 常用用法 | AIOps 场景 |
|---|---|---|---|
| `chmod` | 修改权限 | `chmod +x script.sh` | 脚本不能执行 |
| `chown` | 修改属主 | `chown app:app app.log` | 服务写日志失败 |
| `chgrp` | 修改属组 | `chgrp app file` | 组权限调整 |
| `umask` | 默认权限掩码 | `umask` | 新文件权限异常 |
| `sudo` | 提权执行 | `sudo systemctl restart nginx` | 管理服务 |
| `su` | 切换用户 | `su - app` | 模拟服务用户 |
| `passwd` | 修改密码 | `passwd user` | 用户维护 |

### 进程和服务

| 命令 | 作用 | 常用用法 | 关键字段 |
|---|---|---|---|
| `ps` | 进程快照 | `ps -ef`、`ps aux` | PID、PPID、USER、STAT、CMD |
| `top` | 实时资源 | `top` | CPU、内存、load、进程排序 |
| `pgrep` | 按名称找 PID | `pgrep -a nginx` | PID 和命令 |
| `pkill` | 按名称杀进程 | `pkill -f app.py` | 危险，先确认 |
| `kill` | 发信号 | `kill -TERM <pid>` | 结束进程 |
| `nice` | 设置优先级启动 | `nice -n 10 cmd` | CPU 调度优先级 |
| `renice` | 调整运行中进程优先级 | `renice 10 -p <pid>` | 调整 CPU 争用 |
| `lsof` | 查看打开文件 | `lsof -p <pid>` | 文件、端口、库 |
| `systemctl` | 管理服务 | `systemctl status nginx` | active、loaded、日志提示 |
| `journalctl` | 查服务日志 | `journalctl -u nginx -n 100` | 错误堆栈、退出码 |

### CPU 和内存

| 命令 | 作用 | 常用用法 | 重点 |
|---|---|---|---|
| `free` | 内存概览 | `free -h` | available、swap |
| `vmstat` | CPU/内存/IO 概览 | `vmstat 1` | r、b、si、so、wa |
| `mpstat` | CPU 统计 | `mpstat 1` | user、system、iowait |
| `pidstat` | 进程资源 | `pidstat 1` | 哪个进程占 CPU |
| `dmesg` | 内核日志 | `dmesg -T` | OOM、磁盘、驱动错误 |

如果 `mpstat`、`pidstat` 不存在，通常需要安装 `sysstat`。

### 磁盘和文件系统

| 命令 | 作用 | 常用用法 | 排障点 |
|---|---|---|---|
| `df` | 文件系统空间 | `df -h`、`df -i` | 空间和 inode |
| `du` | 目录占用 | `du -sh /var/log/*` | 找大目录 |
| `lsblk` | 块设备 | `lsblk` | 磁盘和分区关系 |
| `blkid` | 设备 UUID | `blkid` | `/etc/fstab` |
| `mount` | 挂载 | `mount` | 当前挂载 |
| `umount` | 卸载 | `umount /mnt/data` | 卸载前确认未占用 |
| `findmnt` | 查看挂载树 | `findmnt` | 挂载来源和目标 |
| `iostat` | 磁盘 IO | `iostat -xz 1` | await、util |

### 网络

| 命令 | 作用 | 常用用法 | 排障点 |
|---|---|---|---|
| `ip addr` | 查看 IP | `ip addr` | 网卡是否有地址 |
| `ip link` | 查看链路 | `ip link` | 网卡 up/down |
| `ip route` | 查看路由 | `ip route` | 默认网关 |
| `ss` | 查看端口和连接 | `ss -tulnp` | 监听端口和进程 |
| `ping` | ICMP 连通 | `ping -c 4 host` | 网络是否能到 |
| `curl` | HTTP 请求 | `curl -v URL` | HTTP/TLS 细节 |
| `dig` | DNS 查询 | `dig example.com` | DNS 结果 |
| `nslookup` | DNS 查询 | `nslookup example.com` | DNS 结果 |
| `traceroute` | 路由跟踪 | `traceroute host` | 路径中断位置 |
| `nc` | TCP 测试 | `nc -vz host 443` | 端口是否通 |
| `tcpdump` | 抓包 | `tcpdump -i eth0 port 80` | 是否有包进出 |

### 压缩、归档和传输

| 命令 | 作用 | 常用用法 | 场景 |
|---|---|---|---|
| `tar` | 打包/解包 | `tar -czf logs.tar.gz logs/` | 打包日志 |
| `gzip` | 压缩 | `gzip app.log` | 压缩单文件 |
| `scp` | 复制到远程 | `scp file host:/tmp/` | 传日志 |
| `rsync` | 同步 | `rsync -av src/ host:/dst/` | 增量同步 |
| `ssh` | 远程登录 | `ssh user@host` | 登录机器 |

## 排障方法：从现象到证据

### 服务不可用

按这个顺序查：

1. 服务是否存在。

```bash
systemctl status app
ps -ef | grep app
```

2. 端口是否监听。

```bash
ss -tulnp | grep 8080
```

3. 本机能否访问。

```bash
curl -v http://localhost:8080/health
```

4. 日志是否有错误。

```bash
journalctl -u app -n 100
tail -n 100 /var/log/app/app.log
```

5. 资源是否异常。

```bash
uptime
free -h
df -h
iostat -xz 1
```

### CPU 高

1. 看整体负载。

```bash
uptime
top
```

2. 找进程。

```bash
ps aux --sort=-%cpu | head
pidstat 1
```

3. 判断是 user、system 还是 iowait。

```bash
mpstat 1
```

### 内存高

```bash
free -h
ps aux --sort=-%mem | head
dmesg -T | grep -i oom
```

判断：

- `available` 是否很低。
- swap 是否明显使用。
- 是否出现 OOM killer。

### 磁盘满

```bash
df -h
df -i
du -sh /var/log/*
find /var/log -type f -size +100M
```

### 端口不通

```bash
ss -tulnp
ip addr
ip route
curl -v http://host:port
nc -vz host port
```

判断：

- 服务是否监听。
- 监听地址是不是 `127.0.0.1`。
- 目标 IP 和端口是否正确。
- 路由和 DNS 是否正常。

## 在 AIOps 中的作用

Linux 提供 AIOps 最基础的证据：

| AIOps 数据 | Linux 来源 |
|---|---|
| CPU 指标 | `/proc/stat`、node_exporter |
| 内存指标 | `/proc/meminfo` |
| 磁盘指标 | `/proc/diskstats`、文件系统 |
| 网络指标 | `/proc/net/*`、网卡统计 |
| 进程状态 | `/proc/<pid>` |
| 服务状态 | systemd |
| 系统日志 | journald、`/var/log` |
| 容器资源 | cgroups、namespaces |

如果做一个 AIOps 项目，Linux 层至少要能提供：

- 主机指标采集。
- 服务进程和端口检查。
- 日志采集。
- 故障前后资源变化。
- 自动化 runbook 检查命令。

## 入门实验：做一次 Linux 服务器体检

创建文件：`docs/learning-records/linux-first-check.md`

内容模板：

````md
# Linux 第一次体检

## 1. 机器信息

命令：

```bash
hostnamectl
uname -a
date
uptime
```

我看到的结果：

- 主机名：
- 内核版本：
- 运行时长：
- load average：

## 2. CPU

命令：

```bash
top
mpstat 1 3
```

记录：

- CPU 核数：
- user/system/iowait 哪个高：
- 最占 CPU 的进程：

## 3. 内存

命令：

```bash
free -h
cat /proc/meminfo | head
```

记录：

- total：
- available：
- swap 是否使用：

## 4. 磁盘

命令：

```bash
df -h
df -i
du -sh /var/log/*
```

记录：

- 使用率最高的挂载点：
- inode 是否紧张：
- 最大日志目录：

## 5. 网络

命令：

```bash
ip addr
ip route
ss -tulnp
curl -v http://localhost:8080/health
```

记录：

- 本机 IP：
- 默认路由：
- 正在监听的端口：
- health check 是否成功：

## 6. 日志

命令：

```bash
journalctl -xe -n 50
dmesg -T | tail -50
```

记录：

- 最近是否有错误：
- 是否有 OOM、磁盘、网络相关日志：

## 7. 我还没懂的问题

- 问题 1：
- 问题 2：
- 问题 3：
````

## 学习检查清单

- [ ] 我能解释 Linux 内核和 Linux 发行版的区别。
- [ ] 我能画出用户态、系统调用、内核态、硬件之间的关系。
- [ ] 我能解释进程、线程、服务的区别。
- [ ] 我能解释 `/proc` 和 `/sys` 为什么不是普通目录。
- [ ] 我能看懂 `/etc`、`/var/log`、`/usr/bin`、`/run` 的作用。
- [ ] 我能解释 `rwx` 权限和 `chmod 755` 的含义。
- [ ] 我能用 `ps`、`top`、`pidstat` 找到高 CPU 进程。
- [ ] 我能用 `free`、`vmstat`、`dmesg` 判断内存压力和 OOM。
- [ ] 我能用 `df`、`du`、`iostat` 排查磁盘空间和 IO。
- [ ] 我能用 `ip`、`ss`、`curl`、`dig` 排查网络和端口。
- [ ] 我能用 `journalctl`、`dmesg`、`tail` 查看服务和系统日志。
- [ ] 我能写一篇 Linux 体检记录提交到 GitHub。

## 面试题

1. Linux 内核和 Linux 发行版有什么区别？
2. 用户态和内核态为什么要分开？
3. 什么是系统调用？举 3 个例子。
4. 进程、线程、服务有什么区别？
5. load average 高一定代表 CPU 忙吗？
6. `free -h` 里 free 和 available 有什么区别？
7. `/proc` 目录里的内容来自哪里？
8. 磁盘空间没满但文件写不进去，可能是什么原因？
9. 如何判断服务是否监听了正确端口？
10. 容器为什么和 cgroups、namespaces 有关？
11. OOM 时你会看哪些命令和日志？
12. 一个服务访问不了，你会按什么顺序排查？

## 面试怎么讲

Linux 是 AIOps 的底层数据来源。严格说 Linux 是内核，发行版是在内核之上加上用户态工具、服务管理、包管理和默认配置。应用运行在用户态，通过系统调用请求内核管理 CPU、内存、文件系统、网络和设备。排障时我会先确认服务进程和端口，再看日志、CPU、内存、磁盘、网络和内核日志，把 dashboard 上的异常追到具体证据，例如进程、端口、OOM、inode、IO wait 或 DNS 问题。

## 老师带你走一遍：点击告警详情以后，Linux 做了什么

先想象一个具体场景：你点击“查看订单错误日志”，请求到了服务器上的 Python 服务。这个服务是一个进程，进程中处理请求的线程需要 CPU 执行代码；查询日志时要读文件或发网络请求；生成结果时要分配内存；最后通过 socket（网络通信端点）把结果发回。

CPU、内存、磁盘和网络不是四个互不相干的报表，它们在同一个请求里协作。服务变慢时，线程可能在等 CPU，也可能在等磁盘、数据库或锁。老师让你先回答“它在忙什么，或者在等什么”，再选命令。这样你不会看到内存占用高就清缓存，看到负载高就加 CPU。

```text
应用线程准备处理请求
  -> 调度器分配 CPU 时间
  -> 虚拟地址映射到内存页
  -> 系统调用读文件或发送网络数据
  -> 内核与设备完成工作
  -> 线程恢复执行并返回结果
```

这幅图是理解路径，不保证每个请求都触发物理磁盘读取。文件内容可能已经在 page cache（页缓存）中；网络库也可能复用连接。排障时先确认实际工作负载，不要把概念图当成每个请求完全相同的执行记录。

### 进程为什么“活着但不干活”

进程状态描述它当前处于什么阶段。`R` 表示正在运行或可运行，`S` 表示可中断睡眠，`D` 常见于不可中断等待，`Z` 是已结束但尚待父进程回收退出信息的僵尸。你可用 `ps -eo pid,ppid,stat,wchan:24,comm` 查看，`wchan` 是等待位置的提示，受权限和内核配置影响，不是完整调用栈。

睡眠通常是正常行为：Web 服务没有请求时应该等待，而不是空转。僵尸也不是仍在消耗 CPU 的活线程，它主要保留退出信息；该检查父进程回收逻辑。`D` 状态需要结合设备、文件系统或内核证据；它不等价于“进程已死”。

信号是进程之间或内核向进程发送的通知。`SIGTERM` 请求有序退出，程序有机会完成清理；`SIGKILL` 无法被捕获，适合最后手段，但也不能让某些内核等待立刻结束。先确认精确 PID、命令行和启动时间，避免名称相同误杀。自动化处置还需防止 PID 重用，把一次旧告警中的 PID 当成永久身份。

### 内存不是一个“已经用掉多少”的数字

应用看到的是虚拟地址空间，内核负责映射和管理物理页。`VIRT` 大不等于占用了同样多物理内存；`RSS` 是常驻物理页统计，但多个进程的共享页可能重复计入。要估算共享内存归属，可查看支持情况下的比例分摊统计，如 `/proc/<pid>/smaps_rollup`，它比简单相加 RSS 更接近按共享比例归属的观察。

页缓存使文件重复读取更快，内存紧张时一部分缓存可回收。`available` 是内核对可供新负载使用内存的估计，不是保证某个超大分配一定成功。内存碎片、地址空间限制、cgroup 限额及分配方式都可能影响结果。Swap 已用也不能直接推出“现在正在抖动”，要观察 `vmstat` 的 `si/so` 是否持续换入换出以及请求延迟。

容器的资源限制由 cgroups（控制组）承担，namespace（命名空间）主要隔离可见视图。主机还有空闲内存，某容器仍可能达到自己的限制；主机 CPU 不高，容器仍可能因配额受到节流。对照[控制组 v2 文档](https://docs.kernel.org/admin-guide/cgroup-v2.html)，读取对应组的 `memory.current`、`memory.events`、`cpu.stat` 等文件；先用 `/proc/<pid>/cgroup` 确认进程属于哪个组，别拿主机总量解释容器局部限制。

### 文件名、inode 和打开句柄为什么会影响磁盘排障

文件名是目录里的入口，inode（索引节点）保存文件元数据并关联数据位置。进程打开文件后得到文件描述符，后续读写通过它进行。删除路径后，若还有进程打开该文件，数据可能仍被引用，空间未必立即释放。这解释了“删了日志，`df` 没下降，而 `du` 找不到那个文件”。[inode 手册](https://man7.org/linux/man-pages/man7/inode.7.html)

验证时可用具备权限的 `lsof +L1` 查找链接数小于 1 的打开文件，再核对进程和文件大小。处理选择应结合应用日志轮转机制：让应用重新打开日志、按支持流程重载或安排重启。不要不看目标就往 `/proc/<pid>/fd/*` 写入或清空，这会越过应用语义直接破坏数据。

另一个问题是“写入成功，断电后一定在吗？”普通 write 返回可能只是写入内核缓存。数据何时持久化涉及应用 `fsync`、文件系统、设备缓存及存储保障。数据库事务和备份一致性建立在更完整的协议上，不能用“Linux 文件接口统一”推导出每次写入天然持久可靠。

## 基础与故障实验：用受限进程观察暂停故障和恢复

使用一台 Linux 测试虚拟机或 WSL Linux 环境，普通用户即可。需有 Bash、Python 3、`ps` 和 `curl`；WSL 未启用 systemd 时，服务管理章节的命令与这里的普通进程实验分开练。此实验不施加 CPU 压力、不占满磁盘、不修改系统防火墙。

```bash
lab_dir=$(mktemp -d -t linux-classroom-XXXXXX)
printf 'aiops-linux-lab\n' > "$lab_dir/index.html"
python3 -m http.server 18765 --bind 127.0.0.1 --directory "$lab_dir" > "$lab_dir/server.log" 2>&1 &
lab_pid=$!
printf '实验 PID=%s，目录=%s\n' "$lab_pid" "$lab_dir"
ps -p "$lab_pid" -o pid,ppid,stat,etime,comm
curl --fail --max-time 3 http://127.0.0.1:18765/
```

`$!` 保存刚启动的后台进程号，`--bind 127.0.0.1` 只接受本机访问，`--directory` 指定提供文件的目录。启动后若首次请求赶在服务监听前失败，先看日志再重试一次；预期响应正文是 `aiops-linux-lab`。用 `ss -ltnp` 找 18765，确认监听地址与进程。基础实验成功要同时有进程、监听、HTTP 正文三份证据。

现在发送 `SIGSTOP`，把这个实验进程暂停。暂停会保留进程和监听 socket，却不继续执行用户代码，因此非常适合演示“端口存在不代表应用能处理请求”。

```bash
kill -STOP "$lab_pid"
ps -p "$lab_pid" -o pid,stat,comm # 预期状态包含 T，表示停止
curl --max-time 2 http://127.0.0.1:18765/
kill -CONT "$lab_pid" # 恢复刚才暂停的同一个实验进程
curl --fail --max-time 3 http://127.0.0.1:18765/
```

中间请求预期超时，常见 curl 退出码为 28；恢复后应再次得到正文。这里制造的是暂停，不是内核 IO 阻塞，不能把它写成“成功复现 D 状态”。如果停止时提示无此进程，核对 PID 和启动日志；如果请求没有超时，检查访问端口是否被另一个服务占用，或者信号是否发送给了正确进程。

收尾时先确保执行 `kill -CONT "$lab_pid"`，再 `kill -TERM "$lab_pid"` 并 `wait "$lab_pid"`。等待命令因信号退出而返回非零属于可能的正常现象。用 `ps -p "$lab_pid"` 和端口列表确认实验进程消失。保存日志与状态对照后，在文件管理器确认 `lab_dir` 的绝对路径，仅删除本次临时目录。

## 生产推理：指标变坏以后，先排队还是先扩容

CPU 调度等待、内存回收等待和 IO 等待都会增加延迟。PSI 是 Pressure Stall Information（压力停顿信息），用来描述任务因资源不足而停顿的时间比例；支持时可读 `/proc/pressure/cpu`、`memory`、`io`。它补充“用了多少资源”，回答“缺资源让任务等了多久”。字段和内核支持以[官方 PSI 文档](https://docs.kernel.org/accounting/psi.html)为准。

假设 API 延迟从 100 ms 升到 2 s，而 CPU 仍为 30%。先比较请求量、并发、等待线程、下游延迟和资源压力。如果连接池满，增加 CPU 可能没用；如果是容器 CPU 配额节流，主机平均值又会掩盖局部限制。容量规划按瓶颈资源和峰值并发估算，保留故障时剩余节点接管的余量，而非只定“CPU 不超过 80%”。

Linux 的主机高可用依赖上层架构：至少两个服务实例、健康检查、流量切换与状态保存。两台主机共享同一个存储或机架仍可能一起失效。对于有状态服务，必须解释数据复制、故障切换和恢复点，不能把“systemd 自动重启”当成跨主机高可用。

安全按身份、文件权限、网络入口、密钥与审计落实。普通进程使用专用用户，配置与数据目录只给必要访问；容器资源隔离不等于完全安全隔离。升级内核前确认驱动、文件系统、网络和应用兼容性，在试验节点验证并准备可启动的旧内核及控制台访问。涉及磁盘格式或数据升级时，回退内核无法自动回退数据。

对 AIOps 采集，记录指标的时间窗、主机与容器范围、单位和版本。CPU `iowait` 有多核统计和归属限制，不能当作准确的磁盘性能指标，相关边界见[proc_stat 手册](https://man7.org/linux/man-pages/man5/proc_stat.5.html)。异常模型如果训练时输入主机指标、线上却输入容器指标，得到漂亮分数也可能没有业务意义。

## 面试课堂：用证据回答，而不是背命令

**30 秒回答。** Linux 内核把 CPU、内存、文件和网络能力通过系统调用交给进程。排障先沿请求路径判断任务在忙还是在等，再看进程、资源和内核证据；服务存活、端口监听、请求成功和业务正确需要分别验证。

**3 分钟回答。** 先从请求到线程、调度、系统调用和返回讲数据路径，再解释虚拟内存与页缓存、文件描述符与 inode、namespace 与 cgroup。用暂停 HTTP 进程的实验说明端口检查不足以证明健康。最后讲延迟事故如何关联线程等待、下游、配额及 PSI，并根据证据选择扩容、解除瓶颈或回滚变更，修复后验证业务延迟和错误率。

1. **负载很高但 CPU 不高？** 看可运行与不可中断任务、设备延迟、等待位置和容器限制；先确认采样时间和核数，不把负载百分比化。
2. **内存还有余量为何 OOM？** 区分主机和控制组 OOM，检查限额、事件和日志，再看具体分配条件。只读 `free` 不足以判断。
3. **空间未满却写不进文件？** 依次看 inode、配额、只读挂载、权限、文件大小限制和底层 IO 错误，按实际错误码收敛。
4. **设计稳定的日志采集节点？** 限制资源、缓冲容量和重试，记录丢弃与积压，使用独立权限和日志轮转，评估磁盘故障及下游不可用时的退化策略。
5. **事故：删除日志后空间不降？** 用 `df/du` 差异与打开文件证据验证已删除文件仍被持有，按应用支持方式重新打开日志；复盘补轮转与容量预测，不归咎于“Linux 缓存没清”。

## 系统机制课堂：把一个“卡住”拆成可验证的资源等待

### 用户态、内核态和系统调用怎样连起来

老师让你想象应用要读日志：它不能直接随意操作磁盘控制器，而是通过系统调用请求内核提供服务。内核检查权限、查找文件与缓存、安排必要的 I/O，再把结果返回应用。应用代码运行在用户态，内核承担受保护的资源管理；两者切换不是简单等同于“启动了另一个进程”。

因此程序卡在 read，不一定表示硬盘坏了。它可能读的是管道或网络套接字，也可能在等待其他进程提供数据。先看文件描述符对应什么，再结合进程状态、系统调用线索和设备指标判断。单条工具输出只提供某一层证据，不能从函数名直接跳到最终根因。

### 文件名、inode 和打开的描述符不是同一个对象

路径是查找入口，inode 保存文件元数据，文件描述符是进程已经打开对象的引用。文件名被删除以后，进程仍持有打开引用时，空间可能暂时不会释放。老师会追问：“为什么 du 变小了，df 仍然很满？”前者按可遍历路径统计，后者反映文件系统空间，两者视角不同。

不要因此直接杀掉全部进程。先确认哪个进程持有已删除文件、它是否关键、是否支持安全重开日志，再走受控重载或重启流程。应用正确的日志轮转策略可以避免长期保留旧文件；只把删除命令写进定时任务，可能掩盖根因并破坏审计材料。

描述符还受限制。一个服务连接越来越多，可能先遇到进程文件描述符上限，而 CPU 和内存仍不高。区分当前进程限制、系统级资源和应用连接池配置；提高上限之前先判断是不是连接未关闭。泄漏速度不变时，扩容只是延后故障时间，不是完成修复。

### 空闲内存少，不一定是内存不够

Linux 会利用部分内存缓存文件内容，帮助减少磁盘读取。缓存可回收程度、匿名内存、共享内存和内核使用需要分别看；不能见到 free 很低就清缓存或重启。关注可用内存、回收压力、交换活动、进程驻留集合及应用延迟，把容量与用户影响关联起来。

容器还受 cgroup 限制：宿主机仍有空闲内存，某个容器也可能达到自身上限而被终止。应用看到的资源预算、容器限制和宿主实际压力需要一起核对。OOM（内存不足处理）是一类结果，背后可能是峰值容量、泄漏、缓存无上限或限制配置不匹配，不能把所有情况都叫“内存泄漏”。

### CPU 百分比与负载平均值为什么不能互换

CPU 使用率反映一段时间里处理器忙于什么，load average（负载平均值）反映特定可运行或不可中断等待任务的平均数量，两者不是同一单位。负载高、CPU 不满，可能有 I/O 等待任务；CPU 很忙而延迟稳定，也未必构成故障，取决于业务目标与余量。

再看进程的状态：R 常表示运行或等待 CPU，S 常表示可中断睡眠，D 常表示不可中断等待，Z 是已退出但尚待父进程回收的僵尸记录。不要把所有睡眠进程当作异常，也不要以为僵尸记录正在大量执行代码。进程状态帮助提出假设，仍需结合时间线和资源证据验证。

### 权限问题要同时考虑路径上的每一层

读一个文件不只看文件自己的权限，还涉及父目录能否遍历、实际运行身份、组、挂载与额外安全机制。你在终端用自己账号读成功，不等于以专用服务用户运行的进程能读。排障应先确认 UID、组和真实路径，避免直接给整个目录树加全员写权限。

当普通权限看起来允许但仍被拒绝，再查适用的安全审计、容器只读挂载或服务沙箱配置。关闭安全模块可能使现象消失，却同时移除保护，不能作为默认修复。精确允许必要路径和动作，并保留拒绝与修复证据，才是安全运维能力。

### 一道面试综合题：接口慢，先查哪些事实

先确定影响范围、开始时间和最近变更，选择一个请求关联标识。随后看入口请求、进程是否存活、监听端口、资源压力和下游等待；按 CPU、内存、I/O、网络与应用锁逐步排除。所有命令都围绕问题取证，不是把 top、free、df 的截图堆起来就叫根因分析。

假设你发现磁盘延迟与应用日志量同时上升，还不能只凭同时发生认定因果。比较发生顺序，确认应用确实等待该设备，并用低风险配置调整或受控回退验证。如果验证失败，更新假设而不是扩大破坏性操作。AIOps 的作用是组织信号与候选原因，最终修复仍要有权限、影响范围和业务恢复证据。

## 资源边界深讲：主机没满，服务为什么已经到顶

### CPU 配额限制的是时间预算，不是固定分配几颗核心

老师给出一组课堂数值：控制组的 `cpu.max` 为 `200000 100000`。第一个数表示每周期可消费的处理器时间额度，第二个数是周期，单位均为微秒；相除得到平均两颗逻辑处理器的时间预算。它不等于“只能跑在编号零和一的处理器上”，允许在哪些处理器执行由另一类放置限制决定。多个线程可以更快用完同一周期预算，之后等待下个周期。

现在预测：宿主有十六颗逻辑处理器，这个服务达到两颗处理器预算时，整机平均使用率可能仍不高，服务却已经出现节流。只看主机平均值会错误判断“还有很多余量，不可能是处理器问题”。应核对当前进程控制组路径、有效配额、父组限制和 `cpu.stat` 的节流累计量，再把其增量与延迟峰值对齐。累计节流次数很大但最近不再增加，不能证明当前仍受影响。

`cpu.weight` 是有争用时的相对分配权重，不是硬上限，也不承诺固定处理器数量。提高权重可能改善组间争用，却不能突破另一个已经设定的配额；提高配额又会增加宿主峰值需求。这两个旋钮解决不同问题，必须先确认受限机制，再考虑调整。具体接口与层级规则见 [控制组第二版文档](https://docs.kernel.org/admin-guide/cgroup-v2.html)。

### 内存高水位与硬上限：慢下来和被终止不是同一事件

控制组内存管理中，`memory.high` 提供压力控制边界，超过时可能引发回收和节流；`memory.max` 提供更硬的使用限制，无法通过回收满足分配时可能进入控制组内存不足处理。二者不是同一个阈值的两种写法，也不能把“超过高水位”直接翻译为“立即杀进程”。观察时同时看当前用量、事件增量、回收压力和应用延迟。

例如日志采集器在下游不可用时把数据缓存在内存中。先碰高水位后，处理变慢，队列进一步增长，随后可能触及硬限制。真正的修复方向通常包含有界队列、磁盘缓冲或明确丢弃策略，而不是无限提高限制。还要解释丢弃哪些数据、如何计数和如何告警，避免资源保护成功而遥测数据静默消失。

父组也能限制子组。看到子组配置宽松，仍要确认上层是否承担了多个服务的共同预算；把所有子组的独立峰值相加，可能远超宿主容量。容量评审应讨论同时故障、补发和重启峰值，不只记录平稳时平均占用。自动化建议应携带限制所在层级，否则可能修改了一个并非实际瓶颈的参数。

### 压力指标回答等待影响，使用率回答资源忙碌

PSI 的 `some` 可以理解为观察范围内至少有任务因该资源等待的时间，`full` 对支持的资源与范围表示所有非空闲任务同时陷入相应停顿的时间。二者不是“轻微告警”和“严重告警”预设等级；必须结合资源类型、主机或控制组范围、内核支持及业务目标解释。尤其不要把系统级处理器的全停顿字段与内存字段机械按同一口径对比。[压力停顿信息](https://docs.kernel.org/accounting/psi.html)

平均字段按指定时间窗平滑，累计字段记录停顿时间。短促尖峰可能被较长平均窗稀释，累计量又会因重启或对象重建而重置。因此采集端需要保存单位和启动边界，计算增量时处理负跳变，不能把计数归零解释为“系统突然产生负压力”。这是 Linux 观测到异常模型之间的数据契约问题，不是调图表颜色可以解决的。

生产上先画同一时间轴：请求延迟、工作量、控制组节流、内存回收和存储延迟。若延迟先升、压力后升，压力可能是请求堆积的结果；若限制先改变而节流和延迟同步出现，配置更值得验证。允许提出多个假设，再通过低风险证据逐步排除，不要用一次相关性就启动扩容动作。

### 文件替换的原子性，不等于断电后的持久性

更新配置时，直接打开原文件并截断重写，会让并发读取者可能读到空文件或半份配置。在同一文件系统中，先写临时文件、完成校验，再用重命名替换目标路径，可以让路径切换具备原子性；读者看到旧文件或新文件，而不是路径替换了一半。已有打开描述符仍可能继续读旧对象，所以应用何时重新加载要由它自己的协议决定。[重命名系统调用](https://man7.org/linux/man-pages/man2/rename.2.html)

但路径切换原子，不等于所有相关内容已经抗断电持久化。对严格要求持久性的程序，要理解文件同步与包含目录同步各自保护什么，并考虑文件系统和设备的保障。单独同步文件不必然同步新增目录项；应用必须检查写入、同步和关闭阶段的错误，而不是把最后一次打印“保存成功”当证据。[文件同步系统调用](https://man7.org/linux/man-pages/man2/fsync.2.html)

初学者不需要为每份笔记实现数据库级提交协议，但要知道自动化变更工具应该承担这些责任。配置回退也需保存上一份已验证内容、权限和属主，不能只保存文本。若新配置失败，恢复文件后还要验证应用加载的是旧版本；文件内容恢复与进程实际状态恢复仍是两个步骤。

### 故障练习再加一层只读观察

继续使用前面的临时 HTTP 进程，不引入新服务。暂停前读 `ps -p "$lab_pid" -o pid,stat,etime,comm`，再读 `/proc/$lab_pid/status` 中的状态和线程数量；暂停后重复观察，预测进程仍存在但状态改变，恢复后再次请求验证。只保留必要字段，完整进程环境和命令参数可能含敏感内容，不作为公开截图材料。

如果你在容器中练习，额外记录 `/proc/$lab_pid/cgroup`，但不要假定展示出的路径与宿主路径完全相同。命名空间改变可见视图，权限也可能隐藏部分信息；读不到不等于对象不存在。前置条件、退出信号和临时目录清理仍沿用原实验，禁止为了得到某种预期输出而临时提权或修改宿主限制。本节没有故意制造内存不足、磁盘满或节流，不能把理论推演标为那些故障的实测结果。

最后的独立面试练习是解释“十六核主机使用率低，但两核配额服务延迟高”。三十秒先给出观测范围不同的结论，三分钟补时间预算、节流增量、父组约束、业务工作量和调整后容量风险。能提出证据与可回退验证，才算把内核知识用于运维判断。

## 学习证据

学完这篇后，建议提交：

- `docs/learning-records/linux-first-check.md`
- 一张 `top` 或 `htop` 截图。
- 一张 `df -h` 和 `df -i` 记录。
- 一篇笔记：`Linux 内核、系统调用、用户态和内核态.md`
- 一篇排障记录：`服务访问不了时我按什么顺序排查.md`
