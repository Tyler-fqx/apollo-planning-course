# 第 06 课：C++ 引用与 const

> 学生自学版。本课解释 Planning 中大量出现的 `const T&`，并区分指针和引用。

## 1. 学习信息

- 预计用时：90～120 分钟。
- 难度：基础。
- 前置：第 05 课。
- 代码基线：`d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。

## 2. 学完本课应能做到

- [ ] 解释引用是什么。
- [ ] 区分 `T*`、`T&`、`const T&`。
- [ ] 阅读 `const std::string&` 参数。
- [ ] 阅读 `Scenario::IsTransferable(..., const Frame& frame)`。
- [ ] 理解 `const` 为什么能保护输入不被修改。

## 3. 引用是什么

引用是对象的别名。

```cpp
// 教学代码：引用
int speed = 5;       // 原始变量
int& speed_ref = speed;  // speed_ref 是 speed 的另一个名字

speed_ref = 8;       // 修改引用，也就是修改 speed
```

结果：

```text
speed == 8
```

引用必须先绑定到一个已有对象，不能像空指针一样悬空。

## 4. 指针和引用对比

| 写法 | 含义 | 是否可以为空 | 是否可重新指向 |
| --- | --- | --- | --- |
| `T*` | 指向对象的指针 | 可以 `nullptr` | 可以 |
| `T&` | 对象的引用别名 | 正常使用下不可为空 | 不可以 |
| `const T&` | 只读引用 | 正常使用下不可为空 | 不可以 |

Apollo 常用规则：

```text
需要直接修改对象 -> 使用 T* 或 T&
只读访问大对象   -> 使用 const T&
允许为空         -> 使用 T*
```

## 5. `const std::string&` 参数

> 源码位置：`modules/planning/planning_interface_base/task_base/task.h`，约第 45～47 行。

```cpp
// 源码位置：task.h，约第 45 行
virtual bool Init(const std::string& config_dir,
                  const std::string& name,
                  const std::shared_ptr<DependencyInjector>& injector);
```

逐项解释：

- `std::string`：字符串对象。
- `const`：函数内部不能改这个字符串。
- `&`：使用引用，不复制字符串。
- 综合含义：以只读方式引用一个字符串。

为什么这样做：

- 避免复制长字符串，效率更高。
- 防止初始化函数误改名字或目录。
- 调用者可以继续使用原对象。

## 6. `const Frame&` 只读上下文

> 源码位置：`modules/planning/planning_interface_base/scenario_base/scenario.h`，约第 70～72 行。

```cpp
// 源码位置：scenario.h，约第 70 行
virtual bool IsTransferable(const Scenario* other_scenario,
                            const Frame& frame) {
  // 这里只判断是否允许切换场景
  // const Frame& 表示不能通过 frame 修改 Frame
  return false;
}
```

理解：

```text
IsTransferable 负责阅读 Frame 并作出判断
它不应该修改 Frame
```

## 7. 什么时候使用指针

> 源码位置：`modules/planning/planning_interface_base/task_base/task.h`，约第 49～50 行。

```cpp
// 源码位置：task.h，约第 49 行
virtual common::Status Execute(Frame* frame,
                               ReferenceLineInfo* reference_line_info);
```

Task 需要读写 Frame 和 ReferenceLineInfo，因此使用可以修改目标对象的指针。

一句话区分：

```text
const Frame& -> 只读输入
Frame*       -> 可读写、可以为空、需要共享修改结果
```

## 8. 动手实验

```powershell
rg -n "const std::string&|const Frame&|const Scenario\*" modules\planning\planning_interface_base -g '*.h'
rg -n "Frame\*|ReferenceLineInfo\*" modules\planning\planning_interface_base\task_base\task.h
```

填写表格：

| 写法 | 只读还是可修改 | 是否可能为空 |
| --- | --- | --- |
| `const Frame& frame` |  |  |
| `Frame* frame` |  |  |
| `const std::string& name` |  |  |

## 9. 自测题

1. 引用是什么？
2. 引用和指针最重要的区别是什么？
3. `const` 的作用是什么？
4. `const std::string&` 为什么适合作为只读参数？
5. `const Frame&` 能否修改 Frame？
6. Task 为什么使用 `Frame*`？
7. `T&` 是否可以重新绑定到另一个对象？
8. 为什么只读引用能减少复制？
9. `const Scenario* other_scenario` 中，const 限制的是什么？
10. 看到 `const T&` 时应该怎样理解？

## 10. 参考答案

1. 对象或变量的别名。
2. 引用必须绑定对象且不能重新绑定；指针可空、可改指向。
3. 限制通过该接口修改对象。
4. 不复制字符串，同时防止误修改。
5. 不能。
6. 因为 Task 需要读写 Frame，并且多个任务共享同一个 Frame。
7. 不可以。
8. 引用直接访问原对象，不需要构造副本。
9. 不能通过这个指针修改它指向的 Scenario 对象。
10. 以只读方式引用对象，不复制且不修改。

## 11. 过关检查

- [ ] 能区分 `T*`、`T&`、`const T&`。
- [ ] 能解释 `const std::string&`。
- [ ] 能找到 `const Frame&` 实例。
- [ ] 十道题至少答对八道。

## 12. 下一课衔接

下一课用 `Vec2d` 学习类、对象、构造函数和成员函数，建立阅读 Task 类的基础。