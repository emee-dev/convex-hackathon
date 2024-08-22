import {
  decryptContent,
  encryptContent,
  pullLatestChanges,
  pushChanges,
} from "@/lib/action";
import { getEncryptedPrivateKey, storeEncryptedPrivateKey } from "@/lib/redis";
// import { v4 as uuidv4 } from "uuid";

type Env = {
  file_name: string;
  path: string;
  content: string;
  environment: string;
};

export const revalidate = 500;

// cli user Authentication
export const GET = async (req: Request) => {
  // let d = {
  //   message: "Env was inserted",
  //   ivAndEncryptionKey: "9cTXt56ICmKislU7.C3njdQNfVVbyDeNbR4nizQ",
  //   encryptedData:
  //     "EjBwkVniuz5VtVyRErSMgdacaYq3WGm3pkvpRvDWBV53chooUJGLTUH69QcmSKHsrhpv32iIgkVic3JEf4s/VpTBRyIGB9GQB/KBxDcE7r85gMUWLK8Fz/RbkHiNs5z7bHsRLXd1Jo90367Xe82kJQVWr+yT6S6ZTc1nwPFBT8EKJic3qR2mcNg80FGTCBBbPt9O8FXGYpMGOrIi4ZsGjvPmXbGIa6ZM063iyrHPGIyLyG6cvhpelUeCkcuqi2qq5kHhs1fQmw1hC2WMOUUsiRZ0elrWYjzwEk6H12F4vDhd",
  // };

  // let get_record = await decryptEnvFile({
  //   iv: "9cTXt56ICmKislU7",
  //   encryptionKey: "C3njdQNfVVbyDeNbR4nizQ",
  //   encryptedData: "",
  // });

  // console.log("convex", get_record);
  return Response.json({ message: "Server action called." });
};

// cli push command
export const POST = async (req: Request) => {
  let body = (await req.json()) as {
    env: Env;
    user_email: string;
    projectId: string;
  } | null;

  if (!body || !body.env || !body.projectId) {
    return Response.json(
      { message: "Please provide the .env file to push." },
      { status: 404 }
    );
  }

  let { file_name, content, environment, path } = body.env;
  let projectId = body.projectId;

  let { encryptedData, privateKey } = await encryptContent({
    content,
  });

  // TODO be sure to encrypt the private key before saving to upstash
  let storePrivateKey = await storeEncryptedPrivateKey({
    fileName: file_name,
    path,
    privateKey,
    projectId,
  });

  if (!storePrivateKey) {
    return Response.json(
      {
        message: "Internal server error, please try again.",
      },
      { status: 500 }
    );
  }

  let record = await pushChanges({
    path,
    file_name,
    projectId,
    environment,
    encryptedData,
  });

  if (!record) {
    return Response.json(
      {
        message: "Internal server error, please try again.",
      },
      { status: 500 }
    );
  }

  console.log("new_record", record);
  return Response.json({ message: "Server action called." });
};

// cli pull command
export const PUT = async (req: Request) => {
  try {
    let body = (await req.json()) as { watchlist: string[] } | null;

    // let arr = [".env", ".env.local"];

    if (!body || !body.watchlist) {
      return Response.json(
        { message: "Please provide the .env files to pull." },
        { status: 404 }
      );
    }

    let records = await pullLatestChanges({ fileNames: body.watchlist });

    if (!records.data || records.data.length === 0) {
      return Response.json(
        { message: "Invalid watchlist, no data was found." },
        { status: 500 }
      );
    }

    let decryptedFiles = [] as { fileName: string; content: string }[];

    for (const { file_name, encryptedData, path } of records.data) {
      let result = await getEncryptedPrivateKey({
        path,
        fileName: file_name,
        projectId: "",
      });

      if (!result) {
        break;
      }

      let privateKey = result.split(".");

      let file = await decryptContent({
        iv: privateKey[0],
        encryptionKey: privateKey[1],
        encryptedData,
      });

      decryptedFiles.push({
        fileName: file_name,
        content: file,
      });
    }

    return Response.json({
      message: "These are the latest changes.",
      data: decryptedFiles,
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

// ENV Up
