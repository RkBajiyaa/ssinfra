/**
 * Normalises a phone number typed by a visitor into E.164.
 *
 * Accepted:
 *  - Indian mobiles: 10 digits starting 6–9, optionally prefixed by 0, 91 or +91
 *  - International numbers written with a leading "+" (or "00"), 8–15 digits
 *
 * Returns null when the input can't be confidently interpreted, so the form
 * can ask the visitor to check it instead of storing something uncallable.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Allow common separators only; anything else (letters etc.) is rejected.
  if (!/^[+\d\s().-]+$/.test(trimmed)) return null;

  let digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;

  if (digits.startsWith("+")) {
    const rest = digits.slice(1);
    if (!/^\d+$/.test(rest)) return null;
    if (rest.startsWith("91")) return indian(rest.slice(2));
    if (rest.length < 8 || rest.length > 15 || rest.startsWith("0")) return null;
    return `+${rest}`;
  }

  if (!/^\d+$/.test(digits)) return null;
  if (digits.length === 10) return indian(digits);
  if (digits.length === 11 && digits.startsWith("0")) return indian(digits.slice(1));
  if (digits.length === 12 && digits.startsWith("91")) return indian(digits.slice(2));
  return null;
}

function indian(national: string): string | null {
  return /^[6-9]\d{9}$/.test(national) ? `+91${national}` : null;
}

/** "+919672567423" -> "+91 96725 67423" for display in the admin. */
export function formatPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

/** wa.me expects digits only, country code included, no "+". */
export function whatsappDigits(e164: string): string {
  return e164.replace(/^\+/, "");
}
