import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import ms from "ms";
import { SafeParseError, z } from "zod";
import { PrivateKey } from "./action";
import { ConvexHttpClient } from "convex/browser";
import { defaultKeyMapping, Permissions } from "@/types";
import { customAlphabet } from "nanoid";

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
