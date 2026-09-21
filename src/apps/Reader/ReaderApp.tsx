import { useEffect, useState } from "react";
import { marked } from "marked";
import { Share2, FilePlus } from "lucide-react";
import { useFS } from "../../store/useFileSystemStore";
import { openApp } from "../../system/DesktopIcons";
import { useNotifications } from "../../store/useNotificationStore";

const DIR = "/home/navairgap/Documents/posts";
interface Post { slug: string; title: string; date: string; tags: string[]; body: string }

function parsePost(content: string, slug: string): Post {
  const m = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  let title = slug, date = "", tags: string[] = [], body = content;
  if (m) {
    body = m[2];
    for (const line of m[1].split("\n")) {
      const [k, v] = line.split(":").map((s) => s.trim());
      if (k === "title") title = v || title;
      if (k === "date") date = v || date;
      if (k === "tags") tags = (v || "").split(",").map((t) => t.trim());
    }
  }
  return { slug, title, date, tags, body };
}

export default function ReaderApp() {
  const fs = useFS();
  const [posts, setPosts] = useState<Post[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => {
    const list = fs.list(DIR).filter((p) => p.endsWith(".md")).map((p) => parsePost(fs.get(p)?.content || "", p.split("/").pop()!.replace(".md", "")));
    list.sort((a, b) => b.date.localeCompare(a.date));
    setPosts(list);
    if (list[0]) setSel(list[0].slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const cur = posts.find((p) => p.slug === sel);
  const share = () => {
    const url = location.origin + location.pathname + "#/reader/" + (cur?.slug || "");
    navigator.clipboard.writeText(url).then(() => useNotifications.getState().push({ appId: "editor", title: "Link copied", body: url }));
  };
  const create = () => openApp("editor", { path: DIR + "/new-post.md" }, "new-post.md");

  return (
    <div className="h-full flex text-[#f4f4f5]">
      <div className="w-52 border-r border-[rgba(255,255,255,.08)] flex flex-col shrink-0">
        <div className="p-2"><button onClick={create} className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-[6px] bg-[rgba(124,156,255,.15)] text-[#7c9cff] text-[12px] font-semibold"><FilePlus size={13} /> new post</button></div>
        <div className="flex-1 overflow-auto px-1 pb-1 space-y-0.5">
          {posts.map((p) => (
            <button key={p.slug} onClick={() => setSel(p.slug)}
              className={`w-full text-left px-2 py-2 rounded-[6px] ${sel === p.slug ? "bg-[rgba(124,156,255,.16)]" : "hover:bg-[rgba(255,255,255,.05)]"}`}>
              <div className="text-[12.5px] font-medium truncate">{p.title}</div>
              <div className="text-[10.5px] text-[rgba(244,244,245,.38)]">{p.date}</div>
            </button>
          ))}
          {!posts.length && <div className="p-3 text-[12px] text-[rgba(244,244,245,.38)]">no posts yet</div>}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-5">
        {!posts.length ? (
          <div className="h-full grid place-items-center">
            <div className="text-center">
              <div className="text-[15px] font-semibold">No posts yet</div>
              <div className="text-[12px] text-[rgba(244,244,245,.38)] mt-1 mb-4">write markdown with frontmatter in ~/Documents/posts/</div>
              <button onClick={create} className="px-3 py-1.5 rounded-[6px] bg-[#7c9cff] text-black text-[12px] font-semibold">Create your first post</button>
            </div>
          </div>
        ) : cur ? (<>
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <h2 className="text-[19px] font-semibold">{cur.title}</h2>
              <div className="text-[11.5px] text-[rgba(244,244,245,.38)] mt-0.5">{cur.date} {cur.tags.map((t) => <span key={t} className="ml-1.5 px-1.5 py-0.5 rounded bg-[rgba(124,156,255,.14)] text-[#7c9cff]">#{t}</span>)}</div>
            </div>
            <button onClick={share} className="p-1.5 rounded hover:bg-[rgba(255,255,255,.08)]" title="share"><Share2 size={14} /></button>
          </div>
          <div className="prose-invert max-w-2xl text-[13.5px] leading-[1.75] text-[rgba(244,244,245,.88)]"
            dangerouslySetInnerHTML={{ __html: marked.parse(cur.body, { async: false }) }} />
        </>) : null}
      </div>
    </div>
  );
}
