import { Component, type ReactNode } from "react";

export default class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error) { console.error("navairgap OS crashed:", err); }
  render() {
    if (this.state.err) {
      return (
        <div className="fixed inset-0 z-[999] bg-[#0e0e10] text-[#f4f4f5] font-mono flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-[20px] font-bold">navairgap OS hit a wall</div>
          <div className="text-[12px] text-[rgba(244,244,245,.5)] max-w-md break-all">{String(this.state.err.message || this.state.err)}</div>
          <div className="flex gap-3">
            <button onClick={() => location.reload()} className="px-4 py-2 rounded-[8px] bg-[#7c9cff] text-black text-[13px] font-semibold">reboot</button>
            <button onClick={() => { localStorage.clear(); location.reload(); }} className="px-4 py-2 rounded-[8px] bg-[rgba(255,255,255,.1)] text-[13px]">factory reset</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
