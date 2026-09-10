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
Getting Started（安装与初次使用）
  -> Git 是什么，如何安装和配置
Git Basics（基本操作）
  -> 仓库、文件状态、暂存、提交、历史、撤销、远程
Git Branching（分支与合并）
  -> 分支、合并、冲突、分支工作流
Git on the Server / GitHub（服务端托管与协作平台）
  -> 远程协作和托管
Git Tools（进阶工具）
  -> stash、tag、rebase、reset、高级查看
Git Internals（内部实现）
  -> 对象、引用、packfile、refspec
Reference（命令参考）
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
Working Tree（工作区，当前编辑的文件）
  -> 你当前看得见、正在编辑的文件

Index / Staging Area（索引或暂存区，准备提交的内容）
  -> 准备放进下一次 commit 的内容

HEAD / Local Repository（当前检出指针与本地提交仓库）
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
commit（提交对象）
  -> tree（目录树对象）
       -> README.md blob（文件内容对象）
       -> docs/ tree（目录树对象）
            -> linux.md blob（文件内容对象）
  -> parent commit（父提交）
  -> author（作者）
  -> message（提交说明）
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
git show '<commit>'
```

本节及后面的 `revert` 示例中，把整个 `<commit>` 换成自己核对过的提交哈希或引用，保留单引号，不把尖括号原样交给 Shell。

看某个文件历史：

```bash
git log -- docs/tech-stack/foundation/git.md
```

看某次提交改了什么：

```bash
git show --stat '<commit>'
git show '<commit>'
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
main（主分支） -> C3

C1 -> C2 -> C3（提交版本从一到三的演进顺序）
```

创建分支：

```bash
git switch -c docs/git-deep-dive
```

现在：

```text
main（主分支）              -> C3
docs/git-deep-dive -> C3（文档分支指向提交三）
HEAD（当前检出指针） -> docs/git-deep-dive
```

你继续 commit 后：

```text
main（主分支）              -> C3
docs/git-deep-dive -> C4（文档分支指向提交四）
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
main -> C3（主分支指向提交三）
feature -> C4（功能分支指向提交四）

merge 后：
main -> C4（主分支快进到提交四）
```

### 三方合并

如果两个分支都各自有新提交，Git 会找共同祖先，做三方合并。

```text
      C4 feature（功能分支）
     /
C1-C2-C3（共同祖先）
     \
      C5 main（主分支）
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

含义：这条不带来源参数的命令默认用暂存区内容恢复工作区文件；加 `--source=HEAD` 才是明确取当前提交。恢复会覆盖该文件未暂存的修改，先查看差异。

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
git revert '<commit>'
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
| `--mixed` | 是 | 重置到目标提交 | 保留 |
| `--hard` | 是 | 重置到目标提交 | 重置到目标提交，可能丢失改动 |

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
  -> git status（查看工作区与暂存状态）
  -> git diff（查看未暂存差异）
  -> git add 相关文件
  -> git diff --staged（查看已暂存差异）
  -> git commit -m "docs: ..."（把暂存内容记录成提交并填写说明）
  -> git push（向远端推送提交）
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

## 老师带你看清“保存了”到底保存在哪

学生问：“我明明 `git add` 过了，为什么提交里还是旧内容？”我们慢慢复原动作：你把告警阈值从 5 改成 10，执行了 add，然后又把 10 改成 15。暂存区记住的是执行 add 时的 10，工作区现在是 15。`git commit` 取暂存区，所以提交得到 10。这不是 Git 丢数据，而是你在两个时间点保存了两种状态。

你可以把工作区理解成书桌，暂存区理解成已经装好的这一包文件，提交理解成给这一包盖了编号章。书桌上再改纸张，不会偷偷改掉包里那份。这个类比有一个边界：暂存区本质是路径到文件状态的索引，不是真正复制出一个可见文件夹。

用三条命令验证这个认识：`git diff` 比较工作区与暂存区，`git diff --cached` 比较暂存区与 HEAD，`git show HEAD:文件路径` 查看提交中的文件。`HEAD` 通常指向当前分支最近的提交；`origin/main` 是本地最近一次观察到的远端 main，并不是随时与互联网同步的指针。

