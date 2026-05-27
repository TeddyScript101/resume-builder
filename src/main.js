#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config();
const { buildPrompt, generateContent, parseResponse } = require('./generate-content');
// const { createResumeDoc, createCoverLetterDoc, Packer } = require('./create-docx');
const { createResumePDF, createCoverLetterPDF } = require('./create-pdf');

const ROOT = path.join(__dirname, '..');
const JOB_FILE = path.join(ROOT, 'jobs/current.txt');
const MY_RESUME = path.join(ROOT, 'data/my-resume.md');
const MY_INFO = path.join(ROOT, 'data/my-info.json');
const OUTPUT_DIR = path.join(ROOT, 'output');

function postToAPI(companyName, jobTitle, resumeContent, coverLetterContent) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      company_name: companyName,
      position: jobTitle,
      resume_content: resumeContent,
      cover_letter_content: coverLetterContent,
      status: 'applied'
    });

    const req = http.request({
      hostname: 'localhost',
      port: process.env.PORT || 5000,
      path: '/api/applications',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => resolve(res.statusCode >= 200 && res.statusCode < 300));

    req.on('error', () => resolve(false));
    req.write(body);
    req.end();
  });
}

function detectCompanyName(jobText) {
  // Try explicit "Company: X" pattern first (but not "Company Description")
  const explicit = jobText.match(/^Company:\s*(.+)$/im);
  if (explicit && !/description/i.test(explicit[1])) return explicit[1].trim();

  // Try first non-empty line (often the company name when pasted from LinkedIn)
  const firstLine = jobText.split('\n').map(l => l.trim()).find(l => l.length > 1 && l.length < 60);
  if (firstLine && !/job|role|position|engineer|developer|manager|analyst|description/i.test(firstLine)) {
    return firstLine;
  }

  // Try "@ Company" or "at Company" patterns
  const atMatch = jobText.match(/(?:@|at)\s+([A-Z][a-zA-Z0-9\s]+?)(?:\s*[|\-,\n])/);
  if (atMatch) return atMatch[1].trim();

  return 'the Company';
}

async function main() {
  // Check job file has real content
  if (!fs.existsSync(JOB_FILE)) {
    console.error('❌ jobs/current.txt not found');
    process.exit(1);
  }

  const jobDescription = fs.readFileSync(JOB_FILE, 'utf-8').trim();
  if (!jobDescription || jobDescription.startsWith('在這裡貼上')) {
    console.error('❌ Please paste the job description into jobs/current.txt first');
    process.exit(1);
  }

  const myResume = fs.readFileSync(MY_RESUME, 'utf-8');
  const myInfo = JSON.parse(fs.readFileSync(MY_INFO, 'utf-8'));

  const backend = (process.env.AI_BACKEND || 'claude').toUpperCase();
  console.log('📄 Job description loaded');
  console.log(`🤖 Generating tailored content via ${backend}...\n`);

  const prompt = buildPrompt(jobDescription, myResume, myInfo);
  const raw = await generateContent(prompt);

  let data;
  try {
    data = parseResponse(raw);
  } catch (e) {
    console.error('❌ Failed to parse Claude response. Raw output:');
    console.error(raw.slice(0, 500));
    process.exit(1);
  }

  // Hard citizenship/PR requirement → override score to 0
  if (data.jobAnalysis?.hardCitizenshipRequired) {
    data.jobAnalysis.suitabilityScore = 0;
    data.jobAnalysis.suitabilityReason = (data.jobAnalysis.suitabilityReason || '') +
      ' 【此職位有硬性 PR/公民要求，自動評分為 0】';
  }

  // Build filename: YYYY-MM-DD_Company_Job-Title
  const date = new Date().toISOString().split('T')[0];
  const company = (data.meta?.company || detectCompanyName(jobDescription))
    .replace(/[^a-zA-Z0-9\s]/g, '').trim()
    .replace(/\s+/g, '-');
  const jobTitle = (data.meta?.jobTitle || 'Application')
    .replace(/[^a-zA-Z0-9\s]/g, '').trim()
    .replace(/\s+/g, '-');
  const baseName = `${date}_${company}_${jobTitle}`;
  const companyName = data.meta?.company || detectCompanyName(jobDescription);

  console.log(`🏢 ${companyName} — ${data.meta?.jobTitle || 'Role'}`);

  // Print job analysis to terminal
  const score = data.jobAnalysis.suitabilityScore;
  const reason = data.jobAnalysis.suitabilityReason;
  console.log('\n📊 Job Analysis:');
  console.log('  核心要求：');
  data.jobAnalysis.coreRequirements.forEach(r => console.log(`    • ${r}`));
  console.log('  軟技能：');
  data.jobAnalysis.softSkills.forEach(s => console.log(`    • ${s}`));
  console.log(`\n  合適程度：${score}/10`);
  if (reason) console.log(`  ${reason}`);
  console.log('');

  // Skip PDF creation and MongoDB if suitability score is too low
  const skipLowScore = (process.env.SKIP_LOW_SCORE ?? 'true') !== 'false';
  if (skipLowScore && score <= 6) {
    console.log(`⏭️  Resume & Cover Letter skipped (合適程度 ${score}/10 ≤ 6)`);
    console.log(`⏭️  MongoDB skipped (合適程度 ${score}/10 ≤ 6)`);
    return;
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // // Generate Resume DOCX
  // const resumeDoc = createResumeDoc(myInfo, data);
  // const resumePath = path.join(OUTPUT_DIR, `${baseName}_resume.docx`);
  // const resumeBuffer = await Packer.toBuffer(resumeDoc);
  // fs.writeFileSync(resumePath, resumeBuffer);

  // // Generate Cover Letter DOCX
  // const clDoc = createCoverLetterDoc(myInfo, data, companyName);
  // const clPath = path.join(OUTPUT_DIR, `${baseName}_cover-letter.docx`);
  // const clBuffer = await Packer.toBuffer(clDoc);
  // fs.writeFileSync(clPath, clBuffer);

  // Generate Resume PDF
  const resumePath = path.join(OUTPUT_DIR, `${baseName}_resume.pdf`);
  const resumeBuffer = await createResumePDF(myInfo, data);
  fs.writeFileSync(resumePath, resumeBuffer);

  // Generate Cover Letter PDF
  const clPath = path.join(OUTPUT_DIR, `${baseName}_cover-letter.pdf`);
  const clBuffer = await createCoverLetterPDF(myInfo, data, companyName);
  fs.writeFileSync(clPath, clBuffer);

  console.log('✅ Done!\n');
  console.log(`📝 Resume:       ${resumePath}`);
  console.log(`✉️  Cover Letter: ${clPath}`);
  console.log('\n💡 Tip: Open the .pdf files in any PDF viewer to review before submitting.');

  // Save application to MongoDB via API
  const saved = await postToAPI(
    companyName,
    data.meta?.jobTitle || 'Unknown Role',
    JSON.stringify(data.resume, null, 2),
    data.coverLetter.body
  );
  if (saved) {
    console.log('📋 Application saved → MongoDB (http://localhost:5000/api/applications)');
  } else {
    console.log('⚠️  Could not reach API server. Start with: cd server && npm start');
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
