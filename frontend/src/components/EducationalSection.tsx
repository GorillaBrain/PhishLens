import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, AlertCircle, ShieldAlert, Lock, CheckCircle, HelpCircle } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  icon: typeof BookOpen;
  summary: string;
  content: string[];
}

export default function EducationalSection() {
  const [expandedId, setExpandedId] = useState<string | null>('what-is-phishing');

  const topics: Topic[] = [
    {
      id: 'what-is-phishing',
      title: 'What is URL Phishing?',
      icon: AlertCircle,
      summary: 'Deceptive links designed to steal credentials, session tokens, or financial data.',
      content: [
        'Phishing is a social engineering attack where malicious actors impersonate trusted organizations (banks, cloud services, IT departments) through deceptive links.',
        'When clicked, phishing URLs lead victims to forged login portals or initiate malware payloads.',
        'Modern phishing attacks often use automated credential harvesters or Reverse Proxy Phishing kits (like Evilginx) capable of intercepting multi-factor authentication (MFA) session tokens in real time.',
      ],
    },
    {
      id: 'how-urls-disguised',
      title: 'How Attackers Disguise URLs',
      icon: ShieldAlert,
      summary: 'Tactics such as typosquatting, deceptive subdomains, and open redirects.',
      content: [
        'Subdomain Prepending: Attackers create domains like "paypal.com.account-verification-service.tk", tricking users into noticing the brand name while the actual domain is at the end.',
        'Typosquatting & Combosquatting: Registering domains with subtle misspellings (e.g., "g00gle.com", "micros0ft-support.com") or homoglyphs using internationalized punycode characters.',
        'Link Shorteners & Redirectors: Masking the true destination behind services like bit.ly or utilizing open redirect vulnerabilities on reputable websites.',
        'Embedded Credential Syntax: Using the "@" character (e.g., "http://trusted.com@evil.com"), where browsers treat "trusted.com" as userinfo and navigate to "evil.com".',
      ],
    },
    {
      id: 'https-misconception',
      title: 'Why HTTPS Does NOT Guarantee Safety',
      icon: Lock,
      summary: 'Encryption guarantees privacy between client and server, not the trustworthiness of the owner.',
      content: [
        'A padlock icon in the browser only signifies that data in transit is encrypted using Transport Layer Security (TLS).',
        'Automated Certificate Authorities (like Let’s Encrypt) provide free, valid TLS certificates to anyone who controls a domain name—including phishing actors.',
        'Over 80% of active phishing websites now utilize valid HTTPS certificates to blend in and evade legacy browser warnings.',
        'Always verify WHO you are communicating with, not just whether the pipe is encrypted.',
      ],
    },
    {
      id: 'identifying-suspicious-domains',
      title: 'How to Inspect & Identify Suspicious Domains',
      icon: HelpCircle,
      summary: 'Key structural checkpoints to inspect before entering credentials.',
      content: [
        'Read from Right to Left: Find the Top-Level Domain (.com, .org, etc.) and the immediate domain preceding it. In "support.apple.com.attacker.com", the owner is "attacker.com", not Apple.',
        'IP Address in Address Bar: Legitimate web services rarely present raw IP addresses (e.g. 192.0.2.1) to end users.',
        'Abnormal Character Sets: Keep an eye out for random alphanumeric strings, hyphens between brand names, and unexpected foreign characters.',
        'Non-Standard Ports: Standard web protocols operate over port 80 (HTTP) or 443 (HTTPS). Unfamiliar ports like :8080 or :8443 on public consumer sites warrant scrutiny.',
      ],
    },
    {
      id: 'response-actions',
      title: 'What to Do If a URL Appears Suspicious',
      icon: CheckCircle,
      summary: 'Safe defensive protocols to follow when evaluating suspicious links.',
      content: [
        '1. Never Enter Credentials: Do not enter usernames, passwords, or MFA codes if you arrived at a page via an unsolicited message or email.',
        '2. Navigate Out-of-Band: Type the trusted website address directly into your browser or use your saved bookmarks rather than clicking links in messages.',
        '3. Inspect Without Clicking: Hover over links to reveal the actual destination URI before interacting.',
        '4. Report to Security Teams: Submit suspicious emails to your company IT/Security Operations Center (SOC) or forward phishing emails to phish@antiphishing.org.',
      ],
    },
  ];

  const toggleTopic = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6" data-testid="educational-section">
      <div className="space-y-2 text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <BookOpen className="w-5 h-5 text-[#06b6d4]" />
          <h2 className="text-xl font-bold text-[#f1f5f9]">Cybersecurity Knowledge Base</h2>
        </div>
        <p className="text-xs sm:text-sm text-[#94a3b8] max-w-2xl">
          Understanding URL anatomy, attacker deception techniques, and secure browsing habits is
          the most effective first line of defense against cyber threats.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {topics.map((topic) => {
          const isExpanded = expandedId === topic.id;
          const Icon = topic.icon;

          return (
            <div
              key={topic.id}
              className="rounded-xl bg-[#111827] border border-[#1e293b] overflow-hidden transition-all"
              data-testid={`topic-card-${topic.id}`}
            >
              <button
                onClick={() => toggleTopic(topic.id)}
                className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-[#1e293b]/40 transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#06b6d4] shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f1f5f9]">{topic.title}</h3>
                    <p className="text-xs text-[#94a3b8]">{topic.summary}</p>
                  </div>
                </div>

                <div className="text-[#64748b] shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#06b6d4]" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-[#1e293b] bg-[#0a0e1a]/40 space-y-2">
                  {topic.content.map((point, index) => (
                    <p key={index} className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
                      {point}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
