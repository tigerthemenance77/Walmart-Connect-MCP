# @kobe/walmart-mcp

Read-only MCP server for Walmart Connect Sponsored Search and Display APIs.

## Phase 1 capabilities

- Per-request Walmart auth signing (RSA-SHA256 signature header)
- Shared HTTP client with 429 retry (full-jitter exponential backoff)
- Lazy account discovery from `advertiserAttributesV2` snapshot
- Account cache at `~/.walmart-mcp/accounts-cache.json`
- Account management tools:
  - `set_account`
  - `get_active_account`
  - `switch_account`
  - `list_accounts`
  - `refresh_accounts`
- Account pinning enforcement across all data tools
- Data tools:
  - `get_campaigns`
  - `get_ad_groups`
  - `get_ad_items`
  - `get_keywords`
  - `get_realtime_stats`
  - `create_snapshot`
  - `get_snapshot_status`
  - `download_snapshot`

## Install and run

```bash
npm install
npm run build
npx @kobe/walmart-mcp
```

## Environment variables

Copy `.env.example` and set:

- `WALMART_AUTH_TOKEN`
- `WALMART_CONSUMER_ID`
- `WALMART_PRIVATE_KEY_PATH`
- Optional: `WM_SEC_KEY_VERSION` (defaults to `1`)

## Important constraints

- No write operations to Walmart entities.
- Only allowed POST endpoints:
  - `/api/v1/insights/snapshot`
  - `/api/v1/itemSearch`
  - `/api/v1/keywordAnalytics`
- No PUT, DELETE, or other POSTs.
- stdio transport only (JSON-RPC on stdout, logs on stderr).
- Credentials are never returned in tool output.

## Account pinning behavior

All data tools require an active account context. If no account is selected:

`No account selected. Use set_account to select one. Available accounts: [list]`

Every data response begins with:

`📍 Account: [Name] (ID: [id], [apiType])`
