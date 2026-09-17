# 第 02 课：一帧规划如何跑完

> 学生自学版。按源码顺序完成阅读、实验和自测，不依赖老师讲解。

## 1. 学习信息

- 预计用时：120～180 分钟。
- 难度：零基础到初级。
- 前置要求：完成第 01 课。
- 源码基线：官方 Apollo `d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。
- 是否必须运行仿真：不必须。日志实验需要编译环境，但不是通过本课的唯一条件。
- 本课核心问题：一帧规划从输入到输出，代码到底怎样流动？

## 2. 学完本课应能做到

- [ ] 能解释 `Init()` 和 `Proc()` 的区别。
- [ ] 能说明 `LocalView` 保存了什么。
- [ ] 能按顺序说出 `RunOnce()` 的主要阶段。
- [ ] 能解释 `Frame` 的作用。
- [ ] 能说明 `PublicRoadPlanner` 如何被创建。
- [ ] 能找到 `ADCTrajectory` 被填充和发布的位置。
- [ ] 能区分正常规划、停止轨迹和 estop 分支。

## 3. 前置概念复习

### 3.1 函数

函数是一段可以重复调用的代码。

例如：

```cpp
bool PlanningComponent::Init();
```

含义：

- `bool`：返回真或假。
- `PlanningComponent::`：这个函数属于 `PlanningComponent` 类。
- `Init`：函数名。
- `()`：参数列表。

### 3.2 对象和成员

对象是类的具体实例。`PlanningComponent` 对象中保存着：

- reader 和 writer。
- 最新输入消息。
- `LocalView`。
- `PlanningBase`。
- 配置对象。

对象内部的数据称为成员。

### 3.3 指针和智能指针

本课先建立使用层面的理解：

| 写法 | 含义 |
| --- | --- |
| `T*` | 指向 `T` 类型对象的普通指针 |
| `std::shared_ptr<T>` | 可以共享所有权的智能指针 |
| `std::unique_ptr<T>` | 同一时间只有一个所有者的智能指针 |
| `const std::shared_ptr<T>&` | 以只读引用方式传入智能指针 |
| `*ptr` | 取出指针指向的实际对象 |
| `ptr->method()` | 通过指针调用对象的成员 |

详细语法在第 06～07 课展开。

### 3.4 回调

回调是“数据到达后由框架自动调用”的函数。

例如交通灯 reader 收到消息后，会执行注册过的回调，把消息复制到组件成员中。

### 3.5 锁

Planning 的回调可能在 Cyber 线程中执行，而 `Proc()` 在主流程中被调用。两边都可能访问同一份消息，因此需要锁保护。

```cpp
std::lock_guard<std::mutex> lock(mutex_);
```

初学解释：

- 进入代码块时加锁。
- 离开代码块时自动解锁。
- 同一时间只允许一个线程修改共享数据。

## 4. 本课源码位置

主要文件：

```text
modules/planning/planning_component/planning_component.h
modules/planning/planning_component/planning_component.cc
modules/planning/planning_component/planning_base.h
modules/planning/planning_component/planning_base.cc
modules/planning/planning_component/on_lane_planning.cc
```

在课程固定提交中，关键位置约为：

| 内容 | 文件 | 行号附近 |
| --- | --- | --- |
| `PlanningComponent::Init()` | `planning_component.cc` | 44 |
| `PlanningComponent::Proc()` | `planning_component.cc` | 132 |
| 调用 `RunOnce()` | `planning_component.cc` | 226 |
| 发布 `ADCTrajectory` | `planning_component.cc` | 236 |
| `OnLanePlanning::RunOnce()` | `on_lane_planning.cc` | 232 |
| `OnLanePlanning::Plan()` | `on_lane_planning.cc` | 528 |
| `PlanningBase::LoadPlanner()` | `planning_base.cc` | 113 |

行号只用于帮助你第一次定位。后续搜索必须优先使用函数名。

## 5. 完整调用链

```text
Cyber 收到输入
      |
      v
PlanningComponent::Proc
      |
      +--> 组装 LocalView
      |
      +--> planning_base_->RunOnce(...)
                 |
                 v
          OnLanePlanning::RunOnce
                 |
                 +--> 更新车辆状态
                 +--> 更新参考线
                 +--> 计算 stitching trajectory
                 +--> InitFrame
                 +--> TrafficDecider
                 +--> Plan
                 |
                 v
              Frame / Planner
                 |
                 v
           ADCTrajectory
      |
      v
