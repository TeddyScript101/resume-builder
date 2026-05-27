'use strict';
const PDFDocument = require('pdfkit');

const C = {
  name: '#1a1a2e',
  accent: '#2563eb',
  text: '#374151',
  light: '#6b7280',
  ruleLight: '#dbeafe'
};

function rule(doc, y, W, L, R, color, weight) {
  doc.moveTo(L, y).lineTo(W - R, y).strokeColor(color).lineWidth(weight).stroke();
}

function sectionHead(doc, title, y, W, L, R, CW) {
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.accent)
     .text(title, L, y, { width: CW });
  const lineY = doc.y + 1;
  rule(doc, lineY, W, L, R, C.ruleLight, 0.5);
  return lineY + 5;
}


function bulletLine(doc, text, y, L, CW) {
  doc.font('Helvetica').fontSize(9).fillColor(C.text)
     .text('•  ' + text, L + 4, y, { width: CW - 4, lineGap: 0.5 });
  return doc.y + 2;
}


function pdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

function createResumePDF(myInfo, data) {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 28, bottom: 28, left: 36, right: 36 } });
  const bufP = pdfBuffer(doc);

  const W = doc.page.width;
  const L = 36, R = 36, CW = W - L - R;
  const { resume } = data;
  let y = 28;

  // Name
  doc.font('Helvetica-Bold').fontSize(20).fillColor(C.name)
     .text(myInfo.name, L, y, { align: 'center', width: CW });
  y = doc.y + 2;

  // Contact: email · phone · location
  const contact = [myInfo.email, myInfo.phone, myInfo.location].filter(Boolean).join('  ·  ');
  doc.font('Helvetica').fontSize(8.5).fillColor(C.light)
     .text(contact, L, y, { align: 'center', width: CW });
  y = doc.y + 4;

  rule(doc, y, W, L, R, C.accent, 1.2);
  y += 7;

  // Summary
  y = sectionHead(doc, 'PROFESSIONAL SUMMARY', y, W, L, R, CW);
  doc.font('Helvetica').fontSize(9).fillColor(C.text)
     .text(resume.summary, L, y, { width: CW, lineGap: 0.5 });
  y = doc.y + 6;

  // Skills
  y = sectionHead(doc, 'TECHNICAL SKILLS', y, W, L, R, CW);
  Object.entries(resume.skills).forEach(([cat, skillList]) => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text)
       .text(`${cat}: `, L, y, { width: CW, continued: true });
    doc.font('Helvetica').fontSize(9).fillColor(C.text)
       .text(skillList.join(', '));
    y = doc.y + 2;
  });
  y += 3;

  // Experience
  y = sectionHead(doc, 'PROFESSIONAL EXPERIENCE', y, W, L, R, CW);
  (resume.experience || []).forEach((exp, i) => {
    if (i > 0) y += 7;
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.name)
       .text(exp.title, L, y, { continued: true });
    doc.font('Helvetica').fontSize(9.5).fillColor(C.accent)
       .text(`  |  ${exp.company}`, { continued: true });
    if (exp.location) {
      doc.font('Helvetica').fontSize(8.5).fillColor(C.light)
         .text(`  ·  ${exp.location}`, { continued: true });
    }
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(C.light)
       .text(`  |  ${exp.duration}`);
    y = doc.y + 3;
    (exp.bullets || []).forEach(b => { y = bulletLine(doc, b, y, L, CW); });
  });
  y += 5;

  // Education
  y = sectionHead(doc, 'EDUCATION', y, W, L, R, CW);
  (resume.education || []).forEach((edu, i) => {
    if (i > 0) y += 7;
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.name)
       .text(edu.degree, L, y, { continued: true });
    doc.font('Helvetica').fontSize(9.5).fillColor(C.accent)
       .text(`  |  ${edu.school}`, { continued: true });
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(C.light)
       .text(`  |  ${edu.duration}`);
    y = doc.y + 2;
    if (edu.gpa) {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.accent)
         .text(edu.gpa, L, y, { width: CW });
      y = doc.y + 2;
    }
    (edu.highlights || []).forEach(h => { y = bulletLine(doc, h, y, L, CW); });
  });

  doc.end();
  return bufP;
}

function createCoverLetterPDF(myInfo, data, companyName) {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 54, bottom: 54, left: 54, right: 54 } });
  const bufP = pdfBuffer(doc);

  const W = doc.page.width;
  const L = 54, R = 54, CW = W - L - R;
  let y = 54;
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  // Name
  doc.font('Helvetica-Bold').fontSize(18).fillColor(C.name)
     .text(myInfo.name, L, y, { width: CW });
  y = doc.y + 3;

  // Contact: email · phone · location
  const clContact = [myInfo.email, myInfo.phone, myInfo.location].filter(Boolean).join('  ·  ');
  doc.font('Helvetica').fontSize(8.5).fillColor(C.light)
     .text(clContact, L, y, { width: CW });
  y = doc.y + 5;

  rule(doc, y, W, L, R, C.accent, 1.2);
  y += 16;

  // Date
  doc.font('Helvetica-Oblique').fontSize(10).fillColor(C.light)
     .text(today, L, y, { width: CW });
  y = doc.y + 16;

  // Salutation
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.text)
     .text(`Dear Hiring Manager at ${companyName},`, L, y, { width: CW });
  y = doc.y + 14;

  // Body
  data.coverLetter.body.split(/\n\n+/).filter(p => p.trim()).forEach(para => {
    doc.font('Helvetica').fontSize(10.5).fillColor(C.text)
       .text(para.trim(), L, y, { width: CW, lineGap: 2, align: 'justify' });
    y = doc.y + 10;
  });

  // Closing
  y += 10;
  doc.font('Helvetica').fontSize(10.5).fillColor(C.text)
     .text('Yours sincerely,', L, y, { width: CW });
  y = doc.y + 22;

  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.name)
     .text(myInfo.name, L, y, { width: CW });

  doc.end();
  return bufP;
}

module.exports = { createResumePDF, createCoverLetterPDF };
