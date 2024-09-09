import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { env } from "process";

test("test pulling env file by filename", async () => {
  const t = convexTest(schema);
  let envfile = await t.query(api.env.getEnvByFileName, {
    fileName: "",
    projectId: "",
    // path: "",
  });
  //   await t.mutation(api.env.storeEnvFile, {
  //     fileName: "",
  //     content: "",
  //     environment: "",
  //     path: "",
  //   });
  //   await t.mutation(api.env.storePrivateKey, {
  //     fileName: "",
  //     private_key_slice: "",
  //   });

  // if (!envfile) {
  // }

  expect(envfile.message).to.eql("Env was found!!!");
  expect(envfile).to.be.toBeTypeOf("object");
  expect(envfile.data).to.toMatchObject({
    data: {
      _id: "",
      path: "",
      fileName: "",
      projectId: "",
      environment: "",
      _creationTime: 0,
    },
    message: "",
  });

  //   expect(envfile.data).to.toMatchObject();
});
