# 第 17 课：配置、插件与编译

> 学生自学版。把 Scenario、Stage、Task 与真实构建流程连接起来。

## 1. 学习信息

- 预计用时：90～130 分钟。
- 难度：实践。
- 前置：第 16 课。
- 运行环境：Linux + Docker + AEM。
- 代码基线：`d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。

## 2. 学完本课应能做到

- [ ] 区分源码、插件描述和配置文件。
- [ ] 读懂 `plugins.xml`。
- [ ] 说明 pipeline 配置如何选择 Task。
- [ ] 使用 buildtool 下载和编译 Planning。
- [ ] 知道配置修改后为什么需要重启或重新加载。

## 3. 一个插件的三部分

以 LaneFollowPath 为例：

```text
源码：
  lane_follow_path.h
  lane_follow_path.cc

插件注册：
  lane_follow_path.h 中的 CYBER_PLUGIN_MANAGER_REGISTER_PLUGIN

插件描述：
  plugins.xml

运行配置：
  场景 pipeline.pb.txt
```

## 4. 插件注册

> 源码位置：`modules/planning/tasks/lane_follow_path/lane_follow_path.h`，第 55 行附近。

```cpp
// 源码位置：lane_follow_path.h，第 55 行附近
// 把具体类型注册为 Task 插件
CYBER_PLUGIN_MANAGER_REGISTER_PLUGIN(apollo::planning::LaneFollowPath, Task)
```

其他例子：

```cpp
// 源码位置：speed_bounds_decider.h
CYBER_PLUGIN_MANAGER_REGISTER_PLUGIN(apollo::planning::SpeedBoundsDecider, Task)

// 源码位置：traffic_light.h
CYBER_PLUGIN_MANAGER_REGISTER_PLUGIN(apollo::planning::TrafficLight, TrafficRule)
```

## 5. plugins.xml

> 源码位置：`modules/planning/tasks/lane_follow_path/plugins.xml`，第 1～3 行。

```xml
<!-- 源码位置：lane_follow_path/plugins.xml -->
<!-- 声明共享库和导出类，Cyber 插件管理器据此查找实现 -->
<library path="modules/planning/tasks/lane_follow_path/liblane_follow_path.so">
  <!-- 具体类 LaneFollowPath 属于 Task 基类插件 -->
  <class type="apollo::planning::LaneFollowPath"
         base_class="apollo::planning::Task"></class>
</library>
```

理解：

```text
plugins.xml 告诉运行环境：这个共享库里有什么插件。
```

## 6. 场景 pipeline 配置

> 源码位置：`modules/planning/scenarios/lane_follow/conf/pipeline.pb.txt`，第 1～12 行。

```text
# 源码位置：lane_follow/conf/pipeline.pb.txt
stage {
  name: "LANE_FOLLOW_STAGE"
  type: "LaneFollowStage"
  task {
    name: "LANE_CHANGE_PATH"
    type: "LaneChangePath"
  }
  task {
    name: "LANE_FOLLOW_PATH"
    type: "LaneFollowPath"
  }
}
```

配置作用：

- `name` 是运行时实例名。
- `type` 是插件类名。
- 配置顺序决定 Task 执行顺序。

## 7. 全局交通规则配置

> 源码位置：`modules/planning/planning_component/conf/traffic_rule_config.pb.txt`。

```text
# 源码位置：traffic_rule_config.pb.txt
rule {
  name: "CROSSWALK"
  type: "Crosswalk"
}
rule {
  name: "TRAFFIC_LIGHT"
  type: "TrafficLight"
}
```

注意区别：

```text
Task 配置在 scenario 的 pipeline 中
TrafficRule 配置在 planning_component 的全局 traffic rule 配置中
```

## 8. Planning 组件配置

> 源码位置：`modules/planning/planning_component/conf/planning_config.pb.txt`。

```text
# 源码位置：planning_config.pb.txt
topic_config {
  chassis_topic: "/apollo/canbus/chassis"
  localization_topic: "/apollo/localization/pose"
  prediction_topic: "/apollo/prediction"
  planning_trajectory_topic: "/apollo/planning"
}

