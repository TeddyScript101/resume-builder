#!/usr/bin/env node
// Pre-screen jobs/current.txt for hard blockers before running the full pipeline.
// Called automatically via npm prestart — exits 1 to abort if a hard flag is found.

const fs = require('fs');
const path = require('path');

const JOB_FILE = path.join(__dirname, '..', 'jobs', 'current.txt');

// Hard citizenship/PR patterns — these are definitive blockers.
const HARD_BLOCK_PATTERNS = [
  /must\s+be\s+(an?\s+)?(australian\s+)?citizen/i,
  /australian\s+citizen(ship)?\s+(only|required|mandatory|is\s+required|is\s+mandatory)/i,
  /\bcitizenship\s+required\b/i,
  /\bpr\s+required\b/i,
  /permanent\s+reside(nt|ncy)\s+(only|required|mandatory)/i,
  /citizens?\s+and\s+permanent\s+residen(ts?|cy)\s+only/i,
  /australian\s+citizens?\s+and\s+permanent\s+residen(ts?|cy)/i,
  /must\s+hold\s+(an?\s+)?(australian\s+)?(pr|permanent\s+reside)/i,
  /no\s+sponsorship\s+(available|provided|offered)/i,
  /we\s+(do\s+not|don'?t|cannot|can'?t)\s+(offer|provide|support)\s+(visa\s+)?sponsorship/i,
  /\b(nv1|nv2|pv|ts\/sci|agsva)\s+(clearance\s+)?(required|mandatory|essential)/i,
  /requires?\s+(active\s+)?(nv1|nv2|pv|ts\/sci|agsva)\s+clearance/i,
];

function prescreen() {
  if (!fs.existsSync(JOB_FILE)) {
    // Let main.js handle the missing file error.
    process.exit(0);
  }

  const jd = fs.readFileSync(JOB_FILE, 'utf-8').trim();

  if (!jd || jd.startsWith('在這裡貼上')) {
    // Let main.js handle the empty file error.
    process.exit(0);
  }

  const matched = HARD_BLOCK_PATTERNS.find(p => p.test(jd));
  if (matched) {
    console.error('');
    console.error('🔴 硬性條件攔截 — npm start 已中止');
    console.error('');
    console.error(`   匹配規則: ${matched}`);
    console.error('');
    console.error('   此職缺要求公民身份、PR 或政府安全許可，');
    console.error('   候選人目前無法符合，直接跳過以節省時間。');
    console.error('');
    console.error('   若要強制執行，請直接用: node src/main.js');
    console.error('');
    process.exit(1);
  }

  // No hard blockers found.
  process.exit(0);
}

prescreen();
