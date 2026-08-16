/**
 * Enterprise CRDT (Conflict-Free Replicated Data Type) Synchronization Engine
 * Powered by Lamport Timestamps, Vector Clocks, and Last-Write-Wins (LWW) deterministic conflict resolution.
 * Provides real-time collaborative state sync for notebooks, canvas dashboards, and semantic models.
 */

export interface CRDTOperation<T = any> {
  id: string;
  clientId: string;
  clock: number;
  type: "SET" | "DELETE" | "LOCK_ACQUIRE" | "LOCK_RELEASE" | "PRESENCE_UPDATE";
  path: string; // e.g. "notebook.cells.c-1.code" or "dashboard.widgets.w-1"
  value: T;
  timestamp: number;
}

export interface PeerPresence {
  clientId: string;
  userId: string;
  userName: string;
  userColor: string;
  userRole: string;
  cursor?: { x: number; y: number };
  activeElementId?: string | null;
  isTyping?: boolean;
  lastHeartbeat: number;
}

export interface LockState {
  elementId: string;
  holderClientId: string;
  holderUserName: string;
  holderUserColor: string;
  acquiredAt: number;
  expiresAt: number;
}

export class CRDTSyncEngine {
  private clientId: string;
  private lamportClock: number = 0;
  private vectorClock: Map<string, number> = new Map();
  private stateStore: Map<string, { value: any; clock: number; timestamp: number }> = new Map();
  private locks: Map<string, LockState> = new Map();
  private peers: Map<string, PeerPresence> = new Map();
  private listeners: Set<(path: string, value: any, op: CRDTOperation) => void> = new Set();
  private presenceListeners: Set<(peers: PeerPresence[]) => void> = new Set();
  private lockListeners: Set<(locks: Record<string, LockState>) => void> = new Set();
  private channel: BroadcastChannel | null = null;
  private channelName: string;

  private pendingWalBatch: CRDTOperation[] = [];
  private walFlushTimer: any = null;

  constructor(roomId: string = "default-room", clientId?: string) {
    this.clientId = clientId || `client_${Math.random().toString(36).substring(2, 9)}`;
    this.channelName = `vivexa_crdt_${roomId}`;
    this.initBroadcastChannel();
    this.startLockCleaner();
    this.startWALFlushLoop();
  }

  private startWALFlushLoop() {
    if (typeof window !== "undefined") {
      this.walFlushTimer = setInterval(() => {
        this.flushWALBatch();
      }, 1500);
    }
  }

