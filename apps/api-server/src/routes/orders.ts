import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, productsTable, couponsTable, settingsTable } from "@workspace/db";
import { eq, ilike, or, and, desc, count, gte, isNull, inArray, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { generateOrderNumber } from "../lib/orderNumber";
import {
  CreateOrderBody,
  GetOrderByNumberParams,
  AdminListOrdersQueryParams,
  AdminGetOrderParams,
  AdminUpdateOrderStatusParams,
  AdminUpdateOrderStatusBody,
} from "@workspace/api-zod";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 checkout creations per hour
  message: { error: "Too many orders placed from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

function formatOrderItem(item: any) {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productImage: item.productImage ?? null,
    size: item.size ?? null,
    color: item.color ?? null,
    quantity: item.quantity,
    unitPrice: parseFloat(item.unitPrice),
    totalPrice: parseFloat(item.totalPrice),
  };
}

function formatOrder(order: any, items: any[]) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    city: order.city,
    notes: order.notes ?? null,
    subtotal: parseFloat(order.subtotal),
    deliveryFee: parseFloat(order.deliveryFee),
    discount: parseFloat(order.discount),
    total: parseFloat(order.total),
    status: order.status,
    couponCode: order.couponCode ?? null,
    items: items.map(formatOrderItem),
    createdAt: order.createdAt,
  };
}

// POST /orders (public - guest checkout, wrapped in a transaction)
router.post("/orders", orderLimiter, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  // Get settings for delivery fee (outside transaction, read-only)
  const [settings] = await db.select().from(settingsTable).limit(1);
  const configDeliveryFee = settings ? parseFloat(settings.deliveryFee as string) : 9.99;
  const freeThreshold = settings?.freeDeliveryThreshold
    ? parseFloat(settings.freeDeliveryThreshold as string)
    : null;

  let orderId!: number;

  try {
    await db.transaction(async (tx) => {
      // Lock + validate each product stock inside the transaction
      let subtotal = 0;
      const itemDetails: Array<{
        productId: number;
        productName: string;
        productImage: string | null;
        size: string | null;
        color: string | null;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }> = [];

      for (const item of data.items) {
        // SELECT FOR UPDATE to prevent concurrent oversell
        const rows = await tx.execute(
          sql`SELECT * FROM products WHERE id = ${item.productId} FOR UPDATE`
        );
        const product = (rows as any)[0]?.[0] ?? (rows as any[])[0];

        if (!product) {
          throw Object.assign(new Error(`Product ${item.productId} not found`), { statusCode: 400 });
        }
        if (product.stock < item.quantity) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { statusCode: 400 });
        }

        const unitPrice = product.sale_price
          ? parseFloat(product.sale_price)
          : parseFloat(product.price);
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        const images: string[] = (() => {
          try { return JSON.parse(product.images || "[]"); } catch { return []; }
        })();

        itemDetails.push({
          productId: product.id,
          productName: product.name,
          productImage: images[0] ?? null,
          size: item.size ?? null,
          color: item.color ?? null,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        });
      }

      // Coupon validation inside transaction
      let discount = 0;
      let couponId: number | null = null;
      let couponCode: string | null = null;

      if (data.couponCode) {
        const now = new Date();
        const [coupon] = await tx
          .select()
          .from(couponsTable)
          .where(
            and(
              eq(couponsTable.code, data.couponCode.toUpperCase()),
              eq(couponsTable.active, true),
              or(isNull(couponsTable.expiresAt), gte(couponsTable.expiresAt, now))
            )
          )
          .limit(1);

        if (!coupon) {
          throw Object.assign(new Error("Invalid or expired coupon code"), { statusCode: 400 });
        }

        const discountValue = parseFloat(coupon.discountValue as string);
        if (coupon.discountType === "percentage") {
          discount = (subtotal * discountValue) / 100;
        } else {
          discount = Math.min(discountValue, subtotal);
        }
        discount = Math.round(discount * 100) / 100;
        couponId = coupon.id;
        couponCode = coupon.code;
      }

      const deliveryFee =
        freeThreshold && subtotal - discount >= freeThreshold ? 0 : configDeliveryFee;
      const total = Math.max(0, subtotal - discount + deliveryFee);
      const orderNumber = generateOrderNumber();

      // Create order
      const [{ id: insertId }] = await tx
        .insert(ordersTable)
        .values({
          orderNumber,
          customerName: data.customerName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          notes: data.notes ?? null,
          subtotal: subtotal.toString(),
          deliveryFee: deliveryFee.toString(),
          discount: discount.toString(),
          total: total.toString(),
          status: "processing",
          couponId,
          couponCode,
        })
        .$returningId();

      orderId = insertId;

      // Create order items and atomically reduce stock
      for (const item of itemDetails) {
        await tx.insert(orderItemsTable).values({
          orderId,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
        });

        await tx.execute(
          sql`UPDATE products SET stock = GREATEST(0, stock - ${item.quantity}) WHERE id = ${item.productId}`
        );
      }
    });
  } catch (err: any) {
    const statusCode = err?.statusCode ?? 500;
    res.status(statusCode).json({ error: err.message ?? "Internal server error" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

  res.status(201).json(formatOrder(order, items));
});

// GET /orders/:orderNumber (public - confirmation page)
router.get("/orders/:orderNumber", async (req, res): Promise<void> => {
  const params = GetOrderByNumberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid order number" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, params.data.orderNumber))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  res.json(formatOrder(order, items));
});

// GET /admin/orders
router.get("/admin/orders", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, search, page = 1, limit = 20 } = parsed.data;

  const conditions: any[] = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(ordersTable.orderNumber, `%${search}%`),
        ilike(ordersTable.customerName, `%${search}%`),
        ilike(ordersTable.phone, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * limit;

  const [orders, [{ total }]] = await Promise.all([
    db
      .select()
      .from(ordersTable)
      .where(whereClause)
      .orderBy(desc(ordersTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count(ordersTable.id) })
      .from(ordersTable)
      .where(whereClause),
  ]);

  const orderIds = orders.map((o) => o.id);
  const allItems =
    orderIds.length > 0
      ? await db
          .select()
          .from(orderItemsTable)
          .where(inArray(orderItemsTable.orderId, orderIds))
      : [];

  const itemsByOrder = new Map<number, any[]>();
  allItems.forEach((item) => {
    if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
    itemsByOrder.get(item.orderId)!.push(item);
  });

  res.json({
    orders: orders.map((o) => formatOrder(o, itemsByOrder.get(o.id) ?? [])),
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  });
});

// GET /admin/orders/:id
router.get("/admin/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminGetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id))
    .limit(1);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  res.json(formatOrder(order, items));
});

// PATCH /admin/orders/:id/status
router.patch("/admin/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = AdminUpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Pre-check existence
  const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id));

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).limit(1);
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, params.data.id));

  res.json(formatOrder(order!, items));
});

export default router;
