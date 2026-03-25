import { createPrivateKey, createSign, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";

export function loadPrivateKeyObject(privateKeyPath: string): KeyObject {
  const pem = readFileSync(privateKeyPath, "utf8");
  return createPrivateKey({ key: pem, format: "pem" });
}

export function generateSignature(
  privateKey: KeyObject,
  consumerId: string,
  timestamp: string,
  keyVersion: string
): string {
  const message = `${consumerId}\n${timestamp}\n${keyVersion}`;
  const sign = createSign("SHA256");
  sign.update(message);
  sign.end();
  return sign.sign(privateKey, "base64");
}
