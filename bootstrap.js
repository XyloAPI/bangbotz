const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = __dirname;
const packageJsonPath = path.join(rootDir, "package.json");
const nodeModulesPath = path.join(rootDir, "node_modules");
const lockFilePath = path.join(rootDir, "package-lock.json");

function installDependenciesIfNeeded() {
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error("package.json tidak ditemukan di root project.");
  }

  if (fs.existsSync(nodeModulesPath)) {
    return;
  }

  const installCommand = fs.existsSync(lockFilePath) ? "npm ci" : "npm install";

  console.log(`[bootstrap] node_modules belum ada, menjalankan "${installCommand}"...`);
  execSync(installCommand, {
    cwd: rootDir,
    stdio: "inherit"
  });
}

function ensureSessionDirectory() {
  const sessionDir = path.join(rootDir, ".session");

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }
}

function main() {
  installDependenciesIfNeeded();
  ensureSessionDirectory();
  require("./src/index.js");
}

main();
