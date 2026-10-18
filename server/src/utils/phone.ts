/**
 * Phone number normalization and validation for AmpShare.
 * Normalizes phone numbers to standard E.164 format (e.g., +251911234567).
 */

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Normalizes a phone number to standard E.164 format.
 * - Strips all spaces, dashes, parentheses, and dots.
 * - If starting with '09' or '07' (common Ethiopian prefixes), replaces leading '0' with '+251'.
 * - If starting with '251', prepends '+'.
 * - If already starting with '+', keeps it.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== "string") {
    return "";
  }

  // Remove whitespace and formatting characters
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]/g, "");

  // Convert Ethiopian local format (e.g., 0911234567 or 0712345678)
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = `+251${cleaned.slice(1)}`;
  } else if (cleaned.startsWith("251") && !cleaned.startsWith("+")) {
    cleaned = `+${cleaned}`;
  }

  return cleaned;
}

/**
 * Checks whether the phone number is valid E.164 format and fits within DB column length (<= 20 chars).
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || phone.length > 20) {
    return false;
  }
  const normalized = normalizePhoneNumber(phone);
  return E164_REGEX.test(normalized) && normalized.length <= 20;
}
