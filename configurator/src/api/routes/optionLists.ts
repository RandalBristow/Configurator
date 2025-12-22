import { Router } from "express";
import { optionListsService } from "../../services";
import { validate } from "../middleware/validate";
import {
  selectListCreate,
  selectListIdParams,
  selectListUpdate,
} from "../validators/optionLists";

export const optionListsRouter = Router();

optionListsRouter.get("/", async (_req, res, next) => {
  try {
    const lists = await optionListsService.list();
    res.json(lists);
  } catch (err) {
    next(err);
  }
});

optionListsRouter.get(
  "/:id",
  validate({ params: selectListIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const list = await optionListsService.get(id);
    if (!list) {
      return res.status(404).json({ message: "Select list not found" });
    }
    res.json(list);
  } catch (err) {
    next(err);
  }
  },
);

optionListsRouter.post(
  "/",
  validate({ body: selectListCreate }),
  async (req, res, next) => {
  try {
    const list = await optionListsService.create(req.body);
    res.status(201).json(list);
  } catch (err) {
    next(err);
  }
  },
);

optionListsRouter.put(
  "/:id",
  validate({ params: selectListIdParams, body: selectListUpdate }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const list = await optionListsService.update(id, req.body);
    res.json(list);
  } catch (err) {
    next(err);
  }
  },
);

optionListsRouter.delete(
  "/:id",
  validate({ params: selectListIdParams }),
  async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const list = await optionListsService.delete(id);
    res.json(list);
  } catch (err) {
    next(err);
  }
  },
);
