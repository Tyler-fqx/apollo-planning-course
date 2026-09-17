# 第 01 课：Planning 全貌与代码入口

> 学生自学版。无需老师讲解，按本课步骤阅读源码、完成实验并回答自测题。

## 1. 学习信息

- 预计用时：90～120 分钟。
- 难度：零基础。
- 前置要求：会使用终端、文本编辑器和 Git 基本命令。
- 源码基线：官方 Apollo `d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa`。
- 是否必须运行仿真：不必须。静态源码路线可以完成本课。
- 推荐配套材料：
  - 第 01～02 课学习卡：`learning-cards-01-02.md`
  - 第 01～02 课实验手册：`labs-01-02.md`

## 2. 学完本课应能做到

完成学习后，请逐一检查：

- [ ] 能用自己的话解释 Planning 模块负责什么。
- [ ] 能说出 Planning 的三个主要输入和主要输出。
- [ ] 能解释路径和轨迹的区别。
- [ ] 能说出 `modules/planning` 八个以上目录的职责。
- [ ] 能解释 DAG、Component、Channel 和 Protobuf 的基础含义。
- [ ] 能找出 `PlanningComponent::Init()` 和 `PlanningComponent::Proc()`。
- [ ] 能画出第一张从输入到输出的 Planning 数据流图。

如果任何一项说不清，不要直接进入下一课。

## 3. 开始前检查

先确认你能够在终端中执行以下命令：

```powershell
Get-Location
Get-ChildItem
git --version
rg --version
```

如果 `rg` 不存在，可以使用：

```powershell
Select-String -Path <文件或目录> -Pattern <关键词>
```

本课默认源码位于：

```text
C:\Users\FQX\Documents\ChatGPT\New project\apollo-upstream
```

其他学习者应替换为自己实际克隆的 Apollo 仓库路径。

## 4. 关键词与概念

### 4.1 自动驾驶四个核心环节

| 环节 | 通俗解释 | 主要回答的问题 |
| --- | --- | --- |
| 感知 | 看周围环境和识别物体 | 现在有什么？ |
| 预测 | 推测其他交通参与者未来可能怎么动 | 别人接下来会怎样？ |
| 规划 | 决定自车未来应该怎样运动 | 我该怎么走？ |
| 控制 | 将规划轨迹转换成油门、刹车和转向指令 | 怎样执行？ |

本课程只聚焦规划部分，但会涉及必要的上游输入和控制输出。

### 4.2 Planning 模块的一句话定义

Planning 根据当前车辆状态、地图路线、障碍物预测和交通规则，计算未来一段时间内自车应该怎样运动，并输出一条可执行的轨迹。

### 4.3 路径和轨迹有什么区别

路径只描述几何位置：

```text
车辆准备沿哪些点移动
```

轨迹同时描述位置和时间：

```text
第 1 秒在哪里、速度是多少
第 2 秒到哪里、速度是多少
加速度和 jerk 是否平滑
```

控制模块需要轨迹，因为只知道几何路径无法确定何时加速、减速和停车。

### 4.4 Component 是什么

Component 可以理解为一个能被 Apollo Cyber 框架加载并持续运行的程序组件。

`PlanningComponent` 是 Planning 模块的组件入口，负责：

- 初始化数据和通信接口。
- 接收上游输入。
- 触发一次规划。
- 发布规划输出。

### 4.5 DAG 是什么

DAG 是组件接线图，不是规划算法。

`planning.dag` 告诉 Cyber：

- 加载哪个共享库。
- 启动哪个组件类。
- 组件读取哪些 channel。
- 使用哪个配置文件和 flag 文件。

### 4.6 Channel 是什么

Channel 是两个模块之间传递消息的通信通道。

例如：

- 预测模块通过 `/apollo/prediction` 发送障碍物预测。
- 底盘模块通过 `/apollo/canbus/chassis` 发送车辆底盘状态。
- 定位模块通过 `/apollo/localization/pose` 发送车辆位姿。
- Planning 通过 `/apollo/planning` 发布轨迹。

### 4.7 Protobuf 是什么

Protobuf 是一种结构化的数据描述方式。Apollo 中很多消息都使用 Protobuf，例如：

```text
ADCTrajectory
PredictionObstacles
Chassis
LocalizationEstimate
```

初学阶段先把它理解为“有固定字段的结构体消息”，不需要立刻研究生成代码。

## 5. 一轮 Planning 的直觉模型

Planning 不是只运行一次，而是不断接收最新数据并重复计算。

可以用下面的时间线理解：

```text
第 1 轮：读取输入 -> 规划 -> 输出轨迹
第 2 轮：读取更新的输入 -> 重新规划 -> 输出新轨迹
第 3 轮：继续重复
```

一轮大致经历：

