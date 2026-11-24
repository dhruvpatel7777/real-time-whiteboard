"use client";

import React, { useState } from "react";
import { useCollabSession } from "@/hooks/useCollabSession";
import { usePresence } from "@/hooks/usePresence";
import { useHistory } from "@/hooks/useHistory";
import { useBoardPersistence } from "@/hooks/useBoardPersistence";
import { useCanvas } from "@/hooks/useCanvas";
import { WhiteboardCanvas } from "@/components/canvas/WhiteboardCanvas";
import { BoardHeader } from "./BoardHeader";
import { BoardToolbar } from "./BoardToolbar";
import { ZoomControls } from "./ZoomControls";
import { ShareModal } from "./ShareModal";
import { ChatSidebar } from "./ChatSidebar";
import { BoardDetail, BoardRole } from "@/types/board";
import { useBoardApi } from "@/hooks/useBoardApi";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";
import { Eye } from "lucide-react";

interface BoardEditorClientProps {
  board: BoardDetail;
  currentUser: {
    id: string;
    name: string;
    email: string;
    color: string;
  };
  role: BoardRole;
}

export function BoardEditorClient({
  board,
  currentUser,
  role,
}: BoardEditorClientProps) {
  const [boardTitle, setBoardTitle] = useState(board.title);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { updateBoard } = useBoardApi();
  const { selectedElementIds, setSelectedElementIds } = useWhiteboardStore();

  const isReadOnly = role === "viewer";

  // 1. Initialize Real-Time CRDT Collab Session with Yjs, WebSocket & IndexedDB
  const {
    ydoc,
    wsProvider,
    localOrigin,
    addElement,
    updateElement,
    deleteElements,
    bringForward,
    sendBackward,
  } = useCollabSession({
    boardId: board.id,
    userId: currentUser.id,
    userName: currentUser.name,
    userColor: currentUser.color,
    readOnly: isReadOnly,
  });

  // 2. Multiplayer Presence & Awareness Protocol
  const { updateCursor } = usePresence({
    wsProvider,
    user: {
      id: currentUser.id,
      name: currentUser.name,
      color: currentUser.color,
    },
  });

  // 3. Per-User and Global Undo/Redo via Yjs UndoManager
  const { undo, redo, canUndo, canRedo } = useHistory({
    ydoc,
    localOrigin,
  });

  // 4. Persistence to SQLite via Debounced Auto-save
  useBoardPersistence({
    boardId: board.id,
    ydoc,
    readOnly: isReadOnly,
  });

  // 5. Canvas Engine
  const {
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
  } = useCanvas({
    onAddElement: addElement,
    onUpdateElement: updateElement,
    onDeleteElements: deleteElements,
    onCursorMove: updateCursor,
    onUndo: undo,
    onRedo: redo,
    readOnly: isReadOnly,
    userId: currentUser.id,
  });

  const handleUpdateTitle = async (newTitle: string) => {
    setBoardTitle(newTitle);
    try {
      await updateBoard(board.id, { title: newTitle });
    } catch (err: unknown) {
      console.error("Failed to update board title:", err);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedElementIds.length > 0 && !isReadOnly) {
      deleteElements(selectedElementIds);
      setSelectedElementIds([]);
    }
  };

  const handleBringForward = () => {
    if (selectedElementIds.length > 0 && !isReadOnly) {
      bringForward(selectedElementIds[0]);
    }
  };

  const handleSendBackward = () => {
    if (selectedElementIds.length > 0 && !isReadOnly) {
      sendBackward(selectedElementIds[0]);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans">
      {/* Viewer-only Notice */}
      {isReadOnly && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-md">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>You have View-Only access to this whiteboard.</span>
        </div>
      )}

      {/* Top Header */}
      <BoardHeader
        boardId={board.id}
        boardTitle={boardTitle}
        userRole={role}
        currentUserId={currentUser.id}
        stageRef={stageRef}
        onUpdateTitle={handleUpdateTitle}
        onOpenShareModal={() => setIsShareOpen(true)}
      />

      {/* Main Konva Canvas Engine */}
      <div className="w-full h-full">
        <WhiteboardCanvas
          stageRef={stageRef}
          transformerRef={transformerRef}
          drawingElement={drawingElement}
          isSpacePressed={isSpacePressed}
          isPanning={isPanning}
          readOnly={isReadOnly}
          onUpdateElement={updateElement}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onMouseLeave={handleStageMouseLeave}
        />
      </div>

      {/* Bottom Floating Toolbar */}
      <BoardToolbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onDeleteSelected={handleDeleteSelected}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        readOnly={isReadOnly}
      />

      {/* Zoom Controls */}
      <ZoomControls />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        boardId={board.id}
        currentUserRole={role}
        currentUserId={currentUser.id}
      />

      {/* Real-Time Text Chat Sidebar */}
      <ChatSidebar
        boardId={board.id}
        userId={currentUser.id}
        userName={currentUser.name}
        userColor={currentUser.color}
      />
    </div>
  );
}
