import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  env: defineTable({
    file_name: v.string(),
    encryptedData: v.string(),
    path: v.string(),
    // TODO make sure the environment is unique par file
    environment: v.string(), // eg development, ci, staging, production
  }).index("by_file_name", ["file_name"]),
  team: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.string(),
  }).index("by_email", ["email"]),
  private_keys: defineTable({
    file_name: v.string(),
    private_key_slice: v.string(),
  }).index("by_file_name", ["file_name"]),
  audit_logs: defineTable({
    modified_by: v.string(),
    action_type: v.union(
      v.literal("CREATED"),
      v.literal("MODIFIED"),
      v.literal("DELETED")
    ),
  }),
});

// .env => production
// .env.local => development
// .env.development => development
// .env.ci => ci
// .env.staging => staging
// .env.production => production
// .env*.local => <*>:local eg .env.staging.local => staging:local
