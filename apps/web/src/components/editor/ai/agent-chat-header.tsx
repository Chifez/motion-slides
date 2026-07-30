import { memo } from "react";
import { X, BotMessageSquare, Circle } from "lucide-react";

interface Props {
  onClose: () => void;
}

export const AgentChatHeader = memo(function AgentChatHeader({
  onClose,
}: Props) {
  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-(--ms-border) shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="relative p-1.5 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/20 border border-purple-500/20">
          <BotMessageSquare size={16} className="text-purple-300" />
          {/* Live indicator */}
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-(--ms-bg-base)" />
        </div>
        <div>
          <p className="text-sm font-bold text-(--ms-text-primary) leading-none">
            MotionSlide Agent
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="p-1.5 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors border-none bg-transparent cursor-pointer"
        aria-label="Close agent panel"
      >
        <X size={18} />
      </button>
    </div>
  );
});
