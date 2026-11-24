export type ToolType =
  | "select"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "freehand"
  | "text"
  | "eraser";

export type ShapeType = "rectangle" | "circle" | "line" | "arrow" | "freehand" | "text";

export interface BaseElement {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
  opacity?: number;
  rotation?: number;
  createdBy: string;
  updatedBy: string;
  updatedAt: number;
}

export interface RectangleElement extends BaseElement {
  type: "rectangle";
  width: number;
  height: number;
  cornerRadius?: number;
}

export interface CircleElement extends BaseElement {
  type: "circle";
  radius: number;
}

export interface LineElement extends BaseElement {
  type: "line" | "arrow";
  points: number[]; // [x1, y1, x2, y2]
}

export interface FreehandElement extends BaseElement {
  type: "freehand";
  points: number[]; // [x1, y1, x2, y2, ...]
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily?: string;
  width?: number;
}

export type CanvasElement =
  | RectangleElement
  | CircleElement
  | LineElement
  | FreehandElement
  | TextElement;

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  selection: string[];
  lastActive: number;
}

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

export type SyncState = "disconnected" | "connecting" | "connected" | "syncing" | "offline";
