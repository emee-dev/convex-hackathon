import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("getEnvByFileName", () => {
  test("should return environment by file name and project ID", async () => {
    const t = convexTest(schema);
    const envfile = await t.query(api.env.getEnvByFileName, {
      fileName: "config.env",
      projectId: "project-123",
    });

    expect(envfile.message).toEqual("Environemt was returned.");
    expect(envfile).toBeTypeOf("object");
    expect(envfile.data).toMatchObject({
      _id: expect.any(String),
      version: expect.any(String),
      encryptedData: expect.any(String),
      type: "MODIFIED", // or 'CREATED'
    });
  });

  test("should return error if environment is not found", async () => {
    const t = convexTest(schema);
    const envfile = await t.query(api.env.getEnvByFileName, {
      fileName: "nonexistent.env",
      projectId: "project-123",
    });

    expect(envfile.message).toEqual("Could not find environment by file name.");
    expect(envfile.data).toBeNull();
  });
});

describe("storeEnvFile", () => {
  test("should store a new environment file", async () => {
    const t = convexTest(schema);
    const response = await t.mutation(api.env.storeEnvFile, {
      env: {
        path: "/",
        version: "0001",
        message: "Initial version",
        fileName: ".env.local",
        projectId: "project-123",
        encryptedData: "encryptedContent",
      },
      user: {
        clerkUserId: "user-123",
      },
    });

    expect(response.message).toEqual("Environemt variable was stored.");
    expect(response.data).toMatchObject({
      modified: false,
      acknowledged: true,
    });
  });

  test("should modify an existing environment file", async () => {
    const t = convexTest(schema);
    const response = await t.mutation(api.env.storeEnvFile, {
      env: {
        path: "/",
        version: "0001",
        message: "Updated version",
        fileName: ".env.local",
        projectId: "project-123",
        encryptedData: "newEncryptedContent",
      },
      user: {
        clerkUserId: "user-123",
      },
    });

    expect(response.message).toEqual("Environemt variable was modified.");
    expect(response.data).toMatchObject({
      modified: true,
      acknowledged: true,
    });
  });
});

describe("listVariables", () => {
  test("should return paginated list of environment variables", async () => {
    const t = convexTest(schema);

    const variables = await t.query(api.env.listVariables, {
      uniqueProjectId: "project-123",
      paginationOpts: {
        numItems: 5,
        cursor: null,
      },
    });

    expect(variables).toBeTypeOf("object");
    expect(variables.page).toBeInstanceOf(Array);
    expect(variables.page[0]).toHaveProperty("fileName");
  });
});

describe("listAuditLogs", () => {
  test("should return paginated list of audit logs", async () => {
    const t = convexTest(schema);
    const auditLogs = await t.query(api.env.listAuditLogs, {
      uniqueProjectId: "project-123",
      paginationOpts: {
        numItems: 5,
        cursor: null,
      },
    });

    expect(auditLogs).toBeTypeOf("object");
    expect(auditLogs.page).toBeInstanceOf(Array);
    expect(auditLogs.page[0]).toHaveProperty("version");
    expect(auditLogs.page[0]).toHaveProperty("encryptedData");
  });
});
