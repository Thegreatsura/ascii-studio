"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { Reorder, useDragControls } from "motion/react";

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

function DraggableCard({
  item,
  onEdit,
  onDelete,
  onToggleLandscape,
  onDragEnd,
}: {
  item: ShowcaseItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleLandscape: () => void;
  onDragEnd: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
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
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onEdit}
        >
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
  const [manifest, setManifest] = useState<Manifest>(EMPTY_MANIFEST);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createRegistryName, setCreateRegistryName] = useState("");
  const [createLandscape, setCreateLandscape] = useState(false);
  const [createTsx, setCreateTsx] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<ShowcaseItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRegistryName, setEditRegistryName] = useState("");
  const [editLandscape, setEditLandscape] = useState(false);
  const [editTsx, setEditTsx] = useState("");
  const [editTsxLoaded, setEditTsxLoaded] = useState(false);
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
      setManifest(data);
    } catch (err) {
      toast.error(`Failed to load: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManifest();
  }, [loadManifest]);

  const resetCreate = () => {
    setCreating(false);
    setCreateName("");
    setCreateDescription("");
    setCreateRegistryName("");
    setCreateLandscape(false);
    setCreateTsx("");
  };

  const handleCreateSubmit = async () => {
    if (!createName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!createTsx.trim()) {
      toast.error("TSX content is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/showcase-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "regular",
          name: createName,
          description: createDescription,
          landscape: createLandscape,
          registryName: createRegistryName || undefined,
          tsxContent: createTsx,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      toast.success(`Created "${data.item.name}"`);
      resetCreate();
      await loadManifest();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item: ShowcaseItem) => {
    setEditing(item);
    setEditName(item.name);
    setEditDescription(item.description);
    setEditRegistryName(item.registryName);
    setEditLandscape(item.landscape);
    setEditTsx("");
    setEditTsxLoaded(false);
    setEditLoading(false);
  };

  const loadEditTsx = async () => {
    if (!editing) return;
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

  const handleEditSubmit = async () => {
    if (!editing) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/showcase-admin/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "regular",
          name: editName,
          description: editDescription,
          landscape: editLandscape,
          registryName: editRegistryName,
          ...(editTsxLoaded ? { tsxContent: editTsx } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      toast.success(`Updated "${data.item.name}"`);
      setEditing(null);
      await loadManifest();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/showcase-admin/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      toast.success(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
      await loadManifest();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilePick =
    (onLoad: (content: string) => void) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      onLoad(text);
      e.target.value = "";
    };

  const persistOrder = async () => {
    const ids = manifest.regular.map((i) => i.id);
    try {
      const res = await fetch("/api/showcase-admin/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "regular", ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    } catch (err) {
      toast.error(`Reorder failed: ${(err as Error).message}`);
      await loadManifest();
    }
  };

  const handleReorder = (items: ShowcaseItem[]) => {
    setManifest((prev) => ({ ...prev, regular: items }));
  };

  const toggleLandscape = async (item: ShowcaseItem) => {
    const next = !item.landscape;
    setManifest((prev) => ({
      ...prev,
      regular: prev.regular.map((i) =>
        i.id === item.id ? { ...i, landscape: next } : i,
      ),
    }));
    try {
      const res = await fetch(`/api/showcase-admin/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landscape: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    } catch (err) {
      toast.error(`Update failed: ${(err as Error).message}`);
      await loadManifest();
    }
  };

  const insertTemplate = (target: "create" | "edit") => {
    if (target === "create") setCreateTsx(REGULAR_TEMPLATE);
    else setEditTsx(REGULAR_TEMPLATE);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold">
              Showcase Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage ASCII showcase items. Changes write directly to{" "}
              <code className="text-[11px] break-all">
                src/components/ascii/
              </code>{" "}
              and regenerate the registry.
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
          {manifest.regular.length} item{manifest.regular.length === 1 ? "" : "s"}
        </p>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && manifest.regular.length === 0 && (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        )}

        <Reorder.Group
          axis="y"
          values={manifest.regular}
          onReorder={handleReorder}
          as="div"
          className="grid gap-2 grid-cols-1 sm:grid-cols-2"
        >
          {manifest.regular.map((item) => (
            <DraggableCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteTarget(item)}
              onToggleLandscape={() => toggleLandscape(item)}
              onDragEnd={persistOrder}
            />
          ))}
        </Reorder.Group>
      </div>

      <Dialog
        open={creating}
        onOpenChange={(open) => !open && resetCreate()}
      >
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New showcase item</DialogTitle>
            <DialogDescription>
              Upload or paste a self-contained TSX component. It will be written
              to <code>src/components/ascii/</code> and added to the showcase.
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
                  <input
                    ref={createFileInputRef}
                    type="file"
                    accept=".tsx,.jsx,.ts,.js,.txt"
                    className="hidden"
                    onChange={handleFilePick(setCreateTsx)}
                  />
                </div>
              </div>
              <Textarea
                id="create-tsx"
                value={createTsx}
                onChange={(e) => setCreateTsx(e.target.value)}
                placeholder="Paste your TSX component here…"
                className="font-mono text-xs h-72"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCreate}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubmit} disabled={submitting}>
              {submitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
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
                    onChange={handleFilePick(setEditTsx)}
                  />
                </div>
              </div>
              {editTsxLoaded ? (
                <Textarea
                  id="edit-tsx"
                  value={editTsx}
                  onChange={(e) => setEditTsx(e.target.value)}
                  className="font-mono text-xs h-72"
                />
              ) : (
                <div className="border rounded-md p-6 flex flex-col items-center justify-center gap-2 bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground">
                    Code is hidden by default to keep the dialog fast. These
                    files can be very large.
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
            <Button
              onClick={handleEditSubmit}
              disabled={submitting || editLoading}
            >
              {submitting ? "Saving…" : "Save"}
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
              This will remove <code>{deleteTarget?.fileName}</code> from{" "}
              <code>src/components/ascii/</code> and drop it from the showcase.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting}>
              {submitting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
