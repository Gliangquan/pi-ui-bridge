import { Type } from "@sinclair/typebox";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { BridgeRuntimeState } from "./bridge-state";
import { toBridgeStateSnapshot } from "./bridge-state";

export function registerBridgeTools(pi: ExtensionAPI, state: BridgeRuntimeState) {
  pi.registerTool({
    name: "ui_bridge_state",
    label: "UI Bridge State",
    description: "Return the latest Pi UI Bridge connection state and browser context summary",
    parameters: Type.Object({}),
    async execute() {
      const snapshot = toBridgeStateSnapshot(state);
      return {
        content: [{ type: "text", text: JSON.stringify(snapshot, null, 2) }],
        details: snapshot
      };
    }
  });

  pi.registerTool({
    name: "ui_bridge_last_request",
    label: "UI Bridge Last Request",
    description: "Return the most recent browser apply payload received by Pi UI Bridge with readable summary",
    parameters: Type.Object({}),
    async execute() {
      const payload = state.lastApply;
      const summary = payload
        ? [
            `pageUrl: ${payload.pageUrl}`,
            `tag: ${payload.selection.tag}`,
            `selector: ${payload.selection.selector ?? "(none)"}`,
            `text: ${payload.selection.text ?? "(none)"}`,
            `prompt: ${payload.intent.prompt}`,
            `sourceId: ${payload.sourceHint?.sourceId ?? "(none)"}`,
            `file: ${payload.sourceHint?.file ?? "(none)"}`,
            `component: ${payload.sourceHint?.component ?? "(none)"}`
          ].join("\n")
        : "No browser apply payload received yet.";

      return {
        content: [{ type: "text", text: summary }],
        details: {
          lastApply: payload
        }
      };
    }
  });
}
