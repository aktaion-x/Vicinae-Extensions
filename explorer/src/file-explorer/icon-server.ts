import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import type { ChildProcess } from "node:child_process";
const resolvedIcons = new Map();

const SCRIPT_PATH =
  `${process.env.HOME}/.local/share/vicinae/scripts/get-icon-path`;

type PendingRequest = {
  resolve: (path: string | null) => void;
  reject: (error: Error) => void;
};

let server: ChildProcess | null = null;
let nextId = 1;

const pending = new Map<number, PendingRequest>();
const iconCache = new Map<string, Promise<string | null>>();

function failPending(error: Error) {
  for (const request of pending.values()) {
    request.reject(error);
  }
  pending.clear();
}

function ensureServer(): ChildProcess {
  if (server && server.exitCode === null && !server.killed) {
    return server;
  }

  const child = spawn("gjs", [SCRIPT_PATH], {
    stdio: ["pipe", "pipe", "ignore"],
  });

  server = child;

  const output = createInterface({ input: child.stdout! });

  output.on("line", (line) => {
    try {
      const response = JSON.parse(line);
      const request = pending.get(response.id);

      if (!request) return;

      pending.delete(response.id);
      request.resolve(
        typeof response.path === "string" ? response.path : null
      );
    } catch {
      // Ignore malformed output lines.
    }
  });

  child.on("error", (error) => {
    if (server === child) {
      server = null;
      failPending(error);
    }
  });

  child.on("close", (code) => {
    if (server === child) {
      server = null;
      failPending(
        new Error(`Icon server exited (code ${code ?? "unknown"})`)
      );
    }
  });

  return child;
}

function requestIcon(path: string): Promise<string | null> {
  const child = ensureServer();
  const id = nextId++;

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });

    child.stdin!.write(
      JSON.stringify({ id, path }) + "\n",
      (error) => {
        if (!error) return;

        pending.delete(id);
        reject(error);
      }
    );
  });
}

export function getIconPath(path: string): Promise<string | null> {
  const cached = iconCache.get(path);
  if (cached) return cached;

  const request = requestIcon(path).catch((error) => {
    // Let subsequent requests retry if the helper fails.
    if (iconCache.get(path) === request) {
      iconCache.delete(path);
    }
    throw error;
  });

  iconCache.set(path, request);
  return request;
}