因此“本地干净”“推送成功”“流水线成功”“线上更新”是四个独立事实。第一个说工作区与提交一致，第二个说远端接收引用更新，第三个说自动检查通过，第四个才说实际用户拿到新版本。做 AIOps 变更关联时，要保存这几个状态的证据，不能用一张绿色提交图代替发布验收。

### 对象不变，引用移动：分支和变基为什么表现不同

Blob 保存文件内容，tree（目录树对象）关联名称与内容，commit（提交对象）关联目录树、父提交与作者说明。对象由内容寻址，通常通过对象 ID 标识；具体仓库使用的哈希格式以仓库配置为准，不必把“永远 40 位”当定义。

分支是一个指向提交的可移动引用。创建分支通常只增加引用，所以很快；切换分支时还要更新工作区，文件很多时并不保证瞬间完成。提交本身不是原地修改的：amend（修订）或 rebase（变基）会产生新对象，指针再移过去。

Merge（合并）保留不同开发路径并组合结果，rebase 把一组修改重新应用到新基底，得到新的提交链。选择线性历史，是阅读便利与历史改写风险之间的取舍。已经有人基于你的旧提交继续工作时，改写公共历史会让协作复杂；不能因为“图看起来更直”就忽略他人的分支。

故障恢复也按对象与引用分开。误移动分支时，`git reflog` 可以查本机引用曾经指向哪里，再给仍存在的提交建立保护分支。它不是无限期备份：过期清理、对象回收和未被记录的内容都有边界。重要仓库还需要远端和备份策略。

## 基础与故障实验：离线练会暂存，再解决合并冲突

前提是 Git 已安装，下面在 Git Bash 或 Linux Bash 中运行。用一个全新的临时目录，不在正在工作的项目里练习。所有操作仅修改这个实验仓库，无须 GitHub 账号。

```bash
lab_dir=$(mktemp -d -t git-classroom-XXXXXX)
cd "$lab_dir"
git init -b main
git config user.name "AIOps Student"
git config user.email "student@example.invalid"
printf 'threshold=5\n' > rule.txt
git add rule.txt
git commit -m "lab: save initial alert threshold"
printf 'threshold=10\n' > rule.txt
git add rule.txt
printf 'threshold=15\n' > rule.txt
git diff --cached # 预期看到 5 改为 10
git diff          # 预期看到 10 改为 15
git commit -m "lab: commit staged threshold"
git show HEAD:rule.txt # 预期 threshold=10
cat rule.txt          # 预期 threshold=15
```

这里 `git config` 没有 `--global`，只设置实验仓库作者。`printf` 明确写出换行，避免编辑器自动格式干扰观察。如果提交没有出现，先看作者配置和是否真的有暂存内容；如果 `git diff` 没输出，核对你是否已经再次 add。基础实验的验收是你能解释“提交为 10，桌面文件为 15”同时成立。

现在先把 15 保存为提交，再制造一个可回收冲突。

```bash
git add rule.txt
git commit -m "lab: save working threshold"
git switch -c lab/a
printf 'threshold=20\n' > rule.txt
git add rule.txt
git commit -m "lab: choose threshold twenty"
git switch main
git switch -c lab/b
printf 'threshold=30\n' > rule.txt
git add rule.txt
git commit -m "lab: choose threshold thirty"
git merge lab/a # 预期冲突，这是本实验主动制造的失败
git status --short
```

`UU rule.txt` 表示双方都修改且尚未解决。现在用编辑器打开文件，观察当前分支和被合并分支的两种内容。不要机械“全部保留”，阈值同时存在两次可能仍是错误配置。假设经过讨论选 25，将文件完整改成一行 `threshold=25`，保存后执行：

```bash
git add rule.txt
git commit -m "lab: resolve threshold conflict with agreed value"
git log --oneline --graph --all
git show HEAD:rule.txt
git status --short
```

验收是提交内容为 25、工作区干净、历史中有两条开发路径和合并节点。若决定不合并，可在完成提交前使用 `git merge --abort`，回到合并前状态；这不是删除他人的分支。如果冲突没有出现，检查两个分支是否确实从同一基底修改同一行。

清理不需要危险命令：先把 `lab_dir` 的实际绝对路径和学习记录保存下来，退出目录，在文件管理器中确认该临时目录只包含实验文件后移到回收站。这个实验未创建远端资源，也未修改全局 Git 配置。

