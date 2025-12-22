import { Router } from "express";
import { selectListItemsService } from "../../services";
import { validate } from "../middleware/validate";
import {
  selectListItemCreate,
  selectListItemIdParams,
  selectListItemQuery,
  selectListItemUpdate,
} from "../validators/selectListItems";

export const selectListItemsRouter = Router();

const asBool = (val: unknown) => val === true || val === "true";

selectListItemsRouter.get(
  "/",
  validate({ query: selectListItemQuery }),
  async (req, res, next) => {
  try {
    const includeInactive = asBool(req.query.includeInactive);
    const selectListId = req.query.selectListId as string | undefined;
    const args: { selectListId?: string; includeInactive?: boolean } = {};
    if (selectListId) args.selectListId = selectListId;
    if (includeInactive !== undefined) args.includeInactive = includeInactive;
    const items = await selectListItemsService.list(args);
    res.json(items);
  } catch (err) {
    next(err);
  }
  },
);

selectListItemsRouter.get(
  "/:id",
  validate({ params: selectListItemIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const item = await selectListItemsService.get(id);
    if (!item) {
      return res.status(404).json({ message: "Option list item not found" });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
  },
);

selectListItemsRouter.post(
  "/",
  validate({ body: selectListItemCreate }),
  async (req, res, next) => {
  try {
    const item = await selectListItemsService.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
  },
);

selectListItemsRouter.put(
  "/:id",
  validate({ params: selectListItemIdParams, body: selectListItemUpdate }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const item = await selectListItemsService.update(id, req.body);
    res.json(item);
  } catch (err) {
    next(err);
  }
  },
);

selectListItemsRouter.delete(
  "/:id",
  validate({ params: selectListItemIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await selectListItemsService.delete(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
  },
);
