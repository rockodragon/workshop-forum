import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Message } from "./Message";
import { Thread } from "./Thread";
import { ComposeBar } from "./ComposeBar";

export function Chat({
  channelId,
  channelName,
  userId,
  username,
  onOpenSidebar,
}: {
  channelId: Id<"channels">;
  channelName: string;
  userId: string;
  username: string;
  onOpenSidebar: () => void;
}) {
  const messages = useQuery(api.messages.list, { channelId });
  const [threadParent, setThreadParent] = useState<Id<"messages"> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setThreadParent(null);
  }, [channelId]);

  return (
    <div className="chat-layout">
      <div className={`chat ${threadParent ? "chat-narrow" : ""}`}>
        <div className="chat-header">
          <button className="menu-btn" onClick={onOpenSidebar}>
            ☰
          </button>
          <h3>
            <span className="hash">#</span> {channelName}
          </h3>
        </div>
        <div className="messages">
          {messages?.map((msg) => (
            <Message
              key={msg._id}
              message={msg}
              userId={userId}
              username={username}
              onOpenThread={() => setThreadParent(msg._id)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <ComposeBar
          channelId={channelId}
          userId={userId}
          username={username}
          placeholder={`Message #${channelName}...`}
        />
      </div>
      {threadParent && (
        <Thread
          parentId={threadParent}
          channelId={channelId}
          userId={userId}
          username={username}
          onClose={() => setThreadParent(null)}
        />
      )}
    </div>
  );
}
