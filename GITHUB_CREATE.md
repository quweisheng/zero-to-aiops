# 推送到 GitHub 远程仓库

当前机器没有检测到 `gh` 命令，所以这里先给出网页方式。

这个输出目录已经执行过 `git init -b main` 和 `git add .`。由于本机还没有配置 Git 用户名和邮箱，初始提交需要你先设置身份。

## 目标仓库

`quweisheng/zero-to-aiops`

## 网页创建

1. 打开 GitHub，点击 `New repository`。
2. Repository name 填：`zero-to-aiops`。
3. Description 填：`AIOps learning roadmap, projects, interview notes, and Tianjin job-search records.`。
4. 选择 `Public`，先不要勾选自动创建 README。
5. 创建后，在本地执行：

```powershell
git config user.name "你的名字"
git config user.email "你的邮箱"
git commit -m "docs: start AIOps learning knowledge base"
git remote add origin https://github.com/quweisheng/zero-to-aiops.git
git push -u origin main
```

如果你把这些文件复制到了一个全新的空目录，再额外执行：

```powershell
git init -b main
git add .
```

## 可选：启用文档站

如果要发布 VitePress 文档站：

1. 进入 GitHub 仓库的 `Settings`。
2. 打开 `Pages`。
3. Source 选择 `GitHub Actions`。
4. 推送后等待 `Deploy VitePress site` 工作流完成。
