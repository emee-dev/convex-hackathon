import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { filter } from "convex-helpers/server/filter";

export const getUserByIdOrEmail = query({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { clerkUserId, email }) => {
    let record = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("clerkUserId"), clerkUserId),
          q.eq(q.field("email"), email)
        )
      )
      .first();

    if (!record) {
      return {
        message: "User was not found.",
        data: { isAuthenticated: false },
      };
    }

    return { message: "User was found.", data: { isAuthenticated: true } };
  },
});

export const createUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    system_role: v.literal("basic_user"),
  },
  handler: async (
    ctx,
    { email, firstName, lastName, system_role, clerkUserId }
  ) => {
    let doesUserExist = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("email"), email),
          q.eq(q.field("clerkUserId"), clerkUserId)
        )
      )
      .unique();

    if (doesUserExist) {
      return { message: "User already exists.", data: { created: true } };
    }

    let record = await ctx.db.insert("users", {
      email,
      lastName,
      firstName,
      clerkUserId,
      system_role,
    });

    if (!record) {
      return {
        message: "Account could not be created.",
        data: { created: true },
      };
    }

    return { message: "User was created.", data: { created: true } };
  },
});

// export const assignMemberRole = mutation({
//   args: {
//     projectId: v.string(),
//     clerkUserId: v.id<"users">("users"),
//     role: v.union(v.literal("basic_user"), v.literal("admin_user")),
//   },
//   handler: async (ctx, { role, clerkUserId, projectId }) => {
//     // Only admin-user role can create, view and delete envs.

//     let project = await filter(ctx.db.query("projects"), (project) => {
//       if (
//         project.uniqueProjectId === projectId &&
//         project.team.find((item) => item.clerkUserId === clerkUserId)
//       ) {
//         return true;
//       }
//       return false;
//     }).unique();

//     if (!project) {
//       return {
//         message: "Project was not found, please try again.",
//         data: null,
//       };
//     }

//     // Update team member role and return a new array to patch document
//     let team = project.team.map((item) => {
//       if (item.clerkUserId === clerkUserId) {
//         return {
//           clerkUserId,
//           project_role: role,
//         };
//       }

//       return item;
//     });

//     await ctx.db.patch(project._id, { team });

//     return { message: "Team member role was modified.", data: null };
//   },
// });

export const userRoleAndPermissions = query({
  args: {
    projectId: v.string(),
    clerkUserId: v.string(),
  },
  handler: async (ctx, { projectId, clerkUserId }) => {
    let project = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("uniqueProjectId"), projectId))
      .first();

    if (!project) {
      return { message: "Invalid project", data: null };
    }

    let user = project.team.find((user) => user.clerkUserId === clerkUserId);

    if (!user) {
      return { message: "User is not a valid team member.", data: null };
    }

    let role = await ctx.db
      .query("roles")
      .filter((q) => q.eq(q.field("_id"), user.roleId))
      .first();

    if (!role) {
      return { message: "Could not find user role.", data: null };
    }

    return {
      message: "Fetched roles",
      data: { user, permissions: role.permissions },
    };
  },
});
