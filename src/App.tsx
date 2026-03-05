import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Sidebar } from "./components/Sidebar";
import { Chat } from "./components/Chat";
import type { Id } from "../convex/_generated/dataModel";

function getOrCreateUserId() {
  let id = localStorage.getItem("forum-user-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("forum-user-id", id);
  }
  return id;
}

export default function App() {
  const [userId] = useState(getOrCreateUserId);
  const [username, setUsername] = useState(
    () => localStorage.getItem("forum-username") || "",
  );
  const [entered, setEntered] = useState(
    () => !!localStorage.getItem("forum-username"),
  );
  const [activeChannel, setActiveChannel] = useState<Id<"channels"> | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const seed = useMutation(api.channels.seed);
  const channels = useQuery(api.channels.list);

  useEffect(() => {
    seed();
  }, [seed]);

  useEffect(() => {
    if (!activeChannel && channels && channels.length > 0) {
      setActiveChannel(channels[0]._id);
    }
  }, [channels, activeChannel]);

  if (!entered) {
    return (
      <div className="entry-screen">
        <div className="entry-card">
          <div className="entry-logo">OpenClaw</div>
          <h1>Workshop Forum</h1>
          <p>Enter your name to join the conversation</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (username.trim()) {
                localStorage.setItem("forum-username", username.trim());
                setEntered(true);
              }
            }}
          >
            <input
              type="text"
              placeholder="Your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <button type="submit" disabled={!username.trim()}>
              Join
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activeChannelName =
    channels?.find((c) => c._id === activeChannel)?.name || "";

  return (
    <div className="app">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        activeChannel={activeChannel}
        onSelectChannel={(id) => {
          setActiveChannel(id);
          setSidebarOpen(false);
        }}
        username={username}
        onChangeName={() => {
          localStorage.removeItem("forum-username");
          setEntered(false);
        }}
        isOpen={sidebarOpen}
      />
      <main className="main">
        {activeChannel ? (
          <Chat
            channelId={activeChannel}
            channelName={activeChannelName}
            userId={userId}
            username={username}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        ) : (
          <div className="empty-state">Select a channel to start chatting</div>
        )}
      </main>
    </div>
  );
}
