# Cipher School

Learn cybersecurity from absolute beginner to expert level — in plain language.

**Live:** https://ashfaaqaf.github.io/cipher-school-cybersecurity/

Most security roadmaps hand you a list of topics and leave you to find the explanations
yourself. This one contains the explanations. Every lesson is written out in full, in
words a beginner can follow, with the jargon decoded as it appears.

## What is in it

- **12 stages**, beginner through expert, in the order they should be learned
- **96 written lessons** — not topic titles, the actual teaching
- **369 terms decoded** in a searchable glossary, each explained without more jargon
- **7 career paths** (SOC, red team, AppSec, cloud, DFIR, GRC, research) with stage order
- **192 quiz questions**, two per lesson, with an explanation on every answer
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

Lessons can be read aloud using the speech voices already on your device, so it works
offline and costs nothing to run. Voice selection is ranked towards a calm, measured,
British-leaning narrator where one is installed, and the section being spoken is
highlighted so your eye can follow along. Speed and voice are adjustable.

On iPhone, Settings → Accessibility → Spoken Content → Voices downloads much better
voices than the defaults. iOS stops narration when the screen locks.

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
