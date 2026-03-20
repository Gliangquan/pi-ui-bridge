# 项目初始化结构说明

## 顶层目录

- `docs/`：架构、ADR、Issue、PR、指南
- `extensions/`：Pi extension 入口
- `skills/`：Pi skill
- `packages/`：可复用代码模块
- `examples/`：示例项目

## 当前目录规划

```text
extensions/pi-ui-bridge/
skills/pi-ui-refactor/
packages/bridge-core/
packages/browser-extension/
packages/intent-engine/
packages/ui-runtime/
packages/source-binder-react/
examples/react-vite-demo/
```

## 设计原则

1. Pi extension 为主入口
2. Skill 只负责工作流规范
3. Browser extension 与 bridge 协议解耦
4. Source binder 独立成包，不塞进 overlay
