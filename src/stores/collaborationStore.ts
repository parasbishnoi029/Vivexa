import { create } from "zustand";
import { crdtEngine, PeerPresence, LockState } from "@/lib/crdtSync";

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "Lead Data Engineer" | "Analytics Engineer" | "VP Product" | "Data Scientist" | "Viewer";
  color: string;
  avatarUrl?: string;
  cursor?: { x: number; y: number; pageX?: number; pageY?: number };
  activeCellId?: string | null;
  activeWidgetId?: string | null;
  isTyping?: boolean;
  status: "active" | "idle" | "away";
  lastSeen: number;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  action: "EDIT_CELL" | "RUN_CELL" | "ADD_WIDGET" | "FILTER_CHANGE" | "JOINED_ROOM" | "SYNC_STATE";
  targetName?: string;
  timestamp: string;
}

interface CollaborationState {
  roomId: string | null;
  isConnected: boolean;
  latencyMs: number;
  currentUserId: string;
  collaborators: Collaborator[];
  activeLocks: Record<string, string>; // cellId/widgetId -> userId
  activityFeed: ActivityEvent[];
  isFollowingUserId: string | null;
  
  // Actions
  joinRoom: (roomId: string, user: { id: string; name: string; email: string; role?: string }) => void;
  leaveRoom: () => void;
  updateCursor: (x: number, y: number) => void;
  focusCell: (cellId: string | null) => void;
  focusWidget: (widgetId: string | null) => void;
  setTyping: (isTyping: boolean) => void;
  broadcastAction: (action: ActivityEvent["action"], targetName?: string) => void;
  followCollaborator: (userId: string | null) => void;
}

const COLLABORATOR_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#f97316"  // Orange
];

