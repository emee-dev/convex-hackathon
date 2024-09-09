import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    let encryptedContent = await ctx.db
      .query("audit_logs")
      .filter((q) => q.eq(q.field("variableId"), file._id))
      .order("desc")
      .first();

    return { message: "Environemt was returned.", data: encryptedContent };
  },
});

export const storeEnvFile = mutation({
  args: {
    env: v.object({
      path: v.string(),
      version: v.string(),
      fileName: v.string(),
      projectId: v.string(),
      encryptedData: v.string(),
    }),
    user: v.object({
      clerkUserId: v.string(),
    }),
  },
  handler: async (ctx, { env, user }) => {
    const { fileName, encryptedData, path, projectId, version } = env;
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
        variableId,
        encryptedData,
        type: "CREATED",
        uniqueProjectId: projectId,
        modifiedByclerkUserId: clerkUserId,
      });

      return {
        message: "Environemt variable was stored.",
        data: { modified: false, acknowledged: true },
      };
    }

    // Use uuid to make sure that the private keys are not overwritten
    await ctx.db.insert("audit_logs", {
      version,
      encryptedData,
      type: "MODIFIED",
      uniqueProjectId: projectId,
      variableId: variableRecord._id,
      modifiedByclerkUserId: clerkUserId,
    });

    return {
      message: "Environemt variable was modified.",
      data: { modified: true, acknowledged: true },
    };
  },
});
