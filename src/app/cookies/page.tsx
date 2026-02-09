import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | Friends of Barça",
  description: "Cookie Policy for friendsofbarca.com operated by DCT BUSINESS CORP Inc.",
};

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold text-[#1A1A2E] mb-2">Cookie Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: February 9, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">1. What Are Cookies</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">2. How We Use Cookies</h2>
          <p>
            <strong>friendsofbarca.com</strong>, operated by <strong>DCT BUSINESS CORP Inc.</strong> (1395 Brickell Ave, Miami, FL 33131, United States), uses cookies for the following purposes:
          </p>

          <h3 className="font-bold text-[#1A1A2E] mt-4 mb-2">Essential Cookies</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left">Cookie</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">Purpose</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-mono text-xs">cookie-consent</td>
                  <td className="border border-gray-200 px-3 py-2">Remembers your cookie consent preference</td>
                  <td className="border border-gray-200 px-3 py-2">Persistent (localStorage)</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-mono text-xs">admin_token</td>
                  <td className="border border-gray-200 px-3 py-2">Authentication for admin users (JWT)</td>
                  <td className="border border-gray-200 px-3 py-2">24 hours</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-mono text-xs">lang</td>
                  <td className="border border-gray-200 px-3 py-2">Stores your language preference</td>
                  <td className="border border-gray-200 px-3 py-2">Persistent (localStorage)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-bold text-[#1A1A2E] mt-4 mb-2">Analytics Cookies</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left">Cookie</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">Purpose</th>
                  <th className="border border-gray-200 px-3 py-2 text-left">Provider</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 font-mono text-xs">_ga, _ga_*</td>
                  <td className="border border-gray-200 px-3 py-2">Track website usage and visitor behavior</td>
                  <td className="border border-gray-200 px-3 py-2">Google Analytics</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-bold text-[#1A1A2E] mt-4 mb-2">Third-Party Cookies</h3>
          <p>
            When you click on affiliate links (StubHub, Booking.com, GetYourGuide), those websites may set their own cookies. We do not control these cookies. Please refer to each provider&apos;s cookie policy for details.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">3. Managing Cookies</h2>
          <p>You can manage cookies in several ways:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Cookie Banner:</strong> Use the cookie banner at the bottom of the page to accept or decline cookies on your first visit.</li>
            <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies through their settings. Note that blocking essential cookies may affect the functionality of the Website.</li>
            <li><strong>Google Analytics Opt-Out:</strong> You can install the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-[#004D98] underline">Google Analytics Opt-out Browser Add-on</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">4. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">5. Contact</h2>
          <p>For questions about our use of cookies, please contact us:</p>
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
