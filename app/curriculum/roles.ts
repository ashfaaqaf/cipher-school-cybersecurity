/**
 * Real junior adverts, broken into their individual requirements and mapped to
 * the lessons that actually cover each one.
 *
 * The point is to make a requirements list stop being intimidating. A line like
 * "Perform VAPT on web, API and infrastructure systems" is four lessons you have
 * either done or not, and the app can tell you which.
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
  /** How far off this role is right now. */
  level: 'INTERN' | 'JUNIOR' | 'NEXT RUNG' | 'SENIOR';
  /** A direct summary of the role. */
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
        means: 'Test the API directly rather than through the interface: that is where the flaws are.',
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
    title: 'Intern: Control Assurance',
    org: 'Audit / GRC-leaning',
    place: 'Audits, risk assessments and IT controls',
    hue: 45,
    level: 'INTERN',
    source: { name: 'shared by you: the advert did not name the employer', seen: 'August 2026' },
    summary:
      'No hacking required, and it is one of the most reliable ways into the industry. The work is establishing whether controls are real, operating, and evidenced, and writing that up clearly. Notice the advert asks for command of English before it asks for anything technical.',
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
        means: 'Identity, layered defence, backups and patching: what the controls are and what they buy.',
        lessons: ['04-2', '04-4', '04-7', '12-6'],
      },
      {
        text: 'Excellent command of English, attention to detail and analytical skills',
        means: 'Writing is the deliverable here. Lead with the conclusion, be specific, and state your confidence level.',
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
    title: 'Cyber Security Analyst: Level 1',
    org: 'Marksmen Research · Colombo',
    place: 'SOC monitoring, 24/7 shifts',
    hue: 155,
    level: 'JUNIOR',
    source: { name: 'rooster.jobs', href: 'https://rooster.jobs/jobs/446912', seen: 'August 2026' },
    summary:
      'The classic way into the industry: watch the alerts, decide what is real, escalate what is not yours to fix. It explicitly says 0-2 years preferred but not required, which is as open a door as this field offers. Read the shift requirement carefully: nights and weekends are part of the job, not a footnote.',
    evidence: [
      'A detection lab: logs shipped into Wazuh or Elastic, with five rules you wrote and tested',
      'A written triage walkthrough of one alert: hypothesis, evidence checked, conclusion, what you ruled out',
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
        means: 'Write it so the next analyst: often you at 3am: can follow what you checked.',
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
        text: '0-2 years SOC or cybersecurity experience preferred but not required',
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
        means: 'A real cost to weigh before applying. Shift work and alert fatigue are the two things that burn analysts out.',
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
      'A sector CSIRT: the team the banks call. Unusually broad for a junior role: incident response, vulnerability research, testing and awareness training in one job. That breadth is the appeal. This particular listing has closed, but FinCSIRT and roles shaped like it recur, and the requirement list is worth treating as a target.',
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
        means: 'Triage the firehose by relevance, not novelty: CVSS, EPSS and the KEV list.',
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
        means: 'Run the tooling as well as read its output: telemetry, hardening, backups.',
        lessons: ['07-1', '01-8', '04-7'],
      },
      {
        text: 'Assist in conducting security awareness training',
        means: 'Short, specific and blame-free beats an annual video with a quiz.',
        lessons: ['04-8', '11-8'],
      },
      {
        text: 'Assist in research and development in emerging areas of information security',
        means: 'Narrow questions, reproducible method, and clear limits on what you proved.',
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
        means: 'Advantageous, not required, and worth choosing only once a role you want asks for one.',
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
    title: 'Intern: Observability & Security',
    org: 'INNOV8 · Colombo',
    place: 'Cloud, DevOps and security, all at once',
    hue: 265,
    level: 'INTERN',
    source: { name: 'itpro.lk', href: 'https://itpro.lk/job/14721/intern-%e2%80%93-observability-security-at-innov8/', seen: 'August 2026' },
    summary:
      'Read this one carefully, because it is the clearest statement in any of these adverts of what actually gets a beginner hired. It asks only for a foundation and basic exposure, and then its preferred list is personal projects, test labs, a GitHub repository, Python or Bash, and TryHackMe or Hack The Box. Every one of those is something you can produce yourself this month, without permission from anyone.',
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
        means: 'Prompt injection and excessive agency: the risks nobody has fully solved yet.',
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
      'Not reachable yet: it asks for three years, but worth reading now, because it shows where the control assurance route leads. Notice how little of it is technical: frameworks, data protection law, documentation, and communicating with a US team. This is what the audit path pays off into, and the skills compound rather than expire.',
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
        means: 'A real cost of working with overseas clients. Weigh it before applying.',
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
    'Banks and financial institutions are the largest employers, driven by Central Bank requirements for dedicated security functions: Commercial Bank, Sampath, HNB, Nations Trust and others.',
    'Then telecommunications, BPO, insurers and the export IT firms: Virtusa, WSO2, IFS: plus the consultancies, Accenture, KPMG, PwC and Deloitte.',
    'Entry-level roles are usually titled SOC Analyst Tier 1, IT security assistant or junior network administrator.',
    'Most listings ask for a degree or HND in IT, computer science or cyber security, with CompTIA Security+ and CEH the certifications named most often.',
    'Published entry-level bands run roughly LKR 50,000-80,000 a month, with SOC analyst roles around LKR 80,000-120,000, rising with two to three years and a certification.',
    'Most vacancies are in Colombo, though remote-friendly roles for overseas clients are increasingly common.',
  ],
};

