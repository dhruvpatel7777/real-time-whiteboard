import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Palette,
  Users,
  Zap,
  Shield,
  ArrowRight,
  Sparkles,
  MousePointer2,
  Square,
  Circle,
  Pencil,
  CheckCircle2,
  Lock,
  Layers,
  Database,
  Wifi,
} from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute -top-40 right-[-10%] w-[500px] h-[500px] bg-pink-600/15 blur-[140px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="border-b border-neutral-800/80 bg-[#09090b]/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">CollabBoard</span>
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                CRDT Realtime
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="text-xs font-semibold text-neutral-300 hover:text-white px-3.5 py-2 rounded-lg hover:bg-neutral-800/60 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signin"
              className="text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              Launch Demo Board
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 py-14 sm:py-20 max-w-6xl mx-auto w-full">
        {/* Top Tag Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-700/80 text-neutral-300 text-xs font-medium mb-8 shadow-xl backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-neutral-400">Multiplayer Ready</span>
          <span className="text-neutral-600">·</span>
          <span className="text-indigo-400 font-semibold">100% Free & Local</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400">Zero Cloud Keys</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl text-neutral-50 leading-[1.1] mb-6">
          Real-Time Collaborative Whiteboard with{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Local CRDT Sync
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-neutral-400 max-w-2xl leading-relaxed mb-10">
          Built with Konva.js canvas, Yjs CRDT conflict resolution, live awareness cursors,
          offline IndexedDB resilience, and local SQLite persistence.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <Link
            href="/auth/signin"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.02]"
          >
            <span>Open Multiplayer Boards</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-semibold text-sm transition-all shadow-lg hover:border-neutral-700"
          >
            Create New Account
          </Link>
        </div>

        {/* Live Whiteboard Canvas Mockup / Showcase Preview */}
        <div className="w-full max-w-5xl rounded-3xl bg-[#0c0d12] border border-neutral-800 shadow-2xl p-3 sm:p-4 mb-20 relative glow-card overflow-hidden">
          {/* Mock Canvas Header Bar */}
          <div className="h-12 px-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="font-semibold text-neutral-300 ml-2">Team Architecture & Brainstorming</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                EDITOR
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Wifi className="w-3 h-3" />
                <span>Live Connected</span>
              </div>
              <div className="flex items-center -space-x-2">
                <div className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-neutral-900">
                  A
                </div>
                <div className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-neutral-900">
                  B
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-neutral-900">
                  C
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Visual Canvas Area */}
          <div className="h-80 sm:h-96 w-full rounded-2xl bg-[#08090d] canvas-dot-grid relative overflow-hidden flex items-center justify-center p-6 border border-neutral-800/60">
            {/* Mock Shape 1: Architecture Box */}
            <div className="absolute top-12 left-14 p-4 rounded-xl bg-neutral-900/90 border-2 border-indigo-500 shadow-xl text-left w-56">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                Frontend (Next.js 16)
              </div>
              <div className="text-xs text-neutral-300">
                Konva HTML5 Canvas + Zustand Store + React 19
              </div>
            </div>

            {/* Mock Connecting Arrow Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" />
                </marker>
              </defs>
              <path
                d="M 280 90 C 360 90, 360 160, 430 160"
                fill="none"
                stroke="#818cf8"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                markerEnd="url(#arrow)"
              />
              <path
                d="M 580 160 C 650 160, 650 90, 720 90"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                markerEnd="url(#arrow)"
              />
            </svg>

            {/* Mock Shape 2: Yjs CRDT Hub */}
            <div className="absolute top-28 left-[40%] -translate-x-1/2 p-4 rounded-2xl bg-neutral-900/95 border-2 border-purple-500 shadow-2xl text-left w-64 ring-4 ring-purple-500/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-1 flex items-center justify-between">
                <span>Yjs CRDT Engine</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Port 1234</span>
              </div>
              <div className="text-xs text-neutral-300">
                y-websocket + IndexedDB offline cache
              </div>
            </div>

            {/* Mock Shape 3: SQLite Database */}
            <div className="absolute top-12 right-14 p-4 rounded-xl bg-neutral-900/90 border-2 border-emerald-500 shadow-xl text-left w-52">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Local SQLite (Prisma)
              </div>
              <div className="text-xs text-neutral-300">
                Debounced binary snapshots + zero cloud cost
              </div>
            </div>

            {/* Live Multiplayer Cursor 1: Alice */}
            <div className="absolute top-24 left-[35%] transition-transform flex items-start gap-1 z-20">
              <svg className="w-5 h-5 -rotate-45 drop-shadow-md text-rose-500 fill-rose-500" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth="1.5">
                <path d="M3 3l7 18 3-7 7-3L3 3z" />
              </svg>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-rose-500 shadow-lg">
                Alice (Owner)
              </div>
            </div>

            {/* Live Multiplayer Cursor 2: Bob */}
            <div className="absolute bottom-20 right-[35%] transition-transform flex items-start gap-1 z-20">
              <svg className="w-5 h-5 -rotate-45 drop-shadow-md text-sky-400 fill-sky-400" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth="1.5">
                <path d="M3 3l7 18 3-7 7-3L3 3z" />
              </svg>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-sky-500 shadow-lg">
                Bob (Editor)
              </div>
            </div>

            {/* Mock Floating Toolbar at bottom */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-700 shadow-2xl flex items-center gap-2 backdrop-blur-md">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <MousePointer2 className="w-3.5 h-3.5" />
              </div>
              <div className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
                <Square className="w-3.5 h-3.5" />
              </div>
              <div className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
                <Circle className="w-3.5 h-3.5" />
              </div>
              <div className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
                <Pencil className="w-3.5 h-3.5" />
              </div>
              <div className="h-4 w-px bg-neutral-700 mx-1" />
              <div className="w-3.5 h-3.5 rounded-full bg-sky-400 border border-white" />
              <div className="text-[11px] text-neutral-400 font-mono">100%</div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">
          <div className="p-7 rounded-3xl bg-neutral-900/70 border border-neutral-800/90 shadow-xl glow-card">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-100 mb-2">Conflict-Free CRDT</h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Yjs merges concurrent element creation, transforms, and deletions without central locking. Works smoothly across network drops with automatic reconciliation.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-neutral-900/70 border border-neutral-800/90 shadow-xl glow-card">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-5">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-100 mb-2">Live Presence Cursors</h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Sub-300ms cursor broadcasts, active collaborator avatars, and remote selection rings using Yjs native awareness protocol without third-party services.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-neutral-900/70 border border-neutral-800/90 shadow-xl glow-card">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-100 mb-2">Local SQLite & Roles</h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Per-board roles (Owner, Editor, Viewer) enforced at server endpoints and middleware. Zero cloud database fees—debounced snapshots write to local SQLite.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 py-6 text-center text-xs text-neutral-500">
        Next.js 16 · Konva.js · Yjs CRDT · y-websocket · SQLite · Tailwind CSS
      </footer>
    </div>
  );
}
