"use client";

import React, { useState } from "react";
import {
  MousePointer2,
  Square,
  Circle as CircleIcon,
  Minus,
  ArrowUpRight,
  Pencil,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Layers,
  ArrowUp,
  ArrowDown,
  Palette,
} from "lucide-react";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";
import { ToolType } from "@/types/canvas";

interface BoardToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDeleteSelected: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  readOnly?: boolean;
}

const colorPalette = [
  "#ffffff", // White
  "#38bdf8", // Sky Blue
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#eab308", // Yellow
  "#a855f7", // Purple
  "#fb923c", // Orange
  "#64748b", // Slate
];

const strokeWidths = [2, 4, 6, 8];

export function BoardToolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDeleteSelected,
  onBringForward,
  onSendBackward,
  readOnly = false,
}: BoardToolbarProps) {
  const {
    selectedTool,
    setSelectedTool,
    strokeColor,
    setStrokeColor,
    fillColor,
    setFillColor,
    strokeWidth,
    setStrokeWidth,
    selectedElementIds,
  } = useWhiteboardStore();

  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools: { id: ToolType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: "select", label: "Select (V)", icon: <MousePointer2 className="w-4 h-4" />, shortcut: "V" },
    { id: "rectangle", label: "Rectangle (R)", icon: <Square className="w-4 h-4" />, shortcut: "R" },
    { id: "circle", label: "Circle (C)", icon: <CircleIcon className="w-4 h-4" />, shortcut: "C" },
    { id: "line", label: "Line (L)", icon: <Minus className="w-4 h-4" />, shortcut: "L" },
    { id: "arrow", label: "Arrow (A)", icon: <ArrowUpRight className="w-4 h-4" />, shortcut: "A" },
    { id: "freehand", label: "Draw (P)", icon: <Pencil className="w-4 h-4" />, shortcut: "P" },
    { id: "text", label: "Text (T)", icon: <Type className="w-4 h-4" />, shortcut: "T" },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl backdrop-blur-md">
      {/* Tool Selection Group */}
      <div className="flex items-center gap-1 pr-1.5 border-r border-neutral-800">
        {tools.map((t) => {
          const isActive = selectedTool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTool(t.id)}
              disabled={readOnly && t.id !== "select"}
              title={t.label}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                  : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
              }`}
            >
              {t.icon}
            </button>
          );
        })}
      </div>

      {/* Color and Stroke Selector */}
      {!readOnly && (
        <div className="relative flex items-center gap-1.5 px-1.5 border-r border-neutral-800">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-1.5 p-2 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            title="Stroke Color & Size"
          >
            <div
              className="w-4 h-4 rounded-full border border-neutral-600 shadow-inner"
              style={{ backgroundColor: strokeColor }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                width: `${Math.min(10, strokeWidth + 2)}px`,
                height: `${Math.min(10, strokeWidth + 2)}px`,
                backgroundColor: strokeColor,
              }}
            />
          </button>

          {showColorPicker && (
            <div className="absolute bottom-14 left-0 p-3 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl backdrop-blur-xl w-60 z-50">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Stroke Color
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setStrokeColor(c);
                    }}
                    className={`w-7 h-7 rounded-lg border transition-transform ${
                      strokeColor === c ? "ring-2 ring-indigo-500 scale-110 border-white" : "border-neutral-700 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Fill Color
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setFillColor("transparent")}
                  className={`w-7 h-7 rounded-lg border text-[10px] text-neutral-400 flex items-center justify-center ${
                    fillColor === "transparent" ? "ring-2 ring-indigo-500 border-white" : "border-neutral-700"
                  }`}
                >
                  None
                </button>
                {colorPalette.slice(1, 4).map((c) => (
                  <button
                    key={`fill-${c}`}
                    type="button"
                    onClick={() => setFillColor(`${c}33`)} // 20% transparent fill
                    className={`w-7 h-7 rounded-lg border transition-transform ${
                      fillColor === `${c}33` ? "ring-2 ring-indigo-500 scale-110 border-white" : "border-neutral-700 hover:scale-105"
                    }`}
                    style={{ backgroundColor: `${c}33`, borderColor: c }}
                  />
                ))}
              </div>

              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Line Width
              </div>
              <div className="flex items-center justify-between gap-2">
                {strokeWidths.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setStrokeWidth(w)}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border flex items-center justify-center ${
                      strokeWidth === w
                        ? "bg-indigo-600/20 text-indigo-400 border-indigo-500"
                        : "border-neutral-800 text-neutral-400 hover:bg-neutral-800"
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Layer Controls when element is selected */}
      {selectedElementIds.length > 0 && !readOnly && (
        <div className="flex items-center gap-1 px-1.5 border-r border-neutral-800">
          <button
            type="button"
            onClick={onBringForward}
            title="Bring Forward"
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onSendBackward}
            title="Send Backward"
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDeleteSelected}
            title="Delete Selected (Backspace/Del)"
            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Undo & Redo Group */}
      {!readOnly && (
        <div className="flex items-center gap-1 pl-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-2.5 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-2.5 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
