import { MESSAGE_TYPES } from "../messages";
import type { BridgeConfig, RuntimeResponse } from "../messages";

function sendMessage<T extends RuntimeResponse>(message: object): Promise<T> {
  return chrome.runtime.sendMessage(message);
}

async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

function render(
  root: HTMLElement,
  state: {
    config: BridgeConfig;
    message: string;
    error: string;
    busy: boolean;
    connected: boolean;
    browserSessionId: string;
    attachedPageUrl: string;
  }
) {
  root.innerHTML = `
    <div style="font-family: ui-sans-serif, system-ui; width: 360px; padding: 16px; box-sizing: border-box; color: #111827;">
      <h2 style="margin: 0 0 12px; font-size: 18px;">Pi UI Bridge</h2>
      <div style="display:grid; gap:8px; margin-bottom:12px; padding:10px; border-radius:10px; background:#f8fafc; border:1px solid #e2e8f0; font-size:12px;">
        <div><strong>状态:</strong> ${state.connected ? "已连接" : "未连接"}</div>
        <div><strong>browserSessionId:</strong> ${state.browserSessionId || "(none)"}</div>
        <div><strong>页面:</strong> ${state.attachedPageUrl || "(none)"}</div>
      </div>
      <div style="display: grid; gap: 10px;">
        <label style="display:grid; gap:4px; font-size:12px;">
          <span>Bridge URL</span>
          <input id="bridgeUrl" value="${state.config.bridgeUrl}" style="padding:8px; border:1px solid #d1d5db; border-radius:8px;" />
        </label>
        <label style="display:grid; gap:4px; font-size:12px;">
          <span>Token</span>
          <input id="token" value="${state.config.token}" style="padding:8px; border:1px solid #d1d5db; border-radius:8px;" />
        </label>
        <div style="display:flex; gap:8px;">
          <button id="saveBtn" style="flex:1; padding:10px; border:none; border-radius:8px; background:#111827; color:white;">保存配置</button>
          <button id="attachBtn" style="flex:1; padding:10px; border:1px solid #d1d5db; border-radius:8px; background:white;">连接页面</button>
        </div>
        <div style="font-size:12px; color:${state.error ? "#b91c1c" : "#374151"}; min-height: 18px;">${state.error || state.message}</div>
      </div>
    </div>
  `;
}

async function boot() {
  const root = document.getElementById("app");
  if (!root) {
    return;
  }

  let config: BridgeConfig = { bridgeUrl: "", token: "" };
  let message = "填写本地 pi bridge 地址与 token";
  let error = "";
  let busy = false;
  let connected = false;
  let browserSessionId = "";
  let attachedPageUrl = "";

  const loaded = await sendMessage<RuntimeResponse>({ type: MESSAGE_TYPES.popupGetBridgeConfig });
  if (loaded.config) {
    config = loaded.config;
  }
  connected = Boolean(loaded.connected);
  browserSessionId = loaded.browserSessionId || "";
  attachedPageUrl = loaded.attachedPageUrl || "";

  const rerender = () => {
    render(root, { config, message, error, busy, connected, browserSessionId, attachedPageUrl });

    const bridgeUrlInput = root.querySelector<HTMLInputElement>("#bridgeUrl");
    const tokenInput = root.querySelector<HTMLInputElement>("#token");
    const saveBtn = root.querySelector<HTMLButtonElement>("#saveBtn");
    const attachBtn = root.querySelector<HTMLButtonElement>("#attachBtn");

    if (!bridgeUrlInput || !tokenInput || !saveBtn || !attachBtn) {
      return;
    }

    bridgeUrlInput.oninput = () => {
      config = { ...config, bridgeUrl: bridgeUrlInput.value };
    };

    tokenInput.oninput = () => {
      config = { ...config, token: tokenInput.value };
    };

    saveBtn.onclick = async () => {
      busy = true;
      error = "";
      message = "正在保存配置...";
      rerender();

      const response = await sendMessage<RuntimeResponse>({
        type: MESSAGE_TYPES.popupSaveBridgeConfig,
        config
      });

      busy = false;
      if (!response.ok) {
        error = response.error || "保存失败";
        message = "";
      } else {
        message = "配置已保存";
        error = "";
      }
      rerender();
    };

    attachBtn.onclick = async () => {
      config = {
        bridgeUrl: bridgeUrlInput.value.trim(),
        token: tokenInput.value.trim()
      };

      if (!config.bridgeUrl || !config.token) {
        error = "请先填写 bridgeUrl 和 token";
        message = "";
        rerender();
        return;
      }

      busy = true;
      error = "";
      message = "正在保存并连接当前页面...";
      rerender();

      const saved = await sendMessage<RuntimeResponse>({
        type: MESSAGE_TYPES.popupSaveBridgeConfig,
        config
      });

      if (!saved.ok) {
        busy = false;
        error = saved.error || "保存配置失败";
        message = "";
        rerender();
        return;
      }

      const tab = await getCurrentTab();
      if (!tab?.url || !tab.id) {
        busy = false;
        error = "未找到当前页面";
        message = "";
        rerender();
        return;
      }

      const response = await sendMessage<RuntimeResponse>({
        type: MESSAGE_TYPES.popupAttachBridge,
        tabId: tab.id,
        pageUrl: tab.url,
        pageTitle: tab.title
      });

      busy = false;
      if (!response.ok) {
        error = response.error || "连接失败";
        message = "";
      } else {
        connected = Boolean(response.connected);
        browserSessionId = response.browserSessionId || "";
        attachedPageUrl = response.attachedPageUrl || tab.url;
        message = `已连接，browserSessionId: ${response.browserSessionId}`;
        error = "";
      }
      rerender();
    };

    saveBtn.disabled = busy;
    attachBtn.disabled = busy;
  };

  rerender();
}

void boot();
