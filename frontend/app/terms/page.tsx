import styles from "@/styles/pages/legal.module.css";

export const metadata = {
  title: "Terms of Service | NagAI",
  description: "Terms of Service for NagAI",
};

export default function TermsOfServicePage() {
  return (
    <div className={styles.legalContainer}>
      <div className={styles.legalContent}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Last updated: January 2025</p>

        <section className={styles.section}>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using NagAI, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Description of Service</h2>
          <p>
            NagAI is an AI-powered goal tracking and accountability platform designed to help
            users set, track, and achieve their personal and professional goals through
            intelligent reminders and progress monitoring.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. User Accounts</h2>
          <p>
            To use certain features of NagAI, you must create an account. You are responsible
            for maintaining the confidentiality of your account credentials and for all
            activities that occur under your account.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. User Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to the service</li>
            <li>Interfere with or disrupt the service</li>
            <li>Upload malicious content or code</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Intellectual Property</h2>
          <p>
            All content, features, and functionality of NagAI are owned by Emmanuel Pierre
            and are protected by intellectual property laws. You may not copy, modify, or
            distribute any part of the service without permission.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Disclaimer of Warranties</h2>
          <p>
            NagAI is provided &quot;as is&quot; without warranties of any kind. We do not
            guarantee that the service will be uninterrupted, error-free, or meet your
            specific requirements.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Limitation of Liability</h2>
          <p>
            In no event shall NagAI or its creator be liable for any indirect, incidental,
            special, or consequential damages arising from your use of the service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the
            service after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Contact</h2>
          <p>
            For questions about these Terms of Service, please visit{" "}
            <a href="https://www.emmanuelp.com" target="_blank" rel="noopener noreferrer">
              emmanuelp.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
