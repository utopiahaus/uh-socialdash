import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32 // 32 bytes for AES-256
const IV_LENGTH = 16 // 16 bytes for IV
const AUTH_TAG_LENGTH = 16 // 16 bytes for auth tag

/**
 * Get encryption key from environment variable
 * Throws an error if the key is not set or invalid
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
        "Generate one with: openssl rand -base64 32"
    )
  }

  // Convert base64 key to buffer
  const keyBuffer = Buffer.from(key, "base64")

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (base64 encoded). ` +
        `Current length: ${keyBuffer.length} bytes. ` +
        `Generate a valid key with: openssl rand -base64 32`
    )
  }

  return keyBuffer
}

/**
 * Encrypts plaintext using AES-256-GCM
 * @param plaintext - Text to encrypt
 * @returns Base64 encoded string with format: iv:authTag:encrypted
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty string")
  }

  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  // Return format: iv:authTag:encrypted (all in hex)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
}

/**
 * Decrypts ciphertext that was encrypted with encrypt()
 * @param ciphertext - Base64 encoded string with format: iv:authTag:encrypted
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error("Cannot decrypt empty string")
  }

  const parts = ciphertext.split(":")
  if (parts.length !== 3) {
    throw new Error(
      "Invalid ciphertext format. Expected: iv:authTag:encrypted"
    )
  }

  const [ivHex, authTagHex, encryptedText] = parts

  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedText, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Validates if a string is properly encrypted
 * @param ciphertext - String to validate
 * @returns true if format is valid
 */
export function isValidEncryptedFormat(ciphertext: string): boolean {
  if (!ciphertext) return false

  const parts = ciphertext.split(":")
  if (parts.length !== 3) return false

  const [ivHex, authTagHex] = parts

  // IV should be 32 hex chars (16 bytes)
  // Auth tag should be 32 hex chars (16 bytes)
  return (
    ivHex.length === IV_LENGTH * 2 &&
    authTagHex.length === AUTH_TAG_LENGTH * 2 &&
    /^[0-9a-fA-F]+$/.test(ivHex) &&
    /^[0-9a-fA-F]+$/.test(authTagHex)
  )
}
