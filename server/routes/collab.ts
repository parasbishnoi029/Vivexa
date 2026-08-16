import { Router } from "express";

export const collabRouter = Router();

interface UserPresence {
  userId: string;
  userName: string;
  userColor: string;
  cursor: { x: number; y: number; activeCellId?: string };
  lastActive: string;
}

interface CollabRoom {
  roomId: string;
  roomType: "notebook" | "dashboard" | "lakehouse";
  activeUsers: Record<string, UserPresence>;
  documentState: Record<string, any>;
  updatedAt: string;
}

const ACTIVE_ROOMS: Record<string, CollabRoom> = {
  "room-notebook-1": {
    roomId: "room-notebook-1",
    roomType: "notebook",
    activeUsers: {
      "usr-1": {
        userId: "usr-1",
        userName: "Elena Rostova (Lead Data Scientist)",
        userColor: "#6366f1",
        cursor: { x: 420, y: 180, activeCellId: "cell-2" },
        lastActive: new Date().toISOString()
      },
      "usr-2": {
        userId: "usr-2",
        userName: "Marcus Chen (Data Engineer)",
        userColor: "#10b981",
        cursor: { x: 610, y: 340, activeCellId: "cell-4" },
        lastActive: new Date().toISOString()
      }
    },
    documentState: {
      title: "Q3 Enterprise Revenue Analysis & Delta Forecast",
      cellsCount: 5,
      version: 12
    },
    updatedAt: new Date().toISOString()
  }
};

// GET /api/v1/collab/rooms/:roomId - Get active room status and collaborators
collabRouter.get("/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  let room = ACTIVE_ROOMS[roomId];

  if (!room) {
    room = {
      roomId,
      roomType: roomId.includes("dashboard") ? "dashboard" : "notebook",
      activeUsers: {
        "usr-me": {
          userId: "usr-me",
          userName: "You (Active Editor)",
          userColor: "#8b5cf6",
          cursor: { x: 100, y: 100 },
          lastActive: new Date().toISOString()
        }
      },
      documentState: {
        version: 1
      },
      updatedAt: new Date().toISOString()
    };
    ACTIVE_ROOMS[roomId] = room;
  }

  res.json({
    success: true,
    room: {
      roomId: room.roomId,
      roomType: room.roomType,
      collaborators: Object.values(room.activeUsers),
      documentState: room.documentState,
      updatedAt: room.updatedAt
    }
  });
});

// POST /api/v1/collab/rooms/:roomId/presence - Update live presence / cursor position
collabRouter.post("/rooms/:roomId/presence", (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId = "usr-me", userName = "Active Analyst", cursor } = req.body;

    let room = ACTIVE_ROOMS[roomId];
    if (!room) {
      room = {
        roomId,
        roomType: "notebook",
        activeUsers: {},
        documentState: {},
        updatedAt: new Date().toISOString()
      };
      ACTIVE_ROOMS[roomId] = room;
    }

    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6"];
    const userColor = colors[Math.abs(userId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % colors.length];

    room.activeUsers[userId] = {
      userId,
      userName,
      userColor,
      cursor: cursor || { x: 0, y: 0 },
      lastActive: new Date().toISOString()
    };
    room.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      collaboratorsCount: Object.keys(room.activeUsers).length,
      collaborators: Object.values(room.activeUsers)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
