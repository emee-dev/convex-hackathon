import { query } from "./_generated/server";

export const listRoles = query({
  args: {},
  handler: async (ctx, args) => {
    let data = await ctx.db.query("roles").collect();

    return data;
  },
});

// export const listPermissions = query({
//   args: {},
//   handler: async (ctx, args) => {},
// });
