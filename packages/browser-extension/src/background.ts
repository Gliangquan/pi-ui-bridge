import type { ApplyRequest, ApplyResponse, AttachRequest, AttachResponse, SelectionSyncRequest } from "@pi-ui-bridge/bridge-core";
import { MESSAGE_TYPES } from "./messages";
import type {
  BridgeConfig,
  BridgeRuntime,
  ContentSelection,
  ContentSourceHint,
  RuntimeRequest,
  RuntimeResponse
} from "./messages";

const CONFIG_KEY = "piui.bridge.config";
const SESSION_KEY = "piui.bridge.browser-session-id";
const PAGE_URL_KEY = "piui.bridge.attached-page-url";
const TAB_ID_KEY = "piui.bridge.attached-tab-id";

async function getBridgeConfig(): Promise<BridgeConfig> {
  const result = await chrome.storage.local.get(CONFIG_KEY);
  return (result[CONFIG_KEY] as BridgeConfig | undefined) ?? { bridgeUrl: "", token: "" };
}

async function saveBridgeConfig(config: BridgeConfig): Promise<void> {
  await chrome.storage.local.set({
    [CONFIG_KEY]: config
  });
}

async function getBrowserSessionId(): Promise<string> {
  const result = await chrome.storage.local.get(SESSION_KEY);
  return (result[SESSION_KEY] as string | undefined) ?? "";
}

async function saveBrowserSessionId(browserSessionId: string): Promise<void> {
  await chrome.storage.local.set({
    [SESSION_KEY]: browserSessionId
  });
}

async function getAttachedPageUrl(): Promise<string> {
  const result = await chrome.storage.local.get(PAGE_URL_KEY);
  return (result[PAGE_URL_KEY] as string | undefined) ?? "";
}

async function saveAttachedPageUrl(pageUrl: string): Promise<void> {
  await chrome.storage.local.set({
    [PAGE_URL_KEY]: pageUrl
  });
}

async function getAttachedTabId(): Promise<number | null> {
  const result = await chrome.storage.local.get(TAB_ID_KEY);
  const value = result[TAB_ID_KEY] as number | undefined;
  return typeof value === "number" ? value : null;
}

async function saveAttachedTabId(tabId: number): Promise<void> {
  await chrome.storage.local.set({
    [TAB_ID_KEY]: tabId
  });
}

async function getBridgeRuntime(): Promise<BridgeRuntime> {
  return {
    config: await getBridgeConfig(),
    browserSessionId: await getBrowserSessionId()
  };
}

async function clearBridgeSession(): Promise<void> {
  await chrome.storage.local.remove([SESSION_KEY, PAGE_URL_KEY, TAB_ID_KEY]);
}

async function disconnectBridge(): Promise<RuntimeResponse> {
  const runtime = await getBridgeRuntime();

  if (runtime.config.bridgeUrl && runtime.config.token && runtime.browserSessionId) {
    try {
      await fetch(`${runtime.config.bridgeUrl.replace(/\/$/, "")}/api/browser-session/${encodeURIComponent(runtime.browserSessionId)}`, {
        method: "DELETE",
        headers: {
          "x-pi-ui-token": runtime.config.token
        }
      });
    } catch {
      // Ignore bridge cleanup failures and still clear local session state.
    }
  }

  await clearBridgeSession();
  return {
    ok: true,
    browserSessionId: undefined,
    connected: false,
    attachedPageUrl: undefined,
    attachedTabId: undefined,
    runtime: {
      config: runtime.config,
      browserSessionId: ""
    }
  };
}

async function ensureContentScript(tabId: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
}

async function attachBridge(tabId: number, pageUrl: string, pageTitle?: string): Promise<RuntimeResponse> {
  const config = await getBridgeConfig();
  if (!config.bridgeUrl || !config.token) {
    return {
      ok: false,
      error: "Missing bridgeUrl or token"
    };
  }

  const response = await fetch(`${config.bridgeUrl.replace(/\/$/, "")}/attach`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-pi-ui-token": config.token
    },
    body: JSON.stringify({
      pageUrl,
      pageTitle,
      framework: "react"
    } satisfies AttachRequest)
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `Attach failed with status ${response.status}`
    };
  }

  const data = (await response.json()) as AttachResponse;
  await saveBrowserSessionId(data.browserSessionId);
  await saveAttachedPageUrl(pageUrl);
  await saveAttachedTabId(tabId);
  await ensureContentScript(tabId);

  return {
    ok: data.ok,
    browserSessionId: data.browserSessionId,
    runtime: {
      config,
      browserSessionId: data.browserSessionId
    },
    connected: true,
    attachedPageUrl: pageUrl,
    attachedTabId: tabId
  };
}

