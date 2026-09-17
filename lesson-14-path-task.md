# 第 14 课：路径 Task 示例 LaneFollowPath

> 学生自学版。重点理解路径任务怎样从自车、参考线和障碍物生成候选路径。

## 1. 学习信息

- 预计用时：120～160 分钟。
- 难度：核心。
- 前置：第 13 课。
- 代码基线：`d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。

## 2. 学完本课应能做到

- [ ] 说明 LaneFollowPath 的输入和输出。
- [ ] 区分 DecidePathBounds、OptimizePath、AssessPath。
- [ ] 理解为什么先有路径边界，再优化路径。
- [ ] 找到路径边界对静态障碍物的处理。
- [ ] 解释最终路径如何写入 ReferenceLineInfo。

## 3. 类定义

> 源码位置：`modules/planning/tasks/lane_follow_path/lane_follow_path.h`，约第 30～56 行。

```cpp
// 源码位置：lane_follow_path.h，约第 30 行
class LaneFollowPath : public PathGeneration {
 public:
  // 初始化 Task 并加载 LaneFollowPathConfig
  bool Init(const std::string& config_dir, const std::string& name,
            const std::shared_ptr<DependencyInjector>& injector) override;

 private:
  // 路径任务的实际执行入口
  apollo::common::Status Process(
      Frame* frame, ReferenceLineInfo* reference_line_info) override;

  // 第一步：决定路径可行边界
  bool DecidePathBounds(std::vector<PathBoundary>* boundary);

  // 第二步：根据边界优化候选路径
  bool OptimizePath(const std::vector<PathBoundary>& path_boundaries,
                    std::vector<PathData>* candidate_path_data);

  // 第三步：评估候选路径，选择最终路径
  bool AssessPath(std::vector<PathData>* candidate_path_data,
                  PathData* final_path);

  // 当前路径任务配置
  LaneFollowPathConfig config_;
};
```

三个阶段可以记成：

```text
定边界 -> 生成候选路径 -> 评估并选路径
```

## 4. Process 主流程

> 源码位置：`modules/planning/tasks/lane_follow_path/lane_follow_path.cc`，约第 47～74 行。

```cpp
// 源码位置：lane_follow_path.cc，约第 47 行
apollo::common::Status LaneFollowPath::Process(
    Frame* frame, ReferenceLineInfo* reference_line_info) {
  // 如果已经有路径，或者路径可以复用，就跳过本次计算
  if (!reference_line_info->path_data().Empty() ||
      reference_line_info->path_reusable()) {
    return Status::OK();
  }

  // 保存所有候选路径边界
  std::vector<PathBoundary> candidate_path_boundaries;

  // 保存候选路径数据
  std::vector<PathData> candidate_path_data;

  // 把车辆起始点转换为 SL 状态
  GetStartPointSLState();

  // 第一步：决定路径边界
  if (!DecidePathBounds(&candidate_path_boundaries)) {
    AERROR << "Decide path bound failed";
    return Status::OK();
  }

  // 第二步：优化候选路径
  if (!OptimizePath(candidate_path_boundaries, &candidate_path_data)) {
    AERROR << "Optimize path failed";
    return Status::OK();
  }

  // 第三步：评估路径并写入 ReferenceLineInfo 的 path_data
  if (!AssessPath(&candidate_path_data,
                  reference_line_info->mutable_path_data())) {
    AERROR << "Path assessment failed";
  }

  return Status::OK();
}
```

## 5. 路径边界

> 源码位置：`modules/planning/tasks/lane_follow_path/lane_follow_path.cc`，约第 76～128 行。

```cpp
// 源码位置：lane_follow_path.cc，约第 76 行
bool LaneFollowPath::DecidePathBounds(std::vector<PathBoundary>* boundary) {
  // 先创建一个空的路径边界容器
  boundary->emplace_back();
  auto& path_bound = boundary->back();

  // 根据自车位置和参考线初始化边界
  if (!PathBoundsDeciderUtil::InitPathBoundary(
          *reference_line_info_, &path_bound, init_sl_state_)) {
    return false;
  }

  // 先根据当前车道生成一个基础边界
  if (!PathBoundsDeciderUtil::GetBoundaryFromSelfLane(
          *reference_line_info_, init_sl_state_, &path_bound)) {
    return false;
  }

  // 根据静态障碍物进一步收紧或调整边界
  if (!PathBoundsDeciderUtil::GetBoundaryFromStaticObstacles(
          *reference_line_info_, &obs_sl_polygons_, init_sl_state_, &path_bound,
          &blocking_obstacle_id, &path_narrowest_width)) {
    return false;
  }

  return true;
}
```

为什么需要路径边界：

- 车辆不能随意离开可行驶区域。
- 障碍物会限制路径的横向范围。
- 优化器在边界内求一条更平滑、可执行的路径。
- 边界不是最终路径，只是路径必须遵守的约束。

## 6. 路径优化

核心工作：

```text
为每一个路径边界计算参考路径和约束
调用 PathOptimizerUtil::OptimizePath
成功后将 PathData 加入 candidate_path_data
```

新概念：

| 名称 | 含义 |
| --- | --- |
| `PathBoundary` | 优化路径时必须遵守的边界 |
| `PathData` | 一条候选路径及其附属信息 |
| `SL` | 沿参考线的纵向 `s` 和横向 `l` |
| `reference line` | 地图路线在规划坐标系中的参考基线 |

## 7. 路径评估

评估会检查：

- 路径是否为空。
- 是否偏离参考线太远。
- 是否驶出道路。
- 是否与静态障碍物碰撞。
- 终点是否落在不合理的相邻车道。
- 哪条候选路径代价最低、最适合当前场景。

最终结果写入：

```cpp
reference_line_info->mutable_path_data()
```

这也说明路径 Task 的输出不是直接发消息，而是写回本轮共享上下文。

## 8. 动手实验

```powershell
rg -n "class LaneFollowPath|DecidePathBounds|OptimizePath|AssessPath" modules\planning\tasks\lane_follow_path\lane_follow_path.h
rg -n "LaneFollowPath::Process|InitPathBoundary|GetBoundaryFromSelfLane|GetBoundaryFromStaticObstacles" modules\planning\tasks\lane_follow_path\lane_follow_path.cc
rg -n "PathOptimizerUtil::OptimizePath|mutable_path_data" modules\planning\tasks\lane_follow_path\lane_follow_path.cc
```

填写数据流：

```text
Frame + ReferenceLineInfo
  -> ________
  -> ________
  -> ________
  -> ReferenceLineInfo::path_data
