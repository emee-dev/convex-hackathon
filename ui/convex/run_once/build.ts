import { mutation } from "../_generated/server";

// roles
const roles = [
  {
    _id: "k574my9yv1pg169n01jcjrya3d70xk3t",
    code: "basic_user" as "basic_user" | "admin_user",
    description: "Just a basic user nothing too serious.",
    name: "Basic User",
    permissions: [
      {
        code: "view:env",
        permissionId: "k17b1q7ywg67mjb7b8b2jt7rxh6zzes6",
      },
    ],
    // uniqueProjectId: "2a8136f6-5c57-40a7-973d-81d6b23b4160",
  },
  {
    _id: "k57ch3s5x2j0cbab9qjzaxm0p56zz1ts",
    code: "admin_user" as "basic_user" | "admin_user",
    description:
      "Kind of like the project manager, helps oversee the creation and management of env variables.",
    name: "Project Manager",
    permissions: [
      {
        code: "view:env",
        permissionId: "k17b1q7ywg67mjb7b8b2jt7rxh6zzes6",
      },
    ],
    // uniqueProjectId: "2a8136f6-5c57-40a7-973d-81d6b23b4160",
  },
];

// Permissions
const permissions = [
  {
    _id: "k1778dj7rnc5qfdcjppqgm443n6zzbv5",
    code: "delete:env",
    description: "To be able to delete env variables.",
    name: "Delete env",
  },
  {
    _id: "k17cqhn7trfgtkbjgnt0d743rs6zy3xa",
    code: "create:env",
    description: "To be able to create env variables.",
    name: "Create env",
  },
  {
    _id: "k17b1q7ywg67mjb7b8b2jt7rxh6zzes6",
    code: "view:env",
    description: "To be able to read or view env variables.",
    name: "View env",
  },
] as const;

export const injectRoleAndPermissions = mutation({
  args: {},
  handler: async (ctx, args) => {
    let rolesDb = await ctx.db.query("roles").collect();
    let permissionsDb = await ctx.db.query("permissions").collect();
    let systemDb = ctx.db.query("system").first();

    console.log("System Db: ", systemDb);
    console.log("permissions Db: ", permissionsDb.length);
    console.log("roles Db: ", rolesDb.length);

    if (!systemDb && rolesDb.length === 0 && permissionsDb.length === 0) {
      await Promise.all(
        permissions.map(async (permission) => {
          return await ctx.db.insert("permissions", permission);
        })
      );

      await Promise.all(
        roles.map(async (role) => {
          // @ts-expect-error
          return await ctx.db.insert("roles", role);
        })
      );

      await ctx.db.insert("system", {
        addedPermissions: true,
        addedRoles: true,
      });

      console.log("Added the required roles and permissions tables.");
    }

    await ctx.db.insert("system", {
      addedPermissions: false,
      addedRoles: false,
    });
    console.log("Roles and permissions has already been injected.");
  },
});
