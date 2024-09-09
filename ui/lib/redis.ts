import { Redis } from "@upstash/redis";
import { PrivateKey } from "./action";
import { validatePrivateKey } from "./utils";
import { defaultKeyMapping } from "@/types";

const redis = Redis.fromEnv();

// TODO also attach the edit version
/** `PrivateKeyIdentifier` -> `pkId_` + `file_name` + `project_id` */
export type PrivateKeyIdentifier = `pkId_${string}.${string}`;

export const storeEncryptedPrivateKey = async ({
  fileName,
  projectId,
  privateKey,
}: {
  fileName: string;
  projectId: string;
  privateKey: PrivateKey;
}) => {
  let key = `pkId_${fileName}.${projectId}` satisfies PrivateKeyIdentifier;

  return await redis.set(key, privateKey);
};

export const getEncryptedPrivateKey = async ({
  fileName,
  projectId,
}: {
  fileName: string;
  projectId: string;
}) => {
  let key = `pkId_${fileName}.${projectId}` satisfies PrivateKeyIdentifier;

  let privateKey = await redis.get<PrivateKey>(key);

  return privateKey;
};
