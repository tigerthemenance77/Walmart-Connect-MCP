import { describe, expect, it, vi } from "vitest";
import { AccountsManager } from "../../src/accounts/manager.js";
import type { WalmartApiClient } from "../../src/api/client.js";

describe("AccountsManager basic pinning", () => {
  it("throws NO_ACCOUNT_SET when no active account", async () => {
    const fakeClient = {} as WalmartApiClient;
    const manager = new AccountsManager(fakeClient);

    vi.spyOn(manager as any, "getOrLoadCache").mockResolvedValue({
      lastRefreshed: new Date().toISOString(),
      accounts: []
    });

    await expect(manager.getActiveAccountOrThrow()).rejects.toMatchObject({ code: "NO_ACCOUNT_SET" });
  });
});
