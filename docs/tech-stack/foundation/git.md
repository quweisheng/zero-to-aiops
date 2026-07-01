# Git

> 目标：能用 Git 记录学习过程、管理文档版本、提交项目代码，并把本地内容推送到 GitHub。

## 官方资料

- [Git Book: What is Git](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
- [Git Book: Recording Changes](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository)
- [Git Book: Branches](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)

说明：本文是基于官方 Git Book 的原创中文学习教程，不复制官方全文。

## 为什么要学

AIOps 学习不是只看视频和记笔记，而是要持续留下工程证据。Git 能记录你每次学习、实验、配置和项目改动，让别人看到你是怎样一步步从运维走向 AIOps 的。

如果不会 Git，就很难管理 Prometheus 配置、Grafana dashboard、Kubernetes YAML、Python 脚本和学习笔记；会 Git，才能把学习过程变成可追踪、可回滚、可展示的作品集。

## 是什么

Git 是分布式版本控制系统。它记录文件变化，让你知道什么时候改了什么、为什么改、如何回退、如何协作。

## 它解决什么问题

- 记录文件每次变化，避免学习笔记和配置丢失。
- 让每次修改都有提交说明，方便复盘。
- 支持回退错误修改。
- 支持本地仓库和 GitHub 远程仓库同步。
- 支持分支、合并、协作和代码评审。

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

## 学习检查清单

- [ ] 我能解释 Working Tree、Staging Area、Local Repository、Remote Repository。
- [ ] 我能用 `git status` 判断文件状态。
- [ ] 我能用 `git add` 和 `git commit` 创建一次清晰提交。
- [ ] 我能用 `git diff` 和 `git diff --staged` 查看改动。
- [ ] 我能把本地提交 push 到 GitHub。
- [ ] 我能解释 commit 和 push 的区别。
- [ ] 我能说明分支是指向 commit 的指针。
- [ ] 我能写出适合学习仓库的 commit message。

## 面试题

1. Git 和 GitHub 有什么区别？
2. Git 为什么说自己记录的是快照而不是简单差异？
3. `git add`、`git commit`、`git push` 分别做什么？
4. 工作区、暂存区、本地仓库、远程仓库分别是什么？
5. 如何查看未提交改动？
6. 分支的本质是什么？
7. merge 和 rebase 的区别是什么？学习阶段应该先掌握哪个？
8. 推送 GitHub 时为什么不能用账号密码？
9. 如果误提交了敏感信息，应该怎么处理？
10. 如何用 Git 提交历史证明自己的学习过程？

## 学习证据

- 10 次以上清晰 commit。
- 每次 commit message 能说明意图。
- README 能链接到学习记录。
