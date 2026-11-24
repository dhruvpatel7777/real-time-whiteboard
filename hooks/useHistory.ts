"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";

interface UseHistoryOptions {
  ydoc: Y.Doc | null;
  localOrigin: string;
}

export function useHistory({ ydoc, localOrigin }: UseHistoryOptions) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  useEffect(() => {
    if (!ydoc) return;

    const elementsMap = ydoc.getMap("elements");
    const elementOrder = ydoc.getArray("elementOrder");

    // Configure UndoManager with trackedOrigins: only track changes originating locally from this user
    // This ensures per-user undo/redo without rolling back concurrent edits from other collaborators
    const undoManager = new Y.UndoManager([elementsMap, elementOrder], {
      trackedOrigins: new Set([localOrigin]),
      captureTimeout: 500, // Group rapid edits (e.g. dragging or typing) into single undo step
    });

    undoManagerRef.current = undoManager;

    const updateStackState = () => {
      setCanUndo(undoManager.undoStack.length > 0);
      setCanRedo(undoManager.redoStack.length > 0);
    };

    undoManager.on("stack-item-added", updateStackState);
    undoManager.on("stack-item-popped", updateStackState);
    undoManager.on("stack-cleared", updateStackState);

    updateStackState();

    return () => {
      undoManager.destroy();
      undoManagerRef.current = null;
    };
  }, [ydoc, localOrigin]);

  const undo = useCallback(() => {
    if (undoManagerRef.current && undoManagerRef.current.undoStack.length > 0) {
      undoManagerRef.current.undo();
      setCanUndo(undoManagerRef.current.undoStack.length > 0);
      setCanRedo(undoManagerRef.current.redoStack.length > 0);
    }
  }, []);

  const redo = useCallback(() => {
    if (undoManagerRef.current && undoManagerRef.current.redoStack.length > 0) {
      undoManagerRef.current.redo();
      setCanUndo(undoManagerRef.current.undoStack.length > 0);
      setCanRedo(undoManagerRef.current.redoStack.length > 0);
    }
  }, []);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
