"use client";

import React, { useRef } from "react";
import { Circle } from "react-konva";
import Konva from "konva";
import { CircleElement } from "@/types/canvas";

interface CircleNodeProps {
  element: CircleElement;
  isSelected: boolean;
  isConflict: boolean;
  remoteColor?: string;
  readOnly: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onUpdate: (updates: Partial<CircleElement>) => void;
}

export function CircleNode({
  element,
  isSelected,
  isConflict,
  remoteColor,
  readOnly,
  onSelect,
  onUpdate,
}: CircleNodeProps) {
  const shapeRef = useRef<Konva.Circle | null>(null);

  return (
    <Circle
      ref={shapeRef}
      id={element.id}
      x={element.x}
      y={element.y}
      radius={element.radius}
      fill={element.fill === "transparent" ? undefined : element.fill}
      stroke={remoteColor || (isConflict ? "#f59e0b" : element.stroke)}
      strokeWidth={remoteColor ? element.strokeWidth + 2 : isConflict ? element.strokeWidth + 3 : element.strokeWidth}
      dash={remoteColor ? [6, 4] : undefined}
      shadowColor={isConflict ? "#f59e0b" : undefined}
      shadowBlur={isConflict ? 25 : undefined}
      shadowOpacity={isConflict ? 0.9 : undefined}
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
        node.scaleX(1);
        node.scaleY(1);

        onUpdate({
          x: node.x(),
          y: node.y(),
          radius: Math.max(5, node.radius() * scaleX),
          rotation: Math.round(node.rotation()),
        });
      }}
    />
  );
}
