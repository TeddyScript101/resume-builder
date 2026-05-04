# Resume Builder — Claude Code

Paste a job description, get a tailored **Resume** and **Cover Letter** as `.docx` files in seconds.
Works with **Claude** (no API key needed, uses Claude Pro) or **OpenAI** (requires an API key).

---

## Prerequisites

Before starting, make sure you have:

- **Node.js** (v18 or later) — https://nodejs.org
- One of the following AI backends:
  - **Claude (default):** Install Claude Code CLI and log in with a Claude Pro account
    ```bash
    npm install -g @anthropic-ai/claude-code
    claude   # log in once
    ```
  - **OpenAI:** An OpenAI API key from platform.openai.com

---

## First-time setup

### 1. Clone and install

```bash
git clone <repo-url>
cd resume-builder
npm install
```

### 2. Add your resume

Run the onboarding script:

```bash
node onboard.js
```

The first time you run it, it will create a file called `data/my-resume-raw.txt` and ask you to paste your resume into it.

Open `data/my-resume-raw.txt` in any text editor, paste in your resume as plain text, then run the command again:

```bash
node onboard.js
```

Claude will read your resume and automatically generate:
- `data/my-info.json` — your structured personal info
- `data/my-resume.md` — your resume in Markdown format

### 3. Check your availability

Open `data/my-info.json` and find the `"availability"` field. Update it to describe your work rights and start date. Examples:

```
"immediately available with full working rights"
"full working rights from 1 July 2026"
"available from September 2026 on a sponsored visa"
```

That's it — you're ready to use the tool.

### 4. (OpenAI users only) Configure your API key

Copy `.env.example` to `.env` and fill in your key:

```bash
cp .env.example .env
```

Then edit `.env`:

```
AI_BACKEND=openai
OPENAI_API_KEY=sk-...
```

Claude users can skip this step — no `.env` file needed.

---

## Everyday use

1. Find a job you want to apply for and copy the full job description
2. Open `jobs/current.txt` and replace its contents with the job description
3. Run:
   ```bash
   node src/main.js
   ```
4. Open the two new files in `output/`:
   - `resume-<company>-<date>.docx`
   - `cover-letter-<company>-<date>.docx`

Each run takes about 30–60 seconds while Claude tailors the content to the job.

---

## Updating your info

Changed jobs or moved cities? Edit `data/my-info.json` directly — it's just a text file.
You can also edit `data/my-resume.md` to refine how your experience is described.

---

## File structure

```
resume-builder/
├── onboard.js              ← Run this once to set up your personal data
├── src/
│   └── main.js             ← Run this every time you apply for a job
├── data/
│   ├── my-resume-raw.txt   ← Paste your existing resume here (first-time setup)
│   ├── my-info.json        ← Your personal info (auto-generated, edit freely)
│   ├── my-resume.md        ← Your resume in Markdown (auto-generated, edit freely)
│   ├── my-info.example.json
│   └── my-resume.example.md
├── jobs/
│   └── current.txt         ← Paste the job description here before each run
└── output/                 ← Your generated .docx files appear here
```

---
---

# Resume Builder — Claude Code（中文說明）

貼上職位描述，幾十秒內生成度身訂造的**履歷**和**求職信** `.docx` 檔案。
不需要 API key，使用你的 Claude Pro 帳號即可。

---

## 前置需求

開始前請確認已安裝：

- **Node.js**（v18 或以上）— https://nodejs.org
- **Claude Code CLI** — 在終端機執行以下指令安裝：
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```
- **Claude Pro** 訂閱（claude.ai/pro）— 安裝後在終端機執行 `claude` 登入一次

---

## 首次設定

### 1. Clone 專案並安裝套件

```bash
git clone <repo-url>
cd resume-builder
npm install
```

### 2. 匯入你的履歷

執行以下指令：

```bash
node onboard.js
```

第一次執行時，它會自動建立 `data/my-resume-raw.txt` 並提示你把履歷貼進去。

用任何文字編輯器打開 `data/my-resume-raw.txt`，把你的履歷貼入（純文字格式），然後再執行一次：

```bash
node onboard.js
```

Claude 會讀取你的履歷，自動生成：
- `data/my-info.json` — 你的個人資料（結構化格式）
- `data/my-resume.md` — 你的履歷（Markdown 格式）

### 3. 填寫你的工作簽證 / 可入職日期

打開 `data/my-info.json`，找到 `"availability"` 欄位，更新為你的實際情況，例如：

```
"immediately available with full working rights"
"full working rights from 1 July 2026"
"available from September 2026 on a sponsored visa"
```

完成！可以開始使用了。

---

## 日常使用

1. 找到想申請的職位，複製完整的職位描述
2. 打開 `jobs/current.txt`，將內容替換為職位描述
3. 執行：
   ```bash
   node src/main.js
   ```
4. 在 `output/` 資料夾打開生成的兩個檔案：
   - `resume-<公司名>-<日期>.docx`
   - `cover-letter-<公司名>-<日期>.docx`

每次大約需要 30–60 秒，Claude 會根據職位內容度身訂造。

---

## 更新個人資料

換工作了或搬家了？直接編輯 `data/my-info.json` 即可，它只是一個普通文字檔。
也可以編輯 `data/my-resume.md` 來調整你的經歷描述。

---

## 檔案結構

```
resume-builder/
├── onboard.js              ← 首次設定時執行（只需一次）
├── src/
│   └── main.js             ← 每次申請職位時執行
├── data/
│   ├── my-resume-raw.txt   ← 貼入你原有的履歷（首次設定用）
│   ├── my-info.json        ← 你的個人資料（自動生成，可自由編輯）
│   ├── my-resume.md        ← 你的 Markdown 履歷（自動生成，可自由編輯）
│   ├── my-info.example.json
│   └── my-resume.example.md
├── jobs/
│   └── current.txt         ← 每次申請前貼入職位描述
└── output/                 ← 生成的 .docx 檔案會出現在這裡
```
