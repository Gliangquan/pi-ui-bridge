import { MESSAGE_TYPES } from "./messages";
import type { BridgeRuntime, ContentSelection, ContentSourceHint, RuntimeResponse } from "./messages";

declare global {
  interface Window {
    __PI_UI_BRIDGE_CONTENT_BOOTED__?: boolean;
  }
}

type Locale = "zh-CN" | "en-US";

type PanelState = {
  collapsed: boolean;
  selecting: boolean;
  domModalOpen: boolean;
  childrenExpanded: boolean;
  promptDraft: string;
  statusText: string;
  runtime: BridgeRuntime | null;
  selectedElement: HTMLElement | null;
  hoveredElement: HTMLElement | null;
  selectedSelection: ContentSelection | null;
  selectedSourceHint?: ContentSourceHint;
  panelX: number;
  panelY: number;
  modalX: number;
  modalY: number;
  locale: Locale;
};

type DragState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  target: "panel" | "modal";
} | null;

const PANEL_WIDTH = 392;
const COMPOSER_WIDTH = 360;
const PANEL_MARGIN = 16;
const CHILD_PREVIEW_COUNT = 6;
const HOST_ID = "pi-ui-bridge-overlay-host";
const TEXT_LIKE_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "STRONG", "EM", "SMALL"]);
const SELF_STABLE_TAGS = new Set(["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT", "LABEL", "IMG", "VIDEO", "CANVAS"]);
const LANDMARK_TAGS = new Set(["HEADER", "MAIN", "NAV", "ASIDE", "SECTION", "ARTICLE", "FOOTER", "FORM", "DIALOG"]);
const TEST_ATTRIBUTE_NAMES = [
  "data-testid",
  "data-test",
  "data-qa",
  "data-cy",
  "data-slot",
  "data-state",
  "data-variant",
  "data-component",
  "name",
  "aria-controls",
  "aria-labelledby"
] as const;

const STRINGS: Record<Locale, Record<string, string>> = {
  "zh-CN": {
    title: "Pi UI Bridge",
    subtitle: "选中页面元素后直接发给 Pi",
    collapse: "收",
    expand: "开",
    locale: "EN",
    selectOn: "选择:开",
    selectOff: "选择:关",
    refresh: "刷新",
    dom: "DOM",
    selection: "当前选中",
    source: "源码绑定",
    request: "修改需求",
    send: "发送",
    locate: "定位",
    copyJson: "复制JSON",
    copySource: "复制源码",
    currentNode: "当前节点",
    ancestorPath: "祖先路径",
    childPreview: "子节点预览",
    moreChildren: "展开子节点",
    lessChildren: "收起子节点",
    noSelection: "当前未选中元素",
    noSource: "(none)",
    noChildren: "没有可展示的子节点",
    promptPlaceholder: "在元素下方输入修改需求",
    hintTree: "点击祖先或子节点可直接切换目标",
    waiting: "等待连接 Pi Bridge",
    notConnected: "当前页面未连接，请先在 popup 中连接页面",
    connectedPrefix: "已连接",
    selectedRecorded: "已记录选中元素",
    selectingEnabled: "选择模式开启：页面点击事件已拦截",
    selectingDisabled: "选择模式关闭：页面点击事件已恢复",
    treeRelocateFailed: "无法通过 DOM 视图重新定位该节点",
    sourceMissing: "当前选中元素没有 sourceHint",
    noElement: "请先点击页面中的目标元素",
    noPrompt: "请先输入修改需求",
    sending: "正在发送到 Pi...",
    sentPrefix: "已发送到 Pi，请求号",
    copiedJson: "已复制当前 selection JSON",
    copiedSource: "已复制 source",
    copiedLocate: "已复制源码定位",
    copiedInline: "已发送当前元素请求",
    rect: "Rect",
    domPath: "DOM Path",
    semanticPath: "Semantic Path",
    component: "component",
    sourceId: "sourceId",
    selector: "selector",
    text: "text",
    childrenCount: "子节点数",
    siblingHint: "层级较长时，优先从祖先路径切换父级容器，而不是展开整棵树",
    modalTitle: "DOM 视图",
    modalClose: "关闭",
    inlineSend: "发送",
    inlineOpen: "展开面板"
  },
  "en-US": {
    title: "Pi UI Bridge",
    subtitle: "Select page elements and send them to Pi",
    collapse: "-",
    expand: "+",
    locale: "CN",
    selectOn: "Pick:On",
    selectOff: "Pick:Off",
    refresh: "Refresh",
    dom: "DOM",
    selection: "Selected",
    source: "Source",
    request: "Request",
    send: "Send",
    locate: "Locate",
    copyJson: "Copy JSON",
    copySource: "Copy Source",
    currentNode: "Current Node",
    ancestorPath: "Ancestor Path",
    childPreview: "Child Preview",
    moreChildren: "More Children",
    lessChildren: "Collapse Children",
    noSelection: "Nothing selected",
    noSource: "(none)",
    noChildren: "No visible children to preview",
    promptPlaceholder: "Type the change request below the selected element",
    hintTree: "Click an ancestor chip or child node to switch the current target",
    waiting: "Waiting for Pi Bridge connection",
    notConnected: "This page is not connected yet. Connect it from the popup first.",
    connectedPrefix: "Connected",
    selectedRecorded: "Element captured",
    selectingEnabled: "Selection mode enabled: page click events are blocked",
    selectingDisabled: "Selection mode disabled: page click events pass through again",
    treeRelocateFailed: "Failed to relocate this node from the DOM view",
    sourceMissing: "The current element has no sourceHint",
    noElement: "Select a page element first",
    noPrompt: "Enter a change request first",
    sending: "Sending to Pi...",
    sentPrefix: "Sent to Pi, request id",
    copiedJson: "Copied current selection JSON",
    copiedSource: "Copied source",
    copiedLocate: "Copied source location",
    copiedInline: "Sent current element request",
    rect: "Rect",
    domPath: "DOM Path",
    semanticPath: "Semantic Path",
    component: "component",
    sourceId: "sourceId",
    selector: "selector",
    text: "text",
    childrenCount: "child count",
    siblingHint: "When the hierarchy is long, switch to an ancestor container from the path instead of expanding the whole tree",
    modalTitle: "DOM View",
    modalClose: "Close",
    inlineSend: "Send",
    inlineOpen: "Open Panel"
  }
};

