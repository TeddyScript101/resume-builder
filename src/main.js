#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function buildPrompt(jobDescription, myResume, myInfo) {
  return `你是一位資深的職業生涯顧問和招聘專家。

我的基礎信息：
${myInfo}

我的 Resume：
${myResume}

招聘職位描述：
${jobDescription}

請幫我完成以下任務：

1. **分析職位需求**
   - 列出 5 個最核心的職位要求
   - 列出 3 個理想的軟技能

2. **客製化 Resume**
   - 根據職位重新排列和強調相關經驗
   - 使用職位描述中的關鍵詞
   - 強調最相關的 3 個成就
   - 保持原有格式，針對這個職位優化

3. **專業的 Cover Letter（英文）**
   - 開場白：表達對公司和職位的興趣
   - 中間段落：說明為什麼適合這個職位，突出最相關的 3 個經驗
   - 結尾：強烈的行動呼籲
   - 語氣：專業、熱情、但不過分
   - 長度：250-350 字

請分別標記每個部分，使用以下格式：

---
## 職位分析
[內容]

---
## 客製化 Resume
[內容]

---
## Cover Letter
[內容]
---`;
}

function generateWithClaude(prompt) {
  console.log('🤖 正在透過 Claude Code 生成內容...\n');

  // Write prompt to a temp file to avoid shell escaping issues
  const tmpFile = path.join(__dirname, '../.tmp_prompt.txt');
  fs.writeFileSync(tmpFile, prompt);

  try {
    const result = execSync(`claude --print < "${tmpFile}"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120000
    });
    return result;
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

function main() {
  const jobDescriptionPath = process.argv[2];

  if (!jobDescriptionPath) {
    console.log('❌ 使用方法: node src/main.js <job-description-file>');
    console.log('📝 例如: node src/main.js jobs/google-software-engineer.txt');
    process.exit(1);
  }

  if (!fs.existsSync(jobDescriptionPath)) {
    console.error(`❌ 文件不存在: ${jobDescriptionPath}`);
    process.exit(1);
  }

  console.log(`📄 讀取職位描述: ${jobDescriptionPath}`);

  const jobDescription = readFile(jobDescriptionPath);
  const myResume = readFile(path.join(__dirname, '../data/my-resume.md'));
  const myInfoRaw = readFile(path.join(__dirname, '../data/my-info.json'));
  const myInfo = JSON.parse(myInfoRaw);

  const prompt = buildPrompt(jobDescription, myResume, JSON.stringify(myInfo, null, 2));
  const result = generateWithClaude(prompt);

  const fileName = path.basename(jobDescriptionPath, path.extname(jobDescriptionPath));
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = path.join(__dirname, '../output');
  const outputPath = path.join(outputDir, `${fileName}-${timestamp}.md`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, result);

  console.log('\n✅ 成功生成！');
  console.log(`📁 結果已保存到: ${outputPath}\n`);
  console.log('='.repeat(60));
  console.log(result);
  console.log('='.repeat(60));
}

main();
