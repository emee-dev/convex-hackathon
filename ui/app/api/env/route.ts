import { getEncryptedPrivateKey, storeEncryptedPrivateKey } from "@/lib/redis";
import {
  allowedActions,
  decryptContent,
  encryptContent,
  extractIvAndKey,
  formatZodError,
  generateEditVersion,
  validatePrivateKey,
} from "@/lib/utils";
import { z } from "zod";
import { getUserRoleAndPermissions } from "./handler";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

type PushRequest = {
  path: string;
  content: string;
  fileName: string;
  projectId: string;
  message?: string;
  clerkUserId: string;
};

type PullRequest = {
  fileName: string;
  projectId: string;
  clerkUserId: string;
};

let pushSchema = z.object({
  content: z.string(),
  message: z.string().nullable().nullish(),
  path: z.string().min(1),
  fileName: z.string().min(1),
  projectId: z.string().min(1),
  clerkUserId: z.string().min(1),
});

let pullSchema = z.object({
  fileName: z.string().min(1),
  projectId: z.string().min(1),
  // userEmail: z.string().min(1),
  clerkUserId: z.string().min(1),
});

export const dynamic = "force-dynamic";

// cli user Authentication
export const GET = async (req: Request) => {
  return Response.json({ message: "Server action called." });
};

const pushChanges = async ({
  path,
  version,
  message,
  fileName,
  projectId,
  clerkUserId,
  encryptedData,
}: {
  path: string;
  version: string;
  message: string;
  fileName: string;
  projectId: string;
  clerkUserId: string;
  encryptedData: string;
}) => {
  const data = await fetchMutation(api.env.storeEnvFile, {
    env: { version, path, fileName, encryptedData, projectId, message },
    user: { clerkUserId },
  });

  return data;
};

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

// cli push command
export const POST = async (req: Request) => {
  try {
    let body = (await req.json()) as PushRequest;
    let edit_version = await generateEditVersion(8);

    let validate = pushSchema.safeParse(body);

    if (!validate.success) {
      console.log(formatZodError(validate));

      return Response.json(
        {
          message: formatZodError(validate),
          data: {
            acknowledged: false,
          },
        },
        { status: 404 }
      );
    }

    let { fileName, content, path, projectId } = body;

    let { encryptedData, privateKey } = await encryptContent({
      content,
    });

    console.log("privateKey", privateKey);
    console.log("encryptedData", encryptedData);

    // TODO be sure to encrypt the private key before saving to upstash
    let storePrivateKey = await storeEncryptedPrivateKey({
      fileName,
      projectId,
      privateKey,
      edit_version,
    });

    if (storePrivateKey !== "OK") {
      return Response.json(
        {
          message: "Internal server error, please try again.",
          data: {
            acknowledged: false,
          },
        },
        { status: 500 }
      );
    }

    let record = await pushChanges({
      path,
      fileName,
      projectId,
      encryptedData,
      message: body?.message || "",
      version: edit_version,
      clerkUserId: body.clerkUserId,
    });

    return Response.json(record);
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

// cli pull command
export const PUT = async (req: Request) => {
  try {
    let body = (await req.json()) as PullRequest;
    let validate = pullSchema.safeParse(body);

    if (!validate.success) {
      return Response.json(
        { message: formatZodError(validate), data: null },
        { status: 404 }
      );
    }

    let { projectId, fileName, clerkUserId } = body;

    let user = await getUserRoleAndPermissions({ projectId, clerkUserId });

    if (!user || !user.data) {
      throw new Error("Error evaluating user role and permissions.");
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
