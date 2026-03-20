import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerBridgeCommands } from "./commands";
import { registerBridgeTools } from "./tools";

export default function (pi: ExtensionAPI) {
  const { state } = registerBridgeCommands(pi);
  registerBridgeTools(pi, state);
}
