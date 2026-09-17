export const COMMIT = "d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa";

const nav = [
  ["lesson-00", "00", "Linux 与 Apollo 仿真环境", "lesson-00.html"],
  ["lesson-01", "01", "Apollo 与 Planning 全景", "lesson-01.html"],
  ["lesson-02", "02", "Planning 一轮流程", "lesson-02.html"],
  ["lesson-03", "03", "Scenario / Stage / Task", "lesson-03.html"],
  ["lesson-04", "04", "变量、函数与条件", "lesson-04.html"],
  ["lesson-05", "05", "指针基础", "lesson-05.html"],
  ["lesson-06", "06", "引用与 const", "lesson-06.html"],
  ["lesson-07", "07", "类、对象与构造", "lesson-07.html"],
  ["lesson-08", "08", "继承与 override", "lesson-08.html"],
  ["lesson-09", "09", "vector 与智能指针", "lesson-09.html"],
  ["lesson-10", "10", "ScenarioManager 场景切换", "lesson-10.html"],
  ["lesson-11", "11", "LaneFollow 场景", "lesson-11.html"],
  ["lesson-12", "12", "Stage 如何执行 Task", "lesson-12.html"],
  ["lesson-13", "13", "Task 基类", "lesson-13.html"],
  ["lesson-14", "14", "路径 Task 示例", "lesson-14.html"],
  ["lesson-15", "15", "速度 Task 示例", "lesson-15.html"],
  ["lesson-16", "16", "TrafficRule 与 Task", "lesson-16.html"],
  ["lesson-17", "17", "配置、插件与编译", "lesson-17.html"],
  ["lesson-18", "18", "新增一个简单 Task", "lesson-18.html"],
  ["lesson-19", "19", "日志与 DreamView 调试", "lesson-19.html"],
  ["lesson-20", "20", "小型限速功能实战", "lesson-20.html"]
];

function items(start, end) {
  return nav.slice(start, end).map(([id, index, title, href]) => ({ id, index, title, href, status: "ready" }));
}

export const courseGroups = [
  { label: "先跑起来", items: items(0, 2) },
  { label: "建立地图", items: items(2, 4) },
  { label: "C++ 生存包", items: items(4, 10) },
  { label: "Scenario / Task", items: items(10, 17) },
  { label: "动手修改", items: items(17, 21) }
];

