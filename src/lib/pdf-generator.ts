import jsPDF from 'jspdf';

export function generateQuestionListPdf(
  docTitle: string,
  questions: Array<{ orderIndex: number; questionText: string; topic: string; difficulty: string; questionType: string }>
): Uint8Array {
  const doc = new jsPDF();
  const title = `Sahayak AI - Question Bank: ${docTitle}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 27, 75);
  doc.text('SAHAYAK AI', 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text(`Question List - ${docTitle}`, 14, 28);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Questions: ${questions.length}`, 14, 34);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 38, 196, 38);

  let y = 46;

  questions.forEach((q, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const qLines = doc.splitTextToSize(`Q${idx + 1}. ${q.questionText}`, 175);
    doc.text(qLines, 14, y);
    y += (qLines.length * 6) + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Topic: ${q.topic}  |  Difficulty: ${q.difficulty}  |  Type: ${q.questionType}`, 18, y);
    y += 10;
  });

  return new Uint8Array(doc.output('arraybuffer'));
}

export function generateSummaryPdf(docTitle: string, summaryText: string): Uint8Array {
  const doc = new jsPDF();
  const pageHeight = 297; // A4 height mm
  const margin = 14;
  const contentWidth = 182;

  // Header Banner on Page 1
  const renderHeader = (pageNumber: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 27, 75);
    doc.text('SAHAYAK AI', margin, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('DOCUMENT-GROUNDED STUDY SUMMARY', margin + 36, 18);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 22, margin + contentWidth, 22);
  };

  const renderFooter = (pageNumber: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sahayak AI • Page ${pageNumber} • ${docTitle}`,
      margin,
      pageHeight - 10
    );
  };

  let pageNum = 1;
  renderHeader(pageNum);

  // Title Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(`Summary: ${docTitle}`, contentWidth);
  doc.text(titleLines, margin, 32);

  let y = 32 + titleLines.length * 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} • Verified Grounded Extraction`, margin, y);
  y += 6;

  doc.setDrawColor(241, 245, 249);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // Process summary line by line
  const rawLines = summaryText.split('\n');

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      y += 3;
      continue;
    }

    if (y > pageHeight - 25) {
      renderFooter(pageNum);
      doc.addPage();
      pageNum++;
      renderHeader(pageNum);
      y = 30;
    }

    if (trimmed.startsWith('# ')) {
      // Main H1 Header
      const text = trimmed.replace(/^#\s+/, '').replace(/\*\*/g, '');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 27, 75);
      y += 4;
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 6 + 2;
    } else if (trimmed.startsWith('## ')) {
      // Section H2 Header
      const text = trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      y += 4;
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 3;
    } else if (trimmed.startsWith('### ')) {
      // Sub-section H3 Header
      const text = trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      y += 2;
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet Item
      const text = trimmed.replace(/^[-*]\s+/, '').replace(/\*\*/g, '');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('•', margin + 2, y);
      const lines = doc.splitTextToSize(text, contentWidth - 8);
      doc.text(lines, margin + 7, y);
      y += lines.length * 4.5 + 2;
    } else {
      // Regular Paragraph
      const text = trimmed.replace(/\*\*/g, '');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 4.5 + 2;
    }
  }

  renderFooter(pageNum);

  return new Uint8Array(doc.output('arraybuffer'));
}

export function generateReportPdf(
  sessionData: {
    pdfName: string;
    mode: string;
    score: number;
    date: string;
    strongTopics: string[];
    averageTopics: string[];
    weakTopics: string[];
    recommended: string[];
    answers: Array<{
      questionText: string;
      topic: string;
      score: number;
      classification: string;
      studentResponse: string;
      hintsUsed: number;
    }>;
  }
): Uint8Array {
  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 27, 75);
  doc.text('SAHAYAK AI', 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text(`Assessment Report - ${sessionData.pdfName}`, 14, 28);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Mode: ${sessionData.mode} | Date: ${sessionData.date} | Overall Score: ${sessionData.score}%`, 14, 34);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 38, 196, 38);

  let y = 46;

  // Topic Analysis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Topic Performance Analysis', 14, y);
  y += 8;

  doc.setFontSize(10);
  
  // Strong
  doc.setTextColor(16, 185, 129);
  doc.text(`Strong Topics: ${sessionData.strongTopics.join(', ') || 'None identified'}`, 14, y);
  y += 6;

  // Average
  doc.setTextColor(245, 158, 11);
  doc.text(`Average Topics: ${sessionData.averageTopics.join(', ') || 'None identified'}`, 14, y);
  y += 6;

  // Weak
  doc.setTextColor(239, 68, 68);
  doc.text(`Weak Topics: ${sessionData.weakTopics.join(', ') || 'None identified'}`, 14, y);
  y += 10;

  // Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('Recommended Revision Plan:', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const recText = sessionData.recommended.join(' • ') || 'Revise weak topics identified above.';
  const recLines = doc.splitTextToSize(recText, 175);
  doc.text(recLines, 14, y);
  y += (recLines.length * 6) + 8;

  // Question Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Question Breakdown', 14, y);
  y += 8;

  sessionData.answers.forEach((ans, idx) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const qLines = doc.splitTextToSize(`Q${idx + 1}: ${ans.questionText}`, 175);
    doc.text(qLines, 14, y);
    y += (qLines.length * 5) + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Topic: ${ans.topic} | Classification: ${ans.classification} (${ans.score}%) | Hints: ${ans.hintsUsed}`, 18, y);
    y += 5;

    const respLines = doc.splitTextToSize(`Answer: "${ans.studentResponse}"`, 170);
    doc.text(respLines, 18, y);
    y += (respLines.length * 5) + 6;
  });

  return new Uint8Array(doc.output('arraybuffer'));
}
