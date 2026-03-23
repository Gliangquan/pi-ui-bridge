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
- [x] 为项目增加安装脚本，自动同步到 `~/.pi/agent/pi-ui-bridge`
- [x] 改为仅保留 `/pi-ui:*` 命令风格
- [x] 更新 README 与本地联调文档
- [x] 补充 `uninstall:pi` 卸载脚本
- [ ] 后续发布 npm/git package，支持 `pi install npm:...`

## Acceptance Criteria

- 在项目根执行安装脚本后，`~/.pi/agent/pi-ui-bridge` 存在安装副本
- `~/.pi/agent/settings.json` 仅保留安装副本路径，不保留开发路径
- 后续直接执行 `pi` 时可加载 Pi UI Bridge
- 在 Pi 中仅使用 `/pi-ui:start`
- README 与 guide 明确说明两种启动方式

## Notes

- 当前安装方案为同步安装副本到 `~/.pi/agent/pi-ui-bridge`，再在 `settings.json` 中引用该副本
- `game:*` 命令本质上只是 auto-discovered extension 里的 `registerCommand(...)`
- 为避免开发目录与安装目录双加载，安装脚本会自动去重并优先保留安装副本
