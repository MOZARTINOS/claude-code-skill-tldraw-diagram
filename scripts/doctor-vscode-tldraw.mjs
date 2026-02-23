#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printUsage() {
  console.log(`Usage:
  node scripts/doctor-vscode-tldraw.mjs [--target <dir>] [--force] [--reset-workspace-cache] [--hard-reset-workspace] [--install-extension] [--no-bootstrap]

Options:
  --target <dir>            Project directory (default: current directory)
  --force                   Overwrite project setup files during bootstrap
  --reset-workspace-cache   Remove tldraw workspace cache for this project
  --hard-reset-workspace    Remove full VS Code workspaceStorage entry for this project
  --install-extension       Install VS Code extension tldraw-org.tldraw-vscode
  --no-bootstrap            Skip bootstrap step
  --help                    Show this help`);
}

function parseArgs(argv) {
  const options = {
    target: process.cwd(),
    force: false,
    resetWorkspaceCache: false,
    hardResetWorkspace: false,
    installExtension: false,
    noBootstrap: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--target") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Missing value for --target");
      }
      options.target = path.resolve(process.cwd(), value);
      i += 1;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--reset-workspace-cache") {
      options.resetWorkspaceCache = true;
      continue;
    }
    if (arg === "--hard-reset-workspace") {
      options.hardResetWorkspace = true;
      options.resetWorkspaceCache = true;
      continue;
    }
    if (arg === "--install-extension") {
      options.installExtension = true;
      continue;
    }
    if (arg === "--no-bootstrap") {
      options.noBootstrap = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function runNodeScript(scriptPath, args, cwd) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: node ${path.relative(cwd, scriptPath)} ${args.join(" ")}`);
  }
}

function installExtension() {
  const result = spawnSync("code", ["--install-extension", "tldraw-org.tldraw-vscode"], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.warn("Warning: extension install failed. Install manually: code --install-extension tldraw-org.tldraw-vscode");
  }
}

function toWorkspaceUri(folderPath) {
  let normalized = path.resolve(folderPath).replace(/\\/g, "/");
  normalized = normalized.replace(/^([A-Za-z]):/, (_, drive) => `${drive.toLowerCase()}%3A`);
  const segments = normalized.split("/");
  const encoded = segments
    .map((segment) => (/^[a-z]%3A$/i.test(segment) ? segment : encodeURIComponent(segment)))
    .join("/");
  return `file:///${encoded}`;
}

function resetWorkspaceCache(projectRoot, hardResetWorkspace) {
  const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  const workspaceStorageRoot = path.join(appData, "Code", "User", "workspaceStorage");
  if (!fs.existsSync(workspaceStorageRoot)) {
    console.warn(`Warning: workspaceStorage not found: ${workspaceStorageRoot}`);
    return;
  }

  const targetUri = toWorkspaceUri(projectRoot);
  const dirs = fs.readdirSync(workspaceStorageRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  let matched = 0;

  for (const dir of dirs) {
    const wsDir = path.join(workspaceStorageRoot, dir.name);
    const workspaceJson = path.join(wsDir, "workspace.json");
    if (!fs.existsSync(workspaceJson)) continue;

    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(workspaceJson, "utf8"));
    } catch {
      continue;
    }

    if (parsed?.folder !== targetUri) continue;
    matched += 1;

    if (hardResetWorkspace) {
      fs.rmSync(wsDir, { recursive: true, force: true });
      console.log(`Removed workspace cache: ${wsDir}`);
      continue;
    }

    const tldrawCacheDir = path.join(wsDir, "tldraw-org.tldraw-vscode");
    if (fs.existsSync(tldrawCacheDir)) {
      fs.rmSync(tldrawCacheDir, { recursive: true, force: true });
      console.log(`Removed tldraw cache: ${tldrawCacheDir}`);
    } else {
      console.log(`No tldraw cache dir in workspace: ${wsDir}`);
    }
  }

  if (matched === 0) {
    console.log(`No workspaceStorage entry found for: ${targetUri}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const targetRoot = options.target;
  const bootstrapScript = path.join(__dirname, "bootstrap-project.mjs");

  if (!options.noBootstrap) {
    const args = ["--target", targetRoot];
    if (options.force) args.push("--force");
    runNodeScript(bootstrapScript, args, process.cwd());
  }

  if (options.resetWorkspaceCache) {
    resetWorkspaceCache(targetRoot, options.hardResetWorkspace);
  }

  if (options.installExtension) {
    installExtension();
  }

  console.log("Doctor complete.");
  console.log("Next step: reopen VS Code window and open .diagrams/smoke-test.tldr");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
