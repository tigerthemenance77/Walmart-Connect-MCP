import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WalmartCredentials } from "./auth/credentials.js";
import { WalmartApiClient } from "./api/client.js";
import { AccountsManager } from "./accounts/manager.js";
import { getCampaigns } from "./api/search/campaigns.js";
import { getAdGroups } from "./api/search/adGroups.js";
import { getAdItems } from "./api/search/adItems.js";
import { getKeywords } from "./api/search/keywords.js";
import { getRealtimeStats } from "./api/search/stats.js";
import {
  createSnapshot,
  downloadSnapshot as downloadSnapshotCsv,
  getSnapshotStatus
} from "./api/search/snapshots.js";
import { formatError, McpToolError, snapshotTypeSchema, toolText, emptyInputSchema } from "./utils/validation.js";

function withAccountHeader(account: { advertiserName: string; advertiserId: number; apiType: string }, body: unknown) {
  return `📍 Account: ${account.advertiserName} (ID: ${account.advertiserId}, ${account.apiType})\n${JSON.stringify(body, null, 2)}`;
}

export function registerTools(server: McpServer, credentials: WalmartCredentials) {
  const client = new WalmartApiClient(credentials);
  const accounts = new AccountsManager(client);

  const capture = async (fn: () => Promise<string>) => {
    try {
      return toolText(await fn());
    } catch (error) {
      return toolText(formatError(error));
    }
  };

  server.registerTool("list_accounts", { description: "List available Walmart advertiser accounts", inputSchema: emptyInputSchema }, () =>
    capture(async () => {
      const list = await accounts.listAccounts();
      return JSON.stringify(list, null, 2);
    })
  );

  server.registerTool(
    "set_account",
    { description: "Set active account context", inputSchema: z.object({ nameOrId: z.string().min(1) }).strict() },
    ({ nameOrId }) =>
      capture(async () => {
        const account = await accounts.setAccount(nameOrId);
        return `Active account set to ${account.advertiserName} (ID: ${account.advertiserId}, ${account.apiType}).`;
      })
  );

  server.registerTool("get_active_account", { description: "Get active account", inputSchema: emptyInputSchema }, () =>
    capture(async () => {
      const active = accounts.getActiveAccount();
      return active ? JSON.stringify(active, null, 2) : "No active account selected.";
    })
  );

  server.registerTool(
    "switch_account",
    { description: "Switch active account", inputSchema: z.object({ nameOrId: z.string().min(1) }).strict() },
    ({ nameOrId }) =>
      capture(async () => {
        const { previous, current } = await accounts.switchAccount(nameOrId);
        return `⚠️ Switched from ${previous.advertiserName} to ${current.advertiserName}. All subsequent queries will pull from ${current.advertiserName}.`;
      })
  );

  server.registerTool("refresh_accounts", { description: "Refresh account discovery snapshot", inputSchema: emptyInputSchema }, () =>
    capture(async () => {
      const result = await accounts.refreshAccounts();
      return JSON.stringify(result, null, 2);
    })
  );

  server.registerTool(
    "get_campaigns",
    {
      description: "Get campaigns for active account",
      inputSchema: z.object({ status: z.string().optional(), name: z.string().optional() }).strict()
    },
    ({ status, name }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        const data = await getCampaigns(client, account.advertiserId, { status, name });
        return withAccountHeader(account, data);
      })
  );

  server.registerTool(
    "get_ad_groups",
    { description: "Get ad groups for active account", inputSchema: z.object({ campaignId: z.string().optional() }).strict() },
    ({ campaignId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        const data = await getAdGroups(client, account.advertiserId, campaignId);
        return withAccountHeader(account, data);
      })
  );

  server.registerTool(
    "get_ad_items",
    { description: "Get ad items for active account", inputSchema: z.object({ campaignId: z.string().optional() }).strict() },
    ({ campaignId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        const data = await getAdItems(client, account.advertiserId, campaignId);
        return withAccountHeader(account, data);
      })
  );

  server.registerTool(
    "get_keywords",
    { description: "Get keywords for active account", inputSchema: z.object({ campaignId: z.string().optional() }).strict() },
    ({ campaignId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        const data = await getKeywords(client, account.advertiserId, campaignId);
        return withAccountHeader(account, data);
      })
  );

  server.registerTool(
    "get_realtime_stats",
    { description: "Get realtime stats for active account", inputSchema: z.object({ campaignId: z.string().optional() }).strict() },
    ({ campaignId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        const data = await getRealtimeStats(client, account.advertiserId, campaignId);
        return withAccountHeader(account, data);
      })
  );

  server.registerTool(
    "create_snapshot",
    {
      description: "Create insight snapshot for active account",
      inputSchema: z
        .object({
          reportType: snapshotTypeSchema,
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
        })
        .strict()
    },
    ({ reportType, startDate, endDate }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        const data = await createSnapshot(client, account.advertiserId, reportType, startDate, endDate);
        return withAccountHeader(account, data);
      })
  );

  server.registerTool(
    "get_snapshot_status",
    { description: "Get snapshot status", inputSchema: z.object({ snapshotId: z.string().min(1) }).strict() },
    ({ snapshotId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        const status = await getSnapshotStatus(client, snapshotId);
        return withAccountHeader(account, status);
      })
  );

  server.registerTool(
    "download_snapshot",
    { description: "Download snapshot CSV", inputSchema: z.object({ downloadUrl: z.string().url() }).strict() },
    ({ downloadUrl }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        const rows = await downloadSnapshotCsv(client, downloadUrl);
        return withAccountHeader(account, rows);
      })
  );
}
