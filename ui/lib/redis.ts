import { Redis } from "@upstash/redis";
import { PrivateKey } from "./utils";

const redis = Redis.fromEnv();

/** `PrivateKeyIdentifier` -> `pkId_` + `file_name` + `project_id` + `edit_version` */
export type PrivateKeyIdentifier = `pkId_${string}.${string}.${string}`;

export const storeEncryptedPrivateKey = async ({
  edit_version,
  fileName,
  projectId,
  privateKey,
}: {
  edit_version: string;
  fileName: string;
  projectId: string;
  privateKey: PrivateKey;
}) => {
  let key =
    `pkId_${fileName}.${projectId}.${edit_version}` satisfies PrivateKeyIdentifier;
  return await redis.set(key, privateKey);
};

export const getEncryptedPrivateKey = async ({
  fileName,
  projectId,
  edit_version,
}: {
  edit_version: string;
  fileName: string;
  projectId: string;
}) => {
  let key =
    `pkId_${fileName}.${projectId}.${edit_version}` satisfies PrivateKeyIdentifier;

  let privateKey = await redis.get<PrivateKey>(key);

  return privateKey;
};
