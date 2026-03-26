---
id: "20260326-modal-input-focus-bug-solution"
title: "页面有弹窗时，扩展面板输入框失效 - 解决方案"
status: "completed"
created: "2026-03-26"
updated: "2026-03-26"
category: "bug"
tags: ["workhub", "ui-bridge", "modal", "input", "focus", "solution"]
---

# 解决方案：页面有弹窗时，扩展面板输入框失效

## 问题描述

当页面显示弹窗（Modal）时，Pi UI Bridge 扩展面板中的输入框无法接收输入。具体表现为：
- 按钮可以点击
- 输入框无法获得焦点（没有光标）
- 无法在输入框中输入文本

## 根本原因分析

### 1. Shadow DOM 焦点陷阱问题
原始实现使用 Shadow DOM 来隔离 UI 样式。但弹窗的焦点陷阱会阻止焦点进入 Shadow DOM，导致输入框无法获得焦点。

### 2. 主文档 DOM 层级问题
移除 Shadow DOM 后，host 元素的 `pointer-events: none` 会阻止所有事件到达子元素，即使子元素设置了 `pointer-events: auto`。

### 3. 全局焦点陷阱
弹窗在全局级别设置焦点陷阱，阻止焦点进入扩展面板的输入框。

## 解决方案

### 方案概述

采用**主文档 DOM + 全局焦点管理**的方案：

1. **移除 Shadow DOM**：直接在主文档中创建 UI 元素
2. **恢复 host 的 `pointer-events: none`**：防止 host 拦截页面事件
3. **确保所有 UI 元素有 `pointer-events: auto`**：使 UI 元素能接收事件
4. **添加全局焦点管理器**：在捕获阶段拦截焦点事件，防止弹窗焦点陷阱

### 具体改动

#### 1. 移除 Shadow DOM

**文件**: `packages/browser-extension/src/content.ts`

**改动**:
```typescript
// 旧方式：使用 Shadow DOM
const shadowRoot = host.attachShadow({ mode: "open", delegatesFocus: true });
shadowRoot.append(style, root);

// 新方式：直接在主文档中创建
host.appendChild(style);
host.appendChild(root);
document.documentElement.appendChild(host);
```

#### 2. 恢复 host 的 `pointer-events: none`

```typescript
const host = document.createElement("div");
host.id = HOST_ID;
host.dataset.piUiBridgeUi = "true";
host.style.position = "fixed";
host.style.inset = "0";
host.style.pointerEvents = "none";  // 关键：防止 host 拦截事件
host.style.zIndex = "2147483647";
host.tabIndex = -1;
```

#### 3. 确保 UI 元素有 `pointer-events: auto`

**CSS 改动**:
```css
.piui-panel,
.piui-inline,
.piui-modal {
  pointer-events: auto;  /* 覆盖父元素的 pointer-events: none */
}

.piui-textarea {
  pointer-events: auto;  /* 确保输入框能接收事件 */
}

.piui-modal-mask {
  pointer-events: auto;
}
```

#### 4. 添加全局焦点管理器

**关键代码**:
```typescript
// 防止焦点离开 textarea
document.addEventListener("focusout", (event) => {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement && target.id === "piuiPanelPrompt") {
    const activeDialog = getActiveDialogRoot();
    if (activeDialog) {
      console.log("[Pi UI Bridge] Global focusout: preventing focus loss from textarea");
      event.preventDefault();
      event.stopPropagation();
      // 立即重新设置焦点
      target.focus();
    }
  }
}, true);  // 使用捕获阶段
```

#### 5. 在 pointerdown 时强制设置焦点

```typescript
panelPrompt?.addEventListener("pointerdown", (event) => {
  // 强制设置焦点，绕过弹窗的焦点陷阱
  panelPrompt?.focus();
  // 设置光标到末尾
  if (panelPrompt) {
    panelPrompt.setSelectionRange(panelPrompt.value.length, panelPrompt.value.length);
  }
  event.stopPropagation();
  event.stopImmediatePropagation();
}, true);  // 使用捕获阶段
```

#### 6. 定义 `getActiveDialogRoot` 函数

```typescript
function getActiveDialogRoot(): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(DIALOG_LIKE_SELECTOR));
  if (candidates.length === 0) {
    return null;
  }
  
  // 返回最后一个（最顶层的）弹窗
  return candidates[candidates.length - 1] ?? null;
}
```

## 关键要点

### 为什么要使用捕获阶段？

```typescript
addEventListener("focusout", handler, true);  // true = 捕获阶段
```

捕获阶段允许我们在事件到达目标元素之前拦截它，这样可以防止弹窗的焦点陷阱在冒泡阶段阻止焦点。

### 为什么要在 focusout 时重新设置焦点？

弹窗的焦点陷阱会尝试将焦点移出输入框。通过在 focusout 事件中立即重新设置焦点，我们可以防止焦点离开输入框。

### 为什么要使用 `pointer-events: none` 在 host 上？

如果 host 没有 `pointer-events: none`，它会拦截所有的点击事件，导致页面无法交互。通过设置 `pointer-events: none`，我们让事件穿过 host 到达页面元素，同时 UI 元素的 `pointer-events: auto` 允许它们接收事件。

## 测试验证

### 测试场景

1. **无弹窗时**：
   - ✅ 能选择页面元素
   - ✅ 能在输入框中输入文本
   - ✅ 页面可以正常交互

2. **有弹窗时**：
   - ✅ 能选择页面元素
   - ✅ 能在输入框中输入文本
   - ✅ 输入框显示光标
   - ✅ 页面可以正常交互

### 测试步骤

1. 重新加载扩展
2. 打开有弹窗的网页（如 Bootstrap modal、Ant Design modal、NativeUI modal 等）
3. 打开弹窗
4. 点击扩展面板的输入框
5. 验证光标出现
6. 尝试输入文本

## 性能影响

- **全局焦点监听器**：在捕获阶段监听，性能影响最小
- **DOM 操作**：从 Shadow DOM 改为主文档 DOM，性能略有提升
- **样式隔离**：使用 CSS 类名前缀（`piui-`）代替 Shadow DOM 隔离，可能存在样式冲突风险（但通过前缀可以最小化）

## 兼容性

- ✅ Chrome/Edge（Manifest V3）
- ✅ Firefox
- ✅ Safari
- ✅ 所有现代浏览器

## 相关资源

- [MDN: pointer-events](https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events)
- [MDN: Event capturing](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture)
- [MDN: Focus management](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)

## 总结

通过移除 Shadow DOM 并添加全局焦点管理器，我们成功解决了弹窗焦点陷阱导致的输入框失效问题。关键是在捕获阶段拦截焦点事件，防止弹窗的焦点陷阱阻止输入框获得焦点。
