#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, "..");

const DIAGRAMS_README = `# Diagrams

Use these commands to regenerate files:

\`\`\`bash
node scripts/gen-tldr.mjs --smoke --out .diagrams/smoke-test.tldr
node scripts/gen-tldr.mjs --in .diagrams/diagram.json --out .diagrams/diagram.tldr
\`\`\`

Open \`.diagrams/smoke-test.tldr\` or \`.diagrams/diagram.tldr\` in VS Code.
`;

function printUsage() {
  console.log(`Usage:
  node scripts/bootstrap-project.mjs [--target <dir>] [--force] [--no-vscode] [--install-extension]

Options:
  --target <dir>         Project directory to bootstrap (default: current directory)
  --force                Overwrite existing generated setup files
  --no-vscode            Skip .vscode/tasks.json and extensions recommendations
  --install-extension    Install VS Code extension tldraw-org.tldraw-vscode
  --help                 Show this help`);
}

function parseArgs(argv) {
  const options = {
    target: process.cwd(),
    force: false,
    withVscode: true,
    installExtension: false,
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
    if (arg === "--no-vscode") {
      options.withVscode = false;
      continue;
    }
    if (arg === "--install-extension") {
      options.installExtension = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(srcPath, dstPath, force) {
  ensureDir(path.dirname(dstPath));
  if (fs.existsSync(dstPath) && !force) {
    return "kept";
  }
  fs.copyFileSync(srcPath, dstPath);
  return fs.existsSync(dstPath) && force ? "updated" : "created";
}

function writeFileIfMissing(filePath, content) {
  if (fs.existsSync(filePath)) return "kept";
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
  return "created";
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureTaskConfig(projectRoot, force) {
  const tasksPath = path.join(projectRoot, ".vscode", "tasks.json");
  const existed = fs.existsSync(tasksPath);
  const desiredTasks = [
    {
      label: "Diagram: generate tldraw",
      type: "shell",
      command: "node scripts/gen-tldr.mjs --in .diagrams/diagram.json --out .diagrams/diagram.tldr",
      problemMatcher: [],
      group: "build",
    },
    {
      label: "Diagram: generate smoke tldraw",
      type: "shell",
      command: "node scripts/gen-tldr.mjs --smoke --out .diagrams/smoke-test.tldr",
      problemMatcher: [],
      group: "build",
    },
  ];

  let data = readJsonIfExists(tasksPath);
  if (!data) {
    data = { version: "2.0.0", tasks: [] };
  }
  if (!Array.isArray(data.tasks)) {
    throw new Error(`${tasksPath} exists but does not contain "tasks" array`);
  }

  let changed = false;
  for (const task of desiredTasks) {
    const idx = data.tasks.findIndex((item) => item && item.label === task.label);
    if (idx === -1) {
      data.tasks.push(task);
      changed = true;
      continue;
    }
    if (force) {
      data.tasks[idx] = task;
      changed = true;
    }
  }

  if (changed || !existed) {
    writeJson(tasksPath, data);
    return existed ? "updated" : "created";
  }
  return "kept";
}

function ensureExtensionsRecommendation(projectRoot) {
  const filePath = path.join(projectRoot, ".vscode", "extensions.json");
  const existed = fs.existsSync(filePath);
  let data = readJsonIfExists(filePath);
  if (!data) {
    data = { recommendations: [] };
  }
  if (!Array.isArray(data.recommendations)) {
    throw new Error(`${filePath} exists but does not contain "recommendations" array`);
  }

  const id = "tldraw-org.tldraw-vscode";
  if (!data.recommendations.includes(id)) {
    data.recommendations.push(id);
    writeJson(filePath, data);
    return existed ? "updated" : "created";
  }

  if (!existed) {
    writeJson(filePath, data);
    return "created";
  }
  return "kept";
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
    console.warn("Warning: failed to install VS Code extension. Install manually: code --install-extension tldraw-org.tldraw-vscode");
  }
}

function validateJson(filePath) {
  JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const targetRoot = options.target;
  const sourceGen = path.join(SKILL_ROOT, "scripts", "gen-tldr.mjs");
  const sourceTemplate = path.join(SKILL_ROOT, "assets", "template.tldr");
  const sourceExampleDiagram = path.join(SKILL_ROOT, "examples", "diagram.json");

  if (!fs.existsSync(sourceGen) || !fs.existsSync(sourceTemplate) || !fs.existsSync(sourceExampleDiagram)) {
    throw new Error("Bootstrap source files are missing in skill package");
  }

  const targetGen = path.join(targetRoot, "scripts", "gen-tldr.mjs");
  const targetTemplate = path.join(targetRoot, ".diagrams", "template.tldr");
  const targetDiagramJson = path.join(targetRoot, ".diagrams", "diagram.json");
  const targetDiagramTldr = path.join(targetRoot, ".diagrams", "diagram.tldr");
  const targetSmokeTldr = path.join(targetRoot, ".diagrams", "smoke-test.tldr");
  const targetDiagramsReadme = path.join(targetRoot, ".diagrams", "README.md");

  const scriptStatus = copyFile(sourceGen, targetGen, options.force);
  const templateStatus = copyFile(sourceTemplate, targetTemplate, options.force);
  const diagramJsonStatus = copyFile(sourceExampleDiagram, targetDiagramJson, false);
  const diagramsReadmeStatus = writeFileIfMissing(targetDiagramsReadme, DIAGRAMS_README);

  let tasksStatus = "skipped";
  let extensionsStatus = "skipped";
  if (options.withVscode) {
    tasksStatus = ensureTaskConfig(targetRoot, options.force);
    extensionsStatus = ensureExtensionsRecommendation(targetRoot);
  }

  runNodeScript(targetGen, ["--smoke", "--out", ".diagrams/smoke-test.tldr"], targetRoot);
  runNodeScript(targetGen, ["--in", ".diagrams/diagram.json", "--out", ".diagrams/diagram.tldr"], targetRoot);
  validateJson(targetSmokeTldr);
  validateJson(targetDiagramTldr);

  if (options.installExtension) {
    installExtension();
  }

  console.log("Bootstrap complete:");
  console.log(`- Target: ${targetRoot}`);
  console.log(`- scripts/gen-tldr.mjs: ${scriptStatus}`);
  console.log(`- .diagrams/template.tldr: ${templateStatus}`);
  console.log(`- .diagrams/diagram.json: ${diagramJsonStatus}`);
  console.log(`- .diagrams/README.md: ${diagramsReadmeStatus}`);
  console.log(`- .vscode/tasks.json: ${tasksStatus}`);
  console.log(`- .vscode/extensions.json: ${extensionsStatus}`);
  console.log(`- Generated: ${targetSmokeTldr}`);
  console.log(`- Generated: ${targetDiagramTldr}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
