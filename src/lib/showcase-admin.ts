import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Change } from "./storage-adapter";

export const AUTH_COOKIE = "dash-auth";

// Re-export the client-safe string helpers so existing server-side callers
// (API routes) keep importing them from this module.
export { slugify, pascalCase } from "./slug";

/** Standard 401 response shared by the showcase-admin API routes. */
export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function hashPassword(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}

export function getExpectedAuthHash(): string | null {
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) return null;
  return hashPassword(pw);
}

export function checkAuthHash(provided: string): boolean {
  const expected = getExpectedAuthHash();
  if (!expected) return false;
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const cookie = store.get(AUTH_COOKIE);
  if (!cookie) return false;
  return checkAuthHash(cookie.value);
}

export function buildAuthCookieValue(password: string): string {
  return hashPassword(password);
}

export type ShowcaseType = "regular" | "special";

export type ShowcaseItem = {
  id: string;
  name: string;
  description: string;
  fileName: string;
  exportName: string;
  registryName: string;
  landscape: boolean;
};

export type Manifest = {
  regular: ShowcaseItem[];
  special: ShowcaseItem[];
};

const ROOT = process.cwd();
const MANIFEST_REL = "src/data/showcase-manifest.json";
const ASCII_DIR_REL = "src/components/ascii";
const REGISTRY_REL = `${ASCII_DIR_REL}/_registry.tsx`;
const MANIFEST_PATH = path.join(ROOT, MANIFEST_REL);
const ASCII_DIR = path.join(ROOT, ASCII_DIR_REL);

export async function readManifest(): Promise<Manifest> {
  const raw = await fs.readFile(MANIFEST_PATH, "utf8");
  return JSON.parse(raw) as Manifest;
}

function serializeManifest(manifest: Manifest): string {
  return JSON.stringify(manifest, null, 2) + "\n";
}

export function manifestWriteChange(manifest: Manifest): Change {
  return { op: "write", path: MANIFEST_REL, content: serializeManifest(manifest) };
}

export function registryWriteChange(manifest: Manifest): Change {
  return { op: "write", path: REGISTRY_REL, content: buildRegistrySource(manifest) };
}

export function asciiWriteChange(fileName: string, content: string): Change {
  validateAsciiFileName(fileName);
  return { op: "write", path: `${ASCII_DIR_REL}/${fileName}`, content };
}

export function asciiDeleteChange(fileName: string): Change {
  validateAsciiFileName(fileName);
  return { op: "delete", path: `${ASCII_DIR_REL}/${fileName}` };
}

function validateAsciiFileName(fileName: string): void {
  if (!/^[a-z0-9-]+\.tsx$/i.test(fileName)) {
    throw new Error(`Invalid fileName: ${fileName}`);
  }
}

export function resolveAsciiFilePath(fileName: string): string {
  if (!/^[a-z0-9-]+\.tsx$/i.test(fileName)) {
    throw new Error(`Invalid fileName: ${fileName}`);
  }
  const absolute = path.join(ASCII_DIR, fileName);
  const normalized = path.normalize(absolute);
  if (!normalized.startsWith(ASCII_DIR + path.sep)) {
    throw new Error(`Path traversal blocked: ${fileName}`);
  }
  return normalized;
}

export function validateTsx(content: string, exportName: string): void {
  if (!content.trim()) {
    throw new Error("TSX content is empty");
  }
  const hasDefault = /export\s+default\b/.test(content);
  const hasNamedExport = new RegExp(
    `export\\s+(?:const|function|class)\\s+${exportName}\\b`,
  ).test(content);
  if (!hasDefault && !hasNamedExport) {
    throw new Error(
      `TSX must have a default export, or a named export matching "${exportName}"`,
    );
  }
}

function renderRegular(item: ShowcaseItem): string {
  return `  {
    name: ${JSON.stringify(item.name)},
    description: ${JSON.stringify(item.description)},
    registryName: ${JSON.stringify(item.registryName)},
    landscape: ${item.landscape},
    render: () => <${item.exportName} />,
  },`;
}

function renderSpecial(item: ShowcaseItem): string {
  return `  {
    name: ${JSON.stringify(item.name)},
    description: ${JSON.stringify(item.description)},
    registryName: ${JSON.stringify(item.registryName)},
    landscape: ${item.landscape},
    render: (isPlaying: boolean) => <${item.exportName} isPlaying={isPlaying} />,
  },`;
}

export function buildRegistrySource(manifest: Manifest): string {
  const all = [...manifest.regular, ...manifest.special];
  const seenExports = new Set<string>();
  const imports = all
    .filter((item) => {
      if (seenExports.has(item.exportName)) return false;
      seenExports.add(item.exportName);
      return true;
    })
    .map(
      (item) =>
        `import ${item.exportName} from "./${item.fileName.replace(/\.tsx$/, "")}";`,
    )
    .join("\n");

  const regular = manifest.regular.map(renderRegular).join("\n");
  const special = manifest.special.map(renderSpecial).join("\n");

  return `// AUTO-GENERATED by the studio dashboard — do not edit by hand.
import type { ReactNode } from "react";
${imports}

export type AnimationCard = {
  name: string;
  description: string;
  registryName: string;
  landscape: boolean;
};

export type AnimationItem = AnimationCard & {
  render: () => ReactNode;
};

export type SpecialEffectItem = AnimationCard & {
  render: (isPlaying: boolean) => ReactNode;
};

export const regularAnimations: AnimationItem[] = [
${regular}
];

export const specialEffects: SpecialEffectItem[] = [
${special}
];
`;
}

export async function readAsciiFile(fileName: string): Promise<string> {
  const filePath = resolveAsciiFilePath(fileName);
  return fs.readFile(filePath, "utf8");
}

export function findItem(
  manifest: Manifest,
  id: string,
): { item: ShowcaseItem; type: ShowcaseType } | null {
  const reg = manifest.regular.find((i) => i.id === id);
  if (reg) return { item: reg, type: "regular" };
  const spc = manifest.special.find((i) => i.id === id);
  if (spc) return { item: spc, type: "special" };
  return null;
}

export function isIdTaken(manifest: Manifest, id: string): boolean {
  return (
    manifest.regular.some((i) => i.id === id) ||
    manifest.special.some((i) => i.id === id)
  );
}
