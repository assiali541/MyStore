import { Router, type IRouter } from "express";
import { db, couponsTable } from "@workspace/db";
import { eq, and, gte, or, isNull } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { ValidateCouponBody, AdminCreateCouponBody, AdminDeleteCouponParams } from "@workspace/api-zod";

const router: IRouter = Router();

function formatCoupon(c: any) {
  return {
    id: c.id,
    code: c.code,
    discountType: c.discountType,
    discountValue: parseFloat(c.discountValue),
    active: c.active,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  };
}

// POST /coupons/validate (public)
router.post("/coupons/validate", async (req, res): Promise<void> => {
  const parsed = ValidateCouponBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { code, subtotal } = parsed.data;
  const now = new Date();

  const [coupon] = await db
    .select()
    .from(couponsTable)
    .where(
      and(
        eq(couponsTable.code, code.toUpperCase()),
        eq(couponsTable.active, true),
        or(isNull(couponsTable.expiresAt), gte(couponsTable.expiresAt, now))
      )
    )
    .limit(1);

  if (!coupon) {
    res.status(400).json({ error: "Invalid or expired coupon code" });
    return;
  }

  const discountValue = parseFloat(coupon.discountValue as string);
  let discountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount = (subtotal * discountValue) / 100;
  } else {
    discountAmount = Math.min(discountValue, subtotal);
  }

  discountAmount = Math.round(discountAmount * 100) / 100;

  res.json({
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue,
    discountAmount,
  });
});

// GET /admin/coupons
router.get("/admin/coupons", requireAdmin, async (_req, res): Promise<void> => {
  const coupons = await db
    .select()
    .from(couponsTable)
    .orderBy(couponsTable.createdAt);
  res.json(coupons.map(formatCoupon));
});

// POST /admin/coupons
router.post("/admin/coupons", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminCreateCouponBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const [coupon] = await db
    .insert(couponsTable)
    .values({
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      discountValue: data.discountValue.toString(),
      active: data.active ?? true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    })
    .returning();

  res.status(201).json(formatCoupon(coupon));
});

// DELETE /admin/coupons/:id
router.delete("/admin/coupons/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminDeleteCouponParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(couponsTable)
    .where(eq(couponsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Coupon not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
