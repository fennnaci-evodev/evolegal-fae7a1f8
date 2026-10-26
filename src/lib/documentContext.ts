/** The document generator only uses this supplemental excerpt, not the full chat. */
export function documentContextExcerpt(context?: string): string | undefined {
  return context?.slice(0, 4000);
}