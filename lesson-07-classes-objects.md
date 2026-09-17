# 第 07 课：类、对象与构造函数

> 学生自学版。用二维向量 `Vec2d` 学习类的基本结构，再回到 Task。

## 1. 学习信息

- 预计用时：100～140 分钟。
- 难度：基础。
- 前置：第 06 课。
- 代码基线：`d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。

## 2. 学完本课应能做到

- [ ] 解释类和对象的关系。
- [ ] 识别 public、protected、private。
- [ ] 看懂构造函数和成员初始化列表。
- [ ] 理解成员函数末尾的 `const`。
- [ ] 能把 `Vec2d` 的知识迁移到 Task 类。

## 3. 类和对象

类可以理解为图纸，对象是按图纸创建出来的实例。

```text
Vec2d 是类
Vec2d point(1.0, 2.0) 是对象
```

Apollo 中：

```text
Task 是基类接口
LaneFollowPath 是具体任务类
SpeedBoundsDecider 也是具体任务类
```

## 4. 阅读 Vec2d 类

> 源码位置：`modules/common/math/vec2d.h`，约第 37～112 行。

```cpp
// 源码位置：vec2d.h，约第 37 行
class Vec2d {
 public:
  // 构造函数：创建对象时把 x、y 保存到成员变量
  constexpr Vec2d(const double x, const double y) noexcept : x_(x), y_(y) {}

  // 默认构造函数：委托给 Vec2d(0, 0)
  constexpr Vec2d() noexcept : Vec2d(0, 0) {}

  // 读取 x，const 表示不会修改当前对象
  double x() const { return x_; }

  // 读取 y
  double y() const { return y_; }

  // 修改 x
  void set_x(const double x) { x_ = x; }

 protected:
  // 类的内部数据，外部不能直接访问
  double x_ = 0.0;
  double y_ = 0.0;
};
```

## 5. 构造函数

```cpp
// 教学代码
Vec2d origin;              // 调用无参构造，得到 (0, 0)
Vec2d point(3.0, 4.0);     // 调用有参构造，得到 (3, 4)
```

成员初始化列表：

```cpp
Vec2d(const double x, const double y) : x_(x), y_(y) {}
```

含义：

- 冒号前是构造函数。
- `x_(x)` 表示用参数 `x` 初始化成员 `x_`。
- `y_(y)` 同理。

## 6. 成员函数和封装

```cpp
// 教学代码
Vec2d point(1.0, 2.0);
double value = point.x();  // 通过 public 成员函数读取
point.set_x(5.0);          // 通过 public 成员函数修改
```

为什么不直接访问 `x_`？

```text
protected/private 数据由类控制
外部只能通过公开接口读写
```

这叫封装。

## 7. 成员函数末尾的 const

```cpp
double x() const { return x_; }
```

末尾 `const` 表示：

```text
这个成员函数不会修改对象自身
```

因此：

- 读取函数通常加 `const`。
- 修改函数如 `set_x` 不加 `const`。
- `const Vec2d& other` 只能调用其他对象的 const 成员函数。

## 8. 运算符重载

> 源码位置：`modules/common/math/vec2d.h`，约第 75～91 行。

```cpp
// 源码位置：vec2d.h，约第 75 行
// 两个 Vec2d 可以直接相减
Vec2d operator-(const Vec2d& other) const;

// 两个 Vec2d 可以直接相加
Vec2d operator+(const Vec2d& other) const;

// 判断两个 Vec2d 是否近似相等
bool operator==(const Vec2d& other) const;
```

这使得数学代码更自然：

```cpp
Vec2d c = a + b;
Vec2d delta = p2 - p1;
```

## 9. 回到 Task 类

> 源码位置：`modules/planning/tasks/lane_follow_path/lane_follow_path.h`，约第 30～56 行。

```cpp
// 源码位置：lane_follow_path.h，约第 30 行
class LaneFollowPath : public PathGeneration {
 public:
  // 初始化当前 Task，并加载自己的配置
  bool Init(const std::string& config_dir, const std::string& name,
            const std::shared_ptr<DependencyInjector>& injector) override;

 private:
  // 真正执行路径生成逻辑
  apollo::common::Status Process(
      Frame* frame, ReferenceLineInfo* reference_line_info) override;

  // 当前 LaneFollowPath 的配置对象
  LaneFollowPathConfig config_;
};
```

可以看到类里同时包含：

- 对外接口 `Init`。
- 核心逻辑 `Process`。
- 专属数据 `config_`。

## 10. 动手实验

```powershell
rg -n "class Vec2d|Vec2d\(|double x\(\)|operator\+|protected:" modules\common\math\vec2d.h
rg -n "class LaneFollowPath|bool Init|Status Process|Config config_" modules\planning\tasks\lane_follow_path\lane_follow_path.h
```

写一个自己的最小类：

```cpp
// 教学练习：二维点
class MyPoint {
 public:
  MyPoint(double x, double y) : x_(x), y_(y) {}
  double x() const { return x_; }
  double y() const { return y_; }

 private:
  double x_;
  double y_;
};
```

## 11. 常见错误

- 把类当成对象。
- 忘记构造函数可以在创建时初始化成员。
- 以为 `protected` 和 `public` 一样。
- 在只读 const 成员函数里修改成员变量。
- 直接访问类的私有数据，而不是使用公开方法。

## 12. 自测题

1. 类和对象有什么区别？
2. 构造函数什么时候执行？
3. 成员初始化列表是什么？
4. `public` 和 `protected` 的区别是什么？
5. 成员函数末尾 `const` 表示什么？
6. `x()` 为什么可以直接读取 `x_`？
7. 运算符重载解决了什么问题？
8. `LaneFollowPath` 中的 `config_` 表示什么？
9. `Init` 和 `Process` 在类中承担什么不同职责？
10. 为什么封装有利于大型项目维护？

## 13. 参考答案

1. 类是定义，对象是类的实例。
2. 创建对象时自动执行。
3. 在构造函数冒号后直接初始化成员变量。
4. public 对外可见，protected 主要给本类和子类使用。
5. 该函数不会修改对象自身。
6. 因为它是类自己的成员函数，可以访问内部成员。
7. 让自定义类型支持 `+`、`-`、`==` 等自然运算符。
8. 当前路径任务的配置参数。
9. Init 负责初始化，Process 负责实际执行。
10. 隐藏内部细节，提供稳定接口，减少外部代码误用。

## 14. 过关检查

- [ ] 能读懂一个简单类定义。
- [ ] 能解释构造函数。
- [ ] 能解释 const 成员函数。
- [ ] 能读出 Task 类中的接口和数据。
- [ ] 十道题至少答对八道。

## 15. 下一课衔接

下一课进入继承、虚函数和 `override`。你会明白 `LaneFollowPath : public PathGeneration` 到底是什么意思。