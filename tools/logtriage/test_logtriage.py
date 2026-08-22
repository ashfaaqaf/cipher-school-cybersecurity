#!/usr/bin/env python3
"""
Self-check for logtriage.  Run it with:  python test_logtriage.py

No framework, because the point is that it runs anywhere with nothing
installed. If the detection logic breaks, this fails.
"""

from datetime import datetime
from pathlib import Path

from logtriage import Event, parse, parse_line, triage

YEAR = 2026
SAMPLE = Path(__file__).parent / "sample-auth.log"


def ok(condition, message):
    assert condition, message


# --- parsing -----------------------------------------------------------

e = parse_line(
    "Mar 14 03:02:11 web01 sshd[3310]: Failed password for admin from 203.0.113.44 port 40122 ssh2",
    YEAR,
)
ok(e is not None, "a failed password line should parse")
ok(e.outcome == "fail", "Failed password is a failure")
ok(e.user == "admin", f"user should be admin, got {e.user}")
ok(e.ip == "203.0.113.44", f"ip should be 203.0.113.44, got {e.ip}")
ok(e.ts == datetime(YEAR, 3, 14, 3, 2, 11), "timestamp takes the year from the caller")

e = parse_line(
    "Mar 14 02:11:04 web01 sshd[2201]: Accepted password for ashfaaq from 192.168.1.24 port 51422 ssh2",
    YEAR,
)
ok(e.outcome == "success", "Accepted password is a success")

e = parse_line(
    "Mar 14 03:02:14 web01 sshd[3312]: Failed password for invalid user oracle from 203.0.113.44 port 40126 ssh2",
    YEAR,
)
ok(e.user == "oracle", f"the 'invalid user' form should still yield the username, got {e.user}")

# Unrelated lines are skipped rather than crashing the parser — a parser that
# dies on the first unfamiliar line is one you cannot point at a real log.
ok(parse_line("Mar 14 03:14:55 web01 CRON[3401]: session opened for user root", YEAR) is None,
   "non-ssh lines are ignored")
ok(parse_line("", YEAR) is None, "blank lines are ignored")
ok(parse_line("total nonsense", YEAR) is None, "unparsable lines are ignored, not fatal")

# --- detection on the bundled sample ------------------------------------

events, skipped = parse(SAMPLE.read_text().splitlines(), YEAR)
ok(len(events) == 19, f"sample should yield 19 auth events, got {len(events)}")
ok(skipped > 0, "the sample deliberately contains non-ssh lines to skip")

findings = triage(events, min_users=5, min_fails=5)
titles = " | ".join(f.title for f in findings)

ok(any("spraying" in f.title.lower() and "203.0.113.44" in f.title for f in findings),
   f"should flag spraying from 203.0.113.44 — got: {titles}")
ok(any("svc_backup" in f.title and "after" in f.title for f in findings),
   f"should flag the success that followed repeated failures — got: {titles}")
ok(findings[0].severity == "HIGH", "highest severity must sort first")

# The legitimate user typo'd once then logged in. One failure is not an attack,
# and reporting it would be exactly the false positive that trains people to
# ignore alerts.
ok(not any("ashfaaq" in f.title for f in findings),
   f"a single failure before a success must not be reported — got: {titles}")

# --- thresholds actually do something -----------------------------------

ok(len(triage(events, min_users=99, min_fails=99)) == 0,
   "impossible thresholds should produce no findings")

# Built rather than taken from the sample, so the boundary is exact: one source,
# three accounts, one failure each. It is spraying at a threshold of 3 and
# invisible at a threshold of 5 — which is the whole argument for the setting
# being tunable, and the reason a default is a guess rather than an answer.
quiet_spray = [
    Event(datetime(YEAR, 1, 1, 0, 0, n), "fail", user, "10.0.0.9")
    for n, user in enumerate(["alice", "bob", "carol"])
]
ok(triage(quiet_spray, min_users=5, min_fails=5) == [],
   "three accounts is below a threshold of five and must stay silent")
ok(any("spraying" in f.title.lower() for f in triage(quiet_spray, min_users=3, min_fails=5)),
   "the same activity must be caught once the threshold is lowered to three")

# --- edge cases ---------------------------------------------------------

ok(triage([], 5, 5) == [], "no events means no findings, not a crash")

single = [Event(datetime(YEAR, 1, 1, 0, 0, 0), "fail", "root", "10.0.0.1")]
ok(triage(single, 5, 5) == [], "one failure is not an attack")

print("logtriage: all checks passed")
