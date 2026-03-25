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
import { getPlacements, getPlacementMultipliers, getPlatformMultipliers } from "./api/search/placements.js";
import { getSbaProfile, getReviewStatus, getMedia } from "./api/search/sba.js";
import {
  getApiUsage,
  getKeywordAnalytics,
  getLatestReportDate,
  getSuggestedKeywords,
  searchItems
} from "./api/search/analytics.js";
import {
  getCampaignRecommendations,
  getItemRecommendations,
  getKeywordRecommendations,
  getTopSearchTrends
} from "./api/search/insights.js";
import { displayGetCampaigns } from "./api/display/campaigns.js";
import { displayGetAdGroups } from "./api/display/adGroups.js";
import { displayGetKeywords } from "./api/display/keywords.js";
import { displayGetCreatives, displayGetCreativeAssociations, displayGetCreativePreview } from "./api/display/creatives.js";
import { displayGetGeoLocations, displayGetTargeting } from "./api/display/targeting.js";
import { displayGetRealtimeStats } from "./api/display/stats.js";
import {
  displayCreateSnapshot,
  displayDownloadSnapshot,
  displayGetSnapshotStatus
} from "./api/display/snapshots.js";
import {
  displaySnapshotTypeSchema,
  emptyInputSchema,
  formatError,
  snapshotTypeSchema,
  toolText
} from "./utils/validation.js";

function withAccountHeader(account: { advertiserName: string; advertiserId: number; apiType: string }, body: unknown) {
  return `📍 Account: ${account.advertiserName} (ID: ${account.advertiserId}, ${account.apiType})\n${JSON.stringify(body, null, 2)}`;
}

const optionalDateRangeSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  })
  .strict();

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

  server.registerPrompt(
    "onboarding",
    { description: "Guided setup: credential check → account discovery → account selection → test query" },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Welcome to Walmart Connect MCP! Let's get you set up.

Step 1: Verify credentials are loaded — call get_active_account. If it errors with missing credentials, check your WALMART_AUTH_TOKEN, WALMART_CONSUMER_ID, and WALMART_PRIVATE_KEY_PATH env vars.

Step 2: Discover your accounts — call list_accounts. If the cache is empty, it will auto-run account discovery. This takes ~60 seconds while the snapshot generates.

Step 3: Select an account — call set_account with the name of the account you want to query (e.g. "Acme Corp" or just "Acme").

Step 4: Run a test query — call get_campaigns to verify data is flowing.

You're ready to work with Walmart Connect data!`
          }
        }
      ]
    })
  );

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
    { description: "Get campaigns for active account", inputSchema: z.object({ status: z.string().optional(), name: z.string().optional() }).strict() },
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
      inputSchema: z.object({ reportType: snapshotTypeSchema, startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict()
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

  server.registerTool(
    "get_placements",
    { description: "Get placements for active account", inputSchema: z.object({ campaignId: z.string().min(1) }).strict() },
    ({ campaignId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await getPlacements(client, account.advertiserId, campaignId));
      })
  );

  server.registerTool(
    "get_placement_multipliers",
    { description: "Get placement multipliers for active account", inputSchema: z.object({ campaignId: z.string().min(1) }).strict() },
    ({ campaignId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await getPlacementMultipliers(client, account.advertiserId, campaignId));
      })
  );

  server.registerTool(
    "get_platform_multipliers",
    { description: "Get platform multipliers for active account", inputSchema: z.object({ campaignId: z.string().min(1) }).strict() },
    ({ campaignId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await getPlatformMultipliers(client, account.advertiserId, campaignId));
      })
  );

  server.registerTool(
    "get_sba_profile",
    {
      description: "Get SBA profile for active account",
      inputSchema: z.object({ campaignId: z.string().min(1), adGroupId: z.string().min(1) }).strict()
    },
    ({ campaignId, adGroupId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await getSbaProfile(client, account.advertiserId, campaignId, adGroupId));
      })
  );

  server.registerTool("get_review_status", { description: "Get review status for active account", inputSchema: emptyInputSchema }, () =>
    capture(async () => {
      const account = await accounts.getActiveAccountOrThrow();
      return withAccountHeader(account, await getReviewStatus(client, account.advertiserId));
    })
  );

  server.registerTool("get_media", { description: "Get media for active account", inputSchema: emptyInputSchema }, () =>
    capture(async () => {
      const account = await accounts.getActiveAccountOrThrow();
      return withAccountHeader(account, await getMedia(client, account.advertiserId));
    })
  );

  server.registerTool(
    "search_items",
    { description: "Search items for active account", inputSchema: z.object({ query: z.string().optional(), itemIds: z.array(z.string()).max(50).optional() }).strict() },
    ({ query, itemIds }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await searchItems(client, account.advertiserId, query, itemIds));
      })
  );

  server.registerTool(
    "get_keyword_analytics",
    { description: "Get keyword analytics for active account", inputSchema: z.object({ itemIds: z.array(z.string()).min(1).max(10) }).strict() },
    ({ itemIds }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await getKeywordAnalytics(client, account.advertiserId, itemIds));
      })
  );

  server.registerTool(
    "get_suggested_keywords",
    { description: "Get suggested keywords for active account", inputSchema: z.object({ itemIds: z.array(z.string()).min(1) }).strict() },
    ({ itemIds }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await getSuggestedKeywords(client, account.advertiserId, itemIds));
      })
  );

  server.registerTool("get_api_usage", { description: "Get API usage for active account", inputSchema: emptyInputSchema }, () =>
    capture(async () => {
      const account = await accounts.getActiveAccountOrThrow();
      return withAccountHeader(account, await getApiUsage(client, account.advertiserId));
    })
  );

  server.registerTool(
    "get_latest_report_date",
    { description: "Get latest report date for active account", inputSchema: emptyInputSchema },
    () =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await getLatestReportDate(client, account.advertiserId));
      })
  );

  server.registerTool(
    "get_top_search_trends",
    { description: "Get top search trends (advertiser agnostic)", inputSchema: z.object({ format: z.string().optional() }).strict() },
    ({ format }) =>
      capture(async () => {
        const data = await getTopSearchTrends(client, format);
        return JSON.stringify(data, null, 2);
      })
  );

  server.registerTool(
    "get_item_recommendations",
    { description: "Get item recommendations snapshot for active account", inputSchema: optionalDateRangeSchema },
    ({ startDate, endDate }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await getItemRecommendations(client, account.advertiserId, startDate, endDate));
      })
  );

  server.registerTool(
    "get_keyword_recommendations",
    { description: "Get keyword recommendations snapshot for active account", inputSchema: optionalDateRangeSchema },
    ({ startDate, endDate }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await getKeywordRecommendations(client, account.advertiserId, startDate, endDate));
      })
  );

  server.registerTool(
    "get_campaign_recommendations",
    { description: "Get out-of-budget campaign recommendations snapshot for active account", inputSchema: optionalDateRangeSchema },
    ({ startDate, endDate }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await getCampaignRecommendations(client, account.advertiserId, startDate, endDate));
      })
  );

  server.registerTool(
    "display_get_campaigns",
    { description: "Get display campaigns for active account", inputSchema: z.object({ status: z.string().optional(), name: z.string().optional() }).strict() },
    ({ status, name }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await displayGetCampaigns(client, account.advertiserId, { status, name }));
      })
  );

  server.registerTool(
    "display_get_ad_groups",
    { description: "Get display ad groups for active account", inputSchema: z.object({ campaignId: z.string().optional() }).strict() },
    ({ campaignId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await displayGetAdGroups(client, account.advertiserId, campaignId));
      })
  );

  server.registerTool(
    "display_get_keywords",
    { description: "Get display keywords for active account", inputSchema: z.object({ adGroupId: z.string().optional() }).strict() },
    ({ adGroupId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await displayGetKeywords(client, account.advertiserId, adGroupId));
      })
  );

  server.registerTool(
    "display_get_targeting",
    {
      description: "Get display targeting for active account",
      inputSchema: z.object({ tactic: z.string().optional(), audienceType: z.string().optional() }).strict()
    },
    ({ tactic, audienceType }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await displayGetTargeting(client, account.advertiserId, { tactic, audienceType }));
      })
  );

  server.registerTool(
    "display_get_geo_locations",
    { description: "Get display geo targeting locations for active account", inputSchema: z.object({ search: z.string().optional() }).strict() },
    ({ search }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await displayGetGeoLocations(client, account.advertiserId, search));
      })
  );

  server.registerTool(
    "display_get_creatives",
    { description: "Get display creatives for active account", inputSchema: z.object({ folderId: z.string().optional(), name: z.string().optional() }).strict() },
    ({ folderId, name }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await displayGetCreatives(client, account.advertiserId, { folderId, name }));
      })
  );

  server.registerTool(
    "display_get_creative_preview",
    { description: "Get display creative preview for active account", inputSchema: z.object({ creativeId: z.string().min(1) }).strict() },
    ({ creativeId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await displayGetCreativePreview(client, account.advertiserId, creativeId));
      })
  );

  server.registerTool(
    "display_get_creative_associations",
    { description: "Get display creative associations for active account", inputSchema: z.object({ adGroupId: z.string().optional() }).strict() },
    ({ adGroupId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await displayGetCreativeAssociations(client, account.advertiserId, adGroupId));
      })
  );

  server.registerTool(
    "display_get_realtime_stats",
    {
      description: "Get display realtime stats for active account",
      inputSchema: z.object({ campaignIds: z.array(z.string()).optional(), adGroupIds: z.array(z.string()).optional() }).strict()
    },
    ({ campaignIds, adGroupIds }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(
          account,
          await displayGetRealtimeStats(client, account.advertiserId, campaignIds, adGroupIds)
        );
      })
  );

  server.registerTool(
    "display_create_snapshot",
    {
      description: "Create display insight snapshot for active account",
      inputSchema: z
        .object({
          reportType: displaySnapshotTypeSchema,
          startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
        })
        .strict()
    },
    ({ reportType, startDate, endDate }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(
          account,
          await displayCreateSnapshot(client, account.advertiserId, reportType, startDate, endDate)
        );
      })
  );

  server.registerTool(
    "display_get_snapshot_status",
    { description: "Get display snapshot status", inputSchema: z.object({ snapshotId: z.string().min(1) }).strict() },
    ({ snapshotId }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await displayGetSnapshotStatus(client, snapshotId));
      })
  );

  server.registerTool(
    "display_download_snapshot",
    { description: "Download display snapshot CSV", inputSchema: z.object({ downloadUrl: z.string().url() }).strict() },
    ({ downloadUrl }) =>
      capture(async () => {
        const account = await accounts.getActiveAccountOrThrow();
        return withAccountHeader(account, await displayDownloadSnapshot(client, downloadUrl));
      })
  );
}
