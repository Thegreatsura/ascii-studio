// Finds the first free TCP port at/after --base and launches `next dev` on it.
// Usage (run from an app dir, so cwd resolves that app's local `next`):
//   node ../../scripts/dev.mjs --base 3000 [extra next flags...]
import net from "node:net";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const argv = process.argv.slice(2);
const baseIdx = argv.indexOf("--base");
const base =
  baseIdx !== -1 ? Number.parseInt(argv[baseIdx + 1], 10) || 3000 : 3000;
// everything except `--base <n>` is forwarded to `next dev`
const passThrough = argv.filter(
  (_, i) => i !== baseIdx && i !== baseIdx + 1,
);

const isFree = (port) =>
  new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, "0.0.0.0");
  });

let port = base;
const maxPort = base + 100;
while (port < maxPort && !(await isFree(port))) port++;

if (port !== base) {
  console.log(`\n⚠ port ${base} busy — using free port ${port} instead`);
}
console.log(`\n▶ dev server → http://localhost:${port}\n`);

// resolve THIS app's local next binary (cwd is the app dir under turbo)
const require = createRequire(`${process.cwd()}/`);
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(
  process.execPath,
  [nextBin, "dev", "-p", String(port), ...passThrough],
  { stdio: "inherit", env: process.env },
);

const forward = (sig) => child.kill(sig);
process.on("SIGINT", forward);
process.on("SIGTERM", forward);
child.on("exit", (code) => process.exit(code ?? 0));
