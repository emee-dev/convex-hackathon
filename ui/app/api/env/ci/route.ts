import { getEncryptedPrivateKey } from "@/lib/redis";
import {
  allowedActions,
  decryptContent,
  extractIvAndKey,
  formatZodError,
  validatePrivateKey,
} from "@/lib/utils";
import { verifyKey } from "@unkey/api";
import { z } from "zod";
import { api } from "@/convex/_generated/api";

import { fetchQuery } from "convex/nextjs";

type CIPullRequest = {
  fileName: string;
  projectId: string;
  apiKey: string;
};

let ciPullSchema = z.object({
  fileName: z.string().min(1),
  projectId: z.string().min(1),
  apiKey: z.string().min(1),
});

export const dynamic = "force-dynamic";

const pullLatestChanges = async ({
  fileName,
  projectId,
}: {
  fileName: string;
  projectId: string;
}) => {
  const file = fetchQuery(api.env.getEnvByFileName, {
    fileName,
    projectId,
  });

  return file;
};

const getAPIKeyRoleAndPermissions = async ({
  unkeyKeyId,
  uniqueProjectId,
}: {
  uniqueProjectId: string;
  unkeyKeyId: string;
}) => {
  let data = await fetchQuery(api.integrations.apiKeyRoleAndPermissions, {
    unkeyKeyId,
    uniqueProjectId,
  });

  return data;
};

// For pulling variables in CICD environments
export const PUT = async (req: Request) => {
  try {
    let body = (await req.json()) as CIPullRequest;
    let validate = ciPullSchema.safeParse(body);

    if (!validate.success) {
      return Response.json(
        { message: formatZodError(validate), data: null },
        { status: 404 }
      );
    }

    let { projectId, fileName, apiKey } = body;

    const apiId = process.env.UNKEY_API_ID!;

    const { result, error } = await verifyKey({
      apiId,
      key: apiKey,
    });

    if (error) {
      throw error;
    }

    if (!result) {
      return Response.json(
        { message: "Third party error, try again." },
        { status: 500 }
      );
    }

    if (!result.valid) {
      console.log("Invalid key access denied");
      return Response.json(
        { message: "Invalid key access denied" },
        { status: 401 }
      );
    }

    if (!result.keyId) {
      console.log("No keyid");
      return Response.json({ message: "Invalid key id." }, { status: 500 });
    }

    let user = await getAPIKeyRoleAndPermissions({
      uniqueProjectId: body.projectId,
      unkeyKeyId: result.keyId!,
    });

    if (!user || !user.data) {
      throw new Error("Error evaluating api key role and permissions.");
    }

    let isAllowed = allowedActions(["view:env"], user.data.permissions);

    if (!isAllowed) {
      throw new Error(
        "Permission denied user is not allow to perform this action."
      );
    }

    let variable = await pullLatestChanges({
      fileName,
      projectId,
    });

    if (!variable.data) {
      return Response.json(
        {
          message: "Internal server error, third party failure. Try again.",
          data: null,
        },
        { status: 500 }
      );
    }

    console.log({
      fileName,
      projectId,
      version: variable.data,
    });

    let cachedKey = await getEncryptedPrivateKey({
      fileName,
      projectId,
      edit_version: variable.data.version,
    });

    if (!cachedKey) {
      throw new Error("Error fetching private keys");
    }

    let isValid = validatePrivateKey(cachedKey);

    if (!isValid) {
      throw new Error("Invalid or undefined private key. Please try again.");
    }

    let { iv, encryptionKey } = extractIvAndKey(cachedKey!)!;

    let decryptedText = await decryptContent({
      iv,
      encryptionKey,
      encryptedData: variable.data.encryptedData,
    });

    return Response.json({
      message: "These are the latest changes.",
      data: { fileName, decryptedText },
    });
  } catch (error: any) {
    console.error(error.message);

    return Response.json(
      {
        message: "Internal server error, please try later.",
        data: [],
      },
      {
        status: 500,
      }
    );
  }
};
