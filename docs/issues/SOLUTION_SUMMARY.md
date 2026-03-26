# Pi UI Bridge - 弹窗焦点陷阱问题修复总结

## 问题

页面有弹窗时，Pi UI Bridge 扩展面板的输入框无法接收输入。

## 解决过程

### 第一阶段：问题诊断
- 发现按钮可以点击，但输入框不能输入
- 初步判断为焦点陷阱问题
- 尝试了多种 Shadow DOM 焦点管理方案，都失败了

### 第二阶段：架构调整
- **关键决策**：放弃 Shadow DOM，改用主文档 DOM
- 原因：Shadow DOM 的焦点陷阱问题无法完全解决
- 优势：直接在主文档中创建 UI，避免焦点陷阱

### 第三阶段：事件处理优化
- 恢复 host 的 `pointer-events: none`
- 确保所有 UI 元素有 `pointer-events: auto`
- 这样 host 不会拦截页面事件，但 UI 元素仍能接收事件

### 第四阶段：全局焦点管理
- 添加全局焦点管理器
- 在捕获阶段拦截 focusout 事件
- 防止弹窗焦点陷阱将焦点移出输入框

## 最终方案

### 核心改动

1. **移除 Shadow DOM**
   - 直接在主文档中创建 UI 元素
   - 避免焦点陷阱问题

2. **恢复 `pointer-events: none`**
   - 防止 host 拦截页面事件
   - UI 元素通过 `pointer-events: auto` 接收事件

3. **全局焦点管理**
   ```typescript
   document.addEventListener("focusout", (event) => {
     if (target.id === "piuiPanelPrompt" && activeDialog) {
       event.preventDefault();
       target.focus();
     }
   }, true);  // 捕获阶段
   ```

4. **强制焦点设置**
   ```typescript
   panelPrompt?.addEventListener("pointerdown", (event) => {
     panelPrompt?.focus();
     panelPrompt?.setSelectionRange(length, length);
   }, true);
   ```

## 关键技术点

### 为什么使用捕获阶段？
- 捕获阶段在冒泡阶段之前执行
- 可以在弹窗焦点陷阱生效之前拦截事件
- 使用 `addEventListener(event, handler, true)` 启用捕获阶段

### 为什么要 `pointer-events: none` 在 host？
- 防止 host 拦截页面事件
- 让事件穿过 host 到达页面元素
- UI 元素的 `pointer-events: auto` 覆盖父元素设置

### 为什么要在 focusout 时重新设置焦点？
- 弹窗焦点陷阱会尝试将焦点移出输入框
- 立即重新设置焦点可以防止焦点离开
- 使用 `event.preventDefault()` 阻止默认焦点移动

## 测试结果

✅ **无弹窗时**：
- 能选择页面元素
- 能在输入框中输入文本
- 页面可以正常交互

✅ **有弹窗时**：
- 能选择页面元素
- 能在输入框中输入文本
- 输入框显示光标
- 页面可以正常交互

## 文件变更

- `packages/browser-extension/src/content.ts`：主要改动
- `packages/browser-extension/public/manifest.json`：添加 content_scripts 配置
- `docs/issues/20260326-modal-input-focus-bug-solution.md`：详细解决方案文档

## 提交信息

```
fix: 解决页面有弹窗时扩展面板输入框失效的问题

- 移除 Shadow DOM，直接在主文档中创建 UI 元素
- 恢复 host 的 pointer-events: none，防止拦截页面事件
- 确保所有 UI 元素有 pointer-events: auto
- 添加全局焦点管理器，在捕获阶段拦截焦点事件
- 防止弹窗的焦点陷阱阻止输入框获得焦点

Fixes #1
```

## 经验总结

1. **焦点陷阱是浏览器级别的问题**，不能完全避免，只能通过全局事件管理来处理

2. **Shadow DOM 不是解决样式隔离的唯一方案**，CSS 类名前缀也能有效避免冲突

3. **捕获阶段事件处理**是处理全局焦点问题的关键

4. **主文档 DOM 比 Shadow DOM 更灵活**，特别是在处理焦点和事件时

5. **测试很重要**，特别是在处理焦点和事件时，需要在实际弹窗环境中测试
