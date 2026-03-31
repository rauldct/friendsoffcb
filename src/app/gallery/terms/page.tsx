import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery Terms of Use | Friends of Barca",
  description: "Terms of use for the Friends of Barca fan photo gallery. Learn about photo licensing, usage rights, and community guidelines.",
  robots: "noindex",
};

export default function GalleryTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/gallery" className="text-sm text-[#004D98] hover:underline">
          &larr; Back to Gallery
        </Link>
      </div>

      <h1 className="font-heading text-3xl font-bold text-[#1A1A2E] mb-8">
        Gallery Terms of Use
      </h1>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        <p className="text-base text-gray-600">
          Last updated: February 9, 2026
        </p>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>
            By uploading photos to the Friends of Barca Fan Gallery (&quot;Gallery&quot;), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not upload any content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">2. License Grant</h2>
          <p>
            By uploading a photo to the Gallery, you grant DCT Business Corp Inc. (&quot;we&quot;, &quot;us&quot;, &quot;Friends of Barca&quot;) a <strong>non-exclusive, worldwide, royalty-free, perpetual, irrevocable license</strong> to:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Display the photo on the friendsofbarca.com website and any related subdomains</li>
            <li>Include the photo in email newsletters sent to our subscribers</li>
            <li>Share the photo on our official social media accounts (Instagram, Twitter/X, Facebook, etc.)</li>
            <li>Use the photo in promotional materials related to Friends of Barca</li>
            <li>Resize, crop, or apply filters to the photo for formatting purposes</li>
            <li>Create thumbnails and optimized versions of the photo</li>
          </ul>
          <p className="mt-3">
            You retain full ownership of your original photo. This license does not transfer copyright or ownership to us. You may continue to use, license, or sell your photo as you see fit.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">3. Your Representations</h2>
          <p>By uploading a photo, you represent and warrant that:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>You are the original creator of the photo or have obtained all necessary rights and permissions to upload and license it</li>
            <li>The photo does not infringe upon any third party&apos;s intellectual property rights, privacy rights, or any other rights</li>
            <li>Any identifiable persons in the photo have given their consent to be photographed and for the photo to be shared publicly</li>
            <li>The photo does not contain illegal, defamatory, obscene, or offensive content</li>
            <li>The photo is related to FC Barcelona, football, or the fan experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">4. Content Moderation</h2>
          <p>
            All uploaded photos are subject to moderation before appearing in the Gallery. We use a combination of AI-powered moderation and human review to ensure content quality and appropriateness. We reserve the right to:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Reject or remove any photo at our sole discretion, without prior notice</li>
            <li>Remove photos that receive multiple community reports</li>
            <li>Suspend or ban users who repeatedly violate these terms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">5. Community Reporting</h2>
          <p>
            Users may report photos they believe violate these terms or community standards. Photos that accumulate a significant number of reports may be automatically hidden pending review. False or abusive reporting is prohibited.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">6. Photo Removal Requests</h2>
          <p>
            If you have uploaded a photo and wish to have it removed, or if you appear in a photo and want it taken down, please contact us at{" "}
            <a href="mailto:info@friendsofbarca.com" className="text-[#004D98] hover:underline">info@friendsofbarca.com</a>{" "}
            with the photo details and reason for removal. We will process removal requests within 72 hours.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">7. Data Collection</h2>
          <p>
            When you upload a photo, we collect the following information:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Your name and email address (for attribution and contact purposes)</li>
            <li>Photo metadata (EXIF data including date taken and location, if available)</li>
            <li>Your IP address (for abuse prevention)</li>
          </ul>
          <p className="mt-2">
            This data is processed in accordance with our{" "}
            <Link href="/privacy" className="text-[#004D98] hover:underline">Privacy Policy</Link>.
            EXIF location data may be displayed publicly alongside the photo. If you do not wish to share location data, please strip EXIF data from your photo before uploading.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">8. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless DCT Business Corp Inc., its officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, costs, or expenses (including reasonable attorneys&apos; fees) arising out of or related to your uploaded content or violation of these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">9. Limitation of Liability</h2>
          <p>
            We are not responsible for any loss, damage, or unauthorized use of photos uploaded to the Gallery by third parties. While we take reasonable measures to protect uploaded content, we cannot guarantee the security of any data transmitted over the internet.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">10. Disclaimer</h2>
          <p>
            Friends of Barca is an independent fan website and is not affiliated with, endorsed by, or connected to FC Barcelona, Nike, Spotify, or any of their subsidiaries or affiliates. All trademarks, logos, and brand names are the property of their respective owners.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">11. Changes to These Terms</h2>
          <p>
            We reserve the right to modify these Terms of Use at any time. Changes will be effective immediately upon posting to this page. Continued use of the Gallery after changes are posted constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">12. Contact</h2>
          <p>
            For questions about these terms, photo removal requests, or DMCA takedown notices, please contact:
          </p>
          <p className="mt-2">
            <strong>DCT Business Corp Inc.</strong><br />
            1395 Brickell Ave, Suite 800<br />
            Miami, FL 33131<br />
            Email: <a href="mailto:info@friendsofbarca.com" className="text-[#004D98] hover:underline">info@friendsofbarca.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mt-8 mb-3">13. Governing Law</h2>
          <p>
            These Terms of Use shall be governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions.
          </p>
        </section>
      </div>

      <div className="mt-12 border-t border-gray-200 pt-6">
        <Link href="/gallery/upload" className="inline-flex items-center gap-2 rounded-lg bg-[#A50044] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#8a003a]">
          Upload a Photo
        </Link>
      </div>
    </div>
  );
}
