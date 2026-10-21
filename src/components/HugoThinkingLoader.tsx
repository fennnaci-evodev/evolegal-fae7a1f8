import "./HugoThinkingLoader.css";

/** Hugo's neural ring orbit: twin rings + core, CSS transform/opacity only. */
export function HugoThinkingLoader({ size = 28 }: { size?: number }) {
  return (
    <span className="hugo-orbit" style={{ width: size, height: size }} aria-hidden="true">
      <span className="hugo-orbit__ring hugo-orbit__ring--cyan" />
      <span className="hugo-orbit__ring hugo-orbit__ring--violet" />
      <span className="hugo-orbit__core" />
    </span>
  );
}
