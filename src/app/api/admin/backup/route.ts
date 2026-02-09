import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync, unlinkSync } from "fs";
import path from "path";

const BACKUP_DIR = "/var/www/friendsofbarca/backups";

function getDbPassword(): string {
  // Extract password from DATABASE_URL
  const url = process.env.DATABASE_URL || "";
  const match = url.match(/:\/\/[^:]+:([^@]+)@/);
  return match?.[1] || "";
}

function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
}

// GET - List all backups
export async function GET(request: NextRequest) {
  try {
    const isAdmin = request.cookies.get("admin_token")?.value;
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const filename = searchParams.get("filename");

    // Download a specific backup
    if (action === "download" && filename) {
      const safeName = path.basename(filename);
      const filepath = path.join(BACKUP_DIR, safeName);
      if (!existsSync(filepath)) {
        return NextResponse.json({ error: "Backup not found" }, { status: 404 });
      }
      const fileBuffer = readFileSync(filepath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/sql",
          "Content-Disposition": `attachment; filename="${safeName}"`,
          "Content-Length": String(fileBuffer.length),
        },
      });
    }

    // List all backups
    ensureBackupDir();
    const files = readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith(".sql"))
      .map(f => {
        const stats = statSync(path.join(BACKUP_DIR, f));
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ backups: files });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST - Create backup or restore
export async function POST(request: NextRequest) {
  try {
    const isAdmin = request.cookies.get("admin_token")?.value;
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = request.headers.get("content-type") || "";

    // Check if this is a restore from upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const action = formData.get("action") as string;

      if (action === "restore") {
        const file = formData.get("file") as File | null;
        const filename = formData.get("filename") as string | null;

        let sqlContent: string;

        if (file && file.size > 0) {
          // Restore from uploaded file
          sqlContent = await file.text();
        } else if (filename) {
          // Restore from existing backup
          const safeName = path.basename(filename);
          const filepath = path.join(BACKUP_DIR, safeName);
          if (!existsSync(filepath)) {
            return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
          }
          sqlContent = readFileSync(filepath, "utf-8");
        } else {
          return NextResponse.json({ error: "No file or filename provided" }, { status: 400 });
        }

        // Save SQL to temp file and restore
        const tempFile = path.join(BACKUP_DIR, `_restore_temp_${Date.now()}.sql`);
        writeFileSync(tempFile, sqlContent);

        try {
          // First create a pre-restore backup
          const preRestoreTimestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
          const preRestoreFilename = `friendsofbarca-pre-restore-${preRestoreTimestamp}.sql`;
          const preRestorePath = path.join(BACKUP_DIR, preRestoreFilename);
          execSync(
            `pg_dump -h localhost -U friendsofbarca -d friendsofbarca -F p -f "${preRestorePath}"`,
            { env: { ...process.env, PGPASSWORD: getDbPassword() }, timeout: 60000 }
          );

          // Restore the database
          execSync(
            `psql -h localhost -U friendsofbarca -d friendsofbarca -f "${tempFile}"`,
            { env: { ...process.env, PGPASSWORD: getDbPassword() }, timeout: 120000 }
          );

          return NextResponse.json({
            success: true,
            message: `Database restored successfully. Pre-restore backup saved as ${preRestoreFilename}`,
          });
        } finally {
          // Clean up temp file
          try { unlinkSync(tempFile); } catch {}
        }
      }
    }

    // Default: Create a new backup
    ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `friendsofbarca-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    execSync(
      `pg_dump -h localhost -U friendsofbarca -d friendsofbarca -F p -f "${filepath}"`,
      { env: { ...process.env, PGPASSWORD: getDbPassword() }, timeout: 60000 }
    );

    const stats = statSync(filepath);

    return NextResponse.json({
      success: true,
      filename,
      size: stats.size,
      createdAt: stats.mtime.toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Backup failed: ${msg}` }, { status: 500 });
  }
}

// DELETE - Delete a backup
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = request.cookies.get("admin_token")?.value;
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    if (!filename) return NextResponse.json({ error: "Filename required" }, { status: 400 });

    const safeName = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeName);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    unlinkSync(filepath);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
