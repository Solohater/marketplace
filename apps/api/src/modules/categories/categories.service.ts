import { categoriesRepository } from "./categories.repository.js";

export const categoriesService = {
  async getCategories() {
    return categoriesRepository.listCategories();
  },

  async getRootCategories() {
    return categoriesRepository.listRootCategories();
  },

  async getSubcategories(parentId: string) {
    const parent = await categoriesRepository.findCategoryById(parentId);
    if (!parent) {
      throw new Error("Parent category not found");
    }
    return categoriesRepository.listSubcategories(parentId);
  },

  async getCategoryById(id: string) {
    const category = await categoriesRepository.findCategoryById(id);
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  },

  async getCategoryBySlug(slug: string) {
    const category = await categoriesRepository.findCategoryBySlug(slug);
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  },

  async getBrandsByCategory(categoryId: string) {
    const category = await categoriesRepository.findCategoryById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    return categoriesRepository.listBrandsByCategory(categoryId);
  },

  async getModelsByBrand(brandId: string) {
    const brand = await categoriesRepository.findBrandById(brandId);
    if (!brand) {
      throw new Error("Brand not found");
    }
    return categoriesRepository.listModelsByBrand(brandId);
  },

  async createCategory(data: { name: string; slug: string; parentId?: string }) {
    const existing = await categoriesRepository.findCategoryBySlug(data.slug);
    if (existing) {
      throw new Error("Category with this slug already exists");
    }
    if (data.parentId) {
      const parent = await categoriesRepository.findCategoryById(data.parentId);
      if (!parent) {
        throw new Error("Parent category not found");
      }
    }
    return categoriesRepository.createCategory(data);
  },

  async updateCategory(
    id: string,
    data: { name?: string; slug?: string; isActive?: string }
  ) {
    const category = await categoriesRepository.findCategoryById(id);
    if (!category) {
      throw new Error("Category not found");
    }
    if (data.slug && data.slug !== category.slug) {
      const existing = await categoriesRepository.findCategoryBySlug(data.slug);
      if (existing) {
        throw new Error("Category with this slug already exists");
      }
    }
    return categoriesRepository.updateCategory(id, data);
  },

  async createBrand(data: {
    name: string;
    slug: string;
    categoryId: string;
    logoUrl?: string;
  }) {
    const existing = await categoriesRepository.findBrandBySlug(data.slug);
    if (existing) {
      throw new Error("Brand with this slug already exists");
    }
    const category = await categoriesRepository.findCategoryById(data.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    return categoriesRepository.createBrand(data);
  },

  async updateBrand(
    id: string,
    data: { name?: string; slug?: string; logoUrl?: string; isActive?: string }
  ) {
    const brand = await categoriesRepository.findBrandById(id);
    if (!brand) {
      throw new Error("Brand not found");
    }
    if (data.slug && data.slug !== brand.slug) {
      const existing = await categoriesRepository.findBrandBySlug(data.slug);
      if (existing) {
        throw new Error("Brand with this slug already exists");
      }
    }
    return categoriesRepository.updateBrand(id, data);
  },

  async createModel(data: { name: string; slug: string; brandId: string }) {
    const existing = await categoriesRepository.findModelBySlug(data.slug);
    if (existing) {
      throw new Error("Model with this slug already exists");
    }
    const brand = await categoriesRepository.findBrandById(data.brandId);
    if (!brand) {
      throw new Error("Brand not found");
    }
    return categoriesRepository.createModel(data);
  },

  async updateModel(
    id: string,
    data: { name?: string; slug?: string; isActive?: string }
  ) {
    const model = await categoriesRepository.findModelById(id);
    if (!model) {
      throw new Error("Model not found");
    }
    if (data.slug && data.slug !== model.slug) {
      const existing = await categoriesRepository.findModelBySlug(data.slug);
      if (existing) {
        throw new Error("Model with this slug already exists");
      }
    }
    return categoriesRepository.updateModel(id, data);
  },
};
