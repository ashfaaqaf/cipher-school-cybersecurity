export const SKILL_CHECK_STORE = 'cipher-school-skill-check';

export type SkillDomain =
  | 'Safety'
  | 'Foundations'
  | 'Risk'
  | 'Systems'
  | 'Networks'
  | 'Identity'
  | 'Web'
  | 'Operations'
  | 'Cloud'
  | 'Tooling';

export type SkillQuestion = {
  id: string;
  domain: SkillDomain;
  prompt: string;
  options: string[];
  correct: number;
  lessonId: string;
  lessonTitle: string;
  rationale: string;
};

export type SkillCheckState = {
  answers: Record<string, number>;
  completedAt: string | null;
  attempts: number;
};

export const SKILL_QUESTIONS: SkillQuestion[] = [
  {
    id: 'scope',
    domain: 'Safety',
    prompt: 'A manager sends you a production IP and asks for a quick vulnerability scan. You have no written scope. What should you do first?',
    options: [
      'Run a quiet scan so nobody notices',
      'Get written permission, scope and stop conditions',
      'Scan only the most common ports',
      'Ask a friend to scan it instead',
    ],
    correct: 1,
    lessonId: '00-4',
    lessonTitle: 'Permission, law and the line you never cross',
    rationale: 'A technical request is not enough. Written authorization defines the systems, actions, timing and stop conditions you are allowed to use.',
  },
  {
    id: 'cia',
    domain: 'Foundations',
    prompt: 'Ransomware encrypts a hospital schedule so staff cannot open it. Which security promise failed most directly?',
    options: ['Confidentiality', 'Availability', 'Authenticity', 'Non-repudiation'],
    correct: 1,
    lessonId: '00-2',
    lessonTitle: 'The three promises: CIA',
    rationale: 'The immediate failure is availability because authorized staff cannot reach the information when they need it.',
  },
  {
    id: 'risk',
    domain: 'Risk',
    prompt: 'Which issue should normally be investigated first?',
    options: [
      'A high-severity finding on an isolated system being retired tomorrow',
      'A medium-severity authorization bypass on an internet-facing customer portal',
      'Whichever finding has the largest CVSS number',
      'Whichever finding was reported most recently',
    ],
    correct: 1,
    lessonId: '04-1',
    lessonTitle: 'Risk: the measure that guides priorities',
    rationale: 'Context changes priority. Exposure, realistic exploitability and business impact can make the authorization bypass the larger risk.',
  },
  {
    id: 'permissions',
    domain: 'Systems',
    prompt: 'A service cannot read one configuration file. Someone suggests chmod 777. What is the better fix?',
    options: [
      'Give everyone full access permanently',
      'Run the service as root',
      'Grant only the required user or group the required permission',
      'Copy the file into a public folder',
    ],
    correct: 2,
    lessonId: '01-3',
    lessonTitle: 'Files, filesystems and permissions',
    rationale: 'The least-privilege fix grants the specific service identity only the access it needs. chmod 777 creates a much larger problem.',
  },
  {
    id: 'firewall',
    domain: 'Networks',
    prompt: 'A firewall allows inbound TCP traffic to port 443. What does that prove?',
    options: [
      'The website is secure',
      'Authorized users are the only people who can connect',
      'Traffic can reach a service listening on that port',
      'The server has no other open ports',
    ],
    correct: 2,
    lessonId: '02-4',
    lessonTitle: 'Routing, firewalls and ports',
    rationale: 'A firewall rule describes reachable traffic. It does not prove the application is safe, correctly configured or restricted to good users.',
  },
  {
    id: 'tls',
    domain: 'Networks',
    prompt: 'A browser shows a valid HTTPS certificate. What can you safely conclude?',
    options: [
      'The organization behind the site is trustworthy',
      'The connection is encrypted to a party controlling that domain',
      'The site contains no malware',
      'Every page on the site was security tested',
    ],
    correct: 1,
    lessonId: '02-7',
    lessonTitle: 'HTTP, TLS and certificates',
    rationale: 'TLS protects the connection and binds it to the certified domain. It does not judge the owner, content or application security.',
  },
  {
    id: 'authorization',
    domain: 'Identity',
    prompt: 'A signed-in user changes /orders/412 to /orders/413 and sees another customer’s order. What failed?',
    options: ['Authentication', 'Object-level authorization', 'Encryption', 'Input encoding'],
    correct: 1,
    lessonId: '05-2',
    lessonTitle: 'Broken access control',
    rationale: 'The server knows who the user is but fails to check whether that user may access this specific order.',
  },
  {
    id: 'injection',
    domain: 'Web',
    prompt: 'What is the strongest general defence when user input must be used in a database query?',
    options: [
      'Remove spaces from the input',
      'Hide database errors',
      'Use parameterized queries and separate code from values',
      'Encode the page as UTF-8',
    ],
    correct: 2,
    lessonId: '05-3',
    lessonTitle: 'Injection: when data becomes instruction',
    rationale: 'Parameterized queries preserve the query structure and pass values separately, so input cannot become database instruction.',
  },
  {
    id: 'evidence',
    domain: 'Operations',
    prompt: 'A user reports an unfamiliar login followed by a mailbox forwarding rule. What should be preserved before cleanup?',
    options: [
      'Only a screenshot of the alert',
      'Identity and mailbox audit logs with timestamps',
      'The user’s desktop wallpaper',
      'Nothing once the password is changed',
    ],
    correct: 1,
    lessonId: '07-1',
    lessonTitle: 'Telemetry: you can only detect what you collect',
    rationale: 'Time-correlated identity and mailbox logs support scoping, containment and a defensible record of what happened.',
  },
  {
    id: 'triage',
    domain: 'Operations',
    prompt: 'A detection fires during approved administrator maintenance. What is the most professional response?',
    options: [
      'Disable the detection permanently',
      'Call it a false positive and delete the logs',
      'Validate the change, document the evidence and tune using reliable context',
      'Escalate it as a confirmed breach',
    ],
    correct: 2,
    lessonId: '07-8',
    lessonTitle: 'Triage, hunting and closing the loop',
    rationale: 'Good triage validates the activity and preserves the reasoning. Tuning should use dependable context without hiding similar malicious behavior.',
  },
  {
    id: 'cloud',
    domain: 'Cloud',
    prompt: 'In a typical public cloud service, which responsibility usually remains with the customer?',
    options: [
      'Physical security of the provider’s data centre',
      'Replacing failed disks in the provider’s racks',
      'Configuring identities, permissions and data access',
      'Maintaining the provider’s global backbone',
    ],
    correct: 2,
    lessonId: '09-1',
    lessonTitle: 'Shared responsibility, and who owns what',
    rationale: 'The provider secures the cloud infrastructure. The customer still owns how identities, permissions, workloads and data are configured.',
  },
  {
    id: 'nmap',
    domain: 'Tooling',
    prompt: 'Nmap reports 22/tcp open and identifies OpenSSH 8.9p1. What does that output prove by itself?',
    options: [
      'The host is compromised',
      'SSH responded and the version fingerprint still needs validation',
      'The SSH service is definitely vulnerable',
      'The administrator uses weak passwords',
    ],
    correct: 1,
    lessonId: '12-4',
    lessonTitle: 'Nmap for real work',
    rationale: 'The scan supports an observation about reachability and a likely service fingerprint. It does not prove a vulnerability or compromise.',
  },
];

