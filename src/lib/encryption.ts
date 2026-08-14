/**
 * VIVEXA SECURE SHIELD - CRYPTOGRAPHIC FIELD-LEVEL ENCRYPTION SERVICE
 * Production-ready zero-trust end-to-end cryptographic wrapper
 * Enforces AES-GCM-256 encryption using standard browser/runtime subtle crypto
 */

const KEY_DERIVATION_SALT = "VIVEXA_ENTERPRISE_SHIELD_SALT_2026";

/**
 * Derives a cryptographically strong, symmetric 256-bit AES key from a secret and salt
 */
async function deriveCryptographicKey(userSecret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  // Mix userSecret with our global salt to prevent precomputation attacks
  const rawKeyMaterial = encoder.encode(userSecret + KEY_DERIVATION_SALT);

  // Hash the composite key material to 256 bits (32 bytes)
  const keyDigest = await crypto.subtle.digest("SHA-256", rawKeyMaterial);

  return await crypto.subtle.importKey(
    "raw",
    keyDigest,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a cleartext string using AES-GCM-256
 * Returns a composite hex string containing: IV (12 bytes/24 chars hex) + Ciphertext + Auth Tag
 */
export async function encryptField(cleartext: string, userSecret: string): Promise<string> {
  if (!cleartext) return "";
  try {
    const key = await deriveCryptographicKey(userSecret);
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(cleartext);

    // Create a unique, cryptographically random 12-byte Initialization Vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128 // Enforce standard 128-bit integrity tag
      },
      key,
      encodedData
    );

    // Assemble IV and Ciphertext buffer into a single stream
    const combinedBytes = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combinedBytes.set(iv, 0);
    combinedBytes.set(new Uint8Array(encryptedBuffer), iv.length);

    // Encode to hex for clean varchar/text storage in Postgres
    return Array.from(combinedBytes)
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch (err) {
    console.error("[Vivexa Encryption] Field-level encryption failed:", err);
    throw new Error("Cryptographic field encryption failure");
  }
}

/**
 * Decrypts a hex-encoded cipher string using AES-GCM-256
 * Re-authenticates integrity tags and restores cleartext
 */
export async function decryptField(ciphertextHex: string, userSecret: string): Promise<string> {
  if (!ciphertextHex) return "";
  try {
    const key = await deriveCryptographicKey(userSecret);

    // Parse the hex cipher back into raw bytes
    const matchedBytes = ciphertextHex.match(/.{1,2}/g);
    if (!matchedBytes) throw new Error("Invalid hex cipher format");
    const combinedBytes = new Uint8Array(matchedBytes.map(byte => parseInt(byte, 16)));

    if (combinedBytes.length < 13) {
      throw new Error("Ciphertext too short to contain IV and payload");
    }

    // Extract the original 12-byte IV and ciphertext block
    const iv = combinedBytes.slice(0, 12);
    const encryptedPayload = combinedBytes.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128
      },
      key,
      encryptedPayload
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error("[Vivexa Decryption] Field-level decryption failed:", err);
    return "[DECRYPTION_ERROR: Invalid cryptographic key or tampered payload]";
  }
}

/**
 * Checks if a string has been encrypted under Vivexa Cryptographic Shield
 * (Hex-encoded strings produced by AES-GCM in this layout have predictable structures)
 */
export function isFieldEncrypted(data: string): boolean {
  if (!data || data.length < 24) return false;
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(data);
}
