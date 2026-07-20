import { createRoot } from "react-dom/client";
import { createElement } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { DocumentTemplate, type DocumentPayload } from "@/components/DocumentTemplate";

/**
 * Renders the sealed DocumentTemplate off-screen, rasterizes it once, then
 * paginates by real block boundaries (headers, paragraphs, sections, footer)
 * so no line of text is ever sliced across a page break.
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

    // Collect block rects (in CSS px, relative to the document node) BEFORE rasterizing.
    const rootRect = node.getBoundingClientRect();
    const blockEls = Array.from(
      node.querySelectorAll<HTMLElement>("[data-evolegal-block]"),
    );
    type Block = { top: number; bottom: number; keepWithNext: boolean };
    const blocks: Block[] = blockEls.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        top: r.top - rootRect.top,
        bottom: r.bottom - rootRect.top,
        keepWithNext: el.dataset.evolegalKeepWithNext === "true",
      };
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

    // Map CSS px (the DOM node's coordinate space) into PDF pt.
    const cssWidthPx = node.getBoundingClientRect().width;
    const cssToPt = pageW / cssWidthPx;
    const pageHpxCss = pageH / cssToPt; // page height expressed in CSS px
    const totalHpxCss = rootRect.height;

    // Compute break offsets (in CSS px) so that no block straddles a page.
    // A "keep with next" block is fused with the following block for placement.
    const breaks: number[] = [0];
    let cursor = 0; // top of current page in CSS px

    for (let i = 0; i < blocks.length; i++) {
      // Fuse consecutive keep-with-next blocks into a single logical unit
      let j = i;
      while (j < blocks.length - 1 && blocks[j].keepWithNext) j++;
      const unitTop = blocks[i].top;
      const unitBottom = blocks[j].bottom;
      const unitHeight = unitBottom - unitTop;

      // If unit doesn't fit on remaining space, start a new page at unitTop.
      const remaining = cursor + pageHpxCss - unitTop;
      if (unitHeight > remaining && unitTop > cursor + 1) {
        // Only push if unit itself fits on a full page; otherwise let it flow (oversized).
        if (unitHeight <= pageHpxCss) {
          breaks.push(unitTop);
          cursor = unitTop;
        }
      }
      i = j; // skip fused blocks
    }
    breaks.push(totalHpxCss);

    // Deduplicate & sort
    const uniqueBreaks = Array.from(new Set(breaks.map((v) => Math.round(v)))).sort(
      (a, b) => a - b,
    );

    // Rasterize each page slice from the master canvas.
    const canvasScale = canvas.width / cssWidthPx; // px per CSS px
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
      const imgW = pageW;
      const imgH = sliceHeightCss * cssToPt;
      pdf.addImage(dataUrl, "JPEG", 0, 0, imgW, imgH);
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