planning_writer_->Write(...)
```

## 6. 源码阅读一：组件类定义

打开：

```text
modules/planning/planning_component/planning_component.h
```

找到类定义：

```cpp
class PlanningComponent final
    : public cyber::Component<prediction::PredictionObstacles,
                              canbus::Chassis,
                              localization::LocalizationEstimate> {
 public:
  bool Init() override;

  bool Proc(
      const std::shared_ptr<prediction::PredictionObstacles>& prediction_obstacles,
      const std::shared_ptr<canbus::Chassis>& chassis,
      const std::shared_ptr<localization::LocalizationEstimate>& localization_estimate)
      override;
};
```

这一段可以拆成四层理解。

### 6.1 `class PlanningComponent`

定义一个名为 `PlanningComponent` 的类。

### 6.2 `final`

表示该类不能继续被其他类继承。

初学阶段可以把它看作一种明确限制，不需要在本课深挖。

### 6.3 继承 `cyber::Component<...>`

冒号后的部分表示继承。

`PlanningComponent` 继承自 Cyber 的组件基类，所以具备组件的初始化、消息接收和周期处理能力。

三个模板参数表示这个组件主要接收：

```text
PredictionObstacles
Chassis
LocalizationEstimate
```

### 6.4 `override`

`override` 表示这里重写了父类中已有的虚函数。

在本课只需要理解：

```text
Cyber 框架约定调用 Init 和 Proc
PlanningComponent 提供了自己的实现
```

详细机制在第 05 课学习。

## 7. 源码阅读二：Init 如何接线

打开：

```text
modules/planning/planning_component/planning_component.cc
```

定位：

```powershell
rg -n "PlanningComponent::Init" modules\planning\planning_component\planning_component.cc
```

阅读 `Init()` 时，按以下顺序标记代码：

### 7.1 创建依赖注入器

```cpp
injector_ = std::make_shared<DependencyInjector>();
```

`DependencyInjector` 用来提供不同模块共同依赖的对象。

本课只需要知道：它像是一个共享工具箱，后续规划过程会从中取得需要的对象。

### 7.2 选择 PlanningBase 实现

```cpp
if (FLAGS_use_navigation_mode) {
  planning_base_ = std::make_unique<NaviPlanning>(injector_);
} else {
  planning_base_ = std::make_unique<OnLanePlanning>(injector_);
}
```

阅读结论：

- 导航模式使用 `NaviPlanning`。
- 非导航模式使用 `OnLanePlanning`。
- 变量声明类型可以是基类 `PlanningBase`，实际对象是派生类。
- 这里体现了多态思想。完整语法在第 05 课学习。

### 7.3 读取组件配置

```cpp
ACHECK(ComponentBase::GetProtoConfig(&config_))
```

作用：

- 从组件配置路径读取 `PlanningConfig`。
- 如果读取失败，记录错误并终止初始化。

### 7.4 初始化 PlanningBase

```cpp
planning_base_->Init(config_);
```

这里调用的是基类接口，但实际会执行 `OnLanePlanning::Init()` 或 `NaviPlanning::Init()`。

动态调用哪个实现，由实际对象类型决定。

### 7.5 创建 reader

初始化过程会创建多个 reader，例如：

- traffic light reader。
- pad message reader。
- relative map reader。
- storytelling reader。
- planning command reader。
- control interactive reader。

Reader 负责订阅 channel。

### 7.6 注册回调

典型写法：

```cpp
traffic_light_reader_ = node_->CreateReader<TrafficLightDetection>(
    config_.topic_config().traffic_light_detection_topic(),
    [this](const std::shared_ptr<TrafficLightDetection>& traffic_light) {
      ADEBUG << "Received traffic light data: run traffic light callback.";
      std::lock_guard<std::mutex> lock(mutex_);
      traffic_light_.CopyFrom(*traffic_light);
    });
```

逐项解释：

- `CreateReader<T>`：创建读取 `T` 类型消息的 reader。
- `[this]`：lambda 捕获当前组件对象。
- `const shared_ptr<T>&`：收到消息的共享指针。
- `traffic_light_.CopyFrom(*traffic_light)`：把消息内容复制到本地成员。

### 7.7 创建 writer

```cpp
planning_writer_ = node_->CreateWriter<ADCTrajectory>(
    config_.topic_config().planning_trajectory_topic());
