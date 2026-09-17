# 第 09 课：vector 与智能指针

> 学生自学版。掌握阅读 `task_list_`、`scenario_list_` 和 `planning_base_` 所需的基础。

## 1. 学习信息

- 预计用时：100～140 分钟。
- 难度：基础。
- 前置：第 08 课。
- 代码基线：`d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。

## 2. 学完本课应能做到

- [ ] 读懂 `std::vector<T>`。
- [ ] 读懂范围 for 循环。
- [ ] 理解 `std::unique_ptr` 和 `std::shared_ptr` 的用途。
- [ ] 解释 `task_list_` 保存什么。
- [ ] 解释为什么 Stage 使用 `shared_ptr<Task>`。

## 3. vector：动态数组

> 源码位置：`modules/planning/planning_interface_base/scenario_base/stage.h`，约第 86～88 行。

```cpp
// 源码位置：stage.h，约第 86 行
// vector 可以保存一组同类型对象，数量可以在运行时变化
std::vector<std::shared_ptr<Task>> task_list_;

// 当某个任务失败时使用的备用任务
std::shared_ptr<Task> fallback_task_;
```

`std::vector<std::shared_ptr<Task>>` 可以读作：

```text
一个动态数组
  每个元素都是一个指向 Task 的共享智能指针
```

## 4. 遍历 task_list_

> 源码位置：`modules/planning/planning_interface_base/scenario_base/stage.cc`，约第 121～124 行。

```cpp
// 源码位置：stage.cc，约第 121 行
for (auto task : task_list_) {
  // task 依次表示列表中的一个智能指针
  ret = task->Execute(frame, &reference_line_info);
}
```

范围 for 等价逻辑：

```text
从 task_list_ 第一个元素开始
每次取出一个 task
执行 task->Execute(...)
直到列表结束或提前 break
```

## 5. 更常见的引用遍历

```cpp
// 教学代码：避免复制大对象
for (const auto& task : task_list_) {
  // const auto& 表示只读引用 task
  task->Execute(frame, reference_line_info);
}
```

注意：

- `auto` 会自动推断类型。
- `auto&` 是引用，不复制。
- `const auto&` 是只读引用。

## 6. shared_ptr：共享所有权

> 源码位置：`modules/planning/planning_component/planning_base.h`，约第 94～102 行。

```cpp
// 源码位置：planning_base.h，约第 94 行
// Frame 由 PlanningBase 独占管理
std::unique_ptr<Frame> frame_;

// Planner 插件由智能指针管理
std::shared_ptr<Planner> planner_;

// 依赖注入器可被多个对象共享
std::shared_ptr<DependencyInjector> injector_;
```

`shared_ptr` 的特点：

- 多个地方可以共同持有同一个对象。
- 内部引用计数归零后，对象自动释放。
- 不需要手动 `delete`。

## 7. unique_ptr：独占所有权

> 源码位置：`modules/planning/planning_component/planning_component.h`，约第 89～94 行。

```cpp
// 源码位置：planning_component.h，约第 89 行
// PlanningComponent 独占拥有 PlanningBase
std::unique_ptr<PlanningBase> planning_base_;

// 依赖注入器可以共享
std::shared_ptr<DependencyInjector> injector_;
```

`unique_ptr` 的特点：

- 同一时间只有一个所有者。
- 不能随意复制。
- 适合明确只有一个对象负责销毁的情况。

## 8. 创建智能指针

> 源码位置：`modules/planning/planning_component/planning_component.cc`，约第 45～51 行。

```cpp
// 源码位置：planning_component.cc，约第 45 行
// 创建共享的依赖注入器
injector_ = std::make_shared<DependencyInjector>();

if (FLAGS_use_navigation_mode) {
  // 创建独占的 NaviPlanning 对象
  planning_base_ = std::make_unique<NaviPlanning>(injector_);
} else {
  // 创建独占的 OnLanePlanning 对象
  planning_base_ = std::make_unique<OnLanePlanning>(injector_);
}
```

推荐写法：

```text
make_shared<T>() -> 创建 shared_ptr<T>
make_unique<T>() -> 创建 unique_ptr<T>
```

不要一开始就学习手动 `new` 和 `delete`。先读懂智能指针表达的所有权即可。

## 9. ScenarioManager 中的容器

> 源码位置：`modules/planning/planners/public_road/scenario_manager.h`，约第 44～53 行。

```cpp
// 源码位置：scenario_manager.h，约第 44 行
// 当前场景
std::shared_ptr<Scenario> current_scenario_;

// 默认场景，例如 LaneFollow
std::shared_ptr<Scenario> default_scenario_type_;

// 配置中加载出来的全部场景
std::vector<std::shared_ptr<Scenario>> scenario_list_;
```

理解方式：

```text
scenario_list_ 保存候选场景
current_scenario_ 指向当前正在运行的场景
default_scenario_type_ 保存兜底默认场景
```

## 10. 动手实验

```powershell
rg -n "vector<std::shared_ptr<Task>>|shared_ptr<Task>" modules\planning\planning_interface_base\scenario_base\stage.h
rg -n "make_shared|make_unique" modules\planning\planning_component\planning_component.cc
rg -n "unique_ptr<|shared_ptr<|vector<std::shared_ptr" modules\planning\planning_component\planning_base.h modules\planning\planners\public_road\scenario_manager.h
```

填写：

| 写法 | 所有权含义 |
| --- | --- |
| `unique_ptr` |  |
| `shared_ptr` |  |
| `vector<T>` |  |

## 11. 常见错误

- 把 `shared_ptr` 当成普通指针，不知道它会自动释放对象。
- 以为 `unique_ptr` 可以随意复制。
- 看到 `auto` 就不知道类型，忽略右侧表达式。
- 认为 `vector` 是固定长度数组。
- 不区分“容器本身”和“容器中元素的所有权”。

## 12. 自测题

1. `vector` 的作用是什么？
2. `task_list_` 保存什么？
3. Stage 如何遍历任务？
4. `shared_ptr` 和 `unique_ptr` 的最大区别是什么？
5. 为什么 `injector_` 适合 shared_ptr？
6. 为什么 `frame_` 适合 unique_ptr？
7. `make_shared` 和 `make_unique` 做什么？
8. `scenario_list_` 的作用是什么？
9. `current_scenario_` 和 `scenario_list_` 有什么关系？
10. 阅读智能指针时最重要的判断是什么？

## 13. 参考答案

1. 保存一组可动态增删的同类型元素。
2. 当前 Stage 要执行的多个 Task 智能指针。
3. 使用范围 for 依次执行每个 `task->Execute(...)`。
4. shared_ptr 可以共享所有权，unique_ptr 只能有一个所有者。
5. 多个 Planning 对象可能需要访问同一个依赖集合。
6. 每一轮 Frame 通常由一个 PlanningBase 独占管理。
7. 分别创建并返回 shared_ptr 和 unique_ptr。
8. 保存配置加载出来的全部候选场景。
9. current_scenario_ 指向 scenario_list_ 中的某一个场景。
10. 判断谁拥有对象、谁负责释放对象。

## 14. 过关检查

- [ ] 能读懂 vector 和范围 for。
- [ ] 能区分 shared_ptr 和 unique_ptr。
- [ ] 能解释 task_list_ 的所有权。
- [ ] 十道题至少答对八道。

## 15. 下一课衔接

下一课进入 ScenarioManager，观察场景列表如何加载、当前场景如何切换，以及默认场景为什么通常回到 LaneFollow。