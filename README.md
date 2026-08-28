# Cipher School

Learn cybersecurity from absolute beginner to expert level — in plain language.

**Main site:** https://cipherschool.page.gd/

**GitHub Pages mirror:** https://ashfaaqaf.github.io/cipher-school-cybersecurity/

**Hosting:** GitHub Pages is automatic. [InfinityFree deployment setup](docs/infinityfree-deployment.md) is included and activates only after its repository secrets and variables are added.

Most security roadmaps hand you a list of topics and leave you to find the explanations
yourself. This one contains the explanations. Every lesson is written out in full, in
words a beginner can follow, with the jargon decoded as it appears.

## What is in it

- **13 stages**, beginner through expert, in the order they should be learned
- **110 written lessons** — not topic titles, the actual teaching
- **415 terms decoded** in a searchable glossary, each explained without more jargon
- **8 career paths** (SOC, red team, AppSec, cloud, DFIR, GRC, research, fastest-to-hired) with stage order
- **Personal onboarding** that turns a target role, starting point and weekly time budget into a saved route
- **A 12-situation cybersecurity baseline assessment** that saves privately and turns missed decisions into an exact lesson plan
- **Six zero-setup browser missions** using logs, email headers, HTTP traffic, cloud policy, scan output and an incident timeline
- **Evidence-based mission scoring** across technical decisions and a written analyst report, with method-first coach hints
- **A four-gate mastery graph** — learned, recalled, applied and proven — instead of one misleading completion number
- **Eight career capstones** with inspectable rubrics and a Markdown portfolio export that labels self-attested work honestly
- **A classroom facilitator pack**, core English/Sinhala/Tamil interface support, and visible standards/version review dates
- **Nine real job adverts**, all but one Sri Lankan, broken into individual requirements and mapped to the lessons covering each — plus sourced market context
- **220 quiz questions**, two per lesson, with an explanation on every answer
- **15 hands-on exercises, one in every stage** — an SSH log, a permission set, a code
  review, a proxy history, an nmap scan, an IAM policy, a phishing header, a disclosure
  timeline and more. Typed answers, hints that fade, and an explanation worth more than
  the mark
- **Spaced repetition** over all questions and terms, so what you read actually stays
- **A daily plan** built from your weekly hour budget, with a streak and a week strip
- **One settings hub** for theme, reading comfort, motion, contrast, study pace, learning route, narration, offline install and portable data
- **A guarded factory reset** that can clear every device-local lesson, review, mission, portfolio and preference record after a typed confirmation
- **A weekly review** naming what you actually learned, against last week
- **Full-text search** across every word, with the matching passage highlighted
- **Keyboard shortcuts** throughout, and `?` to see them
- **Print or save any stage as a PDF**, typeset for paper
- **Narration** — listen to any lesson like an audiobook, with follow-along highlighting
- **Private field notes:** available inside every lesson, saved automatically on the device and exportable as clean Markdown
- **Progress tracking** stored only in your browser — nothing is uploaded anywhere
- **Back up and restore** progress as a JSON file, so clearing your browser is survivable
- **Works fully offline** once installed, via a service worker generated at build time

Every lesson follows the same four-step learning loop:

| Section | What it does |
| --- | --- |
| Understand | The idea, an everyday comparison, the explanation, jargon and consequence |
| Recall | A question answered from memory before the choices appear |
| Apply | A safe action and, where available, a scored evidence exercise |
| Capture | An optional private field note saved only on the device |

## What you can show for it

Every free course ends with a completion percentage, which is worth nothing to anyone
hiring. Under Paths there is an evidence sheet generated from your actual progress: the
stages you have covered and what each one means you can do, the hands-on exercises you
finished, and your readiness against each of the nine real adverts. It copies as plain text,
because it is going into a CV, a covering email or a README and none of those want markup.

It is generated rather than written, so it cannot overstate anything — every line traces to
a lesson marked understood or an exercise completed.

## Practice, and why it is shaped like this

Two things are consistently true of learning security online. Platforms that explain
everything and never ask you to act produce people who have read about security; platforms
that drop you on a machine with no explanation lose beginners entirely — the common report
is eight hours on an "easy" box and nothing to show for it. The complaint about the gentle
ones is the mirror image: candidates who cannot solve anything once the hints stop.

So the exercises here sit in the middle deliberately. There are fifteen of them, one in
every stage, and each gives you a real artefact — an SSH log, a permission set, a code
review, a proxy history, an nmap scan, an IAM policy, a phishing header, two advisories —
and asks what you would actually do. You type the answer rather than pick it. The scaffold fades on
request: a nudge, then a narrower nudge, then the answer, and asking costs nothing and is
not recorded, because a learner who is afraid to ask stops trying.

None of them can be answered by remembering a definition, and several are answered
correctly by deciding that nothing is wrong, or that you are not allowed to act at all. That is on purpose: the expensive mistake in
this job is not missing an attack, it is raising six false alarms a week until nobody reads
your alerts.

