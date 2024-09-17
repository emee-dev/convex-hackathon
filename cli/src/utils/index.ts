import { OverloadedParameters } from "async-listen/dist/overloaded-parameters";
import dotenv from "dotenv";
import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { Server } from "node:http";
import os from "node:os";
import path from "node:path";
import { $ } from "zx";
import { UserConfig, WriteGlobalType } from "../types";

export const FOLDER = ".dxenv";
export const BINDING = "dxenv.d.ts";
export const CONFIG_FILE = "dxenv.config.json";

export function isValidJson(file: string) {
  try {
    JSON.parse(file);
    return true;
  } catch (error) {
    return false;
  }
}

export async function createFolderIfNotExists(folderPath: string) {
  if (!fs.existsSync(folderPath)) {
    await mkdir(folderPath);
  }
}

export async function getUserConfig() {
  try {
    const homeDir = os.homedir();
    const filePath = path.join(homeDir, FOLDER);
    let config = await readFile(`${filePath}/vault.json`, {
      encoding: "utf-8",
    });

    if (!isValidJson(config)) {
      return null;
    }

    return JSON.parse(config) as UserConfig;
  } catch (error) {
    return null;
  }
}

export async function setUserConfig(data: UserConfig) {
  try {
    const homeDir = os.homedir();
    const filePath = path.join(homeDir, FOLDER);
    await createFolderIfNotExists(filePath);
    await writeFile(`${filePath}/vault.json`, JSON.stringify(data), {
      encoding: "utf8",
    });
  } catch (error) {
    console.error("Error writing to local config file", error);
  }
}

export const loadJSON = async <T>(path: string): Promise<T | null> => {
  try {
    const file = await readFile(path, { encoding: "utf-8" });
    const data: T = JSON.parse(file);
    return data;
  } catch (error: any) {
    return null;
  }
};

export const loadEnv = async (path: string): Promise<string | null> => {
  try {
    const file = await readFile(path, { encoding: "utf-8" });
    return file;
  } catch (error: any) {
    return null;
  }
};

export const convertToForwardSlashes = (filePath: string) =>
  filePath.replace(/\\/g, "/");
export const filenameNoExtension = (filename: string) =>
  path.basename(filename, path.extname(filename));

export const generateId = async () => {
  let nanoid = await import("nanoid");
  let { customAlphabet } = nanoid;

  return customAlphabet("123456789QAZWSXEDCRFVTGBYHNUJMIKOLP", 8)();
};

export const injectEnvironmentVariables = async (data: string | Buffer) => {
  try {
    let parsed = dotenv.parse<Record<string, string>>(data);
    const processEnv = parsed;

    dotenv.config({
      processEnv,
    });

    // Inject the response data into the shell environment
    // for (const [key, value] of Object.entries(parsed)) {
    //   process.env[key] = value;
    //   // await $`export ${key}=${value}`;
    // }

    return processEnv;
  } catch (error: any) {
    console.warn("Error injecting environment variables.");
  }
};

export async function writeGlobalTypes({ dir, alias, data }: WriteGlobalType) {
  try {
    let placeholder = "";
    let parsed = dotenv.parse<Record<string, string>>(data);

    for (const key in parsed) {
      if (Object.hasOwnProperty.call(parsed, key)) {
        placeholder += `  ${key}: string;\n`;
      }
    }

    const keys = `export interface Environment {\n${placeholder}}`;

    const file = `
  ${keys}
  
  // types for \`${alias}\`
  declare namespace NodeJS {
    interface ProcessEnv extends Environment {}
  }
    `;

    await writeFile(`${dir}/${BINDING}`, Buffer.from(file), {
      encoding: "utf8",
    });
  } catch (error: any) {
    console.warn("Error generating a global typescript file.");
  }
}

export const listen = async (
  server: Server,
  ...args: OverloadedParameters<Server["listen"]>
) => {
  let { listen } = await import("async-listen");
  return listen(server, ...args);
};

export const defaultKeyMapping: Record<string, string> = {
  ci: ".env.ci",
  development: ".env",
  local: ".env.local",
  production: ".env.production",
  staging: ".env.staging",
  test: ".env.test",
} as const;
