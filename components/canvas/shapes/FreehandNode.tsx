"use client";

import React, { useRef } from "react";
import { Line } from "react-konva";
import Konva from "konva";
import { FreehandElement } from "@/types/canvas";

interface FreehandNodeProps {
  element: FreehandElement;
  isSelected: boolean;
  isConflict: boolean;
  remoteColor?: string;
  readOnly: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onUpdate: (updates: Partial<FreehandElement>) => void;
}

export function FreehandNode({
  element,
  isSelected,
  isConflict,
  remoteColor,
  readOnly,
  onSelect,
  onUpdate,
}: FreehandNodeProps) {
  const shapeRef = useRef<Konva.Line | null>(null);

  return (
    <Line
      ref={shapeRef}
      id={element.id}
      points={element.points}
      stroke={remoteColor || (isConflict ? "#f59e0b" : element.stroke)}
      strokeWidth={remoteColor ? element.strokeWidth + 2 : isConflict ? element.strokeWidth + 3 : element.strokeWidth}
      tension={0.5}
      lineCap="round"
      lineJoin="round"
      shadowColor={isConflict ? "#f59e0b" : undefined}
      shadowBlur={isConflict ? 25 : undefined}
      shadowOpacity={isConflict ? 0.9 : undefined}
      opacity={element.opacity ?? 1}
      draggable={!readOnly && isSelected}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        const dx = e.target.x();
        const dy = e.target.y();
        e.target.x(0);
        e.target.y(0);

        const newPoints = element.points.map((pt, i) => (i % 2 === 0 ? pt + dx : pt + dy));
        onUpdate({
          points: newPoints,
        });
      }}
    />
  );
}
