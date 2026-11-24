"use client";

import { useEffect, useCallback, useRef } from "react";
import { WebsocketProvider } from "y-websocket";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";
import { UserPresence } from "@/types/canvas";

interface UsePresenceOptions {
  wsProvider: WebsocketProvider | null;
  user: {
    id: string;
    name: string;
    color: string;
  };
}

export function usePresence({ wsProvider, user }: UsePresenceOptions) {
  const { setRemoteUsers, selectedElementIds } = useWhiteboardStore();
  const awarenessRef = useRef<WebsocketProvider["awareness"] | null>(null);

  useEffect(() => {
    if (!wsProvider) return;

    const awareness = wsProvider.awareness;
    awarenessRef.current = awareness;

    // Set initial local awareness state
    awareness.setLocalStateField("user", {
      id: user.id,
      name: user.name,
      color: user.color,
    });
    awareness.setLocalStateField("cursor", null);
    awareness.setLocalStateField("selection", selectedElementIds);
    awareness.setLocalStateField("lastActive", Date.now());

    const handleAwarenessChange = () => {
      const states = awareness.getStates() as Map<
        number,
        {
          user?: { id: string; name: string; color: string };
          cursor?: { x: number; y: number } | null;
          selection?: string[];
          lastActive?: number;
        }
      >;

      const remotes: Record<string, UserPresence> = {};
      const currentClientId = awareness.clientID;

      states.forEach((state, clientId) => {
        // Skip current client so remote cursors are only other users
        if (clientId === currentClientId) return;
        if (!state.user) return;

        remotes[String(clientId)] = {
          id: state.user.id,
          name: state.user.name,
          color: state.user.color,
          cursor: state.cursor || null,
          selection: state.selection || [],
          lastActive: state.lastActive || Date.now(),
        };
      });

      setRemoteUsers(remotes);
    };

    awareness.on("change", handleAwarenessChange);
    handleAwarenessChange();

    return () => {
      awareness.off("change", handleAwarenessChange);
      // Clean up cursor on leave
      awareness.setLocalStateField("cursor", null);
    };
  }, [wsProvider, user.id, user.name, user.color, setRemoteUsers]);

  // Keep selection synced to awareness
  useEffect(() => {
    if (awarenessRef.current) {
      awarenessRef.current.setLocalStateField("selection", selectedElementIds);
    }
  }, [selectedElementIds]);

  // Update cursor position with throttling for 60fps responsiveness
  const lastCursorUpdateRef = useRef<number>(0);
  const updateCursor = useCallback((cursor: { x: number; y: number } | null) => {
    if (!awarenessRef.current) return;
    const now = Date.now();
    // Throttle to max ~30-40 updates/sec (approx 25ms) to keep bandwidth minimal while remaining silk-smooth
    if (cursor !== null && now - lastCursorUpdateRef.current < 25) {
      return;
    }
    lastCursorUpdateRef.current = now;
    awarenessRef.current.setLocalStateField("cursor", cursor);
    awarenessRef.current.setLocalStateField("lastActive", now);
  }, []);

  return {
    updateCursor,
  };
}
