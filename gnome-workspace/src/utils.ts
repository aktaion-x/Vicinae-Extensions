import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { test } from "./test-sharp";


const exec = promisify(execFile);

export interface Workspace {
  id: number;
  name: string;
  active: boolean;
  windowCount: number;
  windows: WindowInfo[];
}

export interface WindowInfo {
  id: string;
  workspace: number;
  title: string;
  iconPath: string | null;
}

export interface WindowEntry {
  id: string;
  desktop: number;
}

async function wmctrl(...args: string[]): Promise<string> {
  const { stdout } = await exec("wmctrl", args);
  return stdout.trim();
}

// Get all workspaces and their windows
export async function getWorkspaces(): Promise<Workspace[]> {
  const [desktopOutput, windowOutput] = await Promise.all([
    wmctrl("-d"),
    wmctrl("-l"),
  ]);

  const desktopLines = desktopOutput.split("\n").filter(Boolean);
  const windowLines = windowOutput.split("\n").filter(Boolean);

  const workspaces: Workspace[] = desktopLines.map((line) => {
    const parts = line.trim().split(/\s+/);
    const id = Number(parts[0]);

    return {
      id,
      name: parts.slice(9).join(" ") || `Workspace ${id + 1}`,
      active: parts[1] === "*",
      windowCount: 0,
      windows: [],
    };
  });

  // NEW CODE: Retrieve windows and their actual icons.
  const windows = await Promise.all(
    windowLines.map(async (line) => {
      const match = line.match(/^(\S+)\s+(-?\d+)\s+\S+\s*(.*)$/);
      if (!match) return null;

      const [, id, desktop, title] = match;
      const workspace = Number(desktop);

      if (workspace === -1) return null;

      return {
        id,
        workspace,
        title,
        iconPath: await getWindowIcon(id),
      };
    })
  );

  for (const window of windows) {
    if (!window) continue;

    const target = workspaces.find(
      (w) => w.id === window.workspace
    );

    if (target) {
      target.windows.push(window);
      target.windowCount++;
    }
  }

  return workspaces;
}

// Switch workspace
export async function goToWorkspace(id: number): Promise<void> {
  await wmctrl("-s", String(id));
}

// Add workspace (set total workspace count)
export async function addWorkspace(): Promise<void> {
  const workspaces = await getWorkspaces();
  await wmctrl("-n", String(workspaces.length + 1));
}

// Delete last workspace
export async function deleteWorkspace(): Promise<void> {
  const workspaces = await getWorkspaces();

  if (workspaces.length <= 1) {
    throw new Error("Cannot delete the last workspace");
  }

  await wmctrl("-n", String(workspaces.length - 1));
}

// Get current workspace
export async function getCurrentWorkspace(): Promise<number> {
  const workspaces = await getWorkspaces();
  return workspaces.find((w) => w.active)?.id ?? 0;
}

async function getWindowsOnWorkspace(
  desktop: number,
): Promise<WindowEntry[]> {
  const output = await wmctrl("-l");

  return output
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(/^(\S+)\s+(-?\d+)\s+/);

      if (!match) return [];

      const windowDesktop = Number(match[2]);

      // Sticky windows (-1) are not moved.
      if (windowDesktop !== desktop) return [];

      return [{
        id: match[1],
        desktop: windowDesktop,
      }];
    });
}

async function setWorkspaceCount(count: number): Promise<void> {
  await exec("gsettings", [
    "set",
    "org.gnome.desktop.wm.preferences",
    "num-workspaces",
    String(count),
  ]);
}

