"use client";

import { useCallback } from "react";
import Konva from "konva";
import { CanvasElement } from "@/types/canvas";

export function useExport() {
  // 1. Export as PNG (High-resolution via Konva stage)
  const exportAsPng = useCallback(
    (stage: Konva.Stage | null, boardTitle = "whiteboard") => {
      if (!stage) return;

      const dataUrl = stage.toDataURL({
        pixelRatio: 2, // 2x for sharp retina quality
        mimeType: "image/png",
      });

      const link = document.createElement("a");
      link.download = `${boardTitle.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    []
  );

  // 2. Export as JSON (Full board data specification)
  const exportAsJson = useCallback(
    (
      elements: Record<string, CanvasElement>,
      elementOrder: string[],
      boardTitle = "whiteboard"
    ) => {
      const orderedElements = elementOrder
        .map((id) => elements[id])
        .filter(Boolean);

      const payload = {
        app: "CollabBoard",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        boardTitle,
        elementsCount: orderedElements.length,
        elements: orderedElements,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${boardTitle.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    []
  );

  // 3. Export as SVG (Vector graphic generated client-side)
  const exportAsSvg = useCallback(
    (
      elements: Record<string, CanvasElement>,
      elementOrder: string[],
      boardTitle = "whiteboard"
    ) => {
      const orderedElements = elementOrder
        .map((id) => elements[id])
        .filter(Boolean);

      // Compute bounding box
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      if (orderedElements.length === 0) {
        minX = 0;
        minY = 0;
        maxX = 800;
        maxY = 600;
      } else {
        orderedElements.forEach((el) => {
          if (el.type === "rectangle" || el.type === "text") {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + (el.width || 100));
            maxY = Math.max(maxY, el.y + (el.height || 100));
          } else if (el.type === "circle") {
            minX = Math.min(minX, el.x - el.radius);
            minY = Math.min(minY, el.y - el.radius);
            maxX = Math.max(maxX, el.x + el.radius);
            maxY = Math.max(maxY, el.y + el.radius);
          } else if (el.type === "freehand" || el.type === "line" || el.type === "arrow") {
            for (let i = 0; i < el.points.length; i += 2) {
              minX = Math.min(minX, el.points[i]);
              minY = Math.min(minY, el.points[i + 1]);
              maxX = Math.max(maxX, el.points[i]);
              maxY = Math.max(maxY, el.points[i + 1]);
            }
          }
        });
      }

      // Add padding
      const padding = 40;
      const x = Math.floor(minX - padding);
      const y = Math.floor(minY - padding);
      const width = Math.ceil(maxX - minX + padding * 2);
      const height = Math.ceil(maxY - minY + padding * 2);

      let svgNodes = "";

      orderedElements.forEach((el) => {
        const fill = el.fill === "transparent" ? "none" : el.fill || "none";
        const stroke = el.stroke || "#ffffff";
        const strokeWidth = el.strokeWidth || 2;
        const opacity = el.opacity !== undefined ? el.opacity : 1;
        const transform = el.rotation ? `transform="rotate(${el.rotation} ${el.x} ${el.y})"` : "";

        if (el.type === "rectangle") {
          svgNodes += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" rx="${el.cornerRadius || 0}" ${transform}/>\n`;
        } else if (el.type === "circle") {
          svgNodes += `  <circle cx="${el.x}" cy="${el.y}" r="${el.radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" ${transform}/>\n`;
        } else if (el.type === "freehand") {
          if (el.points.length >= 2) {
            let d = `M ${el.points[0]} ${el.points[1]}`;
            for (let i = 2; i < el.points.length; i += 2) {
              d += ` L ${el.points[i]} ${el.points[i + 1]}`;
            }
            svgNodes += `  <path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>\n`;
          }
        } else if (el.type === "line" || el.type === "arrow") {
          if (el.points.length >= 4) {
            svgNodes += `  <line x1="${el.points[0]}" y1="${el.points[1]}" x2="${el.points[2]}" y2="${el.points[3]}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="${opacity}"/>\n`;
          }
        } else if (el.type === "text") {
          svgNodes += `  <text x="${el.x}" y="${el.y + (el.fontSize || 20)}" fill="${stroke}" font-size="${el.fontSize || 20}" font-family="sans-serif" opacity="${opacity}" ${transform}>${el.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>\n`;
        }
      });

      const svgContent = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}" width="${width}" height="${height}" style="background-color: #0a0a0a;">
  <defs/>
${svgNodes}</svg>`;

      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${boardTitle.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.svg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    []
  );

  return {
    exportAsPng,
    exportAsJson,
    exportAsSvg,
  };
}
