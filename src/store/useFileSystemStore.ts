import { create } from "zustand";
import type { FSTree } from "../lib/filesystem";
import { defaultFS, parentOf, joinPath, TRASH } from "../lib/filesystem";
import { saveLS, loadLS } from "../lib/persistence";

interface FSState {
  tree: FSTree;
  list: (path: string) => string[];
  get: (path: string) => FSTree[string] | undefined;
  writeFile: (path: string, content: string) => void;
  mkdir: (path: string) => void;
  createFile: (dir: string, name: string) => string | null;
  rename: (path: string, newName: string) => void;
  remove: (path: string) => void;
  restore: (path: string) => void;
  emptyTrash: () => void;
  exists: (path: string) => boolean;
}

const loaded = loadLS<FSTree>("os.fs", defaultFS());

export const useFS = create<FSState>((set, get) => ({
  tree: loaded,
  list: (path) => {
    const node = get().tree[path];
    if (!node || node.type !== "folder" || !node.children) return [];
    return Object.values(node.children).sort((a, b) => {
      const ta = get().tree[a]?.type, tb = get().tree[b]?.type;
      if (ta !== tb) return ta === "folder" ? -1 : 1;
      return a.localeCompare(b);
    });
  },
  get: (path) => get().tree[path],
  exists: (path) => !!get().tree[path],
  writeFile: (path, content) =>
    set((s) => {
      const node = s.tree[path];
      if (!node) return s;
      const tree = { ...s.tree, [path]: { ...node, content } };
      saveLS("os.fs", tree);
      return { tree };
    }),
  mkdir: (path) =>
    set((s) => {
      if (s.tree[path]) return s;
      const parent = parentOf(path);
      const name = path.split("/").pop()!;
      const tree = { ...s.tree };
      tree[path] = { name, type: "folder", children: {} };
      if (tree[parent]) {
        tree[parent] = { ...tree[parent], children: { ...(tree[parent].children || {}), [name]: path } };
      }
      saveLS("os.fs", tree);
      return { tree };
    }),
  createFile: (dir, name) => {
    const path = joinPath(dir, name);
    if (get().exists(path)) return null;
    get().mkdir(dir);
    set((s) => {
      const tree = { ...s.tree };
      tree[path] = { name, type: "file", content: "" };
      tree[dir] = { ...tree[dir], children: { ...(tree[dir]?.children || {}), [name]: path } };
      saveLS("os.fs", tree);
      return { tree };
    });
    return path;
  },
  rename: (path, newName) =>
    set((s) => {
      const node = s.tree[path];
      if (!node) return s;
      const parent = parentOf(path);
      const np = joinPath(parent, newName);
      const tree: FSTree = {};
      const subtree: FSTree = {};
      for (const [k, v] of Object.entries(s.tree)) {
        if (k === path || k.startsWith(path + "/")) {
          const nk = np + k.slice(path.length);
          subtree[nk] = { ...v, name: nk.split("/").pop()! };
          if (k === path && v.type === "folder") subtree[nk].children = v.children;
        } else tree[k] = v;
      }
      // rewrite moved subtree + fix parent link
      for (const [k, v] of Object.entries(subtree)) {
        if (v.type === "folder" && v.children) {
          const nc: Record<string, string> = {};
          for (const [cn, cp] of Object.entries(v.children)) nc[cn] = np + cp.slice(path.length);
          subtree[k] = { ...v, children: nc };
        }
      }
      const merged = { ...tree, ...subtree };
      if (merged[parent]?.children) {
        const nc: Record<string, string> = {};
        for (const [cn, cp] of Object.entries(merged[parent].children!)) nc[cn === node.name ? newName : cn] = cp === path ? np : cp;
        merged[parent] = { ...merged[parent], children: nc };
      }
      saveLS("os.fs", merged);
      return { tree: merged };
    }),
  remove: (path) =>
    set((s) => {
      const node = s.tree[path];
      if (!node) return s;
      const parent = parentOf(path);
      const target = joinPath(TRASH, node.name);
      const tree: FSTree = {};
      const moved: FSTree = {};
      for (const [k, v] of Object.entries(s.tree)) {
        if (k === path || k.startsWith(path + "/")) moved[target + k.slice(path.length)] = { ...v, name: (target + k.slice(path.length)).split("/").pop()! };
        else tree[k] = v;
      }
      // fix moved subtree child links
      for (const [k, v] of Object.entries(moved)) {
        if (v.type === "folder" && v.children) {
          const nc: Record<string, string> = {};
          for (const [cn, cp] of Object.entries(v.children)) nc[cn] = target + cp.slice(path.length);
          moved[k] = { ...v, children: nc };
        }
      }
      const merged = { ...tree, ...moved };
      merged[target] = { ...merged[target], ...(merged[target].type === "file" ? { content: "ORIG:" + path } : {}) };
      if (merged[parent]?.children) {
        const nc = { ...merged[parent].children! };
        delete nc[node.name];
        merged[parent] = { ...merged[parent], children: nc };
      }
      // ensure trash knows
      merged[TRASH] = { ...merged[TRASH], children: { ...(merged[TRASH]?.children || {}), [node.name]: target } };
      saveLS("os.fs", merged);
      return { tree: merged };
    }),
  restore: (path) =>
    set((s) => {
      const node = s.tree[path];
      if (!node) return s;
      const orig = node.content?.startsWith("ORIG:") ? node.content.slice(5) : null;
      if (!orig) return s;
      const parent = parentOf(orig);
      const tree = { ...s.tree };
      const moved: FSTree = {};
      for (const [k, v] of Object.entries(s.tree)) {
        if (k === path || k.startsWith(path + "/")) {
          const nk = orig + k.slice(path.length);
          moved[nk] = { ...v, name: nk.split("/").pop()! };
          if (k === path && moved[nk].content?.startsWith("ORIG:")) delete moved[nk].content;
          if (moved[nk].type === "folder" && v.children) {
            const nc: Record<string, string> = {};
            for (const [cn, cp] of Object.entries(v.children)) nc[cn] = orig + cp.slice(path.length);
            moved[nk] = { ...moved[nk], children: nc };
          }
        } else if (!k.startsWith(path)) tree[k] = v;
      }
      const merged = { ...tree, ...moved };
      if (!merged[parent]) merged[parent] = { name: parent.split("/").pop()!, type: "folder", children: {} };
      merged[parent] = { ...merged[parent], children: { ...(merged[parent].children || {}), [node.name]: orig } };
      const tc = { ...(merged[TRASH]?.children || {}) };
      delete tc[node.name];
      merged[TRASH] = { ...merged[TRASH], children: tc };
      saveLS("os.fs", merged);
      return { tree: merged };
    }),
  emptyTrash: () =>
    set((s) => {
      const tree: FSTree = { ...s.tree };
      for (const k of Object.keys(tree)) if (k.startsWith(TRASH + "/")) delete tree[k];
      tree[TRASH] = { name: ".trash", type: "folder", children: {} };
      saveLS("os.fs", tree);
      return { tree };
    }),
}));
