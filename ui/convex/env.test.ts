import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("retrieve env file", async () => {
  const t = convexTest(schema);
  let envfile = await t.query(api.env.getEnvByFileName, {
    file_name: "",
    path: "",
  });
  //   await t.mutation(api.env.storeEnvFile, {
  //     file_name: "",
  //     content: "",
  //     environment: "",
  //     path: "",
  //   });
  //   await t.mutation(api.env.storePrivateKey, {
  //     file_name: "",
  //     private_key_slice: "",
  //   });

  if (!envfile) {
  }

  expect(envfile.message).to.eql("Env was found!!!");
  //   expect(envfile.data).to.toMatchObject();
});
