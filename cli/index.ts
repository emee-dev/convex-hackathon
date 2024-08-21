#!/usr/bin/env node

import { watch } from "chokidar";
import { readFile } from "fs/promises";
import packageJson from "./package.json";

// const watcher = watch([".env", ".env.local"], {
const watcher = watch(packageJson.vault["env-files"], {
  persistent: true,
  ignoreInitial: true,
});

watcher
  .on("change", async (path) => {
    try {
      const fileContent = await readFile(path, "utf-8");
      console.log(
        `File ${path} has been changed. New content:\n${fileContent}`
      );
      // Execute your desired action with the new content here
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
    }
  })
  .on("error", (error) => {
    console.error(`Watcher error:`, error);
  });

// watcher.close();

console.log("Watching .env file for changes...");
