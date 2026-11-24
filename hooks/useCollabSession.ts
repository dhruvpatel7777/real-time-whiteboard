"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";
import { CanvasElement } from "@/types/canvas";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";

interface UseCollabSessionOptions {
  boardId: string;
  userId: string;
  userName: string;
  userColor: string;
  wsUrl?: string;
  readOnly?: boolean;
}

export function useCollabSession({
  boardId,
  userId,
  userName,
  userColor,
  wsUrl,
  readOnly = false,
}: UseCollabSessionOptions) {
  const [isReady, setIsReady] = useState(false);
  const ydocRef = useRef<Y.Doc | null>(null);
  const wsProviderRef = useRef<WebsocketProvider | null>(null);
  const idbProviderRef = useRef<IndexeddbPersistence | null>(null);

  // Dynamic WebSocket URL fallback to current host
  const effectiveWsUrl = useMemo(() => {
    if (wsUrl) return wsUrl;
    if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
    if (typeof window !== "undefined") {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${window.location.hostname}:1234`;
    }
    return "ws://localhost:1234";
  }, [wsUrl]);

  // Local transaction origin marker to distinguish local user edits vs remote edits
  const localOrigin = useMemo(() => `user:${userId}:${Math.random().toString(36).slice(2, 8)}`, [userId]);

  const {
    setElements,
    setSyncState,
    triggerConflictHighlight,
    setHasOfflineChanges,
  } = useWhiteboardStore();

  // Track recent local edit timestamps for conflict detection: elementId -> timestamp
  const recentLocalEditsRef = useRef<Map<string, number>>(new Map());

  // Initialize Yjs doc, IndexedDB, and WebSocket provider
  useEffect(() => {
    if (!boardId || typeof window === "undefined") return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const roomName = `board-${boardId}`;
    setSyncState("connecting");

    // 1. Setup IndexedDB persistence for offline resilience
    const idbProvider = new IndexeddbPersistence(roomName, ydoc);
    idbProviderRef.current = idbProvider;

    idbProvider.on("synced", () => {
      syncStateFromYjs();
    });

    // 2. Setup WebSocket provider for real-time collaboration
    const wsProvider = new WebsocketProvider(effectiveWsUrl, roomName, ydoc, {
      connect: true,
      params: { userId, userName },
    });
    wsProviderRef.current = wsProvider;

    // Monitor WebSocket connection status
    wsProvider.on("status", (event: { status: "connecting" | "connected" | "disconnected" }) => {
      if (event.status === "connected") {
        setSyncState("connected");
      } else if (event.status === "connecting") {
        setSyncState("syncing");
      } else {
        setSyncState(navigator.onLine ? "disconnected" : "offline");
      }
    });

    // Monitor online/offline network events
    const handleOnline = () => {
      if (wsProvider.wsconnected) {
        setSyncState("connected");
      } else {
        setSyncState("syncing");
        wsProvider.connect();
      }
    };
    const handleOffline = () => {
      setSyncState("offline");
      setHasOfflineChanges(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 3. Setup Yjs Maps and Arrays
    const elementsMap = ydoc.getMap<CanvasElement>("elements");
    const elementOrder = ydoc.getArray<string>("elementOrder");

    const syncStateFromYjs = () => {
      const currentMap: Record<string, CanvasElement> = {};
      elementsMap.forEach((val, key) => {
        currentMap[key] = val;
      });

      // Get layer order with strict set-based deduplication
      const rawOrder = elementOrder.toArray();
      const validOrder: string[] = [];
      const seen = new Set<string>();

      for (const id of rawOrder) {
        if (currentMap[id] && !seen.has(id)) {
          seen.add(id);
          validOrder.push(id);
        }
      }

      // If there are elements in elementsMap not in elementOrder, append them
      for (const id of Object.keys(currentMap)) {
        if (!seen.has(id)) {
          seen.add(id);
          validOrder.push(id);
        }
      }

      setElements(currentMap, validOrder);
    };

    // Listen to changes in elements map
    const handleElementsChange = (event: Y.YMapEvent<CanvasElement>, transaction: Y.Transaction) => {
      syncStateFromYjs();

      // Conflict visualization: If change originated remotely, check if this element
      // was edited locally within the last 4 seconds
      if (transaction.origin !== localOrigin) {
        const now = Date.now();
        event.changes.keys.forEach((change, key) => {
          if (change.action === "update") {
            const lastLocalTime = recentLocalEditsRef.current.get(key);
            if (lastLocalTime && now - lastLocalTime < 4000) {
              triggerConflictHighlight(key);
            }
          }
        });
      }
    };

    const handleOrderChange = () => {
      syncStateFromYjs();
    };

    elementsMap.observe(handleElementsChange);
    elementOrder.observe(handleOrderChange);

    // Initial sync
    syncStateFromYjs();
    setIsReady(true);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      elementsMap.unobserve(handleElementsChange);
      elementOrder.unobserve(handleOrderChange);
      idbProvider.destroy();
      wsProvider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      wsProviderRef.current = null;
      idbProviderRef.current = null;
    };
  }, [boardId, userId, userName, userColor, effectiveWsUrl, localOrigin, setElements, setSyncState, setHasOfflineChanges, triggerConflictHighlight]);

  // Operations on the Canvas CRDT
  const addElement = useCallback(
    (element: CanvasElement) => {
      if (readOnly || !ydocRef.current) return;
      const ydoc = ydocRef.current;
      const elementsMap = ydoc.getMap<CanvasElement>("elements");
      const elementOrder = ydoc.getArray<string>("elementOrder");

      ydoc.transact(() => {
        elementsMap.set(element.id, element);
        elementOrder.push([element.id]);
      }, localOrigin);

      recentLocalEditsRef.current.set(element.id, Date.now());
    },
    [readOnly, localOrigin]
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      if (readOnly || !ydocRef.current) return;
      const ydoc = ydocRef.current;
      const elementsMap = ydoc.getMap<CanvasElement>("elements");
      const existing = elementsMap.get(id);
      if (!existing) return;

      const merged = {
        ...existing,
        ...updates,
        updatedBy: userId,
        updatedAt: Date.now(),
      } as CanvasElement;

      ydoc.transact(() => {
        elementsMap.set(id, merged);
      }, localOrigin);

      recentLocalEditsRef.current.set(id, Date.now());
    },
    [readOnly, userId, localOrigin]
  );

  const deleteElements = useCallback(
    (ids: string[]) => {
      if (readOnly || !ydocRef.current || ids.length === 0) return;
      const ydoc = ydocRef.current;
      const elementsMap = ydoc.getMap<CanvasElement>("elements");
      const elementOrder = ydoc.getArray<string>("elementOrder");

      ydoc.transact(() => {
        ids.forEach((id) => {
          elementsMap.delete(id);
        });

        // Filter elementOrder
        const currentOrder = elementOrder.toArray();
        const newOrder = currentOrder.filter((id) => !ids.includes(id));
        elementOrder.delete(0, currentOrder.length);
        if (newOrder.length > 0) {
          elementOrder.insert(0, newOrder);
        }
      }, localOrigin);
    },
    [readOnly, localOrigin]
  );

  const bringForward = useCallback(
    (id: string) => {
      if (readOnly || !ydocRef.current) return;
      const ydoc = ydocRef.current;
      const elementOrder = ydoc.getArray<string>("elementOrder");

      ydoc.transact(() => {
        const order = elementOrder.toArray();
        const idx = order.indexOf(id);
        if (idx !== -1 && idx < order.length - 1) {
          const temp = order[idx];
          order[idx] = order[idx + 1];
          order[idx + 1] = temp;
          elementOrder.delete(0, order.length);
          elementOrder.insert(0, order);
        }
      }, localOrigin);
    },
    [readOnly, localOrigin]
  );

  const sendBackward = useCallback(
    (id: string) => {
      if (readOnly || !ydocRef.current) return;
      const ydoc = ydocRef.current;
      const elementOrder = ydoc.getArray<string>("elementOrder");

      ydoc.transact(() => {
        const order = elementOrder.toArray();
        const idx = order.indexOf(id);
        if (idx > 0) {
          const temp = order[idx];
          order[idx] = order[idx - 1];
          order[idx - 1] = temp;
          elementOrder.delete(0, order.length);
          elementOrder.insert(0, order);
        }
      }, localOrigin);
    },
    [readOnly, localOrigin]
  );

  const clearBoard = useCallback(() => {
    if (readOnly || !ydocRef.current) return;
    const ydoc = ydocRef.current;
    const elementsMap = ydoc.getMap<CanvasElement>("elements");
    const elementOrder = ydoc.getArray<string>("elementOrder");

    ydoc.transact(() => {
      elementsMap.clear();
      elementOrder.delete(0, elementOrder.length);
    }, localOrigin);
  }, [readOnly, localOrigin]);

  return {
    ydoc: ydocRef.current,
    wsProvider: wsProviderRef.current,
    idbProvider: idbProviderRef.current,
    isReady,
    localOrigin,
    addElement,
    updateElement,
    deleteElements,
    bringForward,
    sendBackward,
    clearBoard,
  };
}
