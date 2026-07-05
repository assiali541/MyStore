import { Router, type IRouter } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, sql, count } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { AdminCreateCategoryBody, AdminUpdateCategoryBody, GetCategoryParams, AdminUpdateCategoryParams, AdminDeleteCategoryParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function getCategoryWithCount(id: number) {
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id)).limit(1);
  if (!cat) return null;
  const [{ cnt }] = await db
    .select({ cnt: count(productsTable.id) })
    .from(productsTable)
    .where(eq(productsTable.categoryId, id));
  return { ...cat, productCount: Number(cnt) };
}

async function getAllCategoriesWithCounts() {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  const counts = await db
    .select({ categoryId: productsTable.categoryId, cnt: count(productsTable.id) })
    .from(productsTable)
    .groupBy(productsTable.categoryId);

  const countMap = new Map(counts.map((c) => [c.categoryId, Number(c.cnt)]));
  return cats.map((c) => ({ ...c, productCount: countMap.get(c.id) ?? 0 }));
}

// GET /categories (public)
router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await getAllCategoriesWithCounts();
  res.json(cats.map((c) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.imageUrl ?? null,
    productCount: c.productCount,
  })));
});

// GET /categories/:id (public)
router.get("/categories/:id", async (req, res): Promise<void> => {
  const params = GetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const cat = await getCategoryWithCount(params.data.id);
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.categoryId, cat.id));

  res.json({
    id: cat.id,
    name: cat.name,
    imageUrl: cat.imageUrl ?? null,
    products: products.map(formatProduct),
  });
});

// GET /admin/categories
router.get("/admin/categories", requireAdmin, async (_req, res): Promise<void> => {
  const cats = await getAllCategoriesWithCounts();
  res.json(cats.map((c) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.imageUrl ?? null,
    productCount: c.productCount,
  })));
});

// POST /admin/categories
router.post("/admin/categories", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminCreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cat] = await db
    .insert(categoriesTable)
    .values({ name: parsed.data.name, imageUrl: parsed.data.imageUrl ?? null })
    .returning();

  res.status(201).json({ id: cat.id, name: cat.name, imageUrl: cat.imageUrl ?? null, productCount: 0 });
});

// PUT /admin/categories/:id
router.put("/admin/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = AdminUpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;

  const [cat] = await db
    .update(categoriesTable)
    .set(updateData)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const [{ cnt }] = await db
    .select({ cnt: count(productsTable.id) })
    .from(productsTable)
    .where(eq(productsTable.categoryId, cat.id));

  res.json({ id: cat.id, name: cat.name, imageUrl: cat.imageUrl ?? null, productCount: Number(cnt) });
});

// DELETE /admin/categories/:id
router.delete("/admin/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminDeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(categoriesTable)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.sendStatus(204);
});

function formatProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    categoryId: p.categoryId ?? null,
    categoryName: null,
    price: parseFloat(p.price),
    salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
    stock: p.stock,
    sizes: JSON.parse(p.sizes || "[]"),
    colors: JSON.parse(p.colors || "[]"),
    images: JSON.parse(p.images || "[]"),
    featured: p.featured,
    createdAt: p.createdAt,
  };
}

export default router;
