import { NextResponse } from "next/server";
import {
  isAuthed,
  manifestWriteChange,
  readManifest,
  registryWriteChange,
  type ShowcaseType,
} from "@/lib/showcase-admin";
import { applyChanges } from "@/lib/storage-adapter";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

type ReorderBody = {
  type: ShowcaseType;
  ids: string[];
};

export async function POST(req: Request) {
  if (!(await isAuthed())) return unauthorized();
  try {
    const body = (await req.json()) as ReorderBody;
    if (body.type !== "regular" && body.type !== "special") {
      return NextResponse.json(
        { error: "Type must be 'regular' or 'special'" },
        { status: 400 },
      );
    }
    if (!Array.isArray(body.ids)) {
      return NextResponse.json(
        { error: "ids must be an array" },
        { status: 400 },
      );
    }

    const manifest = await readManifest();
    const current = manifest[body.type];

    if (body.ids.length !== current.length) {
      return NextResponse.json(
        { error: "ids length does not match current items" },
        { status: 400 },
      );
    }
    const byId = new Map(current.map((i) => [i.id, i]));
    const reordered = body.ids.map((id) => byId.get(id));
    if (reordered.some((i) => !i)) {
      return NextResponse.json(
        { error: "ids contain unknown values" },
        { status: 400 },
      );
    }

    manifest[body.type] = reordered as typeof current;
    await applyChanges(
      [manifestWriteChange(manifest), registryWriteChange(manifest)],
      `studio: reorder ${body.type}`,
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
