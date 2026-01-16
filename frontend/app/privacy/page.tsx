import styles from "@/styles/pages/legal.module.css";

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
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of
            any significant changes by posting the new policy on this page.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Contact</h2>
          <p>
            For questions about this Privacy Policy, please visit{" "}
            <a href="https://www.emmanuelp.com" target="_blank" rel="noopener noreferrer">
              emmanuelp.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
