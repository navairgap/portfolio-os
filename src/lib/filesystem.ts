import { PROJECTS } from "../data/projects";

export const HOME = "/home/navairgap";
export const DESKTOP = HOME + "/Desktop";
export const TRASH = HOME + "/.trash";

export type FSTree = Record<string, { name: string; type: "file" | "folder"; content?: string; children?: Record<string, string> }>;

function folder(name: string, children: Record<string, string> = {}): FSTree[string] {
  return { name, type: "folder", children };
}
function file(name: string, content = ""): FSTree[string] {
  return { name, type: "file", content };
}

export function defaultFS(): FSTree {
  const t: FSTree = {};
  const add = (path: string, node: FSTree[string]) => { t[path] = node; };
  const link = (parent: string, childPath: string) => {
    const name = childPath.split("/").pop()!;
    t[parent].children = t[parent].children || {};
    t[parent].children![name] = childPath;
  };
  for (const p of [HOME, DESKTOP, HOME + "/Documents", HOME + "/Projects", HOME + "/Pictures", HOME + "/Downloads", TRASH])
    add(p, folder(p.split("/").pop()!));

  const readme = file("README.md", "# navairgap OS\n\nThis desktop is the portfolio.\n\n- Open Projects/ in Files\n- Run `projects` or `about` in Terminal\n- Open Documents/resume.pdf\n- Mail app = contact\n\nDefense is offense, inverted.\n");
  add(HOME + "/README.md", readme); link(HOME, HOME + "/README.md");
  const bashrc = file(".bashrc", "# navairgap OS shell\nalias ll='ls -la'\nexport EDITOR=nano\n");
  add(HOME + "/.bashrc", bashrc); link(HOME, HOME + "/.bashrc");

  add(HOME + "/Documents/resume.pdf", file("resume.pdf", "RESUME")); link(HOME + "/Documents", HOME + "/Documents/resume.pdf");
  add(HOME + "/Documents/cover-letter.md", file("cover-letter.md", "# Cover letter\n\nI build defensive tools...\n")); link(HOME + "/Documents", HOME + "/Documents/cover-letter.md");

  for (const key of Object.keys(PROJECTS)) {
    const dir = `${HOME}/Projects/${key}`;
    add(dir, folder(key));
    link(HOME + "/Projects", dir);
    add(`${dir}/README.md`, file("README.md", PROJECTS[key].readme));
    link(dir, `${dir}/README.md`);
  }
  add(HOME + "/Projects/notes.txt", file("notes.txt", "ideas:\n- portwarden\n- arpwatchdog\n")); link(HOME + "/Projects", HOME + "/Projects/notes.txt");

  add(HOME + "/Pictures/avatar.png", file("avatar.png", "IMG:avatar"));
  link(HOME + "/Pictures", HOME + "/Pictures/avatar.png");

  // desktop icons
  const dh = folder("Home"); add(DESKTOP + "/Home", dh); link(DESKTOP, DESKTOP + "/Home");
  add(DESKTOP + "/Projects", folder("Projects")); link(DESKTOP, DESKTOP + "/Projects");
  add(DESKTOP + "/README.md", file("README.md", readme.content!)); link(DESKTOP, DESKTOP + "/README.md");
  add(DESKTOP + "/Contact", folder("Contact")); link(DESKTOP, DESKTOP + "/Contact");
  return t;
}

export function parentOf(path: string): string {
  const i = path.lastIndexOf("/");
  return i <= 0 ? "/" : path.slice(0, i);
}
export function baseName(path: string): string {
  return path.split("/").pop()!;
}
export function joinPath(dir: string, name: string): string {
  return (dir === "/" ? "" : dir) + "/" + name;
}
