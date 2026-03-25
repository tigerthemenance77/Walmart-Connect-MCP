import { afterEach, describe, expect, it } from "vitest";
import { AUTH_ERR_TEXT, loadCredentials } from "../../src/auth/credentials.js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("loadCredentials safe failures", () => {
  it("throws safe message when WALMART_AUTH_TOKEN is missing", () => {
    process.env.WALMART_AUTH_TOKEN = "";
    process.env.WALMART_CONSUMER_ID = "consumer-123";
    process.env.WALMART_PRIVATE_KEY_PATH = "/tmp/fake.pem";

    expect(() => loadCredentials()).toThrow(AUTH_ERR_TEXT);
  });

  it("throws safe message when WALMART_CONSUMER_ID is missing", () => {
    process.env.WALMART_AUTH_TOKEN = "token-abc";
    process.env.WALMART_CONSUMER_ID = "";
    process.env.WALMART_PRIVATE_KEY_PATH = "/tmp/fake.pem";

    expect(() => loadCredentials()).toThrow(AUTH_ERR_TEXT);
  });
});
