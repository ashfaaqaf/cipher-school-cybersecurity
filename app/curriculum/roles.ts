/**
 * Real junior adverts, broken into their individual requirements and mapped to
 * the lessons that actually cover each one.
 *
 * The point is to make a requirements list stop being intimidating. A line like
 * "Perform VAPT on web, API and infrastructure systems" is four lessons you have
 * either done or not — and the app can tell you which.
 */

export type Requirement = {
  /** The line as it appears in the advert. */
  text: string;
  /** Lessons that cover it. Empty means it is not a knowledge requirement. */
  lessons: string[];
  /** What the requirement is really asking for, in plain words. */
  means: string;
};

export type Role = {
  id: string;
  title: string;
  org: string;
  place: string;
  hue: number;
  /** Where the advert was published, so its wording can be checked against the source. */
  source?: { name: string; href?: string; seen: string };
  /** Pay, only where an advert or a sourced guide actually states it. */
  pay?: string;
  /** How far off this role is right now — the honest sort order. */
  level: 'INTERN' | 'JUNIOR' | 'NEXT RUNG';
  /** An honest read of the role. */
  summary: string;
  /** What to show an employer, beyond a CV line. */
  evidence: string[];
  duties: Requirement[];
  requirements: Requirement[];
};

export const roles: Role[] = [
  {
    id: 'vapt-intern',
    title: 'Cybersecurity Intern',
    org: 'VAPT / offensive-leaning',
    place: 'Web, API and infrastructure testing',
    hue: 350,
    level: 'INTERN',
    source: { name: 'itpro.lk', href: 'https://itpro.lk/job/14714/cybersecurity-intern-at-navitsa/', seen: 'August 2026' },
    summary:
      'A hands-on testing role. You will spend most of your time scanning, removing false positives, verifying the real findings by hand, and writing them up. Broad lists like this usually mean a small team where you touch everything.',
    evidence: [
      'A findings report you wrote against a deliberately vulnerable app, with reproduction steps and evidence',
      'A Web Security Academy profile showing solved access control and injection labs',
      'An Nmap scan of your own lab, with a written note per open port on what you would check next',
    ],
    duties: [
      {
        text: 'Perform VAPT on web, API, and infrastructure systems',
        means: 'Scan broadly, then prove by hand which findings are real. Three target types, one workflow.',
        lessons: ['12-1', '05-2', '05-3', '05-6', '06-3', '02-4'],
      },
      {
        text: 'Assist security audits and compliance checks',
        means: 'Check whether claimed controls exist, operate, and can be evidenced.',
        lessons: ['12-6', '04-8'],
      },
      {
        text: 'API security testing',
        means: 'Test the API directly rather than through the interface — that is where the flaws are.',
        lessons: ['05-6', '12-2'],
      },
      {
        text: 'Support endpoint security assessments and monitoring',
        means: 'Know what telemetry endpoints produce and what normal looks like.',
        lessons: ['07-1', '07-5', '01-8'],
      },
      {
        text: 'Document vulnerabilities, risks, and remediation recommendations',
        means: 'Write findings a developer will act on. This is the actual deliverable.',
        lessons: ['12-5', '06-8', '12-7'],
      },
    ],
    requirements: [
      {
        text: 'Undergraduate or recent graduate in Cyber Security',
        means: 'A filter, not a skill. Evidence of work matters more than the wording of the degree.',
        lessons: [],
      },
      {
        text: 'Basic understanding of networking, web technologies, and OWASP Top 10',
        means: 'How data moves, how the web works, and the ten risks that break web apps most often.',
        lessons: ['02-1', '02-4', '02-7', '05-1', '05-2'],
      },
      {
        text: 'Familiarity with tools such as Burp Suite, OWASP ZAP, Nmap, or similar',
        means: 'Drive an intercepting proxy, run a scanner responsibly, and read Nmap output.',
        lessons: ['12-2', '12-3', '12-4'],
      },
      {
        text: 'Strong analytical skills and willingness to learn',
        means: 'Look for evidence that disconfirms your first conclusion, and keep a system for learning.',
        lessons: ['00-6', '07-8'],
      },
      {
        text: 'Nice to have: knowledge of cloud security (Azure/AWS)',
        means: 'Who owns which control in a cloud, and why identity is the perimeter.',
        lessons: ['09-1', '09-2', '09-4'],
      },
    ],
  },
  {
    id: 'control-assurance',
    title: 'Intern — Control Assurance',
    org: 'Audit / GRC-leaning',
    place: 'Audits, risk assessments and IT controls',
    hue: 45,
    level: 'INTERN',
    source: { name: 'shared by you — the advert did not name the employer', seen: 'August 2026' },
    summary:
      'No hacking required, and it is one of the most reliable ways into the industry. The work is establishing whether controls are real, operating, and evidenced — and writing that up clearly. Notice the advert asks for command of English before it asks for anything technical.',
    evidence: [
      'A working paper testing one control end to end: test steps, sample, evidence, exceptions',
      'A five-row risk register with owners and review dates actually filled in',
      'A one-page write-up of a control weakness and the improvement you would recommend',
    ],
    duties: [
      {
        text: 'Assist in cyber security audit activities and risk assessments',
        means: 'Sample, test, gather evidence, record exceptions. Then score and rank risks.',
        lessons: ['12-6', '12-7', '04-1'],
      },
      {
        text: 'Support review and documentation of IT security controls',
        means: 'Test design and operating effectiveness, and write it down so a reviewer can follow it.',
        lessons: ['12-6', '04-8', '12-5'],
      },
      {
        text: 'Help identify security risks and recommend improvements',
        means: 'State risks as cause and consequence, then propose proportionate treatment.',
        lessons: ['04-1', '04-6', '12-7'],
      },
      {
        text: 'Collaborate with IT and security teams to strengthen controls',
        means: 'Frame the same risk in the terms each audience already uses.',
        lessons: ['11-6', '04-4'],
      },
    ],
    requirements: [
      {
        text: 'Undergraduate student pursuing a degree in Cybersecurity or related field',
        means: 'A filter, not a skill.',
        lessons: [],
      },
      {
        text: 'Basic understanding of cybersecurity principles, audits and risk assessments',
        means: 'The five words, the three promises, and how an audit and a risk assessment actually run.',
        lessons: ['00-1', '00-2', '00-3', '12-6', '12-7'],
      },
      {
        text: 'Familiarity with IT security controls',
        means: 'Identity, layered defence, backups and patching — what the controls are and what they buy.',
        lessons: ['04-2', '04-4', '04-7', '12-6'],
      },
      {
        text: 'Excellent command of English, attention to detail and analytical skills',
        means: 'Writing is the deliverable here. Lead with the conclusion, be specific, state confidence honestly.',
        lessons: ['11-4', '12-5'],
      },
      {
        text: 'Eagerness to learn and ability to work collaboratively',
        means: 'A learning system that survives contact with a full-time job, and being someone people want to work with.',
        lessons: ['00-6', '11-8', '11-7'],
      },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Sri Lanka. Both of these were published adverts with their duties and
 * requirements quoted from the original listing.
 * ------------------------------------------------------------------ */

roles.push(
  {
    id: 'soc-analyst-l1',
    title: 'Cyber Security Analyst — Level 1',
    org: 'Marksmen Research · Colombo',
    place: 'SOC monitoring, 24/7 shifts',
    hue: 155,
    level: 'JUNIOR',
    source: { name: 'rooster.jobs', href: 'https://rooster.jobs/jobs/446912', seen: 'August 2026' },
    summary:
      'The classic way into the industry: watch the alerts, decide what is real, escalate what is not yours to fix. It explicitly says 0–2 years preferred but not required, which is as open a door as this field offers. Read the shift requirement carefully — nights and weekends are part of the job, not a footnote.',
    evidence: [
      'A detection lab: logs shipped into Wazuh or Elastic, with five rules you wrote and tested',
      'A written triage walkthrough of one alert — hypothesis, evidence checked, conclusion, what you ruled out',
      'An Atomic Red Team test you ran, with the alert it produced',
    ],
    duties: [
      {
        text: 'Actively monitor security alerts from SIEM platforms and analyse network activity',
        means: 'Live in the SIEM, query it fluently, and know what normal network behaviour looks like.',
        lessons: ['07-2', '07-6', '07-1'],
      },
      {
        text: 'Conduct initial analysis to verify incidents and escalate complex cases',
        means: 'Triage: is this real, how urgent, and is it mine to resolve or to hand on.',
        lessons: ['07-8'],
      },
      {
        text: 'Assist in containing, mitigating and resolving security incidents under supervision',
        means: 'The response lifecycle, and why containing too early can make things worse.',
        lessons: ['08-1'],
      },
      {
        text: 'Perform preliminary investigations using open-source intelligence tools and threat feeds',
        means: 'Enrich an indicator without tipping off the attacker, and judge feed quality.',
        lessons: ['06-2', '07-7'],
      },
      {
        text: 'Document incidents and generate detailed incident reports',
        means: 'Write it so the next analyst — often you at 3am — can follow what you checked.',
        lessons: ['12-5', '08-2', '11-4'],
      },
      {
        text: 'Collaborate across shifts for continuous monitoring and incident handover',
        means: 'A handover is a written artefact, not a conversation.',
        lessons: ['07-8', '11-6'],
      },
    ],
    requirements: [
      {
        text: '0–2 years SOC or cybersecurity experience preferred but not required',
        means: 'An explicit invitation to apply without experience. Bring evidence instead.',
        lessons: ['12-8'],
      },
      {
        text: 'Basic understanding of networking fundamentals and cybersecurity concepts',
        means: 'Layers, addressing, ports, and the five words that describe any security problem.',
        lessons: ['02-1', '02-3', '02-4', '00-2', '00-3'],
      },
      {
        text: 'Familiarity with SIEM systems, IDS/IPS, firewalls and antivirus solutions',
        means: 'What each one sees, and just as importantly what each one is blind to.',
        lessons: ['07-2', '07-6', '02-4', '07-5'],
      },
      {
        text: 'Proficiency in Linux/Unix and Windows operating systems',
        means: 'Drive both shells, find the logs, and read what is running.',
        lessons: ['01-4', '01-5', '01-8'],
      },
      {
        text: 'CompTIA Security+, CySA+ or equivalent certifications are advantageous',
        means: 'Advantageous, not required. Certifications validate; they do not replace evidence.',
        lessons: ['11-5'],
      },
      {
        text: 'Availability for 24/7 shift work including nights, weekends and holidays',
        means: 'A real cost worth weighing honestly. Shift work and alert fatigue are the two things that burn analysts out.',
        lessons: ['11-7'],
      },
    ],
  },
  {
    id: 'fincsirt-junior',
    title: 'Junior Information Security Analyst',
    org: 'LankaPay · FinCSIRT · Colombo',
    place: 'Financial-sector incident response',
    hue: 195,
    level: 'JUNIOR',
    source: { name: 'lankapay.net', href: 'https://lankapay.net/en/vacancy-details/junior-information-security-analyst', seen: 'listing closed January 2025' },
    summary:
      'A sector CSIRT: the team the banks call. Unusually broad for a junior role — incident response, vulnerability research, testing and awareness training in one job. That breadth is the appeal. This particular listing has closed, but FinCSIRT and roles shaped like it recur, and the requirement list is worth treating as a target.',
    evidence: [
      'A weekly threat brief you wrote for a sector, in plain language, over a month',
      'An incident timeline reconstructed from a public breach report',
      'A vulnerability write-up mapping a recent CVE to who it affects and what to do first',
    ],
    duties: [
      {
        text: 'Assist the team in responding to information security incidents',
        means: 'Preserve evidence, establish scope, contain, and write it up defensibly.',
        lessons: ['08-1', '08-2', '07-8'],
      },
      {
        text: 'Conduct daily research on current vulnerabilities and new threats for the financial sector',
        means: 'Triage the firehose by relevance, not novelty — CVSS, EPSS and the KEV list.',
        lessons: ['04-6', '07-7', '11-7'],
      },
      {
        text: 'Update the knowledge base and send alerts to members',
        means: 'Technical writing for an audience that must act, not admire.',
        lessons: ['11-4', '12-5'],
      },
      {
        text: 'Assist the team in conducting Vulnerability Analysis and Penetration Testing',
        means: 'The same VAPT loop: scope, scan, verify by hand, report, retest.',
        lessons: ['12-1', '12-2', '12-4', '05-2'],
      },
      {
        text: 'Testing, deployment and maintenance of information security systems',
        means: 'Run the tooling as well as read its output — telemetry, hardening, backups.',
        lessons: ['07-1', '01-8', '04-7'],
      },
      {
        text: 'Assist in conducting security awareness training',
        means: 'Short, specific and blame-free beats an annual video with a quiz.',
        lessons: ['04-8', '11-8'],
      },
      {
        text: 'Assist in research and development in emerging areas of information security',
        means: 'Narrow questions, reproducible method, honest about what you did not prove.',
        lessons: ['11-1', '10-8'],
      },
    ],
    requirements: [
      {
        text: 'Bachelor’s degree in Information Security, Computer Science, Computer Engineering or equivalent',
        means: 'A filter. "Or equivalent professional qualification" is doing real work in that sentence.',
        lessons: [],
      },
      {
        text: 'Information security certifications (CSX, CEH) advantageous',
        means: 'Advantageous, not required — and worth choosing only once a role you want asks for one.',
        lessons: ['11-5'],
      },
      {
        text: 'Vendor certifications in systems and network administration (MCSE, CCNA, RHCE) advantageous',
        means: 'They are really asking whether you can administer Linux, Windows and a network.',
        lessons: ['01-4', '01-5', '02-4'],
      },
      {
        text: 'Prior work experience in a similar environment (internship) preferred',
        means: 'Preferred, not required. A documented home lab is the closest substitute and it counts.',
        lessons: ['00-5', '12-8'],
      },
    ],
  },
);

roles.push(
  {
    id: 'innov8-intern',
    title: 'Intern — Observability & Security',
    org: 'INNOV8 · Colombo',
    place: 'Cloud, DevOps and security, all at once',
    hue: 265,
    level: 'INTERN',
    source: { name: 'itpro.lk', href: 'https://itpro.lk/job/14721/intern-%e2%80%93-observability-security-at-innov8/', seen: 'August 2026' },
    summary:
      'Read this one carefully, because it is the clearest statement in any of these adverts of what actually gets a beginner hired. It asks only for a foundation and basic exposure — and then its preferred list is personal projects, test labs, a GitHub repository, Python or Bash, and TryHackMe or Hack The Box. Every one of those is something you can produce yourself this month, without permission from anyone.',
    evidence: [
      'A GitHub repository with a small security tool you wrote and documented',
      'A home lab write-up: what you built, what broke, what you learned',
      'A TryHackMe or Hack The Box profile with completed rooms',
    ],
    duties: [
      {
        text: 'Observability, SIEM and monitoring',
        means: 'Collect the right telemetry, then query it fluently enough to answer a question.',
        lessons: ['07-1', '07-2'],
      },
      {
        text: 'Cloud platforms (AWS / Azure / GCP)',
        means: 'Shared responsibility, cloud identity, and why the control plane is the crime scene.',
        lessons: ['09-1', '09-2', '09-4'],
      },
      {
        text: 'Docker, Kubernetes and Terraform / IaC',
        means: 'What containers do and do not isolate, and Kubernetes defaults that surprise people.',
        lessons: ['01-6', '09-5', '09-6', '09-7'],
      },
      {
        text: 'CI/CD and Git',
        means: 'Treat the pipeline as production, and never let a secret reach a commit.',
        lessons: ['03-8', '09-7'],
      },
      {
        text: 'App and API security',
        means: 'Broken access control and the API version of it, which is number one on both lists.',
        lessons: ['05-2', '05-6'],
      },
      {
        text: 'Networking and vulnerability management',
        means: 'Read the traffic, then rank the findings by exposure rather than by score.',
        lessons: ['02-1', '02-4', '04-6', '12-1'],
      },
      {
        text: 'AI security',
        means: 'Prompt injection and excessive agency — the risks nobody has fully solved yet.',
        lessons: ['10-7'],
      },
    ],
    requirements: [
      {
        text: 'Has a foundation in IT, CS, Networking or Cybersecurity',
        means: 'A foundation. Not a specialism, not experience.',
        lessons: ['00-1', '00-3'],
      },
      {
        text: 'Basic exposure to scripting, SDLC, DevOps, systems, networking and security concepts',
        means: 'Enough Python or Bash to automate something, and enough of the rest to hold a conversation.',
        lessons: ['03-1', '03-2', '01-4', '02-1'],
      },
      {
        text: 'Is curious, analytical and self-driven to learn',
        means: 'A learning system, and the habit of looking for what would disprove you.',
        lessons: ['00-6', '07-8'],
      },
      {
        text: 'Takes initiative and communicates well in a team',
        means: 'Writing is the job more often than beginners expect.',
        lessons: ['11-4', '11-6'],
      },
      {
        text: 'Preferred: personal projects, test labs, GitHub, Python/Bash, CTF / TryHackMe / HTB',
        means: 'This is the whole answer to "I have no experience". Build the lab, publish the write-up, link it.',
        lessons: ['00-5', '12-8', '03-1'],
      },
    ],
  },
  {
    id: 'cms-infosec-analyst',
    title: 'Information Security Analyst',
    org: 'CMS (Pvt) Ltd · Colombo',
    place: 'Frameworks, audits and data protection · 3+ years',
    hue: 25,
    level: 'NEXT RUNG',
    source: { name: 'itpro.lk', href: 'https://itpro.lk/job/14582/information-security-analyst-at-cms-pvt-ltd/', seen: 'August 2026' },
    summary:
      'Not reachable yet — it asks for three years — but worth reading now, because it shows where the control assurance route leads. Notice how little of it is technical: frameworks, data protection law, documentation, and communicating with a US team. This is what the audit path pays off into, and the skills compound rather than expire.',
    evidence: [
      'A completed ISO 27001 Annex A gap assessment for a small imagined company',
      'A filled-in vendor security questionnaire, with your reasoning for each answer',
      'A written summary of what GDPR actually requires of an engineering team',
    ],
    duties: [
      {
        text: 'Knowledge of infosec policies, frameworks and audits such as the ISO 27000 series and SOC 2',
        means: 'What each framework is for, and how a control gets tested and evidenced.',
        lessons: ['04-8', '12-6'],
      },
      {
        text: 'Knowledge of data protection laws such as CCPA and GDPR',
        means: 'Lawful basis, data minimisation, retention limits, breach notification deadlines.',
        lessons: ['04-8'],
      },
      {
        text: 'Ability to complete security questionnaires and forms',
        means: 'Answer accurately from evidence, and never claim a control you cannot demonstrate.',
        lessons: ['12-6', '11-4'],
      },
      {
        text: 'Strong documentation skills with excellent attention to detail',
        means: 'The written record is the deliverable, and it has to survive a reviewer.',
        lessons: ['12-5', '11-4'],
      },
    ],
    requirements: [
      {
        text: '3+ years of experience related to information security',
        means: 'The gap between you and this role, and roughly what an internship plus two years closes.',
        lessons: [],
      },
      {
        text: 'Basic knowledge of cyber security and data protection measures',
        means: 'The three promises, encryption and key handling, and what protects data at rest.',
        lessons: ['00-2', '04-3', '09-3'],
      },
      {
        text: 'A strong proactive communicator with excellent written and verbal English',
        means: 'Named before anything technical, in both this and the control assurance advert. That is not an accident.',
        lessons: ['11-4', '11-6'],
      },
      {
        text: 'Schedule flexibility for partial overlap with APAC or US time zones',
        means: 'A real cost of working with overseas clients. Worth weighing honestly.',
        lessons: ['11-7'],
      },
    ],
  },
);

/**
 * Market context for Sri Lanka, from a sourced careers guide rather than from
 * any single advert. Useful for calibrating expectations before applying.
 */
export const marketNote = {
  region: 'Sri Lanka',
  source: { name: 'Ceylon Open Campus careers guide', href: 'https://www.coccampus.lk/cyber-security-career-guide-sri-lanka', seen: 'August 2026' },
  points: [
    'Banks and financial institutions are the largest employers, driven by Central Bank requirements for dedicated security functions — Commercial Bank, Sampath, HNB, Nations Trust and others.',
    'Then telecommunications, BPO, insurers and the export IT firms — Virtusa, WSO2, IFS — plus the consultancies, Accenture, KPMG, PwC and Deloitte.',
    'Entry-level roles are usually titled SOC Analyst Tier 1, IT security assistant or junior network administrator.',
    'Most listings ask for a degree or HND in IT, computer science or cyber security, with CompTIA Security+ and CEH the certifications named most often.',
    'Published entry-level bands run roughly LKR 50,000–80,000 a month, with SOC analyst roles around LKR 80,000–120,000, rising with two to three years and a certification.',
    'Most vacancies are in Colombo, though remote-friendly roles for overseas clients are increasingly common.',
  ],
};

/** Reachable roles first, so the list opens on what you could apply to now. */
const ORDER: Record<Role['level'], number> = { INTERN: 0, JUNIOR: 1, 'NEXT RUNG': 2 };
roles.sort((a, b) => ORDER[a.level] - ORDER[b.level]);

/** Every lesson a role touches, deduplicated. */
export function roleLessons(role: Role): string[] {
  return [...new Set([...role.duties, ...role.requirements].flatMap((r) => r.lessons))];
}

/**
 * Free courses people commonly watch alongside this one, mapped to the stages
 * that cover the same ground. Useful for not studying the same week twice.
 */
export const companions = [
  {
    name: "CS50's Introduction to Cybersecurity",
    org: 'Harvard · free on YouTube and edX',
    href: 'https://cs50.harvard.edu/cybersecurity/',
    note: 'A five-lecture university introduction for technical and non-technical audiences. Excellent on fundamentals and threat literacy; it is not a hands-on testing course, so pair it with the labs here.',
    map: [
      { week: 'Week 0 · Securing Accounts', covers: 'Passwords, dictionary and brute-force attacks, 2FA and MFA, OTP, SIM swapping, credential stuffing, keylogging, social engineering and phishing, single sign-on, password managers.', stages: ['00', '04'] },
      { week: 'Week 1 · Securing Data', covers: 'Hashing, rainbow tables, salting, one-way and cryptographic hash functions, encryption and how stored data is really protected.', stages: ['04'] },
      { week: 'Week 2 · Securing Systems', covers: 'Wi-Fi and WPA, packet sniffing, machine-in-the-middle attacks, HTTP and HTTPS, TLS and certificates, cookies and session hijacking.', stages: ['02', '10'] },
      { week: 'Week 3 · Securing Software', covers: 'Code injection, SQL injection, command injection, cross-site scripting, and phishing against software users.', stages: ['05', '03'] },
      { week: 'Week 4 · Preserving Privacy', covers: 'Browsing history, logs, HTTP headers, fingerprinting, session and tracking cookies, tracking parameters, third-party cookies.', stages: ['02', '04'] },
    ],
  },
];