export async function removeWorkspace(id: number): Promise<void> {
  // Make sure GNOME uses a fixed workspace count.
  await exec("gsettings", [
    "set",
    "org.gnome.mutter",
    "dynamic-workspaces",
    "false",
  ]);

  const workspaces = await getWorkspaces();
  const count = workspaces.length;

  if (!Number.isInteger(id) || id < 0 || id >= count) {
    throw new Error("Invalid workspace index");
  }

  if (count <= 1) {
    throw new Error("Cannot remove the last workspace");
  }

  const current = await getCurrentWorkspace();

  // Workspace to merge the deleted workspace into.
  const destination = id === 0 ? 1 : id - 1;

  // 1. Move windows from the workspace being deleted.
  for (const window of workspaces[id].windows) {
    await wmctrl("-ir", window.id, "-t", String(destination));
  }

  // 2. Shift all subsequent workspace windows down.
  for (let i = id + 1; i < count; i++) {
    const windows = await getWindowsOnWorkspace(i);

    for (const window of windows) {
      await wmctrl("-ir", window.id, "-t", String(i - 1));
    }
  }

  // 3. Switch to a workspace that will still exist.
  const nextActive =
    current > id
      ? current - 1
      : current === id
        ? Math.min(id, count - 2)
        : current;

  await wmctrl("-s", String(nextActive));

  // 4. Update GNOME's actual workspace count.
  await setWorkspaceCount(count - 1);

  // 5. Verify the change.
  const updated = await getWorkspaces();

  if (updated.length !== count - 1) {
    throw new Error(
      `Workspace deletion failed: expected ${count - 1}, got ${updated.length}`,
    );
  }
}



export async function getWindowIcon(
  windowId: string,
): Promise<string | null> {
  try {
    const { stdout } = await exec("xprop", [
      "-id",
      windowId,
      "-f",
      "_NET_WM_ICON",
      "32c",
      "_NET_WM_ICON",
    ]);

    const match = stdout.match(/=\s*([\s\S]+)/);
    if (!match) return null;

    const values = match[1].match(/\d+/g)?.map(Number);
    if (!values) return null;

    let offset = 0;
    let best: {
      width: number;
      height: number;
      pixels: number[];
    } | null = null;

    while (offset + 2 <= values.length) {
      const width = values[offset++];
      const height = values[offset++];

      if (
        width <= 0 ||
        height <= 0 ||
        width > 1024 ||
        height > 1024 ||
        offset + width * height > values.length
      ) {
        break;
      }

      const pixels = values.slice(offset, offset + width * height);
      offset += width * height;

      if (
        !best ||
        Math.abs(width - 64) + Math.abs(height - 64) <
        Math.abs(best.width - 64) + Math.abs(best.height - 64)
      ) {
        best = { width, height, pixels };
      }
    }

    if (!best) return null;

    const ppmPath = path.join(
      os.tmpdir(),
      `window-${windowId.replace(/[^a-zA-Z0-9]/g, "")}.ppm`
    );

    const pngPath = ppmPath.replace(".ppm", ".png");

    const header = `P6\n${best.width} ${best.height}\n255\n`;
    const rgb = Buffer.alloc(best.width * best.height * 3);
    const alpha = Buffer.alloc(best.width * best.height);

    best.pixels.forEach((argb, i) => {
      rgb[i * 3] = (argb >>> 16) & 255;
      rgb[i * 3 + 1] = (argb >>> 8) & 255;
      rgb[i * 3 + 2] = argb & 255;
      alpha[i] = (argb >>> 24) & 255;
    });

    // PPM does not support alpha, so use PAM instead.
    const pamHeader =
      `P7\nWIDTH ${best.width}\nHEIGHT ${best.height}\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n`;

    const rgba = Buffer.alloc(best.width * best.height * 4);

    best.pixels.forEach((argb, i) => {
      rgba[i * 4] = (argb >>> 16) & 255;
      rgba[i * 4 + 1] = (argb >>> 8) & 255;
      rgba[i * 4 + 2] = argb & 255;
      rgba[i * 4 + 3] = (argb >>> 24) & 255;
    });

    await fs.writeFile(ppmPath, Buffer.concat([
      Buffer.from(pamHeader),
      rgba,
    ]));

    await exec("magick", [
      ppmPath,
      "-resize", "16x16",
      pngPath,
    ]);

    await fs.unlink(ppmPath).catch(() => { });

    return pngPath;
  } catch (error) {
    console.error("Failed to extract window icon:", error);
    return null;
  }
}