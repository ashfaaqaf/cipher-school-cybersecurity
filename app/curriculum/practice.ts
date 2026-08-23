/**
 * Hands-on exercises: the part where you decide something.
 *
 * Every platform that teaches this either explains and never asks you to act,
 * or drops you on a machine with no explanation and lets you flounder. The
 * first produces people who have read about security; the second loses
 * beginners entirely. What is missing from both is the middle: a real artefact,
 * a question a working analyst would actually be asked, and a scaffold that
 * fades — a nudge if you want one, a narrower nudge after that, and the answer
 * only when you ask for it.
 *
 * So none of these can be answered by remembering a definition. Each one shows
 * you a log, a request, a scan or a pair of advisories and asks what you would
 * do. Several of them are answered correctly by deciding that nothing is wrong,
 * because the expensive mistake in this job is not missing an attack, it is
 * raising six false alarms a week until nobody reads your alerts.
 *
 * This module is loaded on demand — see ./load.
 */

export type Step = {
  ask: string;
  /** What the box should say before anything is typed. */
  placeholder?: string;
  /**
   * Accepted answers, compared after normalising case, spacing and trailing
   * punctuation. Generous about how it is written, strict about what it says.
   */
  accept: string[];
  /** The canonical answer, shown once the step is finished. */
  answer: string;
  /** Why that is the answer — the part that is worth more than the mark. */
  why: string;
  /** A nudge, then a narrower one. Taking them is free; that is the point. */
  hints: string[];
};

export type Exercise = {
  id: string;
  /** The lesson this belongs under. */
  lesson: string;
  title: string;
  /** What you are looking at, and what you are being asked to do with it. */
  brief: string;
  artefact: {
    label: string;
    /** Rendered monospaced with line numbers, the way you would really read it. */
    lines: string[];
  };
  steps: Step[];
  /** What somebody doing this for a living would do next. */
  debrief: string;
};

