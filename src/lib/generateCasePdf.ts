import jsPDF from "jspdf";

interface ChatMessage {
  sender_role: string;
  content: string;
  created_at: string;
}

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
  ticketNumber?: string;
  assignedExpert?: string;
  chatHistory?: ChatMessage[];
}

export function generateCasePdf(data: CasePdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = w - margin * 2;
  let y = 20;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageH - 25) {
      addFooter();
      doc.addPage();
      y = 20;
    }
  };

  const addFooter = () => {
    doc.setDrawColor(0, 220, 255);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 20, w - margin, pageH - 20);
    doc.setFontSize(7);
    doc.setTextColor(140, 150, 165);
    doc.text("This document contains general legal information only and does not constitute legal advice.", margin, pageH - 15);
    const ticketLabel = data.ticketNumber || data.requestId.slice(0, 8).toUpperCase();
    doc.text(`${ticketLabel} · Generated ${new Date().toLocaleDateString()}`, margin, pageH - 10);
    doc.text("EvoLegal — Confidential", w - margin, pageH - 10, { align: "right" });
  };

  // --- Dark header band ---
  doc.setFillColor(12, 15, 25);
  doc.rect(0, 0, w, 52, "F");

  // Cyan accent line
  doc.setDrawColor(0, 220, 255);
  doc.setLineWidth(0.8);
  doc.line(margin, 48, w - margin, 48);

  // Draw solid filled slanted "E" logo (rotated -28°, neon cyan, geometric)
  const logoCx = margin + 8;
  const logoCy = 28;
  const eW = 14;
  const eH = 20;
  const barH = 4;
  const stemW = 5;
  const midW = 11;
  const angle = -28 * (Math.PI / 180);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  // Local coordinates centered on the logo
  const localPts: [number, number][] = [
    [-eW / 2, -eH / 2], [eW / 2, -eH / 2], [eW / 2, -eH / 2 + barH],
    [-eW / 2 + stemW, -eH / 2 + barH], [-eW / 2 + stemW, -barH / 2],
    [-eW / 2 + midW, -barH / 2], [-eW / 2 + midW, barH / 2],
    [-eW / 2 + stemW, barH / 2], [-eW / 2 + stemW, eH / 2 - barH],
    [eW / 2, eH / 2 - barH], [eW / 2, eH / 2], [-eW / 2, eH / 2],
  ];
  const worldPts = localPts.map(([px, py]) => [
    logoCx + cosA * px - sinA * py,
    logoCy + sinA * px + cosA * py,
  ] as [number, number]);
  // Soft neon glow: draw slightly larger, lower-alpha halo via wider stroke
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(1.6);
  const gs = (doc as any).GState ? new (doc as any).GState({ opacity: 0.35 }) : null;
  if (gs) (doc as any).setGState(gs);
  for (let i = 0; i < worldPts.length; i++) {
    const [x1, y1] = worldPts[i];
    const [x2, y2] = worldPts[(i + 1) % worldPts.length];
    doc.line(x1, y1, x2, y2);
  }
  const gs2 = (doc as any).GState ? new (doc as any).GState({ opacity: 1 }) : null;
  if (gs2) (doc as any).setGState(gs2);
  // Solid cyan fill via polygon
  doc.setFillColor(0, 229, 255);
  const linesArr: [number, number][] = [];
  for (let i = 1; i < worldPts.length; i++) {
    linesArr.push([worldPts[i][0] - worldPts[i - 1][0], worldPts[i][1] - worldPts[i - 1][1]]);
  }
  linesArr.push([worldPts[0][0] - worldPts[worldPts.length - 1][0], worldPts[0][1] - worldPts[worldPts.length - 1][1]]);
  (doc as any).lines(linesArr, worldPts[0][0], worldPts[0][1], [1, 1], "F", true);

  // Brand name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("EvoLegal", margin + 22, 32);

  // Subtitle
  doc.setFontSize(9);
  doc.setTextColor(160, 170, 190);
  doc.text("Case Summary Report", margin + 22, 40);

  // Prepared label (right)
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 150);
  doc.text("Prepared by EvoLegal Experts", w - margin, 46, { align: "right" });

  y = 60;

  // --- Body helpers ---
  const sectionTitle = (label: string) => {
    checkPageBreak(14);
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
    const lines: string[] = doc.splitTextToSize(text || "N/A", contentW);
    for (const line of lines) {
      checkPageBreak(6);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 4;
  };

  const metaRow = (label: string, value: string) => {
    checkPageBreak(7);
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
  if (data.ticketNumber) metaRow("Ticket", data.ticketNumber);
  metaRow("Request ID", data.requestId.slice(0, 8).toUpperCase());
  metaRow("Topic", data.topic);
  metaRow("Status", data.status.charAt(0).toUpperCase() + data.status.slice(1));
  if (data.state) metaRow("Jurisdiction", data.state);
  if (data.assignedExpert) metaRow("Expert", data.assignedExpert);
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
      if (val) metaRow(key, String(val));
    });
    y += 2;
  }

  // Expert response
  if (data.adminResponse && data.adminResponse.trim()) {
    sectionTitle("Expert Analysis");
    bodyText(data.adminResponse);
  }

  // Chat history
  if (data.chatHistory && data.chatHistory.length > 0) {
    sectionTitle("Conversation History");
    for (const msg of data.chatHistory) {
      checkPageBreak(12);
      const roleName = msg.sender_role === "admin" ? "Expert" : msg.sender_role === "hugo" ? "Hugo (AI)" : "User";
      const time = new Date(msg.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(msg.sender_role === "admin" ? 0 : msg.sender_role === "hugo" ? 0 : 80, msg.sender_role === "admin" ? 130 : msg.sender_role === "hugo" ? 180 : 85, msg.sender_role === "admin" ? 180 : msg.sender_role === "hugo" ? 220 : 95);
      doc.text(`${roleName} — ${time}`, margin, y);
      y += 4;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 55, 65);
      const msgLines: string[] = doc.splitTextToSize(msg.content, contentW - 5);
      for (const line of msgLines) {
        checkPageBreak(5);
        doc.text(line, margin + 3, y);
        y += 4.5;
      }
      y += 3;
    }
  }

  // Watermark on first page
  doc.setPage(1);
  doc.setFontSize(50);
  doc.setTextColor(230, 235, 240);
  doc.text("EVOLEGAL", w / 2, pageH / 2, { align: "center", angle: 45 });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter();
  }

  const ticketLabel = data.ticketNumber || data.requestId.slice(0, 8).toUpperCase();
  doc.save(`EvoLegal_Case_${ticketLabel.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`);
}
