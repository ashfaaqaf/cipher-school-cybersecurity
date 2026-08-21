/**
 * Narration is written for the eye, not the ear. Speech engines read "SSRF" as
 * a word, "chmod 755" as "chmod seven hundred and fifty five", and "/var/log"
 * as silence. This rewrites the text into something meant to be spoken, before
 * it reaches either engine — the device voice reads the result directly, and
 * the ElevenLabs script sends the same result, so both pronounce identically.
 *
 * Nothing here changes what is displayed on screen.
 */

/** Spelled out letter by letter, with thin spaces so engines do not run them together. */
const SPELLED = [
  'API', 'ARP', 'ASLR', 'BEC', 'BOLA', 'CFI', 'CI', 'CI/CD', 'CD', 'CPU', 'CSF', 'CSP', 'CSRF', 'CVE', 'CVSS',
  'DAST', 'DEP', 'DFIR', 'DKIM', 'DMARC', 'DNS', 'DOM', 'DoH', 'DoT', 'EDR', 'EPSS', 'FIDO2', 'FIPS', 'GDPR',
  'GRC', 'HTML', 'HTTP', 'HTTPS', 'IAM', 'ID', 'IDOR', 'IDS', 'IMDS', 'IoC', 'IOC', 'IP', 'IPS', 'ISO', 'IT',
  'JSON', 'JTAG', 'JWT', 'KEV', 'KMS', 'LDAP', 'LLM', 'MFA', 'ML', 'NAT', 'NFS', 'NTFS', 'NTLM', 'NX', 'OIDC',
  'OSINT', 'OT', 'PKI', 'PLC', 'PTES', 'RBAC', 'RCE', 'RDP', 'ReDoS', 'REST', 'RoE', 'ROP', 'RPO', 'RTO',
  'SAML', 'SAST', 'SBOM', 'SCA', 'SDR', 'SID', 'SLSA', 'SMB', 'SNMP', 'SOC2', 'SPF', 'SQL', 'SSDF', 'SSH',
  'SSO', 'SSRF', 'STIX', 'TAXII', 'TCP', 'TLS', 'TTL', 'TTP', 'TTPs', 'UART', 'UDP', 'URL', 'VLAN', 'VM',
  'VPC', 'VPN', 'WMI', 'XML', 'XSS', 'XXE',
];

/**
 * Said as words or with a specific pronunciation. Order matters: longer keys are
 * applied first so "MITRE ATT&CK" wins over "MITRE".
 */
const SPOKEN: Record<string, string> = {
  'MITRE ATT&CK': 'MItre attack',
  'ATT&CK': 'attack',
  ATLAS: 'Atlas',
  NIST: 'nist',
  OWASP: 'oh-wasp',
  CISA: 'SIsa',
  NICE: 'nice',
  SIEM: 'sim',
  SOC: 'sock',
  MAC: 'mack',
  'MAC address': 'mack address',
  SANS: 'sans',
  STRIDE: 'stride',
  SLSA: 'salsa',
  SCADA: 'skada',
  PLS: 'P L S',
  Kerberos: 'KURberos',
  Kerberoasting: 'KURberoasting',
  nonce: 'nonss',
  nonces: 'nonssiz',
  cron: 'kron',
  crontab: 'kron tab',
  sudo: 'soo doo',
  chmod: 'ch mod',
  systemctl: 'system control',
  journalctl: 'journal control',
  auditd: 'audit D',
  Sysmon: 'sis mon',
  Zeek: 'zeek',
  Suricata: 'surri KAH ta',
  Wireshark: 'wire shark',
  tcpdump: 'T C P dump',
  Nmap: 'N map',
  sqlmap: 'S Q L map',
  Hashcat: 'hash cat',
  BloodHound: 'blood hound',
  LinPEAS: 'lin peas',
  Ghidra: 'GEE dra',
  Volatility: 'volatility',
  binwalk: 'bin walk',
  Argon2: 'Argon two',
  bcrypt: 'bee crypt',
  scrypt: 'ess crypt',
  'ML-KEM': 'M L kem',
  'ML-DSA': 'M L D S A',
  'SLH-DSA': 'S L H D S A',
  'FN-DSA': 'F N D S A',
  HQC: 'H Q C',
  'CNSA 2.0': 'C N S A two point oh',
  IPv4: 'I P version four',
  IPv6: 'I P version six',
  WPA2: 'W P A two',
  WPA3: 'W P A three',
  WEP: 'wep',
  'x86-64': 'x eighty six sixty four',
  ARM64: 'arm sixty four',
  IMDSv2: 'I M D S version two',
  JA3: 'J A three',
  JA4: 'J A four',
  Log4Shell: 'log four shell',
  Mirai: 'mee RYE',
  Triton: 'TRY ton',
  Stuxnet: 'stucks net',
  Sigma: 'sigma',
  Sigstore: 'sig store',
  cosign: 'co sign',
  Syft: 'sift',
  Trivy: 'TRIV ee',
  Grype: 'gripe',
  gitleaks: 'git leaks',
  Frida: 'FREE da',
  Kubernetes: 'koo ber NET eez',
  Docker: 'docker',
  Terraform: 'TERRA form',
  Checkov: 'CHECK ov',
  tfsec: 'T F sec',
  Wazuh: 'wah ZOO',
  Splunk: 'splunk',
  KQL: 'K Q L',
  SPL: 'S P L',
  Anki: 'ANN key',
  'pwn.college': 'pown dot college',
  PortSwigger: 'port swigger',
  OverTheWire: 'over the wire',
  TryHackMe: 'try hack me',
  'Hack The Box': 'hack the box',
  Metasploit: 'META sploit',
  Metasploitable: 'META sploitable',
  DVWA: 'D V W A',
  GTFOBins: 'G T F O bins',
  Purdue: 'PER doo',
  Bettany: 'BET nee',
  eBPF: 'E B P F',
  LOLBin: 'lol bin',
  'C2': 'C two',
};

