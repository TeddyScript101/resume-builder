const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function callAI(prompt) {
  const backend = (process.env.AI_BACKEND || 'claude').toLowerCase();
  if (backend === 'openai') return callOpenAI(prompt);
  return callClaude(prompt);
}

function callClaude(prompt) {
  const tmpFile = path.join(__dirname, '../.tmp_prompt.txt');
  fs.writeFileSync(tmpFile, prompt);
  try {
    return execSync(`claude --print < "${tmpFile}"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 300000
    }).trim();
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

async function callOpenAI(prompt) {
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3
  });
  return response.choices[0].message.content.trim();
}

module.exports = { callAI };
