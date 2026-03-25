import { describe, expect, it, vi } from "vitest";
import { AccountsManager } from "../../src/accounts/manager.js";
import type { WalmartApiClient } from "../../src/api/client.js";
import { formatError } from "../../src/utils/validation.js";

const accountFixture = [
  { advertiserId: 111, advertiserName: "Acme Corp", advertiserType: "brand", apiType: "search" as const },
  { advertiserId: 222, advertiserName: "Acme Labs", advertiserType: "brand", apiType: "search" as const },
  { advertiserId: 333, advertiserName: "Beta Brand", advertiserType: "brand", apiType: "display" as const }
];

describe("AccountsManager fuzzy selection", () => {
  it("exact match sets active account and confirms", async () => {
    const manager = new AccountsManager({} as WalmartApiClient);
    vi.spyOn(manager as never, "getOrLoadCache" as never).mockResolvedValue({
      lastRefreshed: new Date().toISOString(),
      accounts: accountFixture
    } as never);

    const selected = await manager.setAccount("Acme Corp");
    expect(selected.advertiserId).toBe(111);
    expect(manager.getActiveAccount()?.advertiserName).toBe("Acme Corp");
  });

  it("partial match with unique result sets account", async () => {
    const manager = new AccountsManager({} as WalmartApiClient);
    vi.spyOn(manager as never, "getOrLoadCache" as never).mockResolvedValue({
      lastRefreshed: new Date().toISOString(),
      accounts: accountFixture
    } as never);

    const selected = await manager.setAccount("Beta");
    expect(selected.advertiserId).toBe(333);
    expect(manager.getActiveAccount()?.advertiserName).toBe("Beta Brand");
  });

  it("partial match with multiple results returns disambiguation message and does not set account", async () => {
    const manager = new AccountsManager({} as WalmartApiClient);
    vi.spyOn(manager as never, "getOrLoadCache" as never).mockResolvedValue({
      lastRefreshed: new Date().toISOString(),
      accounts: accountFixture
    } as never);

    const before = manager.getActiveAccount();
    let message = "";
    try {
      await manager.setAccount("Acme");
    } catch (error) {
      message = formatError(error);
    }

    expect(message).toContain("Multiple accounts match");
    expect(message).toContain("Reply with the number or full name");
    expect(manager.getActiveAccount()).toEqual(before);
  });

  it("no match returns no account found message", async () => {
    const manager = new AccountsManager({} as WalmartApiClient);
    vi.spyOn(manager as never, "getOrLoadCache" as never).mockResolvedValue({
      lastRefreshed: new Date().toISOString(),
      accounts: accountFixture
    } as never);

    let message = "";
    try {
      await manager.setAccount("ZZZ Unknown");
    } catch (error) {
      message = formatError(error);
    }

    expect(message).toContain("No account found");
  });
});
