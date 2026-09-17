export function sourceSnippet(file, lines, code, note = "") {
  const location = lines ? `${file}，第 ${lines} 行附近` : file;
  return [
    `> 源码位置：\`${location}\``,
    note ? `>\n> ${note}` : "",
    "",
    "```cpp",
    code.trim(),
    "```"
  ].filter(Boolean).join("\n");
}

export function textSnippet(file, lines, code, note = "") {
  const location = lines ? `${file}，第 ${lines} 行附近` : file;
  return [
    `> 源码位置：\`${location}\``,
    note ? `>\n> ${note}` : "",
    "",
    "```text",
    code.trim(),
    "```"
  ].filter(Boolean).join("\n");
}

function list(items, ordered = false) {
  return items.map((item, index) => ordered ? `${index + 1}. ${item}` : `- ${item}`).join("\n");
}

export function renderLesson(spec) {
  const quiz = spec.quiz || [];
  const answers = quiz.map((item, index) => `${index + 1}. **${item.q}**  \n   ${item.a}`).join("\n\n");
  const sourceRows = spec.sourceMap.map(([file, role]) => `| \`${file}\` | ${role} |`).join("\n");

  return `# 第 ${spec.number} 课：${spec.title}

> 学生自学版。每段源码都标注文件位置，并配有面向初学者的中文注释。

## 1. 学习信息

- 预计用时：${spec.time}
- 难度：${spec.difficulty}
- 前置：${spec.prereq}
- 代码基线：\`d53aa3da47a06a08e6d0cd175d5623a34fa0d6aa\`

## 2. 学完本课应能做到

${list(spec.goals)}

## 3. 关键概念

${spec.concepts}

## 4. 源码地图

| 文件 | 本课关注内容 |
| --- | --- |
${sourceRows}

## 5. 源码阅读与讲解

${spec.walkthrough}

## 6. 动手实验

${spec.lab}

## 7. 常见错误

${list(spec.pitfalls)}

## 8. 自测题

${list(quiz.map((item, index) => `${index + 1}. ${item.q}`), true)}

## 9. 参考答案

${answers}

## 10. 过关检查

${list(spec.checklist.map((item) => `[ ] ${item}`))}

## 11. 下一课衔接

${spec.next}
`;
}