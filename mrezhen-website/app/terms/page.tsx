import { ScrollText } from "lucide-react"

export const dynamic = "force-static"

/**
 * Terms of Service — /terms
 *
 * Stored as a static page for easy editing. To make this DB-driven
 * later, simply fetch the content from a `SiteContent` table instead.
 */
export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-7 w-7 text-muted-foreground" />
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: February 27, 2026
        </p>
      </div>

      {/* ─── Sections ────────────────────────────────────── */}
      <article className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Mrezhen (&quot;the Platform&quot;), you agree to be bound
            by these Terms of Service (&quot;Terms&quot;). If you do not agree, you may not
            use the Platform. We reserve the right to update these Terms at any time;
            continued use constitutes acceptance of revisions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. User Conduct</h2>
          <p>You agree to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide accurate and truthful information during registration.</li>
            <li>Treat other users with respect—no harassment, hate speech, or bullying.</li>
            <li>Not impersonate another person or entity.</li>
            <li>Not share, post, or transmit illegal, harmful, or offensive content.</li>
            <li>Not use automated tools (bots, scrapers) without written permission.</li>
            <li>Report violations of these Terms when encountered.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Score Manipulation Policy</h2>
          <p>
            Mrezhen uses a points (&quot;XP&quot;) system to track user progress. Any attempt
            to artificially inflate or manipulate scores is strictly prohibited,
            including but not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Creating multiple accounts to boost scores.</li>
            <li>Exploiting bugs or glitches in the scoring system.</li>
            <li>Colluding with other users to exchange fraudulent verifications.</li>
            <li>Using automated scripts to complete tasks or quests.</li>
          </ul>
          <p>
            Violation may result in score reset, temporary suspension, or permanent
            account termination at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Account Suspension &amp; Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account without prior
            notice if you:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violate any provision of these Terms.</li>
            <li>Engage in score manipulation (see Section 3).</li>
            <li>Engage in abusive, fraudulent, or illegal activity.</li>
            <li>Remain inactive for more than 12 consecutive months.</li>
          </ul>
          <p>
            You may also voluntarily deactivate or delete your account through Settings.
            Deleted accounts cannot be recovered.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Intellectual Property</h2>
          <p>
            All content, design, code, and branding on the Platform is owned by Mrezhen
            or its licensors. Users retain ownership of content they create but grant
            the Platform a non-exclusive, royalty-free license to display and distribute
            it within the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Data Usage &amp; Privacy</h2>
          <p>
            We collect and process personal data necessary to operate the Platform.
            Your data is handled in accordance with our Privacy Policy. Key points:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>We never sell your personal data to third parties.</li>
            <li>Aggregated, anonymized data may be used for analytics and research.</li>
            <li>You may request export or deletion of your data at any time.</li>
            <li>AI features process user inputs to provide recommendations; inputs are not stored beyond the session unless explicitly saved.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Third-Party Services</h2>
          <p>
            The Platform may integrate with third-party services (e.g., OAuth providers,
            cloud storage). We are not responsible for the practices or policies of
            these services. Use them at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Disclaimers &amp; Limitation of Liability</h2>
          <p>
            The Platform is provided &quot;as is&quot; without warranties of any kind, express
            or implied. We are not liable for any damages arising from your use of the
            Platform, including but not limited to loss of data, interruption of
            service, or inaccuracies in AI-generated content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Changes to These Terms</h2>
          <p>
            We may revise these Terms at any time. Material changes will be communicated
            via email or an in-app notification. Your continued use of the Platform
            after changes take effect constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. Contact</h2>
          <p>
            If you have questions about these Terms, please reach out via our{" "}
            <a href="/contact" className="underline underline-offset-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
              Contact Page
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  )
}
