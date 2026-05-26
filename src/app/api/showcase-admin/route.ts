import { NextResponse } from "next/server";
import {
  asciiWriteChange,
  isAuthed,
  isIdTaken,
  manifestWriteChange,
  pascalCase,
  readManifest,
  registryWriteChange,
  slugify,
  validateTsx,
  type ShowcaseItem,
  type ShowcaseType,
} from "@/lib/showcase-admin";
import { applyChanges } from "@/lib/storage-adapter";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!(await isAuthed())) return unauthorized();
  try {
    const manifest = await readManifest();
    return NextResponse.json(manifest);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

type CreateBody = {
  type: ShowcaseType;
  name: string;
  description: string;
  landscape: boolean;
  registryName?: string;
  exportName?: string;
  tsxContent: string;
};

export async function POST(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  try {
    const body = (await req.json()) as CreateBody;

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.tsxContent?.trim()) {
      return NextResponse.json(
        { error: "TSX content is required" },
        { status: 400 },
      );
    }
    if (body.type !== "regular" && body.type !== "special") {
      return NextResponse.json(
        { error: "Type must be 'regular' or 'special'" },
        { status: 400 },
      );
    }

    const id = slugify(body.name);
    if (!id) {
      return NextResponse.json(
        { error: "Name must produce a valid slug" },
        { status: 400 },
      );
    }

    const manifest = await readManifest();
    if (isIdTaken(manifest, id)) {
      return NextResponse.json(
        { error: `An item with id "${id}" already exists` },
        { status: 409 },
      );
    }

    const exportName = body.exportName?.trim() || pascalCase(body.name);
    if (!/^[A-Z][A-Za-z0-9]*$/.test(exportName)) {
      return NextResponse.json(
        { error: `Invalid exportName: ${exportName}` },
        { status: 400 },
      );
    }

    validateTsx(body.tsxContent, exportName);

    const item: ShowcaseItem = {
      id,
      name: body.name.trim(),
      description: body.description?.trim() ?? "",
      fileName: `${id}.tsx`,
      exportName,
      registryName: body.registryName?.trim() || id,
      landscape: !!body.landscape,
    };

    manifest[body.type].push(item);
    await applyChanges(
      [
        asciiWriteChange(item.fileName, body.tsxContent),
        manifestWriteChange(manifest),
        registryWriteChange(manifest),
      ],
      `studio: add ${item.name}`,
    );

    return NextResponse.json({ ok: true, item, type: body.type });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

