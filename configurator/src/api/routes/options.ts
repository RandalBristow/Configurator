import { Router } from "express";
import { optionsService } from "../../services";
import { validate } from "../middleware/validate";
import {
  optionCreate,
  optionIdParams,
  optionQuery,
  optionUpdate,
} from "../validators/options";

export const optionsRouter = Router();

const asBool = (val: unknown) => val === true || val === "true";

optionsRouter.get("/", validate({ query: optionQuery }), async (req, res, next) => {
  try {
    const includeInactive = asBool(req.query.includeInactive);
    const optionType = req.query.optionType as string | undefined;
    const args: { optionType?: "simple" | "configured"; includeInactive?: boolean } = {};
    if (optionType === "simple" || optionType === "configured") args.optionType = optionType;
    if (includeInactive !== undefined) args.includeInactive = includeInactive;
    const options = await optionsService.list(args);
    res.json(options);
  } catch (err) {
    next(err);
  }
});

optionsRouter.get(
  "/:id",
  validate({ params: optionIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const option = await optionsService.get(id);
    if (!option) {
      return res.status(404).json({ message: "Option not found" });
    }
    res.json(option);
  } catch (err) {
    next(err);
  }
  },
);

optionsRouter.post("/", validate({ body: optionCreate }), async (req, res, next) => {
  try {
    const option = await optionsService.create(req.body);
    res.status(201).json(option);
  } catch (err) {
    next(err);
  }
});

optionsRouter.put(
  "/:id",
  validate({ params: optionIdParams, body: optionUpdate }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const option = await optionsService.update(id, req.body);
    res.json(option);
  } catch (err) {
    next(err);
  }
  },
);

optionsRouter.delete(
  "/:id",
  validate({ params: optionIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const option = await optionsService.deactivateDeep(id);
    res.json(option);
  } catch (err) {
    next(err);
  }
  },
);

optionsRouter.post(
  "/:id/activate",
  validate({ params: optionIdParams }),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const option = await optionsService.activate(id);
      res.json(option);
    } catch (err) {
      next(err);
    }
  },
);
