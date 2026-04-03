import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Terms & Notices | Leonobitech",
  description:
    "Terms and conditions for Leonobitech services, online courses, platforms, and APIs.",
  alternates: { canonical: "/legal" },
};

export default function Legal() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.leonobitech.com" },
      { "@type": "ListItem", position: 2, name: "Legal Terms", item: "https://www.leonobitech.com/legal" },
    ],
  };

  return (
    <div className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <h1 className="text-4xl font-bold mb-6">Legal Terms &amp; Notices</h1>
      <p className="mb-4 text-sm text-muted-foreground">Last updated: April 3, 2026</p>

      <p className="mb-6">
        These terms govern your access to Leonobitech platforms, online courses, tools, APIs, and any
        services operated under the leonobitech.com domain. By accessing or using our products—including
        purchasing or enrolling in courses—you agree to comply with these terms and all applicable laws.
        If you disagree with any part, you must discontinue use immediately.
      </p>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">1. Services &amp; Eligibility</h2>
          <p>
            Leonobitech provides online courses, software, AI, and automation solutions for businesses
            and professionals worldwide. You must be at least 18 years old—or have the authority to bind
            your organization—to create an account, purchase courses, or use restricted areas of our
            services. You confirm that all registration data is accurate and that you will keep it current.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">2. Online Courses</h2>
          <p className="mb-2">
            When you purchase a course, you receive a personal, non-transferable license to access the
            course content for your own educational use. Specifically:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Course access is tied to your account and cannot be shared, resold, or transferred.</li>
            <li>Only one active session per user is permitted at any time.</li>
            <li>Reproducing, distributing, or publicly displaying course materials—including videos,
              documents, and assessments—without written consent is prohibited.</li>
            <li>Course content may be updated or modified at our discretion to keep it current and accurate.</li>
            <li>Completion of a course may require passing a final assessment as described in the course details.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">3. Payments &amp; Refunds</h2>
          <p className="mb-2">
            All course payments are processed securely through Stripe. Prices are displayed in
            USD unless otherwise indicated.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Payment is required in full before course access is granted.</li>
            <li>You are responsible for any taxes, duties, or fees applicable in your jurisdiction.</li>
            <li>Refund requests may be submitted within 14 days of purchase if you have not completed
              more than 25% of the course content. After that threshold, no refunds will be issued.</li>
            <li>Chargebacks initiated without first contacting us may result in account suspension.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">4. Acceptable Use</h2>
          <p>
            You agree not to misuse our infrastructure. Prohibited activities include security testing
            without written consent, reverse engineering, spreading malware, sending spam, attempting
            to circumvent authentication, or sharing account credentials. We may suspend or terminate
            access when detecting abusive or unlawful behaviour.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">5. Accounts &amp; Security</h2>
          <p>
            You are responsible for safeguarding your account access. All accounts use passwordless
            authentication with email verification and passkey-based two-factor authentication. Notify
            us promptly at <strong>security@leonobitech.com</strong> if you suspect unauthorized access.
            We implement industry-standard protections including encryption in transit, token-based
            sessions, and device fingerprinting.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">6. Intellectual Property</h2>
          <p>
            All content, branding, course materials, and technology made available by Leonobitech remain
            our exclusive property or that of our licensors. You receive a non-exclusive, non-transferable
            license to use the software, courses, and documentation for their intended purpose. Do not
            remove trademarks or use the brand without prior written permission.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">7. Graduate Showcase</h2>
          <p>
            Upon course completion and approval, your project may be featured on our public graduate
            showcase. By submitting your project for review, you grant Leonobitech a non-exclusive
            license to display your project title, description, screenshots, and demo link on our
            website. You may request removal of your showcase entry at any time by contacting us.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">8. User Content</h2>
          <p>
            You retain ownership of content you upload, including project submissions and profile
            information. By submitting data to our services, you grant us a limited licence to process,
            store, and transmit it as required to deliver the contracted features. You must ensure your
            content does not violate privacy, intellectual property, or regulatory obligations applicable
            to you.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">9. Disclaimers</h2>
          <p>
            Services and course content are provided &quot;as is&quot; without warranties of merchantability,
            fitness for a particular purpose, or non-infringement. Course outcomes depend on individual
            effort—we do not guarantee specific results, employment, or business outcomes from completing
            our courses. We do not guarantee uninterrupted availability or that integrations with third
            parties will remain compatible indefinitely.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Leonobitech, its affiliates, and partners
            will not be liable for indirect, incidental, special, or consequential damages, including
            loss of data, profits, or business opportunities, arising from use of our services or course
            content. Our aggregate liability is capped at the greater of USD&nbsp;100 or the fees you
            paid in the three months preceding the claim.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">11. Data Protection &amp; Privacy</h2>
          <p>
            We process personal data in accordance with applicable data protection laws, including the
            EU General Data Protection Regulation (GDPR) where applicable. Our infrastructure is hosted
            within the European Union. You must comply with all applicable laws when using our products,
            including privacy, security, and export regulations. For details on how we handle personal
            data, please review our{" "}
            <a className="underline" href="/privacy-policy">
              Privacy Policy
            </a>.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">12. Governing Law &amp; Disputes</h2>
          <p>
            These terms are governed by the applicable laws of the jurisdiction in which you reside,
            to the extent required by local consumer protection regulations. For any dispute that cannot
            be resolved informally, both parties agree to submit to binding arbitration administered
            by a mutually agreed-upon international arbitration body. Nothing in these terms limits your
            rights under mandatory consumer protection laws in your country of residence.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">13. Changes to These Terms</h2>
          <p>
            We may update these terms to reflect changes in our services, legal requirements, or
            security practices. The revision date at the top reflects the latest version. When changes
            are material we will provide reasonable notice via email or in-app messages.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-2">14. Contact</h2>
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
