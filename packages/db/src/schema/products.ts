import { mysqlTable, int, text, decimal, boolean, timestamp } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: int("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  stock: int("stock").notNull().default(0),
  sizes: text("sizes").notNull().default("[]"),  // JSON array as text
  colors: text("colors").notNull().default("[]"), // JSON array as text
  images: text("images").notNull().default("[]"), // JSON array as text
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
