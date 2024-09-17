import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const getEnvByFileName = query({
  args: {
    fileName: v.string(),
    projectId: v.string(),
  },
  handler: async (ctx, { fileName, projectId /* skip_flag */ }) => {
    let file = await ctx.db
      .query("variables")
      .filter((q) =>
        q.and(
          q.eq(q.field("fileName"), fileName),
          q.eq(q.field("uniqueProjectId"), projectId)
        )
      )
      .first();

    if (!file) {
      return {
        message: "Could not find environment by file name.",
        data: null,
      };
    }

    // Get the latest changes
    let variableContent = await ctx.db
      .query("audit_logs")
      .filter((q) => q.eq(q.field("variableId"), file._id))
      .order("desc")
      .first();

    return { message: "Environment was returned.", data: variableContent };
  },
});

export const storeEnvFile = mutation({
  args: {
    env: v.object({
      path: v.string(),
      version: v.string(),
      message: v.string(),
      fileName: v.string(),
      projectId: v.string(),
      encryptedData: v.string(),
    }),
    user: v.object({
      clerkUserId: v.string(),
    }),
  },
  handler: async (ctx, { env, user }) => {
    const { fileName, encryptedData, path, projectId, version, message } = env;
    const { clerkUserId } = user;

    let variableRecord = await ctx.db
      .query("variables")
      .filter((q) =>
        q.and(
          q.eq(q.field("path"), path),
          q.eq(q.field("fileName"), fileName),
          q.eq(q.field("uniqueProjectId"), projectId)
        )
      )
      .first();

    if (!variableRecord) {
      let variableId = await ctx.db.insert("variables", {
        path,
        fileName,
        uniqueProjectId: projectId,
      });

      let new_record = await ctx.db.insert("audit_logs", {
        version,
        message,
        variableId,
        encryptedData,
        type: "CREATED",
        uniqueProjectId: projectId,
        modifiedByclerkUserId: clerkUserId,
      });

      return {
        message: "Environment variable was stored.",
        data: { modified: false, acknowledged: true },
      };
    }

    // Use uuid to make sure that the private keys are not overwritten
    await ctx.db.insert("audit_logs", {
      version,
      message,
      encryptedData,
      type: "MODIFIED",
      uniqueProjectId: projectId,
      variableId: variableRecord._id,
      modifiedByclerkUserId: clerkUserId,
    });

    return {
      message: "Environment variable was modified.",
      data: { modified: true, acknowledged: true },
    };
  },
});

export const listVariables = query({
  args: {
    uniqueProjectId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { uniqueProjectId, paginationOpts }) => {
    let data = await ctx.db
      .query("variables")
      .filter((q) => q.eq(q.field("uniqueProjectId"), uniqueProjectId))
      .paginate(paginationOpts);

    return data;
  },
});

export const listAuditLogs = query({
  args: {
    uniqueProjectId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { uniqueProjectId, paginationOpts }) => {
    let data = await ctx.db
      .query("audit_logs")
      .filter((q) => q.eq(q.field("uniqueProjectId"), uniqueProjectId))
      .paginate(paginationOpts);

    return data;
  },
});
