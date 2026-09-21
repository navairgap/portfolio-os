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

## Advanced Features

1. **WebGL live wallpaper** — Settings → Appearance → wallpaper "live" (LIVE badge): GLSL fluid gradient following your accent color, DPR-capped, pauses when hidden, off for reduced-motion.
2. **System Monitor** — CPU canvas graph, memory stacked bar, network up/down graphs, live process list (windows as processes) with kill.
3. **Task Manager** — flat table of windows with focus/minimize/end-task (confirm dialog) and running/memory footer. Fixed 500×400.
4. **Music** — synthesized ambient loops (Web Audio), animated album art, 32-bar visualizer, playlist, persists across reloads.
5. **Global search** — Super, then type: fuzzy-matches apps, files (+contents), settings tabs, terminal commands, projects. Arrow keys + Enter.
6. **Lock screen** — Super+L. Blurred frozen desktop, clock, any-password unlock, switch user. Esc does nothing.
7. **Desktop widgets** — clock, weather, stats, sticky note, now playing. Draggable, resizable, z-order, per-workspace, persisted; toggles in Settings → Appearance.
8. **Code playground** — Run JS in a sandboxed iframe (3s timeout, console capture, Stop) or Python via lazily-loaded Pyodide. Ctrl+Enter, resizable output.
9. **Package manager** — `apt list|search|install|remove|update` in the terminal. Only installed apps appear in dock/launcher.
10. **Real email** — Mail compose posts to a Formspree endpoint if `VITE_FORMSPREE_ENDPOINT` is set, else mailto fallback. Honeypot + math captcha + 1/min rate limit.
11. **Screenshots** — PrintScreen or Ctrl+Shift+4: crosshair region select, saved to ~/Pictures, notification with Show-in-Files.
12. **Voice commands** — Ctrl+Space or mic icon: "open terminal", "theme dark", "search files", "lock", "shutdown"… (Web Speech API; icon hidden if unsupported).
13. **Markdown Reader** — reads `~/Documents/posts/*.md` with frontmatter, sorted by date, share-link button.
14. **Guestbook** — demo mode (localStorage) by default; spam filter, 5-min rate limit, captcha, honeypot. Configure a backend to persist.
15. **Boot telemetry** — serverless counter in `server/telemetry/` (Vercel KV). Falls back to a local counter when unconfigured.
16. **AI assistant** — `ask "question"` in the terminal streams from OpenAI. Set your key in Settings → About → AI Assistant.
17. **Snap previews** — drag to edges for halves/full, corners for quarters; accent overlay preview.
18. **Drag files onto dock icons** — compatible apps light up; drop opens the file in that app.
19. **Recovery mode** — hold Shift during boot: root shell with ls/cd/cat/fsck/systemctl.
20. **Battery simulation** — drains 0.35%/min from 100%; amber warning at 20%, red at 10%, modal at 5%. Toggle in Settings → Power.
21. **Timezone-aware clock** — Intl timezones everywhere; dropdown in Settings → Date & Time.
22. **BSOD easter egg** — `sudo rm -rf /`. Blue screen, fake progress, "press any key".
23. **Konami matrix** — ↑↑↓↓←→←→BA → full-screen rain with "Set as wallpaper?" option.
24. **Tabbed windows** — Editor already; Files/Browser/Code Editor support tabs via Ctrl+T / Ctrl+W (Editor ships with tabs).
25. **Widget z-order** — right-click a widget: bring forward / send back / move workspace / remove; layout reset in Settings.

### Setup notes

- **Feature 10 (email)**: set `VITE_FORMSPREE_ENDPOINT=https://formspree.io/f/XXXX` at build time, or it uses the mailto fallback.
- **Feature 14 (guestbook)**: ships in demo mode. Point `src/apps/Guestbook/GuestbookApp.tsx` at Supabase/Firebase to persist.
- **Feature 15 (telemetry)**: deploy `server/telemetry/` to Vercel with a KV binding; otherwise the local counter is shown.
- **Feature 16 (AI)**: paste an OpenAI key in Settings → About This System → AI Assistant.
