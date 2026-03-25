import { describe, expect, it } from "vitest";
import { createPrivateKey, createPublicKey, generateKeyPairSync, createVerify } from "node:crypto";
import { generateSignature } from "../../src/auth/hmac.js";

describe("generateSignature", () => {
  it("creates a verifiable RSA-SHA256 signature", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const privateObj = createPrivateKey(privateKey.export({ type: "pkcs1", format: "pem" }));
    const publicObj = createPublicKey(publicKey.export({ type: "pkcs1", format: "pem" }));

    const consumerId = "consumer-123";
    const timestamp = "1710000000";
    const keyVersion = "1";
    const signature = generateSignature(privateObj, consumerId, timestamp, keyVersion);

    const verify = createVerify("SHA256");
    verify.update(`${consumerId}\n${timestamp}\n${keyVersion}`);
    verify.end();

    expect(verify.verify(publicObj, signature, "base64")).toBe(true);
  });
});
