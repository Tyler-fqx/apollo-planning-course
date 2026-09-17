# 第 01～02 课学习卡与速查表

## 第 01 课学习卡

### 一句话理解 Planning

Planning 根据当前车辆状态、地图路线、障碍物预测和交通规则，计算未来一段时间车辆应该怎样运动，并输出 `ADCTrajectory`。

### 四个核心词

| 词语 | 初学者解释 | 在源码中的位置 |
| --- | --- | --- |
| Component | 能被 Cyber 加载并持续运行的程序组件 | `PlanningComponent` |
| DAG | 组件接线图，说明加载什么、读什么、用什么配置 | `planning.dag` |
| Channel | Cyber 模块之间传递消息的通信通道 | `/apollo/prediction` 等 |
| Protobuf | Apollo 用结构化消息描述数据的格式 | `ADCTrajectory` 等 |

### Planning 的三个主要输入

```text
/apollo/prediction
/apollo/canbus/chassis
/apollo/localization/pose
```

### Planning 的主要输出

```text
/apollo/planning
类型：apollo::planning::ADCTrajectory
内容：未来轨迹点、位置、速度、时间等信息
```

### 为什么输出是轨迹

路径只回答“往哪里走”，轨迹还需要回答：

- 什么时间到达某个位置。
- 每一时刻速度是多少。
- 加速度和 jerk 是否平滑。
- 控制模块能否直接执行。

### 第一张调用图

```text
planning.dag
    -> 加载 PlanningComponent
    -> Init() 初始化
    -> Proc() 接收输入并触发规划
    -> RunOnce() 组织一轮规划
    -> ADCTrajectory
```

### 常用检查命令

```powershell
git rev-parse HEAD
Get-ChildItem modules\planning -Directory | Select-Object Name
Get-Content modules\planning\planning_component\dag\planning.dag -Raw
rg -n "PlanningComponent::Init|PlanningComponent::Proc" modules\planning\planning_component
```

## 第 02 课学习卡

### 本课完整调用链

```text
PlanningComponent::Proc
        -> LocalView
        -> planning_base_->RunOnce
        -> OnLanePlanning::RunOnce
        -> InitFrame
        -> TrafficDecider
        -> Plan
        -> ADCTrajectory
        -> planning_writer_->Write
```

### Init 和 Proc 的区别

| 方法 | 何时执行 | 主要职责 |
| --- | --- | --- |
| `Init()` | 组件启动时一次 | 创建对象、加载配置、建立 reader/writer |
| `Proc()` | 收到输入时重复执行 | 组装输入、检查数据、触发一轮规划、发布结果 |

### Init 的关键动作

1. 创建 `DependencyInjector`。
2. 创建 `OnLanePlanning` 或 `NaviPlanning`。
3. 加载 Planning 配置。
4. 初始化 `planning_base_`。
5. 创建 reader 和 writer。
6. 注册输入回调。
7. 建立 rerouting client。
8. 返回初始化结果。

### Proc 的关键动作

1. 检查 prediction 输入。
2. 处理重新路由。
3. 把输入写入 `LocalView`。
4. 用锁保护共享消息。
5. 调用 `CheckInput()`。
6. 调用 `RunOnce()`。
7. 补充 header、位置和相对时间。
8. 发布 `ADCTrajectory`。

### 新词解释

| 词语 | 自学解释 | 本课例子 |
| --- | --- | --- |
| `LocalView` | 本轮规划所需的全部输入快照 | prediction、chassis、localization |
| `Frame` | 一轮规划运行期间共享的数据容器 | 参考线、障碍物、决策 |
| `shared_ptr` | 允许多个对象共同使用的智能指针 | prediction 输入 |
| `unique_ptr` | 同一时间只由一个对象拥有的智能指针 | `planning_base_` |
| 回调 | 数据到达后自动执行的函数 | reader 收到消息后复制数据 |
| 锁 | 防止多个线程同时改同一份数据 | `std::lock_guard` |

### RunOnce 阶段速查

```text
1. 保存 LocalView，记录时间
2. 更新并校验车辆状态
3. 更新参考线和重新路由状态
4. 计算 stitching trajectory
5. 构造 Frame
6. 执行交通规则
7. 调用 Plan
8. 记录耗时和调试数据
9. 保存 FrameHistory
```

### 关键源码搜索

```powershell
rg -n "PlanningComponent::Init|PlanningComponent::Proc" modules\planning\planning_component\planning_component.cc
rg -n "planning_base_->RunOnce|planning_writer_->Write" modules\planning\planning_component\planning_component.cc
rg -n "OnLanePlanning::RunOnce|InitFrame|traffic_decider_|Plan\(" modules\planning\planning_component\on_lane_planning.cc
rg -n "PlanningBase::LoadPlanner|CreateInstance<Planner>" modules\planning\planning_component\planning_base.cc
```

### 过关口诀

```text
Init 负责接线和初始化
Proc 负责收集输入并触发规划
RunOnce 负责组织一轮流程
Frame 负责保存本轮上下文
Plan 负责计算结果
Writer 负责发布轨迹
```

## 自学记录模板

| 问题 | 我的答案 | 源码证据 | 是否验证 |
| --- | --- | --- | --- |
| Planning 的三个输入是什么？ |  |  |  |
| Proc 和 RunOnce 谁先执行？ |  |  |  |
| Frame 为什么需要存在？ |  |  |  |
| 轨迹在哪里发布？ |  |  |  |