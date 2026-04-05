import jsPDF from "jspdf";

interface CasePdfData {
  requestId: string;
  title: string;
  topic: string;
  description: string;
  status: string;
  state?: string;
  facts?: Record<string, any> | null;
  adminResponse?: string;
  createdAt: string;
  respondedAt?: string | null;
}

export function generateCasePdf(data: CasePdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = w - margin * 2;
  let y = 20;

  // --- Dark header band ---
  doc.setFillColor(12, 15, 25);
  doc.rect(0, 0, w, 52, "F");

  // Cyan accent line
  doc.setDrawColor(0, 220, 255);
  doc.setLineWidth(0.8);
  doc.line(margin, 48, w - margin, 48);

  // "E" logo (simulated slanted text)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(0, 220, 255);
  doc.text("E", margin, 35);

  // Brand name
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("voLegal", margin + 16, 35);

  // Subtitle
  doc.setFontSize(9);
  doc.setTextColor(160, 170, 190);
  doc.text("Case Summary Report", margin, 44);

  // Prepared label (right)
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 150);
  doc.text("Prepared by EvoLegal Experts", w - margin, 44, { align: "right" });

  y = 60;

  // --- Body ---
  const sectionTitle = (label: string) => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 180, 220);
    doc.text(label, margin, y);
    y += 2;
    doc.setDrawColor(0, 180, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + 40, y);
    y += 6;
  };

  const bodyText = (text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 55, 65);
    const lines = doc.splitTextToSize(text || "N/A", contentW);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  };

  const metaRow = (label: string, value: string) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 85, 95);
    doc.text(label + ":", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 55, 65);
    doc.text(value, margin + 35, y);
    y += 6;
  };

  // Meta info
  sectionTitle("Request Details");
  metaRow("Request ID", data.requestId.slice(0, 8).toUpperCase());
  metaRow("Topic", data.topic);
  metaRow("Status", data.status.charAt(0).toUpperCase() + data.status.slice(1));
  if (data.state) metaRow("Jurisdiction", data.state);
  metaRow("Submitted", new Date(data.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  if (data.respondedAt) metaRow("Responded", new Date(data.respondedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
  y += 4;

  // Case title
  if (data.title) {
    sectionTitle("Case Title");
    bodyText(data.title);
  }

  // Description
  sectionTitle("Case Description");
  bodyText(data.description);

  // Facts
  if (data.facts && typeof data.facts === "object" && Object.keys(data.facts).length > 0) {
    sectionTitle("Key Facts");
    Object.entries(data.facts).forEach(([key, val]) => {
      if (val) {
        metaRow(key, String(val));
      }
    });
    y += 2;
  }

  // Expert response
  if (data.adminResponse && data.adminResponse.trim()) {
    sectionTitle("Expert Analysis");
    bodyText(data.adminResponse);
  }

  // --- Footer ---
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(0, 220, 255);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 20, w - margin, pageH - 20);
  doc.setFontSize(7);
  doc.setTextColor(140, 150, 165);
  doc.text("This document contains general legal information only and does not constitute legal advice.", margin, pageH - 15);
  doc.text(`Request ${data.requestId.slice(0, 8).toUpperCase()} · Generated ${new Date().toLocaleDateString()}`, margin, pageH - 10);
  doc.text("EvoLegal — Confidential", w - margin, pageH - 10, { align: "right" });

  // Watermark
  doc.setFontSize(50);
  doc.setTextColor(230, 235, 240);
  doc.text("EVOLEGAL", w / 2, pageH / 2, { align: "center", angle: 45 });

  doc.save(`EvoLegal_Case_${data.requestId.slice(0, 8).toUpperCase()}.pdf`);
}
