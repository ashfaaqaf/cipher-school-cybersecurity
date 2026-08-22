# logtriage

Reads an SSH auth log and tells you what is worth looking at.

```bash
python logtriage.py --demo              # run against the bundled sample
python logtriage.py /var/log/auth.log   # run against a real log
cat auth.log | python logtriage.py -    # or pipe it in
python logtriage.py --demo --json       # machine-readable output
python test_logtriage.py                # self-check
```

Standard library only — no `pip install`, nothing to break.

## What it looks for

**Password spraying.** One source trying one or two passwords across many
accounts. It stays under per-account lockout thresholds *by design*, so an
account lockout policy will not have stopped it. This is why "we have lockout
enabled" is not the control people believe it is.

**Brute force.** One source hammering a single account. Noisier, easier to
stop, and less common in real intrusions than spraying.

**A success after repeated failures.** The one that actually matters, because
it means something eventually worked. Treat the account as compromised until
proven otherwise: rotate the credential, check what the session did, and look
for persistence.

Findings are sorted by severity, and the exit code is non-zero when anything
HIGH is found, so it can gate a scheduled job.

## Decisions worth explaining

**Unparsable lines are skipped, not fatal.** A parser that dies on the first
unfamiliar line is one you cannot point at a real log. The count of skipped
lines is reported so the skipping stays visible rather than silent.

**The year is a parameter.** Syslog timestamps omit it. Assuming the current
year is the classic way a timeline ends up quietly twelve months out, so it is
an explicit `--year` flag with a sensible default.

**One failure before a success is not reported.** People mistype passwords. A
tool that flags that trains its user to ignore it, which is how real alerts get
missed. The threshold is the difference between a signal and noise.

**Thresholds are tunable, and the defaults are a guess.** Five accounts and
five failures suit a quiet host and are wrong for a busy one. The test suite
covers the boundary in both directions specifically because the right value
depends on the environment.

## Limitations

Only OpenSSH password authentication, only IPv4 sources. It does not correlate
across hosts, handle key-based authentication, or account for log rotation.
Those are the obvious next steps rather than oversights.

## Where this came from

Built as the working version of the exercise in lessons 03-1 and 03-2 of
[Cipher School](https://ashfaaqaf.github.io/cipher-school-cybersecurity/) —
parse a log, count what matters, produce a report someone would act on.
