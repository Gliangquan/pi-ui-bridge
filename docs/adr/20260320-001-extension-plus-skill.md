# ADR-001: 采用 Extension + Skill 组合架构

- 日期：2026-03-20
- 状态：Accepted

## 背景

目标不是单纯复制页面 prompt，而是让浏览器页面上下文直接驱动本地 pi coding agent 修改源码。

## 决策

采用以下组合：

- Pi Extension：桥接、本地服务、命令、工具、会话注入
- Skill：agent 工作流约束与操作规范
- Browser Extension：页面交互与上下文采集
- Source Binder：页面与源码绑定

## 原因

Skill 单独不具备本地桥接、状态管理、命令扩展、消息注入能力。

Pi Extension 可以：

- 注册命令与工具
- 启动 bridge server
- 维护状态
- 向当前 session 注入结构化请求

## 结果

v0.1 以 Pi Package 形式推进，扩展为主，技能为辅。
