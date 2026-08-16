import { useEffect, useState } from "react";
import { Users, Wifi, Circle } from "lucide-react";

interface Collaborator {
  userId: string;
  userName: string;
  userColor: string;
  lastActive: string;
}

interface CollabHeaderPresenceProps {
  roomId: string;
  title?: string;
}

export function CollabHeaderPresence({ roomId }: CollabHeaderPresenceProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { userId: "usr-1", userName: "Elena Rostova (Data Science Lead)", userColor: "#6366f1", lastActive: new Date().toISOString() },
    { userId: "usr-2", userName: "Marcus Chen (Data Engineer)", userColor: "#10b981", lastActive: new Date().toISOString() }
  ]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    let intervalId: any;
    const fetchPresence = async () => {
      try {
        const res = await fetch(`/api/v1/collab/rooms/${roomId}`);
        const data = await res.json();
        if (data.success && data.room?.collaborators) {
          setCollaborators(data.room.collaborators);
          setIsConnected(true);
        }
      } catch (err) {
        setIsConnected(false);
      }
    };

    fetchPresence();
    intervalId = setInterval(fetchPresence, 10000);
    return () => clearInterval(intervalId);
  }, [roomId]);

  return (
    <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-full px-3 py-1 text-xs">
      <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
        <Wifi className={`h-3.5 w-3.5 ${isConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
        <span className="font-bold text-white uppercase text-[10px] tracking-wider">
          {isConnected ? "WS Live" : "Polling"}
        </span>
      </div>

      <div className="h-3 w-px bg-slate-800" />

      <div className="flex items-center -space-x-2">
        {collaborators.map((c) => (
          <div
            key={c.userId}
            title={`${c.userName} - Active now`}
            className="h-6 w-6 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white shadow-lg relative group cursor-pointer"
            style={{ backgroundColor: c.userColor }}
          >
            {c.userName.charAt(0)}
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-slate-950" />
          </div>
        ))}
      </div>

      <span className="text-[10px] font-bold text-slate-400">
        {collaborators.length} online
      </span>
    </div>
  );
}
