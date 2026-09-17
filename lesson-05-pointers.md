# 第 05 课：C++ 指针基础

> 学生自学版。指针是阅读 Task 最容易卡住的地方，本课只讲读懂 Planning 必须掌握的三种操作。

## 1. 学习信息

- 预计用时：100～140 分钟。
- 难度：基础。
- 前置：第 04 课。
- 代码基线：`d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。

## 2. 学完本课应能做到

- [ ] 解释变量和地址的关系。
- [ ] 识别 `Frame*`、`&frame`、`*frame`、`frame->`。
- [ ] 理解空指针 `nullptr`。
- [ ] 阅读 `Task::Execute(Frame* frame, ...)`。
- [ ] 说明为什么 Task 需要操作原始 Frame，而不是复制一份。

## 3. 变量与地址

变量不仅保存值，还位于内存中的某个地址。

```text
变量名 frame
  -> 地址 0x1234
  -> 内容：一个 Frame 对象
```

指针保存的不是对象本身，而是对象地址。

```text
Frame* frame_ptr
  -> 保存地址 0x1234
  -> 通过这个地址可以找到 Frame 对象
```

<figure class="lesson-illustration">
  <img src="assets/images/cpp-pointers-comic.webp" alt="C++ 指针、引用和空指针的漫画示意" loading="lazy">
  <figcaption><strong>漫画图 4：</strong>指针箭头指向真实对象，引用像对象的第二个名字，空指针则像一个没有对象的空门。</figcaption>
</figure>
## 4. 指针声明

> 源码位置：`modules/planning/planning_interface_base/task_base/task.h`，约第 49～51 行。

```cpp
// 源码位置：task.h，约第 49 行
class Task {
 public:
  // Frame* 表示“指向 Frame 的指针”
  virtual common::Status Execute(Frame* frame,
                                 ReferenceLineInfo* reference_line_info);

 protected:
  // 保存当前 Task 正在处理的 Frame 地址
  Frame* frame_;

  // 保存当前参考线信息地址
  ReferenceLineInfo* reference_line_info_;
};
```

`Frame* frame` 可以读作：

```text
frame 是一个指针，它指向一个 Frame 对象
```

## 5. 取地址 `&`

> 源码位置：`modules/planning/planning_interface_base/scenario_base/stage.cc`，约第 121～124 行。

```cpp
// 源码位置：stage.cc，约第 121 行
for (auto task : task_list_) {
  // &reference_line_info 表示把当前对象的地址传给 Execute
  ret = task->Execute(frame, &reference_line_info);
}
```

解释：

- `reference_line_info` 是一个对象。
- `&reference_line_info` 得到这个对象的地址。
- `Task::Execute` 需要 `ReferenceLineInfo*`，所以传地址。

## 6. 解引用 `*`

```cpp
// 教学代码：解引用
Frame* frame_ptr = &frame;  // 取得 frame 的地址
Frame& frame_ref = *frame_ptr;  // 通过地址找回真正的 Frame 对象
```

区分：

| 写法 | 含义 |
| --- | --- |
| `&frame` | 取得 frame 的地址 |
| `frame_ptr` | 地址本身 |
| `*frame_ptr` | 地址指向的对象 |
| `frame_ptr->method()` | 通过地址调用对象的成员函数 |

## 7. 箭头运算符 `->`

> 源码位置：`modules/planning/planning_interface_base/scenario_base/stage.cc`，约第 104～110 行。

```cpp
// 源码位置：stage.cc，约第 104 行
if (frame->reference_line_info().empty()) {
  // frame 是指针，所以用 -> 访问 Frame 的成员函数
  return stage_result.SetStageStatus(StageStatusType::ERROR);
}

for (auto& reference_line_info : *frame->mutable_reference_line_info()) {
  // *frame->mutable_reference_line_info() 取出容器本身
  // auto& 表示遍历时直接引用容器中的对象
}
```

等价理解：

```cpp
frame->reference_line_info()
```

近似等于：

```cpp
(*frame).reference_line_info()
```

## 8. 空指针 `nullptr`

> 源码位置：`modules/planning/planning_interface_base/traffic_rules_base/traffic_decider.cc`，约第 74～81 行。

```cpp
// 源码位置：traffic_decider.cc，约第 74 行
Status TrafficDecider::Execute(Frame* frame,
                               ReferenceLineInfo* reference_line_info) {
  // 如果传入空指针，立即停止，避免后面访问非法地址
  CHECK_NOTNULL(frame);
  CHECK_NOTNULL(reference_line_info);

  // 遍历所有交通规则
  for (const auto& rule : rule_list_) {
    rule->ApplyRule(frame, reference_line_info);
  }
}
```

空指针表示：

```text
这个指针没有指向任何有效对象
```

对空指针使用 `->` 会导致程序崩溃，所以需要先检查。

## 9. 为什么 Task 不复制 Frame

Frame 包含本轮规划的大量数据和中间结果。

如果每个 Task 都复制一份 Frame：

- 内存开销大。
- 修改结果无法传回主流程。
- 不同 Task 无法共享同一个规划上下文。

因此使用：

```text
Frame* -> 让多个 Task 操作同一个 Frame
```

## 10. 动手实验

```powershell
rg -n "Execute\(Frame\*|Execute\(Frame\* const|Frame\* frame" modules\planning\planning_interface_base\task_base
rg -n "&reference_line_info|frame->|reference_line_info->" modules\planning\planning_interface_base\scenario_base\stage.cc
rg -n "CHECK_NOTNULL" modules\planning\planning_interface_base\traffic_rules_base\traffic_decider.cc
```

请写出三行代码分别完成：

```cpp
// 取得 frame 的地址
// 通过指针访问 Frame 的成员函数
// 判断指针是否为空
```

## 11. 常见错误

- 把 `*` 在声明中的含义和在表达式中的含义混淆。
- 忘记 `frame` 是指针，误写成 `frame.method()`。
- 不检查空指针就直接使用 `->`。
- 认为指针保存的是 Frame 的复制品。
- 混淆 `&frame` 和 `frame`。

## 12. 自测题

1. 指针保存的是什么？
2. `Frame*` 的含义是什么？
3. `&frame` 的含义是什么？
4. `*frame_ptr` 的含义是什么？
5. `frame->method()` 近似等价于什么？
6. `nullptr` 表示什么？
7. 为什么使用空指针会导致崩溃？
8. Task 为什么不复制 Frame？
9. `frame_` 后面的下划线通常代表什么？
10. 看到一个参数是 `Frame* frame`，应该怎样读？

## 13. 参考答案

1. 对象在内存中的地址。
2. 一个指向 Frame 对象的指针类型。
3. 取得变量 frame 的地址。
4. 取出指针指向的实际对象。
5. `(*frame).method()`。
6. 指针没有指向任何有效对象。
7. 因为 `->` 会访问空地址，导致非法内存访问。
8. 为了让多个 Task 共享并修改同一轮规划上下文。
9. 通常是成员变量命名习惯，用来和局部变量区分。
10. 传入的是 Frame 对象地址，函数可以直接读写这个 Frame。

## 14. 过关检查

- [ ] 能区分 `frame`、`&frame`、`*frame_ptr`、`frame->`。
- [ ] 能解释空指针风险。
- [ ] 能从 Task 基类找到 Frame 指针参数。
- [ ] 十道题至少答对八道。

## 15. 下一课衔接

下一课讲引用和 `const`。你会看到 `const Frame&`、`const std::string&` 这些写法，并知道它们为什么比复制对象更高效。