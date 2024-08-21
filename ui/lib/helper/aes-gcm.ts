import crypto from "node:crypto";
const cryptoSubtle = crypto.webcrypto.subtle;

const AES_MODES = {
  GCM: "AES-GCM",
};

type Modes = "AES-GCM";
type Encrypt = {
  text: string;
};
type Decrypt = {
  encryptedData: ArrayBuffer;
  cryptoKey: CryptoKey;
  iv: Uint8Array;
};

export class Format {
  // value: string;
  // constructor(text: string) {
  //   this.value = text;
  // }

  constructor() {}

  ivToBase64(value: Uint8Array) {
    return Buffer.from(value).toString("base64");
  }
  encryptedBufferToBase64(value: ArrayBuffer) {
    return Buffer.from(value).toString("base64");
  }

  base64IvToUint8Array(base64: string) {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  encryptedBufferToUint8Array(base64: string) {
    return Buffer.from(base64, "base64");
  }
}

export const encode = (text: string) => {
  return new TextEncoder().encode(text);
};

export const generateCryptoKey = async (algo: Modes) => {
  const key = await cryptoSubtle.generateKey(
    {
      name: algo,
      length: 128,
    },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
};

export const encrypt = async ({ text }: Encrypt) => {
  const cryptoKey = await generateCryptoKey("AES-GCM");
  const iv = crypto.getRandomValues(new Uint8Array(12)); // optimal length f

  let encryptedBuffer = await cryptoSubtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    encode(text)
  );

  return { encryptedBuffer, cryptoKey, iv };
};

export const deriveEncryptionKeyFromCryptoKey = async (
  cryptoKey: CryptoKey
): Promise<string | undefined> => {
  const exportedkey = await cryptoSubtle.exportKey("jwk", cryptoKey);
  return exportedkey.k;
};

export const deriveCryptoKeyfromEncryptionKey = async (
  encryptionKey: string,
  name: Modes
) => {
  const alg = {
    [AES_MODES.GCM]: "A128GCM",
  };

  const cryptoKey = await cryptoSubtle.importKey(
    "jwk",
    {
      alg: alg[name],
      ext: true,
      k: encryptionKey,
      key_ops: ["encrypt", "decrypt"],
      kty: "oct",
    },
    {
      name,
      length: 128,
    },
    false,
    ["encrypt", "decrypt"]
  );
  return cryptoKey;
};

export const dataToBytes = (data: string | Array<string>) => {
  const arr = Array.from(data) as unknown as ArrayBuffer;
  const bytes = new Uint8Array(arr);

  return bytes;
};

export const decrypt = async ({ encryptedData, cryptoKey, iv }: Decrypt) => {
  let decryptedBuffer = await cryptoSubtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    cryptoKey,
    encryptedData
  );

  const decryptedData = new TextDecoder().decode(decryptedBuffer);
  return decryptedData;
};

// async function main() {
//   let text = `Creates a new cryptographic key for AES-GCM.
//     The key is 128 bits long and is marked as extractable (true),
//     meaning it can be exported if needed. The key can be used for
//     both encryption and decryption.`;

//   // let format = new Format();

//   let encryptedText = await encrypt({ text });

//   let encryptionKey = await deriveEncryptionKeyFromCryptoKey(
//     encryptedText.cryptoKey
//   );

//   let encryptedData = new Uint8Array(encryptedText.encryptedBuffer);
//   //   let base64 = Buffer.from(encryptedText.encryptedBuffer).toString("base64");
//   // let base64 = Buffer.from(encryptedText.iv).toString("base64");

//   const derivedCryptoKey = await deriveCryptoKeyfromEncryptionKey(
//     encryptionKey!,
//     "AES-GCM"
//   );

//   let decryptedText = await decrypt({
//     encryptedData,
//     cryptoKey: derivedCryptoKey,
//     iv: encryptedText.iv,
//   });

//   console.log("encryption key: ", encryptionKey);
//   console.log("iv: ", Buffer.from(encryptedText.iv).toString("base64"));
//   console.log(
//     "encryptedBuffer: ",
//     Buffer.from(encryptedText.encryptedBuffer).toString("base64")
//   );
//   // console.log("base64 ", base64);
//   // console.log("iv Back: ", new Uint8Array(Buffer.from(base64, "base64")));
//   console.log("decryptedText: ", decryptedText);
// }

// main();

//   let base64 = Buffer.from(encryptedText.encryptedBuffer).toString("base64");

//   console.log(
//     "encryptedBuffer",
//     encryptedText.encryptedBuffer,
//     base64,
//     Buffer.from(base64, "base64")
//   );
