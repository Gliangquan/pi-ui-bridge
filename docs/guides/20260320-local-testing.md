# 本地联调说明

## 1. 在项目目录启动 pi 并加载本地扩展

```bash
cd repos/pi-ui-bridge
pi -e ./extensions/pi-ui-bridge/index.ts
```

## 2. 在 pi 中启动 bridge

```text
/ui-start
```

记录输出的：

- `http://127.0.0.1:<port>`
- `token`

## 3. 用 curl 做最小联调

### health

```bash
curl http://127.0.0.1:<port>/health
```

### attach

```bash
curl -X POST http://127.0.0.1:<port>/attach \
  -H 'content-type: application/json' \
  -H 'x-pi-ui-token: <token>' \
  -d '{
    "pageUrl": "http://localhost:5173",
    "pageTitle": "Demo App",
    "framework": "react"
  }'
```

### apply

```bash
curl -X POST http://127.0.0.1:<port>/apply \
  -H 'content-type: application/json' \
  -H 'x-pi-ui-token: <token>' \
  -d '{
    "browserSessionId": "browser-test",
    "pageUrl": "http://localhost:5173",
    "selection": {
      "tag": "button",
      "selector": "button.demo-button",
      "domPath": "main > section > button",
      "text": "立即开始"
    },
    "intent": {
      "type": "describe",
      "prompt": "把这个按钮改成主按钮，背景更亮，文字改成立即创建"
    },
    "sourceHint": {
      "file": "src/App.tsx",
      "line": 12,
      "column": 3,
      "component": "HeroButton",
      "sourceId": "src/App.tsx:12:3"
    }
  }'
```

## 4. 浏览器最小闭环测试

1. 在 popup 中连接页面成功后，刷新当前页面。
2. 页面右下角会出现 `Pi UI Bridge` 产品化面板。
3. 点击页面中的任意元素。
4. 面板会显示：
   - 当前选中元素摘要
   - `sourceHint`（如果页面节点存在 `data-pi-source-*`）
   - DOM 树可视化（祖先 / 当前节点 / 子节点）
5. 面板支持：
   - `Send to Pi`
   - `Locate Source`
   - `Copy JSON`
   - `Refresh`
   - 折叠 / 展开
6. 在面板中输入修改需求。
7. 点击 `Send to Pi`。
8. 当前 pi 会话应收到一条结构化浏览器请求。

## 5. 选择同步验证

每次点击页面元素时，content script 会自动向 bridge 发送 `/selection`。

此时可在 pi 中执行：

```text
/ui-status
```

后续也可通过工具读取最近请求上下文。

## 6. source binder 联调

启动示例项目：

```bash
cd repos/pi-ui-bridge
pnpm dev:react-demo
```

打开页面后，在浏览器开发者工具中检查页面节点，确认是否存在：

- `data-pi-source-id`
- `data-pi-source-file`
- `data-pi-source-line`
- `data-pi-source-column`
- `data-pi-component`

如果存在，再使用页面右下角 `Pi UI Bridge` 面板点击节点，面板里应显示 `sourceHint`。

## 7. 查看状态

```text
/ui-status
/ui-last
```
