import { createRoot } from "react-dom/client";
import { createElement } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { DocumentTemplate, type DocumentPayload } from "@/components/DocumentTemplate";

/**
 * Renders the sealed DocumentTemplate off-screen, rasterizes it, and
 * compiles a paginated A4 PDF. The AI never touches this pipeline.
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
      // Give the browser two frames to layout + paint.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const node = host.querySelector("[data-evolegal-document]") as HTMLElement | null;
    if (!node) throw new Error("DocumentTemplate did not mount");

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

    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let remaining = imgH;
    let position = 0;

    // Single-shot if it fits on one page
    if (imgH <= pageH) {
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, imgW, imgH);
    } else {
      // Slice the rendered canvas into page-sized chunks
      const pxPerPt = canvas.width / pageW;
      const pageHpx = pageH * pxPerPt;
      let sy = 0;
      while (sy < canvas.height) {
        const sliceH = Math.min(pageHpx, canvas.height - sy);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceH;
        const ctx = slice.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, sy, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const dataUrl = slice.toDataURL("image/jpeg", 0.95);
        if (sy > 0) pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, 0, imgW, (sliceH / pxPerPt));
        sy += sliceH;
      }
      // Suppress unused vars for lint
      void remaining; void position;
    }

    return pdf.output("blob");
  } finally {
    try { root.unmount(); } catch { /* noop */ }
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
