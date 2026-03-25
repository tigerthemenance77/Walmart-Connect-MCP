import type { KeyObject } from "node:crypto";
import { loadPrivateKeyObject } from "./hmac.js";
import { McpToolError } from "../utils/validation.js";

export interface WalmartCredentials {
  authToken: string;
  consumerId: string;
  privateKey: KeyObject;
  keyVersion: string;
}

const AUTH_ERR_MSG =
  "Authentication failed — check that WALMART_AUTH_TOKEN, WALMART_CONSUMER_ID, and WALMART_PRIVATE_KEY_PATH are set correctly.";

export function loadCredentials(): WalmartCredentials {
  const authToken = process.env.WALMART_AUTH_TOKEN;
  const consumerId = process.env.WALMART_CONSUMER_ID;
  const privateKeyPath = process.env.WALMART_PRIVATE_KEY_PATH;
  const keyVersion = process.env.WM_SEC_KEY_VERSION ?? "1";

  if (!authToken || !consumerId || !privateKeyPath) {
    throw new McpToolError("AUTH_FAILED", AUTH_ERR_MSG);
  }

  try {
    const privateKey = loadPrivateKeyObject(privateKeyPath);
    return { authToken, consumerId, privateKey, keyVersion };
  } catch {
    throw new McpToolError("AUTH_FAILED", AUTH_ERR_MSG);
  }
}

export const AUTH_ERR_TEXT = AUTH_ERR_MSG;
