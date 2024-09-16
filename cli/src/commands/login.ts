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

class UserCancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserCancellationError";
  }
}
class LoginRedirectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginRedirectError";
  }
}

// TODO make sure config matches the required shape.
export default function loginCommand() {
  const program = new Command("login");

  program
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
              } else if (queryParams.notloggedin) {
                res.writeHead(200);
                res.end();
                reject(
                  new LoginRedirectError("User is not logged in on the webapp.")
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
          } else if (error instanceof LoginRedirectError) {
            console.log(
              "You have been redirected, please login on the webapp and try the command again.\n"
            );
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

  return program;
}
