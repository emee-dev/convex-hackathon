#!/usr/bin/env node

import axios from "axios";
import { Command } from "commander";
import http from "node:http";
import { join } from "node:path";
import { cwd } from "node:process";
import url from "node:url";
import open from "open";
import pc from "picocolors";
import packageJson from "../package.json";
import {
  Config,
  PullRequest,
  PullResponse,
  PushRequest,
  PushResponse,
  UserConfig,
} from "./types";
import {
  CONFIG_FILE,
  convertToForwardSlashes,
  FOLDER,
  generateId,
  getUserConfig,
  injectEnvironmentVariables,
  listen,
  loadEnv,
  loadJSON,
  setUserConfig,
  writeGlobalTypes,
} from "./utils";

const FRONTEND_URL = process.env.FRONTEND_URL;

if (!FRONTEND_URL) {
  throw new Error("Environment variable [FRONTEND_URL] was not specified.");
}

const program = new Command();

const defaultKeyMapping: Record<string, string> = {
  ci: ".env.ci",
  development: ".env",
  local: ".env.local",
  production: ".env.production",
  staging: ".env.staging",
  test: ".env.test",
} as const;

class UserCancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserCancellationError";
  }
}

class MissingVaultConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingVaultConfigError";
  }
}

program
  .name(Object.keys(packageJson.bin)[0]!)
  .description(
    "The best way to securely share and manage environment variables in your team."
  )
  .version(packageJson.version);

program
  .command("push")
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

program
  .command("pull")
  .argument("<environment>", "The filename or profile alias of file to pull.")
  .option("-s, --skip [skip]", "Skip the profile mapping in config.")
  .option("-ts, --types [types]", "Configure the global types for the file.")
  .description(
    "Pulls all the latest changes from the server. See https://localhost:3000/"
  )
  .action(
    async (environment: string, options: { skip: boolean; types: boolean }) => {
      try {
        let currentDir = cwd();

        let skip_flag = options.skip;
        let generateTypes = options.types;

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

// TODO make sure config matches the required shape.
program
  .command("login")
  .option("-o, --open [open]", "Open with default configured browser.")
  .description("Authenticates the user via web app.")
  .action(async (options: { open?: boolean }) => {
    try {
      let otp = await generateId();
      let currentDir = process.cwd();
      let openWithBrowser = options.open;

      let vaultConfig = await loadJSON<Config>(join(currentDir, CONFIG_FILE));

      if (!vaultConfig) {
        console.log(`Error: missing ${pc.red(CONFIG_FILE)} file \n`);
        return;
      }

      // create localhost server for webapp to call back to
      const server = http.createServer();
      const { port } = await listen(server, 0, "127.0.0.1");

      // need to import ora dynamically since it's ESM-only
      const oraModule = await import("ora");
      const ora = oraModule.default;

      // set up HTTP server that waits for a request containing a user object
      const authPromise = new Promise<UserConfig>((resolve, reject) => {
        server.on("request", (req, res) => {
          // Set CORS headers for all responses
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
          );

          // liveness check
          if (req.method === "OPTIONS") {
            res.writeHead(200);
            res.end();
          } else if (req.method === "GET") {
            const parsedUrl = url.parse(req.url as string, true);
            const queryParams = parsedUrl.query;
            if (queryParams.cancelled) {
              res.writeHead(200);
              res.end();
              reject(
                new UserCancellationError("Login process cancelled by user.")
              );
            } else {
              res.writeHead(200);
              res.end();
              resolve(queryParams as UserConfig);
            }
          } else {
            res.writeHead(405);
            res.end();
          }
        });
      });
      const redirect = `http://127.0.0.1:${port}`;

      const confirmationUrl = new URL(`${FRONTEND_URL}/auth/devices`);
      confirmationUrl.searchParams.append("code", otp);
      confirmationUrl.searchParams.append("redirect", redirect);
      confirmationUrl.searchParams.append("pid", vaultConfig.projectId);

      console.log(`Confirmation code: ${pc.bold(otp)}\n`);
      console.log(
        `If something goes wrong, copy and paste this URL into your browser: ${pc.bold(
          confirmationUrl.toString()
        )}\n`
      );

      openWithBrowser ? open(confirmationUrl.toString()) : null;
      const spinner = ora("Waiting for authentication...\n\n");

      try {
        spinner.start();

        process.on("SIGINT", () => {
          spinner.stop();
          console.log("\nProcess terminated by user.");
          server.close();
          process.exit(0);
        });

        const authData = await authPromise;
        spinner.stop();

        await setUserConfig(authData);
        console.log(
          `Authentication successful. To view it, type 'cat ~/${FOLDER}'.\n`
        );
        server.close();
        process.exit(0);
      } catch (error) {
        if (error instanceof UserCancellationError) {
          console.log("Authentication cancelled.\n");
          server.close();
          process.exit(0);
        } else {
          console.error("Authentication failed:", error);
          console.log("\n");
          server.close();
          process.exit(1);
        }
      } finally {
        server.close();
        process.exit(0);
      }
    } catch (error: any) {
      console.error(error);
      process.exit(1);
    }
  });

// CI instances
// Usage: vault ci local -k "api_key1399202" -s
program
  .command("ci")
  .argument("<environment>", "The filename or profile alias of file to pull.")
  .option("-k, --key <char>", "Api Key required to continue this action.")
  .option("-s, --skip [skip]", "Skip the profile mapping in config.")
  .description(
    "Useful for CICD environments, where user interaction is limited."
  )
  .action(
    async (environment: string, options: { key?: string; skip?: boolean }) => {
      console.log("env", environment);
      console.log("options", options);
    }
  );

program.parse();

// vault push .env -> resolves to development
// vault pull development

// Core CLI Commands
// vault dev -- watches for db changes
// vault push -- uploads latest env file changes to db
// vault pull -- retrieve the latest env changes from db
// vault login -- authenticates a user, writes auth to file
// vault ci -- pull the environment and injects into the process, for ci environments
// Extra
// vault log -- pulls the audit log from db
// vault types -- creates a global type for the process.env.*

// Logic
// store encrypted data in convex -> pull via cli
// store encrypted keys in upstash redis ->
// end-user does not have to worry about data encryption
// only authenticated & authorized users can make changes to env files
//
