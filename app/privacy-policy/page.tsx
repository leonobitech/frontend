import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Leonobitech",
  description:
    "Cómo Leonobitech recopila, usa y protege tu información personal. Conoce tus derechos sobre tus datos.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicy() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://www.leonobitech.com" },
      { "@type": "ListItem", position: 2, name: "Política de Privacidad", item: "https://www.leonobitech.com/privacy-policy" },
    ],
  };

  return (
    <div className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4 text-sm">Last updated: June 20, 2025</p>

      <p className="mb-6">
        At Leonobitech, we value your privacy and are committed to protecting
        your personal information. This policy describes what data we collect,
        how we use it, and your rights.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">
        1. Information We Collect
      </h2>
      <ul className="list-disc list-inside space-y-2">
        <li>Name and contact details (e.g. phone number, email)</li>
        <li>Messages sent via WhatsApp or our platform</li>
        <li>
          Technical data like cookies, IP address, and browser information
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">
        2. How We Use Your Information
      </h2>
      <ul className="list-disc list-inside space-y-2">
        <li>To communicate with you and respond to inquiries</li>
        <li>To automate workflows using services like n8n</li>
        <li>To improve our services and personalize your experience</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">
        3. Third-Party Sharing
      </h2>
      <p className="mb-4">
        We may share your data with trusted partners such as WhatsApp Business
        API providers, automation tools (e.g. n8n, OpenAI), or cloud service
        providers. We ensure they handle your data securely.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Your Rights</h2>
      <p className="mb-4">
        You have the right to access, correct, or delete your personal
        information. You can also request data export or opt out of certain
        communications.
      </p>
      <p className="mb-4">
        To exercise your rights, contact us at:{" "}
        <strong>privacy@leonobitech.com</strong>
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
      <p className="mb-4">
        We implement encryption, access control, and continuous monitoring to
        protect your data against unauthorized access.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">
        6. Changes to this Policy
      </h2>
      <p className="mb-4">
        We may update this policy periodically. The latest version will always
        be available at this URL.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">7. Contact</h2>
      <p>
        If you have questions about this policy, email us at:{" "}
        <strong>privacy@leonobitech.com</strong>
      </p>
    </div>
  );
}
