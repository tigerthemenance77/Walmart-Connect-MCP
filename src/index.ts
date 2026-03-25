#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadCredentials } from "./auth/credentials.js";
import { registerTools } from "./server.js";
import { logger } from "./utils/logger.js";
import { McpToolError } from "./utils/validation.js";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  process.stderr.write("walmart-mcp: read-only Walmart Connect MCP server (stdio transport)\n");
  process.stderr.write("Set WALMART_AUTH_TOKEN, WALMART_CONSUMER_ID, WALMART_PRIVATE_KEY_PATH before starting.\n");
  process.exit(0);
}

try {
  const credentials = loadCredentials();
  const server = new McpServer(
    { name: "walmart-mcp", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  registerTools(server, credentials);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Walmart MCP server ready");
} catch (error) {
  if (error instanceof McpToolError) {
    logger.error(error.message);
  } else {
    logger.error(error instanceof Error ? error.message : String(error));
  }
  process.exit(1);
}
