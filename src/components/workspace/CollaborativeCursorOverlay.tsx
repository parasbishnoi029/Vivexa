import React from "react";
import { RemoteCollaborator } from "@/lib/yjsHocuspocusProvider";
import { Users, Wifi, MousePointer2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CollaborativeCursorOverlayProps {
  collaborators?: RemoteCollaborator[];
  connected?: boolean;
  roomId?: string;
  onOpenTimeTravel?: () => void;
}

export function CollaborativeCursorOverlay({
  collaborators = [],
  connected = true,
  roomId,
  onOpenTimeTravel
}: CollaborativeCursorOverlayProps) {
  return (
    <>
      {/* Top Collaboration Status Pill */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 shadow-sm backdrop-blur-sm">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <span className="font-mono text-[11px]">
            {connected ? "CRDT Real-time Sync" : "Connecting..."}
          </span>
        </div>

        {collaborators.length > 0 && (
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {collaborators.map((c) => (
              <div
                key={c.userId}
                title={`${c.userName} (Active)`}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-950 transition-transform hover:scale-110"
                style={{ backgroundColor: c.color }}
              >
                {c.userName.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Multi-Cursors in Canvas Area */}
      {collaborators
        .filter((c) => c.cursor && c.cursor.x > 0 && c.cursor.y > 0)
        .map((c) => (
          <div
            key={c.userId}
            className="fixed pointer-events-none z-50 transition-all duration-75 ease-out"
            style={{
              left: `${c.cursor!.x}px`,
              top: `${c.cursor!.y}px`,
              transform: "translate(-2px, -2px)"
            }}
          >
            <MousePointer2
              className="w-4 h-4 drop-shadow-md"
              style={{ color: c.color, fill: c.color }}
            />
            <div
              className="mt-0.5 ml-3 px-1.5 py-0.5 rounded text-[10px] font-medium text-white shadow-md whitespace-nowrap"
              style={{ backgroundColor: c.color }}
            >
              {c.userName}
            </div>
          </div>
        ))}
    </>
  );
}
