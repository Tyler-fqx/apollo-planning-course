# 第 04 课：C++ 变量、函数与条件

> 学生自学版。只学习读懂 Task 和 Stage 所需的最基础语法。

## 1. 学习信息

- 预计用时：80～110 分钟。
- 难度：入门。
- 前置：第 03 课。
- 代码基线：`d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。

## 2. 学完本课应能做到

- [ ] 看懂变量、类型、函数参数和返回值。
- [ ] 看懂 `bool`、`int`、`double`、`std::string`。
- [ ] 看懂 `if`、`return` 和基本逻辑判断。
- [ ] 阅读 `Task::Init` 的初始化代码。
- [ ] 理解为什么函数会把一部分值返回、一部分值保存到对象里。

## 3. 从 Task 开始理解函数

> 源码位置：`modules/planning/planning_interface_base/task_base/task.h`，约第 37～56 行。

```cpp
// 源码位置：task.h，约第 37 行
class Task {
 public:
  // 返回 bool：成功返回 true，失败返回 false
  virtual bool Init(const std::string& config_dir,
                    const std::string& name,
                    const std::shared_ptr<DependencyInjector>& injector);

  // 返回 Status：包含成功或失败状态，以及失败原因
  virtual common::Status Execute(Frame* frame,
                                 ReferenceLineInfo* reference_line_info);
};
```

函数可以拆成四部分：

```text
返回值类型 函数名(参数列表)
bool       Init   (config_dir, name, injector)
```

## 4. 常见变量类型

| 类型 | 含义 | Apollo 例子 |
| --- | --- | --- |
| `bool` | 真或假 | `Init` 是否成功 |
| `int` | 整数 | 循环计数、索引 |
| `double` | 小数 | 速度、距离、角度 |
| `float` | 单精度小数 | 某些配置或算法参数 |
| `std::string` | 字符串 | Task 名称、配置路径 |
| `auto` | 让编译器推断类型 | 遍历容器时的局部变量 |

示例：

```cpp
// 教学代码：不同类型的变量
bool initialized = false;       // 表示任务是否初始化完成
int count = 0;                  // 表示已经执行的任务数量
double speed_limit = 5.0;       // 表示限速，单位 m/s
std::string task_name = "LANE_FOLLOW_PATH";  // 任务名称
```

## 5. 从源码看变量初始化

> 源码位置：`modules/planning/planning_interface_base/task_base/task.cc`，约第 40～57 行。

```cpp
// 源码位置：task.cc，约第 40 行
bool Task::Init(const std::string& config_dir, const std::string& name,
                const std::shared_ptr<DependencyInjector>& injector) {
  // 保存依赖注入器，后续 Task 可以从它获取车辆状态、历史信息等对象
  injector_ = injector;

  // 保存任务名称
  name_ = name;

  // 拼接该 Task 的配置文件路径
  config_path_ =
      config_dir + "/" + ConfigUtil::TransformToPathName(name) + ".pb.txt";

  // status 用于接收 C++ ABI 解码函数的执行状态
  int status;

  // typeid(*this).name() 能拿到当前具体类的运行时名称
  std::string class_name =
      abi::__cxa_demangle(typeid(*this).name(), 0, 0, &status);

  // 通过插件管理器找到该类默认的配置文件路径
  default_config_path_ =
      apollo::cyber::plugin_manager::PluginManager::Instance()
          ->GetPluginConfPath<Task>(class_name, "conf/default_conf.pb.txt");

  // 初始化成功
  return true;
}
```

初学者暂时只关注：

- `=` 是赋值。
- `+` 可以拼接字符串。
- `&status` 表示把变量地址传给函数，后续第 05 课会详细讲。
- `return true` 表示函数返回成功。

## 6. 条件判断

> 源码位置：`modules/planning/planning_interface_base/task_base/task.cc`，约第 60～68 行。

```cpp
// 源码位置：task.cc，约第 60 行
Status Task::Execute(Frame* frame, ReferenceLineInfo* reference_line_info) {
  // 保存输入对象地址，方便后续成员函数使用
  frame_ = frame;
  reference_line_info_ = reference_line_info;

  // 返回 OK 状态，表示基础 Execute 没有错误
  return Status::OK();
}

// 另一个重载版本：只接收 Frame
Status Task::Execute(Frame* frame) {
  frame_ = frame;
  return Status::OK();
}
```

条件判断示例：

```cpp
// 教学代码：判断任务是否收到有效输入
if (frame == nullptr) {
  return common::Status(common::ErrorCode::PLANNING_ERROR, "frame is null");
}

if (!ret.ok()) {
  return ret;
}
```

解释：

- `== nullptr` 判断指针是否为空。
- `!ret.ok()` 表示“如果状态不是成功”。
- `return` 立即结束当前函数并返回结果。

## 7. 动手实验

在源码中搜索：

```powershell
rg -n "bool Task::Init|Status Task::Execute|return true|Status::OK" modules\planning\planning_interface_base\task_base\task.cc
```

完成下列填空：

```text
Task::Init 的返回类型是：________
Task::Execute 的参数之一是：________
task_name 在源码中对应的成员变量是：________
初始化成功时返回：________
```

小练习：

```cpp
// 请补全注释
double max_speed = 8.0;
if (max_speed > 5.0) {
  // 这里说明什么？
}
```

## 8. 自测题

1. `bool` 类型可以表示什么？
2. `double` 适合保存什么数据？
3. 函数最前面的 `bool` 表示什么？
4. `return true` 表示什么？
5. `if (!ret.ok())` 中 `!` 的含义是什么？
6. `Task::Init` 为什么需要保存 `name_`？
7. `config_path_` 用来做什么？
8. `auto` 的作用是什么？
9. 函数参数中的 `&` 暂时可以理解成什么？
10. `Task::Execute` 返回 `Status` 比只返回 `bool` 有什么好处？

## 9. 参考答案

1. 真或假。
2. 速度、距离、角度等需要小数精度的数据。
3. 该函数的返回类型是布尔值。
4. 函数返回成功。
5. 逻辑取反，表示“状态不是成功”。
6. 用于生成配置路径和标识当前 Task。
7. 指向当前 Task 的配置文件。
8. 让编译器根据右侧表达式推断变量类型。
9. 表示引用或传地址，后面会正式学习。
10. Status 可以同时携带成功/失败状态和失败原因。

## 10. 过关检查

- [ ] 能识别函数返回类型。
- [ ] 能读懂简单 if 和 return。
- [ ] 能解释 config_path_ 的作用。
- [ ] 十道题至少答对八道。

## 11. 下一课衔接

下一课专门讲指针。会用 `Frame*`、`&frame` 和 `frame->` 这三个写法，建立最关键的地址概念。