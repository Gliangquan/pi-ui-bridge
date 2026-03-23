# Pi UI Bridge

[English README](./README.md)

Pi UI Bridge 是一个面向 `pi-coding-agent` 的本地 UI-to-code bridge。

它可以让你：

- 在浏览器里直接选中真实页面元素
- 输入你希望的 UI 修改需求
- 把结构化页面上下文发送到当前 Pi 会话
- 基于源码元信息把页面节点绑定回代码位置

## 它解决什么问题

Pi UI Bridge 主要用于本地开发环境下的 UI 改动工作流。

传统方式通常是：

1. 在浏览器里看到一个问题
2. 手动描述问题
3. 复制 prompt 给 AI
4. AI 再去猜测你到底想改哪一层

Pi UI Bridge 的目标是缩短这条链路：

1. 在浏览器里选中元素
2. 直接输入修改需求
3. 把选中元素、页面结构、源码提示一起发给 Pi
4. 让 Pi 更准确地定位并修改代码

## 当前能力

- 本地 Pi 扩展与 bridge server
- 浏览器扩展 popup 连接当前页面
- 页面 overlay 面板，支持：
  - 选择模式
  - 页面元素高亮
  - 元素下方 inline 输入框
  - 可拖动主面板
  - 可拖动 DOM 弹窗
  - DOM 结构浏览
  - 中英文切换
- React + Vite source binder
- React 示例 demo 项目

## 仓库结构

```text
docs/                    架构、ADR、指南、Issue、PR 记录
extensions/              Pi extension 入口
skills/                  Pi skill
packages/                可复用模块
examples/                可运行示例
```

## 当前命令

加载本地 Pi 扩展后，可用命令：

- `/pi-ui:start`
- `/pi-ui:stop`
- `/pi-ui:status`
- `/pi-ui:last`

## 当前 HTTP 接口

- `GET /health`
- `POST /attach`
- `POST /selection`
- `POST /apply`
- `GET /state`

## 文档索引

- [English README](./README.md)
- [本地联调说明](./docs/guides/20260320-local-testing.md)
- [架构设计](./docs/architecture/20260320-pi-ui-bridge-v0.1.md)
- [项目结构说明](./docs/guides/20260320-project-structure.md)

## 快速开始

### 方式 A：安装到 Pi，全局直接用 `pi`

```bash
cd pi-ui-bridge
pnpm install:pi
```

这个命令会把项目同步到 `~/.pi/agent/pi-ui-bridge`，并更新 `~/.pi/agent/settings.json` 去加载这份安装副本。

之后直接启动：

```bash
pi
```

进入 Pi 后执行：

```text
/pi-ui:start
```

### 方式 B：临时开发模式

```bash
cd pi-ui-bridge
pi -e ./extensions/pi-ui-bridge/index.ts
```

### 在 Pi 中启动 bridge

进入 Pi 后执行：

```text
/pi-ui:start
```

它会输出：

- `bridgeUrl`
- `token`
- 下一步连接说明

### 3. 构建并加载浏览器扩展

```bash
pnpm build:browser-extension
```

在 Chrome 中加载目录：

```text
packages/browser-extension/dist
```

### 4. 在 popup 中连接当前页面

打开扩展 popup 后：

- 粘贴 `bridgeUrl`
- 粘贴 `token`
- 点击连接页面

### 5. 启动 React 示例项目（可选）

```bash
pnpm dev:react-demo
```

### 6. 在页面中选中元素并发送请求

在页面中：

- 打开选择模式
- 点击一个元素
- 使用元素附近出现的 inline 输入框
- 输入修改需求
- 点击发送

当前 Pi 会话应该收到一条结构化浏览器请求。

## 源码绑定

React source binder 会在开发模式下给页面节点注入以下属性：

- `data-pi-source-id`
- `data-pi-source-file`
- `data-pi-source-line`
- `data-pi-source-column`
- `data-pi-component`

当这些属性存在时，浏览器 overlay 会把 `sourceHint` 一起带入：

- `/selection`
- `/apply`

## 浏览器侧操作说明

### Popup 的作用

popup 主要负责：

- 配置 `bridgeUrl`
- 配置 `token`
- 连接当前页面
- 显示当前 `browserSessionId`
- 显示当前页面连接状态

### 主面板的作用

主面板主要用于：

- 开关选择模式
- 中英文切换
- 查看当前选中摘要
- 查看源码绑定摘要
- 打开 DOM 弹窗
- 复制 JSON / 复制源码引用

### 元素下方 inline 输入框

当你选中页面元素后，元素下方会直接出现一个操作框。

它适合做就地操作：

- 直接输入修改需求
- 直接发送给 Pi
- 直接打开 DOM 弹窗

这样就不需要每次都回到主面板中输入。

### DOM 弹窗的作用

DOM 结构浏览不放在主面板里，而是单独做成可拖动弹窗，避免主视图太长。

弹窗中包含：

- 祖先路径 chips
- 当前节点卡片
- 子节点预览
- 简化树形块
- 点击节点切换选中目标

## 详细操作指南

### 启动 Pi UI Bridge

1. 打开终端并进入项目根目录
2. 用本地扩展方式启动 Pi
3. 执行 `/pi-ui:start`
4. 记录输出的 `bridgeUrl` 和 `token`

### 连接浏览器页面

1. 在 Chrome 中加载扩展
2. 打开扩展 popup
3. 粘贴 `bridgeUrl`
4. 粘贴 `token`
5. 点击连接页面
6. 刷新目标页面

### 安全选择页面元素

当选择模式开启时：

- 页面点击事件会被拦截
- 业务按钮和链接不会真正执行
- hover 高亮会显示更合理的目标
- 点击选中会优先提升到更适合修改的父级容器

### 发送请求给 Pi

1. 点击页面目标元素
2. 查看当前选中信息
3. 在元素下方的 inline 输入框中输入修改需求
4. 点击发送
5. 当前 Pi 会话收到结构化请求

### 浏览 DOM 结构

1. 点击 `DOM`
2. 用祖先路径 chips 快速切换父级容器
3. 用子节点预览切换到子节点
4. 在需要时查看简化树形块

### 查看源码提示

如果当前节点带有源码元信息，界面会显示：

- 源码文件
- 行号
- 组件名
- source id

你可以进一步：

- 复制源码引用
- 复制 JSON
- 定位源码

## 当前限制

- 主要面向本地开发环境
- 优先支持 React + Vite
- source binder 当前只面向开发模式
- DOM 浏览视图更偏向紧凑工作流，而不是完整 DevTools 替代品

## 当前状态

这个仓库已经具备一个可运行的 v0.1 基础版本，但后续仍然可以继续增强：

- 更强的 source binding
- 更稳定的 agent 工作流
- 更多框架支持
- 更完整的浏览器产品体验
