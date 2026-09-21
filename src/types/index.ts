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
}

export type OSPhase = "boot" | "login" | "desktop" | "shutdown";
