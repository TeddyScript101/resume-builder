#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config();
const { parseResume } = require('./parse-resume');
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

function detectJobTitle(jobText) {
  const lines = jobText.split('\n').map(l => l.trim()).filter(Boolean);
  const titleLine = lines.find(l =>
    l.length < 80 && /engineer|developer|manager|analyst|specialist|lead|architect|consultant|coordinator|director|scientist/i.test(l)
  );
  return titleLine || 'Application';
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

    // Cover letter must be pre-written to output/cover-letter-*.txt — no AI fallback
    const clFiles = fs.existsSync(OUTPUT_DIR)
      ? fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith('cover-letter-') && f.endsWith('.txt'))
      : [];
    if (clFiles.length === 0) {
      console.error('❌ No cover-letter-*.txt found in output/. Write the cover letter body there first.');
      process.exit(1);
    }
    if (clFiles.length > 1) {
      console.error(`❌ Multiple cover-letter-*.txt files found in output/: ${clFiles.join(', ')}`);
      console.error('   Delete all but the correct one before running.');
      process.exit(1);
    }
    const clBodyFile = path.join(OUTPUT_DIR, clFiles[0]);
    const clBody = fs.readFileSync(clBodyFile, 'utf-8').trim();
    fs.unlinkSync(clBodyFile);
    console.log(`✍️  Cover letter loaded from output/${clFiles[0]}`);

    // Sanity-check cover letter body (word count, em dash, paragraph breaks)
    const wc = clBody.trim().split(/\s+/).length;
    if (wc < 200 || wc > 400) console.warn(`⚠️  Cover letter word count: ${wc} (target 250-350)`);
    if (/—/.test(clBody)) console.warn('⚠️  Cover letter contains em dash');
    if (!clBody.includes('\n\n')) console.warn('⚠️  Cover letter has no paragraph breaks');

    companyName = detectCompanyName(jobDescription);
    const jobTitleName = detectJobTitle(jobDescription);

    // Resume content comes verbatim from my-resume.md
    data = {
      meta: { company: companyName, jobTitle: jobTitleName },
      resume: parseResume(myResume, myInfo),
      coverLetter: { body: clBody }
    };

    // Build filename: YYYY-MM-DD_Company_Job-Title
    const date = new Date().toISOString().split('T')[0];
    const company = companyName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-');
    const jobTitle = jobTitleName.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-');
    baseName = `${date}_${company}_${jobTitle}`;

    console.log(`🏢 ${companyName} — ${jobTitleName}`);

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
