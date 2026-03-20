export const MESSAGE_TYPES = {
  popupSaveBridgeConfig: "piui/popup/save-bridge-config",
  popupGetBridgeConfig: "piui/popup/get-bridge-config",
  popupAttachBridge: "piui/popup/attach-bridge",
  contentGetBridgeRuntime: "piui/content/get-bridge-runtime",
  contentSelectionSync: "piui/content/selection-sync",
  contentApply: "piui/content/apply"
} as const;

export type BridgeConfig = {
  bridgeUrl: string;
  token: string;
};

export type BridgeRuntime = {
  config: BridgeConfig;
  browserSessionId: string;
};

export type ContentSourceHint = {
  file?: string;
  line?: number;
  column?: number;
  component?: string;
  sourceId?: string;
};

export type ContentSelection = {
  tag: string;
  selector?: string;
  domPath?: string;
  semanticPath?: string;
  text?: string;
  testAttributes?: string[];
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type PopupSaveBridgeConfigRequest = {
  type: typeof MESSAGE_TYPES.popupSaveBridgeConfig;
  config: BridgeConfig;
};

export type PopupGetBridgeConfigRequest = {
  type: typeof MESSAGE_TYPES.popupGetBridgeConfig;
};

export type PopupAttachBridgeRequest = {
  type: typeof MESSAGE_TYPES.popupAttachBridge;
  tabId: number;
  pageUrl: string;
  pageTitle?: string;
};

export type ContentGetBridgeRuntimeRequest = {
  type: typeof MESSAGE_TYPES.contentGetBridgeRuntime;
};

export type ContentSelectionSyncRequest = {
  type: typeof MESSAGE_TYPES.contentSelectionSync;
  pageUrl: string;
  selection: ContentSelection;
  sourceHint?: ContentSourceHint;
};

export type ContentApplyRequest = {
  type: typeof MESSAGE_TYPES.contentApply;
  pageUrl: string;
  selection: ContentSelection;
  sourceHint?: ContentSourceHint;
  prompt: string;
};

export type RuntimeRequest =
  | PopupSaveBridgeConfigRequest
  | PopupGetBridgeConfigRequest
  | PopupAttachBridgeRequest
  | ContentGetBridgeRuntimeRequest
  | ContentSelectionSyncRequest
  | ContentApplyRequest;

export type RuntimeResponse = {
  ok: boolean;
  error?: string;
  config?: BridgeConfig;
  browserSessionId?: string;
  runtime?: BridgeRuntime;
  requestId?: string;
  connected?: boolean;
  attachedPageUrl?: string;
};
