# 第 10 课：ScenarioManager 与场景切换

> 学生自学版。本课学习 Planning 如何加载场景、维护当前场景并在场景之间切换。

## 1. 学习信息

- 预计用时：100～130 分钟。
- 难度：核心。
- 前置：第 03、09 课。
- 代码基线：`d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。

## 2. 学完本课应能做到

- [ ] 说出 ScenarioManager 的职责。
- [ ] 理解 `scenario_list_`、`current_scenario_`、`default_scenario_type_`。
- [ ] 解释 `IsTransferable` 在场景切换中的作用。
- [ ] 找到默认场景 `LANE_FOLLOW` 的加载逻辑。
- [ ] 画出场景切换流程。

## 3. ScenarioManager 保存什么

> 源码位置：`modules/planning/planners/public_road/scenario_manager.h`，约第 39～53 行。

```cpp
// 源码位置：scenario_manager.h，约第 39 行
class ScenarioManager final {
 private:
  // 依赖注入器：为所有场景提供公共对象
  std::shared_ptr<DependencyInjector> injector_;

  // 当前正在运行的场景
  std::shared_ptr<Scenario> current_scenario_;

  // 默认场景，通常配置为 LANE_FOLLOW
  std::shared_ptr<Scenario> default_scenario_type_;

  // 配置文件中加载的全部候选场景
  std::vector<std::shared_ptr<Scenario>> scenario_list_;
};
```

先记住：

```text
scenario_list_ = 候选场景集合
current_scenario_ = 本轮实际运行场景
default_scenario_type_ = 兜底默认场景
```

## 4. 场景加载

> 源码位置：`modules/planning/planners/public_road/scenario_manager.cc`，约第 33～53 行。

```cpp
// 源码位置：scenario_manager.cc，约第 33 行
bool ScenarioManager::Init(
    const std::shared_ptr<DependencyInjector>& injector,
    const PlannerPublicRoadConfig& planner_config) {
  // 保存公共依赖
  injector_ = injector;

  // 遍历配置中声明的场景
  for (int i = 0; i < planner_config.scenario_size(); i++) {
    // 根据 type 创建具体 Scenario 插件
    auto scenario = PluginManager::Instance()->CreateInstance<Scenario>(
        ConfigUtil::GetFullPlanningClassName(
            planner_config.scenario(i).type()));

    // 初始化场景，并加入候选列表
    scenario->Init(injector_, planner_config.scenario(i).name());
    scenario_list_.push_back(scenario);

    // 名称是 LANE_FOLLOW 的场景作为默认场景
    if (planner_config.scenario(i).name() == "LANE_FOLLOW") {
      default_scenario_type_ = scenario;
    }
  }

  // 初始时默认运行 LaneFollow
  current_scenario_ = default_scenario_type_;
  return true;
}
```

配置来源：

> 源码位置：`modules/planning/planning_component/conf/public_road_planner_config.pb.txt`。

```text
# 源码位置：public_road_planner_config.pb.txt
scenario {
  name: "STOP_SIGN_UNPROTECTED"
  type: "StopSignUnprotectedScenario"
}
scenario {
  name: "LANE_FOLLOW"
  type: "LaneFollowScenario"
}
```

## 5. 场景切换判断

> 源码位置：`modules/planning/planners/public_road/scenario_manager.cc`，约第 56～78 行。

```cpp
// 源码位置：scenario_manager.cc，约第 56 行
void ScenarioManager::Update(const common::TrajectoryPoint& ego_point,
                             Frame* frame) {
  // 遍历所有候选场景
  for (auto scenario : scenario_list_) {
    // 如果当前场景已经在处理，并且处于高优先级状态，就先不切换
    if (current_scenario_.get() == scenario.get() &&
        current_scenario_->GetStatus() ==
            ScenarioStatusType::STATUS_PROCESSING) {
      return;
    }

    // 询问候选场景：现在能否切换到你自己？
    if (scenario->IsTransferable(current_scenario_.get(), *frame)) {
      // 退出旧场景
      current_scenario_->Exit(frame);

      // 切换到新场景并重置场景状态
      current_scenario_ = scenario;
      current_scenario_->Reset();

      // 进入新场景
      current_scenario_->Enter(frame);
      return;
    }
  }
}
```

一句话：

```text
场景切换不是“强行赋新值”，而是先问每个场景能否接管当前 Frame。
```

## 6. 重置默认场景

> 源码位置：`modules/planning/planners/public_road/scenario_manager.cc`，约第 80～87 行。

```cpp
// 源码位置：scenario_manager.cc，约第 80 行
void ScenarioManager::Reset(Frame* frame) {
  if (current_scenario_) {
    // 退出当前场景
    current_scenario_->Exit(frame);
  }

  // 清理默认场景状态
  default_scenario_type_->Reset();

  // 重新回到默认场景
  current_scenario_ = default_scenario_type_;
}
```

默认场景通常是 LaneFollow。它适合作为“没有更特殊交通事件时”的基础场景。

## 7. 完整切换流程

```text
ScenarioManager::Init
  -> 加载配置中的全部场景
  -> scenario_list_ 保存候选场景
  -> current_scenario_ 指向默认场景

