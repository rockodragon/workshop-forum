import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function Sidebar({
  activeChannel,
  onSelectChannel,
  username,
  onChangeName,
  isOpen,
}: {
  activeChannel: Id<"channels"> | null;
  onSelectChannel: (id: Id<"channels">) => void;
  username: string;
  onChangeName: () => void;
  isOpen: boolean;
}) {
  const channels = useQuery(api.channels.list);
  const createChannel = useMutation(api.channels.create);
  const [newChannel, setNewChannel] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <div className="logo">OpenClaw</div>
      </div>
      <nav className="channel-list">
        {channels?.map((ch) => (
          <button
            key={ch._id}
            className={`channel-btn ${ch._id === activeChannel ? "active" : ""}`}
            onClick={() => onSelectChannel(ch._id)}
          >
            <span className="hash">#</span> {ch.name}
          </button>
        ))}
      </nav>
      {showCreate ? (
        <form
          className="new-channel-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const name = newChannel.trim().toLowerCase().replace(/\s+/g, "-");
            if (name) {
              const id = await createChannel({ name });
              if (id) onSelectChannel(id);
              setNewChannel("");
              setShowCreate(false);
            }
          }}
        >
          <input
            type="text"
            placeholder="channel-name"
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            autoFocus
          />
          <div className="new-channel-actions">
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="add-channel-btn" onClick={() => setShowCreate(true)}>
          + New Channel
        </button>
      )}
      <div className="sidebar-footer">
        <span className="username">{username}</span>
        <button className="change-name-btn" onClick={onChangeName}>
          Change
        </button>
      </div>
    </aside>
  );
}
