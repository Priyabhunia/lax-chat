import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all threads for a user
export const getThreads = query({
  args: {
    userId: v.id("users"),
  },
  async handler(ctx, args) {
    return await ctx.db
      .query("threads")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
  },
});

// Get a specific thread
export const getThread = query({
  args: {
    threadId: v.id("threads"),
  },
  async handler(ctx, args) {
    return await ctx.db.get(args.threadId);
  },
});

// Create a new thread
export const createThread = mutation({
  args: {
    title: v.string(),
    userId: v.id("users"),
  },
  async handler(ctx, args) {
    const now = Date.now();
    const threadId = await ctx.db.insert("threads", {
      title: args.title,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
    });
    
    return threadId;
  },
});

// Update a thread
export const updateThread = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.optional(v.string()),
  },
  async handler(ctx, args) {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    
    const updates = {
      updatedAt: Date.now(),
    } as any;
    
    if (args.title !== undefined) {
      updates.title = args.title;
    }
    
    await ctx.db.patch(args.threadId, updates);
    return args.threadId;
  },
});

// Delete a thread
export const deleteThread = mutation({
  args: {
    threadId: v.id("threads"),
  },
  async handler(ctx, args) {
    // Check if thread exists first
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      console.warn(`Attempted to delete non-existent thread: ${args.threadId}`);
      return null; // Return null instead of throwing an error
    }
    
    // Delete all messages in the thread
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("threadId"), args.threadId))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    // Delete all message summaries
    const summaries = await ctx.db
      .query("messageSummaries")
      .filter((q) => q.eq(q.field("threadId"), args.threadId))
      .collect();
    
    for (const summary of summaries) {
      await ctx.db.delete(summary._id);
    }
    
    // Delete the thread
    await ctx.db.delete(args.threadId);
    return args.threadId;
  },
}); 