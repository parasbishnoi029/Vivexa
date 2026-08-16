/**
 * Server-Side CRDT Write-Ahead Log (WAL) & Time-Travel Engine
 * Persists all collaborative canvas & notebook mutation deltas into an append-only WAL.
 * Supports deterministic replay, snapshot compaction, offline reconciliation, and time-travel rollback.
 */

import crypto from "crypto";

export interface WALEntry {
  sequenceNumber: number;
  id: string;
  roomId: string;
  tenantId: string;
  clientId: string;
  clock: number;
  type: "SET" | "DELETE" | "LOCK_ACQUIRE" | "LOCK_RELEASE" | "SNAPSHOT" | "ROLLBACK";
  path: string;
  value: any;
  timestamp: number;
  checksum: string;
}

export interface RoomSnapshot {
  roomId: string;
  sequenceNumber: number;
  state: Record<string, any>;
  locks: Record<string, any>;
  timestamp: number;
  operationCount: number;
}

export class CRDTWriteAheadLogService {
  // In-memory WAL cache & persistent simulation
  private static walLogs: Map<string, WALEntry[]> = new Map(); // roomId -> WALEntry[]
  private static snapshots: Map<string, RoomSnapshot[]> = new Map(); // roomId -> snapshots
  private static sequenceGenerators: Map<string, number> = new Map();

  private static readonly SNAPSHOT_INTERVAL = 50; // Snapshot every 50 operations

  /**
   * Appends a batch of CRDT operations to the room's Write-Ahead Log.
   */
  public static append(params: {
    roomId: string;
    tenantId: string;
    clientId: string;
    operations: Array<{
      id: string;
      clock: number;
      type: "SET" | "DELETE" | "LOCK_ACQUIRE" | "LOCK_RELEASE";
      path: string;
      value: any;
      timestamp: number;
    }>;
  }): { success: boolean; appendedCount: number; latestSequenceNumber: number } {
    const { roomId, tenantId, clientId, operations } = params;
    if (!this.walLogs.has(roomId)) {
      this.walLogs.set(roomId, []);
      this.snapshots.set(roomId, []);
      this.sequenceGenerators.set(roomId, 0);
    }

    const log = this.walLogs.get(roomId)!;
    let seq = this.sequenceGenerators.get(roomId) || 0;

    for (const op of operations) {
      seq += 1;
      const rawString = `${seq}:${roomId}:${clientId}:${op.clock}:${op.path}:${JSON.stringify(op.value)}:${op.timestamp}`;
      const checksum = crypto.createHash("sha256").update(rawString).digest("hex").slice(0, 16);

      const entry: WALEntry = {
        sequenceNumber: seq,
        id: op.id,
        roomId,
        tenantId,
        clientId,
        clock: op.clock,
        type: op.type,
        path: op.path,
        value: op.value,
        timestamp: op.timestamp,
        checksum
      };

      log.push(entry);

      // Periodically generate compacted snapshot
      if (seq % this.SNAPSHOT_INTERVAL === 0) {
        this.compactSnapshot(roomId, seq);
      }
    }

    this.sequenceGenerators.set(roomId, seq);

    return {
      success: true,
      appendedCount: operations.length,
      latestSequenceNumber: seq
    };
  }

  /**
   * Compacts WAL into a full state snapshot for ultra-fast bootstrapping
   */
  public static compactSnapshot(roomId: string, sequenceNumber: number): RoomSnapshot {
    const log = this.walLogs.get(roomId) || [];
    const state: Record<string, any> = {};
    const locks: Record<string, any> = {};

    // Replay log up to sequenceNumber
    for (const entry of log) {
      if (entry.sequenceNumber > sequenceNumber) break;

      if (entry.type === "SET") {
        state[entry.path] = entry.value;
      } else if (entry.type === "DELETE") {
        delete state[entry.path];
      } else if (entry.type === "LOCK_ACQUIRE") {
        locks[entry.value.elementId] = entry.value;
      } else if (entry.type === "LOCK_RELEASE") {
        delete locks[entry.value.elementId];
      }
    }

    const snapshot: RoomSnapshot = {
      roomId,
      sequenceNumber,
      state,
      locks,
      timestamp: Date.now(),
      operationCount: log.filter((e) => e.sequenceNumber <= sequenceNumber).length
    };

    if (!this.snapshots.has(roomId)) {
      this.snapshots.set(roomId, []);
    }
    this.snapshots.get(roomId)!.push(snapshot);

    return snapshot;
  }

