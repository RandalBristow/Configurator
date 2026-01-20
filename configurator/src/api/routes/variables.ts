import { Router } from "express";
import { variablesService } from "../../services";
import { validate } from "../middleware/validate";
import {
  variableCreate,
  variableIdParams,
  variableQuery,
  variableUpdate,
} from "../validators/variables";

export const variablesRouter = Router();

const asBool = (val: unknown) => val === true || val === "true";

variablesRouter.get("/", validate({ query: variableQuery }), async (req, res, next) => {
  try {
    const includeInactive = asBool(req.query.includeInactive);
    const optionId = req.query.optionId as string | undefined;
    const args: { optionId?: string; includeInactive?: boolean } = {};
    if (optionId) args.optionId = optionId;
    if (includeInactive !== undefined) args.includeInactive = includeInactive;
    const variables = await variablesService.list(args);
    res.json(variables);
  } catch (err) {
    next(err);
  }
});

variablesRouter.get(
  "/:id",
  validate({ params: variableIdParams }),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const variable = await variablesService.get(id);
      if (!variable) {
        return res.status(404).json({ message: "Variable not found" });
      }
      res.json(variable);
    } catch (err) {
      next(err);
    }
  },
);

variablesRouter.post("/", validate({ body: variableCreate }), async (req, res, next) => {
  try {
    const variable = await variablesService.create(req.body);
    res.status(201).json(variable);
  } catch (err) {
    next(err);
  }
});

variablesRouter.put(
  "/:id",
  validate({ params: variableIdParams, body: variableUpdate }),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const variable = await variablesService.update(id, req.body);
      res.json(variable);
    } catch (err) {
      next(err);
    }
  },
);

variablesRouter.delete(
  "/:id",
  validate({ params: variableIdParams }),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const variable = await variablesService.deactivate(id);
      res.json(variable);
    } catch (err) {
      next(err);
    }
  },
);

variablesRouter.post(
  "/:id/activate",
  validate({ params: variableIdParams }),
  async (req, res, next) => {
    try {
      const id = req.params.id as string;
      const variable = await variablesService.activate(id);
      res.json(variable);
    } catch (err) {
      next(err);
    }
  },
);
