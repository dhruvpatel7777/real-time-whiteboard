import { create } from "zustand";
import { CanvasElement, ToolType, UserPresence, SyncState } from "@/types/canvas";

interface WhiteboardState {
  // Current drawing settings
  selectedTool: ToolType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;

  // Canvas Viewport transform
  stagePos: { x: number; y: number };
  stageScale: number;

  // Selected element IDs
  selectedElementIds: string[];

  // In-memory elements synced from Yjs
  elements: Record<string, CanvasElement>;
  elementOrder: string[];

  // Multiplayer presence
  remoteUsers: Record<string, UserPresence>;

  // Sync and offline state
  syncState: SyncState;
  hasOfflineChanges: boolean;
  lastSavedAt: string | null;

  // Conflict visualization: elementId -> timestamp
  conflictedElementIds: Record<string, number>;

  // Chat UI state
  isChatOpen: boolean;
  unreadChatCount: number;

  // User role on current board
  currentUserRole: "owner" | "editor" | "viewer";

  // Actions
  setSelectedTool: (tool: ToolType) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setStagePos: (pos: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setStageScale: (scale: number | ((prev: number) => number)) => void;
  setSelectedElementIds: (ids: string[]) => void;
  setElements: (elements: Record<string, CanvasElement>, order: string[]) => void;
  setRemoteUsers: (users: Record<string, UserPresence>) => void;
  setSyncState: (state: SyncState) => void;
  setHasOfflineChanges: (val: boolean) => void;
  setLastSavedAt: (time: string | null) => void;
  triggerConflictHighlight: (elementId: string) => void;
  setIsChatOpen: (open: boolean) => void;
  incrementUnreadChat: () => void;
  resetUnreadChat: () => void;
  setCurrentUserRole: (role: "owner" | "editor" | "viewer") => void;
  resetBoardState: () => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  selectedTool: "select",
  strokeColor: "#38bdf8", // Sky blue default
  fillColor: "transparent",
  strokeWidth: 3,
  fontSize: 20,

  stagePos: { x: 0, y: 0 },
  stageScale: 1,

  selectedElementIds: [],
  elements: {},
  elementOrder: [],

  remoteUsers: {},
  syncState: "connecting",
  hasOfflineChanges: false,
  lastSavedAt: null,

  conflictedElementIds: {},
  isChatOpen: false,
  unreadChatCount: 0,
  currentUserRole: "editor",

  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setFontSize: (size) => set({ fontSize: size }),
  setStagePos: (pos) =>
    set((state) => ({
      stagePos: typeof pos === "function" ? pos(state.stagePos) : pos,
    })),
  setStageScale: (scale) =>
    set((state) => ({
      stageScale: typeof scale === "function" ? scale(state.stageScale) : scale,
    })),
  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),
  setElements: (elements, order) => set({ elements, elementOrder: order }),
  setRemoteUsers: (users) => set({ remoteUsers: users }),
  setSyncState: (syncState) => set({ syncState }),
  setHasOfflineChanges: (hasOfflineChanges) => set({ hasOfflineChanges }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),

  triggerConflictHighlight: (elementId) =>
    set((state) => {
      const now = Date.now();
      return {
        conflictedElementIds: {
          ...state.conflictedElementIds,
          [elementId]: now,
        },
      };
    }),

  setIsChatOpen: (isChatOpen) =>
    set((state) => ({
      isChatOpen,
      unreadChatCount: isChatOpen ? 0 : state.unreadChatCount,
    })),
  incrementUnreadChat: () =>
    set((state) => ({
      unreadChatCount: state.isChatOpen ? 0 : state.unreadChatCount + 1,
    })),
  resetUnreadChat: () => set({ unreadChatCount: 0 }),
  setCurrentUserRole: (role) => set({ currentUserRole: role }),

  resetBoardState: () =>
    set({
      selectedTool: "select",
      selectedElementIds: [],
      elements: {},
      elementOrder: [],
      remoteUsers: {},
      conflictedElementIds: {},
      stagePos: { x: 0, y: 0 },
      stageScale: 1,
    }),
}));
