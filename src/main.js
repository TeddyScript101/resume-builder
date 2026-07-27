#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config();
const { buildPrompt, generateContent, parseResponse } = require('./generate-content');
const { parseResume } = require('./parse-resume');
// const { createResumeDoc, createCoverLetterDoc, Packer } = require('./create-docx');
const { createResumePDF, createCoverLetterPDF, estimateResumePages } = require('./create-pdf');

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
  const args = process.argv.slice(2);
  const fromJsonIndex = args.indexOf('--from-json');
  const fromJsonPath = fromJsonIndex !== -1 ? args[fromJsonIndex + 1] : null;

  const myInfo = JSON.parse(fs.readFileSync(MY_INFO, 'utf-8'));
  let data, baseName, companyName;

  if (fromJsonPath) {
    if (!fs.existsSync(fromJsonPath)) {
      console.error(`❌ JSON file not found: ${fromJsonPath}`);
      process.exit(1);
    }
    data = JSON.parse(fs.readFileSync(fromJsonPath, 'utf-8'));
    baseName = path.basename(fromJsonPath).replace(/_data\.json$/, '');
    companyName = data.meta?.company || 'Unknown';
    console.log(`📂 Re-rendering from: ${fromJsonPath}`);
    console.log(`🏢 ${companyName} — ${data.meta?.jobTitle || 'Role'}`);
  } else {
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

    const fillInMatches = [...myResume.matchAll(/\[FILL IN\]/gi)];
    if (fillInMatches.length > 0) {
      console.error(`❌ my-resume.md contains ${fillInMatches.length} unfilled [FILL IN] placeholder(s). Fix before generating.`);
      process.exit(1);
    }

    console.log('📄 Job description loaded');
    console.log('🤖 Generating tailored content via Claude...\n');

    const prompt = buildPrompt(jobDescription, myResume, myInfo);

    const MAX_ATTEMPTS = 3;
    let lastRaw, lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const raw = await generateContent(prompt);
      try {
        data = parseResponse(raw);
        break;
      } catch (e) {
        lastRaw = raw;
        lastError = e;
        data = null;
        if (attempt < MAX_ATTEMPTS) {
          console.warn(`⚠️  Claude response was truncated/invalid (attempt ${attempt}/${MAX_ATTEMPTS}). Retrying...`);
        }
      }
    }

    if (!data) {
      console.error(`❌ Failed to parse Claude response after ${MAX_ATTEMPTS} attempts. Raw output:`);
      console.error(lastRaw.slice(0, 500));
      process.exit(1);
    }

    // Resume content comes verbatim from my-resume.md — Claude never rewrites it,
    // it only scores fit (jobAnalysis) and writes the cover letter.
    data.resume = parseResume(myResume, myInfo);

    // Custom cover letter override — if any cover-letter-*.txt exists in output/, use it
    const clFiles = fs.existsSync(OUTPUT_DIR)
      ? fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith('cover-letter-') && f.endsWith('.txt'))
      : [];
    if (clFiles.length > 1) {
      console.error(`❌ Multiple cover-letter-*.txt files found in output/: ${clFiles.join(', ')}`);
      console.error('   Delete all but the correct one before running.');
      process.exit(1);
    }
    if (clFiles.length === 1) {
      const clBodyFile = path.join(OUTPUT_DIR, clFiles[0]);
      data.coverLetter.body = fs.readFileSync(clBodyFile, 'utf-8').trim();
      fs.unlinkSync(clBodyFile);
      console.log(`✍️  Custom cover letter injected from output/${clFiles[0]}`);
    }

    // Sanity-check cover letter body against prompt rules (word count, em dash, paragraph breaks)
    const clBody = data.coverLetter.body;
    const wc = clBody.trim().split(/\s+/).length;
    if (wc < 200 || wc > 400) console.warn(`⚠️  Cover letter word count: ${wc} (target 250-350)`);
    if (/—/.test(clBody)) console.warn('⚠️  Cover letter contains em dash');
    if (!clBody.includes('\n\n')) console.warn('⚠️  Cover letter has no paragraph breaks');

    // Build filename: YYYY-MM-DD_Company_Job-Title
    const date = new Date().toISOString().split('T')[0];
    const company = (data.meta?.company || detectCompanyName(jobDescription))
      .replace(/[^a-zA-Z0-9\s]/g, '').trim()
      .replace(/\s+/g, '-');
    const jobTitle = (data.meta?.jobTitle || 'Application')
      .replace(/[^a-zA-Z0-9\s]/g, '').trim()
      .replace(/\s+/g, '-');
    baseName = `${date}_${company}_${jobTitle}`;
    companyName = data.meta?.company || detectCompanyName(jobDescription);

    console.log(`🏢 ${companyName} — ${data.meta?.jobTitle || 'Role'}`);

    // Print job analysis to terminal
    console.log('\n📊 Job Analysis:');
    console.log('  核心要求：');
    data.jobAnalysis.coreRequirements.forEach(r => console.log(`    • ${r}`));
    console.log('  軟技能：');
    data.jobAnalysis.softSkills.forEach(s => console.log(`    • ${s}`));
    console.log('');

    // Hard citizenship/PR requirement → block PDF/MongoDB outright
    if (data.jobAnalysis?.hardCitizenshipRequired) {
      console.log('⏭️  Resume & Cover Letter skipped (硬性 PR/公民權要求)');
      console.log('⏭️  MongoDB skipped (硬性 PR/公民權要求)');
      return;
    }

    // Save JSON for future re-render
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const jsonPath = path.join(OUTPUT_DIR, `${baseName}_data.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`💾 Data saved: ${jsonPath}`);
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Generate Resume PDF
  const resumePath = path.join(OUTPUT_DIR, `${baseName}_resume.pdf`);
  const { buffer: resumeBuffer, pageCount: resumePageCount } = await createResumePDF(myInfo, data);
  fs.writeFileSync(resumePath, resumeBuffer);
  console.log(`📄 Resume page count: ${resumePageCount}`);
  if (resumePageCount > 2) {
    console.warn(`⚠️  Resume is ${resumePageCount} pages (target: 2). Trim bullets before submitting.`);
  }

  // Generate Cover Letter PDF
  const clPath = path.join(OUTPUT_DIR, `${baseName}_cover-letter.pdf`);
  const clBuffer = await createCoverLetterPDF(myInfo, data, companyName);
  fs.writeFileSync(clPath, clBuffer);

  console.log('✅ Done!\n');
  console.log(`📝 Resume:       ${resumePath}`);
  console.log(`✉️  Cover Letter: ${clPath}`);
  console.log('\n💡 Tip: Open the .pdf files in any PDF viewer to review before submitting.');

  if (!fromJsonPath) {
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
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
