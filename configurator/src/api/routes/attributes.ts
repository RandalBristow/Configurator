import { Router } from "express";
import { attributesService } from "../../services";
import { validate } from "../middleware/validate";
import {
  attributeCreate,
  attributeIdParams,
  attributeQuery,
  attributeUpdate,
} from "../validators/attributes";

export const attributesRouter = Router();

const asBool = (val: unknown) => val === true || val === "true";

attributesRouter.get("/", validate({ query: attributeQuery }), async (req, res, next) => {
  try {
    const includeInactive = asBool(req.query.includeInactive);
    const optionId = req.query.optionId as string | undefined;
    const args: { optionId?: string; includeInactive?: boolean } = {};
    if (optionId) args.optionId = optionId;
    if (includeInactive !== undefined) args.includeInactive = includeInactive;
    const attributes = await attributesService.list(args);
    res.json(attributes);
  } catch (err) {
    next(err);
  }
});

attributesRouter.get(
  "/:id",
  validate({ params: attributeIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const attribute = await attributesService.get(id);
    if (!attribute) {
      return res.status(404).json({ message: "Attribute not found" });
    }
    res.json(attribute);
  } catch (err) {
    next(err);
  }
  },
);

attributesRouter.post("/", validate({ body: attributeCreate }), async (req, res, next) => {
  try {
    const attribute = await attributesService.create(req.body);
    res.status(201).json(attribute);
  } catch (err) {
    next(err);
  }
});

attributesRouter.put(
  "/:id",
  validate({ params: attributeIdParams, body: attributeUpdate }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const attribute = await attributesService.update(id, req.body);
    res.json(attribute);
  } catch (err) {
    next(err);
  }
  },
);

attributesRouter.delete(
  "/:id",
  validate({ params: attributeIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const attribute = await attributesService.deactivate(id);
    res.json(attribute);
  } catch (err) {
    next(err);
  }
  },
);

attributesRouter.post(
  "/:id/activate",
  validate({ params: attributeIdParams }),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const attribute = await attributesService.activate(id);
      res.json(attribute);
    } catch (err) {
      next(err);
    }
  },
);
