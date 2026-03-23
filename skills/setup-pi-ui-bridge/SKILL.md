---
name: setup-pi-ui-bridge
description: Guides Pi to set up, build, and connect the Pi UI Bridge project for UI-to-code workflow.
---

# Setup Pi UI Bridge Project

This skill helps you set up the `pi-ui-bridge` project, build its browser extension, and establish connection between the browser and the Pi coding agent.

## Prerequisites

- **Node.js** (v18.0.0 or higher)
- **pnpm** (recommended package manager for this monorepo)
- **Google Chrome** or a Chromium-based browser (for the browser extension)
- **`pi-coding-agent`** installed globally (`npm install -g @mariozechner/pi-coding-agent`)

## Steps

### 1. Navigate to the project directory

First, ensure you are in the `pi-ui-bridge` project root directory.

```bash
cd pi-ui-bridge
```

### 2. Install project dependencies

Install all pnpm workspace dependencies. This might take a few minutes.

```bash
pnpm install
```

### 3. Install into Pi

Sync the project into `~/.pi/agent/pi-ui-bridge` and register the installed copy in Pi settings.

```bash
pnpm install:pi
```

### 4. Build the browser extension

Build the browser extension to create the `dist` folder.

```bash
pnpm build:browser-extension
```

### 5. Instruct the user to load the browser extension in Chrome

The browser extension needs to be manually loaded into your Chrome browser. Please tell the user to do the following:

- Open Chrome.
- Go to `chrome://extensions`.
- Enable "Developer mode" (usually a toggle in the top right).
- Click "Load unpacked" (加载已解压的扩展程序).
- Select the `packages/browser-extension/dist` directory inside the project.

After this, the extension named "Pi UI Bridge" should appear in their extensions list and browser toolbar.

### 6. Start the Pi UI Bridge server in Pi

Now, start the Pi UI Bridge server. This will launch a local HTTP server and generate a unique token for secure communication.

```text
/pi-ui:start
```

**Important:** Note down the `bridgeUrl` (e.g., `http://127.0.0.1:xxxxx`) and the `token` displayed in Pi's output. You will need these in the next step.

### 7. Instruct the user to connect the browser extension to the Pi Bridge

The user needs to tell the browser extension how to find the running Pi Bridge server. Please tell the user to do the following:

- Click the "Pi UI Bridge" icon in their Chrome toolbar.
- In the extension popup, paste the `bridgeUrl` and `token` obtained from Pi's `/pi-ui:start` output.
- Click "保存配置" (Save Config).
- Click "连接页面" (Connect Page).
- Refresh the web page they want to debug/modify.

The browser extension is now connected! A panel should appear on the bottom-right of the web page.

### 8. (Optional) Start the React demo project

If the user wants to test with the provided example, tell them to run this in a **separate terminal**:

```bash
cd pi-ui-bridge
pnpm dev:react-demo
```

### 9. Verify the setup

- **In Pi:** You can run `/pi-ui:status` to check the bridge's state and recent activity.
- **In Chrome:** The panel on the web page should now show "已连接" (Connected). Click on any element on the page, and the panel should update with selection details and source hints.

## Usage Guide

Once set up, the user can use the browser extension to:

- Select page elements.
- View detailed DOM and source binding information.
- Type in a change request directly in the inline composer.
- Send the request to Pi for code modification.

**Note:** Pi will receive a structured message in the current session based on the element selected and the user's request. You, as Pi, will then use this information to understand the user's intent and modify the source code accordingly.
