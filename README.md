# Cipher School

Learn cybersecurity from absolute beginner to expert level — in plain language.

**Live:** https://ashfaaqaf.github.io/cipher-school-cybersecurity/

Most security roadmaps hand you a list of topics and leave you to find the explanations
yourself. This one contains the explanations. Every lesson is written out in full, in
words a beginner can follow, with the jargon decoded as it appears.

## What is in it

- **13 stages**, beginner through expert, in the order they should be learned
- **104 written lessons** — not topic titles, the actual teaching
- **393 terms decoded** in a searchable glossary, each explained without more jargon
- **8 career paths** (SOC, red team, AppSec, cloud, DFIR, GRC, research, fastest-to-hired) with stage order
- **Nine real job adverts**, all but one Sri Lankan, broken into individual requirements and mapped to the lessons covering each — plus sourced market context
- **208 quiz questions**, two per lesson, with an explanation on every answer
- **Spaced repetition** over all questions and terms, so what you read actually stays
- **A daily plan** built from your weekly hour budget, with a streak and a week strip
- **Narration** — listen to any lesson like an audiobook, with follow-along highlighting
- **Progress tracking** stored only in your browser — nothing is uploaded anywhere
- **Back up and restore** progress as a JSON file, so clearing your browser is survivable
- **Works fully offline** once installed, via a service worker generated at build time

Every lesson follows the same shape, because that shape is what makes an idea stick:

| Section | What it does |
| --- | --- |
| The whole idea | The entire lesson in one sentence |
| Think of it like | An everyday comparison to hold on to |
| The explanation | Short paragraphs that survive being read out loud |
| Jargon decoder | The terms you will meet in the wild, in human |
| Why this matters | The real-world consequence |
| Go and do this | Something to actually do today, safely |
| Check yourself | A question you should be able to answer |

## Stage 12 and the job mapping

Junior adverts name specific tools and tasks that most curricula skip: Burp Suite, OWASP
ZAP, Nmap, VAPT workflow, security audits, control testing, risk registers. Stage 12
covers exactly those, including how to write a finding somebody acts on and how to apply
with no experience.

The **Paths** tab holds nine real adverts split into their individual lines, sorted by how reachable they are: three
internships, two junior roles, three a few years out and one senior role. The distant ones are there deliberately —
they show where each path leads, and how much of what an eight-year advert asks for is still stages 01, 02 and 04.
Every advert carries its source and the date it was seen, because listings expire and the wording should be
checkable against the original. Each
line shows what it is actually asking for and links to the lessons that cover it, with a
readiness percentage that moves as you complete them. It also maps CS50's Introduction to
Cybersecurity week by week onto these stages, so you are not studying the same material
twice.

## The daily plan

104 lessons is a backlog, not a habit. Set a weekly hour budget and how many days you
intend to study, and the top of the Learn tab answers one question: what do I do today.
Review comes before new reading, always — cards arrive just before you would forget them,
so a skipped review costs more than a skipped lesson.

Two decisions worth knowing. A day is capped at four lessons however large the budget,
because a list of twelve is a backlog wearing a plan's clothing and nobody starts one. And
lessons are budgeted at the stage's own hour estimate — roughly two and a half hours —
rather than the six minutes it takes to read the page, because the stage hours cover the
lab, the notes and the exercise. Budgeting on reading time produced a cheerful twelve-
lesson day and a course nobody would finish.

The streak counts consecutive days with any activity, and yesterday still counts, since
breaking a streak at midnight punishes people for not having studied yet on a day that is
still in progress. Dates are local, not UTC — `toISOString` would roll the day over at
5:30am in Colombo. `node plan.test.ts` covers both.

## How the review system works

Cards unlock as you finish lessons. Each card comes back just before you would have
forgotten it: get it right and the gap grows — a day, six days, then weeks; get it wrong
and it resets and returns in the same session. The scheduler is SM-2 with the two
adjustments most implementations end up making — *hard* shrinks the interval rather than
merely slowing its growth, and *easy* earns a bonus multiplier. Intervals are whole days
and capped at a year.

The logic lives in `app/srs.ts` and has a self-check with no test framework to install:

```bash
node srs.test.ts
```

## Narration

Two engines, and the app prefers the better one it can actually use.

**Studio** plays pre-generated ElevenLabs audio shipped as static files, with section
marks taken from the API's character-level timings so highlighting and skipping work
exactly as they do live. **Device** falls back to the speech voices already installed on
the machine — free, offline, and available for every lesson whether or not studio audio
was generated for it.

The narrator is an original synthetic voice designed from a written brief. It is not a
clone of any performer and no film audio was used to create it — cloning a real actor's
voice is a copyright and personality-rights problem, not a technical one.

### Pronunciation

