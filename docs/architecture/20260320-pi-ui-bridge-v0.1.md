# Pi UI Bridge v0.1 技术方案

## 目标

实现本地开发场景下的 UI-to-code bridge：

1. 浏览器选中页面元素
2. 输入修改需求
3. 发送到当前 pi 会话
4. 基于源码绑定信息读取并修改代码

## 核心模块

### 1. browser-extension
负责页面 overlay、选中元素、收集 intent、发送 bridge 请求。

### 2. pi-extension
负责启动 localhost bridge server、接收浏览器请求、注入当前 pi session。

### 3. bridge-core
负责协议、类型定义、会话状态与 payload 结构。

### 4. source-binder-react
负责 React + Vite 开发态源码元信息注入。

### 5. pi-ui-refactor skill
负责规范 agent 收到浏览器请求后的工作流。

## v0.1 约束

- 仅支持本地开发环境
- 仅优先支持 React + Vite
- 单 bridge 对应单 pi session
- `Send to Pi` 才触发 agent

## 主链路

```text
Browser Extension -> localhost bridge -> pi extension -> pi.sendUserMessage -> agent tools -> source files
```

## 下一步实现优先级

1. bridge server 最小实现
2. browser extension 请求发送
3. React source binder
4. skill 工作流