export const exercises: Exercise[] = [
  {
    id: 'ex-authlog',
    lesson: '03-2',
    title: 'Triage an SSH log',
    brief:
      'This is one morning of authentication log from a web server. Three different things are happening in it and only one of them is an incident. Read it before you answer anything — the whole skill is in the reading.',
    artefact: {
      label: 'web01:/var/log/auth.log',
      lines: [
        'Mar 14 02:11:04 web01 sshd[2201]: Accepted password for ashfaaq from 192.168.1.24 port 51422 ssh2',
        'Mar 14 03:02:11 web01 sshd[3310]: Failed password for admin from 203.0.113.44 port 40122 ssh2',
        'Mar 14 03:02:12 web01 sshd[3311]: Failed password for root from 203.0.113.44 port 40124 ssh2',
        'Mar 14 03:02:14 web01 sshd[3312]: Failed password for invalid user oracle from 203.0.113.44 port 40126 ssh2',
        'Mar 14 03:02:15 web01 sshd[3313]: Failed password for postgres from 203.0.113.44 port 40128 ssh2',
        'Mar 14 03:02:17 web01 sshd[3314]: Failed password for jenkins from 203.0.113.44 port 40130 ssh2',
        'Mar 14 03:02:18 web01 sshd[3315]: Failed password for backup from 203.0.113.44 port 40132 ssh2',
        'Mar 14 03:02:20 web01 sshd[3316]: Failed password for invalid user deploy from 203.0.113.44 port 40134 ssh2',
        'Mar 14 03:02:22 web01 sshd[3317]: Failed password for git from 203.0.113.44 port 40136 ssh2',
        'Mar 14 04:41:02 web01 sshd[4820]: Failed password for svc_backup from 198.51.100.7 port 33110 ssh2',
        'Mar 14 04:41:19 web01 sshd[4821]: Failed password for svc_backup from 198.51.100.7 port 33114 ssh2',
        'Mar 14 04:41:37 web01 sshd[4822]: Failed password for svc_backup from 198.51.100.7 port 33118 ssh2',
        'Mar 14 04:41:55 web01 sshd[4823]: Failed password for svc_backup from 198.51.100.7 port 33122 ssh2',
        'Mar 14 04:42:13 web01 sshd[4824]: Failed password for svc_backup from 198.51.100.7 port 33126 ssh2',
        'Mar 14 04:42:31 web01 sshd[4825]: Failed password for svc_backup from 198.51.100.7 port 33130 ssh2',
        'Mar 14 04:42:49 web01 sshd[4826]: Failed password for svc_backup from 198.51.100.7 port 33134 ssh2',
        'Mar 14 04:43:07 web01 sshd[4827]: Accepted password for svc_backup from 198.51.100.7 port 33138 ssh2',
        'Mar 14 04:43:08 web01 systemd-logind[901]: New session 19 of user svc_backup.',
        'Mar 14 06:20:41 web01 sshd[5510]: Failed password for ashfaaq from 192.168.1.24 port 52001 ssh2',
        'Mar 14 06:20:58 web01 sshd[5511]: Accepted password for ashfaaq from 192.168.1.24 port 52004 ssh2',
      ],
    },
    steps: [
      {
        ask: 'One address tried eight different accounts, once each, in eleven seconds. Which address?',
        placeholder: 'an IP address',
        accept: ['203.0.113.44'],
        answer: '203.0.113.44',
        why: 'One password against many accounts is password spraying, and it is built to beat lockout policies: no single account ever reaches the threshold, so nothing locks and nothing alerts. This is why "we have a lockout policy" is not the control people think it is. Note what it tried — admin, root, oracle, postgres, jenkins, git — a list of service accounts, not a list of people.',
        hints: [
          'Compare the usernames on each line. One address never repeats a username; another never changes it.',
          'Look at the block between 03:02:11 and 03:02:22.',
        ],
      },
      {
        ask: 'One account was attacked a different way, and that attack worked. Which account?',
        placeholder: 'a username',
        accept: ['svc_backup', 'svc backup', 'svcbackup'],
        answer: 'svc_backup',
        why: 'Seven failures against one account, eighteen seconds apart, then an Accepted at 04:43:07 from the same address. That is brute force, and the line that matters is the one that succeeded — followed immediately by a session opening. Everything before it is noise; that line is an incident.',
        hints: [
          'Ignore the spray. Somewhere else, one username repeats over and over.',
          'Find the seven failures between 04:41 and 04:42, then read the very next sshd line.',
        ],
      },
      {
        ask: 'At 06:20 the account ashfaaq fails once and then succeeds. Is that an incident — yes or no?',
        placeholder: 'yes or no',
        accept: ['no', 'n', 'not an incident', 'no it is not', 'no it isnt', 'no it is not an incident'],
        answer: 'No',
        why: 'One failure then a success, from 192.168.1.24 — the same internal address that account logs in from every day — is a person mistyping their password. Reporting it costs an analyst an hour and costs you credibility. Knowing what not to escalate is half the job: an alert nobody trusts is worse than no alert, because it trains everyone to ignore the next one.',
        hints: [
          'Compare the address on those two lines with the very first line of the log.',
          'How many failures were there, and had you seen that address behaving normally earlier?',
        ],
      },
    ],
    debrief:
      'What you just did is triage, and the report writes itself from it: svc_backup was compromised at 04:43:07 from 198.51.100.7 after seven failed attempts; the same host is not the sprayer, so there are two separate sources; and the 06:20 events are routine. Next steps in real life: disable svc_backup, pull everything that session did, block both external addresses, and ask why a service account had a password an attacker could guess in seven tries.',
  },

  {
    id: 'ex-sqli',
    lesson: '05-3',
    title: 'Find the injection',
    brief:
      'A junior developer has sent you this handler for review. It works, it passes its tests, and it is exploitable. Find the exact problem and say how you would fix it.',
    artefact: {
      label: 'app/routes/search.py',
      lines: [
        'from flask import request, jsonify',
        'import sqlite3',
        '',
        'def search_products():',
        '    term = request.args.get("q", "")',
        '    conn = sqlite3.connect("shop.db")',
        '    cur = conn.cursor()',
        '',
        '    sql = "SELECT id, name, price FROM products WHERE name LIKE \'%" + term + "%\'"',
        '    cur.execute(sql)',
        '',
        '    rows = cur.fetchall()',
        '    return jsonify([{"id": r[0], "name": r[1], "price": r[2]} for r in rows])',
      ],
    },
    steps: [
      {
        ask: 'Which line number is the vulnerability on?',
        placeholder: 'a line number',
        accept: ['9', 'line 9', '9.'],
        answer: 'Line 9',
        why: 'The query is built by joining strings, so whatever arrives in q stops being data and becomes part of the instruction. Line 10 is where it executes, but line 9 is where the mistake is made — the fix belongs there, and blaming execute would send the developer to the wrong place.',
        hints: [
          'Look for the place where something a stranger controls is joined onto something the database will obey.',
          'One line uses + to build a string. That is the one.',
        ],
      },
      {
        ask: 'What is the fix called — the one-word technique that separates the query from the data?',
        placeholder: 'one or two words',
        accept: [
          'parameterised queries', 'parameterized queries', 'parameterisation', 'parameterization',
          'parameterised', 'parameterized', 'prepared statements', 'prepared statement',
          'bind parameters', 'placeholders', 'parameter binding', 'parameterised query', 'parameterized query',
        ],
        answer: 'Parameterised queries, also called prepared statements',
        why: 'You send the database the query shape once, with placeholders, and the values separately: cur.execute("... WHERE name LIKE ?", (f"%{term}%",)). The database then never parses the value as SQL, so there is nothing to escape and nothing to get wrong. Escaping input by hand is the answer people reach for first, and it is the answer that keeps failing — you are one forgotten character set away from it breaking.',
        hints: [
          'The answer is not "escape the input" and it is not "validate the input". Both help; neither is the fix.',
          'The technique sends the query and the values to the database separately, using ? or a named placeholder.',
        ],
      },
    ],
    debrief:
      'Two things make this a good finding rather than a good catch: you named the line, and you named the fix in the developer\'s vocabulary. Lesson 12-5 is about writing this up so somebody acts on it — a finding that says "SQL injection in search" gets triaged; one that says "line 9 builds SQL by concatenation, use a parameterised query, here is the two-line diff" gets fixed this afternoon.',
  },

  {
    id: 'ex-patch',
    lesson: '04-6',
    title: 'Decide what to patch first',
    brief:
      'It is Monday. You have time to patch one of these this week and you have to justify the choice. Both are real advisories on systems you run.',
    artefact: {
      label: 'this morning’s advisories',
      lines: [
        'CVE-2026-31337   CVSS 9.8 CRITICAL   Remote code execution in ImageMagick',
        '                 Affected: the internal reporting server, reachable only from the office VLAN',
        '                 Exploit status: no public exploit, no known exploitation',
        '',
        'CVE-2026-20450   CVSS 7.5 HIGH       Authentication bypass in the VPN appliance',
        '                 Affected: the VPN concentrator, reachable from the internet',
        '                 Exploit status: listed in the CISA KEV catalogue, exploited in the wild',
      ],
    },
    steps: [
      {
        ask: 'Which CVE do you patch first?',
        placeholder: 'a CVE id',
        accept: ['cve-2026-20450', '2026-20450', '20450', 'cve 2026 20450', 'the vpn one', 'vpn'],
        answer: 'CVE-2026-20450, the VPN appliance',
        why: 'It scores lower and it is the emergency. CVSS measures how bad the flaw would be if exploited; it does not know that this one is internet-facing, on the box that guards everything else, and already being exploited. The higher score sits on a machine an attacker cannot reach without already being inside — at which point they have easier options than an image library.',
        hints: [
          'The scores are not the whole story. Read the other two lines under each.',
          'One of these is reachable from the internet and is already being used against people.',
        ],
      },
      {
        ask: 'Which single fact about it matters most — the score, the reachability, or the known exploitation?',
        placeholder: 'one of the three',
        accept: [
          'known exploitation', 'exploitation', 'exploited', 'kev', 'known exploited',
          'the known exploitation', 'exploited in the wild', 'it is being exploited', 'cisa kev',
        ],
        answer: 'That it is being exploited in the wild',
        why: 'Reachability tells you an attack is possible. Known exploitation tells you it is happening, to somebody, now — which converts a maybe into a when. This is exactly why the CISA KEV catalogue exists and why regulators point at it instead of at severity scores: "actively exploited" beats "theoretically worse" every single time.',
        hints: [
          'Two of the three describe possibility. One describes something already happening.',
          'It is the reason the CISA KEV catalogue exists.',
        ],
      },
    ],
    debrief:
      'Patch order is a risk decision, not an arithmetic one, and this is the argument that wins the meeting: exposure plus evidence of exploitation, with the severity score as supporting detail rather than the headline. Write it in that order in your risk register and the conversation about the 9.8 becomes a scheduling question instead of a fight.',
  },

  {
    id: 'ex-nmap',
    lesson: '12-4',
    title: 'Read a scan like an assessor',
    brief:
      'You have scanned a client host with permission and this came back. The client wants to know what to deal with first, in plain language.',
    artefact: {
      label: 'nmap -sV -Pn 10.10.24.15',
      lines: [
        'PORT     STATE SERVICE     VERSION',
        '22/tcp   open  ssh         OpenSSH 9.6p1 Ubuntu 3ubuntu13.5',
        '80/tcp   open  http        nginx 1.24.0',
        '443/tcp  open  ssl/http    nginx 1.24.0',
        '3306/tcp open  mysql       MySQL 8.0.36-0ubuntu0.24.04.1',
        '8080/tcp open  http        Apache Tomcat 8.5.31',
        '',
        'Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel',
      ],
    },
    steps: [
      {
        ask: 'Which port should not be reachable at all from where you scanned?',
        placeholder: 'a port number',
        accept: ['3306', '3306/tcp', 'port 3306', 'mysql', '3306 mysql'],
        answer: '3306 — MySQL',
        why: 'A database should be reachable by its application and by nothing else. An exposed MySQL port gives an attacker somewhere to spray credentials, a version to look up, and — if it ever answers — the data itself rather than the application in front of it. Nothing on this host explains why the world needs to speak to it directly.',
        hints: [
          'Four of these are services a web server is expected to offer. One is not a web service at all.',
          'Which of these would you expect to be behind the application rather than beside it?',
        ],
      },
      {
        ask: 'One of the web services is years out of date. Which port is it on?',
        placeholder: 'a port number',
        accept: ['8080', '8080/tcp', 'port 8080', 'tomcat', '8080 tomcat'],
        answer: '8080 — Apache Tomcat 8.5.31',
        why: 'Read the versions, not just the service names. nginx 1.24 and OpenSSH 9.6 are current; Tomcat 8.5.31 is from 2018 and has years of published vulnerabilities behind it, several of them trivially exploitable. A version string is the cheapest finding in the report and often the most serious, which is exactly why -sV is worth the extra time.',
        hints: [
          'The service name is not the interesting part of those lines. The version is.',
          'Compare the version numbers against what is current. One of them is not close.',
        ],
      },
    ],
    debrief:
      'That is the shape of the first page of a real assessment: what is exposed that should not be, and what is exposed that is old. Both findings are defensible with one line of evidence each from the scan, and both can be written the way lesson 12-5 describes — problem, proof, consequence, fix — before you have touched a single exploit.',
  },

  {
    id: 'ex-idor',
    lesson: '05-2',
    title: 'Spot the broken access control',
    brief:
      'You are testing an invoicing app as the user amy@example.com. You are logged in legitimately. Two requests, two responses. Something here is a finding.',
    artefact: {
      label: 'proxy history',
      lines: [
        'GET /api/invoices/4821 HTTP/1.1',
        'Host: app.example.com',
        'Cookie: session=eyJ1IjoiYW15QGV4YW1wbGUuY29tIn0',
        '',
        'HTTP/1.1 200 OK',
        '{"id":4821,"customer":"amy@example.com","total":"48.00","status":"paid"}',
        '',
        '--------------------------------------------------------------',
        '',
        'GET /api/invoices/4822 HTTP/1.1',
        'Host: app.example.com',
        'Cookie: session=eyJ1IjoiYW15QGV4YW1wbGUuY29tIn0',
        '',
        'HTTP/1.1 200 OK',
        '{"id":4822,"customer":"raj@example.com","total":"1290.00","status":"unpaid"}',
      ],
    },
    steps: [
      {
        ask: 'What is the name of this vulnerability class — the four-letter abbreviation, or the OWASP category name?',
        placeholder: 'an abbreviation or a category',
        accept: [
          'idor', 'insecure direct object reference', 'insecure direct object references',
          'broken access control', 'bola', 'broken object level authorization',
          'broken object level authorisation',
        ],
        answer: 'IDOR — an insecure direct object reference, which OWASP files under Broken Access Control',
        why: 'You changed one number in a URL and received somebody else\'s invoice. The application checked that you were logged in and never checked that the record belonged to you. Authentication answers who you are; authorisation answers what you may have. Confusing the two is the most common serious flaw on the web, which is why it sits at number one in the OWASP Top 10.',
        hints: [
          'Look at the customer field in the second response, then look at who the session belongs to.',
          'The application knew who you were. It did not check whether the thing you asked for was yours.',
        ],
      },
      {
        ask: 'What is the fix — check the object belongs to the user, or make the invoice ids unguessable?',
        placeholder: 'in a few words',
        accept: [
          'check the object belongs to the user', 'check ownership', 'ownership check',
          'check it belongs to the user', 'authorisation check', 'authorization check',
          'check the invoice belongs to the user', 'server side authorisation', 'server side authorization',
          'check ownership server side', 'the first', 'check owner',
        ],
        answer: 'Check on the server that the record belongs to the requesting user',
        why: 'Unguessable ids are worth having and are not a fix — that is security by obscurity, and it fails the moment an id leaks in an email, a referrer header or a shared link. The only fix is the server asking "does invoice 4822 belong to the session making this request?" on every single request, including the ones your own UI would never send.',
        hints: [
          'One of those two options still lets an attacker in as soon as they learn an id.',
          'Ask what the server should verify before it answers, every time.',
        ],
      },
    ],
    debrief:
      'This is the single highest-value thing you can test by hand, and no scanner finds it reliably, because only you know that 4822 should not be yours. Burp\'s repeater plus two accounts is the whole method: do something as one user, replay it as the other, and see whether the application noticed.',
  },
];

export const exerciseByLesson = new Map(exercises.map((e) => [e.lesson, e]));

/** Loose but not sloppy: case, spacing and trailing punctuation do not count. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isCorrect(step: Step, given: string): boolean {
  const g = normalise(given);
  if (!g) return false;
  return step.accept.some((a) => normalise(a) === g);
}