async function selectionSync(pageUrl: string, selection: ContentSelection, sourceHint?: ContentSourceHint): Promise<RuntimeResponse> {
  const runtime = await getBridgeRuntime();
  if (!runtime.config.bridgeUrl || !runtime.config.token || !runtime.browserSessionId) {
    return {
      ok: false,
      error: "Bridge not attached. Reconnect current page first."
    };
  }

  const response = await fetch(`${runtime.config.bridgeUrl.replace(/\/$/, "")}/selection`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-pi-ui-token": runtime.config.token
    },
    body: JSON.stringify({
      browserSessionId: runtime.browserSessionId,
      pageUrl,
      selection,
      sourceHint
    } satisfies SelectionSyncRequest)
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `Selection sync failed with status ${response.status}`
    };
  }

  return {
    ok: true,
    runtime,
    connected: true,
    attachedPageUrl: pageUrl
  };
}

async function applyToBridge(
  pageUrl: string,
  selection: ContentSelection,
  prompt: string,
  sourceHint?: ContentSourceHint
): Promise<RuntimeResponse> {
  const runtime = await getBridgeRuntime();
  if (!runtime.config.bridgeUrl || !runtime.config.token || !runtime.browserSessionId) {
    return {
      ok: false,
      error: "Bridge not attached. Reconnect current page first."
    };
  }

  const response = await fetch(`${runtime.config.bridgeUrl.replace(/\/$/, "")}/apply`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-pi-ui-token": runtime.config.token
    },
    body: JSON.stringify({
      browserSessionId: runtime.browserSessionId,
      pageUrl,
      selection,
      intent: {
        type: "describe",
        prompt
      },
      sourceHint
    } satisfies ApplyRequest)
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `Apply failed with status ${response.status}`
    };
  }

  const data = (await response.json()) as ApplyResponse;
  return {
    ok: data.ok,
    requestId: data.requestId,
    runtime,
    connected: true,
    attachedPageUrl: pageUrl
  };
}

async function getCurrentSelectionFromTab(tabId: number): Promise<{ pageUrl: string; selection: ContentSelection; sourceHint?: ContentSourceHint } | null> {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const runtime = window as typeof window & {
        __PI_UI_BRIDGE_LAST_SELECTION__?: { pageUrl: string; selection: ContentSelection; sourceHint?: ContentSourceHint };
      };
      return runtime.__PI_UI_BRIDGE_LAST_SELECTION__ || null;
    }
  });
  return (result?.result as { pageUrl: string; selection: ContentSelection; sourceHint?: ContentSourceHint } | null) ?? null;
}

async function getSenderTabId(sender?: chrome.runtime.MessageSender): Promise<number | undefined> {
  return sender?.tab?.id;
}

async function handleMessage(message: RuntimeRequest, sender?: chrome.runtime.MessageSender): Promise<RuntimeResponse> {
  const senderTabId = await getSenderTabId(sender);
  const attachedTabId = await getAttachedTabId();
  const attachedPageUrl = await getAttachedPageUrl();

  switch (message.type) {
    case MESSAGE_TYPES.popupGetBridgeConfig: {
      const config = await getBridgeConfig();
      const browserSessionId = await getBrowserSessionId();
      const attachedPageUrl = await getAttachedPageUrl();
      const attachedTabId = await getAttachedTabId();
      return {
        ok: true,
        config,
        browserSessionId: browserSessionId || undefined,
        connected: Boolean(config.bridgeUrl && config.token && browserSessionId),
        attachedPageUrl: attachedPageUrl || undefined,
        attachedTabId: attachedTabId ?? undefined
      };
    }
    case MESSAGE_TYPES.popupSaveBridgeConfig:
      await saveBridgeConfig(message.config);
      return {
        ok: true,
        config: message.config
      };
    case MESSAGE_TYPES.popupAttachBridge:
      return attachBridge(message.tabId, message.pageUrl, message.pageTitle);
    case MESSAGE_TYPES.popupApplyCurrentSelection: {
      const current = await getCurrentSelectionFromTab(message.tabId);
      if (!current?.selection) {
        return {
          ok: false,
          error: "No current selection found on this page. Select an element first."
        };
      }
      return applyToBridge(current.pageUrl, current.selection, message.prompt, current.sourceHint);
    }
    case MESSAGE_TYPES.contentGetBridgeRuntime:
      return {
        ok: true,
        runtime: await getBridgeRuntime(),
        browserSessionId: await getBrowserSessionId(),
        attachedPageUrl: attachedPageUrl || undefined,
        attachedTabId: attachedTabId ?? undefined,
        requestTabId: senderTabId,
        isCurrentTabAttached: attachedTabId != null && senderTabId != null ? attachedTabId === senderTabId : undefined
      };
    case MESSAGE_TYPES.contentSelectionSync:
      return selectionSync(message.pageUrl, message.selection, message.sourceHint);
    case MESSAGE_TYPES.contentApply:
      return applyToBridge(message.pageUrl, message.selection, message.prompt, message.sourceHint);
    case MESSAGE_TYPES.contentDisconnectBridge:
      return disconnectBridge();
    default:
      return {
        ok: false,
        error: "Unknown message type"
      };
  }
}

chrome.runtime.onMessage.addListener((message: RuntimeRequest, sender, sendResponse) => {
  void handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown background error"
      });
    });

  return true;
});
