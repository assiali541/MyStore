import { pgTable, serial, text, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("Maison Luxe"),
  logoUrl: text("logo_url"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  instagramUrl: text("instagram_url"),
  address: text("address"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("9.99"),
  freeDeliveryThreshold: numeric("free_delivery_threshold", { precision: 10, scale: 2 }),
  heroImageUrl: text("hero_image_url"),
  aboutText: text("about_text"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
