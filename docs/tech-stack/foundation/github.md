# GitHub

> 目标：能把学习记录、项目代码、配置和文档托管到 GitHub，理解 README、Issue、Pull Request、Actions、Pages、Token 的作用。

## 官方资料

- [GitHub Docs](https://docs.github.com/)
- [About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
- [About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [Basic writing and formatting syntax](https://docs.github.com/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [Managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

说明：本文是基于 GitHub 官方文档整理的原创中文教程，不复制官方全文。

## 为什么要学

GitHub 是你转向 AIOps 时最重要的公开作品集。简历上写“学习 Prometheus、Kubernetes、Python”很容易，但 GitHub 能展示真实提交、文档站、配置文件、实验截图、自动化 workflow 和项目演进。

对求职来说，GitHub 可以把你的运维经验转成看得见的工程资产；对学习来说，它能逼迫你把“我看懂了”变成“我写下来了、跑通了、提交了”。

## 是什么

GitHub 是基于 Git 的代码托管和协作平台。对你的 AIOps 学习来说，它既是作品集，也是学习轨迹，也是未来面试时能展示的工程证据。

## 它解决什么问题

- 托管学习笔记、项目代码、配置文件和文档站。
- 通过 README 展示学习路线和项目成果。
- 通过 Issues 管理学习任务。
- 通过 Actions 自动构建和部署。
- 通过 Pages 发布公开知识库。
- 通过 token、权限和仓库设置管理安全访问。

## 核心原理

GitHub 托管远程 Git 仓库。本地修改通过 commit 进入本地仓库，再通过 push 上传到 GitHub。

```text
local files
  -> git add
  -> git commit
  -> git push
  -> GitHub repository
  -> README / docs / Actions / Pages
```

## 核心功能

- Repository：代码和文档仓库。
- README：仓库首页。
- Issues：任务、问题、学习计划。
- Pull Requests：代码/文档变更评审。
- Actions：自动化构建和发布。
- Pages：静态网站托管。
- Releases：版本发布。
- Personal Access Token：HTTPS 命令行认证。

## 仓库结构建议

```text
zero-to-aiops/
  README.md
  docs/
    tech-stack/
    projects/
    learning-records/
    interview/
  .github/
    workflows/
  package.json
```

## README 怎么写

README 至少回答：

1. 这个仓库是什么。
2. 为什么创建它。
3. 学习路线在哪里。
4. 项目在哪里。
5. 如何本地运行文档站。
6. 当前进度是什么。

示例结构：

```md
# zero-to-aiops

## 目标

## 学习路线

## 技术栈

## 实战项目

## 更新记录
```

## Token 登录

GitHub 不支持用账号密码进行 Git HTTPS 推送。需要使用 Personal Access Token。

推荐做法：

1. 创建 fine-grained token。
2. 只选择当前仓库。
3. 权限最小化，例如 Contents: Read and write。
4. 使用 Git Credential Manager 保存。
5. 不把 token 写进 remote URL、不提交到仓库、不发到聊天。

## 常用命令

```bash
git remote -v
git push
git pull
git log --oneline
```

## 在 AIOps 中的作用

- 展示学习记录和项目。
- 保存 Prometheus、Grafana、Kubernetes、Ansible 配置。
- 用 Actions 自动构建文档站。
- 用 Issues 管理学习任务。
- 用提交历史证明持续学习。

## 入门实验

1. 打开 `zero-to-aiops` 仓库。
2. 修改 README，加一个“今日学习”链接。
3. 本地 commit。
4. push 到 GitHub。
5. 在网页上确认文件变化。

## 排障清单

### push 被拒绝

- 是否有权限。
- token 是否过期。
- remote URL 是否正确。
- 本地分支是否落后远程。

### README 图片不显示

- 路径是否正确。
- 大小写是否一致。
- 图片是否已提交。

### Actions 没运行

- workflow 是否在 `.github/workflows/`。
- 默认分支是否匹配。
- YAML 是否语法正确。

## 学习检查清单

- [ ] 我能解释 GitHub 和 Git 的关系。
- [ ] 我能创建仓库并写清楚 README。
- [ ] 我能把本地提交推送到 GitHub。
- [ ] 我能解释 Issue、Pull Request、Actions、Pages 的作用。
- [ ] 我能创建和使用 Personal Access Token。
- [ ] 我知道 token 不能提交到仓库。
- [ ] 我能用 GitHub Pages 发布 VitePress 文档站。
- [ ] 我能把学习路线、技术栈和项目入口放在 README。

## 面试题

1. GitHub 在你的 AIOps 学习路径中承担什么角色？
2. README 应该包含哪些信息？
3. Issue 和 Pull Request 分别适合做什么？
4. GitHub Actions 可以帮学习仓库做哪些自动化？
5. GitHub Pages 的发布源有哪些常见方式？
6. Personal Access Token 为什么要最小权限？
7. token 泄露后应该怎么处理？
8. 如何通过 GitHub 仓库证明自己有持续学习能力？
9. 如何组织一个适合面试展示的 AIOps 仓库？
10. 为什么配置文件和实验记录也应该纳入版本控制？

## 学习证据

- GitHub 仓库首页可读。
- 至少 10 次有意义提交。
- README 链接到技术栈、项目和学习记录。
