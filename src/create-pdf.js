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
  const lineY = doc.y + 2;
  rule(doc, lineY, W, L, R, C.ruleLight, 0.5);
  return lineY + 7;
}


function bulletLine(doc, text, y, L, CW) {
  doc.font('Helvetica').fontSize(9).fillColor(C.text)
     .text('•  ' + text, L + 4, y, { width: CW - 4, lineGap: 1.5 });
  return doc.y + 3;
}


function pdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

// Rough pre-render estimate: returns estimated page count
function estimateResumePages(data) {
  const { resume } = data;
  const PAGE_LINES = 61; // usable lines per page at fontSize 9 / 12pt line height
  const CHARS_PER_LINE = 110; // Helvetica 9pt at 540pt content width
  let lines = 0;

  lines += 4; // name + contact + rule

  lines += 2; // summary section head
  lines += Math.ceil((resume.summary || '').length / CHARS_PER_LINE);

  lines += 2; // skills section head
  Object.entries(resume.skills || {}).forEach(([cat, items]) => {
    const lineText = `${cat}: ${Array.isArray(items) ? items.join(', ') : items}`;
    lines += Math.ceil(lineText.length / CHARS_PER_LINE);
  });

  lines += 2; // experience section head
  (resume.experience || []).forEach((exp, i) => {
    if (i > 0) lines += 0.5;
    lines += 1.5; // role header row
    (exp.bullets || []).forEach(b => {
      lines += Math.ceil(b.length / CHARS_PER_LINE) + 0.1;
    });
  });

  if ((resume.projects || []).length > 0) {
    lines += 2; // projects section head
    (resume.projects || []).forEach((proj, i) => {
      if (i > 0) lines += 0.5;
      lines += 1.5;
      (proj.bullets || []).forEach(b => {
        lines += Math.ceil(b.length / CHARS_PER_LINE) + 0.1;
      });
    });
  }

  lines += 2; // education section head
  (resume.education || []).forEach((edu, i) => {
    if (i > 0) lines += 0.5;
    lines += 1.5;
    if (edu.gpa) lines += 0.8;
    (edu.highlights || []).forEach(h => {
      lines += Math.ceil(h.length / CHARS_PER_LINE) + 0.1;
    });
  });

  return Math.ceil(lines / PAGE_LINES);
}

async function createResumePDF(myInfo, data) {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 36, bottom: 36, left: 42, right: 42 } });
  let pageCount = 1;
  doc.on('pageAdded', () => pageCount++);
  const bufP = pdfBuffer(doc);

  const W = doc.page.width;
  const L = 42, R = 42, CW = W - L - R;
  const { resume } = data;
  let y = 36;

  // Name
  doc.font('Helvetica-Bold').fontSize(20).fillColor(C.name)
     .text(myInfo.name, L, y, { align: 'center', width: CW });
  y = doc.y + 3;

  // Contact: email · phone · location
  const portfolioDisplay = (myInfo.portfolio || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const contact = [myInfo.email, myInfo.phone, myInfo.location, portfolioDisplay].filter(Boolean).join('  ·  ');
  doc.font('Helvetica').fontSize(8.5).fillColor(C.light)
     .text(contact, L, y, { align: 'center', width: CW });
  y = doc.y + 6;

  rule(doc, y, W, L, R, C.accent, 1.2);
  y += 7;

  // Summary
  y = sectionHead(doc, 'PROFESSIONAL SUMMARY', y, W, L, R, CW);
  doc.font('Helvetica').fontSize(9).fillColor(C.text)
     .text(resume.summary, L, y, { width: CW, lineGap: 2 });
  y = doc.y + 8;

  // Skills
  y = sectionHead(doc, 'TECHNICAL SKILLS', y, W, L, R, CW);
  Object.entries(resume.skills).forEach(([cat, skillList]) => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text)
       .text(`${cat}: `, L, y, { width: CW, continued: true });
    doc.font('Helvetica').fontSize(9).fillColor(C.text)
       .text(skillList.join(', '));
    y = doc.y + 3;
  });
  y += 5;

  // Experience
  y = sectionHead(doc, 'PROFESSIONAL EXPERIENCE', y, W, L, R, CW);
  (resume.experience || []).forEach((exp, i) => {
    if (i > 0) y += 10;
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
    y = doc.y + 5;
    (exp.bullets || []).forEach(b => { y = bulletLine(doc, b, y, L, CW); });
  });
  y += 8;

  // Projects — start on page 2; only force a new page if experience fit on page 1
  if ((resume.projects || []).length > 0) {
    if (pageCount === 1) {
      doc.addPage();
      y = 36;
    }
    y = sectionHead(doc, 'PROJECTS', y, W, L, R, CW);
    (resume.projects || []).forEach((proj, i) => {
      if (i > 0) y += 10;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.name)
         .text(proj.name, L, y, { continued: !!proj.context });
      if (proj.context) {
        doc.font('Helvetica').fontSize(8.5).fillColor(C.light)
           .text(`  ·  ${proj.context}`);
      }
      y = doc.y + 5;
      (proj.bullets || []).forEach(b => { y = bulletLine(doc, b, y, L, CW); });
    });
    y += 8;
  }

  // Education
  y = sectionHead(doc, 'EDUCATION', y, W, L, R, CW);
  (resume.education || []).forEach((edu, i) => {
    if (i > 0) y += 10;
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.name)
       .text(edu.degree, L, y, { continued: true });
    doc.font('Helvetica').fontSize(9.5).fillColor(C.accent)
       .text(`  |  ${edu.school}`, { continued: true });
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(C.light)
       .text(`  |  ${edu.duration}`);
    y = doc.y + 4;
    if (edu.gpa) {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.accent)
         .text(edu.gpa, L, y, { width: CW });
      y = doc.y + 2;
    }
    (edu.highlights || []).forEach(h => { y = bulletLine(doc, h, y, L, CW); });
  });

  doc.end();
  const buffer = await bufP;
  return { buffer, pageCount };
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

  // Body — strip any salutation or sign-off Claude may have included in the body
  const cleanBody = data.coverLetter.body
    .replace(/^Dear[^\n]*\n*/i, '')
    .replace(/\n*Yours sincerely[^]*$/i, '')
    .trim();

  cleanBody.split(/\n\n+/).filter(p => p.trim()).forEach(para => {
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

module.exports = { createResumePDF, createCoverLetterPDF, estimateResumePages };
