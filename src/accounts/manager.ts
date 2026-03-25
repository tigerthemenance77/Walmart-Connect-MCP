import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { WalmartApiClient } from "../api/client.js";
import { createAdvertiserAttributesSnapshot, downloadSnapshot, getSnapshotStatus } from "../api/search/snapshots.js";
import type { SnapshotStatus } from "../api/search/types.js";
import { McpToolError } from "../utils/validation.js";
import type { AccountsCache, WalmartAccount } from "./types.js";

const CACHE_DIR = join(homedir(), ".walmart-mcp");
const CACHE_PATH = join(CACHE_DIR, "accounts-cache.json");

const accountContext: { activeAccount: WalmartAccount | null } = {
  activeAccount: null
};

export async function listAccounts(manager: AccountsManager): Promise<WalmartAccount[]> {
  return manager.listAccounts();
}

export class AccountsManager {
  private inMemoryCache: AccountsCache | null = null;
  private pendingMatches: WalmartAccount[] | null = null;
  private pendingQuery: string | null = null;

  constructor(private readonly client: WalmartApiClient) {}

  async listAccounts(): Promise<WalmartAccount[]> {
    const cache = await this.getOrLoadCache();
    return cache.accounts;
  }

  async setAccount(nameOrId: string): Promise<WalmartAccount> {
    const accounts = await this.listAccounts();
    const account = this.resolveAccount(accounts, nameOrId);
    accountContext.activeAccount = account;
    this.pendingMatches = null;
    this.pendingQuery = null;
    return account;
  }

  async switchAccount(nameOrId: string): Promise<{ previous: WalmartAccount; current: WalmartAccount }> {
    const previous = accountContext.activeAccount;
    if (!previous) {
      const current = await this.setAccount(nameOrId);
      return { previous: current, current };
    }

    const current = await this.setAccount(nameOrId);
    return { previous, current };
  }

  getActiveAccount(): WalmartAccount | null {
    return accountContext.activeAccount;
  }

  async getActiveAccountOrThrow(): Promise<WalmartAccount> {
    const active = accountContext.activeAccount;
    if (active) return active;

    const available = (await this.listAccounts()).map((a) => `${a.advertiserName} (${a.advertiserId})`).join(", ");
    throw new McpToolError(
      "NO_ACCOUNT_SET",
      `No account selected. Use set_account to select one. Available accounts: ${available || "[]"}`
    );
  }

  async refreshAccounts(): Promise<{ added: number; removed: number; total: number }> {
    const before = await this.getOrLoadCache();
    const after = await this.discoverAndCacheAccounts();

    const beforeSet = new Set(before.accounts.map((a) => `${a.advertiserId}:${a.apiType}`));
    const afterSet = new Set(after.accounts.map((a) => `${a.advertiserId}:${a.apiType}`));

    const added = [...afterSet].filter((k) => !beforeSet.has(k)).length;
    const removed = [...beforeSet].filter((k) => !afterSet.has(k)).length;

    return { added, removed, total: after.accounts.length };
  }

  private async getOrLoadCache(): Promise<AccountsCache> {
    if (this.inMemoryCache) return this.inMemoryCache;

    if (existsSync(CACHE_PATH)) {
      const parsed = JSON.parse(readFileSync(CACHE_PATH, "utf8")) as AccountsCache;
      this.inMemoryCache = parsed;
      return parsed;
    }

    return this.discoverAndCacheAccounts();
  }

  private async discoverAndCacheAccounts(): Promise<AccountsCache> {
    const { snapshotId } = await createAdvertiserAttributesSnapshot(this.client);
    const status = await this.pollSnapshot(snapshotId);

    if (!status.downloadUrl) {
      throw new McpToolError("API_ERROR", "Snapshot completed without downloadUrl.");
    }

    const rows = await downloadSnapshot(this.client, status.downloadUrl);
    const accounts = rows
      .map((row) => ({
        advertiserId: Number(row.advertiserId ?? row.advertiser_id),
        advertiserName: row.advertiserName ?? row.advertiser_name ?? "Unknown",
        advertiserType: row.advertiserType ?? row.advertiser_type ?? "unknown",
        apiType: (((row.apiType ?? row.api_type ?? "search") as string).toLowerCase() === "display"
          ? "display"
          : "search") as "search" | "display"
      }))
      .filter((a) => Number.isFinite(a.advertiserId));

    const cache: AccountsCache = {
      lastRefreshed: new Date().toISOString(),
      accounts
    };

    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
    this.inMemoryCache = cache;
    return cache;
  }

  private async pollSnapshot(snapshotId: string): Promise<SnapshotStatus> {
    const maxAttempts = 120;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await getSnapshotStatus(this.client, snapshotId);
      if (status.jobStatus === "done") return status;
      if (status.jobStatus === "expired") {
        throw new McpToolError("SNAPSHOT_EXPIRED", "Snapshot expired before download.");
      }
      if (status.jobStatus === "failed") {
        throw new McpToolError("API_ERROR", "Snapshot generation failed.");
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    throw new McpToolError("API_ERROR", "Snapshot polling timed out.");
  }

  private resolveAccount(accounts: WalmartAccount[], nameOrId: string): WalmartAccount {
    const query = nameOrId.trim();
    const normalized = query.toLowerCase();

    if (this.pendingMatches?.length && this.pendingQuery) {
      const byIndex = /^\d+$/.test(query) ? this.pendingMatches[Number(query) - 1] : undefined;
      if (byIndex) return byIndex;

      const byFullName = this.pendingMatches.find((a) => a.advertiserName.toLowerCase() === normalized);
      if (byFullName) return byFullName;
    }

    const exactId = accounts.find((a) => String(a.advertiserId) === query);
    if (exactId) return exactId;

    const exactName = accounts.find((a) => a.advertiserName.toLowerCase() === normalized);
    if (exactName) return exactName;

    const matches = accounts.filter(
      (a) => a.advertiserName.toLowerCase().includes(normalized) || String(a.advertiserId).includes(normalized)
    );

    if (matches.length === 1) return matches[0];

    if (matches.length > 1) {
      this.pendingMatches = matches;
      this.pendingQuery = query;
      const options = matches
        .map((account, index) => `(${index + 1}) ${account.advertiserName} (ID: ${account.advertiserId}, ${account.apiType})`)
        .join(", ");
      throw new McpToolError(
        "ACCOUNT_NOT_FOUND",
        `Multiple accounts match '${query}': ${options}. Reply with the number or full name.`
      );
    }

    this.pendingMatches = null;
    this.pendingQuery = null;
    throw new McpToolError(
      "ACCOUNT_NOT_FOUND",
      `No account found matching '${query}'. Run list_accounts to see all available accounts, or refresh_accounts if new accounts were added recently.`
    );
  }
}
