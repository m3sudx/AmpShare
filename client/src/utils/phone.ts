/**
 * Phone number normalization and validation for AmpShare.
 * Compatible with backend E.164 normalization.
 */

export function normalizeEthiopianPhone(rawPhone: string): string {
  if (!rawPhone) return "";

  // Strip whitespace, dashes, parentheses, dots
  const cleaned = rawPhone.trim().replace(/[\s\-().]/g, "");

  // If user entered +2510... or 2510... (strip the redundant leading 0 after country code)
  if (cleaned.startsWith("+2510") && cleaned.length === 14) {
    return `+251${cleaned.slice(5)}`;
  }
  if (cleaned.startsWith("2510") && cleaned.length === 13) {
    return `+251${cleaned.slice(4)}`;
  }

  // If starts with 09... or 07... (10 digits)
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `+251${cleaned.slice(1)}`;
  }

  // If user only entered 9 digits starting with 9 or 7 (e.g. 911234567)
  if ((cleaned.startsWith("9") || cleaned.startsWith("7")) && cleaned.length === 9) {
    return `+251${cleaned}`;
  }

  // If starts with 251 without + (12 digits, e.g. 251911234567)
  if (cleaned.startsWith("251") && !cleaned.startsWith("+")) {
    return `+${cleaned}`;
  }

  // If already starts with +
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // Default fallback prepending +251
  return `+251${cleaned}`;
}

export function isValidEthiopianPhone(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizeEthiopianPhone(phone);
  // Ethiopian mobile numbers in E.164: +251 followed by 9 or 7 and 8 more digits (13 chars total)
  const ethiopianMobileRegex = /^\+251[79]\d{8}$/;
  return ethiopianMobileRegex.test(normalized);
}

export function formatPhoneDisplay(phone?: string): string {
  if (!phone) return "";
  const normalized = normalizeEthiopianPhone(phone);
  if (normalized.startsWith("+251") && normalized.length === 13) {
    // +251 91 234 5678
    return `+251 ${normalized.slice(4, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`;
  }
  return normalized;
}

/**
 * Real-time input formatter for Ethiopian phone numbers inside form inputs.
 * Strips duplicate +251/251 prefixes and leading 0s, and adds spacing (XX XXX XXXX).
 */
export function formatEthiopianInput(rawInput: string): string {
  if (!rawInput) return "";

  let cleaned = rawInput.trim();

  // Strip duplicate country codes
  if (cleaned.startsWith("+2510")) {
    cleaned = cleaned.slice(5);
  } else if (cleaned.startsWith("+251")) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith("2510")) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith("251")) {
    cleaned = cleaned.slice(3);
  }

  // Remove non-digit characters
  let digits = cleaned.replace(/\D/g, "");

  // Convert 09... or 07... to 9... or 7...
  if (digits.startsWith("09") || digits.startsWith("07")) {
    digits = digits.slice(1);
  }

  // Cap at 9 digits
  digits = digits.slice(0, 9);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
}
