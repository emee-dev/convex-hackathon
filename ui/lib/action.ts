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

const client = new ConvexHttpClient(process.env["NEXT_PUBLIC_CONVEX_URL"]!);

type CreateUser = {
  email: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  system_role: "basic_user";
};

type EnvParams = {
  file_name: string;
  content: string;
  path: string;
  environment: string;
};

/** `PrivateKey` -> `pkey_` + `iv` + `encryptionKey` */
export type PrivateKey = `pkey_${string}.${string}`;

export const encryptContent = async ({
  content,
}: Pick<EnvParams, "content">) => {
  let formatter = new Format();

  let encryptedText = await encrypt({ text: content });

  let encryptedData = formatter.encryptedBufferToBase64(
    encryptedText.encryptedBuffer
  );

  // Important
  const iv = formatter.ivToBase64(encryptedText.iv);

  // Important
  let encryptionKey = await deriveEncryptionKeyFromCryptoKey(
    encryptedText.cryptoKey
  );

  return {
    privateKey: `pkey_${iv}.${encryptionKey}`,
    encryptedData,
  } satisfies { privateKey: PrivateKey; encryptedData: string };
};

export const decryptContent = async ({
  iv,
  encryptedData,
  encryptionKey,
}: {
  iv: string;
  encryptionKey: string;
  encryptedData: string;
}) => {
  let formatter = new Format();

  const convertIv = formatter.base64IvToUint8Array(iv);
  const convertEncryptedData =
    formatter.encryptedBufferToUint8Array(encryptedData);
  // formatter.encryptedBufferToUint8Array(record.data.encryptedData);

  const derivedCryptoKey = await deriveCryptoKeyfromEncryptionKey(
    encryptionKey,
    "AES-GCM"
  );

  let decryptedText = await decrypt({
    encryptedData: new Uint8Array(convertEncryptedData),
    cryptoKey: derivedCryptoKey,
    iv: convertIv,
  });

  return decryptedText;
};

// CLI pull
export const __pullLatestChanges = async ({
  fileName,
  projectId,
}: {
  fileName: string;
  projectId: string;
}) => {
  const file = client.query(api.env.getEnvByFileName, {
    fileName,
    projectId,
  });

  return file;
};

// CLI push
export const __pushChanges = async ({
  path,
  version,
  fileName,
  projectId,
  clerkUserId,
  encryptedData,
}: {
  path: string;
  version: string;
  fileName: string;
  projectId: string;
  clerkUserId: string;
  encryptedData: string;
}) => {
  const data = await client.mutation(api.env.storeEnvFile, {
    env: { version, path, fileName, encryptedData, projectId },
    user: { clerkUserId },
  });

  return data;
};

export const __handleWebhookCreateUser = async ({
  email,
  clerkUserId,
  firstName,
  lastName,
  system_role,
}: CreateUser) => {
  let db = client.mutation(api.user.createUser, {
    email,
    clerkUserId,
    firstName,
    lastName,
    system_role,
  });

  return db;
};
