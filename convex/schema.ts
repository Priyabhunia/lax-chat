import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  threads: defineTable({
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastMessageAt: v.number(),
    userId: v.string(),
  }).index("by_user", ["userId"]),
  messages: defineTable({
    threadId: v.id("threads"),
    content: v.string(),
    role: v.string(),
    createdAt: v.number(),
    userId: v.string(),
  }).index("by_thread", ["threadId"]),
  messageSummaries: defineTable({
    threadId: v.id("threads"),
    messageId: v.id("messages"),
    content: v.string(),
    createdAt: v.number(),
    userId: v.string(),
  }).index("by_thread", ["threadId"]),
}); 