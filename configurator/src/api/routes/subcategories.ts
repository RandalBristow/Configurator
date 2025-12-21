import { Router } from "express";
import { subcategoriesService } from "../../services";
import { validate } from "../middleware/validate";
import {
  subcategoryCreate,
  subcategoryIdParams,
  subcategoryQuery,
  subcategoryUpdate,
} from "../validators/subcategories";

export const subcategoriesRouter = Router();

const asBool = (val: unknown) => val === true || val === "true";

subcategoriesRouter.get(
  "/",
  validate({ query: subcategoryQuery }),
  async (req, res, next) => {
  try {
    const includeInactive = asBool(req.query.includeInactive);
    const categoryId = req.query.categoryId as string | undefined;
    const args: { categoryId?: string; includeInactive?: boolean } = {};
    if (categoryId) args.categoryId = categoryId;
    if (includeInactive !== undefined) args.includeInactive = includeInactive;
    const subcategories = await subcategoriesService.list(args);
    res.json(subcategories);
  } catch (err) {
    next(err);
  }
  },
);

subcategoriesRouter.get(
  "/:id",
  validate({ params: subcategoryIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const subcategory = await subcategoriesService.get(id);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }
    res.json(subcategory);
  } catch (err) {
    next(err);
  }
  },
);

subcategoriesRouter.get(
  "/:id/delete-summary",
  validate({ params: subcategoryIdParams }),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const summary = await subcategoriesService.deleteSummary(id);
      if (!summary) return res.status(404).json({ message: "Subcategory not found" });
      res.json(summary);
    } catch (err) {
      next(err);
    }
  },
);

subcategoriesRouter.post(
  "/",
  validate({ body: subcategoryCreate }),
  async (req, res, next) => {
  try {
    const subcategory = await subcategoriesService.create(req.body);
    res.status(201).json(subcategory);
  } catch (err) {
    next(err);
  }
  },
);

subcategoriesRouter.put(
  "/:id",
  validate({ params: subcategoryIdParams, body: subcategoryUpdate }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const subcategory = await subcategoriesService.update(id, req.body);
    res.json(subcategory);
  } catch (err) {
    next(err);
  }
  },
);

subcategoriesRouter.delete(
  "/:id",
  validate({ params: subcategoryIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const subcategory = await subcategoriesService.deleteDeep(id);
    res.json(subcategory);
  } catch (err) {
    next(err);
  }
  },
);

subcategoriesRouter.post(
  "/:id/activate",
  validate({ params: subcategoryIdParams }),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const subcategory = await subcategoriesService.activate(id);
      res.json(subcategory);
    } catch (err) {
      next(err);
    }
  },
);
