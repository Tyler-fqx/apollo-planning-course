# 第 13 课：Task 基类与生命周期

> 学生自学版。本课不关心某个算法，只关心所有 Task 共有的结构和执行方式。

## 1. 学习信息

- 预计用时：80～110 分钟。
- 难度：核心。
- 前置：第 12 课。
- 代码基线：`d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。

## 2. 学完本课应能做到

- [ ] 说明 `Task::Init` 和 `Task::Execute` 的职责。
- [ ] 读懂 `frame_`、`reference_line_info_`、`injector_`。
- [ ] 理解配置路径如何生成。
- [ ] 区分基类 Execute 和具体 Task 的 Process。
- [ ] 知道新增 Task 时最少要写哪些方法。

## 3. Task 的类定义

> 源码位置：`modules/planning/planning_interface_base/task_base/task.h`，约第 37～70 行。

```cpp
// 源码位置：task.h，约第 37 行
class Task {
 public:
  Task();
  virtual ~Task() = default;

  const std::string& Name() const;

  // 初始化：接收配置目录、任务名和依赖注入器
  virtual bool Init(const std::string& config_dir, const std::string& name,
                    const std::shared_ptr<DependencyInjector>& injector);

  // 执行：处理 Frame 和 ReferenceLineInfo
  virtual common::Status Execute(Frame* frame,
                                 ReferenceLineInfo* reference_line_info);

  virtual common::Status Execute(Frame* frame);

 protected:
  // 从配置文件加载 T 类型参数
  template <typename T>
  bool LoadConfig(T* config);

  // 当前轮次上下文
  Frame* frame_;
  ReferenceLineInfo* reference_line_info_;

  // 公共依赖
  std::shared_ptr<DependencyInjector> injector_;

  // 配置路径和名称
  std::string config_path_;
  std::string default_config_path_;
  std::string name_;
};
```

## 4. Task 初始化

> 源码位置：`modules/planning/planning_interface_base/task_base/task.cc`，约第 40～57 行。

```cpp
// 源码位置：task.cc，约第 40 行
bool Task::Init(const std::string& config_dir, const std::string& name,
                const std::shared_ptr<DependencyInjector>& injector) {
  // 保存公共依赖，后续 Execute 中可以直接使用
  injector_ = injector;

  // 保存任务名称
  name_ = name;

  // 根据配置目录和任务名称生成实例配置路径
  config_path_ =
      config_dir + "/" + ConfigUtil::TransformToPathName(name) + ".pb.txt";

  // 取得当前具体类的完整名称
  int status;
  std::string class_name =
      abi::__cxa_demangle(typeid(*this).name(), 0, 0, &status);

  // 找到插件默认配置
  default_config_path_ =
      apollo::cyber::plugin_manager::PluginManager::Instance()
          ->GetPluginConfPath<Task>(class_name, "conf/default_conf.pb.txt");

  return true;
}
```

生命周期第一阶段：

```text
创建 Task
  -> 调用 Init
  -> 保存依赖、名称、配置路径
```

## 5. Task 执行

> 源码位置：`modules/planning/planning_interface_base/task_base/task.cc`，约第 60～68 行。

```cpp
// 源码位置：task.cc，约第 60 行
Status Task::Execute(Frame* frame, ReferenceLineInfo* reference_line_info) {
  // 保存本轮 Frame 地址，具体 Process 中可以读取和修改
  frame_ = frame;

  // 保存当前参考线信息
  reference_line_info_ = reference_line_info;

  // 基础 Task 默认返回成功
  return Status::OK();
}
```

但对于具体算法 Task，通常不会直接重写 `Task::Execute`，而是通过 `PathGeneration` 或 `Decider` 的基类流程调用 `Process`。

## 6. PathGeneration 和 Decider

> 源码位置：
> - `modules/planning/planning_interface_base/task_base/common/path_generation.h`，约第 31～43 行。
> - `modules/planning/planning_interface_base/task_base/common/decider.h`，约第 32～43 行。

```cpp
// 源码位置：path_generation.h，约第 31 行
class PathGeneration : public Task {
 public:
  apollo::common::Status Execute(
      Frame* frame, ReferenceLineInfo* reference_line_info) override;

