# 第 00 课：Linux 与 Apollo 仿真环境安装

> 本课是全部后续课程的前提。目标不是马上读代码，而是先让 Apollo 仿真真正运行起来。

## 1. 学习信息

- 预计用时：半天到 2 天，取决于网络和 Linux 环境。
- 难度：入门。
- 前置知识：能在 Windows 中安装软件，会使用浏览器。
- 学完成果：能启动 DreamView，并在浏览器中打开 `http://localhost:8888/`。
- 安装依据：Apollo EDU版本 PnC 工程安装指南，文章 ID 1239。

原文章：

https://apollo.baidu.com/community/article/1239

## 2. 先理解：为什么不是直接装 Windows 软件

Apollo 的开发、编译和仿真环境运行在 Linux 上。

推荐链路：

```text
Windows 电脑
  -> Ubuntu 虚拟机 / Ubuntu 双系统 / WSL2
  -> Docker
  -> AEM 环境管理工具
  -> application-pnc 工作空间
  -> DreamView 浏览器界面
```

各层的作用：

| 层 | 作用 |
| --- | --- |
| Ubuntu | 提供 Apollo 和 Docker 所需的 Linux 环境 |
| Docker | 提供隔离的 Apollo 运行环境 |
| AEM | 管理 Apollo Docker 环境和工程启动 |
| application-pnc | 初学者和比赛用的 PnC 示例工作空间 |
| buildtool | 获取依赖、安装代码包和编译模块 |
| DreamView | 在浏览器中观察仿真和 Planning 结果 |

## 3. 选择 Linux 环境

### 方案 A：Ubuntu 虚拟机

推荐给第一次接触 Linux 的学习者。

优点：

- 不修改 Windows 分区。
- 出错可以删除虚拟机重装。
- 适合先跑通环境。

最低建议：

```text
4 核 CPU
16 GB 内存
55 GB 以上虚拟磁盘
```

如果电脑只有 16 GB 内存：

- 不要在虚拟机中还同时运行大型游戏或大模型。
- 虚拟机建议分配 8 GB 左右内存。
- 编译可能较慢，但可以完成基础学习。

### 方案 B：Ubuntu 双系统

适合电脑性能较强、愿意折腾的学习者。

优点：

- 性能最好。
- 可以使用更多内存和磁盘。

风险：

- 分区操作错误可能影响原系统。
- 安装前必须备份数据。
- 不熟悉磁盘分区时，不建议第一次就选择双系统。

### 方案 C：WSL2

适合已经熟悉 Windows、Docker 和命令行的学习者。

优点：

- 启动方便。
- 与 Windows 文件系统整合较好。

需要单独验证：

- Docker daemon 是否能正常运行。
- Linux GUI 是否能显示。
- DreamView 的 `localhost:8888` 是否能访问。
- AEM 和 Docker 是否兼容当前 WSL 发行版。
- 编译速度和内存是否足够。

注意：Apollo EDU 安装指南主要按 Ubuntu 主机环境描述。WSL2 不是文章明确验证的唯一路径。如果 WSL2 在 Docker、AEM、GUI 或端口访问上持续失败，应改用 Ubuntu 虚拟机。

## 4. 推荐系统版本

根据安装指南：

- Ubuntu 18.04、20.04、22.04。
- 不推荐 Ubuntu 24.04。
- Docker 19.03+。
- 不要求 GPU。

第一次安装建议使用 Ubuntu 22.04 或 20.04 虚拟机。

## 5. 阶段一：安装 Ubuntu 并更新系统

安装 Ubuntu 后，打开终端执行：

```bash
sudo apt-get update
sudo apt-get upgrade
```

预期结果：

- 软件源更新成功。
- 系统包更新完成。
- 没有明显的网络中断。

记录：

```text
Ubuntu 版本：
CPU 核心数：
内存：
可用磁盘空间：
```

## 6. 阶段二：安装 Docker Engine

Apollo 依赖 Docker。

### 方法一：官方 Docker 安装方式

参考 Docker 官方 Ubuntu 安装文档。

### 方法二：Apollo 提供的安装脚本

```bash
wget http://apollo-pkg-beta.bj.bcebos.com/docker_install.sh
bash docker_install.sh
```

如果下载失败或速度很慢：

```bash
sudo rm -f /etc/apt/sources.list.d/docker.list
wget http://apollo-pkg-beta.bj.bcebos.com/docker_install.sh
wget http://apollo-pkg-beta.bj.bcebos.com/get_docker.sh
bash get_docker.sh --mirror Aliyun
bash docker_install.sh
```

脚本可能根据提示需要重复执行。按照终端提示处理，不要跳过错误。

### Docker 检查

```bash
docker --version
```

