"use client";

import { useEffect, useRef, useCallback } from "react";
import * as Y from "yjs";
import { useBoardApi } from "@/hooks/useBoardApi";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";
import { uint8ArrayToBase64, base64ToUint8Array } from "@/lib/binary";

interface UseBoardPersistenceOptions {
  boardId: string;
  ydoc: Y.Doc | null;
  readOnly?: boolean;
}

export function useBoardPersistence({
  boardId,
  ydoc,
  readOnly = false,
}: UseBoardPersistenceOptions) {
  const { getSnapshot, saveSnapshot } = useBoardApi();
  const { setLastSavedAt } = useWhiteboardStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHydratedRef = useRef(false);

  // 1. Initial snapshot hydration from SQLite
  useEffect(() => {
    if (!boardId || !ydoc || isHydratedRef.current) return;

    let isMounted = true;

    async function loadInitialSnapshot() {
      try {
        const data = await getSnapshot(boardId);
        if (isMounted && data?.snapshot && ydoc) {
          const snapshotBytes = base64ToUint8Array(data.snapshot);
          // Apply database snapshot to local Yjs document
          Y.applyUpdate(ydoc, snapshotBytes, "server-snapshot-hydration");
          isHydratedRef.current = true;
          setLastSavedAt(new Date().toLocaleTimeString());
        } else {
          isHydratedRef.current = true;
        }
      } catch (err) {
        console.warn("Could not load initial server snapshot:", err);
        isHydratedRef.current = true;
      }
    }

    loadInitialSnapshot();

    return () => {
      isMounted = false;
    };
  }, [boardId, ydoc, getSnapshot, setLastSavedAt]);

  // 2. Debounced auto-save function
  const persistNow = useCallback(async () => {
    if (readOnly || !ydoc || !boardId) return;

    try {
      const stateUpdate = Y.encodeStateAsUpdate(ydoc);
      // Only save if there are actual items in the doc
      const elementsMap = ydoc.getMap("elements");
      if (elementsMap.size === 0 && stateUpdate.byteLength < 50) {
        return;
      }

      const base64 = uint8ArrayToBase64(stateUpdate);
      await saveSnapshot(boardId, base64);
      setLastSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, [boardId, ydoc, readOnly, saveSnapshot, setLastSavedAt]);

  // 3. Listen to Yjs doc updates and trigger debounced auto-save (every 2.5s)
  useEffect(() => {
    if (!ydoc || readOnly) return;

    const handleUpdate = (_update: Uint8Array, origin: unknown) => {
      // Don't auto-save immediately on server-snapshot-hydration
      if (origin === "server-snapshot-hydration") return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        persistNow();
      }, 2500);
    };

    ydoc.on("update", handleUpdate);

    return () => {
      ydoc.off("update", handleUpdate);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Flush save on unmount
        persistNow();
      }
    };
  }, [ydoc, readOnly, persistNow]);

  return {
    persistNow,
  };
}
