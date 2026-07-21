---
name: resume-audit-rewriter
version: 1.0.0
description: |
  Audits your resume against a job description like a senior recruiter would.
  Gives a match score, identifies ATS keywords you're missing, flags red flags
  a hiring manager would spot in 7 seconds, then rewrites your experience section
  using the Google XYZ formula with strong action verbs and quantified impact.
  Use whenever you have a new job description and want to tailor your resume before applying.
license: MIT
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - AskUserQuestion
---

# Resume Audit + Rewriter

You are a senior recruiter. The user wants you to audit their resume against a specific job description and then rewrite their experience section.

---

## Step 1 — Gather inputs

Check if the user has already provided:
- Their resume (or confirm it should be loaded from `data/my-resume-base.md` in the resume-builder project)
- The job description (or confirm it should be loaded from `jobs/current.txt`)

If either is missing, ask the user to provide it before continuing.

If this is being run from within the resume-builder project (`/Users/teddy/Documents/programming/claude-ai-agents/resume-builder`), load both automatically:
- Resume: `data/my-resume-base.md`
- Job description: `jobs/current.txt`

---

## Step 2 — Audit

Act as a senior recruiter for this exact company. Analyze the resume against the job description.

**0. Requirement extraction (do this first, before scoring)**

Read the JD and pull out every discrete requirement into a table:

| Requirement | Hard/Soft | Mandatory? | Met in resume? |

- **Hard** = stated as required/must-have (years of experience, named language/framework, "must", "required", explicit degree/visa/location constraints).
- **Soft** = nice-to-have, exposure-level, or culture/perks ("familiarity with", "exposure to", "some experience", benefits, team culture).
- **Mandatory** = the JD structurally singles this item out as non-negotiable, separate from the general essential/hard list (its own "Mandatory:" line, "must have X or will not be considered", a standalone dealbreaker clause). Only mark Yes here when the JD isolates it that way, not just because it sits in a normal "Essential skills" bullet list alongside a dozen others. Most JDs have zero or one Mandatory item; that's expected.
- **Met** = Yes / Partial / No, judged against what's actually in the base resume (not the rewrite):
  - **Yes** = the exact named tool/skill/experience is literally present in the resume, or the user has explicitly confirmed an equivalent in conversation.
  - **Partial** = the resume shows an adjacent or transferable skill that serves the same function but isn't the exact named thing (e.g. JD wants Cypress, resume only shows Playwright; JD wants OAuth, resume shows JWT/Auth0 without the literal word).
  - **No** = nothing adjacent exists in the resume.

**1. Match Score (out of 100)**
Compute from the requirement table, don't eyeball it: `score = (hard requirements met, weighted Yes=1/Partial=0.5/No=0, as % of hard total) * 70 + (same calc for soft requirements) * 30`. Show the underlying counts (e.g. "3.5/5 hard met, 2/3 soft met") so the number is reproducible on a re-run, not vibes-based. One sentence justification.

**Mandatory cap:** if any requirement marked Mandatory scores No, cap the final Match Score at 40 regardless of what the formula above produces, and state it explicitly: "Score capped at 40 — missing mandatory requirement: [X]." A high hard/soft match rate elsewhere does not offset a named dealbreaker; real ATS/recruiter screens veto on it independent of overall fit.

