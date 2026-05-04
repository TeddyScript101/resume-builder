const { callAI } = require('./ai-client');

function buildPrompt(jobDescription, myResume, myInfo) {
  return `You are a senior career consultant and recruitment expert.

STYLE RULE: Never use em dashes (—) anywhere in your output. Use a comma, period, or rewrite the sentence instead.

My personal information:
${JSON.stringify(myInfo, null, 2)}

My current resume:
${myResume}

Job description:
${jobDescription}

For the jobAnalysis.hardCitizenshipRequired field: set it to true ONLY if the job explicitly requires Australian citizenship or permanent residency as a hard requirement (e.g. "must be Australian citizen", "must hold PR", "requires NV1/AGSVA clearance"). Set it to false if the job merely says "full working rights", "right to work in Australia", or lists citizenship as preferred/nice-to-have.

Please return ONLY a valid JSON object (no markdown fences, no extra text) with this exact structure:
{
  "meta": {
    "jobTitle": "Exact job title from the description (e.g. Frontend Engineer)",
    "company": "Company name from the description (e.g. TAL Australia)"
  },
  "jobAnalysis": {
    "coreRequirements": ["用中文描述核心要求，技術名詞保留英文，例如：「需要熟悉 React.js 及 RESTful API 開發」"],
    "softSkills": ["用中文描述軟技能，例如：「良好的團隊溝通能力」"],
    "suitabilityScore": 8,
    "suitabilityReason": "用中文解釋這個分數的原因，分析申請人與職位的匹配程度（滿分10分）",
    "hardCitizenshipRequired": false
  },
  "resume": {
    "summary": "Tailored professional summary (2-3 sentences) using keywords from the job description. You MUST naturally mention the applicant's availability: ${myInfo.availability}. Weave it in naturally (e.g. as a closing sentence about upcoming availability or work rights).",
    "skills": {
      "AI Tooling & Agents": ["skill1", "skill2"],
      "Frontend": ["skill1", "skill2"],
      "Backend": ["skill1", "skill2"],
      "DevOps & CI/CD": ["skill1", "skill2"],
      "Tools": ["skill1", "skill2"]
    },
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "duration": "DD/MM/YYYY – DD/MM/YYYY (use full dates exactly as provided in my-info, e.g. 18/11/2024 – 03/03/2025)",
        "bullets": ["achievement 1", "achievement 2", "achievement 3"]
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "school": "School Name",
        "duration": "MM/YYYY – Present (use full month/year as provided)",
        "gpa": "WAM/GPA string exactly as provided (e.g. WAM: 83/100), or empty string if none",
        "highlights": ["Must include ALL activities, leadership roles, and academic distinctions exactly as provided — do not omit any"]
      }
    ]
  },
  "coverLetter": {
    "body": "Full cover letter text (250-350 words). Professional, enthusiastic but not over the top. Include: opening expressing interest, 2-3 paragraphs on relevant experience, strong call to action closing. IMPORTANT: You MUST naturally mention the applicant's availability: ${myInfo.availability}. This lets the employer know the availability and work rights situation upfront. Weave it in naturally (e.g. in the opening or closing paragraph). Do NOT include any header/address/date lines - just the body paragraphs."
  }
}

Tailor everything specifically to this job. Use exact keywords from the job description. Only include the most relevant skills. Return ONLY the JSON, nothing else.`;
}

async function generateContent(prompt) {
  return callAI(prompt);
}

function parseResponse(raw) {
  // Strip any accidental markdown fences
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { buildPrompt, generateContent, parseResponse };
