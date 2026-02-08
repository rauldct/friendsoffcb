import Script from "next/script";
import prisma from "@/lib/prisma";

export default async function GoogleAnalytics() {
  let gaId = process.env.GA_MEASUREMENT_ID || "";

  try {
    const dbSetting = await prisma.setting.findUnique({ where: { key: "GA_MEASUREMENT_ID" } });
    if (dbSetting?.value) gaId = dbSetting.value;
  } catch {
    // Fallback to env var
  }

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
