import { mysqlTable, int, text, decimal, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  storeName: varchar("store_name", { length: 255 }).notNull().default("Urban District"),
  logoUrl: text("logo_url"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  instagramUrl: text("instagram_url"),
  address: text("address"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("9.99"),
  freeDeliveryThreshold: decimal("free_delivery_threshold", { precision: 10, scale: 2 }),
  heroImageUrl: text("hero_image_url"),
  aboutText: text("about_text"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
