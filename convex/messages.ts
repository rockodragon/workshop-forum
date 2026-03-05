import {
  query,
  mutation,
  internalAction,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
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
    const messageId = await ctx.db.insert("messages", {
      ...args,
      createdAt: Date.now(),
    });
    // Schedule OG fetch if body contains a URL
    const urlMatch = args.body.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      await ctx.scheduler.runAfter(0, internal.messages.fetchOg, {
        messageId,
        url: urlMatch[0],
      });
    }
    return messageId;
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

export const remove = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
  },
  handler: async (ctx, { messageId, userId }) => {
    const msg = await ctx.db.get(messageId);
    if (!msg || msg.userId !== userId) throw new Error("Not allowed");
    // Delete reactions on this message
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_message", (q) => q.eq("messageId", messageId))
      .collect();
    for (const r of reactions) {
      await ctx.db.delete(r._id);
    }
    // Delete replies
    const replies = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", messageId))
      .collect();
    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }
    await ctx.db.delete(messageId);
  },
});

export const fetchOg = internalAction({
  args: { messageId: v.id("messages"), url: v.string() },
  handler: async (ctx, { messageId, url }) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        headers: { "User-Agent": "bot" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      // Only read first 50KB to find OG tags
      const text = await res.text();
      const head = text.slice(0, 50000);

      const get = (prop: string) => {
        const match = head.match(
          new RegExp(
            `<meta[^>]*property=["']og:${prop}["'][^>]*content=["']([^"']*)["']`,
            "i",
          ),
        );
        // Also try name= variant
        if (match) return match[1];
        const match2 = head.match(
          new RegExp(
            `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${prop}["']`,
            "i",
          ),
        );
        return match2 ? match2[1] : undefined;
      };

      const title = get("title");
      const description = get("description");
      const image = get("image");

      if (title || description || image) {
        await ctx.runMutation(internal.messages.setOgData, {
          messageId,
          ogData: { url, title, description, image },
        });
      }
    } catch {
      // Silently fail — no preview is fine
    }
  },
});

export const setOgData = internalMutation({
  args: {
    messageId: v.id("messages"),
    ogData: v.object({
      url: v.string(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      image: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { messageId, ogData }) => {
    await ctx.db.patch(messageId, { ogData });
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
