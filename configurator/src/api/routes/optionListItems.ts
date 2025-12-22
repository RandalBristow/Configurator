import { Router } from "express";
import { optionListItemsService } from "../../services";
import { validate } from "../middleware/validate";
import {
  selectListItemCreate,
  selectListItemIdParams,
  selectListItemQuery,
  selectListItemUpdate,
} from "../validators/optionListItems";

export const optionListItemsRouter = Router();

const asBool = (val: unknown) => val === true || val === "true";

optionListItemsRouter.get(
  "/",
  validate({ query: selectListItemQuery }),
  async (req, res, next) => {
  try {
    const includeInactive = asBool(req.query.includeInactive);
    const selectListId = req.query.selectListId as string | undefined;
    const args: { selectListId?: string; includeInactive?: boolean } = {};
    if (selectListId) args.selectListId = selectListId;
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
  validate({ params: selectListItemIdParams }),
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
  validate({ body: selectListItemCreate }),
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
  validate({ params: selectListItemIdParams, body: selectListItemUpdate }),
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
  validate({ params: selectListItemIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await optionListItemsService.delete(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
  },
);
