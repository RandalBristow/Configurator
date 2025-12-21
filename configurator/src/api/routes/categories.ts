import { Router } from "express";
import { categoriesService } from "../../services";
import { validate } from "../middleware/validate";
import {
  categoryCreate,
  categoryIdParams,
  categoryQuery,
  categoryUpdate,
} from "../validators/categories";

export const categoriesRouter = Router();

const asBool = (val: unknown) => val === true || val === "true";

categoriesRouter.get("/", validate({ query: categoryQuery }), async (req, res, next) => {
  try {
    const includeInactive = asBool(req.query.includeInactive);
    const categories = await categoriesService.list({ includeInactive });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

categoriesRouter.get(
  "/:id/delete-summary",
  validate({ params: categoryIdParams }),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const summary = await categoriesService.deleteSummary(id);
      if (!summary) return res.status(404).json({ message: "Category not found" });
      res.json(summary);
    } catch (err) {
      next(err);
    }
  },
);

categoriesRouter.get("/:id", validate({ params: categoryIdParams }), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const category = await categoriesService.get(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (err) {
    next(err);
  }
});

categoriesRouter.post("/", validate({ body: categoryCreate }), async (req, res, next) => {
  try {
    const category = await categoriesService.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    if ((err as any)?.code === "P2002") {
      return res.status(409).json({ message: "Category name must be unique" });
    }
    next(err);
  }
});

categoriesRouter.put(
  "/:id",
  validate({ params: categoryIdParams, body: categoryUpdate }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const category = await categoriesService.update(id, req.body);
    res.json(category);
  } catch (err) {
    if ((err as any)?.code === "P2002") {
      return res.status(409).json({ message: "Category name must be unique" });
    }
    next(err);
  }
  },
);

categoriesRouter.delete(
  "/:id",
  validate({ params: categoryIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const category = await categoriesService.deleteDeep(id);
    res.json(category);
  } catch (err) {
    next(err);
  }
  },
);

categoriesRouter.post(
  "/:id/activate",
  validate({ params: categoryIdParams }),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const category = await categoriesService.activate(id);
      res.json(category);
    } catch (err) {
      next(err);
    }
  },
);
