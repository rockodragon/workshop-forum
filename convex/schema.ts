import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  channels: defineTable({
    name: v.string(), // e.g. "setup", "use-cases"
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  messages: defineTable({
    channelId: v.id("channels"),
    parentId: v.optional(v.id("messages")), // for threading
    userId: v.string(), // browser UUID
    author: v.string(),
    body: v.string(),
    imageUrl: v.optional(v.string()), // optional image/link URL
    fileId: v.optional(v.id("_storage")), // uploaded file
    fileName: v.optional(v.string()),
    ogData: v.optional(
      v.object({
        url: v.string(),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        image: v.optional(v.string()),
      }),
    ),
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_channel", ["channelId", "createdAt"])
    .index("by_parent", ["parentId", "createdAt"]),

  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.string(),
    emoji: v.string(),
    author: v.string(),
  }).index("by_message", ["messageId"]),
});
