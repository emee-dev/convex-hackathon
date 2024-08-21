import crypto from "node:crypto";
import {
  decrypt,
  deriveEncryptionKeyFromCryptoKey,
  encrypt,
  generateCryptoKey,
} from "./crypto";

async function main() {
  let text = `Creates a new cryptographic key for AES-GCM. 
  The key is 128 bits long and is marked as extractable (true), 
  meaning it can be exported if needed. The key can be used for 
  both encryption and decryption.`;

  const cryptoKey = await generateCryptoKey("AES-GCM");
  const iv = crypto.getRandomValues(new Uint8Array(12)); // optimal length f

  let encryptedText = await encrypt(text, cryptoKey, iv);

  let encryptionKey = await deriveEncryptionKeyFromCryptoKey(cryptoKey);

  console.log("DECRYPT ", encryptionKey);

  let decryptedText = await decrypt({
    encryptedData: new Uint8Array(encryptedText.encryptedBuffer),
    cryptoKey,
    iv,
  });

  console.log("decryptedText: ", decryptedText);
}

main();

//   let base64 = Buffer.from(encryptedText.encryptedBuffer).toString("base64");

//   console.log(
//     "encryptedBuffer",
//     encryptedText.encryptedBuffer,
//     base64,
//     Buffer.from(base64, "base64")
//   );
