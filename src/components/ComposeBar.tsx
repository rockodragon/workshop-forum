import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function ComposeBar({
  channelId,
  parentId,
  userId,
  username,
  placeholder,
}: {
  channelId: Id<"channels">;
  parentId?: Id<"messages">;
  userId: string;
  username: string;
  placeholder: string;
}) {
  const send = useMutation(api.messages.send);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const [body, setBody] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    id: Id<"_storage">;
    name: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) {
        console.error("Upload failed:", result.status, await result.text());
        return;
      }
      const json = await result.json();
      setPendingFile({ id: json.storageId, name: file.name });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && !pendingFile) return;
    await send({
      channelId,
      parentId,
      userId,
      author: username,
      body: body.trim() || (pendingFile ? pendingFile.name : ""),
      fileId: pendingFile?.id,
      fileName: pendingFile?.name,
    });
    setBody("");
    setPendingFile(null);
  };

  return (
    <form className="compose" onSubmit={handleSend}>
      {pendingFile && (
        <div className="pending-file">
          📎 {pendingFile.name}
          <button type="button" onClick={() => setPendingFile(null)}>
            ✕
          </button>
        </div>
      )}
      <div className="compose-row">
        <button
          type="button"
          className="attach-btn"
          title="Upload file"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "..." : "📎"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileSelect}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button type="submit" disabled={!body.trim() && !pendingFile}>
          Send
        </button>
      </div>
    </form>
  );
}
