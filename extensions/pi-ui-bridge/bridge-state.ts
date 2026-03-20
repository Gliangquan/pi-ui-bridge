import type { ApplyRequest, BridgeStateSnapshot, SelectionSyncRequest } from "../../packages/bridge-core/src";

export type BrowserSession = {
  id: string;
  pageUrl: string;
  pageTitle?: string;
  framework?: string;
  connectedAt: number;
};

export type BridgeRuntimeState = {
  serverRunning: boolean;
  port: number | null;
  token: string | null;
  browserSessions: Map<string, BrowserSession>;
  lastSelection: SelectionSyncRequest | null;
  lastApply: ApplyRequest | null;
  lastRequestId: string | null;
};

export function createBridgeRuntimeState(): BridgeRuntimeState {
  return {
    serverRunning: false,
    port: null,
    token: null,
    browserSessions: new Map(),
    lastSelection: null,
    lastApply: null,
    lastRequestId: null
  };
}

export function toBridgeStateSnapshot(state: BridgeRuntimeState): BridgeStateSnapshot {
  const latestSelection = state.lastApply
    ? {
        selection: state.lastApply.selection,
        sourceHint: state.lastApply.sourceHint,
        pageUrl: state.lastApply.pageUrl
      }
    : state.lastSelection
      ? {
          selection: state.lastSelection.selection,
          sourceHint: state.lastSelection.sourceHint,
          pageUrl: state.lastSelection.pageUrl
        }
      : null;

  return {
    ok: true,
    connected: state.browserSessions.size > 0,
    lastPageUrl: latestSelection?.pageUrl,
    lastRequestId: state.lastRequestId ?? undefined,
    lastSelection: latestSelection
      ? {
          tag: latestSelection.selection.tag,
          selector: latestSelection.selection.selector,
          text: latestSelection.selection.text,
          sourceId: latestSelection.sourceHint?.sourceId,
          file: latestSelection.sourceHint?.file,
          line: latestSelection.sourceHint?.line,
          component: latestSelection.sourceHint?.component
        }
      : undefined
  };
}
