import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

const QUICK_EMOJIS = ["👍", "❤️", "🎉", "🤔", "👀"];

export function Message({
  message,
  userId,
  username,
  onOpenThread,
}: {
  message: Doc<"messages">;
  userId: string;
  username: string;
  onOpenThread?: () => void;
}) {
  const reactions = useQuery(api.reactions.listForMessage, {
    messageId: message._id,
  });
  const toggleReaction = useMutation(api.reactions.toggle);
  const replies = useQuery(api.messages.replies, { parentId: message._id });
  const updateMessage = useMutation(api.messages.update);
  const removeMessage = useMutation(api.messages.remove);
  const fileUrl = useQuery(
    api.messages.getFileUrl,
    message.fileId ? { fileId: message.fileId } : "skip",
  );

  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState("");

  const grouped: Record<string, string[]> = {};
  reactions?.forEach((r) => {
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(r.author);
  });

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isOwn = message.userId === userId;
  const isImage =
    message.fileName?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ||
    fileUrl?.match(/\.(png|jpg|jpeg|gif|webp|svg)/i);

  const handleSaveEdit = async () => {
    if (!editBody.trim()) return;
    await updateMessage({
      messageId: message._id,
      userId,
      body: editBody.trim(),
    });
    setEditing(false);
  };

  return (
    <div className="message">
      <div className="message-header">
        <strong className="author">{message.author}</strong>
        <span className="time">{time}</span>
        {message.editedAt && <span className="edited">(edited)</span>}
        {isOwn && !editing && (
          <>
            <button
              className="edit-btn"
              onClick={() => {
                setEditBody(message.body);
                setEditing(true);
              }}
            >
              edit
            </button>
            <button
              className="delete-btn"
              onClick={() => {
                if (confirm("Delete this message?")) {
                  removeMessage({ messageId: message._id, userId });
                }
              }}
            >
              delete
            </button>
          </>
        )}
      </div>
      {editing ? (
        <div className="edit-form">
          <input
            type="text"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
          />
          <div className="edit-actions">
            <button onClick={handleSaveEdit}>Save</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="message-body">{renderBody(message.body)}</div>
      )}
      {message.ogData && (
        <a
          href={message.ogData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="og-card"
        >
          {message.ogData.image && (
            <img src={message.ogData.image} alt="" className="og-image" />
          )}
          <div className="og-text">
            {message.ogData.title && (
              <div className="og-title">{message.ogData.title}</div>
            )}
            {message.ogData.description && (
              <div className="og-description">{message.ogData.description}</div>
            )}
            <div className="og-url">{message.ogData.url}</div>
          </div>
        </a>
      )}
      {message.imageUrl && (
        <img
          src={message.imageUrl}
          alt="attachment"
          className="message-image"
        />
      )}
      {fileUrl && isImage && (
        <img
          src={fileUrl}
          alt={message.fileName || "upload"}
          className="message-image"
        />
      )}
      {fileUrl && !isImage && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="file-link"
        >
          📄 {message.fileName || "Download file"}
        </a>
      )}
      <div className="message-actions">
        <div className="reactions">
          {Object.entries(grouped).map(([emoji, authors]) => (
            <button
              key={emoji}
              className={`reaction ${authors.includes(username) ? "mine" : ""}`}
              onClick={() =>
                toggleReaction({
                  messageId: message._id,
                  userId,
                  emoji,
                  author: username,
                })
              }
              title={authors.join(", ")}
            >
              {emoji} {authors.length}
            </button>
          ))}
          <div className="add-reaction">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="emoji-btn"
                onClick={() =>
                  toggleReaction({
                    messageId: message._id,
                    userId,
                    emoji,
                    author: username,
                  })
                }
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        {onOpenThread && (
          <button className="thread-btn" onClick={onOpenThread}>
            💬{" "}
            {replies && replies.length > 0
              ? `${replies.length} replies`
              : "Reply"}
          </button>
        )}
      </div>
    </div>
  );
}

function renderBody(body: string) {
  const parts = body.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
