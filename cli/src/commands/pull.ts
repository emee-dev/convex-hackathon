import { Command } from "commander";
import axios from "axios";
import http from "node:http";
import { join } from "node:path";
import { cwd } from "node:process";
import url from "node:url";
import open from "open";
import pc from "picocolors";
import packageJson from "../../package.json";
import {
  CIPullRequest,
  Config,
  PullRequest,
  PullResponse,
  PushRequest,
  PushResponse,
  UserConfig,
} from "../types";
import {
  CONFIG_FILE,
  convertToForwardSlashes,
  defaultKeyMapping,
  FOLDER,
  generateId,
  getUserConfig,
  injectEnvironmentVariables,
  listen,
  loadEnv,
  loadJSON,
  setUserConfig,
  writeGlobalTypes,
} from "../utils";
import { FRONTEND_URL } from "..";
import axiosRetry from "axios-retry";

export default function pullCommand() {
  const program = new Command("pull");

  program
    .argument("<environment>", "The filename or profile alias of file to pull.")
    .option("-s, --skip [skip]", "Skip the profile mapping in config.")
    .option("-ts, --types [types]", "Configure the global types for the file.")
    .description(
      "Pulls all the latest changes from the server. See https://localhost:3000/"
    )
    .action(
      async (
        environment: string,
        options: { skip: boolean; types: boolean }
      ) => {
        try {
          let currentDir = cwd();

          let skip_flag = options.skip;
          let generateTypes = options.types;

          let userConfig = await getUserConfig();
          let vaultConfig = await loadJSON<Config>(
            join(currentDir, CONFIG_FILE)
          );

          if (!userConfig) {
            console.error(`Invalid user data please login.`);
            process.exit(1);
          }

          if (!vaultConfig) {
            console.log(`Error: missing ${pc.red(CONFIG_FILE)} file \n`);
            process.exit(1);
          }

          // fileName == "local" && skip_flag == true => _fileName = ".env.local"
          // else assume the user passed in a proper fileName
          // eg fileName == ".env.local"
          // let _fileName = body.skip_flag ? defaultKeyMapping[fileName] : fileName;
          let _fileName = skip_flag
            ? defaultKeyMapping[environment]
            : vaultConfig.profiles[environment];

          if (!_fileName) {
            console.log(
              `File not found for environment with alias: '${environment}'`
            );
            process.exit(1);
          }

          let payload = {
            fileName: _fileName,
            projectId: vaultConfig.projectId,
            clerkUserId: userConfig.clerkUserId,
          } as PullRequest;

          axiosRetry(axios, { retries: 3 });

          let getDataRequest = await axios.put(
            `${FRONTEND_URL}/api/env`,
            payload
          );
          let response = (await getDataRequest.data) as PullResponse;

          if (!response.data) {
            console.log(`Error fetching latest changes for ${_fileName}`);
            process.exit(1);
          }

          if (generateTypes) {
            await writeGlobalTypes({
              dir: currentDir,
              data: response.data.decryptedText,
              alias: response.data.fileName,
            });
          }

          await injectEnvironmentVariables(response.data.decryptedText);
          console.log("Successfully fetched the latest changes.");
          process.exit(0);
        } catch (error: any) {
          console.error(error.message);
          process.exit(1);
        }
      }
    );

  return program;
}
