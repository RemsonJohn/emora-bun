import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

/**
 * Encrypts shop secrets at rest with AES-256-GCM. The key is PLATFORM_SECRETS_KEY
 * (64 hex characters) from the platform's environment, never the database.
 */
function key() {
  const hex = process.env.PLATFORM_SECRETS_KEY ?? ""
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error("PLATFORM_SECRETS_KEY must be 64 hex characters")
  return Buffer.from(hex, "hex")
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".")
}

export function decryptSecret(stored: string) {
  const [version, iv, tag, data] = stored.split(".")
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unknown secret format")
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"))
  decipher.setAuthTag(Buffer.from(tag, "base64"))
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8")
}
