import { useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Message } from "./Message";
import { ComposeBar } from "./ComposeBar";

export function Thread({
  parentId,
  channelId,
  userId,
  username,
  onClose,
}: {
  parentId: Id<"messages">;
  channelId: Id<"channels">;
  userId: string;
  username: string;
  onClose: () => void;
}) {
  const replies = useQuery(api.messages.replies, { parentId });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  return (
    <div className="thread-panel">
      <div className="thread-header">
        <h4>Thread</h4>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="messages">
        {replies?.map((msg) => (
          <Message
            key={msg._id}
            message={msg}
            userId={userId}
            username={username}
          />
        ))}
        <div ref={endRef} />
      </div>
      <ComposeBar
        channelId={channelId}
        parentId={parentId}
        userId={userId}
        username={username}
        placeholder="Reply..."
      />
    </div>
  );
}
