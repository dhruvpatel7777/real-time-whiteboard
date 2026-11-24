"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Stage, Layer, Transformer, Rect, Circle, Line } from "react-konva";
import Konva from "konva";
import { CanvasElement, ToolType, UserPresence } from "@/types/canvas";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";
import { RectangleNode } from "./shapes/RectangleNode";
import { CircleNode } from "./shapes/CircleNode";
import { FreehandNode } from "./shapes/FreehandNode";
import { LineNode } from "./shapes/LineNode";
import { TextNode } from "./shapes/TextNode";
import { LiveCursors } from "./LiveCursors";

interface KonvaStageProps {
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

export default function KonvaStage({
  stageRef,
  transformerRef,
  drawingElement,
  isSpacePressed,
  isPanning,
  readOnly = false,
  onUpdateElement,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
}: KonvaStageProps) {
  const {
    stagePos,
    stageScale,
    selectedElementIds,
    setSelectedElementIds,
    elements,
    elementOrder,
    remoteUsers,
    conflictedElementIds,
    selectedTool,
  } = useWhiteboardStore();

  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Attach Transformer to selected nodes
  useEffect(() => {
    const stage = stageRef.current;
    const tr = transformerRef.current;
    if (!stage || !tr) return;

    if (selectedElementIds.length === 0 || readOnly) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    const selectedNodes: Konva.Node[] = [];
    selectedElementIds.forEach((id) => {
      const node = stage.findOne(`#${id}`);
      if (node) {
        selectedNodes.push(node);
      }
    });

    tr.nodes(selectedNodes);
    tr.getLayer()?.batchDraw();
  }, [selectedElementIds, elements, readOnly, stageRef, transformerRef]);

  // Compute remote selections: elementId -> remote user color
  const remoteSelectionMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.values(remoteUsers).forEach((user) => {
      user.selection.forEach((elId) => {
        map[elId] = user.color || "#38bdf8";
      });
    });
    return map;
  }, [remoteUsers]);

  // Touch gesture support: Pinch-zoom & touch drag
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lastDistRef = useRef<number>(0);

  const getDistance = (p1: Touch, p2: Touch) => {
    return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));
  };

  const getCenter = (p1: Touch, p2: Touch) => {
    return {
      x: (p1.clientX + p2.clientX) / 2,
      y: (p1.clientY + p2.clientY) / 2,
    };
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      // 2 fingers = Pinch-zoom & pan
      const dist = getDistance(touch1, touch2);
      const center = getCenter(touch1, touch2);

      if (!lastCenterRef.current) {
        lastCenterRef.current = center;
        lastDistRef.current = dist;
        return;
      }

      const pointTo = {
        x: (center.x - stagePos.x) / stageScale,
        y: (center.y - stagePos.y) / stageScale,
      };

      const scale = stageScale * (dist / lastDistRef.current);
      const clampedScale = Math.max(0.1, Math.min(scale, 6));

      const dx = center.x - lastCenterRef.current.x;
      const dy = center.y - lastCenterRef.current.y;

      const newPos = {
        x: center.x - pointTo.x * clampedScale + dx,
        y: center.y - pointTo.y * clampedScale + dy,
      };

      useWhiteboardStore.getState().setStageScale(clampedScale);
      useWhiteboardStore.getState().setStagePos(newPos);

      lastDistRef.current = dist;
      lastCenterRef.current = center;
    } else {
      onMouseMove(e);
    }
  };

  const handleTouchEnd = () => {
    lastCenterRef.current = null;
    lastDistRef.current = 0;
    onMouseUp();
  };

  const cursorClass = isSpacePressed || isPanning
    ? "cursor-grab active:cursor-grabbing"
    : selectedTool === "select"
    ? "cursor-default"
    : "cursor-crosshair";

  return (
    <div className={`relative w-full h-full select-none overflow-hidden ${cursorClass}`}>
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onMouseDown}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Layer>
          {/* Render Elements in CRDT z-index order */}
          {elementOrder.map((id) => {
            const el = elements[id];
            if (!el) return null;

            const isSelected = selectedElementIds.includes(id);
            const isConflict =
              !!conflictedElementIds[id] &&
              Date.now() - conflictedElementIds[id] < 3000;
            const remoteColor = remoteSelectionMap[id];

            const handleSelect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
              if (selectedTool === "select") {
                e.cancelBubble = true;
                if ((e.evt as MouseEvent).shiftKey) {
                  // Multi-select with shift
                  if (selectedElementIds.includes(id)) {
                    setSelectedElementIds(selectedElementIds.filter((item) => item !== id));
                  } else {
                    setSelectedElementIds([...selectedElementIds, id]);
                  }
                } else {
                  setSelectedElementIds([id]);
                }
              }
            };

            if (el.type === "rectangle") {
              return (
                <RectangleNode
                  key={el.id}
                  element={el}
                  isSelected={isSelected}
                  isConflict={isConflict}
                  remoteColor={remoteColor}
                  readOnly={readOnly}
                  onSelect={handleSelect}
                  onUpdate={(updates) => onUpdateElement(el.id, updates)}
                />
              );
            }

            if (el.type === "circle") {
              return (
                <CircleNode
                  key={el.id}
                  element={el}
                  isSelected={isSelected}
                  isConflict={isConflict}
                  remoteColor={remoteColor}
                  readOnly={readOnly}
                  onSelect={handleSelect}
                  onUpdate={(updates) => onUpdateElement(el.id, updates)}
                />
              );
            }

            if (el.type === "freehand") {
              return (
                <FreehandNode
                  key={el.id}
                  element={el}
                  isSelected={isSelected}
                  isConflict={isConflict}
                  remoteColor={remoteColor}
                  readOnly={readOnly}
                  onSelect={handleSelect}
                  onUpdate={(updates) => onUpdateElement(el.id, updates)}
                />
              );
            }

            if (el.type === "line" || el.type === "arrow") {
              return (
                <LineNode
                  key={el.id}
                  element={el}
                  isSelected={isSelected}
                  isConflict={isConflict}
                  remoteColor={remoteColor}
                  readOnly={readOnly}
                  onSelect={handleSelect}
                  onUpdate={(updates) => onUpdateElement(el.id, updates)}
                />
              );
            }

            if (el.type === "text") {
              return (
                <TextNode
                  key={el.id}
                  element={el}
                  isSelected={isSelected}
                  isConflict={isConflict}
                  remoteColor={remoteColor}
                  readOnly={readOnly}
                  onSelect={handleSelect}
                  onUpdate={(updates) => onUpdateElement(el.id, updates)}
                  stagePos={stagePos}
                  stageScale={stageScale}
                />
              );
            }

            return null;
          })}

          {/* Active In-Progress Drawing Preview */}
          {drawingElement && (
            <>
              {drawingElement.type === "rectangle" && (
                <Rect
                  x={drawingElement.x}
                  y={drawingElement.y}
                  width={drawingElement.width}
                  height={drawingElement.height}
                  fill={drawingElement.fill === "transparent" ? undefined : drawingElement.fill}
                  stroke={drawingElement.stroke}
                  strokeWidth={drawingElement.strokeWidth}
                  cornerRadius={4}
                  listening={false}
                />
              )}
              {drawingElement.type === "circle" && (
                <Circle
                  x={drawingElement.x}
                  y={drawingElement.y}
                  radius={drawingElement.radius}
                  fill={drawingElement.fill === "transparent" ? undefined : drawingElement.fill}
                  stroke={drawingElement.stroke}
                  strokeWidth={drawingElement.strokeWidth}
                  listening={false}
                />
              )}
              {drawingElement.type === "freehand" && (
                <Line
                  points={drawingElement.points}
                  stroke={drawingElement.stroke}
                  strokeWidth={drawingElement.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                />
              )}
              {(drawingElement.type === "line" || drawingElement.type === "arrow") && (
                <Line
                  points={drawingElement.points}
                  stroke={drawingElement.stroke}
                  strokeWidth={drawingElement.strokeWidth}
                  lineCap="round"
                  listening={false}
                />
              )}
            </>
          )}

          {/* Konva Transformer for resizing and rotating */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Minimum size constraint
              if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
                return oldBox;
              }
              return newBox;
            }}
            rotateEnabled={true}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "middle-left",
              "middle-right",
              "top-center",
              "bottom-center",
            ]}
            anchorStroke="#6366f1"
            anchorFill="#ffffff"
            anchorSize={9}
            anchorCornerRadius={2}
            borderStroke="#6366f1"
            borderDash={[4, 4]}
          />
        </Layer>
      </Stage>

      {/* Multiplayer Live Cursors Overlay */}
      <LiveCursors
        remoteUsers={remoteUsers}
        stagePos={stagePos}
        stageScale={stageScale}
      />
    </div>
  );
}
