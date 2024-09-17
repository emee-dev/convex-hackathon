import { defineSchema, defineTable, GenericSchema } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    lastName: v.string(),
    firstName: v.string(),
    clerkUserId: v.string(), // from clerk auth
    system_role: v.literal("basic_user"),
  })
    .index("by_email", ["email"])
    .index("by_clerkUserId", ["clerkUserId"]),
  projects: defineTable({
    label: v.string(),
    website: v.optional(v.string()),
    uniqueProjectId: v.string(),
    team: v.array(
      v.object({
        clerkUserId: v.string(),
        roleId: v.id<"roles">("roles"),
        project_role: v.union(v.literal("basic_user"), v.literal("admin_user")),
      })
    ),
    // the project ownwer or initial admin_user.
    maintainedByClerkUserId: v.string(),
  }).index("by_uniqueProjectId", ["uniqueProjectId"]),
  variables: defineTable({
    path: v.string(),
    fileName: v.string(),
    uniqueProjectId: v.string(),
  }).index("by_fileName", ["fileName"]),
  audit_logs: defineTable({
    // Helps to keep track of edit versions and identify decryption private keys.
    version: v.string(),
    uniqueProjectId: v.string(),
    encryptedData: v.string(),
    modifiedByclerkUserId: v.string(),
    message: v.optional(v.string()),
    variableId: v.id<"variables">("variables"),
    type: v.union(
      v.literal("CREATED"),
      v.literal("MODIFIED"),
      v.literal("DELETED")
    ),
  }),

  // Defines what users are allowed to do.
  roles: defineTable({
    name: v.string(),
    description: v.string(),
    uniqueProjectId: v.optional(v.string()), // allows multiple roles
    code: v.union(v.literal("basic_user"), v.literal("admin_user")), // unique code
    permissions: v.array(
      v.object({
        code: v.string(),
        permissionId: v.id<"permissions">("permissions"),
      })
    ),
  }),
  // Defines the specific tasks and actions that users can take. Group permissions into roles.
  permissions: defineTable({
    name: v.string(),
    // default "view:env"
    code: v.union(
      v.literal("view:env"),
      v.literal("create:env"),
      v.literal("delete:env")
    ),
    description: v.string(),
  }),

  docs: defineTable({
    body: v.string(), // original text
    fileName: v.string(),
    embedding: v.array(v.float64()),
  }).vectorIndex("by_embedding", {
    dimensions: 768, // original from docs is: 1536
    vectorField: "embedding",
    filterFields: ["fileName"],
  }),

  integrations: defineTable({
    label: v.string(),
    unkeyKeyId: v.string(),
    uniqueProjectId: v.string(),
    project_role: v.literal("basic_user"),
  }).index("by_unkeyKeyId", ["unkeyKeyId"]),

  // System build settings
  system: defineTable({
    addedRoles: v.boolean(),
    addedPermissions: v.boolean(),
  }),
});
