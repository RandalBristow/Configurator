import { Router } from "express";
import { selectListPropertiesService } from "../../services";
import { validate } from "../middleware/validate";
import {
  propertyCreate,
  propertyIdParams,
  propertyUpdate,
  selectListIdParams,
} from "../validators/selectListProperties";

export const selectListPropertiesRouter = Router();

selectListPropertiesRouter.get(
  "/:listId/properties",
  validate({ params: selectListIdParams }),
  async (req, res, next) => {
    try {
      const listId = req.params.listId as string;
      const props = await selectListPropertiesService.list(listId);
      res.json(props);
    } catch (err) {
      next(err);
    }
  },
);

selectListPropertiesRouter.post(
  "/:listId/properties",
  validate({ params: selectListIdParams, body: propertyCreate }),
  async (req, res, next) => {
    try {
      const listId = req.params.listId as string;
      const created = await selectListPropertiesService.create(listId, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

selectListPropertiesRouter.put(
  "/:listId/properties/:propertyId",
  validate({ params: propertyIdParams, body: propertyUpdate }),
  async (req, res, next) => {
    try {
      const listId = req.params.listId as string;
      const id = req.params.propertyId as string;
      const updated = await selectListPropertiesService.update(listId, id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

selectListPropertiesRouter.delete(
  "/:listId/properties/:propertyId",
  validate({ params: propertyIdParams }),
  async (req, res, next) => {
    try {
      const listId = req.params.listId as string;
      const id = req.params.propertyId as string;
      await selectListPropertiesService.delete(listId, id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);
