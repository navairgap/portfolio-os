# navairgap OS 3.0

A personal portfolio staged as a live **Linux desktop session** — boot sequence,
login, top panel, dock, workspaces, and a real window manager (drag, resize,
edge-snap, minimize, maximize) running nine apps:

**Terminal** (neofetch, ls/cd/cat, `open <project>`, sudo easter egg) ·
**Files** (projects as folders) · **About This System** · **Gallery** ·
**Text Editor** (exportable résumé) · **System Monitor** (htop-style skills) ·
**Mail** (three-pane + working compose) · **Web** · **Settings** (theme/accent/wallpaper).

Stack: React 18 · TypeScript · Vite · Zustand · Framer Motion · lucide-react.
Design: charcoal `#1E1F22`, amber `#F5A623`, Ubuntu + JetBrains Mono.

```bash
npm ci && npm run dev   # develop
npm run build           # tsc gate + vite build → dist/
```

Live: https://navairgap.github.io/os/
Plain-résumé escape hatch is always one click away, top-right.
