import prisma from "@/lib/prisma";
import Link from "next/link";
import ApiKeyForm from "./ApiKeyForm";
import SettingForm from "./SettingForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [matchCount, packageCount, postCount, leadCount, subscriberCount, photoCount] =
    await Promise.all([
      prisma.match.count(),
      prisma.matchPackage.count(),
      prisma.blogPost.count(),
      prisma.lead.count(),
      prisma.subscriber.count(),
      prisma.photo.count(),
    ]);

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const dbSetting = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
  const currentKey = dbSetting?.value || anthropicKey || "";
  const maskedKey = currentKey
    ? currentKey.slice(0, 12) + "..." + currentKey.slice(-4)
    : "Not configured";

  const resendDbSetting = await prisma.setting.findUnique({ where: { key: "RESEND_API_KEY" } });
  const currentResendKey = resendDbSetting?.value || process.env.RESEND_API_KEY || "";
  const maskedResendKey = currentResendKey
    ? currentResendKey.slice(0, 8) + "..." + currentResendKey.slice(-4)
    : "Not configured";

  const gaDbSetting = await prisma.setting.findUnique({ where: { key: "GA_MEASUREMENT_ID" } });
  const currentGaId = gaDbSetting?.value || process.env.GA_MEASUREMENT_ID || "";
  const maskedGaId = currentGaId || "Not configured";

  const footballDbSetting = await prisma.setting.findUnique({ where: { key: "API_FOOTBALL_KEY" } });
  const currentFootballKey = footballDbSetting?.value || process.env.API_FOOTBALL_KEY || "";
  const maskedFootballKey = currentFootballKey
    ? currentFootballKey.slice(0, 8) + "..." + currentFootballKey.slice(-4)
    : "Not configured";

  const envVars = [
    { key: "NEXT_PUBLIC_SITE_URL", value: process.env.NEXT_PUBLIC_SITE_URL || "Not set", sensitive: false },
    { key: "DATABASE_URL", value: process.env.DATABASE_URL ? "●●●●●●●● (configured)" : "Not set", sensitive: true },
    { key: "NODE_ENV", value: process.env.NODE_ENV || "Not set", sensitive: false },
  ];

  const affiliateLinks = [
    { name: "StubHub", description: "Ticket affiliate links", status: "active", url: "stubhub.com" },
    { name: "Booking.com", description: "Hotel affiliate links", status: "active", url: "booking.com" },
    { name: "GetYourGuide", description: "Activity affiliate links", status: "active", url: "getyourguide.com" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Settings & Configuration</h1>

      {/* API Keys */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">API Keys</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">ANTHROPIC_API_KEY</span>
                <p className="text-xs text-gray-500 mt-0.5">Used for AI photo moderation and competition predictions</p>
              </div>
              <span className="text-xs font-mono text-gray-400">{maskedKey}</span>
            </div>
            <ApiKeyForm />
          </div>
          <hr className="border-gray-100" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">API_FOOTBALL_KEY</span>
                <p className="text-xs text-gray-500 mt-0.5">For competition standings &amp; match data. Get yours at <a href="https://dashboard.api-football.com/" target="_blank" rel="noopener noreferrer" className="text-[#004D98] hover:underline">api-sports.io</a></p>
              </div>
              <span className="text-xs font-mono text-gray-400">{maskedFootballKey}</span>
            </div>
            <SettingForm
              settingKey="API_FOOTBALL_KEY"
              placeholder="Your API-Football key from api-sports.io"
              successMessage="API-Football key saved."
            />
          </div>
          <hr className="border-gray-100" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">RESEND_API_KEY</span>
                <p className="text-xs text-gray-500 mt-0.5">For sending newsletters. Get yours at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-[#004D98] hover:underline">resend.com</a> (free: 3000/month)</p>
              </div>
              <span className="text-xs font-mono text-gray-400">{maskedResendKey}</span>
            </div>
            <SettingForm
              settingKey="RESEND_API_KEY"
              placeholder="re_xxxxxxxxxxxxxxxxxxxx"
              successMessage="Resend API key saved."
            />
          </div>
        </div>
      </div>

      {/* Google Analytics */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">Google Analytics</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">GA_MEASUREMENT_ID</span>
                <p className="text-xs text-gray-500 mt-0.5">Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX)</p>
              </div>
              <span className="text-xs font-mono text-gray-400">{maskedGaId}</span>
            </div>
            <SettingForm
              settingKey="GA_MEASUREMENT_ID"
              placeholder="G-XXXXXXXXXX"
              successMessage="Google Analytics ID saved. Reload the site to activate tracking."
            />
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">Environment Variables</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {envVars.map(env => (
            <div key={env.key} className="px-5 py-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">{env.key}</span>
              </div>
              <span className={`text-sm ${env.sensitive ? "text-gray-400" : "text-gray-600"}`}>{env.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Affiliate Partners */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">Affiliate Partners</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {affiliateLinks.map(partner => (
            <div key={partner.name} className="px-5 py-3 flex items-center justify-between">
              <div>
                <span className="font-medium text-sm text-[#1A1A2E]">{partner.name}</span>
                <p className="text-xs text-gray-500">{partner.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{partner.url}</span>
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-green-100 text-green-700">
                  {partner.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Stats */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">Database Overview</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Matches", count: matchCount },
              { label: "Packages", count: packageCount },
              { label: "Blog Posts", count: postCount },
              { label: "Leads", count: leadCount },
              { label: "Subscribers", count: subscriberCount },
              { label: "Photos", count: photoCount },
            ].map(item => (
              <div key={item.label} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-heading font-bold text-[#1A1A2E]">{item.count}</div>
                <div className="text-xs text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">Tech Stack</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { name: "Next.js", version: "14" },
              { name: "React", version: "18" },
              { name: "TypeScript", version: "5" },
              { name: "Tailwind CSS", version: "3" },
              { name: "Prisma", version: "5" },
              { name: "PostgreSQL", version: "16" },
              { name: "Node.js", version: "20" },
              { name: "PM2", version: "Latest" },
              { name: "Nginx", version: "Reverse Proxy" },
            ].map(tech => (
              <div key={tech.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium text-[#1A1A2E]">{tech.name}</span>
                <span className="text-gray-500">{tech.version}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading font-bold text-[#1A1A2E]">Quick Links</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors" target="_blank">
            <span className="text-lg">🌐</span>
            <div>
              <div className="text-sm font-medium text-[#1A1A2E]">View Site</div>
              <div className="text-xs text-gray-500">friendsofbarca.com</div>
            </div>
          </Link>
          <Link href="/sitemap.xml" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors" target="_blank">
            <span className="text-lg">🗺️</span>
            <div>
              <div className="text-sm font-medium text-[#1A1A2E]">Sitemap</div>
              <div className="text-xs text-gray-500">sitemap.xml</div>
            </div>
          </Link>
          <Link href="/robots.txt" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors" target="_blank">
            <span className="text-lg">🤖</span>
            <div>
              <div className="text-sm font-medium text-[#1A1A2E]">Robots.txt</div>
              <div className="text-xs text-gray-500">robots.txt</div>
            </div>
          </Link>
          <Link href="/api/leads" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors" target="_blank">
            <span className="text-lg">📡</span>
            <div>
              <div className="text-sm font-medium text-[#1A1A2E]">API: Leads</div>
              <div className="text-xs text-gray-500">/api/leads</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
