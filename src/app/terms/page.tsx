import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | Friends of Barça",
  description: "Terms of Use for friendsofbarca.com operated by DCT BUSINESS CORP Inc.",
};

export default function TermsOfUsePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold text-[#1A1A2E] mb-2">Terms of Use</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: February 9, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using <strong>friendsofbarca.com</strong> (the &quot;Website&quot;), operated by <strong>DCT BUSINESS CORP Inc.</strong> (1395 Brickell Ave, Miami, FL 33131, United States), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the Website.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">2. Description of Service</h2>
          <p>
            Friends of Barça is an independent fan website providing information, news, match packages, travel guides, and community features for FC Barcelona supporters. We are <strong>not affiliated with, endorsed by, or connected to FC Barcelona</strong> or any of its subsidiaries.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">3. Affiliate Links & Third-Party Services</h2>
          <p>
            This Website contains affiliate links to third-party services including ticket providers (StubHub), accommodation providers (Booking.com), and activity providers (GetYourGuide). When you click on these links and make a purchase, we may earn a commission at no additional cost to you.
          </p>
          <p>
            We do not control and are not responsible for the content, privacy policies, or practices of third-party websites. We encourage you to review the terms and privacy policies of any third-party services you interact with.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">4. User-Submitted Content</h2>
          <p>By submitting content to the Website (including photos, feedback, and comments), you:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Warrant that you own the content or have the right to share it</li>
            <li>Grant us a non-exclusive, royalty-free, worldwide license to display and distribute the content on our Website</li>
            <li>Agree that your content may be moderated, edited, or removed at our discretion</li>
            <li>Accept responsibility for any content you submit</li>
          </ul>
          <p>
            We reserve the right to remove any user-submitted content that violates these terms, is inappropriate, offensive, or infringes on third-party rights.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">5. Intellectual Property</h2>
          <p>
            All original content on this Website, including text, graphics, logos, and software, is the property of DCT BUSINESS CORP Inc. and is protected by copyright and intellectual property laws.
          </p>
          <p>
            FC Barcelona&apos;s name, logo, and related marks are trademarks of Futbol Club Barcelona. All other trademarks belong to their respective owners. Their use on this Website is for informational and fan purposes only.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">6. Prohibited Uses</h2>
          <p>You agree not to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Use the Website for any unlawful purpose</li>
            <li>Upload malicious content, spam, or harmful material</li>
            <li>Attempt to gain unauthorized access to any part of the Website</li>
            <li>Scrape, crawl, or use automated tools to extract content without permission</li>
            <li>Impersonate any person or entity</li>
            <li>Interfere with the proper functioning of the Website</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">7. Disclaimer of Warranties</h2>
          <p>
            The Website is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We do not guarantee that the Website will be uninterrupted, secure, or error-free.
          </p>
          <p>
            Match information, predictions, and travel advice are provided for informational purposes only. We recommend verifying all information with official sources before making travel or purchase decisions.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, DCT BUSINESS CORP Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Website, including but not limited to loss of data, revenue, or profits.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">9. Governing Law</h2>
          <p>
            These Terms of Use shall be governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Use at any time. Changes will be effective immediately upon posting. Your continued use of the Website constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">11. Contact</h2>
          <div className="bg-gray-50 rounded-xl p-4 mt-2">
            <p><strong>DCT BUSINESS CORP Inc.</strong></p>
            <p>1395 Brickell Ave</p>
            <p>Miami, FL 33131</p>
            <p>United States</p>
            <p className="mt-2">
              Email: <Link href="/contact" className="text-[#004D98] underline">Contact Form</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
