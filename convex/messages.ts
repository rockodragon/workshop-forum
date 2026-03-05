import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, { channelId }) => {
    // Get top-level messages (no parent)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .order("asc")
      .collect();
    return messages.filter((m) => !m.parentId);
  },
});

export const replies = query({
  args: { parentId: v.id("messages") },
  handler: async (ctx, { parentId }) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", parentId))
      .order("asc")
      .collect();
  },
});

export const send = mutation({
  args: {
    channelId: v.id("channels"),
    parentId: v.optional(v.id("messages")),
    userId: v.string(),
    author: v.string(),
    body: v.string(),
    imageUrl: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    body: v.string(),
  },
  handler: async (ctx, { messageId, userId, body }) => {
    const msg = await ctx.db.get(messageId);
    if (!msg || msg.userId !== userId) throw new Error("Not allowed");
    await ctx.db.patch(messageId, { body, editedAt: Date.now() });
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, { fileId }) => {
    return await ctx.storage.getUrl(fileId);
  },
});