## 生产课堂：变更可信、协作一致和故障可恢复

一次 Git push 上传必要对象并请求远端更新引用。远端可以因权限、分支保护或非快进更新而拒绝。拒绝不等于你的提交消失；先 `git fetch` 更新观察，再用 `git log --left-right --graph HEAD...origin/main` 理解双方差异。不要把强制推送当成“网络重试”。

Git 本身是分布式工具，GitHub/GitLab 的账户、评审、流水线、制品和问题单并不都包含在普通 clone 内。完整灾备应分别考虑源码历史、托管平台数据、LFS 大文件和子模块依赖。浅克隆仅保留一段历史，适合部分 CI 加速场景，却可能影响历史分析、版本计算和某些合并操作。

仓库慢时先确认瓶颈：网络慢看 fetch 时长和远端；工作区操作慢看文件数量和磁盘；历史过大看大二进制与长期生成物。Git LFS（大文件存储扩展）让 Git 保存指针、大文件另存，但它引入独立存储和下载权限，指针在不等于内容在。容量治理要在文件进入历史前处理，事后删掉当前文件不会自动删除历史中的大对象。

安全上，作者邮箱只是提交元数据，不是登录认证。签名用于验证签署身份和内容关联，仍不替代评审与测试。密钥泄露首先撤销密钥，再协调清理历史和缓存；仅新增一个“删除密码”的提交无法让旧提交中的密码失效。`.gitignore` 也不会自动取消已跟踪内容。

升级 Git 或修改换行策略前，记录版本、配置来源和平台差异。在 Windows/Linux 混合团队中用 `.gitattributes` 明确文本换行和二进制类型；先验证小范围 diff，避免把整仓换行变化和业务变更混在一起。回滚业务优先考虑新建反向提交；若涉及数据库或外部状态，Git 回滚代码不代表业务数据自动回到旧状态。

## 面试课堂：30 秒、3 分钟和事故推理

**30 秒回答。** Git 用不可变对象保存项目快照，用引用表示分支和当前位置。工作区、暂存区与提交承担编辑、选择和记录三个阶段。远端同步、评审、测试及上线验证建立在这些记录之上，不能互相替代。

**3 分钟回答。** 先画工作区到 index（暂存索引）到 commit 的路径，再讲 blob、tree、commit 与分支引用；用 add 后再修改的实验解释暂存区为何有价值。接着比较 merge 保留开发路径与 rebase 重写提交链，解释公共历史改写的协作成本。最后讲告警规则误发布时如何定位提交、比较差异、创建反向修复、重新测试并确认实际加载版本；将测试日志和发布记录关联到同一 SHA。

1. **分支为什么轻量，切换为什么仍可能慢？** 创建引用很轻，切换可能需要写大量工作区文件；区分数据模型与实际 IO。
2. **本地落后于远端，为什么不能直接覆盖？** 远端可能含别人提交，先获取并比较双方历史，合并或按团队约定变基，再正常推送。
3. **合并无冲突是否证明正确？** 不证明。Git 判断的是文本可组合性，两个文件分别修改仍可能产生业务不兼容，必须运行相关测试。
4. **设计多人维护的告警库？** 小提交、分支保护、双人评审、语法与规则测试、不可变产物、部署 SHA 回报和快速反向提交，另设紧急修复通道及事后复盘。
5. **事故：页面更新了但规则未生效？** 核对文档提交、构建产物、规则部署与服务加载版本；Git 只证明源码状态，实际加载需查询服务或配置摘要，不能先怪浏览器缓存。

## 协作进阶课堂：提交关系比命令名称更重要

### fetch、pull 与 push 分别改变哪一本账

老师先让你在纸上写出三个名字：本地 `main`、本地的远端跟踪引用 `origin/main`、服务器上的 `main`。它们不是同一个指针。`origin/main` 是你上次获取后对远端分支的本地观察，远端有人刚推了新提交，你这里的观察可以暂时落后。

`git fetch` 获取对象并更新相应远端跟踪引用，通常不把这些内容直接合入当前工作区。`git pull` 在获取后还会按配置执行整合，可能是合并或变基；所以排查协作差异时，先 fetch 再读图更容易看清即将发生什么。`git push` 则请求远端更新引用，远端权限和历史检查可以拒绝，即使你在本地拥有管理员权限也无关。

