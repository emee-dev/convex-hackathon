import axios from "axios";
import { Command } from "commander";
import { join } from "node:path";
import { cwd } from "node:process";
import pc from "picocolors";
import { FRONTEND_URL } from "..";
import { Config, PushRequest, PushResponse } from "../types";
import {
  CONFIG_FILE,
  convertToForwardSlashes,
  defaultKeyMapping,
  getUserConfig,
  loadEnv,
  loadJSON,
} from "../utils";

export default function pushCommand() {
  const program = new Command("push");

  program
    .argument("<filename>", "The filename of dotenv file to upload.")
    .option("-s, --skip [skip]", "Skip the profile mapping in config.")
    .description("Uploads the choosen .env.* file to the server.")
    .action(async (fileName: string, options: { skip: boolean }) => {
      try {
        let currentDir = cwd();
        let skip_flag = options.skip;
        let userConfig = await getUserConfig();

        let vaultConfig = await loadJSON<Config>(join(currentDir, CONFIG_FILE));

        if (!userConfig) {
          console.error(`Invalid user data please login.`);
          process.exit(1);
        }

        if (!vaultConfig) {
          console.log(`Error: missing ${pc.red(CONFIG_FILE)} file \n`);
          process.exit(1);
        }

        let _fileName = skip_flag
          ? defaultKeyMapping[fileName]
          : vaultConfig.profiles[fileName];

        if (!_fileName) {
          console.log(`File not found for alias: '${fileName}'`);
          process.exit(1);
        }

        let path = convertToForwardSlashes(join(currentDir, _fileName));
        let envContent = await loadEnv(path);

        if (!envContent) {
          console.error(
            `Could not find or parse file for alias: '${fileName}' provided.`
          );
          process.exit(1);
        }

        let payload = {
          path,
          content: envContent,
          fileName: _fileName,
          projectId: vaultConfig.projectId,
          clerkUserId: userConfig.clerkUserId,
        } as PushRequest;

        let sendDataRequest = await axios.post(
          `${FRONTEND_URL}/api/env`,
          payload
        );

        let response = (await sendDataRequest.data) as PushResponse;

        if (!response.data.acknowledged) {
          console.log("Failed to upload these changes.");
          process.exit(1);
        }

        console.log("Successfully uploaded the environment file.");
        process.exit(0);
      } catch (error: any) {
        console.warn(error.message);
        process.exit(1);
      }
    });

  return program;
}
