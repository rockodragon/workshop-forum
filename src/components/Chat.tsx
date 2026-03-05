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
  username,
}: {
  channelId: Id<"channels">;
  channelName: string;
  username: string;
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
          <h3>
            <span className="hash">#</span> {channelName}
          </h3>
        </div>
        <div className="messages">
          {messages?.map((msg) => (
            <Message
              key={msg._id}
              message={msg}
              username={username}
              onOpenThread={() => setThreadParent(msg._id)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <ComposeBar
          channelId={channelId}
          username={username}
          placeholder={`Message #${channelName}...`}
        />
      </div>
      {threadParent && (
        <Thread
          parentId={threadParent}
          channelId={channelId}
          username={username}
          onClose={() => setThreadParent(null)}
        />
      )}
    </div>
  );
}
