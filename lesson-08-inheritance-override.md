# 第 08 课：继承、虚函数与 override

> 学生自学版。理解 Task、Scenario、Stage 为什么都采用“基类接口 + 具体插件”的设计。

## 1. 学习信息

- 预计用时：110～150 分钟。
- 难度：基础。
- 前置：第 07 课。
- 代码基线：`d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。

## 2. 学完本课应能做到

- [ ] 解释继承是什么。
- [ ] 读懂 `class A : public B`。
- [ ] 区分普通函数、虚函数和纯虚函数。
- [ ] 说明 `override` 的作用。
- [ ] 找到 Task 和 LaneFollowPath 的继承链。

## 3. 继承的直觉

```cpp
// 教学代码
class Animal {
 public:
  virtual void Speak() = 0;  // 基类只规定“会说话”，不规定怎么说
};

class Dog : public Animal {
 public:
  void Speak() override { /* 狗叫 */ }
};
```

含义：

- `Dog` 继承 `Animal`。
- `Dog` 必须实现 `Speak`。
- 代码可以通过 `Animal*` 统一调用不同具体对象。

## 4. Task 的真实继承链

> 源码位置：
> - `modules/planning/planning_interface_base/task_base/common/path_generation.h`，约第 31 行。
> - `modules/planning/tasks/lane_follow_path/lane_follow_path.h`，约第 30 行。

```cpp
// 源码位置：path_generation.h，约第 31 行
class PathGeneration : public Task {
 public:
  // 重写 Task 的 Execute 接口
  apollo::common::Status Execute(
      Frame* frame, ReferenceLineInfo* reference_line_info) override;

 protected:
  // 具体路径任务实现 Process，供基类 Execute 调用
  virtual apollo::common::Status Process(
      Frame* frame, ReferenceLineInfo* reference_line_info) {
    return apollo::common::Status::OK();
  }
};

// 源码位置：lane_follow_path.h，约第 30 行
class LaneFollowPath : public PathGeneration {
 public:
  bool Init(const std::string& config_dir, const std::string& name,
            const std::shared_ptr<DependencyInjector>& injector) override;

 private:
  common::Status Process(
      Frame* frame, ReferenceLineInfo* reference_line_info) override;

  LaneFollowPathConfig config_;
};
```

继承链：

```text
Task
  -> PathGeneration
      -> LaneFollowPath
```

## 5. 为什么要有虚函数

如果没有虚函数，调用 `task->Execute(...)` 时只能执行 Task 自身的代码。

有虚函数后：

```text
task 的静态类型可以是 Task*
实际对象可以是 LaneFollowPath
运行时执行 LaneFollowPath 的实现
```

这叫多态。

简化示意：

```cpp
// 教学代码
Task* task = new LaneFollowPath();
task->Execute(frame, reference_line_info);  // 实际进入 LaneFollowPath 的流程
```

Apollo 不要求你手写 `new`，插件管理器会创建对象。

## 6. `override` 的作用

```cpp
bool Init(...) override;
common::Status Process(...) override;
```

`override` 告诉编译器：

```text
我准备重写父类中的虚函数
如果签名不匹配，请直接报错
```

它的价值：

- 防止拼写错误。
- 防止参数类型写错却没有真正覆盖。
- 让继承关系更容易在源码中看出来。

## 7. Scenario、Stage、Task 都是同类思路

> 源码位置：`modules/planning/planning_interface_base/scenario_base/scenario.h`，约第 64～76 行。

```cpp
// 源码位置：scenario.h，约第 64 行
class Scenario {
 public:
  // 每个具体场景返回自己的上下文
  virtual ScenarioContext* GetContext() = 0;

  // 每个具体场景决定是否可切入
  virtual bool IsTransferable(const Scenario* other_scenario,
                              const Frame& frame) {
    return false;
  }

  // 运行当前场景
  virtual ScenarioResult Process(
      const common::TrajectoryPoint& planning_init_point, Frame* frame);
};
```

设计规律：

- 基类定义统一接口。
- 具体类实现差异逻辑。
- 上层代码通过基类指针调用。
- 插件配置负责选择具体类。

## 8. 插件注册

> 源码位置：`modules/planning/tasks/lane_follow_path/lane_follow_path.h`，第 55 行附近。

```cpp
// 源码位置：lane_follow_path.h，第 55 行附近
// 告诉 Cyber：LaneFollowPath 是一个 Task 插件
CYBER_PLUGIN_MANAGER_REGISTER_PLUGIN(apollo::planning::LaneFollowPath, Task)
```

没有注册，配置里即使写了 `type: "LaneFollowPath"`，运行时也可能找不到实现。

## 9. 动手实验

```powershell
rg -n "class Task|virtual common::Status Execute|virtual bool Init" modules\planning\planning_interface_base\task_base\task.h
rg -n "class PathGeneration|class Decider" modules\planning\planning_interface_base\task_base\common
rg -n "class LaneFollowPath|CYBER_PLUGIN_MANAGER_REGISTER_PLUGIN" modules\planning\tasks\lane_follow_path\lane_follow_path.h
```

完成继承图：

```text
Task
  -> ________
      -> ________
```

## 10. 常见错误

- 把继承理解成复制代码。
- 看到 `override` 就以为函数一定会被直接调用，忽略虚函数分发。
- 忘记插件注册。
- 只修改具体类，没有满足基类接口要求。
- 把 `public` 继承和成员访问权限混淆。

## 11. 自测题

1. 继承解决什么问题？
2. 纯虚函数有什么特点？
3. `virtual` 的作用是什么？
4. `override` 的作用是什么？
5. `LaneFollowPath` 的直接父类是什么？
6. `PathGeneration` 的直接父类是什么？
7. 为什么可以通过 `Task*` 调用具体 Task？
8. 插件注册宏的作用是什么？
9. 基类接口和具体实现的职责有什么不同？
10. 多态为什么适合 Scenario、Stage、Task 这类插件系统？

## 12. 参考答案

1. 复用共同接口，并允许通过基类统一处理不同派生类。
2. 基类不提供实现，要求派生类实现。
3. 允许运行时根据实际对象类型调用对应实现。
4. 明确声明重写父类虚函数，并让编译器检查签名。
5. `PathGeneration`。
6. `Task`。
7. 因为 Task 声明了虚函数，派生类可以重写，运行时发生动态分发。
8. 告诉插件管理器该类型是可创建并可按基类加载的插件。
9. 基类规定统一能力，具体类实现差异化业务。
10. 它允许上层框架不依赖具体类，只根据配置加载和运行对应插件。

## 13. 过关检查

- [ ] 能画出 Task->PathGeneration->LaneFollowPath。
- [ ] 能解释 virtual 和 override。
- [ ] 能找到插件注册宏。
- [ ] 十道题至少答对八道。

## 14. 下一课衔接

下一课学习 `vector` 和智能指针，解释 Stage 为什么能用 `task_list_` 保存多个任务，以及 Planning 如何安全管理对象生命周期。