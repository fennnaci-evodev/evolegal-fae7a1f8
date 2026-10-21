import "./HugoThinkingLoader.css";

/** Hugo's continuous ribbon signature. No image download or animation loop in JS. */
export function HugoThinkingLoader({ size = 28 }: { size?: number }) {
  return (
    <span className="hugo-thinking-loader" style={{ width: size, height: size }} aria-hidden="true">
      <svg className="hugo-thinking-loader__ribbon" viewBox="0 0 48 48">
        <path d="M24 5C35 5 43 13 43 24S35 43 24 43C13 43 7 35 7 24S13 5 24 5Z" />
        <path d="M24 5C17 5 5 13 5 24S17 43 24 43" opacity="0.3" />
      </svg>
      <svg className="hugo-thinking-loader__ribbon hugo-thinking-loader__ribbon--echo" viewBox="0 0 48 48">
        <path d="M24 7C34 7 40 15 40 24S34 41 24 41C14 41 8 33 8 24S14 7 24 7Z" />
      </svg>
      <svg className="hugo-thinking-loader__signature" viewBox="0 0 48 48">
        <path d="M19 18V30M29 18V30M19 24H29" />
      </svg>
    </span>
  );
}