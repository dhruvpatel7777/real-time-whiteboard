"use client";

import React, { useRef, useState } from "react";
import { Text } from "react-konva";
import Konva from "konva";
import { TextElement } from "@/types/canvas";

interface TextNodeProps {
  element: TextElement;
  isSelected: boolean;
  isConflict: boolean;
  remoteColor?: string;
  readOnly: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onUpdate: (updates: Partial<TextElement>) => void;
  stagePos: { x: number; y: number };
  stageScale: number;
}

export function TextNode({
  element,
  isSelected,
  isConflict,
  remoteColor,
  readOnly,
  onSelect,
  onUpdate,
  stagePos,
  stageScale,
}: TextNodeProps) {
  const textRef = useRef<Konva.Text | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(element.text);

  const handleDblClick = () => {
    if (readOnly) return;
    setIsEditing(true);
    setEditText(element.text);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate({ text: editText });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      onUpdate({ text: editText });
    }
  };

  // Screen coordinates for inline HTML textarea
  const screenX = element.x * stageScale + stagePos.x;
  const screenY = element.y * stageScale + stagePos.y;

  return (
    <>
      <Text
        ref={textRef}
        id={element.id}
        x={element.x}
        y={element.y}
        text={element.text}
        fontSize={element.fontSize || 20}
        fontFamily="sans-serif"
        fill={remoteColor || (isConflict ? "#f59e0b" : element.stroke)}
        shadowColor={isConflict ? "#f59e0b" : undefined}
        shadowBlur={isConflict ? 25 : undefined}
        shadowOpacity={isConflict ? 0.9 : undefined}
        opacity={isEditing ? 0 : element.opacity ?? 1}
        rotation={element.rotation || 0}
        draggable={!readOnly && isSelected && !isEditing}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        onDragEnd={(e) => {
          onUpdate({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = textRef.current;
          if (!node) return;
          const scaleX = node.scaleX();
          node.scaleX(1);
          node.scaleY(1);
          onUpdate({
            x: node.x(),
            y: node.y(),
            fontSize: Math.max(12, Math.round(node.fontSize() * scaleX)),
            rotation: Math.round(node.rotation()),
          });
        }}
      />

      {isEditing && (
        <div
          style={{
            position: "fixed",
            left: `${screenX}px`,
            top: `${screenY}px`,
            zIndex: 100,
            transform: `scale(${stageScale})`,
            transformOrigin: "top left",
          }}
        >
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="bg-neutral-900 text-white border border-indigo-500 rounded p-1 outline-none resize-none shadow-xl"
            style={{
              fontSize: `${element.fontSize || 20}px`,
              fontFamily: "sans-serif",
              minWidth: "150px",
              minHeight: "40px",
              lineHeight: 1.2,
            }}
          />
        </div>
      )}
    </>
  );
}