学生问：“终端说 ahead 2，我的网站是不是已经更新两次？”不是。它通常表示当前本地分支相对其跟踪分支领先两个提交；如果跟踪引用很久没刷新，连这个比较也不是远端实时状态。发布是否成功必须继续核对远端 SHA、流水线与实际页面。Git 的比较结果要先说明比较对象，才有正确含义。

### 快进、合并提交与变基怎样影响审查

Fast-forward（快进）表示旧分支位置本来就是新位置的祖先，只需向前移动引用。真正分叉后，合并可以建立一个含多个父提交的新提交，记录两条历史如何汇合；rebase 则把一串修改重新应用到新基底上，产生新的提交身份。内容看起来相似，不代表提交 ID 相同。

选择哪种方式要看团队协作约定。保留合并关系便于理解分支整合，线性历史便于某些追踪与阅读，但变基已被别人使用的公共提交会制造协调成本。不要为了“图更漂亮”未经沟通重写公共历史。发生冲突时，两种操作也有不同的继续和退出路径，先确认当前是 merge 还是 rebase，再读取 Git 状态提示。

合并无文本冲突不等于业务正确。例如一位同学把函数返回单位从秒改成毫秒，另一位同学在不同文件中仍按秒计算；Git 可以顺利合并，却产生真实故障。审查要看跨文件契约，测试要覆盖单位与边界，不能让“自动合并成功”替代语义验证。

### 三种撤销操作为什么不能混着背

`restore` 主要用于恢复文件内容，作用于工作区或按参数作用于暂存区；`reset` 可以改变引用或索引等状态，不同模式影响范围很不一样；`revert` 通常以新提交记录某次提交的反向修改。初学者最安全的起点是先明确自己要改“文件、暂存选择还是提交历史”，再决定工具，而不是先找一个叫撤销的命令。

公共分支上的错误通常适合用新的修复或反向提交保留审计，但 revert 也可能冲突，尤其后续代码已依赖原改动时。合并提交的反向操作还涉及选择主线父提交，不能照搬普通提交命令。数据库迁移、已发布制品、外部 API 调用都不由 Git 自动撤销，代码恢复只是整个回滚的一部分。

任何会丢弃未提交修改的操作前，都应查看 `git status` 和相应 diff，确认是否有别人或自己尚未保存的工作。暂存区不是自动备份，编辑器保存也不等于形成提交。需要临时切换任务时可以选择小提交、明确的工作区安排或审慎使用 stash，但不要在没有核对内容时把全部工作统一清空。

### reflog 是本地救援线索，不是永久保险

Reflog（引用日志）记录本地引用移动线索，可以帮助找到误移动前的提交；普通 `git log` 主要沿当前可达历史展示，二者回答不同问题。一个提交暂时不在当前分支上，不代表它立即从对象库物理消失。但日志保留和对象回收有边界，不应承诺任意时间都能救回。

救援时先只读查看日志，找到目标提交后用 `git show` 核对内容和父关系，确认是需要的状态，再考虑建立新的保留引用。不要凭一个看似相近的时间戳直接覆盖当前分支。未提交且被覆盖的文件、没有上传的大文件内容和外部构建产物，不一定能由 reflog 恢复。

Stash 也不是跨机器共享存储。它可保存特定工作状态，但未跟踪文件是否纳入取决于使用方式，忽略文件也有独立边界。恢复时可能发生冲突；完成任务后要检查实际文件，而不是只看“应用成功”提示。对于长期学习证据，清晰提交和远端备份比无限积累匿名 stash 更容易管理。

### 二分定位的关键是判定规则可靠

`git bisect` 根据好坏判定缩小引入问题的提交范围，适合有可重复判断的问题。它不是自动理解故障根因的模型：若测试时好时坏，或者测试依赖已经变化的外部服务，二分结果也会被污染。开始前记录已知好坏版本，准备能区分通过、失败和无法测试的命令，并保留当前工作。

例如文档搜索在某版本开始漏掉一个标题，判定条件可以是生成索引后确实存在该标题，而不是“页面看起来差不多”。每次构建应使用对应提交的依赖锁文件与配置。找到首个坏提交后，还要阅读改动并验证修复假设；最早与现象相关的提交是重要线索，不自动等于唯一根因。

