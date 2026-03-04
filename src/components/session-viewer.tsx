"use client";

interface Message {
  role: string;
  content: string;
  created_at: string;
  crisis_score?: number;
}

export default function SessionViewer({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return <p className="text-zinc-600 text-sm py-4">No messages in this session.</p>;
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      {messages.map((msg, i) => {
        const isUser = msg.role === "user";
        const isCrisis = (msg.crisis_score ?? 0) > 0.5;
        return (
          <div
            key={i}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                isUser
                  ? "bg-violet-600/20 text-violet-200 border border-violet-700/30"
                  : "bg-zinc-800 text-zinc-300 border border-zinc-700/30"
              } ${isCrisis ? "ring-2 ring-red-500/50" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium uppercase text-zinc-500">
                  {isUser ? "User" : "Lumis"}
                </span>
                {isCrisis && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                    CRISIS
                  </span>
                )}
                <span className="text-[10px] text-zinc-600 ml-auto">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
