import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all messages for a thread
export const getMessages = query({
  args: {
    threadId: v.id("threads"),
  },
  async handler(ctx, args) {
    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("threadId"), args.threadId))
      .order("asc")
      .collect();
  },
});

// Create a new message
export const createMessage = mutation({
  args: {
    threadId: v.id("threads"),
    content: v.string(),
    role: v.string(),
    userId: v.id("users"),
  },
  async handler(ctx, args) {
    // Update the thread's lastMessageAt
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    
    await ctx.db.patch(args.threadId, {
      lastMessageAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create the message
    const messageId = await ctx.db.insert("messages", {
      threadId: args.threadId,
      content: args.content,
      role: args.role,
      createdAt: Date.now(),
      userId: args.userId,
    });
    
    return messageId;
  },
});

// Create a message summary
export const createMessageSummary = mutation({
  args: {
    threadId: v.id("threads"),
    messageId: v.id("messages"),
    content: v.string(),
    userId: v.id("users"),
  },
  async handler(ctx, args) {
    const summaryId = await ctx.db.insert("messageSummaries", {
      threadId: args.threadId,
      messageId: args.messageId,
      content: args.content,
      createdAt: Date.now(),
      userId: args.userId,
    });
    
    return summaryId;
  },
});

// Get message summaries for a thread
export const getMessageSummaries = query({
  args: {
    threadId: v.id("threads"),
  },
  async handler(ctx, args) {
    return await ctx.db
      .query("messageSummaries")
      .filter((q) => q.eq(q.field("threadId"), args.threadId))
      .order("asc")
      .collect();
  },
}); 