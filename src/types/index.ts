import type { LucideIcon } from "lucide-react";
import type { ComponentType, LazyExoticComponent } from "react";

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number; y: number; width: number; height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  isResizable: boolean;
  minWidth: number; minHeight: number;
  workspaceId: number;
  prevRect?: { x: number; y: number; width: number; height: number };
  props: Record<string, any>;
}

export interface AppDefinition {
  id: string;
  title: string;
  icon: LucideIcon;
  component: LazyExoticComponent<ComponentType<any>> | ComponentType<any>;
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
  resizable: boolean;
}

export interface FileNode {
  name: string;
  type: "file" | "folder";
  content?: string;
  children?: Record<string, string>; // name -> path
}

export interface OSNotification {
  id: string;
  appId: string;
  title: string;
  body: string;
  ts: number;
}

export interface SettingsState {
  theme: "dark" | "light" | "auto";
  accent: string;
  wallpaper: number;
  fontSize: "small" | "medium" | "large";
  animations: boolean;
  brightness: number;
  nightLight: boolean;
  scale: number;
  volume: number;
  muted: boolean;
  startupSound: boolean;
  uiSounds: boolean;
  wifi: boolean;
  ethernet: boolean;
  displayName: string;
  avatar: string | null;
  hour12: boolean;
  showSeconds: boolean;
  dnd: boolean;
  skipBoot: boolean;
  timezone: string;
  powerDrain: boolean;
  widgets: { clock: boolean; weather: boolean; stats: boolean; note: boolean; now: boolean };
  aiKey: string;
  bootFull: "first" | "always" | "never";
  bootSound: boolean;
  loginMatrix: boolean;
  autoTerminal: boolean;
  showFastfetch: boolean;
  promptStyle: "blackarch" | "minimal" | "plain";
  crtOverlay: boolean;
  chromaticAberration: boolean;
  sleepTimeout: "never" | "5" | "15" | "30";
}

export type OSPhase = "boot" | "login" | "desktop" | "lock" | "recovery" | "shutdown" | "restart";
