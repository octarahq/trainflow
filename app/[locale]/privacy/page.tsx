import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 py-24">
        <div className="container mx-auto px-6 max-w-4xl flex flex-col">
          <div className="flex flex-col gap-4 mb-10">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground text-base font-medium">
                Effective date: 2026-09-04
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-12 text-foreground/90">
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Introduction
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  Octara (or OctaraHQ) (&quot;we&quot;, &quot;us&quot;, or
                  &quot;our&quot;) is committed to protecting the privacy of
                  visitors and users of our websites, applications, and services
                  worldwide. This Privacy Policy explains what information we
                  collect, how we use it, when we share it, and the rights
                  available to you.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  1. Information we collect
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  We may receive technical data such as your IP address, device information, or browser type as part of normal network communication. However, <strong>we do not store, track, or save any of this information</strong>. Any data received is transient and strictly used for the momentary routing of network requests.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  2. How we use information
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  Because we do not store your data, we do not use it for analytics, profiling, or marketing. Any technical information (like IP addresses) is processed solely in real-time to facilitate your connection to our services and is immediately discarded. We do strictly nothing else with it.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  3. Sharing and disclosure
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  We may share information with service providers who perform
                  services on our behalf, with affiliates, or when required by
                  law. We do not sell personal data to third parties. We take
                  contractual and technical measures to protect data shared with
                  processors.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  4. Cookies and similar technologies
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  We use cookies and similar technologies for functionality,
                  analytics, and to improve user experience. You can control
                  cookie preferences through your browser and, where provided,
                  site controls.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  5. International transfers
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  Octara operates globally. Personal data may be transferred and
                  processed in countries with different data protection laws. When
                  transferring data internationally, we use appropriate safeguards
                  such as contracts or other mechanisms permitted by law.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  6. Data retention and security
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  We do not retain any personal data or logs. Since no data is stored, there is no risk of data breaches involving your personal information from our servers.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  7. Your rights
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  Subject to local law, you may have the right to access, correct,
                  delete, or restrict processing of your personal data, or to
                  object to processing. To exercise rights, contact us using the
                  details below.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  8. Children
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  Our services are not directed at children under 16. We do not
                  knowingly collect personal data from children. If you believe we
                  have collected data from a child, please contact us to request
                  deletion.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  9. Changes to this policy
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  We may update this policy from time to time. We will post the
                  revised policy with an updated effective date. Continued use of
                  our services after changes constitutes acceptance of the updated
                  policy.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  10. Contact
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  For questions or to exercise your rights, contact us in our
                  discord server.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight">
                  11. Developer and Publisher Information
                </h2>
              </div>
              <div className="pl-5 border-l border-border">
                <p className="text-base leading-relaxed text-foreground/80">
                  For compliance with Google Play Store policies, please note that the developer, owner, and the person assuming full legal responsibility for this application is <strong>Jules Santon</strong>. The Google Play developer account is registered under the name of <strong>Aubin DEVOGELAERE</strong>, who acts solely as the account holder. Jules Santon assumes all responsibility for the application, its content, and its compliance with relevant policies.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