预期结果：

```text
Docker version 19.03 或更高版本
```

如果 Docker 服务没有运行：

```bash
sudo systemctl status docker
```

WSL2 环境如果没有 `systemctl`，请先确认 Docker Desktop 的 WSL 集成或使用发行版支持的 Docker 启动方式。

## 7. 阶段三：安装 AEM 环境管理工具

### 7.1 添加 Apollo gpg key

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://apollo-pkg-beta.cdn.bcebos.com/neo/beta/key/deb.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/apolloauto.gpg
sudo chmod a+r /etc/apt/keyrings/apolloauto.gpg
```

### 7.2 设置 Apollo 软件源

```bash
echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/apolloauto.gpg] https://apollo-pkg-beta.cdn.bcebos.com/apollo/core" \
    $(. /etc/os-release && echo "$VERSION_CODENAME") "main" | \
    sudo tee /etc/apt/sources.list.d/apolloauto.list

sudo apt-get update
```

### 7.3 安装 AEM

```bash
sudo apt install apollo-neo-env-manager-dev --reinstall
```

检查：

```bash
aem -h
```

预期结果：

- 能看到 AEM 帮助信息。
- 命令没有提示 `not found`。

如果以前安装过旧 Apollo：
- 先检查 `/etc/apt/sources.list` 中是否残留旧版 Apollo 源。
- 不确定时不要直接删除系统文件。
- 先备份并记录配置，再按新版安装指南处理。

## 8. 阶段四：下载 PnC 学习工程

### 8.1 从 GitHub 下载

```bash
git clone https://github.com/ApolloAuto/application-pnc.git
```

如果 GitHub 访问困难，可以使用文章提供的 Gitee 地址：

```bash
git clone https://gitee.com/ApolloAuto/application-pnc
```

### 8.2 进入工程并初始化

```bash
cd application-pnc
bash setup.sh
```

### 8.3 检查工作空间

```bash
cat .workspace.json
```

记录输出内容。它用于确认当前工程和工作空间配置是否正确。

目录初步理解：

```text
application-pnc/
  core/         系统依赖和 cyberfile.xml
  modules/      PnC 相关代码包
  WORKSPACE     Bazel 工作空间配置
```

`application-pnc` 是初学者和比赛工程，不等同于完整的官方 `ApolloAuto/apollo` 主仓库。

## 9. 阶段五：进入 Docker 环境

启动 CPU 模式容器：

```bash
aem start --cpu
```

再次检查工作空间：

```bash
cat .workspace.json
```

检查 buildtool：

```bash
buildtool -v
```

预期结果：

- 已经进入 Apollo 工作环境。
- `buildtool` 能正常输出版本。

如果 `aem start --cpu` 失败：

1. 检查 Docker 是否启动。
2. 检查终端是否在 `application-pnc` 目录。
3. 检查当前用户是否有 Docker 权限。
4. 检查磁盘空间是否不足。
5. 记录完整错误，不要只记录“失败了”。

## 10. 阶段六：下载和构建核心依赖

当网络不稳定时，安装指南提供了编译缓存。

### 10.1 下载缓存

```bash
wget https://apollo-system.bj.bcebos.com/bazel_deps/cache.tar.gz
tar -zxvf cache.tar.gz
```

### 10.2 下载依赖并构建 core

```bash
buildtool build -p core
```

这条命令会读取 `core` 目录下 `cyberfile.xml` 描述的依赖包。

预期结果：

- 依赖下载完成。
- 核心包构建成功。
- 终端没有未解决的错误。

如果失败：

1. 重新执行 `buildtool build -p core`。
2. 检查网络。
3. 检查依赖缓存是否解压到正确位置。
4. 记录第一个真正的错误行，不只看最后一行。

## 11. 阶段七：启动 DreamView

启动：

```bash
aem bootstrap start --plus
```

然后在 Ubuntu 浏览器访问：

```text
http://localhost:8888/
```

预期结果：

- DreamView 页面可以打开。
- 可以选择场景并启动仿真。

如果出现 `permission denied`：

- 找出错误前明确写出的路径。
- 只对那个路径修改所有者。
- 不要对 `/` 或整个 `/opt` 做递归 `chown`。

示例形式：

```bash
sudo chown 用户名:用户名 -R /明确的/错误路径
```

如果启动较慢：

- 等待几十秒。
- 再次执行 `aem bootstrap start --plus`。
- 检查后台服务是否启动。

如果 Scenari_Sim 没有选项：

- 先刷新浏览器页面。
- 检查 profile 插件是否安装。
- 原文进阶参考：Apollo 社区文章 1242。

## 12. 阶段八：获取和编译 Planning 代码

下载所有 Planning 代码包：

```bash
buildtool install planning*
```

如果只学习某个规则，例如 crosswalk：

```bash
buildtool install planning-traffic-rules-crosswalk
```

编译 Planning：

```bash
buildtool build -p modules/planning
```

其他模块同理：

```bash
buildtool build -p modules/其他模块
```

完成后检查：

```bash
find modules/planning -maxdepth 2 -type d | head -50
```

你应该能看到：

- `planning_component`
- `planning_interface_base`
- `planning_base`
- `planners`
- `scenarios`
- `tasks`
- `traffic_rules`

## 13. 安装成功的证据

请保存以下证据：

- [ ] `docker --version` 输出。
- [ ] `aem -h` 输出。
- [ ] `.workspace.json` 内容。
- [ ] `buildtool -v` 输出。
- [ ] `buildtool build -p core` 成功结果。
- [ ] `aem bootstrap start --plus` 成功输出。
- [ ] `http://localhost:8888/` 页面截图。
- [ ] `modules/planning` 目录截图。