```

## 9. 常见错误

- 把路径边界当成最终路径。
- 认为障碍物只会影响速度，不影响路径。
- 忽略路径复用逻辑。
- 认为 `Process` 直接发布轨迹。
- 看到 `SL` 后仍按 XY 坐标理解。

## 10. 自测题

1. LaneFollowPath 的三个主要步骤是什么？
2. 路径为什么需要边界？
3. `PathBoundary` 和 `PathData` 有什么区别？
4. 路径优化后得到什么？
5. 路径评估至少检查哪些问题？
6. 最终路径写入哪里？
7. 为什么要先 `GetStartPointSLState`？
8. `path_reusable()` 有什么意义？
9. 路径 Task 会直接发布 `ADCTrajectory` 吗？
10. 用一句话概括 LaneFollowPath。

## 11. 参考答案

1. 决定路径边界、优化路径、评估路径。
2. 保证路径留在道路和障碍物允许的可行区域内。
3. PathBoundary 是约束边界；PathData 是候选路径结果。
4. 一条或多条可评估的候选路径。
5. 路径为空、偏离参考线、越出道路、与障碍物碰撞、终点不合理等。
6. `ReferenceLineInfo::mutable_path_data()`。
7. 确定规划起点在参考线坐标系中的起点状态。
8. 避免路径未变化时重复计算，提高性能。
9. 不会。它只更新本轮 ReferenceLineInfo 中的路径数据。
10. 在边界约束内优化并选择一条可行驶的车道跟随路径。

## 12. 过关检查

- [ ] 能画出路径任务三步流程。
- [ ] 能解释 PathBoundary 和 PathData。
- [ ] 能找到最终路径写入位置。
- [ ] 十道题至少答对八道。

## 13. 下一课衔接

下一课学习 `SpeedBoundsDecider`，看速度任务如何把障碍物投影到 S-T 图，并为后续速度优化准备边界。