A wrong answer is marked amber, never red. Red in this design means genuinely critical, and
being wrong on the first attempt at a judgement question is the ordinary route to being
right — marking it in alarm colours teaches people to stop guessing.

Every question now asks you to **answer it from memory before the options appear**. Multiple
choice measures recognition, which runs on familiarity: the right answer looks right once it
is in front of you, and the feeling of knowing is not knowing. Skipping the box is one press,
because a gate that punishes people teaches them to stop rather than to try.

The review deck asks you to **write** what a term means before it shows you. The evidence on
retrieval practice is consistent that generating an answer beats recognising one for
long-term retention, because recognition can run on familiarity alone. Nothing marks what
you wrote; it is put beside the real definition and graded by the only judge who knows
whether you meant it.

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

## URLs, offline pages and accessibility

A lesson is a page, not a modal. It used to open as a sheet over the roadmap — a scrim, a
drag handle, a focus trap and a locked body, all so a reader could spend ten minutes inside
a layer that was pretending to be temporary. Now the roadmap steps aside, the lesson takes
the column, and leaving it puts you back on the row you came from. Nothing to dismiss,
nothing trapped, and the back button already worked because it was a route all along.

The nav rail changes page rather than scrolling one. The hero belongs to the roadmap and
renders only there, so choosing Missions, Review, Paths, Proof, Words or Sources lands you on that section's
first line instead of on a headline you have already read.

Lessons live at hash routes — `#/lesson/05-2` — so one can be bookmarked, shared or
reached with the back button. Hash rather than path because this is a static export:
a real path would 404 on refresh unless every lesson got its own prerendered page.
Bad or hand-edited hashes fall back to the course rather than breaking, which
`node routing.test.ts` checks against a list of malformed inputs including traversal
attempts.

What is left as a dialog is what should be: narration settings, the shortcut list and the
install instructions — small, transient, and genuinely on top of something. Those trap
focus while open and restore it on close. A modal you can Tab out of is only
a modal visually: a keyboard or screen reader user lands behind it in content meant to be
inert, with no sign anything is open. There is also a skip link, a `main` landmark, and a
polite live region on the status capsule.

An error boundary catches a render failure rather than replacing the app with a blank
page — which on a Home Screen install would look permanent — and says plainly that
progress is untouched, because it is.

## Keyboard

`/` searches, `1`–`5` switch between Learn, Missions, Review, Paths and Proof, `j` and `k` move between lessons while reading, `Space`
marks a lesson understood, `l` starts narration, `Esc` closes whatever is open, and `?`
lists all of it.

The fiddly part of shortcuts is not binding keys, it is refusing to act: anything with
Ctrl, Cmd or Alt is left to the browser, nothing but `Esc` fires while you are typing, and
tab-switching is disabled inside the reader and while a review card is on screen.
`node keys.test.ts` mostly asserts that keys do *nothing* — it caught a bug where pressing
`1` before revealing a card threw you out of the review session.

## Print

Every stage has a **Print or save as PDF** button. It renders the whole stage — every
lesson, jargon, exercises, resources and the legal notice — as plain black-on-white
typography with each lesson starting a fresh page, so a stage prints as a small booklet.
Screen surfaces, tints and the dark canvas are all discarded: they cost ink and read
badly in monochrome. URLs are printed in full, because a paper link you cannot type is not
a link.

## Search

Search covers every word of every lesson — the explanations, the analogies, the jargon
decoder, the exercises — not just titles. Results are ranked by where the match landed (a
title match outranks a body match), every term must appear so multi-word queries narrow
rather than widen, and each result shows the matching passage with the terms highlighted
and a label saying which part of the lesson it came from.

A title hit deliberately shows a snippet from somewhere other than the title, because
repeating the title back as the excerpt tells the reader nothing. `node search.test.ts`
covers the ranking, the tokeniser and the snippet windowing against the real curriculum.

At 110 lessons a linear scan per keystroke is instant, so there is no index. If that ever
stops being true, that is the moment to build one.

## The daily plan

110 lessons is a backlog, not a habit. Set a weekly hour budget and how many days you
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

Roughly 260,000 characters across the 110 lessons. Generation is incremental — a lesson is
only regenerated when its text changes, so editing one lesson costs one lesson.

Alternatively, run it without handling the key locally at all: add `ELEVENLABS_API_KEY`
and `ELEVENLABS_VOICE_ID` as repository secrets, then run the **Generate narration**
workflow from the Actions tab. Use its `limit` input to sample a few lessons first.

On iPhone, Settings → Accessibility → Spoken Content → Voices downloads much better
device voices than the defaults. iOS stops narration when the screen locks.

## Design notes

The visual direction is a precision field manual, not a science-fiction dashboard. The
first screen gives the learner one promise, one primary action and one proof of how the
system works. Restrained surfaces create common regions, while rules and shared alignment
preserve the density expected from a serious technical product.

