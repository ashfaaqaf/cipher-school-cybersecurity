#!/usr/bin/env python3
"""
logtriage — read an SSH auth log and say what is worth looking at.

Written as the working version of the exercise in lessons 03-1 and 03-2:
parse a log, count what matters, and produce a report someone would act on.

Three things it looks for, in order of how often they matter in real
intrusions:

  1. Password spraying — one source trying one or two passwords across many
     accounts. This defeats naive lockout policies, because no single account
     reaches the threshold. It is the reason "we have a lockout policy" is not
     the control people think it is.
  2. Brute force — one source hammering a single account.
  3. Success after failures — the pattern that actually matters, because it
     means something eventually worked.

Standard library only, so it runs anywhere Python does with nothing installed.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

# Matches the OpenSSH lines that carry an outcome. Anything else is noise for
# this purpose, and quietly skipping it is deliberate: a parser that dies on
# the first unfamiliar line is a parser you cannot point at a real log.
SSH_LINE = re.compile(
    r"^(?P<ts>\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+\S+\s+sshd\[\d+\]:\s+"
    r"(?P<outcome>Failed password|Accepted password|Invalid user)\s+"
    r"(?:for\s+)?(?:invalid user\s+)?(?P<user>\S+)"
    r"(?:\s+from\s+(?P<ip>\d{1,3}(?:\.\d{1,3}){3}))?"
)

SEVERITY_ORDER = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}


@dataclass
class Event:
    ts: datetime
    outcome: str  # "fail" or "success"
    user: str
    ip: str


@dataclass
class Finding:
    severity: str
    title: str
    detail: str
    evidence: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "severity": self.severity,
            "title": self.title,
            "detail": self.detail,
            "evidence": self.evidence,
        }


def parse_line(line: str, year: int) -> Event | None:
    """Turn one log line into an Event, or None if it is not one we care about."""
    m = SSH_LINE.match(line)
    if not m:
        return None

    ip = m.group("ip")
    if not ip:
        return None  # no source address means nothing we can correlate on

    outcome = "success" if m.group("outcome") == "Accepted password" else "fail"

    # Syslog omits the year, so it has to be supplied. Getting this wrong is
    # the classic way a timeline ends up quietly twelve months out.
    ts = datetime.strptime(f"{year} {m.group('ts')}", "%Y %b %d %H:%M:%S")
    return Event(ts=ts, outcome=outcome, user=m.group("user"), ip=ip)


def parse(lines, year: int) -> tuple[list[Event], int]:
    """Parse a whole log. Returns the events and how many lines were skipped."""
    events, skipped = [], 0
    for line in lines:
        event = parse_line(line.rstrip("\n"), year)
        if event:
            events.append(event)
        elif line.strip():
            skipped += 1
    return events, skipped


def find_spraying(events: list[Event], min_users: int) -> list[Finding]:
    """One source failing against many distinct accounts."""
    users_by_ip: dict[str, set[str]] = defaultdict(set)
    for e in events:
        if e.outcome == "fail":
            users_by_ip[e.ip].add(e.user)

    findings = []
    for ip, users in sorted(users_by_ip.items()):
        if len(users) >= min_users:
            sample = ", ".join(sorted(users)[:6])
            findings.append(
                Finding(
                    severity="HIGH",
                    title=f"Password spraying from {ip}",
                    detail=(
                        f"{len(users)} distinct accounts were tried from a single source. "
                        "Spraying stays under per-account lockout thresholds by design, so "
                        "account lockout will not have stopped this."
                    ),
                    evidence=[f"accounts tried: {sample}" + (" …" if len(users) > 6 else "")],
                )
            )
    return findings


def find_brute_force(events: list[Event], min_fails: int) -> list[Finding]:
    """One source failing repeatedly against one account."""
    fails: dict[tuple[str, str], list[Event]] = defaultdict(list)
    for e in events:
        if e.outcome == "fail":
            fails[(e.ip, e.user)].append(e)

    findings = []
    for (ip, user), hits in sorted(fails.items()):
        if len(hits) >= min_fails:
            span = hits[-1].ts - hits[0].ts
            findings.append(
                Finding(
                    severity="MEDIUM",
                    title=f"Repeated failures for '{user}' from {ip}",
                    detail=f"{len(hits)} failed attempts over {span}.",
                    evidence=[f"first {hits[0].ts}", f"last {hits[-1].ts}"],
                )
            )
    return findings


def find_success_after_failures(events: list[Event], min_fails: int) -> list[Finding]:
    """
    A success on an account that had been failing from the same source.
    This is the one to look at first — it means something worked.
    """
    by_pair: dict[tuple[str, str], list[Event]] = defaultdict(list)
    for e in events:
        by_pair[(e.ip, e.user)].append(e)

    findings = []
    for (ip, user), hits in sorted(by_pair.items()):
        hits.sort(key=lambda e: e.ts)
        fails_before = 0
        for e in hits:
            if e.outcome == "fail":
                fails_before += 1
                continue
            if fails_before >= min_fails:
                findings.append(
                    Finding(
                        severity="HIGH",
                        title=f"Successful login for '{user}' from {ip} after {fails_before} failures",
                        detail=(
                            "A guessing attempt appears to have succeeded. Treat this account as "
                            "compromised until proven otherwise: rotate the credential, check what "
                            "the session did, and look for persistence."
                        ),
                        evidence=[f"success at {e.ts}"],
                    )
                )
            fails_before = 0
    return findings


def triage(events: list[Event], min_users: int, min_fails: int) -> list[Finding]:
    findings = (
        find_success_after_failures(events, min_fails)
        + find_spraying(events, min_users)
        + find_brute_force(events, min_fails)
    )
    findings.sort(key=lambda f: SEVERITY_ORDER[f.severity])
    return findings


def report(events: list[Event], findings: list[Finding], skipped: int) -> str:
    out = ["logtriage report", "=" * 40]

    if events:
        out += [
            f"events parsed : {len(events)}",
            f"lines skipped : {skipped}",
            f"window        : {min(e.ts for e in events)} to {max(e.ts for e in events)}",
            f"sources       : {len({e.ip for e in events})}",
            f"accounts      : {len({e.user for e in events})}",
        ]
    else:
        out.append("no parsable authentication events found")

    out += ["", f"findings      : {len(findings)}", ""]

    if not findings:
        out.append("Nothing stood out. That is a result, not a failure —")
        out.append("record what you checked so the next person does not repeat it.")

    for i, f in enumerate(findings, 1):
        out += [f"[{f.severity}] {i}. {f.title}", f"    {f.detail}"]
        out += [f"    evidence: {e}" for e in f.evidence]
        out.append("")

    return "\n".join(out)


def main(argv: list[str] | None = None) -> int:
    # Windows consoles default to a legacy codepage, which turns the em dashes
    # and ellipses in this report into mojibake. Ask for UTF-8 and move on.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, OSError):
        pass

    ap = argparse.ArgumentParser(description="Triage an SSH auth log for guessing attacks.")
    ap.add_argument("logfile", nargs="?", help="path to auth.log, or - for stdin")
    ap.add_argument("--demo", action="store_true", help="run against the bundled sample log")
    ap.add_argument("--json", action="store_true", help="emit findings as JSON")
    ap.add_argument("--year", type=int, default=datetime.now().year,
                    help="year for syslog timestamps, which omit it (default: this year)")
    ap.add_argument("--min-users", type=int, default=5,
                    help="distinct accounts from one source before it counts as spraying")
    ap.add_argument("--min-fails", type=int, default=5,
                    help="failures before brute force, and before a success is suspicious")
    args = ap.parse_args(argv)

    if args.demo:
        source = (Path(__file__).parent / "sample-auth.log").read_text().splitlines()
    elif args.logfile in (None, "-"):
        if sys.stdin.isatty():
            ap.error("give a log file, pipe one in, or use --demo")
        source = sys.stdin
    else:
        source = Path(args.logfile).read_text().splitlines()

    events, skipped = parse(source, args.year)
    findings = triage(events, args.min_users, args.min_fails)

    if args.json:
        print(json.dumps({"events": len(events), "skipped": skipped,
                          "findings": [f.as_dict() for f in findings]}, indent=2))
    else:
        print(report(events, findings, skipped))

    # Non-zero when something high severity was found, so this can gate a job.
    return 1 if any(f.severity == "HIGH" for f in findings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