```

Writer 负责把 `ADCTrajectory` 发布到配置的 channel。

### 7.8 Init 的职责总结

```text
创建对象
加载配置
建立输入通道
注册输入回调
建立输出通道
初始化 PlanningBase
```

Init 负责“准备好接下来要用的东西”，不是在 Init 中完成实时规划。

## 8. 源码阅读三：Proc 如何触发一轮规划

定位：

```powershell
rg -n "PlanningComponent::Proc" modules\planning\planning_component\planning_component.cc
```

### 8.1 检查输入

```cpp
ACHECK(prediction_obstacles != nullptr);
```

作用：如果 prediction 指针为空，立即报错，避免后续解引用空指针。

### 8.2 检查是否需要重新路由

```cpp
CheckRerouting();
```

某些情况下，当前路线不可用，Planning 需要发起新的路由请求。

### 8.3 把基础输入写入 LocalView

```cpp
local_view_.prediction_obstacles = prediction_obstacles;
local_view_.chassis = chassis;
local_view_.localization_estimate = localization_estimate;
```

`LocalView` 是本轮规划使用的输入快照。

可以把它理解为：

```text
LocalView = Proc 为这一轮规划准备好的输入集合
```

### 8.4 在锁保护下更新其他消息

PlanningCommand、traffic light、relative map、pad、stories 和 control interactive 消息都可能已经在回调中被更新。

`Proc()` 在锁保护下把它们复制到 `LocalView`。

### 8.5 检查输入是否完整

```cpp
if (!CheckInput()) {
  AINFO << "Input check failed";
  return false;
}
```

如果关键输入不完整，就不继续规划。

### 8.6 创建输出消息

```cpp
ADCTrajectory adc_trajectory_pb;
```

这个局部对象将接收本轮规划生成的结果。

### 8.7 调用 RunOnce

```cpp
planning_base_->RunOnce(local_view_, &adc_trajectory_pb);
```

逐项解释：

- `planning_base_` 是 `PlanningBase` 类型的智能指针。
- `->` 表示通过指针调用成员函数。
- `RunOnce` 是纯虚接口，实际执行 OnLanePlanning 或 NaviPlanning 的实现。
- `local_view_` 以引用方式传入输入。
- `&adc_trajectory_pb` 传入输出对象地址，让 `RunOnce` 填充轨迹。

调用返回后，`adc_trajectory_pb` 中应包含本轮规划结果。

### 8.8 补齐 header 和相对时间

```cpp
common::util::FillHeader(node_->Name(), &adc_trajectory_pb);
SetLocation(&adc_trajectory_pb);
```

然后修正轨迹点的相对时间。

### 8.9 发布轨迹

```cpp
planning_writer_->Write(adc_trajectory_pb);
```

到这里，一轮 `Proc()` 完成。

### 8.10 Proc 的职责总结

```text
拿输入
检查输入
保存输入快照
调用 RunOnce
补齐输出信息
发布 ADCTrajectory
```

## 9. 源码阅读四：RunOnce 的阶段

打开：

```text
modules/planning/planning_component/on_lane_planning.cc
```

定位：

```powershell
rg -n "OnLanePlanning::RunOnce|OnLanePlanning::Plan" modules\planning\planning_component\on_lane_planning.cc
```

### 阶段 1：保存本轮输入

```cpp
local_view_ = local_view;
```

把 `Proc()` 传入的输入保存到 PlanningBase 成员中。

### 阶段 2：记录时间

记录系统时间和规划开始时间，后续用于计算耗时。

### 阶段 3：更新车辆状态

```cpp
Status status = injector_->vehicle_state()->Update(
    *local_view_.localization_estimate, *local_view_.chassis);
