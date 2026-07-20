import { createRoot } from "react-dom/client";
import { createElement } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { DocumentTemplate, type DocumentPayload } from "@/components/DocumentTemplate";

/**
 * Renders the sealed DocumentTemplate off-screen, rasterizes it once, then
 * paginates strictly at block boundaries. Paragraphs/list-like text blocks are
 * protected as atomic units so page seams never slice through a line of text.
 * Uniform 20mm top/bottom/side margins.
 */
export async function exportDocumentPdf(payload: DocumentPayload): Promise<Blob> {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-100000px";
  host.style.top = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";
  host.style.background = "#ffffff";
  document.body.appendChild(host);

  const root = createRoot(host);

  try {
    await new Promise<void>((resolve) => {
      root.render(createElement(DocumentTemplate, { payload, forPrint: true }));
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const node = host.querySelector("[data-evolegal-document]") as HTMLElement | null;
    if (!node) throw new Error("DocumentTemplate did not mount");

    const rootRect = node.getBoundingClientRect();
    const blockEls = Array.from(
      node.querySelectorAll<HTMLElement>("[data-evolegal-block]"),
    );

    type Unit = { top: number; bottom: number; gluedToNext: boolean };

    const units: Unit[] = blockEls.map((el) => {
      const r = el.getBoundingClientRect();
      const top = r.top - rootRect.top;
      const bottom = r.bottom - rootRect.top;
      const kind = el.dataset.evolegalBlock;

      // Section headings must stay with the paragraph that follows.
      const gluedToNext = kind === "section-heading" || kind === "title" || kind === "header";
      return { top, bottom, gluedToNext };
    });

    const canvas = await html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });

    const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Uniform 20mm safety margins top/bottom, 20mm sides.
    const MM = 2.83465;
    const marginTop = 20 * MM;
    const marginBottom = 20 * MM;
    const marginLeft = 20 * MM;
    const marginRight = 20 * MM;
    const usableW = pageW - marginLeft - marginRight;
    const usableH = pageH - marginTop - marginBottom;

    const cssWidthPx = rootRect.width;
    const cssToPt = usableW / cssWidthPx;
    const pageHpxCss = usableH / cssToPt;
    const totalHpxCss = rootRect.height;

    // Compute break points (CSS px) at block boundaries with heading glue.
    const breaks: number[] = [0];
    let cursor = 0;

    const pageBottomAllowed = () => cursor + pageHpxCss;

    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      const limit = pageBottomAllowed();
      if (u.bottom <= limit) continue; // fits on current page

      // Push to next page, honoring heading→next glue and paragraph boundaries.
      let start = i;
      // If we're pushing an atomic that is glued-from-previous, walk back.
      while (start > 0) {
        const prev = units[start - 1];
        if (prev.gluedToNext && prev.bottom > cursor) start--;
        else break;
      }
      const pushTop = units[start].top;
      if (pushTop > cursor + 1) {
        breaks.push(pushTop);
        cursor = pushTop;
      }
      i = start - 1; // continue loop from `start`
    }
    breaks.push(totalHpxCss);

    const uniqueBreaks = Array.from(new Set(breaks.map((v) => Math.round(v)))).sort(
      (a, b) => a - b,
    );

    const canvasScale = canvas.width / cssWidthPx;
    for (let p = 0; p < uniqueBreaks.length - 1; p++) {
      const topCss = uniqueBreaks[p];
      const nextCss = uniqueBreaks[p + 1];
      const sliceHeightCss = Math.min(nextCss - topCss, pageHpxCss);
      if (sliceHeightCss <= 0) continue;

      const sy = Math.round(topCss * canvasScale);
      const sh = Math.round(sliceHeightCss * canvasScale);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sh;
      const ctx = slice.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);

      const dataUrl = slice.toDataURL("image/jpeg", 0.95);
      if (p > 0) pdf.addPage();
      const imgH = sliceHeightCss * cssToPt;
      pdf.addImage(dataUrl, "JPEG", marginLeft, marginTop, usableW, imgH);
    }

    return pdf.output("blob");
  } finally {
    try {
      root.unmount();
    } catch {
      /* noop */
    }
    if (host.parentNode) host.parentNode.removeChild(host);
  }
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
