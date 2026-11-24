"use client";

import React from "react";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

export function SyncStatusBanner() {
  const { syncState, lastSavedAt, hasOfflineChanges } = useWhiteboardStore();

  let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  let icon = <Wifi className="w-3.5 h-3.5 text-emerald-400" />;
  let label = "Live Connected";

  if (syncState === "syncing") {
    badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    icon = <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />;
    label = hasOfflineChanges ? "Reconciling offline edits..." : "Syncing...";
  } else if (syncState === "offline" || syncState === "disconnected") {
    badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    icon = <WifiOff className="w-3.5 h-3.5 text-rose-400" />;
    label = "Offline (Local Queue Active)";
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeColor} backdrop-blur-md transition-all shadow-sm`}
        title={
          syncState === "connected"
            ? "Real-time CRDT WebSocket sync active"
            : syncState === "offline"
            ? "Working offline. Edits are queued locally in IndexedDB and will auto-reconcile upon reconnect."
            : "Syncing updates"
        }
      >
        {icon}
        <span>{label}</span>
      </div>

      {lastSavedAt && (
        <span className="hidden md:flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-900/60 border border-neutral-800/80 px-2 py-0.5 rounded-md">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Saved {lastSavedAt}</span>
        </span>
      )}
    </div>
  );
}
