# systemd

> 目标：能理解 Linux 服务如何被 systemd 管理，能查看服务状态、日志，写一个最小 `.service` unit。

## 官方资料

- [systemd homepage](https://systemd.io/)
- [systemd.unit manual](https://www.freedesktop.org/software/systemd/man/systemd.unit.html)
- [systemd.service manual](https://man7.org/linux/man-pages/man5/systemd.service.5.html)
- [Red Hat: Working with systemd unit files](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_systemd_unit_files_to_customize_and_optimize_your_system/assembly_working-with-systemd-unit-files_working-with-systemd)

说明：本文是基于 systemd 官方手册和发行版文档整理的原创中文教程，不复制官方全文。

## 是什么

systemd 是 Linux 系统和服务管理器。它通常作为 PID 1 启动，负责启动系统服务、管理依赖、记录日志、处理服务重启。

## 核心原理

systemd 用 unit 表示系统资源。服务是 `.service` unit，定时任务是 `.timer` unit，挂载点是 `.mount` unit。

```text
systemctl
  -> systemd manager
  -> unit files
  -> service processes
  -> journald logs
```

## Unit 文件位置

常见路径：

```text
/etc/systemd/system/        管理员自定义
/run/systemd/system/        运行时 unit
/usr/lib/systemd/system/    软件包提供
/lib/systemd/system/        部分发行版使用
```

优先级通常是 `/etc` 高于软件包目录。

## 最小 service

`/etc/systemd/system/demo.service`：

```ini
[Unit]
Description=Demo AIOps Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/demo
ExecStart=/usr/bin/python3 /opt/demo/app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## 常用命令

```bash
systemctl status demo
systemctl start demo
systemctl stop demo
systemctl restart demo
systemctl enable demo
systemctl disable demo
systemctl daemon-reload
journalctl -u demo -n 100
journalctl -u demo -f
```

## 配置重点

### [Unit]

- `Description`：描述。
- `After`：启动顺序，不等于强依赖。
- `Requires`：强依赖。
- `Wants`：弱依赖。

### [Service]

- `Type`：服务类型，常见 simple。
- `ExecStart`：启动命令。
- `WorkingDirectory`：工作目录。
- `Restart`：重启策略。
- `Environment`：环境变量。
- `User`：运行用户。

### [Install]

- `WantedBy`：enable 时挂到哪个 target。

## 在 AIOps 中的作用

- 生产服务很多由 systemd 管理。
- 服务反复重启是常见告警。
- `journalctl` 是排障重要证据。
- Runbook 自动化经常检查或重启服务。

## 入门实验

1. 写一个 Python HTTP 服务。
2. 创建 `demo.service`。
3. `systemctl daemon-reload`。
4. `systemctl start demo`。
5. 查看状态和日志。
6. 故意让服务退出，观察 Restart 行为。

## 排障清单

### 修改 unit 后不生效

```bash
systemctl daemon-reload
systemctl restart demo
```

### 服务启动失败

```bash
systemctl status demo
journalctl -u demo -n 100
```

### 服务一直重启

- 检查 ExecStart 路径。
- 检查工作目录。
- 检查权限。
- 检查应用日志。
- 检查 Restart 配置。

## 学习证据

- 一个 `demo.service`。
- 一篇记录：`systemctl status` 输出怎么读。
- 一份服务启动失败排障笔记。
