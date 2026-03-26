# 快速参考：弹窗焦点陷阱问题修复

## 问题症状
- ❌ 页面有弹窗时，输入框无法输入
- ❌ 输入框没有光标
- ❌ 输入框没有被选中的 UI 边框变化

## 解决方案概览

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 输入框无法获得焦点 | Shadow DOM 焦点陷阱 | 移除 Shadow DOM，使用主文档 DOM |
| 页面无法交互 | host 拦截所有事件 | 恢复 `pointer-events: none` |
| UI 元素无法接收事件 | 父元素 `pointer-events: none` | 子元素设置 `pointer-events: auto` |
| 焦点被弹窗移出 | 弹窗焦点陷阱 | 全局焦点管理器在捕获阶段拦截 |

## 核心代码片段

### 1. 移除 Shadow DOM
```typescript
// ❌ 旧方式
const shadowRoot = host.attachShadow({ mode: "open" });
shadowRoot.append(style, root);

// ✅ 新方式
host.appendChild(style);
host.appendChild(root);
document.documentElement.appendChild(host);
```

### 2. 恢复 `pointer-events: none`
```typescript
host.style.pointerEvents = "none";  // 防止 host 拦截事件
```

### 3. 全局焦点管理
```typescript
document.addEventListener("focusout", (event) => {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement && target.id === "piuiPanelPrompt") {
    const activeDialog = getActiveDialogRoot();
    if (activeDialog) {
      event.preventDefault();
      event.stopPropagation();
      target.focus();  // 立即重新设置焦点
    }
  }
}, true);  // 捕获阶段
```

### 4. 强制焦点设置
```typescript
panelPrompt?.addEventListener("pointerdown", (event) => {
  panelPrompt?.focus();
  panelPrompt?.setSelectionRange(panelPrompt.value.length, panelPrompt.value.length);
  event.stopPropagation();
  event.stopImmediatePropagation();
}, true);
```

## CSS 关键设置

```css
/* host 不拦截事件 */
.piui-root {
  pointer-events: none;
}

/* UI 元素能接收事件 */
.piui-panel,
.piui-inline,
.piui-modal {
  pointer-events: auto;
}

/* 输入框能接收事件 */
.piui-textarea {
  pointer-events: auto;
}
```

## 测试清单

- [ ] 无弹窗时能选择页面元素
- [ ] 无弹窗时能在输入框中输入
- [ ] 有弹窗时能选择页面元素
- [ ] 有弹窗时能在输入框中输入
- [ ] 有弹窗时输入框显示光标
- [ ] 有弹窗时页面可以正常交互

## 常见问题

**Q: 为什么要使用捕获阶段？**
A: 捕获阶段在冒泡阶段之前执行，可以在弹窗焦点陷阱生效之前拦截事件。

**Q: 为什么不能用 Shadow DOM？**
A: Shadow DOM 的焦点陷阱问题无法完全解决，即使使用 `delegatesFocus: true` 也不行。

**Q: 样式隔离怎么办？**
A: 使用 CSS 类名前缀（`piui-`）代替 Shadow DOM 隔离，可以有效避免样式冲突。

**Q: 性能会受影响吗？**
A: 全局焦点监听器在捕获阶段执行，性能影响最小。主文档 DOM 比 Shadow DOM 性能更好。

## 相关文件

- 详细解决方案：`docs/issues/20260326-modal-input-focus-bug-solution.md`
- 修复总结：`docs/issues/SOLUTION_SUMMARY.md`
- 源代码：`packages/browser-extension/src/content.ts`
- GitHub Issue：#1

## 提交历史

```
c83f07d docs: 添加弹窗焦点陷阱问题修复总结
92f7e13 fix: 解决页面有弹窗时扩展面板输入框失效的问题
```
