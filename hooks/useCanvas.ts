"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Konva from "konva";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";
import { CanvasElement, ToolType } from "@/types/canvas";

interface UseCanvasOptions {
  onAddElement: (element: CanvasElement) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElements: (ids: string[]) => void;
  onCursorMove: (cursor: { x: number; y: number } | null) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  readOnly?: boolean;
  userId: string;
}

export function useCanvas({
  onAddElement,
  onUpdateElement,
  onDeleteElements,
  onCursorMove,
  onUndo,
  onRedo,
  readOnly = false,
  userId,
}: UseCanvasOptions) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  const {
    selectedTool,
    setSelectedTool,
    strokeColor,
    fillColor,
    strokeWidth,
    fontSize,
    stagePos,
    setStagePos,
    stageScale,
    setStageScale,
    selectedElementIds,
    setSelectedElementIds,
    elements,
  } = useWhiteboardStore();

  const [drawingElement, setDrawingElement] = useState<CanvasElement | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const isMouseDownRef = useRef(false);

  // Convert screen coordinates to canvas virtual space
  const getCanvasPoint = useCallback(
    (pointer: { x: number; y: number }): { x: number; y: number } => {
      return {
        x: (pointer.x - stagePos.x) / stageScale,
        y: (pointer.y - stagePos.y) / stageScale,
      };
    },
    [stagePos, stageScale]
  );

  // Wheel zoom handling
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.08;
      const oldScale = stageScale;
      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

      // Limit zoom between 0.1x and 6x
      const clampedScale = Math.max(0.1, Math.min(newScale, 6));

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      setStageScale(clampedScale);
      setStagePos(newPos);
    },
    [stageScale, stagePos, setStageScale, setStagePos]
  );

  // Stage Mouse Down
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const point = getCanvasPoint(pointer);
      isMouseDownRef.current = true;

      // Pan mode (Spacebar or middle mouse or select tool clicking empty space)
      const isMiddleClick = (e.evt as MouseEvent).button === 1;
      if (isSpacePressed || isMiddleClick) {
        setIsPanning(true);
        return;
      }

      const clickedOnEmpty = e.target === stage;

      if (selectedTool === "select") {
        if (clickedOnEmpty) {
          setSelectedElementIds([]);
        }
        return;
      }

      if (readOnly) return;

      // Generate new element ID
      const newId = `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = Date.now();

      if (selectedTool === "rectangle") {
        setDrawingElement({
          id: newId,
          type: "rectangle",
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          stroke: strokeColor,
          fill: fillColor,
          strokeWidth,
          opacity: 1,
          createdBy: userId,
          updatedBy: userId,
          updatedAt: now,
        });
      } else if (selectedTool === "circle") {
        setDrawingElement({
          id: newId,
          type: "circle",
          x: point.x,
          y: point.y,
          radius: 0,
          stroke: strokeColor,
          fill: fillColor,
          strokeWidth,
          opacity: 1,
          createdBy: userId,
          updatedBy: userId,
          updatedAt: now,
        });
      } else if (selectedTool === "freehand") {
        setDrawingElement({
          id: newId,
          type: "freehand",
          x: 0,
          y: 0,
          points: [point.x, point.y],
          stroke: strokeColor,
          strokeWidth,
          opacity: 1,
          createdBy: userId,
          updatedBy: userId,
          updatedAt: now,
        });
      } else if (selectedTool === "line" || selectedTool === "arrow") {
        setDrawingElement({
          id: newId,
          type: selectedTool,
          x: 0,
          y: 0,
          points: [point.x, point.y, point.x, point.y],
          stroke: strokeColor,
          strokeWidth,
          opacity: 1,
          createdBy: userId,
          updatedBy: userId,
          updatedAt: now,
        });
      } else if (selectedTool === "text") {
        const textElement: CanvasElement = {
          id: newId,
          type: "text",
          x: point.x,
          y: point.y,
          text: "Double click to edit",
          fontSize,
          stroke: strokeColor,
          strokeWidth: 1,
          opacity: 1,
          createdBy: userId,
          updatedBy: userId,
          updatedAt: now,
        };
        onAddElement(textElement);
        setSelectedElementIds([newId]);
        setSelectedTool("select");
      }
    },
    [
      getCanvasPoint,
      isSpacePressed,
      selectedTool,
      readOnly,
      strokeColor,
      fillColor,
      strokeWidth,
      fontSize,
      userId,
      onAddElement,
      setSelectedElementIds,
      setSelectedTool,
    ]
  );

  // Stage Mouse Move
  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const point = getCanvasPoint(pointer);

      // Broadcast cursor to other users
      onCursorMove(point);

      if (!isMouseDownRef.current) return;

      // Panning active
      if (isPanning) {
        return;
      }

      // Drawing active
      if (drawingElement) {
        if (drawingElement.type === "rectangle") {
          const width = point.x - drawingElement.x;
          const height = point.y - drawingElement.y;
          setDrawingElement({
            ...drawingElement,
            width,
            height,
          });
        } else if (drawingElement.type === "circle") {
          const dx = point.x - drawingElement.x;
          const dy = point.y - drawingElement.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          setDrawingElement({
            ...drawingElement,
            radius,
          });
        } else if (drawingElement.type === "freehand") {
          setDrawingElement({
            ...drawingElement,
            points: [...drawingElement.points, point.x, point.y],
          });
        } else if (drawingElement.type === "line" || drawingElement.type === "arrow") {
          setDrawingElement({
            ...drawingElement,
            points: [drawingElement.points[0], drawingElement.points[1], point.x, point.y],
          });
        }
      }
    },
    [getCanvasPoint, onCursorMove, isPanning, drawingElement]
  );

  // Stage Mouse Up
  const handleStageMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
    setIsPanning(false);

    if (drawingElement) {
      let shouldCommit = false;

      if (drawingElement.type === "rectangle") {
        const w = Math.abs(drawingElement.width || 0);
        const h = Math.abs(drawingElement.height || 0);
        if (w > 5 && h > 5) {
          // Normalize negative width/height
          let x = drawingElement.x;
          let y = drawingElement.y;
          let width = drawingElement.width || 0;
          let height = drawingElement.height || 0;
          if (width < 0) {
            x += width;
            width = Math.abs(width);
          }
          if (height < 0) {
            y += height;
            height = Math.abs(height);
          }
          onAddElement({
            ...drawingElement,
            x,
            y,
            width,
            height,
          });
          shouldCommit = true;
        }
      } else if (drawingElement.type === "circle") {
        if ((drawingElement.radius || 0) > 4) {
          onAddElement(drawingElement);
          shouldCommit = true;
        }
      } else if (drawingElement.type === "freehand") {
        if (drawingElement.points.length >= 4) {
          onAddElement(drawingElement);
          shouldCommit = true;
        }
      } else if (drawingElement.type === "line" || drawingElement.type === "arrow") {
        const dx = drawingElement.points[2] - drawingElement.points[0];
        const dy = drawingElement.points[3] - drawingElement.points[1];
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          onAddElement(drawingElement);
          shouldCommit = true;
        }
      }

      setDrawingElement(null);

      // After drawing, switch back to select tool for convenience
      if (shouldCommit && selectedTool !== "freehand") {
        setSelectedTool("select");
      }
    }
  }, [drawingElement, onAddElement, selectedTool, setSelectedTool]);

  // Stage Leave
  const handleStageMouseLeave = useCallback(() => {
    isMouseDownRef.current = false;
    setIsPanning(false);
    onCursorMove(null);
  }, [onCursorMove]);

  // Keyboard Shortcuts (Delete, Space, Tools)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Undo & Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      if (e.code === "Space" && !isSpacePressed) {
        setIsSpacePressed(true);
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementIds.length > 0 && !readOnly) {
          onDeleteElements(selectedElementIds);
          setSelectedElementIds([]);
        }
      }

      // Quick tool shortcuts
      if (e.key === "v" || e.key === "V") setSelectedTool("select");
      if (e.key === "r" || e.key === "R") setSelectedTool("rectangle");
      if (e.key === "c" || e.key === "C") setSelectedTool("circle");
      if (e.key === "p" || e.key === "P") setSelectedTool("freehand");
      if (e.key === "t" || e.key === "T") setSelectedTool("text");
      if (e.key === "l" || e.key === "L") setSelectedTool("line");
      if (e.key === "a" || e.key === "A") setSelectedTool("arrow");
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    isSpacePressed,
    selectedElementIds,
    readOnly,
    onDeleteElements,
    onUndo,
    onRedo,
    setSelectedElementIds,
    setSelectedTool,
  ]);

  return {
    stageRef,
    transformerRef,
    drawingElement,
    isSpacePressed,
    isPanning,
    handleWheel,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    handleStageMouseLeave,
    getCanvasPoint,
  };
}
