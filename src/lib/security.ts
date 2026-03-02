/**
 * Client-side security utilities for EvoLegal.
 * Defence-in-depth: these complement server-side protections.
 */

/* ---------- Input sanitization ---------- */

/** Strip HTML tags and escape special characters to prevent XSS */
export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/** Validate and constrain text input length */
export function validateTextLength(
  input: string,
  maxLength: number,
  fieldName: string
): { valid: boolean; error?: string } {
  const trimmed = input.trim();
  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be ${maxLength} characters or fewer.` };
  }
  return { valid: true };
}

/* ---------- File upload validation ---------- */

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png", ".webp",
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  // Size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `"${file.name}" exceeds the 15 MB limit.` };
  }

  // Extension check
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `"${file.name}" has an unsupported file type. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, WEBP.`,
    };
  }

  // MIME type check
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `"${file.name}" has an unrecognised content type. Please use a standard document or image format.`,
    };
  }

  return { valid: true };
}

/** Sanitize a filename: strip special chars, add UUID prefix */
export function sanitizeFilename(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "bin";
  const base = name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 60);
  const id = crypto.randomUUID().slice(0, 8);
  return `${id}_${base}.${ext}`;
}

/* ---------- Password strength ---------- */

export interface PasswordCheck {
  strong: boolean;
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordCheck {
  const feedback: string[] = [];
  if (password.length < 8) feedback.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) feedback.push("At least one uppercase letter");
  if (!/[a-z]/.test(password)) feedback.push("At least one lowercase letter");
  if (!/[0-9]/.test(password)) feedback.push("At least one number");
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push("At least one special character");
  return { strong: feedback.length === 0, feedback };
}

/* ---------- Rate limiting (client-side throttle) ---------- */

const actionTimestamps: Record<string, number[]> = {};

/**
 * Simple client-side rate limiter.
 * Returns true if the action is allowed, false if throttled.
 */
export function isRateLimited(
  actionKey: string,
  maxAttempts: number = 10,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  if (!actionTimestamps[actionKey]) actionTimestamps[actionKey] = [];
  // Prune old entries
  actionTimestamps[actionKey] = actionTimestamps[actionKey].filter(
    (t) => now - t < windowMs
  );
  if (actionTimestamps[actionKey].length >= maxAttempts) {
    return true; // rate limited
  }
  actionTimestamps[actionKey].push(now);
  return false;
}
