import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const sourceDir = path.join(
  projectRoot,
  "node_modules",
  "@radix-ui",
  "primitive",
);
const targetDir = path.join(
  projectRoot,
  "node_modules",
  "@radix-ui",
  "react-dialog",
  "node_modules",
  "@radix-ui",
  "primitive",
);
const targetEntry = path.join(targetDir, "dist", "index.mjs");

if (!existsSync(sourceDir)) {
  console.warn(
    "[repair-radix-install] Skipped: source package @radix-ui/primitive was not found.",
  );
  process.exit(0);
}

if (existsSync(targetEntry)) {
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true, force: true });
console.log(
  "[repair-radix-install] Restored missing nested @radix-ui/primitive for @radix-ui/react-dialog.",
);