The interface is mobile-first. Phones keep five primary destinations in the bottom thumb
zone. Glossary, sources and settings move into one utility menu instead of shrinking seven
labels until they become hard to read. Tablets use a balanced two-column hero and a
two-column roadmap whose open stage expands to full width. Desktop retains the complete
navigation rail, a cinematic split hero and editorial section headings.

The spacing system follows an 8pt rhythm. Major controls are at least 48px tall, type scales
with `clamp()`, and reading lines stop at a comfortable measure. **Inter** carries teaching
and interface language. **JetBrains Mono** carries stages, durations, evidence and status.
Both are self-hosted and precached for offline use.

Colour is semantic. Cobalt guides navigation, emerald means progress, amber means attention
and red is reserved for destructive or critical states. The quietest normal text measures
5.78:1 against the dark canvas and 4.63:1 against the light canvas. Both clear WCAG AA.

Scroll entrances use only opacity and transforms. Content remains visible before JavaScript
starts, late-rendered views are observed safely, and `prefers-reduced-motion` removes the
animation. Mobile blur is disabled to reduce compositing cost on mid-tier devices.

The home screen icons are drawn by `node scripts/make-icons.mjs` — a 5x7 bitmap of the
mark and a small PNG encoder, no dependencies. They are generated rather than exported
because the manifest previously pointed at the 1200x630 social banner as the app icon,
which gave an installed copy a squashed tile on every platform that renders one.

## Speed

The page is prerendered to static HTML, so first paint never waits on JavaScript: 19kB of
gzipped markup and 10kB of CSS put the roadmap on screen, and the bundle arrives behind it
to hydrate. Both fonts are preloaded from the same origin with size-adjusted fallback
metrics, so the swap does not move any text.

Scrolling does not re-render anything. The header hairline and the reading progress bar
used to be React state written on every animation frame, which meant a full re-render of
thirteen stages and a hundred and ten lesson rows, sixty times a second, to move one bar a
few pixels. They are a class toggle and a custom property now, and the scrollable span is
measured on resize rather than read back inside the frame — reading `scrollHeight` mid-scroll
forces a layout flush, which is the classic way to make a scroll janky.

Search scans every word of every lesson on each keystroke. That is about three milliseconds
on a laptop and rather more on a phone, so the query is passed through `useDeferredValue`:
the keystroke paints immediately and the results land a frame later.

The curriculum is split in two. `app/curriculum/light.ts` is generated from the stage files
by `scripts/make-index.mjs` and carries a stage's metadata plus each lesson's title, one
line and length — everything needed to draw the roadmap, and nothing else. The prose, the
220 questions, the 414 definitions and the nine job adverts live behind a dynamic import.
That takes the first load from 361kB of JavaScript to 223kB gzipped.

The trick that makes a split like this free is prefetching it: the heavy half is requested
as soon as the browser reports itself idle, well after first paint, so by the time anyone
opens a lesson, types a search or starts a review it is already in memory. On a cold load
a lesson opened in the first half second shows its title and one line while the prose
lands. Review, the job adverts and the print sheet are `next/dynamic`, because importing
them statically would have pulled their data straight back into the first bundle.

The light index has the same shape as the real thing minus the heavy fields, which is what
lets every piece of navigation, filtering and lookup work against it unchanged. It is
regenerated by `prebuild` and verified by `npm test`, so it cannot drift from the stage
files it came from. Review cards are the one place this needed thought: the dock shows how
many are due, which needs the card *ids* of finished lessons but not the questions behind
them, so the ids are generated into the light index.

## Offline and backups

A service worker is generated by `scripts/make-sw.mjs` after each build, precaching the
files that build actually produced. Hand-maintaining that list would go stale on the next
build and fail silently, which is the worst way for a cache to be wrong — so the list is
derived from `out/`, and the cache name is a hash of it, meaning a new build is
automatically a new cache and the old one is dropped on activate.

Navigations are answered from the cache and revalidated in the background. Network-first
meant every repeat visit — including every launch of the installed app — waited on a round
trip for a document it already had.

The cost of that is staleness, and asking somebody to notice a banner is not good enough:
the symptom is clicking something, appearing to get the old behaviour, and concluding the
app is broken. So a new build is taken automatically when taking it costs nothing — the
page has only just loaded, or the tab has just come back, and no lesson is open. Mid-read
the banner asks instead, because reloading somebody out of a lesson to deliver a typo fix
is worse than the typo. A timestamp guard means a build that somehow reinstalls itself
cannot put the page in a reload loop. Everything else is cache-first, which is
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

The [90 Days of CyberSecurity](https://github.com/farhanashrafdev/90DaysOfCyberSecurity)
project was used as a coverage checklist for networking, Linux, Python, traffic analysis,
Git, Elastic and cloud study. Cipher School keeps its own teaching, exercises and lesson
order; the linked plan remains an optional daily sequence for learners who want one.

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
