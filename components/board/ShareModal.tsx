"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Trash2, Mail, Users, Check } from "lucide-react";
import { useBoardApi } from "@/hooks/useBoardApi";
import { BoardMemberWithUser, BoardRole } from "@/types/board";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  currentUserRole: BoardRole;
  currentUserId: string;
}

export function ShareModal({
  isOpen,
  onClose,
  boardId,
  currentUserRole,
  currentUserId,
}: ShareModalProps) {
  const { getMembers, addMember, removeMember } = useBoardApi();
  const [members, setMembers] = useState<BoardMemberWithUser[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BoardRole>("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadMembers() {
      try {
        const list = await getMembers(boardId);
        if (isMounted) setMembers(list);
      } catch (err: unknown) {
        console.error("Failed to load members:", err);
      }
    }
    loadMembers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, boardId, getMembers]);

  if (!isOpen) return null;

  const canManage = currentUserRole === "owner" || currentUserRole === "editor";
  const isOwner = currentUserRole === "owner";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const newMember = await addMember(boardId, { email, role });
      setMembers((prev) => {
        const filtered = prev.filter((m) => m.userId !== newMember.userId);
        return [...filtered, newMember];
      });
      setSuccess(`Invited ${email} as ${role}`);
      setEmail("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to invite user";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user from the board?")) return;

    try {
      await removeMember(boardId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove member";
      alert(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold">Share Whiteboard</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invite Form */}
        {canManage && (
          <form onSubmit={handleInvite} className="mt-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value as BoardRole)}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
                {isOwner && <option value="owner">Owner</option>}
              </select>

              <button
                type="submit"
                disabled={loading}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </div>

            {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg">{error}</div>}
            {success && <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-lg flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> {success}</div>}
          </form>
        )}

        {/* Current Members List */}
        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            Board Members ({members.length})
          </div>

          <div className="divide-y divide-neutral-800 max-h-56 overflow-y-auto pr-1">
            {members.map((m) => {
              const isCurrentUser = m.userId === currentUserId;
              return (
                <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[11px]"
                      style={{ backgroundColor: m.user.color || "#38bdf8" }}
                    >
                      {m.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-200 flex items-center gap-1.5">
                        <span>{m.user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-neutral-500">(You)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500">{m.user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                        m.role === "owner"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : m.role === "editor"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                          : "bg-neutral-800 text-neutral-400 border-neutral-700"
                      }`}
                    >
                      {m.role}
                    </span>

                    {/* Owner can remove members; user can remove self (leave board) */}
                    {(isOwner || isCurrentUser) && m.role !== "owner" && (
                      <button
                        type="button"
                        onClick={() => handleRemove(m.userId)}
                        className="p-1 rounded text-neutral-500 hover:text-rose-400 transition-colors"
                        title={isCurrentUser ? "Leave board" : "Remove user"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
