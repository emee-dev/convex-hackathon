/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import "server-only";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export const getUserRoleAndPermissions = async ({
  projectId,
  clerkUserId,
}: {
  projectId: string;
  clerkUserId: string;
}) => {
  let data = await fetchQuery(api.user.userRoleAndPermissions, {
    clerkUserId,
    projectId,
  });

  return data;
};

export const getAPIKeyRoleAndPermissions = async ({
  unkeyKeyId,
  uniqueProjectId,
}: {
  uniqueProjectId: string;
  unkeyKeyId: string;
}) => {
  let data = await fetchQuery(api.integrations.apiKeyRoleAndPermissions, {
    unkeyKeyId,
    uniqueProjectId,
  });

  return data;
};
