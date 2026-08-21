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
- **Real job adverts** broken into individual requirements, each mapped to the lessons covering it
- **208 quiz questions**, two per lesson, with an explanation on every answer
- **Spaced repetition** over all questions and terms, so what you read actually stays
- **Narration** — listen to any lesson like an audiobook, with follow-along highlighting
- **Progress tracking** stored only in your browser — nothing is uploaded anywhere

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

The **Paths** tab holds two real junior adverts split into their individual lines. Each
line shows what it is actually asking for and links to the lessons that cover it, with a
readiness percentage that moves as you complete them. It also maps CS50's Introduction to
Cybersecurity week by week onto these stages, so you are not studying the same material
twice.

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

Built mobile-first for iPhone, installable to the Home Screen.

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