 protected:
  virtual apollo::common::Status Process(
      Frame* frame, ReferenceLineInfo* reference_line_info) {
    return apollo::common::Status::OK();
  }
};

// 源码位置：decider.h，约第 32 行
class Decider : public Task {
 public:
  apollo::common::Status Execute(
      Frame* frame, ReferenceLineInfo* reference_line_info) override;
};
```

可以理解为：

```text
Task 定义统一生命周期
PathGeneration / Decider 补充中间流程
具体 Task 实现 Process
```

## 7. 新增 Task 的最低结构

教学伪代码：

```cpp
// 教学示例，不是官方源码
class MyTask : public Decider {
 public:
  bool Init(const std::string& config_dir, const std::string& name,
            const std::shared_ptr<DependencyInjector>& injector) override {
    if (!Decider::Init(config_dir, name, injector)) {
      return false;
    }
    return Decider::LoadConfig<MyTaskConfig>(&config_);
  }

 private:
  common::Status Process(Frame* frame,
                         ReferenceLineInfo* reference_line_info) override {
    // 在这里读取 Frame、产生日志或修改规划决策
    return common::Status::OK();
  }

  MyTaskConfig config_;
};

// 注册为插件
CYBER_PLUGIN_MANAGER_REGISTER_PLUGIN(apollo::planning::MyTask, Task)
```

## 8. 动手实验

```powershell
rg -n "class Task|bool Init|Status Execute|Frame\* frame_|ReferenceLineInfo\* reference_line_info_|std::shared_ptr<DependencyInjector>" modules\planning\planning_interface_base\task_base\task.h
rg -n "Task::Init|Task::Execute|config_path_|default_config_path_" modules\planning\planning_interface_base\task_base\task.cc
rg -n "class PathGeneration|class Decider|virtual common::Status Process" modules\planning\planning_interface_base\task_base\common
```

填写生命周期：

```text
创建对象
  -> __________________
  -> __________________
  -> __________________
```

## 9. 常见错误

- 只写 `Process`，忘记 `Init`。
- 忘记调用父类 `Init`。
- 忘记加载配置文件。
- 忘记插件注册。
- 直接在 `Execute` 中写复杂逻辑，忽略基类框架的职责。

## 10. 自测题

1. Task 的两个生命周期方法是什么？
2. `Init` 保存哪些关键信息？
3. `Execute` 为什么要保存 `frame_`？
4. `injector_` 提供什么？
5. `config_path_` 和 `default_config_path_` 有什么区别？
6. `PathGeneration` 和 `Decider` 的直接父类是什么？
7. 具体路径 Task 通常实现哪个函数？
8. 新增 Task 为什么需要插件注册？
9. `Status::OK()` 表示什么？
10. 用一句话概括 Task 生命周期。

## 11. 参考答案

1. `Init` 和 `Execute`。
2. 配置目录、任务名称、依赖注入器、配置路径。
3. 后续成员函数可以通过 `frame_` 访问本轮规划上下文。
4. 车辆状态、历史信息、规划上下文等公共依赖。
5. `config_path_` 是实例配置路径，`default_config_path_` 是插件默认配置路径。
6. Task。
7. `Process`。
8. 让框架能按配置中的 type 创建这个 Task。
9. 执行成功。
10. Init 完成配置和依赖准备，Execute 进入任务处理流程。

## 12. 过关检查

- [ ] 能解释 Task 生命周期。
- [ ] 能找到三个关键成员变量。
- [ ] 能解释 Process 和 Execute 的关系。
- [ ] 十道题至少答对八道。

## 13. 下一课衔接

下一课进入真实路径 Task：`LaneFollowPath`。你会看到“路径边界 -> 优化 -> 评估 -> 写入 ReferenceLineInfo”的完整步骤。