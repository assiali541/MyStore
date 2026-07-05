import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { AdminUpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const [existing] = await db.select().from(settingsTable).limit(1);
  if (existing) return existing;
  const [{ id: insertId }] = await db.insert(settingsTable).values({}).$returningId();
  const [created] = await db.select().from(settingsTable).where(eq(settingsTable.id, insertId)).limit(1);
  return created!;
}

function formatSettings(s: typeof settingsTable.$inferSelect) {
  return {
    id: s.id,
    storeName: s.storeName,
    logoUrl: s.logoUrl ?? null,
    email: s.email ?? null,
    whatsapp: s.whatsapp ?? null,
    instagramUrl: s.instagramUrl ?? null,
    address: s.address ?? null,
    deliveryFee: parseFloat(s.deliveryFee as string),
    freeDeliveryThreshold: s.freeDeliveryThreshold ? parseFloat(s.freeDeliveryThreshold as string) : null,
    heroImageUrl: s.heroImageUrl ?? null,
    aboutText: s.aboutText ?? null,
  };
}

// GET /settings (public)
router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(formatSettings(settings));
});

// GET /admin/settings
router.get("/admin/settings", requireAdmin, async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(formatSettings(settings));
});

// PUT /admin/settings
router.put("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminUpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const current = await getOrCreateSettings();
  const data = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (data.storeName !== undefined) updateData.storeName = data.storeName;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
  if (data.instagramUrl !== undefined) updateData.instagramUrl = data.instagramUrl;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.deliveryFee !== undefined) updateData.deliveryFee = data.deliveryFee.toString();
  if (data.freeDeliveryThreshold !== undefined) updateData.freeDeliveryThreshold = data.freeDeliveryThreshold?.toString() ?? null;
  if (data.heroImageUrl !== undefined) updateData.heroImageUrl = data.heroImageUrl;
  if (data.aboutText !== undefined) updateData.aboutText = data.aboutText;

  await db
    .update(settingsTable)
    .set(updateData)
    .where(eq(settingsTable.id, current.id));

  const [updated] = await db.select().from(settingsTable).where(eq(settingsTable.id, current.id)).limit(1);

  res.json(formatSettings(updated ?? current));
});

export default router;
