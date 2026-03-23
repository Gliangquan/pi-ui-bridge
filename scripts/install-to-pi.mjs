import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const settingsPath = path.resolve(process.env.HOME || "", ".pi/agent/settings.json");

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
  if (!process.env.HOME) {
    throw new Error("HOME is not set");
  }

  await mkdir(path.dirname(settingsPath), { recursive: true });
  const settings = await loadSettings();
  const packages = Array.isArray(settings.packages) ? [...settings.packages] : [];

  if (!packages.includes(projectRoot)) {
    packages.push(projectRoot);
  }

  settings.packages = packages;
  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");

  console.log(`Registered Pi UI Bridge package in ${settingsPath}`);
  console.log(`package source: ${projectRoot}`);
  console.log("Restart pi or run /reload to use commands directly:");
  console.log("  /ui-start");
  console.log("  /pi-ui:start");
}

main().catch((error) => {
  console.error("Failed to register Pi UI Bridge in ~/.pi/agent/settings.json");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
