# 第 01～02 课实验手册

## 使用说明

本手册按顺序完成。每一步都包含：

- 操作命令。
- 预期结果。
- 如果失败的排查方式。
- 需要记录的证据。

没有完整仿真环境时，静态实验仍然必须完成。不能运行时，不要写“运行成功”。

## 实验 1A：确认源码基线

### 操作

```powershell
Set-Location 'C:\Users\FQX\Documents\ChatGPT\New project\apollo-upstream'
git rev-parse HEAD
git show -s --format='%H%n%aI%n%s' HEAD
```

### 预期结果

```text
d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa
2026-04-16...
docs: fix README - remove invalid build status badges
```

### 记录

| 项目 | 我的结果 |
| --- | --- |
| 提交哈希 |  |
| 提交日期 |  |
| 提交标题 |  |
| 是否一致 |  |

### 常见错误

- `不是 Git 仓库`：检查是否进入了 `apollo-upstream`。
- 哈希不一致：不要继续使用当前课程中的行号，先记录自己的提交并重新定位源码。
- 网络不可用：本实验不需要联网，只需本地仓库。

## 实验 1B：建立 Planning 目录地图

### 操作

```powershell
Get-ChildItem modules\planning -Directory | Select-Object Name
```

### 任务

为下列目录写一句自己的解释：

| 目录 | 我的解释 |
| --- | --- |
| `planning_component` |  |
| `planning_interface_base` |  |
| `planning_base` |  |
| `planners` |  |
| `scenarios` |  |
| `tasks` |  |
| `traffic_rules` |  |
| `pnc_map` |  |
| `planning_open_space` |  |

### 过关标准

不使用教材，能够正确解释其中至少七个目录。

## 实验 1C：读取 DAG 接线图

### 操作

```powershell
Get-Content modules\planning\planning_component\dag\planning.dag -Raw
```

### 寻找并记录

| 问题 | 答案 |
| --- | --- |
| 加载哪个共享库？ |  |
| 组件类名是什么？ |  |
| 三个 reader channel 是什么？ |  |
| 配置文件在哪里？ |  |
| flag 文件在哪里？ |  |

### 预期结果

组件为 `PlanningComponent`，三个主要 reader channel 为：

```text
/apollo/prediction
/apollo/canbus/chassis
/apollo/localization/pose
```

### 常见错误

- 把 channel 名称当成 C++ 类名。
- 把 `planning.dag` 当成算法代码。
- 忽略配置文件路径和 flag 文件路径。

## 实验 1D：定位 Planning 入口

### 操作

```powershell
rg -n "PlanningComponent::Init|PlanningComponent::Proc" modules\planning\planning_component\planning_component.cc
```

### 记录

| 方法 | 行号 | 一句话职责 |
| --- | --- | --- |
| `Init()` |  |  |
| `Proc()` |  |  |

### 可选运行实验

只有进入 Apollo 运行环境后再执行：

```bash
mainboard -d modules/planning/planning_component/dag/planning.dag
```

或：

```bash
cyber_launch start modules/planning/planning_component/launch/planning.launch
```

如果命令无法执行，记录原因即可，不在没有证据时填写“运行成功”。

## 实验 2A：手工跟踪一帧调用链

### 操作

依次执行：

```powershell
rg -n "PlanningComponent::Init|PlanningComponent::Proc" modules\planning\planning_component\planning_component.cc
rg -n "planning_base_->RunOnce|planning_writer_->Write" modules\planning\planning_component\planning_component.cc
rg -n "OnLanePlanning::RunOnce|InitFrame|traffic_decider_|Plan\(" modules\planning\planning_component\on_lane_planning.cc
rg -n "PlanningBase::LoadPlanner|CreateInstance<Planner>" modules\planning\planning_component\planning_base.cc
```

### 任务

按实际调用顺序填写：

```text
PlanningComponent::Proc
        -> __________________
        -> __________________
        -> __________________
        -> __________________
        -> __________________
        -> ADCTrajectory
```

### 预期关键顺序

```text
PlanningComponent::Proc
        -> planning_base_->RunOnce
        -> OnLanePlanning::RunOnce
        -> InitFrame
        -> TrafficDecider
        -> Plan
        -> planning_writer_->Write
```

### 证据

在自己的笔记中复制关键行号和三条调用语句。

## 实验 2B：日志验证实验

本实验需要可编译的 Apollo 环境。不能编译时跳过，但要完成实验 2A。

### 实验一

在 `PlanningComponent::Proc()` 开头、`CheckRerouting()` 之前临时增加：

```cpp
AINFO << "Prediction header: "
      << prediction_obstacles->header().DebugString();
```

### 实验二

在 `OnLanePlanning::RunOnce()` 中计算 `frame_num` 后临时增加：

```cpp
AINFO << "Planning frame sequence id = [" << frame_num << "]";
```

### 操作

1. 保存代码。
2. 按当前 Apollo 版本的方式重新编译。
3. 启动 Planning 和仿真输入。
4. 在日志中搜索 `Prediction header` 和 `Planning frame sequence id`。
5. 观察 frame sequence id 是否递增。
6. 实验结束后恢复代码，或保留在独立课程分支。

### 记录表

| 项目 | 结果 |
| --- | --- |
| 是否成功编译 |  |
| 是否看到 Prediction 日志 |  |
| 是否看到帧编号日志 |  |
| 帧编号是否递增 |  |
| 遇到的问题 |  |
| 解决办法 |  |

### 常见错误

- 修改后没有重新编译。
- 启动的是旧二进制。
- 日志级别过滤掉了 `AINFO`。
- 当前仿真没有产生 Planning 输入。
- 修改了错误的工作区。

## 实验 2C：解释智能指针

不看教材，分别用一句话解释：

| 类型 | 我的解释 | 本课例子 |
| --- | --- | --- |
| `std::shared_ptr<T>` |  |  |
| `std::unique_ptr<T>` |  |  |
| 普通指针 `T*` |  |  |

参考方向：

- `shared_ptr`：允许多个地方共同持有对象。
- `unique_ptr`：同一时间只有一个所有者。
- 普通指针：只表示地址，不自动表达所有权。

## 通关检查

- [ ] 实验 1A 完成，commit 一致。
- [ ] 实验 1B 至少解释了七个目录。
- [ ] 实验 1C 正确找出三个输入 channel。
- [ ] 实验 1D 找到 `Init` 和 `Proc`。
- [ ] 实验 2A 独立画出调用链。
- [ ] 能解释 `LocalView` 和 `Frame` 的区别。
- [ ] 能解释 `planning_writer_->Write(...)` 的作用。
- [ ] 能说明本课有哪些内容只做了静态阅读，哪些做了实际运行。