/*
 * The rest of what ITPro.lk currently lists under security. All are years away,
 * and they are here for one reason: to show where each path actually leads, and
 * what the ladder above an internship is made of.
 */
roles.push(
  {
    id: 'jit-network-security',
    title: 'Network & IT Security Professional',
    org: 'JIT Resourcing & Consultancy · Colombo',
    place: 'Infrastructure and network security · 3+ years · fully onsite',
    hue: 185,
    level: 'NEXT RUNG',
    source: { name: 'itpro.lk', href: 'https://itpro.lk/job/14689/network-it-security-professional-at-jit-resourcing-consultancy-services/', seen: 'August 2026' },
    summary:
      'The infrastructure route, and it looks nothing like the others: no Burp, no SIEM, no OWASP. It is routers, firewalls, VPNs, Active Directory and keeping things running when they break. Banking experience is preferred, which tells you who hires for this. If stage 02 was the part you enjoyed most, this is the shape of that career.',
    evidence: [
      'A segmented home network with VLANs, documented, and a note on what each rule permits and why',
      'A VPN you configured yourself between two lab machines, with the handshake captured',
      'A written disaster recovery plan for your own lab, including a tested restore',
    ],
    duties: [
      {
        text: 'Strong knowledge of IPSec, VPNs, internet connectivity and network security',
        means: 'Encrypted tunnels, what they do and do not protect, and how traffic actually routes.',
        lessons: ['02-8', '02-4', '04-3'],
      },
      {
        text: 'Experience managing routers, switches, firewalls, Active Directory and NAS',
        means: 'The devices themselves: plus AD, which is the crown jewel of any corporate network.',
        lessons: ['02-2', '02-4', '01-5', '06-6'],
      },
      {
        text: 'Experience in disaster recovery and business continuity planning',
        means: 'RPO, RTO, and backups that have actually been restored rather than assumed.',
        lessons: ['04-7', '08-8'],
      },
      {
        text: 'Vendor management and technical documentation experience',
        means: 'Writing it down, and judging what a supplier is really responsible for.',
        lessons: ['11-4', '05-7'],
      },
    ],
    requirements: [
      {
        text: '3+ years of experience in network and infrastructure administration',
        means: 'The gap. Note it asks for administration experience, not security experience.',
        lessons: [],
      },
      {
        text: 'Exposure to load balancers and high availability infrastructure',
        means: 'Availability is one of the three promises, and this is how it is actually built.',
        lessons: ['04-7', '00-2'],
      },
      {
        text: 'Infrastructure troubleshooting and firmware upgrades',
        means: 'Layered thinking to isolate a fault, and why firmware is its own security problem.',
        lessons: ['02-1', '10-4'],
      },
      {
        text: 'Banking or financial services experience highly preferred',
        means: 'Sri Lankan security hiring is concentrated in banking. Worth knowing before you specialise.',
        lessons: [],
      },
    ],
  },
  {
    id: 'cms-infosec-engineer',
    title: 'Information Security Engineer',
    org: 'CMS (Pvt) Ltd · remote',
    place: 'Cloud security operations · 5+ years',
    hue: 200,
    level: 'NEXT RUNG',
    source: { name: 'itpro.lk', href: 'https://itpro.lk/job/14800/information-security-engineer-at-cms-pvt-ltd/', seen: 'August 2026' },
    summary:
      'Where the cloud and detection paths converge, and a useful warning about tool names. It lists Rapid7, Wiz, Orca, Sophos, Bitdefender and Defender, but underneath, every one is vulnerability management, cloud posture or endpoint telemetry. Learn the category and the product becomes a week of onboarding. Chase the product names and you will always be behind.',
    evidence: [
      'A cloud account with posture checking enabled and a written note on each finding it raised',
      'A detection rule you wrote, tested with Atomic Red Team, and tuned',
      'A Python or PowerShell script that pulls from a security API and produces a report',
    ],
    duties: [
      {
        text: 'Monitor and investigate security alerts and incidents using SIEM/MDR platforms',
        means: 'Query fluently, record uncertainty in triage, and know what the platform cannot see.',
        lessons: ['07-2', '07-8'],
      },
      {
        text: 'Manage vulnerability scanning, risk prioritisation and remediation',
        means: 'Rank by exposure and exploitation, not by the severity number alone.',
        lessons: ['04-6', '12-1'],
      },
      {
        text: 'Monitor security across AWS multi-account environments using IAM, CloudTrail and posture tools',
        means: 'The control plane is the crime scene, and least privilege is the whole game.',
        lessons: ['09-1', '09-2', '09-4'],
      },
      {
        text: 'Monitor Microsoft 365 and Entra ID security, including privileged access, authentication and MFA events',
        means: 'Identity telemetry: where business email compromise is visible and nothing else is.',
        lessons: ['04-2', '07-5', '08-5'],
      },
      {
        text: 'Develop and maintain security detection rules, alerts, integrations and automation',
        means: 'Detection as code: behaviour over indicators, tested rather than assumed.',
        lessons: ['07-4', '07-3'],
      },
      {
        text: 'Support cloud, Kubernetes, CI/CD and application security initiatives',
        means: 'Container and cluster defaults, pipeline hardening, and secure design.',
        lessons: ['09-5', '09-6', '09-7', '05-8'],
      },
      {
        text: 'Automate security operations and reporting using PowerShell, Python, REST APIs and AWS CLI',
        means: 'The automation stage, applied. This is why stage 03 exists.',
        lessons: ['03-1', '03-3', '03-8'],
      },
      {
        text: 'Support SOX audits, security documentation, evidence collection and incident response',
        means: 'Even deeply technical roles come back to evidence and writing.',
        lessons: ['12-6', '08-1', '12-5'],
      },
    ],
    requirements: [
      {
        text: '5+ years in information security, security operations or systems administration',
        means: 'The gap. Note that systems administration counts: the route in is not only through security roles.',
        lessons: [],
      },
      {
        text: 'Hands-on experience with SIEM/MDR, vulnerability management, endpoint security and incident response',
        means: 'Four categories, not four products.',
        lessons: ['07-2', '04-6', '07-5', '08-1'],
      },
      {
        text: 'Proficiency with Windows, Linux, networking, firewalls and identity management',
        means: 'The foundations, still being asked for at five years in.',
        lessons: ['01-4', '01-5', '02-4', '04-2'],
      },
      {
        text: 'Strong knowledge of AWS security, Microsoft 365, Entra ID, IAM and cloud security',
        means: 'Shared responsibility, cloud identity, keys and posture management.',
        lessons: ['09-1', '09-2', '09-3'],
      },
      {
        text: 'Familiarity with GitHub, GitLab, Jira, CI/CD and application security',
        means: 'Treat the pipeline as production, and never let a secret reach a commit.',
        lessons: ['03-8', '09-7', '05-8'],
      },
    ],
  },
  {
    id: 'wia-senior-l3',
    title: 'Senior Cybersecurity Engineer (L3)',
    org: 'WIA Systems Inc · remote from Sri Lanka',
    place: 'Microsoft security stack · 8+ years',
    hue: 230,
    level: 'SENIOR',
    source: { name: 'itpro.lk', href: 'https://itpro.lk/job/14700/senior-cybersecurity-engineer-l3-at-wia-systems-inc/', seen: 'August 2026' },
    summary:
      'Eight years away, and included deliberately: this is the destination of the blue-team path, and it is remote from Sri Lanka, which matters. Read what it asks for: Sentinel, Defender, Entra ID, threat hunting, zero trust, NIST. Every one of those is a stage in this course. Nothing on that list is unreachable; it is just further along.',
    evidence: [
      'A detection lab with rules mapped to ATT&CK techniques and tested against them',
      'A documented threat hunt: hypothesis, query, result, and the rule it produced',
      'An incident write-up with a defensible timeline someone else could reproduce',
    ],
    duties: [
      {
        text: 'Monitor and respond to security alerts using SIEM, XDR and EDR platforms',
        means: 'The same triage discipline as the Level 1 role, with the authority to act on it.',
        lessons: ['07-2', '07-5', '07-8'],
      },
      {
        text: 'Investigate security incidents, perform threat hunting and root-cause analysis',
        means: 'Hunting starts from a hypothesis, not an alert, and ends in a new detection.',
        lessons: ['07-8', '08-1', '08-3'],
      },
      {
        text: 'Manage Entra ID, MFA, Conditional Access and single sign-on',
        means: 'Identity is the perimeter, and phishing-resistant factors are the control that matters.',
        lessons: ['04-2'],
      },
      {
        text: 'Support and lead incident response, containment and recovery',
        means: 'The full lifecycle, including the part where you rebuild rather than restore.',
        lessons: ['08-1', '08-8'],
      },
      {
        text: 'Implement Zero Trust security principles',
        means: 'Verify every request rather than trusting network location. An architecture, not a product.',
        lessons: ['04-4'],
      },
    ],
    requirements: [
      {
        text: '8+ years of cybersecurity experience',
        means: 'A long way off, which is exactly why it is worth seeing now.',
        lessons: [],
      },
      {
        text: 'Strong networking, Windows Server and Azure knowledge',
        means: 'Stages 01, 02 and 09, still the foundation eight years in.',
        lessons: ['02-1', '01-5', '09-1'],
      },
      {
        text: 'Understanding of Zero Trust and NIST frameworks',
        means: 'The six CSF functions and the discipline of removing implicit trust.',
        lessons: ['00-8', '04-4'],
      },
      {
        text: 'Preferred: Microsoft Cybersecurity Architect Expert, Security Operations Analyst, CISSP',
        means: 'Certifications named at senior level, where they genuinely do carry weight.',
        lessons: ['11-5'],
      },
    ],
  },
);

/** Reachable roles first, so the list opens on what you could apply to now. */
const ORDER: Record<Role['level'], number> = { INTERN: 0, JUNIOR: 1, 'NEXT RUNG': 2, SENIOR: 3 };
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