/**
 * Phrase rewrites run in two passes. Symbol rules have to wait until after the
 * named-thing pass, or "&" turns ATT&CK into "ATT and CK" before "MITRE ATT&CK"
 * ever gets a chance to match.
 */
const PHRASES_EARLY: [RegExp, string][] = [
  // Paths and commands
  [/\/var\/log/g, 'slash var slash log'],
  [/\/etc\/passwd/g, 'slash etc slash passwd'],
  [/\bchmod (\d)(\d)(\d)\b/g, 'ch mod $1 $2 $3'],
  [/\.\.\//g, 'dot dot slash '],
  [/\bsecurity\.txt\b/g, 'security dot text'],
  [/\bauth\.log\b/g, 'auth dot log'],
  [/\bconn\.log\b/g, 'con dot log'],
  [/\bdns\.log\b/gi, 'D N S dot log'],

  // Identifiers and numbers that should be read as digits
  [/\bCVE-(\d{4})-(\d+)\b/g, 'C V E $1 $2'],
  [/\bSP 800-(\d+)([a-zA-Z0-9]*)\b/g, 'special publication 800 dash $1$2'],
  [/\bFIPS (\d{3})\b/g, 'FIPS $1'],
  [/\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g, '$1 dot $2 dot $3 dot $4'],
  [/\b3-2-1-1-0\b/g, 'three, two, one, one, zero'],
  [/\b3-2-1\b/g, 'three, two, one'],
  [/\bA(0\d|10)\b/g, 'A $1'],
  [/\b4624\b/g, 'forty six twenty four'],
  [/\b4625\b/g, 'forty six twenty five'],
  [/\b4688\b/g, 'forty six eighty eight'],
  [/\bport (\d{2,5})\b/gi, 'port $1'],
  [/\bTop 10\b/g, 'Top Ten'],
  [/\bv(\d+)\b/g, 'version $1'],

];

const PHRASES_LATE: [RegExp, string][] = [
  // Symbols the engines skip or mangle
  [/\s*→\s*/g, ', then '],
  [/\s*—\s*/g, ', '],
  [/\s*–\s*/g, ' to '],
  [/\s*\|\s*/g, ' pipe '],
  [/&/g, ' and '],
  [/\bx(\d+)\b/g, '$1 times'],
  [/(\d)%/g, '$1 percent'],
  [/\$(\d)/g, '$1 dollars'],

  // Curly punctuation the engines occasionally read literally
  [/[’‘]/g, "'"],
  [/[“”]/g, ''],
];

/** Escape a literal string for use inside a RegExp. */
function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* Longest first, so multi-word entries win over their own substrings. */
const SPOKEN_KEYS = Object.keys(SPOKEN).sort((a, b) => b.length - a.length);
const SPELLED_SET = new Set(SPELLED.map((s) => s.toUpperCase()));

/**
 * Rewrite one passage of narration text for speech.
 * Deterministic and pure, so the generation script and the browser agree.
 */
export function forSpeech(input: string): string {
  let out = input;

  for (const [pattern, replacement] of PHRASES_EARLY) out = out.replace(pattern, replacement);

  for (const key of SPOKEN_KEYS) {
    out = out.replace(new RegExp(`\\b${esc(key)}\\b`, 'g'), SPOKEN[key]);
  }

  for (const [pattern, replacement] of PHRASES_LATE) out = out.replace(pattern, replacement);

  /*
   * Anything left that is an all-caps run of two or more letters gets spelled
   * out. Commas between the letters force a brief pause, which is what stops
   * "S S R F" being run together into a nonsense word.
   */
  out = out.replace(/\b([A-Z]{2,6})(s?)\b/g, (whole, acronym: string, plural: string) => {
    if (!SPELLED_SET.has(acronym)) return whole;
    return acronym.split('').join(' ') + (plural ? "'s" : '');
  });

  /* Collapse the whitespace the substitutions leave behind. */
  return out.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
}

/** Convenience for the chunk lists both engines build. */
export function chunksForSpeech<T extends { text: string }>(chunks: T[]): T[] {
  return chunks.map((c) => ({ ...c, text: forSpeech(c.text) }));
}