### 换行、大小写与文件权限为什么属于跨平台契约

Windows 和 Linux 对路径大小写、执行位与换行的处理不同。一个链接在本地大小写不敏感的文件系统上可用，在 Linux 构建环境却可能失效；一个 Bash 脚本含错误行尾，可能解释异常；执行位遗漏又会影响直接运行。把这些差异写入仓库约定，利用属性文件和 CI 验证，比事故时责怪某个操作系统更有用。

检查巨大 diff 时先区分内容变化与全文件行尾变化。不要把格式转换和业务修改混成一次提交，否则评审者很难看到真正风险。`git diff --check` 能发现部分空白问题，但不能证明链接、脚本或配置语义正确，仍需相应检查工具。

### 面试最后一问：一次可靠提交应该有多大

答案不是固定行数，而是能独立说明意图、验证和回滚边界。一个提交只改一个错别字很小；一个完整的接口迁移可能必须包含调用方与测试，拆得过碎反而让中间状态不可用。把互不相关的格式修改、依赖升级和业务修复分开，让审查能聚焦。

在 AIOps 项目里，把规则、样本、测试和说明关联到同一提交；发布事件记录 SHA，事故复盘再链接实际差异。这样 Git 不只是“保存文件”，而成为变更因果链的一部分。向面试官展示时，坦诚哪些实验已运行、哪些只有设计，清楚解释一次失败如何被定位，比展示很多没有意义的提交数量更重要。

## 深入练判断：同一条历史，为什么能得出两种差异

### 两点与三点：先问比较内容还是比较提交集合

老师画两条从共同祖先分开的线：主分支修了告警说明，功能分支改了阈值。学生问：“我要审查功能分支，直接比较两个最新文件不就行了吗？”这要看问题。比较两个端点快照，会同时看到主分支独有变化和功能分支独有变化；审查功能分支相对分叉点新增的内容，则应该从共同祖先开始看。两者不是谁更准确，而是回答了不同问题。

对 `git diff main..feature` 来说，两点写法与直接指定两个端点等价，比较主分支当前快照和功能分支当前快照。`git diff main...feature` 则从双方共同祖先比较到右侧分支，适合阅读右侧分支带来的修改。若交换左右，三点结果通常也会改变。不要只记“多一个点更全面”，它其实改变了比较起点。

