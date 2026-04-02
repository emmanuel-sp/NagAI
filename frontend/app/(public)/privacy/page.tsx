import styles from "@/components/legal/legal.module.css";

export const metadata = {
  title: "Privacy Policy | NagAI",
  description: "Privacy Policy for NagAI",
};

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.legalContainer}>
      <div className={styles.legalContent}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last updated: January 2025</p>

        <section className={styles.section}>
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy explains how NagAI collects, uses, and protects your
            personal information when you use our service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul>
            <li>
              <strong>Account Information:</strong> Name, email address, and profile
              details you provide when creating an account
            </li>
            <li>
              <strong>Goal Data:</strong> Goals, checklists, and progress information
              you enter into the application
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you interact with the
              service, including features used and time spent
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and improve the NagAI service</li>
            <li>Send you reminders and notifications about your goals</li>
            <li>Personalize your experience with AI-powered suggestions</li>
            <li>Communicate important updates about the service</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Data Storage and Security</h2>
          <p>
            We implement appropriate security measures to protect your personal
            information. Your data is stored securely and we use encryption to protect
            sensitive information during transmission.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share data only in the
            following circumstances:
          </p>
          <ul>
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>With service providers who assist in operating our platform</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>7. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to maintain your session, remember
            your preferences, and improve the service. You can control cookie settings
            through your browser.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Google API Data</h2>
          <p>
            NagAI may request access to your Google Calendar data to generate a
            personalized daily plan that avoids conflicts with your existing events.
            Specifically, we access read-only calendar event data (titles, times, and
            durations) solely for the purpose of generating that plan.
          </p>
          <ul>
            <li>
              <strong>What we access:</strong> Google Calendar event data (event titles,
              start/end times) for the current day only
            </li>
            <li>
              <strong>How we use it:</strong> This data is sent to Anthropic&apos;s Claude
              API to generate a personalized daily schedule. It is not stored by NagAI
              beyond the duration of that request.
            </li>
            <li>
              <strong>Opt-in only:</strong> This feature is entirely optional. You must
              explicitly grant calendar access, and you can revoke it at any time via
              your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Account permissions
              </a>
              .
            </li>
            <li>
              <strong>No sale or advertising use:</strong> Google user data is never
              sold, shared with third parties for advertising purposes, or used for any
              purpose other than the feature described above.
            </li>
          </ul>
          <p>
            NagAI&apos;s use and transfer of information received from Google APIs
            adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of
            any significant changes by posting the new policy on this page.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Contact</h2>
          <p>
            For questions about this Privacy Policy, please visit{" "}
            <a href="https://www.emmanuelp.com" target="_blank" rel="noopener noreferrer">
              emmanuelp.com
            </a>, where you&apos;ll learn more about the developer and ways to reach out.
          </p>
        </section>
      </div>
    </div>
  );
}
