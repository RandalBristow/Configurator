import { Router } from "express";
import { optionListItemsService } from "../../services";
import { validate } from "../middleware/validate";
import {
  optionListItemCreate,
  optionListItemIdParams,
  optionListItemQuery,
  optionListItemUpdate,
} from "../validators/optionListItems";

export const optionListItemsRouter = Router();

const asBool = (val: unknown) => val === true || val === "true";

optionListItemsRouter.get(
  "/",
  validate({ query: optionListItemQuery }),
  async (req, res, next) => {
  try {
    const includeInactive = asBool(req.query.includeInactive);
    const optionListId = req.query.optionListId as string | undefined;
    const args: { optionListId?: string; includeInactive?: boolean } = {};
    if (optionListId) args.optionListId = optionListId;
    if (includeInactive !== undefined) args.includeInactive = includeInactive;
    const items = await optionListItemsService.list(args);
    res.json(items);
  } catch (err) {
    next(err);
  }
  },
);

optionListItemsRouter.get(
  "/:id",
  validate({ params: optionListItemIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const item = await optionListItemsService.get(id);
    if (!item) {
      return res.status(404).json({ message: "Option list item not found" });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
  },
);

optionListItemsRouter.post(
  "/",
  validate({ body: optionListItemCreate }),
  async (req, res, next) => {
  try {
    const item = await optionListItemsService.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
  },
);

optionListItemsRouter.put(
  "/:id",
  validate({ params: optionListItemIdParams, body: optionListItemUpdate }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const item = await optionListItemsService.update(id, req.body);
    res.json(item);
  } catch (err) {
    next(err);
  }
  },
);

optionListItemsRouter.delete(
  "/:id",
  validate({ params: optionListItemIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const item = await optionListItemsService.deactivate(id);
    res.json(item);
  } catch (err) {
    next(err);
  }
  },
);
