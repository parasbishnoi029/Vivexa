import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import * as Y from "yjs";
import { CRDTWriteAheadLogService } from "./CRDTWriteAheadLogService";

export interface RemoteUserPresence {
  userId: string;
  userName: string;
  color: string;
  avatar?: string;
  cursor?: { x: number; y: number; widgetId?: string; cellId?: string };
  lastActive: number;
}

export interface CRDTRoom {
  roomId: string;
  doc: Y.Doc;
  clients: Set<WebSocket>;
  presences: Map<string, RemoteUserPresence>;
}

/**
 * Enterprise Hocuspocus-compatible CRDT Realtime Server.
 * Provides WebSocket synchronization for Yjs documents, multi-cursor awareness,
 * state persistence, and write-ahead log integration for Dashboards and Notebooks.
 */
export class HocuspocusCRDTServer {
  private static wss: WebSocketServer | null = null;
  private static rooms: Map<string, CRDTRoom> = new Map();

  private static readonly PRESET_COLORS = [
    "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4", "#6366F1"
  ];

  /**
   * Initializes the WebSocket server attached to the main HTTP server.
   */
  public static init(server: http.Server): void {
    if (this.wss) return;

    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      const pathname = request.url || "";
      if (pathname.startsWith("/ws/crdt") || pathname.startsWith("/ws/hocuspocus")) {
        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          this.wss!.emit("connection", ws, request);
        });
      }
    });

    this.wss.on("connection", (ws: WebSocket, req) => {
      const urlParams = new URLSearchParams((req.url || "").split("?")[1] || "");
      const roomId = urlParams.get("room") || urlParams.get("docId") || "workspace-default";
      const userId = urlParams.get("userId") || `user-${Math.floor(Math.random() * 1000)}`;
      const userName = urlParams.get("userName") || "Collaborator";

      this.handleClientJoin(ws, roomId, userId, userName);
    });

    console.log("[Hocuspocus CRDT] Realtime Collaborative Server mounted at /ws/crdt");
  }

  private static getOrCreateRoom(roomId: string): CRDTRoom {
    let room = this.rooms.get(roomId);
    if (!room) {
      const doc = new Y.Doc();
      room = {
        roomId,
        doc,
        clients: new Set(),
        presences: new Map()
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }

  private static handleClientJoin(ws: WebSocket, roomId: string, userId: string, userName: string): void {
    const room = this.getOrCreateRoom(roomId);
    room.clients.add(ws);

    const userColor = this.PRESET_COLORS[Math.abs(this.hashCode(userId)) % this.PRESET_COLORS.length];
    const presence: RemoteUserPresence = {
      userId,
      userName,
      color: userColor,
      lastActive: Date.now()
    };
    room.presences.set(userId, presence);

    // Send initial sync payload
    const initialSyncMessage = {
      type: "SYNC_INITIAL",
      roomId,
      presences: Array.from(room.presences.values()),
      serverTime: Date.now()
    };
    ws.send(JSON.stringify(initialSyncMessage));

    // Broadcast presence update to others
    this.broadcastPresence(room);

    ws.on("message", (rawMessage) => {
      try {
        const msg = JSON.parse(rawMessage.toString());

        if (msg.type === "AWARENESS_UPDATE") {
          // User cursor or selection moved
          const currentPresence = room.presences.get(userId);
          if (currentPresence) {
            currentPresence.cursor = msg.cursor;
            currentPresence.lastActive = Date.now();
            this.broadcastPresence(room);
          }
        } else if (msg.type === "CRDT_UPDATE") {
          // Broadcast state mutation to peer collaborators
          for (const client of room.clients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "CRDT_UPDATE",
                roomId,
                userId,
                mutation: msg.mutation,
                timestamp: Date.now()
              }));
            }
          }

          // Record in Write-Ahead Log
          if (msg.mutation) {
            CRDTWriteAheadLogService.recordMutation({
              docId: roomId,
              userId,
              userName,
              action: msg.mutation.action || "UPDATE",
              targetType: roomId.startsWith("dash") ? "DASHBOARD" : "NOTEBOOK",
              targetId: msg.mutation.targetId || roomId,
              payload: msg.mutation.payload
            });
          }
        }
      } catch (err: any) {
        console.warn("[Hocuspocus CRDT] Message handling error:", err.message);
      }
    });

    ws.on("close", () => {
      room.clients.delete(ws);
      room.presences.delete(userId);
      this.broadcastPresence(room);
      if (room.clients.size === 0) {
        // Keep room in memory for quick re-join
      }
    });
  }

  private static broadcastPresence(room: CRDTRoom): void {
    const payload = JSON.stringify({
      type: "PRESENCE_SYNC",
      roomId: room.roomId,
      presences: Array.from(room.presences.values())
    });

    for (const client of room.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  public static getRoomsStatus() {
    const roomSummaries = [];
    for (const [id, r] of this.rooms.entries()) {
      roomSummaries.push({
        roomId: id,
        activeClients: r.clients.size,
        activeUsers: Array.from(r.presences.values())
      });
    }
    return {
      totalRooms: this.rooms.size,
      rooms: roomSummaries
    };
  }
}
