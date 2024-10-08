import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const listIntegrations = query({
  args: {
    uniqueProjectId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { uniqueProjectId, paginationOpts }) => {
    let data = await ctx.db
      .query("integrations")
      .filter((q) => q.eq(q.field("uniqueProjectId"), uniqueProjectId))
      .paginate(paginationOpts);

    return data;
  },
});

export const apiKeyRoleAndPermissions = query({
  args: {
    unkeyKeyId: v.string(),
    uniqueProjectId: v.string(),
  },
  handler: async (ctx, { uniqueProjectId, unkeyKeyId }) => {
    let integration = await ctx.db
      .query("integrations")
      .filter((q) =>
        q.and(
          q.eq(q.field("unkeyKeyId"), unkeyKeyId),
          q.eq(q.field("uniqueProjectId"), uniqueProjectId)
        )
      )
      .first();

    if (!integration) {
      return { message: "Invalid integration", data: null };
    }

    let role = await ctx.db
      .query("roles")
      .filter((q) => q.eq(q.field("code"), integration.project_role))
      .first();

    if (!role) {
      return { message: "Could not find user role.", data: null };
    }

    return {
      message: "Fetched roles",
      data: { integration, permissions: role.permissions },
    };
  },
});

// export const deleteIntegration = mutation({
//   args: {},
//   handler: async (ctx, args) => {},
// });

export const storeIntegration = mutation({
  args: {
    label: v.string(),
    project_role: v.literal("basic_user"),
    uniqueProjectId: v.string(),
    unkeyKeyId: v.string(),
  },
  handler: async (
    ctx,
    { label, project_role, uniqueProjectId, unkeyKeyId }
  ) => {
    let doesIntegrationExist = await ctx.db
      .query("integrations")
      .filter((q) =>
        q.and(
          q.eq(q.field("uniqueProjectId"), uniqueProjectId),
          q.eq(q.field("unkeyKeyId"), unkeyKeyId)
        )
      )
      .first();

    if (doesIntegrationExist) {
      return { message: "Integration already exists", data: null };
    }

    await ctx.db.insert("integrations", {
      label,
      project_role,
      uniqueProjectId,
      unkeyKeyId,
    });

    return { message: "Integration was stored.", data: null };
  },
});
