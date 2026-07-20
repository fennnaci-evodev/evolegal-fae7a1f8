import { forwardRef } from "react";

// ─────────────────────────────────────────────────────────────────────
// Sealed document layout. This component is the single source of truth
// for the visual rendering of every generated EvoLegal document.
// The AI never touches layout — it only supplies the JSON payload below.
// ─────────────────────────────────────────────────────────────────────

export interface DocumentSection {
  sectionTitle: string;
  sectionContent: string;
}

export interface DocumentMetadata {
  documentType: string;
  topic: string;
  preparedBy: string;
  date: string;
  disclaimer: string;
}

export interface DocumentPayload {
  documentTitle: string;
  introduction: string;
  sections: DocumentSection[];
  metadata: DocumentMetadata;
}

interface Props {
  payload: DocumentPayload;
  /** Render in a print-friendly light theme regardless of app theme. */
  forPrint?: boolean;
}

// Hardcoded inline SVG of the EvoLegal "E" — sleek stroke, -33° rotation,
// electric-cyan neon glow. Sealed here so no other code can alter it.
function EvoLogoSVG({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <filter id="evo-doc-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform="rotate(-33 50 50)" filter="url(#evo-doc-glow)">
        <rect x="26" y="20" width="9" height="60" fill="#00e5ff" />
        <rect x="26" y="20" width="42" height="9" fill="#00e5ff" />
        <rect x="26" y="45.5" width="30" height="9" fill="#00e5ff" />
        <rect x="26" y="71" width="42" height="9" fill="#00e5ff" />
      </g>
    </svg>
  );
}

function splitParagraphs(text: string): string[] {
  return String(text || "")
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export const DocumentTemplate = forwardRef<HTMLDivElement, Props>(
  ({ payload, forPrint = false }, ref) => {
    const { documentTitle, introduction, sections, metadata } = payload;
    const paletteBg = forPrint ? "#ffffff" : "#ffffff";
    const paletteText = "#111827";
    const paletteMuted = "#4b5563";
    const paletteAccent = "#00b8d4";
    const paletteRule = "#e5e7eb";

    return (
      <div
        ref={ref}
        data-evolegal-document
        style={{
          width: 794, // ~ A4 @ 96dpi
          minHeight: 1123,
          background: paletteBg,
          color: paletteText,
          fontFamily:
            '"Space Grotesk", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          padding: "56px 64px 72px 64px",
          boxSizing: "border-box",
          lineHeight: 1.55,
          fontSize: 12.5,
          letterSpacing: 0.005,
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <header
          data-evolegal-block="header"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingBottom: 18,
            borderBottom: `1px solid ${paletteRule}`,
            marginBottom: 28,
            breakInside: "avoid",
            pageBreakInside: "avoid",
            breakAfter: "avoid",
            pageBreakAfter: "avoid",
          }}
        >
          <EvoLogoSVG size={44} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: -0.4,
                color: paletteText,
              }}
            >
              EvoLegal
            </span>
            <span
              style={{
                marginTop: 4,
                fontSize: 10,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: paletteMuted,
              }}
            >
              {metadata.documentType}
            </span>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right", fontSize: 10, color: paletteMuted }}>
            <div style={{ letterSpacing: 1.2, textTransform: "uppercase" }}>Prepared</div>
            <div style={{ marginTop: 2, color: paletteText, fontWeight: 600 }}>{metadata.date}</div>
          </div>
        </header>

        {/* ── Title ─────────────────────────────────────────────── */}
        <div
          data-evolegal-block="title"
          style={{
            breakInside: "avoid",
            pageBreakInside: "avoid",
            breakAfter: "avoid",
            pageBreakAfter: "avoid",
          }}
        >
          <h1
            style={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: -0.6,
              margin: 0,
              color: paletteText,
            }}
          >
            {documentTitle}
          </h1>
          <div
            style={{
              marginTop: 10,
              width: 56,
              height: 3,
              background: paletteAccent,
              borderRadius: 2,
            }}
          />
        </div>

        {/* ── Introduction ──────────────────────────────────────── */}
        <section style={{ marginTop: 24 }}>
          {splitParagraphs(introduction).map((p, i) => (
            <p
              key={`intro-${i}`}
              data-evolegal-block="paragraph"
              style={{
                margin: "0 0 12px 0",
                color: paletteText,
                fontSize: 12.5,
                breakInside: "auto",
                pageBreakInside: "auto",
                orphans: 2,
                widows: 2,
              }}
            >
              {p}
            </p>
          ))}
        </section>

        {/* ── Sections ──────────────────────────────────────────── */}
        {sections.map((s, i) => {
          const paras = splitParagraphs(s.sectionContent);
          return (
            <section key={`sec-${i}`} style={{ marginTop: 26 }}>
              <div
                data-evolegal-block="section-heading"
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  marginBottom: 8,
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                  pageBreakAfter: "avoid",
                  breakAfter: "avoid",
                }}
              >
                <span
                  style={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontSize: 10,
                    fontWeight: 700,
                    color: paletteAccent,
                    letterSpacing: 1.2,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2
                  style={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: -0.2,
                    margin: 0,
                    color: paletteText,
                    breakAfter: "avoid",
                    pageBreakAfter: "avoid",
                  }}
                >
                  {s.sectionTitle}
                </h2>
              </div>
              <div style={{ borderLeft: `2px solid ${paletteRule}`, paddingLeft: 14 }}>
                {paras.map((p, j) => (
                  <p
                    key={`sec-${i}-p-${j}`}
                    data-evolegal-block="paragraph"
                    style={{
                      margin: "0 0 12px 0",
                      color: paletteText,
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      breakInside: "auto",
                      pageBreakInside: "auto",
                      orphans: 2,
                      widows: 2,
                    }}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>
          );
        })}

        {/* ── Footer ────────────────────────────────────────────── */}
        <footer
          data-evolegal-block="footer"
          style={{
            marginTop: 40,
            paddingTop: 16,
            borderTop: `1px solid ${paletteRule}`,
            fontSize: 9.5,
            color: paletteMuted,
            lineHeight: 1.5,
            breakInside: "avoid",
            pageBreakInside: "avoid",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: paletteText }}>{metadata.preparedBy}</span>
            <span>{metadata.date}</span>
          </div>
          <p style={{ margin: 0 }}>{metadata.disclaimer}</p>
        </footer>
      </div>
    );
  },
);


DocumentTemplate.displayName = "DocumentTemplate";
