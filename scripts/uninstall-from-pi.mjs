import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const home = process.env.HOME || "";
const settingsPath = path.resolve(home, ".pi/agent/settings.json");
const installRoot = path.resolve(home, ".pi/agent/pi-ui-bridge");

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

async function main() {
  if (!home) {
    throw new Error("HOME is not set");
  }

  await mkdir(path.dirname(settingsPath), { recursive: true });
  const settings = await loadSettings();
  const packages = Array.isArray(settings.packages) ? settings.packages : [];
  settings.packages = packages.filter((item) => item !== installRoot);
  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  await rm(installRoot, { recursive: true, force: true });

  console.log(`Removed Pi UI Bridge from ${installRoot}`);
  console.log(`Updated ${settingsPath}`);
  console.log("Restart pi or run /reload to apply removal.");
}

main().catch((error) => {
  console.error("Failed to uninstall Pi UI Bridge from ~/.pi/agent");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
