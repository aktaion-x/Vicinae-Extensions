import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";


const exec = promisify(execFile);

interface HyprWorkspace {
  id: number;
  name: string;
  monitor: string;
  windows: number;
}
export interface Workspace {
  id: number;
  name: string;
  active: boolean;
  windowCount: number;
  windows: WindowInfo[];
}

interface WindowInfo {
  id: string;
  workspace: number;
  title: string;
  iconPath: string | null;
}

interface WindowEntry {
  id: string;
  desktop: number;
}


interface HyprClient {
  address: string;
  title: string;
  class: string;
  initialClass: string;
  workspace: {
    id: number;
    name: string;
  };
}

async function hyprctl(...args: string[]): Promise<string> {
  const { stdout } = await exec("hyprctl", args);
  return stdout.trim();
}

async function hyprJSON<T>(command: string): Promise<T> {
  const output = await hyprctl("-j", command);
  return JSON.parse(output) as T;
}


export async function getWorkspaces(): Promise<Workspace[]> {
  const [hyprWorkspaces, clients, active] = await Promise.all([
    hyprJSON<HyprWorkspace[]>("workspaces"),
    hyprJSON<HyprClient[]>("clients"),
    hyprJSON<{ id: number }>("activeworkspace"),
  ]);

  return Promise.all(
    hyprWorkspaces
      .filter((ws) => !ws.name.startsWith("special:"))
      .map(async (ws) => {
        const windows: WindowInfo[] = await Promise.all(
          clients
            .filter((client) => client.workspace.id === ws.id)
            .map(async (client) => ({
              id: client.address,
              workspace: ws.id,
              title: client.title || client.class || "Untitled",
              iconPath: await getWindowIcon(
                client.class,
                client.initialClass,
              ),
            })),
        );

        return {
          id: ws.id,
          name: ws.name,
          active: ws.id === active.id,
          windowCount: windows.length,
          windows,
        };
      }),
  );
}

// Switch workspace
export async function goToWorkspace(id: number): Promise<void> {
  await hyprctl("dispatch", "workspace", String(id));
}

// Add a workspace by creating and activating the next numeric workspace
export async function addWorkspace(): Promise<void> {
  const workspaces = await getWorkspaces();
  const numericIds = workspaces
    .map((ws) => ws.id)
    .filter((id) => id > 0);

  const nextId = Math.max(0, ...numericIds) + 1;
  await goToWorkspace(nextId);
}

// Dynamic workspaces do not have a fixed count.
// This helper moves windows off the highest-numbered workspace.
export async function deleteWorkspace(): Promise<void> {
  const workspaces = await getWorkspaces();

  if (workspaces.length <= 1) {
    throw new Error("Cannot remove the last workspace");
  }

  const last = [...workspaces].sort((a, b) => b.id - a.id)[0];
  await removeWorkspace(last.id);
}

// Get current workspace
export async function getCurrentWorkspace(): Promise<number> {
  const active = await hyprJSON<{ id: number }>("activeworkspace");
  return active.id;
}

// Focus a window by its Hyprland address
export async function focusWindow(id: string): Promise<void> {
  await hyprctl("dispatch", "focuswindow", `address:${id}`);
}

// Move a window to another workspace
export async function moveWindow(
  id: string,
  workspace: number,
): Promise<void> {
  await hyprctl(
    "dispatch",
    "movetoworkspace",
    `${workspace},address:${id}`,
  );
}

// Get windows on a workspace
async function getWindowsOnWorkspace(
  desktop: number,
): Promise<WindowEntry[]> {
  const clients = await hyprJSON<HyprClient[]>("clients");

  return clients
    .filter((client) => client.workspace.id === desktop)
    .map((client) => ({
      id: client.address,
      desktop,
    }));
}

