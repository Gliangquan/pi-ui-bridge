# Pi UI Bridge

Pi UI Bridge 是一个面向 `pi-coding-agent` 的本地 UI-to-code bridge。

目标：

- 在浏览器中选中页面元素
- 输入修改需求
- 通过本地 bridge 发送给当前 pi 会话
- 利用源码绑定信息直接定位并修改项目代码

## v0.1 范围

- 本地开发环境
- React + Vite 优先
- Pi Extension + Skill + Browser Bridge
- 页面选中元素 -> 发送到 Pi -> 读取源码 -> 修改代码

## 仓库结构

```text
docs/                    设计、ADR、Issue、指南
extensions/              Pi extension 入口
skills/                  Pi skill
packages/                可复用模块
examples/                最小演示项目
```

## 当前状态

当前仓库已完成：

- 本地 git 初始化
- 文档骨架初始化
- Pi package 目录初始化
- 扩展 / 技能 / 包结构占位
- 最小可运行 bridge server 骨架
- 本地联调命令与工具骨架

## 当前可用命令

- `/ui-start`
- `/ui-stop`
- `/ui-status`
- `/ui-last`

## 当前可用接口

- `GET /health`
- `POST /attach`
- `POST /selection`
- `POST /apply`
- `GET /state`

## 当前浏览器能力

- popup 连接当前页面到 Pi Bridge
- 页面右下角最小浮层
- 选中元素后自动同步 `/selection`
- 输入需求后发送 `/apply`
- 支持读取 `data-pi-source-*` 形成 `sourceHint`

后续优先实现：

1. React source binder 真正注入 metadata
2. `pi-ui-refactor` 工作流技能增强
3. 示例项目联调
4. 更完整 overlay 交互
