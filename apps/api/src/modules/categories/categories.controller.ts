import type { RequestHandler } from "express";
import { sendSuccess } from "../../lib/http.js";
import { categoriesService } from "./categories.service.js";

export const categoriesController = {
  getCategories: (async (_req, res) => {
    const categories = await categoriesService.getCategories();
    sendSuccess(res, { categories });
  }) as RequestHandler,

  getRootCategories: (async (_req, res) => {
    const categories = await categoriesService.getRootCategories();
    sendSuccess(res, { categories });
  }) as RequestHandler,

  getSubcategories: (async (req, res) => {
    const categories = await categoriesService.getSubcategories(
      String(req.params.parentId)
    );
    sendSuccess(res, { categories });
  }) as RequestHandler,

  getCategoryById: (async (req, res) => {
    const category = await categoriesService.getCategoryById(
      String(req.params.id)
    );
    sendSuccess(res, { category });
  }) as RequestHandler,

  getCategoryBySlug: (async (req, res) => {
    const category = await categoriesService.getCategoryBySlug(
      String(req.params.slug)
    );
    sendSuccess(res, { category });
  }) as RequestHandler,

  getBrandsByCategory: (async (req, res) => {
    const brands = await categoriesService.getBrandsByCategory(
      String(req.params.categoryId)
    );
    sendSuccess(res, { brands });
  }) as RequestHandler,

  getModelsByBrand: (async (req, res) => {
    const models = await categoriesService.getModelsByBrand(
      String(req.params.brandId)
    );
    sendSuccess(res, { models });
  }) as RequestHandler,

  createCategory: (async (req, res) => {
    const category = await categoriesService.createCategory(req.body);
    sendSuccess(res, { category }, 201);
  }) as RequestHandler,

  updateCategory: (async (req, res) => {
    const category = await categoriesService.updateCategory(
      String(req.params.id),
      req.body
    );
    sendSuccess(res, { category });
  }) as RequestHandler,

  createBrand: (async (req, res) => {
    const brand = await categoriesService.createBrand(req.body);
    sendSuccess(res, { brand }, 201);
  }) as RequestHandler,

  updateBrand: (async (req, res) => {
    const brand = await categoriesService.updateBrand(
      String(req.params.id),
      req.body
    );
    sendSuccess(res, { brand });
  }) as RequestHandler,

  createModel: (async (req, res) => {
    const model = await categoriesService.createModel(req.body);
    sendSuccess(res, { model }, 201);
  }) as RequestHandler,

  updateModel: (async (req, res) => {
    const model = await categoriesService.updateModel(
      String(req.params.id),
      req.body
    );
    sendSuccess(res, { model });
  }) as RequestHandler,
};
