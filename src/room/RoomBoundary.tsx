import { Component, type ReactNode } from "react";

class RoomBoundary extends Component<{ children: ReactNode; onExit: () => void }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: Error) { return { err: String(e?.message || e) }; }
  render() {
    if (this.state.err) {
      return (
        <div className="fixed inset-0 z-[130] bg-black text-[var(--accent)] font-mono flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="text-[15px] font-bold">3D room failed: {this.state.err}</div>
          <div className="text-[12px] text-[var(--text-secondary)]">the OS behind this is untouched — exit returns you to the desktop</div>
          <button onClick={this.props.onExit} className="px-4 py-2 border border-[var(--accent)] hover:bg-[var(--accent)] hover:text-black">exit to desktop</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export { RoomBoundary };
