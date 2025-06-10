import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { ConvexError } from "convex/values";
import { hashPassword, comparePassword } from "./authHelpers";

// Helper query to check if email exists
export const checkEmailExists = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

// Helper query to get user by email
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

// Helper mutation to create a user
export const createUser = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      email: args.email,
      passwordHash: args.passwordHash,
      name: args.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Register a new user with email and password
export const register = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email, password, name } = args;
    
    // Check if email already exists
    const existingUser = await ctx.runQuery("auth:checkEmailExists", { email });
    
    if (existingUser) {
      throw new ConvexError("Email already in use");
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the user
    const userId = await ctx.runMutation("auth:createUser", {
      email,
      passwordHash,
      name,
    });

    return { userId };
  },
});

// Login with email and password
export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password } = args;
    
    // Find the user
    const user = await ctx.runQuery("auth:getUserByEmail", { email });
    
    if (!user) {
      throw new ConvexError("Invalid email or password");
    }

    // Check password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new ConvexError("Invalid email or password");
    }

    // Return user info
    return { 
      userId: user._id,
      email: user.email,
      name: user.name,
    };
  },
});

// Get the current user
export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    
    // Don't return the password hash
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
}); 