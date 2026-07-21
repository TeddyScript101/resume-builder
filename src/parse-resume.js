'use strict';

// Parses data/my-resume.md into the structured object create-pdf.js expects.
// This is intentionally dumb and literal: whatever is written in the file is
// what ends up in the PDF, verbatim. No LLM involved, no rewriting, no trimming.

function stripAsterisks(line) {
  return line.trim().replace(/^\*+|\*+$/g, '').trim();
}

function splitSections(md) {
  const lines = md.split('\n');
  const sections = {};
  let current = null;
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      current = h2[1].trim();
      sections[current] = [];
      continue;
    }
    if (current) sections[current].push(line);
  }
  return sections;
}

function parseSummary(lines) {
  return lines.join('\n').split(/\n---/)[0].trim();
}

function parseSkills(lines) {
  const skills = {};
  for (const line of lines) {
    const m = line.match(/^-\s+\*\*(.+?):\*\*\s*(.+)$/);
    if (m) skills[m[1].trim()] = [m[2].trim()];
  }
  return skills;
}

// Generic parser for "### Heading | Sub" blocks followed by an optional
// *italic* meta line and then "- bullet" lines.
function parseEntryBlocks(lines) {
  const entries = [];
  let cur = null;
  for (const raw of lines) {
    const line = raw.trim();
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      if (cur) entries.push(cur);
      const [left, right] = h3[1].split('|').map(s => s.trim());
      cur = { heading: left, sub: right || '', meta: '', bullets: [] };
      continue;
    }
    if (!cur) continue;
    if (/^---+$/.test(line)) {
      continue; // horizontal rule, not a bullet
    }
    if (line.startsWith('-')) {
      cur.bullets.push(line.replace(/^-\s*/, '').trim());
    } else if (line.startsWith('*') && !cur.meta) {
      cur.meta = stripAsterisks(line);
    }
  }
  if (cur) entries.push(cur);
  return entries;
}

function parseExperience(lines, myInfo) {
  const locationByCompany = {};
  (myInfo.experience || []).forEach(e => { locationByCompany[e.company] = e.location; });

  return parseEntryBlocks(lines).map(e => ({
    title: e.heading,
    company: e.sub,
    location: locationByCompany[e.sub] || '',
    duration: e.meta,
    bullets: e.bullets
  }));
}

function parseProjects(lines) {
  return parseEntryBlocks(lines).map(e => {
    // meta line looks like: "Personal Project · Live demo: url"
    // e.sub holds the tech stack from the heading ("Next.js, TypeScript, ...")
    let context = e.meta;
    if (e.sub) {
      context = context.includes('·')
        ? context.replace('·', `· ${e.sub} ·`)
        : [context, e.sub].filter(Boolean).join(' · ');
    }
    return { name: e.heading, context, bullets: e.bullets };
  });
}

function parseEducation(lines) {
  return parseEntryBlocks(lines).map(e => {
    let duration = e.meta;
    let gpa = '';
    const parts = e.meta.split('|').map(s => s.trim());
    if (parts.length > 1 && /^(WAM|GPA)[:\s]/i.test(parts[1])) {
      duration = parts[0];
      gpa = parts[1];
    }
    return { degree: e.heading, school: e.sub, duration, gpa, highlights: e.bullets };
  });
}

function parseResume(md, myInfo) {
  const sections = splitSections(md);
  return {
    summary: parseSummary(sections['Professional Summary'] || []),
    skills: parseSkills(sections['Skills & Expertise'] || []),
    experience: parseExperience(sections['Professional Experience'] || [], myInfo),
    projects: parseProjects(sections['Projects'] || []),
    education: parseEducation(sections['Education'] || [])
  };
}

module.exports = { parseResume };
