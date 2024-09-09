/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import "server-only";
// import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { client } from "@/lib/utils";

export const __getUserRoleAndPermissions = async ({
  projectId,
  clerkUserId,
}: {
  projectId: string;
  clerkUserId: string;
}) => {
  let data = await client.query(api.user.userRoleAndPermissions, {
    clerkUserId,
    projectId,
  });

  return data;
};
