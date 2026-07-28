# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Note: the sibling `job-tracker` project (one directory up, not part of this git repo) is deprecated and no longer used. Application tracking now lives in `server/` within this repo.

## Overview

This repository contains two Node.js parts:

1. **resume-builder** (root `src/`) - Generates tailored resume and cover letter .pdf files from job descriptions using Claude Pro
2. **server** (`server/`) - Express + Mongoose REST API that persists generated applications to MongoDB, replacing the old job-tracker CLI

resume-builder uses the Claude Pro CLI for AI features; the server is a plain Node/Express/MongoDB stack with no AI integration.

## Quick Start

### Resume Builder

```bash
cd resume-builder
npm install
# Edit jobs/current.txt with a job description, then:
npm start
# or: node src/main.js
```

Generates two .pdf files (resume + cover letter) in `output/` directory and POSTs the application record to the tracking server's API (`http://localhost:5000/api/applications`, silently skipped if the server isn't running).

### Server (application tracking API)

```bash
cd server
npm install
# Requires MongoDB running locally (or MONGO_URI set) and a ../.env file
npm start
# or for auto-reload: npm run dev
```

Listens on `PORT` (default 5000), connects to `MONGO_URI` (default `mongodb://localhost:27017/resume-builder`), exposes CRUD at `/api/applications`.

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
6. POST the application record to the tracking server's API (`http://localhost:5000/api/applications`)

**Important**: The prompt includes a STYLE RULE to never use em dashes (—), enforcing a no-em-dash global preference.

### Server (application tracking API)

**Purpose**: Persist and serve generated applications (resume/cover letter content + status) as the system of record, replacing the deprecated job-tracker CLI.

**Key files**:
- `server/index.js` - Express app entry point, connects to MongoDB, mounts `/api/applications`
- `server/routes/applications.js` - Route definitions (GET all, GET one, POST, PUT, DELETE)
- `server/controllers/applicationController.js` - Route handlers
- `server/models/Application.js` - Mongoose schema

**Data model** (`Application` Mongoose schema):
- Fields: `company_name`, `position`, `resume_content`, `cover_letter_content`, `status`, `created_at`
- Status enum: `applied`, `interview`, `rejected`, `offer`, `ghosted`

**Dedup behavior**: `POST /api/applications` checks for an existing record with the same `company_name` + `position` (case-insensitive) created the same calendar day; if found, it updates that record's content instead of inserting a duplicate. This is what lets `npm start` be re-run for the same job without spamming the tracker.

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
├── server/
│   ├── index.js
│   ├── routes/
│   │   └── applications.js
│   ├── controllers/
│   │   └── applicationController.js
│   └── models/
│       └── Application.js
├── package.json
└── README.md
```

## Development Notes

- resume-builder's CLI (`src/`) uses file I/O and the Claude Pro CLI only; no external APIs
- resume-builder hardcodes paths relative to project root (uses `__dirname` to navigate)
- resume-builder loads its own `.env` (one directory up from `server/`, at `server/../.env`) for `MONGO_URI`/`PORT`
- `server` requires a running MongoDB instance to start; it exits on connection failure rather than falling back

## Testing

No automated test suite is present. Changes should be validated manually:
- resume-builder: Verify .pdf output is well-formed and content is tailored to the job description
- server: Verify CRUD requests against `/api/applications` (e.g. via curl/Postman) and confirm same-day dedup updates rather than duplicates
