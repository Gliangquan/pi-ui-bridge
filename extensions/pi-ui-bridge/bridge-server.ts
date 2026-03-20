import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { ApplyRequest, ApplyResponse, AttachRequest, AttachResponse, BridgeHealth, BridgeStateSnapshot, SelectionSyncRequest } from "../../packages/bridge-core/src";
import { injectApplyRequest } from "./message-injector";
import { toBridgeStateSnapshot, type BridgeRuntimeState } from "./bridge-state";

export type BridgeServerHandle = {
  server: Server;
  port: number;
  token: string;
  stop: () => Promise<void>;
};

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? (JSON.parse(raw) as T) : ({} as T);
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function unauthorized(res: ServerResponse) {
  sendJson(res, 401, { ok: false, error: "Unauthorized" });
}

function notFound(res: ServerResponse) {
  sendJson(res, 404, { ok: false, error: "Not found" });
}

function methodNotAllowed(res: ServerResponse) {
  sendJson(res, 405, { ok: false, error: "Method not allowed" });
}

function validateToken(req: IncomingMessage, token: string): boolean {
  return req.headers["x-pi-ui-token"] === token;
}

export function createBridgeServer(pi: ExtensionAPI, state: BridgeRuntimeState, cwd: string): Promise<BridgeServerHandle> {
  const token = randomUUID();

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const url = req.url ?? "/";

        if (url === "/health" && req.method === "GET") {
          const health: BridgeHealth = {
            ok: true,
            projectRoot: cwd,
            sessionId: pi.getSessionName() || "pi-ui-bridge-session",
            connectedPageCount: state.browserSessions.size
          };
          sendJson(res, 200, health);
          return;
        }

        if (!validateToken(req, token)) {
          unauthorized(res);
          return;
        }

        if (url === "/attach") {
          if (req.method !== "POST") {
            methodNotAllowed(res);
            return;
          }

          const body = await readJson<AttachRequest>(req);
          const browserSessionId = `browser-${randomUUID()}`;
          state.browserSessions.set(browserSessionId, {
            id: browserSessionId,
            pageUrl: body.pageUrl,
            pageTitle: body.pageTitle,
            framework: body.framework,
            connectedAt: Date.now()
          });

          const response: AttachResponse = {
            ok: true,
            browserSessionId
          };
          sendJson(res, 200, response);
          return;
        }

        if (url === "/selection") {
          if (req.method !== "POST") {
            methodNotAllowed(res);
            return;
          }

          const body = await readJson<SelectionSyncRequest>(req);
          state.lastSelection = body;
          sendJson(res, 200, { ok: true });
          return;
        }

        if (url === "/apply") {
          if (req.method !== "POST") {
            methodNotAllowed(res);
            return;
          }

          const body = await readJson<ApplyRequest>(req);
          const requestId = `req-${Date.now()}`;
          state.lastApply = body;
          state.lastRequestId = requestId;
          injectApplyRequest(pi, body, true);
          const response: ApplyResponse = { ok: true, requestId, injected: true };
          sendJson(res, 200, response);
          return;
        }

        if (url === "/state" && req.method === "GET") {
          const snapshot: BridgeStateSnapshot = toBridgeStateSnapshot(state);
          sendJson(res, 200, snapshot);
          return;
        }

        notFound(res);
      } catch (error) {
        sendJson(res, 500, {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown server error"
        });
      }
    });

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to resolve bridge server address"));
        return;
      }

      resolve({
        server,
        port: address.port,
        token,
        stop: () =>
          new Promise<void>((done, stopReject) => {
            server.close((error) => {
              if (error) {
                stopReject(error);
                return;
              }
              done();
            });
          })
      });
    });
  });
}
