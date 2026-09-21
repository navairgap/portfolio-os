// BlackArch fastfetch with dynamically-computed box padding.
const LOGO = [
"                    ▄▄▄▄▄▄▄▄",
"                ▄▄██████████████▄▄",
"             ▄████████▀▀▀▀▀▀████████▄",
"           ▄██████▀            ▀██████▄",
"          ██████▀                ▀██████",
"         ██████       ▄▄▄▄▄       ██████",
"        ██████      ▄███████▄      ██████",
"        █████      ███████████      █████",
"        █████     █████▀▀▀█████     █████",
"        █████     ████     ████     █████",
"        █████     █████▄▄▄█████     █████",
"        █████      ███████████      █████",
"        ██████      ▀███████▀      ██████",
"         ██████       ▀▀▀▀▀       ██████",
"          ██████▄                ▄██████",
"           ▀██████▄            ▄██████▀",
"             ▀████████▄▄▄▄▄▄████████▀",
"                ▀▀██████████████▀▀",
"                    ▀▀▀▀▀▀▀▀",
];
const DIM = "\x1b[2m", RED = "\x1b[38;5;196m", WHITE = "\x1b[97m", GREEN = "\x1b[38;5;46m", GRAY = "\x1b[38;5;245m", RESET = "\x1b[0m";

export function buildFastfetch(uptime: string): string {
  const info: [string, string][] = [
    ["OS", "BlackArch Linux"], ["Kernel", "6.12.4-blackarch"], ["Uptime", uptime],
    ["Shell", "zsh 5.9"], ["DE", "operator-shell"], ["WM", "stackwm"],
    ["Terminal", "xterm-256color"], ["CPU", "Ryzen 9 7950X (32)"], ["GPU", "NVIDIA RTX 4090"],
    ["Memory", "12.4 GiB / 64 GiB"], ["Disk", "412 GiB / 2 TiB"], ["Local IP", "192.168.1.42"],
    ["Packages", "1847 (pacman)"], ["Locale", "en_US.UTF-8"],
  ];
  const rows = info.length;
  const logoW = Math.max(...LOGO.map((l) => l.replace(/[^\x20-\x7e]/g, "··").length / 2 + LOGO[0].length - LOGO[0].length + l.length)) || 60;
  const col2 = info.map(([k, v]) => `${WHITE}${k.padEnd(9)}${GRAY}${v}${RESET}`);
  const leftW = 62;
  const title = `${WHITE}navairgap${GRAY}@${WHITE}blackarch${RESET}`;
  const all = col2.concat([title]);
  const maxRight = Math.max(...all.map((s) => s.replace(/\x1b\[[0-9;]*m/g, "").length));
  const innerW = 4 + leftW + 2 + maxRight + 2;
  const bar = (l: string, r: string) => `${DIM}${l}${"─".repeat(innerW)}${r}${RESET}`;
  const pad = (s: string) => s + " ".repeat(Math.max(0, maxRight - s.replace(/\x1b\[[0-9;]*m/g, "").length));
  const dots = `${GREEN}●${RESET} `.repeat(8).trim();
  const out: string[] = [bar("┌─", "─┐")];
  for (let i = 0; i < rows; i++) {
    const logo = `${RED}${LOGO[i] || ""}${RESET}`;
    const content = i === 0 ? `${title}${GRAY}${"─".repeat(Math.max(0, maxRight - title.replace(/\x1b\[[0-9;]*m/g, "").length))}${RESET}`
      : i === 1 ? `${GRAY}${"─".repeat(maxRight)}${RESET}`
      : pad(col2[i - 2] || "");
    const ansi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "").length;
    const gap = " ".repeat(Math.max(0, leftW - ansi(logo)));
    out.push(`${DIM}│${RESET}  ${logo}${gap}   ${content}  ${DIM}│${RESET}`);
  }
  const lastLogo = `${RED}${LOGO[rows] || ""}${RESET}`;
  const gap = " ".repeat(Math.max(0, leftW - lastLogo.replace(/\x1b\[[0-9;]*m/g, "").length));
  out.push(`${DIM}│${RESET}  ${lastLogo}${gap}   ${pad(dots)}  ${DIM}│${RESET}`);
  for (let i = rows + 1; i < LOGO.length; i++) {
    const logo = `${RED}${LOGO[i]}${RESET}`;
    const gap2 = " ".repeat(Math.max(0, leftW - logo.replace(/\x1b\[[0-9;]*m/g, "").length));
    out.push(`${DIM}│${RESET}  ${logo}${gap2}   ${" ".repeat(maxRight)}  ${DIM}│${RESET}`);
  }
  out.push(bar("└─", "─┘"));
  return out.join("\r\n");
}
