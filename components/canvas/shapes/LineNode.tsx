"use client";

import React, { useRef } from "react";
import { Line, Arrow } from "react-konva";
import Konva from "konva";
import { LineElement } from "@/types/canvas";

interface LineNodeProps {
  element: LineElement;
  isSelected: boolean;
  isConflict: boolean;
  remoteColor?: string;
  readOnly: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onUpdate: (updates: Partial<LineElement>) => void;
}

export function LineNode({
  element,
  isSelected,
  isConflict,
  remoteColor,
  readOnly,
  onSelect,
  onUpdate,
}: LineNodeProps) {
  const lineRef = useRef<Konva.Line | null>(null);
  const arrowRef = useRef<Konva.Arrow | null>(null);

  const strokeColor = remoteColor || (isConflict ? "#f59e0b" : element.stroke);
  const strokeWidth = remoteColor
    ? element.strokeWidth + 2
    : isConflict
    ? element.strokeWidth + 3
    : element.strokeWidth;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const dx = e.target.x();
    const dy = e.target.y();
    e.target.x(0);
    e.target.y(0);

    const newPoints = element.points.map((pt, i) => (i % 2 === 0 ? pt + dx : pt + dy));
    onUpdate({ points: newPoints });
  };

  if (element.type === "arrow") {
    return (
      <Arrow
        ref={arrowRef}
        id={element.id}
        points={element.points}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        pointerLength={10}
        pointerWidth={10}
        fill={strokeColor}
        lineCap="round"
        lineJoin="round"
        shadowColor={isConflict ? "#f59e0b" : undefined}
        shadowBlur={isConflict ? 25 : undefined}
        shadowOpacity={isConflict ? 0.9 : undefined}
        opacity={element.opacity ?? 1}
        draggable={!readOnly && isSelected}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
      />
    );
  }

  return (
    <Line
      ref={lineRef}
      id={element.id}
      points={element.points}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      lineCap="round"
      lineJoin="round"
      shadowColor={isConflict ? "#f59e0b" : undefined}
      shadowBlur={isConflict ? 25 : undefined}
      shadowOpacity={isConflict ? 0.9 : undefined}
      opacity={element.opacity ?? 1}
      draggable={!readOnly && isSelected}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={handleDragEnd}
    />
  );
}
