"use client";

import React from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";

export function ZoomControls() {
  const { stageScale, setStageScale, setStagePos } = useWhiteboardStore();

  const handleZoomIn = () => {
    setStageScale((prev) => Math.min(6, prev * 1.2));
  };

  const handleZoomOut = () => {
    setStageScale((prev) => Math.max(0.1, prev / 1.2));
  };

  const handleReset = () => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  return (
    <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1 p-1 rounded-xl bg-neutral-900/90 border border-neutral-800 shadow-xl backdrop-blur-md text-neutral-300 text-xs">
      <button
        type="button"
        onClick={handleZoomOut}
        title="Zoom Out"
        className="p-1.5 rounded-lg hover:text-white hover:bg-neutral-800 transition-colors"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={handleReset}
        title="Reset Zoom to 100%"
        className="px-2 py-1 font-mono font-medium hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
      >
        {Math.round(stageScale * 100)}%
      </button>

      <button
        type="button"
        onClick={handleZoomIn}
        title="Zoom In"
        className="p-1.5 rounded-lg hover:text-white hover:bg-neutral-800 transition-colors"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
