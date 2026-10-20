/**
 * Phone number normalization and validation for AmpShare.
 * Compatible with backend E.164 normalization.
 */

export function normalizeEthiopianPhone(rawPhone: string): string {
  if (!rawPhone) return "";

  // Strip whitespace, dashes, parentheses, dots
  const cleaned = rawPhone.trim().replace(/[\s\-().]/g, "");

  // If starts with 09... or 07... (10 digits)
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `+251${cleaned.slice(1)}`;
  }

  // If user only entered 9 digits starting with 9 or 7 (e.g. 912345678)
  if ((cleaned.startsWith("9") || cleaned.startsWith("7")) && cleaned.length === 9) {
    return `+251${cleaned}`;
  }

  // If starts with 251 without +
  if (cleaned.startsWith("251") && !cleaned.startsWith("+")) {
    return `+${cleaned}`;
  }

  // If already starts with +
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // Default fallback prepending +251 if reasonable length
  return `+251${cleaned}`;
}

export function isValidEthiopianPhone(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizeEthiopianPhone(phone);
  // Ethiopian mobile numbers in E.164: +251 followed by 9 or 7 and 8 more digits
  const ethiopianMobileRegex = /^\+251[79]\d{8}$/;
  // General E.164 fallback
  const generalE164Regex = /^\+[1-9]\d{6,14}$/;

  return ethiopianMobileRegex.test(normalized) || generalE164Regex.test(normalized);
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
