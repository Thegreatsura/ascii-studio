import { NextResponse } from "next/server";
import {
  asciiDeleteChange,
  asciiWriteChange,
  findItem,
  isAuthed,
  manifestWriteChange,
  readAsciiFile,
  readManifest,
  registryWriteChange,
  validateTsx,
  type ShowcaseType,
} from "@/lib/showcase-admin";
import { applyChanges, type Change } from "@/lib/storage-adapter";

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

    const changes: Change[] = [];

    if (typeof body.tsxContent === "string" && body.tsxContent.trim()) {
      validateTsx(body.tsxContent, item.exportName);
      changes.push(asciiWriteChange(item.fileName, body.tsxContent));
    }

    if (nextType !== type) {
      manifest[type] = manifest[type].filter((i) => i.id !== id);
      manifest[nextType].push(item);
    } else {
      const idx = manifest[type].findIndex((i) => i.id === id);
      if (idx >= 0) manifest[type][idx] = item;
    }

    changes.push(manifestWriteChange(manifest));
    changes.push(registryWriteChange(manifest));

    await applyChanges(changes, `studio: update ${item.name}`);

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

    await applyChanges(
      [
        asciiDeleteChange(item.fileName),
        manifestWriteChange(manifest),
        registryWriteChange(manifest),
      ],
      `studio: delete ${item.name}`,
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