```

阅读时注意：

- `local_view_.localization_estimate` 是 `shared_ptr`。
- `*local_view_.localization_estimate` 取出实际对象。
- 函数需要定位和底盘对象来更新车辆状态。

### 阶段 4：校验车辆状态

如果状态更新失败，或者车辆状态无效或过旧：

- 设置 not-ready 原因。
- 填充 header。
- 生成停止轨迹。
- 结束本轮 `RunOnce()`。

这说明 Planning 在异常情况下仍然会输出一个安全兜底结果。

### 阶段 5：更新参考线和路由状态

- 更新 reference line provider 的车辆状态。
- 如果新的运动命令与旧路线不同，则清空历史并重置 reference line provider。
- 调用 `planner_->Reset(...)` 重置规划器场景状态。

### 阶段 6：计算 stitching trajectory

```cpp
TrajectoryStitcher::ComputeStitchingTrajectory(...)
```

作用概述：

- 把上一帧已发布轨迹和当前车辆状态连接起来。
- 为新一轮规划提供连续、稳定的起点。
- 避免两次规划轨迹之间出现明显跳变。

本课只需要理解“轨迹拼接是为了连续性”，不要求掌握全部数学推导。

### 阶段 7：构造 Frame

```cpp
status = InitFrame(frame_num, stitching_trajectory.back(), vehicle_state);
```

`Frame` 是本轮规划的数据容器。

它会把以下内容组织在同一轮上下文中：

- 车辆状态。
- LocalView。
- 参考线。
- 参考线信息。
- 障碍物。
- PlanningContext。
- 后续任务产生的路径、速度和决策。

如果 `Frame` 初始化失败：

- 记录错误。
- 根据 flag 生成 estop 或停止轨迹。
- 保存当前 Frame 到历史。
- 结束本轮。

### 阶段 8：执行 TrafficDecider

```cpp
traffic_decider_.Execute(frame_.get(), &ref_line_info);
```

交通规则会在具体规划之前执行，给参考线加入交通规则约束或决策。

### 阶段 9：调用 Plan

```cpp
status = Plan(start_timestamp, stitching_trajectory, ptr_trajectory_pb);
```

`Plan()` 是后续课程的重点。它会进入 Planner、Scenario、Stage 和 Task 体系。

本课只记录调用位置，不展开算法。

### 阶段 10：记录调试信息和耗时

完成后会：

- 打印轨迹点。
- 打印障碍物多边形。
- 打印 ego box。
- 记录总耗时。
- 把耗时写入 `latency_stats`。

### 阶段 11：处理失败状态

如果 `Plan()` 返回失败：

- 把 error status 写入 trajectory header。
- 根据配置设置 estop 或保留失败状态。

### 阶段 12：保存 FrameHistory

```cpp
injector_->frame_history()->Add(frame_num, std::move(frame_));
```

作用：

- 将本轮 Frame 保存到历史。
- `std::move(frame_)` 表示所有权转移。
- 后续规划轮次可以读取上一轮信息，用于连续性和调试。

## 10. Frame 和 Planner 的关系

### 10.1 Frame 是什么

Frame 是本轮规划中的共享数据容器。

可以记成：

```text
输入数据 + 车辆状态 + 参考线 + 障碍物 + 任务结果 + 决策
```

### 10.2 Planner 是什么

Planner 是具体规划器。

当前默认规划器在 `PlanningBase::LoadPlanner()` 中设置为：

```cpp
std::string planner_name = "apollo::planning::PublicRoadPlanner";
```

然后通过插件管理器创建：

```cpp
planner_ =
    cyber::plugin_manager::PluginManager::Instance()->CreateInstance<Planner>(
        planner_name);
```

因此：

- `PlanningBase` 负责公共初始化流程。
- `Planner` 提供具体规划策略。
- 实际对象由插件机制和配置决定。

## 11. ADCTrajectory 输出路径

完整输出链：

```text
RunOnce 填充 adc_trajectory_pb
        |
        v
FillHeader 补充 header
        |
        v
SetLocation 补充车辆位置
        |
        v
修正轨迹点 relative_time
        |
        v
planning_writer_->Write
        |
        v
