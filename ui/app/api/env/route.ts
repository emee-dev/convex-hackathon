import {
  __pullLatestChanges,
  __pushChanges,
  decryptContent,
  encryptContent,
} from "@/lib/action";
import { getEncryptedPrivateKey, storeEncryptedPrivateKey } from "@/lib/redis";
import {
  allowedActions,
  extractIvAndKey,
  formatZodError,
  validatePrivateKey,
} from "@/lib/utils";
import { z } from "zod";
import { __getUserRoleAndPermissions } from "./handler";

type PushRequest = {
  path: string;
  content: string;
  fileName: string;
  projectId: string;
  clerkUserId: string;
};

type PullRequest = {
  fileName: string;
  projectId: string;
  // userEmail: string;
  clerkUserId: string;
};

let pushSchema = z.object({
  content: z.string(),
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

export const revalidate = 500;

// cli user Authentication
export const GET = async (req: Request) => {
  return Response.json({ message: "Server action called." });
};

// cli push command
export const POST = async (req: Request) => {
  try {
    let body = (await req.json()) as PushRequest;

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
    // TODO Also add the edit version to the private key identifier
    let storePrivateKey = await storeEncryptedPrivateKey({
      fileName,
      projectId,
      privateKey,
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

    let record = await __pushChanges({
      path,
      projectId,
      fileName,
      // TODO generate a unique id for edit versioning
      version: "",
      encryptedData,
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

    let user = await __getUserRoleAndPermissions({ projectId, clerkUserId });

    if (!user || !user.data) {
      throw new Error("Error evaluating user role and permissions.");
    }

    let isAllowed = allowedActions(["view:env"], user.data.permissions);

    if (!isAllowed) {
      throw new Error(
        "Permission denied user is not allow to perform this action."
      );
    }

    let variable = await __pullLatestChanges({
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
