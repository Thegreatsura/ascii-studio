import { NextResponse } from "next/server";
import {
  asciiDeleteChange,
  asciiWriteChange,
  isAuthed,
  manifestWriteChange,
  pascalCase,
  registryWriteChange,
  slugify,
  unauthorized,
  validateTsx,
  type Manifest,
  type ShowcaseItem,
} from "@/lib/showcase-admin";
import { applyChanges, type Change } from "@/lib/storage-adapter";

export const runtime = "nodejs";

type PushBody = {
  manifest: Manifest;
  fileWrites: { fileName: string; content: string }[];
  fileDeletes: string[];
};

function validateItem(item: ShowcaseItem): string | null {
  if (!item.id?.trim()) return "Item has empty id";
  if (item.id !== slugify(item.id)) {
    return `Invalid item id "${item.id}" — must be lowercase kebab-case`;
  }
  if (!item.name?.trim()) return `Item "${item.id}" has empty name`;
  if (!/^[a-z0-9-]+\.tsx$/i.test(item.fileName)) {
    return `Item "${item.id}" has invalid fileName "${item.fileName}"`;
  }
  if (!/^[A-Z][A-Za-z0-9]*$/.test(item.exportName || pascalCase(item.name))) {
    return `Item "${item.id}" has invalid exportName "${item.exportName}"`;
  }
  return null;
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  try {
    const body = (await req.json()) as PushBody;

    if (!body.manifest || !Array.isArray(body.manifest.regular)) {
      return NextResponse.json(
        { error: "Body must include manifest with regular[]" },
        { status: 400 },
      );
    }
    if (!Array.isArray(body.fileWrites) || !Array.isArray(body.fileDeletes)) {
      return NextResponse.json(
        { error: "Body must include fileWrites[] and fileDeletes[]" },
        { status: 400 },
      );
    }

    const manifest: Manifest = {
      regular: body.manifest.regular,
      special: body.manifest.special ?? [],
    };

    const seenIds = new Set<string>();
    for (const item of [...manifest.regular, ...manifest.special]) {
      const err = validateItem(item);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      if (seenIds.has(item.id)) {
        return NextResponse.json(
          { error: `Duplicate id "${item.id}"` },
          { status: 400 },
        );
      }
      seenIds.add(item.id);
    }

    for (const w of body.fileWrites) {
      if (!/^[a-z0-9-]+\.tsx$/i.test(w.fileName)) {
        return NextResponse.json(
          { error: `Invalid fileName in fileWrites: ${w.fileName}` },
          { status: 400 },
        );
      }
      const owner = [...manifest.regular, ...manifest.special].find(
        (i) => i.fileName === w.fileName,
      );
      if (owner) {
        validateTsx(w.content, owner.exportName);
      } else if (!w.content?.trim()) {
        return NextResponse.json(
          { error: `Empty content for ${w.fileName}` },
          { status: 400 },
        );
      }
    }
    for (const d of body.fileDeletes) {
      if (!/^[a-z0-9-]+\.tsx$/i.test(d)) {
        return NextResponse.json(
          { error: `Invalid fileName in fileDeletes: ${d}` },
          { status: 400 },
        );
      }
    }

    const changes: Change[] = [];
    for (const w of body.fileWrites) {
      changes.push(asciiWriteChange(w.fileName, w.content));
    }
    for (const d of body.fileDeletes) {
      changes.push(asciiDeleteChange(d));
    }
    changes.push(manifestWriteChange(manifest));
    changes.push(registryWriteChange(manifest));

    if (changes.length === 2) {
      // only manifest+registry, nothing else
      return NextResponse.json({ ok: true, noop: true });
    }

    await applyChanges(changes, "studio: dashboard push");

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
