import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

const ALLOWED_KEYS = ["ANTHROPIC_API_KEY", "GA_MEASUREMENT_ID", "API_FOOTBALL_KEY", "RESEND_API_KEY"];

export async function GET() {
  const settings = await prisma.setting.findMany();
  const result: Record<string, string> = {};
  for (const s of settings) {
    if (ALLOWED_KEYS.includes(s.key)) {
      // Mask the value for display
      result[s.key] = s.value.slice(0, 12) + "..." + s.value.slice(-4);
    }
  }

  // Also check env var if no DB setting
  for (const key of ALLOWED_KEYS) {
    if (!result[key] && process.env[key]) {
      const val = process.env[key]!;
      result[key] = val.slice(0, 12) + "..." + val.slice(-4);
    }
  }

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || !value || !ALLOWED_KEYS.includes(key)) {
      return NextResponse.json({ error: "Invalid key." }, { status: 400 });
    }

    // Save to DB
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // Also update .env file
    const envPath = path.join(process.cwd(), ".env");
    let envContent = await fs.readFile(envPath, "utf-8");

    const regex = new RegExp(`^${key}=.*$`, "m");
    const newLine = `${key}="${value}"`;

    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, newLine);
    } else {
      envContent = envContent.trimEnd() + "\n" + newLine + "\n";
    }

    await fs.writeFile(envPath, envContent);

    // Update process env for current runtime
    process.env[key] = value;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}
