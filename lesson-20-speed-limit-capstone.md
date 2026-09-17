# 第 20 课：小型限速功能实战

> 学生自学版期末项目。目标不是写复杂优化器，而是完成一次可解释、可验证的小修改。

## 1. 项目目标

在速度边界计算中增加一个可配置速度上限：

```text
如果配置 region_speed_cap > 0
    当前速度限制 = min(当前速度限制, region_speed_cap)
```

注意：下面的改动是教学方案，不是官方已有实现。必须以你的实际分支和 Proto 构建方式为准。

## 2. 前置知识

- [ ] 会读 `SpeedBoundsDecider`。
- [ ] 知道速度限制在路径上的表示方式。
- [ ] 会修改配置和 Proto 字段。
- [ ] 会编译 Planning。
- [ ] 会使用日志和 DreamView 验证。

## 3. 找到修改点

> 源码位置：`modules/planning/tasks/speed_bounds_decider/speed_limit_decider.cc`，约第 45～171 行。

关键位置：

```cpp
// 源码位置：speed_limit_decider.cc，约第 149～167 行
double curr_speed_limit = 0.0;

if (speed_limit_from_nearby_obstacles <
    std::numeric_limits<double>::max()) {
  curr_speed_limit =
      std::max(speed_bounds_config_.lowest_speed(),
               std::min({speed_limit_from_reference_line,
                         speed_limit_from_centripetal_acc,
                         speed_limit_from_nearby_obstacles}));
} else {
  curr_speed_limit =
      std::max(speed_bounds_config_.lowest_speed(),
               std::min({speed_limit_from_reference_line,
                         speed_limit_from_centripetal_acc}));
}

speed_limit_data->AppendSpeedLimit(path_s, curr_speed_limit);
```

本项目的插入位置：

```text
计算出 curr_speed_limit 之后
AppendSpeedLimit 之前
```

## 4. 第一步：增加配置字段

> 教学改动位置：`modules/planning/tasks/speed_bounds_decider/proto/speed_bounds_decider.proto`

现有配置包含 `total_time`、`boundary_buffer`、`max_centric_acceleration_limit`、`lowest_speed` 等。

教学增加：

```proto
// 教学改动：区域速度上限，单位 m/s
// 默认值为 0，表示不启用额外限速
optional double region_speed_cap = 13 [default = 0.0];
```

为什么用 13：

```text
不能和已有字段编号重复
Proto 字段号一旦发布，不应随便改号
```

## 5. 第二步：修改配置

> 教学改动位置：`modules/planning/tasks/speed_bounds_decider/conf/default_conf.pb.txt`

```text
# 教学改动：启用 m/s 的区域速度上限
region_speed_cap: 4.5
```

注意单位：Apollo 内部速度大量使用 m/s，界面显示常常是 km/h。4.5 m/s 约等于 16.2 km/h。

## 6. 第三步：修改速度限制逻辑

> 教学改动位置：`modules/planning/tasks/speed_bounds_decider/speed_limit_decider.cc`，在 `curr_speed_limit` 计算后。

```cpp
// 教学改动：读取配置中的区域限速，0 表示关闭
const double region_speed_cap = speed_bounds_config_.region_speed_cap();

if (region_speed_cap > 0.0) {
  // 先记录原始限制，方便调试对比
  ADEBUG << "[RegionSpeedCap] s=" << path_s
         << " before=" << curr_speed_limit
         << " cap=" << region_speed_cap;

  // 不得超过区域速度上限
  curr_speed_limit = std::min(curr_speed_limit, region_speed_cap);

  // 记录应用后的限制
  ADEBUG << "[RegionSpeedCap] s=" << path_s
         << " after=" << curr_speed_limit;
}

// 原来的追加逻辑保持不变
speed_limit_data->AppendSpeedLimit(path_s, curr_speed_limit);
```

边界处理：

- 如果 `region_speed_cap <= 0`，保持原逻辑。
- 如果配置值大于地图限速，`min` 会自动选择地图限速。
- 如果配置值小于 `lowest_speed`，最终可能受最低速度影响，需要按项目要求决定优先级。

## 7. 第四步：处理最低速度语义

当前实现先用 `std::max(lowest_speed, ...)`，然后应用上限。

可能出现：

```text
lowest_speed = 0.5
region_speed_cap = 0.3
curr_speed_limit 先变成 >= 0.5
之后 min 后变成 0.3
```

因此需要明确：区域限速是否可以低于 `lowest_speed`。教学项目建议确保限速结果不低于最低速度：