// Remove a workspace by moving its windows elsewhere.
// Hyprland normally destroys an empty, non-persistent workspace automatically.
export async function removeWorkspace(id: number): Promise<void> {
  const workspaces = await getWorkspaces();

  if (!Number.isInteger(id) || !workspaces.some((ws) => ws.id === id)) {
    throw new Error("Invalid workspace ID");
  }

  if (workspaces.length <= 1) {
    throw new Error("Cannot remove the last workspace");
  }

  const current = await getCurrentWorkspace();

  const destination =
    [...workspaces]
      .filter((ws) => ws.id !== id)
      .sort((a, b) => Math.abs(a.id - id) - Math.abs(b.id - id))[0];

  if (!destination) {
    throw new Error("No destination workspace available");
  }

  const windows = await getWindowsOnWorkspace(id);

  for (const window of windows) {
    await moveWindow(window.id, destination.id);
  }

  if (current === id) {
    await goToWorkspace(destination.id);
  }
}

// Native Wayland windows do not expose _NET_WM_ICON via xprop.
// Implement desktop-file icon lookup separately.
// export async function getWindowIcon(
//   _windowId: string,
// ): Promise<string | null> {
//   return null;
// }

const DATA_HOME =
  process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local/share");

const DATA_DIRS = (
  process.env.XDG_DATA_DIRS || "/usr/local/share:/usr/share"
).split(":");

const ICON_EXTENSIONS = [".png", ".svg", ".xpm"];

const desktopCache = new Map<string, string | null>();
const iconCache = new Map<string, string | null>();
const themeFilesCache = new Map<string, Map<string, string>>();

function normalize(value: string): string {
  return value.toLowerCase().replace(/\.desktop$/, "").replace(/[^a-z0-9]/g, "");
}

async function readDesktopEntry(file: string): Promise<Record<string, string>> {
  const content = await fs.readFile(file, "utf8");
  const section = content.match(/\[Desktop Entry\]([\s\S]*?)(?:\n\[|$)/);

  if (!section) return {};

  const result: Record<string, string> = {};

  for (const line of section[1].split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9]*)=(.*)$/);
    if (match) result[match[1]] = match[2].trim();
  }

  return result;
}

async function findDesktopEntry(
  classes: string[],
): Promise<Record<string, string> | null> {
  const candidates = [...new Set(classes.filter(Boolean))];
  const wanted = candidates.map(normalize);

  for (const className of candidates) {
    const cacheKey = normalize(className);

    if (desktopCache.has(cacheKey)) {
      const cached = desktopCache.get(cacheKey);
      if (cached) return readDesktopEntry(cached);
    }
  }

  const directories = [
    path.join(DATA_HOME, "applications"),
    ...DATA_DIRS.map((dir) => path.join(dir, "applications")),
  ];

  const files: string[] = [];

  async function scan(directory: string): Promise<void> {
    let entries;

    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".desktop")) {
        files.push(fullPath);
      }
    }
  }

  for (const directory of directories) {
    await scan(directory);
  }

  for (const file of files) {
    const filename = normalize(path.basename(file));
    if (wanted.includes(filename)) {
      desktopCache.set(filename, file);
      return readDesktopEntry(file);
    }
  }

  // Some applications use a different desktop filename.
  for (const file of files) {
    const entry = await readDesktopEntry(file);

    if (entry.Hidden === "true" || entry.NoDisplay === "true") continue;

    const startupClass = normalize(entry.StartupWMClass || "");
    const filename = normalize(path.basename(file));

    if (wanted.includes(startupClass) || wanted.includes(filename)) {
      return entry;
    }
  }

  for (const className of candidates) {
    desktopCache.set(normalize(className), null);
  }

  return null;
}

async function getIconTheme(): Promise<string> {
  try {
    const { stdout } = await exec("gsettings", [
      "get",
      "org.gnome.desktop.interface",
      "icon-theme",
    ]);

    const theme = stdout.trim().replace(/^'|'$/g, "");
    if (theme && theme !== "''") return theme;
  } catch {
    // GNOME settings may not be available.
  }

  return "hicolor";
}

