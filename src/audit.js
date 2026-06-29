#!/usr/bin/env node
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { callAI } = require('./ai-client');

const ROOT = path.join(__dirname, '..');
const RESUME_BASE = path.join(ROOT, 'data/my-resume-base.md');
const JOB_FILE = path.join(ROOT, 'jobs/current.txt');
const OUTPUT_DIR = path.join(ROOT, 'output');

const shouldWrite = process.argv.includes('--write');

async function main() {
  if (!fs.existsSync(RESUME_BASE)) {
    console.error('Missing: data/my-resume-base.md');
    process.exit(1);
  }
  if (!fs.existsSync(JOB_FILE)) {
    console.error('Missing: jobs/current.txt');
    process.exit(1);
  }

  const resume = fs.readFileSync(RESUME_BASE, 'utf8');
  const jobDescription = fs.readFileSync(JOB_FILE, 'utf8');

  console.log('Running audit...');
  const auditResult = await callAI(buildAuditPrompt(resume, jobDescription));

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const auditPath = path.join(OUTPUT_DIR, 'audit.txt');
  fs.writeFileSync(auditPath, auditResult, 'utf8');
  console.log(`Audit written to output/audit.txt\n`);
  console.log(auditResult);

  if (shouldWrite) {
    console.log('\nGenerating tailored resume...');
    const tailored = await callAI(buildWritePrompt(resume, jobDescription, auditResult));
    const resumePath = path.join(ROOT, 'data/my-resume.md');
    fs.writeFileSync(resumePath, tailored.trim(), 'utf8');
    console.log(`Written to data/my-resume.md. Run \`npm start\` to generate .docx files.`);
  }
}

function buildAuditPrompt(resume, jobDescription) {
  return `You are a senior recruiter auditing a resume against a job description.

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}

Provide a structured audit with these sections:

## Match Score
Score out of 100 with one sentence justification.

## Top 5 Missing ATS Keywords
Exact keywords ATS will scan for that are absent or underrepresented. For each, state where in the resume it should appear.

## 3 Red Flags (7-second scan)
Problems that would cause a hiring manager to disengage immediately. Name the exact line or section.

## Strong Sections
What is working and why. Be specific.

## Weak Sections
What is hurting the application and why. Be specific.

## Benchmark vs Top-10% Candidate
How does this resume compare to what a top-10% candidate for this role would look like? Name 2-3 concrete gaps.

## Rewritten Experience Section
Rewrite every bullet point in the experience section using these rules:
1. Naturally include the missing ATS keywords identified above.
2. Remove or fix every red flag flagged above.
3. Google XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]"
4. Start every bullet with a strong action verb. Never use "Responsible for" or "Helped with".
5. Add specific metrics wherever possible. If unknown, mark as [FILL IN].
6. Keep each bullet to 1-2 lines max.
7. Sort bullets by impact, not chronology.

STYLE RULE: Never use em dashes. Use commas or periods instead.
Output plain text only. No markdown fences.`;
}

function buildWritePrompt(resumeBase, jobDescription, auditResult) {
  return `You are a resume writer. Using the audit findings below, produce a complete tailored version of the resume.

BASE RESUME:
${resumeBase}

JOB DESCRIPTION:
${jobDescription}

AUDIT FINDINGS AND REWRITTEN BULLETS:
${auditResult}

Rules:
1. Replace ONLY the bullets in the experience section with the rewritten bullets from the audit findings above.
2. Preserve everything else exactly as in the base resume: job titles, dates, Professional Summary, Skills, Education, Projects.
3. Do NOT add or remove any words from job titles.
4. Output the complete resume in the same markdown format as the base resume.
5. STYLE RULE: Never use em dashes. Use commas or periods instead.

Output only the resume markdown. No extra commentary.`;
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
