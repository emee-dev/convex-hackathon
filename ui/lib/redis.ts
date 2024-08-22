import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

/** `filename` -> `file_name` + `project_id` + `path` */
export type FileIdentifier = `${string}.${string}.${string}`;

export const storeEncryptedPrivateKey = async ({
  fileName,
  projectId,
  path,
  privateKey,
}: {
  fileName: string;
  privateKey: string;
  projectId: string;
  path: string;
}) => {
  return redis.set(
    `${fileName}.${projectId}.${path}` as FileIdentifier,
    privateKey
  );
};

export const getEncryptedPrivateKey = async ({
  fileName,
  projectId,
  path,
}: {
  fileName: string;
  projectId: string;
  path: string;
}) => {
  return redis.get<FileIdentifier>(`${fileName}.${projectId}.${path}`);
};