learning_mode: NO_LEARNING
reference_line_config {
  pnc_map_class: "apollo::planning::LaneFollowMap"
}
```

它主要配置：

- 输入输出 channel。
- 学习模式。
- 参考线地图类。

## 9. 下载和编译 Planning

安装和依赖阶段已由第 00 课完成。进入 `application-pnc` Docker 环境后执行：

```bash
# 下载所有 Planning 相关代码包
buildtool install planning*

# 只下载某个规则包
buildtool install planning-traffic-rules-traffic-light

# 编译 Planning 模块
buildtool build -p modules/planning
```

如果只改了某个插件：

1. 确认源码包已经安装。
2. 编译对应模块。
3. 重启相关进程。
4. 观察日志是否加载了新插件。

## 10. 配置文件加载链

```text
planning.dag
  -> PlanningComponent
      -> planning_config.pb.txt
          -> public_road_planner_config.pb.txt
          -> traffic_rule_config.pb.txt

public_road_planner_config.pb.txt
  -> 选择 Scenario

scenario pipeline.pb.txt
  -> 选择 Stage
  -> 选择 Task
```

## 11. 动手实验

```powershell
rg -n "CYBER_PLUGIN_MANAGER_REGISTER_PLUGIN" modules\planning\tasks\lane_follow_path\lane_follow_path.h modules\planning\tasks\speed_bounds_decider\speed_bounds_decider.h modules\planning\traffic_rules\traffic_light\traffic_light.h
Get-Content modules\planning\tasks\lane_follow_path\plugins.xml
Get-Content modules\planning\scenarios\lane_follow\conf\pipeline.pb.txt
Get-Content modules\planning\planning_component\conf\traffic_rule_config.pb.txt
```

在 Linux 环境执行：

```bash
buildtool -v
buildtool install planning*
buildtool build -p modules/planning
```

记录：

```text
buildtool 版本：
编译是否成功：
第一个错误：
使用的配置文件：
```

## 12. 常见错误

- 只修改 `type`，忘记保证类名和插件注册一致。
- 把 `name` 和 `type` 当成同一个东西。
- 修改配置文件后没有重启或重新加载。
- 只编译了某个包，却没有安装依赖包。
- 在 Windows 主机而不是 Linux Docker 环境中执行 buildtool。

## 13. 自测题

1. 插件系统通常包含哪三部分？
2. `name` 和 `type` 分别表示什么？
3. `plugins.xml` 的作用是什么？
4. Task 的顺序在哪里配置？
5. TrafficRule 在哪里配置？
6. Planning 输入输出 channel 在哪里配置？
7. 编译 Planning 的命令是什么？
8. 下载所有 Planning 代码的命令是什么？
9. 为什么修改配置后要重启或重新加载？
10. 为什么开发环境必须在 Linux 中运行？

## 14. 参考答案

1. 源码、插件注册/描述、运行配置。
2. name 是实例名，type 是具体插件类名。
3. 声明共享库导出了哪些插件类。
4. Scenario 的 `pipeline.pb.txt`。
5. `traffic_rule_config.pb.txt`。
6. `planning_config.pb.txt`。
7. `buildtool build -p modules/planning`。
8. `buildtool install planning*`。
9. 运行时通常只在初始化阶段读取配置。
10. Apollo 的 Docker、AEM、buildtool 和依赖链建立在 Linux 环境上。

## 15. 过关检查

- [ ] 能解释插件注册、plugins.xml 和配置的关系。
- [ ] 能找到 Task pipeline。
- [ ] 能找到 TrafficRule pipeline。
- [ ] 能实际执行 buildtool 命令。
- [ ] 十道题至少答对八道。

## 16. 下一课衔接

下一课开始动手新增一个简单 Task。先只记录日志，不改变车辆行为，用来验证插件注册、配置和编译流程。