import { glob } from "glob";

async function main() {
  let files = await glob(".env.production", {  });

  console.log(files);
}

main();
