import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import ms from "ms";
import { SafeParseError, z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { defaultKeyMapping, Permissions } from "@/types";
import { customAlphabet } from "nanoid";
import {
  decrypt,
  deriveCryptoKeyfromEncryptionKey,
  deriveEncryptionKeyFromCryptoKey,
  encrypt,
  Format,
} from "./helper/aes-gcm";

export const client = new ConvexHttpClient(
  process.env["NEXT_PUBLIC_CONVEX_URL"]!
);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getRelative = (timestamp: number) => {
  // Get the current time
  const now = Date.now();

  // Calculate the difference in milliseconds
  const difference = timestamp - now;

  // Format the difference
  return ms(Math.abs(difference), { long: true });
};

export const formatZodError = <T>(validation: SafeParseError<T>) => {
  return validation.error.issues.map(
    (e) => `Params: '${e.path}' is ${e.message}.`
  );
};

export const extractIvAndKey = (
  input: PrivateKey
): { iv: string; encryptionKey: string } | null => {
  const regex = /^pkey_(.+)\.(.+)$/;
  const match = input.match(regex);

  if (!match) {
    return null; // Return null if the input doesn't match the expected format
  }

  const [, iv, encryptionKey] = match;
  return { iv, encryptionKey };
};

// zod schema for the private key structure
const privateKeySchema = z.string().regex(/^pkey_(.+)\.(.+)$/);

export const validatePrivateKey = (key: PrivateKey) => {
  let { success } = privateKeySchema.safeParse(key);
  return success;
};

export function allowedActions(
  requiredPermissions: Permissions["code"][],
  permissions: { code: string; permissionId: string }[]
) {
  let userPermission = permissions.map((item) => item.code);

  return requiredPermissions.every((action) => userPermission.includes(action));
}

export const generateEditVersion = async (size: number = 8) => {
  return customAlphabet("123456789QAZWSXEDCRFVTGBYHNUJMIKOLP", size)();
};

export const generateConfig = (projectId: string) => {
  let config = {
    projectId: `${projectId}`,
    profiles: { ...defaultKeyMapping },
  };

  return JSON.stringify(config, null, 3);
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
  let encryptionKey = (await deriveEncryptionKeyFromCryptoKey(
    encryptedText.cryptoKey
  )) as string;

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
