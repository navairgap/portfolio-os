export interface Project {
  id: string; name: string; pitch: string; desc: string;
  stack: string[]; repo: string; demo?: string; color: string;
}

export const PROJECTS: Project[] = [
  { id: "sentinelwifi", name: "SentinelWiFi", pitch: "Wi-Fi deauth attack detector",
    desc: "RTL-SDR based 802.11 frame inspection with entropy scoring. PyPI-ready, CI-grepped — security you can pip install.",
    stack: ["python", "sdr", "802.11", "pytest"], repo: "https://github.com/navairgap/SentinelWiFi", color: "#F5A623" },
  { id: "portwarden", name: "PortWarden", pitch: "Encrypted port knocker",
    desc: "Single-binary port knocker with encrypted knock sequences and fail2ban-style banning. Nobody opens a port it shouldn't.",
    stack: ["rust", "netfilter", "linux"], repo: "https://github.com/navairgap/portwarden", color: "#6FCF97" },
  { id: "tlsprobe", name: "TLS-Probe", pitch: "Hand-rolled TLS inspector",
    desc: "TLS handshake inspector written from the socket up — versions, ciphers, cert chains, weak configs. No dependencies, all truth.",
    stack: ["python", "tls", "sockets"], repo: "https://github.com/navairgap/tls-probe", color: "#8b5cff" },
  { id: "honeypot", name: "honeypot-lite", pitch: "Fake services, real logs",
    desc: "Low-interaction honeypot emulating SSH and HTTP. Containerized, JSONL output, ready to bait.",
    stack: ["python", "docker", "blue-team"], repo: "https://github.com/navairgap/honeypot-lite", color: "#ff2b3a" },
  { id: "banter", name: "banter", pitch: "Zero-history chat server",
    desc: "Rooms, presence, typing indicators — nothing stored, ever. Two-client integration tests run in CI on every push.",
    stack: ["node", "express", "websockets", "ci"], repo: "https://github.com/navairgap/banter", color: "#3fa9f5" },
  { id: "navos", name: "navairgap OS", pitch: "A portfolio you can boot",
    desc: "A full Linux desktop in the browser — window manager, terminal, nine apps. The very site you're using.",
    stack: ["react", "typescript", "zustand"], repo: "https://github.com/navairgap/portfolio-os", demo: "/os/", color: "#F5A623" },
];

export const SKILLS = [
  { proc: "react-typescript", cpu: 92, mem: 88, note: "window managers, stores, hooks" },
  { proc: "node-apis", cpu: 85, mem: 80, note: "express · websockets · queues" },
  { proc: "python-security", cpu: 90, mem: 86, note: "scanners · sniffers · honeypots" },
  { proc: "rust-systems", cpu: 74, mem: 70, note: "cli tools · daemons" },
  { proc: "linux-devops", cpu: 70, mem: 65, note: "docker · gh-actions · hardening" },
  { proc: "ctf-research", cpu: 66, mem: 40, note: "pwn · crypto · web" },
];

export const ABOUT = {
  name: "navairgap",
  handle: "nav54877",
  bio: "Security-minded backend developer. I like the parts of the stack most people skip — kernels, protocols, memory, packets. Depth over breadth: one project at a time, built for real.",
  motto: "defense is offense, inverted",
  email: "nav54877@gmail.com",
  github: "https://github.com/navairgap",
  location: "india · remote",
  uptime: "5+ yrs building",
};

export const RESUME_TEXT = `NAVAIRGAP — SECURITY × BACKEND
${ABOUT.motto}

PROFILE
${ABOUT.bio}

SELECTED WORK
${PROJECTS.map((p) => `- ${p.name} — ${p.pitch} (${p.stack.join(", ")})`).join("\n")}

STACK
Languages : python · rust · c/c++ · js/ts · solidity
Security  : network recon/defense · honeypots · wifi (SDR) · CTF
Backend   : node · express · websockets · queues · docker · CI

CONTACT
email : ${ABOUT.email}
github: ${ABOUT.github}
`;

export const MAILS = [
  { id: 1, from: "recruiter@some-startup.io", subject: "Security engineer role", time: "09:14",
    body: "Hi — came across SentinelWiFi, really liked the entropy-scoring approach. Are you open to a conversation about our infra security team?" },
  { id: 2, from: "ctf-organizer@nullcon.dev", subject: "Thanks for the writeup", time: "Tue",
    body: "Your pwn writeup from last weekend's CTF was one of the clearest we've read. Would you be interested in authoring a challenge for the next event?" },
  { id: 3, from: "oss-contributor@mailbox.org", subject: "PR merged: banter", time: "Mon",
    body: "Thanks for merging the rate-limit patch! The integration tests made review trivial — more projects should do that." },
];

export const BOOKMARKS = [
  { label: "github", url: "https://github.com/navairgap" },
  { label: "the-os", url: "/os/" },
  { label: "classic-site", url: "/classic.html" },
];

export const TERMINAL_FS: Record<string, string[]> = {
  "~": ["about.txt", "projects/", "resume.txt", "contact.md"],
  "~/projects": PROJECTS.map((p) => p.id + "/"),
  "~/about": [],
};

export const MAN_PAGES: Record<string, string> = {
  terminal: "man: a real shell. type 'help' like everyone else.",
  files: "man: folders, but honest — every project is a directory.",
  monitor: "man: htop cosplay for skills.",
  mail: "man: three panes of pretend inbox; 'Compose' actually works.",
  settings: "man: change the accent. go on, live a little.",
};
