# Git

> 目标：能用 Git 记录学习过程、管理文档版本、提交项目代码，并把本地内容推送到 GitHub。

## 官方资料

- [Git Book: What is Git](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
- [Git Book: Recording Changes](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository)
- [Git Book: Branches](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)

说明：本文是基于官方 Git Book 的原创中文学习教程，不复制官方全文。

## 是什么

Git 是分布式版本控制系统。它记录文件变化，让你知道什么时候改了什么、为什么改、如何回退、如何协作。

## 核心原理

Git 记录的是项目快照，不只是文件差异。每次 commit 都指向一次完整的项目状态。

三块区域：

```text
Working Tree
  -> git add
Staging Area
  -> git commit
Local Repository
  -> git push
Remote Repository
```

三个重要对象：

- Blob：文件内容。
- Tree：目录结构。
- Commit：一次提交，包含作者、时间、说明、父提交和 tree。

分支本质上是指向某个 commit 的可移动指针。

## 架构

```text
.git/
  objects/       存储对象
  refs/          分支和标签引用
  HEAD           当前分支指针
working tree     当前可见文件
index            暂存区
```

## 官网学习路线

1. 初始化仓库。
2. 查看状态。
3. 暂存文件。
4. 创建提交。
5. 查看历史。
6. 连接远程。
7. 推送和拉取。
8. 使用分支。
9. 处理冲突。
10. 回退错误。

## 安装与初始化

Windows 推荐安装 Git for Windows。

首次配置：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
git config --global credential.helper manager
```

初始化仓库：

```bash
git init -b main
git status
```

## 基础命令

```bash
git status
git add README.md
git add .
git commit -m "docs: add first learning note"
git log --oneline
git diff
git diff --staged
```

## 远程仓库

```bash
git remote add origin https://github.com/quweisheng/zero-to-aiops.git
git remote -v
git push -u origin main
git pull
```

GitHub HTTPS 推送推荐使用 Personal Access Token，通过 Git Credential Manager 保存，不要把 token 写进 remote URL。

## 分支

```bash
git branch
git switch -c docs/linux-note
git switch main
git merge docs/linux-note
```

学习阶段可以先都提交到 `main`。等项目代码多了，再学习分支和 PR。

## 常见状态

```text
?? file.md      未跟踪
 M file.md      已修改但未暂存
M  file.md      已暂存
A  file.md      新增并已暂存
```

## AIOps 中的作用

- 记录学习笔记。
- 保存 Prometheus、Grafana、Kubernetes、Ansible 配置。
- 记录 runbook 的演进。
- 让面试官看到持续学习轨迹。
- 让自动化流水线有可追踪的输入。

## 入门实验

在 `zero-to-aiops` 仓库里创建：

```text
docs/learning-records/git-first-commit.md
```

写入：

```md
# Git 第一次提交

## 我理解的 Git
Git 是用来记录文件变化的工具。

## 今天用到的命令
- git status
- git add
- git commit
- git push

## 我还不懂
- staged 是什么？
- commit 和 push 有什么区别？
```

提交：

```bash
git add docs/learning-records/git-first-commit.md
git commit -m "docs: add git first commit note"
git push
```

## 排障清单

### 提示 Author identity unknown

配置用户名和邮箱：

```bash
git config user.name "quweisheng"
git config user.email "quweisheng@users.noreply.github.com"
```

### 推送要求输入密码

GitHub 不再支持账号密码推送。密码位置输入 Personal Access Token。

### 不知道改了什么

```bash
git status
git diff
git diff --staged
```

## 学习证据

- 10 次以上清晰 commit。
- 每次 commit message 能说明意图。
- README 能链接到学习记录。
