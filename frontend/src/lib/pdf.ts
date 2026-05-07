import { jsPDF } from "jspdf";
import type { RoadmapData, RoadmapStage } from "@/types";
import { PROFESSION_LABELS, TIMELINE_LABELS, STATUS_LABELS } from "@/lib/constants";

interface PDFFormSnapshot {
  fullName?: string;
  age?: string;
  location?: string;
  currentStatus?: string;
  education?: string;
  university?: string;
  specialization?: string;
  yearsExperience?: string;
  currentRole?: string;
  targetProfession?: string;
  targetIndustry?: string;
  timeline?: string;
  technicalSkills?: string[];
  hoursPerWeek?: number;
  budget?: string;
}

const PRIMARY = "#c0623e";
const DARK = "#1a1208";
const GRAY = "#666666";
const LIGHT = "#f5ede6";
const BORDER = "#ede5dc";

const PAGE_W = 210;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function setColor(doc: jsPDF, hex: string) {
  doc.setTextColor(...hexToRgb(hex));
}

function setFill(doc: jsPDF, hex: string) {
  doc.setFillColor(...hexToRgb(hex));
}

function setDraw(doc: jsPDF, hex: string) {
  doc.setDrawColor(...hexToRgb(hex));
}

function infoRow(doc: jsPDF, label: string, value: string, x: number, y: number) {
  setColor(doc, GRAY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(label.toUpperCase(), x, y);
  setColor(doc, DARK);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  // Truncate long values
  const maxWidth = CONTENT_W / 2 - 6;
  const truncated = doc.getTextWidth(value) > maxWidth
    ? value.substring(0, Math.floor(value.length * maxWidth / doc.getTextWidth(value)) - 2) + "…"
    : value;
  doc.text(truncated, x, y + 5);
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  setColor(doc, PRIMARY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(text.toUpperCase(), MARGIN, y);
  setDraw(doc, BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 2, MARGIN + CONTENT_W, y + 2);
  return y + 8;
}

function checkNewPage(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > 280) {
    doc.addPage();
    return 15;
  }
  return y;
}

export async function generateRoadmapPDF(
  formSnapshot: PDFFormSnapshot | undefined,
  roadmapData: RoadmapData | null,
  stages: RoadmapStage[],
  fullName: string,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4", putOnlyUsedFonts: true });

  let y = 15;

  // ── Header ─────────────────────────────────────────────────────────────────
  setFill(doc, PRIMARY);
  doc.rect(MARGIN, y, CONTENT_W, 14, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("NextPath", MARGIN + 4, y + 9);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Personalnyy plan razvitiya", PAGE_W - MARGIN - 3, y + 5, { align: "right" });
  doc.text(new Date().toLocaleDateString("ru-RU"), PAGE_W - MARGIN - 3, y + 10, { align: "right" });
  y += 20;

  // ── Профиль ─────────────────────────────────────────────────────────────────
  y = sectionTitle(doc, "Profil", y);

  const col1 = MARGIN;
  const col2 = MARGIN + CONTENT_W / 2 + 3;

  const profileRows: [string, string][] = [
    ["Imya", formSnapshot?.fullName || fullName || "—"],
    ["Vozrast", formSnapshot?.age ? `${formSnapshot.age} let` : "—"],
    ["Gorod", formSnapshot?.location || "—"],
    ["Status", STATUS_LABELS[formSnapshot?.currentStatus || ""] || formSnapshot?.currentStatus || "—"],
    ["Uchebnoye zavedeniye", formSnapshot?.university || "—"],
    ["Spetsialnost", formSnapshot?.specialization || "—"],
    ["Opyt raboty", formSnapshot?.yearsExperience ? `${formSnapshot.yearsExperience} let` : "—"],
    ["Tekushchaya rol", formSnapshot?.currentRole || "—"],
  ];

  for (let i = 0; i < profileRows.length; i += 2) {
    y = checkNewPage(doc, y, 14);
    infoRow(doc, profileRows[i][0], profileRows[i][1], col1, y);
    if (profileRows[i + 1]) {
      infoRow(doc, profileRows[i + 1][0], profileRows[i + 1][1], col2, y);
    }
    y += 14;
  }

  y += 4;

  // ── Цель ───────────────────────────────────────────────────────────────────
  y = checkNewPage(doc, y, 30);
  y = sectionTitle(doc, "Karernaya tsel", y);

  const goalRows: [string, string][] = [
    ["Professiya", PROFESSION_LABELS[formSnapshot?.targetProfession || ""] || formSnapshot?.targetProfession || "—"],
    ["Industriya", formSnapshot?.targetIndustry || "—"],
    ["Srok", TIMELINE_LABELS[formSnapshot?.timeline || ""] || roadmapData?.total_duration || "—"],
    ["Chasov v nedelyu", formSnapshot?.hoursPerWeek ? `${formSnapshot.hoursPerWeek} ch/ned` : "—"],
    ["Navyki", formSnapshot?.technicalSkills?.slice(0, 5).join(", ") || "—"],
    ["Byudzhet", formSnapshot?.budget || "—"],
  ];

  for (let i = 0; i < goalRows.length; i += 2) {
    y = checkNewPage(doc, y, 14);
    infoRow(doc, goalRows[i][0], goalRows[i][1], col1, y);
    if (goalRows[i + 1]) {
      infoRow(doc, goalRows[i + 1][0], goalRows[i + 1][1], col2, y);
    }
    y += 14;
  }

  // Summary
  if (roadmapData?.summary) {
    y += 4;
    y = checkNewPage(doc, y, 20);
    setFill(doc, LIGHT);
    setDraw(doc, PRIMARY);
    doc.setLineWidth(0.5);

    const summaryText = roadmapData.summary.substring(0, 200);
    const lines = doc.splitTextToSize(summaryText, CONTENT_W - 10);
    const boxH = lines.length * 5 + 8;

    doc.rect(MARGIN, y, CONTENT_W, boxH, "FD");
    setColor(doc, DARK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(lines, MARGIN + 5, y + 6);
    y += boxH + 8;
  }

  // ── Дорожная карта ──────────────────────────────────────────────────────────
  y = checkNewPage(doc, y, 30);
  y = sectionTitle(doc, "Dorozhnaya karta", y);

  stages.forEach((stage, idx) => {
    y = checkNewPage(doc, y, 40);

    // Stage card background
    setFill(doc, idx === 0 ? LIGHT : "#fafafa");
    setDraw(doc, idx === 0 ? PRIMARY : BORDER);
    doc.setLineWidth(idx === 0 ? 0.6 : 0.3);
    const cardH = 36 + Math.ceil(stage.skills.length / 4) * 6 + Math.ceil(stage.resources.length / 4) * 6;
    doc.rect(MARGIN, y, CONTENT_W, cardH, "FD");

    // Number circle
    setFill(doc, PRIMARY);
    doc.circle(MARGIN + 7, y + 8, 5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(String(idx + 1).padStart(2, "0"), MARGIN + 7, y + 10, { align: "center" });

    // Title
    setColor(doc, DARK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(stage.title, MARGIN + 16, y + 9);

    // Duration
    setColor(doc, GRAY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Srok: ${stage.duration}`, PAGE_W - MARGIN - 3, y + 9, { align: "right" });

    let sy = y + 16;

    // Skills
    setColor(doc, GRAY);
    doc.setFontSize(7.5);
    doc.text("NAVYKI:", MARGIN + 4, sy);
    sy += 5;
    setColor(doc, DARK);
    doc.setFontSize(8.5);
    const skillsText = stage.skills.join("  •  ");
    const skillLines = doc.splitTextToSize(skillsText, CONTENT_W - 8);
    doc.text(skillLines, MARGIN + 4, sy);
    sy += skillLines.length * 5 + 2;

    // Resources
    setColor(doc, GRAY);
    doc.setFontSize(7.5);
    doc.text("RESURSY:", MARGIN + 4, sy);
    sy += 5;
    setColor(doc, PRIMARY);
    doc.setFontSize(8.5);
    const resText = stage.resources.join("  •  ");
    const resLines = doc.splitTextToSize(resText, CONTENT_W - 8);
    doc.text(resLines, MARGIN + 4, sy);

    y += cardH + 3;

    // Arrow
    if (idx < stages.length - 1) {
      setColor(doc, PRIMARY);
      doc.setFontSize(12);
      doc.text("↓", PAGE_W / 2, y + 2, { align: "center" });
      y += 6;
    }
  });

  // ── Footer ──────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setDraw(doc, BORDER);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 285, PAGE_W - MARGIN, 285);
    setColor(doc, GRAY);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text("NextPath — AI-sistema personalnogo kariernogo soprovozhdeniya", MARGIN, 289);
    doc.text(`nextpath.su   ${i}/${pageCount}`, PAGE_W - MARGIN, 289, { align: "right" });
  }

  doc.save("nextpath-plan.pdf");
}
