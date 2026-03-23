---
name: manage-pi-ui-bridge
description: Install, update, or uninstall Pi UI Bridge in the user's Pi environment. Use when the user wants Pi UI Bridge to be registered into ~/.pi/agent, refreshed after repo changes, or removed cleanly.
---

# Manage Pi UI Bridge

Use this skill when the user asks to install, update, or uninstall Pi UI Bridge in Pi.

## Scope

This skill covers:

- install into `~/.pi/agent/pi-ui-bridge`
- update an existing install after repository changes
- uninstall from Pi cleanly
- remind the user to run `/reload` or restart Pi after changes

## Preconditions

- current directory should be the `pi-ui-bridge` repository root
- `pnpm` should be available
- for install/update, dependencies should be installed first if needed

## Commands

### Install

```bash
pnpm install
pnpm install:pi
```

Expected result:

- project synced to `~/.pi/agent/pi-ui-bridge`
- `~/.pi/agent/settings.json` updated to load the installed copy
- duplicate development-path registrations removed

After install, tell the user to run:

```text
/reload
```

or restart `pi`, then use:

```text
/pi-ui:start
```

### Update

Use the same commands after pulling new repository changes:

```bash
pnpm install
pnpm install:pi
```

This refreshes the installed copy in `~/.pi/agent/pi-ui-bridge`.

### Uninstall

```bash
pnpm uninstall:pi
```

Expected result:

- `~/.pi/agent/pi-ui-bridge` removed
- `~/.pi/agent/settings.json` cleaned up

After uninstall, tell the user to run:

```text
/reload
```

or restart `pi`.

## Response pattern

When using this skill, summarize clearly:

- action performed: install / update / uninstall
- whether commands succeeded
- whether Pi reload is needed
- next command the user should run

## Notes

- This skill is only for Pi-side installation lifecycle.
- Browser extension build/load is covered by `/skill:setup-pi-ui-bridge`.
- Runtime UI-to-code editing workflow is covered by `/skill:pi-ui-refactor`.
