"use client";

import React, { useRef, useEffect } from "react";
import { Rect } from "react-konva";
import Konva from "konva";
import { RectangleElement } from "@/types/canvas";

interface RectangleNodeProps {
  element: RectangleElement;
  isSelected: boolean;
  isConflict: boolean;
  remoteColor?: string;
  readOnly: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onUpdate: (updates: Partial<RectangleElement>) => void;
}

export function RectangleNode({
  element,
  isSelected,
  isConflict,
  remoteColor,
  readOnly,
  onSelect,
  onUpdate,
}: RectangleNodeProps) {
  const shapeRef = useRef<Konva.Rect | null>(null);

  return (
    <Rect
      ref={shapeRef}
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      fill={element.fill === "transparent" ? undefined : element.fill}
      stroke={remoteColor || (isConflict ? "#f59e0b" : element.stroke)}
      strokeWidth={remoteColor ? element.strokeWidth + 2 : isConflict ? element.strokeWidth + 3 : element.strokeWidth}
      dash={remoteColor ? [6, 4] : undefined}
      shadowColor={isConflict ? "#f59e0b" : undefined}
      shadowBlur={isConflict ? 25 : undefined}
      shadowOpacity={isConflict ? 0.9 : undefined}
      cornerRadius={element.cornerRadius || 4}
      opacity={element.opacity ?? 1}
      rotation={element.rotation || 0}
      draggable={!readOnly && isSelected}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onUpdate({
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onUpdate({
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: Math.round(node.rotation()),
        });
      }}
    />
  );
}
