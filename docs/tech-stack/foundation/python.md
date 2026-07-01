# Python

> 目标：能用 Python 处理运维数据、写自动化脚本、做异常检测原型、提供简单 API。

## 官方资料

- [Python Tutorial](https://docs.python.org/3/tutorial/)
- [venv documentation](https://docs.python.org/3/library/venv.html)
- [pip documentation](https://pip.pypa.io/en/stable/)

说明：本文是基于 Python 官方文档的原创中文学习教程，不复制官方全文。

## 为什么要学

AIOps 的很多能力最后都会落到 Python：读取指标、处理日志、调用 API、清洗数据、训练异常检测模型、写告警 webhook、生成报告。运维经验能告诉你“哪里可能有问题”，Python 能帮你把判断过程自动化、数据化。

对零基础转 AIOps 来说，Python 不需要一开始学到算法竞赛水平，但必须能写脚本、处理文件、调用接口、管理依赖、把分析结果输出成可复用工具。

## 是什么

Python 是通用编程语言。AIOps 中常用它做数据处理、脚本自动化、日志分析、异常检测和 Web API。

## 它解决什么问题

- 把重复运维检查写成脚本。
- 读取 CSV、JSON、日志和 API 数据。
- 对告警和指标做聚合、过滤、统计。
- 调用 Prometheus、GitHub、Kubernetes 等 HTTP API。
- 快速验证异常检测和告警降噪原型。
- 用 FastAPI 把自动化能力暴露成服务。

## 核心原理

Python 代码由解释器执行。工程项目通常通过虚拟环境隔离依赖，通过包管理安装第三方库。

```text
source code .py
  -> Python interpreter
  -> standard library
  -> third-party packages
  -> scripts / APIs / data jobs
```

## 官网学习路线

1. 运行第一个 `.py` 文件。
2. 学变量、字符串、数字、列表、字典。
3. 学条件判断和循环。
4. 学函数。
5. 学文件读写。
6. 学模块和包。
7. 学虚拟环境。
8. 学 pip 安装依赖。
9. 学异常处理。
10. 学用 pandas/scikit-learn 做数据任务。

## 安装检查

```powershell
python --version
pip --version
```

如果 Windows 上 `python` 不可用，可以检查：

```powershell
py --version
```

## 虚拟环境

项目里不要直接全局安装依赖。使用 venv：

```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install --upgrade pip
pip install pandas scikit-learn fastapi uvicorn
pip freeze > requirements.txt
```

退出：

```powershell
deactivate
```

## 基础语法

变量：

```python
service = "order-api"
error_rate = 0.03
is_critical = error_rate > 0.02
```

列表和字典：

```python
alerts = [
    {"service": "api", "severity": "critical"},
    {"service": "db", "severity": "warning"},
]
```

循环：

```python
for alert in alerts:
    print(alert["service"], alert["severity"])
```

函数：

```python
def is_high_error_rate(error_rate: float) -> bool:
    return error_rate > 0.02
```

文件读写：

```python
from pathlib import Path

path = Path("alerts.log")
content = path.read_text(encoding="utf-8")
Path("summary.md").write_text(content, encoding="utf-8")
```

## 项目结构

简单脚本项目：

```text
metric-analyzer/
  README.md
  requirements.txt
  data/
    metrics.csv
  src/
    analyze.py
```

## 在 AIOps 中的作用

- 读取 CSV、JSON、日志。
- 调用 Prometheus HTTP API。
- 对告警做聚合和去重。
- 训练简单异常检测模型。
- 暴露 Alertmanager webhook。
- 生成 Markdown 事故摘要。

## 入门实验

创建 `scripts/check_metrics.py`：

```python
metrics = [
    {"time": "10:00", "error_rate": 0.01, "latency_p95": 120},
    {"time": "10:01", "error_rate": 0.03, "latency_p95": 350},
]

for row in metrics:
    if row["error_rate"] > 0.02 or row["latency_p95"] > 300:
        print(f"{row['time']} 可能异常: {row}")
```

运行：

```powershell
python scripts/check_metrics.py
```

## 配置重点

- `.venv/` 不提交到 Git。
- `requirements.txt` 要提交。
- 脚本入口放在 `src/` 或 `scripts/`。
- 数据样例放在 `data/`，不要放敏感生产数据。

## 排障清单

### pip 安装失败

```powershell
python -m pip install --upgrade pip
pip config list
```

### 找不到模块

确认虚拟环境已激活，依赖已安装：

```powershell
pip list
```

### 中文乱码

读写文件指定编码：

```python
Path("note.md").read_text(encoding="utf-8")
```

## 学习检查清单

- [ ] 我能运行一个 `.py` 文件。
- [ ] 我能使用变量、列表、字典、循环和函数。
- [ ] 我能读写 UTF-8 文本文件。
- [ ] 我能创建和激活虚拟环境。
- [ ] 我能用 pip 安装依赖并生成 `requirements.txt`。
- [ ] 我能写一个简单运维检查脚本。
- [ ] 我能解释脚本、包、模块、虚拟环境的关系。
- [ ] 我能把 Python 脚本和运行说明提交到 GitHub。

## 面试题

1. Python 在 AIOps 中常见用途有哪些？
2. 为什么项目要使用虚拟环境？
3. `pip install` 和 `requirements.txt` 分别解决什么问题？
4. Python 列表和字典分别适合存什么数据？
5. 读写中文文件时为什么要指定 `encoding="utf-8"`？
6. 如何把一段手工排障流程改写成 Python 脚本？
7. Python 脚本如何调用 Prometheus HTTP API？
8. 异常检测原型为什么适合先用 Python 做？
9. FastAPI 和普通脚本在 AIOps 项目里有什么区别？
10. 一个可展示的 Python 运维项目应该包含哪些文件？

## 学习证据

- 一个能运行的 Python 脚本。
- 一个 `requirements.txt`。
- 一篇记录：Python 虚拟环境解决了什么问题。
