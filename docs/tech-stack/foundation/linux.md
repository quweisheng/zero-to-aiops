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
       - 虚拟文件系统 VFS
       - 块设备和 IO
       - 网络协议栈
       - 设备驱动
       - cgroups / namespaces
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
  -> open("/var/log/syslog")
  -> read(...)
  -> write(标准输出)
  -> 终端显示内容
```

### Linux 启动过程

不同发行版细节不同，但主线通常是：

```text
BIOS / UEFI
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
| iowait | 等待磁盘 IO | 磁盘慢、存储瓶颈 |
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

注意：load average 不等于 CPU 使用率。它通常表示正在运行或等待不可中断 IO 的任务数量。CPU 忙、磁盘 IO 堵塞，都可能让 load 升高。

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

如果 `%util` 长期接近 100%，且 `await` 很高，磁盘可能是瓶颈。

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
| `env` | 环境变量 | `env` | 排查服务环境差异 |

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

## 学习证据

学完这篇后，建议提交：

- `docs/learning-records/linux-first-check.md`
- 一张 `top` 或 `htop` 截图。
- 一张 `df -h` 和 `df -i` 记录。
- 一篇笔记：`Linux 内核、系统调用、用户态和内核态.md`
- 一篇排障记录：`服务访问不了时我按什么顺序排查.md`