```text
读取输入
  -> 更新车辆状态
  -> 构造本轮数据容器 Frame
  -> 选择场景
  -> 执行 Stage 和 Task
  -> 生成轨迹
  -> 发布 ADCTrajectory
```

源码中的规划周期与 `FLAGS_planning_loop_rate` 相关。不要把“每 0.1 秒”当作所有版本永远不变的硬件事实，应该以当前源码和配置为准。

## 6. 源码地图

| 路径 | 作用 |
| --- | --- |
| `modules/planning/planning_component` | 组件入口、启动文件和配置 |
| `modules/planning/planning_interface_base` | Planner、Scenario、Stage、Task、TrafficRule 的接口 |
| `modules/planning/planning_base` | Frame、ReferenceLineInfo、轨迹、路径和速度等公共数据结构与算法 |
| `modules/planning/planners` | 规划器插件，重点是 `public_road` |
| `modules/planning/scenarios` | 驾驶场景插件 |
| `modules/planning/tasks` | 场景中的具体任务 |
| `modules/planning/traffic_rules` | 交通灯、停止牌、人行横道等规则 |
| `modules/planning/pnc_map` | 地图处理和参考线生成 |
| `modules/planning/planning_open_space` | 泊车、掉头等开放空间规划 |

旧教程中的目录名可能与当前官方 `master` 不同。本课程以固定提交和真实目录为准。

## 7. 带问题的源码阅读路线

### 7.1 第一步：确认源码版本

执行：

```powershell
Set-Location 'C:\Users\FQX\Documents\ChatGPT\New project\apollo-upstream'
git rev-parse HEAD
```

预期结果：

```text
d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa
```

如果结果不同：

1. 不要继续套用本课中的行号。
2. 记录自己的提交哈希。
3. 使用本课的搜索关键词重新定位源码。
4. 暂时不要直接切换到课程提交，除非你确认不会影响比赛代码。

### 7.2 第二步：建立目录地图

执行：

```powershell
Get-ChildItem modules\planning -Directory | Select-Object Name
```

阅读问题：

1. `planning_component` 和其他目录相比，为什么更像“入口”？
2. `planning_interface_base` 为什么适合放父类接口？
3. `planners`、`scenarios` 和 `tasks` 分别在什么粒度上描述规划？
4. 为什么地图相关内容单独放在 `pnc_map`？

完成实验手册中的“实验 1B”。

### 7.3 第三步：阅读官方中文说明

打开：

```text
modules/planning/planning_component/README_cn.md
```

按顺序阅读：

1. 介绍。
2. planning package 介绍。
3. planning 框架介绍。
4. planning 模块运行流程。
5. planning 模块入口。
6. 输入和输出。
7. 配置。

阅读时回答：

| 问题 | 你的答案 |
| --- | --- |
| Planning 接收哪些主要输入？ |  |
| Planning 输出什么消息？ |  |
| `PlanningComponent` 的职责是什么？ |  |
| OnLanePlanning 和 PublicRoadPlanner 是什么关系？ |  |

暂时不要求理解场景状态机、路径规划和速度规划的全部细节。

### 7.4 第四步：阅读 DAG 接线图

打开：

```text
modules/planning/planning_component/dag/planning.dag
```

找到并抄写：

```text
module_library
class_name
reader channel
config_file_path
flag_file_path
```

预期发现：

- `class_name` 是 `PlanningComponent`。
- 三个主要输入 channel 是 prediction、chassis 和 localization。
- 配置文件是 `planning_config.pb.txt`。
- flag 文件是 `planning.conf`。

理解方式：

```text
DAG 不负责计算轨迹
DAG 只负责告诉框架怎样加载和连接 PlanningComponent
```

### 7.5 第五步：定位程序入口

打开：

```text
modules/planning/planning_component/planning_component.h
```

搜索：

```powershell
rg -n "class PlanningComponent|bool Init|bool Proc" modules\planning\planning_component\planning_component.h
```

然后打开：

```text
modules/planning/planning_component/planning_component.cc
```

搜索：

```powershell
rg -n "PlanningComponent::Init|PlanningComponent::Proc|planning_writer_->Write" modules\planning\planning_component\planning_component.cc
```

你应该能找到：

- `Init()`：组件启动时进行初始化。
- `Proc()`：接收输入并触发规划。
- `planning_writer_->Write(...)`：发布规划结果。

本课只需要理解职责，不要求逐行读懂函数。

### 7.6 第六步：查看规划配置

打开：

```text
modules/planning/planning_component/conf/planning_config.pb.txt
```

观察配置中包含哪些字段。

阅读问题：

1. 为什么 planner 名称放在配置中，而不是写死在组件里？
2. 配置修改后为什么需要重新启动或重新加载？
3. 配置文件和源码中的默认值是什么关系？

