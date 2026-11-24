"use client";

import dynamic from "next/dynamic";
import React from "react";
import Konva from "konva";
import { CanvasElement } from "@/types/canvas";

const KonvaStage = dynamic(() => import("./KonvaStage"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-950 text-neutral-400 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Whiteboard Canvas...</span>
      </div>
    </div>
  ),
});

interface WhiteboardCanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  transformerRef: React.RefObject<Konva.Transformer | null>;
  drawingElement: CanvasElement | null;
  isSpacePressed: boolean;
  isPanning: boolean;
  readOnly?: boolean;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

export function WhiteboardCanvas(props: WhiteboardCanvasProps) {
  return <KonvaStage {...props} />;
}
