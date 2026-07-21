const { callAI } = require('./ai-client');

function buildPrompt(jobDescription, myResume, myInfo) {
  return `You are a senior career consultant and recruitment expert.

STYLE RULE: Never use em dashes (—) anywhere in your output. Use a comma, period, or rewrite the sentence instead.

My personal information:
${JSON.stringify(myInfo, null, 2)}

My current resume (READ-ONLY reference — do not rewrite or reproduce this, only use it as factual context for scoring and for writing the cover letter):
${myResume}

Job description:
${jobDescription}

For the jobAnalysis.hardCitizenshipRequired field: set it to true ONLY if the job explicitly requires Australian citizenship or permanent residency as a hard requirement (e.g. "must be Australian citizen", "must hold PR", "requires NV1/AGSVA clearance"). Set it to false if the job merely says "full working rights", "right to work in Australia", or lists citizenship as preferred/nice-to-have.

AI TOOLS ACCURACY RULE: In the cover letter, do NOT substitute, add, or remove any specific AI tool names (e.g. ChatGPT, GitHub Copilot, Claude Code, Cursor, Gemini) beyond what is stated in my resume. These are factual records of what was actually used at each job.

Please return ONLY a valid JSON object (no markdown fences, no extra text) with this exact structure:
{
  "meta": {
    "jobTitle": "Exact job title from the description (e.g. Frontend Engineer)",
    "company": "Company name from the description (e.g. TAL Australia)"
  },
  "jobAnalysis": {
    "coreRequirements": ["用中文描述核心要求，技術名詞保留英文，例如：「需要熟悉 React.js 及 RESTful API 開發」"],
    "softSkills": ["用中文描述軟技能，例如：「良好的團隊溝通能力」"],
    "hardCitizenshipRequired": false
  },
  "coverLetter": {
    "body": "Full cover letter text (250-350 words). Professional, enthusiastic but not over the top. Include: opening expressing interest, 2-3 paragraphs on relevant experience, strong call to action closing. REQUIREMENT COVERAGE: Before writing, review every item in jobAnalysis.coreRequirements (including 加分/nice-to-have items). For each item the applicant genuinely has matching experience for (per my current resume above or my personal information), weave in at least a short phrase of real evidence, even if it only fits as a brief clause, so the letter reads as a direct argument for why the applicant meets the JD, not just a highlight reel of the most impressive achievements. Do NOT fabricate experience for requirements the applicant does not have; simply omit those. Do NOT add a labeled section header (e.g. 'Why This Role Fits') - this must stay natural prose. IMPORTANT: You MUST naturally mention the applicant's availability: ${myInfo.availability}. This lets the employer know the availability and work rights situation upfront. Weave it in naturally (e.g. in the opening or closing paragraph). PORTFOLIO: Naturally reference the applicant's portfolio site (${myInfo.portfolio}) in one sentence, mentioning that it includes live project demos and technical blog posts documenting their engineering decisions. Vary the wording each time rather than reusing the same phrasing. Place this in the closing paragraph as an invitation to explore further. FORMATTING: Separate paragraphs with a double newline (\\n\\n) - this is required, not optional, since the output is rendered by splitting on double newlines. Do NOT include any header/address/date lines - just the body paragraphs."
  }
}

Base the job analysis and cover letter strictly on what is actually in "My current resume" above. Return ONLY the JSON, nothing else.`;
}

async function generateContent(prompt) {
  return callAI(prompt);
}

function parseResponse(raw) {
  let cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  // Strip any leading non-JSON text before the opening brace
  const jsonStart = cleaned.indexOf('{');
  if (jsonStart > 0) cleaned = cleaned.slice(jsonStart);
  // Strip any trailing non-JSON text (e.g. chat commentary) after the closing brace
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonEnd !== -1 && jsonEnd < cleaned.length - 1) cleaned = cleaned.slice(0, jsonEnd + 1);
  return JSON.parse(cleaned);
}

module.exports = { buildPrompt, generateContent, parseResponse };