Narration text is rewritten before it reaches either engine, because prose written for the
eye reads badly aloud: `SSRF` gets spelled out, `chmod 755` becomes "ch mod 7 5 5",
`/var/log` becomes "slash var slash log", `NIST` stays a word while `CVSS` becomes letters.
The same rules run in the browser and in the generation script, so both engines pronounce
identically. `node pronounce.test.ts` checks the rule ordering.

### Generating the studio audio

The API key never reaches the browser. This is a static site with no server to proxy
through, so audio is generated ahead of time and served as ordinary files.

```bash
export ELEVENLABS_API_KEY=...
npm run voice:design            # designs candidates, writes mp3s to .voice-drafts/
node scripts/design-voice.mjs --keep 2
export ELEVENLABS_VOICE_ID=...  # printed by the previous command
npm run voice:cost              # dry run: character count and estimated cost
npm run voice:build             # generate everything
```

Roughly 215,000 characters across the 96 lessons. Generation is incremental — a lesson is
only regenerated when its text changes, so editing one lesson costs one lesson.

Alternatively, run it without handling the key locally at all: add `ELEVENLABS_API_KEY`
and `ELEVENLABS_VOICE_ID` as repository secrets, then run the **Generate narration**
workflow from the Actions tab. Use its `limit` input to sample a few lessons first.

On iPhone, Settings → Accessibility → Spoken Content → Voices downloads much better
device voices than the defaults. iOS stops narration when the screen locks.

## Design notes

The colour scheme is chosen for learning rather than decoration. A deep blue canvas
supports sustained focus, green always means progress and never warning, amber carries
attention without triggering the anxiety response red does, and each of the twelve stages
recolours the interface with its own hue — distinct colour schemes create separate memory
traces, which makes the stages easier to keep apart.

Surfaces use a Liquid Glass material — translucent, blurred, with a specular top edge and
concentric radii — so hierarchy reads through depth rather than borders. Motion uses
spring curves, sheets are drag-to-dismiss, and everything collapses gracefully under
`prefers-reduced-motion`. Text passes WCAG AA contrast in both the dark and light themes.

Built phone-first and installable to the Home Screen, then widened out. Above 1024px the
bottom dock becomes a floating vertical rail, the hero splits into two columns, card grids
go multi-column, and the lesson reader stops being a bottom sheet and becomes a centred
dialog. All of that lives in `app/desktop.css` behind a single media query, so a desktop
rule can never affect a phone.

## Offline and backups

A service worker is generated by `scripts/make-sw.mjs` after each build, precaching the
files that build actually produced. Hand-maintaining that list would go stale on the next
build and fail silently, which is the worst way for a cache to be wrong — so the list is
derived from `out/`, and the cache name is a hash of it, meaning a new build is
automatically a new cache and the old one is dropped on activate.

Navigations go to the network first and fall back to the cached page, so a new deploy is
picked up but the app still opens with no signal. Everything else is cache-first, which is
safe because Next content-hashes its filenames — a changed file is a different URL. Audio
is deliberately excluded from precaching; a full narration library is tens of megabytes
and forcing that down on a first visit would be hostile, so it caches as you listen.

Progress lives in `localStorage` and nowhere else, which means clearing your browser
deletes it. **Back up** writes a dated JSON file; **Restore** reads one back. Restore
validates rather than trusts — wrong format, a newer version, an oversized file and
malformed entries are all rejected or skipped, and the UI reports what it dropped.
`node backup.test.ts` covers the rejection paths.

## Tools

`tools/logtriage/` — a small standard-library Python CLI that reads an SSH auth log and
reports password spraying, brute force, and successful logins that followed repeated
failures. It is the working version of the exercise in lessons 03-1 and 03-2.

```bash
cd tools/logtriage
python logtriage.py --demo
python test_logtriage.py
```

## Practise legally

Only test systems you own, systems you have written permission to test, or labs built for
practice. Unauthorised access is a crime in most countries even when nothing breaks and
no harm was intended. Every offensive technique covered here has a free, legal place to
practise it, linked inside the relevant stage.

## Sources

The curriculum is grounded in published standards, not opinion: NIST CSF 2.0,
NIST SP 800-61r3, NIST SSDF (SP 800-218), the NIST post-quantum standards (FIPS 203/204/205),
MITRE ATT&CK v18, MITRE ATLAS, OWASP Top 10 (2025), the OWASP API and LLM Top 10s, and the
NICE workforce framework. Practice links point at PortSwigger Web Security Academy,
pwn.college, OverTheWire and TryHackMe.

## Running it locally

```bash
npm install
npm run dev
```

Static export for GitHub Pages, built and deployed by `.github/workflows/pages.yml` on
every push to `main`:

```bash
PAGES_BASE_PATH=cipher-school-cybersecurity npm run build
```

Next.js 16 static export, no backend, no database, no tracking. Progress lives in
`localStorage` and never leaves the device.