export const lessons = [
  {
    id: "lesson-00", output: "lesson-00.html", source: "lesson-00-linux-simulation-setup.md",
    number: "00", title: "Linux 与 Apollo 仿真环境安装", navTitle: "Linux 与 Apollo 仿真环境",
    kicker: "Unit 00 - Foundation", summary: "先把 Linux、Docker、AEM、application-pnc 和 DreamView 跑通。没有这一步，后面的 Planning 阅读和实验都只是纸上谈兵。",
    difficulty: "入门", time: "半天到 2 天", prereq: "Windows 电脑与浏览器",
    keywords: "Linux Ubuntu WSL 虚拟机 双系统 Docker AEM application-pnc DreamView 安装"
  },
  {
    id: "lesson-01", output: "lesson-01.html", source: "lesson-01-apollo-planning-map.md",
    number: "01", title: "Apollo 与 Planning 全景地图", navTitle: "Apollo 与 Planning 全景",
    kicker: "Unit 01 - Project Map", summary: "建立 Apollo 与 Planning 的整体地图，认识 Component、Planner、Scenario、Stage 和 Task。",
    difficulty: "入门", time: "60 - 90 分钟", prereq: "第 00 课或已能启动 DreamView",
    keywords: "Apollo 架构 Planning Component Planner Scenario Stage Task TrafficRule 输入 输出"
  },
  {
    id: "lesson-02", output: "lesson-02.html", source: "lesson-02-planning-flow.md",
    number: "02", title: "Planning 一轮流程", navTitle: "Planning 一轮流程",
    kicker: "Unit 02 - Runtime Flow", summary: "从 Proc、LocalView、RunOnce、Frame 到 ADCTrajectory，建立一轮规划的主调用链。",
    difficulty: "入门", time: "90 - 120 分钟", prereq: "第 01 课",
    keywords: "PlanningComponent Proc RunOnce LocalView Frame Planner ADCTrajectory"
  },
  {
    id: "lesson-03", output: "lesson-03.html", source: "lesson-03-scenario-stage-task.md",
    number: "03", title: "Scenario、Stage 和 Task", navTitle: "Scenario / Stage / Task",
    kicker: "Unit 03 - Core Structure", summary: "用生活化模型理解三层结构，并阅读三个基类和 LaneFollow pipeline 配置。",
    difficulty: "入门", time: "80 - 120 分钟", prereq: "第 02 课",
    keywords: "Scenario Stage Task pipeline fallback LaneFollow"
  },
  {
    id: "lesson-04", output: "lesson-04.html", source: "lesson-04-cpp-basics.md",
    number: "04", title: "C++ 变量、函数与条件", navTitle: "变量、函数与条件",
    kicker: "Unit 04 - C++ Survival", summary: "只学习读懂 Task::Init 和 Task::Execute 所需的变量、类型、函数、条件和返回值。",
    difficulty: "基础", time: "80 - 110 分钟", prereq: "第 03 课",
    keywords: "C++ bool int double string if return function"
  },
  {
    id: "lesson-05", output: "lesson-05.html", source: "lesson-05-pointers.md",
    number: "05", title: "C++ 指针基础", navTitle: "指针基础",
    kicker: "Unit 05 - C++ Survival", summary: "掌握 Frame*、&frame、*frame、frame-> 和 nullptr，专门解决阅读 Task 时的指针障碍。",
    difficulty: "基础", time: "100 - 140 分钟", prereq: "第 04 课",
    keywords: "指针 地址 解引用 Frame* nullptr 箭头运算符"
  },
  {
    id: "lesson-06", output: "lesson-06.html", source: "lesson-06-references-const.md",
    number: "06", title: "C++ 引用与 const", navTitle: "引用与 const",
    kicker: "Unit 06 - C++ Survival", summary: "区分 T*、T& 和 const T&，理解 Planning 为什么大量使用只读引用传递输入。",
    difficulty: "基础", time: "90 - 120 分钟", prereq: "第 05 课",
    keywords: "引用 const T& 只读输入 指针 复制"
  },
  {
    id: "lesson-07", output: "lesson-07.html", source: "lesson-07-classes-objects.md",
    number: "07", title: "类、对象与构造函数", navTitle: "类、对象与构造",
    kicker: "Unit 07 - C++ Survival", summary: "用 Vec2d 和 LaneFollowPath 学习类、对象、构造函数、封装和成员函数。",
    difficulty: "基础", time: "100 - 140 分钟", prereq: "第 06 课",
    keywords: "class object constructor Vec2d public protected const 成员函数"
  },
  {
    id: "lesson-08", output: "lesson-08.html", source: "lesson-08-inheritance-override.md",
    number: "08", title: "继承、虚函数与 override", navTitle: "继承与 override",
    kicker: "Unit 08 - C++ Survival", summary: "理解 Task -> PathGeneration -> LaneFollowPath 的继承链和插件多态。",
    difficulty: "基础", time: "110 - 150 分钟", prereq: "第 07 课",
    keywords: "继承 virtual override 多态 插件 Task PathGeneration"
  },
  {
    id: "lesson-09", output: "lesson-09.html", source: "lesson-09-vector-smart-pointers.md",
    number: "09", title: "vector 与智能指针", navTitle: "vector 与智能指针",
    kicker: "Unit 09 - C++ Survival", summary: "读懂 task_list_、scenario_list_、shared_ptr 和 unique_ptr 的所有权语义。",
    difficulty: "基础", time: "100 - 140 分钟", prereq: "第 08 课",
    keywords: "vector shared_ptr unique_ptr make_shared make_unique task_list"
  },
  {
    id: "lesson-10", output: "lesson-10.html", source: "lesson-10-scenario-manager.md",
    number: "10", title: "ScenarioManager 与场景切换", navTitle: "ScenarioManager 场景切换",
    kicker: "Unit 10 - Scenario", summary: "学习场景列表、默认场景、IsTransferable、Exit、Reset 和 Enter。",
    difficulty: "核心", time: "100 - 130 分钟", prereq: "第 03、09 课",
    keywords: "ScenarioManager scenario_list IsTransferable LANE_FOLLOW Enter Exit Reset"
  },
  {
    id: "lesson-11", output: "lesson-11.html", source: "lesson-11-lane-follow-scenario.md",
    number: "11", title: "LaneFollow 场景", navTitle: "LaneFollow 场景",
    kicker: "Unit 11 - Scenario", summary: "拆解最常用的默认场景、切入条件、LaneFollowStage 和完整 Task pipeline。",
    difficulty: "核心", time: "100 - 130 分钟", prereq: "第 10 课",
    keywords: "LaneFollow LaneFollowScenario LaneFollowStage pipeline task"
  },
  {
    id: "lesson-12", output: "lesson-12.html", source: "lesson-12-stage-execution.md",
    number: "12", title: "Stage 如何执行 Task", navTitle: "Stage 如何执行 Task",
    kicker: "Unit 12 - Stage", summary: "理解任务循环、Status 失败中断、fallback task 和路径速度合并。",
    difficulty: "核心", time: "100 - 130 分钟", prereq: "第 11 课",
    keywords: "Stage task_list Execute Status fallback CombinePathAndSpeedProfile"
  },
  {
    id: "lesson-13", output: "lesson-13.html", source: "lesson-13-task-base.md",
    number: "13", title: "Task 基类与生命周期", navTitle: "Task 基类",
    kicker: "Unit 13 - Task", summary: "学习 Task::Init、Execute、Process、配置路径和新增 Task 的最低结构。",
    difficulty: "核心", time: "80 - 110 分钟", prereq: "第 12 课",
    keywords: "Task Init Execute Process config_path PathGeneration Decider"
  },
  {
    id: "lesson-14", output: "lesson-14.html", source: "lesson-14-path-task.md",
    number: "14", title: "路径 Task 示例 LaneFollowPath", navTitle: "路径 Task 示例",
    kicker: "Unit 14 - Task", summary: "阅读路径边界、路径优化、路径评估和写入 ReferenceLineInfo 的完整流程。",
    difficulty: "核心", time: "120 - 160 分钟", prereq: "第 13 课",
    keywords: "LaneFollowPath PathBoundary PathData SL DecidePathBounds OptimizePath AssessPath"
  },
  {
    id: "lesson-15", output: "lesson-15.html", source: "lesson-15-speed-task.md",
    number: "15", title: "速度 Task 示例 SpeedBoundsDecider", navTitle: "速度 Task 示例",
    kicker: "Unit 15 - Task", summary: "理解 S-T 图、速度边界、限速计算和 StGraphData 输出。",
    difficulty: "核心", time: "120 - 160 分钟", prereq: "第 14 课",
    keywords: "SpeedBoundsDecider STBoundaryMapper SpeedLimitDecider StGraphData S-T"
  },
  {
    id: "lesson-16", output: "lesson-16.html", source: "lesson-16-traffic-rule.md",
    number: "16", title: "TrafficRule 与 Task 的区别", navTitle: "TrafficRule 与 Task",
    kicker: "Unit 16 - Traffic Rule", summary: "比较 Task 和 TrafficRule，阅读 TrafficDecider 与 TrafficLight 的规则执行方式。",
    difficulty: "核心", time: "100 - 140 分钟", prereq: "第 13 课",
    keywords: "TrafficRule TrafficDecider TrafficLight ApplyRule pipeline"
  },
  {
    id: "lesson-17", output: "lesson-17.html", source: "lesson-17-config-plugin-build.md",
    number: "17", title: "配置、插件与编译", navTitle: "配置、插件与编译",
    kicker: "Unit 17 - Build System", summary: "把源码、插件注册、plugins.xml、pipeline、buildtool 和 Docker 串起来。",
    difficulty: "实践", time: "90 - 130 分钟", prereq: "第 16 课",
    keywords: "plugins.xml buildtool build install pipeline cyberfile BUILD"
  },
  {
    id: "lesson-18", output: "lesson-18.html", source: "lesson-18-add-simple-task.md",
    number: "18", title: "新增一个简单 Task", navTitle: "新增一个简单 Task",
    kicker: "Unit 18 - Practice", summary: "从零实现一个只记录日志的 Task，完成注册、配置、编译和执行验证。",
    difficulty: "实践", time: "150 - 210 分钟", prereq: "第 17 课",
    keywords: "新增 Task LoggingProbe 插件注册 pipeline 编译"
  },
  {
    id: "lesson-19", output: "lesson-19.html", source: "lesson-19-debug-dreamview.md",
    number: "19", title: "日志与 DreamView 调试", navTitle: "日志与 DreamView 调试",
    kicker: "Unit 19 - Debugging", summary: "使用 AINFO/ADEBUG/AERROR、Cyber channel 和 DreamView 按顺序定位问题。",
    difficulty: "实践", time: "100 - 140 分钟", prereq: "第 18 课",
    keywords: "AINFO ADEBUG AERROR DreamView cyber_monitor 日志 调试"
  },
  {
    id: "lesson-20", output: "lesson-20.html", source: "lesson-20-speed-limit-capstone.md",
    number: "20", title: "小型限速功能实战", navTitle: "小型限速功能实战",
    kicker: "Unit 20 - Capstone", summary: "增加可配置限速上限，修改 Proto、配置和 SpeedLimitDecider，并完成三组对照验证。",
    difficulty: "实践", time: "180 - 240 分钟", prereq: "第 14～19 课",
    keywords: "SpeedLimitDecider region_speed_cap Proto 限速 capstone 对照实验"
  }
];

export const roadmap = nav.map(([id, number, title, href]) => [
  number,
  title,
  number === "00" ? "安装指南与首次启动" :
  number === "01" ? "先认识项目，不碰复杂函数" :
  number === "02" ? "上游输入到 ADCTrajectory" :
  number === "03" ? "建立三层层级关系" :
  Number(number) <= 9 ? "围绕 Task 和 Planning 补 C++" :
  Number(number) <= 12 ? "场景、Stage 和执行流程" :
  Number(number) <= 16 ? "Task、路径、速度与规则" :
  number === "17" ? "配置、插件和构建流程" :
  number === "18" ? "新增第一个安全 Task" :
  number === "19" ? "日志、channel 与 DreamView" :
  "完成小型限速修改和验证",
  "ready"
]);