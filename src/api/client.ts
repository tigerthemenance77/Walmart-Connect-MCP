import { randomUUID } from "node:crypto";
import type { WalmartCredentials } from "../auth/credentials.js";
import { generateSignature } from "../auth/hmac.js";
import { McpToolError } from "../utils/validation.js";

export const SEARCH_BASE_URL = "https://developer.api.walmart.com/api-proxy/service/WPA";
export const DISPLAY_BASE_URL = "https://developer.api.us.walmart.com/api-proxy/service/display/api/v1";

interface RequestOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  rawUrl?: string;
  baseUrl?: string;
}

export class WalmartApiClient {
  constructor(private readonly credentials: WalmartCredentials) {}

  async request(path: string, options: RequestOptions = {}): Promise<unknown> {
    const { method = "GET", query, body, rawUrl, baseUrl } = options;

    if (method === "POST" && !this.isAllowedPost(path)) {
      throw new McpToolError("API_ERROR", `Blocked non-read-only POST endpoint: ${path}`);
    }

    const url = rawUrl ?? this.makeUrl(path, query, baseUrl);
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt++) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const correlationId = randomUUID();
      const signature = generateSignature(
        this.credentials.privateKey,
        this.credentials.consumerId,
        timestamp,
        this.credentials.keyVersion
      );

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.credentials.authToken}`,
          "WM_CONSUMER.ID": this.credentials.consumerId,
          "WM_SEC.AUTH_SIGNATURE": signature,
          "WM_SEC.KEY_VERSION": this.credentials.keyVersion,
          "WM_CONSUMER.intimestamp": timestamp,
          "WM_QOS.CORRELATION_ID": correlationId,
          "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (response.status === 429) {
        if (attempt === 2) {
          throw new McpToolError("RATE_LIMITED", "Walmart API rate limit exceeded after retries.");
        }
        const delay =
          Math.random() * Math.min(30 * 60 * 1000, 10 * 60 * 1000 * Math.pow(2, attempt));
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        throw new McpToolError(
          "AUTH_FAILED",
          "Authentication failed — check that WALMART_AUTH_TOKEN, WALMART_CONSUMER_ID, and WALMART_PRIVATE_KEY_PATH are set correctly."
        );
      }

      if (!response.ok) {
        const text = await response.text();
        throw new McpToolError("API_ERROR", `Walmart API error ${response.status}: ${text.slice(0, 300)}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
        return response.text();
      }
      return response.json();
    }

    throw new McpToolError("API_ERROR", `Request failed: ${String(lastError)}`);
  }

  private makeUrl(path: string, query?: Record<string, string | number | undefined>, baseUrl?: string): string {
    const root = baseUrl ?? SEARCH_BASE_URL;
    const endpoint = path.startsWith("http") ? path : `${root}${path.startsWith("/") ? "" : "/"}${path}`;
    const url = new URL(endpoint);
    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
    return url.toString();
  }

  private isAllowedPost(path: string): boolean {
    return [
      "/api/v1/insights/snapshot",
      "/api/v1/itemSearch",
      "/api/v1/keywordAnalytics",
      "/insights/snapshot"
    ].includes(path);
  }
}
