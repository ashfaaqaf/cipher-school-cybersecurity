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
