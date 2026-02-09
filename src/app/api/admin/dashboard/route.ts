import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import prisma from "@/lib/prisma";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
  // SSL certificate expiry
  let sslExpiry: string | null = null;
  let sslDaysLeft: number | null = null;
  try {
    const { stdout } = await execAsync(
      "echo | openssl s_client -connect friendsofbarca.com:443 -servername friendsofbarca.com 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null",
      { timeout: 10000 }
    );
    const match = stdout.match(/notAfter=(.+)/);
    if (match) {
      const expiryDate = new Date(match[1].trim());
      sslExpiry = expiryDate.toISOString();
      sslDaysLeft = Math.floor((expiryDate.getTime() - Date.now()) / 86400000);
    }
  } catch { /* ignore */ }

  // Page views counter
  let pageViews = 0;
  try {
    const setting = await prisma.setting.findUnique({ where: { key: "PAGE_VIEWS" } });
    pageViews = setting ? parseInt(setting.value, 10) || 0 : 0;
  } catch { /* ignore */ }

  return NextResponse.json({ sslExpiry, sslDaysLeft, pageViews });
}
