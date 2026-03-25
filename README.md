# @kobe/walmart-mcp

Read-only MCP server for Walmart Connect Sponsored Search and Display APIs. Install in minutes via `npx`, connect to Claude Desktop, and query your advertising data conversationally.

## Prerequisites

- Node.js 18+
- Walmart Connect Partner Network membership with API credentials
- Claude Desktop (or any MCP-compatible host)

## RSA Key Setup

Walmart uses RSA-SHA256 request signing. You need to generate a key pair and register your public key:

```bash
openssl genrsa -des3 -out agency_key_pair 2048
openssl pkcs8 -topk8 -inform PEM -in agency_key_pair -outform PEM -out agency_private_key.pem -nocrypt
openssl rsa -in agency_key_pair -outform PEM -pubout -out agency_public_key.pem
```

Upload `agency_public_key.pem` to the [Walmart Connect Self-Serve Partner Onboarding Platform](https://developer.walmart.com). You will receive your Consumer ID, Auth Token, and Key Version.

## Claude Desktop Config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "walmart-ads": {
      "command": "npx",
      "args": ["-y", "@kobe/walmart-mcp"],
      "env": {
        "WALMART_AUTH_TOKEN": "your-bearer-token",
        "WALMART_CONSUMER_ID": "your-consumer-uuid",
        "WALMART_PRIVATE_KEY_PATH": "/path/to/agency_private_key.pem"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `WALMART_AUTH_TOKEN` | ✅ | Bearer token from Walmart Connect |
| `WALMART_CONSUMER_ID` | ✅ | Consumer UUID from Walmart Connect |
| `WALMART_PRIVATE_KEY_PATH` | ✅ | Path to PKCS8 PEM private key file |
| `WM_SEC_KEY_VERSION` | — | Key version (default: `1`) |

## Account Pinning

This server enforces strict account pinning. Before querying any data, you must set an active account:

```
User: show me campaign performance
Claude → set_account("Acme Corp")
Server → 📍 Account set: Acme Corp (ID: 78901, search)

User: get campaigns
Claude → get_campaigns()
Server → 📍 Account: Acme Corp (ID: 78901, search)
[campaign data...]

User: switch to Beta Brand
Claude → switch_account("Beta Brand")
Server → ⚠️ Switched from Acme Corp to Beta Brand (ID: 45678, search). All subsequent queries will pull from Beta Brand.
```

Every data response includes the `📍 Account:` header so you always know which account's data you're viewing.

## Tools Reference

### Account Management (5 tools)
| Tool | Description |
|------|-------------|
| `list_accounts` | List all discovered advertiser accounts |
| `get_active_account` | Show currently pinned account |
| `set_account` | Pin an account by name or ID |
| `switch_account` | Switch to a different account (clears cache) |
| `refresh_accounts` | Re-discover accounts from API |

### Sponsored Search — Entity Data (10 tools)
| Tool | Description |
|------|-------------|
| `get_campaigns` | List campaigns (filter by status/name) |
| `get_ad_groups` | List ad groups (filter by campaign) |
| `get_ad_items` | List advertised products in a campaign |
| `get_keywords` | List keywords in a campaign |
| `get_placements` | List placement configurations |
| `get_placement_multipliers` | Get placement bid multipliers |
| `get_platform_multipliers` | Get platform bid multipliers (desktop/app/mobile) |
| `get_sba_profile` | Get Sponsored Brands profile (headline/logo/landing page) |
| `get_review_status` | Get ad review status |
| `get_media` | List video assets |

### Sponsored Search — Performance (2 tools)
| Tool | Description |
|------|-------------|
| `get_realtime_stats` | Near-real-time spend/clicks/impressions (30min lag) |
| `get_api_usage` | Hourly API operation count + rate limit status |

### Sponsored Search — Analytics (3 tools)
| Tool | Description |
|------|-------------|
| `search_items` | Search Walmart catalog by query or item IDs |
| `get_keyword_analytics` | Keyword search frequency/volume (max 10 items) |
| `get_suggested_keywords` | Keyword suggestions for item IDs |

### Sponsored Search — Insights (4 tools)
| Tool | Description |
|------|-------------|
| `get_top_search_trends` | Daily trending keywords across Walmart (no account required) |
| `get_item_recommendations` | Recommended items to advertise |
| `get_keyword_recommendations` | Recommended keywords to bid on |
| `get_campaign_recommendations` | Out-of-budget campaign optimization suggestions |

### Sponsored Search — Snapshots (3 tools)
| Tool | Description |
|------|-------------|
| `create_snapshot` | Initiate async report (20 report types) |
| `get_snapshot_status` | Poll readiness + estimated completion time |
| `download_snapshot` | Download + parse completed report as structured data |

**Search snapshot report types:** `keyword`, `campaign`, `adItem`, `adGroup`, `placement`, `platform`, `pageType`, `brand`, `category`, `itemKeyword`, `searchImpression`, `itemHealth`, `outOfBudgetRecommendations`, `attributedPurchases`, `videoCampaigns`, `videoKeywords`, `advancedInsights`, `entitySnapshot`, `auditSnapshot`, `advertiserAttributesV2`

### Display — Entity Data (15 tools)
| Tool | Description |
|------|-------------|
| `display_get_campaigns` | List Display campaigns |
| `display_get_ad_groups` | List Display ad groups for a campaign |
| `display_get_keywords` | List keywords for a Display ad group |
| `display_get_targeting` | List contextual/behavioral targeting segments |
| `display_get_geo_locations` | Search geo-targeting locations |
| `display_get_creatives` | List creative assets |
| `display_get_creative_preview` | Preview a creative by ID |
| `display_get_creative_associations` | List ad group ↔ creative mappings |
| `display_get_itemsets` | List itemsets |
| `display_get_itemset_associations` | List itemset associations |
| `display_get_catalog` | Query catalog items |
| `display_get_brands` | Search brands |
| `display_get_taxonomies` | Search taxonomies |
| `display_get_brand_landing_pages` | List brand landing pages |
| `display_get_folders` | List asset folders |

### Display — Forecasting + Performance + Snapshots (6 tools)
| Tool | Description |
|------|-------------|
| `display_get_reach_estimate` | Reach estimate for targeting/date range |
| `display_get_delivery_estimate` | Delivery estimate for budget + targeting |
| `display_get_realtime_stats` | Near-real-time impressions/clicks/spend (15min lag) |
| `display_create_snapshot` | Initiate async Display report |
| `display_get_snapshot_status` | Poll Display snapshot readiness |
| `display_download_snapshot` | Download + parse Display report |

**Display snapshot report types:** `campaign`, `adGroup`, `keyword`, `bid`, `creative`, `pageType`, `platform`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 403 Forbidden | Walmart requires no cookies. This server uses native `fetch` which doesn't persist cookies. |
| Auth signature error | Ensure private key is PKCS8 PEM format (the `openssl` commands above produce the correct format). |
| Empty account list | Verify your Walmart Connect Partner Network membership. Contact `wmc-partner-portal@walmart.com`. |
| Rate limits (429) | Use `get_api_usage` to check your hourly operation count. Server retries automatically with backoff. |
| Snapshot takes too long | Snapshots take 60–300 seconds. Use `get_snapshot_status` to poll. Keyword and campaign reports are fastest. |

## Security

- **Read-only:** Zero write operations. No PUT, DELETE, or state-mutating POSTs.
- **No credential leakage:** Bearer token, Consumer ID, and private key never appear in tool responses, logs, or errors.
- **Account pinning:** No `account` parameter on data tools — prevents cross-account contamination.
- **stdio transport:** No network exposure. Claude Desktop manages the process lifecycle.

## Links

- [Walmart Connect Developer Portal](https://developer.walmart.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Report issues](https://github.com/tigerthemenance77/Walmart-Connect-MCP/issues)
