export const ACADEMY_STORE = 'cipher-school-academy';

export type Experience = 'new' | 'some' | 'working';
export type Pace = 'sprint' | 'steady' | 'deep';
export type Locale = 'en' | 'si' | 'ta';
export type RoleCode = 'INTERN' | 'BLUE' | 'RED' | 'APP' | 'CLOUD' | 'DFIR' | 'GRC' | 'RESEARCH';

export type LearnerProfile = {
  experience: Experience;
  role: RoleCode;
  weeklyHours: number;
  pace: Pace;
  locale: Locale;
  createdAt: string;
};

export type MissionRun = {
  answers: Record<string, number>;
  report: string;
  score: number | null;
  reportScore: number;
  attempts: number;
  completedAt: string | null;
};

export type CapstoneRun = {
  checks: boolean[];
  notes: string;
  completedAt: string | null;
};

export type AcademyState = {
  version: 1;
  profile: LearnerProfile | null;
  missions: Record<string, MissionRun>;
  capstones: Record<string, CapstoneRun>;
};

export type MissionQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correct: number;
  rationale: string;
};

export type Mission = {
  id: string;
  title: string;
  role: string;
  stage: string;
  difficulty: 'STARTER' | 'CORE' | 'ADVANCED';
  minutes: number;
  brief: string;
  objective: string;
  artefactLabel: string;
  artefact: string[];
  questions: MissionQuestion[];
  reportPrompt: string;
  reportTerms: string[];
  hints: string[];
  source: { label: string; href: string };
};

export type Capstone = {
  id: string;
  role: RoleCode;
  title: string;
  stage: string;
  brief: string;
  checks: string[];
  prompt: string;
};

export const ROLE_ROUTES: Record<RoleCode, { title: string; stages: string[]; outcome: string }> = {
  INTERN: {
    title: 'Fastest route to a junior role',
    stages: ['00', '02', '05', '12', '04', '06', '09'],
    outcome: 'A compact foundation, practical tool fluency and interview-ready evidence.',
  },
  BLUE: {
    title: 'SOC analyst → detection engineer',
    stages: ['00', '01', '02', '04', '07', '08', '09', '11'],
    outcome: 'Triage alerts, explain evidence and turn repeated incidents into detections.',
  },
  RED: {
    title: 'Penetration tester → red team',
    stages: ['00', '01', '02', '03', '04', '05', '06', '10', '11'],
    outcome: 'Test legally, validate impact and write findings that teams can fix.',
  },
  APP: {
    title: 'Application security → product security',
    stages: ['00', '02', '03', '04', '05', '09', '11'],
    outcome: 'Find design and implementation risk, then help builders remove it.',
  },
  CLOUD: {
    title: 'Cloud security engineer',
    stages: ['00', '01', '02', '04', '07', '09', '11'],
    outcome: 'Reason about identity, configuration, telemetry and automation at scale.',
  },
  DFIR: {
    title: 'Incident response → malware analysis',
    stages: ['00', '01', '02', '03', '07', '08', '10', '11'],
    outcome: 'Build defensible timelines, contain incidents and explain what happened.',
  },
  GRC: {
    title: 'Governance, risk and security leadership',
    stages: ['00', '02', '04', '07', '09', '11'],
    outcome: 'Connect technical evidence to business risk and useful controls.',
  },
  RESEARCH: {
    title: 'Vulnerability researcher',
    stages: ['00', '01', '02', '03', '05', '06', '08', '10', '11'],
    outcome: 'Turn unknown behaviour into reproducible, ethical research.',
  },
};

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  si: 'සිංහල interface',
  ta: 'தமிழ் interface',
};

