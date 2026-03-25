import { describe, expect, it } from "vitest";
import { AUTH_ERR_TEXT } from "../../src/auth/credentials.js";
import { McpToolError } from "../../src/utils/validation.js";

describe("error redaction", () => {
  it("credential-related auth message does not leak sensitive token names/values", () => {
    const msg = AUTH_ERR_TEXT;
    expect(msg.toLowerCase()).not.toContain("auth_token");
    expect(msg.toLowerCase()).not.toContain("consumer_id");
    expect(msg).not.toContain("hardcoded-test-token-123");
  });

  it("McpToolError messages are safe strings", () => {
    const error = new McpToolError("API_ERROR", "Walmart API returned 500. Try again or check get_api_usage for rate limit status.");

    expect(error.message).not.toMatch(/WALMART_AUTH_TOKEN|consumer_id|private_key/i);
  });
});