没有时间截图时，也可以复制终端输出。但不能用“应该成功了”代替证据。

## 14. 常见问题

### 问题 1：Windows 能直接运行吗

Apollo 的目标开发环境是 Linux。Windows 用户应先准备 Ubuntu 虚拟机、双系统或 WSL2。

### 问题 2：没有 GPU 能学吗

安装指南明确不要求 GPU。CPU 模式可以完成基础学习，但仿真和编译速度可能较慢。

### 问题 3：Docker 安装脚本要运行几次

可能不止一次。根据脚本提示重复执行是正常情况。

### 问题 4：网络下载失败

- 首先检查网络。
- 可以使用安装指南提供的国内镜像或缓存。
- 使用代理时只作用于下载命令，不随意修改系统全局代理。
- 记录第一条实际错误，不要反复盲试。

### 问题 5：WSL2 打开不了 DreamView

先检查：

```bash
curl http://localhost:8888/
```

如果 Windows 浏览器仍打不开，检查 WSL 端口转发和 Docker 网络。持续失败时切换到 Ubuntu 虚拟机，不要卡住整个学习进度。

## 15. 自测题

1. 为什么 Apollo 不能直接当普通 Windows 软件学习？
2. Ubuntu、Docker、AEM、application-pnc、DreamView 分别负责什么？
3. 虚拟机、双系统和 WSL2 各有什么优缺点？
4. 安装指南推荐的 Ubuntu 版本有哪些？
5. 安装指南为什么不推荐 Ubuntu 24.04？
6. `application-pnc` 和 `ApolloAuto/apollo` 有什么区别？
7. `buildtool build -p core` 做什么？
8. `aem bootstrap start --plus` 后从哪里访问 DreamView？
9. `buildtool install planning*` 做什么？
10. 遇到 `permission denied` 时最基本的处理原则是什么？

## 16. 参考答案

1. Apollo 的编译和运行环境基于 Linux 和 Docker，不是普通 Windows 桌面程序。
2. Ubuntu 提供 Linux 环境；Docker 提供隔离运行环境；AEM 管理 Apollo 环境；application-pnc 是学习/比赛工作空间；DreamView 提供浏览器可视化界面。
3. 虚拟机安全但慢；双系统性能好但分区有风险；WSL2 方便但需要单独验证 Docker、GUI 和端口兼容性。
4. 推荐 18.04、20.04、22.04。
5. 安装指南明确不推荐 24.04，可能涉及依赖和兼容性问题。
6. application-pnc 是 PnC 示例和比赛工作空间；ApolloAuto/apollo 是完整官方主仓库。
7. 读取 core 目录的 cyberfile.xml，下载依赖并构建核心包。
8. 浏览器访问 `http://localhost:8888/`。
9. 下载和安装所有 Planning 相关代码包。
10. 找到错误中明确写出的路径，只修改该路径权限，不要对 `/` 等大范围目录执行危险操作。

## 17. 过关检查

- [ ] 我选择了虚拟机、双系统或 WSL2。
- [ ] Ubuntu 和 Docker 可以正常工作。
- [ ] AEM 安装成功。
- [ ] application-pnc 下载并完成 setup。
- [ ] 已进入 Docker 环境。
- [ ] 核心依赖构建成功。
- [ ] DreamView 可以打开。
- [ ] Planning 代码包已下载。
- [ ] 我知道每一项安装证据保存在哪里。

## 18. 下一课衔接

下一课不再安装软件，而是建立 Apollo 全景地图：

- Apollo 有哪些主要模块？
- Planning 在链路中的位置是什么？
- `application-pnc` 与官方 Apollo 仓库是什么关系？
- Planning 里的 Component、Planner、Scenario、Stage、Task 分别是什么？