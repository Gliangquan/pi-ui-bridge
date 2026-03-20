# browser-extension

浏览器扩展模块。

当前已完成最小联调骨架：

- popup 支持配置 `bridgeUrl` 与 `token`
- popup 支持连接当前页面到本地 Pi Bridge
- background 支持保存配置、调用 `/attach`、转发 `/apply`
- content script 已注入最小浮层，可选中元素并发送 `Send to Pi`

后续继续实现：

- Locate Source
- 更完整 overlay 选中体验
- React source metadata awareness
- sourceHint 自动注入
