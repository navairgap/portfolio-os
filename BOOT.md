# BOOT — 6 phases

P0 power-on 0.5s (blinking cursor) → P1 BIOS POST 80ms/line → P2 GRUB menu w/ 3s countdown (any key, Enter)
→ P3 kernel dmesg 25ms/line (~28 lines) → P4 ASCII splash (per-char glow, red, chromatic aberration option,
400ms rule line) → P5 matrix-rain login (password prompt, any input; "guest" → guest session; live UTC clock)
→ P6 desktop fade + "loading profile..." 0.5s.

Skip: ESC during P1–P3 → P5. Return visits skip to P5 unless Settings → Boot = Always.
localStorage: os.bootedOnce, bootFull setting. Reduced-motion: static phases, no rain, no aberration.
Sounds: boot tone at P1, kernel ticks every 3rd line, login beeps (operatorSounds.ts).
