const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

function generateSamplePdf() {
  const doc = new jsPDF();
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('DBMS Unit 1: Database System Concepts & Architecture', 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text('Comprehensive Study Guide for Exam & Technical Interview Preparation', 14, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const content = [
    '1. INTRODUCTION TO DATABASE MANAGEMENT SYSTEMS (DBMS)',
    'A Database Management System (DBMS) is a collection of programs that enables users to create, maintain, and control access to a database. Primary goals of a DBMS are data independence, efficient data access, data integrity, security, and concurrent access.',
    '',
    '2. DATA INDEPENDENCE',
    'Data Independence is defined as the capacity to change the schema at one level of a database system without having to change the schema at the next higher level.',
    '• Logical Data Independence: The capacity to modify the logical schema (e.g., adding attributes or tables) without altering external schemas or application programs.',
    '• Physical Data Independence: The capacity to modify the physical storage schema (e.g., indexing, file organization) without changing the logical schema.',
    '',
    '3. THREE-SCHEMA ARCHITECTURE',
    'The ANSI/SPARC Three-Schema Architecture divides the database system into three levels:',
    '1. External Level (View Level): Describes how different user groups view the data.',
    '2. Conceptual Level (Logical Level): Describes what data is stored in the database and relationships among data.',
    '3. Internal Level (Physical Level): Describes how data is physically stored on storage media.',
    '',
    '4. NORMALIZATION & INTEGRITY CONSTRAINTS',
    'Normalization decomposes complex relations into well-structured tables to avoid data redundancy and anomalies (Insertion, Deletion, and Update anomalies). Key Normal Forms include 1NF (atomic values), 2NF (no partial dependencies), and 3NF (no transitive dependencies).'
  ];

  let y = 42;
  content.forEach(line => {
    if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
    }

    const splitLines = doc.splitTextToSize(line, 175);
    doc.text(splitLines, 14, y);
    y += (splitLines.length * 5) + 3;
  });

  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const pdfPath = path.join(publicDir, 'sample_dbms_study_guide.pdf');
  const buffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(pdfPath, buffer);
  console.log('Sample DBMS PDF created successfully at:', pdfPath);
}

generateSamplePdf();