  private async flushWALBatch() {
    if (this.pendingWalBatch.length === 0) return;
    const batch = [...this.pendingWalBatch];
    this.pendingWalBatch = [];

    try {
      await fetch("/api/v1/enterprise/crdt/wal/append", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: this.channelName,
          clientId: this.clientId,
          operations: batch
        })
      });
    } catch (e) {
      // Re-queue on network failure
      this.pendingWalBatch = [...batch, ...this.pendingWalBatch];
    }
  }

  private initBroadcastChannel() {
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.__CRDT_OP__) {
            this.applyRemoteOperation(event.data.__CRDT_OP__);
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel initialization warning (running in sandboxed context):", e);
    }
  }

  /**
   * Increments Lamport clock and generates next deterministic logical timestamp
   */
  private nextClock(): number {
    this.lamportClock += 1;
    this.vectorClock.set(this.clientId, this.lamportClock);
    return this.lamportClock;
  }

  /**
   * Applies a local mutation and broadcasts the CRDT operation to all connected peers
   */
  public applyLocalSet<T>(path: string, value: T): CRDTOperation<T> {
    const clock = this.nextClock();
    const now = Date.now();

    const op: CRDTOperation<T> = {
      id: `${this.clientId}_${clock}_${now}`,
      clientId: this.clientId,
      clock,
      type: "SET",
      path,
      value,
      timestamp: now
    };

    // Update local state store
    this.stateStore.set(path, { value, clock, timestamp: now });
    this.pendingWalBatch.push(op);

    // Broadcast to peers
    this.broadcast(op);
    this.notifyListeners(path, value, op);

    return op;
  }

  /**
   * Attempts to acquire an exclusive lock on a notebook cell or dashboard widget
   */
  public acquireLock(
    elementId: string,
    userInfo: { id: string; name: string; color: string },
    ttlMs: number = 30000
  ): boolean {
    const now = Date.now();
    const existing = this.locks.get(elementId);

    // If locked by another active peer, reject
    if (existing && existing.holderClientId !== this.clientId && existing.expiresAt > now) {
      return false;
    }

    const lock: LockState = {
      elementId,
      holderClientId: this.clientId,
      holderUserName: userInfo.name,
      holderUserColor: userInfo.color,
      acquiredAt: now,
      expiresAt: now + ttlMs
    };

    this.locks.set(elementId, lock);

    const clock = this.nextClock();
    const op: CRDTOperation<LockState> = {
      id: `${this.clientId}_lock_${clock}`,
      clientId: this.clientId,
      clock,
      type: "LOCK_ACQUIRE",
      path: `lock.${elementId}`,
      value: lock,
      timestamp: now
    };

    this.broadcast(op);
    this.notifyLockListeners();
    return true;
  }

  /**
   * Releases an acquired element lock
   */
  public releaseLock(elementId: string): void {
    const existing = this.locks.get(elementId);
    if (!existing || existing.holderClientId !== this.clientId) return;

    this.locks.delete(elementId);

    const clock = this.nextClock();
    const op: CRDTOperation<{ elementId: string }> = {
      id: `${this.clientId}_unlock_${clock}`,
      clientId: this.clientId,
      clock,
      type: "LOCK_RELEASE",
      path: `lock.${elementId}`,
      value: { elementId },
      timestamp: Date.now()
    };

    this.broadcast(op);
    this.notifyLockListeners();
  }

  /**
   * Broadcasts presence (cursor coordinates, active cell, typing indicator)
   */
  public updatePresence(presence: Partial<PeerPresence>): void {
    const clock = this.nextClock();
    const now = Date.now();

    const fullPresence: PeerPresence = {
      clientId: this.clientId,
      userId: presence.userId || "anonymous",
      userName: presence.userName || "User",
      userColor: presence.userColor || "#6366f1",
      userRole: presence.userRole || "Analytics Engineer",
      cursor: presence.cursor,
      activeElementId: presence.activeElementId,
      isTyping: presence.isTyping ?? false,
      lastHeartbeat: now,
      ...presence
    };

    this.peers.set(this.clientId, fullPresence);

    const op: CRDTOperation<PeerPresence> = {
      id: `${this.clientId}_pres_${clock}`,
      clientId: this.clientId,
      clock,
      type: "PRESENCE_UPDATE",
      path: `presence.${this.clientId}`,
      value: fullPresence,
      timestamp: now
    };

    this.broadcast(op);
    this.notifyPresenceListeners();
  }

  /**
   * Applies an incoming remote CRDT operation using Last-Write-Wins (LWW) with Lamport Clocks
   */
  public applyRemoteOperation(op: CRDTOperation): void {
    // 1. Synchronize Lamport clock
    this.lamportClock = Math.max(this.lamportClock, op.clock) + 1;
    this.vectorClock.set(op.clientId, Math.max(this.vectorClock.get(op.clientId) || 0, op.clock));

    // 2. Handle Operation Types
    if (op.type === "SET") {
      const current = this.stateStore.get(op.path);
      // LWW Conflict Resolution Rule: Higher clock wins; if tie, higher timestamp; if tie, lexicographical clientId
      const isIncomingWinner =
        !current ||
        op.clock > current.clock ||
        (op.clock === current.clock && op.timestamp > current.timestamp) ||
        (op.clock === current.clock && op.timestamp === current.timestamp && op.clientId > this.clientId);

      if (isIncomingWinner) {
        this.stateStore.set(op.path, {
          value: op.value,
          clock: op.clock,
          timestamp: op.timestamp
        });
        this.notifyListeners(op.path, op.value, op);
      }
    } else if (op.type === "LOCK_ACQUIRE") {
      const lockData = op.value as LockState;
      this.locks.set(lockData.elementId, lockData);
      this.notifyLockListeners();
    } else if (op.type === "LOCK_RELEASE") {
      const { elementId } = op.value as { elementId: string };
      this.locks.delete(elementId);
      this.notifyLockListeners();
    } else if (op.type === "PRESENCE_UPDATE") {
      const peer = op.value as PeerPresence;
      this.peers.set(peer.clientId, peer);
      this.notifyPresenceListeners();
    }
  }

  private broadcast(op: CRDTOperation) {
    if (this.channel) {
      try {
        this.channel.postMessage({ __CRDT_OP__: op });
      } catch (_) {}
    }
  }

  private notifyListeners(path: string, value: any, op: CRDTOperation) {
    this.listeners.forEach((fn) => fn(path, value, op));
  }

  private notifyPresenceListeners() {
    const peerList = Array.from(this.peers.values());
    this.presenceListeners.forEach((fn) => fn(peerList));
  }

  private notifyLockListeners() {
    const lockObj: Record<string, LockState> = {};
    this.locks.forEach((v, k) => {
      if (v.expiresAt > Date.now()) {
        lockObj[k] = v;
      }
    });
    this.lockListeners.forEach((fn) => fn(lockObj));
  }

  private startLockCleaner() {
    if (typeof window !== "undefined") {
      setInterval(() => {
        const now = Date.now();
        let changed = false;
        this.locks.forEach((lock, key) => {
          if (lock.expiresAt <= now) {
            this.locks.delete(key);
            changed = true;
          }
        });
        if (changed) this.notifyLockListeners();
      }, 5000);
    }
  }

  public subscribe(fn: (path: string, value: any, op: CRDTOperation) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public subscribePresence(fn: (peers: PeerPresence[]) => void) {
    this.presenceListeners.add(fn);
    return () => this.presenceListeners.delete(fn);
  }

  public subscribeLocks(fn: (locks: Record<string, LockState>) => void) {
    this.lockListeners.add(fn);
    return () => this.lockListeners.delete(fn);
  }

  public getState<T>(path: string): T | undefined {
    return this.stateStore.get(path)?.value;
  }

  public getLocks(): Record<string, LockState> {
    const obj: Record<string, LockState> = {};
    this.locks.forEach((v, k) => {
      if (v.expiresAt > Date.now()) obj[k] = v;
    });
    return obj;
  }

  public async fetchWALHistory(): Promise<any[]> {
    try {
      const res = await fetch(`/api/v1/enterprise/crdt/wal/history?roomId=${encodeURIComponent(this.channelName)}`);
      const json = await res.json();
      return json?.data?.history || [];
    } catch (e) {
      console.warn("Failed to fetch WAL history:", e);
      return [];
    }
  }

  public async timeTravelTo(timestamp: number): Promise<Record<string, any>> {
    try {
      const res = await fetch(`/api/v1/enterprise/crdt/wal/time-travel?roomId=${encodeURIComponent(this.channelName)}&timestamp=${timestamp}`);
      const json = await res.json();
      return json?.data?.state || {};
    } catch (e) {
      console.warn("Failed to perform time-travel:", e);
      return {};
    }
  }

  public async rollbackTo(timestamp: number): Promise<boolean> {
    try {
      const res = await fetch(`/api/v1/enterprise/crdt/wal/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: this.channelName, targetTimestamp: timestamp })
      });
      const json = await res.json();
      if (json?.data?.success && json?.data?.restoredState) {
        // Restore local memory state
        Object.entries(json.data.restoredState).forEach(([path, val]) => {
          this.stateStore.set(path, { value: val, clock: json.data.rollbackSequence, timestamp: Date.now() });
          this.notifyListeners(path, val, {
            id: `restored_${Date.now()}`,
            clientId: this.clientId,
            clock: json.data.rollbackSequence,
            type: "SET",
            path,
            value: val,
            timestamp: Date.now()
          });
        });
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Failed to execute rollback:", e);
      return false;
    }
  }

  public destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
    this.presenceListeners.clear();
    this.lockListeners.clear();
  }
}

// Global Singleton Room Engine instance
export const crdtEngine = new CRDTSyncEngine("vivexa-main-canvas");
