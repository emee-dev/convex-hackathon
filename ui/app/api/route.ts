import { decryptEnvFile, encryptEnvFile } from "@/lib/action";

// export const revalidate = 2000;

export const GET = async (req: Request) => {
  let d = {
    message: "Env was inserted",
    ivAndEncryptionKey: "9cTXt56ICmKislU7.C3njdQNfVVbyDeNbR4nizQ",
    encryptedData:
      "EjBwkVniuz5VtVyRErSMgdacaYq3WGm3pkvpRvDWBV53chooUJGLTUH69QcmSKHsrhpv32iIgkVic3JEf4s/VpTBRyIGB9GQB/KBxDcE7r85gMUWLK8Fz/RbkHiNs5z7bHsRLXd1Jo90367Xe82kJQVWr+yT6S6ZTc1nwPFBT8EKJic3qR2mcNg80FGTCBBbPt9O8FXGYpMGOrIi4ZsGjvPmXbGIa6ZM063iyrHPGIyLyG6cvhpelUeCkcuqi2qq5kHhs1fQmw1hC2WMOUUsiRZ0elrWYjzwEk6H12F4vDhd",
  };

  let get_record = await decryptEnvFile({
    iv: "9cTXt56ICmKislU7",
    encryptionKey: "C3njdQNfVVbyDeNbR4nizQ",
    encryptedData: "",
  });

  console.log("convex", get_record);
  return Response.json({ message: "Server action called." });
};

// CLI Authentication
export const POST = async (req: Request) => {
  let new_record = await encryptEnvFile({
    file_name: ".env.local",
    path: ".env.local",
    content: "",
    environment: "local",
  }).catch((d) => console.log("Error: ", d));

  console.log("new_record", new_record);
  return Response.json({ message: "Server action called." });
};

// ENV Up
