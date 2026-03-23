import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const home = process.env.HOME || "";
const settingsPath = path.resolve(home, ".pi/agent/settings.json");
const installRoot = path.resolve(home, ".pi/agent/pi-ui-bridge");

const EXCLUDES = new Set([
  ".git",
  ".pi",
  "node_modules",
  "dist",
  "coverage",
  ".DS_Store"
]);

async function loadSettings() {
  try {
    const raw = await readFile(settingsPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if ((error && typeof error === "object" && "code" in error && error.code === "ENOENT") || error instanceof SyntaxError) {
      return {};
    }
    throw error;
  }
}

async function copyProject(source, target) {
  const sourceStat = await stat(source);

  if (sourceStat.isDirectory()) {
    await mkdir(target, { recursive: true });
    const entries = await readFileDir(source);
    for (const entry of entries) {
      if (EXCLUDES.has(entry.name)) {
        continue;
      }
      await copyProject(path.join(source, entry.name), path.join(target, entry.name));
    }
    return;
  }

  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { force: true });
}

async function readFileDir(dir) {
  const fs = await import("node:fs/promises");
  return fs.readdir(dir, { withFileTypes: true });
}

function normalizePackages(packages) {
  const values = Array.isArray(packages) ? packages : [];
  const filtered = values.filter((item) => item !== projectRoot && item !== installRoot);
  filtered.push(installRoot);
  return filtered;
}

async function main() {
  if (!home) {
    throw new Error("HOME is not set");
  }

  await mkdir(path.dirname(settingsPath), { recursive: true });
  await rm(installRoot, { recursive: true, force: true });
  await copyProject(projectRoot, installRoot);

  const settings = await loadSettings();
  settings.packages = normalizePackages(settings.packages);
  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");

  console.log(`Synced Pi UI Bridge to ${installRoot}`);
  console.log(`Updated ${settingsPath}`);
  console.log("Restart pi or run /reload to use commands directly:");
  console.log("  /pi-ui:start");
}

main().catch((error) => {
  console.error("Failed to install Pi UI Bridge into ~/.pi/agent");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