本课可以先记录问题，具体配置机制在第 10 课展开。

## 8. 第一张数据流图

完成源码阅读后，请自己画出：

```text
Prediction / Chassis / Localization
                |
                v
          PlanningComponent
                |
                v
              Proc()
                |
                v
           RunOnce()
                |
                v
            Planning
                |
                v
         ADCTrajectory
```

然后补上：

- DAG 在哪里发挥作用。
- LocalView 在哪里组装。
- Writer 在哪里发布结果。

## 9. 动手实验

完成 `labs-01-02.md` 中的：

- 实验 1A：确认源码基线。
- 实验 1B：建立目录地图。
- 实验 1C：读取 DAG。
- 实验 1D：定位 Planning 入口。

如果具备仿真环境，再执行模块启动实验。没有环境时，只记录静态源码证据。

## 10. 预期学习证据

本课结束时，你的笔记中至少应该有：

- [ ] 官方提交哈希。
- [ ] Planning 目录地图。
- [ ] `planning.dag` 的关键字段。
- [ ] 三个输入 channel。
- [ ] `Init()` 和 `Proc()` 的位置。
- [ ] 一张手绘或文本数据流图。
- [ ] 至少两条实际执行成功的命令及输出。

## 11. 常见错误

### 错误 1：把 DAG 当作算法

DAG 解决加载和通信问题，不解决路径和速度计算问题。

### 错误 2：只会背目录名

必须能说明目录之间的关系。例如：

```text
Planner 选择场景
Scenario 组织 Stage
Stage 执行 Task
TrafficRule 提供交通规则约束
```

具体细节后续学习，但先建立层级直觉。

### 错误 3：把路径当成轨迹

路径只有位置，轨迹还包含时间和速度。控制需要的是轨迹。

### 错误 4：没有确认 commit 就死记行号

行号会随源码变化。搜索函数名和类名比记行号可靠。

### 错误 5：没有运行环境就写“实验成功”

静态阅读可以作为合格证据。没有实际运行，就明确写“未运行”。

## 12. 自测题

先独立回答，再看后面的参考答案。

1. Planning 的主要职责是什么？
2. Planning 的三个主要输入是什么？
3. Planning 的主要输出消息是什么？
4. 路径和轨迹的区别是什么？
5. DAG 的作用是什么？
6. Channel 的作用是什么？
7. `PlanningComponent` 的两个关键入口方法是什么？
8. `planning_base` 和 `planning_interface_base` 的职责有什么区别？
9. 为什么不能只靠行号定位代码？
10. 如果无法启动 DreamView，本课还能怎样完成？

## 13. 参考答案

1. **Planning 的主要职责是什么？**  
   根据车辆状态、路线、障碍物预测和交通规则，计算未来一段时间的可执行轨迹。

2. **Planning 的三个主要输入是什么？**  
   `/apollo/prediction`、`/apollo/canbus/chassis`、`/apollo/localization/pose`。

3. **Planning 的主要输出消息是什么？**  
   `/apollo/planning` 上的 `apollo::planning::ADCTrajectory`。

4. **路径和轨迹的区别是什么？**  
   路径主要描述几何位置；轨迹还包含时间、速度、加速度和 jerk 等运动信息。

5. **DAG 的作用是什么？**  
   描述组件加载方式、组件类、输入 channel、配置文件和 flag 文件。

6. **Channel 的作用是什么？**  
   让不同模块之间通过 Cyber 发布和订阅消息。

7. **`PlanningComponent` 的两个关键入口方法是什么？**  
   `Init()` 和 `Proc()`。

8. **`planning_base` 和 `planning_interface_base` 的职责有什么区别？**  
   `planning_base` 主要放公共数据结构和算法；`planning_interface_base` 主要放 Planner、Scenario、Stage、Task、TrafficRule 的接口标准。

9. **为什么不能只靠行号定位代码？**  
   源码更新后行号会变化。应使用类名、函数名和关键字符串搜索。

10. **如果无法启动 DreamView，本课还能怎样完成？**  
    完成静态源码追踪、DAG 阅读、目录分析和数据流图，并明确标注未进行运行验证。

## 14. 过关检查

- [ ] 十个自测题至少答对八个。
- [ ] 能不看教材解释三个输入和一个输出。
- [ ] 能解释 DAG、Component、Channel、Protobuf。
- [ ] 能完成实验 1A～1D。
- [ ] 能画出第一张数据流图。
- [ ] 能明确说出哪些结论来自真实运行，哪些来自静态阅读。

## 15. 下一课衔接

下一课会继续追问：

- `PlanningComponent::Proc()` 收到输入后具体做了什么？
- `RunOnce()` 如何组织一轮规划？
- `Frame` 为什么存在？
- `ADCTrajectory` 在哪里被发布？

完成本课过关检查后再进入第 02 课。