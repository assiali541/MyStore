import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { eq, desc, count, sum, sql, inArray } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

// GET /admin/dashboard
router.get("/admin/dashboard", requireAdmin, async (_req, res): Promise<void> => {
  // Stats in parallel
  const [
    [{ totalOrders }],
    [{ totalRevenue }],
    [{ totalProducts }],
    statusCounts,
    recentOrdersRaw,
    topProductsRaw,
  ] = await Promise.all([
    db.select({ totalOrders: count(ordersTable.id) }).from(ordersTable),
    db.select({ totalRevenue: sum(sql`CAST(${ordersTable.total} AS numeric)`) }).from(ordersTable),
    db.select({ totalProducts: count(productsTable.id) }).from(productsTable),
    db
      .select({ status: ordersTable.status, cnt: count(ordersTable.id) })
      .from(ordersTable)
      .groupBy(ordersTable.status),
    db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(5),
    db
      .select({
        productId: orderItemsTable.productId,
        productName: orderItemsTable.productName,
        productImage: orderItemsTable.productImage,
        totalSold: sum(orderItemsTable.quantity),
        revenue: sum(sql`CAST(${orderItemsTable.totalPrice} AS numeric)`),
      })
      .from(orderItemsTable)
      .groupBy(orderItemsTable.productId, orderItemsTable.productName, orderItemsTable.productImage)
      .orderBy(desc(sum(orderItemsTable.quantity)))
      .limit(5),
  ]);

  const statusMap: Record<string, number> = {};
  statusCounts.forEach((s) => { statusMap[s.status] = Number(s.cnt); });

  // Fetch items for recent orders
  const recentOrderIds = recentOrdersRaw.map((o) => o.id);
  const recentItems =
    recentOrderIds.length > 0
      ? await db
          .select()
          .from(orderItemsTable)
          .where(inArray(orderItemsTable.orderId, recentOrderIds))
      : [];

  const itemsByOrder = new Map<number, any[]>();
  recentItems.forEach((item) => {
    if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
    itemsByOrder.get(item.orderId)!.push(item);
  });

  const recentOrders = recentOrdersRaw.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    phone: o.phone,
    address: o.address,
    city: o.city,
    notes: o.notes ?? null,
    subtotal: parseFloat(o.subtotal as string),
    deliveryFee: parseFloat(o.deliveryFee as string),
    discount: parseFloat(o.discount as string),
    total: parseFloat(o.total as string),
    status: o.status,
    couponCode: o.couponCode ?? null,
    items: (itemsByOrder.get(o.id) ?? []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage ?? null,
      size: item.size ?? null,
      color: item.color ?? null,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      totalPrice: parseFloat(item.totalPrice),
    })),
    createdAt: o.createdAt,
  }));

  res.json({
    totalOrders: Number(totalOrders),
    totalRevenue: totalRevenue ? parseFloat(totalRevenue as string) : 0,
    totalProducts: Number(totalProducts),
    pendingOrders: statusMap["processing"] ?? 0,
    processingOrders: statusMap["processing"] ?? 0,
    deliveredOrders: statusMap["delivered"] ?? 0,
    cancelledOrders: statusMap["cancelled"] ?? 0,
    recentOrders,
    topProducts: topProductsRaw.map((p) => ({
      productId: p.productId,
      productName: p.productName,
      productImage: p.productImage ?? null,
      totalSold: Number(p.totalSold ?? 0),
      revenue: p.revenue ? parseFloat(p.revenue as string) : 0,
    })),
  });
});

export default router;
