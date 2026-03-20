export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SourceHint = {
  file?: string;
  line?: number;
  column?: number;
  component?: string;
  sourceId?: string;
};

export type SelectionPayload = {
  tag: string;
  selector?: string;
  domPath?: string;
  semanticPath?: string;
  text?: string;
  rect?: Rect;
  testAttributes?: string[];
};

export type ApplyIntent = {
  type: "describe" | "move" | "resize" | "unknown";
  prompt: string;
};

export type BridgeHealth = {
  ok: boolean;
  projectRoot: string;
  sessionId: string;
  connectedPageCount: number;
};

export type AttachRequest = {
  pageUrl: string;
  pageTitle?: string;
  userAgent?: string;
  framework?: string;
};

export type AttachResponse = {
  ok: boolean;
  browserSessionId: string;
};

export type SelectionSyncRequest = {
  browserSessionId: string;
  pageUrl: string;
  selection: SelectionPayload;
  sourceHint?: SourceHint;
};

export type ApplyRequest = {
  browserSessionId: string;
  pageUrl: string;
  selection: SelectionPayload;
  intent: ApplyIntent;
  sourceHint?: SourceHint;
};

export type ApplyResponse = {
  ok: boolean;
  requestId: string;
  injected: boolean;
};

export type BridgeStateSnapshot = {
  ok: boolean;
  connected: boolean;
  lastPageUrl?: string;
  lastRequestId?: string;
  lastSelection?: {
    tag: string;
    selector?: string;
    text?: string;
    sourceId?: string;
    file?: string;
    line?: number;
    component?: string;
  };
};
