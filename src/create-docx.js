const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, UnderlineType, ExternalHyperlink
} = require('docx');

const COLORS = {
  name: '1a1a2e',
  accent: '2563eb',
  text: '374151',
  light: '6b7280',
  white: 'ffffff'
};

function link(url, label) {
  return new ExternalHyperlink({
    link: url,
    children: [
      new TextRun({ text: label, size: 18, color: COLORS.accent, font: 'Calibri', underline: { type: UnderlineType.SINGLE } })
    ]
  });
}

function separator() {
  return new TextRun({ text: '  |  ', size: 18, color: COLORS.light, font: 'Calibri' });
}

function hr() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.accent } },
    spacing: { before: 15, after: 15 }
  });
}

function sectionHeading(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color: COLORS.accent, font: 'Calibri' })
    ],
    spacing: { before: 180, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'dbeafe' } }
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: COLORS.text, font: 'Calibri' })],
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 }
  });
}

function createResumeDoc(myInfo, data) {
  const { resume } = data;

  const children = [
    // Name
    new Paragraph({
      children: [
        new TextRun({ text: myInfo.name, bold: true, size: 48, color: COLORS.name, font: 'Calibri' })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 }
    }),

    // Contact line
    new Paragraph({
      children: [
        new TextRun({ text: `${myInfo.email}  |  ${myInfo.phone}  |  ${myInfo.location}`, size: 18, color: COLORS.light, font: 'Calibri' })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 6 }
    }),

    // Links line
    new Paragraph({
      children: [
        ...(myInfo.linkedin ? [link(myInfo.linkedin, 'LinkedIn'), separator()] : []),
        ...(myInfo.github ? [link(myInfo.github, 'GitHub'), separator()] : []),
        ...(myInfo.portfolio ? [link(myInfo.portfolio, 'Portfolio')] : [])
      ].filter(Boolean),
      alignment: AlignmentType.CENTER,
      spacing: { after: 10 }
    }),

    hr(),

    // Summary
    sectionHeading('Professional Summary'),
    new Paragraph({
      children: [new TextRun({ text: resume.summary, size: 20, color: COLORS.text, font: 'Calibri' })],
      spacing: { before: 60, after: 60 }
    }),

    // Skills
    sectionHeading('Skills & Expertise'),
    ...Object.entries(resume.skills).map(([category, skills]) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${category}: `, bold: true, size: 20, color: COLORS.text, font: 'Calibri' }),
          new TextRun({ text: skills.join(', '), size: 20, color: COLORS.text, font: 'Calibri' })
        ],
        spacing: { before: 50, after: 50 }
      })
    ),

    // Experience
    sectionHeading('Professional Experience'),
    ...resume.experience.flatMap(exp => [
      new Paragraph({
        children: [
          new TextRun({ text: exp.title, bold: true, size: 22, color: COLORS.name, font: 'Calibri' }),
          new TextRun({ text: `  |  ${exp.company}`, size: 20, color: COLORS.accent, font: 'Calibri' }),
          new TextRun({ text: `  |  ${exp.duration}`, size: 18, color: COLORS.light, font: 'Calibri', italics: true })
        ],
        spacing: { before: 140, after: 50 }
      }),
      ...exp.bullets.map(b => bullet(b))
    ]),

    // Education
    sectionHeading('Education'),
    ...resume.education.flatMap(edu => [
      new Paragraph({
        children: [
          new TextRun({ text: edu.degree, bold: true, size: 22, color: COLORS.name, font: 'Calibri' }),
          new TextRun({ text: `  |  ${edu.school}`, size: 20, color: COLORS.accent, font: 'Calibri' }),
          new TextRun({ text: `  |  ${edu.duration}`, size: 18, color: COLORS.light, font: 'Calibri', italics: true })
        ],
        spacing: { before: 180, after: 30 }
      }),
      ...(edu.gpa ? [new Paragraph({
        children: [new TextRun({ text: edu.gpa, bold: true, size: 19, color: COLORS.accent, font: 'Calibri' })],
        spacing: { before: 0, after: 40 }
      })] : []),
      ...(edu.highlights || []).map(h => bullet(h))
    ])
  ];

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20, color: COLORS.text }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 580, right: 900, bottom: 580, left: 900 }
        }
      },
      children
    }]
  });
}

function createCoverLetterDoc(myInfo, data, companyName) {
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  const children = [
    // Header
    new Paragraph({
      children: [new TextRun({ text: myInfo.name, bold: true, size: 36, color: COLORS.name, font: 'Calibri' })],
      spacing: { after: 40 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `${myInfo.email}  |  ${myInfo.phone}  |  ${myInfo.location}`, size: 18, color: COLORS.light, font: 'Calibri' })],
      spacing: { after: 6 }
    }),
    new Paragraph({
      children: [
        ...(myInfo.linkedin ? [link(myInfo.linkedin, 'LinkedIn'), separator()] : []),
        ...(myInfo.github ? [link(myInfo.github, 'GitHub'), separator()] : []),
        ...(myInfo.portfolio ? [link(myInfo.portfolio, 'Portfolio')] : [])
      ].filter(Boolean),
      spacing: { after: 20 }
    }),
    hr(),

    // Date
    new Paragraph({
      children: [new TextRun({ text: today, size: 20, color: COLORS.light, font: 'Calibri', italics: true })],
      spacing: { before: 120, after: 120 }
    }),

    // Salutation
    new Paragraph({
      children: [new TextRun({ text: `Dear Hiring Manager at ${companyName},`, size: 22, color: COLORS.text, font: 'Calibri', bold: true })],
      spacing: { before: 80, after: 160 }
    }),

    // Body - split paragraphs on double newlines
    ...data.coverLetter.body.split(/\n\n+/).filter(p => p.trim()).map(para =>
      new Paragraph({
        children: [new TextRun({ text: para.trim(), size: 22, color: COLORS.text, font: 'Calibri' })],
        spacing: { before: 80, after: 160 },
        alignment: AlignmentType.JUSTIFIED
      })
    ),

    // Closing
    new Paragraph({
      children: [new TextRun({ text: 'Yours sincerely,', size: 22, color: COLORS.text, font: 'Calibri' })],
      spacing: { before: 320, after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: myInfo.name, bold: true, size: 22, color: COLORS.name, font: 'Calibri' })],
    })
  ];

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 900, right: 1080, bottom: 900, left: 1080 }
        }
      },
      children
    }]
  });
}

module.exports = { createResumeDoc, createCoverLetterDoc, Packer };
