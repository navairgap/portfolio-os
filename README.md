# navairgap OS — a browser desktop that is also a portfolio

A working Linux-inspired OS that runs entirely in the browser. Every window,
file, and command is part of the portfolio: open Projects/, run `projects` in
the terminal, or read Documents/resume.pdf. **Defense is offense, inverted.**

## Stack

React 18 · TypeScript · Zustand · Framer Motion · Tailwind CSS · lucide-react ·
xterm.js (terminal) · CodeMirror 6 (code editor) · marked (markdown) ·
Web Audio API (synthesized sounds) · localStorage + IndexedDB (persistence)

## Run

```bash
npm install
npm run dev       # local dev
npm run build     # production build → dist/
```

Deploy `dist/` to any static host (GitHub Pages, Vercel, Netlify, Cloudflare).

## What's inside

- **Full OS lifecycle**: POST → loader → dmesg boot → login → desktop →
  shutdown/halt. Restart, lock, logout. Skip-boot toggle in Settings.
- **Window manager**: drag, 8-direction resize, minimize-to-dock, maximize
  with restore, z-order focus, edge snapping with preview, Alt+Tab.
- **4 workspaces** + zoomed overview, Super launcher, global shortcuts,
  right-click context menus everywhere.
- **13 apps**: Files (virtual FS + trash/restore), Terminal (25+ commands:
  neofetch, matrix, cowsay, fortune, sudo joke, tab completion, history),
  Editor (markdown preview), Code Editor (syntax highlighting + JS Run),
  Browser, Mail, Settings (10 tabs, all live), Calculator, Notes,
  Image Viewer, Document Viewer (print → PDF), Trash, About This System.
- **Persistence**: settings, virtual filesystem, window session, terminal
  history, notes — survive reloads. Log out to see session restore.
- **Audio**: fully synthesized UI sounds (no audio files).
- **Accessibility**: keyboard shortcuts list, focus outlines, reduced-motion
  support, ARIA roles, Konami-code easter egg.

## Terminal highlights

`help` · `projects` · `contact` · `about` · `open <app>` · `neofetch` ·
`theme dark|light` · `wallpaper 1-8` · `matrix` · `cowsay hi` · `sudo` ·
`rm -rf /` (try it)

## License

MIT — content and design © 2026 navairgap.
