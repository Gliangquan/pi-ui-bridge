import { buildPiBridgePrompt } from "../../packages/bridge-core/src";
import type { ApplyRequest } from "../../packages/bridge-core/src";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export function injectApplyRequest(pi: ExtensionAPI, payload: ApplyRequest, isIdle: boolean): void {
  const message = buildPiBridgePrompt(payload);

  if (isIdle) {
    pi.sendUserMessage(message);
    return;
  }

  pi.sendUserMessage(message, { deliverAs: "followUp" });
}

export function injectLastApplyRequest(pi: ExtensionAPI, payload: ApplyRequest | null, isIdle: boolean): boolean {
  if (!payload) {
    return false;
  }

  injectApplyRequest(pi, payload, isIdle);
  return true;
}
