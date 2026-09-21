export const PROJECTS: Record<string, { name: string; desc: string; readme: string }> = {
  "SentinelWiFi": {
    name: "SentinelWiFi",
    desc: "Passive network security auditor — grades your home WiFi A–F.",
    readme: "# SentinelWiFi\n\nA passive, defensive auditor for your own WiFi and LAN.\n\n- Evil-twin detection\n- Rogue DHCP checks\n- Device inventory with newcomer alarms\n- Exposed-service scanning\n- WPS / PMF analysis\n- A–F grading with plain-language fixes\n\n36 tests. CI-enforced. 100% passive. PyPI-ready.\n\nhttps://github.com/navairgap/SentinelWiFi",
  },
  "banter": {
    name: "banter",
    desc: "Real-time public chat rooms. No accounts, no database.",
    readme: "# banter\n\nReal-time public chat rooms with Socket.IO.\n\n- No accounts, no database\n- XSS-proof by construction\n- Two-client integration tests\n- Ships in one command\n\nhttps://github.com/navairgap/banter",
  },
  "airgap-os": {
    name: "airgap-os",
    desc: "A hobby kernel built from nothing. This site is its namesake.",
    readme: "# airgap-os\n\nA hobby kernel built from nothing: multiboot handoff, VGA driver, GDT, interrupts, memory manager, paging, syscalls — and eventually a shell.\n\nThe deepest way to learn how computers work.\n\nstage 1 verified · ring 0 · freestanding C",
  },
};

export const BIO_SHORT =
  "I build defensive tools for networks people actually own. Passive first, local always, honest about limits.";
export const BIO_LONG =
  "I'm navairgap — a defensive security enthusiast and backend developer. I build passive, local-first tools that audit networks honestly: evil-twin detection, rogue-DHCP watches, device inventory with newcomer alarms, and plain-language reports. My flagship, SentinelWiFi, enforces its own ethics in CI — a grep that fails the build if any offensive capability ever enters the codebase. When I'm not auditing networks, I'm building real-time systems, exploring Web3, or sharpening skills through CTFs. Defense is offense, inverted.";
export const CONTACT_EMAIL = "nav54877@gmail.com";
export const CONTACT_GITHUB = "https://github.com/navairgap";
