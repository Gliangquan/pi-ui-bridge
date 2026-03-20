import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, context } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const distDir = path.join(packageRoot, "dist");
const publicDir = path.join(packageRoot, "public");
const watchMode = process.argv.includes("--watch");

const aliasPlugin = {
  name: "workspace-alias",
  setup(buildContext) {
    buildContext.onResolve({ filter: /^@pi-ui-bridge\/bridge-core$/ }, () => ({
      path: path.resolve(packageRoot, "../bridge-core/src/index.ts")
    }));
  }
};

const baseConfig = {
  bundle: true,
  legalComments: "none",
  logLevel: "info",
  platform: "browser",
  plugins: [aliasPlugin],
  sourcemap: true,
  target: ["chrome114"]
};

const buildTargets = [
  {
    entryPoints: [path.join(packageRoot, "src/content.ts")],
    format: "iife",
    outfile: path.join(distDir, "content.js")
  },
  {
    entryPoints: [path.join(packageRoot, "src/background.ts")],
    format: "iife",
    outfile: path.join(distDir, "background.js")
  },
  {
    entryPoints: [path.join(packageRoot, "src/popup/main.ts")],
    format: "iife",
    outfile: path.join(distDir, "popup.js")
  }
];

async function copyStaticFiles() {
  await mkdir(distDir, { recursive: true });
  await cp(path.join(publicDir, "manifest.json"), path.join(distDir, "manifest.json"));
  await cp(path.join(publicDir, "popup.html"), path.join(distDir, "popup.html"));
}

async function runBuild() {
  await rm(distDir, { force: true, recursive: true });
  await copyStaticFiles();

  if (watchMode) {
    const contexts = await Promise.all(buildTargets.map((target) => context({ ...baseConfig, ...target })));
    await Promise.all(contexts.map((buildContext) => buildContext.watch()));
    console.log(`[Pi UI Bridge] browser extension watching: ${distDir}`);
    return;
  }

  await Promise.all(buildTargets.map((target) => build({ ...baseConfig, ...target })));
  console.log(`[Pi UI Bridge] browser extension built: ${distDir}`);
}

runBuild().catch((error) => {
  console.error("[Pi UI Bridge] browser extension build failed");
  console.error(error);
  process.exitCode = 1;
});
