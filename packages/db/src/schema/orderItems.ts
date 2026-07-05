import { mysqlTable, int, text, decimal } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";
import { productsTable } from "./products";

export const orderItemsTable = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: int("product_id").notNull().references(() => productsTable.id, { onDelete: "restrict" }),
  productName: text("product_name").notNull(),
  productImage: text("product_image"),
  size: text("size"),
  color: text("color"),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;
