import { Gamepad2, lazy, type ComponentType } from "react";
import { Gamepad2, Folder, TerminalSquare, BarChart3, FileText, Code2, Globe, Mail, Settings, Calculator, StickyNote, Image as ImageIcon, FileBox, Trash2, Info, Activity, ListChecks, Music2, BookOpen, MessagesSquare } from "lucide-react";
import type { AppDefinition } from "../types";

const L = (loader: () => Promise<{ default: ComponentType<any> }>) => lazy(loader);

export const APPS: AppDefinition[] = [
  { id: "files", title: "Files", icon: Folder, component: L(() => import("../apps/FilesApp")), defaultSize: { width: 760, height: 520 }, minSize: { width: 480, height: 320 }, resizable: true },
  { id: "terminal", title: "Terminal", icon: TerminalSquare, component: L(() => import("../apps/Terminal/TerminalApp")), defaultSize: { width: 640, height: 420 }, minSize: { width: 400, height: 260 }, resizable: true },
  { id: "editor", title: "Text Editor", icon: FileText, component: L(() => import("../apps/EditorApp")), defaultSize: { width: 700, height: 520 }, minSize: { width: 420, height: 300 }, resizable: true },
  { id: "code", title: "Code Editor", icon: Code2, component: L(() => import("../apps/CodeEditorApp")), defaultSize: { width: 760, height: 540 }, minSize: { width: 480, height: 320 }, resizable: true },
  { id: "browser", title: "Browser", icon: Globe, component: L(() => import("../apps/BrowserApp")), defaultSize: { width: 860, height: 560 }, minSize: { width: 480, height: 320 }, resizable: true },
  { id: "mail", title: "Mail", icon: Mail, component: L(() => import("../apps/MailApp")), defaultSize: { width: 720, height: 500 }, minSize: { width: 520, height: 340 }, resizable: true },
  { id: "settings", title: "Settings", icon: Settings, component: L(() => import("../apps/SettingsApp")), defaultSize: { width: 780, height: 540 }, minSize: { width: 600, height: 400 }, resizable: true },
  { id: "about", title: "About This System", icon: Info, component: L(() => import("../apps/AboutApp")), defaultSize: { width: 640, height: 520 }, minSize: { width: 480, height: 360 }, resizable: true },
  { id: "calculator", title: "Calculator", icon: Calculator, component: L(() => import("../apps/CalculatorApp")), defaultSize: { width: 420, height: 480 }, minSize: { width: 340, height: 420 }, resizable: true },
  { id: "notes", title: "Notes", icon: StickyNote, component: L(() => import("../apps/NotesApp")), defaultSize: { width: 620, height: 460 }, minSize: { width: 420, height: 300 }, resizable: true },
  { id: "image", title: "Image Viewer", icon: ImageIcon, component: L(() => import("../apps/ImageViewerApp")), defaultSize: { width: 560, height: 480 }, minSize: { width: 360, height: 300 }, resizable: true },
  { id: "document", title: "Document Viewer", icon: FileBox, component: L(() => import("../apps/DocumentViewerApp")), defaultSize: { width: 760, height: 600 }, minSize: { width: 560, height: 420 }, resizable: true },
  { id: "algoviz", title: "Algorithm Visualizer", icon: BarChart3, component: L(() => import("../apps/AlgoViz/AlgorithmVisualizerApp")), defaultSize: { width: 780, height: 560 }, minSize: { width: 560, height: 400 }, resizable: true },
  { id: "system-monitor", title: "System Monitor", icon: Activity, component: L(() => import("../apps/SystemMonitor/SystemMonitorApp")), defaultSize: { width: 780, height: 520 }, minSize: { width: 560, height: 380 }, resizable: true },
  { id: "task-manager", title: "Task Manager", icon: ListChecks, component: L(() => import("../apps/TaskManager/TaskManagerApp")), defaultSize: { width: 500, height: 400 }, minSize: { width: 500, height: 400 }, resizable: false },
  { id: "music", title: "Music", icon: Music2, component: L(() => import("../apps/Music/MusicApp")), defaultSize: { width: 720, height: 480 }, minSize: { width: 560, height: 400 }, resizable: true },
  { id: "reader", title: "Reader", icon: BookOpen, component: L(() => import("../apps/Reader/ReaderApp")), defaultSize: { width: 760, height: 520 }, minSize: { width: 560, height: 380 }, resizable: true },
  { id: "guestbook", title: "Guestbook", icon: MessagesSquare, component: L(() => import("../apps/Guestbook/GuestbookApp")), defaultSize: { width: 620, height: 500 }, minSize: { width: 460, height: 380 }, resizable: true },
  { id: "doom", title: "DOOM", icon: Gamepad2, component: L(() => import("../apps/Doom/DoomApp")), defaultSize: { width: 820, height: 600 }, minSize: { width: 640, height: 480 }, resizable: true },
  { id: "trash", title: "Trash", icon: Trash2, component: L(() => import("../apps/TrashApp")), defaultSize: { width: 560, height: 440 }, minSize: { width: 400, height: 300 }, resizable: true },
];
