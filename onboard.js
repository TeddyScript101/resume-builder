#!/usr/bin/env node
// First-time setup: parses your existing resume into my-info.json and my-resume.md
// Usage: node onboard.js

require('dotenv').config();

const fs   = require('fs');
const path = require('path');
const { callAI } = require('./src/ai-client');

const rawPath    = path.join(__dirname, 'data/my-resume-raw.txt');
const infoPath   = path.join(__dirname, 'data/my-info.json');
const resumePath = path.join(__dirname, 'data/my-resume.md');
const jobsPath   = path.join(__dirname, 'jobs/current.txt');

fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'jobs'),   { recursive: true });

if (!fs.existsSync(jobsPath)) {
  fs.writeFileSync(jobsPath, 'Paste the job description here, then run: node src/main.js\n');
}

if (!fs.existsSync(rawPath)) {
  fs.writeFileSync(rawPath, 'Paste your resume here as plain text, then re-run: node onboard.js\n');
  console.log('Created data/my-resume-raw.txt');
  console.log('Paste your resume (plain text) into that file, then re-run: node onboard.js');
  process.exit(0);
}

if (fs.existsSync(infoPath) || fs.existsSync(resumePath)) {
  console.error('data/my-info.json or data/my-resume.md already exists.');
  console.error('Delete them first if you want to re-run onboarding.');
  process.exit(1);
}

const raw = fs.readFileSync(rawPath, 'utf-8').trim();
if (!raw || raw.startsWith('Paste your resume here')) {
  console.error('data/my-resume-raw.txt is empty or still has placeholder text.');
  process.exit(1);
}

const prompt = `You are a resume parser. Extract structured information from the resume below.

Return ONLY a valid JSON object (no markdown fences, no extra text) with exactly this structure:

{
  "info": {
    "name": "Full name",
    "email": "email address or empty string",
    "phone": "phone number or empty string",
    "location": "City, State/Country or empty string",
    "availability": "Work rights and start date. If present in the resume use it; otherwise write: 'please update with your availability and work rights'",
    "summary": "2-3 sentence professional summary extracted or inferred from the resume",
    "skills": {
      "CategoryName": ["skill1", "skill2"]
    },
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "duration": "DD/MM/YYYY – DD/MM/YYYY (use MM/YYYY if only month and year are available)",
        "achievements": ["achievement 1", "achievement 2"]
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "school": "School Name",
        "duration": "MM/YYYY – MM/YYYY",
        "gpa": "GPA or WAM string, or empty string if not mentioned",
        "highlights": ["award, activity, or distinction"]
      }
    ]
  },
  "resumeMd": "The full resume reformatted in clean Markdown. Use # for name, ## for section headings, ### for job and education entries. Preserve all content."
}

Rules:
- Create sensible skill category names based on what the person actually has (e.g. Frontend, Backend, DevOps, Tools, Languages)
- List experience and education in reverse chronological order (most recent first)
- If a field is missing from the resume, use an empty string or empty array
- Return ONLY the JSON object, nothing else

Resume:
${raw}`;

async function main() {
  const backend = (process.env.AI_BACKEND || 'claude').toUpperCase();
  console.log(`Parsing your resume with ${backend}...`);

  let result;
  try {
    result = await callAI(prompt);
  } catch (err) {
    console.error('AI invocation failed:', err.message);
    process.exit(1);
  }

  const cleaned = result
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('AI returned invalid JSON. Raw output saved to .onboard-debug.txt');
    fs.writeFileSync(path.join(__dirname, '.onboard-debug.txt'), result);
    process.exit(1);
  }

  fs.writeFileSync(infoPath, JSON.stringify(parsed.info, null, 2));
  fs.writeFileSync(resumePath, parsed.resumeMd);

  console.log('\nDone! Files created:');
  console.log('  data/my-info.json');
  console.log('  data/my-resume.md');
  console.log('\nNext: review both files, update the "availability" field in my-info.json, then run:');
  console.log('  node src/main.js');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
