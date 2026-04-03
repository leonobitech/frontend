import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Leonobitech",
  description:
    "How Leonobitech collects, uses, and protects your personal information. Know your rights over your data.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicy() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.leonobitech.com" },
      { "@type": "ListItem", position: 2, name: "Privacy Policy", item: "https://www.leonobitech.com/privacy-policy" },
    ],
  };

  return (
    <div className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4 text-sm text-muted-foreground">Last updated: April 3, 2026</p>

      <p className="mb-6">
        At Leonobitech, we are committed to protecting your privacy. This policy describes what personal
        data we collect, why we collect it, how we use and protect it, and your rights. This policy
        applies to all Leonobitech services, including our website, online courses, APIs, and automation
        tools operated under the leonobitech.com domain.
      </p>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>
          <p className="mb-2">We collect the following categories of personal data:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account data:</strong> Email address, name, and profile information you provide during registration or onboarding.</li>
            <li><strong>Authentication data:</strong> Passkey credentials (public keys only—we never store biometric data), session identifiers, and device fingerprints (device type, operating system, browser, screen resolution).</li>
            <li><strong>Payment data:</strong> Processed securely by Stripe. We do not store credit card numbers, CVVs, or full payment details on our servers. We retain transaction identifiers and purchase history.</li>
            <li><strong>Course data:</strong> Enrollment records, lesson progress, assessment results, and project submissions.</li>
            <li><strong>Technical data:</strong> IP address, browser type, operating system, timezone, language preferences, and pages visited.</li>
            <li><strong>Communication data:</strong> Messages sent via WhatsApp, Telegram, or our platform in connection with our AI assistant services.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Service delivery:</strong> To provide access to courses, process payments, track your learning progress, and deliver AI and automation services.</li>
            <li><strong>Authentication &amp; security:</strong> To verify your identity, maintain session security, detect unauthorized access, and enforce single-session policies.</li>
            <li><strong>Communication:</strong> To send magic link emails, course updates, payment confirmations, and respond to your inquiries.</li>
            <li><strong>Graduate showcase:</strong> To display your completed project publicly upon your submission and our approval.</li>
            <li><strong>Improvement:</strong> To analyze usage patterns, improve our services, and personalize your experience.</li>
            <li><strong>Legal compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">3. Legal Basis for Processing (GDPR)</h2>
          <p className="mb-2">Where the EU General Data Protection Regulation applies, we process your data on the following bases:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Contract performance:</strong> Processing necessary to deliver services you purchased (courses, AI tools).</li>
            <li><strong>Legitimate interest:</strong> Security monitoring, fraud prevention, and service improvement.</li>
            <li><strong>Consent:</strong> Marketing communications and optional features like the graduate showcase. You may withdraw consent at any time.</li>
            <li><strong>Legal obligation:</strong> Tax records, regulatory compliance, and responding to lawful requests.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">4. Cookies &amp; Similar Technologies</h2>
          <p className="mb-2">We use the following cookies, all set as HttpOnly and Secure:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>accessKey:</strong> Session authentication token identifier. Expires after 15 minutes (automatically refreshed).</li>
            <li><strong>clientKey:</strong> Device fingerprint hash for session security. Expires with the session (30 days).</li>
            <li><strong>clientMeta:</strong> Encrypted session metadata for admin service authentication. Expires after 20 minutes.</li>
          </ul>
          <p className="mt-2">
            We use Cloudflare Turnstile for bot protection during login, which may set its own cookies
            as described in{" "}
            <a className="underline" href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
              Cloudflare&apos;s Privacy Policy
            </a>.
            We do not use advertising or analytics tracking cookies.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">5. Third-Party Services</h2>
          <p className="mb-2">We share data with the following categories of service providers, all bound by data processing agreements:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Payment processing:</strong> Stripe (PCI DSS compliant) for course purchases and refunds.</li>
            <li><strong>Email delivery:</strong> Resend for transactional emails (magic links, notifications).</li>
            <li><strong>AI services:</strong> Anthropic (Claude) for AI-powered features. Conversations may be processed by their API but are not used to train models.</li>
            <li><strong>Infrastructure:</strong> Contabo (EU-based hosting), Cloudflare (CDN and security), MongoDB Atlas (database).</li>
          </ul>
          <p className="mt-2">We do not sell your personal data to third parties.</p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">6. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account data:</strong> Retained while your account is active. Deleted within 30 days of account deletion request.</li>
            <li><strong>Session &amp; authentication data:</strong> Access tokens expire after 15 minutes. Sessions expire after 30 days. Security event logs retained for 90 days.</li>
            <li><strong>Payment records:</strong> Retained for 7 years as required by tax and accounting regulations.</li>
            <li><strong>Course progress &amp; certificates:</strong> Retained indefinitely to support graduate verification, unless you request deletion.</li>
            <li><strong>Communication logs:</strong> Retained for 12 months, then automatically purged.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">7. Data Security</h2>
          <p>We implement the following measures to protect your data:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Encryption in transit (TLS/HTTPS) and at rest (AES-256 for sensitive data).</li>
            <li>Passwordless authentication with email verification and passkey-based two-factor authentication.</li>
            <li>Token-based sessions with automatic rotation and single-session enforcement.</li>
            <li>Rate limiting on authentication endpoints.</li>
            <li>Infrastructure hosted within the European Union with automated security monitoring.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">8. Your Rights</h2>
          <p className="mb-2">Depending on your jurisdiction, you may have the following rights:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;).</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
            <li><strong>Restriction:</strong> Request that we limit processing of your data.</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interest.</li>
            <li><strong>Withdraw consent:</strong> Where processing is based on consent, withdraw it at any time.</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact us at <strong>privacy@leonobitech.com</strong>.
            We will respond within 30 days. If you are in the EU and believe your rights have not been
            adequately addressed, you have the right to lodge a complaint with your local data protection
            authority.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">9. International Data Transfers</h2>
          <p>
            Our primary infrastructure is hosted in the European Union (France). Some third-party services
            may process data in other jurisdictions. Where data is transferred outside the EU, we ensure
            appropriate safeguards are in place, such as Standard Contractual Clauses or adequacy decisions
            recognized by the European Commission.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">10. Children&apos;s Privacy</h2>
          <p>
            Our services are not directed to individuals under 18 years of age. We do not knowingly
            collect personal data from minors. If you believe we have inadvertently collected data from
            a minor, please contact us and we will promptly delete it.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">11. Changes to This Policy</h2>
          <p>
            We may update this policy to reflect changes in our services, legal requirements, or data
            practices. The revision date at the top reflects the latest version. When changes are material,
            we will provide reasonable notice via email or in-app messages.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">12. Contact</h2>
          <p>
            For privacy questions, data requests, or concerns, email <strong>privacy@leonobitech.com</strong>.
            For security disclosures, contact <strong>security@leonobitech.com</strong>. We aim to respond
            within two business days.
          </p>
        </div>
      </section>
    </div>
  );
}
