import { v, VId } from "convex/values";
import { mutation, query } from "./_generated/server";
import { filter } from "convex-helpers/server/filter";

/**
 * Creates a new project, designates user as `project maintainer` and assigns the role `admin_user` to the user.
 */
export const createProject = mutation({
  args: {
    label: v.string(),
    userId: v.string(),
    roleId: v.string(),
    uniqueProjectId: v.string(), // project_uuid
    website_url: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { label, userId, roleId, uniqueProjectId, website_url }
  ) => {
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkUserId"), userId))
      .unique();

    if (!user) {
      return {
        message: "User with id could not be found.",
        data: { created: false },
      };
    }

    let role = await ctx.db
      .query("roles")
      .filter((q) =>
        q.and(q.eq(q.field("_id"), roleId), q.eq(q.field("code"), "admin_user"))
      )
      .unique();

    if (!role) {
      return {
        message: "Only roles of admin type can create a project.",
        data: { created: false },
      };
    }

    let project = await ctx.db.insert("projects", {
      label,
      uniqueProjectId,
      website: website_url,
      maintainedByClerkUserId: user.clerkUserId, // this is more flexible than userId
      team: [
        {
          roleId: role._id,
          project_role: role.code,
          clerkUserId: user.clerkUserId,
        },
      ],
    });

    if (!project) {
      return {
        message: "Project was not created, please try again.",
        data: { created: false },
      };
    }

    return { message: "Project was created.", data: { created: true } };
  },
});

export const getProjectWithId = query({
  args: {
    uniqueProjectId: v.string(),
  },
  handler: async (ctx, { uniqueProjectId }) => {
    let project = await ctx.db
      .query("projects")
      .withIndex("by_uniqueProjectId", (q) =>
        q.eq("uniqueProjectId", uniqueProjectId)
      )
      .unique();

    if (!project) {
      return {
        message: "Could find the project with id.",
        data: null,
      };
    }

    return {
      message: "Project was found.",
      data: project,
    };
  },
});

// Validates if clerkUserId is a valid team member
export const getProjectIdWithClerkUserId = query({
  args: {
    clerkUserId: v.string(),
    uniqueProjectId: v.string(),
  },
  handler: async (ctx, { clerkUserId, uniqueProjectId }) => {
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkUserId"), clerkUserId))
      .unique();

    if (!user) {
      return {
        message: "User was not found. Please login to continue.",
        data: null,
      };
    }

    // Find the
    let project = await filter(ctx.db.query("projects"), (project) => {
      let validProject = project.uniqueProjectId === uniqueProjectId;
      let teamMember = project.team.find(
        (member) => member.clerkUserId === user.clerkUserId
      );

      if (teamMember && validProject) {
        return true;
      }

      return false;
    }).unique();

    if (!project) {
      return {
        message: "User does not appear to be in a valid team.",
        data: null,
      };
    }

    let { team } = project;

    return {
      message: "User was found to be a team member.",
      data: {
        projectId: project.uniqueProjectId,
        project_role: team.find(
          (member) => member.clerkUserId === user.clerkUserId
        )!.project_role,
      },
    };
  },
});

// List the projects where the user is associated with
export const listProjects = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, { clerkUserId }) => {
    let user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkUserId"), clerkUserId))
      .unique();

    if (!user) {
      return {
        message: "User was not found. Please login to continue.",
        data: null,
      };
    }

    // Find the
    let project = await filter(ctx.db.query("projects"), (project) => {
      let teamMember = project.team.find(
        (member) => member.clerkUserId === user.clerkUserId
      );

      if (teamMember) {
        return true;
      }

      return false;
    }).collect();

    if (!project) {
      return {
        message: "User does not appear to have a valid team.",
        data: null,
      };
    }

    return {
      message: "User was found to be a team member.",
      data: project,
    };
  },
});
