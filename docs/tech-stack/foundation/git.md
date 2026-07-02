# Git 深讲

> 学习目标：理解 Git 的核心数据模型、工作区、暂存区、本地仓库、远程仓库、提交、分支、合并、冲突、回退和常用命令；能用 Git 管理 AIOps 知识库、配置文件、实验代码和学习证据。

## 官方资料

- [Git Book: What is Git?](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
- [Git Book: Getting a Git Repository](https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository)
- [Git Book: Recording Changes to the Repository](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository)
- [Git Book: Viewing the Commit History](https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History)
- [Git Book: Working with Remotes](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes)
- [Git Book: Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
- [Git Reference](https://git-scm.com/docs)

说明：本文基于官方 Git Book 和 Git Reference 重新整理，不复制官方全文。重点不是让你机械背 `add`、`commit`、`push`，而是让你理解 Git 为什么这么工作，以及如何把学习过程沉淀成可追踪的工程证据。

## 场景开场

“我今天改了 Prometheus 配置，明天又改了 Grafana dashboard。过两天发现跑不起来了，到底是哪一步改坏的？”

如果所有学习记录都靠文件名区分，比如 `final.md`、`final2.md`、`真的最终版.md`，很快就会乱。Git 的意义不是显得专业，而是让每一次修改都有记录、有说明、有回退点。

学 AIOps 最怕只说“我学过”。Git 能让你展示：哪天做了什么实验，改了哪些配置，踩了什么坑，又怎么修回来的。

## 一句话人话版

Git 是项目的时间机器：它把每次文件状态保存成提交快照，让你能比较、回退、分支开发、同步到 GitHub，并留下清晰的学习轨迹。

## 小白可能会问

- Git 和 GitHub 是一回事吗？
- `git add` 为什么不直接提交？暂存区到底有什么用？
- commit 里到底存了什么？
- 分支为什么这么快？它是不是复制了一份代码？
- `pull`、`fetch`、`push`、`clone` 这些远程命令到底在同步什么？
- 冲突为什么会发生，怎么安全解决？

## 为什么要学

AIOps 学习不是只看视频和记笔记，而是要持续留下工程证据。Git 能记录你每次学习、实验、配置和项目改动，让别人看到你是怎样一步步从运维走向 AIOps 的。

如果不会 Git，就很难管理：

- Prometheus 配置。
- Grafana dashboard JSON。
- Kubernetes YAML。
- Docker Compose 实验环境。
- Python 异常检测脚本。
- Runbook 和故障复盘。
- VitePress 文档站。

会 Git，才能把学习过程变成可追踪、可回滚、可展示的作品集。

## 官方知识地图

官方 Git Book 的主线大致是：

```text
Getting Started
  -> Git 是什么，如何安装和配置
Git Basics
  -> 仓库、文件状态、暂存、提交、历史、撤销、远程
Git Branching
  -> 分支、合并、冲突、分支工作流
Git on the Server / GitHub
  -> 远程协作和托管
Git Tools
  -> stash、tag、rebase、reset、高级查看
Git Internals
  -> 对象、引用、packfile、refspec
Reference
  -> 每个命令的完整参数
```

本文按小白学习顺序重组：

1. Git 是什么，和 GitHub 有什么区别。
2. Git 的三棵树：工作区、暂存区、本地仓库。
3. Git 的文件状态：untracked、modified、staged、committed。
4. Git 的对象模型：blob、tree、commit、tag。
5. 提交历史和 HEAD。
6. 分支和合并。
7. 远程仓库和 GitHub。
8. 撤销、回退和恢复。
9. 冲突处理。
10. `.gitignore`、tag、stash、配置。
11. AIOps 必会命令字典。
12. 学习仓库的 Git 工作流。

## Git 是什么

Git 是分布式版本控制系统。

这句话拆开看：

| 词 | 含义 |
|---|---|
| 版本控制 | 记录文件变化，能查看历史和回退 |
| 分布式 | 每个人本地都有完整仓库历史，不完全依赖中央服务器 |
| 系统 | 它不只是一个命令，而是一套对象模型、引用、命令和协作方式 |

Git 最核心的能力是：

```text
把项目在某一刻的状态保存下来
  -> 给这次状态一个说明
  -> 以后可以比较、回退、分支、合并、同步
```

## Git 和 GitHub 的区别

Git 是工具，GitHub 是平台。

| 项 | Git | GitHub |
|---|---|---|
| 类型 | 版本控制工具 | 代码托管和协作平台 |
| 运行位置 | 本地电脑 | 云端网站 |
| 核心能力 | commit、branch、merge、diff | repository、pull request、issue、actions、pages |
| 没网能不能用 | 可以，本地提交没问题 | 不可以访问云端功能 |
| AIOps 用途 | 管理文档、配置、代码历史 | 展示作品集、发布文档站、自动构建 |

一句话：

```text
Git 负责记录变化。
GitHub 负责把仓库放到网上协作和展示。
```

## Git 仓库是什么

一个 Git 仓库由两部分组成：

```text
项目文件
  + .git 目录
```

`.git` 目录里保存 Git 的核心数据：

| 路径 | 作用 |
|---|---|
| `.git/objects` | Git 对象数据库 |
| `.git/refs` | 分支和标签引用 |
| `.git/HEAD` | 当前所在分支或提交 |
| `.git/config` | 当前仓库配置 |
| `.git/index` | 暂存区，也叫 index |

普通学习时不用手动改 `.git`，但知道它的存在很重要。删除 `.git` 目录，项目文件还在，但 Git 历史就没了。

## 三棵树：工作区、暂存区、本地仓库

官方 Git 文档经常用“三棵树”理解 Git。

```text
Working Tree
  -> 你当前看得见、正在编辑的文件

Index / Staging Area
  -> 准备放进下一次 commit 的内容

HEAD / Local Repository
  -> 当前分支最近一次 commit
```

### 工作区

工作区就是你在文件管理器或编辑器里看到的文件。

你修改 `docs/tech-stack/foundation/linux.md`，这个修改首先发生在工作区。

查看：

```bash
git status
git diff
```

### 暂存区

暂存区是下一次提交的候选内容。

命令：

```bash
git add docs/tech-stack/foundation/linux.md
```

这一步不是提交，只是告诉 Git：下一次 commit 请把这个文件当前状态放进去。

为什么需要暂存区？

因为你可能同时改了 5 个文件，但只想把其中 2 个作为一次清晰提交。

例子：

```text
修改了 Linux 文档
修改了 README
修改了 package.json

这三件事不一定属于同一个 commit。
```

### 本地仓库

本地仓库保存提交历史。

命令：

```bash
git commit -m "docs: deepen linux tutorial"
```

commit 后，本地仓库多了一个新快照。

## 文件状态

Git 文件常见状态：

| 状态 | 含义 | 怎么进入 |
|---|---|---|
| untracked | Git 还没跟踪的新文件 | 新建文件 |
| modified | 已跟踪文件被修改，但未暂存 | 编辑文件 |
| staged | 已放入暂存区 | `git add` |
| committed | 已提交到本地仓库 | `git commit` |

`git status --short` 输出示例：

```text
?? new.md
 M linux.md
M  git.md
A  prometheus.md
```

含义：

| 输出 | 含义 |
|---|---|
| `?? new.md` | 新文件，未跟踪 |
| ` M linux.md` | 工作区修改，未暂存 |
| `M  git.md` | 已暂存修改 |
| `A  prometheus.md` | 新增文件，已暂存 |

注意空格位置。左列表示暂存区，右列表示工作区。

## Git 对象模型

Git 不只是保存“文件差异”。官方 Git Book 里强调，Git 更像保存项目快照。

核心对象：

| 对象 | 作用 | 人话理解 |
|---|---|---|
| blob | 保存文件内容 | 一份文件内容 |
| tree | 保存目录结构 | 文件名、权限、指向 blob 或子 tree |
| commit | 保存一次提交 | 作者、时间、说明、父提交、指向 tree |
| tag | 给某个提交打标签 | 版本标记 |

一次 commit 大致长这样：

```text
commit
  -> tree
       -> README.md blob
       -> docs/ tree
            -> linux.md blob
  -> parent commit
  -> author
  -> message
```

所以分支切换、回退、比较，本质上都围绕这些对象和引用进行。

## HEAD 是什么

HEAD 是“我当前站在哪里”的指针。

通常情况下：

```text
HEAD -> refs/heads/main -> 某个 commit
```

也就是说，你在 `main` 分支上，`main` 指向某个 commit，HEAD 指向 `main`。

查看：

```bash
git log --oneline --decorate -5
git branch
```

如果看到 detached HEAD，说明 HEAD 直接指向某个 commit，而不是某个分支。

## 安装和首次配置

Windows 推荐安装 Git for Windows。安装后会有：

- `git.exe`
- Git Bash
- Git Credential Manager

首次配置：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"
```

查看配置：

```bash
git config --list
git config --global --list
```

配置层级：

| 层级 | 命令 | 作用范围 |
|---|---|---|
| system | `git config --system` | 整台机器 |
| global | `git config --global` | 当前用户 |
| local | `git config --local` | 当前仓库 |

优先级通常是 local 高于 global，高于 system。

## 创建仓库

### 从零初始化

```bash
mkdir aiops-demo
cd aiops-demo
git init -b main
git status
```

这会创建 `.git` 目录。

### 克隆已有仓库

```bash
git clone https://github.com/quweisheng/zero-to-aiops.git
```

clone 会做三件事：

1. 下载远程仓库的对象和引用。
2. 创建本地工作区。
3. 默认配置远程名为 `origin`。

## 记录一次修改

标准流程：

```bash
git status
git diff
git add docs/tech-stack/foundation/git.md
git diff --staged
git commit -m "docs: deepen git tutorial"
git log --oneline -5
```

每一步在做什么：

| 命令 | 作用 |
|---|---|
| `git status` | 看当前文件状态 |
| `git diff` | 看工作区和暂存区的差异 |
| `git add` | 把内容放进暂存区 |
| `git diff --staged` | 看暂存区和 HEAD 的差异 |
| `git commit` | 创建提交 |
| `git log` | 查看提交历史 |

## 提交信息怎么写

坏例子：

```text
update
fix
修改
```

好例子：

```text
docs: deepen linux tutorial
docs: add prometheus alert rule example
fix: correct grafana datasource URL
chore: update vitepress config
```

推荐格式：

```text
类型: 做了什么
```

常见类型：

| 类型 | 用途 |
|---|---|
| `docs` | 文档 |
| `feat` | 新功能 |
| `fix` | 修复 |
| `chore` | 杂项维护 |
| `refactor` | 重构 |
| `test` | 测试 |

## 查看历史

常用命令：

```bash
git log
git log --oneline
git log --oneline --graph --decorate --all
git show HEAD
git show <commit>
```

看某个文件历史：

```bash
git log -- docs/tech-stack/foundation/git.md
```

看某次提交改了什么：

```bash
git show --stat <commit>
git show <commit>
```

## 比较差异

| 命令 | 比较什么 |
|---|---|
| `git diff` | 工作区 vs 暂存区 |
| `git diff --staged` | 暂存区 vs HEAD |
| `git diff HEAD` | 工作区 + 暂存区 vs HEAD |
| `git diff main..feature` | 两个分支差异 |
| `git diff <commit1> <commit2>` | 两个提交差异 |

学习时最常用：

```bash
git diff
git diff --staged
```

## 分支是什么

分支不是复制一份完整代码。分支本质上是指向 commit 的可移动指针。

```text
main -> C3

C1 -> C2 -> C3
```

创建分支：

```bash
git switch -c docs/git-deep-dive
```

现在：

```text
main              -> C3
docs/git-deep-dive -> C3
HEAD -> docs/git-deep-dive
```

你继续 commit 后：

```text
main              -> C3
docs/git-deep-dive -> C4
```

这就是 Git 分支很快的原因：创建分支只是创建一个指针。

## 分支常用命令

```bash
git branch
git branch -v
git switch -c docs/git-deep-dive
git switch main
git merge docs/git-deep-dive
git branch -d docs/git-deep-dive
```

旧命令里常见 `checkout`：

```bash
git checkout -b docs/git-deep-dive
git checkout main
```

新手建议优先用 `git switch`，语义更清楚。

## 合并和冲突

### fast-forward 合并

如果 main 没有新提交，只是分支往前走，Git 可以直接移动 main 指针。

```text
main -> C3
feature -> C4

merge 后：
main -> C4
```

### 三方合并

如果两个分支都各自有新提交，Git 会找共同祖先，做三方合并。

```text
      C4 feature
     /
C1-C2-C3 main
     \
      C5 main
```

合并后产生 merge commit。

### 冲突

冲突通常发生在两个分支修改了同一文件同一位置。

冲突标记大概长这样。下面示例故意在符号之间加了空格，避免被 Git 检查工具误判成真的冲突残留：

```text
< < < < < < < HEAD
当前分支内容
= = = = = = =
要合并进来的内容
> > > > > > > feature
```

处理步骤：

1. 打开冲突文件。
2. 决定保留哪部分，或手工合并。
3. 删除冲突标记。
4. `git add` 标记已解决。
5. `git commit` 完成合并。

命令：

```bash
git status
git add conflicted-file.md
git commit
```

## 远程仓库

远程仓库是另一个位置的 Git 仓库，通常在 GitHub 上。

常用概念：

| 名词 | 含义 |
|---|---|
| `origin` | 默认远程名 |
| `main` | 本地分支 |
| `origin/main` | 远程跟踪分支 |
| upstream | 当前分支默认推送/拉取目标 |

查看远程：

```bash
git remote -v
git branch -vv
```

添加远程：

```bash
git remote add origin https://github.com/quweisheng/zero-to-aiops.git
```

推送并设置 upstream：

```bash
git push -u origin main
```

## fetch、pull、push

### fetch

```bash
git fetch origin
```

fetch 只下载远程更新，更新 `origin/main`，不直接改你的工作区。

### pull

```bash
git pull
```

pull 大致等于：

```text
git fetch
  + git merge 或 git rebase
```

它会把远程更新整合进当前分支。

### push

```bash
git push
```

push 把本地提交上传到远程仓库。

如果别人也推了新提交，你可能需要先 pull 再 push。

## 撤销和回退

Git 的撤销命令要非常谨慎，因为它们影响的区域不同。

### 丢弃工作区修改

```bash
git restore file.md
```

含义：把工作区文件恢复到暂存区或 HEAD 的状态。

### 取消暂存

```bash
git restore --staged file.md
```

含义：从暂存区拿出来，但工作区修改还在。

### 修改最近一次提交说明

```bash
git commit --amend
```

用于刚提交完发现 message 写错，或漏 add 一个文件。

### revert

```bash
git revert <commit>
```

revert 会创建一个新提交，用来反向抵消旧提交。适合已经 push 到远程的历史。

### reset

```bash
git reset --soft HEAD~1
git reset --mixed HEAD~1
git reset --hard HEAD~1
```

区别：

| 命令 | commit 回退 | 暂存区 | 工作区 |
|---|---|---|---|
| `--soft` | 是 | 保留 | 保留 |
| `--mixed` | 是 | 清空 | 保留 |
| `--hard` | 是 | 清空 | 丢弃 |

`reset --hard` 会丢工作区改动，新手不要随便用。

## `.gitignore`

`.gitignore` 用来告诉 Git 哪些文件不应该跟踪。

AIOps 仓库常见忽略：

```text
node_modules/
.vitepress/cache/
.vitepress/dist/
.env
*.log
__pycache__/
.venv/
```

注意：

`.gitignore` 只对未跟踪文件生效。如果文件已经被 Git 跟踪，需要先：

```bash
git rm --cached file
```

## stash

stash 用来临时保存未提交修改。

场景：你正在写文档，突然需要切分支处理别的事。

```bash
git stash push -m "wip git tutorial"
git stash list
git stash pop
```

注意：stash 不是长期保存方案。重要修改应该 commit。

## tag

tag 用来给某个提交打版本标记。

```bash
git tag v0.1.0
git tag
git show v0.1.0
git push origin v0.1.0
```

学习仓库可以用 tag 标记阶段成果：

```text
v0.1-linux-deep-dive
v0.2-observability-lab
```

## AIOps 必会 Git 命令字典

### 配置和初始化

| 命令 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `git --version` | 查看版本 | `git --version` | 输出版本号 | PATH 没配置会找不到 git |
| `git config` | 配置 Git | `git config --global user.name "name"` | 配置写入 | 邮箱写错会影响提交作者 |
| `git init` | 初始化仓库 | `git init -b main` | 出现 `.git` | 不要在错误目录初始化 |
| `git clone` | 克隆仓库 | `git clone URL` | 下载项目 | 网络或权限失败 |

### 状态和差异

| 命令 | 作用 | 常用写法 | 关键点 | 常见坑 |
|---|---|---|---|---|
| `git status` | 看文件状态 | `git status --short` | 左列暂存区，右列工作区 | 忽略文件不会显示 |
| `git diff` | 看未暂存差异 | `git diff` | 工作区 vs 暂存区 | 已 add 的内容看不到 |
| `git diff --staged` | 看已暂存差异 | `git diff --staged` | 暂存区 vs HEAD | commit 前必看 |
| `git log` | 看历史 | `git log --oneline --graph --decorate` | 提交顺序和分支 | 输出太长可加 `--oneline` |
| `git show` | 看某次提交 | `git show HEAD` | 提交元信息和 diff | 大提交很长 |

### 暂存和提交

| 命令 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `git add` | 放入暂存区 | `git add file`、`git add .` | status 左列变更 | `add .` 可能加进无关文件 |
| `git commit` | 创建提交 | `git commit -m "docs: ..."` | 生成 commit hash | message 太随意 |
| `git commit --amend` | 修改最近提交 | `git commit --amend` | 替换最近 commit | 已 push 后慎用 |

### 分支和合并

| 命令 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `git branch` | 查看/管理分支 | `git branch -v` | 显示分支列表 | `*` 表示当前分支 |
| `git switch` | 切换分支 | `git switch main` | HEAD 切到分支 | 有未提交冲突时会失败 |
| `git switch -c` | 创建并切换 | `git switch -c docs/git` | 新分支创建 | 分支名要清晰 |
| `git merge` | 合并分支 | `git merge docs/git` | 合并提交或 fast-forward | 可能冲突 |
| `git rebase` | 变基 | `git rebase main` | 重写提交基底 | 新手先少用，已共享分支慎用 |

### 远程同步

| 命令 | 作用 | 常用写法 | 正常结果 | 常见坑 |
|---|---|---|---|---|
| `git remote` | 管理远程 | `git remote -v` | 显示 fetch/push URL | origin 只是名字 |
| `git fetch` | 下载远程更新 | `git fetch origin` | 更新远程跟踪分支 | 不改工作区 |
| `git pull` | 拉取并整合 | `git pull` | 当前分支更新 | 可能产生 merge 或冲突 |
| `git push` | 推送提交 | `git push` | 上传到远程 | 权限或远程落后会失败 |
| `git push -u` | 设置 upstream | `git push -u origin main` | 后续可直接 push | 首次推送常用 |

### 撤销和恢复

| 命令 | 作用 | 常用写法 | 影响范围 | 常见坑 |
|---|---|---|---|---|
| `git restore` | 恢复工作区 | `git restore file` | 工作区 | 会丢未保存修改 |
| `git restore --staged` | 取消暂存 | `git restore --staged file` | 暂存区 | 工作区修改还在 |
| `git revert` | 反向提交 | `git revert <commit>` | 新增提交 | 适合已 push 历史 |
| `git reset --soft` | 回退提交，保留暂存 | `git reset --soft HEAD~1` | HEAD | 改动还在暂存区 |
| `git reset --mixed` | 回退提交，保留工作区 | `git reset HEAD~1` | HEAD + index | 默认模式 |
| `git reset --hard` | 强制回退 | `git reset --hard HEAD~1` | HEAD + index + 工作区 | 会丢改动，慎用 |

### 临时保存和标签

| 命令 | 作用 | 常用写法 | 场景 |
|---|---|---|---|
| `git stash` | 临时保存修改 | `git stash push -m "wip"` | 临时切任务 |
| `git stash pop` | 恢复 stash | `git stash pop` | 回到临时修改 |
| `git tag` | 打标签 | `git tag v0.1.0` | 标记阶段成果 |

## 常见问题排查

### Author identity unknown

原因：没有配置用户名和邮箱。

解决：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

### push 要求密码或失败

GitHub HTTPS 推送不能用账号密码。需要 Personal Access Token 或让 Git Credential Manager 处理登录。

检查远程：

```bash
git remote -v
```

### 不知道自己改了什么

```bash
git status
git diff
git diff --staged
```

### pull 后冲突

```bash
git status
```

打开冲突文件，删除冲突标记，保留正确内容：

```bash
git add file
git commit
```

### commit 后发现漏了文件

如果还没 push：

```bash
git add missing-file
git commit --amend
```

如果已经 push，学习阶段更稳妥：

```bash
git add missing-file
git commit -m "docs: add missing file"
git push
```

### 误 add 了文件

```bash
git restore --staged file
```

### 误提交了敏感信息

第一步：立即撤销密钥或 token，不要只依赖删 Git 历史。

然后：

- 如果还没 push，可以修改提交。
- 如果已经 push，需要清理历史，并确认远程和缓存都处理。
- 对学习仓库来说，最重要的是不要把 `.env`、token、密码提交进去。

## AIOps 学习仓库的 Git 工作流

推荐你用这种节奏：

```text
每天学习 / 实验
  -> 修改一小组相关文件
  -> git status
  -> git diff
  -> git add 相关文件
  -> git diff --staged
  -> git commit -m "docs: ..."
  -> git push
```

提交粒度建议：

| 好提交 | 坏提交 |
|---|---|
| `docs: deepen linux tutorial` | `update` |
| `docs: add prometheus scrape config example` | `改一下` |
| `feat: add alert dedup demo script` | `new` |
| `fix: correct grafana datasource url` | `fix bug` |

每个 commit 最好只表达一件事。

## 入门实验：给知识库做 5 次清晰提交

目标：练会 Git 基本流程，并让 GitHub 上出现真实学习轨迹。

### 第一步：查看当前状态

```bash
git status --short
```

记录：

```text
哪些文件改了？
哪些文件还没被 Git 跟踪？
```

### 第二步：新建学习记录

文件：`docs/learning-records/git-first-week.md`

内容：

```md
# Git 第一周练习

## 我理解的 Git

Git 是记录项目变化的工具。它用 commit 保存快照，用 branch 支持并行修改，用 remote 同步到 GitHub。

## 今天练习的命令

- git status
- git diff
- git add
- git commit
- git log
- git push

## 我还不懂

- reset 和 revert 的区别
- merge 冲突怎么处理
- rebase 什么时候用
```

### 第三步：暂存和提交

```bash
git add docs/learning-records/git-first-week.md
git diff --staged
git commit -m "docs: add git first week note"
```

### 第四步：查看历史

```bash
git log --oneline -5
```

### 第五步：推送到 GitHub

```bash
git push
```

学习证据：

- GitHub 上能看到 commit。
- commit message 清楚。
- 文件内容能说明你学了什么。

## 在 AIOps 中的作用

Git 在 AIOps 学习中的价值不是“会用一个工具”，而是让所有学习证据可追踪。

| AIOps 资产 | Git 怎么管理 |
|---|---|
| Prometheus 配置 | 记录 `prometheus.yml` 的每次调整 |
| Grafana dashboard | 保存 JSON，追踪视图变化 |
| Kubernetes YAML | 记录部署配置和回滚历史 |
| Python 脚本 | 跟踪异常检测逻辑演进 |
| Runbook | 记录处理流程如何改进 |
| RCA 复盘 | 留下故障学习证据 |
| 文档站 | 用提交历史展示持续学习 |

## 学习检查清单

- [ ] 我能解释 Git 和 GitHub 的区别。
- [ ] 我能解释工作区、暂存区、本地仓库、远程仓库。
- [ ] 我能解释 untracked、modified、staged、committed。
- [ ] 我能解释 blob、tree、commit、branch、HEAD。
- [ ] 我能完成 `status -> diff -> add -> diff --staged -> commit -> push` 流程。
- [ ] 我能写清晰 commit message。
- [ ] 我能用 `git log`、`git show`、`git diff` 查看历史和差异。
- [ ] 我能创建和合并分支。
- [ ] 我能解释 fetch、pull、push 的区别。
- [ ] 我能解决简单 merge conflict。
- [ ] 我能区分 restore、revert、reset 的使用场景。
- [ ] 我能用 `.gitignore` 避免提交敏感信息和构建产物。

## 面试题

1. Git 和 GitHub 有什么区别？
2. Git 为什么说自己记录的是快照，而不是只记录文件差异？
3. 工作区、暂存区、本地仓库、远程仓库分别是什么？
4. `git add`、`git commit`、`git push` 分别做什么？
5. `git diff` 和 `git diff --staged` 有什么区别？
6. commit 对象里大概保存哪些信息？
7. 分支的本质是什么？为什么创建分支很快？
8. merge conflict 为什么会发生，怎么解决？
9. fetch、pull、push 有什么区别？
10. revert 和 reset 有什么区别？哪个更适合已经 push 的提交？
11. `.gitignore` 为什么对已跟踪文件不生效？
12. 如何用 Git 提交历史证明自己的 AIOps 学习过程？

## 面试怎么讲

Git 是分布式版本控制系统，核心是用 commit 保存项目快照。日常使用时，我会先在工作区修改文件，再用 `git add` 放入暂存区，用 `git commit` 写入本地仓库，最后用 `git push` 同步到 GitHub。Git 的分支本质上是指向 commit 的可移动指针，所以创建和切换分支很轻量。在 AIOps 学习里，我用 Git 管理文档、配置、脚本、dashboard 和 runbook，让每次实验和复盘都有可追踪记录。

## 学习证据

学完这篇后，建议提交：

- `docs/learning-records/git-first-week.md`
- 至少 5 次清晰 commit。
- 一篇笔记：`Git 工作区、暂存区、本地仓库、远程仓库.md`
- 一篇笔记：`Git restore、revert、reset 的区别.md`
- 一次冲突处理记录：`我如何解决一次 merge conflict.md`
