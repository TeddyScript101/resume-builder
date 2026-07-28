# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Note: this file documents both `resume-builder` (this repo) and its sibling `job-tracker` project, which lives one directory up and is not part of this git repo.

## Overview

This repository contains two Node.js projects:

1. **resume-builder** - Generates tailored resume and cover letter .pdf files from job descriptions using Claude Pro
2. **job-tracker** - Tracks job applications and generates analytics reports (Chinese interface)

Both projects use Claude Pro CLI integration for AI features and require Node.js.

## Quick Start

### Resume Builder

```bash
cd resume-builder
npm install
# Edit jobs/current.txt with a job description, then:
npm start
# or: node src/main.js
```

Generates two .pdf files (resume + cover letter) in `output/` directory and POSTs the application record to job-tracker's API (`http://localhost:5000/api/applications`, silently skipped if the server isn't running).

### Job Tracker

```bash
cd job-tracker
npm install
# Then use any of these commands:
node src/tracker.js add <company> <position> [status]
node src/tracker.js list
node src/tracker.js report
node src/tracker.js search <keyword>
node src/tracker.js edit <id> [field=value]
node src/tracker.js delete <id>
```

## Architecture

### Resume Builder

**Purpose**: Transform job descriptions into tailored application materials (resume + cover letter).

**Key files**:
- `src/main.js` - Entry point. Orchestrates prompt building, Claude invocation, and PDF generation
- `src/generate-content.js` - Constructs the prompt sent to Claude, handles JSON parsing
- `src/parse-resume.js` - Parses `data/my-resume.md` verbatim into structured sections (Claude no longer rewrites the resume body, only scores fit and writes the cover letter)
- `src/create-pdf.js` - Builds resume/cover letter PDFs (`src/create-docx.js` still exists but is unused/commented out in `main.js`)

**Data flow**:
1. Read job description from `jobs/current.txt`
2. Load personal info (`data/my-info.json`) and base resume (`data/my-resume.md`, parsed verbatim)
3. Build prompt with all context and send to Claude via `claude --print` CLI
4. Parse returned JSON (must contain meta, jobAnalysis, resume, coverLetter sections)
5. Create two separate PDF documents with tailored content
6. POST the application record to job-tracker's API (`http://localhost:5000/api/applications`)

**Important**: The prompt includes a STYLE RULE to never use em dashes (—), enforcing a no-em-dash global preference.

### Job Tracker

**Purpose**: Maintain a database of job applications with status tracking and analytics.

**Key files**:
- `src/tracker.js` - CLI interface with all commands (add, list, report, search, edit, delete)
- `src/utils.js` - Helper functions
- `data/applications.json` - Persistent application records
- `config/settings.json` - Configuration

**Data model** (applications.json):
- Each record: id, company, position, appliedDate, status, rejectionDate, rejectionReason, notes, source
- Status values: `pending`, `interview`, `rejected`, `offer`

**Commands**:
- `add` - Creates new application record with auto-generated timestamp
- `list` - Displays applications grouped by status with statistics
- `report` - Generates markdown report with failure reason analysis, trends, and improvement suggestions
- `search` - Filters by company or position name
- `edit` - Updates fields in a record by ID
- `delete` - Removes a record

## Claude Integration

**Resume Builder only** uses Claude Pro via the CLI:
- Invokes `claude --print < prompt.txt` (stdin/stdout)
- Sends a detailed prompt with personal info, base resume, and job description
- Expects valid JSON response (no markdown fences)
- Timeout: 120 seconds, max buffer: 10MB

**Note**: The prompt requires Claude to mention availability ("Full Working Rights in Australia") naturally in both the resume Professional Summary and cover letter body. It does NOT appear in the document header.

## File Structure

```
resume-builder/
├── src/
│   ├── main.js
│   ├── generate-content.js
│   ├── parse-resume.js
│   └── create-pdf.js
├── data/
│   ├── my-info.json
│   └── my-resume.md
├── jobs/
│   └── current.txt
├── output/
├── package.json
└── README.md

job-tracker/
├── src/
│   ├── tracker.js
│   └── utils.js
├── data/
│   └── applications.json
├── config/
│   └── settings.json
├── output/
├── scripts/
│   └── init.sh
├── package.json
└── README.md
```

## Development Notes

- Both projects use `require('child_process')` and file I/O only; no external APIs beyond Claude
- Resume builder hardcodes paths relative to project root (uses `__dirname` to navigate)
- Job tracker supports multiple update fields in one edit command (e.g., `edit <id> status=rejected rejectionReason="..."`)
- All user-facing strings in job-tracker are in Chinese (Traditional)
- Job tracker automatically creates `output/` directory when generating reports
- Applications are sorted by status or company in reports, never by date in list view

## Testing

No automated test suite is present in either project. Changes should be validated manually:
- Resume builder: Verify .pdf output is well-formed and content is tailored to the job description
- Job tracker: Test all CLI commands with sample data and verify JSON persistence
