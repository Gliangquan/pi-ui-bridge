# Pi UI Bridge

[中文说明](./README.zh-CN.md)

Pi UI Bridge is a local UI-to-code bridge for `pi-coding-agent`.

It lets you:

- select real elements directly in the browser
- describe the change you want
- send structured UI context to the current Pi session
- use source metadata to connect page nodes back to code

## What it is for

Pi UI Bridge is designed for local development workflows where you want browser-side UI selection and source-code editing to work together.

Instead of copying prompts manually, you can select an element on the page and send the request to Pi with structured metadata.

## Current capabilities

- local Pi extension with bridge server
- browser extension popup for connection setup
- browser overlay with:
  - selection mode
  - element highlighting
  - inline composer near the selected element
  - draggable control panel
  - draggable DOM modal
  - simplified DOM explorer
  - Chinese / English UI switching
- React + Vite source binder package
- example React demo project

## Repository structure

```text
docs/                    architecture, ADRs, guides, issues, PR notes
extensions/              Pi extension entry
skills/                  Pi skill
packages/                reusable packages
examples/                runnable examples
```

## Main commands

After loading the local extension in Pi, these commands are available:

- `/ui-start`
- `/ui-stop`
- `/ui-status`
- `/ui-last`

## HTTP endpoints

- `GET /health`
- `POST /attach`
- `POST /selection`
- `POST /apply`
- `GET /state`

## Documentation

- [Chinese guide](./README.zh-CN.md)
- [Local testing guide](./docs/guides/20260320-local-testing.md)
- [Architecture](./docs/architecture/20260320-pi-ui-bridge-v0.1.md)
- [Project structure guide](./docs/guides/20260320-project-structure.md)

## Quick start

### 1. Start Pi with the local extension

```bash
cd /Users/liangquan/Desktop/server/githubagentwork/repos/pi-ui-bridge
pi -e ./extensions/pi-ui-bridge/index.ts
```

### 2. Start the bridge

Inside Pi:

```text
/ui-start
```

This prints:

- `bridgeUrl`
- `token`
- next-step instructions

### 3. Build and load the browser extension

```bash
pnpm build:browser-extension
```

Load this directory in Chrome:

```text
packages/browser-extension/dist
```

### 4. Connect the current page from the popup

In the extension popup:

- paste `bridgeUrl`
- paste `token`
- click connect page

### 5. Start the example React demo (optional)

```bash
pnpm dev:react-demo
```

### 6. Select an element and send a request

On the page:

- enable selection mode
- click an element
- use the inline composer below the element
- enter your request
- click send

Pi should receive a structured browser request in the current session.

## Source binding

The React source binder injects these attributes in development mode:

- `data-pi-source-id`
- `data-pi-source-file`
- `data-pi-source-line`
- `data-pi-source-column`
- `data-pi-component`

When those attributes exist, the browser overlay includes `sourceHint` in selection and apply requests.

## Browser workflow overview

### Popup

Use the popup to:

- configure `bridgeUrl`
- configure `token`
- connect the current page
- see the current browser session id and page binding state

### Main overlay panel

Use the main panel to:

- switch selection mode on or off
- switch language between Chinese and English
- inspect current selection summary
- inspect source binding summary
- open the DOM modal
- copy JSON or source references

### Inline composer

After selecting an element, an inline composer appears near the element.

Use it to:

- type a change request in place
- send the request directly to Pi
- open the DOM modal without returning to the main panel

### DOM modal

The DOM view is opened in a separate draggable modal so the main panel stays compact.

It includes:

- ancestor path chips
- current node card
- child preview
- simplified tree block
- click-to-select navigation

## Detailed operation guide

### Start Pi UI Bridge

1. open a terminal in the project root
2. start Pi with the extension
3. run `/ui-start`
4. copy the `bridgeUrl` and `token`

### Connect the browser page

1. load the built browser extension in Chrome
2. open the extension popup
3. paste `bridgeUrl`
4. paste `token`
5. click connect page
6. refresh the target page

### Select elements safely

When selection mode is enabled:

- page click events are blocked
- business buttons and links do not execute
- hover highlights show the promoted target
- click selection uses promoted selection logic for more useful containers

### Send requests to Pi

1. click a target element
2. review the selected element summary
3. type the requested change in the inline composer
4. click send
5. Pi receives the request in the current session

### Inspect DOM structure

1. click `DOM`
2. use ancestor path chips to jump to parent containers
3. use child preview to jump to child nodes
4. use the simplified tree block when you need more structure

### Inspect source hints

If the selected node has source metadata, the UI shows:

- source file
- line
- component
- source id

You can then:

- copy source
- copy JSON
- locate source

## Current limitations

- focused on local development only
- React + Vite first
- source binder currently targets development mode
- selection and DOM exploration are optimized for compact browser workflows, not full DevTools replacement

## Status

This repository already includes a working v0.1 foundation, but there is still room for iteration in:

- smarter source binding
- richer agent-side workflows
- stronger framework support
- production-grade browser UX polish
