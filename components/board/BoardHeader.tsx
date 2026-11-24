"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, MessageSquare, Share2, Edit2, Check } from "lucide-react";
import Konva from "konva";
import { SyncStatusBanner } from "./SyncStatusBanner";
import { ExportDropdown } from "./ExportDropdown";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";
import { BoardRole } from "@/types/board";

interface BoardHeaderProps {
  boardId: string;
  boardTitle: string;
  userRole: BoardRole;
  currentUserId: string;
  stageRef: React.RefObject<Konva.Stage | null>;
  onUpdateTitle: (newTitle: string) => void;
  onOpenShareModal: () => void;
}

export function BoardHeader({
  boardId,
  boardTitle,
  userRole,
  currentUserId,
  stageRef,
  onUpdateTitle,
  onOpenShareModal,
}: BoardHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(boardTitle);
  const { remoteUsers, isChatOpen, setIsChatOpen, unreadChatCount } = useWhiteboardStore();

  const canEdit = userRole === "owner" || userRole === "editor";
  const onlineUsers = Object.values(remoteUsers);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingTitle(false);
    if (title.trim() && title !== boardTitle) {
      onUpdateTitle(title.trim());
    }
  };

  return (
    <header className="absolute top-4 left-4 right-4 z-30 h-14 px-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl backdrop-blur-md flex items-center justify-between pointer-events-auto">
      {/* Left: Back & Title & Role */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {isEditingTitle && canEdit ? (
          <form onSubmit={handleTitleSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              className="bg-neutral-950 border border-indigo-500 rounded-lg px-2 py-1 text-sm font-semibold text-white focus:outline-none"
            />
            <button
              type="submit"
              className="p-1 rounded-lg text-emerald-400 hover:bg-neutral-800"
            >
              <Check className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 group">
            <h1 className="text-sm font-semibold text-neutral-100 max-w-[200px] sm:max-w-xs truncate">
              {boardTitle}
            </h1>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-neutral-300 transition-opacity"
                title="Rename board"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
            userRole === "owner"
              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
              : userRole === "editor"
              ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
              : "bg-neutral-800 text-neutral-400 border-neutral-700"
          }`}
        >
          {userRole}
        </span>
      </div>

      {/* Center: Sync Status Banner */}
      <div className="hidden md:flex items-center">
        <SyncStatusBanner />
      </div>

      {/* Right: Presence Avatars, Share, Export, Chat */}
      <div className="flex items-center gap-2">
        {/* Presence Avatars */}
        <div className="flex items-center -space-x-1.5 overflow-hidden mr-1">
          {onlineUsers.map((user) => (
            <div
              key={user.id}
              className="relative inline-block w-7 h-7 rounded-full text-white text-[10px] font-bold border-2 border-neutral-900 flex items-center justify-center shadow-md cursor-default"
              style={{ backgroundColor: user.color || "#38bdf8" }}
              title={`${user.name} (Online)`}
            >
              {user.name.charAt(0).toUpperCase()}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-neutral-900 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Export Dropdown */}
        <ExportDropdown stageRef={stageRef} boardTitle={boardTitle} />

        {/* Chat Toggle */}
        <button
          type="button"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`relative p-2 rounded-lg border transition-colors ${
            isChatOpen
              ? "bg-neutral-800 text-indigo-400 border-indigo-500/40"
              : "bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border-neutral-800 hover:text-white"
          }`}
          title="Toggle Board Chat"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