```cpp
// 教学保护：最终结果不得低于配置的最低速度
curr_speed_limit =
    std::max(speed_bounds_config_.lowest_speed(), curr_speed_limit);
```

## 8. 第五步：编译

```bash
# 检查工作空间
cat .workspace.json

# 编译 Planning
buildtool build -p modules/planning
```

如果 Proto 修改后没有生成新头文件：

1. 确认 Proto BUILD 正确。
2. 清理对应构建缓存。
3. 重新执行 buildtool。
4. 检查生成文件路径。

## 9. 第六步：运行和验证

```bash
aem bootstrap start --plus
```

打开 `http://localhost:8888/`。

验证：

- [ ] Planning 能正常启动。
- [ ] 没有 Proto 或配置加载错误。
- [ ] 仿真车辆能移动。
- [ ] 日志中出现 `[RegionSpeedCap]`。
- [ ] 轨迹仍然连续。
- [ ] 关闭限速后行为恢复。

查看日志：

```bash
rg "RegionSpeedCap|GetSpeedLimits failed|PLANNING_ERROR" /opt/apollo/neo/data/log
```

## 10. 对比实验

至少做三组：

| 组别 | `region_speed_cap` | 预期 |
| --- | --- | --- |
| A | 0.0 | 原行为，不启用额外限速 |
| B | 4.5 | 速度限制明显降低但不急刹 |
| C | 1.0 | 更低限速，检查是否仍可平稳停车或行驶 |

记录最大轨迹速度、是否出现急刹、日志是否正常。

## 11. 回退方案

比赛或课程代码必须可以撤销：

```bash
git diff
git status
```

只修改以下文件：

```text
modules/planning/tasks/speed_bounds_decider/proto/speed_bounds_decider.proto
modules/planning/tasks/speed_bounds_decider/conf/default_conf.pb.txt
modules/planning/tasks/speed_bounds_decider/speed_limit_decider.cc
```

不要顺手重构其他逻辑。

## 12. 常见错误

- 忘记修改 Proto 字段号。
- 忘记重新生成 Proto。
- 把 m/s 和 km/h 混用。
- 限速低于车辆最低速度，导致行为不符合预期。
- 只在日志中看到配置，却看不到速度点变化。
- 没做关闭配置的对照实验。
- 直接修改比赛主分支，没有保留回退点。

## 13. 项目交付物

- [ ] 修改文件清单。
- [ ] 配置值说明。
- [ ] 编译成功证据。
- [ ] 三组对照实验。
- [ ] DreamView 截图或轨迹数据。
- [ ] 关键日志。
- [ ] 一段说明：为什么在 `SpeedLimitDecider` 中应用上限，而不是直接修改最终控制命令。

## 14. 自测题

1. 为什么要在 `SpeedLimitDecider` 层增加限速？
2. 为什么默认值应为 0？
3. 为什么不能复用已有 Proto 字段号？
4. 速度单位是什么？
5. `std::min` 在这里做什么？
6. 为什么还要考虑 `lowest_speed`？
7. 如何验证配置关闭时行为不变？
8. 编译失败时应先检查什么？
9. 本项目为什么不直接改控制模块？
10. 一个可接受的项目结果需要哪些证据？

## 15. 参考答案

1. 在速度优化之前收紧速度限制，影响会进入后续速度规划。
2. 0 可作为“未启用额外限速”的明确开关。
3. 字段号对应 Proto 二进制兼容性，重复或修改会破坏解析。
4. 内部通常使用 m/s。
5. 取原限制和区域上限中更小的值。
6. 防止限速结果低于系统允许的最低规划速度，导致不一致行为。
7. 设置 `region_speed_cap: 0.0` 并比较修改前后轨迹和日志。
8. Proto 字段、配置、BUILD 依赖和工作空间是否切换成功。
9. 控制应在规划轨迹确定后执行，Planning 应该先给出受限轨迹。
10. 能编译、能运行、能解释、能对比，并保存日志和轨迹证据。

## 16. 最终过关检查

- [ ] 我理解整个 Planning 数据流。
- [ ] 我能找到 Scenario、Stage 和 Task 的关系。
- [ ] 我能读懂指针、引用、类和继承。
- [ ] 我能说明本次修改的输入和输出。
- [ ] 我知道如何安全回退修改。
- [ ] 我有编译、日志和仿真三层证据。

完成本课后，建议重新回顾第 02、03、10～17 课，并把整个系统用一张图讲给自己听。