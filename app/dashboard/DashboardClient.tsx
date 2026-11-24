"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Palette,
  Plus,
  Search,
  Users,
  Clock,
  Trash2,
  ExternalLink,
  LogOut,
  FolderPlus,
} from "lucide-react";
import { BoardSummary, BoardRole } from "@/types/board";
import { useBoardApi } from "@/hooks/useBoardApi";

interface DashboardClientProps {
  initialBoards: BoardSummary[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    color: string;
  };
}

export function DashboardClient({
  initialBoards,
  currentUser,
}: DashboardClientProps) {
  const [boards, setBoards] = useState<BoardSummary[]>(initialBoards);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { createBoard, deleteBoard } = useBoardApi();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredBoards = boards.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || loading) return;

    setLoading(true);
    try {
      const created = await createBoard({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
      });
      setBoards([created, ...boards]);
      setNewTitle("");
      setNewDesc("");
      setIsCreateOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create board";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (boardId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

    try {
      await deleteBoard(boardId);
      setBoards(boards.filter((b) => b.id !== boardId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete board";
      alert(message);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">CollabBoard</span>
              <span className="ml-2 text-xs text-neutral-500 hidden sm:inline">Multiplayer Whiteboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ backgroundColor: currentUser.color || "#38bdf8" }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-neutral-200 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-neutral-500 leading-tight">
                  {currentUser.email}
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-50">
              Your Whiteboards
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Select an existing canvas or start a new real-time collaboration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search boards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Board</span>
            </button>
          </div>
        </div>

        {/* Boards Grid */}
        {filteredBoards.length === 0 ? (
          <div className="border border-dashed border-neutral-800 rounded-2xl p-12 text-center bg-neutral-900/30">
            <FolderPlus className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-300">
              {search ? "No whiteboards match your search" : "No whiteboards yet"}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {search
                ? "Try searching for a different keyword or clear the search filter."
                : "Create your first collaborative whiteboard to start brainstorming with live cursors."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Board</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBoards.map((b) => (
              <div
                key={b.id}
                className="group relative rounded-2xl bg-neutral-900/70 border border-neutral-800/80 hover:border-neutral-700 p-5 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-base font-semibold text-neutral-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {b.title}
                    </h2>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border shrink-0 ${
                        b.role === "owner"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : b.role === "editor"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                          : "bg-neutral-800 text-neutral-400 border-neutral-700"
                      }`}
                    >
                      {b.role}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2 min-h-[32px] mb-4">
                    {b.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{b.memberCount}</span>
                    </span>
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Clock className="w-3.5 h-3.5" />
                      <span suppressHydrationWarning>{mounted ? formatDate(b.updatedAt) : "Recently"}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {b.role === "owner" && (
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id, b.title)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                        title="Delete Board"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <Link
                      href={`/board/${b.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-indigo-600 text-neutral-200 hover:text-white font-medium text-xs transition-colors"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-100">
            <h2 className="text-base font-semibold mb-1">Create New Whiteboard</h2>
            <p className="text-xs text-neutral-400 mb-4">
              Enter a name and optional description for your whiteboard.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Board Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sprint Planning & UI Wireframes"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the purpose of this board..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || loading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
