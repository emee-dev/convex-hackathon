#!/usr/bin/env node

import { Command } from "commander";
import packageJson from "../package.json";
import { cwd } from "node:process";
import axios from "axios";
import { stringify } from "node:querystring";
const program = new Command();

const BASE_URL = "http://localhost:3000";

let watchList = packageJson.vault["env-files"];

program
  .name(Object.keys(packageJson.bin)[0]!)
  .description("CLI to some JavaScript string utilities")
  .version(packageJson.version);

program
  .command("split")
  .description("Split a string into substrings and display as an array")
  .argument("<string>", "string to split")
  .option("--first", "display just the first substring")
  .option("-s, --separator <char>", "separator character", ",")
  .action((str, options) => {
    const limit = options.first ? 1 : undefined;
    console.log(str.split(options.separator, limit));
  });

program
  .command("list")
  .description("Lists the files in the directory")
  .action(() => {
    let curDir = cwd();
    console.log("Current Dir: ", curDir);
  });

program
  .command("watch")
  .description("Watches for db changes, writes to file")
  .action(() => {
    let curDir = cwd();
    console.log("Current Dir: ", curDir);
  });

program
  .command("push")
  .description(
    "Uploads the .env.* files to the server, only by authenticated & authorized users."
  )
  .action(() => {
    let curDir = cwd();
    console.log("Current Dir: ", curDir);
  });

program
  .command("pull")
  .description("Pulls all the latest changes from the server.")
  .action(async () => {
    try {
      let curDir = cwd();
      let data = await axios.put(`${BASE_URL}/env`, { watchlist: watchList });

      console.log(data);
      console.log("Current Dir: ", curDir);
    } catch (error: any) {
      console.error(error.message);
    }
  });

program.parse();

// Core CLI Commands
// vault dev -- watches for db changes, writes to file
// vault push -- uploads latest env file changes to db
// vault pull -- retrieve the latest env changes from db
// vault login -- authenticates a user, writes auth to file
// Extra
// vault blame -- pulls the audit log from db

// Logic
// store encrypted data in convex -> pull via cli
// store encrypted keys in upstash redis ->
// end-user does not have to worry about data encryption
// only authenticated & authorized users can make changes to env files
//
