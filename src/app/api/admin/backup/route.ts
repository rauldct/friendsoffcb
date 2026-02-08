import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const isAdmin = request.cookies.get("admin_token")?.value;
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backupDir = "/var/www/friendsofbarca/backups";
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `friendsofbarca-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    // Run pg_dump
    execSync(
      `pg_dump -U friendsofbarca -d friendsofbarca -F p -f "${filepath}"`,
      { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || "" }, timeout: 60000 }
    );

    // Read the file
    const fileBuffer = readFileSync(filepath);

    // Clean up
    unlinkSync(filepath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Backup failed: ${msg}` }, { status: 500 });
  }
}
