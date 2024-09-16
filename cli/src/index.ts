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
  CIPullRequest,
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

import login from "./commands/login";
import ci from "./commands/ci";
import pull from "./commands/pull";
import push from "./commands/push";

export const FRONTEND_URL = process.env.FRONTEND_URL;

if (!FRONTEND_URL) {
  throw new Error("Environment variable [FRONTEND_URL] was not specified.");
}

const program = new Command();

program.addCommand(ci());
program.addCommand(login());
program.addCommand(pull());
program.addCommand(push());

program
  .name("dxenv")
  .description(
    "The best way to securely share and manage environment variables in your team."
  )
  .version(packageJson.version);

program.parse();

// vault push .env -> resolves to development
// vault pull development

// Core CLI Commands
// vault push -- uploads latest env file changes to db
// vault pull -- retrieve the latest env changes from db
// vault login -- authenticates a user, writes auth to file
// vault ci -- pull the environment and injects into the process, for ci environments
// vault types -- creates a global type for the process.env.*
// Extra
// vault log -- pulls the audit log from db