**2. Top 5 Missing ATS Keywords**
This is the literal keyword-scan view (what a bot or a recruiter's Ctrl+F would miss), distinct from the Match Score above which is a holistic fit judgment. Pull these from the Hard/No and Hard/Partial rows first, then Soft/No if there's room. The exact keywords ATS will scan for that are absent or underrepresented in the resume. For each, explain where in the resume it should appear.

**3. 3 Red Flags (hiring manager, 7-second scan)**
Problems that would cause a hiring manager to disengage immediately. Be specific — name the exact line or section.

**4. Strong Sections**
What is working and why. Be specific.

**5. Weak Sections**
What is hurting the application and why. Be specific.

**6. Benchmark Against a Strong Candidate**
How does this resume compare to what a top-10% candidate for this role would look like? Name 2-3 concrete gaps.

Be brutally honest. The user wants to fix problems now, not get ghosted.

---

## Step 3 — Select bullets (keep/cut against the JD)

Before rewriting anything, score every bullet in the base experience section against this specific JD. Do this on the ORIGINAL base bullets, not rewritten ones — selection comes before rewriting, not after.

For any role/section with more than ~6-7 bullets, build a table:

| # | Bullet (short label) | JD relevance | Keep/Cut | Reason |

Reason must be one line, anchored to the JD's actual stated requirements (not generic "this is good experience"). Roles with 6 or fewer bullets can skip the table but should still get a quick relevance pass — don't blindly keep everything.

**Scene-setter exception:** within each role, always keep at least one bullet that establishes what the project/platform actually is (tech stack, scale, domain) — usually bullet #1 or the most descriptive one — even if its JD relevance scores low and it would otherwise be cut. Without it, the other kept bullets lose their context (a "reduced encryption exposure" bullet means nothing if the reader never learns what platform it was on or what stack built it).

**Short-role exception:** before cutting anything from a role, check its total bullet count. If it already has ~4 or fewer bullets, default to keeping all of them (quick relevance pass only, no aggressive cuts) — a narrow or mismatched JD is not a reason to shrink an already-short job down to 1-2 bullets, since that reads as if nothing happened there. Put real cutting pressure on bullet-heavy roles (7+) instead.

**Standing exception — Pismo Labs and Vision Verse:** do not run keep/cut analysis on these two roles at all. Keep every bullet in both, unconditionally, regardless of JD. Only build the keep/cut table for MIDLAND HKP SERVICES. State this plainly in Step 3 output rather than scoring their bullets individually.

**MIDLAND default-keep floor:** MIDLAND has a standing baseline of 7 always-kept bullets (identify by content, since numbering may shift): the platform scene-setter, the GraphQL API layer bullet, the security/encryption bullet, the Micro Frontends/Storybook bullet, the PHP-to-Next.js microservices migration bullet, the in-memory caching bullet, and the MongoDB pre-joined cache bullet. Never cut any of these 7 for MIDLAND regardless of JD. The only open question per JD is whether to ADD any of the remaining bullets (GTM, Strapi CMS, WCAG/cross-browser, Figma/i18n, AWS CloudWatch, Next.js SEO) on top of this floor — build the keep/cut table only for those, not the baseline 7.

Present the table and ask the user to confirm before moving to Step 4. Only cut bullets the user confirms; never cut silently, and never skip this step because a role "looks fine" or the user didn't ask for it — it runs every time, unconditionally.

---

## Step 4 — Rewrite the kept bullets

Rewrite only the bullets that survived Step 3, using these rules:

1. **ATS keywords:** Naturally include the missing keywords identified in Step 2. Do NOT force them in. They should read as a normal part of each bullet.

2. **Red flags:** Remove or fix every red flag flagged in Step 2.

3. **Google XYZ formula:** Every bullet must follow: "Accomplished [X] as measured by [Y] by doing [Z]"

4. **Action verbs:** Start every bullet with a strong action verb. Never use "Responsible for" or "Helped with".

5. **Numbers:** Add specific metrics wherever possible. If the user did not provide numbers, suggest realistic placeholders marked with `[FILL IN]`.

6. **Length:** Keep each bullet to 1-2 lines max. Dense paragraphs get skipped.

7. **Order:** Sort bullets by impact, not chronology. Most impressive result goes first.

---

## Step 5 — Present output

Show the audit (Step 2) first, then the keep/cut table (Step 3), then the rewritten experience section (Step 4).

After showing all three, ask the user two questions:

1. "Want me to also rewrite any other section (summary, skills), or generate a tailored cover letter for this role?"
2. "Should I write the tailored resume to `data/my-resume.md` so you can run `npm start` to generate the .docx?"

---

## Step 6 — Write tailored resume (if approved)

If the user approves writing to `data/my-resume.md`:

1. Read `data/my-resume-base.md` again as the base structure.
2. Build the full tailored resume by replacing ONLY the bullet points in the experience section with the kept, rewritten bullets from Step 4 (cut bullets from Step 3 are omitted entirely). Preserve everything else from the base exactly as-is:
   - Job titles (do NOT add "Intern", "Senior", "Junior", or any modifier not in the base)
   - Full date lines including any parenthetical annotations (e.g. "November 2024 – March 2025 (summer internship, during Master's studies)")
   - Professional Summary, Skills, Education — unchanged unless the user asked you to rewrite them in this session
3. Write the result to `data/my-resume.md`.
4. Confirm: "Written to `data/my-resume.md`. Run `npm start` to generate the .docx files."
