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


## Keyboard shortcuts

| key | action |
| --- | --- |
| alt + tab | cycle windows in the active workspace |
| esc | close focused window |

Each app belongs to a workspace. Switching workspaces focuses the topmost open
window there; closing or minimizing a window returns focus to another open
window in that workspace. Alt + Tab only cycles through windows in the active
workspace.

## Mobile fallback

below 768px the desktop session gives way to an app grid with fullscreen apps — no window chrome, no dragging.

## Persistence

the boot-skip flag lives in `sessionStorage`; theme, accent, and wallpaper preferences live in `localStorage`. incognito gives you the full boot every time.

## Theming

colors are CSS custom properties on `:root`; the accent swap rewrites one variable. wallpapers are gradient classes. adding a theme means adding a `[data-theme]` block — no component changes.

## Performance

the production build bundles the desktop apps together. slow devices and narrow screens get the app-grid fallback.

## History

v1 was a baked GLB room that fought back for weeks. v2 was procedural. v3 wiped everything and became a real OS: boot, login, window manager, nine apps. the wipe commit message says 'start from scratch' and means it.


## Maintenance notes

Test keyboard-only window operations, predictable focus after close/minimize/restore, workspace isolation and active-workspace cycling, and reduced-motion behavior. Ensure focus indicators remain visible and windows stay within viewport bounds at zoomed layouts.
