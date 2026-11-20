import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { brands, categories, models } from "../../db/schema.js";

export const categoriesRepository = {
  async findCategoryById(id: string) {
    return db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
  },

  async findCategoryBySlug(slug: string) {
    return db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
  },

  async findBrandById(id: string) {
    return db.query.brands.findFirst({
      where: eq(brands.id, id),
    });
  },

  async findBrandBySlug(slug: string) {
    return db.query.brands.findFirst({
      where: eq(brands.slug, slug),
    });
  },

  async findModelById(id: string) {
    return db.query.models.findFirst({
      where: eq(models.id, id),
    });
  },

  async findModelBySlug(slug: string) {
    return db.query.models.findFirst({
      where: eq(models.slug, slug),
    });
  },

  async listCategories() {
    return db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
  },

  async listRootCategories() {
    return db.query.categories.findMany({
      where: eq(categories.parentId, null as unknown as string),
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
  },

  async listSubcategories(parentId: string) {
    return db.query.categories.findMany({
      where: eq(categories.parentId, parentId),
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
  },

  async listBrandsByCategory(categoryId: string) {
    return db.query.brands.findMany({
      where: eq(brands.categoryId, categoryId),
      orderBy: (brands, { asc }) => [asc(brands.name)],
    });
  },

  async listModelsByBrand(brandId: string) {
    return db.query.models.findMany({
      where: eq(models.brandId, brandId),
      orderBy: (models, { asc }) => [asc(models.name)],
    });
  },

  async getCategoryWithBrands(categoryId: string) {
    return db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
      with: {
        brands: true,
      },
    });
  },

  async getBrandWithModels(brandId: string) {
    return db.query.brands.findFirst({
      where: eq(brands.id, brandId),
      with: {
        models: true,
      },
    });
  },

  async createCategory(data: { name: string; slug: string; parentId?: string }) {
    const [category] = await db
      .insert(categories)
      .values(data)
      .returning();
    return category;
  },

  async updateCategory(
    id: string,
    data: { name?: string; slug?: string; isActive?: string }
  ) {
    const [category] = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return category;
  },

  async createBrand(data: {
    name: string;
    slug: string;
    categoryId: string;
    logoUrl?: string;
  }) {
    const [brand] = await db.insert(brands).values(data).returning();
    return brand;
  },

  async updateBrand(
    id: string,
    data: { name?: string; slug?: string; logoUrl?: string; isActive?: string }
  ) {
    const [brand] = await db
      .update(brands)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();
    return brand;
  },

  async createModel(data: { name: string; slug: string; brandId: string }) {
    const [model] = await db.insert(models).values(data).returning();
    return model;
  },

  async updateModel(
    id: string,
    data: { name?: string; slug?: string; isActive?: string }
  ) {
    const [model] = await db
      .update(models)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(models.id, id))
      .returning();
    return model;
  },
};
