import { NextResponse } from "next/server";
import {
  deleteAsciiFile,
  findItem,
  isAuthed,
  readAsciiFile,
  readManifest,
  regenerateRegistry,
  validateTsx,
  writeAsciiFile,
  writeManifest,
  type ShowcaseType,
} from "@/lib/showcase-admin";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  if (!(await isAuthed())) return unauthorized();
  try {
    const { id } = await ctx.params;
    const manifest = await readManifest();
    const found = findItem(manifest, id);
    if (!found) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const tsxContent = await readAsciiFile(found.item.fileName);
    return NextResponse.json({
      item: found.item,
      type: found.type,
      tsxContent,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

type UpdateBody = {
  name?: string;
  description?: string;
  landscape?: boolean;
  registryName?: string;
  tsxContent?: string;
  type?: ShowcaseType;
};

export async function PUT(req: Request, ctx: RouteContext) {
  if (!(await isAuthed())) return unauthorized();
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as UpdateBody;

    const manifest = await readManifest();
    const found = findItem(manifest, id);
    if (!found) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { item, type } = found;
    const nextType: ShowcaseType = body.type ?? type;

    if (typeof body.name === "string" && body.name.trim()) {
      item.name = body.name.trim();
    }
    if (typeof body.description === "string") {
      item.description = body.description.trim();
    }
    if (typeof body.landscape === "boolean") {
      item.landscape = body.landscape;
    }
    if (typeof body.registryName === "string" && body.registryName.trim()) {
      item.registryName = body.registryName.trim();
    }

    if (typeof body.tsxContent === "string" && body.tsxContent.trim()) {
      validateTsx(body.tsxContent, item.exportName);
      await writeAsciiFile(item.fileName, body.tsxContent);
    }

    if (nextType !== type) {
      manifest[type] = manifest[type].filter((i) => i.id !== id);
      manifest[nextType].push(item);
    } else {
      const idx = manifest[type].findIndex((i) => i.id === id);
      if (idx >= 0) manifest[type][idx] = item;
    }

    await writeManifest(manifest);
    await regenerateRegistry(manifest);

    return NextResponse.json({ ok: true, item, type: nextType });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  if (!(await isAuthed())) return unauthorized();
  try {
    const { id } = await ctx.params;
    const manifest = await readManifest();
    const found = findItem(manifest, id);
    if (!found) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { item, type } = found;

    manifest[type] = manifest[type].filter((i) => i.id !== id);
    await writeManifest(manifest);
    await regenerateRegistry(manifest);

    try {
      await deleteAsciiFile(item.fileName);
    } catch {
      // file may already be gone; ignore
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
