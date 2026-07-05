import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, ilike, desc, asc, and, count, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import {
  ListProductsQueryParams,
  GetProductParams,
  AdminListProductsQueryParams,
  AdminGetProductParams,
  AdminUpdateProductParams,
  AdminDeleteProductParams,
  AdminCreateProductBody,
  AdminUpdateProductBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatProduct(p: any, categoryName?: string | null) {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    categoryId: p.categoryId ?? null,
    categoryName: categoryName ?? null,
    price: parseFloat(p.price),
    salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
    stock: p.stock,
    sizes: typeof p.sizes === "string" ? JSON.parse(p.sizes || "[]") : (p.sizes ?? []),
    colors: typeof p.colors === "string" ? JSON.parse(p.colors || "[]") : (p.colors ?? []),
    images: typeof p.images === "string" ? JSON.parse(p.images || "[]") : (p.images ?? []),
    featured: p.featured,
    createdAt: p.createdAt,
  };
}

async function enrichProducts(products: any[]) {
  const categoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))];
  let catMap = new Map<number, string>();
  if (categoryIds.length > 0) {
    const cats = await db.select().from(categoriesTable);
    cats.forEach((c) => catMap.set(c.id, c.name));
  }
  return products.map((p) => formatProduct(p, catMap.get(p.categoryId) ?? null));
}

// GET /products (public)
router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { categoryId, search, sort, featured, page = 1, limit = 24 } = parsed.data;

  const conditions: any[] = [];
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (featured !== undefined) conditions.push(eq(productsTable.featured, featured));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy =
    sort === "price_asc"
      ? asc(sql`CAST(${productsTable.price} AS numeric)`)
      : sort === "price_desc"
      ? desc(sql`CAST(${productsTable.price} AS numeric)`)
      : desc(productsTable.createdAt);

  const offset = (page - 1) * limit;

  const [products, [{ total }]] = await Promise.all([
    db
      .select()
      .from(productsTable)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count(productsTable.id) })
      .from(productsTable)
      .where(whereClause),
  ]);

  const enriched = await enrichProducts(products);

  res.json({
    products: enriched,
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  });
});

// GET /products/:id (public)
router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [enriched] = await enrichProducts([product]);
  res.json(enriched);
});

// GET /admin/products
router.get("/admin/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { categoryId, search, page = 1, limit = 20 } = parsed.data;

  const conditions: any[] = [];
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * limit;

  const [products, [{ total }]] = await Promise.all([
    db
      .select()
      .from(productsTable)
      .where(whereClause)
      .orderBy(desc(productsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count(productsTable.id) })
      .from(productsTable)
      .where(whereClause),
  ]);

  const enriched = await enrichProducts(products);

  res.json({
    products: enriched,
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  });
});

// GET /admin/products/:id
router.get("/admin/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminGetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [enriched] = await enrichProducts([product]);
  res.json(enriched);
});

// POST /admin/products
router.post("/admin/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminCreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const [product] = await db
    .insert(productsTable)
    .values({
      name: data.name,
      description: data.description ?? null,
      categoryId: data.categoryId ?? null,
      price: data.price.toString(),
      salePrice: data.salePrice?.toString() ?? null,
      stock: data.stock,
      sizes: JSON.stringify(data.sizes),
      colors: JSON.stringify(data.colors),
      images: JSON.stringify(data.images),
      featured: data.featured ?? false,
    })
    .returning();

  const [enriched] = await enrichProducts([product]);
  res.status(201).json(enriched);
});

// PUT /admin/products/:id
router.put("/admin/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = AdminUpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.price !== undefined) updateData.price = data.price.toString();
  if (data.salePrice !== undefined) updateData.salePrice = data.salePrice?.toString() ?? null;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.sizes !== undefined) updateData.sizes = JSON.stringify(data.sizes);
  if (data.colors !== undefined) updateData.colors = JSON.stringify(data.colors);
  if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
  if (data.featured !== undefined) updateData.featured = data.featured;

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [enriched] = await enrichProducts([product]);
  res.json(enriched);
});

// DELETE /admin/products/:id
router.delete("/admin/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminDeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
