import type { RoadmapData } from "@/types";

interface PDFOptions {
  roadmapData: RoadmapData;
  userName: string;
  targetProfession: string;
  currentRole?: string;
  technicalSkills?: string[];
  completedStages?: number[];
}

/**
 * Рендерит RoadmapPDFLayout в скрытый DOM-узел,
 * захватывает через html2canvas и сохраняет как PDF.
 */
export async function downloadRoadmapPDF(opts: PDFOptions): Promise<void> {
  const [
    { default: html2canvas },
    { jsPDF },
    React,
    { createRoot },
    { RoadmapPDFLayout },
  ] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
    import("react"),
    import("react-dom/client"),
    import("@/components/RoadmapPDFLayout"),
  ]);

  // Создаём контейнер вне экрана
  const container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:840px",
    "z-index:-9999",
    "visibility:hidden",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    React.createElement(RoadmapPDFLayout, {
      roadmapData: opts.roadmapData,
      userName: opts.userName,
      targetProfession: opts.targetProfession,
      currentRole: opts.currentRole,
      technicalSkills: opts.technicalSkills,
      completedStages: opts.completedStages,
    })
  );

  // Ждём рендер
  await new Promise((r) => setTimeout(r, 400));

  // Делаем элемент видимым для html2canvas
  container.style.visibility = "visible";

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(container, {
      scale: 2,
      useCORS: false,
      allowTaint: true,
      backgroundColor: "#0d0704",
      logging: false,
      width: 840,
      windowWidth: 840,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    container.style.visibility = "hidden";
    root.unmount();
    document.body.removeChild(container);
  }

  // Конвертируем в PDF (многостраничный)
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const PAGE_W = 210;     // mm
  const PAGE_H = 297;     // mm
  const imgW = PAGE_W;
  const imgH = (canvas.height / canvas.width) * imgW;

  const imgData = canvas.toDataURL("image/jpeg", 0.93);

  let remaining = imgH;
  let yOffset = 0;

  pdf.addImage(imgData, "JPEG", 0, yOffset, imgW, imgH);
  remaining -= PAGE_H;

  while (remaining > 0) {
    yOffset -= PAGE_H;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, yOffset, imgW, imgH);
    remaining -= PAGE_H;
  }

  pdf.save(`nextpath-${opts.targetProfession || "план"}.pdf`);
}
