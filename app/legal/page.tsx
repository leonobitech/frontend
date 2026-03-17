import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos Legales | Leonobitech",
  description:
    "Términos y condiciones de uso de los servicios, plataformas y APIs de Leonobitech.",
  alternates: { canonical: "/legal" },
};

export default function Legal() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.leonobitech.com" },
      { "@type": "ListItem", position: 2, name: "Términos Legales", item: "https://www.leonobitech.com/legal" },
    ],
  };

  return (
    <div className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <h1 className="text-4xl font-bold mb-6">Legal Terms &amp; Notices</h1>
      <p className="mb-4 text-sm text-muted-foreground">Last updated: June 20, 2025</p>

      <p className="mb-6">
        These terms govern your access to Leonobitech platforms, tools, APIs, and any services that we
        operate under the leonobitech.com domain. By accessing or using our products you agree to comply
        with these terms and all applicable laws. If you disagree with any part, you must discontinue
        use immediately.
      </p>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">1. Services &amp; Eligibility</h2>
          <p>
            Leonobitech provides software, AI, and automation solutions for businesses. You must be at
            least 18 years old—or have the authority to bind your organization—to create an account or
            use restricted areas of our services. You promise that all registration data is accurate and
            that you&apos;ll keep it current.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">2. Acceptable Use</h2>
          <p>
            You agree not to misuse our infrastructure. Prohibited activities include security testing
            without written consent, reverse engineering, spreading malware, sending spam, or attempting
            to circumvent authentication. We may suspend or terminate access when detecting abusive or
            unlawful behaviour.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">3. Accounts &amp; Security</h2>
          <p>
            You are responsible for safeguarding credentials, API keys, and tokens. Notify us promptly
            at <strong>security@leonobitech.com</strong> if you suspect unauthorized use. We implement
            industry-standard protections (encryption in transit, segregation of duties, monitoring),
            but no system is faultless—maintain your own security best practices when integrating with
            our APIs or SDKs.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">4. Intellectual Property</h2>
          <p>
            All content, branding, and technology made available by Leonobitech remain our exclusive
            property or that of our licensors. You receive a non-exclusive license to use the software
            and documentation for their intended purpose. Do not remove trademarks or use the brand
            without prior written permission.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">5. Customer Content</h2>
          <p>
            You retain ownership of content you upload. By submitting data to our services you grant us
            a limited licence to process, store, and transmit it as required to deliver the contracted
            features. You must ensure your content does not violate privacy, intellectual property, or
            regulatory obligations applicable to you.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">6. Payment &amp; Trials</h2>
          <p>
            Paid subscriptions, if any, are billed in advance according to the plan presented at
            checkout. Fees are non-refundable except where required by law. Promotional trials may be
            changed or withdrawn at any time. You are responsible for taxes applicable to your purchase.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">7. Disclaimers</h2>
          <p>
            Services are provided “as is” without warranties of merchantability, fitness for a
            particular purpose, or non-infringement. We do not guarantee uninterrupted availability or
            that integrations with third parties will remain compatible indefinitely.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Leonobitech, its affiliates, and partners will not
            be liable for indirect, incidental, special, or consequential damages, including loss of
            data, profits, or business opportunities, arising from use of our services. Our aggregate
            liability is capped at the greater of USD&nbsp;100 or the fees you paid in the three months
            preceding the claim.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">9. Compliance &amp; Data Protection</h2>
          <p>
            You must comply with all applicable laws when using our products, including privacy,
            security, and export regulations. For details on how we handle personal data, please review
            our{" "}
            <a className="underline" href="/privacy-policy">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">10. Governing Law &amp; Disputes</h2>
          <p>
            These terms are governed by the laws of Peru, without regard to conflict-of-laws rules. Any
            dispute will be handled in the courts of Lima, unless both parties agree to resolve it via
            arbitration or another mechanism.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">11. Changes to These Terms</h2>
          <p>
            We may update these terms to reflect changes in our services, legal requirements, or
            security practices. The revision date at the top reflects the latest version. When changes
            are material we will provide reasonable notice via email or in-app messages.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">12. Contact</h2>
          <p>
            For legal questions or requests, email <strong>legal@leonobitech.com</strong>. For security
            disclosures, contact <strong>security@leonobitech.com</strong>. We aim to respond within two
            business days.
          </p>
        </div>
      </section>
    </div>
  );
}
