import { AnimatePresence, motion } from "framer-motion";
import { useWindows } from "../store/useWindowStore";
import { useSession } from "../store/useSessionStore";
import { APPS } from "../registry/appRegistry";

export default function WorkspaceOverview() {
  const { overviewOpen, setOverviewOpen, setWorkspace } = useSession();
  const { windows, activeWorkspace } = useWindows();
  return (
    <AnimatePresence>
      {overviewOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[160] p-16 pt-24" style={{ background: "rgba(14,14,16,.82)", backdropFilter: "blur(24px)" }}
          onClick={() => setOverviewOpen(false)}>
          <div className="grid grid-cols-2 gap-4 h-full max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
            {[0, 1, 2, 3].map((ws) => (
              <button key={ws} onClick={() => { setWorkspace(ws); setOverviewOpen(false); }}
                className={`relative rounded-[12px] border overflow-hidden transition-all
                  ${ws === activeWorkspace ? "border-[#7c9cff] bg-[rgba(124,156,255,.06)]" : "border-[rgba(255,255,255,.12)] bg-[rgba(35,35,40,.4)] hover:border-[rgba(255,255,255,.3)]"}`}>
                <span className="absolute top-2 left-3 text-[12px] text-[rgba(244,244,245,.62)]">workspace {ws + 1}</span>
                {windows.filter((w) => w.workspaceId === ws).map((w) => {
                  const app = APPS.find((a) => a.id === w.appId);
                  return (
                    <div key={w.id} className="absolute rounded-[4px] bg-[rgba(124,156,255,.25)] border border-[rgba(124,156,255,.5)] text-[9px] text-[#f4f4f5] px-1 truncate"
                      style={{ left: `${(w.x / innerWidth) * 80 + 5}%`, top: `${(w.y / innerHeight) * 70 + 10}%`, width: `${Math.min(40, (w.width / innerWidth) * 70)}%`, height: "18%" }}>
                      {app?.title}
                    </div>
                  );
                })}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
