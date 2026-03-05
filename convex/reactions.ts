import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listForMessage = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    return await ctx.db
      .query("reactions")
      .withIndex("by_message", (q) => q.eq("messageId", messageId))
      .collect();
  },
});

export const toggle = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    emoji: v.string(),
    author: v.string(),
  },
  handler: async (ctx, { messageId, userId, emoji, author }) => {
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_message", (q) => q.eq("messageId", messageId))
      .collect();
    const mine = existing.find((r) => r.emoji === emoji && r.userId === userId);
    if (mine) {
      await ctx.db.delete(mine._id);
    } else {
      await ctx.db.insert("reactions", { messageId, userId, emoji, author });
    }
  },
});
