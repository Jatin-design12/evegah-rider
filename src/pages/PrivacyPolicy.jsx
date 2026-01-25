import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-white p-6 shadow-sm md:p-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            Privacy Policy
          </h1>
          <Link
            to="/"
            className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back to login
          </Link>
        </div>

        <p className="text-sm text-gray-600">Last updated: January 14, 2026</p>

        <div className="prose prose-sm mt-6 max-w-none">
          <p>
            This Privacy Policy explains how eVEGAH ("we", "us", "our") collects,
            uses, and shares information when you use our web application and
            related services (the "Service").
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Account information</strong>: such as email address and
              authentication details used to sign in.
            </li>
            <li>
              <strong>Operational data</strong>: records you enter or manage in
              the Service (for example rider details, rental/return records,
              battery swap records, and payment-related status).
            </li>
            <li>
              <strong>Contact information</strong>: such as phone numbers when
              you choose to send notifications or receipts (including via
              WhatsApp).
            </li>
            <li>
              <strong>Uploaded content</strong>: files you upload (such as photos
              and signatures) when required for operational workflows.
            </li>
            <li>
              <strong>Usage and device data</strong>: basic technical information
              (such as timestamps, browser type, and pages/actions) needed to
              operate, secure, and improve the Service.
            </li>
          </ul>

          <h2>How we use information</h2>
          <ul>
            <li>Provide, maintain, and improve the Service.</li>
            <li>Authenticate users and enforce role-based access.</li>
            <li>Process and manage operational workflows and records.</li>
            <li>Detect, prevent, and respond to security incidents or misuse.</li>
            <li>Comply with legal obligations and resolve disputes.</li>
          </ul>

          <h2>How we share information</h2>
          <p>
            We do not sell personal information. We may share information in
            limited situations, such as:
          </p>
          <ul>
            <li>
              <strong>Service providers</strong> who help us host, secure, and run
              the Service.
            </li>
            <li>
              <strong>Messaging providers</strong> when you use messaging
              features (for example, the WhatsApp Business Platform / WhatsApp
              Cloud API).
            </li>
            <li>
              <strong>Legal and safety</strong> when required by law or to protect
              rights, safety, and security.
            </li>
            <li>
              <strong>Business changes</strong> as part of a merger, acquisition,
              or asset transfer.
            </li>
          </ul>

          <h2>WhatsApp Business Platform (Cloud API)</h2>
          <p>
            If you choose to send receipts or notifications via WhatsApp, we use
            the WhatsApp Business Platform (Cloud API) provided by Meta
            Platforms, Inc. ("Meta") to deliver messages to the phone number you
            specify.
          </p>
          <h3>What data is processed for WhatsApp messages</h3>
          <ul>
            <li>
              <strong>Recipient phone number</strong> (e.g. the rider/customer
              mobile number).
            </li>
            <li>
              <strong>Message content</strong>, which may include a transactional
              receipt message and related details.
            </li>
            <li>
              <strong>Attachments / links</strong>: for example, a PDF receipt or
              a link to a receipt file hosted by us.
            </li>
            <li>
              <strong>Delivery metadata</strong>: such as message IDs, timestamps,
              delivery status, and error logs.
            </li>
          </ul>

          <h3>Why we send WhatsApp messages</h3>
          <ul>
            <li>
              Provide transaction-related communications (for example, sending a
              receipt).
            </li>
            <li>
              Provide service updates and operational notifications when
              requested.
            </li>
          </ul>

          <h3>Opt-in and opt-out</h3>
          <p>
            We send WhatsApp messages only where we believe the recipient has
            consented/opted in or where otherwise permitted for transactional
            communications. Recipients can opt out of WhatsApp communications by
            replying “STOP” (if supported) and/or by contacting us using the
            details below, after which we will make reasonable efforts to stop
            non-essential messaging.
          </p>

          <h3>Sharing with Meta</h3>
          <p>
            WhatsApp messages are transmitted through Meta’s systems. Meta may
            process message data in accordance with its own terms and privacy
            policy. We only share the data needed to send and deliver messages.
          </p>

          <h3>Retention of WhatsApp-related data</h3>
          <p>
            We may retain WhatsApp delivery logs (for example, status and error
            information) and any generated receipt files for as long as needed
            for operational purposes, auditing, dispute resolution, and legal
            compliance. Retention on Meta/WhatsApp’s side is governed by their
            policies.
          </p>

          <h2>Data retention</h2>
          <p>
            We retain information for as long as needed to provide the Service,
            meet operational requirements, and comply with legal obligations.
          </p>

          <h2>Security</h2>
          <p>
            We implement reasonable administrative, technical, and physical
            safeguards designed to protect information. No system is 100%
            secure, and we cannot guarantee absolute security.
          </p>

          <h2>Your choices</h2>
          <ul>
            <li>
              You may request access, correction, or deletion of certain
              information, subject to operational and legal requirements.
            </li>
            <li>
              If you believe your account has been compromised, contact us
              promptly.
            </li>
          </ul>

          <h2>Third-party services</h2>
          <p>
            The Service may rely on third-party services (for example, hosting,
            analytics, or authentication). Their handling of data is governed by
            their own privacy policies.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this policy from time to time. If we make material
            changes, we will update the “Last updated” date and may provide
            additional notice.
          </p>

          <h2>Contact</h2>
          <p>
            For questions or requests related to privacy, contact your
            administrator or email: <a href="mailto:privacy@evegah.example">privacy@evegah.example</a>
          </p>
        </div>
      </div>
    </div>
  );
}
