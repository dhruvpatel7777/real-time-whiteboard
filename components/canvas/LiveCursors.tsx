"use client";

import React from "react";
import { UserPresence } from "@/types/canvas";

interface LiveCursorsProps {
  remoteUsers: Record<string, UserPresence>;
  stagePos: { x: number; y: number };
  stageScale: number;
}

export function LiveCursors({
  remoteUsers,
  stagePos,
  stageScale,
}: LiveCursorsProps) {
  const users = Object.values(remoteUsers);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {users.map((user) => {
        if (!user.cursor) return null;

        // Convert virtual canvas point to viewport screen pixel position
        const screenX = user.cursor.x * stageScale + stagePos.x;
        const screenY = user.cursor.y * stageScale + stagePos.y;

        return (
          <div
            key={user.id}
            className="absolute transition-transform duration-75 ease-out flex items-start gap-1"
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
              willChange: "transform",
            }}
          >
            {/* Elegant SVG Mouse Cursor Arrow */}
            <svg
              className="w-5 h-5 -rotate-45 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={user.color || "#38bdf8"}
              stroke="#ffffff"
              strokeWidth="1.5"
            >
              <path d="M3 3l7 18 3-7 7-3L3 3z" />
            </svg>

            {/* User Name Pill */}
            <div
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-lg whitespace-nowrap"
              style={{
                backgroundColor: user.color || "#38bdf8",
              }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
