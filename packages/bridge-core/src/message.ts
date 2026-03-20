import type { ApplyRequest } from "./protocol";

function quote(value: string | undefined): string {
  return value && value.trim() ? value.trim() : "(none)";
}

export function buildPiBridgePrompt(payload: ApplyRequest): string {
  const { pageUrl, selection, intent, sourceHint } = payload;

  const lines = [
    "来自 Pi UI Bridge 的页面改动请求。",
    "",
    "页面信息：",
    `- URL: ${quote(pageUrl)}`,
    "",
    "选中元素：",
    `- tag: ${quote(selection.tag)}`,
    `- selector: ${quote(selection.selector)}`,
    `- domPath: ${quote(selection.domPath)}`,
    `- semanticPath: ${quote(selection.semanticPath)}`,
    `- text: ${quote(selection.text)}`,
    `- test attributes: ${selection.testAttributes?.join(", ") || "(none)"}`,
    "",
    "源码绑定：",
    `- file: ${quote(sourceHint?.file)}`,
    `- line: ${sourceHint?.line ?? "(none)"}`,
    `- column: ${sourceHint?.column ?? "(none)"}`,
    `- component: ${quote(sourceHint?.component)}`,
    `- sourceId: ${quote(sourceHint?.sourceId)}`,
    "",
    "用户需求：",
    `- ${quote(intent.prompt)}`,
    "",
    "执行要求：",
    "1. 先读取绑定文件及相关样式来源",
    "2. 如果绑定文件不够，再追踪调用链",
    "3. 做最小范围修改",
    "4. 修改后总结变更文件和影响范围",
    "",
    "原始结构化数据：",
    "```json",
    JSON.stringify(payload, null, 2),
    "```"
  ];

  return lines.join("\n");
}
