"use server";

import { __getUserRoleAndPermissions } from "@/app/api/env/handler";
import { decryptContent } from "@/lib/action";
import { getEncryptedPrivateKey } from "@/lib/redis";
import { allowedActions, extractIvAndKey } from "@/lib/utils";

export const decryptInDashboard = async ({
  fileName,
  clerkUserId,
  edit_version,
  encryptedData,
  uniqueProjectId,
}: {
  fileName: string;
  clerkUserId: string;
  edit_version: string;
  encryptedData: string;
  uniqueProjectId: string;
}) => {
  let user = await __getUserRoleAndPermissions({
    projectId: uniqueProjectId,
    clerkUserId,
  });

  if (!user || !user.data) {
    throw new Error("Evaluating user role and permissions failed.");
  }

  let isAllowed = allowedActions(["view:env"], user.data.permissions);

  if (!isAllowed) {
    throw new Error(
      "Permission denied user is not allow to perform this action."
    );
  }

  let cachedKey = await getEncryptedPrivateKey({
    fileName,
    edit_version,
    projectId: uniqueProjectId,
  });

  if (!cachedKey) {
    throw new Error("Internal error, invalid key.");
  }

  let data = extractIvAndKey(cachedKey);

  if (!data) {
    throw new Error("Unable to parse private key. Invalid key format.");
  }

  let { iv, encryptionKey } = data;

  let decrypted = await decryptContent({ iv, encryptedData, encryptionKey });

  return decrypted;
};
