import { create } from "zustand";
import { APPS } from "../../registry/appRegistry";
import { openApp } from "../../system/DesktopIcons";

interface DragState { path: string | null; set: (p: string | null) => void }
export const useFileDrag = create<DragState>((set) => ({ path: null, set: (path) => set({ path }) }));

const EXTS: Record<string, string> = {
  editor: "md txt log json csv sh",
  code: "js ts jsx tsx py rs c cpp css html",
  image: "png jpg jpeg gif webp svg",
  document: "pdf",
  browser: "html url",
  music: "mp3 wav ogg",
};
export function compatible(appId: string, path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return !!EXTS[appId]?.split(" ").includes(ext);
}
export function dropOnApp(appId: string, path: string): boolean {
  if (!compatible(appId, path)) return false;
  const name = path.split("/").pop()!;
  openApp(appId, { path }, name);
  return true;
}
export const APPS_FOR_FILE = (path: string) => APPS.filter((a) => compatible(a.id, path));