提交集合又是另一回事：`git log main..feature` 找功能分支可达、但主分支不可达的提交；`git log main...feature` 查两侧独有提交，即对称差。这里的“可达”指沿父提交链能走到，而不是按提交时间晚于某一天。提交被拣选或变基后，内容相似也可能有不同身份，因此“还有三个提交没合并”不能自动推断“还有三项业务功能没上线”。具体语义见 [Git 差异参考](https://git-scm.com/docs/git-diff) 与 [提交遍历参考](https://git-scm.com/docs/git-rev-list)。

生产中把比较口径写进评审描述：基底提交是什么、目标提交是什么、是否包含主分支后来变化。故障关联也要记录部署实际使用的提交编号，而不是只保存一个持续移动的分支名。否则今天重开同一条比较链接，看到的内容可能已不是事故时的内容。你能稳定复原当时的两个快照，才算有可复查的变更证据。

### 冲突期间，暂存区不是只有一个待提交版本

正常暂存条目记录准备提交的文件状态；合并冲突时，索引可以暂时保存共同祖先、当前一侧和合入一侧的条目。这就是为什么冲突不能靠“再保存一下文件”结束：工作区文字修好了，还需要明确告诉 Git 该路径已经形成最终版本。前面的冲突实验中，执行 add 就承担这个角色。

在那个实验出现冲突之后、解决之前，可以只读执行 `git ls-files -u -- rule.txt`。其中 `-u` 表示查看未合并条目，输出中的阶段编号帮助区分三种来源；普通的双方改同一行冲突通常能看到编号一、二、三。它们依次对应共同祖先、当前一侧和另一侧。删改冲突等情形不保证三个条目全部存在，不能因缺一行就判断仓库损坏。

观察方法是先预测祖先阈值应是多少，再分别核对两侧内容，最后解释为什么业务选择二十五而不是机械保留二十或三十。故障排查先确认冲突类型和当前操作，再决定处理。尤其在变基过程中，界面所说“我们的”和“他们的”可能与日常分支直觉不同；应核对实际内容，不能把某个按钮长期等同于“保留我写的”。这项只读观察不增加清理步骤，仍按原实验回收临时目录。

### 多工作区解决上下文切换，但没有隔离全部状态

运维同学正在一个分支修改大段文档，紧急修复又需要检出线上版本。额外工作区能在另一目录检出另一分支，避免把桌面上未完成的编辑搬来搬去。它不是另一次完整克隆：多个工作区共享主要对象数据库和许多仓库引用，每个工作区拥有自己的检出状态和暂存区。理解共享与独立边界，才能知道哪些动作会影响另一份目录。

用 `git worktree list` 可以只读列出工作区路径、检出提交和分支。先核对目录归属，再做添加或移除操作。Git 默认限制同一分支同时检出到多个工作区，正是为了减少分支位置被一边提交改变、另一边却仍按旧状态编辑的混乱。不要为了跳过提示随意使用强制参数；本节只是讲选择依据，不要求你在当前知识库创建额外工作区。细节见 [工作区参考](https://git-scm.com/docs/git-worktree)。

多工作区也不替你隔离运行环境。两个目录如果都使用同一数据库、同一个监听端口或同一云账号，测试照样互相干扰。对自动化项目，隔离还应包括输出目录、环境变量、测试数据和部署目标。退出临时修复时，先确认修改已保留且不再运行进程，再按工具管理方式移除工作区；直接搬走目录可能留下需要清理的管理记录。

### 源码灾备要证明能恢复，而不是证明备份文件存在

设想托管平台暂时无法访问，但你手里有本地仓库。通常还能阅读已下载的历史并继续本地提交；尚未获取的远端提交、平台评审记录和独立大文件内容不会凭空出现。分布式历史降低单点依赖，并不让所有协作资产自动具有同样的恢复能力。高可用解决的是持续提供服务，备份解决的是从误删、损坏或安全事故中恢复，两者不能互相冒充。

Git 的 bundle（仓库对象与引用打包文件）可以用于离线传递历史，但必须区分完整包与增量包。增量包可能要求接收方已具备前置提交；一个验证通过的包也只证明其满足相应对象与前提检查，不代表工作区未提交文件、托管平台设置和外部大文件都包含在内。使用前先列出所需引用和对象边界，恢复后再对照目标提交核验。相关操作定义见 [离线包参考](https://git-scm.com/docs/git-bundle)。

生产演练可以设计为：从经过批准的备份在隔离位置恢复，检查预期分支和标签，核对一个已知版本的文件摘要，再尝试不访问生产系统的构建。记录备份结束时间与最后覆盖提交，才能计算数据丢失窗口；记录恢复、依赖获取、验证各阶段耗时，才能估计恢复时间。某仓库能打开而依赖已失效，仍不足以支持业务恢复。

### 再追问：配置回退为什么可能扩大事故

假设一次提交同时调整采样率和告警阈值。故障后直接反向整个提交，可能把已经验证有效的采样保护也撤掉，进一步增加遥测流量。正确判断应先区分两个改动的因果关系：告警失真来自阈值口径，还是采样后统计方式变了？观察实际加载配置、消息量和告警计算结果，找出最小修复面，而不是把最近提交当作天然罪魁。

面试追问到这里，三分钟回答应补上变更前后的观测窗口、配置传播时间和撤销条件。源码层面可以精准反向一个修改，运行层面仍需验证所有实例是否加载一致，以及旧版本是否兼容新产生的数据。Git 给你可追踪的意图与快照，可靠运维还要把它们连接到实际生效状态。独立作业是写一份“错误阈值已修复，但流量仍异常”的证据清单，明确哪些证据来自仓库，哪些必须来自监控。

## GitHub 学习证据整理

学完这篇后，建议提交：

- `docs/learning-records/git-first-week.md`
- 至少 5 次清晰 commit。
- 一篇笔记：`Git 工作区、暂存区、本地仓库、远程仓库.md`
- 一篇笔记：`Git restore、revert、reset 的区别.md`
- 一次冲突处理记录：`我如何解决一次 merge conflict.md`
