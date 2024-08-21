import { v } from "convex/values";
// import { action } from "../_generated/server";
import crypto from "node:crypto";

export type Keys = {
  privateKey: PrivateKey;
  publicKey: string;
};

// Function to encrypt data
export function encryptData(plaintext: string, publicKey: string): string {
  const buffer = Buffer.from(plaintext, "utf8");
  const encrypted = crypto.publicEncrypt(publicKey, buffer);
  return encrypted.toString("hex");
}

// Function to decrypt data
export function decryptData(ciphertext: string, privateKey: string): string {
  const buffer = Buffer.from(ciphertext, "hex");
  const decrypted = crypto.privateDecrypt(privateKey, buffer);
  return decrypted.toString("utf8");
}

// Function to generate public and private keys
export function generatePublicAndPrivateKeys(): Keys {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048, // Key size in bits
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { privateKey, publicKey } as Keys;
}

export type PrivateKey = `-----BEGIN PRIVATE KEY-----
${string}
-----END PRIVATE KEY-----`;

/**
 * Used to extract the public and private keys using regex to make it easier
 * to understand and work with.
 * @param publicKeyString
 * @param privateKeyString
 * @returns
 */
export function extractKeys(
  publicKeyString: string,
  privateKeyString: PrivateKey
) {
  // Regular expressions to extract the keys
  const publicKeyRegex =
    /(?<=-----BEGIN PUBLIC KEY-----\s)[A-Za-z0-9+/=\s]+(?=\s-----END PUBLIC KEY-----)/;
  const privateKeyRegex =
    /(?<=-----BEGIN PRIVATE KEY-----\s)[A-Za-z0-9+/=\s]+(?=\s-----END PRIVATE KEY-----)/;

  // Extracting the public key
  const publicKeyMatch = publicKeyString.match(publicKeyRegex);
  const publicKey = publicKeyMatch ? publicKeyMatch[0] : null;

  // Extracting the private key
  const privateKeyMatch = privateKeyString.match(privateKeyRegex);
  const privateKey = privateKeyMatch ? privateKeyMatch[0] : null;

  return { publicKeyValue: publicKey, privateKeyValue: privateKey };
}

/**
 * Formatter is used to split, join and format the private key to make
 * it user friendly, support database operations and also security considerations.
 */
export class Formatter {
  value: string | string[];
  instance: Formatter | null = null;
  isExtractClientCalled = false;
  isExtractServerCalled = false;
  constructor(value: string) {
    this.value = value.split("\n");

    if (!this.instance) {
      this.instance = this;
    }

    return this.instance;
  }

  private replaceAllCommas(value: string[]) {
    if (!Array.isArray(value)) {
      return;
    }
    return value.join(",").replace(/,/g, "_");
  }

  private replaceUnderscores(value: string) {
    return value.split("_").join(",").replace(/,/g, "\n");
  }

  /** Client slice is the first half */
  extractClientSlice() {
    if (this.isExtractClientCalled) {
      throw new Error("Duplicate [extractClientSlice] fn Call detected");
    }

    let slice = [...this.value].slice(0, 13);
    let formatted = this.replaceAllCommas(slice as string[]);
    this.isExtractClientCalled = true;

    return formatted;
  }

  /** Server slice is the second half */
  extractServerSlice() {
    if (this.isExtractServerCalled) {
      throw new Error("Duplicate [extractServerSlice] fn Call detected");
    }

    let slice = [...this.value].slice(13, this.value.length);
    let formatted = this.replaceAllCommas(slice);
    this.isExtractServerCalled = true;
    return formatted;
  }

  joinClientAndServerSlice(clientSlice: string, serverSlice: string) {
    let formattedClientSlice = this.replaceUnderscores(clientSlice);
    let formattedServerSlice = this.replaceUnderscores(serverSlice);

    return formattedClientSlice + "\n" + formattedServerSlice;
  }

  /** A combination of client and server slice makes up the private key */
  formPrivateKey(value: string) {
    return `-----BEGIN PRIVATE KEY-----${"\n" + value + "\n"}-----END PRIVATE KEY-----`;
  }
}
