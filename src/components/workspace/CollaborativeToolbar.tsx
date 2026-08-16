import React, { useState } from "react";
import { Users, Wifi, Share2, Copy, Check, Radio, Eye, Lock, Sparkles, MessageSquare } from "lucide-react";
import { useCollaborationStore, Collaborator } from "@/stores/collaborationStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface CollaborativeToolbarProps {
  roomTitle?: string;
  className?: string;
}

export const CollaborativeToolbar: React.FC<CollaborativeToolbarProps> = ({
  roomTitle = "Workspace Canvas",
  className = ""
}) => {
  const {
    collaborators,
    isConnected,
    latencyMs,
    currentUserId,
    activityFeed,
    isFollowingUserId,
    followCollaborator
  } = useCollaborationStore();

  const [showActivity, setShowActivity] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Collaborative canvas room link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={`relative flex items-center gap-2.5 ${className}`}>
      {/* Live Presence Indicator */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>{collaborators.length} Live</span>
        <span className="text-[10px] text-muted-foreground/80 font-mono">({latencyMs}ms)</span>
      </div>

      {/* Collaborator Avatars Stack */}
      <div className="flex items-center -space-x-2">
        {collaborators.map((c) => {
          const isMe = c.id === currentUserId;
          const isFollowing = isFollowingUserId === c.id;

          return (
            <div
              key={c.id}
              onClick={() => !isMe && followCollaborator(isFollowing ? null : c.id)}
              className="relative group cursor-pointer transition-transform hover:scale-110 hover:z-20"
              title={`${c.name} (${c.role}) ${isMe ? "• You" : "• Click to Follow"}`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm ring-2 ring-background"
                style={{ backgroundColor: c.color }}
              >
                {c.name.charAt(0).toUpperCase()}
              </div>

              {/* Typing indicator pulse */}
              {c.isTyping && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-indigo-600 text-[8px] text-white">
                  ✍️
                </span>
              )}

              {/* Following badge */}
              {isFollowing && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-[8px] text-white rounded-full px-1 font-bold">
                  👀
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Activity Log Drawer Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowActivity(!showActivity)}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
      >
        <Radio className="w-3.5 h-3.5 text-indigo-500" />
        <span className="hidden sm:inline">Activity</span>
      </Button>

      {/* Share / Invite Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyShareLink}
        className="h-7 px-2.5 text-xs gap-1.5 border-border/80 hover:border-indigo-500/50"
      >
        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-indigo-500" />}
        <span className="hidden sm:inline">{copiedLink ? "Copied" : "Live Room"}</span>
      </Button>

      {/* Activity Dropdown Popover */}
      <AnimatePresence>
        {showActivity && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            className="absolute right-0 top-9 w-80 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl p-3 z-50 text-xs"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
              <span className="font-semibold flex items-center gap-1.5 text-foreground">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Collaborative Session Stream
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">CRDT-Sync v2.4</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {activityFeed.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent collaboration events</p>
              ) : (
                activityFeed.map((act) => (
                  <div key={act.id} className="flex items-start gap-2 p-1.5 rounded-lg bg-muted/40 hover:bg-muted/70">
                    <span
                      className="w-2 h-2 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: act.userColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground leading-snug">
                        <span className="font-medium">{act.userName}</span>{" "}
                        <span className="text-muted-foreground">
                          {act.action === "RUN_CELL" && "executed kernel code"}
                          {act.action === "EDIT_CELL" && "modified cell contents"}
                          {act.action === "ADD_WIDGET" && "added a dashboard visualization"}
                          {act.action === "FILTER_CHANGE" && "updated global temporal slice"}
                          {act.action === "JOINED_ROOM" && "joined live collaborative session"}
                          {act.action === "SYNC_STATE" && "synchronized canvas state"}
                        </span>
                      </p>
                      {act.targetName && (
                        <p className="text-[10px] text-indigo-500 font-mono truncate">{act.targetName}</p>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground shrink-0">{act.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
