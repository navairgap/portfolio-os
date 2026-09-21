# THEME — BlackArch / Operator

Palette: bg #050507, surface #0b0b0e, elevated #131317; text #e6e6e6 / 60% / 32%;
accent #ff2b2b (red — focus, active, prompt, alerts only); success #00ff9c (terminal);
warning #ffb800; terminal bg #000, fg #00ff9c, prompt #ff2b2b.
Light fallback: bg #f5f5f0, accent #cc0000, terminal unchanged.

Typography: JetBrains Mono everywhere (IBM Plex Mono → Fira Code → DejaVu Sans Mono).
13px body, 12px labels, 11px uppercase titles (letter-spacing .08em), nothing >16px except boot logo.

Rules: 0px radius on everything (global CSS override). 1px borders only, no drop shadows.
Red never fills large areas. Green is terminal-only. No gradients except scanlines.
Animation: ease [0.4,0,0.2,1] only; no springs. CRT scanline overlay toggleable (Settings → Appearance).
