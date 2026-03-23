# Install Pi UI Bridge into Pi Agent

## Goal

让 Pi UI Bridge 不再依赖 `pi -e ./extensions/pi-ui-bridge/index.ts` 临时加载，而是能注册到 `~/.pi/agent` 体系中，直接通过 `pi` 启动后使用命令。

## Complexity

- Level: L3
- Scope: 扩展加载方式、安装脚本、命令命名、文档
- Risk: 中等，影响全局 Pi 资源发现与使用入口

## Phases

- [x] 阅读 Pi package / extension 文档，确认官方安装方式
- [x] 对照 `game:*` 扩展，确认 auto-discovery 与命令注册方式
- [x] 为项目增加注册到 `~/.pi/agent/settings.json` 的安装脚本
- [x] 增加命令别名，支持 `/pi-ui:start` 风格
- [x] 更新 README 与本地联调文档
- [ ] 后续补充 `pi remove` / 卸载脚本
- [ ] 后续发布 npm/git package，支持 `pi install npm:...`

## Acceptance Criteria

- 在项目根执行安装脚本后，`~/.pi/agent/settings.json` 出现该项目路径
- 后续直接执行 `pi` 时可加载 Pi UI Bridge
- 在 Pi 中可使用 `/ui-start`
- 在 Pi 中可使用 `/pi-ui:start`
- README 与 guide 明确说明两种启动方式

## Notes

- 官方推荐方式是把项目作为 Pi package source 写入 `settings.json` 的 `packages`
- `game:*` 命令本质上只是 auto-discovered extension 里的 `registerCommand(...)`
- 不需要把源码物理复制到 `~/.pi/agent/extensions/`，直接注册 package source 更稳