  /**
   * Fetches the WAL delta stream since a given sequence number
   */
  public static getDeltasSince(roomId: string, sinceSequence: number = 0): {
    entries: WALEntry[];
    latestSequenceNumber: number;
    hasMore: boolean;
  } {
    const log = this.walLogs.get(roomId) || [];
    const filtered = log.filter((e) => e.sequenceNumber > sinceSequence);
    const latestSeq = this.sequenceGenerators.get(roomId) || 0;

    return {
      entries: filtered,
      latestSequenceNumber: latestSeq,
      hasMore: false
    };
  }

  /**
   * Time-Travel Query: Reconstructs exact canvas state at a specific historical timestamp $t$
   */
  public static getStateAtTime(roomId: string, targetTimestamp: number): {
    state: Record<string, any>;
    operationsApplied: number;
    targetTimestamp: number;
    effectiveSequence: number;
  } {
    const log = this.walLogs.get(roomId) || [];
    const state: Record<string, any> = {};
    let appliedCount = 0;
    let maxSeq = 0;

    for (const entry of log) {
      if (entry.timestamp > targetTimestamp) break;

      if (entry.type === "SET") {
        state[entry.path] = entry.value;
        appliedCount += 1;
        maxSeq = entry.sequenceNumber;
      } else if (entry.type === "DELETE") {
        delete state[entry.path];
        appliedCount += 1;
        maxSeq = entry.sequenceNumber;
      }
    }

    return {
      state,
      operationsApplied: appliedCount,
      targetTimestamp,
      effectiveSequence: maxSeq
    };
  }

  /**
   * Rollback Action: Reverts the room state to a specified timestamp or sequence number
   */
  public static rollbackTo(roomId: string, targetTimestamp: number, adminUser: string): {
    success: boolean;
    restoredState: Record<string, any>;
    rollbackSequence: number;
  } {
    const historical = this.getStateAtTime(roomId, targetTimestamp);
    const seq = (this.sequenceGenerators.get(roomId) || 0) + 1;

    // Append a ROLLBACK snapshot event into the WAL
    const rollbackEntry: WALEntry = {
      sequenceNumber: seq,
      id: `rollback_${Date.now()}`,
      roomId,
      tenantId: "default_tenant",
      clientId: adminUser,
      clock: seq,
      type: "ROLLBACK",
      path: "root.state",
      value: historical.state,
      timestamp: Date.now(),
      checksum: crypto.createHash("sha256").update(`rollback:${seq}:${roomId}`).digest("hex").slice(0, 16)
    };

    if (!this.walLogs.has(roomId)) this.walLogs.set(roomId, []);
    this.walLogs.get(roomId)!.push(rollbackEntry);
    this.sequenceGenerators.set(roomId, seq);

    return {
      success: true,
      restoredState: historical.state,
      rollbackSequence: seq
    };
  }

  /**
   * Helper method for recording single mutations directly from WebSocket handlers
   */
  public static recordMutation(params: {
    docId: string;
    userId: string;
    userName?: string;
    action: string;
    targetType: string;
    targetId: string;
    payload: any;
  }): { success: boolean; sequenceNumber: number } {
    const { docId, userId, action, payload } = params;
    const res = this.append({
      roomId: docId,
      tenantId: "default_tenant",
      clientId: userId,
      operations: [
        {
          id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          clock: Date.now(),
          type: action === "DELETE" ? "DELETE" : "SET",
          path: params.targetId || "root",
          value: payload,
          timestamp: Date.now()
        }
      ]
    });
    return { success: res.success, sequenceNumber: res.latestSequenceNumber };
  }

  /**
   * Lists chronological revision history of the room for the UI time scrubber
   */
  public static getRevisionHistory(roomId: string): Array<{
    sequenceNumber: number;
    timestamp: number;
    clientId: string;
    type: string;
    path: string;
    summary: string;
  }> {
    const log = this.walLogs.get(roomId) || [];
    return log.map((e) => ({
      sequenceNumber: e.sequenceNumber,
      timestamp: e.timestamp,
      clientId: e.clientId,
      type: e.type,
      path: e.path,
      summary: `${e.type} on ${e.path.split(".").slice(-2).join(".")}`
    })).reverse().slice(0, 100);
  }
}
