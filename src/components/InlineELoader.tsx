import { HugoThinkingLoader } from "@/components/HugoThinkingLoader";

/**
 * Small inline loader for buttons, cards and chat states.
 * Uses Hugo's lightweight continuous ribbon; existing sizes stay unchanged.
 */
export function InlineELoader({ size = 28 }: { size?: number }) {
  return <HugoThinkingLoader size={size} />;
}
