import axios from "axios";
import { Command } from "commander";
import { join } from "node:path";
import { cwd } from "node:process";
import pc from "picocolors";
import { CIPullRequest, Config, PullResponse } from "../types";
import {
  CONFIG_FILE,
  defaultKeyMapping,
  injectEnvironmentVariables,
  loadJSON,
} from "../utils";

import axiosRetry from "axios-retry";
import { FRONTEND_URL } from "..";

export default function ciCommand() {
  const program = new Command("ci");

  program
    .argument("<environment>", "The filename or profile alias of file to pull.")
    .option("-k, --key <char>", "Api Key required to continue this action.")
    .option("-s, --skip [skip]", "Skip the profile mapping in config.")
    .description(
      "Useful for CICD environments, where user interaction is limited."
    )
    .allowUnknownOption(true)
    .action(
      async (environment: string, options: { key: string; skip?: boolean }) => {
        try {
          const currentDir = cwd();
          const skip_flag = options.skip;
          const API_KEY = removeQuotes(options.key);

          let vaultConfig = await loadJSON<Config>(
            join(currentDir, CONFIG_FILE)
          );

          if (!API_KEY) {
            console.log(`Error: missing or invalid ${pc.red("API Key")}. \n`);
            process.exit(1);
          }

          if (!vaultConfig) {
            console.log(`Error: missing ${pc.red(CONFIG_FILE)} file \n`);
            process.exit(1);
          }

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
            apiKey: API_KEY,
          } as CIPullRequest;

          axiosRetry(axios, { retries: 3 });

          let getDataRequest = await axios.put(
            `${FRONTEND_URL}/api/env/ci`,
            payload
          );

          let response = (await getDataRequest.data) as PullResponse;

          if (!response.data) {
            console.log(`Error fetching latest changes for ${_fileName}`);
            process.exit(1);
          }

          // TODO faulty function will work it in the future.
          await injectEnvironmentVariables(response.data.decryptedText);
        } catch (error: any) {
          if (axios.isAxiosError(error)) {
            console.log(error.cause);
            console.log("Response: ", error.response?.data.message);
            process.exit(1);
          }

          console.error(error.message);
          process.exit(1);
        }
      }
    );

  return program;
}

function removeQuotes(input: string): string {
  return input.replace(/['"]/g, "");
}