const CSS_TEXT = `
:host { all: initial; }
.piui-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  color: #0f172a;
  font-family: "Fira Sans", "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
}
.piui-frame {
  position: fixed;
  top: 0;
  left: 0;
  border-radius: 12px;
  box-sizing: border-box;
  pointer-events: none;
  transition: transform 120ms ease-out, width 120ms ease-out, height 120ms ease-out;
}
.piui-frame--hover {
  border: 2px solid rgba(37, 99, 235, 0.95);
  box-shadow: 0 0 0 1px rgba(147, 197, 253, 0.55) inset, 0 0 0 9999px rgba(37, 99, 235, 0.04);
}
.piui-frame--selected {
  border: 2px solid rgba(16, 185, 129, 0.98);
  box-shadow: 0 0 0 1px rgba(167, 243, 208, 0.5) inset, 0 16px 32px rgba(15, 23, 42, 0.12);
}
.piui-frame__label {
  position: absolute;
  top: -30px;
  left: 0;
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 4px 10px;
  border-radius: 999px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  white-space: nowrap;
  background: rgba(15, 23, 42, 0.9);
}
.piui-panel,
.piui-inline,
.piui-modal {
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(18px);
  pointer-events: auto;
}
.piui-panel {
  position: fixed;
  width: min(392px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
}
.piui-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  cursor: grab;
  user-select: none;
  touch-action: none;
}
.piui-header:active { cursor: grabbing; }
.piui-header-actions { display: flex; gap: 8px; align-items: center; }
.piui-eyebrow,
.piui-section-label,
.piui-hint {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
}
.piui-title {
  margin: 4px 0 0;
  font-family: "Fira Code", "PingFang SC", "Microsoft YaHei", "Consolas", monospace;
  font-size: 18px;
}
.piui-subtitle {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #475569;
}
.piui-toggle,
.piui-button,
.piui-button--primary,
.piui-button--ghost,
.piui-button--chip {
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  font: inherit;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}
.piui-toggle,
.piui-button,
.piui-button--ghost,
.piui-button--chip {
  background: #ffffff;
  color: #0f172a;
}
.piui-button--primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.18);
}
.piui-button--chip.is-active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(59, 130, 246, 0.08));
  border-color: rgba(37, 99, 235, 0.36);
  color: #1d4ed8;
}
.piui-toggle:hover,
.piui-button:hover,
.piui-button--primary:hover,
.piui-button--ghost:hover,
.piui-button--chip:hover {
  transform: translateY(-1px);
  border-color: rgba(37, 99, 235, 0.32);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.piui-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  overflow-y: auto;
}
.piui-toolbar,
.piui-actions,
.piui-secondary-actions,
.piui-inline-actions {
  display: grid;
  gap: 10px;
}
.piui-toolbar,
.piui-secondary-actions,
.piui-inline-actions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.piui-actions {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.piui-card,
.piui-empty,
.piui-modal-body {
  padding: 12px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.94);
}
.piui-card strong {
  display: block;
  font-size: 13px;
  line-height: 1.5;
}
.piui-card p {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #475569;
}
.piui-source-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-family: "Fira Code", "PingFang SC", "Microsoft YaHei", "Consolas", monospace;
  font-size: 11px;
  font-weight: 600;
}
.piui-status {
  padding: 0 4px 2px;
  font-size: 12px;
  line-height: 1.5;
  color: #475569;
}
.piui-inline {
  position: fixed;
  width: min(360px, calc(100vw - 24px));
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
}
.piui-inline-title {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
}
.piui-inline-subtitle {
  font-size: 11px;
  line-height: 1.5;
  color: #64748b;
}
.piui-textarea {
  width: 100%;
  min-height: 88px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 14px;
  box-sizing: border-box;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
}
.piui-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.24);
  pointer-events: auto;
}
.piui-modal {
  position: fixed;
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
}
.piui-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  cursor: grab;
  user-select: none;
  touch-action: none;
}
.piui-modal-header:active { cursor: grabbing; }
.piui-modal-content {
  display: grid;
  gap: 12px;
  padding: 14px;
  overflow-y: auto;
}
.piui-path-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.piui-path-chip,
.piui-child-node,
.piui-tree-node {
  border: 1px solid rgba(148, 163, 184, 0.32);
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
}
.piui-path-chip {
  padding: 6px 10px;
  font-size: 11px;
  font-family: "Fira Code", "PingFang SC", "Microsoft YaHei", "Consolas", monospace;
}
.piui-current-node {
  padding: 10px;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.18);
}
.piui-current-node strong { display: block; font-size: 13px; }
.piui-current-node p { margin: 6px 0 0; font-size: 12px; color: #475569; }
.piui-children-list {
  display: grid;
  gap: 8px;
}
.piui-child-node {
  width: 100%;
  padding: 8px 10px;
  text-align: left;
}
.piui-tree-node {
  width: 100%;
  text-align: left;
  padding: 5px 8px;
  margin-top: 6px;
}
.piui-tree-node--selected {
  color: #2563eb;
  font-weight: 700;
}
.piui-tree-block {
  font-family: "Fira Code", "PingFang SC", "Microsoft YaHei", "Consolas", monospace;
  font-size: 11px;
  line-height: 1.7;
}
.piui-tree-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}
@media (max-width: 640px) {
  .piui-panel,
  .piui-modal,
  .piui-inline {
    width: calc(100vw - 24px);
  }
  .piui-actions,
  .piui-secondary-actions,
  .piui-toolbar,
  .piui-inline-actions {
    grid-template-columns: 1fr;
  }
}
`;

