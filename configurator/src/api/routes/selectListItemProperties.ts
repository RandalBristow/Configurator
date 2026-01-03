import { Router } from "express";
import { selectListItemPropertiesService } from "../../services/selectListItemPropertiesService";
import { validate } from "../middleware/validate";
import { bulkSetBody, selectListIdParams } from "../validators/selectListItemProperties";

export const selectListItemPropertiesRouter = Router();

selectListItemPropertiesRouter.get(
  "/:selectListId",
  validate({ params: selectListIdParams }),
  async (req, res, next) => {
    try {
      const selectListId = req.params.selectListId as string;
      const rows = await selectListItemPropertiesService.list(selectListId);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
);

selectListItemPropertiesRouter.post(
  "/:selectListId/bulk",
  validate({ params: selectListIdParams, body: bulkSetBody }),
  async (req, res, next) => {
    try {
      const selectListId = req.params.selectListId as string;
      await selectListItemPropertiesService.bulkSet(selectListId, req.body.updates);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

