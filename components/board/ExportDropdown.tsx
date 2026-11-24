"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, FileImage, FileCode, FileJson, ChevronDown } from "lucide-react";
import Konva from "konva";
import { useExport } from "@/hooks/useExport";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";

interface ExportDropdownProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  boardTitle: string;
}

export function ExportDropdown({ stageRef, boardTitle }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { exportAsPng, exportAsJson, exportAsSvg } = useExport();
  const { elements, elementOrder } = useWhiteboardStore();

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium transition-all shadow-sm"
      >
        <Download className="w-3.5 h-3.5 text-neutral-400" />
        <span className="hidden sm:inline">Export</span>
        <ChevronDown className="w-3 h-3 text-neutral-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl p-1.5 z-50 backdrop-blur-md">
          <div className="px-2 py-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            Export Canvas
          </div>

          <button
            type="button"
            onClick={() => {
              exportAsPng(stageRef.current, boardTitle);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left"
          >
            <FileImage className="w-4 h-4 text-sky-400" />
            <div>
              <div className="font-medium">Export as PNG</div>
              <div className="text-[10px] text-neutral-500">2x High-resolution raster</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              exportAsSvg(elements, elementOrder, boardTitle);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-medium">Export as SVG</div>
              <div className="text-[10px] text-neutral-500">Scalable vector graphics</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              exportAsJson(elements, elementOrder, boardTitle);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left"
          >
            <FileJson className="w-4 h-4 text-amber-400" />
            <div>
              <div className="font-medium">Export as JSON</div>
              <div className="text-[10px] text-neutral-500">Raw element data file</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
