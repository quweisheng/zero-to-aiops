# GitHub Actions

> 目标：能写 workflow，在 push 时自动构建文档或运行检查，理解 workflow、job、step、runner、action 的关系。

## 官方资料

- [GitHub Actions documentation](https://docs.github.com/actions)
- [Understanding GitHub Actions](https://docs.github.com/articles/getting-started-with-github-actions)
- [Workflow syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub-hosted runners](https://docs.github.com/actions/using-github-hosted-runners/about-github-hosted-runners)

说明：本文是基于 GitHub Actions 官方文档整理的原创中文教程，不复制官方全文。

## 为什么要学

学习仓库如果只能手工构建和发布，迟早会忘记步骤。GitHub Actions 能让 push 后自动构建文档、运行测试、发布 GitHub Pages、检查代码和生成 artifact。

对 AIOps 学习来说，Actions 是你接触 CI/CD 的入口，也是把“配置变更 -> 自动验证 -> 自动发布”串起来的第一条流水线。

## 是什么

GitHub Actions 是 GitHub 内置的 CI/CD 和自动化平台。它可以在 push、pull request、手动触发、定时任务等事件发生时执行 workflow。

## 它解决什么问题

- 在 GitHub 事件发生时自动执行任务。
- 自动构建文档站或项目。
- 自动运行测试和检查。
- 管理 secrets、artifact 和环境。
- 用 workflow 记录可重复的交付流程。
- 为 CI/CD、发布和回滚打基础。

## 核心原理

```text
Event
  -> Workflow
  -> Jobs
  -> Runner
  -> Steps
  -> Actions or shell commands
```

## 核心概念

- Workflow：自动化流程，写在 `.github/workflows/*.yml`。
- Event：触发器，例如 push。
- Job：一组步骤，运行在同一个 runner。
- Runner：执行 job 的机器。
- Step：步骤，可以是命令或 action。
- Action：可复用动作。
- Secret：敏感变量。
- Artifact：构建产物。

## 最小 workflow

`.github/workflows/check.yml`：

```yaml
name: Check

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - name: Print message
        run: echo "hello aiops"
```

## VitePress 构建 workflow

```yaml
name: Build docs

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npm run docs:build
```

## GitHub Pages 发布

你的仓库已经有 Pages workflow。核心流程是：

1. checkout 代码。
2. 安装 Node。
3. `npm ci`。
4. `npm run docs:build`。
5. 上传 Pages artifact。
6. deploy pages。

## 在 AIOps 中的作用

- 自动构建学习文档站。
- 自动检查 Markdown 链接和格式。
- 自动运行 Python 项目测试。
- 自动构建 Docker 镜像。
- 为 CI/CD 和变更管理打基础。

## Secrets

敏感信息不要写进 YAML。放到：

```text
Settings -> Secrets and variables -> Actions
```

使用：

```yaml
env:
  API_TOKEN: ${{ secrets.API_TOKEN }}
```

## 入门实验

1. 新建 `.github/workflows/check.yml`。
2. push 到 GitHub。
3. 打开 Actions 页面。
4. 查看 workflow 日志。
5. 故意让命令失败，观察红色失败日志。

## 排障清单

### workflow 没触发

- 文件是否在 `.github/workflows/`。
- YAML 是否语法正确。
- on 条件是否匹配当前分支。

### npm ci 失败

- package-lock.json 是否存在。
- Node 版本是否匹配。
- 依赖是否有 registry 网络问题。

### Pages 没发布

- 仓库 Settings -> Pages 是否选择 GitHub Actions。
- workflow permissions 是否包含 pages/id-token。
- artifact 路径是否正确。

## 学习检查清单

- [ ] 我能解释 workflow、event、job、runner、step、action。
- [ ] 我能写一个最小 workflow。
- [ ] 我能用 `workflow_dispatch` 手动触发。
- [ ] 我能用 `actions/checkout` 和 `actions/setup-node`。
- [ ] 我能读取 Actions 日志定位失败 step。
- [ ] 我能区分 secret 和普通 env。
- [ ] 我能说明 artifact 的用途。
- [ ] 我能用 GitHub Actions 构建并部署 VitePress 文档。

## 面试题

1. GitHub Actions 是什么？
2. workflow、job、step、runner 分别是什么？
3. `on: push` 和 `workflow_dispatch` 有什么区别？
4. 为什么敏感信息要放在 secrets？
5. artifact 和 cache 有什么区别？
6. Actions 失败时如何定位问题？
7. 发布 GitHub Pages 需要哪些权限？
8. 为什么 CI 要在 pull request 或 push 时自动运行？
9. GitHub Actions 和传统 Jenkins 有什么异同？
10. GitHub Actions 如何支撑 AIOps 学习仓库自动化？

## 学习证据

- 一个成功运行的 workflow。
- 一张 Actions 成功截图或链接。
- 一篇记录：workflow、job、step、runner 的区别。
