import { SphereLoader } from "@/components/SphereLoader";

/**
 * Small inline loader for buttons, cards and chat states.
 * Uses the hexagonal-globe animation; sizes match the previous inline loader.
 */
export function InlineELoader({ size = 28 }: { size?: number }) {
  return <SphereLoader size={size} />;
}
