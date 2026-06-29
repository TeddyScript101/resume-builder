const fs = require('fs');
const path = require('path');

const JOB_FILE = path.join(__dirname, '..', 'jobs', 'current.txt');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Strip common legal suffixes for use in prose (e.g. "4DMedical Limited" -> "4DMedical")
function shortName(company) {
  return company
    .replace(/\s+(Limited|Pty Ltd|Pty\. Ltd\.?|Inc\.?|Ltd\.?|LLC|Corp\.?)$/i, '')
    .trim();
}

function parseJob(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  // current.txt format: line[0] = position, line[1] = company name
  const position = lines[0];
  const company = lines[1];
  if (!position || !company) {
    throw new Error('Could not parse position and company from jobs/current.txt. Expected position on line 1 and company on line 3.');
  }
  return { position, company };
}

function buildEmail(company, position) {
  const short = shortName(company);
  return `Subject: Follow-Up: ${position} Application – Work Rights Clarification

Dear Hiring Manager,

Thank you for considering my application for the ${position} role at ${short}. I wanted to reach out proactively to address what I appreciate is a common and reasonable consideration for any employer evaluating candidates on a student visa.

I am confident there will be no gap or uncertainty in my availability, and here is why:

• 15 June 2026 – My full, unrestricted work rights commence automatically as my Master of IT at Deakin University concludes.
• July 2026 – I will lodge my 485 Graduate Visa application (Hong Kong Stream, granting a 5-year visa). My police check and medical examination are already complete; I am simply awaiting my final Letter of Completion from Deakin.
• Upon lodgement, a Bridging Visa is granted automatically, maintaining full, uninterrupted work rights throughout the processing period.
• 30 August 2026 – My current student visa expires, but by this point my Bridging Visa will already be in place, with a 5-year 485 to follow.

In practical terms, I will have unrestricted working rights from 15 June onward, and my 485 application is fully on track with no blockers.

I invite you to explore my portfolio at https://teddyyee-portfolio.vercel.app/, which includes live project demos and technical write-ups that give a fuller picture of how I approach engineering problems.

I am genuinely excited to contribute to ${short}'s mission and would love to bring my fullstack experience in React, Node.js, microservices, and Kubernetes to your team.

I have attached my resume and cover letter for your reference. Please feel free to reach out with any questions.

Best regards,
Tsz Hin Yee (Teddy)
teddyhiny@gmail.com | (+61) 0450407147
`;
}

function main() {
  const jobText = fs.readFileSync(JOB_FILE, 'utf8');
  const { position, company } = parseJob(jobText);

  console.log(`Position : ${position}`);
  console.log(`Company  : ${company}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputFile = path.join(OUTPUT_DIR, 'follow-up-email.md');
  fs.writeFileSync(outputFile, buildEmail(company, position));
  console.log(`\nWritten  : ${outputFile}`);
}

main();
