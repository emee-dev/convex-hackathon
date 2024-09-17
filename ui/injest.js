import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

const client = new ConvexHttpClient(process.env["NEXT_PUBLIC_CONVEX_URL"]);

async function main() {
  await client.mutation(api.run_once.build);
}

main();
