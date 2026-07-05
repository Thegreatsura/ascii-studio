import { promises as fs } from "node:fs";
import path from "node:path";

export type Change =
  | { op: "write"; path: string; content: string }
  | { op: "delete"; path: string };

export type Adapter = "filesystem" | "github";

export function getAdapter(): Adapter {
  const hasGithubCreds =
    !!process.env.GITHUB_TOKEN &&
    !!process.env.GITHUB_OWNER &&
    !!process.env.GITHUB_REPO;
  if (!hasGithubCreds) return "filesystem";

  // Use GitHub only on Vercel (read-only FS) or when explicitly opted in.
  // Otherwise local dev would commit to GitHub on every save.
  const onVercel = !!process.env.VERCEL;
  const optIn = process.env.USE_GITHUB_STORAGE === "1";
  return onVercel || optIn ? "github" : "filesystem";
}

export async function applyChanges(changes: Change[], message: string): Promise<void> {
  if (changes.length === 0) return;
  const adapter = getAdapter();
  if (adapter === "github") {
    await applyChangesGitHub(changes, message);
  } else {
    await applyChangesFilesystem(changes);
  }
}

async function applyChangesFilesystem(changes: Change[]): Promise<void> {
  const root = process.cwd();
  for (const c of changes) {
    const absolute = path.join(root, c.path);
    if (c.op === "write") {
      await fs.writeFile(absolute, c.content, "utf8");
    } else {
      try {
        await fs.unlink(absolute);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") throw err;
      }
    }
  }
}

type GitHubFetchInit = {
  method?: string;
  body?: unknown;
};

async function gh<T = unknown>(
  pathSegment: string,
  init: GitHubFetchInit = {},
): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) {
    throw new Error("GitHub adapter requires GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO");
  }
  const url = `https://api.github.com/repos/${owner}/${repo}${pathSegment}`;
  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${init.method ?? "GET"} ${pathSegment} → ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

async function applyChangesGitHub(changes: Change[], message: string): Promise<void> {
  const branch = process.env.GITHUB_BRANCH || "main";

  // 1. Get the ref → base commit SHA
  const ref = await gh<{ object: { sha: string } }>(
    `/git/refs/heads/${branch}`,
  );
  const baseCommitSha = ref.object.sha;

  // 2. Get the base commit → base tree SHA
  const baseCommit = await gh<{ tree: { sha: string } }>(
    `/git/commits/${baseCommitSha}`,
  );
  const baseTreeSha = baseCommit.tree.sha;

  // 3. Create blobs for each write
  type TreeEntry = {
    path: string;
    mode: "100644";
    type: "blob";
    sha: string | null;
  };
  const treeEntries: TreeEntry[] = [];
  for (const c of changes) {
    if (c.op === "write") {
      const blob = await gh<{ sha: string }>("/git/blobs", {
        method: "POST",
        body: {
          content: Buffer.from(c.content, "utf8").toString("base64"),
          encoding: "base64",
        },
      });
      treeEntries.push({
        path: c.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      });
    } else {
      treeEntries.push({
        path: c.path,
        mode: "100644",
        type: "blob",
        sha: null,
      });
    }
  }

  // 4. Create a new tree based on the base tree
  const newTree = await gh<{ sha: string }>("/git/trees", {
    method: "POST",
    body: {
      base_tree: baseTreeSha,
      tree: treeEntries,
    },
  });

  // 5. Create a new commit pointing to the new tree
  const newCommit = await gh<{ sha: string }>("/git/commits", {
    method: "POST",
    body: {
      message,
      tree: newTree.sha,
      parents: [baseCommitSha],
    },
  });

  // 6. Move the branch ref to the new commit
  await gh(`/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: { sha: newCommit.sha },
  });
}
