import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-white p-6 shadow-sm md:p-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            Terms of Service
          </h1>
          <Link
            to="/"
            className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back to login
          </Link>
        </div>

        <p className="text-sm text-gray-600">Effective: January 14, 2026</p>

        <div className="prose prose-sm mt-6 max-w-none">
          <p>
            These Terms of Service ("Terms") govern access to and use of the
            eVEGAH web application and related services (the "Service"). By
            accessing or using the Service, you agree to these Terms.
          </p>

          <h2>Who may use the Service</h2>
          <p>
            The Service is intended for authorized personnel and users permitted
            by eVEGAH or an eVEGAH customer. You must use the Service only in
            compliance with applicable laws and organizational policies.
          </p>

          <h2>Accounts and access</h2>
          <ul>
            <li>You are responsible for maintaining account confidentiality.</li>
            <li>
              Do not share credentials. Notify your administrator of suspected
              unauthorized access.
            </li>
            <li>
              We may suspend or revoke access to protect the Service or comply
              with requirements.
            </li>
          </ul>

          <h2>Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for unlawful, harmful, or fraudulent purposes.</li>
            <li>
              Attempt to bypass security controls, access restricted areas, or
              interfere with system operation.
            </li>
            <li>
              Upload content that you do not have permission to share or that
              violates privacy or other rights.
            </li>
          </ul>

          <h2>Data and content</h2>
          <p>
            You (or your organization) are responsible for the accuracy and
            legality of data entered into the Service, including uploaded files.
            We may store and process this data to provide the Service.
          </p>

          <h2>Service availability</h2>
          <p>
            We aim to keep the Service available, but it may be interrupted for
            maintenance, updates, or events outside our control. The Service is
            provided on an “as is” and “as available” basis.
          </p>

          <h2>Termination</h2>
          <p>
            We may suspend or terminate access if you violate these Terms or if
            required for security or compliance reasons.
          </p>

          <h2>Disclaimers and limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, eVEGAH disclaims warranties
            and will not be liable for indirect, incidental, special,
            consequential, or punitive damages, or any loss of data, profits, or
            business arising from your use of the Service.
          </p>

          <h2>Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the
            Service after changes means you accept the updated Terms.
          </p>

          <h2>Contact</h2>
          <p>
            For questions about these Terms, contact your administrator or email:
            <a href="mailto:support@evegah.example"> support@evegah.example</a>
          </p>
        </div>
      </div>
    </div>
  );
}