const MOCK_TEAM_MEMBERS: Omit<Collaborator, "cursor" | "activeCellId" | "activeWidgetId" | "lastSeen">[] = [
  {
    id: "collab-1",
    name: "Sarah Chen",
    email: "sarah.chen@enterprise.io",
    role: "Lead Data Engineer",
    color: "#6366f1",
    status: "active"
  },
  {
    id: "collab-2",
    name: "Alex Rivera",
    email: "alex.rivera@enterprise.io",
    role: "Analytics Engineer",
    color: "#10b981",
    status: "active"
  },
  {
    id: "collab-3",
    name: "Elena Rostova",
    email: "elena.r@enterprise.io",
    role: "VP Product",
    color: "#ec4899",
    status: "idle"
  }
];

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  roomId: null,
  isConnected: false,
  latencyMs: 14,
  currentUserId: "self",
  collaborators: [],
  activeLocks: {},
  activityFeed: [],
  isFollowingUserId: null,

  joinRoom: (roomId, user) => {
    const userColor = COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
    const myCollaborator: Collaborator = {
      id: user.id || "self",
      name: user.name || "You (Host)",
      email: user.email,
      role: (user.role as any) || "Analytics Engineer",
      color: userColor,
      status: "active",
      lastSeen: Date.now()
    };

    // Populate simulated collaborative peers for multi-user awareness
    const peers: Collaborator[] = MOCK_TEAM_MEMBERS.map((m, idx) => ({
      ...m,
      activeCellId: idx === 0 ? "c-eda-2" : null,
      activeWidgetId: idx === 1 ? "widget-mrr-trend" : null,
      cursor: { x: 280 + idx * 180, y: 320 + idx * 90 },
      isTyping: idx === 0,
      lastSeen: Date.now()
    }));

    const allCollabs = [myCollaborator, ...peers];

    set({
      roomId,
      isConnected: true,
      currentUserId: user.id || "self",
      collaborators: allCollabs,
      activityFeed: [
        {
          id: `act_${Date.now()}_1`,
          userId: "collab-1",
          userName: "Sarah Chen",
          userColor: "#6366f1",
          action: "JOINED_ROOM",
          timestamp: "Just now"
        },
        {
          id: `act_${Date.now()}_2`,
          userId: user.id || "self",
          userName: user.name || "You",
          userColor: userColor,
          action: "JOINED_ROOM",
          timestamp: "Just now"
        }
      ]
    });
  },

  leaveRoom: () => {
    set({
      roomId: null,
      isConnected: false,
      collaborators: [],
      activeLocks: {},
      activityFeed: []
    });
  },

  updateCursor: (x, y) => {
    const { currentUserId, collaborators } = get();
    const me = collaborators.find((c) => c.id === currentUserId);
    crdtEngine.updatePresence({
      userId: currentUserId,
      userName: me?.name || "You",
      userColor: me?.color || "#6366f1",
      cursor: { x, y }
    });

    set({
      collaborators: collaborators.map((c) =>
        c.id === currentUserId ? { ...c, cursor: { x, y }, lastSeen: Date.now() } : c
      )
    });
  },

  focusCell: (cellId) => {
    const { currentUserId, collaborators, activeLocks } = get();
    const me = collaborators.find((c) => c.id === currentUserId);
    const newLocks = { ...activeLocks };

    if (cellId) {
      newLocks[cellId] = currentUserId;
      crdtEngine.acquireLock(cellId, {
        id: currentUserId,
        name: me?.name || "You",
        color: me?.color || "#6366f1"
      });
      crdtEngine.updatePresence({
        userId: currentUserId,
        userName: me?.name || "You",
        userColor: me?.color || "#6366f1",
        activeElementId: cellId
      });
    } else {
      Object.keys(newLocks).forEach((k) => {
        if (newLocks[k] === currentUserId) {
          crdtEngine.releaseLock(k);
          delete newLocks[k];
        }
      });
    }

    set({
      activeLocks: newLocks,
      collaborators: collaborators.map((c) =>
        c.id === currentUserId ? { ...c, activeCellId: cellId, lastSeen: Date.now() } : c
      )
    });
  },

  focusWidget: (widgetId) => {
    const { currentUserId, collaborators, activeLocks } = get();
    const me = collaborators.find((c) => c.id === currentUserId);
    const newLocks = { ...activeLocks };

    if (widgetId) {
      newLocks[widgetId] = currentUserId;
      crdtEngine.acquireLock(widgetId, {
        id: currentUserId,
        name: me?.name || "You",
        color: me?.color || "#6366f1"
      });
    } else {
      Object.keys(newLocks).forEach((k) => {
        if (newLocks[k] === currentUserId) {
          crdtEngine.releaseLock(k);
          delete newLocks[k];
        }
      });
    }

    set({
      activeLocks: newLocks,
      collaborators: collaborators.map((c) =>
        c.id === currentUserId ? { ...c, activeWidgetId: widgetId, lastSeen: Date.now() } : c
      )
    });
  },

  setTyping: (isTyping) => {
    const { currentUserId, collaborators } = get();
    const me = collaborators.find((c) => c.id === currentUserId);
    crdtEngine.updatePresence({
      userId: currentUserId,
      userName: me?.name || "You",
      userColor: me?.color || "#6366f1",
      isTyping
    });

    set({
      collaborators: collaborators.map((c) =>
        c.id === currentUserId ? { ...c, isTyping, lastSeen: Date.now() } : c
      )
    });
  },

  broadcastAction: (action, targetName) => {
    const { currentUserId, collaborators, activityFeed } = get();
    const me = collaborators.find((c) => c.id === currentUserId);
    const newEvent: ActivityEvent = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUserId,
      userName: me?.name || "You",
      userColor: me?.color || "#6366f1",
      action,
      targetName,
      timestamp: "Just now"
    };

    set({
      activityFeed: [newEvent, ...activityFeed.slice(0, 25)]
    });
  },

  followCollaborator: (userId) => {
    set({ isFollowingUserId: userId });
  }
}));
