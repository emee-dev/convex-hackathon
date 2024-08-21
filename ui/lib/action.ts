/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import "server-only";
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env["NEXT_PUBLIC_CONVEX_URL"]!);

import {
  encryptData,
  extractKeys,
  generatePublicAndPrivateKeys,
} from "./helper/rsa";
import { api } from "@/convex/_generated/api";
import {
  decrypt,
  deriveCryptoKeyfromEncryptionKey,
  deriveEncryptionKeyFromCryptoKey,
  encrypt,
  Format,
} from "./helper/aes-gcm";

type EnvParams = {
  file_name: string;
  content: string;
  path: string;
  environment: string;
};

// export const encryptEnvFile = async ({
//   file_name,
//   content,
//   environment,
//   path,
// }: EnvParams) => {
//   // Generate a new key pair
//   const { publicKey, privateKey } = generatePublicAndPrivateKeys();

//   // implementation goes here
//   const ciphertext = encryptData(content, publicKey);

//   // const findEnv = await ctx.runQuery(api.env.getEnvFile, { file_name, path });

//   const data = (await fetchMutation(api.env.storeEnvFile, {
//     file_name,
//     content: ciphertext,
//     path,
//     environment,
//   })) as { message: string; data: null };

//   // let { publicKeyValue, privateKeyValue } = extractKeys(publicKey, privateKey);

//   // if (!publicKeyValue || !privateKeyValue) {
//   //   console.error("Error extracting keys");
//   //   return { message: "Error extracting keys", data: null };
//   // }

//   // Splits the private key into client and server keys
//   // let formatter = new Formatter(privateKeyValue);

//   // let clientSlice = formatter.extractClientSlice();
//   // let serverSlice = formatter.extractServerSlice();

//   // TODO Use upstash to store the other half of the private key
//   // const save_private_key = (await fetchMutation(api.env.storePrivateKey, {
//   //   file_name,
//   //   private_key_slice: serverSlice as string,
//   // })) as { message: string; data: null };

//   return {
//     message: data.message,
//     // clientPrivateKey: "clientSlice",
//     // publicKey: publicKeyValue,
//     ciphertext,
//   };
// };

export const encryptEnvFile = async ({
  path,
  content,
  file_name,
  environment,
}: EnvParams) => {
  let formatter = new Format();

  let text = `Creates a new cryptographic key for AES-GCM. 
  The key is 128 bits long and is marked as extractable (true), 
  meaning it can be exported if needed. The key can be used for 
  both encryption and decryption.`;

  let encryptedText = await encrypt({ text });

  let encryptedData = formatter.encryptedBufferToBase64(
    encryptedText.encryptedBuffer
  );

  // Important
  const iv = formatter.ivToBase64(encryptedText.iv);

  const data = (await client.mutation(api.env.storeEnvFile, {
    path,
    file_name,
    environment,
    encryptedData,
  })) as { message: string; data: null };

  // Important
  let encryptionKey = await deriveEncryptionKeyFromCryptoKey(
    encryptedText.cryptoKey
  );

  return {
    message: data.message,
    // clientPrivateKey: "clientSlice",
    // publicKey: publicKeyValue,
    ivAndEncryptionKey: `${iv}.${encryptionKey}`,
    encryptedData,
  };
};

export const decryptEnvFile = async ({
  iv,
  encryptedData,
  encryptionKey,
}: {
  iv: string;
  encryptionKey: string;
  encryptedData: string;
}) => {
  let formatter = new Format();

  let record = await client.query(api.env.getEnvByFileName, {
    file_name: ".env.local",
    path: ".env.local",
  });

  if (!record.data) {
    return {
      message: "No file was found.",
      decryptedText: null,
    };
  }

  const convertIv = formatter.base64IvToUint8Array(iv);
  const convertEncryptedData =
    // formatter.encryptedBufferToUint8Array(encryptedData);
    formatter.encryptedBufferToUint8Array(record.data.encryptedData);

  const derivedCryptoKey = await deriveCryptoKeyfromEncryptionKey(
    encryptionKey,
    "AES-GCM"
  );

  let decryptedText = await decrypt({
    encryptedData: new Uint8Array(convertEncryptedData),
    cryptoKey: derivedCryptoKey,
    iv: convertIv,
  });

  return {
    message: "Env was decrypted.",
    decryptedText: decryptedText,
  };
};
