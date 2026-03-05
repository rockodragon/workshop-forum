import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("channels").order("asc").collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const existing = await ctx.db
      .query("channels")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("channels", {
      name,
      createdAt: Date.now(),
    });
  },
});

export const seed = mutation({
  handler: async (ctx) => {
    const defaults = ["setup", "use-cases", "docs-and-references"];
    for (const name of defaults) {
      const existing = await ctx.db
        .query("channels")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first();
      if (!existing) {
        await ctx.db.insert("channels", { name, createdAt: Date.now() });
      }
    }
  },
});