ScenarioManager::Update
  -> 遍历 scenario_list_
  -> 调用候选场景 IsTransferable
  -> Exit 旧场景
  -> Reset 新场景
  -> Enter 新场景
  -> 后续由 current_scenario_->Process 运行
```

## 8. 动手实验

```powershell
rg -n "class ScenarioManager|current_scenario_|default_scenario_type_|scenario_list_" modules\planning\planners\public_road\scenario_manager.h
rg -n "ScenarioManager::Init|CreateInstance<Scenario>|LANE_FOLLOW|IsTransferable|Exit\(|Reset\(|Enter\(" modules\planning\planners\public_road\scenario_manager.cc
Get-Content modules\planning\planning_component\conf\public_road_planner_config.pb.txt
```

思考并记录：

```text
默认场景名称：
候选场景从哪个配置加载：
哪个函数回答“能不能切换”：
```

## 9. 常见错误

- 以为 `scenario_list_` 中只有一个场景。
- 以为场景切换只看名称，不看 Frame 和交通条件。
- 忽略 `Exit`、`Reset`、`Enter` 的调用顺序。
- 把默认场景理解为永远不能离开的场景。
- 把 `current_scenario_` 和 `default_scenario_type_` 当成必然不同对象。

## 10. 自测题

1. ScenarioManager 的职责是什么？
2. `scenario_list_` 保存什么？
3. `default_scenario_type_` 保存什么？
4. 默认场景通常是哪一个？
5. `IsTransferable` 回答什么问题？
6. 场景切换前为什么要调用 `Exit`？
7. 切换到新场景后为什么要 `Reset` 和 `Enter`？
8. 场景配置来自哪个文件？
9. 为什么初始化时要遍历 `planner_config.scenario_size()`？
10. 用一句话概括场景切换。

## 11. 参考答案

1. 加载、维护、切换当前 Scenario。
2. 配置声明的候选场景对象。
3. LaneFollow 等默认兜底场景对象。
4. `LANE_FOLLOW`。
5. 当前 Frame 是否允许切换到候选场景。
6. 让旧场景清理自己的状态或结束逻辑。
7. Reset 清理新场景旧状态，Enter 执行进入场景的准备工作。
8. `public_road_planner_config.pb.txt`。
9. 因为配置文件声明了多个候选场景，需要逐个创建。
10. 根据 Frame 条件从候选场景中选择一个场景接管当前规划。

## 12. 过关检查

- [ ] 能说明三个场景指针/容器的职责。
- [ ] 能找到 `CreateInstance<Scenario>`。
- [ ] 能解释 `IsTransferable`。
- [ ] 十道题至少答对八道。

## 13. 下一课衔接

下一课专门剖析 LaneFollowScenario，看默认场景为什么不只是一个名字，而是有明确的切入条件和 Stage 流水线。