# Python

> 目标：能用 Python 处理运维数据、写自动化脚本、做异常检测原型、提供简单 API。

## 官方资料

- [Python Tutorial](https://docs.python.org/3/tutorial/)
- [Python Language Reference](https://docs.python.org/3/reference/)
- [Python Standard Library](https://docs.python.org/3/library/)
- [venv documentation](https://docs.python.org/3/library/venv.html)
- [Python Packaging User Guide: Installing Packages](https://packaging.python.org/en/latest/tutorials/installing-packages/)
- [pip documentation](https://pip.pypa.io/en/stable/)

说明：本文是基于 Python 官方文档和 Python Packaging 官方资料写成的原创中文学习教程，不复制官方全文。官方文档负责定义语言、标准库、虚拟环境和包管理边界，本文负责把这些知识翻译成 AIOps 学习路径。

## 场景开场

假设你每天早上都要做这些事：

1. 打开告警平台，复制昨天的告警列表。
2. 统计哪个服务告警最多。
3. 看 critical 告警是不是集中在某个时间段。
4. 把结论贴到日报里。
5. 如果某个服务连续三天最吵，再提醒负责人治理。

手工做一次不难，天天做就会出错，也很难复用。Python 的价值就是把这类“重复但需要判断”的工作写成程序：读 JSON/CSV/日志，调用 HTTP API，按服务聚合，输出 Markdown 报告，必要时再接入 pandas、scikit-learn、FastAPI。

学 AIOps 时，Python 不是为了炫耀语法，而是为了把运维经验变成可以重复执行、可以放进 Git、可以被别人 review 的自动化能力。

## 一句话人话版

Python 是 AIOps 的自动化和数据处理语言：它能读文件、调接口、处理指标和日志，也能把分析逻辑做成脚本、服务或模型实验。

## 学习边界

这一篇重点讲 Python 语言、解释器、虚拟环境、包管理、标准库和 AIOps 脚本。它不会深入展开 pandas、scikit-learn、FastAPI、RAG 和 LLM，因为这些在后面的专题中单独学习。

你先要达到的不是“会写复杂框架”，而是：

- 能在自己的机器上稳定运行 Python。
- 能解释脚本、模块、包、虚拟环境、pip 的关系。
- 能读写 JSON、CSV、文本日志。
- 能调用 HTTP API。
- 能处理异常、输出日志、接收命令行参数。
- 能把一次手工排障步骤写成可重复执行的脚本。

## 官方知识地图

Python 官方资料可以按这个顺序理解：

| 官方资料 | 负责回答的问题 | 学 AIOps 时怎么用 |
|---|---|---|
| Python Tutorial | 新手如何掌握语言基础 | 先学变量、容器、控制流、函数、模块、文件、异常 |
| Python Language Reference | Python 语法和执行模型到底怎么定义 | 查清楚对象、作用域、import、表达式、语句的准确含义 |
| Python Standard Library | Python 自带哪些模块 | 优先用 `pathlib`、`json`、`csv`、`logging`、`argparse`、`urllib` 等标准库完成脚本 |
| venv documentation | 如何给项目隔离环境 | 每个 AIOps 小项目一个 `.venv`，避免依赖互相污染 |
| Python Packaging User Guide | 包、项目、依赖如何安装和发布 | 理解 PyPI、pip、requirements、项目元数据 |
| pip documentation | pip 命令怎么用 | 安装、升级、列出、冻结、排查依赖 |

这张图也说明了一个重要边界：Python 不是只有“语法”。真正做项目时，你同时在使用语言、解释器、标准库、虚拟环境和第三方包生态。

## Python 在 AIOps 链路中的位置

```text
metrics / logs / traces / alerts / tickets
        |
        v
files / HTTP APIs / message queues / databases
        |
        v
Python scripts and jobs
        |
        +--> clean and aggregate data
        +--> generate reports
        +--> call Prometheus / Kubernetes / GitHub APIs
        +--> run anomaly detection experiments
        +--> expose automation as an API
```

在 AIOps 中，Python 常见位置有五类：

| 位置 | 例子 | 你要掌握的能力 |
|---|---|---|
| 运维脚本 | 批量检查证书、磁盘、接口状态 | 文件、命令行参数、异常处理、日志 |
| 数据处理 | 统计告警噪声、清洗日志字段 | JSON、CSV、字典、列表、聚合 |
| API 集成 | 调 Prometheus、GitHub、Kubernetes API | HTTP 请求、认证、超时、错误码 |
| 模型实验 | 异常检测、聚类、告警降噪 | 数据结构、pandas、scikit-learn |
| 服务化 | webhook、内部工具 API | FastAPI、配置、部署、日志 |

## Python 是什么

Python 是一门通用编程语言。你写的 `.py` 文件由 Python 解释器执行。大多数人日常说的 Python，通常指 CPython，也就是官方最常用的 Python 实现。

你需要分清几个名字：

| 名词 | 是什么 | 常见误区 |
|---|---|---|
| Python | 语言规范和生态的统称 | 不是一个单独命令就能代表全部 Python |
| CPython | 官方主流解释器实现 | 初学时默认用它即可 |
| `python` | 启动解释器的命令 | 不同机器上可能指向不同版本 |
| `py` | Windows 的 Python Launcher | Windows 上可用它选择 Python 版本 |
| pip | Python 包安装工具 | pip 不是 Python 语言本身 |
| PyPI | Python Package Index，第三方包仓库 | pip 通常从 PyPI 下载包 |
| venv | Python 自带的虚拟环境工具 | 不是容器，只隔离 Python 依赖 |
| 标准库 | Python 安装后自带的模块 | 不是所有常用包都在标准库里，例如 pandas 不在 |

## Python 怎么运行代码

最常见的运行方式：

```powershell
python scripts\check_alerts.py
```

可以把执行过程粗略理解为：

```text
source file: scripts/check_alerts.py
        |
        v
Python interpreter
        |
        v
parse source code and execute statements
        |
        v
use built-in types, standard library and installed packages
        |
        v
produce output, files, HTTP requests, logs or errors
```

更细一点看，CPython 会把源码编译成字节码再执行。你有时会看到 `__pycache__/` 目录，它是解释器为了加速模块加载生成的缓存。它不是你的业务代码，一般不要提交到 Git。

## 交互式解释器和脚本

Python 有两种常见使用方式。

### 交互式解释器

```powershell
python
```

进入后可以一行一行试：

```python
>>> 1 + 2
3
>>> "api".upper()
'API'
```

它适合临时试语法、验证小表达式。

### 脚本文件

创建 `scripts/check_alerts.py`：

```python
alerts = [
    {"service": "order-api", "severity": "critical"},
    {"service": "payment-api", "severity": "warning"},
]

for alert in alerts:
    print(alert["service"], alert["severity"])
```

运行：

```powershell
python scripts\check_alerts.py
```

脚本适合保存、复用、提交 Git、放进 CI 或定时任务。

## 版本检查和解释器选择

先确认机器上有什么 Python：

```powershell
python --version
```

可能输出：

```text
Python 3.12.4
```

Windows 上如果 `python` 不可用，可以试：

```powershell
py --version
py -0p
```

`py -0p` 会列出 Windows Python Launcher 能找到的解释器路径。多版本共存时，这个命令很有用。

在团队项目里，建议在 README 写清楚最低版本，例如：

```text
Python >= 3.11
```

原因是不同 Python 版本的语法、标准库和第三方包支持会不同。一个人在 3.12 能跑的脚本，另一个人在 3.8 上可能直接语法报错。

## 虚拟环境

虚拟环境的目的，是让每个项目有自己独立的 Python 依赖目录。

没有虚拟环境时，所有项目可能共用一套包：

```text
global Python
  ├── pandas 1.x
  ├── requests 2.x
  └── scikit-learn 1.x
```

项目多了以后就会冲突：

- 项目 A 需要 pandas 1.x。
- 项目 B 需要 pandas 2.x。
- 全局升级以后，项目 A 可能坏掉。

使用虚拟环境后：

```text
alert-noise-report/
  .venv/
    installed packages for this project only
  scripts/
  requirements.txt
```

### 创建虚拟环境

```powershell
python -m venv .venv
```

这里的 `python -m venv` 表示用当前 Python 解释器运行标准库里的 `venv` 模块。

### 激活虚拟环境

Windows PowerShell：

```powershell
.\.venv\Scripts\Activate.ps1
```

Linux / macOS：

```bash
source .venv/bin/activate
```

激活后，命令行前面通常会出现 `(.venv)`。这表示当前 `python` 和 `pip` 优先来自这个项目的虚拟环境。

检查：

```powershell
python -c "import sys; print(sys.executable)"
```

你应该看到路径里包含 `.venv`。

### 退出虚拟环境

```powershell
deactivate
```

### 虚拟环境和 Git

`.venv/` 不要提交。应该提交的是依赖声明，例如 `requirements.txt`。

`.gitignore` 示例：

```text
.venv/
__pycache__/
*.pyc
.env
reports/
```

## pip 和依赖管理

pip 是 Python 的包安装工具。初学者要养成一个习惯：优先使用 `python -m pip`，而不是直接使用 `pip`。

推荐写法：

```powershell
python -m pip install requests
```

原因是 `python -m pip` 明确表示：用当前这个 `python` 对应的 pip 安装包。多 Python 版本或虚拟环境切换时，这样更不容易装错地方。

### 升级 pip

```powershell
python -m pip install --upgrade pip
```

### 安装依赖

```powershell
python -m pip install requests pandas
```

### 查看已安装包

```powershell
python -m pip list
```

### 生成 requirements.txt

```powershell
python -m pip freeze > requirements.txt
```

`requirements.txt` 是一个可复现依赖环境的文件，常见内容：

```text
requests==2.32.3
pandas==2.2.2
```

别人拿到项目后：

```powershell
python -m pip install -r requirements.txt
```

### requirements.txt 的边界

`requirements.txt` 适合入门和小项目。更正式的 Python 项目会使用 `pyproject.toml` 描述项目元数据、构建系统和依赖。你刚开始做 AIOps 脚本时，先把虚拟环境和 `requirements.txt` 用对，比一开始追复杂工程结构更重要。

## 项目结构

一个适合学习和展示的 AIOps Python 项目可以这样组织：

```text
alert-noise-report/
  README.md
  requirements.txt
  .gitignore
  data/
    alerts.json
  scripts/
    alert_report.py
  reports/
    alert-report.md
```

每个目录的职责：

| 路径 | 放什么 | 注意 |
|---|---|---|
| `README.md` | 项目目标、环境、运行方式、示例输出 | 面试和 GitHub 展示时非常重要 |
| `requirements.txt` | 第三方依赖版本 | `.venv/` 不提交，但依赖文件要提交 |
| `data/` | 学习用样例数据 | 不放生产敏感数据 |
| `scripts/` | 可直接运行的脚本 | 文件名用小写和下划线 |
| `reports/` | 生成结果 | 可按需要忽略或提交样例 |

## 核心知识树

从零基础学 Python，不要把知识点背成碎片。你可以按这棵树往下学：

```text
Python
  ├── 运行环境
  │   ├── interpreter
  │   ├── version
  │   ├── venv
  │   └── pip
  ├── 语言基础
  │   ├── object, value, type
  │   ├── variables and names
  │   ├── expressions and statements
  │   ├── collections
  │   ├── control flow
  │   └── functions
  ├── 工程组织
  │   ├── modules
  │   ├── packages
  │   ├── imports
  │   └── __main__
  ├── 标准库
  │   ├── pathlib
  │   ├── json and csv
  │   ├── logging
  │   ├── argparse
  │   ├── datetime
  │   └── urllib
  └── AIOps 应用
      ├── parse alerts
      ├── aggregate metrics
      ├── call APIs
      ├── generate reports
      └── build prototypes
```

下面逐层讲。

## 对象、值和类型

Python 中几乎所有东西都是对象。对象有三个重要属性：

| 属性 | 含义 | 例子 |
|---|---|---|
| 值 | 对象表示的数据 | `42`、`"order-api"` |
| 类型 | 对象属于哪一类 | `int`、`str`、`list` |
| 身份 | 对象在内存中的身份 | `id(obj)` 可以查看 |

常用类型：

| 类型 | 示例 | AIOps 里怎么用 |
|---|---|---|
| `str` | `"order-api"` | 服务名、日志行、URL、告警摘要 |
| `int` | `500` | 状态码、告警数量、端口 |
| `float` | `0.023` | 错误率、延迟、CPU 使用率 |
| `bool` | `True` | 是否超过阈值 |
| `None` | `None` | 暂无数据、字段缺失 |
| `list` | `[1, 2, 3]` | 多条告警、多行指标 |
| `dict` | `{"service": "api"}` | 一条结构化数据 |
| `tuple` | `("api", "critical")` | 不想修改的一组值 |
| `set` | `{"api", "db"}` | 去重后的服务集合 |

看类型：

```python
service = "order-api"
error_rate = 0.023

print(type(service))
print(type(error_rate))
```

输出：

```text
<class 'str'>
<class 'float'>
```

## 变量和命名

变量名是对象的名字。

```python
service = "order-api"
error_rate = 0.023
is_critical = error_rate > 0.02
```

这里有三个名字：

| 名字 | 指向的值 | 类型 |
|---|---|---|
| `service` | `"order-api"` | `str` |
| `error_rate` | `0.023` | `float` |
| `is_critical` | `True` | `bool` |

Python 推荐使用小写加下划线：

```python
service_name = "order-api"
latency_p95_ms = 350
```

不要写成：

```python
servicename = "order-api"
latencyP95 = 350
```

命名不是小事。AIOps 脚本常常被别人拿去排障，变量名清楚，别人才能理解你的判断逻辑。

## 字符串

字符串用于表示文本。

```python
service = "order-api"
message = "5xx error rate is high"
```

常见操作：

```python
line = "2026-07-02 order-api critical"

print(line.lower())
print(line.upper())
print(line.startswith("2026"))
print(line.split())
```

输出：

```text
2026-07-02 order-api critical
2026-07-02 ORDER-API CRITICAL
True
['2026-07-02', 'order-api', 'critical']
```

格式化字符串常用 f-string：

```python
service = "order-api"
count = 12

print(f"{service} has {count} alerts")
```

输出：

```text
order-api has 12 alerts
```

AIOps 场景里，f-string 常用于生成日志、报告、命令输出。

## 数字和布尔值

```python
error_rate = 0.023
latency_p95_ms = 350

is_error_high = error_rate > 0.02
is_latency_high = latency_p95_ms > 300
is_incident = is_error_high and is_latency_high

print(is_incident)
```

输出：

```text
True
```

布尔表达式是把运维规则写成代码的基础：

```python
should_page = severity == "critical" and error_rate > 0.02
```

这句话比“感觉这个告警挺严重”更适合自动化，因为它可以重复执行，也可以被测试。

## 列表

列表用于保存一组有顺序的数据。

```python
services = ["order-api", "payment-api", "inventory-api"]

print(services[0])
print(len(services))
```

输出：

```text
order-api
3
```

遍历列表：

```python
for service in services:
    print(service)
```

列表里可以放字典，用来表示多条结构化记录：

```python
alerts = [
    {"service": "order-api", "severity": "critical"},
    {"service": "payment-api", "severity": "warning"},
]

for alert in alerts:
    print(alert["service"], alert["severity"])
```

这是 AIOps 脚本里非常常见的数据形状。

## 字典

字典用于保存键值对。

```python
alert = {
    "service": "order-api",
    "severity": "critical",
    "summary": "5xx error rate is high",
}

print(alert["service"])
print(alert.get("team", "unknown"))
```

区别：

| 写法 | 字段不存在时 |
|---|---|
| `alert["team"]` | 抛出 `KeyError` |
| `alert.get("team", "unknown")` | 返回默认值 `"unknown"` |

处理外部数据时，字段可能缺失。初学者要学会判断什么时候应该让程序报错，什么时候应该给默认值。

## 集合和去重

集合用于保存不重复的元素。

```python
services = ["api", "db", "api", "cache"]
unique_services = set(services)

print(unique_services)
```

输出顺序不保证固定，可能类似：

```text
{'cache', 'db', 'api'}
```

AIOps 场景：

```python
alerts = [
    {"service": "api"},
    {"service": "db"},
    {"service": "api"},
]

affected_services = {alert["service"] for alert in alerts}
print(affected_services)
```

## 条件判断

```python
severity = "critical"
error_rate = 0.03

if severity == "critical" and error_rate > 0.02:
    print("page on-call")
elif error_rate > 0.01:
    print("create ticket")
else:
    print("record only")
```

条件判断的关键不是语法，而是把规则写清楚：

```python
if cpu_usage > 90 and duration_minutes >= 5:
    print("CPU saturation")
```

这比“CPU 很高”更精确。

## 循环

遍历列表：

```python
alerts = [
    {"service": "api", "severity": "critical"},
    {"service": "db", "severity": "warning"},
]

for alert in alerts:
    print(alert["service"])
```

带索引遍历：

```python
for index, alert in enumerate(alerts, start=1):
    print(index, alert["service"])
```

只保留 critical：

```python
critical_alerts = []

for alert in alerts:
    if alert["severity"] == "critical":
        critical_alerts.append(alert)

print(critical_alerts)
```

列表推导式写法：

```python
critical_alerts = [
    alert
    for alert in alerts
    if alert["severity"] == "critical"
]
```

列表推导式很方便，但初学时不要为了“短”牺牲可读性。排障脚本首先要让人看懂。

## 函数

函数用于封装一段可复用逻辑。

```python
def is_noisy_service(alert_count: int) -> bool:
    return alert_count >= 10


print(is_noisy_service(12))
```

输出：

```text
True
```

函数的价值：

- 给一段逻辑命名。
- 减少重复代码。
- 便于测试。
- 让脚本结构更清楚。

AIOps 例子：

```python
def should_page(severity: str, error_rate: float, duration_minutes: int) -> bool:
    return severity == "critical" and error_rate > 0.02 and duration_minutes >= 5
```

这比在脚本各处散落复杂条件更好。

## 类型提示

类型提示不会把 Python 变成强制静态类型语言，但能帮助读者和工具理解代码。

```python
def format_alert(service: str, severity: str) -> str:
    return f"[{severity}] {service}"
```

含义：

| 片段 | 含义 |
|---|---|
| `service: str` | `service` 应该是字符串 |
| `severity: str` | `severity` 应该是字符串 |
| `-> str` | 函数返回字符串 |

处理复杂数据时可以先用简单写法：

```python
def count_alerts(alerts: list[dict]) -> int:
    return len(alerts)
```

随着项目变大，再学习 `TypedDict`、`dataclass`、Pydantic 等更严格的结构。

## 异常处理

异常是程序运行时出现的问题，例如文件不存在、JSON 格式错误、网络请求失败。

不处理异常时：

```python
from pathlib import Path

content = Path("data/alerts.json").read_text(encoding="utf-8")
```

如果文件不存在，程序会报 `FileNotFoundError`。

处理异常：

```python
from pathlib import Path

path = Path("data/alerts.json")

try:
    content = path.read_text(encoding="utf-8")
except FileNotFoundError:
    print(f"file not found: {path}")
```

常见异常：

| 异常 | 常见原因 | 排查方向 |
|---|---|---|
| `FileNotFoundError` | 路径不对，当前工作目录不对 | 打印 `Path.cwd()`，确认相对路径 |
| `PermissionError` | 没有权限读写文件 | 检查文件权限和运行用户 |
| `KeyError` | 字典字段不存在 | 打印数据样例，使用 `.get()` 或补字段校验 |
| `JSONDecodeError` | JSON 格式不合法 | 用编辑器或 `python -m json.tool` 校验 |
| `ModuleNotFoundError` | 依赖没安装或装错环境 | 检查 `.venv`、`python -m pip list` |
| `TimeoutError` | 网络或 API 超时 | 设置超时，重试，检查目标服务 |

不要把所有异常都写成：

```python
try:
    ...
except Exception:
    pass
```

这会吞掉真正的问题。AIOps 脚本尤其不能静默失败，因为它可能参与告警、日报、变更检查。

## 模块、包和 import

一个 `.py` 文件就是一个模块。

```text
scripts/
  alert_report.py
```

在代码里导入标准库模块：

```python
import json
from pathlib import Path
from collections import Counter
```

导入方式的含义：

| 写法 | 含义 |
|---|---|
| `import json` | 导入整个 `json` 模块，使用 `json.loads()` |
| `from pathlib import Path` | 从 `pathlib` 模块导入 `Path` 名字 |
| `from collections import Counter` | 从 `collections` 导入计数工具 |

包是包含多个模块的目录，通常有更完整的项目结构。初学阶段先把一个脚本写清楚，再慢慢拆成包。

## `__name__ == "__main__"`

很多 Python 脚本最后会写：

```python
def main() -> None:
    print("run report")


if __name__ == "__main__":
    main()
```

含义：

- 当文件被直接运行时，`__name__` 是 `"__main__"`。
- 当文件被别的模块导入时，`__name__` 是模块名。

这样写的好处是：脚本可以直接运行，也可以被测试或复用时导入，不会一导入就执行主流程。

## 文件路径：pathlib

`pathlib` 是标准库里处理路径的现代方式。

```python
from pathlib import Path

data_path = Path("data") / "alerts.json"
print(data_path)
print(data_path.exists())
```

读文本：

```python
content = data_path.read_text(encoding="utf-8")
```

写文本：

```python
output_path = Path("reports") / "alert-report.md"
output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text("# Alert Report\n", encoding="utf-8")
```

重点：

| 写法 | 为什么 |
|---|---|
| `Path("data") / "alerts.json"` | 跨平台拼路径，避免手写斜杠 |
| `encoding="utf-8"` | 避免中文乱码 |
| `mkdir(parents=True, exist_ok=True)` | 输出目录不存在时自动创建 |

## JSON

JSON 是 AIOps 最常见的数据格式之一。告警平台、Prometheus API、Kubernetes API、GitHub API 都大量使用 JSON。

JSON 字符串转 Python 对象：

```python
import json

raw = '{"service": "order-api", "severity": "critical"}'
alert = json.loads(raw)

print(alert["service"])
```

Python 对象转 JSON 字符串：

```python
import json

alert = {"service": "order-api", "severity": "critical"}
raw = json.dumps(alert, ensure_ascii=False, indent=2)

print(raw)
```

读取 JSON 文件：

```python
import json
from pathlib import Path

path = Path("data/alerts.json")
alerts = json.loads(path.read_text(encoding="utf-8"))
```

命令行校验 JSON：

```powershell
python -m json.tool data\alerts.json
```

如果 JSON 不合法，会输出错误位置；如果合法，会格式化输出。

## CSV

CSV 适合表格数据，例如指标导出、巡检结果、资产清单。

读取 CSV：

```python
import csv
from pathlib import Path

path = Path("data/metrics.csv")

with path.open(newline="", encoding="utf-8") as file:
    reader = csv.DictReader(file)
    for row in reader:
        print(row["service"], row["error_rate"])
```

写 CSV：

```python
import csv
from pathlib import Path

rows = [
    {"service": "order-api", "alert_count": 12},
    {"service": "payment-api", "alert_count": 5},
]

path = Path("reports/alert-count.csv")
path.parent.mkdir(parents=True, exist_ok=True)

with path.open("w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=["service", "alert_count"])
    writer.writeheader()
    writer.writerows(rows)
```

标准库 `csv` 适合简单任务。数据量大、列操作复杂时，再进入 pandas。

## 日期和时间

AIOps 数据几乎都带时间。你必须对时间敏感：

- 告警什么时候开始？
- 指标窗口是 5 分钟还是 1 小时？
- 日报按本地时间还是 UTC？
- 跨时区系统如何对齐？

基础例子：

```python
from datetime import datetime, timezone

now = datetime.now(timezone.utc)
print(now.isoformat())
```

解析 ISO 时间：

```python
from datetime import datetime

value = "2026-07-02T08:01:00Z"
started_at = datetime.fromisoformat(value.replace("Z", "+00:00"))

print(started_at)
```

初学阶段先记住：

- 不要只保存 `"08:01"` 这种没有日期和时区的信息。
- 跨系统传输时优先用 ISO 8601 形式。
- 报告展示时再转换成本地时间。

## 日志：logging

`print()` 适合学习和简单输出，但正式脚本更适合用 `logging`。

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

logging.info("start alert report")
logging.warning("missing owner for service: %s", "order-api")
```

日志级别：

| 级别 | 什么时候用 |
|---|---|
| `DEBUG` | 调试细节，例如中间变量 |
| `INFO` | 正常流程，例如开始、结束、写入文件 |
| `WARNING` | 有风险但还能继续 |
| `ERROR` | 当前任务失败或部分失败 |
| `CRITICAL` | 严重问题，通常需要立即关注 |

AIOps 脚本要输出可读日志，因为脚本失败时，日志就是排障入口。

## 命令行参数：argparse

不要把路径、阈值、日期写死在脚本里。使用命令行参数可以让脚本复用。

```python
import argparse

parser = argparse.ArgumentParser(description="Generate alert report")
parser.add_argument("--input", default="data/alerts.json")
parser.add_argument("--output", default="reports/alert-report.md")
parser.add_argument("--min-count", type=int, default=3)

args = parser.parse_args()

print(args.input)
print(args.output)
print(args.min_count)
```

运行：

```powershell
python scripts\alert_report.py --input data\alerts.json --output reports\alert-report.md --min-count 5
```

查看帮助：

```powershell
python scripts\alert_report.py --help
```

一个脚本是否像工程工具，一个重要标志就是：别人能不能通过 `--help` 看懂怎么用。

## HTTP API：urllib 和 requests

Python 标准库有 `urllib.request` 可以发送 HTTP 请求：

```python
import json
from urllib.request import urlopen

url = "http://localhost:9090/api/v1/query?query=up"

with urlopen(url, timeout=5) as response:
    payload = json.loads(response.read().decode("utf-8"))

print(payload["status"])
```

真实项目里很多人会用第三方库 `requests`，因为它更易读：

```powershell
python -m pip install requests
```

```python
import requests

response = requests.get(
    "http://localhost:9090/api/v1/query",
    params={"query": "up"},
    timeout=5,
)
response.raise_for_status()
payload = response.json()

print(payload["status"])
```

API 调用要注意：

| 点 | 为什么重要 |
|---|---|
| timeout | 不设置超时，脚本可能一直卡住 |
| status code | 不是 200 就要处理 |
| authentication | token 不要硬编码进代码 |
| pagination | 很多 API 分页返回 |
| rate limit | GitHub 等平台有限流 |
| retry | 网络抖动时可以有限重试 |

## 调用外部命令：subprocess

有时脚本需要调用系统命令，例如 `kubectl`、`git`、`docker`。标准库 `subprocess` 可以做到。

```python
import subprocess

result = subprocess.run(
    ["git", "status", "--short"],
    capture_output=True,
    text=True,
    check=True,
)

print(result.stdout)
```

字段解释：

| 参数 | 含义 |
|---|---|
| `["git", "status", "--short"]` | 命令和参数，推荐用列表 |
| `capture_output=True` | 捕获 stdout 和 stderr |
| `text=True` | 输出按字符串处理 |
| `check=True` | 命令失败时抛异常 |

不要轻易把用户输入拼成一个字符串交给 shell 执行，这会带来安全风险。能用列表就用列表。

## 数据聚合：Counter

标准库 `collections.Counter` 很适合做简单计数。

```python
from collections import Counter

services = ["api", "db", "api", "cache", "api"]
counts = Counter(services)

print(counts)
print(counts.most_common(2))
```

输出：

```text
Counter({'api': 3, 'db': 1, 'cache': 1})
[('api', 3), ('db', 1)]
```

AIOps 场景：

```python
from collections import Counter

alerts = [
    {"service": "api"},
    {"service": "db"},
    {"service": "api"},
]

by_service = Counter(alert["service"] for alert in alerts)
print(by_service.most_common())
```

这是告警噪声统计的最小版本。

## 命令 / 配置 / API 字典

### `python --version`

| 项目 | 内容 |
|---|---|
| 作用 | 查看当前 `python` 命令对应的解释器版本 |
| 语法 | `python --version` |
| 示例输出 | `Python 3.12.4` |
| AIOps 场景 | 排查“我这里能跑、你那里不能跑”时先看版本 |
| 常见坑 | 多版本共存时，`python` 可能不是你以为的版本 |

### `py -0p`

| 项目 | 内容 |
|---|---|
| 作用 | Windows 上列出 Python Launcher 能找到的版本和路径 |
| 语法 | `py -0p` |
| 示例输出 | `-3.12-64 C:\Users\...\Python312\python.exe` |
| AIOps 场景 | Windows 学员排查多版本 Python |
| 常见坑 | 不是所有平台都有 `py` 命令 |

### `python -m venv .venv`

| 项目 | 内容 |
|---|---|
| 作用 | 在当前项目创建虚拟环境 |
| 语法 | `python -m venv .venv` |
| 生成内容 | `.venv/` 目录 |
| AIOps 场景 | 每个脚本项目隔离依赖 |
| 常见坑 | 创建后还需要激活；`.venv/` 不提交到 Git |

### `.\.venv\Scripts\Activate.ps1`

| 项目 | 内容 |
|---|---|
| 作用 | Windows PowerShell 激活虚拟环境 |
| 语法 | `.\.venv\Scripts\Activate.ps1` |
| 成功标志 | 命令行提示符出现 `(.venv)` |
| AIOps 场景 | 确保安装包进入项目环境 |
| 常见坑 | PowerShell 执行策略可能阻止脚本运行 |

### `source .venv/bin/activate`

| 项目 | 内容 |
|---|---|
| 作用 | Linux/macOS 激活虚拟环境 |
| 语法 | `source .venv/bin/activate` |
| 成功标志 | 命令行提示符出现 `(.venv)` |
| AIOps 场景 | 服务器或 macOS 开发环境运行脚本 |
| 常见坑 | Windows PowerShell 路径不同 |

### `python -m pip install`

| 项目 | 内容 |
|---|---|
| 作用 | 安装第三方包 |
| 语法 | `python -m pip install package-name` |
| 示例 | `python -m pip install requests` |
| AIOps 场景 | 安装 API 客户端、数据分析库、Web 框架 |
| 常见坑 | 没激活虚拟环境时可能装到全局环境 |

### `python -m pip list`

| 项目 | 内容 |
|---|---|
| 作用 | 查看当前环境已安装包 |
| 语法 | `python -m pip list` |
| AIOps 场景 | 排查 `ModuleNotFoundError` |
| 常见坑 | 要确认当前 `python` 来自 `.venv` |

### `python -m pip freeze > requirements.txt`

| 项目 | 内容 |
|---|---|
| 作用 | 记录当前环境的精确依赖版本 |
| 语法 | `python -m pip freeze > requirements.txt` |
| 生成内容 | `requirements.txt` |
| AIOps 场景 | 让别人复现你的脚本运行环境 |
| 常见坑 | 会记录当前环境所有包；环境不干净时文件会很乱 |

### `python -m pip install -r requirements.txt`

| 项目 | 内容 |
|---|---|
| 作用 | 按依赖文件安装包 |
| 语法 | `python -m pip install -r requirements.txt` |
| AIOps 场景 | 新机器、CI、同事电脑复现环境 |
| 常见坑 | Python 版本不兼容时安装可能失败 |

### `python script.py`

| 项目 | 内容 |
|---|---|
| 作用 | 执行一个 Python 脚本文件 |
| 语法 | `python scripts\alert_report.py` |
| AIOps 场景 | 运行巡检、统计、报告生成脚本 |
| 常见坑 | 相对路径依赖当前工作目录，不一定是脚本所在目录 |

### `python -m json.tool`

| 项目 | 内容 |
|---|---|
| 作用 | 校验和格式化 JSON |
| 语法 | `python -m json.tool data\alerts.json` |
| AIOps 场景 | 排查 API 返回或样例数据是否是合法 JSON |
| 常见坑 | JSON 末尾多逗号、字符串没双引号都会失败 |

### `argparse.ArgumentParser`

| 项目 | 内容 |
|---|---|
| 作用 | 定义命令行参数 |
| 常用字段 | `description`、`add_argument`、`type`、`default`、`required` |
| AIOps 场景 | 让脚本支持 `--input`、`--output`、`--threshold` |
| 常见坑 | 参数类型默认是字符串，数字要写 `type=int` 或 `type=float` |

### `logging.basicConfig`

| 项目 | 内容 |
|---|---|
| 作用 | 配置日志级别和格式 |
| 常用字段 | `level`、`format` |
| AIOps 场景 | 让自动化脚本在 CI、定时任务、日志系统中可排障 |
| 常见坑 | 用 `print` 输出太随意，失败时缺少上下文 |

## AIOps 入门实验：告警噪声日报

这个实验只用 Python 标准库，不需要安装第三方包。目标是把一份告警 JSON 统计成 Markdown 报告。

### 第 1 步：准备目录

```powershell
mkdir data
mkdir scripts
mkdir reports
```

### 第 2 步：创建样例数据

创建 `data/alerts.json`：

```json
[
  {
    "service": "order-api",
    "severity": "critical",
    "name": "HighErrorRate",
    "starts_at": "2026-07-02T08:01:00Z",
    "summary": "5xx error rate is above 2%"
  },
  {
    "service": "order-api",
    "severity": "warning",
    "name": "HighLatency",
    "starts_at": "2026-07-02T08:05:00Z",
    "summary": "p95 latency is above 300ms"
  },
  {
    "service": "payment-api",
    "severity": "critical",
    "name": "PaymentFailure",
    "starts_at": "2026-07-02T08:09:00Z",
    "summary": "payment failure rate is above 1%"
  },
  {
    "service": "order-api",
    "severity": "critical",
    "name": "HighErrorRate",
    "starts_at": "2026-07-02T08:15:00Z",
    "summary": "5xx error rate is above 2%"
  }
]
```

### 第 3 步：创建脚本

创建 `scripts/alert_report.py`：

```python
import argparse
import json
import logging
from collections import Counter
from datetime import datetime
from pathlib import Path


def load_alerts(path: Path) -> list[dict]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SystemExit(f"input file not found: {path}")
    except json.JSONDecodeError as error:
        raise SystemExit(f"invalid JSON in {path}: {error}")


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def render_report(alerts: list[dict], min_count: int) -> str:
    by_service = Counter(alert["service"] for alert in alerts)
    by_severity = Counter(alert["severity"] for alert in alerts)
    noisy_services = [
        (service, count)
        for service, count in by_service.most_common()
        if count >= min_count
    ]

    first_seen = min(parse_time(alert["starts_at"]) for alert in alerts)
    last_seen = max(parse_time(alert["starts_at"]) for alert in alerts)

    lines = [
        "# Alert Noise Report",
        "",
        f"- Total alerts: {len(alerts)}",
        f"- Time range: {first_seen.isoformat()} to {last_seen.isoformat()}",
        "",
        "## By Severity",
        "",
    ]

    for severity, count in by_severity.most_common():
        lines.append(f"- {severity}: {count}")

    lines.extend(["", "## By Service", ""])

    for service, count in by_service.most_common():
        lines.append(f"- {service}: {count}")

    lines.extend(["", "## Noisy Services", ""])

    if noisy_services:
        for service, count in noisy_services:
            lines.append(f"- {service}: {count} alerts")
    else:
        lines.append("- No service reached the noise threshold.")

    lines.extend(["", "## Raw Alerts", ""])

    for alert in alerts:
        lines.append(
            f"- [{alert['severity']}] {alert['service']} "
            f"{alert['name']}: {alert['summary']}"
        )

    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate an alert noise report.")
    parser.add_argument("--input", default="data/alerts.json")
    parser.add_argument("--output", default="reports/alert-report.md")
    parser.add_argument("--min-count", type=int, default=2)
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    input_path = Path(args.input)
    output_path = Path(args.output)

    alerts = load_alerts(input_path)
    report = render_report(alerts, args.min_count)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(report, encoding="utf-8")

    logging.info("wrote report: %s", output_path)


if __name__ == "__main__":
    main()
```

### 第 4 步：运行

```powershell
python scripts\alert_report.py --input data\alerts.json --output reports\alert-report.md --min-count 2
```

预期输出：

```text
INFO wrote report: reports\alert-report.md
```

### 第 5 步：查看报告

`reports/alert-report.md` 应该类似：

```markdown
# Alert Noise Report

- Total alerts: 4
- Time range: 2026-07-02T08:01:00+00:00 to 2026-07-02T08:15:00+00:00

## By Severity

- critical: 3
- warning: 1

## By Service

- order-api: 3
- payment-api: 1

## Noisy Services

- order-api: 3 alerts

## Raw Alerts

- [critical] order-api HighErrorRate: 5xx error rate is above 2%
- [warning] order-api HighLatency: p95 latency is above 300ms
- [critical] payment-api PaymentFailure: payment failure rate is above 1%
- [critical] order-api HighErrorRate: 5xx error rate is above 2%
```

### 你在这个实验里学到了什么

| 知识点 | 在脚本哪里 |
|---|---|
| 文件读取 | `Path.read_text()` |
| JSON 解析 | `json.loads()` |
| 异常处理 | `FileNotFoundError`、`JSONDecodeError` |
| 聚合计数 | `Counter` |
| 时间解析 | `datetime.fromisoformat()` |
| 命令行参数 | `argparse` |
| 日志输出 | `logging.info()` |
| 文件写入 | `Path.write_text()` |
| 脚本入口 | `if __name__ == "__main__"` |

这就是一个最小 AIOps 项目：输入是告警数据，处理逻辑是聚合分析，输出是可以给人看的报告。

## 从脚本走向真实 AIOps 项目

上面的实验可以继续升级：

| 升级方向 | 需要学习 |
|---|---|
| 从 Alertmanager API 拉真实告警 | HTTP、认证、超时、错误处理 |
| 从 Prometheus 查询指标 | PromQL、HTTP API、时间范围 |
| 把报告定时生成 | cron、GitHub Actions、systemd timer |
| 把报告发到 Slack/飞书 | Webhook、JSON、密钥管理 |
| 用 pandas 做复杂聚合 | DataFrame、groupby、时间序列 |
| 用 scikit-learn 做异常检测 | 特征、训练数据、评估 |
| 做成 Webhook 服务 | FastAPI、请求体、响应、部署 |

Python 本身是基础层。后面的工具越多，越需要这个基础稳定。

## 常见错误和排障

### `python` 命令找不到

现象：

```text
python : The term 'python' is not recognized
```

排查：

```powershell
py --version
where.exe python
```

处理思路：

- Windows 可以先试 `py`。
- 确认安装 Python 时是否勾选添加到 PATH。
- 重新打开终端。

### 装了包还是 `ModuleNotFoundError`

现象：

```text
ModuleNotFoundError: No module named 'requests'
```

排查：

```powershell
python -c "import sys; print(sys.executable)"
python -m pip list
```

常见原因：

- 包装到了全局 Python，但运行时用的是 `.venv`。
- 包装到了 `.venv`，但运行时没有激活虚拟环境。
- VS Code 选择了另一个解释器。

处理：

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install requests
python scripts\your_script.py
```

### PowerShell 不允许激活虚拟环境

现象：

```text
running scripts is disabled on this system
```

这是 PowerShell 执行策略问题。学习环境中可以对当前用户放宽：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

然后重新激活：

```powershell
.\.venv\Scripts\Activate.ps1
```

如果是在公司电脑，先遵守公司的安全策略，不要绕过管理要求。

### 相对路径找不到文件

现象：

```text
input file not found: data\alerts.json
```

排查当前工作目录：

```python
from pathlib import Path

print(Path.cwd())
```

相对路径是相对于“你运行命令时所在的目录”，不是一定相对于脚本文件。最简单的做法是在项目根目录运行：

```powershell
python scripts\alert_report.py
```

### 中文乱码

读写文件时指定 UTF-8：

```python
content = Path("note.md").read_text(encoding="utf-8")
Path("out.md").write_text(content, encoding="utf-8")
```

不要依赖系统默认编码。不同系统、终端、编辑器默认编码可能不同。

### JSON 解析失败

现象：

```text
json.decoder.JSONDecodeError
```

校验：

```powershell
python -m json.tool data\alerts.json
```

常见错误：

- 字符串用了单引号。
- 最后一项后面多了逗号。
- 注释写进 JSON。
- 文件不是 UTF-8。

### pip 下载慢或失败

先确认网络和 pip：

```powershell
python -m pip --version
python -m pip config list
```

处理思路：

- 确认能访问 PyPI 或公司镜像。
- 公司网络可能需要代理。
- 不要随便从不可信来源安装包。
- 在团队中固定依赖版本，减少“今天能装、明天装不上”的风险。

### API 调用卡住

原因通常是没有设置 timeout：

```python
response = requests.get(url, timeout=5)
```

标准库：

```python
with urlopen(url, timeout=5) as response:
    ...
```

AIOps 脚本不要无限等待外部 API。它可能运行在 CI、定时任务或告警链路里，卡住就会影响后续流程。

## 学习路线

### 第 1 阶段：能跑起来

- 安装 Python。
- 会看版本。
- 会运行 `.py` 文件。
- 会进入和退出交互式解释器。
- 会创建虚拟环境。

学习证据：提交一个 `hello_aiops.py`，输出当前时间和一条服务状态。

### 第 2 阶段：能处理结构化数据

- 字符串、数字、布尔值。
- 列表、字典、集合。
- 条件判断和循环。
- 函数。
- JSON 和 CSV。

学习证据：写一个脚本读取告警 JSON，按服务统计数量。

### 第 3 阶段：能做成可复用脚本

- `argparse`。
- `logging`。
- 异常处理。
- 路径和编码。
- `requirements.txt`。

学习证据：脚本支持 `--input`、`--output`、`--threshold`，并有 README 说明。

### 第 4 阶段：能连接真实系统

- HTTP API。
- token 和环境变量。
- timeout 和错误处理。
- Prometheus / GitHub / Kubernetes API。

学习证据：从一个真实或本地模拟 API 拉数据，生成报告。

### 第 5 阶段：能进入数据和服务化

- pandas 做聚合。
- scikit-learn 做异常检测原型。
- FastAPI 做 webhook 或内部工具。
- GitHub Actions 定时运行。

学习证据：把 AIOps 脚本变成一个完整项目，包含数据样例、运行说明、输出样例和排障说明。

## 小白可能会问

### 运维转 AIOps，Python 要学到什么程度？

先学到能写稳定脚本：读文件、调 API、处理 JSON/CSV、聚合数据、输出报告、处理异常、记录日志。不要一开始就冲算法和框架。AIOps 的第一步是把手工判断自动化。

### 要不要先学算法？

不用先学算法。先学数据处理和工程基本功。异常检测模型以后会用到算法，但没有数据读取、清洗、验证和输出能力，模型也落不了地。

### 虚拟环境为什么这么重要？

它让每个项目有独立依赖。没有虚拟环境，你今天为了一个项目升级了 pandas，可能把另一个项目弄坏。AIOps 项目经常依赖很多库，环境隔离是基本功。

### `pip` 和 `python -m pip` 有什么区别？

`python -m pip` 明确使用当前解释器对应的 pip。多版本 Python 或虚拟环境切换时，它比单独敲 `pip` 更稳。

### 什么时候用标准库，什么时候用第三方库？

能用标准库清楚完成的任务，先用标准库。例如 JSON、CSV、路径、日志、命令行参数。数据分析、机器学习、Web API 这类复杂场景，再用 pandas、scikit-learn、FastAPI 等第三方库。

### Python 脚本能不能直接上生产？

可以，但要看质量。至少要有虚拟环境或依赖锁定、日志、异常处理、配置管理、超时、权限控制、运行方式、监控和回滚方案。学习脚本和生产自动化不是同一个标准。

## 面试怎么讲

Python 在 AIOps 里主要承担自动化、数据处理和原型验证。我会用它读取日志、CSV、JSON 和 API 数据，做清洗、聚合、统计和报告生成；也会用虚拟环境隔离依赖，用 `argparse` 做命令行参数，用 `logging` 输出运行日志，用异常处理保证脚本失败时可排查。对更复杂的场景，我会在这个基础上接 pandas 做数据分析，接 scikit-learn 做异常检测原型，或用 FastAPI 把自动化能力服务化。

## 面试题

1. Python、CPython、pip、PyPI、venv 分别是什么？
2. 为什么推荐使用 `python -m pip install`？
3. 虚拟环境解决什么问题？`.venv/` 为什么不提交到 Git？
4. `list`、`dict`、`set` 在告警处理中分别适合存什么？
5. 读写中文文件时为什么要写 `encoding="utf-8"`？
6. `alert["service"]` 和 `alert.get("service")` 有什么区别？
7. `if __name__ == "__main__"` 的作用是什么？
8. 为什么 AIOps 脚本要设置 HTTP timeout？
9. `print()` 和 `logging` 在脚本中有什么差别？
10. 如何把“每天统计告警最多的服务”改写成 Python 脚本？
11. `requirements.txt` 解决什么问题？它有什么局限？
12. 你会如何排查 `ModuleNotFoundError`？
13. Python 标准库里哪些模块对运维自动化最常用？
14. 从 Prometheus API 拉数据时，你会关注哪些错误处理点？
15. 一个可以放到 GitHub 展示的 AIOps Python 项目应该包含哪些文件？

## 学习检查清单

- [ ] 我能解释 Python、解释器、pip、PyPI、venv 的区别。
- [ ] 我能检查 Python 版本和解释器路径。
- [ ] 我能创建、激活、退出虚拟环境。
- [ ] 我能用 `python -m pip` 安装依赖并生成 `requirements.txt`。
- [ ] 我能运行一个 `.py` 文件。
- [ ] 我能使用字符串、数字、布尔值、列表、字典、集合。
- [ ] 我能写条件判断、循环和函数。
- [ ] 我能读写 UTF-8 文本文件。
- [ ] 我能读取和生成 JSON。
- [ ] 我能读取和生成 CSV。
- [ ] 我能用 `argparse` 接收命令行参数。
- [ ] 我能用 `logging` 输出脚本日志。
- [ ] 我能处理文件不存在、JSON 格式错误、依赖缺失等常见异常。
- [ ] 我能调用一个 HTTP API，并设置 timeout。
- [ ] 我能写一个告警统计脚本，并输出 Markdown 报告。

## 学习证据

完成这一篇后，建议把下面内容提交到 GitHub：

- `scripts/alert_report.py`
- `data/alerts.json`
- `reports/alert-report.md`
- `requirements.txt`，如果你安装了第三方包
- `README.md`，说明环境、运行命令、输入数据、输出结果、常见错误

README 至少要写清楚：

```markdown
# Alert Noise Report

## Requirements

- Python >= 3.11

## Setup

python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt

## Run

python scripts\alert_report.py --input data\alerts.json --output reports\alert-report.md --min-count 2

## Output

See reports\alert-report.md.
```

如果你能把这个小项目讲清楚，就说明你已经不是“会一点 Python 语法”，而是能用 Python 做一个最小 AIOps 自动化闭环。
