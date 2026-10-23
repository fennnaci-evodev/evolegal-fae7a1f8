export const CONTRACT_MESSAGE_LIMIT = 30_000;
export const CONTRACT_AUDIT_PREFIX = "Audit this contract for liability, indemnity, termination and non-standard terms:\n\n";

export function prepareContractAttachment(text: string): string {
  if (!text.trim()) throw new Error("This file is empty. Attach a text contract.");
  const message = CONTRACT_AUDIT_PREFIX + text;
  if (message.length > CONTRACT_MESSAGE_LIMIT) throw new Error("Contract too long — up to 30,000 characters including the audit request.");
  return message;
}

export function contractDocumentText(text: string): string {
  return text.startsWith(CONTRACT_AUDIT_PREFIX) ? text.slice(CONTRACT_AUDIT_PREFIX.length) : text;
}