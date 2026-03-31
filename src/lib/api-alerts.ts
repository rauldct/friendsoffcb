import prisma from "@/lib/prisma";

const SETTING_KEY = "API_ALERTS";

export interface ApiAlert {
  service: string;
  message: string;
  code?: number;
  context?: string;
  timestamp: string;
}

async function readAlerts(): Promise<ApiAlert[]> {
  try {
    const s = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    if (s?.value) return JSON.parse(s.value);
  } catch {}
  return [];
}

async function writeAlerts(alerts: ApiAlert[]): Promise<void> {
  const value = JSON.stringify(alerts);
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value },
    create: { key: SETTING_KEY, value },
  });
}

/** Register an API error alert (replaces existing alert for the same service) */
export async function addApiAlert(
  service: string,
  message: string,
  code?: number,
  context?: string
): Promise<void> {
  try {
    const alerts = await readAlerts();
    const filtered = alerts.filter((a) => a.service !== service);
    filtered.push({
      service,
      message: message.slice(0, 300),
      code,
      context: context?.slice(0, 100),
      timestamp: new Date().toISOString(),
    });
    await writeAlerts(filtered);
  } catch (err) {
    console.error("[api-alerts] Failed to add alert:", err);
  }
}

/** Clear alerts for a service (call when the API works OK) */
export async function clearApiAlert(service: string): Promise<void> {
  try {
    const alerts = await readAlerts();
    const filtered = alerts.filter((a) => a.service !== service);
    if (filtered.length !== alerts.length) {
      await writeAlerts(filtered);
    }
  } catch (err) {
    console.error("[api-alerts] Failed to clear alert:", err);
  }
}

/** Get all active API alerts */
export async function getApiAlerts(): Promise<ApiAlert[]> {
  return readAlerts();
}
