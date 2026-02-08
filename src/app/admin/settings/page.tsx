import prisma from "@/lib/prisma";
import Link from "next/link";
import ApiKeyForm from "./ApiKeyForm";
import SettingForm from "./SettingForm";

export const dynamic = "force-dynamic";

async function getKeyStatus(key: string): Promise<{ configured: boolean; masked: string }> {
  const db = await prisma.setting.findUnique({ where: { key } });
  const value = db?.value || process.env[key] || "";
  if (!value) return { configured: false, masked: "" };
  if (key === "GA_MEASUREMENT_ID") return { configured: true, masked: value };
  return { configured: true, masked: value.slice(0, 8) + "..." + value.slice(-4) };
}

function StatusBadge({ configured, masked }: { configured: boolean; masked: string }) {
  if (configured) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-gray-400">{masked}</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 whitespace-nowrap">Active</span>
      </div>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600 whitespace-nowrap">Not configured</span>
  );
}

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

  const [anthropic, apiFootball, resend, footballData, perplexity, grok, brave, ga] =
    await Promise.all([
      getKeyStatus("ANTHROPIC_API_KEY"),
      getKeyStatus("API_FOOTBALL_KEY"),
      getKeyStatus("RESEND_API_KEY"),
      getKeyStatus("FOOTBALL_DATA_API_KEY"),
      getKeyStatus("PERPLEXITY_API_KEY"),
      getKeyStatus("GROK_API_KEY"),
      getKeyStatus("BRAVE_API_KEY"),
      getKeyStatus("GA_MEASUREMENT_ID"),
    ]);

  const totalKeys = 8;
  const configuredKeys = [anthropic, apiFootball, resend, footballData, perplexity, grok, brave, ga].filter(k => k.configured).length;

  const envVars = [
    { key: "NEXT_PUBLIC_SITE_URL", value: process.env.NEXT_PUBLIC_SITE_URL || "Not set", sensitive: false },
    { key: "DATABASE_URL", value: process.env.DATABASE_URL ? "configured" : "Not set", sensitive: true },
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
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-bold text-[#1A1A2E]">API Keys</h2>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${configuredKeys === totalKeys ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {configuredKeys}/{totalKeys} configured
          </span>
        </div>
        <div className="p-5 space-y-4">
          {/* ANTHROPIC */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">ANTHROPIC_API_KEY</span>
                <p className="text-xs text-gray-500 mt-0.5">Used for AI photo moderation, competition predictions, and peña enrichment</p>
              </div>
              <StatusBadge {...anthropic} />
            </div>
            <ApiKeyForm />
          </div>

          <hr className="border-gray-100" />

          {/* FOOTBALL_DATA */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">FOOTBALL_DATA_API_KEY</span>
                <p className="text-xs text-gray-500 mt-0.5">Current season standings (La Liga, CL). Get at <a href="https://www.football-data.org/client/register" target="_blank" rel="noopener noreferrer" className="text-[#004D98] hover:underline">football-data.org</a> (free forever)</p>
              </div>
              <StatusBadge {...footballData} />
            </div>
            <SettingForm settingKey="FOOTBALL_DATA_API_KEY" placeholder="Your football-data.org API key" successMessage="Football-Data API key saved." />
          </div>

          <hr className="border-gray-100" />

          {/* API_FOOTBALL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">API_FOOTBALL_KEY</span>
                <p className="text-xs text-gray-500 mt-0.5">Fallback for Copa del Rey data. Get at <a href="https://dashboard.api-football.com/" target="_blank" rel="noopener noreferrer" className="text-[#004D98] hover:underline">api-sports.io</a></p>
              </div>
              <StatusBadge {...apiFootball} />
            </div>
            <SettingForm settingKey="API_FOOTBALL_KEY" placeholder="Your API-Football key from api-sports.io" successMessage="API-Football key saved." />
          </div>

          <hr className="border-gray-100" />

          {/* RESEND */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">RESEND_API_KEY</span>
                <p className="text-xs text-gray-500 mt-0.5">For sending newsletters. Get at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-[#004D98] hover:underline">resend.com</a> (free: 3000/month)</p>
              </div>
              <StatusBadge {...resend} />
            </div>
            <SettingForm settingKey="RESEND_API_KEY" placeholder="re_xxxxxxxxxxxxxxxxxxxx" successMessage="Resend API key saved." />
          </div>

          <hr className="border-gray-100" />

          {/* Enrichment section header */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Peña Enrichment (optional - skipped if missing)</p>
          </div>

          {/* BRAVE_API_KEY */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">BRAVE_API_KEY</span>
                <p className="text-xs text-gray-500 mt-0.5">Brave Search API for web search. Get at <a href="https://brave.com/search/api/" target="_blank" rel="noopener noreferrer" className="text-[#004D98] hover:underline">brave.com/search/api</a> (free: 2000/month)</p>
              </div>
              <StatusBadge {...brave} />
            </div>
            <SettingForm settingKey="BRAVE_API_KEY" placeholder="BSA..." successMessage="Brave API key saved." />
          </div>

          <hr className="border-gray-100" />

          {/* PERPLEXITY */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">PERPLEXITY_API_KEY</span>
                <p className="text-xs text-gray-500 mt-0.5">Perplexity Sonar web search. Get at <a href="https://docs.perplexity.ai" target="_blank" rel="noopener noreferrer" className="text-[#004D98] hover:underline">perplexity.ai</a></p>
              </div>
              <StatusBadge {...perplexity} />
            </div>
            <SettingForm settingKey="PERPLEXITY_API_KEY" placeholder="pplx-xxxxxxxxxxxxxxxxxxxx" successMessage="Perplexity API key saved." />
          </div>

          <hr className="border-gray-100" />

          {/* GROK */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-mono text-sm font-medium text-[#1A1A2E]">GROK_API_KEY</span>
                <p className="text-xs text-gray-500 mt-0.5">Grok (xAI) web search. Get at <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="text-[#004D98] hover:underline">console.x.ai</a></p>
              </div>
              <StatusBadge {...grok} />
            </div>
            <SettingForm settingKey="GROK_API_KEY" placeholder="xai-xxxxxxxxxxxxxxxxxxxx" successMessage="Grok API key saved." />
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
              <StatusBadge {...ga} />
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
