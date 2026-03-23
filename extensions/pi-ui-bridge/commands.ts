import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { createBridgeServer, type BridgeServerHandle } from "./bridge-server";
import { createBridgeRuntimeState, toBridgeStateSnapshot, type BridgeRuntimeState } from "./bridge-state";
import { injectLastApplyRequest } from "./message-injector";

function formatStatus(state: BridgeRuntimeState): string {
  const snapshot = toBridgeStateSnapshot(state);
  const lines = [
    `running: ${state.serverRunning}`,
    `port: ${state.port ?? "(none)"}`,
    `connected: ${snapshot.connected}`,
    `lastPageUrl: ${snapshot.lastPageUrl ?? "(none)"}`,
    `lastRequestId: ${snapshot.lastRequestId ?? "(none)"}`,
    `token: ${state.token ?? "(none)"}`,
    `lastTag: ${snapshot.lastSelection?.tag ?? "(none)"}`,
    `lastSelector: ${snapshot.lastSelection?.selector ?? "(none)"}`,
    `lastText: ${snapshot.lastSelection?.text ?? "(none)"}`,
    `lastSourceId: ${snapshot.lastSelection?.sourceId ?? "(none)"}`,
    `lastFile: ${snapshot.lastSelection?.file ?? "(none)"}`,
    `lastLine: ${snapshot.lastSelection?.line ?? "(none)"}`,
    `lastComponent: ${snapshot.lastSelection?.component ?? "(none)"}`
  ];

  return lines.join("\n");
}

export function registerBridgeCommands(pi: ExtensionAPI): { state: BridgeRuntimeState } {
  const state = createBridgeRuntimeState();
  let handle: BridgeServerHandle | null = null;

  async function ensureStarted(ctx: ExtensionCommandContext) {
    if (handle) {
      return handle;
    }

    handle = await createBridgeServer(pi, state, ctx.cwd);
    state.serverRunning = true;
    state.port = handle.port;
    state.token = handle.token;
    const theme = ctx.ui.theme;
    ctx.ui.setStatus("pi-ui-bridge", theme.fg("success", `UI Bridge :${handle.port}`));
    return handle;
  }

  async function stopBridge(ctx: ExtensionCommandContext) {
    if (!handle) {
      return false;
    }

    await handle.stop();
    handle = null;
    state.serverRunning = false;
    state.port = null;
    state.token = null;
    state.browserSessions.clear();
    ctx.ui.setStatus("pi-ui-bridge", "");
    return true;
  }

  pi.registerCommand("pi-ui:start", {
    description: "Start Pi UI Bridge localhost server",
    handler: async (_args, ctx) => {
      const current = await ensureStarted(ctx);
      const instructions = [
        `Pi UI Bridge started`,
        `bridgeUrl: http://127.0.0.1:${current.port}`,
        `token: ${current.token}`,
        `cwd: ${ctx.cwd}`,
        `next: open the browser extension popup, paste bridgeUrl and token, then click 连接页面`
      ].join("\n");
      ctx.ui.notify(instructions, "info");
    }
  });

  pi.registerCommand("pi-ui:stop", {
    description: "Stop Pi UI Bridge localhost server",
    handler: async (_args, ctx) => {
      const stopped = await stopBridge(ctx);
      if (!stopped) {
        ctx.ui.notify("Pi UI Bridge is not running", "warning");
        return;
      }

      ctx.ui.notify("Pi UI Bridge stopped", "info");
    }
  });

  pi.registerCommand("pi-ui:status", {
    description: "Show Pi UI Bridge status",
    handler: async (_args, ctx) => {
      ctx.ui.notify(formatStatus(state), "info");
    }
  });

  pi.registerCommand("pi-ui:last", {
    description: "Re-inject the last browser apply request into the current pi session",
    handler: async (_args, ctx) => {
      const injected = injectLastApplyRequest(pi, state.lastApply, ctx.isIdle());
      if (!injected) {
        ctx.ui.notify("No previous browser apply request found", "warning");
        return;
      }

      ctx.ui.notify("Re-sent last browser apply request to pi", "info");
    }
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    await stopBridge(ctx as ExtensionCommandContext);
  });

  return { state };
}
