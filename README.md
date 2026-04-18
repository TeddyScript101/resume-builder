# Resume Builder - Claude Code 版本

自動根據職位描述生成客製化的 Resume 和 Cover Letter。
**無需 API Key** — 直接使用你的 Claude Pro 帳號（透過 Claude Code CLI）。

## 🚀 快速開始

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **更新個人信息**（已預填 Teddy 的資料）
   - `data/my-info.json` — 結構化個人資料
   - `data/my-resume.md` — Resume 模板

3. **添加職位描述**
   在 `jobs/` 文件夾中建立 `.txt` 文件

4. **運行程序**
   ```bash
   node src/main.js jobs/your-job-title.txt
   ```

## 📁 文件結構

```
resume-builder/
├── src/main.js          # 主程式（使用 claude --print）
├── data/
│   ├── my-info.json     # 個人基礎信息
│   └── my-resume.md     # Resume 模板
├── jobs/
│   └── example-job.txt  # 範例職位描述
├── output/              # 生成結果存放位置
├── package.json
├── .gitignore
└── README.md
```

## 使用示例

```bash
node src/main.js jobs/example-job.txt
```

## 功能

- ✅ 無需 API Key（使用 Claude Code CLI + Claude Pro）
- ✅ 自動分析職位要求
- ✅ 生成客製化的 Resume
- ✅ 生成專業的英文 Cover Letter
- ✅ 結果自動保存為 Markdown 文件（`output/`）

## 輸出格式

每次執行會生成 `output/<job-name>-<date>.md`，包含：
1. **職位分析** — 5 個核心要求 + 3 個軟技能
2. **客製化 Resume** — 針對職位優化的版本
3. **Cover Letter** — 250-350 字專業英文信件
