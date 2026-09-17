# 将课程发布到 GitHub Pages

这个目录已经包含一个静态 HTML 网站和一个 GitHub Actions 自动部署流程。

发布后访问地址通常是：

```text
https://<你的GitHub用户名>.github.io/<仓库名>/
```

## 一、需要准备什么

- 一个 GitHub 账号。
- 一个公开仓库，例如 `apollo-planning-course`。
- 本机已登录 GitHub，或能通过 Git Credential Manager 完成登录。
- Git 用户信息。

推荐使用公开仓库，因为 GitHub Pages 的免费使用方式最直接。

## 二、推荐方式：GitHub Actions 自动部署

当前已经准备好：

```text
.github/workflows/pages.yml
site/.nojekyll
```

工作流会自动把 `site/` 目录发布到 GitHub Pages。

### 1. 在 GitHub 创建仓库

新建一个空仓库，例如：

```text
apollo-planning-course
```

不要勾选自动生成 README、`.gitignore` 或 License，避免第一次推送冲突。

### 2. 在本地初始化 Git

进入课程目录：

```powershell
Set-Location 'C:\Users\FQX\Documents\ChatGPT\New project\apollo-planning-course'
```

设置 Git 信息：

```powershell
git config user.name "你的GitHub用户名"
git config user.email "你的GitHub邮箱"
```

初始化并提交：

```powershell
git init
git add .
git commit -m "Add Apollo Planning self-study website"
git branch -M main
```

### 3. 绑定远程仓库

把下面的地址换成你的仓库地址：

```powershell
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

第一次推送时，Git Credential Manager 会打开 GitHub 登录页面。

### 4. 开启 GitHub Pages

进入 GitHub 仓库：

```text
Settings -> Pages -> Build and deployment
```

Source 选择：

```text
GitHub Actions
```

不需要选择 `Deploy from a branch`。保存后，每次推送 `main` 分支都会自动重新发布。

### 5. 查看网站

进入仓库的 Actions 页面，等待 `Deploy Apollo Planning Course to GitHub Pages` 完成。

然后在 Settings -> Pages 中查看：

```text
Visit site
```

地址通常是：

```text
https://<用户名>.github.io/<仓库名>/
```

## 三、备用方式：从 docs 分支或目录发布

如果不想使用 GitHub Actions，也可以把 `site/` 中的内容复制到仓库的：

```text
docs/
```

然后进入：

```text
Settings -> Pages -> Build and deployment
Source: Deploy from a branch
Branch: main
Folder: /docs
```

这种方式更简单，但每次更新 HTML 后需要手动同步 `site/` 到 `docs/`。

## 四、课程内容更新流程

修改 Markdown 或工具后，在本地重新生成站点：

```powershell
& 'C:\Users\FQX\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\build-site.mjs
```

浏览器检查：

```powershell
& 'C:\Users\FQX\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tools\test-site.cjs
```

提交并推送：

```powershell
git add .
git commit -m "Update course content"
git push
```

GitHub Actions 会自动重新部署。

## 五、需要我直接帮你推送时需要什么

需要你提供：

1. GitHub 仓库地址，例如：

```text
https://github.com/your-name/apollo-planning-course
```

2. 你的 Git 用户名和邮箱。
3. 是否允许我把当前目录初始化成独立 Git 仓库。
4. 你完成 GitHub 登录授权，或者自行执行最后一次 `git push`。

不要把个人访问令牌直接发在聊天中。推荐使用 Git Credential Manager 浏览器登录。

## 六、自定义域名

如果以后要使用自己的域名：

1. 在域名 DNS 中配置 GitHub Pages 要求的记录。
2. 在仓库 Settings -> Pages 中填写 Custom domain。
3. 在 `site/` 根目录创建 `CNAME` 文件，内容为域名，例如：

```text
course.example.com
```

4. 重新运行部署流程。