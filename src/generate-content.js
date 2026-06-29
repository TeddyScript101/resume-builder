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

CONDITIONAL SKILLS RULE: The applicant has the following technologies in their skill set but they are secondary strengths. Include each group in the resume's Backend skills section ONLY IF the job description explicitly mentions the relevant keywords. If the JD does not mention them, omit them entirely from the skills list.
- C#, ASP.NET Core, .NET: include ONLY IF the JD mentions ".NET", "ASP.NET", "C#", or "dotnet"
- PHP, Laravel: include ONLY IF the JD mentions "PHP" or "Laravel"

PROJECTS RULE: If the applicant's resume (my-resume.md) contains a Projects section, you MUST preserve ALL entries from it exactly in the JSON output under the "projects" array — do not remove, merge, relocate, or omit any project entries. The applicant also has personal projects listed under my-info.projects; do NOT pull from my-info.projects into the resume. In the cover letter ONLY, you MAY reference one relevant project from my-info.projects (with its demo URL) if the project's tech stack directly matches a key requirement in the JD. If no project is a clear match, omit entirely. Never force a project mention.

BACKEND/FULLSTACK RULE: If the job involves backend or fullstack development, you MUST weave in the applicant's experience with MVC architecture and middleware design. Specifically:
- In resume experience bullets: mention structuring server-side code using MVC patterns and building/composing middleware (e.g. authentication, logging, error-handling middleware chains in Express or Nest.js interceptors/guards/pipes).
- In the cover letter body: include one natural sentence about applying MVC structure and middleware to build maintainable, scalable server-side systems.

TITLE CONSISTENCY RULE: Do not use "Senior" in the professional summary unless the applicant has a formal "Senior" job title in their work experience. Let the experience bullets demonstrate senior-level scope and impact.

JOB TITLE PRESERVATION RULE: In the experience section, copy each job title EXACTLY as it appears in "My current resume" (my-resume.md). Ignore the title field in "My personal information" (my-info.json) — it may differ and must not be used. Do NOT add, remove, or change any words in job titles (e.g. do not add "Intern", "Senior", "Junior", or "Lead" unless already present in my-resume.md).

AI TOOLS ACCURACY RULE: In experience bullets, do NOT substitute, add, or remove any specific AI tool names (e.g. ChatGPT, GitHub Copilot, Claude Code, Cursor, Gemini). These are factual records of what was actually used at that job. Copy them exactly as they appear in the resume bullet — even if the job description mentions different AI tools.

IDENTITY RULE: Use the professional identity already established in my resume's Professional Summary as the base. Do not override it to always say "Full Stack". If the summary in my resume says "Front End Engineer", keep that framing. If it says "Full Stack", keep that. You may adjust wording to incorporate JD keywords, but preserve the core identity as written.


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
        "location": "City, Country (copy exactly from my-info, e.g. Melbourne, VIC or Hong Kong)",
        "duration": "DD/MM/YYYY – DD/MM/YYYY (use full dates exactly as provided in my-info, e.g. 18/11/2024 – 03/03/2025)",
        "bullets": ["achievement 1", "achievement 2", "achievement 3"]
      }
    ],
    "projects": [
      {
        "name": "Project name exactly as in my-resume.md",
        "context": "e.g. Academic Project, Deakin University — copy exactly, omit field if not present",
        "bullets": ["bullet 1", "bullet 2"]
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
    "body": "Full cover letter text (250-350 words). Professional, enthusiastic but not over the top. Include: opening expressing interest, 2-3 paragraphs on relevant experience, strong call to action closing. IMPORTANT: You MUST naturally mention the applicant's availability: ${myInfo.availability}. This lets the employer know the availability and work rights situation upfront. Weave it in naturally (e.g. in the opening or closing paragraph). PORTFOLIO: Naturally reference the applicant's portfolio site (${myInfo.portfolio}) in one sentence, mentioning that it includes live project demos and technical blog posts documenting their engineering decisions. Place this in the closing paragraph as an invitation to explore further. Do NOT include any header/address/date lines - just the body paragraphs."
  }
}

Tailor everything specifically to this job. Use exact keywords from the job description. Only include the most relevant skills. Return ONLY the JSON, nothing else.`;
}

async function generateContent(prompt) {
  return callAI(prompt);
}

function parseResponse(raw) {
  let cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  // Strip any leading non-JSON text before the opening brace
  const jsonStart = cleaned.indexOf('{');
  if (jsonStart > 0) cleaned = cleaned.slice(jsonStart);
  return JSON.parse(cleaned);
}

module.exports = { buildPrompt, generateContent, parseResponse };