async function getThemeFiles(theme: string): Promise<Map<string, string>> {
  if (themeFilesCache.has(theme)) {
    return themeFilesCache.get(theme)!;
  }

  const result = new Map<string, string>();

  const iconRoots = [
    path.join(DATA_HOME, "icons", theme),
    ...DATA_DIRS.map((dir) => path.join(dir, "icons", theme)),
    path.join(os.homedir(), ".icons", theme),
  ];

  async function scan(directory: string): Promise<void> {
    let entries;

    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();

        if (ICON_EXTENSIONS.includes(ext)) {
          const name = path.basename(entry.name, ext).toLowerCase();

          if (!result.has(name)) {
            result.set(name, fullPath);
          }
        }
      }
    }
  }

  for (const root of iconRoots) {
    await scan(root);
  }

  themeFilesCache.set(theme, result);
  return result;
}

async function getThemeInheritance(theme: string): Promise<string[]> {
  const indexPaths = [
    path.join(DATA_HOME, "icons", theme, "index.theme"),
    ...DATA_DIRS.map((dir) => path.join(dir, "icons", theme, "index.theme")),
  ];

  for (const indexPath of indexPaths) {
    try {
      const content = await fs.readFile(indexPath, "utf8");
      const match = content.match(/^Inherits=(.*)$/m);

      if (match) {
        return match[1].split(",").map((item) => item.trim()).filter(Boolean);
      }

      return [];
    } catch {
      // Try the next icon directory.
    }
  }

  return [];
}

async function resolveIcon(iconName: string): Promise<string | null> {
  if (!iconName) return null;

  // Absolute path from a desktop entry
  if (path.isAbsolute(iconName)) {
    try {
      await fs.access(iconName);
      return iconName;
    } catch {
      return null;
    }
  }
  const cacheKey = iconName.toLowerCase();

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const theme = await getIconTheme();
  const themes = [theme];
  const visited = new Set<string>();

  while (themes.length) {
    const current = themes.shift()!;

    if (visited.has(current)) continue;
    visited.add(current);

    const files = await getThemeFiles(current);
    const found = files.get(cacheKey);

    if (found) {
      iconCache.set(cacheKey, found);
      return found;
    }

    themes.push(...await getThemeInheritance(current));
  }

  // Standard fallback icon locations.
  const fallbackDirs = [
    "/usr/share/pixmaps",
    path.join(DATA_HOME, "icons/hicolor"),
    ...DATA_DIRS.map((dir) => path.join(dir, "icons/hicolor")),
  ];

  for (const directory of fallbackDirs) {
    for (const ext of ICON_EXTENSIONS) {
      const candidate = path.join(directory, iconName + ext);

      try {
        await fs.access(candidate);
        iconCache.set(cacheKey, candidate);
        return candidate;
      } catch {
        // Continue searching.
      }
    }
  }

  iconCache.set(cacheKey, null);
  return null;
}

export async function getWindowIcon(
  windowClass: string,
  initialClass = "",
): Promise<string | null> {
  try {
    const desktopEntry = await findDesktopEntry([
      windowClass,
      initialClass,
    ]);

    const iconCandidates = [
      desktopEntry?.Icon,
      windowClass,
      initialClass,
    ].filter((value): value is string => Boolean(value));

    let source: string | null = null;

    for (const iconName of [...new Set(iconCandidates)]) {
      source = await resolveIcon(iconName);

      if (source) break;
    }

    if (!source) return null;

    const cacheDir = path.join(
      os.homedir(),
      ".cache",
      "vicinae",
      "hyprland-icons",
    );

    await fs.mkdir(cacheDir, { recursive: true });

    const safeName = normalize(windowClass || initialClass);
    const output = path.join(cacheDir, `${safeName}.png`);

    try {
      const sourceStat = await fs.stat(source);
      const outputStat = await fs.stat(output);

      if (outputStat.mtimeMs >= sourceStat.mtimeMs) {
        return output;
      }
    } catch {
      // Generate the cached icon.
    }

    await sharp(source)
      .resize(64, 64, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(output);

    return output;
  } catch (error) {
    console.error("Failed to resolve window icon:", error);
    return null;
  }
}