import crypto from "node:crypto";

const ACTIVE_SALT = "abil_vault_salt_v1";

let activeKeyCache: Buffer | null = null;

function dedicatedSecret(): string {
  return String(process.env.VAULT_ENC_KEY || "").trim();
}

function activeKey(): Buffer {
  if (activeKeyCache) return activeKeyCache;
  const secret = dedicatedSecret();
  if (!secret) throw new Error("vault encryption key is not configured");
  activeKeyCache = crypto.scryptSync(secret, ACTIVE_SALT, 32);
  return activeKeyCache;
}

function decryptWithKey(blob: string, key: Buffer): string | null {
  try {
    if (!blob.startsWith("v1:")) return null;
    const [, ivb, tagb, encb] = blob.split(":");
    if (!ivb || !tagb || !encb) return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivb, "base64"));
    decipher.setAuthTag(Buffer.from(tagb, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(encb, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function encryptVaultText(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", activeKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptVaultTextWithSource(blob: string): { plain: string; source: "active" | "legacy" } | null {
  const active = decryptWithKey(blob, activeKey());
  if (active !== null) return { plain: active, source: "active" };
  return null;
}

export function decryptVaultText(blob: string): string | null {
  return decryptVaultTextWithSource(blob)?.plain || null;
}

export function vaultCryptoStatus(): { dedicatedConfigured: boolean; legacyFallbackEnabled: boolean } {
  const dedicatedConfigured = Boolean(dedicatedSecret());
  return { dedicatedConfigured, legacyFallbackEnabled: false };
}
