// apt-style package manager over the app registry. Installed set persisted.
import { APPS } from "../../registry/appRegistry";
import { loadLS, saveLS } from "../persistence";

const DEFAULT = ["files", "terminal", "settings", "about", "browser", "mail"];
const ALWAYS = ["mail", "about"];
const KEY = "os.packages.installed";

export const pkgList = () => APPS.map((a) => ({ id: a.id, title: a.title, installed: isInstalled(a.id) }));
export function installedIds(): string[] { return loadLS<string[]>(KEY, DEFAULT); }
export function isInstalled(id: string): boolean { return ALWAYS.includes(id) || installedIds().includes(id); }
export function install(id: string) { const s = new Set(installedIds()); s.add(id); saveLS(KEY, [...s], 0); }
export function removePkg(id: string) { if (ALWAYS.includes(id)) return false; const s = installedIds().filter((x) => x !== id); saveLS(KEY, s, 0); return true; }
export function searchPkgs(q: string) { return pkgList().filter((p) => p.id.includes(q.toLowerCase()) || p.title.toLowerCase().includes(q.toLowerCase())); }
