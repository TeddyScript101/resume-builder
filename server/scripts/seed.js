require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Application = require('../models/Application');

const MD_PATH = path.join(__dirname, '../../applications.md');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/resume-builder';

const STATUS_MAP = {
  '失敗': 'rejected',
  '未有消息': 'applied',
  '面試': 'interview',
  '面試中': 'interview',
  '錄取': 'offer'
};

function parseMarkdown(content) {
  const records = [];
  const rowRegex = /^\|\s*([\d-]+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/;

  for (const line of content.split('\n')) {
    const match = line.match(rowRegex);
    if (!match) continue;

    const [, dateStr, company, position, resultRaw] = match;
    if (dateStr === '日期') continue; // skip header row

    const status = STATUS_MAP[resultRaw.trim()] || 'applied';
    const created_at = new Date(dateStr);
    if (isNaN(created_at.getTime())) continue;

    records.push({ company_name: company.trim(), position: position.trim(), status, created_at });
  }

  return records;
}

async function seed() {
  if (!fs.existsSync(MD_PATH)) {
    console.error('applications.md not found at', MD_PATH);
    process.exit(1);
  }

  const content = fs.readFileSync(MD_PATH, 'utf-8');
  const records = parseMarkdown(content);

  if (records.length === 0) {
    console.log('No records found in applications.md');
    process.exit(0);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await Application.countDocuments();
  if (existing > 0) {
    console.log(`Database already has ${existing} records. Skipping seed.`);
    console.log('To force re-seed, drop the collection first.');
    await mongoose.disconnect();
    return;
  }

  await Application.insertMany(records);
  console.log(`Seeded ${records.length} applications from applications.md`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