/apollo/planning
```

## 12. 动手实验

完成 `labs-01-02.md` 中的：

- 实验 2A：手工跟踪一帧调用链。
- 实验 2B：日志验证实验，需要可编译环境时完成。
- 实验 2C：解释智能指针。

没有编译环境时：

- 必须完成实验 2A 和 2C。
- 实验 2B 明确记录“未运行及原因”，不能伪造日志。

## 13. 预期学习证据

- [ ] 手工调用图。
- [ ] `Init()` 八个职责的总结。
- [ ] `Proc()` 十个步骤的总结。
- [ ] `RunOnce()` 阶段图。
- [ ] `Frame` 和 `LocalView` 的区别说明。
- [ ] `ADCTrajectory` 发布路径。
- [ ] 日志实验结果，或明确的未运行原因。

## 14. 常见错误

### 错误 1：把 Init 当成每次规划都会执行

`Init()` 主要在组件启动时执行一次。实时规划在 `Proc()` 和 `RunOnce()` 中执行。

### 错误 2：把 Proc 和 RunOnce 混为一谈

- `Proc()` 属于组件边界，负责输入和输出。
- `RunOnce()` 属于 PlanningBase，负责组织一轮规划流程。

### 错误 3：看到引用符号仍然复制对象

`const std::shared_ptr<T>&` 不复制智能指针本身，仍然是引用。

### 错误 4：把 `*ptr` 和 `ptr->` 混淆

- `*ptr` 得到对象本身。
- `ptr->method()` 通过指针调用对象成员。

### 错误 5：以为异常时没有输出

车辆状态或 Frame 初始化失败时，Planning 仍可能生成停止轨迹或 estop。

### 错误 6：以为 Frame 只是普通局部变量

Frame 会保存本轮所有相关上下文，并被加入 FrameHistory 供后续使用。

## 15. 自测题

1. `Init()` 和 `Proc()` 分别何时执行？
2. `OnLanePlanning` 和 `NaviPlanning` 如何选择？
3. `LocalView` 保存什么？
4. `shared_ptr` 与 `unique_ptr` 的主要区别是什么？
5. `planning_base_->RunOnce(...)` 由谁调用，谁执行？
6. `RunOnce()` 为什么要更新车辆状态？
7. `stitching trajectory` 解决什么问题？
8. `Frame` 为什么需要保存障碍物、参考线和任务结果？
9. TrafficDecider 在 Plan 之前还是之后执行？
10. `ADCTrajectory` 在哪里发布？
11. 车辆状态无效时会发生什么？
12. FrameHistory 中保存的 Frame 有什么用途？

## 16. 参考答案

1. `Init()` 主要在组件启动时执行一次；`Proc()` 在有输入时重复执行。

2. 主要由 `FLAGS_use_navigation_mode` 决定：导航模式选择 `NaviPlanning`，否则选择 `OnLanePlanning`。

3. `LocalView` 保存本轮规划使用的输入快照，例如 prediction、chassis、localization、planning command、traffic light 等。

4. `shared_ptr` 允许多个所有者共享对象；`unique_ptr` 同一时间只允许一个所有者。

5. 由 `PlanningComponent::Proc()` 调用；实际执行 `OnLanePlanning::RunOnce()` 或 `NaviPlanning::RunOnce()`，取决于 `planning_base_` 的真实对象类型。

6. 用最新 localization 和 chassis 更新车辆位置、速度、朝向等状态，后续规划必须基于有效且时间一致的车辆状态。

7. 把上一轮轨迹和本轮起点衔接起来，保证连续性和稳定性，减少轨迹跳变。

8. 因为这些数据属于同一轮规划上下文，会被多个 Task 和调试逻辑共同读取。Frame 把本轮数据集中管理，并支持历史查询。

9. TrafficDecider 在 `Plan()` 之前执行。

10. `PlanningComponent::Proc()` 最后调用 `planning_writer_->Write(adc_trajectory_pb)` 发布。

11. 记录错误和 not-ready 原因，填充 header，并生成停止轨迹，然后结束本轮。

12. 供后续规划轮次复用历史信息，也用于连续性、调试和规划状态分析。

## 17. 过关检查

- [ ] 十二个自测题至少答对十个。
- [ ] 能独立画出 `Proc -> RunOnce -> Plan -> Write`。
- [ ] 能解释 `Init` 和 `Proc` 的区别。
- [ ] 能解释 `LocalView` 和 `Frame` 的区别。
- [ ] 能说出 RunOnce 的至少八个阶段。
- [ ] 能指出异常时停止轨迹或 estop 的处理位置。
- [ ] 能明确记录哪些实验真正运行，哪些未运行。

## 18. 下一课衔接

第 03 课会从本课出现的 C++ 写法开始系统补基础：

- 变量和类型。
- `const`。
- 引用。
- `auto`。
- 函数参数和返回值。
- `Status` 对象。

届时会回到 `PlanningBase` 和 `PlanningComponent` 的源码，把本课“先看懂”的语法变成真正掌握的知识。