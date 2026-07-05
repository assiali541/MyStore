import bcrypt from "bcryptjs";
import { db, adminsTable, categoriesTable, productsTable, couponsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  const [existingAdmin] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.username, "admin"))
    .limit(1);

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.insert(adminsTable).values({ username: "admin", passwordHash });
    console.log("Created admin user (admin / admin123)");
  } else {
    console.log("Admin user already exists, skipping");
  }

  const categoryNames = ["Dresses", "Outerwear", "Suits", "Accessories", "Footwear"];
  const categoryIds: Record<string, number> = {};

  for (const name of categoryNames) {
    const [existing] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.name, name))
      .limit(1);

    if (existing) {
      categoryIds[name] = existing.id;
      continue;
    }
    const [created] = await db
      .insert(categoriesTable)
      .values({ name })
      .returning();
    categoryIds[name] = created!.id;
  }
  console.log("Categories ready:", Object.keys(categoryIds));

  const [existingProducts] = await db.select().from(productsTable).limit(1);
  if (!existingProducts) {
    const products = [
      { name: "Silk Wrap Evening Dress", categoryId: categoryIds["Dresses"], price: "489.00", featured: true },
      { name: "Emerald Satin Gown", categoryId: categoryIds["Dresses"], price: "620.00", featured: false },
      { name: "Cashmere Trench Coat", categoryId: categoryIds["Outerwear"], price: "790.00", featured: true },
      { name: "Wool Overcoat", categoryId: categoryIds["Outerwear"], price: "540.00", featured: false },
      { name: "Tailored Wool Suit", categoryId: categoryIds["Suits"], price: "950.00", featured: true },
      { name: "Linen Summer Suit", categoryId: categoryIds["Suits"], price: "670.00", featured: false },
      { name: "Italian Leather Belt", categoryId: categoryIds["Accessories"], price: "120.00", featured: false },
      { name: "Silk Twill Scarf", categoryId: categoryIds["Accessories"], price: "95.00", featured: true },
      { name: "Handcrafted Leather Oxfords", categoryId: categoryIds["Footwear"], price: "410.00", featured: true },
      { name: "Suede Chelsea Boots", categoryId: categoryIds["Footwear"], price: "380.00", featured: false },
    ];

    for (const p of products) {
      await db.insert(productsTable).values({
        name: p.name,
        description: `${p.name} — crafted with meticulous attention to detail for the modern wardrobe.`,
        categoryId: p.categoryId,
        price: p.price,
        stock: 25,
        sizes: JSON.stringify(["XS", "S", "M", "L", "XL"]),
        colors: JSON.stringify(["Black", "Beige", "Navy"]),
        images: JSON.stringify([]),
        featured: p.featured,
      });
    }
    console.log("Seeded 10 products");
  } else {
    console.log("Products already exist, skipping");
  }

  const [existingCoupon] = await db
    .select()
    .from(couponsTable)
    .where(eq(couponsTable.code, "LUXE20"))
    .limit(1);

  if (!existingCoupon) {
    await db.insert(couponsTable).values({
      code: "LUXE20",
      discountType: "percentage",
      discountValue: "20",
      active: true,
    });
    console.log("Created coupon LUXE20");
  } else {
    console.log("Coupon already exists, skipping");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
