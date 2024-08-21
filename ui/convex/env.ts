import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getEnvByFileName = query({
  args: {
    file_name: v.string(),
    path: v.string(),
  },
  handler: async (ctx, { file_name, path }) => {
    let does_env_exist = await ctx.db
      .query("env")
      .filter((q) =>
        q.and(
          q.eq(q.field("file_name"), file_name),
          q.eq(q.field("path"), path)
        )
      )
      .first();

    return { message: "Env was found!!!", data: does_env_exist };
  },
});

export const storeEnvFile = mutation({
  args: {
    file_name: v.string(),
    encryptedData: v.string(),
    path: v.string(),
    environment: v.string(),
  },
  handler: async (ctx, { file_name, encryptedData, path, environment }) => {
    let does_env_exist = await ctx.db
      .query("env")
      .filter((q) =>
        q.and(
          q.eq(q.field("file_name"), file_name),
          q.eq(q.field("path"), path),
          q.eq(q.field("environment"), environment)
        )
      )
      .first();

    if (!does_env_exist) {
      let new_record = await ctx.db.insert("env", {
        file_name,
        encryptedData,
        path,
        environment,
      });

      return { message: "Env was inserted", data: null };
    }

    // if (
    //   does_env_exist.file_name === file_name &&
    //   does_env_exist.path === path
    // ) {
    //   ctx.db.patch(does_env_exist._id, { content });
    //   return { message: "Env was updated!!!" };
    // }

    // TODO make sure you are not overriding the content, instead edit or appending as needed.
    ctx.db.patch(does_env_exist._id, { encryptedData });
    return { message: "Env was updated!!!", data: null };
  },
});

export const storePrivateKey = mutation({
  args: {
    file_name: v.string(),
    private_key_slice: v.string(),
  },
  handler: async (ctx, { file_name, private_key_slice }) => {
    let does_private_key_exist = await ctx.db
      .query("private_keys")
      .filter((q) => q.and(q.eq(q.field("file_name"), file_name)))
      .first();

    if (!does_private_key_exist) {
      await ctx.db.insert("private_keys", {
        file_name,
        private_key_slice,
      });

      return { message: "Private key was inserted", data: null };
    }

    ctx.db.patch(does_private_key_exist._id, { private_key_slice });
    return { message: "Private key was updated!!!", data: null };
  },
});