export function emptySkillCheck(): SkillCheckState {
  return { answers: {}, completedAt: null, attempts: 0 };
}

export function safeSkillCheck(input: unknown): SkillCheckState {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return emptySkillCheck();
  const raw = input as Record<string, unknown>;
  const source = raw.answers && typeof raw.answers === 'object' && !Array.isArray(raw.answers)
    ? raw.answers as Record<string, unknown>
    : {};
  const answers: Record<string, number> = {};

  for (const question of SKILL_QUESTIONS) {
    const value = source[question.id];
    if (Number.isInteger(value) && Number(value) >= 0 && Number(value) < question.options.length) {
      answers[question.id] = Number(value);
    }
  }

  return {
    answers,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt.slice(0, 40) : null,
    attempts: typeof raw.attempts === 'number' && Number.isFinite(raw.attempts)
      ? Math.max(0, Math.min(1000, Math.floor(raw.attempts)))
      : 0,
  };
}

export function assessmentResult(answers: Record<string, number>) {
  const correct = SKILL_QUESTIONS.filter((question) => answers[question.id] === question.correct).length;
  const score = Math.round((correct / SKILL_QUESTIONS.length) * 100);
  const domains = [...new Set(SKILL_QUESTIONS.map((question) => question.domain))].map((domain) => {
    const questions = SKILL_QUESTIONS.filter((question) => question.domain === domain);
    const right = questions.filter((question) => answers[question.id] === question.correct).length;
    return { domain, right, total: questions.length, percent: Math.round((right / questions.length) * 100) };
  });
  const gaps = SKILL_QUESTIONS.filter((question) => answers[question.id] !== question.correct);
  const priorityLessons = gaps.filter((question, index, list) => list.findIndex((item) => item.lessonId === question.lessonId) === index);

  const band = score >= 85
    ? { label: 'Strong baseline', note: 'Move into missions and use the lesson gaps below as targeted refreshers.' }
    : score >= 70
      ? { label: 'Working foundation', note: 'Your base is useful. Close the named gaps before choosing a deep speciality.' }
      : score >= 40
        ? { label: 'Developing foundation', note: 'Start with the priority lessons below, then retake this check after practice.' }
        : { label: 'Foundation first', note: 'Begin at stage 00 and build in order. A careful foundation will save time later.' };

  return { correct, score, domains, gaps, priorityLessons, band };
}