export const UI_COPY: Record<Locale, { welcome: string; route: string; save: string; note: string }> = {
  en: {
    welcome: 'Build a route around your goal',
    route: 'Your recommended route',
    save: 'Build my route',
    note: 'Course lessons are currently in plain English. Core learner controls are translation-ready.',
  },
  si: {
    welcome: 'ඔබේ ඉලක්කයට ගැලපෙන මාර්ගයක් සාදන්න',
    route: 'ඔබට නිර්දේශිත මාර්ගය',
    save: 'මගේ මාර්ගය සාදන්න',
    note: 'පාඩම් දැනට සරල ඉංග්‍රීසියෙන් ඇත. මූලික පාලන පරිවර්තනයට සූදානම්ය.',
  },
  ta: {
    welcome: 'உங்கள் இலக்கிற்கு ஏற்ற பாதையை உருவாக்குங்கள்',
    route: 'உங்களுக்கான பரிந்துரைக்கப்பட்ட பாதை',
    save: 'என் பாதையை உருவாக்கு',
    note: 'பாடங்கள் தற்போது எளிய ஆங்கிலத்தில் உள்ளன. முக்கிய கட்டுப்பாடுகள் மொழிபெயர்ப்புக்குத் தயாராக உள்ளன.',
  },
};

export const MISSIONS: Mission[] = [
  {
    id: 'login-trail',
    title: 'The impossible login',
    role: 'SOC analyst',
    stage: '07',
    difficulty: 'STARTER',
    minutes: 18,
    brief: 'A finance user says they did not sign in overnight. Decide what happened and what to do next.',
    objective: 'Separate a suspicious sign-in from noise using identity and endpoint evidence.',
    artefactLabel: 'identity.log',
    artefact: [
      '02:11:08Z user=mina source=203.0.113.81 country=LK result=SUCCESS mfa=push device=NEW',
      '02:11:34Z user=mina action=mailbox_rule_create target="Invoices" forward=outside@example.net',
      '02:14:02Z user=mina source=10.20.4.19 country=LK result=SUCCESS mfa=cached device=CORP-LT-044',
      '02:16:51Z user=mina endpoint=CORP-LT-044 event=screen_unlock actor=mina',
      '02:21:10Z user=mina action=mailbox_rule_delete target="Invoices" actor=admin',
    ],
    questions: [
      {
        id: 'signal',
        prompt: 'Which event most strongly shows account misuse?',
        options: ['A successful login', 'A forwarding rule to an external address', 'A screen unlock', 'An admin deleting a rule'],
        correct: 1,
        rationale: 'The rule creates a clear data-loss path and is unusual for the user; a successful login alone is weak evidence.',
      },
      {
        id: 'contain',
        prompt: 'What is the best first containment action?',
        options: ['Delete every mailbox', 'Disable the user forever', 'Revoke sessions, reset credentials and verify MFA', 'Block all traffic from Sri Lanka'],
        correct: 2,
        rationale: 'Session revocation and credential/MFA recovery contain the account while preserving a proportionate response.',
      },
      {
        id: 'preserve',
        prompt: 'What should be preserved before cleanup?',
        options: ['Only a screenshot', 'Identity and mailbox audit logs with timestamps', 'The user’s browser history only', 'Nothing; containment erases the need'],
        correct: 1,
        rationale: 'Time-correlated identity and mailbox logs support scope, root-cause and a defensible incident record.',
      },
    ],
    reportPrompt: 'Write a short incident note: verdict, strongest evidence, containment and one follow-up question.',
    reportTerms: ['forward', 'revoke', 'mfa', 'log'],
    hints: ['Start with the action that changes risk, not the event that merely looks unusual.', 'Ask which control stops an attacker who already has a session.', 'A strong note says what you know, what you infer and what remains unknown.'],
    source: { label: 'NIST SP 800-61r3', href: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final' },
  },
  {
    id: 'phish-wire',
    title: 'Invoice with a hidden route',
    role: 'SOC analyst',
    stage: '08',
    difficulty: 'STARTER',
    minutes: 16,
    brief: 'An accounts clerk reports an urgent invoice. Inspect the headers and message clues without opening the link.',
    objective: 'Reach a defensible phishing verdict and recommend safe containment.',
    artefactLabel: 'message.eml — selected headers',
    artefact: [
      'From: Accounts Team <billing@vendor-payments.example>',
      'Reply-To: urgent-settlement@proton.example',
      'Return-Path: bounce@mailer-cloud.example',
      'Authentication-Results: spf=softfail; dkim=none; dmarc=fail',
      'Subject: FINAL NOTICE — payment required in 30 minutes',
      'Link text: View secure invoice',
      'Link target: hxxps://vendor-login.example.invalid/session',
    ],
    questions: [
      {
        id: 'header',
        prompt: 'Which header bundle most strongly supports spoofing?',
        options: ['The subject line', 'SPF softfail, no DKIM and DMARC fail', 'The display name', 'The message length'],
        correct: 1,
        rationale: 'Authentication failures are stronger technical evidence than tone or appearance.',
      },
      {
        id: 'action',
        prompt: 'What should the analyst do with the URL?',
        options: ['Open it on the work laptop', 'Send it to friends', 'Defang it and analyse only in an approved sandbox', 'Shorten it first'],
        correct: 2,
        rationale: 'Defanging prevents accidental clicks; controlled tooling preserves safety and evidence.',
      },
      {
        id: 'scope',
        prompt: 'What query best begins scoping?',
        options: ['Search mail logs for the sender, domain and URL across recipients', 'Ask only this user', 'Delete the one message and stop', 'Block every new domain'],
        correct: 0,
        rationale: 'Searching shared indicators across recipients tests whether this is a campaign, not a single message.',
      },
    ],
    reportPrompt: 'Write a phishing verdict with two concrete indicators, the safe action and the scope query.',
    reportTerms: ['dmarc', 'domain', 'quarantine', 'recipient'],
    hints: ['Tone is a clue; authentication results are evidence.', 'Never turn an investigation into an infection by clicking casually.', 'Scope asks: who else received or interacted with the same indicators?'],
    source: { label: 'CISA phishing guidance', href: 'https://www.cisa.gov/secure-our-world/recognize-and-report-phishing' },
  },
  {
    id: 'access-gap',
    title: 'The order that was not yours',
    role: 'Application security',
    stage: '05',
    difficulty: 'CORE',
    minutes: 22,
    brief: 'A test user can request another test user’s order by changing one number in an API path.',
    objective: 'Identify broken object authorization and describe a server-side fix.',
    artefactLabel: 'safe-lab.http',
    artefact: [
      'GET /api/orders/1042 HTTP/1.1',
      'Authorization: Bearer test-user-a',
      'HTTP/1.1 200 OK  {"owner":"test-user-a","total":4200}',
      'GET /api/orders/1043 HTTP/1.1',
      'Authorization: Bearer test-user-a',
      'HTTP/1.1 200 OK  {"owner":"test-user-b","total":8700}',
    ],
    questions: [
      {
        id: 'class',
        prompt: 'What is the core failure?',
        options: ['Weak encryption', 'Broken object-level authorization', 'Cross-site scripting', 'A slow endpoint'],
        correct: 1,
        rationale: 'The server authenticates the caller but fails to verify that the caller may access this specific object.',
      },
      {
        id: 'fix',
        prompt: 'Where must the durable fix live?',
        options: ['Hide the order number in the UI', 'Use a longer URL', 'Enforce ownership or policy on every server-side object lookup', 'Add a warning banner'],
        correct: 2,
        rationale: 'Client controls are bypassable. Authorization must be checked on the server for every object request.',
      },
      {
        id: 'proof',
        prompt: 'What regression test best proves the fix?',
        options: ['The owner still gets 200 and a different user gets 403/404', 'The page looks unchanged', 'The ID has more digits', 'The server restarts'],
        correct: 0,
        rationale: 'A positive owner case plus a negative cross-user case proves both availability and isolation.',
      },
    ],
    reportPrompt: 'Write a finding with condition, impact, server-side remediation and one regression test.',
    reportTerms: ['authorization', 'owner', 'server', '403'],
    hints: ['Authentication answers “who”; authorization answers “may they do this?”', 'Changing the identifier is the test. The missing server decision is the bug.', 'A useful finding gives the developer a test they can automate.'],
    source: { label: 'OWASP API Security Top 10', href: 'https://owasp.org/API-Security/' },
  },
  {
    id: 'cloud-policy',
    title: 'The policy that grants the world',
    role: 'Cloud security',
    stage: '09',
    difficulty: 'CORE',
    minutes: 20,
    brief: 'A deployment role received a new policy. Review the policy as text and reduce its blast radius.',
    objective: 'Find excessive privilege and propose a least-privilege replacement.',
    artefactLabel: 'policy.json',
    artefact: [
      '{',
      '  "Effect": "Allow",',
      '  "Action": "*",',
      '  "Resource": "*",',
      '  "Condition": { "StringLike": { "aws:PrincipalTag/team": "*" } }',
      '}',
    ],
    questions: [
      {
        id: 'risk',
        prompt: 'What creates the largest blast radius?',
        options: ['JSON formatting', 'Wildcard actions and resources', 'The Allow word', 'Using tags'],
        correct: 1,
        rationale: 'Action * on Resource * can authorize almost anything the platform exposes.',
      },
      {
        id: 'condition',
        prompt: 'Why does the condition not meaningfully constrain access?',
        options: ['Tags never work', 'The wildcard matches any team tag value', 'Conditions are comments', 'JSON cannot contain conditions'],
        correct: 1,
        rationale: 'A wildcard value preserves broad eligibility rather than tying the role to a specific approved team.',
      },
      {
        id: 'improve',
        prompt: 'What is the best redesign?',
        options: ['Name exact required actions/resources and a specific condition', 'Rename the role', 'Add another wildcard', 'Share the credentials'],
        correct: 0,
        rationale: 'Least privilege makes action, resource and context as narrow as the workload permits.',
      },
    ],
    reportPrompt: 'Explain the risk, likely impact and a least-privilege policy shape. Name what logs you would inspect.',
    reportTerms: ['wildcard', 'resource', 'least privilege', 'cloudtrail'],
    hints: ['Read permission as: who may do what to which thing under what condition?', 'A condition containing * may look precise while granting almost no precision.', 'Good remediation names both the allowed verbs and the allowed resources.'],
    source: { label: 'AWS IAM best practices', href: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html' },
  },
  {
    id: 'scan-triage',
    title: 'Three open doors',
    role: 'Penetration testing',
    stage: '06',
    difficulty: 'CORE',
    minutes: 19,
    brief: 'An authorised lab scan finds three services. Choose the next safe validation step and avoid conclusions the scan cannot support.',
    objective: 'Interpret scan evidence without confusing a banner with a vulnerability.',
    artefactLabel: 'nmap-lab.txt',
    artefact: [
      'Nmap scan report for 10.10.10.24 (authorised lab)',
      '22/tcp  open  ssh     OpenSSH 8.9p1',
      '80/tcp  open  http    nginx 1.22.1',
      '443/tcp open  ssl/http nginx 1.22.1',
      'Service detection performed. Versions may be inaccurate.',
    ],
    questions: [
      {
        id: 'claim',
        prompt: 'What can this output prove by itself?',
        options: ['The host is compromised', 'Those ports responded and banners were inferred', 'Every service is vulnerable', 'The owner uses weak passwords'],
        correct: 1,
        rationale: 'A scan establishes observed network behaviour; it does not prove exploitability or compromise.',
      },
      {
        id: 'next',
        prompt: 'What is the best next action inside scope?',
        options: ['Brute-force SSH', 'Enumerate the web service and validate TLS/configuration safely', 'Scan the public internet', 'Publish the IP'],
        correct: 1,
        rationale: 'Controlled enumeration gathers evidence while remaining inside the authorised target and avoiding disruptive guesses.',
      },
      {
        id: 'report',
        prompt: 'How should the version banner be written in a report?',
        options: ['Confirmed vulnerability', 'Observed service fingerprint requiring validation', 'Guaranteed patch level', 'Proof of data loss'],
        correct: 1,
        rationale: 'Banners can be hidden or altered. Report the observation and the validation gap precisely.',
      },
    ],
    reportPrompt: 'Write a scope-safe triage note: observations, limitations, next validation step and stop condition.',
    reportTerms: ['authorised', 'observed', 'validate', 'scope'],
    hints: ['A tool reports signals. Your job is to label what is observation versus conclusion.', 'Prefer a reversible, low-impact next test.', 'A professional note includes when you will stop and ask for permission.'],
    source: { label: 'Nmap reference guide', href: 'https://nmap.org/book/man.html' },
  },
  {
    id: 'ransomware-timeline',
    title: 'Eight minutes before encryption',
    role: 'Incident response',
    stage: '08',
    difficulty: 'ADVANCED',
    minutes: 28,
    brief: 'Reconstruct a short ransomware timeline and choose containment that preserves recovery options.',
    objective: 'Correlate identity, process and network evidence into a defensible sequence.',
    artefactLabel: 'case-17.timeline',
    artefact: [
      '09:02:11 MAIL user=lee attachment="Q3-adjustment.xlsm" opened=true',
      '09:03:04 EDR host=FIN-07 process=excel.exe child=powershell.exe encoded=true',
      '09:03:41 DNS host=FIN-07 query=sync-share.example.invalid',
      '09:04:18 AUTH user=lee target=FS-02 type=network logon=success',
      '09:06:03 FILE host=FS-02 extension=.locked count=1840',
      '09:06:19 EDR host=FIN-07 process=vssadmin.exe args="delete shadows"',
      '09:10:22 NET host=FIN-07 isolated=true',
    ],
    questions: [
      {
        id: 'entry',
        prompt: 'What is the most likely initial execution point?',
        options: ['The DNS query', 'Excel spawning encoded PowerShell after the attachment opened', 'The network logon', 'Host isolation'],
        correct: 1,
        rationale: 'The parent-child process chain immediately following attachment execution is the strongest initial execution evidence.',
      },
      {
        id: 'scope',
        prompt: 'Which asset must be treated as affected, not merely adjacent?',
        options: ['Only the mailbox', 'FIN-07 and FS-02', 'Every device worldwide', 'No asset until the ransom note appears'],
        correct: 1,
        rationale: 'FIN-07 executed the chain and FS-02 shows mass file modification following a successful network logon.',
      },
      {
        id: 'contain',
        prompt: 'What response best balances containment and evidence?',
        options: ['Immediately wipe both hosts', 'Isolate affected hosts, disable/restrict the account, preserve telemetry and protect backups', 'Pay immediately', 'Turn off all logging'],
        correct: 1,
        rationale: 'Isolation and identity containment stop spread while telemetry and backups preserve investigation and recovery choices.',
      },
    ],
    reportPrompt: 'Write the timeline in order, separate fact from inference, name containment and list one evidence gap.',
    reportTerms: ['powershell', 'fs-02', 'isolate', 'evidence'],
    hints: ['Build a clock before building a story.', 'A child process can be more revealing than a filename.', 'Containment should reduce spread without destroying the evidence needed to recover.'],
    source: { label: 'MITRE ATT&CK Enterprise', href: 'https://attack.mitre.org/' },
  },
];

export const CAPSTONES: Capstone[] = [
  { id: 'soc-case', role: 'BLUE', title: 'SOC incident case report', stage: '08', brief: 'Turn an alert trail into a one-page analyst decision record.', checks: ['Timeline separates facts from inference', 'Severity and scope are justified', 'Containment is proportionate', 'Next evidence request is explicit'], prompt: 'Paste or write the executive summary and link to your redacted report.' },
  { id: 'pentest-finding', role: 'RED', title: 'Reproducible pentest finding', stage: '06', brief: 'Document one legal lab finding so another tester can reproduce it.', checks: ['Scope and permission are stated', 'Steps are reproducible', 'Impact does not exaggerate evidence', 'Remediation includes a verification test'], prompt: 'Write the finding summary, affected component and evidence location.' },
  { id: 'threat-model', role: 'APP', title: 'Product threat model', stage: '04', brief: 'Model assets, trust boundaries, threats and controls for a small product.', checks: ['Assets and actors are named', 'Trust boundaries are visible', 'Threats connect to assets', 'Controls have owners and tests'], prompt: 'Describe the product, top threat and the control you would test first.' },
  { id: 'cloud-review', role: 'CLOUD', title: 'Cloud identity review', stage: '09', brief: 'Review a safe sample policy and produce a least-privilege change plan.', checks: ['Privilege paths are mapped', 'Wildcards are justified or removed', 'Logging covers sensitive actions', 'Rollback and validation are included'], prompt: 'Summarise the riskiest privilege path and the safer target state.' },
  { id: 'ir-timeline', role: 'DFIR', title: 'Incident timeline and handoff', stage: '08', brief: 'Produce a timestamped timeline that another responder can continue.', checks: ['Times use one timezone', 'Evidence sources are cited', 'Facts and hypotheses are labelled', 'Open questions have owners'], prompt: 'Write the turning point in the incident and the next responder action.' },
  { id: 'risk-brief', role: 'GRC', title: 'Risk decision brief', stage: '11', brief: 'Translate a technical weakness into a decision a business owner can make.', checks: ['Asset and business consequence are clear', 'Likelihood uses evidence', 'Options include cost/trade-off', 'A decision owner and review date exist'], prompt: 'Write the decision requested and the evidence supporting it.' },
  { id: 'research-note', role: 'RESEARCH', title: 'Responsible research note', stage: '10', brief: 'Record a safe experiment with a falsifiable claim and reproducible method.', checks: ['Hypothesis is falsifiable', 'Environment is isolated and legal', 'Method can be reproduced', 'Disclosure boundaries are stated'], prompt: 'State your hypothesis, result and the limit of what the evidence proves.' },
  { id: 'junior-toolkit', role: 'INTERN', title: 'Junior analyst evidence pack', stage: '12', brief: 'Combine one audit, one small script and one clear written explanation.', checks: ['Audit has a defined scope', 'Script has usage and safety notes', 'Output is redacted', 'Reflection names what you would improve'], prompt: 'Summarise the three artefacts and where a reviewer can inspect them.' },
];

export function emptyAcademy(): AcademyState {
  return { version: 1, profile: null, missions: {}, capstones: {} };
}

export function emptyMissionRun(): MissionRun {
  return { answers: {}, report: '', score: null, reportScore: 0, attempts: 0, completedAt: null };
}

export function emptyCapstoneRun(checkCount: number): CapstoneRun {
  return { checks: Array.from({ length: checkCount }, () => false), notes: '', completedAt: null };
}

export function safeAcademy(input: unknown): AcademyState {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return emptyAcademy();
  const raw = input as Partial<AcademyState>;
  const profileRaw = raw.profile && typeof raw.profile === 'object' && !Array.isArray(raw.profile)
    ? raw.profile as Partial<LearnerProfile>
    : null;
  const profile = profileRaw &&
    ['new', 'some', 'working'].includes(String(profileRaw.experience)) &&
    Object.hasOwn(ROLE_ROUTES, String(profileRaw.role)) &&
    typeof profileRaw.weeklyHours === 'number' &&
    Number.isFinite(profileRaw.weeklyHours) &&
    ['sprint', 'steady', 'deep'].includes(String(profileRaw.pace)) &&
    ['en', 'si', 'ta'].includes(String(profileRaw.locale))
      ? {
          experience: profileRaw.experience as Experience,
          role: profileRaw.role as RoleCode,
          weeklyHours: Math.max(1, Math.min(40, Math.round(profileRaw.weeklyHours))),
          pace: profileRaw.pace as Pace,
          locale: profileRaw.locale as Locale,
          createdAt: typeof profileRaw.createdAt === 'string' ? profileRaw.createdAt.slice(0, 64) : new Date(0).toISOString(),
        }
      : null;

  const missions: Record<string, MissionRun> = {};
  if (raw.missions && typeof raw.missions === 'object' && !Array.isArray(raw.missions)) {
    for (const mission of MISSIONS) {
      const candidate = (raw.missions as Record<string, unknown>)[mission.id];
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
      const run = candidate as Partial<MissionRun>;
      const answers: Record<string, number> = {};
      if (run.answers && typeof run.answers === 'object' && !Array.isArray(run.answers)) {
        for (const question of mission.questions) {
          const answer = (run.answers as Record<string, unknown>)[question.id];
          if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < question.options.length) {
            answers[question.id] = answer;
          }
        }
      }
      missions[mission.id] = {
        answers,
        report: typeof run.report === 'string' ? run.report.slice(0, 1600) : '',
        score: typeof run.score === 'number' && Number.isFinite(run.score) ? Math.max(0, Math.min(100, Math.round(run.score))) : null,
        reportScore: typeof run.reportScore === 'number' && Number.isFinite(run.reportScore) ? Math.max(0, Math.min(25, Math.round(run.reportScore))) : 0,
        attempts: typeof run.attempts === 'number' && Number.isFinite(run.attempts) ? Math.max(0, Math.min(1000, Math.round(run.attempts))) : 0,
        completedAt: typeof run.completedAt === 'string' ? run.completedAt.slice(0, 64) : null,
      };
    }
  }

  const capstones: Record<string, CapstoneRun> = {};
  if (raw.capstones && typeof raw.capstones === 'object' && !Array.isArray(raw.capstones)) {
    for (const capstone of CAPSTONES) {
      const candidate = (raw.capstones as Record<string, unknown>)[capstone.id];
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
      const run = candidate as Partial<CapstoneRun>;
      capstones[capstone.id] = {
        checks: capstone.checks.map((_, index) => Array.isArray(run.checks) && run.checks[index] === true),
        notes: typeof run.notes === 'string' ? run.notes.slice(0, 1800) : '',
        completedAt: typeof run.completedAt === 'string' ? run.completedAt.slice(0, 64) : null,
      };
    }
  }
  return {
    version: 1,
    profile,
    missions,
    capstones,
  };
}

export function missionScore(mission: Mission, run: MissionRun): { score: number; reportScore: number; passed: boolean } {
  const correct = mission.questions.filter((q) => run.answers[q.id] === q.correct).length;
  const questionScore = Math.round((correct / mission.questions.length) * 75);
  const normal = run.report.trim().toLowerCase();
  const termHits = mission.reportTerms.filter((term) => normal.includes(term.toLowerCase())).length;
  const lengthPoints = normal.length >= 120 ? 10 : normal.length >= 70 ? 6 : normal.length >= 35 ? 3 : 0;
  const reportScore = Math.min(25, lengthPoints + Math.round((termHits / mission.reportTerms.length) * 15));
  const score = questionScore + reportScore;
  return { score, reportScore, passed: score >= 70 && reportScore >= 12 };
}

export function routeWeeks(stageHours: number, weeklyHours: number): number {
  return Math.max(1, Math.ceil(stageHours / Math.max(1, weeklyHours)));
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