function getInitialLocale(): Locale {
  return navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}

function t(state: PanelState, key: string): string {
  return STRINGS[state.locale][key] ?? key;
}

function getInitialPanelPosition() {
  const width = Math.min(PANEL_WIDTH, window.innerWidth - PANEL_MARGIN * 2);
  return {
    x: Math.max(PANEL_MARGIN, window.innerWidth - width - PANEL_MARGIN),
    y: PANEL_MARGIN
  };
}

function clampPanelPosition(x: number, y: number, panelWidth: number, panelHeight: number) {
  const maxX = Math.max(PANEL_MARGIN, window.innerWidth - panelWidth - PANEL_MARGIN);
  const maxY = Math.max(PANEL_MARGIN, window.innerHeight - panelHeight - PANEL_MARGIN);
  return {
    x: Math.min(Math.max(x, PANEL_MARGIN), maxX),
    y: Math.min(Math.max(y, PANEL_MARGIN), maxY)
  };
}

function clampInlinePosition(x: number, y: number, width: number, height: number) {
  const next = clampPanelPosition(x, y, width, height);
  return next;
}

function escapeSelectorFragment(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function buildClassSignature(element: HTMLElement): string {
  const classNames = Array.from(element.classList).filter(Boolean).slice(0, 2);
  return classNames.length > 0 ? `.${classNames.map(escapeSelectorFragment).join(".")}` : "";
}

function buildNthOfTypeSelector(element: HTMLElement): string {
  const parent = element.parentElement;
  if (!parent) {
    return "";
  }

  const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
  if (siblings.length <= 1) {
    return "";
  }

  const index = siblings.indexOf(element) + 1;
  return index > 0 ? `:nth-of-type(${index})` : "";
}

function buildSelectorSegment(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();
  if (element.id) {
    return `${tag}#${escapeSelectorFragment(element.id)}`;
  }

  const classSignature = buildClassSignature(element);
  if (classSignature) {
    return `${tag}${classSignature}`;
  }

  return `${tag}${buildNthOfTypeSelector(element)}`;
}

function isLandmarkElement(element: HTMLElement): boolean {
  if (LANDMARK_TAGS.has(element.tagName)) {
    return true;
  }

  return element.hasAttribute("role");
}

function getTextPreview(element: HTMLElement): string | undefined {
  const text = element.textContent?.replace(/\s+/g, " ").trim();
  if (!text) {
    return undefined;
  }
  return text.slice(0, 80);
}

function getAttributePreview(element: HTMLElement, name: string): string | undefined {
  const value = element.getAttribute(name)?.replace(/\s+/g, " ").trim();
  return value ? value.slice(0, 120) : undefined;
}

function getTestAttributeHints(element: HTMLElement): string[] {
  const hints: string[] = [];
  if (element.id) {
    hints.push(`id=${element.id}`);
  }
  for (const name of TEST_ATTRIBUTE_NAMES) {
    const value = getAttributePreview(element, name);
    if (value) {
      hints.push(`${name}=${value}`);
    }
  }
  return hints.slice(0, 6);
}

function shouldPromoteSelection(element: HTMLElement): boolean {
  if (SELF_STABLE_TAGS.has(element.tagName)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const area = rect.width * rect.height;

  return (
    TEXT_LIKE_TAGS.has(element.tagName) ||
    style.display === "inline" ||
    (element.childElementCount === 0 && area < 6400) ||
    rect.height < 28
  );
}

function isReasonablePromotionTarget(current: HTMLElement, candidate: HTMLElement): boolean {
  if (candidate.tagName === "BODY" || candidate.tagName === "HTML") {
    return false;
  }

  const currentRect = current.getBoundingClientRect();
  const candidateRect = candidate.getBoundingClientRect();
  const currentArea = Math.max(1, currentRect.width * currentRect.height);
  const candidateArea = candidateRect.width * candidateRect.height;

  if (candidateArea > window.innerWidth * window.innerHeight * 0.72) {
    return false;
  }
  if (candidateArea > currentArea * 30) {
    return false;
  }

  const style = window.getComputedStyle(candidate);
  const isLayoutContainer =
    style.display === "block" ||
    style.display === "flex" ||
    style.display === "grid" ||
    style.display === "inline-flex" ||
    style.display === "inline-grid";

  return isLayoutContainer || candidate.classList.length > 0 || candidate.childElementCount > 1 || candidate.hasAttribute("role");
}

function resolvePreferredSelectionTarget(element: HTMLElement): HTMLElement {
  if (!shouldPromoteSelection(element)) {
    return element;
  }

  let current = element;
  let best = element;
  let depth = 0;

  while (current.parentElement && depth < 4) {
    const parent = current.parentElement;
    if (isReasonablePromotionTarget(current, parent)) {
      best = parent;
      break;
    }
    current = parent;
    depth += 1;
  }

  return best;
}

function toHTMLElement(target: EventTarget | null): HTMLElement | null {
  if (target instanceof HTMLElement) {
    return target;
  }
  if (target instanceof Element) {
    let current: Element | null = target;
    while (current && !(current instanceof HTMLElement)) {
      current = current.parentElement;
    }
    return current;
  }
  return null;
}

function sendMessage<T extends RuntimeResponse>(message: object): Promise<T> {
  return chrome.runtime.sendMessage(message);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getElementText(element: HTMLElement): string | undefined {
  return getTextPreview(element);
}

function getSelector(element: HTMLElement): string {
  return buildSelectorSegment(element);
}

function getDomPath(element: HTMLElement, depth = 5): string {
  const segments: string[] = [];
  let current: HTMLElement | null = element;
  while (current && segments.length < depth) {
    if (current.tagName === "BODY" || current.tagName === "HTML") {
      break;
    }
    segments.unshift(getSelector(current));
    current = current.parentElement;
  }
  return segments.join(" > ");
}

function getSemanticPath(element: HTMLElement, depth = 5): string | undefined {
  const selectors: string[] = [];
  let current: HTMLElement | null = element;
  while (current && selectors.length < depth) {
    if (current.tagName === "BODY" || current.tagName === "HTML") {
      break;
    }
    if (isLandmarkElement(current)) {
      selectors.unshift(getSelector(current));
    }
    current = current.parentElement;
  }
  return selectors.length > 0 ? selectors.join(" > ") : undefined;
}

function getRect(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

function getSourceHint(element: HTMLElement): ContentSourceHint | undefined {
  const sourceId = getAttributePreview(element, "data-pi-source-id");
  const file = getAttributePreview(element, "data-pi-source-file");
  const line = getAttributePreview(element, "data-pi-source-line");
  const column = getAttributePreview(element, "data-pi-source-column");
  const component = getAttributePreview(element, "data-pi-component");
  if (!sourceId && !file && !line && !column && !component) {
    return undefined;
  }
  return {
    sourceId,
    file,
    line: line ? Number(line) : undefined,
    column: column ? Number(column) : undefined,
    component
  };
}

function toSelection(element: HTMLElement): ContentSelection {
  return {
    tag: element.tagName.toLowerCase(),
    selector: getSelector(element),
    domPath: getDomPath(element),
    semanticPath: getSemanticPath(element),
    text: getElementText(element),
    testAttributes: getTestAttributeHints(element),
    rect: getRect(element)
  };
}

function isInsideUi(event: Event): boolean {
  return event.composedPath().some((node) => node instanceof HTMLElement && node.dataset.piUiBridgeUi === "true");
}

function getElementLabel(element: HTMLElement): string {
  const selector = getSelector(element);
  const text = getElementText(element);
  return text ? `${selector} · ${text}` : selector;
}

function buildSelectionJson(selection: ContentSelection | null, sourceHint?: ContentSourceHint): string {
  return JSON.stringify({ selection, sourceHint }, null, 2);
}

function getChildrenElements(element: HTMLElement): HTMLElement[] {
  return Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
}

function findElementByDomPath(domPath: string): HTMLElement | null {
  if (!domPath) {
    return null;
  }

  const segments = domPath.split(" > ").map((segment) => segment.trim()).filter(Boolean);
  let current: ParentNode = document;
  let currentElement: HTMLElement | null = null;

  for (const segment of segments) {
    const candidate = current.querySelector(segment);
    if (!(candidate instanceof HTMLElement)) {
      return null;
    }
    currentElement = candidate;
    current = candidate;
  }

  return currentElement;
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function closeTransientUi(state: PanelState) {
  state.domModalOpen = false;
  state.childrenExpanded = false;
}

function buildDomExplorerMarkup(state: PanelState): string {
  if (!state.selectedElement) {
    return `<div class="piui-empty">${escapeHtml(t(state, "noSelection"))}</div>`;
  }

  const ancestors: HTMLElement[] = [];
  let current = state.selectedElement.parentElement;
  while (current && current.tagName !== "BODY" && current.tagName !== "HTML") {
    ancestors.unshift(current);
    current = current.parentElement;
  }

  const children = getChildrenElements(state.selectedElement);
  const visibleChildren = state.childrenExpanded ? children : children.slice(0, CHILD_PREVIEW_COUNT);

  const chips = ancestors.length
    ? `<div class="piui-path-chips">${ancestors
        .map(
          (item) =>
            `<button class="piui-path-chip" data-pi-node-path="${escapeHtml(getDomPath(item, 8))}" data-pi-ui-bridge-ui="true">${escapeHtml(getElementLabel(item))}</button>`
        )
        .join("")}</div>`
    : `<div class="piui-empty">${escapeHtml(t(state, "noSource"))}</div>`;

  const currentNode = `<div class="piui-current-node"><strong>${escapeHtml(getElementLabel(state.selectedElement))}</strong><p>${escapeHtml(
    `${t(state, "selector")}: ${state.selectedSelection?.selector || t(state, "noSource")}`
  )}</p><p>${escapeHtml(`${t(state, "text")}: ${state.selectedSelection?.text || t(state, "noSource")}`)}</p></div>`;

  const childNodes = visibleChildren.length
    ? `<div class="piui-children-list">${visibleChildren
        .map(
          (item) =>
            `<button class="piui-child-node" data-pi-node-path="${escapeHtml(getDomPath(item, 8))}" data-pi-ui-bridge-ui="true">${escapeHtml(getElementLabel(item))}</button>`
        )
        .join("")}</div>`
    : `<div class="piui-empty">${escapeHtml(t(state, "noChildren"))}</div>`;

  const childToggle =
    children.length > CHILD_PREVIEW_COUNT
      ? `<button id="piuiToggleChildren" class="piui-button" data-pi-ui-bridge-ui="true">${escapeHtml(
          state.childrenExpanded ? t(state, "lessChildren") : `${t(state, "moreChildren")} (${children.length})`
        )}</button>`
      : "";

  const treeLines = [
    ...ancestors.map(
      (item, index) =>
        `<button class="piui-tree-node" data-pi-node-path="${escapeHtml(getDomPath(item, 8))}" data-pi-ui-bridge-ui="true" style="padding-left:${index * 14}px;">└ ${escapeHtml(getElementLabel(item))}</button>`
    ),
    `<button class="piui-tree-node piui-tree-node--selected" data-pi-node-path="${escapeHtml(getDomPath(state.selectedElement, 8))}" data-pi-ui-bridge-ui="true" style="padding-left:${ancestors.length * 14}px;">└ ${escapeHtml(getElementLabel(state.selectedElement))}</button>`,
    ...visibleChildren.map(
      (item, index) =>
        `<button class="piui-tree-node" data-pi-node-path="${escapeHtml(getDomPath(item, 8))}" data-pi-ui-bridge-ui="true" style="padding-left:${(ancestors.length + 1) * 14}px;">${index === visibleChildren.length - 1 ? "└" : "├"} ${escapeHtml(getElementLabel(item))}</button>`
    )
  ].join("");

  return `
    <div class="piui-card">
      <p class="piui-section-label">${escapeHtml(t(state, "ancestorPath"))}</p>
      ${chips}
      <div class="piui-tree-meta">${escapeHtml(t(state, "siblingHint"))}</div>
    </div>
    <div class="piui-card">
      <p class="piui-section-label">${escapeHtml(t(state, "currentNode"))}</p>
      ${currentNode}
      <div class="piui-tree-meta">${escapeHtml(`${t(state, "childrenCount")}: ${children.length}`)}</div>
    </div>
    <div class="piui-card">
      <p class="piui-section-label">${escapeHtml(t(state, "childPreview"))}</p>
      ${childNodes}
      ${childToggle}
    </div>
    <div class="piui-card piui-tree-block">
      ${treeLines}
    </div>
  `;
}

async function boot() {
  if (window.__PI_UI_BRIDGE_CONTENT_BOOTED__) {
    return;
  }
  window.__PI_UI_BRIDGE_CONTENT_BOOTED__ = true;

  const existingHost = document.getElementById(HOST_ID);
  if (existingHost) {
    return;
  }

  const initialPosition = getInitialPanelPosition();
  const state: PanelState = {
    collapsed: false,
    selecting: true,
    domModalOpen: false,
    childrenExpanded: false,
    promptDraft: "",
    statusText: STRINGS[getInitialLocale()].waiting,
    runtime: null,
    selectedElement: null,
    hoveredElement: null,
    selectedSelection: null,
    selectedSourceHint: undefined,
    panelX: initialPosition.x,
    panelY: initialPosition.y,
    modalX: Math.max(PANEL_MARGIN, window.innerWidth / 2 - 280),
    modalY: Math.max(PANEL_MARGIN, window.innerHeight / 2 - 260),
    locale: getInitialLocale()
  };

  let dragState: DragState = null;

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = "2147483647";

  const shadowRoot = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = CSS_TEXT;

  const root = document.createElement("div");
  root.className = "piui-root";

  const hoverFrame = document.createElement("div");
  hoverFrame.className = "piui-frame piui-frame--hover";
  hoverFrame.style.display = "none";
  const hoverLabel = document.createElement("span");
  hoverLabel.className = "piui-frame__label";
  hoverFrame.appendChild(hoverLabel);

  const selectedFrame = document.createElement("div");
  selectedFrame.className = "piui-frame piui-frame--selected";
  selectedFrame.style.display = "none";
  const selectedLabel = document.createElement("span");
  selectedLabel.className = "piui-frame__label";
  selectedFrame.appendChild(selectedLabel);

  const panel = document.createElement("aside");
  panel.className = "piui-panel";
  panel.dataset.piUiBridgeUi = "true";

  const inlineComposer = document.createElement("div");
  inlineComposer.className = "piui-inline";
  inlineComposer.style.display = "none";
  inlineComposer.dataset.piUiBridgeUi = "true";

  const modalMask = document.createElement("div");
  modalMask.className = "piui-modal-mask";
  modalMask.style.display = "none";
  modalMask.dataset.piUiBridgeUi = "true";

  const modal = document.createElement("div");
  modal.className = "piui-modal";
  modal.style.display = "none";
  modal.dataset.piUiBridgeUi = "true";

  root.appendChild(hoverFrame);
  root.appendChild(selectedFrame);
  root.appendChild(panel);
  root.appendChild(inlineComposer);
  root.appendChild(modalMask);
  root.appendChild(modal);
  shadowRoot.append(style, root);
  document.documentElement.appendChild(host);

  function renderPanel() {
    const sourceText = state.selectedSourceHint?.file || state.selectedSourceHint?.sourceId
      ? `${state.selectedSourceHint.file || state.selectedSourceHint.sourceId}${state.selectedSourceHint.line ? `:${state.selectedSourceHint.line}` : ""}`
      : t(state, "noSource");

    panel.style.left = `${state.panelX}px`;
    panel.style.top = `${state.panelY}px`;

    panel.innerHTML = `
      <div class="piui-header" data-pi-ui-bridge-ui="true">
        <div data-pi-ui-bridge-ui="true">
          <p class="piui-eyebrow">${escapeHtml(t(state, "title"))}</p>
          <h2 class="piui-title">${escapeHtml(t(state, "subtitle"))}</h2>
          <p class="piui-subtitle">${escapeHtml(state.statusText)}</p>
        </div>
        <div class="piui-header-actions" data-pi-ui-bridge-ui="true">
          <button id="piuiToggleLocale" class="piui-toggle" data-pi-ui-bridge-ui="true">${escapeHtml(t(state, "locale"))}</button>
          <button id="piuiToggleCollapse" class="piui-toggle" data-pi-ui-bridge-ui="true">${escapeHtml(state.collapsed ? t(state, "expand") : t(state, "collapse"))}</button>
        </div>
      </div>
      ${state.collapsed ? "" : `
      <div class="piui-body" data-pi-ui-bridge-ui="true">
        <div class="piui-toolbar" data-pi-ui-bridge-ui="true">
          <button id="piuiToggleSelect" class="piui-button--chip ${state.selecting ? "is-active" : ""}" data-pi-ui-bridge-ui="true">${escapeHtml(state.selecting ? t(state, "selectOn") : t(state, "selectOff"))}</button>
          <button id="piuiRefresh" class="piui-button--ghost" data-pi-ui-bridge-ui="true">${escapeHtml(t(state, "refresh"))}</button>
        </div>
        <section data-pi-ui-bridge-ui="true">
          <p class="piui-section-label">${escapeHtml(t(state, "selection"))}</p>
          <div class="piui-card">
            <strong>${state.selectedElement ? escapeHtml(getElementLabel(state.selectedElement)) : escapeHtml(t(state, "noSelection"))}</strong>
            <p>${escapeHtml(`${t(state, "domPath")}: ${state.selectedSelection?.domPath || t(state, "noSource")}`)}</p>
            <p>${escapeHtml(`${t(state, "semanticPath")}: ${state.selectedSelection?.semanticPath || t(state, "noSource")}`)}</p>
            <p>${escapeHtml(`${t(state, "rect")}: ${state.selectedSelection?.rect ? `${state.selectedSelection.rect.x}, ${state.selectedSelection.rect.y}, ${state.selectedSelection.rect.width}×${state.selectedSelection.rect.height}` : t(state, "noSource")}`)}</p>
          </div>
        </section>
        <section data-pi-ui-bridge-ui="true">
          <p class="piui-section-label">${escapeHtml(t(state, "source"))}</p>
          <div class="piui-card">
            <div class="piui-source-chip">${escapeHtml(sourceText)}</div>
            <p>${escapeHtml(`${t(state, "component")}: ${state.selectedSourceHint?.component || t(state, "noSource")}`)}</p>
            <p>${escapeHtml(`${t(state, "sourceId")}: ${state.selectedSourceHint?.sourceId || t(state, "noSource")}`)}</p>
          </div>
        </section>
        <div class="piui-actions" data-pi-ui-bridge-ui="true">
          <button id="piuiOpenDom" class="piui-button--ghost" data-pi-ui-bridge-ui="true">${escapeHtml(t(state, "dom"))}</button>
          <button id="piuiLocateSource" class="piui-button--ghost" data-pi-ui-bridge-ui="true">${escapeHtml(t(state, "locate"))}</button>
          <button id="piuiCopySource" class="piui-button--ghost" data-pi-ui-bridge-ui="true">${escapeHtml(t(state, "copySource"))}</button>
        </div>
        <div class="piui-secondary-actions" data-pi-ui-bridge-ui="true">
          <button id="piuiCopyJson" class="piui-button" data-pi-ui-bridge-ui="true">${escapeHtml(t(state, "copyJson"))}</button>
          <button id="piuiFocusComposer" class="piui-button" data-pi-ui-bridge-ui="true">${escapeHtml(t(state, "inlineOpen"))}</button>
        </div>
        <div class="piui-status" data-pi-ui-bridge-ui="true">${escapeHtml(state.statusText)}</div>
      </div>`}
    `;

    const header = panel.querySelector<HTMLElement>(".piui-header");
    const toggleLocaleButton = panel.querySelector<HTMLButtonElement>("#piuiToggleLocale");
    const toggleCollapseButton = panel.querySelector<HTMLButtonElement>("#piuiToggleCollapse");
    const toggleSelectButton = panel.querySelector<HTMLButtonElement>("#piuiToggleSelect");
    const refreshButton = panel.querySelector<HTMLButtonElement>("#piuiRefresh");
    const openDomButton = panel.querySelector<HTMLButtonElement>("#piuiOpenDom");
    const locateSourceButton = panel.querySelector<HTMLButtonElement>("#piuiLocateSource");
    const copySourceButton = panel.querySelector<HTMLButtonElement>("#piuiCopySource");
    const copyJsonButton = panel.querySelector<HTMLButtonElement>("#piuiCopyJson");
    const focusComposerButton = panel.querySelector<HTMLButtonElement>("#piuiFocusComposer");

    if (header) {
      header.onpointerdown = (event) => {
        if (event.target instanceof HTMLElement && event.target.closest("button")) return;
        event.preventDefault();
        dragState = { startX: event.clientX, startY: event.clientY, originX: state.panelX, originY: state.panelY, target: "panel" };
      };
    }
    toggleLocaleButton?.addEventListener("click", () => {
      state.locale = state.locale === "zh-CN" ? "en-US" : "zh-CN";
      state.statusText = state.runtime?.browserSessionId ? `${t(state, "connectedPrefix")}: ${state.runtime.browserSessionId}` : t(state, "waiting");
      renderAll();
    });
    toggleCollapseButton?.addEventListener("click", () => { state.collapsed = !state.collapsed; renderAll(); });
    toggleSelectButton?.addEventListener("click", () => {
      state.selecting = !state.selecting;
      state.statusText = state.selecting ? t(state, "selectingEnabled") : t(state, "selectingDisabled");
      if (!state.selecting) {
        state.hoveredElement = null;
        closeTransientUi(state);
      }
      renderAll();
    });
    refreshButton?.addEventListener("click", () => { void loadRuntime(); });
    openDomButton?.addEventListener("click", () => { state.domModalOpen = true; renderAll(); });
    locateSourceButton?.addEventListener("click", async () => {
      if (!state.selectedSourceHint?.file && !state.selectedSourceHint?.sourceId) {
        state.statusText = t(state, "sourceMissing");
        renderAll();
        return;
      }
      const text = state.selectedSourceHint.file ? `${state.selectedSourceHint.file}${state.selectedSourceHint.line ? `:${state.selectedSourceHint.line}` : ""}` : state.selectedSourceHint.sourceId || "";
      await copyText(text);
      state.statusText = `${t(state, "copiedLocate")}: ${text}`;
      renderAll();
    });
    copySourceButton?.addEventListener("click", async () => {
      const source = state.selectedSourceHint?.sourceId || state.selectedSourceHint?.file;
      if (!source) {
        state.statusText = t(state, "sourceMissing");
        renderAll();
        return;
      }
      await copyText(source);
      state.statusText = `${t(state, "copiedSource")}: ${source}`;
      renderAll();
    });
    copyJsonButton?.addEventListener("click", async () => {
      await copyText(buildSelectionJson(state.selectedSelection, state.selectedSourceHint));
      state.statusText = t(state, "copiedJson");
      renderAll();
    });
    focusComposerButton?.addEventListener("click", () => { state.collapsed = false; renderAll(); });
  }

  function renderInlineComposer() {
    if (!state.selectedElement || !state.selecting) {
      inlineComposer.style.display = "none";
      return;
    }
    const rect = state.selectedElement.getBoundingClientRect();
    const placeBelow = rect.bottom + 12 + 180 <= window.innerHeight;
    const rawX = rect.left;
    const rawY = placeBelow ? rect.bottom + 10 : Math.max(PANEL_MARGIN, rect.top - 170);
    const next = clampInlinePosition(rawX, rawY, COMPOSER_WIDTH, 170);
    inlineComposer.style.display = "grid";
    inlineComposer.style.left = `${next.x}px`;
    inlineComposer.style.top = `${next.y}px`;
    inlineComposer.innerHTML = `
      <div class="piui-inline-title" data-pi-ui-bridge-ui="true">${escapeHtml(state.selectedElement ? getElementLabel(state.selectedElement) : t(state, "noSelection"))}</div>
      <div class="piui-inline-subtitle" data-pi-ui-bridge-ui="true">${escapeHtml(state.selectedSourceHint?.file || state.selectedSourceHint?.sourceId || t(state, "noSource"))}</div>
      <textarea id="piuiInlinePrompt" class="piui-textarea" data-pi-ui-bridge-ui="true" placeholder="${escapeHtml(t(state, "promptPlaceholder"))}">${escapeHtml(state.promptDraft)}</textarea>
      <div class="piui-inline-actions" data-pi-ui-bridge-ui="true">
        <button id="piuiInlineSend" class="piui-button--primary" data-pi-ui-bridge-ui="true">${escapeHtml(t(state, "inlineSend"))}</button>
        <button id="piuiInlineDom" class="piui-button--ghost" data-pi-ui-bridge-ui="true">${escapeHtml(t(state, "dom"))}</button>
      </div>
    `;
    const prompt = inlineComposer.querySelector<HTMLTextAreaElement>("#piuiInlinePrompt");
    const sendButton = inlineComposer.querySelector<HTMLButtonElement>("#piuiInlineSend");
    const domButton = inlineComposer.querySelector<HTMLButtonElement>("#piuiInlineDom");
    prompt?.addEventListener("input", () => { state.promptDraft = prompt.value; });
    prompt?.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });
    prompt?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    prompt?.addEventListener("keydown", (event) => {
      event.stopPropagation();
    });
    domButton?.addEventListener("click", () => { state.domModalOpen = true; renderAll(); });
    sendButton?.addEventListener("click", async () => {
      if (!state.runtime?.config.bridgeUrl || !state.runtime.browserSessionId) {
        state.statusText = t(state, "notConnected");
        renderAll();
        return;
      }
      if (!state.selectedSelection || !state.selectedElement) {
        state.statusText = t(state, "noElement");
        renderAll();
        return;
      }
      const promptText = (prompt?.value || state.promptDraft).trim();
      if (!promptText) {
        state.statusText = t(state, "noPrompt");
        renderAll();
        return;
      }
      state.statusText = t(state, "sending");
      renderAll();
      const response = await sendMessage<RuntimeResponse>({
        type: MESSAGE_TYPES.contentApply,
        pageUrl: window.location.href,
        selection: state.selectedSelection,
        sourceHint: state.selectedSourceHint,
        prompt: promptText
      });
      if (!response.ok) {
        state.statusText = response.error || "Apply failed";
        renderAll();
        return;
      }
      state.promptDraft = "";
      state.statusText = `${t(state, "sentPrefix")}: ${response.requestId}`;
      renderAll();
    });
  }

  function renderDomModal() {
    if (!state.domModalOpen) {
      modalMask.style.display = "none";
      modal.style.display = "none";
      return;
    }
    modalMask.style.display = "block";
    modal.style.display = "flex";
    modal.style.left = `${state.modalX}px`;
    modal.style.top = `${state.modalY}px`;
    modal.innerHTML = `
      <div class="piui-modal-header" data-pi-ui-bridge-ui="true">
        <div data-pi-ui-bridge-ui="true">
          <p class="piui-eyebrow">${escapeHtml(t(state, "dom"))}</p>
          <h2 class="piui-title">${escapeHtml(t(state, "modalTitle"))}</h2>
        </div>
        <button id="piuiCloseModal" class="piui-toggle" data-pi-ui-bridge-ui="true">${escapeHtml(t(state, "modalClose"))}</button>
      </div>
      <div class="piui-modal-content" data-pi-ui-bridge-ui="true">${buildDomExplorerMarkup(state)}</div>
    `;
    const modalHeader = modal.querySelector<HTMLElement>(".piui-modal-header");
    modalHeader?.addEventListener("pointerdown", (event) => {
      if (event.target instanceof HTMLElement && event.target.closest("button")) {
        return;
      }
      event.preventDefault();
      dragState = { startX: event.clientX, startY: event.clientY, originX: state.modalX, originY: state.modalY, target: "modal" };
    });
    modal.querySelector<HTMLButtonElement>("#piuiCloseModal")?.addEventListener("click", () => {
      state.domModalOpen = false;
      renderAll();
    });
    modal.querySelector<HTMLButtonElement>("#piuiToggleChildren")?.addEventListener("click", () => {
      state.childrenExpanded = !state.childrenExpanded;
      renderAll();
    });
    modal.querySelectorAll<HTMLElement>("[data-pi-node-path]").forEach((node) => {
      node.addEventListener("click", () => {
        const domPath = node.dataset.piNodePath || "";
        const target = findElementByDomPath(domPath);
        if (!target) {
          state.statusText = t(state, "treeRelocateFailed");
          renderAll();
          return;
        }
        selectElement(target, false);
      });
    });
  }

  function renderAll() {
    renderPanel();
    renderInlineComposer();
    renderDomModal();
    syncFrames();
  }

  function updateFrame(frame: HTMLElement, label: HTMLElement, element: HTMLElement | null, visible: boolean) {
    if (!element || !visible) {
      frame.style.display = "none";
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      frame.style.display = "none";
      return;
    }

    frame.style.display = "block";
    frame.style.transform = `translate(${rect.x}px, ${rect.y}px)`;
    frame.style.width = `${rect.width}px`;
    frame.style.height = `${rect.height}px`;
    label.textContent = getElementLabel(element);
  }

  function syncFrames() {
    updateFrame(hoverFrame, hoverLabel, state.hoveredElement, state.selecting && Boolean(state.hoveredElement) && state.hoveredElement !== state.selectedElement);
    updateFrame(selectedFrame, selectedLabel, state.selectedElement, Boolean(state.selectedElement));
  }

  function selectElement(element: HTMLElement, syncRemote: boolean) {
    const promoted = resolvePreferredSelectionTarget(element);
    state.selectedElement = promoted;
    state.selectedSelection = toSelection(promoted);
    state.selectedSourceHint = getSourceHint(promoted);
    state.hoveredElement = promoted;
    state.childrenExpanded = false;
    state.statusText = t(state, "selectedRecorded");
    renderAll();

    if (syncRemote && state.runtime?.config.bridgeUrl && state.runtime.browserSessionId) {
      void sendMessage<RuntimeResponse>({
        type: MESSAGE_TYPES.contentSelectionSync,
        pageUrl: window.location.href,
        selection: state.selectedSelection,
        sourceHint: state.selectedSourceHint
      });
    }
  }

  async function loadRuntime() {
    const response = await sendMessage<RuntimeResponse>({
      type: MESSAGE_TYPES.contentGetBridgeRuntime
    });

    state.runtime = response.runtime ?? null;
    if (!state.runtime?.config.bridgeUrl || !state.runtime.browserSessionId) {
      state.statusText = t(state, "notConnected");
    } else {
      state.statusText = `${t(state, "connectedPrefix")}: ${state.runtime.browserSessionId}`;
    }
    renderAll();
  }

  function handleHover(target: EventTarget | null) {
    if (!state.selecting) {
      state.hoveredElement = null;
      syncFrames();
      return;
    }

    const element = toHTMLElement(target);
    if (!element) {
      state.hoveredElement = null;
      syncFrames();
      return;
    }

    state.hoveredElement = resolvePreferredSelectionTarget(element);
    syncFrames();
  }

  modalMask.addEventListener("click", () => {
    state.domModalOpen = false;
    renderAll();
  });

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (isInsideUi(event)) {
        event.stopPropagation();
      }
    },
    true
  );

  document.addEventListener(
    "mousemove",
    (event) => {
      if (isInsideUi(event)) {
        state.hoveredElement = null;
        syncFrames();
        return;
      }
      handleHover(event.target);
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      if (isInsideUi(event)) {
        return;
      }
      if (!state.selecting) {
        return;
      }
      const target = toHTMLElement(event.target);
      if (!target) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      selectElement(target, true);
    },
    true
  );

  window.addEventListener("pointermove", (event) => {
    if (!dragState) {
      return;
    }

    if (dragState.target === "panel") {
      const next = clampPanelPosition(
        dragState.originX + (event.clientX - dragState.startX),
        dragState.originY + (event.clientY - dragState.startY),
        panel.offsetWidth || PANEL_WIDTH,
        panel.offsetHeight || 320
      );
      state.panelX = next.x;
      state.panelY = next.y;
      panel.style.left = `${state.panelX}px`;
      panel.style.top = `${state.panelY}px`;
      return;
    }

    const next = clampPanelPosition(
      dragState.originX + (event.clientX - dragState.startX),
      dragState.originY + (event.clientY - dragState.startY),
      modal.offsetWidth || 560,
      modal.offsetHeight || 520
    );
    state.modalX = next.x;
    state.modalY = next.y;
    modal.style.left = `${state.modalX}px`;
    modal.style.top = `${state.modalY}px`;
  });

  window.addEventListener("pointerup", () => {
    dragState = null;
  });

  window.addEventListener("resize", () => {
    const nextPanel = clampPanelPosition(state.panelX, state.panelY, panel.offsetWidth || PANEL_WIDTH, panel.offsetHeight || 320);
    state.panelX = nextPanel.x;
    state.panelY = nextPanel.y;
    const nextModal = clampPanelPosition(state.modalX, state.modalY, modal.offsetWidth || 560, modal.offsetHeight || 520);
    state.modalX = nextModal.x;
    state.modalY = nextModal.y;
    renderAll();
  });

  window.addEventListener("scroll", () => {
    renderInlineComposer();
    syncFrames();
  }, true);

  document.body.appendChild(host);
  await loadRuntime();
}

void boot();
