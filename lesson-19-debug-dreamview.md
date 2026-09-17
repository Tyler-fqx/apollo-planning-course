# 第 19 课：日志与 DreamView 调试

> 学生自学版。调试的本质是用证据定位问题，而不是反复猜。

## 1. 学习信息

- 预计用时：100～140 分钟。
- 难度：实践。
- 前置：第 18 课。
- 环境：Linux + Docker + AEM + DreamView。

## 2. 学完本课应能做到

- [ ] 区分 `AINFO`、`ADEBUG`、`AWARN`、`AERROR`。
- [ ] 在 Stage 和 Task 周围添加日志。
- [ ] 观察 Planning 输入输出 channel。
- [ ] 使用 DreamView 查看模块状态和轨迹。
- [ ] 按“输入 → 场景 → 任务 → 输出”顺序排查问题。

## 3. 日志类型

| 日志 | 用途 |
| --- | --- |
| `ADEBUG` | 详细调试信息，常见于每次 Task 执行 |
| `AINFO` | 正常运行信息、关键状态 |
| `AWARN` | 可能有问题，但程序还能继续 |
| `AERROR` | 明确错误，通常需要处理 |

> 源码位置：`modules/planning/scenarios/lane_follow/lane_follow_stage.cc`，约第 148～161 行。

```cpp
// 源码位置：lane_follow_stage.cc，约第 148 行
const double start_timestamp = Clock::NowInSeconds();

// 执行当前任务
ret.SetTaskStatus(task->Execute(frame, reference_line_info));

// 记录任务结束时间
const double end_timestamp = Clock::NowInSeconds();

// 计算任务耗时，单位毫秒
const double time_diff_ms = (end_timestamp - start_timestamp) * 1000;

// ADEBUG：输出任务名称和耗时
ADEBUG << task->Name() << " time spend: " << time_diff_ms << " ms.";

// AINFO：用于规划性能统计
AINFO << "Planning Perf: task name [" << task->Name() << "], "
      << time_diff_ms << " ms.";
```

## 4. 错误日志

> 源码位置：`modules/planning/planning_interface_base/scenario_base/stage.cc`，约第 135～139 行。

```cpp
// 源码位置：stage.cc，约第 135 行
if (!ret.ok()) {
  // 保存失败状态
  stage_result.SetTaskStatus(ret);

  // 输出哪个 Task 失败，以及失败原因
  AERROR << "Failed to run tasks[" << task->Name()
         << "], Error message: " << ret.error_message();
  break;
}
```

推荐日志格式：

```cpp
AINFO << "[MyTask] frame=" << frame->SequenceNum()
      << " speed=" << injector_->vehicle_state()->linear_velocity()
      << " action=before-check";
```

好的日志应该包含任务名、帧号或时间戳、关键输入值、判断结果和使用配置。

## 5. DreamView 的作用

启动：

```bash
aem bootstrap start --plus
```

访问：

```text
http://localhost:8888/
```

DreamView 用来观察模块是否启动、Planning 是否有输入和输出、车辆位置和参考线、规划轨迹是否更新，以及仿真场景是否正确加载。

DreamView 不是日志替代品。轨迹异常时仍要回到源码和日志。

<figure class="lesson-illustration">
  <img src="assets/images/debug-detective-comic.webp" alt="使用日志、DreamView 和规划流水线排查问题的漫画示意" loading="lazy">
  <figcaption><strong>漫画图 6：</strong>调试像侦探工作：先看输入和日志，再看 DreamView 和轨迹，最后定位到失败的具体 Task。</figcaption>
</figure>
## 6. 调试顺序

固定按下面顺序排查：

```text
1. 输入有没有到
2. 时间戳是否新鲜
3. Frame 是否创建成功
4. 场景是否选对
5. Stage 是否进入
6. Task 是否执行
7. 哪个 Task 返回失败
8. 轨迹是否发布
```

不要一开始就在最深层的优化器里加十条日志。先确认上游是否正常。

## 7. 检查输入和输出 channel

如果当前 Apollo Cyber 工具集可用，可以使用内置监控工具查看 channel，例如：

```bash
cyber_monitor
```

重点观察：

```text
/apollo/localization/pose
/apollo/canbus/chassis
/apollo/prediction
/apollo/planning
```

如果命令或工具名因版本不同而变化，使用当前版本帮助信息确认，不盲目复制旧教程命令。

## 8. 查看日志

日志通常位于 Apollo 数据目录。不同版本的目录可能不同，先确认当前环境。

示例：

```bash
rg "Planning Perf|Failed to run tasks|LoggingProbe" /opt/apollo/neo/data/log
```

只看最近内容：

```bash
tail -f /opt/apollo/neo/data/log/planning.log
```

如果路径不存在：

```bash
find /opt/apollo/neo/data/log -maxdepth 2 -type f | head
```

先找到真实日志文件，再执行 `tail`。

## 9. 动手实验

### 实验 A：观察任务耗时

```bash
rg "Planning Perf" /opt/apollo/neo/data/log
```

记录：

| Task 名称 | 耗时 | 是否异常 |
| --- | --- | --- |
|  |  |  |

### 实验 B：在日志 Task 中输出帧号

```cpp
// 教学改动：放在 LoggingProbe::Process 中
AINFO << "[LoggingProbe] frame=" << frame->SequenceNum()
      << " planning_start=" << frame->PlanningStartPoint().DebugString();
```

### 实验 C：观察 DreamView

- [ ] Planning 模块显示正常。
- [ ] 车辆在场景中移动。
- [ ] 规划轨迹持续更新。
- [ ] 修改日志 Task 后日志有对应输出。

## 10. 常见错误

- 只看最终报错，不看第一条错误。
- 日志级别设得太低，看不到 ADEBUG。
- 代码改了但没有重新编译。
- 查的是旧日志。
- 只看 DreamView 界面，不检查输入时间戳。
- 在不同版本中使用错误的日志目录。

## 11. 自测题

1. 四种日志级别分别适合什么信息？
2. 任务耗时通常使用哪个时钟接口？
3. 某 Task 失败时，Stage 会记录什么？
4. 好的调试日志至少包含哪些信息？
5. DreamView 可以观察什么？
6. 调试时为什么先检查输入？
7. `/apollo/planning` 是什么输出？
8. 推荐按什么顺序定位失败？
9. 日志文件路径不确定时怎么做？
10. 什么证据能证明 Task 真的执行了？

## 12. 参考答案

1. ADEBUG 详细调试，AINFO 正常关键信息，AWARN 警告，AERROR 错误。
2. `Clock::NowInSeconds()`。
3. Task 名称和错误原因。
4. 任务名、帧号/时间、关键输入、判断结果和配置。
5. 模块状态、输入输出、车辆、参考线和轨迹。
6. 如果上游输入缺失或过期，深层算法无法正常工作。
7. Planning 发布给控制模块的 ADCTrajectory。
8. 输入、Frame、场景、Stage、Task、轨迹发布。
9. 先 `find` 日志目录和文件，再选择真实路径。
10. 有指定关键字的日志、帧号递增，并且对应新编译版本。

## 13. 过关检查

- [ ] 能找到任务耗时日志。
- [ ] 能在自己的 Task 中加入有效日志。
- [ ] 能用 DreamView 观察规划轨迹。
- [ ] 能按顺序排查一个 Planning 失败。
- [ ] 十道题至少答对八道。

## 14. 下一课衔接

最后一课完成一个小型限速功能：增加可配置限速上限，把它写入速度限制点，并验证修改前后行为。