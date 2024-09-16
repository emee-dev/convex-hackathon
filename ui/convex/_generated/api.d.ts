/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as docs from "../docs.js";
import type * as env from "../env.js";
import type * as inngest_load from "../inngest/load.js";
import type * as integrations from "../integrations.js";
import type * as project from "../project.js";
import type * as roles from "../roles.js";
import type * as user from "../user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  docs: typeof docs;
  env: typeof env;
  "inngest/load": typeof inngest_load;
  integrations: typeof integrations;
  project: typeof project;
  roles: typeof roles;
  user: typeof user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
