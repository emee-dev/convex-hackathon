/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import "server-only";
import { ConvexHttpClient } from "convex/browser";

import {
  encryptData,
  extractKeys,
  generatePublicAndPrivateKeys,
} from "./helper/rsa";
import { api } from "@/convex/_generated/api";
import {
  decrypt,
  deriveCryptoKeyfromEncryptionKey,
  deriveEncryptionKeyFromCryptoKey,
  encrypt,
  Format,
} from "./helper/aes-gcm";
import { fetchMutation, fetchQuery } from "convex/nextjs";

const client = new ConvexHttpClient(process.env["NEXT_PUBLIC_CONVEX_URL"]!);

type CreateUser = {
  email: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  system_role: "basic_user";
};



// CLI pull
export const pullLatestChanges = async ({
  fileName,
  projectId,
}: {
  fileName: string;
  projectId: string;
}) => {
  const file = fetchQuery(api.env.getEnvByFileName, {
    fileName,
    projectId,
  });

  return file;
};

// CLI push
export const pushChanges = async ({
  path,
  version,
  message,
  fileName,
  projectId,
  clerkUserId,
  encryptedData,
}: {
  path: string;
  version: string;
  message: string;
  fileName: string;
  projectId: string;
  clerkUserId: string;
  encryptedData: string;
}) => {
  const data = await fetchMutation(api.env.storeEnvFile, {
    env: { version, path, fileName, encryptedData, projectId, message },
    user: { clerkUserId },
  });

  return data;
};

export const handleWebhookCreateUser = async ({
  email,
  clerkUserId,
  firstName,
  lastName,
  system_role,
}: CreateUser) => {
  let db = fetchMutation(api.user.createUser, {
    email,
    clerkUserId,
    firstName,
    lastName,
    system_role,
  });

  return db;
};
