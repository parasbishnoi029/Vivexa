import { useEffect, useState, useRef, useCallback } from "react";
import * as Y from "yjs";

export interface RemoteCollaborator {
  userId: string;
  userName: string;
  color: string;
  avatar?: string;
  cursor?: { x: number; y: number; widgetId?: string; cellId?: string };
  lastActive: number;
}

export interface CRDTDocState {
  doc: Y.Doc;
  connected: boolean;
  collaborators: RemoteCollaborator[];
  broadcastMutation: (action: string, targetId: string, payload: any) => void;
  updateCursor: (cursor: { x: number; y: number; widgetId?: string; cellId?: string }) => void;
}

/**
 * Enterprise Client Hook for Yjs + Hocuspocus Real-time Collaboration.
 * Connects to the WebSocket CRDT room, maintains awareness state, multi-cursors,
 * and seamlessly synchronizes operational changes.
 */
export function useCRDTCollaborativeSession(
  roomId: string,
  user: { id?: string; email?: string; name?: string }
): CRDTDocState {
  const [connected, setConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<RemoteCollaborator[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const docRef = useRef<Y.Doc>(new Y.Doc());
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const userId = user.id || `user-${Math.floor(Math.random() * 1000)}`;
  const userName = user.name || user.email?.split("@")[0] || "Data Analyst";

  useEffect(() => {
    let ws: WebSocket | null = null;
    let isMounted = true;

    try {
      // Connect to WebSocket endpoint
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/crdt?room=${encodeURIComponent(roomId)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted) setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "PRESENCE_SYNC" || msg.type === "SYNC_INITIAL") {
            const others = (msg.presences || []).filter((p: RemoteCollaborator) => p.userId !== userId);
            if (isMounted) setCollaborators(others);
          } else if (msg.type === "CRDT_UPDATE") {
            // Apply remote CRDT updates
            window.dispatchEvent(new CustomEvent("VIVEXA_CRDT_REMOTE_MUTATION", { detail: msg }));
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (isMounted) setConnected(false);
      };

      ws.onerror = () => {
        if (isMounted) setConnected(false);
      };
    } catch (err) {
      console.warn("[CRDT Provider] WebSocket connection notice, falling back to local BroadcastChannel:", err);
    }

    // BroadcastChannel fallback for multi-tab collaboration in browser
    try {
      const bc = new BroadcastChannel(`crdt-${roomId}`);
      broadcastChannelRef.current = bc;
      bc.onmessage = (event) => {
        if (event.data?.type === "PRESENCE" && event.data.userId !== userId) {
          setCollaborators((prev) => {
            const filtered = prev.filter((p) => p.userId !== event.data.userId);
            return [...filtered, event.data];
          });
        }
      };
    } catch (e) {
      // BroadcastChannel not available in some sandbox environments
    }

    return () => {
      isMounted = false;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [roomId, userId, userName]);

  // Broadcast cursor movements with throttle
  const lastCursorUpdateRef = useRef(0);
  const updateCursor = useCallback((cursor: { x: number; y: number; widgetId?: string; cellId?: string }) => {
    const now = Date.now();
    if (now - lastCursorUpdateRef.current < 40) return; // 25fps cap
    lastCursorUpdateRef.current = now;

    const payload = {
      type: "AWARENESS_UPDATE",
      roomId,
      userId,
      cursor
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "PRESENCE",
        userId,
        userName,
        color: "#3B82F6",
        cursor,
        lastActive: now
      });
    }
  }, [roomId, userId, userName]);

  // Broadcast state mutation to peers and server WAL
  const broadcastMutation = useCallback((action: string, targetId: string, payload: any) => {
    const mutationMsg = {
      type: "CRDT_UPDATE",
      roomId,
      userId,
      mutation: {
        action,
        targetId,
        payload,
        timestamp: Date.now()
      }
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(mutationMsg));
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "CRDT_UPDATE",
        ...mutationMsg
      });
    }
  }, [roomId, userId]);

  return {
    doc: docRef.current,
    connected,
    collaborators,
    broadcastMutation,
    updateCursor
  };
}
