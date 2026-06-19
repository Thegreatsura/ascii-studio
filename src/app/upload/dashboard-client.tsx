"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  Pencil,
  Plus,
  Upload,
  Code,
  GripVertical,
  Maximize2,
  Minimize2,
  Check,
  CloudUpload,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { slugify, pascalCase } from "@/lib/slug";

const VERCEL_PROJECT_URL =
  "https://vercel.com/vansh-nagars-projects-657b6c87/ascii-studio";

type ShowcaseItem = {
  id: string;
  name: string;
  description: string;
  fileName: string;
  exportName: string;
  registryName: string;
  landscape: boolean;
};

type Manifest = {
  regular: ShowcaseItem[];
  special: ShowcaseItem[];
};

const EMPTY_MANIFEST: Manifest = { regular: [], special: [] };

const REGULAR_TEMPLATE = `"use client";

export default function MyAnimation() {
  return <pre className="text-xs">HELLO ASCII</pre>;
}
`;

type PushStatus = "idle" | "pushing" | "success" | "error";

function manifestsEqual(a: Manifest, b: Manifest): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function DraggableCard({
  item,
  onEdit,
  onDelete,
  onToggleLandscape,
}: {
  item: ShowcaseItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleLandscape: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      as="div"
      className={`flex flex-col gap-3 border rounded-lg p-3 bg-card touch-none ${
        item.landscape ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className="shrink-0 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing mt-0.5"
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm break-all">{item.name}</p>
            {item.landscape && (
              <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">
                landscape
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {item.description || <em>no description</em>}
          </p>
          <p className="text-[11px] text-muted-foreground/80 mt-1 font-mono break-all">
            {item.fileName} · {item.exportName} · r/{item.registryName}
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onToggleLandscape}
          title={item.landscape ? "Shrink to 1 column" : "Expand to 2 columns"}
        >
          {item.landscape ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
          {item.landscape ? "Shrink" : "Expand"}
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </div>
    </Reorder.Item>
  );
}

export default function DashboardClient() {
  const [baseManifest, setBaseManifest] = useState<Manifest>(EMPTY_MANIFEST);
  const [draftManifest, setDraftManifest] = useState<Manifest>(EMPTY_MANIFEST);
  // staged file content changes, keyed by fileName
  const [pendingWrites, setPendingWrites] = useState<Record<string, string>>(
    {},
  );
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");
  const [pushError, setPushError] = useState<string | null>(null);

  // create dialog state
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createRegistryName, setCreateRegistryName] = useState("");
  const [createLandscape, setCreateLandscape] = useState(false);
  const [createTsx, setCreateTsx] = useState("");
  const [createTsxVisible, setCreateTsxVisible] = useState(false);
  const [createUploadedName, setCreateUploadedName] = useState<string | null>(
    null,
  );

  // edit dialog state
  const [editing, setEditing] = useState<ShowcaseItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRegistryName, setEditRegistryName] = useState("");
  const [editLandscape, setEditLandscape] = useState(false);
  const [editTsx, setEditTsx] = useState("");
  const [editTsxLoaded, setEditTsxLoaded] = useState(false);
  const [editTsxDirty, setEditTsxDirty] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ShowcaseItem | null>(null);

  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const loadManifest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/showcase-admin", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Manifest;
      setBaseManifest(data);
      setDraftManifest(data);
      setPendingWrites({});
      setPendingDeletes([]);
    } catch (err) {
      toast.error(`Failed to load: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManifest();
  }, [loadManifest]);

  const hasChanges = useMemo(() => {
    if (Object.keys(pendingWrites).length > 0) return true;
    if (pendingDeletes.length > 0) return true;
    return !manifestsEqual(baseManifest, draftManifest);
  }, [baseManifest, draftManifest, pendingWrites, pendingDeletes]);

  const pendingSummary = useMemo(() => {
    const added = draftManifest.regular.filter(
      (i) => !baseManifest.regular.find((b) => b.id === i.id),
    ).length;
    const removed = pendingDeletes.length;
    const baseIds = new Set(baseManifest.regular.map((i) => i.id));
    const draftIds = new Set(draftManifest.regular.map((i) => i.id));
    const stillPresent = [...draftIds].filter((id) => baseIds.has(id));
    let modified = 0;
    for (const id of stillPresent) {
      const a = baseManifest.regular.find((i) => i.id === id);
      const b = draftManifest.regular.find((i) => i.id === id);
      if (JSON.stringify(a) !== JSON.stringify(b)) modified++;
    }
    const orderChanged =
      [...baseManifest.regular]
        .filter((i) => draftIds.has(i.id))
        .map((i) => i.id)
        .join("|") !==
      [...draftManifest.regular]
        .filter((i) => baseIds.has(i.id))
        .map((i) => i.id)
        .join("|");
    const fileEdits = Object.keys(pendingWrites).filter(
      (fn) => !draftManifest.regular.find((i) => i.fileName === fn && added),
    ).length;
    return { added, removed, modified, orderChanged, fileEdits };
  }, [baseManifest, draftManifest, pendingDeletes, pendingWrites]);

  // beforeunload guard
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const resetCreate = () => {
    setCreating(false);
    setCreateName("");
    setCreateDescription("");
    setCreateRegistryName("");
    setCreateLandscape(false);
    setCreateTsx("");
    setCreateTsxVisible(false);
    setCreateUploadedName(null);
  };

  const handleCreateSubmit = () => {
    if (!createName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!createTsx.trim()) {
      toast.error("TSX content is required");
      return;
    }
    const id = slugify(createName);
    if (!id) {
      toast.error("Name must produce a valid slug");
      return;
    }
    const allIds = [
      ...draftManifest.regular,
      ...draftManifest.special,
    ].map((i) => i.id);
    if (allIds.includes(id)) {
      toast.error(`An item with id "${id}" already exists`);
      return;
    }
    const exportName = pascalCase(createName);
    const fileName = `${id}.tsx`;
    const item: ShowcaseItem = {
      id,
      name: createName.trim(),
      description: createDescription.trim(),
      fileName,
      exportName,
      registryName: createRegistryName.trim() || id,
      landscape: createLandscape,
    };
    setDraftManifest((m) => ({ ...m, regular: [...m.regular, item] }));
    setPendingWrites((w) => ({ ...w, [fileName]: createTsx }));
    setPendingDeletes((d) => d.filter((fn) => fn !== fileName));
    toast.success(`Staged "${item.name}" — push to publish`);
    resetCreate();
  };

  const openEdit = (item: ShowcaseItem) => {
    setEditing(item);
    setEditName(item.name);
    setEditDescription(item.description);
    setEditRegistryName(item.registryName);
    setEditLandscape(item.landscape);
    setEditTsx(pendingWrites[item.fileName] ?? "");
    setEditTsxLoaded(!!pendingWrites[item.fileName]);
    setEditTsxDirty(false);
    setEditLoading(false);
  };

  const loadEditTsx = async () => {
    if (!editing) return;
    if (pendingWrites[editing.fileName]) {
      setEditTsx(pendingWrites[editing.fileName]);
      setEditTsxLoaded(true);
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(`/api/showcase-admin/${editing.id}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setEditTsx(data.tsxContent ?? "");
      setEditTsxLoaded(true);
    } catch (err) {
      toast.error(`Failed to load TSX: ${(err as Error).message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditSubmit = () => {
    if (!editing) return;
    setDraftManifest((m) => ({
      ...m,
      regular: m.regular.map((i) =>
        i.id === editing.id
          ? {
              ...i,
              name: editName.trim() || i.name,
              description: editDescription.trim(),
              registryName: editRegistryName.trim() || i.registryName,
              landscape: editLandscape,
            }
          : i,
      ),
    }));
    if (editTsxDirty) {
      setPendingWrites((w) => ({ ...w, [editing.fileName]: editTsx }));
    }
    toast.success(`Staged edits to "${editName || editing.name}"`);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fileName = deleteTarget.fileName;
    const id = deleteTarget.id;
    // If the item was only ever staged (never on base), just drop everything.
    const onBase = baseManifest.regular.find((i) => i.id === id);
    setDraftManifest((m) => ({
      ...m,
      regular: m.regular.filter((i) => i.id !== id),
    }));
    setPendingWrites((w) => {
      const next = { ...w };
      delete next[fileName];
      return next;
    });
    if (onBase) {
      setPendingDeletes((d) =>
        d.includes(fileName) ? d : [...d, fileName],
      );
    }
    toast.success(`Staged delete for "${deleteTarget.name}"`);
    setDeleteTarget(null);
  };

  const toggleLandscape = (item: ShowcaseItem) => {
    setDraftManifest((m) => ({
      ...m,
      regular: m.regular.map((i) =>
        i.id === item.id ? { ...i, landscape: !i.landscape } : i,
      ),
    }));
  };

  const handleReorder = (items: ShowcaseItem[]) => {
    setDraftManifest((m) => ({ ...m, regular: items }));
  };

  const insertTemplate = (target: "create" | "edit") => {
    if (target === "create") {
      setCreateTsx(REGULAR_TEMPLATE);
    } else {
      setEditTsx(REGULAR_TEMPLATE);
      setEditTsxDirty(true);
    }
  };

  const handlePush = async () => {
    if (!hasChanges) return;
    setPushStatus("pushing");
    setPushError(null);
    try {
      const res = await fetch("/api/showcase-admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manifest: draftManifest,
          fileWrites: Object.entries(pendingWrites).map(([fileName, content]) => ({
            fileName,
            content,
          })),
          fileDeletes: pendingDeletes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPushStatus("success");
      setBaseManifest(draftManifest);
      setPendingWrites({});
      setPendingDeletes([]);
      toast.success("Pushed to GitHub — Vercel is deploying");
    } catch (err) {
      setPushStatus("error");
      setPushError((err as Error).message);
      toast.error(`Push failed: ${(err as Error).message}`);
    }
  };

  const discardChanges = () => {
    setDraftManifest(baseManifest);
    setPendingWrites({});
    setPendingDeletes([]);
    toast.success("Discarded local changes");
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <Toaster richColors position="top-center" />
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Showcase Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Stage changes locally, then push to GitHub as one commit.
            </p>
          </div>
          <Button
            className="self-start sm:self-auto"
            onClick={() => setCreating(true)}
          >
            <Plus className="size-4" />
            New item
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          {draftManifest.regular.length} item
          {draftManifest.regular.length === 1 ? "" : "s"}
        </p>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && draftManifest.regular.length === 0 && (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        )}

        <Reorder.Group
          axis="y"
          values={draftManifest.regular}
          onReorder={handleReorder}
          as="div"
          className="grid gap-2 grid-cols-1 sm:grid-cols-2"
        >
          {draftManifest.regular.map((item) => (
            <DraggableCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteTarget(item)}
              onToggleLandscape={() => toggleLandscape(item)}
            />
          ))}
        </Reorder.Group>
      </div>

      <PushBar
        hasChanges={hasChanges}
        summary={pendingSummary}
        status={pushStatus}
        error={pushError}
        onPush={handlePush}
        onDiscard={discardChanges}
        onResetStatus={() => setPushStatus("idle")}
      />

      <Dialog open={creating} onOpenChange={(open) => !open && resetCreate()}>
        <DialogContent className="sm:max-w-3xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle>New showcase item</DialogTitle>
            <DialogDescription>
              Upload or paste a self-contained TSX component. The item is
              staged locally until you press <strong>Push to GitHub</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="My Animation"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="What does this animation do?"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
              <div className="grid gap-1.5">
                <Label htmlFor="create-registry">
                  Registry name{" "}
                  <span className="text-muted-foreground font-normal">
                    (defaults to slug)
                  </span>
                </Label>
                <Input
                  id="create-registry"
                  value={createRegistryName}
                  onChange={(e) => setCreateRegistryName(e.target.value)}
                  placeholder="my-animation"
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="create-landscape"
                  checked={createLandscape}
                  onCheckedChange={setCreateLandscape}
                />
                <Label htmlFor="create-landscape">Landscape (2-col span)</Label>
              </div>
            </div>

            <div className="grid gap-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Label htmlFor="create-tsx">TSX content</Label>
                {createTsxVisible && !createUploadedName && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => insertTemplate("create")}
                    >
                      Insert template
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => createFileInputRef.current?.click()}
                    >
                      <Upload className="size-3.5" />
                      Upload .tsx
                    </Button>
                  </div>
                )}
                <input
                  ref={createFileInputRef}
                  type="file"
                  accept=".tsx,.jsx,.ts,.js,.txt"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    setCreateTsx(text);
                    setCreateUploadedName(file.name);
                    setCreateTsxVisible(false);
                    e.target.value = "";
                  }}
                />
              </div>
              {createUploadedName ? (
                <div className="border rounded-md p-4 flex items-center justify-between gap-3 bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <Check className="size-4 text-green-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {createUploadedName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded · {(createTsx.length / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => createFileInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCreateTsx("");
                        setCreateUploadedName(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ) : createTsxVisible ? (
                <Textarea
                  id="create-tsx"
                  value={createTsx}
                  onChange={(e) => setCreateTsx(e.target.value)}
                  placeholder="Paste your TSX component here…"
                  className="font-mono text-xs h-72"
                  autoFocus
                />
              ) : (
                <div className="border rounded-md p-6 flex flex-col items-center justify-center gap-3 bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground">
                    Add your component code — paste it, use a template, or upload a .tsx file.
                  </p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={() => setCreateTsxVisible(true)}
                    >
                      <Code className="size-3.5" />
                      Paste code
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        insertTemplate("create");
                        setCreateTsxVisible(true);
                      }}
                    >
                      Insert template
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => createFileInputRef.current?.click()}
                    >
                      <Upload className="size-3.5" />
                      Upload .tsx
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCreate}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit}>Add to staging</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="sm:max-w-3xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
            <DialogDescription>
              File: <code>{editing?.fileName}</code> · Export:{" "}
              <code>{editing?.exportName}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-registry">Registry name</Label>
                <Input
                  id="edit-registry"
                  value={editRegistryName}
                  onChange={(e) => setEditRegistryName(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="edit-landscape"
                  checked={editLandscape}
                  onCheckedChange={setEditLandscape}
                />
                <Label htmlFor="edit-landscape">Landscape</Label>
              </div>
            </div>

            <div className="grid gap-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Label htmlFor="edit-tsx">TSX content</Label>
                <div className="flex gap-2 flex-wrap">
                  {editTsxLoaded && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => insertTemplate("edit")}
                    >
                      Insert template
                    </Button>
                  )}
                  {editTsxLoaded && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      <Upload className="size-3.5" />
                      Upload .tsx
                    </Button>
                  )}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept=".tsx,.jsx,.ts,.js,.txt"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const text = await file.text();
                      setEditTsx(text);
                      setEditTsxLoaded(true);
                      setEditTsxDirty(true);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
              {editTsxLoaded ? (
                <Textarea
                  id="edit-tsx"
                  value={editTsx}
                  onChange={(e) => {
                    setEditTsx(e.target.value);
                    setEditTsxDirty(true);
                  }}
                  className="font-mono text-xs h-72"
                />
              ) : (
                <div className="border rounded-md p-6 flex flex-col items-center justify-center gap-2 bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground">
                    Code is hidden by default. Load it to view or edit.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={loadEditTsx}
                    disabled={editLoading}
                  >
                    <Code className="size-3.5" />
                    {editLoading ? "Loading…" : "Show code"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={editLoading}>
              Stage changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The item will be removed from staging. On the next push,{" "}
              <code>{deleteTarget?.fileName}</code> is deleted from the repo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PushBar({
  hasChanges,
  summary,
  status,
  error,
  onPush,
  onDiscard,
  onResetStatus,
}: {
  hasChanges: boolean;
  summary: {
    added: number;
    removed: number;
    modified: number;
    orderChanged: boolean;
    fileEdits: number;
  };
  status: PushStatus;
  error: string | null;
  onPush: () => void;
  onDiscard: () => void;
  onResetStatus: () => void;
}) {
  const parts: string[] = [];
  if (summary.added) parts.push(`${summary.added} added`);
  if (summary.removed) parts.push(`${summary.removed} removed`);
  if (summary.modified) parts.push(`${summary.modified} modified`);
  if (summary.fileEdits) parts.push(`${summary.fileEdits} code edits`);
  if (summary.orderChanged) parts.push("reordered");
  const summaryText = parts.length ? parts.join(" · ") : "No pending changes";

  if (status === "success") {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] sm:w-auto max-w-2xl">
        <div className="border rounded-xl bg-card shadow-lg p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Check className="size-5 text-green-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Pushed to GitHub</p>
              <p className="text-xs text-muted-foreground">
                Vercel is deploying — usually ready in ~30s.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button asChild size="sm" variant="default">
              <a
                href={VERCEL_PROJECT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5" />
                View deploy
              </a>
            </Button>
            <Button size="sm" variant="outline" onClick={onResetStatus}>
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasChanges && status !== "error") return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] sm:w-auto max-w-2xl">
      <div className="border rounded-xl bg-card shadow-lg p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{summaryText}</p>
          {status === "error" && error && (
            <p className="text-xs text-destructive mt-0.5 break-all">
              {error}
            </p>
          )}
          {status !== "error" && (
            <p className="text-xs text-muted-foreground">
              Nothing is live until you push.
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onDiscard}
            disabled={status === "pushing" || !hasChanges}
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={onPush}
            disabled={status === "pushing" || !hasChanges}
          >
            {status === "pushing" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <CloudUpload className="size-3.5" />
                Push to GitHub
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
