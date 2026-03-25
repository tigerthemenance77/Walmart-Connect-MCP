import { createPrivateKey, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { WalmartApiClient } from "../../src/api/client.js";

function makeClient() {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const keyObj = createPrivateKey(privateKey.export({ format: "pem", type: "pkcs1" }));
  return new WalmartApiClient({
    authToken: "test-token",
    consumerId: "test-consumer",
    privateKey: keyObj,
    keyVersion: "1"
  });
}

describe("WalmartApiClient read-only safeguards", () => {
  it("blocks non-allowlisted POST endpoints", async () => {
    const client = makeClient();

    await expect(client.request("/display/api/v1/mutateThing", { method: "POST" })).rejects.toMatchObject({
      message: expect.stringContaining("Blocked non-read-only POST endpoint")
    });
  });

  it("rejects PUT method", async () => {
    const client = makeClient();

    await expect(client.request("/api/v1/campaigns", { method: "PUT" as never })).rejects.toMatchObject({
      message: expect.stringContaining("Blocked non-read-only HTTP method")
    });
  });
});
