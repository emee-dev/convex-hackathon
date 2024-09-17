"use server";

import { getUserRoleAndPermissions } from "@/app/api/env/handler";
import { getEncryptedPrivateKey } from "@/lib/redis";
import { allowedActions, decryptContent, extractIvAndKey } from "@/lib/utils";

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
  let user = await getUserRoleAndPermissions({
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
