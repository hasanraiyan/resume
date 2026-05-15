import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseMarkdownToBlocks } from './coursify-parser';

const C = {
  primary: '#1f644e',
  accent: '#50c878',
  bg: '#fcfbf5',
  surface: '#ffffff',
  text: '#1e3a34',
  muted: '#7c8e88',
  border: '#e5e3d8',
};

const rgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

export const generateCoursifyPdf = async ({ course, sections }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const PW = doc.internal.pageSize.width;
  const PH = doc.internal.pageSize.height;
  const M = 20; // Margin
  let cursorY = M;

  // --- Helpers ---
  const addPageIfNeeded = (height) => {
    if (cursorY + height > PH - M) {
      doc.addPage();
      cursorY = M;
      return true;
    }
    return false;
  };

  const drawHeading = (text, size = 18, color = C.primary) => {
    addPageIfNeeded(size / 2 + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(...rgb(color));
    doc.text(text, M, cursorY + size / 2);
    cursorY += size + 5;
  };

  const drawText = (text, size = 10, color = C.text, style = 'normal') => {
    if (!text) return;
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...rgb(color));

    const lines = doc.splitTextToSize(text, PW - 2 * M);
    const lineHeight = size * 0.5;

    lines.forEach((line) => {
      addPageIfNeeded(lineHeight);
      doc.text(line, M, cursorY + lineHeight);
      cursorY += lineHeight;
    });
    cursorY += 2; // paragraph spacing
  };

  // ─── 1. COVER PAGE ──────────────────────────────────────────────────────
  doc.setFillColor(...rgb(C.bg));
  doc.rect(0, 0, PW, PH, 'F');

  // Decorative circle
  doc.setFillColor(...rgb(C.primary));
  doc.setGfxMatrix(1, 0, 0, 1, 0, 0);
  doc.setAlpha(0.05);
  doc.circle(PW, 0, 100, 'F');
  doc.setAlpha(1);

  cursorY = PH / 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...rgb(C.primary));
  const titleLines = doc.splitTextToSize(course.title, PW - 2 * M);
  titleLines.forEach((line) => {
    doc.text(line, M, cursorY);
    cursorY += 12;
  });

  cursorY += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...rgb(C.muted));
  doc.text(`${course.difficulty.toUpperCase()} • ${sections.length} SECTIONS`, M, cursorY);

  cursorY = PH - M - 20;
  doc.setFontSize(10);
  doc.text('Powered by Coursify AI', M, cursorY);
  doc.text('https://raiyan.me/coursify', M, cursorY + 5);

  // ─── 2. TABLE OF CONTENTS ───────────────────────────────────────────────
  doc.addPage();
  cursorY = M;
  drawHeading('Table of Contents', 22);

  sections.forEach((section, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...rgb(C.text));
    doc.text(`${idx + 1}. ${section.title}`, M, cursorY + 6);
    doc.setTextColor(...rgb(C.muted));
    const pageNum = idx + 3; // Approximate
    doc.text(pageNum.toString(), PW - M - 10, cursorY + 6);

    doc.setDrawColor(...rgb(C.border));
    doc.setLineWidth(0.1);
    doc.line(M, cursorY + 10, PW - M, cursorY + 10);
    cursorY += 12;
    addPageIfNeeded(12);
  });

  // ─── 3. SECTIONS ────────────────────────────────────────────────────────
  sections.forEach((section, sIdx) => {
    doc.addPage();
    cursorY = M;

    // Section Header
    doc.setFillColor(...rgb(C.primary));
    doc.rect(M, cursorY, 4, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...rgb(C.primary));
    doc.text(section.title, M + 8, cursorY + 9);
    cursorY += 20;

    const blocks = section.blocks || parseMarkdownToBlocks(section.content);

    blocks.forEach((block) => {
      if (block.type === 'MdBlock') {
        // Simple markdown parsing for the PDF
        const cleanContent = block.content
          .replace(/###\s*(.*)/g, '$1')
          .replace(/##\s*(.*)/g, '$1')
          .replace(/#\s*(.*)/g, '$1')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/`(.*?)`/g, '$1');
        drawText(cleanContent);
      } else if (block.type === 'StepByStepBlock') {
        if (block.title) drawText(block.title, 12, C.primary, 'bold');
        const tableData = (block.steps || []).map((s, i) => [
          block.showNumbering ? (i + 1).toString() : '•',
          s.title,
          s.content,
        ]);

        autoTable(doc, {
          startY: cursorY,
          head: [['#', 'Step', 'Description']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: rgb(C.primary) },
          styles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 40, fontStyle: 'bold' } },
          margin: { left: M, right: M },
        });
        cursorY = doc.lastAutoTable.finalY + 10;
      } else if (block.type === 'CalloutBlock') {
        const bgColor = block.calloutType === 'warning' ? '#fffbeb' : '#f0fdf4';
        const borderColor = block.calloutType === 'warning' ? '#fde68a' : '#bbf7d0';

        addPageIfNeeded(20);
        doc.setFillColor(...rgb(bgColor));
        doc.setDrawColor(...rgb(borderColor));
        doc.roundedRect(M, cursorY, PW - 2 * M, 20, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...rgb(C.primary));
        doc.text(block.title || 'Note', M + 5, cursorY + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(block.content, PW - 2 * M - 10);
        doc.text(lines[0] || '', M + 5, cursorY + 14);
        cursorY += 25;
      } else if (block.type === 'QuizBlock') {
        drawHeading('Section Quiz', 14, C.primary);
        (block.quiz?.questions || []).forEach((q, i) => {
          drawText(`${i + 1}. ${q.question}`, 10, C.text, 'bold');
          (q.options || []).forEach((opt) => {
            drawText(`  [ ] ${opt}`, 9, C.muted);
          });
          cursorY += 4;
        });
      }
    });

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...rgb(C.muted));
      doc.text(`Page ${i} of ${totalPages}`, PW / 2, PH - 10, { align: 'center' });
    }
  });

  return doc;
};
