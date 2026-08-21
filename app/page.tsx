'use client';

import { useEffect, useMemo, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

type Stage = {
  number: string;
  title: string;
  subtitle: string;
  tags: string[];
  weeks: number;
  hours: number;
  outcome: string;
  project: string;
  checkpoint: string;
  lessons: string[];
  resources: { label: string; href: string }[];
};

const stages: Stage[] = [
  {
    number: '00', title: 'Safe start', subtitle: 'Ethics, scope & labcraft', tags: ['FOUNDATIONS'], weeks: 1, hours: 20,
    outcome: 'Think in assets, threats, weaknesses, controls, and evidence—without crossing a legal or ethical line.',
    project: 'Write a rules-of-engagement charter, draw your first threat model, and build an isolated practice lab.',
    checkpoint: 'You can explain what is in scope, what could go wrong, and how your lab prevents harm.',
    lessons: ['Cybersecurity as risk management', 'CIA, authenticity & accountability', 'Asset–threat–vulnerability–control model', 'Authorization, law, ethics & scope', 'Virtual machines and isolated lab networks', 'Evidence-based research & note-taking', 'Git, changelogs and reproducibility', 'The NICE career/work-role map'],
    resources: [
      { label: 'NIST CSF 2.0', href: 'https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20' },
      { label: 'CISA Career Roadmap', href: 'https://niccs.cisa.gov/tools/career-pathways-roadmap' },
    ],
  },
  {
    number: '01', title: 'Computers from the metal up', subtitle: 'Systems, Linux & Windows', tags: ['FOUNDATIONS', 'BUILD'], weeks: 4, hours: 55,
    outcome: 'Understand what the machine is doing beneath the interface, then inspect and automate it from the command line.',
    project: 'Build two small Linux/Windows lab machines, harden user access, and produce a system-baseline report.',
    checkpoint: 'You can trace a program from file to process to memory, explain permissions, and find useful logs.',
    lessons: ['Binary, hexadecimal & data representation', 'CPU, memory, processes & threads', 'Filesystems, storage & permissions', 'Linux shell, services and package management', 'Windows internals, registry and PowerShell', 'Virtualization, containers and isolation', 'Compilers, linkers and debuggers', 'System logs, baselines and hardening'],
    resources: [
      { label: 'OverTheWire Bandit', href: 'https://overthewire.org/wargames/bandit/' },
      { label: 'pwn.college', href: 'https://pwn.college/' },
    ],
  },
  {
    number: '02', title: 'Network anatomy', subtitle: 'Packets, protocols & trust', tags: ['FOUNDATIONS', 'DEFENSE', 'OFFENSE'], weeks: 5, hours: 65,
    outcome: 'Read the story a packet tells—from a local frame to an encrypted request across the internet.',
    project: 'Design a segmented home-lab network and annotate packet captures for DNS, TCP, HTTP, and TLS.',
    checkpoint: 'Given a connection problem or suspicious flow, you can locate the failing layer and prove why.',
    lessons: ['OSI and TCP/IP mental models', 'Ethernet, ARP, switching & VLANs', 'IPv4/IPv6, subnetting and NAT', 'Routing, ACLs and firewalls', 'DNS, DHCP and time services', 'TCP, UDP, sockets and common ports', 'HTTP/1.1–3, TLS, certificates and PKI', 'Wi‑Fi, VPNs, proxies and packet analysis'],
    resources: [
      { label: 'Wireshark User Guide', href: 'https://www.wireshark.org/docs/wsug_html_chunked/' },
      { label: 'IETF RFC Index', href: 'https://www.rfc-editor.org/' },
    ],
  },
  {
    number: '03', title: 'Code for operators', subtitle: 'Automate, inspect, build', tags: ['BUILD', 'FOUNDATIONS'], weeks: 5, hours: 65,
    outcome: 'Write small, reliable programs that transform data, call APIs, automate investigations, and reveal system behavior.',
    project: 'Create a CLI that parses security logs, enriches indicators, tests inputs, and exports a clean report.',
    checkpoint: 'You can read unfamiliar code, debug it, handle errors, and explain its security assumptions.',
    lessons: ['Python fundamentals and automation', 'Bash pipelines and shell safety', 'PowerShell objects and remoting', 'JavaScript, the DOM and browser runtime', 'SQL, data models and query safety', 'C, memory and undefined behavior', 'Regex, parsing, encoding and serialization', 'APIs, Git, testing and code review'],
    resources: [
      { label: 'Python Tutorial', href: 'https://docs.python.org/3/tutorial/' },
      { label: 'PowerShell Learning', href: 'https://learn.microsoft.com/en-us/training/powershell/' },
    ],
  },
  {
    number: '04', title: 'Security engineering core', subtitle: 'Risk, identity & architecture', tags: ['FOUNDATIONS', 'BUILD', 'LEADERSHIP'], weeks: 4, hours: 55,
    outcome: 'Turn security principles into layered controls that fit real business risk instead of blindly copying checklists.',
    project: 'Threat-model a small SaaS product and propose a risk-ranked security architecture with verification tests.',
    checkpoint: 'You can justify a control by threat, cost, evidence, and residual risk—not by buzzword.',
    lessons: ['Risk, likelihood, impact and control types', 'IAM, MFA, SSO, OAuth, OIDC and SAML', 'Cryptographic primitives and key management', 'Zero trust, segmentation and defense in depth', 'Threat modeling and abuse cases', 'Vulnerability management, CVE and CVSS', 'Configuration, patching, backup and resilience', 'Governance, privacy, policy and compliance'],
    resources: [
      { label: 'NIST CSF 2.0', href: 'https://www.nist.gov/cyberframework' },
      { label: 'CVSS v4.0', href: 'https://www.first.org/cvss/v4.0/' },
    ],
  },
  {
    number: '05', title: 'Application & API security', subtitle: 'Break assumptions, fix causes', tags: ['BUILD', 'OFFENSE', 'RESEARCH'], weeks: 5, hours: 55,
    outcome: 'Trace trust boundaries through web and API stacks, reproduce flaws safely, and design fixes at the root cause.',
    project: 'Complete a curated web-lab set, then write a developer-ready report with exploit evidence and remediation tests.',
    checkpoint: 'You can distinguish symptom from root cause and verify that a fix closes the abuse path.',
    lessons: ['Browser security, origins, cookies and CSP', 'Authentication, sessions and access control', 'SQL/NoSQL/OS/template injection', 'XSS, CSRF, CORS and DOM security', 'SSRF, XXE, deserialization and file handling', 'REST, GraphQL, WebSockets and API testing', 'Secure design, validation and secrets', 'SAST, DAST, SCA, code review and SSDF'],
    resources: [
      { label: 'OWASP Top 10: 2025', href: 'https://owasp.org/www-project-top-ten/' },
      { label: 'Web Security Academy', href: 'https://portswigger.net/web-security' },
    ],
  },
  {
    number: '06', title: 'Authorized offensive security', subtitle: 'Test like an adversary', tags: ['OFFENSE', 'RESEARCH'], weeks: 6, hours: 80,
    outcome: 'Run a controlled assessment from rules of engagement to evidence-backed reporting while minimizing risk.',
    project: 'Assess an intentionally vulnerable lab, chain two weaknesses, clean up, and deliver an executive plus technical report.',
    checkpoint: 'You can state scope, validate impact safely, preserve evidence, stop at boundaries, and recommend fixes.',
    lessons: ['Rules of engagement and test methodology', 'Passive recon and ethical OSINT', 'Scanning, service discovery and enumeration', 'Vulnerability analysis and exploit validation', 'Linux privilege escalation and persistence risks', 'Windows, Active Directory and identity paths', 'Web exploitation, pivoting and attack chains', 'Cleanup, reporting, retesting and purple teaming'],
    resources: [
      { label: 'pwn.college', href: 'https://pwn.college/' },
      { label: 'CISA VDP Guidance', href: 'https://www.cisa.gov/news-events/news/cisa-issues-final-vulnerability-disclosure-policy-directive-federal-agencies' },
    ],
  },
  {
    number: '07', title: 'Defense & detection', subtitle: 'See, decide, contain', tags: ['DEFENSE', 'BUILD'], weeks: 6, hours: 75,
    outcome: 'Convert endpoint, identity, network, and cloud telemetry into useful detections and defensible decisions.',
    project: 'Build a small detection lab with normalized logs, five mapped detections, triage notes, and tuning evidence.',
    checkpoint: 'For every alert, you can explain the hypothesis, data source, blind spots, triage path, and response.',
    lessons: ['Logging strategy, telemetry and data quality', 'SIEM search, correlation and dashboards', 'MITRE ATT&CK tactics and techniques', 'Detection engineering, Sigma and testing', 'Endpoint telemetry, EDR and identity signals', 'Network security monitoring and IDS', 'Threat intelligence, IOCs and TTPs', 'SOC triage, hunting and purple-team validation'],
    resources: [
      { label: 'MITRE ATT&CK', href: 'https://attack.mitre.org/' },
      { label: 'Microsoft SecOps Guide', href: 'https://learn.microsoft.com/en-us/security/operations/overview' },
    ],
  },
  {
    number: '08', title: 'Response, forensics & malware', subtitle: 'Reconstruct what happened', tags: ['DEFENSE', 'RESEARCH'], weeks: 6, hours: 70,
    outcome: 'Preserve evidence, build a timeline, analyze malicious behavior, contain the incident, and improve the system.',
    project: 'Investigate a simulated compromise and produce a timeline, scope statement, containment plan, and lessons-learned brief.',
    checkpoint: 'Another analyst can reproduce your findings and distinguish confirmed facts from hypotheses.',
    lessons: ['Incident response across the CSF lifecycle', 'Evidence handling, acquisition and integrity', 'Disk, filesystem and artifact forensics', 'Memory acquisition and analysis', 'Network, email, identity and cloud forensics', 'Static and dynamic malware triage', 'Assembly, reverse engineering and behavior', 'Ransomware tabletop, recovery and lessons learned'],
    resources: [
      { label: 'NIST SP 800-61r3', href: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final' },
      { label: 'MITRE ATT&CK', href: 'https://attack.mitre.org/' },
    ],
  },
  {
    number: '09', title: 'Cloud-native & DevSecOps', subtitle: 'Secure the delivery system', tags: ['CLOUD', 'BUILD', 'DEFENSE'], weeks: 5, hours: 65,
    outcome: 'Secure identity, data, workloads, deployment pipelines, and software provenance across cloud-native systems.',
    project: 'Ship a hardened containerized service through a scanned CI pipeline with least privilege, signed artifacts, and alerts.',
    checkpoint: 'You can map cloud control ownership and prove security from commit to runtime.',
    lessons: ['Shared responsibility and cloud architecture', 'Cloud IAM, federation and least privilege', 'Cloud networks, data protection and KMS', 'Posture management, audit logs and response', 'Docker images, runtimes and host boundaries', 'Kubernetes RBAC, pods, policy and secrets', 'CI/CD, IaC, secret scanning and guardrails', 'SBOMs, signing, dependencies and supply chain'],
    resources: [
      { label: 'Kubernetes Security Checklist', href: 'https://kubernetes.io/docs/concepts/security/security-checklist/' },
      { label: 'NIST SSDF', href: 'https://csrc.nist.gov/pubs/sp/800/218/final' },
    ],
  },
  {
    number: '10', title: 'Systems frontiers', subtitle: 'Choose your deep specialty', tags: ['RESEARCH', 'OFFENSE', 'DEFENSE'], weeks: 5, hours: 55,
    outcome: 'Sample advanced fields, then choose one frontier for serious depth instead of pretending to master them all.',
    project: 'Complete one specialization capstone with a reproducible lab, original analysis, and public-safe write-up.',
    checkpoint: 'You can read primary technical material, reproduce a result, question assumptions, and identify unknowns.',
    lessons: ['Reverse engineering and program analysis', 'Memory corruption and exploit development', 'Android/iOS application security', 'Wireless, radio and telecom security', 'Embedded, hardware, IoT and firmware', 'OT/ICS safety and industrial security', 'Cryptographic engineering and post-quantum crypto', 'AI, LLM and autonomous-agent security'],
    resources: [
      { label: 'MITRE ATLAS', href: 'https://atlas.mitre.org/' },
      { label: 'OWASP GenAI Security', href: 'https://genai.owasp.org/initiatives/top-10-for-llm-and-genai/' },
    ],
  },
  {
    number: '11', title: 'Researcher & professional', subtitle: 'Create knowledge, lead change', tags: ['RESEARCH', 'LEADERSHIP'], weeks: 4, hours: 40,
    outcome: 'Turn curiosity into reproducible research, coordinated disclosure, strong writing, and trusted professional judgment.',
    project: 'Publish a sanitized capstone portfolio: problem, method, evidence, limitations, fix, talk, and retrospective.',
    checkpoint: 'Your work survives peer review, helps a real audience, and clearly labels evidence, inference, and uncertainty.',
    lessons: ['Research questions, literature and hypotheses', 'Fuzzing, diffing and root-cause analysis', 'Coordinated disclosure, CVE and advisories', 'Technical reports, diagrams and executive briefs', 'Portfolio, interviews and evidence of skill', 'Risk communication and stakeholder influence', 'Certification as validation—not curriculum', 'Mentoring, teaching and continuous learning'],
    resources: [
      { label: 'CVE Program', href: 'https://www.cve.org/' },
      { label: 'NICE Framework', href: 'https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center' },
    ],
  },
];

const filters = ['ALL', 'FOUNDATIONS', 'BUILD', 'OFFENSE', 'DEFENSE', 'CLOUD', 'RESEARCH', 'LEADERSHIP'];

const tracks = [
  { code: 'BLUE', title: 'SOC → Detection Engineer', path: '00 → 01 → 02 → 04 → 07 → 08 → 09 → 11', note: 'Best if you enjoy evidence, patterns, and fast decisions.' },
  { code: 'RED', title: 'Pentester → Red Team', path: '00 → 01 → 02 → 03 → 04 → 05 → 06 → 10 → 11', note: 'Best if you enjoy creative testing and precise reporting.' },
  { code: 'APP', title: 'AppSec → Product Security', path: '00 → 02 → 03 → 04 → 05 → 09 → 11', note: 'Best if you like code, architecture, and helping builders.' },
  { code: 'CLD', title: 'Cloud Security Engineer', path: '00 → 01 → 02 → 04 → 07 → 09 → 11', note: 'Best if you enjoy identity, automation, and large systems.' },
  { code: 'DFIR', title: 'DFIR → Malware Analyst', path: '00 → 01 → 02 → 03 → 07 → 08 → 10 → 11', note: 'Best if you enjoy timelines, puzzles, and deep system behavior.' },
  { code: 'GRC', title: 'GRC → Security Leader', path: '00 → 02 → 04 → 07 → 09 → 11', note: 'Best if you connect technical reality to business decisions.' },
  { code: 'RES', title: 'Vulnerability Researcher', path: '00 → 01 → 02 → 03 → 05 → 06 → 08 → 10 → 11', note: 'Best if you enjoy unknowns, experiments, and original work.' },
];

const sources = [
  { name: 'NIST CSF 2.0', kind: 'RISK', href: 'https://www.nist.gov/publications/nist-cybersecurity-framework-csf-20', why: 'The six-function lifecycle: Govern, Identify, Protect, Detect, Respond, Recover.' },
  { name: 'NICE Framework', kind: 'CAREERS', href: 'https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center', why: 'Work roles described through tasks, knowledge, and skills.' },
  { name: 'MITRE ATT&CK', kind: 'ADVERSARIES', href: 'https://attack.mitre.org/', why: 'A shared language for observed adversary behavior.' },
  { name: 'OWASP Top 10: 2025', kind: 'APPSEC', href: 'https://owasp.org/www-project-top-ten/', why: 'Current awareness baseline for major web application risks.' },
  { name: 'Web Security Academy', kind: 'LABS', href: 'https://portswigger.net/web-security', why: 'Free, legal, interactive web-security learning and labs.' },
  { name: 'pwn.college', kind: 'LABS', href: 'https://pwn.college/', why: 'Free hands-on systems and cybersecurity curriculum from ASU.' },
  { name: 'OverTheWire', kind: 'LABS', href: 'https://overthewire.org/wargames/', why: 'Beginner-friendly command-line and security wargames.' },
  { name: 'NIST SP 800-61r3', kind: 'INCIDENTS', href: 'https://csrc.nist.gov/pubs/sp/800/61/r3/final', why: 'Current incident-response guidance aligned to CSF 2.0.' },
  { name: 'NIST SSDF 1.1', kind: 'DEVSECOPS', href: 'https://csrc.nist.gov/pubs/sp/800/218/final', why: 'Secure software practices across the development lifecycle.' },
  { name: 'Kubernetes Checklist', kind: 'CLOUD', href: 'https://kubernetes.io/docs/concepts/security/security-checklist/', why: 'Official baseline for cluster security decisions.' },
  { name: 'MITRE ATLAS', kind: 'AI', href: 'https://atlas.mitre.org/', why: 'Living knowledge base for attacks against AI-enabled systems.' },
  { name: 'CVE + CVSS v4', kind: 'VULNS', href: 'https://www.first.org/cvss/v4.0/', why: 'Common identifiers plus a standard way to communicate severity.' },
];

const totalLessons = stages.reduce((sum, stage) => sum + stage.lessons.length, 0);
const totalHours = stages.reduce((sum, stage) => sum + stage.hours, 0);

export default function Home() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(0);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [installOpen, setInstallOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('roadmap');
  const [celebrateId, setCelebrateId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('cipher-school-progress');
      if (saved) setCompleted(new Set(JSON.parse(saved)));
    } catch { /* Progress simply starts clean if storage is unavailable. */ }
  }, []);

  useEffect(() => {
    const updateScroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(window.scrollY > 24);
      setScrollProgress(available > 0 ? Math.min(100, (window.scrollY / available) * 100) : 0);
    };
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('isVisible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(visible.target.id);
    }, { threshold: [0.16, 0.35, 0.6], rootMargin: '-18% 0px -55% 0px' });

    document.documentElement.classList.add('motionReady');
    document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));
    ['roadmap', 'tracks', 'protocol', 'sources'].forEach((id) => {
      const element = document.getElementById(id);
      if (element) sectionObserver.observe(element);
    });
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => {
      document.documentElement.classList.remove('motionReady');
      window.removeEventListener('scroll', updateScroll);
      revealObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, [filter, query]);

  useEffect(() => {
    if (!installOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setInstallOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [installOpen]);

  const toggleLesson = (id: string) => {
    if (!completed.has(id)) {
      setCelebrateId(id);
      window.setTimeout(() => setCelebrateId((current) => current === id ? null : current), 720);
    }
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      window.localStorage.setItem('cipher-school-progress', JSON.stringify([...next]));
      return next;
    });
  };

  const progress = Math.round((completed.size / totalLessons) * 100);
  const nextMission = useMemo(() => {
    for (let stageIndex = 0; stageIndex < stages.length; stageIndex += 1) {
      const lessonIndex = stages[stageIndex].lessons.findIndex((_, index) => !completed.has(`s${stageIndex}-${index}`));
      if (lessonIndex !== -1) return { stageIndex, lessonIndex, stage: stages[stageIndex], lesson: stages[stageIndex].lessons[lessonIndex] };
    }
    return null;
  }, [completed]);

  const visibleStages = stages.filter((stage) => {
    const matchesFilter = filter === 'ALL' || stage.tags.includes(filter);
    const text = [stage.title, stage.subtitle, stage.outcome, stage.project, ...stage.lessons].join(' ').toLowerCase();
    return matchesFilter && text.includes(query.trim().toLowerCase());
  });

  const jumpToMission = () => {
    if (nextMission) setExpanded(nextMission.stageIndex);
    document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetProgress = () => {
    if (window.confirm('Reset all local progress on this device?')) {
      setCompleted(new Set());
      window.localStorage.removeItem('cipher-school-progress');
    }
  };

  const steerHero = (event: ReactPointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
  };

  return (
    <main className="appShell" id="top">
      <div className="scrollProgress" style={{ '--scroll': `${scrollProgress}%` } as CSSProperties} aria-hidden="true" />
      <nav className={`topbar ${scrolled ? 'topbarCompact' : ''}`} aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Cipher School home">
          <span className="brandMark">C/</span><span>CIPHER SCHOOL</span>
        </a>
        <div className={`navLinks ${menuOpen ? 'navOpen' : ''}`}>
          <a href="#roadmap" onClick={() => setMenuOpen(false)}>Roadmap</a>
          <a href="#tracks" onClick={() => setMenuOpen(false)}>Tracks</a>
          <a href="#protocol" onClick={() => setMenuOpen(false)}>Protocol</a>
          <a href="#sources" onClick={() => setMenuOpen(false)}>Sources</a>
        </div>
        <div className="navMeta"><span className="status"><i /> ONLINE</span><span>{progress.toString().padStart(2, '0')}%</span></div>
        <button className="menuButton" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle navigation">{menuOpen ? '×' : '≡'}</button>
      </nav>

      <header className="hero" onPointerMove={steerHero}>
        <div className="ambientOrb orbOne" aria-hidden="true" /><div className="ambientOrb orbTwo" aria-hidden="true" />
        <div className="heroRail" aria-hidden="true"><span>CS//FIELD_MANUAL</span><span>SCROLL TO EXPLORE ↓</span></div>
        <div className="heroCopy">
          <div className="dynamicIsland" aria-label="Field mode ready">
            <span className="islandPulse" /><span><b>FIELD MODE</b><small>{progress}% SYNCED · {totalLessons - completed.size} SKILLS LEFT</small></span><i>⌁</i>
          </div>
          <div className="eyebrow"><span>THE COMPLETE CYBERSECURITY FIELD GUIDE</span><span>2026 EDITION · v1.0</span></div>
          <h1>Learn the system.<br /><em>Defend the future.</em></h1>
          <p className="lede">A rigorous, zero-to-researcher map of the field. Build foundations, practice legally, choose a specialty, and prove what you know.</p>
          <div className="heroActions">
            <button className="primaryButton" type="button" onClick={jumpToMission}>START TODAY&apos;S MISSION <span>↗</span></button>
            <button className="installButton" type="button" onClick={() => setInstallOpen(true)}><span>＋</span> ADD TO IPHONE</button>
            <a className="textLink" href="#protocol">HOW TO USE THIS GUIDE <span>↓</span></a>
          </div>
        </div>
        <div className="heroStats" aria-label="Curriculum overview">
          <div><strong>{stages.length}</strong><span>STAGES</span></div>
          <div><strong>{totalLessons}</strong><span>CORE SKILLS</span></div>
          <div><strong>{totalHours}</strong><span>GUIDED HOURS</span></div>
          <div><strong>07</strong><span>CAREER TRACKS</span></div>
        </div>
      </header>

      <section className="controlDeck" aria-labelledby="control-title" data-reveal>
        <div className="sectionLabel"><span>01</span><span>MISSION CONTROL</span></div>
        <div className="controlGrid">
          <div className="progressPanel">
            <div className="progressDial" style={{ '--progress': `${progress * 3.6}deg` } as CSSProperties}>
              <div><strong>{progress}%</strong><span>COMPLETE</span></div>
            </div>
            <div>
              <span className="tinyLabel">YOUR LOCAL PROGRESS</span>
              <h2 id="control-title">Build proof,<br />not playlists.</h2>
              <p>Your progress stays on this device. Every checked skill should leave evidence: notes, code, a lab result, or a clear explanation.</p>
              {completed.size > 0 && <button className="quietButton" type="button" onClick={resetProgress}>RESET PROGRESS</button>}
            </div>
          </div>
          <div className="nextPanel">
            <div className="nextTop"><span className="tinyLabel">NEXT MISSION</span><span>{nextMission ? `STAGE ${nextMission.stage.number}` : 'CORE COMPLETE'}</span></div>
            {nextMission ? <>
              <h3>{nextMission.lesson}</h3>
              <p>{nextMission.stage.outcome}</p>
              <div className="missionActions">
                <button className="darkButton" type="button" onClick={jumpToMission}>OPEN STAGE <span>↗</span></button>
                <button className="checkButton" type="button" onClick={() => toggleLesson(`s${nextMission.stageIndex}-${nextMission.lessonIndex}`)}>MARK DONE <span>✓</span></button>
              </div>
            </> : <>
              <h3>The core is complete.</h3><p>Now deepen one specialty, teach someone else, and keep your evidence current.</p>
            </>}
          </div>
        </div>
      </section>

      <section className="roadmapSection" id="roadmap" aria-labelledby="roadmap-title">
        <div className="sectionLabel light"><span>02</span><span>THE FIELD MAP</span></div>
        <div className="sectionIntro" data-reveal>
          <div><span className="tinyLabel">ZERO → INDEPENDENT RESEARCH</span><h2 id="roadmap-title">The whole field.<br /><em>In the right order.</em></h2></div>
          <p>Cybersecurity is not one ladder. It is a city. These stages build the shared roads first, then let you choose where to live.</p>
        </div>
        <div className="roadmapTools" data-reveal>
          <label className="searchBox"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 96 skills…" aria-label="Search curriculum" /></label>
          <div className="filterRow" aria-label="Filter roadmap">
            {filters.map((item) => <button key={item} className={filter === item ? 'active' : ''} type="button" onClick={() => setFilter(item)}>{item}</button>)}
          </div>
        </div>
        <div className="stageList">
          {visibleStages.map((stage) => {
            const stageIndex = stages.indexOf(stage);
            const stageDone = stage.lessons.filter((_, index) => completed.has(`s${stageIndex}-${index}`)).length;
            const isOpen = expanded === stageIndex;
            const lessonMatches = (lesson: string) => !query.trim() || lesson.toLowerCase().includes(query.trim().toLowerCase());
            return <article className={`stageCard ${isOpen ? 'stageOpen' : ''}`} key={stage.number} data-reveal>
              <button className="stageSummary" type="button" onClick={() => setExpanded(isOpen ? null : stageIndex)} aria-expanded={isOpen}>
                <span className="stageNumber">{stage.number}</span>
                <span className="stageTitle"><small>{stage.subtitle}</small><strong>{stage.title}</strong></span>
                <span className="stageTags">{stage.tags.slice(0, 2).map((tag) => <i key={tag}>{tag}</i>)}</span>
                <span className="stageTime"><b>{stage.hours}H</b><small>~{stage.weeks} WEEKS</small></span>
                <span className="stageProgress"><b>{stageDone}/{stage.lessons.length}</b><i><em style={{ width: `${(stageDone / stage.lessons.length) * 100}%` }} /></i></span>
                <span className="expandIcon">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <div className="stageBody">
                <div className="stageNarrative">
                  <span className="tinyLabel">OUTCOME</span><p>{stage.outcome}</p>
                  <span className="tinyLabel">PROOF PROJECT</span><p>{stage.project}</p>
                  <span className="tinyLabel">EXIT CHECK</span><p>{stage.checkpoint}</p>
                  <div className="resourceLinks">{stage.resources.map((resource) => <a key={resource.href} href={resource.href} target="_blank" rel="noreferrer">{resource.label} ↗</a>)}</div>
                </div>
                <div className="lessonGrid">
                  {stage.lessons.map((lesson, lessonIndex) => {
                    const lessonId = `s${stageIndex}-${lessonIndex}`;
                    return lessonMatches(lesson) && <label className={`${completed.has(lessonId) ? 'lessonDone' : ''} ${celebrateId === lessonId ? 'lessonCelebrate' : ''}`} key={lesson}>
                    <input type="checkbox" checked={completed.has(`s${stageIndex}-${lessonIndex}`)} onChange={() => toggleLesson(`s${stageIndex}-${lessonIndex}`)} />
                    <span className="customCheck">✓</span><b>{String(lessonIndex + 1).padStart(2, '0')}</b><span>{lesson}</span>
                  </label>;})}
                </div>
              </div>}
            </article>;
          })}
          {visibleStages.length === 0 && <div className="emptyState">NO MATCHES. TRY A BROADER SEARCH OR FILTER.</div>}
        </div>
      </section>

      <section className="tracksSection" id="tracks" aria-labelledby="tracks-title">
        <div className="sectionLabel"><span>03</span><span>CHOOSE DEPTH</span></div>
        <div className="sectionIntro darkIntro" data-reveal>
          <div><span className="tinyLabel">SPECIALIZE AFTER THE CORE</span><h2 id="tracks-title">Pick a direction.<br /><em>Keep the map.</em></h2></div>
          <p>Complete stages 00–04, then follow the route closest to the problems you enjoy. Switching later is normal; the shared foundation travels with you.</p>
        </div>
        <div className="trackGrid">
          {tracks.map((track, index) => <article className="trackCard" key={track.code} data-reveal>
            <div><span className="trackCode">{track.code}</span><span className="trackIndex">0{index + 1}</span></div>
            <h3>{track.title}</h3><p>{track.note}</p><code>{track.path}</code>
          </article>)}
        </div>
      </section>

      <section className="protocolSection" id="protocol" aria-labelledby="protocol-title">
        <div className="sectionLabel light"><span>04</span><span>THE STUDY PROTOCOL</span></div>
        <div className="protocolHeader" data-reveal>
          <div><span className="tinyLabel">THE 90-MINUTE FIELD SESSION</span><h2 id="protocol-title">Learn. Build.<br /><em>Recall. Explain.</em></h2></div>
          <div className="protocolNote"><b>ELI5 RULE</b><p>If you cannot explain it in plain language to a curious five-year-old, your model is still fuzzy. Go back to the evidence.</p></div>
        </div>
        <div className="sessionTimeline" data-reveal>
          <div><b>10</b><span>MIN</span><strong>RECALL</strong><p>Without notes, write what you remember and one question.</p></div>
          <div><b>25</b><span>MIN</span><strong>LEARN</strong><p>Use one primary source. Chase the question, not every link.</p></div>
          <div><b>45</b><span>MIN</span><strong>BUILD</strong><p>Lab, code, capture traffic, draw the system, or test a defense.</p></div>
          <div><b>10</b><span>MIN</span><strong>TEACH</strong><p>Record evidence and explain the lesson in five plain sentences.</p></div>
        </div>
        <div className="paceGrid" data-reveal>
          <div><span>STEADY</span><strong>5 h/week</strong><b>≈ 32 months</b><p>Best alongside school or a demanding job.</p></div>
          <div className="recommended"><span>FOCUSED</span><strong>10 h/week</strong><b>≈ 16 months</b><p>The sustainable recommendation for most learners.</p></div>
          <div><span>INTENSIVE</span><strong>15 h/week</strong><b>≈ 11 months</b><p>Only if sleep, health, and reflection remain protected.</p></div>
        </div>
      </section>

      <section className="truthSection" data-reveal>
        <div className="truthMark">!</div>
        <div><span className="tinyLabel">THE OPPOSING VIEW</span><h2>You will not master<br /><em>all of cybersecurity.</em></h2></div>
        <div><p>No one does. The field changes faster than any person can absorb it. “Everything” is a useful map, but a terrible daily goal.</p><p><strong>Your real target:</strong> deep fundamentals, one valuable specialty, sound judgment, and the ability to learn unfamiliar systems safely.</p></div>
      </section>

      <section className="safetySection" aria-labelledby="safety-title" data-reveal>
        <div className="safetyCode">ROE//01</div>
        <div><span className="tinyLabel">NON-NEGOTIABLE</span><h2 id="safety-title">Permission<br />before packets.</h2></div>
        <div><p>Only test systems you own or have explicit authorization to test. Stay inside the written scope, minimize impact, protect data, stop when uncertain, and disclose through the owner&apos;s policy.</p><p className="legalNote">Law varies by country; this guide is education, not legal advice.</p><a href="https://www.cisa.gov/news-events/news/cisa-issues-final-vulnerability-disclosure-policy-directive-federal-agencies" target="_blank" rel="noreferrer">READ CISA VDP GUIDANCE ↗</a></div>
      </section>

      <section className="sourcesSection" id="sources" aria-labelledby="sources-title">
        <div className="sectionLabel"><span>05</span><span>PRIMARY SOURCE STACK</span></div>
        <div className="sourcesHeader" data-reveal><div><span className="tinyLabel">CURRICULUM EVIDENCE</span><h2 id="sources-title">Standards over<br /><em>hot takes.</em></h2></div><p>The map is anchored in public standards, living knowledge bases, official documentation, and legal practice environments. Re-check living sources as they change.</p></div>
        <div className="sourceGrid">
          {sources.map((source, index) => <a href={source.href} target="_blank" rel="noreferrer" className="sourceCard" key={source.name} data-reveal>
            <div><span>{String(index + 1).padStart(2, '0')}</span><i>{source.kind}</i></div><h3>{source.name}</h3><p>{source.why}</p><b>OPEN SOURCE ↗</b>
          </a>)}
        </div>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brandMark">C/</span><span>CIPHER SCHOOL</span></a>
        <p>Built for curious defenders. Progress is stored locally on your device.</p>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>

      <nav className="mobileDock" aria-label="Mobile navigation">
        <a className={activeSection === 'roadmap' ? 'dockActive' : ''} href="#roadmap"><span>⌘</span>MAP</a><a className={activeSection === 'tracks' ? 'dockActive' : ''} href="#tracks"><span>◇</span>TRACKS</a><button type="button" onClick={jumpToMission}><span>↗</span>MISSION</button><a className={activeSection === 'protocol' || activeSection === 'sources' ? 'dockActive' : ''} href="#protocol"><span>◷</span>STUDY</a>
      </nav>

      {installOpen && <div className="sheetBackdrop" role="presentation" onPointerDown={() => setInstallOpen(false)}>
        <section className="installSheet" role="dialog" aria-modal="true" aria-labelledby="install-title" onPointerDown={(event) => event.stopPropagation()}>
          <div className="sheetHandle" aria-hidden="true" />
          <div className="installHeading"><span className="installIcon">C/</span><div><small>IPHONE FIELD KIT</small><h2 id="install-title">Carry Cipher School.</h2></div></div>
          <p className="installLead">Turn this site into a full-screen web app. Your checked lessons remain stored on this iPhone.</p>
          <ol className="installSteps">
            <li><span>1</span><div><b>Open in Safari</b><small>Use Apple&apos;s browser on your iPhone.</small></div></li>
            <li><span>2</span><div><b>Tap Share</b><small>Find the Share button in Safari.</small></div></li>
            <li><span>3</span><div><b>Add to Home Screen</b><small>Enable “Open as Web App,” then tap Add.</small></div></li>
          </ol>
          <a className="appleGuide" href="https://support.apple.com/guide/iphone/iphea86e5236/ios" target="_blank" rel="noreferrer">OFFICIAL APPLE INSTRUCTIONS ↗</a>
          <button className="sheetDone" type="button" onClick={() => setInstallOpen(false)}>GOT IT</button>
        </section>
      </div>}
    </main>
  );
}
