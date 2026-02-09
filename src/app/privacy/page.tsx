import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Friends of Barça",
  description: "Privacy Policy for friendsofbarca.com operated by DCT BUSINESS CORP Inc.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold text-[#1A1A2E] mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: February 9, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">1. Who We Are</h2>
          <p>
            This website, <strong>friendsofbarca.com</strong>, is operated by <strong>DCT BUSINESS CORP Inc.</strong>, a company registered at 1395 Brickell Ave, Miami, FL 33131, United States.
          </p>
          <p>
            Friends of Barça is an independent fan website for FC Barcelona supporters. We are not affiliated with, endorsed by, or connected to FC Barcelona or any of its subsidiaries.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Contact Information:</strong> Name, email address, and country when you submit a contact form, subscribe to our newsletter, or upload a photo.</li>
            <li><strong>Usage Data:</strong> Pages visited, time spent on pages, referral source, browser type, and device information through Google Analytics.</li>
            <li><strong>Photo Data:</strong> Images uploaded to our fan gallery, including EXIF metadata (date taken, GPS location if present).</li>
            <li><strong>IP Address:</strong> Collected automatically for security, rate limiting, and fraud prevention purposes.</li>
            <li><strong>Cookie Data:</strong> See our <Link href="/cookies" className="text-[#004D98] underline">Cookie Policy</Link> for details.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>To provide and maintain our services</li>
            <li>To send newsletters and match updates (only with your consent)</li>
            <li>To respond to your inquiries and feedback</li>
            <li>To moderate user-submitted content (fan gallery)</li>
            <li>To analyze website usage and improve our services</li>
            <li>To prevent abuse, fraud, and ensure website security</li>
            <li>To fulfill affiliate partnerships (ticket, hotel, and activity bookings)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">4. Third-Party Services</h2>
          <p>We use the following third-party services that may collect data:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Google Analytics:</strong> Website analytics and usage tracking</li>
            <li><strong>Resend:</strong> Email delivery for newsletters</li>
            <li><strong>StubHub:</strong> Ticket affiliate links</li>
            <li><strong>Booking.com:</strong> Hotel affiliate links</li>
            <li><strong>GetYourGuide:</strong> Activity affiliate links</li>
          </ul>
          <p>Each third-party service operates under its own privacy policy. We encourage you to review their respective policies.</p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">5. Data Retention</h2>
          <p>
            We retain personal data only for as long as necessary to fulfill the purposes described in this policy. Newsletter subscribers can unsubscribe at any time. Contact form submissions are retained for up to 12 months. Photos uploaded to the gallery are retained until removed by the user or an administrator.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent for data processing (e.g., unsubscribe from newsletters)</li>
            <li>Object to processing of your data</li>
            <li>Request data portability</li>
          </ul>
          <p>To exercise any of these rights, please contact us at the address below.</p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes SSL/TLS encryption, secure password hashing, and access controls.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">8. Children&apos;s Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">10. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
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
